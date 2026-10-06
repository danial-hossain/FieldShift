# FieldShift Bangladesh pilot data-collection protocol

**Status: preparation only.** FieldShift is a research prototype. This
protocol describes a possible small, consent-based pilot; no partner,
participant, agreement, farm record, or real measurement is established by
this document. Participation is not promised to improve yield, income, water
use, soil condition, or any other outcome. No funding, service, input, or
recommendation is promised.

Partner engagement and field collection are optional future work, not
prerequisites for the current research-only software and hypothetical-scenario
evaluation path documented in
[`research_only_readiness.md`](research_only_readiness.md).

This protocol is a starting point for review, not a substitute for institutional
research-ethics approval, applicable local legal review, partner agreements,
or an approved consent form. Do not recruit or collect data until the
responsible institution has approved the protocol and the partner has
authorized the work. Obtain consent in Bangla or the participant's preferred
language, using a comprehensible version approved by the responsible
institution.

## 1. Partner and farmer onboarding

1. Identify a prospective organization and a named institutional contact
   through an appropriate, verified route. Confirm the partner's authority to
   facilitate field access and who controls the records.
2. Discuss pilot scope before requesting farm records: intended research
   questions, number/type of fields to be considered, collection period,
   proposed measurements, data access roles, storage location, retention
   period, publication/de-identification approach, and withdrawal/correction
   process. Agree these details in writing. Do not treat the current registry
   route as an agreement.
3. Complete institutional ethics/privacy review and partner permission before
   farmer recruitment. Assign trained staff, sampling/measurement procedures,
   safety responsibilities, and an escalation contact.
4. Approach each farmer privately and without pressure from service providers,
   lenders, buyers, or authorities. Explain that participation is voluntary,
   declining has no effect on services or relationship, and the prototype
   does not promise benefits, payment, funding, or recommendations.
5. Provide time for questions and a copy of the approved consent information.
   Record consent only after comprehension and affirmative agreement. Consent
   should separately cover collection, linkage, analysis, sharing, and any
   publication or location disclosure that is proposed.
6. Enroll only fields and data types explicitly covered by permission. Record
   the approved consent version/date and a restricted consent reference, not
   signatures or personal details in analytic CSVs.

## 2. IDs, privacy, and access

* Generate random, non-identifying `partner_id`, `farm_id`, `field_id`,
  `season_id`, sample IDs, event IDs, and outcome IDs. Do not encode a name,
  phone number, national ID, village household number, or exact location in
  an ID.
* Do not place farmer names, phone numbers, national identity numbers,
  signatures, household addresses, or contact details in the provided
  templates. Keep the contact/re-identification key, if required, separately
  under the partner's control or in an access-controlled store not committed
  to this repository.
* Treat exact coordinates and field boundaries as sensitive. Collect only
  when necessary and consented. Restrict detailed boundary geometry; use
  coarser location in analysis or publication where feasible. Document the
  coordinate reference system and precision outside the generic template if
  boundary data are approved.
* Limit access to named, authorized project roles; use encrypted approved
  storage and transfer, access logs, and least privilege. Do not send raw
  records through personal email or public repositories.
* Before enrollment, specify a retention/deletion date and secure-backup
  process with the partner/institution. Do not retain identifiers longer
  than approved. Define how corrections are applied to raw and derived
  versions and how withdrawn records are excluded/deleted where still
  identifiable and legally/institutionally possible.
* Explain withdrawal limits honestly: already published aggregate results or
  irreversible de-identified summaries may not be retractable. Record a
  withdrawal/correction request in a restricted log and document its
  disposition; never silently edit the audit trail.

## 3. Collection procedures

Use the blank schemas in [`../../data/pilot_templates/`](../../data/pilot_templates/)
and the accompanying [data dictionary](pilot_data_dictionary.md). Keep the
original partner/source material unchanged in approved restricted storage;
work from a copy and preserve its provenance.

### Field registry

Assign pseudonymous IDs before recording linked data. Record the field area
and locality source/method, optional coordinates only if approved, coordinate
precision, and a restricted boundary reference rather than embedding sensitive
geometry in the registry. Record how every descriptive fact was obtained.

### Soil sampling and laboratory records

Agree analytes, sampling depth(s), timing, field sampling design, number and
placement of subsamples, compositing, replicate handling, sample labels,
transport/storage, and quality-control procedures before fieldwork. Use the
same documented protocol where comparison is intended. Keep samples linked
to field IDs and collection date/time without participant names.

