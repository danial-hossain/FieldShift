from dataclasses import replace
import math

from src.feature_builder import (
    FEATURE_NAMES,
    MISSING_CATEGORY,
    build_feature_vector,
    feature_schema,
)
from src.field_state import build_candidate_crop, build_field_state


def test_feature_vector_is_deterministic_and_in_stable_order():
    state = build_field_state("demo_field_001")
    candidate = build_candidate_crop("maize")

    first = build_feature_vector(state, candidate)
    second = build_feature_vector(state, candidate)

    assert first == second
    assert first.names == FEATURE_NAMES
    assert list(first.as_dict()) == list(FEATURE_NAMES)


def test_feature_vector_has_no_nan_and_contains_candidate_features():
    vector = build_feature_vector(
        build_field_state("demo_field_001"), build_candidate_crop("maize")
    )
    values = vector.as_dict()

    assert values["candidate_crop_id"] == "maize"
    assert values["candidate_crop_family"] == "grass"
    assert values["candidate_duration_days"] == 110
    assert values["candidate_same_as_previous_crop"] == 0
    assert not any(
        isinstance(value, float) and math.isnan(value)
        for value in vector.values
    )


def test_missing_numeric_uses_zero_and_explicit_indicator():
    candidate = replace(
        build_candidate_crop("maize"), rainfall_requirement_mm=None
    )
    values = build_feature_vector(
        build_field_state("demo_field_001"), candidate
    ).as_dict()

    assert values["candidate_rainfall_requirement_mm"] == 0.0
    assert values["candidate_rainfall_requirement_mm_missing"] == 1


def test_missing_history_category_uses_explicit_sentinel():
    state = build_field_state("demo_field_001")
    state = replace(
        state,
        history=replace(
            state.history,
            records=(),
            previous_crop_id=None,
            previous_crop_family=None,
            recent_crop_sequence=(),
            number_of_recorded_seasons=0,
            recent_legume_count=0,
            consecutive_same_crop=0,
            consecutive_same_family=0,
        ),
    )
    values = build_feature_vector(state, build_candidate_crop("maize")).as_dict()

    assert values["history_previous_crop_id"] == MISSING_CATEGORY
    assert values["history_previous_crop_family"] == MISSING_CATEGORY
    assert values["history_recent_crop_sequence"] == MISSING_CATEGORY


def test_compatibility_unknown_has_separate_indicator_and_no_target():
    values = build_feature_vector(
        build_field_state("demo_field_001"), build_candidate_crop("maize")
    ).as_dict()

    assert values["compatibility_rainfall"] == 0.0
    assert values["compatibility_rainfall_unknown"] == 1
    assert feature_schema()["target"] == "none"
    assert not any("target" in name or "yield" in name for name in FEATURE_NAMES)
