"""Deterministic hypothetical benchmarks for FieldShift's existing MILP API."""

import argparse
import csv
import json
import platform
import sys
from datetime import datetime, timezone
from math import isfinite
from pathlib import Path
from typing import Any, Dict, List, Mapping, Optional, Sequence

import pandas as pd
import pulp

from src.data.crops import load_crop_knowledge
from src.data.field_history import FIELD_HISTORY_COLUMNS
from src.optimizer.milp import optimize_rotation
from src.scenarios.stress_test import StressScenarioConfig, run_stress_tests
from src.state.field_state import FieldState

PROJECT_ROOT = Path(__file__).resolve().parents[2]
PLANNING_PERIODS = ("Y1_S1", "Y1_S2", "Y2_S1", "Y2_S2", "Y3_S1", "Y3_S2")
OBJECTIVE_WEIGHTS = {"profit_weight": 0.5, "water_weight": 0.3, "soil_weight": 0.2}
BASELINE_FEATURES = {
    "available_water_mm": 1500.0,
    "available_water_source": "hypothetical_fixture",
    "provenance": {
        "available_water_mm": {
            "source": "hypothetical_fixture",
            "data_status": "synthetic",
        }
    },
}
SCENARIO_CONFIG = StressScenarioConfig(
    drought_soil_moisture_delta=-0.08,
    heat_temperature_delta=5.0,
    low_water_fraction=0.6,
)
SCENARIO_NAMES = ("normal", "drought", "heat", "low_water")
OBJECTIVE_WEIGHT_VALUES = (0.0, 0.25, 0.5, 0.75, 1.0)
AVAILABLE_WATER_VALUES_MM = (0.0, 300.0, 600.0, 900.0, 1200.0, 1500.0, 1800.0, 2400.0)
SCENARIO_SENSITIVITY_VALUES = {
    "heat_temperature_delta": (2.0, 5.0, 8.0),
    "drought_soil_moisture_delta": (-0.04, -0.08, -0.12),
    "low_water_fraction": (0.8, 0.6, 0.4),
}
DATASET_AUDIT = (
    (
        "data/nasa_power/nasa_power_2025.csv",
        "NASA POWER-attributed; not independently authenticated",
        "remote_observed",
        "temperature: °C; rainfall: mm/day; humidity: %; wind_speed: m/s; solar_radiation unit not recorded",
        "Coordinates and original request/retrieval manifest absent",
    ),
    (
        "data/nasa_power/nasa_power_lat23.8103_lon90.4125_20260831_20260929.csv",
        "NASA POWER-attributed; not independently authenticated",
        "remote_observed",
        "temperature: °C; rainfall: mm/day; humidity: %; wind_speed: m/s; solar_radiation unit not recorded",
        "Point in filename is not a field boundary; solar_radiation has missing values",
    ),
    (
        "data/soil/demo_soil.csv",
        "Bundled demo data; synthetic, not measured soil",
        "synthetic",
        "N/P/K: mg/kg; pH: unitless; organic_matter: percent by mass; coordinates: degrees",
        "Two rows; N and organic matter each missing once",
    ),
    (
        "data/crops/crop_knowledge.csv",
        "Bundled demo crop knowledge; synthetic illustrative parameters",
        "synthetic",
        "water_requirement: mm/growing season; duration: days; expected_yield: t/ha; production_cost: illustrative BDT/ha; market_price: illustrative BDT/t; temperature: °C; pH: unitless",
        "No local cultivar, method, citation, or uncertainty; values not validated",
    ),
    (
        "data/field_history/demo_field_history.csv",
        "Bundled demo history; synthetic, not farm history",
        "synthetic",
        "yield: t/ha; year: calendar year; irrigation: categorical demo label",
        "Four rows; one yield missing; no event-level action linkage",
    ),
    (
        "data/smap/demo_smap.csv",
        "SMAP-like bundled demo; synthetic and not NASA SMAP",
        "synthetic",
        "soil_moisture: m³/m³ per project documentation; coordinates: degrees",
        "Three rows; no satellite product/version or direct sensor method",
    ),
)


def _field_state() -> FieldState:
    """Create one explicit, synthetic state for controlled what-if comparisons."""
    return FieldState(
        field_id="hypothetical-benchmark-field",
        as_of_date="2026-09-29",
        latitude=23.8103,
        longitude=90.4125,
        temperature=23.0,
        temp_max=29.0,
        temp_min=18.0,
        rainfall=4.0,
        humidity=70.0,
        wind_speed=2.0,
        solar_radiation=15.0,
        soil_moisture=0.25,
        nitrogen=40.0,
        phosphorus=15.0,
        potassium=100.0,
        ph=6.2,
        organic_matter=2.0,
        environment_source="hypothetical_fixture",
        soil_moisture_source="hypothetical_fixture",
        soil_source="hypothetical_fixture",
        crop_source="bundled_demo_crop_knowledge",
        history_source="no_previous_crop_assumed",
        data_status={
            "environment": "synthetic",
            "soil_moisture": "synthetic",
            "soil": "synthetic",
            "crop": "synthetic",
            "history": "missing",
        },
    )


