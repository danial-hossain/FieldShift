# FieldShift Phase 30 — Public Data and Agronomic Evidence Verification

Completion status: completed for research-evidence auditing and provenance validation.

## 1. Scope and methods

This phase audited the repository's bundled evidence, source registry, validators, and the examined NASA POWER/SoilGrids official documentation accessible from the local environment.

The project continues to represent a research-oriented prototype in which:

- the optimizer is exercised under explicit hypothetical assumptions;
- the bundled NASA POWER CSVs are environmental context, not crop outcomes;
- the bundled SMAP-like file is synthetic and not NASA SMAP;
- soil, crop, and field-history inputs are demo or illustrative unless a specific source is independently verified;
- no real-world yield, profit, water-use, or soil-health claims are made.

The verification work was limited to repository evidence and the official documentation that was reachable during this session. No new field measurements, no fabricated farm outcome records, and no new agronomic calibration were introduced.

## 2. Inventory of existing data and sources

The repository was inspected for the actual local files and source metadata under `data/`, `docs/`, `src/data/`, and `tests/`.

| Dataset or source | File path | Organization / source | Type | Verification status | Notes |
| --- | --- | --- | --- | --- | --- |
| NASA POWER daily point API | `src/data/nasa_power.py`; documented in README | NASA POWER / NASA Langley POWER | remote_observed environmental context | partially verified | Official API documentation confirms a daily point API exists for CSV and other formats, but no request manifest was bundled in the local CSVs. |
| `nasa_power_2025.csv` | `data/nasa_power/nasa_power_2025.csv` | NASA POWER-attributed local CSV | remote_observed environmental context | locally inspected, not independently authenticated | 365 daily rows, no coordinate metadata in file. |
| `nasa_power_lat23.8103_lon90.4125_20260831_20260929.csv` | `data/nasa_power/nasa_power_lat23.8103_lon90.4125_20260831_20260929.csv` | NASA POWER-attributed local CSV | remote_observed environmental context | locally inspected, not independently authenticated | 30 daily rows; filename encodes coordinates but file lacks request metadata. |
| `demo_smap.csv` | `data/smap/demo_smap.csv` | FieldShift bundled example | synthetic | verified synthetic | Explicitly labelled as demo and not a NASA SMAP product. |
| `demo_soil.csv` | `data/soil/demo_soil.csv` | FieldShift bundled example | synthetic | verified synthetic | Demo soil file has no lab method or field-scale measurement provenance. |
| `crop_knowledge.csv` | `data/crops/crop_knowledge.csv` | FieldShift bundled example | synthetic | verified synthetic | Demonstration crop knowledge; no scientific citations or local calibration. |
| `demo_field_history.csv` | `data/field_history/demo_field_history.csv` | FieldShift bundled example | synthetic | verified synthetic | Demo history, not field records. |
| `source_registry.csv` | `data/source_registry.csv` | Project-managed registry | metadata manifest | partially verified | It records source categories, access URLs, evidence class, and verification status; it is not proof of product access or legal re-use rights. |
| SoilGrids | `data/source_registry.csv` record `soilgrids_global_predictions` | ISRIC / SoilGrids | modelled_context | officially documented | Product page confirms 250 m global gridded soil predictions under CC BY 4.0. |
| SRDI, BARC, BADC, BARI, BRRI, DAE, BMD | registry entries only | institutional websites | candidate/public sources | unverified | Institutional pages exist or were listed, but no product-specific verified dataset, license, or coverage was confirmed in this repo. |

## 3. NASA POWER metadata and provenance findings

### Official NASA POWER documentation verified

The official NASA POWER API documentation was inspected at:

- https://power.larc.nasa.gov/docs/services/api/
- https://power.larc.nasa.gov/docs/services/api/temporal/daily/

These sources confirm that:

- NASA POWER exposes a Daily API with time-series analysis-ready data;
- CSV output is supported for daily data;
- the API supports point requests for daily data;
- time standards include UTC and LST;
- the API is for environmental data products and does not itself provide crop yield or farm outcome estimates.

### Local file findings

The two checked-in NASA POWER files under `data/nasa_power/` are:

- `nasa_power_2025.csv`
- `nasa_power_lat23.8103_lon90.4125_20260831_20260929.csv`

Observed structure from the files:

- both CSVs contain `date, temperature, temp_max, temp_min, rainfall, humidity, wind_speed, solar_radiation`;
- the 2025 file spans 2025-01-01 through 2025-12-31;
- the 2026 file spans 2026-08-31 through 2026-09-29;
- the 2026 file has two missing `solar_radiation` values;
- neither CSV includes latitude/longitude or a request/response metadata manifest inside the file;
- neither CSV records the API endpoint, parameter list, retrieval timestamp, or unit declarations for each variable.

### Provenance and unit assessment

The local files are therefore best described as:

- NASA POWER-attributed environmental snapshots in the repository;
- not independently authenticated copies of a specific NASA request result;
- not field measurements tied to a real field boundary;
- not yield or management outcome data.

The project documentation and source registry correctly distinguish these from farm observations, but the CSVs do not provide enough metadata to prove the original point coordinates, retrieval timestamp, or exact API request conditions.

The requirement to record requested variables and units is partially supported by project code and README, but not fully reflected in the CSV file bytes. For example, `solar_radiation` is present but the local CSV does not record its unit. The official NASA POWER docs confirm the data are daily environmental series and not agronomic outcomes.

## 4. Public soil-data verification findings

The repository's registry contains candidate soil and geospatial sources, including SoilGrids, SRDI, BARC, BADC, BARI, BRRI, DAE, and BMD. These were inspected only to the extent supported by project context and official pages reachable during the session.

### SoilGrids

Official SoilGrids documentation was inspected at:

- https://isric.org/explore/soilgrids
- https://soilgrids.org/
- https://creativecommons.org/licenses/by/4.0/

This confirms:

- SoilGrids is a global digital soil mapping product using environmental covariates and modelled predictions;
- it provides global maps at 250 m resolution;
- it includes multiple soil properties and six standard depth intervals;
- the uncertainty of the predictions is quantified;
- the maps are distributed under CC BY 4.0.

This is modelled context, not direct field sampling. It is relevant for environmental context but not a substitute for measured soil chemistry, salinity, structure, or field-specific repeated monitoring.

### Other public sources in the registry

The registry indicates many additional institutional sources such as SRDI, BARC, BADC, BARI, BRRI, DAE, and BMD. These remain unverified at the product level in the project because:

- no specific dataset, product version, access route, or legal reuse terms were confirmed in the repo;
- institutional presence is not proof of a particular dataset being available or reusable;
- no local file or direct product record for those candidate sources was inspected.

These entries are therefore labelled as pending verification or candidate sources, not as validated agronomic evidence.

## 5. Crop-parameter evidence status

The bundled crop table under `data/crops/crop_knowledge.csv` and project documentation state that the values are illustrative and synthetic. The same README sections explicitly describe them as not scientifically validated and not source-backed.

The project's crop metadata therefore remain:

- useful for deterministic optimizer behavior and scenario tests;
- not evidence of agronomic truth for a field or region;
- not a basis for real-world recommendations.

The rule layer and optimizer can still be tested reproducibly with these values, but the results are model outputs under explicit assumptions, not agronomic conclusions.

## 6. Verified facts versus assumptions versus unresolved claims

### Verified facts

- The repository contains local NASA POWER-attributed environmental CSVs and a synthetic SMAP-like demo file.
- The README and source registry explicitly distinguish synthetic/demo data from observed data.
- The official NASA POWER Daily API documentation confirms daily point and CSV outputs exist.
- SoilGrids is documented as a global modelled product with 250 m resolution and CC BY 4.0 terms.
- The project currently has no bundled field-measured outcome dataset for yield, irrigation, soil health, or management effects.

