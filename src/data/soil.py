"""Load local soil properties while preserving units and unknown values."""

from pathlib import Path
from typing import Optional, Union

import numpy as np
import pandas as pd

SOIL_COLUMNS = [
    "field_id",
    "latitude",
    "longitude",
    "nitrogen",
    "phosphorus",
    "potassium",
    "ph",
    "organic_matter",
    "texture",
    "source",
    "data_status",
    "as_of_date",
]
DEFAULT_SOIL_CSV = Path(__file__).resolve().parents[2] / "data" / "soil" / "demo_soil.csv"


def _numeric_column(values: pd.Series, name: str) -> pd.Series:
    text = values.astype("string").str.strip()
    missing = text.isna() | text.str.lower().isin({"", "nan", "na", "null", "none"})
    numeric = pd.to_numeric(values, errors="coerce")
    if ((~missing) & numeric.isna()).any():
        raise ValueError(f"Soil {name} must be numeric or blank.")
    return numeric.astype(float)


def normalize_soil_data(records: pd.DataFrame) -> pd.DataFrame:
    """Validate soil records and return columns in a deterministic order.

    Nitrogen, phosphorus, and potassium are mg/kg; pH is unitless;
    organic_matter is percent by mass; texture is categorical.
    """
    missing = [column for column in SOIL_COLUMNS if column not in records]
    if missing:
        raise ValueError("Soil data is missing required columns: " + ", ".join(missing))

    data = records[SOIL_COLUMNS].copy()
    data["field_id"] = data["field_id"].astype("string").str.strip()
    if data["field_id"].isna().any() or data["field_id"].eq("").any():
        raise ValueError("field_id is required for every soil record.")

    for column, lower, upper in (
        ("latitude", -90, 90),
        ("longitude", -180, 180),
    ):
        data[column] = _numeric_column(data[column], column)
        if data[column].isna().any() or not data[column].between(lower, upper).all():
            raise ValueError(f"Soil {column} must be between {lower} and {upper}.")

    for column in ("nitrogen", "phosphorus", "potassium", "ph", "organic_matter"):
        data[column] = _numeric_column(data[column], column)
    for column in ("nitrogen", "phosphorus", "potassium"):
        if (data[column].dropna() < 0).any():
            raise ValueError(f"Soil {column} cannot be negative.")
    invalid_ph = data["ph"].notna() & ~data["ph"].between(0, 14)
    if invalid_ph.any():
        raise ValueError("Soil pH must be between 0 and 14 when provided.")
    invalid_organic_matter = data["organic_matter"].notna() & ~data[
        "organic_matter"
    ].between(0, 100)
    if invalid_organic_matter.any():
        raise ValueError("Soil organic_matter must be between 0 and 100 percent.")

    data["texture"] = data["texture"].astype("string").str.strip()
    data.loc[data["texture"].eq(""), "texture"] = pd.NA
    for column in ("source", "data_status"):
        data[column] = data[column].astype("string").str.strip()
        if data[column].isna().any() or data[column].eq("").any():
            raise ValueError(f"Soil {column} must be provided for every record.")
    data["as_of_date"] = pd.to_datetime(data["as_of_date"], errors="coerce").dt.normalize()
    if data["as_of_date"].isna().any():
        raise ValueError("Soil as_of_date values must be valid dates.")
    return data[SOIL_COLUMNS].reset_index(drop=True)


def load_soil_data(
    csv_path: Optional[Union[str, Path]] = None,
    field_id: Optional[str] = None,
    as_of_date=None,
) -> pd.DataFrame:
    """Load soil properties, optionally limited to a field and decision date.

    A decision date excludes measurements whose ``as_of_date`` is later than
    that date. Missing nutrient values stay NaN, not zero.
    """
    path = Path(csv_path) if csv_path is not None else DEFAULT_SOIL_CSV
    if not path.is_file():
        raise FileNotFoundError(f"Soil CSV file was not found: {path}")
    try:
        records = normalize_soil_data(pd.read_csv(path, keep_default_na=False))
    except (OSError, pd.errors.ParserError) as error:
        raise ValueError(f"Could not read soil CSV '{path}': {error}") from error

    if field_id is not None:
        records = records.loc[records["field_id"].eq(str(field_id))]
    if as_of_date is not None:
        decision_date = pd.to_datetime(as_of_date, errors="coerce")
        if pd.isna(decision_date):
            raise ValueError("as_of_date must be a valid date.")
        records = records.loc[records["as_of_date"] <= decision_date.normalize()]
    return records.reset_index(drop=True)[SOIL_COLUMNS]
