# FieldShift data source map

**Reviewed: 2026-10-03.** This map describes provider/product evidence and
repository files separately. An institutional website or product page does
not prove that a requested dataset is accessible, current, licensed for reuse,
or fit for a particular field. The row-level machine-readable record is
[`data/source_registry.csv`](../../data/source_registry.csv); requests and
verification actions are tracked separately in
[`data/acquisition_log.csv`](../../data/acquisition_log.csv).

## Evidence categories and sources

| Registry ID | Category and established facts | Availability and use boundary |
| --- | --- | --- |
| `nasa_power_daily_point_api` | NASA POWER Daily Point API; documented in the code and project README. Its requested variables are daily processed environmental data. | Remote/environmental evidence, not a direct farm measurement. The API can return data for a supplied point and period; a request does not establish field-scale representativeness. |
| `local_nasa_power_2025`, `local_nasa_power_2026_aug_sep` | Two NASA POWER-attributed CSV snapshots are bundled. The first has 365 daily rows for 2025; the second has 30 rows from 2026-08-31 through 2026-09-29 and two missing solar-radiation values. | They are `remote_observed`, not crop outcomes or farm actions. Original request manifests are absent, so coordinates/date lineage are not independently verified for the 2025 file; filename coordinates do not establish field boundaries for the later file. |
| `nasa_smap_soil_moisture` | NASA SMAP is a satellite soil-moisture product family; NASA identifies ASF and NSIDC distribution routes. Products have differing processing levels and spatial support. | No SMAP retrieval is bundled. Select and verify a specific product, version, access route, and terms before use. Satellite-derived evidence is not a direct field soil-moisture measurement. |
| `local_smap_demo_csv` | The repository contains three synthetic, SMAP-like demonstration records. | `synthetic`; explicitly not NASA SMAP and not field evidence. |
| `soilgrids_global_predictions` | ISRIC describes SoilGrids as 250 m global modelled soil predictions for 14 properties at six standard depth intervals, with prediction uncertainty; its stated license is CC BY 4.0. | `modelled_context`, never field truth. Attribute ISRIC and cite the selected product/version. Product-property units/vintages and current service/API endpoint availability are not established here; do not assume an endpoint is available. |
| `sentinel_2_data` | Sentinel-2 satellite data are accessed through the Copernicus Data Space Ecosystem (CDSE). CDSE terms distinguish Sentinel data governed by the Sentinel Data Legal Notice from other portal materials. | `remote_observed`, not direct farm measurements. Review the applicable Sentinel Data Legal Notice and the selected product's terms; the notice itself and product-specific conditions were not independently reviewed in this audit. |
| `copernicus_dataspace_portal_materials` | CDSE portal terms apply to website/portal materials separately from Sentinel data. | Do not apply Sentinel data terms to other portal content. Recheck current terms before copying or reusing portal materials. |
| `srdi_soil_information_portal` | SRDI is an identified institutional source. | A portal's existence or institutional homepage does not establish availability of a particular soil layer. Verify product, vintage, scale, access, reuse terms, and fitness independently. |
| `srdi_laboratory_route` | Separate prospective route for laboratory services and records. | Portal availability is not evidence that specific laboratory services are available. Analytes, methods, fees, turnaround, record access, and permission to reuse laboratory records remain unverified. |
| `barc_spatial_data_route` | BARC is an identified institutional source. | For every requested layer, independently verify current availability, vintage/date, scale, licensing, and fitness. Explicitly flag legacy datasets and dates; no requested layer is verified. |
| `badc_irrigation_maps`, `badc_salinity_maps` | Separate candidate routes for historical irrigation and salinity maps/reports from BADC. | Record the title and vintage of each map/report individually. Availability, scale, and terms are pending. Historical maps are not current field measurements, water allocations, or field irrigation records. |
| `bmd_station_data_candidate` | BMD is an identified institutional source. | **Institutional source identified; exact dataset, access route, temporal coverage, fees and reuse rights pending verification.** A reachable institutional website does not verify a station product or access. |
| `bari_agronomic_references`, `brri_agronomic_references`, `dae_extension_material_candidate` | Institutional candidates for crop and extension references. | No individual publication is established. Verify its date, scope, underlying evidence, geographic applicability, availability, and reuse terms before using a parameter. |
| `farm_field_partner_route` | Prospective partner route for measured field/lab observations, management logs, and harvest outcomes. | No partner, agreement, or field records are established. Keep partner-provided measurements distinct from remote, modelled, recalled, inferred, or synthetic evidence. |
| `local_soil_demo_csv`, `local_crop_knowledge_demo_csv`, `local_field_history_demo_csv` | Bundled local soil, crop-knowledge, and field-history CSVs. | These are explicitly `synthetic` demo inputs, not measured local soil, authoritative crop facts, or observed farm history. Crop economic figures are illustrative. |

