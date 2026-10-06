# Phase 27E — Architecture Alignment Audit

**Audit date:** 2026-10-03
**Scope:** Evidence-based comparison of the FieldShift architecture described
in `README.md` with the checked-in execution paths, data, and tests. This is an
audit, not an architecture redesign or a validation of agronomic performance.

## Executive assessment

The repository implements a substantial, modular research prototype for
environmental data ingestion, state/feature preparation, explicit agronomic
rules, constrained multi-season MILP planning, hypothetical scenario analysis,
provenance-aware farm-outcome intake, and local reporting. Those are useful
software and optimizer-behavior capabilities. They do not establish that the
inputs represent a particular farm or that a rotation improves measured farm
outcomes.

The original project title and documented architecture distinguish the MILP
planner (long-horizon crop-rotation decisions) from an intended RL role
(sequential adaptive management). The current MILP path is executable and
tested. The RL path is intentionally incomplete: it has an environment API,
baseline policy, generic episode runner, reward boundary, and readiness gate,
but no action-conditioned transition or validated outcome reward. Readiness is
blocked in the bundled configuration. There is no trained predictive ML model,
fitted model artifact, model-performance evaluation, or demonstrated ML-to-
optimizer integration.

No standalone project proposal, dedicated architecture specification, or
architecture diagram was found in the checked-in documentation. `README.md`
is the available architecture record: it describes module responsibilities
and the intended decision-role separation, and documents Phases 1–25. Other
discovered documents are focused on data acquisition/readiness and the Phase
28 benchmark. This audit therefore treats the README and implementation/tests
as the available basis for intended roles, and marks any stronger proposal
objective as not independently verifiable from a separate proposal document.

## Status labels

| Label | Meaning in this audit |
| --- | --- |
| `implemented` | The relevant behavior runs through the documented execution path and is supported by tests or repository data; this does not imply scientific validation. |
| `partially_implemented` | A usable subset exists, but a documented role, data route, validation, or integration remains incomplete. |
| `interface_only` | A contract/API exists, but it does not yet perform the substantive intended decision or learning behavior. |
| `blocked_by_data` | The software path is present or specified, but required evidence is absent, so the intended empirical function cannot be exercised credibly. |
| `not_implemented` | No implementation of the stated substantive capability was found. |
| `not_verifiable` | Repository evidence is insufficient to establish whether the capability exists or is valid. |

## Architecture traceability matrix

### 1. NASA/environmental data ingestion

- **Intended role:** Supply dated environmental context for field state and
  scenario analysis; not direct farm outcome measurements. README Phase 2
  names the NASA POWER Daily Point API.
- **Implementation/evidence:** `src/data/nasa_power.py` implements
  `fetch_nasa_power`, `_response_to_dataframe`, `get_latest_valid_date`,
  `save_nasa_power_data`, and `fetch_recent_nasa_power`. It validates
  coordinates/dates, requests the configured parameters, converts dates and
  values, maps `-999` to missing, handles request/response errors, and can
  persist CSVs. `tests/test_nasa_power.py` covers those behaviors.
- **Status:** `partially_implemented`.
- **Inputs/evidence class:** Caller-selected point and date range from a
  gridded/daily remote environmental service (`remote_observed`). The source
  registry distinguishes the API route from the two locally bundled
  NASA POWER-attributed CSVs. The bundled files have no original request
  manifest; the 2025 CSV has no coordinates. The 2026 filename contains a
  point but does not establish field geometry or lineage.
- **Output:** A normalized pandas table with `date`, temperature min/max/mean,
  rainfall, humidity, wind and solar radiation; optional local CSV.
- **Dependencies/failure modes:** Network/API reachability, provider response
  schema and dates; malformed/missing provider fields and HTTP/connection
  errors raise explicit errors. POWER is daily processed environmental data,
  not instant live data or a farm-boundary sensor.
- **Can support:** Testing ingestion/normalization and using dated,
  point/gridded weather context in an explicitly scoped hypothetical study.
- **Cannot support:** Farm-scale weather truth, crop outcomes, forecasts, or
  causal effects. Bundled-file attribution is not independent authentication.
- **Next action:** For any future empirical analysis, retain the exact request,
  retrieval date, coordinates, parameters, units and product metadata with
  each snapshot; do not merge its evidence class with field measurements.

### 2. Data provenance and evidence classification

- **Intended role:** Keep origin, source and evidence strength visible from
  input through state, features, optimizer, RL readiness and reporting.
- **Implementation/evidence:** `data/source_registry.csv` and
  `docs/data_acquisition/source_registry_schema.md` define source records and
  evidence classes. `src/state/field_state.py` carries source/status fields;
  `src/preprocessing/features.py` derives feature provenance;
  `src/data/farm_outcomes.py`, `src/data/data_quality.py`,
  `src/rl/outcomes.py` and `src/rl/readiness.py` retain/check caller-declared
  provenance. `tests/test_data_quality.py`,
  `tests/test_pilot_data.py`, `tests/test_farm_outcomes.py`, and
  `tests/test_rl_evidence_boundaries_phase22.py` exercise evidence separation.
