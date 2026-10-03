"""Deterministic, observation-driven management environment for FieldShift.

This module models decision mechanics only. It does not control equipment,
predict outcomes, or calculate a farm-success reward.
"""

from copy import deepcopy
from dataclasses import dataclass
from typing import Any, Mapping, Optional

import numpy as np
import pandas as pd

from src.data.nasa_power import DATA_COLUMNS
from src.preprocessing.features import build_features

BASE_ACTIONS = ("no_intervention", "inspect_reassess")
IRRIGATION_CAPACITY_FEATURE = "irrigation_capacity_mm"
OBSERVATION_FEATURES = (
    "temperature",
    "temp_max",
    "temp_min",
    "rainfall",
    "recent_mean_temperature",
    "temperature_change",
    "recent_mean_rainfall",
    "rainfall_change",
    "soil_moisture",
    "recent_mean_soil_moisture",
    "soil_moisture_change",
    "nitrogen",
    "phosphorus",
    "potassium",
    "ph",
    "heat_stress_indicator",
    "water_stress_indicator",
    "available_water_mm",
    IRRIGATION_CAPACITY_FEATURE,
)


@dataclass(frozen=True)
class EnvironmentConfig:
    """Episode length for the deterministic, non-predictive transition model."""

    max_steps: int = 6

    def __post_init__(self) -> None:
        if (
            isinstance(self.max_steps, bool)
            or not isinstance(self.max_steps, int)
            or self.max_steps < 1
        ):
            raise ValueError("max_steps must be a positive integer.")


def _number(value: Any) -> Optional[float]:
    if value is None or value is pd.NA:
        return None
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    if not np.isfinite(result) or result == -999:
        return None
    return result


