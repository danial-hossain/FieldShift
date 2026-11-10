"""Unit tests for multi-season water plan engine (W1)."""

import math
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from src.compute.water_service import (
    compute_season_water_plan,
    compute_water_plan,
)

client = TestClient(app)


def test_season_water_plan_boro_vs_mustard():
    """Verify Boro rice demands significantly higher irrigation than winter mustard."""
    res_current = compute_season_water_plan("demo", strategy="current")
    assert res_current["status"] == "ok"
    assert len(res_current["seasons"]) == 3

    boro_season = next((s for s in res_current["seasons"] if "boro" in s["crop"].lower()), None)
    assert boro_season is not None, "Boro season must be present in Current rotation"

    res_bal = compute_season_water_plan("demo", strategy="balanced")
    assert res_bal["status"] == "ok"
    assert len(res_bal["seasons"]) == 6

    mustard_season = next((s for s in res_bal["seasons"] if "mustard" in s["crop"].lower()), None)
    assert mustard_season is not None, "Mustard season must be present in Balanced rotation"

    boro_irrig = boro_season["net_irrigation_mm"]
    mustard_irrig = mustard_season["net_irrigation_mm"]

    assert boro_irrig > 800.0, f"Boro irrigation requirement {boro_irrig} should exceed 800 mm"
    assert mustard_irrig < 400.0, f"Mustard irrigation requirement {mustard_irrig} should be under 400 mm"
    assert boro_irrig >= 2.5 * mustard_irrig, "Boro must require at least 2.5x more irrigation than mustard"


def test_dry_year_exceeds_or_equals_normal():
    """Verify dry climatology yields >= normal year irrigation requirements across all seasons."""
    res = compute_season_water_plan("demo", strategy="balanced")
    for s in res["seasons"]:
        net = s["net_irrigation_mm"]
        dry = s["dry_year_irrigation_mm"]
        assert dry >= net, f"Season {s['period']} ({s['crop']}) dry irrigation {dry} < normal {net}"


def test_litres_conversion_arithmetic():
    """Verify litres for the parcel strictly follows mm x area_ha x 10,000."""
    res = compute_season_water_plan("demo", strategy="balanced")
    area_ha = res["field"]["area_ha"]
    assert area_ha > 0

    for s in res["seasons"]:
        expected_litres = int(round(s["net_irrigation_mm"] * area_ha * 10000.0))
        assert s["field_litres"] == expected_litres, (
            f"Litres mismatch in {s['period']}: got {s['field_litres']} vs expected {expected_litres}"
        )

    # Check yearly totals
    yt = res["yearly_totals"]
    expected_plan_litres = int(round(yt["plan_yearly_mm"] * area_ha * 10000.0))
    assert yt["plan_yearly_litres"] == expected_plan_litres

    expected_cur_litres = int(round(yt["current_yearly_mm"] * area_ha * 10000.0))
    assert yt["current_yearly_litres"] == expected_cur_litres

    expected_saved_litres = int(round(yt["saved_yearly_mm"] * area_ha * 10000.0))
    assert yt["saved_yearly_litres"] == expected_saved_litres


def test_api_water_plan_no_typed_fallbacks():
    """Verify that omitting required crop or area_ha raises HTTP 422 instead of silent defaults."""
    # Missing crop
    r1 = client.get("/api/water/plan?district=bogura&area_ha=1.5&lat=24.85&lon=89.37")
    assert r1.status_code == 422
    assert "crop" in r1.json()["detail"].lower()

    # Missing area_ha
    r2 = client.get("/api/water/plan?district=bogura&crop=Mustard&lat=24.85&lon=89.37")
    assert r2.status_code == 422
    assert "area" in r2.json()["detail"].lower()

    # Missing district and coordinates
    r3 = client.get("/api/water/plan?crop=Mustard&area_ha=1.0")
    assert r3.status_code == 422

    # Direct function call ValueError assertions
    with pytest.raises(ValueError, match="Crop"):
        compute_water_plan(district="bogura", crop="", area_ha=1.0)

    with pytest.raises(ValueError, match="area"):
        compute_water_plan(district="bogura", crop="Mustard", area_ha=None)


def test_api_water_season_plan_endpoint():
    """Verify GET /api/water/season-plan responds with valid payload for demo and canonical fields."""
    resp = client.get("/api/water/season-plan?field_id=demo&strategy=balanced")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["field"]["name"] == "রহিম মিয়ার জমি"
    assert len(data["seasons"]) == 6
    assert data["yearly_totals"]["current_yearly_mm"] == 1547.9
    assert data["yearly_totals"]["plan_yearly_mm"] == 717.9
    assert data["yearly_totals"]["saved_yearly_mm"] == 830.0

    # Current rotation strategy
    resp_cur = client.get("/api/water/season-plan?field_id=demo&strategy=current")
    assert resp_cur.status_code == 200
    data_cur = resp_cur.json()
    assert len(data_cur["seasons"]) == 3
    assert data_cur["is_current"] is True
