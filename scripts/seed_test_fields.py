import requests
import json

BASE_URL = 'http://127.0.0.1:8000'
s = requests.Session()
login_res = s.post(f"{BASE_URL}/api/auth/login", json={
    'email': 'evaluator@fieldshift.local',
    'password': 'EvaluationPass2026!'
})
if login_res.status_code != 200:
    print("Login failed:", login_res.status_code, login_res.text)
    exit(1)

print("Logged in successfully as evaluator.")

# Check current fields
fields_res = s.get(f"{BASE_URL}/api/fields")
current_fields = fields_res.json().get("fields", [])
field_by_name = {f["name"]: f for f in current_fields}

target_fields = [
    {
        "name": "Haor test field",
        "district": "sunamganj",
        "latitude": 25.07,
        "longitude": 91.40,
        "area_ha": 0.40,
        "soil_texture": "clay",
        "irrigation_capacity_mm": 400.0,
        "existing_rotation": {
            "rabi": "Boro Rice",
            "kharif1": "Fallow",
            "kharif2": "Fallow"
        },
        "seasonally_flooded": True,
        "current_crop": "Boro Rice"
    },
    {
        "name": "Coast test field",
        "district": "satkhira",
        "latitude": 22.72,
        "longitude": 89.07,
        "area_ha": 0.27,
        "soil_texture": "silty clay",
        "irrigation_capacity_mm": 0.0,
        "existing_rotation": {
            "rabi": "Fallow",
            "kharif1": "Fallow",
            "kharif2": "T. Aman Rice"
        },
        "seasonally_flooded": False,
        "current_crop": "T. Aman Rice"
    },
    {
        "name": "Dinajpur test field",
        "district": "dinajpur",
        "latitude": 25.63,
        "longitude": 88.64,
        "area_ha": 1.07,
        "soil_texture": "sandy loam",
        "irrigation_capacity_mm": 1200.0,
        "existing_rotation": {
            "rabi": "Wheat",
            "kharif1": "Jute",
            "kharif2": "T. Aman Rice"
        },
        "seasonally_flooded": False,
        "current_crop": "Wheat"
    }
]

for tf in target_fields:
    if tf["name"] in field_by_name:
        print(f"Field '{tf['name']}' already exists (ID: {field_by_name[tf['name']]['id']}). Reusing.")
    else:
        print(f"Creating field '{tf['name']}' via POST /api/fields...")
        create_res = s.post(f"{BASE_URL}/api/fields", json=tf)
        if create_res.status_code not in (200, 201):
            print(f"Failed to create '{tf['name']}':", create_res.status_code, create_res.text)
        else:
            created_data = create_res.json()
            print(f"Created '{tf['name']}' with ID: {created_data['field']['id']}")

# Fetch updated fields list
fields_res = s.get(f"{BASE_URL}/api/fields")
all_fields = fields_res.json().get("fields", [])
name_map = {f["name"]: f for f in all_fields}

print("\n--- 4 TEST FIELD RECORDS ---")
expected_names = ["Haor test field", "Coast test field", "Dinajpur test field", "রহিম মিয়ার জমি"]
for name in expected_names:
    f = name_map.get(name)
    if f:
        print(f"Name: {f['name']}")
        print(f"  ID: {f['id']}")
        print(f"  District: {f.get('district')}")
        print(f"  Coordinates: ({f.get('latitude')}, {f.get('longitude')})")
        print(f"  Area: {f.get('area_ha')} ha")
        print(f"  Soil Texture: {f.get('soil_texture')}")
        print(f"  Irrigation Capacity: {f.get('irrigation_capacity_mm')} mm")
        print(f"  Existing Rotation: {f.get('existing_rotation')}")
        print(f"  Seasonally Flooded: {f.get('seasonally_flooded')}")
    else:
        print(f"MISSING: {name}")