def _rotation_constraint_check(
    result: Mapping[str, Any],
    *,
    crops: pd.DataFrame,
    planning_periods: Sequence[str],
    legume_interval_seasons: int,
    previous_family: Optional[str] = None,
) -> dict[str, Any]:
    """Independently check encoded assignment, family, legume, and eligibility rules."""
    if result.get("status") not in {"optimal", "feasible"}:
        return {
            "status": "not_evaluated_no_feasible_plan",
            "passed": None,
            "violations": [],
        }
    rotation = result.get("selected_crop_by_period")
    violations: List[str] = []
    if not isinstance(rotation, Mapping):
        return {
            "status": "invalid_plan_shape",
            "passed": False,
            "violations": ["selected_crop_by_period is not a mapping"],
        }
    if tuple(rotation) != tuple(planning_periods):
        violations.append("plan period keys do not match requested periods in order")

    crop_by_name = crops.set_index("crop").to_dict(orient="index")
    if len(rotation) != len(planning_periods):
        violations.append("plan does not assign exactly one crop to every period")
    selected_rows = []
    for period in planning_periods:
        crop_name = rotation.get(period)
        if crop_name not in crop_by_name:
            violations.append(f"{period} selects unknown crop {crop_name!r}")
            selected_rows.append(None)
            continue
        selected_rows.append(crop_by_name[crop_name])
        compatibility = result.get("compatibility_by_crop", {}).get(crop_name, {})
        for rule_name in ("temperature", "ph", "water"):
            rule = compatibility.get("rules", {}).get(rule_name, {})
            if rule.get("status") == "incompatible":
                violations.append(
                    f"{period} selects {crop_name} despite incompatible {rule_name} rule"
                )

    family_sequence = []
    if previous_family:
        family_sequence.append(previous_family.casefold())
    family_sequence.extend(
        str(row["family"]).casefold() if row is not None else ""
        for row in selected_rows
    )
    for index, (prior, current) in enumerate(
        zip(family_sequence, family_sequence[1:])
    ):
        if prior and current and prior == current:
            period_index = index if previous_family else index + 1
            violations.append(
                f"consecutive crop-family repetition at period index {period_index}"
            )

    legume_flags = [
        bool(row["is_legume"]) if row is not None else False
        for row in selected_rows
    ]
    if legume_interval_seasons <= len(legume_flags):
        for start in range(len(legume_flags) - legume_interval_seasons + 1):
            if not any(
                legume_flags[start : start + legume_interval_seasons]
            ):
                violations.append(
                    f"no legume in periods {start}.."
                    f"{start + legume_interval_seasons - 1}"
                )
    return {
        "status": "checked",
        "passed": not violations,
        "violations": violations,
        "one_crop_per_period": len(rotation) == len(planning_periods),
        "family_rotation_checked": True,
        "legume_window_seasons": legume_interval_seasons,
        "static_compatibility_checked": True,
    }


def _optimizer_summary(
    result: Optional[Mapping[str, Any]],
    *,
    crops: pd.DataFrame,
    planning_periods: Sequence[str],
    legume_interval_seasons: int,
) -> Optional[dict[str, Any]]:
    if result is None:
        return None
    check = _rotation_constraint_check(
        result,
        crops=crops,
        planning_periods=planning_periods,
        legume_interval_seasons=legume_interval_seasons,
    )
    components = {
        name: result.get(f"{name}_component")
        for name in ("profit", "water", "soil")
    }
    constraint_summary = result.get("constraint_summary", {})
    return {
        "status": result.get("status", "unknown"),
        "solver_status": result.get("solver_status", "unknown"),
        "feasible": result.get("status") in {"optimal", "feasible"},
        "plan": result.get("selected_crop_by_period"),
        "objective_value": result.get("objective_value"),
        "objective_components": components,
        "normalized_components": result.get("normalized_components"),
        "objective_component_status": result.get("data_status", {}).get(
            "objective_components"
        ),
        "requested_weights": result.get("weights", {}).get("requested"),
        "effective_weights": result.get("weights", {}).get("effective"),
        "constraint_summary": constraint_summary,
        "independent_constraint_check": check,
        "provenance": result.get("provenance"),
        "monetary_component_status": result.get("monetary_component_status"),
    }


def _plan_change(
    baseline: Optional[Mapping[str, Any]],
    candidate: Optional[Mapping[str, Any]],
) -> Optional[bool]:
    if not baseline or not candidate:
        return None
    baseline_plan = baseline.get("plan")
    candidate_plan = candidate.get("plan")
    if baseline_plan is None or candidate_plan is None:
        return None
    return baseline_plan != candidate_plan


