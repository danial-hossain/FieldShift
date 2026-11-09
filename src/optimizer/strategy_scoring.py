"""
strategy_scoring.py - Cross-strategy multi-criteria scoring and recommendation.

Scores all 4 rotation strategies (Balanced, Profit, Water Saving, Soil Health)
on ONE common normalized scale (0-1 min-max) using weights reflecting farmer priorities
under varying irrigation capacities.
"""

from typing import Dict, Any, List, Tuple
import math

# Weights from the farmer's priorities based on irrigation access
# Documented assumption:
# - Ample irrigation (পর্যাপ্ত, >= 1000 mm): Water is accessible; economic returns can be prioritized (0.40)
#   alongside sustainable water usage (0.30) and soil conservation (0.30).
# - Limited irrigation (সীমিত, 300-800 mm): Water scarcity is a constraining risk factor, so water
#   conservation carries dominant weight (0.50), profit (0.30), soil health (0.20).
# - No irrigation (নেই, 0 mm / rainfed): Strict water scarcity; water efficiency is paramount (0.60),
#   profit (0.25), soil health (0.15).
IRRIGATION_PRIORITY_WEIGHTS = {
    "ample": {"profit": 0.40, "water": 0.30, "soil": 0.30},
    "limited": {"profit": 0.30, "water": 0.50, "soil": 0.20},
    "none": {"profit": 0.25, "water": 0.60, "soil": 0.15},
}

STRATEGY_KEYS = ["balanced", "profit", "water", "soil"]

STRATEGY_TITLES_BN = {
    "balanced": "সুষম",
    "profit": "লাভ",
    "water": "পানি সাশ্রয়",
    "soil": "মাটির স্বাস্থ্য",
}

STRATEGY_TITLES_EN = {
    "balanced": "Balanced",
    "profit": "Profit",
    "water": "Water Saving",
    "soil": "Soil Health",
}

BN_DIGIT_MAP = str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯")

def to_bn_digits(val: Any) -> str:
    """Converts English digits in a string or formatted number to Bengali digits."""
    return str(val).translate(BN_DIGIT_MAP)


def resolve_irrigation_class(irrigation_capacity_mm: float | None) -> str:
    """Classifies irrigation capacity into ample, limited, or none."""
    if irrigation_capacity_mm is None or math.isnan(irrigation_capacity_mm):
        return "ample"
    try:
        val = float(irrigation_capacity_mm)
    except (TypeError, ValueError):
        return "ample"
    if val <= 50.0:
        return "none"
    if val < 900.0:
        return "limited"
    return "ample"


