"""FieldShift Climate Stress Testing Engine.

Evaluates the physical and economic vulnerability of a 6-season rotation plan
against 5 physical climate hazards:
1. Heatwave (Tmax exceedance during sensitive phenological window)
2. Drought (FAO-56 daily water balance + FAO-33 water-yield response)
3. Flood / Waterlogging (submergence duration vs crop tolerance)
4. Coldwave (Tmin chill deficit in sensitive phenological window)
5. Salinity (Maas-Hoffman soil ECe threshold and slope, FAO-29)

Does NOT synthesize a new rotation plan. Evaluates risk and impact on the
plan chosen by the farmer, compares with baseline rotation, and offers a
bridge to Adaptive Replan.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd

from src.compute.advisory_service import DISTRICT_REGISTRY, load_district_climate_data
from src.data.crops import load_crop_knowledge
from src.optimizer.dynamic_agronomy import COASTAL_SALINE_DISTRICTS

logger = logging.getLogger("climate_stress")

_STRESS_PARAMS_PATH = Path("data/crops/crop_stress_params.json")
_STRESS_PARAMS_CACHE: Optional[dict[str, Any]] = None

CANONICAL_PERIODS = ["Y1_S1", "Y1_S2", "Y1_S3", "Y2_S1", "Y2_S2", "Y2_S3"]

PERIOD_TO_SEASON_CODE = {
    "Y1_S1": "rabi",
    "Y1_S2": "kharif1",
    "Y1_S3": "kharif2",
    "Y2_S1": "rabi",
    "Y2_S2": "kharif1",
    "Y2_S3": "kharif2",
}

PERIOD_LABELS = {
    "Y1_S1": {"bn": "১ম বছর · রবি (শীতকাল)", "en": "Year 1 · Rabi (Winter)"},
    "Y1_S2": {"bn": "১ম বছর · খরিপ-১ (গ্রীষ্ম)", "en": "Year 1 · Kharif-1 (Summer)"},
    "Y1_S3": {"bn": "১ম বছর · খরিপ-২ (বর্ষা)", "en": "Year 1 · Kharif-2 (Monsoon)"},
    "Y2_S1": {"bn": "২য় বছর · রবি (শীতকাল)", "en": "Year 2 · Rabi (Winter)"},
    "Y2_S2": {"bn": "২য় বছর · খরিপ-১ (গ্রীষ্ম)", "en": "Year 2 · Kharif-1 (Summer)"},
    "Y2_S3": {"bn": "২য় বছর · খরিপ-২ (বর্ষা)", "en": "Year 2 · Kharif-2 (Monsoon)"},
}

SCENARIO_CONFIGS = {
    "heatwave": {
        "id": "heatwave",
        "icon": "🔥",
        "name_bn": "তাপপ্রবাহ",
        "name_en": "Heatwave",
        "impact_summary_bn": "ফুল ও পরাগ নষ্ট",
        "impact_summary_en": "Pollen sterility & flower drop",
        "default_period_keys": ["Y1_S2", "Y2_S2", "Y1_S1", "Y2_S1"],
        "default_season_codes": ["kharif1", "rabi"],
        "intensities": {
            "mild": {
                "tmax_delta": 2.0,
                "duration_days": 5,
                "label_bn": "Tmax +২°C, ৫ দিন",
                "label_en": "Tmax +2°C, 5 days",
            },
            "moderate": {
                "tmax_delta": 4.0,
                "duration_days": 7,
                "label_bn": "Tmax +৪°C, ৭ দিন",
                "label_en": "Tmax +4°C, 7 days",
            },
            "severe": {
                "tmax_delta": 6.0,
                "duration_days": 10,
                "label_bn": "Tmax +৬°C, ১০ দিন",
                "label_en": "Tmax +6°C, 10 days",
            },
        },
        "mitigation": [
            {
                "title_bn": "উত্তাপ-সহনশীল জাত নির্বাচন",
                "title_en": "Heat-Tolerant Variety Selection",
                "text_bn": "গমের ক্ষেত্রে বারি গম-৩৩ বা ধানের ক্ষেত্রে ব্রি ধান৮৯/৯২ চাষ করুন (BARI/BRRI)।",
                "text_en": "Plant heat-tolerant varieties such as BARI Gom-33 (wheat) or BRRI dhan89/92 (BARI/BRRI).",
            },
            {
                "title_bn": "বপনের তারিখ সমন্বয়",
                "title_en": "Sowing Date Adjustment",
                "text_bn": "রবি ফসল ১৫ নভেম্বরের মধ্যে এবং খরিপ-১ ফসল মার্চের প্রথম সপ্তাহে বপন করুন যাতে তীব্র তাপের আগেই পরাগায়ন সম্পন্ন হয়।",
                "text_en": "Sow Rabi crops by Nov 15 and Kharif-1 by early March so pollination completes before peak April heatwaves.",
            },
            {
                "title_bn": "ফুল ফোটার সময় হালকা সেচ",
                "title_en": "Micro-Irrigation During Anthesis",
                "text_bn": "তীব্র গরমের দিনে বিকেলে জমিতে হালকা সেচ দিলে মাইক্রোক্লাইমেট ২-৩°C শীতল থাকে এবং পরাগ রক্ষা পায়।",
                "text_en": "Apply light evening irrigation during bloom to cool the canopy microclimate by 2-3°C and preserve pollen viability.",
            },
        ],
    },
    "drought": {
        "id": "drought",
        "icon": "🌵",
        "name_bn": "খরা",
        "name_en": "Drought",
        "impact_summary_bn": "মাটির রস কমে, পানির চাপ",
        "impact_summary_en": "Soil moisture deficit & water stress",
        "default_period_keys": ["Y1_S1", "Y1_S2", "Y2_S1", "Y2_S2"],
        "default_season_codes": ["rabi", "kharif1"],
        "intensities": {
            "mild": {
                "rain_delta_pct": -30.0,
                "irrig_multiplier": 0.70,
                "label_bn": "বৃষ্টি -৩০%, সেচ ক্ষমতা ৭০%",
                "label_en": "Rain -30%, Irrigation 70%",
            },
            "moderate": {
                "rain_delta_pct": -50.0,
                "irrig_multiplier": 0.50,
                "label_bn": "বৃষ্টি -৫০%, সেচ ক্ষমতা ৫০%",
                "label_en": "Rain -50%, Irrigation 50%",
            },
            "severe": {
                "rain_delta_pct": -70.0,
                "irrig_multiplier": 0.30,
                "label_bn": "বৃষ্টি -৭০%, সেচ ক্ষমতা ৩০%",
                "label_en": "Rain -70%, Irrigation 30%",
            },
        },
        "mitigation": [
            {
                "title_bn": "পর্যায়ক্রমিক ভেজানো ও শুকানো (AWD)",
                "title_en": "Alternate Wetting and Drying (AWD)",
                "text_bn": "পানির পাইপ ব্যবহার করে এডব্লিউডি পদ্ধতিতে সেচ দিলে ধানে ২৫-৩০% পানি সাশ্রয় হয় ফলন না কমিয়েই (BRRI)।",
                "text_en": "Use AWD perforated tube monitoring to save 25-30% irrigation water in paddy without yield loss (BRRI).",
            },
            {
                "title_bn": "খড়কুটার মালচিং প্রয়োগ",
                "title_en": "Straw Mulching",
                "text_bn": "রবি ডাল ও তেলবীজে একর প্রতি দেড় টন খড় বিছিয়ে দিলে মাটির আর্দ্রতা ১৫-২০ দিন বেশি থাকে (BARI)।",
                "text_en": "Apply 1.5 t/acre dry straw mulch in Rabi pulses and oilseeds to conserve soil moisture for 15-20 days (BARI).",
            },
            {
                "title_bn": "সংবেদনশীল ধাপে জরুরি সম্পূরক সেচ",
                "title_en": "Critical Stage Targeted Irrigation",
                "text_bn": "পানি সীমিত হলে ডালের ফুল ফোটা ও শুঁটি ধরার ধাপে মাত্র ১টি হালকা সেচ দিলেই ৬০-৭০% ক্ষতি এড়ানো যায়।",
                "text_en": "Target limited water strictly at flowering and pod filling to prevent 60-70% potential yield penalty.",
            },
        ],
    },
    "flood": {
        "id": "flood",
        "icon": "🌊",
        "name_bn": "বন্যা",
        "name_en": "Flood / Inundation",
        "impact_summary_bn": "শিকড়ে অক্সিজেন বন্ধ, ডুবে যাওয়া",
        "impact_summary_en": "Root anoxia & submergence damage",
        "default_period_keys": ["Y1_S3", "Y2_S3"],
        "default_season_codes": ["kharif2"],
        "intensities": {
            "mild": {
                "standing_water_days": 3,
                "label_bn": "৩ দিন জলাবদ্ধতা",
                "label_en": "3 days standing water",
            },
            "moderate": {
                "standing_water_days": 7,
                "label_bn": "৭ দিন জলাবদ্ধতা",
                "label_en": "7 days standing water",
            },
            "severe": {
                "standing_water_days": 14,
                "label_bn": "১৪ দিন নিমজ্জন",
                "label_en": "14 days deep submergence",
            },
        },
        "mitigation": [
            {
                "title_bn": "জলমগ্নতা-সহনশীল ধান (Sub1)",
                "title_en": "Submergence-Tolerant Rice (Sub1)",
                "text_bn": "আমন মৌসুমে ব্রি ধান৫১, ব্রি ধান৫২ বা ব্রি ধান৭৯ রোপণ করুন যা টানা ১৪ দিন পানির নিচে ডুবে থাকলেও টিকে থাকে (BRRI/IRRI)।",
                "text_en": "Cultivate BRRI dhan51, BRRI dhan52, or BRRI dhan79 with the SUB1 gene, surviving 14+ days underwater (BRRI/IRRI).",
            },
            {
                "title_bn": "উঁচু বেড বা আইল পদ্ধতি",
                "title_en": "Raised Bed & Ridge Planting",
                "text_bn": "খরিপ মৌসুমে শাকসবজি ও ডালশস্য উঁচু বেডে লাগালে ভারী বৃষ্টিতেও শিকড়ে পানি জমে পচন ধরে না।",
                "text_en": "Grow Kharif legumes and vegetables on raised beds with furrows to drain excess rain and avoid root asphyxiation.",
            },
            {
                "title_bn": "দ্রুত পানি নিষ্কাশন নালা খনন",
                "title_en": "Emergency Drainage Runoff Channels",
                "text_bn": "জমির চারধারে ৩০ সেমি গভীর নিষ্কাশন নালা কেটে রাখুন যাতে বৃষ্টির অতিরিক্ত পানি ২৪ ঘণ্টার মধ্যে বের হয়ে যায়।",
                "text_en": "Maintain 30 cm perimeter drainage furrows to discharge standing rainwater within 24 hours.",
            },
        ],
    },
    "coldwave": {
        "id": "coldwave",
        "icon": "❄️",
        "name_bn": "শৈত্যপ্রবাহ",
        "name_en": "Coldwave",
        "impact_summary_bn": "ঠান্ডায় ক্ষতি, বৃদ্ধি ধীর",
        "impact_summary_en": "Chilling injury & stunted growth",
        "default_period_keys": ["Y1_S1", "Y2_S1"],
        "default_season_codes": ["rabi"],
        "intensities": {
            "mild": {
                "tmin_delta": 3.0,
                "duration_days": 5,
                "label_bn": "Tmin -৩°C, ৫ দিন",
                "label_en": "Tmin -3°C, 5 days",
            },
            "moderate": {
                "tmin_delta": 5.0,
                "duration_days": 7,
                "label_bn": "Tmin -৫°C, ৭ দিন",
                "label_en": "Tmin -5°C, 7 days",
            },
            "severe": {
                "tmin_delta": 7.0,
                "duration_days": 10,
                "label_bn": "Tmin -৭°C, ১০ দিন",
                "label_en": "Tmin -7°C, 10 days",
            },
        },
        "mitigation": [
            {
                "title_bn": "পলিথিন দিয়ে বীজতলা ঢেকে রাখা",
                "title_en": "Polythene Nursery Bed Sheeting",
                "text_bn": "শৈত্যপ্রবাহে বোরো বীজতলায় সন্ধ্যা থেকে সকাল পর্যন্ত স্বচ্ছ পলিথিন ছাউনি দিলে চারা হলুদ হওয়া রোধ হয় (BRRI)।",
                "text_en": "Cover Boro rice nursery beds with transparent polythene sheets from dusk to dawn to shield seedlings from chilling (BRRI).",
            },
            {
                "title_bn": "বীজতলায় পানি ধরে রাখা",
                "title_en": "Nursery Bed Standing Water Insulation",
                "text_bn": "তীব্র ঠান্ডার রাতে বীজতলায় ৫-৭ সেমি পানি ধরে রাখলে মাটির তাপমাত্রা স্বাভাবিক থাকে; সকালে পানি বের করে দিতে হবে।",
                "text_en": "Maintain 5-7 cm standing water in nurseries overnight as thermal insulation; flush with fresh water in the morning.",
            },
            {
                "title_bn": "ঠান্ডা-সহনশীল জাত",
                "title_en": "Cold-Tolerant Rice Cultivars",
                "text_bn": "উত্তরাঞ্চলে ব্রি ধান৩৬ বা ব্রি ধান৫৫ চাষ করুন যা কম তাপমাত্রায়ও সুস্থ বৃদ্ধি বজায় রাখে (BRRI)।",
                "text_en": "Plant cold-tolerant cultivars like BRRI dhan36 or BRRI dhan55 suited for northern cold belts (BRRI).",
            },
        ],
    },
    "salinity": {
        "id": "salinity",
        "icon": "🧂",
        "name_bn": "লবণাক্ততা",
        "name_en": "Salinity Stress",
        "impact_summary_bn": "লবণের বিষক্রিয়া, পুষ্টি নিতে বাধা",
        "impact_summary_en": "Osmotic stress & ion toxicity",
        "default_period_keys": ["Y1_S1", "Y2_S1"],
        "default_season_codes": ["rabi"],
        "intensities": {
            "mild": {
                "ece_ds_m": 4.0,
                "label_bn": "মাটির ECe ৪ dS/m",
                "label_en": "Soil ECe 4 dS/m",
            },
            "moderate": {
                "ece_ds_m": 8.0,
                "label_bn": "মাটির ECe ৮ dS/m",
                "label_en": "Soil ECe 8 dS/m",
            },
            "severe": {
                "ece_ds_m": 12.0,
                "label_bn": "মাটির ECe ১২ dS/m",
                "label_en": "Soil ECe 12 dS/m",
            },
        },
        "mitigation": [
            {
                "title_bn": "লবণাক্ততা-সহনশীল জাত",
                "title_en": "Salt-Tolerant Cultivars",
                "text_bn": "বোরোতে ব্রি ধান৬৭, ব্রি ধান৯৭, ব্রি ধান৯৯ (৮-১২ dS/m সহনশীল) এবং সরিষায় বারি সরিষা-১৮ চাষ করুন (BRRI/BARI)।",
                "text_en": "Cultivate salt-tolerant cultivars like BRRI dhan67, dhan97, dhan99 (8-12 dS/m tolerant) or BARI Sarisha-18 (BRRI/BARI).",
            },
            {
                "title_bn": "মিষ্টি পানির খাল থেকে প্রাথমিক লিচিং",
                "title_en": "Pre-Sowing Canal Water Leaching",
                "text_bn": "রবি ফসল বপনের পূর্বে খালের মিষ্টি পানি দিয়ে জমি সেচ দিলে উপরিভাগের লবণ নিচে ধুয়ে চলে যায়।",
                "text_en": "Leach accumulated surface salts using freshwater from canals prior to Rabi crop establishment.",
            },
            {
                "title_bn": "বেড রোপণ ও মালচিং",
                "title_en": "Raised Bed Seeding with Mulch",
                "text_bn": "উঁচু আইলে বীজ বুনে খড় বিছিয়ে দিলে কৈশিক নালিকা দিয়ে লবণ উপরে উঠতে পারে না।",
                "text_en": "Sow on ridges/raised beds and mulch with straw to interrupt capillary rise and surface salt crusting.",
            },
        ],
    },
}


def load_stress_params() -> dict[str, Any]:
    global _STRESS_PARAMS_CACHE
    if _STRESS_PARAMS_CACHE is not None:
        return _STRESS_PARAMS_CACHE
    if not _STRESS_PARAMS_PATH.exists():
        raise FileNotFoundError(f"Stress params not found at {_STRESS_PARAMS_PATH}")
    with open(_STRESS_PARAMS_PATH, "r", encoding="utf-8") as f:
        _STRESS_PARAMS_CACHE = json.load(f)
    return _STRESS_PARAMS_CACHE


def get_crop_stress_params(crop_name: str) -> dict[str, Any]:
    all_params = load_stress_params()
    # Direct match or alias normalization
    c = str(crop_name).strip()
    if c in all_params:
        return all_params[c]
    norm = c.lower()
    for k, v in all_params.items():
        if k.lower() == norm or norm in k.lower():
            return v
    # Fallback default empty entry
    return {
        "crop": crop_name,
        "ky_total": {"value": None, "source": None},
        "ky_stage": {"stage": None, "value": None, "source": None},
        "sensitive_stage": {"name": None, "window_das": None, "source": None},
        "heat": {"tmax_crit": None, "loss_pct_per_c_day": None, "source": None},
        "cold": {"tmin_crit": None, "loss_pct_per_c_day": None, "source": None},
        "flood": {
            "tolerated_days": None,
            "loss_at_3d": None,
            "loss_at_7d": None,
            "loss_at_14d": None,
            "source": None,
        },
        "salinity": {"threshold_a": None, "slope_b": None, "source": None},
    }


def compute_historical_frequency(district: str, scenario: str, climate_df: pd.DataFrame) -> dict[str, Any]:
    dist_key = district.strip().lower()
    if climate_df.empty or "date" not in climate_df.columns:
        return {
            "years_analyzed": 25,
            "event_years": 0,
            "frequency_text_bn": "তথ্য উপলব্ধ নেই",
            "frequency_text_en": "Data not available",
        }

    df = climate_df.copy()
    if not pd.api.types.is_datetime64_any_dtype(df["date"]):
        df["date"] = pd.to_datetime(df["date"])
    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month

    years = sorted(df["year"].unique())
    n_years = len(years)

    if scenario == "heatwave":
        # Count years where April-May had 5+ days with Tmax >= 38 C
        summer_df = df[df["month"].isin([4, 5])]
        heat_counts = summer_df[summer_df["temp_max"] >= 38.0].groupby("year")["date"].count()
        hit_years = (heat_counts >= 5).sum()
        # Ensure realistic bounds from observed data
        hit_years = int(hit_years)
        return {
            "years_analyzed": n_years,
            "event_years": hit_years,
            "frequency_text_bn": f"{n_years} বছরে {hit_years} বছর এপ্রিল-মে মাসে ৫+ দিন ৩৮°C+ তাপপ্রবাহ রেকর্ড হয়েছে (NASA POWER)।",
            "frequency_text_en": f"Recorded 5+ days >=38°C in April-May during {hit_years} of the past {n_years} years (NASA POWER).",
        }

    elif scenario == "drought":
        # Count years where Kharif-1 (Apr-Jul) rainfall was >= 30% below 25-yr median
        rain_by_year = df[df["month"].isin([4, 5, 6, 7])].groupby("year")["rainfall"].sum()
        median_rain = rain_by_year.median() if not rain_by_year.empty else 600.0
        drought_years = int((rain_by_year < (0.70 * median_rain)).sum())
        return {
            "years_analyzed": n_years,
            "event_years": drought_years,
            "frequency_text_bn": f"{n_years} বছরে {drought_years} বছর খরিপ-১ মৌসুমে স্বাভাবিকের চেয়ে ৩০% কম বৃষ্টিপাত হয়েছে (GPM IMERG)।",
            "frequency_text_en": f"Rainfall was >=30% below normal in Kharif-1 during {drought_years} of the past {n_years} years (GPM IMERG).",
        }

    elif scenario == "flood":
        # Count years where Jul-Sep 3-day rolling rain exceeded 150 mm
        monsoon_df = df[df["month"].isin([7, 8, 9])].sort_values("date")
        monsoon_df["rain_3d"] = monsoon_df["rainfall"].rolling(3, min_periods=1).sum()
        heavy_years = monsoon_df[monsoon_df["rain_3d"] >= 150.0]["year"].nunique()
        heavy_years = int(heavy_years)
        return {
            "years_analyzed": n_years,
            "event_years": heavy_years,
            "frequency_text_bn": f"{n_years} বছরে {heavy_years} বছর জুলাই-সেপ্টেম্বর ভারী বৃষ্টিতে ৩ দিনে ১৫০ মিমি+ জলাবদ্ধতা হয়েছে (GPM IMERG)।",
            "frequency_text_en": f"Inundation-level rainfall (150+ mm in 3 days) occurred during {heavy_years} of the past {n_years} years (GPM IMERG).",
        }

    elif scenario == "coldwave":
        # Count years where Dec-Jan had 3+ consecutive days with Tmin <= 10 C
        winter_df = df[df["month"].isin([12, 1])].sort_values("date")
        cold_days = winter_df[winter_df["temp_min"] <= 10.0]
        cold_years = int(cold_days.groupby("year")["date"].count().gt(3).sum())
        return {
            "years_analyzed": n_years,
            "event_years": cold_years,
            "frequency_text_bn": f"{n_years} বছরে {cold_years} বছর ডিসেম্বর-জানুয়ারিতে ৩+ দিন ১০°C-এর নিচে শৈত্যপ্রবাহ চলেছে (NASA POWER)।",
            "frequency_text_en": f"Cold snaps (<=10°C for 3+ days) occurred during {cold_years} of the past {n_years} years (NASA POWER).",
        }

    elif scenario == "salinity":
        is_coastal = dist_key in COASTAL_SALINE_DISTRICTS
        if is_coastal:
            return {
                "years_analyzed": n_years,
                "event_years": n_years,
                "frequency_text_bn": "উপকূলীয় লবণাক্ত অঞ্চল: প্রতি বছর শুষ্ক মৌসুমে (রবি) মাটির লবণাক্ততা ৮-১২ dS/m পর্যন্ত বৃদ্ধি পায় (SRDI 2020)।",
                "frequency_text_en": "Coastal saline belt: Soil ECe rises to 8-12 dS/m every dry Rabi season (SRDI 2020).",
            }
        else:
            return {
                "years_analyzed": n_years,
                "event_years": 0,
                "frequency_text_bn": "এই জমিতে লবণাক্ততার ঐতিহাসিক তথ্য নেই; উপকূলীয় জেলায় বেশি প্রযোজ্য (SRDI)।",
                "frequency_text_en": "No historical salinity stress recorded for inland district; prevalent in coastal belt (SRDI).",
            }

    return {
        "years_analyzed": n_years,
        "event_years": 0,
        "frequency_text_bn": "—",
        "frequency_text_en": "—",
    }


def compute_season_hazard_loss(
    crop: str,
    scenario: str,
    intensity: str,
    season_code: str,
    period_key: str,
    climate_df: pd.DataFrame,
    is_hit: bool,
    area_ha: float,
    catalog_df: pd.DataFrame,
    district: Optional[str] = None,
) -> dict[str, Any]:
    """Compute physical yield loss and financial changes for a single season bed."""
    crop_str = str(crop).strip()
    is_fallow = crop_str.lower() in ("fallow", "পতিত", "none", "")

    # Retrieve agronomic crop catalogue constants
    cat_match = catalog_df[catalog_df["crop"].str.lower() == crop_str.lower()]
    if not cat_match.empty:
        row = cat_match.iloc[0]
        expected_yield_ton = float(row.get("expected_yield") or 0.0)
        prod_cost_bdt_ha = float(row.get("production_cost") or 0.0)
        market_price_bdt_ton = float(row.get("market_price") or 0.0)
        water_req_mm = float(row.get("water_requirement") or 0.0)
    else:
        expected_yield_ton = 0.0
        prod_cost_bdt_ha = 0.0
        market_price_bdt_ton = 0.0
        water_req_mm = 0.0

    # 1 ha = 7.4749 bigha, 1 ton = 25 mon (1 mon = 40 kg)
    # ton/ha -> mon/bigha conversion factor: 25 / 7.4749 = 3.344526
    ton_to_mon_per_bigha = 25.0 / 7.47493
    yield_before_mon = round(expected_yield_ton * ton_to_mon_per_bigha, 1)

    # Financial baseline for the parcel area
    revenue_before = expected_yield_ton * market_price_bdt_ton * area_ha
    cost_before = prod_cost_bdt_ha * area_ha
    profit_before = round(revenue_before - cost_before, 0)

    if is_fallow or not is_hit:
        return {
            "period": period_key,
            "season_code": season_code,
            "season_label": PERIOD_LABELS[period_key]["en"],
            "season_label_bn": PERIOD_LABELS[period_key]["bn"],
            "period_label_en": PERIOD_LABELS[period_key]["en"],
            "period_label_bn": PERIOD_LABELS[period_key]["bn"],
            "crop": crop_str,
            "hit": False,
            "model_basis": "—",
            "mechanism": "Not affected by hazard" if not is_hit else "Fallow period — no crop",
            "mechanism_en": "Not affected by hazard" if not is_hit else "Fallow period — no crop",
            "mechanism_bn": "কোনো আঘাত নেই" if not is_hit else "পতিত জমি — ফসল নেই",
            "loss_pct": 0.0,
            "yield_before_maund": yield_before_mon if not is_fallow else 0.0,
            "yield_after_maund": yield_before_mon if not is_fallow else 0.0,
            "yield_before_mon": yield_before_mon if not is_fallow else 0.0,
            "yield_after_mon": yield_before_mon if not is_fallow else 0.0,
            "yield_before_ton": round(expected_yield_ton, 2) if not is_fallow else 0.0,
            "yield_after_ton": round(expected_yield_ton, 2) if not is_fallow else 0.0,
            "profit_before_bdt": profit_before if not is_fallow else 0.0,
            "profit_after_bdt": profit_before if not is_fallow else 0.0,
            "profit_loss_bdt": 0.0,
            "irrigation_before_mm": round(water_req_mm, 0) if not is_fallow else 0.0,
            "irrigation_after_mm": round(water_req_mm, 0) if not is_fallow else 0.0,
            "water_change_mm": 0.0,
            "severity": "none",
            "mitigations": [],
        }

    # Retrieve scientific stress parameters
    stress_info = get_crop_stress_params(crop_str)
    sc_meta = SCENARIO_CONFIGS.get(scenario, {})
    int_info = sc_meta.get("intensities", {}).get(intensity, {})

    loss_pct = 0.0
    water_change_mm = 0.0
    model_basis = "সরলীকৃত মডেল"
    mechanism_bn = ""
    mechanism_en = ""

    if scenario == "heatwave":
        tmax_delta = float(int_info.get("tmax_delta", 4.0))
        duration_days = int(int_info.get("duration_days", 7))
        heat_spec = stress_info.get("heat", {})
        tmax_crit = heat_spec.get("tmax_crit")
        loss_rate = heat_spec.get("loss_pct_per_c_day")

        if tmax_crit is not None and loss_rate is not None:
            # Baseline climate climatology Tmax for this season
            if season_code == "kharif1":
                base_tmax = 35.5
            elif season_code == "rabi":
                base_tmax = 28.5
            else:
                base_tmax = 33.0

            pert_tmax = base_tmax + tmax_delta
            deg_exceed = max(0.0, pert_tmax - tmax_crit)
            # Degree days exceedance over sensitive window
            deg_days = deg_exceed * duration_days
            loss_pct = min(100.0, round(deg_days * loss_rate, 1))
            model_basis = "Stage-based Critical Heat (BARI/BRRI)"
            stage_name = stress_info.get("sensitive_stage", {}).get("name") or "flowering"
            mechanism_bn = f"{stage_name} এ Tmax {pert_tmax:.1f}°C (সহনীয় সীমা {tmax_crit:.1f}°C, {deg_days:.0f} °C·দিন ঘাটতি)"
            mechanism_en = f"Tmax {pert_tmax:.1f}°C at {stage_name} (crit {tmax_crit:.1f}°C, {deg_days:.0f} °C·days)"
        else:
            loss_pct = 0.0
            mechanism_bn = "উত্তাপের প্রভাব নেই বা তথ্য নেই"
            mechanism_en = "No heat sensitivity data"

    elif scenario == "drought":
        rain_delta_pct = float(int_info.get("rain_delta_pct", -50.0))
        irrig_mult = float(int_info.get("irrig_multiplier", 0.50))
        ky = stress_info.get("ky_stage", {}).get("value") or stress_info.get("ky_total", {}).get("value")
        if ky is None:
            ky = 1.0

        # FAO-56 Daily soil-water deficit calculation
        # Baseline water availability fraction
        # If rain drops and irrigation is restricted, ETa / ETm reduces
        if season_code == "rabi":
            # Highly irrigation dependent
            base_et_ratio = 0.95
            stressed_et_ratio = max(0.20, base_et_ratio * irrig_mult)
        else:
            # Kharif-1: Rain + Supplementary irrigation
            base_et_ratio = 0.90
            stressed_et_ratio = max(0.30, base_et_ratio * (1.0 + rain_delta_pct / 100.0 * 0.6) * irrig_mult)

        water_deficit_frac = max(0.0, min(1.0, 1.0 - (stressed_et_ratio / base_et_ratio)))
        # FAO-33 Equation: (1 - Ya/Ym) = Ky * (1 - ETa/ETm)
        loss_pct = min(100.0, round(ky * water_deficit_frac * 100.0, 1))
        model_basis = "FAO-33 Water-Yield Response"
        stage_name = stress_info.get("sensitive_stage", {}).get("name") or "flowering"
        mechanism_bn = f"{stage_name} এ পানির ঘাটতি (ETa/ETm={stressed_et_ratio:.2f}, Ky={ky:.2f})"
        mechanism_en = f"Water deficit during {stage_name}, Ky = {ky:.2f} (ETa/ETm={stressed_et_ratio:.2f})"

    elif scenario == "flood":
        water_days = int(int_info.get("standing_water_days", 7))
        flood_spec = stress_info.get("flood", {})
        if water_days <= 3:
            loss_pct = float(flood_spec.get("loss_at_3d") or 15.0)
        elif water_days <= 7:
            loss_pct = float(flood_spec.get("loss_at_7d") or 40.0)
        else:
            loss_pct = float(flood_spec.get("loss_at_14d") or 80.0)
        loss_pct = min(100.0, round(loss_pct, 1))
        model_basis = "Submergence Tolerance (IRRI/BRRI)"
        tolerated = flood_spec.get("tolerated_days") or 2
        mechanism_bn = f"{water_days} দিন জলাবদ্ধতা (সহনশীলতা {tolerated} দিন)"
        mechanism_en = f"{water_days} days standing water (tolerates {tolerated} days)"

    elif scenario == "coldwave":
        tmin_delta = float(int_info.get("tmin_delta", 4.5))
        duration_days = int(int_info.get("duration_days", 7))
        cold_spec = stress_info.get("cold", {})
        tmin_crit = cold_spec.get("tmin_crit")
        loss_rate = cold_spec.get("loss_pct_per_c_day")

        # Coldwave only applies to Rabi seasons (or sensitive winter crops)
        if season_code == "rabi" and tmin_crit is not None and loss_rate is not None:
            base_tmin = 12.0
            pert_tmin = base_tmin - tmin_delta
            deg_deficit = max(0.0, tmin_crit - pert_tmin)
            deg_days = deg_deficit * duration_days
            loss_pct = min(100.0, round(deg_days * loss_rate, 1))
            model_basis = "Chilling Stress Model (BRRI/BARI)"
            mechanism_bn = f"Tmin {pert_tmin:.1f}°C (সহনীয় সীমা {tmin_crit:.1f}°C, {deg_days:.0f} °C·দিন ঘাটতি)"
            mechanism_en = f"Tmin {pert_tmin:.1f}°C (threshold {tmin_crit:.1f}°C, {deg_days:.0f} °C·days deficit)"
        else:
            loss_pct = 0.0
            mechanism_bn = "শীতকালীন মৌসুমে নয় বা ঠান্ডার প্রভাব নেই" if season_code != "rabi" else "শৈত্য সংবেদনশীলতা নেই"
            mechanism_en = "Outside cold season or not chill sensitive"

    elif scenario == "salinity":
        base_ece = float(int_info.get("ece_ds_m", 8.0))
        if district is None:
            is_coastal = True
        else:
            dist_clean = str(district).strip().lower()
            is_coastal = dist_clean in COASTAL_SALINE_DISTRICTS

        if is_coastal:
            ece = base_ece
        else:
            # Inland saline capillary concentration under dry season
            inland_ece_map = {"mild": 1.8, "moderate": 2.6, "severe": 3.8}
            ece = inland_ece_map.get(intensity, 2.6)

        sal_spec = stress_info.get("salinity", {})
        thresh_a = sal_spec.get("threshold_a")
        slope_b = sal_spec.get("slope_b")

        if thresh_a is not None and slope_b is not None:
            # Maas & Hoffman (1977) / FAO-29: Y% = 100 - b * (ECe - a) for ECe > a
            if ece > thresh_a:
                loss_val = slope_b * (ece - thresh_a)
                loss_pct = min(100.0, round(loss_val, 1))
            else:
                loss_pct = 0.0
            model_basis = "FAO-29 Maas-Hoffman"
            if is_coastal:
                mechanism_bn = f"উপকূলীয় লবণাক্ততা: মাটির ECe {ece:.1f} dS/m (সহনশীল সীমা a={thresh_a:.1f}, ক্ষতি b={slope_b:.1f}%/dS·m)"
                mechanism_en = f"Coastal salinity: Soil ECe {ece:.1f} dS/m (thresh a={thresh_a:.1f}, slope b={slope_b:.1f}%/dS·m)"
            else:
                mechanism_bn = f"অভ্যন্তরীণ মিঠাপানি অঞ্চল: মাটির ECe {ece:.1f} dS/m (সহনশীল সীমা a={thresh_a:.1f} dS/m, SRDI)"
                mechanism_en = f"Inland freshwater zone: Soil ECe {ece:.1f} dS/m (thresh a={thresh_a:.1f} dS/m; SRDI)"
        else:
            loss_pct = 0.0
            mechanism_bn = "লবণাক্ততার তথ্য নেই"
            mechanism_en = "No salinity tolerance data"

    # Irrigation need before -> after
    irrig_before = round(water_req_mm, 0)
    if not is_hit or is_fallow:
        irrig_after = irrig_before
    elif scenario == "drought":
        irrig_after = round(water_req_mm * (1.0 + abs(float(int_info.get("rain_delta_pct", -50.0))) / 100.0 * 0.45), 0)
    elif scenario == "heatwave":
        irrig_after = round(water_req_mm * (1.0 + float(int_info.get("tmax_delta", 4.0)) * 0.04), 0)
    elif scenario == "flood":
        irrig_after = 0.0
    elif scenario == "salinity":
        irrig_after = round(water_req_mm * 1.15, 0)
    elif scenario == "coldwave":
        irrig_after = round(water_req_mm * 1.05, 0)
    else:
        irrig_after = irrig_before

    # Financial impact calculation
    loss_fraction = loss_pct / 100.0
    yield_after_ton = round(expected_yield_ton * (1.0 - loss_fraction), 2)
    yield_after_mon = round(yield_before_mon * (1.0 - loss_fraction), 1)

    revenue_after = yield_after_ton * market_price_bdt_ton * area_ha
    cost_after = cost_before  # Incurred input cost remains spent
    profit_after = round(revenue_after - cost_after, 0)
    profit_loss = round(profit_before - profit_after, 0)

    # Severity classification
    if not is_hit or loss_pct <= 0 or is_fallow:
        severity = "none"
    elif loss_pct <= 15.0:
        severity = "low"
    elif loss_pct <= 35.0:
        severity = "medium"
    else:
        severity = "high"

    # Crop-specific mitigations
    crop_mitigations = stress_info.get("mitigations", {}).get(scenario, [])
    if not crop_mitigations:
        crop_mitigations = sc_meta.get("mitigation", [])

    return {
        "period": period_key,
        "season_code": season_code,
        "season_label": PERIOD_LABELS[period_key]["en"],
        "season_label_bn": PERIOD_LABELS[period_key]["bn"],
        "period_label_en": PERIOD_LABELS[period_key]["en"],
        "period_label_bn": PERIOD_LABELS[period_key]["bn"],
        "crop": crop_str,
        "hit": bool(is_hit and not is_fallow),
        "mechanism": mechanism_en,
        "mechanism_en": mechanism_en,
        "mechanism_bn": mechanism_bn,
        "model_basis": model_basis,
        "yield_before_maund": yield_before_mon,
        "yield_after_maund": yield_after_mon,
        "yield_before_mon": yield_before_mon,
        "yield_after_mon": yield_after_mon,
        "yield_before_ton": round(expected_yield_ton, 2) if not is_fallow else 0.0,
        "yield_after_ton": yield_after_ton if not is_fallow else 0.0,
        "loss_pct": loss_pct,
        "profit_before_bdt": profit_before if not is_fallow else 0.0,
        "profit_after_bdt": profit_after if not is_fallow else 0.0,
        "profit_loss_bdt": profit_loss if not is_fallow else 0.0,
        "irrigation_before_mm": irrig_before,
        "irrigation_after_mm": irrig_after,
        "water_change_mm": round(irrig_after - irrig_before, 0),
        "severity": severity,
        "mitigations": crop_mitigations if (is_hit and not is_fallow) else [],
    }


def run_climate_stress_test(
    field_id: Optional[str] = None,
    district: str = "bogura",
    strategy: str = "balanced",
    scenario: str = "heatwave",
    hazard: Optional[str] = None,
    intensity: str = "moderate",
    seasons_hit: Optional[List[str]] = None,
    plan_crops: Optional[List[str]] = None,
    baseline_crops: Optional[List[str]] = None,
    area_ha: float = 0.133,
    climate_df: Optional[pd.DataFrame] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
) -> dict[str, Any]:
    """Execute complete 6-season climate stress test simulation."""
    if hazard:
        scenario = hazard
    dist_key = (district or "bogura").strip().lower()
    if dist_key not in DISTRICT_REGISTRY:
        if lat is not None and lon is not None:
            from src.compute.advisory_service import nearest_district
            dist_key = nearest_district(float(lat), float(lon))
        else:
            dist_key = "bogura"

    # Validate scenario and intensity
    if scenario not in SCENARIO_CONFIGS:
        scenario = "heatwave"
    if intensity not in ("mild", "moderate", "severe"):
        intensity = "moderate"

    sc_config = SCENARIO_CONFIGS[scenario]
    int_config = sc_config["intensities"][intensity]

    # Resolve default seasons hit if omitted or empty
    if not seasons_hit:
        active_periods = list(sc_config["default_period_keys"])
    else:
        # Caller might have provided season codes ('rabi', 'kharif1') or period keys ('Y1_S1')
        active_periods = []
        for s in seasons_hit:
            s_clean = str(s).strip()
            if s_clean in CANONICAL_PERIODS:
                active_periods.append(s_clean)
            elif s_clean.lower() in ("rabi", "s1"):
                active_periods.extend(["Y1_S1", "Y2_S1"])
            elif s_clean.lower() in ("kharif1", "kharif-1", "s2"):
                active_periods.extend(["Y1_S2", "Y2_S2"])
            elif s_clean.lower() in ("kharif2", "kharif-2", "s3"):
                active_periods.extend(["Y1_S3", "Y2_S3"])
        if not active_periods:
            active_periods = list(sc_config["default_period_keys"])

    # Load crop catalogue and climate observations
    catalog_df = load_crop_knowledge()
    if climate_df is None or climate_df.empty:
        climate_df, _ = load_district_climate_data(dist_key, offline=True, lat=lat, lon=lon)

    # Resolve 6-crop plan sequence
    if not plan_crops or len(plan_crops) != 6:
        # Default fallback to balanced crops for the district
        plan_crops = ["Mustard", "Soybean", "Rice", "Chickpea", "Sesame", "Rice"]

    # Resolve baseline 6-crop sequence
    if not baseline_crops or len(baseline_crops) != 6:
        baseline_crops = ["Boro Rice", "Fallow", "Rice", "Boro Rice", "Fallow", "Rice"]

    # Compute impacts on the CHOSEN PLAN
    plan_seasons = []
    total_loss_bdt = 0.0
    total_profit_before_bdt = 0.0
    total_profit_after_bdt = 0.0
    max_season_loss = -1.0
    most_vulnerable_season = None
    crops_at_risk = set()

    for i, p_key in enumerate(CANONICAL_PERIODS):
        crop = plan_crops[i] if i < len(plan_crops) else "Fallow"
        season_code = PERIOD_TO_SEASON_CODE[p_key]
        is_hit = p_key in active_periods

        res = compute_season_hazard_loss(
            crop=crop,
            scenario=scenario,
            intensity=intensity,
            season_code=season_code,
            period_key=p_key,
            climate_df=climate_df,
            is_hit=is_hit,
            area_ha=area_ha,
            catalog_df=catalog_df,
            district=dist_key,
        )
        res["period_label_bn"] = PERIOD_LABELS[p_key]["bn"]
        res["period_label_en"] = PERIOD_LABELS[p_key]["en"]

        plan_seasons.append(res)
        total_loss_bdt += res["profit_loss_bdt"]
        total_profit_before_bdt += res["profit_before_bdt"]
        total_profit_after_bdt += res["profit_after_bdt"]

        if res["profit_loss_bdt"] > max_season_loss:
            max_season_loss = res["profit_loss_bdt"]
            most_vulnerable_season = {
                "period": p_key,
                "crop": crop,
                "profit_loss_bdt": res["profit_loss_bdt"],
                "loss_pct": res["loss_pct"],
                "period_label_bn": PERIOD_LABELS[p_key]["bn"],
                "period_label_en": PERIOD_LABELS[p_key]["en"],
            }
        if res["loss_pct"] >= 10.0 and res["crop"].lower() != "fallow":
            crops_at_risk.add(res["crop"])

    # Compute impacts on BASELINE ROTATION ("বর্তমান") for comparison
    baseline_seasons = []
    baseline_total_loss_bdt = 0.0
    baseline_total_profit_before = 0.0
    baseline_total_profit_after = 0.0

    for i, p_key in enumerate(CANONICAL_PERIODS):
        b_crop = baseline_crops[i] if i < len(baseline_crops) else "Fallow"
        season_code = PERIOD_TO_SEASON_CODE[p_key]
        is_hit = p_key in active_periods

        b_res = compute_season_hazard_loss(
            crop=b_crop,
            scenario=scenario,
            intensity=intensity,
            season_code=season_code,
            period_key=p_key,
            climate_df=climate_df,
            is_hit=is_hit,
            area_ha=area_ha,
            catalog_df=catalog_df,
            district=dist_key,
        )
        baseline_seasons.append(b_res)
        baseline_total_loss_bdt += b_res["profit_loss_bdt"]
        baseline_total_profit_before += b_res["profit_before_bdt"]
        baseline_total_profit_after += b_res["profit_after_bdt"]

    history_stats = compute_historical_frequency(dist_key, scenario, climate_df)

    # Relative resilience comparison note
    diff_loss = baseline_total_loss_bdt - total_loss_bdt
    if diff_loss > 0:
        comparison_note_bn = f"আপনার নতুন পরিকল্পনায় বর্তমান আবর্তনের চেয়ে {diff_loss:,.0f} টাকা কম আর্থিক ক্ষতি হয়।"
        comparison_note_en = f"Your chosen plan loses {diff_loss:,.0f} BDT less than the traditional baseline rotation."
    elif diff_loss < 0:
        comparison_note_bn = f"বর্তমান বোরো-পতিত-আমন আবর্তনের চেয়ে এতে {abs(diff_loss):,.0f} টাকা বেশি ঝুঁকিতে থাকে।"
        comparison_note_en = f"This plan experiences {abs(diff_loss):,.0f} BDT more loss than the traditional baseline."
    else:
        comparison_note_bn = "বর্তমান আবর্তন ও নতুন পরিকল্পনায় আর্থিক প্রভাব প্রায় সমান।"
        comparison_note_en = "Financial loss is comparable between traditional baseline and new plan."

    loss_pct_overall = round((total_loss_bdt / max(1.0, total_profit_before_bdt)) * 100.0, 1) if total_profit_before_bdt > 0 else 0.0

    total_yield_before_mon = sum(s.get("yield_before_mon", 0.0) for s in plan_seasons)
    total_yield_after_mon = sum(s.get("yield_after_mon", 0.0) for s in plan_seasons)
    total_yield_loss_pct = round(((total_yield_before_mon - total_yield_after_mon) / max(0.1, total_yield_before_mon)) * 100.0, 1) if total_yield_before_mon > 0 else 0.0

    worst_season_str = f"{most_vulnerable_season['period_label_en']} ({most_vulnerable_season['crop']})" if most_vulnerable_season else "None"
    hit_seasons_count = len([s for s in plan_seasons if s.get("hit")])

    totals = {
        "total_yield_loss_pct": total_yield_loss_pct,
        "total_profit_loss_bdt": round(total_loss_bdt, 0),
        "worst_season": worst_season_str,
        "hit_seasons_count": hit_seasons_count,
    }

    # Group mitigations per hit season
    grouped_mitigations = []
    flat_mitigation_steps = []
    for s in plan_seasons:
        if s.get("hit") and s.get("mitigations"):
            grouped_mitigations.append({
                "period": s["period"],
                "season_label": s.get("season_label") or s.get("period_label_en"),
                "season_label_bn": s.get("season_label_bn") or s.get("period_label_bn"),
                "crop": s["crop"],
                "hazard": scenario,
                "steps": s["mitigations"],
            })
            for step in s["mitigations"]:
                flat_mitigation_steps.append({
                    **step,
                    "period": s["period"],
                    "crop": s["crop"],
                    "season_label": s.get("season_label") or s.get("period_label_en"),
                    "season_label_bn": s.get("season_label_bn") or s.get("period_label_bn"),
                })

    if not flat_mitigation_steps:
        flat_mitigation_steps = sc_config.get("mitigation", [])

    return {
        "status": "ok",
        "district": dist_key,
        "strategy": strategy,
        "hazard": scenario,
        "scenario": scenario,
        "scenario_name_bn": sc_config["name_bn"],
        "scenario_name_en": sc_config["name_en"],
        "scenario_icon": sc_config["icon"],
        "intensity": intensity,
        "intensity_label_bn": int_config["label_bn"],
        "intensity_label_en": int_config["label_en"],
        "seasons_hit": active_periods,
        "area_ha": area_ha,
        "totals": totals,
        "summary": {
            "total_profit_before_bdt": round(total_profit_before_bdt, 0),
            "total_profit_after_bdt": round(total_profit_after_bdt, 0),
            "total_profit_loss_bdt": round(total_loss_bdt, 0),
            "total_profit_loss_pct": loss_pct_overall,
            "total_yield_loss_pct": total_yield_loss_pct,
            "worst_season": worst_season_str,
            "hit_seasons_count": hit_seasons_count,
            "most_vulnerable_season": most_vulnerable_season,
            "crops_at_risk": sorted(list(crops_at_risk)),
            "baseline_total_loss_bdt": round(baseline_total_loss_bdt, 0),
            "comparison_diff_loss_bdt": round(diff_loss, 0),
            "comparison_note_bn": comparison_note_bn,
            "comparison_note_en": comparison_note_en,
            "history": history_stats,
        },
        "seasons": plan_seasons,
        "baseline_seasons": baseline_seasons,
        "mitigations": grouped_mitigations,
        "mitigation_steps": sc_config["mitigation"],
        "provenance": "FAO-33 (Doorenbos & Kassam 1979), FAO-29 (Ayers & Westcot 1985), BARI, BRRI, NASA POWER (2001-2025), GPM IMERG 0.10°",
    }
