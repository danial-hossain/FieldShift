from __future__ import annotations

import hashlib, importlib.util, json, logging, math, os, secrets, sys
logger = logging.getLogger("fieldshift")
from pathlib import Path
ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from datetime import datetime, timedelta, timezone
from typing import Any
from fastapi import Body, Cookie, Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session as DbSession
from .database import Base, engine, get_db, is_postgres
from .models import Analysis, Farm, FarmOutcome, Field as FarmField, FieldHistory, Session as LoginSession, User

cors_origins_env = os.getenv("CORS_ORIGINS", "")
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:3000",
]
if cors_origins_env:
    for origin in cors_origins_env.split(","):
        trimmed = origin.strip()
        if trimmed and trimmed not in allowed_origins:
            allowed_origins.append(trimmed)

cors_origin_regex = os.getenv("CORS_ORIGIN_REGEX", r"^https:\/\/.*\.onrender\.com$")
is_render = bool(os.getenv("RENDER"))
is_prod = os.getenv("ENVIRONMENT", "").lower() in ("production", "prod") or is_render
cookie_samesite = os.getenv("COOKIE_SAMESITE", "none" if is_prod else "lax")
cookie_secure = os.getenv("COOKIE_SECURE", "true" if is_prod else "false").lower() in ("true", "1", "yes")

app = FastAPI(title="FieldShift API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if "*" not in allowed_origins else ["*"],
    allow_origin_regex=cors_origin_regex if "*" not in allowed_origins else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        "fieldshift_session",
        token,
        httponly=True,
        samesite=cookie_samesite,
        secure=cookie_secure,
        max_age=604800,
    )

def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        "fieldshift_session",
        samesite=cookie_samesite,
        secure=cookie_secure,
    )

@app.get("/api/health")
@app.get("/healthz")
def health_check():
    return {
        "status": "healthy",
        "service": "fieldshift",
        "database": "postgresql" if is_postgres() else "sqlite",
        "environment": "production" if is_prod else "development",
    }

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
def optional_user(fieldshift_session: str | None = Cookie(None), db: DbSession = Depends(get_db)) -> User | None:
    if not fieldshift_session:
        return None
    item = db.scalar(select(LoginSession).where(LoginSession.token == fieldshift_session, LoginSession.expires_at > now()))
    if not item:
        return None
    user = db.get(User, item.user_id)
    return user if (user and user.is_active) else None

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
    res = {c.name: getattr(value, c.name) for c in value.__table__.columns}
    if "existing_rotation" in res and isinstance(res["existing_rotation"], str):
        try:
            res["existing_rotation"] = json.loads(res["existing_rotation"])
        except Exception:
            pass
    return res

def finite_json_value(value: Any) -> Any:
    if isinstance(value, float) and not math.isfinite(value):
        return None
    if isinstance(value, dict):
        return {key: finite_json_value(item) for key, item in value.items()}
    if isinstance(value, list):
        return [finite_json_value(item) for item in value]
    return value

def _validated_optional_number(data: dict[str, Any], key: str, *, minimum: float | None = None, maximum: float | None = None) -> float | None:
    value = data.get(key)
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        raise HTTPException(400, f"{key} must be a finite number.")
    try:
        numeric = float(value)
    except (TypeError, ValueError, OverflowError) as error:
        raise HTTPException(400, f"{key} must be a finite number.") from error
    if not math.isfinite(numeric):
        raise HTTPException(400, f"{key} must be a finite number.")
    if minimum is not None and numeric < minimum:
        raise HTTPException(400, f"{key} must be at least {minimum}.")
    if maximum is not None and numeric > maximum:
        raise HTTPException(400, f"{key} must be at most {maximum}.")
    return numeric

def _planning_cache_key(data: dict[str, Any], climate_df: Any, district: str) -> tuple[str, str, str]:
    """Key a plan by its complete request payload and climate observations."""
    payload = json.dumps(data, sort_keys=True, separators=(",", ":"), default=str)
    request_digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    climate_digest = hashlib.sha256(
        climate_df.to_json(orient="split", date_format="iso", double_precision=15).encode("utf-8")
    ).hexdigest()
    return district, request_digest, climate_digest

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
        "soil_ph": getattr(field, "soil_ph", None),
        "district": getattr(field, "district", None),
        "seasonally_flooded": getattr(field, "seasonally_flooded", False),
        "nearest_district_distance_km": getattr(field, "nearest_district_distance_km", None),
        "power_cell": getattr(field, "power_cell", None),
        "imerg_cell": getattr(field, "imerg_cell", None),
        "soilgrids_soil": getattr(field, "soilgrids_soil", None),
        "existing_rotation": getattr(field, "existing_rotation", None),
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
        data["history_crops"] = [h.crop for h in histories if h.crop]
        data["_saved_field_history"] = [
            {
                "id": h.id,
                "year": h.year,
                "season": h.season,
                "crop": h.crop,
                "yield_ton_per_ha": h.yield_ton_per_ha,
                "price_bdt_per_maund": getattr(h, "price_bdt_per_maund", None),
                "cost_bdt_per_bigha": getattr(h, "cost_bdt_per_bigha", None),
                "water_applied_mm": getattr(h, "water_applied_mm", None),
            }
            for h in histories
            if h.year is not None and h.season and h.crop
        ]
    else:
        data["previous_crop"] = ""
        data["previous_crop_year"] = ""
        data["_saved_field_history"] = []
    return data


def complete_saved_history_rotation(
    records: Any,
    *,
    before_year: int,
) -> tuple[dict[str, str], int] | None:
    """Return the latest unambiguous three-season rotation recorded before a decision year."""
    if not isinstance(records, list):
        return None
    aliases = {
        "rabi": "rabi",
        "dry": "rabi",
        "রবি": "rabi",
        "kharif1": "kharif1",
        "kharif-1": "kharif1",
        "খরিফ-১": "kharif1",
        "খরিপ-১": "kharif1",
        "kharif2": "kharif2",
        "kharif-2": "kharif2",
        "খরিফ-২": "kharif2",
        "খরিপ-২": "kharif2",
    }
    by_year: dict[int, dict[str, list[str]]] = {}
    for record in records:
        if not isinstance(record, dict):
            continue
        try:
            year = int(record.get("year"))
        except (TypeError, ValueError):
            continue
        slot = aliases.get(str(record.get("season") or "").strip().casefold())
        crop = record.get("crop")
        if year >= before_year or slot is None or not isinstance(crop, str) or not crop.strip():
            continue
        by_year.setdefault(year, {}).setdefault(slot, []).append(crop.strip())
    for year in sorted(by_year, reverse=True):
        seasons = by_year[year]
        if all(len(seasons.get(slot, [])) == 1 for slot in ("rabi", "kharif1", "kharif2")):
            return {slot: seasons[slot][0] for slot in ("rabi", "kharif1", "kharif2")}, year
    return None

def authorize_rl_field(field_id: Any, fieldshift_session: str | None, db: DbSession) -> tuple[FarmField | None, User | None]:
    if str(field_id) == "demo":
        return None, None
    try:
        numeric_field_id = int(field_id)
    except (TypeError, ValueError) as error:
        raise HTTPException(400, "field_id must identify the selected registered field or explicit demo field.") from error
    user = require_user(fieldshift_session, db)
    return owned_field(db, numeric_field_id, user), user

def rl_weights(strategy_id: Any) -> dict[str, float]:
    from src.optimizer.strategies import DEFAULT_PRIORITY_PROFILES

    profiles = {
        "profit_focused": DEFAULT_PRIORITY_PROFILES["profit_focused"],
        "water_efficiency": DEFAULT_PRIORITY_PROFILES["water_focused"],
        "soil_health": DEFAULT_PRIORITY_PROFILES["soil_focused"],
        "balanced": DEFAULT_PRIORITY_PROFILES["balanced"],
    }
    key = str(strategy_id or "")
    if key not in profiles:
        raise HTTPException(400, "strategy_id must be one of the four canonical MILP strategies.")
    return profiles[key]

def run_rl_step_payload(data: dict[str, Any], *, baseline_crop: str | None = None) -> dict[str, Any]:
    from src.data.crops import load_crop_knowledge
    from src.rl.crop_rotation_rl import run_sequential_policy_step

    try:
        result = run_sequential_policy_step(
            data.get("state"),
            load_crop_knowledge(),
            weights=rl_weights(data.get("strategy_id")),
            season_index=data.get("season_index"),
            field_area_ha=data.get("field_area_ha"),
            applied_crop=data.get("applied_crop"),
            baseline_crop=baseline_crop,
        )
    except (TypeError, ValueError, FileNotFoundError) as error:
        raise HTTPException(422, str(error)) from error
    return result

def run_milp_baseline_step_payload(data: dict[str, Any], crop: str) -> dict[str, Any]:
    return run_rl_step_payload(data, baseline_crop=crop)

def validate_rl_decision_context(data: dict[str, Any]) -> dict[str, Any]:
    season_index = data.get("season_index")
    if isinstance(season_index, bool) or not isinstance(season_index, int) or not 0 <= season_index < 6:
        raise HTTPException(422, "season_index must be an integer from 0 through 5.")
    initial_state = data.get("initial_state")
    state = data.get("state")
    history = data.get("completed_seasons")
    reference_rotation = data.get("milp_reference_rotation")
    if not isinstance(initial_state, dict) or not isinstance(state, dict):
        raise HTTPException(422, "initial_state and current state must be objects.")
    try:
        initial_temperature = float(initial_state["temperature_c"])
        initial_water = float(initial_state["available_water_mm"])
        initial_soil_health = float(initial_state["soil_health_score"])
        initial_ph = float(initial_state["soil_ph"]) if initial_state.get("soil_ph") is not None else None
    except (KeyError, TypeError, ValueError) as error:
        raise HTTPException(422, "Initial temperature, available water, and soil-health proxy must be valid numbers.") from error
    if (
        not all(math.isfinite(value) for value in (initial_temperature, initial_water, initial_soil_health))
        or not -10 <= initial_temperature <= 60
        or not 0 <= initial_water <= 100000
        or not 0 <= initial_soil_health <= 100
        or (initial_ph is not None and (not math.isfinite(initial_ph) or not 0 <= initial_ph <= 14))
    ):
        raise HTTPException(422, "Initial simulation values are outside the supported temperature, water, soil-health, or pH range.")
    if not isinstance(history, list) or len(history) != season_index:
        raise HTTPException(422, "completed_seasons must contain exactly the prior completed seasons.")
    if not isinstance(reference_rotation, list) or len(reference_rotation) != 6:
        raise HTTPException(422, "milp_reference_rotation must contain the six-season reference plan.")
    season_ids = ["Y1_S1", "Y1_S2", "Y2_S1", "Y2_S2", "Y3_S1", "Y3_S2"]
    strategy_id = str(data.get("strategy_id") or "")
    for index, season in enumerate(history):
        if not isinstance(season, dict) or season.get("season_id") != season_ids[index]:
            raise HTTPException(422, f"completed_seasons entry {index + 1} is missing or out of order.")
        before = season.get("state_before")
        after = season.get("state_after")
        after_crop = season.get("state_after_crop")
        outcome = season.get("outcome")
        applied_crop = season.get("applied_action")
        if (
            season.get("status") != "completed"
            or not isinstance(before, dict)
            or not isinstance(after, dict)
            or not isinstance(after_crop, dict)
            or not isinstance(outcome, dict)
            or not applied_crop
            or outcome.get("crop") != applied_crop
            or after.get("previous_crop") != applied_crop
            or season.get("stress_intervention") is None
        ):
            raise HTTPException(422, f"{season_ids[index]} is not a valid completed state transition.")
        if index == 0 and before != initial_state:
            raise HTTPException(422, "Y1_S1 state_before must match the selected field/MILP context.")
        if index and before != history[index - 1].get("state_after"):
            raise HTTPException(422, f"State continuity failed before {season_ids[index]}.")
        if season.get("milp_reference_crop") != reference_rotation[index]:
            raise HTTPException(422, f"{season_ids[index]} does not match the initial MILP reference rotation.")
        decision_source = season.get("decision_source")
        if index == 0:
            if (
                decision_source != "milp_baseline"
                or season.get("rl_proposed_action") is not None
                or applied_crop != reference_rotation[0]
            ):
                raise HTTPException(422, "Y1_S1 must be the selected MILP baseline action, not an RL decision.")
            reproduced = run_milp_baseline_step_payload({
                "state": before,
                "season_index": index,
                "strategy_id": strategy_id,
                "field_area_ha": before.get("field_area_ha", data.get("field_area_ha")),
            }, reference_rotation[0])
        else:
            if decision_source not in {"rl_policy", "user_override"}:
                raise HTTPException(422, f"{season_ids[index]} has an invalid decision source.")
            reproduced = run_rl_step_payload({
                "state": before,
                "season_index": index,
                "strategy_id": strategy_id,
                "field_area_ha": before.get("field_area_ha", data.get("field_area_ha")),
                "applied_crop": applied_crop if decision_source == "user_override" else None,
            })
        if (
            reproduced["rl_proposed_action"] != season.get("rl_proposed_action")
            or reproduced["applied_action"] != applied_crop
            or reproduced["decision_source"] != decision_source
            or reproduced["outcome"] != outcome
        ):
            raise HTTPException(422, f"{season_ids[index]} history does not match its backend decision/outcome.")
        next_season_id = season_ids[index + 1] if index + 1 < len(season_ids) else None
        reproduced_after_crop = reproduced["state_after_crop"]
        reproduced_after_crop["season_id"] = next_season_id
        if reproduced_after_crop != after_crop:
            raise HTTPException(422, f"{season_ids[index]} history has an inconsistent post-crop state.")
        reproduced_after, reproduced_intervention = apply_rl_intervention(
            reproduced_after_crop,
            season.get("stress_intervention"),
        )
        reproduced_after["season_id"] = next_season_id
        if reproduced_after != after or reproduced_intervention != season.get("stress_intervention"):
            raise HTTPException(422, f"{season_ids[index]} history has an inconsistent intervention/state.")
    expected_state = history[-1]["state_after"] if history else initial_state
    if state != expected_state:
        raise HTTPException(409, "Current state must equal the field-context starting state or latest completed season state.")
    if state.get("season_id") != season_ids[season_index]:
        raise HTTPException(422, f"Current state must be the state entering {season_ids[season_index]}.")
    return {
        "season_index": season_index,
        "initial_state": initial_state,
        "current_state": state,
        "completed_seasons": history,
        "milp_reference_rotation": reference_rotation,
        "interventions": [season.get("stress_intervention") for season in history],
    }

def apply_rl_intervention(state: dict[str, Any], raw: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    if raw is None:
        raw = {}
    if not isinstance(raw, dict):
        raise HTTPException(422, "intervention must be an object.")
    allowed = {
        "water_reduction_pct",
        "temperature_delta_c",
        "available_water_override_mm",
        "temperature_override_c",
    }
    unknown = set(raw) - allowed
    if unknown:
        raise HTTPException(422, "Unsupported intervention fields: " + ", ".join(sorted(unknown)))
    next_state = dict(state)
    applied = {
        "water_reduction_pct": 0.0,
        "temperature_delta_c": 0.0,
        "available_water_override_mm": None,
        "temperature_override_c": None,
    }
    try:
        water_reduction = float(raw.get("water_reduction_pct", 0))
        temperature_delta = float(raw.get("temperature_delta_c", 0))
        if water_reduction not in (0.0, 0.2, 0.4, 0.6):
            raise ValueError("water_reduction_pct must be 0, 0.2, 0.4, or 0.6.")
        if temperature_delta not in (0.0, 1.0, 3.0, 5.0):
            raise ValueError("temperature_delta_c must be 0, 1, 3, or 5.")
        next_state["available_water_mm"] = max(
            0.0, float(next_state["available_water_mm"]) * (1.0 - water_reduction)
        )
        next_state["temperature_c"] = float(next_state["temperature_c"]) + temperature_delta
        if water_reduction > 0:
            next_state["available_water_source"] = "simulation-derived from crop transition and user-selected water stress"
        if temperature_delta > 0:
            next_state["temperature_source"] = "simulation-derived from prior temperature and user-selected heat stress"
        applied["water_reduction_pct"] = water_reduction
        applied["temperature_delta_c"] = temperature_delta
        for key, minimum, maximum in (
            ("available_water_override_mm", 0.0, 100000.0),
            ("temperature_override_c", -10.0, 60.0),
        ):
            if raw.get(key) not in (None, ""):
                value = float(raw[key])
                if not math.isfinite(value) or not minimum <= value <= maximum:
                    raise ValueError(f"{key} must be between {minimum:g} and {maximum:g}.")
                state_key = "available_water_mm" if key == "available_water_override_mm" else "temperature_c"
                next_state[state_key] = value
                source_key = "available_water_source" if key == "available_water_override_mm" else "temperature_source"
                next_state[source_key] = "user-supplied simulation assumption (post-season intervention)"
                applied[key] = value
    except (KeyError, TypeError, ValueError) as error:
        raise HTTPException(422, str(error)) from error
    return next_state, applied

def validate_rl_trajectory(raw: Any, final_state: dict[str, Any], strategy_id: str) -> list[dict[str, Any]]:
    season_ids = ["Y1_S1", "Y1_S2", "Y2_S1", "Y2_S2", "Y3_S1", "Y3_S2"]
    if not isinstance(raw, list) or len(raw) != len(season_ids):
        raise HTTPException(422, "rl_trajectory must contain all six completed seasons.")
    trajectory: list[dict[str, Any]] = []
    for index, (season_id, item) in enumerate(zip(season_ids, raw)):
        if not isinstance(item, dict) or item.get("season_id") != season_id:
            raise HTTPException(422, f"rl_trajectory season {index + 1} is missing or out of order.")
        before = item.get("state_before")
        after_crop = item.get("state_after_crop")
        after = item.get("state_after")
        outcome = item.get("outcome")
        proposed = item.get("rl_proposed_action")
        applied = item.get("applied_action")
        source = item.get("decision_source")
        if item.get("status") != "completed" or not all(isinstance(value, dict) for value in (before, after_crop, after, outcome)):
            raise HTTPException(422, f"rl_trajectory {season_id} is not a completed state transition.")
        if not applied or outcome.get("crop") != applied:
            raise HTTPException(422, f"rl_trajectory {season_id} action and outcome do not match.")
        if index == 0:
            if source != "milp_baseline" or proposed is not None or applied != item.get("milp_reference_crop"):
                raise HTTPException(422, "rl_trajectory Y1_S1 must be the MILP baseline action without an RL proposal.")
        else:
            if not proposed or source not in {"rl_policy", "user_override"}:
                raise HTTPException(422, f"rl_trajectory {season_id} has an invalid RL decision source.")
            if source == "rl_policy" and proposed != applied:
                raise HTTPException(422, f"rl_trajectory {season_id} changes the RL action without a user override.")
        if after.get("previous_crop") != applied:
            raise HTTPException(422, f"rl_trajectory {season_id} state does not record its applied crop.")
        if index and before != trajectory[index - 1]["state_after"]:
            raise HTTPException(422, f"rl_trajectory state continuity failed before {season_id}.")
        if index == 0:
            reproduced = run_milp_baseline_step_payload({
                "state": before,
                "season_index": index,
                "strategy_id": strategy_id,
                "field_area_ha": before.get("field_area_ha"),
            }, applied)
        else:
            reproduced = run_rl_step_payload({
                "state": before,
                "season_index": index,
                "strategy_id": strategy_id,
                "field_area_ha": before.get("field_area_ha"),
                "applied_crop": applied if source == "user_override" else None,
            })
        if (
            reproduced["rl_proposed_action"] != proposed
            or reproduced["applied_action"] != applied
            or reproduced["decision_source"] != source
            or reproduced["outcome"] != outcome
        ):
            raise HTTPException(422, f"rl_trajectory {season_id} does not match its backend policy/outcome.")
        reproduced_after_crop = reproduced["state_after_crop"]
        reproduced_after_crop["season_id"] = season_ids[index + 1] if index < 5 else None
        if reproduced_after_crop != after_crop:
            raise HTTPException(422, f"rl_trajectory {season_id} does not match its backend crop transition.")
        reproduced_after, reproduced_intervention = apply_rl_intervention(
            reproduced_after_crop,
            item.get("stress_intervention"),
        )
        reproduced_after["season_id"] = season_ids[index + 1] if index < 5 else None
        if reproduced_after != after or reproduced_intervention != item.get("stress_intervention"):
            raise HTTPException(422, f"rl_trajectory {season_id} does not match its recorded intervention/state.")
        trajectory.append(item)
    if trajectory[-1]["state_after"] != final_state:
        raise HTTPException(422, "final_state must equal the Season 6 state_after in rl_trajectory.")
    return trajectory

@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(engine)
    try:
        from sqlalchemy import inspect, text
        with engine.begin() as conn:
            cols = [c["name"] for c in inspect(conn).get_columns("fields")]
            if "district" not in cols:
                conn.execute(text("ALTER TABLE fields ADD COLUMN district VARCHAR"))
            if "seasonally_flooded" not in cols:
                conn.execute(text("ALTER TABLE fields ADD COLUMN seasonally_flooded BOOLEAN DEFAULT 0"))
            if "nearest_district_distance_km" not in cols:
                conn.execute(text("ALTER TABLE fields ADD COLUMN nearest_district_distance_km FLOAT"))
            if "power_cell" not in cols:
                conn.execute(text("ALTER TABLE fields ADD COLUMN power_cell VARCHAR"))
            if "imerg_cell" not in cols:
                conn.execute(text("ALTER TABLE fields ADD COLUMN imerg_cell VARCHAR"))
            if "soilgrids_soil" not in cols:
                conn.execute(text("ALTER TABLE fields ADD COLUMN soilgrids_soil VARCHAR"))
            for sg_col in ["soilgrids_sand", "soilgrids_silt", "soilgrids_clay", "soilgrids_ph", "soilgrids_soc"]:
                if sg_col not in cols:
                    conn.execute(text(f"ALTER TABLE fields ADD COLUMN {sg_col} FLOAT"))
            if "existing_rotation" not in cols:
                conn.execute(text("ALTER TABLE fields ADD COLUMN existing_rotation JSON"))
            hist_cols = {c["name"] for c in inspect(conn).get_columns("field_history")}
            if "yield_ton_per_ha" not in hist_cols:
                conn.execute(text("ALTER TABLE field_history ADD COLUMN yield_ton_per_ha FLOAT"))
            if "water_applied_mm" not in hist_cols:
                conn.execute(text("ALTER TABLE field_history ADD COLUMN water_applied_mm FLOAT"))
            if "price_bdt_per_maund" not in hist_cols:
                conn.execute(text("ALTER TABLE field_history ADD COLUMN price_bdt_per_maund FLOAT"))
            if "cost_bdt_per_bigha" not in hist_cols:
                conn.execute(text("ALTER TABLE field_history ADD COLUMN cost_bdt_per_bigha FLOAT"))
    except Exception as e:
        logger.warning(f"Field table column migration notice: {e}")

def health(db: DbSession = Depends(get_db)):
    db_status = "ok"
    dialect = engine.dialect.name
    try:
        db.execute(select(1)).scalar()
    except Exception as exc:
        db_status = f"unhealthy: {type(exc).__name__}"

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "database": {
            "status": db_status,
            "dialect": dialect,
            "is_postgres": is_postgres(),
        },
        "project": "FieldShift",
        "mode": "offline_demo",
        "synthetic_boundary": True,
        "uses_repository_modules": True,
        "dashboard": "available",
        "notes": [
            "Live NASA POWER retrieval is available only when explicitly selected.",
            "Offline mode uses bundled data and the existing FieldShift pipeline."
        ]
    }

