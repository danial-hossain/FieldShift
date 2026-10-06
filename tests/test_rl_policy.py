"""Unit and integration tests for Reinforcement Learning Crop Rotation Policy."""

from __future__ import annotations

import unittest
import pandas as pd

from src.data.crops import load_crop_knowledge
from src.rl.crop_rotation_rl import (
    POLICY_LABEL,
    compare_rl_vs_milp,
    run_reinforcement_learning_policy,
)
from src.scenarios.stress_test import run_stress_tests
from src.state.field_state import FieldState


class RLPolicyTests(unittest.TestCase):

    def setUp(self):
        self.crops = load_crop_knowledge()
        self.field_state = FieldState(
            field_id="field_rl_test",
            as_of_date=pd.Timestamp("2026-06-01"),
            latitude=23.8103,
            longitude=90.4125,
            field_size_ha=10.0,
            temperature=25.0,
            ph=6.6,
            soil_moisture=0.28,
            rainfall=600.0,
            organic_matter=2.0,
            texture="loam",
            previous_crop="Wheat",
        )

    def test_rl_policy_provenance_and_horizon(self):
        result = run_reinforcement_learning_policy(
            field_state=self.field_state,
            crops=self.crops,
            priority="balanced",
        )
        self.assertEqual(result["status"], "completed")
        self.assertEqual(result["policy_label"], POLICY_LABEL)
        self.assertEqual(result["planning_horizon_seasons"], 6)
        self.assertEqual(len(result["decisions"]), 6)
        self.assertIn("trajectory_summary", result)

        traj = result["trajectory_summary"]
        self.assertGreater(traj["total_profit_bdt_per_ha"], 0)
        self.assertGreater(traj["total_field_profit_bdt"], 0)
        self.assertGreater(traj["total_water_requirement_mm"], 0)
        self.assertGreater(traj["crop_diversity_count"], 1)

    def test_rl_policy_priority_weight_divergence(self):
        profit_res = run_reinforcement_learning_policy(
            field_state=self.field_state,
            crops=self.crops,
            priority="profit",
        )
        water_res = run_reinforcement_learning_policy(
            field_state=self.field_state,
            crops=self.crops,
            priority="water_efficiency",
        )
        soil_res = run_reinforcement_learning_policy(
            field_state=self.field_state,
            crops=self.crops,
            priority="soil_health",
        )

        p_traj = profit_res["trajectory_summary"]
        w_traj = water_res["trajectory_summary"]
        s_traj = soil_res["trajectory_summary"]

        # Water priority must use less total water or deliver higher water conservation
        self.assertLessEqual(w_traj["total_water_requirement_mm"], p_traj["total_water_requirement_mm"])
        # Soil priority must improve soil health
        self.assertGreater(s_traj["final_soil_health"], s_traj["initial_soil_health"])

    def test_rl_decision_step_structure_and_rationale(self):
        result = run_reinforcement_learning_policy(
            field_state=self.field_state,
            crops=self.crops,
            priority="balanced",
        )
        for dec in result["decisions"]:
            self.assertIn("chosen_crop", dec)
            self.assertIn("q_value", dec)
            self.assertIn("decision_rationale", dec)
            self.assertIn("key_takeaway", dec)
            self.assertIn("top_candidates", dec)
            self.assertGreater(len(dec["decision_rationale"]), 10)
            self.assertGreater(len(dec["top_candidates"]), 0)

    def test_compare_rl_vs_milp(self):
        from src.optimizer.strategies import generate_rotation_strategies
        strats = generate_rotation_strategies(
            field_state=self.field_state,
            crops=self.crops,
        )
        milp_plan = strats["strategies"]["balanced"]

        rl_res = run_reinforcement_learning_policy(
            field_state=self.field_state,
            crops=self.crops,
            priority="balanced",
        )

        comparison = compare_rl_vs_milp(
            rl_result=rl_res,
            milp_plan=milp_plan,
            field_state=self.field_state,
            crops=self.crops,
        )

        self.assertIn("agreement_percentage", comparison)
        self.assertIn("comparison_metrics", comparison)
        self.assertIn("methodology_insights", comparison)
        self.assertGreater(len(comparison["comparison_metrics"]), 4)

    def test_stress_testing_with_rl_policy(self):
        stress_res = run_stress_tests(
            field_state=self.field_state,
            crops=self.crops,
            scenarios=["normal", "drought", "heat", "low_water"],
        )
        self.assertEqual(stress_res["status"], "completed")
        scenarios = stress_res["scenarios"]

        for sc in ["normal", "drought", "heat", "low_water"]:
            self.assertIn(sc, scenarios)
            sc_data = scenarios[sc]
            if sc_data["status"] == "completed":
                self.assertIn("rl_policy_result", sc_data)
                rl_eval = sc_data["rl_policy_result"]
                self.assertIn("rotation_sequence", rl_eval)
                self.assertIn("profit_bdt_per_ha", rl_eval)


if __name__ == "__main__":
    unittest.main()
