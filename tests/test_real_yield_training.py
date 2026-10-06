import io
import tempfile
import unittest
import zipfile
from pathlib import Path

import pandas as pd

from src.experiments.real_yield_training import (
    TARGET_COLUMN,
    compare_real_yield_models,
    load_icrisat_ethiopia_archive,
    train_real_yield_pilot,
)


def _trial_workbook() -> bytes:
    rows = []
    for site_number in range(4):
        for replicate in range(8):
            rows.append(
                {
                    "No.": f"site{site_number}-{replicate}",
                    "Country": "Ethiopia",
                    "Region/state": f"Region {site_number // 2}",
                    "LGA/District": f"District {site_number}",
                    "village/Kebele": f"Village {site_number}",
                    "Year": 2019,
                    "Crop": "Wheat",
                    "Variety": "Test variety",
                    "Planting date": pd.Timestamp("2019-06-01"),
                    "Altitude(m)": 2000 + site_number * 100,
                    "Crop system": "Wheat",
                    "Landscape strata": "Footslope",
                    "Treatment": f"Treatment {replicate % 2}",
                    "Soil type": "Vertisol",
                    "Yield (kg/ha)": 2000 + site_number * 100 + replicate * 50,
                }
            )
    buffer = io.BytesIO()
    pd.DataFrame(rows).to_excel(buffer, index=False, engine="openpyxl")
    return buffer.getvalue()


def _trial_archive(path: Path) -> Path:
    workbook = _trial_workbook()
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for member in (
            "Data/2014-2015_Wheat/001_2014-2015_Wheat_ICRISAT-AR_ETH.xlsx",
            "Data/2016_Wheat/002_2016_Wheat_ ICRISAT-AR_ETH.xlsx",
            "Data/2017_SorghumTef/003_2017_Sorghum+Tef_ ICRISAT-AR_ETH.xlsx",
            "Data/2019_Wheat/004_2019_Wheat_ ICRISAT-AR_ETH.xlsx",
        ):
            archive.writestr(member, workbook)
    return path


class RealYieldTrainingTests(unittest.TestCase):
    def test_archive_loader_converts_yield_and_preserves_source_groups(self):
        with tempfile.TemporaryDirectory() as directory:
            archive_path = _trial_archive(Path(directory) / "trial.zip")
            dataset, metadata = load_icrisat_ethiopia_archive(archive_path)

        self.assertEqual(len(dataset), 128)
        self.assertEqual(dataset[TARGET_COLUMN].iloc[0], 2.0)
        self.assertEqual(dataset["evidence_class"].unique().tolist(), ["observed_trial_record"])
        self.assertEqual(dataset["group_site"].nunique(), 4)
        self.assertEqual(metadata["country"], "Ethiopia")
        self.assertEqual(metadata["target_units"], "tonnes per hectare (converted from source kg/ha)")
        self.assertTrue(any("not Bangladesh farm data" in item for item in metadata["limitations"]))

    def test_grouped_model_comparison_holds_sites_out(self):
        with tempfile.TemporaryDirectory() as directory:
            archive_path = _trial_archive(Path(directory) / "trial.zip")
            dataset, _ = load_icrisat_ethiopia_archive(archive_path)

        report = compare_real_yield_models(dataset, max_splits=4)
        self.assertEqual(report["split_group"], "group_site")
        self.assertEqual(report["split_count"], 4)
        self.assertEqual(report["row_count"], 128)
        self.assertFalse(report["metrics_are_bangladesh_validation"])
        for result in report["candidate_models"].values():
            self.assertEqual(len(result["folds"]), 4)
            self.assertTrue(all(fold["held_out_sites"] for fold in result["folds"]))
            self.assertGreaterEqual(result["rmse_t_ha"], 0)

    def test_training_writes_separate_pilot_model_and_report(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            archive_path = _trial_archive(root / "trial.zip")
            report = train_real_yield_pilot(
                archive_path=archive_path,
                output_dir=root / "normalized",
                model_dir=root / "model",
            )

            self.assertEqual(report["rl_training_status"], "not_trained")
            self.assertTrue((root / "normalized" / "observed_yield_records.csv").is_file())
            self.assertTrue((root / "normalized" / "dataset_manifest.json").is_file())
            self.assertTrue((root / "model" / "icrisat_ethiopia_yield_pipeline.joblib").is_file())
            self.assertTrue((root / "model" / "training_report.json").is_file())

    def test_archive_loader_rejects_unexpected_or_missing_archives(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(FileNotFoundError):
                load_icrisat_ethiopia_archive(Path(directory) / "missing.zip")


if __name__ == "__main__":
    unittest.main()
