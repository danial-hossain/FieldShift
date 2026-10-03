import csv
import copy
import json
import tempfile
import unittest
from pathlib import Path

from src.data.farm_outcomes import ingest_farm_outcomes
from src.rl.outcomes import OUTCOME_RECORD_FIELDS


def caller_record(**overrides):
    record = {
        "event_id": "caller-event-1",
        "outcome_id": "caller-outcome-1",
        "field_id": "pseudonymous-field-01",
        "season_id": "season-2026-a",
        "episode_id": "episode-2026-a-01",
        "split": "train",
        "observation_timestamp": "2026-01-01T09:00:00+00:00",
        "decision_timestamp": "2026-01-01T09:30:00+00:00",
        "action_timestamp": "2026-01-01T10:00:00+00:00",
        "action_id": "irrigation_adjustment",
        "action_parameters": {"amount_mm": 4.0},
        "action_status": "confirmed_applied",
        "linked_action_event_id": "caller-event-1",
        "outcome_name": "measured_water_use",
        "outcome_value": 4.0,
        "outcome_unit": "mm/ha",
        "measurement_timestamp": "2026-01-02T10:00:00+00:00",
        "outcome_window_start": "2026-01-01T10:00:00+00:00",
        "outcome_window_end": "2026-01-03T10:00:00+00:00",
        "outcome_missing": False,
        "data_status": "observed",
        "source": "caller_field_meter",
        "provenance": {
            "source_id": "study-2026",
            "record_id": "measurement-0001",
            "data_status": "observed",
            "measurement_method": "calibrated meter protocol",
        },
        "measurement_method": "calibrated meter protocol",
        "missingness_flags": [],
        "data_quality_flags": [],
    }
    record.update(overrides)
    return record


def write_csv(path: Path, records, fields=None):
    fields = list(fields or OUTCOME_RECORD_FIELDS)
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for record in records:
            row = dict(record)
            for name in ("action_parameters", "provenance", "missingness_flags", "data_quality_flags"):
                if name in row and not isinstance(row[name], str):
                    row[name] = json.dumps(row[name])
            if "outcome_missing" in row:
                row["outcome_missing"] = str(row["outcome_missing"]).lower()
            writer.writerow(row)


