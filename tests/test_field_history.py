import tempfile
import unittest
from pathlib import Path

import numpy as np
import pandas as pd

from src.data.field_history import FIELD_HISTORY_COLUMNS, load_field_history


class FieldHistoryTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.csv_path = Path(self.temp_dir.name) / "history.csv"
        pd.DataFrame(
            [
                ["field_a", 2024, "Aus", "Rice", 4.2, "high", "farm_log", "observed"],
                ["field_a", 2024, "Rabi", "Lentil", "", "low", "farm_log", "observed"],
                ["field_a", 2025, "Aus", "Rice", 4.0, "high", "farm_log", "observed"],
            ],
            columns=FIELD_HISTORY_COLUMNS,
        ).to_csv(self.csv_path, index=False)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_loads_multiple_records_and_preserves_provenance(self):
        history = load_field_history(self.csv_path, field_id="field_a")
        self.assertEqual(list(history.columns), FIELD_HISTORY_COLUMNS)
        self.assertEqual(len(history), 3)
        self.assertTrue(history["source"].eq("farm_log").all())
        self.assertTrue(history["data_status"].eq("observed").all())

    def test_missing_yield_remains_nan_not_zero(self):
        history = load_field_history(self.csv_path, field_id="field_a")
        lentil = history.loc[history["crop"] == "Lentil", "yield"].iloc[0]
        self.assertTrue(np.isnan(lentil))

    def test_as_of_filter_excludes_same_and_future_decision_year(self):
        history = load_field_history(self.csv_path, as_of_date="2025-06-01")
        self.assertEqual(set(history["year"]), {2024})

    def test_bundled_history_is_synthetic(self):
        history = load_field_history()
        self.assertTrue(history["source"].eq("demo").all())
        self.assertTrue(history["data_status"].eq("synthetic").all())


if __name__ == "__main__":
    unittest.main()
