"""
tests/test_strategy_scoring.py - Unit & integration tests for multi-strategy scoring (S1).
"""

import pytest
from src.optimizer.strategy_scoring import (
    score_and_rank_strategies,
    resolve_irrigation_class,
    IRRIGATION_PRIORITY_WEIGHTS,
)


def test_resolve_irrigation_class():
    assert resolve_irrigation_class(1200.0) == "ample"
    assert resolve_irrigation_class(1000.0) == "ample"
    assert resolve_irrigation_class(400.0) == "limited"
    assert resolve_irrigation_class(300.0) == "limited"
    assert resolve_irrigation_class(0.0) == "none"
    assert resolve_irrigation_class(None) == "ample"


def test_documented_assumption_weights():
    # সেচ সুবিধা পর্যাপ্ত -> profit 0.4 / water 0.3 / soil 0.3
    assert IRRIGATION_PRIORITY_WEIGHTS["ample"] == {"profit": 0.40, "water": 0.30, "soil": 0.30}
    # সীমিত -> 0.3 / 0.5 / 0.2
    assert IRRIGATION_PRIORITY_WEIGHTS["limited"] == {"profit": 0.30, "water": 0.50, "soil": 0.20}
    # নেই -> 0.25 / 0.6 / 0.15
    assert IRRIGATION_PRIORITY_WEIGHTS["none"] == {"profit": 0.25, "water": 0.60, "soil": 0.15}


def test_tie_breaking_prefers_balanced():
    # When strategies are tied or within 0.02 of Balanced, Balanced is chosen
    plans = {
        "balanced": {
            "plan_profit_bdt": 100000.0,
            "plan_irrigation_mm": 500.0,
            "plan_nitrogen_kg": 35.0,
            "plan_bare_days": 60,
            "selected_crop_by_period": {"Y1_S1": "Mustard", "Y1_S2": "Mungbean", "Y1_S3": "Rice", "Y2_S1": "Chickpea", "Y2_S2": "Sesame", "Y2_S3": "Rice"}
        },
        "water": {
            "plan_profit_bdt": 100000.0,
            "plan_irrigation_mm": 500.0,
            "plan_nitrogen_kg": 35.0,
            "plan_bare_days": 60,
            "selected_crop_by_period": {"Y1_S1": "Mustard", "Y1_S2": "Mungbean", "Y1_S3": "Rice", "Y2_S1": "Chickpea", "Y2_S2": "Sesame", "Y2_S3": "Rice"}
        },
        "profit": {
            "plan_profit_bdt": 100000.0,
            "plan_irrigation_mm": 500.0,
            "plan_nitrogen_kg": 35.0,
            "plan_bare_days": 60,
            "selected_crop_by_period": {"Y1_S1": "Mustard", "Y1_S2": "Soybean", "Y1_S3": "Rice", "Y2_S1": "Wheat", "Y2_S2": "Sesame", "Y2_S3": "Rice"}
        },
        "soil": {
            "plan_profit_bdt": 100000.0,
            "plan_irrigation_mm": 500.0,
            "plan_nitrogen_kg": 35.0,
            "plan_bare_days": 60,
            "selected_crop_by_period": {"Y1_S1": "Mustard", "Y1_S2": "Mungbean", "Y1_S3": "Rice", "Y2_S1": "Chickpea", "Y2_S2": "Sesame", "Y2_S3": "Rice"}
        },
    }
    res = score_and_rank_strategies(plans, irrigation_capacity_mm=400.0)
    assert res["best_strategy"] == "balanced"
    assert "সুষম" in res["best_reason_bn"]


