# Phase 27A — FieldShift Data Inventory and RL Data Gap Audit

**Audit date:** 2026-10-03  
**Scope:** read-only inspection of the repository and its bundled files. No
external data were downloaded, no farm data were fabricated, and no existing
implementation was changed for this audit.

## Executive summary

The repository contains five actual CSV datasets: two NASA POWER environmental
snapshots, plus one synthetic/demo dataset each for crop knowledge, soil,
field history, and SMAP-like soil moisture. It contains **no bundled observed
farm-management actions or outcomes**. The NASA POWER data are environmental
observations and must not be counted as crop yield, irrigation application,
revenue, cost, soil-change, or action-effect evidence. The SMAP-named file is
explicitly demo/synthetic and is not downloaded NASA SMAP data.

The available files support a transparent software demonstration of input
loading, feature derivation, rule evaluation, MILP mechanics, profile
weighting, and hypothetical stress perturbations. They do not support
credible agronomic validation, historical policy comparison, estimation of
field outcomes, or evidence-backed RL training. No authoritative local
references are provided for the crop values or agronomic thresholds. Their
status is illustrative/synthetic, not scientifically established.

| Readiness level | Audit conclusion |
| --- | --- |
| Transparent rule/MILP demonstration | **Available with explicit limitations.** Bundled demo context and crop assumptions can exercise the code; unknown seasonal water remains unknown and demo values are not observations. |
| Credible agronomic/historical evaluation | **Not supported by bundled evidence.** Requires sourced crop/agronomy parameters and repeated, dated, field-linked management and outcome measurements with appropriate comparison design. |
| RL training/off-policy or prospective evaluation | **Blocked.** There are no observed action/outcome trajectories, the environment has no action-conditioned transition model, and reward remains unavailable. Caller-attested readiness evidence would not itself authenticate or validate a policy. |

## 1. Verified repository inventory

The inventory below describes actual files under `data/`, not paths merely
referenced in code. CSV row counts include the header-excluded data rows.
Missing counts include blank cells and the NASA `-999` missing marker when
present. The CSVs do not contain independent provenance attestations.

### `data/crops/crop_knowledge.csv`

* **Rows:** 7; crop names: Rice, Wheat, Maize, Lentil, Mungbean, Mustard,
  Potato. One row per crop; no duplicate crop names.
* **Columns:** `crop`, `family`, `is_legume`, `water_requirement`,
  `duration_days`, `min_temperature`, `max_temperature`, `min_ph`, `max_ph`,
  `expected_yield`, `production_cost`, `market_price`, `nutrient_effect`,
  `soil_impact`, `source`, `data_status`.
* **Missingness:** no blank fields.
* **Coverage:** seven named crop entries; no field, coordinate, region, or
  season-of-use identifier in the file.
* **Units documented by the loader/README:** water requirement is mm per
  growing season; duration is days; temperature bounds are °C; pH is
  unitless; expected yield is t/ha; production cost is illustrative BDT/ha;
  market price is illustrative BDT/t. Crop family/legume/effect fields are
  categories.
* **Provenance:** every row says `source=demo`, `data_status=synthetic`.
  Documentation states the estimates are illustrative and unsourced. This is
  documented as synthetic, but is not independently verifiable crop science.
* **Consumers:** crop loader, FieldState previous-crop metadata, agronomic
  rules, MILP eligibility/objective, strategy profiles, stress testing, and
  dashboard.
* **Limitation:** no citations, cultivar, production system, locality,
  season-specific scope, methods, uncertainty, or provenance per parameter.

### `data/soil/demo_soil.csv`

* **Rows:** 2, for `field_001` and `field_002`.
* **Columns:** `field_id`, `latitude`, `longitude`, `nitrogen`,
  `phosphorus`, `potassium`, `ph`, `organic_matter`, `texture`, `source`,
  `data_status`, `as_of_date`.
* **Missingness:** `nitrogen` blank in 1/2; `organic_matter` blank in 1/2;
  other columns populated. The one non-missing numeric observation for each
  of those two fields is synthetic, not a measured laboratory result.
* **Coverage:** two point coordinates near Dhaka; one snapshot per field
  (2026-09-20 and 2026-09-18). These are not farm/field boundaries.
* **Units documented by the loader:** N/P/K mg/kg; pH unitless; organic
  matter percent by mass; texture categorical. Sampling depth, extraction
  method, laboratory, and texture classification protocol are not recorded.
* **Provenance:** both rows `source=demo`, `data_status=synthetic`.
  Explicitly documented as example/default data, not real measurements.
* **Consumers:** soil loader, FieldState, feature engineering, agronomic
  compatibility context, optimizer provenance, and dashboard.
* **Limitation:** no organic-carbon field (distinct from organic matter),
  salinity, drainage, depth, repeated measurement series, method, or
  uncertainty.

### `data/field_history/demo_field_history.csv`

* **Rows:** 4; 3 for `field_001`, 1 for `field_002`.
* **Columns:** `field_id`, `year`, `season`, `crop`, `yield`, `irrigation`,
  `source`, `data_status`.
* **Missingness:** yield blank in 1/4; 3/4 yield cells have values. Every
  row, including populated yields, is synthetic.
