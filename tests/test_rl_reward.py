import unittest

import numpy as np
import src.rl.reward as reward_module

from src.rl.environment import FieldShiftEnvironment
from src.rl.reward import (
    OUTCOME_INPUT_REQUIREMENTS,
    RewardAssessment,
    RewardConfig,
    calculate_reward,
    validate_reward,
)
from src.state.field_state import FieldState


class RewardBoundaryTests(unittest.TestCase):
    def test_missing_outcome_value_remains_unavailable_not_zero(self):
        assessment = validate_reward(
            None,
            source="environment",
            reason="No measured management outcome is available.",
        )
        self.assertEqual(assessment.status, "unavailable")
        self.assertFalse(assessment.available)
        self.assertIsNone(assessment.value)
        self.assertIn("No measured management outcome", assessment.reason)

    def test_outcome_specification_names_units_and_evidence_without_formula(self):
        requirements = {item.name: item for item in OUTCOME_INPUT_REQUIREMENTS}
        self.assertTrue(
            {
                "measured_yield",
                "realized_revenue",
                "recorded_production_cost",
                "measured_water_use",
                "soil_health_change",
                "management_action_outcomes",
            }.issubset(requirements)
        )
        self.assertIn("t/ha", requirements["measured_yield"].units)
        self.assertIn("BDT/ha", requirements["realized_revenue"].units)
        self.assertIn("Metered", requirements["measured_water_use"].evidence)
        self.assertFalse(hasattr(reward_module, "calculate_outcome_reward"))

    def test_synthetic_and_observed_provenance_are_preserved_not_reclassified(self):
        synthetic = {"data_status": "synthetic", "record_id": "demo-1"}
        observed = {"data_status": "observed", "record_id": "farm-1"}
        synthetic_assessment = validate_reward(
            1.25, source="user_supplied", provenance=synthetic, units="prototype"
        )
        observed_assessment = validate_reward(
            1.25, source="user_supplied", provenance=observed, units="prototype"
        )
        self.assertEqual(synthetic_assessment.status, "experimental_user_supplied")
        self.assertEqual(observed_assessment.status, "experimental_user_supplied")
        self.assertEqual(synthetic_assessment.to_dict()["provenance"], synthetic)
        self.assertEqual(observed_assessment.to_dict()["provenance"], observed)
        self.assertEqual(
            observed_assessment.to_dict()["agronomic_validation"],
            "not_established",
        )

    def test_non_numeric_nan_and_infinite_values_are_invalid(self):
        for value in ("1.0", True, np.nan, np.inf, -np.inf):
            with self.subTest(value=value):
                result = validate_reward(value, source="user_supplied")
                self.assertEqual(result.status, "invalid")
                self.assertFalse(result.available)
                self.assertIsNone(result.value)

    def test_finite_user_reward_is_experimental_and_retains_units(self):
        result = validate_reward(
            -0.25,
            source="user_supplied",
            provenance={"provider": "researcher_callback"},
            units="experimental score",
        )
        self.assertEqual(result.status, "experimental_user_supplied")
        self.assertTrue(result.available)
        self.assertTrue(result.experimental)
        self.assertEqual(result.value, -0.25)
        self.assertEqual(result.units, "experimental score")

    def test_environment_finite_reward_is_only_numerically_validated(self):
        result = validate_reward(2, source="environment")
        self.assertEqual(result.status, "environment_numeric")
        self.assertIn("outcome validity not established", result.reason)
        self.assertEqual(result.value, 2.0)

    def test_milp_objective_is_not_a_supported_reward_source(self):
        result = validate_reward(
            42.0,
            source="milp_objective",
            provenance={"planned_rotation": {"Spring": "Rice"}},
        )
        self.assertEqual(result.status, "invalid")
        self.assertIsNone(result.value)
        self.assertIn("planning objectives are not rewards", result.reason)

    def test_legacy_crop_proxy_cannot_generate_reward_or_components(self):
        result = calculate_reward(
            crop={"crop": "Rice", "is_legume": False},
            compatibility={"overall_compatibility": "compatible"},
            crops=[
                {
                    "crop": "Rice",
                    "expected_yield": 99.0,
                    "market_price": 100000.0,
                    "production_cost": 1.0,
                    "water_requirement": 1.0,
                    "data_status": "synthetic",
                }
            ],
            config=RewardConfig(),
            invalid_action=True,
        )
        self.assertIsNone(result["reward"])
        self.assertEqual(result["reward_status"], "unavailable")
        self.assertTrue(all(value is None for value in result["components"].values()))
        self.assertTrue(
            all(value == 0 for value in result["effective_weights"].values())
        )
        self.assertIn("no reward was generated", result["reason"])

    def test_validation_is_deterministic_and_provenance_is_immutable(self):
        provenance = {"data_status": "observed", "source": {"name": "meter"}}
        first = validate_reward(3.0, source="user_supplied", provenance=provenance)
        expected = first.to_dict()
        provenance["source"]["name"] = "changed"
        self.assertEqual(first.to_dict(), expected)
        with self.assertRaises(TypeError):
            first.provenance["source"]["name"] = "changed"
        exported = first.to_dict()
        exported["provenance"]["source"]["name"] = "changed"
        self.assertEqual(first.to_dict(), expected)
        self.assertEqual(
            validate_reward(3.0, source="user_supplied", provenance=expected["provenance"]).to_dict(),
            expected,
        )

    def test_phase10_environment_reward_remains_unavailable(self):
        state = FieldState(
            field_id="reward-test",
            as_of_date="2026-01-01",
            latitude=23.8103,
            longitude=90.4125,
        )
        environment = FieldShiftEnvironment(state)
        environment.reset()
        _, reward, terminated, truncated, info = environment.step(
            "no_intervention"
        )
        self.assertIsNone(reward)
        self.assertTrue(terminated)
        self.assertFalse(truncated)
        self.assertEqual(
            info["reward_status"], "unavailable_no_validated_outcome_model"
        )
        assessed = validate_reward(
            reward,
            source="environment",
            provenance=info.get("reward_provenance", {}),
            reason=info["reward_status"],
        )
        self.assertEqual(assessed.status, "unavailable")
        self.assertIsNone(assessed.value)

    def test_assessment_is_frozen_and_rejects_unknown_status(self):
        with self.assertRaises(ValueError):
            RewardAssessment(
                status="validated",
                value=1.0,
                source="environment",
                units=None,
                provenance={},
                reason="not valid",
            )
        result = validate_reward(1.0, source="environment")
        with self.assertRaises(AttributeError):
            result.status = "invalid"


if __name__ == "__main__":
    unittest.main()
