"""Agro-climatic risk matrix evaluator for six-season planning.

Calculates authentic, field-specific risk distributions based on:
1. Drought: Share of years (IMERG 2001-2024) with a dry spell >= 7 days (< 2 mm) in Kharif-1 window.
2. Heavy Rain: Mean days/yr with > 50 mm in Jul-Sep (IMERG).
3. Heat Stress: Mean days/yr with T2M_MAX > 35 °C during crop flowering months (NASA POWER).
4. Late Monsoon: Share of years with Aman onset after 15 July. Shows censoring note if censoring > 30%.
5. Bare Soil Exposure: Bare days/yr from the planner for the baseline rotation vs the proposed plan.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Mapping, Sequence
import pandas as pd

from .agro import AgronomicConfig, compute_onset_series


def compute_planner_risk_suite(
    district: str,
    climate_df: pd.DataFrame,
    plan_rotation: Mapping[str, Any] | Sequence[str] | None,
    baseline_bare_days: int | float | None,
    plan_bare_days: int | float | None,
) -> dict[str, Any]:
    df = climate_df.copy()
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"])

    # Target historical climatology window: 2001-2024
    df_eval = df[(df["date"].dt.year >= 2001) & (df["date"].dt.year <= 2024)]
    years = sorted(df_eval["date"].dt.year.unique())
    n_years = len(years) or 24

    # 1. Drought: share of years with dry spell >= 7 consecutive days < 2 mm in Kharif-1 (April - May)
    k1_df = df_eval[df_eval["date"].dt.month.isin([4, 5])]
    drought_years_count = 0
    for y in years:
        y_rain = k1_df[k1_df["date"].dt.year == y]["rainfall"].tolist()
        streak = 0
        max_streak = 0
        for r in y_rain:
            if r < 2.0:
                streak += 1
                if streak > max_streak:
                    max_streak = streak
            else:
                streak = 0
        if max_streak >= 7:
            drought_years_count += 1

    drought_share = drought_years_count / n_years if n_years else 0.0
    drought_level = "low" if drought_share < 0.20 else ("medium" if drought_share <= 0.40 else "high")
    drought_color = "#10b981" if drought_level == "low" else ("#f59e0b" if drought_level == "medium" else "#ef4444")
    drought_bn = "কম" if drought_level == "low" else ("মাঝারি" if drought_level == "medium" else "উচ্চ")

    # 2. Heavy Rain: mean days/yr with > 50 mm in Jul-Sep (IMERG)
    monsoon_df = df_eval[df_eval["date"].dt.month.isin([7, 8, 9])]
    total_heavy_days = int((monsoon_df["rainfall"] > 50.0).sum())
    heavy_rain_mean = float(total_heavy_days) / n_years if n_years else 0.0
    heavy_rain_level = "low" if heavy_rain_mean < 2.0 else ("medium" if heavy_rain_mean <= 5.0 else "high")
    heavy_rain_color = "#10b981" if heavy_rain_level == "low" else ("#f59e0b" if heavy_rain_level == "medium" else "#ef4444")
    heavy_rain_bn = "কম" if heavy_rain_level == "low" else ("মাঝারি" if heavy_rain_level == "medium" else "উচ্চ")

    # 3. Heat Stress: mean days/yr with T2M_MAX > 35 °C in crop flowering months
    crops_set = set(plan_rotation.values()) if isinstance(plan_rotation, Mapping) else set(plan_rotation or [])
    flowering_months = set()
    for c in crops_set:
        c_low = str(c).lower()
        if "rice" in c_low or "dhan" in c_low:
            if "boro" in c_low:
                flowering_months.update([3, 4])
            else:
                flowering_months.update([9, 10])
        elif any(x in c_low for x in ["wheat", "lentil", "mustard", "chickpea", "potato"]):
            flowering_months.update([2, 3])
        elif any(x in c_low for x in ["mung", "aus", "sesame", "jute", "groundnut", "soybean"]):
            flowering_months.update([4, 5])
        else:
            flowering_months.update([3, 4, 9, 10])
    if not flowering_months:
        flowering_months = {2, 3, 4, 5, 9, 10}

    heat_df = df_eval[df_eval["date"].dt.month.isin(flowering_months)]
    tmax_col = "temp_max" if "temp_max" in heat_df.columns else ("T2M_MAX" if "T2M_MAX" in heat_df.columns else "temperature")
    total_heat_days = int((heat_df[tmax_col] > 35.0).sum())
    heat_days_mean = float(total_heat_days) / n_years if n_years else 0.0
    heat_level = "low" if heat_days_mean < 5.0 else ("medium" if heat_days_mean <= 15.0 else "high")
    heat_color = "#10b981" if heat_level == "low" else ("#f59e0b" if heat_level == "medium" else "#ef4444")
    heat_bn = "কম" if heat_level == "low" else ("মাঝারি" if heat_level == "medium" else "উচ্চ")

    # 4. Late Monsoon: share of years with Aman onset after 15 July
    onset_file = Path("data/onset_analysis_64.json")
    censored_fraction = 0.0
    if onset_file.exists():
        try:
            with open(onset_file, "r", encoding="utf-8") as f:
                onset_meta = json.load(f)
            district_map = {d["district"]: d for d in onset_meta.get("districts", [])}
            dist_info = district_map.get(district.lower(), {})
            censored_fraction = float(dist_info.get("aman", {}).get("censored_fraction", 0.0))
        except Exception:
            pass

    is_censored = censored_fraction > 0.30

    cfg = AgronomicConfig()
    onset_res = compute_onset_series(df, cfg)
    valid_onsets = [
        x for x in onset_res.get("full_series", [])
        if x.get("doy") is not None and 2001 <= x.get("year", 0) <= 2024
    ]
    after_15jul = [x for x in valid_onsets if str(x.get("onset_date", ""))[5:] > "07-15"]
    late_share = len(after_15jul) / len(valid_onsets) if valid_onsets else 0.0
    late_level = "low" if late_share < 0.20 else ("medium" if late_share <= 0.40 else "high")

    # 5. Bare Soil Exposure Days
    plan_bare = int(plan_bare_days if plan_bare_days is not None else 60)
    base_bare = int(baseline_bare_days if baseline_bare_days is not None else 115)
    bare_level = "low" if plan_bare < 30 else ("medium" if plan_bare <= 90 else "high")
    bare_color = "#10b981" if bare_level == "low" else ("#f59e0b" if bare_level == "medium" else "#ef4444")
    bare_bn = "কম" if bare_level == "low" else ("মাঝারি" if bare_level == "medium" else "উচ্চ")

    return {
        "drought": {
            "id": "drought",
            "labelBn": "খরা ঝুঁকি",
            "labelEn": "Drought Risk",
            "level": drought_level,
            "levelBn": drought_bn,
            "color": drought_color,
            "value_pct": round(drought_share * 100, 1),
            "years_affected": drought_years_count,
            "total_years": n_years,
            "whyBn": f"{n_years} বছরের মধ্যে {drought_years_count} বছর খরিফ-১-এ ≥৭ দিন শুকনো (বৃষ্টি <২ মিমি)",
            "whyEn": f"{drought_years_count} of {n_years} years experienced a ≥7-day dry spell (<2 mm) during Kharif-1",
        },
        "heavy_rain": {
            "id": "heavy_rain",
            "labelBn": "অতিবৃষ্টি ঝুঁকি",
            "labelEn": "Heavy Rain Risk",
            "level": heavy_rain_level,
            "levelBn": heavy_rain_bn,
            "color": heavy_rain_color,
            "days_per_year": round(heavy_rain_mean, 1),
            "whyBn": f"জুলাই–সেপ্টেম্বরে বছরে গড়ে {round(heavy_rain_mean, 1)} দিন অতিবৃষ্টি (>৫০ মিমি)",
            "whyEn": f"Average of {round(heavy_rain_mean, 1)} days/year with >50 mm rain in Jul-Sep",
        },
        "heat": {
            "id": "heat",
            "labelBn": "তাপপ্রবাহ ঝুঁকি",
            "labelEn": "Heat Stress Risk",
            "level": heat_level,
            "levelBn": heat_bn,
            "color": heat_color,
            "days_per_year": round(heat_days_mean, 1),
            "flowering_months": sorted(flowering_months),
            "whyBn": f"ফসল ফোটার মৌসুমে বছরে গড়ে {round(heat_days_mean, 1)} দিন তাপমাত্রা >৩৫°C",
            "whyEn": f"Average of {round(heat_days_mean, 1)} days/year exceeding 35°C during crop flowering",
        },
        "late_monsoon": {
            "id": "late_monsoon",
            "labelBn": "বর্ষা বিলম্ব",
            "labelEn": "Late Monsoon",
            "is_censored": is_censored,
            "level": "censored" if is_censored else late_level,
            "levelBn": "সেন্সরড" if is_censored else ("কম" if late_level == "low" else ("মাঝারি" if late_level == "medium" else "উচ্চ")),
            "color": "#94a3b8" if is_censored else ("#10b981" if late_level == "low" else ("#f59e0b" if late_level == "medium" else "#ef4444")),
            "share_late_pct": round(late_share * 100, 1),
            "whyBn": (
                f"বৃষ্টিপাতে অনসেট সেন্সরড ({round(censored_fraction * 100)}% বছর); স্থানীয় আবহাওয়া ও কৃষি কর্মকর্তার পরামর্শ আবশ্যক"
                if is_censored
                else f"{len(valid_onsets)} বছরের মধ্যে {len(after_15jul)} বছর ১৫ জুলাইয়ের পর বর্ষা শুরু ({round(late_share * 100, 1)}%)"
            ),
            "whyEn": (
                f"Monsoon onset censored in {round(censored_fraction * 100)}% of years; use local BRRI advisory"
                if is_censored
                else f"{len(after_15jul)} of {len(valid_onsets)} years had Aman onset after 15 July ({round(late_share * 100, 1)}%)"
            ),
        },
        "bare_soil": {
            "id": "bare_soil",
            "labelBn": "পতিত মাটি ঝুঁকি",
            "labelEn": "Bare Soil Risk",
            "level": bare_level,
            "levelBn": bare_bn,
            "color": bare_color,
            "plan_bare_days": plan_bare,
            "baseline_bare_days": base_bare,
            "whyBn": f"বিদ্যমান আবর্তনে বছরে {base_bare} দিন নগ্ন মাটি, প্রস্তাবিত আবর্তনে {plan_bare} দিন",
            "whyEn": f"{base_bare} bare days/yr in current rotation vs {plan_bare} days/yr in plan",
        },
    }
