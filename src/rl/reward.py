"""Reward validation boundary; measured management-outcome reward is unavailable."""

from copy import deepcopy
from dataclasses import dataclass
from types import MappingProxyType
from typing import Any, Mapping, Optional

import numpy as np
import pandas as pd

REWARD_STATUSES = (
    "unavailable",
    "invalid",
    "environment_numeric",
    "experimental_user_supplied",
)

@dataclass(frozen=True)
class OutcomeInputRequirement:
    name: str
    units: str
    evidence: str


OUTCOME_INPUT_REQUIREMENTS = (
    OutcomeInputRequirement(
        "measured_yield",
        "t/ha per field, crop, and harvest period",
        "Harvest measurement with field/crop/date and collection source.",
    ),
    OutcomeInputRequirement(
        "realized_revenue",
        "BDT/ha for the same field, crop, and accounting period",
        "Recorded sales, not crop-knowledge market-price metadata.",
    ),
    OutcomeInputRequirement(
        "recorded_production_cost",
        "BDT/ha for the same field, crop, and accounting period",
        "Documented realized costs, not bundled demo cost assumptions.",
    ),
    OutcomeInputRequirement(
        "measured_water_use",
        "mm/ha per management interval (or declared meter unit and area)",
        "Metered/applied quantity linked to field, date, and action.",
    ),
    OutcomeInputRequirement(
        "soil_health_change",
        "Metric-specific; same protocol and units at baseline/follow-up",
        "Independent repeated measurements with method and dates.",
    ),
    OutcomeInputRequirement(
        "management_action_outcomes",
        "Action-specific outcome interval and measurement units",
        "Actual action log linked to field, time, baseline, follow-up, and provenance.",
    ),
)


def _freeze(value: Any) -> Any:
    if isinstance(value, Mapping):
        return MappingProxyType(
            {deepcopy(key): _freeze(item) for key, item in value.items()}
        )
    if isinstance(value, (list, tuple)):
        return tuple(_freeze(item) for item in value)
    if isinstance(value, set):
        return frozenset(_freeze(item) for item in value)
    return deepcopy(value)


