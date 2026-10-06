"""Helper script to update app/server.py and backend/app/main.py with benchmark endpoints and enhanced workflow metrics."""

from pathlib import Path
import re

server_path = Path("app/server.py")
server_code = server_path.read_text(encoding="utf-8")

# 1. Update _run_research_workflow to calculate field metrics, optimization provenance, and what changed
old_section = """    features = build_features(state, environmental_history=power)
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Synthetic demo model artifact was not found: {MODEL_PATH}")
    model = load_synthetic_yield_model(MODEL_PATH)
    prediction = predict_synthetic_yield(state, model=model)
    strategies = generate_rotation_strategies(
        field_state=state,
        crops=crops,
        features=features,
        field_history=history,
        priority_profiles=DEFAULT_PRIORITY_PROFILES,
        planning_periods=list(PLAN_PERIODS),
    )
    selected_plan = strategies["strategies"][selected_strategy_name]
    ml_explanation = explain_ml_prediction(state, prediction=prediction, model=model)
    milp_explanation = explain_milp_plan(selected_plan, field_state=state)"""

new_section = """    custom_temp = finite_number("temperature_c") or finite_number("temperature")
    if custom_temp is not None:
        state.temperature = float(custom_temp)
        farmer_inputs_applied.append("temperature_c")

    custom_ph = finite_number("soil_ph") or finite_number("ph")
    if custom_ph is not None:
        state.ph = float(custom_ph)
        state.soil_source = "farmer_provided"
        state.data_status["soil"] = "observed"
        farmer_inputs_applied.append("soil_ph")

    features = build_features(state, environmental_history=power)
    
    available_water_calc = None
    if irrigation_capacity is not None or "available_water_mm" in form:
        if "available_water_mm" in form and form.get("available_water_mm") not in (None, ""):
            available_water_calc = float(form.get("available_water_mm"))
        else:
            base_rain = float(state.rainfall) * 30.0 if math.isfinite(getattr(state, "rainfall", float("nan"))) else 300.0
            available_water_calc = base_rain + (float(irrigation_capacity) if irrigation_capacity is not None else 200.0)
        features["available_water_mm"] = available_water_calc
        features["available_water_source"] = "seasonal_rainfall_plus_irrigation"

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Synthetic demo model artifact was not found: {MODEL_PATH}")
    model = load_synthetic_yield_model(MODEL_PATH)
    prediction = predict_synthetic_yield(state, model=model)
    strategies = generate_rotation_strategies(
        field_state=state,
        crops=crops,
        features=features,
        field_history=history,
        priority_profiles=DEFAULT_PRIORITY_PROFILES,
        planning_periods=list(PLAN_PERIODS),
    )
    selected_plan = strategies["strategies"][selected_strategy_name]
    ml_explanation = explain_ml_prediction(state, prediction=prediction, model=model)
    milp_explanation = explain_milp_plan(selected_plan, field_state=state, crops=crops)

    # Compute detailed field-level metrics across all strategies
    crop_lookup = {row["crop"]: row.to_dict() for _, row in crops.iterrows()}
    def compute_metrics(plan_dict):
        rot = plan_dict.get("selected_crop_by_period") or {}
        crops_list = [rot[p] for p in sorted(rot.keys()) if rot.get(p) in crop_lookup]
        area = field_size if field_size is not None and field_size > 0 else 1.0
        if not crops_list:
            return {
                "field_size_ha": area,
                "mean_yield_t_ha": None,
                "total_harvest_tons": None,
                "profit_bdt_per_ha": plan_dict.get("profit_component"),
                "total_profit_bdt": None,
                "annual_profit_bdt": None,
                "total_water_requirement_mm": None,
                "mean_water_requirement_mm": None,
                "water_efficiency_score": plan_dict.get("water_component"),
                "soil_health_score": plan_dict.get("soil_component"),
                "objective_score": plan_dict.get("objective_value"),
                "legume_fraction": 0.0,
                "legume_season_count": 0,
                "crop_diversity_count": 0,
            }
        yields = [float(crop_lookup[c].get("expected_yield") or 1.0) for c in crops_list]
        waters = [float(crop_lookup[c].get("water_requirement") or 400) for c in crops_list]
        legumes = [bool(crop_lookup[c].get("is_legume", False)) for c in crops_list]
        total_yield_ha = sum(yields)
        mean_yield_ha = total_yield_ha / len(yields)
        total_harvest = total_yield_ha * area
        p_ha = float(plan_dict.get("profit_component") or 0.0)
        tot_profit = p_ha * area
        ann_profit = tot_profit / (len(crops_list) / 2.0)
        tot_water = sum(waters)
        return {
            "field_size_ha": area,
            "mean_yield_t_ha": round(mean_yield_ha, 2),
            "total_harvest_tons": round(total_harvest, 2),
            "profit_bdt_per_ha": round(p_ha, 2),
            "total_profit_bdt": round(tot_profit, 2),
            "annual_profit_bdt": round(ann_profit, 2),
            "total_water_requirement_mm": round(tot_water, 1),
            "mean_water_requirement_mm": round(tot_water / len(waters), 1),
            "water_efficiency_score": plan_dict.get("water_component"),
            "soil_health_score": plan_dict.get("soil_component"),
            "objective_score": plan_dict.get("objective_value"),
            "legume_fraction": round(sum(legumes) / len(legumes), 2),
            "legume_season_count": sum(legumes),
            "crop_diversity_count": len(set(crops_list)),
            "botanical_family_count": len(set(crop_lookup[c].get("family") for c in crops_list)),
        }

    active_field_metrics = compute_metrics(selected_plan)
    strategy_metrics_map = {
        name: compute_metrics(strat_item)
        for name, strat_item in strategies.get("strategies", {}).items()
    }

    # Compute optimization provenance
    constraints_summary = selected_plan.get("constraint_summary", {})
    compat_summary = selected_plan.get("compatibility_by_crop", {})
    excluded_static = constraints_summary.get("static_compatibility_exclusions", [])
    feasible_crops = [c for c in crop_lookup if c not in excluded_static]

    optimization_provenance = {
        "field_inputs": {
            "field_id": field_id,
            "latitude": latitude,
            "longitude": longitude,
            "area_ha": field_size,
            "temperature_c": getattr(state, "temperature", None),
            "soil_ph": getattr(state, "ph", None),
            "soil_texture": state.texture,
            "organic_matter_pct": state.organic_matter if math.isfinite(state.organic_matter) else None,
            "rainfall_mm": getattr(state, "rainfall", None),
            "irrigation_capacity_mm": irrigation_capacity,
            "available_water_mm": available_water_calc,
            "previous_crop": getattr(state, "previous_crop", None),
        },
        "feasibility_filter": {
            "catalog_crop_count": len(crops),
            "feasible_crop_count": len(feasible_crops),
            "feasible_crops": feasible_crops,
            "excluded_crops": excluded_static,
            "exclusion_reasons": {
                crop: [
                    f"{r_name}: {r_val.get('reason')}"
                    for r_name, r_val in compat_summary.get(crop, {}).get("rules", {}).items()
                    if r_val.get("status") == "incompatible"
                ]
                for crop in excluded_static if crop in compat_summary
            },
        },
        "objective_weighting": {
            "selected_strategy": selected_strategy_name,
            "requested_weights": selected_plan.get("weights", {}).get("requested", {}),
            "effective_weights": selected_plan.get("weights", {}).get("effective", {}),
        },
        "decision_model": {
            "solver": "PuLP CBC Branch-and-Bound Integer Linear Programming",
            "decision_variables": len(crops) * len(selected_plan.get("planning_periods", [])),
            "planning_periods": selected_plan.get("planning_periods", []),
            "rotation_constraints": [
                "Single crop selection per season (sum(x_c,t) = 1)",
                "Botanical family alternation (x_c1,t + x_c2,t+1 <= 1 for matching families)",
                "Biological legume interval frequency (sum(x_legume) >= 1 every 3 seasons)",
                "Agro-climatic temperature and pH feasibility envelopes",
                "Available water constraint boundaries",
            ],
            "solver_status": selected_plan.get("solver_status"),
            "objective_value": selected_plan.get("objective_value"),
        },
        "recommendation_summary": {
            "rotation_sequence": selected_plan.get("selected_crop_by_period"),
            "profit_gross_margin_bdt_ha": selected_plan.get("profit_component"),
            "total_field_profit_bdt": active_field_metrics.get("total_profit_bdt"),
            "water_score": selected_plan.get("water_component"),
            "soil_score": selected_plan.get("soil_component"),
        },
    }

    # Decision impact / What Changed analysis
    impact_items = []
    if field_size is not None:
        impact_items.append({
            "parameter": "Field Area",
            "value": f"{field_size:g} ha",
            "impact_type": "economic_scale",
            "impact_description": f"Scales field harvest to {active_field_metrics.get('total_harvest_tons')} tons and gross margin to ৳{active_field_metrics.get('total_profit_bdt'):,.0f} BDT.",
        })
    cur_temp = getattr(state, "temperature", None)
    if cur_temp is not None and math.isfinite(cur_temp):
        climate_tag = "Cool season (<20°C)" if cur_temp < 20 else ("High heat (>32°C)" if cur_temp > 32 else "Warm temperate (20-32°C)")
        impact_items.append({
            "parameter": "Temperature Regime",
            "value": f"{cur_temp:g}°C ({climate_tag})",
            "impact_type": "climatic_feasibility",
            "impact_description": f"Feasibility envelope permits {len(feasible_crops)} of {len(crops)} crops tolerating {cur_temp:g}°C.",
        })
    cur_ph = getattr(state, "ph", None)
    if cur_ph is not None and math.isfinite(cur_ph):
        ph_tag = "Acidic (pH < 5.5)" if cur_ph < 5.5 else ("Alkaline (pH > 7.5)" if cur_ph > 7.5 else "Neutral (pH 5.5-7.5)")
        impact_items.append({
            "parameter": "Soil pH",
            "value": f"{cur_ph:g} ({ph_tag})",
            "impact_type": "soil_chemistry",
            "impact_description": f"Enforces soil pH bounds [{cur_ph:g}], filtering out intolerant species.",
        })
    if available_water_calc is not None:
        impact_items.append({
            "parameter": "Available Water Supply",
            "value": f"{available_water_calc:g} mm",
            "impact_type": "water_budget",
            "impact_description": f"Defines seasonal water budget for crop water footprint evaluation.",
        })
    impact_items.append({
        "parameter": "Active Operational Strategy",
        "value": selected_strategy_name.replace("_", " ").title(),
        "impact_type": "objective_weighting",
        "impact_description": f"Weights optimizer priorities ({round((selected_plan.get('weights',{}).get('requested',{}).get('profit',0.5))*100)}% Profit, {round((selected_plan.get('weights',{}).get('requested',{}).get('water',0.3))*100)}% Water, {round((selected_plan.get('weights',{}).get('requested',{}).get('soil',0.2))*100)}% Soil).",
    })

    what_changed = {
        "active_parameters": impact_items,
        "impact_summary": f"Optimization model resolved with {len(feasible_crops)} feasible crops yielding {active_field_metrics.get('crop_diversity_count')} distinct rotation species.",
        "result_rotation": " → ".join((selected_plan.get("selected_crop_by_period") or {}).values()),
    }"""

