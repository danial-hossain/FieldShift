# React + FastAPI + PostgreSQL development runbook

The legacy `app/` server and SQLite database are retained unchanged. The new
application is additive in `frontend/` and `backend/`; it calls the existing
`src/` pipeline rather than copying ML, NASA, MILP, RL, evidence, or safety code.

Start PostgreSQL from the repository root:

```powershell
docker compose -f docker-compose.postgres.yml up -d
```

Create a backend virtual environment and install its web/database dependencies:

```powershell
python -m venv backend\.venv
.\backend\.venv\Scripts\python.exe -m pip install -r requirements.txt -r backend\requirements.txt
$env:FIELDSHIFT_DATABASE_URL = "postgresql+psycopg://fieldshift:fieldshift@localhost:5433/fieldshift"
.\backend\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8000
```

In a second PowerShell window:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The FastAPI OpenAPI UI is at
`http://127.0.0.1:8000/docs`.

For production, apply `backend/alembic/versions/0001_initial.sql` through the
deployment migration process before starting FastAPI. `Base.metadata.create_all`
is included only to make an empty local development database runnable.

The React surface currently exposes the scientific workflow. The legacy browser
UI remains the reference UI while its complete farm/account/history screens are
ported route-by-route. Do not delete `app/`, `data/fieldshift.db`, or `src/`
until endpoint/output regression tests and a verified data migration exist.
