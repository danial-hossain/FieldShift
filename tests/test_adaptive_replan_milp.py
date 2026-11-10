"""tests/test_adaptive_replan_milp.py
Verification for Adaptive Replan using the SAME season grid and MILP optimizer as the planner (R1 & R2).
"""

import os
os.environ["OFFLINE"] = "1"

import pytest
import pandas as pd
from fastapi.testclient import TestClient
from backend.app.main import app
from src.state.field_state import build_field_state
from src.data.crops import load_crop_knowledge
from src.compute.advisory_service import load_district_climate_data
from src.optimizer.adaptive_replan import run_adaptive_replan
from src.optimizer.milp import optimize_rotation

client = TestClient(app)


def test_r1_zero_finished_seasons_matches_planner_plan():
    """Verify that with 0 finished seasons, replan plan identically equals the planner plan."""
    crops_df = load_crop_knowledge()
    power, _ = load_district_climate_data("chapainawabganj", offline=True)
    if "date" in power.columns:
        power["date"] = pd.to_datetime(power["date"])

    state = build_field_state(
        "rahim_field",
        24.62,
        88.55,
        power["date"].max(),
        power.tail(60),
        crop_knowledge=crops_df,
    )
    state.field_size_ha = 0.67
    state.area_ha = 0.67
    state.texture = "clay_loam"
    state.district = "chapainawabganj"
    state.seasonally_flooded = False

    # 1. Direct optimizer call (same as /api/planning)
    planning_res = optimize_rotation(
        field_state=state,
        crops=crops_df,
        environmental_history=power,
        profit_weight=0.34,
        water_weight=0.33,
        soil_weight=0.33,
        national_need_weight=0.0,
        allow_kharif2_fallow=False,
        min_cereals_per_year=1,
        seasonally_flooded=False,
        fixed_crops_by_period=None,
    )
    planner_sequence = [planning_res["selected_crop_by_period"][p] for p in planning_res["planning_periods"]]

    # 2. Adaptive replan with 0 finished seasons
    replan_res = run_adaptive_replan(
        field_state=state,
        environmental_history=power,
        completed_seasons=[],
        crops=crops_df,
        priority="balanced",
    )

    replan_sequence = replan_res["new_plan"]["sequence"]
    assert replan_sequence == planner_sequence, f"Replan {replan_sequence} must match planner {planner_sequence}"
    assert replan_res["completed_seasons_count"] == 0
    assert replan_res["remaining_seasons_count"] == 6


def test_r2_low_mustard_yield_reduces_margin_and_adapts():
    """Verify low Mustard yield in Y1 Rabi calibrates future yield and impacts planning."""
    crops_df = load_crop_knowledge()
    power, _ = load_district_climate_data("chapainawabganj", offline=True)
    if "date" in power.columns:
        power["date"] = pd.to_datetime(power["date"])

    state = build_field_state(
        "rahim_field",
        24.62,
        88.55,
        power["date"].max(),
        power.tail(60),
        crop_knowledge=crops_df,
    )
    state.field_size_ha = 0.67
    state.area_ha = 0.67
    state.texture = "clay_loam"
    state.district = "chapainawabganj"

    # Farmer recorded low mustard yield (3 maund/bigha at 2400 BDT/maund)
    completed = [
        {
            "period": "Y1_S1",
            "crop": "Mustard",
            "yield_maund_bigha": 3.0,
            "sale_price_bdt_maund": 2400.0,
            "outcome": "poor",
        }
    ]

    replan_res = run_adaptive_replan(
        field_state=state,
        environmental_history=power,
        completed_seasons=completed,
        crops=crops_df,
        priority="balanced",
    )

    assert replan_res["completed_seasons_count"] == 1
    assert replan_res["remaining_seasons_count"] == 5
    assert len(replan_res["calibration_table"]) >= 1

    mustard_cal = [c for c in replan_res["calibration_table"] if "mustard" in c["crop"].lower()][0]
    assert mustard_cal["ratio"] < 1.0, f"Mustard ratio should be < 1.0, got {mustard_cal['ratio']}"
    assert mustard_cal["is_uncertain"] is True  # 1 record -> uncertain badge


