# FieldShift Phase 29 — Research Benchmark Expansion and Sensitivity Analysis

Completion status: **completed**

Research-only hypothetical experiments. Results are software/optimizer
evidence under synthetic inputs, not forecasts, field trials, or validated
agronomic outcomes.

## Experiment configuration

- Planning periods: `Y1_S1, Y1_S2, Y2_S1, Y2_S2, Y3_S1, Y3_S2`
- Objective weights: `{"profit_weight": 0.5, "soil_weight": 0.2, "water_weight": 0.3}`
- Scenario parameters: `{"baseline_available_water_mm": 1500.0, "drought_soil_moisture_delta": -0.08, "heat_temperature_delta": 5.0, "low_water_fraction": 0.6, "rainfall_limitation": "The existing scenario API has no rainfall-perturbation scenario.", "rainfall_scenario_supported": false, "scenarios": ["normal", "drought", "heat", "low_water"], "supported_sensitivity_values": {"baseline_available_water_mm": [0.0, 300.0, 600.0, 900.0, 1200.0, 1500.0, 1800.0, 2400.0], "drought_soil_moisture_delta": [-0.04, -0.08, -0.12], "heat_temperature_delta": [2.0, 5.0, 8.0], "low_water_fraction": [0.8, 0.6, 0.4], "objective_weight_fraction": [0.0, 0.25, 0.5, 0.75, 1.0]}}`
- Reproducibility context: `{"determinism_note": "No random draws are used. CBC is configured by the optimizer with one thread; solver-version/platform differences may alter tie-breaking.", "random_seed": null, "randomness_used": false, "repeatability_tolerance": 1e-09, "software": {"pandas": "3.0.6", "platform": "Windows-11-10.0.26300-SP0", "pulp": "3.3.2", "python": "3.13.1"}, "solver": "PuLP CBC command-line solver", "solver_threads": 1, "solver_tolerance": "CBC default; no custom tolerance supplied"}`
- Experiment timestamp: `2026-10-03T08:28:00.032984+00:00`
- Random seed: not applicable; no random draws were used.

- Sensitivity parameter ranges: `{"baseline_available_water_mm": [0.0, 300.0, 600.0, 900.0, 1200.0, 1500.0, 1800.0, 2400.0], "drought_soil_moisture_delta": [-0.04, -0.08, -0.12], "heat_temperature_delta": [2.0, 5.0, 8.0], "low_water_fraction": [0.8, 0.6, 0.4], "objective_weight_fraction": [0.0, 0.25, 0.5, 0.75, 1.0]}`

## Experiment objectives and methodology

The baseline is one explicit synthetic FieldState with 23°C temperature,
29°C maximum, 18°C minimum, pH 6.2, soil moisture 0.25 m³/m³, and
hypothetical seasonal available water of 1500 mm. Six planning periods
and a three-season legume interval are used. The bundled seven-crop demo
table, existing agronomic rules, existing optimizer weights, and CBC
solver are reused. `run_stress_tests` compares each perturbation against
the same baseline. An independent checker verifies assignment, adjacent
families, legume windows, and selected-crop temperature/pH/water
incompatibility. Unknown compatibility is not confirmed suitability.
If a plan is absent, constraints are not marked passed.

One parameter is changed at a time. Each objective-weight sweep varies
one normalized share and redistributes the remainder in the baseline
ratio between the other two weights. Seasonal-water sweeps vary the
explicit hypothetical availability with all other inputs fixed.
Scenario plan changes and component deltas are recorded separately.

| Scenario | Transformation | Exact input used |
| --- | --- | --- |
| `normal` | Baseline copied unchanged | No perturbation |
| `drought` | Soil moisture delta | -0.08 m³/m³ from baseline 0.25 |
| `heat` | Add delta to available temperature fields | +5.0 °C from temperature 23.0 °C |
| `low_water` | Multiply explicit seasonal water by fraction | 1500 mm × 0.60 = 900 mm |

