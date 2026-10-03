"""Synthetic temporary fixtures for the Phase 21 caller-data workflow."""

import csv
import json
import tempfile
import unittest
from pathlib import Path

from src.data.crops import load_crop_knowledge
from src.data.data_quality import build_data_quality_report
from src.data.farm_outcomes import ingest_farm_outcomes
from src.data.field_history import FIELD_HISTORY_COLUMNS, load_field_history
from src.data.smap import load_smap_data
from src.data.soil import SOIL_COLUMNS, load_soil_data
from src.rl.outcomes import OUTCOME_RECORD_FIELDS


def _observed_event(index, split):
    event_id = f"caller-event-{index}"
    month = index
    return {
        "event_id": event_id,
        "outcome_id": f"caller-outcome-{index}",
        "field_id": f"pseudonymous-field-{index}",
        "season_id": f"season-2026-{index}",
        "episode_id": f"episode-2026-{index}",
        "split": split,
        "observation_timestamp": f"2026-{month:02d}-01T08:00:00+00:00",
        "decision_timestamp": f"2026-{month:02d}-01T08:30:00+00:00",
        "action_timestamp": f"2026-{month:02d}-01T09:00:00+00:00",
        "action_id": "irrigation_application",
        "action_parameters": {"applied_depth": 12.5, "unit": "mm"},
        "action_status": "confirmed_applied",
        "linked_action_event_id": event_id,
        "outcome_name": "measured_water_use",
        "outcome_value": 12.5,
        "outcome_unit": "mm/ha",
        "measurement_timestamp": f"2026-{month:02d}-02T09:00:00+00:00",
        "outcome_window_start": f"2026-{month:02d}-01T09:00:00+00:00",
        "outcome_window_end": f"2026-{month:02d}-03T09:00:00+00:00",
        "outcome_missing": False,
        "data_status": "observed",
        "source": "caller_irrigation_meter",
        "provenance": {
            "source_id": "caller-study-2026",
            "record_id": f"meter-reading-{index}",
            "data_status": "observed",
            "measurement_method": "provider documented meter protocol",
        },
        "measurement_method": "provider documented meter protocol",
        "missingness_flags": [],
        "data_quality_flags": [],
    }


def _write_event_csv(path, records):
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=OUTCOME_RECORD_FIELDS)
        writer.writeheader()
        for source_record in records:
            row = dict(source_record)
            for name in (
                "action_parameters",
                "provenance",
                "missingness_flags",
                "data_quality_flags",
            ):
                row[name] = json.dumps(row[name], sort_keys=True)
            row["outcome_missing"] = str(row["outcome_missing"]).lower()
            writer.writerow(row)


def _write_csv(path, columns, row):
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=columns)
        writer.writeheader()
        writer.writerow(row)


