# FieldShift Evidence & Method Code Audit (EV1)

Audited date: 2026-11-10
Audited against: `master` branch codebase

| Category | Technology / Dataset / Method | Status | File & Line Citation | Consumer Page(s) | Notes & Verification Details |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **NASA Satellite & Earth Data** | NASA POWER (MERRA-2 + CERES) | **ব্যবহৃত (Used)** | `src/climate/point_data.py:79` | Planner, Water, Climate, Stress, Overview | Daily agroclimatology (T2M, Tmax, Tmin, RH, Solar, Wind) fetched by point lat/lon and cached. |
| **NASA Satellite & Earth Data** | NASA GPM IMERG v07 | **ব্যবহৃত (Used)** | `src/compute/imerg.py:31`, `src/climate/point_data.py:302` | Planner, Water, Climate, Stress, Overview | 0.1° gridded daily satellite precipitation from `data/imerg/bd_imerg_daily.npz`. |
| **NASA Satellite & Earth Data** | NASA GRACE / GRACE-FO | **ব্যবহৃত (Used)** | `src/climate/point_data.py:440` | Climate, Water, Overview | JPL RL06.3M CRI mascon groundwater storage anomaly and Sen's slope regional trend. |
| **NASA Satellite & Earth Data** | SRTM (30m Elevation) | **আংশিক (Partial)** | `src/climate/point_data.py:530` | Climate | Elevation lookup for coordinates; returns "No data" on low plains / missing tiles. |
| **NASA Satellite & Earth Data** | SMAP L4 (Soil Moisture) | **পরিকল্পিত (Planned)** | `backend/app/main.py:941` | None (Roadmap) | `df = pd.DataFrame()` empty placeholder; planned for real satellite soil moisture assimilation. |
| **NASA Satellite & Earth Data** | MODIS NDVI | **পরিকল্পিত (Planned)** | `frontend/src/DataEvidenceView.jsx:42` | None (Roadmap) | Listed in system roadmap; no active operational satellite ingest in farmer-facing code. |
| **Soil & Market Public Data** | ISRIC SoilGrids 250m | **ব্যবহৃত (Used)** | `src/compute/field_enrichment.py:19` | Water, Planning | Clay, sand, silt %, pH, organic matter for pedotransfer hydraulic calculations. |
| **Soil & Market Public Data** | DAM / TCB / BBS Prices | **ব্যবহৃত (Used)** | `src/data/crops.py:12` | Market & Profit, Planner, Compare | Department of Agricultural Marketing, TCB, and BBS wholesale prices and variable costs. |
| **Soil & Market Public Data** | FAOSTAT Baseline | **আংশিক (Partial)** | `data/crops/crop_knowledge.csv:1` | Market & Profit | Baseline national/regional reference yield figures. |
| **Scientific & Agronomic Models** | FAO-56 Penman-Monteith ET0 | **ব্যবহৃত (Used)** | `src/compute/water_service.py:100` | Water, Planning | Daily reference crop evapotranspiration calculated via full Penman-Monteith physics (NOT Hargreaves). |
| **Scientific & Agronomic Models** | FAO-33 Ky Yield Response | **ব্যবহৃত (Used)** | `src/compute/climate_stress.py:541` | Climate Stress Test | Physical drought yield deficit: `(1 - Ya/Ym) = Ky * (1 - ETa/ETm)`. |
| **Scientific & Agronomic Models** | FAO-29 Maas-Hoffman Salinity | **ব্যবহৃত (Used)** | `src/compute/climate_stress.py:620` | Climate Stress Test | Coastal rootzone electrical conductivity yield loss: `Y% = 100 - b * (ECe - a)`. |
| **Scientific & Agronomic Models** | GDD (Growing Degree Days) | **ব্যবহৃত (Used)** | `src/compute/agro.py:168` | Crop Advisory, Climate | Phenological thermal heat accumulation calibrated to base 10°C (BRRI rice standard). |
| **Statistical Methods** | Mann-Whitney U / Sen's Slope / Mann-Kendall | **ব্যবহৃত (Used)** | `src/compute/agro.py:228`, `src/climate/point_data.py:488` | Crop Advisory, Climate | Non-parametric decadal monsoon onset shift test and GRACE groundwater depletion trend. |
| **Decision & Optimization** | PuLP CBC MILP Optimizer | **ব্যবহৃত (Used)** | `src/optimizer/milp.py:430` | Rotation Planner, Water, Compare | Exact 6-season multi-objective rotation integer linear programming solver. |
| **Decision & Optimization** | Adaptive Re-plan (Running Mean) | **ব্যবহৃত (Used)** | `src/optimizer/adaptive_replan.py:140` | Adaptive Replan, Farmer Harvest | Yield/price running-mean calibration loop triggering replan of remaining seasons. |
| **Decision & Optimization** | Q-learning (RL) | **পরীক্ষামূলক (Experimental)** | `src/rl/synthetic_q_learning.py:22` | Comparison Lab (Experimental) | Trained in synthetic gym simulation environment; benchmark comparison only, not optimizer. |
| **Decision & Optimization** | Gemini AI Assistant | **ব্যবহৃত (Used)** | `backend/app/main.py:2910` | AI Assistant | Real agronomist prompt grounded with active field environmental context. |

