import requests
import json
import pandas as pd
from pprint import pprint

BASE_URL = "http://127.0.0.1:8000"

# 1. Authenticate as Dani
session = requests.Session()
login_res = session.post(f"{BASE_URL}/api/auth/login", json={
    "email": "danialhossain2022@gmail.com",
    "password": "12345678"
})
assert login_res.status_code == 200, f"Login failed: {login_res.text}"

def run_workflow_for_field(field_id=58, **overrides):
    payload = {
        "field_id": field_id,
        "mode": "live" if overrides.get("latitude") or overrides.get("longitude") else "live",
        "start_date": "2026-08-31",
        "end_date": "2026-09-29",
        "priority": "profit",
        "season": "dry",
        "include_history": True,
        "counterfactual_rainfall_delta_mm": 50.0
    }
    payload.update(overrides)
    res = session.post(f"{BASE_URL}/api/workflow", json=payload)
    if res.status_code != 200:
        raise RuntimeError(f"Workflow error {res.status_code}: {res.text}")
    return res.json()["summary"]

def extract_key_metrics(summary):
    fs = summary.get("field_state", {})
    ml = summary.get("ml", {})
    unc = ml.get("uncertainty", {})
    plan = summary.get("planning", {}).get("selected_strategy_result", {})
    crops = plan.get("selected_crop_by_period", {})
    rl = summary.get("rl", {})
    sim_rl = rl.get("simulation_trained_policy", {})
    stress = summary.get("stress_test", {}).get("scenarios", {})
    xai = summary.get("xai", {}).get("ml_explanation", {})
    top_contrib = [f"{c['feature']}({c['attributed_contribution']:+.2f})" for c in xai.get("top_contributors", [])[:3]]
    cf = summary.get("counterfactual") or {}

    return {
        "field_id": fs.get("field_id"),
        "coords": f"{fs.get('latitude')}, {fs.get('longitude')}",
        "area_ha": fs.get("field_size_ha"),
        "soil_texture": fs.get("soil_texture"),
        "organic_matter": fs.get("organic_matter_percent"),
        "irrigation_cap": fs.get("irrigation_capacity_mm"),
        "prev_crop": fs.get("previous_crop"),
        "ml_yield_t_ha": round(ml.get("prediction_t_ha", 0), 4),
        "ml_total_prod_tons": ml.get("total_production_tons"),
        "ml_range": f"{unc.get('lower', 0):.2f} - {unc.get('upper', 0):.2f}",
        "milp_obj": round(plan.get("objective_value", 0), 4),
        "milp_profit_bdt": plan.get("profit_component"),
        "milp_water_mm": plan.get("water_component"),
        "milp_soil_score": plan.get("soil_component"),
        "y1_s1": crops.get("Y1_S1"),
        "y1_s2": crops.get("Y1_S2"),
        "y2_s1": crops.get("Y2_S1"),
        "y2_s2": crops.get("Y2_S2"),
        "y3_s1": crops.get("Y3_S1"),
        "y3_s2": crops.get("Y3_S2"),
        "rl_action": sim_rl.get("selected_action") or rl.get("deterministic_baseline", {}).get("action"),
        "stress_normal_compat": stress.get("normal", {}).get("compatibility", {}).get("Maize", {}).get("overall_status"),
        "stress_drought_compat": stress.get("drought", {}).get("compatibility", {}).get("Maize", {}).get("overall_status"),
        "xai_top_3": ", ".join(top_contrib),
        "cf_delta": round(cf.get("delta_prediction_t_ha", 0), 4) if cf else None
    }

results = {}

# BASELINE: Field #58 (10 ha, loam, OM 2.5%, 90mm, Maize, Mirpur 23.8029, 90.3685)
print("Running Baseline...")
results["Baseline"] = extract_key_metrics(run_workflow_for_field(
    field_id=58,
    field_size_ha="10.0",
    area_ha="10.0",
    latitude=23.8029,
    longitude=90.3685,
    soil_texture="loam",
    organic_matter=2.5,
    irrigation_capacity_mm=90.0,
    previous_crop="Maize",
    previous_crop_year=2024
))