def _compare_components(
    baseline: Optional[Mapping[str, Any]],
    scenario: Optional[Mapping[str, Any]],
) -> Optional[dict[str, Optional[float]]]:
    if not baseline or not scenario:
        return None
    comparison = {}
    for name in ("profit", "water", "soil"):
        before = baseline.get(f"{name}_component", baseline.get(name))
        after = scenario.get(f"{name}_component", scenario.get(name))
        comparison[name] = (
            float(after) - float(before)
            if isinstance(before, (int, float))
            and isinstance(after, (int, float))
            else None
        )
    return comparison


def _optimize_case(
    state: FieldState,
    *,
    crops: pd.DataFrame,
    available_water_mm: float,
    objective_weights: Mapping[str, float],
    planning_periods: Sequence[str],
    legume_interval_seasons: int,
) -> dict[str, Any]:
    """Call the existing MILP API for one explicitly configured case."""
    features = {
        **BASELINE_FEATURES,
        "available_water_mm": available_water_mm,
        "provenance": {
            "available_water_mm": {
                "source": "hypothetical_fixture",
                "data_status": "synthetic",
            }
        },
    }
    result = optimize_rotation(
        field_state=state,
        crops=crops,
        features=features,
        field_history=pd.DataFrame(columns=FIELD_HISTORY_COLUMNS),
        planning_periods=tuple(planning_periods),
        legume_interval_seasons=legume_interval_seasons,
        **dict(objective_weights),
    )
    return _optimizer_summary(
        result,
        crops=crops,
        planning_periods=planning_periods,
        legume_interval_seasons=legume_interval_seasons,
    )


def _validate_sensitivity_configuration(
    weight_values: Sequence[float],
    available_water_values_mm: Sequence[float],
) -> tuple[tuple[float, ...], tuple[float, ...]]:
    if (
        isinstance(weight_values, (str, bytes))
        or not isinstance(weight_values, Sequence)
        or not weight_values
    ):
        raise ValueError("weight_values must be a non-empty sequence.")
    if (
        isinstance(available_water_values_mm, (str, bytes))
        or not isinstance(available_water_values_mm, Sequence)
        or not available_water_values_mm
    ):
        raise ValueError("available_water_values_mm must be a non-empty sequence.")

    def validate_values(
        values: Sequence[float],
        name: str,
        lower: float,
        upper: Optional[float] = None,
    ) -> tuple[float, ...]:
        normalized = []
        for value in values:
            if isinstance(value, bool):
                raise ValueError(f"{name} values must be finite and in range.")
            try:
                number = float(value)
            except (TypeError, ValueError, OverflowError) as error:
                raise ValueError(f"{name} values must be finite and in range.") from error
            if (
                not isfinite(number)
                or number < lower
                or (upper is not None and number > upper)
            ):
                raise ValueError(f"{name} values must be finite and in range.")
            normalized.append(number)
        if len(set(normalized)) != len(normalized):
            raise ValueError(f"{name} values must be unique.")
        return tuple(normalized)

    return (
        validate_values(weight_values, "weight_values", 0.0, 1.0),
        validate_values(available_water_values_mm, "available_water_values_mm", 0.0),
    )


def _repeatability_summary(
    first: Mapping[str, Any], second: Mapping[str, Any], tolerance: float = 1e-9
) -> dict[str, Any]:
    components_match = True
    maximum_component_difference = 0.0
    for name in ("profit", "water", "soil"):
        left = first["objective_components"].get(name)
        right = second["objective_components"].get(name)
        if left is None or right is None:
            components_match = components_match and left is right
            continue
        difference = abs(float(left) - float(right))
        maximum_component_difference = max(maximum_component_difference, difference)
        components_match = components_match and difference <= tolerance
    same_status = first["status"] == second["status"]
    same_plan = first["plan"] == second["plan"]
    return {
        "repetitions": 2,
        "same_optimizer_status": same_status,
        "same_plan": same_plan,
        "components_within_tolerance": components_match,
        "component_absolute_tolerance": tolerance,
        "maximum_absolute_component_difference": maximum_component_difference,
        "repeatable": same_status and same_plan and components_match,
        "runs": [
            {
                "status": first["status"],
                "plan": first["plan"],
                "objective_components": first["objective_components"],
                "independent_constraint_check": first["independent_constraint_check"],
            },
            {
                "status": second["status"],
                "plan": second["plan"],
                "objective_components": second["objective_components"],
                "independent_constraint_check": second["independent_constraint_check"],
            },
        ],
    }


