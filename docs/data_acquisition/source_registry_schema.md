# Data source registry schema

The registry describes distinct products, services, source routes, and local
datasets. It is metadata, not evidence that a product has been acquired.
Keep sources with different access conditions or licenses in separate rows.
The source map is [`source_map.md`](source_map.md); validation expectations are
in [`validation_rules.md`](validation_rules.md).

## Registry fields

`data/source_registry.csv` uses UTF-8 CSV with a header row. One record denotes
one distinct source/product/service/route/dataset.

| Field | Meaning |
| --- | --- |
| `source_id` | Stable, unique machine-readable key referenced by the acquisition log and application metadata. |
| `provider` | Organization or repository responsible for the source. |
| `product_name` | Product, service, dataset, or clearly stated candidate route. |
| `product_version` | Version/vintage when established; otherwise blank or explicitly pending. |
| `evidence_class` | Evidence classification below; blank is permitted for a source route or portal material that is not itself an evidence dataset. |
| `access_url` | Verified official URL when available; otherwise blank. Do not invent URLs. |
| `access_method` | Known access path; distinguish a documented API from a candidate contact route. |
| `spatial_resolution` | Native spatial support, if documented for the specific product. |
| `temporal_resolution` | Native time step/support, not an assumed refresh rate. |
| `coverage_start`, `coverage_end` | Verified temporal coverage of the particular product or bundled file; blank when unknown. |
| `update_frequency` | Documented update cadence; blank when unknown. |
| `native_units` | Units in the original product, not converted application units; blank when unknown. |
| `license` | Product-specific license or terms. Keep distinct products and portal materials separate. Use `pending_verification` when applicable terms are unresolved. |
| `attribution` | Required or recommended credit, if verified. |
| `retrieved_at` | Retrieval timestamp for the specific data product, not the website review date. Blank if no retrieval is recorded. |
| `validation_status` | Status of the source/product metadata and/or bundled data as listed below. |
| `allowed_uses` | Known permitted purpose/boundary, not an access approval. |
| `known_limitations` | Spatial/temporal, quality, representativeness, uncertainty, licensing, or lineage limitations. |
| `verification_notes` | What was actually checked and what remains unknown. |
| `last_reviewed` | Date source metadata were reviewed, in ISO `YYYY-MM-DD` format, when known. |

Unknown values should be blank or marked explicitly as
`pending_verification`; do not substitute assumed values. Free-text fields
should state pending status when they describe unresolved access, coverage,
fees, license, or provenance.

## Evidence classes

* `observed`: directly measured or documented field evidence, with method and
  source recorded. Do not use this for a gridded product merely because its
  underlying instrument measures a physical quantity.
* `remote_observed`: satellite, gridded environmental-service, or weather
  station observations/products with source/product and spatial/temporal
  support recorded. This never implies direct measurement at a farm field.
* `modelled_context`: model predictions or model-derived regional context,
  such as SoilGrids.
* `recalled`: retrospective reports or recollections, explicitly marked as
  such.
* `inferred`: derived/inferred values not directly observed.
* `synthetic`: demo or test-generated values.

These registry classifications complement existing application fields such
as `source` and `data_status`; they do not redefine or replace those fields.
Never promote `synthetic`, `modelled_context`, or `remote_observed` evidence
to observed field evidence by relabelling it.

## Registry validation statuses

The validator accepts these values for `validation_status`:

* `pending_verification` — source-specific product/access/terms or other
  metadata are not established.
* `institution_verified` — the institution/source identity was checked; this
  does not mean a particular product is available.
* `metadata_verified` — cited product/policy metadata were checked; does not
  imply that data were retrieved.
* `schema_validated` — the bundled file's expected shape/labels were checked;
  not a provenance guarantee.
* `data_validated` — a specific dataset's values and provenance were checked
  against documented criteria. This status is not currently a claim of
  agronomic validity.

The acquisition log has a separate `status` vocabulary:
`not_started`, `requested`, `pending_response`, `verified`, `blocked`, and
`not_available`. `verified` means the acquisition item was confirmed; it must
not be inferred from an institution's web presence.

## Acquisition log fields

`data/acquisition_log.csv` tracks requests and verification tasks, not data
observations. Its `source_id` must reference a registry record.

| Field | Meaning |
| --- | --- |
| `request_id` | Unique key for a request or verification task. |
| `source_id` | Corresponding registry key. |
| `requested_product` | Specific product, service, metadata, or agreement details to verify. |
| `request_date`, `response_date` | Actual request/response dates; blank before those events. |
| `contact_or_url` | Verified contact route or official URL; blank if unknown. |
| `status` | Acquisition status from the allowed values above. |
| `access_conditions`, `fees`, `license_or_agreement` | Confirmed conditions only; leave blank until established. |
| `coverage_confirmed`, `units_confirmed` | Confirmed scope and units only; otherwise blank. |
| `notes` | Evidence of actions taken and response details. |
| `next_action` | Concrete follow-up step; do not imply that it has occurred. |

## Source-specific policy notes

NASA ESDIS states that data from NASA-led missions are CC0 unless otherwise
marked with a restriction or license. This does not apply as a blanket rule to
third-party/non-NASA data; verify product-specific terms and retain citation
and NASA acknowledgement. Sentinel data are distinct from CDSE website/portal
materials; review the applicable Sentinel Data Legal Notice and separate
portal terms. SoilGrids predictions require CC BY 4.0 attribution and retain
their model uncertainty; availability of a particular API endpoint is not
assumed.
