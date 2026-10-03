import copy
import unittest

from src.data.data_quality import build_data_quality_report
from src.data.farm_outcomes import ingest_farm_outcomes
from src.rl.outcomes import prepare_offline_evaluation_data


def outcome_record(**changes):
    record = {
        "event_id": "event-1",
        "outcome_id": "outcome-1",
        "field_id": "pseudonymous-field-1",
        "season_id": "season-2026-a",
        "episode_id": "episode-1",
        "split": "train",
        "observation_timestamp": "2026-01-01T09:00:00+00:00",
        "decision_timestamp": "2026-01-01T09:30:00+00:00",
        "action_timestamp": "2026-01-01T10:00:00+00:00",
        "action_id": "irrigation",
        "action_parameters": {"amount_mm": 5.0},
        "action_status": "confirmed_applied",
        "linked_action_event_id": "event-1",
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
            "source_id": "caller-study",
            "record_id": "measurement-1",
            "data_status": "observed",
        },
        "measurement_method": "meter protocol",
        "missingness_flags": [],
        "data_quality_flags": [],
    }
    record.update(changes)
    return record


class FarmDataQualityTests(unittest.TestCase):
    def test_empty_dataset_has_clear_empty_report(self):
        report = build_data_quality_report()
        data = report.to_dict()
        self.assertEqual(data["record_counts"], {
            "total_input": 0,
            "valid": 0,
            "invalid": 0,
            "evaluation_eligible": 0,
        })
        self.assertEqual(data["provenance_counts"]["unknown"], 0)
        self.assertIn("No input records were supplied.", data["coverage_warnings"])
        self.assertEqual(data["evaluation_status"], "refused_insufficient_or_invalid_observed_data")

    def test_report_is_deterministic_and_does_not_mutate_input(self):
        source = [outcome_record()]
        original = copy.deepcopy(source)
        first = build_data_quality_report(source).to_dict()
        second = build_data_quality_report(source).to_dict()
        self.assertEqual(first, second)
        self.assertEqual(source, original)
        self.assertEqual(first["caller_declarations_authenticity"], "not_independently_established")
        self.assertEqual(first["causal_effects"], "not_estimated")
        self.assertEqual(first["policy_performance"], "not_evaluated")

    def test_provenance_classes_are_separate_and_observed_is_unverified(self):
        synthetic = outcome_record(
            event_id="synthetic-event",
            outcome_id="synthetic-outcome",
            data_status="synthetic",
            provenance={
                "source_id": "synthetic-fixture",
                "record_id": "fixture-1",
                "data_status": "synthetic",
            },
        )
        planned = outcome_record(
            event_id="planned-event",
            outcome_id=None,
            action_status="planned",
            action_timestamp=None,
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
                "source_id": "planner",
                "record_id": "plan-1",
                "data_status": "planned",
            },
            measurement_method=None,
            missingness_flags=["outcome_value"],
        )
        unknown = outcome_record(
            event_id="unknown-event",
            outcome_id=None,
            outcome_missing=True,
            data_status="missing",
            provenance={
                "source_id": "caller",
                "record_id": "unknown-1",
                "data_status": "missing",
            },
            action_status="not_applied",
            action_timestamp=None,
            linked_action_event_id=None,
            outcome_name=None,
            outcome_value=None,
            outcome_unit=None,
            measurement_timestamp=None,
            outcome_window_start=None,
            outcome_window_end=None,
            measurement_method=None,
            missingness_flags=["outcome_value"],
        )
        report = build_data_quality_report(
            [outcome_record(), synthetic, planned, unknown]
        ).to_dict()
        self.assertEqual(report["provenance_counts"], {
            "observed": 1,
            "planned": 1,
            "synthetic_demo": 1,
            "unknown": 1,
        })
        observed_categories = report["record_classifications"][0]["categories"]
        self.assertIn("observed_declared", observed_categories)
        self.assertIn("provenance_unverified", observed_categories)

    def test_schema_valid_is_distinct_from_evaluation_eligibility(self):
        report = build_data_quality_report([outcome_record()]).to_dict()
        self.assertEqual(report["record_counts"]["valid"], 1)
        self.assertEqual(report["record_counts"]["evaluation_eligible"], 1)
        categories = report["record_classifications"][0]["categories"]
        self.assertIn("schema_valid", categories)
        self.assertIn("measurement_linked", categories)
        self.assertIn("insufficient_coverage", categories)
        self.assertIn("evaluation_eligible", categories)

    def test_complete_structural_split_coverage_is_reported_without_performance_claim(self):
        records = []
        for index, split in enumerate(("train", "validation", "test"), start=1):
            event_id = f"event-{index}"
            records.append(
                outcome_record(
                    event_id=event_id,
                    outcome_id=f"outcome-{index}",
                    field_id=f"field-{index}",
                    season_id=f"season-{index}",
                    episode_id=f"episode-{index}",
                    split=split,
                    linked_action_event_id=event_id,
                    provenance={
                        "source_id": f"caller-study-{index}",
                        "record_id": f"measurement-{index}",
                        "data_status": "observed",
                    },
                    observation_timestamp=f"2026-0{index}-01T09:00:00+00:00",
                    decision_timestamp=f"2026-0{index}-01T09:30:00+00:00",
                    action_timestamp=f"2026-0{index}-01T10:00:00+00:00",
                    outcome_window_start=f"2026-0{index}-01T10:00:00+00:00",
                    measurement_timestamp=f"2026-0{index}-02T10:00:00+00:00",
                    outcome_window_end=f"2026-0{index}-03T10:00:00+00:00",
                )
            )
        report = build_data_quality_report(
            records,
            required_action_ids=["irrigation"],
            required_outcome_types=["measured_water_use"],
        ).to_dict()
        self.assertEqual(report["record_counts"]["evaluation_eligible"], 3)
        self.assertEqual(
            report["evaluation_status"],
            "prepared_for_offline_analysis_no_performance_claim",
        )
        self.assertEqual(report["policy_performance"], "not_evaluated")
        self.assertEqual(
            report["action_outcome_coverage"][
                "observed_schema_valid_actions_with_linked_measured_outcomes"
            ],
            3,
        )

    def test_unlinked_outcome_and_action_without_outcome_are_counted(self):
        unlinked = outcome_record(linked_action_event_id="different-event")
        missing = outcome_record(
            event_id="missing-event",
            outcome_id=None,
            linked_action_event_id=None,
            outcome_name=None,
            outcome_value=None,
            outcome_unit=None,
            measurement_timestamp=None,
            outcome_window_start=None,
            outcome_window_end=None,
            outcome_missing=True,
            missingness_flags=["outcome_value"],
            data_quality_flags=["meter_gap"],
        )
        report = build_data_quality_report([unlinked, missing]).to_dict()
        coverage = report["action_outcome_coverage"]
        self.assertEqual(coverage["actions_without_linked_outcomes"], 2)
        self.assertEqual(coverage["outcomes_without_valid_action_linkage"], 1)
        self.assertEqual(
            report["field_season_flags"]["pseudonymous-field-1"]["season-2026-a"],
            {
                "missingness:outcome_value": 1,
                "quality:meter_gap": 1,
            },
        )
        self.assertGreater(report["diagnostic_counts"]["action_linkage_issues"], 0)

    def test_bad_units_and_timestamp_order_are_surfaced(self):
        invalid = outcome_record(
            outcome_unit="gallons",
            decision_timestamp="2026-01-01T11:00:00+00:00",
        )
        report = build_data_quality_report([invalid]).to_dict()
        self.assertEqual(report["record_counts"]["invalid"], 1)
        self.assertGreater(report["diagnostic_counts"]["unit_issues"], 0)
        self.assertGreater(report["diagnostic_counts"]["timestamp_order_errors"], 0)
        self.assertTrue(report["findings"])

    def test_duplicate_ids_and_split_leakage_are_reported(self):
        first = outcome_record()
        duplicate_event = outcome_record(
            field_id="field-2",
            season_id="season-2",
            split="test",
        )
        leakage = outcome_record(
            event_id="event-3",
            outcome_id="outcome-3",
            split="test",
            outcome_window_start="2026-02-01T10:00:00+00:00",
            outcome_window_end="2026-02-03T10:00:00+00:00",
            measurement_timestamp="2026-02-02T10:00:00+00:00",
            action_timestamp="2026-02-01T10:00:00+00:00",
            observation_timestamp="2026-02-01T09:00:00+00:00",
            decision_timestamp="2026-02-01T09:30:00+00:00",
        )
        second = outcome_record(
            event_id="event-2",
            outcome_id="outcome-2",
            field_id=first["field_id"],
            season_id=first["season_id"],
            split="test",
            outcome_window_start="2026-03-01T10:00:00+00:00",
            outcome_window_end="2026-03-03T10:00:00+00:00",
            measurement_timestamp="2026-03-02T10:00:00+00:00",
            action_timestamp="2026-03-01T10:00:00+00:00",
            observation_timestamp="2026-03-01T09:00:00+00:00",
            decision_timestamp="2026-03-01T09:30:00+00:00",
        )
        report = build_data_quality_report(
            [first, duplicate_event, leakage, second]
        ).to_dict()
        self.assertGreater(report["diagnostic_counts"]["duplicate_identifiers"], 0)
        self.assertGreater(report["diagnostic_counts"]["split_leakage"], 0)
        self.assertEqual(report["diagnostic_counts"]["overlapping_outcome_windows"], 0)

    def test_overlap_and_insufficient_required_coverage_are_reported(self):
        first = outcome_record()
        second = outcome_record(
            event_id="event-2",
            outcome_id="outcome-2",
            split="test",
            season_id="season-2",
        )
        report = build_data_quality_report(
            [first, second],
            required_action_ids=["irrigation", "fertilizer"],
            required_outcome_types=["measured_yield"],
        ).to_dict()
        self.assertGreater(report["diagnostic_counts"]["overlapping_outcome_windows"], 0)
        self.assertTrue(report["action_outcome_coverage"]["missing_required_outcome_types"])
        self.assertTrue(report["coverage_warnings"])
        self.assertTrue(report["evaluation_refusal_reasons"])

    def test_quality_report_accepts_phase16_and_phase15_result_objects(self):
        imported = ingest_farm_outcomes([outcome_record()])
        from_import = build_data_quality_report(imported)
        offline = prepare_offline_evaluation_data([outcome_record()])
        from_offline = build_data_quality_report(offline)
        self.assertEqual(from_import.to_dict(), from_offline.to_dict())
        self.assertEqual(len(from_import.raw_records), 1)

    def test_source_snapshots_are_immutable_and_original_findings_retained(self):
        invalid = outcome_record(outcome_unit="invalid")
        imported = ingest_farm_outcomes([invalid])
        report = build_data_quality_report(imported)
        self.assertTrue(report.findings)
        self.assertEqual(report.raw_records[0]["outcome_unit"], "invalid")
        with self.assertRaises(TypeError):
            report.normalized_records[0]["source"] = "mutated"
        serialized = report.to_dict()
        self.assertEqual(serialized["rewards_calculated"], False)
        self.assertEqual(serialized["policy_trained"], False)


if __name__ == "__main__":
    unittest.main()
