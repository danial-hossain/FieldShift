import pandas as pd
import pytest

from src.data_loader import (
    DataValidationError,
    load_agronomic_rules,
    load_crop_catalog,
    load_crop_history,
    load_crop_knowledge,
    load_crop_requirements,
    load_rotation_rules,
    load_soil_data,
)


def test_crop_catalog_loading():
    catalog = load_crop_catalog()

    assert len(catalog) == 6
    assert catalog["crop_id"].is_unique
    assert catalog["is_legume"].dtype == bool
    assert set(catalog["source_type"]) == {"placeholder"}


def test_crop_requirement_loading():
    requirements = load_crop_requirements()

    assert len(requirements) == 6
    assert requirements["crop_id"].is_unique
    assert requirements["source_type"].eq("placeholder").all()


def test_soil_loading():
    soil = load_soil_data()

    assert len(soil) == 3
    assert soil["field_id"].is_unique
    assert soil["irrigation_available"].dtype == bool
    assert soil["source_type"].eq("synthetic").all()


def test_crop_history_loading():
    history = load_crop_history()

    assert len(history) == 9
    assert pd.api.types.is_integer_dtype(history["year"])
    assert history["source_type"].eq("synthetic").all()


def test_knowledge_base_loading():
    crop_knowledge = load_crop_knowledge()
    agronomic = load_agronomic_rules()
    rotation = load_rotation_rules()

    assert len(crop_knowledge["crops"]) == 6
    assert agronomic["hard_constraints"] == []
    assert rotation["hard_constraints"] == []
    assert len(rotation["soft_preferences"]) == 5


def test_required_column_validation(tmp_path):
    catalog = load_crop_catalog().drop(columns="crop_family")
    path = tmp_path / "catalog_missing_column.csv"
    catalog.to_csv(path, index=False)

    with pytest.raises(DataValidationError, match="crop_family"):
        load_crop_catalog(path)


def test_duplicate_crop_id_detection(tmp_path):
    catalog = load_crop_catalog()
    duplicated = pd.concat([catalog, catalog.iloc[[0]]], ignore_index=True)
    path = tmp_path / "duplicate_catalog.csv"
    duplicated.to_csv(path, index=False)

    with pytest.raises(DataValidationError, match="duplicate crop_id"):
        load_crop_catalog(path)


def test_invalid_crop_reference_in_history(tmp_path):
    catalog = load_crop_catalog()
    history = load_crop_history(crop_catalog=catalog)
    history.loc[0, "crop_id"] = "unknown_crop"
    path = tmp_path / "invalid_history.csv"
    history.to_csv(path, index=False)

    with pytest.raises(DataValidationError, match="unknown crop_id"):
        load_crop_history(path, crop_catalog=catalog)


def test_invalid_soil_ph_detection(tmp_path):
    soil = load_soil_data()
    soil.loc[0, "ph"] = 14.5
    path = tmp_path / "invalid_soil.csv"
    soil.to_csv(path, index=False)

    with pytest.raises(DataValidationError, match="between 0 and 14"):
        load_soil_data(path)


def test_invalid_crop_temperature_range(tmp_path):
    catalog = load_crop_catalog()
    requirements = load_crop_requirements(crop_catalog=catalog)
    requirements.loc[0, "temperature_optimal"] = 50
    path = tmp_path / "invalid_requirements.csv"
    requirements.to_csv(path, index=False)

    with pytest.raises(DataValidationError, match="min <= optimal <= max"):
        load_crop_requirements(path, crop_catalog=catalog)


def test_invalid_boolean_is_rejected(tmp_path):
    catalog = load_crop_catalog()
    catalog["is_legume"] = catalog["is_legume"].astype(object)
    catalog.loc[0, "is_legume"] = "sometimes"
    path = tmp_path / "invalid_boolean.csv"
    catalog.to_csv(path, index=False)

    with pytest.raises(DataValidationError, match="invalid boolean"):
        load_crop_catalog(path)


def test_missing_file_has_useful_error(tmp_path):
    with pytest.raises(FileNotFoundError, match="soil data file not found"):
        load_soil_data(tmp_path / "does_not_exist.csv")
