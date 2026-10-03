"""Controlled ingestion for caller-provided farm action/outcome records.

No records are bundled here. CSV and mapping inputs are preserved separately
from their normalized snapshots and are never repaired, imputed, or dropped.
"""

import csv
import json
from collections import Counter
from collections.abc import Iterable, Mapping
from copy import deepcopy
from dataclasses import dataclass
from pathlib import Path
from types import MappingProxyType
from typing import Any, Optional, Union

from src.rl.outcomes import (
    OUTCOME_RECORD_FIELDS,
    OfflineEvaluationDataset,
    OutcomeValidationReport,
    ValidationFinding,
    prepare_offline_evaluation_data,
    validate_outcome_records,
)

FarmOutcomeSource = Union[str, Path, Iterable[Mapping[str, Any]]]
_NULLABLE_CSV_FIELDS = {
    "outcome_id",
    "action_timestamp",
    "linked_action_event_id",
    "outcome_name",
    "outcome_value",
    "outcome_unit",
    "measurement_timestamp",
    "outcome_window_start",
    "outcome_window_end",
    "measurement_method",
}
_MAPPING_CSV_FIELDS = {"action_parameters", "provenance"}
_LIST_CSV_FIELDS = {"missingness_flags", "data_quality_flags"}
_BOOLEAN_CSV_FIELDS = {"outcome_missing"}
_NUMERIC_CSV_FIELDS = {"outcome_value"}
_STATUS_VALUES = {"observed", "synthetic", "demo", "planned", "missing"}


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


def _record_id(record: Any) -> Optional[str]:
    if isinstance(record, Mapping):
        event_id = record.get("event_id")
        if isinstance(event_id, str) and event_id.strip():
            return event_id.strip()
    return None


def _finding(
    severity: str,
    field: Optional[str],
    record: Any,
    explanation: str,
) -> ValidationFinding:
    return ValidationFinding(severity, field, _record_id(record), explanation)


def _csv_value(field: str, raw: Any) -> Any:
    if raw is None:
        return None
    if not isinstance(raw, str):
        return raw
    value = raw.strip()
    if field in _NULLABLE_CSV_FIELDS and value == "":
        return None
    if field in _MAPPING_CSV_FIELDS or field in _LIST_CSV_FIELDS:
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return raw
    if field in _BOOLEAN_CSV_FIELDS:
        lowered = value.lower()
        if lowered == "true":
            return True
        if lowered == "false":
            return False
        return raw
    if field in _NUMERIC_CSV_FIELDS:
        try:
            return float(value)
        except (TypeError, ValueError, OverflowError):
            return raw
    if field == "data_status":
        return value.lower()
    if field in {"event_id", "outcome_id", "field_id", "season_id", "episode_id", "split", "action_id", "action_status", "outcome_name", "outcome_unit", "source", "measurement_method", "linked_action_event_id"}:
        return value
    return raw


def _parse_csv(path: Path):
    findings = []
    raw_rows = []
    normalized = []
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as stream:
            reader = csv.reader(stream)
            try:
                header = next(reader)
            except StopIteration:
                finding = _finding(
                    "error", None, None, "CSV input is empty and has no header."
                )
                return [], [], (), [finding]
            duplicate_headers = sorted(
                name for name, count in Counter(header).items() if count > 1
            )
            missing_columns = sorted(set(OUTCOME_RECORD_FIELDS) - set(header))
            extra_columns = sorted(set(header) - set(OUTCOME_RECORD_FIELDS))
            if duplicate_headers:
                findings.append(
                    _finding(
                        "error",
                        None,
                        None,
                        "CSV contains duplicate column names: "
                        + ", ".join(duplicate_headers),
                    )
                )
            if missing_columns:
                findings.append(
                    _finding(
                        "error",
                        None,
                        None,
                        "CSV is missing required columns: "
                        + ", ".join(missing_columns),
                    )
                )
            if extra_columns:
                findings.append(
                    _finding(
                        "error",
                        None,
                        None,
                        "CSV contains unsupported extra columns: "
                        + ", ".join(extra_columns),
                    )
                )
            for row_number, row in enumerate(reader, start=2):
                raw_rows.append(tuple(row))
                raw_record = {
                    header[index]: row[index] if index < len(row) else None
                    for index in range(len(header))
                }
                if len(row) != len(header):
                    findings.append(
                        _finding(
                            "error",
                            None,
                            raw_record,
                            f"CSV row {row_number} has {len(row)} values for "
                            f"{len(header)} columns.",
                        )
                    )
                normalized_record = {
                    field: _csv_value(field, raw_record.get(field))
                    for field in OUTCOME_RECORD_FIELDS
                }
                for extra in extra_columns:
                    normalized_record[extra] = raw_record.get(extra)
                if duplicate_headers:
                    normalized_record["__duplicate_headers__"] = duplicate_headers
                if len(row) > len(header):
                    normalized_record["__extra_cells__"] = row[len(header) :]
                normalized.append(normalized_record)
    except (OSError, UnicodeError, csv.Error) as error:
        raise ValueError(f"Could not read farm outcomes CSV '{path}': {error}") from error
    return raw_rows, normalized, tuple(header), findings