* **Coverage:** years 2024–2025; season labels `Aus` and `Rabi`; crops Rice,
  Lentil, and Wheat. No exact planting/harvest or operation dates.
* **Units documented by the loader:** known yield t/ha; irrigation is a
  category, not a volume.
* **Provenance:** all rows `source=demo`, `data_status=synthetic`, explicitly
  documented as demo history. Not independent farm records.
* **Consumers:** history loader, FieldState's previous-crop context,
  family/legume constraints, agronomic rules, feature engineering, MILP, and
  dashboard.
* **Limitation:** no planting/harvest dates, confirmed management-operation
  logs, input quantities, outcome linkage, or observed crop history. The
  as-of logic excludes the decision year because season chronology is absent.

### `data/smap/demo_smap.csv`

* **Rows:** 3; all at 23.8103, 90.4125, dated 2026-09-25 through 2026-09-27.
* **Columns:** `date`, `latitude`, `longitude`, `soil_moisture`, `source`,
  `data_status`.
* **Missingness:** no blank values; soil moisture values range 0.22–0.24.
* **Units documented by the loader:** volumetric fraction, m³/m³.
* **Provenance:** every row `source=demo`, `data_status=synthetic`. The
  README and module explicitly say this is not NASA SMAP data and the
  prototype does not retrieve live SMAP observations. Documented label, not
  remotely authenticated measurement.
* **Consumers:** SMAP loader, FieldState, feature engineering, rule context,
  RL observation, drought scenario, and dashboard.
* **Limitation:** a three-day synthetic series at one point does not establish
  satellite-product coverage, calibration, uncertainty, field-scale soil
  moisture, or temporal representativeness.

### `data/nasa_power/nasa_power_2025.csv`

* **Rows:** 365 consecutive daily rows, 2025-01-01 through 2025-12-31;
  no duplicate dates, missing dates, blank values, or `-999` values were
  found in this file.
* **Columns:** `date`, `temperature`, `temp_max`, `temp_min`, `rainfall`,
  `humidity`, `wind_speed`, `solar_radiation`.
* **Geographic coverage:** no coordinates or field identifier are stored in
  the CSV or its filename. README identifies Dhaka as the example location,
  but the 2025 CSV itself does not prove the point used to request it.
* **Units:** the local API mapping and README do not declare units for each
  NASA output column. The FieldState interface describes rainfall as a
  daily value and temperature in rule text as °C, but not a complete
  variable-unit manifest. The source CSV carries no units metadata.
* **Provenance:** README and loader identify NASA POWER Daily Point API and
  mark returned environmental observations as observed. That provenance is
  documented at project level; this file contains no request URL/parameters,
  retrieval timestamp, source metadata, or coordinates to independently
  verify its lineage.
* **Consumers:** NASA POWER data loader, FieldState, feature engineering,
  sequential environment, and dashboard.
* **Limitation:** a single year is insufficient for long-term climatology,
  historical policy evaluation, trends, or robust seasonal baselines.

### `data/nasa_power/nasa_power_lat23.8103_lon90.4125_20260831_20260929.csv`

* **Rows:** 30 consecutive daily rows, 2026-08-31 through 2026-09-29;
  no duplicate dates or within-file date gaps.
* **Columns:** same eight columns as the 2025 NASA file.
* **Missingness:** two blank solar-radiation values, on the last two
  observations; other listed measurements have no blank or `-999` cells.
* **Geographic coverage:** filename encodes the Dhaka test-point coordinates;
  coordinates are not repeated in the rows.
* **Units:** same unit-documentation limitation as the 2025 file.
* **Provenance:** NASA POWER source/API is documented by the project, but
  retrieval metadata and independent authentication are absent from the CSV.
* **Consumers:** same NASA/FieldState/feature/environment/dashboard chain.
* **Limitation:** this is a one-month snapshot, not a continuous extension
  of the 2025 series. Jan 1–Aug 30, 2026 is not covered by the bundled files.
  The latest observation is four calendar days before the audit date; these
  data are not instant observations or forecasts.

### Other repository files and non-datasets

* `data/**/.gitkeep` files contain zero bytes and no records.
* No farm action/outcome dataset is present under `data/`; no observed
  measured-yield, realized-cost/revenue, metered-water-use, soil-change, or
  action-linked outcome records are bundled.
* Test files include temporary synthetic fixtures, including example
  structured outcomes. They are validation fixtures, not datasets and not
  evidence of real farms.
* No boundary geometry, farm registry, or downloaded external crop/science
  reference table was found in the inspected data tree.

### Exact demo crop values

These are the actual bundled values, reproduced to make their scale visible;
all rows remain synthetic/demo assumptions. Columns are:
`crop (family, legume); water mm/season; duration days; temperature C;
pH; expected yield t/ha; production cost BDT/ha; market price BDT/t;
nutrient-effect label; soil-impact label`.

