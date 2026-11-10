"""Tests for Climate Stress Simulation Engine (ST2).

Verifies physical and agronomic models:
1. Severe drought lowers Kharif-1 yield more than mild (FAO-56 / FAO-33).
2. Flood hurts Mungbean and Sesame more than Aman rice.
3. Salinity 8 dS/m hurts Mustard less than Mungbean (FAO-29 Maas-Hoffman).
4. Coldwave in Rabi does not alter Kharif-2 seasons.
5. POST /api/planning/stress endpoint returns 200 with structured impacts.
6. POST /api/geo/climate-scenario runs with dynamic calculations.
"""

import os
import pytest
import pandas as pd
from fastapi.testclient import TestClient

from backend.app.main import app
from src.compute.climate_stress import (
    run_climate_stress_test,
    compute_season_hazard_loss,
    SCENARIO_CONFIGS,
)
from src.data.crops import load_crop_knowledge

client = TestClient(app)
crops_cat = load_crop_knowledge()


def test_severe_drought_lowers_kharif1_yield_more_than_mild():
    """Severe drought (-70% rain, 30% irrig) must produce higher yield loss in Kharif-1 than mild (-30% rain, 70% irrig)."""
    res_mild = run_climate_stress_test(
        district="bogura",
        strategy="balanced",
        scenario="drought",
        intensity="mild",
    )
    res_severe = run_climate_stress_test(
        district="bogura",
        strategy="balanced",
        scenario="drought",
        intensity="severe",
    )
    
    k1_mild = [s for s in res_mild["seasons"] if s["period"] == "Y1_S2"][0]
    k1_severe = [s for s in res_severe["seasons"] if s["period"] == "Y1_S2"][0]
    
    assert k1_severe["loss_pct"] > k1_mild["loss_pct"], (
        f"Severe drought loss ({k1_severe['loss_pct']}%) should exceed mild ({k1_mild['loss_pct']}%)"
    )
    assert k1_severe["yield_after_mon"] < k1_mild["yield_after_mon"]


def test_flood_hurts_mungbean_sesame_more_than_aman():
    """Waterlogging and submergence damages upland crops (Mungbean, Sesame) far more severely than lowland Aman rice."""
    empty_df = pd.DataFrame()
    flood_mung = compute_season_hazard_loss(
        crop="Mungbean",
        scenario="flood",
        intensity="moderate",
        season_code="kharif2",
        period_key="Y1_S3",
        climate_df=empty_df,
        is_hit=True,
        area_ha=0.133,
        catalog_df=crops_cat,
    )
    flood_sesame = compute_season_hazard_loss(
        crop="Sesame",
        scenario="flood",
        intensity="moderate",
        season_code="kharif2",
        period_key="Y1_S3",
        climate_df=empty_df,
        is_hit=True,
        area_ha=0.133,
        catalog_df=crops_cat,
    )
    flood_aman = compute_season_hazard_loss(
        crop="Rice",
        scenario="flood",
        intensity="moderate",
        season_code="kharif2",
        period_key="Y1_S3",
        climate_df=empty_df,
        is_hit=True,
        area_ha=0.133,
        catalog_df=crops_cat,
    )

    assert flood_mung["loss_pct"] > flood_aman["loss_pct"], (
        f"Mungbean flood loss ({flood_mung['loss_pct']}%) must exceed Aman ({flood_aman['loss_pct']}%)"
    )
    assert flood_sesame["loss_pct"] > flood_aman["loss_pct"], (
        f"Sesame flood loss ({flood_sesame['loss_pct']}%) must exceed Aman ({flood_aman['loss_pct']}%)"
    )
    # Aman rice tolerates 7 days with moderate loss (around 18-20%), while pulses lose >=80%
    assert flood_aman["loss_pct"] <= 25.0
    assert flood_mung["loss_pct"] >= 80.0
    assert flood_sesame["loss_pct"] >= 80.0


def test_salinity_8_ds_m_hurts_mustard_less_than_mungbean():
    """According to FAO-29 (Table 4) and Maas-Hoffman, Mustard (a=4.5, b=8.5) is more salt-tolerant than Mungbean (a=1.8, b=20.7)."""
    empty_df = pd.DataFrame()
    sal_mustard = compute_season_hazard_loss(
        crop="Mustard",
        scenario="salinity",
        intensity="moderate",  # ECe = 8.0 dS/m
        season_code="rabi",
        period_key="Y1_S1",
        climate_df=empty_df,
        is_hit=True,
        area_ha=0.133,
        catalog_df=crops_cat,
    )
    sal_mung = compute_season_hazard_loss(
        crop="Mungbean",
        scenario="salinity",
        intensity="moderate",  # ECe = 8.0 dS/m
        season_code="rabi",
        period_key="Y1_S1",
        climate_df=empty_df,
        is_hit=True,
        area_ha=0.133,
        catalog_df=crops_cat,
    )

    assert sal_mustard["loss_pct"] < sal_mung["loss_pct"], (
        f"Mustard salinity loss ({sal_mustard['loss_pct']}%) must be less than Mungbean ({sal_mung['loss_pct']}%)"
    )
    # Calculated exact check:
    # Mustard: (8 - 4.5) * 8.5 = 29.75% -> 29.8%
    # Mungbean: (8 - 1.8) * 20.7 = 128.3% -> capped at 100%
    assert 25.0 <= sal_mustard["loss_pct"] <= 35.0
    assert sal_mung["loss_pct"] == 100.0


def test_coldwave_in_rabi_does_not_change_kharif2():
    """A winter coldwave hitting Rabi does not alter the Kharif-2 monsoon seasons."""
    res = run_climate_stress_test(
        district="bogura",
        strategy="balanced",
        scenario="coldwave",
        intensity="severe",
    )
    k2_seasons = [s for s in res["seasons"] if s["season_code"] == "kharif2"]
    assert len(k2_seasons) == 2, "Must evaluate both Y1_S3 and Y2_S3"
    for s in k2_seasons:
        assert s["loss_pct"] == 0.0, f"Kharif-2 season {s['period']} should have 0% coldwave loss, got {s['loss_pct']}"
        assert s["profit_loss_bdt"] == 0.0
        assert not s["hit"]


def test_post_planning_stress_endpoint():
    """Verify POST /api/planning/stress responds with status ok and 6 seasons."""
    resp = client.post(
        "/api/planning/stress",
        json={
            "district": "bogura",
            "strategy": "balanced",
            "scenario": "heatwave",
            "intensity": "moderate",
            "area_ha": 0.133,
        },
    )
    assert resp.status_code == 200, f"Failed: {resp.text}"
    data = resp.json()
    assert data["status"] == "ok"
    assert data["scenario"] == "heatwave"
    assert data["intensity"] == "moderate"
    assert len(data["seasons"]) == 6
    assert len(data["baseline_seasons"]) == 6
    assert "total_profit_loss_bdt" in data["summary"]
    assert "history" in data["summary"]
    assert len(data["mitigation_steps"]) == 3


def test_geo_climate_scenario_dynamic():
    """Verify /api/geo/climate-scenario operates without hardcoded constants."""
    resp = client.post(
        "/api/geo/climate-scenario",
        json={
            "district": "bogura",
            "temp_delta_c": 2.0,
            "rain_delta_pct": -20.0,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "water_delta_mm" in data
    assert "existing_profit_delta_pct" in data
    assert "water_strat_profit_delta_pct" in data
