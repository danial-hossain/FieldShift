import unittest

import pandas as pd

from src.data.nasa_power import DATA_COLUMNS
from src.rl.environment import EnvironmentConfig, FieldShiftEnvironment
from src.rl.readiness import assess_learning_readiness
from src.rl.reward import validate_reward
from src.rl.training import run_training
from src.state.field_state import FieldState


class ReinforcementLearningEvidenceBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.state = FieldState(
            field_id="pseudonymous-field",
            as_of_date="2026-01-01",
            latitude=23.81,
            longitude=90.41,
        )
        self.history = pd.DataFrame(
            [
                ["2026-01-02", 20.0, 27.0, 15.0, 1.0, 75.0, 1.0, 10.0],
                ["2026-01-03", 21.0, 28.0, 16.0, 0.0, 70.0, 1.2, 11.0],
            ],
            columns=DATA_COLUMNS,
        )

    def test_proposed_irrigation_is_not_applied_and_has_no_reward(self):
        environment = FieldShiftEnvironment(
            self.state,
            environmental_history=self.history,
            features={"irrigation_capacity_mm": 15.0},
        )
        _, info = environment.reset(seed=1)
        self.assertIn("irrigation_adjustment", {
            action["action"] for action in info["available_actions"]
        })

        _, reward, terminated, _, transition = environment.step(
            {"action": "irrigation_adjustment", "amount_mm": 5.0}
        )
        self.assertIsNone(reward)
        self.assertEqual(
            transition["action_proposal"]["status"],
            "proposal_not_applied",
        )
        self.assertFalse(terminated)
        self.assertEqual(
            environment.get_episode_summary()["total_reward"],
            None,
        )

    def test_no_outcome_reward_blocks_training_instead_of_zero_filling(self):
        environment = FieldShiftEnvironment(
            self.state,
            environmental_history=self.history,
            config=EnvironmentConfig(max_steps=2),
        )
        readiness = assess_learning_readiness(environment)
        self.assertEqual(
            readiness.status,
            "blocked_missing_outcome_evidence",
        )
        self.assertTrue(readiness.reasons)
        result = run_training(environment)
        self.assertEqual(result["status"], "unsupported_reward")
        self.assertEqual(result["episodes_completed"], 0)
        self.assertIsNone(result["history"][0]["total_reward"])
        self.assertFalse(result["history"][0]["reward_available"])

    def test_invalid_reward_and_unavailable_transition_remain_blocked(self):
        invalid = validate_reward(float("nan"), source="environment")
        self.assertEqual(invalid.status, "invalid")
        readiness = assess_learning_readiness(
            FieldShiftEnvironment(self.state),
            invalid,
        )
        self.assertEqual(readiness.status, "blocked_invalid_configuration")

        incomplete = FieldShiftEnvironment(
            self.state,
            environmental_history=None,
        )
        report = run_training(incomplete)
        self.assertEqual(report["status"], "unsupported_reward")
        self.assertEqual(report["history"][0]["steps"], 1)
        self.assertFalse(
            getattr(incomplete, "supports_action_conditioned_transitions", False)
        )
