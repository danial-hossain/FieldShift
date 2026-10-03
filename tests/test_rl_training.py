import unittest

import numpy as np
import pandas as pd

from src.rl.agent import DeterministicBaselinePolicy
from src.rl.environment import EnvironmentConfig, FieldShiftEnvironment
from src.rl.reward import validate_reward
from src.rl.training import TRAINING_HISTORY_FIELDS, run_training
from src.data.nasa_power import DATA_COLUMNS
from src.state.field_state import FieldState


def make_state():
    return FieldState(
        field_id="field_001",
        as_of_date="2026-01-01",
        latitude=23.8103,
        longitude=90.4125,
    )


def weather_history():
    return pd.DataFrame(
        [
            ["2026-01-01", 25, 30, 20, 1, 60, 2, 15],
            ["2026-01-02", 26, 31, 21, 2, 61, 2, 16],
            ["2026-01-03", 27, 32, 22, 3, 62, 2, 17],
        ],
        columns=DATA_COLUMNS,
    )


class StubEnvironment:
    def __init__(self, rewards, terminated=True, truncated=False, error=None):
        self.rewards = list(rewards)
        self.terminated = terminated
        self.truncated = truncated
        self.error = error
        self.index = 0

    def reset(self, seed=None):
        self.index = 0
        return {
            "state": {"seed": seed},
            "features": {},
            "provenance": {"environment": "test"},
            "provenance": {"environment": "test"},
        }, {
            "available_actions": [{"action": "no_intervention"}],
            "provenance": {"environment": "test"},
        }

    def step(self, action):
        if self.error is not None:
            raise self.error
        reward = self.rewards[self.index]
        self.index += 1
        ended = self.index >= len(self.rewards)
        info = {
            "termination_reason": "stub_done" if ended else None,
            "available_actions": [{"action": "no_intervention"}],
            "provenance": {"environment": "test"},
        }
        return (
            {
                "state": {"step": self.index},
                "features": {},
                "provenance": {"environment": "test"},
            },
            reward,
            bool(self.terminated and ended),
            bool(self.truncated and ended),
            info,
        )


class FixedPolicy:
    def __init__(self, action="no_intervention"):
        self.action = action
        self.seeds = []

    def select_action(self, observation, available_actions, seed=None):
        self.seeds.append(seed)
        return self.action


class MalformedResetEnvironment:
    def reset(self, seed=None):
        return {"state": {}}, {
            "available_actions": [{"action": "no_intervention"}]
        }

    def step(self, action):
        raise AssertionError("step should not be reached")


class MalformedStepEnvironment(StubEnvironment):
    def step(self, action):
        return (
            {"state": {}, "provenance": {}},
            1.0,
            True,
            False,
            {},
        )


class MalformedActionsEnvironment(StubEnvironment):
    def reset(self, seed=None):
        observation, info = super().reset(seed)
        info["available_actions"] = ["no_intervention"]
        return observation, info


