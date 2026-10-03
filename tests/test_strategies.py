import unittest
from unittest.mock import patch

from src.optimizer.milp import DEFAULT_PERIODS
from src.optimizer.strategies import (
    DEFAULT_PRIORITY_PROFILES,
    generate_rotation_strategies,
)


def result(
    rotation=None,
    status="optimal",
    weights=None,
    data_status=None,
    provenance=None,
):
    requested = weights or {"profit": 0.7, "water": 0.2, "soil": 0.1}
    return {
        "status": status,
        "solver_status": "Optimal" if status == "optimal" else "Infeasible",
        "planning_periods": list(DEFAULT_PERIODS),
        "selected_crop_by_period": rotation
        if status == "optimal"
        else None,
        "objective_value": 1.2 if status == "optimal" else None,
        "profit_component": 10.0 if status == "optimal" else None,
        "water_component": 2.0 if status == "optimal" else None,
        "soil_component": 3.0 if status == "optimal" else None,
        "weights": {
            "requested": requested,
            "effective": requested,
        },
        "constraint_summary": {"one_crop_per_period": len(DEFAULT_PERIODS)},
        "data_status": data_status or {"crop_knowledge": ["synthetic"]},
        "provenance": provenance or {"crop_knowledge": {"data_status": ["synthetic"]}},
        "compatibility_by_crop": {},
    }


ROTATION_A = {"P1": "Lentil", "P2": "Rice"}
ROTATION_B = {"P1": "Rice", "P2": "Lentil"}


