from dataclasses import replace

from src.field_state import build_candidate_crop, build_field_state
from src.suitability import evaluate_candidate, evaluate_candidate_crop


def _with_ph(value):
    state = build_field_state("demo_field_001")
    return replace(state, soil=replace(state.soil, ph=value))


def _with_temperature(value):
    state = build_field_state("demo_field_001")
    return replace(
        state, climate=replace(state.climate, mean_temperature=value)
    )


def test_ph_inside_declared_range_is_compatible_with_evidence():
    result = evaluate_candidate(_with_ph(6.5), build_candidate_crop("maize"))
    evidence = next(item for item in result.evidence if item.feature == "soil_ph")

    assert result.compatibility["soil_ph"] == "compatible"
    assert evidence.field_value == 6.5
    assert evidence.candidate_min == 5.5
    assert evidence.candidate_max == 7.5
    assert evidence.rule_id == "agronomic_001"


def test_ph_below_and_above_range_are_incompatible():
    candidate = build_candidate_crop("maize")

    assert evaluate_candidate(_with_ph(5.0), candidate).compatibility["soil_ph"] == "incompatible"
    assert evaluate_candidate(_with_ph(8.0), candidate).compatibility["soil_ph"] == "incompatible"


def test_missing_ph_requirement_returns_unknown_without_default():
    candidate = replace(
        build_candidate_crop("maize"), soil_ph_min=None, soil_ph_max=None
    )
    result = evaluate_candidate(_with_ph(6.5), candidate)

    assert result.compatibility["soil_ph"] == "unknown"


def test_temperature_inside_and_outside_range():
    candidate = build_candidate_crop("maize")

    assert evaluate_candidate(_with_temperature(25.0), candidate).compatibility["temperature"] == "compatible"
    assert evaluate_candidate(_with_temperature(40.0), candidate).compatibility["temperature"] == "incompatible"


def test_missing_climate_temperature_returns_unknown():
    result = evaluate_candidate(
        _with_temperature(None), build_candidate_crop("maize")
    )
    assert result.compatibility["temperature"] == "unknown"


def test_rainfall_stays_unknown_when_time_bases_are_not_comparable():
    result = evaluate_candidate_crop(build_field_state("demo_field_001"), "rice")
    evidence = next(item for item in result.evidence if item.feature == "rainfall")

    assert result.compatibility["rainfall"] == "unknown"
    assert "time basis" in evidence.reason


def test_irrigation_signal_is_soft_and_explainable():
    irrigated = evaluate_candidate_crop(build_field_state("demo_field_001"), "rice")
    non_irrigated = evaluate_candidate_crop(build_field_state("demo_field_002"), "rice")

    assert irrigated.compatibility["irrigation"] == "compatible"
    assert non_irrigated.compatibility["irrigation"] == "borderline"


def test_rotation_uses_previous_crop_and_soft_demo_rule():
    state = build_field_state("demo_field_001")
    repeated = evaluate_candidate_crop(state, "mung_bean")
    diverse = evaluate_candidate_crop(state, "maize")
    evidence = next(item for item in repeated.evidence if item.feature == "rotation")

    assert repeated.compatibility["rotation"] == "borderline"
    assert evidence.rule_id == "rotation_001"
    assert diverse.compatibility["rotation"] == "compatible"
    assert any("not a validated recommendation" in item for item in repeated.warnings)
