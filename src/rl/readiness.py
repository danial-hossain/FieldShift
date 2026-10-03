"""Explicit readiness checks before prototyping a FieldShift RL algorithm.

The gate checks interfaces and caller-attested outcome evidence; it does not
independently verify datasets, validate an agronomic reward, or measure policy
performance.
"""

from collections.abc import Mapping
from copy import deepcopy
from dataclasses import dataclass
from inspect import signature
from math import isfinite
from types import MappingProxyType
from typing import Any, Optional

import numpy as np

from src.rl.environment import (
    BASE_ACTIONS,
    IRRIGATION_CAPACITY_FEATURE,
    OBSERVATION_FEATURES,
    EnvironmentConfig,
)
from src.rl.reward import RewardAssessment

READINESS_STATUSES = (
    "blocked_missing_outcome_evidence",
    "blocked_invalid_configuration",
    "experimental_only",
    "ready_for_algorithm_prototype",
)
MINIMUM_TRAINING_EPISODES = 2
MINIMUM_HELD_OUT_EPISODES = 2
MINIMUM_STEPS_PER_EPISODE = 2
SUPPORTED_MEASURED_OUTCOMES = {
    "measured_yield",
    "realized_revenue",
    "recorded_production_cost",
    "measured_water_use",
    "soil_health_change",
    "management_action_outcome",
}


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
class OutcomeEvidence:
    """Caller-attested evidence required to consider an algorithm prototype.

    Evidence values are assertions supplied by the caller. The readiness gate
    checks their shape and consistency, not their truth or scientific quality.
    """

    evidence_id: str
    source: str
    data_status: str
    outcome_name: str
    units: str
    sample_count: int
    missing_fraction: float
    coverage_assessed: bool
    coverage_adequate: bool
    covered_actions: tuple[str, ...]
    action_outcomes_observed: bool
    action_conditioned_transitions_observed: bool
    independent_training_episodes: int
    held_out_evaluation_episodes: int
    minimum_steps_per_episode: int
    evaluation_protocol: str
    provenance: Mapping[str, Any]

    def __post_init__(self) -> None:
        for name in (
            "evidence_id",
            "source",
            "data_status",
            "outcome_name",
            "units",
            "evaluation_protocol",
        ):
            value = getattr(self, name)
            if not isinstance(value, str) or not value.strip():
                raise ValueError(f"{name} must be a non-empty string.")
        if self.data_status.strip().lower() != "observed":
            raise ValueError("Outcome evidence data_status must be 'observed'.")
        if not isinstance(self.provenance, Mapping) or not self.provenance:
            raise ValueError("Outcome evidence requires non-empty provenance.")
        if not isinstance(self.covered_actions, (list, tuple)) or any(
            not isinstance(action, str) or not action.strip()
            for action in self.covered_actions
        ):
            raise ValueError("covered_actions must contain non-empty action IDs.")
        if len(set(self.covered_actions)) != len(self.covered_actions):
            raise ValueError("covered_actions must be unique.")
        for name in (
            "coverage_assessed",
            "coverage_adequate",
            "action_outcomes_observed",
            "action_conditioned_transitions_observed",
        ):
            if not isinstance(getattr(self, name), bool):
                raise ValueError(f"{name} must be a boolean.")
        for name in (
            "sample_count",
            "independent_training_episodes",
            "held_out_evaluation_episodes",
            "minimum_steps_per_episode",
        ):
            value = getattr(self, name)
            if isinstance(value, bool) or not isinstance(value, int) or value < 0:
                raise ValueError(f"{name} must be a non-negative integer.")
        if self.sample_count == 0:
            raise ValueError("sample_count must be positive.")
        if isinstance(self.missing_fraction, bool) or not isinstance(
            self.missing_fraction, (int, float, np.integer, np.floating)
        ):
            raise ValueError("missing_fraction must be a finite number in [0, 1].")
        missing_fraction = float(self.missing_fraction)
        if not isfinite(missing_fraction) or not 0 <= missing_fraction <= 1:
            raise ValueError("missing_fraction must be a finite number in [0, 1].")
        object.__setattr__(self, "missing_fraction", missing_fraction)
        object.__setattr__(self, "covered_actions", tuple(self.covered_actions))
        object.__setattr__(self, "provenance", _freeze(self.provenance))

    @classmethod
    def from_mapping(cls, value: Mapping[str, Any]) -> "OutcomeEvidence":
        if not isinstance(value, Mapping):
            raise TypeError("outcome_evidence must be an OutcomeEvidence or mapping.")
        allowed = cls.__dataclass_fields__
        unknown = set(value) - set(allowed)
        missing = set(allowed) - set(value)
        if unknown or missing:
            details = []
            if missing:
                details.append("missing fields: " + ", ".join(sorted(missing)))
            if unknown:
                details.append("unknown fields: " + ", ".join(sorted(unknown)))
            raise ValueError("Invalid outcome evidence (" + "; ".join(details) + ").")
        return cls(**dict(value))


