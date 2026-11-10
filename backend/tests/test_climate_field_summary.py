"""Unit and API integration tests for Climate Field Summary endpoint.

Verifies:
- 3 points inside one district give different IMERG values
- Rajshahi vs Sunamganj vs Satkhira give different summaries
- Foreign point (23.0 N, 72.6 E) works from POWER with labelled rain fallback
- Offline + uncached far point returns "তথ্য নেই", not another place's data
- Decadal trends, p-values, "তখন বনাম এখন" and risk calendar distributions
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_three_points_same_district_differ():
    """Verify 3 points in Chapainawabganj resolve to distinct 0.1° grid cells and different rain totals."""
    res1 = client.get("/api/climate/field-summary?lat=24.59&lon=88.27")
    res2 = client.get("/api/climate/field-summary?lat=24.75&lon=88.20")
    res3 = client.get("/api/climate/field-summary?lat=24.85&lon=88.15")

    assert res1.status_code == 200
    assert res2.status_code == 200
    assert res3.status_code == 200

    d1 = res1.json()
    d2 = res2.json()
    d3 = res3.json()

    # Provenance grid cells differ
    cell1 = tuple(d1["provenance"]["rain"]["cell_center"])
    cell2 = tuple(d2["provenance"]["rain"]["cell_center"])
    cell3 = tuple(d3["provenance"]["rain"]["cell_center"])
    assert cell1 != cell2 or cell2 != cell3

    # Cumulative annual rain totals differ across 24 years
    annual1 = sum(d1["summary"]["annual"])
    annual2 = sum(d2["summary"]["annual"])
    annual3 = sum(d3["summary"]["annual"])
    assert annual1 != annual2
    assert annual2 != annual3


def test_cross_zone_summaries_differ():
    """Rajshahi (Barind), Sunamganj (Haor), and Satkhira (Coast) produce distinct agro-climatic profiles."""
    res_raj = client.get("/api/climate/field-summary?lat=24.37&lon=88.60").json()
    res_sun = client.get("/api/climate/field-summary?lat=25.07&lon=91.40").json()
    res_sat = client.get("/api/climate/field-summary?lat=22.72&lon=89.07").json()

    # Rain: Sunamganj (Haor) gets far more rain than Rajshahi (Barind)
    raj_annual = sum(res_raj["summary"]["annual"])
    sun_annual = sum(res_sun["summary"]["annual"])
    sat_annual = sum(res_sat["summary"]["annual"])

    assert sun_annual > raj_annual * 2.0  # Haor rainfall > 2x Barind rainfall
    assert sat_annual > raj_annual

    # GRACE groundwater trends differ across hydrological regions
    raj_grace = res_raj["summary"]["grace"]["sens_slope_cm_yr"]
    sun_grace = res_sun["summary"]["grace"]["sens_slope_cm_yr"]
    assert raj_grace < 0.0  # Barind groundwater depletion
    assert sun_grace > raj_grace


def test_foreign_point_labelled_rain_fallback():
    """A point in another country (23.0 N, 72.6 E) uses POWER with labelled fallback for rainfall."""
    res = client.get("/api/climate/field-summary?lat=23.0&lon=72.6")
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "success"
    # Rain fallback method is clearly indicated in provenance
    rain_prov = data["provenance"]["rain"]
    assert rain_prov["method"] in ("fallback_power", "fallback_power_model")
    assert "POWER" in rain_prov["source"]


def test_offline_uncached_far_point_returns_no_data():
    """Offline uncached far point returns 'তথ্য নেই', never fabricated data or distant station."""
    res = client.get("/api/climate/field-summary?lat=12.34&lon=56.78&offline=true")
    assert res.status_code == 200
    data = res.json()

    assert data.get("status") == "unavailable"
    assert "তথ্য নেই" in data.get("message", "")


def test_default_demo_field():
    """When called without params, returns Rahim's plot (24.59, 88.27) with full summary structure."""
    res = client.get("/api/climate/field-summary")
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "success"
    assert data["lat"] == 24.59
    assert data["lon"] == 88.27
    assert data["field_name"] == "রহিম মিয়ার জমি"

    summary = data["summary"]
    assert len(summary["years"]) == 24
    assert len(summary["tmax"]) == 24
    assert len(summary["tmin"]) == 24
    assert len(summary["heat"]) == 24
    assert len(summary["annual"]) == 24

    # Trend arrays [slope_per_decade, p_value]
    assert len(summary["tmax_trend"]) == 2
    assert len(summary["annual_trend"]) == 2

    # Monthly hazard calendar arrays have 12 months
    assert len(summary["month_heat5"]) == 12
    assert len(summary["month_heatdays"]) == 12
    assert len(summary["month_dry10"]) == 12
    assert len(summary["month_heavy"]) == 12
    assert len(summary["norm_rain"]) == 12

    # "তখন বনাম এখন" card data
    tvn = summary["then_vs_now"]
    assert tvn is not None
    assert tvn["period_then"] == "1981–1990"
    assert tvn["period_now"] == "2015–2024"
    assert "tmax_diff" in tvn
    assert "heat_days_diff" in tvn
    assert "cold_nights_diff" in tvn
    assert "frost_days_diff" in tvn

    # Recent weather block
    recent = summary["recent"]
    assert "tmax" in recent
    assert "tmin" in recent
    assert "rain" in recent
    assert "et0" in recent
    assert "norm_tmax" in recent
    assert "summary_bn" in recent
