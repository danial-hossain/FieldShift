"""Alternative crop-rotation strategies using Phase 7 MILP optimization."""

from collections.abc import Mapping
from typing import Any, Optional, Sequence

import numpy as np
import pandas as pd

from src.optimizer.milp import optimize_rotation

DEFAULT_PRIORITY_PROFILES = {
    "profit_focused": {"profit": 0.7, "water": 0.2, "soil": 0.1},
    "water_focused": {"profit": 0.2, "water": 0.6, "soil": 0.2},
    "soil_focused": {"profit": 0.2, "water": 0.2, "soil": 0.6},
    "balanced": {"profit": 0.34, "water": 0.33, "soil": 0.33},
}
WEIGHT_NAMES = ("profit", "water", "soil")


def _profiles(
    priority_profiles: Optional[Mapping[str, Mapping[str, Any]]],
) -> dict[str, dict[str, float]]:
    supplied = (
        DEFAULT_PRIORITY_PROFILES
        if priority_profiles is None
        else priority_profiles
    )
    if not isinstance(supplied, Mapping) or not supplied:
        raise ValueError("priority_profiles must be a non-empty mapping.")

    profiles = {}
    for name, raw_weights in supplied.items():
        if not isinstance(name, str) or not name.strip():
            raise ValueError("Each priority profile must have a non-empty name.")
        normalized_name = name.strip()
        if normalized_name in profiles:
            raise ValueError("Priority profile names must be unique after trimming.")
        if not isinstance(raw_weights, Mapping):
            raise ValueError(f"Weights for '{name}' must be a mapping.")
        if set(raw_weights) != set(WEIGHT_NAMES):
            raise ValueError(
                f"Weights for '{name}' must contain exactly profit, water, and soil."
            )
        weights = {}
        for component in WEIGHT_NAMES:
            value = raw_weights[component]
            if isinstance(value, bool):
                raise ValueError(f"The {component} weight for '{name}' must be numeric.")
            try:
                weight = float(value)
            except (TypeError, ValueError) as error:
                raise ValueError(
                    f"The {component} weight for '{name}' must be numeric."
                ) from error
            if not np.isfinite(weight) or weight < 0:
                raise ValueError(
                    f"The {component} weight for '{name}' must be finite and non-negative."
                )
            weights[component] = weight
        if sum(weights.values()) <= 0:
            raise ValueError(f"Priority profile '{name}' needs a positive weight.")
        profiles[normalized_name] = weights
    return profiles


def _legume_interval(
    agronomic_config: Optional[Any],
) -> Optional[int]:
    if agronomic_config is None:
        return None
    if isinstance(agronomic_config, Mapping):
        unknown = set(agronomic_config) - {"legume_interval_seasons"}
        if unknown:
            raise ValueError(
                "Unsupported agronomic configuration: " + ", ".join(sorted(unknown))
            )
        value = agronomic_config.get("legume_interval_seasons")
    else:
        value = getattr(agronomic_config, "legume_interval_seasons", None)
    if value is None:
        raise ValueError(
            "agronomic_config must provide legume_interval_seasons."
        )
    if (
        isinstance(value, bool)
        or not isinstance(value, (int, np.integer))
        or value < 1
    ):
        raise ValueError("legume_interval_seasons must be a positive integer.")
    return int(value)


def _optimizer_arguments(optimizer_options: Optional[Mapping[str, Any]]) -> dict[str, Any]:
    if optimizer_options is None:
        return {}
    if not isinstance(optimizer_options, Mapping):
        raise TypeError("optimizer_options must be a mapping.")
    reserved = {
        "field_state",
        "crops",
        "features",
        "field_history",
        "planning_periods",
        "legume_interval_seasons",
        "profit_weight",
        "water_weight",
        "soil_weight",
    }
    conflict = reserved.intersection(optimizer_options)
    if conflict:
        raise ValueError(
            "Pass core inputs and profile weights through their dedicated arguments: "
            + ", ".join(sorted(conflict))
        )
    return dict(optimizer_options)


