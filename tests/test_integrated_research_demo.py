import json
import tempfile
import unittest
from pathlib import Path

from src.experiments.integrated_research_demo import _load_demo_inputs, run_integration_demo


class IntegratedResearchDemoTests(unittest.TestCase):
    def test_demo_runs_end_to_end_and_saves_summary(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = Path(temp_dir) / "demo_summary.json"
            summary = run_integration_demo(output_path=output_path)
            self.assertEqual(summary["research_boundary"], "synthetic_demo_only")
            self.assertTrue(output_path.exists())
            self.assertEqual(summary["ml"]["data_boundary"], "synthetic_demo_only")
            self.assertGreater(summary["ml"]["prediction_t_ha"], 0.0)
            self.assertEqual(summary["planning"]["milp_status"]["status"], "optimal")
            self.assertEqual(summary["rl"]["proposal_action"], "no_intervention")
            self.assertEqual(summary["rl"]["safety_status"], "safe_noop")
            self.assertEqual(summary["dashboard"]["status"], "available")
            payload = json.loads(output_path.read_text(encoding="utf-8"))
            self.assertEqual(payload["ml"]["model_name"], summary["ml"]["model_name"])

    def test_demo_reuses_saved_model_and_is_deterministic(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            first = run_integration_demo(output_path=Path(temp_dir) / "first.json")
            second = run_integration_demo(output_path=Path(temp_dir) / "second.json")
            self.assertEqual(first["ml"]["model_path"], second["ml"]["model_path"])
            self.assertAlmostEqual(
                first["ml"]["prediction_t_ha"],
                second["ml"]["prediction_t_ha"],
                places=12,
            )
            self.assertEqual(first["rl"]["validated_action"], {"action": "no_intervention"})

    def test_demo_rejects_missing_nasa_input_without_mutating_state(self):
        missing = Path("C:/does/not/exist/nasa_power_demo.csv")
        with self.assertRaises(FileNotFoundError):
            _load_demo_inputs(missing)


if __name__ == "__main__":
    unittest.main()