def test_identical_sequence_detection():
    plans = {
        "balanced": {
            "plan_profit_bdt": 145393.0,
            "plan_irrigation_mm": 717.9,
            "plan_nitrogen_kg": 35.0,
            "plan_bare_days": 60,
            "selected_crop_by_period": {"Y1_S1": "Mustard", "Y1_S2": "Mungbean", "Y1_S3": "Rice", "Y2_S1": "Chickpea", "Y2_S2": "Sesame", "Y2_S3": "Rice"}
        },
        "water": {
            "plan_profit_bdt": 145393.0,
            "plan_irrigation_mm": 717.9,
            "plan_nitrogen_kg": 35.0,
            "plan_bare_days": 60,
            "selected_crop_by_period": {"Y1_S1": "Mustard", "Y1_S2": "Mungbean", "Y1_S3": "Rice", "Y2_S1": "Chickpea", "Y2_S2": "Sesame", "Y2_S3": "Rice"}
        },
        "profit": {
            "plan_profit_bdt": 235462.0,
            "plan_irrigation_mm": 999.4,
            "plan_nitrogen_kg": 35.0,
            "plan_bare_days": 60,
            "selected_crop_by_period": {"Y1_S1": "Potato", "Y1_S2": "Mungbean", "Y1_S3": "Rice", "Y2_S1": "Tomato", "Y2_S2": "Soybean", "Y2_S3": "Rice"}
        },
        "soil": {
            "plan_profit_bdt": 145393.0,
            "plan_irrigation_mm": 717.9,
            "plan_nitrogen_kg": 35.0,
            "plan_bare_days": 60,
            "selected_crop_by_period": {"Y1_S1": "Mustard", "Y1_S2": "Mungbean", "Y1_S3": "Rice", "Y2_S1": "Chickpea", "Y2_S2": "Sesame", "Y2_S3": "Rice"}
        },
    }
    res = score_and_rank_strategies(plans, irrigation_capacity_mm=1200.0)
    assert res["identical_strategy_note_bn"] == "এই জমিতে সুষম আর পানি সাশ্রয় একই পরিকল্পনা দেয়"
    assert res["identical_strategy_note_en"] == "For this field, Balanced and Water-Saving strategies produce the identical rotation"


