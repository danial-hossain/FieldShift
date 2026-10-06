"""Structural and provenance checks for the blank pilot data templates."""

import csv
from datetime import date, datetime
from math import isfinite
from pathlib import Path
from typing import Dict, List, Optional, Tuple

PILOT_SCHEMAS = {
    "field_registry.csv": (
        (
            "field_id",
            "partner_id",
            "farm_id",
            "admin_area",
            "field_area_ha",
            "centroid_latitude_deg",
            "centroid_longitude_deg",
            "coordinate_precision_m",
            "boundary_reference",
            "boundary_access_restricted",
            "field_description",
            "evidence_class",
            "data_status",
            "source_id",
            "consent_record_id",
            "record_method",
            "recorded_by_role",
            "recorded_at",
            "missingness_reason",
            "quality_flags",
        ),
        "field_id",
    ),
    "soil_observations.csv": (
        (
            "soil_observation_id",
            "field_id",
            "sample_datetime",
            "sample_depth_top_cm",
            "sample_depth_bottom_cm",
            "sampling_method",
            "sampling_design",
            "replicate_id",
            "analyte",
            "analyte_value",
            "unit",
            "laboratory_id",
            "lab_method",
            "lab_report_reference",
            "measurement_uncertainty",
            "uncertainty_unit",
            "evidence_class",
            "data_status",
            "source_id",
            "consent_record_id",
            "record_method",
            "recorded_by_role",
            "recorded_at",
            "missingness_reason",
            "quality_flags",
        ),
        "soil_observation_id",
    ),
    "crop_seasons.csv": (
        (
            "season_id",
            "field_id",
            "crop_common_name",
            "crop_scientific_name",
            "cultivar",
            "crop_family",
            "planting_date",
            "harvest_date",
            "season_label",
            "planted_area_ha",
            "crop_status",
            "planting_method",
            "previous_crop_reported",
            "evidence_class",
            "data_status",
            "source_id",
            "consent_record_id",
            "record_method",
            "recorded_by_role",
            "recorded_at",
            "missingness_reason",
            "quality_flags",
        ),
        "season_id",
    ),
    "management_events.csv": (
        (
            "event_id",
            "field_id",
            "season_id",
            "event_datetime",
            "event_type",
            "material_or_operation",
            "product_name",
            "active_ingredient",
            "quantity",
            "quantity_unit",
            "area_treated_ha",
            "water_volume_m3",
            "irrigation_source",
            "irrigation_method",
            "duration_min",
            "operator_role",
            "evidence_class",
            "data_status",
            "source_id",
            "consent_record_id",
            "record_method",
            "recorded_by_role",
            "recorded_at",
            "missingness_reason",
            "quality_flags",
        ),
        "event_id",
    ),
    "outcome_measurements.csv": (
        (
            "outcome_id",
            "field_id",
            "season_id",
            "outcome_type",
            "outcome_value",
            "outcome_unit",
            "measurement_datetime",
            "observation_window_start",
            "observation_window_end",
            "measured_area_ha",
            "sample_count",
            "measurement_method",
            "measurement_instrument",
            "price_basis",
            "currency",
            "cost_category",
            "linked_event_id",
            "lab_or_document_reference",
            "measurement_uncertainty",
            "uncertainty_unit",
            "evidence_class",
            "data_status",
            "source_id",
            "consent_record_id",
            "record_method",
            "recorded_by_role",
            "recorded_at",
            "missingness_reason",
            "quality_flags",
        ),
        "outcome_id",
    ),
}
EVIDENCE_CLASSES = {
    "observed",
    "remote_observed",
    "modelled_context",
    "recalled",
    "inferred",
    "synthetic",
}
DATA_STATUSES = {"observed", "synthetic", "demo", "planned", "missing"}
CONSENT_REQUIRED_CLASSES = {"observed", "recalled"}
FIELD_LINKED_TEMPLATES = {
    "soil_observations.csv",
    "crop_seasons.csv",
    "management_events.csv",
    "outcome_measurements.csv",
}
SEASON_LINKED_TEMPLATES = {
    "management_events.csv",
    "outcome_measurements.csv",
}
NUMERIC_COLUMNS = {
    "field_registry.csv": (
        "field_area_ha",
        "centroid_latitude_deg",
        "centroid_longitude_deg",
        "coordinate_precision_m",
    ),
    "soil_observations.csv": (
        "sample_depth_top_cm",
        "sample_depth_bottom_cm",
        "analyte_value",
        "measurement_uncertainty",
    ),
    "crop_seasons.csv": ("planted_area_ha",),
    "management_events.csv": (
        "quantity",
        "area_treated_ha",
        "water_volume_m3",
        "duration_min",
    ),
    "outcome_measurements.csv": (
        "outcome_value",
        "measured_area_ha",
        "sample_count",
        "measurement_uncertainty",
    ),
}
MEASUREMENT_UNITS = {
    "soil_observations.csv": ("analyte_value", "unit"),
    "management_events.csv": ("quantity", "quantity_unit"),
    "outcome_measurements.csv": ("outcome_value", "outcome_unit"),
}
UNIT_SERIES_KEYS = {
    "soil_observations.csv": ("field_id", "analyte", "lab_method"),
    "outcome_measurements.csv": ("field_id", "season_id", "outcome_type"),
}
DEFAULT_TEMPLATE_DIRECTORY = (
    Path(__file__).resolve().parents[2] / "data" / "pilot_templates"
)


