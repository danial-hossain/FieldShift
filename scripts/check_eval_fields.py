import sys, os
sys.path.insert(0, os.path.abspath('.'))
from backend.app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    users = conn.execute(text("SELECT id, email, name FROM users WHERE email LIKE '%evaluator%' OR email LIKE '%demo%'")).fetchall()
    print("Evaluator / Demo users:")
    for u in users:
        print(" ", u)
    fields = conn.execute(text("SELECT id, farm_id, name, district, latitude, longitude, area_ha, soil_texture, irrigation_capacity_mm FROM fields")).fetchall()
    print(f"\nAll fields in DB ({len(fields)}):")
    for f in fields:
        print(" ", f)
