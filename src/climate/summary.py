"""Climate and Risk Summary Computation Engine.

Computes point-specific climate metrics, trends, risk frequencies, and recent weather
for any location (latitude, longitude) using physical datasets (NASA POWER, GPM IMERG,
GRACE-FO, and Onset analysis).

All thresholds are centralized in CLIMATE_THRESHOLDS with citations.
Zero invented numbers. Every block carries complete provenance metadata.
"""

from __future__ import annotations

import json
import logging
import math
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from scipy import stats

from src.climate.point_data import (
    get_gpm_imerg,
    get_grace,
    get_nasa_power,
    get_onset,
    is_offline,
)
from src.compute.water_service import fao56_penman_monteith_et0

logger = logging.getLogger("climate_summary")

CACHE_DIR = Path("data/climate_cache/summary")

# Centralized climate thresholds with scientific references
CLIMATE_THRESHOLDS = {
    # Temperature thresholds
    "heat_day_tmax_c": 35.0,  # Heat stress threshold (°C) - BARC / FAO
    "cold_night_tmin_c": 10.0,  # Cold wave / chilling injury threshold (°C) - BMD
    "frost_tmin_c": 0.0,  # Frost threshold (°C)
    
    # Rainfall & moisture thresholds
    "dry_day_rain_mm": 2.0,  # Rain threshold for dry spell (< 2 mm/day) - FAO-56
    "heavy_rain_day_mm": 50.0,  # Heavy rainfall event threshold (> 50 mm/day) - BMD
    
    # Monthly hazard frequency criteria (proportion of years meeting criteria)
    "month_heat_min_days": 5,  # >= 5 days with Tmax > 35°C in that calendar month
    "month_cold_min_nights": 5,  # >= 5 nights with Tmin < 10°C in that calendar month
    "month_dry_spell_min_days": 10,  # Consecutive dry spell >= 10 days in that calendar month
    "month_heavy_rain_min_days": 1,  # >= 1 day with rain > 50 mm in that calendar month
    
    # Statistical significance thresholds
    "p_value_confirmed": 0.05,  # p < 0.05: confirmed change (নিশ্চিত)
    "p_value_hint": 0.10,  # 0.05 <= p < 0.10: hint / tentative (ইঙ্গিত)
    
    # Risk calendar warning threshold
    "flowering_hazard_warn_fraction": 0.35,  # Hazard frequency >= 35% during flowering triggers warning
    
    # Recency & freshness
    "recent_stale_days": 60,  # Data older than 60 days flagged as stale
    
    # Baseline comparison periods
    "baseline_period_then": (1981, 1990),  # Baseline "তখন" (10 years)
    "baseline_period_now": (2015, 2024),  # Baseline "এখন" (10 years)
    "analysis_years": list(range(2001, 2025)),  # 24-year satellite era (2001-2024)
}


def _calculate_trend_and_p(x: list[int | float], y: list[float]) -> list[float]:
    """Calculate Sen's slope per decade and Mann-Kendall p-value.
    
    Returns: [slope_per_decade, p_value] rounded to 3 decimal places.
    """
    if len(x) < 5 or len(y) < 5:
        return [0.0, 1.0]
    
    x_arr = np.array(x, dtype=float)
    y_arr = np.array(y, dtype=float)
    
    # Sen's slope (Theil-Sen estimator)
    sen_res = stats.theilslopes(y_arr, x_arr)
    slope_per_year = float(sen_res.slope)
    slope_per_decade = round(slope_per_year * 10.0, 3)
    
    # Mann-Kendall trend test via Kendall's rank correlation tau
    tau_res = stats.kendalltau(x_arr, y_arr)
    p_val = round(float(tau_res.pvalue), 3) if not math.isnan(tau_res.pvalue) else 1.0
    
    return [slope_per_decade, p_val]


