"""Agricultural climate features derived from cleaned daily observations."""

from __future__ import annotations

import pandas as pd

FEATURE_COLUMNS = (
    "observation_days",
    "mean_temperature",
    "maximum_temperature",
    "minimum_temperature",
    "heat_stress_days",
    "total_rainfall",
    "average_daily_rainfall",
    "rainy_days",
    "mean_humidity",
    "mean_wind_speed",
    "mean_solar_radiation",
)


def _require_columns(frame: pd.DataFrame, columns: tuple[str, ...]) -> None:
    missing = [column for column in columns if column not in frame.columns]
    if missing:
        raise ValueError("Missing required columns: " + ", ".join(missing))


def calculate_heat_stress_days(
    frame: pd.DataFrame,
    threshold: float = 35.0,
    *,
    temperature_column: str = "temp_max",
) -> int:
    """Count days whose selected temperature is at or above ``threshold``."""
    _require_columns(frame, (temperature_column,))
    values = pd.to_numeric(frame[temperature_column], errors="coerce")
    return int(values.ge(float(threshold)).sum())


def calculate_rainfall_features(
    frame: pd.DataFrame,
    *,
    rainy_day_threshold: float = 0.1,
) -> dict[str, float | int]:
    """Calculate rainfall metrics while leaving missing rain out of denominators."""
    if rainy_day_threshold < 0:
        raise ValueError("rainy_day_threshold must not be negative.")
    _require_columns(frame, ("rainfall",))
    rainfall = pd.to_numeric(frame["rainfall"], errors="coerce")
    return {
        "total_rainfall": float(rainfall.sum(min_count=1)),
        "average_daily_rainfall": float(rainfall.mean()),
        "rainy_days": int(rainfall.ge(rainy_day_threshold).sum()),
    }


def calculate_climate_summary(
    frame: pd.DataFrame,
    *,
    heat_threshold: float = 35.0,
    rainy_day_threshold: float = 0.1,
) -> dict[str, float | int]:
    """Summarize daily climate data for one arbitrary period."""
    required = (
        "temperature",
        "temp_max",
        "temp_min",
        "rainfall",
        "humidity",
        "wind_speed",
        "solar_radiation",
    )
    _require_columns(frame, required)
    numeric = frame.loc[:, required].apply(pd.to_numeric, errors="coerce")
    rainfall_features = calculate_rainfall_features(
        numeric, rainy_day_threshold=rainy_day_threshold
    )
    return {
        "observation_days": int(len(frame)),
        "mean_temperature": float(numeric["temperature"].mean()),
        "maximum_temperature": float(numeric["temp_max"].max()),
        "minimum_temperature": float(numeric["temp_min"].min()),
        "heat_stress_days": calculate_heat_stress_days(
            numeric, threshold=heat_threshold
        ),
        **rainfall_features,
        "mean_humidity": float(numeric["humidity"].mean()),
        "mean_wind_speed": float(numeric["wind_speed"].mean()),
        "mean_solar_radiation": float(numeric["solar_radiation"].mean()),
    }


def _aggregate_groups(
    groups: object,
    *,
    heat_threshold: float,
    rainy_day_threshold: float,
) -> pd.DataFrame:
    records: list[dict[str, float | int | str]] = []
    for key, group in groups:  # type: ignore[union-attr]
        records.append(
            {
                "period": key,
                **calculate_climate_summary(
                    group,
                    heat_threshold=heat_threshold,
                    rainy_day_threshold=rainy_day_threshold,
                ),
            }
        )
    return pd.DataFrame.from_records(records, columns=("period", *FEATURE_COLUMNS))


def aggregate_monthly(
    frame: pd.DataFrame,
    *,
    heat_threshold: float = 35.0,
    rainy_day_threshold: float = 0.1,
) -> pd.DataFrame:
    """Aggregate daily data by calendar month; ``period`` is YYYY-MM."""
    _require_columns(frame, ("date",))
    dated = frame.copy()
    dated["date"] = pd.to_datetime(dated["date"], errors="raise")
    groups = dated.groupby(dated["date"].dt.to_period("M"), sort=True)
    result = _aggregate_groups(
        groups,
        heat_threshold=heat_threshold,
        rainy_day_threshold=rainy_day_threshold,
    )
    if not result.empty:
        result["period"] = result["period"].astype(str)
    return result


def aggregate_seasonal(
    frame: pd.DataFrame,
    *,
    heat_threshold: float = 35.0,
    rainy_day_threshold: float = 0.1,
) -> pd.DataFrame:
    """Aggregate by meteorological season (DJF, MAM, JJA, SON).

    December is assigned to the following season-year, so December 2025 and
    January/February 2026 share the ``2026-DJF`` period.
    """
    _require_columns(frame, ("date",))
    dated = frame.copy()
    dated["date"] = pd.to_datetime(dated["date"], errors="raise")
    month = dated["date"].dt.month
    season_for_month = {
        12: "DJF",
        1: "DJF",
        2: "DJF",
        3: "MAM",
        4: "MAM",
        5: "MAM",
        6: "JJA",
        7: "JJA",
        8: "JJA",
        9: "SON",
        10: "SON",
        11: "SON",
    }
    season_year = dated["date"].dt.year + month.eq(12).astype(int)
    season = month.map(season_for_month)
    period = season_year.astype(str) + "-" + season
    groups = dated.groupby(period, sort=False)
    return _aggregate_groups(
        groups,
        heat_threshold=heat_threshold,
        rainy_day_threshold=rainy_day_threshold,
    )