- **Status:** `partially_implemented`.
- **Inputs/evidence class:** Registry records distinguish
  `observed`, `remote_observed`, `modelled_context`, `recalled`, `inferred` and
  `synthetic`; local files include remote-observed-attributed and explicitly
  synthetic examples. The pilot CSV templates are blank. Caller-declared
  observed provenance is not independently authenticated.
- **Output:** Provenance/source/status fields, quality findings, source
  registry and evidence-readiness reasons.
- **Dependencies/failure modes:** Correct upstream labels and complete
  metadata; validators can reject inconsistent declarations but cannot verify
  that a provider's measurement is authentic. Existing `data_status` and
  `source` fields are preserved for compatibility and are not by themselves
  proof of direct observation.
- **Can support:** Software-level checks that labels and restrictions remain
  distinct, and documented provenance of the repository's examples.
- **Cannot support:** Authentication, consent validity, measurement truth,
  or product-specific reuse permission from a CSV label alone.
- **Next action:** Maintain source/product manifests and review caller
  declarations through an appropriate independent data-governance process
  before using them as observed outcomes.

### 3. Soil/crop/field-history data

- **Intended role:** Supply soil properties, crop metadata and preceding
  rotations for compatibility rules and MILP planning.
- **Implementation/evidence:** Loaders are
  `src/data/soil.py::load_soil_data`,
  `src/data/crops.py::load_crop_knowledge`, and
  `src/data/field_history.py::load_field_history`. The checked-in
  `data/soil/demo_soil.csv` has 2 synthetic rows,
  `data/crops/crop_knowledge.csv` has 7 synthetic/demo crop rows, and
  `data/field_history/demo_field_history.csv` has 4 synthetic rows.
  `data/smap/demo_smap.csv` has 3 synthetic SMAP-like rows and is explicitly
  not NASA SMAP. Tests include `test_soil.py`, `test_crops.py`,
  `test_field_history.py`, and `test_smap.py`.
- **Status:** `partially_implemented`.
- **Inputs/evidence class:** Soil, crop/economic metadata, history and the
  bundled SMAP-like records are `synthetic`; caller-provided datasets can be
  loaded under declared schemas. No validated field-specific soil laboratory
  results or observed farm crop history are bundled.
- **Output:** Normalized input frames and fields such as N/P/K, pH, texture,
  organic matter, crop family, crop parameters, prior crop and prior yield.
- **Dependencies/failure modes:** Required columns, numeric values, units,
  dates, field identifiers and source/status metadata. Missing values are kept
  unknown rather than filled. Demo defaults are not real measurements.
- **Can support:** Loader/schema tests and controlled optimization under
  explicit crop/soil/history assumptions.
- **Cannot support:** Bangladesh cultivar suitability, field nutrient status,
  measured soil change, or real rotation history from bundled examples.
- **Next action:** Where appropriate, verify specific agronomic references and
  actual source terms; obtain field measurements only under independently
  reviewed permissions and methods. This is not required to continue Stage A.

### 4. FieldState and feature engineering

- **Intended role:** Convert dated environmental and soil/history context into
  a structured state usable by separate planning and sequential-management
  roles.
- **Implementation/evidence:** `src/state/field_state.py::FieldState` and
  `build_field_state` validate values, as-of dates and provenance. The state
  retains missing numeric values as NaN. `src/preprocessing/features.py::
  build_features` builds deterministic ordered raw, derived and temporal
  features, including temperature range, heat/water indicators and date-limited
  means/changes. `tests/test_field_state.py` and
  `tests/test_features.py` cover these contracts.
- **Status:** `implemented`.
- **Inputs/evidence class:** NASA POWER remote environmental context; SMAP
  remote data only if a verified external CSV is explicitly supplied, otherwise
  bundled SMAP-like synthetic rows; synthetic soil/crop/history defaults or
  caller-supplied records.
- **Output:** A date-specific `FieldState` and ordered feature mapping with
  missingness/provenance.
- **Dependencies/failure modes:** Required schemas, valid as-of ordering,
  numeric ranges and sufficient dated observations. Too few observations make
  temporal features unknown; the code does not impute them.
- **Can support:** Deterministic feature/state assembly and tested missingness
  and temporal cutoffs.
- **Cannot support:** A validated latent biological field state, direct
  measurement of every field feature, or predictive validity merely because
  features are available.
- **Next action:** Record feature definitions, support and provenance in any
  future study; avoid training/evaluating a predictor until labels and
  leakage-safe protocol are specified.

### 5. Agronomic rules and crop compatibility

- **Intended role:** Keep agronomic assumptions separate from optimization and
  provide explainable compatible/incompatible/unknown results.
- **Implementation/evidence:** `src/knowledge/agronomic_rules.py::
  evaluate_crop_compatibility` and `evaluate_all_crops` implement
  temperature, pH, water, family rotation and legume interval checks using
  configurable `AgronomicRuleConfig`. `tests/test_agronomic_rules.py` covers
  the rules.
