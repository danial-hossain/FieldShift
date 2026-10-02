"""Client for NASA POWER daily point climate data.

NASA POWER provides location-based gridded climate data. It is not a source of
field-sensor observations.
"""

from __future__ import annotations

import argparse
from datetime import date, datetime
from pathlib import Path
from typing import Any

import pandas as pd
import requests

NASA_POWER_DAILY_POINT_URL = (
    "https://power.larc.nasa.gov/api/temporal/daily/point"
)
DEFAULT_TIMEOUT_SECONDS = 30
POWER_PARAMETERS = (
    "T2M",
    "T2M_MAX",
    "T2M_MIN",
    "PRECTOTCORR",
    "RH2M",
    "WS2M",
    "ALLSKY_SFC_SW_DWN",
)
PARAMETER_COLUMNS = {
    "T2M": "temperature",
    "T2M_MAX": "temp_max",
    "T2M_MIN": "temp_min",
    "PRECTOTCORR": "rainfall",
    "RH2M": "humidity",
    "WS2M": "wind_speed",
    "ALLSKY_SFC_SW_DWN": "solar_radiation",
}
OUTPUT_COLUMNS = ("date", *PARAMETER_COLUMNS.values())


class NasaPowerError(RuntimeError):
    """Raised when NASA POWER data cannot be fetched or safely interpreted."""


def _normalise_api_date(value: str | int | date | datetime) -> str:
    """Return a date in the YYYYMMDD format expected by NASA POWER."""
    if isinstance(value, datetime):
        value = value.date()
    if isinstance(value, date):
        return value.strftime("%Y%m%d")

    text = str(value).strip()
    try:
        parsed = datetime.strptime(text, "%Y%m%d")
    except ValueError as exc:
        raise ValueError(
            f"Invalid date {value!r}; expected YYYYMMDD, for example 20250101."
        ) from exc
    return parsed.strftime("%Y%m%d")


def _validate_coordinates(latitude: float, longitude: float) -> None:
    if not -90 <= latitude <= 90:
        raise ValueError("latitude must be between -90 and 90 degrees.")
    if not -180 <= longitude <= 180:
        raise ValueError("longitude must be between -180 and 180 degrees.")


def _extract_parameters(payload: Any) -> dict[str, dict[str, Any]]:
    """Validate the relevant response schema and return parameter observations."""
    try:
        parameters = payload["properties"]["parameter"]
    except (KeyError, TypeError) as exc:
        raise NasaPowerError(
            "NASA POWER response is missing properties.parameter."
        ) from exc

    if not isinstance(parameters, dict):
        raise NasaPowerError("NASA POWER properties.parameter must be an object.")

    missing_parameters = [name for name in POWER_PARAMETERS if name not in parameters]
    if missing_parameters:
        raise NasaPowerError(
            "NASA POWER response is missing requested parameters: "
            + ", ".join(missing_parameters)
        )

    for name in POWER_PARAMETERS:
        if not isinstance(parameters[name], dict) or not parameters[name]:
            raise NasaPowerError(
                f"NASA POWER parameter {name} has no daily observations."
            )

    expected_dates = set(parameters[POWER_PARAMETERS[0]])
    for name in POWER_PARAMETERS[1:]:
        actual_dates = set(parameters[name])
        if actual_dates != expected_dates:
            missing_dates = sorted(expected_dates - actual_dates)
            extra_dates = sorted(actual_dates - expected_dates)
            detail = []
            if missing_dates:
                detail.append(f"missing {len(missing_dates)} date(s)")
            if extra_dates:
                detail.append(f"containing {len(extra_dates)} unexpected date(s)")
            raise NasaPowerError(
                f"NASA POWER parameter {name} has misaligned dates"
                + (f" ({', '.join(detail)})" if detail else "")
                + "."
            )

    return parameters


