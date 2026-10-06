import tempfile
import unittest
from pathlib import Path

from src.data.crops import load_crop_knowledge
from src.experiments.research_benchmark import (
    AVAILABLE_WATER_VALUES_MM,
    OBJECTIVE_WEIGHT_VALUES,
    PLANNING_PERIODS,
    _optimizer_summary,
    append_report,
    render_markdown_report,
    run_benchmark,
    run_sensitivity,
)


class ResearchBenchmarkTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.result = run_benchmark()

    def test_identical_benchmark_runs_are_repeatable(self):
        repeated = run_benchmark()
        self.assertEqual(
            self.result["baseline_optimizer"]["status"],
            repeated["baseline_optimizer"]["status"],
        )
        self.assertEqual(
            self.result["baseline_optimizer"]["plan"],
            repeated["baseline_optimizer"]["plan"],
        )
        self.assertEqual(
            self.result["baseline_optimizer"]["objective_components"],
            repeated["baseline_optimizer"]["objective_components"],
        )
        for name in self.result["scenarios"]:
            self.assertEqual(
                self.result["scenarios"][name]["scenario_optimizer"]["plan"],
                repeated["scenarios"][name]["scenario_optimizer"]["plan"],
            )

    def test_baseline_and_supported_scenarios_are_recorded(self):
        self.assertEqual(self.result["configuration"]["planning_periods"], list(PLANNING_PERIODS))
        self.assertEqual(
            self.result["configuration"]["objective_weights"],
            {"profit_weight": 0.5, "water_weight": 0.3, "soil_weight": 0.2},
        )
        self.assertEqual(
            self.result["configuration"]["baseline_available_water_mm"], 1500.0
        )
        self.assertEqual(
            set(self.result["scenarios"]), {"normal", "drought", "heat", "low_water"}
        )
        self.assertEqual(
            self.result["scenario_configuration"]["low_water_fraction"], 0.6
        )
        self.assertEqual(
            self.result["scenario_configuration"]["heat_temperature_delta"], 5.0
        )
        self.assertEqual(
            self.result["scenario_configuration"]["drought_soil_moisture_delta"],
            -0.08,
        )
        self.assertFalse(self.result["scenario_configuration"]["rainfall_scenario_supported"])

    def test_solver_and_independent_constraints_are_reported_per_run(self):
        baseline = self.result["baseline_optimizer"]
        self.assertIn(baseline["status"], {"optimal", "infeasible", "not_solved", "solver_error"})
        if baseline["feasible"]:
            self.assertTrue(baseline["independent_constraint_check"]["passed"])
        else:
            self.assertIsNone(baseline["independent_constraint_check"]["passed"])
            self.assertIsNone(baseline["plan"])
        for scenario in self.result["scenarios"].values():
            optimizer = scenario["scenario_optimizer"]
            if optimizer and optimizer["feasible"]:
                self.assertTrue(optimizer["independent_constraint_check"]["passed"])
            elif optimizer:
                self.assertIsNone(optimizer["independent_constraint_check"]["passed"])
                self.assertIsNone(optimizer["plan"])

    def test_infeasible_run_is_not_mislabeled_as_feasible(self):
        result = _optimizer_summary(
            {
                "status": "infeasible",
                "solver_status": "Infeasible",
                "selected_crop_by_period": None,
                "objective_value": None,
                "profit_component": None,
                "water_component": None,
                "soil_component": None,
                "data_status": {},
                "weights": {},
            },
            crops=load_crop_knowledge(),
            planning_periods=PLANNING_PERIODS,
            legume_interval_seasons=3,
        )
        self.assertFalse(result["feasible"])
        self.assertIsNone(result["plan"])
        self.assertIsNone(result["independent_constraint_check"]["passed"])

    def test_results_retain_hypothetical_and_synthetic_provenance(self):
        self.assertTrue(all(item["hypothetical"] for item in self.result["scenarios"].values()))
        self.assertFalse(self.result["data_boundary"]["rl_trained"])
        self.assertEqual(
            self.result["inputs"]["crop_data_status"], ["synthetic"]
        )
        heat = self.result["scenarios"]["heat"]
        self.assertTrue(
            all(
                details["scenario_provenance"]["data_status"] == "synthetic"
                for details in heat["changed_fields"].values()
            )
        )

    def test_dataset_inventory_is_computed_from_existing_files(self):
        inventory = {item["file"]: item for item in self.result["dataset_audit"]}
        self.assertEqual(
            inventory["data/nasa_power/nasa_power_2025.csv"]["row_count"], 365
        )
        recent = inventory[
            "data/nasa_power/nasa_power_lat23.8103_lon90.4125_20260831_20260929.csv"
        ]
        self.assertEqual(recent["row_count"], 30)
        self.assertEqual(recent["missing_counts"], {"solar_radiation": 2})
        self.assertEqual(
            inventory["data/crops/crop_knowledge.csv"]["evidence_class"],
            "synthetic",
        )

    def test_sensitivity_varies_one_parameter_and_records_outcomes(self):
        sensitivity = self.result["sensitivity"]
        self.assertEqual(
            [
                item["parameter_value"]
                for item in sensitivity["heat_temperature_delta"]
            ],
            [2.0, 5.0, 8.0],
        )
        self.assertEqual(
            [item["parameter_value"] for item in sensitivity["low_water_fraction"]],
            [0.8, 0.6, 0.4],
        )
        self.assertEqual(
            [item["parameter_value"] for item in sensitivity["drought_soil_moisture_delta"]],
            [-0.04, -0.08, -0.12],
        )
        self.assertTrue(
            all(
                item["optimizer"]["independent_constraint_check"]["passed"]
                for item in sensitivity["heat_temperature_delta"]
                if item["optimizer"]["feasible"]
            )
        )
        self.assertEqual(
            set(sensitivity["objective_weights"]),
            {"profit_weight", "water_weight", "soil_weight"},
        )
        for variants in sensitivity["objective_weights"].values():
            self.assertEqual(
                [item["parameter_value"] for item in variants],
                list(OBJECTIVE_WEIGHT_VALUES),
            )
            for item in variants:
                self.assertAlmostEqual(sum(item["requested_weights"].values()), 1.0)
                optimizer = item["optimizer"]
                if optimizer["feasible"]:
                    self.assertTrue(
                        optimizer["independent_constraint_check"]["passed"]
                    )
                else:
                    self.assertIsNone(optimizer["plan"])
                    self.assertIsNone(
                        optimizer["independent_constraint_check"]["passed"]
                    )
        water_cases = sensitivity["baseline_available_water_mm"]
        self.assertEqual(
            [item["parameter_value"] for item in water_cases],
            list(AVAILABLE_WATER_VALUES_MM),
        )
        self.assertIsNone(water_cases[0]["optimizer"]["plan"])
        self.assertIsNone(
            water_cases[0]["optimizer"]["independent_constraint_check"]["passed"]
        )

    def test_repeated_baseline_runs_report_exact_repeatability_and_constraints(self):
        repeatability = self.result["repeatability"]
        self.assertEqual(repeatability["repetitions"], 2)
        self.assertTrue(repeatability["repeatable"])
        self.assertTrue(repeatability["same_optimizer_status"])
        self.assertTrue(repeatability["same_plan"])
        self.assertTrue(repeatability["components_within_tolerance"])
        self.assertLessEqual(
            repeatability["maximum_absolute_component_difference"],
            repeatability["component_absolute_tolerance"],
        )
        self.assertTrue(
            all(
                run["independent_constraint_check"]["passed"]
                for run in repeatability["runs"]
                if run["status"] in {"optimal", "feasible"}
            )
        )

    def test_sensitivity_configuration_rejects_invalid_weights_and_water(self):
        crops = load_crop_knowledge()
        state = self.result["inputs"]["state"]
        from src.state.field_state import FieldState

        with self.assertRaises(ValueError):
            run_sensitivity(
                FieldState.from_dict(state),
                crops=crops,
                planning_periods=PLANNING_PERIODS,
                legume_interval_seasons=3,
                weight_values=(0.2, float("nan")),
            )
        with self.assertRaises(ValueError):
            run_sensitivity(
                FieldState.from_dict(state),
                crops=crops,
                planning_periods=PLANNING_PERIODS,
                legume_interval_seasons=3,
                available_water_values_mm=(-1.0,),
            )

    def test_report_renders_actual_statuses_and_required_integrity_claims(self):
        report = render_markdown_report(self.result)
        self.assertIn("Optimizer and constraints", report)
        self.assertIn("Phase 29", report)
        self.assertIn("Objective-weight sensitivity", report)
        self.assertIn("Baseline seasonal water assumptions", report)
        self.assertIn("NASA POWER-attributed", report)
        self.assertIn("No real farm data were fabricated", report)
        self.assertIn("RL was not trained or enabled", report)
        self.assertIn(self.result["baseline_optimizer"]["status"], report)

    def test_appending_report_preserves_prior_contents_and_second_append(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "output.txt"
            prior = b"Existing user report\r\nwith exact bytes.\x00"
            path.write_bytes(prior)
            report = "# Phase 28 report\n\nActual test report."
            append_report(path, report)
            after_first = path.read_bytes()
            self.assertTrue(after_first.startswith(prior))
            append_report(path, report)
            after_second = path.read_bytes()
        self.assertTrue(after_second.startswith(prior))
        self.assertEqual(after_second.count(b"# Phase 28 report"), 2)
        self.assertTrue(after_second.startswith(after_first))


if __name__ == "__main__":
    unittest.main()
