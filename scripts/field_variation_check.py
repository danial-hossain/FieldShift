#!/usr/bin/env python3
"""Multi-Field Variation Guard Check (D2 & D3).

Guarantees every page is computed for the SELECTED field without fixed fields,
district fallbacks when point data exist, or hardcoded numbers.

Fields tested (D2):
1. Rahim (Chapainawabganj: 24.62, 88.55, 0.67 ha)
2. Chapainawabganj Pin 2 (15 km away in same district: 24.70, 88.42, 1.20 ha)
3. Bogura (Floodplain center: 24.85, 89.37, 1.00 ha)
4. Sunamganj (Haor wetland basin: 25.07, 91.40, 2.50 ha)
5. Satkhira (Coastal saline delta: 22.72, 89.07, 1.00 ha)

And brand-new field lifecycle (D3):
- Dinajpur new pin (25.63, 88.64, 3 bigha = 0.40134 ha, Sandy Loam, limited water)
- Rotation: Wheat -> Jute -> Aman
- Audited across all pages, dynamic results verified, deleted cleanly afterwards.
"""

from __future__ import annotations

import json
import math
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

BASE_URL = "http://127.0.0.1:8000"

FIELDS = [
    {
        "key": "rahim",
        "name": "Rahim (Chapainawabganj)",
        "district": "chapainawabganj",
        "lat": 24.62,
        "lon": 88.55,
        "soil": "clay loam",
        "area_ha": 0.67,
    },
    {
        "key": "chapainawabganj_pin2",
        "name": "Chapainawabganj Pin 2 (15km)",
        "district": "chapainawabganj",
        "lat": 24.70,
        "lon": 88.42,
        "soil": "loam",
        "area_ha": 1.20,
    },
    {
        "key": "bogura",
        "name": "Bogura (Floodplain)",
        "district": "bogura",
        "lat": 24.85,
        "lon": 89.37,
        "soil": "loam",
        "area_ha": 1.00,
    },
    {
        "key": "sunamganj",
        "name": "Sunamganj (Haor Basin)",
        "district": "sunamganj",
        "lat": 25.07,
        "lon": 91.40,
        "soil": "clay",
        "area_ha": 2.50,
    },
    {
        "key": "satkhira",
        "name": "Satkhira (Coastal Saline)",
        "district": "satkhira",
        "lat": 22.72,
        "lon": 89.07,
        "soil": "silty loam",
        "area_ha": 1.00,
    },
]


