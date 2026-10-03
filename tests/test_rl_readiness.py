import copy
import unittest

from src.integration.milp_rl import adapt_milp_result
from src.rl.environment import EnvironmentConfig, FieldShiftEnvironment
from src.rl.readiness import (
    MINIMUM_HELD_OUT_EPISODES,
    MINIMUM_STEPS_PER_EPISODE,
    MINIMUM_TRAINING_EPISODES,
    OutcomeEvidence,
    assess_learning_readiness,
)
from src.rl.reward import validate_reward
from src.state.field_state import FieldState


def make_environment():
    state = FieldState(
        field_id="readiness-field",
        as_of_date="2026-01-01",
        latitude=23.8103,
        longitude=90.4125,
    )
    return FieldShiftEnvironment(state, config=EnvironmentConfig(max_steps=4))


class ActionConditionedEvidenceEnvironment:
    """Test double declaring an evidence-backed transition capability."""

    supports_action_conditioned_transitions = True

    def __init__(self):
        self._environment = make_environment()
        self.config = self._environment.config
        self.step_limit = self._environment.step_limit

    def reset(self, *args, **kwargs):
        return self._environment.reset(*args, **kwargs)

    def step(self, action):
        return self._environment.step(action)

    def get_observation(self):
        return self._environment.get_observation()

    def get_available_actions(self):
        return self._environment.get_available_actions()


def evidence_mapping(**overrides):
    data = {
        "evidence_id": "outcomes-2026-v1",
        "source": "field_outcome_study",
        "data_status": "observed",
        "outcome_name": "measured water use",
        "units": "mm/ha/interval",
        "sample_count": 40,
        "missing_fraction": 0.05,
        "coverage_assessed": True,
        "coverage_adequate": True,
        "covered_actions": ["no_intervention", "inspect_reassess"],
        "action_outcomes_observed": True,
        "action_conditioned_transitions_observed": True,
        "independent_training_episodes": MINIMUM_TRAINING_EPISODES,
        "held_out_evaluation_episodes": MINIMUM_HELD_OUT_EPISODES,
        "minimum_steps_per_episode": MINIMUM_STEPS_PER_EPISODE,
        "evaluation_protocol": "predeclared held-out field-season comparison",
        "provenance": {
            "source": "field measurement protocol v1",
            "record_id": "dataset-2026-01",
            "data_status": "observed",
        },
    }
    data.update(overrides)
    return data


def numeric_reward(evidence_id="outcomes-2026-v1", units="mm/ha/interval"):
    return validate_reward(
        1.5,
        source="environment",
        units=units,
        provenance={"evidence_id": evidence_id, "data_status": "observed"},
    )


