"""Exploratory supervised learning with observed Ethiopian crop trial records.

This module reads the user-provided ICRISAT archive, keeps source provenance,
compares tabular regressors using site-grouped cross-validation, and writes a
separate research artifact. It does not replace FieldShift's synthetic demo
model and does not claim Bangladesh field validity.
"""

from __future__ import annotations

import hashlib
import io
import json
import math
import zipfile
from datetime import date, datetime
from pathlib import Path, PurePosixPath
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import Ridge
from sklearn.dummy import DummyRegressor

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ARCHIVE = PROJECT_ROOT / "data" / "download" / "dataverse_files.zip"
DEFAULT_OUTPUT = PROJECT_ROOT / "data" / "acquired" / "icrisat_ethiopia"
DEFAULT_MODEL_DIR = PROJECT_ROOT / "models" / "real_yield_pilot"
DATASET_DOI = "10.7910/DVN/ZXH0R8"
DATASET_URL = f"https://doi.org/{DATASET_DOI}"
TARGET_COLUMN = "yield_t_ha"
NUMERIC_FEATURES = ("year", "altitude_m", "planting_day_of_year")
CATEGORICAL_FEATURES = (
    "crop",
    "variety",
    "region",
    "crop_system",
    "landscape_strata",
    "treatment",
    "soil_type",
)
FEATURE_COLUMNS = (*NUMERIC_FEATURES, *CATEGORICAL_FEATURES)
WORKBOOK_MEMBERS = {
    "Data/2014-2015_Wheat/001_2014-2015_Wheat_ICRISAT-AR_ETH.xlsx",
    "Data/2016_Wheat/002_2016_Wheat_ ICRISAT-AR_ETH.xlsx",
    "Data/2017_SorghumTef/003_2017_Sorghum+Tef_ ICRISAT-AR_ETH.xlsx",
    "Data/2019_Wheat/004_2019_Wheat_ ICRISAT-AR_ETH.xlsx",
}
OUTPUT_COLUMNS = (
    "source_record_id",
    "source_workbook",
    "source_dataset",
    "evidence_class",
    "data_status",
    "country",
    "region",
    "district",
    "village",
    "year",
    "crop",
    "variety",
    "planting_day_of_year",
    "altitude_m",
    "crop_system",
    "landscape_strata",
    "treatment",
    "soil_type",
    "yield_kg_ha",
    TARGET_COLUMN,
)


def _clean_text(value: Any) -> str | None:
    if value is None or pd.isna(value):
        return None
    cleaned = str(value).strip()
    return cleaned or None


def _excel_date(value: Any) -> pd.Timestamp | None:
    if value is None or pd.isna(value):
        return None
    if isinstance(value, (pd.Timestamp, datetime, date)):
        return pd.Timestamp(value)
    if isinstance(value, (int, float, np.integer, np.floating)):
        numeric = float(value)
        if math.isfinite(numeric) and 1 <= numeric <= 100000:
            return pd.Timestamp("1899-12-30") + pd.to_timedelta(numeric, unit="D")
    parsed = pd.to_datetime(value, errors="coerce", dayfirst=True)
    return None if pd.isna(parsed) else pd.Timestamp(parsed)


def _find_column(frame: pd.DataFrame, names: tuple[str, ...]) -> str | None:
    normalized = {str(column).strip().casefold(): column for column in frame.columns}
    for name in names:
        if name.casefold() in normalized:
            return normalized[name.casefold()]
    return None


