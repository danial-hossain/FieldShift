"""Fetch, clean, and save observations from the NASA POWER Daily Point API."""

import hashlib
import json
import math
import re
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import pandas as pd
import requests

API_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
API_DOCUMENTATION_URL = "https://power.larc.nasa.gov/docs/services/api/temporal/daily/"
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
PROVENANCE_MANIFEST_PATH = DEFAULT_DATA_DIRECTORY / "nasa_power_provenance_manifest.json"
DateInput = Union[str, date, datetime, pd.Timestamp]
KNOWN_UNIT_MAP = {
    "temperature": "°C",
    "temp_max": "°C",
    "temp_min": "°C",
    "rainfall": "mm/day",
    "humidity": "%",
    "wind_speed": "m/s",
    "solar_radiation": "MJ/m2/day",
}
VALUE_VALIDATION_RANGES = {
    "temperature": (-100.0, 70.0),
    "temp_max": (-100.0, 70.0),
    "temp_min": (-100.0, 70.0),
    "rainfall": (0.0, None),
    "humidity": (0.0, 100.0),
    "wind_speed": (0.0, None),
    "solar_radiation": (0.0, None),
}


def _validate_coordinates(latitude: float, longitude: float) -> None:
    """Raise ValueError when coordinates are not valid geographic values."""
    if isinstance(latitude, bool) or isinstance(longitude, bool):
        raise ValueError("latitude and longitude must be numeric coordinates, not booleans.")
    try:
        latitude_value = float(latitude)
    except (TypeError, ValueError) as error:
        raise ValueError("latitude must be a number between -90 and 90.") from error
    try:
        longitude_value = float(longitude)
    except (TypeError, ValueError) as error:
        raise ValueError("longitude must be a number between -180 and 180.") from error

    if not math.isfinite(latitude_value) or not -90 <= latitude_value <= 90:
        raise ValueError("latitude must be between -90 and 90.")
    if not math.isfinite(longitude_value) or not -180 <= longitude_value <= 180:
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
    if end.date() > date.today():
        raise ValueError("end_date must not be in the future; NASA POWER is not a forecast.")
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
        raw_values = frame[column]
        numeric_values = pd.to_numeric(raw_values, errors="coerce")
        malformed = (
            numeric_values.isna()
            & raw_values.notna()
            & ~raw_values.astype(str).str.strip().eq(str(MISSING_VALUE))
        )
        if malformed.any():
            raise ValueError(
                f"NASA POWER parameter '{column}' contains a non-numeric value."
            )
        numeric_values = numeric_values.mask(numeric_values == MISSING_VALUE)
        finite_values = numeric_values.dropna()
        if not all(math.isfinite(float(value)) for value in finite_values):
            raise ValueError(
                f"NASA POWER parameter '{column}' contains a non-finite value."
            )
        minimum, maximum = VALUE_VALIDATION_RANGES[column]
        invalid_range = pd.Series(False, index=frame.index)
        if minimum is not None:
            invalid_range |= numeric_values.lt(minimum)
        if maximum is not None:
            invalid_range |= numeric_values.gt(maximum)
        if invalid_range.any():
            raise ValueError(
                f"NASA POWER parameter '{column}' contains a value outside "
                "its supported physical range."
            )
        frame[column] = numeric_values

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
    if isinstance(timeout, bool) or not isinstance(timeout, (int, float)):
        raise ValueError("timeout must be a positive finite number of seconds.")
    if not math.isfinite(float(timeout)) or timeout <= 0:
        raise ValueError("timeout must be a positive finite number of seconds.")

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
    except requests.Timeout as error:
        raise RuntimeError(
            f"NASA POWER API request timed out after {timeout:g} seconds."
        ) from error
    except requests.RequestException as error:
        raise RuntimeError(f"Could not connect to the NASA POWER API: {error}") from error

    try:
        data = response.json()
    except ValueError as error:
        raise RuntimeError("NASA POWER API returned invalid JSON.") from error

    try:
        frame = _response_to_dataframe(data)
        if not frame["date"].between(start, end).all():
            raise ValueError(
                "NASA POWER response contains dates outside the requested range."
            )
        return frame
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


def _hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _parse_coordinate_from_filename(path: Path) -> Optional[Dict[str, Any]]:
    match = re.search(
        r"lat(?P<latitude>-?\d+(?:\.\d+)?)_lon(?P<longitude>-?\d+(?:\.\d+)?)",
        path.name,
        flags=re.IGNORECASE,
    )
    if not match:
        return None
    latitude = float(match.group("latitude"))
    longitude = float(match.group("longitude"))
    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        return None
    return {
        "latitude": latitude,
        "longitude": longitude,
        "source": "filename_reconstruction",
        "status": "reconstructed_only_not_original_request_metadata",
    }


def _load_csv_frame(csv_path: Path) -> pd.DataFrame:
    frame = pd.read_csv(csv_path)
    if "date" not in frame.columns:
        raise ValueError(f"{csv_path.name}: missing required date column.")
    frame["date"] = pd.to_datetime(frame["date"], errors="coerce")
    if frame["date"].isna().any():
        raise ValueError(f"{csv_path.name}: contains invalid date values.")
    return frame


