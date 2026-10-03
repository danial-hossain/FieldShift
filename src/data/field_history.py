"""Load history; yield is t/ha when known, and missing yield remains NaN."""

from pathlib import Path
from typing import Optional, Union

import pandas as pd

FIELD_HISTORY_COLUMNS = [
    "field_id",
    "year",
    "season",
    "crop",
    "yield",
    "irrigation",
    "source",
    "data_status",
]
DEFAULT_FIELD_HISTORY_CSV = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "field_history"
    / "demo_field_history.csv"
)


def normalize_field_history(records: pd.DataFrame) -> pd.DataFrame:
    """Validate history rows and return the stable field-history schema."""
    missing = [column for column in FIELD_HISTORY_COLUMNS if column not in records]
    if missing:
        raise ValueError(
            "Field history is missing required columns: " + ", ".join(missing)
        )
    data = records[FIELD_HISTORY_COLUMNS].copy()
    for column in ("field_id", "season", "crop", "irrigation", "source", "data_status"):
        data[column] = data[column].astype("string").str.strip()
        if data[column].isna().any() or data[column].eq("").any():
            raise ValueError(f"Field history {column} is required.")

    year_text = data["year"].astype("string").str.strip()
    year_missing = year_text.isna() | year_text.eq("")
    year = pd.to_numeric(data["year"], errors="coerce")
    if year_missing.any() or year.isna().any() or (year % 1 != 0).any():
        raise ValueError("Field history year must be an integer year.")
    if ((year < 1) | (year > 9999)).any():
        raise ValueError("Field history year must be between 1 and 9999.")
    data["year"] = year.astype("int64")

    yield_text = data["yield"].astype("string").str.strip()
    yield_missing = yield_text.isna() | yield_text.str.lower().isin(
        {"", "nan", "na", "null", "none"}
    )
    yield_value = pd.to_numeric(data["yield"], errors="coerce")
    if ((~yield_missing) & yield_value.isna()).any():
        raise ValueError("Field history yield must be numeric or blank.")
    if (yield_value.dropna() < 0).any():
        raise ValueError("Field history yield cannot be negative.")
    data["yield"] = yield_value.astype(float)
    return data[FIELD_HISTORY_COLUMNS].sort_values(
        ["field_id", "year", "season"], kind="stable"
    ).reset_index(drop=True)


def load_field_history(
    csv_path: Optional[Union[str, Path]] = None,
    field_id: Optional[str] = None,
    as_of_date=None,
) -> pd.DataFrame:
    """Load field history, optionally filtering to a field and decision date.

    History only stores year and season, not exact event dates. To avoid
    leaking a potentially future season within the decision year, an as-of
    filter conservatively includes only records from earlier calendar years.
    """
    path = Path(csv_path) if csv_path is not None else DEFAULT_FIELD_HISTORY_CSV
    if not path.is_file():
        raise FileNotFoundError(f"Field history CSV was not found: {path}")
    try:
        records = normalize_field_history(
            pd.read_csv(path, keep_default_na=False)
        )
    except (OSError, pd.errors.ParserError) as error:
        raise ValueError(f"Could not read field history CSV '{path}': {error}") from error

    if field_id is not None:
        records = records.loc[records["field_id"].eq(str(field_id))]
    if as_of_date is not None:
        decision_date = pd.to_datetime(as_of_date, errors="coerce")
        if pd.isna(decision_date):
            raise ValueError("as_of_date must be a valid date.")
        records = records.loc[records["year"] < decision_date.year]
    return records.reset_index(drop=True)[FIELD_HISTORY_COLUMNS]