| Crop | Family, legume | Water; duration | Temperature; pH | Yield; cost; price | Effect; impact |
| --- | --- | --- | --- | --- | --- |
| Rice | Poaceae, no | 1200; 130 | 20-35; 5.0-7.5 | 4.0; 80,000; 30,000 | high_nitrogen_demand; high_water_use |
| Wheat | Poaceae, no | 450; 120 | 10-25; 5.5-7.5 | 2.8; 55,000; 32,000 | moderate_nitrogen_demand; moderate_residue |
| Maize | Poaceae, no | 600; 110 | 18-32; 5.5-7.5 | 5.0; 70,000; 25,000 | high_nitrogen_demand; moderate_residue |
| Lentil | Fabaceae, yes | 300; 110 | 10-28; 5.5-7.5 | 1.2; 35,000; 90,000 | biological_nitrogen_fixation; improves_rotation_diversity |
| Mungbean | Fabaceae, yes | 350; 75 | 20-35; 5.5-7.5 | 1.0; 30,000; 85,000 | biological_nitrogen_fixation; improves_rotation_diversity |
| Mustard | Brassicaceae, no | 350; 100 | 8-25; 5.5-7.5 | 1.5; 38,000; 65,000 | moderate_nutrient_demand; deep_root_residue |
| Potato | Solanaceae, no | 500; 100 | 12-25; 5.0-6.5 | 15.0; 120,000; 18,000 | high_potassium_demand; moderate_soil_disturbance |

The units are those documented by the local loader. No source, method,
uncertainty, locality, crop variety, market date, or empirical validation is
attached to these numeric values.

### FieldState, feature, and RL observation schemas

`FieldState` contains: `field_id`, `as_of_date`, `latitude`, `longitude`;
weather fields `temperature`, `temp_max`, `temp_min`, `rainfall`, `humidity`,
`wind_speed`, `solar_radiation`; `soil_moisture`, `nitrogen`, `phosphorus`,
`potassium`, `ph`, `organic_matter`, `texture`; history context
`previous_crop`, `previous_crop_family`, `previous_crop_is_legume`,
`previous_yield`, `previous_irrigation`, `previous_crop_year`,
`previous_crop_season`; observation/as-of dates for NASA, moisture, and soil;
source labels and a per-source `data_status` map. Its schema does not include
field area, field geometry, crop stage, irrigation source/allocation,
salinity, drainage, carbon, or current confirmed action.

The feature builder returns 27 ordered feature values: raw environment
(`temperature`, `temp_max`, `temp_min`, `rainfall`, `humidity`, `wind_speed`,
`solar_radiation`, `soil_moisture`); derived (`temperature_range`,
`heat_stress_indicator`, `water_stress_indicator`); temporal
(`temperature_change`, `rainfall_change`, `soil_moisture_change`,
`recent_mean_temperature`, `recent_mean_rainfall`,
`recent_mean_soil_moisture`); soil (`nitrogen`, `phosphorus`, `potassium`,
`ph`, `organic_matter`); history (`previous_crop`, `previous_crop_family`,
`previous_crop_is_legume`, `previous_yield`, `previous_irrigation`); plus
feature-level provenance. `available_water_mm` is not computed by this
feature builder and is not present in the bundled fields; it is an optional
caller-supplied feature.

The environment's numeric observation schema is 19 features:
`temperature`, `temp_max`, `temp_min`, `rainfall`,
`recent_mean_temperature`, `temperature_change`, `recent_mean_rainfall`,
`rainfall_change`, `soil_moisture`, `recent_mean_soil_moisture`,
`soil_moisture_change`, `nitrogen`, `phosphorus`, `potassium`, `ph`,
`heat_stress_indicator`, `water_stress_indicator`, `available_water_mm`,
`irrigation_capacity_mm`. FieldState, feature values, missingness, and
provenance accompany them. Categorical history fields are present in the
state mapping but are not included among those 19 numeric observations.

## 2. Field data gap matrix

Statuses describe the **evidence actually bundled**, not the loader's ability
to accept future caller data. `AVAILABLE_SYNTHETIC` means a value/schema is
present but not a field measurement.