@app.get("/api/geo/environmental-profiles")
def get_environmental_profiles():
    import json
    srtm_path = ROOT_DIR / "data" / "srtm" / "field_elevations.json"
    grace_path = ROOT_DIR / "data" / "grace" / "grace_bangladesh_trends.json" 
    srtm = {}
    grace = {}
    if srtm_path.exists():
        try:
            with open(srtm_path, "r", encoding="utf-8") as f:
                srtm = json.load(f)
        except Exception:
            pass
    if grace_path.exists():
        try:
            with open(grace_path, "r", encoding="utf-8") as f:
                grace = json.load(f)
        except Exception:
            pass
    return {
        "status": "ok",
        "srtm": srtm,
        "grace": grace
    }

@app.post("/api/geo/climate-scenario")
def climate_scenario_endpoint(payload: Payload, db: DbSession = Depends(get_db)):
    """Evaluate dynamic climate perturbation (Rainfall -20..+20%, Temp +0..+2°C) against empirical NASA POWER & IMERG data."""
    from src.compute.advisory_service import load_district_climate_data, DISTRICT_REGISTRY, nearest_district
    data = payload.model_dump()
    dist_raw = data.get("district")
    lat_val = data.get("latitude")
    lon_val = data.get("longitude")
    if not dist_raw and lat_val is not None and lon_val is not None:
        try:
            dist_raw = nearest_district(float(lat_val), float(lon_val))
        except Exception:
            dist_raw = "bogura"
    dist_key = str(dist_raw or "bogura").strip().lower()
    if dist_key not in DISTRICT_REGISTRY:
        dist_key = "bogura"

    rain_delta_pct = float(data.get("rain_delta_pct") or data.get("rain_delta") or 0.0)
    temp_delta_c = float(data.get("temp_delta_c") or data.get("temp_delta") or 0.0)

    rain_delta_pct = max(-40.0, min(40.0, rain_delta_pct))
    temp_delta_c = max(0.0, min(4.0, temp_delta_c))

    is_offline = os.environ.get("OFFLINE", "1") == "1"
    df, mode = load_district_climate_data(dist_key, offline=is_offline)
    n_years = max(1.0, len(df) / 365.25)

    base_heat_days = float((df["temp_max"] > 35.0).sum() / n_years)
    pert_heat_days = float(((df["temp_max"] + temp_delta_c) > 35.0).sum() / n_years)
    extra_heat_days = round(pert_heat_days - base_heat_days, 1)

    mean_temp = float(df["temperature"].mean())
    et0_increase_pct = round(((temp_delta_c) / (mean_temp + 17.8)) * 100.0, 1) if temp_delta_c > 0 else 0.0

    base_annual_rain = float(df["rainfall"].sum() / n_years)
    rain_delta_mm = base_annual_rain * (rain_delta_pct / 100.0)
    base_et0_mm = 1350.0
    water_delta_mm = round((base_et0_mm * (et0_increase_pct / 100.0)) - (0.6 * rain_delta_mm), 1)

    existing_profit_delta_pct = round(- (temp_delta_c * 3.2) + (rain_delta_pct * 0.4), 1)
    water_strat_profit_delta_pct = round(- (temp_delta_c * 1.8) + (rain_delta_pct * 0.15), 1)
    soil_strat_profit_delta_pct = round(- (temp_delta_c * 1.5) + (rain_delta_pct * 0.10), 1)

    return {
        "status": "ok",
        "district": dist_key,
        "rain_delta_pct": rain_delta_pct,
        "temp_delta_c": temp_delta_c,
        "et0_increase_pct": et0_increase_pct,
        "water_delta_mm": water_delta_mm,
        "base_heat_stress_days": round(base_heat_days, 1),
        "total_heat_stress_days": round(pert_heat_days, 1),
        "extra_heat_stress_days": extra_heat_days,
        "annual_rainfall_mm": round(base_annual_rain, 1),
        "existing_profit_delta_pct": existing_profit_delta_pct,
        "water_strat_profit_delta_pct": water_strat_profit_delta_pct,
        "soil_strat_profit_delta_pct": soil_strat_profit_delta_pct,
        "provenance": "NASA POWER (2001-2025) + GPM IMERG 0.10°",
    }


_PLANNING_CACHE: dict = {}

@app.post("/api/workflow")
@app.post("/api/planning")
@app.post("/api/planning/six-seasons")
def workflow(payload: Payload, fieldshift_session: str | None = Cookie(None), db: DbSession = Depends(get_db)):
    data = payload.model_dump()
    request_inputs = dict(data)
    saved_field_record = False
    field_record = None
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
        planning_overrides = {
            key: data[key]
            for key in (
                "soil_texture", "soil_ph", "organic_matter", "irrigation_capacity_mm",
                "no_power_tiller", "labour_shortage", "existing_rotation", "field_history_records", "crop_history"
            )
            if key in data
        }
        field_record = owned_field(db, fid, user)
        data = use_field_record(data, field_record, db)
        data.update(planning_overrides)
        saved_field_record = True
    elif "area_ha" in data and ("field_size_ha" not in data or data["field_size_ha"] in (None, "")):
        data["field_size_ha"] = data["area_ha"]

    for key, minimum, maximum in (
        ("latitude", -90.0, 90.0),
        ("longitude", -180.0, 180.0),
        ("area_ha", 0.000001, None),
        ("field_size_ha", 0.000001, None),
        ("soil_ph", 0.0, 14.0),
        ("organic_matter", 0.0, 100.0),
        ("irrigation_capacity_mm", 0.0, None),
        ("available_water_mm", 0.0, None),
    ):
        validated = _validated_optional_number(data, key, minimum=minimum, maximum=maximum)
        if validated is not None:
            data[key] = validated

    for key in ("no_power_tiller", "labour_shortage"):
        if key in data and not isinstance(data[key], bool):
            raise HTTPException(400, f"{key} must be a boolean.")
    for key in ("market_preferences", "marketPreferences"):
        if key in data and data[key] is not None and (
            not isinstance(data[key], list)
            or any(not isinstance(value, str) or not value.strip() for value in data[key])
        ):
            raise HTTPException(400, f"{key} must be a list of non-empty crop names.")

    priority = str(data.get("priority", "balanced")).strip().lower()
    valid_priorities = {"balanced", "profit", "water", "soil", "national_need", "দেশের চাহিদা", "demand"}
    if priority not in valid_priorities:
        raise HTTPException(400, f"Invalid priority '{priority}'. Allowed values: ['balanced', 'profit', 'water', 'soil', 'national_need']")

    district = data.get("district")
    lat_val = data.get("latitude")
    lon_val = data.get("longitude")
    if (district is None or not str(district).strip()) and lat_val is not None and lon_val is not None:
        try:
            from src.compute.advisory_service import nearest_district
            district = nearest_district(float(lat_val), float(lon_val))
        except Exception:
            raise HTTPException(400, "Could not resolve nearest district from provided coordinates.")
    elif district is None or not str(district).strip():
        raise HTTPException(400, "District or valid latitude/longitude is required for planning. Please specify a location.")

    dist_key = None
    climate_df = None
    data_mode = None
    if district is not None and str(district).strip():
        dist_key = str(district).strip().lower()
        from src.compute.advisory_service import load_district_climate_data, DISTRICT_REGISTRY
        if dist_key not in DISTRICT_REGISTRY:
            raise HTTPException(400, f"Unsupported district '{district}'. Supported districts: {list(DISTRICT_REGISTRY.keys())}")
        is_offline = os.environ.get("OFFLINE", "1") == "1"
        try:
            climate_df, data_mode = load_district_climate_data(dist_key, offline=is_offline)
        except ValueError as err:
            raise HTTPException(400, str(err)) from err
        if "date" in climate_df.columns:
            import pandas as pd
            climate_df["date"] = pd.to_datetime(climate_df["date"])

    user_dict = public_user(user) if user else None

    if dist_key and climate_df is not None:
        import pandas as pd
        from src.compute.advisory_service import DISTRICT_REGISTRY
        from src.data.crops import load_crop_knowledge
        from src.state.field_state import build_field_state
        from src.optimizer.milp import optimize_rotation

        ctx = DISTRICT_REGISTRY[dist_key]
        crops = load_crop_knowledge()
        lat = float(data["latitude"] if data.get("latitude") is not None else (ctx.get("latitude") or ctx.get("lat")))
        lon = float(data["longitude"] if data.get("longitude") is not None else (ctx.get("longitude") or ctx.get("lon")))
        field_id = str(data.get("field_id") or f"{dist_key}_field")

        decision_date = climate_df["date"].max() if "date" in climate_df.columns and not climate_df.empty else pd.to_datetime("2025-12-31")
        if saved_field_record:
            history_records = data.get("field_history_records") or data.get("crop_history") or data.get("_saved_field_history") or []
            eligible_history = []
            for record in history_records:
                try:
                    prior_year = int(record.get("year"))
                except (AttributeError, TypeError, ValueError):
                    continue
                if prior_year < pd.Timestamp(decision_date).year:
                    eligible_history.append(record)
            data["history_crops"] = [
                record["crop"] for record in eligible_history
                if isinstance(record, dict) and record.get("crop")
            ]
            if eligible_history:
                data["previous_crop"] = eligible_history[0].get("crop") or ""
                data["previous_crop_year"] = eligible_history[0].get("year")
            else:
                data["previous_crop"] = ""
                data["previous_crop_year"] = ""
        existing_rotation = data.get("existing_rotation")
        complete_profile = (
            isinstance(existing_rotation, dict)
            and all(existing_rotation.get(key) or existing_rotation.get(alias) for key, alias in (
                ("rabi", "S1"),
                ("kharif1", "S2"),
                ("kharif2", "S3"),
            ))
        )
        existing_rotation_source = (
            "saved_field_rotation"
            if saved_field_record and complete_profile
            else "request_supplied_rotation"
            if isinstance(existing_rotation, dict) and complete_profile
            else None
        )
        existing_rotation_year = None
        if saved_field_record and not complete_profile:
            saved_history_rotation = complete_saved_history_rotation(
                data.get("_saved_field_history"),
                before_year=pd.Timestamp(decision_date).year,
            )
            if saved_history_rotation is not None:
                existing_rotation, existing_rotation_year = saved_history_rotation
                existing_rotation_source = "saved_field_history"
                data["existing_rotation"] = existing_rotation
                data["_existing_rotation_year"] = existing_rotation_year
                data["_existing_rotation_source"] = existing_rotation_source
        elif existing_rotation_source is not None:
            data["_existing_rotation_source"] = existing_rotation_source
            data["_existing_rotation_year"] = existing_rotation_year
        field_coordinates_supplied = data.get("latitude") is not None and data.get("longitude") is not None
        if field_coordinates_supplied:
            smap_data = None
        else:
            from src.data.smap import SMAP_COLUMNS
            smap_data = pd.DataFrame(columns=SMAP_COLUMNS)
        f_state = build_field_state(
            field_id=field_id,
            latitude=lat,
            longitude=lon,
            decision_date=decision_date,
            nasa_power_data=climate_df.tail(60),
            smap_data=smap_data,
            crop_knowledge=crops,
        )
        area_input = data.get("area_ha")
        if area_input is None:
            area_input = data.get("field_size_ha")
        area_val = float(area_input) if area_input is not None else float("nan")
        f_state.field_size_ha = area_val
        f_state.area_ha = area_val
        if data.get("previous_crop"):
            f_state.previous_crop = str(data["previous_crop"])
            f_state.previous_crop_year = data.get("previous_crop_year")
        if data.get("soil_texture") not in (None, "", "unknown"):
            f_state.texture = str(data["soil_texture"])
        if data.get("soil_ph") is not None:
            f_state.ph = data["soil_ph"]
        if data.get("organic_matter") is not None:
            f_state.organic_matter = data["organic_matter"]
        if data.get("irrigation_capacity_mm") is not None:
            f_state.irrigation_capacity_mm = data["irrigation_capacity_mm"]

        p_wt, w_wt, s_wt, n_wt = 0.34, 0.33, 0.33, 0.0
        custom_w = data.get("weights")
        if isinstance(custom_w, dict) and any(k in custom_w for k in ("profit", "water", "soil")):
            parsed_weights = {}
            for name in ("profit", "water", "soil", "national_need"):
                parsed_weights[name] = _validated_optional_number(
                    custom_w, name, minimum=0.0
                )
            p_wt = parsed_weights["profit"] if parsed_weights["profit"] is not None else 0.34
            w_wt = parsed_weights["water"] if parsed_weights["water"] is not None else 0.33
            s_wt = parsed_weights["soil"] if parsed_weights["soil"] is not None else 0.33
            n_wt = parsed_weights["national_need"] if parsed_weights["national_need"] is not None else 0.0
            tot = p_wt + w_wt + s_wt + n_wt
            if not math.isfinite(tot) or tot <= 0:
                raise HTTPException(400, "At least one planning weight must be positive.")
            p_wt, w_wt, s_wt, n_wt = p_wt / tot, w_wt / tot, s_wt / tot, n_wt / tot
        elif priority in {"profit", "profit_focused"}:
            p_wt, w_wt, s_wt, n_wt = 0.70, 0.20, 0.10, 0.0
        elif priority in {"water", "water_efficiency"}:
            p_wt, w_wt, s_wt, n_wt = 0.20, 0.60, 0.20, 0.0
        elif priority in {"soil", "soil_health"}:
            p_wt, w_wt, s_wt, n_wt = 0.20, 0.20, 0.60, 0.0
        elif priority in {"national_need", "দেশের চাহিদা", "demand"}:
            p_wt, w_wt, s_wt, n_wt = 0.20, 0.15, 0.15, 0.50

        is_haor = data.get("seasonally_flooded")
        if is_haor is None:
            is_haor = dist_key in {"sunamganj", "netrokona", "kishoreganj", "habiganj", "moulvibazar", "sylhet"}

        f_state.district = dist_key
        f_state.seasonally_flooded = bool(is_haor)
        from src.optimizer.dynamic_agronomy import COASTAL_SALINE_DISTRICTS
        f_state.coastal_saline = dist_key in COASTAL_SALINE_DISTRICTS

        allow_k2_fallow = bool(data.get("allow_kharif2_fallow", is_haor))
        hist_crops_param = data.get("history_crops") or data.get("crop_history") or None
        cache_key = _planning_cache_key(
            {**data, "_climate_data_mode": data_mode},
            climate_df,
            dist_key,
        )
        if cache_key in _PLANNING_CACHE:
            return _PLANNING_CACHE[cache_key]

        milp_res = optimize_rotation(
            field_state=f_state,
            crops=crops,
            environmental_history=climate_df,
            profit_weight=p_wt,
            water_weight=w_wt,
            soil_weight=s_wt,
            national_need_weight=n_wt,
            allow_kharif2_fallow=allow_k2_fallow,
            min_cereals_per_year=int(data.get("min_cereals_per_year", 1)),
            seasonally_flooded=bool(is_haor),
            field_history_crops=hist_crops_param,
            field_history_records=history_records if saved_field_record else (data.get("field_history_records") or data.get("crop_history") or []),
            existing_rotation=existing_rotation,
            existing_rotation_source=existing_rotation_source,
            existing_rotation_year=existing_rotation_year,
            excluded_crops=([c for c in data.get("excluded_crops", []) if c] + (["Potato"] if data.get("no_power_tiller") and "Potato" not in data.get("excluded_crops", []) else [])) or None,
        )
        from src.explainability.explanations import explain_milp_plan
        milp_res["decision_explanation"] = explain_milp_plan(
            milp_res,
            field_state=f_state,
            crops=crops,
        )
        from src.compute.risk_evaluator import compute_planner_risk_suite
        risk_suite = compute_planner_risk_suite(
            district=dist_key,
            climate_df=climate_df,
            plan_rotation=milp_res.get("selected_crop_by_period") or milp_res.get("recommended_crops"),
            baseline_bare_days=milp_res.get("baseline_bare_days"),
            plan_bare_days=milp_res.get("plan_bare_days"),
        )
        milp_res["risk"] = risk_suite
        env_basis = milp_res.get("environment_basis")
        observed_years = sorted(
            int(year)
            for year in climate_df["date"].dt.year.dropna().unique()
        ) if "date" in climate_df.columns else []
        time_range = (
            [str(climate_df["date"].min().date()), str(climate_df["date"].max().date())]
            if "date" in climate_df.columns and not climate_df.empty
            else None
        )
        if not env_basis:
            num_years = len(observed_years) if observed_years else 0
            env_basis = f"nasa_power_climatology_{num_years}_years"
        unapplied_farmer_constraints = []
        if data.get("labour_shortage"):
            unapplied_farmer_constraints.append(
                "labour_shortage (crop labour-demand metadata is unavailable)"
            )
        if data.get("market_preferences") or data.get("marketPreferences"):
            unapplied_farmer_constraints.append(
                "market_preferences (crop-specific market suitability data is not connected to the optimizer)"
            )

        from src.optimizer.strategy_scoring import score_and_rank_strategies
        strategy_weights_map = {
            "balanced": (0.34, 0.33, 0.33, 0.0),
            "profit": (0.60, 0.20, 0.20, 0.0),
            "water": (0.20, 0.60, 0.20, 0.0),
            "soil": (0.20, 0.20, 0.60, 0.0),
        }
        canonical_priority = "profit" if priority in {"profit", "profit_focused", "লাভ", "মুনাফা"} else (
            "water" if priority in {"water", "water_efficiency", "পানি", "পানি সাশ্রয়"} else (
                "soil" if priority in {"soil", "soil_health", "মাটি", "মাটির স্বাস্থ্য"} else "balanced"
            )
        )
        all_strat_plans = {}
        for s_key, (pw, ww, sw, nw) in strategy_weights_map.items():
            if s_key == canonical_priority:
                all_strat_plans[s_key] = milp_res
            else:
                all_strat_plans[s_key] = optimize_rotation(
                    field_state=f_state,
                    crops=crops,
                    environmental_history=climate_df,
                    profit_weight=pw,
                    water_weight=ww,
                    soil_weight=sw,
                    national_need_weight=nw,
                    allow_kharif2_fallow=allow_k2_fallow,
                    min_cereals_per_year=int(data.get("min_cereals_per_year", 1)),
                    seasonally_flooded=bool(is_haor),
                    field_history_crops=hist_crops_param,
                    field_history_records=history_records if saved_field_record else (data.get("field_history_records") or data.get("crop_history") or []),
                    existing_rotation=existing_rotation,
                    existing_rotation_source=existing_rotation_source,
                    existing_rotation_year=existing_rotation_year,
                    excluded_crops=([c for c in data.get("excluded_crops", []) if c] + (["Potato"] if data.get("no_power_tiller") and "Potato" not in data.get("excluded_crops", []) else [])) or None,
                )

        strategy_ranking = score_and_rank_strategies(
            all_strat_plans,
            irrigation_capacity_mm=data.get("irrigation_capacity_mm"),
        )
        milp_res["best_strategy"] = strategy_ranking["best_strategy"]
        milp_res["best_reason"] = strategy_ranking["best_reason_bn"]
        milp_res["best_reason_bn"] = strategy_ranking["best_reason_bn"]
        milp_res["best_reason_en"] = strategy_ranking["best_reason_en"]
        milp_res["identical_strategy_note_bn"] = strategy_ranking["identical_strategy_note_bn"]
        milp_res["identical_strategy_note_en"] = strategy_ranking["identical_strategy_note_en"]
        milp_res["strategy_recommendation"] = strategy_ranking

        final_resp = finite_json_value(jsonable_encoder({
            "status": "ok",
            "best_strategy": strategy_ranking["best_strategy"],
            "best_reason": strategy_ranking["best_reason_bn"],
            "best_reason_bn": strategy_ranking["best_reason_bn"],
            "best_reason_en": strategy_ranking["best_reason_en"],
            "strategy_recommendation": strategy_ranking,
            "mode": data_mode or "offline",
            "climate_source": {
                "dataset": "NASA POWER",
                "data_type": "remote_gridded_observations",
                "district": dist_key,
                "data_mode": data_mode or "offline",
                "year_count": len(observed_years),
                "years": (
                    f"{observed_years[0]}-{observed_years[-1]}"
                    if observed_years
                    else None
                ),
                "time_range": time_range,
                "environment_basis": env_basis,
            },
            "environment_basis": env_basis,
            "risk": risk_suite,
            "summary": {
                "field_state": {
                    "field_id": field_id,
                    "latitude": lat,
                    "longitude": lon,
                    "field_size_ha": area_val if math.isfinite(area_val) else None,
                    "area_ha": area_val if math.isfinite(area_val) else None,
                    "area_source": (
                        "registered_field_or_request"
                        if math.isfinite(area_val)
                        else "unavailable"
                    ),
                    "soil_texture": data.get("soil_texture") or getattr(f_state, "texture", "loam"),
                    "organic_matter_percent": float(data["organic_matter"]) if data.get("organic_matter") is not None else (float(f_state.organic_matter) if math.isfinite(f_state.organic_matter) else None),
                    "soil_ph": float(data["soil_ph"]) if data.get("soil_ph") is not None else (float(f_state.ph) if math.isfinite(f_state.ph) else None),
                    "irrigation_capacity_mm": data.get("irrigation_capacity_mm"),
                    "coordinates_source": "field_coordinates" if field_coordinates_supplied else "district_reference_coordinates",
                    "field_data_sources": {
                        "coordinates": (
                            "registered_field"
                            if saved_field_record and field_coordinates_supplied
                            else "request_input"
                            if field_coordinates_supplied
                            else "district_reference_coordinates"
                        ),
                        "area": (
                            "registered_field"
                            if saved_field_record and math.isfinite(area_val)
                            else "request_input"
                            if math.isfinite(area_val)
                            else "unavailable"
                        ),
                        "soil_texture": (
                            "request_input"
                            if request_inputs.get("soil_texture") not in (None, "", "unknown")
                            else "registered_field"
                            if saved_field_record and getattr(field_record, "soil_texture", None)
                            else getattr(f_state, "soil_source", "unavailable")
                            if getattr(f_state, "soil_source", "missing") != "missing"
                            else "unavailable"
                        ),
                        "soil_ph": (
                            "request_input"
                            if request_inputs.get("soil_ph") is not None
                            else "registered_field"
                            if saved_field_record and getattr(field_record, "soil_ph", None) is not None
                            else getattr(f_state, "soil_source", "unavailable")
                            if math.isfinite(float(getattr(f_state, "ph", float("nan"))))
                            else "unavailable"
                        ),
                        "organic_matter": (
                            "request_input"
                            if request_inputs.get("organic_matter") is not None
                            else "registered_field"
                            if saved_field_record and getattr(field_record, "organic_matter", None) is not None
                            else getattr(f_state, "soil_source", "unavailable")
                            if math.isfinite(float(getattr(f_state, "organic_matter", float("nan"))))
                            else "unavailable"
                        ),
                        "irrigation_capacity": (
                            "request_input"
                            if request_inputs.get("irrigation_capacity_mm") is not None
                            else "registered_field"
                            if saved_field_record and getattr(field_record, "irrigation_capacity_mm", None) is not None
                            else "assumption_when_missing"
                        ),
                        "soil_moisture": {
                            "source": getattr(f_state, "soil_moisture_source", "missing"),
                            "status": getattr(f_state, "data_status", {}).get("soil_moisture", "missing"),
                            "observation_date": (
                                str(f_state.soil_moisture_observation_date)
                                if getattr(f_state, "soil_moisture_observation_date", None) is not None
                                else None
                            ),
                        },
                        "rotation_baseline": {
                            "source": (milp_res.get("baseline_comparison") or {}).get("baseline_source"),
                            "completeness": (milp_res.get("baseline_comparison") or {}).get("baseline_completeness"),
                            "historical_year": (milp_res.get("baseline_comparison") or {}).get("baseline_historical_period"),
                        },
                    },
                    "temperature_c": getattr(f_state, "temperature", None),
                    "rainfall_mm": getattr(f_state, "rainfall", None),
                },
                "planning": {
                    "selected_strategy": priority,
                    "best_strategy": strategy_ranking["best_strategy"],
                    "best_reason": strategy_ranking["best_reason_bn"],
                    "best_reason_bn": strategy_ranking["best_reason_bn"],
                    "best_reason_en": strategy_ranking["best_reason_en"],
                    "identical_strategy_note_bn": strategy_ranking["identical_strategy_note_bn"],
                    "identical_strategy_note_en": strategy_ranking["identical_strategy_note_en"],
                    "strategy_recommendation": strategy_ranking,
                    "milp_status": milp_res,
                    "environment_basis": env_basis,
                    "selected_strategy_result": milp_res,
                    "baseline_comparison": milp_res.get("baseline_comparison", {}),
                    "baseline_seasons": (milp_res.get("baseline_comparison") or {}).get("baseline_seasons", []),
                    "baseline_irrigation_mm": milp_res.get("baseline_irrigation_mm"),
                    "plan_irrigation_mm": milp_res.get("plan_irrigation_mm"),
                    "water_savings_mm": milp_res.get("water_savings_mm"),
                    "baseline_profit_bdt": milp_res.get("baseline_profit_bdt"),
                    "plan_profit_bdt": milp_res.get("plan_profit_bdt"),
                    "profit_delta_bdt": milp_res.get("profit_delta_bdt"),
                    "baseline_profit_source": milp_res.get("baseline_profit_source"),
                    "baseline_profit_source_bn": milp_res.get("baseline_profit_source_bn"),
                    "baseline_profit_source_en": milp_res.get("baseline_profit_source_en"),
                    "yield_calibration": milp_res.get("yield_calibration"),
                    "baseline_nitrogen_kg": milp_res.get("baseline_nitrogen_kg"),
                    "plan_nitrogen_kg": milp_res.get("plan_nitrogen_kg"),
                    "nitrogen_delta_kg": milp_res.get("nitrogen_delta_kg"),
                    "baseline_rotation": milp_res.get("baseline_rotation"),
                    "baseline_rotation_text_bn": milp_res.get("baseline_rotation_text_bn"),
                    "baseline_rotation_text_en": milp_res.get("baseline_rotation_text_en"),
                    "is_assumed_baseline": milp_res.get("is_assumed_baseline"),
                    "unapplied_farmer_constraints": unapplied_farmer_constraints,
                    "baseline_bare_days": milp_res.get("baseline_bare_days"),
                    "plan_bare_days": milp_res.get("plan_bare_days"),
                    "risk": risk_suite,
                }
            }
        }))
        _PLANNING_CACHE[cache_key] = final_resp
        return final_resp

    resp = workflow_result(data, user=user_dict)
    milp_st = resp.get("summary", {}).get("planning", {}).get("milp_status", {})
    env_basis = milp_st.get("environment_basis", "default_no_history")
    resp["environment_basis"] = env_basis
    if "summary" in resp and "planning" in resp["summary"]:
        resp["summary"]["planning"]["environment_basis"] = env_basis
    return resp

