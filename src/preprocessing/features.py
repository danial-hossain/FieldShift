"""Deterministic, transparent features derived from FieldState and observations."""

from dataclasses import dataclass
from typing import Any, Optional

import numpy as np
import pandas as pd

HEAT_STRESS_THRESHOLD_C = 35.0
LOW_SOIL_MOISTURE_THRESHOLD = 0.20
RECENT_WINDOW_DAYS = 7
MIN_RECENT_OBSERVATIONS = 2

RAW_ENVIRONMENT_FEATURES = (
    "temperature",
    "temp_max",
    "temp_min",
    "rainfall",
    "humidity",
    "wind_speed",
    "solar_radiation",
    "soil_moisture",
)
DERIVED_ENVIRONMENT_FEATURES = (
    "temperature_range",
    "heat_stress_indicator",
    "water_stress_indicator",
)
TEMPORAL_FEATURES = (
    "temperature_change",
    "rainfall_change",
    "soil_moisture_change",
    "recent_mean_temperature",
    "recent_mean_rainfall",
    "recent_mean_soil_moisture",
)
SOIL_FEATURES = (
    "nitrogen",
    "phosphorus",
    "potassium",
    "ph",
    "organic_matter",
)
CONTEXT_FEATURES = (
    "previous_crop",
    "previous_crop_family",
    "previous_crop_is_legume",
    "previous_yield",
    "previous_irrigation",
)
FEATURE_ORDER = (
    *RAW_ENVIRONMENT_FEATURES,
    *DERIVED_ENVIRONMENT_FEATURES,
    *TEMPORAL_FEATURES,
    *SOIL_FEATURES,
    *CONTEXT_FEATURES,
)
PROVENANCE_VALUES = {
    "observed": "observed",
    "synthetic": "synthetic",
    "demo": "synthetic",
    "missing": "unknown",
}
DERIVED_PROVENANCE_VALUES = {
    "observed": "derived_from_observed",
    "synthetic": "derived_from_synthetic",
    "mixed": "derived_from_mixed",
    "unknown": "unknown",
}


@dataclass(frozen=True)
class FeatureConfig:
    """Explicit engineering assumptions; values are not universal thresholds."""

    heat_stress_threshold_c: float = HEAT_STRESS_THRESHOLD_C
    low_soil_moisture_threshold: float = LOW_SOIL_MOISTURE_THRESHOLD
    recent_window_days: int = RECENT_WINDOW_DAYS
    min_recent_observations: int = MIN_RECENT_OBSERVATIONS

    def __post_init__(self) -> None:
        if not np.isfinite(self.heat_stress_threshold_c):
            raise ValueError("heat_stress_threshold_c must be finite.")
        if (
            not np.isfinite(self.low_soil_moisture_threshold)
            or not 0 <= self.low_soil_moisture_threshold <= 1
        ):
            raise ValueError(
                "low_soil_moisture_threshold must be within 0 and 1 m³/m³."
            )
        if (
            isinstance(self.recent_window_days, bool)
            or not isinstance(self.recent_window_days, int)
            or self.recent_window_days < 1
        ):
            raise ValueError("recent_window_days must be a positive integer.")
        if (
            isinstance(self.min_recent_observations, bool)
            or not isinstance(self.min_recent_observations, int)
            or self.min_recent_observations < 1
        ):
            raise ValueError("min_recent_observations must be a positive integer.")


def _number(value: Any) -> float:
    if value is None or value is pd.NA or pd.isna(value):
        return float("nan")
    try:
        number = float(value)
    except (TypeError, ValueError):
        return float("nan")
    if not np.isfinite(number) or number == -999:
        return float("nan")
    return number


def _source_status(field_state, key: str) -> str:
    statuses = getattr(field_state, "data_status", {}) or {}
    return PROVENANCE_VALUES.get(statuses.get(key, "missing"), "unknown")


def _derived_status(*statuses: str) -> str:
    known = set(statuses)
    if "unknown" in known or not known:
        return "unknown"
    if len(known) == 1:
        return DERIVED_PROVENANCE_VALUES[known.pop()]
    return DERIVED_PROVENANCE_VALUES["mixed"]