# TEST 1: Area (10.0 ha -> 20.0 ha)
print("Running Test 1 (Area)...")
results["Test 1: Area (20ha)"] = extract_key_metrics(run_workflow_for_field(
    field_id=58,
    field_size_ha="20.0",
    area_ha="20.0",
    latitude=23.8029,
    longitude=90.3685,
    soil_texture="loam",
    organic_matter=2.5,
    irrigation_capacity_mm=90.0,
    previous_crop="Maize",
    previous_crop_year=2024
))

# TEST 2: Soil Texture (loam -> clay_loam)
print("Running Test 2 (Soil Texture)...")
results["Test 2: Soil (clay_loam)"] = extract_key_metrics(run_workflow_for_field(
    field_id=58,
    field_size_ha="10.0",
    area_ha="10.0",
    latitude=23.8029,
    longitude=90.3685,
    soil_texture="clay_loam",
    organic_matter=2.5,
    irrigation_capacity_mm=90.0,
    previous_crop="Maize",
    previous_crop_year=2024
))

# TEST 3: Organic Matter (2.5% -> 5.0%)
print("Running Test 3 (Organic Matter)...")
results["Test 3: OM (5.0%)"] = extract_key_metrics(run_workflow_for_field(
    field_id=58,
    field_size_ha="10.0",
    area_ha="10.0",
    latitude=23.8029,
    longitude=90.3685,
    soil_texture="loam",
    organic_matter=5.0,
    irrigation_capacity_mm=90.0,
    previous_crop="Maize",
    previous_crop_year=2024
))

# TEST 4: Irrigation Capacity (90 mm -> 150 mm)
print("Running Test 4 (Irrigation)...")
results["Test 4: Irrig (150mm)"] = extract_key_metrics(run_workflow_for_field(
    field_id=58,
    field_size_ha="10.0",
    area_ha="10.0",
    latitude=23.8029,
    longitude=90.3685,
    soil_texture="loam",
    organic_matter=2.5,
    irrigation_capacity_mm=150.0,
    previous_crop="Maize",
    previous_crop_year=2024
))

# TEST 5: Previous Crop (Maize -> Mungbean)
print("Running Test 5 (Previous Crop)...")
results["Test 5: Crop (Mungbean)"] = extract_key_metrics(run_workflow_for_field(
    field_id=58,
    field_size_ha="10.0",
    area_ha="10.0",
    latitude=23.8029,
    longitude=90.3685,
    soil_texture="loam",
    organic_matter=2.5,
    irrigation_capacity_mm=90.0,
    previous_crop="Mungbean",
    previous_crop_year=2024
))

# TEST 6: Location (Mirpur 23.8029, 90.3685 -> Barisal 22.7010, 90.3535)
print("Running Test 6 (Location)...")
results["Test 6: Location (Barisal)"] = extract_key_metrics(run_workflow_for_field(
    field_id=58,
    field_size_ha="10.0",
    area_ha="10.0",
    latitude=22.7010,
    longitude=90.3535,
    soil_texture="loam",
    organic_matter=2.5,
    irrigation_capacity_mm=90.0,
    previous_crop="Maize",
    previous_crop_year=2024
))

# TEST 7: Field Switching (Field #58 vs Field Demo)
print("Running Test 7 (Demo Field)...")
results["Test 7: Demo Field"] = extract_key_metrics(run_workflow_for_field(
    field_id="demo",
    mode="offline",
    field_size_ha="10.0",
    area_ha="10.0",
    latitude=23.8103,
    longitude=90.4125,
    soil_texture="loam",
    organic_matter=2.5,
    irrigation_capacity_mm=90.0,
    previous_crop="Maize",
    previous_crop_year=2024
))

df = pd.DataFrame(results).T
print("\n=== COMPLETE EXPERIMENT AUDIT MATRIX ===")
print(df[["area_ha", "soil_texture", "organic_matter", "irrigation_cap", "prev_crop", "ml_yield_t_ha", "ml_total_prod_tons", "milp_obj", "y1_s1", "y1_s2", "xai_top_3"]])

# Output json for persistence
with open("scratch/audit_experiment_results.json", "w") as f:
    json.dump(results, f, indent=2)
print("\nSaved scratch/audit_experiment_results.json")
