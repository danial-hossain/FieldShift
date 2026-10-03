"""Command-line workflow for farm-outcome ingestion and quality reporting.

Run with ``python -m src.data.farm_outcomes_cli INPUT.csv [--output REPORT.json]``.
"""

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import Optional, Sequence

from src.data.data_quality import build_data_quality_report
from src.data.farm_outcomes import FarmOutcomeImport, ingest_farm_outcomes
from src.data.offline_export import export_offline_evaluation

EXIT_OK = 0
EXIT_ARGUMENT_ERROR = 2
EXIT_INPUT_ERROR = 3
EXIT_OUTPUT_ERROR = 4
EXIT_VALIDATION_ERROR = 5


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="fieldshift-farm-outcomes",
        description=(
            "Ingest and report on caller-provided farm outcome CSV data. "
            "Observed provenance declarations are not independently verified."
        ),
    )
    parser.add_argument("input_csv", help="explicit path to the caller CSV file")
    parser.add_argument(
        "-o",
        "--output",
        help="optional JSON report destination; defaults to standard output",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="allow replacing an existing --output file",
    )
    parser.add_argument(
        "--export-evaluation",
        metavar="PATH",
        help="write a prepared train/validation/test dataset export",
    )
    parser.add_argument(
        "--export-overwrite",
        action="store_true",
        help="allow replacing an existing --export-evaluation destination",
    )
    return parser


def _resolve_input(value: str) -> Path:
    path = Path(value).expanduser()
    try:
        resolved = path.resolve(strict=True)
    except (OSError, RuntimeError) as error:
        raise ValueError(f"Cannot resolve input CSV path '{value}': {error}") from error
    if not resolved.is_file():
        raise ValueError(f"Input CSV is not a regular file: {resolved}")
    return resolved


def _resolve_output(value: Optional[str], input_path: Path, overwrite: bool) -> Optional[Path]:
    if value is None:
        return None
    path = Path(value).expanduser()
    try:
        resolved = path.resolve(strict=False)
    except (OSError, RuntimeError) as error:
        raise ValueError(f"Cannot resolve output path '{value}': {error}") from error
    if resolved == input_path:
        raise ValueError("Output path must not refer to the input CSV.")
    if resolved.exists() and resolved.is_file():
        try:
            if resolved.samefile(input_path):
                raise ValueError("Output path must not refer to the input CSV.")
        except OSError as error:
            raise ValueError(f"Cannot validate output path '{resolved}': {error}") from error
    if not resolved.parent.is_dir():
        raise ValueError(f"Output directory does not exist: {resolved.parent}")
    if resolved.exists() and resolved.is_dir():
        raise ValueError(f"Output path is a directory: {resolved}")
    if resolved.exists() and not overwrite:
        raise FileExistsError(
            f"Output already exists; pass --overwrite to replace it: {resolved}"
        )
    return resolved


def _json_text(payload: dict) -> str:
    return json.dumps(
        payload,
        ensure_ascii=False,
        allow_nan=False,
        indent=2,
        sort_keys=True,
    )


def _report_payload(imported: FarmOutcomeImport, input_path: Path) -> dict:
    quality = build_data_quality_report(imported)
    quality_data = quality.to_dict()
    validation = imported.contract_validation
    linked_count = quality_data["evidence_classification_counts"][
        "measurement_linked"
    ]
    evaluation_eligible_count = sum(
        len(group) for group in imported.offline_evaluation.groups.values()
    )
    return {
        "report_schema": "fieldshift.farm_outcome_quality.v1",
        "input": {"path": str(input_path), "format": "csv"},
        "ingestion": {
            "status": "valid" if imported.valid else "invalid",
            "record_count": imported.record_count,
            "valid_record_count": validation.valid_record_count,
            "invalid_record_count": max(
                0, imported.record_count - validation.valid_record_count
            ),
            "findings": [finding.to_dict() for finding in imported.findings],
        },
        "data_quality": quality_data,
        "offline_evaluation": {
            "preparation_status": (
                imported.offline_evaluation.policy_performance_status
            ),
            "refusal_reasons": list(imported.offline_evaluation.refusal_reasons),
            "dataset_readiness": (
                "prepared_for_offline_analysis_no_performance_claim"
                if imported.offline_evaluation.policy_performance_status
                == "prepared_for_offline_analysis_no_performance_claim"
                else "refused"
            ),
        },
        "counts": {
            "total": imported.record_count,
            "valid": validation.valid_record_count,
            "invalid": max(
                0, imported.record_count - validation.valid_record_count
            ),
            "measurement_linked": linked_count,
            "evaluation_eligible": evaluation_eligible_count,
        },
        "limitations": {
            "caller_provenance_authenticity": "not_independently_established",
            "observed_declarations_are_not_source_verification": True,
            "causal_effects": "not_estimated",
            "agronomic_reward": "not_calculated",
            "policy_training": "not_performed",
            "policy_performance": "not_evaluated",
            "raw_records_included": False,
            "raw_record_snapshots_in_cli_report": "omitted_by_default",
        },
    }


