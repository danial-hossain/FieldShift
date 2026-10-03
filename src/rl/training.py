"""Generic training-loop boundary for FieldShift-compatible environments.

No learning algorithm or agronomic reward is defined here. A caller may
provide an experimental reward callback when the environment reports reward
as unavailable. Returned history records the callback's experimental status
and never substitutes a missing or invalid reward with zero.
"""

from copy import deepcopy
from typing import Any, Callable, Mapping, Optional

import numpy as np

from src.rl.agent import DeterministicBaselinePolicy, Policy
from src.rl.reward import RewardAssessment, validate_reward

RewardProvider = Callable[
    [Mapping[str, Any], Any, Mapping[str, Any], Mapping[str, Any]],
    Any,
]
TRAINING_HISTORY_FIELDS = (
    "episode",
    "seed",
    "status",
    "steps",
    "terminated",
    "truncated",
    "termination_reason",
    "reward_available",
    "reward_validation_status",
    "total_reward",
    "reward_source",
    "reward_units",
    "reward_provenance",
    "reward_reason",
    "errors",
    "actions",
    "provenance",
)


def _valid_actions(actions: Any) -> bool:
    return isinstance(actions, (list, tuple)) and bool(actions) and all(
        isinstance(action, Mapping) and isinstance(action.get("action"), str)
        for action in actions
    )


def _assessment_from_value(
    value: Any,
    *,
    source: str,
    provenance: Optional[Mapping[str, Any]] = None,
    units: Optional[str] = None,
    reason: Optional[str] = None,
) -> RewardAssessment:
    if isinstance(value, RewardAssessment):
        assessment = value
        candidate = assessment.value
        if assessment.status == "unavailable":
            candidate = None
        elif assessment.status == "invalid":
            candidate = "invalid_assessment"
        return validate_reward(
            candidate,
            source=source,
            provenance=assessment.provenance,
            units=assessment.units,
            reason=assessment.reason,
        )
    return validate_reward(
        value,
        source=source,
        provenance=provenance,
        units=units,
        reason=reason,
    )


def _episode_record(index: int, seed: int) -> dict[str, Any]:
    return {
        "episode": index,
        "seed": seed,
        "status": "running",
        "steps": 0,
        "terminated": False,
        "truncated": False,
        "termination_reason": None,
        "reward_available": False,
        "reward_validation_status": "unavailable",
        "total_reward": None,
        "reward_source": None,
        "reward_units": None,
        "reward_provenance": {},
        "reward_reason": None,
        "errors": [],
        "actions": [],
        "provenance": {},
    }


def _public_episode(record: Mapping[str, Any]) -> dict[str, Any]:
    return {
        name: deepcopy(record[name])
        for name in TRAINING_HISTORY_FIELDS
    }


def _validate_reset(result):
    if not isinstance(result, tuple) or len(result) != 2:
        raise ValueError("environment.reset() must return (observation, info).")
    observation, info = result
    _validate_observation(observation, "reset")
    if not isinstance(info, Mapping):
        raise ValueError("reset info must be a mapping.")
    actions = info.get("available_actions")
    if not _valid_actions(actions):
        raise ValueError("reset info must include structured available_actions.")
    return observation, info, actions


def _validate_observation(observation, name: str) -> None:
    if not isinstance(observation, Mapping):
        raise ValueError(f"{name} observation must be a mapping.")
    if not isinstance(observation.get("state"), Mapping):
        raise ValueError(f"{name} observation must contain a structured state mapping.")
    if not isinstance(observation.get("features"), Mapping):
        raise ValueError(f"{name} observation must contain a feature mapping.")
    if not isinstance(observation.get("provenance"), Mapping):
        raise ValueError(f"{name} observation must contain provenance.")


def _validate_step(result):
    if not isinstance(result, tuple) or len(result) != 5:
        raise ValueError(
            "environment.step() must return "
            "(observation, reward, terminated, truncated, info)."
        )
    observation, reward, terminated, truncated, info = result
    _validate_observation(observation, "step")
    if not isinstance(terminated, (bool, np.bool_)) or not isinstance(
        truncated, (bool, np.bool_)
    ):
        raise ValueError("terminated and truncated must be boolean values.")
    if not isinstance(info, Mapping):
        raise ValueError("step info must be a mapping.")
    if terminated and truncated:
        raise ValueError("terminated and truncated cannot both be True.")
    return observation, reward, bool(terminated), bool(truncated), info


def _error_record(record, status: str, error: Exception) -> None:
    record["status"] = status
    record["errors"].append(
        {"type": type(error).__name__, "message": str(error)}
    )


