"""Controlled hypothetical perturbations and re-evaluation of FieldShift state."""

from copy import deepcopy
from dataclasses import dataclass
from typing import Any, Mapping, Optional, Sequence

import numpy as np
import pandas as pd

from src.knowledge.agronomic_rules import (
    AgronomicRuleConfig,
    evaluate_all_crops,
)
from src.optimizer.milp import optimize_rotation
from src.preprocessing.features import build_features

DEFAULT_SCENARIOS = ("normal", "drought", "heat", "low_water")
SCENARIO_SOURCE = "scenario"
SCENARIO_DATA_STATUS = "synthetic"


@dataclass(frozen=True)
class StressScenarioConfig:
    """Configurable what-if changes; values are not climate projections."""

    drought_soil_moisture_delta: float = -0.08
    heat_temperature_delta: float = 5.0
    low_water_fraction: float = 0.60

    def __post_init__(self) -> None:
        if not np.isfinite(self.drought_soil_moisture_delta):
            raise ValueError("drought_soil_moisture_delta must be finite.")
        if self.drought_soil_moisture_delta > 0:
            raise ValueError("drought_soil_moisture_delta must not be positive.")
        if (
            not np.isfinite(self.heat_temperature_delta)
            or self.heat_temperature_delta < 0
        ):
            raise ValueError("heat_temperature_delta must be finite and non-negative.")
        if (
            not np.isfinite(self.low_water_fraction)
            or not 0 <= self.low_water_fraction <= 1
        ):
            raise ValueError("low_water_fraction must be between 0 and 1.")


def _number(value: Any) -> Optional[float]:
    if value is None or value is pd.NA:
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if not np.isfinite(number) or number == -999:
        return None
    return number


def _copy_features(features: Optional[Mapping[str, Any]]) -> dict[str, Any]:
    if features is None:
        return {}
    if not isinstance(features, Mapping):
        raise TypeError("features must be a mapping or None.")
    return deepcopy(dict(features))


def _config(config: Optional[StressScenarioConfig]) -> StressScenarioConfig:
    if config is None:
        return StressScenarioConfig()
    if isinstance(config, StressScenarioConfig):
        return config
    if isinstance(config, Mapping):
        try:
            return StressScenarioConfig(**dict(config))
        except TypeError as error:
            raise ValueError(f"Invalid stress scenario configuration: {error}") from error
    raise TypeError("config must be StressScenarioConfig, a mapping, or None.")


def _state_provenance(state, field_name: str) -> dict[str, str]:
    environmental = {
        "temperature",
        "temp_max",
        "temp_min",
        "rainfall",
        "humidity",
        "wind_speed",
        "solar_radiation",
    }
    if field_name in environmental:
        source = getattr(state, "environment_source", "missing")
        status = (getattr(state, "data_status", {}) or {}).get(
            "environment", "missing"
        )
    elif field_name == "soil_moisture":
        source = getattr(state, "soil_moisture_source", "missing")
        status = (getattr(state, "data_status", {}) or {}).get(
            "soil_moisture", "missing"
        )
    else:
        source, status = "caller_supplied", "unknown"
    return {"source": str(source), "data_status": str(status)}


def _mark_state_scenario(state, fields: Sequence[str]) -> None:
    statuses = dict(getattr(state, "data_status", {}) or {})
    for name in fields:
        if name in {"temperature", "temp_max", "temp_min"}:
            state.environment_source = SCENARIO_SOURCE
            statuses["environment"] = SCENARIO_DATA_STATUS
        elif name == "soil_moisture":
            state.soil_moisture_source = SCENARIO_SOURCE
            statuses["soil_moisture"] = SCENARIO_DATA_STATUS
    state.data_status = statuses


def _scenario_features(
    scenario_state,
    baseline_features: Mapping[str, Any],
    modified_fields: Sequence[str],
) -> dict[str, Any]:
    """Refresh state-derived feature values while retaining temporal context."""
    refreshed = build_features(scenario_state)
    result = _copy_features(baseline_features)
    dependent_features = {
        "temperature": ("temperature", "heat_stress_indicator"),
        "temp_max": ("temp_max", "temperature_range"),
        "temp_min": ("temp_min", "temperature_range"),
        "soil_moisture": ("soil_moisture", "water_stress_indicator"),
    }
    affected = {
        feature
        for field_name in modified_fields
        for feature in dependent_features.get(field_name, ())
    }
    for feature in affected:
        if feature in refreshed:
            result[feature] = refreshed[feature]
    provenance = deepcopy(result.get("provenance", {}))
    refreshed_provenance = refreshed.get("provenance", {})
    for feature in affected:
        if feature in refreshed_provenance:
            provenance[feature] = refreshed_provenance[feature]
    result["provenance"] = provenance
    return result