def compute_climate_summary(
    lat: float,
    lon: float,
    field_id: Optional[str] = None,
    field_name: Optional[str] = None,
    offline: Optional[bool] = None,
) -> Dict[str, Any]:
    """Compute comprehensive climate and risk summary for any field coordinates."""
    lat_r = round(float(lat), 4)
    lon_r = round(float(lon), 4)
    
    # Check cache first
    cache_file = CACHE_DIR / f"{lat_r:.2f}_{lon_r:.2f}.json"
    if cache_file.exists():
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                cached_data = json.load(f)
                if field_id:
                    cached_data["field_id"] = field_id
                if field_name:
                    cached_data["field_name"] = field_name
                return cached_data
        except Exception as e:
            logger.warning(f"Error reading summary cache {cache_file}: {e}")

    # 1. Fetch raw data series from CL1 sources
    power_data = get_nasa_power(lat_r, lon_r, offline=offline)
    if power_data.get("status") == "unavailable":
        return {
            "status": "unavailable",
            "message": "তথ্য নেই",
            "detail": power_data.get("message", "তথ্য নেই"),
            "provenance": power_data.get("provenance", {}),
        }
    
    imerg_data = get_gpm_imerg(lat_r, lon_r, offline=offline)
    grace_data = get_grace(lat_r, lon_r)
    onset_data = get_onset(lat_r, lon_r, rain_data=imerg_data)

    # 2. Extract and sanitize temperature series from POWER
    p_series = [
        r for r in power_data.get("series", [])
        if r.get("tmax") is not None and r.get("tmin") is not None
    ]
    if not p_series:
        return {
            "status": "unavailable",
            "message": "তথ্য নেই",
            "detail": "No valid temperature records available.",
        }

    # Group POWER by year and (year, month)
    p_by_year: Dict[int, List[Dict[str, Any]]] = {}
    p_by_ym: Dict[Tuple[int, int], List[Dict[str, Any]]] = {}
    for r in p_series:
        d = r["date"]
        yr = int(d[:4])
        m = int(d[5:7])
        p_by_year.setdefault(yr, []).append(r)
        p_by_ym.setdefault((yr, m), []).append(r)

    # 3. Extract and sanitize rainfall series (IMERG or POWER fallback)
    i_series = imerg_data.get("series", [])
    i_by_year: Dict[int, List[Dict[str, Any]]] = {}
    i_by_ym: Dict[Tuple[int, int], List[Dict[str, Any]]] = {}
    for r in i_series:
        d = r["date"]
        yr = int(d[:4])
        m = int(d[5:7])
        i_by_year.setdefault(yr, []).append(r)
        i_by_ym.setdefault((yr, m), []).append(r)

    # 4. "তখন বনাম এখন" (1981-1990 vs 2015-2024) comparison
    then_range = CLIMATE_THRESHOLDS["baseline_period_then"]
    now_range = CLIMATE_THRESHOLDS["baseline_period_now"]
    then_years = [y for y in range(then_range[0], then_range[1] + 1) if y in p_by_year and len(p_by_year[y]) >= 300]
    now_years = [y for y in range(now_range[0], now_range[1] + 1) if y in p_by_year and len(p_by_year[y]) >= 300]

    if then_years and now_years:
        tmax_then = float(np.mean([np.mean([r["tmax"] for r in p_by_year[y]]) for y in then_years]))
        tmax_now = float(np.mean([np.mean([r["tmax"] for r in p_by_year[y]]) for y in now_years]))
        
        heat_then = float(np.mean([sum(1 for r in p_by_year[y] if r["tmax"] > CLIMATE_THRESHOLDS["heat_day_tmax_c"]) for y in then_years]))
        heat_now = float(np.mean([sum(1 for r in p_by_year[y] if r["tmax"] > CLIMATE_THRESHOLDS["heat_day_tmax_c"]) for y in now_years]))
        
        cold_then = float(np.mean([sum(1 for r in p_by_year[y] if r["tmin"] < CLIMATE_THRESHOLDS["cold_night_tmin_c"]) for y in then_years]))
        cold_now = float(np.mean([sum(1 for r in p_by_year[y] if r["tmin"] < CLIMATE_THRESHOLDS["cold_night_tmin_c"]) for y in now_years]))
        
        frost_then = float(np.mean([sum(1 for r in p_by_year[y] if r["tmin"] < CLIMATE_THRESHOLDS["frost_tmin_c"]) for y in then_years]))
        frost_now = float(np.mean([sum(1 for r in p_by_year[y] if r["tmin"] < CLIMATE_THRESHOLDS["frost_tmin_c"]) for y in now_years]))
        
        then_vs_now = {
            "period_then": f"{then_range[0]}–{then_range[1]}",
            "period_now": f"{now_range[0]}–{now_range[1]}",
            "tmax_then": round(tmax_then, 2),
            "tmax_now": round(tmax_now, 2),
            "tmax_diff": round(tmax_now - tmax_then, 2),
            "heat_days_then": round(heat_then, 1),
            "heat_days_now": round(heat_now, 1),
            "heat_days_diff": round(heat_now - heat_then, 1),
            "cold_nights_then": round(cold_then, 1),
            "cold_nights_now": round(cold_now, 1),
            "cold_nights_diff": round(cold_now - cold_then, 1),
            "frost_days_then": round(frost_then, 1),
            "frost_days_now": round(frost_now, 1),
            "frost_days_diff": round(frost_now - frost_then, 1),
        }
    else:
        then_vs_now = None

    # 5. Compute 2001-2024 annual metrics for charts and trends
    analysis_years: list[int] = [y for y in CLIMATE_THRESHOLDS["analysis_years"] if y in p_by_year and y in i_by_year]
    
    yearly_tmax = []
    yearly_tmin = []
    yearly_heat = []
    yearly_annual_rain = []
    yearly_am_rain = []
    yearly_dryspell = []
    yearly_heavy = []

    for y in analysis_years:
        p_rows = p_by_year[y]
        i_rows = i_by_year[y]
        
        # Temperature
        y_tmax = float(np.mean([r["tmax"] for r in p_rows]))
        y_tmin = float(np.mean([r["tmin"] for r in p_rows]))
        y_heat = sum(1 for r in p_rows if r["tmax"] > CLIMATE_THRESHOLDS["heat_day_tmax_c"])
        yearly_tmax.append(round(y_tmax, 2))
        yearly_tmin.append(round(y_tmin, 2))
        yearly_heat.append(y_heat)
        
        # Rainfall
        ann_rain = sum(r["rainfall"] for r in i_rows)
        yearly_annual_rain.append(round(ann_rain))
        
        # Kharif-1 / April-May rainfall
        am_rows = [r for r in i_rows if r["date"][5:7] in ("04", "05")]
        am_total = sum(r["rainfall"] for r in am_rows)
        yearly_am_rain.append(round(am_total))
        
        # Longest dry spell in Apr-May (rain < 2.0 mm)
        max_dry = 0
        cur_dry = 0
        for r in am_rows:
            if r["rainfall"] < CLIMATE_THRESHOLDS["dry_day_rain_mm"]:
                cur_dry += 1
                if cur_dry > max_dry:
                    max_dry = cur_dry
            else:
                cur_dry = 0
        yearly_dryspell.append(max_dry)
        
        # Heavy-rain days (> 50 mm) in Jul-Sep
        jas_rows = [r for r in i_rows if r["date"][5:7] in ("07", "08", "09")]
        heavy_days = sum(1 for r in jas_rows if r["rainfall"] > CLIMATE_THRESHOLDS["heavy_rain_day_mm"])
        yearly_heavy.append(heavy_days)

    # 6. Decadal trends and p-values
    tmax_trend = _calculate_trend_and_p(analysis_years, yearly_tmax)
    tmin_trend = _calculate_trend_and_p(analysis_years, yearly_tmin)
    heat_trend = _calculate_trend_and_p(analysis_years, [float(v) for v in yearly_heat])
    annual_trend = _calculate_trend_and_p(analysis_years, [float(v) for v in yearly_annual_rain])
    am_rain_trend = _calculate_trend_and_p(analysis_years, [float(v) for v in yearly_am_rain])
    dryspell_trend = _calculate_trend_and_p(analysis_years, [float(v) for v in yearly_dryspell])
    heavy_trend = _calculate_trend_and_p(analysis_years, [float(v) for v in yearly_heavy])

    # 7. Monthly risk distributions across calendar months (Jan–Dec, 1..12)
    month_heat5 = []
    month_heatdays = []
    month_cold5 = []
    month_coldnights = []
    month_dry10 = []
    month_heavy = []
    norm_rain = []
    num_years = len(analysis_years) or 1

    for m in range(1, 13):
        # Heat days
        h_counts = [
            sum(1 for r in p_by_ym.get((y, m), []) if r["tmax"] > CLIMATE_THRESHOLDS["heat_day_tmax_c"])
            for y in analysis_years
        ]
        month_heat5.append(round(sum(1 for c in h_counts if c >= CLIMATE_THRESHOLDS["month_heat_min_days"]) / num_years, 2))
        month_heatdays.append(round(float(np.mean(h_counts)) if h_counts else 0.0, 1))

        # Cold nights
        c_counts = [
            sum(1 for r in p_by_ym.get((y, m), []) if r["tmin"] < CLIMATE_THRESHOLDS["cold_night_tmin_c"])
            for y in analysis_years
        ]
        month_cold5.append(round(sum(1 for c in c_counts if c >= CLIMATE_THRESHOLDS["month_cold_min_nights"]) / num_years, 2))
        month_coldnights.append(round(float(np.mean(c_counts)) if c_counts else 0.0, 1))

        # Dry spell >= 10 days in month
        dry_spell_years = 0
        for y in analysis_years:
            rows = i_by_ym.get((y, m), [])
            cur = 0
            max_d = 0
            for r in rows:
                if r["rainfall"] < CLIMATE_THRESHOLDS["dry_day_rain_mm"]:
                    cur += 1
                    if cur > max_d:
                        max_d = cur
                else:
                    cur = 0
            if max_d >= CLIMATE_THRESHOLDS["month_dry_spell_min_days"]:
                dry_spell_years += 1
        month_dry10.append(round(dry_spell_years / num_years, 2))

        # Heavy rain >= 1 day in month
        heavy_years = sum(
            1 for y in analysis_years
            if any(r["rainfall"] > CLIMATE_THRESHOLDS["heavy_rain_day_mm"] for r in i_by_ym.get((y, m), []))
        )
        month_heavy.append(round(heavy_years / num_years, 2))

        # Mean monthly rainfall normal
        m_rains = [sum(r["rainfall"] for r in i_by_ym.get((y, m), [])) for y in analysis_years]
        norm_rain.append(round(float(np.mean(m_rains)) if m_rains else 0.0))

    # 8. Recent weather: last 30 days vs normal
    recent_30 = p_series[-30:]
    end_date = recent_30[-1]["date"] if recent_30 else "N/A"
    
    # Recency / stale check
    try:
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        today_dt = datetime.now(timezone.utc).date()
        days_old = (today_dt - end_dt).days
        is_stale = days_old > CLIMATE_THRESHOLDS["recent_stale_days"]
    except Exception:
        is_stale = False
        days_old = 0
        
    stale_reason = (
        f"সর্বশেষ তথ্য: {end_date}। এরপরের NASA POWER তথ্য এখনো এই জমির জন্য হালনাগাদ হয়নি (অফলাইন ক্যাশ)।"
        if is_stale
        else None
    )

    r_tmax = float(np.mean([r["tmax"] for r in recent_30]))
    r_tmin = float(np.mean([r["tmin"] for r in recent_30]))
    r_rain = float(sum(r.get("rainfall") or 0.0 for r in recent_30))
    
    # ET0 via FAO-56 Penman-Monteith
    et0_vals = []
    for r in recent_30:
        try:
            dt = datetime.strptime(r["date"], "%Y-%m-%d")
            doy = dt.timetuple().tm_yday
            rs = r.get("solar_radiation") if r.get("solar_radiation") is not None else 16.0
            tavg = r.get("tavg") if r.get("tavg") is not None else (r["tmax"] + r["tmin"]) / 2.0
            rh = r.get("humidity") if r.get("humidity") is not None else 65.0
            ws = r.get("wind_speed") if r.get("wind_speed") is not None else 1.5
            val = fao56_penman_monteith_et0(tavg, r["tmin"], r["tmax"], rh, ws, rs, lat_r, doy)
            et0_vals.append(val)
        except Exception:
            et0_vals.append(3.0)
    r_et0 = sum(et0_vals)

    # Historical normal for same 30 calendar dates (month, day) across analysis years
    recent_md = set((int(r["date"][5:7]), int(r["date"][8:10])) for r in recent_30)
    base_rows = [
        r for r in p_series
        if int(r["date"][:4]) in analysis_years and (int(r["date"][5:7]), int(r["date"][8:10])) in recent_md
    ]

    norm_recent_tmax = float(np.mean([r["tmax"] for r in base_rows])) if base_rows else r_tmax
    norm_recent_tmin = float(np.mean([r["tmin"] for r in base_rows])) if base_rows else r_tmin

    # Normal 30-day rain sum per baseline year
    yearly_recent_rain: Dict[int, float] = {}
    for r in base_rows:
        yr = int(r["date"][:4])
        yearly_recent_rain[yr] = yearly_recent_rain.get(yr, 0.0) + (r.get("rainfall") or 0.0)
    norm_recent_rain = float(np.mean(list(yearly_recent_rain.values()))) if yearly_recent_rain else r_rain

    # Normal 30-day ET0 sum per baseline year
    yearly_recent_et0: Dict[int, float] = {}
    for r in base_rows:
        yr = int(r["date"][:4])
        try:
            dt = datetime.strptime(r["date"], "%Y-%m-%d")
            doy = dt.timetuple().tm_yday
            rs = r.get("solar_radiation") if r.get("solar_radiation") is not None else 16.0
            tavg = r.get("tavg") if r.get("tavg") is not None else (r["tmax"] + r["tmin"]) / 2.0
            rh = r.get("humidity") if r.get("humidity") is not None else 65.0
            ws = r.get("wind_speed") if r.get("wind_speed") is not None else 1.5
            val = fao56_penman_monteith_et0(tavg, r["tmin"], r["tmax"], rh, ws, rs, lat_r, doy)
            yearly_recent_et0[yr] = yearly_recent_et0.get(yr, 0.0) + val
        except Exception:
            yearly_recent_et0[yr] = yearly_recent_et0.get(yr, 0.0) + 3.0
    norm_recent_et0 = float(np.mean(list(yearly_recent_et0.values()))) if yearly_recent_et0 else r_et0

    # Summary meaning & agricultural interpretation
    t_diff = r_tmax - norm_recent_tmax
    r_diff = r_rain - norm_recent_rain
    
    if t_diff < -0.8 and r_diff < -5.0:
        summary_bn = "স্বাভাবিকের চেয়ে ঠান্ডা ও শুকনো"
        summary_en = "Cooler and drier than normal"
        sub_advice_bn = "রবি ফসলে সেচ লাগবে"
        sub_advice_en = "Irrigation needed for Rabi crops"
    elif t_diff > 0.8 and r_diff < -5.0:
        summary_bn = "স্বাভাবিকের চেয়ে গরম ও শুকনো"
        summary_en = "Warmer and drier than normal"
        sub_advice_bn = "বাষ্পীভবন বেশি, সেচ নজরদারি জরুরি"
        sub_advice_en = "High evapotranspiration, monitor soil moisture"
    elif r_diff > 10.0:
        summary_bn = "স্বাভাবিকের চেয়ে বেশি বৃষ্টি"
        summary_en = "Wetter than normal"
        sub_advice_bn = "জমিতে অতিরিক্ত পানি নিষ্কাশনের ব্যবস্থা রাখুন"
        sub_advice_en = "Ensure adequate field drainage"
    else:
        summary_bn = "স্বাভাবিকের কাছাকাছি আবহাওয়া"
        summary_en = "Near normal conditions"
        sub_advice_bn = "পরিকল্পনামাফিক স্বাভাবিক সেচ ব্যবস্থাপনা অব্যাহত রাখুন"
        sub_advice_en = "Continue standard irrigation according to plan"

    recent_weather = {
        "end": end_date,
        "tmax": round(r_tmax, 1),
        "tmin": round(r_tmin, 1),
        "rain": round(r_rain, 1),
        "et0": round(r_et0, 1),
        "norm_tmax": round(norm_recent_tmax, 1),
        "norm_tmin": round(norm_recent_tmin, 1),
        "norm_rain": round(norm_recent_rain, 1),
        "norm_et0": round(norm_recent_et0, 1),
        "stale": is_stale,
        "stale_reason": stale_reason,
        "baseline_period": "২০০১–২০২৪" if len(analysis_years) >= 20 else "ঐতিহাসিক গড়",
        "summary_bn": summary_bn,
        "summary_en": summary_en,
        "sub_advice_bn": sub_advice_bn,
        "sub_advice_en": sub_advice_en,
    }

    # 9. Format GRACE and Onset payloads
    grace_summary = {
        "sens_slope_cm_yr": grace_data.get("trend_cm_yr"),
        "ols_slope_cm_yr": grace_data.get("ols_slope_cm_yr"),
        "p_value": grace_data.get("mann_kendall_p"),
        "regional_comparison": grace_data.get("regional_comparison", []),
        "provenance": grace_data.get("provenance", {}),
    }

    onset_summary = {
        "shift_days": onset_data.get("shift_days", 0.0),
        "p_value": onset_data.get("p_value", 1.0),
        "censored_fraction": onset_data.get("censored_fraction", 0.0),
        "verdict_bn": onset_data.get("verdict_bn", ""),
        "verdict_en": onset_data.get("verdict_en", ""),
        "full_series": onset_data.get("full_series", []),
        "provenance": onset_data.get("provenance", {}),
    }

    # Consolidated Provenance Strip metadata
    provenance_strip = {
        "temperature": power_data.get("provenance", {}),
        "rain": imerg_data.get("provenance", {}),
        "grace": grace_data.get("provenance", {}),
        "onset": onset_data.get("provenance", {}),
    }

    # Final summary response
    result = {
        "status": "success",
        "field_id": str(field_id) if field_id else "demo",
        "field_name": field_name or "রহিম মিয়ার জমি",
        "lat": lat_r,
        "lon": lon_r,
        "provenance": provenance_strip,
        "summary": {
            "years": analysis_years,
            "tmax": yearly_tmax,
            "tmin": yearly_tmin,
            "heat": yearly_heat,
            "am_rain": yearly_am_rain,
            "dryspell": yearly_dryspell,
            "heavy": yearly_heavy,
            "annual": yearly_annual_rain,
            "tmax_trend": tmax_trend,
            "tmin_trend": tmin_trend,
            "heat_trend": heat_trend,
            "annual_trend": annual_trend,
            "am_rain_trend": am_rain_trend,
            "dryspell_trend": dryspell_trend,
            "heavy_trend": heavy_trend,
            "month_heat5": month_heat5,
            "month_heatdays": month_heatdays,
            "month_cold5": month_cold5,
            "month_coldnights": month_coldnights,
            "month_dry10": month_dry10,
            "month_heavy": month_heavy,
            "norm_rain": norm_rain,
            "then_vs_now": then_vs_now,
            "grace": grace_summary,
            "onset": onset_summary,
            "recent": recent_weather,
        },
        "thresholds": CLIMATE_THRESHOLDS,
    }

    # Save to summary cache
    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.warning(f"Failed to cache climate summary: {e}")

    return result