def test_r2_high_mungbean_price_raises_mungbean_margin():
    """Verify high Mungbean price raises Mungbean margin for future seasons."""
    crops_df = load_crop_knowledge()
    power, _ = load_district_climate_data("chapainawabganj", offline=True)
    if "date" in power.columns:
        power["date"] = pd.to_datetime(power["date"])

    state = build_field_state(
        "rahim_field",
        24.62,
        88.55,
        power["date"].max(),
        power.tail(60),
        crop_knowledge=crops_df,
    )
    state.field_size_ha = 0.67
    state.district = "chapainawabganj"

    # Farmer recorded high Mungbean sale price: 9000 BDT/maund
    completed = [
        {"period": "Y1_S1", "crop": "Mustard", "yield_maund_bigha": 6.0, "sale_price_bdt_maund": 3000.0},
        {"period": "Y1_S2", "crop": "Mungbean", "yield_maund_bigha": 4.0, "sale_price_bdt_maund": 9000.0},
    ]

    replan_res = run_adaptive_replan(
        field_state=state,
        environmental_history=power,
        completed_seasons=completed,
        crops=crops_df,
        priority="profit",
    )

    assert replan_res["completed_seasons_count"] == 2
    assert replan_res["remaining_seasons_count"] == 4
    mungbean_cal = [c for c in replan_res["calibration_table"] if "mungbean" in c["crop"].lower()][0]
    assert mungbean_cal["price_bdt_maund"] == 9000.0
    assert mungbean_cal["price_source"] == "কৃষকের দেওয়া"


def test_r2_five_finished_seasons_leaves_one_to_plan():
    """Verify recording 5 finished seasons leaves exactly 1 remaining season to replan."""
    crops_df = load_crop_knowledge()
    power, _ = load_district_climate_data("chapainawabganj", offline=True)
    if "date" in power.columns:
        power["date"] = pd.to_datetime(power["date"])

    state = build_field_state(
        "rahim_field",
        24.62,
        88.55,
        power["date"].max(),
        power.tail(60),
        crop_knowledge=crops_df,
    )
    state.field_size_ha = 0.67
    state.district = "chapainawabganj"

    completed = [
        {"period": "Y1_S1", "crop": "Mustard", "yield_maund_bigha": 6.0, "sale_price_bdt_maund": 3000.0},
        {"period": "Y1_S2", "crop": "Mungbean", "yield_maund_bigha": 4.0, "sale_price_bdt_maund": 4500.0},
        {"period": "Y1_S3", "crop": "T. Aman Rice", "yield_maund_bigha": 15.0, "sale_price_bdt_maund": 1200.0},
        {"period": "Y2_S1", "crop": "Wheat", "yield_maund_bigha": 12.0, "sale_price_bdt_maund": 1800.0},
        {"period": "Y2_S2", "crop": "Jute", "yield_maund_bigha": 8.0, "sale_price_bdt_maund": 2800.0},
    ]

    replan_res = run_adaptive_replan(
        field_state=state,
        environmental_history=power,
        completed_seasons=completed,
        crops=crops_df,
        priority="balanced",
    )

    assert replan_res["completed_seasons_count"] == 5
    assert replan_res["remaining_seasons_count"] == 1
    assert len(replan_res["replanned_schedule"]) == 1
    assert replan_res["replanned_schedule"][0]["season_name"] == "Year 2 Kharif-2"


def test_r2e_irrigation_class_impacts_remaining_plan():
    """Verify ample vs no irrigation gives lower water usage or different remaining plan."""
    crops_df = load_crop_knowledge()
    power, _ = load_district_climate_data("chapainawabganj", offline=True)
    if "date" in power.columns:
        power["date"] = pd.to_datetime(power["date"])

    state = build_field_state(
        "rahim_field",
        24.62,
        88.55,
        power["date"].max(),
        power.tail(60),
        crop_knowledge=crops_df,
    )
    state.field_size_ha = 0.67
    state.district = "chapainawabganj"

    completed = [{"period": "Y1_S1", "crop": "Mustard", "yield_maund_bigha": 7.0, "sale_price_bdt_maund": 3000.0}]

    res_full = run_adaptive_replan(
        field_state=state,
        environmental_history=power,
        completed_seasons=completed,
        crops=crops_df,
        water_availability="full",
    )

    res_none = run_adaptive_replan(
        field_state=state,
        environmental_history=power,
        completed_seasons=completed,
        crops=crops_df,
        water_availability="none",
    )

    irrig_full = res_full["totals"]["remaining_irrigation_new_mm"]
    irrig_none = res_none["totals"]["remaining_irrigation_new_mm"]
    assert irrig_none <= irrig_full, f"No-irrigation water ({irrig_none}) should be <= full irrigation ({irrig_full})"