def _audit_dataset_files() -> List[dict[str, Any]]:
    """Inspect bundled research inputs without modifying or authenticating them."""
    inventory = []
    for relative_path, role, evidence_class, units, limitation in DATASET_AUDIT:
        path = PROJECT_ROOT / relative_path
        if not path.is_file():
            raise FileNotFoundError(f"Required benchmark input is missing: {path}")
        with path.open("r", encoding="utf-8-sig", newline="") as stream:
            reader = csv.DictReader(stream)
            columns = reader.fieldnames
            if not columns:
                raise ValueError(f"Benchmark input has no CSV header: {path}")
            rows = list(reader)
        if any(len(row) != len(columns) for row in rows):
            raise ValueError(f"Benchmark input has malformed CSV rows: {path}")
        missing_counts = {
            column: sum(
                1
                for row in rows
                if row.get(column) is None or not row.get(column, "").strip()
            )
            for column in columns
        }
        missing_counts = {
            column: count for column, count in missing_counts.items() if count
        }
        time_column = next(
            (column for column in ("date", "as_of_date", "year") if column in columns),
            None,
        )
        date_coverage = None
        if time_column:
            date_values = [
                row[time_column].strip()
                for row in rows
                if row.get(time_column, "").strip()
            ]
            if date_values:
                date_coverage = {
                    "column": time_column,
                    "start": min(date_values),
                    "end": max(date_values),
                }
        inventory.append(
            {
                "file": relative_path,
                "role": role,
                "row_count": len(rows),
                "columns": columns,
                "date_coverage": date_coverage,
                "missing_counts": missing_counts,
                "evidence_class": evidence_class,
                "units": units,
                "limitations": limitation,
            }
        )
    return inventory


def _scenario_summary(
    scenario_result: Mapping[str, Any],
    *,
    baseline_optimizer: Optional[Mapping[str, Any]],
    crops: pd.DataFrame,
    planning_periods: Sequence[str],
    legume_interval_seasons: int,
) -> dict[str, Any]:
    optimizer = scenario_result.get("scenario_optimizer_result")
    base_summary = _optimizer_summary(
        baseline_optimizer,
        crops=crops,
        planning_periods=planning_periods,
        legume_interval_seasons=legume_interval_seasons,
    )
    scenario_optimizer_summary = _optimizer_summary(
        optimizer,
        crops=crops,
        planning_periods=planning_periods,
        legume_interval_seasons=legume_interval_seasons,
    )
    return {
        "scenario": scenario_result.get("scenario"),
        "status": scenario_result.get("status"),
        "reason": scenario_result.get("reason"),
        "changed_fields": scenario_result.get("changed_fields"),
        "assumptions": scenario_result.get("assumptions"),
        "hypothetical": True,
        "provenance": scenario_result.get("provenance"),
        "baseline_optimizer": base_summary,
        "scenario_optimizer": scenario_optimizer_summary,
        "rotation_changed": scenario_result.get("rotation_changed"),
        "objective_component_delta": _compare_components(
            baseline_optimizer, optimizer
        ),
    }


