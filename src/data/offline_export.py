"""Deterministic read-only export of prepared offline evaluation datasets."""

import hashlib
import json
import os
import tempfile
from collections import Counter
from collections.abc import Iterable, Mapping
from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Optional, Union

from src.data.data_quality import FarmDataQualityReport, build_data_quality_report
from src.data.farm_outcomes import FarmOutcomeImport, ingest_farm_outcomes
from src.rl.outcomes import OfflineEvaluationDataset, prepare_offline_evaluation_data

EXPORT_SCHEMA_VERSION = "fieldshift.offline-evaluation.v1"
SPLIT_NAMES = ("train", "validation", "test")
_PREPARED_STATUS = "prepared_for_offline_analysis_no_performance_claim"
_RECORD_ORDER_FIELDS = (
    "field_id",
    "season_id",
    "episode_id",
    "decision_timestamp",
    "event_id",
    "outcome_id",
)


@dataclass(frozen=True)
class OfflineExportResult:
    """Export outcome, including explicit refusal without a dataset file."""

    status: str
    output_path: Path
    report: Mapping[str, Any]
    written: bool

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "output_path": str(self.output_path),
            "written": self.written,
            "report": dict(self.report),
        }


def export_offline_evaluation(
    source: Union[
        str,
        Path,
        FarmOutcomeImport,
        OfflineEvaluationDataset,
        Iterable[Mapping[str, Any]],
    ],
    output_path: Union[str, Path],
    *,
    overwrite: bool = False,
    created_at: Optional[str] = None,
) -> OfflineExportResult:
    """Prepare and atomically export only a fully prepared offline dataset.

    ``created_at`` is omitted unless supplied explicitly, keeping equivalent
    input/options byte-identical. If source is a CSV path, its SHA-256 is
    recorded; the digest identifies file bytes but does not authenticate them.
    A refused preparation returns its reasons and writes no export file.
    """
    if not isinstance(overwrite, bool):
        raise TypeError("overwrite must be a boolean.")
    if created_at is not None:
        _validate_created_at(created_at)
    destination = _resolve_destination(output_path, overwrite=overwrite)

    source_path: Optional[Path] = None
    source_hash: Optional[str] = None
    if isinstance(source, (str, Path)):
        source_path = _resolve_input(source)
        if _same_path(destination, source_path):
            raise ValueError("Output path must not refer to the input CSV.")
        _ensure_destination_available(destination, overwrite)
        source_hash = _sha256_file(source_path)
        imported = ingest_farm_outcomes(source_path)
        if source_hash != _sha256_file(source_path):
            raise OSError("Input CSV changed while it was being ingested.")
    elif isinstance(source, FarmOutcomeImport):
        imported = source
        if imported.source_path is not None:
            source_path = _resolve_input(imported.source_path)
            if _same_path(destination, source_path):
                raise ValueError("Output path must not refer to the input CSV.")
            _ensure_destination_available(destination, overwrite)
            source_hash = _sha256_file(source_path)
            file_import = ingest_farm_outcomes(
                source_path,
                required_action_ids=tuple(
                    imported.contract_validation.action_coverage
                ),
            )
            if source_hash != _sha256_file(source_path):
                raise OSError("Input CSV changed while it was being ingested.")
            imported = file_import
        else:
            _ensure_destination_available(destination, overwrite)
    elif isinstance(source, OfflineEvaluationDataset):
        _ensure_destination_available(destination, overwrite)
        imported = None
        offline = prepare_offline_evaluation_data(source.raw_records)
    else:
        _ensure_destination_available(destination, overwrite)
        imported = ingest_farm_outcomes(source)

    if imported is not None:
        offline = imported.offline_evaluation
        quality = build_data_quality_report(imported)
        findings = imported.findings
        validation = imported.contract_validation
        provenance_counts = dict(imported.provenance_counts)
        records_by_split = {
            split: [_plain(record) for record in offline.groups.get(split, ())]
            for split in SPLIT_NAMES
        }
        input_record_count = imported.record_count
        valid_record_count = validation.valid_record_count
        invalid_record_count = max(0, input_record_count - valid_record_count)
    if imported is None:
        quality = build_data_quality_report(offline)
        findings = offline.validation.findings
        validation = offline.validation
        provenance_counts = dict(quality.provenance_counts)
        records_by_split = {
            split: [_plain(record) for record in offline.groups.get(split, ())]
            for split in SPLIT_NAMES
        }
        input_record_count = validation.record_count
        valid_record_count = validation.valid_record_count
        invalid_record_count = max(0, input_record_count - valid_record_count)

    for split in SPLIT_NAMES:
        records_by_split[split].sort(key=_record_sort_key)
    prepared = (
        (imported is None or imported.valid)
        and offline.policy_performance_status == _PREPARED_STATUS
        and offline.validation.valid
        and offline.validation.split_metadata_valid
        and all(records_by_split[split] for split in SPLIT_NAMES)
    )
    reasons = list(offline.refusal_reasons)
    if imported is not None and not imported.valid:
        reasons.extend(
            finding.explanation
            for finding in imported.findings
            if finding.severity == "error"
        )
    if not prepared and not reasons:
        reasons.append(
            "Offline preparation is not fully ready; no evaluation dataset was exported."
        )

    if prepared:
        exported_records = [
            record
            for split in SPLIT_NAMES
            for record in records_by_split[split]
        ]
        exported_counts = _group_export_counts(records_by_split)
        partitions = records_by_split
        status = "exported_no_performance_claim"
    else:
        exported_records = []
        exported_counts = {
            "by_split": {split: 0 for split in SPLIT_NAMES},
            "by_action": {},
            "by_outcome": {},
            "by_provenance": {},
        }
        partitions = {split: [] for split in SPLIT_NAMES}
        status = "refused"

    report: dict[str, Any] = {
        "export_schema_version": EXPORT_SCHEMA_VERSION,
        "status": status,
        "source": {
            "kind": "csv" if source_path is not None else "caller_records",
            "sha256": source_hash,
            "authenticity": "not_independently_established",
        },
        "counts": {
            "input_records": input_record_count,
            "valid_records": valid_record_count,
            "invalid_records": invalid_record_count,
            "evaluation_eligible_records": len(exported_records),
            "by_split": exported_counts["by_split"],
            "by_action": exported_counts["by_action"],
            "by_outcome": exported_counts["by_outcome"],
            "by_provenance": exported_counts["by_provenance"],
            "input_provenance": provenance_counts,
        },
        "validation_findings": [
            _finding_dict(item) for item in _sort_findings(findings)
        ],
        "dataset_refusal_reasons": reasons,
        "quality_summary": _stable_quality_summary(quality.to_dict()),
        "offline_evaluation_status": offline.policy_performance_status,
        "limitations": {
            "declared_provenance_authenticated": False,
            "causal_validity_proven": False,
            "policy_performance_established": False,
            "rewards_calculated": False,
            "policy_trained": False,
            "records_are_observational_evidence_only": True,
        },
        "partitions": partitions,
    }
    if created_at is not None:
        report["created_at"] = created_at

    if not prepared:
        return OfflineExportResult(
            status=status,
            output_path=destination,
            report=report,
            written=False,
        )
    _atomic_write_json(destination, report, overwrite=overwrite)
    return OfflineExportResult(
        status=status,
        output_path=destination,
        report=report,
        written=True,
    )


