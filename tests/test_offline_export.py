import csv
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from src.data.farm_outcomes import ingest_farm_outcomes
from src.data.offline_export import export_offline_evaluation
from src.rl.outcomes import OUTCOME_RECORD_FIELDS


def record(index, split, **changes):
    month = index
    event_id = f"event-{index}"
    value = {
        "event_id": event_id,
        "outcome_id": f"outcome-{index}",
        "field_id": f"field-{index}",
        "season_id": f"season-{index}",
        "episode_id": f"episode-{index}",
        "split": split,
        "observation_timestamp": f"2026-{month:02d}-01T09:00:00+00:00",
        "decision_timestamp": f"2026-{month:02d}-01T09:30:00+00:00",
        "action_timestamp": f"2026-{month:02d}-01T10:00:00+00:00",
        "action_id": "irrigation",
        "action_parameters": {"amount_mm": 5.0},
        "action_status": "confirmed_applied",
        "linked_action_event_id": event_id,
        "outcome_name": "measured_water_use",
        "outcome_value": float(index),
        "outcome_unit": "mm/ha",
        "measurement_timestamp": f"2026-{month:02d}-02T10:00:00+00:00",
        "outcome_window_start": f"2026-{month:02d}-01T10:00:00+00:00",
        "outcome_window_end": f"2026-{month:02d}-03T10:00:00+00:00",
        "outcome_missing": False,
        "data_status": "observed",
        "source": "caller-meter",
        "provenance": {
            "source_id": "test-source",
            "record_id": f"measurement-{index}",
            "data_status": "observed",
        },
        "measurement_method": "synthetic test method",
        "missingness_flags": [],
        "data_quality_flags": [],
    }
    value.update(changes)
    return value


def three_split_records():
    return [
        record(1, "train"),
        record(2, "validation"),
        record(3, "test"),
    ]


def write_csv(path: Path, records):
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=OUTCOME_RECORD_FIELDS)
        writer.writeheader()
        for source in records:
            row = dict(source)
            for name in (
                "action_parameters",
                "provenance",
                "missingness_flags",
                "data_quality_flags",
            ):
                row[name] = json.dumps(row[name])
            row["outcome_missing"] = str(row["outcome_missing"]).lower()
            writer.writerow(row)