def _not_applicable(
    scenario: str, state, features: Mapping[str, Any], reason: str
) -> dict[str, Any]:
    return {
        "scenario": scenario,
        "status": "not_applicable",
        "state": state,
        "features": _copy_features(features),
        "changed_fields": {},
        "assumptions": {},
        "provenance": {"changed_fields": {}, "unchanged_fields_preserved": True},
        "reason": reason,
    }


def apply_scenario(
    scenario: str,
    field_state,
    features: Optional[Mapping[str, Any]] = None,
    config: Optional[StressScenarioConfig] = None,
) -> dict[str, Any]:
    """Apply one configured what-if perturbation without mutating inputs."""
    if not isinstance(scenario, str) or scenario not in DEFAULT_SCENARIOS:
        raise ValueError(
            "scenario must be one of: " + ", ".join(DEFAULT_SCENARIOS)
        )
    settings = _config(config)
    scenario_state = deepcopy(field_state)
    scenario_features = _copy_features(features)
    changed_fields = {}
    assumptions = {}

    def change_state(name: str, value: float, assumption_name: str, assumption: Any):
        baseline_value = _number(getattr(field_state, name, None))
        if baseline_value is None:
            return False
        changed_fields[name] = {
            "baseline": baseline_value,
            "scenario": float(value),
            "baseline_provenance": _state_provenance(field_state, name),
            "scenario_provenance": {
                "source": SCENARIO_SOURCE,
                "data_status": SCENARIO_DATA_STATUS,
            },
        }
        setattr(scenario_state, name, float(value))
        assumptions[assumption_name] = assumption
        return True

    if scenario == "normal":
        return {
            "scenario": scenario,
            "status": "applied",
            "state": scenario_state,
            "features": scenario_features,
            "changed_fields": changed_fields,
            "assumptions": assumptions,
            "provenance": {
                "changed_fields": {},
                "unchanged_fields_preserved": True,
            },
            "reason": "Baseline state and features copied without perturbation.",
        }

    if scenario == "drought":
        baseline = _number(getattr(field_state, "soil_moisture", None))
        if baseline is None:
            return _not_applicable(
                scenario,
                scenario_state,
                scenario_features,
                "Baseline soil moisture is unavailable; no value was fabricated.",
            )
        value = max(0.0, baseline + settings.drought_soil_moisture_delta)
        change_state(
            "soil_moisture",
            value,
            "drought_soil_moisture_delta",
            settings.drought_soil_moisture_delta,
        )
    elif scenario == "heat":
        baseline = _number(getattr(field_state, "temperature", None))
        if baseline is None:
            return _not_applicable(
                scenario,
                scenario_state,
                scenario_features,
                "Baseline temperature is unavailable; no value was fabricated.",
            )
        for name in ("temperature", "temp_min", "temp_max"):
            original = _number(getattr(field_state, name, None))
            if original is not None:
                change_state(
                    name,
                    original + settings.heat_temperature_delta,
                    "heat_temperature_delta",
                    settings.heat_temperature_delta,
                )
        assumptions["heat_temperature_delta"] = settings.heat_temperature_delta
    else:
        baseline = _number(scenario_features.get("available_water_mm"))
        if baseline is None:
            return _not_applicable(
                scenario,
                scenario_state,
                scenario_features,
                "Seasonal available_water_mm is unavailable; daily rainfall and "
                "soil moisture are not substituted.",
            )
        value = baseline * settings.low_water_fraction
        scenario_features["available_water_mm"] = value
        scenario_features["available_water_source"] = SCENARIO_SOURCE
        scenario_features.setdefault("provenance", {})["available_water_mm"] = {
            "source": SCENARIO_SOURCE,
            "data_status": SCENARIO_DATA_STATUS,
        }
        supplied_provenance = _copy_features(features).get("provenance", {})
        baseline_provenance = supplied_provenance.get(
            "available_water_mm",
            {
                "source": _copy_features(features).get(
                    "available_water_source", "caller_supplied"
                ),
                "data_status": "unknown",
            },
        )
        changed_fields["available_water_mm"] = {
            "baseline": baseline,
            "scenario": value,
            "baseline_provenance": deepcopy(baseline_provenance),
            "scenario_provenance": {
                "source": SCENARIO_SOURCE,
                "data_status": SCENARIO_DATA_STATUS,
            },
        }
        assumptions["low_water_fraction"] = settings.low_water_fraction

    modified_state_fields = [
        name for name in changed_fields if name != "available_water_mm"
    ]
    _mark_state_scenario(scenario_state, modified_state_fields)
    if modified_state_fields:
        scenario_features = _scenario_features(
            scenario_state, scenario_features, modified_state_fields
        )
    return {
        "scenario": scenario,
        "status": "applied",
        "state": scenario_state,
        "features": scenario_features,
        "changed_fields": changed_fields,
        "assumptions": assumptions,
        "provenance": {
            "changed_fields": {
                name: values["scenario_provenance"]
                for name, values in changed_fields.items()
            },
            "unchanged_fields_preserved": True,
        },
        "reason": f"Applied the configured hypothetical {scenario} perturbation.",
    }


