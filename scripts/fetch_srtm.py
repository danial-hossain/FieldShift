"""Fetch NASA SRTMGL1 (1 arc-second 30m) DEM tiles via earthaccess

and extract genuine elevation and topographic slope for Bangladesh test fields.
Includes windowed smoothing and coastal delta erosion calibration (H7).
"""

from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import zipfile
from dotenv import load_dotenv
import numpy as np

load_dotenv()

RAW_DIR = Path("data/srtm/raw")
PROCESSED_FILE = Path("data/srtm/field_elevations.json")
SHORT_NAME = "SRTMGL1"

FIELDS = {
    "dinajpur": {
        "field_name": "Dinajpur Sadar",
        "latitude": 25.6279,
        "longitude": 88.6332,
        "tile": "N25E088",
        "lat_origin": 25,
        "lon_origin": 88,
        "flood_exposure_hint": "Low-lying alluvial floodplain",
        "is_coastal_flat_delta": False,
    },
    "bogura": {
        "field_name": "Bogura demo",
        "latitude": 24.85,
        "longitude": 89.37,
        "tile": "N24E089",
        "lat_origin": 24,
        "lon_origin": 89,
        "flood_exposure_hint": "Low-lying alluvial floodplain",
        "is_coastal_flat_delta": False,
    },
    "satkhira": {
        "field_name": "Satkhira coast",
        "latitude": 22.7185,
        "longitude": 89.0705,
        "tile": "N22E089",
        "lat_origin": 22,
        "lon_origin": 89,
        "flood_exposure_hint": "High coastal flood/surge exposure",
        "is_coastal_flat_delta": True,  # Coastal saline delta plain (poldered landscape)
    },
    "sunamganj": {
        "field_name": "Sunamganj haor",
        "latitude": 25.0658,
        "longitude": 91.3950,
        "tile": "N25E091",
        "lat_origin": 25,
        "lon_origin": 91,
        "flood_exposure_hint": "High monsoon basin submergence risk (haor)",
        "is_coastal_flat_delta": False,
    },
}


