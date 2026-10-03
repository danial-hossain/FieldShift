"""Validated action/outcome records and read-only offline data preparation.

This module defines an input contract only. It does not impute measurements,
estimate causal effects, calculate rewards, train policies, or claim policy
performance.
"""

from collections import Counter, defaultdict
from collections.abc import Iterable, Mapping
from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime
from math import isfinite
from types import MappingProxyType
from typing import Any, Optional

import numpy as np

OUTCOME_RECORD_FIELDS = (
    "event_id",
    "outcome_id",
    "field_id",
    "season_id",
    "episode_id",
    "split",
    "observation_timestamp",
    "decision_timestamp",
    "action_timestamp",
    "action_id",
    "action_parameters",
    "action_status",
    "linked_action_event_id",
    "outcome_name",
    "outcome_value",
    "outcome_unit",
    "measurement_timestamp",
    "outcome_window_start",
    "outcome_window_end",
    "outcome_missing",
    "data_status",
    "source",
    "provenance",
    "measurement_method",
    "missingness_flags",
    "data_quality_flags",
)
REQUIRED_IDENTIFIERS = (
    "event_id",
    "field_id",
    "season_id",
    "episode_id",
    "split",
    "action_id",
    "action_status",
    "data_status",
    "source",
)
SPLITS = ("train", "validation", "test")
ACTION_STATUSES = ("planned", "confirmed_applied", "not_applied")
OBSERVED_OUTCOMES = {
    "measured_yield": {"t/ha"},
    "realized_revenue": {"BDT/ha"},
    "recorded_production_cost": {"BDT/ha"},
    "measured_water_use": {"mm/ha"},
    "soil_health_change": {"pH", "mg/kg", "%", "m3/m3"},
    "management_action_outcome": {"count", "mm", "mm/ha", "t/ha", "BDT/ha"},
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
        return [_thaw(item) for item in sorted(value, key=repr)]
    return deepcopy(value)


def _identifier(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _timestamp(value: Any) -> Optional[datetime]:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except (TypeError, ValueError, OverflowError):
        return None
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        return None
    return parsed


def _flags_valid(value: Any) -> bool:
    return isinstance(value, (list, tuple)) and all(
        isinstance(flag, str) and flag.strip() for flag in value
    )


def _action_parameters_valid(value: Any) -> bool:
    if value is None or isinstance(value, (str, bool, int)):
        return True
    if isinstance(value, float):
        return isfinite(value)
    if isinstance(value, (np.integer,)):
        return True
    if isinstance(value, (np.floating,)):
        return isfinite(float(value))
    if isinstance(value, Mapping):
        return all(
            isinstance(key, str) and _action_parameters_valid(item)
            for key, item in value.items()
        )
    if isinstance(value, (list, tuple)):
        return all(_action_parameters_valid(item) for item in value)
    return False


def _iter_provenance_statuses(value: Any):
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
                for status in statuses:
                    yield status
            yield from _iter_provenance_statuses(item)
    elif isinstance(value, (list, tuple, set, frozenset)):
        for item in value:
            yield from _iter_provenance_statuses(item)


def _contains_plan_marker(value: Any) -> bool:
    if isinstance(value, Mapping):
        if any(
            str(key).strip().lower()
            in {"milp", "objective_value", "planned_rotation", "planning_context"}
            for key in value
        ):
            return True
        return any(_contains_plan_marker(item) for item in value.values())
    if isinstance(value, (list, tuple, set, frozenset)):
        return any(_contains_plan_marker(item) for item in value)
    return False


@dataclass(frozen=True)
class ValidationFinding:
    severity: str
    field: Optional[str]
    record_id: Optional[str]
    explanation: str

    def __post_init__(self) -> None:
        if self.severity not in {"error", "warning"}:
            raise ValueError("Finding severity must be 'error' or 'warning'.")
        if not isinstance(self.explanation, str) or not self.explanation.strip():
            raise ValueError("Finding explanation must be non-empty.")

    def to_dict(self) -> dict[str, Any]:
        return {
            "severity": self.severity,
            "field": self.field,
            "record_id": self.record_id,
            "explanation": self.explanation,
        }


@dataclass(frozen=True)
class OutcomeValidationReport:
    findings: tuple[ValidationFinding, ...]
    record_count: int
    valid_record_count: int
    observed_outcome_count: int
    missing_outcome_count: int
    missingness_counts: Mapping[str, int]
    split_metadata_valid: bool
    action_coverage: Mapping[str, Mapping[str, int]]
    split_action_coverage: Mapping[str, Mapping[str, int]]
    split_counts: Mapping[str, int]

    def __post_init__(self) -> None:
        object.__setattr__(self, "findings", tuple(self.findings))
        object.__setattr__(self, "action_coverage", _freeze(self.action_coverage))
        object.__setattr__(
            self, "split_action_coverage", _freeze(self.split_action_coverage)
        )
        object.__setattr__(self, "missingness_counts", _freeze(self.missingness_counts))
        object.__setattr__(self, "split_counts", _freeze(self.split_counts))

    @property
    def valid(self) -> bool:
        return not any(finding.severity == "error" for finding in self.findings)

    def to_dict(self) -> dict[str, Any]:
        return {
            "valid": self.valid,
            "record_count": self.record_count,
            "valid_record_count": self.valid_record_count,
            "observed_outcome_count": self.observed_outcome_count,
            "missing_outcome_count": self.missing_outcome_count,
            "missingness_counts": _thaw(self.missingness_counts),
            "split_metadata_valid": self.split_metadata_valid,
            "split_counts": _thaw(self.split_counts),
            "action_coverage": _thaw(self.action_coverage),
            "split_action_coverage": _thaw(self.split_action_coverage),
            "findings": [finding.to_dict() for finding in self.findings],
            "policy_performance_claim": "not_evaluated",
            "causal_effects": "not_estimated",
        }


@dataclass(frozen=True)
class OfflineEvaluationDataset:
    """Immutable read-only snapshot; groups are empty unless validation passes."""

    raw_records: tuple[Mapping[str, Any], ...]
    groups: Mapping[str, tuple[Mapping[str, Any], ...]]
    validation: OutcomeValidationReport
    policy_performance_status: str
    refusal_reasons: tuple[str, ...]

    def __post_init__(self) -> None:
        object.__setattr__(
            self, "raw_records", tuple(_freeze(record) for record in self.raw_records)
        )
        object.__setattr__(
            self,
            "groups",
            _freeze(
                {
                    name: tuple(_freeze(record) for record in records)
                    for name, records in self.groups.items()
                }
            ),
        )
        object.__setattr__(self, "refusal_reasons", tuple(self.refusal_reasons))

    def to_dict(self) -> dict[str, Any]:
        return {
            "raw_records": [_thaw(record) for record in self.raw_records],
            "groups": {
                name: [_thaw(record) for record in records]
                for name, records in self.groups.items()
            },
            "validation": self.validation.to_dict(),
            "policy_performance_status": self.policy_performance_status,
            "refusal_reasons": list(self.refusal_reasons),
            "causal_effects": "not_estimated",
            "policy_trained": False,
        }


def _validate_record(record: Any) -> tuple[list[ValidationFinding], bool]:
    findings = []
    if not isinstance(record, Mapping):
        return [
            ValidationFinding(
                "error", None, None, "Each outcome record must be a mapping."
            )
        ], False

    record_id = record.get("event_id") if _identifier(record.get("event_id")) else None
    valid = True

    def add(severity: str, field: Optional[str], explanation: str) -> None:
        nonlocal valid
        findings.append(ValidationFinding(severity, field, record_id, explanation))
        if severity == "error":
            valid = False

    missing_fields = set(OUTCOME_RECORD_FIELDS) - set(record)
    if missing_fields:
        add(
            "error",
            None,
            "Missing outcome-record fields: "
            + ", ".join(sorted(missing_fields)),
        )
    unknown_fields = set(record) - set(OUTCOME_RECORD_FIELDS)
    if unknown_fields:
        add(
            "error",
            None,
            "Unknown outcome-record fields: " + ", ".join(sorted(map(str, unknown_fields))),
        )
    for name in REQUIRED_IDENTIFIERS:
        if not _identifier(record.get(name)):
            add("error", name, f"{name} is required and must be a non-empty string.")
    split = record.get("split")
    if _identifier(split) and split not in SPLITS:
        add("error", "split", "split must be train, validation, or test.")
    action_status = record.get("action_status")
    if _identifier(action_status) and action_status not in ACTION_STATUSES:
        add(
            "error",
            "action_status",
            "action_status must be planned, confirmed_applied, or not_applied.",
        )

    for name in ("observation_timestamp", "decision_timestamp"):
        if _timestamp(record.get(name)) is None:
            add(
                "error",
                name,
                f"{name} must be a valid ISO-8601 timestamp with an explicit timezone.",
            )

    observed_at = _timestamp(record.get("observation_timestamp"))
    decision_at = _timestamp(record.get("decision_timestamp"))
    action_at = _timestamp(record.get("action_timestamp"))
    if action_status == "confirmed_applied" and action_at is None:
        add(
            "error",
            "action_timestamp",
            "Confirmed applied actions require a timezone-aware action_timestamp.",
        )
    elif action_status in ("planned", "not_applied") and record.get(
        "action_timestamp"
    ) is not None:
        add(
            "error",
            "action_timestamp",
            "Planned or not-applied actions must not claim an execution timestamp.",
        )
    if observed_at and decision_at and observed_at > decision_at:
        add(
            "error",
            "observation_timestamp",
            "Observation must not occur after its decision timestamp.",
        )
    if decision_at and action_at and decision_at > action_at:
        add(
            "error",
            "action_timestamp",
            "Action timestamp must not precede the decision timestamp.",
        )

    parameters = record.get("action_parameters")
    if not isinstance(parameters, Mapping) or not _action_parameters_valid(parameters):
        add(
            "error",
            "action_parameters",
            "action_parameters must be a mapping of finite JSON-compatible values.",
        )
    if not _flags_valid(record.get("missingness_flags")):
        add("error", "missingness_flags", "missingness_flags must be a sequence of strings.")
    if not _flags_valid(record.get("data_quality_flags")):
        add("error", "data_quality_flags", "data_quality_flags must be a sequence of strings.")
    missingness_flags = record.get("missingness_flags")

    data_status = record.get("data_status")
    if not isinstance(data_status, str) or data_status not in (
        "observed",
        "synthetic",
        "demo",
        "planned",
        "missing",
    ):
        add(
            "error",
            "data_status",
            "data_status must be observed, synthetic, demo, planned, or missing.",
        )
    provenance = record.get("provenance")
    if not isinstance(provenance, Mapping) or not provenance:
        add("error", "provenance", "Non-empty provenance mapping is required.")
        provenance = {}
    for name in ("source_id", "record_id", "data_status"):
        if not _identifier(provenance.get(name)):
            add("error", f"provenance.{name}", f"provenance.{name} is required.")
    if _contains_plan_marker(provenance) and (
        data_status == "observed" or record.get("outcome_missing") is False
    ):
        add("error", "provenance", "MILP plans/objectives cannot be action or outcome evidence.")
    provenance_statuses = {
        str(status).strip().lower()
        for status in _iter_provenance_statuses(provenance)
        if isinstance(status, str)
    }
    if data_status == "observed":
        if isinstance(parameters, Mapping) and _contains_plan_marker(parameters):
            add(
                "error",
                "action_parameters",
                "Observed action parameters cannot contain MILP plan/objective fields.",
            )
        if provenance.get("data_status") != "observed":
            add(
                "error",
                "provenance.data_status",
                "Observed record status conflicts with provenance status.",
            )
        if provenance_statuses.intersection({"synthetic", "demo", "planned", "missing"}):
            add(
                "error",
                "provenance",
                "Synthetic/demo/planned/missing provenance cannot be labelled observed.",
            )
        if any(
            token in str(provenance.get(name, "")).strip().lower()
            for name in ("source_id", "record_id")
            for token in ("demo", "synthetic", "fixture", "milp", "plan")
        ):
            add(
                "error",
                "provenance",
                "Observed provenance identifiers must not identify demo, synthetic, fixture, or plan data.",
            )
        if any(
            token in str(record.get("source", "")).strip().lower()
            for token in ("demo", "synthetic", "fixture", "milp", "plan")
        ):
            add(
                "error",
                "source",
                "Observed source must not identify demo, synthetic, fixture, or plan data.",
            )
    elif data_status == "planned" and action_status != "planned":
        add("error", "data_status", "Planned data status requires action_status='planned'.")
    elif data_status == "planned":
        add(
            "warning",
            "data_status",
            "Planned action is retained but is not a confirmed field action or outcome.",
        )
    elif isinstance(data_status, str) and data_status in (
        "synthetic",
        "demo",
        "missing",
    ):
        add(
            "warning",
            "data_status",
            "Non-observed record is retained but excluded from observed outcome coverage.",
        )

    event_has_outcome = record.get("outcome_id") is not None or any(
        record.get(name) is not None
        for name in (
            "outcome_name",
            "outcome_value",
            "outcome_unit",
            "measurement_timestamp",
            "outcome_window_start",
            "outcome_window_end",
            "linked_action_event_id",
        )
    )
    outcome_missing = record.get("outcome_missing")
    if not isinstance(outcome_missing, bool):
        add("error", "outcome_missing", "outcome_missing must be a boolean.")
        outcome_missing = True

    if action_status == "planned":
        if data_status != "planned":
            add("error", "action_status", "A planned action must have data_status='planned'.")
        if event_has_outcome or not outcome_missing:
            add(
                "error",
                "outcome_id",
                "A planned action cannot be linked to a measured outcome.",
            )
    elif action_status == "not_applied":
        if event_has_outcome or not outcome_missing:
            add(
                "error",
                "outcome_id",
                "A not-applied action cannot be linked to an action outcome.",
            )
    elif action_status == "confirmed_applied":
        if data_status == "planned":
            add(
                "error",
                "action_status",
                "A planned record cannot be represented as a confirmed applied action.",
            )
        if data_status == "observed" and action_at is not None and decision_at is not None:
            if action_at < decision_at:
                add(
                    "error",
                    "action_timestamp",
                    "Confirmed action timestamp must be at or after decision time.",
                )

    outcome_id = record.get("outcome_id")
    outcome_name = record.get("outcome_name")
    value = record.get("outcome_value")
    unit = record.get("outcome_unit")
    measurement_at = _timestamp(record.get("measurement_timestamp"))
    window_start = _timestamp(record.get("outcome_window_start"))
    window_end = _timestamp(record.get("outcome_window_end"))
    linkage = record.get("linked_action_event_id")
    if outcome_missing:
        if isinstance(missingness_flags, (list, tuple)) and "outcome_value" not in missingness_flags:
            add(
                "error",
                "missingness_flags",
                "Missing outcome_value must be explicitly listed in missingness_flags.",
            )
        if any(
            record.get(name) is not None
            for name in (
                "outcome_id",
                "outcome_name",
                "outcome_value",
                "outcome_unit",
                "measurement_timestamp",
                "outcome_window_start",
                "outcome_window_end",
                "linked_action_event_id",
                "measurement_method",
            )
        ):
            add(
                "error",
                "outcome_missing",
                "Missing outcome records must not carry fabricated measurement fields.",
            )
    else:
        if isinstance(missingness_flags, (list, tuple)) and "outcome_value" in missingness_flags:
            add(
                "error",
                "missingness_flags",
                "Measured outcome_value conflicts with its missingness flag.",
            )
        for name, val in (
            ("outcome_id", outcome_id),
            ("outcome_name", outcome_name),
            ("outcome_unit", unit),
            ("measurement_method", record.get("measurement_method")),
            ("linked_action_event_id", linkage),
        ):
            if not _identifier(val):
                add("error", name, f"{name} is required for a measured outcome.")
        if isinstance(value, (bool, np.bool_)) or not isinstance(
            value, (int, float, np.integer, np.floating)
        ) or not isfinite(float(value)):
            add("error", "outcome_value", "Measured outcome value must be finite numeric.")
        if not _identifier(outcome_name):
            allowed_units = set()
        elif not isinstance(outcome_name, str) or outcome_name not in OBSERVED_OUTCOMES:
            allowed_units = set()
            add(
                "error",
                "outcome_name",
                "outcome_name must be a supported, explicitly measured outcome.",
            )
        else:
            allowed_units = OBSERVED_OUTCOMES[outcome_name]
        if not _identifier(unit):
            add("error", "outcome_unit", "Measured outcomes require an explicit unit.")
        elif allowed_units and unit not in allowed_units:
            add(
                "error",
                "outcome_unit",
                f"Unit {unit!r} is incompatible with outcome {outcome_name!r}; "
                f"allowed units: {', '.join(sorted(allowed_units))}.",
            )
        elif outcome_name == "management_action_outcome" and unit not in allowed_units:
            add(
                "error",
                "outcome_unit",
                "management_action_outcome requires a registered unit.",
            )
        if measurement_at is None:
            add(
                "error",
                "measurement_timestamp",
                "measurement_timestamp must be ISO-8601 with explicit timezone.",
            )
        if window_start is None or window_end is None:
            add(
                "error",
                "outcome_window_start",
                "Outcome window start/end must be ISO-8601 with explicit timezone.",
            )
        if window_start and window_end and window_start > window_end:
            add("error", "outcome_window_start", "Outcome window start must not follow its end.")
        if measurement_at and decision_at and measurement_at < decision_at:
            add(
                "error",
                "measurement_timestamp",
                "Outcome measurement must not precede its linked decision.",
            )
        if measurement_at and window_start and window_end:
            if not window_start <= measurement_at <= window_end:
                add(
                    "error",
                    "measurement_timestamp",
                    "Measurement timestamp must lie within its declared outcome window.",
                )
        if action_status != "confirmed_applied":
            add(
                "error",
                "action_status",
                "Measured action outcomes require a confirmed_applied action.",
            )
        if linkage != record_id:
            add(
                "error",
                "linked_action_event_id",
                "Outcome must explicitly link to this record's event_id.",
            )
        if action_at and measurement_at and measurement_at < action_at:
            add(
                "error",
                "measurement_timestamp",
                "Action outcome measurement must not precede its applied action.",
            )
        if action_at and window_start and window_start < action_at:
            add(
                "error",
                "outcome_window_start",
                "Outcome window must not begin before the applied action.",
            )
        if data_status != "observed":
            add(
                "warning",
                "data_status",
                "Non-observed outcome is not eligible for offline evaluation.",
            )

    return findings, valid


def validate_outcome_records(
    records: Iterable[Mapping[str, Any]],
    required_action_ids: Optional[Iterable[str]] = None,
) -> OutcomeValidationReport:
    """Validate caller records without changing, imputing, or dropping them."""
    if isinstance(records, (str, bytes, Mapping)):
        raise TypeError("records must be an iterable of record mappings.")
    try:
        snapshot = list(records)
    except TypeError as error:
        raise TypeError("records must be an iterable of record mappings.") from error

    findings = []
    valid_flags = []
    for record in snapshot:
        row_findings, valid = _validate_record(record)
        findings.extend(row_findings)
        valid_flags.append(valid)

    event_counts = Counter(
        record.get("event_id")
        for record in snapshot
        if isinstance(record, Mapping) and _identifier(record.get("event_id"))
    )
    outcome_counts = Counter(
        record.get("outcome_id")
        for record in snapshot
        if isinstance(record, Mapping) and _identifier(record.get("outcome_id"))
    )
    for record in snapshot:
        if not isinstance(record, Mapping):
            continue
        event_id = record.get("event_id") if _identifier(record.get("event_id")) else None
        outcome_id = record.get("outcome_id")
        if event_id and event_counts[event_id] > 1:
            findings.append(
                ValidationFinding("error", "event_id", event_id, "Duplicate event_id.")
            )
        if _identifier(outcome_id) and outcome_counts[outcome_id] > 1:
            findings.append(
                ValidationFinding(
                    "error", "outcome_id", event_id, "Duplicate outcome_id."
                )
            )

    group_splits = defaultdict(set)
    for record in snapshot:
        if isinstance(record, Mapping) and all(
            _identifier(record.get(name)) for name in ("field_id", "season_id", "split")
        ):
            group = (record["field_id"], record["season_id"])
            group_splits[group].add(record["split"])
    conflicting_groups = {
        group for group, splits in group_splits.items() if len(splits) > 1
    }
    for record in snapshot:
        if not isinstance(record, Mapping):
            continue
        group = (record.get("field_id"), record.get("season_id"))
        if group in conflicting_groups:
            findings.append(
                ValidationFinding(
                    "error",
                    "split",
                    record.get("event_id") if _identifier(record.get("event_id")) else None,
                    "The same field-season appears in multiple splits (train/test leakage).",
                )
            )

    windows = []
    for record in snapshot:
        if not isinstance(record, Mapping) or record.get("outcome_missing") is not False:
            continue
        start = _timestamp(record.get("outcome_window_start"))
        end = _timestamp(record.get("outcome_window_end"))
        if start and end and all(
            _identifier(record.get(name))
            for name in ("field_id", "season_id", "split")
        ):
            windows.append((record, start, end))
    for index, (first, first_start, first_end) in enumerate(windows):
        for second, second_start, second_end in windows[index + 1 :]:
            overlap = max(first_start, second_start) <= min(first_end, second_end)
            same_field = first.get("field_id") == second.get("field_id")
            if same_field and overlap and first.get("split") != second.get("split"):
                findings.append(
                    ValidationFinding(
                        "error",
                        "outcome_window_start",
                        second.get("event_id") if _identifier(second.get("event_id")) else None,
                        "Overlapping outcome windows for the same field cross splits.",
                    )
                )

    observed_coverage: dict[str, dict[str, int]] = defaultdict(
        lambda: {"observed": 0, "missing": 0, "non_observed": 0}
    )
    missingness_counts = Counter()
    observed_action_ids = set()
    for record, record_valid in zip(snapshot, valid_flags):
        if not isinstance(record, Mapping):
            continue
        if isinstance(record.get("missingness_flags"), (list, tuple)):
            missingness_counts.update(record["missingness_flags"])
        action_id = record.get("action_id")
        outcome_name = record.get("outcome_name")
        if (
            record_valid
            and _identifier(action_id)
            and _identifier(outcome_name)
            and record.get("outcome_missing") is False
            and record.get("action_status") == "confirmed_applied"
            and record.get("linked_action_event_id") == record.get("event_id")
        ):
            if record.get("data_status") == "observed":
                observed_coverage[action_id]["observed"] += 1
                observed_action_ids.add(action_id)
            else:
                observed_coverage[action_id]["non_observed"] += 1
        elif (
            record_valid
            and _identifier(action_id)
            and record.get("outcome_missing") is True
            and record.get("action_status") == "confirmed_applied"
        ):
            observed_coverage[action_id]["missing"] += 1

    if required_action_ids is None:
        required_actions = sorted(
            {
                record.get("action_id")
                for record in snapshot
                if isinstance(record, Mapping)
                and _identifier(record.get("action_id"))
                and record.get("action_status") == "confirmed_applied"
            }
        )
    else:
        if isinstance(required_action_ids, (str, bytes, Mapping)):
            raise TypeError("required_action_ids must be an iterable of action IDs.")
        try:
            required_actions = list(required_action_ids)
        except TypeError as error:
            raise TypeError(
                "required_action_ids must be an iterable of action IDs."
            ) from error
        if any(not _identifier(action) for action in required_actions):
            findings.append(
                ValidationFinding(
                    "error",
                    "required_action_ids",
                    None,
                    "required_action_ids must contain non-empty action identifiers.",
                )
            )
        valid_required_actions = [
            action for action in required_actions if _identifier(action)
        ]
        if len(set(valid_required_actions)) != len(valid_required_actions):
            findings.append(
                ValidationFinding(
                    "error",
                    "required_action_ids",
                    None,
                    "required_action_ids must be unique.",
                )
            )
    for action_id in required_actions:
        if not _identifier(action_id):
            continue
        observed_coverage.setdefault(
            action_id, {"observed": 0, "missing": 0, "non_observed": 0}
        )
        if action_id not in observed_action_ids:
            findings.append(
                ValidationFinding(
                    "warning",
                    "action_id",
                    None,
                    f"No observed measured outcome covers required action {action_id!r}.",
                )
            )

    split_action_coverage = {
        split: {action: 0 for action in required_actions if _identifier(action)}
        for split in SPLITS
    }
    for record, record_valid in zip(snapshot, valid_flags):
        if (
            record_valid
            and isinstance(record, Mapping)
            and record.get("data_status") == "observed"
            and record.get("action_status") == "confirmed_applied"
            and record.get("outcome_missing") is False
            and record.get("linked_action_event_id") == record.get("event_id")
            and record.get("split") in SPLITS
            and record.get("action_id") in split_action_coverage[record["split"]]
        ):
            split_action_coverage[record["split"]][record["action_id"]] += 1
    for split in SPLITS:
        for action_id, count in split_action_coverage[split].items():
            if count == 0:
                findings.append(
                    ValidationFinding(
                        "warning",
                        "action_id",
                        None,
                        f"No observed measured outcome covers action {action_id!r} "
                        f"in the {split} split.",
                    )
                )

    invalid_record_ids = {
        finding.record_id
        for finding in findings
        if finding.severity == "error" and finding.record_id is not None
    }
    valid_record_count = sum(
        row_valid
        and isinstance(record, Mapping)
        and _identifier(record.get("event_id"))
        and record.get("event_id") not in invalid_record_ids
        for record, row_valid in zip(snapshot, valid_flags)
    )
    observed_outcome_count = sum(
        coverage["observed"] for coverage in observed_coverage.values()
    )
    missing_outcome_count = sum(
        coverage["missing"] for coverage in observed_coverage.values()
    )
    split_counts = {name: 0 for name in SPLITS}
    split_metadata_valid = True
    for record in snapshot:
        if not isinstance(record, Mapping):
            split_metadata_valid = False
            continue
        split = record.get("split")
        if split not in SPLITS:
            split_metadata_valid = False
        else:
            split_counts[split] += 1
        if not all(_identifier(record.get(name)) for name in ("field_id", "season_id")):
            split_metadata_valid = False
    if conflicting_groups:
        split_metadata_valid = False

    return OutcomeValidationReport(
        findings=tuple(findings),
        record_count=len(snapshot),
        valid_record_count=valid_record_count,
        observed_outcome_count=observed_outcome_count,
        missing_outcome_count=missing_outcome_count,
        missingness_counts=dict(sorted(missingness_counts.items())),
        split_metadata_valid=split_metadata_valid,
        action_coverage={name: dict(value) for name, value in sorted(observed_coverage.items())},
        split_action_coverage=split_action_coverage,
        split_counts=split_counts,
    )


def prepare_offline_evaluation_data(
    records: Iterable[Mapping[str, Any]],
    required_action_ids: Optional[Iterable[str]] = None,
) -> OfflineEvaluationDataset:
    """Validate, snapshot, and split records without modeling or imputation.

    Split groups are created only when all record validation and leakage checks
    pass. Raw records are always retained in the returned immutable dataset.
    """
    if isinstance(records, (str, bytes, Mapping)):
        raise TypeError("records must be an iterable of record mappings.")
    try:
        snapshot = list(records)
    except TypeError as error:
        raise TypeError("records must be an iterable of record mappings.") from error
    report = validate_outcome_records(snapshot, required_action_ids)
    valid = report.valid and report.split_metadata_valid
    groups = {name: [] for name in SPLITS}
    refusal_reasons = []
    if valid:
        for record in snapshot:
            if (
                isinstance(record, Mapping)
                and record.get("data_status") == "observed"
                and record.get("action_status") == "confirmed_applied"
                and record.get("outcome_missing") is False
            ):
                groups[record["split"]].append(deepcopy(dict(record)))
    else:
        refusal_reasons.append(
            "Validation errors or invalid split metadata prevent grouped preparation."
        )

    if not report.observed_outcome_count:
        refusal_reasons.append("No observed measured outcomes are available.")
    uncovered = [
        action
        for action, coverage in report.action_coverage.items()
        if coverage["observed"] == 0
    ]
    incomplete_split_coverage = any(
        count == 0
        for per_action in report.split_action_coverage.values()
        for count in per_action.values()
    )
    if uncovered or incomplete_split_coverage:
        refusal_reasons.append(
            "At least one required action lacks observed outcome coverage overall "
            "or in a train/validation/test split."
        )
    if not all(groups[name] for name in ("train", "validation", "test")):
        refusal_reasons.append(
            "Non-empty train, validation, and test groups are all required."
        )
    status = (
        "refused_insufficient_or_invalid_observed_data"
        if refusal_reasons
        else "prepared_for_offline_analysis_no_performance_claim"
    )
    return OfflineEvaluationDataset(
        raw_records=tuple(
            dict(record) if isinstance(record, Mapping) else {"invalid_record": deepcopy(record)}
            for record in snapshot
        ),
        groups={name: tuple(values) for name, values in groups.items()},
        validation=report,
        policy_performance_status=status,
        refusal_reasons=tuple(dict.fromkeys(refusal_reasons)),
    )