def run_benchmark() -> dict[str, Any]:
    """Run the fixed baseline and systematic hypothetical sensitivity study."""
    crops = load_crop_knowledge()
    if not crops["data_status"].astype(str).str.lower().isin(
        {"synthetic", "demo"}
    ).all():
        raise ValueError("Benchmark requires the explicitly synthetic crop fixture.")
    state = _field_state()
    planning_periods = PLANNING_PERIODS
    legume_interval = 3
    optimizer_options = {
        **OBJECTIVE_WEIGHTS,
        "planning_periods": planning_periods,
        "legume_interval_seasons": legume_interval,
    }
    stress = run_stress_tests(
        state,
        features=BASELINE_FEATURES,
        crops=crops,
        field_history=pd.DataFrame(columns=FIELD_HISTORY_COLUMNS),
        optimizer_options=optimizer_options,
        scenario_config=SCENARIO_CONFIG,
        scenarios=SCENARIO_NAMES,
        run_milp=True,
    )
    baseline_optimizer = stress["baseline"]["optimizer_result"]
    baseline = _optimizer_summary(
        baseline_optimizer,
        crops=crops,
        planning_periods=planning_periods,
        legume_interval_seasons=legume_interval,
    )
    scenarios = {
        name: _scenario_summary(
            value,
            baseline_optimizer=baseline_optimizer,
            crops=crops,
            planning_periods=planning_periods,
            legume_interval_seasons=legume_interval,
        )
        for name, value in stress["scenarios"].items()
    }
    repeat_one = _optimize_case(
        state,
        crops=crops,
        available_water_mm=BASELINE_FEATURES["available_water_mm"],
        objective_weights=OBJECTIVE_WEIGHTS,
        planning_periods=planning_periods,
        legume_interval_seasons=legume_interval,
    )
    repeat_two = _optimize_case(
        state,
        crops=crops,
        available_water_mm=BASELINE_FEATURES["available_water_mm"],
        objective_weights=OBJECTIVE_WEIGHTS,
        planning_periods=planning_periods,
        legume_interval_seasons=legume_interval,
    )
    sensitivity = run_sensitivity(
        state,
        crops=crops,
        planning_periods=planning_periods,
        legume_interval_seasons=legume_interval,
    )
    return {
        "phase": "FieldShift Phase 29",
        "status": "completed",
        "interpretation": (
            "research-only hypothetical sensitivity study of software and optimizer "
            "behavior; not a forecast or field trial"
        ),
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "reproducibility": {
            "randomness_used": False,
            "random_seed": None,
            "solver": "PuLP CBC command-line solver",
            "solver_threads": 1,
            "solver_tolerance": "CBC default; no custom tolerance supplied",
            "repeatability_tolerance": 1e-9,
            "software": {
                "python": sys.version.split()[0],
                "platform": platform.platform(),
                "pandas": pd.__version__,
                "pulp": pulp.__version__,
            },
            "determinism_note": (
                "No random draws are used. CBC is configured by the optimizer "
                "with one thread; solver-version/platform differences may alter "
                "tie-breaking."
            ),
        },
        "inputs": {
            "state": state.to_dict(),
            "features": BASELINE_FEATURES,
            "crop_file": "data/crops/crop_knowledge.csv",
            "crop_rows": int(len(crops)),
            "crop_data_status": sorted(
                crops["data_status"].astype(str).unique().tolist()
            ),
            "field_history": "empty controlled fixture; no prior crop asserted",
        },
        "dataset_audit": _audit_dataset_files(),
        "configuration": {
            "planning_periods": list(planning_periods),
            "legume_interval_seasons": legume_interval,
            "objective_weights": OBJECTIVE_WEIGHTS,
            "baseline_available_water_mm": BASELINE_FEATURES["available_water_mm"],
            "available_water_units": "hypothetical mm per planning season",
            "experiment_type": "one-at-a-time sensitivity around fixed baseline",
            "objective_weight_interpretation": (
                "Illustrative prototype priorities; component values depend on "
                "the bundled crop catalog and are not measured farm outcomes."
            ),
        },
        "scenario_configuration": {
            "drought_soil_moisture_delta": SCENARIO_CONFIG.drought_soil_moisture_delta,
            "heat_temperature_delta": SCENARIO_CONFIG.heat_temperature_delta,
            "low_water_fraction": SCENARIO_CONFIG.low_water_fraction,
            "baseline_available_water_mm": BASELINE_FEATURES["available_water_mm"],
            "supported_sensitivity_values": {
                **{
                    "objective_weight_fraction": list(OBJECTIVE_WEIGHT_VALUES),
                    "baseline_available_water_mm": list(AVAILABLE_WATER_VALUES_MM),
                },
                **{
                    name: list(values)
                    for name, values in SCENARIO_SENSITIVITY_VALUES.items()
                },
            },
            "scenarios": list(SCENARIO_NAMES),
            "rainfall_scenario_supported": False,
            "rainfall_limitation": (
                "The existing scenario API has no rainfall-perturbation scenario."
            ),
        },
        "baseline_optimizer": baseline,
        "scenarios": scenarios,
        "repeatability": _repeatability_summary(repeat_one, repeat_two),
        "sensitivity": sensitivity,
        "data_boundary": {
            "synthetic_inputs": [
                "hypothetical FieldState fixture",
                "bundled demo crop knowledge",
                "hypothetical available seasonal water",
            ],
            "environmental_files_not_used_as_field_observations": [
                "data/nasa_power/nasa_power_2025.csv",
                "data/nasa_power/nasa_power_lat23.8103_lon90.4125_20260831_20260929.csv",
            ],
            "rl_trained": False,
        },
    }