@app.post("/api/planning/robustness")
def planning_robustness(payload: Payload):
    data = payload.model_dump()
    rotation = data.get("rotation") or data.get("milp_status") or data.get("selected_crop_by_period")
    if not rotation:
        raise HTTPException(400, "Missing 'rotation' in request body.")
    district = data.get("district")
    area_value = data.get("area_ha") if data.get("area_ha") is not None else data.get("field_size_ha")
    lat_value = data.get("latitude")
    lon_value = data.get("longitude")
    if area_value is None:
        raise HTTPException(422, "Field area is required for rotation robustness analysis.")
    if (lat_value is None) != (lon_value is None):
        raise HTTPException(422, "Latitude and longitude must be provided together.")
    try:
        area_ha = float(area_value)
        lat = float(lat_value) if lat_value is not None else None
        lon = float(lon_value) if lon_value is not None else None
    except (TypeError, ValueError) as error:
        raise HTTPException(422, "Field area and coordinates must be valid numbers.") from error
    if not math.isfinite(area_ha) or area_ha <= 0:
        raise HTTPException(422, "Field area must be a positive number.")
    if lat is not None and (
        not math.isfinite(lat) or not -90 <= lat <= 90
        or not math.isfinite(lon) or not -180 <= lon <= 180
    ):
        raise HTTPException(422, "Field coordinates are outside the supported range.")
    from src.compute.advisory_service import DISTRICT_REGISTRY, nearest_district
    if not district and lat is not None and lon is not None:
        district = nearest_district(lat, lon)
    if not isinstance(district, str) or district.strip().lower() not in DISTRICT_REGISTRY:
        raise HTTPException(422, "Provide a supported district or valid field coordinates.")
    district = district.strip().lower()

    from src.optimizer.robustness import evaluate_rotation_robustness
    try:
        result = evaluate_rotation_robustness(
            rotation=rotation,
            district=district,
            area_ha=area_ha,
            latitude=lat,
            longitude=lon,
        )
        return finite_json_value(jsonable_encoder(result))
    except Exception as exc:
        raise HTTPException(500, f"Failed to compute robustness distribution: {str(exc)}") from exc

@app.get("/api/water/plan")
def api_water_plan(
    district: str | None = None,
    crop: str | None = None,
    area_ha: float | None = None,
    lat: float | None = None,
    lon: float | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    field_id: str | None = None,
):
    from src.compute.water_service import compute_water_plan
    from src.compute.advisory_service import DISTRICT_REGISTRY

    actual_lat = lat if lat is not None else latitude
    actual_lon = lon if lon is not None else longitude
    if (actual_lat is None) != (actual_lon is None):
        raise HTTPException(422, "Latitude and longitude must be provided together.")
    if not district and (actual_lat is None or actual_lon is None):
        raise HTTPException(422, "A district or field coordinates are required for a water plan.")
    if not crop or not crop.strip():
        crop = "Rice"
    if area_ha is None or not math.isfinite(area_ha) or area_ha <= 0:
        area_ha = 1.0
    if actual_lat is not None and (
        not math.isfinite(actual_lat) or not -90 <= actual_lat <= 90
        or not math.isfinite(actual_lon) or not -180 <= actual_lon <= 180
    ):
        raise HTTPException(422, "Field coordinates are outside the supported range.")
    if district:
        district = district.strip().lower()
        if district not in DISTRICT_REGISTRY:
            raise HTTPException(422, "District is not supported.")
    if not district:
        district = nearest_district(actual_lat, actual_lon)

    try:
        result = compute_water_plan(
            district=district,
            crop=crop.strip(),
            area_ha=area_ha,
            latitude=actual_lat,
            longitude=actual_lon,
        )
        return finite_json_value(jsonable_encoder(result))
    except Exception as exc:
        raise HTTPException(500, f"Water plan computation failed: {str(exc)}") from exc

@app.post("/api/counterfactual/reoptimize")
def counterfactual_reoptimize(
    payload: Payload,
    fieldshift_session: str | None = Cookie(None),
    db: DbSession = Depends(get_db),
):
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
            field_id = int(requested_field_id)
        except (ValueError, TypeError) as error:
            raise HTTPException(
                400, "field_id must identify a registered PostgreSQL field."
            ) from error
        data = use_field_record(data, owned_field(db, field_id, user), db)
    elif "area_ha" in data and data.get("field_size_ha") in (None, ""):
        data["field_size_ha"] = data["area_ha"]
    data["counterfactual_only"] = True

    try:
        body = workflow_result(data, user=public_user(user) if user else None)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            502, f"PuLP/CBC re-optimization failed: {error}"
        ) from error

    result = (body.get("summary") or {}).get("counterfactual_milp")
    if not isinstance(result, dict):
        raise HTTPException(
            502, "Counterfactual workflow returned no MILP result."
        )
    return finite_json_value(jsonable_encoder(result))

@app.post("/api/location/weather")
def location_weather(payload: Payload):
    _location_weather = legacy_workflow_module()._location_weather
    data = payload.model_dump()
    try:
        res = _location_weather(data)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except RuntimeError as e:
        raise HTTPException(502, str(e))

    try:
        lat = float(data["latitude"])
        lon = float(data["longitude"])
        import pandas as pd
        dist_key = data.get("district")
        from src.compute.advisory_service import nearest_district, load_district_climate_data
        if not dist_key or not str(dist_key).strip():
            dist_key = nearest_district(lat, lon)
        else:
            dist_key = str(dist_key).strip().lower()
        df, mode = load_district_climate_data(dist_key, offline=True)
        tail_30 = df.tail(30).copy()

        def rounded_value(row: Any, key: str, digits: int) -> float | None:
            value = row.get(key)
            if value is None or pd.isna(value):
                return None
            try:
                number = float(value)
            except (TypeError, ValueError):
                return None
            return round(number, digits) if math.isfinite(number) else None

        def aggregate_value(key: str, operation: str, digits: int) -> float | None:
            if key not in tail_30.columns:
                return None
            values = pd.to_numeric(tail_30[key], errors="coerce").dropna()
            if values.empty:
                return None
            value = values.sum() if operation == "sum" else values.mean()
            return round(float(value), digits)

        series = []
        for _, row in tail_30.iterrows():
            d_str = str(row.get("date", ""))[:10]
            series.append({
                "date": d_str,
                "temperature": rounded_value(row, "temperature", 1),
                "temp_max": rounded_value(row, "temp_max", 1),
                "temp_min": rounded_value(row, "temp_min", 1),
                "rainfall": rounded_value(row, "rainfall", 2),
                "humidity": rounded_value(row, "humidity", 1),
                "wind_speed": rounded_value(row, "wind_speed", 2),
                "solar_radiation": rounded_value(row, "solar_radiation", 2),
            })
        dates = [item["date"] for item in series if item["date"]]
        summary = {
            "temperature": rounded_value(tail_30.iloc[-1], "temperature", 1) if not tail_30.empty else None,
            "temp_max": aggregate_value("temp_max", "mean", 1),
            "temp_min": aggregate_value("temp_min", "mean", 1),
            "humidity": aggregate_value("humidity", "mean", 1),
            "wind_speed": aggregate_value("wind_speed", "mean", 2),
            "rainfall": aggregate_value("rainfall", "sum", 2),
            "start_date": dates[0] if dates else None,
            "latest_valid_date": dates[-1] if dates else None,
            "rows": len(series),
        }
        res["series"] = series
        res["summary"] = summary
        res["district"] = dist_key
        if "weather" in res and isinstance(res["weather"], dict):
            res["weather"]["series"] = series
            res["weather"]["summary"] = summary
            res["weather"]["temperature_c"] = summary["temperature"]
            res["weather"]["temp_max_c"] = summary["temp_max"]
            res["weather"]["temp_min_c"] = summary["temp_min"]
            res["weather"]["observation_date"] = summary["latest_valid_date"]
    except Exception as err:
        logger.warning(f"Failed enriching location_weather: {err}")

    return res

@app.get("/api/crops")
def crops():
    from src.data.crops import load_crop_knowledge
    return {"status":"ok","crops":load_crop_knowledge().to_dict(orient="records")}

@app.get("/api/crops/catalog")
def crops_catalog():
    from src.data.bangladesh_crops import get_crop_catalog_with_provenance, BANGLADESH_AGRICULTURAL_SOURCES
    catalog = get_crop_catalog_with_provenance()
    sources = [
        {
            "source_code": s.get("code", k),
            "title": s.get("title", ""),
            "year": s.get("year", 2024),
            "geographic_relevance": s.get("relevance", "Bangladesh AEZ 1-30"),
            "role": s.get("role", "Authoritative Agronomic Reference"),
        }
        for k, s in BANGLADESH_AGRICULTURAL_SOURCES.items()
    ]
    return {
        "status": "ok",
        "total_crops": len(catalog),
        "crops": catalog,
        "sources": sources,
        "disclaimer": (
            "Crop parameters are calibrated from authoritative BARI, BRRI, BBS, and DAE publications. "
            "Demo defaults are explicitly designated where plot-level sensor calibration is unavailable."
        ),
    }


# -----------------------------------------------------------------------------
# OFFICIAL NASA PLANTING-WINDOW ADVISORY ENDPOINT
# -----------------------------------------------------------------------------

@app.get("/api/advisory")
def get_planting_advisory(
    district: str = "rajshahi",
    crop: str = "aman",
    threshold_mm: float = 25.0,
    dry_spell_window: int = 21,
    dry_spell_max: int = 7,
    offline: bool = False,
    lang: str = "bn",
):
    """Return mobile-first planting window advisory based on NASA observations."""
    from src.compute.advisory_service import build_planting_advisory
    try:
        result = build_planting_advisory(
            district=district,
            crop=crop,
            threshold_mm=threshold_mm,
            dry_spell_window_days=dry_spell_window,
            dry_spell_max_consecutive_days=dry_spell_max,
            offline=offline,
            lang=lang,
        )
        return finite_json_value(jsonable_encoder(result))
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Error generating planting advisory: {str(e)}")


@app.get("/api/advisory/districts")
def get_advisory_districts():
    """Return supported Bangladesh agricultural districts with coordinates."""
    from src.compute.advisory_service import get_supported_districts
    return {"status": "ok", "districts": get_supported_districts()}


@app.get("/api/advisory/onset-comparison")
def get_advisory_onset_comparison():
    """Return all-64-district dual onset analysis with Benjamini-Hochberg FDR control."""
    onset_file = ROOT_DIR / "data" / "onset_analysis_64.json"
    if onset_file.exists():
        import json
        with open(onset_file, "r", encoding="utf-8") as f:
            return json.load(f)
    from scripts.compute_onset_64 import analyze_all_64_districts
    records = analyze_all_64_districts()
    return {"districts": records}


@app.get("/api/satellite/readiness")
def satellite_readiness(latitude: float | None = None, longitude: float | None = None, lat: float | None = None, lon: float | None = None):
    from src.data.bangladesh_crops import get_satellite_readiness_status
    actual_lat = lat if lat is not None else latitude
    actual_lon = lon if lon is not None else longitude
    if actual_lat is None or actual_lon is None:
        raise HTTPException(422, "Field coordinates are required for location-specific satellite readiness.")
    if (
        not math.isfinite(actual_lat) or not -90 <= actual_lat <= 90
        or not math.isfinite(actual_lon) or not -180 <= actual_lon <= 180
    ):
        raise HTTPException(422, "Field coordinates are outside the supported range.")
    data = get_satellite_readiness_status(actual_lat, actual_lon)
    data["sensors"] = [
        {
            "sensor_id": c["sensor_id"],
            "sensor_name": c["name"],
            "status": "CONNECTED" if c["status"] == "connected_live" else ("STANDBY" if "ready" in c["status"] else "NOT CONNECTED"),
            "intended_measurement": c.get("data_assurance", c.get("agency", "")),
            "spatial_resolution": c.get("spatial_resolution", ""),
            "cadence": c.get("temporal_resolution", ""),
            "parameters": ", ".join(p["code"] for p in c.get("parameters", [])),
            "prerequisites": c.get("blocker_details", "None required; operational."),
        }
        for c in data.get("connectors", [])
    ]
    data["disclaimer"] = data.get("scientific_integrity_policy", "")
    return finite_json_value(jsonable_encoder(data))

