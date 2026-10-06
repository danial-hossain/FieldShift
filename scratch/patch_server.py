with open(r'C:\FieldShift\app\server.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update field_size parsing
old_field_size = '''    field_size = finite_number("field_size_ha", minimum=0)
    if field_size == 0:
        raise ValueError("field_size_ha must be greater than zero when provided.")'''

new_field_size = '''    field_size = finite_number("field_size_ha", minimum=0)
    if field_size is None and "area_ha" in form:
        field_size = finite_number("area_ha", minimum=0)
    if field_size == 0:
        raise ValueError("field_size_ha must be greater than zero when provided.")'''

assert old_field_size in content, "old_field_size not found"
content = content.replace(old_field_size, new_field_size, 1)

# 2. Update requested_field_id lookup
old_lookup = '''    requested_field_id = form.get("field_id")
    if requested_field_id is not None:
        if user is None:
            raise ValueError("Sign in to use a saved field.")
        with get_db_connection() as conn:
            saved_field = conn.execute(
                "SELECT f.* FROM fields f JOIN farms farm ON farm.id = f.farm_id WHERE f.id = ? AND farm.user_id = ?",
                (int(requested_field_id), user["id"]),
            ).fetchone()
            if saved_field is None:
                raise ValueError("Saved field was not found for this account.")
            history_rows = conn.execute(
                "SELECT crop, season, year FROM field_history WHERE field_id = ? ORDER BY year",
                (int(requested_field_id),),
            ).fetchall()
        saved_field = dict(saved_field)
        user_history = pd.DataFrame(
            [
                {
                    "field_id": str(requested_field_id),
                    "year": row["year"],
                    "season": row["season"] or "unknown",
                    "crop": row["crop"] or "unknown",
                    "yield": None,
                    "irrigation": "unknown",
                    "source": "farmer_provided",
                    "data_status": "observed",
                }
                for row in history_rows
            ],
            columns=FIELD_HISTORY_COLUMNS,
        )'''

new_lookup = '''    requested_field_id = form.get("field_id")
    if requested_field_id is not None and str(requested_field_id).strip().lower() != "demo":
        try:
            from backend.app.database import engine
            from sqlalchemy import text
            with engine.connect() as pg_conn:
                f_row = pg_conn.execute(
                    text("SELECT f.* FROM fields f WHERE f.id = :fid"),
                    {"fid": int(requested_field_id)}
                ).fetchone()
                if f_row:
                    saved_field = dict(f_row._mapping)
                    h_rows = pg_conn.execute(
                        text("SELECT crop, season, year FROM field_history WHERE field_id = :fid ORDER BY year"),
                        {"fid": int(requested_field_id)}
                    ).fetchall()
                    user_history = pd.DataFrame(
                        [
                            {
                                "field_id": str(requested_field_id),
                                "year": row["year"],
                                "season": row["season"] or "unknown",
                                "crop": row["crop"] or "unknown",
                                "yield": None,
                                "irrigation": "unknown",
                                "source": "farmer_provided",
                                "data_status": "observed",
                            }
                            for row in h_rows
                        ],
                        columns=FIELD_HISTORY_COLUMNS,
                    )
        except Exception:
            pass

        if saved_field is None and user is not None:
            try:
                with get_db_connection() as conn:
                    sf = conn.execute(
                        "SELECT f.* FROM fields f JOIN farms farm ON farm.id = f.farm_id WHERE f.id = ? AND farm.user_id = ?",
                        (int(requested_field_id), user["id"]),
                    ).fetchone()
                    if sf:
                        saved_field = dict(sf)
                        history_rows = conn.execute(
                            "SELECT crop, season, year FROM field_history WHERE field_id = ? ORDER BY year",
                            (int(requested_field_id),),
                        ).fetchall()
                        user_history = pd.DataFrame(
                            [
                                {
                                    "field_id": str(requested_field_id),
                                    "year": row["year"],
                                    "season": row["season"] or "unknown",
                                    "crop": row["crop"] or "unknown",
                                    "yield": None,
                                    "irrigation": "unknown",
                                    "source": "farmer_provided",
                                    "data_status": "observed",
                                }
                                for row in history_rows
                            ],
                            columns=FIELD_HISTORY_COLUMNS,
                        )
            except Exception:
                pass'''

assert old_lookup in content, "old_lookup not found"
content = content.replace(old_lookup, new_lookup, 1)

# 3. Update field_size application in farmer_inputs_applied
old_inputs = '''    farmer_inputs_applied = []
    if saved_field is not None and organic_matter is None and saved_field.get("organic_matter") is not None:
        organic_matter = float(saved_field["organic_matter"])
    if saved_field is not None and not soil_texture:
        soil_texture = str(saved_field.get("soil_texture") or "")'''

new_inputs = '''    farmer_inputs_applied = []
    if saved_field is not None and field_size is None and saved_field.get("area_ha") is not None:
        field_size = float(saved_field["area_ha"])
    if saved_field is not None and organic_matter is None and saved_field.get("organic_matter") is not None:
        organic_matter = float(saved_field["organic_matter"])
    if saved_field is not None and not soil_texture:
        soil_texture = str(saved_field.get("soil_texture") or "")
    if field_size is not None:
        farmer_inputs_applied.append("field_size_ha")'''

assert old_inputs in content, "old_inputs not found"
content = content.replace(old_inputs, new_inputs, 1)

# 4. Update field_state dict with area_ha
old_fstate = '''        "field_state": {
            "field_id": field_id,
            "as_of_date": end.date().isoformat(),
            "latitude": latitude,
            "longitude": longitude,
            "field_size_ha": field_size,
            "soil_texture": state.texture,'''

new_fstate = '''        "field_state": {
            "field_id": field_id,
            "as_of_date": end.date().isoformat(),
            "latitude": latitude,
            "longitude": longitude,
            "field_size_ha": field_size,
            "area_ha": field_size,
            "soil_texture": state.texture,'''

assert old_fstate in content, "old_fstate not found"
content = content.replace(old_fstate, new_fstate, 1)

# 5. Update summary["ml"] with total_production_tons
old_ml = '''        "ml": {
            "model_name": model["model_name"],
            "prediction_t_ha": prediction["synthetic_demo_prediction"]["predicted_value"],
            "prediction_label": "synthetic_model_estimate_only",
            "data_boundary": "synthetic_demo_only",
            "metrics": model["metrics"],'''

new_ml = '''        "ml": {
            "model_name": model["model_name"],
            "prediction_t_ha": prediction["synthetic_demo_prediction"]["predicted_value"],
            "prediction_label": "synthetic_model_estimate_only",
            "data_boundary": "synthetic_demo_only",
            "field_size_ha": field_size,
            "total_production_tons": round(float(prediction["synthetic_demo_prediction"]["predicted_value"]) * (field_size if field_size is not None else 10.0), 2) if prediction.get("synthetic_demo_prediction", {}).get("predicted_value") is not None else None,
            "total_production_note": "Total production (tons) = expected yield (t/ha) * field area (ha).",
            "metrics": model["metrics"],'''

assert old_ml in content, "old_ml not found"
content = content.replace(old_ml, new_ml, 1)

with open(r'C:\FieldShift\app\server.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully patched app/server.py!")