@dataclass(frozen=True)
class ReadinessReport:
    status: str
    api_valid: bool
    observation_schema_valid: bool
    action_schema_valid: bool
    reward_classification: str
    outcome_evidence_status: str
    checks: Mapping[str, Any]
    reasons: tuple[str, ...]

    def __post_init__(self) -> None:
        if self.status not in READINESS_STATUSES:
            raise ValueError("Unknown RL readiness status.")
        object.__setattr__(self, "checks", _freeze(self.checks))
        object.__setattr__(self, "reasons", tuple(self.reasons))

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "api_valid": self.api_valid,
            "observation_schema_valid": self.observation_schema_valid,
            "action_schema_valid": self.action_schema_valid,
            "reward_classification": self.reward_classification,
            "outcome_evidence_status": self.outcome_evidence_status,
            "checks": _thaw(self.checks),
            "reasons": list(self.reasons),
            "policy_performance_validation": "not_performed",
            "agronomic_effectiveness": "not_established",
        }


def _numeric_or_missing(value: Any) -> bool:
    return value is None or (
        not isinstance(value, (bool, np.bool_))
        and isinstance(value, (int, float, np.integer, np.floating))
        and isfinite(float(value))
    )


def _accepts_call(function: Any, *args: Any, **kwargs: Any) -> bool:
    try:
        signature(function).bind(*args, **kwargs)
    except (TypeError, ValueError):
        return False
    return True


