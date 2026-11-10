import json
from pathlib import Path
import pytest
from src.data.crops import load_crop_knowledge

def test_crop_stress_params_coverage():
    path = Path("data/crops/crop_stress_params.json")
    assert path.exists(), "crop_stress_params.json must exist"
    
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    df = load_crop_knowledge()
    expected_crops = df["crop"].tolist()
    
    for crop in expected_crops:
        assert crop in data, f"Crop {crop} missing from crop_stress_params.json"
        entry = data[crop]
        assert "ky_total" in entry
        assert "ky_stage" in entry
        assert "sensitive_stage" in entry
        assert "heat" in entry
        assert "cold" in entry
        assert "flood" in entry
        assert "salinity" in entry
        
        # Verify that if a value is present, a source is cited
        for cat in ["ky_total", "ky_stage", "sensitive_stage", "heat", "cold", "flood", "salinity"]:
            sec = entry[cat]
            has_val = any(v is not None for k, v in sec.items() if k != "source")
            if has_val:
                assert sec.get("source") is not None and len(sec["source"].strip()) > 0, \
                    f"Crop {crop} category {cat} has value but missing cited source"

def test_fao_citations_and_scientific_values():
    with open("data/crops/crop_stress_params.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        
    # Wheat FAO-33 Ky=1.0, FAO-29 a=6.0, b=7.1
    wheat = data["Wheat"]
    assert wheat["ky_total"]["value"] == 1.0
    assert "FAO" in wheat["ky_total"]["source"]
    assert wheat["salinity"]["threshold_a"] == 6.0
    assert wheat["salinity"]["slope_b"] == 7.1
    assert "FAO" in wheat["salinity"]["source"]
    
    # Rice FAO-33 Ky=1.2, FAO-29 a=3.0, b=12.0
    rice = data["Rice"]
    assert rice["ky_total"]["value"] == 1.2
    assert rice["salinity"]["threshold_a"] == 3.0
    assert rice["salinity"]["slope_b"] == 12.0
    
    # Mustard FAO-29 a=4.5, b=8.5
    mustard = data["Mustard"]
    assert mustard["salinity"]["threshold_a"] == 4.5
    assert mustard["salinity"]["slope_b"] == 8.5