def _prepare_history(
    history: Optional[pd.DataFrame],
    value_column: str,
    cutoff: pd.Timestamp,
    default_status: str,
) -> pd.DataFrame:
    if history is None:
        return pd.DataFrame(columns=["date", "value", "status"])
    if not isinstance(history, pd.DataFrame):
        raise TypeError("Observation history must be a pandas DataFrame.")
    if "date" not in history.columns or value_column not in history.columns:
        raise ValueError(
            f"Observation history must contain date and {value_column} columns."
        )
    frame = history.copy()
    frame["date"] = pd.to_datetime(frame["date"], errors="coerce").dt.normalize()
    if frame["date"].isna().any():
        raise ValueError(f"{value_column} history contains invalid dates.")
    frame = frame.loc[frame["date"] <= cutoff].copy()
    frame["value"] = pd.to_numeric(frame[value_column], errors="coerce")
    frame["value"] = frame["value"].mask(frame["value"] == -999)
    if "data_status" in frame.columns:
        frame["status"] = frame["data_status"].map(
            lambda status: PROVENANCE_VALUES.get(
                str(status).strip().lower(), "unknown"
            )
        )
    else:
        frame["status"] = default_status
    return (
        frame.loc[frame["value"].notna(), ["date", "value", "status"]]
        .sort_values("date", kind="stable")
        .drop_duplicates("date", keep="last")
        .reset_index(drop=True)
    )


def _with_current_observation(
    history: pd.DataFrame,
    value: float,
    observation_date: pd.Timestamp,
    status: str,
) -> pd.DataFrame:
    if not np.isfinite(value):
        return history.copy()
    # Current FieldState data is authoritative for its date; avoid counting a
    # duplicate source row as a second observation.
    previous = history.loc[history["date"] != observation_date]
    current = pd.DataFrame(
        [[observation_date, value, status]], columns=["date", "value", "status"]
    )
    return (
        pd.concat([previous, current], ignore_index=True)
        .sort_values("date", kind="stable")
        .drop_duplicates("date", keep="last")
        .reset_index(drop=True)
    )


def _temporal_features(
    field_state,
    environmental_history: Optional[pd.DataFrame],
    smap_history: Optional[pd.DataFrame],
    config: FeatureConfig,
) -> tuple[dict[str, float], dict[str, str]]:
    as_of = pd.Timestamp(field_state.as_of_date).normalize()
    env_status = _source_status(field_state, "environment")
    smap_status = _source_status(field_state, "soil_moisture")

    env_series = {
        column: _prepare_history(
            environmental_history, column, as_of, default_status="observed"
        )
        for column in ("temperature", "rainfall")
    }
    smap_series = {
        "soil_moisture": _prepare_history(
            smap_history, "soil_moisture", as_of, default_status=smap_status
        )
    }
    current_observation_dates = {
        "temperature": getattr(field_state, "environment_observation_date", None),
        "rainfall": getattr(field_state, "environment_observation_date", None),
        "soil_moisture": getattr(field_state, "soil_moisture_observation_date", None),
    }
    current_values = {
        "temperature": _number(field_state.temperature),
        "rainfall": _number(field_state.rainfall),
        "soil_moisture": _number(field_state.soil_moisture),
    }
    statuses = {
        "temperature": env_status,
        "rainfall": env_status,
        "soil_moisture": smap_status,
    }
    all_series = {**env_series, **smap_series}
    changes = {}
    means = {}
    provenance = {}
    window_start = as_of - pd.Timedelta(days=config.recent_window_days - 1)

    for variable in ("temperature", "rainfall", "soil_moisture"):
        current_value = current_values[variable]
        observation_date = current_observation_dates[variable]
        if observation_date is None or pd.isna(observation_date):
            observation_date = as_of
        else:
            observation_date = pd.Timestamp(observation_date).normalize()

        history = all_series[variable].copy()
        # Do not use any future-to-current observation as the "previous"
        # value, even when it falls before the decision date.
        previous_rows = history.loc[history["date"] < observation_date]
        previous_value = (
            float(previous_rows.iloc[-1]["value"])
            if not previous_rows.empty
            else float("nan")
        )
        if np.isfinite(current_value) and np.isfinite(previous_value):
            changes[variable] = current_value - previous_value
            previous_status = str(previous_rows.iloc[-1]["status"])
            provenance[f"{variable}_change"] = _derived_status(
                statuses[variable], previous_status
            )
        else:
            changes[variable] = float("nan")
            provenance[f"{variable}_change"] = "unknown"

        combined = _with_current_observation(
            history, current_value, observation_date, statuses[variable]
        )
        recent = combined.loc[
            combined["date"].between(window_start, as_of, inclusive="both")
        ]
        if len(recent) >= config.min_recent_observations:
            means[variable] = float(recent["value"].mean())
            provenance[f"recent_mean_{variable}"] = _derived_status(
                *recent["status"].astype(str).tolist()
            )
        else:
            means[variable] = float("nan")
            provenance[f"recent_mean_{variable}"] = "unknown"

    values = {
        "temperature_change": changes["temperature"],
        "rainfall_change": changes["rainfall"],
        "soil_moisture_change": changes["soil_moisture"],
        "recent_mean_temperature": means["temperature"],
        "recent_mean_rainfall": means["rainfall"],
        "recent_mean_soil_moisture": means["soil_moisture"],
    }
    return values, provenance