def build_nasa_power_manifest(csv_path: Union[str, Path]) -> Dict[str, Any]:
    """Build a provenance record for a checked-in NASA POWER CSV snapshot.

    The returned manifest contains all metadata the repository can support from
    the file and project-level evidence without inventing an original request.
    """
    path = Path(csv_path)
    if not path.exists():
        raise FileNotFoundError(f"NASA POWER CSV not found: {path}")

    frame = _load_csv_frame(path)
    actual_start = pd.Timestamp(frame["date"].min()).strftime("%Y-%m-%d")
    actual_end = pd.Timestamp(frame["date"].max()).strftime("%Y-%m-%d")
    filename_coords = _parse_coordinate_from_filename(path)

    unresolved_gaps = [
        "Original request URL and exact API parameters are not stored in the local CSV.",
        "Retrieval timestamp is not recorded in the repository evidence.",
        "The local file does not prove the source request corresponds to a specific field or real-world observation record.",
    ]
    manifest: Dict[str, Any] = {
        "source_product_name": "NASA POWER Daily Point API",
        "official_api_documentation_url": API_DOCUMENTATION_URL,
        "local_csv_path": str(path),
        "file_hash_sha256": _hash_file(path),
        "latitude": None,
        "longitude": None,
        "actual_coverage": {
            "start_date": actual_start,
            "end_date": actual_end,
        },
        "requested_dates": {
            "start_date": None,
            "end_date": None,
            "status": "not recorded in repository evidence",
        },
        "requested_parameters": list(PARAMETER_COLUMNS.keys()),
        "documented_units": {key: value for key, value in KNOWN_UNIT_MAP.items()},
        "temporal_aggregation": "daily",
        "retrieval_timestamp": {
            "value": None,
            "status": "unknown; not recoverable from repository evidence",
        },
        "api_request_url": {
            "value": None,
            "status": "not recorded in repository evidence; use the documented daily point API endpoint when reproducing a request",
        },
        "missing_value_handling": {
            "api_missing_marker": -999,
            "project_cleaning": "converted to NaN in src.data.nasa_power._response_to_dataframe",
            "local_csv_status": "blank cells and NaN values may remain depending on persistence",
        },
        "provenance_status": "partial_repository_evidence_only",
        "unresolved_gaps": unresolved_gaps,
        "reconstructed_metadata": {
            "filename_coordinates": filename_coords,
            "request_parameters_recovered_from_project_code": {
                "community": "AG",
                "format": "JSON",
                "parameters": list(PARAMETER_COLUMNS.keys()),
            },
        },
    }

    if filename_coords:
        manifest["latitude"] = filename_coords["latitude"]
        manifest["longitude"] = filename_coords["longitude"]
        manifest["provenance_status"] = "filename_reconstruction_only"
        manifest["unresolved_gaps"].append(
            "Coordinates recovered from the filename are reconstructed metadata, not original request metadata."
        )
    else:
        manifest["unresolved_gaps"].append(
            "Coordinates remain unknown for this snapshot because the repository does not store them in the file or a companion metadata record."
        )

    return manifest


def write_nasa_power_provenance_manifest(
    directory: Optional[Union[str, Path]] = None,
) -> Path:
    """Write a provenance manifest for all checked-in NASA POWER CSV snapshots."""
    target_directory = Path(directory) if directory else DEFAULT_DATA_DIRECTORY
    target_directory.mkdir(parents=True, exist_ok=True)
    files = sorted(target_directory.glob("nasa_power*.csv"))
    entries = [build_nasa_power_manifest(path) for path in files]
    manifest = {
        "phase": "FieldShift Phase 31",
        "source_product_name": "NASA POWER Daily Point API",
        "official_api_documentation_url": API_DOCUMENTATION_URL,
        "files": entries,
    }
    manifest_path = target_directory / "nasa_power_provenance_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest_path


def validate_nasa_power_manifest(manifest: Union[str, Path, Dict[str, Any]]) -> List[str]:
    """Validate a manifest against the corresponding local CSV when possible."""
    if isinstance(manifest, (str, Path)):
        manifest_path = Path(manifest)
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    errors: List[str] = []
    files = manifest.get("files") if isinstance(manifest, dict) else None
    if not isinstance(files, list):
        return ["Manifest must contain a 'files' list."]

    for entry in files:
        file_path = Path(entry.get("local_csv_path", ""))
        if not file_path.exists():
            errors.append(f"Manifest references missing file: {file_path}.")
            continue
        try:
            frame = _load_csv_frame(file_path)
        except ValueError as error:
            errors.append(str(error))
            continue
        actual_start = pd.Timestamp(frame["date"].min()).strftime("%Y-%m-%d")
        actual_end = pd.Timestamp(frame["date"].max()).strftime("%Y-%m-%d")
        manifest_start = entry.get("actual_coverage", {}).get("start_date")
        manifest_end = entry.get("actual_coverage", {}).get("end_date")
        if manifest_start and manifest_start != actual_start:
            errors.append(
                f"{file_path.name}: declared actual coverage start {manifest_start!r} "
                f"does not match CSV content {actual_start!r}."
            )
        if manifest_end and manifest_end != actual_end:
            errors.append(
                f"{file_path.name}: declared actual coverage end {manifest_end!r} "
                f"does not match CSV content {actual_end!r}."
            )

        latitude = entry.get("latitude")
        longitude = entry.get("longitude")
        if latitude is not None and not (-90 <= float(latitude) <= 90):
            errors.append(f"{file_path.name}: invalid latitude in manifest: {latitude!r}.")
        if longitude is not None and not (-180 <= float(longitude) <= 180):
            errors.append(f"{file_path.name}: invalid longitude in manifest: {longitude!r}.")

        retrieval_value = entry.get("retrieval_timestamp", {}).get("value")
        if retrieval_value not in (None, "unknown"):
            try:
                datetime.fromisoformat(str(retrieval_value).replace("Z", "+00:00"))
            except ValueError:
                errors.append(
                    f"{file_path.name}: retrieval_timestamp must be ISO 8601 or null/unknown."
                )

    return errors


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
