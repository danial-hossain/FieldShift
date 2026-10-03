import copy
import unittest

from src.integration.milp_rl import adapt_milp_result
from src.rl.outcomes import (
    OUTCOME_RECORD_FIELDS,
    prepare_offline_evaluation_data,
    validate_outcome_records,
)

_DEFAULT_LINK = object()


def record(
    event_id="event-1",
    outcome_id="outcome-1",
    field_id="field-1",
    season_id="season-1",
    episode_id="episode-1",
    split="train",
    action_id="no_intervention",
    action_status="confirmed_applied",
    action_timestamp="2026-01-01T10:00:00+00:00",
    outcome_name="measured_water_use",
    outcome_value=5.2,
    outcome_unit="mm/ha",
    measurement_timestamp="2026-01-02T10:00:00+00:00",
    outcome_window_start="2026-01-01T10:00:00+00:00",
    outcome_window_end="2026-01-03T10:00:00+00:00",
    outcome_missing=False,
    data_status="observed",
    source="field_meter",
    provenance=None,
    linked_action_event_id=_DEFAULT_LINK,
    **overrides,
):
    data = {
        "event_id": event_id,
        "outcome_id": outcome_id,
        "field_id": field_id,
        "season_id": season_id,
        "episode_id": episode_id,
        "split": split,
        "observation_timestamp": "2026-01-01T09:00:00+00:00",
        "decision_timestamp": "2026-01-01T09:30:00+00:00",
        "action_timestamp": action_timestamp,
        "action_id": action_id,
        "action_parameters": {},
        "action_status": action_status,
        "linked_action_event_id": (
            event_id
            if linked_action_event_id is _DEFAULT_LINK
            else linked_action_event_id
        ),
        "outcome_name": outcome_name,
        "outcome_value": outcome_value,
        "outcome_unit": outcome_unit,
        "measurement_timestamp": measurement_timestamp,
        "outcome_window_start": outcome_window_start,
        "outcome_window_end": outcome_window_end,
        "outcome_missing": outcome_missing,
        "data_status": data_status,
        "source": source,
        "provenance": provenance
        or {
            "source_id": "farm-study-01",
            "record_id": f"source-{event_id}",
            "data_status": data_status,
            "collection_method": "calibrated field meter",
        },
        "measurement_method": "calibrated field meter",
        "missingness_flags": [],
        "data_quality_flags": [],
    }
    data.update(overrides)
    return data


def split_records():
    return [
        record("train-event", "train-outcome", "field-train", "season-train", "episode-train", "train"),
        record("validation-event", "validation-outcome", "field-validation", "season-validation", "episode-validation", "validation"),
        record("test-event", "test-outcome", "field-test", "season-test", "episode-test", "test"),
    ]