def _clean(value: Any) -> Any:
    """Convert state/context values to stable, JSON-friendly Python values."""
    if isinstance(value, Mapping):
        return {str(key): _clean(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_clean(item) for item in value]
    if isinstance(value, (pd.Timestamp,)):
        return value.date().isoformat()
    if isinstance(value, (np.bool_, bool)):
        return bool(value)
    if isinstance(value, (np.integer, int)):
        return int(value)
    if isinstance(value, (np.floating, float)):
        return _number(value)
    if value is None or value is pd.NA:
        return None
    return value


def _prepare_environment_history(history: Optional[pd.DataFrame]) -> pd.DataFrame:
    if history is None:
        return pd.DataFrame(columns=DATA_COLUMNS)
    if not isinstance(history, pd.DataFrame):
        raise TypeError("environmental_history must be a pandas DataFrame or None.")
    missing = [column for column in DATA_COLUMNS if column not in history.columns]
    if missing:
        raise ValueError(
            "Environmental history is missing columns: " + ", ".join(missing)
        )
    frame = history[DATA_COLUMNS].copy()
    frame["date"] = pd.to_datetime(frame["date"], errors="coerce").dt.normalize()
    if frame["date"].isna().any():
        raise ValueError("Environmental history contains invalid dates.")
    for name in DATA_COLUMNS[1:]:
        frame[name] = pd.to_numeric(frame[name], errors="coerce")
        frame[name] = frame[name].mask(frame[name] == -999)
    frame = frame.loc[frame[DATA_COLUMNS[1:]].notna().any(axis=1)]
    return (
        frame.sort_values("date", kind="stable")
        .drop_duplicates("date", keep="last")
        .reset_index(drop=True)
    )


class FieldShiftEnvironment:
    """Sequential field-management simulator using supplied observations only.

    ``reset(initial_state=None, seed=None)`` returns ``(observation, info)``.
    ``step(action)`` returns ``(observation, reward, terminated, truncated,
    info)``. Supported action IDs are ``no_intervention`` and
    ``inspect_reassess``. An ``irrigation_adjustment`` proposal is available
    only when caller-provided features contain a finite positive
    ``irrigation_capacity_mm``; its requested amount must be supplied in the
    action and within that capacity. Proposals are logged, not applied to
    field state or equipment.

    Reward is ``None`` because FieldShift has no validated outcome model from
    which to calculate a defensible farm-management reward.
    """

    def __init__(
        self,
        field_state=None,
        environmental_history: Optional[pd.DataFrame] = None,
        features: Optional[Mapping[str, Any]] = None,
        config: Optional[EnvironmentConfig] = None,
        step_limit: Optional[int] = None,
    ) -> None:
        if field_state is not None and (
            not hasattr(field_state, "to_dict")
            or not hasattr(field_state, "as_of_date")
        ):
            raise TypeError("field_state must provide the FieldState interface.")
        if config is None:
            config = EnvironmentConfig()
        if not isinstance(config, EnvironmentConfig):
            raise TypeError("config must be an EnvironmentConfig instance.")
        if step_limit is not None and (
            isinstance(step_limit, bool)
            or not isinstance(step_limit, int)
            or step_limit < 1
        ):
            raise ValueError("step_limit must be a positive integer or None.")
        if features is not None and not isinstance(features, Mapping):
            raise TypeError("features must be a mapping or None.")

        self._initial_state = deepcopy(field_state)
        self._environment_history = _prepare_environment_history(
            environmental_history
        )
        self._initial_features = deepcopy(dict(features or {}))
        self.config = config
        self.step_limit = step_limit
        self._state = None
        self._steps_taken = 0
        self._terminated = False
        self._truncated = False
        self._termination_reason = None
        self._actions_taken = []
        self._seed = None
        if self._initial_state is not None:
            self._reset(seed=None)

    def _validate_state(self, state):
        if not hasattr(state, "to_dict") or not hasattr(state, "as_of_date"):
            raise TypeError("initial_state must provide the FieldState interface.")
        return deepcopy(state)

    def _set_observations(self, state, supplemental_features) -> None:
        cutoff = pd.Timestamp(state.as_of_date).normalize()
        self._visible_environment = self._environment_history.loc[
            self._environment_history["date"].le(cutoff)
        ].copy().reset_index(drop=True)
        self._future_environment = self._environment_history.loc[
            self._environment_history["date"].gt(cutoff)
        ].copy().reset_index(drop=True)
        self._future_index = 0
        self._supplemental_features = deepcopy(supplemental_features)
        self._refresh_features()

    def _refresh_features(self) -> None:
        self._features = build_features(
            self._state,
            environmental_history=self._visible_environment,
        )
        for name, value in self._supplemental_features.items():
            if name != "provenance" and name not in self._features:
                self._features[name] = deepcopy(value)
        if "provenance" in self._supplemental_features:
            for name, value in self._supplemental_features["provenance"].items():
                if name not in self._features["provenance"]:
                    self._features["provenance"][name] = deepcopy(value)

    def _available_irrigation_capacity(self) -> Optional[float]:
        capacity = _number(self._features.get(IRRIGATION_CAPACITY_FEATURE))
        return capacity if capacity is not None and capacity > 0 else None

    def get_available_actions(self) -> list[dict[str, Any]]:
        actions = [
            {
                "action": "no_intervention",
                "description": "Advance to the next supplied observation without a management proposal.",
            },
            {
                "action": "inspect_reassess",
                "description": "Record a reassessment decision; no measurement or field value is fabricated.",
            },
        ]
        capacity = self._available_irrigation_capacity()
        if capacity is not None:
            actions.append(
                {
                    "action": "irrigation_adjustment",
                    "description": "Propose an irrigation amount; this does not operate equipment.",
                    "max_amount_mm": capacity,
                }
            )
        return actions

    def get_state(self) -> dict[str, Any]:
        return _clean(self._state.to_dict())

    def _feature_source(self, name: str) -> str:
        if name == IRRIGATION_CAPACITY_FEATURE:
            if _number(self._features.get(name)) is None:
                return "missing"
            return str(
                self._features.get("irrigation_context_source", "caller_supplied")
            )
        if name == "available_water_mm":
            if _number(self._features.get(name)) is None:
                return "missing"
            return str(self._features.get("available_water_source", "caller_supplied"))
        if name in {
            "soil_moisture",
            "recent_mean_soil_moisture",
            "soil_moisture_change",
            "water_stress_indicator",
        }:
            return self._state.soil_moisture_source
        if name in {"nitrogen", "phosphorus", "potassium", "ph"}:
            return self._state.soil_source
        if name in {
            "temperature",
            "temp_max",
            "temp_min",
            "rainfall",
            "recent_mean_temperature",
            "temperature_change",
            "recent_mean_rainfall",
            "rainfall_change",
            "heat_stress_indicator",
        }:
            return self._state.environment_source
        return "derived"

    def get_observation(self) -> dict[str, Any]:
        features = {
            name: self._features.get(name) for name in OBSERVATION_FEATURES
        }
        feature_provenance = self._features.get("provenance", {})
        provenance = {
            name: {
                "source": self._feature_source(name),
                "data_status": (
                    "missing"
                    if _number(features[name]) is None
                    else (
                        self._features.get("irrigation_context_status", "provided")
                        if name == IRRIGATION_CAPACITY_FEATURE
                        else (
                            feature_provenance.get(name, "provided")
                            if name == "available_water_mm"
                            else feature_provenance.get(name, "unknown")
                        )
                    )
                ),
            }
            for name in features
        }
        return {
            "state": self.get_state(),
            "features": _clean(features),
            "feature_order": OBSERVATION_FEATURES,
            "episode_context": {
                "current_step": self._steps_taken,
                "remaining_steps": max(0, self.config.max_steps - self._steps_taken),
            },
            "provenance": {
                "field_state": {
                    "environment_source": self._state.environment_source,
                    "environment_status": self._state.data_status.get(
                        "environment", "missing"
                    ),
                    "environment_observation_date": _clean(
                        self._state.environment_observation_date
                    ),
                    "soil_source": self._state.soil_source,
                    "soil_status": self._state.data_status.get("soil", "missing"),
                    "soil_moisture_source": self._state.soil_moisture_source,
                    "soil_moisture_status": self._state.data_status.get(
                        "soil_moisture", "missing"
                    ),
                },
                "features": provenance,
            },
            "missingness": {
                name: value is None for name, value in _clean(features).items()
            },
        }

    def _reset(self, seed=None, initial_state=None):
        if seed is not None and (
            isinstance(seed, bool) or not isinstance(seed, (int, np.integer))
        ):
            raise ValueError("seed must be an integer or None.")
        base = self._initial_state if initial_state is None else initial_state
        if base is None:
            raise ValueError("initial_state is required for reset.")
        self._seed = None if seed is None else int(seed)
        self._state = self._validate_state(base)
        self._set_observations(self._state, self._initial_features)
        self._steps_taken = 0
        self._terminated = False
        self._truncated = False
        self._termination_reason = None
        self._actions_taken = []
        return self.get_observation(), {
            "seed": self._seed,
            "available_actions": self.get_available_actions(),
            "reward_status": "unavailable_no_validated_outcome_model",
            "provenance": self.get_observation()["provenance"],
            "episode_summary": self.get_episode_summary(),
        }

    def reset(self, initial_state=None, seed=None):
        """Reset using the constructor state or a supplied FieldState copy."""
        return self._reset(seed=seed, initial_state=initial_state)

    def _validate_action(self, action) -> dict[str, Any]:
        if isinstance(action, str):
            descriptor = {"action": action}
        elif isinstance(action, Mapping):
            descriptor = dict(action)
        else:
            raise ValueError(
                "action must be a supported action ID or action mapping."
            )
        name = descriptor.get("action")
        supported = {entry["action"] for entry in self.get_available_actions()}
        if name not in supported:
            raise ValueError(
                f"Unsupported or unavailable action: {name!r}. "
                "Check get_available_actions()."
            )
        if name == "irrigation_adjustment":
            if set(descriptor) != {"action", "amount_mm"}:
                raise ValueError(
                    "irrigation_adjustment requires only action and amount_mm."
                )
            amount = descriptor["amount_mm"]
            if isinstance(amount, (bool, np.bool_)):
                raise ValueError("amount_mm must be a positive finite number.")
            amount_value = _number(amount)
            capacity = self._available_irrigation_capacity()
            if amount_value is None or amount_value <= 0:
                raise ValueError("amount_mm must be a positive finite number.")
            if capacity is None or amount_value > capacity:
                raise ValueError("amount_mm exceeds the supplied irrigation capacity.")
            return {"action": name, "amount_mm": amount_value}
        if set(descriptor) != {"action"}:
            raise ValueError(f"{name} does not accept additional parameters.")
        return {"action": name}

    def _state_summary(self) -> dict[str, Any]:
        observation = self.get_observation()
        return {
            "as_of_date": self.get_state()["as_of_date"],
            "field_state": self.get_state(),
            "features": observation["features"],
            "provenance": observation["provenance"],
        }

    def _advance_environment(self) -> dict[str, Any]:
        if self._future_index >= len(self._future_environment):
            return {}
        row = self._future_environment.iloc[self._future_index]
        self._future_index += 1
        before = self.get_state()
        mapping = {
            "temperature": "temperature",
            "temp_max": "temp_max",
            "temp_min": "temp_min",
            "rainfall": "rainfall",
            "humidity": "humidity",
            "wind_speed": "wind_speed",
            "solar_radiation": "solar_radiation",
        }
        for column, attribute in mapping.items():
            value = _number(row[column])
            setattr(
                self._state,
                attribute,
                float("nan") if value is None else value,
            )
        date = pd.Timestamp(row["date"]).normalize()
        self._state.as_of_date = date
        self._state.environment_observation_date = date
        self._state.environment_source = "NASA_POWER"
        self._state.data_status["environment"] = "observed"
        self._visible_environment = pd.concat(
            [self._visible_environment, row.to_frame().T],
            ignore_index=True,
        )
        self._visible_environment["date"] = pd.to_datetime(
            self._visible_environment["date"], errors="coerce"
        ).dt.normalize()
        self._visible_environment = (
            self._visible_environment.sort_values("date", kind="stable")
            .drop_duplicates("date", keep="last")
            .reset_index(drop=True)
        )
        self._refresh_features()
        after = self.get_state()
        changed = {}
        for name in mapping.values():
            if before[name] != after[name]:
                changed[name] = {
                    "before": before[name],
                    "after": after[name],
                    "source": "NASA_POWER",
                    "data_status": "observed"
                    if after[name] is not None
                    else "missing",
                }
        changed["as_of_date"] = {
            "before": before["as_of_date"],
            "after": after["as_of_date"],
            "source": "NASA_POWER",
            "data_status": "observed",
        }
        return changed

    def _termination(self) -> tuple[bool, bool, Optional[str]]:
        if self._steps_taken >= self.config.max_steps:
            return True, False, "configured_step_limit_reached"
        if self._future_index >= len(self._future_environment):
            return True, False, "historical_observations_exhausted"
        if self.step_limit is not None and self._steps_taken >= self.step_limit:
            return False, True, "external_step_limit_reached"
        return False, False, None

    def step(self, action):
        """Apply one supported action and advance at most one supplied record."""
        if self._terminated or self._truncated:
            raise RuntimeError("Episode has ended; call reset() before stepping again.")
        normalized_action = self._validate_action(action)
        previous = self._state_summary()
        action_name = normalized_action["action"]
        if action_name == "no_intervention":
            explanation = (
                "No management change was proposed; the next supplied observation "
                "is exposed if available."
            )
            proposal = None
        elif action_name == "inspect_reassess":
            explanation = (
                "Reassessment was recorded using currently available observations; "
                "no new inspection measurement was fabricated."
            )
            proposal = None
        else:
            explanation = (
                "An irrigation amount was proposed within caller-supplied capacity; "
                "the proposal is not an equipment command or applied measurement."
            )
            proposal = {
                "amount_mm": normalized_action["amount_mm"],
                "status": "proposal_not_applied",
                "capacity_mm": self._available_irrigation_capacity(),
                "source": self._features.get(
                    "irrigation_context_source", "caller_supplied"
                ),
                "data_status": self._features.get(
                    "irrigation_context_status", "provided"
                ),
            }

        changed_fields = self._advance_environment()
        self._steps_taken += 1
        terminated, truncated, reason = self._termination()
        self._terminated = terminated
        self._truncated = truncated
        self._termination_reason = reason
        next_state = self._state_summary()
        record = {
            "step": self._steps_taken,
            "action": deepcopy(normalized_action),
            "explanation": explanation,
            "reward": None,
            "reward_status": "unavailable_no_validated_outcome_model",
            "observation_date": next_state["as_of_date"],
        }
        self._actions_taken.append(record)
        info = {
            "action": deepcopy(normalized_action),
            "observation_date": next_state["as_of_date"],
            "action_proposal": proposal,
            "explanation": explanation,
            "previous_state": previous,
            "next_state": next_state,
            "changed_fields": changed_fields,
            "reward_status": "unavailable_no_validated_outcome_model",
            "provenance": next_state["provenance"],
            "available_actions": self.get_available_actions(),
            "terminated": terminated,
            "truncated": truncated,
            "termination_reason": reason,
            "episode_summary": self.get_episode_summary()
            if terminated or truncated
            else None,
        }
        return self.get_observation(), None, terminated, truncated, info

    def get_episode_summary(self) -> dict[str, Any]:
        return {
            "seed": self._seed,
            "steps": len(self._actions_taken),
            "actions": deepcopy(self._actions_taken),
            "total_reward": None,
            "reward_status": "unavailable_no_validated_outcome_model",
            "terminated": self._terminated,
            "truncated": self._truncated,
            "termination_reason": self._termination_reason,
            "provenance": self.get_observation()["provenance"]
            if self._state is not None
            else {},
        }
