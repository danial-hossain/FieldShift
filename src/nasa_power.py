import requests
import pandas as pd


def fetch_nasa_power(
    latitude,
    longitude,
    start_date,
    end_date
):
    url = "https://power.larc.nasa.gov/api/temporal/daily/point"

    params = {
        "parameters": (
            "T2M,T2M_MAX,T2M_MIN,"
            "PRECTOTCORR,RH2M,WS2M,"
            "ALLSKY_SFC_SW_DWN"
        ),
        "community": "AG",
        "longitude": longitude,
        "latitude": latitude,
        "start": start_date,
        "end": end_date,
        "format": "JSON"
    }

    response = requests.get(url, params=params)

    response.raise_for_status()

    data = response.json()

    parameters = data["properties"]["parameter"]

    df = pd.DataFrame({
        "date": list(parameters["T2M"].keys()),
        "temperature": list(parameters["T2M"].values()),
        "temp_max": list(parameters["T2M_MAX"].values()),
        "temp_min": list(parameters["T2M_MIN"].values()),
        "rainfall": list(parameters["PRECTOTCORR"].values()),
        "humidity": list(parameters["RH2M"].values()),
        "wind_speed": list(parameters["WS2M"].values()),
        "solar_radiation": list(
            parameters["ALLSKY_SFC_SW_DWN"].values()
        )
    })

    df["date"] = pd.to_datetime(df["date"])

    return df


# Test
if __name__ == "__main__":

    latitude = 23.8103
    longitude = 90.4125

    df = fetch_nasa_power(
        latitude,
        longitude,
        "20250101",
        "20251231"
    )

    print(df.head())
    print()
    print(df.info())