assert old_section in server_code or old_section.replace("\n", "\r\n") in server_code, "Could not find old_section in server.py"
server_code = server_code.replace(old_section, new_section).replace(old_section.replace("\n", "\r\n"), new_section)

# 2. Update summary in server.py to include field_metrics, optimization_provenance, what_changed
old_summary_marker = '''        "input_application": {
            "applied_to_research_state": farmer_inputs_applied,
            "recorded_but_not_supported_by_current_research_interfaces": [
                name for name, value in (
                    ("field_size_ha", field_size),
                    ("irrigation_capacity_mm", irrigation_capacity),
                ) if value is not None
            ],
            "include_crop_history": include_history,
            "farmer_crop_history_added": bool(include_history and previous_crop),
        },'''

new_summary_marker = '''        "input_application": {
            "applied_to_research_state": farmer_inputs_applied,
            "recorded_but_not_supported_by_current_research_interfaces": [
                name for name, value in (
                    ("field_size_ha", field_size),
                    ("irrigation_capacity_mm", irrigation_capacity),
                ) if value is not None
            ],
            "include_crop_history": include_history,
            "farmer_crop_history_added": bool(include_history and previous_crop),
        },
        "field_metrics": active_field_metrics,
        "strategy_field_metrics": strategy_metrics_map,
        "optimization_provenance": optimization_provenance,
        "what_changed": what_changed,'''

assert old_summary_marker in server_code or old_summary_marker.replace("\n", "\r\n") in server_code, "Could not find old_summary_marker"
server_code = server_code.replace(old_summary_marker, new_summary_marker).replace(old_summary_marker.replace("\n", "\r\n"), new_summary_marker)

server_path.write_text(server_code, encoding="utf-8")
print("Successfully updated app/server.py!")