def score_and_rank_strategies(
    plans_by_strategy: Dict[str, Dict[str, Any]],
    irrigation_capacity_mm: float | None = 1200.0,
) -> Dict[str, Any]:
    """
    Scores all 4 plans on ONE common scale:
    1. Normalise profit, yearly irrigation and soil (N + bare days) across the 4 plans to 0-1 (min-max).
    2. Uses weights from the farmer's priorities based on irrigation class.
    3. Selects highest score as ⭐. On a tie (< 0.02), prefers Balanced.
    4. Identifies identical 6-crop sequences and formats a concise 1-line reason in BN and EN.
    """
    irrig_class = resolve_irrigation_class(irrigation_capacity_mm)
    weights = IRRIGATION_PRIORITY_WEIGHTS[irrig_class]

    # Extract metrics for available strategies
    available_keys = [k for k in STRATEGY_KEYS if k in plans_by_strategy]
    if not available_keys:
        return {
            "best_strategy": "balanced",
            "best_reason_bn": "সুষম পরিকল্পনা প্রযোজ্য।",
            "best_reason_en": "Balanced plan selected by default.",
            "identical_strategy_note_bn": None,
            "identical_strategy_note_en": None,
            "scores": {},
        }

    profits = {}
    waters = {}
    nitrogens = {}
    bare_days = {}
    sequences = {}

    for k in available_keys:
        pl = plans_by_strategy[k]
        profits[k] = float(pl.get("plan_profit_bdt") or 0.0)
        waters[k] = float(pl.get("plan_irrigation_mm") or 0.0)
        nitrogens[k] = float(pl.get("plan_nitrogen_kg") or 0.0)
        bare_days[k] = float(pl.get("plan_bare_days") or 0.0)

        seq = pl.get("selected_crop_by_period") or pl.get("recommended_crops") or {}
        if isinstance(seq, dict):
            sequences[k] = [seq.get(f"Y{1+i//3}_S{1+i%3}", "") for i in range(6)]
        elif isinstance(seq, list):
            sequences[k] = list(seq)[:6]
        else:
            sequences[k] = []

    # 1. Normalise Profit (Higher is better)
    p_vals = list(profits.values())
    min_p, max_p = min(p_vals), max(p_vals)
    norm_profit = {
        k: ((profits[k] - min_p) / (max_p - min_p)) if (max_p - min_p) > 1e-4 else 1.0
        for k in available_keys
    }

    # Yearly irrigation (Lower is better: saving water)
    w_vals = list(waters.values())
    min_w, max_w = min(w_vals), max(w_vals)
    norm_water = {
        k: ((max_w - waters[k]) / (max_w - min_w)) if (max_w - min_w) > 1e-4 else 1.0
        for k in available_keys
    }

    # Soil: Nitrogen (higher is better) + Bare Days (lower is better)
    n_vals = list(nitrogens.values())
    min_n, max_n = min(n_vals), max(n_vals)
    norm_n = {
        k: ((nitrogens[k] - min_n) / (max_n - min_n)) if (max_n - min_n) > 1e-4 else 1.0
        for k in available_keys
    }

    b_vals = list(bare_days.values())
    min_b, max_b = min(b_vals), max(b_vals)
    norm_bare = {
        k: ((max_b - bare_days[k]) / (max_b - min_b)) if (max_b - min_b) > 1e-4 else 1.0
        for k in available_keys
    }

    norm_soil = {
        k: (0.5 * norm_n[k] + 0.5 * norm_bare[k])
        for k in available_keys
    }

    # 2. Score with farmer's priority weights
    scores = {}
    for k in available_keys:
        sc = (
            weights["profit"] * norm_profit[k]
            + weights["water"] * norm_water[k]
            + weights["soil"] * norm_soil[k]
        )
        scores[k] = round(sc, 4)

    # 3. Determine best strategy: highest score; on a tie (< 0.02), prefer Balanced
    best_key = max(available_keys, key=lambda k: scores[k])
    best_score = scores[best_key]

    if "balanced" in available_keys:
        balanced_score = scores["balanced"]
        if abs(best_score - balanced_score) < 0.02:
            best_key = "balanced"

    # 4. Check identical sequences
    identical_pairs: List[Tuple[str, str]] = []
    for i, s1 in enumerate(available_keys):
        for s2 in available_keys[i + 1 :]:
            if sequences[s1] and sequences[s1] == sequences[s2]:
                identical_pairs.append((s1, s2))

    all_identical = len(available_keys) >= 2 and all(
        sequences[k] == sequences[available_keys[0]] for k in available_keys
    )
    water_equals_balanced = (
        ("balanced", "water") in identical_pairs or ("water", "balanced") in identical_pairs
    )

    identical_note_bn = None
    identical_note_en = None
    if all_identical:
        identical_note_bn = "এই জমিতে চারটি কৌশলই একই পরিকল্পনা দেয়"
        identical_note_en = "For this field, all four strategies produce the identical plan"
    elif water_equals_balanced:
        identical_note_bn = "এই জমিতে সুষম আর পানি সাশ্রয় একই পরিকল্পনা দেয়"
        identical_note_en = "For this field, Balanced and Water-Saving strategies produce the identical rotation"

    # 5. Build reason strings
    irrig_labels_bn = {"ample": "পর্যাপ্ত", "limited": "সীমিত", "none": "নেই"}
    irrig_labels_en = {"ample": "ample", "limited": "limited", "none": "none"}
    irrig_bn = irrig_labels_bn.get(irrig_class, "পর্যাপ্ত")
    irrig_en = irrig_labels_en.get(irrig_class, "ample")

    p_best = profits[best_key]
    w_best = int(round(waters[best_key]))
    p_bal = profits.get("balanced", p_best)
    w_bal = int(round(waters.get("balanced", w_best)))

    if best_key == "water":
        diff_pct = int(round(abs(p_best - p_bal) / p_bal * 100)) if p_bal > 0 else 0
        diff_bn = "কম" if p_best < p_bal else "বেশি"
        diff_en = "lower" if p_best < p_bal else "higher"
        best_reason_bn = (
            f"⭐ পানি সাশ্রয়: আপনার সেচ সুবিধা {irrig_bn}, এই কৌশলে বছরে সেচ সবচেয়ে কম "
            f"({to_bn_digits(w_best)} মিমি), লাভ সুষমের চেয়ে {to_bn_digits(diff_pct)}% {diff_bn}"
        )
        best_reason_en = (
            f"⭐ Water Saving: Your irrigation capacity is {irrig_en}, this strategy uses the lowest yearly "
            f"irrigation ({w_best} mm), profit is {diff_pct}% {diff_en} than Balanced"
        )
    elif best_key == "profit":
        diff_pct = int(round((p_best - p_bal) / p_bal * 100)) if p_bal > 0 else 0
        best_reason_bn = (
            f"⭐ লাভ: আপনার সেচ সুবিধা {irrig_bn}, এই কৌশলে সম্ভাব্য লাভ সবচেয়ে বেশি "
            f"(৳{to_bn_digits(f'{int(round(p_best)):,}')}), সুষমের চেয়ে {to_bn_digits(diff_pct)}% বেশি লাভ"
        )
        best_reason_en = (
            f"⭐ Profit: Your irrigation capacity is {irrig_en}, this strategy achieves the highest profit "
            f"(BDT {int(round(p_best)):,}), {diff_pct}% higher than Balanced"
        )
    elif best_key == "balanced":
        if water_equals_balanced:
            best_reason_bn = (
                f"⭐ সুষম: আপনার সেচ সুবিধা {irrig_bn}; এই জমিতে সুষম আর পানি সাশ্রয় একই পরিকল্পনা দেয় "
                f"(বছরে সেচ {to_bn_digits(w_best)} মিমি, সম্ভাব্য লাভ ৳{to_bn_digits(f'{int(round(p_best)):,}')})"
            )
            best_reason_en = (
                f"⭐ Balanced: Your irrigation capacity is {irrig_en}; Balanced and Water-Saving strategies yield "
                f"the identical plan for this field ({w_best} mm/yr, BDT {int(round(p_best)):,})"
            )
        else:
            best_reason_bn = (
                f"⭐ সুষম: আপনার সেচ সুবিধা {irrig_bn}, লাভ (৳{to_bn_digits(f'{int(round(p_best)):,}')}) ও "
                f"পানি সাশ্রয়ের ({to_bn_digits(w_best)} মিমি) মধ্যে শ্রেষ্ঠ ভারসাম্য"
            )
            best_reason_en = (
                f"⭐ Balanced: Your irrigation capacity is {irrig_en}, optimal multi-criteria trade-off between "
                f"profit (BDT {int(round(p_best)):,}) and water conservation ({w_best} mm)"
            )
    else:  # soil
        best_reason_bn = (
            f"⭐ মাটির স্বাস্থ্য: আপনার সেচ সুবিধা {irrig_bn}, মাটিতে জৈব পুষ্টি ও নাইট্রোজেনের ভারসাম্য রক্ষায় শ্রেষ্ঠ"
        )
        best_reason_en = (
            f"⭐ Soil Health: Your irrigation capacity is {irrig_en}, best strategy for biological nitrogen fixation and soil health"
        )

    return {
        "best_strategy": best_key,
        "best_strategy_title_bn": STRATEGY_TITLES_BN.get(best_key, best_key),
        "best_strategy_title_en": STRATEGY_TITLES_EN.get(best_key, best_key),
        "best_reason_bn": best_reason_bn,
        "best_reason_en": best_reason_en,
        "best_reason": best_reason_bn,
        "irrigation_class": irrig_class,
        "weights_used": weights,
        "scores": scores,
        "identical_pairs": identical_pairs,
        "identical_strategy_note_bn": identical_note_bn,
        "identical_strategy_note_en": identical_note_en,
        "sequences": sequences,
    }