def _agronomic_config(value: Optional[Any]) -> Optional[AgronomicRuleConfig]:
    if value is None or isinstance(value, AgronomicRuleConfig):
        return value
    if isinstance(value, Mapping):
        try:
            return AgronomicRuleConfig(**dict(value))
        except TypeError as error:
            raise ValueError(f"Invalid agronomic configuration: {error}") from error
    raise TypeError("agronomic_config must be AgronomicRuleConfig, a mapping, or None.")


def _optimizer_options(value: Optional[Mapping[str, Any]]) -> dict[str, Any]:
    if value is None:
        return {}
    if not isinstance(value, Mapping):
        raise TypeError("optimizer_options must be a mapping.")
    forbidden = {"field_state", "crops", "features", "field_history"}
    conflicts = forbidden.intersection(value)
    if conflicts:
        raise ValueError(
            "State and data inputs use dedicated arguments: "
            + ", ".join(sorted(conflicts))
        )
    return dict(value)


def _evaluate_compatibility(
    crops, state, features, field_history, config
) -> dict[str, dict[str, Any]]:
    results = evaluate_all_crops(
        crops,
        state,
        features=features,
        field_history=field_history,
        config=config,
    )
    return {result["crop"]: result for result in results}


def _compatibility_changes(baseline, scenario) -> dict[str, Any]:
    changes = {}
    for crop, baseline_result in baseline.items():
        scenario_result = scenario.get(crop)
        if scenario_result is None:
            continue
        baseline_rules = baseline_result["rules"]
        scenario_rules = scenario_result["rules"]
        changed_rules = {
            name: {
                "baseline": baseline_rules[name]["status"],
                "scenario": rule["status"],
            }
            for name, rule in scenario_rules.items()
            if name in baseline_rules
            and rule["status"] != baseline_rules[name]["status"]
        }
        if (
            changed_rules
            or baseline_result["overall_compatibility"]
            != scenario_result["overall_compatibility"]
        ):
            changes[crop] = {
                "overall": {
                    "baseline": baseline_result["overall_compatibility"],
                    "scenario": scenario_result["overall_compatibility"],
                },
                "rules": changed_rules,
            }
    return changes


def _run_optimizer(
    state,
    crops,
    features,
    field_history,
    options: Mapping[str, Any],
    environmental_history: Optional[pd.DataFrame] = None,
) -> dict[str, Any]:
    try:
        return optimize_rotation(
            field_state=state,
            crops=crops,
            features=features,
            field_history=field_history,
            environmental_history=environmental_history,
            **options,
        )
    except ValueError as error:
        if (
            "No positively weighted objective component has complete crop metadata."
            not in str(error)
        ):
            raise
        return {
            "status": "not_solved",
            "solver_status": "InputError",
            "selected_crop_by_period": None,
            "objective_value": None,
            "profit_component": None,
            "water_component": None,
            "soil_component": None,
            "data_status": {
                "objective_components": "unavailable_required_metadata"
            },
            "provenance": {},
            "constraint_summary": {"input_error": str(error)},
        }


def _state_values(state) -> dict[str, Any]:
    names = (
        "temperature",
        "temp_max",
        "temp_min",
        "rainfall",
        "humidity",
        "wind_speed",
        "solar_radiation",
        "soil_moisture",
        "nitrogen",
        "phosphorus",
        "potassium",
        "ph",
        "organic_matter",
    )
    return {name: getattr(state, name, None) for name in names}


