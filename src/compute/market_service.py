"""Market and profit economics service for FieldShift 2026.

Computes comprehensive seasonal economics, break-even prices, price sensitivities,
and reference price catalogs strictly derived from the MILP planning model
and dynamic crop-season matrices.
"""

from __future__ import annotations

import math
from typing import Any, Mapping, Optional, Sequence
import pandas as pd

from src.compute.advisory_service import DISTRICT_REGISTRY, nearest_district, load_district_climate_data
from src.compute.water_service import CANONICAL_FIELDS
from src.data.crops import load_crop_knowledge
from src.data.market_intelligence import get_market_overview
from src.optimizer.milp import optimize_rotation
from src.state.field_state import build_field_state

# Conversion constants
KG_PER_TON = 1000.0
KG_PER_MAUND = 37.32
HA_PER_BIGHA = 0.13378
# 1 t/ha in maund/bigha: 1000 kg / 10000 m2 = 0.1 kg/m2 * 1337.8 m2/bigha / 37.32 kg/maund = ~3.58467
MAUND_BIGHA_PER_T_HA = (KG_PER_TON * HA_PER_BIGHA) / KG_PER_MAUND

CROP_NAMES_BN = {
    "Boro Rice": "বোরো ধান",
    "Rice": "আমন ধান",
    "Aman Rice": "আমন ধান",
    "Aus Rice": "আউশ ধান",
    "Mustard": "সরিষা",
    "Wheat": "গম",
    "Potato": "আলু",
    "Lentil": "মসুর",
    "Mungbean": "মুগডাল",
    "Chickpea": "ছোলা",
    "Soybean": "সয়াবিন",
    "Maize": "ভুট্টা",
    "Sesame": "তিল",
    "Sunflower": "সূর্যমুখী",
    "Groundnut": "চীনাবাদাম",
    "Jute": "পাট",
    "Tomato": "টমেটো",
    "Fallow": "পতিত",
}


def resolve_market_field(
    field_id: Optional[str | int] = None,
    district: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    area_ha: Optional[float] = None,
) -> dict[str, Any]:
    """Resolve field location, ownership data, and historical records."""
    f_num = None
    if field_id is not None:
        try:
            f_num = int(str(field_id).strip())
        except (ValueError, TypeError):
            pass

    # Check canonical audit fields
    if f_num is not None and f_num in CANONICAL_FIELDS:
        cf = CANONICAL_FIELDS[f_num]
        return {
            "field_id": str(f_num),
            "name": cf["name"],
            "name_en": cf["name"],
            "district": cf["district"],
            "latitude": cf["lat"],
            "longitude": cf["lon"],
            "area_ha": cf["area_ha"],
            "area_bigha": round(cf["area_ha"] / HA_PER_BIGHA, 1),
            "soil_texture": cf["soil"],
            "history_records": [],
            "existing_rotation": None,
        }

    # Check database fields
    if f_num is not None:
        try:
            from backend.app.database import engine
            from sqlalchemy import text
            with engine.connect() as conn:
                row = conn.execute(
                    text("SELECT * FROM fields WHERE id = :fid"),
                    {"fid": f_num}
                ).fetchone()
                if row:
                    m = dict(row._mapping)
                    f_lat = float(m["latitude"]) if m.get("latitude") is not None else 24.62
                    f_lon = float(m["longitude"]) if m.get("longitude") is not None else 88.55
                    f_dist = (m.get("district") or "").strip().lower()
                    if not f_dist:
                        f_dist = nearest_district(f_lat, f_lon)
                    f_area = float(m["area_ha"]) if m.get("area_ha") is not None and m["area_ha"] > 0 else 0.67
                    f_soil = m.get("soil_texture") or "clay loam"

                    # Fetch field history
                    h_rows = conn.execute(
                        text("SELECT * FROM field_history WHERE field_id = :fid ORDER BY year DESC, id DESC"),
                        {"fid": f_num}
                    ).fetchall()
                    history_records = [dict(hr._mapping) for hr in h_rows]

                    return {
                        "field_id": str(f_num),
                        "name": m.get("name") or "রহিম মিয়ার জমি",
                        "name_en": m.get("name") or "Rahim Mia's Plot",
                        "district": f_dist,
                        "latitude": f_lat,
                        "longitude": f_lon,
                        "area_ha": f_area,
                        "area_bigha": round(f_area / HA_PER_BIGHA, 1),
                        "soil_texture": f_soil,
                        "history_records": history_records,
                        "existing_rotation": m.get("existing_rotation"),
                    }
        except Exception:
            pass

    # Coordinates or District overrides
    act_lat = latitude
    act_lon = longitude
    act_dist = (district or "").strip().lower()
    if act_dist and (act_lat is None or act_lon is None):
        meta = DISTRICT_REGISTRY.get(act_dist, {})
        act_lat = float(meta.get("latitude") or meta.get("lat") or 24.62)
        act_lon = float(meta.get("longitude") or meta.get("lon") or 88.55)
    elif act_lat is not None and act_lon is not None and not act_dist:
        act_dist = nearest_district(act_lat, act_lon)

    if act_lat is None or act_lon is None:
        # Default fallback to Rahim Mia's plot in Chapainawabganj (5 bigha)
        act_lat = 24.62
        act_lon = 88.55
        act_dist = "chapainawabganj"

    act_area = float(area_ha) if area_ha is not None and area_ha > 0 else 0.6689
    return {
        "field_id": str(field_id or "demo"),
        "name": "রহিম মিয়ার জমি" if act_dist == "chapainawabganj" else f"{act_dist.capitalize()} Field",
        "name_en": "Rahim Mia's Plot" if act_dist == "chapainawabganj" else f"{act_dist.capitalize()} Field",
        "district": act_dist,
        "latitude": act_lat,
        "longitude": act_lon,
        "area_ha": act_area,
        "area_bigha": round(act_area / HA_PER_BIGHA, 1),
        "soil_texture": "clay loam",
        "history_records": [],
        "existing_rotation": None,
    }


