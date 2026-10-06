"""One-step offline action ranking from observed crop-treatment trial records.

This is a contextual-bandit research prototype, not sequential RL. It ranks
trial treatment labels by modelled yield within their source workbook and crop;
it does not estimate causal treatment effects or provide farm recommendations.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any, Mapping

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from src.experiments.real_yield_training import (
    DEFAULT_OUTPUT,
    TARGET_COLUMN,
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BANDIT_DIR = PROJECT_ROOT / "models" / "ethiopia_trial_bandit"
NUMERIC_CONTEXT = ("year", "altitude_m", "planting_day_of_year")
CATEGORICAL_CONTEXT = (
    "crop",
    "variety",
    "source_workbook",
    "region",
    "crop_system",
    "landscape_strata",
    "soil_type",
    "treatment",
)
CONTEXT_COLUMNS = (*NUMERIC_CONTEXT, *CATEGORICAL_CONTEXT)
MINIMUM_TREATMENT_RECORDS = 6
MINIMUM_TREATMENT_SITES = 2


def _site_groups(frame: pd.DataFrame) -> pd.Series:
    location_columns = ("country", "region", "district", "village")
    return (
        frame[list(location_columns)]
        .fillna("")
        .astype(str)
        .agg("|".join, axis=1)
        .str.strip("|")
    )


def _validate_trial_records(records: pd.DataFrame) -> pd.DataFrame:
    required = {
        *CONTEXT_COLUMNS,
        TARGET_COLUMN,
        "country",
        "district",
        "village",
        "evidence_class",
        "data_status",
    }
    missing = sorted(required - set(records.columns))
    if missing:
        raise ValueError("Trial records are missing columns: " + ", ".join(missing))
    if records.empty:
        raise ValueError("Trial records cannot be empty.")
    if not records["evidence_class"].eq("observed_trial_record").all():
        raise ValueError("Only observed trial records are accepted.")
    if not records["data_status"].eq("observed").all():
        raise ValueError("Synthetic or unverified records cannot train this prototype.")

    frame = records.copy().reset_index(drop=True)
    frame[TARGET_COLUMN] = pd.to_numeric(frame[TARGET_COLUMN], errors="coerce")
    if (
        frame[TARGET_COLUMN].isna().any()
        or not np.isfinite(frame[TARGET_COLUMN].to_numpy(dtype=float)).all()
        or (frame[TARGET_COLUMN] <= 0).any()
    ):
        raise ValueError("Observed yield targets must be finite positive t/ha values.")
    for name in ("crop", "treatment", "source_workbook"):
        if frame[name].isna().any() or frame[name].astype(str).str.strip().eq("").any():
            raise ValueError(f"Trial records require non-empty {name} values.")
    frame["group_site"] = _site_groups(frame)
    if frame["group_site"].nunique() < 2:
        raise ValueError("At least two recorded sites are required.")
    return frame


def _build_pipeline() -> Pipeline:
    numeric = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median", add_indicator=True)),
            ("scale", StandardScaler()),
        ]
    )
    categorical = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value="Unknown")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )
    preprocess = ColumnTransformer(
        transformers=[
            ("numeric", numeric, list(NUMERIC_CONTEXT)),
            ("categorical", categorical, list(CATEGORICAL_CONTEXT)),
        ],
        remainder="drop",
    )
    return Pipeline(
        steps=[
            ("preprocess", preprocess),
            (
                "model",
                HistGradientBoostingRegressor(
                    max_iter=200,
                    l2_regularization=1.0,
                    random_state=42,
                ),
            ),
        ]
    )


def compare_trial_contextual_bandit(
    records: pd.DataFrame,
    *,
    max_splits: int = 5,
) -> dict[str, Any]:
    """Evaluate observed action-conditioned yield prediction on held-out sites."""
    frame = _validate_trial_records(records)
    x = frame[list(CONTEXT_COLUMNS)]
    y = frame[TARGET_COLUMN].to_numpy(dtype=float)
    groups = frame["group_site"].to_numpy()
    splits = list(
        GroupKFold(n_splits=min(max_splits, frame["group_site"].nunique())).split(
            x, y, groups
        )
    )
    predictions = np.full(len(frame), np.nan, dtype=float)
    folds = []
    for train_indices, test_indices in splits:
        model = _build_pipeline()
        model.fit(x.iloc[train_indices], y[train_indices])
        fold_predictions = model.predict(x.iloc[test_indices])
        predictions[test_indices] = fold_predictions
        folds.append(
            {
                "held_out_sites": sorted(set(groups[test_indices].tolist())),
                "train_rows": int(len(train_indices)),
                "test_rows": int(len(test_indices)),
                "rmse_t_ha": float(
                    math.sqrt(mean_squared_error(y[test_indices], fold_predictions))
                ),
            }
        )
    if not np.isfinite(predictions).all():
        raise RuntimeError("Grouped evaluation did not predict every observed trial row.")
    return {
        "evaluation_protocol": (
            "GroupKFold by recorded country/region/district/village; predicts "
            "yield for the treatment actually observed in each held-out record."
        ),
        "split_count": len(splits),
        "site_group_count": int(frame["group_site"].nunique()),
        "row_count": int(len(frame)),
        "logged_action_reward_prediction": {
            "mae_t_ha": float(mean_absolute_error(y, predictions)),
            "rmse_t_ha": float(math.sqrt(mean_squared_error(y, predictions))),
            "r2": float(r2_score(y, predictions)),
        },
        "folds": folds,
        "counterfactual_policy_value": None,
        "counterfactual_evaluation_reason": (
            "The archive supplies no treatment-assignment propensities or "
            "predeclared counterfactual evaluation design."
        ),
        "causal_treatment_effects_estimated": False,
        "bangladesh_validation": False,
    }


def train_trial_contextual_bandit(
    *,
    records_path: str | Path = DEFAULT_OUTPUT / "observed_yield_records.csv",
    output_dir: str | Path = DEFAULT_BANDIT_DIR,
) -> dict[str, Any]:
    """Fit and persist an offline, one-step trial-treatment ranking model."""
    path = Path(records_path)
    if not path.is_file():
        raise FileNotFoundError(f"Normalized observed trial data not found: {path}")
    records = _validate_trial_records(pd.read_csv(path))
    evaluation = compare_trial_contextual_bandit(records)
    model = _build_pipeline()
    model.fit(records[list(CONTEXT_COLUMNS)], records[TARGET_COLUMN].to_numpy(dtype=float))

    action_support = (
        records.groupby(["crop", "source_workbook", "treatment"], dropna=False)
        .agg(
            record_count=(TARGET_COLUMN, "size"),
            site_count=("group_site", "nunique"),
        )
        .reset_index()
    )
    eligible = action_support.loc[
        (action_support["record_count"] >= MINIMUM_TREATMENT_RECORDS)
        & (action_support["site_count"] >= MINIMUM_TREATMENT_SITES)
    ]
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    model_path = output_path / "ethiopia_trial_contextual_bandit.joblib"
    report_path = output_path / "training_report.json"
    artifact = {
        "pipeline": model,
        "context_columns": list(CONTEXT_COLUMNS),
        "target": TARGET_COLUMN,
        "target_units": "t/ha",
        "action_column": "treatment",
        "action_scope": ["crop", "source_workbook"],
        "action_support": action_support.to_dict(orient="records"),
        "minimum_action_records": MINIMUM_TREATMENT_RECORDS,
        "minimum_action_sites": MINIMUM_TREATMENT_SITES,
        "evidence_class": "observed_trial_record",
        "country": "Ethiopia",
        "dataset_doi": "10.7910/DVN/ZXH0R8",
        "policy_type": "one_step_offline_contextual_bandit",
        "not_for_farm_recommendations": True,
    }
    joblib.dump(artifact, model_path)
    report = {
        "status": "trained_for_offline_research_only",
        "model_artifact": str(model_path),
        "policy_type": "one_step_offline_contextual_bandit",
        "sequential_rl_status": "not_trained",
        "record_count": int(len(records)),
        "site_count": int(records["group_site"].nunique()),
        "eligible_action_count": int(len(eligible)),
        "evaluation": evaluation,
        "limitations": [
            "Training data are Ethiopian crop-treatment trials, not Bangladesh farm records.",
            "Treatment labels are experiment inputs, not general-purpose farm actions.",
            "Model rankings predict observed yield; they do not estimate causal treatment effects.",
            "No action propensities are available, so counterfactual policy value is not estimated.",
            "The model is one-step and has no state transitions, delayed outcomes, or multi-season learning.",
            "Candidate actions are restricted to the same crop and source workbook and to treatments replicated at multiple recorded sites.",
            "This model is not integrated into the app and must not be used as agronomic advice.",
        ],
    }
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def rank_trial_treatments(
    context: Mapping[str, Any],
    *,
    model_path: str | Path = DEFAULT_BANDIT_DIR
    / "ethiopia_trial_contextual_bandit.joblib",
) -> dict[str, Any]:
    """Rank supported trial treatments for one explicit crop/workbook context."""
    if not isinstance(context, Mapping):
        raise TypeError("context must be a mapping.")
    if not {"crop", "source_workbook"}.issubset(context):
        raise ValueError("context must include crop and source_workbook.")
    if not Path(model_path).is_file():
        raise FileNotFoundError(f"Contextual-bandit model not found: {model_path}")
    artifact = joblib.load(model_path)
    crop = str(context["crop"])
    workbook = str(context["source_workbook"])
    support = pd.DataFrame(artifact["action_support"])
    eligible = support.loc[
        (support["crop"].astype(str) == crop)
        & (support["source_workbook"].astype(str) == workbook)
        & (support["record_count"] >= artifact["minimum_action_records"])
        & (support["site_count"] >= artifact["minimum_action_sites"])
    ]
    if eligible.empty:
        raise ValueError(
            "No sufficiently replicated trial treatments exist for this crop "
            "and source workbook."
        )
    candidates = []
    for row in eligible.to_dict(orient="records"):
        features = {
            name: context.get(name)
            for name in artifact["context_columns"]
        }
        features.update(
            {
                "crop": crop,
                "source_workbook": workbook,
                "treatment": str(row["treatment"]),
            }
        )
        predicted_yield = float(
            artifact["pipeline"].predict(pd.DataFrame([features]))[0]
        )
        if not math.isfinite(predicted_yield):
            raise RuntimeError("Model returned a non-finite predicted yield.")
        candidates.append(
            {
                "treatment": str(row["treatment"]),
                "predicted_yield_t_ha": predicted_yield,
                "observed_record_count": int(row["record_count"]),
                "observed_site_count": int(row["site_count"]),
            }
        )
    candidates.sort(
        key=lambda item: (-item["predicted_yield_t_ha"], item["treatment"])
    )
    return {
        "status": "exploratory_trial_treatment_ranking",
        "policy_type": "one_step_offline_contextual_bandit",
        "crop": crop,
        "source_workbook": workbook,
        "ranked_treatments": candidates,
        "recommendation_status": "not_farm_advice",
        "sequential_rl": False,
        "bangladesh_validated": False,
    }


if __name__ == "__main__":
    print(json.dumps(train_trial_contextual_bandit(), indent=2))
