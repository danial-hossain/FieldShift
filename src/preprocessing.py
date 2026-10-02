"""Validation and preprocessing for daily NASA POWER climate data.

The cleaning policy is conservative:

* NASA missing-value markers, non-numeric values, and implausible values become
  ``NaN`` and are counted in a report.
* Short, internal gaps (at most two observations) in continuous variables are
  linearly interpolated. Rainfall is never interpolated because rain is an
  event variable; a missing rainfall value stays missing.
* Boolean provenance columns record which source values were missing or
  invalid, even when a value is later interpolated.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd

CLIMATE_COLUMNS = (
    "temperature",
    "temp_max",
    "temp_min",
    "rainfall",
    "humidity",
    "wind_speed",
    "solar_radiation",
)
REQUIRED_COLUMNS = ("date", *CLIMATE_COLUMNS)
NASA_MISSING_INDICATORS = (-999.0, -9999.0)
INTERPOLATABLE_COLUMNS = (
    "temperature",
    "temp_max",
    "temp_min",
    "humidity",
    "wind_speed",
    "solar_radiation",
)
PLAUSIBLE_RANGES: dict[str, tuple[float | None, float | None]] = {
    "temperature": (-90.0, 60.0),
    "temp_max": (-90.0, 60.0),
    "temp_min": (-90.0, 60.0),
    "rainfall": (0.0, None),
    "humidity": (0.0, 100.0),
    "wind_speed": (0.0, None),
    "solar_radiation": (0.0, None),
}


@dataclass
class PreprocessingReport:
    """Machine-readable counts describing every cleaning decision."""

    input_rows: int = 0
    output_rows: int = 0
    invalid_dates_removed: int = 0
    duplicate_dates_removed: int = 0
    source_missing: dict[str, int] = field(default_factory=dict)
    invalid_values: dict[str, int] = field(default_factory=dict)
    interpolated_values: dict[str, int] = field(default_factory=dict)
    remaining_missing: dict[str, int] = field(default_factory=dict)

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


def _require_columns(frame: pd.DataFrame, columns: Iterable[str]) -> None:
    missing = [column for column in columns if column not in frame.columns]
    if missing:
        raise ValueError("Missing required columns: " + ", ".join(missing))


def standardize_dates(
    frame: pd.DataFrame,
) -> tuple[pd.DataFrame, dict[str, int]]:
    """Convert dates, remove invalid/duplicate dates, and sort chronologically."""
    _require_columns(frame, ("date",))
    cleaned = frame.copy()
    cleaned["date"] = pd.to_datetime(cleaned["date"], errors="coerce")
    invalid_dates = int(cleaned["date"].isna().sum())
    cleaned = cleaned.loc[cleaned["date"].notna()].copy()
    cleaned = cleaned.sort_values("date", kind="stable")
    duplicate_dates = int(cleaned.duplicated(subset="date", keep="first").sum())
    cleaned = cleaned.drop_duplicates(subset="date", keep="first")
    cleaned = cleaned.reset_index(drop=True)
    return cleaned, {
        "invalid_dates_removed": invalid_dates,
        "duplicate_dates_removed": duplicate_dates,
    }


def normalise_missing_values(
    frame: pd.DataFrame,
    *,
    missing_indicators: Iterable[float] = NASA_MISSING_INDICATORS,
) -> tuple[pd.DataFrame, dict[str, int]]:
    """Convert source missing markers and non-numeric observations to NaN."""
    _require_columns(frame, CLIMATE_COLUMNS)
    cleaned = frame.copy()
    counts: dict[str, int] = {}
    indicators = tuple(float(value) for value in missing_indicators)

    for column in CLIMATE_COLUMNS:
        raw = cleaned[column]
        numeric = pd.to_numeric(raw, errors="coerce")
        missing_mask = raw.isna() | numeric.isna() | numeric.isin(indicators)
        cleaned[f"{column}_was_missing"] = missing_mask.astype(bool)
        cleaned.loc[missing_mask, column] = np.nan
        cleaned[column] = pd.to_numeric(cleaned[column], errors="coerce")
        counts[column] = int(missing_mask.sum())

    return cleaned, counts


def validate_climate_values(
    frame: pd.DataFrame,
) -> tuple[pd.DataFrame, dict[str, int]]:
    """Flag physically implausible observations and replace them with NaN."""
    _require_columns(frame, CLIMATE_COLUMNS)
    validated = frame.copy()
    counts: dict[str, int] = {}

    for column, (minimum, maximum) in PLAUSIBLE_RANGES.items():
        values = pd.to_numeric(validated[column], errors="coerce")
        invalid = pd.Series(False, index=validated.index)
        if minimum is not None:
            invalid |= values < minimum
        if maximum is not None:
            invalid |= values > maximum
        validated[f"{column}_was_invalid"] = invalid.astype(bool)
        validated.loc[invalid, column] = np.nan
        counts[column] = int(invalid.sum())

    return validated, counts


def interpolate_short_gaps(
    frame: pd.DataFrame,
    *,
    limit: int = 2,
) -> tuple[pd.DataFrame, dict[str, int]]:
    """Interpolate only short internal gaps in continuous variables."""
    if limit < 1:
        raise ValueError("Interpolation limit must be at least 1.")
    _require_columns(frame, INTERPOLATABLE_COLUMNS)
    interpolated = frame.copy()
    counts: dict[str, int] = {}

    for column in INTERPOLATABLE_COLUMNS:
        before_missing = interpolated[column].isna()
        interpolated[column] = interpolated[column].interpolate(
            method="linear", limit=limit, limit_area="inside"
        )
        filled = before_missing & interpolated[column].notna()
        counts[column] = int(filled.sum())

    counts["rainfall"] = 0
    return interpolated, counts


def preprocess_climate_data(
    frame: pd.DataFrame,
    *,
    interpolate: bool = True,
    interpolation_limit: int = 2,
) -> tuple[pd.DataFrame, PreprocessingReport]:
    """Run the Phase 1 cleaning pipeline and return data plus an audit report."""
    _require_columns(frame, REQUIRED_COLUMNS)
    report = PreprocessingReport(input_rows=len(frame))

    cleaned, date_counts = standardize_dates(frame.loc[:, REQUIRED_COLUMNS])
    report.invalid_dates_removed = date_counts["invalid_dates_removed"]
    report.duplicate_dates_removed = date_counts["duplicate_dates_removed"]

    cleaned, report.source_missing = normalise_missing_values(cleaned)
    cleaned, report.invalid_values = validate_climate_values(cleaned)

    if interpolate:
        cleaned, report.interpolated_values = interpolate_short_gaps(
            cleaned, limit=interpolation_limit
        )
    else:
        report.interpolated_values = {column: 0 for column in CLIMATE_COLUMNS}

    report.remaining_missing = {
        column: int(cleaned[column].isna().sum()) for column in CLIMATE_COLUMNS
    }
    report.output_rows = len(cleaned)

    provenance_columns = [
        f"{column}_{suffix}"
        for column in CLIMATE_COLUMNS
        for suffix in ("was_missing", "was_invalid")
    ]
    cleaned = cleaned.loc[:, [*REQUIRED_COLUMNS, *provenance_columns]]
    return cleaned, report


def process_csv(
    input_path: str | Path,
    output_path: str | Path,
    *,
    interpolate: bool = True,
    interpolation_limit: int = 2,
) -> PreprocessingReport:
    """Clean a raw CSV without overwriting it and write the cleaned result."""
    input_path = Path(input_path)
    output_path = Path(output_path)
    if input_path.resolve() == output_path.resolve():
        raise ValueError("Input and output paths must differ; raw data is preserved.")
    if not input_path.is_file():
        raise FileNotFoundError(f"Raw dataset not found: {input_path}")

    raw = pd.read_csv(input_path)
    cleaned, report = preprocess_climate_data(
        raw,
        interpolate=interpolate,
        interpolation_limit=interpolation_limit,
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cleaned.to_csv(output_path, index=False, date_format="%Y-%m-%d")
    return report


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Clean a NASA POWER daily climate CSV."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("data/nasa_power/nasa_power_2025.csv"),
        help="Raw NASA POWER CSV (default: %(default)s)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/nasa_power/nasa_power_2025_clean.csv"),
        help="Clean output CSV (default: %(default)s)",
    )
    parser.add_argument(
        "--no-interpolate",
        action="store_true",
        help="Leave all missing values unfilled.",
    )
    return parser


def main() -> None:
    args = _build_parser().parse_args()
    report = process_csv(
        args.input,
        args.output,
        interpolate=not args.no_interpolate,
    )
    print(json.dumps(report.to_dict(), indent=2))
    print(f"Clean dataset written to {args.output}")


if __name__ == "__main__":
    main()
