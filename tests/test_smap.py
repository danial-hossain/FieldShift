import tempfile
import unittest
from pathlib import Path

import numpy as np
import pandas as pd

from src.data.smap import SMAP_COLUMNS, load_smap_data


class SmapTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.csv_path = Path(self.temp_dir.name) / "smap.csv"
        pd.DataFrame(
            [
                ["2026-09-25", 23.8103, 90.4125, "0.24", "NASA_SMAP", "observed"],
                ["2026-09-26", 23.8103, 90.4125, "", "NASA_SMAP", "observed"],
            ],
            columns=SMAP_COLUMNS,
        ).to_csv(self.csv_path, index=False)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_loads_csv_with_deterministic_columns_and_provenance(self):
        data = load_smap_data(
            23.8103, 90.4125, "2026-09-25", "2026-09-26", self.csv_path
        )
        self.assertEqual(list(data.columns), SMAP_COLUMNS)
        self.assertEqual(data.loc[0, "source"], "NASA_SMAP")
        self.assertEqual(data.loc[0, "data_status"], "observed")
        self.assertEqual(data.loc[0, "soil_moisture"], 0.24)

    def test_missing_moisture_remains_nan_and_is_marked_missing(self):
        data = load_smap_data(
            23.8103, 90.4125, "2026-09-25", "2026-09-26", self.csv_path
        )
        self.assertTrue(np.isnan(data.loc[1, "soil_moisture"]))
        self.assertEqual(data.loc[1, "data_status"], "missing")

    def test_invalid_coordinates_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "latitude"):
            load_smap_data(91, 90, "2026-09-25", "2026-09-26", self.csv_path)
        with self.assertRaisesRegex(ValueError, "longitude"):
            load_smap_data(23, 181, "2026-09-25", "2026-09-26", self.csv_path)

    def test_no_matching_observation_returns_explicit_missing_record(self):
        data = load_smap_data(
            0, 0, "2026-09-25", "2026-09-26", self.csv_path
        )
        self.assertEqual(len(data), 1)
        self.assertTrue(np.isnan(data.loc[0, "soil_moisture"]))
        self.assertEqual(data.loc[0, "source"], "missing")
        self.assertEqual(data.loc[0, "data_status"], "missing")

    def test_bundled_demo_data_is_marked_synthetic(self):
        data = load_smap_data(
            23.8103, 90.4125, "2026-09-25", "2026-09-27"
        )
        self.assertTrue(data["source"].eq("demo").all())
        self.assertTrue(data["data_status"].eq("synthetic").all())


if __name__ == "__main__":
    unittest.main()
