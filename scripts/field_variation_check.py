#!/usr/bin/env python3
"""Multi-Field Variation Guard Check (S8a).

Verifies that model and satellite outputs dynamically differ across 4 distinct
agro-ecological zones in Bangladesh:
1. Rajshahi (Northwest Level Barind Tract)
2. Sunamganj (Northeast Haor Wetland Basin)
3. Satkhira (Southwest Coastal Saline Delta)
4. Barisal (Southern Coastal Riverine Floodplain - Sauya Marka Field)

Queries:
- /api/planning (rotations, profit, water, risk block)
- /api/water/plan (FAO-56 water balance, net irrigation requirement)
- /api/location/weather (NASA POWER 30-day continuous observations)

Fails if any field-dependent value is statically identical across all regions.
"""

import sys
import json
import urllib.request

BASE_URL = "http://127.0.0.1:8000"

FIELDS = [
    {
        "key": "rajshahi",
        "name": "Rajshahi (Barind)",
        "district": "rajshahi",
        "lat": 24.37,
        "lon": 88.60,
        "soil": "clay loam",
        "area_ha": 1.2,
    },
    {
        "key": "sunamganj",
        "name": "Sunamganj (Haor)",
        "district": "sunamganj",
        "lat": 25.07,
        "lon": 91.40,
        "soil": "clay",
        "area_ha": 2.5,
    },
    {
        "key": "satkhira",
        "name": "Satkhira (Coast)",
        "district": "satkhira",
        "lat": 22.72,
        "lon": 89.07,
        "soil": "silty loam",
        "area_ha": 1.0,
    },
    {
        "key": "barisal",
        "name": "Barisal (Sauya Marka)",
        "district": "barisal",
        "lat": 22.70,
        "lon": 90.35,
        "soil": "silty loam",
        "area_ha": 1.5,
    },
]

def post_json(endpoint, payload):
    url = f"{BASE_URL}{endpoint}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_json(endpoint, params):
    qs = "&".join(f"{k}={v}" for k, v in params.items())
    url = f"{BASE_URL}{endpoint}?{qs}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    print("=" * 96)
    print("FIELD VARIATION GUARD CHECK (S8a)")
    print("Verifying dynamic variation across Rajshahi, Sunamganj, Satkhira, and Barisal")
    print("=" * 96)

    results = {}

    for f in FIELDS:
        # 1. /api/planning
        p_res = post_json("/api/planning", {
            "district": f["district"],
            "area_ha": f["area_ha"],
            "soil_texture": f["soil"],
            "priority": "balanced",
            "latitude": f["lat"],
            "longitude": f["lon"],
        })

        # 2. /api/water/plan
        w_plan = get_json("/api/water/plan", {
            "district": f["district"],
            "crop": "Rice",
            "area_ha": f["area_ha"],
            "lat": f["lat"],
            "lon": f["lon"],
        })

        # 3. /api/location/weather
        w_loc = post_json("/api/location/weather", {
            "district": f["district"],
            "latitude": f["lat"],
            "longitude": f["lon"],
        })

        risk = p_res.get("risk", {})
        planning_summary = p_res.get("summary", {}).get("planning", {})

        results[f["key"]] = {
            "name": f["name"],
            "risk_drought_level": risk.get("drought", {}).get("level"),
            "risk_drought_val": risk.get("drought", {}).get("value_pct"),
            "risk_heavy_rain_level": risk.get("heavy_rain", {}).get("level"),
            "risk_heavy_rain_val": risk.get("heavy_rain", {}).get("days_per_year"),
            "risk_heat_level": risk.get("heat", {}).get("level"),
            "risk_heat_val": risk.get("heat", {}).get("days_per_year"),
            "risk_late_monsoon_level": risk.get("late_monsoon", {}).get("level"),
            "risk_late_monsoon_val": risk.get("late_monsoon", {}).get("share_late_pct"),
            "risk_bare_soil_days": risk.get("bare_soil", {}).get("plan_bare_days"),
            "plan_water_mm": planning_summary.get("plan_irrigation_mm"),
            "baseline_water_mm": planning_summary.get("baseline_irrigation_mm"),
            "water_savings_mm": planning_summary.get("water_savings_mm"),
            "fao56_net_irrig_mm": w_plan.get("water_balance_summary", {}).get("net_irrigation_requirement_mm"),
            "weather_temp_c": w_loc.get("weather", {}).get("summary", {}).get("temperature"),
            "weather_rainfall_mm": w_loc.get("weather", {}).get("summary", {}).get("rainfall"),
            "weather_humidity_pct": w_loc.get("weather", {}).get("summary", {}).get("humidity"),
        }

    # Format side-by-side table
    print(f"{'Metric':<34} | {'Rajshahi':<12} | {'Sunamganj':<12} | {'Satkhira':<12} | {'Barisal':<12}")
    print("-" * 96)

    keys_to_compare = [
        ("Risk: Drought Dry Spell (%)", "risk_drought_val"),
        ("Risk: Heavy Rain (>50mm days/yr)", "risk_heavy_rain_val"),
        ("Risk: Heat Stress (>35C days/yr)", "risk_heat_val"),
        ("Risk: Late Monsoon (%)", "risk_late_monsoon_val"),
        ("Risk: Bare Soil Days (Plan)", "risk_bare_soil_days"),
        ("Planner: Plan Irrig (mm)", "plan_water_mm"),
        ("Planner: Baseline Irrig (mm)", "baseline_water_mm"),
        ("Planner: Water Savings (mm)", "water_savings_mm"),
        ("FAO-56: Net Irrig Need (mm)", "fao56_net_irrig_mm"),
        ("Weather: 30D Mean Temp (deg C)", "weather_temp_c"),
        ("Weather: 30D Sum Rain (mm)", "weather_rainfall_mm"),
        ("Weather: 30D Mean Humidity (%)", "weather_humidity_pct"),
    ]

    identical_failures = []

    for label, k in keys_to_compare:
        r_val = results["rajshahi"][k]
        s_val = results["sunamganj"][k]
        sk_val = results["satkhira"][k]
        b_val = results["barisal"][k]

        print(f"{label:<34} | {str(r_val):<12} | {str(s_val):<12} | {str(sk_val):<12} | {str(b_val):<12}")

        # Guard: check if all 4 values are identical
        if r_val == s_val == sk_val == b_val and r_val is not None:
            identical_failures.append((label, r_val))

    print("=" * 96)

    if identical_failures:
        print("\nFAILURE: The following metrics were statically identical across all regions:")
        for label, val in identical_failures:
            print(f"  - {label}: {val}")
        sys.exit(1)
    else:
        print("\nSUCCESS: All field-dependent metrics dynamically vary across the 4 agro-ecological zones!")
        sys.exit(0)

if __name__ == "__main__":
    main()