def _validate_numeric_values(
    record: Dict[str, str], filename: str, row_number: int, errors: List[str]
) -> Dict[str, float]:
    values: Dict[str, float] = {}
    for column in NUMERIC_COLUMNS[filename]:
        raw = record[column].strip()
        if not raw:
            continue
        try:
            value = float(raw)
        except ValueError:
            errors.append(
                f"{filename}: row {row_number} has non-numeric {column} {raw!r}."
            )
            continue
        if not isfinite(value):
            errors.append(
                f"{filename}: row {row_number} has non-finite {column}."
            )
            continue
        values[column] = value

    positive_columns = {
        "field_area_ha",
        "coordinate_precision_m",
        "planted_area_ha",
        "area_treated_ha",
        "measured_area_ha",
    }
    nonnegative_columns = {
        "sample_depth_top_cm",
        "sample_depth_bottom_cm",
        "measurement_uncertainty",
        "quantity",
        "water_volume_m3",
        "duration_min",
        "sample_count",
    }
    for column in positive_columns.intersection(values):
        if values[column] <= 0:
            errors.append(
                f"{filename}: row {row_number} {column} must be greater than zero."
            )
    for column in nonnegative_columns.intersection(values):
        if values[column] < 0:
            errors.append(
                f"{filename}: row {row_number} {column} cannot be negative."
            )

    for column, lower, upper in (
        ("centroid_latitude_deg", -90, 90),
        ("centroid_longitude_deg", -180, 180),
    ):
        if column in values and not lower <= values[column] <= upper:
            errors.append(
                f"{filename}: row {row_number} {column} must be between "
                f"{lower} and {upper}."
            )
    if "sample_count" in values and not values["sample_count"].is_integer():
        errors.append(
            f"{filename}: row {row_number} sample_count must be an integer."
        )
    if (
        "sample_depth_top_cm" in values
        and "sample_depth_bottom_cm" in values
        and values["sample_depth_bottom_cm"] < values["sample_depth_top_cm"]
    ):
        errors.append(
            f"{filename}: row {row_number} sample depth bottom is above its top."
        )
    return values


def _read_template(path: Path, filename: str) -> Tuple[List[Dict[str, str]], List[str]]:
    expected_columns, primary_key = PILOT_SCHEMAS[filename]
    errors: List[str] = []
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as stream:
            reader = csv.reader(stream)
            try:
                headers = next(reader)
            except StopIteration:
                return [], [f"{filename}: file is empty and has no header."]
            if tuple(headers) != expected_columns:
                return [], [
                    f"{filename}: header does not match the documented schema."
                ]
            records = []
            seen_ids = set()
            for row_number, values in enumerate(reader, start=2):
                if len(values) != len(headers):
                    errors.append(
                        f"{filename}: row {row_number} has {len(values)} cells; "
                        f"expected {len(headers)}."
                    )
                    continue
                record = dict(zip(headers, values))
                if not any(value.strip() for value in values):
                    errors.append(f"{filename}: row {row_number} is entirely blank.")
                    continue
                _validate_numeric_values(record, filename, row_number, errors)
                value_column, unit_column = MEASUREMENT_UNITS.get(
                    filename, ("", "")
                )
                if (
                    value_column
                    and record[value_column].strip()
                    and not record[unit_column].strip()
                ):
                    errors.append(
                        f"{filename}: row {row_number} requires {unit_column} "
                        f"when {value_column} is populated."
                    )
                identifier = record[primary_key].strip()
                if not identifier:
                    errors.append(
                        f"{filename}: row {row_number} is missing {primary_key}."
                    )
                elif identifier in seen_ids:
                    errors.append(
                        f"{filename}: duplicate {primary_key} {identifier!r}."
                    )
                seen_ids.add(identifier)
                evidence_class = record["evidence_class"].strip()
                data_status = record["data_status"].strip()
                if evidence_class not in EVIDENCE_CLASSES:
                    errors.append(
                        f"{filename}: row {row_number} has invalid evidence_class "
                        f"{evidence_class!r}."
                    )
                if data_status not in DATA_STATUSES:
                    errors.append(
                        f"{filename}: row {row_number} has invalid data_status "
                        f"{data_status!r}."
                    )
                if not record["source_id"].strip():
                    errors.append(
                        f"{filename}: row {row_number} is missing source_id."
                    )
                if not record["record_method"].strip():
                    errors.append(
                        f"{filename}: row {row_number} is missing record_method."
                    )
                recorded_at = record["recorded_at"].strip()
                if not recorded_at:
                    errors.append(
                        f"{filename}: row {row_number} is missing recorded_at."
                    )
                else:
                    try:
                        datetime.fromisoformat(recorded_at.replace("Z", "+00:00"))
                    except ValueError:
                        errors.append(
                            f"{filename}: row {row_number} has invalid ISO "
                            "recorded_at."
                        )
                for column in (
                    "sample_datetime",
                    "event_datetime",
                    "measurement_datetime",
                    "planting_date",
                    "harvest_date",
                    "observation_window_start",
                    "observation_window_end",
                ):
                    value = record.get(column, "").strip()
                    if value:
                        try:
                            if column.endswith("_date"):
                                date.fromisoformat(value)
                            else:
                                datetime.fromisoformat(value.replace("Z", "+00:00"))
                        except ValueError:
                            errors.append(
                                f"{filename}: row {row_number} has invalid ISO "
                                f"{column}."
                            )
                if evidence_class == "synthetic" and data_status not in {
                    "synthetic",
                    "demo",
                }:
                    errors.append(
                        f"{filename}: row {row_number} labels synthetic evidence "
                        "with a non-synthetic data_status."
                    )
                if data_status in {"synthetic", "demo"} and evidence_class != "synthetic":
                    errors.append(
                        f"{filename}: row {row_number} labels non-synthetic "
                        "evidence as demo/synthetic."
                    )
                if evidence_class == "observed" and data_status != "observed":
                    errors.append(
                        f"{filename}: row {row_number} directly observed evidence "
                        "must have data_status 'observed'."
                    )
                if evidence_class in CONSENT_REQUIRED_CLASSES:
                    if not record["consent_record_id"].strip():
                        errors.append(
                            f"{filename}: row {row_number} requires "
                            "consent_record_id for partner data."
                        )
                if (
                    filename == "outcome_measurements.csv"
                    and evidence_class == "observed"
                    and record["outcome_value"].strip()
                    and not record["measurement_method"].strip()
                ):
                    errors.append(
                        f"{filename}: row {row_number} requires measurement_method "
                        "for an observed outcome."
                    )
                if (
                    filename == "soil_observations.csv"
                    and evidence_class == "observed"
                    and record["analyte_value"].strip()
                    and not record["lab_method"].strip()
                ):
                    errors.append(
                        f"{filename}: row {row_number} requires lab_method "
                        "for an observed soil result."
                    )
                records.append(record)
            return records, errors
    except (OSError, UnicodeError, csv.Error) as error:
        return [], [f"{filename}: could not read template: {error}"]


