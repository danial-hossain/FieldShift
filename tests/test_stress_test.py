import unittest
from unittest.mock import patch

import numpy as np

from src.data.crops import load_crop_knowledge
from src.knowledge.agronomic_rules import AgronomicRuleConfig
from src.preprocessing.features import build_features
from src.scenarios.stress_test import (
    DEFAULT_SCENARIOS,
    StressScenarioConfig,
    apply_scenario,
    run_stress_tests,
)
from src.state.field_state import FieldState


def make_state(**overrides):
    values = {
        "field_id": "field_001",
        "as_of_date": "2026-09-29",
        "latitude": 23.8103,
        "longitude": 90.4125,
        "temperature": 28.0,
        "temp_max": 32.0,
        "temp_min": 23.0,
        "rainfall": 3.0,
        "humidity": 70.0,
        "soil_moisture": 0.24,
        "ph": 6.0,
        "environment_source": "NASA_POWER",
        "soil_source": "demo",
        "soil_moisture_source": "SMAP demo",
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


def optimizer_result(rotation=None, status="optimal"):
    return {
        "status": status,
        "solver_status": "Optimal" if status == "optimal" else "Infeasible",
        "selected_crop_by_period": rotation if status == "optimal" else None,
        "profit_component": 10.0 if status == "optimal" else None,
        "water_component": 2.0 if status == "optimal" else None,
        "soil_component": 1.0 if status == "optimal" else None,
        "data_status": {"crop_knowledge": ["synthetic"]},
        "provenance": {},
        "constraint_summary": {},
    }


ROTATION = {"Y1_S1": "Lentil", "Y1_S2": "Rice"}


class StressTestTests(unittest.TestCase):
    def setUp(self):
        self.state = make_state()
        self.features = build_features(self.state)

    def test_default_scenario_names_are_available(self):
        self.assertEqual(DEFAULT_SCENARIOS, ("normal", "drought", "heat", "low_water"))

    def test_normal_scenario_preserves_state_values(self):
        applied = apply_scenario("normal", self.state, self.features)
        self.assertEqual(applied["status"], "applied")
        self.assertEqual(applied["changed_fields"], {})
        self.assertEqual(applied["state"].temperature, self.state.temperature)
        self.assertEqual(applied["state"].soil_moisture, self.state.soil_moisture)

    def test_normal_scenario_copies_features(self):
        applied = apply_scenario("normal", self.state, self.features)
        self.assertEqual(applied["features"], self.features)
        self.assertIsNot(applied["features"], self.features)
        self.assertIsNot(applied["features"]["provenance"], self.features["provenance"])

    def test_drought_reduces_soil_moisture_by_default_delta(self):
        applied = apply_scenario("drought", self.state, self.features)
        self.assertAlmostEqual(applied["state"].soil_moisture, 0.16)
        self.assertEqual(applied["changed_fields"]["soil_moisture"]["baseline"], 0.24)

    def test_drought_clamps_soil_moisture_at_zero(self):
        state = make_state(soil_moisture=0.03)
        applied = apply_scenario("drought", state, build_features(state))
        self.assertEqual(applied["state"].soil_moisture, 0.0)

    def test_heat_increases_temperature_by_default_delta(self):
        applied = apply_scenario("heat", self.state, self.features)
        self.assertEqual(applied["state"].temperature, 33.0)

    def test_heat_updates_minimum_temperature(self):
        applied = apply_scenario("heat", self.state, self.features)
        self.assertEqual(applied["state"].temp_min, 28.0)

    def test_heat_updates_maximum_temperature(self):
        applied = apply_scenario("heat", self.state, self.features)
        self.assertEqual(applied["state"].temp_max, 37.0)

    def test_heat_preserves_temperature_range_consistency(self):
        applied = apply_scenario("heat", self.state, self.features)
        self.assertEqual(
            applied["state"].temp_max - applied["state"].temp_min,
            self.state.temp_max - self.state.temp_min,
        )

    def test_low_water_uses_configured_fraction(self):
        features = {**self.features, "available_water_mm": 500.0}
        applied = apply_scenario("low_water", self.state, features)
        self.assertEqual(applied["features"]["available_water_mm"], 300.0)

    def test_low_water_without_available_water_is_not_applicable(self):
        applied = apply_scenario("low_water", self.state, self.features)
        self.assertEqual(applied["status"], "not_applicable")
        self.assertIn("not substituted", applied["reason"])

    def test_missing_soil_moisture_does_not_fabricate_drought_value(self):
        state = make_state(soil_moisture=np.nan)
        applied = apply_scenario("drought", state)
        self.assertEqual(applied["status"], "not_applicable")
        self.assertTrue(np.isnan(applied["state"].soil_moisture))

    def test_missing_temperature_does_not_fabricate_heat_value(self):
        state = make_state(temperature=np.nan)
        applied = apply_scenario("heat", state)
        self.assertEqual(applied["status"], "not_applicable")
        self.assertTrue(np.isnan(applied["state"].temperature))

    def test_baseline_field_state_remains_unchanged(self):
        original = self.state.to_dict()
        apply_scenario("drought", self.state, self.features)
        apply_scenario("heat", self.state, self.features)
        self.assertEqual(self.state.to_dict(), original)

    def test_baseline_features_remain_unchanged(self):
        original = {**self.features, "provenance": dict(self.features["provenance"])}
        apply_scenario("drought", self.state, self.features)
        self.assertEqual(self.features, original)

    def test_stress_scenarios_do_not_mutate_or_contaminate_each_other(self):
        original_state = self.state.to_dict()
        original_features = {
            **self.features,
            "provenance": dict(self.features["provenance"]),
        }
        result = run_stress_tests(
            self.state,
            self.features,
            crops=load_crop_knowledge(),
            scenarios=["drought", "heat"],
            run_milp=False,
        )
        drought = result["scenarios"]["drought"]["scenario_state"]
        heat = result["scenarios"]["heat"]["scenario_state"]

        self.assertEqual(self.state.to_dict(), original_state)
        self.assertEqual(self.features, original_features)
        self.assertEqual(drought.temperature, self.state.temperature)
        self.assertEqual(heat.soil_moisture, self.state.soil_moisture)
        self.assertEqual(drought.data_status["environment"], "observed")
        self.assertEqual(drought.data_status["soil_moisture"], "synthetic")
        self.assertEqual(heat.data_status["environment"], "synthetic")
        self.assertEqual(heat.data_status["soil_moisture"], "synthetic")

    def test_unchanged_field_provenance_is_preserved(self):
        applied = apply_scenario("heat", self.state, self.features)
        self.assertEqual(
            applied["features"]["provenance"]["rainfall"],
            self.features["provenance"]["rainfall"],
        )
        self.assertEqual(applied["state"].soil_moisture_source, "SMAP demo")

    def test_modified_temperature_provenance_is_scenario_synthetic(self):
        applied = apply_scenario("heat", self.state, self.features)
        changed = applied["changed_fields"]["temperature"]
        self.assertEqual(
            changed["baseline_provenance"],
            {"source": "NASA_POWER", "data_status": "observed"},
        )
        self.assertEqual(
            changed["scenario_provenance"],
            {"source": "scenario", "data_status": "synthetic"},
        )
        self.assertEqual(applied["state"].environment_source, "scenario")
        self.assertEqual(applied["state"].data_status["environment"], "synthetic")

    def test_modified_soil_moisture_provenance_is_scenario_synthetic(self):
        applied = apply_scenario("drought", self.state, self.features)
        self.assertEqual(
            applied["changed_fields"]["soil_moisture"]["scenario_provenance"],
            {"source": "scenario", "data_status": "synthetic"},
        )
        self.assertEqual(applied["state"].soil_moisture_source, "scenario")

    def test_changed_fields_contains_baseline_and_scenario_values(self):
        applied = apply_scenario("drought", self.state, self.features)
        self.assertEqual(
            applied["changed_fields"]["soil_moisture"]["baseline"], 0.24
        )
        self.assertAlmostEqual(
            applied["changed_fields"]["soil_moisture"]["scenario"], 0.16
        )

    def test_scenario_output_is_deterministic(self):
        first = apply_scenario("heat", self.state, self.features)
        second = apply_scenario("heat", self.state, self.features)
        self.assertEqual(first["state"].to_dict(), second["state"].to_dict())
        self.assertEqual(first["changed_fields"], second["changed_fields"])

    def test_scenario_parameters_are_configurable(self):
        config = StressScenarioConfig(
            drought_soil_moisture_delta=-0.10,
            heat_temperature_delta=3,
            low_water_fraction=0.5,
        )
        drought = apply_scenario("drought", self.state, config=config)
        heat = apply_scenario("heat", self.state, config=config)
        water = apply_scenario(
            "low_water", self.state, {"available_water_mm": 200}, config
        )
        self.assertAlmostEqual(drought["state"].soil_moisture, 0.14)
        self.assertEqual(heat["state"].temperature, 31.0)
        self.assertEqual(water["features"]["available_water_mm"], 100.0)

    def test_normal_scenario_runs_through_phase_6(self):
        with patch(
            "src.scenarios.stress_test.evaluate_all_crops",
            wraps=__import__(
                "src.knowledge.agronomic_rules", fromlist=["evaluate_all_crops"]
            ).evaluate_all_crops,
        ) as evaluate:
            result = run_stress_tests(
                self.state,
                self.features,
                crops=load_crop_knowledge(),
                scenarios=["normal"],
                run_milp=False,
            )
        self.assertEqual(result["scenarios"]["normal"]["status"], "completed")
        self.assertEqual(evaluate.call_count, 1)

    def test_drought_compatibility_uses_phase_6_rule_engine(self):
        with patch(
            "src.scenarios.stress_test.evaluate_all_crops",
            wraps=__import__(
                "src.knowledge.agronomic_rules", fromlist=["evaluate_all_crops"]
            ).evaluate_all_crops,
        ) as evaluate:
            run_stress_tests(
                self.state,
                self.features,
                crops=load_crop_knowledge(),
                scenarios=["drought"],
                run_milp=False,
            )
        self.assertEqual(evaluate.call_count, 2)

    def test_heat_compatibility_uses_phase_6_rule_engine(self):
        with patch(
            "src.scenarios.stress_test.evaluate_all_crops",
            wraps=__import__(
                "src.knowledge.agronomic_rules", fromlist=["evaluate_all_crops"]
            ).evaluate_all_crops,
        ) as evaluate:
            run_stress_tests(
                self.state,
                self.features,
                crops=load_crop_knowledge(),
                scenarios=["heat"],
                run_milp=False,
            )
        self.assertEqual(evaluate.call_count, 2)

    def test_low_water_scenario_uses_phase_6_water_rule(self):
        features = {**self.features, "available_water_mm": 400}
        with patch(
            "src.scenarios.stress_test.evaluate_all_crops",
            wraps=__import__(
                "src.knowledge.agronomic_rules", fromlist=["evaluate_all_crops"]
            ).evaluate_all_crops,
        ) as evaluate:
            result = run_stress_tests(
                self.state,
                features,
                crops=load_crop_knowledge(),
                scenarios=["low_water"],
                run_milp=False,
            )
        self.assertEqual(evaluate.call_count, 2)
        scenario_features = result["scenarios"]["low_water"]["scenario_features"]
        self.assertEqual(scenario_features["available_water_mm"], 240)

    def test_milp_integration_calls_phase_7_for_baseline_and_scenario(self):
        with patch(
            "src.scenarios.stress_test.optimize_rotation",
            side_effect=[optimizer_result(ROTATION), optimizer_result(ROTATION)],
        ) as optimize:
            result = run_stress_tests(
                self.state,
                self.features,
                crops=load_crop_knowledge(),
                scenarios=["drought"],
            )
        self.assertEqual(optimize.call_count, 2)
        self.assertFalse(result["scenarios"]["drought"]["rotation_changed"])

    def test_infeasible_scenario_has_no_fake_rotation(self):
        with patch(
            "src.scenarios.stress_test.optimize_rotation",
            side_effect=[
                optimizer_result(ROTATION),
                optimizer_result(status="infeasible"),
            ],
        ):
            result = run_stress_tests(
                self.state,
                self.features,
                crops=load_crop_knowledge(),
                scenarios=["drought"],
            )
        scenario = result["scenarios"]["drought"]
        self.assertEqual(scenario["status"], "infeasible")
        self.assertIsNone(scenario["scenario_rotation"])

    def test_comparison_contains_baseline_and_scenario_rotations(self):
        with patch(
            "src.scenarios.stress_test.optimize_rotation",
            side_effect=[
                optimizer_result(ROTATION),
                optimizer_result({"Y1_S1": "Rice", "Y1_S2": "Lentil"}),
            ],
        ):
            result = run_stress_tests(
                self.state,
                self.features,
                crops=load_crop_knowledge(),
                scenarios=["drought"],
            )
        comparison = result["scenarios"]["drought"]
        self.assertEqual(comparison["baseline_rotation"], ROTATION)
        self.assertEqual(
            comparison["scenario_rotation"],
            {"Y1_S1": "Rice", "Y1_S2": "Lentil"},
        )
        self.assertTrue(comparison["rotation_changed"])

    def test_rotation_changed_false_when_rotations_match(self):
        with patch(
            "src.scenarios.stress_test.optimize_rotation",
            side_effect=[optimizer_result(ROTATION), optimizer_result(ROTATION)],
        ):
            result = run_stress_tests(
                self.state,
                self.features,
                crops=load_crop_knowledge(),
                scenarios=["heat"],
            )
        self.assertFalse(result["scenarios"]["heat"]["rotation_changed"])

    def test_optional_milp_can_be_disabled(self):
        with patch("src.scenarios.stress_test.optimize_rotation") as optimize:
            result = run_stress_tests(
                self.state,
                self.features,
                crops=load_crop_knowledge(),
                scenarios=["normal", "drought"],
                run_milp=False,
            )
        optimize.assert_not_called()
        self.assertIsNone(result["scenarios"]["drought"]["rotation_changed"])

    def test_agronomic_configuration_is_forwarded_to_phase_6(self):
        config = AgronomicRuleConfig(legume_interval_seasons=4)
        with patch(
            "src.scenarios.stress_test.evaluate_all_crops",
            return_value=[],
        ) as evaluate:
            run_stress_tests(
                self.state,
                self.features,
                crops=[],
                scenarios=["normal"],
                agronomic_config=config,
                run_milp=False,
            )
        self.assertIs(evaluate.call_args.kwargs["config"], config)

    def test_provenance_result_distinguishes_baseline_and_scenario(self):
        applied = apply_scenario("heat", self.state, self.features)
        self.assertEqual(
            applied["provenance"]["changed_fields"]["temperature"],
            {"source": "scenario", "data_status": "synthetic"},
        )
        with patch(
            "src.scenarios.stress_test.optimize_rotation",
            side_effect=[optimizer_result(ROTATION), optimizer_result(ROTATION)],
        ):
            result = run_stress_tests(
                self.state,
                self.features,
                crops=load_crop_knowledge(),
                scenarios=["heat"],
            )
        self.assertEqual(
            result["provenance"]["interpretation"],
            "hypothetical_what_if_not_forecast",
        )

    def test_output_has_no_ranking_or_stress_score(self):
        with patch(
            "src.scenarios.stress_test.optimize_rotation",
            side_effect=[optimizer_result(ROTATION), optimizer_result(ROTATION)],
        ):
            result = run_stress_tests(
                self.state,
                self.features,
                crops=load_crop_knowledge(),
                scenarios=["drought"],
            )
        serialized_keys = set(result) | set(result["scenarios"]["drought"])
        self.assertFalse(
            {"rank", "ranking", "stress_score", "aggregate_score"} & serialized_keys
        )

    def test_output_does_not_add_forecast_field(self):
        result = run_stress_tests(
            self.state,
            self.features,
            crops=load_crop_knowledge(),
            scenarios=["normal"],
            run_milp=False,
        )
        self.assertNotIn("forecast", result)
        self.assertNotIn("prediction", result)

    def test_unknown_scenario_is_rejected_before_evaluation(self):
        with patch("src.scenarios.stress_test.evaluate_all_crops") as evaluate:
            with self.assertRaisesRegex(ValueError, "Unknown scenarios"):
                run_stress_tests(self.state, scenarios=["climate_forecast"])
        evaluate.assert_not_called()

    def test_low_water_reduction_has_scenario_provenance(self):
        applied = apply_scenario(
            "low_water",
            self.state,
            {**self.features, "available_water_mm": 450},
        )
        self.assertEqual(
            applied["features"]["provenance"]["available_water_mm"],
            {"source": "scenario", "data_status": "synthetic"},
        )
        self.assertEqual(
            applied["changed_fields"]["available_water_mm"]["baseline_provenance"][
                "source"
            ],
            "caller_supplied",
        )

    def test_temperature_scenario_refreshes_dependent_features(self):
        applied = apply_scenario("heat", self.state, self.features)
        self.assertEqual(applied["features"]["temperature"], 33.0)
        self.assertEqual(
            applied["features"]["temperature_range"],
            applied["state"].temp_max - applied["state"].temp_min,
        )

    def test_config_rejects_invalid_assumptions(self):
        for values in (
            {"drought_soil_moisture_delta": 0.1},
            {"heat_temperature_delta": -1},
            {"low_water_fraction": 1.5},
        ):
            with self.subTest(values=values):
                with self.assertRaises(ValueError):
                    StressScenarioConfig(**values)

    def test_scenario_order_is_preserved(self):
        with patch(
            "src.scenarios.stress_test.optimize_rotation",
            side_effect=[optimizer_result(ROTATION), optimizer_result(ROTATION)],
        ):
            result = run_stress_tests(
                self.state,
                self.features,
                crops=load_crop_knowledge(),
                scenarios=["heat", "normal"],
            )
        self.assertEqual(list(result["scenarios"]), ["heat", "normal"])


if __name__ == "__main__":
    unittest.main()