def _structured_records(records: Iterable[Mapping[str, Any]]):
    if isinstance(records, (str, bytes, Mapping)):
        raise TypeError("records must be a CSV path or an iterable of mappings.")
    try:
        raw_records = list(records)
    except TypeError as error:
        raise TypeError(
            "records must be a CSV path or an iterable of mappings."
        ) from error
    normalized = []
    findings = []
    for index, record in enumerate(raw_records):
        if not isinstance(record, Mapping):
            findings.append(
                _finding(
                    "error",
                    None,
                    None,
                    f"Structured input record at index {index} is not a mapping.",
                )
            )
            normalized.append({"__invalid_record__": deepcopy(record)})
            continue
        normalized.append(deepcopy(dict(record)))
    return raw_records, normalized, (), findings


def _provenance_classification(record: Mapping[str, Any]) -> str:
    declared = record.get("data_status")
    provenance = record.get("provenance")
    provenance_status = (
        provenance.get("data_status") if isinstance(provenance, Mapping) else None
    )
    statuses = {
        value for value in (declared, provenance_status) if isinstance(value, str)
    }
    if declared == "observed" and provenance_status == "observed":
        return "observed"
    if statuses.intersection({"synthetic", "demo"}):
        return "synthetic_demo"
    if declared == "planned" or provenance_status == "planned":
        return "planned"
    return "unknown"


@dataclass(frozen=True)
class FarmOutcomeImport:
    """Immutable import result retaining raw and separately normalized inputs."""

    raw_records: tuple[Any, ...]
    normalized_records: tuple[Mapping[str, Any], ...]
    raw_csv_rows: tuple[tuple[str, ...], ...]
    csv_columns: tuple[str, ...]
    findings: tuple[ValidationFinding, ...]
    contract_validation: OutcomeValidationReport
    offline_evaluation: OfflineEvaluationDataset
    provenance_counts: Mapping[str, int]
    source_path: Optional[str]

    def __post_init__(self) -> None:
        object.__setattr__(
            self, "raw_records", tuple(_freeze(record) for record in self.raw_records)
        )
        object.__setattr__(
            self,
            "normalized_records",
            tuple(_freeze(record) for record in self.normalized_records),
        )
        object.__setattr__(
            self,
            "raw_csv_rows",
            tuple(tuple(row) for row in self.raw_csv_rows),
        )
        object.__setattr__(self, "csv_columns", tuple(self.csv_columns))
        object.__setattr__(self, "findings", tuple(self.findings))
        object.__setattr__(self, "provenance_counts", _freeze(self.provenance_counts))

    @property
    def valid(self) -> bool:
        return (
            self.contract_validation.valid
            and not any(finding.severity == "error" for finding in self.findings)
        )

    @property
    def record_count(self) -> int:
        return len(self.normalized_records)

    def to_dict(self) -> dict[str, Any]:
        return {
            "source_path": self.source_path,
            "record_count": self.record_count,
            "valid_record_count": self.contract_validation.valid_record_count,
            "invalid_record_count": max(
                0, self.record_count - self.contract_validation.valid_record_count
            ),
            "provenance_counts": _thaw(self.provenance_counts),
            "valid": self.valid,
            "contract_validation": self.contract_validation.to_dict(),
            "offline_evaluation_status": (
                self.offline_evaluation.policy_performance_status
            ),
            "offline_evaluation_refusal_reasons": list(
                self.offline_evaluation.refusal_reasons
            ),
            "findings": [finding.to_dict() for finding in self.findings],
            "policy_trained": False,
            "rewards_calculated": False,
        }

    def to_bundle_dict(self) -> dict[str, Any]:
        """Create detached, JSON-serializable import report and record snapshots."""
        return {
            "import_report": self.to_dict(),
            "csv_columns": list(self.csv_columns),
            "raw_csv_rows": [list(row) for row in self.raw_csv_rows],
            "raw_records": [_thaw(record) for record in self.raw_records],
            "normalized_records": [
                _thaw(record) for record in self.normalized_records
            ],
        }

    def write_json(self, output_path: Union[str, Path], *, overwrite: bool = False) -> Path:
        """Write an explicit JSON bundle, refusing replacement unless opted in."""
        if not isinstance(overwrite, bool):
            raise TypeError("overwrite must be a boolean.")
        path = Path(output_path)
        if not path.is_absolute():
            raise ValueError("output_path must be an explicit absolute path.")
        if not path.parent.is_dir():
            raise FileNotFoundError(f"Output directory does not exist: {path.parent}")
        payload = json.dumps(
            self.to_bundle_dict(),
            ensure_ascii=False,
            allow_nan=False,
            indent=2,
        )
        if overwrite:
            with path.open("w", encoding="utf-8", newline="\n") as stream:
                stream.write(payload)
                stream.write("\n")
        else:
            try:
                with path.open("x", encoding="utf-8", newline="\n") as stream:
                    stream.write(payload)
                    stream.write("\n")
            except FileExistsError:
                raise FileExistsError(
                    f"Output already exists; pass overwrite=True to replace it: {path}"
                ) from None
        return path