## Provider facts and policy boundaries

NASA ESDIS states that data from NASA-led missions are provided under CC0
unless otherwise marked with a restriction or license. Cite the selected
dataset and acknowledge NASA; this statement is not a blanket license for
third-party or non-NASA data. Check product-specific terms, especially when
data products incorporate other sources. The project has not retrieved SMAP
data.

The SoilGrids product page states CC BY 4.0, 250 m predictions, six standard
depth intervals, 14 properties, and quantified uncertainty. Those metadata do
not make a prediction a field observation and do not establish that every
download or API endpoint is currently operational.

CDSE's terms page says Sentinel data are governed by the Sentinel Data Legal
Notice and treats other website/portal materials separately. The terms page
was reviewed; the linked Sentinel notice and product-specific terms still need
review for the selected data. Do not apply Sentinel data terms to portal text,
images, or other materials.

Institutional sites for BMD, BARC, BADC, SRDI, BARI, BRRI, and DAE were
reachable during review. This verifies institutional source identity only,
not a specific dataset, laboratory service, layer, access approval, fee,
coverage, license, or permission to reuse records. All such claims remain
product-specific verification work.

## Official links reviewed

All links below were checked on 2026-10-03. Site availability does not establish
dataset access.

* [NASA ESDIS data-use guidance](https://www.earthdata.nasa.gov/learn/use-data/data-use-policy) — redirects to current NASA ESDIS data-use guidance.
* [NASA POWER Daily Point API](https://power.larc.nasa.gov/api/temporal/daily/point) and [API documentation](https://power.larc.nasa.gov/docs/services/api/).
* [NASA SMAP data](https://smap.jpl.nasa.gov/data/).
* [ISRIC SoilGrids](https://www.isric.org/explore/soilgrids).
* [Copernicus Data Space terms](https://dataspace.copernicus.eu/terms-and-conditions). Sentinel Data Legal Notice applicability is product-specific and pending review.
* [BMD](https://bmd.gov.bd/), [BARC](https://barc.gov.bd/), [BADC](https://badc.gov.bd/), [SRDI](https://srdi.gov.bd/), [BARI](https://bari.gov.bd/), [BRRI](https://brri.gov.bd/), and [DAE](https://dae.gov.bd/) institutional sites.

## Repository evidence and current limits

The two local POWER snapshots and three-row SMAP-like demo were checked against
their CSVs. The crop, soil, and field-history examples are labelled synthetic
in their bundled files. No bundled farm-partner records, lab results, field
sensor observations, or measured harvest outcomes were established. In
particular, the synthetic SMAP-like file is not satellite evidence. Remote
environmental values cannot establish crop action/outcome linkage or RL
readiness.

Current access-verification work is pending for BMD station data, SRDI lab
services and record reuse, BARC layers, BADC irrigation/salinity maps, and
partner agreements and prospective collection. See the acquisition tracker;
no item is marked verified merely because a website exists.
