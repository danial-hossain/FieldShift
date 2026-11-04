# tests/test_replan_split_parts.py
"""Pytest verification for 2-part split field adaptive replanning (Requirement G2)."""

from fastapi.testclient import TestClient
from backend.app.main import app

def test_adaptive_replan_two_part_split():
    client = TestClient(app)

    payload = {
        "field_id": "demo",
        "district": "bogura",
        "field_size_ha": 2.0,
        "priority": "balanced",
        "completed_seasons": [
            {
                "period": "Y1_S1",
                "parts": [
                    {"crop": "Mustard", "areaShare": 0.6, "yield_t_ha": 1.6},
                    {"crop": "Lentil", "areaShare": 0.4, "yield_t_ha": 1.2},
                ],
                "water_applied_mm": 120.0,
                "outcome": "normal",
            }
        ],
        "updated_field_conditions": {
            "soil_ph": 6.8,
            "organic_matter": 2.2,
        }
    }

    response = client.post("/api/workflow/replan", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()

    assert data["status"] == "ok"
    assert data["completed_seasons_count"] == 1
    assert data["remaining_seasons_count"] == 5

    # Check seasonal comparison has completed season with parts
    breakdown = data.get("seasonal_comparison", [])
    assert len(breakdown) == 6
    s1 = breakdown[0]
    assert s1["stage"] == "completed"
    assert "Mustard (60%) + Lentil (40%)" in s1["actual_or_replanned_crop"]
    assert s1["parts"] is not None
    assert len(s1["parts"]) == 2

    # Check plan_change structure
    plan_change = data.get("plan_change")
    assert plan_change is not None
    assert "old_sequence" in plan_change
    assert "new_sequence" in plan_change
    assert len(plan_change["old_sequence"]) == 6
    assert len(plan_change["new_sequence"]) == 6
    assert "profit_delta_bdt" in plan_change
    assert "water_delta_mm" in plan_change
    assert "nitrogen_delta_kg" in plan_change