## Dataset provenance and coverage

| File | Rows | Columns | Date coverage | Missingness | Role, evidence / units / limitation |
| --- | ---: | --- | --- | --- | --- |
| `data/nasa_power/nasa_power_2025.csv` | 365 | `date, temperature, temp_max, temp_min, rainfall, humidity, wind_speed, solar_radiation` | 2025-01-01–2025-12-31 (date) | `{}` | NASA POWER-attributed; not independently authenticated; remote_observed; temperature: °C; rainfall: mm/day; humidity: %; wind_speed: m/s; solar_radiation unit not recorded; Coordinates and original request/retrieval manifest absent |
| `data/nasa_power/nasa_power_lat23.8103_lon90.4125_20260831_20260929.csv` | 30 | `date, temperature, temp_max, temp_min, rainfall, humidity, wind_speed, solar_radiation` | 2026-08-31–2026-09-29 (date) | `{"solar_radiation": 2}` | NASA POWER-attributed; not independently authenticated; remote_observed; temperature: °C; rainfall: mm/day; humidity: %; wind_speed: m/s; solar_radiation unit not recorded; Point in filename is not a field boundary; solar_radiation has missing values |
| `data/soil/demo_soil.csv` | 2 | `field_id, latitude, longitude, nitrogen, phosphorus, potassium, ph, organic_matter, texture, source, data_status, as_of_date` | 2026-09-18–2026-09-20 (as_of_date) | `{"nitrogen": 1, "organic_matter": 1}` | Bundled demo data; synthetic, not measured soil; synthetic; N/P/K: mg/kg; pH: unitless; organic_matter: percent by mass; coordinates: degrees; Two rows; N and organic matter each missing once |
| `data/crops/crop_knowledge.csv` | 7 | `crop, family, is_legume, water_requirement, duration_days, min_temperature, max_temperature, min_ph, max_ph, expected_yield, production_cost, market_price, nutrient_effect, soil_impact, source, data_status` | static / not recorded | `{}` | Bundled demo crop knowledge; synthetic illustrative parameters; synthetic; water_requirement: mm/growing season; duration: days; expected_yield: t/ha; production_cost: illustrative BDT/ha; market_price: illustrative BDT/t; temperature: °C; pH: unitless; No local cultivar, method, citation, or uncertainty; values not validated |
| `data/field_history/demo_field_history.csv` | 4 | `field_id, year, season, crop, yield, irrigation, source, data_status` | 2024–2025 (year) | `{"yield": 1}` | Bundled demo history; synthetic, not farm history; synthetic; yield: t/ha; year: calendar year; irrigation: categorical demo label; Four rows; one yield missing; no event-level action linkage |
| `data/smap/demo_smap.csv` | 3 | `date, latitude, longitude, soil_moisture, source, data_status` | 2026-09-25–2026-09-27 (date) | `{}` | SMAP-like bundled demo; synthetic and not NASA SMAP; synthetic; soil_moisture: m³/m³ per project documentation; coordinates: degrees; Three rows; no satellite product/version or direct sensor method |

The experiment uses the bundled synthetic crop-knowledge table and an
explicit hypothetical field-state/water fixture. It does not consume the
NASA POWER files as field measurements. NASA attribution is not independent
authentication of the bundled files.

## Optimizer and constraints

- Baseline optimizer status: **optimal**
- Solver status: `Optimal`
- Baseline feasible: `True`
- Baseline selected plan: `{"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}`
- Baseline independent hard-constraint check: `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}`
- Baseline objective components (illustrative, not measurements): `{"profit": 669000.0, "soil": 3.0, "water": 5.333333333333333}`

