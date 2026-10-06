import sys
from datetime import datetime, timezone

sys.path.insert(0, 'backend')
from app.database import SessionLocal
from app.models import User, Farm, Field, FieldHistory
from sqlalchemy import text

def now():
    return datetime.now(timezone.utc)

def main():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == 47).first()
        if not user:
            print("Error: User 47 not found!")
            return
        
        farm = db.query(Farm).filter(Farm.id == 27, Farm.user_id == 47).first()
        if not farm:
            print("Error: Farm 27 not found for user 47!")
            return
        
        field58 = db.query(Field).filter(Field.id == 58).first()
        if field58:
            print(f"Field 58 already exists: {field58.name}, updating to ensure correct attributes...")
            field58.farm_id = farm.id
            field58.name = "Mirpur, Dhaka"
            field58.latitude = 23.8029
            field58.longitude = 90.3685
            field58.area_ha = 10.0
            field58.soil_texture = "loam"
            field58.organic_matter = 2.5
            field58.irrigation_capacity_mm = 90.0
            field58.updated_at = now()
        else:
            print("Creating Field 58...")
            stamp = now()
            field58 = Field(
                id=58,
                farm_id=farm.id,
                name="Mirpur, Dhaka",
                latitude=23.8029,
                longitude=90.3685,
                area_ha=10.0,
                soil_texture="loam",
                organic_matter=2.5,
                irrigation_capacity_mm=90.0,
                created_at=stamp,
                updated_at=stamp
            )
            db.add(field58)
        
        db.commit()

        # Update sequence so next inserts don't collide
        db.execute(text("SELECT setval('fields_id_seq', (SELECT GREATEST(MAX(id), 58) FROM fields));"))
        db.commit()

        # Check field history
        hist = db.query(FieldHistory).filter(FieldHistory.field_id == 58).first()
        if not hist:
            print("Adding FieldHistory for Field 58...")
            hist = FieldHistory(
                field_id=58,
                crop="Maize",
                season="dry",
                year=2024,
                notes="Previous crop 2024",
                created_at=now()
            )
            db.add(hist)
            db.commit()
            db.execute(text("SELECT setval('field_history_id_seq', (SELECT MAX(id) FROM field_history));"))
            db.commit()
        else:
            print(f"FieldHistory for 58 exists: crop={hist.crop}, year={hist.year}")
            hist.crop = "Maize"
            hist.season = "dry"
            hist.year = 2024
            db.commit()

        print("Successfully verified Field 58 in PostgreSQL under Farm 27 (User 47 Dani)!")
    finally:
        db.close()

if __name__ == "__main__":
    main()
