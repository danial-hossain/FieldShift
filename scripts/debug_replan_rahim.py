import os
import sys
sys.path.insert(0, ".")
os.environ["OFFLINE"] = "1"
import pandas as pd
from src.state.field_state import build_field_state
from src.data.crops import load_crop_knowledge
from src.compute.advisory_service import load_district_climate_data
from src.optimizer.adaptive_replan import run_adaptive_replan

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

# 1: Mustard 5.0 (normal)
res1 = run_adaptive_replan(
    field_state=state,
    environmental_history=power,
    completed_seasons=[{"crop": "Mustard", "yield_maund_bigha": 5.0, "sale_price_bdt_maund": 3200, "outcome": "normal"}],
    priority="balanced",
)
print("1: Mustard 5.0:", res1["new_plan"]["sequence"], "profit:", int(res1["new_plan"]["total_profit_bdt"]))

# 1: Mustard 2.0 (poor)
res2 = run_adaptive_replan(
    field_state=state,
    environmental_history=power,
    completed_seasons=[{"crop": "Mustard", "yield_maund_bigha": 2.0, "sale_price_bdt_maund": 3200, "outcome": "poor"}],
    priority="balanced",
)
print("1: Mustard 2.0:", res2["new_plan"]["sequence"], "profit:", int(res2["new_plan"]["total_profit_bdt"]))

# 1: Mustard 0 (failed)
res3 = run_adaptive_replan(
    field_state=state,
    environmental_history=power,
    completed_seasons=[{"crop": "Mustard", "yield_maund_bigha": 0.0, "sale_price_bdt_maund": 3200, "outcome": "failed"}],
    priority="balanced",
)
print("1: Mustard 0 (failed):", res3["new_plan"]["sequence"], "profit:", int(res3["new_plan"]["total_profit_bdt"]))

# 3: ... Aman rice 15 (normal)
res4 = run_adaptive_replan(
    field_state=state,
    environmental_history=power,
    completed_seasons=[
        {"crop": "Mustard", "yield_maund_bigha": 5.0, "sale_price_bdt_maund": 3200, "outcome": "normal"},
        {"crop": "Mungbean", "yield_maund_bigha": 4.0, "sale_price_bdt_maund": 3500, "outcome": "normal"},
        {"crop": "Rice", "yield_maund_bigha": 15.0, "sale_price_bdt_maund": 1100, "outcome": "normal"},
    ],
    priority="balanced",
)
print("3: Aman rice 15 (normal):", res4["new_plan"]["sequence"], "profit:", int(res4["new_plan"]["total_profit_bdt"]))

# 3: ... Aman rice 7 (poor)
res5 = run_adaptive_replan(
    field_state=state,
    environmental_history=power,
    completed_seasons=[
        {"crop": "Mustard", "yield_maund_bigha": 5.0, "sale_price_bdt_maund": 3200, "outcome": "normal"},
        {"crop": "Mungbean", "yield_maund_bigha": 4.0, "sale_price_bdt_maund": 3500, "outcome": "normal"},
        {"crop": "Rice", "yield_maund_bigha": 7.0, "sale_price_bdt_maund": 1100, "outcome": "poor"},
    ],
    priority="balanced",
)
print("3: Aman rice 7 (poor):", res5["new_plan"]["sequence"], "profit:", int(res5["new_plan"]["total_profit_bdt"]))

# 3: ... Aman rice 0 (failed)
res6 = run_adaptive_replan(
    field_state=state,
    environmental_history=power,
    completed_seasons=[
        {"crop": "Mustard", "yield_maund_bigha": 5.0, "sale_price_bdt_maund": 3200, "outcome": "normal"},
        {"crop": "Mungbean", "yield_maund_bigha": 4.0, "sale_price_bdt_maund": 3500, "outcome": "normal"},
        {"crop": "Rice", "yield_maund_bigha": 0.0, "sale_price_bdt_maund": 1100, "outcome": "failed"},
    ],
    priority="balanced",
)
print("3: Aman rice 0 (failed):", res6["new_plan"]["sequence"], "profit:", int(res6["new_plan"]["total_profit_bdt"]))

# 3: ... Aman rice 15 but price 500 BDT/maund
res7 = run_adaptive_replan(
    field_state=state,
    environmental_history=power,
    completed_seasons=[
        {"crop": "Mustard", "yield_maund_bigha": 5.0, "sale_price_bdt_maund": 3200, "outcome": "normal"},
        {"crop": "Mungbean", "yield_maund_bigha": 4.0, "sale_price_bdt_maund": 3500, "outcome": "normal"},
        {"crop": "Rice", "yield_maund_bigha": 15.0, "sale_price_bdt_maund": 500, "outcome": "normal"},
    ],
    priority="balanced",
)
print("3: Aman rice price 500:", res7["new_plan"]["sequence"], "profit:", int(res7["new_plan"]["total_profit_bdt"]))

# 1: Mustard 5.0 + water "none"
res8 = run_adaptive_replan(
    field_state=state,
    environmental_history=power,
    completed_seasons=[{"crop": "Mustard", "yield_maund_bigha": 5.0, "sale_price_bdt_maund": 3200, "outcome": "normal"}],
    water_availability="none",
    priority="balanced",
)
print("1: Mustard 5.0 + water 'none':", res8["new_plan"]["sequence"], "profit:", int(res8["new_plan"]["total_profit_bdt"]))

# 1: Mustard 5.0 + water "rainfed"
res9 = run_adaptive_replan(
    field_state=state,
    environmental_history=power,
    completed_seasons=[{"crop": "Mustard", "yield_maund_bigha": 5.0, "sale_price_bdt_maund": 3200, "outcome": "normal"}],
    water_availability="rainfed",
    priority="balanced",
)
print("1: Mustard 5.0 + water 'rainfed':", res9["new_plan"]["sequence"], "profit:", int(res9["new_plan"]["total_profit_bdt"]))
