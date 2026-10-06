import tempfile
import unittest
from pathlib import Path

import numpy as np
import pandas as pd

from src.experiments.scenario_irrigation_rl import (
    ACTION_MM,
    EPISODE_DAYS,
    EVALUATION_STARTS,
    SCENARIOS,
    TRAIN_STARTS,
    SyntheticIrrigationEnvironment,
    load_scenario_policy,
    load_weather,
    train_scenario_policy,
)


def weather_fixture():
    dates = pd.date_range("2025-01-01", periods=365, freq="D")
    day = np.arange(len(dates))
    return pd.DataFrame(
        {
            "date": dates,
            "temperature": 25 + 8 * np.sin(day * 2 * np.pi / 365),
            "rainfall": np.where(day % 9 == 0, 6.0, 0.5),
        }
    )


class ScenarioIrrigationRLTests(unittest.TestCase):
    def test_simulator_actions_and_scenarios_are_bounded_and_distinct(self):
        weather = weather_fixture()
        results = {}
        for scenario in SCENARIOS:
            environment = SyntheticIrrigationEnvironment(
                weather, scenario=scenario, start_index=0
            )
            state = environment.reset()
            self.assertEqual(len(state), 5)
            for _ in range(EPISODE_DAYS):
                state, _, done, info = environment.step(2)
                self.assertLessEqual(info["soil_storage_mm"], 120.0)
                self.assertGreaterEqual(info["soil_storage_mm"], 0)
                if done:
                    break
            summary = environment.summary()
            limit = 45.0 if scenario == "low_water" else 180.0
            self.assertLessEqual(summary["irrigation_applied_mm_simulated"], limit)
            results[scenario] = summary
        self.assertNotEqual(
            results["normal"]["mean_heat_stress_proxy"],
            results["heat"]["mean_heat_stress_proxy"],
        )
        self.assertLessEqual(
            results["drought"]["irrigation_applied_mm_simulated"],
            180.0,
        )

    def test_weather_loader_requires_complete_consecutive_records(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "weather.csv"
            weather_fixture().to_csv(path, index=False)
            weather, provenance = load_weather(path)
            self.assertEqual(len(weather), 365)
            self.assertEqual(provenance["rows"], "365")
            weather_fixture().drop(index=5).to_csv(path, index=False)
            with self.assertRaisesRegex(ValueError, "consecutive daily"):
                load_weather(path)

    def test_trains_q_learning_and_writes_four_scenario_held_out_report(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            weather_path = root / "weather.csv"
            weather_fixture().to_csv(weather_path, index=False)
            report = train_scenario_policy(
                weather_path=weather_path,
                model_path=root / "policy.json",
                report_path=root / "report.json",
                episodes_per_scenario=2,
                seed=17,
            )
            policy = load_scenario_policy(root / "policy.json")

        self.assertEqual(report["algorithm"], "tabular_q_learning")
        self.assertEqual(report["training_episodes"], 8)
        self.assertEqual(report["q_table_state_count"], len(policy["q_table"]))
        self.assertEqual(set(report["scenario_evaluation"]), set(SCENARIOS))
        self.assertEqual(
            report["split_protocol"]["training_start_indices"],
            list(TRAIN_STARTS),
        )
        self.assertEqual(
            report["split_protocol"]["held_out_start_indices"],
            list(EVALUATION_STARTS),
        )
        self.assertTrue(all(len(rows) == 3 for rows in report["evaluation_detail"].values()))
        self.assertEqual(policy["action_irrigation_mm"], list(ACTION_MM))
        self.assertTrue(policy["not_for_farm_recommendations"])

    def test_invalid_actions_are_rejected(self):
        environment = SyntheticIrrigationEnvironment(
            weather_fixture(), scenario="normal", start_index=0
        )
        with self.assertRaisesRegex(ValueError, "outside the supported"):
            environment.step(9)


if __name__ == "__main__":
    unittest.main()