class OfflineExportTests(unittest.TestCase):
    def test_identical_inputs_write_byte_identical_deterministic_exports(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = three_split_records()
            imported = ingest_farm_outcomes(source)
            first = root / "first.json"
            second = root / "second.json"
            first_result = export_offline_evaluation(imported, first)
            second_result = export_offline_evaluation(imported, second)

            self.assertTrue(first_result.written)
            self.assertEqual(first.read_bytes(), second.read_bytes())
            payload = json.loads(first.read_text(encoding="utf-8"))
            self.assertEqual(payload["status"], "exported_no_performance_claim")
            self.assertNotIn("created_at", payload)
            self.assertEqual(
                payload["counts"]["by_split"],
                {"train": 1, "validation": 1, "test": 1},
            )

    def test_csv_sha256_matches_original_source_bytes(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "caller.csv"
            target = Path(directory) / "export.json"
            write_csv(source, three_split_records())
            expected = hashlib.sha256(source.read_bytes()).hexdigest()
            result = export_offline_evaluation(source, target)

            self.assertTrue(result.written)
            payload = json.loads(target.read_text(encoding="utf-8"))
            self.assertEqual(payload["source"]["sha256"], expected)
            self.assertEqual(payload["source"]["kind"], "csv")

    def test_csv_input_bytes_are_unchanged_by_export(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "caller.csv"
            target = Path(directory) / "export.json"
            write_csv(source, three_split_records())
            original = source.read_bytes()
            export_offline_evaluation(source, target)
            self.assertEqual(source.read_bytes(), original)

    def test_train_validation_test_partitions_are_separate_and_stable_sorted(self):
        records = [
            record(2, "train"),
            record(1, "validation"),
            record(3, "test"),
            record(1, "train", event_id="event-train-a", outcome_id="outcome-a",
                   field_id="field-a", season_id="season-a", episode_id="episode-a",
                   linked_action_event_id="event-train-a"),
        ]
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "export.json"
            result = export_offline_evaluation(records, target)
            self.assertTrue(result.written)
            payload = json.loads(target.read_text(encoding="utf-8"))
        self.assertEqual(
            set(payload["partitions"]),
            {"train", "validation", "test"},
        )
        self.assertEqual(
            [item["event_id"] for item in payload["partitions"]["train"]],
            ["event-2", "event-train-a"],
        )
        self.assertEqual(payload["counts"]["by_action"], {"irrigation": 4})

    def test_refused_or_incomplete_preparation_writes_no_dataset(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "refused.json"
            imported = ingest_farm_outcomes([record(1, "train")])
            result = export_offline_evaluation(imported, target)
            self.assertFalse(result.written)
            self.assertEqual(result.status, "refused")
            self.assertFalse(target.exists())
            self.assertTrue(result.report["dataset_refusal_reasons"])
            self.assertEqual(result.report["partitions"], {
                "train": [],
                "validation": [],
                "test": [],
            })

    def test_csv_import_export_preserves_explicit_required_action_refusal(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "caller.csv"
            target = Path(directory) / "must-not-exist.json"
            write_csv(source, three_split_records())
            imported = ingest_farm_outcomes(
                source,
                required_action_ids=["required-but-absent"],
            )
            self.assertEqual(
                imported.offline_evaluation.policy_performance_status,
                "refused_insufficient_or_invalid_observed_data",
            )
            result = export_offline_evaluation(imported, target)

            self.assertFalse(result.written)
            self.assertEqual(result.status, "refused")
            self.assertFalse(target.exists())
            self.assertTrue(result.report["dataset_refusal_reasons"])

    def test_nonobserved_planned_and_missing_records_never_export(self):
        nonobserved = [
            record(
                1,
                "train",
                data_status="synthetic",
                provenance={
                    "source_id": "synthetic",
                    "record_id": "fixture-1",
                    "data_status": "synthetic",
                },
            ),
            record(
                2,
                "validation",
                data_status="planned",
                action_status="planned",
                action_timestamp=None,
                outcome_id=None,
                linked_action_event_id=None,
                outcome_name=None,
                outcome_value=None,
                outcome_unit=None,
                measurement_timestamp=None,
                outcome_window_start=None,
                outcome_window_end=None,
                outcome_missing=True,
                measurement_method=None,
                missingness_flags=["outcome_value"],
                provenance={
                    "source_id": "planner",
                    "record_id": "plan-2",
                    "data_status": "planned",
                },
            ),
            record(
                3,
                "test",
                data_status="unknown",
                provenance={
                    "source_id": "external",
                    "record_id": "record-3",
                    "data_status": "unknown",
                },
            ),
            record(
                4,
                "train",
                action_status="not_applied",
                action_timestamp=None,
                outcome_id=None,
                linked_action_event_id=None,
                outcome_name=None,
                outcome_value=None,
                outcome_unit=None,
                measurement_timestamp=None,
                outcome_window_start=None,
                outcome_window_end=None,
                outcome_missing=True,
                measurement_method=None,
                missingness_flags=["outcome_value"],
            ),
        ]
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "not-ready.json"
            result = export_offline_evaluation(nonobserved, target)
            self.assertFalse(result.written)
            self.assertFalse(target.exists())
        self.assertEqual(
            result.report["counts"]["evaluation_eligible_records"],
            0,
        )

    def test_export_contains_only_validated_groups_and_excludes_non_evidence(self):
        records = three_split_records()
        records.extend(
            [
                record(
                    4,
                    "train",
                    data_status="synthetic",
                    field_id="field-synthetic",
                    season_id="season-synthetic",
                    event_id="event-synthetic",
                    outcome_id="outcome-synthetic",
                    linked_action_event_id="event-synthetic",
                    provenance={
                        "source_id": "synthetic-source",
                        "record_id": "synthetic-1",
                        "data_status": "synthetic",
                    },
                ),
                record(
                    5,
                    "train",
                    data_status="demo",
                    field_id="field-demo",
                    season_id="season-demo",
                    event_id="event-demo",
                    outcome_id="outcome-demo",
                    linked_action_event_id="event-demo",
                    provenance={
                        "source_id": "demo-source",
                        "record_id": "demo-1",
                        "data_status": "demo",
                    },
                ),
                record(
                    6,
                    "validation",
                    data_status="planned",
                    action_status="planned",
                    action_timestamp=None,
                    field_id="field-planned",
                    season_id="season-planned",
                    event_id="event-planned",
                    outcome_id=None,
                    linked_action_event_id=None,
                    outcome_name=None,
                    outcome_value=None,
                    outcome_unit=None,
                    measurement_timestamp=None,
                    outcome_window_start=None,
                    outcome_window_end=None,
                    outcome_missing=True,
                    measurement_method=None,
                    missingness_flags=["outcome_value"],
                    provenance={
                        "source_id": "planner",
                        "record_id": "plan-1",
                        "data_status": "planned",
                    },
                ),
                record(
                    7,
                    "test",
                    data_status="missing",
                    action_status="confirmed_applied",
                    field_id="field-unknown",
                    season_id="season-unknown",
                    event_id="event-unknown",
                    outcome_id=None,
                    linked_action_event_id=None,
                    outcome_name=None,
                    outcome_value=None,
                    outcome_unit=None,
                    measurement_timestamp=None,
                    outcome_window_start=None,
                    outcome_window_end=None,
                    outcome_missing=True,
                    measurement_method=None,
                    missingness_flags=["outcome_value"],
                    provenance={
                        "source_id": "caller",
                        "record_id": "unknown-1",
                        "data_status": "missing",
                    },
                ),
                record(
                    8,
                    "train",
                    data_status="missing",
                    action_status="not_applied",
                    action_timestamp=None,
                    field_id="field-unapplied",
                    season_id="season-unapplied",
                    event_id="event-unapplied",
                    outcome_id=None,
                    linked_action_event_id=None,
                    outcome_name=None,
                    outcome_value=None,
                    outcome_unit=None,
                    measurement_timestamp=None,
                    outcome_window_start=None,
                    outcome_window_end=None,
                    outcome_missing=True,
                    measurement_method=None,
                    missingness_flags=["outcome_value"],
                    provenance={
                        "source_id": "caller",
                        "record_id": "unapplied-1",
                        "data_status": "missing",
                    },
                ),
            ]
        )
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "filtered-export.json"
            result = export_offline_evaluation(records, target)
            self.assertTrue(result.written)
            payload = json.loads(target.read_text(encoding="utf-8"))

        exported_ids = {
            row["event_id"]
            for split_records in payload["partitions"].values()
            for row in split_records
        }
        self.assertEqual(exported_ids, {"event-1", "event-2", "event-3"})
        self.assertEqual(payload["counts"]["evaluation_eligible_records"], 3)
        self.assertEqual(
            payload["counts"]["by_split"],
            {"train": 1, "validation": 1, "test": 1},
        )

    def test_duplicate_ids_split_leakage_and_invalid_timestamps_refuse_export(self):
        bad = record(
            1,
            "train",
            decision_timestamp="bad-time",
        )
        duplicate = record(2, "test", event_id="event-1", outcome_id="outcome-1")
        leakage = record(
            3,
            "test",
            field_id="field-1",
            season_id="season-1",
        )
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "invalid.json"
            result = export_offline_evaluation([bad, duplicate, leakage], target)
        self.assertFalse(result.written)
        self.assertFalse(target.exists())
        fields = [finding["field"] for finding in result.report["validation_findings"]]
        self.assertIn("decision_timestamp", fields)
        self.assertTrue(
            any("Duplicate event_id" in item["explanation"]
                for item in result.report["validation_findings"])
        )
        self.assertGreater(
            result.report["quality_summary"]["diagnostic_counts"]["duplicate_identifiers"],
            0,
        )
        self.assertGreater(
            result.report["quality_summary"]["diagnostic_counts"]["split_leakage"],
            0,
        )

    def test_overwrite_refusal_and_explicit_overwrite(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "export.json"
            target.write_text("preserve", encoding="utf-8")
            with self.assertRaises(FileExistsError):
                export_offline_evaluation(three_split_records(), target)
            self.assertEqual(target.read_text(encoding="utf-8"), "preserve")
            result = export_offline_evaluation(
                three_split_records(),
                target,
                overwrite=True,
            )
            self.assertTrue(result.written)
            self.assertEqual(
                json.loads(target.read_text(encoding="utf-8"))["status"],
                "exported_no_performance_claim",
            )

    def test_input_output_collision_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "caller.csv"
            write_csv(source, three_split_records())
            with self.assertRaisesRegex(ValueError, "must not refer"):
                export_offline_evaluation(source, source)

    def test_atomic_write_failure_cleans_temporary_file(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            target = root / "export.json"
            with patch("src.data.offline_export.os.replace", side_effect=OSError("simulated replace failure")):
                with self.assertRaisesRegex(OSError, "simulated replace failure"):
                    export_offline_evaluation(
                        three_split_records(),
                        target,
                        overwrite=True,
                    )
            self.assertFalse(target.exists())
            self.assertEqual(list(root.glob("*.tmp")), [])
            self.assertEqual(list(root.glob(".*.tmp")), [])

    def test_source_records_are_immutable_and_export_order_is_deterministic(self):
        records = three_split_records()
        original = json.dumps(records, sort_keys=True)
        with tempfile.TemporaryDirectory() as directory:
            target1 = Path(directory) / "a.json"
            target2 = Path(directory) / "b.json"
            shuffled = [records[2], records[0], records[1]]
            export_offline_evaluation(records, target1)
            export_offline_evaluation(shuffled, target2)
            self.assertEqual(target1.read_bytes(), target2.read_bytes())
        self.assertEqual(json.dumps(records, sort_keys=True), original)

    def test_created_timestamp_is_optional_and_requires_timezone(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "with-time.json"
            result = export_offline_evaluation(
                three_split_records(),
                target,
                created_at="2026-10-03T09:00:00+06:00",
            )
            self.assertEqual(
                result.report["created_at"],
                "2026-10-03T09:00:00+06:00",
            )
            with self.assertRaisesRegex(ValueError, "timezone"):
                export_offline_evaluation(
                    three_split_records(),
                    Path(directory) / "bad-time.json",
                    created_at="2026-10-03T09:00:00",
                )


if __name__ == "__main__":
    unittest.main()