class TrainingTests(unittest.TestCase):
    def test_unavailable_environment_reward_stops_training_without_zero_fill(self):
        result = run_training(StubEnvironment([None]))
        episode = result["history"][0]
        self.assertEqual(result["status"], "unsupported_reward")
        self.assertEqual(episode["status"], "unsupported_reward")
        self.assertFalse(episode["reward_available"])
        self.assertIsNone(episode["total_reward"])
        self.assertEqual(episode["reward_source"], "unavailable")
        self.assertEqual(episode["steps"], 1)

    def test_environment_reward_accepts_finite_numeric_value(self):
        result = run_training(StubEnvironment([1.5, -0.5]))
        episode = result["history"][0]
        self.assertEqual(result["status"], "completed")
        self.assertEqual(episode["total_reward"], 1.0)
        self.assertEqual(episode["reward_source"], "environment")
        self.assertTrue(episode["reward_available"])

    def test_explicit_reward_provider_supplies_experimental_reward(self):
        calls = []

        def provider(observation, action, next_observation, info):
            calls.append((observation, action, next_observation, info))
            return 2.25

        result = run_training(StubEnvironment([None]), reward_provider=provider)
        episode = result["history"][0]
        self.assertEqual(result["status"], "completed")
        self.assertEqual(episode["total_reward"], 2.25)
        self.assertEqual(
            episode["reward_source"], "experimental_user_supplied"
        )
        self.assertEqual(
            result["reward_provider_status"], "experimental_user_supplied"
        )
        self.assertEqual(len(calls), 1)
        self.assertEqual(
            episode["reward_validation_status"], "experimental_user_supplied"
        )
        self.assertEqual(
            episode["reward_provenance"]["data_status"], "experimental"
        )

    def test_reward_provider_can_return_typed_assessment(self):
        assessment = validate_reward(
            0.75,
            source="user_supplied",
            provenance={"source": "test-provider", "data_status": "synthetic"},
            units="prototype points",
        )
        result = run_training(
            StubEnvironment([None]),
            reward_provider=lambda *args: assessment,
        )
        episode = result["history"][0]
        self.assertEqual(result["status"], "completed")
        self.assertEqual(episode["total_reward"], 0.75)
        self.assertEqual(episode["reward_units"], "prototype points")
        self.assertEqual(
            episode["reward_provenance"],
            {"source": "test-provider", "data_status": "synthetic"},
        )
        self.assertIn("not agronomically validated", episode["reward_reason"])

    def test_reward_provider_is_not_used_when_environment_supplies_reward(self):
        calls = []
        result = run_training(
            StubEnvironment([3.0]),
            reward_provider=lambda *args: calls.append(args) or 9.0,
        )
        self.assertEqual(result["history"][0]["total_reward"], 3.0)
        self.assertEqual(result["history"][0]["reward_source"], "environment")
        self.assertEqual(calls, [])

    def test_provider_none_still_leaves_reward_unavailable(self):
        result = run_training(
            StubEnvironment([None]),
            reward_provider=lambda *args: None,
        )
        self.assertEqual(result["status"], "unsupported_reward")
        self.assertIsNone(result["history"][0]["total_reward"])

    def test_non_numeric_reward_is_rejected(self):
        result = run_training(StubEnvironment(["reward"]))
        episode = result["history"][0]
        self.assertEqual(result["status"], "invalid_reward")
        self.assertIsNone(episode["total_reward"])
        self.assertIn("finite numeric", episode["errors"][0]["message"])

    def test_boolean_reward_is_rejected_as_non_numeric(self):
        result = run_training(StubEnvironment([True]))
        self.assertEqual(result["status"], "invalid_reward")
        self.assertIn("non_numeric", result["history"][0]["errors"][0]["message"])

    def test_nan_reward_is_rejected(self):
        result = run_training(StubEnvironment([np.nan]))
        self.assertEqual(result["status"], "invalid_reward")
        self.assertIn("non_finite", result["history"][0]["errors"][0]["message"])

    def test_infinite_reward_is_rejected(self):
        result = run_training(StubEnvironment([np.inf]))
        self.assertEqual(result["status"], "invalid_reward")
        self.assertIsNone(result["history"][0]["total_reward"])

    def test_provider_invalid_reward_is_rejected_explicitly(self):
        result = run_training(
            StubEnvironment([None]),
            reward_provider=lambda *args: float("nan"),
        )
        episode = result["history"][0]
        self.assertEqual(result["status"], "invalid_reward")
        self.assertEqual(episode["reward_source"], "experimental_user_supplied")
        self.assertIsNone(episode["total_reward"])

    def test_termination_is_not_conflated_with_truncation(self):
        terminated = run_training(StubEnvironment([0.5], terminated=True))
        truncated = run_training(
            StubEnvironment([0.5], terminated=False, truncated=True)
        )
        self.assertTrue(terminated["history"][0]["terminated"])
        self.assertFalse(terminated["history"][0]["truncated"])
        self.assertFalse(truncated["history"][0]["terminated"])
        self.assertTrue(truncated["history"][0]["truncated"])

    def test_training_episode_seed_is_deterministic_and_incremented(self):
        policy = FixedPolicy()
        result = run_training(
            StubEnvironment([0.0]),
            policy=policy,
            episodes=3,
            seed=20,
        )
        self.assertEqual([item["seed"] for item in result["history"]], [20, 21, 22])
        self.assertEqual(policy.seeds, [20, 21, 22])

    def test_episode_limit_and_empty_history_report_unavailable_reward(self):
        environment = FieldShiftEnvironment(
            make_state(),
            config=EnvironmentConfig(max_steps=2),
        )
        result = run_training(environment)
        episode = result["history"][0]
        self.assertEqual(result["status"], "unsupported_reward")
        self.assertEqual(episode["steps"], 1)
        self.assertTrue(episode["terminated"])
        self.assertEqual(
            episode["termination_reason"], "historical_observations_exhausted"
        )

    def test_external_environment_truncation_is_recorded_separately(self):
        environment = FieldShiftEnvironment(
            make_state(),
            environmental_history=weather_history(),
            config=EnvironmentConfig(max_steps=4),
            step_limit=1,
        )
        result = run_training(
            environment,
            reward_provider=lambda *args: 0.25,
        )
        episode = result["history"][0]
        self.assertEqual(result["status"], "completed")
        self.assertFalse(episode["terminated"])
        self.assertTrue(episode["truncated"])
        self.assertEqual(
            episode["termination_reason"], "external_step_limit_reached"
        )

    def test_malformed_reset_result_is_structured_environment_error(self):
        result = run_training(MalformedResetEnvironment())
        episode = result["history"][0]
        self.assertEqual(result["status"], "environment_error")
        self.assertEqual(episode["status"], "environment_error")
        self.assertEqual(episode["errors"][0]["type"], "ValueError")

    def test_malformed_step_result_is_structured_environment_error(self):
        result = run_training(
            MalformedStepEnvironment([1.0]),
            reward_provider=lambda *args: 1.0,
        )
        self.assertEqual(result["status"], "environment_error")
        self.assertIn("step observation", result["history"][0]["errors"][0]["message"])

    def test_malformed_observation_or_action_structure_is_rejected(self):
        malformed_observation = run_training(MalformedResetEnvironment())
        self.assertEqual(malformed_observation["status"], "environment_error")
        self.assertIn(
            "feature mapping",
            malformed_observation["history"][0]["errors"][0]["message"],
        )
        malformed_actions = run_training(MalformedActionsEnvironment([1.0]))
        self.assertEqual(malformed_actions["status"], "environment_error")
        self.assertIn(
            "available_actions",
            malformed_actions["history"][0]["errors"][0]["message"],
        )

    def test_environment_exceptions_are_reported_not_hidden(self):
        result = run_training(StubEnvironment([], error=RuntimeError("step failed")))
        episode = result["history"][0]
        self.assertEqual(result["status"], "environment_error")
        self.assertEqual(episode["errors"][0]["message"], "step failed")

    def test_invalid_policy_action_is_reported_before_environment_step(self):
        result = run_training(StubEnvironment([1.0]), policy=FixedPolicy("bad"))
        self.assertEqual(result["status"], "invalid_action")
        self.assertEqual(result["history"][0]["steps"], 0)

    def test_baseline_policy_prefers_no_intervention(self):
        policy = DeterministicBaselinePolicy()
        action = policy.select_action(
            {"features": {"temperature": 31.0}},
            [{"action": "inspect_reassess"}, {"action": "no_intervention"}],
            seed=9,
        )
        self.assertEqual(action, "no_intervention")

    def test_baseline_policy_uses_first_action_when_default_unavailable(self):
        policy = DeterministicBaselinePolicy()
        actions = [{"action": "inspect_reassess"}, {"action": "other"}]
        self.assertEqual(
            policy.select_action({}, actions),
            actions[0],
        )

    def test_baseline_policy_rejects_empty_action_list(self):
        with self.assertRaisesRegex(ValueError, "No available actions"):
            DeterministicBaselinePolicy().select_action({}, [])

    def test_history_schema_includes_rewards_terminal_flags_and_provenance(self):
        result = run_training(
            StubEnvironment([1.0]),
            reward_provider=lambda *args: 1.0,
        )
        episode = result["history"][0]
        self.assertEqual(tuple(episode), TRAINING_HISTORY_FIELDS)
        for key in (
            "steps",
            "termination_reason",
            "reward_available",
            "reward_validation_status",
            "reward_units",
            "reward_provenance",
            "reward_reason",
            "terminated",
            "truncated",
            "provenance",
            "errors",
        ):
            self.assertIn(key, episode)
        self.assertEqual(episode["provenance"], {"environment": "test"})

    def test_policy_error_is_reported_with_episode_context(self):
        class BrokenPolicy:
            def select_action(self, observation, available_actions, seed=None):
                raise RuntimeError("policy failed")

        result = run_training(StubEnvironment([1.0]), policy=BrokenPolicy())
        self.assertEqual(result["status"], "policy_error")
        self.assertEqual(result["history"][0]["errors"][0]["message"], "policy failed")

    def test_reward_provider_error_is_reported(self):
        def broken_provider(*args):
            raise RuntimeError("provider failed")

        result = run_training(
            StubEnvironment([None]),
            reward_provider=broken_provider,
        )
        self.assertEqual(result["status"], "reward_provider_error")
        self.assertEqual(result["history"][0]["errors"][0]["message"], "provider failed")

    def test_invalid_training_arguments_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "episodes"):
            run_training(StubEnvironment([1]), episodes=0)
        with self.assertRaisesRegex(ValueError, "seed"):
            run_training(StubEnvironment([1]), seed=True)
        with self.assertRaisesRegex(TypeError, "reward_provider"):
            run_training(StubEnvironment([1]), reward_provider=1)

    def test_no_learning_progress_or_performance_claim_is_reported(self):
        result = run_training(StubEnvironment([1.0]))
        self.assertNotIn("learning_curve", result)
        self.assertNotIn("policy_improvement", result)
        self.assertNotIn("agronomic_success", result)


if __name__ == "__main__":
    unittest.main()
