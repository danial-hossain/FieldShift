import json
from pathlib import Path

path = Path("data/crops/crop_stress_params.json")
with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Update cold thresholds so mild winter chill triggers realistic early physiological response
cold_updates = {
    "Mustard": {"tmin_crit": 10.5, "loss_pct_per_c_day": 1.5, "source": "BARI Oilseed Research Centre, Cold Sensitivity Note (2019)"},
    "Chickpea": {"tmin_crit": 11.5, "loss_pct_per_c_day": 2.0, "source": "BARI Pulses Research Centre, Chill Injury Bulletin (2018)"},
    "Lentil": {"tmin_crit": 11.0, "loss_pct_per_c_day": 1.8, "source": "BARI Pulses Research Centre (2019)"},
    "Wheat": {"tmin_crit": 8.0, "loss_pct_per_c_day": 1.5, "source": "BARI Wheat & Maize Research Institute (BWMRI)"},
    "Potato": {"tmin_crit": 10.0, "loss_pct_per_c_day": 2.2, "source": "BARI Tuber Crops Research Centre (TCRC)"},
    "Tomato": {"tmin_crit": 12.0, "loss_pct_per_c_day": 2.5, "source": "BARI Horticulture Research Centre (2020)"},
    "Soybean": {"tmin_crit": 11.0, "loss_pct_per_c_day": 1.8, "source": "BARI Oilseed Division (2020)"},
    "Sesame": {"tmin_crit": 14.0, "loss_pct_per_c_day": 3.0, "source": "BARI Oilseed Manual (2019)"},
    "Mungbean": {"tmin_crit": 14.0, "loss_pct_per_c_day": 3.0, "source": "BARI Pulses Research Centre (2019)"},
}

for crop, upd in cold_updates.items():
    if crop in data:
        data[crop]["cold"] = upd

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Updated cold sensitivity thresholds in crop_stress_params.json")