def compute_plan_economics(
    field_id: Optional[str | int] = None,
    strategy: str = "balanced",
    district: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    area_ha: Optional[float] = None,
) -> dict[str, Any]:
    """Compute complete seasonal plan economics, profit, break-even prices, and sensitivities."""
    f_info = resolve_market_field(
        field_id=field_id,
        district=district,
        latitude=latitude,
        longitude=longitude,
        area_ha=area_ha,
    )
    dist_key = f_info["district"]
    lat = f_info["latitude"]
    lon = f_info["longitude"]
    area = f_info["area_ha"]
    area_bigha = f_info["area_bigha"]
    hist_records = f_info.get("history_records", [])

    # Load district climate
    power_df, _ = load_district_climate_data(dist_key, offline=True)
    crops = load_crop_knowledge()

    # Track farmer custom prices from field history
    custom_prices: dict[str, float] = {}
    if hist_records:
        for rec in hist_records:
            if not isinstance(rec, (dict, Mapping)):
                continue
            c_name = str(rec.get("crop") or "").strip().casefold()
            p_val = None
            for pk in ("price_bdt_per_maund", "price_per_maund", "sale_price", "price"):
                if rec.get(pk) not in (None, ""):
                    try:
                        p_val = float(rec[pk])
                        break
                    except (ValueError, TypeError):
                        pass
            if c_name and p_val is not None and p_val > 0:
                custom_prices[c_name] = p_val

    # Build field state for MILP
    f_state = build_field_state(
        field_id=f_info["field_id"],
        latitude=lat,
        longitude=lon,
        decision_date="2025-12-31",
        nasa_power_data=power_df.tail(60),
        smap_data=None,
        crop_knowledge=crops,
    )
    f_state.field_size_ha = area
    f_state.area_ha = area
    f_state.texture = f_info["soil_texture"]
    f_state.district = dist_key

    from src.optimizer.dynamic_agronomy import COASTAL_SALINE_DISTRICTS
    is_haor = dist_key in {"sunamganj", "netrokona", "kishoreganj", "habiganj", "moulvibazar", "sylhet"}
    f_state.seasonally_flooded = bool(is_haor)
    f_state.coastal_saline = dist_key in COASTAL_SALINE_DISTRICTS
    allow_k2_fallow = bool(is_haor)

    strat_key = (strategy or "balanced").strip().lower()
    strat_norm = "balanced"
    if strat_key in ("profit", "profit_focused", "মুনাফা", "লাভ"):
        strat_norm = "profit"
    elif strat_key in ("water", "water_efficiency", "পানি", "পানি সাশ্রয়"):
        strat_norm = "water"
    elif strat_key in ("soil", "soil_health", "মাটি", "মাটির স্বাস্থ্য"):
        strat_norm = "soil"

    strategy_weights_map = {
        "balanced": (0.34, 0.33, 0.33, 0.0),
        "profit": (0.60, 0.20, 0.20, 0.0),
        "water": (0.20, 0.60, 0.20, 0.0),
        "soil": (0.20, 0.20, 0.60, 0.0),
    }
    pw, ww, sw, nw = strategy_weights_map[strat_norm]

    # Run MILP optimization
    milp_res = optimize_rotation(
        field_state=f_state,
        crops=crops,
        environmental_history=power_df,
        profit_weight=pw,
        water_weight=ww,
        soil_weight=sw,
        national_need_weight=nw,
        allow_kharif2_fallow=allow_k2_fallow,
        min_cereals_per_year=1,
        seasonally_flooded=bool(is_haor),
        field_history_records=hist_records or None,
        existing_rotation=f_info.get("existing_rotation"),
    )

    sel = milp_res.get("selected_crop_by_period") or {}
    csm = (milp_res.get("dynamic_agronomic_matrix") or {}).get("crop_season_matrix", {})
    periods = list(milp_res.get("planning_periods") or ["Y1_S1", "Y1_S2", "Y1_S3", "Y2_S1", "Y2_S2", "Y2_S3"])
    num_years = max(1.0, len(periods) / 3.0)

    # Reference market catalog metadata for citations
    mkt_overview = get_market_overview()
    cat_crops_map = {c["crop"].lower(): c for c in mkt_overview.get("crops", [])}

    season_names_map = {
        "S1": {"bn": "রবি", "en": "Rabi"},
        "S2": {"bn": "খরিফ-১", "en": "Kharif-1"},
        "S3": {"bn": "খরিফ-২", "en": "Kharif-2"},
    }

    # 1. Per-Season Plan Economics
    seasons_data = []
    plan_crop_rev_ha: dict[str, float] = {}
    custom_price_count = 0
    catalogue_price_count = 0

    for period in periods:
        crop_name = sel.get(period, "Fallow")
        is_fallow = crop_name.lower() == "fallow"
        s_code = "S1" if "S1" in period else ("S2" if "S2" in period else "S3")
        yr_idx = 1 if "Y1" in period else 2

        if not is_fallow and period in csm and crop_name in csm[period]:
            m = csm[period][crop_name]
            y_tha = float(m.get("dynamic_yield_t_ha", 0.0))
            y_mb = round(y_tha * MAUND_BIGHA_PER_T_HA, 1)

            price_t = float(m.get("market_price_bdt_t", 0.0))
            price_m = round(price_t * (KG_PER_MAUND / KG_PER_TON), 1)

            c_key = crop_name.strip().casefold()
            is_custom = c_key in custom_prices
            if is_custom:
                custom_price_count += 1
                price_source = "আপনার দেওয়া (MF9)"
                price_source_en = "Farmer supplied (MF9)"
            else:
                catalogue_price_count += 1
                cat_c = cat_crops_map.get(c_key, {})
                src_name = cat_c.get("source") or "DAM / BBS"
                src_date = cat_c.get("source_date") or "2025"
                price_source = f"{src_name} ({src_date})"
                price_source_en = f"{src_name} ({src_date})"

            margin_ha = float(m.get("dynamic_gross_margin_bdt_ha", 0.0))
            rev_ha = round(y_tha * price_t, 2)
            cost_ha = round(rev_ha - margin_ha, 2)

            season_rev = int(round(rev_ha * area))
            season_cost = int(round(cost_ha * area))
            season_profit = season_rev - season_cost

            # Break-even price (BDT/maund) = cost in BDT/bigha / yield in maund/bigha
            cost_bigha = cost_ha * HA_PER_BIGHA
            break_even = round(cost_bigha / y_mb, 1) if y_mb > 0 else 0.0

            plan_crop_rev_ha[crop_name] = plan_crop_rev_ha.get(crop_name, 0.0) + rev_ha
        else:
            y_tha = 0.0
            y_mb = 0.0
            price_m = 0.0
            price_source = "—"
            price_source_en = "—"
            is_custom = False
            rev_ha = 0.0
            cost_ha = 0.0
            margin_ha = 0.0
            season_rev = 0
            season_cost = 0
            season_profit = 0
            break_even = 0.0

        seasons_data.append({
            "period": period,
            "year": yr_idx,
            "season_code": s_code,
            "season_name_bn": season_names_map[s_code]["bn"],
            "season_name_en": season_names_map[s_code]["en"],
            "crop": crop_name,
            "crop_bn": CROP_NAMES_BN.get(crop_name, crop_name),
            "crop_en": crop_name,
            "is_fallow": is_fallow,
            "yield_maund_bigha": y_mb,
            "yield_t_ha": round(y_tha, 2),
            "price_bdt_maund": price_m,
            "price_source": price_source,
            "price_source_en": price_source_en,
            "is_custom_price": is_custom,
            "revenue": season_rev,
            "cost": season_cost,
            "profit": season_profit,
            "revenue_ha": round(rev_ha),
            "cost_ha": round(cost_ha),
            "profit_ha": round(margin_ha),
            "break_even_price_maund": break_even,
            "margin_status": "profit" if season_profit > 0 else ("loss" if season_profit < 0 else "neutral"),
        })

    # 2. Yearly Totals (Current vs Plan)
    base_profit_ha = float(milp_res.get("baseline_profit_bdt") or 0.0)
    plan_profit_ha = float(milp_res.get("plan_profit_bdt") or 0.0)
    delta_profit_ha = float(milp_res.get("profit_delta_bdt") or round(plan_profit_ha - base_profit_ha, 0))

    current_profit_field = int(round(base_profit_ha * area))
    plan_profit_field = int(round(plan_profit_ha * area))
    delta_profit_field = int(round(delta_profit_ha * area))

    yearly_totals = {
        "current_profit_bdt_ha": base_profit_ha,
        "current_profit_field": current_profit_field,
        "plan_profit_bdt_ha": plan_profit_ha,
        "plan_profit_field": plan_profit_field,
        "delta_profit_bdt_ha": delta_profit_ha,
        "delta_profit_field": delta_profit_field,
        "custom_price_count": custom_price_count,
        "catalogue_price_count": catalogue_price_count,
        "area_ha": area,
        "area_bigha": area_bigha,
    }

    # 3. Price Sensitivity (-20% and +20% recomputed)
    # Holding yield and cost constant, sensitivity strictly reflects price shocks
    total_plan_rev_ha = sum(s["revenue_ha"] for s in seasons_data)
    total_plan_cost_ha = sum(s["cost_ha"] for s in seasons_data)

    downside_profit_ha = round((total_plan_rev_ha * 0.80 - total_plan_cost_ha) / num_years, 0)
    upside_profit_ha = round((total_plan_rev_ha * 1.20 - total_plan_cost_ha) / num_years, 0)

    downside_profit_field = int(round(downside_profit_ha * area))
    upside_profit_field = int(round(upside_profit_ha * area))

    # Riskiest crop: the crop whose -20% price drops profit the most
    riskiest_crop_info = None
    max_drop = -1.0
    for crop_name, c_rev_ha in plan_crop_rev_ha.items():
        if crop_name.lower() == "fallow":
            continue
        c_rev_yr_field = (c_rev_ha / num_years) * area
        drop_bdt = round(c_rev_yr_field * 0.20)
        if drop_bdt > max_drop:
            max_drop = drop_bdt
            c_bn = CROP_NAMES_BN.get(crop_name, crop_name)
            riskiest_crop_info = {
                "crop": crop_name,
                "crop_bn": c_bn,
                "crop_en": crop_name,
                "annual_revenue_field": int(round(c_rev_yr_field)),
                "profit_drop_field": int(drop_bdt),
                "reason_bn": f"{c_bn}-এর মোট বাজার আয় বেশি হওয়ায় এর দাম ২০% কমলে বার্ষিক মুনাফায় সর্বোচ্চ {int(drop_bdt):,} টাকা ঝুঁকি সৃষ্টি হয়।",
                "reason_en": f"{crop_name} represents the largest revenue exposure; a 20% price reduction reduces annual farm profit by {int(drop_bdt):,} BDT.",
            }

    price_sensitivity = {
        "downside_20_profit_bdt_ha": downside_profit_ha,
        "downside_20_profit_field": downside_profit_field,
        "normal_profit_bdt_ha": plan_profit_ha,
        "normal_profit_field": plan_profit_field,
        "upside_20_profit_bdt_ha": upside_profit_ha,
        "upside_20_profit_field": upside_profit_field,
        "current_rotation_profit_field": current_profit_field,
        "riskiest_crop": riskiest_crop_info,
    }

    # 4. Current Rotation (Baseline) Seasons
    baseline_seasons_raw = (milp_res.get("baseline_comparison") or {}).get("baseline_seasons", [])
    current_seasons_data = []
    for b_s in baseline_seasons_raw:
        c_name = b_s.get("crop")
        is_fal = not c_name or c_name.lower() == "fallow"
        s_cd = b_s.get("season") or "S1"
        b_prof_ha = float(b_s.get("profit_bdt_ha") or 0.0)
        b_prof_field = int(round(b_prof_ha * area))

        # Pull catalogue yield and price for baseline crop
        cat_e = cat_crops_map.get(c_name.lower(), {}) if c_name else {}
        b_y_tha = float(cat_e.get("default_yield_t_ha", 3.0)) if not is_fal else 0.0
        b_y_mb = round(b_y_tha * MAUND_BIGHA_PER_T_HA, 1)
        b_p_m = float(cat_e.get("farmgate_bdt_maund", 1120.0)) if not is_fal else 0.0

        b_rev_ha = round(b_y_tha * (b_p_m * (KG_PER_TON / KG_PER_MAUND))) if not is_fal else 0.0
        b_cost_ha = round(b_rev_ha - b_prof_ha) if not is_fal else 0.0
        b_cost_bigha = b_cost_ha * HA_PER_BIGHA
        b_break_even = round(b_cost_bigha / b_y_mb, 1) if b_y_mb > 0 else 0.0

        b_rev = int(round(b_rev_ha * area))
        b_cost = int(round(b_cost_ha * area))
        b_profit = b_rev - b_cost

        current_seasons_data.append({
            "period": b_s.get("period"),
            "season_code": s_cd,
            "season_name_bn": season_names_map.get(s_cd, {}).get("bn", "রবি"),
            "season_name_en": season_names_map.get(s_cd, {}).get("en", "Rabi"),
            "crop": c_name or "Fallow",
            "crop_bn": b_s.get("crop_bn") or (CROP_NAMES_BN.get(c_name, c_name) if c_name else "পতিত"),
            "crop_en": c_name or "Fallow",
            "yield_maund_bigha": b_y_mb,
            "price_bdt_maund": b_p_m,
            "revenue": b_rev,
            "cost": b_cost,
            "profit": b_profit,
            "break_even_price_maund": b_break_even,
        })

    # 5. Adaptive Outcomes Section
    actual_records = []
    if hist_records:
        for hr in hist_records:
            if hr.get("yield_ton_per_ha") is not None or hr.get("price_bdt_per_maund") is not None:
                actual_records.append({
                    "year": hr.get("year"),
                    "season": hr.get("season"),
                    "crop": hr.get("crop"),
                    "crop_bn": CROP_NAMES_BN.get(hr.get("crop"), hr.get("crop")),
                    "actual_yield_ton_ha": hr.get("yield_ton_per_ha"),
                    "actual_yield_maund_bigha": round(float(hr["yield_ton_per_ha"]) * MAUND_BIGHA_PER_T_HA, 1) if hr.get("yield_ton_per_ha") else None,
                    "actual_price_bdt_maund": hr.get("price_bdt_per_maund"),
                })

    adaptive_outcomes = {
        "has_records": len(actual_records) > 0,
        "records": actual_records,
        "callout_bn": "মৌসুম শেষে আসল ফলন ও দাম দিন -> অভিযোজিত পুনঃপরিকল্পনা",
        "callout_en": "Record actual seasonal yield and price -> Adaptive replanning",
    }

    # 6. Reference Catalogue Table (collapsed in UI)
    ref_table = []
    for c in mkt_overview.get("crops", []):
        ref_table.append({
            "crop": c["crop"],
            "name_bn": c.get("name_bn") or CROP_NAMES_BN.get(c["crop"], c["crop"]),
            "name_en": c.get("name_en") or c["crop"],
            "farmgate_bdt_maund": c.get("farmgate_bdt_maund"),
            "farmgate_bdt_kg": c.get("farmgate_bdt_kg"),
            "retail_bdt_kg": c.get("retail_bdt_kg"),
            "source": c.get("source") or "DAM",
            "source_date": c.get("source_date") or "2025",
            "disclaimer_bn": "স্থির তালিকা, লাইভ নয়",
            "disclaimer_en": "Static benchmark, not live",
        })

    strategy_names = {
        "balanced": {"bn": "সুষম", "en": "Balanced"},
        "profit": {"bn": "লাভজনক", "en": "Profit-focused"},
        "water": {"bn": "পানি সাশ্রয়ী", "en": "Water-saving"},
        "soil": {"bn": "মাটি সমৃদ্ধ", "en": "Soil health"},
    }

    return {
        "status": "ok",
        "field": {
            "id": f_info["field_id"],
            "name": f_info["name"],
            "name_en": f_info["name_en"],
            "district": dist_key,
            "latitude": lat,
            "longitude": lon,
            "area_ha": area,
            "area_bigha": area_bigha,
            "soil_texture": f_info["soil_texture"],
        },
        "strategy": strat_norm,
        "strategy_label_bn": strategy_names.get(strat_norm, {}).get("bn", "সুষম"),
        "strategy_label_en": strategy_names.get(strat_norm, {}).get("en", "Balanced"),
        "yearly_totals": yearly_totals,
        "price_sensitivity": price_sensitivity,
        "seasons": seasons_data,
        "current_seasons": current_seasons_data,
        "adaptive_outcomes": adaptive_outcomes,
        "reference_catalogue": ref_table,
    }
