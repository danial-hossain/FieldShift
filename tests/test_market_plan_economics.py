"""Test suite for /api/market/plan-economics endpoint and price consistency (MP2)."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_market_plan_economics_contract():
    """Verify plan-economics endpoint returns complete contract without hardcoded placeholders."""
    response = client.get("/api/market/plan-economics?field_id=334&strategy=balanced")
    assert response.status_code == 200, response.text
    data = response.json()

    assert data["status"] == "ok"
    assert "field" in data
    assert data["field"]["id"] == "334"
    assert data["field"]["district"] == "rajshahi"
    assert data["strategy"] == "balanced"

    # Yearly totals
    yt = data["yearly_totals"]
    assert yt["plan_profit_bdt_ha"] == 146526.0
    assert yt["current_profit_bdt_ha"] == 55869.0
    assert yt["delta_profit_bdt_ha"] == 90657.0
    assert yt["plan_profit_field"] == int(round(146526.0 * data["field"]["area_ha"]))

    # Seasons breakdown
    seasons = data["seasons"]
    assert len(seasons) == 6
    for s in seasons:
        assert "crop" in s
        assert "yield_maund_bigha" in s
        assert "price_bdt_maund" in s
        assert "price_source" in s
        assert "revenue" in s
        assert "cost" in s
        assert "profit" in s
        assert s["profit"] == s["revenue"] - s["cost"]
        assert "break_even_price_maund" in s

    # Price sensitivity
    ps = data["price_sensitivity"]
    assert ps["downside_20_profit_bdt_ha"] < ps["normal_profit_bdt_ha"] < ps["upside_20_profit_bdt_ha"]
    assert "riskiest_crop" in ps
    assert ps["riskiest_crop"] is not None
    assert "crop" in ps["riskiest_crop"]
    assert "profit_drop_field" in ps["riskiest_crop"]

    # Current seasons
    cur_seasons = data["current_seasons"]
    assert len(cur_seasons) == 6
    for cs in cur_seasons:
        assert cs["profit"] == cs["revenue"] - cs["cost"]


def test_market_plan_economics_profit_strategy():
    """Verify profit strategy re-optimizes with profit weights."""
    response = client.get("/api/market/plan-economics?field_id=334&strategy=profit")
    assert response.status_code == 200
    data = response.json()
    assert data["strategy"] == "profit"
    yt = data["yearly_totals"]
    # Profit strategy should generate >= balanced profit
    assert yt["plan_profit_bdt_ha"] >= 146526.0


def test_market_custom_price_update_and_replan():
    """Verify custom price endpoint updates field history and replans immediately."""
    payload = {
        "field_id": "251",
        "crop": "Mustard",
        "price_bdt_per_maund": 3500.0,
        "strategy": "balanced",
    }
    response = client.post("/api/market/custom-price", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    # Find mustard in seasons
    mustard_seasons = [s for s in data["seasons"] if s["crop"] == "Mustard"]
    if mustard_seasons:
        assert mustard_seasons[0]["is_custom_price"] is True
        assert mustard_seasons[0]["price_bdt_maund"] == 3500.0
        assert "আপনার দেওয়া" in mustard_seasons[0]["price_source"]
