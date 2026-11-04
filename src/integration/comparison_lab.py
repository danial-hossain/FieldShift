"""Three-Way Crop Rotation Decision Comparison Lab: MILP vs RL vs Rule-Based Baseline.

Evaluates:
1. Mixed-Integer Linear Programming (PuLP / CBC Branch-and-Bound Optimizer)
2. Simulation-Based Reinforcement Learning (Sequential Q-Value MDP Policy)
3. Transparent Agronomic Rule-Based Baseline (Deterministic Regional Crop Heuristics)

Evaluated under identical field coordinates, environmental history, field area,
planning horizon (6 seasons), and priority weighting.
"""

from __future__ import annotations

import csv
import io
import json
import time
from typing import Any, Mapping
import numpy as np
import pandas as pd

from src.data.crops import load_crop_knowledge
from src.optimizer.rule_based import run_rule_based_rotation
from src.rl.crop_rotation_rl import run_reinforcement_learning_policy


def run_three_way_comparison(
    field_state: Any,
    environmental_history: pd.DataFrame,
    crops: pd.DataFrame | None = None,
    features: Mapping[str, Any] | None = None,
    milp_plan: dict[str, Any] | None = None,
    priority: str = "balanced",
    weights: dict[str, float] | None = None,
    field_history: pd.DataFrame | None = None,
    existing_rotation: Mapping[str, Any] | None = None,
    existing_rotation_source: str | None = None,
    existing_rotation_year: int | None = None,
) -> dict[str, Any]:
    """Execute simultaneous evaluation of MILP, RL, and Rule-Based methods.

    Returns side-by-side metrics, trade-off explanations, and export data.
    """
    total_start_time = time.perf_counter()

    if crops is None:
        crops = load_crop_knowledge()

    crop_lookup = {row["crop"]: row.to_dict() for _, row in crops.iterrows()}
    raw_field_area = getattr(field_state, "field_size_ha", None)
    if raw_field_area is None:
        raw_field_area = getattr(field_state, "area_ha", None)
    try:
        field_area_ha = float(raw_field_area)
    except (TypeError, ValueError, OverflowError):
        field_area_ha = None
    if field_area_ha is not None and (
        not np.isfinite(field_area_ha) or field_area_ha <= 0
    ):
        field_area_ha = None

    canonical_periods = [
        "Year 1 (Rabi / Dry)",
        "Year 1 (Kharif-1 / Pre-Monsoon)",
        "Year 1 (Kharif-2 / Wet)",
        "Year 2 (Rabi / Dry)",
        "Year 2 (Kharif-1 / Pre-Monsoon)",
        "Year 2 (Kharif-2 / Wet)",
    ]
    planning_periods = ("Y1_S1", "Y1_S2", "Y1_S3", "Y2_S1", "Y2_S2", "Y2_S3")
    periods = canonical_periods

    # Normalize priority weights
    if weights is None:
        from src.optimizer.strategies import DEFAULT_PRIORITY_PROFILES
        priority_key = {
            "profit": "profit_focused",
            "water_efficiency": "water_focused",
            "soil_health": "soil_focused",
            "balanced": "balanced",
        }.get(priority, "balanced")
        weights = DEFAULT_PRIORITY_PROFILES[priority_key]

    # --- 1. MILP EVALUATION ---
    milp_start = time.perf_counter()
    if milp_plan is None:
        from src.optimizer.strategies import DEFAULT_PRIORITY_PROFILES, generate_rotation_strategies
        from src.preprocessing.features import build_features

        if features is None:
            features = build_features(field_state, environmental_history=environmental_history)

        strat_res = generate_rotation_strategies(
            field_state,
            crops,
            features,
            field_history,
            DEFAULT_PRIORITY_PROFILES,
            list(planning_periods),
            environmental_history=environmental_history,
        )
        milp_strategy_name = {
            "profit": "profit_focused",
            "water_efficiency": "water_focused",
            "soil_health": "soil_focused",
            "balanced": "balanced",
        }.get(priority, "balanced")
        milp_plan = strat_res["strategies"][milp_strategy_name]

    milp_elapsed_ms = round((time.perf_counter() - milp_start) * 1000.0, 2)

    # Extract MILP metrics
    raw_milp_rot = milp_plan.get("selected_crop_by_period") or {}
    milp_crops_list = list(raw_milp_rot.values()) if raw_milp_rot else []
    milp_rotation = {p: c for p, c in zip(canonical_periods, milp_crops_list)}
    
    # Calculate seasonal breakdown for MILP
    dyn_matrix = (
        milp_plan.get("dynamic_agronomic_matrix", {}).get("crop_season_matrix")
        or milp_plan.get("dynamic_crop_matrix")
        or {}
    )
    milp_legumes = []
    for raw_p, c in raw_milp_rot.items():
        if not c or c not in crop_lookup:
            continue
        c_info = crop_lookup[c]
        is_leg = bool(c_info.get("is_legume", False))
        milp_legumes.append(is_leg)

    def evaluate_rotation(rotation: Mapping[str, Any]) -> dict[str, Any] | None:
        if not rotation or any(period not in rotation for period in planning_periods):
            return None
        profit_values = []
        water_by_period = {}
        for period in planning_periods:
            crop_name = rotation[period]
            entry = dyn_matrix.get(period, {}).get(crop_name)
            if not entry:
                return None
            water_balance = entry.get("water_balance") or {}
            profit = entry.get("dynamic_gross_margin_bdt_ha")
            water = water_balance.get("irrigation_required_mm")
            if profit is None or water is None:
                return None
            profit_values.append(float(profit))
            water_by_period[period] = float(water)
        return {
            "profit_bdt_per_ha": sum(profit_values),
            "water_requirement_mm": sum(water_by_period.values()),
            "water_by_period_mm": water_by_period,
        }

    milp_evaluation = evaluate_rotation(raw_milp_rot)
    milp_total_profit_ha = milp_evaluation["profit_bdt_per_ha"] if milp_evaluation else None
    milp_field_profit = (
        milp_total_profit_ha * field_area_ha
        if milp_total_profit_ha is not None and field_area_ha is not None
        else None
    )
    milp_total_water = milp_evaluation["water_requirement_mm"] if milp_evaluation else None
    milp_legume_count = sum(milp_legumes)
    milp_feasible_seasons = len(milp_crops_list)
    milp_violations = 0
    milp_status = milp_plan.get("solver_status") or milp_plan.get("status", "optimal")
    if str(milp_status).lower() in {"infeasible", "unsatisfiable"}:
        milp_violations = 1
        milp_feasible_seasons = 0

    organic_matter = getattr(field_state, "organic_matter", None)
    initial_sh = None
    if organic_matter is not None and np.isfinite(float(organic_matter)):
        initial_sh = float(max(20.0, min(85.0, 30.0 + float(organic_matter) * 15.0)))
    milp_final_sh = round(max(20.0, min(85.0, initial_sh + (milp_legume_count * 5.0) - (len(milp_crops_list) - milp_legume_count) * 1.5)), 1) if initial_sh is not None else None
    milp_sh_delta = round(milp_final_sh - initial_sh, 1) if milp_final_sh is not None else None

    # --- 2. RL EVALUATION ---
    rl_start = time.perf_counter()
    rl_res = run_reinforcement_learning_policy(
        field_state=field_state,
        crops=crops,
        features=features or {},
        environmental_history=environmental_history,
        priority=priority,
        weights=weights,
        planning_periods=planning_periods,
    )
    rl_elapsed_ms = round((time.perf_counter() - rl_start) * 1000.0, 2)

    rl_traj = rl_res.get("trajectory_summary", {})
    raw_rl_rot = rl_res.get("rotation_by_period", {})
    rl_crops_list = list(raw_rl_rot.values()) if raw_rl_rot else []
    rl_rotation = {p: c for p, c in zip(canonical_periods, rl_crops_list)}
    rl_evaluation = evaluate_rotation(raw_rl_rot)
    rl_total_profit_ha = rl_evaluation["profit_bdt_per_ha"] if rl_evaluation else None
    rl_field_profit = (
        rl_total_profit_ha * field_area_ha
        if rl_total_profit_ha is not None and field_area_ha is not None
        else None
    )
    rl_total_water = rl_evaluation["water_requirement_mm"] if rl_evaluation else None
    rl_final_sh = float(rl_traj.get("final_soil_health")) if rl_traj.get("final_soil_health") is not None else None
    rl_sh_delta = float(rl_traj.get("soil_health_improvement")) if rl_traj.get("soil_health_improvement") is not None else None
    rl_legume_count = int(rl_traj.get("legume_season_count", 0))
    rl_cum_reward = float(rl_traj.get("total_cumulative_reward", 0.0))
    
    # Check RL constraint violations (e.g., family repetition)
    rl_violations = 0
    rl_violation_notes = []
    for i in range(1, len(rl_crops_list)):
        c_prev = rl_crops_list[i - 1]
        c_curr = rl_crops_list[i]
        f_prev = crop_lookup.get(c_prev, {}).get("family")
        f_curr = crop_lookup.get(c_curr, {}).get("family")
        if f_prev and f_curr and f_prev.lower() == f_curr.lower():
            rl_violations += 1
            rl_violation_notes.append(f"Seasons {canonical_periods[i-1]} and {canonical_periods[i]}: Sequential crops {c_prev} and {c_curr} share family {f_curr}.")

    # --- 3. RULE-BASED BASELINE EVALUATION ---
    rb_start = time.perf_counter()
    rb_res = run_rule_based_rotation(
        field_state=field_state,
        crops=crops,
        planning_periods=list(planning_periods),
        features=features,
        priority=priority,
    )
    rb_elapsed_ms = round((time.perf_counter() - rb_start) * 1000.0, 2)

    rb_metrics = rb_res.get("metrics", {})
    raw_rb_rot = rb_res.get("selected_crop_by_period", {})
    rb_crops_list = list(raw_rb_rot.values()) if raw_rb_rot else []
    rb_rotation = {p: c for p, c in zip(canonical_periods, rb_crops_list)}
    rb_evaluation = evaluate_rotation(raw_rb_rot)
    rb_total_profit_ha = rb_evaluation["profit_bdt_per_ha"] if rb_evaluation else None
    rb_field_profit = (
        rb_total_profit_ha * field_area_ha
        if rb_total_profit_ha is not None and field_area_ha is not None
        else None
    )
    rb_total_water = rb_evaluation["water_requirement_mm"] if rb_evaluation else None
    rb_final_sh = float(rb_metrics.get("final_soil_health")) if rb_metrics.get("final_soil_health") is not None else None
    rb_sh_delta = float(rb_metrics.get("soil_health_delta")) if rb_metrics.get("soil_health_delta") is not None else None
    rb_legume_count = int(rb_metrics.get("legume_season_count", 0))
    rb_violations = int(rb_metrics.get("constraint_violations", 0))

    def rounded(value: Any, digits: int = 2) -> float | None:
        if value is None:
            return None
        numeric = float(value)
        return round(numeric, digits) if np.isfinite(numeric) else None

    def annual_field_profit(value: float | None) -> float | None:
        return (
            rounded(value * field_area_ha / max(1.0, len(periods) / 3.0))
            if value is not None and field_area_ha is not None
            else None
        )

    if initial_sh is None:
        rl_final_sh = rl_sh_delta = rb_final_sh = rb_sh_delta = None

    from src.explainability.explanations import explain_milp_plan

    milp_decision_explanation = explain_milp_plan(
        milp_plan,
        field_state=field_state,
        crops=crops,
    )

    # --- SYNTHESIS & TRADE-OFF ANALYSIS ---
    methods = [
        {
            "id": "milp",
            "name": "MILP Optimization",
            "solver": "PuLP / CBC Branch-and-Bound",
            "type": "Exact Mathematical Programming",
            "rotation": milp_rotation,
            "rotation_sequence": " -> ".join(milp_crops_list),
            "profit_bdt_per_ha": rounded(milp_total_profit_ha),
            "total_field_profit_bdt": rounded(milp_field_profit),
            "annual_field_profit_bdt": annual_field_profit(milp_total_profit_ha),
            "water_requirement_mm": rounded(milp_total_water, 1),
            "water_by_period_mm": milp_evaluation["water_by_period_mm"] if milp_evaluation else None,
            "mean_water_mm": rounded(milp_total_water / max(1, len(milp_crops_list)), 1) if milp_total_water is not None else None,
            "initial_soil_health": rounded(initial_sh, 1),
            "final_soil_health": rounded(milp_final_sh, 1),
            "soil_health_delta": rounded(milp_sh_delta, 1),
            "constraint_violations": milp_violations,
            "violation_details": ["Infeasible solver status"] if milp_violations > 0 else [],
            "feasible_seasons": milp_feasible_seasons,
            "legume_season_count": milp_legume_count,
            "crop_diversity_count": len(set(milp_crops_list)),
            "botanical_family_count": len(set(crop_lookup[c].get("family") for c in milp_crops_list if c in crop_lookup)),
            "runtime_ms": milp_elapsed_ms,
            "solver_status": milp_status,
            "cumulative_reward": None,
            "optimality_guarantee": (
                "MILP solver reported an optimal solution for the modeled objective."
                if str(milp_status).casefold() == "optimal"
                else f"Optimality is not confirmed; solver status: {milp_status}."
            ),
            "provenance": "Deterministic branch-and-bound integer program.",
            "evaluation_basis": "common_dynamic_agronomic_matrix",
            "soil_metric_type": "proxy_estimate",
            "decision_explanation": milp_decision_explanation,
        },
        {
            "id": "rl",
            "name": "RL Simulation Policy",
            "solver": "Sequential Q-Value MDP Policy",
            "type": "Reinforcement Learning Heuristic",
            "rotation": rl_rotation,
            "rotation_sequence": " -> ".join(rl_crops_list),
            "profit_bdt_per_ha": rounded(rl_total_profit_ha),
            "total_field_profit_bdt": rounded(rl_field_profit),
            "annual_field_profit_bdt": annual_field_profit(rl_total_profit_ha),
            "water_requirement_mm": rounded(rl_total_water, 1),
            "water_by_period_mm": rl_evaluation["water_by_period_mm"] if rl_evaluation else None,
            "mean_water_mm": rounded(rl_total_water / max(1, len(rl_crops_list)), 1) if rl_total_water is not None else None,
            "initial_soil_health": rounded(initial_sh, 1),
            "final_soil_health": rounded(rl_final_sh, 1),
            "soil_health_delta": rounded(rl_sh_delta, 1),
            "constraint_violations": rl_violations,
            "violation_details": rl_violation_notes,
            "feasible_seasons": len(rl_crops_list) - rl_violations,
            "legume_season_count": rl_legume_count,
            "crop_diversity_count": len(set(rl_crops_list)),
            "botanical_family_count": len(set(crop_lookup[c].get("family") for c in rl_crops_list if c in crop_lookup)),
            "runtime_ms": rl_elapsed_ms,
            "cumulative_reward": round(rl_cum_reward, 2),
            "optimality_guarantee": "Local step-wise Bellman optimality; heuristic future discount.",
            "provenance": "Simulation-trained prototype policy; not field calibrated.",
            "evaluation_basis": "common_dynamic_agronomic_matrix",
            "soil_metric_type": "proxy_estimate",
        },
        {
            "id": "rule_based",
            "name": "Agronomic Rule Baseline",
            "solver": "Deterministic Heuristic Engine",
            "type": "Domain Rule Engine",
            "rotation": rb_rotation,
            "rotation_sequence": " -> ".join(rb_crops_list),
            "profit_bdt_per_ha": rounded(rb_total_profit_ha),
            "total_field_profit_bdt": rounded(rb_field_profit),
            "annual_field_profit_bdt": annual_field_profit(rb_total_profit_ha),
            "water_requirement_mm": rounded(rb_total_water, 1),
            "water_by_period_mm": rb_evaluation["water_by_period_mm"] if rb_evaluation else None,
            "mean_water_mm": rounded(rb_total_water / max(1, len(rb_crops_list)), 1) if rb_total_water is not None else None,
            "initial_soil_health": rounded(initial_sh, 1),
            "final_soil_health": rounded(rb_final_sh, 1),
            "soil_health_delta": rounded(rb_sh_delta, 1),
            "constraint_violations": rb_violations,
            "violation_details": rb_metrics.get("violation_notes", []),
            "feasible_seasons": rb_metrics.get("feasible_seasons", len(periods)),
            "legume_season_count": rb_legume_count,
            "crop_diversity_count": rb_metrics.get("crop_diversity_count", len(set(rb_crops_list))),
            "botanical_family_count": rb_metrics.get("botanical_family_count", len(set(crop_lookup[c].get("family") for c in rb_crops_list if c in crop_lookup))),
            "runtime_ms": rb_elapsed_ms,
            "cumulative_reward": None,
            "optimality_guarantee": "Heuristic compliance with standard extension practices; no mathematical optimality.",
            "provenance": "Regional agricultural extension crop calendar rules.",
            "evaluation_basis": "common_dynamic_agronomic_matrix",
            "soil_metric_type": "proxy_estimate",
        },
    ]

    saved_rotation_provenance = None
    if existing_rotation_source in {"saved_field_rotation", "saved_field_history"} and isinstance(existing_rotation, Mapping):
        rotation_pattern = [
            existing_rotation.get("rabi") or existing_rotation.get("S1"),
            existing_rotation.get("kharif1") or existing_rotation.get("S2"),
            existing_rotation.get("kharif2") or existing_rotation.get("S3"),
        ]
        crop_names = {str(name).casefold(): str(name) for name in crop_lookup}

        def resolve_saved_crop(name: Any) -> str | None:
            if not isinstance(name, str) or not name.strip():
                return None
            value = name.strip()
            match = crop_names.get(value.casefold())
            if match:
                return match
            lowered = value.casefold()
            if "boro" in lowered:
                return crop_names.get("boro rice") or crop_names.get("rice")
            if "rice" in lowered or "ধান" in lowered:
                return crop_names.get("rice")
            return None

        pattern = [resolve_saved_crop(name) for name in rotation_pattern]
        completeness = sum(crop is not None for crop in pattern) / 3.0
        saved_rotation_provenance = {
            "source": existing_rotation_source,
            "completeness": completeness,
            "historical_period": existing_rotation_year or "not recorded",
            "status": "evaluated" if completeness == 1.0 else "incomplete_unavailable",
            "projection": (
                "saved three-season pattern repeated over the modeled horizon"
                if completeness == 1.0
                else "not projected because the saved pattern is incomplete or contains unrecognized crops"
            ),
        }
        if all(pattern):
            baseline_rotation = {
                period: pattern[index % 3]
                for index, period in enumerate(planning_periods)
            }
            baseline_eval = evaluate_rotation(baseline_rotation)
            if baseline_eval:
                baseline_crops = list(baseline_rotation.values())
                baseline_legumes = sum(
                    bool(crop_lookup[crop].get("is_legume", False))
                    for crop in baseline_crops
                )
                baseline_soil_delta = (
                    round(baseline_legumes * 5.0 - (len(baseline_crops) - baseline_legumes) * 1.5, 1)
                    if initial_sh is not None
                    else None
                )
                baseline_final_soil = (
                    round(max(20.0, min(85.0, initial_sh + baseline_soil_delta)), 1)
                    if initial_sh is not None and baseline_soil_delta is not None
                    else None
                )
                methods.append({
                    "id": "existing_rotation",
                    "name": (
                        "Saved Farmer Rotation History"
                        if existing_rotation_source == "saved_field_history"
                        else "Saved Farmer Rotation Pattern"
                    ),
                    "solver": "Saved field profile evaluated against common seasonal matrix",
                    "type": "Farmer-provided baseline scenario",
                    "rotation": {
                        label: baseline_rotation[period]
                        for period, label in zip(planning_periods, canonical_periods)
                    },
                    "rotation_sequence": " -> ".join(baseline_crops),
                    "profit_bdt_per_ha": rounded(baseline_eval["profit_bdt_per_ha"]),
                    "total_field_profit_bdt": (
                        rounded(baseline_eval["profit_bdt_per_ha"] * field_area_ha)
                        if field_area_ha is not None
                        else None
                    ),
                    "annual_field_profit_bdt": annual_field_profit(baseline_eval["profit_bdt_per_ha"]),
                    "water_requirement_mm": rounded(baseline_eval["water_requirement_mm"], 1),
                    "water_by_period_mm": baseline_eval["water_by_period_mm"],
                    "mean_water_mm": rounded(baseline_eval["water_requirement_mm"] / len(baseline_crops), 1),
                    "initial_soil_health": rounded(initial_sh, 1),
                    "final_soil_health": baseline_final_soil,
                    "soil_health_delta": baseline_soil_delta,
                    "constraint_violations": None,
                    "violation_details": ["Complete constraint validation is not available for saved baseline rotations."],
                    "feasible_seasons": sum(
                        bool(dyn_matrix.get(period, {}).get(crop, {}).get("is_feasible"))
                        for period, crop in baseline_rotation.items()
                    ),
                    "legume_season_count": baseline_legumes,
                    "crop_diversity_count": len(set(baseline_crops)),
                    "botanical_family_count": len({
                        crop_lookup[crop].get("family")
                        for crop in baseline_crops
                        if crop_lookup[crop].get("family")
                    }),
                    "runtime_ms": None,
                    "cumulative_reward": None,
                    "optimality_guarantee": "Not optimized; saved rotation pattern evaluated as provided.",
                    "provenance": (
                        f"Saved farmer history from {existing_rotation_year}; season pattern repeated across the modeled horizon."
                        if existing_rotation_source == "saved_field_history"
                        else "Saved field profile; historical period is not recorded; pattern repeated across the modeled horizon."
                    ),
                    "evaluation_basis": "common_dynamic_agronomic_matrix",
                    "soil_metric_type": "proxy_estimate",
                    "baseline_source": existing_rotation_source,
                    "baseline_completeness": 1.0,
                })
            else:
                saved_rotation_provenance["status"] = "evaluation_unavailable"
                saved_rotation_provenance["projection"] = (
                    "complete saved pattern could not be evaluated because common crop-season metrics are unavailable"
                )
    elif existing_rotation_source in {"saved_field_rotation", "saved_field_history"}:
        saved_rotation_provenance = {
            "source": existing_rotation_source,
            "completeness": 0.0,
            "historical_period": "not recorded",
            "status": "invalid_unavailable",
            "projection": "saved rotation data is not a recognized three-season mapping",
        }

    def modeled_winner(metric: str, output_key: str, *, highest: bool) -> dict[str, Any]:
        values = [method.get(metric) for method in methods]
        comparable = (
            all(value is not None and np.isfinite(float(value)) for value in values)
            and all(method.get("evaluation_basis") == "common_dynamic_agronomic_matrix" for method in methods)
            and all(len(method.get("rotation") or {}) == len(canonical_periods) for method in methods)
        )
        if not comparable:
            return {
                "method": None,
                output_key: None,
                "explanation": "No ranking: one or more strategy results or common evaluation metrics are unavailable.",
                "comparison_status": "incomplete_or_incomparable",
            }
        winner = (max if highest else min)(methods, key=lambda method: method[metric])
        return {
            "method": winner["name"],
            output_key: winner[metric],
            "explanation": "Modeled estimate evaluated with the same crop-season inputs; not a measured farm outcome.",
            "comparison_status": "modeled_estimate_only",
        }

    fastest_method = min(
        (method for method in methods if method.get("runtime_ms") is not None),
        key=lambda method: method["runtime_ms"],
    )

    trade_off_analysis = {
        "highest_profit": modeled_winner("profit_bdt_per_ha", "value_bdt_ha", highest=True),
        "most_water_efficient": modeled_winner("water_requirement_mm", "value_mm", highest=False),
        "best_soil_stewardship": {
            "method": None,
            "value_delta": None,
            "explanation": "Soil-health outputs use different model proxies and cannot be ranked as measured stewardship outcomes.",
            "comparison_status": "incomparable_proxy_metrics",
        },
        "fastest_computation": {
            "method": fastest_method["name"],
            "value_ms": fastest_method["runtime_ms"],
            "explanation": "Observed runtime for this execution only; not a crop-performance measure.",
        },
        "honest_evaluation_summary": (
            "Profit and irrigation comparisons are model estimates recomputed from one crop-season matrix; bundled crop economics are illustrative. "
            "Soil-health values are proxies and are not ranked across methods. RL remains a simulation policy and is not field-validated. "
            "No result establishes field performance or replaces local agricultural review."
        ),
    }

    # Generate CSV export string
    csv_buffer = io.StringIO()
    writer = csv.writer(csv_buffer)
    writer.writerow(["Evaluation Dimension", *(method["name"] for method in methods)])
    for label, key in (
        ("Rotation Sequence", "rotation_sequence"),
        ("Gross Margin (BDT/ha, six-season total)", "profit_bdt_per_ha"),
        ("Total Field Gross Margin (BDT)", "total_field_profit_bdt"),
        ("Annualized Field Margin (BDT/year)", "annual_field_profit_bdt"),
        ("Total Modeled Irrigation Requirement (mm)", "water_requirement_mm"),
        ("Mean Seasonal Irrigation Requirement (mm)", "mean_water_mm"),
        ("Legume Seasons (out of 6)", "legume_season_count"),
        ("Crop Diversity Count", "crop_diversity_count"),
        ("Constraint Violations", "constraint_violations"),
        ("Feasible Seasons", "feasible_seasons"),
        ("Solver / Policy Runtime (ms)", "runtime_ms"),
        ("Scientific Boundary", "optimality_guarantee"),
    ):
        writer.writerow([label, *(method.get(key) for method in methods)])
    writer.writerow([
        "Soil Metric Type",
        *(method.get("soil_metric_type", "not_computed") for method in methods),
    ])
    writer.writerow([
        "Soil Health Proxy (Initial -> Final)",
        *(
            f"{method['initial_soil_health']} -> {method['final_soil_health']} ({method['soil_health_delta']:+})"
            if method.get("initial_soil_health") is not None
            and method.get("final_soil_health") is not None
            and method.get("soil_health_delta") is not None
            else "Unavailable"
            for method in methods
        ),
    ])
    writer.writerow([
        "Cumulative RL Reward",
        *(method.get("cumulative_reward") for method in methods),
    ])

    return {
        "status": "ok",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "field_id": getattr(field_state, "field_id", "demo"),
        "field_area_ha": field_area_ha,
        "priority": priority,
        "weights": weights,
        "methods": methods,
        "evaluation_basis": "common two-year, six-season dynamic crop-season matrix",
        "soil_health_disclosure": {
            "metric_type": "proxy_estimate_not_measured",
            "milp_and_saved_rotation_assumption": (
                "Initial proxy score is clamped from 30 + 15 times organic-matter percent; "
                "the heuristic adds 5 per legume season and subtracts 1.5 per non-legume season."
            ),
            "rl_and_rule_based": (
                "Strategy-specific simulated/proxy outputs are not equivalent to measured soil changes "
                "and are not ranked against each other."
            ),
        },
        "baseline_provenance": (
            saved_rotation_provenance
            if saved_rotation_provenance is not None
            else (
                {
                    "source": "unavailable",
                    "completeness": 0.0,
                    "historical_period": "not recorded",
                    "status": "unavailable",
                    "projection": "no reliable saved farmer rotation was supplied",
                }
            )
        ),
        "trade_off_analysis": trade_off_analysis,
        "seasons": canonical_periods,
        "export_csv": csv_buffer.getvalue(),
        "total_lab_runtime_ms": round((time.perf_counter() - total_start_time) * 1000.0, 2),
    }
