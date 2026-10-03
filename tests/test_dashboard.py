import tempfile
import unittest
from pathlib import Path

from src.dashboard import build_dashboard_data, render_dashboard


class DashboardTests(unittest.TestCase):
    def test_dashboard_transforms_bundled_sources_with_evidence_labels(self):
        dashboard = build_dashboard_data()
        self.assertTrue(dashboard["dashboard"]["read_only"])
        self.assertFalse(dashboard["dashboard"]["network_requests"])
        self.assertEqual(dashboard["environment"]["status"], "available")
        self.assertIn(
            "not instant live data",
            dashboard["environment"]["data"]["label"],
        )
        self.assertEqual(dashboard["farm_data_quality"]["status"], "empty")
        self.assertEqual(
            dashboard["rl_readiness"]["status"],
            "blocked_missing_outcome_evidence",
        )
        self.assertEqual(dashboard["rotation_plan"]["status"], "optimal")
        self.assertEqual(dashboard["strategy_profiles"]["status"], "available")
        self.assertEqual(dashboard["stress_tests"]["status"], "available")
        plan = dashboard["rotation_plan"]["data"]["result"]
        self.assertEqual(plan["solver_status"], "Optimal")
        self.assertEqual(plan["monetary_component_status"], "illustrative/demo")
        self.assertTrue(
            plan["provenance"]["crop_knowledge"]["economic_values_are_illustrative"]
        )
        self.assertIn("unknown", plan["compatibility_status_by_crop"].values())
        self.assertEqual(
            dashboard["features"]["data"]["seasonal_water_availability"]["status"],
            "unknown",
        )
        self.assertEqual(
            dashboard["field_state"]["data"]["soil_source"],
            dashboard["field_state"]["data"]["state"]["soil_source"],
        )
        profiles = dashboard["strategy_profiles"]["data"]["result"]["profiles"]
        for profile in profiles.values():
            self.assertIn("solver_status", profile)
            self.assertIn("objective_value", profile)
            self.assertIn("effective_weights", profile)
            self.assertEqual(
                profile["monetary_component_status"],
                "illustrative/demo",
            )
            objective_from_components = sum(
                profile["effective_weights"][component]
                * profile["normalized_components"][component]
                for component in ("profit", "water", "soil")
            )
            self.assertAlmostEqual(
                profile["objective_value"],
                objective_from_components,
            )
        scenarios = dashboard["stress_tests"]["data"]["result"]["scenarios"]
        self.assertEqual(scenarios["drought"]["status"], "completed")
        self.assertIn("scenario_solver_status", scenarios["drought"])
        self.assertEqual(scenarios["drought"]["provenance"]["changed_fields"]["soil_moisture"]["data_status"], "synthetic")
        self.assertEqual(scenarios["low_water"]["status"], "not_applicable")
        self.assertIn("not substituted", scenarios["low_water"]["reason"])
        page = render_dashboard(dashboard)
        self.assertIn("hypothetical what-if scenarios, not forecasts", page)
        self.assertIn("provenance_unverified", page)
        self.assertIn("not instant live data", page)
        self.assertIn("illustrative constrained long-term plan", page)

    def test_dashboard_degrades_gracefully_when_nasa_file_is_unavailable(self):
        dashboard = build_dashboard_data(nasa_csv="C:\\missing\\power.csv")
        self.assertEqual(dashboard["environment"]["status"], "unavailable")
        self.assertIn(
            "NASA POWER CSV was not found",
            dashboard["environment"]["reason"],
        )
        self.assertEqual(
            dashboard["rl_readiness"]["status"],
            "blocked_missing_outcome_evidence",
        )
        self.assertEqual(dashboard["farm_data_quality"]["status"], "empty")

    def test_dashboard_reports_empty_and_malformed_nasa_files_as_unavailable(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            empty = root / "empty.csv"
            malformed = root / "malformed.csv"
            empty.write_bytes(b"")
            malformed.write_text("unexpected_column\nvalue\n", encoding="utf-8")

            for path in (empty, malformed):
                with self.subTest(path=path.name):
                    dashboard = build_dashboard_data(nasa_csv=str(path))
                    self.assertEqual(dashboard["environment"]["status"], "unavailable")
                    self.assertEqual(
                        dashboard["rl_readiness"]["status"],
                        "blocked_missing_outcome_evidence",
                    )

    def test_dashboard_html_escapes_caller_supplied_content(self):
        page = render_dashboard(
            {"caller": {"label": "<script>alert('x')</script>"}}
        )
        self.assertNotIn("<script>", page)
        self.assertIn("&lt;script&gt;", page)


if __name__ == "__main__":
    unittest.main()