- **Status:** `partially_implemented`.
- **Inputs/evidence class:** Current state/context and synthetic crop metadata;
  optional history and supplied seasonal water. Unknown inputs remain unknown.
- **Output:** Per-rule status and reason/provenance, plus aggregate
  compatibility.
- **Dependencies/failure modes:** Rule thresholds/configuration and input
  completeness. A missing water allocation is not inferred from daily rainfall;
  the configured current state is not a future climate projection.
- **Can support:** Transparent execution of the encoded assumptions and
  controlled compatibility tests.
- **Cannot support:** Proof that the chosen thresholds fit local cultivar,
  calendar, soil, or Bangladesh agronomy without independently validated
  references/field evidence.
- **Next action:** Cite and version each adopted agronomic threshold and state
  its geographic/cultivar scope before using it as empirical advice.

### 6. MILP crop-rotation optimization

- **Intended role:** Long-term constrained, multi-season crop-rotation
  planning; distinct from adaptive RL management (README Phases 7–8).
- **Implementation/evidence:** `src/optimizer/milp.py::
  build_milp_model` creates binary crop-period variables. Constraints enforce
  one crop per period, consecutive family incompatibility, first-period
  previous-family restrictions, explicit current-state temperature/pH/supplied
  water incompatibility, and configurable rolling legume intervals.
  `_objective_data` and `_normalized` calculate normalized crop-set
  components; `optimize_rotation` returns status, selected rotation, objective
  components, constraint summary and provenance. `src/optimizer/strategies.py::
  generate_rotation_strategies` reruns the same formulation under named
  priority profiles. `tests/test_milp.py` and `tests/test_strategies.py`
  exercise constraints, objective arithmetic, missing metadata, deterministic
  results and controlled infeasibility.
- **Status:** `implemented`.
- **Inputs/evidence class:** Crop yields/prices/costs, water requirements,
  nutrient/soil-impact labels and crop families are bundled synthetic/demo
  values; field state/history may likewise be demo. Scenario states are
  hypothetical and marked synthetic.
- **Output:** Mathematical status (`optimal`, feasible/infeasible/error
  handling), plan or no plan, normalized objective and component summaries.
- **Dependencies/failure modes:** PuLP/CBC availability; crop metadata; input
  state, rules and periods. Missing objective metadata excludes a component
  and renormalizes the available weights; no plan is fabricated on
  infeasibility. Explicit current compatibility is used as static eligibility
  across future periods. Future seasonal temperatures/water are not forecast.
- **Objective and constraint limits:** Default priorities are profit 0.5,
  water 0.3 and soil 0.2. Profit proxy is
  `expected_yield * market_price - production_cost`; water is a normalized
  reversal of demand; soil is an illustrative equal mapping of legume,
  nutrient-effect and soil-impact metadata. These terms are not observed
  farm profit, metered water savings, or measured soil-health change. Crop
  duration is not translated into dated planting/harvest constraints.
- **Can support:** Encoded-constraint feasibility, mathematical optimizer
  behavior, infeasibility handling and how plans change under explicitly
  hypothetical inputs/weights.
- **Cannot support:** Agronomic validity, superior farmer strategy, expected
  yield/profit/water/soil outcomes, or empirical optimizer accuracy.
- **Next action:** Keep Stage A focused on reproducible assumption-based
  optimizer tests; before applied use, validate crop data, calendar, water
  representation and the encoded rule set independently.

### 7. Climate/water stress scenarios

- **Intended role:** Controlled what-if perturbations for comparing
  compatibility/MILP outputs, not forecasting.
- **Implementation/evidence:** `src/scenarios/stress_test.py::
  apply_scenario` and `run_stress_tests` implement normal, drought
  (soil-moisture delta), heat (temperature delta), and low-water (fraction of
  explicit seasonal water) perturbations. `tests/test_stress_test.py` tests
  applicability, changed fields, provenance and optional MILP comparison.
  `src/experiments/research_benchmark.py::run_benchmark` and
  `run_sensitivity` reuse these paths; `tests/test_research_benchmark.py`
  checks reproducibility and sensitivity reporting.
- **Status:** `implemented`.
- **Inputs/evidence class:** Synthetic hypothetical perturbations applied to
  a chosen baseline; baseline inputs may be remote environmental context plus
  synthetic crop/soil assumptions.
- **Output:** Per-scenario changed fields, rule results, optimizer status,
  plans/components where produced, and explicit provenance.
- **Dependencies/failure modes:** Required baseline values; low-water is not
  applicable without explicit seasonal available water. Current scenario
  interface has no rainfall-perturbation case.
- **Can support:** Robustness/sensitivity of encoded software and optimizer
  outcomes for the tested inputs.
- **Cannot support:** Climate forecasts, likely future frequency/severity,
  measured drought/heat impacts, or local farm stress response.
- **Next action:** Report exact scenario values and applicability; add no new
  agronomic model without a separately scoped research requirement.

### 8. Machine-learning prediction

