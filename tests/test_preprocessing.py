import numpy as np
import pandas as pd

from src.preprocessing import (
    normalise_missing_values,
    preprocess_climate_data,
    standardize_dates,
    validate_climate_values,
)


def _frame(**overrides):
    values = {
        "date": ["2025-01-01", "2025-01-02", "2025-01-03"],
        "temperature": [20.0, 21.0, 22.0],
        "temp_max": [25.0, 26.0, 27.0],
        "temp_min": [15.0, 16.0, 17.0],
        "rainfall": [0.0, 4.0, 1.0],
        "humidity": [70.0, 72.0, 74.0],
        "wind_speed": [1.0, 2.0, 3.0],
        "solar_radiation": [10.0, 11.0, 12.0],
    }
    values.update(overrides)
    return pd.DataFrame(values)


def test_date_conversion_sorting_and_duplicate_removal():
    frame = _frame(
        date=["2025-01-02", "2025-01-01", "2025-01-01"]
    )
    result, counts = standardize_dates(frame)

    assert pd.api.types.is_datetime64_any_dtype(result["date"])
    assert result["date"].is_monotonic_increasing
    assert len(result) == 2
    assert counts["duplicate_dates_removed"] == 1


def test_missing_markers_and_non_numeric_values_become_nan():
    frame = _frame(temperature=[20.0, -999.0, "bad"])
    result, counts = normalise_missing_values(frame)

    assert result["temperature"].isna().tolist() == [False, True, True]
    assert result["temperature_was_missing"].tolist() == [False, True, True]
    assert counts["temperature"] == 2


def test_negative_rainfall_is_flagged_not_zeroed():
    frame = _frame(rainfall=[0.0, -1.0, 2.0])
    result, counts = validate_climate_values(frame)

    assert np.isnan(result.loc[1, "rainfall"])
    assert bool(result.loc[1, "rainfall_was_invalid"])
    assert counts["rainfall"] == 1


def test_humidity_outside_zero_to_one_hundred_is_flagged():
    frame = _frame(humidity=[-0.1, 50.0, 100.1])
    result, counts = validate_climate_values(frame)

    assert result["humidity"].isna().tolist() == [True, False, True]
    assert counts["humidity"] == 2


def test_short_continuous_gap_is_interpolated_but_rainfall_is_not():
    frame = _frame(
        temperature=[20.0, -999.0, 24.0],
        rainfall=[0.0, -999.0, 2.0],
    )
    result, report = preprocess_climate_data(frame)

    assert result.loc[1, "temperature"] == 22.0
    assert np.isnan(result.loc[1, "rainfall"])
    assert bool(result.loc[1, "temperature_was_missing"])
    assert report.interpolated_values["temperature"] == 1
    assert report.interpolated_values["rainfall"] == 0
