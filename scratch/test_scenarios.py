import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import pandas as pd
from src.data.crops import load_crop_knowledge
from src.state.field_state import FieldState
from src.optimizer.strategies import generate_rotation_strategies, DEFAULT_PRIORITY_PROFILES

crops = load_crop_knowledge()

def test_scenario(name, temp, ph, rainfall=500.0, irrigation=200.0, available_water=None):
    fs = FieldState(
        field_id="test_field",
        as_of_date=pd.Timestamp("2026-06-01"),
        latitude=23.8,
        longitude=90.4,
        temperature=temp,
        ph=ph,
        soil_moisture=0.25,
        rainfall=rainfall,
        field_size_ha=2.5,
    )
    features = {}
    if available_water is not None:
        features["available_water_mm"] = available_water
    elif irrigation is not None:
        features["available_water_mm"] = rainfall + irrigation
    
    res = generate_rotation_strategies(
        field_state=fs,
        crops=crops,
        features=features,
        priority_profiles=DEFAULT_PRIORITY_PROFILES,
        planning_periods=["Y1_S1", "Y1_S2", "Y2_S1", "Y2_S2", "Y3_S1", "Y3_S2"]
    )
    print(f"\n=== SCENARIO: {name} (T={temp}°C, pH={ph}, Water={features.get('available_water_mm')}mm) ===")
    for strat_name, strat in res["strategies"].items():
        rot = " -> ".join(strat["selected_crop_by_period"].values()) if strat.get("selected_crop_by_period") else "Infeasible/None"
        profit = strat.get("profit_component")
        water = strat.get("water_component")
        soil = strat.get("soil_component")
        score = strat.get("objective_value")
        p_str = f"BDT {profit:,.0f}" if profit is not None else "N/A"
        w_str = f"{water:.2f}" if water is not None else "N/A"
        s_str = f"{soil:.2f}" if soil is not None else "N/A"
        sc_str = f"{score:.3f}" if score is not None else "N/A"
        print(f"[{strat_name:16s}] Score: {sc_str} | Profit: {p_str} | Water: {w_str} | Soil: {s_str} | {rot}")

print("Testing Scenarios...")
test_scenario("A. Profit-Dominant Warm Loam", temp=26.0, ph=6.5, available_water=800)
test_scenario("B. Water-Constrained Arid Field", temp=30.0, ph=6.8, available_water=320)
test_scenario("C. Cool-Season Field", temp=18.0, ph=6.5, available_water=600)
test_scenario("D. Hot-Season High-Heat Field", temp=35.0, ph=6.8, available_water=700)
test_scenario("E. Acidic Soil Field", temp=26.0, ph=5.2, available_water=600)
test_scenario("F. Balanced Moderate Field", temp=24.0, ph=6.6, available_water=600)