def _comparison_entry(name: str, result: Mapping[str, Any]) -> dict[str, Any]:
    rotation = result["selected_crop_by_period"]
    return {
        "strategy_name": name,
        "weights": result["requested_weights"].copy(),
        "rotation": dict(rotation) if rotation is not None else None,
        "profit_component": result["profit_component"],
        "water_component": result["water_component"],
        "soil_component": result["soil_component"],
        "status": result["status"],
        "solver_status": result["solver_status"],
    }


def generate_rotation_strategies(
    field_state,
    crops: Optional[pd.DataFrame] = None,
    features: Optional[Mapping[str, Any]] = None,
    field_history=None,
    priority_profiles: Optional[Mapping[str, Mapping[str, Any]]] = None,
    planning_periods: Optional[Sequence[str]] = None,
    agronomic_config: Optional[Any] = None,
    optimizer_options: Optional[Mapping[str, Any]] = None,
) -> dict[str, Any]:
    """Run Phase 7 once per ordered profile and compare objective trade-offs.

    Profile weights are prototype scenario assumptions, not asserted farmer
    preferences. All optimization constraints, normalization, missing-data
    handling, and provenance continue to come from the Phase 7 optimizer.
    """
    profiles = _profiles(priority_profiles)
    legume_interval = _legume_interval(agronomic_config)
    options = _optimizer_arguments(optimizer_options)
    if planning_periods is not None:
        options["planning_periods"] = planning_periods
    if legume_interval is not None:
        options["legume_interval_seasons"] = legume_interval

    strategies = {}
    comparison = {}
    rotations_seen = {}
    first_result = None
    for name, weights in profiles.items():
        try:
            result = optimize_rotation(
                field_state=field_state,
                crops=crops,
                features=features,
                field_history=field_history,
                profit_weight=weights["profit"],
                water_weight=weights["water"],
                soil_weight=weights["soil"],
                **options,
            )
        except ValueError as error:
            if "No positively weighted objective component has complete crop metadata." not in str(error):
                raise
            result = {
                "status": "not_solved",
                "solver_status": "InputError",
                "planning_periods": list(planning_periods or []),
                "selected_crop_by_period": None,
                "objective_value": None,
                "profit_component": None,
                "water_component": None,
                "soil_component": None,
                "normalized_components": None,
                "weights": {
                    "requested": weights.copy(),
                    "effective": {component: 0.0 for component in WEIGHT_NAMES},
                },
                "constraint_summary": {
                    "input_error": str(error),
                },
                "data_status": {
                    "objective_components": "unavailable_required_metadata"
                },
                "provenance": {
                    "strategy_weights": {
                        "source": "caller_supplied"
                        if priority_profiles is not None
                        else "prototype_default_assumptions",
                        "data_status": "assumption",
                    }
                },
                "objective_label": "not_solved_due_to_missing_objective_metadata",
            }
        if first_result is None:
            first_result = result

        strategy = dict(result)
        strategy["strategy_name"] = name
        strategy["requested_weights"] = weights.copy()
        strategy["effective_weights"] = result.get("weights", {}).get(
            "effective", {}
        ).copy()
        strategy["same_rotation_as"] = None
        rotation = result.get("selected_crop_by_period")
        if rotation is not None:
            rotation_key = tuple(rotation.items())
            if rotation_key in rotations_seen:
                strategy["same_rotation_as"] = rotations_seen[rotation_key]
            else:
                rotations_seen[rotation_key] = name
        strategies[name] = strategy
        comparison[name] = _comparison_entry(name, strategy)

    provenance = dict(first_result.get("provenance", {}))
    provenance["strategy_weights"] = {
        "source": "caller_supplied"
        if priority_profiles is not None
        else "prototype_default_assumptions",
        "data_status": "assumption",
    }
    return {
        "status": "completed",
        "strategies": strategies,
        "comparison": comparison,
        "data_status": first_result.get("data_status", {}),
        "provenance": provenance,
    }
