import unittest
from datetime import date, timedelta
from unittest.mock import Mock, patch

import numpy as np
import pandas as pd
import requests

from src.data.nasa_power import (
    DATA_COLUMNS,
    DEFAULT_DATA_DIRECTORY,
    KNOWN_UNIT_MAP,
    build_nasa_power_manifest,
    fetch_nasa_power,
    get_latest_valid_date,
    save_nasa_power_data,
    validate_nasa_power_manifest,
    write_nasa_power_provenance_manifest,
)


def sample_api_response():
    dates = ["20260927", "20260928", "20260929"]
    return {
        "properties": {
            "parameter": {
                "T2M": dict(zip(dates, [25.0, 26.0, -999])),
                "T2M_MAX": dict(zip(dates, [30.0, 31.0, -999])),
                "T2M_MIN": dict(zip(dates, [20.0, 21.0, -999])),
                "PRECTOTCORR": dict(zip(dates, [2.0, 0.0, -999])),
                "RH2M": dict(zip(dates, [70.0, 72.0, -999])),
                "WS2M": dict(zip(dates, [3.0, 2.5, -999])),
                "ALLSKY_SFC_SW_DWN": dict(zip(dates, [18.0, 19.0, -999])),
            }
        }
    }


class NasaPowerTests(unittest.TestCase):
    def setUp(self):
        self.response = Mock()
        self.response.json.return_value = sample_api_response()

    def test_latitude_validation(self):
        for latitude in (-90.1, 90.1, "north", True, np.nan, np.inf):
            with self.subTest(latitude=latitude):
                with self.assertRaisesRegex(ValueError, "latitude"):
                    fetch_nasa_power(latitude, 0, "2026-09-27", "2026-09-29")

    def test_longitude_validation(self):
        for longitude in (-180.1, 180.1, "east", True, np.nan, np.inf):
            with self.subTest(longitude=longitude):
                with self.assertRaisesRegex(ValueError, "longitude"):
                    fetch_nasa_power(0, longitude, "2026-09-27", "2026-09-29")

    def test_date_validation(self):
        invalid_ranges = [
            ("not-a-date", "2026-09-29"),
            ("2026-09-30", "2026-09-29"),
            (date.today(), date.today() + timedelta(days=1)),
        ]
        for start, end in invalid_ranges:
            with self.subTest(start=start, end=end):
                with self.assertRaises(ValueError):
                    fetch_nasa_power(0, 0, start, end)

    @patch("src.data.nasa_power.requests.get")
    def test_fetch_cleans_missing_values_and_has_expected_structure(self, get):
        get.return_value = self.response

        frame = fetch_nasa_power(23.8, 90.4, "20260927", "20260929")

        self.assertEqual(list(frame.columns), DATA_COLUMNS)
        self.assertTrue(pd.api.types.is_datetime64_any_dtype(frame["date"]))
        self.assertTrue(
            frame.loc[frame["date"] == pd.Timestamp("2026-09-29"), "temperature"]
            .isna()
            .all()
        )
        self.assertEqual(frame.loc[0, "temperature"], 25.0)
        get.assert_called_once()
        self.assertEqual(get.call_args.kwargs["timeout"], 30)
        self.assertEqual(get.call_args.kwargs["params"]["community"], "AG")

    @patch("src.data.nasa_power.requests.get")
    def test_latest_valid_date_ignores_all_missing_calendar_latest_row(self, get):
        get.return_value = self.response
        frame = fetch_nasa_power(0, 0, "20260927", "20260929")

        self.assertEqual(
            get_latest_valid_date(frame),
            pd.Timestamp("2026-09-28"),
        )

    def test_latest_valid_date_returns_none_when_all_measurements_missing(self):
        data = pd.DataFrame(
            {
                "date": pd.to_datetime(["2026-09-29"]),
                **{column: [np.nan] for column in DATA_COLUMNS[1:]},
            }
        )

        self.assertIsNone(get_latest_valid_date(data))

    def test_latest_valid_date_treats_unprocessed_missing_marker_as_missing(self):
        data = pd.DataFrame(
            {
                "date": pd.to_datetime(["2026-09-28", "2026-09-29"]),
                **{
                    column: [1.0, -999.0]
                    for column in DATA_COLUMNS[1:]
                },
            }
        )

        self.assertEqual(
            get_latest_valid_date(data),
            pd.Timestamp("2026-09-28"),
        )

    @patch("src.data.nasa_power.requests.get")
    def test_http_error_is_reported(self, get):
        response = Mock()
        response.status_code = 503
        response.raise_for_status.side_effect = requests.HTTPError(
            response=response
        )
        get.return_value = response

        with self.assertRaisesRegex(RuntimeError, "HTTP 503"):
            fetch_nasa_power(0, 0, "2026-09-27", "2026-09-29")

    @patch("src.data.nasa_power.requests.get")
    def test_connection_error_is_reported(self, get):
        get.side_effect = requests.ConnectionError("offline")

        with self.assertRaisesRegex(RuntimeError, "Could not connect"):
            fetch_nasa_power(0, 0, "2026-09-27", "2026-09-29")

    @patch("src.data.nasa_power.requests.get")
    def test_timeout_is_reported_explicitly(self, get):
        get.side_effect = requests.Timeout("slow response")

        with self.assertRaisesRegex(RuntimeError, "timed out after 30 seconds"):
            fetch_nasa_power(0, 0, "2026-09-27", "2026-09-29")

    def test_timeout_configuration_must_be_positive_and_finite(self):
        for timeout in (True, False, 0, -1, np.nan, np.inf, "30"):
            with self.subTest(timeout=timeout):
                with self.assertRaisesRegex(ValueError, "timeout"):
                    fetch_nasa_power(
                        0, 0, "2026-09-27", "2026-09-29", timeout=timeout
                    )

    @patch("src.data.nasa_power.requests.get")
    def test_invalid_json_is_reported(self, get):
        self.response.json.side_effect = ValueError("bad json")
        get.return_value = self.response

        with self.assertRaisesRegex(RuntimeError, "invalid JSON"):
            fetch_nasa_power(0, 0, "2026-09-27", "2026-09-29")

    @patch("src.data.nasa_power.requests.get")
    def test_missing_response_field_is_reported(self, get):
        self.response.json.return_value = {"properties": {"parameter": {}}}
        get.return_value = self.response

        with self.assertRaisesRegex(RuntimeError, "missing expected parameter"):
            fetch_nasa_power(0, 0, "2026-09-27", "2026-09-29")

    @patch("src.data.nasa_power.requests.get")
    def test_malformed_and_out_of_range_measurements_are_rejected(self, get):
        malformed = sample_api_response()
        malformed["properties"]["parameter"]["T2M"]["20260927"] = "not-a-number"
        self.response.json.return_value = malformed
        get.return_value = self.response
        with self.assertRaisesRegex(RuntimeError, "non-numeric value"):
            fetch_nasa_power(0, 0, "2026-09-27", "2026-09-29")

        out_of_range = sample_api_response()
        out_of_range["properties"]["parameter"]["RH2M"]["20260927"] = 101.0
        self.response.json.return_value = out_of_range
        with self.assertRaisesRegex(RuntimeError, "physical range"):
            fetch_nasa_power(0, 0, "2026-09-27", "2026-09-29")

    @patch("src.data.nasa_power.requests.get")
    def test_api_response_dates_must_stay_within_requested_range(self, get):
        get.return_value = self.response
        with self.assertRaisesRegex(RuntimeError, "outside the requested range"):
            fetch_nasa_power(0, 0, "2026-09-28", "2026-09-29")

    def test_required_nasa_parameters_and_units_are_declared(self):
        self.assertEqual(
            KNOWN_UNIT_MAP,
            {
                "temperature": "°C",
                "temp_max": "°C",
                "temp_min": "°C",
                "rainfall": "mm/day",
                "humidity": "%",
                "wind_speed": "m/s",
                "solar_radiation": "MJ/m2/day",
            },
        )

    @patch("src.data.nasa_power.requests.get")
    def test_empty_api_response_is_reported(self, get):
        self.response.json.return_value = {
            "properties": {
                "parameter": {
                    name: {} for name in (
                        "T2M",
                        "T2M_MAX",
                        "T2M_MIN",
                        "PRECTOTCORR",
                        "RH2M",
                        "WS2M",
                        "ALLSKY_SFC_SW_DWN",
                    )
                }
            }
        }
        get.return_value = self.response

        with self.assertRaisesRegex(RuntimeError, "no observations"):
            fetch_nasa_power(0, 0, "2026-09-27", "2026-09-29")

    def test_csv_persistence_uses_nasa_and_location_date_filename(self):
        with unittest.mock.patch(
            "src.data.nasa_power.Path.mkdir"
        ) as make_directory, unittest.mock.patch.object(
            pd.DataFrame, "to_csv"
        ) as write_csv:
            frame = pd.DataFrame(
                {
                    column: (
                        pd.to_datetime(["2026-09-28"])
                        if column == "date"
                        else [np.nan]
                    )
                    for column in DATA_COLUMNS
                }
            )
            path = save_nasa_power_data(
                frame,
                23.8103,
                90.4125,
                "2026-09-28",
                "2026-09-29",
                output_directory="data/nasa_power",
            )

        self.assertEqual(
            path.name,
            "nasa_power_lat23.8103_lon90.4125_20260928_20260929.csv",
        )
        make_directory.assert_called_once_with(parents=True, exist_ok=True)
        write_csv.assert_called_once()
        self.assertFalse(write_csv.call_args.kwargs["index"])

    def test_build_manifest_records_known_and_unknown_metadata(self):
        path = DEFAULT_DATA_DIRECTORY / "nasa_power_lat23.8103_lon90.4125_20260831_20260929.csv"
        manifest = build_nasa_power_manifest(path)

        self.assertEqual(manifest["source_product_name"], "NASA POWER Daily Point API")
        self.assertEqual(manifest["latitude"], 23.8103)
        self.assertEqual(manifest["longitude"], 90.4125)
        self.assertEqual(manifest["actual_coverage"]["start_date"], "2026-08-31")
        self.assertIsNone(manifest["retrieval_timestamp"]["value"])
        self.assertIn("not recorded", manifest["requested_dates"]["status"])

    def test_manifest_rejects_date_mismatch(self):
        path = DEFAULT_DATA_DIRECTORY / "nasa_power_lat23.8103_lon90.4125_20260831_20260929.csv"
        manifest = build_nasa_power_manifest(path)
        manifest["actual_coverage"]["start_date"] = "2026-01-01"

        errors = validate_nasa_power_manifest({"files": [manifest]})
        self.assertTrue(any("actual coverage start" in error for error in errors))

    def test_manifest_rejects_invalid_coordinates(self):
        path = DEFAULT_DATA_DIRECTORY / "nasa_power_lat23.8103_lon90.4125_20260831_20260929.csv"
        manifest = build_nasa_power_manifest(path)
        manifest["latitude"] = 100.0

        errors = validate_nasa_power_manifest({"files": [manifest]})
        self.assertTrue(any("invalid latitude" in error for error in errors))

    def test_write_manifest_creates_file_for_each_checked_in_csv(self):
        manifest_path = write_nasa_power_provenance_manifest()
        self.assertTrue(manifest_path.exists())
        data = manifest_path.read_text(encoding="utf-8")
        self.assertIn('"files"', data)
        self.assertIn("nasa_power_2025.csv", data)
        self.assertIn("nasa_power_lat23.8103_lon90.4125_20260831_20260929.csv", data)


if __name__ == "__main__":
    unittest.main()
