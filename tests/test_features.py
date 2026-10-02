import pandas as pd

from src.features import (
    aggregate_monthly,
    aggregate_seasonal,
    calculate_heat_stress_days,
    calculate_rainfall_features,
)


def _frame():
    return pd.DataFrame(
        {
            "date": pd.to_datetime(
                ["2025-01-30", "2025-01-31", "2025-02-01", "2025-03-01"]
            ),
            "temperature": [25.0, 30.0, 31.0, 29.0],
            "temp_max": [34.0, 35.0, 40.0, 36.0],
            "temp_min": [18.0, 20.0, 22.0, 19.0],
            "rainfall": [0.0, 5.0, 10.0, 0.05],
            "humidity": [60.0, 70.0, 80.0, 65.0],
            "wind_speed": [1.0, 2.0, 3.0, 2.0],
            "solar_radiation": [10.0, 12.0, 14.0, 11.0],
        }
    )


def test_heat_stress_threshold_is_configurable():
    frame = _frame()
    assert calculate_heat_stress_days(frame, threshold=35.0) == 3
    assert calculate_heat_stress_days(frame, threshold=40.0) == 1


def test_rainfall_aggregation():
    result = calculate_rainfall_features(_frame(), rainy_day_threshold=0.1)
    assert result["total_rainfall"] == 15.05
    assert result["average_daily_rainfall"] == 3.7625
    assert result["rainy_days"] == 2


def test_monthly_aggregation():
    result = aggregate_monthly(_frame(), heat_threshold=35.0)
    january = result.loc[result["period"] == "2025-01"].iloc[0]
    assert january["observation_days"] == 2
    assert january["heat_stress_days"] == 1
    assert january["total_rainfall"] == 5.0


def test_seasonal_aggregation_uses_meteorological_seasons():
    result = aggregate_seasonal(_frame())
    assert result["period"].tolist() == ["2025-DJF", "2025-MAM"]
    assert result.loc[0, "observation_days"] == 3
