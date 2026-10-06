import requests
import json

BASE_URL = "http://127.0.0.1:8000"

# 1. Login as Dani
session = requests.Session()
login_res = session.post(f"{BASE_URL}/api/auth/login", json={
    "email": "danialhossain2022@gmail.com",
    "password": "12345678"
})
print("Login status:", login_res.status_code)

# 2. Get field 58
field_res = session.get(f"{BASE_URL}/api/fields")
fields = field_res.json().get("fields", [])
f58 = next((f for f in fields if f["id"] == 58), None)
print(f"Field #58 current area: {f58.get('area_ha') if f58 else 'Not found'}")

# 3. Test workflow with 10.0 ha
print("\n--- Running Workflow for Field #58 at 10.0 ha ---")
update_10 = session.put(f"{BASE_URL}/api/fields/58", json={
    "name": "Mirpur, Dhaka",
    "latitude": 23.8029,
    "longitude": 90.3685,
    "area_ha": 10.0,
    "soil_texture": "loam",
    "organic_matter": 3.9,
    "irrigation_capacity_mm": 90.0,
    "crop": "Maize",
    "previous_crop_year": 2024
})
wf_10 = session.post(f"{BASE_URL}/api/workflow", json={
    "field_id": 58,
    "field_size_ha": "10.0",
    "area_ha": "10.0",
    "latitude": "23.8029",
    "longitude": "90.3685",
    "soil_texture": "loam",
    "organic_matter": "3.9",
    "irrigation_capacity_mm": "90.0",
    "previous_crop": "Maize",
    "previous_crop_year": "2024",
    "start_date": "2026-08-31",
    "end_date": "2026-09-29",
    "mode": "live",
    "priority": "profit",
    "season": "dry",
    "include_history": True
})
res_10 = wf_10.json().get("summary", {})
fs_10 = res_10.get("field_state", {})
ml_10 = res_10.get("ml", {})
plan_10 = res_10.get("planning", {}).get("selected_strategy_result", {})

print(f"10 ha FieldState area: {fs_10.get('field_size_ha')} ha")
print(f"10 ha ML Yield Rate: {ml_10.get('prediction_t_ha')} t/ha")
print(f"10 ha ML Total Production: {ml_10.get('total_production_tons')} tons")
print(f"10 ha MILP Objective: {plan_10.get('objective_value')}")

# 4. Update Field #58 to 20.0 ha
print("\n--- Running Workflow for Field #58 at 20.0 ha ---")
update_20 = session.put(f"{BASE_URL}/api/fields/58", json={
    "name": "Mirpur, Dhaka",
    "latitude": 23.8029,
    "longitude": 90.3685,
    "area_ha": 20.0,
    "soil_texture": "loam",
    "organic_matter": 3.9,
    "irrigation_capacity_mm": 90.0,
    "crop": "Maize",
    "previous_crop_year": 2024
})
wf_20 = session.post(f"{BASE_URL}/api/workflow", json={
    "field_id": 58,
    "field_size_ha": "20.0",
    "area_ha": "20.0",
    "latitude": "23.8029",
    "longitude": "90.3685",
    "soil_texture": "loam",
    "organic_matter": "3.9",
    "irrigation_capacity_mm": "90.0",
    "previous_crop": "Maize",
    "previous_crop_year": "2024",
    "start_date": "2026-08-31",
    "end_date": "2026-09-29",
    "mode": "live",
    "priority": "profit",
    "season": "dry",
    "include_history": True
})
res_20 = wf_20.json().get("summary", {})
fs_20 = res_20.get("field_state", {})
ml_20 = res_20.get("ml", {})
plan_20 = res_20.get("planning", {}).get("selected_strategy_result", {})

print(f"20 ha FieldState area: {fs_20.get('field_size_ha')} ha")
print(f"20 ha ML Yield Rate: {ml_20.get('prediction_t_ha')} t/ha")
print(f"20 ha ML Total Production: {ml_20.get('total_production_tons')} tons")
print(f"20 ha MILP Objective: {plan_20.get('objective_value')}")