def post_json(endpoint: str, payload: dict[str, Any]) -> dict[str, Any]:
    url = f"{BASE_URL}{endpoint}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_json(endpoint: str, params: dict[str, Any]) -> dict[str, Any]:
    qs = "&".join(f"{k}={urllib.request.quote(str(v))}" for k, v in params.items() if v is not None)
    url = f"{BASE_URL}{endpoint}?{qs}" if qs else f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def audit_field(f: dict[str, Any]) -> dict[str, Any]:
    """Execute all page endpoints for a single field pin and collect metrics."""
    field_key = f["key"]
    lat, lon, area, dist = f["lat"], f["lon"], f["area_ha"], f["district"]
    soil = f.get("soil", "loam")
    fid = f.get("field_id")

    # 1. /api/planning for 4 strategies + current
    strat_results = {}
    for st in ("balanced", "profit", "water", "soil"):
        payload = {
            "district": dist,
            "latitude": lat,
            "longitude": lon,
            "area_ha": area,
            "soil_texture": soil,
            "priority": st,
        }
        if fid is not None:
            payload["field_id"] = str(fid)
        strat_results[st] = post_json("/api/planning", payload)

    bal_res = strat_results["balanced"]
    bal_summary = bal_res.get("summary", {}).get("planning", {})
    bal_crops = bal_res.get("planning", {}).get("milp_status", {}).get("selected_crop_by_period", {})
    if not bal_crops and "milp_status" in bal_summary:
        bal_crops = bal_summary["milp_status"].get("selected_crop_by_period", {})

    # 2. /api/lab/compare (3-way comparison)
    compare_payload = {
        "district": dist,
        "latitude": lat,
        "longitude": lon,
        "area_ha": area,
        "soil_texture": soil,
    }
    if fid is not None:
        compare_payload["field_id"] = str(fid)
    compare_res = post_json("/api/lab/compare", compare_payload)

    # 3. /api/water/season-plan
    water_params = {
        "district": dist,
        "latitude": lat,
        "longitude": lon,
        "area_ha": area,
        "strategy": "balanced",
    }
    if fid is not None:
        water_params["field_id"] = str(fid)
    water_res = get_json("/api/water/season-plan", water_params)

    # 4. /api/planning/stress (drought moderate, flood moderate, salinity moderate)
    stress_base = {
        "district": dist,
        "latitude": lat,
        "longitude": lon,
        "area_ha": area,
        "intensity": "moderate",
    }
    if fid is not None:
        stress_base["field_id"] = str(fid)

    stress_drought = post_json("/api/planning/stress", {**stress_base, "scenario": "drought"})
    stress_flood = post_json("/api/planning/stress", {**stress_base, "scenario": "flood"})
    stress_salinity = post_json("/api/planning/stress", {**stress_base, "scenario": "salinity"})

    # 5. /api/climate/field-summary
    clim_params = {
        "lat": lat,
        "lon": lon,
        "offline": "true",
    }
    if fid is not None:
        clim_params["field_id"] = str(fid)
    climate_summary = get_json("/api/climate/field-summary", clim_params)

    # 6. /api/advisory (overview numbers)
    advisory_res = get_json("/api/advisory", {
        "district": dist,
        "crop": "aman",
        "lat": lat,
        "lon": lon,
        "offline": "true",
    })

    # Extract metrics
    plan_irrig_mm = bal_summary.get("plan_irrigation_mm") or water_res.get("yearly_totals", {}).get("plan_yearly_mm")
    base_irrig_mm = bal_summary.get("baseline_irrigation_mm") or water_res.get("yearly_totals", {}).get("current_yearly_mm")
    water_litres = int(round(float(plan_irrig_mm or 0) * area * 10000.0))

    ann_list = climate_summary.get("summary", {}).get("annual", [])
    if ann_list and isinstance(ann_list, list):
        annual_rain = round(sum(ann_list) / len(ann_list), 1)
    else:
        annual_rain = water_res.get("climatology", {}).get("normal_annual_rainfall_mm", 0.0)

    heat_list = climate_summary.get("summary", {}).get("heat", [])
    if heat_list and isinstance(heat_list, list):
        heat_days = round(sum(heat_list) / len(heat_list), 1)
    else:
        heat_days = bal_res.get("risk", {}).get("heat", {}).get("days_per_year", 0.0)

    grace_block = climate_summary.get("summary", {}).get("grace") or climate_summary.get("grace", {})
    grace_trend_val = grace_block.get("sens_slope_cm_yr") if grace_block.get("sens_slope_cm_yr") is not None else grace_block.get("trend_cm_yr", -1.5)

    sal_loss_bdt = stress_salinity.get("summary", {}).get("total_profit_loss_bdt", 0.0)
    drought_loss_bdt = stress_drought.get("summary", {}).get("total_profit_loss_bdt", 0.0)
    flood_loss_bdt = stress_flood.get("summary", {}).get("total_profit_loss_bdt", 0.0)

    compare_methods = compare_res.get("methods", [])
    compare_milp_profit = compare_methods[0].get("annual_field_profit_bdt", 0.0) if compare_methods else 0.0

    # Formatted sequence of crops (Y1_S1 -> Y1_S2 -> Y1_S3)
    crop_seq = "-".join([
        bal_crops.get("Y1_S1", "Mustard"),
        bal_crops.get("Y1_S2", "Soybean"),
        bal_crops.get("Y1_S3", "Rice"),
    ])

    return {
        "field": f,
        "crops": crop_seq,
        "plan_irrig_mm": float(plan_irrig_mm) if plan_irrig_mm is not None else 0.0,
        "base_irrig_mm": float(base_irrig_mm) if base_irrig_mm is not None else 0.0,
        "water_litres": water_litres,
        "annual_rain_mm": float(annual_rain),
        "heat_days": float(heat_days),
        "grace_trend_cm_yr": float(grace_trend_val),
        "stress_salinity_loss_bdt": float(sal_loss_bdt),
        "stress_drought_loss_bdt": float(drought_loss_bdt),
        "stress_flood_loss_bdt": float(flood_loss_bdt),
        "compare_milp_profit": float(compare_milp_profit),
        "water_res": water_res,
        "bal_res": bal_res,
        "climate_res": climate_summary,
        "advisory_res": advisory_res,
    }