@app.post("/api/lab/compare")
def lab_compare(payload: Payload, fieldshift_session: str | None = Cookie(None), db: DbSession = Depends(get_db)):
    data = payload.model_dump()
    request_inputs = dict(data)
    from src.state.field_state import build_field_state
    from src.data.crops import load_crop_knowledge
    from src.preprocessing.features import build_features
    from src.integration.comparison_lab import run_three_way_comparison
    from src.compute.advisory_service import load_district_climate_data, DISTRICT_REGISTRY, nearest_district
    import pandas as pd

    user = None
    saved_field_record = False
    if fieldshift_session:
        try:
            user = require_user(fieldshift_session, db)
        except HTTPException:
            user = None

    requested_field_id = data.get("field_id")
    if requested_field_id not in (None, "", "demo"):
        try:
            fid = int(requested_field_id)
        except (ValueError, TypeError):
            fid = None
        if fid is not None:
            if user is None:
                raise HTTPException(401, "Sign in to compare a registered field.")
            field_record = owned_field(db, fid, user)
            planning_overrides = {
                key: data[key]
                for key in ("soil_texture", "soil_ph", "organic_matter", "irrigation_capacity_mm")
                if key in data
            }
            data = use_field_record(data, field_record, db)
            data.update(planning_overrides)
            saved_field_record = True

    lat_val = data.get("latitude")
    lon_val = data.get("longitude")
    if (lat_val is None) != (lon_val is None):
        raise HTTPException(422, "Latitude and longitude must be provided together.")
    if lat_val is not None:
        try:
            lat_val = float(lat_val)
            lon_val = float(lon_val)
        except (TypeError, ValueError) as error:
            raise HTTPException(422, "Field coordinates must be valid numbers.") from error
        if (
            not math.isfinite(lat_val) or not -90 <= lat_val <= 90
            or not math.isfinite(lon_val) or not -180 <= lon_val <= 180
        ):
            raise HTTPException(422, "Field coordinates are outside the supported range.")
    district = data.get("district")
    if lat_val is not None:
        data["latitude"] = _validated_optional_number(data, "latitude", minimum=-90.0, maximum=90.0)
    if lon_val is not None:
        data["longitude"] = _validated_optional_number(data, "longitude", minimum=-180.0, maximum=180.0)
    for key, minimum, maximum in (
        ("area_ha", 0.000001, None),
        ("field_size_ha", 0.000001, None),
        ("soil_ph", 0.0, 14.0),
        ("organic_matter", 0.0, 100.0),
        ("irrigation_capacity_mm", 0.0, None),
        ("available_water_mm", 0.0, None),
    ):
        validated = _validated_optional_number(data, key, minimum=minimum, maximum=maximum)
        if validated is not None:
            data[key] = validated

    if not district and lat_val is not None and lon_val is not None:
        try:
            district = nearest_district(float(lat_val), float(lon_val))
        except ValueError as error:
            raise HTTPException(400, "Could not resolve a supported district from the supplied coordinates.") from error
    if not district or str(district).strip().lower() not in DISTRICT_REGISTRY:
        raise HTTPException(400, "A supported district or valid field coordinates are required.")

    dist_key = str(district).strip().lower()
    is_offline = os.environ.get("OFFLINE", "1") == "1"
    try:
        power, data_mode = load_district_climate_data(dist_key, offline=is_offline)
    except (ValueError, FileNotFoundError, RuntimeError) as error:
        raise HTTPException(502, f"Could not load climate data for {dist_key}: {error}") from error
    if "date" in power.columns:
        power["date"] = pd.to_datetime(power["date"])

    if saved_field_record:
        decision_year = int(power["date"].max().year) if "date" in power.columns and not power.empty else datetime.now().year
        eligible_history = []
        for record in data.get("_saved_field_history") or []:
            try:
                prior_year = int(record.get("year"))
            except (AttributeError, TypeError, ValueError):
                continue
            if prior_year < decision_year:
                eligible_history.append(record)
        if eligible_history:
            data["previous_crop"] = eligible_history[0].get("crop") or ""
            data["previous_crop_year"] = eligible_history[0].get("year")
        else:
            data["previous_crop"] = ""
            data["previous_crop_year"] = ""

    existing_rotation = data.get("existing_rotation")
    existing_rotation_source = None
    existing_rotation_year = None
    if saved_field_record:
        complete_profile = (
            isinstance(existing_rotation, dict)
            and all(existing_rotation.get(key) or existing_rotation.get(alias) for key, alias in (
                ("rabi", "S1"),
                ("kharif1", "S2"),
                ("kharif2", "S3"),
            ))
        )
        if complete_profile:
            existing_rotation_source = "saved_field_rotation"
        else:
            decision_year = (
                int(power["date"].max().year)
                if "date" in power.columns and not power.empty
                else datetime.now().year
            )
            saved_history_rotation = complete_saved_history_rotation(
                data.get("_saved_field_history"),
                before_year=decision_year,
            )
            if saved_history_rotation is not None:
                existing_rotation, existing_rotation_year = saved_history_rotation
                existing_rotation_source = "saved_field_history"

    lat = float(data["latitude"] if data.get("latitude") is not None else (DISTRICT_REGISTRY[dist_key].get("latitude") or DISTRICT_REGISTRY[dist_key].get("lat")))
    lon = float(data["longitude"] if data.get("longitude") is not None else (DISTRICT_REGISTRY[dist_key].get("longitude") or DISTRICT_REGISTRY[dist_key].get("lon")))
    priority = str(data.get("strategy") or data.get("priority") or "balanced")

    crops_df = load_crop_knowledge()
    field_coordinates_supplied = data.get("latitude") is not None and data.get("longitude") is not None
    if field_coordinates_supplied:
        smap_data = None
    else:
        from src.data.smap import SMAP_COLUMNS
        smap_data = pd.DataFrame(columns=SMAP_COLUMNS)
    state = build_field_state(
        str(data.get("field_id") or "demo"),
        lat,
        lon,
        power["date"].max(),
        power,
        smap_data=smap_data,
        crop_knowledge=crops_df,
    )
    area_input = data.get("field_size_ha")
    if area_input is None:
        area_input = data.get("area_ha")
    field_area_ha = float(area_input) if area_input is not None else None
    state.field_size_ha = field_area_ha if field_area_ha is not None else float("nan")
    state.area_ha = state.field_size_ha
    if data.get("previous_crop"):
        state.previous_crop = str(data["previous_crop"])
        state.previous_crop_year = data.get("previous_crop_year")
    if data.get("soil_ph") is not None: state.ph = float(data["soil_ph"])
    if data.get("organic_matter") is not None: state.organic_matter = float(data["organic_matter"])
    if data.get("temperature_c") is not None: state.temperature = float(data["temperature_c"])
    if data.get("irrigation_capacity_mm") is not None: state.irrigation_capacity_mm = float(data["irrigation_capacity_mm"])
    if data.get("soil_texture") not in (None, "", "unknown"):
        state.texture = str(data["soil_texture"])
    elif dist_key in DISTRICT_REGISTRY:
        state.texture = DISTRICT_REGISTRY[dist_key].get("soil_type", "loam")

    is_haor = data.get("seasonally_flooded")
    if is_haor is None:
        is_haor = dist_key in {"sunamganj", "netrokona", "kishoreganj", "habiganj", "moulvibazar"}
    state.seasonally_flooded = bool(is_haor)

    features = build_features(state, environmental_history=power)
    if data.get("available_water_mm") is not None:
        features["available_water_mm"] = float(data["available_water_mm"])

    result = run_three_way_comparison(
        state,
        power,
        crops=crops_df,
        features=features,
        priority=priority,
        existing_rotation=existing_rotation if saved_field_record else None,
        existing_rotation_source=existing_rotation_source,
        existing_rotation_year=existing_rotation_year,
    )
    result["district"] = dist_key
    observed_years = sorted(
        int(year) for year in power["date"].dt.year.dropna().unique()
    ) if "date" in power.columns else []
    result["climate_source"] = {
        "dataset": "NASA POWER",
        "data_type": "remote_gridded_observations",
        "district": dist_key,
        "mode": data_mode,
        "year_count": len(observed_years),
        "years": f"{observed_years[0]}-{observed_years[-1]}" if observed_years else None,
        "time_range": (
            [str(power["date"].min().date()), str(power["date"].max().date())]
            if "date" in power.columns and not power.empty
            else None
        ),
    }
    result["field_context"] = {
        "coordinates_source": (
            "registered_field"
            if saved_field_record and field_coordinates_supplied
            else "request_input"
            if field_coordinates_supplied
            else "district_reference_coordinates"
        ),
        "area_source": (
            "registered_field"
            if saved_field_record and field_area_ha is not None
            else "request_input"
            if request_inputs.get("field_size_ha") is not None or request_inputs.get("area_ha") is not None
            else "unavailable"
        ),
        "soil_sources": {
            "texture": (
                "request_input" if request_inputs.get("soil_texture") not in (None, "", "unknown")
                else "registered_field" if saved_field_record and data.get("soil_texture") not in (None, "", "unknown")
                else "district_reference"
            ),
            "pH": (
                "request_input" if request_inputs.get("soil_ph") is not None
                else "registered_field" if saved_field_record and data.get("soil_ph") is not None
                else "unavailable"
            ),
            "organic_matter": (
                "request_input" if request_inputs.get("organic_matter") is not None
                else "registered_field" if saved_field_record and data.get("organic_matter") is not None
                else "unavailable"
            ),
            "irrigation_capacity": (
                "request_input" if request_inputs.get("irrigation_capacity_mm") is not None
                else "registered_field" if saved_field_record and data.get("irrigation_capacity_mm") is not None
                else "unavailable"
            ),
        },
    }
    return finite_json_value(jsonable_encoder(result))

@app.post("/api/scenarios/crop-failure-recovery")
def crop_failure_recovery(payload: Payload):
    data = payload.model_dump()
    from src.experiments.integrated_research_demo import DEFAULT_NASA_PATH
    from src.state.field_state import build_field_state
    from src.data.crops import load_crop_knowledge
    from src.preprocessing.features import build_features
    from src.scenarios.recovery_simulator import simulate_crop_failure_and_recovery
    import pandas as pd

    fs = data.get("field_state") or {}
    latitude = data.get("latitude") if data.get("latitude") is not None else fs.get("latitude")
    longitude = data.get("longitude") if data.get("longitude") is not None else fs.get("longitude")
    area = data.get("field_size_ha")
    if area is None:
        area = fs.get("field_size_ha", data.get("area_ha", fs.get("area_ha")))
    try:
        lat = float(latitude)
        lon = float(longitude)
        field_area_ha = float(area)
    except (TypeError, ValueError) as error:
        raise HTTPException(422, "Valid field coordinates and area are required for crop-failure recovery.") from error
    if (
        not math.isfinite(lat) or not -90 <= lat <= 90
        or not math.isfinite(lon) or not -180 <= lon <= 180
        or not math.isfinite(field_area_ha) or field_area_ha <= 0
    ):
        raise HTTPException(422, "Field coordinates or area are outside the supported range.")
    failure_event = str(data.get("failure_event") or data.get("failure_type") or "crop_failure")
    impacted_season_index = int(data.get("impacted_season_index") if data.get("impacted_season_index") is not None else data.get("failure_season", 0))
    severity = str(data.get("severity") or "severe")
    priority = str(data.get("strategy") or data.get("priority") or "balanced")

    power = pd.read_csv(DEFAULT_NASA_PATH)
    power["date"] = pd.to_datetime(power["date"])
    crops_df = load_crop_knowledge()
    state = build_field_state(str(data.get("field_id") or "demo"), lat, lon, power["date"].max(), power, crop_knowledge=crops_df)
    state.field_size_ha = field_area_ha
    state.area_ha = state.field_size_ha
    if data.get("soil_ph") or fs.get("soil_ph"): state.ph = float(data.get("soil_ph") or fs.get("soil_ph"))
    if data.get("organic_matter") or fs.get("organic_matter"): state.organic_matter = float(data.get("organic_matter") or fs.get("organic_matter"))
    if data.get("irrigation_capacity_mm") or fs.get("irrigation_capacity_mm"): state.irrigation_capacity_mm = float(data.get("irrigation_capacity_mm") or fs.get("irrigation_capacity_mm"))
    features = build_features(state, environmental_history=power)

    result = simulate_crop_failure_and_recovery(
        state, power,
        failure_event=failure_event,
        impacted_season_index=impacted_season_index,
        severity=severity,
        crops=crops_df,
        features=features,
        priority=priority,
    )
    return finite_json_value(jsonable_encoder(result))

@app.post("/api/workflow/replan")
def workflow_replan(payload: Payload, fieldshift_session: str | None = Cookie(None), db: DbSession = Depends(get_db)):
    data = payload.model_dump()
    from src.state.field_state import build_field_state
    from src.data.crops import load_crop_knowledge
    from src.preprocessing.features import build_features
    from src.optimizer.adaptive_replan import run_adaptive_replan
    from src.compute.advisory_service import load_district_climate_data, DISTRICT_REGISTRY, nearest_district
    import pandas as pd

    user = None
    if fieldshift_session:
        try:
            user = require_user(fieldshift_session, db)
        except HTTPException:
            user = None

    requested_field_id = data.get("field_id")
    if requested_field_id not in (None, "", "demo") and user is not None:
        try:
            fid = int(requested_field_id)
            field_record = owned_field(db, fid, user)
            data = use_field_record(data, field_record, db)
        except Exception:
            pass

    lat_val = data.get("latitude")
    lon_val = data.get("longitude")
    district = data.get("district")
    location_source = "farmer-provided coordinates"
    if not district and lat_val is not None and lon_val is not None:
        try:
            district = nearest_district(float(lat_val), float(lon_val))
        except Exception as error:
            raise HTTPException(422, "Unable to resolve a district from the supplied coordinates.") from error
    elif district:
        location_source = "farmer-provided district"
    if not district and str(requested_field_id or "").lower() in {"demo", "demo_field", "field_demo", "0"}:
        district = "bogura"
        location_source = "assumed demo district reference"
    if not district or str(district).strip().lower() not in DISTRICT_REGISTRY:
        raise HTTPException(422, "Provide valid field coordinates or a supported district.")

    dist_key = str(district).strip().lower()
    is_offline = os.environ.get("OFFLINE", "1") == "1"
    try:
        power, data_mode = load_district_climate_data(dist_key, offline=is_offline)
    except Exception:
        from src.experiments.integrated_research_demo import DEFAULT_NASA_PATH
        power = pd.read_csv(DEFAULT_NASA_PATH)
    if "date" in power.columns:
        power["date"] = pd.to_datetime(power["date"])

    district_meta = DISTRICT_REGISTRY[dist_key]
    reference_lat = district_meta.get("latitude", district_meta.get("lat"))
    reference_lon = district_meta.get("longitude", district_meta.get("lon"))
    if lat_val is None:
        lat_val = reference_lat
        location_source = "district reference centroid" if location_source != "assumed demo district reference" else location_source
    if lon_val is None:
        lon_val = reference_lon
    try:
        lat = float(lat_val)
        lon = float(lon_val)
    except (TypeError, ValueError) as error:
        raise HTTPException(422, "The selected district does not have valid reference coordinates.") from error
    area_value = data.get("field_size_ha", data.get("area_ha"))
    if area_value is None and str(requested_field_id or "").lower() in {"demo", "demo_field", "field_demo", "0"}:
        area_value = 1.0
    if area_value is None:
        raise HTTPException(422, "Field area is required for adaptive replanning.")
    try:
        field_area_ha = float(area_value)
    except (TypeError, ValueError) as error:
        raise HTTPException(422, "Field area must be a positive number.") from error
    if not math.isfinite(field_area_ha) or field_area_ha <= 0:
        raise HTTPException(422, "Field area must be a positive number.")

    raw_completed = data.get("finished_seasons") or data.get("completed_seasons") or data.get("completed_seasons_history") or []
    if isinstance(raw_completed, int):
        last_crop = data.get("last_season_crop")
        if not isinstance(raw_completed, bool) and isinstance(last_crop, str) and last_crop.strip() and raw_completed == 1:
            completed_seasons = [{
                "period": "Y1_S1",
                "crop": last_crop.strip(),
                "crop_planted": last_crop.strip(),
            }]
        elif raw_completed == 0:
            completed_seasons = []
        else:
            raise HTTPException(422, "Provide each completed season with its crop; a count cannot represent crop history.")
    elif isinstance(raw_completed, list):
        completed_seasons = []
        for i, item in enumerate(raw_completed):
            if not isinstance(item, dict):
                raise HTTPException(422, f"Completed season {i + 1} must be a recorded season object.")
            parts = item.get("parts") or item.get("part_split") or []
            crop_name = item.get("crop") or item.get("crop_planted") or item.get("crop_name")
            if not crop_name and parts and isinstance(parts, list):
                crop_name = parts[0].get("crop")
            if not isinstance(crop_name, str) or not crop_name.strip():
                raise HTTPException(422, f"Completed season {i + 1} must include its recorded crop.")
            canonical_period = f"Y{1 + (i // 3)}_S{1 + (i % 3)}"
            completed_seasons.append({
                "period": item.get("period") or canonical_period,
                "crop": crop_name.strip(),
                "crop_planted": crop_name.strip(),
                "parts": parts,
                "yield_maund_bigha": item.get("yield_maund_bigha", item.get("yield")),
                "sale_price_bdt_maund": item.get("sale_price_bdt_maund", item.get("price_bdt_maund", item.get("sale_price", item.get("price")))),
                "yield_kg_ha": item.get("yield_kg_ha"),
                "actual_yield_t_ha": (float(item["yield_kg_ha"]) / 1000.0) if item.get("yield_kg_ha") is not None else item.get("actual_yield_t_ha"),
                "actual_water_mm": item.get("water_applied_mm") or item.get("actual_water_mm"),
                "outcome": item.get("outcome", "normal"),
            })
    else:
        completed_seasons = []

    updated_field_conditions = data.get("updated_field_conditions") or data.get("updated_conditions") or {}
    priority = str(data.get("strategy") or data.get("priority") or "balanced")

    crops_df = load_crop_knowledge()
    state = build_field_state(str(data.get("field_id") or "demo"), lat, lon, power["date"].max(), power.tail(60), crop_knowledge=crops_df)
    state.field_size_ha = field_area_ha
    state.area_ha = state.field_size_ha
    state.district = dist_key
    from src.optimizer.dynamic_agronomy import COASTAL_SALINE_DISTRICTS
    state.coastal_saline = dist_key in COASTAL_SALINE_DISTRICTS

    if data.get("soil_ph") is not None:
        state.ph = data["soil_ph"]
    if data.get("organic_matter") is not None:
        state.organic_matter = data["organic_matter"]
    if data.get("irrigation_capacity_mm") is not None:
        state.irrigation_capacity_mm = data["irrigation_capacity_mm"]

    soil_texture_source = "request input" if data.get("soil_texture") not in (None, "", "unknown") else "district reference"
    if "soil_texture" in data and data["soil_texture"] != "unknown":
        state.texture = str(data["soil_texture"])
    elif dist_key in DISTRICT_REGISTRY:
        state.texture = DISTRICT_REGISTRY[dist_key].get("soil_type", "loam")

    is_haor = data.get("seasonally_flooded")
    seasonally_flooded_source = "request input" if is_haor is not None else "district-level assumption"
    if is_haor is None:
        is_haor = dist_key in {"sunamganj", "netrokona", "kishoreganj", "habiganj", "moulvibazar"}
    state.seasonally_flooded = bool(is_haor)

    excluded_crops = ([c for c in data.get("excluded_crops", []) if c] + (["Potato"] if data.get("no_power_tiller") and "Potato" not in data.get("excluded_crops", []) else [])) or None
    allow_k2_fallow = bool(data.get("allow_kharif2_fallow", is_haor))
    water_availability = data.get("water_availability") or data.get("irrigation_class") or updated_field_conditions.get("irrigation_class")

    features = build_features(state, environmental_history=power)

    result = run_adaptive_replan(
        state, power,
        completed_seasons=completed_seasons,
        updated_field_conditions=updated_field_conditions,
        crops=crops_df,
        priority=priority,
        features=features,
        water_availability=water_availability,
        excluded_crops=excluded_crops,
        allow_kharif2_fallow=allow_k2_fallow,
    )
    result["district"] = dist_key
    result["climate_source"] = f"NASA POWER ({dist_key})"
    result["location_provenance"] = {
        "source": location_source,
        "field_coordinates_available": data.get("latitude") is not None and data.get("longitude") is not None,
        "reference_coordinates": None if data.get("latitude") is not None and data.get("longitude") is not None else {
            "latitude": lat,
            "longitude": lon,
            "meaning": "district reference centroid; not a field measurement",
        },
    }
    result["field_area_provenance"] = (
        "farmer-provided field area"
        if data.get("field_size_ha") is not None or data.get("area_ha") is not None
        else "assumed demo area"
    )
    observed_dates = power["date"].dropna() if "date" in power.columns else pd.Series(dtype="datetime64[ns]")
    result["climate_provenance"] = {
        "dataset": "NASA POWER",
        "data_type": "remote_gridded_observations",
        "district": dist_key,
        "mode": data_mode,
        "time_range": (
            [str(observed_dates.min().date()), str(observed_dates.max().date())]
            if not observed_dates.empty
            else None
        ),
    }
    result["soil_texture_provenance"] = soil_texture_source
    result["seasonally_flooded_provenance"] = seasonally_flooded_source
    return finite_json_value(jsonable_encoder(result))

@app.post("/api/scenarios/weather-uncertainty")
def weather_uncertainty(payload: Payload):
    data = payload.model_dump()
    from src.experiments.integrated_research_demo import DEFAULT_NASA_PATH
    from src.state.field_state import build_field_state
    from src.data.crops import load_crop_knowledge
    from src.preprocessing.features import build_features
    from src.scenarios.robust_planning import run_weather_uncertainty_analysis
    import pandas as pd

    fs = data.get("field_state") or {}
    lat_value = data.get("latitude") if data.get("latitude") is not None else fs.get("latitude")
    lon_value = data.get("longitude") if data.get("longitude") is not None else fs.get("longitude")
    area_value = data.get("field_size_ha")
    if area_value is None:
        area_value = fs.get("field_size_ha", data.get("area_ha"))
    try:
        lat = float(lat_value)
        lon = float(lon_value)
        field_area_ha = float(area_value)
    except (TypeError, ValueError) as error:
        raise HTTPException(422, "Valid field coordinates and area are required for weather-uncertainty analysis.") from error
    if (
        not math.isfinite(lat) or not -90 <= lat <= 90
        or not math.isfinite(lon) or not -180 <= lon <= 180
        or not math.isfinite(field_area_ha) or field_area_ha <= 0
    ):
        raise HTTPException(422, "Field coordinates or area are outside the supported range.")
    priority = str(data.get("strategy") or data.get("priority") or "balanced")

    power = pd.read_csv(DEFAULT_NASA_PATH)
    power["date"] = pd.to_datetime(power["date"])
    crops_df = load_crop_knowledge()
    state = build_field_state(str(data.get("field_id") or "demo"), lat, lon, power["date"].max(), power, crop_knowledge=crops_df)
    state.field_size_ha = field_area_ha
    state.area_ha = state.field_size_ha
    if data.get("soil_ph") or fs.get("soil_ph"): state.ph = float(data.get("soil_ph") or fs.get("soil_ph"))
    if data.get("organic_matter") or fs.get("organic_matter"): state.organic_matter = float(data.get("organic_matter") or fs.get("organic_matter"))
    features = build_features(state, environmental_history=power)

    result = run_weather_uncertainty_analysis(state, power, crops=crops_df, features=features, priority=priority)
    return finite_json_value(jsonable_encoder(result))

@app.post("/api/outcomes/record", status_code=200)
def record_outcome(payload: Payload, fieldshift_session: str | None = Cookie(None), db: DbSession = Depends(get_db)):
    data = payload.model_dump()
    from src.data.outcome_tracker import record_actual_outcome, list_actual_outcomes
    field_id = data.get("field_id", 1)
    user_id = None
    if fieldshift_session:
        try:
            user = require_user(fieldshift_session, db)
            user_id = user.id
        except HTTPException:
            pass
    try:
        rec = record_actual_outcome(field_id, data, user_id=user_id)
        outcomes = list_actual_outcomes(field_id)
        return finite_json_value(jsonable_encoder({
            "status": "ok",
            "outcome": rec.get("record", rec),
            "record": rec.get("record", rec),
            "summary": {
                "total_recorded_seasons": len(outcomes),
                "average_yield_variance_pct": round(sum(float(o.get("yield_variance_pct") or 0.0) for o in outcomes) / max(1, len(outcomes)), 1),
                "average_revenue_variance_pct": round(sum(float(o.get("revenue_variance_pct") or 0.0) for o in outcomes) / max(1, len(outcomes)), 1),
            }
        }))
    except ValueError as e:
        raise HTTPException(400, str(e))

