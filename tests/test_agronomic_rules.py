import unittest

import numpy as np
import pandas as pd

from src.data.crops import CROP_COLUMNS, load_crop_knowledge
from src.data.field_history import FIELD_HISTORY_COLUMNS
from src.knowledge.agronomic_rules import (
    LEGUME_INTERVAL_SEASONS,
    AgronomicRuleConfig,
    evaluate_all_crops,
    evaluate_crop_compatibility,
)
from src.state.field_state import FieldState


def make_state(**overrides):
    values = {
        "field_id": "field_001",
        "as_of_date": "2026-09-29",
        "latitude": 23.8103,
        "longitude": 90.4125,
        "temperature": 24.0,
        "ph": 6.4,
        "soil_moisture": 0.18,
        "rainfall": 2.0,
        "previous_crop": "Maize",
        "previous_crop_family": "Poaceae",
        "previous_crop_is_legume": False,
        "data_status": {
            "environment": "observed",
            "soil_moisture": "synthetic",
            "soil": "synthetic",
            "crop": "synthetic",
            "history": "synthetic",
        },
        "environment_source": "NASA_POWER",
        "soil_moisture_source": "demo",
        "soil_source": "demo",
        "crop_source": "demo",
        "history_source": "demo",
    }
    values.update(overrides)
    return FieldState(**values)


def crop_record(name):
    crops = load_crop_knowledge()
    row = crops.loc[crops["crop"] == name].iloc[0]
    return row.to_dict()


def history_rows(crops):
    rows = []
    for year, season, crop_name in crops:
        rows.append(
            [
                "field_001",
                year,
                season,
                crop_name,
                np.nan,
                "unknown",
                "farm_history",
                "observed",
            ]
        )
    return pd.DataFrame(rows, columns=FIELD_HISTORY_COLUMNS)