def test_rahim_field_star_changes_with_irrigation_ample_vs_none():
    """
    Verifies that for the same Rahim field:
    - সেচ সুবিধা পর্যাপ্ত (1200 mm): Profit strategy is best suited (⭐) due to higher profitability within water limits.
    - সেচ সুবিধা নেই (0 mm): Balanced strategy is best suited (⭐) as all plans converge to rainfed fallow.
    """
    # 1. Ample irrigation (1200 mm)
    plans_ample = {
        "balanced": {
            "plan_profit_bdt": 145393.0,
            "plan_irrigation_mm": 717.9,
            "plan_nitrogen_kg": 35.0,
            "plan_bare_days": 60,
            "selected_crop_by_period": {"Y1_S1": "Mustard", "Y1_S2": "Mungbean", "Y1_S3": "Rice", "Y2_S1": "Chickpea", "Y2_S2": "Sesame", "Y2_S3": "Rice"}
        },
        "profit": {
            "plan_profit_bdt": 235462.0,
            "plan_irrigation_mm": 999.4,
            "plan_nitrogen_kg": 35.0,
            "plan_bare_days": 60,
            "selected_crop_by_period": {"Y1_S1": "Potato", "Y1_S2": "Mungbean", "Y1_S3": "Rice", "Y2_S1": "Tomato", "Y2_S2": "Soybean", "Y2_S3": "Rice"}
        },
        "water": {
            "plan_profit_bdt": 145393.0,
            "plan_irrigation_mm": 717.9,
            "plan_nitrogen_kg": 35.0,
            "plan_bare_days": 60,
            "selected_crop_by_period": {"Y1_S1": "Mustard", "Y1_S2": "Mungbean", "Y1_S3": "Rice", "Y2_S1": "Chickpea", "Y2_S2": "Sesame", "Y2_S3": "Rice"}
        },
        "soil": {
            "plan_profit_bdt": 145393.0,
            "plan_irrigation_mm": 717.9,
            "plan_nitrogen_kg": 35.0,
            "plan_bare_days": 60,
            "selected_crop_by_period": {"Y1_S1": "Mustard", "Y1_S2": "Mungbean", "Y1_S3": "Rice", "Y2_S1": "Chickpea", "Y2_S2": "Sesame", "Y2_S3": "Rice"}
        },
    }
    res_ample = score_and_rank_strategies(plans_ample, irrigation_capacity_mm=1200.0)
    assert res_ample["best_strategy"] == "profit"
    assert res_ample["scores"]["profit"] > res_ample["scores"]["balanced"]
    assert "লাভ" in res_ample["best_reason_bn"]

    # 2. No irrigation (0 mm)
    plans_none = {
        "balanced": {
            "plan_profit_bdt": 51835.0,
            "plan_irrigation_mm": 518.2,
            "plan_nitrogen_kg": 35.0,
            "plan_bare_days": 160,
            "selected_crop_by_period": {"Y1_S1": "Fallow", "Y1_S2": "Mungbean", "Y1_S3": "Rice", "Y2_S1": "Fallow", "Y2_S2": "Soybean", "Y2_S3": "Rice"}
        },
        "profit": {
            "plan_profit_bdt": 51835.0,
            "plan_irrigation_mm": 518.2,
            "plan_nitrogen_kg": 35.0,
            "plan_bare_days": 160,
            "selected_crop_by_period": {"Y1_S1": "Fallow", "Y1_S2": "Mungbean", "Y1_S3": "Rice", "Y2_S1": "Fallow", "Y2_S2": "Soybean", "Y2_S3": "Rice"}
        },
        "water": {
            "plan_profit_bdt": 51835.0,
            "plan_irrigation_mm": 518.2,
            "plan_nitrogen_kg": 35.0,
            "plan_bare_days": 160,
            "selected_crop_by_period": {"Y1_S1": "Fallow", "Y1_S2": "Mungbean", "Y1_S3": "Rice", "Y2_S1": "Fallow", "Y2_S2": "Soybean", "Y2_S3": "Rice"}
        },
        "soil": {
            "plan_profit_bdt": 51835.0,
            "plan_irrigation_mm": 518.2,
            "plan_nitrogen_kg": 35.0,
            "plan_bare_days": 160,
            "selected_crop_by_period": {"Y1_S1": "Fallow", "Y1_S2": "Mungbean", "Y1_S3": "Rice", "Y2_S1": "Fallow", "Y2_S2": "Soybean", "Y2_S3": "Rice"}
        },
    }
    res_none = score_and_rank_strategies(plans_none, irrigation_capacity_mm=0.0)
    assert res_none["best_strategy"] == "balanced"
    assert "সুষম" in res_none["best_reason_bn"]

    # Star changes from profit to balanced
    assert res_ample["best_strategy"] != res_none["best_strategy"]


def test_rd5_profit_banner_reconciles_field_basis_and_cards():
    """RD5: Profit banner explicitly labels and uses field-level profit BDT/yr matching cards."""
    plans = {
        "balanced": {
            "plan_profit_bdt": 127785.0,  # ~127k / ha
            "plan_irrigation_mm": 718.0,
            "plan_nitrogen_kg": 35.0,
            "plan_bare_days": 60,
            "selected_crop_by_period": {"Y1_S1": "Mustard", "Y1_S2": "Mungbean", "Y1_S3": "Rice", "Y2_S1": "Chickpea", "Y2_S2": "Sesame", "Y2_S3": "Rice"},
        },
        "profit": {
            "plan_profit_bdt": 188877.0,  # ~188k / ha
            "plan_irrigation_mm": 950.0,
            "plan_nitrogen_kg": 35.0,
            "plan_bare_days": 60,
            "selected_crop_by_period": {"Y1_S1": "Tomato", "Y1_S2": "Soybean", "Y1_S3": "Rice", "Y2_S1": "Sunflower", "Y2_S2": "Mungbean", "Y2_S3": "Rice"},
        },
    }
    # For a 5-bigha field (0.67 ha)
    res = score_and_rank_strategies(plans, irrigation_capacity_mm=1200.0, field_area_ha=0.67)
    assert res["best_strategy"] == "profit"
    # 188,877 * 0.67 = 126,548
    assert "126,548" in res["best_reason_en"]
    assert "5-bigha field" in res["best_reason_en"]
    assert "১২৬,৫৪৮" in res["best_reason_bn"]
    assert "৫ বিঘা" in res["best_reason_bn"]

