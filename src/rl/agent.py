"""Policy interfaces for the FieldShift management environment.

Continuous structured observations are intentionally not quantized into
arbitrary tabular states. No learning algorithm is implemented in this phase.
"""

from typing import Any, Mapping, Protocol, Sequence


class Policy(Protocol):
    """Minimal action-selection contract consumed by ``run_training``."""

    def select_action(
        self,
        observation: Mapping[str, Any],
        available_actions: Sequence[Mapping[str, Any]],
        seed: int | None = None,
    ) -> Any:
        """Select an action represented by one of the available action records."""
        ...


class DeterministicBaselinePolicy:
    """Choose no intervention when available, otherwise the first valid action.

    This baseline is only a reproducible mechanics check. It is not a learned
    policy, recommendation, or measure of agronomic performance.
    """

    def select_action(
        self,
        observation: Mapping[str, Any],
        available_actions: Sequence[Mapping[str, Any]],
        seed: int | None = None,
    ) -> Any:
        del observation, seed
        if not available_actions:
            raise ValueError("No available actions were supplied to the policy.")
        for candidate in available_actions:
            if candidate.get("action") == "no_intervention":
                return "no_intervention"
        return dict(available_actions[0])
