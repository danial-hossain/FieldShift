# FieldShift - Phases 1, 2, and 3

FieldShift Phase 1 is a modular pipeline for location-based daily climate data:

```text
NASA POWER API -> validation -> cleaning -> feature engineering -> clean CSV
```

The climate pipeline does **not** treat NASA POWER as field-sensor data or infer
soil conditions, nutrients, yield, crop prices, or other field measurements.
Phase 2 adds a separate, explicitly synthetic/demo agronomic data layer. Phase
3 integrates those inputs into an explainable field state and crop
compatibility baseline. Reinforcement learning, optimization, SMAP, API, and
frontend work remain out of scope.

## Requirements and installation

Use Python 3.11 or newer. From the project root (for example
`C:\FieldShift` on Windows):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Phases 1 through 3 use only pandas, NumPy, requests, and pytest. Climate observations come
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

## Phase 3: field-state integration

Phase 3 supplies a transparent baseline for combining the existing validated
inputs. It does not train a model or produce a scientifically optimal crop.

```text
NASA POWER climate + synthetic soil + synthetic crop history
                           +
placeholder crop catalog/requirements + demo crop knowledge/rules
                           |
                           v
                    canonical FieldState
                           |
                 candidate compatibility
                           |
             evidence + stable feature vector
```

### Canonical representations

`src.field_state` defines immutable dataclasses for:

- `FieldState`: field identity, coordinates, area, soil, aggregated climate,
  history summary, time boundary, provenance, and warnings.
- `SoilState`: N/P/K with their original `demo_index` unit, pH, texture,
  organic matter with its original unit, and recorded irrigation availability.
- `ClimateState`: selected-period observation count, temperature mean/min/max,
  cumulative precipitation, mean humidity, wind speed, and solar radiation.
  These are descriptive statistics, not stress classifications.
- `HistoryState`: ordered records, previous crop/family, last-three-record
  sequence, recent legume count, and factual trailing repetition counts. It
  does not simulate nutrient or soil changes.
- `CandidateCrop`: catalog metadata, nullable requirements, and knowledge
  metadata with source-specific provenance retained.

The default high-level APIs use repository-relative paths through the existing
validated loaders:

```python
from src.field_state import build_candidate_crop, build_field_state

state = build_field_state("demo_field_001")
maize = build_candidate_crop("maize")
```

`build_field_state(..., as_of_date="2025-06-01")` excludes later climate
observations. Crop history only records a year and season label, not an exact
date, so an explicit boundary conservatively excludes the whole boundary year
instead of guessing season dates. `climate_start_date` can select the beginning
of the descriptive climate period.

### Explainable compatibility

`src.suitability` evaluates candidates in catalog order without ranking them:

```python
from src.suitability import evaluate_all_candidates, evaluate_candidate_crop

one = evaluate_candidate_crop(state, "maize")
all_candidates = evaluate_all_candidates(state)
```

Every signal is categorical and includes machine-readable evidence containing
the actual field value, declared candidate values/range, result, reason, and
applicable demo rule identifier.

| Signal | Phase 3 behavior |
| --- | --- |
| Temperature | Compares historical period mean with declared nullable min/max. |
| Soil pH | Compares field pH with declared nullable min/max. |
| Rainfall | Returns `unknown`: historical period precipitation and the placeholder crop value lack a shared declared time basis. |
| Irrigation | Availability is `compatible`; absent irrigation plus a placeholder `high` water category is a soft `borderline` review flag; other absent-irrigation cases are `unknown`. |
| Rotation | Uses only the previous crop/family and the active soft demo repetition preferences. A repeat is `borderline`, never a hard constraint. |

Missing field values or requirements return `unknown`; they are never filled
with guessed thresholds. There is no numeric probability or aggregate score.
Suitability, feasibility, and optimization remain separate concerns: Phase 3
does not implement a feasibility solver, hard agronomic constraints, MILP,
Pareto analysis, reinforcement learning, or multi-season planning.

### Stable feature representation

`src.feature_builder.build_feature_vector` combines field, climate, soil,
history, candidate, provenance, and compatibility inputs in the fixed
`FEATURE_NAMES` order. Numeric missing values use `0.0` plus a paired
`*_missing` indicator; missing categories use `__missing__`. Compatibility is
encoded as `-1` (incompatible), `0` (borderline or unknown), or `1`
(compatible), with a separate unknown indicator.

The categorical values intentionally remain strings. A future ML pipeline must
fit any categorical encoder on training data only. The representation contains
no target, fake recommendation label, yield, probability, or label leakage.

### Phase 3 provenance and limitations

- Climate: cleaned historical NASA POWER gridded point data, not field sensors.
- Soil: synthetic/demo records.
- Crop history: synthetic/demo records.
- Crop catalog and requirements: placeholder/demo records.
- Crop knowledge and agronomic/rotation rules: demo-only; hard-constraint
  lists are empty.

> Current agronomic datasets contain placeholder/demo and synthetic
> information. Phase 3 compatibility outputs are architecture and pipeline
> demonstrations, not validated real-world agronomic recommendations.

The single climate file is reused by all demo fields; Phase 3 does not claim it
is a measurement at each synthetic coordinate. Crop requirements do not define
planting dates or comparable crop-period climate windows, and no yield/outcome
labels exist. Those limitations prevent scientifically supported supervised
accuracy claims or candidate ranking.

## Tests

The complete Phase 1 through Phase 3 suite uses mocked API responses,
repository fixtures, temporary malformed datasets, field-state integration,
compatibility evidence, and deterministic feature-vector checks. It does not
require a live NASA request:

```powershell
python -m pytest
python -m pip check
```

The expected pipeline output is the clean daily CSV plus an audit report.
Monthly and meteorological-season summaries are produced on demand and are not
mixed into the daily dataset.