| Requirement | Status | Repository evidence and limitation |
| --- | --- | --- |
| Stable field identifier | `AVAILABLE_SYNTHETIC` | Two synthetic IDs in soil CSV; two IDs in demo history. No observed farm identifiers. |
| Field coordinates | `AVAILABLE_SYNTHETIC` | Two demo soil points and one demo SMAP point. NASA 2026 coordinates only in filename; 2025 coordinate absent. No independent geospatial linkage. |
| Field area and boundaries | `MISSING` | No area, polygon, parcel/boundary file, or documented field delineation. A coordinate is not a boundary. |
| Soil texture | `AVAILABLE_SYNTHETIC` | Two demo soil rows have categorical texture; method/classification not given. |
| Soil pH | `AVAILABLE_SYNTHETIC` | Two demo soil pH values, dated once per field; method/depth absent. |
| Soil nitrogen | `PARTIAL` | Two demo soil records; one value blank. N form/extraction protocol/depth absent. |
| Soil phosphorus | `AVAILABLE_SYNTHETIC` | Two demo values; synthetic; extraction protocol/depth absent. |
| Soil potassium | `AVAILABLE_SYNTHETIC` | Two demo values; synthetic; extraction protocol/depth absent. |
| Organic matter | `PARTIAL` | One of two demo values blank; no method/depth. |
| Organic carbon | `MISSING` | No organic-carbon column. Do not substitute organic matter for carbon. |
| Salinity | `MISSING` | No electrical conductivity or salinity measurements. |
| Drainage | `MISSING` | No field drainage observation or classification. |
| Soil moisture | `AVAILABLE_SYNTHETIC` | Three synthetic m³/m³ entries for one point across three days. No observed SMAP records. |
| Irrigation source/type | `MISSING` | History only has categorical irrigation level; no source (canal, well, rain, etc.). |
| Seasonal water allocation/availability | `MISSING` | No seasonal water balance/allocation records. `available_water_mm` may be supplied as an explicit runtime feature but is absent in bundled data. |
| Irrigation application records | `PARTIAL` | Synthetic history contains categorical high/low/medium-style management labels; no application event timestamps, measured depths/volumes, or confirmed applied-action logs. |
| Crop identity/family history | `AVAILABLE_SYNTHETIC` | Four synthetic history rows across two years/two IDs; not observed history. Family comes from synthetic crop table. |
| Planting/harvest dates | `MISSING` | History has year and season only; no exact planting/harvest dates. |
| Management practices/inputs | `PARTIAL` | Only a categorical irrigation field in demo history; no tillage, fertilizer, pesticide, labor, or operation-level record. |
| Measured yield | `AVAILABLE_SYNTHETIC` | Three populated synthetic history yield values and one blank; observed measured-yield evidence is missing. |
| Crop failures/losses | `MISSING` | No failure, damage, or reason-for-loss records. |
| Input quantities | `MISSING` | No measured fertilizer, seed, chemical, labor, energy, or irrigation quantities. |
| Realized cost/revenue | `MISSING` | No farm accounting records; crop table economics are demo assumptions. |
| Repeated soil-health measurements | `MISSING` | One synthetic snapshot per soil field; no observed same-protocol baseline/follow-up series. |
| Weather | `AVAILABLE_OBSERVED` (documented source) | NASA POWER snapshots above; source attribution documented but CSV request lineage/geography is incomplete, and coverage is discontinuous. |
| Satellite-derived indicators aligned to fields | `MISSING` as observed evidence | SMAP-like rows are synthetic; no retrieved satellite product, product/version, footprint/resolution, quality flags, or field-overlap analysis. |
| Field-season linkage for measured outcomes | `MISSING` | No bundled outcome/action rows. The caller outcome contract supports field and season IDs but none are supplied in project data. |

## 3. Crop knowledge and scientific evidence gap matrix

The crop CSV is a seven-row synthetic catalog. Its `source` and
`data_status` columns identify examples, not citations. There is no
documented cultivar, Bangladesh agroecological zone, soil type, season,
management regime, estimation method, uncertainty range, or independent
scientific source attached to any crop characteristic.

| Parameter used | Current representation and unit | Source/applicability/evidence | Code use and evidence gap |
| --- | --- | --- | --- |
| Crop name and family | Text / categorical | Bundled demo labels; no botanical/source citation or regional cultivar scope. | Family is used for consecutive-family rotation constraints; taxonomy/rotation interval is a configured prototype rule. |
| Legume status | Boolean | Synthetic crop metadata; not sourced per variety. | Legume flag drives a configurable rolling legume interval and one term in an illustrative soil proxy. |
| Seasonal water requirement | Numeric mm/growing season | Demo values; no crop/region/season/production-system reference, irrigation efficiency, effective rainfall definition, or uncertainty. | Rule compares only against explicitly supplied seasonal `available_water_mm`; MILP minimizes normalized catalog demand. |
| Growing duration | Whole days | Demo values; no variety, planting date, climate, or definition (sowing-to-maturity etc.). | Returned as metadata; not converted into calendar/season constraints. |
| Temperature suitability | Min/max °C | Demo ranges; no growth stage, day/night measure, source, or local season evidence. | Rules compare the current FieldState temperature, then MILP applies the explicit result statically across a multi-period horizon; no forecast or stage model. |
| pH suitability | Min/max unitless pH | Demo ranges; no crop reference, soil sampling method, or evidence citations. | Rule/MILP use as a static compatibility condition. |
| Expected yield | t/ha | All values synthetic/demo, including numeric values; no measured yield source, variety, moisture basis, season, or uncertainty. | Profit proxy multiplies by demo price and subtracts demo cost; not a yield prediction. |
| Production cost | BDT/ha | Explicitly illustrative demo estimate; no date, budget basis, input assumptions, or farm accounts. | Profit objective only; not realized production cost. |
| Market price | BDT/t | Explicitly illustrative demo estimate; no market, grade, location, date, or transaction source. | Profit proxy only; not realized revenue. |
| Nutrient effect | Small categorical vocabulary | Hard-coded labels such as biological nitrogen fixation/high demand; no quantitative nutrient budget, crop-specific citation, soil test interpretation, or time horizon. | Mapped to illustrative soil-objective numbers. Not a nitrogen dynamics model or measured nutrient change. |
| Soil impact | Categorical labels | Hard-coded illustrative vocabulary; no citations, measurements, units, horizon, or field validation. | Mapped to values and averaged with legume status for a normalized objective component; not a soil-health estimate. |
| Crop-family rotation | Family labels plus no-consecutive-family condition | Requirement is encoded in rules/MILP; no crop-pathogen/pest evidence is bundled to validate family groups or universally appropriate interval. | Hard constraint across adjacent configured periods and previous crop family. |
| Legume rotation interval | Default 3 seasons | Explicit software default; not a sourced regional prescription. | Rolling MILP constraint and rule checks; caller-configurable, but synthetic history is insufficient to ground a farm-specific interval. |