def _write_report(path: Path, payload: dict, overwrite: bool) -> None:
    serialized = _json_text(payload)
    mode = "w" if overwrite else "x"
    try:
        with path.open(mode, encoding="utf-8", newline="\n") as stream:
            stream.write(serialized)
            stream.write("\n")
    except FileExistsError:
        raise FileExistsError(
            f"Output already exists; pass --overwrite to replace it: {path}"
        ) from None


def main(argv: Optional[Sequence[str]] = None) -> int:
    """Run the CLI and return a stable process exit code."""
    parser = _parser()
    args = parser.parse_args(argv)
    if args.overwrite and args.output is None:
        parser.error("--overwrite requires --output.")
    if args.export_overwrite and args.export_evaluation is None:
        parser.error("--export-overwrite requires --export-evaluation.")

    try:
        input_path = _resolve_input(args.input_csv)
    except (ValueError, OSError) as error:
        print(f"input error: {error}", file=sys.stderr)
        return EXIT_INPUT_ERROR

    try:
        output_path = _resolve_output(
            args.output,
            input_path,
            args.overwrite,
        )
    except (ValueError, OSError) as error:
        print(f"output error: {error}", file=sys.stderr)
        return EXIT_OUTPUT_ERROR

    try:
        export_path = _resolve_output(
            args.export_evaluation,
            input_path,
            args.export_overwrite,
        )
        if (
            output_path is not None
            and export_path is not None
            and (
                output_path == export_path
                or (
                    output_path.exists()
                    and export_path.exists()
                    and output_path.samefile(export_path)
                )
            )
        ):
            raise ValueError("Report and evaluation export paths must be different.")
    except (ValueError, OSError) as error:
        print(f"output error: {error}", file=sys.stderr)
        return EXIT_OUTPUT_ERROR

    try:
        imported = ingest_farm_outcomes(input_path)
    except (OSError, UnicodeError, ValueError, csv.Error) as error:
        print(f"input error: could not ingest CSV: {error}", file=sys.stderr)
        return EXIT_INPUT_ERROR

    payload = _report_payload(imported, input_path)
    try:
        if output_path is not None:
            _write_report(output_path, payload, args.overwrite)
        else:
            print(_json_text(payload))
    except (OSError, TypeError, ValueError) as error:
        print(f"output error: could not write report: {error}", file=sys.stderr)
        return EXIT_OUTPUT_ERROR

    if export_path is not None:
        try:
            export_result = export_offline_evaluation(
                input_path,
                export_path,
                overwrite=args.export_overwrite,
            )
        except (OSError, TypeError, ValueError) as error:
            print(f"output error: could not write evaluation export: {error}", file=sys.stderr)
            return EXIT_OUTPUT_ERROR
        if not export_result.written:
            reasons = "; ".join(export_result.report["dataset_refusal_reasons"])
            print(
                "validation error: evaluation export refused"
                + (f": {reasons}" if reasons else ""),
                file=sys.stderr,
            )
            return EXIT_VALIDATION_ERROR

    if not imported.valid:
        print(
            "validation error: report generated with input validation findings",
            file=sys.stderr,
        )
        return EXIT_VALIDATION_ERROR
    return EXIT_OK


if __name__ == "__main__":
    raise SystemExit(main())