def _observation_issues(observation: Any) -> list[str]:
    issues = []
    if not isinstance(observation, Mapping):
        return ["get_observation() must return a mapping."]
    state = observation.get("state")
    features = observation.get("features")
    provenance = observation.get("provenance")
    missingness = observation.get("missingness")
    if not isinstance(state, Mapping):
        issues.append("observation.state must be a mapping.")
    else:
        if not all(
            isinstance(state.get(name), str) and state.get(name)
            for name in ("field_id", "as_of_date")
        ):
            issues.append(
                "observation.state must include field_id and as_of_date strings."
            )
        for name in (
            "latitude",
            "longitude",
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
            "previous_yield",
        ):
            if name in state and not _numeric_or_missing(state[name]):
                issues.append(f"observation.state.{name} must be finite numeric or None.")
        for name in (
            "texture",
            "previous_crop",
            "previous_crop_family",
            "previous_irrigation",
            "previous_crop_season",
        ):
            if name in state and state[name] is not None and not isinstance(
                state[name], str
            ):
                issues.append(f"observation.state.{name} must be a string or None.")
        if "previous_crop_is_legume" in state and state[
            "previous_crop_is_legume"
        ] is not None and not isinstance(state["previous_crop_is_legume"], bool):
            issues.append(
                "observation.state.previous_crop_is_legume must be boolean or None."
            )
        if "data_status" in state and not isinstance(state["data_status"], Mapping):
            issues.append("observation.state.data_status must be a mapping.")
    if not isinstance(features, Mapping):
        issues.append("observation.features must be a mapping.")
    else:
        if set(features) != set(OBSERVATION_FEATURES):
            issues.append("observation.features keys do not match OBSERVATION_FEATURES.")
        for name, value in features.items():
            if not _numeric_or_missing(value):
                issues.append(f"observation feature {name!r} must be finite numeric or None.")
        feature_order = observation.get("feature_order")
        if not isinstance(feature_order, (list, tuple)) or tuple(
            feature_order
        ) != OBSERVATION_FEATURES:
            issues.append("observation.feature_order does not match the documented order.")
    if not isinstance(provenance, Mapping):
        issues.append("observation.provenance must be a mapping.")
    else:
        feature_provenance = provenance.get("features")
        if not isinstance(feature_provenance, Mapping):
            issues.append("observation.provenance.features must be a mapping.")
        elif set(feature_provenance) != set(OBSERVATION_FEATURES):
            issues.append("feature provenance keys do not match OBSERVATION_FEATURES.")
        else:
            for name, item in feature_provenance.items():
                if (
                    not isinstance(item, Mapping)
                    or not isinstance(item.get("source"), str)
                    or not isinstance(item.get("data_status"), str)
                ):
                    issues.append(
                        f"feature provenance for {name!r} needs source and data_status."
                    )
    if not isinstance(missingness, Mapping):
        issues.append("observation.missingness must be a mapping.")
    elif isinstance(features, Mapping):
        if set(missingness) != set(features):
            issues.append("observation.missingness keys do not match features.")
        else:
            for name, value in features.items():
                if missingness.get(name) is not (value is None):
                    issues.append(f"missingness for {name!r} conflicts with its value.")
    if not isinstance(observation.get("episode_context"), Mapping):
        issues.append("observation.episode_context must be a mapping.")
    return issues


def _action_issues(actions: Any, observation: Mapping[str, Any]) -> list[str]:
    if not isinstance(actions, (list, tuple)) or not actions:
        return ["get_available_actions() must return a non-empty action sequence."]
    issues = []
    names = []
    for action in actions:
        if not isinstance(action, Mapping):
            issues.append("Each available action must be a mapping.")
            continue
        name = action.get("action")
        if not isinstance(name, str) or not name:
            issues.append("Each action requires a non-empty action ID.")
            continue
        names.append(name)
        if not isinstance(action.get("description"), str) or not action["description"]:
            issues.append(f"Action {name!r} requires a description.")
        if name in BASE_ACTIONS:
            if set(action) != {"action", "description"}:
                issues.append(f"Base action {name!r} has unexpected parameters.")
        elif name == "irrigation_adjustment":
            capacity = observation.get("features", {}).get(
                IRRIGATION_CAPACITY_FEATURE
            )
            maximum = action.get("max_amount_mm")
            if (
                not _numeric_or_missing(capacity)
                or capacity is None
                or capacity <= 0
                or not _numeric_or_missing(maximum)
                or maximum != capacity
                or set(action) != {"action", "description", "max_amount_mm"}
            ):
                issues.append(
                    "irrigation_adjustment must match a finite positive supplied capacity."
                )
        else:
            issues.append(f"Unsupported action ID {name!r}.")
    if len(set(names)) != len(names):
        issues.append("Available action IDs must be unique.")
    if not set(BASE_ACTIONS).issubset(names):
        issues.append("Required base actions are missing.")
    capacity = observation.get("features", {}).get(IRRIGATION_CAPACITY_FEATURE)
    has_irrigation = "irrigation_adjustment" in names
    if _numeric_or_missing(capacity) and capacity is not None and capacity > 0:
        if not has_irrigation:
            issues.append("Positive irrigation capacity requires its proposal action.")
    elif has_irrigation:
        issues.append("Irrigation proposal is unavailable without positive capacity.")
    return issues


