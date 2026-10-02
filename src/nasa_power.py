"""Backward-compatible imports for the NASA POWER data module."""

from src.data.nasa_power import (
    fetch_nasa_power,
    fetch_recent_nasa_power,
    get_latest_valid_date,
    main,
    save_nasa_power_data,
)

__all__ = [
    "fetch_nasa_power",
    "fetch_recent_nasa_power",
    "get_latest_valid_date",
    "save_nasa_power_data",
    "main",
]


if __name__ == "__main__":
    main()
