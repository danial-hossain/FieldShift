"""Train a research-only tabular RL policy in a synthetic water-balance simulator.

This is an executable RL learning experiment, not a crop-growth or yield model.
Weather sequences are taken from the bundled NASA POWER CSV, but the source
file does not establish field-level coordinates. Soil storage, evapotranspiration,
stress, reward, and the irrigation response are transparent toy assumptions
and are not calibrated or agronomically validated.
"""

from __future__ import annotations

import hashlib
import json
import math
import random
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Mapping

import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_WEATHER_PATH = (
    PROJECT_ROOT / "data" / "nasa_power" / "nasa_power_2025.csv"
)
DEFAULT_MODEL_PATH = PROJECT_ROOT / "models" / "rl" / "scenario_irrigation_q_policy.json"
DEFAULT_REPORT_PATH = PROJECT_ROOT / "models" / "rl" / "scenario_irrigation_training_report.json"
SCENARIOS = ("normal", "drought", "heat", "low_water")
ACTION_MM = (0.0, 5.0, 10.0)
EPISODE_DAYS = 90
TRAIN_STARTS = (0, 25, 50, 75, 100)
EVALUATION_STARTS = (200, 240, 275)
Q_SCHEMA_VERSION = 1


@dataclass(frozen=True)
class SimulatorConfig:
    soil_storage_capacity_mm: float = 120.0
    initial_soil_storage_mm: float = 75.0
    irrigation_season_limit_mm: float = 180.0
    low_water_limit_mm: float = 45.0
    stress_onset_storage_mm: float = 70.0
    evapotranspiration_base_mm_day: float = 2.5
    evapotranspiration_temperature_factor: float = 0.12
    reference_temperature_c: float = 20.0
    heat_stress_threshold_c: float = 32.0
    heat_stress_scale_c: float = 10.0
    reward_water_stress_weight: float = 0.8
    reward_heat_stress_weight: float = 0.25
    reward_irrigation_weight_per_mm: float = 0.015
    drought_rainfall_fraction: float = 0.5
    heat_temperature_delta_c: float = 4.0

    def __post_init__(self) -> None:
        values = asdict(self)
        if any(not math.isfinite(float(value)) for value in values.values()):
            raise ValueError("Simulator configuration values must be finite.")
        for name in (
            "soil_storage_capacity_mm",
            "irrigation_season_limit_mm",
            "low_water_limit_mm",
            "stress_onset_storage_mm",
            "evapotranspiration_base_mm_day",
            "heat_stress_scale_c",
        ):
            if float(values[name]) <= 0:
                raise ValueError(f"{name} must be positive.")
        if not 0 <= self.initial_soil_storage_mm <= self.soil_storage_capacity_mm:
            raise ValueError("Initial soil storage must be within the soil capacity.")
        if not 0 <= self.drought_rainfall_fraction <= 1:
            raise ValueError("drought_rainfall_fraction must be between zero and one.")
        if self.low_water_limit_mm > self.irrigation_season_limit_mm:
            raise ValueError("Low-water limit cannot exceed the normal irrigation limit.")