def run_training(
    environment,
    policy: Optional[Policy] = None,
    episodes: int = 1,
    seed: int = 0,
    reward_provider: Optional[RewardProvider] = None,
) -> dict[str, Any]:
    """Run episodes without assuming reward semantics or a learning algorithm.

    The reward callback signature is
    ``provider(observation, action, next_observation, info) -> finite_number``
    or a ``RewardAssessment``. It is invoked only when the environment reward
    is unavailable. Caller values are marked experimental; assessment status,
    units, provenance, and reason are retained. Any unavailable/invalid reward
    without a valid provider stops training; no zero reward is substituted.
    """
    if isinstance(episodes, bool) or not isinstance(episodes, int) or episodes < 1:
        raise ValueError("episodes must be a positive integer.")
    if isinstance(seed, bool) or not isinstance(seed, (int, np.integer)):
        raise ValueError("seed must be an integer.")
    if reward_provider is not None and not callable(reward_provider):
        raise TypeError("reward_provider must be callable or None.")
    if policy is None:
        policy = DeterministicBaselinePolicy()
    if not callable(getattr(policy, "select_action", None)):
        raise TypeError("policy must implement select_action(observation, actions, seed).")
    if not callable(getattr(environment, "reset", None)) or not callable(
        getattr(environment, "step", None)
    ):
        raise TypeError("environment must implement reset() and step(action).")

    records = []
    overall_status = "completed"
    for episode_index in range(episodes):
        episode_seed = int(seed) + episode_index
        record = _episode_record(episode_index, episode_seed)
        records.append(record)
        try:
            observation, reset_info, available_actions = _validate_reset(
                environment.reset(seed=episode_seed)
            )
        except Exception as error:
            _error_record(record, "environment_error", error)
            overall_status = "environment_error"
            break

        record["provenance"] = deepcopy(
            reset_info.get("provenance", observation.get("provenance", {}))
        )
        total_reward = 0.0
        reward_source = None
        while True:
            try:
                action = policy.select_action(
                    observation,
                    deepcopy(available_actions),
                    seed=episode_seed + record["steps"],
                )
            except Exception as error:
                _error_record(record, "policy_error", error)
                overall_status = "policy_error"
                break
            action_is_available = isinstance(action, str) and any(
                action == item.get("action") for item in available_actions
            )
            if isinstance(action, Mapping):
                action_is_available = any(
                    action == item for item in available_actions
                ) or any(
                    action.get("action") == item.get("action")
                    and set(action).issubset(item)
                    for item in available_actions
                )
            if not action_is_available:
                error = ValueError(
                    "policy selected an action absent from available_actions."
                )
                _error_record(record, "invalid_action", error)
                overall_status = "invalid_action"
                break
            try:
                transition = _validate_step(environment.step(action))
            except Exception as error:
                _error_record(record, "environment_error", error)
                overall_status = "environment_error"
                break

            next_observation, environment_reward, terminated, truncated, info = (
                transition
            )
            record["steps"] += 1
            record["terminated"] = terminated
            record["truncated"] = truncated
            record["termination_reason"] = info.get("termination_reason")
            record["actions"].append(deepcopy(action))
            record["provenance"] = deepcopy(
                info.get("provenance", record["provenance"])
            )
            reward_assessment = _assessment_from_value(
                environment_reward,
                source="environment",
                provenance=info.get("reward_provenance", {}),
                units=info.get("reward_units"),
                reason=info.get("reward_status"),
            )
            if (
                reward_assessment.status == "unavailable"
                and reward_provider is not None
            ):
                try:
                    provided_reward = reward_provider(
                        observation, action, next_observation, info
                    )
                except Exception as error:
                    _error_record(record, "reward_provider_error", error)
                    overall_status = "reward_provider_error"
                    break
                reward_assessment = _assessment_from_value(
                    provided_reward,
                    source="user_supplied",
                    provenance={
                        "source": "caller_reward_provider",
                        "data_status": "experimental",
                    },
                    reason=(
                        "Finite caller-supplied reward; experimental and not "
                        "agronomically validated."
                    ),
                )

            record["reward_validation_status"] = reward_assessment.status
            record["reward_source"] = (
                "unavailable"
                if reward_assessment.status == "unavailable"
                else (
                    "experimental_user_supplied"
                    if reward_assessment.source == "user_supplied"
                    else reward_assessment.source
                )
            )
            record["reward_units"] = reward_assessment.units
            record["reward_provenance"] = reward_assessment.to_dict()["provenance"]
            record["reward_reason"] = reward_assessment.reason
            reward = reward_assessment.value
            if not reward_assessment.available:
                record["status"] = (
                    "unsupported_reward"
                    if reward_assessment.status == "unavailable"
                    else "invalid_reward"
                )
                record["reward_available"] = False
                record["total_reward"] = None
                record["errors"].append(
                    {
                        "type": "RewardValidationError",
                        "message": reward_assessment.reason,
                    }
                )
                overall_status = record["status"]
                break

            assert reward is not None
            total_reward += reward
            reward_source = record["reward_source"]
            observation = next_observation
            available_actions = info.get(
                "available_actions",
                environment.get_available_actions()
                if callable(getattr(environment, "get_available_actions", None))
                else available_actions,
            )
            if not _valid_actions(available_actions):
                error = ValueError(
                    "step info available_actions must be a sequence of mappings."
                )
                _error_record(record, "malformed_transition", error)
                overall_status = "malformed_transition"
                break
            if terminated or truncated:
                record["status"] = "completed"
                record["reward_available"] = True
                record["total_reward"] = float(total_reward)
                record["reward_source"] = reward_source
                break
        if record["status"] != "completed":
            break

    return {
        "status": overall_status,
        "episodes_requested": episodes,
        "episodes_completed": sum(
            record["status"] == "completed" for record in records
        ),
        "reward_provider_status": (
            "experimental_user_supplied"
            if reward_provider is not None
            else "not_supplied"
        ),
        "history_schema": TRAINING_HISTORY_FIELDS,
        "history": [_public_episode(record) for record in records],
    }
