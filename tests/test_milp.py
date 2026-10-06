import unittest

import numpy as np
import pandas as pd
import pulp

from src.data.crops import CROP_COLUMNS, load_crop_knowledge
from src.data.field_history import FIELD_HISTORY_COLUMNS, load_field_history
from src.optimizer.milp import (
    DEFAULT_PERIODS,
    LEGUME_INTERVAL_SEASONS,
    build_milp_model,
    optimize_rotation,
)
from src.state.field_state import FieldState


def make_state(**overrides):
    values = {
        "field_id": "field_001",
        "as_of_date": "2026-09-29",
        "latitude": 23.8103,
        "longitude": 90.4125,
        "temperature": 22.0,
        "ph": 6.0,
        "soil_moisture": 0.24,
        "rainfall": 3.0,
        "nitrogen": 42.0,
        "phosphorus": 18.0,
        "potassium": 130.0,
        "environment_source": "NASA_POWER",
        "soil_source": "demo",
        "soil_moisture_source": "demo",
        "history_source": "demo",
        "data_status": {
            "environment": "observed",
            "soil_moisture": "synthetic",
            "soil": "synthetic",
            "crop": "synthetic",
            "history": "synthetic",
        },
    }
    values.update(overrides)
    return FieldState(**values)


def crop_history(rows=None):
    if rows is None:
        return load_field_history(field_id="field_001")
    return pd.DataFrame(rows, columns=FIELD_HISTORY_COLUMNS)