- **Intended role:** No specific prediction target is defined in the README's
  implemented phases; feature engineering is described as preparation for
  future decision modules, not as an ML model.
- **Implementation/evidence:** `src/preprocessing/features.py` is deterministic
  feature engineering. `src/features.py` is a compatibility-facing feature
  module. A repository search for model classes, `.fit()`, common ML
  frameworks, training/test split use and model artifacts found no fitted
  predictive model or training/evaluation pipeline. `requirements.txt` has no
  ML framework dependency. No committed model artifacts were found under
  `models/`.
- **Status:** `not_implemented`.
- **Inputs/evidence class:** Features can be built from remote context and
  synthetic/demo inputs; there is no validated target/label dataset.
- **Output:** Features only; no trained prediction or calibrated probability.
- **Dependencies/failure modes:** A prediction target, labels, unit/measurement
  definitions, adequate independent examples, a baseline and leakage-safe
  evaluation are not established.
- **Can support:** Feature construction and schema tests only.
- **Cannot support:** Crop-yield, profit, irrigation, disease, or other
  predictions or predictive skill.
- **Next action:** Treat ML as optional Stage C. Define the target, labels,
  baselines, metrics and evidence requirements before implementing training.

### 9. Reinforcement-learning environment

- **Intended role:** Sequential adaptive management under changing supplied
  conditions, not crop rotation planning (README Phases 10–14).
- **Implementation/evidence:** `src/rl/environment.py::
  FieldShiftEnvironment` provides `reset`, `get_observation`,
  `get_available_actions`, and `step`. `tests/test_rl_environment.py` covers
  observations, time ordering, actions and reward-unavailable behavior.
- **Status:** `partially_implemented`.
- **Inputs/evidence class:** A caller-supplied `FieldState` and dated
  historical environmental records; currently no bundled observed farm
  action/outcome sequences. NASA data, if supplied, are remote environmental
  context.
- **Output:** Structured observation, logged action/proposal, next supplied
  environmental observation, episode termination metadata.
- **Dependencies/failure modes:** A sequence of valid dated observations.
  Exhaustion ends the episode. The transition does not model crop growth,
  soil or water response to a management action.
- **Can support:** Observation/episode mechanics and deterministic tests over
  supplied historical rows.
- **Cannot support:** A validated simulator of farm management or expected
  counterfactual outcomes.
- **Next action:** Keep the environment research-incomplete until
  action-conditioned transitions are empirically defensible; do not bypass
  the readiness gate.

### 10. RL action representation and execution

- **Intended role:** Represent meaningful adaptive management decisions.
- **Implementation/evidence:** Actions are `no_intervention`,
  `inspect_reassess`, and conditionally a parameterized
  `irrigation_adjustment`. In `FieldShiftEnvironment.step`, action choice is
  recorded and explained, but `_advance_environment` reveals the next supplied
  weather record regardless of selected action. Irrigation is explicitly a
  `proposal_not_applied`; state/equipment are not changed. Tests
  `test_irrigation_action_is_a_proposal_not_an_applied_measurement` and
  `test_milp_rl_integration.py` enforce the distinction.
- **Status:** `interface_only`.
- **Inputs/evidence class:** Caller-supplied irrigation capacity may expose a
  proposed amount; no observed applied action or executed control is bundled.
- **Output:** Action record and, for irrigation, a proposal bounded by
  caller-supplied capacity.
- **Dependencies/failure modes:** Irrigation action is unavailable without a
  finite positive capacity; otherwise actions are validated by ID/schema.
  Neither proposal is evidence that an operation occurred.
- **Can support:** Action-schema and proposal-validation tests.
- **Cannot support:** Policy learning over action effects, automated control,
  or causal/action-conditioned management outcomes.
- **Next action:** Define action semantics, execution evidence and transition
  outcomes before considering a learning algorithm or operational control.

### 11. Reward calculation and validation

- **Intended role:** Provide an outcome-grounded RL learning signal without
  substituting planner objectives or synthetic crop proxies.
- **Implementation/evidence:** `src/rl/reward.py::validate_reward` classifies
  numeric validity and provenance; `calculate_reward` deliberately returns
  unavailable for metadata/rule inputs. `FieldShiftEnvironment.step` returns
  `reward=None`. `tests/test_rl_reward.py` and `tests/test_rl_training.py`
  check that no zero or MILP objective is substituted.
- **Status:** `blocked_by_data`.
- **Inputs/evidence class:** No validated measured, action-linked outcome is
  bundled. A custom reward callback is explicitly experimental and not
  evidence-backed.
- **Output:** Unavailable/invalid/experimental assessment; not a validated
  reward formula.
- **Dependencies/failure modes:** Requires measured action-linked outcomes,
  defensible reward definition, units, provenance and suitable validation.
- **Can support:** Reward-contract validation and correct refusal when reward
  is missing/invalid.
- **Cannot support:** Farm-success scoring, learned policy objective,
  agronomic reward validity, or policy performance.
- **Next action:** Keep reward unavailable until an outcome-grounded formula
  and evidence protocol are justified.