class FarmOutcomeIngestionTests(unittest.TestCase):
    def test_valid_caller_mapping_records_are_imported_without_claiming_performance(self):
        source = [caller_record()]
        result = ingest_farm_outcomes(source)
        self.assertTrue(result.valid)
        self.assertEqual(result.record_count, 1)
        self.assertEqual(result.provenance_counts["observed"], 1)
        self.assertEqual(
            result.offline_evaluation.policy_performance_status,
            "refused_insufficient_or_invalid_observed_data",
        )
        self.assertFalse(result.to_dict()["policy_trained"])
        self.assertFalse(result.to_dict()["rewards_calculated"])

    def test_required_action_id_generators_are_reused_consistently(self):
        result = ingest_farm_outcomes(
            [caller_record()],
            required_action_ids=(action for action in ["irrigation_adjustment"]),
        )
        self.assertEqual(
            result.contract_validation.action_coverage["irrigation_adjustment"][
                "observed"
            ],
            1,
        )
        self.assertTrue(result.valid)

    def test_valid_csv_decodes_json_cells_and_preserves_raw_and_normalized_forms(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "caller-outcomes.csv"
            source = caller_record()
            write_csv(path, [source])
            result = ingest_farm_outcomes(path)

        self.assertTrue(result.valid)
        self.assertEqual(result.raw_csv_rows[0][0], "caller-event-1")
        raw_by_name = dict(zip(result.csv_columns, result.raw_csv_rows[0]))
        self.assertEqual(raw_by_name["outcome_value"], "4.0")
        normalized = dict(result.normalized_records[0])
        self.assertEqual(normalized["outcome_value"], 4.0)
        self.assertEqual(normalized["action_parameters"], {"amount_mm": 4.0})
        self.assertEqual(normalized["provenance"]["record_id"], "measurement-0001")

    def test_missing_and_extra_csv_columns_are_reported_and_rows_retained(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "schema.csv"
            fields = [field for field in OUTCOME_RECORD_FIELDS if field != "field_id"]
            fields.append("unexpected_column")
            row = caller_record()
            row["unexpected_column"] = "extra"
            write_csv(path, [row], fields=fields)
            result = ingest_farm_outcomes(path)

        self.assertFalse(result.valid)
        self.assertEqual(result.record_count, 1)
        self.assertEqual(result.raw_records[0]["unexpected_column"], "extra")
        self.assertTrue(any("missing required columns" in f.explanation for f in result.findings))
        self.assertTrue(any("unsupported extra columns" in f.explanation for f in result.findings))

    def test_duplicate_csv_headers_block_offline_groups(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "duplicate-header.csv"
            row = caller_record()
            with path.open("w", encoding="utf-8", newline="") as stream:
                writer = csv.writer(stream)
                writer.writerow([*OUTCOME_RECORD_FIELDS, "event_id"])
                writer.writerow(
                    [
                        json.dumps(value)
                        if name in {"action_parameters", "provenance", "missingness_flags", "data_quality_flags"}
                        else str(value).lower()
                        if name == "outcome_missing"
                        else value
                        for name, value in row.items()
                    ]
                    + ["duplicate-event-id"]
                )
            result = ingest_farm_outcomes(path)

        self.assertFalse(result.valid)
        self.assertTrue(
            all(not values for values in result.offline_evaluation.groups.values())
        )
        self.assertTrue(
            any("duplicate column names" in finding.explanation for finding in result.findings)
        )

    def test_malformed_timestamp_numeric_and_json_cells_are_findings(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "malformed.csv"
            row = caller_record()
            row["decision_timestamp"] = "not-a-time"
            row["outcome_value"] = "bad-number"
            row["provenance"] = "{broken-json"
            write_csv(path, [row])
            result = ingest_farm_outcomes(path)

        self.assertFalse(result.valid)
        self.assertEqual(result.normalized_records[0]["outcome_value"], "bad-number")
        self.assertEqual(result.normalized_records[0]["provenance"], "{broken-json")
        self.assertTrue(any(f.field == "decision_timestamp" for f in result.findings))
        self.assertTrue(any(f.field == "outcome_value" for f in result.findings))
        self.assertTrue(any(f.field == "provenance" for f in result.findings))

    def test_incompatible_units_and_duplicate_identifiers_are_rejected(self):
        one = caller_record(outcome_unit="liters")
        two = caller_record(
            field_id="pseudonymous-field-02",
            season_id="season-2026-b",
            event_id="caller-event-1",
            outcome_id="caller-outcome-1",
        )
        result = ingest_farm_outcomes([one, two])
        self.assertFalse(result.valid)
        self.assertTrue(any(f.field == "outcome_unit" for f in result.findings))
        self.assertTrue(any("Duplicate event_id" in f.explanation for f in result.findings))
        self.assertTrue(any("Duplicate outcome_id" in f.explanation for f in result.findings))

    def test_synthetic_demo_and_unknown_provenance_are_not_upgraded(self):
        synthetic = caller_record(
            data_status="synthetic",
            provenance={
                "source_id": "synthetic-demo",
                "record_id": "fixture-1",
                "data_status": "synthetic",
            },
        )
        unknown = caller_record(
            event_id="unknown-event",
            outcome_id="unknown-outcome",
            data_status="unknown",
            provenance={
                "source_id": "external-source",
                "record_id": "unknown-record",
                "data_status": "unknown",
            },
        )
        conflict = caller_record(
            event_id="conflict-event",
            outcome_id="conflict-outcome",
            provenance={
                "source_id": "external-source",
                "record_id": "record-conflict",
                "data_status": "synthetic",
            },
        )
        result = ingest_farm_outcomes([synthetic, unknown, conflict])
        self.assertEqual(result.provenance_counts["synthetic_demo"], 2)
        self.assertEqual(result.provenance_counts["unknown"], 1)
        self.assertEqual(result.normalized_records[1]["data_status"], "unknown")
        self.assertEqual(result.normalized_records[2]["data_status"], "observed")
        self.assertEqual(
            result.normalized_records[2]["provenance"]["data_status"], "synthetic"
        )
        self.assertTrue(
            any("will not upgrade" in finding.explanation for finding in result.findings)
        )
        self.assertFalse(result.valid)

    def test_planned_action_is_distinct_from_confirmed_action(self):
        planned = caller_record(
            event_id="planned-event",
            outcome_id=None,
            action_timestamp=None,
            action_status="planned",
            linked_action_event_id=None,
            outcome_name=None,
            outcome_value=None,
            outcome_unit=None,
            measurement_timestamp=None,
            outcome_window_start=None,
            outcome_window_end=None,
            outcome_missing=True,
            data_status="planned",
            source="milp_planner",
            provenance={
                "source_id": "rotation-planner",
                "record_id": "plan-record",
                "data_status": "planned",
                "planned_rotation": {"Spring": "Rice"},
            },
            measurement_method=None,
            missingness_flags=["outcome_value"],
        )
        result = ingest_farm_outcomes([planned])
        self.assertTrue(result.valid)
        self.assertEqual(result.provenance_counts["planned"], 1)
        self.assertEqual(result.contract_validation.observed_outcome_count, 0)
        self.assertEqual(len(result.offline_evaluation.groups["train"]), 0)

    def test_invalid_records_are_preserved_and_not_presented_as_evaluation_data(self):
        invalid = caller_record(outcome_value="non-numeric")
        result = ingest_farm_outcomes([invalid])
        self.assertFalse(result.valid)
        self.assertEqual(result.raw_records[0]["outcome_value"], "non-numeric")
        self.assertEqual(result.normalized_records[0]["outcome_value"], "non-numeric")
        self.assertEqual(result.contract_validation.valid_record_count, 0)
        self.assertTrue(
            all(not values for values in result.offline_evaluation.groups.values())
        )

    def test_structured_caller_inputs_are_not_mutated_and_result_is_detached(self):
        source = [caller_record()]
        original = copy.deepcopy(source)
        result = ingest_farm_outcomes(source)
        self.assertEqual(source, original)
        source[0]["action_parameters"]["amount_mm"] = 99
        self.assertEqual(result.normalized_records[0]["action_parameters"]["amount_mm"], 4.0)
        with self.assertRaises(TypeError):
            result.normalized_records[0]["source"] = "changed"

    def test_import_findings_and_report_are_deterministic(self):
        source = [caller_record(), caller_record(outcome_unit="invalid")]
        first = ingest_farm_outcomes(source).to_dict()
        second = ingest_farm_outcomes(source).to_dict()
        self.assertEqual(first, second)

    def test_explicit_output_path_refuses_overwrite_by_default(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "import.json"
            result = ingest_farm_outcomes([caller_record()])
            result.write_json(target)
            original = target.read_text(encoding="utf-8")
            with self.assertRaises(FileExistsError):
                result.write_json(target)
            self.assertEqual(target.read_text(encoding="utf-8"), original)
            result.write_json(target, overwrite=True)
            bundle = json.loads(target.read_text(encoding="utf-8"))
            self.assertEqual(bundle["import_report"]["record_count"], 1)
            self.assertFalse(bundle["import_report"]["rewards_calculated"])

    def test_relative_output_path_is_rejected(self):
        result = ingest_farm_outcomes([])
        with self.assertRaisesRegex(ValueError, "absolute"):
            result.write_json("relative.json")

    def test_empty_input_and_insufficient_observed_records_are_explicit(self):
        empty = ingest_farm_outcomes([])
        self.assertEqual(empty.record_count, 0)
        self.assertEqual(empty.contract_validation.observed_outcome_count, 0)
        self.assertEqual(empty.provenance_counts["unknown"], 0)
        self.assertIn(
            "refused_insufficient_or_invalid_observed_data",
            empty.offline_evaluation.policy_performance_status,
        )

    def test_empty_csv_and_nonexistent_csv_are_explicit_errors(self):
        with tempfile.TemporaryDirectory() as directory:
            empty_path = Path(directory) / "empty.csv"
            empty_path.write_text("", encoding="utf-8")
            result = ingest_farm_outcomes(empty_path)
            self.assertFalse(result.valid)
            self.assertEqual(result.record_count, 0)
            with self.assertRaises(FileNotFoundError):
                ingest_farm_outcomes(Path(directory) / "missing.csv")


if __name__ == "__main__":
    unittest.main()