### Assumptions retained

- The crop table is a prototype assumption catalog used to test optimization logic.
- The demo soil and field-history files are example data and not field observations.
- Hypothetical water-stress and heat scenarios are used to test sensitivity, not to forecast actual agronomic response.

### Unresolved claims

- No external local field dataset has been verified for a specific farm or region.
- No public soil or agronomic source has been confirmed as a valid field-ready dataset for this project's chosen decision context.
- No product-specific license or download agreement was verified for SRDI, BARC, BADC, BMD, or the candidate crop publications.

## 7. Data limitations and their consequences for the optimizer

The limitations matter because the optimizer accepts whatever is in the input tables and can produce feasible plans with mathematically consistent constraints. This is valuable for understanding structural behavior, but not proof of agronomic validity.

Consequences:

- optimizer feasibility does not establish agronomic validity;
- a feasible rotation under demo crop parameters is not a field recommendation;
- NASA POWER observations are context, not yield or irrigation outcomes;
- synthetic soil/crop/history/SMAP inputs are not field measurements;
- model outputs depend on explicit assumptions, not verified biophysical reality.

The correct scientific boundary is: these experiments are reproducible model sensitivity tests under explicit assumptions, not validated farm decision support.

## 8. Changes made

The following repository improvements were made for this phase:

- added stricter provenance metadata checks to `src/data/source_registry.py` for `access_url` and verified-source notes;
- added tests in `tests/test_source_registry.py` to cover missing provenance metadata and URL requirements;
- created the Phase 30 evidence report at `docs/experiments/phase30_evidence_verification.md`;
- created the machine-readable evidence matrix at `docs/experiments/phase30_evidence_matrix.json`;
- preserved all existing user content and appended the final Phase 30 section to `output.txt` without rewriting prior content.

## 9. Tests and validation commands executed

The following commands were run from the repository root with the project virtual environment:

1. `./.venv/Scripts/python.exe -m pytest tests/test_source_registry.py tests/test_pilot_data.py -q`
   - Result: passed
2. `./.venv/Scripts/python.exe -m src.data.source_registry`
   - Result: `Source registry and acquisition log are structurally valid.`
3. `./.venv/Scripts/python.exe -m src.data.pilot_data`
   - Result: `Pilot templates and cross-table references are valid.`

These checks validate the source-registry metadata and template validation logic used for evidence provenance and data integrity.

## 10. Prioritized remaining evidence tasks

1. Acquire and verify a specific public soil dataset with documented coverage, units, access terms, and product version for the intended study region.
2. Confirm a traceable agronomic reference set for crop thresholds and local production assumptions; avoid silent adoption of demo values.
3. Record exact NASA POWER request metadata for every local file: latitude, longitude, community, variables, start/end dates, time standard, format, retrieval timestamp, and any missing-data policy.
4. If a real field or farm is later considered, collect field-boundary geometry, management-history records, and outcome measurements with explicit consent and provenance.
5. Define a formal evaluation design before any real-world recommendation or policy claim is made.

## 11. Scientific boundary at this phase

At this phase, the project can claim that:

- the current optimization logic is reproducible under explicit hypothetical conditions;
- sensitivity experiments test how the model responds to stated assumptions;
- NASA POWER files provide environmental context rather than agronomic outcomes;
- existing synthetic/demo values remain illustrative and not field-validated evidence.

The project cannot claim that:

- the optimizer produces validated real-world recommendations;
- synthetic or modelled inputs establish farm productivity, profit, water use, or soil health in practice;
- NASA POWER monthly/daily environmental series are crop outcome data;
- ML or RL systems are ready for real-world agricultural decision support.

The project remains a transparent research prototype that studies mathematical feasibility and sensitivity under explicit assumptions, separate from independent agronomic validation.