def _thaw(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {deepcopy(key): _thaw(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_thaw(item) for item in value]
    if isinstance(value, frozenset):
        return [_thaw(item) for item in value]
    return deepcopy(value)


@dataclass(frozen=True)
class RewardAssessment:
    """Immutable numerical validation result; not agronomic validation."""

    status: str
    value: Optional[float]
    source: str
    units: Optional[str]
    provenance: Mapping[str, Any]
    reason: str

    def __post_init__(self) -> None:
        if self.status not in REWARD_STATUSES:
            raise ValueError("Unknown reward assessment status.")
        if not isinstance(self.provenance, Mapping):
            raise TypeError("Reward provenance must be a mapping.")
        if self.status in {"environment_numeric", "experimental_user_supplied"}:
            if isinstance(self.value, (bool, np.bool_)) or not isinstance(
                self.value, (int, float, np.integer, np.floating)
            ):
                raise ValueError("Available reward assessments require a numeric value.")
            numeric = float(self.value)
            if not np.isfinite(numeric):
                raise ValueError("Available reward assessments require a finite value.")
            expected_source = (
                "environment"
                if self.status == "environment_numeric"
                else "user_supplied"
            )
            if self.source != expected_source:
                raise ValueError("Reward assessment status and source do not match.")
            object.__setattr__(self, "value", numeric)
        elif self.value is not None:
            raise ValueError("Unavailable or invalid assessments cannot contain a value.")
        object.__setattr__(self, "provenance", _freeze(self.provenance))

    @property
    def available(self) -> bool:
        return self.value is not None and self.status in {
            "environment_numeric",
            "experimental_user_supplied",
        }

    @property
    def experimental(self) -> bool:
        return self.status == "experimental_user_supplied"

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "value": self.value,
            "source": self.source,
            "units": self.units,
            "provenance": _thaw(self.provenance),
            "reason": self.reason,
            "agronomic_validation": "not_established",
        }


def validate_reward(
    value: Any,
    *,
    source: str,
    provenance: Optional[Mapping[str, Any]] = None,
    units: Optional[str] = None,
    reason: Optional[str] = None,
) -> RewardAssessment:
    """Validate reward availability and numeric finiteness without imputation.

    Accepted sources are ``environment`` and ``user_supplied``. A finite
    user-supplied number is explicitly experimental. A finite environment
    number is only numerically valid; this function does not establish that
    its inputs or agronomic interpretation are valid. MILP objectives/plans
    are not accepted as reward sources.
    """
    if not isinstance(source, str) or source not in {"environment", "user_supplied"}:
        return RewardAssessment(
            status="invalid",
            value=None,
            source=str(source),
            units=units,
            provenance=provenance if isinstance(provenance, Mapping) else {},
            reason=(
                "Reward source must be 'environment' or 'user_supplied'; "
                "planning objectives are not rewards."
            ),
        )
    if provenance is None:
        provenance = {}
    if not isinstance(provenance, Mapping):
        return RewardAssessment(
            status="invalid",
            value=None,
            source=source,
            units=units,
            provenance={},
            reason="Reward provenance must be a mapping.",
        )

    if value is None or value is pd.NA:
        return RewardAssessment(
            status="unavailable",
            value=None,
            source=source,
            units=units,
            provenance=provenance,
            reason=reason or "Reward value is unavailable; no zero was substituted.",
        )
    if isinstance(value, (bool, np.bool_)) or not isinstance(
        value, (int, float, np.integer, np.floating)
    ):
        return RewardAssessment(
            status="invalid",
            value=None,
            source=source,
            units=units,
            provenance=provenance,
            reason=reason
            or "Reward must be a finite numeric scalar (non_numeric).",
        )
    numeric = float(value)
    if not np.isfinite(numeric):
        return RewardAssessment(
            status="invalid",
            value=None,
            source=source,
            units=units,
            provenance=provenance,
            reason=reason or "Reward must be finite (non_finite).",
        )
    return RewardAssessment(
        status=(
            "experimental_user_supplied"
            if source == "user_supplied"
            else "environment_numeric"
        ),
        value=numeric,
        source=source,
        units=units,
        provenance=provenance,
        reason=reason
        or (
            "Finite caller-supplied value; experimental and not agronomically validated."
            if source == "user_supplied"
            else "Finite environment value; numeric validity only, outcome validity not established."
        ),
    )


REWARD_COMPONENTS = (
    "economic_return",
    "legume_rotation_proxy",
    "water_use",
    "climate_compatibility",
    "incompatibility_penalty",
    "invalid_action_penalty",
)


@dataclass(frozen=True)
class RewardConfig:
    """Weights for normalized prototype signals; not a validated success metric."""

    economic_weight: float = 0.35
    soil_proxy_weight: float = 0.20
    water_use_weight: float = 0.20
    climate_stress_weight: float = 0.15
    incompatibility_penalty_weight: float = 0.05
    invalid_action_penalty_weight: float = 0.05
    incompatible_action_penalty: float = 1.0
    invalid_action_penalty: float = 1.0

    def __post_init__(self) -> None:
        try:
            weights = [
                float(self.economic_weight),
                float(self.soil_proxy_weight),
                float(self.water_use_weight),
                float(self.climate_stress_weight),
                float(self.incompatibility_penalty_weight),
                float(self.invalid_action_penalty_weight),
            ]
            penalties = [
                float(self.incompatible_action_penalty),
                float(self.invalid_action_penalty),
            ]
        except (TypeError, ValueError) as error:
            raise ValueError("Reward weights and penalty magnitudes must be numeric.") from error
        if any(not np.isfinite(value) or value < 0 for value in weights):
            raise ValueError("Reward weights must be finite and non-negative.")
        if any(not np.isfinite(value) or value < 0 for value in penalties):
            raise ValueError("Reward penalty magnitudes must be finite and non-negative.")
        if sum(weights) <= 0:
            raise ValueError("At least one reward weight must be positive.")

    def weights(self) -> dict[str, float]:
        return {
            "economic_return": float(self.economic_weight),
            "legume_rotation_proxy": float(self.soil_proxy_weight),
            "water_use": float(self.water_use_weight),
            "climate_compatibility": float(self.climate_stress_weight),
            "incompatibility_penalty": float(self.incompatibility_penalty_weight),
            "invalid_action_penalty": float(self.invalid_action_penalty_weight),
        }


def calculate_reward(
    crop: Optional[Mapping[str, Any]],
    compatibility: Optional[Mapping[str, Any]],
    crops,
    config: Optional[RewardConfig] = None,
    invalid_action: bool = False,
) -> dict[str, Any]:
    """Return an unavailable assessment instead of synthesizing a reward.

    Retained for compatibility with the earlier helper signature. Crop
    metadata, agronomic compatibility, and action penalties are not measured
    farm outcomes and cannot provide the RL environment's reward.
    """
    del crop, compatibility, crops, invalid_action
    if config is None:
        config = RewardConfig()
    if not isinstance(config, RewardConfig):
        raise TypeError("config must be a RewardConfig instance or None.")
    return {
        "reward": None,
        "components": {name: None for name in REWARD_COMPONENTS},
        "component_status": {name: "unavailable" for name in REWARD_COMPONENTS},
        "requested_weights": config.weights(),
        "effective_weights": {name: 0.0 for name in REWARD_COMPONENTS},
        "provenance": {
            "source": "no_validated_management_outcome",
            "data_status": "unavailable",
        },
        "reward_status": "unavailable",
        "units": None,
        "reason": (
            "Crop metadata, agronomic rules, and action penalties are not "
            "measured outcomes; no reward was generated."
        ),
    }
