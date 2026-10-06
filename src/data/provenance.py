"""Repository-level provenance manifest generation for local data files."""

import csv
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Union

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_ROOT = PROJECT_ROOT / "data"
DEFAULT_MANIFEST_PATH = DATA_ROOT / "provenance_manifest.json"

NasaPowerFileNamePattern = "nasa_power"


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _read_csv_rows(path: Path) -> List[Dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            return []
        return [
            {key: (value.strip() if isinstance(value, str) else "") for key, value in row.items()}
            for row in reader
        ]


def _parse_date_coverage(rows: Iterable[Dict[str, str]], date_column: str = "date") -> Optional[Dict[str, str]]:
    dates: List[str] = []
    for row in rows:
        value = row.get(date_column, "").strip()
        if value:
            try:
                dates.append(datetime.fromisoformat(value.replace("Z", "+00:00")).date().isoformat())
            except ValueError:
                try:
                    dates.append(datetime.strptime(value, "%Y-%m-%d").date().isoformat())
                except ValueError:
                    continue
    if not dates:
        return None
    return {
        "start": min(dates),
        "end": max(dates),
        "count": len(dates),
    }


def _infer_role(file_name: str) -> str:
    lower = file_name.lower()
    if lower.startswith("nasa_power"):
        return "nasa_power"
    if "smap" in lower:
        return "smap"
    if "soil" in lower:
        return "soil"
    if "crop" in lower:
        return "crop"
    if "field_history" in lower:
        return "field_history"
    if file_name == "source_registry.csv":
        return "source_registry"
    if file_name == "acquisition_log.csv":
        return "acquisition_log"
    return "unknown"


def _infer_status_from_rows(rows: List[Dict[str, str]]) -> Dict[str, Any]:
    status_values = {row.get("data_status", "").strip().lower() for row in rows if row.get("data_status")}
    source_values = {row.get("source", "").strip().lower() for row in rows if row.get("source")}
    if status_values and status_values <= {"synthetic", "demo"}:
        return {
            "status": "synthetic_demo_only",
            "source_values": sorted(source_values),
            "data_status_values": sorted(status_values),
        }
    if status_values and status_values <= {"observed"}:
        return {
            "status": "observed_only",
            "source_values": sorted(source_values),
            "data_status_values": sorted(status_values),
        }
    return {
        "status": "mixed_or_unknown",
        "source_values": sorted(source_values),
        "data_status_values": sorted(status_values),
    }


def build_source_manifest(path: Union[str, Path], *, include_hash: bool = True) -> Dict[str, Any]:
    """Build a provenance record for a data file from the repo itself.

    This is intentionally conservative: values are derived only from the file and
    project code, and unknown metadata remains explicit nulls instead of guesses.
    """
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f"Data file not found: {file_path}")

    relative_path = file_path.relative_to(PROJECT_ROOT) if file_path.is_absolute() else file_path
    role = _infer_role(file_path.name)
    record: Dict[str, Any] = {
        "file_name": file_path.name,
        "file_path": str(relative_path).replace('\\', '/'),
        "role": role,
        "file_hash_sha256": _sha256(file_path) if include_hash else None,
        "evidence_class": None,
        "provenance_status": "unknown",
        "actual_coverage": None,
        "columns": [],
        "record_count": 0,
        "unknowns": [],
    }

    if file_path.suffix.lower() != ".csv":
        return record

    rows = _read_csv_rows(file_path)
    if not rows and file_path.name.endswith(".csv"):
        return record
    headers = list(rows[0].keys()) if rows else []
    record["columns"] = headers
    record["record_count"] = len(rows)

    if role == "nasa_power":
        coverage = _parse_date_coverage(rows)
        record["actual_coverage"] = coverage
        file_name_lat_lon = None
        if "lat" in file_path.name.lower() and "lon" in file_path.name.lower():
            import re
            match = re.search(r"lat(?P<lat>-?\d+(?:\.\d+)?)_lon(?P<lon>-?\d+(?:\.\d+)?)", file_path.name, flags=re.IGNORECASE)
            if match:
                file_name_lat_lon = {
                    "latitude": float(match.group("lat")),
                    "longitude": float(match.group("lon")),
                    "source": "filename_reconstruction",
                    "status": "reconstructed_only_not_original_request_metadata",
                }
        record["reconstructed_coordinates"] = file_name_lat_lon
        record["evidence_class"] = "remote_observed"
        record["provenance_status"] = "partial_repository_evidence_only"
        if file_name_lat_lon is not None:
            record["provenance_status"] = "filename_reconstruction_only"
        record["unknowns"].extend([
            "Original request URL not stored in local CSV.",
            "Retrieval timestamp not stored in local CSV.",
            "Historical request metadata unavailable in the repository evidence.",
        ])
        return record

    if "data_status" in headers or "source" in headers:
        status_info = _infer_status_from_rows(rows)
        record["data_status_summary"] = status_info
        record["evidence_class"] = "synthetic" if status_info["status"] == "synthetic_demo_only" else None
        if status_info["status"] == "synthetic_demo_only":
            record["provenance_status"] = "synthetic_demo_only"
        else:
            record["provenance_status"] = status_info["status"]
        if "source" in headers and "data_status" in headers:
            unique_sources = sorted({row.get("source", "").strip() for row in rows if row.get("source")})
            unique_statuses = sorted({row.get("data_status", "").strip() for row in rows if row.get("data_status")})
            record["source_values"] = unique_sources
            record["data_status_values"] = unique_statuses
        if status_info["status"] == "synthetic_demo_only":
            record["unknowns"] = [
                "Synthetic/demo values are not field observations or validated farm outcomes.",
                "No independent calibration or legal reuse metadata is implied by the file itself.",
            ]
        else:
            record["unknowns"] = [
                "Source provenance beyond local file labels remains unverified in this repo.",
            ]
        if role in {"soil", "smap", "field_history", "crop"}:
            coverage = _parse_date_coverage(rows, "date")
            if coverage is None:
                coverage = _parse_date_coverage(rows, "as_of_date")
            if coverage is None:
                coverage = _parse_date_coverage(rows, "year") if "year" in headers else None
            record["actual_coverage"] = coverage
        return record

    if role == "source_registry":
        record["evidence_class"] = "metadata_manifest"
        record["provenance_status"] = "registry_reference_only"
        record["unknowns"] = [
            "Source registry entries are not proof of data access or legal reuse rights.",
        ]
        return record

    if role == "acquisition_log":
        record["evidence_class"] = "request_log"
        record["provenance_status"] = "request_tracking_only"
        record["unknowns"] = [
            "Acquisition log is not proof of a successful data retrieval without explicit verification flags.",
        ]
        return record

    record["unknowns"] = ["File type does not yet have a validated provenance schema in this repository."]
    return record