class AgronomicRuleTests(unittest.TestCase):
    def evaluate(self, crop_name="Lentil", **kwargs):
        features = kwargs.pop("features", {"water_stress_indicator": 1})
        return evaluate_crop_compatibility(
            crop_record(crop_name),
            make_state(),
            features=features,
            field_history=history_rows(
                [(2024, "Rabi", "Lentil"), (2025, "Aus", "Maize")]
            ),
            **kwargs,
        )

    def test_temperature_compatible(self):
        result = self.evaluate()
        self.assertEqual(result["rules"]["temperature"]["status"], "compatible")

    def test_temperature_incompatible(self):
        result = evaluate_crop_compatibility(
            crop_record("Rice"),
            make_state(temperature=40),
            field_history=history_rows([(2025, "Aus", "Maize")]),
        )
        self.assertEqual(result["rules"]["temperature"]["status"], "incompatible")

    def test_missing_temperature_is_unknown(self):
        result = evaluate_crop_compatibility(
            crop_record("Lentil"),
            make_state(temperature=np.nan),
            field_history=history_rows([(2025, "Aus", "Maize")]),
        )
        self.assertEqual(result["rules"]["temperature"]["status"], "unknown")

    def test_ph_compatible(self):
        self.assertEqual(self.evaluate()["rules"]["ph"]["status"], "compatible")

    def test_ph_incompatible(self):
        result = evaluate_crop_compatibility(
            crop_record("Potato"),
            make_state(ph=7.0),
            field_history=history_rows([(2025, "Aus", "Maize")]),
        )
        self.assertEqual(result["rules"]["ph"]["status"], "incompatible")

    def test_missing_ph_is_unknown(self):
        result = evaluate_crop_compatibility(
            crop_record("Lentil"),
            make_state(ph=np.nan),
            field_history=history_rows([(2025, "Aus", "Maize")]),
        )
        self.assertEqual(result["rules"]["ph"]["status"], "unknown")

    def test_same_crop_family_violates_rotation_rule(self):
        result = evaluate_crop_compatibility(
            crop_record("Rice"),
            make_state(previous_crop_family="Poaceae"),
            field_history=history_rows([(2025, "Aus", "Maize")]),
        )
        self.assertEqual(result["rules"]["family_rotation"]["status"], "incompatible")
        self.assertIn("matches", result["rules"]["family_rotation"]["reason"])

    def test_different_crop_family_satisfies_rotation_rule(self):
        result = evaluate_crop_compatibility(
            crop_record("Lentil"),
            make_state(previous_crop_family="Poaceae"),
            field_history=history_rows([(2025, "Aus", "Maize")]),
        )
        self.assertEqual(result["rules"]["family_rotation"]["status"], "compatible")

    def test_missing_previous_family_is_unknown(self):
        result = evaluate_crop_compatibility(
            crop_record("Lentil"),
            make_state(previous_crop_family=None),
            field_history=history_rows([(2025, "Aus", "Maize")]),
        )
        self.assertEqual(result["rules"]["family_rotation"]["status"], "unknown")

    def test_legume_candidate_satisfies_interval(self):
        result = evaluate_crop_compatibility(
            crop_record("Lentil"),
            make_state(),
            field_history=history_rows([]),
        )
        self.assertEqual(result["rules"]["legume_rotation"]["status"], "compatible")

    def test_legume_interval_satisfied_by_recent_history(self):
        history = history_rows(
            [(2024, "Rabi", "Lentil"), (2025, "Aus", "Maize")]
        )
        result = evaluate_crop_compatibility(
            crop_record("Rice"),
            make_state(),
            field_history=history,
        )
        self.assertEqual(result["rules"]["legume_rotation"]["status"], "compatible")

    def test_legume_interval_violated_by_known_non_legumes(self):
        history = history_rows(
            [(2024, "Rabi", "Maize"), (2025, "Aus", "Wheat")]
        )
        result = evaluate_crop_compatibility(
            crop_record("Rice"),
            make_state(),
            field_history=history,
        )
        self.assertEqual(result["rules"]["legume_rotation"]["status"], "incompatible")

    def test_insufficient_history_for_legume_interval_is_unknown(self):
        result = evaluate_crop_compatibility(
            crop_record("Rice"),
            make_state(),
            field_history=history_rows([(2025, "Aus", "Maize")]),
        )
        self.assertEqual(result["rules"]["legume_rotation"]["status"], "unknown")
        self.assertEqual(LEGUME_INTERVAL_SEASONS, 3)

    def test_water_rule_requires_explicit_seasonal_supply(self):
        unknown = self.evaluate()
        self.assertEqual(unknown["rules"]["water"]["status"], "unknown")
        self.assertIn("daily rainfall", unknown["rules"]["water"]["reason"])

        sufficient = self.evaluate(features={"available_water_mm": 1500})
        self.assertEqual(sufficient["rules"]["water"]["status"], "compatible")
        insufficient = evaluate_crop_compatibility(
            crop_record("Rice"),
            make_state(),
            features={"available_water_mm": 1000},
            field_history=history_rows([(2024, "Rabi", "Lentil"), (2025, "Aus", "Maize")]),
        )
        self.assertEqual(insufficient["rules"]["water"]["status"], "incompatible")

    def test_missing_soil_moisture_does_not_infer_water_compatibility(self):
        result = evaluate_crop_compatibility(
            crop_record("Rice"),
            make_state(soil_moisture=np.nan, rainfall=np.nan),
            features={},
            field_history=history_rows([(2024, "Rabi", "Lentil"), (2025, "Aus", "Maize")]),
        )
        self.assertEqual(result["rules"]["water"]["status"], "unknown")

    def test_rule_reasons_and_source_provenance_are_returned(self):
        result = self.evaluate()
        temperature = result["rules"]["temperature"]
        self.assertIn("within", temperature["reason"])
        self.assertEqual(temperature["provenance"]["field"]["source"], "NASA_POWER")
        self.assertEqual(
            temperature["provenance"]["field"]["data_status"], "observed"
        )
        self.assertEqual(
            result["rules"]["water"]["provenance"]["field_inputs"][0]["source"],
            "demo",
        )

    def test_duration_and_soil_metadata_are_context_not_scores(self):
        result = self.evaluate()
        context = result["crop_context"]
        self.assertEqual(context["duration_days"], crop_record("Lentil")["duration_days"])
        self.assertEqual(context["is_legume"], True)
        self.assertEqual(context["nutrient_effect"], "biological_nitrogen_fixation")
        self.assertEqual(context["soil_impact"], "improves_rotation_diversity")
        self.assertTrue(
            {"nitrogen", "phosphorus", "potassium"}.issubset(context["nutrients"])
        )

    def test_no_numeric_score_or_ranking_and_no_hidden_unknown_pass(self):
        result = evaluate_crop_compatibility(
            crop_record("Rice"),
            make_state(previous_crop_family=None),
            field_history=history_rows([]),
        )
        self.assertEqual(result["overall_compatibility"], "unknown")
        self.assertNotIn("score", result)
        self.assertNotIn("ranking", result)
        self.assertNotIn("best_crop", result)
        self.assertEqual(
            result["rules"]["family_rotation"]["status"],
            "unknown",
        )

    def test_incompatible_hard_rule_propagates_without_weighted_scoring(self):
        result = evaluate_crop_compatibility(
            crop_record("Rice"),
            make_state(temperature=40, previous_crop_family="Poaceae"),
            features={"available_water_mm": 3000},
            field_history=history_rows([(2024, "Rabi", "Lentil"), (2025, "Aus", "Maize")]),
        )
        self.assertEqual(result["overall_compatibility"], "incompatible")

    def test_deterministic_results_and_input_crop_order_are_preserved(self):
        crops = load_crop_knowledge().iloc[:3]
        one = evaluate_all_crops(
            crops,
            make_state(),
            field_history=history_rows(
                [(2024, "Rabi", "Lentil"), (2025, "Aus", "Maize")]
            ),
        )
        two = evaluate_all_crops(
            crops,
            make_state(),
            field_history=history_rows(
                [(2024, "Rabi", "Lentil"), (2025, "Aus", "Maize")]
            ),
        )
        self.assertEqual([item["crop"] for item in one], list(crops["crop"]))
        self.assertEqual(repr(one), repr(two))
        for result in one:
            self.assertNotIn("score", result)

    def test_future_history_is_excluded(self):
        history = history_rows(
            [(2024, "Rabi", "Maize"), (2025, "Aus", "Wheat"), (2027, "Rabi", "Lentil")]
        )
        result = evaluate_crop_compatibility(
            crop_record("Rice"),
            make_state(),
            field_history=history,
        )
        self.assertEqual(result["rules"]["legume_rotation"]["status"], "incompatible")

    def test_configurable_legume_interval(self):
        result = evaluate_crop_compatibility(
            crop_record("Rice"),
            make_state(),
            field_history=history_rows([(2025, "Aus", "Maize")]),
            config=AgronomicRuleConfig(legume_interval_seasons=2),
        )
        self.assertEqual(result["rules"]["legume_rotation"]["status"], "incompatible")


if __name__ == "__main__":
    unittest.main()
