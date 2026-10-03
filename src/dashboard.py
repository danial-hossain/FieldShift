"""Small read-only local dashboard using Python's standard-library HTTP server.

Launch from the repository root with ``python -m src.dashboard``. The app
loads local data only; it does not fetch NASA services or alter source files.
"""

import argparse
import html
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Optional


PROJECT_ROOT = Path(__file__).resolve().parents[1]
NASA_DATA_DIRECTORY = PROJECT_ROOT / "data" / "nasa_power"


def _section(status: str, data: Any = None, reason: Optional[str] = None) -> dict:
    result = {"status": status, "data": data}
    if reason:
        result["reason"] = reason
    return result


def _json_value(value: Any) -> Any:
    if hasattr(value, "to_dict"):
        return _json_value(value.to_dict())
    if isinstance(value, dict):
        return {str(key): _json_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_value(item) for item in value]
    if hasattr(value, "isoformat"):
        return value.isoformat()
    try:
        import numpy as np

        if isinstance(value, np.generic):
            return _json_value(value.item())
    except ImportError:
        pass
    try:
        import pandas as pd

        if pd.isna(value):
            return None
    except (ImportError, TypeError, ValueError):
        pass
    return value


def _load_nasa_data(csv_path: Optional[str]):
    import pandas as pd

    from src.data.nasa_power import DATA_COLUMNS, get_latest_valid_date

    if csv_path is not None:
        path = Path(csv_path).expanduser()
        if not path.is_file():
            raise FileNotFoundError(f"NASA POWER CSV was not found: {path}")
        frame = pd.read_csv(path)
        if any(column not in frame.columns for column in DATA_COLUMNS):
            raise ValueError("NASA POWER CSV does not match the normalized schema.")
        frame["date"] = pd.to_datetime(frame["date"], errors="coerce")
        latest = get_latest_valid_date(frame)
        if latest is None:
            raise ValueError("NASA POWER CSV contains no valid observation date.")
        return path.resolve(), frame, latest

    candidates = sorted(NASA_DATA_DIRECTORY.glob("*.csv"))
    available = []
    errors = []
    for candidate in candidates:
        try:
            frame = pd.read_csv(candidate)
            if any(column not in frame.columns for column in DATA_COLUMNS):
                continue
            frame["date"] = pd.to_datetime(frame["date"], errors="coerce")
            latest = get_latest_valid_date(frame)
            if latest is not None:
                available.append((latest, candidate, frame))
        except (OSError, ValueError, pd.errors.ParserError) as error:
            errors.append(f"{candidate.name}: {error}")
    if not available:
        detail = "; ".join(errors) if errors else "No normalized NASA POWER CSV is available."
        raise FileNotFoundError(detail)
    latest, path, frame = max(available, key=lambda item: (item[0], item[1].name))
    return path.resolve(), frame, latest


