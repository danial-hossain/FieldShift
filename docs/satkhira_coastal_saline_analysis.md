# Satkhira Coastal Saline Zone Analysis & MILP Margin Verification

## Overview
In coastal saline districts such as **Satkhira** (SW Bangladesh delta, 22.7185°N, 89.0705°E), agricultural planning is strictly bounded by:
1. **Rabi Dry Season Salinity**: Topsoil EC typically exceeds 4.0 dS/m between February and May due to upward capillary rise from shallow saline groundwater.
2. **Elevated Evaporative Demand & Pumping Costs**: High reference evapotranspiration ($ET_0$) during the dry winter and pre-monsoon requires deep extraction or heavy lifting, elevating fuel/electricity costs.
3. **Monoculture Boro Financial Vulnerability**: Traditional Boro rice requires 1,100+ mm of irrigation water, depressing yield under salinity and yielding an illustrative negative baseline net margin (-8,612 BDT/ha).

---

## MILP Per-Season Margin Table for Satkhira

Derived directly from the dynamic agronomic matrix and PuLP CBC MILP optimization using 25-year NASA POWER climatology and GPM IMERG calibrated precipitation.

### Balanced Strategy
| Period | Crop Name | Dynamic Yield (t/ha) | Market Price (BDT/kg) | Net Irrigation (mm) | Pumping / Input Cost (BDT/ha) | Net Margin (BDT/ha) | Agronomic Feasibility & Resilience |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Y1_S1** (Rabi) | **Sunflower** | 1.61 | 65.0 | 352.7 | 58,150 | **+46,500** | Highly salt-tolerant oilseed; replaces water-thirsty Boro. |
| **Y1_S2** (Kharif-1) | **Soybean** | 2.08 | 58.0 | 46.1 | 42,002 | **+78,638** | Medium legume; biological nitrogen fixation; low irrigation. |
| **Y1_S3** (Kharif-2) | **Rice (T. Aman)** | 3.50 | 28.0 | 190.6 | 76,932 | **+21,068** | Rainfed flood- & salinity-tolerant lowland monsoon paddy. |
| **Y2_S1** (Rabi) | **Soybean** | 1.14 | 58.0 | 410.7 | 50,840 | **+15,280** | Favorable salt tolerance; moderate water requirement. |
| **Y2_S2** (Kharif-1) | **Sesame** | 0.84 | 115.0 | 0.0 | 30,090 | **+66,510** | Heat- & drought-tolerant cash oilseed; zero net irrigation. |
| **Y2_S3** (Kharif-2) | **Rice (T. Aman)** | 3.50 | 28.0 | 190.6 | 76,932 | **+21,068** | Stable staple rice harvested before peak dry-season salinity. |

- **Plan Total Irrigation**: 595.4 mm/yr
- **Baseline Irrigation (Boro-Fallow-Aman)**: 1,296.8 mm/yr
- **Annual Water Savings**: **+701.4 mm/yr**
- **Baseline Net Margin**: **-8,612 BDT/ha**
- **Plan Net Margin**: **+124,532 BDT/ha** (Net Delta: **+133,144 BDT/ha**)

---

### Profit-Focused Strategy
| Period | Crop Name | Dynamic Yield (t/ha) | Market Price (BDT/kg) | Net Irrigation (mm) | Net Margin (BDT/ha) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Y1_S1** | **Mustard** | 1.48 | 70.0 | 285.1 | **+52,693** |
| **Y1_S2** | **Soybean** | 2.08 | 58.0 | 46.1 | **+78,638** |
| **Y1_S3** | **Rice (T. Aman)** | 3.50 | 28.0 | 190.6 | **+21,068** |
| **Y2_S1** | **Tomato** | 10.68 | 25.0 | 478.3 | **+138,950** |
| **Y2_S2** | **Mungbean** | 0.89 | 85.0 | 0.0 | **+45,735** |
| **Y2_S3** | **Rice (T. Aman)** | 3.50 | 28.0 | 190.6 | **+21,068** |

- **Plan Net Margin**: **+179,076 BDT/ha**
- **Annual Water Savings**: **+701.4 mm/yr**

---

## Agronomic Verdict & Rules Verification

1. **Kharif-2 (Monsoon) Selection**:
   - In all 4 priorities, the selected Kharif-2 crop is **T. Aman Rice** (`Rice`), utilizing seasonal rainfall (July–October) with supplemental irrigation of 190.6 mm. Aman rice is the established saline/flood-resilient monsoon crop for the Sundarbans coastal transition belt.
2. **Rabi (Winter) Selection**:
   - Sensitive legumes (Chickpea, Lentil) are marked strictly infeasible in `src/optimizer/dynamic_agronomy.py` (`COASTAL_SALINE_DISTRICTS` rule: $EC > 4\text{ dS/m}$).
   - The MILP selects salt-tolerant oilseeds (**Sunflower** or **Mustard**) and winter cash crops, completely eliminating the negative margin of dry-season Boro rice.
3. **Card Explanation**:
   - The UI surfaces a dedicated Coastal Saline Assessment card explaining why conservative planning reduces pumping risk and salinity accumulation compared to intensive monocultures.