@app.get("/api/outcomes/{field_id}")
def get_field_outcomes(field_id: str):
    from src.data.outcome_tracker import list_actual_outcomes
    outcomes = list_actual_outcomes(field_id)
    return {
        "status": "ok",
        "field_id": field_id,
        "outcomes": outcomes,
        "summary": {
            "total_recorded_seasons": len(outcomes),
            "average_yield_variance_pct": round(sum(float(o.get("yield_variance_pct") or 0.0) for o in outcomes) / max(1, len(outcomes)), 1),
            "average_revenue_variance_pct": round(sum(float(o.get("revenue_variance_pct") or 0.0) for o in outcomes) / max(1, len(outcomes)), 1),
        }
    }

@app.get("/api/outcomes")
def get_all_outcomes():
    from src.data.outcome_tracker import list_actual_outcomes
    outcomes = list_actual_outcomes()
    return {
        "status": "ok",
        "outcomes": outcomes,
        "summary": {
            "total_recorded_seasons": len(outcomes),
            "average_yield_variance_pct": round(sum(float(o.get("yield_variance_pct") or 0.0) for o in outcomes) / max(1, len(outcomes)), 1),
            "average_revenue_variance_pct": round(sum(float(o.get("revenue_variance_pct") or 0.0) for o in outcomes) / max(1, len(outcomes)), 1),
        }
    }


def get_gemini_api_key() -> str:
    import os
    if "GEMINI_API_KEY" in os.environ:
        return os.environ["GEMINI_API_KEY"]
    env_file = ROOT_DIR / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("GEMINI_API_KEY=") and not line.startswith("#"):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""

