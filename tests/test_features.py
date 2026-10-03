import unittest

import numpy as np
import pandas as pd

from src.preprocessing.features import (
    CONTEXT_FEATURES,
    DERIVED_ENVIRONMENT_FEATURES,
    FEATURE_ORDER,
    RAW_ENVIRONMENT_FEATURES,
    SOIL_FEATURES,
    TEMPORAL_FEATURES,
    FeatureConfig,
    build_features,
)
from src.state.field_state import FieldState


def make_state(**overrides):
    values = {
        "field_id": "test_field",
        "as_of_date": "2026-09-29",
        "latitude": 23.8,
        "longitude": 90.4,
        "temperature": 31.0,
        "temp_max": 36.0,
        "temp_min": 25.0,
        "rainfall": 2.0,
        "humidity": 75.0,
        "wind_speed": 1.5,
        "solar_radiation": 18.0,
        "soil_moisture": 0.18,
        "nitrogen": 42.0,
        "phosphorus": 18.0,
        "potassium": 130.0,
        "ph": 6.4,
        "organic_matter": 2.1,
        "texture": "loam",
        "previous_crop": "Rice",
        "previous_crop_family": "Poaceae",
        "previous_crop_is_legume": False,
        "previous_yield": 4.0,
        "previous_irrigation": "high",
        "environment_observation_date": "2026-09-29",
        "soil_moisture_observation_date": "2026-09-29",
        "environment_source": "NASA_POWER",
        "soil_moisture_source": "demo",
        "soil_source": "demo",
        "crop_source": "demo",
        "history_source": "demo",
        "data_status": {
            "environment": "observed",
            "soil_moisture": "synthetic",
            "soil": "synthetic",
            "crop": "synthetic",
            "history": "synthetic",
        },
    }
    values.update(overrides)
    return FieldState(**values)


