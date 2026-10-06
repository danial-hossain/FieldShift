import csv
import tempfile
import unittest
from pathlib import Path

from src.data.pilot_data import (
    DEFAULT_TEMPLATE_DIRECTORY,
    PILOT_SCHEMAS,
    validate_pilot_csv,
    validate_pilot_dataset,
)


class PilotDataTests(unittest.TestCase):
    def write_dataset(self, directory, records=None):
        records = records or {}
        for filename, (columns, _) in PILOT_SCHEMAS.items():
            path = directory / filename
            with path.open("w", encoding="utf-8", newline="") as stream:
                writer = csv.DictWriter(stream, fieldnames=columns)
                writer.writeheader()
                writer.writerows(records.get(filename, []))

    @staticmethod
    def make_record(filename, **values):
        columns, _ = PILOT_SCHEMAS[filename]
        record = {column: "" for column in columns}
        record["record_method"] = "test fixture record"
        record["recorded_at"] = "2026-10-03T00:00:00+06:00"
        record.update(values)
        return record

    def test_checked_in_templates_have_exact_headers_and_no_records(self):
        for filename, (expected_columns, _) in PILOT_SCHEMAS.items():
            path = DEFAULT_TEMPLATE_DIRECTORY / filename
            with path.open("r", encoding="utf-8", newline="") as stream:
                reader = csv.reader(stream)
                self.assertEqual(tuple(next(reader)), expected_columns)
                self.assertEqual(list(reader), [])
        self.assertEqual(validate_pilot_dataset(DEFAULT_TEMPLATE_DIRECTORY), [])

    def test_unknown_or_malformed_template_is_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "field_registry.csv"
            path.write_text("field_id,unexpected\n", encoding="utf-8")
            errors = validate_pilot_csv(path)
        self.assertTrue(any("header does not match" in error for error in errors))

    def test_synthetic_records_cannot_be_labelled_as_observed(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            record = self.make_record(
                "field_registry.csv",
                field_id="field-x",
                evidence_class="synthetic",
                data_status="observed",
                source_id="demo-source",
            )
            self.write_dataset(directory, {"field_registry.csv": [record]})
            errors = validate_pilot_dataset(directory)
        self.assertTrue(
            any(
                "synthetic evidence with a non-synthetic data_status" in error
                for error in errors
            )
        )

    def test_observed_records_require_consent_and_method(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            record = self.make_record(
                "field_registry.csv",
                field_id="field-x",
                evidence_class="observed",
                data_status="observed",
                source_id="farm_field_partner_route",
                record_method="",
            )
            self.write_dataset(directory, {"field_registry.csv": [record]})
            errors = validate_pilot_dataset(directory)
        self.assertTrue(any("requires consent_record_id" in error for error in errors))
        self.assertTrue(any("missing record_method" in error for error in errors))

    def test_observed_consent_and_method_are_accepted(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            record = self.make_record(
                "field_registry.csv",
                field_id="field-x",
                evidence_class="observed",
                data_status="observed",
                source_id="farm_field_partner_route",
                consent_record_id="consent-ref",
                record_method="field boundary reviewed with participant",
            )
            self.write_dataset(directory, {"field_registry.csv": [record]})
            self.assertEqual(validate_pilot_dataset(directory), [])

    def test_primary_keys_must_be_unique(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            rows = [
                self.make_record(
                    "field_registry.csv",
                    field_id="duplicate-id",
                    evidence_class="synthetic",
                    data_status="synthetic",
                    source_id="demo-source",
                )
                for _ in range(2)
            ]
            self.write_dataset(directory, {"field_registry.csv": rows})
            errors = validate_pilot_dataset(directory)
        self.assertTrue(any("duplicate field_id" in error for error in errors))

    def test_reimported_duplicate_rows_in_one_batch_are_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            row = self.make_record(
                "field_registry.csv",
                field_id="same-field",
                evidence_class="synthetic",
                data_status="synthetic",
                source_id="fixture",
            )
            self.write_dataset(directory, {"field_registry.csv": [row, dict(row)]})
            errors = validate_pilot_dataset(directory)
        self.assertTrue(any("duplicate field_id" in error for error in errors))

    def test_conflicting_corrections_with_same_outcome_id_are_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            field = self.make_record(
                "field_registry.csv",
                field_id="field-x",
                evidence_class="synthetic",
                data_status="synthetic",
                source_id="fixture",
            )
            outcomes = [
                self.make_record(
                    "outcome_measurements.csv",
                    outcome_id="outcome-x",
                    field_id="field-x",
                    outcome_type="yield",
                    outcome_value=value,
                    outcome_unit="t/ha",
                    evidence_class="synthetic",
                    data_status="synthetic",
                    source_id="fixture",
                )
                for value in ("4.2", "4.8")
            ]
            self.write_dataset(
                directory,
                {
                    "field_registry.csv": [field],
                    "outcome_measurements.csv": outcomes,
                },
            )
            errors = validate_pilot_dataset(directory)
        self.assertTrue(any("duplicate outcome_id" in error for error in errors))

    def test_field_and_season_references_must_resolve(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            event = self.make_record(
                "management_events.csv",
                event_id="event-x",
                field_id="missing-field",
                season_id="missing-season",
                evidence_class="synthetic",
                data_status="synthetic",
                source_id="demo-source",
            )
            self.write_dataset(directory, {"management_events.csv": [event]})
            errors = validate_pilot_dataset(directory)
        self.assertTrue(any("unknown field_id" in error for error in errors))
        self.assertTrue(any("unknown season_id" in error for error in errors))

    def test_recalled_and_direct_observations_remain_distinct(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            registry = self.make_record(
                "field_registry.csv",
                field_id="field-x",
                evidence_class="observed",
                data_status="observed",
                source_id="farm_field_partner_route",
                consent_record_id="consent-ref",
                record_method="field record review",
            )
            season = self.make_record(
                "crop_seasons.csv",
                season_id="season-x",
                field_id="field-x",
                evidence_class="recalled",
                data_status="observed",
                source_id="farm_field_partner_route",
                consent_record_id="consent-ref",
                record_method="participant interview; dates recalled",
            )
            self.write_dataset(
                directory,
                {
                    "field_registry.csv": [registry],
                    "crop_seasons.csv": [season],
                },
            )
            self.assertEqual(validate_pilot_dataset(directory), [])
            self.assertEqual(season["evidence_class"], "recalled")
            self.assertEqual(registry["evidence_class"], "observed")

    def test_remote_and_modelled_context_labels_are_preserved(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            remote = self.make_record(
                "field_registry.csv",
                field_id="field-remote",
                evidence_class="remote_observed",
                data_status="observed",
                source_id="nasa_power_daily_point_api",
            )
            modelled = self.make_record(
                "field_registry.csv",
                field_id="field-modelled",
                evidence_class="modelled_context",
                data_status="observed",
                source_id="soilgrids_global_predictions",
            )
            self.write_dataset(directory, {"field_registry.csv": [remote, modelled]})
            self.assertEqual(validate_pilot_dataset(directory), [])
            self.assertEqual(remote["evidence_class"], "remote_observed")
            self.assertEqual(modelled["evidence_class"], "modelled_context")

    def test_template_file_width_must_match_header(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "field_registry.csv"
            columns = PILOT_SCHEMAS["field_registry.csv"][0]
            path.write_text(",".join(columns) + "\nfield-1\n", encoding="utf-8")
            errors = validate_pilot_csv(path)
        self.assertTrue(any("has 1 cells" in error for error in errors))

    def test_timestamps_must_use_iso_format(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "field_registry.csv"
            record = self.make_record(
                "field_registry.csv",
                field_id="field-x",
                evidence_class="synthetic",
                data_status="synthetic",
                source_id="local_field_history_demo_csv",
                recorded_at="not-a-timestamp",
            )
            with path.open("w", encoding="utf-8", newline="") as stream:
                writer = csv.DictWriter(stream, fieldnames=PILOT_SCHEMAS["field_registry.csv"][0])
                writer.writeheader()
                writer.writerow(record)
            errors = validate_pilot_csv(path)
        self.assertTrue(any("invalid ISO recorded_at" in error for error in errors))

    def test_malformed_and_non_finite_numeric_values_are_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            record = self.make_record(
                "field_registry.csv",
                field_id="field-x",
                field_area_ha="NaN",
                centroid_latitude_deg="91",
                evidence_class="synthetic",
                data_status="synthetic",
                source_id="fixture",
            )
            self.write_dataset(directory, {"field_registry.csv": [record]})
            errors = validate_pilot_dataset(directory)
        self.assertTrue(any("non-finite field_area_ha" in error for error in errors))
        self.assertTrue(any("centroid_latitude_deg must be between" in error for error in errors))

    def test_populated_measurements_require_units_and_observed_outcome_method(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            field = self.make_record(
                "field_registry.csv",
                field_id="field-x",
                evidence_class="observed",
                data_status="observed",
                source_id="farm_field_partner_route",
                consent_record_id="consent-ref",
            )
            outcome = self.make_record(
                "outcome_measurements.csv",
                outcome_id="outcome-x",
                field_id="field-x",
                outcome_type="harvested yield",
                outcome_value="4.2",
                outcome_unit="",
                evidence_class="observed",
                data_status="observed",
                source_id="farm_field_partner_route",
                consent_record_id="consent-ref",
                measurement_method="",
            )
            self.write_dataset(
                directory,
                {
                    "field_registry.csv": [field],
                    "outcome_measurements.csv": [outcome],
                },
            )
            errors = validate_pilot_dataset(directory)
        self.assertTrue(any("requires outcome_unit" in error for error in errors))
        self.assertTrue(any("requires measurement_method" in error for error in errors))

    def test_invalid_numeric_measurements_and_unitless_values_are_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            field = self.make_record(
                "field_registry.csv",
                field_id="field-x",
                evidence_class="synthetic",
                data_status="synthetic",
                source_id="fixture",
            )
            soil = self.make_record(
                "soil_observations.csv",
                soil_observation_id="soil-x",
                field_id="field-x",
                sample_depth_top_cm="30",
                sample_depth_bottom_cm="10",
                analyte="pH",
                analyte_value="not-a-number",
                unit="",
                evidence_class="synthetic",
                data_status="synthetic",
                source_id="fixture",
            )
            self.write_dataset(
                directory,
                {"field_registry.csv": [field], "soil_observations.csv": [soil]},
            )
            errors = validate_pilot_dataset(directory)
        self.assertTrue(any("non-numeric analyte_value" in error for error in errors))
        self.assertTrue(any("requires unit" in error for error in errors))
        self.assertTrue(any("sample depth bottom is above its top" in error for error in errors))

    def test_units_cannot_vary_silently_within_an_outcome_series(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            field = self.make_record(
                "field_registry.csv",
                field_id="field-x",
                evidence_class="synthetic",
                data_status="synthetic",
                source_id="fixture",
            )
            outcomes = [
                self.make_record(
                    "outcome_measurements.csv",
                    outcome_id=f"outcome-{index}",
                    field_id="field-x",
                    season_id="season-x",
                    outcome_type="harvested yield",
                    outcome_value=value,
                    outcome_unit=unit,
                    evidence_class="synthetic",
                    data_status="synthetic",
                    source_id="fixture",
                )
                for index, (value, unit) in enumerate(
                    (("4.2", "t/ha"), ("4200", "kg/ha"))
                )
            ]
            self.write_dataset(
                directory,
                {
                    "field_registry.csv": [field],
                    "outcome_measurements.csv": outcomes,
                },
            )
            errors = validate_pilot_dataset(directory)
        self.assertTrue(
            any("inconsistent outcome_unit" in error for error in errors)
        )

    def test_missing_source_and_evidence_class_are_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            row = self.make_record(
                "field_registry.csv",
                field_id="field-x",
                evidence_class="",
                data_status="observed",
                source_id="",
            )
            self.write_dataset(directory, {"field_registry.csv": [row]})
            errors = validate_pilot_dataset(directory)
        self.assertTrue(any("invalid evidence_class" in error for error in errors))
        self.assertTrue(any("missing source_id" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
