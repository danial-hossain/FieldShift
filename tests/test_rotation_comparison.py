from src.optimizer.dynamic_agronomy import compute_rotation_comparison
from backend.app.main import complete_saved_history_rotation


PERIODS = ("Y1_S1", "Y1_S2", "Y1_S3", "Y2_S1", "Y2_S2", "Y2_S3")
CROPS = ("Boro Rice", "Rice", "Wheat", "Fallow")


def build_result():
    crop_matrix = {}
    for period in PERIODS:
        crop_matrix[period] = {
            crop: {
                "water_balance": {"irrigation_required_mm": 100.0},
                "dynamic_gross_margin_bdt_ha": 1000.0,
                "is_legume": False,
            }
            for crop in CROPS
        }
    return {
        "planning_periods": PERIODS,
        "selected_crop_by_period": {period: "Wheat" for period in PERIODS},
        "dynamic_agronomic_matrix": {"crop_season_matrix": crop_matrix},
    }


def test_complete_saved_rotation_is_used_as_baseline():
    result = compute_rotation_comparison(
        build_result(),
        existing_rotation={
            "rabi": "Boro Rice",
            "kharif1": "Wheat",
            "kharif2": "Fallow",
        },
    )

    assert result["baseline_rotation"] == ["Boro Rice", "Wheat", "Fallow"]
    assert result["is_assumed_baseline"] is False
    assert result["baseline_source"] == "saved_field_rotation"
    assert result["baseline_completeness"] == 1.0


def test_partial_rotation_or_unordered_crop_history_is_not_claimed_as_actual():
    result = compute_rotation_comparison(
        build_result(),
        field_history_crops=["Wheat", "Rice", "Boro Rice"],
        existing_rotation={"rabi": "Boro Rice", "kharif1": "Wheat"},
    )

    assert result["is_assumed_baseline"] is True
    assert result["baseline_source"] == "assumed_reference"
    assert result["baseline_completeness"] == 0.0
    assert result["baseline_label_en"] == "Assumed reference"


def test_complete_saved_field_history_requires_unambiguous_predecision_seasons():
    rotation = complete_saved_history_rotation(
        [
            {"year": 2024, "season": "Rabi", "crop": "Lentil"},
            {"year": 2024, "season": "Kharif-1", "crop": "Aus Rice"},
            {"year": 2024, "season": "খরিফ-২", "crop": "Aman Rice"},
            {"year": 2025, "season": "Rabi", "crop": "Potato"},
        ],
        before_year=2025,
    )

    assert rotation == (
        {"rabi": "Lentil", "kharif1": "Aus Rice", "kharif2": "Aman Rice"},
        2024,
    )


def test_duplicate_season_entries_make_saved_history_ambiguous():
    rotation = complete_saved_history_rotation(
        [
            {"year": 2024, "season": "Rabi", "crop": "Lentil"},
            {"year": 2024, "season": "Rabi", "crop": "Potato"},
            {"year": 2024, "season": "Kharif-1", "crop": "Aus Rice"},
            {"year": 2024, "season": "Kharif-2", "crop": "Aman Rice"},
        ],
        before_year=2025,
    )

    assert rotation is None


def test_saved_history_source_and_period_are_preserved_in_baseline():
    result = compute_rotation_comparison(
        build_result(),
        existing_rotation={
            "rabi": "Lentil",
            "kharif1": "Wheat",
            "kharif2": "Fallow",
        },
        existing_rotation_source="saved_field_history",
        existing_rotation_year=2023,
    )

    assert result["baseline_source"] == "saved_field_history"
    assert result["baseline_historical_period"] == 2023
