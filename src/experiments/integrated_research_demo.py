"""Offline, deterministic research demo for the existing FieldShift workflow.

This script intentionally reuses the repository's real FieldState, ML, MILP,
RL, stress-test, and dashboard modules. It does not claim field-validated
performance; every estimate is explicitly labeled as synthetic/demo-only.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Optional

import pandas as pd

from src.dashboard import build_dashboard_data, render_dashboard
from src.data.crops import load_crop_knowledge
from src.data.field_history import load_field_history
from src.data.smap import load_smap_data
from src.data.soil import load_soil_data
from src.experiments.synthetic_ml_demo import (
    MODEL_PATH,
    load_synthetic_yield_model,
    predict_synthetic_yield,
    train_synthetic_yield_model,
)
from src.integration.milp_rl import (
    adapt_milp_result,
    run_synthetic_policy_step,
)
from src.optimizer.milp import optimize_rotation
from src.preprocessing.features import build_features
from src.rl.agent import DeterministicBaselinePolicy
from src.rl.environment import FieldShiftEnvironment
from src.rl.synthetic_q_learning import (
    DEFAULT_POLICY_PATH,
    load_synthetic_q_policy,
)
from src.scenarios.stress_test import run_stress_tests
from src.state.field_state import build_field_state

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_NASA_PATH = (
    PROJECT_ROOT / "data" / "nasa_power" / "nasa_power_lat23.8103_lon90.4125_20260831_20260929.csv"
)
DEFAULT_OUTPUT_PATH = PROJECT_ROOT / "artifacts" / "integrated_research_demo_summary.json"
PLAN_PERIODS = ("Y1_S1", "Y1_S2", "Y2_S1", "Y2_S2", "Y3_S1", "Y3_S2")


def _json_safe(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (str, bool)):
        return value
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        if pd.isna(value) or not pd.notna(value):
            return None
        if not (value == value and value not in {float("inf"), float("-inf")}):
            return None
        if not __import__("math").isfinite(value):
            return None
        return value
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_json_safe(item) for item in value]
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    if hasattr(value, "item") and not isinstance(value, (str, bytes)):
        try:
            return _json_safe(value.item())
        except (TypeError, ValueError):
            pass
    if hasattr(value, "to_dict"):
        try:
            return _json_safe(value.to_dict())
        except Exception:
            pass
    return str(value)


def _load_demo_inputs(nasa_csv: Optional[str | Path] = None) -> dict[str, Any]:
    csv_path = Path(nasa_csv) if nasa_csv is not None else DEFAULT_NASA_PATH
    if not csv_path.exists():
        raise FileNotFoundError(f"Demo NASA POWER CSV was not found: {csv_path}")
    power = pd.read_csv(csv_path)
    if power.empty:
        raise ValueError("Demo NASA POWER CSV is empty.")
    soil = load_soil_data()
    history = load_field_history()
    crops = load_crop_knowledge()
    smap = load_smap_data(23.8103, 90.4125, "2026-09-25", "2026-09-29")
    state = build_field_state(
        "field_demo",
        23.8103,
        90.4125,
        "2026-09-29",
        power,
        smap_data=smap,
        soil_data=soil,
        field_history_data=history,
        crop_knowledge=crops,
    )
    return {
        "nasa_power": power,
        "field_state": state,
        "soil": soil,
        "field_history": history,
        "crops": crops,
        "smap": smap,
    }


def _milp_summary(plan: dict[str, Any]) -> dict[str, Any]:
    summary = {
        "status": plan.get("status"),
        "solver_status": plan.get("solver_status"),
        "feasible": bool(plan.get("feasible", False)),
        "selected_crop_by_period": plan.get("selected_crop_by_period"),
        "objective_value": plan.get("objective_value"),
        "profit_component": plan.get("profit_component"),
        "water_component": plan.get("water_component"),
        "soil_component": plan.get("soil_component"),
        "provenance": plan.get("provenance", {}),
        "constraint_summary": plan.get("constraint_summary", {}),
        "data_status": plan.get("data_status", {}),
    }
    summary["milp_context"] = adapt_milp_result(plan).to_dict()
    return summary


def run_integration_demo(
    *,
    nasa_csv: Optional[str | Path] = None,
    output_path: Optional[str | Path] = None,
) -> dict[str, Any]:
    """Execute the actual offline workflow supported by the current repository."""
    demo_inputs = _load_demo_inputs(nasa_csv=nasa_csv)
    power = demo_inputs["nasa_power"]
    state = demo_inputs["field_state"]
    crops = demo_inputs["crops"]
    history = demo_inputs["field_history"]
    features = build_features(state, environmental_history=power)

    if not MODEL_PATH.exists():
        train_synthetic_yield_model(output_dir=MODEL_PATH.parent)
    model = load_synthetic_yield_model(MODEL_PATH)
    prediction = predict_synthetic_yield(state, model=model)

    plan = optimize_rotation(
        field_state=state,
        crops=crops,
        features=features,
        field_history=history,
        planning_periods=list(PLAN_PERIODS),
    )
    milp_summary = _milp_summary(plan)
    milp_valid = plan.get("status") in {"optimal", "feasible"}

    env = FieldShiftEnvironment(
        field_state=state,
        environmental_history=power,
        features=features,
        step_limit=1,
    )
    observation, reset_info = env.reset(seed=7)
    policy = DeterministicBaselinePolicy()
    action = policy.select_action(
        observation,
        reset_info["available_actions"],
        seed=7,
    )
    validated_action = env._validate_action(action)
    _, reward, terminated, truncated, info = env.step(validated_action)
    if DEFAULT_POLICY_PATH.is_file():
        simulation_policy = load_synthetic_q_policy(DEFAULT_POLICY_PATH)
        simulation_rl = run_synthetic_policy_step(
            simulation_policy,
            plan,
            env._validate_action,
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

    stress_report = run_stress_tests(
        state,
        features=features,
        crops=crops,
        field_history=history,
        scenarios=["drought"],
        run_milp=True,
    )
    dashboard = build_dashboard_data()
    dashboard_html = render_dashboard(dashboard)

    summary = {
        "research_boundary": "synthetic_demo_only",
        "output_version": "offline_research_demo_v1",
        "nasa_power": {
            "path": str(DEFAULT_NASA_PATH if nasa_csv is None else Path(nasa_csv)),
            "rows": int(len(power)),
            "latest_valid_date": pd.Timestamp(power["date"].max()).strftime("%Y-%m-%d"),
        },
        "field_state": {
            "field_id": state.field_id,
            "as_of_date": state.as_of_date.date().isoformat(),
            "latitude": state.latitude,
            "longitude": state.longitude,
            "status": "validated",
        },
        "ml": {
            "model_name": model["model_name"],
            "model_path": str(MODEL_PATH.resolve()),
            "metadata_path": str((MODEL_PATH.parent / "synthetic_yield_demo_model.json").resolve()),
            "feature_names": model["feature_names"],
            "target_name": model["target_name"],
            "prediction_t_ha": prediction["synthetic_demo_prediction"]["predicted_value"],
            "prediction_label": "synthetic_model_estimate_only",
            "data_boundary": "synthetic_demo_only",
            "metrics": model["metrics"],
        },
        "planning": {
            "planning_context_incidentally_used": True,
            "planning_context": prediction["planning_context"],
            "milp_status": milp_summary,
            "milp_valid": milp_valid,
            "constraints_unmodified": True,
            "objective_weights_unmodified": True,
        },
        "rl": {
            "policy_type": "DeterministicBaselinePolicy",
            "proposal_action": action,
            "validated_action": validated_action,
            "safety_status": "safe_noop" if validated_action == {"action": "no_intervention"} else "safe_proposal",
            "transition_reward": reward,
            "transition_terminated": bool(terminated),
            "transition_truncated": bool(truncated),
            "transition_info": {
                "proposed_action": info.get("action_proposal"),
                "action": info.get("action"),
                "changed_fields": info.get("changed_fields", {}),
                "termination_reason": info.get("termination_reason"),
            },
            "reward_status": info.get("reward_status"),
            "simulation_trained_policy": simulation_rl,
        },
        "stress_test": {
            "status": stress_report["status"],
            "scenarios": stress_report["scenarios"],
            "baseline_optimizer_status": (
                stress_report["baseline"]["optimizer_result"].get("status")
                if stress_report["baseline"].get("optimizer_result") is not None
                else None
            ),
        },
        "dashboard": {
            "status": "available",
            "read_only": dashboard["dashboard"]["read_only"],
            "network_requests": dashboard["dashboard"]["network_requests"],
            "html_length": len(dashboard_html),
        },
        "limitations": [
            "The model is synthetic-only and not field-validated.",
            "The real-observation baseline is not a learned policy; the separate simulation-trained policy is synthetic and not field validated.",
            "MILP constraints and objective weights are unchanged; no real agronomic outcomes were used.",
        ],
    }

    destination = Path(output_path) if output_path is not None else DEFAULT_OUTPUT_PATH
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(
        json.dumps(_json_safe(summary), indent=2, sort_keys=True),
        encoding="utf-8",
    )
    return summary


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Run the FieldShift offline research workflow demo.")
    parser.add_argument(
        "--output",
        type=str,
        default=str(DEFAULT_OUTPUT_PATH),
        help="Write a JSON summary to this path.",
    )
    parser.add_argument(
        "--nasa-csv",
        type=str,
        default=None,
        help="Optional override for the NASA POWER demo CSV.",
    )
    args = parser.parse_args(argv)
    summary = run_integration_demo(nasa_csv=args.nasa_csv, output_path=args.output)
    print(
        json.dumps(
            {
                "status": "completed",
                "research_boundary": summary["research_boundary"],
                "model_path": summary["ml"]["model_path"],
                "prediction_t_ha": summary["ml"]["prediction_t_ha"],
                "milp_status": summary["planning"]["milp_status"]["status"],
                "rl_action": summary["rl"]["proposal_action"],
                "summary_path": str(Path(args.output).resolve()),
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