Capture sample depth in centimetres, sampling method/design, analyte name,
laboratory identity, analytical method/instrument, native reported value and
unit, replicates, lab report reference, and lab-reported uncertainty. Confirm
lab record access and reuse terms separately. Never infer missing results,
convert a blank to zero, or present SoilGrids/remote estimates as a lab
measurement.

### Crop seasons and management

Record each field crop cycle separately, including crop/cultivar as reported,
planting and harvest dates (including whether dates are exact or recalled),
season label, planted area, crop status, and planting method. Record
management as dated events: irrigation source/method and measured volume if
available; input identity, applied quantity/unit and treated area; and other
relevant operations. Preserve farm-log/document/interview origin and date
precision. Do not infer a quantity from a recommendation or recollection.

### Outcomes

Record harvested yield, crop failure/status, quality, costs, revenue, and
other outcomes as separate components with field/season linkage. Document
harvested/measured area, sample count, measurement timing/window, weighing or
survey method, instrument, native unit, and uncertainty when available. For
money, record currency, cost/revenue category, price basis/date and whether
the value is documented or recalled. Do not calculate or label a composite
profit, reward, or policy score from incomplete components.

## 4. Provenance, units, timing, and missing values

For every row, classify its origin using `evidence_class`: directly measured
or documented field evidence (`observed`); remote/gridded/weather station
evidence (`remote_observed`); model prediction (`modelled_context`);
retrospective participant report (`recalled`); computed/inferred value
(`inferred`); or test/demo-generated value (`synthetic`). These classes must
not be collapsed. In particular, sensor/satellite-origin data are not direct
farm measurements, and recalled records are not contemporaneous measurements.

Keep the existing `data_status` field for compatibility with project data
readers, but use `evidence_class` to identify evidence origin. A status label
alone does not establish provenance. Every populated row must have a source
reference, collection/record time, and record method; directly observed and
recalled partner data also need an approved consent reference. Record
measurement time separately from entry time.

Use the source's original unit and state it explicitly. Record any conversion
as a separate documented transformation with original value/unit retained.
Use ISO dates/timestamps, retaining time-zone and date precision actually
known. Leave unavailable values blank and state why when known; use
`missingness_reason` and quality flags rather than zero or an assumed value.
Do not impute missing values during intake.

## 5. Intake, validation, review, and approved import

1. **Receive securely:** verify transfer authorization and consent scope;
   register the receipt in the restricted project log; retain the original
   read-only.
2. **Quarantine and minimize:** scan files using approved institutional
   procedures, remove unneeded direct identifiers from the working copy, and
   keep any linkage key separate. Do not commit raw or identifiable files.
3. **Check structure:** use the five blank CSV headers under
   `data/pilot_templates/`. Validate exact headers/row widths, unique IDs,
   evidence labels, consent/source references, dates, units, and cross-table
   keys. Preserve invalid rows and report findings; do not silently drop,
   repair, or coerce them.
4. **Review evidence:** a trained reviewer checks consent coverage, record
   provenance, method, source documents, measurement dates, unit consistency,
   plausibility flags, missingness, and partner corrections. Resolve
   discrepancies with the source; preserve the original and a documented
   correction history.
5. **Approve a version:** obtain the designated data steward/partner approval
   for the de-identified, scoped dataset and intended analysis. Record
   version, approvals, transformations, unresolved limitations, access
   restrictions, and retention deadline.
6. **Import only after approval:** map into existing input contracts in a
   separate, reviewed change. These templates do not currently plug directly
   into the application loaders. Preserve raw files, use an explicit mapping
   and validation report, and confirm provenance survives the import.
   Imported observations do not automatically establish historical
   evaluation, policy-training, or RL readiness.
7. **Monitor and close:** support participant/partner corrections and
   withdrawal requests, record dispositions, renew permissions if scope
   changes, and securely delete data at the agreed retention limit.

The current prototype's RL readiness gate and training behavior remain
unchanged. No collected pilot row should be used for RL training or presented
as validated policy performance without a separate evidence and ethics
review.

## 6. Unresolved before fieldwork

No partner or site is selected; no institutional approval, data agreement,
consent wording, recruitment plan, ethics determination, lab route, sampling
protocol, staff, budget, retention period, or field-data transfer mechanism
has been established. Resolve these with the responsible institution and
partner before any external outreach that implies enrollment or any data
collection. The accompanying email is a request to discuss feasibility only.
