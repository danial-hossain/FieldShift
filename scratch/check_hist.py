import sys
sys.path.insert(0, r'C:\FieldShift')
from backend.app.main import get_db, FieldHistory, FarmField, select, row

with next(get_db()) as db:
    hist = db.scalars(select(FieldHistory)).all()
    print('Total FieldHistory rows in PostgreSQL:', len(hist))
    for h in hist[:10]:
        print('History row:', row(h))
    
    # check history specifically for fields 22, 23
    for fid in [22, 23]:
        f_hist = db.scalars(select(FieldHistory).where(FieldHistory.field_id == fid).order_by(FieldHistory.year.desc())).all()
        print(f"History for field {fid} ({len(f_hist)}):", [row(x) for x in f_hist])
