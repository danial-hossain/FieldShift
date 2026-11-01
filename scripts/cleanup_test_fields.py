#!/usr/bin/env python3
"""scripts/cleanup_test_fields.py
Clean up [RND-] test fields from the database while preserving canonical parcels.

Keeps:
- 4 Canonical fields: Dinajpur Sadar, Bogura demo, Satkhira coast, Sunamganj haor
- Any registered farm parcel that does NOT contain '[RND-' in its name

Usage:
  python scripts/cleanup_test_fields.py --dry-run
  python scripts/cleanup_test_fields.py
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from sqlalchemy import delete, select
from backend.app.database import get_db
from backend.app.models import Analysis, Farm, FarmOutcome, Field, FieldHistory, User

CANONICAL_NAMES = [
    "Dinajpur Sadar",
    "Bogura demo",
    "Satkhira coast",
    "Sunamganj haor",
]


def cleanup_test_fields(dry_run: bool = False) -> None:
    db = next(get_db())
    print("====================================================================")
    print("FIELDSHIFT 2026: TEST FIELD REGISTRY CLEANUP")
    print(f"Mode: {'DRY RUN (no database changes)' if dry_run else 'EXECUTE (permanent deletion)'}")
    print("====================================================================\n")

    all_fields = db.scalars(select(Field).order_by(Field.id.asc())).all()
    print(f"Total fields scanned in database: {len(all_fields)}")

    to_delete: list[Field] = []
    to_keep: list[Field] = []

    for f in all_fields:
        is_rnd = "[RND-" in (f.name or "")
        is_canonical = any(c.lower() in (f.name or "").lower() for c in CANONICAL_NAMES)

        if is_rnd:
            to_delete.append(f)
        else:
            to_keep.append(f)

    print(f"\nIdentified {len(to_delete)} fields with '[RND-' matching deletion criteria.")
    print(f"Identified {len(to_keep)} legitimate fields to KEEP.\n")

    if to_delete:
        print("--- TARGET TEST FIELDS FOR DELETION ---")
        for f in to_delete:
            farm = db.get(Farm, f.farm_id) if f.farm_id else None
            user = db.get(User, farm.user_id) if farm else None
            user_str = f"{user.email} (User #{user.id})" if user else "Unknown User"
            print(f"  [{'DRY-RUN WOULD DELETE' if dry_run else 'DELETING'}] Field ID #{f.id}: '{f.name}' | coords: ({f.latitude}, {f.longitude}) | owner: {user_str}")

    print("\n--- KEPT PARCELS (CANONICAL & USER FIELDS) ---")
    for f in to_keep:
        farm = db.get(Farm, f.farm_id) if f.farm_id else None
        user = db.get(User, farm.user_id) if farm else None
        user_str = f"{user.email} (User #{user.id})" if user else "Unknown User"
        is_canon = any(c.lower() in (f.name or "").lower() for c in CANONICAL_NAMES)
        tag = "[CANONICAL]" if is_canon else "[USER FIELD]"
        print(f"  {tag} Field ID #{f.id}: '{f.name}' | area: {f.area_ha} ha | owner: {user_str}")

    if dry_run:
        print(f"\n[DRY RUN COMPLETE] {len(to_delete)} fields would be deleted. 0 records modified.")
        return

    # Perform actual ORM deletion
    print(f"\nExecuting deletion of {len(to_delete)} test fields via ORM cascade...")
    deleted_count = 0
    for f in to_delete:
        f_id = f.id
        db.execute(delete(FieldHistory).where(FieldHistory.field_id == f_id))
        db.execute(delete(FarmOutcome).where(FarmOutcome.field_id == f_id))
        analyses = db.scalars(select(Analysis).where(Analysis.field_id == f_id)).all()
        for a in analyses:
            a.field_id = None
        db.flush()
        db.delete(f)
        deleted_count += 1

    db.commit()
    print(f"Successfully deleted {deleted_count} fields and their cascaded records.")

    # Post-cleanup audit
    remaining_fields = db.scalars(select(Field).order_by(Field.id.asc())).all()
    remaining_rnd = [f for f in remaining_fields if "[RND-" in (f.name or "")]
    print(f"\n--- POST-CLEANUP AUDIT ---")
    print(f"Total fields remaining in database: {len(remaining_fields)}")
    print(f"Total [RND-] test fields remaining: {len(remaining_rnd)}")
    assert len(remaining_rnd) == 0, f"Error: {len(remaining_rnd)} [RND-] fields still remain!"

    # Check evaluator fields
    evaluator = db.scalar(select(User).where(User.email == "evaluator@fieldshift.local"))
    if evaluator:
        farms = db.scalars(select(Farm).where(Farm.user_id == evaluator.id)).all()
        evaluator_fields = []
        for farm in farms:
            evaluator_fields.extend(db.scalars(select(Field).where(Field.farm_id == farm.id)).all())
        print(f"Fields for evaluator@fieldshift.local: {len(evaluator_fields)}")
        for ef in evaluator_fields:
            print(f"  - Field #{ef.id}: {ef.name} ({ef.latitude}, {ef.longitude}, {ef.area_ha} ha)")
        assert len(evaluator_fields) == 4, f"Expected 4 canonical fields for evaluator, found {len(evaluator_fields)}"

    print("\nRegistry cleanup verified successfully.")


def main():
    parser = argparse.ArgumentParser(description="Clean up test fields from FieldShift database.")
    parser.add_argument("--dry-run", action="store_true", help="Print fields to delete without modifying DB.")
    args = parser.parse_args()
    cleanup_test_fields(dry_run=args.dry_run)


if __name__ == "__main__":
    main()