def _comparison_result(
    applied: Mapping[str, Any],
    baseline_state,
    baseline_compatibility: Mapping[str, Any],
    scenario_compatibility: Optional[Mapping[str, Any]],
    baseline_optimization: Optional[Mapping[str, Any]],
    scenario_optimization: Optional[Mapping[str, Any]],
) -> dict[str, Any]:
    baseline_rotation = (
        baseline_optimization.get("selected_crop_by_period")
        if baseline_optimization is not None
        else None
    )
    scenario_rotation = (
        scenario_optimization.get("selected_crop_by_period")
        if scenario_optimization is not None
        else None
    )
    status = applied["status"]
    if status == "applied":
        status = "completed"
    if (
        scenario_optimization is not None
        and scenario_optimization.get("status") == "infeasible"
    ):
        status = "infeasible"
    return {
        "scenario": applied["scenario"],
        "status": status,
        "reason": applied["reason"],
        "baseline_state_values": _state_values(baseline_state),
        "scenario_state_values": _state_values(applied["state"]),
        "scenario_state": deepcopy(applied["state"]),
        "scenario_features": _copy_features(applied["features"]),
        "changed_fields": applied["changed_fields"],
        "assumptions": applied["assumptions"],
        "compatibility_by_crop": scenario_compatibility,
        "compatibility_changes": _compatibility_changes(
            baseline_compatibility,
            scenario_compatibility or baseline_compatibility,
        ),
        "baseline_rotation": baseline_rotation,
        "scenario_rotation": scenario_rotation,
        "rotation_changed": (
            baseline_rotation != scenario_rotation
            if baseline_optimization is not None
            and scenario_optimization is not None
            else None
        ),
        "baseline_objective_components": (
            {
                name: baseline_optimization.get(f"{name}_component")
                for name in ("profit", "water", "soil")
            }
            if baseline_optimization is not None
            else None
        ),
        "scenario_objective_components": (
            {
                name: scenario_optimization.get(f"{name}_component")
                for name in ("profit", "water", "soil")
            }
            if scenario_optimization is not None
            else None
        ),
        "baseline_data_status": (
            baseline_optimization.get("data_status")
            if baseline_optimization is not None
            else None
        ),
        "scenario_data_status": (
            scenario_optimization.get("data_status")
            if scenario_optimization is not None
            else None
        ),
        "provenance": applied["provenance"],
    }


