# Phase 27D — Research-only readiness and data-quality audit

**Audit scope:** repository state reviewed 2026-10-03. This is a software/data
readiness assessment for an individual university research prototype. It does
not require partner recruitment, laboratory access, field trials, or farm
data collection. No external dataset was downloaded for this audit.

## Executive assessment

FieldShift can support a credible **software and hypothetical optimization
study** today: test data contracts and NASA POWER ingestion, verify optimizer
constraint behavior on controlled inputs, and compare explicitly hypothetical
scenario outputs under declared assumptions. It can also support descriptive
inspection of the bundled NASA POWER-attributed daily series, subject to
provenance and spatial limitations recorded below.

It cannot use the current bundled files to establish crop yield response,
realized profit, water savings, soil-health change, field-level agronomic
suitability, climate forecast skill, or policy effectiveness. Bundled soil,
crop, field-history, and SMAP-like examples are synthetic. The local NASA
POWER files are environmental data rather than farm actions/outcomes; one
snapshot lacks coordinate/retrieval manifest details. No specific BMD, SMAP,
Sentinel-2, SoilGrids, SRDI, BARC, or BADC observations beyond those explicitly
listed in the source registry are bundled.

**A partner is not a prerequisite for this phase or for a useful initial
decision-support software demonstration.** The Phase 27C protocol and
templates are optional preparation for possible future data collection.
Research-only work must keep measured-data claims separate from test-fixture
behavior and hypothetical scenario results.

## Files and data reviewed

The Phase 27C protocol, data dictionary, five templates, pilot validator,
source registry validator, source map, registry CSV, acquisition tracker,
NASA POWER/soil/field-history/farm-outcome loaders, NASA POWER, soil,
farm-outcome, pilot, source-registry, stress-test, and RL-readiness tests were
inspected. Relevant application paths include the crop/soil/history/SMAP
loaders, MILP optimizer, agronomic compatibility rules, stress-test runner,
farm-outcome importer, offline evaluation, and RL readiness gate.

Actual CSV inventory:

| File | Rows / columns | Provenance and limitations |
| --- | --- | --- |
| `data/nasa_power/nasa_power_2025.csv` | 365 daily rows, 2025-01-01 to 2025-12-31; `date`, `temperature`, `temp_max`, `temp_min`, `rainfall`, `humidity`, `wind_speed`, `solar_radiation`. | NASA POWER-attributed environmental series. Coordinates and original API request/retrieval manifest are absent from this file; source map notes the lineage is project-documented but not independently verified. Not field measurements or outcomes. |
| `data/nasa_power/nasa_power_lat23.8103_lon90.4125_20260831_20260929.csv` | 30 daily rows, 2026-08-31 to 2026-09-29; same eight columns. | Dhaka point encoded in filename; two `solar_radiation` cells are blank. Filename does not establish field-boundary alignment or complete retrieval provenance. |
| `data/soil/demo_soil.csv` | 2 rows; 12 columns (`field_id`, coordinates, N/P/K, pH, organic matter, texture, source/status, as-of date). | Both `source=demo`, `data_status=synthetic`; N and organic matter each missing once. Example values only. |
| `data/crops/crop_knowledge.csv` | 7 rows; 16 crop, agronomic, economic, source, and status columns. | All rows are `demo`/`synthetic`; yield, water, cost, price, family, temperature, pH, and effect values are illustrative, not sourced/validated local parameters. |
| `data/field_history/demo_field_history.csv` | 4 rows; 8 fields: field/year/season/crop/yield/irrigation/source/status. | All rows `demo`/`synthetic`; one yield blank; not a real observed rotation or yield history. |
| `data/smap/demo_smap.csv` | 3 rows; 6 fields: date/coordinates/soil moisture/source/status. | All rows `demo`/`synthetic`; explicitly SMAP-like software fixture, not NASA SMAP retrieval or direct sensor data. |
| `data/pilot_templates/field_registry.csv` | Header only; 20 columns. | No field records. |
| `data/pilot_templates/soil_observations.csv` | Header only; 25 columns. | No samples or laboratory records. |
| `data/pilot_templates/crop_seasons.csv` | Header only; 22 columns. | No farm season records. |
| `data/pilot_templates/management_events.csv` | Header only; 25 columns. | No irrigation or input records. |
| `data/pilot_templates/outcome_measurements.csv` | Header only; 29 columns. | No measured outcomes. |
| `data/source_registry.csv` | 21 source/product/route rows; 21 columns. | Product/access-specific unknowns remain blank or pending. A registry entry does not establish acquisition. |
| `data/acquisition_log.csv` | 6 preparation/verification items; 14 columns. | All remain `not_started`; no partner or provider access is marked verified. |

The local POWER CSVs do not contain per-column unit metadata or an explicit
request manifest. The API wrapper requests the documented POWER variables
but does not persist a separate source manifest. Before any quantitative
analysis, retain API parameters, point/coordinate reference, request period,
retrieval date, product/community, source attribution, expected native units,
and missingness alongside an immutable file snapshot. Do not infer a field
boundary from a point coordinate.