def call_gemini_chat(message: str = "", history: list | None = None, context: dict | None = None, language: str | None = None, prompt: str | None = None) -> dict[str, Any]:
    import os, json, urllib.request, urllib.error
    message = (message or prompt or "").strip()
    api_key = get_gemini_api_key()
    context = context or {}
    if language and "language" not in context:
        context["language"] = language
    field_info = context.get("field") or {}
    weather_info = context.get("weather") or {}
    plan_info = context.get("plan") or {}
    planner_info = context.get("planner") or {}
    comparison_info = context.get("comparison") or {}
    scenarios_info = context.get("scenarios") or {}
    outcomes_info = context.get("outcomes") or {}
    market_info = context.get("market") or {}
    provenance_info = context.get("provenance") or {}
    lang = str(context.get("language") or "en").lower()

    # Build rich field lines
    field_lines = []
    if field_info.get("name"): field_lines.append(f"Field Name: {field_info['name']}")
    if field_info.get("latitude") and field_info.get("longitude"): field_lines.append(f"Coordinates: {field_info['latitude']}°N, {field_info['longitude']}°E")
    if field_info.get("field_size_ha"): field_lines.append(f"Area: {field_info['field_size_ha']} ha")
    if field_info.get("soil_texture"): field_lines.append(f"Soil Texture: {field_info['soil_texture']}")
    if field_info.get("soil_ph") is not None: field_lines.append(f"Soil pH: {field_info['soil_ph']} (Measured / User test)")
    if field_info.get("organic_matter_pct") is not None: field_lines.append(f"Soil Organic Matter: {field_info['organic_matter_pct']}%")
    if field_info.get("irrigation_capacity_mm") is not None: field_lines.append(f"Seasonal Irrigation Capacity: {field_info['irrigation_capacity_mm']} mm")
    if field_info.get("previous_crop"): field_lines.append(f"Previous Crop: {field_info['previous_crop']}")

    weather_lines = []
    if weather_info.get("temperature_c") is not None: weather_lines.append(f"Observed Temp: {weather_info['temperature_c']}°C")
    if weather_info.get("humidity_pct") is not None: weather_lines.append(f"Relative Humidity: {weather_info['humidity_pct']}%")
    if weather_info.get("precipitation_mm") is not None: weather_lines.append(f"Daily Precipitation: {weather_info['precipitation_mm']} mm/day")
    if weather_info.get("wind_speed_ms") is not None: weather_lines.append(f"Wind Speed: {weather_info['wind_speed_ms']} m/s")
    if weather_info.get("source"): weather_lines.append(f"Weather Source: {weather_info['source']}")

    plan_lines = []
    if plan_info.get("rotation_str"): plan_lines.append(f"Planned Multi-Season Rotation: {plan_info['rotation_str']}")
    if plan_info.get("yield_tons"): plan_lines.append(f"Projected Yield: {plan_info['yield_tons']} tons")
    if plan_info.get("gross_margin_bdt"): plan_lines.append(f"Projected Gross Margin: {plan_info['gross_margin_bdt']:,} BDT")
    if plan_info.get("water_mm"): plan_lines.append(f"Estimated Water Demand: {plan_info['water_mm']} mm")
    if plan_info.get("solver_status"): plan_lines.append(f"Mathematical Solver Status: {plan_info['solver_status']}")

    planner_lines = []
    if planner_info:
        if planner_info.get("field"): planner_lines.append(f"Planner Field: {planner_info['field']} (Area: {planner_info.get('field_area_ha', 'N/A')} ha, District: {planner_info.get('district', 'N/A')})")
        if planner_info.get("current_rotation"): planner_lines.append(f"Current Baseline Rotation: {planner_info['current_rotation']}")
        if planner_info.get("rotation"): planner_lines.append(f"Recommended Multi-Season Plan: {planner_info['rotation']}")
        if planner_info.get("strategy"): planner_lines.append(f"Selected Strategy: {planner_info['strategy']} (Priorities: {planner_info.get('priorities', 'balanced')})")

        base_tot = planner_info.get("baseline_totals") or {}
        plan_tot = planner_info.get("plan_totals") or {}
        if base_tot or plan_tot:
            planner_lines.append(f"Baseline vs Plan Totals -> Irrigation: {base_tot.get('irrigation_mm', 'N/A')} mm (baseline) vs {plan_tot.get('irrigation_mm', 'N/A')} mm (plan) | Gross Profit: {base_tot.get('profit_bdt', 'N/A')} BDT/ha (baseline) vs {plan_tot.get('profit_bdt', 'N/A')} BDT/ha (plan)")

        seasons = planner_info.get("seasons") or []
        for s in seasons:
            planner_lines.append(f"Season {s.get('season')}: Crop={s.get('crop')} (Bengali: {s.get('crop_bn', 'N/A')}), Irrigation={s.get('irrigation_mm', 'N/A')} mm, Gross Margin={s.get('profit_bdt', 'N/A')} BDT/ha, Risk={s.get('risk', 'N/A')}")

        risk = planner_info.get("risk") or {}
        if risk:
            planner_lines.append(f"Planner Risks: Deficit Stress={risk.get('deficit_stress', 'N/A')}, Heat Stress={risk.get('heat_stress', 'N/A')}")

        sources = planner_info.get("data_sources") or []
        if sources:
            planner_lines.append(f"Data Sources: {', '.join(sources)}")

    extra_lines = []
    if comparison_info.get("summary"): extra_lines.append(f"Method Benchmark: {comparison_info['summary']}")
    if scenarios_info.get("robustness_score"): extra_lines.append(f"Climate Robustness Score: {scenarios_info['robustness_score']}%")
    if outcomes_info.get("recorded_seasons"): extra_lines.append(f"Empirical Harvests Logged: {outcomes_info['recorded_seasons']} seasons")
    if market_info.get("crop"): extra_lines.append(f"Market Crop: {market_info['crop']} | Farmgate: {market_info.get('farmgate_price_bdt_t', 'N/A')} BDT/t | Net Return: {market_info.get('estimated_net_return_bdt', 'N/A')} BDT")
    if market_info.get("demand_note"): extra_lines.append(f"Demand Status: {market_info['demand_note']}")
    if provenance_info.get("reliability_score"): extra_lines.append(f"System Reliability Score: {provenance_info['reliability_score']}% ({provenance_info.get('source_backed_pct', 'N/A')}% source-backed)")

    saao_closing = (
        "এই পরামর্শ সিদ্ধান্তের সহায়ক; স্থানীয় উপসহকারী কৃষি কর্মকর্তা (SAAO)-র সাথে আলোচনা করে চূড়ান্ত সিদ্ধান্ত নিন।"
        if (lang == "bn" or any(w in message.lower() for w in ["bangla", "banglae", "বাংলা"]))
        else "This advice provides decision support; please consult your local Sub-Assistant Agriculture Officer (SAAO) before making final farming decisions."
    )

    sys_text = (
        "You are the FieldShift Agronomic AI Assistant (NASA Space Apps Challenge 2026 | Team AZOIC), an expert scientific decision-support advisor for adaptive crop rotation, precision irrigation, and soil sustainability in Bangladesh.\n\n"
        "TELEMETRY & CONTEXT FOR ACTIVE FIELD:\n"
        + ("\n".join(f"- {l}" for l in field_lines) + "\n" if field_lines else "- No specific field selected; providing general agronomic guidance.\n")
        + ("\n".join(f"- {l}" for l in weather_lines) + "\n" if weather_lines else "")
        + ("\n".join(f"- {l}" for l in plan_lines) + "\n" if plan_lines else "")
        + ("\nPLANNER CONTEXT & MULTI-SEASON ROTATION:\n" + "\n".join(f"- {l}" for l in planner_lines) + "\n" if planner_lines else "")
        + ("\n".join(f"- {l}" for l in extra_lines) + "\n" if extra_lines else "")
        + "\nRESPONSE GUIDELINES & STRICT AGRONOMIC RULES:\n"
        "1. STRUCTURE: Whenever advising on crop choices, trade-offs, or field decisions, use this clear 6-part structure:\n"
        "   - **1. Short Answer**: Concise summary directly answering the user.\n"
        "   - **2. Evidence from this Field**: Reference actual field numbers (soil pH, OM %, irrigation mm, NASA weather, market prices, planner baseline vs plan totals).\n"
        "   - **3. Recommended Next Step**: Actionable agronomic plan.\n"
        "   - **4. Trade-offs & Risks**: Diseases, moisture deficits, market price drops or temperature risks.\n"
        "   - **5. Data Limitations**: Disclose whether values are measured lab tests, NASA reanalysis, DAM benchmarks, or simulation estimates. Clarify that open demand data is unavailable.\n"
        "   - **6. Suggested Follow-up Action**: Next tool or verification to execute.\n"
        "2. LANGUAGE: Support both English and Bengali (বাংলা). If the user writes in Bengali or Banglish or requested language is 'bn', respond in natural, warm Bengali script (বাংলা), keeping scientific crop names (e.g. Boro, Aman, Aus, Lentil/Masur, Mustard/Tori) and units (pH, mm, kg/ha, BDT) intact.\n"
        "3. GROUNDING & ZERO INVENTED NUMBERS: Only quote numbers from the provided context (never invent a price, yield, profit, or water depth). If a metric is null or missing, state 'তথ্য পাওয়া যায়নি' (or 'Information unavailable'), do NOT guess or fabricate.\n"
        "4. CITATIONS: Attribute weather to NASA POWER, soil/AEZ to BARC, and baseline crop economics to BBS/BARI/BRRI.\n"
        f"5. MANDATORY SAAO CLOSING: Always end your response with: '{saao_closing}'\n"
        "6. INTEGRITY & CLARITY: Remind that simulations provide decision support, not certified crop insurance assessments. Keep simple questions concise and explain technical terms clearly."
    )

    # Detect action intent from user message
    action_intent = None
    msg_low = message.lower()
    if any(w in msg_low for w in ["market", "price", "profit", "profitability", "bazar", "দাম", "বাজারদর", "লাভ", "dam", "tcb", "sadai"]):
        action_intent = {"action": "navigate_tab", "tab": "market", "label": "Open Market Intelligence", "description": "Inspect verified crop market benchmarks, DAM/TCB pricing, and calculate net returns"}
    elif any(w in msg_low for w in ["synthetic", "synthetic data", "data lab", "scenario generator", "reproducible", "কৃত্রিম উপাত্ত"]):
        action_intent = {"action": "navigate_tab", "tab": "synthetic_lab", "label": "Open Synthetic Data Lab", "description": "Generate reproducible counterfactual farm datasets under agronomic constraints"}
    elif any(w in msg_low for w in ["sensitivity", "elasticity", "perturbation", "price change", "yield drop", "স্থিতিস্থাপকতা"]):
        action_intent = {"action": "navigate_tab", "tab": "sensitivity", "label": "Open Scientific Sensitivity Analysis", "description": "Evaluate model elasticity and rotation changes under yield, price, and water sweeps"}
    elif any(w in msg_low for w in ["harvest", "actual yield", "record outcome", "recorded harvest", "outcomes"]):
        action_intent = {"action": "navigate_tab", "tab": "outcomes", "label": "Open Actual Outcomes Tracker", "description": "Record empirical harvest yield and evaluate variance vs optimizer estimates"}
    elif any(w in msg_low for w in ["drought", "crop failure", "shock", "recover", "stress scenario"]):
        action_intent = {"action": "navigate_tab", "tab": "failure", "label": "Open Failure & Recovery Simulator", "description": "Simulate drought, heat, or waterlogging shocks and inspect recovery efficiency"}
    elif any(w in msg_low for w in ["compare", "comparison", "milp vs rl", "rule-based", "benchmark"]):
        action_intent = {"action": "navigate_tab", "tab": "lab", "label": "Open 3-Way Comparison Lab", "description": "Benchmark MILP vs RL Simulation vs Deterministic Rule baseline"}
    elif any(w in msg_low for w in ["replan", "next season", "updated soil", "soil ph drop"]):
        action_intent = {"action": "navigate_tab", "tab": "replan", "label": "Open Next-Season Replanning", "description": "Adapt remaining seasons based on updated soil tests and harvest history"}
    elif any(w in msg_low for w in ["uncertainty", "climate stress", "weather forecast", "hotter", "drier"]):
        action_intent = {"action": "navigate_tab", "tab": "uncertainty", "label": "Open Weather Uncertainty", "description": "Evaluate crop plan feasibility across 5 parametric climate stress scenarios"}
    elif any(w in msg_low for w in ["sustainability", "soil health", "organic matter trend", "bnf"]):
        action_intent = {"action": "navigate_tab", "tab": "sustainability", "label": "Open Sustainability Tracker", "description": "View multi-season soil health proxy progression and legume frequency"}
    elif any(w in msg_low for w in ["crop catalog", "crop database", "bari", "brri"]):
        action_intent = {"action": "navigate_tab", "tab": "crops", "label": "Open Bangladesh Crop Database", "description": "Inspect 15 verified Bangladeshi crops with BARI/BRRI agronomic metadata"}
    elif any(w in msg_low for w in ["parcel", "field map", "create field", "edit field"]):
        action_intent = {"action": "navigate_tab", "tab": "field", "label": "Open Field Parcel Manager", "description": "View and manage registered farm parcels"}

    contents = []
    contents.append({"role": "user", "parts": [{"text": f"System Context & Rules:\n{sys_text}\n\nAcknowledge your role in 1 concise sentence."}]})
    contents.append({"role": "model", "parts": [{"text": "Understood. I am FieldShift Agronomic AI Assistant, ready to advise on your crop rotation, soil health, and weather telemetry with full scientific transparency."}]})

    if history:
        for item in history[-6:]:
            role = "user" if item.get("role") in ["user", "human"] else "model"
            txt = (item.get("text") or item.get("content") or "").strip()
            if txt:
                contents.append({"role": role, "parts": [{"text": txt}]})

    contents.append({"role": "user", "parts": [{"text": message}]})

    is_offline = os.environ.get("OFFLINE", "").strip().lower() in ["1", "true", "yes"]

    if api_key and not is_offline:
        model = "models/gemini-flash-lite-latest"
        url = f"https://generativelanguage.googleapis.com/v1beta/{model}:generateContent?key={api_key}"
        payload = {"contents": contents}
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req, timeout=18) as resp:
                resp_json = json.loads(resp.read().decode("utf-8"))
                candidates = resp_json.get("candidates", [])
                if candidates and "content" in candidates[0] and "parts" in candidates[0]["content"]:
                    reply = candidates[0]["content"]["parts"][0].get("text", "")
                    if reply:
                        clean_model_name = model.replace("models/", "")
                        res_dict = {
                            "status": "ok",
                            "reply": reply,
                            "response": reply,
                            "model": clean_model_name,
                            "model_used": clean_model_name,
                            "is_fallback": False,
                            "gemini_enabled": True,
                        }
                        if action_intent:
                            res_dict["action_intent"] = action_intent
                        return res_dict
        except Exception:
            pass

    # Deterministic honest offline fallback tailored to real field/planner context
    fname = planner_info.get("field") or field_info.get("name") or "Selected Field"
    texture = field_info.get("soil_texture") or "loam"
    ph = field_info.get("soil_ph")
    om = field_info.get("organic_matter") or field_info.get("organic_matter_pct")
    irrig = field_info.get("irrigation_capacity_mm") or 400
    temp = weather_info.get("temperature") or weather_info.get("temperature_c")

    base_tot = planner_info.get("baseline_totals") or {}
    plan_tot = planner_info.get("plan_totals") or {}
    base_bdt = base_tot.get("profit_bdt")
    plan_bdt = plan_tot.get("profit_bdt")
    base_irrig = base_tot.get("irrigation_mm")
    plan_irrig = plan_tot.get("irrigation_mm")
    diff_bdt = (plan_bdt - base_bdt) if (plan_bdt is not None and base_bdt is not None) else None
    saved_irrig = (base_irrig - plan_irrig) if (base_irrig is not None and plan_irrig is not None) else None
    seasons = planner_info.get("seasons") or []

    is_bn = (lang == "bn" or any(w in msg_low for w in ["bangla", "banglae", "বাংলা"]))

    # 1. Boro Rice profit & water trade-off query
    if any(w in msg_low for w in ["বোরো", "boro", "লাভ বেশি", "profit higher", "বোরো বাদ"]):
        if is_bn:
            bdt_str = f"{abs(diff_bdt):,} টাকা/হেক্টর বেশি" if diff_bdt is not None else "বেশি মুনাফা"
            irrig_str = f"প্রায় {saved_irrig} মিমি সেচের পানি সাশ্রয় হয়" if saved_irrig is not None else "বিপুল সেচ সাশ্রয় হয়"
            fallback_reply = (
                f"### ১. সংক্ষিপ্ত উত্তর (SHORT ANSWER)\n"
                f"বোরো ধানের বদলে স্বল্প-সেচের রবি ফসল (যেমন সরিষা বা ডাল) অন্তর্ভুক্ত করায় জমিতে **{irrig_str}** এবং বছরে **{bdt_str}** নিট লাভ হয়।\n\n"
                f"### ২. এই জমির প্রমাণাদি (EVIDENCE FROM THIS FIELD)\n"
                f"- বেসলাইন (বোরো ভিত্তিক) সেচ: **{base_irrig if base_irrig is not None else 'তথ্য পাওয়া যায়নি'} মিমি** | বেসলাইন লাভ: **{f'{base_bdt:,}' if base_bdt is not None else 'তথ্য পাওয়া যায়নি'} টাকা/হেক্টর**\n"
                f"- প্রস্তাবিত আবর্তন সেচ: **{plan_irrig if plan_irrig is not None else 'তথ্য পাওয়া যায়নি'} মিমি** | প্রস্তাবিত লাভ: **{f'{plan_bdt:,}' if plan_bdt is not None else 'তথ্য পাওয়া যায়নি'} টাকা/হেক্টর**\n\n"
                f"### ৩. প্রস্তাবিত পরবর্তী পদক্ষেপ (RECOMMENDED NEXT STEP)\n"
                f"রবি মৌসুমে আগাম সরিষা বা মসুর বপন করুন এবং খরিপ-১ মৌসুমে স্বল্প-মেয়াদি আউশ বা তিল দিয়ে সমন্বয় করুন।\n\n"
                f"### ৪. আপস ও ঝুঁকি (TRADE-OFFS & RISKS)\n"
                f"বোরো ধানের নিশ্চিত খাদ্যশস্য উৎপাদনের জায়গায় ডাল বা তেলবীজে বাজারদরের অস্থিরতা থাকতে পারে; তবে ভূগর্ভস্থ পানির পাম্পিং খরচ নাটকীয়ভাবে কমে।\n\n"
                f"### ৫. উপাত্তের সীমাবদ্ধতা (DATA LIMITATIONS)\n"
                f"উপাত্ত উৎস: নাসা পাওয়ার (NASA POWER) উপগ্রহ জলবায়ু ও বিবিএস (BBS) কৃষি শুমারি বেসলাইন।\n\n"
                f"### ৬. প্রস্তাবিত করণীয় (SUGGESTED FOLLOW-UP ACTION)\n"
                f"{saao_closing}"
            )
        else:
            bdt_str = f"{abs(diff_bdt):,} BDT/ha higher profit" if diff_bdt is not None else "higher profitability"
            irrig_str = f"saves approximately {saved_irrig} mm of irrigation water" if saved_irrig is not None else "significant irrigation savings"
            fallback_reply = (
                f"### 1. SHORT ANSWER\n"
                f"Replacing water-intensive Boro Rice with short-duration oilseeds or pulses {irrig_str} while yielding {bdt_str}.\n\n"
                f"### 2. EVIDENCE FROM THIS FIELD\n"
                f"- Baseline Irrigation: **{base_irrig if base_irrig is not None else 'Information unavailable'} mm** | Baseline Profit: **{f'{base_bdt:,}' if base_bdt is not None else 'Information unavailable'} BDT/ha**\n"
                f"- Recommended Plan Irrigation: **{plan_irrig if plan_irrig is not None else 'Information unavailable'} mm** | Plan Profit: **{f'{plan_bdt:,}' if plan_bdt is not None else 'Information unavailable'} BDT/ha**\n\n"
                f"### 3. RECOMMENDED NEXT STEP\n"
                f"Plant early Rabi mustard or lentil to utilize residual post-monsoon moisture before summer heat onset.\n\n"
                f"### 4. TRADE-OFFS & RISKS\n"
                f"Reduces groundwater extraction stress drastically; requires managing price volatility for non-cereal crops.\n\n"
                f"### 5. DATA LIMITATIONS\n"
                f"Calibrated via NASA POWER agrometeorology and BBS agriculture census baseline economic budgets.\n\n"
                f"### 6. SUGGESTED FOLLOW-UP ACTION\n"
                f"{saao_closing}"
            )

    # 2. Irrigation frequency query ("কতবার সেচ দেব?")
    elif any(w in msg_low for w in ["কতবার সেচ", "সেচ দেব", "irrigation events", "how many irrigation"]):
        matched_season = seasons[0] if seasons else {}
        for s in seasons:
            c_name = str(s.get("crop") or "").lower()
            c_bn = str(s.get("crop_bn") or "").lower()
            if c_name in msg_low or c_bn in msg_low:
                matched_season = s
                break
        c_disp = matched_season.get("crop_bn" if is_bn else "crop") or (matched_season.get("crop") or "ফসলে")
        s_irrig = matched_season.get("irrigation_mm")
        events = max(1, round(s_irrig / 75)) if (s_irrig is not None and s_irrig > 0) else (0 if s_irrig == 0 else 2)

        if is_bn:
            fallback_reply = (
                f"### ১. সংক্ষিপ্ত উত্তর (SHORT ANSWER)\n"
                f"আপনার জমিতে **{c_disp}** ফসলের জন্য মৌসুমে আনুমানিক **{s_irrig if s_irrig is not None else 'তথ্য পাওয়া যায়নি'} মিমি** সম্পূরক সেচ প্রয়োজন। দোআঁশ মাটিতে প্রতি সেচে প্রায় ৭৫ মিমি পানি বিবেচনা করলে মোট প্রায় **{events} বার সেচ** দেওয়া লাগবে।\n\n"
                f"### ২. এই জমির প্রমাণাদি (EVIDENCE FROM THIS FIELD)\n"
                f"- মাটির গঠন: **{texture}** | মৌসুমী সেচ বরাদ্দ: **{s_irrig if s_irrig is not None else 'তথ্য পাওয়া যায়নি'} মিমি**\n"
                f"- সেচ সময়সূচী: বপনের সময় (অঙ্কুরোদগম), ফুল আসার সংবেদনশীল ধাপ এবং দানা পুষ্ট হওয়ার সময়।\n\n"
                f"### ৩. প্রস্তাবিত পরবর্তী পদক্ষেপ (RECOMMENDED NEXT STEP)\n"
                f"সেচ দেওয়ার আগে মাটির আর্দ্রতা পরীক্ষা করুন; বৃষ্টির পূর্বাভাস থাকলে সেচ স্থগিত রাখুন।\n\n"
                f"### ৪. আপস ও ঝুঁকি (TRADE-OFFS & RISKS)\n"
                f"অতিরিক্ত সেচে শিকড় পচা রোগ হতে পারে; জমিতে নিষ্কাশন নালা প্রস্তুত রাখুন।\n\n"
                f"### ৫. উপাত্তের সীমাবদ্ধতা (DATA LIMITATIONS)\n"
                f"FAO-56 পেনম্যান-মন্টেথ পদ্ধতির মাধ্যমে নাসা উপগ্রহ বাষ্পীভবন ও বৃষ্টিপাত বিশ্লেষণ থেকে হিসাবকৃত।\n\n"
                f"### ৬. প্রস্তাবিত করণীয় (SUGGESTED FOLLOW-UP ACTION)\n"
                f"{saao_closing}"
            )
        else:
            fallback_reply = (
                f"### 1. SHORT ANSWER\n"
                f"For **{c_disp}**, modeled seasonal irrigation requirement is **{s_irrig if s_irrig is not None else 'Information unavailable'} mm**. Assuming ~75 mm per irrigation event in {texture} soil, plan for approximately **{events} irrigation events**.\n\n"
                f"### 2. EVIDENCE FROM THIS FIELD\n"
                f"- Soil Texture: **{texture}** | Seasonal Irrigation Quota: **{s_irrig if s_irrig is not None else 'Information unavailable'} mm**\n\n"
                f"### 3. RECOMMENDED NEXT STEP\n"
                f"Schedule waterings at critical growth stages: seedling establishment, flowering floret initiation, and grain filling.\n\n"
                f"### 4. TRADE-OFFS & RISKS\n"
                f"Over-irrigation induces root asphyxiation and fungal collar rot in upland crops.\n\n"
                f"### 5. DATA LIMITATIONS\n"
                f"Derived from FAO-56 crop water balance modeling using NASA POWER climatological surface data.\n\n"
                f"### 6. SUGGESTED FOLLOW-UP ACTION\n"
                f"{saao_closing}"
            )

    # 3. Strategy differences query
    elif any(w in msg_low for w in ["সুষম", "পার্থক্য", "balanced", "difference between", "কৌশল"]):
        if is_bn:
            fallback_reply = (
                f"### ১. সংক্ষিপ্ত উত্তর (SHORT ANSWER)\n"
                f"**সুষম (Balanced)** কৌশল লাভ (৩৪%), ভূগর্ভস্থ পানি সাশ্রয় (৩৩%) ও মাটির স্বাস্থ্য (৩৩%)-এর মধ্যে সমন্বয় ঘটায়। অন্যদিকে **লাভ (Profit)** কৌশল ৭০% গুরুত্ব দিয়ে নগদ আয় সর্বোচ্চ করে, যাতে সেচের চাপ বাড়তে পারে।\n\n"
                f"### ২. এই জমির প্রমাণাদি (EVIDENCE FROM THIS FIELD)\n"
                f"- বর্তমান জমিতে সেচ সাশ্রয়: **{saved_irrig if saved_irrig is not None else 'তথ্য পাওয়া যায়নি'} মিমি**\n"
                f"- প্রস্তাবিত কৌশলে বাৎসরিক মোট নিট লাভ: **{f'{plan_bdt:,}' if plan_bdt is not None else 'তথ্য পাওয়া যায়নি'} টাকা/হেক্টর**\n\n"
                f"### ৩. প্রস্তাবিত পরবর্তী পদক্ষেপ (RECOMMENDED NEXT STEP)\n"
                f"বরেন্দ্র বা ভূগর্ভস্থ পানির ঘাটতি এলাকায় সুষম বা পানি সাশ্রয় কৌশল নির্বাচন করাই দীর্ঘমেয়াদে টেকসই।\n\n"
                f"### ৪. আপস ও ঝুঁকি (TRADE-OFFS & RISKS)\n"
                f"লাভ কৌশলে একা মৌসুমে বেশি আয় হলেও খরায় পানি সংকট ও মাটির উর্বরতা ক্ষয়ের ঝুঁকি থাকে।\n\n"
                f"### ৫. উপাত্তের সীমাবদ্ধতা (DATA LIMITATIONS)\n"
                f"৬ মৌসুমের MILP বহু-উদ্দেশ্যমূলক গাণিতিক মডেলের মাধ্যমে অপ্টিমাইজ করা।\n\n"
                f"### ৬. প্রস্তাবিত করণীয় (SUGGESTED FOLLOW-UP ACTION)\n"
                f"{saao_closing}"
            )
        else:
            fallback_reply = (
                f"### 1. SHORT ANSWER\n"
                f"The **Balanced strategy** equally weights net profit (34%), groundwater preservation (33%), and soil organic matter (33%). In contrast, the **Profit-focused strategy** allocates 70% weight to revenue maximization.\n\n"
                f"### 2. EVIDENCE FROM THIS FIELD\n"
                f"- Irrigation savings under current plan: **{saved_irrig if saved_irrig is not None else 'Information unavailable'} mm**\n"
                f"- Projected gross margin: **{f'{plan_bdt:,}' if plan_bdt is not None else 'Information unavailable'} BDT/ha**\n\n"
                f"### 3. RECOMMENDED NEXT STEP\n"
                f"In water-stressed Barind tracts, prioritize the Balanced strategy to prevent aquifer depletion.\n\n"
                f"### 4. TRADE-OFFS & RISKS\n"
                f"Profit maximization elevates seasonal irrigation volume and increases financial exposure to market price drops.\n\n"
                f"### 5. DATA LIMITATIONS\n"
                f"Generated by FieldShift 6-Season MILP solver with linear constraint envelopes.\n\n"
                f"### 6. SUGGESTED FOLLOW-UP ACTION\n"
                f"{saao_closing}"
            )

    # 4. Glossary & plain language queries
    elif any(w in msg_low for w in ["বাষ্পীভবন", "et0", "evapotranspiration", "পানির ট্যাংক", "water tank", "আর্দ্রতা", "smap", "সবুজায়ন", "ndvi", "তাপপ্রবাহ", "heat stress", "পানির ভারসাম্য", "water balance", "স্যাটেলাইট", "satellite", "পুনর্বিশ্লেষণ", "reanalysis", "অনিশ্চয়তা", "uncertainty", "ফাঁকা দিন", "fallow"]):
        if any(w in msg_low for w in ["বাষ্পীভবন", "et0", "evapotranspiration"]):
            term_title = "বাষ্পীভবন ও প্রস্বেদন (ET0)" if is_bn else "Evapotranspiration (ET0)"
            term_desc = (
                "মাটি থেকে সূর্যের তাপে বাষ্পীভবন এবং গাছের পাতার মাধ্যমে প্রস্বেদনের সমন্বিত পানির ক্ষয়। এটি নির্দেশ করে নির্দিষ্ট মৌসুমে একটি ফসলের বেঁচে থাকার জন্য ঠিক কত মিলিমিটার পানি প্রয়োজন।"
                if is_bn else
                "The combined atmospheric moisture loss via soil evaporation and crop transpiration, defining the physiological water requirement of the crop canopy."
            )
        elif any(w in msg_low for w in ["পানির ট্যাংক", "water tank", "পানির ভারসাম্য", "water balance"]):
            term_title = "পানির ট্যাংক ও ভারসাম্য (Water Balance - FAO-56)" if is_bn else "Water Storage Budget & Balance"
            w_val = plan_irrig or irrig
            term_desc = (
                f"পানির ট্যাংক বলতে আপনার জমিতে বৃষ্টি ও মাটির আর্দ্রতা ধরে রাখার ধারণক্ষমতার সাপেক্ষে মোট পানির বাজেট ({w_val} মিমি) নির্দেশ করে। এটি পরিমাপ করে কতটুকু পানি শিকড়ে পৌঁছাল আর কতটুকু বাষ্প হয়ে উড়ে গেল।"
                if is_bn else
                f"The cumulative root-zone water ledger ({w_val} mm budget), balancing precipitation and irrigation inflows against crop evapotranspiration outflows."
            )
        elif any(w in msg_low for w in ["ফাঁকা দিন", "fallow"]):
            term_title = "ফাঁকা দিন হ্রাস (Bare Soil Fallow Reduction)" if is_bn else "Bare Fallow Day Reduction"
            term_desc = (
                "দুই ফসলের মাঝে জমি অনাবাদি ও উন্মুক্ত থাকার সময় কমিয়ে আনা। জমি সবুজে ঢাকা থাকলে সূর্যের তাপে মাটির আর্দ্রতা উড়ে যাওয়া রোধ হয়, আগাছা দমন হয় এবং অতিরিক্ত ফসল থেকে আয় বাড়ে।"
                if is_bn else
                "Minimizing uncultivated gaps between harvest and planting, preserving root-zone moisture from direct solar evaporation and suppressing weed seed banks."
            )
        elif any(w in msg_low for w in ["সবুজায়ন", "ndvi"]):
            term_title = "উদ্ভিদের সবুজায়ন সূচক (NDVI)" if is_bn else "Normalized Difference Vegetation Index (NDVI)"
            term_desc = (
                "লাল ও অবলোহিত আলোর প্রতিফলন তুলনা করে ফসলের সতেজতা ও ঘনত্ব পরিমাপ করা হয়। মান ০.৬ এর বেশি হলে তা ঘন সতেজ ফসল নির্দেশ করে।"
                if is_bn else
                "Measures live green canopy density by contrasting red and near-infrared reflectance (values >0.6 represent dense, healthy vegetation)."
            )
        elif any(w in msg_low for w in ["তাপপ্রবাহ", "heat"]):
            term_title = "তাপপ্রবাহ ঝুঁকি (Heat Stress)" if is_bn else "Heat Stress & Thermal Thresholds"
            term_desc = (
                "ফসল ফোটা বা পরাগায়নের সময় অতিরিক্ত তাপমাত্রা (যেমন ধানে ৩৫°সে বা গমে ৩১°সে এর বেশি) হলে দানা চিটা হয়ে ফলন কমে যায়।"
                if is_bn else
                "Excess ambient temperatures exceeding crop thresholds during flowering or grain-filling stages (>35°C for rice, >31°C for wheat) triggering floret sterility."
            )
        else:
            term_title = "মাটির আর্দ্রতা অ্যানোমালি (SMAP)" if is_bn else "Soil Moisture Anomaly (NASA SMAP)"
            term_desc = (
                "বহুবছরের স্বাভাবিক গড় আর্দ্রতার তুলনায় বর্তমানে ফসলের শিকড়মণ্ডলে (০-১০০ সেমি গভীরতায়) আর্দ্রতার তারতম্য।"
                if is_bn else
                "The deviation of root-zone soil moisture relative to 20-year climatological normal envelopes."
            )

        if is_bn:
            fallback_reply = (
                f"### ১. সংক্ষিপ্ত উত্তর (SHORT ANSWER)\n"
                f"**{term_title}**: {term_desc}\n\n"
                f"### ২. এই জমির প্রমাণাদি (EVIDENCE FROM THIS FIELD)\n"
                f"- জমি: **{fname}** ({texture} মাটি, সেচ বরাদ্দ: **{plan_irrig if plan_irrig is not None else irrig} মিমি**)\n\n"
                f"### ৩. প্রস্তাবিত পরবর্তী পদক্ষেপ (RECOMMENDED NEXT STEP)\n"
                f"আবর্তন পরিকল্পনায় এই বৈজ্ঞানিক সূচকের ভিত্তিতে বপন ও সেচের সঠিক সময় নির্বাচন করুন।\n\n"
                f"### ৪. আপস ও ঝুঁকি (TRADE-OFFS & RISKS)\n"
                f"প্রাকৃতিক জলবায়ু চরমভাবাপন্ন হলে স্যাটেলাইট সূচকের ঝুঁকি সতর্কবার্তা মেনে বিকল্প সেচ বা সুরক্ষার ব্যবস্থা নিন।\n\n"
                f"### ৫. উপাত্তের সীমাবদ্ধতা (DATA LIMITATIONS)\n"
                f"নাসার উপগ্রহ উপাত্ত ও ফিল্ডশিফ্ট এগ্রোনমিক ডিকশনারি থেকে সংকলিত।\n\n"
                f"### ৬. প্রস্তাবিত করণীয় (SUGGESTED FOLLOW-UP ACTION)\n"
                f"{saao_closing}"
            )
        else:
            fallback_reply = (
                f"### 1. SHORT ANSWER\n"
                f"**{term_title}**: {term_desc}\n\n"
                f"### 2. EVIDENCE FROM THIS FIELD\n"
                f"- Field: **{fname}** ({texture} soil, seasonal water quota: **{plan_irrig if plan_irrig is not None else irrig} mm**)\n\n"
                f"### 3. RECOMMENDED NEXT STEP\n"
                f"Use this parameter to synchronize sowing windows with available hydrological and thermal envelopes.\n\n"
                f"### 4. TRADE-OFFS & RISKS\n"
                f"Plan for micro-climate variations that differ slightly from satellite pixel averages.\n\n"
                f"### 5. DATA LIMITATIONS\n"
                f"Calibrated from NASA Earth Observation feeds and FAO-56 irrigation standards.\n\n"
                f"### 6. SUGGESTED FOLLOW-UP ACTION\n"
                f"{saao_closing}"
            )

    # 5. General field-grounded fallback
    else:
        rot_str = planner_info.get("rotation") or plan_info.get("rotation_str") or "সরিষা → মুগডাল → আমন ধান"
        if is_bn:
            soil_stat = f"pH {ph}, জৈব পদার্থ {om}%" if (ph is not None and om is not None) else "pH ও জৈব উপাদানের সঠিক ল্যাব টেস্ট মান অন্তর্ভুক্ত করার পরামর্শ রইল"
            fallback_reply = (
                f"### ১. সংক্ষিপ্ত উত্তর (SHORT ANSWER)\n"
                f"আপনার **{fname}** জমির জন্য ({texture} মাটি, {soil_stat}), প্রস্তাবিত আবর্তন হলো: **{rot_str}**।\n\n"
                f"### ২. এই জমির প্রমাণাদি (EVIDENCE FROM THIS FIELD)\n"
                f"- মাটির গঠন: **{texture}** | মৌসুমী সেচ বাজেট: **{plan_irrig if plan_irrig is not None else irrig} মিমি**\n"
                f"- বাৎসরিক মোট নিট লাভ: **{f'{plan_bdt:,}' if plan_bdt is not None else 'তথ্য পাওয়া যায়নি'} টাকা/হেক্টর**\n\n"
                f"### ৩. প্রস্তাবিত পরবর্তী পদক্ষেপ (RECOMMENDED NEXT STEP)\n"
                f"পরপর দুই মৌসুম একই গোত্রের ফসল চাষ পরিহার করুন। লিগিউম জাতীয় ফসল (যেমন মুগ বা মসুর) অন্তর্ভুক্ত করে প্রাকৃতিক নাইট্রোজেন সংবন্ধন বাড়ান।\n\n"
                f"### ৪. আপস ও ঝুঁকি (TRADE-OFFS & RISKS)\n"
                f"রবি মৌসুমে আগাম তাপপ্রবাহে দানাদার ফসলের পরাগায়ন ব্যাহত হতে পারে। সেচ ঘাটতি থাকলে খরা-সহনশীল ডাল নির্বাচন করুন।\n\n"
                f"### ৫. উপাত্তের সীমাবদ্ধতা (DATA LIMITATIONS)\n"
                f"এটি ফিল্ডশিফ্ট অপ্টিমাইজার থেকে প্রাপ্ত পূর্বাভাস; অন-গ্রাউন্ড রাসায়নিক মৃত্তিকা পরীক্ষার সরাসরি বিকল্প নয়।\n\n"
                f"### ৬. প্রস্তাবিত করণীয় (SUGGESTED FOLLOW-UP ACTION)\n"
                f"{saao_closing}"
            )
        else:
            soil_stat_en = f"pH {ph}, {om}% organic matter" if (ph is not None and om is not None) else "soil pH and organic matter pending on-ground laboratory confirmation"
            fallback_reply = (
                f"### 1. SHORT ANSWER\n"
                f"For **{fname}** ({texture} soil, {soil_stat_en}), the recommended multi-season rotation is **{rot_str}**.\n\n"
                f"### 2. EVIDENCE FROM THIS FIELD\n"
                f"- Soil: **{texture}** | Seasonal Water Budget: **{plan_irrig if plan_irrig is not None else irrig} mm**\n"
                f"- Modeled Annual Profit: **{f'{plan_bdt:,}' if plan_bdt is not None else 'Information unavailable'} BDT/ha**\n\n"
                f"### 3. RECOMMENDED NEXT STEP\n"
                f"Maintain strict botanical family alternation to break pest vectors and replenish biological nitrogen.\n\n"
                f"### 4. TRADE-OFFS & RISKS\n"
                f"Ensure furrow drainage before Kharif monsoon rains to prevent legume seedling damping-off.\n\n"
                f"### 5. DATA LIMITATIONS\n"
                f"Derived from deterministic Bangladesh crop rule parameters and NASA agroclimatology.\n\n"
                f"### 6. SUGGESTED FOLLOW-UP ACTION\n"
                f"{saao_closing}"
            )

    model_label = "AI অফলাইন — পরিকল্পনার তথ্য থেকে উত্তর" if is_bn else "AI Offline — Answer derived from your plan"

    res_dict = {
        "status": "ok",
        "reply": fallback_reply,
        "response": fallback_reply,
        "model": model_label,
        "model_used": "offline_plan_rules",
        "is_fallback": True,
        "gemini_enabled": False,
    }
    if action_intent:
        res_dict["action_intent"] = action_intent
    return res_dict

@app.post("/api/assistant/chat")
def assistant_chat(payload: Payload):
    data = payload.model_dump()
    message = (data.get("message") or data.get("prompt") or "").strip()
    if not message:
        raise HTTPException(400, "Message cannot be empty.")
    history = data.get("history") or []
    context = data.get("context") or {}
    if "language" in data and "language" not in context:
        context["language"] = data["language"]
    return call_gemini_chat(message, history, context)

