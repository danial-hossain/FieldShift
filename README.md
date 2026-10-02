# FieldShift — Phase 1

FieldShift Phase 1 is a modular pipeline for location-based daily climate data:

```text
NASA POWER API -> validation -> cleaning -> feature engineering -> clean CSV
```

It does **not** treat NASA POWER as field-sensor data and does not infer soil
conditions, nutrients, yield, crop prices, or other field measurements. AI,
reinforcement learning, optimization, SMAP, API, and frontend work are outside
this phase.

## Requirements and installation

Use Python 3.11 or newer. From the project root (for example
`C:\FieldShift` on Windows):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Phase 1 uses only pandas, NumPy, requests, and pytest. Climate observations come
from the official [NASA POWER Daily Point API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/point/).

## Fetch NASA POWER data

`fetch_nasa_power` accepts coordinates and dates rather than embedding a fixed
location:

```powershell
python -m src.nasa_power `
  --latitude 23.8103 `
  --longitude 90.4125 `
  --start 20250101 `
  --end 20251231 `
  --output data/nasa_power/nasa_power_2025_download.csv
```

The equivalent Python API is:

```python
from src.nasa_power import fetch_nasa_power

raw = fetch_nasa_power(
    latitude=23.8103,
    longitude=90.4125,
    start_date="20250101",
    end_date="20251231",
)
raw.to_csv("data/nasa_power/nasa_power_2025.csv", index=False)
```

The fetcher requests T2M, T2M_MAX, T2M_MIN, PRECTOTCORR, RH2M, WS2M, and
ALLSKY_SFC_SW_DWN using `community=AG`. It applies a request timeout and checks
HTTP failures, connectivity, JSON validity, required parameters, and aligned
daily keys before returning a DataFrame.

## Generate the clean dataset

The repository keeps `data/nasa_power/nasa_power_2025.csv` as immutable raw
input. Generate the separate clean output with:

```powershell
python -m src.preprocessing
```

Equivalent explicit paths are:

```powershell
python -m src.preprocessing `
  --input data/nasa_power/nasa_power_2025.csv `
  --output data/nasa_power/nasa_power_2025_clean.csv
```

The command prints a JSON audit report and writes
`data/nasa_power/nasa_power_2025_clean.csv`. Its primary columns are:

```text
date, temperature, temp_max, temp_min, rainfall, humidity, wind_speed,
solar_radiation
```

It also writes per-variable `*_was_missing` and `*_was_invalid` provenance
flags. Missing markers and implausible observations become `NaN`; they are not
converted to zero. Internal gaps of at most two days are linearly interpolated
for temperature, humidity, wind, and solar radiation. Rainfall is never
interpolated. Invalid dates and duplicate dates are explicitly counted in the
report when removed.

## Feature engineering

`src.features` exposes `calculate_heat_stress_days`,
`calculate_rainfall_features`, `calculate_climate_summary`,
`aggregate_monthly`, and `aggregate_seasonal`. Heat-stress and rainy-day
thresholds are call-time parameters so crop-specific knowledge can be supplied
in a later phase.

```python
import pandas as pd
from src.features import aggregate_monthly

clean = pd.read_csv(
    "data/nasa_power/nasa_power_2025_clean.csv", parse_dates=["date"]
)
monthly = aggregate_monthly(clean, heat_threshold=35)
```

## Tests

Tests use mocked API responses and small local DataFrames; they do not require a
live NASA request:

```powershell
python -m pytest
```

The expected pipeline output is the clean daily CSV plus an audit report.
Monthly and meteorological-season summaries are produced on demand and are not
mixed into the daily dataset.
