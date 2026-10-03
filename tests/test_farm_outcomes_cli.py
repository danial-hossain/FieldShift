import contextlib
import csv
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from src.data.farm_outcomes import ingest_farm_outcomes
from src.data.farm_outcomes_cli import (
    EXIT_ARGUMENT_ERROR,
    EXIT_INPUT_ERROR,
    EXIT_OK,
    EXIT_OUTPUT_ERROR,
    EXIT_VALIDATION_ERROR,
    main,
)
from src.data.data_quality import build_data_quality_report
from src.rl.outcomes import OUTCOME_RECORD_FIELDS


def valid_record():
    return {
        "event_id": "event-cli-1",
        "outcome_id": "outcome-cli-1",
        "field_id": "pseudonymous-cli-field",
        "season_id": "season-cli",
        "episode_id": "episode-cli",
        "split": "train",
        "observation_timestamp": "2026-01-01T09:00:00+00:00",
        "decision_timestamp": "2026-01-01T09:30:00+00:00",
        "action_timestamp": "2026-01-01T10:00:00+00:00",
        "action_id": "irrigation",
        "action_parameters": {"amount_mm": 5.0},
        "action_status": "confirmed_applied",
        "linked_action_event_id": "event-cli-1",
        "outcome_name": "measured_water_use",
        "outcome_value": 5.0,
        "outcome_unit": "mm/ha",
        "measurement_timestamp": "2026-01-02T10:00:00+00:00",
        "outcome_window_start": "2026-01-01T10:00:00+00:00",
        "outcome_window_end": "2026-01-03T10:00:00+00:00",
        "outcome_missing": False,
        "data_status": "observed",
        "source": "caller_meter",
        "provenance": {
            "source_id": "cli-test",
            "record_id": "measurement-cli-1",
            "data_status": "observed",
        },
        "measurement_method": "meter protocol",
        "missingness_flags": [],
        "data_quality_flags": [],
    }


def write_csv(path: Path, record, *, alter=None):
    records = record if isinstance(record, list) else [record]
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=OUTCOME_RECORD_FIELDS)
        writer.writeheader()
        for source_record in records:
            row = dict(source_record)
            if alter:
                row.update(alter)
            for key in ("action_parameters", "provenance", "missingness_flags", "data_quality_flags"):
                row[key] = json.dumps(row[key])
            row["outcome_missing"] = str(row["outcome_missing"]).lower()
            writer.writerow(row)