def _contains_forbidden_planning_data(value: Any) -> bool:
    forbidden = {"milp", "objective", "planned_rotation", "planning_context"}
    if isinstance(value, Mapping):
        for key, item in value.items():
            if str(key).strip().lower() in forbidden:
                return True
            if _contains_forbidden_planning_data(item):
                return True
    elif isinstance(value, (list, tuple, set, frozenset)):
        return any(_contains_forbidden_planning_data(item) for item in value)
    return False


def _contains_non_observed_data_status(value: Any) -> bool:
    if isinstance(value, Mapping):
        for key, item in value.items():
            if str(key).strip().lower() == "data_status":
                statuses = (
                    item.values()
                    if isinstance(item, Mapping)
                    else item
                    if isinstance(item, (list, tuple, set, frozenset))
                    else (item,)
                )
                if any(
                    isinstance(status, str)
                    and status.strip().lower() in {"demo", "synthetic", "missing", "unknown"}
                    for status in statuses
                ):
                    return True
            if _contains_non_observed_data_status(item):
                return True
    elif isinstance(value, (list, tuple, set, frozenset)):
        return any(_contains_non_observed_data_status(item) for item in value)
    return False


def _evidence_issues(
    evidence: OutcomeEvidence,
    reward: RewardAssessment,
    action_ids: set[str],
    environment_supports_action_conditioned_transitions: bool,
) -> list[str]:
    issues = []
    if evidence.source.strip().lower() in {"milp", "crop_knowledge", "synthetic"}:
        issues.append("MILP plans and crop metadata are not outcome evidence.")
    normalized_outcome_name = evidence.outcome_name.strip().lower().replace(" ", "_")
    if normalized_outcome_name not in SUPPORTED_MEASURED_OUTCOMES:
        issues.append(
            "Outcome evidence must identify a measured agronomic or management "
            "outcome, not environmental context."
        )
    if _contains_forbidden_planning_data(evidence.provenance):
        issues.append("Outcome provenance must not use MILP objectives or plans.")
    if _contains_non_observed_data_status(evidence.provenance):
        issues.append("Outcome provenance must not identify demo, synthetic, or missing data.")
    if evidence.coverage_assessed is not True or evidence.coverage_adequate is not True:
        issues.append("Outcome-data coverage must be assessed and attested adequate.")
    if evidence.missing_fraction >= 1:
        issues.append("Outcome evidence contains no non-missing outcome values.")
    if evidence.action_outcomes_observed is not True:
        issues.append("Measured outcomes must be linked to recorded management actions.")
    if not action_ids.issubset(set(evidence.covered_actions)):
        issues.append("Outcome evidence must cover every currently available action.")
    if (
        evidence.action_conditioned_transitions_observed is not True
        or not environment_supports_action_conditioned_transitions
    ):
        issues.append(
            "Action-conditioned transitions must be supported by the environment "
            "and observed evidence."
        )
    if evidence.independent_training_episodes < MINIMUM_TRAINING_EPISODES:
        issues.append(
            f"At least {MINIMUM_TRAINING_EPISODES} independent training episodes "
            "are required for an algorithm prototype."
        )
    if evidence.held_out_evaluation_episodes < MINIMUM_HELD_OUT_EPISODES:
        issues.append(
            f"At least {MINIMUM_HELD_OUT_EPISODES} held-out evaluation episodes "
            "are required."
        )
    if evidence.minimum_steps_per_episode < MINIMUM_STEPS_PER_EPISODE:
        issues.append(
            f"Evidence must support at least {MINIMUM_STEPS_PER_EPISODE} "
            "decision steps per episode."
        )
    if not evidence.evaluation_protocol.strip():
        issues.append("A held-out policy-evaluation protocol is required.")
    reward_provenance = reward.provenance
    if reward.provenance.get("evidence_id") != evidence.evidence_id:
        issues.append("Numeric reward provenance must reference the evidence_id.")
    if reward.units != evidence.units:
        issues.append("Numeric reward units must match the measured outcome units.")
    if _contains_forbidden_planning_data(reward_provenance):
        issues.append("Reward provenance must not use MILP objectives or plans.")
    if _contains_non_observed_data_status(reward_provenance):
        issues.append("Reward provenance must identify observed data, not demo or synthetic data.")
    return issues


