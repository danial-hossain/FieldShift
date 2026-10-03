import copy
import unittest
from collections.abc import Mapping

from src.integration.milp_rl import (
    MILPRotationContext,
    adapt_milp_result,
    add_planning_context,
)
from src.rl.agent import DeterministicBaselinePolicy
from src.rl.environment import FieldShiftEnvironment
from src.rl.training import run_training
from src.state.field_state import FieldState


def optimal_result():
    return {
        "status": "optimal",
        "solver_status": "Optimal",
        "planning_periods": ["Y1_S1", "Y1_S2"],
        "selected_crop_by_period": {"Y1_S1": "Lentil", "Y1_S2": "Rice"},
        "objective_value": 1.25,
        "profit_component": 100.0,
        "water_component": 1.5,
        "soil_component": 0.75,
        "normalized_components": {
            "profit": 1.2,
            "water": 1.5,
            "soil": 0.75,
        },
        "constraint_summary": {
            "one_crop_per_period": 2,
            "family_transition_constraints": 3,
        },
        "data_status": {"crop_knowledge": ["synthetic"]},
        "provenance": {
            "environment": {"source": "NASA_POWER", "data_status": "observed"}
        },
    }


class MilpRlIntegrationTests(unittest.TestCase):
    def test_valid_optimal_result_becomes_plan_context(self):
        context = adapt_milp_result(optimal_result())
        self.assertIsInstance(context, MILPRotationContext)
        self.assertEqual(context.status, "optimal")
        self.assertTrue(context.has_plan)
        self.assertEqual(
            dict(context.planned_rotation),
            {"Y1_S1": "Lentil", "Y1_S2": "Rice"},
        )

    def test_valid_feasible_result_is_distinguished_from_optimal(self):
        result = optimal_result()
        result["status"] = "feasible"
        result["solver_status"] = "Feasible"
        context = adapt_milp_result(result)
        self.assertEqual(context.status, "feasible")
        self.assertTrue(context.has_plan)

    def test_infeasible_result_has_no_rotation_or_fallback(self):
        context = adapt_milp_result(
            {
                "status": "infeasible",
                "solver_status": "Infeasible",
                "planning_periods": ["P1", "P2"],
                "selected_crop_by_period": None,
                "constraint_summary": {"infeasibility_note": "constraints conflict"},
            }
        )
        self.assertEqual(context.status, "infeasible")
        self.assertFalse(context.has_plan)
        self.assertIsNone(context.planned_rotation)
        self.assertIsNone(context.to_dict()["planned_rotation"])

    def test_not_solved_result_preserves_periods_without_inventing_rotation(self):
        context = adapt_milp_result(
            {
                "status": "not_solved",
                "solver_status": "Not Solved",
                "planning_periods": ["Spring", "Monsoon"],
                "selected_crop_by_period": None,
            }
        )
        self.assertEqual(context.status, "not_solved")
        self.assertEqual(context.planning_periods, ("Spring", "Monsoon"))
        self.assertIsNone(context.planned_rotation)

    def test_solver_error_is_not_misrepresented_as_feasible(self):
        context = adapt_milp_result(
            {
                "status": "solver_error",
                "solver_status": "CBC unavailable",
                "selected_crop_by_period": None,
            }
        )
        self.assertEqual(context.status, "solver_error")
        self.assertFalse(context.has_plan)
        self.assertIsNone(context.planned_rotation)

    def test_missing_milp_result_has_explicit_missing_status(self):
        context = adapt_milp_result(None)
        self.assertEqual(context.status, "missing")
        self.assertFalse(context.has_plan)
        self.assertIsNone(context.planned_rotation)
        self.assertIn("No MILP result", context.reason)

    def test_non_mapping_result_is_explicitly_invalid(self):
        context = adapt_milp_result(["optimal"])
        self.assertEqual(context.status, "invalid")
        self.assertIn("mapping", context.reason)

    def test_missing_status_is_explicitly_invalid(self):
        context = adapt_milp_result({"selected_crop_by_period": {"P1": "Rice"}})
        self.assertEqual(context.status, "invalid")
        self.assertIn("status", context.reason)

    def test_unknown_status_is_invalid(self):
        result = optimal_result()
        result["status"] = "failed_but_has_rotation"
        context = adapt_milp_result(result)
        self.assertEqual(context.status, "invalid")
        self.assertIsNone(context.planned_rotation)

    def test_conflicting_optimizer_and_solver_status_is_invalid(self):
        result = optimal_result()
        result["solver_status"] = "Infeasible"
        context = adapt_milp_result(result)
        self.assertEqual(context.status, "invalid")
        self.assertIn("conflicts", context.reason)

    def test_solved_result_requires_nonempty_rotation_mapping(self):
        for rotation in (None, {}, ["Rice"]):
            with self.subTest(rotation=rotation):
                result = optimal_result()
                result["selected_crop_by_period"] = rotation
                context = adapt_milp_result(result)
                self.assertEqual(context.status, "invalid")
                self.assertFalse(context.has_plan)

    def test_rotation_keys_must_match_period_list_in_order(self):
        result = optimal_result()
        result["planning_periods"] = ["Y1_S2", "Y1_S1"]
        context = adapt_milp_result(result)
        self.assertEqual(context.status, "invalid")
        self.assertIn("order must exactly match", context.reason)

    def test_empty_crop_or_period_labels_are_rejected(self):
        for rotation in (
            {"": "Rice"},
            {"P1": ""},
            {1: "Rice"},
        ):
            result = optimal_result()
            result["planning_periods"] = list(rotation)
            result["selected_crop_by_period"] = rotation
            context = adapt_milp_result(result)
            self.assertEqual(context.status, "invalid")

    def test_unsolved_result_cannot_contain_a_rotation(self):
        context = adapt_milp_result(
            {
                "status": "infeasible",
                "selected_crop_by_period": {"P1": "Rice"},
            }
        )
        self.assertEqual(context.status, "invalid")
        self.assertIsNone(context.planned_rotation)

    def test_periods_are_derived_from_rotation_if_optional_metadata_missing(self):
        result = optimal_result()
        result.pop("planning_periods")
        context = adapt_milp_result(result)
        self.assertEqual(context.planning_periods, ("Y1_S1", "Y1_S2"))
        self.assertTrue(context.has_plan)

    def test_objective_components_constraints_and_provenance_are_preserved(self):
        source = optimal_result()
        context = adapt_milp_result(source)
        values = context.to_dict()
        self.assertEqual(values["objective_components"]["objective_value"], 1.25)
        self.assertEqual(values["objective_components"]["profit_component"], 100.0)
        self.assertEqual(
            values["objective_components"]["normalized_components"]["soil"], 0.75
        )
        self.assertEqual(values["constraint_summary"], source["constraint_summary"])
        self.assertEqual(values["provenance"], source["provenance"])
        self.assertEqual(values["data_status"], source["data_status"])

    def test_missing_optional_metadata_is_preserved_as_missing(self):
        result = optimal_result()
        for key in (
            "objective_value",
            "profit_component",
            "water_component",
            "soil_component",
            "normalized_components",
            "constraint_summary",
            "data_status",
            "provenance",
        ):
            result.pop(key)
        context = adapt_milp_result(result)
        values = context.to_dict()
        self.assertIsNone(values["objective_components"]["objective_value"])
        self.assertIsNone(values["objective_components"]["profit_component"])
        self.assertEqual(values["constraint_summary"], {})
        self.assertEqual(values["provenance"], {})

    def test_malformed_optional_metadata_is_invalid(self):
        result = optimal_result()
        result["constraint_summary"] = ["not", "a", "mapping"]
        context = adapt_milp_result(result)
        self.assertEqual(context.status, "invalid")
        self.assertIn("constraint_summary", context.reason)

    def test_source_result_is_not_mutated_or_retained_by_reference(self):
        result = optimal_result()
        original = copy.deepcopy(result)
        context = adapt_milp_result(result)
        result["selected_crop_by_period"]["Y1_S1"] = "Maize"
        result["constraint_summary"]["one_crop_per_period"] = 99
        self.assertEqual(result["planning_periods"], original["planning_periods"])
        self.assertEqual(
            dict(context.planned_rotation), original["selected_crop_by_period"]
        )
        self.assertEqual(
            context.to_dict()["constraint_summary"],
            original["constraint_summary"],
        )

    def test_context_mappings_are_read_only_and_serialization_is_detached(self):
        context = adapt_milp_result(optimal_result())
        self.assertIsInstance(context.planned_rotation, Mapping)
        with self.assertRaises(TypeError):
            context.planned_rotation["Y1_S1"] = "Maize"
        serialized = context.to_dict()
        serialized["planned_rotation"]["Y1_S1"] = "Maize"
        self.assertEqual(context.planned_rotation["Y1_S1"], "Lentil")

    def test_planned_rotation_is_marked_as_not_observed_or_planted(self):
        observation = {
            "state": {"previous_crop": "Wheat"},
            "features": {"temperature": 25.0},
            "provenance": {"temperature": {"source": "NASA_POWER"}},
        }
        augmented = add_planning_context(observation, optimal_result())
        plan = augmented["planning_context"]
        self.assertTrue(plan["rotation_is_plan_not_observation"])
        self.assertFalse(plan["planting_confirmed"])
        self.assertEqual(plan["planned_rotation"]["Y1_S1"], "Lentil")
        self.assertEqual(augmented["state"], observation["state"])
        self.assertNotIn("actual_crop", augmented["state"])

    def test_planning_context_does_not_map_milp_objective_to_reward(self):
        context = adapt_milp_result(optimal_result()).to_dict()
        self.assertIsNone(context["reward_mapping"])
        self.assertEqual(context["objective_components"]["objective_value"], 1.25)

    def test_infeasible_plan_context_adds_no_fallback_to_observation(self):
        observation = {"state": {}, "features": {}, "provenance": {}}
        augmented = add_planning_context(
            observation,
            {"status": "infeasible", "selected_crop_by_period": None},
        )
        self.assertIsNone(augmented["planning_context"]["planned_rotation"])
        self.assertNotIn("planned_rotation", augmented["state"])

    def test_adapter_is_deterministic(self):
        first = adapt_milp_result(optimal_result()).to_dict()
        second = adapt_milp_result(optimal_result()).to_dict()
        self.assertEqual(first, second)

    def test_adding_context_does_not_mutate_observation_or_plan(self):
        observation = {
            "state": {"temperature": 25.0},
            "features": {"temperature": 25.0},
            "provenance": {"temperature": "observed"},
        }
        plan = optimal_result()
        old_observation = copy.deepcopy(observation)
        old_plan = copy.deepcopy(plan)
        augmented = add_planning_context(observation, plan)
        self.assertEqual(observation, old_observation)
        self.assertEqual(plan, old_plan)
        augmented["planning_context"]["planned_rotation"]["Y1_S1"] = "Maize"
        self.assertEqual(plan, old_plan)

    def test_duplicate_context_in_observation_is_rejected_not_overwritten(self):
        with self.assertRaisesRegex(ValueError, "already contains"):
            add_planning_context(
                {"planning_context": {"status": "old"}}, optimal_result()
            )

    def test_environment_and_training_work_without_milp_context(self):
        state = FieldState(
            field_id="independent",
            as_of_date="2026-01-01",
            latitude=23.81,
            longitude=90.41,
        )
        environment = FieldShiftEnvironment(state)
        result = run_training(environment, episodes=1, seed=3)
        self.assertEqual(result["status"], "unsupported_reward")
        self.assertNotIn("planning_context", result["history"][0]["provenance"])
        self.assertEqual(environment.get_episode_summary()["steps"], 1)

    def test_observation_adapter_preserves_phase10_contract_fields(self):
        observation = {
            "state": {"temperature": None},
            "features": {"temperature": None},
            "feature_order": ("temperature",),
            "missingness": {"temperature": True},
            "provenance": {"temperature": {"source": "missing"}},
        }
        augmented = add_planning_context(observation, optimal_result())
        for key, value in observation.items():
            self.assertEqual(augmented[key], value)
        self.assertTrue(augmented["missingness"]["temperature"])


if __name__ == "__main__":
    unittest.main()
