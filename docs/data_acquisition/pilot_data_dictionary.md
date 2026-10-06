# Pilot data templates: dictionary and units

The blank UTF-8 CSV templates in `data/pilot_templates/` are collection
schemas, not evidence that a partner has enrolled or that measurements exist.
Every template currently contains a header only. Keep unknown values empty;
do not write zero, a fabricated estimate, or a made-up identifier to mean
"unknown." For a known missing value in an actual record, leave the value
blank and explain why in `missingness_reason`.

Use ISO 8601 timestamps with timezone offsets when known
(`YYYY-MM-DDTHH:MM:SS±HH:MM`) and ISO dates (`YYYY-MM-DD`) for date-only
events. Preserve the time zone as reported; do not infer a time from a date.
Numeric columns use a decimal point and no thousands separators. Units are
recorded explicitly for each value; do not mix units within a series without
recording the original unit.

## Shared provenance and quality fields

| Field | Definition |
| --- | --- |
| `evidence_class` | Required for each populated row: `observed`, `remote_observed`, `modelled_context`, `recalled`, `inferred`, or `synthetic`. For this pilot collection, direct partner measurements/documented records are `observed`; a farmer's retrospective report is `recalled`. Remote and modelled context should normally remain in their own source datasets and link by field/period, not be copied in as field measurements. |
| `data_status` | Project-compatible record status: `observed`, `synthetic`, `demo`, `planned`, or `missing`. It does not override or replace `evidence_class`; never infer direct measurement from `data_status` alone. |
| `source_id` | Registry key or approved source-specific key. For future partner records, assign a non-identifying source key only after permission and provenance are documented. The current `farm_field_partner_route` is a prospective route, not an enrolled partner. |
| `consent_record_id` | Reference to a separately secured consent/permission record; no names, signatures, phone numbers, or identity documents belong in these CSVs. Required for directly observed or recalled partner data. |
| `record_method` | How the record was obtained (e.g., instrument, signed farm log, document review, or interview/recollection). Be specific enough to review, without exposing personal identifiers. |
| `recorded_by_role` | Collector role, not a person's name. |
| `recorded_at` | Time this record was entered; ISO 8601 with offset where available. It is distinct from the measurement/event time. |
| `missingness_reason` | Reason for an unknown/unrecorded value, if known. Leave blank when not applicable or unknown. |
| `quality_flags` | Optional semicolon-separated flags for review; never silently repair a flagged value. |

## `field_registry.csv`

One row per pseudonymous field. Do not put farmer names, phone numbers,
national IDs, exact household addresses, or unrestricted boundary geometry in
the pilot registry. Maintain any re-identification/contact key separately
under the partner's control or in another access-controlled location.

| Field | Definition / unit |
| --- | --- |
| `field_id` | Stable random or otherwise non-identifying field key. |
| `partner_id`, `farm_id` | Pseudonymous keys; no direct identity. |
| `admin_area` | Agreed administrative locality/area label; limit precision if location risk requires. |
| `field_area_ha` | Field area in hectares; record source/method in `record_method`. |
| `centroid_latitude_deg`, `centroid_longitude_deg` | Optional WGS84 decimal degrees; sensitive location data. Collect only when needed and permitted. |
| `coordinate_precision_m` | Approximate coordinate precision in metres; do not imply survey-grade accuracy. |
| `boundary_reference` | Pointer to separately secured boundary file, if consented and collected; not geometry itself. |
| `boundary_access_restricted` | `true`/`false`; whether detailed geometry is restricted. |
| `field_description` | Non-identifying notes useful for field matching. |

## `soil_observations.csv`

One row per field sample/analyte/replicate. Keep repeated dates and replicates
as separate rows; retain the laboratory's reported values and units.

| Field | Definition / unit |
| --- | --- |
| `soil_observation_id` | Unique sample/analyte result key. |
| `field_id` | Key from the field registry. |
| `sample_datetime` | Sample collection date/time, ISO 8601; preserve date precision actually known. |
| `sample_depth_top_cm`, `sample_depth_bottom_cm` | Sample interval depth in centimetres. |
| `sampling_method`, `sampling_design` | Protocol and spatial/sample selection method. |
| `replicate_id` | Lab or field replicate identifier, if applicable. |
| `analyte` | Lab-reported analyte name (e.g. pH, available N, organic carbon, salinity/EC, texture, moisture); do not collapse unlike methods. |
| `analyte_value`, `unit` | Lab value and its native reported unit. pH is unitless; record units for other analytes. |
| `laboratory_id`, `lab_method` | Non-personal lab identifier and analytical method/instrument. |
| `lab_report_reference` | Restricted document reference, not the report with personal data embedded. |
| `measurement_uncertainty`, `uncertainty_unit` | Laboratory-reported uncertainty and unit, if supplied. |