def _validate_created_at(value: str) -> None:
    if not isinstance(value, str):
        raise TypeError("created_at must be an ISO-8601 string.")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError("created_at must be a valid ISO-8601 timestamp.") from error
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError("created_at must include an explicit timezone.")


def _resolve_destination(value: Union[str, Path], *, overwrite: bool) -> Path:
    path = Path(value).expanduser()
    if not path.is_absolute():
        raise ValueError("output_path must be an explicit absolute path.")
    try:
        resolved = path.resolve(strict=False)
    except (OSError, RuntimeError) as error:
        raise ValueError(f"Cannot resolve output path '{value}': {error}") from error
    if not resolved.parent.is_dir():
        raise FileNotFoundError(f"Output directory does not exist: {resolved.parent}")
    if resolved.exists() and resolved.is_dir():
        raise IsADirectoryError(f"Output path is a directory: {resolved}")
    return resolved


def _ensure_destination_available(destination: Path, overwrite: bool) -> None:
    if destination.exists() and not overwrite:
        raise FileExistsError(
            f"Output already exists; pass overwrite=True to replace it: {destination}"
        )


def _resolve_input(value: Union[str, Path]) -> Path:
    path = Path(value).expanduser()
    try:
        resolved = path.resolve(strict=True)
    except (OSError, RuntimeError) as error:
        raise FileNotFoundError(f"Cannot resolve input CSV path '{value}': {error}") from error
    if not resolved.is_file():
        raise FileNotFoundError(f"Input CSV is not a regular file: {resolved}")
    return resolved


