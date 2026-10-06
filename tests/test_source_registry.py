import csv
import tempfile
import unittest
from pathlib import Path

from src.data.source_registry import (
    ACQUISITION_COLUMNS,
    REGISTRY_COLUMNS,
    validate_source_registry,
)

ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "data" / "source_registry.csv"
ACQUISITION_PATH = ROOT / "data" / "acquisition_log.csv"


def read_rows(path):
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


class SourceRegistryTests(unittest.TestCase):
    def setUp(self):
        self.registry_rows = read_rows(REGISTRY_PATH)
        self.acquisition_rows = read_rows(ACQUISITION_PATH)

    def validate_rows(self, registry_rows=None, acquisition_rows=None):
        with tempfile.TemporaryDirectory() as directory:
            registry_path = Path(directory) / "source_registry.csv"
            acquisition_path = Path(directory) / "acquisition_log.csv"
            self.write_rows(
                registry_path, REGISTRY_COLUMNS, registry_rows or self.registry_rows
            )
            self.write_rows(
                acquisition_path,
                ACQUISITION_COLUMNS,
                acquisition_rows or self.acquisition_rows,
            )
            return validate_source_registry(registry_path, acquisition_path)

    @staticmethod
    def write_rows(path, columns, rows):
        with path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=columns)
            writer.writeheader()
            writer.writerows(rows)

    def registry_record(self, source_id):
        return next(
            row for row in self.registry_rows if row["source_id"] == source_id
        )

    def test_checked_in_registry_and_tracker_are_valid(self):
        self.assertEqual(validate_source_registry(REGISTRY_PATH, ACQUISITION_PATH), [])

    def test_source_ids_are_nonempty_and_unique(self):
        rows = [dict(row) for row in self.registry_rows]
        rows[0]["source_id"] = ""
        rows[1]["source_id"] = rows[2]["source_id"]
        errors = self.validate_rows(registry_rows=rows)
        self.assertTrue(any("empty source_id" in error for error in errors))
        self.assertTrue(any("duplicate source_id" in error for error in errors))

    def test_invalid_evidence_and_validation_statuses_are_rejected(self):
        rows = [dict(row) for row in self.registry_rows]
        rows[0]["evidence_class"] = "measured"
        rows[0]["validation_status"] = "approved"
        errors = self.validate_rows(registry_rows=rows)
        self.assertTrue(any("invalid evidence_class" in error for error in errors))
        self.assertTrue(any("invalid validation_status" in error for error in errors))

    def test_missing_required_column_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            registry_path = Path(directory) / "registry.csv"
            acquisition_path = Path(directory) / "acquisition.csv"
            columns = [column for column in REGISTRY_COLUMNS if column != "license"]
            rows = [
                {column: row[column] for column in columns}
                for row in self.registry_rows
            ]
            self.write_rows(registry_path, columns, rows)
            self.write_rows(
                acquisition_path, ACQUISITION_COLUMNS, self.acquisition_rows
            )
            errors = validate_source_registry(registry_path, acquisition_path)
        self.assertTrue(any("missing required columns: license" in error for error in errors))

    def test_verified_sources_require_meta_details(self):
        rows = [dict(row) for row in self.registry_rows]
        rows[0]["verification_notes"] = ""
        rows[0]["allowed_uses"] = ""
        rows[0]["validation_status"] = "metadata_verified"
        errors = self.validate_rows(registry_rows=rows)
        self.assertTrue(any("requires verification_notes" in error for error in errors))
        self.assertTrue(any("requires allowed_uses" in error for error in errors))

    def test_remote_or_modelled_sources_need_access_url(self):
        rows = [dict(row) for row in self.registry_rows]
        rows[0]["access_url"] = ""
        errors = self.validate_rows(registry_rows=rows)
        self.assertTrue(any("requires a non-empty access_url" in error for error in errors))

    def test_demo_data_remains_synthetic_and_not_observed(self):
        demo_ids = (
            "local_smap_demo_csv",
            "local_soil_demo_csv",
            "local_crop_knowledge_demo_csv",
            "local_field_history_demo_csv",
        )
        for source_id in demo_ids:
            self.assertEqual(self.registry_record(source_id)["evidence_class"], "synthetic")
        rows = [dict(row) for row in self.registry_rows]
        next(row for row in rows if row["source_id"] == "local_soil_demo_csv")[
            "evidence_class"
        ] = "observed"
        errors = self.validate_rows(registry_rows=rows)
        self.assertTrue(
            any("local_soil_demo_csv must retain" in error for error in errors)
        )

    def test_remote_and_modelled_sources_are_not_relabelled_as_field_observed(self):
        rows = [dict(row) for row in self.registry_rows]
        next(row for row in rows if row["source_id"] == "soilgrids_global_predictions")[
            "evidence_class"
        ] = "observed"
        errors = self.validate_rows(registry_rows=rows)
        self.assertTrue(
            any("soilgrids_global_predictions must retain" in error for error in errors)
        )

    def test_unverified_details_are_not_filled_with_assumptions(self):
        bmd = self.registry_record("bmd_station_data_candidate")
        self.assertEqual(bmd["product_version"], "")
        self.assertEqual(bmd["coverage_start"], "")
        self.assertEqual(bmd["coverage_end"], "")
        self.assertEqual(bmd["license"], "")
        self.assertIn("pending verification", bmd["known_limitations"])
        self.assertTrue(all(row["status"] == "not_started" for row in self.acquisition_rows))

    def test_acquisition_ids_and_statuses_are_validated(self):
        rows = [dict(row) for row in self.acquisition_rows]
        rows[0]["source_id"] = "not_registered"
        rows[1]["status"] = "approved"
        rows[2]["request_id"] = rows[1]["request_id"]
        errors = self.validate_rows(acquisition_rows=rows)
        self.assertTrue(any("unregistered source_id" in error for error in errors))
        self.assertTrue(any("invalid status" in error for error in errors))
        self.assertTrue(any("duplicate request_id" in error for error in errors))

    def test_verified_request_requires_actual_confirmation_fields(self):
        rows = [dict(row) for row in self.acquisition_rows]
        rows[0]["status"] = "verified"
        errors = self.validate_rows(acquisition_rows=rows)
        self.assertTrue(
            any("verified request" in error and "response_date" in error for error in errors)
        )

    def test_extra_csv_fields_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            registry_path = Path(directory) / "registry.csv"
            acquisition_path = Path(directory) / "acquisition.csv"
            registry_path.write_text(
                REGISTRY_PATH.read_text(encoding="utf-8").rstrip("\n")
                + ",unexpected\n",
                encoding="utf-8",
            )
            self.write_rows(
                acquisition_path, ACQUISITION_COLUMNS, self.acquisition_rows
            )
            errors = validate_source_registry(registry_path, acquisition_path)
        self.assertTrue(any("does not match the header width" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
