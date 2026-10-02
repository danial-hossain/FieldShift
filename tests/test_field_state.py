from dataclasses import replace

import pandas as pd
import pytest

from src.data_loader import load_crop_requirements
from src.field_state import (
    FieldStateError,
    UnknownCropError,
    UnknownFieldError,
    aggregate_climate_features,
    build_candidate_crop,
    build_field_state,
)


def test_climate_aggregation_uses_raw_descriptive_statistics():
    frame = pd.DataFrame(
        {
            "date": ["2025-01-01", "2025-01-02"],
            "temperature": [20.0, 24.0],
            "temp_max": [25.0, 30.0],
            "temp_min": [15.0, 18.0],
            "rainfall": [2.0, 3.5],
            "humidity": [70.0, 80.0],
            "wind_speed": [1.0, 3.0],
            "solar_radiation": [10.0, 14.0],
        }
    )

    result = aggregate_climate_features(frame)

    assert result.observation_days == 2
    assert result.mean_temperature == 22.0
    assert result.minimum_temperature == 15.0
    assert result.maximum_temperature == 30.0
    assert result.total_precipitation == 5.5
    assert result.mean_humidity == 75.0


def test_climate_aggregation_rejects_empty_selected_period():
    frame = pd.DataFrame(
        {
            "date": ["2025-01-01"],
            "temperature": [20.0],
            "temp_max": [25.0],
            "temp_min": [15.0],
            "rainfall": [2.0],
            "humidity": [70.0],
            "wind_speed": [1.0],
            "solar_radiation": [10.0],
        }
    )

    with pytest.raises(FieldStateError, match="no climate observations"):
        aggregate_climate_features(frame, start_date="2026-01-01")


def test_valid_field_builds_with_soil_climate_history_and_provenance():
    state = build_field_state("demo_field_001")

    assert state.field_id == "demo_field_001"
    assert state.area_hectares == 1.2
    assert state.soil.nitrogen == 42.0
    assert state.soil.nutrient_unit == "demo_index"
    assert state.soil.ph == 6.4
    assert state.soil.irrigation_available is True
    assert state.climate.observation_days == 365
    assert state.climate.start_date.isoformat() == "2025-01-01"
    assert state.climate.end_date.isoformat() == "2025-12-31"
    assert state.history.recent_crop_sequence == ("rice", "mustard", "mung_bean")
    assert state.history.previous_crop_id == "mung_bean"
    assert state.history.previous_crop_family == "legume"
    assert state.history.recent_legume_count == 1
    assert state.provenance["climate"].source_type == "NASA POWER"
    assert state.provenance["soil"].source_type == "synthetic"
    assert state.provenance["crop_history"].source_type == "synthetic"


def test_unknown_field_is_rejected():
    with pytest.raises(UnknownFieldError, match="unknown field_id"):
        build_field_state("missing_field")


def test_as_of_date_excludes_future_climate_and_ambiguous_same_year_history():
    state = build_field_state("demo_field_001", as_of_date="2025-06-01")

    assert state.climate.end_date.isoformat() == "2025-06-01"
    assert state.climate.observation_days == 152
    assert state.history.recent_crop_sequence == ("rice", "mustard")
    assert state.history.previous_crop_id == "mustard"
    assert any("boundary year" in warning for warning in state.warnings)


def test_known_candidate_fuses_catalog_requirements_and_knowledge():
    candidate = build_candidate_crop("maize")

    assert candidate.crop_family == "grass"
    assert candidate.duration_days == 110
    assert candidate.temperature_min == 15.0
    assert candidate.soil_ph_max == 7.5
    assert candidate.provenance["catalog"].source_type == "placeholder"
    assert candidate.provenance["requirements"].source_type == "placeholder"
    assert candidate.provenance["knowledge"].source_type == "demo"


def test_unknown_candidate_is_rejected():
    with pytest.raises(UnknownCropError, match="unknown crop_id"):
        build_candidate_crop("dragon_fruit")


def test_null_requirement_is_preserved_for_safe_unknown_signal(tmp_path):
    requirements = load_crop_requirements()
    requirements.loc[requirements["crop_id"] == "rice", ["soil_ph_min", "soil_ph_max"]] = None
    path = tmp_path / "requirements_with_null.csv"
    requirements.to_csv(path, index=False)

    candidate = build_candidate_crop("rice", crop_requirements_path=path)

    assert candidate.soil_ph_min is None
    assert candidate.soil_ph_max is None


def test_candidate_dataclass_can_represent_missing_climate_requirement():
    candidate = replace(build_candidate_crop("maize"), temperature_min=None)
    assert candidate.temperature_min is None