class MilpTests(unittest.TestCase):
    def setUp(self):
        self.crops = load_crop_knowledge()
        self.history = crop_history([])
        self.state = make_state()

    def optimize(self, **kwargs):
        settings = {
            "field_state": self.state,
            "crops": self.crops,
            "field_history": self.history,
            "profit_weight": 0.5,
            "water_weight": 0.3,
            "soil_weight": 0.2,
        }
        settings.update(kwargs)
        return optimize_rotation(**settings)

    def test_model_creation(self):
        model, metadata = build_milp_model(
            self.state, self.crops, field_history=self.history
        )
        self.assertIsInstance(model, pulp.LpProblem)
        self.assertEqual(len(metadata["variables"]), len(self.crops) * len(DEFAULT_PERIODS))

    def test_exactly_one_crop_is_selected_per_period(self):
        result = self.optimize()
        self.assertEqual(result["status"], "optimal")
        self.assertEqual(len(result["selected_crop_by_period"]), len(DEFAULT_PERIODS))
        self.assertEqual(
            list(result["selected_crop_by_period"]),
            list(DEFAULT_PERIODS),
        )
        self.assertTrue(all(result["selected_crop_by_period"].values()))

    def test_decision_variables_are_binary(self):
        _, metadata = build_milp_model(
            self.state, self.crops, field_history=self.history
        )
        self.assertTrue(
            all(variable.isBinary() for variable in metadata["variables"].values())
        )

    def test_default_and_custom_period_order_are_preserved(self):
        result = self.optimize()
        self.assertEqual(result["planning_periods"], list(DEFAULT_PERIODS))
        periods = ["Spring", "Monsoon", "Winter", "Dry"]
        custom = self.optimize(planning_periods=periods)
        self.assertEqual(custom["planning_periods"], periods)

    def test_no_same_family_is_selected_consecutively(self):
        result = self.optimize()
        families = self.crops.set_index("crop")["family"].to_dict()
        choices = list(result["selected_crop_by_period"].values())
        for left, right in zip(choices, choices[1:]):
            self.assertNotEqual(families[left], families[right])

    def test_first_period_obeys_previous_crop_family_rule(self):
        state = make_state(previous_crop_family="Poaceae")
        result = self.optimize(field_state=state)
        chosen = result["selected_crop_by_period"][result["planning_periods"][0]]
        self.assertNotEqual(
            self.crops.set_index("crop").loc[chosen, "family"],
            "Poaceae",
        )

    def test_first_period_uses_latest_eligible_history_family(self):
        history = crop_history(
            [
                ["field_001", 2025, "Winter", "Rice", 4.0, "irrigated", "demo", "synthetic"],
                ["field_001", 2027, "Summer", "Lentil", 1.0, "rainfed", "demo", "synthetic"],
            ]
        )
        _, metadata = build_milp_model(
            make_state(previous_crop_family=None, previous_crop=None),
            self.crops,
            field_history=history,
        )
        self.assertIn("Rice", metadata["first_period_blocked"])
        self.assertIn("Maize", metadata["first_period_blocked"])
        self.assertEqual(
            metadata["rule_results"]["Rice"]["rules"]["family_rotation"]["status"],
            "incompatible",
        )

    def test_unknown_previous_family_is_not_invented(self):
        state = make_state(previous_crop_family=None)
        _, metadata = build_milp_model(
            state, self.crops, field_history=self.history
        )
        self.assertEqual(metadata["first_period_blocked"], [])

    def test_legume_interval_constraint_is_applied(self):
        result = self.optimize()
        legumes = set(self.crops.loc[self.crops["is_legume"], "crop"])
        selected = list(result["selected_crop_by_period"].values())
        for start in range(len(selected) - LEGUME_INTERVAL_SEASONS + 1):
            self.assertTrue(
                any(
                    crop in legumes
                    for crop in selected[start : start + LEGUME_INTERVAL_SEASONS]
                )
            )

    def test_legume_interval_is_configurable(self):
        result = self.optimize(
            planning_periods=["P1", "P2", "P3", "P4"],
            legume_interval_seasons=2,
        )
        legumes = set(self.crops.loc[self.crops["is_legume"], "crop"])
        choices = list(result["selected_crop_by_period"].values())
        self.assertTrue(
            all(
                any(crop in legumes for crop in choices[index : index + 2])
                for index in range(len(choices) - 1)
            )
        )

    def test_profit_objective_component_uses_yield_price_and_cost(self):
        result = self.optimize(
            profit_weight=1,
            water_weight=0,
            soil_weight=0,
        )
        dyn_matrix = result.get("dynamic_agronomic_matrix", {}).get("crop_season_matrix", {})
        expected = sum(
            dyn_matrix[p][crop]["dynamic_gross_margin_bdt_ha"]
            for p, crop in result["selected_crop_by_period"].items()
        )
        self.assertAlmostEqual(result["profit_component"], expected, places=2)

    def test_water_objective_component_is_normalized_water_saving(self):
        result = self.optimize(
            profit_weight=0,
            water_weight=1,
            soil_weight=0,
        )
        self.assertIsNotNone(result["water_component"])
        self.assertGreaterEqual(result["water_component"], 0)
        self.assertLessEqual(result["water_component"], len(DEFAULT_PERIODS))
        self.assertEqual(result["weights"]["effective"]["water"], 1)

    def test_soil_objective_component_uses_documented_metadata_mapping(self):
        result = self.optimize(
            profit_weight=0,
            water_weight=0,
            soil_weight=1,
        )
        self.assertIsNotNone(result["soil_component"])
        self.assertGreaterEqual(result["soil_component"], 0)
        self.assertLessEqual(result["soil_component"], len(DEFAULT_PERIODS))
        self.assertEqual(result["weights"]["effective"]["soil"], 1)

    def test_weighted_objective_combines_normalized_components(self):
        result = self.optimize(
            profit_weight=0.5,
            water_weight=0.3,
            soil_weight=0.2,
        )
        expected = sum(
            result["weights"]["effective"][name]
            * result["normalized_components"][name]
            for name in ("profit", "water", "soil")
        )
        self.assertAlmostEqual(result["objective_value"], expected)

    def test_priority_weights_are_normalized(self):
        result = self.optimize(
            profit_weight=5,
            water_weight=3,
            soil_weight=2,
        )
        weights = result["weights"]["effective"]
        self.assertAlmostEqual(sum(weights.values()), 1)
        self.assertEqual(weights, {"profit": 0.5, "water": 0.3, "soil": 0.2})

    def test_changing_objective_weights_changes_value_without_changing_constraints(self):
        profit_focused = self.optimize(
            profit_weight=1,
            water_weight=0,
            soil_weight=0,
        )
        water_focused = self.optimize(
            profit_weight=0,
            water_weight=1,
            soil_weight=0,
        )
        self.assertNotAlmostEqual(
            profit_focused["objective_value"],
            water_focused["objective_value"],
        )
        for key in (
            "one_crop_per_period",
            "family_transition_constraints",
            "previous_family_exclusions",
            "static_compatibility_exclusions",
            "legume_interval_seasons",
            "legume_windows",
        ):
            self.assertEqual(
                profit_focused["constraint_summary"][key],
                water_focused["constraint_summary"][key],
            )

    def test_repeated_run_is_deterministic(self):
        first = self.optimize()
        second = self.optimize()
        self.assertEqual(first["selected_crop_by_period"], second["selected_crop_by_period"])
        self.assertAlmostEqual(first["objective_value"], second["objective_value"])

    def test_incomplete_profit_metadata_excludes_component_not_zero_fills(self):
        crops = self.crops.copy()
        crops["expected_yield"] = np.nan
        result = self.optimize(crops=crops)
        self.assertEqual(
            result["data_status"]["objective_components"]["profit"],
            "excluded_missing_metadata",
        )
        self.assertEqual(result["weights"]["effective"]["profit"], 0)
        self.assertEqual(result["weights"]["effective"]["water"], 0.6)
        self.assertEqual(result["weights"]["effective"]["soil"], 0.4)
        self.assertIsNone(result["profit_component"])

    def test_unknown_compatibility_does_not_exclude_candidate_crops(self):
        state = make_state(temperature=np.nan, ph=np.nan)
        _, metadata = build_milp_model(
            state, self.crops, field_history=self.history
        )
        self.assertEqual(metadata["excluded_static"], [])
        self.assertTrue(metadata["eligibility"]["Rice"])

    def test_explicitly_incompatible_static_rule_excludes_crop(self):
        state = make_state(temperature=40)
        _, metadata = build_milp_model(
            state, self.crops, field_history=self.history
        )
        self.assertIn("Lentil", metadata["excluded_static"])

    def test_infeasible_same_family_crop_set_returns_controlled_status(self):
        crops = self.crops.loc[self.crops["crop"].isin(["Rice", "Lentil"])].copy()
        crops["family"] = "SharedFamily"
        result = self.optimize(
            crops=crops,
            planning_periods=["P1", "P2", "P3"],
            legume_interval_seasons=2,
        )
        self.assertEqual(result["status"], "infeasible")
        self.assertEqual(result["solver_status"], "Infeasible")
        self.assertIsNone(result["selected_crop_by_period"])
        self.assertIsNone(result["objective_value"])
        self.assertIsNotNone(result["constraint_summary"]["infeasibility_note"])

    def test_missing_legume_candidates_return_controlled_infeasibility(self):
        crops = self.crops.copy()
        crops["is_legume"] = False
        result = self.optimize(
            crops=crops,
            planning_periods=["P1", "P2", "P3"],
        )
        self.assertEqual(result["status"], "infeasible")
        self.assertEqual(result["solver_status"], "Infeasible")
        self.assertIsNone(result["selected_crop_by_period"])

    def test_provenance_reports_input_sources_and_rules(self):
        result = self.optimize()
        self.assertEqual(result["provenance"]["environment"]["source"], "NASA_POWER")
        self.assertEqual(result["provenance"]["environment"]["data_status"], "observed")
        self.assertEqual(result["provenance"]["crop_knowledge"]["source"], ["demo"])
        self.assertTrue(
            result["provenance"]["crop_knowledge"]["economic_values_are_illustrative"]
        )
        self.assertEqual(result["provenance"]["agronomic_rules"]["data_status"], "applied")
        lentil = result["compatibility_by_crop"]["Lentil"]
        self.assertEqual(lentil["crop_context"]["duration_days"], 110)
        self.assertIn("nutrients", lentil["crop_context"])
        self.assertIn("provenance", lentil["rules"]["temperature"])

    def test_output_schema_and_constraint_summary(self):
        result = self.optimize()
        required = {
            "status",
            "solver_status",
            "planning_periods",
            "selected_crop_by_period",
            "objective_value",
            "profit_component",
            "water_component",
            "soil_component",
            "weights",
            "constraint_summary",
            "data_status",
            "provenance",
        }
        self.assertTrue(required.issubset(result))
        self.assertEqual(
            result["constraint_summary"]["one_crop_per_period"],
            len(DEFAULT_PERIODS),
        )
        self.assertTrue(
            result["constraint_summary"]["unknown_compatibility_allowed"]
        )

    def test_synthetic_crop_data_status_is_exposed(self):
        result = self.optimize()
        self.assertEqual(
            result["data_status"]["crop_knowledge"],
            ["synthetic"],
        )
        self.assertEqual(
            result["provenance"]["crop_knowledge"]["data_status"],
            ["synthetic"],
        )

    def test_planning_horizon_is_configurable(self):
        periods = ["S1", "S2", "S3"]
        result = self.optimize(planning_periods=periods, legume_interval_seasons=2)
        self.assertEqual(result["planning_periods"], periods)
        self.assertEqual(list(result["selected_crop_by_period"]), periods)
        two_year = self.optimize(years=2, seasons_per_year=3)
        self.assertEqual(
            two_year["planning_periods"],
            ["Y1_S1", "Y1_S2", "Y1_S3", "Y2_S1", "Y2_S2", "Y2_S3"],
        )

    def test_optimizer_has_no_crop_ranking_api(self):
        result = self.optimize()
        self.assertNotIn("ranking", result)
        self.assertNotIn("best_crop", result)
        self.assertNotIn("crop_scores", result)

    def test_no_rl_modules_or_predictions_are_in_optimizer_output(self):
        result = self.optimize()
        self.assertNotIn("policy", result)
        self.assertNotIn("action", result)
        self.assertNotIn("prediction", result)
        self.assertNotIn("rl", result)

    def test_invalid_weights_and_periods_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "weights"):
            self.optimize(profit_weight=0, water_weight=0, soil_weight=0)
        for invalid in (True, "not-a-number", np.nan, np.inf, -0.1):
            with self.subTest(invalid=invalid):
                with self.assertRaisesRegex(ValueError, "Priority weights"):
                    self.optimize(
                        profit_weight=invalid,
                        water_weight=0,
                        soil_weight=0,
                    )
        with self.assertRaisesRegex(ValueError, "unique"):
            self.optimize(planning_periods=["S1", "S1"])

    def test_negative_or_unavailable_seasonal_water_is_not_invented(self):
        result = self.optimize(features={"available_water_mm": -10})
        self.assertEqual(result["status"], "optimal")
        self.assertEqual(result["provenance"]["environment"]["source"], "NASA_POWER")


if __name__ == "__main__":
    unittest.main()
