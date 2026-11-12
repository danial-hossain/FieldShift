import os
os.environ["OFFLINE"] = "1"
import pandas as pd
from src.state.field_state import build_field_state
from src.data.crops import load_crop_knowledge
from src.compute.advisory_service import load_district_climate_data
from src.optimizer.dynamic_agronomy import build_dynamic_crop_season_matrix
import pulp

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

from src.optimizer.milp import optimize_rotation

# Let's inspect what happens with different allow_kharif2_fallow and bare_penalty
from unittest.mock import patch

def test_penalty(pen):
    with patch("src.optimizer.milp.pulp") as mock_pulp:
        pass

# Let's run optimize_rotation directly and print selected crops
opt = optimize_rotation(
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
print("Plan with current code:", opt["selected_crop_by_period"])

