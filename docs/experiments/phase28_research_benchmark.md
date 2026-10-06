# Phase 28 research-only benchmark

Run the reproducible hypothetical baseline, existing supported stress
scenarios, and one-at-a-time sensitivity checks from the repository root:

```powershell
.\.venv\Scripts\python.exe -m src.experiments.research_benchmark
```

Optional `--json-output PATH` and `--markdown-output PATH` write machine-readable
results or the rendered report section to caller-selected paths. The CLI does
not append to `output.txt`; the completed, verified report is appended only
after the phase's tests and checks finish.

## Experiment design

The runner loads only the bundled crop-knowledge table, verifies it is labelled
`synthetic`/`demo`, supplies a fixed synthetic `FieldState`, a fixed
1500 mm hypothetical seasonal-water input, and an explicitly empty field
history with the existing history schema. It runs six named planning periods
with a three-season legume interval and existing default objective weights
(profit 0.5, water 0.3, soil 0.2). It delegates what-if transformations to
`src.scenarios.stress_test.run_stress_tests` and planning to
`src.optimizer.milp.optimize_rotation`; optimizer logic and constraints are
not modified.

The supported scenario set is:

| Scenario | Existing transformation | Runner default |
| --- | --- | ---: |
| `normal` | Copy baseline without perturbation | None |
| `drought` | Change soil moisture by the configured delta; clamp at zero | `-0.08` m³/m³ |
| `heat` | Add the configured delta to each available temperature field | `+5.0` °C |
| `low_water` | Multiply explicit seasonal available water by a fraction | `0.60` of 1500 mm = 900 mm |

These are hypothetical input perturbations, not forecast values. The existing
scenario API does not support reducing rainfall, so no rainfall scenario is
implemented. Sensitivity values are heat delta `2/5/8` °C, low-water fraction
`0.8/0.6/0.4`, and drought moisture delta `-0.04/-0.08/-0.12` m³/m³; only one
parameter changes in each comparison.

The runner reports raw optimizer status, solver status, plan (or no plan),
components, requested/effective weights, provenance, and an independent
check of one assignment per period, adjacent crop-family constraints, legume
windows, and explicitly incompatible temperature/pH/water rules. Unknown
compatibility remains unknown and is not described as confirmed suitability.
Infeasible/non-solved runs are not marked as feasible and receive no passing
constraint check.

The independent check is scoped to the configured constraints exercised by
this fixture; it is not a replacement solver or a general MILP proof checker.
CBC runs with one thread and default tolerance. No randomness is used. Exact
results and environment details are recorded in `output.txt` after the run.

## Interpretation

NASA POWER CSVs are inventoried but not used as direct field measurements.
Their attribution is not independently authenticated by this workflow.
Bundled soil, crop knowledge, field history, and SMAP-like data are synthetic;
economic/crop metadata are illustrative. Objective-component values are
optimizer bookkeeping under those assumptions, not measured profit, water
use, or soil-health outcomes. Feasibility demonstrates only behavior under
the encoded rules and supplied inputs, not real-world agronomic validation.
No RL training is performed.

## Phase 29 sensitivity expansion

The same deterministic runner now includes systematic one-at-a-time
sensitivity for objective priorities, baseline seasonal-water assumptions,
and all three supported scenario parameters. The baseline remains six named
planning periods, three-season legume interval, objective weights
`profit=0.5`, `water=0.3`, `soil=0.2`, and hypothetical seasonal availability
of 1500 mm. No optimizer objective or constraint was changed.

| Parameter | Tested values | Comparison method |
| --- | --- | --- |
| `profit_weight`, `water_weight`, `soil_weight` | `0.0, 0.25, 0.5, 0.75, 1.0` each | Vary one normalized share; distribute the remainder in the baseline ratio of the other two weights. Each requested vector sums to one. |
| Baseline `available_water_mm` | `0, 300, 600, 900, 1200, 1500, 1800, 2400` | Re-run the existing optimizer with only the hypothetical seasonal-water availability changed. Zero can make all crop options incompatible; such no-plan statuses remain explicit. |
| Heat temperature delta | `2, 5, 8 °C` | Use the existing `heat` scenario API. |
| Drought soil-moisture delta | `-0.04, -0.08, -0.12 m³/m³` | Use the existing `drought` scenario API. |
| Low-water fraction | `0.8, 0.6, 0.4` of the fixed 1500 mm baseline | Use the existing `low_water` scenario API. |

Each sensitivity record reports optimizer/solver status, feasibility, the
selected plan or `null`, an independent encoded-constraint check, plan change
relative to the baseline, and objective-component changes as separate fields.
Objective component values are catalog-dependent optimization bookkeeping:
the profit proxy uses illustrative demo economics, water and soil components
are normalized over the supplied crop catalog, and normalization is not a
measurement. They are not measured farm profit, water savings, or soil-health
outcomes.

The benchmark solves two additional identical baseline cases and compares
status and plan exactly and available components within absolute tolerance
`1e-9`. It reports CBC version/platform, one solver thread, default solver
tolerance and that no RNG/seed is involved. Different solver/platform
versions may still change tie-breaking. Input sweeps reject non-finite,
negative, out-of-range, duplicate, or empty parameter lists. No-plan outputs
are never filled with a fallback rotation. NASA POWER files remain inventory
inputs only; synthetic/demo labels are unchanged.

Run with the same command. Use `--json-output PATH` and `--markdown-output
PATH` to save the expanded machine-readable results and Markdown report to
caller-selected paths. Phase 29's generated artifacts are
`docs/experiments/phase29_sensitivity_results.json` and
`docs/experiments/phase29_sensitivity_report.md`. The runner itself does not
append `output.txt`; that file is updated only after the requested test and
validation commands finish.