def run_sensitivity(
    state: FieldState,
    *,
    crops: pd.DataFrame,
    planning_periods: Sequence[str],
    legume_interval_seasons: int,
    weight_values: Sequence[float] = OBJECTIVE_WEIGHT_VALUES,
    available_water_values_mm: Sequence[float] = AVAILABLE_WATER_VALUES_MM,
) -> dict[str, Any]:
    """Vary one validated weight, water assumption, or scenario input at a time."""
    validated_weight_values, validated_water_values = (
        _validate_sensitivity_configuration(
            weight_values, available_water_values_mm
        )
    )
    baseline_summary = _optimize_case(
        state,
        crops=crops,
        available_water_mm=BASELINE_FEATURES["available_water_mm"],
        objective_weights=OBJECTIVE_WEIGHTS,
        planning_periods=planning_periods,
        legume_interval_seasons=legume_interval_seasons,
    )
    results: dict[str, Any] = {
        "objective_weights": {},
        "baseline_available_water_mm": [],
    }
    baseline_weights = {
        "profit_weight": OBJECTIVE_WEIGHTS["profit_weight"],
        "water_weight": OBJECTIVE_WEIGHTS["water_weight"],
        "soil_weight": OBJECTIVE_WEIGHTS["soil_weight"],
    }
    for key, other_keys in (
        ("profit_weight", ("water_weight", "soil_weight")),
        ("water_weight", ("profit_weight", "soil_weight")),
        ("soil_weight", ("profit_weight", "water_weight")),
    ):
        variants = []
        for value in validated_weight_values:
            remaining = 1.0 - value
            other_total = sum(baseline_weights[name] for name in other_keys)
            weights = {
                key: value,
                **{
                    name: (
                        remaining * baseline_weights[name] / other_total
                        if other_total > 0
                        else remaining / len(other_keys)
                    )
                    for name in other_keys
                },
            }
            optimizer = _optimize_case(
                state,
                crops=crops,
                available_water_mm=BASELINE_FEATURES["available_water_mm"],
                objective_weights=weights,
                planning_periods=planning_periods,
                legume_interval_seasons=legume_interval_seasons,
            )
            variants.append(
                {
                    "parameter_value": value,
                    "requested_weights": weights,
                    "optimizer": optimizer,
                    "rotation_changed": _plan_change(baseline_summary, optimizer),
                    "objective_component_delta": _compare_components(
                        baseline_summary["objective_components"],
                        optimizer["objective_components"],
                    ),
                    "hypothetical": True,
                }
            )
        results["objective_weights"][key] = variants

    for water_value in validated_water_values:
        optimizer = _optimize_case(
            state,
            crops=crops,
            available_water_mm=water_value,
            objective_weights=OBJECTIVE_WEIGHTS,
            planning_periods=planning_periods,
            legume_interval_seasons=legume_interval_seasons,
        )
        results["baseline_available_water_mm"].append(
            {
                "parameter_value": water_value,
                "units": "hypothetical mm per planning season",
                "optimizer": optimizer,
                "rotation_changed": _plan_change(baseline_summary, optimizer),
                "objective_component_delta": _compare_components(
                    baseline_summary["objective_components"],
                    optimizer["objective_components"],
                ),
                "hypothetical": True,
            }
        )

    options = {
        **OBJECTIVE_WEIGHTS,
        "planning_periods": tuple(planning_periods),
        "legume_interval_seasons": legume_interval_seasons,
    }
    for parameter, values in SCENARIO_SENSITIVITY_VALUES.items():
        scenario_name = {
            "heat_temperature_delta": "heat",
            "low_water_fraction": "low_water",
            "drought_soil_moisture_delta": "drought",
        }[parameter]
        variants = []
        for value in values:
            config_values = {
                "drought_soil_moisture_delta": SCENARIO_CONFIG.drought_soil_moisture_delta,
                "heat_temperature_delta": SCENARIO_CONFIG.heat_temperature_delta,
                "low_water_fraction": SCENARIO_CONFIG.low_water_fraction,
            }
            config_values[parameter] = value
            config = StressScenarioConfig(**config_values)
            scenario_name = {
                "heat_temperature_delta": "heat",
                "low_water_fraction": "low_water",
                "drought_soil_moisture_delta": "drought",
            }[parameter]
            result = run_stress_tests(
                state,
                features={
                    **BASELINE_FEATURES,
                    "available_water_mm": BASELINE_FEATURES["available_water_mm"],
                },
                crops=crops,
                field_history=pd.DataFrame(columns=FIELD_HISTORY_COLUMNS),
                optimizer_options=options,
                scenario_config=config,
                scenarios=("normal", scenario_name),
                run_milp=True,
            )
            base_optimizer = result["baseline"]["optimizer_result"]
            scenario = result["scenarios"][scenario_name]
            optimizer = _optimizer_summary(
                scenario.get("scenario_optimizer_result"),
                crops=crops,
                planning_periods=planning_periods,
                legume_interval_seasons=legume_interval_seasons,
            )
            variants.append(
                {
                    "parameter_value": value,
                    "scenario_status": scenario["status"],
                    "optimizer": optimizer,
                    "rotation_changed": _plan_change(
                        baseline_summary, optimizer
                    ),
                    "objective_component_delta": _compare_components(
                        baseline_summary["objective_components"],
                        optimizer["objective_components"] if optimizer else None,
                    ),
                    "changed_fields": scenario.get("changed_fields"),
                    "assumptions": scenario.get("assumptions"),
                    "hypothetical": True,
                }
            )
        results[parameter] = variants
    return results