| Scenario | Scenario status | Optimizer status | Feasible | Plan | Rotation changed | Objective component delta* | Constraint check |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `normal` | `completed` | `optimal` | `True` | `{"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}` | `False` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| `drought` | `completed` | `optimal` | `True` | `{"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}` | `False` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| `heat` | `completed` | `optimal` | `True` | `{"Y1_S1": "Lentil", "Y1_S2": "Maize", "Y2_S1": "Lentil", "Y2_S2": "Maize", "Y3_S1": "Lentil", "Y3_S2": "Maize"}` | `True` | `{"profit": -285000.0, "soil": 0.6666666666666665, "water": -0.33333333333333304}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| `low_water` | `completed` | `optimal` | `True` | `{"Y1_S1": "Lentil", "Y1_S2": "Potato", "Y2_S1": "Lentil", "Y2_S2": "Potato", "Y3_S1": "Lentil", "Y3_S2": "Potato"}` | `True` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |

*Deltas are differences in the optimizer's reported objective components
under demo crop metadata and must not be interpreted as real money,
measured water use, or measured soil-health outcomes.*
The profit component is an illustrative gross-margin proxy; water and
soil components are normalized over the supplied crop catalog. Their
values can change with catalog contents and are optimizer outputs, not
measured farm outcomes.

## Sensitivity and repeatability

Identical baseline inputs were solved twice independently. Repeatability
summary: `{"component_absolute_tolerance": 1e-09, "components_within_tolerance": true, "maximum_absolute_component_difference": 0.0, "repeatable": true, "repetitions": 2, "runs": [{"independent_constraint_check": {"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}, "objective_components": {"profit": 669000.0, "soil": 3.0, "water": 5.333333333333333}, "plan": {"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}, "status": "optimal"}, {"independent_constraint_check": {"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}, "objective_components": {"profit": 669000.0, "soil": 3.0, "water": 5.333333333333333}, "plan": {"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}, "status": "optimal"}], "same_optimizer_status": true, "same_plan": true}`.
Status and plan are compared exactly; available objective components
are compared within the recorded absolute tolerance. No-plan cases
are retained without imputation.

### Objective-weight sensitivity

**`profit_weight`**

| Value | Varied configuration | Scenario status | Optimizer status | Feasible | Plan | Rotation changed | Component delta | Independent constraints |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.0 | `{"profit_weight": 0.0, "soil_weight": 0.4, "water_weight": 0.6}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Lentil", "Y1_S2": "Mustard", "Y2_S1": "Lentil", "Y2_S2": "Mustard", "Y3_S1": "Lentil", "Y3_S2": "Mustard"}` | `True` | `{"profit": -271500.0, "soil": 1.333333333333333, "water": 0.5}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 0.25 | `{"profit_weight": 0.25, "soil_weight": 0.30000000000000004, "water_weight": 0.44999999999999996}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Lentil", "Y1_S2": "Mustard", "Y2_S1": "Lentil", "Y2_S2": "Mustard", "Y3_S1": "Lentil", "Y3_S2": "Mustard"}` | `True` | `{"profit": -271500.0, "soil": 1.333333333333333, "water": 0.5}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 0.5 | `{"profit_weight": 0.5, "soil_weight": 0.2, "water_weight": 0.3}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}` | `False` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 0.75 | `{"profit_weight": 0.75, "soil_weight": 0.1, "water_weight": 0.15}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}` | `False` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 1.0 | `{"profit_weight": 1.0, "soil_weight": 0.0, "water_weight": 0.0}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}` | `False` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |

**`water_weight`**

| Value | Varied configuration | Scenario status | Optimizer status | Feasible | Plan | Rotation changed | Component delta | Independent constraints |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.0 | `{"profit_weight": 0.7142857142857143, "soil_weight": 0.28571428571428575, "water_weight": 0.0}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}` | `False` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 0.25 | `{"profit_weight": 0.5357142857142857, "soil_weight": 0.21428571428571433, "water_weight": 0.25}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}` | `False` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 0.5 | `{"profit_weight": 0.35714285714285715, "soil_weight": 0.14285714285714288, "water_weight": 0.5}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}` | `False` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 0.75 | `{"profit_weight": 0.17857142857142858, "soil_weight": 0.07142857142857144, "water_weight": 0.75}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Lentil", "Y1_S2": "Mustard", "Y2_S1": "Lentil", "Y2_S2": "Mustard", "Y3_S1": "Lentil", "Y3_S2": "Mustard"}` | `True` | `{"profit": -271500.0, "soil": 1.333333333333333, "water": 0.5}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 1.0 | `{"profit_weight": 0.0, "soil_weight": 0.0, "water_weight": 1.0}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Mustard", "Y1_S2": "Lentil", "Y2_S1": "Mustard", "Y2_S2": "Lentil", "Y3_S1": "Mustard", "Y3_S2": "Lentil"}` | `True` | `{"profit": -271500.0, "soil": 1.333333333333333, "water": 0.5}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |

**`soil_weight`**

| Value | Varied configuration | Scenario status | Optimizer status | Feasible | Plan | Rotation changed | Component delta | Independent constraints |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.0 | `{"profit_weight": 0.625, "soil_weight": 0.0, "water_weight": 0.37499999999999994}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}` | `False` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 0.25 | `{"profit_weight": 0.46875, "soil_weight": 0.25, "water_weight": 0.28124999999999994}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}` | `False` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 0.5 | `{"profit_weight": 0.3125, "soil_weight": 0.5, "water_weight": 0.18749999999999997}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Lentil", "Y1_S2": "Mustard", "Y2_S1": "Lentil", "Y2_S2": "Mustard", "Y3_S1": "Lentil", "Y3_S2": "Mustard"}` | `True` | `{"profit": -271500.0, "soil": 1.333333333333333, "water": 0.5}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 0.75 | `{"profit_weight": 0.15625, "soil_weight": 0.75, "water_weight": 0.09374999999999999}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Mustard", "Y1_S2": "Lentil", "Y2_S1": "Mustard", "Y2_S2": "Lentil", "Y3_S1": "Mustard", "Y3_S2": "Lentil"}` | `True` | `{"profit": -271500.0, "soil": 1.333333333333333, "water": 0.5}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 1.0 | `{"profit_weight": 0.0, "soil_weight": 1.0, "water_weight": 0.0}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Mungbean", "Y1_S2": "Mustard", "Y2_S1": "Mungbean", "Y2_S2": "Mustard", "Y3_S1": "Mungbean", "Y3_S2": "Mustard"}` | `True` | `{"profit": -325500.0, "soil": 1.333333333333333, "water": 0.33333333333333304}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |

### Baseline seasonal water assumptions

**`baseline_available_water_mm`**

| Value | Varied configuration | Scenario status | Optimizer status | Feasible | Plan | Rotation changed | Component delta | Independent constraints |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.0 | `{"available_water_mm": 0.0}` | `baseline sensitivity` | `infeasible` | `False` | `null` | `None` | `{"profit": null, "soil": null, "water": null}` | `{"passed": null, "status": "not_evaluated_no_feasible_plan", "violations": []}` |
| 300.0 | `{"available_water_mm": 300.0}` | `baseline sensitivity` | `infeasible` | `False` | `null` | `None` | `{"profit": null, "soil": null, "water": null}` | `{"passed": null, "status": "not_evaluated_no_feasible_plan", "violations": []}` |
| 600.0 | `{"available_water_mm": 600.0}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Lentil", "Y1_S2": "Potato", "Y2_S1": "Lentil", "Y2_S2": "Potato", "Y3_S1": "Lentil", "Y3_S2": "Potato"}` | `True` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 900.0 | `{"available_water_mm": 900.0}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Lentil", "Y1_S2": "Potato", "Y2_S1": "Lentil", "Y2_S2": "Potato", "Y3_S1": "Lentil", "Y3_S2": "Potato"}` | `True` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 1200.0 | `{"available_water_mm": 1200.0}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}` | `False` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 1500.0 | `{"available_water_mm": 1500.0}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}` | `False` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 1800.0 | `{"available_water_mm": 1800.0}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}` | `False` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 2400.0 | `{"available_water_mm": 2400.0}` | `baseline sensitivity` | `optimal` | `True` | `{"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}` | `False` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |

### Supported scenario sensitivity

**`heat_temperature_delta`**

| Value | Varied configuration | Scenario status | Optimizer status | Feasible | Plan | Rotation changed | Component delta | Independent constraints |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 2.0 | `{"heat_temperature_delta": 2.0}` | `completed` | `optimal` | `True` | `{"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}` | `False` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 5.0 | `{"heat_temperature_delta": 5.0}` | `completed` | `optimal` | `True` | `{"Y1_S1": "Lentil", "Y1_S2": "Maize", "Y2_S1": "Lentil", "Y2_S2": "Maize", "Y3_S1": "Lentil", "Y3_S2": "Maize"}` | `True` | `{"profit": -285000.0, "soil": 0.6666666666666665, "water": -0.33333333333333304}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 8.0 | `{"heat_temperature_delta": 8.0}` | `completed` | `optimal` | `True` | `{"Y1_S1": "Maize", "Y1_S2": "Mungbean", "Y2_S1": "Maize", "Y2_S2": "Mungbean", "Y3_S1": "Maize", "Y3_S2": "Mungbean"}` | `True` | `{"profit": -339000.0, "soil": 0.6666666666666665, "water": -0.5}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |

**`drought_soil_moisture_delta`**

| Value | Varied configuration | Scenario status | Optimizer status | Feasible | Plan | Rotation changed | Component delta | Independent constraints |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| -0.04 | `{"drought_soil_moisture_delta": -0.04}` | `completed` | `optimal` | `True` | `{"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}` | `False` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| -0.08 | `{"drought_soil_moisture_delta": -0.08}` | `completed` | `optimal` | `True` | `{"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}` | `False` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| -0.12 | `{"drought_soil_moisture_delta": -0.12}` | `completed` | `optimal` | `True` | `{"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}` | `False` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |

**`low_water_fraction`**

| Value | Varied configuration | Scenario status | Optimizer status | Feasible | Plan | Rotation changed | Component delta | Independent constraints |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.8 | `{"low_water_fraction": 0.8}` | `completed` | `optimal` | `True` | `{"Y1_S1": "Potato", "Y1_S2": "Lentil", "Y2_S1": "Potato", "Y2_S2": "Lentil", "Y3_S1": "Potato", "Y3_S2": "Lentil"}` | `False` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 0.6 | `{"low_water_fraction": 0.6}` | `completed` | `optimal` | `True` | `{"Y1_S1": "Lentil", "Y1_S2": "Potato", "Y2_S1": "Lentil", "Y2_S2": "Potato", "Y3_S1": "Lentil", "Y3_S2": "Potato"}` | `True` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |
| 0.4 | `{"low_water_fraction": 0.4}` | `completed` | `optimal` | `True` | `{"Y1_S1": "Lentil", "Y1_S2": "Potato", "Y2_S1": "Lentil", "Y2_S2": "Potato", "Y3_S1": "Lentil", "Y3_S2": "Potato"}` | `True` | `{"profit": 0.0, "soil": 0.0, "water": 0.0}` | `{"family_rotation_checked": true, "legume_window_seasons": 3, "one_crop_per_period": true, "passed": true, "static_compatibility_checked": true, "status": "checked", "violations": []}` |

CBC uses one thread and default tolerance; no random seed is applicable.
A rainfall-reduction scenario is unsupported by the
current scenario API and was not invented.

## Limitations and integrity

The objective weights and all MILP hard constraints are unchanged. Hypothetical scenario
parameters are sensitivities, not climate forecasts. A solver-feasible
plan only verifies the encoded mathematical constraints for these inputs;
it does not establish agronomic suitability or expected outcomes.

No real farm data were fabricated, no external data were downloaded, and
RL was not trained or enabled. Real yield/profit effects, water savings,
soil-health changes, forecasts, and policy performance remain unvalidated.
