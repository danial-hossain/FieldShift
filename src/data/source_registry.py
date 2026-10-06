"""Structural validation for the source registry and acquisition tracker."""

import csv
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

REGISTRY_COLUMNS = (
    "source_id",
    "provider",
    "product_name",
    "product_version",
    "evidence_class",
    "access_url",
    "access_method",
    "spatial_resolution",
    "temporal_resolution",
    "coverage_start",
    "coverage_end",
    "update_frequency",
    "native_units",
    "license",
    "attribution",
    "retrieved_at",
    "validation_status",
    "allowed_uses",
    "known_limitations",
    "verification_notes",
    "last_reviewed",
)
ACQUISITION_COLUMNS = (
    "request_id",
    "source_id",
    "requested_product",
    "request_date",
    "contact_or_url",
    "status",
    "response_date",
    "access_conditions",
    "fees",
    "license_or_agreement",
    "coverage_confirmed",
    "units_confirmed",
    "notes",
    "next_action",
)
EVIDENCE_CLASSES = {
    "observed",
    "remote_observed",
    "modelled_context",
    "recalled",
    "inferred",
    "synthetic",
}
VALIDATION_STATUSES = {
    "pending_verification",
    "institution_verified",
    "metadata_verified",
    "schema_validated",
    "data_validated",
}
ACQUISITION_STATUSES = {
    "not_started",
    "requested",
    "pending_response",
    "verified",
    "blocked",
    "not_available",
}
BLANK_EVIDENCE_STATUSES = {
    "pending_verification",
    "institution_verified",
    "metadata_verified",
}
PROTECTED_EVIDENCE_CLASSES = {
    "nasa_power_daily_point_api": "remote_observed",
    "local_nasa_power_2025": "remote_observed",
    "local_nasa_power_2026_aug_sep": "remote_observed",
    "nasa_smap_soil_moisture": "remote_observed",
    "local_smap_demo_csv": "synthetic",
    "soilgrids_global_predictions": "modelled_context",
    "sentinel_2_data": "remote_observed",
    "local_soil_demo_csv": "synthetic",
    "local_crop_knowledge_demo_csv": "synthetic",
    "local_field_history_demo_csv": "synthetic",
}
DEMO_SOURCE_IDS = {
    "local_smap_demo_csv",
    "local_soil_demo_csv",
    "local_crop_knowledge_demo_csv",
    "local_field_history_demo_csv",
}
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_REGISTRY_PATH = PROJECT_ROOT / "data" / "source_registry.csv"
DEFAULT_ACQUISITION_PATH = PROJECT_ROOT / "data" / "acquisition_log.csv"


def _read_csv(
    path: Path, required_columns: Sequence[str], label: str, errors: List[str]
) -> Tuple[List[Dict[str, str]], set]:
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            headers = reader.fieldnames or []
            if len(headers) != len(set(headers)):
                errors.append(f"{label}: duplicate column names.")
            missing = set(required_columns) - set(headers)
            if missing:
                errors.append(
                    f"{label}: missing required columns: {', '.join(sorted(missing))}."
                )
            rows = []
            for line_number, row in enumerate(reader, start=2):
                if None in row or any(value is None for value in row.values()):
                    errors.append(
                        f"{label}: row {line_number} does not match the header width."
                    )
                rows.append(
                    {
                        key: value.strip() if isinstance(value, str) else ""
                        for key, value in row.items()
                        if key is not None
                    }
                )
            return rows, set(headers)
    except (OSError, csv.Error) as error:
        errors.append(f"{label}: could not read {path}: {error}")
        return [], set()


def _validate_unique_ids(
    rows: Sequence[Dict[str, str]], id_column: str, label: str, errors: List[str]
) -> None:
    seen = set()
    for row_number, row in enumerate(rows, start=2):
        value = row.get(id_column, "")
        if not value:
            errors.append(f"{label}: row {row_number} has an empty {id_column}.")
        elif value in seen:
            errors.append(f"{label}: duplicate {id_column} {value!r}.")
        seen.add(value)


