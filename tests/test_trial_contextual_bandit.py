import tempfile
import unittest
from pathlib import Path

import pandas as pd

from src.experiments.real_yield_training import TARGET_COLUMN
from src.experiments.trial_contextual_bandit import (
    compare_trial_contextual_bandit,
    rank_trial_treatments,
    train_trial_contextual_bandit,
)


def trial_records():
    records = []
    for site in range(6):
        for treatment, treatment_yield in (
            ("N0P0", 2.0 + site * 0.1),
            ("NPK", 3.0 + site * 0.1),
        ):
            records.append(
                {
                    "crop": "Wheat",
                    "source_workbook": "wheat_trial.xlsx",
                    "treatment": treatment,
                    "year": 2019,
                    "altitude_m": 2000 + site * 10,
                    "planting_day_of_year": 170,
                    "variety": "Test",
                    "region": f"Region {site // 2}",
                    "crop_system": "Wheat",
                    "landscape_strata": "Footslope",
                    "soil_type": "Vertisol",
                    "country": "Ethiopia",
                    "district": f"District {site}",
                    "village": f"Village {site}",
                    "evidence_class": "observed_trial_record",
                    "data_status": "observed",
                    TARGET_COLUMN: treatment_yield,
                }
            )
    return pd.DataFrame(records)


class TrialContextualBanditTests(unittest.TestCase):
    def test_model_evaluation_holds_sites_out_without_claiming_policy_value(self):
        report = compare_trial_contextual_bandit(trial_records(), max_splits=4)
        self.assertEqual(report["split_count"], 4)
        self.assertEqual(report["site_group_count"], 6)
        self.assertIsNone(report["counterfactual_policy_value"])
        self.assertFalse(report["causal_treatment_effects_estimated"])
        self.assertFalse(report["bangladesh_validation"])

    def test_trains_and_ranks_only_supported_treatments_for_named_trial(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            records_path = root / "records.csv"
            trial_records().to_csv(records_path, index=False)
            report = train_trial_contextual_bandit(
                records_path=records_path,
                output_dir=root / "model",
            )
            result = rank_trial_treatments(
                {
                    "crop": "Wheat",
                    "source_workbook": "wheat_trial.xlsx",
                    "year": 2019,
                    "altitude_m": 2020,
                    "planting_day_of_year": 170,
                    "variety": "Test",
                    "region": "Region 1",
                    "crop_system": "Wheat",
                    "landscape_strata": "Footslope",
                    "soil_type": "Vertisol",
                },
                model_path=root / "model" / "ethiopia_trial_contextual_bandit.joblib",
            )

        self.assertEqual(report["sequential_rl_status"], "not_trained")
        self.assertEqual(result["recommendation_status"], "not_farm_advice")
        self.assertFalse(result["sequential_rl"])
        self.assertEqual(len(result["ranked_treatments"]), 2)
        self.assertTrue(
            all(item["observed_site_count"] >= 2 for item in result["ranked_treatments"])
        )

    def test_training_rejects_non_observed_records(self):
        records = trial_records()
        records.loc[0, "data_status"] = "synthetic"
        with self.assertRaisesRegex(ValueError, "Synthetic or unverified"):
            compare_trial_contextual_bandit(records)

    def test_ranking_rejects_unavailable_crop_or_workbook(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            records_path = root / "records.csv"
            trial_records().to_csv(records_path, index=False)
            train_trial_contextual_bandit(
                records_path=records_path,
                output_dir=root / "model",
            )
            model_path = root / "model" / "ethiopia_trial_contextual_bandit.joblib"
            with self.assertRaisesRegex(ValueError, "No sufficiently replicated"):
                rank_trial_treatments(
                    {"crop": "Maize", "source_workbook": "wheat_trial.xlsx"},
                    model_path=model_path,
                )


if __name__ == "__main__":
    unittest.main()
