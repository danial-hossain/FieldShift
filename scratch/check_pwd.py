import sys
sys.path.insert(0, r'C:\FieldShift')
from backend.app.main import get_db, User, LoginSession, select, verify_password, password_hash

with next(get_db()) as db:
    u = db.scalar(select(User).where(User.id == 47))
    print(f"User 47: {u.name} | {u.email} | hash: {u.password_hash}")
    sessions = db.scalars(select(LoginSession).where(LoginSession.user_id == 47)).all()
    print(f"Active sessions for User 47: {len(sessions)}")
    for s in sessions:
        print(f"  Session ID: {s.id}, Token: {s.token}, Expires: {s.expires_at}")
    
    common = ['dani', 'dani123', 'dani2022', 'danial', 'danial2022', 'password', 'password123', 'admin', '12345678', '123456789', 'dani@123', 'Dani1234']
    for p in common:
        if verify_password(p, u.password_hash):
            print(f"MATCH FOUND: {p}")
            break
    else:
        print("No common match found in quick list")
