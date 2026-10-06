"""Simple web app for the FieldShift dashboard and offline demo workflow.

This app keeps the Python AI pipeline in src/ and exposes a small browser UI
through the app/ directory. It intentionally uses the repository's real modules
instead of re-implementing ML, MILP, or RL logic in JavaScript.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import numbers
import os
import secrets
import sqlite3
import threading
import time
from datetime import date, datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

import requests

PROJECT_ROOT = Path(__file__).resolve().parents[1]
APP_ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("FIELDSHIFT_DB_PATH", str(PROJECT_ROOT / "data" / "fieldshift.db")))
STATIC_FILES = {
    "/": APP_ROOT / "index.html",
    "/index.html": APP_ROOT / "index.html",
    "/styles.css": APP_ROOT / "styles.css",
    "/app.js": APP_ROOT / "app.js",
}
_GEOCODE_CACHE: dict[tuple[float, float], str | None] = {}
_GEOCODE_LAST_REQUEST = 0.0
_GEOCODE_LOCK = threading.Lock()


def _location_weather(payload: dict[str, Any]) -> dict[str, Any]:
    """Return a place label and recent daily NASA POWER observations for coordinates."""
    def coordinate(key: str, minimum: float, maximum: float) -> float:
        raw = payload.get(key)
        if isinstance(raw, bool):
            raise ValueError(f"{key} must be a valid number.")
        try:
            value = float(raw)
        except (TypeError, ValueError) as error:
            raise ValueError(f"{key} must be a valid number.") from error
        if not math.isfinite(value) or not minimum <= value <= maximum:
            raise ValueError(f"{key} must be between {minimum:g} and {maximum:g}.")
        return value

    latitude = coordinate("latitude", -90, 90)
    longitude = coordinate("longitude", -180, 180)
    location_name = None
    location_message = None
    cache_key = (round(latitude, 4), round(longitude, 4))

    if cache_key in _GEOCODE_CACHE and _GEOCODE_CACHE[cache_key] is not None:
        location_name = _GEOCODE_CACHE[cache_key]
    else:
        try:
            global _GEOCODE_LAST_REQUEST
            with _GEOCODE_LOCK:
                wait_seconds = 1.0 - (time.monotonic() - _GEOCODE_LAST_REQUEST)
                if wait_seconds > 0:
                    time.sleep(wait_seconds)
                response = requests.get(
                    "https://nominatim.openstreetmap.org/reverse",
                    params={
                        "format": "jsonv2",
                        "lat": latitude,
                        "lon": longitude,
                        "zoom": 10,
                        "addressdetails": 1,
                    },
                    headers={"User-Agent": "FieldShift/1.0 (farm planning research prototype)"},
                    timeout=8,
                )
                _GEOCODE_LAST_REQUEST = time.monotonic()
            response.raise_for_status()
            geocoded = response.json()
            address = geocoded.get("address", {}) if isinstance(geocoded, dict) else {}
            if not isinstance(address, dict):
                address = {}
            locality = (
                address.get("city")
                or address.get("town")
                or address.get("village")
                or address.get("municipality")
                or address.get("county")
                or address.get("state")
            )
            parts = [
                part for part in (locality, address.get("state"), address.get("country"))
                if part and part != locality
            ]
            if locality:
                location_name = ", ".join([locality, *parts[:2]])
            elif address.get("country"):
                location_name = address["country"]
            _GEOCODE_CACHE[cache_key] = location_name
            if len(_GEOCODE_CACHE) > 256:
                _GEOCODE_CACHE.pop(next(iter(_GEOCODE_CACHE)))
        except (OSError, ValueError, requests.RequestException):
            location_message = "Place name lookup is unavailable; coordinates are shown instead."

    from src.data.nasa_power import fetch_recent_nasa_power

    observations = fetch_recent_nasa_power(
        latitude,
        longitude,
        days=14,
        processing_lag_days=0,
        save=False,
    )
    valid_temperature = observations.loc[observations["temperature"].notna()]
    if valid_temperature.empty:
        weather = {
            "temperature_c": None,
            "temp_min_c": None,
            "temp_max_c": None,
            "observation_date": None,
            "status": "unavailable",
        }
    else:
        latest = valid_temperature.iloc[-1]
        weather = {
            "temperature_c": float(latest["temperature"]),
            "temp_min_c": float(latest["temp_min"]) if math.isfinite(float(latest["temp_min"])) else None,
            "temp_max_c": float(latest["temp_max"]) if math.isfinite(float(latest["temp_max"])) else None,
            "observation_date": latest["date"].date().isoformat(),
            "status": "observed",
        }

    requested_through = date.today().isoformat()
    return {
        "status": "ok",
        "location_name": location_name,
        "location_status": "resolved" if location_name else "unavailable",
        "location_message": location_message,
        "latitude": latitude,
        "longitude": longitude,
        "weather_source": "NASA POWER Daily Point API",
        "weather_requested_through": requested_through,
        "weather_note": (
            "The observation date shown is the latest valid daily measurement returned. "
            "NASA POWER can have a data delay and is not real-time."
        ),
        "weather": weather,
        "attribution": {
            "weather": "NASA POWER",
            "location": "OpenStreetMap contributors",
        },
    }


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                last_login TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS farms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS fields (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                farm_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                latitude REAL,
                longitude REAL,
                area_ha REAL,
                soil_texture TEXT,
                organic_matter REAL,
                irrigation_capacity_mm REAL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(farm_id) REFERENCES farms(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS field_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                field_id INTEGER NOT NULL,
                crop TEXT,
                season TEXT,
                year INTEGER,
                notes TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(field_id) REFERENCES fields(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                farm_id INTEGER,
                field_id INTEGER,
                start_date TEXT,
                end_date TEXT,
                priority TEXT,
                season TEXT,
                include_crop_history INTEGER DEFAULT 0,
                mode TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                summary_json TEXT,
                created_at TEXT NOT NULL,
                started_at TEXT,
                completed_at TEXT,
                error_message TEXT,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(farm_id) REFERENCES farms(id),
                FOREIGN KEY(field_id) REFERENCES fields(id)
            )
            """
        )
        analysis_columns = {
            row[1] for row in conn.execute("PRAGMA table_info(analyses)").fetchall()
        }
        analysis_migrations = {
            "field_id": "INTEGER",
            "start_date": "TEXT",
            "end_date": "TEXT",
            "priority": "TEXT",
            "season": "TEXT",
            "include_crop_history": "INTEGER DEFAULT 0",
            "mode": "TEXT DEFAULT 'offline'",
            "started_at": "TEXT",
            "completed_at": "TEXT",
            "error_message": "TEXT",
        }
        for column, definition in analysis_migrations.items():
            if column not in analysis_columns:
                conn.execute(f"ALTER TABLE analyses ADD COLUMN {column} {definition}")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS weather_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analysis_run_id INTEGER NOT NULL,
                source TEXT,
                latitude REAL,
                longitude REAL,
                date TEXT,
                temperature REAL,
                rainfall REAL,
                soil_moisture REAL,
                other_variables TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(analysis_run_id) REFERENCES analyses(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS ml_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analysis_run_id INTEGER NOT NULL,
                prediction REAL,
                model_name TEXT,
                model_version TEXT,
                metrics TEXT,
                features_used TEXT,
                research_boundary TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(analysis_run_id) REFERENCES analyses(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS rotation_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analysis_run_id INTEGER NOT NULL,
                optimization_status TEXT,
                crop_sequence TEXT,
                objective_value REAL,
                constraints_summary TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(analysis_run_id) REFERENCES analyses(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS adaptive_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analysis_run_id INTEGER NOT NULL,
                action TEXT,
                action_type TEXT,
                reward REAL,
                safety_status TEXT,
                state_before TEXT,
                state_after TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(analysis_run_id) REFERENCES analyses(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS validation_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analysis_run_id INTEGER NOT NULL,
                validation_type TEXT,
                status TEXT,
                message TEXT,
                details TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(analysis_run_id) REFERENCES analyses(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS provenance_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analysis_run_id INTEGER NOT NULL,
                source TEXT,
                source_type TEXT,
                mode TEXT,
                metadata TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(analysis_run_id) REFERENCES analyses(id)
            )
            """
        )
        conn.commit()


def get_db_connection() -> sqlite3.Connection:
    init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _optional_db_number(
    value: Any,
    name: str,
    *,
    minimum: float | None = None,
    maximum: float | None = None,
) -> float | None:
    if value in (None, ""):
        return None
    if isinstance(value, bool):
        raise ValueError(f"{name} must be a finite number.")
    try:
        number = float(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"{name} must be a finite number.") from error
    if not math.isfinite(number):
        raise ValueError(f"{name} must be a finite number.")
    if minimum is not None and number < minimum:
        raise ValueError(f"{name} must be at least {minimum}.")
    if maximum is not None and number > maximum:
        raise ValueError(f"{name} must be at most {maximum}.")
    return number


def _sanitize_json_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (str, bool)):
        return value
    if isinstance(value, numbers.Integral):
        return int(value)
    if isinstance(value, numbers.Number):
        try:
            numeric_value = float(value)
        except (TypeError, ValueError, OverflowError):
            return None
        if not math.isfinite(numeric_value):
            return None
        return numeric_value
    if isinstance(value, dict):
        return {str(key): _sanitize_json_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_sanitize_json_value(item) for item in value]
    if hasattr(value, "item") and not isinstance(value, (str, bytes)):
        try:
            return _sanitize_json_value(value.item())
        except (TypeError, ValueError):
            pass
    if hasattr(value, "tolist") and not isinstance(value, (str, bytes)):
        try:
            return _sanitize_json_value(value.tolist())
        except (TypeError, ValueError):
            pass
    if hasattr(value, "to_dict"):
        try:
            return _sanitize_json_value(value.to_dict())
        except Exception:
            pass
    if hasattr(value, "isoformat"):
        try:
            return value.isoformat()
        except Exception:
            pass
    if value.__class__.__name__ in {"NAType", "NaTType"}:
        return None
    return str(value)


def _json_response(payload: Any, status: int = 200):
    safe_payload = _sanitize_json_value(payload)
    body = json.dumps(
        safe_payload,
        indent=2,
        ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")
    return status, body


def _parse_cookies(header_value: str | None) -> dict[str, str]:
    if not header_value:
        return {}
    result: dict[str, str] = {}
    for item in header_value.split(";"):
        key, _, value = item.strip().partition("=")
        if key:
            result[key] = value
    return result


def _require_auth(handler: BaseHTTPRequestHandler) -> dict[str, Any] | None:
    cookies = _parse_cookies(handler.headers.get("Cookie"))
    session_token = cookies.get("fieldshift_session")
    if not session_token:
        return None
    with get_db_connection() as conn:
        row = conn.execute(
            "SELECT s.user_id, u.name, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND datetime(s.expires_at) > datetime('now') AND u.is_active = 1",
            (session_token,),
        ).fetchone()
    if row is None:
        return None
    return {"id": row["user_id"], "name": row["name"], "email": row["email"]}


def _login_user(handler: BaseHTTPRequestHandler, user_id: int) -> None:
    token = secrets.token_urlsafe(32)
    created_at = datetime.now(timezone.utc)
    with get_db_connection() as conn:
        conn.execute(
            "INSERT INTO sessions (user_id, token, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (
                user_id,
                token,
                created_at.isoformat(),
                (created_at + timedelta(days=7)).isoformat(),
            ),
        )
        conn.execute("UPDATE users SET last_login = ?, updated_at = ? WHERE id = ?", (created_at.isoformat(), created_at.isoformat(), user_id))
        conn.commit()
    handler._pending_session_cookie = (
        f"fieldshift_session={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800"
    )


def _read_body(handler: BaseHTTPRequestHandler) -> dict[str, Any]:
    content_length = int(handler.headers.get("Content-Length", "0") or "0")
    if content_length <= 0:
        return {}
    raw = handler.rfile.read(content_length)
    if not raw:
        return {}
    text = raw.decode("utf-8", errors="replace")
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        return {"raw_input": text}
    return payload if isinstance(payload, dict) else {}


def _password_hash(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 310_000)
    return f"pbkdf2_sha256$310000${salt.hex()}${digest.hex()}"


def _verify_password(password: str, stored_hash: str) -> bool:
    if stored_hash.startswith("pbkdf2_sha256$"):
        try:
            _, rounds, salt_hex, digest_hex = stored_hash.split("$", 3)
            digest = hashlib.pbkdf2_hmac(
                "sha256",
                password.encode("utf-8"),
                bytes.fromhex(salt_hex),
                int(rounds),
            )
            return secrets.compare_digest(digest.hex(), digest_hex)
        except (ValueError, TypeError):
            return False
    # Preserve sign-in compatibility with accounts created by the first local prototype.
    return secrets.compare_digest(
        hashlib.sha256(password.encode("utf-8")).hexdigest(),
        stored_hash,
    )


def _serve_static_file(path: str):
    if path not in STATIC_FILES:
        return None
    file_path = STATIC_FILES[path]
    if not file_path.exists():
        return None
    return file_path.read_bytes(), file_path.suffix.lstrip(".")


def _health_payload() -> dict[str, Any]:
    return {
        "status": "ok",
        "project": "FieldShift",
        "mode": "offline_demo",
        "synthetic_boundary": True,
        "uses_repository_modules": True,
        "dashboard": "available",
        "notes": [
            "Live NASA POWER retrieval is available only when explicitly selected.",
            "Offline mode uses bundled data and the existing FieldShift pipeline.",
        ],
    }


def _demo_summary(
    payload: dict[str, Any] | None = None,
    user: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if payload and any(
        key in payload
        for key in ("latitude", "longitude", "start_date", "end_date", "field_id")
    ):
        return _run_research_workflow(payload, user)

    from src.experiments.integrated_research_demo import _json_safe, run_integration_demo

    mode = (payload or {}).get("mode", "offline")
    if mode not in {"offline", "demo", "live"}:
        mode = "offline"
    if mode == "live":
        return {
            "status": "unsupported",
            "mode": "live",
            "reason": "Live NASA POWER retrieval is intentionally disabled in this offline web app.",
            "fallback": "offline_demo",
            "summary": None,
        }

    summary = run_integration_demo(
        output_path=PROJECT_ROOT / "artifacts" / "integrated_research_demo_summary.json"
    )
    return {
        "status": "ok",
        "mode": "offline",
        "summary": _json_safe(summary),
    }


def _run_research_workflow(
    payload: dict[str, Any],
    user: dict[str, Any] | None = None,
) -> dict[str, Any]:
    import pandas as pd

    from src.data.crops import load_crop_knowledge
    from src.data.field_history import FIELD_HISTORY_COLUMNS, load_field_history
    from src.data.nasa_power import fetch_nasa_power
    from src.data.smap import load_smap_data
    from src.data.soil import SOIL_COLUMNS, load_soil_data
    from src.experiments.integrated_research_demo import (
        DEFAULT_NASA_PATH,
        PLAN_PERIODS,
    )
    from src.experiments.synthetic_ml_demo import (
        MODEL_PATH,
        load_synthetic_yield_model,
        predict_synthetic_yield,
    )
    from src.explainability.explanations import explain_milp_plan, explain_ml_prediction
    from src.integration.milp_rl import run_synthetic_policy_step
    from src.optimizer.strategies import (
        DEFAULT_PRIORITY_PROFILES,
        generate_rotation_strategies,
    )
    from src.optimizer.validation import audit_all_strategies
    from src.preprocessing.features import build_features
    from src.rl.agent import DeterministicBaselinePolicy
    from src.rl.environment import FieldShiftEnvironment
    from src.rl.synthetic_q_learning import (
        DEFAULT_POLICY_PATH,
        load_synthetic_q_policy,
    )
    from src.scenarios.stress_test import run_stress_tests
    from src.scenarios.counterfactual import run_counterfactual_analysis
    from src.data.anomaly_detection import detect_anomalies
    from src.state.field_state import build_field_state

    form = payload or {}
    mode = str(form.get("mode", "offline")).strip().lower()
    if mode in {"demo", "offline_demo"}:
        mode = "offline"
    if mode not in {"offline", "live"}:
        raise ValueError("mode must be offline or live.")

    def required_text(key: str) -> str:
        value = str(form.get(key, "")).strip()
        if not value:
            raise ValueError(f"{key} is required.")
        return value

    def finite_number(key: str, *, required: bool = False, minimum: float | None = None, maximum: float | None = None) -> float | None:
        raw = form.get(key)
        if raw in (None, ""):
            if required:
                raise ValueError(f"{key} is required.")
            return None
        if isinstance(raw, bool):
            raise ValueError(f"{key} must be a finite number.")
        try:
            value = float(raw)
        except (TypeError, ValueError) as error:
            raise ValueError(f"{key} must be a finite number.") from error
        if not math.isfinite(value):
            raise ValueError(f"{key} must be a finite number.")
        if minimum is not None and value < minimum:
            raise ValueError(f"{key} must be at least {minimum}.")
        if maximum is not None and value > maximum:
            raise ValueError(f"{key} must be at most {maximum}.")
        return value

    latitude = finite_number("latitude", required=True, minimum=-90, maximum=90)
    longitude = finite_number("longitude", required=True, minimum=-180, maximum=180)
    start_date = required_text("start_date")
    end_date = required_text("end_date")
    start = pd.Timestamp(start_date).normalize()
    end = pd.Timestamp(end_date).normalize()
    if pd.isna(start) or pd.isna(end) or start > end:
        raise ValueError("start_date and end_date must be valid, with start_date on or before end_date.")
    if (end - start).days > 730:
        raise ValueError("The requested weather period cannot exceed 731 days.")

    field_size = finite_number("field_size_ha", minimum=0)
    if field_size is None and "area_ha" in form:
        field_size = finite_number("area_ha", minimum=0)
    if field_size == 0:
        raise ValueError("field_size_ha must be greater than zero when provided.")
    organic_matter = finite_number("organic_matter", minimum=0, maximum=100)
    irrigation_capacity = finite_number("irrigation_capacity_mm", minimum=0)
    previous_crop = str(form.get("previous_crop", "")).strip()
    previous_crop_year = finite_number(
        "previous_crop_year",
        minimum=1,
        maximum=9999,
    ) if previous_crop else None
    if previous_crop and previous_crop_year is not None:
        if not previous_crop_year.is_integer():
            raise ValueError("previous_crop_year must be a whole year.")
        if int(previous_crop_year) >= end.year:
            raise ValueError("previous_crop_year must be before the analysis year.")
    include_history = form.get("include_history", True)
    if isinstance(include_history, str):
        include_history = include_history.strip().lower() in {"true", "1", "yes", "on"}
    include_history = bool(include_history)
    soil_texture = str(form.get("soil_texture", "")).strip()
    allowed_textures = {"loam", "silty_loam", "clay_loam", "unknown"}
    if soil_texture and soil_texture not in allowed_textures:
        raise ValueError("soil_texture is not one of the supported values.")
    priority = str(form.get("priority", "profit")).strip().lower()
    priority_map = {
        "profit": "profit_focused",
        "water_efficiency": "water_focused",
        "soil_health": "soil_focused",
        "balanced": "balanced",
    }
    if priority not in priority_map:
        raise ValueError("priority must be profit, water_efficiency, soil_health, or balanced.")
    selected_strategy_name = priority_map[priority]

    crops = load_crop_knowledge()
    if previous_crop and not crops["crop"].str.casefold().eq(previous_crop.casefold()).any():
        raise ValueError("previous_crop must match a crop in the repository crop catalog.")
    saved_field = None
    user_history = None
    requested_field_id = form.get("field_id")
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
                pass
    is_registered_field = (saved_field is not None and str(saved_field.get("id")) != "demo") or (form.get("field_id") not in (None, "", "demo"))
    if mode == "live" or is_registered_field:
        try:
            power = fetch_nasa_power(latitude, longitude, start, end)
            mode = "live"
        except Exception as err:
            raise ValueError(
                f"NASA POWER unavailable: Could not fetch environmental observations for field coordinates ({latitude:.4f}, {longitude:.4f}). "
                f"Error detail: {err}"
            ) from err
        field_id = str(saved_field["id"] if saved_field else form.get("field_id", "request_field")).strip()
        from src.data.field_history import FIELD_HISTORY_COLUMNS
        from src.data.smap import SMAP_COLUMNS
        from src.data.soil import SOIL_COLUMNS

        soil = pd.DataFrame(columns=SOIL_COLUMNS)
        history = (
            user_history
            if include_history and user_history is not None
            else pd.DataFrame(columns=FIELD_HISTORY_COLUMNS)
        )
        smap = pd.DataFrame(columns=SMAP_COLUMNS)
    elif mode == "offline":
        if abs(latitude - 23.8103) > 0.0001 or abs(longitude - 90.4125) > 0.0001:
            raise ValueError(
                "Bundled offline weather covers only the documented demo coordinates "
                "23.8103, 90.4125. Choose NASA POWER mode for other locations."
            )
        if not DEFAULT_NASA_PATH.is_file():
            raise FileNotFoundError(f"Bundled NASA POWER demo CSV was not found: {DEFAULT_NASA_PATH}")
        power = pd.read_csv(DEFAULT_NASA_PATH)
        power["date"] = pd.to_datetime(power["date"], errors="coerce")
        available_dates = power["date"].dropna()
        if available_dates.empty or start < available_dates.min().normalize() or end > available_dates.max().normalize():
            raise ValueError(
                "Bundled offline weather covers "
                f"{available_dates.min().date() if not available_dates.empty else 'no dates'} through "
                f"{available_dates.max().date() if not available_dates.empty else 'no dates'}. "
                "Choose NASA POWER mode for another period."
            )
        power = power.loc[power["date"].between(start, end)].reset_index(drop=True)
        field_id = str(saved_field["id"]) if saved_field else "field_demo"
        soil = (
            load_soil_data(field_id="field_demo", as_of_date=end)
            if saved_field is None
            else pd.DataFrame(columns=SOIL_COLUMNS)
        )
        if not include_history:
            history = pd.DataFrame(columns=FIELD_HISTORY_COLUMNS)
        elif saved_field is not None:
            history = user_history
        else:
            history = load_field_history(field_id=field_id, as_of_date=end)
        smap = load_smap_data(latitude, longitude, start, end)

    if include_history and previous_crop and previous_crop_year is not None:
        farmer_history = pd.DataFrame(
            [
                {
                    "field_id": field_id,
                    "year": int(previous_crop_year),
                    "season": str(form.get("season") or "unknown"),
                    "crop": previous_crop,
                    "yield": None,
                    "irrigation": "unknown",
                    "source": "farmer_provided",
                    "data_status": "observed",
                }
            ],
            columns=FIELD_HISTORY_COLUMNS,
        )
        history = pd.concat([history, farmer_history], ignore_index=True)

    state = build_field_state(
        field_id,
        latitude,
        longitude,
        end,
        power,
        smap_data=smap,
        soil_data=soil,
        field_history_data=history,
        crop_knowledge=crops,
    )
    farmer_inputs_applied = []
    if saved_field is not None and field_size is None and saved_field.get("area_ha") is not None:
        field_size = float(saved_field["area_ha"])
    if saved_field is not None and organic_matter is None and saved_field.get("organic_matter") is not None:
        organic_matter = float(saved_field["organic_matter"])
    if saved_field is not None and irrigation_capacity is None and saved_field.get("irrigation_capacity_mm") is not None:
        irrigation_capacity = float(saved_field["irrigation_capacity_mm"])
    if saved_field is not None and not soil_texture:
        soil_texture = str(saved_field.get("soil_texture") or "")
    if field_size is not None:
        state.field_size_ha = field_size
        state.area_ha = field_size
        farmer_inputs_applied.append("field_size_ha")
    if irrigation_capacity is not None:
        state.irrigation_capacity_mm = irrigation_capacity
        farmer_inputs_applied.append("irrigation_capacity_mm")
    if soil_texture and soil_texture != "unknown":
        state.texture = soil_texture
        state.soil_source = "farmer_provided"
        state.data_status["soil"] = "observed"
        farmer_inputs_applied.append("soil_texture")
    if organic_matter is not None:
        state.organic_matter = organic_matter
        state.soil_source = "farmer_provided"
        state.data_status["soil"] = "observed"
        farmer_inputs_applied.append("organic_matter")
    if mode == "offline":
        state.environment_source = "bundled NASA POWER demo CSV"
        state.data_status["environment"] = "demo"
    else:
        state.environment_source = "NASA POWER Daily Point API"
        state.data_status["environment"] = "observed"

    custom_temp = finite_number("temperature_c") or finite_number("temperature")
    if custom_temp is not None:
        state.temperature = float(custom_temp)
        farmer_inputs_applied.append("temperature_c")

    custom_ph = finite_number("soil_ph") or finite_number("ph")
    if custom_ph is not None:
        state.ph = float(custom_ph)
        state.soil_source = "farmer_provided"
        state.data_status["soil"] = "observed"
        farmer_inputs_applied.append("soil_ph")

    features = build_features(state, environmental_history=power)
    
    available_water_calc = None
    if "available_water_mm" in form and form.get("available_water_mm") not in (None, ""):
        available_water_calc = float(form.get("available_water_mm"))
        features["available_water_mm"] = available_water_calc
        features["available_water_source"] = "user_override"

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Synthetic demo model artifact was not found: {MODEL_PATH}")
    model = load_synthetic_yield_model(MODEL_PATH)
    prediction = predict_synthetic_yield(state, model=model)
    strategies = generate_rotation_strategies(
        field_state=state,
        crops=crops,
        features=features,
        field_history=history,
        priority_profiles=DEFAULT_PRIORITY_PROFILES,
        planning_periods=list(PLAN_PERIODS),
        environmental_history=power,
    )
    validation_diagnostics = audit_all_strategies(strategies, field_state=state, crops=crops)
    selected_plan = strategies["strategies"][selected_strategy_name]
    ml_explanation = explain_ml_prediction(state, prediction=prediction, model=model)
    milp_explanation = explain_milp_plan(selected_plan, field_state=state, crops=crops)

    # Compute detailed field-level metrics across all strategies
    crop_lookup = {row["crop"]: row.to_dict() for _, row in crops.iterrows()}
    def compute_metrics(plan_dict):
        rot = plan_dict.get("selected_crop_by_period") or {}
        crops_list = [rot[p] for p in sorted(rot.keys()) if rot.get(p) in crop_lookup]
        area = field_size if field_size is not None and field_size > 0 else 1.0
        if not crops_list:
            return {
                "field_size_ha": area,
                "cumulative_yield_t_ha": None,
                "mean_yield_t_ha": None,
                "total_harvest_tons": None,
                "annual_harvest_tons": None,
                "profit_bdt_per_ha": plan_dict.get("profit_component"),
                "total_profit_bdt": None,
                "annual_profit_bdt": None,
                "total_water_requirement_mm": None,
                "mean_water_requirement_mm": None,
                "water_efficiency_score": plan_dict.get("water_component"),
                "soil_health_score": plan_dict.get("soil_component"),
                "objective_score": plan_dict.get("objective_value"),
                "legume_fraction": 0.0,
                "legume_season_count": 0,
                "crop_diversity_count": 0,
            }
        dyn_matrix = (
            plan_dict.get("dynamic_agronomic_matrix", {}).get("crop_season_matrix")
            or plan_dict.get("dynamic_crop_matrix")
            or {}
        )
        yields = []
        waters = []
        legumes = []
        for p in sorted(rot.keys()):
            c = rot[p]
            if c not in crop_lookup:
                continue
            dyn_info = dyn_matrix.get(p, {}).get(c, {})
            y = float(dyn_info.get("dynamic_yield_t_ha", crop_lookup[c].get("expected_yield", 1.0)))
            wb = dyn_info.get("water_balance", {})
            w = float(wb.get("crop_et_mm", crop_lookup[c].get("water_requirement", 400.0)))
            is_leg = bool(crop_lookup[c].get("is_legume", False))
            yields.append(y)
            waters.append(w)
            legumes.append(is_leg)

        total_yield_ha = sum(yields)
        mean_yield_ha = total_yield_ha / len(yields) if yields else 0.0
        total_harvest = total_yield_ha * area
        ann_harvest = total_harvest / (len(crops_list) / 2.0) if len(crops_list) >= 2 else total_harvest
        p_ha = float(plan_dict.get("profit_component") or 0.0)
        tot_profit = p_ha * area
        ann_profit = tot_profit / (len(crops_list) / 2.0) if len(crops_list) >= 2 else tot_profit
        tot_water = sum(waters)
        return {
            "field_size_ha": area,
            "cumulative_yield_t_ha": round(total_yield_ha, 2),
            "mean_yield_t_ha": round(mean_yield_ha, 2),
            "total_harvest_tons": round(total_harvest, 2),
            "annual_harvest_tons": round(ann_harvest, 2),
            "profit_bdt_per_ha": round(p_ha, 2),
            "total_profit_bdt": round(tot_profit, 2),
            "annual_profit_bdt": round(ann_profit, 2),
            "total_water_requirement_mm": round(tot_water, 1),
            "mean_water_requirement_mm": round(tot_water / len(waters), 1) if waters else 0.0,
            "water_efficiency_score": plan_dict.get("water_component"),
            "soil_health_score": plan_dict.get("soil_component"),
            "objective_score": plan_dict.get("objective_value"),
            "legume_fraction": round(sum(legumes) / len(legumes), 2) if legumes else 0.0,
            "legume_season_count": sum(legumes),
            "crop_diversity_count": len(set(crops_list)),
            "botanical_family_count": len(set(crop_lookup[c].get("family") for c in crops_list)),
        }

    active_field_metrics = compute_metrics(selected_plan)
    strategy_metrics_map = {
        name: compute_metrics(strat_item)
        for name, strat_item in strategies.get("strategies", {}).items()
    }

    # Compute optimization provenance
    constraints_summary = selected_plan.get("constraint_summary", {})
    compat_summary = selected_plan.get("compatibility_by_crop", {})
    excluded_static = constraints_summary.get("static_compatibility_exclusions", [])
    feasible_crops = [c for c in crop_lookup if c not in excluded_static]

    optimization_provenance = {
        "field_inputs": {
            "field_id": field_id,
            "latitude": latitude,
            "longitude": longitude,
            "area_ha": field_size,
            "temperature_c": getattr(state, "temperature", None),
            "soil_ph": getattr(state, "ph", None),
            "soil_texture": state.texture,
            "organic_matter_pct": state.organic_matter if math.isfinite(state.organic_matter) else None,
            "rainfall_mm": getattr(state, "rainfall", None),
            "irrigation_capacity_mm": irrigation_capacity,
            "available_water_mm": available_water_calc,
            "previous_crop": getattr(state, "previous_crop", None),
        },
        "feasibility_filter": {
            "catalog_crop_count": len(crops),
            "feasible_crop_count": len(feasible_crops),
            "feasible_crops": feasible_crops,
            "excluded_crops": excluded_static,
            "exclusion_reasons": {
                crop: [
                    f"{r_name}: {r_val.get('reason')}"
                    for r_name, r_val in compat_summary.get(crop, {}).get("rules", {}).items()
                    if r_val.get("status") == "incompatible"
                ]
                for crop in excluded_static if crop in compat_summary
            },
        },
        "objective_weighting": {
            "selected_strategy": selected_strategy_name,
            "requested_weights": selected_plan.get("weights", {}).get("requested", {}),
            "effective_weights": selected_plan.get("weights", {}).get("effective", {}),
        },
        "decision_model": {
            "solver": "PuLP CBC Branch-and-Bound Integer Linear Programming",
            "decision_variables": len(crops) * len(selected_plan.get("planning_periods", [])),
            "planning_periods": selected_plan.get("planning_periods", []),
            "rotation_constraints": [
                "Single crop selection per season (sum(x_c,t) = 1)",
                "Botanical family alternation (x_c1,t + x_c2,t+1 <= 1 for matching families)",
                "Biological legume interval frequency (sum(x_legume) >= 1 every 3 seasons)",
                "Agro-climatic temperature and pH feasibility envelopes",
                "Available water constraint boundaries",
            ],
            "solver_status": selected_plan.get("solver_status"),
            "objective_value": selected_plan.get("objective_value"),
        },
        "recommendation_summary": {
            "rotation_sequence": selected_plan.get("selected_crop_by_period"),
            "profit_gross_margin_bdt_ha": selected_plan.get("profit_component"),
            "total_field_profit_bdt": active_field_metrics.get("total_profit_bdt"),
            "water_score": selected_plan.get("water_component"),
            "soil_score": selected_plan.get("soil_component"),
        },
    }

    # Decision impact / What Changed analysis
    impact_items = []
    if field_size is not None:
        tot_p = active_field_metrics.get("total_profit_bdt")
        profit_str = f"৳{tot_p:,.0f} BDT" if tot_p is not None else "N/A"
        tot_h = active_field_metrics.get("total_harvest_tons")
        harvest_str = f"{tot_h:g} tons" if tot_h is not None else "N/A"
        impact_items.append({
            "parameter": "Field Area",
            "value": f"{field_size:g} ha",
            "impact_type": "economic_scale",
            "impact_description": f"Scales field harvest to {harvest_str} and gross margin to {profit_str}.",
        })
    cur_temp = getattr(state, "temperature", None)
    if cur_temp is not None and math.isfinite(cur_temp):
        climate_tag = "Cool season (<20°C)" if cur_temp < 20 else ("High heat (>32°C)" if cur_temp > 32 else "Warm temperate (20-32°C)")
        impact_items.append({
            "parameter": "Temperature Regime",
            "value": f"{cur_temp:g}°C ({climate_tag})",
            "impact_type": "climatic_feasibility",
            "impact_description": f"Feasibility envelope permits {len(feasible_crops)} of {len(crops)} crops tolerating {cur_temp:g}°C.",
        })
    cur_ph = getattr(state, "ph", None)
    if cur_ph is not None and math.isfinite(cur_ph):
        ph_tag = "Acidic (pH < 5.5)" if cur_ph < 5.5 else ("Alkaline (pH > 7.5)" if cur_ph > 7.5 else "Neutral (pH 5.5-7.5)")
        impact_items.append({
            "parameter": "Soil pH",
            "value": f"{cur_ph:g} ({ph_tag})",
            "impact_type": "soil_chemistry",
            "impact_description": f"Enforces soil pH bounds [{cur_ph:g}], filtering out intolerant species.",
        })
    if available_water_calc is not None:
        impact_items.append({
            "parameter": "Available Water Supply",
            "value": f"{available_water_calc:g} mm",
            "impact_type": "water_budget",
            "impact_description": f"Defines seasonal water budget for crop water footprint evaluation.",
        })
    impact_items.append({
        "parameter": "Active Operational Strategy",
        "value": selected_strategy_name.replace("_", " ").title(),
        "impact_type": "objective_weighting",
        "impact_description": f"Weights optimizer priorities ({round((selected_plan.get('weights',{}).get('requested',{}).get('profit',0.5))*100)}% Profit, {round((selected_plan.get('weights',{}).get('requested',{}).get('water',0.3))*100)}% Water, {round((selected_plan.get('weights',{}).get('requested',{}).get('soil',0.2))*100)}% Soil).",
    })

    what_changed = {
        "active_parameters": impact_items,
        "impact_summary": f"Optimization model resolved with {len(feasible_crops)} feasible crops yielding {active_field_metrics.get('crop_diversity_count')} distinct rotation species.",
        "result_rotation": " → ".join((selected_plan.get("selected_crop_by_period") or {}).values()),
    }
    counterfactual_delta = finite_number("counterfactual_rainfall_delta_mm")
    counterfactual = None
    if counterfactual_delta is not None:
        counterfactual = run_counterfactual_analysis(
            state,
            variable="rainfall",
            delta=counterfactual_delta,
            model=model,
        )

    environment = FieldShiftEnvironment(
        field_state=state,
        environmental_history=power,
        features=features,
        step_limit=1,
    )
    observation, reset_info = environment.reset(seed=7)
    proposed_action = DeterministicBaselinePolicy().select_action(
        observation,
        reset_info["available_actions"],
        seed=7,
    )
    validated_action = environment._validate_action(proposed_action)
    _, reward, terminated, truncated, transition_info = environment.step(validated_action)
    if DEFAULT_POLICY_PATH.is_file():
        simulation_policy = load_synthetic_q_policy(DEFAULT_POLICY_PATH)
        simulation_rl = run_synthetic_policy_step(
            simulation_policy,
            selected_plan,
            environment._validate_action,
            scenario="normal",
            seed=37,
        )
        simulation_rl["artifact_path"] = str(DEFAULT_POLICY_PATH.resolve())
    else:
        simulation_rl = {
            "status": "policy_artifact_not_found",
            "evidence_class": "synthetic",
            "policy_label": "simulation-trained RL policy; not field validated",
            "artifact_path": str(DEFAULT_POLICY_PATH.resolve()),
            "note": "Run the synthetic RL training command before using a learned policy.",
        }
    from src.rl.crop_rotation_rl import compare_rl_vs_milp, run_reinforcement_learning_policy
    rl_policy_decision = run_reinforcement_learning_policy(
        field_state=state,
        crops=crops,
        features=features,
        environmental_history=power,
        priority=priority,
        weights=selected_plan.get("weights", {}).get("requested"),
    )
    rl_vs_milp_comparison = compare_rl_vs_milp(
        rl_result=rl_policy_decision,
        milp_plan=selected_plan,
        field_state=state,
        crops=crops,
    )

    stress_report = run_stress_tests(
        state,
        features=features,
        crops=crops,
        field_history=history,
        scenarios=["normal", "drought", "heat", "low_water"],
        run_milp=True,
        environmental_history=power,
    )
    latest_date = power["date"].max()
    now_iso = utc_now_iso()
    run_id = f"run_{secrets.token_hex(6)}"
    summary = {
        "run_id": run_id,
        "timestamp": now_iso,
        "research_boundary": "synthetic_demo_only" if mode == "offline" else "synthetic_model_with_live_nasa_power",
        "mode": mode,
        "nasa_power": {
            "source": "bundled_demo_dataset" if mode == "offline" else "NASA_POWER_Daily_Point_API",
            "data_status": "demo" if mode == "offline" else "observed",
            "rows": int(len(power)),
            "start_date": start.date().isoformat(),
            "end_date": end.date().isoformat(),
            "latest_valid_date": pd.Timestamp(latest_date).date().isoformat() if pd.notna(latest_date) else None,
        },
        "field_state": {
            "field_id": field_id,
            "as_of_date": end.date().isoformat(),
            "latitude": latitude,
            "longitude": longitude,
            "field_size_ha": field_size,
            "area_ha": field_size,
            "soil_texture": state.texture,
            "organic_matter_percent": state.organic_matter if math.isfinite(state.organic_matter) else None,
            "irrigation_capacity_mm": irrigation_capacity,
            "data_status": state.data_status,
        },
        "input_application": {
            "applied_to_research_state": farmer_inputs_applied,
            "recorded_but_not_supported_by_current_research_interfaces": [
                name for name, value in (
                    ("field_size_ha", field_size),
                ) if value is not None and name not in farmer_inputs_applied
            ],
            "include_crop_history": include_history,
            "farmer_crop_history_added": bool(include_history and previous_crop),
        },
        "field_metrics": active_field_metrics,
        "strategy_field_metrics": strategy_metrics_map,
        "optimization_provenance": optimization_provenance,
        "what_changed": what_changed,
        "ml": {
            "model_name": model["model_name"],
            "baseline_yield_t_ha": round(float(prediction["synthetic_demo_prediction"]["predicted_value"]), 2),
            "prediction_t_ha": prediction["synthetic_demo_prediction"]["predicted_value"],
            "prediction_label": "Synthetic Benchmark - Simulation Only - Not Field Validated",
            "disclaimer": "Synthetic benchmark estimate - generic field baseline, not crop-specific.",
            "data_boundary": "synthetic_demo_only",
            "field_size_ha": field_size,
            "total_production_tons": round(sum(
                float((selected_plan.get("dynamic_agronomic_matrix", {}).get("crop_season_matrix", {}).get(p, {}).get(c, {}).get("dynamic_yield_t_ha")) or 
                (crops.loc[crops["crop"] == c, "expected_yield"].values[0] if ("crop" in crops and c in crops["crop"].values) else 1.0))
                for p, c in (selected_plan.get("selected_crop_by_period") or {}).items()
            ) * (field_size or 1.0), 2) if selected_plan.get("selected_crop_by_period") and field_size else None,
            "total_production_note": "Multi-season rotation harvest production = sum(scheduled crop yield t/ha * field area ha).",
            "metrics": model["metrics"],
            "uncertainty": prediction["synthetic_demo_prediction"]["uncertainty_interval_t_ha"],
            "uncertainty_t_ha": prediction["synthetic_demo_prediction"]["uncertainty_t_ha"],
            "uncertainty_note": prediction["synthetic_demo_prediction"]["uncertainty_note"],
        },
        "xai": {
            "ml_explanation": ml_explanation,
            "milp_explanation": milp_explanation,
            "pipeline_boundary": "synthetic_demo_and_simulation_only",
        },
        "anomaly_detection": detect_anomalies(state),
        "planning": {
            "selected_priority": priority,
            "selected_strategy": selected_strategy_name,
            "selected_strategy_result": selected_plan,
            "milp_status": selected_plan,
            "strategy_comparison": strategies["comparison"],
            "all_strategies": strategies["strategies"],
            "validation_diagnostics": validation_diagnostics,
            "constraints_unmodified": True,
            "objective_weights_unmodified": False,
        },
        "rl": {
            "policy_type": "DeterministicBaselinePolicy",
            "proposal_action": proposed_action,
            "validated_action": validated_action,
            "safety_status": "safe_noop" if validated_action == {"action": "no_intervention"} else "safe_proposal",
            "transition_reward": reward,
            "transition_terminated": bool(terminated),
            "transition_truncated": bool(truncated),
            "transition_info": {
                "action": transition_info.get("action"),
                "changed_fields": transition_info.get("changed_fields", {}),
            },
            "simulation_trained_policy": simulation_rl,
        },
        "rl_policy": rl_policy_decision,
        "rl_vs_milp": rl_vs_milp_comparison,
        "stress_test": {
            "status": stress_report.get("status"),
            "scenarios": stress_report.get("scenarios", {}),
            "baseline_optimizer_status": (
                stress_report.get("baseline", {})
                .get("optimizer_result", {})
                .get("status")
            ),
        },
        "counterfactual": counterfactual,
        "final_plan": {
            "strategy": selected_strategy_name,
            "rotation": selected_plan.get("selected_crop_by_period"),
            "status": selected_plan.get("status"),
            "interpretation": "optimizer output for research exploration, not a guaranteed recommendation",
        },
        "limitations": [
            "The synthetic ML model is not field-validated.",
            "The real-observation baseline is not a learned policy; the separate simulation-trained policy is synthetic and not field validated.",
            "The optimizer's profile weights are prototype assumptions; priority selects an existing named profile.",
            "Field size and irrigation capacity are recorded but are not consumed by current optimizer constraints.",
            "No live SMAP or soil-data service exists; unavailable soil/moisture measurements remain unknown.",
        ],
    }
    return {
        "status": "ok",
        "mode": mode,
        "summary": _sanitize_json_value(summary),
    }


def _register_user(payload: dict[str, Any]) -> dict[str, Any]:
    name = str((payload or {}).get("name", "")).strip()
    email = str((payload or {}).get("email", "")).strip().lower()
    password = str((payload or {}).get("password", ""))
    if not name or not email or not password:
        raise ValueError("name, email, and password are required.")
    if "@" not in email:
        raise ValueError("email must look like an email address.")

    if len(password) < 8:
        raise ValueError("password must contain at least 8 characters.")
    password_hash = _password_hash(password)
    now = utc_now_iso()
    with get_db_connection() as conn:
        try:
            cursor = conn.execute(
                "INSERT INTO users (name, email, password_hash, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)",
                (name, email, password_hash, now, now),
            )
            conn.commit()
        except sqlite3.IntegrityError as error:
            raise ValueError(f"email already registered: {email}") from error
        user_id = cursor.lastrowid
        row = conn.execute(
            "SELECT id, name, email, is_active, created_at, updated_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    return {
        "status": "created",
        "user": dict(row),
    }


def _create_farm(payload: dict[str, Any]) -> dict[str, Any]:
    user_id = (payload or {}).get("user_id")
    name = str((payload or {}).get("name", "")).strip()
    description = str((payload or {}).get("description", "")).strip()
    if user_id is None or not name:
        raise ValueError("user_id and name are required.")
    now = utc_now_iso()
    with get_db_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO farms (user_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (int(user_id), name, description or None, now, now),
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, user_id, name, description, created_at, updated_at FROM farms WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
    return {"status": "created", "farm": dict(row)}


def _list_farms(user_id: Any) -> dict[str, Any]:
    with get_db_connection() as conn:
        rows = conn.execute(
            "SELECT id, user_id, name, description, created_at, updated_at FROM farms WHERE user_id = ? ORDER BY id DESC",
            (int(user_id),),
        ).fetchall()
    return {"status": "ok", "farms": [dict(row) for row in rows]}


def _create_field(payload: dict[str, Any], user_id: int) -> dict[str, Any]:
    farm_id = (payload or {}).get("farm_id")
    name = str((payload or {}).get("name", "")).strip()
    if not name:
        raise ValueError("name is required.")
    latitude = _optional_db_number((payload or {}).get("latitude"), "latitude", minimum=-90, maximum=90)
    longitude = _optional_db_number((payload or {}).get("longitude"), "longitude", minimum=-180, maximum=180)
    area_ha = _optional_db_number((payload or {}).get("area_ha"), "area_ha", minimum=0)
    organic_matter = _optional_db_number(
        (payload or {}).get("organic_matter"),
        "organic_matter",
        minimum=0,
        maximum=100,
    )
    irrigation_capacity = _optional_db_number(
        (payload or {}).get("irrigation_capacity_mm"),
        "irrigation_capacity_mm",
        minimum=0,
    )
    with get_db_connection() as conn:
        if farm_id is None:
            default_farm = conn.execute(
                "SELECT id FROM farms WHERE user_id = ? ORDER BY id ASC LIMIT 1",
                (user_id,),
            ).fetchone()
            if default_farm is None:
                now = utc_now_iso()
                c = conn.execute(
                    "INSERT INTO farms (user_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                    (user_id, "My Farm", "Default user farm", now, now),
                )
                farm_id = c.lastrowid
            else:
                farm_id = default_farm["id"]
        else:
            farm = conn.execute(
                "SELECT id FROM farms WHERE id = ? AND user_id = ?",
                (int(farm_id), user_id),
            ).fetchone()
            if farm is None:
                raise ValueError("Farm not found or not owned by this user.")
        now = utc_now_iso()
        cursor = conn.execute(
            "INSERT INTO fields (farm_id, name, latitude, longitude, area_ha, soil_texture, organic_matter, irrigation_capacity_mm, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                int(farm_id),
                name,
                latitude,
                longitude,
                area_ha,
                (payload or {}).get("soil_texture"),
                organic_matter,
                irrigation_capacity,
                now,
                now,
            ),
        )
        new_field_id = cursor.lastrowid
        crop = (payload or {}).get("crop") or (payload or {}).get("previous_crop") or (payload or {}).get("current_crop")
        if crop:
            try:
                hist_year = int((payload or {}).get("previous_crop_year") or (payload or {}).get("year") or 2025)
            except (ValueError, TypeError):
                hist_year = 2025
            conn.execute(
                "INSERT INTO field_history (field_id, crop, season, year, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (new_field_id, str(crop).strip(), (payload or {}).get("season", "dry"), hist_year, (payload or {}).get("notes"), now),
            )
        row = conn.execute(
            "SELECT * FROM fields WHERE id = ?",
            (new_field_id,),
        ).fetchone()
        f_dict = dict(row)
        hist_rows = conn.execute(
            "SELECT * FROM field_history WHERE field_id = ? ORDER BY year DESC, id DESC",
            (new_field_id,),
        ).fetchall()
        hist = [dict(h) for h in hist_rows]
        f_dict["history"] = hist
        if hist:
            f_dict["previous_crop"] = hist[0].get("crop")
            f_dict["previous_crop_year"] = hist[0].get("year")
            f_dict["current_crop"] = hist[0].get("crop")
        else:
            f_dict["previous_crop"] = None
            f_dict["previous_crop_year"] = None
            f_dict["current_crop"] = None
        f_dict["last_analysis_date"] = None
    return {"status": "created", "field": f_dict}


def _list_fields(farm_id: Any, user_id: int) -> dict[str, Any]:
    with get_db_connection() as conn:
        if farm_id is not None:
            farm = conn.execute(
                "SELECT id FROM farms WHERE id = ? AND user_id = ?",
                (int(farm_id), user_id),
            ).fetchone()
            if farm is None:
                raise ValueError("Farm not found or not owned by this user.")
            rows = conn.execute(
                "SELECT * FROM fields WHERE farm_id = ? ORDER BY id DESC",
                (int(farm_id),),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT f.* FROM fields f JOIN farms farm ON farm.id = f.farm_id WHERE farm.user_id = ? ORDER BY f.id DESC",
                (int(user_id),),
            ).fetchall()
        
        result = []
        for r in rows:
            f_dict = dict(r)
            hist_rows = conn.execute(
                "SELECT * FROM field_history WHERE field_id = ? ORDER BY year DESC, id DESC",
                (f_dict["id"],),
            ).fetchall()
            hist = [dict(h) for h in hist_rows]
            f_dict["history"] = hist
            if hist:
                f_dict["previous_crop"] = hist[0].get("crop")
                f_dict["previous_crop_year"] = hist[0].get("year")
                f_dict["current_crop"] = hist[0].get("crop")
            else:
                f_dict["previous_crop"] = None
                f_dict["previous_crop_year"] = None
                f_dict["current_crop"] = None
            last_anal = conn.execute(
                "SELECT created_at FROM analyses WHERE field_id = ? ORDER BY id DESC LIMIT 1",
                (f_dict["id"],),
            ).fetchone()
            f_dict["last_analysis_date"] = last_anal["created_at"] if last_anal else None
            result.append(f_dict)
    return {"status": "ok", "fields": result}


def _create_field_history(payload: dict[str, Any], field_id: int, user_id: int) -> dict[str, Any]:
    crop = str((payload or {}).get("crop", "")).strip()
    season = str((payload or {}).get("season", "")).strip()
    year = _optional_db_number((payload or {}).get("year"), "year", minimum=1, maximum=9999)
    if not crop or not season or year is None or not year.is_integer():
        raise ValueError("crop, season, and a whole-number year are required.")
    from src.data.crops import load_crop_knowledge

    catalog = load_crop_knowledge()
    matches = catalog.loc[catalog["crop"].str.casefold() == crop.casefold(), "crop"]
    if matches.empty:
        raise ValueError("crop must match a crop in the repository crop catalog.")
    crop = str(matches.iloc[0])
    with get_db_connection() as conn:
        field = conn.execute(
            "SELECT f.id, f.farm_id FROM fields f JOIN farms farm ON farm.id = f.farm_id WHERE f.id = ? AND farm.user_id = ?",
            (int(field_id), user_id),
        ).fetchone()
        if field is None:
            raise ValueError("Field not found or not owned by this user.")
        now = utc_now_iso()
        cursor = conn.execute(
            "INSERT INTO field_history (field_id, crop, season, year, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (
                int(field_id),
                crop,
                season,
                int(year),
                (payload or {}).get("notes"),
                now,
            ),
        )
        row = conn.execute("SELECT * FROM field_history WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return {"status": "created", "history": dict(row)}


def _list_field_history(field_id: int, user_id: int) -> dict[str, Any]:
    with get_db_connection() as conn:
        field = conn.execute(
            "SELECT f.id, f.farm_id FROM fields f JOIN farms farm ON farm.id = f.farm_id WHERE f.id = ? AND farm.user_id = ?",
            (int(field_id), user_id),
        ).fetchone()
        if field is None:
            raise ValueError("Field not found or not owned by this user.")
        if farm_id is not None and int(farm_id) != int(field["farm_id"]):
            raise ValueError("farm_id does not match the selected field.")
        farm_id = int(field["farm_id"])
        rows = conn.execute(
            "SELECT * FROM field_history WHERE field_id = ? ORDER BY year DESC, created_at DESC",
            (int(field_id),),
        ).fetchall()
    return {"status": "ok", "history": [dict(row) for row in rows]}


def _login_user_with_password(email: str, password: str) -> dict[str, Any] | None:
    email = email.strip().lower()
    with get_db_connection() as conn:
        row = conn.execute(
            "SELECT id, name, email, password_hash FROM users WHERE email = ? AND is_active = 1",
            (email,),
        ).fetchone()
    if row is None or not _verify_password(password, row["password_hash"]):
        return None
    return {"id": row["id"], "name": row["name"], "email": row["email"]}


def _create_analysis(payload: dict[str, Any], user_id: int) -> dict[str, Any]:
    now = utc_now_iso()
    field_id = (payload or {}).get("field_id")
    farm_id = (payload or {}).get("farm_id")
    if field_id is None:
        raise ValueError("field_id is required.")
    with get_db_connection() as conn:
        field = conn.execute(
            "SELECT f.id FROM fields f JOIN farms farm ON farm.id = f.farm_id WHERE f.id = ? AND farm.user_id = ?",
            (int(field_id), user_id),
        ).fetchone()
        if field is None:
            raise ValueError("Field not found or not owned by this user.")
        workflow_payload = dict(payload or {})
        cursor = conn.execute(
            "INSERT INTO analyses (user_id, farm_id, field_id, start_date, end_date, priority, season, include_crop_history, mode, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)",
            (
                user_id,
                farm_id,
                int(field_id),
                (payload or {}).get("start_date"),
                (payload or {}).get("end_date"),
                (payload or {}).get("priority"),
                (payload or {}).get("season"),
                1 if (payload or {}).get("include_crop_history") else 0,
                (payload or {}).get("mode", "offline"),
                now,
                now,
            ),
        )
        conn.execute(
            "UPDATE analyses SET summary_json = ? WHERE id = ?",
            (
                json.dumps(_sanitize_json_value(workflow_payload), ensure_ascii=False, allow_nan=False),
                cursor.lastrowid,
            ),
        )
        row = conn.execute("SELECT * FROM analyses WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return {"status": "created", "analysis": dict(row)}


def _run_analysis_for_id(analysis_id: int, user_id: int) -> dict[str, Any]:
    with get_db_connection() as conn:
        row = conn.execute(
            "SELECT * FROM analyses WHERE id = ? AND user_id = ?",
            (int(analysis_id), user_id),
        ).fetchone()
        if row is None:
            raise ValueError("Analysis not found or not owned by this user.")
        stored_result = json.loads(row["summary_json"] or "{}")
        workflow_payload = stored_result.get("workflow_payload", stored_result)
        conn.execute(
            "UPDATE analyses SET status = 'running', started_at = ?, updated_at = ? WHERE id = ?",
            (utc_now_iso(), utc_now_iso(), int(analysis_id)),
        )
    try:
        with get_db_connection() as conn:
            user_row = conn.execute(
                "SELECT id, name, email FROM users WHERE id = ?",
                (user_id,),
            ).fetchone()
        summary = _run_research_workflow(
            workflow_payload,
            dict(user_row) if user_row is not None else None,
        )
        with get_db_connection() as conn:
            conn.execute(
                "UPDATE analyses SET status = 'completed', completed_at = ?, summary_json = ?, updated_at = ? WHERE id = ?",
                (
                    utc_now_iso(),
                    json.dumps(
                        {
                            "workflow_payload": workflow_payload,
                            "summary": _sanitize_json_value(summary),
                        },
                        ensure_ascii=False,
                        allow_nan=False,
                    ),
                    utc_now_iso(),
                    int(analysis_id),
                ),
            )
            conn.commit()
    except Exception as exc:
        with get_db_connection() as conn:
            conn.execute(
                "UPDATE analyses SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?",
                (str(exc), utc_now_iso(), int(analysis_id)),
            )
            conn.commit()
        raise
    with get_db_connection() as conn:
        saved = conn.execute("SELECT * FROM analyses WHERE id = ?", (int(analysis_id),)).fetchone()
    return {"status": "ok", "analysis": dict(saved), "summary": summary}


def _list_analyses(user_id: int) -> dict[str, Any]:
    with get_db_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM analyses WHERE user_id = ? ORDER BY id DESC",
            (user_id,),
        ).fetchall()
    return {"status": "ok", "analyses": [dict(row) for row in rows]}


class FieldShiftWebHandler(BaseHTTPRequestHandler):
    """Serve the browser UI and expose a small JSON API."""

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        if path.startswith("/api/"):
            if path == "/api/health":
                status, body = _json_response(_health_payload())
                self._send_json(status, body)
                return
            if path == "/api/demo":
                status, body = _json_response({
                    **_demo_summary({"mode": "offline"}),
                    "status": "ok",
                })
                self._send_json(status, body)
                return
            if path == "/api/dashboard":
                from src.dashboard import build_dashboard_data, render_dashboard

                snapshot = build_dashboard_data()
                page = render_dashboard(snapshot)
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(page.encode("utf-8"))))
                self.end_headers()
                self.wfile.write(page.encode("utf-8"))
                return
            if path == "/api/auth/me":
                user = _require_auth(self)
                status, body = _json_response(
                    {"status": "ok", "user": user} if user else {"status": "unauthenticated"},
                    200,
                )
                self._send_json(status, body)
                return
            if path == "/api/crops":
                from src.data.crops import load_crop_knowledge

                self._send_json(
                    *_json_response(
                        {
                            "status": "ok",
                            "crops": load_crop_knowledge().to_dict(orient="records"),
                        }
                    )
                )
                return
            if path == "/api/scenarios/benchmarks":
                from src.scenarios.benchmark_scenarios import get_benchmark_scenario_list
                self._send_json(
                    *_json_response(
                        {
                            "status": "ok",
                            "scenarios": get_benchmark_scenario_list(),
                        }
                    )
                )
                return
            if path == "/api/users":
                if _require_auth(self) is None:
                    self._send_api_error(401, "Sign in to view user records.")
                    return
                with get_db_connection() as conn:
                    rows = conn.execute(
                        "SELECT id, name, email, is_active, created_at, updated_at FROM users ORDER BY id DESC"
                    ).fetchall()
                payload = {"status": "ok", "users": [dict(row) for row in rows]}
                status, body = _json_response(payload)
                self._send_json(status, body)
                return
            if path == "/api/farms":
                user = _require_auth(self)
                if user is None:
                    self._send_api_error(401, "Sign in to view farms.")
                    return
                status, body = _json_response(_list_farms(user["id"]))
                self._send_json(status, body)
                return
            if path == "/api/fields":
                user = _require_auth(self)
                farm_id = parse_qs(parsed.query).get("farm_id", [None])[0]
                if user is None:
                    self._send_api_error(401, "Sign in to view fields.")
                    return
                try:
                    status, body = _json_response(_list_fields(farm_id, user["id"]))
                    self._send_json(status, body)
                except ValueError as error:
                    self._send_api_error(404, str(error))
                return
                return
            if path == "/api/analyses":
                user = _require_auth(self)
                if user is None:
                    self._send_api_error(401, "Sign in to view analysis history.")
                    return
                self._send_json(*_json_response(_list_analyses(user["id"])))
                return
            if path.startswith("/api/fields/") and path.endswith("/history"):
                user = _require_auth(self)
                if user is None:
                    self._send_api_error(401, "Sign in to view field history.")
                    return
                parts = path.strip("/").split("/")
                if len(parts) != 4:
                    self._send_api_error(404, "Field history route not found.")
                    return
                try:
                    self._send_json(
                        *_json_response(_list_field_history(int(parts[2]), user["id"]))
                    )
                except (ValueError, TypeError) as error:
                    self._send_api_error(404, str(error))
                return
            self._send_api_error(404, "API route not found.")
            return

        static = _serve_static_file(path)
        if static is None:
            self.send_error(404)
            return
        content, ext = static
        mime = {
            "html": "text/html; charset=utf-8",
            "css": "text/css; charset=utf-8",
            "js": "application/javascript; charset=utf-8",
        }.get(ext, "application/octet-stream")
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/scenarios/benchmark/run":
            from src.scenarios.benchmark_scenarios import run_benchmark_scenario, run_all_benchmark_scenarios
            body = _read_body(self)
            scenario_id = body.get("scenario_id")
            try:
                if not scenario_id or str(scenario_id).lower() == "all":
                    res = {"status": "ok", "results": run_all_benchmark_scenarios()}
                else:
                    res = {"status": "ok", "result": run_benchmark_scenario(str(scenario_id).upper())}
                self._send_json(*_json_response(res))
            except Exception as error:
                self._send_api_error(400, str(error))
            return
        if parsed.path == "/api/scenarios/benchmark/run":
            from src.scenarios.benchmark_scenarios import run_benchmark_scenario, run_all_benchmark_scenarios
            body = _read_body(self)
            scenario_id = body.get("scenario_id")
            try:
                if not scenario_id or str(scenario_id).lower() == "all":
                    res = {"status": "ok", "results": run_all_benchmark_scenarios()}
                else:
                    res = {"status": "ok", "result": run_benchmark_scenario(str(scenario_id).upper())}
                self._send_json(*_json_response(res))
            except Exception as error:
                self._send_api_error(400, str(error))
            return
        if parsed.path == "/api/location/weather":
            try:
                result = _location_weather(_read_body(self))
                self._send_json(*_json_response(result))
            except ValueError as error:
                self._send_api_error(400, str(error))
            except RuntimeError as error:
                self._send_api_error(502, str(error))
            return
        if parsed.path in {"/api/demo", "/api/workflow"}:
            payload = _read_body(self)
            try:
                user = _require_auth(self)
                result = _demo_summary(payload, user)
                if payload.get("save_result"):
                    if user is None:
                        self._send_api_error(401, "Sign in before saving this analysis.")
                        return
                    payload["field_id"] = payload.get("field_id")
                    created = _create_analysis(payload, user["id"])
                    analysis_id = created["analysis"]["id"]
                    now = utc_now_iso()
                    with get_db_connection() as conn:
                        conn.execute(
                            "UPDATE analyses SET status = 'completed', started_at = ?, completed_at = ?, summary_json = ?, updated_at = ? WHERE id = ? AND user_id = ?",
                            (
                                now,
                                now,
                                json.dumps(
                                    {"workflow_payload": payload, "summary": result},
                                    ensure_ascii=False,
                                    allow_nan=False,
                                ),
                                now,
                                analysis_id,
                                user["id"],
                            ),
                        )
                        conn.commit()
                    result["analysis_id"] = analysis_id
                self._send_json(*_json_response(result))
            except ValueError as error:
                self._send_api_error(400, str(error))
            except (FileNotFoundError, RuntimeError) as error:
                self._send_api_error(502, str(error))
            return
        if parsed.path == "/api/auth/register":
            try:
                result = _register_user(_read_body(self))
                _login_user(self, result["user"]["id"])
                self._send_json(*_json_response(result, 201))
            except ValueError as error:
                self._send_api_error(400, str(error))
            return
        if parsed.path == "/api/auth/login":
            payload = _read_body(self)
            email = str(payload.get("email", "")).strip()
            password = str(payload.get("password", ""))
            user = _login_user_with_password(email, password)
            if user is None:
                self._send_api_error(401, "Email or password is incorrect.")
                return
            _login_user(self, user["id"])
            self._send_json(*_json_response({"status": "ok", "user": user}))
            return
        if parsed.path == "/api/auth/logout":
            cookies = _parse_cookies(self.headers.get("Cookie"))
            token = cookies.get("fieldshift_session")
            if token:
                with get_db_connection() as conn:
                    conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
                    conn.commit()
            self.send_response(200)
            self.send_header(
                "Set-Cookie",
                "fieldshift_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
            )
            _, body = _json_response({"status": "ok"})
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if parsed.path == "/api/users":
            try:
                payload = _read_body(self)
                status, body = _json_response(_register_user(payload))
                self._send_json(status, body)
                return
            except ValueError as error:
                self._send_api_error(400, str(error))
                return
        if parsed.path == "/api/farms":
            try:
                payload = _read_body(self)
                user = _require_auth(self)
                if user is None:
                    self._send_api_error(401, "Sign in to save a farm.")
                    return
                payload["user_id"] = user["id"]
                status, body = _json_response(_create_farm(payload), 201)
                self._send_json(status, body)
                return
            except ValueError as error:
                self._send_api_error(400, str(error))
                return
        if parsed.path == "/api/fields":
            user = _require_auth(self)
            if user is None:
                self._send_api_error(401, "Sign in to save a field.")
                return
            try:
                self._send_json(*_json_response(_create_field(_read_body(self), user["id"]), 201))
            except (ValueError, TypeError) as error:
                self._send_api_error(400, str(error))
            except sqlite3.IntegrityError as error:
                self._send_api_error(400, str(error))
            return
        if parsed.path.startswith("/api/fields/") and parsed.path.endswith("/history"):
            user = _require_auth(self)
            if user is None:
                self._send_api_error(401, "Sign in to save crop history.")
                return
            parts = parsed.path.strip("/").split("/")
            try:
                if len(parts) != 4:
                    raise ValueError("Field history route not found.")
                result = _create_field_history(
                    _read_body(self),
                    int(parts[2]),
                    user["id"],
                )
                self._send_json(*_json_response(result, 201))
            except (ValueError, TypeError) as error:
                self._send_api_error(400, str(error))
            return
        if parsed.path == "/api/analyses":
            user = _require_auth(self)
            if user is None:
                self._send_api_error(401, "Sign in to save an analysis.")
                return
            try:
                result = _create_analysis(_read_body(self), user["id"])
                self._send_json(*_json_response(result, 201))
            except (ValueError, TypeError) as error:
                self._send_api_error(400, str(error))
            return
        if parsed.path.startswith("/api/analyses/") and parsed.path.endswith("/run"):
            user = _require_auth(self)
            if user is None:
                self._send_api_error(401, "Sign in to run a saved analysis.")
                return
            parts = parsed.path.strip("/").split("/")
            try:
                if len(parts) != 4:
                    raise ValueError("Analysis route not found.")
                self._send_json(*_json_response(_run_analysis_for_id(int(parts[2]), user["id"])))
            except ValueError as error:
                self._send_api_error(404, str(error))
            except (FileNotFoundError, RuntimeError) as error:
                self._send_api_error(502, str(error))
            return
        self._send_api_error(404, "API route not found.")

    def _send_api_error(self, status: int, message: str) -> None:
        self._send_json(*_json_response({"status": "error", "message": message}, status))

    def _send_json(self, status: int, body: bytes) -> None:
        self.send_response(status)
        cookie = getattr(self, "_pending_session_cookie", None)
        if cookie is not None:
            self.send_header("Set-Cookie", cookie)
            del self._pending_session_cookie
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        self.end_headers()
        self.wfile.write(body)
        self.close_connection = True

def get_server(host: str = "127.0.0.1", port: int = 8765) -> ThreadingHTTPServer:
    return ThreadingHTTPServer((host, port), FieldShiftWebHandler)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Start the FieldShift browser app.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args(argv)

    try:
        server = get_server(args.host, args.port)
    except OSError as error:
        print(f"Could not start FieldShift web app: {error}")
        return 2

    print(f"FieldShift web app available at http://{args.host}:{args.port}/")
    print("Offline demo mode is enabled; live NASA POWER fetch is not enabled.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
