import unittest

import pandas as pd

from src.data.anomaly_detection import detect_anomalies
from src.explainability.explanations import (
    explain_ml_prediction,
    explain_milp_plan,
    explain_rl_action,
)
from src.experiments.synthetic_ml_demo import (
    predict_synthetic_yield,
)
from src.scenarios.counterfactual import run_counterfactual_analysis
from src.state.field_state import build_field_state


class AiEnhancementTests(unittest.TestCase):
    def _demo_field_state(self):
        from src.data.crops import load_crop_knowledge
        from src.data.field_history import load_field_history
        from src.data.smap import load_smap_data
        from src.data.soil import load_soil_data

        power = pd.read_csv(
            "data/nasa_power/nasa_power_lat23.8103_lon90.4125_20260831_20260929.csv"
        )
        return build_field_state(
            "field_demo",
            23.8103,
            90.4125,
            "2026-09-29",
            power,
            smap_data=load_smap_data(23.8103, 90.4125, "2026-09-25", "2026-09-29"),
            soil_data=load_soil_data(),
            field_history_data=load_field_history(),
            crop_knowledge=load_crop_knowledge(),
        )

    def test_ml_explanation_is_model_attribution_not_causal(self):
        state = self._demo_field_state()
        prediction = predict_synthetic_yield(state)
        explanation = explain_ml_prediction(state, prediction=prediction)
        self.assertIn("model_attribution", explanation["explanation_type"])
        self.assertIn("not a causal agronomic explanation", explanation["causal_claim"])
        self.assertGreater(len(explanation["top_contributors"]), 0)
        self.assertGreater(explanation["uncertainty_t_ha"], 0.0)

    def test_milp_explanation_describes_rotation_and_objectives(self):
        plan = {
            "selected_crop_by_period": {"Y1_S1": "Maize", "Y1_S2": "Wheat"},
            "objective_value": 10.5,
            "profit_component": 8.0,
            "water_component": 1.5,
            "soil_component": 1.0,
            "constraint_summary": {"rotation_diversity": "applied", "water_limit": "applied"},
        }
        explanation = explain_milp_plan(plan)
        self.assertEqual(explanation["selected_rotation"]["Y1_S1"], "Maize")
        self.assertIn("MILP explanations reflect optimizer objective", explanation["causal_claim"])

    def test_rl_explanation_labels_synthetic_policy(self):
        state = {"water_stress": 0.8, "heat_stress": 0.4, "soil_moisture": 0.18}
        explanation = explain_rl_action(state, 1)
        self.assertEqual(explanation["selected_action"], "light_irrigation")
        self.assertIn("simulation_only", str(explanation["provenance"]))
        self.assertIn("not_field_validated", str(explanation["provenance"]))

    def test_counterfactual_analysis_keeps_baseline_unchanged_and_reports_provenance(self):
        state = self._demo_field_state()
        baseline = state.to_dict()
        result = run_counterfactual_analysis(state, variable="rainfall", delta=50.0)
        self.assertTrue(result["baseline_state_unchanged"])
        self.assertEqual(state.to_dict(), baseline)
        self.assertTrue(result["provenance"]["counterfactual_output"])
        self.assertIn("counterfactual_synthetic_scenario", result["result_kind"])
        self.assertNotEqual(
            result["baseline_prediction_t_ha"],
            result["counterfactual_prediction_t_ha"],
        )

    def test_counterfactual_invalid_delta_is_rejected(self):
        state = self._demo_field_state()
        with self.assertRaisesRegex(ValueError, "Counterfactual update for 'rainfall' is invalid"):
            run_counterfactual_analysis(state, variable="rainfall", delta=-1000.0)

    def test_anomaly_detection_flags_values_without_correction(self):
        state = self._demo_field_state().to_dict()
        state["temperature"] = 999.0
        report = detect_anomalies(state)
        self.assertEqual(report["status"], "warning")
        self.assertTrue(report["anomalies"])
        self.assertFalse(report["provenance"]["autocorrection_applied"])


if __name__ == "__main__":
    unittest.main()