The MILP minimizes normalized catalog water demand and maximizes normalized
catalog-based margin and an encoded crop-soil proxy. Min-max scaling is over
the supplied candidate crop set; changing that candidate set changes the
objective scale. Objective values therefore describe the selected input
assumptions, not measured farm utility, profit, water saving, soil restoration,
or crop suitability.

## 4. NASA and climate data gap matrix

| Variable | NASA API parameter → local field | Bundled coverage/missingness | Unit/provenance assessment | Intended-use limitation |
| --- | --- | --- | --- | --- |
| Mean temperature | `T2M` → `temperature` | 365 daily values in 2025; 30 in 2026 snapshot; no missing values. | Field names/API parameters mapped by code. Units are not recorded in CSV; project documentation only explicitly uses °C when describing crop temperature comparisons. | Daily point values, not crop-stage/field-canopy measures; no continuous multi-year series. |
| Maximum temperature | `T2M_MAX` → `temp_max` | Same date coverage; no missing cells in these files. | No per-file units manifest. | No forecast or future seasonal maxima. |
| Minimum temperature | `T2M_MIN` → `temp_min` | Same date coverage; no missing cells. | No per-file units manifest. | No forecast or future seasonal minima. |
| Corrected precipitation | `PRECTOTCORR` → `rainfall` | Same date coverage; no missing cells. | Local schema does not state a complete unit manifest. README describes daily rainfall but not full API measurement/unit metadata. | Rainfall alone is not seasonal irrigation supply or crop water availability. |
| Relative humidity | `RH2M` → `humidity` | Same date coverage; no missing cells. | No per-file units manifest. | Does not represent crop disease/evapotranspiration model. |
| Wind speed | `WS2M` → `wind_speed` | Same date coverage; no missing cells. | No per-file units manifest. | No derived reference evapotranspiration or validated crop water balance. |
| All-sky surface shortwave radiation | `ALLSKY_SFC_SW_DWN` → `solar_radiation` | 365 values in 2025; 28/30 values in 2026, with 2 blanks. | No per-file units manifest. Missing values stay missing. | No photosynthesis/yield model; 2026 latest rows have absent radiation. |

**Temporal coverage:** 2025-01-01–2025-12-31 (365 consecutive dates) and
2026-08-31–2026-09-29 (30 consecutive dates). No dates are duplicated within
either file. The gap from 2026-01-01 through 2026-08-30 is not covered; the
files are not a continuous two-year time series.

Observed value ranges in the stored files (units are not embedded in these
CSVs):

| Field | 2025 min–max (n=365) | 2026 snapshot min–max (n=30) |
| --- | ---: | ---: |
| `temperature` | 13.90–33.07 | 26.54–30.30 |
| `temp_max` | 19.97–40.14 | 27.90–34.83 |
| `temp_min` | 8.70–27.29 | 24.53–27.03 |
| `rainfall` | 0.00–81.11 | 0.25–19.48 |
| `humidity` | 36.36–94.67 | 76.86–93.61 |
| `wind_speed` | 0.37–5.19 | 0.67–3.07 |
| `solar_radiation` | 2.93–26.08 | 6.04–21.32 (2 missing) |

**Geographic alignment:** The 2026 filename encodes one Dhaka point; the 2025
CSV contains no coordinates, and neither NASA CSV has a field ID. Soil and
SMAP demo points are near that point, but their shared coordinates do not
establish common observed field footprints. POWER point data are not a
field-boundary-resolved weather record. The inspected local code does not
store request metadata/coordinates alongside every daily row.

**Data type distinctions:** NASA files are documented as processed daily
environmental observations, not forecasts or instant live readings. There
are no forecasts in the bundled data. Stress-test heat/drought/low-water
perturbations are hypothetical synthetic assumptions, not climate projections
or observed scenarios. Derived recent means/changes/features inherit
provenance and depend on the dated observations supplied. Seasonal water
availability is not derived from daily rainfall or soil moisture.

**Decision/evaluation limitations:** One observed calendar year plus one
late-season month cannot establish climatic variability or robust
season-specific operating conditions. The optimizer evaluates current
temperature/pH/water compatibility and treats selected compatibility
results as static across its future periods; it does not forecast those
conditions. The dataset cannot support out-of-time climate robustness
claims. A per-variable authoritative unit manifest and retrieval/processing
metadata are needed before combining sources quantitatively.

## 5. RL data contract

### What the code currently defines

The canonical caller event in `src/rl/outcomes.py` has 26 fields:

```text
event_id, outcome_id, field_id, season_id, episode_id, split,
observation_timestamp, decision_timestamp, action_timestamp, action_id,
action_parameters, action_status, linked_action_event_id, outcome_name,
outcome_value, outcome_unit, measurement_timestamp, outcome_window_start,
outcome_window_end, outcome_missing, data_status, source, provenance,
measurement_method, missingness_flags, data_quality_flags
```

