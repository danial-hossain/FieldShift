from src.feature_builder import build_feature_vector
from src.field_state import build_candidate_crops, build_field_state
from src.suitability import SIGNAL_NAMES, evaluate_all_candidates


def test_complete_phase3_pipeline_uses_every_validated_input_layer():
    state = build_field_state("demo_field_001")
    candidates = build_candidate_crops()
    evaluations = evaluate_all_candidates(state)

    assert len(candidates) == 6
    assert len(evaluations) == 6
    assert [result.crop_id for result in evaluations] == [
        candidate.crop_id for candidate in candidates
    ]
    assert all(tuple(result.compatibility) == SIGNAL_NAMES for result in evaluations)

    vector = build_feature_vector(state, candidates[0], evaluation=evaluations[0])
    values = vector.as_dict()
    assert values["climate_observation_days"] == 365
    assert values["soil_nutrient_unit"] == "demo_index"
    assert values["history_recorded_seasons"] == 3
    assert values["provenance_climate_source_type"] == "NASA POWER"
    assert values["provenance_soil_source_type"] == "synthetic"
    assert values["provenance_candidate_requirements_source_type"] == "placeholder"
    assert values["provenance_candidate_knowledge_source_type"] == "demo"
    assert evaluations[0].provenance["agronomic_rules"].source_type == "demo"
    assert evaluations[0].provenance["rotation_rules"].source_type == "demo"


def test_all_candidates_are_evaluated_in_catalog_order_not_ranked():
    results = evaluate_all_candidates(build_field_state("demo_field_002"))

    assert [result.crop_id for result in results] == [
        "rice",
        "wheat",
        "maize",
        "mustard",
        "mung_bean",
        "lentil",
    ]
    assert all("score" not in result.compatibility for result in results)
