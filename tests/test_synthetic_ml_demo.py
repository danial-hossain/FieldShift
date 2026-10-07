import json
import os
import math
import tempfile
import unittest
from pathlib import Path

import numpy as np
import pandas as pd

from src.experiments.synthetic_ml_demo import (
    FEATURE_COLUMNS,
    TARGET_NAME,
    generate_synthetic_yield_dataset,
    integrate_prediction_into_field_state,
    load_synthetic_yield_model,
    predict_synthetic_crop_yield,
    predict_synthetic_yield,
    train_synthetic_yield_model,
)
from src.state.field_state import build_field_state


class SyntheticMlDemoTests(unittest.TestCase):
    def _demo_field_state(self):
        power = pd.read_csv(
            "data/nasa_power/nasa_power_lat23.8103_lon90.4125_20260831_20260929.csv"
        )
        from src.data.crops import load_crop_knowledge
        from src.data.field_history import load_field_history
        from src.data.smap import load_smap_data
        from src.data.soil import load_soil_data

        return build_field_state(
            "field_demo",
            23.8103,
            90.4125,
            "2026-09-29",
            power,
            smap_data=load_smap_data(23.8103, 90.4125, "2026-09-25", "2026-09-29"),
            soil_data=load_soil_data(),
            field_history_data=load_field_history(),
            crop_knowledge=load_crop_knowledge(),
        )

    def test_synthetic_dataset_has_expected_schema(self):
        dataset = generate_synthetic_yield_dataset(n_samples=128, seed=9)
        self.assertEqual(list(dataset.columns), [*FEATURE_COLUMNS, TARGET_NAME])
        self.assertEqual(len(dataset), 128)
        self.assertTrue((dataset[TARGET_NAME] > 0).all())

    def test_model_training_creates_artifact_and_metrics(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            model = train_synthetic_yield_model(seed=7, output_dir=Path(temp_dir))
            artifact_path = Path(temp_dir) / "synthetic_yield_demo_model.pkl"
            metadata_path = Path(temp_dir) / "synthetic_yield_demo_model.json"
            self.assertTrue(artifact_path.exists())
            self.assertTrue(metadata_path.exists())
            self.assertEqual(model["data_boundary"], "synthetic_demo_only")
            self.assertEqual(model["model_version"], 2)
            self.assertIn("test_r2", model["metrics"])
            self.assertTrue(model["metrics"]["test_r2"] > 0.8)
            reloaded = load_synthetic_yield_model(artifact_path)
            self.assertEqual(reloaded["model_name"], model["model_name"])
            self.assertEqual(model["dataset_rows"], 512)
            self.assertEqual(model["feature_count"], len(FEATURE_COLUMNS))
            self.assertEqual(model["dataset_seed"], 7)
            self.assertEqual(
                model["evaluation_protocol"],
                "Seeded random 80/20 holdout; normalization fitted on training rows only.",
            )

    def test_crop_and_season_conditioned_predictions_use_model_features_and_rmse(self):
        field_state = self._demo_field_state()
        with tempfile.TemporaryDirectory() as temp_dir:
            model = train_synthetic_yield_model(seed=7, output_dir=Path(temp_dir))
            chickpea = predict_synthetic_crop_yield(
                field_state,
                crop="Chickpea",
                season_type="dry",
                model=model,
            )
            sesame = predict_synthetic_crop_yield(
                field_state,
                crop="Sesame",
                season_type="dry",
                model=model,
            )
            wet_chickpea = predict_synthetic_crop_yield(
                field_state,
                crop="Chickpea",
                season_type="wet",
                model=model,
            )

        self.assertNotEqual(
            chickpea["synthetic_demo_prediction"]["predicted_value"],
            sesame["synthetic_demo_prediction"]["predicted_value"],
        )
        self.assertNotEqual(
            chickpea["synthetic_demo_prediction"]["predicted_value"],
            wet_chickpea["synthetic_demo_prediction"]["predicted_value"],
        )
        self.assertEqual(chickpea["features_used"]["crop_is_chickpea"], 1.0)
        self.assertEqual(chickpea["features_used"]["season_is_wet"], 0.0)
        self.assertEqual(wet_chickpea["features_used"]["season_is_wet"], 1.0)
        self.assertAlmostEqual(
            chickpea["synthetic_demo_prediction"]["uncertainty_t_ha"],
            max(
                model["metrics"]["test_rmse_t_ha"],
                abs(chickpea["synthetic_demo_prediction"]["predicted_value"]) * 0.05,
            ),
        )

    def test_training_split_uses_row_positions_for_non_default_dataframe_index(self):
        dataset = generate_synthetic_yield_dataset(n_samples=40, seed=9)
        dataset.index = dataset.index + 1000
        split_indices = list(range(len(dataset)))
        split_rng = np.random.default_rng(7)
        split_rng.shuffle(split_indices)
        train_indices = split_indices[:32]
        with tempfile.TemporaryDirectory() as temp_dir:
            model = train_synthetic_yield_model(
                dataset=dataset,
                seed=7,
                output_dir=Path(temp_dir),
            )

        self.assertEqual(model["dataset_rows"], 40)
        self.assertEqual(model["train_rows"], 32)
        self.assertEqual(model["test_rows"], 8)
        self.assertIsNone(model["dataset_seed"])
        self.assertTrue(all(math.isfinite(value) for value in model["metrics"].values()))
        expected_training_means = (
            dataset.iloc[train_indices][list(FEATURE_COLUMNS)].mean().tolist()
        )
        self.assertEqual(model["normalization_mean"], expected_training_means)

    def test_prediction_is_labelled_synthetic_only_and_attached_to_field_state_context(self):
        field_state = self._demo_field_state()
        prediction = predict_synthetic_yield(field_state)
        self.assertEqual(prediction["synthetic_demo_prediction"]["data_boundary"], "synthetic_demo_only")
        self.assertTrue(prediction["planning_context"]["constraints_unmodified"])
        payload = integrate_prediction_into_field_state(field_state)
        self.assertIn("synthetic_ml_prediction", payload)
        self.assertEqual(payload["synthetic_ml_status"], "synthetic_demo_only")
        self.assertTrue(payload["planning_context"]["constraints_unmodified"])

    def test_invalid_feature_input_is_rejected(self):
        with self.assertRaises(ValueError):
            generate_synthetic_yield_dataset(n_samples=3, seed=1)


if __name__ == "__main__":
    unittest.main()
