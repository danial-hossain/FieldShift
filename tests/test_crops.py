import tempfile
import unittest
from pathlib import Path

import pandas as pd

from src.data.crops import (
    CROP_COLUMNS,
    REQUIRED_CROPS,
    load_crop_knowledge,
    validate_crop_knowledge,
)


class CropKnowledgeTests(unittest.TestCase):
    def test_all_required_crops_and_fields_are_available(self):
        crops = load_crop_knowledge()
        crop_set = set(crops["crop"])
        for required in REQUIRED_CROPS:
            self.assertIn(required, crop_set)
        self.assertEqual(list(crops.columns), CROP_COLUMNS)
        for column in CROP_COLUMNS:
            self.assertIn(column, crops.columns)
        self.assertTrue(crops["source"].eq("demo").all())
        self.assertTrue(crops["data_status"].eq("synthetic").all())

    def test_legume_flags_match_demo_crop_records(self):
        crops = load_crop_knowledge().set_index("crop")
        self.assertTrue(crops.loc["Lentil", "is_legume"])
        self.assertTrue(crops.loc["Mungbean", "is_legume"])
        for crop in ("Rice", "Wheat", "Maize", "Mustard", "Potato"):
            self.assertFalse(crops.loc[crop, "is_legume"])

    def test_invalid_temperature_range_is_rejected(self):
        crops = load_crop_knowledge()
        crops.loc[crops["crop"] == "Rice", "min_temperature"] = 40
        with self.assertRaisesRegex(ValueError, "min_temperature"):
            validate_crop_knowledge(crops)

    def test_economic_values_can_be_unknown_and_remain_nan(self):
        crops = load_crop_knowledge()
        crops.loc[crops["crop"] == "Rice", "market_price"] = float("nan")
        normalized = validate_crop_knowledge(crops)
        rice_price = normalized.loc[normalized["crop"] == "Rice", "market_price"].iloc[0]
        self.assertTrue(pd.isna(rice_price))


if __name__ == "__main__":
    unittest.main()