Timestamps must be timezone-aware ISO-8601 and ordered observation ≤ decision
≤ confirmed-applied action ≤ outcome measurement. Outcome windows must be
declared and cannot predate the action. A measured outcome requires a
confirmed-applied action and exact event linkage. `data_status=observed` must
agree with provenance declarations and synthetic/demo/plan markers are
rejected as observed evidence. Validation retains raw data, missingness,
quality findings, and unknown provenance rather than silently repairing or
imputing values.

This is an **action/outcome record contract**, not a full sequential
state-transition table: it does not itself store a complete pre-action state,
post-action state, all weather covariates, or a reusable trajectory sequence.
It permits at most one outcome per action event. Offline preparation reuses
Phase 15 validation, isolates field-season groups across the declared
train/validation/test splits, checks overlapping outcome windows for a field
across splits, and excludes unobserved, planned, unconfirmed, and
missing-outcome records. It requires coverage in each declared split; this is
a structural safeguard, not proof of statistical adequacy. The caller
assigns splits; the module does not design randomization or guarantee
unseen-farm generalization.

### Contract needed for credible sequential/offline RL

Each transition should be represented or joinable through immutable IDs and
explicitly include:

| Requirement | Why it is needed | Status in current prototype |
| --- | --- | --- |
| Field/farm pseudonymous ID, field-season ID, episode/trajectory ID, ordered step/transition ID | Reconstruct sequence, cluster correlated samples, and define leakage-safe grouping. | Outcome schema has field/season/episode/event IDs, but no dedicated trajectory/step index or farm ID. |
| Pre-action observation and timestamp | Defines information available to the decision maker; supports no-future-data checks. | Outcome event has a timestamp but no complete pre-action state snapshot or state ID. Environment exposes structured observations, but does not persist a real transition dataset. |
| Chosen action ID, parameters, decision policy/context, and execution status/time | Separates a proposal from actual treatment and identifies treatment dose. | Event schema supports action ID/parameters/status; bundled data has none. Environment irrigation action is only a proposal, not applied. |
| Post-action observation, timestamp, and transition linkage | Represents action-conditioned dynamics and permits temporal ordering. | No post-state field or observed transition table in the outcome contract. Environment only advances to the next supplied NASA observation, independent of action; it declares no action-conditioned transition support. |
| Observed outcome/reward components, units, method, outcome window, missingness, uncertainty | Prevents fabricated reward and preserves the target definition and measurement quality. | Outcome record supports a single measurement, unit, method and window; no measurement uncertainty fields or bundled values. `calculate_reward` returns unavailable. |
| Episode termination/truncation and reason | Makes trajectory ends interpretable and distinguishes observation exhaustion from farm/event termination. | Environment mechanics record synthetic/historical observation exhaustion and configured step limits; no observed farm episode termination records. |
| Pre-action confounders and context | Supports adjustment/stratification and makes treatment-selection mechanisms visible: weather, soil moisture, crop/stage, soil, irrigation access, water allocation, prior management, inputs, pests, labor, prices, etc. | Environment observations include a subset of weather, moisture, soil, previous crop and optional caller water features. Outcome schema has no normalized covariate columns; caller action parameters/provenance can carry mappings but are not a standardized state-transition dataset. |
| Provenance, missingness, quality, measurement protocol and uncertainty | Assesses origin, reliability, censoring and comparability without treating declarations as authentication. | Outcome contract retains provenance/status/flags/method, but no authenticity verification or numeric measurement-uncertainty schema. |
| Action coverage, treatment doses and behavioral policy/logging propensity where available | Off-policy value estimation depends on support/overlap and behavior-policy information; unrepresented actions cannot be evaluated safely. | Validator reports observed action coverage; no actual coverage data or behavior-policy probabilities bundled. |
| Temporal and group split metadata plus source-window lineage | Prevents repeated field/episode leakage and future information leakage. | Field-season separation and cross-split overlapping outcome-window validation exist. Split assignment is caller-supplied. No automatic chronological or farm-held-out design. |

**Minimum meaningful dataset:** a linked, ordered set of pre-action
observation → actually applied action → post-action observation → measured
outcome transitions, with field/season/trajectory linkage, measurement and
action timestamps, explicit units, outcome windows, quality/missingness,
provenance, termination, and relevant confounders. It must include support
for the actions being compared and an evaluation protocol aligned with the
target (e.g. future outcomes or new fields). For off-policy evaluation,
logging-policy information and action support/overlap are important; for
prospective evaluation, the study protocol should define assignment,
comparator, follow-up, safety and outcome analysis before use.

There is no defensible universal sample-count threshold derivable from this
repository. Sufficiency depends on diversity and coverage of states and
actions, number and independence of trajectories/fields/seasons, outcome
noise and missingness, confounding, intervention variation, and the chosen
evaluation objective. The readiness module's hard-coded floor of two training
episodes, two held-out episodes and two steps per episode is a code-level
prototype interface gate only; it is not a statistically justified sample
size or research design. Its evidence fields are caller-attested and not
independently audited. A finite custom reward is marked experimental and
does not establish evidence-backed training.

