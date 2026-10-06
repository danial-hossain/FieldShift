"""MILP solution validation and diagnostic reporting.

Provides mathematical audits, formula verifications, constraint verification,
and consistency checks for all strategy solutions.
"""

from __future__ import annotations

import math
from typing import Any, Mapping, Sequence
import pandas as pd

from src.data.crops import load_crop_knowledge
from src.optimizer.milp import _objective_data


def audit_strategy_solution(
    strategy_name: str,
    strategy_plan: Mapping[str, Any],
    *,
    field_state: Any = None,
    crops: pd.DataFrame | None = None,
) -> dict[str, Any]:
    """Perform independent mathematical audit on a single strategy plan."""
    crop_df = load_crop_knowledge() if crops is None else crops
    crop_lookup = {row["crop"]: row.to_dict() for _, row in crop_df.iterrows()}
    obj_data = _objective_data(crop_df)
    dyn_matrix = (strategy_plan.get("dynamic_agronomic_matrix") or {}).get("crop_season_matrix")

    rot_dict = strategy_plan.get("selected_crop_by_period") or {}
    periods = sorted(rot_dict.keys())
    rotation = [rot_dict[p] for p in periods]

    weights_req = strategy_plan.get("weights", {}).get("requested", {}) or strategy_plan.get("requested_weights", {})
    weights_eff = strategy_plan.get("weights", {}).get("effective", {}) or strategy_plan.get("effective_weights", weights_req)
    pw = weights_eff.get("profit", 0.0)
    ww = weights_eff.get("water", 0.0)
    sw = weights_eff.get("soil", 0.0)

    area_ha = getattr(field_state, "field_size_ha", None) or getattr(field_state, "area_ha", 1.0)
    if area_ha is None or area_ha <= 0:
        area_ha = 1.0

    field_temp = getattr(field_state, "temperature", None)
    field_ph = getattr(field_state, "ph", None)

    # 1. Profit Breakdown
    profit_crop_breakdown = []
    p_raw_sum = 0.0
    p_norm_sum = 0.0
    for period in periods:
        crop = rot_dict[period]
        cm = crop_lookup.get(crop, {})
        dyn_entry = (dyn_matrix.get(period) or {}).get(crop) if dyn_matrix else None
        if dyn_entry:
            y = float(dyn_entry.get("dynamic_yield_t_ha", 0.0))
            margin = float(dyn_entry.get("dynamic_gross_margin_bdt_ha", 0.0))
            p_norm = float(dyn_entry.get("normalized_profit_score", 0.0))
            mp = float(cm.get("market_price") or 0.0)
            pc = float(cm.get("production_cost") or 0.0)
        else:
            y = float(cm.get("expected_yield") or 0.0)
            mp = float(cm.get("market_price") or 0.0)
            pc = float(cm.get("production_cost") or 0.0)
            margin = y * mp - pc
            p_norm = obj_data["profit_normalized"].get(crop) or 0.0
        profit_crop_breakdown.append({
            "period": period,
            "crop": crop,
            "yield_t_ha": round(y, 2),
            "market_price_bdt_t": mp,
            "production_cost_bdt_ha": pc,
            "gross_margin_bdt_ha": round(margin, 2),
            "normalized_profit": round(p_norm, 4),
        })
        p_raw_sum += margin
        p_norm_sum += p_norm

    total_field_profit = p_raw_sum * area_ha
    annual_profit = total_field_profit / (len(rotation) / 2.0) if rotation else 0.0

    profit_breakdown = {
        "per_crop": profit_crop_breakdown,
        "raw_sum_bdt_ha_6_seasons": round(p_raw_sum, 2),
        "normalized_sum_6_seasons": round(p_norm_sum, 4),
        "field_area_ha": area_ha,
        "total_field_profit_bdt": round(total_field_profit, 2),
        "annual_field_profit_bdt": round(annual_profit, 2),
    }

    # 2. Water Breakdown
    water_crop_breakdown = []
    w_raw_sum = 0.0
    w_norm_sum = 0.0
    for period in periods:
        crop = rot_dict[period]
        cm = crop_lookup.get(crop, {})
        dyn_entry = (dyn_matrix.get(period) or {}).get(crop) if dyn_matrix else None
        if dyn_entry:
            w_req = float(dyn_entry.get("crop_et_mm", 0.0))
            w_norm = float(dyn_entry.get("normalized_water_score", 0.0))
        else:
            w_req = float(cm.get("water_requirement") or 0.0)
            w_norm = obj_data["water_normalized"].get(crop) or 0.0
        water_crop_breakdown.append({
            "period": period,
            "crop": crop,
            "water_requirement_mm": round(w_req, 1),
            "normalized_efficiency_score": round(w_norm, 4),
        })
        w_raw_sum += w_req
        w_norm_sum += w_norm

    water_breakdown = {
        "per_crop": water_crop_breakdown,
        "total_water_demand_mm_6_seasons": round(w_raw_sum, 1),
        "mean_water_demand_mm_season": round(w_raw_sum / len(rotation), 1) if rotation else 0.0,
        "normalized_efficiency_sum_6_seasons": round(w_norm_sum, 4),
        "scale": "[0.0, 6.0]",
    }

    # 3. Soil Breakdown
    soil_crop_breakdown = []
    s_raw_sum = 0.0
    s_norm_sum = 0.0
    for period in periods:
        crop = rot_dict[period]
        cm = crop_lookup.get(crop, {})
        dyn_entry = (dyn_matrix.get(period) or {}).get(crop) if dyn_matrix else None
        if dyn_entry:
            s_raw = obj_data["soil_raw"].get(crop) or 0.0
            s_norm = float(dyn_entry.get("normalized_soil_score", 0.0))
        else:
            s_raw = obj_data["soil_raw"].get(crop) or 0.0
            s_norm = obj_data["soil_normalized"].get(crop) or 0.0
        soil_crop_breakdown.append({
            "period": period,
            "crop": crop,
            "is_legume": bool(cm.get("is_legume", False)),
            "nutrient_effect": cm.get("nutrient_effect"),
            "soil_impact": cm.get("soil_impact"),
            "raw_soil_score": round(s_raw, 4),
            "normalized_soil_score": round(s_norm, 4),
        })
        s_raw_sum += s_raw
        s_norm_sum += s_norm

    soil_breakdown = {
        "per_crop": soil_crop_breakdown,
        "raw_sum_6_seasons": round(s_raw_sum, 4),
        "normalized_health_sum_6_seasons": round(s_norm_sum, 4),
        "scale": "[0.0, 6.0]",
    }

    # 4. Composite Breakdown
    composite_recalculated = pw * p_norm_sum + ww * w_norm_sum + sw * s_norm_sum
    composite_breakdown = {
        "profit_weight": pw,
        "water_weight": ww,
        "soil_weight": sw,
        "profit_contribution": round(pw * p_norm_sum, 4),
        "water_contribution": round(ww * w_norm_sum, 4),
        "soil_contribution": round(sw * s_norm_sum, 4),
        "recalculated_composite_score": round(composite_recalculated, 4),
        "solver_objective_value": round(float(strategy_plan.get("objective_value") or 0.0), 4),
    }

    # 5. Formula Checks
    ret_profit = strategy_plan.get("profit_component")
    ret_water = strategy_plan.get("water_component")
    ret_soil = strategy_plan.get("soil_component")
    ret_obj = strategy_plan.get("objective_value")

    profit_ok = ret_profit is not None and abs(p_raw_sum - float(ret_profit)) < 1e-3
    water_ok = ret_water is not None and abs(w_norm_sum - float(ret_water)) < 1e-4
    soil_ok = ret_soil is not None and abs(s_norm_sum - float(ret_soil)) < 1e-4
    composite_ok = ret_obj is not None and abs(composite_recalculated - float(ret_obj)) < 1e-4

    formula_checks = {
        "profit_formula_check": "PASS" if profit_ok else "FAIL",
        "water_formula_check": "PASS" if water_ok else "FAIL",
        "soil_formula_check": "PASS" if soil_ok else "FAIL",
        "composite_formula_check": "PASS" if composite_ok else "FAIL",
    }

    # 6. Constraint Checks
    # Single crop per period
    one_crop_ok = len(rotation) == len(periods) and len(rotation) == 6
    # Family transition: no adjacent matching family
    families = [crop_lookup.get(c, {}).get("family") for c in rotation]
    family_ok = all(f1 != f2 for f1, f2 in zip(families, families[1:]))
    # Legume interval: >=1 legume in every rolling 3-period window
    legumes = [bool(crop_lookup.get(c, {}).get("is_legume", False)) for c in rotation]
    legume_windows = [sum(legumes[i : i + 3]) >= 1 for i in range(len(legumes) - 2)]
    legume_ok = all(legume_windows)
    # Agroclimatic bounds
    temp_checks = []
    ph_checks = []
    for c in rotation:
        cm = crop_lookup.get(c, {})
        if field_temp is not None and math.isfinite(field_temp):
            temp_checks.append(cm.get("min_temperature", 0) <= field_temp <= cm.get("max_temperature", 50))
        if field_ph is not None and math.isfinite(field_ph):
            ph_checks.append(cm.get("min_ph", 0) <= field_ph <= cm.get("max_ph", 14))
    agro_ok = all(temp_checks) and all(ph_checks)

    constraint_checks = {
        "single_crop_per_period_check": "PASS" if one_crop_ok else "FAIL",
        "family_alternation_check": "PASS" if family_ok else "FAIL",
        "legume_interval_check": "PASS" if legume_ok else "FAIL",
        "agroclimatic_envelope_check": "PASS" if agro_ok else "FAIL",
    }

    # 7. Consistency Checks
    solver_ok = strategy_plan.get("solver_status") == "Optimal"
    weights_sum_ok = abs(pw + ww + sw - 1.0) < 1e-4

    explanation = strategy_plan.get("decision_explanation")
    explanation_aligned = False
    if explanation:
        exp_periods = explanation.get("period_reasons", [])
        exp_crops = [p.get("crop") for p in exp_periods]
        exp_weights = explanation.get("effective_weights", {})
        crops_match = exp_crops == rotation
        weights_match = all(abs(exp_weights.get(k, 0) - weights_eff.get(k, 0)) < 1e-4 for k in ("profit", "water", "soil"))
        explanation_aligned = crops_match and weights_match

    consistency_checks = {
        "solver_status_optimal": "PASS" if solver_ok else "FAIL",
        "weights_sum_to_one": "PASS" if weights_sum_ok else "FAIL",
        "decision_explanation_aligned": "PASS" if explanation_aligned else "FAIL",
    }

    return {
        "strategy": strategy_name,
        "weights": {
            "requested": weights_req,
            "effective": weights_eff,
        },
        "rotation": rotation,
        "field_area_ha": area_ha,
        "profit_breakdown": profit_breakdown,
        "water_breakdown": water_breakdown,
        "soil_breakdown": soil_breakdown,
        "composite_breakdown": composite_breakdown,
        "formula_checks": formula_checks,
        "constraint_checks": constraint_checks,
        "consistency_checks": consistency_checks,
        "all_checks_passed": (
            all(v == "PASS" for v in formula_checks.values())
            and all(v == "PASS" for v in constraint_checks.values())
            and all(v == "PASS" for v in consistency_checks.values())
        ),
    }


def audit_all_strategies(
    strategies_result: Mapping[str, Any],
    *,
    field_state: Any = None,
    crops: pd.DataFrame | None = None,
) -> dict[str, Any]:
    """Perform mathematical and consistency audits across all strategies."""
    strats = strategies_result.get("strategies", {})
    audits = {
        name: audit_strategy_solution(name, plan, field_state=field_state, crops=crops)
        for name, plan in strats.items()
    }
    overall_pass = all(audit["all_checks_passed"] for audit in audits.values())
    return {
        "status": "PASS" if overall_pass else "FAIL",
        "audits": audits,
        "overall_pass": overall_pass,
    }
