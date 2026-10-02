"""Fetch, clean, and save observations from the NASA POWER Daily Point API."""

from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Optional, Union

import pandas as pd
import requests

API_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
REQUEST_TIMEOUT_SECONDS = 30
MISSING_VALUE = -999
DATA_COLUMNS = [
    "date",
    "temperature",
    "temp_max",
    "temp_min",
    "rainfall",
    "humidity",
    "wind_speed",
    "solar_radiation",
]
PARAMETER_COLUMNS = {
    "T2M": "temperature",
    "T2M_MAX": "temp_max",
    "T2M_MIN": "temp_min",
    "PRECTOTCORR": "rainfall",
    "RH2M": "humidity",
    "WS2M": "wind_speed",
    "ALLSKY_SFC_SW_DWN": "solar_radiation",
}
DEFAULT_DATA_DIRECTORY = Path(__file__).resolve().parents[2] / "data" / "nasa_power"
DateInput = Union[str, date, datetime, pd.Timestamp]


def _validate_coordinates(latitude: float, longitude: float) -> None:
    """Raise ValueError when coordinates are not valid geographic values."""
    try:
        latitude_value = float(latitude)
    except (TypeError, ValueError) as error:
        raise ValueError("latitude must be a number between -90 and 90.") from error
    try:
        longitude_value = float(longitude)
    except (TypeError, ValueError) as error:
        raise ValueError("longitude must be a number between -180 and 180.") from error

    if not pd.notna(latitude_value) or not -90 <= latitude_value <= 90:
        raise ValueError("latitude must be between -90 and 90.")
    if not pd.notna(longitude_value) or not -180 <= longitude_value <= 180:
        raise ValueError("longitude must be between -180 and 180.")


def _parse_date(value: DateInput, name: str) -> pd.Timestamp:
    """Parse a date input and return a normalized pandas timestamp."""
    try:
        parsed = pd.Timestamp(value)
    except (TypeError, ValueError, OverflowError) as error:
        raise ValueError(
            f"{name} must be a valid date, such as '2025-01-31' or '20250131'."
        ) from error

    if pd.isna(parsed):
        raise ValueError(f"{name} must be a valid date.")
    return parsed.normalize()


def _validate_dates(start_date: DateInput, end_date: DateInput):
    start = _parse_date(start_date, "start_date")
    end = _parse_date(end_date, "end_date")
    if start > end:
        raise ValueError("start_date must be on or before end_date.")
    return start, end


def _empty_dataframe() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "date": pd.Series(dtype="datetime64[ns]"),
            **{
                column: pd.Series(dtype="float64")
                for column in DATA_COLUMNS[1:]
            },
        },
        columns=DATA_COLUMNS,
    )


def _response_to_dataframe(data) -> pd.DataFrame:
    """Validate the expected API response and convert it to cleaned columns."""
    if not isinstance(data, dict):
        raise ValueError("NASA POWER returned an empty or invalid JSON response.")

    properties = data.get("properties")
    parameters = properties.get("parameter") if isinstance(properties, dict) else None
    if not isinstance(parameters, dict):
        raise ValueError("NASA POWER response is missing properties.parameter.")

    parameter_series = {}
    for api_name, output_name in PARAMETER_COLUMNS.items():
        values = parameters.get(api_name)
        if not isinstance(values, dict):
            raise ValueError(
                f"NASA POWER response is missing expected parameter '{api_name}'."
            )
        parameter_series[output_name] = pd.Series(values, name=output_name)

    if not any(not series.empty for series in parameter_series.values()):
        raise ValueError("NASA POWER returned no observations for the requested range.")

    frame = pd.concat(parameter_series.values(), axis=1)
    if frame.empty:
        raise ValueError("NASA POWER returned no observations for the requested range.")

    frame.index = pd.to_datetime(frame.index, format="%Y%m%d", errors="coerce")
    if frame.index.isna().any():
        raise ValueError("NASA POWER response contains an invalid observation date.")

    frame.index.name = "date"
    frame = frame.reset_index()
    frame["date"] = pd.to_datetime(frame["date"])

    for column in DATA_COLUMNS[1:]:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
        frame[column] = frame[column].mask(frame[column] == MISSING_VALUE)

    return frame[DATA_COLUMNS].sort_values("date").reset_index(drop=True)