### 12. Farm action/outcome feedback loop

- **Intended role:** Link actions that were confirmed applied to measured
  outcomes, then use reviewed records as potential evaluation/reward evidence.
- **Implementation/evidence:** `src/data/farm_outcomes.py` ingests caller
  records against a canonical contract. `src/data/data_quality.py` reports
  provenance, linkage, duplicates, missingness and coverage.
  `src/rl/outcomes.py::validate_outcome_records` checks IDs, timestamps,
  units, field-season split leakage and action/outcome linkage.
  `src/data/offline_export.py::export_offline_evaluation` exports only
  structurally eligible partitions and explicitly makes no performance claim.
  `tests/test_farm_outcomes.py`, `tests/test_data_quality.py`,
  `tests/test_offline_export.py`, and `tests/test_pilot_data.py` cover these
  contracts. Pilot templates in `data/pilot_templates/` are header-only.
- **Status:** `blocked_by_data`.
- **Inputs/evidence class:** No real farm action/outcome records, consent
  approvals or partner agreement are present. Test fixtures are synthetic.
  `data/acquisition_log.csv` lists external requests as `not_started`.
- **Output:** Validation/quality reports and, for caller-supplied eligible
  records, a partitioned offline data export without performance metrics.
- **Dependencies/failure modes:** Authenticity, permitted use, confirmed
  applied action, linked measured outcome, method, units, timestamps,
  sufficient coverage and independent review. Passing structural checks does
  not authenticate caller assertions.
- **Can support:** Software validation of future caller records and refusal
  when schema/provenance/linkage/split checks fail.
- **Cannot support:** An empirical feedback loop, real-farm reward or policy
  update using current repository data.
- **Next action:** No recruitment is required for Stage A/B. If real records
  are later supplied, first review authorization, provenance, measurement
  methods and coverage; do not represent a planned MILP rotation as an applied
  action.

### 13. Evaluation and train/test split design

- **Intended role:** Enable independent evaluation without field-season
  leakage before any ML/RL performance claim.
- **Implementation/evidence:** Outcome schemas require `train`, `validation`,
  or `test`; `validate_outcome_records` checks consistent field-season
  assignment and overlapping outcome windows across splits.
  `prepare_offline_evaluation_data` and `export_offline_evaluation` preserve
  separate partitions and refuse incomplete/noneligible exports.
  `tests/test_farm_outcomes.py`, `tests/test_offline_export.py`, and
  `tests/test_data_quality.py` exercise these safeguards.
- **Status:** `partially_implemented`.
- **Inputs/evidence class:** Synthetic test fixtures only; no empirical rows to
  partition. Outcome split values are caller declarations subject to checks.
- **Output:** Validated/partitioned data preparation and refusal reasons; no
  trained model scores or policy-performance metrics.
- **Dependencies/failure modes:** Adequate independent field-season groups,
  complete non-empty partitions, documented outcome windows, and authentic
  records. Minimum readiness-gate episode numbers are prototype screening
  minima, not scientifically powered sample-size recommendations.
- **Can support:** Structural leakage checks and export behavior.
- **Cannot support:** Generalization, held-out performance, causal effect,
  forecasting skill or policy comparison in the absence of actual data and a
  declared evaluation.
- **Next action:** Predeclare split unit, evaluation target and metrics before
  collecting/inspecting labels; retain field/season independence.

### 14. Dashboard/decision-support output

- **Intended role:** Explain state, assumptions, planner/scenario outputs and
  readiness limitations without presenting plans as executed actions.
- **Implementation/evidence:** `src/dashboard.py::build_dashboard_data`,
  `render_dashboard`, and `main` build a read-only standard-library local
  dashboard using existing loaders, rules, MILP, scenario, quality and
  readiness APIs. `src/explainability/explanations.py` supplies
  input/result-grounded explanations. `tests/test_dashboard.py` checks data
  assembly, unavailable data, safe rendering and integration.
- **Status:** `implemented`.
- **Inputs/evidence class:** Local environmental, demo/synthetic context, and
  optional caller action/outcome CSV. The dashboard does not fetch NASA/SMAP
  data or independently authenticate caller files.
- **Output:** Read-only local summary of current state/features, rules,
  rotations/strategy profiles, what-if summaries, data quality and RL
  blockers.
- **Dependencies/failure modes:** Local files and underlying solver/data
  APIs; unavailable sections report unavailable rather than silently
  manufacturing field evidence. Local paths may be displayed.
- **Can support:** Software integration and transparent communication of
  current inputs/plans/limitations.
- **Cannot support:** Validated farmer recommendations, realized benefits,
  safety of operational deployment, or model accuracy.
- **Next action:** Keep the dashboard explicitly research-only and preserve
  status/provenance labels.

### 15. Research reproducibility and experiment reporting

- **Intended role:** Reproduce controlled software/optimizer experiments and
  preserve assumptions/results, without conflating solver outputs with
  observed outcomes.