@app.post("/api/rl/decision")
def rl_decision(payload: Payload, fieldshift_session: str | None = Cookie(None), db: DbSession = Depends(get_db)):
    data = payload.model_dump()
    authorize_rl_field(data.get("field_id"), fieldshift_session, db)
    if data.get("season_index") == 0:
        raise HTTPException(422, "S1 is the MILP baseline; RL adaptive decisions begin at S2 after S1 completes.")
    experiment_context = validate_rl_decision_context(data)
    result = run_rl_step_payload(data)
    return finite_json_value(jsonable_encoder({
        "status": "ready",
        "decision": {
            "season_number": experiment_context["season_index"] + 1,
            "current_state": experiment_context["current_state"],
            "rl_proposed_action": result["rl_proposed_action"],
            "rl_policy_score": result["rl_policy_score"],
            "decision_reason": result["decision_reason"],
            "candidate_actions": result["candidate_actions"],
            "policy_label": result["policy_label"],
            "evidence_class": result["evidence_class"],
            "reward_configuration": result["reward_configuration"],
            "experiment_context": {
                "completed_season_count": len(experiment_context["completed_seasons"]),
                "prior_applied_crops": [
                    season["applied_action"] for season in experiment_context["completed_seasons"]
                ],
                "prior_outcomes": [
                    {
                        "season_id": season["season_id"],
                        "outcome": season["outcome"],
                    }
                    for season in experiment_context["completed_seasons"]
                ],
                "prior_interventions": experiment_context["interventions"],
                "milp_reference_crop": experiment_context["milp_reference_rotation"][experiment_context["season_index"]],
            },
            "provenance": {
                "temperature_source": experiment_context["current_state"].get("temperature_source", "unavailable"),
                "available_water_source": experiment_context["current_state"].get("available_water_source", "unavailable"),
                "soil_health_score_source": experiment_context["current_state"].get("soil_health_score_source", "unavailable"),
                "evidence_class": result["evidence_class"],
                "data_status": result["data_status"],
            },
        },
    }))

@app.post("/api/rl/baseline-execute")
def rl_baseline_execute(payload: Payload, fieldshift_session: str | None = Cookie(None), db: DbSession = Depends(get_db)):
    data = payload.model_dump()
    authorize_rl_field(data.get("field_id"), fieldshift_session, db)
    if data.get("season_index") != 0:
        raise HTTPException(422, "The MILP baseline can only execute as Season 1.")
    if data.get("completed_seasons") not in (None, []):
        raise HTTPException(422, "Season 1 cannot have prior experiment seasons.")
    rotation = data.get("milp_reference_rotation")
    if not isinstance(rotation, list) or len(rotation) != 6 or not isinstance(rotation[0], str) or not rotation[0]:
        raise HTTPException(422, "The selected MILP baseline must provide a six-season reference rotation.")
    validate_rl_decision_context(data)
    result = run_milp_baseline_step_payload(data, rotation[0])
    result["state_after_crop"]["season_id"] = "Y1_S2"
    result["season_id"] = "Y1_S1"
    result["season_number"] = 1
    result["state_after"] = None
    result["intervention"] = None
    return finite_json_value(jsonable_encoder({"status": "completed", "season": result}))

@app.post("/api/rl/execute")
def rl_execute(payload: Payload, fieldshift_session: str | None = Cookie(None), db: DbSession = Depends(get_db)):
    data = payload.model_dump()
    authorize_rl_field(data.get("field_id"), fieldshift_session, db)
    if data.get("season_index") == 0:
        raise HTTPException(422, "S1 must execute through the MILP baseline endpoint, not the RL policy.")
    validate_rl_decision_context(data)
    result = run_rl_step_payload(data)
    expected_action = data.get("expected_proposed_action")
    if expected_action and expected_action != result["rl_proposed_action"]:
        raise HTTPException(409, "The RL proposal changed; request a fresh decision before executing this season.")
    season_index = int(data.get("season_index"))
    next_season_id = (
        f"Y{(season_index + 1) // 2 + 1}_S{(season_index + 1) % 2 + 1}"
        if season_index < 5 else None
    )
    result["state_after_crop"]["season_id"] = next_season_id
    result["season_id"] = ["Y1_S1", "Y1_S2", "Y2_S1", "Y2_S2", "Y3_S1", "Y3_S2"][season_index]
    result["season_number"] = season_index + 1
    result["outcome"]["crop"] = result["applied_action"]
    result["state_after"] = None
    result["intervention"] = None
    return finite_json_value(jsonable_encoder({"status": "completed", "season": result}))

@app.post("/api/rl/intervene")
def rl_intervene(payload: Payload, fieldshift_session: str | None = Cookie(None), db: DbSession = Depends(get_db)):
    data = payload.model_dump()
    authorize_rl_field(data.get("field_id"), fieldshift_session, db)
    state = data.get("state")
    if not isinstance(state, dict):
        raise HTTPException(422, "state must be an object.")
    season_index = data.get("season_index")
    if isinstance(season_index, bool) or not isinstance(season_index, int) or not 0 <= season_index < 6:
        raise HTTPException(422, "season_index must be an integer from 0 through 5.")
    state_after, intervention = apply_rl_intervention(state, data.get("intervention"))
    state_after["season_id"] = (
        f"Y{(season_index + 1) // 2 + 1}_S{(season_index + 1) % 2 + 1}"
        if season_index < 5 else None
    )
    return finite_json_value(jsonable_encoder({
        "status": "updated",
        "state_after": state_after,
        "intervention": intervention,
    }))

@app.post("/api/rl/reoptimize")
def rl_reoptimize(payload: Payload, fieldshift_session: str | None = Cookie(None), db: DbSession = Depends(get_db)):
    data = payload.model_dump()
    final_state = data.get("final_state")
    if not isinstance(final_state, dict):
        raise HTTPException(422, "final_state must be an object.")
    field_id = data.get("field_id")
    field_record, user = authorize_rl_field(field_id, fieldshift_session, db)
    strategy_id = str(data.get("strategy_id") or "")
    rl_weights(strategy_id)
    trajectory = validate_rl_trajectory(data.get("rl_trajectory"), final_state, strategy_id)
    benchmark_id = data.get("benchmark_id")
    if benchmark_id is not None:
        strategy_key = {
            "profit_focused": "profit_focused",
            "water_efficiency": "water_focused",
            "soil_health": "soil_focused",
            "balanced": "balanced",
        }[strategy_id]
        try:
            from src.scenarios.benchmark_scenarios import run_benchmark_scenario

            benchmark_result = run_benchmark_scenario(
                str(benchmark_id),
                strategy_id=strategy_key,
                state_overrides={
                    "temperature_c": final_state.get("temperature_c"),
                    "soil_ph": final_state.get("soil_ph"),
                    "available_water_mm": final_state.get("available_water_mm"),
                    "previous_crop": final_state.get("previous_crop"),
                },
            )
        except ValueError as error:
            raise HTTPException(422, str(error)) from error
        except Exception as error:
            raise HTTPException(502, f"PuLP/CBC benchmark re-optimization failed: {error}") from error
        selected_plan = benchmark_result.get("strategies", {}).get(strategy_key)
        if not isinstance(selected_plan, dict):
            raise HTTPException(502, "PuLP/CBC benchmark re-optimization returned no selected strategy.")
        return finite_json_value(jsonable_encoder({
            "status": "ok",
            "summary": {
                "planning": {
                    "selected_strategy_result": selected_plan,
                },
            },
            "benchmark": benchmark_result,
            "rl_trajectory": trajectory,
            "reoptimization_handoff": {
                "final_state": final_state,
                "solver_inputs": [
                    "temperature_c",
                    "available_water_mm",
                    "soil_ph",
                    "previous_crop",
                ],
                "soil_health_proxy_consumed_as_constraint": False,
            },
        }))
    workflow_data = data.get("workflow_payload")
    if not isinstance(workflow_data, dict):
        raise HTTPException(422, "workflow_payload must be an object.")
    workflow_data = dict(workflow_data)
    if str(workflow_data.get("field_id")) != str(field_id):
        raise HTTPException(400, "workflow_payload field_id must match the authorized experiment field.")
    workflow_data["priority"] = {
        "profit_focused": "profit",
        "water_efficiency": "water_efficiency",
        "soil_health": "soil_health",
        "balanced": "balanced",
    }[strategy_id]
    for key, state_key in (
        ("temperature_c", "temperature_c"),
        ("available_water_mm", "available_water_mm"),
        ("soil_ph", "soil_ph"),
    ):
        value = final_state.get(state_key)
        if value is not None:
            workflow_data[key] = value
    if final_state.get("previous_crop"):
        workflow_data["simulation_previous_crop"] = final_state["previous_crop"]
    if field_record is not None:
        workflow_data = use_field_record(workflow_data, field_record, db)
    try:
        result = workflow_result(workflow_data, public_user(user) if user else None)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(502, f"PuLP/CBC re-optimization failed: {error}") from error
    result["rl_trajectory"] = trajectory
    result["reoptimization_handoff"] = {
        "final_state": final_state,
        "solver_inputs": [
            "temperature_c",
            "available_water_mm",
            "soil_ph",
            "previous_crop",
        ],
        "soil_health_proxy_consumed_as_constraint": False,
    }
    return finite_json_value(jsonable_encoder(result))

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
        response = {"status": "ok", "results": run_all_benchmark_scenarios()}
    else:
        response = {"status": "ok", "result": run_benchmark_scenario(str(scenario_id).upper())}
    return finite_json_value(jsonable_encoder(response))

@app.get("/api/auth/me")
def me(response: Response, fieldshift_session: str | None = Cookie(None), db: DbSession = Depends(get_db)):
    try:
        user = require_user(fieldshift_session, db)
        if not fieldshift_session:
            token = secrets.token_urlsafe(32)
            stamp = now()
            db.add(LoginSession(user_id=user.id, token=token, created_at=stamp, expires_at=stamp + timedelta(days=7)))
            db.commit()
            set_auth_cookie(response, token)
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
    set_auth_cookie(response, token)
    return {"status":"created","user":public_user(user)}

@app.post("/api/auth/login")
def login(credentials: Credentials, response: Response, db: DbSession = Depends(get_db)):
    user=db.scalar(select(User).where(User.email==credentials.email.strip().lower()))
    if not user or not user.is_active or not verify_password(credentials.password,user.password_hash): raise HTTPException(401,"Email or password is incorrect.")
    stamp=now(); user.last_login=stamp; user.updated_at=stamp; token=secrets.token_urlsafe(32); db.add(LoginSession(user_id=user.id,token=token,created_at=stamp,expires_at=stamp+timedelta(days=7))); db.commit()
    set_auth_cookie(response, token)
    return {"status":"ok","user":{"id":user.id,"name":user.name,"email":user.email}}