The 27B registry/source map reports NASA POWER parameter definitions and
product-specific source caveats. Recheck units against the selected NASA
POWER API product response/documentation when acquiring or transforming data;
the normalized CSV's short column names alone are not a full unit dictionary.
The currently bundled crop, soil, SMAP-like, and field-history rows remain
synthetic regardless of how plausible their numbers appear.

## Data-quality pipeline audit

The pilot validator operates on a single set of CSV files; it is not a
transactional ingestion system. The following findings were reproduced using
synthetic test records only.

| Check | Existing behavior / audit result | Action |
| --- | --- | --- |
| Duplicate IDs / repeated rows | Duplicate primary keys are rejected within a template file. Identical repeated rows in one batch therefore fail. Replaying the same file in separate runs is not tracked because no batch/import ledger exists. | Added an explicit repeated-row regression test; document cross-run replay detection as not implemented. |
| Malformed dates/timestamps | ISO parsing exists, but the old code did not require a value's semantic format beyond parser acceptance. | Retained parsing and tested malformed timestamps. No timezone is fabricated. |
| Numeric measurements | Before this audit, malformed strings and `NaN`/infinity passed through the pilot validator. | Fixed: populated numeric fields must parse to finite values; basic, non-domain-specific bounds are checked for coordinates, areas, depths, durations, counts, and uncertainty. |
| Units | Populated soil analyte, management quantity, and outcome values could have blank units; a time series could silently mix units. No unit catalogue/conversion is defined, appropriately avoiding guessed conversions. | Fixed missing unit/value pairs and reject within-series unit variation for an outcome/analyte. Physical equivalence still requires product/method-specific review. |
| Measured outcome method | An `observed` outcome with a value and no `measurement_method` previously passed. | Fixed: a populated directly observed outcome requires its measurement method. Observed soil analyte values likewise require the lab method. |
| Source/provenance | Evidence class and source fields are required and vocabulary is checked. Template source IDs are not cross-checked against an approved source registry. | Tested blank source/evidence failures. Before analysis, resolve each `source_id` against the actual source manifest/registry; partner-specific IDs cannot be predeclared. |
| Consent | `observed`/`recalled` records require a non-empty consent reference. | No consent ledger, approval state, scope, version, expiry, or withdrawal status exists. A non-empty reference is not evidence that consent was approved or covers a use. This must be checked by an authorized reviewer before import; no fake approval status was added. |
| Evidence/status mismatch | Synthetic evidence cannot be assigned a non-synthetic `data_status`; direct observed evidence must use `observed`. Remote/modelled/recalled evidence keeps a separate `evidence_class`. | Regression tests preserve remote/modelled/recalled classifications. `data_status` remains a compatibility field and must not replace `evidence_class`; no pilot-template adapter sends these records to the RL outcome path. |
| Foreign keys | Pilot dataset validation checks field and season references. | Existing checks retained and tested. Optional blank season IDs remain allowed for management/outcome records where season linkage is unknown; review before analysis. |
| Suspicious numeric values | There were no generic finite/range checks in the pilot validator. Domain-specific plausibility cannot be inferred universally across analytes, crops, and units. | Added only unambiguous structural/physical guards. Domain plausibility is flagged for human review; no scientific threshold is invented. |
| Corrections / lineage | Templates have record IDs but no batch ID, version, `supersedes` key, correction reason, or adjudication status. Conflicting rows with the same ID in one snapshot are rejected as duplicate IDs; a CSV cannot establish which corrected version across snapshots is authoritative. | Added a conflicting-outcome duplicate-ID regression test. Not expanded with speculative lineage columns. Preserve originals and maintain a separate controlled, append-only correction/import manifest before using any future populated batch. |

These changes do not validate ethics, identity, measurement truth, consent
validity, laboratory competence, or agronomic plausibility. The validator
does not silently repair, impute, or remove rows.

## Research-only evaluation path

### A. Software correctness

Use the existing `unittest` suite and synthetic fixtures to test loader
schemas, missing-value behavior, provenance preservation, date cutoffs,
invalid inputs, solver status handling, and stress-test immutability. NASA
POWER API tests are mocked; they establish request construction/response
handling, not external service availability. If an actual API retrieval is
performed separately, record source, exact parameters, dates, point, native
units, retrieval time, missing values, and product terms without calling it
instant live data.

### B. Environmental-data description

Describe the two local POWER series separately by date coverage, variables,
missingness, and point support. Do not merge them into a continuous series
without checking overlap, request lineage, coordinates, and unit consistency.
They can support code-path checks and limited descriptive summaries, but the
short single-point coverage cannot establish field-scale weather exposure,
long-term climate trends, seasonal forecasts, or crop responses.

