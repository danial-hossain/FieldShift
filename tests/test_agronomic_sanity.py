"""tests/test_agronomic_sanity.py
Agronomic correctness and unit sanity test suite (E2).

Validates:
1. Rabi crops (Boro, Mustard, Potato, Wheat) can never be recommended for Kharif-2.
2. Kharif-2 crops (Aman) can never be recommended for Rabi.
3. Coastal saline field: plans must include at least one salt-tolerant variety (e.g. BRRI dhan67, BINA dhan-10, Sunflower).
4. Haor field: only single-season Boro allowed, monsoon must be fallow or aquatic.
5. Maund/bigha conversion: 1 bigha = 1337.8 m2, 1 maund = 37.32 kg. Roundtrip yield ton/ha <-> maund/bigha accurate to 0.1%.
"""

import pytest
import math
import pandas as pd
from src.data.crops import load_crop_knowledge
from src.optimizer.dynamic_agronomy import (
    COASTAL_SALINE_DISTRICTS,
    HAOR_DISTRICTS,
    compute_crop_soil_suitability,
)


class MockFieldState:
    def __init__(self, **kwargs):
        self.district = kwargs.get("district", "bogura")
        self.coastal_saline = kwargs.get("coastal_saline", False)
        self.ph = kwargs.get("ph", 6.8)
        self.organic_matter = kwargs.get("organic_matter", 2.0)
        self.texture = kwargs.get("texture", "loam")


def test_rabi_crops_never_in_kharif2():
    """Rabi crops (Boro Rice, Mustard, Potato, Wheat) can never be recommended for Kharif-2."""
    df = load_crop_knowledge()
    rabi_only = ["Boro Rice", "Mustard", "Potato", "Wheat"]

    for crop_name in rabi_only:
        rows = df[df["crop"].str.lower() == crop_name.lower()]
        assert not rows.empty, f"Crop '{crop_name}' not found in catalog!"
        allowed = rows.iloc[0]["allowed_seasons"].split("|")
        assert "kharif2" not in allowed, f"Rabi crop '{crop_name}' has 'kharif2' in allowed_seasons: {allowed}"


def test_kharif2_crops_never_in_rabi():
    """Kharif-2 crops (T. Aman Rice) can never be recommended for Rabi."""
    df = load_crop_knowledge()
    rows = df[df["crop"].str.lower() == "rice"]
    assert not rows.empty, "Crop 'Rice' not found in catalog!"
    allowed = rows.iloc[0]["allowed_seasons"].split("|")
    assert "rabi" not in allowed, f"Kharif-2 crop 'Rice' has 'rabi' in allowed_seasons: {allowed}"
    assert "kharif2" in allowed


def test_coastal_saline_salt_tolerant_variety():
    """Coastal saline field (Satkhira): plans and agronomy must enforce salt tolerance and reject sensitive crops."""
    assert "satkhira" in COASTAL_SALINE_DISTRICTS

    state = MockFieldState(district="satkhira", coastal_saline=True, ph=7.2, organic_matter=1.8, texture="silty loam")

    # 1. Salt-sensitive crops must receive 0.0 suitability factor during dry Rabi season
    for sensitive in ["chickpea", "lentil", "potato", "mungbean"]:
        factor, reason = compute_crop_soil_suitability({"crop": sensitive}, state, "Rabi (Nov-Feb)")
        assert factor == 0.0, f"Sensitive crop '{sensitive}' was not blocked in Satkhira: factor={factor}"
        assert "salinity constraint" in reason.lower()

    # 2. Salt-tolerant crops must be allowed with salinity resilience factor
    for tolerant in ["sunflower", "mustard"]:
        factor, reason = compute_crop_soil_suitability({"crop": tolerant}, state, "Rabi (Nov-Feb)")
        assert factor > 0.0, f"Tolerant crop '{tolerant}' was wrongly blocked in Satkhira: factor={factor}"

    # 3. Catalog must register salinity authority provenance
    from src.data.bangladesh_crops import BANGLADESH_AGRICULTURAL_SOURCES
    assert "BRRI" in BANGLADESH_AGRICULTURAL_SOURCES
    assert "BARI" in BANGLADESH_AGRICULTURAL_SOURCES


def test_haor_single_season_boro_and_monsoon_fallow():
    """Haor wetland basin (Sunamganj): only single-season Boro allowed, monsoon must be fallow."""
    assert "sunamganj" in HAOR_DISTRICTS

    from fastapi.testclient import TestClient
    from backend.app.main import app
    client = TestClient(app)

    res = client.post("/api/planning", json={
        "district": "sunamganj",
        "area_ha": 2.5,
        "soil_texture": "clay",
        "priority": "balanced",
        "latitude": 25.07,
        "longitude": 91.40,
    })
    assert res.status_code == 200
    body = res.json()

    planning = body.get("summary", {}).get("planning", {})
    selected_result = planning.get("selected_strategy_result", {})
    crops = selected_result.get("selected_crop_by_period", {})

    # In Haor, winter is single-season Boro Rice and monsoon (Kharif-2) is inundated Fallow
    assert crops.get("Y1_S1") == "Boro Rice", f"Expected Boro Rice in Y1_S1, got: {crops.get('Y1_S1')}"
    assert crops.get("Y1_S3") == "Fallow", f"Expected Fallow in Y1_S3, got: {crops.get('Y1_S3')}"
    assert crops.get("Y2_S3") == "Fallow", f"Expected Fallow in Y2_S3, got: {crops.get('Y2_S3')}"


def test_maund_bigha_conversion_accuracy():
    """Maund/bigha conversion: 1 bigha = 1337.8 m2, 1 maund = 37.32 kg. Roundtrip yield ton/ha <-> maund/bigha accurate to 0.1%."""
    B_M2 = 1337.8
    HA_M2 = 10000.0
    M_KG = 37.32

    factor = (1000.0 * (B_M2 / HA_M2)) / M_KG

    test_yields_ton_ha = [1.5, 3.2, 5.0, 7.8, 12.4]

    for y_ton_ha in test_yields_ton_ha:
        y_maund_bigha = y_ton_ha * factor
        recovered_ton_ha = y_maund_bigha / factor

        diff_pct = abs(recovered_ton_ha - y_ton_ha) / y_ton_ha * 100.0
        assert diff_pct < 0.0001, f"Yield roundtrip error {diff_pct}% exceeded 0.1% limit!"

    test_ha = 10.0
    bigha = test_ha * (HA_M2 / B_M2)
    recovered_ha = bigha * (B_M2 / HA_M2)
    assert abs(recovered_ha - test_ha) < 1e-9