def run_d2_audit() -> dict[str, Any]:
    print("=" * 110)
    print("D2: MULTI-FIELD VARIATION AUDIT (5 DISTINCT PINS)")
    print("Calling all endpoints: planning, compare, water season-plan, stress, climate, overview")
    print("=" * 110)

    results: dict[str, dict[str, Any]] = {}
    for f in FIELDS:
        print(f" -> Querying {f['name']} ({f['lat']}, {f['lon']}, {f['area_ha']} ha)...")
        results[f["key"]] = audit_field(f)

    # Print Side-by-Side Comparison Table
    col_w = 18
    hdr = f"{'Metric':<32} | " + " | ".join(f"{f['name'][:col_w]:<{col_w}}" for f in FIELDS)
    print("\n" + "=" * len(hdr))
    print(hdr)
    print("-" * len(hdr))

    rows = [
        ("Plan Crops (Y1 Rabi-K1-K2)", lambda r: r["crops"]),
        ("Plan Irrig (mm/yr)", lambda r: f"{r['plan_irrig_mm']:.1f}"),
        ("Baseline Irrig (mm/yr)", lambda r: f"{r['base_irrig_mm']:.1f}"),
        ("Irrigation Litres (L/yr)", lambda r: f"{r['water_litres']:,}"),
        ("IMERG Annual Rain (mm)", lambda r: f"{r['annual_rain_mm']:.1f}"),
        ("Heat Stress Days (>35C/yr)", lambda r: f"{r['heat_days']:.1f}"),
        ("GRACE Trend (cm/yr)", lambda r: f"{r['grace_trend_cm_yr']:+.2f}"),
        ("Salinity Stress Loss (BDT)", lambda r: f"{r['stress_salinity_loss_bdt']:,.0f}"),
        ("Drought Stress Loss (BDT)", lambda r: f"{r['stress_drought_loss_bdt']:,.0f}"),
        ("Flood Stress Loss (BDT)", lambda r: f"{r['stress_flood_loss_bdt']:,.0f}"),
        ("Compare MILP Profit (BDT)", lambda r: f"{r['compare_milp_profit']:,.0f}"),
    ]

    for label, extractor in rows:
        vals = [f"{str(extractor(results[f['key']]))[:col_w]:<{col_w}}" for f in FIELDS]
        print(f"{label:<32} | " + " | ".join(vals))

    print("=" * len(hdr))

    # Strict FAIL Assertions
    failures = []

    # 1. No field-dependent value may be identical across all 5 fields
    for label, extractor in rows:
        unique_vals = set(extractor(results[f["key"]]) for f in FIELDS)
        if len(unique_vals) == 1:
            failures.append(f"INVARIANT FAILURE: {label} is identical across all 5 fields: {unique_vals.pop()}")

    # 2. Specific domain physics assertions
    # - Satkhira salinity loss must strictly exceed Rahim (coastal marine vs inland)
    sat_sal = results["satkhira"]["stress_salinity_loss_bdt"]
    rahim_sal = results["rahim"]["stress_salinity_loss_bdt"]
    if not (sat_sal > rahim_sal):
        failures.append(f"PHYSICAL SANITY FAILURE: Satkhira salinity loss ({sat_sal}) must exceed Rahim ({rahim_sal})")

    # - GRACE: Haor (Sunamganj) water trend must be higher/more positive than Barind (Rahim / Rajshahi)
    sun_grace = results["sunamganj"]["grace_trend_cm_yr"]
    rahim_grace = results["rahim"]["grace_trend_cm_yr"]
    if not (sun_grace > rahim_grace):
        failures.append(f"HYDROLOGICAL SANITY FAILURE: Sunamganj GRACE trend ({sun_grace}) must be greater than Barind ({rahim_grace})")

    # - Water litres must be area-dependent (Sunamganj 2.5ha vs Rahim 0.67ha)
    sun_litres = results["sunamganj"]["water_litres"]
    rahim_litres = results["rahim"]["water_litres"]
    if not (sun_litres > rahim_litres):
        failures.append(f"AREA ARITHMETIC FAILURE: Sunamganj 2.5ha litres ({sun_litres}) must exceed Rahim 0.67ha ({rahim_litres})")

    # 3. Known typed values rejection guard
    # Disallowed: 1548/718 on non-Rahim, 55869, 146526, 'রহিম মিয়ার জমি' on non-Rahim, 'bogura' as silent fallback on non-bogura
    for f in FIELDS:
        k = f["key"]
        r = results[k]
        raw_dump = json.dumps(r["bal_res"]) + json.dumps(r["water_res"]) + json.dumps(r["climate_res"])

        if k != "rahim":
            if "রহিম মিয়ার জমি" in raw_dump:
                failures.append(f"LEAKED HARDCODED LABEL: 'রহিম মিয়ার জমি' appeared in non-Rahim field '{k}'")
            # 1548 / 718 check
            if abs(r["base_irrig_mm"] - 1547.9) < 0.05 or abs(r["plan_irrig_mm"] - 717.9) < 0.05:
                failures.append(f"HARDCODED WATER BALANCE: 1548 or 718 mm detected in non-Rahim field '{k}'")

        if k != "bogura":
            if "24.8465" in raw_dump or "89.3777" in raw_dump:
                failures.append(f"SILENT CENTROID FALLBACK: Bogura coordinates detected in non-Bogura field '{k}'")

        if "55869" in raw_dump or "146526" in raw_dump:
            failures.append(f"TYPED COST/PROFIT LEAK: 55869 or 146526 detected in response for field '{k}'")

    if failures:
        print("\n❌ D2 AUDIT FAILED with the following violations:")
        for fail in failures:
            print(f"  * {fail}")
        raise AssertionError(f"D2 audit encountered {len(failures)} failures.")
    else:
        print("\n✅ D2 AUDIT PASSED: All 5 fields produce dynamic, geographically sound, non-hardcoded responses!")

    return results


