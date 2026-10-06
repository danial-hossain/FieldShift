import sys
sys.path.insert(0, r'C:\FieldShift')
from backend.app.main import get_db, User, Farm, FarmField, Analysis, select, row

with next(get_db()) as db:
    u = db.scalar(select(User).where(User.id == 47))
    print(f"User: {u.id} - {u.name} - {u.email} - created: {u.created_at}")
    farms = db.scalars(select(Farm).where(Farm.user_id == 47)).all()
    print("Farms count:", len(farms))
    for f in farms:
        print("Farm:", row(f))
        fields = db.scalars(select(FarmField).where(FarmField.farm_id == f.id)).all()
        print(f"Fields ({len(fields)}):")
        for fld in fields:
            print("  Field:", row(fld))
    analyses = db.scalars(select(Analysis).where(Analysis.user_id == 47)).all()
    print("Analyses count:", len(analyses))
    for a in analyses:
        summary_preview = list((a.summary_json or {}).keys())
        has_result = "result" in (a.summary_json or {})
        result_keys = list(a.summary_json.get("result", {}).keys()) if has_result else []
        print(f"  Analysis #{a.id}: status={a.status}, priority={a.priority}, mode={a.mode}, date={a.created_at}, has_result={has_result}, res_keys={result_keys[:4]}")
