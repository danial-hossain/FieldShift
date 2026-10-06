# FieldShift Phase 31 — NASA POWER Reproducible Data Provenance

Completion status: completed for local provenance auditing and reproducible manifest generation.

## 1. Files inspected and changed

Files inspected:

- `src/data/nasa_power.py`
- `tests/test_nasa_power.py`
- `data/nasa_power/nasa_power_2025.csv`
- `data/nasa_power/nasa_power_lat23.8103_lon90.4125_20260831_20260929.csv`
- `data/source_registry.csv`
- `docs/experiments/phase29_sensitivity_report.md`
- `docs/experiments/phase30_evidence_verification.md`

Files changed:

- `src/data/nasa_power.py`
- `tests/test_nasa_power.py`
- `data/nasa_power/nasa_power_provenance_manifest.json`
- `docs/experiments/phase31_nasa_power_provenance.md`

## 2. What the repository can support directly

The project code and documentation establish the following:

- the NASA POWER API used by the project is the Daily Point API at `https://power.larc.nasa.gov/api/temporal/daily/point`;
- the project requests `community=AG` and the parameters `T2M`, `T2M_MAX`, `T2M_MIN`, `PRECTOTCORR`, `RH2M`, `WS2M`, and `ALLSKY_SFC_SW_DWN`;
- the project converts API missing values `-999` to `NaN` in `src.data.nasa_power._response_to_dataframe`;
- the local CSVs are environmental time-series snapshots and are not crop-yield or farm-outcome data.

The official NASA POWER documentation inspected at:

- https://power.larc.nasa.gov/docs/services/api/
- https://power.larc.nasa.gov/docs/services/api/temporal/daily/

confirms that the Daily API supports point requests in CSV/JSON format, with daily time-series environmental observations.

## 3. Metadata directly supported by existing evidence

For each checked-in NASA POWER CSV, the repository can directly support:

- source product name: NASA POWER Daily Point API;
- official API documentation URL: `https://power.larc.nasa.gov/docs/services/api/temporal/daily/`;
- actual date coverage from the CSV file itself;
- requested parameter names from the project code; this is code-level evidence, not evidence of a specific historical request;
- temporal aggregation: daily;
- missing-value handling: API `-999` is converted to `NaN` in the project pipeline;
- file SHA-256 hash for the checked-in CSV;
- coordinate reconstruction only when the filename contains `lat..._lon...` metadata.

The manifest records these values without claiming unresolved historical request metadata is authentic.

## 4. Metadata reconstructed from repository evidence

The project can reconstruct coordinates for the 2026 snapshot because its filename encodes the coordinates:

- `nasa_power_lat23.8103_lon90.4125_20260831_20260929.csv`

This yields:

- latitude = 23.8103
- longitude = 90.4125

This value is recorded as `filename_reconstruction`, and the manifest explicitly labels it as reconstructed metadata rather than original request metadata. The 2025 snapshot does not contain coordinates in its filename or file contents, so its latitude and longitude remain unknown in the repository evidence.

## 5. Metadata that remains unknown

For both existing local NASA POWER snapshots, the repository does not currently contain enough evidence to establish:

- original API request URL;
- exact requested start/end dates for a historical retrieval;
- retrieval timestamp;
- exact original latitude/longitude for the 2025 file;
- proof that a particular file is an unchanged download from a specific NASA request;
- any source-authentication record beyond project-level attribution.

This is why the manifest marks the provenance as `partial_repository_evidence_only` or `filename_reconstruction_only` rather than a verified historical acquisition record.

## 6. How to reproduce a future NASA POWER retrieval

Use the existing code path in `src/data/nasa_power.py`:

```python
from src.data.nasa_power import fetch_nasa_power, save_nasa_power_data

frame = fetch_nasa_power(
    latitude=23.8103,
    longitude=90.4125,
    start_date="2026-09-01",
    end_date="2026-09-30",
)
path = save_nasa_power_data(
    frame,
    latitude=23.8103,
    longitude=90.4125,
    start_date="2026-09-01",
    end_date="2026-09-30",
    output_directory="data/nasa_power",
)
```

A future retrieval should be saved with a new, clearly identified filename and a companion provenance record documenting the actual retrieval timestamp, API request URL, and any metadata that was available at the time of download. Do not overwrite or reattribute historical files without a documented trace.

## 7. How to validate the manifest

The project now includes a manifest validator in `src/data/nasa_power.py`:

- `build_nasa_power_manifest(csv_path)`
- `write_nasa_power_provenance_manifest()`
- `validate_nasa_power_manifest(manifest_or_path)`

Validation checks include:

- file existence;
- the existence of a valid `date` column;
- actual date coverage matching the CSV content;
- valid latitude/longitude values when present;
- ISO-like retrieval timestamps when a timestamp is supplied;
- consistent manifest-to-file path integrity.

## 8. Test results and limitations

Executed checks:

- `./.venv/Scripts/python.exe -m unittest tests.test_nasa_power tests.test_source_registry -v`
- Result: `Ran 29 tests in 0.474s` / `OK`

Additional manifest validation:

- `./.venv/Scripts/python.exe -c "from src.data.nasa_power import write_nasa_power_provenance_manifest, validate_nasa_power_manifest; path = write_nasa_power_provenance_manifest(); print(path); print(validate_nasa_power_manifest(path))"`
- Result: manifest generated successfully and validation returned `[]` (no errors).

Important limitations:

- A manifest can document what the repository evidence supports. It cannot prove the authenticity of a historical CSV if the original request record is absent.
- The repository still does not include original NASA POWER request metadata for the local snapshots.
- The environmental data remain a useful contextual dataset, not crop-yield or farm management evidence.