def load_weather(path: str | Path = DEFAULT_WEATHER_PATH) -> tuple[pd.DataFrame, dict[str, str]]:
    """Load and validate a complete daily temperature/rainfall weather series."""
    weather_path = Path(path)
    if not weather_path.is_file():
        raise FileNotFoundError(f"Weather input not found: {weather_path}")
    digest = hashlib.sha256(weather_path.read_bytes()).hexdigest()
    frame = pd.read_csv(weather_path)
    required = {"date", "temperature", "rainfall"}
    missing = sorted(required - set(frame.columns))
    if missing:
        raise ValueError("Weather input is missing columns: " + ", ".join(missing))
    frame = frame[["date", "temperature", "rainfall"]].copy()
    frame["date"] = pd.to_datetime(frame["date"], errors="coerce").dt.normalize()
    for name in ("temperature", "rainfall"):
        frame[name] = pd.to_numeric(frame[name], errors="coerce")
    if frame.isna().any().any():
        raise ValueError("Weather input contains missing or invalid date/temperature/rainfall values.")
    if not np.isfinite(frame[["temperature", "rainfall"]].to_numpy(dtype=float)).all():
        raise ValueError("Weather input must contain finite temperature and rainfall.")
    if (frame["rainfall"] < 0).any():
        raise ValueError("Rainfall cannot be negative.")
    frame = frame.sort_values("date", kind="stable").drop_duplicates("date").reset_index(drop=True)
    date_differences = frame["date"].diff().dropna().dt.days
    if not date_differences.eq(1).all():
        raise ValueError("Weather input must cover consecutive daily dates without gaps.")
    if len(frame) < EPISODE_DAYS:
        raise ValueError(f"Weather input must cover at least {EPISODE_DAYS} consecutive days.")
    return frame, {
        "filename": weather_path.name,
        "sha256": digest,
        "start_date": frame["date"].iloc[0].date().isoformat(),
        "end_date": frame["date"].iloc[-1].date().isoformat(),
        "rows": str(len(frame)),
    }