class StrategyTests(unittest.TestCase):
    def call_strategies(self, **kwargs):
        arguments = {"field_state": object()}
        arguments.update(kwargs)
        return generate_rotation_strategies(**arguments)

    def test_default_strategy_profiles_exist(self):
        self.assertEqual(
            list(DEFAULT_PRIORITY_PROFILES),
            ["profit_focused", "water_focused", "soil_focused", "balanced"],
        )

    def test_default_profile_weights_have_expected_totals(self):
        for weights in DEFAULT_PRIORITY_PROFILES.values():
            self.assertAlmostEqual(sum(weights.values()), 1.0)

    def test_custom_profiles_are_accepted(self):
        profiles = {"custom": {"profit": 0.1, "water": 0.2, "soil": 0.7}}
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            return_value=result(ROTATION_A),
        ):
            output = self.call_strategies(priority_profiles=profiles)
        self.assertEqual(list(output["strategies"]), ["custom"])
        self.assertEqual(output["strategies"]["custom"]["requested_weights"], profiles["custom"])

    def test_profile_order_is_preserved(self):
        profiles = {
            "later": {"profit": 0.2, "water": 0.2, "soil": 0.6},
            "earlier": {"profit": 0.7, "water": 0.2, "soil": 0.1},
        }
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            return_value=result(ROTATION_A),
        ):
            output = self.call_strategies(priority_profiles=profiles)
        self.assertEqual(list(output["strategies"]), ["later", "earlier"])
        self.assertEqual(list(output["comparison"]), ["later", "earlier"])

    def test_milp_is_called_once_for_each_profile(self):
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            return_value=result(ROTATION_A),
        ) as optimizer:
            self.call_strategies()
        self.assertEqual(optimizer.call_count, 4)

    def test_core_inputs_and_planning_periods_are_passed_to_milp(self):
        state, crops, features, history = object(), object(), {"x": 1}, object()
        periods = ["Spring", "Winter"]
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            return_value=result(ROTATION_A),
        ) as optimizer:
            self.call_strategies(
                field_state=state,
                crops=crops,
                features=features,
                field_history=history,
                planning_periods=periods,
            )
        first = optimizer.call_args_list[0].kwargs
        self.assertIs(first["field_state"], state)
        self.assertIs(first["crops"], crops)
        self.assertIs(first["features"], features)
        self.assertIs(first["field_history"], history)
        self.assertEqual(first["planning_periods"], periods)

    def test_profit_profile_weights_are_passed(self):
        self.assert_profile_weights(
            "profit_focused", {"profit_weight": 0.7, "water_weight": 0.2, "soil_weight": 0.1}
        )

    def test_water_profile_weights_are_passed(self):
        self.assert_profile_weights(
            "water_focused", {"profit_weight": 0.2, "water_weight": 0.6, "soil_weight": 0.2}
        )

    def test_soil_profile_weights_are_passed(self):
        self.assert_profile_weights(
            "soil_focused", {"profit_weight": 0.2, "water_weight": 0.2, "soil_weight": 0.6}
        )

    def test_balanced_profile_weights_are_passed(self):
        self.assert_profile_weights(
            "balanced", {"profit_weight": 0.34, "water_weight": 0.33, "soil_weight": 0.33}
        )

    def assert_profile_weights(self, name, expected):
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            return_value=result(ROTATION_A),
        ) as optimizer:
            self.call_strategies()
        invocation = next(
            item.kwargs for item in optimizer.call_args_list
            if item.kwargs["profit_weight"] == expected["profit_weight"]
            and item.kwargs["water_weight"] == expected["water_weight"]
            and item.kwargs["soil_weight"] == expected["soil_weight"]
        )
        self.assertEqual(
            {key: invocation[key] for key in expected},
            expected,
            name,
        )

    def test_phase_7_result_fields_are_preserved(self):
        phase_result = result(ROTATION_A)
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            return_value=phase_result,
        ):
            strategy = self.call_strategies()["strategies"]["profit_focused"]
        for key in (
            "status",
            "solver_status",
            "planning_periods",
            "selected_crop_by_period",
            "objective_value",
            "profit_component",
            "water_component",
            "soil_component",
            "constraint_summary",
            "data_status",
            "provenance",
        ):
            self.assertEqual(strategy[key], phase_result[key])

    def test_different_profiles_can_produce_different_rotations(self):
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            side_effect=[result(ROTATION_A), result(ROTATION_B), result(ROTATION_A), result(ROTATION_B)],
        ):
            output = self.call_strategies()
        self.assertNotEqual(
            output["strategies"]["profit_focused"]["selected_crop_by_period"],
            output["strategies"]["water_focused"]["selected_crop_by_period"],
        )

    def test_different_profiles_can_produce_the_same_rotation(self):
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            return_value=result(ROTATION_A),
        ):
            output = self.call_strategies()
        self.assertIsNone(output["strategies"]["profit_focused"]["same_rotation_as"])
        self.assertEqual(
            output["strategies"]["water_focused"]["same_rotation_as"],
            "profit_focused",
        )

    def test_infeasible_profile_does_not_interrupt_other_profiles(self):
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            side_effect=[
                result(status="infeasible"),
                result(ROTATION_A),
                result(ROTATION_B),
                result(ROTATION_A),
            ],
        ):
            output = self.call_strategies()
        self.assertEqual(output["strategies"]["profit_focused"]["status"], "infeasible")
        self.assertEqual(output["strategies"]["water_focused"]["status"], "optimal")

    def test_infeasible_profile_has_no_rotation(self):
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            side_effect=[
                result(status="infeasible"),
                result(ROTATION_A),
                result(ROTATION_A),
                result(ROTATION_A),
            ],
        ):
            output = self.call_strategies()
        failed = output["strategies"]["profit_focused"]
        self.assertIsNone(failed["selected_crop_by_period"])
        self.assertIsNone(output["comparison"]["profit_focused"]["rotation"])

    def test_missing_objective_metadata_is_controlled_per_profile(self):
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            side_effect=[
                ValueError(
                    "No positively weighted objective component has complete crop metadata."
                ),
                result(ROTATION_A),
                result(ROTATION_B),
                result(ROTATION_A),
            ],
        ):
            output = self.call_strategies()
        unavailable = output["strategies"]["profit_focused"]
        self.assertEqual(unavailable["status"], "not_solved")
        self.assertEqual(unavailable["solver_status"], "InputError")
        self.assertIsNone(unavailable["selected_crop_by_period"])
        self.assertEqual(
            unavailable["data_status"]["objective_components"],
            "unavailable_required_metadata",
        )

    def test_unrelated_optimizer_validation_error_is_not_hidden(self):
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            side_effect=ValueError("Invalid crop dataset."),
        ):
            with self.assertRaisesRegex(ValueError, "Invalid crop dataset"):
                self.call_strategies()

    def test_provenance_and_data_status_are_preserved(self):
        provenance = {
            "environment": {"source": "NASA_POWER", "data_status": "observed"},
            "crop_knowledge": {"data_status": ["synthetic"]},
        }
        data_status = {"environment": "observed", "crop_knowledge": ["synthetic"]}
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            return_value=result(
                ROTATION_A, provenance=provenance, data_status=data_status
            ),
        ):
            output = self.call_strategies()
        self.assertEqual(output["provenance"]["environment"], provenance["environment"])
        self.assertEqual(output["data_status"], data_status)
        self.assertEqual(
            output["provenance"]["strategy_weights"]["data_status"], "assumption"
        )

    def test_no_ranking_fields_are_returned(self):
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            return_value=result(ROTATION_A),
        ):
            output = self.call_strategies()
        self.assertFalse(
            {"rank", "score_rank", "winner", "best_strategy", "overall_score"}
            & (set(output) | set(output["comparison"]["profit_focused"]))
        )

    def test_no_universal_best_strategy_field_is_returned(self):
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            return_value=result(ROTATION_A),
        ):
            output = self.call_strategies()
        self.assertNotIn("best_strategy", output)
        self.assertNotIn("winner", output)

    def test_comparison_contains_components_and_profile_weights(self):
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            return_value=result(ROTATION_A),
        ):
            comparison = self.call_strategies()["comparison"]["profit_focused"]
        self.assertEqual(comparison["profit_component"], 10.0)
        self.assertEqual(comparison["water_component"], 2.0)
        self.assertEqual(comparison["soil_component"], 3.0)
        self.assertEqual(comparison["weights"], DEFAULT_PRIORITY_PROFILES["profit_focused"])
        self.assertEqual(comparison["status"], "optimal")

    def test_repeated_generation_is_deterministic(self):
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            return_value=result(ROTATION_A),
        ):
            first = self.call_strategies()
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            return_value=result(ROTATION_A),
        ):
            second = self.call_strategies()
        self.assertEqual(first, second)

    def test_agronomic_configuration_is_forwarded(self):
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            return_value=result(ROTATION_A),
        ) as optimizer:
            self.call_strategies(agronomic_config={"legume_interval_seasons": 4})
        self.assertTrue(
            all(
                invocation.kwargs["legume_interval_seasons"] == 4
                for invocation in optimizer.call_args_list
            )
        )

    def test_optimizer_configuration_is_forwarded(self):
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            return_value=result(ROTATION_A),
        ) as optimizer:
            self.call_strategies(optimizer_options={"years": 2, "seasons_per_year": 3})
        self.assertEqual(optimizer.call_args_list[0].kwargs["years"], 2)
        self.assertEqual(optimizer.call_args_list[0].kwargs["seasons_per_year"], 3)

    def test_invalid_profile_weights_are_rejected(self):
        invalid_profiles = [
            {"empty": {"profit": 0, "water": 0, "soil": 0}},
            {"negative": {"profit": -1, "water": 1, "soil": 1}},
            {"missing": {"profit": 1, "water": 0}},
        ]
        for profiles in invalid_profiles:
            with self.subTest(profiles=profiles):
                with self.assertRaises(ValueError):
                    self.call_strategies(priority_profiles=profiles)

    def test_duplicate_normalized_profile_names_are_rejected(self):
        profiles = {
            "same": {"profit": 0.2, "water": 0.3, "soil": 0.5},
            " same ": {"profit": 0.3, "water": 0.3, "soil": 0.4},
        }
        with self.assertRaisesRegex(ValueError, "unique"):
            self.call_strategies(priority_profiles=profiles)

    def test_reserved_optimizer_options_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "profile weights"):
            self.call_strategies(optimizer_options={"profit_weight": 0.9})

    def test_profile_source_is_identified(self):
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            return_value=result(ROTATION_A),
        ):
            defaults = self.call_strategies()
        with patch(
            "src.optimizer.strategies.optimize_rotation",
            return_value=result(ROTATION_A),
        ):
            custom = self.call_strategies(
                priority_profiles={
                    "custom": {"profit": 0.2, "water": 0.3, "soil": 0.5}
                }
            )
        self.assertEqual(
            defaults["provenance"]["strategy_weights"]["source"],
            "prototype_default_assumptions",
        )
        self.assertEqual(
            custom["provenance"]["strategy_weights"]["source"], "caller_supplied"
        )


if __name__ == "__main__":
    unittest.main()
