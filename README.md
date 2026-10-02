# FieldShift - Phases 1 and 2

FieldShift Phase 1 is a modular pipeline for location-based daily climate data:

```text
NASA POWER API -> validation -> cleaning -> feature engineering -> clean CSV
```

The climate pipeline does **not** treat NASA POWER as field-sensor data or infer
soil conditions, nutrients, yield, crop prices, or other field measurements.
Phase 2 adds a separate, explicitly synthetic/demo agronomic data layer. AI,
reinforcement learning, optimization, SMAP, API, and frontend work remain out
of scope.

## Requirements and installation

Use Python 3.11 or newer. From the project root (for example
`C:\FieldShift` on Windows):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Phases 1 and 2 use only pandas, NumPy, requests, and pytest. Climate observations come
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

## Phase 2: agronomic data and knowledge

Phase 2 supplies validated, structured inputs that later phases can combine
into a field state. It does not make crop recommendations, predictions, or
optimization decisions.

```text
data/
|-- nasa_power/
|   |-- nasa_power_2025.csv
|   `-- nasa_power_2025_clean.csv
|-- crops/
|   |-- crop_catalog.csv
|   `-- crop_requirements.csv
|-- soil/
|   `-- soil_data.csv
`-- field_history/
    `-- crop_history.csv

knowledge_base/
|-- crop_knowledge.json
|-- agronomic_rules.json
`-- rotation_rules.json
```

### Data provenance

None of the Phase 2 records are real farmer or field observations:

- `crop_catalog.csv`: six MVP crops. Family/boolean structure follows the
  project specification; duration and water categories are placeholders.
- `crop_requirements.csv`: six rows of placeholder numeric values for software
  development. They are not validated agronomic recommendations.
- `soil_data.csv`: three wholly synthetic demonstration fields. Coordinates,
  nutrients, pH, area, texture, organic matter, and irrigation values are not
  measurements from Bangladeshi farms.
- `crop_history.csv`: nine wholly synthetic crop-history records.
- Knowledge-base JSON: demo-only structured rules. No validated hard
  constraints are asserted, and unknown thresholds are represented as `null`.

Each CSV includes `source_type` and `data_status`. Each knowledge file includes
the same provenance in its metadata and entries. Placeholder or synthetic data
must be replaced with sourced, reviewed data before production use.

### Schemas

- Crop catalog: `crop_id`, `crop_name`, `crop_family`, legume/nitrogen-fixing
  booleans, duration, water category, and provenance.
- Crop requirements: temperature bounds, water/rainfall placeholders, soil pH
  bounds, configurable heat-stress threshold, drought sensitivity, and
  provenance.
- Soil: field identifier, coordinates, area, N/P/K, explicit demo-only units,
  pH, texture, organic matter, irrigation availability, and provenance.
- Crop history: field identifier, season, year, crop identifier, and
  provenance.
- Knowledge rules: separate `hard_constraints`, `soft_preferences`, and
  `agronomic_information` arrays.

### Loading and validation

`src.data_loader` resolves default paths relative to the repository, validates
file existence and schemas, normalizes only explicitly valid boolean/numeric
representations, and raises `DataValidationError` for malformed data.

```python
from src.data_loader import (
    load_climate_data,
    load_crop_catalog,
    load_crop_requirements,
    load_soil_data,
    load_crop_history,
    load_crop_knowledge,
    load_agronomic_rules,
    load_rotation_rules,
)

climate = load_climate_data()
catalog = load_crop_catalog()
requirements = load_crop_requirements(crop_catalog=catalog)
soil = load_soil_data()
history = load_crop_history(crop_catalog=catalog)
crop_knowledge = load_crop_knowledge()
agronomic_rules = load_agronomic_rules()
rotation_rules = load_rotation_rules()
```

## Tests

The complete Phase 1 and Phase 2 suite uses mocked API responses, repository
fixtures, and temporary malformed datasets. It does not require a live NASA
request:

```powershell
python -m pytest
```

The expected pipeline output is the clean daily CSV plus an audit report.
Monthly and meteorological-season summaries are produced on demand and are not
mixed into the daily dataset.