def build_provenance_manifest(base_directory: Union[str, Path] = DATA_ROOT) -> Dict[str, Any]:
    """Return a repository provenance manifest for the data directory."""
    directory = Path(base_directory)
    files = sorted(path for path in directory.rglob("*.csv") if path.is_file())
    manifest = {
        "phase": "FieldShift Phase 32",
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "data_root": str(directory.resolve().relative_to(PROJECT_ROOT)).replace('\\', '/'),
        "files": [build_source_manifest(path) for path in files],
    }
    return manifest


def write_provenance_manifest(base_directory: Union[str, Path] = DATA_ROOT, *, output_path: Optional[Union[str, Path]] = None) -> Path:
    """Write the manifest to disk and return the file path."""
    directory = Path(base_directory)
    directory.mkdir(parents=True, exist_ok=True)
    manifest_path = Path(output_path) if output_path is not None else DEFAULT_MANIFEST_PATH
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(build_provenance_manifest(directory), indent=2), encoding="utf-8")
    return manifest_path


def validate_provenance_manifest(manifest: Union[str, Path, Dict[str, Any]]) -> List[str]:
    """Validate a provenance manifest structure and basic consistency."""
    if isinstance(manifest, (str, Path)):
        manifest_path = Path(manifest)
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    errors: List[str] = []
    files = manifest.get("files") if isinstance(manifest, dict) else None
    if not isinstance(files, list):
        return ["Manifest must contain a 'files' list."]

    for item in files:
        file_path = Path(PROJECT_ROOT / item.get("file_path", ""))
        if not file_path.exists():
            errors.append(f"Manifest file path does not exist: {item.get('file_path')}")
            continue
        if item.get("file_hash_sha256"):
            actual_hash = _sha256(file_path)
            if actual_hash != item["file_hash_sha256"]:
                errors.append(f"Hash mismatch for {file_path.name}: manifest/hash drift detected.")

        actual_coverage = item.get("actual_coverage")
        if actual_coverage and isinstance(actual_coverage, dict):
            start = actual_coverage.get("start") or actual_coverage.get("start_date")
            end = actual_coverage.get("end") or actual_coverage.get("end_date")
            if start and end:
                rows = _read_csv_rows(file_path)
                if rows:
                    from datetime import date as _date
                    dates = []
                    for row in rows:
                        value = row.get("date", "").strip()
                        if value:
                            try:
                                dates.append(datetime.fromisoformat(value.replace("Z", "+00:00")).date().isoformat())
                            except ValueError:
                                continue
                    if dates:
                        csv_start = min(dates)
                        csv_end = max(dates)
                        if start != csv_start:
                            errors.append(f"Coverage mismatch for {file_path.name}: start {start!r} != {csv_start!r}.")
                        if end != csv_end:
                            errors.append(f"Coverage mismatch for {file_path.name}: end {end!r} != {csv_end!r}.")

        coordinates = item.get("reconstructed_coordinates")
        if coordinates is not None:
            latitude = coordinates.get("latitude")
            longitude = coordinates.get("longitude")
            if latitude is not None and not (-90 <= float(latitude) <= 90):
                errors.append(f"Invalid latitude in manifest for {file_path.name}: {latitude!r}.")
            if longitude is not None and not (-180 <= float(longitude) <= 180):
                errors.append(f"Invalid longitude in manifest for {file_path.name}: {longitude!r}.")

    return errors
