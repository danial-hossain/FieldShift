"""Deterministic explanations grounded in current model inputs and optimizer outputs.

The module deliberately distinguishes model-attributed explanations from causal
claims. It is suitable for research/demo reporting and does not imply real-world
agricultural causality or field validation.
"""

from __future__ import annotations

import math
from typing import Any, Mapping, Sequence

import numpy as np
import pandas as pd

from src.experiments.synthetic_ml_demo import (
    estimate_prediction_uncertainty,
    load_synthetic_yield_model,
    predict_synthetic_yield,
)


def explain_ml_prediction(
    field_state: Any,
    *,
    prediction: Mapping[str, Any] | None = None,
    model: Mapping[str, Any] | None = None,
    extra_features: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Explain a synthetic ML prediction using standard feature attribution on the actual model feature vector."""
    if model is None:
        model = load_synthetic_yield_model()
    if prediction is None:
        prediction = predict_synthetic_yield(field_state, extra_features=extra_features, model=model)

    feature_names = list(model.get("feature_names", []))
    feature_values = prediction.get("features_used", {})
    coefficients = np.asarray(model.get("coefficients", []), dtype=float)
    means = np.asarray(model.get("normalization_mean", [0.0] * len(feature_names)), dtype=float)
    stds = np.asarray(model.get("normalization_std", [1.0] * len(feature_names)), dtype=float)

    all_attributions = []
    for index, name in enumerate(feature_names):
        val = feature_values.get(name)
        if val is None or not (isinstance(val, (int, float, np.number)) and np.isfinite(float(val))):
            all_attributions.append({
                "feature": name,
                "value": "Unavailable",
                "standardized_value": 0.0,
                "coefficient": float(coefficients[index]),
                "attributed_contribution": 0.0,
                "direction": "neutral",
                "is_available": False,
            })
            continue

        raw = float(val)
        standard = (raw - means[index]) / stds[index] if stds[index] else 0.0
        contribution = float(coefficients[index] * standard)
        all_attributions.append(
            {
                "feature": name,
                "value": raw,
                "standardized_value": standard,
                "coefficient": float(coefficients[index]),
                "attributed_contribution": contribution,
                "direction": "positive" if contribution >= 0 else "negative",
                "is_available": True,
            }
        )

    # Sort all attributions by absolute contribution descending
    all_attributions.sort(key=lambda item: abs(item["attributed_contribution"]) if item["is_available"] else -1, reverse=True)
    top_contributors = [item for item in all_attributions if item["is_available"]][:5]

    positives = [item for item in all_attributions if item["is_available"] and item["attributed_contribution"] >= 0]
    negatives = [item for item in all_attributions if item["is_available"] and item["attributed_contribution"] < 0]

    positives.sort(key=lambda item: item["attributed_contribution"], reverse=True)
    negatives.sort(key=lambda item: item["attributed_contribution"])

    top_positive_driver = positives[0] if positives else None
    top_negative_driver = negatives[0] if negatives else None

    pred_val = prediction["synthetic_demo_prediction"]["predicted_value"]
    uncertainty = estimate_prediction_uncertainty(field_state, prediction=pred_val, model=model)

    pos_desc = f"{top_positive_driver['feature'].replace('_', ' ')} (+{top_positive_driver['attributed_contribution']:.3f} t/ha)" if top_positive_driver else "none"
    neg_desc = f"{top_negative_driver['feature'].replace('_', ' ')} ({top_negative_driver['attributed_contribution']:.3f} t/ha)" if top_negative_driver else "none"

    model_interpretation = (
        f"The predicted yield is most strongly boosted by {pos_desc} and most strongly reduced by {neg_desc}."
    )

    return {
        "model_name": model.get("model_name", "unknown"),
        "explanation_type": "model_attribution",
        "method": "Standardized Linear Attribution (SHAP-Equivalent)",
        "causal_claim": "This is a model-attributed explanation, not a causal agronomic explanation.",
        "prediction_t_ha": pred_val,
        "uncertainty_t_ha": uncertainty["value_t_ha"],
        "all_attributions": all_attributions,
        "top_contributors": top_contributors,
        "top_positive_driver": top_positive_driver,
        "top_negative_driver": top_negative_driver,
        "model_interpretation": model_interpretation,
        "positive_influence": positives,
        "negative_influence": negatives,
        "provenance": {
            "data_boundary": "synthetic_demo_only",
            "not_field_validated": True,
            "policy_label": "simulation-trained RL policy; not field validated",
        },
    }


def explain_milp_plan(
    plan: Mapping[str, Any],
    *,
    field_state: Any | None = None,
    crops: Sequence[Mapping[str, Any]] | pd.DataFrame | None = None,
) -> dict[str, Any]:
    """Explain the MILP rotation using human-readable agronomic rationales and calculated metrics."""
    from src.data.crops import load_crop_knowledge

    selected = plan.get("selected_crop_by_period") or {}
    objective = plan.get("objective_value")
    profit = plan.get("profit_component")
    water = plan.get("water_component")
    soil = plan.get("soil_component")
    normalized_components = plan.get("normalized_components") or {}
    weights = plan.get("weights", {}).get("requested", {}) or {"profit": 0.5, "water": 0.3, "soil": 0.2}
    effective_weights = plan.get("weights", {}).get("effective", {}) or weights
    constraint_summary = plan.get("constraint_summary") or {}
    dyn_matrix = (plan.get("dynamic_agronomic_matrix") or {}).get("crop_season_matrix")
    seasonal_envs = plan.get("seasonal_environments") or {}
    strategy_name = plan.get("strategy_name", "balanced")

    crop_df = load_crop_knowledge() if crops is None else (crops if isinstance(crops, pd.DataFrame) else pd.DataFrame(crops))
    crop_lookup = {row["crop"]: row.to_dict() for _, row in crop_df.iterrows()}

    field_temp = getattr(field_state, "temperature", None) if field_state else None
    field_ph = getattr(field_state, "ph", 6.5) if field_state else 6.5
    field_texture = getattr(field_state, "texture", "loam") if field_state else "loam"
    field_size = getattr(field_state, "field_size_ha", 1.0) if field_state else 1.0
    irr_cap = getattr(field_state, "irrigation_capacity_mm", 400.0) if field_state else 400.0

    p_w = float(effective_weights.get("profit", 0.5))
    w_w = float(effective_weights.get("water", 0.3))
    s_w = float(effective_weights.get("soil", 0.2))

    # Plain language strategy descriptions
    strategy_titles = {
        "profit_focused": "Profit Focused",
        "water_focused": "Water Efficiency",
        "soil_focused": "Soil Health & Regeneration",
        "balanced": "Balanced Multi-Objective",
    }
    # Plain language strategy descriptions
    strategy_titles = {
        "profit_focused": "Profit Focused",
        "water_focused": "Water Efficiency",
        "soil_focused": "Soil Health & Regeneration",
        "balanced": "Balanced Multi-Objective",
    }
    strategy_title = strategy_titles.get(strategy_name, strategy_name.replace("_", " ").title())

    if strategy_name == "profit_focused" or (p_w > w_w and p_w > s_w):
        strategy_summary = (
            f"Active Strategy: {strategy_title} ({round(p_w * 100)}% Profit, {round(w_w * 100)}% Water, {round(s_w * 100)}% Soil). "
            "The optimizer places primary emphasis on seasonal gross profit margin (BDT/ha) while strictly enforcing rotational break rules."
        )
    elif strategy_name == "water_focused" or (w_w > p_w and w_w > s_w):
        strategy_summary = (
            f"Active Strategy: {strategy_title} ({round(w_w * 100)}% Water, {round(p_w * 100)}% Profit, {round(s_w * 100)}% Soil). "
            "The optimizer prioritizes water conservation and drought resilience by selecting crops with minimal water footprints."
        )
    elif strategy_name == "soil_focused" or (s_w > p_w and s_w > w_w):
        strategy_summary = (
            f"Active Strategy: {strategy_title} ({round(s_w * 100)}% Soil Health, {round(p_w * 100)}% Profit, {round(w_w * 100)}% Water). "
            "The optimizer prioritizes long-term soil regeneration, biological nitrogen fixation, and organic matter carryover."
        )
    else:
        strategy_summary = (
            f"Active Strategy: {strategy_title} ({round(p_w * 100)}% Profit, {round(w_w * 100)}% Water, {round(s_w * 100)}% Soil). "
            "The optimizer balances commercial returns, water use, and soil biological health."
        )

    # Build per-period explanations
    period_reasons = []
    periods_list = sorted(selected.keys())
    previous_crop_name = getattr(field_state, "previous_crop", None) if field_state else None
    previous_family = None
    if previous_crop_name and previous_crop_name in crop_lookup:
        previous_family = crop_lookup[previous_crop_name].get("family")

    for idx, period in enumerate(periods_list):
        crop_name = selected[period]
        crop_meta = crop_lookup.get(crop_name, {})
        crop_family = str(crop_meta.get("family", "Unknown")).strip()
        is_legume = bool(crop_meta.get("is_legume", False))
        season_env = seasonal_envs.get(period) if isinstance(seasonal_envs, Mapping) else None

        season_type = "Dry/Rabi" if (idx % 2 == 0) else "Wet/Kharif"
        year_num = (idx // 2) + 1
        season_num = (idx % 2) + 1
        clean_season_label = f"Year {year_num} · Season {season_num} · {season_type}"

        if hasattr(season_env, "season_name"):
            season_temp = getattr(season_env, "mean_temperature_c", field_temp or 26.0)
            season_rain = getattr(season_env, "rainfall_mm", 0.0)
        elif isinstance(season_env, Mapping):
            season_temp = season_env.get("mean_temperature_c", field_temp or 26.0)
            season_rain = season_env.get("rainfall_mm", 0.0)
        else:
            season_temp = field_temp or 26.0
            season_rain = 50.0

        # Retrieve dynamic crop metrics
        dyn_crop = (dyn_matrix.get(period) or {}).get(crop_name) if dyn_matrix else None
        if dyn_crop:
            yield_val = float(dyn_crop.get("dynamic_yield_t_ha", crop_meta.get("expected_yield", 1.0)))
            margin = float(dyn_crop.get("dynamic_gross_margin_bdt_ha", 0.0))
            wb = dyn_crop.get("water_balance", {})
            water_req = float(wb.get("crop_et_mm", crop_meta.get("water_requirement", 400.0)))
            eff_rain = float(wb.get("effective_rainfall_mm", 0.0))
            irr_supplied = float(wb.get("irrigation_supplied_mm", min(water_req, irr_cap)))
            unmet_deficit = float(wb.get("water_deficit_mm", 0.0))
            norm_w = float(dyn_crop.get("normalized_water_score", 0.5))
            norm_s = float(dyn_crop.get("normalized_soil_score", 0.5))
        else:
            yield_val = float(crop_meta.get("expected_yield") or 1.0)
            price_val = float(crop_meta.get("market_price") or 50000.0)
            cost_val = float(crop_meta.get("production_cost") or 30000.0)
            margin = yield_val * price_val - cost_val
            water_req = float(crop_meta.get("water_requirement") or 400.0)
            eff_rain = float(season_rain) * 0.8
            irr_supplied = min(max(0.0, water_req - eff_rain), irr_cap)
            unmet_deficit = max(0.0, water_req - eff_rain - irr_supplied)
            norm_w = max(0.0, min(1.0, (1200.0 - water_req) / 950.0))
            norm_s = 0.8 if is_legume else 0.4

        norm_p = max(0.0, min(1.0, (margin + 50000.0) / 450000.0))
        comp_score = round(p_w * norm_p + w_w * norm_w + s_w * norm_s, 3)

        # Build human-readable Why this crop
        min_t = float(crop_meta.get("min_temperature", 10.0))
        max_t = float(crop_meta.get("max_temperature", 35.0))
        min_ph = float(crop_meta.get("min_ph", 5.5))
        max_ph = float(crop_meta.get("max_ph", 7.5))

        why_this_crop = (
            f"{crop_name} is well suited to this season because the seasonal temperature ({season_temp:.1f}°C) "
            f"is within its preferred range [{min_t:g}, {max_t:g}]°C and its {crop_family} botanical family "
            f"fits the crop rotation sequence after {previous_crop_name or 'the prior crop'}."
        )

        # Strategy-specific Why selected
        if strategy_name == "profit_focused":
            why_selected = (
                f"{crop_name} was preferred because its expected gross margin (৳{margin:,.0f}/ha) "
                "had the strongest influence under the active Profit Focused strategy."
            )
        elif strategy_name in ("water_focused", "water_efficiency"):
            why_selected = (
                f"{crop_name} was preferred because its low water footprint ({water_req:.0f} mm ET) "
                f"provided the best protection against drought and aquifer stress under the Water Efficiency strategy."
            )
        elif strategy_name in ("soil_focused", "soil_health"):
            if is_legume:
                why_selected = (
                    f"{crop_name} was preferred because its biological nitrogen fixation and organic residue contribution "
                    "provided the greatest soil-regeneration benefit under the Soil Health strategy."
                )
            else:
                why_selected = (
                    f"{crop_name} was preferred because its deep root structure and high organic biomass contribution "
                    "rebuild depleted soil structure while alternating botanical families."
                )
        else:
            why_selected = (
                f"{crop_name} was preferred because it produced the highest feasible objective value under the active "
                f"constraints and trade-offs of the Balanced Multi-Objective strategy."
            )

        # Feasibility bullet list
        ph_str = f"Soil pH {field_ph:.1f} is within supported range [{min_ph:g}, {max_ph:g}]." if (field_ph is not None and not (isinstance(field_ph, float) and math.isnan(field_ph))) else f"Soil pH: Not available (supported range: [{min_ph:g}, {max_ph:g}])."
        feasibility_bullets = [
            f"Temperature suitable: {season_temp:.1f}°C is within {crop_name}'s preferred range [{min_t:g}, {max_t:g}]°C.",
            f"Rotation compatible: {crop_name} ({crop_family}) alternates cleanly with previous {previous_family or 'crop'}.",
            f"Soil suitable: {ph_str}",
            f"Water feasible: Expected requirement {water_req:.0f} mm vs available {eff_rain + irr_supplied:.0f} mm (deficit {unmet_deficit:.0f} mm).",
        ]
        if is_legume:
            feasibility_bullets.append(f"Soil benefit: {crop_name} is a nitrogen-fixing {crop_family} legume that boosts residual nitrogen.")
        elif crop_family in ("Pedaliaceae", "Brassicaceae"):
            feasibility_bullets.append(f"Soil benefit: {crop_name} ({crop_family}) provides taproot soil aeration and organic biomass residue (non-legume).")

        # Evaluate real competitor alternatives for this specific season
        alternatives = []
        for alt_name, alt_meta in crop_lookup.items():
            if alt_name == crop_name:
                continue
            alt_fam = str(alt_meta.get("family", "Other")).strip()
            alt_legume = bool(alt_meta.get("is_legume", False))
            alt_dyn = (dyn_matrix.get(period) or {}).get(alt_name) if dyn_matrix else None

            if alt_dyn:
                alt_yield = float(alt_dyn.get("dynamic_yield_t_ha", alt_meta.get("expected_yield", 1.0)))
                alt_margin = float(alt_dyn.get("dynamic_gross_margin_bdt_ha", 0.0))
                alt_wb = alt_dyn.get("water_balance", {})
                alt_water = float(alt_wb.get("crop_et_mm", alt_meta.get("water_requirement", 400.0)))
                alt_nw = float(alt_dyn.get("normalized_water_score", 0.5))
                alt_ns = float(alt_dyn.get("normalized_soil_score", 0.5))
                alt_feasible = bool(alt_dyn.get("is_feasible", True))
            else:
                alt_yield = float(alt_meta.get("expected_yield") or 1.0)
                alt_price = float(alt_meta.get("market_price") or 50000.0)
                alt_cost = float(alt_meta.get("production_cost") or 30000.0)
                alt_margin = alt_yield * alt_price - alt_cost
                alt_water = float(alt_meta.get("water_requirement") or 400.0)
                alt_nw = max(0.0, min(1.0, (1200.0 - alt_water) / 950.0))
                alt_ns = 0.8 if alt_legume else 0.4
                alt_min_t = float(alt_meta.get("min_temperature", 0))
                alt_max_t = float(alt_meta.get("max_temperature", 50))
                alt_feasible = (season_temp >= alt_min_t) and (season_temp <= alt_max_t)

            alt_np = max(0.0, min(1.0, (alt_margin + 50000.0) / 450000.0))
            alt_score = round(p_w * alt_np + w_w * alt_nw + s_w * alt_ns, 3)

            # Determine specific model reason why alternative was not selected
            score_diff = comp_score - alt_score
            if not alt_feasible:
                if alt_water > (eff_rain + irr_cap + 100):
                    reason = f"Not feasible: seasonal water requirement ({alt_water:.0f} mm) exceeded available water budget."
                else:
                    reason = f"Not feasible: seasonal temperature ({season_temp:.1f}°C) is outside preferred range."
            elif previous_family and alt_fam == previous_family:
                reason = f"Incompatible: consecutive {alt_fam} family violates disease-break rotation constraint."
            elif alt_margin < margin and p_w >= 0.40:
                reason = f"Feasible, but lower net margin (৳{alt_margin:,.0f}/ha vs ৳{margin:,.0f}/ha) under Profit priority."
            elif alt_water > water_req and w_w >= 0.40:
                reason = f"Feasible, but higher water requirement ({alt_water:.0f} mm vs {water_req:.0f} mm) under Water priority."
            elif not alt_legume and is_legume and s_w >= 0.40:
                reason = "Feasible, but lacks nitrogen-fixing benefit under active Soil Health priority."
            elif abs(score_diff) < 0.001:
                reason = f"Feasible, tied composite score ({alt_score:.3f} vs {comp_score:.3f}); {crop_name} selected for rotation balance."
            elif score_diff > 0:
                reason = f"Feasible, but achieved lower composite score ({alt_score:.3f} vs {comp_score:.3f}) under active weights."
            else:
                reason = f"Feasible (score {alt_score:.3f}), but {crop_name} selected to satisfy multi-season rotation constraints."

            alternatives.append({
                "crop": alt_name,
                "family": alt_fam,
                "is_legume": alt_legume,
                "water_requirement_mm": round(alt_water, 1),
                "expected_gross_margin_bdt": round(alt_margin, 2),
                "expected_yield_t_ha": round(alt_yield, 2),
                "composite_score": alt_score,
                "feasible": alt_feasible,
                "reason_not_chosen": reason,
            })

        # Sort alternatives by composite score descending
        alternatives.sort(key=lambda a: (a.get("feasible", True), a.get("composite_score", 0.0)), reverse=True)

        key_takeaway = (
            f"{crop_name} delivers the best multi-objective trade-off for {clean_season_label} "
            f"under the current {strategy_title} strategy."
        )

        period_reasons.append({
            "period": period,
            "season_label": clean_season_label,
            "crop": crop_name,
            "family": crop_family,
            "is_legume": is_legume,
            "duration_days": crop_meta.get("duration_days"),
            "why_this_crop": why_this_crop,
            "why_selected": why_selected,
            "feasibility_bullets": feasibility_bullets,
            "why_feasible": "; ".join(feasibility_bullets[:3]),
            "expected_performance": {
                "expected_gross_margin_bdt_ha": round(margin, 2),
                "expected_yield_t_ha": round(yield_val, 2),
                "water_requirement_mm": round(water_req, 1),
                "effective_rainfall_mm": round(eff_rain, 1),
                "irrigation_supplied_mm": round(irr_supplied, 1),
                "unmet_deficit_mm": round(unmet_deficit, 1),
                "composite_score": comp_score,
                "profit_contribution": round(norm_p, 3),
                "water_contribution": round(norm_w, 3),
                "soil_contribution": round(norm_s, 3),
            },
            "expected_yield_t_ha": round(yield_val, 2),
            "expected_gross_margin_bdt_ha": round(margin, 2),
            "water_requirement_mm": round(water_req, 1),
            "effective_rainfall_mm": round(eff_rain, 1),
            "irrigation_demand_mm": round(irr_supplied, 1),
            "unmet_deficit_mm": round(unmet_deficit, 1),
            "rotation_benefit": (
                f"{crop_name} ({crop_family}) follows {previous_family or 'prior crop'} to maintain botanical diversity. "
                + (f"As a Fabaceae legume, it satisfies the nitrogen-fixation interval requirement." if is_legume else "It provides taproot aeration and organic biomass residue.")
            ),
            "objective_benefit": {
                "profit_contribution_bdt": round(margin, 2),
                "water_requirement_mm": round(water_req, 1),
                "is_nitrogen_fixer": is_legume,
                "composite_score": comp_score,
            },
            "constraints_active": [
                "Botanical family alternation (no consecutive same botanical family)",
                "Legume interval constraint (≥1 nitrogen-fixing Fabaceae crop every 3 consecutive seasons)",
                "Seasonal temperature and soil pH tolerance boundaries",
                "Irrigation capacity and water budget constraint",
            ],
            "alternatives_considered": alternatives[:4],
            "key_takeaway": key_takeaway,
            "why_beat_alternatives": (
                f"{crop_name} achieved the highest weighted score ({comp_score:.3f} / 1.00) among feasible candidates "
                f"while satisfying family succession and legume frequency requirements."
            ),
        })
        previous_crop_name = crop_name
        previous_family = crop_family

    # Identify multi-year rotation pattern
    crop_seq = [selected.get(p, "Unknown") for p in periods_list]
    pattern_summary = []
    for yr in range(len(periods_list) // 2):
        s1 = crop_seq[yr * 2] if (yr * 2) < len(crop_seq) else "—"
        s2 = crop_seq[yr * 2 + 1] if (yr * 2 + 1) < len(crop_seq) else "—"
        pattern_summary.append(f"Year {yr + 1}: {s1}  ->  {s2}")

    is_repeating = len(set(pattern_summary)) == 1 and len(pattern_summary) > 1
    if is_repeating:
        pair_text = f"{crop_seq[0]} (Dry/Rabi) and {crop_seq[1]} (Wet/Kharif)"
        pattern_explanation = (
            f"The optimizer consistently alternates {pair_text} across all 3 years because "
            "this complementary pair maintained stable seasonal feasibility and provided the highest aggregate "
            f"weighted return under the active {strategy_title} strategy."
        )
    else:
        pattern_explanation = (
            f"The rotation sequence evolves across years ({' -> '.join(crop_seq)}) to adapt to changing "
            "soil nitrogen balances and family succession constraints."
        )

    components = {
        "profit": profit,
        "water": water,
        "soil": soil,
        "profit_bdt_total": profit * (field_size or 1.0) if profit is not None else None,
        "normalized": normalized_components,
    }

    return {
        "explanation_type": "human_readable_milp_decision",
        "causal_claim": "MILP explanations reflect optimizer objective trade-offs and mathematical constraints, not field-trial causal validation.",
        "strategy_title": strategy_title,
        "strategy_summary": strategy_summary,
        "rotation_pattern": pattern_summary,
        "pattern_explanation": pattern_explanation,
        "objective_value": objective,
        "objective_components": components,
        "effective_weights": effective_weights,
        "selected_rotation": selected,
        "period_reasons": period_reasons,
        "dominant_constraints": constraint_summary,
        "technical_details": {
            "solver": "PuLP CBC Branch-and-Bound Optimizer",
            "solver_status": plan.get("solver_status", "Optimal"),
            "objective_value": objective,
            "effective_weights": effective_weights,
            "normalized_components": normalized_components,
            "active_constraints": [
                "Botanical family non-repetition in consecutive seasons",
                "Legume requirement: ≥1 nitrogen-fixing Fabaceae crop every 3 consecutive seasons",
                "Agro-climatic seasonal thermal and soil pH boundaries",
                "Irrigation capacity and water budget constraint",
            ],
        },
        "feasibility_summary": {
            "total_candidate_crops": len(crop_df),
            "feasible_candidate_crops": len(crop_df) - len(constraint_summary.get("static_compatibility_exclusions", [])),
            "excluded_crops": constraint_summary.get("static_compatibility_exclusions", []),
        },
    }


def explain_rl_action(
    state: Any,
    action: Any,
    *,
    action_labels: Mapping[int, str] | None = None,
    policy_label: str = "simulation-trained RL policy; not field validated",
) -> dict[str, Any]:
    """Explain a synthetic RL action in state-policy terms without claiming real-world efficacy."""
    if action_labels is None:
        action_labels = {0: "no_intervention", 1: "light_irrigation", 2: "moderate_irrigation", 3: "conservative_adaptation"}
    action_id = int(action)
    action_name = action_labels.get(action_id, str(action_id))

    if hasattr(state, "to_dict"):
        state_payload = state.to_dict()
    elif isinstance(state, Mapping):
        state_payload = dict(state)
    else:
        state_payload = {"state": state}

    water_stress = float(state_payload.get("water_stress", 0.0))
    heat_stress = float(state_payload.get("heat_stress", 0.0))
    soil_moisture = float(state_payload.get("soil_moisture", 0.0))

    if action_name == "light_irrigation" and water_stress > 0.5:
        reason = "The synthetic policy chose irrigation because the simulated water stress indicator was elevated."
    elif action_name == "moderate_irrigation" and (water_stress > 0.5 or soil_moisture < 0.2):
        reason = "The synthetic policy chose a stronger irrigation response to a low-moisture, high-stress simulated state."
    elif action_name == "conservative_adaptation" and heat_stress > 0.2:
        reason = "The synthetic policy chose a conservative adaptation to limit simulated heat stress, but it is not a field-validated farming decision."
    else:
        reason = "The synthetic policy selected a low-intervention action because the simulated state did not warrant a stronger intervention."

    return {
        "explanation_type": "synthetic_policy_action",
        "selected_action": action_name,
        "action_id": action_id,
        "state_summary": state_payload,
        "reason": reason,
        "policy_label": policy_label,
        "provenance": {
            "evidence_class": "synthetic",
            "simulation_only": True,
            "not_real_world_effectiveness": True,
            "not_field_validated": True,
        },
    }


def explain_pipeline_result(
    *,
    field_state: Any,
    prediction: Mapping[str, Any] | None = None,
    plan: Mapping[str, Any] | None = None,
    action: Any | None = None,
    action_labels: Mapping[int, str] | None = None,
) -> dict[str, Any]:
    """Aggregate XAI output for the current synthetic pipeline."""
    ml = explain_ml_prediction(field_state, prediction=prediction)
    milp = explain_milp_plan(plan or {}, field_state=field_state) if plan else None
    rl = explain_rl_action(field_state, action, action_labels=action_labels) if action is not None else None
    return {
        "ml_explanation": ml,
        "milp_explanation": milp,
        "rl_explanation": rl,
        "pipeline_boundary": "synthetic_demo_and_simulation_only",
    }


__all__ = [
    "explain_ml_prediction",
    "explain_milp_plan",
    "explain_rl_action",
    "explain_pipeline_result",
]
