"""Explicitly synthetic multi-season FieldShift management simulator.

All weather, water balance, stress response, and growth signals in this module
are generated or simulated. They are not field measurements or crop forecasts.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
import math
from numbers import Integral, Real
from typing import Any, Mapping, Sequence

import numpy as np

SYNTHETIC_ENVIRONMENT_VERSION = "fieldshift-synthetic-multiseason-v1"
SIMULATION_LABEL = "SYNTHETIC / SIMULATED"
POLICY_LABEL = "simulation-trained RL policy; not field validated"
ACTION_NAMES = (
    "no_intervention",
    "light_irrigation",
    "moderate_irrigation",
    "conservative_adaptation",
)
ACTION_IDS = {name: index for index, name in enumerate(ACTION_NAMES)}
SIMULATION_SCENARIOS = ("normal", "drought", "heat", "low_water")
STATE_FIELDS = (
    "temperature",
    "rainfall",
    "soil_moisture",
    "available_water",
    "crop",
    "crop_stage",
    "heat_stress",
    "water_stress",
)


def _finite_number(value: Any, name: str) -> float:
    if isinstance(value, (bool, np.bool_)) or not isinstance(value, Real):
        raise ValueError(f"{name} must be a finite number.")
    number = float(value)
    if not math.isfinite(number):
        raise ValueError(f"{name} must be a finite number.")
    return number


@dataclass(frozen=True)
class SyntheticFieldState:
    temperature: float
    rainfall: float
    soil_moisture: float
    available_water: float
    crop: str
    crop_stage: float
    heat_stress: float
    water_stress: float

    def __post_init__(self) -> None:
        ranges = {
            "temperature": (-10.0, 60.0),
            "rainfall": (0.0, 100.0),
            "soil_moisture": (0.0, 1.0),
            "available_water": (0.0, 120.0),
            "crop_stage": (0.0, 1.0),
            "heat_stress": (0.0, 1.0),
            "water_stress": (0.0, 1.0),
        }
        for name, (minimum, maximum) in ranges.items():
            number = _finite_number(getattr(self, name), name)
            if not minimum <= number <= maximum:
                raise ValueError(f"{name} must be between {minimum:g} and {maximum:g}.")
            object.__setattr__(self, name, number)
        if not isinstance(self.crop, str) or not self.crop.strip():
            raise ValueError("crop must be a non-empty string.")
        object.__setattr__(self, "crop", self.crop.strip())

    @classmethod
    def from_mapping(cls, value: Mapping[str, Any]) -> "SyntheticFieldState":
        if not isinstance(value, Mapping):
            raise TypeError("state must be a mapping.")
        missing = set(STATE_FIELDS) - set(value)
        unknown = set(value) - set(STATE_FIELDS)
        if missing or unknown:
            details = []
            if missing:
                details.append("missing fields: " + ", ".join(sorted(missing)))
            if unknown:
                details.append("unknown fields: " + ", ".join(sorted(unknown)))
            raise ValueError("Invalid synthetic state schema (" + "; ".join(details) + ").")
        return cls(**{name: value[name] for name in STATE_FIELDS})

    def to_dict(self) -> dict[str, float | str]:
        return asdict(self)


@dataclass(frozen=True)
class SyntheticEnvironmentConfig:
    seasons: int = 3
    steps_per_season: int = 24
    soil_water_capacity_mm: float = 100.0
    initial_soil_moisture: float = 0.55
    initial_available_water_mm: float = 45.0
    seasonal_water_replenishment_mm: float = 25.0
    light_irrigation_mm: float = 4.0
    moderate_irrigation_mm: float = 8.0
    rainfall_infiltration_fraction: float = 0.65
    evapotranspiration_base_mm: float = 2.2
    evapotranspiration_temperature_factor: float = 0.08
    adaptation_evapotranspiration_fraction: float = 0.15
    heat_threshold_c: float = 32.0
    heat_scale_c: float = 10.0
    adaptation_heat_stress_fraction: float = 0.20
    water_stress_onset_moisture: float = 0.55
    yield_proxy_weight: float = 1.0
    water_use_penalty_weight: float = 0.15
    heat_stress_penalty_weight: float = 0.25
    water_stress_penalty_weight: float = 0.50

    def __post_init__(self) -> None:
        if (
            isinstance(self.seasons, bool)
            or not isinstance(self.seasons, Integral)
            or self.seasons < 1
        ):
            raise ValueError("seasons must be a positive integer.")
        if (
            isinstance(self.steps_per_season, bool)
            or not isinstance(self.steps_per_season, Integral)
            or self.steps_per_season < 2
        ):
            raise ValueError("steps_per_season must be an integer of at least 2.")
        ranges = {
            "soil_water_capacity_mm": (0.0, 500.0),
            "initial_soil_moisture": (0.0, 1.0),
            "initial_available_water_mm": (0.0, 120.0),
            "seasonal_water_replenishment_mm": (0.0, 120.0),
            "light_irrigation_mm": (0.0, 120.0),
            "moderate_irrigation_mm": (0.0, 120.0),
            "rainfall_infiltration_fraction": (0.0, 1.0),
            "evapotranspiration_base_mm": (0.0, 50.0),
            "evapotranspiration_temperature_factor": (0.0, 10.0),
            "adaptation_evapotranspiration_fraction": (0.0, 1.0),
            "heat_threshold_c": (-10.0, 60.0),
            "heat_scale_c": (0.001, 100.0),
            "adaptation_heat_stress_fraction": (0.0, 1.0),
            "water_stress_onset_moisture": (0.001, 1.0),
            "yield_proxy_weight": (0.0, 100.0),
            "water_use_penalty_weight": (0.0, 100.0),
            "heat_stress_penalty_weight": (0.0, 100.0),
            "water_stress_penalty_weight": (0.0, 100.0),
        }
        for name, (minimum, maximum) in ranges.items():
            number = _finite_number(getattr(self, name), name)
            if not minimum <= number <= maximum:
                raise ValueError(f"{name} must be between {minimum:g} and {maximum:g}.")
        if self.soil_water_capacity_mm == 0:
            raise ValueError("soil_water_capacity_mm must be positive.")
        if self.moderate_irrigation_mm < self.light_irrigation_mm:
            raise ValueError("moderate irrigation must be at least light irrigation.")
        if (
            self.yield_proxy_weight
            + self.water_use_penalty_weight
            + self.heat_stress_penalty_weight
            + self.water_stress_penalty_weight
            <= 0
        ):
            raise ValueError("At least one explicit reward component must be weighted.")


class SyntheticMultiSeasonEnvironment:
    """Seeded toy water-balance simulator with explicit synthetic outcomes.

    Each action advances one simulated interval. Rainfall is generated from a
    seeded scenario distribution; infiltration, irrigation, and
    evapotranspiration update the water bucket. Conservative adaptation
    applies fixed simulator assumptions that reduce modeled heat stress and
    evapotranspiration for that transition. Crop labels follow the supplied
    MILP rotation when provided, but crop-specific agronomic response is not
    modeled. Yield proxy is normalized simulated growth, never measured yield.
    """

    def __init__(
        self,
        *,
        scenario: str = "normal",
        seed: int = 0,
        config: SyntheticEnvironmentConfig | None = None,
        crop_rotation: Sequence[str] | None = None,
    ) -> None:
        if scenario not in SIMULATION_SCENARIOS:
            raise ValueError(
                "scenario must be one of: " + ", ".join(SIMULATION_SCENARIOS)
            )
        if isinstance(seed, bool) or not isinstance(seed, Integral):
            raise ValueError("seed must be an integer.")
        if config is None:
            config = SyntheticEnvironmentConfig()
        if not isinstance(config, SyntheticEnvironmentConfig):
            raise TypeError("config must be a SyntheticEnvironmentConfig.")
        rotation = tuple(crop_rotation or ("Maize", "Wheat", "Lentil"))
        if not rotation or any(not isinstance(crop, str) or not crop.strip() for crop in rotation):
            raise ValueError("crop_rotation must contain non-empty crop labels.")
        self.scenario = scenario
        self.seed = int(seed)
        self.config = config
        self.crop_rotation = tuple(crop.strip() for crop in rotation)
        self.reset(seed=self.seed)

    @property
    def episode_length(self) -> int:
        return int(self.config.seasons * self.config.steps_per_season)

    def validate_action(self, action: Any) -> int:
        if isinstance(action, bool) or not isinstance(action, Integral):
            raise ValueError("action must be an integer ID from 0 through 3.")
        action_id = int(action)
        if not 0 <= action_id < len(ACTION_NAMES):
            raise ValueError("action ID is outside the supported range 0 through 3.")
        return action_id

    def get_available_actions(self) -> list[dict[str, Any]]:
        return [
            {"action_id": index, "action": name, "evidence_class": "synthetic"}
            for index, name in enumerate(ACTION_NAMES)
        ]

    def _weather(self, step: int) -> tuple[float, float]:
        phase = (step % self.config.steps_per_season) / self.config.steps_per_season
        seasonal_temperature = 27.0 + 4.0 * math.sin(2 * math.pi * phase)
        temperature = seasonal_temperature + float(self._rng.normal(0.0, 1.2))
        rainfall_shape, rainfall_scale = 1.4, 3.0
        if self.scenario == "drought":
            temperature += 1.0
            rainfall_shape, rainfall_scale = 0.8, 1.5
        elif self.scenario == "heat":
            temperature += 6.0
            rainfall_shape, rainfall_scale = 1.0, 2.0
        elif self.scenario == "low_water":
            rainfall_shape, rainfall_scale = 1.0, 2.2
        rainfall = min(
            100.0,
            max(0.0, float(self._rng.gamma(rainfall_shape, rainfall_scale))),
        )
        return min(60.0, max(-10.0, temperature)), rainfall

    def _crop_at(self, step: int) -> str:
        season_index = min(
            len(self.crop_rotation) - 1,
            step // self.config.steps_per_season,
        )
        return self.crop_rotation[season_index]

    def _make_state(
        self,
        *,
        step: int,
        soil_water_mm: float,
        available_water: float,
        adaptation: bool,
    ) -> SyntheticFieldState:
        temperature, rainfall = self._weather(step)
        heat_stress = min(
            1.0,
            max(0.0, (temperature - self.config.heat_threshold_c) / self.config.heat_scale_c),
        )
        if adaptation:
            heat_stress *= 1.0 - self.config.adaptation_heat_stress_fraction
        soil_moisture = min(
            1.0,
            max(0.0, soil_water_mm / self.config.soil_water_capacity_mm),
        )
        water_stress = min(
            1.0,
            max(
                0.0,
                (self.config.water_stress_onset_moisture - soil_moisture)
                / self.config.water_stress_onset_moisture,
            ),
        )
        return SyntheticFieldState(
            temperature=temperature,
            rainfall=rainfall,
            soil_moisture=soil_moisture,
            available_water=available_water,
            crop=self._crop_at(min(step, self.episode_length - 1)),
            crop_stage=(step % self.config.steps_per_season) / self.config.steps_per_season,
            heat_stress=heat_stress,
            water_stress=water_stress,
        )

    def reset(self, *, seed: int | None = None) -> dict[str, Any]:
        if seed is not None and (isinstance(seed, bool) or not isinstance(seed, Integral)):
            raise ValueError("seed must be an integer.")
        if seed is not None:
            self.seed = int(seed)
        self._rng = np.random.default_rng(self.seed)
        self._step_count = 0
        self._done = False
        self._soil_water_mm = (
            self.config.initial_soil_moisture * self.config.soil_water_capacity_mm
        )
        initial_water = self.config.initial_available_water_mm
        if self.scenario == "low_water":
            initial_water = min(initial_water, 20.0)
        self._available_water = initial_water
        self._previous_adaptation = False
        self._total_reward = 0.0
        self._total_yield_proxy = 0.0
        self._total_water_use = 0.0
        self._heat_stress_sum = 0.0
        self._water_stress_sum = 0.0
        self._interventions = 0
        self._state = self._make_state(
            step=0,
            soil_water_mm=self._soil_water_mm,
            available_water=self._available_water,
            adaptation=False,
        )
        return self.get_observation()

    def get_observation(self) -> dict[str, Any]:
        return {
            "state": self._state.to_dict(),
            "evidence_class": "synthetic",
            "data_status": "simulated",
            "environment_version": SYNTHETIC_ENVIRONMENT_VERSION,
            "scenario": self.scenario,
            "step": self._step_count,
            "episode_length": self.episode_length,
        }

    def step(self, action: Any) -> tuple[dict[str, Any] | None, float, bool, dict[str, Any]]:
        if self._done:
            raise RuntimeError("Episode has ended; call reset() before stepping again.")
        action_id = self.validate_action(action)
        action_name = ACTION_NAMES[action_id]
        requested = 0.0
        if action_id == ACTION_IDS["light_irrigation"]:
            requested = self.config.light_irrigation_mm
        elif action_id == ACTION_IDS["moderate_irrigation"]:
            requested = self.config.moderate_irrigation_mm
        applied = min(requested, self._available_water)
        self._available_water -= applied
        self._total_water_use += applied
        self._interventions += int(action_id != ACTION_IDS["no_intervention"])

        adaptation = action_id == ACTION_IDS["conservative_adaptation"]
        evapotranspiration = max(
            0.0,
            self.config.evapotranspiration_base_mm
            + self.config.evapotranspiration_temperature_factor
            * (self._state.temperature - 20.0),
        )
        if adaptation:
            evapotranspiration *= (
                1.0 - self.config.adaptation_evapotranspiration_fraction
            )
        self._soil_water_mm = min(
            self.config.soil_water_capacity_mm,
            max(
                0.0,
                self._soil_water_mm
                + self._state.rainfall * self.config.rainfall_infiltration_fraction
                + applied
                - evapotranspiration,
            ),
        )

        self._step_count += 1
        season_changed = (
            self._step_count < self.episode_length
            and self._step_count % self.config.steps_per_season == 0
        )
        if season_changed:
            self._available_water = min(
                120.0,
                self._available_water
                + self.config.seasonal_water_replenishment_mm,
            )
        next_step = min(self._step_count, self.episode_length - 1)
        next_state = self._make_state(
            step=next_step,
            soil_water_mm=self._soil_water_mm,
            available_water=self._available_water,
            adaptation=adaptation,
        )
        yield_proxy = max(
            0.0,
            (1.0 - 0.5 * next_state.heat_stress)
            * (1.0 - 0.5 * next_state.water_stress)
            / self.config.steps_per_season,
        )
        water_use_penalty = (
            -self.config.water_use_penalty_weight
            * applied
            / max(
                self.config.initial_available_water_mm,
                self.config.seasonal_water_replenishment_mm,
                1.0,
            )
        )
        heat_stress_penalty = (
            -self.config.heat_stress_penalty_weight
            * next_state.heat_stress
            / self.config.steps_per_season
        )
        water_stress_penalty = (
            -self.config.water_stress_penalty_weight
            * next_state.water_stress
            / self.config.steps_per_season
        )
        components = {
            "yield_proxy": self.config.yield_proxy_weight * yield_proxy,
            "water_use_penalty": water_use_penalty,
            "heat_stress_penalty": heat_stress_penalty,
            "water_stress_penalty": water_stress_penalty,
        }
        reward = float(sum(components.values()))
        if not math.isfinite(reward):
            raise RuntimeError("Synthetic reward calculation produced a non-finite value.")

        self._total_reward += reward
        self._total_yield_proxy += yield_proxy
        self._heat_stress_sum += next_state.heat_stress
        self._water_stress_sum += next_state.water_stress
        self._state = next_state
        self._previous_adaptation = adaptation
        self._done = self._step_count >= self.episode_length
        info = {
            "action_id": action_id,
            "action": action_name,
            "requested_irrigation_mm_simulated": requested,
            "applied_irrigation_mm_simulated": applied,
            "reward": reward,
            "reward_components_simulated": components,
            "evidence_class": "synthetic",
            "data_status": "simulated",
            "safety_boundary": "external_existing_fieldshift_validator_required_for_workflow_use",
            "season_changed": season_changed,
        }
        return (
            None if self._done else self.get_observation(),
            reward,
            self._done,
            info,
        )

    def summary(self) -> dict[str, Any]:
        if not self._done:
            raise RuntimeError("Episode summary is available only after termination.")
        return {
            "evidence_class": "synthetic",
            "data_status": "simulated",
            "scenario": self.scenario,
            "seasons": self.config.seasons,
            "steps": self.episode_length,
            "cumulative_reward_simulated": self._total_reward,
            "yield_proxy_simulated": self._total_yield_proxy,
            "water_use_mm_simulated": self._total_water_use,
            "mean_heat_stress_simulated": self._heat_stress_sum / self.episode_length,
            "mean_water_stress_simulated": self._water_stress_sum / self.episode_length,
            "intervention_frequency_simulated": (
                self._interventions / self.episode_length
            ),
            "intervention_count_simulated": self._interventions,
            "policy_label": POLICY_LABEL,
        }