def _same_path(first: Path, second: Path) -> bool:
    if first == second:
        return True
    if first.exists() and second.exists():
        try:
            return first.samefile(second)
        except OSError:
            return False
    return False


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _record_sort_key(record: Mapping[str, Any]) -> tuple[str, ...]:
    return tuple(
        "" if record.get(name) is None else str(record.get(name))
        for name in _RECORD_ORDER_FIELDS
    )


def _plain(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {deepcopy(key): _plain(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_plain(item) for item in value]
    if isinstance(value, (set, frozenset)):
        return [_plain(item) for item in sorted(value, key=repr)]
    return deepcopy(value)


def _group_export_counts(records_by_split: Mapping[str, list[Mapping[str, Any]]]):
    by_action = Counter()
    by_outcome = Counter()
    by_provenance = Counter()
    by_split = {}
    for split in SPLIT_NAMES:
        records = records_by_split[split]
        by_split[split] = len(records)
        for record in records:
            by_action[str(record.get("action_id"))] += 1
            by_outcome[str(record.get("outcome_name"))] += 1
            by_provenance[_record_provenance(record)] += 1
    return {
        "by_split": by_split,
        "by_action": dict(sorted(by_action.items())),
        "by_outcome": dict(sorted(by_outcome.items())),
        "by_provenance": dict(sorted(by_provenance.items())),
    }


def _record_provenance(record: Mapping[str, Any]) -> str:
    provenance = record.get("provenance")
    nested = provenance.get("data_status") if isinstance(provenance, Mapping) else None
    declared = record.get("data_status")
    if declared == nested == "observed":
        return "observed"
    if declared in {"synthetic", "demo"} or nested in {"synthetic", "demo"}:
        return "synthetic_demo"
    if declared == "planned" or nested == "planned":
        return "planned"
    return "unknown"


def _finding_dict(finding: Any) -> dict[str, Any]:
    return finding.to_dict()


def _sort_findings(findings: Iterable[Any]) -> list[Any]:
    return sorted(
        findings,
        key=lambda finding: (
            finding.severity,
            finding.field or "",
            finding.record_id or "",
            finding.explanation,
        ),
    )


def _stable_quality_summary(value: Mapping[str, Any]) -> dict[str, Any]:
    result = dict(value)
    result["record_classifications"] = sorted(
        result["record_classifications"],
        key=lambda row: (
            row.get("record_id") or "",
            row.get("provenance") or "",
        ),
    )
    result["findings"] = sorted(
        result["findings"],
        key=lambda finding: (
            finding["severity"],
            finding.get("field") or "",
            finding.get("record_id") or "",
            finding["explanation"],
        ),
    )
    result["coverage_warnings"] = sorted(result["coverage_warnings"])
    result["evaluation_refusal_reasons"] = sorted(
        result["evaluation_refusal_reasons"]
    )
    return result


def _atomic_write_json(
    destination: Path,
    report: Mapping[str, Any],
    *,
    overwrite: bool,
) -> None:
    payload = json.dumps(
        report,
        ensure_ascii=False,
        allow_nan=False,
        indent=2,
        sort_keys=True,
    ) + "\n"
    file_descriptor, temp_name = tempfile.mkstemp(
        prefix=f".{destination.name}.",
        suffix=".tmp",
        dir=str(destination.parent),
    )
    temp_path = Path(temp_name)
    try:
        with os.fdopen(file_descriptor, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(payload)
            stream.flush()
            os.fsync(stream.fileno())
        if overwrite:
            os.replace(temp_path, destination)
        else:
            try:
                os.link(temp_path, destination)
            except FileExistsError:
                raise FileExistsError(
                    f"Output already exists; pass overwrite=True to replace it: "
                    f"{destination}"
                ) from None
            temp_path.unlink()
    except Exception:
        try:
            temp_path.unlink()
        except FileNotFoundError:
            pass
        raise
