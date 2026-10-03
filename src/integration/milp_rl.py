"""Read-only bridge from long-term MILP results to sequential RL context.

This adapter labels a MILP rotation as a plan. It never records a planting
event, changes FieldState, calls the optimizer, or maps objectives to rewards.
"""

from collections.abc import Mapping
from copy import deepcopy
from dataclasses import dataclass
from types import MappingProxyType
from typing import Any, Optional, Union

PLAN_STATUSES = (
    "optimal",
    "feasible",
    "infeasible",
    "not_solved",
    "solver_error",
    "missing",
    "invalid",
)
_SOLVED_STATUSES = {"optimal", "feasible"}
_OBJECTIVE_FIELDS = (
    "objective_value",
    "profit_component",
    "water_component",
    "soil_component",
    "normalized_components",
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


def _invalid(reason: str, original_status: Optional[str] = None):
    return MILPRotationContext(
        status="invalid",
        original_status=original_status,
        planning_periods=(),
        planned_rotation=None,
        objective_components={},
        constraint_summary={},
        provenance={},
        data_status={},
        reason=reason,
    )


@dataclass(frozen=True)
class MILPRotationContext:
    """Immutable snapshot of a MILP result for sequential-policy context.

    ``planned_rotation`` is an insertion-ordered, read-only mapping from
    planning period to planned crop, or ``None`` when no usable plan exists.
    Objective values remain descriptive MILP outputs and are never interpreted
    as RL rewards. ``to_dict`` returns an independent mutable serialization.
    """

    status: str
    original_status: Optional[str]
    planning_periods: tuple[str, ...]
    planned_rotation: Optional[Mapping[str, str]]
    objective_components: Mapping[str, Any]
    constraint_summary: Mapping[str, Any]
    provenance: Mapping[str, Any]
    data_status: Mapping[str, Any]
    reason: Optional[str] = None

    def __post_init__(self) -> None:
        object.__setattr__(self, "planning_periods", tuple(self.planning_periods))
        object.__setattr__(
            self,
            "planned_rotation",
            None if self.planned_rotation is None else _freeze(self.planned_rotation),
        )
        for name in (
            "objective_components",
            "constraint_summary",
            "provenance",
            "data_status",
        ):
            object.__setattr__(self, name, _freeze(getattr(self, name)))

    @property
    def has_plan(self) -> bool:
        return self.status in _SOLVED_STATUSES and self.planned_rotation is not None

    def to_dict(self) -> dict[str, Any]:
        """Serialize without exposing the context's immutable internal values."""
        return {
            "status": self.status,
            "original_status": self.original_status,
            "planning_periods": list(self.planning_periods),
            "planned_rotation": _thaw(self.planned_rotation),
            "objective_components": _thaw(self.objective_components),
            "constraint_summary": _thaw(self.constraint_summary),
            "provenance": _thaw(self.provenance),
            "data_status": _thaw(self.data_status),
            "reason": self.reason,
            "rotation_is_plan_not_observation": True,
            "planting_confirmed": False,
            "reward_mapping": None,
        }


def adapt_milp_result(result: Optional[Mapping[str, Any]]) -> MILPRotationContext:
    """Validate and snapshot a Phase 7-style optimizer result.

    Missing, infeasible, and not-solved inputs retain their status without a
    fallback rotation. Malformed or inconsistent results return
    ``status="invalid"`` with a reason.
    """
    if result is None:
        return MILPRotationContext(
            status="missing",
            original_status=None,
            planning_periods=(),
            planned_rotation=None,
            objective_components={},
            constraint_summary={},
            provenance={},
            data_status={},
            reason="No MILP result was supplied.",
        )
    if not isinstance(result, Mapping):
        return _invalid("MILP result must be a mapping.")

    try:
        snapshot = deepcopy(dict(result))
    except Exception as error:
        return _invalid(f"MILP result could not be copied: {error}")

    source_status = snapshot.get("status")
    if not isinstance(source_status, str) or not source_status.strip():
        return _invalid("MILP result is missing a non-empty status.")
    source_status = source_status.strip().lower()
    if source_status not in _SOLVED_STATUSES | {
        "infeasible",
        "not_solved",
        "solver_error",
    }:
        return _invalid(
            f"Unsupported MILP result status: {source_status!r}.", source_status
        )
    solver_status = snapshot.get("solver_status")
    expected_solver_statuses = {
        "optimal": {"optimal"},
        "feasible": {"feasible", "optimal"},
        "infeasible": {"infeasible"},
        "not_solved": {"not solved", "undefined", "unknown"},
        "solver_error": None,
    }
    if (
        isinstance(solver_status, str)
        and solver_status.strip()
        and expected_solver_statuses[source_status] is not None
        and solver_status.strip().lower()
        not in expected_solver_statuses[source_status]
    ):
        return _invalid(
            f"status {source_status!r} conflicts with solver_status "
            f"{solver_status!r}.",
            source_status,
        )

    for name in ("constraint_summary", "provenance", "data_status"):
        value = snapshot.get(name)
        if value is not None and not isinstance(value, Mapping):
            return _invalid(f"{name} must be a mapping or None.", source_status)

    periods_value = snapshot.get("planning_periods", ())
    if periods_value is None:
        periods_value = ()
    if not isinstance(periods_value, (list, tuple)) or any(
        not isinstance(period, str) or not period.strip()
        for period in periods_value
    ):
        return _invalid(
            "planning_periods must be an ordered sequence of non-empty strings.",
            source_status,
        )
    periods = tuple(period.strip() for period in periods_value)
    if len(set(periods)) != len(periods):
        return _invalid("planning_periods must be unique.", source_status)

    rotation = snapshot.get("selected_crop_by_period")
    if source_status in _SOLVED_STATUSES:
        if not isinstance(rotation, Mapping) or not rotation:
            return _invalid(
                "A solved MILP result requires a non-empty selected_crop_by_period mapping.",
                source_status,
            )
        copied_rotation = deepcopy(dict(rotation))
        if any(
            not isinstance(period, str)
            or not period.strip()
            or not isinstance(crop, str)
            or not crop.strip()
            for period, crop in copied_rotation.items()
        ):
            return _invalid(
                "Rotation periods and crop names must be non-empty strings.",
                source_status,
            )
        rotation_periods = tuple(copied_rotation)
        if periods and periods != rotation_periods:
            return _invalid(
                "planning_periods order must exactly match rotation period order.",
                source_status,
            )
        if not periods:
            periods = rotation_periods
        planned_rotation = {
            period.strip(): crop.strip()
            for period, crop in copied_rotation.items()
        }
        final_status = source_status
        reason = None
    else:
        if rotation is not None:
            return _invalid(
                f"{source_status} MILP result must not contain a selected rotation.",
                source_status,
            )
        planned_rotation = None
        final_status = source_status
        reason = snapshot.get("solver_status") or (
            "MILP returned no usable rotation."
        )

    components = {
        name: deepcopy(snapshot.get(name))
        for name in _OBJECTIVE_FIELDS
    }
    return MILPRotationContext(
        status=final_status,
        original_status=source_status,
        planning_periods=periods,
        planned_rotation=planned_rotation,
        objective_components=components,
        constraint_summary=snapshot.get("constraint_summary") or {},
        provenance=snapshot.get("provenance") or {},
        data_status=snapshot.get("data_status") or {},
        reason=reason,
    )


def add_planning_context(
    observation: Mapping[str, Any],
    plan: Optional[Union[MILPRotationContext, Mapping[str, Any]]],
) -> dict[str, Any]:
    """Copy an observation and add separately labeled long-term plan context.

    The Phase 10 observation and all inputs remain untouched. The plan is not
    written into measured field state, history, or actual crop-action fields.
    """
    if not isinstance(observation, Mapping):
        raise TypeError("observation must be a mapping.")
    if "planning_context" in observation:
        raise ValueError("observation already contains planning_context.")
    context = (
        plan
        if isinstance(plan, MILPRotationContext)
        else adapt_milp_result(plan)
    )
    augmented = deepcopy(dict(observation))
    augmented["planning_context"] = context.to_dict()
    return augmented