def validate_pilot_csv(
    path: Path, template_name: Optional[str] = None
) -> List[str]:
    """Validate one template's schema, identifiers, status, and provenance."""
    path = Path(path)
    filename = template_name or path.name
    if filename not in PILOT_SCHEMAS:
        return [f"Unknown pilot template: {filename}."]
    _, errors = _read_template(path, filename)
    return errors


def validate_pilot_dataset(
    template_directory: Optional[Path] = None,
) -> List[str]:
    """Validate all five templates and any populated cross-table references."""
    directory = Path(template_directory or DEFAULT_TEMPLATE_DIRECTORY)
    errors: List[str] = []
    tables: Dict[str, List[Dict[str, str]]] = {}
    for filename in PILOT_SCHEMAS:
        path = directory / filename
        if not path.is_file():
            errors.append(f"Missing pilot template: {path}.")
            continue
        records, file_errors = _read_template(path, filename)
        errors.extend(file_errors)
        tables[filename] = records

    if errors:
        return errors
    for filename, key_columns in UNIT_SERIES_KEYS.items():
        unit_column = MEASUREMENT_UNITS[filename][1]
        units_by_series: Dict[Tuple[str, ...], set] = {}
        for row_number, record in enumerate(tables[filename], start=2):
            unit = record[unit_column].strip()
            if not unit:
                continue
            key = tuple(record[column].strip() for column in key_columns)
            units_by_series.setdefault(key, set()).add(unit)
            if len(units_by_series[key]) > 1:
                errors.append(
                    f"{filename}: row {row_number} uses inconsistent {unit_column} "
                    f"within series {key!r}; normalize explicitly before comparison."
                )
    field_ids = {
        record["field_id"].strip()
        for record in tables["field_registry.csv"]
        if record["field_id"].strip()
    }
    season_ids = {
        record["season_id"].strip()
        for record in tables["crop_seasons.csv"]
        if record["season_id"].strip()
    }
    for filename in FIELD_LINKED_TEMPLATES:
        for row_number, record in enumerate(tables[filename], start=2):
            field_id = record["field_id"].strip()
            if not field_id:
                errors.append(f"{filename}: row {row_number} is missing field_id.")
            elif field_id not in field_ids:
                errors.append(
                    f"{filename}: row {row_number} references unknown field_id "
                    f"{field_id!r}."
                )
    for filename in SEASON_LINKED_TEMPLATES:
        for row_number, record in enumerate(tables[filename], start=2):
            season_id = record["season_id"].strip()
            if season_id and season_id not in season_ids:
                errors.append(
                    f"{filename}: row {row_number} references unknown season_id "
                    f"{season_id!r}."
                )
    return errors


def main() -> int:
    """Validate the checked-in blank pilot templates."""
    errors = validate_pilot_dataset()
    if errors:
        for error in errors:
            print(error)
        return 1
    print("Pilot templates and cross-table references are valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
