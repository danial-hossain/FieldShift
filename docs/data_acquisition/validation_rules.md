# Data-source validation rules

The standard-library validator in `src/data/source_registry.py` checks the
registry and acquisition tracker without changing application data or enabling
any AI component. It is a metadata-integrity check, not a scientific,
licensing, or provenance certification.

## Automated checks

The validator checks that:

1. Required CSV columns exist, the header contains no duplicate names, and
   each row has exactly the header's number of fields.
2. Registry `source_id` and tracker `request_id` values are non-empty and
   unique.
3. Every non-empty registry `evidence_class` and every registry
   `validation_status` belongs to the documented sets in
   [`source_registry_schema.md`](source_registry_schema.md).
4. Acquisition `status` belongs to the documented request-status set, and
   each acquisition `source_id` exists in the registry.
5. A request marked `verified` includes an actual response date, access
   conditions, license/agreement status, coverage, and units; website presence
   alone cannot pass this check.
6. The bundled demo source records retain `synthetic` classification and
   explicit demo/synthetic labels. Known satellite/environmental products
   retain `remote_observed`; SoilGrids remains `modelled_context`.
7. Unknown metadata can remain blank or explicitly pending; the validator
   does not fill defaults, infer licenses, assign coverage, or promote
   evidence classes.

The checked-in tracker intentionally leaves access terms, fees, coverage, and
units blank for pending requests. No request currently claims verified
acquisition.

## Manual review requirements

Automated checks cannot establish that a URL is official, a provider response
is authentic, a license permits the intended use, units or methods are
scientifically appropriate, a station/pixel represents a field, or an
observation is truly farm-specific. Before use:

* preserve source/product/version, retrieval time, coordinates or spatial
  footprint, native units, timestamps, processing steps, missingness, and
  uncertainty;
* record sampling/measurement method, depth, instrument or laboratory method,
  field/season identity, and consent for direct field evidence;
* retain original labels and separate `observed`, `remote_observed`,
  `modelled_context`, `recalled`, `inferred`, and `synthetic` records;
* inspect map/product vintage and licensing individually, particularly for
  legacy BARC/BADC layers and portal materials;
* do not represent illustrative crop economics, demo soil/history, or
  synthetic SMAP-like rows as measurements;
* do not use weather or satellite records as crop action/outcome evidence.

## Running the check

From the repository root:

```powershell
.\.venv\Scripts\python.exe -m src.data.source_registry
.\.venv\Scripts\python.exe -m unittest tests.test_source_registry -v
```

The command exits non-zero and prints all detected validation errors. Passing
means only that the checked-in metadata satisfies these structural safeguards;
it does not establish access approval, real farm data availability,
agronomic validity, or RL readiness.

## Pilot collection templates

The five files in `data/pilot_templates/` have independent schemas documented
in [`pilot_data_dictionary.md`](pilot_data_dictionary.md). Validate them with:

```powershell
.\.venv\Scripts\python.exe -m src.data.pilot_data
.\.venv\Scripts\python.exe -m unittest tests.test_pilot_data -v
```

The pilot validator checks exact headers, field counts, non-empty unique row
IDs, allowed provenance/status labels, synthetic-label consistency, consent
and collection-method references for directly observed/recalled partner
records, required source/method/entry-time metadata, ISO-form timestamps, and
field/season foreign keys. Populated numeric values must be finite; unambiguous
coordinate/area/depth/count bounds and value/unit pairs are checked, and
observed outcome/soil values require measurement/laboratory methods. Unit
strings are not checked against an exhaustive scientific unit catalogue, but
units cannot vary silently within the same measured outcome/analyte series.
These are structural safeguards, not scientific plausibility thresholds. It does not
validate consent approval/scope, identity, accuracy, unit compatibility,
ethics approval, or access rights. It only checks IDs within one current
dataset snapshot; repeated imports across runs and correction lineage are
not tracked.
Only blank template files are currently included; a passing check is not
evidence that a pilot has occurred.