- **Implementation/evidence:** `src/experiments/research_benchmark.py`
  provides `run_benchmark`, `run_sensitivity`, dataset inventory, report
  rendering and append helpers. `docs/experiments/phase28_research_benchmark.md`
  documents supported scenarios/limitations. `tests/test_research_benchmark.py`
  checks deterministic repeatability, configuration, scenario outcomes,
  provenance, constraint checks and append preservation.
- **Status:** `implemented`.
- **Inputs/evidence class:** Bundled synthetic crop/soil/history/SMAP-like
  values, NASA POWER-attributed files for inventory only, and explicit
  hypothetical baseline/scenario values.
- **Output:** Machine-readable experiment data and Markdown report with
  statuses, plans, objective components, dataset inventory and caveats.
- **Dependencies/failure modes:** Existing MILP/scenario APIs and installed
  solver; current API lacks a rainfall perturbation. Reported objective
  components inherit the synthetic assumptions and are not measured outcomes.
- **Can support:** Reproducible optimizer behavior under controlled
  hypothetical settings and software correctness checks.
- **Cannot support:** Real-world agronomic generalization, yield/profit
  improvement, water savings, soil-health gains or climate forecasts.
- **Next action:** Preserve command/configuration/solver context and distinguish
  hypothetical runs from empirical validation in future reports.

## Data gaps and their architecture impact

The following availability statements refer only to checked-in files and the
registry/acquisition tracker. A source institution's existence does not prove
that a particular product is available, current, licensed for reuse, or
appropriate for FieldShift.

| Dependency | Repository evidence | Availability classification | Affected components / consequence |
| --- | --- | --- | --- |
| Weather and climate context | `data/nasa_power/nasa_power_2025.csv` (365 daily rows, 2025-01-01–2025-12-31) and `data/nasa_power/nasa_power_lat23.8103_lon90.4125_20260831_20260929.csv` (30 rows, 2026-08-31–2026-09-29; two solar-radiation values missing). File attribution documented; retrieval manifest absent. | `remote/environmental context only`; NASA POWER-attributed, not independently authenticated; no farm measurement or forecast. | State/features, current-context compatibility, and scenario baseline. Does not supply yield, management or forecast evidence. Solar-radiation units are not documented in the CSVs. |
| Real measured soil properties | `data/soil/demo_soil.csv`: 2 rows, explicitly synthetic; nitrogen missing once and organic matter missing once. SRDI laboratory route in registry is pending verification. | `available but synthetic/demo`; actual lab data `missing/unverified`. | Soil state, pH/nutrient compatibility and soil objective have no empirical field basis. |
| Crop/cultivar suitability | `data/crops/crop_knowledge.csv`: 7 synthetic/demo rows, no cited cultivar/region/method/uncertainty. BARI/BRRI routes list institutions but no product publications verified. | `available but synthetic/demo`; local parameter evidence `missing/unverified`. | Crop constraints, expected yield/cost/price/water and objective components inherit illustrative assumptions. |
| Field geometry and area | No populated field registry; `data/pilot_templates/field_registry.csv` is blank. Registry notes no partner or geometry. | `missing`; template defines a future schema only. | No field boundary, representative spatial extraction, actual area-scaled input or farm-level aggregation. |
| Planting calendar and crop timing | No observed season dates; `data/pilot_templates/crop_seasons.csv` is blank. Crop catalog duration values exist but are synthetic and not tied to a local calendar. | `missing` for empirical local calendar; demo duration only. | MILP periods are ordered labels, not dated calendar constraints; cannot assess planting windows/harvest overlap. |
| Irrigation availability and seasonal allocation | No field allocation or measured irrigation volume. `demo_field_history.csv` irrigation is categorical. Environment may accept caller-supplied irrigation capacity/available water, but no local allocation file is present. | `missing`; caller-supplied feature is an assumption unless documented. | Low-water scenario only applies when a hypothetical seasonal water value is explicitly supplied; no actual water demand/savings claims. |
| Observed management actions | No caller action dataset; pilot templates are empty; acquisition tracker partner route is `not_started`. | `missing`; no real action observations. | Cannot establish applied interventions, policy behavior or action-linked transition effects. |
| Measured yield and realized costs/revenue | Four synthetic history rows (one yield blank); crop expected-yield/cost/price are illustrative. No observed outcome rows are bundled. | `available but synthetic/demo` for examples; measured outcomes `missing`. | Optimizer profit objective is bookkeeping under demo metadata, not realized economics or predictive yield. |
| Repeated soil-health observations | Two synthetic soil snapshots, no validated lab methods or repeated measurement series. Pilot soil template is blank. | `synthetic/demo`; empirical repeated observations `missing`. | No measured soil-health change or soil-impact validation. |
| Weather observations/forecasts | Bundled NASA POWER-attributed daily snapshots; no forecast dataset. Candidate BMD station route lacks exact product/access/coverage/rights verification. | NASA is remote context; forecast and verified station series `missing/unverified`. | Historical context can be tested; no forecast skill or farm-local weather validation. |
| Action-linked outcomes and transitions | No action/outcome data. RL environment advances through next supplied NASA observation independent of action, returns `None` reward; readiness has no action-conditioned transition support. | `missing` and RL `blocked_by_data`. | No defensible RL reward, learned policy evaluation or causal action response. |
| Public/modelled context | Source registry describes SoilGrids as 250 m CC BY 4.0 modelled context with uncertainty and source-specific API availability limitations; no local SoilGrids data file is bundled. BARC/BADC requested products remain unverified; BADC maps are explicitly historical candidates. | Product/context route metadata recorded; specific datasets `not verified/not bundled`. | No modelled context currently feeds the benchmark; historical maps are not current field observations. |