def load_icrisat_ethiopia_archive(
    archive_path: str | Path = DEFAULT_ARCHIVE,
) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Normalize observed yield records from the four uploaded Ethiopia workbooks."""
    path = Path(archive_path)
    if not path.is_file():
        raise FileNotFoundError(f"ICRISAT archive not found: {path}")
    archive_hash = hashlib.sha256(path.read_bytes()).hexdigest()
    frames: list[pd.DataFrame] = []
    workbook_stats: list[dict[str, Any]] = []

    with zipfile.ZipFile(path) as archive:
        members = set(archive.namelist())
        missing_members = sorted(WORKBOOK_MEMBERS - members)
        if missing_members:
            raise ValueError(
                "Archive does not contain the expected ICRISAT Ethiopia workbooks: "
                + ", ".join(missing_members)
            )
        for member in sorted(WORKBOOK_MEMBERS):
            safe_member = PurePosixPath(member)
            if safe_member.is_absolute() or ".." in safe_member.parts:
                raise ValueError(f"Unsafe archive member path: {member}")
            raw = archive.read(member)
            frame = pd.read_excel(io.BytesIO(raw), sheet_name=0, engine="openpyxl")
            frame.columns = [str(column).strip() for column in frame.columns]
            yield_column = _find_column(frame, ("Yield (kg/ha)",))
            crop_column = _find_column(frame, ("Crop",))
            year_column = _find_column(frame, ("Year",))
            if not all((yield_column, crop_column, year_column)):
                raise ValueError(f"{member} is missing a required crop/yield/year column.")

            valid_yield = pd.to_numeric(frame[yield_column], errors="coerce")
            valid = valid_yield.notna() & np.isfinite(valid_yield) & (valid_yield > 0)
            valid &= frame[crop_column].map(_clean_text).notna()
            country_column = _find_column(frame, ("Country",))
            region_column = _find_column(frame, ("Region/state",))
            district_column = _find_column(frame, ("LGA/District",))
            village_column = _find_column(frame, ("village/Kebele", "village"))
            location = pd.Series(False, index=frame.index)
            for location_column in (region_column, district_column, village_column):
                if location_column:
                    location |= frame[location_column].map(_clean_text).notna()
            valid &= location

            raw_yield_rows = int(valid_yield.notna().sum())
            selected = frame.loc[valid].copy()
            if selected.empty:
                raise ValueError(f"{member} has no valid yield records with site metadata.")

            def mapped(column_names: tuple[str, ...], default: Any = None) -> pd.Series:
                column = _find_column(selected, column_names)
                if column is None:
                    return pd.Series(default, index=selected.index)
                return selected[column]

            planting_column = _find_column(selected, ("Planting date",))
            planting_dates = (
                selected[planting_column].map(_excel_date)
                if planting_column
                else pd.Series(None, index=selected.index)
            )
            numeric_year = pd.to_numeric(selected[year_column], errors="coerce")
            yield_kg = pd.to_numeric(selected[yield_column], errors="coerce")
            workbook_name = PurePosixPath(member).name
            row_ids = mapped(("No.",), default="")
            records = pd.DataFrame(
                {
                    "source_record_id": row_ids.map(_clean_text),
                    "source_workbook": workbook_name,
                    "source_dataset": "ICRISAT Ethiopia crop-fertilizer field trials",
                    "evidence_class": "observed_trial_record",
                    "data_status": "observed",
                    "country": mapped(("Country",)).map(_clean_text),
                    "region": mapped(("Region/state",)).map(_clean_text),
                    "district": mapped(("LGA/District",)).map(_clean_text),
                    "village": mapped(("village/Kebele", "village")).map(_clean_text),
                    "year": numeric_year,
                    "crop": selected[crop_column].map(_clean_text),
                    "variety": mapped(("Variety",)).map(_clean_text),
                    "planting_day_of_year": planting_dates.map(
                        lambda value: float(value.dayofyear) if value is not None else np.nan
                    ),
                    "altitude_m": pd.to_numeric(
                        mapped(("Altitude(m)",)), errors="coerce"
                    ),
                    "crop_system": mapped(("Crop system",)).map(_clean_text),
                    "landscape_strata": mapped(("Landscape strata",)).map(_clean_text),
                    "treatment": mapped(("Treatment",)).map(_clean_text),
                    "soil_type": mapped(("Soil type",)).map(_clean_text),
                    "yield_kg_ha": yield_kg.loc[selected.index],
                    TARGET_COLUMN: yield_kg.loc[selected.index] / 1000.0,
                },
                index=selected.index,
            )
            records["group_site"] = (
                records[["country", "region", "district", "village"]]
                .fillna("")
                .agg("|".join, axis=1)
                .str.strip("|")
            )
            records = records.loc[
                pd.to_numeric(records["year"], errors="coerce").notna()
            ]
            if records["source_record_id"].isna().any():
                records.loc[records["source_record_id"].isna(), "source_record_id"] = [
                    f"{workbook_name}:row:{index + 2}"
                    for index in records.index[records["source_record_id"].isna()]
                ]
            frames.append(records)
            workbook_stats.append(
                {
                    "archive_member": member,
                    "source_workbook_sha256": hashlib.sha256(raw).hexdigest(),
                    "rows_in_workbook": int(len(frame)),
                    "rows_with_numeric_yield": raw_yield_rows,
                    "rows_retained": int(len(records)),
                    "rows_excluded_missing_target_crop_or_site": int(len(frame) - len(records)),
                    "crop_counts": {
                        str(key): int(value)
                        for key, value in records["crop"].value_counts().items()
                    },
                }
            )

    dataset = pd.concat(frames, ignore_index=True)
    dataset = dataset.replace([np.inf, -np.inf], np.nan)
    dataset = dataset.loc[
        dataset[TARGET_COLUMN].notna()
        & np.isfinite(dataset[TARGET_COLUMN])
        & (dataset[TARGET_COLUMN] > 0)
    ].reset_index(drop=True)
    if dataset.empty or dataset["group_site"].nunique() < 2:
        raise ValueError("Training requires valid yield records from at least two sites.")

    metadata = {
        "dataset_title": "ICRISAT Ethiopia crop-fertilizer field trial records",
        "dataset_doi": DATASET_DOI,
        "dataset_url": DATASET_URL,
        "source_archive": path.name,
        "source_archive_sha256": archive_hash,
        "evidence_class": "observed_trial_record",
        "data_status": "observed",
        "country": "Ethiopia",
        "target": TARGET_COLUMN,
        "target_units": "tonnes per hectare (converted from source kg/ha)",
        "retained_rows": int(len(dataset)),
        "site_groups": int(dataset["group_site"].nunique()),
        "crops": sorted(dataset["crop"].dropna().unique().tolist()),
        "years": sorted(int(value) for value in dataset["year"].dropna().unique()),
        "features": list(FEATURE_COLUMNS),
        "excluded_features": [
            "harvest date and post-harvest measurements (outcome leakage)",
            "fertilizer numeric columns with inconsistent or undocumented units across files",
            "rainfall field, which is blank in these workbooks",
        ],
        "limitations": [
            "These are Ethiopian trial records, not Bangladesh farm data.",
            "Dataset rows may share trial/site/treatment structure and are not independent farms.",
            "Reported yield moisture basis and field measurement protocols vary or are not fully specified in the workbooks.",
            "Location grouping is based on recorded administrative site names, not field GPS coordinates.",
            "Metrics estimate transfer to held-out recorded sites within this dataset only; they do not validate Bangladesh predictions.",
            "The archive does not include action-conditioned sequential transitions or repeated reward trajectories for RL.",
            "Confirm the original dataset's current terms and attribution requirements before redistribution or commercial use.",
        ],
        "workbooks": workbook_stats,
    }
    return dataset, metadata


def _build_preprocessor() -> ColumnTransformer:
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
    return ColumnTransformer(
        transformers=[
            ("numeric", numeric, list(NUMERIC_FEATURES)),
            ("categorical", categorical, list(CATEGORICAL_FEATURES)),
        ],
        remainder="drop",
    )


def _model_candidates(seed: int) -> dict[str, Any]:
    return {
        "mean_baseline": DummyRegressor(strategy="mean"),
        "ridge_regression": Ridge(alpha=10.0),
        "random_forest": RandomForestRegressor(
            n_estimators=250,
            min_samples_leaf=3,
            random_state=seed,
            n_jobs=-1,
        ),
        "hist_gradient_boosting": HistGradientBoostingRegressor(
            max_iter=200,
            l2_regularization=1.0,
            random_state=seed,
        ),
    }


def compare_real_yield_models(
    dataset: pd.DataFrame,
    *,
    seed: int = 42,
    max_splits: int = 5,
) -> dict[str, Any]:
    """Compare regressors on out-of-fold predictions grouped by trial site."""
    required = {*FEATURE_COLUMNS, TARGET_COLUMN, "group_site"}
    missing = sorted(required - set(dataset.columns))
    if missing:
        raise ValueError("Training table is missing columns: " + ", ".join(missing))
    frame = dataset.copy().reset_index(drop=True)
    y = pd.to_numeric(frame[TARGET_COLUMN], errors="coerce").to_numpy(dtype=float)
    if not np.isfinite(y).all() or (y <= 0).any():
        raise ValueError("Yield targets must be finite positive t/ha values.")
    groups = frame["group_site"].fillna("").astype(str).to_numpy()
    group_count = len(set(groups))
    if group_count < 2:
        raise ValueError("Grouped evaluation requires at least two distinct sites.")
    splitter = GroupKFold(n_splits=min(max_splits, group_count))
    folds = list(splitter.split(frame, y, groups))
    candidate_results: dict[str, Any] = {}
    for name, estimator in _model_candidates(seed).items():
        predictions = np.full(len(frame), np.nan, dtype=float)
        fold_details = []
        for train_indices, test_indices in folds:
            pipeline = Pipeline(
                steps=[
                    ("preprocess", _build_preprocessor()),
                    ("model", estimator),
                ]
            )
            pipeline.fit(frame.iloc[train_indices], y[train_indices])
            fold_predictions = pipeline.predict(frame.iloc[test_indices])
            predictions[test_indices] = fold_predictions
            fold_details.append(
                {
                    "held_out_sites": sorted(
                        set(groups[test_indices].tolist())
                    ),
                    "train_rows": int(len(train_indices)),
                    "test_rows": int(len(test_indices)),
                    "mae_t_ha": float(
                        mean_absolute_error(y[test_indices], fold_predictions)
                    ),
                    "rmse_t_ha": float(
                        math.sqrt(mean_squared_error(y[test_indices], fold_predictions))
                    ),
                }
            )
        if not np.isfinite(predictions).all():
            raise RuntimeError(f"{name} did not produce predictions for every row.")
        candidate_results[name] = {
            "mae_t_ha": float(mean_absolute_error(y, predictions)),
            "rmse_t_ha": float(math.sqrt(mean_squared_error(y, predictions))),
            "r2": float(r2_score(y, predictions)),
            "folds": fold_details,
        }
    selected = min(
        candidate_results,
        key=lambda name: (candidate_results[name]["rmse_t_ha"], candidate_results[name]["mae_t_ha"]),
    )
    return {
        "evaluation_protocol": "GroupKFold by recorded country/region/district/village; out-of-fold predictions.",
        "split_group": "group_site",
        "split_count": len(folds),
        "site_group_count": group_count,
        "row_count": int(len(frame)),
        "target_units": "t/ha",
        "metrics_are_bangladesh_validation": False,
        "candidate_models": candidate_results,
        "selected_model": selected,
    }


def _report_path(path: Path) -> str:
    try:
        return str(path.relative_to(PROJECT_ROOT))
    except ValueError:
        return str(path)


def train_real_yield_pilot(
    *,
    archive_path: str | Path = DEFAULT_ARCHIVE,
    output_dir: str | Path = DEFAULT_OUTPUT,
    model_dir: str | Path = DEFAULT_MODEL_DIR,
    seed: int = 42,
) -> dict[str, Any]:
    """Normalize the uploaded observed trial records and save a separate pilot model."""
    dataset, provenance = load_icrisat_ethiopia_archive(archive_path)
    evaluation = compare_real_yield_models(dataset, seed=seed)
    selected_name = evaluation["selected_model"]
    estimator = _model_candidates(seed)[selected_name]
    model = Pipeline(
        steps=[
            ("preprocess", _build_preprocessor()),
            ("model", estimator),
        ]
    )
    model.fit(dataset, dataset[TARGET_COLUMN].to_numpy(dtype=float))

    normalized_dir = Path(output_dir)
    artifact_dir = Path(model_dir)
    normalized_dir.mkdir(parents=True, exist_ok=True)
    artifact_dir.mkdir(parents=True, exist_ok=True)
    normalized_path = normalized_dir / "observed_yield_records.csv"
    manifest_path = normalized_dir / "dataset_manifest.json"
    model_path = artifact_dir / "icrisat_ethiopia_yield_pipeline.joblib"
    report_path = artifact_dir / "training_report.json"
    dataset.loc[:, OUTPUT_COLUMNS].to_csv(normalized_path, index=False)
    persisted_model = {
        "pipeline": model,
        "model_name": selected_name,
        "dataset_doi": DATASET_DOI,
        "evidence_class": "observed_trial_record",
        "data_status": "observed",
        "target": TARGET_COLUMN,
        "target_units": "t/ha",
        "feature_columns": list(FEATURE_COLUMNS),
        "country": "Ethiopia",
        "not_for_bangladesh_field_prediction": True,
    }
    joblib.dump(persisted_model, model_path)
    report = {
        **provenance,
        "normalized_csv": _report_path(normalized_path),
        "model_artifact": _report_path(model_path),
        "model_name": selected_name,
        "evaluation": evaluation,
        "model_training_scope": "Exploratory comparison only; not integrated into app predictions.",
        "rl_training_status": "not_trained",
        "rl_training_reason": (
            "The dataset contains crop-treatment/yield observations, not ordered "
            "action-conditioned state transitions and repeated outcomes required "
            "to train or validate a sequential RL policy."
        ),
    }
    manifest_path.write_text(
        json.dumps(provenance, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    report_path.write_text(
        json.dumps(report, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    return report


if __name__ == "__main__":
    print(json.dumps(train_real_yield_pilot(), indent=2, ensure_ascii=False))
