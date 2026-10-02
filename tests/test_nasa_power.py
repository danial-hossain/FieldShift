from unittest.mock import Mock

import pandas as pd
import pytest
import requests

from src.nasa_power import NasaPowerError, OUTPUT_COLUMNS, fetch_nasa_power


def _payload():
    return {
        "properties": {
            "parameter": {
                "T2M": {"20250101": 20.0, "20250102": 21.0},
                "T2M_MAX": {"20250101": 25.0, "20250102": 26.0},
                "T2M_MIN": {"20250101": 15.0, "20250102": 16.0},
                "PRECTOTCORR": {"20250101": 0.0, "20250102": 4.0},
                "RH2M": {"20250101": 70.0, "20250102": 72.0},
                "WS2M": {"20250101": 1.5, "20250102": 1.8},
                "ALLSKY_SFC_SW_DWN": {"20250101": 12.0, "20250102": 13.0},
            }
        }
    }


def test_fetch_builds_expected_dataframe_without_live_api():
    response = Mock()
    response.raise_for_status.return_value = None
    response.json.return_value = _payload()
    session = Mock()
    session.get.return_value = response

    result = fetch_nasa_power(
        23.8103, 90.4125, 20250101, 20250102, session=session, timeout=10
    )

    assert list(result.columns) == list(OUTPUT_COLUMNS)
    assert len(result) == 2
    assert pd.api.types.is_datetime64_any_dtype(result["date"])
    assert result.loc[1, "rainfall"] == 4.0
    _, kwargs = session.get.call_args
    assert kwargs["timeout"] == 10
    assert kwargs["params"]["community"] == "AG"


def test_fetch_rejects_missing_parameter():
    payload = _payload()
    del payload["properties"]["parameter"]["RH2M"]
    response = Mock()
    response.raise_for_status.return_value = None
    response.json.return_value = payload
    session = Mock()
    session.get.return_value = response

    with pytest.raises(NasaPowerError, match="RH2M"):
        fetch_nasa_power(23.8103, 90.4125, 20250101, 20250102, session=session)


def test_fetch_rejects_non_numeric_observation():
    payload = _payload()
    payload["properties"]["parameter"]["T2M"]["20250102"] = "corrupt"
    response = Mock()
    response.raise_for_status.return_value = None
    response.json.return_value = payload
    session = Mock()
    session.get.return_value = response

    with pytest.raises(NasaPowerError, match="non-numeric"):
        fetch_nasa_power(23.8103, 90.4125, 20250101, 20250102, session=session)


def test_fetch_wraps_connection_error():
    session = Mock()
    session.get.side_effect = requests.ConnectionError("offline")

    with pytest.raises(NasaPowerError, match="connect"):
        fetch_nasa_power(23.8103, 90.4125, 20250101, 20250102, session=session)