**Leakage-safe evaluation:** retain field and farm clustering, episode
integrity, decision-time feature availability, and outcome-window boundaries.
For future-field generalization, split by farm (not only by season). For
future-time generalization, hold out later periods and ensure every feature
and preprocessing fit uses training-era information only. Keep all rows from
an episode/trajectory in one split and prevent overlapping outcome windows
from crossing splits. Report action/outcome coverage, exclusions, missingness,
uncertainty and unsupported action regions. Do not tune policy, reward or
model choices on final test outcomes.

## 6. Critical blockers versus optional enhancements

### Critical for research claims or RL

1. Obtain permissioned real field-season identifiers and clear data-use
   authority; pseudonymize identities and document field/farm grouping.
2. Acquire actual planting/harvest dates, crop/stage and confirmed
   management-event logs, including action amount/unit, timestamp and
   action source. Retain proposed, planned and applied statuses separately.
3. Link measured outcomes to applied actions and defined windows: harvest
   yield with protocol, input/cost and revenue records, measured irrigation
   volumes, and repeated soil measurements if those are target outcomes.
   Retain missing outcomes and reasons; do not fill with zero.
4. Collect pre- and post-action field observations and potential confounders
   at compatible times/resolutions; define outcome and reward semantics
   before modelling.
5. Establish independent data provenance and measurement methods; validate
   units, timestamps, spatial support, quality flags, missingness, and
   linkage. A caller's `observed` label is not authentication.
6. Design evaluation splits and comparison protocol appropriate to the
   question, including held-out farms/time where required and action support
   for off-policy comparisons. No current record count can substitute for
   coverage analysis.
7. For the MILP's empirical agronomic interpretation, replace or supplement
   synthetic crop bounds/objective inputs with cited, region/season/cultivar
   appropriate data and uncertainty. Add a defensible field water balance
   before asserting crop water suitability.

### Useful but not prerequisites for the initial transparent demonstration

* More demo crops or more synthetic test fixtures.
* A polished dashboard or another optimizer.
* An online forecast API, credentials, or additional infrastructure.
* A larger number of unlinked observations that do not resolve provenance,
  outcome linkage, units, or study design.
* A more complex RL algorithm before action-conditioned transitions and
  measured outcomes exist.

These enhancements do not replace field evidence and should not block a
clearly labelled rule/MILP software demonstration.

## 7. Recommended acquisition order

1. **Define the research question and target outcome.** Decide whether the
   initial question is rotation feasibility, realized yield, water use,
   profit, soil change, or an action-specific effect. Define units, crop
   season, time horizon and comparator before collection.
2. **Create a field/farm registry and spatial linkage.** Use stable
   pseudonymous IDs, coordinates, area/boundaries, coordinate reference
   system and effective dates. This supports correct joining and sampling.
3. **Acquire observed crop-calendar and management records.** Capture crop,
   variety, planting/harvest, growth stage, operations, action parameters,
   applied status, irrigation source and metered volume/allocation, and
   input quantities with event times. This is the basis for distinguishing
   plans from treatments.
4. **Acquire measured outcomes with protocols.** Link harvest weights/area,
   quality and crop loss; realized receipts and costs; metered water use;
   and repeated soil measurements only where those outcomes are in scope.
   Store method, units, uncertainty, missingness and follow-up windows.
5. **Improve covariate coverage.** Add dated field soil lab results,
   sampling depths/methods, texture, organic carbon (separately from
   organic matter), salinity and drainage; align weather and satellite
   products to each field and timestamp, retaining product metadata/quality.
6. **Source crop/agronomy evidence.** Replace demo assumptions with
   documented crop- and region/season-appropriate parameter references,
   uncertainty and citation/licensing records. Keep parameters that remain
   uncertain configurable and labelled.
7. **Only then prepare evaluation splits and assess RL feasibility.** Split
   at the independent unit needed by the study, inspect action/state support
   and outcome missingness, pre-register evaluation and only define a reward
   with defensible measured components. Prospective controlled evaluation
   may be more appropriate than off-policy evaluation if historical action
   support/confounding is inadequate.

## 8. Data dictionary proposal

This is a **proposal for provider data organization**, not a new code
contract or implementation. Keep normalized tables separate and preserve
original source files.

| Table | Key fields to retain | Units/metadata |
| --- | --- | --- |
| `field_registry` | pseudonymous `farm_id`, `field_id`, geometry/geometry reference, centroid, effective start/end | Area (ha), coordinate reference system, boundary source/date, permission status; do not store direct identity in model tables. |
| `soil_observation` | `soil_observation_id`, `field_id`, sample time, depth, analyte, value, unit, method, lab/source, quality flags | Include N/P/K forms/extraction, pH method, organic carbon and organic matter as distinct measures, texture class method, salinity/EC, drainage, uncertainty and detection limits. |
| `crop_season` | `field_id`, `season_id`, crop, cultivar, planting/harvest times, crop stage, area, source | Use explicit calendar convention, crop vocabulary/version, observed/planned status, measured yield and harvest method when available. |
| `management_event` | `event_id`, field/season/episode, decision and action times, action ID/parameters/unit, planned/recommended/confirmed-applied/not-applied status, operator/source | Preserve amount, area basis, water source, equipment/method and confirmation evidence; an optimizer plan is not an event. |
| `environment_observation` | source/product/version, location/geometry, observation time, variable, value, unit, quality/missingness | Keep NASA and satellite products separate; include request/retrieval/processing metadata, spatial support, aggregation method and provenance. |
| `outcome_measurement` | `outcome_id`, linked `event_id` where action-related, field/season/episode, outcome name/value/unit, measurement time/window, method | Include missingness reason, uncertainty, measured/derived status and provenance; permit multiple outcome metrics per event through a normalized join rather than duplicating action events. |
| `evaluation_assignment` | dataset/version, split, grouping key, assignment method/date, protocol version | Ensure fields/seasons/episodes and outcome windows do not leak across partitions; record whether goal is future time, unseen field, or unseen farm. |

