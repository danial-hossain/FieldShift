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
    field_ph = getattr(field_state, "ph", None) if field_state else None
    raw_field_size = getattr(field_state, "field_size_ha", None) if field_state else None
    field_size = (
        float(raw_field_size)
        if isinstance(raw_field_size, (int, float, np.number))
        and np.isfinite(float(raw_field_size))
        and float(raw_field_size) > 0
        else None
    )
    raw_irr_cap = getattr(field_state, "irrigation_capacity_mm", None) if field_state else None
    irr_cap = (
        float(raw_irr_cap)
        if isinstance(raw_irr_cap, (int, float, np.number))
        and np.isfinite(float(raw_irr_cap))
        and float(raw_irr_cap) >= 0
        else None
    )

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
            "The optimizer prioritizes modeled crop water requirements; this does not measure groundwater use or field water outcomes."
        )
    elif strategy_name == "soil_focused" or (s_w > p_w and s_w > w_w):
        strategy_summary = (
            f"Active Strategy: {strategy_title} ({round(s_w * 100)}% Soil Health, {round(p_w * 100)}% Profit, {round(w_w * 100)}% Water). "
            "The soil objective uses model proxies such as crop-family/legume categories; nitrogen and organic-matter changes are not measured."
        )
    else:
        strategy_summary = (
            f"Active Strategy: {strategy_title} ({round(p_w * 100)}% Profit, {round(w_w * 100)}% Water, {round(s_w * 100)}% Soil). "
            "The optimizer balances estimated crop economics, modeled water requirements, and soil proxies; outputs are not field-validated."
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

        season_types = ("Dry/Rabi", "Kharif-1/Pre-Monsoon", "Kharif-2/Wet")
        season_type = season_types[idx % len(season_types)]
        year_num = (idx // len(season_types)) + 1
        season_num = (idx % len(season_types)) + 1
        clean_season_label = f"Year {year_num} · Season {season_num} · {season_type}"

        dyn_crop = (dyn_matrix.get(period) or {}).get(crop_name) if dyn_matrix else None
        wb = dyn_crop.get("water_balance") if isinstance(dyn_crop, Mapping) else None
        required_metrics = (
            dyn_crop.get("dynamic_yield_t_ha"),
            dyn_crop.get("dynamic_gross_margin_bdt_ha"),
            dyn_crop.get("normalized_water_score"),
            dyn_crop.get("normalized_soil_score"),
            wb.get("crop_et_mm") if isinstance(wb, Mapping) else None,
            wb.get("effective_rainfall_mm") if isinstance(wb, Mapping) else None,
            wb.get("irrigation_supplied_mm") if isinstance(wb, Mapping) else None,
            wb.get("water_deficit_mm") if isinstance(wb, Mapping) else None,
        ) if isinstance(dyn_crop, Mapping) else ()
        if not isinstance(dyn_crop, Mapping) or any(
            value is None
            or not isinstance(value, (int, float, np.number))
            or not np.isfinite(float(value))
            for value in required_metrics
        ):
            period_reasons.append({
                "period": period,
                "season_label": clean_season_label,
                "crop": crop_name,
                "family": crop_family,
                "is_legume": is_legume,
                "why_this_crop": "Selected by the solver; season-level evaluation evidence is unavailable.",
                "why_selected": "The solver selected this crop, but no matching dynamic crop-season evidence was returned.",
                "feasibility_bullets": ["Season-level yield, water, soil, and objective evidence is unavailable."],
                "expected_performance": None,
                "alternatives_considered": [],
                "constraints_active": constraint_summary,
            })
            previous_crop_name = crop_name
            previous_family = crop_family
            continue

        if hasattr(season_env, "season_name"):
            season_temp = getattr(season_env, "mean_temperature_c", field_temp)
            season_rain = getattr(season_env, "rainfall_mm", None)
        elif isinstance(season_env, Mapping):
            season_temp = season_env.get("mean_temperature_c", field_temp)
            season_rain = season_env.get("rainfall_mm")
        else:
            season_temp = field_temp
            season_rain = None

        # Retrieve dynamic crop metrics
        yield_val = float(dyn_crop["dynamic_yield_t_ha"])
        margin = float(dyn_crop["dynamic_gross_margin_bdt_ha"])
        water_req = float(wb["crop_et_mm"])
        eff_rain = float(wb["effective_rainfall_mm"])
        irr_supplied = float(wb["irrigation_supplied_mm"])
        unmet_deficit = float(wb["water_deficit_mm"])
        norm_w = float(dyn_crop["normalized_water_score"])
        norm_s = float(dyn_crop["normalized_soil_score"])
        season_temp_text = (
            f"{season_temp:.1f}°C"
            if isinstance(season_temp, (int, float, np.number))
            and np.isfinite(float(season_temp))
            else "unavailable"
        )

        norm_p = max(0.0, min(1.0, (margin + 50000.0) / 450000.0))
        comp_score = round(p_w * norm_p + w_w * norm_w + s_w * norm_s, 3)

        # Build human-readable Why this crop
        min_t = float(crop_meta.get("min_temperature", 10.0))
        max_t = float(crop_meta.get("max_temperature", 35.0))
        min_ph = float(crop_meta.get("min_ph", 5.5))
        max_ph = float(crop_meta.get("max_ph", 7.5))

        why_this_crop = (
            f"{crop_name} is selected for this season; seasonal temperature is "
            f"{season_temp_text} "
            f"(preferred range [{min_t:g}, {max_t:g}]°C), and its {crop_family} botanical family "
            f"{'differs from saved previous family ' + previous_family if previous_family else 'is evaluated under within-horizon rotation constraints; previous field crop is unavailable'}."
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
                f"contributed to the active water-efficiency objective."
            )
        elif strategy_name in ("soil_focused", "soil_health"):
            if is_legume:
                why_selected = (
                    f"{crop_name} was preferred because the soil proxy classifies it as a legume and assigns it a modeled "
                    "soil-benefit contribution; this is not a measured nitrogen or soil-health outcome."
                )
            else:
                why_selected = (
                    f"{crop_name} was selected within the modeled rotation constraints; its soil effects are not measured."
                )
        else:
            why_selected = (
                f"{crop_name} was preferred because it produced the highest feasible objective value under the active "
                f"constraints and trade-offs of the Balanced Multi-Objective strategy."
            )

        # Feasibility bullet list
        ph_str = (
            f"Soil pH {field_ph:.1f} is within supported range [{min_ph:g}, {max_ph:g}]."
            if field_ph is not None
            and isinstance(field_ph, (int, float, np.number))
            and np.isfinite(float(field_ph))
            else f"Soil pH: Not available (supported range: [{min_ph:g}, {max_ph:g}])."
        )
        feasibility_bullets = [
            f"Seasonal temperature: {season_temp_text}; preferred range [{min_t:g}, {max_t:g}]°C.",
            (
                f"Rotation compatible: {crop_name} ({crop_family}) differs from saved previous family {previous_family}."
                if previous_family
                else "Previous field crop is unavailable; only within-horizon rotation constraints can be explained."
            ),
            f"Soil suitable: {ph_str}",
            f"Water feasible: Expected requirement {water_req:.0f} mm vs available {eff_rain + irr_supplied:.0f} mm (deficit {unmet_deficit:.0f} mm).",
        ]
        if is_legume:
            feasibility_bullets.append(f"Soil proxy assumption: {crop_name} is classified as a nitrogen-fixing {crop_family} legume; nitrogen outcomes are not measured.")
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

            if not isinstance(alt_dyn, Mapping) or not isinstance(alt_dyn.get("water_balance"), Mapping):
                alternatives.append({
                    "crop": alt_name,
                    "family": alt_fam,
                    "is_legume": alt_legume,
                    "expected_performance": None,
                    "feasible": None,
                    "reason_not_chosen": "Dynamic crop-season evidence is unavailable.",
                })
                continue
            alt_yield = alt_dyn.get("dynamic_yield_t_ha")
            alt_margin = alt_dyn.get("dynamic_gross_margin_bdt_ha")
            alt_wb = alt_dyn["water_balance"]
            alt_water = alt_wb.get("crop_et_mm")
            alt_norm_water = alt_dyn.get("normalized_water_score")
            alt_norm_soil = alt_dyn.get("normalized_soil_score")
            if any(
                value is None or not isinstance(value, (int, float, np.number))
                or not np.isfinite(float(value))
                for value in (alt_yield, alt_margin, alt_water, alt_norm_water, alt_norm_soil)
            ):
                alternatives.append({
                    "crop": alt_name,
                    "family": alt_fam,
                    "is_legume": alt_legume,
                    "expected_performance": None,
                    "feasible": None,
                    "reason_not_chosen": "Dynamic crop-season metrics are incomplete.",
                })
                continue
            alt_yield = float(alt_yield)
            alt_margin = float(alt_margin)
            alt_water = float(alt_water)
            alt_nw = float(alt_norm_water)
            alt_ns = float(alt_norm_soil)
            alt_feasible = bool(alt_dyn.get("is_feasible", True))

            alt_np = max(0.0, min(1.0, (alt_margin + 50000.0) / 450000.0))
            alt_score = round(p_w * alt_np + w_w * alt_nw + s_w * alt_ns, 3)

            # Determine specific model reason why alternative was not selected
            score_diff = comp_score - alt_score
            if not alt_feasible:
                if irr_cap is not None and alt_water > (eff_rain + irr_cap + 100):
                    reason = f"Not feasible: seasonal water requirement ({alt_water:.0f} mm) exceeded available water budget."
                elif (
                    season_temp is None
                    or not isinstance(season_temp, (int, float, np.number))
                    or not np.isfinite(float(season_temp))
                ):
                    reason = "Not feasible: seasonal temperature evidence is unavailable."
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
            f"{crop_name} was selected by the whole-rotation solver for {clean_season_label} "
            f"under the modeled {strategy_title} objective."
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
                + (
                    "The model classifies it as a legume for its nitrogen-contribution proxy; outcomes are unmeasured."
                    if is_legume
                    else "Soil effects are not measured by this comparison."
                )
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
                f"{crop_name} was selected by the whole-rotation solver. The displayed score ({comp_score:.3f}) is a "
                "model estimate and does not isolate the effect of this crop from other periods or constraints."
            ),
        })
        previous_crop_name = crop_name
        previous_family = crop_family

    # Identify multi-year rotation pattern
    crop_seq = [selected.get(p, "Unknown") for p in periods_list]
    pattern_summary = []
    for yr in range((len(periods_list) + 2) // 3):
        s1 = crop_seq[yr * 3] if (yr * 3) < len(crop_seq) else "—"
        s2 = crop_seq[yr * 3 + 1] if (yr * 3 + 1) < len(crop_seq) else "—"
        s3 = crop_seq[yr * 3 + 2] if (yr * 3 + 2) < len(crop_seq) else "—"
        pattern_summary.append(f"Year {yr + 1}: {s1} -> {s2} -> {s3}")

    is_repeating = (
        len(crop_seq) >= 6
        and crop_seq[:3] == crop_seq[3:6]
    )
    if is_repeating:
        pair_text = " -> ".join(crop_seq[:3])
        pattern_explanation = (
            f"The optimizer repeats the three-season sequence {pair_text} across the modeled years because "
            "it was selected under the modeled seasonal feasibility and objective "
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
        "profit_bdt_total": (
            profit * field_size
            if profit is not None and field_size is not None
            else None
        ),
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
        "soil_health_disclosure": {
            "metric_type": "proxy_estimate_not_measured",
            "nitrogen_assumption": "Legume classifications contribute a model proxy; field nitrogen and soil changes are not measured.",
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
