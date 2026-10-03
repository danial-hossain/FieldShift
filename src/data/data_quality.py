"""Read-only data-quality and evidence-coverage reporting for farm outcomes."""

from collections import Counter, defaultdict
from collections.abc import Iterable, Mapping
from copy import deepcopy
from dataclasses import dataclass
from types import MappingProxyType
from typing import Any, Optional

from src.rl.outcomes import (
    OfflineEvaluationDataset,
    ValidationFinding,
    prepare_offline_evaluation_data,
    validate_outcome_records,
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
        return [_thaw(item) for item in sorted(value, key=repr)]
    return deepcopy(value)


def _label(value: Any) -> str:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return "<missing>"


def _provenance_class(record: Mapping[str, Any]) -> str:
    top_level = record.get("data_status")
    provenance = record.get("provenance")
    nested = provenance.get("data_status") if isinstance(provenance, Mapping) else None
    statuses = {value for value in (top_level, nested) if isinstance(value, str)}
    if top_level == nested == "observed":
        return "observed"
    if statuses.intersection({"synthetic", "demo"}):
        return "synthetic_demo"
    if "planned" in statuses:
        return "planned"
    return "unknown"


def _as_dict_finding(finding: ValidationFinding) -> dict[str, Any]:
    return finding.to_dict()


@dataclass(frozen=True)
class FarmDataQualityReport:
    """Immutable quality summary retaining inputs and Phase 15 findings."""

    record_counts: Mapping[str, int]
    grouped_counts: Mapping[str, Mapping[str, int]]
    provenance_counts: Mapping[str, int]
    field_season_flags: Mapping[str, Mapping[str, Mapping[str, int]]]
    evidence_classification_counts: Mapping[str, int]
    record_classifications: tuple[Mapping[str, Any], ...]
    action_outcome_coverage: Mapping[str, Any]
    diagnostic_counts: Mapping[str, int]
    evaluation_refusal_reasons: tuple[str, ...]
    coverage_warnings: tuple[str, ...]
    findings: tuple[ValidationFinding, ...]
    raw_records: tuple[Any, ...]
    normalized_records: tuple[Mapping[str, Any], ...]
    evaluation_status: str
    caller_declarations_authenticity: str = "not_independently_established"
    causal_effects: str = "not_estimated"
    policy_performance: str = "not_evaluated"
    rewards_calculated: bool = False
    policy_trained: bool = False

    def __post_init__(self) -> None:
        for name in (
            "record_counts",
            "grouped_counts",
            "provenance_counts",
            "field_season_flags",
            "evidence_classification_counts",
            "action_outcome_coverage",
            "diagnostic_counts",
        ):
            object.__setattr__(self, name, _freeze(getattr(self, name)))
        object.__setattr__(
            self,
            "record_classifications",
            tuple(_freeze(item) for item in self.record_classifications),
        )
        object.__setattr__(self, "findings", tuple(self.findings))
        object.__setattr__(
            self, "raw_records", tuple(_freeze(item) for item in self.raw_records)
        )
        object.__setattr__(
            self,
            "normalized_records",
            tuple(_freeze(item) for item in self.normalized_records),
        )
        object.__setattr__(
            self, "evaluation_refusal_reasons", tuple(self.evaluation_refusal_reasons)
        )
        object.__setattr__(self, "coverage_warnings", tuple(self.coverage_warnings))

    def to_dict(self) -> dict[str, Any]:
        return {
            "record_counts": _thaw(self.record_counts),
            "grouped_counts": _thaw(self.grouped_counts),
            "provenance_counts": _thaw(self.provenance_counts),
            "field_season_flags": _thaw(self.field_season_flags),
            "evidence_classification_counts": _thaw(
                self.evidence_classification_counts
            ),
            "record_classifications": [
                _thaw(item) for item in self.record_classifications
            ],
            "action_outcome_coverage": _thaw(self.action_outcome_coverage),
            "diagnostic_counts": _thaw(self.diagnostic_counts),
            "evaluation_status": self.evaluation_status,
            "evaluation_refusal_reasons": list(self.evaluation_refusal_reasons),
            "coverage_warnings": list(self.coverage_warnings),
            "findings": [_as_dict_finding(item) for item in self.findings],
            "caller_declarations_authenticity": self.caller_declarations_authenticity,
            "causal_effects": self.causal_effects,
            "policy_performance": self.policy_performance,
            "rewards_calculated": self.rewards_calculated,
            "policy_trained": self.policy_trained,
        }


def build_data_quality_report(
    source: Any = (),
    *,
    required_action_ids: Optional[Iterable[str]] = None,
    required_outcome_types: Optional[Iterable[str]] = None,
) -> FarmDataQualityReport:
    """Build a deterministic report from an import, offline dataset, or records.

    Validation and evaluation eligibility are delegated to Phase 15. A bare
    summary report is insufficient because it does not retain record-level
    inputs; pass its ``OfflineEvaluationDataset`` or the original records.
    """
    from src.data.farm_outcomes import FarmOutcomeImport

    action_ids = _materialize_ids(required_action_ids, "required_action_ids")
    outcome_types = _materialize_ids(required_outcome_types, "required_outcome_types")

    original_findings: tuple[ValidationFinding, ...] = ()
    if isinstance(source, FarmOutcomeImport):
        raw_records = list(source.raw_records)
        records = [_thaw(record) for record in source.normalized_records]
        original_findings = tuple(source.findings)
        if action_ids is None and outcome_types is None:
            validation = source.contract_validation
            offline = source.offline_evaluation
        else:
            validation = validate_outcome_records(records, action_ids)
            offline = prepare_offline_evaluation_data(records, action_ids)
    elif isinstance(source, OfflineEvaluationDataset):
        raw_records = list(source.raw_records)
        records = [dict(record) for record in source.raw_records]
        original_findings = tuple(source.validation.findings)
        if action_ids is None and outcome_types is None:
            validation = source.validation
            offline = source
        else:
            validation = validate_outcome_records(records, action_ids)
            offline = prepare_offline_evaluation_data(records, action_ids)
    else:
        if isinstance(source, (str, bytes, Mapping)):
            raise TypeError(
                "source must be an ingestion/evaluation result or an iterable "
                "of outcome-record mappings."
            )
        try:
            raw_records = list(source)
        except TypeError as error:
            raise TypeError(
                "source must be an ingestion/evaluation result or an iterable "
                "of outcome-record mappings."
            ) from error
        records = [
            deepcopy(dict(record)) if isinstance(record, Mapping) else deepcopy(record)
            for record in raw_records
        ]
        validation = validate_outcome_records(records, action_ids)
        offline = prepare_offline_evaluation_data(records, action_ids)

    findings = _unique_findings(
        (*original_findings, *validation.findings)
    )
    eligible_ids = (
        {
            (record.get("event_id"), record.get("outcome_id"))
            for group in offline.groups.values()
            for record in group
        }
        if offline.validation.valid and offline.validation.split_metadata_valid
        else set()
    )
    errors_by_record: dict[Optional[str], list[ValidationFinding]] = defaultdict(list)
    for finding in validation.findings:
        if finding.severity == "error":
            errors_by_record[finding.record_id].append(finding)

    grouped: dict[str, Counter[str]] = {
        name: Counter()
        for name in ("provenance", "field", "season", "split", "action", "outcome_type")
    }
    provenance_counts = Counter(
        {name: 0 for name in ("observed", "synthetic_demo", "planned", "unknown")}
    )
    evidence_counts = Counter(
        {
            "schema_valid": 0,
            "observed_declared": 0,
            "measurement_linked": 0,
            "evaluation_eligible": 0,
            "insufficient_coverage": 0,
            "provenance_unverified": 0,
        }
    )
    classifications = []
    missing_by_field_season: dict[str, dict[str, Counter[str]]] = defaultdict(
        lambda: defaultdict(Counter)
    )
    action_stats: dict[str, Counter[str]] = defaultdict(Counter)
    linkage_issue_count = 0

    for record in records:
        if not isinstance(record, Mapping):
            classifications.append(
                {
                    "record_id": None,
                    "categories": [
                        "insufficient_coverage",
                        "provenance_unverified",
                    ],
                    "provenance": "unknown",
                }
            )
            provenance_counts["unknown"] += 1
            evidence_counts["insufficient_coverage"] += 1
            evidence_counts["provenance_unverified"] += 1
            continue

        record_id = _label(record.get("event_id"))
        if record_id == "<missing>":
            record_id = None
        provenance = _provenance_class(record)
        provenance_counts[provenance] += 1
        for group_name, value in (
            ("provenance", provenance),
            ("field", record.get("field_id")),
            ("season", record.get("season_id")),
            ("split", record.get("split")),
            ("action", record.get("action_id")),
            ("outcome_type", record.get("outcome_name")),
        ):
            grouped[group_name][_label(value)] += 1

        record_errors = errors_by_record.get(record_id, [])
        schema_valid = bool(record_id) and not record_errors
        observed_declared = provenance == "observed"
        has_measurement = (
            record.get("outcome_missing") is False
            and record.get("outcome_value") is not None
            and record.get("outcome_id") is not None
        )
        link_fields = {
            "action_status",
            "action_timestamp",
            "linked_action_event_id",
            "decision_timestamp",
            "measurement_timestamp",
            "outcome_window_start",
        }
        valid_link = (
            has_measurement
            and record.get("action_status") == "confirmed_applied"
            and record.get("linked_action_event_id") == record.get("event_id")
            and not any(finding.field in link_fields for finding in record_errors)
        )
        is_eligible = (record.get("event_id"), record.get("outcome_id")) in eligible_ids
        categories = []
        if schema_valid:
            categories.append("schema_valid")
            evidence_counts["schema_valid"] += 1
        if observed_declared:
            categories.append("observed_declared")
            evidence_counts["observed_declared"] += 1
        categories.append("provenance_unverified")
        evidence_counts["provenance_unverified"] += 1
        if valid_link:
            categories.append("measurement_linked")
            evidence_counts["measurement_linked"] += 1
        if is_eligible:
            categories.append("evaluation_eligible")
            evidence_counts["evaluation_eligible"] += 1
        if schema_valid and (
            not is_eligible
            or offline.policy_performance_status
            == "refused_insufficient_or_invalid_observed_data"
        ):
            categories.append("insufficient_coverage")
            evidence_counts["insufficient_coverage"] += 1
        classifications.append(
            {
                "record_id": record_id,
                "categories": categories,
                "provenance": provenance,
            }
        )

        field_id = _label(record.get("field_id"))
        season_id = _label(record.get("season_id"))
        flag_counts = missing_by_field_season[field_id][season_id]
        missingness_flags = record.get("missingness_flags", ())
        if isinstance(missingness_flags, (list, tuple)):
            for flag in missingness_flags:
                if isinstance(flag, str):
                    flag_counts[f"missingness:{flag}"] += 1
        quality_flags = record.get("data_quality_flags", ())
        if isinstance(quality_flags, (list, tuple)):
            for flag in quality_flags:
                if isinstance(flag, str):
                    flag_counts[f"quality:{flag}"] += 1

        action_id = _label(record.get("action_id"))
        if record.get("action_status") == "confirmed_applied":
            action_stats[action_id]["confirmed_applied"] += 1
            if valid_link:
                action_stats[action_id]["linked_measured_outcome"] += 1
                if provenance == "observed" and schema_valid:
                    action_stats[action_id][
                        "observed_schema_valid_linked_outcome"
                    ] += 1
            else:
                action_stats[action_id]["without_linked_outcome"] += 1
        if has_measurement and not valid_link:
            linkage_issue_count += 1

    diagnostics = _diagnostic_counts(findings)
    coverage_warnings = []
    for action, coverage in validation.action_coverage.items():
        if coverage.get("observed", 0) == 0:
            coverage_warnings.append(
                f"Action {action!r} has no observed measured outcome coverage."
            )
    for split, action_counts in validation.split_action_coverage.items():
        for action, count in action_counts.items():
            if count == 0:
                coverage_warnings.append(
                    f"Action {action!r} has no observed outcome in the {split!r} split."
                )
    present_observed_types = {
        record.get("outcome_name")
        for record in records
        if isinstance(record, Mapping)
        and _provenance_class(record) == "observed"
        and record.get("outcome_missing") is False
        and record.get("action_status") == "confirmed_applied"
    }
    for outcome_type in outcome_types or ():
        if outcome_type not in present_observed_types:
            coverage_warnings.append(
                f"Required outcome type {outcome_type!r} has no declared observed coverage."
            )
    if validation.record_count == 0:
        coverage_warnings.append("No input records were supplied.")
    if validation.observed_outcome_count == 0:
        coverage_warnings.append("No observed measured outcomes are available.")

    refusal_reasons = list(offline.refusal_reasons)
    refusal_reasons.extend(
        f"Required outcome type {name!r} has no declared observed coverage."
        for name in (outcome_types or ())
        if name not in present_observed_types
    )
    counts = {
        "total_input": validation.record_count,
        "valid": validation.valid_record_count,
        "invalid": max(0, validation.record_count - validation.valid_record_count),
        "evaluation_eligible": sum(
            len(group) for group in offline.groups.values()
        ),
    }
    action_coverage = {
        "confirmed_applied_actions_with_linked_measured_outcomes": sum(
            item["linked_measured_outcome"] for item in action_stats.values()
        ),
        "observed_schema_valid_actions_with_linked_measured_outcomes": sum(
            item["observed_schema_valid_linked_outcome"]
            for item in action_stats.values()
        ),
        "actions_without_linked_outcomes": sum(
            item["without_linked_outcome"] for item in action_stats.values()
        ),
        "outcomes_without_valid_action_linkage": linkage_issue_count,
        "by_action": {
            action: dict(action_stats[action])
            for action in sorted(action_stats)
        },
        "phase15_action_coverage": _thaw(validation.action_coverage),
        "phase15_split_action_coverage": _thaw(validation.split_action_coverage),
        "required_outcome_types": list(outcome_types or ()),
        "missing_required_outcome_types": [
            name
            for name in (outcome_types or ())
            if name not in present_observed_types
        ],
    }
    field_season_flags = {
        field_id: {
            season_id: dict(sorted(counters.items()))
            for season_id, counters in sorted(seasons.items())
        }
        for field_id, seasons in sorted(missing_by_field_season.items())
    }

    return FarmDataQualityReport(
        record_counts=counts,
        grouped_counts={
            group: dict(sorted(counter.items()))
            for group, counter in sorted(grouped.items())
        },
        provenance_counts=dict(sorted(provenance_counts.items())),
        field_season_flags=field_season_flags,
        evidence_classification_counts=dict(sorted(evidence_counts.items())),
        record_classifications=tuple(classifications),
        action_outcome_coverage=action_coverage,
        diagnostic_counts=diagnostics,
        evaluation_refusal_reasons=tuple(dict.fromkeys(refusal_reasons)),
        coverage_warnings=tuple(sorted(set(coverage_warnings))),
        findings=findings,
        raw_records=tuple(raw_records),
        normalized_records=tuple(
            record if isinstance(record, Mapping) else {"invalid_record": record}
            for record in records
        ),
        evaluation_status=offline.policy_performance_status,
    )


def _materialize_ids(values: Optional[Iterable[str]], name: str):
    if values is None:
        return None
    if isinstance(values, (str, bytes, Mapping)):
        raise TypeError(f"{name} must be an iterable of strings, not a scalar.")
    try:
        result = tuple(values)
    except TypeError as error:
        raise TypeError(f"{name} must be an iterable of strings.") from error
    if any(not isinstance(value, str) or not value.strip() for value in result):
        raise ValueError(f"{name} must contain only non-empty strings.")
    return result


def _unique_findings(
    findings: Iterable[ValidationFinding],
) -> tuple[ValidationFinding, ...]:
    result = []
    seen = set()
    for finding in findings:
        key = (finding.severity, finding.field, finding.record_id, finding.explanation)
        if key not in seen:
            seen.add(key)
            result.append(finding)
    return tuple(result)


def _diagnostic_counts(
    findings: Iterable[ValidationFinding],
) -> dict[str, int]:
    counts = Counter(
        {
            "duplicate_identifiers": 0,
            "timestamp_order_errors": 0,
            "unit_issues": 0,
            "split_leakage": 0,
            "overlapping_outcome_windows": 0,
            "action_linkage_issues": 0,
        }
    )
    for finding in findings:
        explanation = finding.explanation.lower()
        if "duplicate" in explanation and "id" in explanation:
            counts["duplicate_identifiers"] += 1
        if "timestamp" in explanation or "must not" in explanation and "time" in explanation:
            counts["timestamp_order_errors"] += 1
        if finding.field == "outcome_unit" or "unit " in explanation or "units" in explanation:
            counts["unit_issues"] += 1
        if "leakage" in explanation or "cross splits" in explanation:
            counts["split_leakage"] += 1
        if "overlapping outcome windows" in explanation:
            counts["overlapping_outcome_windows"] += 1
        if finding.field in {
            "linked_action_event_id",
            "action_status",
        } and finding.severity == "error":
            counts["action_linkage_issues"] += 1
    return dict(sorted(counts.items()))
