import os
os.environ["OFFLINE"] = "1"
import pandas as pd
from src.state.field_state import build_field_state
from src.data.crops import load_crop_knowledge
from src.compute.advisory_service import load_district_climate_data
from src.optimizer.dynamic_agronomy import build_dynamic_crop_season_matrix
from src.optimizer.milp import optimize_rotation

crops_df = load_crop_knowledge()
power, _ = load_district_climate_data("chapainawabganj", offline=True)
if "date" in power.columns:
    power["date"] = pd.to_datetime(power["date"])

state = build_field_state(
    "rahim_field",
    24.62,
    88.55,
    power["date"].max(),
    power.tail(60),
    crop_knowledge=crops_df,
)
state.field_size_ha = 0.67
state.area_ha = 0.67
state.texture = "clay_loam"
state.district = "chapainawabganj"
state.seasonally_flooded = False

# Calibrate Rice expected_yield * 0.5 and price = 500 / 0.03732
rice_m = crops_df["crop"].str.casefold() == "rice"
crops_df.loc[rice_m, "expected_yield"] = crops_df.loc[rice_m, "expected_yield"] * 0.5
crops_df.loc[rice_m, "market_price"] = 500.0 / 0.03732

matrix = build_dynamic_crop_season_matrix(
    field_state=state,
    crops=crops_df,
    environmental_history=power,
    planning_periods=["Y1_S1", "Y1_S2", "Y1_S3", "Y2_S1", "Y2_S2", "Y2_S3"],
)
crop_season = matrix["crop_season_matrix"]

for p in ["Y2_S1", "Y2_S2", "Y2_S3"]:
    print(f"=== Period {p} ===")
    for c, entry in crop_season[p].items():
        if entry["is_feasible"]:
            print(f"  {c:12s}: margin={entry['dynamic_gross_margin_bdt_ha']:10.1f}, norm_profit={entry['normalized_profit_score']:6.3f}, norm_water={entry['normalized_water_score']:6.3f}, norm_soil={entry['normalized_soil_score']:6.3f}")

print("\n--- Running optimize_rotation with allow_kharif2_fallow=True ---")
opt_res = optimize_rotation(
    field_state=state,
    crops=crops_df,
    environmental_history=power,
    profit_weight=0.34,
    water_weight=0.33,
    soil_weight=0.33,
    national_need_weight=0.0,
    allow_kharif2_fallow=True,
    min_cereals_per_year=1,
    seasonally_flooded=False,
    fixed_crops_by_period={"Y1_S1": "Mustard", "Y1_S2": "Mungbean", "Y1_S3": "Rice"},
)
print("Plan:", opt_res["selected_crop_by_period"])