class SyntheticIrrigationEnvironment:
    """A small daily soil-water bucket simulator with explicitly assumed rewards."""

    def __init__(
        self,
        weather: pd.DataFrame,
        *,
        scenario: str,
        start_index: int,
        config: SimulatorConfig | None = None,
    ) -> None:
        if scenario not in SCENARIOS:
            raise ValueError("scenario must be one of: " + ", ".join(SCENARIOS))
        if isinstance(start_index, bool) or not isinstance(start_index, int):
            raise ValueError("start_index must be an integer.")
        if start_index < 0 or start_index + EPISODE_DAYS > len(weather):
            raise ValueError("The requested episode is outside the supplied weather series.")
        self.weather = weather.reset_index(drop=True)
        self.scenario = scenario
        self.start_index = start_index
        self.config = config or SimulatorConfig()
        if not isinstance(self.config, SimulatorConfig):
            raise TypeError("config must be a SimulatorConfig.")
        self.reset()

    def reset(self) -> tuple[int, int, int, int, int]:
        self.day = 0
        self.storage_mm = self.config.initial_soil_storage_mm
        self.remaining_water_mm = (
            self.config.low_water_limit_mm
            if self.scenario == "low_water"
            else self.config.irrigation_season_limit_mm
        )
        self.total_irrigation_mm = 0.0
        self.water_stress_sum = 0.0
        self.heat_stress_sum = 0.0
        self.reward_sum = 0.0
        self.stress_days = 0
        self.done = False
        return self.observation()

    def _weather_today(self) -> tuple[float, float]:
        row = self.weather.iloc[self.start_index + self.day]
        temperature = float(row["temperature"])
        rainfall = float(row["rainfall"])
        if self.scenario == "drought":
            rainfall *= self.config.drought_rainfall_fraction
        elif self.scenario == "heat":
            temperature += self.config.heat_temperature_delta_c
        return temperature, rainfall

    def observation(self) -> tuple[int, int, int, int, int]:
        if self.done:
            raise RuntimeError("Episode has ended; reset before requesting an observation.")
        temperature, _ = self._weather_today()
        storage_bin = min(5, int(self.storage_mm / 24.0))
        phase_bin = min(5, self.day // 15)
        heat_bin = int(temperature >= self.config.heat_stress_threshold_c)
        water_bin = min(3, int(self.remaining_water_mm / 45.0))
        return storage_bin, phase_bin, heat_bin, water_bin, min(3, self.day % 4)

    def step(self, action_index: int) -> tuple[tuple[int, int, int, int, int], float, bool, dict[str, float]]:
        if self.done:
            raise RuntimeError("Episode has ended; reset before stepping.")
        if isinstance(action_index, bool) or not isinstance(action_index, int):
            raise ValueError("action_index must be an integer.")
        if not 0 <= action_index < len(ACTION_MM):
            raise ValueError("action_index is outside the supported action set.")

        temperature, rainfall = self._weather_today()
        requested_irrigation = ACTION_MM[action_index]
        applied_irrigation = min(requested_irrigation, self.remaining_water_mm)
        self.remaining_water_mm -= applied_irrigation
        self.total_irrigation_mm += applied_irrigation

        evapotranspiration = max(
            0.5,
            self.config.evapotranspiration_base_mm_day
            + self.config.evapotranspiration_temperature_factor
            * (temperature - self.config.reference_temperature_c),
        )
        self.storage_mm = min(
            self.config.soil_storage_capacity_mm,
            max(0.0, self.storage_mm + rainfall + applied_irrigation - evapotranspiration),
        )
        water_stress = min(
            1.0,
            max(
                0.0,
                (self.config.stress_onset_storage_mm - self.storage_mm)
                / self.config.stress_onset_storage_mm,
            ),
        )
        heat_stress = min(
            1.0,
            max(
                0.0,
                (temperature - self.config.heat_stress_threshold_c)
                / self.config.heat_stress_scale_c,
            ),
        )
        reward = (
            1.0
            - self.config.reward_water_stress_weight * water_stress
            - self.config.reward_heat_stress_weight * heat_stress
            - self.config.reward_irrigation_weight_per_mm * applied_irrigation
        )
        self.water_stress_sum += water_stress
        self.heat_stress_sum += heat_stress
        self.stress_days += int(water_stress > 0 or heat_stress > 0)
        self.reward_sum += reward
        self.day += 1
        self.done = self.day >= EPISODE_DAYS
        info = {
            "applied_irrigation_mm": applied_irrigation,
            "soil_storage_mm": self.storage_mm,
            "water_stress_proxy": water_stress,
            "heat_stress_proxy": heat_stress,
        }
        next_state = None if self.done else self.observation()
        return next_state, reward, self.done, info

    def summary(self) -> dict[str, float]:
        if not self.done:
            raise RuntimeError("Episode summary is available only after termination.")
        return {
            "episode_reward_simulator_points": self.reward_sum,
            "irrigation_applied_mm_simulated": self.total_irrigation_mm,
            "mean_water_stress_proxy": self.water_stress_sum / EPISODE_DAYS,
            "mean_heat_stress_proxy": self.heat_stress_sum / EPISODE_DAYS,
            "days_with_simulated_stress": float(self.stress_days),
        }


def _choose_action(
    q_table: Mapping[str, list[float]],
    state: tuple[int, ...],
    *,
    epsilon: float,
    rng: random.Random,
) -> int:
    if rng.random() < epsilon:
        return rng.randrange(len(ACTION_MM))
    values = q_table.get(_state_key(state))
    if values is None:
        return 0
    maximum = max(values)
    best = [index for index, value in enumerate(values) if value == maximum]
    return rng.choice(best)


def _state_key(state: tuple[int, ...]) -> str:
    return ",".join(map(str, state))


def _run_baseline(
    weather: pd.DataFrame,
    scenario: str,
    start_index: int,
    *,
    threshold_policy: bool,
) -> dict[str, float]:
    environment = SyntheticIrrigationEnvironment(
        weather, scenario=scenario, start_index=start_index
    )
    state = environment.reset()
    while not environment.done:
        if not threshold_policy:
            action = 0
        else:
            action = 2 if environment.storage_mm < 55 and environment.remaining_water_mm > 0 else 0
        state, _, _, _ = environment.step(action)
    return environment.summary()


def _evaluate_policy(
    weather: pd.DataFrame,
    q_table: Mapping[str, list[float]],
    scenario: str,
    start_index: int,
) -> dict[str, Any]:
    environment = SyntheticIrrigationEnvironment(
        weather, scenario=scenario, start_index=start_index
    )
    state = environment.reset()
    while not environment.done:
        action = _choose_action(q_table, state, epsilon=0.0, rng=random.Random(0))
        state, _, _, _ = environment.step(action)
    policy_result = environment.summary()
    no_irrigation = _run_baseline(
        weather, scenario, start_index, threshold_policy=False
    )
    threshold = _run_baseline(
        weather, scenario, start_index, threshold_policy=True
    )
    policy_result["baselines"] = {
        "no_irrigation": no_irrigation,
        "soil_moisture_threshold_rule": threshold,
    }
    policy_result["test_start_date"] = weather["date"].iloc[start_index].date().isoformat()
    return policy_result


def train_scenario_policy(
    *,
    weather_path: str | Path = DEFAULT_WEATHER_PATH,
    model_path: str | Path = DEFAULT_MODEL_PATH,
    report_path: str | Path = DEFAULT_REPORT_PATH,
    episodes_per_scenario: int = 120,
    seed: int = 7,
) -> dict[str, Any]:
    """Train tabular Q-learning across four climate/water stress scenarios."""
    if (
        isinstance(episodes_per_scenario, bool)
        or not isinstance(episodes_per_scenario, int)
        or episodes_per_scenario < 1
    ):
        raise ValueError("episodes_per_scenario must be a positive integer.")
    if isinstance(seed, bool) or not isinstance(seed, int):
        raise ValueError("seed must be an integer.")
    weather, weather_provenance = load_weather(weather_path)
    if max(EVALUATION_STARTS) + EPISODE_DAYS > len(weather):
        raise ValueError("Weather series is too short for the fixed held-out periods.")
    if max(TRAIN_STARTS) + EPISODE_DAYS > min(EVALUATION_STARTS):
        raise ValueError("Training and held-out weather periods overlap.")

    rng = random.Random(seed)
    q_table: dict[str, list[float]] = {}
    learning_rate = 0.15
    discount_factor = 0.97
    training_scenarios = list(SCENARIOS)
    for episode in range(episodes_per_scenario * len(training_scenarios)):
        scenario = training_scenarios[episode % len(training_scenarios)]
        start_index = rng.choice(TRAIN_STARTS)
        environment = SyntheticIrrigationEnvironment(
            weather, scenario=scenario, start_index=start_index
        )
        state = environment.reset()
        episode_index = episode // len(training_scenarios)
        epsilon = max(0.03, 1.0 - episode_index / max(1, episodes_per_scenario))
        while not environment.done:
            key = _state_key(state)
            q_table.setdefault(key, [0.0] * len(ACTION_MM))
            action = _choose_action(q_table, state, epsilon=epsilon, rng=rng)
            next_state, reward, done, _ = environment.step(action)
            old_value = q_table[key][action]
            next_best = 0.0
            if not done:
                next_key = _state_key(next_state)
                q_table.setdefault(next_key, [0.0] * len(ACTION_MM))
                next_best = max(q_table[next_key])
            q_table[key][action] = old_value + learning_rate * (
                reward + discount_factor * next_best - old_value
            )
            state = next_state

    evaluation = {
        scenario: [
            _evaluate_policy(weather, q_table, scenario, start_index)
            for start_index in EVALUATION_STARTS
        ]
        for scenario in SCENARIOS
    }
    model_file = Path(model_path)
    report_file = Path(report_path)
    model_file.parent.mkdir(parents=True, exist_ok=True)
    report_file.parent.mkdir(parents=True, exist_ok=True)
    artifact = {
        "schema_version": Q_SCHEMA_VERSION,
        "algorithm": "tabular_q_learning",
        "action_irrigation_mm": list(ACTION_MM),
        "q_table": q_table,
        "simulator_config": asdict(SimulatorConfig()),
        "training_scenarios": list(SCENARIOS),
        "episodes_per_scenario": episodes_per_scenario,
        "random_seed": seed,
        "weather_source_sha256": weather_provenance["sha256"],
        "evidence_class": "observed_weather_with_synthetic_transition_and_reward",
        "not_for_farm_recommendations": True,
    }
    model_file.write_text(json.dumps(artifact, indent=2), encoding="utf-8")
    summary_metrics = {
        scenario: {
            "q_learning_mean_reward_simulator_points": float(
                np.mean([item["episode_reward_simulator_points"] for item in runs])
            ),
            "q_learning_mean_irrigation_mm_simulated": float(
                np.mean([item["irrigation_applied_mm_simulated"] for item in runs])
            ),
            "q_learning_mean_water_stress_proxy": float(
                np.mean([item["mean_water_stress_proxy"] for item in runs])
            ),
            "q_learning_mean_heat_stress_proxy": float(
                np.mean([item["mean_heat_stress_proxy"] for item in runs])
            ),
            "no_irrigation_mean_reward_simulator_points": float(
                np.mean([
                    item["baselines"]["no_irrigation"]["episode_reward_simulator_points"]
                    for item in runs
                ])
            ),
            "threshold_rule_mean_reward_simulator_points": float(
                np.mean([
                    item["baselines"]["soil_moisture_threshold_rule"]["episode_reward_simulator_points"]
                    for item in runs
                ])
            ),
            "held_out_period_count": len(runs),
        }
        for scenario, runs in evaluation.items()
    }
    report = {
        "status": "trained_simulated_policy_research_only",
        "algorithm": "tabular_q_learning",
        "policy_type": "synthetic_irrigation_scenario_policy",
        "model_artifact": str(model_file),
        "training_episodes": episodes_per_scenario * len(training_scenarios),
        "episodes_per_scenario": episodes_per_scenario,
        "q_table_state_count": len(q_table),
        "action_set_irrigation_mm": list(ACTION_MM),
        "scenario_evaluation": summary_metrics,
        "evaluation_detail": evaluation,
        "weather_source": {
            **weather_provenance,
            "source_label": "bundled NASA POWER-attributed local weather CSV",
            "location_coordinates_verified": False,
        },
        "split_protocol": {
            "training_start_indices": list(TRAIN_STARTS),
            "held_out_start_indices": list(EVALUATION_STARTS),
            "held_out_dates": [
                weather["date"].iloc[index].date().isoformat()
                for index in EVALUATION_STARTS
            ],
            "independent_years_available": 1,
        },
        "simulator": {
            "name": "FieldShift synthetic soil-water bucket",
            "config": asdict(SimulatorConfig()),
            "reward_definition": (
                "Daily simulator utility = 1 - 0.8*water_stress_proxy "
                "- 0.25*heat_stress_proxy - 0.015*applied_irrigation_mm."
            ),
        },
        "limitations": [
            "This is an actual tabular Q-learning algorithm, but it learned only in a toy simulator.",
            "The simulator is not AquaCrop or another validated crop-growth model.",
            "The soil-water balance, evapotranspiration, stress response, irrigation action, and reward are assumed, not calibrated.",
            "No crop yield, farm profit, or treatment effect is modeled or predicted.",
            "The NASA POWER-attributed source CSV lacks verified field coordinates; its weather coverage is not validated for a farm.",
            "Training and evaluation use one weather year, so held-out periods are not independent years or farms.",
            "The policy is for offline software research only and must not be used to control irrigation or advise farmers.",
        ],
    }
    report_file.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def load_scenario_policy(path: str | Path = DEFAULT_MODEL_PATH) -> dict[str, Any]:
    model_file = Path(path)
    if not model_file.is_file():
        raise FileNotFoundError(f"Simulated irrigation policy not found: {model_file}")
    artifact = json.loads(model_file.read_text(encoding="utf-8"))
    if artifact.get("schema_version") != Q_SCHEMA_VERSION:
        raise ValueError("Unsupported simulated irrigation policy schema.")
    if artifact.get("algorithm") != "tabular_q_learning":
        raise ValueError("Policy artifact does not contain a Q-learning policy.")
    q_table = artifact.get("q_table")
    if not isinstance(q_table, dict) or not q_table:
        raise ValueError("Q-learning policy artifact has an empty or invalid Q-table.")
    return artifact


if __name__ == "__main__":
    print(json.dumps(train_scenario_policy(), indent=2))