class FarmOutcomesCliTests(unittest.TestCase):
    def invoke(self, args):
        stdout = io.StringIO()
        stderr = io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            status = main(args)
        return status, stdout.getvalue(), stderr.getvalue()

    def test_deterministic_json_output_for_equivalent_input(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "caller.csv"
            first = Path(directory) / "report-one.json"
            second = Path(directory) / "report-two.json"
            write_csv(source, valid_record())
            status1, _, _ = self.invoke([str(source), "--output", str(first)])
            status2, _, _ = self.invoke([str(source), "--output", str(second)])

            self.assertEqual(status1, EXIT_OK)
            self.assertEqual(status2, EXIT_OK)
            self.assertEqual(first.read_bytes(), second.read_bytes())
            report = json.loads(first.read_text(encoding="utf-8"))
            self.assertEqual(report["counts"]["total"], 1)
            self.assertEqual(report["counts"]["valid"], 1)
            self.assertEqual(report["counts"]["invalid"], 0)
            self.assertEqual(report["counts"]["measurement_linked"], 1)
            self.assertEqual(report["counts"]["evaluation_eligible"], 1)
            self.assertEqual(
                report["offline_evaluation"]["dataset_readiness"], "refused"
            )
            self.assertEqual(
                report["limitations"]["caller_provenance_authenticity"],
                "not_independently_established",
            )

    def test_stdout_is_json_but_does_not_dump_raw_record_fields(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "caller.csv"
            write_csv(
                source,
                valid_record(),
                alter={"action_parameters": {"private_note": "raw-secret-placeholder"}},
            )
            status, stdout, stderr = self.invoke([str(source)])
        self.assertEqual(status, EXIT_OK)
        report = json.loads(stdout)
        self.assertEqual(stderr, "")
        self.assertFalse(report["limitations"]["raw_records_included"])
        self.assertNotIn("raw-secret-placeholder", stdout)

    def test_malformed_csv_writes_findings_and_returns_validation_error(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "malformed.csv"
            output = Path(directory) / "report.json"
            write_csv(
                source,
                valid_record(),
                alter={"decision_timestamp": "not-a-time"},
            )
            status, _, stderr = self.invoke(
                [str(source), "--output", str(output)]
            )
            report = json.loads(output.read_text(encoding="utf-8"))
        self.assertEqual(status, EXIT_VALIDATION_ERROR)
        self.assertIn("validation error", stderr)
        self.assertEqual(report["ingestion"]["status"], "invalid")
        self.assertGreater(report["counts"]["invalid"], 0)
        self.assertTrue(report["ingestion"]["findings"])
        self.assertEqual(report["counts"]["measurement_linked"], 0)

    def test_missing_and_unreadable_inputs_have_input_error_code(self):
        with tempfile.TemporaryDirectory() as directory:
            missing = Path(directory) / "missing.csv"
            status, _, stderr = self.invoke([str(missing)])
            self.assertEqual(status, EXIT_INPUT_ERROR)
            self.assertIn("input error", stderr)

            existing = Path(directory) / "existing.csv"
            write_csv(existing, valid_record())
            with patch(
                "src.data.farm_outcomes._parse_csv",
                side_effect=PermissionError("permission denied"),
            ):
                status, _, stderr = self.invoke([str(existing)])
            self.assertEqual(status, EXIT_INPUT_ERROR)
            self.assertIn("permission denied", stderr)

    def test_output_existing_requires_explicit_overwrite(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "caller.csv"
            output = Path(directory) / "report.json"
            write_csv(source, valid_record())
            output.write_text("keep-me", encoding="utf-8")
            status, _, stderr = self.invoke([str(source), "--output", str(output)])
            self.assertEqual(status, EXIT_OUTPUT_ERROR)
            self.assertIn("--overwrite", stderr)
            self.assertEqual(output.read_text(encoding="utf-8"), "keep-me")

            status, _, _ = self.invoke(
                [str(source), "--output", str(output), "--overwrite"]
            )
            self.assertEqual(status, EXIT_OK)
            self.assertEqual(
                json.loads(output.read_text(encoding="utf-8"))["ingestion"]["status"],
                "valid",
            )

    def test_invalid_output_locations_and_input_output_collision_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "caller.csv"
            write_csv(source, valid_record())
            missing_parent = Path(directory) / "missing" / "report.json"
            status, _, stderr = self.invoke(
                [str(source), "--output", str(missing_parent)]
            )
            self.assertEqual(status, EXIT_OUTPUT_ERROR)
            self.assertIn("does not exist", stderr)
            status, _, stderr = self.invoke(
                [str(source), "--output", str(source), "--overwrite"]
            )
            self.assertEqual(status, EXIT_OUTPUT_ERROR)
            self.assertIn("must not refer to the input", stderr)

    def test_argument_errors_have_argparse_exit_code(self):
        stderr = io.StringIO()
        with contextlib.redirect_stderr(stderr):
            with self.assertRaises(SystemExit) as error:
                main([])
        self.assertEqual(error.exception.code, EXIT_ARGUMENT_ERROR)
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as error:
                main(["some.csv", "--overwrite"])
        self.assertEqual(error.exception.code, EXIT_ARGUMENT_ERROR)

    def test_report_does_not_write_outside_selected_destination(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "caller.csv"
            output = root / "selected" / "report.json"
            output.parent.mkdir()
            write_csv(source, valid_record())
            before = {str(path.relative_to(root)) for path in root.rglob("*")}
            status, _, _ = self.invoke([str(source), "--output", str(output)])
            after = {str(path.relative_to(root)) for path in root.rglob("*")}
        self.assertEqual(status, EXIT_OK)
        self.assertEqual(after - before, {"selected\\report.json"})

    def test_existing_ingestion_and_quality_apis_remain_usable(self):
        record = valid_record()
        direct_import = ingest_farm_outcomes([record])
        direct_quality = build_data_quality_report(direct_import)
        self.assertTrue(direct_import.valid)
        self.assertEqual(direct_quality.to_dict()["record_counts"]["total_input"], 1)
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "caller.csv"
            write_csv(source, record)
            status, stdout, _ = self.invoke([str(source)])
        self.assertEqual(status, EXIT_OK)
        self.assertEqual(json.loads(stdout)["counts"]["total"], 1)

    def test_evaluation_export_option_writes_only_when_dataset_is_ready(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "ready.csv"
            export = root / "evaluation.json"
            records = []
            for index, split in enumerate(("train", "validation", "test"), start=1):
                event_id = f"cli-event-{index}"
                row = valid_record()
                row.update({
                    "event_id": event_id,
                    "outcome_id": f"cli-outcome-{index}",
                    "field_id": f"cli-field-{index}",
                    "season_id": f"cli-season-{index}",
                    "episode_id": f"cli-episode-{index}",
                    "split": split,
                    "linked_action_event_id": event_id,
                    "observation_timestamp": f"2026-0{index}-01T09:00:00+00:00",
                    "decision_timestamp": f"2026-0{index}-01T09:30:00+00:00",
                    "action_timestamp": f"2026-0{index}-01T10:00:00+00:00",
                    "measurement_timestamp": f"2026-0{index}-02T10:00:00+00:00",
                    "outcome_window_start": f"2026-0{index}-01T10:00:00+00:00",
                    "outcome_window_end": f"2026-0{index}-03T10:00:00+00:00",
                    "provenance": {
                        "source_id": "cli-test-source",
                        "record_id": f"cli-measurement-{index}",
                        "data_status": "observed",
                    },
                })
                records.append(row)
            write_csv(source, records)
            status, stdout, stderr = self.invoke(
                [str(source), "--export-evaluation", str(export)]
            )
            payload = json.loads(export.read_text(encoding="utf-8"))
        self.assertEqual(status, EXIT_OK)
        self.assertEqual(stderr, "")
        self.assertEqual(payload["status"], "exported_no_performance_claim")
        self.assertEqual(
            payload["counts"]["by_split"],
            {"train": 1, "validation": 1, "test": 1},
        )
        self.assertEqual(json.loads(stdout)["offline_evaluation"]["dataset_readiness"],
                         "prepared_for_offline_analysis_no_performance_claim")

    def test_cli_refuses_to_write_export_when_offline_preparation_is_refused(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "incomplete.csv"
            export = Path(directory) / "must-not-exist.json"
            write_csv(source, valid_record())
            status, stdout, stderr = self.invoke(
                [str(source), "--export-evaluation", str(export)]
            )
            report = json.loads(stdout)
        self.assertEqual(status, EXIT_VALIDATION_ERROR)
        self.assertFalse(export.exists())
        self.assertIn("evaluation export refused", stderr)
        self.assertTrue(report["offline_evaluation"]["refusal_reasons"])

    def test_cli_export_overwrite_requires_export_argument(self):
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as error:
                main(["input.csv", "--export-overwrite"])
        self.assertEqual(error.exception.code, EXIT_ARGUMENT_ERROR)


if __name__ == "__main__":
    unittest.main()
