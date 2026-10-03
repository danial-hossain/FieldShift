import copy
import unittest

import numpy as np
import pandas as pd

from src.data.nasa_power import DATA_COLUMNS
from src.preprocessing.features import build_features
from src.rl.environment import (
    BASE_ACTIONS,
    OBSERVATION_FEATURES,
    EnvironmentConfig,
    FieldShiftEnvironment,
)
from src.state.field_state import FieldState


def make_state(**overrides):
    values = {
        "field_id": "field_001",
        "as_of_date": "2026-01-03",
        "latitude": 23.8103,
        "longitude": 90.4125,
        "temperature": 25.0,
        "temp_max": 30.0,
        "temp_min": 20.0,
        "rainfall": 2.0,
        "humidity": 65.0,
        "soil_moisture": 0.25,
        "nitrogen": 40.0,
        "phosphorus": 20.0,
        "potassium": 110.0,
        "ph": 6.0,
        "previous_crop": "Wheat",
        "previous_crop_family": "Poaceae",
        "previous_irrigation": "medium",
        "environment_observation_date": "2026-01-03",
        "environment_source": "NASA_POWER",
        "soil_moisture_source": "SMAP",
        "soil_source": "soil survey",
        "data_status": {
            "environment": "observed",
            "soil_moisture": "observed",
            "soil": "observed",
            "crop": "synthetic",
            "history": "observed",
        },
    }
    values.update(overrides)
    return FieldState(**values)


def weather_history():
    rows = []
    for day, temp in ((1, 22.0), (2, 24.0), (4, 28.0), (5, 31.0), (6, 27.0)):
        rows.append(
            [
                f"2026-01-{day:02d}",
                temp,
                temp + 4,
                temp - 4,
                float(day),
                60.0 + day,
                2.0,
                15.0,
            ]
        )
    return pd.DataFrame(rows, columns=DATA_COLUMNS)