Across the source registry, NASA POWER, NASA SMAP, and Sentinel-2 are
classified as remote/environmental evidence, never direct farm measurement.
SoilGrids is modelled context. Local soil, crop, field history and SMAP-like
demo rows are synthetic. Partner laboratory observations, calibrated field
sensors, management logs and measured harvest outcomes remain distinct
evidence types and are not present as real records.

## ML, RL and MILP interpretation

### ML

FieldShift currently constructs features but does not train or evaluate a
predictive ML model. No target/label construction, fitted model artifact,
prediction metric, leakage-safe ML validation result, or ML framework/training
dependency was found. The deterministic feature pipeline and rule calculations
are not ML; the MILP is a mathematical optimization model, not a trained
predictor.

### RL

There is no executable learning algorithm in the repository. `Policy` in
`src/rl/agent.py` is an interface; `DeterministicBaselinePolicy` selects
`no_intervention` when available and is not learning. `run_training` in
`src/rl/training.py` executes generic episodes, but stops with
`unsupported_reward` when the environment returns no reward. A caller-supplied
reward can only be marked experimental; it does not enable validated learning.

The state-observation-action-transition-reward chain is incomplete for RL:

1. Structured observations are assembled from supplied current/history inputs.
2. Actions are logged; irrigation is explicitly a proposal and is not applied.
3. Every action exposes the next supplied environmental observation; the
   transition is not action-conditioned.
4. Reward is `None`; `calculate_reward` refuses crop metadata and planner
   objectives as outcome substitutes.
5. No real action-linked outcomes, action-conditioned transitions, or trained
   policy evaluation data are bundled.
6. `assess_learning_readiness` is a read-only gate. The bundled environment
   does not declare action-conditioned transition support and has no
   outcome-backed reward; readiness therefore remains
   `blocked_missing_outcome_evidence`.

`src/rl/train.py` is only a module docstring; the reusable generic loop is
`src/rl/training.py`. No readiness safeguard is bypassed by this audit. The
readiness gate's hypothetical caller-attested "ready" test fixture verifies
gate logic, not real evidence or actual FieldShift RL readiness.

### MILP

The MILP is the operative long-term planner. Its decision variables and
constraints are documented in layer 6 and in `README.md` Phase 7. Solver status
and infeasibility are returned explicitly; infeasible plans are not replaced
with fallback rotations. Objective normalization is min-max over the supplied
crop set, and the soil mapping/water-saving/profit metadata remain
illustrative. Supplied current climate/pH/water compatibility is treated as
static across future periods; the formulation has no climate forecast or
dated crop-calendar model. Unit tests establish implementation behavior for
fixtures, not empirical agronomic validity. No empirical validation against
observed rotations or yields was found.

## Research-question alignment

**Question:** “How does a constraint-based crop-rotation optimizer respond to
hypothetical climate and water stress scenarios under explicit agronomic
assumptions and incomplete environmental/soil evidence?”

**Assessment: supported as a bounded software/optimization research question.**
`src/scenarios/stress_test.py::run_stress_tests` perturbs the supplied context
and calls the existing rule engine/optional optimizer;
`src/optimizer/milp.py::optimize_rotation` returns solver status, plan,
components and constraints; `src/experiments/research_benchmark.py` records a
fixed baseline, supported scenarios and one-at-a-time sensitivities. The
Phase 28 benchmark executed the existing `normal`, `drought`, `heat`, and
`low_water` paths. It reported optimizer status and plan checks for a
synthetic crop catalog, explicit hypothetical FieldState and hypothetical
1500 mm seasonal water input. In those specific runs, all reported runs were
optimal; heat changed the selected rotation, drought did not, and low-water
changed ordering. This only establishes how the present implementation
responded to those particular values, not why a real farmer's outcome would
change.

The question must retain its qualifiers: hypothetical; encoded assumptions;
incomplete evidence; solver behavior rather than field performance. A
rainfall-reduction scenario is not supported by the present scenario API.
Power CSVs are inventoried by the benchmark but are not direct field
measurements or empirical optimizer labels.

The original title and README describe a hybrid NASA-driven system with a
future adaptive RL role. The currently feasible empirical scope is narrower:
reproducible software testing and assumption-dependent MILP/scenario behavior.
The NASA context is not currently coupled to verified farm outcomes, the
bundled agronomic inputs are synthetic, and the RL path is not learning. This
audit does not replace or silently redefine the original objective; it records
which part can presently be investigated credibly.

