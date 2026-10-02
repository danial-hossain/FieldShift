"""Validated loaders for FieldShift climate, crop, soil, and knowledge data.

Phase 2 data is intentionally kept in transparent CSV and JSON files. The
loaders validate schemas and relationships but do not silently repair records.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterable

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
KNOWLEDGE_BASE_DIR = PROJECT_ROOT / "knowledge_base"

DEFAULT_CLIMATE_PATH = DATA_DIR / "nasa_power" / "nasa_power_2025_clean.csv"
DEFAULT_CROP_CATALOG_PATH = DATA_DIR / "crops" / "crop_catalog.csv"
DEFAULT_CROP_REQUIREMENTS_PATH = DATA_DIR / "crops" / "crop_requirements.csv"
DEFAULT_SOIL_PATH = DATA_DIR / "soil" / "soil_data.csv"
DEFAULT_CROP_HISTORY_PATH = DATA_DIR / "field_history" / "crop_history.csv"
DEFAULT_CROP_KNOWLEDGE_PATH = KNOWLEDGE_BASE_DIR / "crop_knowledge.json"
DEFAULT_AGRONOMIC_RULES_PATH = KNOWLEDGE_BASE_DIR / "agronomic_rules.json"
DEFAULT_ROTATION_RULES_PATH = KNOWLEDGE_BASE_DIR / "rotation_rules.json"

PROVENANCE_TYPES = {"real", "literature-derived", "demo", "synthetic", "placeholder"}

CLIMATE_COLUMNS = (
    "date",
    "temperature",
    "temp_max",
    "temp_min",
    "rainfall",
    "humidity",
    "wind_speed",
    "solar_radiation",
)
CROP_CATALOG_COLUMNS = (
    "crop_id",
    "crop_name",
    "crop_family",
    "is_legume",
    "nitrogen_fixing",
    "duration_days",
    "water_requirement",
    "source_type",
    "data_status",
)
CROP_REQUIREMENT_COLUMNS = (
    "crop_id",
    "temperature_min",
    "temperature_optimal",
    "temperature_max",
    "water_requirement_mm",
    "rainfall_requirement_mm",
    "soil_ph_min",
    "soil_ph_max",
    "heat_stress_threshold",
    "drought_sensitivity",
    "source_type",
    "data_status",
)
SOIL_COLUMNS = (
    "field_id",
    "latitude",
    "longitude",
    "area_hectares",
    "nitrogen",
    "phosphorus",
    "potassium",
    "nutrient_unit",
    "ph",
    "soil_texture",
    "organic_matter",
    "organic_matter_unit",
    "irrigation_available",
    "source_type",
    "data_status",
)
CROP_HISTORY_COLUMNS = (
    "field_id",
    "season",
    "year",
    "crop_id",
    "source_type",
    "data_status",
)


class DataValidationError(ValueError):
    """Raised when a Phase 2 data file is present but malformed."""


def _path(value: str | Path | None, default: Path) -> Path:
    return default if value is None else Path(value)


def validate_required_columns(
    frame: pd.DataFrame,
    required_columns: Iterable[str],
    *,
    dataset_name: str,
) -> None:
    """Raise a clear error when a tabular dataset lacks required columns."""
    missing = [column for column in required_columns if column not in frame.columns]
    if missing:
        raise DataValidationError(
            f"{dataset_name} is missing required columns: {', '.join(missing)}"
        )


def _read_csv(path: Path, required: Iterable[str], dataset_name: str) -> pd.DataFrame:
    if not path.is_file():
        raise FileNotFoundError(f"{dataset_name} file not found: {path}")
    try:
        frame = pd.read_csv(path)
    except (pd.errors.EmptyDataError, pd.errors.ParserError) as exc:
        raise DataValidationError(f"Could not parse {dataset_name}: {exc}") from exc
    validate_required_columns(frame, required, dataset_name=dataset_name)
    if frame.empty:
        raise DataValidationError(f"{dataset_name} must contain at least one record.")
    return frame


def _require_nonempty_strings(
    frame: pd.DataFrame, columns: Iterable[str], dataset_name: str
) -> None:
    for column in columns:
        values = frame[column].astype("string").str.strip()
        invalid = values.isna() | values.eq("")
        if invalid.any():
            rows = (frame.index[invalid] + 2).tolist()
            raise DataValidationError(
                f"{dataset_name}.{column} must be present; invalid CSV row(s): {rows}"
            )
        frame[column] = values


def _normalise_booleans(
    frame: pd.DataFrame, columns: Iterable[str], dataset_name: str
) -> None:
    mapping = {
        "true": True,
        "false": False,
        "1": True,
        "0": False,
        "yes": True,
        "no": False,
    }
    for column in columns:
        normalised = frame[column].astype("string").str.strip().str.lower()
        invalid = ~normalised.isin(mapping)
        if invalid.any():
            bad = sorted(normalised.loc[invalid].dropna().unique().tolist())
            raise DataValidationError(
                f"{dataset_name}.{column} contains invalid boolean value(s): {bad}"
            )
        frame[column] = normalised.map(mapping).astype(bool)


def _numeric(
    frame: pd.DataFrame,
    columns: Iterable[str],
    dataset_name: str,
    *,
    allow_missing: bool = False,
) -> None:
    for column in columns:
        try:
            values = pd.to_numeric(frame[column], errors="raise")
        except (TypeError, ValueError) as exc:
            raise DataValidationError(
                f"{dataset_name}.{column} must contain numeric values."
            ) from exc
        if not allow_missing and values.isna().any():
            raise DataValidationError(
                f"{dataset_name}.{column} must not contain missing values."
            )
        frame[column] = values


def _validate_provenance(frame: pd.DataFrame, dataset_name: str) -> None:
    _require_nonempty_strings(frame, ("source_type",), dataset_name)
    invalid = ~frame["source_type"].isin(PROVENANCE_TYPES)
    if invalid.any():
        bad = sorted(frame.loc[invalid, "source_type"].unique().tolist())
        raise DataValidationError(
            f"{dataset_name}.source_type contains unsupported value(s): {bad}"
        )


def load_climate_data(path: str | Path | None = None) -> pd.DataFrame:
    """Load and validate the Phase 1 clean daily climate dataset."""
    frame = _read_csv(
        _path(path, DEFAULT_CLIMATE_PATH), CLIMATE_COLUMNS, "climate data"
    )
    try:
        frame["date"] = pd.to_datetime(frame["date"], errors="raise")
    except (TypeError, ValueError) as exc:
        raise DataValidationError("climate data contains an invalid date.") from exc
    if frame["date"].duplicated().any():
        raise DataValidationError("climate data contains duplicate dates.")
    _numeric(frame, CLIMATE_COLUMNS[1:], "climate data", allow_missing=True)
    return frame.sort_values("date").reset_index(drop=True)


def load_crop_catalog(path: str | Path | None = None) -> pd.DataFrame:
    """Load the crop catalog and validate identifiers, names, and booleans."""
    frame = _read_csv(
        _path(path, DEFAULT_CROP_CATALOG_PATH),
        CROP_CATALOG_COLUMNS,
        "crop catalog",
    )
    _require_nonempty_strings(
        frame,
        ("crop_id", "crop_name", "crop_family", "water_requirement", "data_status"),
        "crop catalog",
    )
    if frame["crop_id"].duplicated().any():
        duplicates = sorted(frame.loc[frame["crop_id"].duplicated(False), "crop_id"].unique())
        raise DataValidationError(
            f"crop catalog contains duplicate crop_id value(s): {duplicates}"
        )
    _normalise_booleans(frame, ("is_legume", "nitrogen_fixing"), "crop catalog")
    _numeric(frame, ("duration_days",), "crop catalog")
    if frame["duration_days"].le(0).any():
        raise DataValidationError("crop catalog.duration_days must be positive.")
    _validate_provenance(frame, "crop catalog")
    return frame.reset_index(drop=True)


def load_crop_requirements(
    path: str | Path | None = None,
    *,
    crop_catalog: pd.DataFrame | None = None,
) -> pd.DataFrame:
    """Load crop requirements and validate ranges and catalog references."""
    frame = _read_csv(
        _path(path, DEFAULT_CROP_REQUIREMENTS_PATH),
        CROP_REQUIREMENT_COLUMNS,
        "crop requirements",
    )
    _require_nonempty_strings(
        frame,
        ("crop_id", "drought_sensitivity", "data_status"),
        "crop requirements",
    )
    if frame["crop_id"].duplicated().any():
        raise DataValidationError("crop requirements contains duplicate crop_id values.")
    numeric_columns = (
        "temperature_min",
        "temperature_optimal",
        "temperature_max",
        "water_requirement_mm",
        "rainfall_requirement_mm",
        "soil_ph_min",
        "soil_ph_max",
        "heat_stress_threshold",
    )
    _numeric(frame, numeric_columns, "crop requirements")
    bad_temperature = ~(
        frame["temperature_min"].le(frame["temperature_optimal"])
        & frame["temperature_optimal"].le(frame["temperature_max"])
    )
    if bad_temperature.any():
        crop_ids = frame.loc[bad_temperature, "crop_id"].tolist()
        raise DataValidationError(
            "crop requirements temperature ranges must satisfy min <= optimal <= max; "
            f"invalid crop_id value(s): {crop_ids}"
        )
    if frame[["water_requirement_mm", "rainfall_requirement_mm"]].lt(0).any().any():
        raise DataValidationError(
            "crop requirements water and rainfall values must be non-negative."
        )
    bad_ph = (
        frame["soil_ph_min"].lt(0)
        | frame["soil_ph_max"].gt(14)
        | frame["soil_ph_min"].gt(frame["soil_ph_max"])
    )
    if bad_ph.any():
        raise DataValidationError(
            "crop requirements soil pH ranges must satisfy 0 <= min <= max <= 14."
        )
    _validate_provenance(frame, "crop requirements")

    catalog = load_crop_catalog() if crop_catalog is None else crop_catalog
    validate_required_columns(catalog, ("crop_id",), dataset_name="crop catalog")
    unknown = sorted(set(frame["crop_id"]) - set(catalog["crop_id"]))
    if unknown:
        raise DataValidationError(
            f"crop requirements references unknown crop_id value(s): {unknown}"
        )
    return frame.reset_index(drop=True)


def load_soil_data(path: str | Path | None = None) -> pd.DataFrame:
    """Load synthetic/demo soil-state records with physical range checks."""
    frame = _read_csv(_path(path, DEFAULT_SOIL_PATH), SOIL_COLUMNS, "soil data")
    _require_nonempty_strings(
        frame,
        (
            "field_id",
            "nutrient_unit",
            "soil_texture",
            "organic_matter_unit",
            "data_status",
        ),
        "soil data",
    )
    if frame["field_id"].duplicated().any():
        raise DataValidationError("soil data contains duplicate field_id values.")
    _numeric(
        frame,
        ("latitude", "longitude", "area_hectares", "ph"),
        "soil data",
    )
    _numeric(
        frame,
        ("nitrogen", "phosphorus", "potassium", "organic_matter"),
        "soil data",
        allow_missing=True,
    )
    if frame["latitude"].lt(-90).any() or frame["latitude"].gt(90).any():
        raise DataValidationError("soil data.latitude must be between -90 and 90.")
    if frame["longitude"].lt(-180).any() or frame["longitude"].gt(180).any():
        raise DataValidationError("soil data.longitude must be between -180 and 180.")
    if frame["area_hectares"].le(0).any():
        raise DataValidationError("soil data.area_hectares must be positive.")
    if frame["ph"].lt(0).any() or frame["ph"].gt(14).any():
        raise DataValidationError("soil data.ph must be between 0 and 14.")
    nutrients = frame[["nitrogen", "phosphorus", "potassium"]]
    if nutrients.lt(0).any().any():
        raise DataValidationError("soil data N/P/K values must be non-negative.")
    _normalise_booleans(frame, ("irrigation_available",), "soil data")
    _validate_provenance(frame, "soil data")
    return frame.reset_index(drop=True)


def load_crop_history(
    path: str | Path | None = None,
    *,
    crop_catalog: pd.DataFrame | None = None,
) -> pd.DataFrame:
    """Load crop history and reject unknown crop identifiers."""
    frame = _read_csv(
        _path(path, DEFAULT_CROP_HISTORY_PATH),
        CROP_HISTORY_COLUMNS,
        "crop history",
    )
    _require_nonempty_strings(
        frame,
        ("field_id", "season", "crop_id", "data_status"),
        "crop history",
    )
    _numeric(frame, ("year",), "crop history")
    invalid_year = (
        frame["year"].mod(1).ne(0)
        | frame["year"].lt(1900)
        | frame["year"].gt(2100)
    )
    if invalid_year.any():
        raise DataValidationError(
            "crop history.year must be a whole year between 1900 and 2100."
        )
    frame["year"] = frame["year"].astype(int)
    _validate_provenance(frame, "crop history")

    catalog = load_crop_catalog() if crop_catalog is None else crop_catalog
    validate_required_columns(catalog, ("crop_id",), dataset_name="crop catalog")
    unknown = sorted(set(frame["crop_id"]) - set(catalog["crop_id"]))
    if unknown:
        raise DataValidationError(
            f"crop history references unknown crop_id value(s): {unknown}"
        )
    return frame.sort_values(["field_id", "year", "season"]).reset_index(drop=True)


def _load_json(path: Path, dataset_name: str) -> dict[str, Any]:
    if not path.is_file():
        raise FileNotFoundError(f"{dataset_name} file not found: {path}")
    try:
        with path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
    except json.JSONDecodeError as exc:
        raise DataValidationError(f"{dataset_name} contains invalid JSON: {exc}") from exc
    if not isinstance(payload, dict):
        raise DataValidationError(f"{dataset_name} must be a JSON object.")
    return payload


def _validate_json_metadata(payload: dict[str, Any], dataset_name: str) -> None:
    metadata = payload.get("metadata")
    if not isinstance(metadata, dict):
        raise DataValidationError(f"{dataset_name}.metadata must be an object.")
    source_type = metadata.get("source_type")
    if source_type not in PROVENANCE_TYPES:
        raise DataValidationError(
            f"{dataset_name}.metadata.source_type must be one of {sorted(PROVENANCE_TYPES)}."
        )


def load_crop_knowledge(path: str | Path | None = None) -> dict[str, Any]:
    """Load structured crop-family knowledge."""
    payload = _load_json(
        _path(path, DEFAULT_CROP_KNOWLEDGE_PATH), "crop knowledge"
    )
    _validate_json_metadata(payload, "crop knowledge")
    crops = payload.get("crops")
    if not isinstance(crops, list) or not crops:
        raise DataValidationError("crop knowledge.crops must be a non-empty list.")
    crop_ids: list[str] = []
    required = {"crop_id", "crop_family", "is_legume", "nitrogen_fixing", "source_type"}
    for index, crop in enumerate(crops):
        if not isinstance(crop, dict) or not required.issubset(crop):
            raise DataValidationError(
                f"crop knowledge.crops[{index}] is missing required fields."
            )
        if not isinstance(crop["is_legume"], bool) or not isinstance(
            crop["nitrogen_fixing"], bool
        ):
            raise DataValidationError(
                f"crop knowledge.crops[{index}] boolean fields are invalid."
            )
        if crop["source_type"] not in PROVENANCE_TYPES:
            raise DataValidationError(
                f"crop knowledge.crops[{index}].source_type is invalid."
            )
        crop_ids.append(str(crop["crop_id"]))
    if len(crop_ids) != len(set(crop_ids)):
        raise DataValidationError("crop knowledge contains duplicate crop_id values.")
    return payload


def _load_rule_base(path: Path, dataset_name: str) -> dict[str, Any]:
    payload = _load_json(path, dataset_name)
    _validate_json_metadata(payload, dataset_name)
    buckets = {
        "hard_constraints": "hard",
        "soft_preferences": "soft",
        "agronomic_information": "informational",
    }
    rule_ids: list[str] = []
    required = {"rule_id", "type", "description", "severity", "source_type"}
    for bucket, expected_severity in buckets.items():
        rules = payload.get(bucket)
        if not isinstance(rules, list):
            raise DataValidationError(f"{dataset_name}.{bucket} must be a list.")
        for index, rule in enumerate(rules):
            if not isinstance(rule, dict) or not required.issubset(rule):
                raise DataValidationError(
                    f"{dataset_name}.{bucket}[{index}] is missing required fields."
                )
            if rule["severity"] != expected_severity:
                raise DataValidationError(
                    f"{dataset_name}.{bucket}[{index}] must have severity "
                    f"{expected_severity!r}."
                )
            if rule["source_type"] not in PROVENANCE_TYPES:
                raise DataValidationError(
                    f"{dataset_name}.{bucket}[{index}].source_type is invalid."
                )
            rule_ids.append(str(rule["rule_id"]))
    if len(rule_ids) != len(set(rule_ids)):
        raise DataValidationError(f"{dataset_name} contains duplicate rule_id values.")
    return payload


def load_agronomic_rules(path: str | Path | None = None) -> dict[str, Any]:
    """Load hard, soft, and informational agronomic rule groups."""
    return _load_rule_base(
        _path(path, DEFAULT_AGRONOMIC_RULES_PATH), "agronomic rules"
    )


def load_rotation_rules(path: str | Path | None = None) -> dict[str, Any]:
    """Load hard, soft, and informational crop-rotation rule groups."""
    return _load_rule_base(
        _path(path, DEFAULT_ROTATION_RULES_PATH), "rotation rules"
    )
