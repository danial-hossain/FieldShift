from src.data_loader import (
    load_agronomic_rules,
    load_climate_data,
    load_crop_catalog,
    load_crop_history,
    load_crop_knowledge,
    load_crop_requirements,
    load_rotation_rules,
    load_soil_data,
)


def test_phase1_climate_and_phase2_agronomic_data_load_together():
    climate = load_climate_data()
    catalog = load_crop_catalog()
    requirements = load_crop_requirements(crop_catalog=catalog)
    soil = load_soil_data()
    history = load_crop_history(crop_catalog=catalog)
    crop_knowledge = load_crop_knowledge()
    agronomic_rules = load_agronomic_rules()
    rotation_rules = load_rotation_rules()

    assert len(climate) == 365
    assert set(requirements["crop_id"]) == set(catalog["crop_id"])
    assert set(history["crop_id"]).issubset(set(catalog["crop_id"]))
    assert set(history["field_id"]).issubset(set(soil["field_id"]))
    assert {crop["crop_id"] for crop in crop_knowledge["crops"]} == set(
        catalog["crop_id"]
    )
    assert "soft_preferences" in agronomic_rules
    assert "soft_preferences" in rotation_rules