Public products may be considered only after the exact files/product version,
source lineage, spatial/temporal support, units, retrieval date, and applicable
license/attribution are verified. The source map records candidate products
and policy notes; candidate URLs and institutional homepages are not evidence
that specific public data are locally available. As of this audit there is no
bundled SMAP, Sentinel-2, SoilGrids, BMD station, BARC/BADC layer, or actual
partner dataset. If a public dataset is later added, keep satellite/weather
and model predictions in remote/modelled classes, never as direct field
measurements.

### C. Constrained optimizer experiments

Create controlled synthetic `FieldState`, crop records, and history inputs;
label every output hypothetical. Test family rotation, legume interval,
season assignment, pH/temperature/water compatibility, unknown-input behavior,
infeasibility, and objective-component arithmetic using known fixtures.
Compare scenario profiles and perturb one declared assumption/weight at a
time, recording profile, parameters, solver/version/status, selected
rotation, objective components, compatibility unknowns, and data provenance.
Do not require profiles to produce different rotations if a common optimum is
valid. Keep illustrative economics separate from measured farm profit.

### D. Hypothetical climate/water sensitivity

Use configured drought, heat, and low-water perturbations as deterministic
what-if cases, not forecasts or probability-weighted climate projections.
Record the baseline values, transformation, assumptions, unavailable inputs,
and changes in compatibility/solver results. Compare sensitivities over
reasonable, explicitly chosen parameter ranges; explain why those ranges are
exploratory rather than empirically calibrated. Report inapplicable cases
where required seasonal water or temperature inputs are missing. Do not
interpret a scenario rotation as an implemented farm action.

### E. Keep evidence levels separate

Report outcomes in distinct layers:

1. **Software correctness:** parser, validator, deterministic behavior,
   constraint satisfaction, provenance, and error handling.
2. **Optimization behavior:** mathematical feasibility and objective response
   for stated inputs and assumptions.
3. **Agronomic plausibility:** comparison with cited, crop/region/season-
   applicable agronomic evidence; current demo constants alone are not
   validation.
4. **Real-world validity:** measured, appropriately sampled farm outcomes and
   prospective/independent evaluation. This is unavailable in the repository.

Passing tests establishes only the first layer and parts of the second.

## Questions available and unavailable with current evidence

| Research question | Addressable now? | What a valid conclusion can claim |
| --- | --- | --- |
| Do loaders preserve missingness, dates, units supplied by records, and provenance? | Yes, through tests and synthetic fixtures. | Implementation behavior for tested inputs only. |
| Does the MILP satisfy encoded rotation and hard constraints on known inputs? | Yes, with controlled hypothetical fixtures. | Mathematical behavior under the encoded assumptions, not suitability on a real farm. |
| How do profile weights/objective components change for a fixed hypothetical instance? | Yes. | Sensitivity of the coded objective; not farmer preference or profit. |
| How do configured drought/heat/low-water perturbations affect compatibility and plans? | Yes. | Deterministic scenario sensitivity, not forecasts or likely future impacts. |
| What daily values are present in the bundled POWER snapshots? | Yes, descriptively and with provenance caveats. | Values in these files only; not field-level crop response or climate trend. |
| Does a rotation improve measured yield or profitability? | No. | Requires valid crop outcomes, costs/prices, field/season linkage and comparative design. |
| Does irrigation planning reduce water use without yield loss? | No. | Requires measured/action-linked irrigation and crop outcomes, with confounders addressed. |
| Does the plan improve soil health or nutrient balance over seasons? | No. | Requires repeated field soil measurements using comparable methods/depths. |
| Are crop constants scientifically valid for target Bangladesh conditions? | Not from bundled data. | Requires sourced, current, crop/region/season-specific agronomic evidence and uncertainty. |
| Can the policy be trained/evaluated as RL or shown to outperform a baseline? | No. | Requires credible action-conditioned trajectories/outcomes, coverage, leakage-resistant temporal/farm splits, and an approved evaluation design. |

The existing RL readiness checks remain unchanged. The environment has no
validated action-effect/reward model and currently blocks readiness without
outcome evidence. No training was run or enabled.

## Optional future data-quality controls

If future batches exist, add a restricted ingestion manifest before repeated
imports are permitted. It should record dataset/batch ID, cryptographic file
hash, source and consent-scope references, schema version, receipt/approval
timestamps, validator version/report, reviewer decision, and import outcome.
For corrected records, retain original values and link a new version to the
superseded record with correction reason, source confirmation, reviewer, and
timestamp. Do not overwrite a prior approved record. These controls are
recommendations; no sensitive-data ledger is created in this research-only
phase.

## Integrity and remaining limitations

No real farm records, yields, management events, lab results, consent, partner
agreements, approvals, or new citations were fabricated. No data were
downloaded. Synthetic fixtures are test-only. The repository's public-data
source registry is not proof of product access or license approval. A local
NASA POWER CSV is not a direct field measurement. Crop/economic constants
remain illustrative; compatibility rules are not an agronomic validation.
Real-world yield, profit, water, soil-health, and RL policy-performance
claims remain unvalidated.
