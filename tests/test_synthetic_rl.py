import json
import tempfile
import unittest
from pathlib import Path

from src.integration.milp_rl import (
    run_synthetic_policy_step,
    select_safe_synthetic_action,
)
from src.rl.synthetic_environment import (
    ACTION_NAMES,
    POLICY_LABEL,
    SIMULATION_SCENARIOS,
    STATE_FIELDS,
    SyntheticFieldState,
    SyntheticMultiSeasonEnvironment,
)
from src.rl.synthetic_q_learning import (
    evaluate_synthetic_q_policy,
    load_synthetic_q_policy,
    train_synthetic_q_policy,
)
from src.rl.environment import FieldShiftEnvironment
from src.state.field_state import FieldState


def solved_plan():
    return {
        "status": "optimal",
        "solver_status": "Optimal",
        "planning_periods": ["Y1", "Y2", "Y3"],
        "selected_crop_by_period": {
            "Y1": "Maize",
            "Y2": "Wheat",
            "Y3": "Lentil",
        },
        "constraint_summary": {"one_crop_per_period": 3},
    }


class FixedPolicy:
    def __init__(self, action_id):
        self.action_id = action_id
        self.calls = 0

    def select_action(self, observation):
        self.calls += 1
        return self.action_id


class SyntheticRLTests(unittest.TestCase):
    def test_state_schema_requires_exact_fields_and_valid_ranges(self):
        values = {
            "temperature": 25,
            "rainfall": 2,
            "soil_moisture": 0.4,
            "available_water": 25,
            "crop": "Maize",
            "crop_stage": 0.5,
            "heat_stress": 0.1,
            "water_stress": 0.2,
        }
        self.assertEqual(set(SyntheticFieldState.from_mapping(values).to_dict()), set(STATE_FIELDS))
        with self.assertRaisesRegex(ValueError, "missing fields"):
            SyntheticFieldState.from_mapping({key: value for key, value in values.items() if key != "crop"})
        with self.assertRaisesRegex(ValueError, "unknown fields"):
            SyntheticFieldState.from_mapping({**values, "yield": 10})
        for name, value in (("soil_moisture", 1.1), ("heat_stress", -0.1), ("temperature", True)):
            with self.subTest(name=name):
                with self.assertRaises(ValueError):
                    SyntheticFieldState.from_mapping({**values, name: value})

    def test_action_ids_are_validated_strictly(self):
        environment = SyntheticMultiSeasonEnvironment(seed=12)
        for action_id, name in enumerate(ACTION_NAMES):
            self.assertEqual(environment.validate_action(action_id), action_id)
            self.assertEqual(environment.get_available_actions()[action_id]["action"], name)
        for invalid in (-1, 4, True, 1.0, "1", None):
            with self.subTest(invalid=invalid):
                with self.assertRaises(ValueError):
                    environment.validate_action(invalid)

    def test_seeded_reset_and_transitions_are_reproducible(self):
        first = SyntheticMultiSeasonEnvironment(scenario="drought", seed=92)
        second = SyntheticMultiSeasonEnvironment(scenario="drought", seed=92)
        first_observation = first.reset(seed=92)
        second_observation = second.reset(seed=92)
        self.assertEqual(first_observation, second_observation)
        first_trace = [first.step(index % len(ACTION_NAMES)) for index in range(8)]
        second_trace = [second.step(index % len(ACTION_NAMES)) for index in range(8)]
        self.assertEqual(first_trace, second_trace)

    def test_irrigation_and_adaptation_change_their_simulated_variables(self):
        baseline = SyntheticMultiSeasonEnvironment(scenario="normal", seed=45)
        irrigated = SyntheticMultiSeasonEnvironment(scenario="normal", seed=45)
        baseline.reset(seed=45)
        irrigated.reset(seed=45)
        baseline_observation = baseline.step(0)[0]
        irrigation_observation, _, _, irrigation_info = irrigated.step(2)
        self.assertGreater(
            irrigation_observation["state"]["soil_moisture"],
            baseline_observation["state"]["soil_moisture"],
        )
        self.assertLess(
            irrigation_observation["state"]["available_water"],
            baseline_observation["state"]["available_water"],
        )
        self.assertGreater(irrigation_info["applied_irrigation_mm_simulated"], 0)

        heat_baseline = SyntheticMultiSeasonEnvironment(scenario="heat", seed=13)
        heat_adapted = SyntheticMultiSeasonEnvironment(scenario="heat", seed=13)
        heat_baseline.reset(seed=13)
        heat_adapted.reset(seed=13)
        baseline_heat = heat_baseline.step(0)[0]["state"]["heat_stress"]
        adapted_observation, _, _, adaptation_info = heat_adapted.step(3)
        self.assertLess(adapted_observation["state"]["heat_stress"], baseline_heat)
        self.assertEqual(adaptation_info["action"], "conservative_adaptation")
        self.assertEqual(adaptation_info["data_status"], "simulated")

    def test_reward_components_are_explicit_and_sum_to_reward(self):
        environment = SyntheticMultiSeasonEnvironment(seed=7)
        environment.reset(seed=7)
        _, reward, _, info = environment.step(1)
        components = info["reward_components_simulated"]
        self.assertEqual(
            set(components),
            {
                "yield_proxy",
                "water_use_penalty",
                "heat_stress_penalty",
                "water_stress_penalty",
            },
        )
        self.assertAlmostEqual(reward, sum(components.values()))
        self.assertTrue(all(isinstance(value, float) for value in components.values()))
        self.assertEqual(info["evidence_class"], "synthetic")
        self.assertNotIn("soil_benefit", components)

    def test_training_is_deterministic_and_saved_policy_loads_for_inference(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            first_path = root / "first.json"
            second_path = root / "second.json"
            first = train_synthetic_q_policy(
                policy_path=first_path,
                report_path=root / "first_report.json",
                episodes=12,
                seed=31,
                held_out_episodes_per_scenario=2,
            )
            second = train_synthetic_q_policy(
                policy_path=second_path,
                report_path=root / "second_report.json",
                episodes=12,
                seed=31,
                held_out_episodes_per_scenario=2,
            )
            self.assertEqual(
                json.loads(first_path.read_text(encoding="utf-8")),
                json.loads(second_path.read_text(encoding="utf-8")),
            )
            policy = load_synthetic_q_policy(first_path)
            environment = SyntheticMultiSeasonEnvironment(seed=500)
            observation = environment.reset(seed=500)
            action = policy.select_action(observation)
            self.assertIn(action, range(len(ACTION_NAMES)))
            self.assertEqual(first["policy_loading_and_inference"]["status"], "passed")
            self.assertEqual(first["training_completed_episodes"], 12)
            self.assertEqual(second["training_q_table_state_count"], first["training_q_table_state_count"])

    def test_held_out_evaluation_compares_policy_with_no_intervention(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            train_synthetic_q_policy(
                policy_path=root / "policy.json",
                report_path=root / "report.json",
                episodes=8,
                seed=19,
                held_out_episodes_per_scenario=1,
            )
            policy = load_synthetic_q_policy(root / "policy.json")
            first = evaluate_synthetic_q_policy(
                policy,
                seed=19,
                episodes_per_scenario=2,
            )
            second = evaluate_synthetic_q_policy(
                policy,
                seed=19,
                episodes_per_scenario=2,
            )
        self.assertEqual(first, second)
        self.assertEqual(first["held_out_scenarios"], list(SIMULATION_SCENARIOS))
        self.assertEqual(first["policy_label"], POLICY_LABEL)
        for result in first["results_by_scenario"].values():
            baseline = result["baseline_no_intervention"]
            trained = result["trained_policy"]
            self.assertEqual(baseline["held_out_episode_count"], 2)
            self.assertEqual(trained["held_out_episode_count"], 2)
            self.assertIn("yield_proxy_simulated", trained)
            self.assertIn("water_use_mm_simulated", trained)
            self.assertIn("mean_heat_stress_simulated", trained)
            self.assertIn("mean_water_stress_simulated", trained)

    def test_safety_rejection_falls_back_and_missing_plan_skips_policy(self):
        environment = SyntheticMultiSeasonEnvironment(
            seed=8,
            crop_rotation=("Maize", "Wheat", "Lentil"),
        )
        observation = environment.reset()
        rejecting_policy = FixedPolicy(1)

        def reject_irrigation(proposal):
            if proposal["action"] != "no_intervention":
                raise ValueError("no irrigation capacity was supplied")
            return dict(proposal)

        result = select_safe_synthetic_action(
            rejecting_policy,
            observation,
            solved_plan(),
            reject_irrigation,
        )
        self.assertEqual(result["safety_status"], "safe_fallback_no_intervention")
        self.assertEqual(result["applied_action_id"], 0)
        self.assertIn("Safety rejected", result["fallback_reason"])

        uncalled_policy = FixedPolicy(2)
        missing_plan = select_safe_synthetic_action(
            uncalled_policy,
            observation,
            {"status": "infeasible", "selected_crop_by_period": None},
            reject_irrigation,
        )
        self.assertEqual(missing_plan["safety_status"], "safe_fallback_no_intervention")
        self.assertEqual(uncalled_policy.calls, 0)

    def test_existing_fieldshift_validator_rejects_unsupported_simulated_actions(self):
        field_safety = FieldShiftEnvironment(
            FieldState(
                field_id="safety-test",
                as_of_date="2026-01-01",
                latitude=23.81,
                longitude=90.41,
            )
        )
        simulator = SyntheticMultiSeasonEnvironment(
            seed=6,
            crop_rotation=("Maize", "Wheat", "Lentil"),
        )
        result = select_safe_synthetic_action(
            FixedPolicy(3),
            simulator.reset(),
            solved_plan(),
            field_safety._validate_action,
        )
        self.assertEqual(result["safety_status"], "safe_fallback_no_intervention")
        self.assertEqual(result["applied_action"], "no_intervention")
        self.assertEqual(result["action_provenance"]["evidence_class"], "synthetic")
        self.assertEqual(result["action_provenance"]["data_status"], "simulated")
        self.assertEqual(
            result["planning_context"]["planned_rotation"],
            solved_plan()["selected_crop_by_period"],
        )

    def test_supported_irrigation_actions_pass_only_when_existing_capacity_allows(self):
        field_safety = FieldShiftEnvironment(
            FieldState(
                field_id="irrigation-safety-test",
                as_of_date="2026-01-01",
                latitude=23.81,
                longitude=90.41,
            ),
            features={"irrigation_capacity_mm": 10.0},
        )
        observation = SyntheticMultiSeasonEnvironment(
            seed=6,
            crop_rotation=("Maize", "Wheat", "Lentil"),
        ).reset()

        for action_id, amount in ((1, 4.0), (2, 8.0)):
            with self.subTest(action_id=action_id):
                result = select_safe_synthetic_action(
                    FixedPolicy(action_id),
                    observation,
                    solved_plan(),
                    field_safety._validate_action,
                )
                self.assertEqual(
                    result["safety_status"],
                    "passed_existing_fieldshift_validator",
                )
                self.assertEqual(
                    result["validated_fieldshift_action"]["amount_mm"],
                    amount,
                )
                self.assertEqual(result["applied_action_id"], action_id)
                self.assertEqual(
                    result["action_provenance"]["source"],
                    "simulation-trained-policy",
                )

        no_capacity = FieldShiftEnvironment(
            FieldState(
                field_id="no-capacity",
                as_of_date="2026-01-01",
                latitude=23.81,
                longitude=90.41,
            )
        )
        rejected = select_safe_synthetic_action(
            FixedPolicy(1),
            observation,
            solved_plan(),
            no_capacity._validate_action,
        )
        self.assertEqual(
            rejected["safety_status"],
            "safe_fallback_no_intervention",
        )
        self.assertEqual(rejected["applied_action_id"], 0)

    def test_invalid_and_malformed_policy_actions_fall_back_safely(self):
        field_safety = FieldShiftEnvironment(
            FieldState(
                field_id="invalid-action-safety",
                as_of_date="2026-01-01",
                latitude=23.81,
                longitude=90.41,
            )
        )
        observation = SyntheticMultiSeasonEnvironment(
            seed=6,
            crop_rotation=("Maize", "Wheat", "Lentil"),
        ).reset()
        for invalid_action in (-1, 4, True, "1", None):
            with self.subTest(invalid_action=invalid_action):
                result = select_safe_synthetic_action(
                    FixedPolicy(invalid_action),
                    observation,
                    solved_plan(),
                    field_safety._validate_action,
                )
                self.assertEqual(
                    result["safety_status"],
                    "safe_fallback_no_intervention",
                )
                self.assertEqual(result["applied_action_id"], 0)
                self.assertEqual(
                    result["action_provenance"]["evidence_class"],
                    "synthetic",
                )

    def test_safety_parameter_change_rejects_unmatched_simulated_transition(self):
        field_safety = FieldShiftEnvironment(
            FieldState(
                field_id="modified-action-safety",
                as_of_date="2026-01-01",
                latitude=23.81,
                longitude=90.41,
            ),
            features={"irrigation_capacity_mm": 10.0},
        )
        observation = SyntheticMultiSeasonEnvironment(
            seed=6,
            crop_rotation=("Maize", "Wheat", "Lentil"),
        ).reset()

        def cap_irrigation(proposal):
            validated = field_safety._validate_action(proposal)
            if validated["action"] == "irrigation_adjustment":
                validated["amount_mm"] = 2.0
            return validated

        result = select_safe_synthetic_action(
            FixedPolicy(1),
            observation,
            solved_plan(),
            cap_irrigation,
        )
        self.assertEqual(result["safety_status"], "safe_fallback_no_intervention")
        self.assertEqual(result["applied_action_id"], 0)
        self.assertIn("changed the RL proposal", result["fallback_reason"])

    def test_milp_policy_safety_integration_preserves_rotation_and_labels_transition(self):
        field_safety = FieldShiftEnvironment(
            FieldState(
                field_id="integration-test",
                as_of_date="2026-01-01",
                latitude=23.81,
                longitude=90.41,
            )
        )
        result = run_synthetic_policy_step(
            FixedPolicy(0),
            solved_plan(),
            field_safety._validate_action,
            seed=17,
        )
        self.assertEqual(result["milp_status"], "optimal")
        self.assertEqual(result["safety_status"], "passed_existing_fieldshift_validator")
        self.assertTrue(result["planning_context"]["rotation_is_plan_not_observation"])
        self.assertEqual(
            result["transition"]["state_before"]["crop"],
            result["planning_context"]["planned_rotation"]["Y1"],
        )
        self.assertEqual(result["transition"]["transition_evidence_class"], "synthetic")
        self.assertEqual(result["policy_label"], POLICY_LABEL)


if __name__ == "__main__":
    unittest.main()