def build_features(
    field_state,
    environmental_history: Optional[pd.DataFrame] = None,
    smap_history: Optional[pd.DataFrame] = None,
    config: Optional[FeatureConfig] = None,
) -> dict[str, Any]:
    """Build ordered raw/derived features and their provenance metadata.

    ``environmental_history`` accepts normalized NASA POWER observations with
    ``date``, ``temperature`` and ``rainfall`` columns. ``smap_history``
    accepts normalized SMAP observations with ``date`` and ``soil_moisture``.
    Both are optional; missing temporal values remain NaN. Recent means require
    at least ``min_recent_observations`` distinct dated observations in the
    configured calendar-day window, including an available FieldState value.
    """
    if config is None:
        config = FeatureConfig()
    if not hasattr(field_state, "as_of_date"):
        raise TypeError("field_state must provide the FieldState interface.")

    values: dict[str, Any] = {}
    provenance: dict[str, str] = {}

    for name in RAW_ENVIRONMENT_FEATURES:
        values[name] = _number(getattr(field_state, name, None))
        category = "soil_moisture" if name == "soil_moisture" else "environment"
        status = _source_status(field_state, category)
        provenance[name] = status if np.isfinite(values[name]) else "unknown"

    temp_max = values["temp_max"]
    temp_min = values["temp_min"]
    temperature = values["temperature"]
    if np.isfinite(temp_max) and np.isfinite(temp_min):
        values["temperature_range"] = temp_max - temp_min
        provenance["temperature_range"] = _derived_status(
            provenance["temp_max"], provenance["temp_min"]
        )
    else:
        values["temperature_range"] = float("nan")
        provenance["temperature_range"] = "unknown"

    if np.isfinite(temperature):
        values["heat_stress_indicator"] = int(
            temperature > config.heat_stress_threshold_c
        )
        provenance["heat_stress_indicator"] = _derived_status(
            provenance["temperature"]
        )
    else:
        values["heat_stress_indicator"] = float("nan")
        provenance["heat_stress_indicator"] = "unknown"

    soil_moisture = values["soil_moisture"]
    if np.isfinite(soil_moisture):
        values["water_stress_indicator"] = int(
            soil_moisture < config.low_soil_moisture_threshold
        )
        provenance["water_stress_indicator"] = _derived_status(
            provenance["soil_moisture"]
        )
    else:
        values["water_stress_indicator"] = float("nan")
        provenance["water_stress_indicator"] = "unknown"

    temporal_values, temporal_provenance = _temporal_features(
        field_state, environmental_history, smap_history, config
    )
    values.update(temporal_values)
    provenance.update(temporal_provenance)

    for name in SOIL_FEATURES:
        values[name] = _number(getattr(field_state, name, None))
        source_status = _source_status(field_state, "soil")
        provenance[name] = source_status if np.isfinite(values[name]) else "unknown"
    for name in CONTEXT_FEATURES:
        value = getattr(field_state, name, None)
        values[name] = _number(value) if name == "previous_yield" else value
        if name in ("previous_crop_family", "previous_crop_is_legume"):
            category = "crop"
        else:
            category = "history"
        present = not (
            value is None
            or (isinstance(value, (float, np.floating)) and np.isnan(value))
        )
        provenance[name] = (
            _source_status(field_state, category) if present else "unknown"
        )

    ordered = {name: values[name] for name in FEATURE_ORDER}
    ordered["provenance"] = {name: provenance[name] for name in FEATURE_ORDER}
    return ordered