class ManagementEnvironmentTests(unittest.TestCase):
    def setUp(self):
        self.state = make_state()
        self.weather = weather_history()
        self.features = build_features(
            self.state,
            environmental_history=self.weather.loc[
                pd.to_datetime(self.weather["date"]) <= self.state.as_of_date
            ],
        )
        self.env = FieldShiftEnvironment(
            self.state,
            environmental_history=self.weather,
            features=self.features,
        )

    def test_reset_returns_observation_and_metadata(self):
        observation, info = self.env.reset(seed=7)
        self.assertEqual(observation["state"]["field_id"], "field_001")
        self.assertEqual(info["seed"], 7)
        self.assertIn("provenance", observation)

    def test_observation_has_documented_stable_feature_order(self):
        observation, _ = self.env.reset()
        self.assertEqual(observation["feature_order"], OBSERVATION_FEATURES)
        self.assertIn("recent_mean_temperature", observation["features"])

    def test_observation_exposes_temporal_summaries_from_existing_feature_builder(self):
        observation, _ = self.env.reset()
        self.assertAlmostEqual(
            observation["features"]["recent_mean_temperature"], (22 + 24 + 25) / 3
        )
        self.assertEqual(
            observation["provenance"]["features"]["recent_mean_temperature"][
                "data_status"
            ],
            "derived_from_observed",
        )

    def test_missing_values_remain_explicit_in_observation(self):
        state = make_state(soil_moisture=np.nan, nitrogen=np.nan, ph=np.nan)
        env = FieldShiftEnvironment(state)
        observation, _ = env.reset(initial_state=state)
        self.assertIsNone(observation["state"]["soil_moisture"])
        self.assertIsNone(observation["features"]["soil_moisture"])
        self.assertIsNone(observation["features"]["nitrogen"])
        self.assertIsNone(observation["features"]["ph"])
        self.assertTrue(observation["missingness"]["soil_moisture"])

    def test_missing_optional_management_context_is_marked_missing_in_provenance(self):
        observation, _ = self.env.reset()
        self.assertIsNone(observation["features"]["available_water_mm"])
        self.assertIsNone(observation["features"]["irrigation_capacity_mm"])
        self.assertEqual(
            observation["provenance"]["features"]["irrigation_capacity_mm"],
            {"source": "missing", "data_status": "missing"},
        )

    def test_actions_are_explicit_management_actions(self):
        actions = self.env.get_available_actions()
        self.assertEqual([item["action"] for item in actions], list(BASE_ACTIONS))
        self.assertNotIn("crop", str(actions).lower())

    def test_no_intervention_has_deterministic_transition_and_explanation(self):
        result = self.env.step("no_intervention")
        self.assertEqual(len(result), 5)
        observation, reward, terminated, truncated, info = result
        self.assertIsNone(reward)
        self.assertFalse(terminated)
        self.assertFalse(truncated)
        self.assertIn("No management change", info["explanation"])
        self.assertEqual(observation["state"]["as_of_date"], "2026-01-04")

    def test_inspect_reassess_does_not_fabricate_measurement(self):
        _, _, _, _, info = self.env.step("inspect_reassess")
        self.assertIn("no new inspection measurement was fabricated", info["explanation"])
        self.assertNotIn("inspection_measurement", info["next_state"])

    def test_unknown_action_is_rejected_without_transition(self):
        before = self.env.get_state()
        with self.assertRaisesRegex(ValueError, "Unsupported or unavailable"):
            self.env.step("apply_fertilizer")
        self.assertEqual(self.env.get_state(), before)
        self.assertEqual(self.env.get_episode_summary()["steps"], 0)

    def test_non_string_non_mapping_action_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "action must be"):
            self.env.step(0)

    def test_irrigation_action_unavailable_without_explicit_capacity(self):
        self.assertNotIn(
            "irrigation_adjustment",
            [item["action"] for item in self.env.get_available_actions()],
        )
        with self.assertRaisesRegex(ValueError, "unavailable action"):
            self.env.step({"action": "irrigation_adjustment", "amount_mm": 5})

    def test_previous_irrigation_category_does_not_enable_irrigation_action(self):
        env = FieldShiftEnvironment(make_state(previous_irrigation="high"))
        self.assertEqual(
            [item["action"] for item in env.get_available_actions()],
            list(BASE_ACTIONS),
        )

    def test_seasonal_water_alone_does_not_imply_irrigation_capacity(self):
        env = FieldShiftEnvironment(
            self.state,
            features={**self.features, "available_water_mm": 800.0},
        )
        self.assertEqual(
            [item["action"] for item in env.get_available_actions()],
            list(BASE_ACTIONS),
        )

    def test_irrigation_proposal_enabled_by_explicit_capacity(self):
        features = {**self.features, "irrigation_capacity_mm": 12.0}
        env = FieldShiftEnvironment(
            self.state,
            environmental_history=self.weather,
            features=features,
        )
        irrigation = env.get_available_actions()[-1]
        self.assertEqual(irrigation["action"], "irrigation_adjustment")
        self.assertEqual(irrigation["max_amount_mm"], 12.0)

    def test_irrigation_action_is_a_proposal_not_an_applied_measurement(self):
        features = {**self.features, "irrigation_capacity_mm": 12.0}
        env = FieldShiftEnvironment(self.state, features=features)
        before = env.get_state()
        _, reward, terminated, _, info = env.step(
            {"action": "irrigation_adjustment", "amount_mm": 4.5}
        )
        self.assertIsNone(reward)
        self.assertTrue(terminated)
        self.assertEqual(info["action_proposal"]["amount_mm"], 4.5)
        self.assertEqual(info["action_proposal"]["status"], "proposal_not_applied")
        self.assertEqual(info["next_state"]["field_state"], before)

    def test_irrigation_amount_must_be_positive_finite_and_within_capacity(self):
        env = FieldShiftEnvironment(
            self.state,
            features={**self.features, "irrigation_capacity_mm": 5.0},
        )
        for amount in (0, -1, np.nan, 6, True):
            with self.subTest(amount=amount):
                with self.assertRaises(ValueError):
                    env.step({"action": "irrigation_adjustment", "amount_mm": amount})

    def test_historical_environment_advances_exactly_one_record(self):
        _, _, _, _, info = self.env.step("no_intervention")
        self.assertEqual(info["observation_date"], "2026-01-04")
        self.assertEqual(info["next_state"]["field_state"]["temperature"], 28.0)
        self.assertEqual(info["changed_fields"]["temperature"]["source"], "NASA_POWER")

    def test_future_observations_do_not_leak_into_reset_state_or_features(self):
        observation, _ = self.env.reset()
        self.assertEqual(observation["state"]["temperature"], 25.0)
        self.assertLess(
            observation["features"]["recent_mean_temperature"], 28.0
        )

    def test_missing_weather_stays_missing_after_advancement(self):
        weather = self.weather.copy()
        weather.loc[weather["date"] == "2026-01-04", "temperature"] = -999
        env = FieldShiftEnvironment(self.state, environmental_history=weather)
        observation, _, _, _, _ = env.step("no_intervention")
        self.assertIsNone(observation["state"]["temperature"])
        self.assertEqual(
            observation["provenance"]["field_state"]["environment_status"],
            "observed",
        )

    def test_weather_missing_marker_is_not_treated_as_zero(self):
        weather = self.weather.copy()
        weather.loc[weather["date"] == "2026-01-04", "temperature"] = -999
        env = FieldShiftEnvironment(self.state, environmental_history=weather)
        env.step("no_intervention")
        self.assertIsNone(env.get_observation()["features"]["temperature"])

    def test_absent_history_terminates_without_repeating_observation(self):
        env = FieldShiftEnvironment(self.state)
        initial_date = env.get_state()["as_of_date"]
        _, _, terminated, truncated, info = env.step("no_intervention")
        self.assertTrue(terminated)
        self.assertFalse(truncated)
        self.assertEqual(info["termination_reason"], "historical_observations_exhausted")
        self.assertEqual(env.get_state()["as_of_date"], initial_date)
        self.assertEqual(info["changed_fields"], {})

    def test_configured_max_steps_terminates_episode(self):
        env = FieldShiftEnvironment(
            self.state,
            environmental_history=self.weather,
            config=EnvironmentConfig(max_steps=1),
        )
        _, _, terminated, truncated, info = env.step("no_intervention")
        self.assertTrue(terminated)
        self.assertFalse(truncated)
        self.assertEqual(info["termination_reason"], "configured_step_limit_reached")

    def test_external_step_limit_truncates_continuing_episode(self):
        env = FieldShiftEnvironment(
            self.state,
            environmental_history=self.weather,
            config=EnvironmentConfig(max_steps=4),
            step_limit=1,
        )
        _, _, terminated, truncated, info = env.step("no_intervention")
        self.assertFalse(terminated)
        self.assertTrue(truncated)
        self.assertEqual(info["termination_reason"], "external_step_limit_reached")

    def test_step_after_termination_requires_reset(self):
        env = FieldShiftEnvironment(self.state, config=EnvironmentConfig(max_steps=1))
        env.step("no_intervention")
        with self.assertRaisesRegex(RuntimeError, "call reset"):
            env.step("inspect_reassess")

    def test_reset_with_new_state_uses_copied_state(self):
        replacement = make_state(as_of_date="2026-01-04", temperature=27.0)
        observation, _ = self.env.reset(initial_state=replacement, seed=4)
        self.assertEqual(observation["state"]["temperature"], 27.0)
        self.assertEqual(observation["state"]["as_of_date"], "2026-01-04")
        self.assertEqual(replacement.temperature, 27.0)

    def test_original_state_features_and_environment_history_are_not_mutated(self):
        state_before = copy.deepcopy(self.state.to_dict())
        weather_before = self.weather.copy(deep=True)
        feature_values_before = {
            key: value for key, value in self.features.items() if key != "provenance"
        }
        self.env.step("no_intervention")
        self.assertEqual(self.state.to_dict(), state_before)
        for key, value in feature_values_before.items():
            actual = self.features[key]
            if isinstance(value, (float, np.floating)) and np.isnan(value):
                self.assertTrue(np.isnan(actual))
            else:
                self.assertEqual(actual, value)
        pd.testing.assert_frame_equal(self.weather, weather_before)

    def test_reset_with_same_seed_is_reproducible(self):
        first, _ = self.env.reset(seed=31)
        first_step = self.env.step("no_intervention")
        second, _ = self.env.reset(seed=31)
        second_step = self.env.step("no_intervention")
        self.assertEqual(first["state"], second["state"])
        self.assertEqual(first_step[0]["state"], second_step[0]["state"])
        self.assertEqual(first_step[4]["changed_fields"], second_step[4]["changed_fields"])

    def test_environment_has_no_random_transition_even_for_different_seeds(self):
        self.env.reset(seed=1)
        first = self.env.step("no_intervention")[0]
        self.env.reset(seed=99)
        second = self.env.step("no_intervention")[0]
        self.assertEqual(first["state"], second["state"])

    def test_reward_is_explicitly_unavailable_not_a_synthetic_profit_value(self):
        _, info = self.env.reset()
        self.assertEqual(info["reward_status"], "unavailable_no_validated_outcome_model")
        _, reward, _, _, transition_info = self.env.step("inspect_reassess")
        self.assertIsNone(reward)
        self.assertEqual(
            transition_info["reward_status"],
            "unavailable_no_validated_outcome_model",
        )

    def test_action_provenance_distinguishes_supplied_irrigation_context(self):
        features = {
            **self.features,
            "irrigation_capacity_mm": 8.0,
            "irrigation_context_source": "farm_plan",
            "irrigation_context_status": "observed",
        }
        env = FieldShiftEnvironment(self.state, features=features)
        observation, _ = env.reset()
        provenance = observation["provenance"]["features"][
            "irrigation_capacity_mm"
        ]
        self.assertEqual(provenance["source"], "farm_plan")
        self.assertEqual(provenance["data_status"], "observed")

    def test_episode_summary_lists_actions_without_fake_reward_total(self):
        self.env.step("inspect_reassess")
        summary = self.env.get_episode_summary()
        self.assertEqual(summary["steps"], 1)
        self.assertEqual(summary["actions"][0]["action"], {"action": "inspect_reassess"})
        self.assertIsNone(summary["total_reward"])
        self.assertEqual(
            summary["reward_status"], "unavailable_no_validated_outcome_model"
        )

    def test_transition_exposes_previous_next_and_changed_context(self):
        _, _, _, _, info = self.env.step("no_intervention")
        self.assertIn("previous_state", info)
        self.assertIn("next_state", info)
        self.assertIn("changed_fields", info)
        self.assertEqual(
            info["previous_state"]["as_of_date"], "2026-01-03"
        )
        self.assertEqual(info["next_state"]["as_of_date"], "2026-01-04")

    def test_nasa_observation_provenance_is_preserved(self):
        observation, _ = self.env.reset()
        provenance = observation["provenance"]["field_state"]
        self.assertEqual(provenance["environment_source"], "NASA_POWER")
        self.assertEqual(provenance["environment_status"], "observed")

    def test_invalid_initial_state_is_rejected(self):
        with self.assertRaisesRegex(TypeError, "FieldState interface"):
            FieldShiftEnvironment(object())

    def test_bad_environment_history_schema_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "missing columns"):
            FieldShiftEnvironment(self.state, environmental_history=pd.DataFrame({"date": []}))

    def test_environment_config_validates_step_limit(self):
        with self.assertRaisesRegex(ValueError, "positive integer"):
            EnvironmentConfig(max_steps=0)

    def test_no_milp_optimizer_is_imported_or_run(self):
        self.env.step("no_intervention")
        self.assertNotIn("rotation", self.env.get_episode_summary())
        self.assertNotIn("selected_crop", self.env.get_episode_summary())


if __name__ == "__main__":
    unittest.main()