def build_dashboard_data(
    *,
    field_id: str = "field_001",
    decision_date: Optional[str] = None,
    nasa_csv: Optional[str] = None,
    farm_outcomes_csv: Optional[str] = None,
) -> dict:
    """Build a JSON-safe read-only dashboard snapshot from local inputs."""
    if not isinstance(field_id, str) or not field_id.strip():
        raise ValueError("field_id must be a non-empty pseudonymous identifier.")

    from src.data.crops import load_crop_knowledge
    from src.data.data_quality import build_data_quality_report
    from src.data.farm_outcomes import ingest_farm_outcomes
    from src.data.field_history import load_field_history
    from src.data.smap import load_smap_data
    from src.data.soil import load_soil_data
    from src.knowledge.agronomic_rules import evaluate_all_crops
    from src.optimizer.milp import optimize_rotation
    from src.optimizer.strategies import generate_rotation_strategies
    from src.preprocessing.features import build_features
    from src.rl.environment import FieldShiftEnvironment
    from src.rl.readiness import assess_learning_readiness
    from src.scenarios.stress_test import run_stress_tests
    from src.state.field_state import build_field_state

    result = {
        "dashboard": {
            "name": "FieldShift local research dashboard",
            "read_only": True,
            "network_requests": False,
            "decision_roles": {
                "MILP": "long-term rotation planning",
                "RL": "adaptive management prototype; not enabled without evidence",
            },
        },
        "environment": _section("unavailable"),
        "field_state": _section("unavailable"),
        "features": _section("unavailable"),
        "agronomic_rules": _section("unavailable"),
        "rotation_plan": _section("unavailable"),
        "strategy_profiles": _section("unavailable"),
        "stress_tests": _section("unavailable"),
        "farm_data_quality": _section("unavailable"),
        "rl_readiness": _section("unavailable"),
    }

    if farm_outcomes_csv is None:
        result["farm_data_quality"] = _section(
            "empty",
            build_data_quality_report().to_dict(),
            "No caller farm action/outcome CSV was supplied.",
        )
    else:
        try:
            imported = ingest_farm_outcomes(farm_outcomes_csv)
        except (OSError, TypeError, ValueError) as error:
            result["farm_data_quality"] = _section(
                "unavailable",
                reason=f"{type(error).__name__}: {error}",
            )
        else:
            result["farm_data_quality"] = _section(
                "available",
                build_data_quality_report(imported).to_dict(),
            )

    try:
        nasa_path, nasa, latest_date = _load_nasa_data(nasa_csv)
        soil = load_soil_data()
        history = load_field_history()
        crops = load_crop_knowledge()
        matching_soil = soil.loc[soil["field_id"].eq(field_id)]
        if not matching_soil.empty:
            latitude = float(matching_soil.iloc[-1]["latitude"])
            longitude = float(matching_soil.iloc[-1]["longitude"])
            coordinate_source = "bundled_soil_record"
        else:
            latitude, longitude = 23.8103, 90.4125
            coordinate_source = "example_coordinate_fallback"
        requested_date = decision_date or latest_date.date().isoformat()
        smap = load_smap_data(
            latitude,
            longitude,
            "1900-01-01",
            requested_date,
        )
        state = build_field_state(
            field_id=field_id,
            latitude=latitude,
            longitude=longitude,
            decision_date=requested_date,
            nasa_power_data=nasa,
            smap_data=smap,
            soil_data=soil,
            field_history_data=history,
            crop_knowledge=crops,
        )
        features = build_features(state, environmental_history=nasa)
        result["environment"] = _section(
            "available",
            {
                "source": "NASA POWER Daily Point processed observations",
                "csv": str(nasa_path),
                "latest_valid_observation_date": _json_value(latest_date),
                "rows": len(nasa),
                "label": "daily processed environmental data; not instant live data",
            },
        )
        result["field_state"] = _section(
            "available",
            {
                "state": _json_value(state),
                "soil_source": _json_value(state.soil_source),
                "soil_status": _json_value(state.data_status.get("soil")),
                "soil_moisture_source": _json_value(state.soil_moisture_source),
                "soil_moisture_status": _json_value(
                    state.data_status.get("soil_moisture")
                ),
                "field_history_status": _json_value(
                    state.data_status.get("history")
                ),
                "crop_knowledge_status": _json_value(
                    state.data_status.get("crop")
                ),
                "coordinate_source": coordinate_source,
            },
        )
        result["features"] = _section(
            "available",
            {
                "values": _json_value(features),
                "seasonal_water_availability": {
                    "value_mm": _json_value(features.get("available_water_mm")),
                    "status": (
                        "available"
                        if _json_value(features.get("available_water_mm")) is not None
                        else "unknown"
                    ),
                    "source": _json_value(
                        features.get("available_water_source", "unknown")
                    ),
                },
                "unknown_feature_count": sum(
                    value is None
                    for name, value in _json_value(features).items()
                    if name != "provenance"
                ),
            },
        )
        result["agronomic_rules"] = _section(
            "available",
            _json_value(
                evaluate_all_crops(
                    crops,
                    state,
                    features=features,
                    field_history=history,
                )
            ),
        )
        planning_periods = ("Season 1", "Season 2", "Season 3", "Season 4")
        plan = optimize_rotation(
            state,
            crops=crops,
            features=features,
            field_history=history,
            planning_periods=planning_periods,
        )
        plan["compatibility_status_by_crop"] = {
            crop: details["overall_compatibility"]
            for crop, details in plan["compatibility_by_crop"].items()
        }
        result["rotation_plan"] = _section(
            plan["status"],
            {
                "result": _json_value(
                    {
                        key: plan.get(key)
                        for key in (
                            "status",
                            "solver_status",
                            "planning_periods",
                            "selected_crop_by_period",
                            "objective_value",
                            "profit_component",
                            "water_component",
                            "soil_component",
                            "normalized_components",
                            "weights",
                            "constraint_summary",
                            "data_status",
                            "provenance",
                            "objective_label",
                            "compatibility_status_by_crop",
                            "monetary_component_status",
                        )
                    }
                ),
                "interpretation": (
                    "illustrative constrained long-term plan; not an applied action"
                ),
                "periods": list(planning_periods),
            },
        )
        strategies = generate_rotation_strategies(
            state,
            crops=crops,
            features=features,
            field_history=history,
            planning_periods=planning_periods,
        )
        result["strategy_profiles"] = _section(
            "available",
            {
                "result": {
                    "status": strategies["status"],
                    "profiles": _json_value(
                        {
                            name: {
                                "weights": strategy["requested_weights"],
                                "effective_weights": strategy["effective_weights"],
                                "rotation": strategy["selected_crop_by_period"],
                                "status": strategy["status"],
                                "solver_status": strategy["solver_status"],
                                "objective_value": strategy["objective_value"],
                                "same_rotation_as": strategy["same_rotation_as"],
                                "objective_components": {
                                    key: strategy.get(key)
                                    for key in (
                                        "profit_component",
                                        "water_component",
                                        "soil_component",
                                    )
                                },
                                "normalized_components": strategy.get(
                                    "normalized_components"
                                ),
                                "monetary_component_status": strategy.get(
                                    "monetary_component_status"
                                ),
                                "objective_label": strategy.get("objective_label"),
                            }
                            for name, strategy in strategies["strategies"].items()
                        }
                    ),
                    "provenance": _json_value(strategies["provenance"]),
                },
                "interpretation": (
                    "profile assumptions and MILP outputs; identical rotations "
                    "remain identical and do not imply a superior strategy"
                ),
            },
        )
        stress = run_stress_tests(
            state,
            features=features,
            crops=crops,
            field_history=history,
            run_milp=True,
        )
        baseline_optimization = stress["baseline"]["optimizer_result"]
        result["stress_tests"] = _section(
            "available",
            {
                "result": {
                    "status": stress["status"],
                    "baseline_optimizer": _json_value(
                        {
                            "status": baseline_optimization.get("status"),
                            "solver_status": baseline_optimization.get(
                                "solver_status"
                            ),
                            "rotation": baseline_optimization.get(
                                "selected_crop_by_period"
                            ),
                            "objective_value": baseline_optimization.get(
                                "objective_value"
                            ),
                            "objective_components": {
                                name: baseline_optimization.get(
                                    f"{name}_component"
                                )
                                for name in ("profit", "water", "soil")
                            },
                        }
                    ),
                    "scenarios": _json_value(
                        {
                            name: {
                                "status": scenario["status"],
                                "reason": scenario["reason"],
                                "assumptions": scenario["assumptions"],
                                "changed_fields": scenario["changed_fields"],
                                "compatibility_changes": scenario[
                                    "compatibility_changes"
                                ],
                                "baseline_rotation": scenario[
                                    "baseline_rotation"
                                ],
                                "scenario_rotation": scenario[
                                    "scenario_rotation"
                                ],
                                "rotation_changed": scenario[
                                    "rotation_changed"
                                ],
                                "optimizer_status": scenario.get(
                                    "optimizer_status"
                                ),
                                "baseline_objective_components": scenario[
                                    "baseline_objective_components"
                                ],
                                "scenario_objective_components": scenario[
                                    "scenario_objective_components"
                                ],
                                "scenario_solver_status": (
                                    scenario.get(
                                        "scenario_optimizer_result", {}
                                    ).get("solver_status")
                                    if scenario.get("scenario_optimizer_result")
                                    is not None
                                    else baseline_optimization.get("solver_status")
                                    if name == "normal"
                                    else None
                                ),
                                "provenance": scenario["provenance"],
                            }
                            for name, scenario in stress["scenarios"].items()
                        }
                    ),
                    "provenance": _json_value(stress["provenance"]),
                },
                "interpretation": "hypothetical what-if scenarios, not forecasts",
            },
        )
        environment = FieldShiftEnvironment(
            state,
            environmental_history=nasa,
            features=features,
        )
        readiness = assess_learning_readiness(environment)
        result["rl_readiness"] = _section(
            readiness.status,
            readiness.to_dict(),
            "No farm reward or action-conditioned transition model is configured.",
        )
    except (OSError, ValueError, TypeError, RuntimeError) as error:
        result["environment"] = _section(
            "unavailable",
            reason=f"{type(error).__name__}: {error}",
        )
        for name in (
            "field_state",
            "features",
            "agronomic_rules",
            "rotation_plan",
            "strategy_profiles",
            "stress_tests",
        ):
            if result[name]["status"] == "unavailable":
                result[name] = _section(
                    "unavailable",
                    reason="Required local source data could not be assembled.",
                )
        result["rl_readiness"] = _section(
            "blocked_missing_outcome_evidence",
            reason="Field state could not be assembled; no training is enabled.",
        )
    return _json_value(result)