class FeatureTests(unittest.TestCase):
    def test_raw_state_values_and_context_are_preserved(self):
        state = make_state()
        features = build_features(state)
        for name in RAW_ENVIRONMENT_FEATURES:
            self.assertEqual(features[name], getattr(state, name))
        for name in SOIL_FEATURES:
            self.assertEqual(features[name], getattr(state, name))
        for name in CONTEXT_FEATURES:
            self.assertEqual(features[name], getattr(state, name))

    def test_temperature_range_is_calculated(self):
        features = build_features(make_state(temp_max=35, temp_min=21))
        self.assertEqual(features["temperature_range"], 14)

    def test_heat_threshold_is_configurable_and_strict(self):
        features = build_features(make_state(temperature=36))
        self.assertEqual(features["heat_stress_indicator"], 1)
        at_threshold = build_features(make_state(temperature=35))
        self.assertEqual(at_threshold["heat_stress_indicator"], 0)
        configured = build_features(
            make_state(temperature=31),
            config=FeatureConfig(heat_stress_threshold_c=30),
        )
        self.assertEqual(configured["heat_stress_indicator"], 1)

    def test_missing_temperature_keeps_range_and_heat_unknown(self):
        features = build_features(make_state(temperature=np.nan, temp_max=np.nan))
        self.assertTrue(np.isnan(features["temperature_range"]))
        self.assertTrue(np.isnan(features["heat_stress_indicator"]))

    def test_water_threshold_is_configurable(self):
        features = build_features(make_state(soil_moisture=0.19))
        self.assertEqual(features["water_stress_indicator"], 1)
        at_threshold = build_features(make_state(soil_moisture=0.20))
        self.assertEqual(at_threshold["water_stress_indicator"], 0)
        configured = build_features(
            make_state(soil_moisture=0.25),
            config=FeatureConfig(low_soil_moisture_threshold=0.30),
        )
        self.assertEqual(configured["water_stress_indicator"], 1)

    def test_missing_moisture_keeps_water_indicator_unknown(self):
        features = build_features(make_state(soil_moisture=np.nan))
        self.assertTrue(np.isnan(features["water_stress_indicator"]))

    def test_soil_and_previous_crop_context_is_preserved(self):
        features = build_features(make_state())
        self.assertEqual(
            [features[name] for name in SOIL_FEATURES],
            [42.0, 18.0, 130.0, 6.4, 2.1],
        )
        self.assertEqual(features["previous_crop"], "Rice")
        self.assertEqual(features["previous_crop_family"], "Poaceae")
        self.assertIs(features["previous_crop_is_legume"], False)
        self.assertEqual(features["previous_irrigation"], "high")

    def test_temperature_and_rainfall_changes_use_previous_valid_observation(self):
        environment = pd.DataFrame(
            [
                ["2026-09-28", 28.0, 5.0],
                ["2026-09-29", 99.0, 99.0],
                ["2026-09-30", 50.0, 50.0],
            ],
            columns=["date", "temperature", "rainfall"],
        )
        state = make_state()
        features = build_features(state, environmental_history=environment)
        self.assertEqual(features["temperature_change"], 3.0)
        self.assertEqual(features["rainfall_change"], -3.0)

    def test_soil_moisture_change_uses_previous_valid_smap_observation(self):
        smap = pd.DataFrame(
            [
                ["2026-09-27", 0.24, "demo", "synthetic"],
                ["2026-09-28", 0.22, "demo", "synthetic"],
                ["2026-09-29", 0.19, "demo", "synthetic"],
                ["2026-10-01", 0.10, "demo", "synthetic"],
            ],
            columns=["date", "soil_moisture", "source", "data_status"],
        )
        features = build_features(make_state(soil_moisture=0.18), smap_history=smap)
        self.assertAlmostEqual(features["soil_moisture_change"], -0.04)

    def test_missing_previous_observation_produces_nan_change(self):
        features = build_features(make_state())
        for name in ("temperature_change", "rainfall_change", "soil_moisture_change"):
            self.assertTrue(np.isnan(features[name]))

    def test_recent_means_use_dated_window_and_current_observation(self):
        environment = pd.DataFrame(
            [
                ["2026-09-22", 100.0, 100.0],
                ["2026-09-24", 27.0, 6.0],
                ["2026-09-27", 29.0, 4.0],
                ["2026-10-01", 200.0, 200.0],
            ],
            columns=["date", "temperature", "rainfall"],
        )
        smap = pd.DataFrame(
            [
                ["2026-09-25", 0.24, "demo", "synthetic"],
                ["2026-09-28", 0.20, "demo", "synthetic"],
                ["2026-10-01", 0.01, "demo", "synthetic"],
            ],
            columns=["date", "soil_moisture", "source", "data_status"],
        )
        features = build_features(
            make_state(),
            environmental_history=environment,
            smap_history=smap,
        )
        self.assertEqual(features["recent_mean_temperature"], (27 + 29 + 31) / 3)
        self.assertEqual(features["recent_mean_rainfall"], (6 + 4 + 2) / 3)
        self.assertAlmostEqual(features["recent_mean_soil_moisture"], (0.24 + 0.20 + 0.18) / 3)

    def test_insufficient_history_produces_nan_recent_mean(self):
        environment = pd.DataFrame(
            [["2026-09-29", 31.0, 2.0]],
            columns=["date", "temperature", "rainfall"],
        )
        features = build_features(
            make_state(), environmental_history=environment
        )
        self.assertTrue(np.isnan(features["recent_mean_temperature"]))
        self.assertTrue(np.isnan(features["recent_mean_rainfall"]))
        self.assertTrue(np.isnan(features["recent_mean_soil_moisture"]))

    def test_feature_order_is_deterministic(self):
        features = build_features(make_state())
        self.assertEqual(
            list(features),
            [*FEATURE_ORDER, "provenance"],
        )
        self.assertEqual(list(features["provenance"]), list(FEATURE_ORDER))

    def test_provenance_distinguishes_observed_synthetic_derived_and_unknown(self):
        environment = pd.DataFrame(
            [
                ["2026-09-28", 28.0, 5.0, "observed"],
                ["2026-09-29", 31.0, 2.0, "observed"],
            ],
            columns=["date", "temperature", "rainfall", "data_status"],
        )
        smap = pd.DataFrame(
            [
                ["2026-09-28", 0.20, "demo", "synthetic"],
                ["2026-09-29", 0.18, "demo", "synthetic"],
            ],
            columns=["date", "soil_moisture", "source", "data_status"],
        )
        features = build_features(
            make_state(),
            environmental_history=environment,
            smap_history=smap,
        )
        provenance = features["provenance"]
        self.assertEqual(provenance["temperature"], "observed")
        self.assertEqual(provenance["soil_moisture"], "synthetic")
        self.assertEqual(provenance["temperature_range"], "derived_from_observed")
        self.assertEqual(
            provenance["soil_moisture_change"], "derived_from_synthetic"
        )
        self.assertEqual(provenance["recent_mean_temperature"], "derived_from_observed")
        self.assertEqual(provenance["recent_mean_soil_moisture"], "derived_from_synthetic")

    def test_missing_values_have_unknown_provenance(self):
        features = build_features(
            make_state(
                temperature=np.nan,
                temp_max=np.nan,
                soil_moisture=np.nan,
                nitrogen=np.nan,
            )
        )
        provenance = features["provenance"]
        self.assertEqual(provenance["temperature"], "unknown")
        self.assertEqual(provenance["temperature_range"], "unknown")
        self.assertEqual(provenance["heat_stress_indicator"], "unknown")
        self.assertEqual(provenance["water_stress_indicator"], "unknown")
        self.assertEqual(provenance["nitrogen"], "unknown")

    def test_no_score_or_ranking_features_are_created(self):
        features = build_features(make_state())
        forbidden = {"overall_score", "suitability_score", "risk_score", "crop_score"}
        self.assertTrue(forbidden.isdisjoint(features))
        self.assertEqual(set(features) - {"provenance"}, set(FEATURE_ORDER))

    def test_config_rejects_invalid_window_and_threshold(self):
        with self.assertRaises(ValueError):
            FeatureConfig(recent_window_days=0)
        with self.assertRaises(ValueError):
            FeatureConfig(low_soil_moisture_threshold=1.1)


if __name__ == "__main__":
    unittest.main()