def render_markdown_report(results: Mapping[str, Any]) -> str:
    """Render actual structured benchmark results as a readable report section."""
    lines = [
        "# FieldShift Phase 29 — Research Benchmark Expansion and Sensitivity Analysis",
        "",
        f"Completion status: **{results.get('status', 'unknown')}**",
        "",
        "Research-only hypothetical experiments. Results are software/optimizer",
        "evidence under synthetic inputs, not forecasts, field trials, or validated",
        "agronomic outcomes.",
        "",
        "## Experiment configuration",
        "",
        f"- Planning periods: `{', '.join(results['configuration']['planning_periods'])}`",
        f"- Objective weights: `{json.dumps(results['configuration']['objective_weights'], sort_keys=True)}`",
        f"- Scenario parameters: `{json.dumps(results['scenario_configuration'], sort_keys=True)}`",
        f"- Reproducibility context: `{json.dumps(results['reproducibility'], sort_keys=True)}`",
        f"- Experiment timestamp: `{results['created_at_utc']}`",
        "- Random seed: not applicable; no random draws were used.",
        "",
        f"- Sensitivity parameter ranges: `{json.dumps(results['scenario_configuration']['supported_sensitivity_values'], sort_keys=True)}`",
        "",
        "## Experiment objectives and methodology",
        "",
        "The baseline is one explicit synthetic FieldState with 23°C temperature,",
        "29°C maximum, 18°C minimum, pH 6.2, soil moisture 0.25 m³/m³, and",
        "hypothetical seasonal available water of 1500 mm. Six planning periods",
        "and a three-season legume interval are used. The bundled seven-crop demo",
        "table, existing agronomic rules, existing optimizer weights, and CBC",
        "solver are reused. `run_stress_tests` compares each perturbation against",
        "the same baseline. An independent checker verifies assignment, adjacent",
        "families, legume windows, and selected-crop temperature/pH/water",
        "incompatibility. Unknown compatibility is not confirmed suitability.",
        "If a plan is absent, constraints are not marked passed.",
        "",
        "One parameter is changed at a time. Each objective-weight sweep varies",
        "one normalized share and redistributes the remainder in the baseline",
        "ratio between the other two weights. Seasonal-water sweeps vary the",
        "explicit hypothetical availability with all other inputs fixed.",
        "Scenario plan changes and component deltas are recorded separately.",
        "",
        "| Scenario | Transformation | Exact input used |",
        "| --- | --- | --- |",
        "| `normal` | Baseline copied unchanged | No perturbation |",
        "| `drought` | Soil moisture delta | -0.08 m³/m³ from baseline 0.25 |",
        "| `heat` | Add delta to available temperature fields | +5.0 °C from temperature 23.0 °C |",
        "| `low_water` | Multiply explicit seasonal water by fraction | 1500 mm × 0.60 = 900 mm |",
        "",
        "## Dataset provenance and coverage",
        "",
        "| File | Rows | Columns | Date coverage | Missingness | Role, evidence / units / limitation |",
        "| --- | ---: | --- | --- | --- | --- |",
    ]
    for dataset in results["dataset_audit"]:
        coverage = dataset["date_coverage"]
        coverage_text = (
            f"{coverage['start']}–{coverage['end']} ({coverage['column']})"
            if coverage
            else "static / not recorded"
        )
        lines.append(
            "| `{}` | {} | `{}` | {} | `{}` | {}; {}; {}; {} |".format(
                dataset["file"],
                dataset["row_count"],
                ", ".join(dataset["columns"]),
                coverage_text,
                json.dumps(dataset["missing_counts"], sort_keys=True) or "none",
                dataset["role"],
                dataset["evidence_class"],
                dataset["units"],
                dataset["limitations"],
            )
        )
    lines.extend(
        [
        "",
        "The experiment uses the bundled synthetic crop-knowledge table and an",
        "explicit hypothetical field-state/water fixture. It does not consume the",
        "NASA POWER files as field measurements. NASA attribution is not independent",
        "authentication of the bundled files.",
        "",
        "## Optimizer and constraints",
        "",
        f"- Baseline optimizer status: **{results['baseline_optimizer']['status']}**",
        f"- Solver status: `{results['baseline_optimizer']['solver_status']}`",
        f"- Baseline feasible: `{results['baseline_optimizer']['feasible']}`",
        f"- Baseline selected plan: `{json.dumps(results['baseline_optimizer']['plan'], sort_keys=True)}`",
        f"- Baseline independent hard-constraint check: `{json.dumps(results['baseline_optimizer']['independent_constraint_check'], sort_keys=True)}`",
        f"- Baseline objective components (illustrative, not measurements): `{json.dumps(results['baseline_optimizer']['objective_components'], sort_keys=True)}`",
        "",
        "| Scenario | Scenario status | Optimizer status | Feasible | Plan | Rotation changed | Objective component delta* | Constraint check |",
        "| --- | --- | --- | --- | --- | --- | --- | --- |",
        ]
    )
    for name, scenario in results["scenarios"].items():
        optimizer = scenario["scenario_optimizer"]
        lines.append(
            "| `{}` | `{}` | `{}` | `{}` | `{}` | `{}` | `{}` | `{}` |".format(
                name,
                scenario["status"],
                optimizer["status"] if optimizer else "not run",
                optimizer["feasible"] if optimizer else "n/a",
                json.dumps(optimizer["plan"], sort_keys=True) if optimizer else "no plan",
                scenario["rotation_changed"],
                json.dumps(scenario["objective_component_delta"], sort_keys=True),
                json.dumps(
                    optimizer["independent_constraint_check"], sort_keys=True
                )
                if optimizer
                else "not evaluated",
            )
        )
    lines.extend(
        [
            "",
            "*Deltas are differences in the optimizer's reported objective components",
            "under demo crop metadata and must not be interpreted as real money,",
            "measured water use, or measured soil-health outcomes.*",
            "The profit component is an illustrative gross-margin proxy; water and",
            "soil components are normalized over the supplied crop catalog. Their",
            "values can change with catalog contents and are optimizer outputs, not",
            "measured farm outcomes.",
            "",
            "## Sensitivity and repeatability",
            "",
            "Identical baseline inputs were solved twice independently. Repeatability",
            f"summary: `{json.dumps(results['repeatability'], sort_keys=True)}`.",
            "Status and plan are compared exactly; available objective components",
            "are compared within the recorded absolute tolerance. No-plan cases",
            "are retained without imputation.",
            "",
        ]
    )
    sensitivity_groups = (
        ("Objective-weight sensitivity", results["sensitivity"]["objective_weights"]),
        (
            "Baseline seasonal water assumptions",
            {
                "baseline_available_water_mm":
                    results["sensitivity"]["baseline_available_water_mm"]
            },
        ),
        (
            "Supported scenario sensitivity",
            {
                name: results["sensitivity"][name]
                for name in SCENARIO_SENSITIVITY_VALUES
            },
        ),
    )
    for heading, groups in sensitivity_groups:
        lines.extend([f"### {heading}", ""])
        for parameter, variants in groups.items():
            lines.extend(
                [
                    f"**`{parameter}`**",
                    "",
                    "| Value | Varied configuration | Scenario status | Optimizer status | Feasible | Plan | Rotation changed | Component delta | Independent constraints |",
                    "| ---: | --- | --- | --- | --- | --- | --- | --- | --- |",
                ]
            )
            for variant in variants:
                optimizer = variant["optimizer"]
                varied_configuration = variant.get("requested_weights")
                if varied_configuration is None:
                    varied_configuration = variant.get("assumptions") or {
                        "available_water_mm": variant["parameter_value"]
                    }
                lines.append(
                    "| {} | `{}` | `{}` | `{}` | `{}` | `{}` | `{}` | `{}` | `{}` |".format(
                        variant["parameter_value"],
                        json.dumps(varied_configuration, sort_keys=True),
                        variant.get("scenario_status", "baseline sensitivity"),
                        optimizer["status"] if optimizer else "not run",
                        optimizer["feasible"] if optimizer else "n/a",
                        json.dumps(optimizer["plan"], sort_keys=True) if optimizer else "no plan",
                        variant["rotation_changed"],
                        json.dumps(variant["objective_component_delta"], sort_keys=True),
                        json.dumps(optimizer["independent_constraint_check"], sort_keys=True)
                        if optimizer
                        else "not evaluated",
                    )
                )
            lines.append("")
    lines.extend(
        [
            "CBC uses one thread and default tolerance; no random seed is applicable.",
            "A rainfall-reduction scenario is unsupported by the",
            "current scenario API and was not invented.",
            "",
            "## Limitations and integrity",
            "",
            "The objective weights and all MILP hard constraints are unchanged. Hypothetical scenario",
            "parameters are sensitivities, not climate forecasts. A solver-feasible",
            "plan only verifies the encoded mathematical constraints for these inputs;",
            "it does not establish agronomic suitability or expected outcomes.",
            "",
            "No real farm data were fabricated, no external data were downloaded, and",
            "RL was not trained or enabled. Real yield/profit effects, water savings,",
            "soil-health changes, forecasts, and policy performance remain unvalidated.",
            "",
        ]
    )
    return "\n".join(lines)


def append_report(path: Path, report: str) -> None:
    """Append one complete report section without replacing existing bytes."""
    path = Path(path)
    if not isinstance(report, str) or not report.strip():
        raise ValueError("report must be a non-empty string.")
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = report.rstrip() + "\n"
    with path.open("ab") as stream:
        if stream.tell() > 0:
            stream.write(b"\n")
        stream.write(payload.encode("utf-8"))


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--json-output",
        type=Path,
        help="optional path for machine-readable experiment results",
    )
    parser.add_argument(
        "--markdown-output",
        type=Path,
        help="optional path for the experiment report section",
    )
    args = parser.parse_args(argv)
    results = run_benchmark()
    report = render_markdown_report(results)
    print(report)
    if args.json_output:
        args.json_output.write_text(
            json.dumps(results, indent=2, sort_keys=True, default=str) + "\n",
            encoding="utf-8",
        )
    if args.markdown_output:
        args.markdown_output.write_text(report, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
