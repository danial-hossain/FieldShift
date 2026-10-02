# FieldShift

**FieldShift: A Hybrid NASA-Driven Intelligent Crop Rotation and Adaptive Farm
Management System** is a research-oriented prototype for exploring crop
rotations under changing climate, soil, and water conditions.

Phase 1 established the project structure and Python dependencies. Phase 2
implements the NASA POWER daily environmental data pipeline. The project does
not claim validated agronomic recommendations, trained real-world behavior, or
climate forecasts. Measured NASA observations, local measurements, and
illustrative/demo assumptions are identified separately.

## Architecture and module responsibilities

| Path | Responsibility |
| --- | --- |
| `src/data/nasa_power.py` | NASA POWER Daily Point API fetching, validation, cleaning, latest-valid-date detection, and CSV persistence. |
| `src/data/smap.py` | Separate SMAP soil-moisture retrieval/loading interface, including a future local CSV fallback. |
| `src/state/field_state.py` | Convert environmental, soil, and history inputs into a structured field state shared by decision components. |
| `src/knowledge/crops.py` | Structured crop knowledge and crop data loading. Economic values will be explicitly labelled illustrative/demo values unless sourced otherwise. |
| `src/knowledge/agronomic_rules.py` | Configurable and explainable agronomic constraints, kept independent of optimization code. |
| `src/preprocessing/features.py` | Simple, explainable climate, moisture, stress, and crop-water-demand features. |
| `src/optimizer/milp.py` | PuLP-based long-term crop rotation planning with configurable farmer priorities. |
| `src/rl/environment.py` | Sequential adaptive-management simulation with state transitions, actions, and rewards. |
| `src/rl/agent.py` | Lightweight replaceable reinforcement-learning agent. |
| `src/rl/reward.py` | Configurable reward components for profit, soil improvement, water use, stress, and invalid actions. |
| `src/rl/train.py` | Reproducible training entry point and model persistence under `models/rl/`. |
| `src/scenarios/stress_test.py` | Simulated normal, drought, heat, and low-water scenario evaluation; scenarios are not forecasts. |
| `src/explainability/explanations.py` | Human-readable explanations grounded in actual inputs and model results. |
| `data/nasa_power/` | Cleaned NASA POWER data, kept distinct from SMAP and demo datasets. |
| `data/smap/` | SMAP data or clearly identified local fallback data. |
| `data/soil/` | Soil measurements or clearly labelled example/default values. |
| `data/crops/` | Configurable crop knowledge data. |
| `data/field_history/` | Field-specific crop and management history. |
| `models/milp/` | Persisted planning outputs/configuration when needed. |
| `models/rl/` | Saved RL models; a saved model will not imply scientific validation. |
| `app/` | Reserved for a simple dashboard after the backend is established. |

**Decision roles are intentionally distinct:** MILP plans a feasible multi-season
rotation; RL models sequential adaptive management as field conditions change.
They share the dynamic field state but are not substitutes for one another.

## Requirements

- Python 3.10 or newer
- Packages listed in `requirements.txt`: NumPy, pandas, Requests, and PuLP

## Phase 2: NASA POWER daily data

**Status: complete.** The pipeline includes request validation, API error
handling, numeric/date cleaning, missing-marker conversion, latest-valid-date
detection, CSV persistence, and mocked unit tests.

NASA POWER is an environmental data source, not an AI model. FieldShift uses
the [NASA POWER Daily Point API](https://power.larc.nasa.gov/api/temporal/daily/point)
with the `AG` community and these parameters: `T2M`, `T2M_MAX`, `T2M_MIN`,
`PRECTOTCORR`, `RH2M`, `WS2M`, and `ALLSKY_SFC_SW_DWN`.

The reusable function accepts caller-supplied latitude, longitude, start date,
and end date. It supports arbitrary historical date ranges as well as a
recent-window helper. The recent helper allows for processing latency and
returns latest available/near-real-time processed daily data, not instant live
data. Dates are parsed as pandas datetimes and environmental values are parsed
as numeric values. NASA's `-999` missing-value marker is converted to `NaN`;
missing observations are not replaced by zero.

`get_latest_valid_date` looks for the latest row containing at least one valid
environmental measurement after cleaning. It does not use the latest calendar
date when that row contains only missing values. Use `save_nasa_power_data` to
save cleaned records under `data/nasa_power/`; filenames identify the NASA
POWER source, coordinates, and requested date range.

Dhaka is used only as an example location (`latitude = 23.8103`,
`longitude = 90.4125`). The values saved by this pipeline come from the NASA
POWER API; this data pipeline does not forecast climate or crop outcomes and
does not claim scientific validation. The old `src.nasa_power` import path
remains available as a compatibility wrapper.

Run the unit tests (standard-library `unittest`, no additional test package):

```powershell
python -m unittest discover -s tests -v
```

Run a recent NASA POWER example from the repository root (requires network
access; saves the cleaned CSV under `data/nasa_power/`):

```powershell
python -m src.data.nasa_power
```

## Install dependencies (Windows PowerShell)

From the repository root:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## Initial project check

Compile all Python modules without generating bytecode files:

```powershell
.\.venv\Scripts\python.exe -B -m compileall -q src
```

This initial check confirms Python syntax only. It does not fetch NASA data,
solve an optimization problem, or train/evaluate an RL policy.

## Configuration and research notes

The existing NASA POWER script uses the Dhaka test location
(`23.8103`, `90.4125`) as an example. Location settings should be supplied by
the caller/configuration rather than copied into each module. NASA POWER data is
processed daily/near-real-time data, not instant live data.

Soil defaults, crop economics, and stress transformations must remain
configurable and clearly labelled as assumptions or simulations. Model results
are prototype outputs and should not be presented as scientifically validated
without appropriate evaluation.
