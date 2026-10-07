from fastapi.testclient import TestClient
import pytest

from backend.app.main import app


def test_counterfactual_reoptimization_api_returns_solver_result():
    payload = {
        "field_id": "demo",
        "mode": "offline",
        "latitude": 23.8103,
        "longitude": 90.4125,
        "field_size_ha": 10.0,
        "area_ha": 10.0,
        "soil_texture": "loam",
        "organic_matter": 2.5,
        "irrigation_capacity_mm": 90.0,
        "priority": "balanced",
        "optimization_strategy": "balanced",
        "start_date": "2026-08-31",
        "end_date": "2026-09-29",
        "counterfactual_rainfall_delta_mm": -10.0,
        "include_history": False,
        "include_previous_crop_history": False,
    }

    response = TestClient(app).post("/api/counterfactual/reoptimize", json=payload)

    assert response.status_code == 200, response.text
    result = response.json()
    assert result["scenario"] == "Custom Counterfactual"
    assert result["status"] == "completed"
    assert result["solver"] == "PuLP/CBC"
    assert result["solver_status"] == "Optimal"
    assert result["counterfactual_inputs"]["rainfall_window_mm"] == pytest.approx(
        result["baseline_inputs"]["rainfall_window_mm"] - 10.0
    )
    assert result["solver_inputs"]["environmental_history_rainfall_total_mm"] == pytest.approx(
        result["counterfactual_inputs"]["rainfall_window_mm"]
    )
    assert result["counterfactual_inputs"]["irrigation_capacity_mm"] == (
        result["baseline_inputs"]["irrigation_capacity_mm"]
    )
    assert result["solver_inputs"]["include_previous_crop_history"] is False
    assert result["solver_inputs"]["previous_crop_history_rows"] == 0
    assert len(result["baseline_rotation"]) == 6
    assert len(result["counterfactual_rotation"]) == 6
    assert result["provenance"]["scenario"] == "hypothetical/counterfactual"