def fetch_nasa_power(
    latitude: float,
    longitude: float,
    start_date: DateInput,
    end_date: DateInput,
    timeout: int = REQUEST_TIMEOUT_SECONDS,
) -> pd.DataFrame:
    """Fetch and clean NASA POWER daily observations for one point and date range.

    Dates may be supplied as ``YYYY-MM-DD``, ``YYYYMMDD``, or date objects.
    The returned data identifies NASA POWER observations but does not persist
    them automatically; use :func:`save_nasa_power_data` when persistence is
    desired.
    """
    _validate_coordinates(latitude, longitude)
    start, end = _validate_dates(start_date, end_date)

    params = {
        "parameters": ",".join(PARAMETER_COLUMNS),
        "community": "AG",
        "longitude": float(longitude),
        "latitude": float(latitude),
        "start": start.strftime("%Y%m%d"),
        "end": end.strftime("%Y%m%d"),
        "format": "JSON",
    }

    try:
        response = requests.get(API_URL, params=params, timeout=timeout)
        response.raise_for_status()
    except requests.HTTPError as error:
        status = error.response.status_code if error.response is not None else "unknown"
        raise RuntimeError(f"NASA POWER API returned HTTP {status}.") from error
    except requests.RequestException as error:
        raise RuntimeError(f"Could not connect to the NASA POWER API: {error}") from error

    try:
        data = response.json()
    except ValueError as error:
        raise RuntimeError("NASA POWER API returned invalid JSON.") from error

    try:
        return _response_to_dataframe(data)
    except ValueError as error:
        raise RuntimeError(f"Invalid NASA POWER API response: {error}") from error


def get_latest_valid_date(data: pd.DataFrame) -> Optional[pd.Timestamp]:
    """Return the latest date with at least one valid environmental value.

    Returns ``None`` if the table is empty or all environmental measurements
    are missing.
    """
    missing_columns = [
        column for column in DATA_COLUMNS[1:] if column not in data.columns
    ]
    if "date" not in data.columns or missing_columns:
        raise ValueError("data must contain date and all NASA POWER value columns.")

    if data.empty:
        return None

    measurements = data[DATA_COLUMNS[1:]].apply(pd.to_numeric, errors="coerce")
    measurements = measurements.mask(measurements == MISSING_VALUE)
    valid_rows = measurements.notna().any(axis=1)
    valid_dates = pd.to_datetime(data.loc[valid_rows, "date"], errors="coerce").dropna()
    if valid_dates.empty:
        return None
    return pd.Timestamp(valid_dates.max()).normalize()


def save_nasa_power_data(
    data: pd.DataFrame,
    latitude: float,
    longitude: float,
    start_date: DateInput,
    end_date: DateInput,
    output_directory: Optional[Union[str, Path]] = None,
) -> Path:
    """Save cleaned observations under a coordinate- and date-aware filename."""
    _validate_coordinates(latitude, longitude)
    start, end = _validate_dates(start_date, end_date)

    missing_columns = [column for column in DATA_COLUMNS if column not in data.columns]
    if missing_columns:
        raise ValueError(
            "data is missing required NASA POWER columns: "
            + ", ".join(missing_columns)
        )

    directory = Path(output_directory) if output_directory else DEFAULT_DATA_DIRECTORY
    directory.mkdir(parents=True, exist_ok=True)
    filename = (
        f"nasa_power_lat{float(latitude):.4f}_lon{float(longitude):.4f}_"
        f"{start:%Y%m%d}_{end:%Y%m%d}.csv"
    )
    path = directory / filename
    cleaned = data[DATA_COLUMNS].copy()
    cleaned["date"] = pd.to_datetime(cleaned["date"])
    for column in DATA_COLUMNS[1:]:
        cleaned[column] = pd.to_numeric(cleaned[column], errors="coerce")
        cleaned[column] = cleaned[column].mask(cleaned[column] == MISSING_VALUE)
    cleaned.to_csv(path, index=False)
    return path


def fetch_recent_nasa_power(
    latitude: float,
    longitude: float,
    days: int = 30,
    processing_lag_days: int = 3,
    timeout: int = REQUEST_TIMEOUT_SECONDS,
    save: bool = True,
    output_directory: Optional[Union[str, Path]] = None,
) -> pd.DataFrame:
    """Fetch a recent processed-daily window, allowing for data latency.

    This requests a recent date range and does not imply instant live data.
    When ``save`` is true, the cleaned CSV is saved under ``data/nasa_power``.
    """
    if not isinstance(days, int) or isinstance(days, bool) or days < 1:
        raise ValueError("days must be a positive integer.")
    if (
        not isinstance(processing_lag_days, int)
        or isinstance(processing_lag_days, bool)
        or processing_lag_days < 0
    ):
        raise ValueError("processing_lag_days must be a non-negative integer.")

    end = date.today() - timedelta(days=processing_lag_days)
    start = end - timedelta(days=days - 1)
    data = fetch_nasa_power(latitude, longitude, start, end, timeout=timeout)
    if save:
        save_nasa_power_data(
            data,
            latitude,
            longitude,
            start,
            end,
            output_directory=output_directory,
        )
    return data


def main() -> None:
    # Dhaka is an example location; callers should supply their own coordinates.
    example_latitude = 23.8103
    example_longitude = 90.4125
    recent_data = fetch_recent_nasa_power(example_latitude, example_longitude)
    latest_date = get_latest_valid_date(recent_data)
    print(recent_data.tail())
    print(f"Latest valid NASA POWER observation: {latest_date}")


if __name__ == "__main__":
    main()
