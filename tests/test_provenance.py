import json
import tempfile
import unittest
from pathlib import Path

from src.data.provenance import (
    DEFAULT_MANIFEST_PATH,
    build_provenance_manifest,
    build_source_manifest,
    validate_provenance_manifest,
    write_provenance_manifest,
)


class ProvenanceManifestTests(unittest.TestCase):
    def test_build_manifest_includes_checked_in_data_files(self):
        manifest = build_provenance_manifest(Path(__file__).resolve().parents[1] / "data")
        files = {item["file_name"] for item in manifest["files"]}
        self.assertIn("nasa_power_2025.csv", files)
        self.assertIn("demo_smap.csv", files)
        self.assertIn("demo_soil.csv", files)
        self.assertIn("demo_field_history.csv", files)
        self.assertIn("crop_knowledge.csv", files)

    def test_synthetic_demo_sources_are_labelled(self):
        manifest = build_provenance_manifest(Path(__file__).resolve().parents[1] / "data")
        demo_file = next(
            item for item in manifest["files"] if item["file_name"] == "demo_smap.csv"
        )
        self.assertEqual(demo_file["provenance_status"], "synthetic_demo_only")

    def test_invalid_manifest_rejected_for_missing_hash_or_file(self):
        manifest = build_provenance_manifest(Path(__file__).resolve().parents[1] / "data")
        manifest["files"][0]["file_hash_sha256"] = "not-a-real-hash"
        errors = validate_provenance_manifest(manifest)
        self.assertTrue(any("Hash mismatch" in error for error in errors))

    def test_manifest_coverage_mismatch_is_detected(self):
        manifest = build_provenance_manifest(Path(__file__).resolve().parents[1] / "data")
        for item in manifest["files"]:
            if item["file_name"] == "nasa_power_2025.csv":
                item["actual_coverage"]["start"] = "2024-01-01"
                break
        errors = validate_provenance_manifest(manifest)
        self.assertTrue(any("Coverage mismatch" in error for error in errors))

    def test_write_manifest_creates_json(self):
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp) / "manifest.json"
            written = write_provenance_manifest(Path(__file__).resolve().parents[1] / "data", output_path=target)
            self.assertTrue(written.exists())
            payload = json.loads(written.read_text(encoding="utf-8"))
            self.assertIn("files", payload)
            self.assertIn("nasa_power_2025.csv", {item["file_name"] for item in payload["files"]})


if __name__ == "__main__":
    unittest.main()
