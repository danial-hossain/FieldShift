from pathlib import Path

path = Path(r"C:\FieldShift\app\server.py")
content = path.read_text(encoding="utf-8")

old_code = """    available_water_calc = None
    if irrigation_capacity is not None or "available_water_mm" in form:
        if "available_water_mm" in form and form.get("available_water_mm") not in (None, ""):
            available_water_calc = float(form.get("available_water_mm"))
        else:
            base_rain = float(state.rainfall) * 30.0 if math.isfinite(getattr(state, "rainfall", float("nan"))) else 300.0
            available_water_calc = base_rain + (float(irrigation_capacity) if irrigation_capacity is not None else 200.0)
        features["available_water_mm"] = available_water_calc
        features["available_water_source"] = "seasonal_rainfall_plus_irrigation\""""

new_code = """    available_water_calc = None
    if "available_water_mm" in form and form.get("available_water_mm") not in (None, ""):
        available_water_calc = float(form.get("available_water_mm"))
        features["available_water_mm"] = available_water_calc
        features["available_water_source"] = "user_override\""""

if old_code in content:
    path.write_text(content.replace(old_code, new_code), encoding="utf-8")
    print("Replaced successfully!")
else:
    old_crlf = old_code.replace("\n", "\r\n")
    new_crlf = new_code.replace("\n", "\r\n")
    if old_crlf in content:
        path.write_text(content.replace(old_crlf, new_crlf), encoding="utf-8")
        print("Replaced CRLF successfully!")
    else:
        print("Not found!")