def run_d3_new_field_lifecycle() -> dict[str, Any]:
    print("\n" + "=" * 110)
    print("D3: BRAND-NEW FIELD DYNAMIC LIFECYCLE AUDIT (DINAJPUR PIN)")
    print("Creating field via backend DB, running full multi-page audit, verifying dynamic results, and cleaning up")
    print("=" * 110)

    from backend.app.database import SessionLocal
    from backend.app.models import Field, Farm, User

    # 3 bigha = 3 * 0.13378 = 0.40134 ha
    area_ha = round(3.0 * 0.13378, 5)

    db = SessionLocal()
    field_id = None
    try:
        user = db.query(User).first()
        farm = db.query(Farm).first()
        if not farm and user:
            farm = Farm(user_id=user.id, name="Test Farm", created_at=datetime.now(timezone.utc))
            db.add(farm)
            db.commit()
            db.refresh(farm)

        farm_id = farm.id if farm else 1
        now_dt = datetime.now(timezone.utc)

        new_field = Field(
            farm_id=farm_id,
            name="দিনাজপুর নতুন খামার",
            district="dinajpur",
            latitude=25.63,
            longitude=88.64,
            area_ha=area_ha,
            soil_texture="sandy loam",
            irrigation_capacity_mm=400.0,
            existing_rotation={
                "rabi": "Wheat",
                "kharif1": "Jute",
                "kharif2": "Rice",
            },
            created_at=now_dt,
            updated_at=now_dt,
        )
        db.add(new_field)
        db.commit()
        db.refresh(new_field)
        field_id = new_field.id
        print(f"1. Successfully created Dinajpur test field in DB with ID: {field_id}")
    finally:
        db.close()

    try:
        # Run audit on this new field
        audit_spec = {
            "key": f"dinajpur_{field_id}",
            "name": "দিনাজপুর নতুন খামার",
            "district": "dinajpur",
            "lat": 25.63,
            "lon": 88.64,
            "soil": "sandy loam",
            "area_ha": area_ha,
            "field_id": field_id,
        }

        print(f"2. Auditing all pages for new field ID {field_id}...")
        res = audit_field(audit_spec)

        print(f"   - Plan Crops: {res['crops']}")
        print(f"   - Plan Irrigation: {res['plan_irrig_mm']:.1f} mm/yr ({res['water_litres']:,} L/yr)")
        print(f"   - IMERG Annual Rain: {res['annual_rain_mm']:.1f} mm")
        print(f"   - Heat Stress Days: {res['heat_days']:.1f} days/yr")
        print(f"   - GRACE Trend: {res['grace_trend_cm_yr']:+.2f} cm/yr")

        # Dynamic verification: cannot equal Rahim's numbers
        assert abs(res["plan_irrig_mm"] - 717.9) > 0.5, "New field unexpectedly matched Rahim's plan irrigation 717.9 mm"
        assert abs(res["base_irrig_mm"] - 1547.9) > 0.5, "New field unexpectedly matched Rahim's baseline irrigation 1547.9 mm"
        assert res["water_litres"] != 480205, "New field water litres matched Rahim's parcel litres"

        # Verify area calculation reflects 3 bigha (0.40134 ha)
        expected_litres = int(round(res["plan_irrig_mm"] * area_ha * 10000.0))
        assert abs(res["water_litres"] - expected_litres) <= 1, f"Area arithmetic mismatch: {res['water_litres']} vs {expected_litres}"

        print("3. Verifying database cleanup...")
        db_cleanup = SessionLocal()
        try:
            fld = db_cleanup.query(Field).filter(Field.id == field_id).first()
            if fld:
                db_cleanup.delete(fld)
                db_cleanup.commit()
            print(f"   Field {field_id} deleted cleanly from database.")
        finally:
            db_cleanup.close()

        print("\n✅ D3 AUDIT PASSED: Brand-new field dynamically computes across all endpoints and deletes cleanly!")
        return res

    except Exception as exc:
        print(f"Cleaning up field {field_id} after failure...")
        try:
            db_err = SessionLocal()
            fld = db_err.query(Field).filter(Field.id == field_id).first()
            if fld:
                db_err.delete(fld)
                db_err.commit()
            db_err.close()
        except Exception:
            pass
        raise exc


def main():
    try:
        run_d2_audit()
        run_d3_new_field_lifecycle()
        print("\n" + "=" * 110)
        print("🎉 ALL CHECKS PASSED: Dynamic Multi-Field Variation (D2) and New Field Lifecycle (D3) Verified!")
        print("=" * 110)
        sys.exit(0)
    except Exception as e:
        print(f"\nFATAL: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