class OutcomeContractTests(unittest.TestCase):
    def test_documented_contract_fields_are_declared_and_valid_record_passes(self):
        candidate = record()
        self.assertEqual(set(candidate), set(OUTCOME_RECORD_FIELDS))
        report = validate_outcome_records([candidate])
        self.assertTrue(report.valid)
        self.assertEqual(report.record_count, 1)
        self.assertEqual(report.valid_record_count, 1)
        self.assertEqual(report.observed_outcome_count, 1)

    def test_missing_required_identifiers_are_reported_structurally(self):
        candidate = record(field_id="", season_id="", episode_id="", action_id="")
        findings = validate_outcome_records([candidate]).to_dict()["findings"]
        fields = {finding["field"] for finding in findings if finding["severity"] == "error"}
        self.assertTrue({"field_id", "season_id", "episode_id", "action_id"}.issubset(fields))
        self.assertTrue(all({"severity", "field", "record_id", "explanation"} <= set(item) for item in findings))

    def test_unknown_fields_and_non_mapping_records_are_not_silently_accepted(self):
        extra = record()
        extra["objective_value"] = 123
        missing_field = record()
        missing_field.pop("action_parameters")
        invalid_parameters = record(action_parameters={"amount": float("nan")})
        report = validate_outcome_records(
            [extra, missing_field, invalid_parameters, "not-a-record"]
        )
        self.assertFalse(report.valid)
        self.assertTrue(
            any("Unknown outcome-record fields" in finding.explanation for finding in report.findings)
        )
        self.assertTrue(
            any("must be a mapping" in finding.explanation for finding in report.findings)
        )
        self.assertTrue(
            any("Missing outcome-record fields" in finding.explanation for finding in report.findings)
        )
        self.assertTrue(
            any(finding.field == "action_parameters" for finding in report.findings)
        )

    def test_observation_decision_action_and_outcome_order_is_enforced(self):
        cases = (
            record(observation_timestamp="2026-01-01T10:00:00+00:00"),
            record(action_timestamp="2026-01-01T09:00:00+00:00"),
            record(measurement_timestamp="2026-01-01T09:45:00+00:00"),
            record(outcome_window_start="2026-01-03T10:00:00+00:00"),
        )
        for invalid in cases:
            with self.subTest(record=invalid):
                report = validate_outcome_records([invalid])
                self.assertFalse(report.valid)
                self.assertTrue(report.findings)

    def test_timestamps_require_timezone_and_window_contains_measurement(self):
        for invalid in (
            record(decision_timestamp="2026-01-01T09:30:00"),
            record(outcome_window_end="2026-01-01T11:00:00+00:00"),
        ):
            report = validate_outcome_records([invalid])
            self.assertFalse(report.valid)

    def test_outcome_values_units_and_measurement_method_are_required(self):
        for invalid in (
            record(outcome_value=float("inf")),
            record(outcome_unit="liters"),
            record(outcome_unit=""),
            record(measurement_method=""),
        ):
            report = validate_outcome_records([invalid])
            self.assertFalse(report.valid)

    def test_duplicate_event_and_outcome_identifiers_are_reported(self):
        one = record("duplicate-event", "duplicate-outcome")
        two = record(
            "duplicate-event",
            "duplicate-outcome",
            field_id="field-2",
            season_id="season-2",
        )
        report = validate_outcome_records([one, two])
        duplicate_fields = {
            finding.field for finding in report.findings if "Duplicate" in finding.explanation
        }
        self.assertIn("event_id", duplicate_fields)
        self.assertIn("outcome_id", duplicate_fields)

    def test_explicit_action_to_outcome_linkage_is_required(self):
        report = validate_outcome_records(
            [record(linked_action_event_id="another-event")]
        )
        self.assertFalse(report.valid)
        self.assertTrue(
            any(finding.field == "linked_action_event_id" for finding in report.findings)
        )

    def test_planned_milp_action_cannot_be_claimed_as_applied_or_measured(self):
        planned = record(
            action_status="planned",
            action_timestamp=None,
            data_status="planned",
            provenance={
                "source_id": "rotation-planner",
                "record_id": "plan-01",
                "data_status": "planned",
                "planned_rotation": {"Spring": "Rice"},
            },
        )
        report = validate_outcome_records([planned])
        self.assertFalse(report.valid)
        self.assertTrue(
            any("cannot be linked to a measured outcome" in f.explanation for f in report.findings)
        )
        context = adapt_milp_result(
            {
                "status": "optimal",
                "planning_periods": ["Spring"],
                "selected_crop_by_period": {"Spring": "Rice"},
                "objective_value": 10,
            }
        ).to_dict()
        spoof = record(provenance={
            "source_id": "field-study",
            "record_id": "event-plan",
            "data_status": "observed",
            "planning_context": context,
        })
        self.assertFalse(validate_outcome_records([spoof]).valid)

    def test_explicit_planned_action_is_retained_as_non_observed_context(self):
        planned = record(
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
            source="rotation_planner",
            provenance={
                "source_id": "rotation-planner",
                "record_id": "plan-01",
                "data_status": "planned",
                "planned_rotation": {"Spring": "Rice"},
            },
            measurement_method=None,
            missingness_flags=["outcome_value"],
        )
        report = validate_outcome_records([planned])
        self.assertTrue(report.valid)
        self.assertEqual(report.observed_outcome_count, 0)
        self.assertEqual(report.missing_outcome_count, 0)

    def test_synthetic_or_demo_provenance_cannot_be_labelled_observed(self):
        for provenance in (
            {
                "source_id": "study",
                "record_id": "sample-1",
                "data_status": "synthetic",
            },
            {
                "source_id": "demo_meter",
                "record_id": "sample-2",
                "data_status": "observed",
            },
        ):
            report = validate_outcome_records(
                [record(data_status="observed", provenance=provenance)]
            )
            self.assertFalse(report.valid)
            self.assertTrue(any(f.field == "provenance" for f in report.findings))

    def test_demo_records_are_retained_but_not_counted_as_observed(self):
        demo = record(
            data_status="synthetic",
            provenance={
                "source_id": "synthetic-study",
                "record_id": "fixture-1",
                "data_status": "synthetic",
            },
        )
        report = validate_outcome_records([demo])
        self.assertTrue(report.valid)
        self.assertEqual(report.observed_outcome_count, 0)
        self.assertTrue(any(f.severity == "warning" for f in report.findings))

    def test_same_field_season_cannot_cross_splits(self):
        first = record("event-train", "outcome-train", split="train")
        second = record(
            "event-test",
            "outcome-test",
            split="test",
            measurement_timestamp="2026-01-05T10:00:00+00:00",
            outcome_window_start="2026-01-03T10:00:00+00:00",
            outcome_window_end="2026-01-06T10:00:00+00:00",
        )
        report = validate_outcome_records([first, second])
        self.assertFalse(report.valid)
        self.assertFalse(report.split_metadata_valid)
        self.assertTrue(any("field-season" in f.explanation for f in report.findings))

    def test_overlapping_outcome_windows_across_split_are_leakage(self):
        first = record("event-train", "outcome-train", split="train")
        second = record(
            "event-test",
            "outcome-test",
            split="test",
            field_id="field-1",
            season_id="season-other",
            measurement_timestamp="2026-01-02T12:00:00+00:00",
            outcome_window_start="2026-01-02T00:00:00+00:00",
            outcome_window_end="2026-01-04T00:00:00+00:00",
        )
        report = validate_outcome_records([first, second])
        self.assertFalse(report.valid)
        self.assertTrue(any("overlap" in f.explanation.lower() for f in report.findings))

    def test_incomplete_action_coverage_is_reported_without_dropping_records(self):
        candidate = record(action_id="no_intervention")
        report = validate_outcome_records(
            [candidate],
            required_action_ids=["no_intervention", "inspect_reassess"],
        )
        self.assertTrue(report.valid)
        self.assertTrue(
            any("inspect_reassess" in f.explanation for f in report.findings)
        )
        self.assertIn("no_intervention", report.action_coverage)
        self.assertEqual(
            report.to_dict()["split_action_coverage"]["train"][
                "inspect_reassess"
            ],
            0,
        )

    def test_every_required_action_must_have_coverage_in_each_split(self):
        records = [
            record("train-1", "out-1", "field-1", "season-1", "ep-1", "train", "no_intervention"),
            record("validation-1", "out-2", "field-2", "season-2", "ep-2", "validation", "inspect_reassess"),
            record("test-1", "out-3", "field-3", "season-3", "ep-3", "test", "no_intervention"),
        ]
        dataset = prepare_offline_evaluation_data(
            records,
            required_action_ids=["no_intervention", "inspect_reassess"],
        )
        self.assertEqual(
            dataset.policy_performance_status,
            "refused_insufficient_or_invalid_observed_data",
        )
        self.assertTrue(any("train/validation/test" in reason for reason in dataset.refusal_reasons))

    def test_offline_pipeline_creates_groups_only_for_valid_split_metadata(self):
        plan_only = record(
            event_id="planned-only",
            field_id="field-plan",
            season_id="season-plan",
            episode_id="episode-plan",
            split="train",
            action_status="planned",
            action_timestamp=None,
            outcome_id=None,
            outcome_name=None,
            outcome_value=None,
            outcome_unit=None,
            measurement_timestamp=None,
            outcome_window_start=None,
            outcome_window_end=None,
            outcome_missing=True,
            data_status="planned",
            source="rotation_planner",
            provenance={
                "source_id": "rotation-planner",
                "record_id": "plan-only",
                "data_status": "planned",
                "planned_rotation": {"Spring": "Rice"},
            },
            linked_action_event_id=None,
            measurement_method=None,
            missingness_flags=["outcome_value"],
        )
        records = split_records() + [plan_only]
        dataset = prepare_offline_evaluation_data(
            records,
            required_action_ids=["no_intervention"],
        )
        serialized = dataset.to_dict()
        self.assertEqual(len(serialized["groups"]["train"]), 1)
        self.assertEqual(len(serialized["groups"]["validation"]), 1)
        self.assertEqual(len(serialized["groups"]["test"]), 1)
        self.assertEqual(
            serialized["policy_performance_status"],
            "prepared_for_offline_analysis_no_performance_claim",
        )
        self.assertEqual(serialized["causal_effects"], "not_estimated")
        self.assertFalse(serialized["policy_trained"])
        self.assertEqual(len(serialized["raw_records"]), 4)
        self.assertNotIn(
            "planned-only",
            [item["event_id"] for item in serialized["groups"]["train"]],
        )

    def test_offline_pipeline_refuses_groups_for_invalid_split_or_missing_outcomes(self):
        leaked = split_records()
        leaked[1]["field_id"] = leaked[0]["field_id"]
        leaked[1]["season_id"] = leaked[0]["season_id"]
        dataset = prepare_offline_evaluation_data(leaked)
        self.assertEqual(dataset.policy_performance_status, "refused_insufficient_or_invalid_observed_data")
        self.assertTrue(all(not values for values in dataset.groups.values()))

        demo = [
            record(
                f"event-{split}",
                f"outcome-{split}",
                f"field-{split}",
                f"season-{split}",
                f"episode-{split}",
                split,
                data_status="synthetic",
                provenance={
                    "source_id": "synthetic-source",
                    "record_id": f"fixture-{split}",
                    "data_status": "synthetic",
                },
            )
            for split in ("train", "validation", "test")
        ]
        synthetic_dataset = prepare_offline_evaluation_data(demo)
        self.assertEqual(
            synthetic_dataset.policy_performance_status,
            "refused_insufficient_or_invalid_observed_data",
        )
        self.assertEqual(len(synthetic_dataset.raw_records), 3)

    def test_missing_outcome_is_explicit_not_imputed(self):
        missing = record(
            outcome_id=None,
            outcome_name=None,
            outcome_value=None,
            outcome_unit=None,
            measurement_timestamp=None,
            outcome_window_start=None,
            outcome_window_end=None,
            linked_action_event_id=None,
            outcome_missing=True,
            missingness_flags=["outcome_value"],
            measurement_method=None,
        )
        dataset = prepare_offline_evaluation_data([missing])
        self.assertEqual(dataset.validation.missing_outcome_count, 1)
        self.assertEqual(dataset.validation.observed_outcome_count, 0)
        self.assertEqual(
            dataset.validation.to_dict()["missingness_counts"]["outcome_value"],
            1,
        )
        self.assertIsNone(dataset.raw_records[0]["outcome_value"])
        self.assertEqual(dataset.policy_performance_status, "refused_insufficient_or_invalid_observed_data")

    def test_validation_and_preparation_are_deterministic_and_immutable(self):
        records = split_records()
        original = copy.deepcopy(records)
        first = prepare_offline_evaluation_data(records).to_dict()
        second = prepare_offline_evaluation_data(records).to_dict()
        self.assertEqual(first, second)
        self.assertEqual(records, original)
        records[0]["action_parameters"]["later_edit"] = True
        self.assertNotIn(
            "later_edit",
            first["raw_records"][0]["action_parameters"],
        )
        with self.assertRaises(TypeError):
            dataset = prepare_offline_evaluation_data(original)
            dataset.raw_records[0]["field_id"] = "mutated"

    def test_missing_linkage_and_invalid_timestamp_have_record_specific_findings(self):
        invalid = record(
            "event-invalid",
            "outcome-invalid",
            linked_action_event_id=None,
            decision_timestamp="not-a-timestamp",
        )
        report = validate_outcome_records([invalid])
        findings = [finding.to_dict() for finding in report.findings]
        self.assertTrue(
            any(
                item["field"] == "decision_timestamp"
                and item["record_id"] == "event-invalid"
                for item in findings
            )
        )
        self.assertTrue(any(item["field"] == "linked_action_event_id" for item in findings))


if __name__ == "__main__":
    unittest.main()