def test_r3_replan_output_payload_structure():
    """Verify R3 requirements: finished_seasons, original_plan vs new_plan, why_changed, totals, calibration_table."""
    crops_df = load_crop_knowledge()
    power, _ = load_district_climate_data("chapainawabganj", offline=True)
    if "date" in power.columns:
        power["date"] = pd.to_datetime(power["date"])

    state = build_field_state(
        "rahim_field",
        24.62,
        88.55,
        power["date"].max(),
        power.tail(60),
        crop_knowledge=crops_df,
    )
    state.field_size_ha = 0.67
    state.district = "chapainawabganj"

    completed = [
        {"period": "Y1_S1", "crop": "Mustard", "yield_maund_bigha": 3.0, "sale_price_bdt_maund": 2400.0, "outcome": "poor"},
    ]

    res = run_adaptive_replan(
        field_state=state,
        environmental_history=power,
        completed_seasons=completed,
        crops=crops_df,
        priority="balanced",
    )

    assert "finished_seasons" in res
    assert len(res["finished_seasons"]) == 1
    fs = res["finished_seasons"][0]
    assert fs["crop"] == "Mustard"
    assert fs["yield_maund_bigha"] == 3.0
    assert fs["price_bdt_maund"] == 2400.0
    assert "actual_profit_bdt" in fs

    assert "original_plan" in res
    assert "new_plan" in res
    assert "remaining_sequence" in res["original_plan"]
    assert "remaining_sequence" in res["new_plan"]

    assert "why_changed" in res
    assert len(res["why_changed"]) == 5  # 5 remaining seasons

    assert "totals" in res
    totals = res["totals"]
    assert "profit_so_far_actual_bdt" in totals
    assert "profit_remaining_projected_bdt" in totals
    assert "total_2year_profit_bdt" in totals
    assert "original_2year_profit_bdt" in totals
    assert "remaining_irrigation_old_mm" in totals
    assert "remaining_irrigation_new_mm" in totals
    assert "nitrogen_delta_kg" in totals
    assert "bare_days_old" in totals
    assert "bare_days_new" in totals

    assert "calibration_table" in res
    cal = res["calibration_table"][0]
    assert cal["crop"] == "Mustard"
    assert "ratio" in cal
    assert "price_source" in cal


def test_rd1_failed_crop_loss_and_calibration():
    """RD1: Failed crop or 0 yield must count as negative profit (loss),
    total(failed) < total(poor) < total(normal) < total(great),
    and calibration table must record the failure with ratio=0.7 (learned < expected)."""
    crops_df = load_crop_knowledge()
    power, _ = load_district_climate_data("chapainawabganj", offline=True)
    if "date" in power.columns:
        power["date"] = pd.to_datetime(power["date"])

    state = build_field_state(
        "rahim_field",
        24.62,
        88.55,
        power["date"].max(),
        power.tail(60),
        crop_knowledge=crops_df,
    )
    state.field_size_ha = 0.67
    state.area_ha = 0.67
    state.texture = "clay_loam"
    state.district = "chapainawabganj"

    res_failed = run_adaptive_replan(
        field_state=state,
        environmental_history=power,
        completed_seasons=[{"crop": "Mustard", "yield_maund_bigha": 0.0, "sale_price_bdt_maund": 3200, "outcome": "failed"}],
        priority="balanced",
    )
    res_poor = run_adaptive_replan(
        field_state=state,
        environmental_history=power,
        completed_seasons=[{"crop": "Mustard", "yield_maund_bigha": 2.0, "sale_price_bdt_maund": 3200, "outcome": "poor"}],
        priority="balanced",
    )
    res_normal = run_adaptive_replan(
        field_state=state,
        environmental_history=power,
        completed_seasons=[{"crop": "Mustard", "yield_maund_bigha": 5.0, "sale_price_bdt_maund": 3200, "outcome": "normal"}],
        priority="balanced",
    )
    res_great = run_adaptive_replan(
        field_state=state,
        environmental_history=power,
        completed_seasons=[{"crop": "Mustard", "yield_maund_bigha": 7.0, "sale_price_bdt_maund": 3200, "outcome": "great"}],
        priority="balanced",
    )

    p_failed = res_failed["new_plan"]["total_profit_bdt"]
    p_poor = res_poor["new_plan"]["total_profit_bdt"]
    p_normal = res_normal["new_plan"]["total_profit_bdt"]
    p_great = res_great["new_plan"]["total_profit_bdt"]

    assert p_failed < p_poor < p_normal < p_great, f"Expected {p_failed} < {p_poor} < {p_normal} < {p_great}"

    fs_failed = res_failed["finished_seasons"][0]
    assert fs_failed["actual_profit_bdt"] < 0, f"Expected negative profit for failed crop, got {fs_failed['actual_profit_bdt']}"

    cal = res_failed["calibration_table"][0]
    assert cal["crop"] == "Mustard"
    assert cal["ratio"] <= 0.7
    assert cal["outcome"] == "failed"