def assess_learning_readiness(
    environment: Any,
    reward: Optional[RewardAssessment] = None,
    outcome_evidence: Optional[OutcomeEvidence | Mapping[str, Any]] = None,
) -> ReadinessReport:
    """Assess whether a FieldShift-compatible environment can host an RL prototype.

    The check is read-only: it inspects ``get_observation()`` and
    ``get_available_actions()`` without calling reset or step. A ready status
    requires a finite environment reward tied to observed outcomes, measured
    action-conditioned transitions, every available action represented in the
    evidence, and minimum train/held-out episode declarations. Those evidence
    declarations are caller-attested and not independently audited here.
    """
    reasons = []
    checks: dict[str, Any] = {
        "reward_numerically_valid": False,
        "reward_supported_by_measured_outcomes": False,
        "action_conditioned_transitions_supported": False,
        "episode_evidence_sufficient_for_prototype": False,
        "policy_performance_validated": False,
        "milp_objective_used_as_reward": False,
    }
    api_issues = []
    observation = None
    actions = None
    config = getattr(environment, "config", None)
    reset = getattr(environment, "reset", None)
    if not callable(reset):
        api_issues.append("environment.reset must be callable.")
    elif not _accepts_call(reset, seed=0):
        api_issues.append("environment.reset must accept the Phase 10 seed keyword.")
    step = getattr(environment, "step", None)
    if not callable(step):
        api_issues.append("environment.step must be callable.")
    elif not _accepts_call(step, "readiness_probe"):
        api_issues.append("environment.step must accept one action argument.")
    get_observation = getattr(environment, "get_observation", None)
    if not callable(get_observation):
        api_issues.append("environment.get_observation must be callable.")
    elif not _accepts_call(get_observation):
        api_issues.append("environment.get_observation must not require arguments.")
    get_available_actions = getattr(environment, "get_available_actions", None)
    if not callable(get_available_actions):
        api_issues.append("environment.get_available_actions must be callable.")
    elif not _accepts_call(get_available_actions):
        api_issues.append("environment.get_available_actions must not require arguments.")
    if not isinstance(config, EnvironmentConfig):
        api_issues.append("environment.config must be an EnvironmentConfig.")
    if isinstance(config, EnvironmentConfig) and (
        isinstance(config.max_steps, bool)
        or not isinstance(config.max_steps, int)
        or config.max_steps < 1
    ):
        api_issues.append("environment.config.max_steps must be a positive integer.")
    step_limit = getattr(environment, "step_limit", None)
    if step_limit is not None and (
        isinstance(step_limit, bool)
        or not isinstance(step_limit, int)
        or step_limit < 1
    ):
        api_issues.append("environment.step_limit must be a positive integer or None.")
    if isinstance(config, EnvironmentConfig):
        possible_steps = config.max_steps
        if step_limit is not None:
            possible_steps = min(possible_steps, step_limit)
        if possible_steps < MINIMUM_STEPS_PER_EPISODE:
            api_issues.append(
                "Configured episode limits cannot support the minimum sequential "
                "decision steps required for a prototype."
            )
    if not api_issues:
        try:
            observation = environment.get_observation()
            actions = environment.get_available_actions()
        except Exception as error:
            api_issues.append(
                f"Read-only environment inspection failed: {type(error).__name__}: {error}"
            )
    observation_issues = (
        _observation_issues(observation) if observation is not None else []
    )
    action_issues = (
        _action_issues(actions, observation)
        if actions is not None and isinstance(observation, Mapping)
        else []
    )
    api_valid = not api_issues
    observation_valid = not observation_issues
    actions_valid = not action_issues
    reasons.extend(api_issues)
    reasons.extend(observation_issues)
    reasons.extend(action_issues)

    if reward is None:
        reward_classification = "unavailable"
    elif not isinstance(reward, RewardAssessment):
        reward_classification = "invalid"
        reasons.append("reward must be a RewardAssessment; raw numbers are not evidence.")
    elif reward.status == "unavailable":
        reward_classification = "unavailable"
    elif reward.status == "invalid":
        reward_classification = "invalid"
    elif reward.status == "experimental_user_supplied":
        reward_classification = "experimental"
        checks["reward_numerically_valid"] = reward.available
    elif reward.status == "environment_numeric":
        reward_classification = "numeric_unverified"
        checks["reward_numerically_valid"] = reward.available
    else:
        reward_classification = "invalid"
        reasons.append("reward assessment has an unsupported status.")

    if outcome_evidence is None:
        evidence = None
        evidence_issues = []
        evidence_status = "missing"
    else:
        try:
            evidence = (
                outcome_evidence
                if isinstance(outcome_evidence, OutcomeEvidence)
                else OutcomeEvidence.from_mapping(outcome_evidence)
            )
            evidence_issues = []
            evidence_status = "caller_attested_observed"
        except (TypeError, ValueError) as error:
            evidence = None
            evidence_issues = [str(error)]
            evidence_status = "invalid"
    reasons.extend(evidence_issues)

    evidence_matches = False
    if evidence is not None and isinstance(reward, RewardAssessment):
        if reward.status == "environment_numeric" and reward.available:
            action_ids = (
                {item["action"] for item in actions if isinstance(item, Mapping)}
                if isinstance(actions, (list, tuple))
                else set()
            )
            transition_support = (
                getattr(environment, "supports_action_conditioned_transitions", False)
                is True
            )
            checks["action_conditioned_transitions_supported"] = transition_support
            detailed_issues = _evidence_issues(
                evidence,
                reward,
                action_ids,
                transition_support,
            )
            reasons.extend(detailed_issues)
            evidence_matches = not detailed_issues
        elif reward.status == "experimental_user_supplied":
            evidence_status = "not_reward_linked"
        else:
            evidence_status = "not_reward_linked"
    elif evidence is not None:
        reasons.append(
            "Observed outcome evidence cannot make an unavailable or invalid reward trainable."
        )

    if evidence_matches:
        evidence_status = "evidence_backed_for_prototype"
        checks["reward_supported_by_measured_outcomes"] = True
        checks["episode_evidence_sufficient_for_prototype"] = True
    elif evidence is not None and evidence_status != "invalid":
        evidence_status = "incomplete_or_unsupported"

    schema_valid = api_valid and observation_valid and actions_valid
    if not schema_valid or reward_classification == "invalid" or evidence_status == "invalid":
        status = "blocked_invalid_configuration"
    elif reward_classification == "experimental":
        status = "experimental_only"
        reasons.append(
            "A finite user-supplied reward is experimental and is not evidence-backed."
        )
    elif reward_classification == "unavailable":
        status = "blocked_missing_outcome_evidence"
        reasons.append("No numeric reward is available; no fallback or zero was used.")
    elif evidence_matches:
        status = "ready_for_algorithm_prototype"
        reasons.append(
            "Prototype readiness only: caller-attested evidence passed declared "
            "checks; policy performance and agronomic effectiveness remain unvalidated."
        )
    else:
        status = "blocked_missing_outcome_evidence"
        if reward_classification == "numeric_unverified":
            reasons.append(
                "A finite numeric reward alone does not establish measured outcome evidence."
            )

    return ReadinessReport(
        status=status,
        api_valid=api_valid,
        observation_schema_valid=observation_valid,
        action_schema_valid=actions_valid,
        reward_classification=reward_classification,
        outcome_evidence_status=evidence_status,
        checks=checks,
        reasons=tuple(dict.fromkeys(reasons)),
    )