## `crop_seasons.csv`

One row per field crop season/crop cycle. Use distinct season IDs even if crop
names repeat.

| Field | Definition / unit |
| --- | --- |
| `season_id` | Stable pseudonymous crop-season key. |
| `field_id` | Key from the field registry. |
| `crop_common_name`, `crop_scientific_name`, `cultivar`, `crop_family` | As reported/identified; leave unknown taxonomy blank rather than guessing. |
| `planting_date`, `harvest_date` | Actual reported/recorded dates in ISO `YYYY-MM-DD`; unknown dates remain blank. |
| `season_label` | Partner's/local season label; document local interpretation. |
| `planted_area_ha` | Area planted in hectares. |
| `crop_status` | e.g. standing, harvested, failed, abandoned; preserve the partner's source terminology in notes if mapped. |
| `planting_method` | Method/documented operation, not a recommendation. |
| `previous_crop_reported` | Previous crop as reported; history source and confidence belong in provenance/quality notes. |

## `management_events.csv`

One row per dated operation/input/irrigation event. Record separate events
separately; do not infer application quantities from recommendations.

| Field | Definition / unit |
| --- | --- |
| `event_id` | Unique event key. |
| `field_id`, `season_id` | Field and, when known, crop-season keys. |
| `event_datetime` | Event date/time in ISO 8601; preserve uncertainty/date-only precision. |
| `event_type` | Controlled/local event type such as irrigation, fertilizer, pesticide, planting, tillage, or other; document local vocabulary. |
| `material_or_operation`, `product_name`, `active_ingredient` | Operation/material/product as recorded; do not infer active ingredient. |
| `quantity`, `quantity_unit` | Applied quantity and explicit original unit. |
| `area_treated_ha` | Area receiving the operation in hectares. |
| `water_volume_m3` | Irrigation water volume in cubic metres, only if measured/documented. |
| `irrigation_source`, `irrigation_method` | Source and delivery method as reported. |
| `duration_min` | Irrigation/operation duration in minutes, if recorded. |
| `operator_role` | Role only, no worker name or personal identifier. |

## `outcome_measurements.csv`

One row per measured or reported outcome component. Keep yield, quality,
failure, cost, revenue, and soil-health results distinct; identify whether
values are measured or recalled via `evidence_class` and record their methods.
Never calculate a "profit" or policy reward from incomplete component data.

| Field | Definition / unit |
| --- | --- |
| `outcome_id` | Unique outcome record key. |
| `field_id`, `season_id` | Field and crop-season keys. |
| `outcome_type` | Component measured/reported (e.g. harvested yield, crop failure, input cost, sale revenue, grain quality, soil indicator); not a composite performance score. |
| `outcome_value`, `outcome_unit` | Numeric value and explicit unit; use blank when missing, not zero. |
| `measurement_datetime` | Measurement/record date-time; distinct from the outcome window. |
| `observation_window_start`, `observation_window_end` | Period represented by the measurement. |
| `measured_area_ha`, `sample_count` | Area sampled/harvested in hectares and number of samples, where applicable. |
| `measurement_method`, `measurement_instrument` | Method and instrument, if applicable. |
| `price_basis`, `currency`, `cost_category` | Basis/date or market point for financial amounts, ISO currency code (e.g. BDT only when verified), and cost category. Do not assume a price basis. |
| `linked_event_id` | Related management event key, when a genuine linkage exists. |
| `lab_or_document_reference` | Restricted source document reference. |
| `measurement_uncertainty`, `uncertainty_unit` | Reported uncertainty, if supplied. |

## Cross-table keys and integrity

`field_id` in all non-registry templates must reference a field registry row;
`season_id` in management/outcome rows must reference a crop-season row when
provided. Keep primary keys unique. Preserve raw values separately from any
normalized values and record every unit conversion. A record should not enter
analysis until permission, evidence class, source, timing, units, and quality
flags have been reviewed.
