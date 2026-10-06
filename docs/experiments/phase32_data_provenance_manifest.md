# FieldShift Phase 32 — Provenance Manifest for Local Data Sources

Completion status: completed for repository provenance manifest generation and validation.

## 1. Objective

Phase 31 improved NASA POWER-specific provenance. Phase 32 extends that work to the repository's local source data by generating a machine-readable, conservative provenance manifest that records actual file-level evidence without inventing historical request metadata.

## 2. Files inspected and changed

Files inspected:

- `data/nasa_power/nasa_power_2025.csv`
- `data/nasa_power/nasa_power_lat23.8103_lon90.4125_20260831_20260929.csv`
- `data/smap/demo_smap.csv`
- `data/soil/demo_soil.csv`
- `data/field_history/demo_field_history.csv`
- `data/crops/crop_knowledge.csv`
- `data/source_registry.csv`
- `src/data/nasa_power.py`
- `tests/test_nasa_power.py`

Files changed:

- `src/data/provenance.py`
- `tests/test_provenance.py`
- `data/provenance_manifest.json`
- `docs/experiments/phase32_data_provenance_manifest.md`

## 3. What was implemented

A new module, `src/data/provenance.py`, provides:

- `build_source_manifest(path)`
- `build_provenance_manifest(base_directory)`
- `write_provenance_manifest(...)`
- `validate_provenance_manifest(...)`

The manifest records:

- file path and name;
- role (`nasa_power`, `smap`, `soil`, `crop`, `field_history`, `source_registry`, etc.);
- file hash;
- record count and column list;
- actual date coverage when a CSV contains a `date` or similar fields;
- synthetic/demo status when the file contains `data_status`/`source` labels;
- reconstructed filename coordinates for NASA POWER CSVs when available;
- explicit unknowns when the repository lacks original request metadata.

This implementation does not replace or rewrite the underlying CSV data. It simply documents what the repository evidence supports.

## 4. Provenance handling and safety rules

The manifest is intentionally conservative.

- It may reconstruct coordinates from a filename, but it labels them as `filename_reconstruction` and not original request metadata.
- It records unknown metadata as explicit nulls or explanatory strings rather than guessing.
- It does not claim that a bundled CSV proves a historical NASA request or a validated field measurement.
- It preserves the existing research boundary: these are environmental context files and synthetic/demo files, not crop-outcome evidence.

## 5. Validation checks

The manifest validator checks:

- file existence;
- hash consistency between the manifest and file contents;
- coverage mismatch detection between declared and actual `date` ranges;
- coordinate validity when reconstructed coordinates are present.

## 6. Test results

Executed command:

```powershell
.\.venv\Scripts\python.exe -m unittest tests.test_provenance tests.test_nasa_power tests.test_source_registry -v
```

Result:

- 34 tests ran
- all passed

Executed command:

```powershell
.\.venv\Scripts\python.exe -c "from src.data.provenance import write_provenance_manifest; print(write_provenance_manifest())"
```

Result:

- generated `data/provenance_manifest.json`
- validation content is structurally valid

## 7. Scientific limitations

This phase improves traceability but does not change the core research boundary:

- NASA POWER data remain environmental context, not crop outcomes.
- synthetic/demo soil, crop, field-history, and SMAP-like inputs remain illustrative rather than field-validated observations.
- the manifest is a repository-level provenance aid, not a claim of agronomic validation or ML/RL readiness.
