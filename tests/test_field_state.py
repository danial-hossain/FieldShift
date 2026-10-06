import unittest

import numpy as np
import pandas as pd

from src.data.crops import load_crop_knowledge
from src.data.field_history import FIELD_HISTORY_COLUMNS, load_field_history
from src.data.smap import SMAP_COLUMNS, load_smap_data
from src.data.soil import SOIL_COLUMNS, load_soil_data
from src.state.field_state import (
    FieldState,
    NASA_POWER_COLUMNS,
    build_field_state,
)


def sample_power():
    return pd.DataFrame(
        [
            ["2026-09-28", 28.2, 33.0, 22.0, 8.2, 80.0, 1.5, 19.0],
            ["2026-09-29", 30.1, 34.0, 24.0, 2.1, 75.0, 1.2, 18.0],
            ["2026-10-01", 31.0, 35.0, 25.0, 1.0, 70.0, 1.0, 17.0],
        ],
        columns=NASA_POWER_COLUMNS,
    )


def demo_inputs():
    return (
        load_smap_data(23.8103, 90.4125, "2026-09-25", "2026-09-29"),
        load_soil_data(field_id="field_001"),
        load_field_history(field_id="field_001"),
        load_crop_knowledge(),
    )


class FieldStateTests(unittest.TestCase):
    def build(self, **overrides):
        smap, soil, history, crops = demo_inputs()
        arguments = {
            "field_id": "field_001",
            "latitude": 23.8103,
            "longitude": 90.4125,
            "decision_date": "2026-09-29",
            "nasa_power_data": sample_power(),
            "smap_data": smap,
            "soil_data": soil,
            "field_history_data": history,
            "crop_knowledge": crops,
            "field_size_ha": 10.0,
        }
        arguments.update(overrides)
        return build_field_state(**arguments)

    def test_basic_construction(self):
        state = self.build()
        self.assertIsInstance(state, FieldState)
        self.assertEqual(state.field_id, "field_001")
        self.assertEqual(state.as_of_date, pd.Timestamp("2026-09-29"))
        self.assertEqual(state.latitude, 23.8103)
        self.assertEqual(state.longitude, 90.4125)

    def test_nasa_power_values_are_mapped_from_latest_observation_on_or_before_date(self):
        state = self.build()
        self.assertEqual(state.temperature, 30.1)
        self.assertEqual(state.temp_max, 34.0)
        self.assertEqual(state.temp_min, 24.0)
        self.assertEqual(state.rainfall, 2.1)
        self.assertEqual(state.humidity, 75.0)
        self.assertEqual(state.wind_speed, 1.2)
        self.assertEqual(state.solar_radiation, 18.0)
        self.assertEqual(
            state.environment_observation_date,
            pd.Timestamp("2026-09-29"),
        )

    def test_smap_moisture_mapping_and_provenance(self):
        state = self.build()
        self.assertEqual(state.soil_moisture, 0.22)
        self.assertEqual(state.soil_moisture_source, "demo")
        self.assertEqual(state.data_status["soil_moisture"], "synthetic")
        self.assertEqual(
            state.soil_moisture_observation_date,
            pd.Timestamp("2026-09-27"),
        )

    def test_soil_values_and_provenance_are_mapped(self):
        state = self.build()
        self.assertEqual(state.nitrogen, 42.0)
        self.assertEqual(state.phosphorus, 18.0)
        self.assertEqual(state.potassium, 130.0)
        self.assertEqual(state.ph, 6.4)
        self.assertEqual(state.organic_matter, 2.1)
        self.assertEqual(state.texture, "loam")
        self.assertEqual(state.soil_source, "demo")
        self.assertEqual(state.data_status["soil"], "synthetic")

    def test_latest_previous_crop_and_knowledge_are_mapped(self):
        state = self.build()
        self.assertEqual(state.previous_crop, "Rice")
        self.assertEqual(state.previous_crop_family, "Poaceae")
        self.assertFalse(state.previous_crop_is_legume)
        self.assertEqual(state.previous_yield, 4.0)
        self.assertEqual(state.previous_irrigation, "high")
        self.assertEqual(state.previous_crop_year, 2025)
        self.assertEqual(state.history_source, "demo")
        self.assertEqual(state.crop_source, "demo")
        self.assertEqual(state.data_status["history"], "synthetic")
        self.assertEqual(state.data_status["crop"], "synthetic")

    def test_no_future_or_current_year_history_leakage(self):
        history = pd.DataFrame(
            [
                ["field_001", 2025, "Rabi", "Lentil", 1.2, "low", "recorded", "observed"],
                ["field_001", 2026, "Aus", "Rice", 9.0, "high", "future", "observed"],
                ["field_001", 2027, "Rabi", "Wheat", 10.0, "medium", "future", "observed"],
            ],
            columns=FIELD_HISTORY_COLUMNS,
        )
        state = self.build(field_history_data=history)
        self.assertEqual(state.previous_crop, "Lentil")
        self.assertEqual(state.previous_crop_year, 2025)
        self.assertNotEqual(state.history_source, "future")

    def test_missing_observations_remain_nan(self):
        empty_smap = pd.DataFrame(columns=SMAP_COLUMNS)
        soil = pd.DataFrame(
            [
                [
                    "field_001", 23.8103, 90.4125, np.nan, np.nan, np.nan,
                    np.nan, np.nan, "", "lab", "observed", "2026-09-20"
                ]
            ],
            columns=SOIL_COLUMNS,
        )
        power = sample_power().iloc[0:0]
        state = self.build(
            nasa_power_data=power,
            smap_data=empty_smap,
            soil_data=soil,
            field_history_data=pd.DataFrame(columns=FIELD_HISTORY_COLUMNS),
        )
        self.assertTrue(np.isnan(state.temperature))
        self.assertTrue(np.isnan(state.rainfall))
        self.assertTrue(np.isnan(state.soil_moisture))
        self.assertTrue(np.isnan(state.nitrogen))
        self.assertTrue(np.isnan(state.previous_yield))
        self.assertIsNone(state.previous_crop)
        self.assertEqual(state.data_status["environment"], "missing")
        self.assertEqual(state.data_status["soil_moisture"], "missing")

    def test_provenance_distinguishes_observed_and_synthetic_sources(self):
        state = self.build()
        self.assertEqual(state.environment_source, "NASA_POWER")
        self.assertEqual(state.data_status["environment"], "observed")
        self.assertEqual(state.soil_moisture_source, "demo")
        self.assertEqual(state.soil_source, "demo")
        self.assertEqual(state.history_source, "demo")

    def test_invalid_location_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "latitude"):
            self.build(latitude=91)
        with self.assertRaisesRegex(ValueError, "longitude"):
            self.build(longitude=181)

    def test_field_state_rejects_invalid_measurements_and_date(self):
        with self.assertRaisesRegex(ValueError, "rainfall"):
            FieldState("field_001", "2026-09-29", 0, 0, rainfall=-1)
        with self.assertRaisesRegex(ValueError, "soil_moisture"):
            FieldState("field_001", "2026-09-29", 0, 0, soil_moisture=1.2)
        with self.assertRaisesRegex(ValueError, "pH"):
            FieldState("field_001", "2026-09-29", 0, 0, ph=14.1)
        with self.assertRaisesRegex(ValueError, "valid date"):
            self.build(decision_date="not-a-date")

    def test_to_dict_order_and_round_trip_are_deterministic(self):
        state = self.build()
        serialized = state.to_dict()
        expected = [
            "field_id",
            "as_of_date",
            "latitude",
            "longitude",
            "field_size_ha",
            "temperature",
            "temp_max",
            "temp_min",
            "rainfall",
            "humidity",
            "wind_speed",
            "solar_radiation",
            "soil_moisture",
            "nitrogen",
            "phosphorus",
            "potassium",
            "ph",
            "organic_matter",
            "texture",
            "previous_crop",
            "previous_crop_family",
            "previous_crop_is_legume",
            "previous_yield",
            "previous_irrigation",
            "environment_observation_date",
            "soil_moisture_observation_date",
            "soil_as_of_date",
            "previous_crop_year",
            "previous_crop_season",
            "environment_source",
            "soil_moisture_source",
            "soil_source",
            "crop_source",
            "history_source",
            "data_status",
        ]
        self.assertEqual(list(serialized), expected)
        restored = FieldState.from_dict(serialized)
        self.assertEqual(restored.to_dict(), serialized)

    def test_default_loaders_can_build_state_from_nasa_frame(self):
        state = build_field_state(
            "field_001",
            23.8103,
            90.4125,
            "2026-09-29",
            sample_power(),
        )
        self.assertEqual(state.soil_source, "demo")
        self.assertEqual(state.previous_crop, "Rice")


if __name__ == "__main__":
    unittest.main()