def render_dashboard(data: dict) -> str:
    """Render escaped, read-only dashboard HTML from a data snapshot."""
    sections = []
    for name, value in data.items():
        label = html.escape(name.replace("_", " ").title())
        serialized = html.escape(
            json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True)
        )
        sections.append(
            f"<section><h2>{label}</h2><pre>{serialized}</pre></section>"
        )
    return (
        "<!doctype html><html lang='en'><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        "<title>FieldShift</title>"
        "<style>body{font:15px system-ui;max-width:1100px;margin:2rem auto;"
        "padding:0 1rem;background:#f4f7f2;color:#17251b}h1{color:#205b37}"
        "section{background:white;border:1px solid #d5dfd6;border-radius:8px;"
        "padding:1rem;margin:1rem 0}pre{white-space:pre-wrap;overflow-wrap:anywhere}"
        "</style><body><h1>FieldShift</h1><p>Read-only local research view. "
        "NASA values are daily processed observations. Demo records are not farm "
        "evidence. Plans are not applied actions.</p>"
        + "".join(sections)
        + "</body></html>"
    )


def _parser():
    parser = argparse.ArgumentParser(
        prog="fieldshift-dashboard",
        description="Serve a read-only FieldShift research dashboard on localhost.",
    )
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--field-id", default="field_001")
    parser.add_argument("--decision-date")
    parser.add_argument("--nasa-csv")
    parser.add_argument("--farm-outcomes-csv")
    return parser


def main(argv=None) -> int:
    args = _parser().parse_args(argv)
    if not 1 <= args.port <= 65535:
        raise SystemExit("--port must be between 1 and 65535.")
    snapshot = build_dashboard_data(
        field_id=args.field_id,
        decision_date=args.decision_date,
        nasa_csv=args.nasa_csv,
        farm_outcomes_csv=args.farm_outcomes_csv,
    )
    page = render_dashboard(snapshot).encode("utf-8")

    class DashboardHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path not in {"/", "/index.html"}:
                self.send_error(404)
                return
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(page)))
            self.end_headers()
            self.wfile.write(page)

        def log_message(self, format_string, *args):
            return

    try:
        server = ThreadingHTTPServer((args.host, args.port), DashboardHandler)
    except OSError as error:
        print(f"Could not start local dashboard: {error}")
        return 2
    print(f"FieldShift dashboard available at http://{args.host}:{args.port}/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
