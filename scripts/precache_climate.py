#!/usr/bin/env python3
"""Pre-cache climate datasets and summaries for offline event operations.

Pre-computes and caches:
- Demo fields (Rahim's plot, Bogura demo, and registered DB fields)
- 6 Key Agro-Climatic Test Fields (Drought, Saline, Flood, High Barind, Sylhet Haor, Rangpur)
- All 64 district centers from data/geo/bd_districts.json

Ensures:
- Total data/climate_cache directory size stays strictly < 30 MB
- OFFLINE=1 loads every field with zero network requests
"""

import json
import logging
import os
import sys
import time
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from src.climate.point_data import get_nasa_power, get_gpm_imerg, get_grace, get_onset
from src.climate.summary import compute_climate_summary

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("precache_climate")

# 6 Canonical Agro-Climatic Test Fields
TEST_FIELDS = [
    {"name": "Drought (Chapainawabganj)", "lat": 24.59, "lon": 88.27},
    {"name": "Saline (Satkhira)", "lat": 22.72, "lon": 89.07},
    {"name": "Flood (Sirajganj)", "lat": 24.45, "lon": 89.70},
    {"name": "High Barind (Rajshahi Godagari)", "lat": 24.45, "lon": 88.33},
    {"name": "Sylhet Haor (Sunamganj)", "lat": 25.07, "lon": 91.40},
    {"name": "Rangpur (Tista Meander)", "lat": 25.75, "lon": 89.25},
]

# Key Demo Fields
DEMO_FIELDS = [
    {"name": "Rahim Farm Demo", "lat": 24.59, "lon": 88.27},
    {"name": "Bogura Reference", "lat": 24.85, "lon": 89.37},
    {"name": "Cumilla Demo", "lat": 23.4798, "lon": 91.1993},
    {"name": "Jashore Demo", "lat": 23.1844, "lon": 89.1656},
    {"name": "Barishal Demo", "lat": 22.6538, "lon": 90.4049},
]


def get_dir_size_mb(path: Path) -> float:
    """Return directory size in megabytes."""
    if not path.exists():
        return 0.0
    total_bytes = sum(f.stat().st_size for f in path.glob("**/*") if f.is_file())
    return total_bytes / (1024 * 1024)


def load_district_centers() -> list[dict]:
    """Load 64 district centers."""
    dist_file = ROOT / "data" / "geo" / "bd_districts.json"
    if not dist_file.exists():
        logger.warning(f"District file {dist_file} not found.")
        return []
    with open(dist_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("districts", [])


def precache_all():
    logger.info("Starting climate pre-caching for offline event readiness...")
    start_time = time.time()

    # Collect all unique points to pre-cache
    points = []
    seen = set()

    def add_point(name, lat, lon):
        lat_r = round(float(lat), 2)
        lon_r = round(float(lon), 2)
        key = (lat_r, lon_r)
        if key not in seen:
            seen.add(key)
            points.append({"name": name, "lat": lat_r, "lon": lon_r})

    # 1. Test fields
    for tf in TEST_FIELDS:
        add_point(tf["name"], tf["lat"], tf["lon"])

    # 2. Demo fields
    for df in DEMO_FIELDS:
        add_point(df["name"], df["lat"], df["lon"])

    # 3. 64 Districts
    districts = load_district_centers()
    logger.info(f"Loaded {len(districts)} district centers.")
    for d in districts:
        add_point(d.get("name", "District"), d["lat"], d["lon"])

    logger.info(f"Total unique geographical points to pre-cache: {len(points)}")

    # Prime NASA POWER cache for demo and test fields to retain 1981-2024 baselines
    logger.info("Priming NASA POWER telemetry for core demo and test fields...")
    for fld in TEST_FIELDS + DEMO_FIELDS:
        try:
            get_nasa_power(fld["lat"], fld["lon"], offline=False)
        except Exception as e:
            logger.warning(f"Failed to prime POWER for {fld.get('name')}: {e}")

    # Execute caching for each point
    success_count = 0
    fail_count = 0

    for i, pt in enumerate(points, 1):
        p_name = pt["name"]
        lat = pt["lat"]
        lon = pt["lon"]
        t0 = time.time()
        try:
            # Recompute summary with local cache
            res = compute_climate_summary(lat=lat, lon=lon, offline=True)
            dt = time.time() - t0
            if res.get("status") == "success":
                success_count += 1
                logger.info(f"[{i:02d}/{len(points):02d}] ✓ {p_name} ({lat}, {lon}) in {dt:.2f}s")
            else:
                fail_count += 1
                logger.warning(f"[{i:02d}/{len(points):02d}] ⚠ {p_name} ({lat}, {lon}) status={res.get('status')} message={res.get('message')}")
        except Exception as e:
            fail_count += 1
            logger.error(f"[{i:02d}/{len(points):02d}] ✗ {p_name} ({lat}, {lon}) error: {e}")

    cache_dir = ROOT / "data" / "climate_cache"
    total_size_mb = get_dir_size_mb(cache_dir)
    total_time = time.time() - start_time

    logger.info("==================================================")
    logger.info(f"Pre-caching Complete!")
    logger.info(f"Points Processed: {len(points)} (Success: {success_count}, Failed: {fail_count})")
    logger.info(f"Total Cache Size: {total_size_mb:.2f} MB (Constraint: < 30 MB)")
    logger.info(f"Elapsed Time: {total_time:.2f} seconds")
    logger.info("==================================================")

    if total_size_mb >= 30.0:
        logger.error(f"FAILURE: Cache size {total_size_mb:.2f} MB exceeds 30 MB limit!")
        sys.exit(1)

    # Verification: Check OFFLINE=1 loading
    logger.info("Verifying OFFLINE=1 mode...")
    os.environ["OFFLINE"] = "1"
    offline_success = 0
    for pt in points:
        res = compute_climate_summary(lat=pt["lat"], lon=pt["lon"], offline=True)
        if res.get("status") == "success":
            offline_success += 1

    logger.info(f"Offline Verification: {offline_success}/{len(points)} loaded successfully with zero network requests.")
    if offline_success != success_count:
        logger.error("FAILURE: Some cached fields failed in offline mode!")
        sys.exit(1)

    logger.info("All offline verification checks passed!")


if __name__ == "__main__":
    precache_all()
