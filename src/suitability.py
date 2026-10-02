"""Explainable Phase 3 crop-compatibility signals.

Suitability signals here are deterministic comparisons over demo/placeholder
inputs. They are not feasibility constraints, optimized recommendations, yield
predictions, or agronomic probabilities.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal, Mapping

from src.data_loader import load_agronomic_rules, load_rotation_rules
from src.field_state import (
    CandidateCrop,
    DataProvenance,
    FieldState,
    build_candidate_crop,
    build_candidate_crops,
)

CompatibilityStatus = Literal[
    "compatible", "borderline", "incompatible", "unknown"
]
SIGNAL_NAMES = (
    "temperature",
    "soil_ph",
    "rainfall",
    "irrigation",
    "rotation",
)


@dataclass(frozen=True)
class CompatibilityEvidence:
    """Machine-readable evidence for one compatibility signal."""

    feature: str
    result: CompatibilityStatus
    field_value: Any
    candidate_min: float | None = None
    candidate_max: float | None = None
    candidate_value: Any = None
    rule_id: str | None = None
    reason: str = ""


@dataclass(frozen=True)
class CandidateEvaluation:
    """Categorical signals and the exact evidence used to produce them."""

    crop_id: str
    compatibility: Mapping[str, CompatibilityStatus]
    evidence: tuple[CompatibilityEvidence, ...]
    provenance: Mapping[str, DataProvenance]
    warnings: tuple[str, ...]


def _range_evidence(
    *,
    feature: str,
    value: float | None,
    minimum: float | None,
    maximum: float | None,
    rule_id: str | None = None,
) -> CompatibilityEvidence:
    if value is None:
        return CompatibilityEvidence(
            feature=feature,
            result="unknown",
            field_value=None,
            candidate_min=minimum,
            candidate_max=maximum,
            rule_id=rule_id,
            reason="The field feature is unavailable.",
        )
    if minimum is None or maximum is None:
        return CompatibilityEvidence(
            feature=feature,
            result="unknown",
            field_value=value,
            candidate_min=minimum,
            candidate_max=maximum,
            rule_id=rule_id,
            reason="The candidate requirement range is incomplete.",
        )
    result: CompatibilityStatus = (
        "compatible" if minimum <= value <= maximum else "incompatible"
    )
    return CompatibilityEvidence(
        feature=feature,
        result=result,
        field_value=value,
        candidate_min=minimum,
        candidate_max=maximum,
        rule_id=rule_id,
        reason=(
            "The observed descriptive value is inside the declared range."
            if result == "compatible"
            else "The observed descriptive value is outside the declared range."
        ),
    )


def _rainfall_evidence(
    field_state: FieldState, candidate: CandidateCrop
) -> CompatibilityEvidence:
    if field_state.climate.total_precipitation is None:
        reason = "Historical precipitation is unavailable."
    elif candidate.rainfall_requirement_mm is None:
        reason = "The candidate rainfall requirement is unavailable."
    else:
        reason = (
            "Historical precipitation covers the selected climate period, while "
            "the placeholder crop requirement has no declared time basis; they "
            "are not compared."
        )
    return CompatibilityEvidence(
        feature="rainfall",
        result="unknown",
        field_value=field_state.climate.total_precipitation,
        candidate_value=candidate.rainfall_requirement_mm,
        reason=reason,
    )


def _irrigation_evidence(
    field_state: FieldState,
    candidate: CandidateCrop,
    *,
    rule_id: str | None,
) -> CompatibilityEvidence:
    available = field_state.soil.irrigation_available
    if available:
        return CompatibilityEvidence(
            feature="irrigation",
            result="compatible",
            field_value=True,
            candidate_value=candidate.water_requirement,
            rule_id=rule_id,
            reason="Irrigation is recorded as available; no capacity is inferred.",
        )
    if candidate.water_requirement.lower() == "high":
        return CompatibilityEvidence(
            feature="irrigation",
            result="borderline",
            field_value=False,
            candidate_value=candidate.water_requirement,
            rule_id=rule_id,
            reason=(
                "The placeholder water category is high and irrigation is not "
                "recorded; this is a demo review flag, not a hard constraint."
            ),
        )
    return CompatibilityEvidence(
        feature="irrigation",
        result="unknown",
        field_value=False,
        candidate_value=candidate.water_requirement,
        rule_id=rule_id,
        reason=(
            "No irrigation is recorded, but the demo water category and historical "
            "rainfall do not establish crop-period water feasibility."
        ),
    )


def _rotation_evidence(
    field_state: FieldState,
    candidate: CandidateCrop,
    rotation_rules: Mapping[str, Any],
) -> CompatibilityEvidence:
    previous_crop = field_state.history.previous_crop_id
    previous_family = field_state.history.previous_crop_family
    if previous_crop is None:
        return CompatibilityEvidence(
            feature="rotation",
            result="unknown",
            field_value=None,
            candidate_value=candidate.crop_id,
            reason="No prior crop record is available.",
        )

    soft_rules = {
        rule["type"]: rule
        for rule in rotation_rules.get("soft_preferences", [])
        if rule.get("status") == "demo_only"
    }
    same_crop_rule = soft_rules.get("same_crop_consecutive")
    same_family_rule = soft_rules.get("same_family_consecutive")
    if previous_crop == candidate.crop_id and same_crop_rule is not None:
        return CompatibilityEvidence(
            feature="rotation",
            result="borderline",
            field_value=previous_crop,
            candidate_value=candidate.crop_id,
            rule_id=str(same_crop_rule["rule_id"]),
            reason="Candidate repeats the previous crop under a soft demo preference.",
        )
    if previous_family == candidate.crop_family and same_family_rule is not None:
        return CompatibilityEvidence(
            feature="rotation",
            result="borderline",
            field_value=previous_family,
            candidate_value=candidate.crop_family,
            rule_id=str(same_family_rule["rule_id"]),
            reason="Candidate repeats the previous crop family under a soft demo preference.",
        )
    if same_crop_rule is None and same_family_rule is None:
        return CompatibilityEvidence(
            feature="rotation",
            result="unknown",
            field_value=previous_crop,
            candidate_value=candidate.crop_id,
            reason="No applicable active demo rotation preference is available.",
        )
    return CompatibilityEvidence(
        feature="rotation",
        result="compatible",
        field_value={"crop_id": previous_crop, "crop_family": previous_family},
        candidate_value={
            "crop_id": candidate.crop_id,
            "crop_family": candidate.crop_family,
        },
        reason="Candidate does not repeat the previous crop or crop family.",
    )


def evaluate_candidate(
    field_state: FieldState,
    candidate: CandidateCrop,
    *,
    agronomic_rules: Mapping[str, Any] | None = None,
    rotation_rules: Mapping[str, Any] | None = None,
) -> CandidateEvaluation:
    """Evaluate one structured candidate without ranking or optimization."""

    agronomic = (
        load_agronomic_rules() if agronomic_rules is None else agronomic_rules
    )
    rotation = load_rotation_rules() if rotation_rules is None else rotation_rules
    agronomic_by_type = {
        rule["type"]: rule for rule in agronomic.get("soft_preferences", [])
    }
    ph_rule = agronomic_by_type.get("soil_ph_compatibility")
    irrigation_rule = agronomic_by_type.get("irrigation_compatibility")
    evidence = (
        _range_evidence(
            feature="temperature",
            value=field_state.climate.mean_temperature,
            minimum=candidate.temperature_min,
            maximum=candidate.temperature_max,
        ),
        _range_evidence(
            feature="soil_ph",
            value=field_state.soil.ph,
            minimum=candidate.soil_ph_min,
            maximum=candidate.soil_ph_max,
            rule_id=None if ph_rule is None else str(ph_rule["rule_id"]),
        ),
        _rainfall_evidence(field_state, candidate),
        _irrigation_evidence(
            field_state,
            candidate,
            rule_id=(
                None if irrigation_rule is None else str(irrigation_rule["rule_id"])
            ),
        ),
        _rotation_evidence(field_state, candidate, rotation),
    )
    compatibility = {item.feature: item.result for item in evidence}
    return CandidateEvaluation(
        crop_id=candidate.crop_id,
        compatibility=compatibility,
        evidence=evidence,
        provenance={
            **field_state.provenance,
            **{f"candidate_{key}": value for key, value in candidate.provenance.items()},
            "agronomic_rules": DataProvenance(
                source_type=str(agronomic["metadata"]["source_type"]),
                data_status=str(agronomic["metadata"].get("status", "unknown")),
                detail=(
                    "Demo-only soft/informational rules; null thresholds remain "
                    "non-operative."
                ),
            ),
            "rotation_rules": DataProvenance(
                source_type=str(rotation["metadata"]["source_type"]),
                data_status=str(rotation["metadata"].get("status", "unknown")),
                detail="Soft demo preferences only; not feasibility constraints.",
            ),
        },
        warnings=(
            "Compatibility uses placeholder/synthetic inputs and is not a validated recommendation.",
            "Unknown signals are intentionally not imputed.",
            "No hard constraints, probability, ranking, feasibility, or optimization is calculated.",
        ),
    )


def evaluate_candidate_crop(
    field_state: FieldState,
    crop_id: str,
    *,
    agronomic_rules_path: str | Path | None = None,
    rotation_rules_path: str | Path | None = None,
    crop_catalog_path: str | Path | None = None,
    crop_requirements_path: str | Path | None = None,
    crop_knowledge_path: str | Path | None = None,
) -> CandidateEvaluation:
    """High-level API for evaluating a known crop identifier."""

    candidate = build_candidate_crop(
        crop_id,
        crop_catalog_path=crop_catalog_path,
        crop_requirements_path=crop_requirements_path,
        crop_knowledge_path=crop_knowledge_path,
    )
    return evaluate_candidate(
        field_state,
        candidate,
        agronomic_rules=load_agronomic_rules(agronomic_rules_path),
        rotation_rules=load_rotation_rules(rotation_rules_path),
    )


def evaluate_all_candidates(
    field_state: FieldState,
    *,
    agronomic_rules_path: str | Path | None = None,
    rotation_rules_path: str | Path | None = None,
    crop_catalog_path: str | Path | None = None,
    crop_requirements_path: str | Path | None = None,
    crop_knowledge_path: str | Path | None = None,
) -> tuple[CandidateEvaluation, ...]:
    """Evaluate all candidates in catalog order; no ranking is applied."""

    candidates = build_candidate_crops(
        crop_catalog_path=crop_catalog_path,
        crop_requirements_path=crop_requirements_path,
        crop_knowledge_path=crop_knowledge_path,
    )
    agronomic = load_agronomic_rules(agronomic_rules_path)
    rotation = load_rotation_rules(rotation_rules_path)
    return tuple(
        evaluate_candidate(
            field_state,
            candidate,
            agronomic_rules=agronomic,
            rotation_rules=rotation,
        )
        for candidate in candidates
    )