class Phase21FarmDataIntegrationTests(unittest.TestCase):
    def test_bundled_context_sources_are_demo_not_farm_outcome_evidence(self):
        self.assertTrue(load_crop_knowledge()["data_status"].eq("synthetic").all())
        self.assertTrue(
            load_soil_data()["data_status"].eq("synthetic").all()
        )
        self.assertTrue(
            load_field_history()["data_status"].eq("synthetic").all()
        )
        smap = load_smap_data(
            23.8103,
            90.4125,
            "2026-09-25",
            "2026-09-27",
        )
        self.assertTrue(smap["data_status"].eq("synthetic").all())

        nasa_csv = (
            Path(__file__).resolve().parents[1]
            / "data"
            / "nasa_power"
            / "nasa_power_2025.csv"
        )
        with nasa_csv.open("r", encoding="utf-8", newline="") as stream:
            columns = set(next(csv.reader(stream)))
        self.assertIn("temperature", columns)
        self.assertNotIn("outcome_value", columns)
        self.assertNotIn("action_status", columns)

    def test_caller_context_and_realistic_action_outcome_csv_remain_separate(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            soil_path = root / "provider-soil.csv"
            history_path = root / "provider-history.csv"
            smap_path = root / "provider-moisture.csv"
            outcomes_path = root / "provider-actions-and-outcomes.csv"

            _write_csv(
                soil_path,
                SOIL_COLUMNS,
                {
                    "field_id": "pseudonymous-field-1",
                    "latitude": 23.81,
                    "longitude": 90.41,
                    "nitrogen": 42.0,
                    "phosphorus": 18.0,
                    "potassium": 130.0,
                    "ph": 6.4,
                    "organic_matter": 2.1,
                    "texture": "loam",
                    "source": "provider-soil-lab",
                    "data_status": "observed",
                    "as_of_date": "2025-12-01",
                },
            )
            _write_csv(
                history_path,
                FIELD_HISTORY_COLUMNS,
                {
                    "field_id": "pseudonymous-field-1",
                    "year": 2025,
                    "season": "Rabi",
                    "crop": "Lentil",
                    "yield": 1.4,
                    "irrigation": "low",
                    "source": "provider-field-log",
                    "data_status": "observed",
                },
            )
            _write_csv(
                smap_path,
                ["date", "latitude", "longitude", "soil_moisture", "source", "data_status"],
                {
                    "date": "2026-01-01",
                    "latitude": 23.81,
                    "longitude": 90.41,
                    "soil_moisture": 0.24,
                    "source": "provider-moisture-record",
                    "data_status": "observed",
                },
            )
            events = [
                _observed_event(1, "train"),
                _observed_event(2, "validation"),
                _observed_event(3, "test"),
            ]
            _write_event_csv(outcomes_path, events)
            source_bytes = {
                path: path.read_bytes()
                for path in (soil_path, history_path, smap_path, outcomes_path)
            }

            soil = load_soil_data(
                soil_path,
                field_id="pseudonymous-field-1",
                as_of_date="2026-01-01",
            )
            history = load_field_history(
                history_path,
                field_id="pseudonymous-field-1",
            )
            moisture = load_smap_data(
                23.81,
                90.41,
                "2026-01-01",
                "2026-01-01",
                csv_path=smap_path,
            )
            imported = ingest_farm_outcomes(
                outcomes_path,
                required_action_ids=["irrigation_application"],
            )
            quality = build_data_quality_report(
                imported,
                required_action_ids=["irrigation_application"],
                required_outcome_types=["measured_water_use"],
            ).to_dict()

            self.assertEqual(soil.iloc[0]["nitrogen"], 42.0)
            self.assertEqual(history.iloc[0]["yield"], 1.4)
            self.assertEqual(history.iloc[0]["irrigation"], "low")
            self.assertAlmostEqual(moisture.iloc[0]["soil_moisture"], 0.24)
            self.assertEqual(
                imported.normalized_records[0]["action_parameters"]["unit"],
                "mm",
            )
            self.assertEqual(
                imported.normalized_records[0]["outcome_unit"],
                "mm/ha",
            )
            self.assertEqual(quality["record_counts"]["evaluation_eligible"], 3)
            self.assertEqual(
                imported.offline_evaluation.policy_performance_status,
                "prepared_for_offline_analysis_no_performance_claim",
            )
            self.assertIn(
                "provenance_unverified",
                quality["record_classifications"][0]["categories"],
            )
            self.assertEqual(
                {path: path.read_bytes() for path in source_bytes},
                source_bytes,
            )

    def test_units_are_explicit_and_are_not_silently_converted(self):
        rows = [
            _observed_event(1, "train"),
            _observed_event(2, "validation"),
            _observed_event(3, "test"),
        ]
        rows[1]["outcome_unit"] = "L/ha"
        imported = ingest_farm_outcomes(rows)
        self.assertFalse(imported.valid)
        self.assertTrue(
            any(
                finding.field == "outcome_unit"
                for finding in imported.findings
            )
        )
        self.assertEqual(
            imported.normalized_records[1]["outcome_unit"],
            "L/ha",
        )
        self.assertTrue(
            all(not group for group in imported.offline_evaluation.groups.values())
        )

    def test_missing_unknown_planned_and_linkage_states_stay_distinct(self):
        rows = [
            _observed_event(1, "train"),
            _observed_event(2, "validation"),
            _observed_event(3, "test"),
        ]
        planned = _observed_event(4, "train")
        planned.update(
            {
                "outcome_id": None,
                "action_timestamp": None,
                "action_status": "planned",
                "linked_action_event_id": None,
                "outcome_name": None,
                "outcome_value": None,
                "outcome_unit": None,
                "measurement_timestamp": None,
                "outcome_window_start": None,
                "outcome_window_end": None,
                "outcome_missing": True,
                "data_status": "planned",
                "source": "caller_rotation_plan",
                "provenance": {
                    "source_id": "caller-plan-source",
                    "record_id": "plan-row-4",
                    "data_status": "planned",
                },
                "measurement_method": None,
                "missingness_flags": ["outcome_value"],
            }
        )
        missing_unknown = _observed_event(5, "train")
        missing_unknown.update(
            {
                "outcome_id": None,
                "action_status": "not_applied",
                "action_timestamp": None,
                "linked_action_event_id": None,
                "outcome_name": None,
                "outcome_value": None,
                "outcome_unit": None,
                "measurement_timestamp": None,
                "outcome_window_start": None,
                "outcome_window_end": None,
                "outcome_missing": True,
                "data_status": "missing",
                "source": "caller-log",
                "provenance": {
                    "source_id": "provider-source",
                    "record_id": "missing-row-5",
                    "data_status": "unknown",
                },
                "measurement_method": None,
                "missingness_flags": ["outcome_value"],
            }
        )
        imported = ingest_farm_outcomes([*rows, planned, missing_unknown])
        quality = build_data_quality_report(imported).to_dict()

        self.assertTrue(imported.valid)
        self.assertEqual(imported.provenance_counts["planned"], 1)
        self.assertEqual(imported.provenance_counts["unknown"], 1)
        self.assertEqual(imported.normalized_records[4]["outcome_value"], None)
        self.assertEqual(
            quality["record_counts"]["evaluation_eligible"],
            3,
        )
        self.assertEqual(quality["provenance_counts"]["planned"], 1)
        self.assertEqual(quality["provenance_counts"]["unknown"], 1)
        self.assertEqual(
            quality["field_season_flags"]["pseudonymous-field-5"]
            ["season-2026-5"]["missingness:outcome_value"],
            1,
        )
        exported_event_ids = {
            record["event_id"]
            for group in imported.offline_evaluation.groups.values()
            for record in group
        }
        self.assertNotIn("caller-event-4", exported_event_ids)
        self.assertNotIn("caller-event-5", exported_event_ids)

        unlinked = _observed_event(6, "train")
        unlinked["linked_action_event_id"] = "different-action-event"
        invalid = ingest_farm_outcomes([unlinked])
        self.assertFalse(invalid.valid)
        self.assertTrue(
            any(
                finding.field == "linked_action_event_id"
                for finding in invalid.findings
            )
        )

    def test_malformed_timestamps_and_duplicate_identifiers_are_refused(self):
        malformed = _observed_event(1, "train")
        malformed["decision_timestamp"] = "not-a-timestamp"
        duplicate = _observed_event(2, "validation")
        duplicate["event_id"] = malformed["event_id"]
        duplicate["linked_action_event_id"] = malformed["event_id"]
        imported = ingest_farm_outcomes([malformed, duplicate])
        self.assertFalse(imported.valid)
        self.assertTrue(
            any(finding.field == "decision_timestamp" for finding in imported.findings)
        )
        self.assertTrue(
            any("Duplicate event_id" in finding.explanation for finding in imported.findings)
        )
        self.assertFalse(
            any(imported.offline_evaluation.groups.values())
        )

    def test_insufficient_observed_coverage_is_reported_without_export_readiness(self):
        imported = ingest_farm_outcomes(
            [_observed_event(1, "train")],
            required_action_ids=["irrigation_application"],
        )
        quality = build_data_quality_report(
            imported,
            required_action_ids=["irrigation_application"],
        ).to_dict()
        self.assertTrue(imported.valid)
        self.assertEqual(
            imported.offline_evaluation.policy_performance_status,
            "refused_insufficient_or_invalid_observed_data",
        )
        self.assertEqual(quality["record_counts"]["evaluation_eligible"], 1)
        self.assertTrue(quality["evaluation_refusal_reasons"])
        self.assertEqual(quality["policy_performance"], "not_evaluated")


if __name__ == "__main__":
    unittest.main()
