from __future__ import annotations

import hashlib, importlib.util, secrets, sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from fastapi import Cookie, Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session as DbSession
from .database import Base, engine, get_db
from .models import Analysis, Farm, Field as FarmField, FieldHistory, Session as LoginSession, User

app = FastAPI(title="FieldShift API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class Payload(BaseModel):
    model_config = ConfigDict(extra="allow")

class Credentials(BaseModel):
    name: str | None = None
    email: str
    password: str

def now() -> datetime: return datetime.now(timezone.utc)
def public_user(u: User) -> dict[str, Any]: return {"id":u.id,"name":u.name,"email":u.email,"is_active":u.is_active,"created_at":u.created_at,"updated_at":u.updated_at}
def password_hash(password: str) -> str:
    salt=secrets.token_bytes(16); digest=hashlib.pbkdf2_hmac("sha256",password.encode(),salt,310000)
    return f"pbkdf2_sha256$310000${salt.hex()}${digest.hex()}"
def verify_password(password: str, stored: str) -> bool:
    try:
        if stored.startswith("pbkdf2_sha256$"):
            _, rounds, salt, digest=stored.split("$",3)
            candidate=hashlib.pbkdf2_hmac("sha256",password.encode(),bytes.fromhex(salt),int(rounds)).hex()
            return secrets.compare_digest(candidate,digest)
    except (TypeError, ValueError): return False
    return secrets.compare_digest(hashlib.sha256(password.encode()).hexdigest(),stored)
def require_user(fieldshift_session: str | None = Cookie(None), db: DbSession = Depends(get_db)) -> User:
    item = db.scalar(select(LoginSession).where(LoginSession.token == fieldshift_session, LoginSession.expires_at > now())) if fieldshift_session else None
    user = db.get(User, item.user_id) if item else None
    if user is None or not user.is_active:
        raise HTTPException(401, "Sign in is required.")
    return user
def owned_farm(db: DbSession, farm_id: int, user: User) -> Farm:
    farm=db.get(Farm,farm_id)
    if not farm or farm.user_id != user.id: raise HTTPException(404,"Farm not found or not owned by this user.")
    return farm
def owned_field(db: DbSession, field_id: int, user: User) -> FarmField:
    field=db.get(FarmField,field_id)
    if not field: raise HTTPException(404,"Field not found or not owned by this user.")
    owned_farm(db,field.farm_id,user); return field
def row(value: Any) -> dict[str, Any]:
    return {c.name:getattr(value,c.name) for c in value.__table__.columns}

def workflow_result(data: dict[str, Any], user: dict[str, Any] | None = None) -> dict[str, Any]:
    """Transport adapter: invoke the retained workflow without reimplementing it."""
    _demo_summary = legacy_workflow_module()._demo_summary
    try:
        return _demo_summary(data, user=user)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    except (FileNotFoundError, RuntimeError) as e:
        raise HTTPException(502, str(e)) from e

def legacy_workflow_module():
    """Load the pre-migration workflow without confusing it with backend.app."""
    module_name = "fieldshift_legacy_server"
    module = sys.modules.get(module_name)
    if module is not None:
        return module
    server_path = Path(__file__).resolve().parents[2] / "app" / "server.py"
    spec = importlib.util.spec_from_file_location(module_name, server_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load retained FieldShift workflow from {server_path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module

def use_field_record(data: dict[str, Any], field: FarmField, db: DbSession) -> dict[str, Any]:
    """Build workflow field inputs from the selected PostgreSQL row."""
    data = dict(data)
    data.update({
        "field_id": field.id,
        "field_size_ha": field.area_ha,
        "area_ha": field.area_ha,
        "latitude": field.latitude,
        "longitude": field.longitude,
        "soil_texture": field.soil_texture or "unknown",
        "organic_matter": field.organic_matter,
        "irrigation_capacity_mm": field.irrigation_capacity_mm,
    })
    histories = list(db.scalars(
        select(FieldHistory)
        .where(FieldHistory.field_id == field.id)
        .order_by(FieldHistory.year.desc(), FieldHistory.id.desc())
    ))
    include_history = data.get("include_history", True)
    if isinstance(include_history, str):
        include_history = include_history.strip().lower() in {"true", "1", "yes", "on"}
    if include_history and histories:
        data["previous_crop"] = histories[0].crop or ""
        data["previous_crop_year"] = histories[0].year or ""
        data["season"] = histories[0].season or data.get("season", "dry")
    else:
        data["previous_crop"] = ""
        data["previous_crop_year"] = ""
    return data

@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(engine)  # deployment should use Alembic migration below

@app.get("/api/health")
def health():
    return {"status":"ok","project":"FieldShift","mode":"offline_demo","synthetic_boundary":True,"uses_repository_modules":True,"dashboard":"available","notes":["Live NASA POWER retrieval is available only when explicitly selected.","Offline mode uses bundled data and the existing FieldShift pipeline."]}

@app.post("/api/workflow")
def workflow(payload: Payload, fieldshift_session: str | None = Cookie(None), db: DbSession = Depends(get_db)):
    data = payload.model_dump()
    user = None
    if fieldshift_session:
        try:
            user = require_user(fieldshift_session, db)
        except HTTPException:
            user = None

    requested_field_id = data.get("field_id")
    if requested_field_id not in (None, "", "demo"):
        if user is None:
            raise HTTPException(401, "Sign in to analyze a registered field.")
        try:
            fid = int(requested_field_id)
        except (ValueError, TypeError) as error:
            raise HTTPException(400, "field_id must identify a registered PostgreSQL field.") from error
        field_record = owned_field(db, fid, user)
        data = use_field_record(data, field_record, db)
    elif "area_ha" in data and ("field_size_ha" not in data or data["field_size_ha"] in (None, "")):
        data["field_size_ha"] = data["area_ha"]

    user_dict = public_user(user) if user else None
    return workflow_result(data, user=user_dict)

@app.post("/api/location/weather")
def location_weather(payload: Payload):
    _location_weather = legacy_workflow_module()._location_weather
    try: return _location_weather(payload.model_dump())
    except ValueError as e: raise HTTPException(400,str(e))
    except RuntimeError as e: raise HTTPException(502,str(e))

@app.get("/api/crops")
def crops():
    from src.data.crops import load_crop_knowledge
    return {"status":"ok","crops":load_crop_knowledge().to_dict(orient="records")}

@app.get("/api/scenarios/benchmarks")
def benchmark_scenarios():
    from src.scenarios.benchmark_scenarios import get_benchmark_scenario_list
    return {"status": "ok", "scenarios": get_benchmark_scenario_list()}

@app.post("/api/scenarios/benchmark/run")
def run_benchmark(payload: Payload):
    from src.scenarios.benchmark_scenarios import run_benchmark_scenario, run_all_benchmark_scenarios
    data = payload.model_dump()
    scenario_id = data.get("scenario_id")
    if not scenario_id or str(scenario_id).lower() == "all":
        return {"status": "ok", "results": run_all_benchmark_scenarios()}
    return {"status": "ok", "result": run_benchmark_scenario(str(scenario_id).upper())}

@app.get("/api/auth/me")
def me(response: Response, fieldshift_session: str | None = Cookie(None), db: DbSession = Depends(get_db)):
    try:
        user = require_user(fieldshift_session, db)
        if not fieldshift_session:
            token = secrets.token_urlsafe(32)
            stamp = now()
            db.add(LoginSession(user_id=user.id, token=token, created_at=stamp, expires_at=stamp + timedelta(days=7)))
            db.commit()
            response.set_cookie("fieldshift_session", token, httponly=True, samesite="lax", max_age=604800)
        return {"status": "ok", "user": public_user(user)}
    except HTTPException:
        return {"status": "unauthenticated"}

@app.post("/api/auth/register", status_code=201)
def register(credentials: Credentials, response: Response, db: DbSession = Depends(get_db)):
    if not credentials.name or "@" not in credentials.email or len(credentials.password)<8: raise HTTPException(400,"name, valid email, and password of at least 8 characters are required.")
    stamp=now(); user=User(name=credentials.name.strip(),email=credentials.email.strip().lower(),password_hash=password_hash(credentials.password),is_active=True,created_at=stamp,updated_at=stamp)
    db.add(user)
    try: db.commit()
    except IntegrityError: db.rollback(); raise HTTPException(400,f"email already registered: {user.email}")
    db.refresh(user); token=secrets.token_urlsafe(32); db.add(LoginSession(user_id=user.id,token=token,created_at=stamp,expires_at=stamp+timedelta(days=7))); db.commit()
    response.set_cookie("fieldshift_session",token,httponly=True,samesite="lax",max_age=604800)
    return {"status":"created","user":public_user(user)}

@app.post("/api/auth/login")
def login(credentials: Credentials, response: Response, db: DbSession = Depends(get_db)):
    user=db.scalar(select(User).where(User.email==credentials.email.strip().lower()))
    if not user or not user.is_active or not verify_password(credentials.password,user.password_hash): raise HTTPException(401,"Email or password is incorrect.")
    stamp=now(); user.last_login=stamp; user.updated_at=stamp; token=secrets.token_urlsafe(32); db.add(LoginSession(user_id=user.id,token=token,created_at=stamp,expires_at=stamp+timedelta(days=7))); db.commit()
    response.set_cookie("fieldshift_session",token,httponly=True,samesite="lax",max_age=604800)
    return {"status":"ok","user":{"id":user.id,"name":user.name,"email":user.email}}

@app.post("/api/auth/logout")
def logout(response: Response, fieldshift_session: str | None = Cookie(None), db: DbSession = Depends(get_db)):
    item=db.scalar(select(LoginSession).where(LoginSession.token==fieldshift_session)) if fieldshift_session else None
    if item: db.delete(item); db.commit()
    response.delete_cookie("fieldshift_session"); return {"status":"ok"}

@app.put("/api/auth/profile")
def update_profile(payload: Payload, user: User = Depends(require_user), db: DbSession = Depends(get_db)):
    data = payload.model_dump()
    name = str(data.get("name", "")).strip()
    if name:
        user.name = name
    stamp = now()
    user.updated_at = stamp
    db.commit()
    db.refresh(user)
    return {"status": "ok", "user": public_user(user)}

@app.get("/api/farms")
def farms(user: User=Depends(require_user), db: DbSession=Depends(get_db)): return {"status":"ok","farms":[row(x) for x in db.scalars(select(Farm).where(Farm.user_id==user.id).order_by(Farm.id.desc()))]}
@app.post("/api/farms",status_code=201)
def create_farm(payload: Payload,user: User=Depends(require_user),db: DbSession=Depends(get_db)):
    name=str(payload.model_dump().get("name","")).strip()
    if not name: raise HTTPException(400,"name is required.")
    stamp=now(); farm=Farm(user_id=user.id,name=name,description=payload.model_dump().get("description") or None,created_at=stamp,updated_at=stamp);db.add(farm);db.commit();db.refresh(farm);return {"status":"created","farm":row(farm)}

@app.put("/api/farms/{farm_id}")
def update_farm(farm_id: int, payload: Payload, user: User = Depends(require_user), db: DbSession = Depends(get_db)):
    farm = owned_farm(db, farm_id, user)
    data = payload.model_dump()
    name = str(data.get("name", "")).strip()
    if name:
        farm.name = name
    if "description" in data:
        farm.description = str(data["description"]) if data["description"] else None
    stamp = now()
    farm.updated_at = stamp
    db.commit()
    db.refresh(farm)
    return {"status": "updated", "farm": row(farm)}
@app.get("/api/fields")
def fields(farm_id: int | None = None, user: User = Depends(require_user), db: DbSession = Depends(get_db)):
    if farm_id is not None:
        owned_farm(db, farm_id, user)
        items = list(db.scalars(select(FarmField).where(FarmField.farm_id == farm_id).order_by(FarmField.id.desc())))
    else:
        user_farm_ids = [f.id for f in db.scalars(select(Farm).where(Farm.user_id == user.id))]
        items = list(db.scalars(select(FarmField).where(FarmField.farm_id.in_(user_farm_ids)).order_by(FarmField.id.desc()))) if user_farm_ids else []
    
    result = []
    for fld in items:
        f_dict = row(fld)
        hist = [row(h) for h in db.scalars(select(FieldHistory).where(FieldHistory.field_id == fld.id).order_by(FieldHistory.year.desc(), FieldHistory.id.desc()))]
        f_dict["history"] = hist
        if hist:
            f_dict["previous_crop"] = hist[0].get("crop")
            f_dict["previous_crop_year"] = hist[0].get("year")
            f_dict["current_crop"] = hist[0].get("crop")
        last_anal = db.scalar(select(Analysis.created_at).where(Analysis.field_id == fld.id).order_by(Analysis.id.desc()))
        f_dict["last_analysis_date"] = last_anal.isoformat() if last_anal else None
        result.append(f_dict)
    return {"status": "ok", "fields": result}

@app.post("/api/fields", status_code=201)
def create_field(payload: Payload, user: User = Depends(require_user), db: DbSession = Depends(get_db)):
    data = payload.model_dump()
    farm_id = data.get("farm_id")
    if farm_id is None:
        first_farm = db.scalar(select(Farm).where(Farm.user_id == user.id).order_by(Farm.id.asc()))
        if not first_farm:
            stamp = now()
            first_farm = Farm(user_id=user.id, name="My Farm", description="Default user farm", created_at=stamp, updated_at=stamp)
            db.add(first_farm)
            db.commit()
            db.refresh(first_farm)
        farm_id = first_farm.id
    name = str(data.get("name", "")).strip()
    if not name: raise HTTPException(400, "name is required.")
    owned_farm(db, int(farm_id), user)
    lat = float(data["latitude"]) if data.get("latitude") not in (None, "") else None
    lon = float(data["longitude"]) if data.get("longitude") not in (None, "") else None
    if lat is not None and not (-90.0 <= lat <= 90.0):
        raise HTTPException(400, "Latitude must be between -90 and 90 degrees.")
    if lon is not None and not (-180.0 <= lon <= 180.0):
        raise HTTPException(400, "Longitude must be between -180 and 180 degrees.")
    stamp = now()
    field = FarmField(
        farm_id=int(farm_id),
        name=name,
        latitude=lat,
        longitude=lon,
        area_ha=float(data["area_ha"]) if data.get("area_ha") not in (None, "") else None,
        soil_texture=str(data["soil_texture"]) if data.get("soil_texture") else None,
        organic_matter=float(data["organic_matter"]) if data.get("organic_matter") not in (None, "") else None,
        irrigation_capacity_mm=float(data["irrigation_capacity_mm"]) if data.get("irrigation_capacity_mm") not in (None, "") else None,
        created_at=stamp,
        updated_at=stamp
    )
    db.add(field)
    db.commit()
    db.refresh(field)
    crop = data.get("crop") or data.get("previous_crop") or data.get("current_crop")
    hist_list = []
    if crop:
        try: hist_year = int(data.get("previous_crop_year") or data.get("year") or 2025)
        except (ValueError, TypeError): hist_year = 2025
        hist = FieldHistory(field_id=field.id, crop=str(crop).strip(), season=data.get("season", "dry"), year=hist_year, notes=data.get("notes"), created_at=stamp)
        db.add(hist)
        db.commit()
        db.refresh(hist)
        hist_list = [row(hist)]
    f_dict = row(field)
    f_dict["history"] = hist_list
    if hist_list:
        f_dict["previous_crop"] = hist_list[0].get("crop")
        f_dict["previous_crop_year"] = hist_list[0].get("year")
        f_dict["current_crop"] = hist_list[0].get("crop")
    else:
        f_dict["previous_crop"] = None
        f_dict["previous_crop_year"] = None
        f_dict["current_crop"] = None
    f_dict["last_analysis_date"] = None
    return {"status": "created", "field": f_dict}

@app.put("/api/fields/{field_id}")
def update_field(field_id: int, payload: Payload, user: User = Depends(require_user), db: DbSession = Depends(get_db)):
    field = owned_field(db, field_id, user)
    data = payload.model_dump()
    if "name" in data and str(data["name"]).strip():
        field.name = str(data["name"]).strip()
    if "latitude" in data:
        if data["latitude"] not in (None, ""):
            lat = float(data["latitude"])
            if not (-90.0 <= lat <= 90.0):
                raise HTTPException(400, "Latitude must be between -90 and 90 degrees.")
            field.latitude = lat
        else:
            field.latitude = None
    if "longitude" in data:
        if data["longitude"] not in (None, ""):
            lon = float(data["longitude"])
            if not (-180.0 <= lon <= 180.0):
                raise HTTPException(400, "Longitude must be between -180 and 180 degrees.")
            field.longitude = lon
        else:
            field.longitude = None
    if "area_ha" in data:
        field.area_ha = float(data["area_ha"]) if data["area_ha"] not in (None, "") else None
    if "soil_texture" in data:
        field.soil_texture = str(data["soil_texture"]) if data["soil_texture"] else None
    if "organic_matter" in data:
        field.organic_matter = float(data["organic_matter"]) if data["organic_matter"] not in (None, "") else None
    if "irrigation_capacity_mm" in data:
        field.irrigation_capacity_mm = float(data["irrigation_capacity_mm"]) if data["irrigation_capacity_mm"] not in (None, "") else None
    stamp = now()
    field.updated_at = stamp
    crop = data.get("crop") or data.get("previous_crop") or data.get("current_crop")
    if crop:
        try: hist_year = int(data.get("previous_crop_year") or data.get("year") or 2025)
        except (ValueError, TypeError): hist_year = 2025
        existing_hist = db.scalar(select(FieldHistory).where(FieldHistory.field_id == field.id).order_by(FieldHistory.id.desc()))
        if existing_hist:
            existing_hist.crop = str(crop).strip()
            existing_hist.year = hist_year
            if data.get("season"): existing_hist.season = str(data["season"])
        else:
            db.add(FieldHistory(field_id=field.id, crop=str(crop).strip(), season=data.get("season", "dry"), year=hist_year, notes=data.get("notes"), created_at=stamp))
    db.commit()
    db.refresh(field)
    return {"status": "updated", "field": row(field)}

@app.delete("/api/fields/{field_id}")
def delete_field(field_id: int, user: User = Depends(require_user), db: DbSession = Depends(get_db)):
    field = owned_field(db, field_id, user)
    db.delete(field)
    db.commit()
    return {"status": "deleted", "id": field_id}

@app.get("/api/fields/{field_id}/history")
def field_history(field_id:int,user:User=Depends(require_user),db:DbSession=Depends(get_db)):
    owned_field(db,field_id,user)
    return {"status":"ok","history":[row(x) for x in db.scalars(select(FieldHistory).where(FieldHistory.field_id==field_id).order_by(FieldHistory.year,FieldHistory.id))]}

@app.post("/api/fields/{field_id}/history",status_code=201)
def create_field_history(field_id:int,payload:Payload,user:User=Depends(require_user),db:DbSession=Depends(get_db)):
    owned_field(db,field_id,user); data=payload.model_dump(); stamp=now()
    item=FieldHistory(field_id=field_id,crop=data.get("crop"),season=data.get("season"),year=data.get("year"),notes=data.get("notes"),created_at=stamp)
    db.add(item); db.commit(); db.refresh(item); return {"status":"created","history":row(item)}

@app.post("/api/analyses",status_code=201)
def create_analysis(payload:Payload,user:User=Depends(require_user),db:DbSession=Depends(get_db)):
    data=payload.model_dump(); field_id=data.get("field_id"); farm_id=data.get("farm_id")
    if field_id is not None:
        field=owned_field(db,int(field_id),user)
        if farm_id is None: farm_id=field.farm_id
    if farm_id is not None: owned_farm(db,int(farm_id),user)
    stamp=now(); item=Analysis(user_id=user.id,farm_id=farm_id,field_id=field_id,start_date=data.get("start_date"),end_date=data.get("end_date"),priority=data.get("priority"),season=data.get("season"),include_crop_history=bool(data.get("include_history",False)),mode=data.get("mode","offline"),status="pending",summary_json={"workflow_payload":data},created_at=stamp,updated_at=stamp)
    db.add(item); db.commit(); db.refresh(item); return {"status":"created","analysis":row(item)}

@app.post("/api/analyses/{analysis_id}/run")
def run_analysis(analysis_id:int,user:User=Depends(require_user),db:DbSession=Depends(get_db)):
    item=db.get(Analysis,analysis_id)
    if not item or item.user_id!=user.id: raise HTTPException(404,"Analysis not found or not owned by this user.")
    data=dict((item.summary_json or {}).get("workflow_payload") or {})
    if item.field_id is not None:
        field = owned_field(db, item.field_id, user)
        data = use_field_record(data, field, db)
    item.status="running"; item.started_at=now(); item.updated_at=now(); db.commit()
    try:
        result=workflow_result(data, {"id": user.id})
    except HTTPException as error:
        item.status="failed"; item.error_message=str(error.detail); item.completed_at=now(); item.updated_at=now(); db.commit(); raise
    item.status="completed"; item.summary_json={"workflow_payload":data,"result":result}; item.completed_at=now(); item.updated_at=now(); db.commit(); db.refresh(item)
    return {"status":"ok","analysis":row(item),"summary":result}

@app.get("/api/analyses")
def analyses(user:User=Depends(require_user),db:DbSession=Depends(get_db)):
    return {"status":"ok","analyses":[row(x) for x in db.scalars(select(Analysis).where(Analysis.user_id==user.id).order_by(Analysis.id.desc()))]}