def fetch_nasa_power(
    latitude: float,
    longitude: float,
    start_date: str | int | date | datetime,
    end_date: str | int | date | datetime,
    *,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
    session: requests.Session | None = None,
) -> pd.DataFrame:
    """Fetch daily NASA POWER climate data for one point.

    The returned values are deliberately not imputed or range-corrected. Pass
    the DataFrame to :func:`src.preprocessing.preprocess_climate_data` before
    downstream use.
    """
    latitude = float(latitude)
    longitude = float(longitude)
    _validate_coordinates(latitude, longitude)
    start = _normalise_api_date(start_date)
    end = _normalise_api_date(end_date)
    if start > end:
        raise ValueError("start_date must be on or before end_date.")
    if timeout <= 0:
        raise ValueError("timeout must be greater than zero.")

    params = {
        "parameters": ",".join(POWER_PARAMETERS),
        "community": "AG",
        "longitude": longitude,
        "latitude": latitude,
        "start": start,
        "end": end,
        "format": "JSON",
    }
    requester = session if session is not None else requests

    try:
        response = requester.get(
            NASA_POWER_DAILY_POINT_URL,
            params=params,
            timeout=timeout,
        )
        response.raise_for_status()
    except requests.Timeout as exc:
        raise NasaPowerError(
            f"NASA POWER request timed out after {timeout:g} seconds."
        ) from exc
    except requests.ConnectionError as exc:
        raise NasaPowerError("Could not connect to the NASA POWER API.") from exc
    except requests.HTTPError as exc:
        status = getattr(exc.response, "status_code", "unknown")
        raise NasaPowerError(
            f"NASA POWER returned HTTP status {status}."
        ) from exc
    except requests.RequestException as exc:
        raise NasaPowerError(f"NASA POWER request failed: {exc}") from exc

    try:
        payload = response.json()
    except ValueError as exc:
        raise NasaPowerError("NASA POWER returned invalid JSON.") from exc

    parameters = _extract_parameters(payload)
    frame = pd.DataFrame(
        {
            PARAMETER_COLUMNS[name]: pd.Series(parameters[name])
            for name in POWER_PARAMETERS
        }
    )
    frame.index.name = "date"
    frame = frame.reset_index()

    try:
        frame["date"] = pd.to_datetime(
            frame["date"], format="%Y%m%d", errors="raise"
        )
    except (ValueError, TypeError) as exc:
        raise NasaPowerError(
            "NASA POWER response contains an invalid daily date key."
        ) from exc

    for column in PARAMETER_COLUMNS.values():
        numeric = pd.to_numeric(frame[column], errors="coerce")
        unexpected = numeric.isna() & frame[column].notna()
        if unexpected.any():
            raise NasaPowerError(
                f"NASA POWER parameter for {column} contains "
                f"{int(unexpected.sum())} non-numeric observation(s)."
            )
        frame[column] = numeric

    return frame.loc[:, OUTPUT_COLUMNS].sort_values("date").reset_index(drop=True)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Fetch NASA POWER daily climate data for one point."
    )
    parser.add_argument("--latitude", required=True, type=float)
    parser.add_argument("--longitude", required=True, type=float)
    parser.add_argument("--start", required=True, help="Start date as YYYYMMDD")
    parser.add_argument("--end", required=True, help="End date as YYYYMMDD")
    parser.add_argument(
        "--output", required=True, type=Path, help="Path for the raw output CSV"
    )
    parser.add_argument(
        "--timeout", type=float, default=DEFAULT_TIMEOUT_SECONDS
    )
    return parser


def main() -> None:
    args = _build_parser().parse_args()
    frame = fetch_nasa_power(
        latitude=args.latitude,
        longitude=args.longitude,
        start_date=args.start,
        end_date=args.end,
        timeout=args.timeout,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(args.output, index=False, date_format="%Y-%m-%d")
    print(f"Wrote {len(frame)} daily observations to {args.output}")


if __name__ == "__main__":
    main()
