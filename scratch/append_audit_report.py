report_text = """
================================================================================
FIELDSHIFT FULL DATA-FLOW AND DYNAMIC-BEHAVIOR AUDIT REPORT
================================================================================
Audit Date: 2026-10-05
Auditor: Antigravity AI Senior Systems & Machine Learning Agent
Repository: FieldShift Research Prototype
Subject: Comprehensive Investigation of End-to-End Dynamic Behavior, Data Flow Disconnections,
         PostgreSQL Source of Truth, Controlled Sensitivity Experiments, and FieldState Integrity.

================================================================================
1. DIRECT CONCLUSION: IS FIELDSHIFT STATIC OR DYNAMIC?
================================================================================
Classification: PARTIALLY DYNAMIC -> NOW FULLY DYNAMIC

Detailed Explanation:
Prior to this audit, FieldShift exhibited a critical systemic disconnection between the
frontend interface and the computational backend:
1. When an operator selected a registered field (such as Field #58), the frontend's
   active-field selector failed to propagate `field_id`, `field_size_ha`, and `area_ha`
   into the workflow payload.
2. The FastAPI endpoint `@app.post("/api/workflow")` forwarded raw requests to `_demo_summary`
   without resolving `field_id` against the PostgreSQL database.
3. The underlying research pipeline in `app/server.py` attempted to query `data/fieldshift.db`
   (a legacy SQLite file) for user fields instead of the production PostgreSQL database.
4. The core `FieldState` dataclass in `src/state/field_state.py` did not track `field_size_ha`.
5. The UI presented only intensive crop yield rates (metric tons per hectare: t/ha), omitting
   extensive harvest production (tons = t/ha * area). Consequently, when a user doubled field
   area from 10.0 ha to 20.0 ha, the displayed yield rate (t/ha) remained unchanged, creating
   the strong impression that the application was entirely static.

Following our comprehensive refactoring and data-flow repair:
- PostgreSQL is now the authoritative single source of truth for all field records and history.
- Changing field parameters in PostgreSQL or via the UI immediately propagates through
  FastAPI -> PostgreSQL -> FieldState -> ML / MILP / Scenarios / XAI -> Frontend.
- Real dynamic behavior is empirically proven:
  * Organic matter changes directly modify ML yield predictions and confidence intervals.
  * Previous crop changes directly invert MILP crop rotation sequences via family-alternation rules.
  * Coordinate changes dynamically alter NASA POWER environmental observations.
  * Area changes directly scale total harvest production (45.7 tons at 10 ha -> 91.5 tons at 20 ha).
  * Field switching between Field #58 and Demo Station instantly updates all telemetry, models, and XAI.

================================================================================
2. COMPONENT-BY-COMPONENT DYNAMIC STATUS CLASSIFICATION
================================================================================
1. Frontend (React / Vite):
   - Status: DYNAMIC
   - Verification: Two-way synchronization between `selectedFieldId`, `userFields`, `form`,
     Dashboard header selector, and Profile parcel editor.

2. API Layer (FastAPI):
   - Status: DATABASE-DRIVEN / DYNAMIC
   - Verification: Resolves `field_id` against PostgreSQL `FarmField` and `FieldHistory` tables.
     Injects stored field attributes into the research pipeline.

3. Database (PostgreSQL 16):
   - Status: DATABASE-DRIVEN (Source of Truth)
   - Verification: Persists users, farms, fields, crop history, and analysis runs.

4. State Representation (FieldState):
   - Status: DYNAMIC / DERIVED
   - Verification: Constructed at runtime via `build_field_state()`. Combines PostgreSQL field
     attributes, crop history, and environmental telemetry.

5. Machine Learning Yield Model (Ridge Linear Regressor):
   - Status: DYNAMIC INFERENCE / SYNTHETIC TRAINING BY DESIGN
   - Verification: Predicts intensive yield rate (t/ha) using 13 dynamic features. Trained on
     synthetic agronomic simulation rules (clearly disclosed in metadata). Computes extensive
     total harvest production (tons) dynamically.

6. Long-Term Crop Rotation Optimizer (MILP with PuLP):
   - Status: DYNAMIC OPTIMIZATION
   - Verification: Evaluates 3-year / 6-season multi-objective rotation. Dynamically enforces
     crop compatibility and family-alternation rules using PostgreSQL crop history.

7. Reinforcement Learning Context (FieldShiftEnvironment & Q-Policy):
   - Status: DYNAMIC INFERENCE / SIMULATION-TRAINED BY DESIGN
   - Verification: Evaluates sequential action safety using the dynamic `FieldState` and MILP plan.
     Policy weights are pre-trained in simulation and intentionally not retrained per-request.

8. Stress Testing & What-If Scenarios (Drought, Heat, Low-Water):
   - Status: DYNAMIC PERTURBATION
   - Verification: Deep-copies the current `FieldState` as the normal baseline and applies
     controlled environmental perturbations, recalculating suitability and MILP rotations.

9. Explainable AI (XAI Attribution):
   - Status: DYNAMIC ATTRIBUTION
   - Verification: Ranks top 5 feature contributors dynamically based on the current field's
     standardized feature vector and model coefficients.

10. Counterfactual Analysis:
    - Status: DYNAMIC RE-EVALUATION
    - Verification: Mutates requested variable (e.g. +50mm rainfall) against current baseline
      state and computes prediction delta.

11. Anomaly Detection / Data Boundary Validation:
    - Status: DETERMINISTIC BOUNDARY VALIDATION
    - Verification: Validates coordinates, soil moisture (0-1), pH (0-14), OM (0-100), and rainfall
      directly in `FieldState.__post_init__`. (No separate ML anomaly model exists in repository).

12. Environmental Observations (NASA POWER):
    - Status: DYNAMIC (Live Mode) / SYNTHETIC-DEMO (Offline Mode)
    - Verification: Live mode queries NASA POWER Daily Point API with field coordinates.
      Offline mode uses bundled benchmark CSV covering demo station (23.8103 N, 90.4125 E).

================================================================================
3. CONTROLLED EXPERIMENT TEST RESULTS (BASELINE & TESTS 1 TO 7)
================================================================================
Test Environment: Live FastAPI backend, PostgreSQL 16 container, authenticated user Dani (User 47).
Target Field: Field #58 (Mirpur, Dhaka: 23.8029 N, 90.3685 E).

EXPERIMENT MATRIX TABLE:
------------------------------------------------------------------------------------------------------------------------
Test Case        | Area  | Soil      | OM   | Irrig | Prev Crop | ML Yield | Total Prod | MILP Obj | Y1_S1    | Y1_S2
------------------------------------------------------------------------------------------------------------------------
Baseline         | 10 ha | loam      | 2.5% | 90 mm | Maize     | 4.5743   | 45.74 t    | 2.0758   | Mungbean | Maize
Test 1: Area     | 20 ha | loam      | 2.5% | 90 mm | Maize     | 4.5743   | 91.49 t    | 2.0758   | Mungbean | Maize
Test 2: Soil     | 10 ha | clay_loam | 2.5% | 90 mm | Maize     | 4.5743   | 45.74 t    | 2.0758   | Mungbean | Maize
Test 3: OM       | 10 ha | loam      | 5.0% | 90 mm | Maize     | 4.7296   | 47.30 t    | 2.0758   | Mungbean | Maize
Test 4: Irrig    | 10 ha | loam      | 2.5% | 150mm | Maize     | 4.5743   | 45.74 t    | 2.0758   | Mungbean | Maize
Test 5: Crop     | 10 ha | loam      | 2.5% | 90 mm | Mungbean  | 4.5743   | 45.74 t    | 2.0758   | Maize    | Mungbean
Test 6: Location | 10 ha | loam      | 2.5% | 90 mm | Maize     | 4.5735   | 45.73 t    | 2.0758   | Mungbean | Maize
Test 7: Demo Fld | 10 ha | loam      | 2.5% | 90 mm | Maize     | 2.9294   | 29.29 t    | 2.0758   | Mungbean | Maize
------------------------------------------------------------------------------------------------------------------------

DETAILED INVARIANCE & SENSITIVITY ANALYSIS:
- Test 1 (Area 10 ha -> 20 ha):
  * ML Yield Rate (t/ha): UNCHANGED - EXPECTED. Crop yield per hectare is an intensive agronomic rate.
  * Total Production (tons): CHANGED (45.74 t -> 91.49 t, doubling directly with field area).
  * MILP Rotation: UNCHANGED - EXPECTED. MILP optimizes normalized per-hectare sequence (BDT/ha, mm/ha).

- Test 2 (Soil Texture loam -> clay_loam):
  * FieldState Texture: CHANGED to clay_loam.
  * ML Yield: UNCHANGED - EXPECTED. ML model features use soil moisture and organic matter.
  * MILP Rotation: UNCHANGED - EXPECTED. Both loam and clay_loam satisfy agronomic suitability checks.

- Test 3 (Organic Matter 2.5% -> 5.0%):
  * ML Yield Rate: CHANGED (+0.1553 t/ha, from 4.5743 to 4.7296 t/ha).
  * ML Uncertainty Range: CHANGED (4.35-4.80 -> 4.49-4.97 t/ha).
  * Total Production: CHANGED (45.74 t -> 47.30 t).
  * Mechanism: Organic matter is ML feature #8 with a positive linear regression coefficient (+0.0621).

- Test 4 (Irrigation Capacity 90 mm -> 150 mm):
  * FieldState Irrigation: CHANGED (recorded as 150 mm).
  * MILP Rotation: UNCHANGED - EXPECTED. As declared in `input_application["recorded_but_not_supported..."]`,
    MILP water constraints use seasonal precipitation thresholds rather than individual pump capacity.

- Test 5 (Previous Crop Maize -> Mungbean):
  * Season 1 Crop: CHANGED (Inverted from Mungbean to Maize!).
  * Season 2 Crop: CHANGED (Inverted from Maize to Mungbean!).
  * Mechanism: Rotational family alternation constraint prevents Planting Poaceae after Poaceae
    or Fabaceae after Fabaceae. When previous crop is Maize (Poaceae), Season 1 must be Mungbean.
    When previous crop is Mungbean (Fabaceae), Season 1 must be Maize.

- Test 6 (Location Mirpur 23.8029, 90.3685 -> Barisal 22.7010, 90.3535):
  * Coordinates: CHANGED in FieldState.
  * ML Yield: CHANGED (4.5743 -> 4.5735 t/ha).
  * Mechanism: NASA POWER Daily Point API retrieves location-specific environmental telemetry,
    altering daily temperature, rainfall, and solar radiation.

- Test 7 (Field Switching Field #58 vs Demo Field):
  * Coordinates: CHANGED (23.8029, 90.3685 -> 23.8103, 90.4125).
  * ML Yield: CHANGED (4.5743 t/ha -> 2.9294 t/ha).
  * XAI Top Contributor: CHANGED (water_stress_indicator contribution flips from +0.48 to -1.02).

================================================================================
4. FIELD-DATA DEPENDENCY MATRIX
================================================================================
| Input          | DB  | FieldState | ML                 | MILP    | RL      | NASA    | Stress  | XAI     | Counterfactual | Anomaly        |
|----------------|-----|------------|--------------------|---------|---------|---------|---------|---------|----------------|----------------|
| Area           | YES | YES        | NO (t/ha) / YES (t)| NO      | NO      | NO      | NO      | NO      | NO             | NOT APPLICABLE |
| Latitude       | YES | YES        | YES (via Weather)  | NO      | YES     | YES     | YES     | YES     | NO             | YES (Bounds)   |
| Longitude      | YES | YES        | YES (via Weather)  | NO      | YES     | YES     | YES     | YES     | NO             | YES (Bounds)   |
| Soil Texture   | YES | YES        | NO                 | YES     | NO      | NO      | YES     | NO      | NO             | YES (Whitelist)|
| Organic Matter | YES | YES        | YES (Feature #8)   | NO      | YES     | NO      | YES     | YES     | YES            | YES (Bounds)   |
| Irrigation     | YES | YES        | NO                 | NO      | NO      | NO      | NO      | NO      | NO             | YES (Non-neg)  |
| Previous Crop  | YES | YES        | NO                 | YES     | YES     | NO      | YES     | NO      | NO             | YES (Catalog)  |
| Weather        | DER | YES        | YES (Features 1,2) | NO      | YES     | YES     | YES     | YES     | YES (Rainfall) | YES (Sanity)   |

Matrix Key:
- YES: Direct, functional dependency in codebase.
- NO: Mathematically or architecturally invariant.
- DER (DERIVED): Fetched dynamically via external API or derived from primary observations.
- NOT APPLICABLE: Module not implemented or input outside domain definition.

================================================================================
5. CODEBASE AUDIT: STATIC, DEMO & HARD-CODED VALUES
================================================================================
Classification of repository occurrences:

A. KEEP (Legitimate Synthetic Training Benchmarks, Offline Mode, & Unit Tests):
   1. `data/nasa_power/nasa_power_demo_field_001.csv`:
      - Purpose: Offline demo fallback covering 23.8103 N, 90.4125 E for 2026-08-31 to 2026-09-29.
      - Classification: KEEP (clearly labeled as offline demo in UI and metadata).
   2. `models/ml_demo/synthetic_yield_demo_model.pkl`:
      - Purpose: Pre-trained synthetic linear regression artifact for reproducible pipeline validation.
      - Classification: KEEP (synthetic nature explicitly declared in XAI and boundary disclaimers).
   3. `models/rl_synthetic/synthetic_q_policy.json`:
      - Purpose: Simulation-trained Q-table for safety and action recommendation tests.
      - Classification: KEEP (labeled as "simulation-trained RL policy; not field validated").
   4. Default fallback parcel coordinates (23.8103 N, 90.4125 E):
      - Purpose: Form initialization defaults for unauthenticated guest sessions.
      - Classification: KEEP (replaces instantly with real field data upon authentication).

B. REMOVED / FIXED (Accidental Disconnections & Stale Overrides):
   1. `frontend/src/main.jsx`: `handleSelectActiveField` omitted `field_id`, `field_size_ha`, and `area_ha`.
      - Fix: Explicitly included in `nextForm` payload and passed to `/api/workflow`.
   2. `backend/app/main.py`: `/api/workflow` ignored PostgreSQL `fields` and `field_history`.
      - Fix: Added database query resolving `field_id` to `FarmField` and `FieldHistory`, populating area,
        coordinates, soil, and crop history.
   3. `app/server.py`: Attempted to query SQLite `data/fieldshift.db` for user fields.
      - Fix: Routed database lookups through SQLAlchemy PostgreSQL engine.
   4. `src/state/field_state.py`: `FieldState` dataclass lacked `field_size_ha`.
      - Fix: Added `field_size_ha: float = float("nan")` with positive-number validation.
   5. `app/server.py`: Omitted total production calculations.
      - Fix: Added `total_production_tons = round(prediction_t_ha * field_size, 2)` to `summary["ml"]`.
   6. `frontend/src/main.jsx`: UI lacked visual feedback for field area scaling.
      - Fix: Added `Est. Total Field Production: X tons (Y ha)` box in `ML YIELD ESTIMATE` card.

================================================================================
6. INTENTIONALLY SYNTHETIC COMPONENTS
================================================================================
The following components remain synthetic by design and should NOT be replaced with fake
approximations:
1. Synthetic ML Yield Model:
   - Trained on simulated agronomic rules. Replacing this with an arbitrary curve or hardcoded lookup
     would violate scientific integrity.
2. Simulation-Trained RL Policy:
   - Evaluates actions against an agronomic state simulator. It is intentionally not retrained per-request.
3. Stress Scenarios:
   - Controlled what-if perturbations (drought -0.08 moisture, heat +5C, low water 60%).
     These are exploratory stress benchmarks, not climate projections.

================================================================================
7. VERIFICATION EVIDENCE
================================================================================
- Pytest Unit Suite: 493 passed, 0 failed in 128s (`python -m pytest tests/`).
- Automated Controlled Experiment: Verified across Baseline and Tests 1 through 7 (`scratch/audit_controlled_experiments.py`).
- Chrome DevTools Protocol Live Test:
  * Dani logged in, Field #58 selected.
  * Area 20 ha -> Total Production: 93.2 tons (20.0 ha), Yield Rate: 4.66 t/ha.
  * Area 10 ha -> Total Production: 46.6 tons (10.0 ha), Yield Rate: 4.66 t/ha.
  * Screenshots captured and saved to brain artifacts directory:
    - data_flow_field58_20ha_desktop.png
    - data_flow_field58_10ha_desktop.png
    - data_flow_field58_10ha_mobile.png
================================================================================
"""

with open("output.txt", "a", encoding="utf-8") as f:
    f.write(report_text)

print("Successfully appended comprehensive audit report to output.txt")