**Not currently answerable credibly from the repository:** real-world yield
improvement; realized profit improvement; irrigation or water savings; soil
health improvement; crop/cultivar recommendation validity; climate forecast
skill; empirical generalization across farms/seasons; causal effects of
management actions; or RL policy performance.

## Staged research architecture

Farmer/partner access is **not** an entry condition for Stages A or B. Public
or synthetic inputs can support software and assumption studies, but cannot
alone establish farm performance.

| Stage | Entry criteria | Deliverables | Exit criteria | Claims still prohibited until separately validated |
| --- | --- | --- | --- | --- |
| **A — Current reproducible prototype** | Existing code, local fixtures and provenance labels are available; maintain distinction between remote, synthetic, modelled and hypothetical inputs. | Data/schema checks; deterministic FieldState/features; cited/configurable agronomic assumptions; MILP feasibility and infeasibility tests; supported hypothetical scenarios; reproducible experiment reports. | Tests pass; inputs/configuration/software/solver statuses are recorded; provenance and missingness remain explicit; no unsupported run is presented as successful. | Real yield/profit gains, water savings, soil-health improvements, forecast skill, farm suitability, and RL performance. |
| **B — Evidence-informed evaluation** | A specific public dataset or agronomic reference is identified; its actual files/product, license, attribution, temporal and spatial coverage, units, uncertainty, version/vintage and fitness are verified. No field partner is required. | Source-specific manifest; permitted-use review; versioned feature/crop/rule evidence; data-quality and transferability analysis; controlled retrospective/context evaluation where target evidence exists. | Data and terms are documented and reproducible; limitations and geographic/population transfer are explicit; evaluation design is declared before interpreting results. | Field validation, causal claims, farmer benefit, or real-world performance merely from public/context data; any claim not supported by the verified product/outcome design. |
| **C — Optional ML module** | A defined prediction target and decision time; measured target labels with units and provenance; enough independent examples; documented baseline and evaluation protocol; leakage-safe grouping. | Target/feature contract; simple baseline model(s); training-only preprocessing; field/season/group-aware train/validation/test evaluation; predeclared relevant metrics and uncertainty; missingness and subgroup analysis. | Held-out evaluation is reproducible and leakage checks pass; performance is compared with a simple baseline and interpreted within coverage/transferability limits. | Causal impacts, future-farm performance outside tested coverage, or improved decisions/outcomes from predictive accuracy alone. |
| **D — Future RL research** | Defensible, action-conditioned environment or suitable logged transition evidence; meaningful actions and execution status; measured outcome-linked reward specification; adequate independent episodes/units; behavior-policy and confounding information as appropriate; safety review. | State/action/transition/outcome provenance contract; explicit reward rationale and units; offline/online protocol with leakage-safe held-out evaluation; strong non-RL baselines; uncertainty and safety/constraint evaluation; readiness-gate evidence. | Action effects and reward inputs are validated for the intended scope; minimum data/evaluation requirements are met; readiness gate passes on verified evidence; policy is compared safely with appropriate baselines. | Safe deployment, causal benefit, policy superiority or transfer beyond evaluated domains without separate prospective/independent validation. |

## Audit boundary and repository safety

This Phase 27E work is documentation-only. It does not change optimizer
weights/constraints, agronomic rules, farmer recommendations, data values,
source classifications, pilot template schemas, dashboard behavior, RL code,
or readiness/training behavior. Existing data/acquisition and pilot artifacts
are described as found; no partner, approval, consent, or dataset is inferred
from an institutional URL. No farm records are created or relabelled.
No real farm data were fabricated, and RL training was not enabled.
Phase 27E changes only this audit document and appends its report to
`output.txt`.

**Recommended next step:** Continue with Stage A reproducibility and
assumption-sensitivity work. Before Stage B, verify each selected public
product/reference and its terms; do not begin ML/RL training until the
target/outcome evidence and leakage-safe evaluation prerequisites in Stages C
and D are met.

## Verification performed

Commands were run from the repository root after the audit document was
written:

| Command | Result |
| --- | --- |
| `.\.venv\Scripts\python.exe -m unittest discover -s tests -v` | Exit 0; 425 tests passed in 33.298 seconds. |
| `.\.venv\Scripts\python.exe -B -m compileall -q src` | Exit 0. |
| `.\.venv\Scripts\python.exe -m src.data.pilot_data` | Exit 0; pilot templates and cross-table references are valid. |
| `.\.venv\Scripts\python.exe -m src.data.source_registry` | Exit 0; source registry and acquisition log are structurally valid. |
| `git diff --check` | Exit 0. |
| Trailing-whitespace scan of `docs/architecture/architecture_alignment_audit.md` | No trailing whitespace after removing the initial Markdown hard-break whitespace. |

No focused new test was added: this phase changes documentation only, and
the full existing suite was run. These checks validate software and document
consistency, not the scientific validity of the agronomic assumptions or
external data declarations.