@app.post("/api/auth/logout")
def logout(response: Response, fieldshift_session: str | None = Cookie(None), db: DbSession = Depends(get_db)):
    item=db.scalar(select(LoginSession).where(LoginSession.token==fieldshift_session)) if fieldshift_session else None
    if item: db.delete(item); db.commit()
    clear_auth_cookie(response); return {"status":"ok"}

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
    area_ha = float(data["area_ha"]) if data.get("area_ha") not in (None, "") else None
    if area_ha is not None and area_ha <= 0:
        raise HTTPException(400, "Field area must be a positive number of hectares.")
    om = float(data["organic_matter"]) if data.get("organic_matter") not in (None, "") else None
    if om is not None and not (0.0 <= om <= 100.0):
        raise HTTPException(400, "Organic matter must be between 0 and 100 percent.")
    irrig = float(data["irrigation_capacity_mm"]) if data.get("irrigation_capacity_mm") not in (None, "") else None
    if irrig is not None and irrig < 0:
        raise HTTPException(400, "Irrigation capacity cannot be negative.")
    soil_ph_val = None
    raw_ph = data.get("soil_ph") if data.get("soil_ph") is not None else data.get("ph")
    if raw_ph not in (None, ""):
        soil_ph_val = float(raw_ph)
        if not (0.0 <= soil_ph_val <= 14.0):
            raise HTTPException(400, "Soil pH must be between 0 and 14.")
    # Auto-resolve district and seasonally_flooded if not provided
    field_district = data.get("district")
    if not field_district and lat is not None and lon is not None:
        try:
            from src.compute.advisory_service import nearest_district
            field_district = nearest_district(lat, lon)
        except Exception:
            field_district = None

    is_flooded = data.get("seasonally_flooded")
    if is_flooded is None and field_district:
        is_flooded = str(field_district).lower() in {"sunamganj", "netrokona", "kishoreganj", "habiganj", "moulvibazar"}
    elif is_flooded is not None:
        is_flooded = bool(is_flooded)
    else:
        is_flooded = False

    dist_km = data.get("nearest_district_distance_km")
    p_cell = data.get("power_cell")
    i_cell = data.get("imerg_cell")
    s_soil = data.get("soilgrids_soil")

    if lat is not None and lon is not None:
        if not p_cell:
            p_cell = f"{round(float(lat) * 2.0) / 2.0:.1f},{round(float(lon) * 2.0) / 2.0:.1f}"
        if not i_cell:
            i_cell = f"{round(float(lat) * 10.0) / 10.0:.1f},{round(float(lon) * 10.0) / 10.0:.1f}"
        if dist_km is None and field_district:
            try:
                from src.compute.advisory_service import DISTRICT_REGISTRY, haversine_distance_km
                d_meta = DISTRICT_REGISTRY.get(str(field_district).lower(), {})
                d_lat = d_meta.get("latitude")
                d_lon = d_meta.get("longitude")
                if d_lat is not None and d_lon is not None:
                    dist_km = round(haversine_distance_km(float(lat), float(lon), float(d_lat), float(d_lon)), 1)
                if not s_soil:
                    s_soil = d_meta.get("soil_type")
            except Exception:
                pass

    existing_rot = data.get("existing_rotation")
    clean_rot = None
    if isinstance(existing_rot, dict):
        clean_rot = {
            "rabi": str(existing_rot.get("rabi") or "").strip() or None,
            "kharif1": str(existing_rot.get("kharif1") or "").strip() or None,
            "kharif2": str(existing_rot.get("kharif2") or "").strip() or None,
        }
    elif isinstance(existing_rot, str) and existing_rot.strip():
        try:
            parsed = json.loads(existing_rot)
            if isinstance(parsed, dict):
                clean_rot = {
                    "rabi": str(parsed.get("rabi") or "").strip() or None,
                    "kharif1": str(parsed.get("kharif1") or "").strip() or None,
                    "kharif2": str(parsed.get("kharif2") or "").strip() or None,
                }
        except Exception:
            pass

    stamp = now()
    field = FarmField(
        farm_id=int(farm_id),
        name=name,
        latitude=lat,
        longitude=lon,
        area_ha=area_ha,
        soil_texture=str(data["soil_texture"]) if data.get("soil_texture") else None,
        organic_matter=om,
        irrigation_capacity_mm=irrig,
        soil_ph=soil_ph_val,
        district=field_district,
        seasonally_flooded=is_flooded,
        nearest_district_distance_km=float(dist_km) if dist_km is not None else None,
        power_cell=p_cell,
        imerg_cell=i_cell,
        soilgrids_soil=s_soil,
        existing_rotation=clean_rot,
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

@app.get("/api/fields/{field_id}")
def get_field(field_id: int, user: User = Depends(require_user), db: DbSession = Depends(get_db)):
    fld = owned_field(db, field_id, user)
    f_dict = row(fld)
    hist = [row(h) for h in db.scalars(select(FieldHistory).where(FieldHistory.field_id == fld.id).order_by(FieldHistory.year.desc(), FieldHistory.id.desc()))]
    f_dict["history"] = hist
    if hist:
        f_dict["previous_crop"] = hist[0].get("crop")
        f_dict["previous_crop_year"] = hist[0].get("year")
        f_dict["current_crop"] = hist[0].get("crop")
    if fld.latitude is not None and fld.longitude is not None:
        from src.compute.advisory_service import nearest_district
        f_dict["nearest_district"] = nearest_district(float(fld.latitude), float(fld.longitude))
    last_anal = db.scalar(select(Analysis.created_at).where(Analysis.field_id == fld.id).order_by(Analysis.id.desc()))
    f_dict["last_analysis_date"] = last_anal.isoformat() if last_anal else None
    return {"status": "ok", "field": f_dict}

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
        if data["area_ha"] not in (None, ""):
            area_ha = float(data["area_ha"])
            if area_ha <= 0:
                raise HTTPException(400, "Field area must be a positive number of hectares.")
            field.area_ha = area_ha
        else:
            field.area_ha = None
    if "soil_texture" in data:
        field.soil_texture = str(data["soil_texture"]) if data["soil_texture"] else None
    if "organic_matter" in data:
        if data["organic_matter"] not in (None, ""):
            om = float(data["organic_matter"])
            if not (0.0 <= om <= 100.0):
                raise HTTPException(400, "Organic matter must be between 0 and 100 percent.")
            field.organic_matter = om
        else:
            field.organic_matter = None
    if "irrigation_capacity_mm" in data:
        if data["irrigation_capacity_mm"] not in (None, ""):
            irrig = float(data["irrigation_capacity_mm"])
            if irrig < 0:
                raise HTTPException(400, "Irrigation capacity cannot be negative.")
            field.irrigation_capacity_mm = irrig
        else:
            field.irrigation_capacity_mm = None
    if "soil_ph" in data or "ph" in data:
        raw_ph = data.get("soil_ph") if "soil_ph" in data else data.get("ph")
        if raw_ph not in (None, ""):
            ph_val = float(raw_ph)
            if not (0.0 <= ph_val <= 14.0):
                raise HTTPException(400, "Soil pH must be between 0 and 14.")
            field.soil_ph = ph_val
        else:
            field.soil_ph = None
    if "district" in data:
        field.district = str(data["district"]).strip() if data["district"] else None
    if "seasonally_flooded" in data:
        field.seasonally_flooded = bool(data["seasonally_flooded"]) if data["seasonally_flooded"] is not None else False
    if "nearest_district_distance_km" in data:
        field.nearest_district_distance_km = float(data["nearest_district_distance_km"]) if data["nearest_district_distance_km"] is not None else None
    if "power_cell" in data:
        field.power_cell = str(data["power_cell"]) if data["power_cell"] else None
    if "imerg_cell" in data:
        field.imerg_cell = str(data["imerg_cell"]) if data["imerg_cell"] else None
    if "soilgrids_soil" in data:
        field.soilgrids_soil = str(data["soilgrids_soil"]) if data["soilgrids_soil"] else None
    if "existing_rotation" in data:
        existing_rot = data["existing_rotation"]
        if isinstance(existing_rot, dict):
            field.existing_rotation = {
                "rabi": str(existing_rot.get("rabi") or "").strip() or None,
                "kharif1": str(existing_rot.get("kharif1") or "").strip() or None,
                "kharif2": str(existing_rot.get("kharif2") or "").strip() or None,
            }
        elif isinstance(existing_rot, str) and existing_rot.strip():
            try:
                parsed = json.loads(existing_rot)
                if isinstance(parsed, dict):
                    field.existing_rotation = {
                        "rabi": str(parsed.get("rabi") or "").strip() or None,
                        "kharif1": str(parsed.get("kharif1") or "").strip() or None,
                        "kharif2": str(parsed.get("kharif2") or "").strip() or None,
                    }
                else:
                    field.existing_rotation = None
            except Exception:
                field.existing_rotation = None
        else:
            field.existing_rotation = None

    if field.latitude is not None and field.longitude is not None:
        if not field.power_cell or "latitude" in data or "longitude" in data:
            field.power_cell = f"{round(float(field.latitude) * 2.0) / 2.0:.1f},{round(float(field.longitude) * 2.0) / 2.0:.1f}"
        if not field.imerg_cell or "latitude" in data or "longitude" in data:
            field.imerg_cell = f"{round(float(field.latitude) * 10.0) / 10.0:.1f},{round(float(field.longitude) * 10.0) / 10.0:.1f}"
        if field.district:
            try:
                from src.compute.advisory_service import DISTRICT_REGISTRY, haversine_distance_km
                d_meta = DISTRICT_REGISTRY.get(str(field.district).lower(), {})
                d_lat = d_meta.get("latitude")
                d_lon = d_meta.get("longitude")
                if d_lat is not None and d_lon is not None:
                    field.nearest_district_distance_km = round(haversine_distance_km(float(field.latitude), float(field.longitude), float(d_lat), float(d_lon)), 1)
                if not field.soilgrids_soil:
                    field.soilgrids_soil = d_meta.get("soil_type")
            except Exception:
                pass
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
    db.execute(delete(FieldHistory).where(FieldHistory.field_id == field_id))
    db.flush()
    db.delete(field)
    db.commit()
    return {"status": "deleted", "id": field_id}

@app.get("/api/fields/{field_id}/history")
def field_history(field_id: str, user: User | None = Depends(optional_user), db: DbSession = Depends(get_db)):
    numeric_id = int(field_id) if str(field_id).isdigit() else None
    if str(field_id) in {"demo", "field_demo", "demo_check_field", "0"} or user is None:
        histories = [row(x) for x in db.scalars(select(FieldHistory).where(FieldHistory.field_id == numeric_id).order_by(FieldHistory.year.desc(), FieldHistory.id.desc()))] if numeric_id else []
        return {"status": "ok", "history": histories, "outcomes": []}
    if numeric_id is not None:
        owned_field(db, numeric_id, user)
    histories = [row(x) for x in db.scalars(select(FieldHistory).where(FieldHistory.field_id == numeric_id).order_by(FieldHistory.year.desc(), FieldHistory.id.desc()))] if numeric_id else []
    outcomes = [row(x) for x in db.scalars(select(FarmOutcome).where(FarmOutcome.field_id == numeric_id).order_by(FarmOutcome.year.desc(), FarmOutcome.id.desc()))] if numeric_id else []
    return {"status": "ok", "history": histories, "outcomes": outcomes}

@app.post("/api/fields/{field_id}/history", status_code=201)
def create_field_history(field_id: str, payload: Payload, user: User | None = Depends(optional_user), db: DbSession = Depends(get_db)):
    numeric_id = int(field_id) if str(field_id).isdigit() else 1
    if str(field_id) not in {"demo", "field_demo", "demo_check_field", "0"} and user is not None:
        try:
            owned_field(db, numeric_id, user)
        except Exception:
            pass
    data = payload.model_dump()
    stamp = now()
    y_val = None
    if data.get("yield_ton_per_ha") not in (None, ""):
        try: y_val = float(data["yield_ton_per_ha"])
        except (ValueError, TypeError): pass
    elif data.get("yield_ton_ha") not in (None, ""):
        try: y_val = float(data["yield_ton_ha"])
        except (ValueError, TypeError): pass
    elif data.get("yield_maund_per_bigha") not in (None, ""):
        try:
            m_val = float(data["yield_maund_per_bigha"])
            y_val = round((m_val * 37.32) / (1000 * 0.13378), 2)
        except (ValueError, TypeError): pass
    elif data.get("yield") not in (None, ""):
        try: y_val = float(data["yield"])
        except (ValueError, TypeError): pass

    w_val = None
    if data.get("water_applied_mm") not in (None, ""):
        try: w_val = float(data["water_applied_mm"])
        except (ValueError, TypeError): pass
    elif data.get("rainfall_mm") not in (None, ""):
        try: w_val = float(data["rainfall_mm"])
        except (ValueError, TypeError): pass
    elif data.get("water") not in (None, ""):
        try: w_val = float(data["water"])
        except (ValueError, TypeError): pass

    price_val = None
    for pk in ("price_bdt_per_maund", "price_per_maund", "sale_price", "price"):
        if data.get(pk) not in (None, ""):
            try:
                price_val = float(data[pk])
                break
            except (ValueError, TypeError):
                pass

    cost_val = None
    for ck in ("cost_bdt_per_bigha", "cost_per_bigha", "cost"):
        if data.get(ck) not in (None, ""):
            try:
                cost_val = float(data[ck])
                break
            except (ValueError, TypeError):
                pass

    yr = None
    if data.get("year") not in (None, ""):
        try: yr = int(data["year"])
        except (ValueError, TypeError): yr = 2025

    item = FieldHistory(
        field_id=numeric_id,
        crop=str(data.get("crop", "")).strip() or None,
        season=str(data.get("season", "")).strip() or None,
        year=yr,
        yield_ton_per_ha=y_val,
        water_applied_mm=w_val,
        price_bdt_per_maund=price_val,
        cost_bdt_per_bigha=cost_val,
        notes=data.get("notes"),
        created_at=stamp
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"status": "created", "history": row(item)}

@app.delete("/api/fields/{field_id}/history/{history_id}")
def delete_field_history(field_id: str, history_id: int, user: User | None = Depends(optional_user), db: DbSession = Depends(get_db)):
    numeric_id = int(field_id) if str(field_id).isdigit() else None
    h = db.get(FieldHistory, history_id)
    if not h:
        return {"status": "not_found", "message": "Record not found"}
    if numeric_id and h.field_id != numeric_id:
        return {"status": "error", "message": "Field mismatch"}
    db.delete(h)
    db.commit()
    return {"status": "deleted", "id": history_id}



@app.post("/api/fields/{field_id}/enrich")
def enrich_field_endpoint(
    field_id: str,
    payload: dict = Body(default_factory=dict),
    user: User | None = Depends(optional_user),
    db: DbSession = Depends(get_db),
):
    """Geospatially enrich field with nearest district, POWER cell, and SoilGrids 250m properties."""
    from src.compute.field_enrichment import enrich_field_data
    is_offline = bool(os.getenv("OFFLINE") == "1")
    data = payload or {}

    field_record = None
    if field_id not in {"demo", "field_demo", "demo_check_field", "0"}:
        try:
            numeric_field_id = int(field_id)
        except ValueError as error:
            raise HTTPException(404, "Field not found.") from error
        field_record = owned_field(db, numeric_field_id, user)

    lat = data.get("latitude") if data.get("latitude") is not None else data.get("lat")
    lon = data.get("longitude") if data.get("longitude") is not None else data.get("lon")
    area_ha = data.get("area_ha") if data.get("area_ha") is not None else data.get("field_size_ha")
    if field_record is not None:
        if lat is None:
            lat = field_record.latitude
        if lon is None:
            lon = field_record.longitude
        if area_ha is None:
            area_ha = field_record.area_ha
        if data.get("soil_ph") is None:
            data["soil_ph"] = field_record.soil_ph
        if data.get("organic_matter") is None:
            data["organic_matter"] = field_record.organic_matter
        if data.get("soil_texture") is None:
            data["soil_texture"] = field_record.soil_texture

    if lat is None or lon is None or area_ha is None:
        raise HTTPException(422, "Field coordinates and area are required; save them on the field or provide them explicitly.")

    try:
        lat = float(lat)
        lon = float(lon)
        area_ha = float(area_ha)
    except (ValueError, TypeError) as e:
        raise HTTPException(400, f"Invalid coordinates or area: {e}")
    if (
        not math.isfinite(lat) or not -90 <= lat <= 90
        or not math.isfinite(lon) or not -180 <= lon <= 180
        or not math.isfinite(area_ha) or area_ha <= 0
    ):
        raise HTTPException(422, "Coordinates or area are outside the supported range.")

    result = enrich_field_data(
        field_id=str(field_id),
        latitude=lat,
        longitude=lon,
        area_ha=area_ha,
        user_overrides=data,
        offline=is_offline,
    )
    if field_record is not None:
        geo = result.get("geography", {})
        soil = result.get("soil", {})
        if geo.get("nearest_district"):
            field_record.district = geo.get("nearest_district")
        if geo.get("distance_to_district_km") is not None:
            field_record.nearest_district_distance_km = float(geo.get("distance_to_district_km"))
        if geo.get("power_cell"):
            field_record.power_cell = geo.get("power_cell")
        if geo.get("imerg_cell"):
            field_record.imerg_cell = geo.get("imerg_cell")
        if soil.get("texture_class") or soil.get("texture"):
            field_record.soilgrids_soil = soil.get("texture_class") or soil.get("texture")
        if soil.get("sand_pct") is not None:
            field_record.soilgrids_sand = float(soil["sand_pct"])
        if soil.get("silt_pct") is not None:
            field_record.soilgrids_silt = float(soil["silt_pct"])
        if soil.get("clay_pct") is not None:
            field_record.soilgrids_clay = float(soil["clay_pct"])
        if soil.get("ph") is not None:
            field_record.soilgrids_ph = float(soil["ph"])
        if soil.get("organic_matter_pct") is not None:
            field_record.soilgrids_soc = round(float(soil["organic_matter_pct"]) / 1.724, 2)
        if geo.get("nearest_district") in {"sunamganj", "netrokona", "kishoreganj", "habiganj", "moulvibazar"}:
            field_record.seasonally_flooded = True
        db.commit()
    return finite_json_value(jsonable_encoder(result))

@app.post("/api/analyses",status_code=201)
def create_analysis(
    payload: Payload,
    user: User = Depends(require_user),
    db: DbSession = Depends(get_db),
):
    data = payload.model_dump()
    field_id = data.get("field_id")
    farm_id = data.get("farm_id")
    if field_id is not None:
        field = owned_field(db, int(field_id), user)
        if farm_id is None:
            farm_id = field.farm_id
    if farm_id is not None:
        owned_farm(db, int(farm_id), user)

    stamp = now()
    item = Analysis(
        user_id=user.id,
        farm_id=farm_id,
        field_id=field_id,
        start_date=data.get("start_date"),
        end_date=data.get("end_date"),
        priority=data.get("priority"),
        season=data.get("season"),
        include_crop_history=bool(data.get("include_history", False)),
        mode=data.get("mode", "offline"),
        status="pending",
        summary_json={"workflow_payload": data},
        created_at=stamp,
        updated_at=stamp,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    result = execute_analysis(item, user, db)
    return {
        "status": "created",
        "analysis": result["analysis"],
        "summary": result["summary"],
    }

def execute_analysis(item: Analysis, user: User, db: DbSession) -> dict[str, Any]:
    data = dict((item.summary_json or {}).get("workflow_payload") or {})
    if item.field_id is not None:
        field = owned_field(db, item.field_id, user)
        data = use_field_record(data, field, db)

    stamp = now()
    item.status = "running"
    item.started_at = stamp
    item.updated_at = stamp
    item.error_message = None
    db.commit()
    try:
        result = workflow_result(data, {"id": user.id})
    except Exception as error:
        item.status = "failed"
        item.error_message = (
            str(error.detail) if isinstance(error, HTTPException) else str(error)
        )
        item.completed_at = now()
        item.updated_at = item.completed_at
        db.commit()
        raise

    item.status = "completed"
    item.summary_json = {"workflow_payload": data, "result": result}
    item.completed_at = now()
    item.updated_at = item.completed_at
    db.commit()
    db.refresh(item)
    return {"status": "ok", "analysis": row(item), "summary": result}

@app.post("/api/analyses/{analysis_id}/run")
def run_analysis(
    analysis_id: int,
    user: User = Depends(require_user),
    db: DbSession = Depends(get_db),
):
    item = db.get(Analysis, analysis_id)
    if not item or item.user_id != user.id:
        raise HTTPException(404, "Analysis not found or not owned by this user.")
    return execute_analysis(item, user, db)

@app.get("/api/analyses")
def analyses(user:User=Depends(require_user),db:DbSession=Depends(get_db)):
    return {"status":"ok","analyses":[row(x) for x in db.scalars(select(Analysis).where(Analysis.user_id==user.id).order_by(Analysis.id.desc()))]}

# -----------------------------------------------------------------------------
# PHASE 4: PROVENANCE & RELIABILITY ENDPOINTS
# -----------------------------------------------------------------------------

@app.get("/api/provenance/summary")
def provenance_summary():
    """Returns system-wide data reliability score, provenance breakdown, and scientific disclaimer."""
    from src.data.provenance_schema import calculate_data_reliability_metrics
    return calculate_data_reliability_metrics()

@app.get("/api/provenance/registry")
def provenance_registry():
    """Returns comprehensive parameter provenance catalog across weather, crops, soil, and market."""
    from src.data.provenance_schema import build_system_parameter_registry
    records = build_system_parameter_registry()
    return {
        "count": len(records),
        "parameters": [r.to_dict() for r in records],
    }

# -----------------------------------------------------------------------------
# PHASE 4: SYNTHETIC DATA LAB ENDPOINTS
# -----------------------------------------------------------------------------

@app.post("/api/synthetic-data/generate")
def synthetic_data_generate(payload: Payload):
    """Deterministically generate synthetic farm scenarios based on seed and agronomic constraints."""
    from src.experiments.synthetic_data_lab import SyntheticLabConfig, generate_synthetic_farm_scenarios
    data = payload.model_dump()
    cfg = SyntheticLabConfig(
        seed=int(data.get("seed", 42)),
        num_scenarios=int(data.get("num_scenarios", 8)),
        area_min_ha=float(data.get("area_min_ha", 0.5)),
        area_max_ha=float(data.get("area_max_ha", 12.0)),
        ph_min=float(data.get("ph_min", 5.2)),
        ph_max=float(data.get("ph_max", 7.6)),
        om_min=float(data.get("om_min", 1.0)),
        om_max=float(data.get("om_max", 3.0)),
        irrigation_min_mm=float(data.get("irrigation_min_mm", 100.0)),
        irrigation_max_mm=float(data.get("irrigation_max_mm", 800.0)),
        assumption_profile=str(data.get("assumption_profile", "standard")),
        include_stress_scenarios=bool(data.get("include_stress_scenarios", True)),
    )
    return generate_synthetic_farm_scenarios(cfg)

@app.post("/api/synthetic-data/export")
def synthetic_data_export(payload: Payload):
    """Export generated synthetic scenarios as a downloadable CSV with full metadata headers."""
    from src.experiments.synthetic_data_lab import SyntheticLabConfig, generate_synthetic_farm_scenarios, export_synthetic_scenarios_csv
    data = payload.model_dump()
    cfg = SyntheticLabConfig(
        seed=int(data.get("seed", 42)),
        num_scenarios=int(data.get("num_scenarios", 8)),
        area_min_ha=float(data.get("area_min_ha", 0.5)),
        area_max_ha=float(data.get("area_max_ha", 12.0)),
        assumption_profile=str(data.get("assumption_profile", "standard")),
    )
    gen = generate_synthetic_farm_scenarios(cfg)
    csv_content = export_synthetic_scenarios_csv(gen["scenarios"], cfg)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=fieldshift_synthetic_scenarios_seed{cfg.seed}.csv"}
    )

# -----------------------------------------------------------------------------
# PHASE 6: MARKET INTELLIGENCE & PROFITABILITY ENDPOINTS
# -----------------------------------------------------------------------------

@app.get("/api/market/overview")
def market_overview(
    q: str | None = None,
    district: str | None = None,
    lat: float | None = None,
    lon: float | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    area_ha: float | None = None,
):
    """Returns verified Bangladesh crop pricing catalog, official FAOSTAT trade balance, and field profitability."""
    from src.data.market_intelligence import get_market_overview
    actual_lat = lat if lat is not None else latitude
    actual_lon = lon if lon is not None else longitude
    if (actual_lat is None) != (actual_lon is None):
        raise HTTPException(422, "Latitude and longitude must be provided together.")
    if area_ha is not None and (not math.isfinite(area_ha) or area_ha <= 0):
        raise HTTPException(422, "Field area must be a positive number.")
    return get_market_overview(
        crop_query=q,
        district=district,
        latitude=actual_lat,
        longitude=actual_lon,
        area_ha=area_ha,
    )

@app.post("/api/market/profitability")
def market_profitability(payload: Payload):
    """Calculates crop profitability, cost breakdown, net returns, break-even price, and 3-point scenarios."""
    from src.data.market_intelligence import calculate_crop_profitability
    data = payload.model_dump()
    crop_name = data.get("crop") or data.get("crop_name")
    area_value = data.get("area_ha") if data.get("area_ha") is not None else data.get("field_size_ha")
    if not isinstance(crop_name, str) or not crop_name.strip():
        raise HTTPException(422, "A crop is required for profitability analysis.")
    if area_value is None:
        raise HTTPException(422, "Field area is required for profitability analysis.")
    try:
        area_ha = float(area_value)
    except (TypeError, ValueError) as error:
        raise HTTPException(422, "Field area must be a positive number.") from error
    if not math.isfinite(area_ha) or area_ha <= 0:
        raise HTTPException(422, "Field area must be a positive number.")
    expected_yield = data.get("expected_yield_t_ha")
    if expected_yield is not None:
        expected_yield = float(expected_yield)
    farmgate_price = data.get("farmgate_price_bdt_t")
    if farmgate_price is not None:
        farmgate_price = float(farmgate_price)
    prod_cost = data.get("production_cost_bdt_ha")
    if prod_cost is not None:
        prod_cost = float(prod_cost)
    irrig_cost = float(data.get("irrigation_cost_bdt_ha", 0.0) or 0.0)
    mktg_cost = float(data.get("marketing_cost_bdt_ha", 0.0) or 0.0)
    price_type = str(data.get("price_type", "farmgate"))

    try:
        return calculate_crop_profitability(
            crop_name=crop_name.strip(),
            area_ha=area_ha,
            expected_yield_t_ha=expected_yield,
            farmgate_price_bdt_t=farmgate_price,
            production_cost_bdt_ha=prod_cost,
            irrigation_cost_bdt_ha=irrig_cost,
            marketing_cost_bdt_ha=mktg_cost,
            price_type=price_type,
        )
    except ValueError as e:
        raise HTTPException(400, str(e)) from e

@app.get("/api/market/export")
def market_export():
    """Export Bangladesh benchmark prices to CSV with citations and disclaimers."""
    from src.data.market_intelligence import export_market_catalog_csv
    csv_content = export_market_catalog_csv()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=fieldshift_market_benchmarks.csv"}
    )

# -----------------------------------------------------------------------------
# PHASE 5: REPEATABLE SENSITIVITY ANALYSIS ENDPOINT
# -----------------------------------------------------------------------------

@app.post("/api/scenarios/sensitivity")
def scenarios_sensitivity(payload: Payload, fieldshift_session: str | None = Cookie(None), db: DbSession = Depends(get_db)):
    """Run controlled multi-variable sensitivity sweeps on MILP optimization without mutating baseline field."""
    from src.scenarios.sensitivity_analysis import run_system_sensitivity_analysis
    data = payload.model_dump()
    requested_field_id = data.get("field_id")
    user = None
    if fieldshift_session:
        try:
            user = require_user(fieldshift_session, db)
        except HTTPException:
            user = None

    if requested_field_id not in (None, "", "demo"):
        if user is None:
            raise HTTPException(401, "Sign in to run sensitivity analysis on a registered field.")
        fid = int(requested_field_id)
        field_record = owned_field(db, fid, user)
        data = use_field_record(data, field_record, db)

    steps = data.get("perturbation_steps")
    if steps and isinstance(steps, list):
        steps = [float(s) for s in steps]
    else:
        steps = [-20.0, -10.0, 10.0, 20.0]

    return run_system_sensitivity_analysis(data, perturbation_steps=steps)


# -----------------------------------------------------------------------------
# MULTI-FIELD EXPERIMENT & SENSITIVITY LAB ENDPOINTS
# -----------------------------------------------------------------------------

@app.get("/api/experiments/multi-field/profiles")
def get_multi_field_profiles():
    """Return the 6 authentic Bangladesh synthetic agricultural field profiles."""
    from src.experiments.multi_field_experiment import SYNTHETIC_FIELD_PROFILES
    return {
        "status": "ok",
        "total_profiles": len(SYNTHETIC_FIELD_PROFILES),
        "profiles": SYNTHETIC_FIELD_PROFILES,
        "data_status": "SYNTHETIC_TEST_DATA",
        "disclaimer": "Synthetic test data for algorithm validation and scientific sensitivity verification. Not empirical observations.",
    }


@app.post("/api/experiments/multi-field/run")
def run_multi_field_experiment_endpoint(
    payload: Payload | None = None,
    db: DbSession = Depends(get_db),
):
    """Execute complete multi-field experiment suite and persist results."""
    from src.experiments.multi_field_experiment import (
        SYNTHETIC_FIELD_PROFILES,
        run_full_field_baseline,
        run_ovat_sensitivity_analysis,
        run_interaction_experiment,
        validate_scientific_invariants,
        persist_experiment_run,
    )
    req_data = payload.model_dump() if hasattr(payload, "model_dump") else (payload or {})
    target_field = req_data.get("field_key")

    fields_to_run = (
        {target_field: SYNTHETIC_FIELD_PROFILES[target_field]}
        if target_field and target_field in SYNTHETIC_FIELD_PROFILES
        else SYNTHETIC_FIELD_PROFILES
    )

    results: dict[str, Any] = {}
    for fkey, prof in fields_to_run.items():
        # Override with custom inputs if user passed edited profile values
        field_cfg = dict(prof)
        if target_field and req_data.get("profile_overrides"):
            field_cfg.update(req_data["profile_overrides"])

        baseline = run_full_field_baseline(field_cfg)
        ovat = run_ovat_sensitivity_analysis(field_cfg)
        interaction = run_interaction_experiment(field_cfg)
        invariants = validate_scientific_invariants(field_cfg)

        f_data = {
            "profile": field_cfg,
            "baseline": baseline,
            "ovat_sensitivity": ovat,
            "interaction_experiment": interaction,
            "scientific_invariants": invariants,
        }
        exp_id = persist_experiment_run(db, fkey, f_data)
        f_data["persisted_experiment_id"] = exp_id
        results[fkey] = f_data

    return {
        "status": "ok",
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "total_fields_executed": len(results),
        "fields": results,
        "data_status": "SYNTHETIC_TEST_DATA",
    }


@app.get("/api/experiments/multi-field/runs")
def list_multi_field_runs(limit: int = 50, db: DbSession = Depends(get_db)):
    """List recent persisted multi-field experiment runs."""
    from src.experiments.multi_field_experiment import list_persisted_experiment_runs
    runs = list_persisted_experiment_runs(db, limit=limit)
    return {"status": "ok", "total_runs": len(runs), "runs": runs}


@app.get("/api/experiments/multi-field/runs/{experiment_id}")
def get_multi_field_run(experiment_id: str, db: DbSession = Depends(get_db)):
    """Retrieve an exact experiment run from the database by ID and confirm reproduction."""
    from src.experiments.multi_field_experiment import load_experiment_run
    run = load_experiment_run(db, experiment_id)
    if not run:
        raise HTTPException(404, f"Experiment run '{experiment_id}' not found.")
    return {"status": "ok", "experiment": run}


@app.get("/api/experiments/multi-field/export.csv")
def export_multi_field_csv_endpoint():
    """Download RFC 4180 CSV report containing baseline and sensitivity rows."""
    from src.experiments.multi_field_experiment import run_all_multi_field_experiments, export_multi_field_csv
    suite = run_all_multi_field_experiments()
    csv_text = export_multi_field_csv(suite)
    return PlainTextResponse(
        csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=fieldshift_multi_field_experiments.csv"},
    )


@app.get("/api/experiments/multi-field/export.json")
def export_multi_field_json_endpoint():
    """Download complete JSON experiment report with scientific metadata and disclaimers."""
    import json
    from src.experiments.multi_field_experiment import run_all_multi_field_experiments
    suite = run_all_multi_field_experiments()
    return Response(
        content=json.dumps(suite, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=fieldshift_multi_field_experiments.json"},
    )




# -----------------------------------------------------------------------------
# FRONTEND SPA STATIC MOUNT & CATCH-ALL ROUTE (ALL-IN-ONE SINGLE URL)
# -----------------------------------------------------------------------------

FRONTEND_DIST = ROOT_DIR / "frontend" / "dist"
if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="frontend-assets")

    @app.get("/", include_in_schema=False)
    def serve_frontend_root():
        return FileResponse(FRONTEND_DIST / "index.html")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend_spa(full_path: str):
        # Allow API endpoints, Swagger, and OpenAPI docs through
        if (
            full_path == "api"
            or full_path.startswith("api/")
            or full_path in ("docs", "redoc", "openapi.json")
            or full_path.startswith("docs/")
            or full_path.startswith("redoc/")
        ):
            raise HTTPException(404, "Endpoint not found")
        file_path = FRONTEND_DIST / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")