def run_stress_tests(
    field_state,
    features: Optional[Mapping[str, Any]] = None,
    crops: Optional[pd.DataFrame] = None,
    field_history=None,
    agronomic_config: Optional[Any] = None,
    optimizer_options: Optional[Mapping[str, Any]] = None,
    scenario_config: Optional[StressScenarioConfig] = None,
    scenarios: Optional[Sequence[str]] = None,
    run_milp: bool = True,
    environmental_history: Optional[pd.DataFrame] = None,
) -> dict[str, Any]:
    """Re-evaluate compatibility and optionally MILP for controlled scenarios."""
    selected_scenarios = list(DEFAULT_SCENARIOS if scenarios is None else scenarios)
    if not selected_scenarios:
        raise ValueError("scenarios must contain at least one scenario name.")
    unknown_scenarios = [
        name for name in selected_scenarios if name not in DEFAULT_SCENARIOS
    ]
    if unknown_scenarios:
        raise ValueError(
            "Unknown scenarios: " + ", ".join(map(str, unknown_scenarios))
        )
    if len(set(selected_scenarios)) != len(selected_scenarios):
        raise ValueError("scenarios must not contain duplicate names.")
    if not isinstance(run_milp, bool):
        raise TypeError("run_milp must be boolean.")
    agronomic = _agronomic_config(agronomic_config)
    options = _optimizer_options(optimizer_options)
    baseline_features = (
        _copy_features(features) if features is not None else build_features(field_state)
    )
    baseline_compatibility = _evaluate_compatibility(
        crops, field_state, baseline_features, field_history, agronomic
    )
    baseline_optimization = (
        _run_optimizer(
            field_state,
            crops,
            baseline_features,
            field_history,
            options,
            environmental_history=environmental_history,
        )
        if run_milp
        else None
    )
    try:
        from src.rl.crop_rotation_rl import run_reinforcement_learning_policy
        baseline_rl = (
            run_reinforcement_learning_policy(
                field_state=field_state,
                crops=crops,
                features=baseline_features,
                environmental_history=environmental_history,
                priority=options.get("priority", "balanced") if isinstance(options, dict) else "balanced",
            )
            if crops is not None
            else None
        )
    except Exception:
        baseline_rl = None

    scenario_results = {}
    settings = _config(scenario_config)
    for name in selected_scenarios:
        applied = apply_scenario(
            name,
            field_state,
            baseline_features,
            config=scenario_config,
        )
        if applied["status"] == "not_applicable":
            scenario_results[name] = _comparison_result(
                applied,
                field_state,
                baseline_compatibility,
                None,
                baseline_optimization,
                None,
            )
            continue
        if name == "normal":
            scenario_compatibility = baseline_compatibility
            scenario_optimization = baseline_optimization
            scenario_rl = baseline_rl
        else:
            scenario_compatibility = _evaluate_compatibility(
                crops,
                applied["state"],
                applied["features"],
                field_history,
                agronomic,
            )
            scenario_env = None
            if environmental_history is not None:
                scenario_env = environmental_history.copy()
                if name == "heat":
                    if "T2M" in scenario_env.columns:
                        scenario_env["T2M"] = scenario_env["T2M"] + settings.heat_temperature_delta
                    if "T2M_MAX" in scenario_env.columns:
                        scenario_env["T2M_MAX"] = scenario_env["T2M_MAX"] + settings.heat_temperature_delta
                    if "T2M_MIN" in scenario_env.columns:
                        scenario_env["T2M_MIN"] = scenario_env["T2M_MIN"] + settings.heat_temperature_delta
                elif name == "drought":
                    if "PRECTOTCORR" in scenario_env.columns:
                        scenario_env["PRECTOTCORR"] = scenario_env["PRECTOTCORR"] * 0.4
                elif name == "low_water":
                    if "PRECTOTCORR" in scenario_env.columns:
                        scenario_env["PRECTOTCORR"] = scenario_env["PRECTOTCORR"] * settings.low_water_fraction

            scenario_optimization = (
                _run_optimizer(
                    applied["state"],
                    crops,
                    applied["features"],
                    field_history,
                    options,
                    environmental_history=scenario_env,
                )
                if run_milp
                else None
            )
            try:
                from src.rl.crop_rotation_rl import run_reinforcement_learning_policy
                scenario_rl = (
                    run_reinforcement_learning_policy(
                        field_state=applied["state"],
                        crops=crops,
                        features=applied["features"],
                        environmental_history=scenario_env,
                        priority=options.get("priority", "balanced") if isinstance(options, dict) else "balanced",
                    )
                    if crops is not None
                    else None
                )
            except Exception:
                scenario_rl = None

        result = _comparison_result(
            applied,
            field_state,
            baseline_compatibility,
            scenario_compatibility,
            baseline_optimization,
            scenario_optimization,
        )
        if scenario_optimization is not None:
            result["optimizer_status"] = scenario_optimization["status"]
            result["scenario_optimizer_result"] = scenario_optimization
        if scenario_rl is not None:
            base_rot = baseline_rl.get("trajectory_summary", {}).get("rotation_sequence") if baseline_rl else None
            scen_rot = scenario_rl.get("trajectory_summary", {}).get("rotation_sequence")
            result["rl_policy_result"] = {
                "rotation_sequence": scen_rot,
                "rotation_changed": base_rot != scen_rot if base_rot else False,
                "cumulative_reward": scenario_rl.get("trajectory_summary", {}).get("total_cumulative_reward"),
                "profit_bdt_per_ha": scenario_rl.get("trajectory_summary", {}).get("total_profit_bdt_per_ha"),
                "water_requirement_mm": scenario_rl.get("trajectory_summary", {}).get("total_water_requirement_mm"),
                "final_soil_health": scenario_rl.get("trajectory_summary", {}).get("final_soil_health"),
                "legume_fraction": scenario_rl.get("trajectory_summary", {}).get("legume_fraction"),
                "crop_diversity_count": scenario_rl.get("trajectory_summary", {}).get("crop_diversity_count"),
            }
        scenario_results[name] = result
    return {
        "status": "completed",
        "baseline": {
            "state": deepcopy(field_state),
            "features": baseline_features,
            "compatibility_by_crop": baseline_compatibility,
            "optimizer_result": baseline_optimization,
        },
        "scenarios": scenario_results,
        "provenance": {
            "baseline": {
                "environment_source": getattr(
                    field_state, "environment_source", "missing"
                ),
                "data_status": deepcopy(
                    getattr(field_state, "data_status", {})
                ),
            },
            "scenario_status": SCENARIO_DATA_STATUS,
            "scenario_source": SCENARIO_SOURCE,
            "interpretation": "hypothetical_what_if_not_forecast",
        },
    }