def download_tiles():
    """Download required SRTMGL1 tiles via earthaccess if missing."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    manifest = []
    import earthaccess
    earthaccess.login(strategy="environment")

    for key, info in FIELDS.items():
        tile_name = info["tile"]
        zip_path = RAW_DIR / f"{tile_name}.SRTMGL1.hgt.zip"
        if not zip_path.is_file():
            print(f"[SRTM] Searching tile {tile_name}...")
            res = earthaccess.search_data(short_name=SHORT_NAME, granule_name=f"{tile_name}*")
            if not res:
                raise RuntimeError(f"Could not find SRTM tile for {tile_name}")
            print(f"[SRTM] Downloading {tile_name}...")
            earthaccess.download(res, str(RAW_DIR))

        # Check hash
        sha256 = hashlib.sha256()
        with open(zip_path, "rb") as f:
            while chunk := f.read(1024 * 1024):
                sha256.update(chunk)
        manifest.append({
            "field_id": key,
            "tile": tile_name,
            "filename": zip_path.name,
            "size_bytes": zip_path.stat().st_size,
            "sha256": sha256.hexdigest(),
            "source": "NASA LP DAAC / USGS via Earthdata Cloud",
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
        })

    with open(RAW_DIR / "manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"[SRTM] Manifest written with {len(manifest)} tiles.")


def extract_field_elevations():
    """Extract exact elevation and 5x5 window-smoothed slope from raw .hgt files.

    Applies water/channel masking and calibrates coastal delta plain erosion risk (H7).
    """
    results = {}
    for key, info in FIELDS.items():
        tile_name = info["tile"]
        zip_path = RAW_DIR / f"{tile_name}.SRTMGL1.hgt.zip"
        lat = info["latitude"]
        lon = info["longitude"]
        lat_origin = info["lat_origin"]
        lon_origin = info["lon_origin"]
        is_coastal = info.get("is_coastal_flat_delta", False)

        with zipfile.ZipFile(zip_path, "r") as zf:
            hgt_bytes = zf.read(f"{tile_name}.hgt")
            # SRTMGL1 has 3601 x 3601 16-bit signed big-endian integers
            arr = np.frombuffer(hgt_bytes, dtype=">i2").reshape((3601, 3601))

        # Pixel coordinates
        row = int(round((lat_origin + 1.0 - lat) * 3600.0))
        col = int(round((lon - lon_origin) * 3600.0))

        # Clamp row and col within boundaries
        row = max(2, min(3598, row))
        col = max(2, min(3598, col))

        elev = int(arr[row, col])

        # Cell resolution in meters at this latitude
        lat_rad = math.radians(lat)
        dy_m = 111132.0 / 3600.0
        dx_m = (111412.84 * math.cos(lat_rad)) / 3600.0

        # Compute windowed slope over 5x5 window (150 m footprint)
        sub_slopes = []
        for r_off in range(-1, 2):
            for c_off in range(-1, 2):
                w = arr[row + r_off - 1 : row + r_off + 2, col + c_off - 1 : col + c_off + 2].astype(float)
                # Mask water (< 1 m) and void cells (< -100)
                mask = (w < 1) | (w < -100)
                if np.all(mask):
                    continue
                w[mask] = elev

                # Sobel/Horn gradient
                dz_dx = ((w[0, 2] + 2 * w[1, 2] + w[2, 2]) -
                         (w[0, 0] + 2 * w[0, 0] + w[2, 0])) / (8 * dx_m)
                dz_dy = ((w[2, 0] + 2 * w[2, 1] + w[2, 2]) -
                         (w[0, 0] + 2 * w[0, 1] + w[0, 2])) / (8 * dy_m)

                s = math.sqrt(dz_dx**2 + dz_dy**2) * 100.0
                sub_slopes.append(s)

        mean_slope_5x5 = round(float(np.mean(sub_slopes)), 2) if sub_slopes else 0.0

        if is_coastal:
            # H7: Flat coastal delta land (Satkhira) is a planar delta plain (<1.5% true slope).
            # SRTM 30m pixel quantization (1m integer steps) and polder dikes/canals produce artificial 4-6% gradients.
            # As required: 30 m SRTM slope is unreliable for flat coastal deltas and is not used for erosion risk.
            erosion_risk = "Low (coastal delta plain; 30 m SRTM slope is unreliable due to polder artifact noise and is not used for erosion risk)"
            delta_note = "Coastal saline delta plain; 30m SRTM integer quantization creates embankment/canal artifacts. Regional delta plain slope is <1.5%; slope is not used for erosion modeling."
        else:
            erosion_risk = "Low" if mean_slope_5x5 < 2.0 else ("Moderate" if mean_slope_5x5 < 5.0 else "High")
            delta_note = None

        record = {
            "field_name": info["field_name"],
            "latitude": lat,
            "longitude": lon,
            "srtm_tile": tile_name,
            "elevation_m": elev,
            "slope_percent": mean_slope_5x5,
            "slope_method": "5x5 window mean (150 m footprint)",
            "flood_exposure_hint": info["flood_exposure_hint"],
            "topographic_erosion_risk": erosion_risk,
            "dataset": "NASA SRTMGL1 (30 m resolution)",
            "derived_at": datetime.now(timezone.utc).isoformat(),
        }
        if delta_note:
            record["delta_calibration_note"] = delta_note

        results[key] = record
        print(f"[SRTM] {info['field_name']} -> Elevation: {elev} m, 5x5 Slope: {mean_slope_5x5}%, Risk: {erosion_risk}")

    PROCESSED_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PROCESSED_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"[SRTM] Written {PROCESSED_FILE}")


def main():
    if not (RAW_DIR / "manifest.json").is_file():
        download_tiles()
    extract_field_elevations()


if __name__ == "__main__":
    main()
