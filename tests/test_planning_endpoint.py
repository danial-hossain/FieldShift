"""API integration tests for POST /api/planning.

Tests:
1. POST /api/planning {"district":"rajshahi","priority":p} for p in ["balanced","profit","water","soil"]:
   status 200; result = summary.planning.selected_strategy_result;
   result["status"] == "optimal"; len(selected_crop_by_period) == 6;
   environment_basis == "nasa_power_climatology_25_years".
2. {"district":"sylhet"} -> 400.
3. {"district":"rajshahi","priority":"xyz"} -> 400.
4. Print (pytest -s) the 4 rotations as "priority: Y1_S1=..., ..., Y3_S2=...".
"""

import os
os.environ["OFFLINE"] = "1"

import pytest
import pandas as pd
from fastapi.testclient import TestClient
from backend.app.main import _planning_cache_key, app

client = TestClient(app)


def test_planning_rajshahi_four_priorities(capsys):
    priorities = ["balanced", "profit", "water", "soil"]
    for p in priorities:
        res = client.post("/api/planning", json={"district": "rajshahi", "priority": p})
        assert res.status_code == 200, f"Expected 200 for priority {p}, got {res.status_code}: {res.text}"
        data = res.json()
        assert data["status"] == "ok"
        assert data["summary"]["field_state"]["area_ha"] is None
        
        planning = data.get("summary", {}).get("planning", {})
        result = planning.get("selected_strategy_result")
        assert result is not None, f"selected_strategy_result missing for priority {p}"
        assert result["status"] == "optimal"
        
        crops = result.get("selected_crop_by_period", {})
        assert len(crops) == 6, f"Expected 6 periods, got {len(crops)}"
        
        env_basis = result.get("environment_basis")
        assert env_basis == "nasa_power_climatology_25_years", f"Unexpected env_basis: {env_basis}"
        explanation = result["decision_explanation"]
        season_labels = [reason["season_label"] for reason in explanation["period_reasons"]]
        assert "Year 1 · Season 3 · Kharif-2/Wet" in season_labels
        assert "Year 2 · Season 1 · Dry/Rabi" in season_labels
        assert explanation["objective_components"]["profit_bdt_total"] is None
        
        crops_str = ", ".join(f"{period}={crop}" for period, crop in crops.items())
        print(f"{p}: {crops_str}")


def test_planning_unsupported_district():
    # Note: 'sylhet' is now valid (Phase B added all 64 BD districts).
    # Use a fictitious district name to test the guard.
    res = client.post("/api/planning", json={"district": "unknown_xyz_not_in_registry", "priority": "balanced"})
    assert res.status_code == 400
    assert "Unsupported district" in res.json().get("detail", "")


def test_planning_invalid_priority():
    res = client.post("/api/planning", json={"district": "rajshahi", "priority": "xyz"})
    assert res.status_code == 400
    assert "Invalid priority" in res.json().get("detail", "")


def test_planning_cache_key_tracks_request_and_climate_inputs():
    climate = pd.DataFrame([{"date": "2025-01-01", "rainfall": 10.0}])
    request = {
        "district": "rajshahi",
        "soil_ph": 6.5,
        "organic_matter": 2.0,
        "soil_texture": "loam",
        "irrigation_capacity_mm": 400.0,
    }
    original = _planning_cache_key(request, climate, "rajshahi")
    changed_irrigation = _planning_cache_key(
        {**request, "irrigation_capacity_mm": 0.0}, climate, "rajshahi"
    )
    changed_soil = _planning_cache_key(
        {**request, "soil_ph": 7.0}, climate, "rajshahi"
    )
    changed_climate = _planning_cache_key(
        request, pd.DataFrame([{"date": "2025-01-01", "rainfall": 11.0}]), "rajshahi"
    )
    changed_data_mode = _planning_cache_key(
        {**request, "_climate_data_mode": "online"}, climate, "rajshahi"
    )

    assert original != changed_irrigation
    assert original != changed_soil
    assert original != changed_climate
    assert original != changed_data_mode


@pytest.mark.parametrize(
    ("input_values", "field_name"),
    [
        ({"irrigation_capacity_mm": -1}, "irrigation_capacity_mm"),
        ({"soil_ph": 15}, "soil_ph"),
        ({"organic_matter": -0.1}, "organic_matter"),
    ],
)
def test_planning_rejects_impossible_field_inputs(input_values, field_name):
    response = client.post(
        "/api/planning",
        json={"district": "rajshahi", **input_values},
    )
    assert response.status_code == 400
    assert field_name in response.json()["detail"]


def test_planning_passes_zero_capacity_soil_and_equipment_inputs_to_optimizer(monkeypatch):
    captured = {}

    def fake_optimize_rotation(**kwargs):
        captured.update(kwargs)
        return {
            "status": "optimal",
            "solver_status": "Optimal",
            "selected_crop_by_period": {},
            "baseline_comparison": {},
            "dynamic_agronomic_matrix": {},
            "environment_basis": "test",
        }

    monkeypatch.setattr(
        "src.optimizer.milp.optimize_rotation",
        fake_optimize_rotation,
    )
    monkeypatch.setattr(
        "src.compute.risk_evaluator.compute_planner_risk_suite",
        lambda **kwargs: {},
    )
    response = client.post(
        "/api/planning",
        json={
            "district": "rajshahi",
            "area_ha": 9.876543,
            "soil_texture": "clay",
            "soil_ph": 5.4,
            "organic_matter": 1.3,
            "irrigation_capacity_mm": 0,
            "no_power_tiller": True,
            "labour_shortage": True,
            "market_preferences": ["Mustard"],
        },
    )

    assert response.status_code == 200, response.text
    state = captured["field_state"]
    assert state.texture == "clay"
    assert state.ph == 5.4
    assert state.organic_matter == 1.3
    assert state.irrigation_capacity_mm == 0
    assert captured["excluded_crops"] == ["Potato"]
    planning = response.json()["summary"]["planning"]
    assert planning["unapplied_farmer_constraints"] == [
        "labour_shortage (crop labour-demand metadata is unavailable)",
        "market_preferences (crop-specific market suitability data is not connected to the optimizer)",
    ]
