"""Stable, missing-aware Phase 3 features for future model development.

The vector contains inputs and transparent compatibility signals only. It has
no target, recommendation label, yield, success probability, or learned score.
Categorical values remain explicit strings so a future training pipeline can
fit an encoder using training data only.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

from src.field_state import CandidateCrop, FieldState, build_candidate_crop
from src.suitability import CandidateEvaluation, evaluate_candidate

FeatureValue = float | int | str
MISSING_CATEGORY = "__missing__"

FEATURE_NAMES = (
    "field_latitude",
    "field_longitude",
    "field_area_hectares",
    "soil_nitrogen",
    "soil_nitrogen_missing",
    "soil_phosphorus",
    "soil_phosphorus_missing",
    "soil_potassium",
    "soil_potassium_missing",
    "soil_nutrient_unit",
    "soil_ph",
    "soil_texture",
    "soil_organic_matter",
    "soil_organic_matter_missing",
    "soil_organic_matter_unit",
    "soil_irrigation_available",
    "climate_observation_days",
    "climate_mean_temperature",
    "climate_mean_temperature_missing",
    "climate_minimum_temperature",
    "climate_minimum_temperature_missing",
    "climate_maximum_temperature",
    "climate_maximum_temperature_missing",
    "climate_total_precipitation",
    "climate_total_precipitation_missing",
    "climate_mean_humidity",
    "climate_mean_humidity_missing",
    "climate_mean_wind_speed",
    "climate_mean_wind_speed_missing",
    "climate_mean_solar_radiation",
    "climate_mean_solar_radiation_missing",
    "history_recorded_seasons",
    "history_recent_legume_count",
    "history_consecutive_same_crop",
    "history_consecutive_same_family",
    "history_previous_crop_id",
    "history_previous_crop_family",
    "history_recent_crop_sequence",
    "candidate_crop_id",
    "candidate_crop_family",
    "candidate_is_legume",
    "candidate_nitrogen_fixing",
    "candidate_duration_days",
    "candidate_water_requirement",
    "candidate_temperature_min",
    "candidate_temperature_min_missing",
    "candidate_temperature_optimal",
    "candidate_temperature_optimal_missing",
    "candidate_temperature_max",
    "candidate_temperature_max_missing",
    "candidate_water_requirement_mm",
    "candidate_water_requirement_mm_missing",
    "candidate_rainfall_requirement_mm",
    "candidate_rainfall_requirement_mm_missing",
    "candidate_soil_ph_min",
    "candidate_soil_ph_min_missing",
    "candidate_soil_ph_max",
    "candidate_soil_ph_max_missing",
    "candidate_heat_stress_threshold",
    "candidate_heat_stress_threshold_missing",
    "candidate_drought_sensitivity",
    "candidate_same_as_previous_crop",
    "candidate_same_as_previous_family",
    "compatibility_temperature",
    "compatibility_temperature_unknown",
    "compatibility_soil_ph",
    "compatibility_soil_ph_unknown",
    "compatibility_rainfall",
    "compatibility_rainfall_unknown",
    "compatibility_irrigation",
    "compatibility_irrigation_unknown",
    "compatibility_rotation",
    "compatibility_rotation_unknown",
    "provenance_climate_source_type",
    "provenance_soil_source_type",
    "provenance_history_source_type",
    "provenance_candidate_catalog_source_type",
    "provenance_candidate_requirements_source_type",
    "provenance_candidate_knowledge_source_type",
)

_COMPATIBILITY_CODES = {
    "incompatible": -1.0,
    "borderline": 0.0,
    "compatible": 1.0,
    "unknown": 0.0,
}


@dataclass(frozen=True)
class FeatureVector:
    """Immutable ordered features with a reproducible schema."""

    names: tuple[str, ...]
    values: tuple[FeatureValue, ...]

    def as_dict(self) -> dict[str, FeatureValue]:
        return dict(zip(self.names, self.values, strict=True))


def _number_with_missing(value: float | None) -> tuple[float, int]:
    return (0.0, 1) if value is None else (float(value), 0)


def _category(value: str | None) -> str:
    return MISSING_CATEGORY if value is None or value == "" else str(value)


def _put_optional(
    features: dict[str, FeatureValue], name: str, value: float | None
) -> None:
    number, missing = _number_with_missing(value)
    features[name] = number
    features[f"{name}_missing"] = missing


def _put_compatibility(
    features: dict[str, FeatureValue],
    name: str,
    evaluation: CandidateEvaluation,
) -> None:
    status = evaluation.compatibility[name]
    features[f"compatibility_{name}"] = _COMPATIBILITY_CODES[status]
    features[f"compatibility_{name}_unknown"] = int(status == "unknown")


def build_feature_vector(
    field_state: FieldState,
    candidate: CandidateCrop,
    *,
    evaluation: CandidateEvaluation | None = None,
) -> FeatureVector:
    """Build deterministic features with zero-plus-indicator numeric missingness."""

    result = evaluate_candidate(field_state, candidate) if evaluation is None else evaluation
    if result.crop_id != candidate.crop_id:
        raise ValueError("evaluation.crop_id must match candidate.crop_id")

    features: dict[str, FeatureValue] = {
        "field_latitude": field_state.latitude,
        "field_longitude": field_state.longitude,
        "field_area_hectares": field_state.area_hectares,
    }
    _put_optional(features, "soil_nitrogen", field_state.soil.nitrogen)
    _put_optional(features, "soil_phosphorus", field_state.soil.phosphorus)
    _put_optional(features, "soil_potassium", field_state.soil.potassium)
    features.update(
        {
            "soil_nutrient_unit": _category(field_state.soil.nutrient_unit),
            "soil_ph": field_state.soil.ph,
            "soil_texture": _category(field_state.soil.soil_texture),
        }
    )
    _put_optional(features, "soil_organic_matter", field_state.soil.organic_matter)
    features.update(
        {
            "soil_organic_matter_unit": _category(
                field_state.soil.organic_matter_unit
            ),
            "soil_irrigation_available": int(
                field_state.soil.irrigation_available
            ),
            "climate_observation_days": field_state.climate.observation_days,
        }
    )
    _put_optional(
        features, "climate_mean_temperature", field_state.climate.mean_temperature
    )
    _put_optional(
        features,
        "climate_minimum_temperature",
        field_state.climate.minimum_temperature,
    )
    _put_optional(
        features,
        "climate_maximum_temperature",
        field_state.climate.maximum_temperature,
    )
    _put_optional(
        features,
        "climate_total_precipitation",
        field_state.climate.total_precipitation,
    )
    _put_optional(features, "climate_mean_humidity", field_state.climate.mean_humidity)
    _put_optional(
        features, "climate_mean_wind_speed", field_state.climate.mean_wind_speed
    )
    _put_optional(
        features,
        "climate_mean_solar_radiation",
        field_state.climate.mean_solar_radiation,
    )

    history = field_state.history
    features.update(
        {
            "history_recorded_seasons": history.number_of_recorded_seasons,
            "history_recent_legume_count": history.recent_legume_count,
            "history_consecutive_same_crop": history.consecutive_same_crop,
            "history_consecutive_same_family": history.consecutive_same_family,
            "history_previous_crop_id": _category(history.previous_crop_id),
            "history_previous_crop_family": _category(history.previous_crop_family),
            "history_recent_crop_sequence": (
                "|".join(history.recent_crop_sequence)
                if history.recent_crop_sequence
                else MISSING_CATEGORY
            ),
            "candidate_crop_id": candidate.crop_id,
            "candidate_crop_family": candidate.crop_family,
            "candidate_is_legume": int(candidate.is_legume),
            "candidate_nitrogen_fixing": int(candidate.nitrogen_fixing),
            "candidate_duration_days": candidate.duration_days,
            "candidate_water_requirement": candidate.water_requirement,
        }
    )
    _put_optional(features, "candidate_temperature_min", candidate.temperature_min)
    _put_optional(
        features, "candidate_temperature_optimal", candidate.temperature_optimal
    )
    _put_optional(features, "candidate_temperature_max", candidate.temperature_max)
    _put_optional(
        features, "candidate_water_requirement_mm", candidate.water_requirement_mm
    )
    _put_optional(
        features,
        "candidate_rainfall_requirement_mm",
        candidate.rainfall_requirement_mm,
    )
    _put_optional(features, "candidate_soil_ph_min", candidate.soil_ph_min)
    _put_optional(features, "candidate_soil_ph_max", candidate.soil_ph_max)
    _put_optional(
        features,
        "candidate_heat_stress_threshold",
        candidate.heat_stress_threshold,
    )
    features.update(
        {
            "candidate_drought_sensitivity": _category(
                candidate.drought_sensitivity
            ),
            "candidate_same_as_previous_crop": int(
                history.previous_crop_id == candidate.crop_id
            ),
            "candidate_same_as_previous_family": int(
                history.previous_crop_family == candidate.crop_family
            ),
        }
    )
    for name in ("temperature", "soil_ph", "rainfall", "irrigation", "rotation"):
        _put_compatibility(features, name, result)

    features.update(
        {
            "provenance_climate_source_type": field_state.provenance[
                "climate"
            ].source_type,
            "provenance_soil_source_type": field_state.provenance[
                "soil"
            ].source_type,
            "provenance_history_source_type": field_state.provenance[
                "crop_history"
            ].source_type,
            "provenance_candidate_catalog_source_type": candidate.provenance[
                "catalog"
            ].source_type,
            "provenance_candidate_requirements_source_type": candidate.provenance[
                "requirements"
            ].source_type,
            "provenance_candidate_knowledge_source_type": candidate.provenance[
                "knowledge"
            ].source_type,
        }
    )

    if set(features) != set(FEATURE_NAMES):
        missing = sorted(set(FEATURE_NAMES) - set(features))
        extra = sorted(set(features) - set(FEATURE_NAMES))
        raise RuntimeError(f"feature schema mismatch; missing={missing}, extra={extra}")
    return FeatureVector(
        names=FEATURE_NAMES,
        values=tuple(features[name] for name in FEATURE_NAMES),
    )


def build_candidate_feature_vector(
    field_state: FieldState,
    crop_id: str,
) -> FeatureVector:
    """Convenience API that resolves a candidate by identifier."""

    return build_feature_vector(field_state, build_candidate_crop(crop_id))


def feature_schema() -> Mapping[str, str]:
    """Describe the stable missing-value policy for external consumers."""

    return {
        "order": "FEATURE_NAMES tuple order",
        "numeric_missing": "0.0 with a paired *_missing indicator set to 1",
        "categorical_missing": MISSING_CATEGORY,
        "compatibility": "-1=incompatible, 0=borderline/unknown, 1=compatible; paired unknown indicator",
        "target": "none",
    }
