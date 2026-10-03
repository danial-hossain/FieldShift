import tempfile
import unittest
from pathlib import Path

import numpy as np
import pandas as pd

from src.data.soil import SOIL_COLUMNS, load_soil_data


class SoilTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.csv_path = Path(self.temp_dir.name) / "soil.csv"
        pd.DataFrame(
            [
                [
                    "field_a", 23.8, 90.4, "", "", "", 6.2, "", "loam",
                    "lab", "observed", "2026-09-20"
                ],
                [
                    "field_a", 23.8, 90.4, 24, 10, 75, 6.0, 1.8, "loam",
                    "lab", "observed", "2026-10-05"
                ],
            ],
            columns=SOIL_COLUMNS,
        ).to_csv(self.csv_path, index=False)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_loads_soil_records_with_stable_schema_and_provenance(self):
        data = load_soil_data(self.csv_path, field_id="field_a")
        self.assertEqual(list(data.columns), SOIL_COLUMNS)
        self.assertEqual(data.loc[0, "source"], "lab")
        self.assertEqual(data.loc[0, "data_status"], "observed")
        self.assertEqual(data.loc[0, "texture"], "loam")

    def test_unknown_soil_values_stay_nan_not_zero(self):
        data = load_soil_data(self.csv_path, field_id="field_a")
        for nutrient in ("nitrogen", "phosphorus", "potassium"):
            self.assertTrue(np.isnan(data.loc[0, nutrient]))
        self.assertTrue(np.isnan(data.loc[0, "organic_matter"]))

    def test_rejects_p_h_outside_physical_range(self):
        invalid = pd.read_csv(self.csv_path, keep_default_na=False)
        invalid.loc[0, "ph"] = 14.1
        invalid.to_csv(self.csv_path, index=False)
        with self.assertRaisesRegex(ValueError, "pH"):
            load_soil_data(self.csv_path)

    def test_demo_soil_data_is_synthetic_and_cutoff_excludes_future(self):
        data = load_soil_data(as_of_date="2026-09-29")
        self.assertTrue(data["source"].eq("demo").all())
        self.assertTrue(data["data_status"].eq("synthetic").all())
        self.assertTrue((data["as_of_date"] <= pd.Timestamp("2026-09-29")).all())


if __name__ == "__main__":
    unittest.main()