def ingest_farm_outcomes(
    source: FarmOutcomeSource,
    *,
    required_action_ids: Optional[Iterable[str]] = None,
) -> FarmOutcomeImport:
    """Ingest CSV or mapping rows without asserting unknown provenance is observed.

    CSV nested mappings and flag lists use JSON cells. ``outcome_missing`` must
    be the literal ``true`` or ``false``. Malformed cells are preserved in the
    normalized representation and surfaced by Phase 15 contract validation.
    """
    if required_action_ids is None:
        action_ids = None
    else:
        if isinstance(required_action_ids, (str, bytes, Mapping)):
            raise TypeError("required_action_ids must be an iterable of action IDs.")
        try:
            action_ids = tuple(required_action_ids)
        except TypeError as error:
            raise TypeError(
                "required_action_ids must be an iterable of action IDs."
            ) from error

    if isinstance(source, (str, Path)):
        path = Path(source)
        if not path.is_file():
            raise FileNotFoundError(f"Farm outcomes CSV was not found: {path}")
        raw_rows, normalized, columns, findings = _parse_csv(path)
        raw_records = [
            {
                columns[index]: row[index] if index < len(row) else None
                for index in range(len(columns))
            }
            for row in raw_rows
        ]
        source_path = str(path.resolve())
    else:
        raw_records, normalized, columns, findings = _structured_records(source)
        raw_rows = []
        source_path = None

    provenance_counts = Counter(
        _provenance_classification(record)
        for record in normalized
        if isinstance(record, Mapping)
    )
    for record in normalized:
        if not isinstance(record, Mapping):
            continue
        declared = record.get("data_status")
        provenance = record.get("provenance")
        provenance_status = (
            provenance.get("data_status") if isinstance(provenance, Mapping) else None
        )
        if (
            isinstance(declared, str)
            and declared in _STATUS_VALUES
            and isinstance(provenance_status, str)
            and provenance_status in _STATUS_VALUES
        ):
            if declared != provenance_status:
                findings.append(
                    _finding(
                        "error",
                        "provenance.data_status",
                        record,
                        "Top-level data_status conflicts with provenance.data_status; "
                        "the importer will not upgrade or rewrite either value.",
                    )
                )
        elif declared == "observed" or provenance_status == "observed":
            findings.append(
                _finding(
                    "warning",
                    "data_status",
                    record,
                    "Observed provenance is incomplete or unknown; this record is "
                    "not upgraded to observed by ingestion.",
                )
            )

    contract_validation = validate_outcome_records(normalized, action_ids)
    findings.extend(contract_validation.findings)
    offline_evaluation = prepare_offline_evaluation_data(
        normalized,
        action_ids,
    )
    return FarmOutcomeImport(
        raw_records=tuple(raw_records),
        normalized_records=tuple(normalized),
        raw_csv_rows=tuple(raw_rows),
        csv_columns=tuple(columns),
        findings=tuple(findings),
        contract_validation=contract_validation,
        offline_evaluation=offline_evaluation,
        provenance_counts={
            name: provenance_counts.get(name, 0)
            for name in ("observed", "synthetic_demo", "planned", "unknown")
        },
        source_path=source_path,
    )
