"""Read-only anomaly detection for field inputs and model outputs.

This module flags unusual but not necessarily invalid values. It never silently
replaces or corrects inputs; the detection is a warning layer above the hard
validation used throughout the project.
"""

from __future__ import annotations

from typing import Any, Mapping, Sequence


_DEFAULT_RANGES: dict[str, tuple[float, float]] = {
    "temperature": (-10.0, 60.0),
    "temp_max": (-10.0, 60.0),
    "temp_min": (-10.0, 60.0),
    "rainfall": (0.0, 5000.0),
    "humidity": (0.0, 100.0),
    "wind_speed": (0.0, 200.0),
    "soil_moisture": (0.0, 1.0),
    "nitrogen": (0.0, 500.0),
    "phosphorus": (0.0, 200.0),
    "potassium": (0.0, 500.0),
    "ph": (0.0, 14.0),
    "organic_matter": (0.0, 100.0),
    "previous_yield": (0.0, 30.0),
    "latitude": (-90.0, 90.0),
    "longitude": (-180.0, 180.0),
}


def _as_mapping(value: Any) -> Mapping[str, Any]:
    if hasattr(value, "to_dict"):
        return value.to_dict()
    if isinstance(value, Mapping):
        return value
    raise TypeError("value must be a FieldState-like object or mapping.")


def detect_anomalies(value: Any) -> dict[str, Any]:
    """Flag unusual values without mutating the underlying record."""
    payload = _as_mapping(value)
    anomalies: list[dict[str, Any]] = []

    for key, (minimum, maximum) in _DEFAULT_RANGES.items():
        if key not in payload:
            continue
        raw = payload.get(key)
        if raw is None or raw == "nan":
            continue
        try:
            number = float(raw)
        except (TypeError, ValueError):
            continue
        if number < minimum or number > maximum:
            anomalies.append(
                {
                    "field": key,
                    "value": number,
                    "expected_range": [minimum, maximum],
                    "severity": "warning",
                    "classification": "anomaly",
                    "note": "Unusual but not invalid value; no automatic correction applied.",
                    "provenance": "input_validation",
                }
            )

    for key in ("previous_crop", "texture"):
        if key in payload and payload.get(key) is not None and len(str(payload[key]).strip()) == 0:
            anomalies.append(
                {
                    "field": key,
                    "value": payload[key],
                    "expected_range": "non-empty value",
                    "severity": "warning",
                    "classification": "anomaly",
                    "note": "Empty text value flagged for review; no silent replacement performed.",
                    "provenance": "input_validation",
                }
            )

    return {
        "status": "ok" if not anomalies else "warning",
        "anomalies": anomalies,
        "anomaly_count": len(anomalies),
        "provenance": {
            "source": "read_only_anomaly_detection",
            "autocorrection_applied": False,
            "scientific_boundary": "anomaly flag only; not a recommendation or rejection",
        },
    }


__all__ = ["detect_anomalies"]