def _validate_provenance_metadata(
    rows: Sequence[Dict[str, str]], label: str, errors: List[str]
) -> None:
    for row_number, row in enumerate(rows, start=2):
        source_id = row.get("source_id", "")
        evidence_class = row.get("evidence_class", "")
        status = row.get("validation_status", "")
        access_url = row.get("access_url", "").strip()
        verification_notes = row.get("verification_notes", "").strip()
        allowed_uses = row.get("allowed_uses", "").strip()
        if evidence_class in {"remote_observed", "modelled_context"} and not access_url:
            errors.append(
                f"{label}: row {row_number} ({source_id}) requires a non-empty "
                "access_url for remote/modelled evidence."
            )
        if status in {"institution_verified", "metadata_verified"}:
            if not verification_notes:
                errors.append(
                    f"{label}: row {row_number} ({source_id}) requires "
                    "verification_notes for a verified source."
                )
            if not allowed_uses:
                errors.append(
                    f"{label}: row {row_number} ({source_id}) requires "
                    "allowed_uses for a verified source."
                )


def validate_source_registry(
    registry_path: Optional[Path] = None,
    acquisition_path: Optional[Path] = None,
) -> List[str]:
    """Return structural and evidence-label errors; an empty list means valid."""
    registry_path = Path(registry_path or DEFAULT_REGISTRY_PATH)
    acquisition_path = Path(acquisition_path or DEFAULT_ACQUISITION_PATH)
    errors: List[str] = []
    registry_rows, registry_headers = _read_csv(
        registry_path, REGISTRY_COLUMNS, "source registry", errors
    )
    acquisition_rows, acquisition_headers = _read_csv(
        acquisition_path, ACQUISITION_COLUMNS, "acquisition log", errors
    )
    if not set(REGISTRY_COLUMNS).issubset(registry_headers):
        registry_rows = []
    if not set(ACQUISITION_COLUMNS).issubset(acquisition_headers):
        acquisition_rows = []

    _validate_unique_ids(registry_rows, "source_id", "source registry", errors)
    _validate_unique_ids(acquisition_rows, "request_id", "acquisition log", errors)
    source_ids = {row.get("source_id", "") for row in registry_rows}

    for row_number, row in enumerate(registry_rows, start=2):
        source_id = row.get("source_id", "")
        evidence_class = row.get("evidence_class", "")
        status = row.get("validation_status", "")
        if evidence_class and evidence_class not in EVIDENCE_CLASSES:
            errors.append(
                f"source registry: row {row_number} has invalid evidence_class "
                f"{evidence_class!r}."
            )
        if not evidence_class and status not in BLANK_EVIDENCE_STATUSES:
            errors.append(
                f"source registry: row {row_number} has blank evidence_class "
                "for a validated dataset."
            )
        if status not in VALIDATION_STATUSES:
            errors.append(
                f"source registry: row {row_number} has invalid validation_status "
                f"{status!r}."
            )
        expected_class = PROTECTED_EVIDENCE_CLASSES.get(source_id)
        if expected_class and evidence_class != expected_class:
            errors.append(
                f"source registry: {source_id} must retain evidence_class "
                f"{expected_class!r}."
            )
        if source_id in DEMO_SOURCE_IDS:
            labels = " ".join(
                row.get(column, "")
                for column in ("product_name", "known_limitations", "allowed_uses")
            ).lower()
            if "demo" not in labels and "synthetic" not in labels:
                errors.append(
                    f"source registry: {source_id} is missing a demo/synthetic label."
                )

    _validate_provenance_metadata(registry_rows, "source registry", errors)

    for row_number, row in enumerate(acquisition_rows, start=2):
        request_id = row.get("request_id", "")
        source_id = row.get("source_id", "")
        status = row.get("status", "")
        if source_id and source_id not in source_ids:
            errors.append(
                f"acquisition log: row {row_number} ({request_id}) references "
                f"unregistered source_id {source_id!r}."
            )
        if status not in ACQUISITION_STATUSES:
            errors.append(
                f"acquisition log: row {row_number} has invalid status {status!r}."
            )
        if status == "verified":
            required_confirmation = (
                "response_date",
                "access_conditions",
                "license_or_agreement",
                "coverage_confirmed",
                "units_confirmed",
            )
            missing = [
                column for column in required_confirmation if not row.get(column, "")
            ]
            if missing:
                errors.append(
                    f"acquisition log: verified request {request_id!r} is missing "
                    f"confirmation fields: {', '.join(missing)}."
                )

    return errors


def main() -> int:
    """Validate checked-in CSV files and print a concise result."""
    errors = validate_source_registry()
    if errors:
        for error in errors:
            print(error)
        return 1
    print("Source registry and acquisition log are structurally valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
