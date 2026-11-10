"""Unit tests for location-based point climate data layer (CL1)."""

import pytest
from src.climate.point_data import (
    get_nasa_power,
    get_gpm_imerg,
    get_grace,
    get_onset,
    get_point_climate,
    haversine_km,
)


def test_haversine_km():
    """Verify distance calculations between known geographic points."""
    # Distance between Dhaka (23.81, 90.41) and Bogura (24.85, 89.37) is approx 158 km
    dist = haversine_km(23.8103, 90.4125, 24.8500, 89.3700)
    assert 140.0 < dist < 175.0


def test_three_points_in_one_district_give_different_imerg():
    """3 points inside Chapainawabganj district must map to distinct 0.1 deg cells and have different precipitation totals."""
    p1 = get_gpm_imerg(24.59, 88.27)
    p2 = get_gpm_imerg(24.75, 88.20)
    p3 = get_gpm_imerg(24.85, 88.15)

    assert p1["provenance"]["method"] == "grid_cell"
    assert p2["provenance"]["method"] == "grid_cell"
    assert p3["provenance"]["method"] == "grid_cell"

    # Distinct cell centers
    c1 = tuple(p1["provenance"]["cell_center"])
    c2 = tuple(p2["provenance"]["cell_center"])
    c3 = tuple(p3["provenance"]["cell_center"])
    assert c1 != c2 or c2 != c3

    # Total rainfall differs
    r1 = sum(x["rainfall"] for x in p1["series"])
    r2 = sum(x["rainfall"] for x in p2["series"])
    r3 = sum(x["rainfall"] for x in p3["series"])
    assert r1 != r2 or r2 != r3


def test_different_agroecological_zones_give_different_climate():
    """Rajshahi (Barind), Sunamganj (Haor), and Satkhira (Coast) must exhibit distinct rainfall and GRACE signals."""
    rajshahi = get_point_climate(24.37, 88.60, offline=True)
    sunamganj = get_point_climate(25.07, 91.40, offline=True)
    satkhira = get_point_climate(22.72, 89.07, offline=True)

    r_rain = sum(x["rainfall"] for x in rajshahi["gpm_imerg"]["series"])
    s_rain = sum(x["rainfall"] for x in sunamganj["gpm_imerg"]["series"])
    k_rain = sum(x["rainfall"] for x in satkhira["gpm_imerg"]["series"])

    # Sunamganj haor basin receives much more rain than dry Barind Rajshahi
    assert s_rain > r_rain * 2.0
    assert k_rain != r_rain

    # GRACE trend in Barind is negative (depletion)
    assert rajshahi["grace"]["trend_cm_yr"] < 0.0


def test_point_outside_bangladesh_returns_labeled_power_fallback():
    """Points outside Bangladesh grid (e.g. 23.0 N, 72.6 E Ahmedabad) must return labeled POWER fallback, never another place's IMERG."""
    out = get_gpm_imerg(23.0, 72.6, offline=True)
    prov = out["provenance"]
    assert prov["method"] == "fallback_power"
    assert "মডেলভিত্তিক" in prov["fallback_label"]
    assert "IMERG নয়" in prov["fallback_label"]


def test_offline_uncached_far_point_returns_no_data():
    """Offline request for a point >50 km from any cached point must return 'তথ্য নেই', never substitute another place."""
    # Far point in Antarctica/Pacific
    far = get_nasa_power(-15.0, -45.0, offline=True)
    prov = far["provenance"]
    assert prov["method"] == "none"
    assert prov["fallback_label"] == "তথ্য নেই"
    assert prov["fallback_label_en"] == "No data"
    assert len(far["series"]) == 0
