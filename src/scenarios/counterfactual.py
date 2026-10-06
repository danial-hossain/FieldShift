"""Counterfactual analysis grounded in the existing synthetic ML pipeline.

The counterfactual engine keeps the original baseline intact, modifies only the
requested variable, reruns the existing model, and reports what changed. It is
not a real-world forecast or causal estimate.
"""

from __future__ import annotations

import copy
from typing import Any, Mapping, Optional

from src.experiments.synthetic_ml_demo import (
    predict_synthetic_yield,
)


def _coerce_state(field_state: Any) -> Any:
    if hasattr(field_state, "to_dict"):
        return field_state
    raise TypeError("field_state must be a FieldState-like object with to_dict().")


def run_counterfactual_analysis(
    field_state: Any,
    *,
    variable: str,
    delta: float,
    extra_features: Optional[Mapping[str, Any]] = None,
    model: Optional[Mapping[str, Any]] = None,
) -> dict[str, Any]:
    """Compare a baseline model estimate to a single-variable counterfactual."""
    state = _coerce_state(field_state)
    baseline = predict_synthetic_yield(state, extra_features=extra_features, model=model)

    baseline_payload = state.to_dict()
    if variable not in baseline_payload:
        raise ValueError(f"Variable '{variable}' is not present in the baseline state.")

    if isinstance(delta, bool):
        raise ValueError("delta must be numeric and finite.")
    try:
        delta_value = float(delta)
    except (TypeError, ValueError) as exc:
        raise ValueError("delta must be a numeric and finite value.") from exc
    if not __import__("math").isfinite(delta_value):
        raise ValueError("delta must be a numeric and finite value.")

    mutated_payload = copy.deepcopy(baseline_payload)
    current_value = float(mutated_payload[variable])
    mutated_payload[variable] = current_value + delta_value

    if hasattr(state, "from_dict"):
        try:
            mutated_state = state.from_dict(mutated_payload)
        except ValueError as exc:
            raise ValueError(
                f"Counterfactual update for '{variable}' is invalid: {exc}"
            ) from exc
    else:
        raise TypeError("field_state does not support reconstruction from a dictionary.")

    counterfactual = predict_synthetic_yield(
        mutated_state,
        extra_features=extra_features,
        model=model,
    )
    baseline_value = float(baseline["synthetic_demo_prediction"]["predicted_value"])
    counterfactual_value = float(
        counterfactual["synthetic_demo_prediction"]["predicted_value"]
    )

    return {
        "baseline_field_id": baseline["field_id"],
        "variable": variable,
        "baseline_value": current_value,
        "counterfactual_value": mutated_payload[variable],
        "baseline_prediction_t_ha": baseline_value,
        "counterfactual_prediction_t_ha": counterfactual_value,
        "delta_prediction_t_ha": counterfactual_value - baseline_value,
        "result_kind": "counterfactual_synthetic_scenario",
        "provenance": {
            "baseline_preserved": True,
            "counterfactual_output": True,
            "scientific_boundary": "synthetic model simulation only; not a real-world forecast or field outcome",
        },
        "baseline_state_unchanged": baseline_payload == state.to_dict(),
        "counterfactual_state": mutated_state.to_dict(),
        "baseline_prediction": baseline,
        "counterfactual_prediction": counterfactual,
    }


__all__ = ["run_counterfactual_analysis"]