class ReadinessTests(unittest.TestCase):
    def test_current_environment_is_blocked_without_outcome_evidence(self):
        environment = make_environment()
        report = assess_learning_readiness(environment)
        self.assertEqual(report.status, "blocked_missing_outcome_evidence")
        self.assertTrue(report.api_valid)
        self.assertTrue(report.observation_schema_valid)
        self.assertTrue(report.action_schema_valid)
        self.assertEqual(report.reward_classification, "unavailable")
        self.assertFalse(report.checks["reward_supported_by_measured_outcomes"])
        self.assertFalse(report.checks["policy_performance_validated"])
        self.assertTrue(any("no fallback or zero" in reason.lower() for reason in report.reasons))

    def test_unavailable_reward_is_never_zero_imputed(self):
        report = assess_learning_readiness(
            make_environment(),
            validate_reward(None, source="environment"),
        )
        serialized = report.to_dict()
        self.assertEqual(report.status, "blocked_missing_outcome_evidence")
        self.assertEqual(serialized["reward_classification"], "unavailable")
        self.assertFalse(serialized["checks"]["reward_numerically_valid"])
        self.assertFalse(serialized["checks"]["reward_supported_by_measured_outcomes"])

    def test_invalid_reward_is_classified_and_blocks(self):
        report = assess_learning_readiness(
            make_environment(),
            validate_reward(float("nan"), source="environment"),
        )
        self.assertEqual(report.status, "blocked_invalid_configuration")
        self.assertEqual(report.reward_classification, "invalid")

    def test_finite_user_reward_is_experimental_only_even_with_observed_labels(self):
        reward = validate_reward(
            2.0,
            source="user_supplied",
            units="mm/ha/interval",
            provenance={"evidence_id": "outcomes-2026-v1", "data_status": "observed"},
        )
        report = assess_learning_readiness(
            ActionConditionedEvidenceEnvironment(), reward, evidence_mapping()
        )
        self.assertEqual(report.status, "experimental_only")
        self.assertEqual(report.reward_classification, "experimental")
        self.assertFalse(report.checks["reward_supported_by_measured_outcomes"])

    def test_numeric_environment_reward_without_outcome_evidence_is_not_ready(self):
        report = assess_learning_readiness(
            make_environment(), numeric_reward()
        )
        self.assertEqual(report.status, "blocked_missing_outcome_evidence")
        self.assertEqual(report.reward_classification, "numeric_unverified")
        self.assertTrue(report.checks["reward_numerically_valid"])
        self.assertFalse(report.checks["reward_supported_by_measured_outcomes"])

    def test_satisfied_declared_requirements_allow_only_algorithm_prototype_status(self):
        environment = ActionConditionedEvidenceEnvironment()
        report = assess_learning_readiness(
            environment,
            numeric_reward(),
            OutcomeEvidence.from_mapping(evidence_mapping()),
        )
        self.assertEqual(report.status, "ready_for_algorithm_prototype")
        self.assertEqual(
            report.reward_classification,
            "numeric_unverified",
        )
        self.assertEqual(
            report.outcome_evidence_status,
            "evidence_backed_for_prototype",
        )
        self.assertTrue(report.checks["reward_supported_by_measured_outcomes"])
        self.assertTrue(report.checks["action_conditioned_transitions_supported"])
        self.assertTrue(report.checks["episode_evidence_sufficient_for_prototype"])
        self.assertFalse(report.checks["policy_performance_validated"])
        self.assertEqual(
            report.to_dict()["agronomic_effectiveness"], "not_established"
        )

    def test_evidence_requires_provenance_action_coverage_and_episode_depth(self):
        cases = (
            ({"provenance": {}}, "blocked_invalid_configuration"),
            ({"covered_actions": ["no_intervention"]}, "blocked_missing_outcome_evidence"),
            ({"action_outcomes_observed": False}, "blocked_missing_outcome_evidence"),
            ({"action_conditioned_transitions_observed": False}, "blocked_missing_outcome_evidence"),
            ({"held_out_evaluation_episodes": 0}, "blocked_missing_outcome_evidence"),
            ({"independent_training_episodes": 0}, "blocked_missing_outcome_evidence"),
            ({"minimum_steps_per_episode": 1}, "blocked_missing_outcome_evidence"),
            ({"coverage_adequate": False}, "blocked_missing_outcome_evidence"),
            ({"missing_fraction": 1.0}, "blocked_missing_outcome_evidence"),
        )
        for change, expected_status in cases:
            with self.subTest(change=change):
                report = assess_learning_readiness(
                    ActionConditionedEvidenceEnvironment(),
                    numeric_reward(),
                    evidence_mapping(**change),
                )
                self.assertEqual(report.status, expected_status)
                if expected_status == "blocked_missing_outcome_evidence":
                    self.assertEqual(
                        report.outcome_evidence_status, "incomplete_or_unsupported"
                    )

    def test_milp_plan_and_objective_are_not_outcome_evidence(self):
        planned = adapt_milp_result(
            {
                "status": "optimal",
                "planning_periods": ["Spring"],
                "selected_crop_by_period": {"Spring": "Rice"},
                "objective_value": 12.0,
            }
        ).to_dict()
        evidence = evidence_mapping(
            source="MILP",
            provenance={
                "data_status": "observed",
                "planning_context": planned,
                "objective_value": 12.0,
            },
        )
        report = assess_learning_readiness(
            ActionConditionedEvidenceEnvironment(),
            numeric_reward(),
            evidence,
        )
        self.assertEqual(report.status, "blocked_missing_outcome_evidence")
        self.assertFalse(report.checks["reward_supported_by_measured_outcomes"])
        self.assertTrue(
            any("MILP" in reason for reason in report.reasons)
        )

    def test_synthetic_evidence_is_not_accepted_as_observed_outcome_data(self):
        evidence = evidence_mapping(
            provenance={
                "source": "demo fixture",
                "data_status": {"outcomes": "synthetic"},
            }
        )
        report = assess_learning_readiness(
            ActionConditionedEvidenceEnvironment(),
            numeric_reward(),
            evidence,
        )
        self.assertEqual(report.status, "blocked_missing_outcome_evidence")
        self.assertFalse(report.checks["reward_supported_by_measured_outcomes"])

    def test_environmental_context_is_not_a_measured_management_outcome(self):
        report = assess_learning_readiness(
            ActionConditionedEvidenceEnvironment(),
            numeric_reward(),
            evidence_mapping(outcome_name="daily rainfall"),
        )
        self.assertEqual(report.status, "blocked_missing_outcome_evidence")
        self.assertFalse(report.checks["reward_supported_by_measured_outcomes"])

    def test_malformed_evidence_and_non_assessment_reward_are_rejected(self):
        malformed = assess_learning_readiness(
            make_environment(),
            numeric_reward(),
            {"evidence_id": "incomplete"},
        )
        self.assertEqual(malformed.status, "blocked_invalid_configuration")
        self.assertEqual(malformed.outcome_evidence_status, "invalid")

        raw_number = assess_learning_readiness(make_environment(), 0.0)
        self.assertEqual(raw_number.status, "blocked_invalid_configuration")
        self.assertEqual(raw_number.reward_classification, "invalid")

    def test_malformed_observation_is_blocked_as_invalid_configuration(self):
        environment = make_environment()
        observation = environment.get_observation()
        observation["features"]["temperature"] = "hot"
        environment.get_observation = lambda: observation
        report = assess_learning_readiness(environment)
        self.assertEqual(report.status, "blocked_invalid_configuration")
        self.assertFalse(report.observation_schema_valid)
        self.assertTrue(any("finite numeric" in reason for reason in report.reasons))

    def test_malformed_actions_are_blocked_as_invalid_configuration(self):
        environment = make_environment()
        environment.get_available_actions = lambda: ["no_intervention"]
        report = assess_learning_readiness(environment)
        self.assertEqual(report.status, "blocked_invalid_configuration")
        self.assertFalse(report.action_schema_valid)

    def test_malformed_configuration_is_blocked(self):
        environment = make_environment()
        environment.config = object()
        report = assess_learning_readiness(environment)
        self.assertEqual(report.status, "blocked_invalid_configuration")
        self.assertFalse(report.api_valid)

    def test_incompatible_reset_signature_is_blocked_without_calling_reset(self):
        environment = make_environment()
        environment.reset = lambda: self.fail("readiness must not reset environment")
        report = assess_learning_readiness(environment)
        self.assertEqual(report.status, "blocked_invalid_configuration")
        self.assertFalse(report.api_valid)
        self.assertTrue(any("seed keyword" in reason for reason in report.reasons))

    def test_insufficient_configured_steps_are_not_prototype_ready(self):
        state = FieldState(
            field_id="short-episode",
            as_of_date="2026-01-01",
            latitude=23.8103,
            longitude=90.4125,
        )
        environment = FieldShiftEnvironment(
            state,
            config=EnvironmentConfig(max_steps=1),
        )
        report = assess_learning_readiness(environment)
        self.assertEqual(report.status, "blocked_invalid_configuration")
        self.assertTrue(
            any("decision steps" in reason for reason in report.reasons)
        )

    def test_readiness_is_deterministic_and_does_not_mutate_environment(self):
        environment = make_environment()
        before_observation = copy.deepcopy(environment.get_observation())
        before_summary = environment.get_episode_summary()
        first = assess_learning_readiness(environment).to_dict()
        second = assess_learning_readiness(environment).to_dict()
        self.assertEqual(first, second)
        self.assertEqual(environment.get_observation(), before_observation)
        self.assertEqual(environment.get_episode_summary(), before_summary)

    def test_existing_environment_training_and_reward_apis_remain_independent(self):
        environment = make_environment()
        initial, info = environment.reset(seed=4)
        self.assertIn("state", initial)
        self.assertIn("available_actions", info)
        _, reward, terminated, truncated, step_info = environment.step(
            "no_intervention"
        )
        self.assertIsNone(reward)
        self.assertFalse(terminated and truncated)
        self.assertIn("termination_reason", step_info)


if __name__ == "__main__":
    unittest.main()