Keep raw provider columns and original bytes immutable. Store explicit
column/unit mappings as versioned import metadata; do not infer conversions
from names. Distinguish sample time, event time, decision time, action time,
measurement time, and period window.

## 9. Validation and provenance requirements

* Record provider, source system, source record ID, collection/export date,
  permission/basis, and an immutable source-file checksum where appropriate.
  A checksum establishes byte identity, not authenticity.
* Preserve declared provenance as a declaration. Independently review
  source documents, instruments, protocols, calibration/QA records and
  data lineage before treating a provider's label as verified evidence.
* Require explicit units, denominator/area basis, analyte definition,
  measurement method, timezone and date semantics. Reject unapproved
  conversions; preserve source values and a separate documented converted
  value if conversion is later authorized.
* Validate stable field/event/outcome IDs; duplicate and join behavior;
  crop and season vocabularies; coordinate ranges/CRS; spatial and temporal
  joins; action status; timestamp ordering; measurement windows; and
  impossible values against documented protocols.
* Preserve blanks, missingness reason, detection-limit/censoring status,
  quality flags and uncertainty. Never silently impute, deduplicate, repair,
  or promote unknown provenance.
* Separate measured, externally sourced, derived, planned, synthetic/demo,
  and unknown values. Derived records should retain formula/version and
  all parent source IDs/statuses.
* Report row, field, season, episode, action, outcome, and split counts;
  missingness; data-quality findings; provenance categories; action/outcome
  linkage; excluded records and reasons; and coverage by relevant groups.
* Protect against temporal leakage (inputs known after decision time),
  trajectory/episode leakage, field-season leakage, overlapping outcome
  windows and (when claiming transfer to new farms) farm-level leakage.

## 10. Explicit unknowns and inspection limits

Repository inspection cannot establish:

* Whether NASA CSV bytes are unchanged from a particular NASA POWER response,
  what retrieval request created `nasa_power_2025.csv`, or the exact
  coordinates for that 2025 file. Project docs attribute the files to NASA
  POWER; the CSV itself has no retrieval manifest.
* The scientific origin, literature support, local applicability, or
  uncertainty of synthetic soil/crop/history/SMAP values and hard-coded
  crop/feature thresholds.
* Whether any outside provider has real farm records not present in the
  repository. No external directories, accounts, or services were inspected.
* Whether declared observed caller data will be authentic or sufficiently
  representative; validation can only check structure and internal
  consistency.
* A statistically adequate sample size or achievable policy value before
  the study objective, data quality, treatment support, noise, and evaluation
  design are known.

### Files inspected

* All actual files under `data/`, including all five CSVs and empty
  `.gitkeep` placeholders; schemas and row contents were read directly.
* `src/data/nasa_power.py`, `crops.py`, `soil.py`, `smap.py`,
  `field_history.py`, `farm_outcomes.py`, `data_quality.py`, and
  `offline_export.py`.
* `src/state/field_state.py`, `src/preprocessing/features.py`,
  `src/knowledge/agronomic_rules.py`, `src/optimizer/milp.py`,
  `src/optimizer/strategies.py`, and `src/scenarios/stress_test.py`.
* `src/rl/environment.py`, `agent.py`, `outcomes.py`, `readiness.py`,
  `reward.py`, `training.py`, and `src/integration/milp_rl.py`.
* `README.md` sections covering data, features, rules, optimization,
  stress testing, outcomes, evaluation and RL; `requirements.txt`;
  relevant tests, including NASA, field/data loaders, features/FieldState,
  agronomic rules/MILP/strategies/stress, farm outcomes and RL readiness.

No files were inaccessible within that scope. Not every test file was read
line-by-line; test fixtures were treated as tests rather than observations.
No external datasets, credentials, or provider systems were inspected.

## Prioritized next research steps

1. Decide the first empirical research question and target measure; do not
   define a reward from crop metadata.
2. Obtain permissioned, provenance-backed field-season, crop-calendar,
   applied-management and measured-outcome data with explicit units/methods.
3. Add contemporaneous pre/post state and confounder records, including
   measured irrigation/water availability if water decisions are in scope.
4. Source and cite regional crop/agronomy parameters; retain uncertainty and
   clearly separate these from measured field data.
5. Establish field-boundary/spatial and time alignment for NASA/satellite
   inputs; attach variable units and request/product metadata to every
   environmental dataset.
6. Assess missingness, measurement quality, state/action coverage and
   leakage-safe split feasibility before offline evaluation.
7. Revisit RL only if action-conditioned observed transitions, a defensible
   outcome/reward specification, sufficient action support, and an
   independent evaluation design are available. Until then, retain RL as a
   blocked prototype interface rather than a learned farm policy.
