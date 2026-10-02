"""Integrated, provenance-aware field and candidate representations.

Phase 3 deliberately combines validated inputs without claiming that the
synthetic soil/history data or placeholder crop requirements are agronomic
truth. Climate values are descriptive statistics over the selected historical
NASA POWER period; no stress thresholds are introduced here.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Any, Mapping

import pandas as pd

from src.data_loader import (
    DataValidationError,
    load_climate_data,
    load_crop_catalog,
    load_crop_history,
    load_crop_knowledge,
    load_crop_requirements,
    load_soil_data,
)


class FieldStateError(ValueError):
    """Raised when validated inputs cannot form the requested field state."""


class UnknownFieldError(FieldStateError):
    """Raised when a requested field identifier is absent from soil data."""


class UnknownCropError(FieldStateError):
    """Raised when a requested crop identifier is absent from the catalog."""


@dataclass(frozen=True)
class DataProvenance:
    """Origin and limitations of one integrated data source."""

    source_type: str
    data_status: str
    detail: str


@dataclass(frozen=True)
class SoilState:
    """Validated soil inputs; N/P/K and organic matter retain source units."""

    nitrogen: float | None
    phosphorus: float | None
    potassium: float | None
    nutrient_unit: str
    ph: float
    soil_texture: str
    organic_matter: float | None
    organic_matter_unit: str
    irrigation_available: bool


@dataclass(frozen=True)
class ClimateState:
    """Raw descriptive aggregation of daily NASA POWER observations.

    Temperature is in degrees Celsius, precipitation in millimetres, humidity
    in percent, wind speed in metres/second, and solar radiation in
    kWh/m^2/day, following the source dataset's NASA POWER parameters.
    """

    start_date: date
    end_date: date
    observation_days: int
    mean_temperature: float | None
    minimum_temperature: float | None
    maximum_temperature: float | None
    total_precipitation: float | None
    mean_humidity: float | None
    mean_wind_speed: float | None
    mean_solar_radiation: float | None


@dataclass(frozen=True)
class HistoryRecord:
    """One known crop-history record; season labels are not date-inferred."""

    season: str
    year: int
    crop_id: str
    crop_family: str
    is_legume: bool
    source_type: str
    data_status: str


@dataclass(frozen=True)
class HistoryState:
    """Deterministic summary of the available, ordered crop history."""

    records: tuple[HistoryRecord, ...]
    previous_crop_id: str | None
    previous_crop_family: str | None
    recent_crop_sequence: tuple[str, ...]
    number_of_recorded_seasons: int
    recent_legume_count: int
    consecutive_same_crop: int
    consecutive_same_family: int
    lookback_seasons: int


@dataclass(frozen=True)
class FieldState:
    """Canonical Phase 3 representation of one field at a time boundary."""

    field_id: str
    latitude: float
    longitude: float
    area_hectares: float
    soil: SoilState
    climate: ClimateState
    history: HistoryState
    as_of_date: date | None
    provenance: Mapping[str, DataProvenance]
    warnings: tuple[str, ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class CandidateCrop:
    """Candidate metadata fused from catalog, requirements, and knowledge."""

    crop_id: str
    crop_name: str
    crop_family: str
    is_legume: bool
    nitrogen_fixing: bool
    duration_days: int
    water_requirement: str
    temperature_min: float | None
    temperature_optimal: float | None
    temperature_max: float | None
    water_requirement_mm: float | None
    rainfall_requirement_mm: float | None
    soil_ph_min: float | None
    soil_ph_max: float | None
    heat_stress_threshold: float | None
    drought_sensitivity: str
    provenance: Mapping[str, DataProvenance]


def _optional_float(value: Any) -> float | None:
    return None if pd.isna(value) else float(value)


def _parse_date(value: str | date | pd.Timestamp | None, name: str) -> date | None:
    if value is None:
        return None
    try:
        parsed = pd.Timestamp(value)
    except (TypeError, ValueError) as exc:
        raise FieldStateError(f"{name} is not a valid date: {value!r}") from exc
    if pd.isna(parsed):
        raise FieldStateError(f"{name} is not a valid date: {value!r}")
    return parsed.date()


def _mean_or_none(series: pd.Series) -> float | None:
    value = series.mean()
    return None if pd.isna(value) else float(value)


def _min_or_none(series: pd.Series) -> float | None:
    value = series.min()
    return None if pd.isna(value) else float(value)


def _max_or_none(series: pd.Series) -> float | None:
    value = series.max()
    return None if pd.isna(value) else float(value)


def _sum_or_none(series: pd.Series) -> float | None:
    value = series.sum(min_count=1)
    return None if pd.isna(value) else float(value)


def aggregate_climate_features(
    climate: pd.DataFrame,
    *,
    start_date: str | date | pd.Timestamp | None = None,
    end_date: str | date | pd.Timestamp | None = None,
) -> ClimateState:
    """Aggregate a selected daily period without interpreting stress.

    The boundary is inclusive. Missing columns or an empty selected period are
    rejected rather than turned into fabricated values.
    """

    required = {
        "date",
        "temperature",
        "temp_max",
        "temp_min",
        "rainfall",
        "humidity",
        "wind_speed",
        "solar_radiation",
    }
    missing = sorted(required - set(climate.columns))
    if missing:
        raise FieldStateError(
            "climate data is missing required columns: " + ", ".join(missing)
        )

    selected = climate.copy()
    selected["date"] = pd.to_datetime(selected["date"], errors="raise")
    start = _parse_date(start_date, "start_date")
    end = _parse_date(end_date, "end_date")
    if start is not None and end is not None and start > end:
        raise FieldStateError("start_date must be on or before end_date")
    if start is not None:
        selected = selected.loc[selected["date"].dt.date >= start]
    if end is not None:
        selected = selected.loc[selected["date"].dt.date <= end]
    selected = selected.sort_values("date", kind="stable")
    if selected.empty:
        raise FieldStateError("no climate observations exist in the selected period")

    return ClimateState(
        start_date=selected["date"].iloc[0].date(),
        end_date=selected["date"].iloc[-1].date(),
        observation_days=int(len(selected)),
        mean_temperature=_mean_or_none(selected["temperature"]),
        minimum_temperature=_min_or_none(selected["temp_min"]),
        maximum_temperature=_max_or_none(selected["temp_max"]),
        total_precipitation=_sum_or_none(selected["rainfall"]),
        mean_humidity=_mean_or_none(selected["humidity"]),
        mean_wind_speed=_mean_or_none(selected["wind_speed"]),
        mean_solar_radiation=_mean_or_none(selected["solar_radiation"]),
    )


def _trailing_equal_count(values: list[str]) -> int:
    if not values:
        return 0
    last = values[-1]
    count = 0
    for value in reversed(values):
        if value != last:
            break
        count += 1
    return count


def build_history_features(
    history: pd.DataFrame,
    crop_catalog: pd.DataFrame,
    *,
    lookback_seasons: int = 3,
) -> HistoryState:
    """Build a factual crop-history summary without modelling soil effects."""

    if lookback_seasons < 1:
        raise FieldStateError("lookback_seasons must be at least 1")

    catalog = crop_catalog.set_index("crop_id", drop=False)
    records: list[HistoryRecord] = []
    for row in history.sort_values(["year"], kind="stable").itertuples(index=False):
        if row.crop_id not in catalog.index:
            raise DataValidationError(
                f"crop history references unknown crop_id value: {row.crop_id!r}"
            )
        crop = catalog.loc[row.crop_id]
        records.append(
            HistoryRecord(
                season=str(row.season),
                year=int(row.year),
                crop_id=str(row.crop_id),
                crop_family=str(crop["crop_family"]),
                is_legume=bool(crop["is_legume"]),
                source_type=str(row.source_type),
                data_status=str(row.data_status),
            )
        )

    recent = records[-lookback_seasons:]
    crop_ids = [record.crop_id for record in records]
    families = [record.crop_family for record in records]
    previous = records[-1] if records else None
    return HistoryState(
        records=tuple(records),
        previous_crop_id=None if previous is None else previous.crop_id,
        previous_crop_family=None if previous is None else previous.crop_family,
        recent_crop_sequence=tuple(record.crop_id for record in recent),
        number_of_recorded_seasons=len(records),
        recent_legume_count=sum(record.is_legume for record in recent),
        consecutive_same_crop=_trailing_equal_count(crop_ids),
        consecutive_same_family=_trailing_equal_count(families),
        lookback_seasons=lookback_seasons,
    )


def build_field_state(
    field_id: str,
    *,
    as_of_date: str | date | pd.Timestamp | None = None,
    climate_start_date: str | date | pd.Timestamp | None = None,
    history_lookback_seasons: int = 3,
    climate_path: str | Path | None = None,
    soil_path: str | Path | None = None,
    crop_history_path: str | Path | None = None,
    crop_catalog_path: str | Path | None = None,
) -> FieldState:
    """Load validated inputs and assemble one canonical :class:`FieldState`.

    When ``as_of_date`` is supplied, climate observations after that date are
    excluded. Crop history only has year/season labels, not exact dates, so the
    conservative temporal policy includes years strictly before the boundary
    year. This prevents same-year future leakage without guessing season dates.
    """

    soil_data = load_soil_data(soil_path)
    soil_rows = soil_data.loc[soil_data["field_id"] == field_id]
    if soil_rows.empty:
        raise UnknownFieldError(f"unknown field_id: {field_id!r}")
    soil_row = soil_rows.iloc[0]

    catalog = load_crop_catalog(crop_catalog_path)
    history = load_crop_history(crop_history_path, crop_catalog=catalog)
    field_history = history.loc[history["field_id"] == field_id].copy()
    boundary = _parse_date(as_of_date, "as_of_date")
    warnings = [
        "Climate is historical NASA POWER point data, not a field-sensor measurement.",
        "Soil and crop history are synthetic/demo inputs.",
    ]
    if boundary is not None:
        field_history = field_history.loc[field_history["year"] < boundary.year]
        warnings.append(
            "History has no exact dates; as_of_date conservatively excludes the "
            "entire boundary year."
        )

    climate = load_climate_data(climate_path)
    climate_state = aggregate_climate_features(
        climate, start_date=climate_start_date, end_date=boundary
    )
    history_state = build_history_features(
        field_history,
        catalog,
        lookback_seasons=history_lookback_seasons,
    )
    soil_state = SoilState(
        nitrogen=_optional_float(soil_row["nitrogen"]),
        phosphorus=_optional_float(soil_row["phosphorus"]),
        potassium=_optional_float(soil_row["potassium"]),
        nutrient_unit=str(soil_row["nutrient_unit"]),
        ph=float(soil_row["ph"]),
        soil_texture=str(soil_row["soil_texture"]),
        organic_matter=_optional_float(soil_row["organic_matter"]),
        organic_matter_unit=str(soil_row["organic_matter_unit"]),
        irrigation_available=bool(soil_row["irrigation_available"]),
    )

    history_sources = sorted(set(field_history["source_type"].astype(str)))
    history_statuses = sorted(set(field_history["data_status"].astype(str)))
    return FieldState(
        field_id=str(field_id),
        latitude=float(soil_row["latitude"]),
        longitude=float(soil_row["longitude"]),
        area_hectares=float(soil_row["area_hectares"]),
        soil=soil_state,
        climate=climate_state,
        history=history_state,
        as_of_date=boundary,
        provenance={
            "climate": DataProvenance(
                source_type="NASA POWER",
                data_status="historical_cleaned",
                detail="Daily gridded point observations aggregated descriptively.",
            ),
            "soil": DataProvenance(
                source_type=str(soil_row["source_type"]),
                data_status=str(soil_row["data_status"]),
                detail=(
                    "Synthetic field record; nutrient and organic-matter units "
                    "are retained exactly from the source."
                ),
            ),
            "crop_history": DataProvenance(
                source_type=",".join(history_sources) if history_sources else "none",
                data_status=",".join(history_statuses) if history_statuses else "none",
                detail="Synthetic recorded sequence; no soil effects are inferred.",
            ),
        },
        warnings=tuple(warnings),
    )


def _candidate_from_rows(
    catalog_row: pd.Series,
    requirement_row: pd.Series,
    knowledge_row: Mapping[str, Any],
    knowledge_metadata: Mapping[str, Any],
) -> CandidateCrop:
    crop_id = str(catalog_row["crop_id"])
    agreement_fields = ("crop_family", "is_legume", "nitrogen_fixing")
    for name in agreement_fields:
        if knowledge_row[name] != catalog_row[name]:
            raise DataValidationError(
                f"crop knowledge disagrees with catalog for {crop_id}.{name}"
            )
    return CandidateCrop(
        crop_id=crop_id,
        crop_name=str(catalog_row["crop_name"]),
        crop_family=str(catalog_row["crop_family"]),
        is_legume=bool(catalog_row["is_legume"]),
        nitrogen_fixing=bool(catalog_row["nitrogen_fixing"]),
        duration_days=int(catalog_row["duration_days"]),
        water_requirement=str(catalog_row["water_requirement"]),
        temperature_min=_optional_float(requirement_row["temperature_min"]),
        temperature_optimal=_optional_float(requirement_row["temperature_optimal"]),
        temperature_max=_optional_float(requirement_row["temperature_max"]),
        water_requirement_mm=_optional_float(requirement_row["water_requirement_mm"]),
        rainfall_requirement_mm=_optional_float(
            requirement_row["rainfall_requirement_mm"]
        ),
        soil_ph_min=_optional_float(requirement_row["soil_ph_min"]),
        soil_ph_max=_optional_float(requirement_row["soil_ph_max"]),
        heat_stress_threshold=_optional_float(
            requirement_row["heat_stress_threshold"]
        ),
        drought_sensitivity=str(requirement_row["drought_sensitivity"]),
        provenance={
            "catalog": DataProvenance(
                source_type=str(catalog_row["source_type"]),
                data_status=str(catalog_row["data_status"]),
                detail="Crop catalog metadata; duration/water category are placeholders.",
            ),
            "requirements": DataProvenance(
                source_type=str(requirement_row["source_type"]),
                data_status=str(requirement_row["data_status"]),
                detail="Placeholder numeric requirements for pipeline demonstration.",
            ),
            "knowledge": DataProvenance(
                source_type=str(knowledge_row["source_type"]),
                data_status=str(knowledge_metadata.get("status", "unknown")),
                detail="Demo-only structured crop knowledge.",
            ),
        },
    )


def build_candidate_crops(
    *,
    crop_catalog_path: str | Path | None = None,
    crop_requirements_path: str | Path | None = None,
    crop_knowledge_path: str | Path | None = None,
) -> tuple[CandidateCrop, ...]:
    """Build every candidate in catalog order from the three validated sources."""

    catalog = load_crop_catalog(crop_catalog_path)
    requirements = load_crop_requirements(
        crop_requirements_path, crop_catalog=catalog
    ).set_index("crop_id")
    knowledge = load_crop_knowledge(crop_knowledge_path)
    knowledge_by_id = {item["crop_id"]: item for item in knowledge["crops"]}
    catalog_ids = set(catalog["crop_id"])
    if set(requirements.index) != catalog_ids:
        raise DataValidationError(
            "crop requirements crop identifiers must exactly match the crop catalog"
        )
    if set(knowledge_by_id) != catalog_ids:
        raise DataValidationError(
            "crop knowledge crop identifiers must exactly match the crop catalog"
        )

    return tuple(
        _candidate_from_rows(
            row,
            requirements.loc[row["crop_id"]],
            knowledge_by_id[row["crop_id"]],
            knowledge["metadata"],
        )
        for _, row in catalog.iterrows()
    )


def build_candidate_crop(
    crop_id: str,
    **paths: str | Path | None,
) -> CandidateCrop:
    """Build one known candidate or raise :class:`UnknownCropError`."""

    candidates = build_candidate_crops(**paths)
    for candidate in candidates:
        if candidate.crop_id == crop_id:
            return candidate
    raise UnknownCropError(f"unknown crop_id: {crop_id!r}")
