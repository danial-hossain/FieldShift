"""Deterministic tabular Q-learning for the synthetic FieldShift simulator."""

from __future__ import annotations

import argparse
from dataclasses import asdict
import json
import math
from pathlib import Path
import random
from statistics import fmean
from typing import Any, Mapping

from src.rl.synthetic_environment import (
    ACTION_NAMES,
    POLICY_LABEL,
    SIMULATION_LABEL,
    SIMULATION_SCENARIOS,
    STATE_FIELDS,
    SYNTHETIC_ENVIRONMENT_VERSION,
    SyntheticEnvironmentConfig,
    SyntheticFieldState,
    SyntheticMultiSeasonEnvironment,
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_POLICY_PATH = (
    PROJECT_ROOT / "models" / "rl" / "phase37_synthetic_q_policy.json"
)
DEFAULT_REPORT_PATH = (
    PROJECT_ROOT / "models" / "rl" / "phase37_synthetic_q_evaluation.json"
)
POLICY_SCHEMA_VERSION = 1
DISCRETIZATION = {
    "temperature": (20.0, 28.0, 34.0, 40.0),
    "rainfall": (1.0, 4.0, 10.0),
    "soil_moisture": (0.15, 0.30, 0.45, 0.65),
    "available_water": (1.0, 15.0, 30.0, 60.0),
    "crop_stage": (0.25, 0.50, 0.75),
    "heat_stress": (0.10, 0.40, 0.70),
    "water_stress": (0.10, 0.40, 0.70),
}


def _state_from_observation(observation: Any) -> SyntheticFieldState:
    if isinstance(observation, SyntheticFieldState):
        return observation
    if not isinstance(observation, Mapping):
        raise TypeError("observation must be a synthetic state or mapping.")
    state = observation.get("state", observation)
    return SyntheticFieldState.from_mapping(state)


def state_key(state_value: SyntheticFieldState | Mapping[str, Any]) -> str:
    state = _state_from_observation(state_value)
    discrete = []
    for name in STATE_FIELDS:
        value = getattr(state, name)
        if name == "crop":
            discrete.append(state.crop)
        else:
            thresholds = DISCRETIZATION.get(name, ())
            discrete.append(sum(value >= threshold for threshold in thresholds))
    return json.dumps(discrete, separators=(",", ":"), ensure_ascii=True)


class SyntheticQPolicy:
    """Greedy policy loaded from a successful simulation-only Q-learning run."""

    def __init__(self, artifact: Mapping[str, Any]) -> None:
        if not isinstance(artifact, Mapping):
            raise TypeError("policy artifact must be a mapping.")
        if artifact.get("schema_version") != POLICY_SCHEMA_VERSION:
            raise ValueError("Unsupported synthetic policy schema_version.")
        if artifact.get("algorithm") != "tabular_q_learning":
            raise ValueError("Policy artifact algorithm is not tabular_q_learning.")
        if artifact.get("environment_version") != SYNTHETIC_ENVIRONMENT_VERSION:
            raise ValueError("Policy artifact environment version does not match.")
        if artifact.get("policy_label") != POLICY_LABEL:
            raise ValueError("Policy artifact is missing the required research label.")
        if artifact.get("evidence_class") != "synthetic":
            raise ValueError("Policy artifact must be labeled synthetic.")
        if tuple(artifact.get("state_schema", ())) != STATE_FIELDS:
            raise ValueError("Policy artifact state schema does not match.")
        if tuple(artifact.get("action_space", ())) != ACTION_NAMES:
            raise ValueError("Policy artifact action space does not match.")
        q_table = artifact.get("q_table")
        if not isinstance(q_table, Mapping) or not q_table:
            raise ValueError("Policy artifact must contain a non-empty q_table.")
        clean_table: dict[str, tuple[float, ...]] = {}
        for key, values in q_table.items():
            if not isinstance(key, str) or not isinstance(values, list):
                raise ValueError("Policy Q-table entries are malformed.")
            if len(values) != len(ACTION_NAMES):
                raise ValueError("Each Q-table row must have one value per action.")
            row = tuple(float(value) for value in values)
            if not all(math.isfinite(value) for value in row):
                raise ValueError("Policy Q-table values must be finite.")
            clean_table[key] = row
        self.q_table = clean_table
        self.policy_label = POLICY_LABEL
        self.evidence_class = "synthetic"

    def select_action(
        self,
        observation: Any,
        available_actions: Any = None,
        seed: int | None = None,
    ) -> int:
        del available_actions, seed
        key = state_key(_state_from_observation(observation))
        values = self.q_table.get(key)
        if values is None:
            return 0
        maximum = max(values)
        return int(next(index for index, value in enumerate(values) if value == maximum))


def load_synthetic_q_policy(path: str | Path = DEFAULT_POLICY_PATH) -> SyntheticQPolicy:
    policy_path = Path(path)
    if not policy_path.is_file():
        raise FileNotFoundError(f"Synthetic RL policy artifact not found: {policy_path}")
    try:
        artifact = json.loads(policy_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"Could not read synthetic RL policy artifact: {error}") from error
    return SyntheticQPolicy(artifact)


def _greedy_action(
    q_table: Mapping[str, list[float]],
    state: SyntheticFieldState,
    *,
    rng: random.Random,
    epsilon: float,
) -> int:
    if rng.random() < epsilon:
        return rng.randrange(len(ACTION_NAMES))
    values = q_table.get(state_key(state))
    if values is None:
        return 0
    maximum = max(values)
    return int(next(index for index, value in enumerate(values) if value == maximum))


def _run_episode(
    *,
    scenario: str,
    seed: int,
    config: SyntheticEnvironmentConfig,
    policy: SyntheticQPolicy | None = None,
) -> dict[str, Any]:
    environment = SyntheticMultiSeasonEnvironment(
        scenario=scenario,
        seed=seed,
        config=config,
    )
    observation = environment.reset(seed=seed)
    while True:
        if policy is None:
            action = 0
        else:
            action = policy.select_action(observation)
        observation, _, done, _ = environment.step(action)
        if done:
            return environment.summary()


def _mean_metrics(episodes: list[Mapping[str, Any]]) -> dict[str, float | int | str]:
    metric_names = (
        "cumulative_reward_simulated",
        "yield_proxy_simulated",
        "water_use_mm_simulated",
        "mean_heat_stress_simulated",
        "mean_water_stress_simulated",
        "intervention_frequency_simulated",
    )
    return {
        **{
            name: float(fmean(float(item[name]) for item in episodes))
            for name in metric_names
        },
        "held_out_episode_count": len(episodes),
        "evidence_class": "synthetic",
        "data_status": "simulated",
    }


def evaluate_synthetic_q_policy(
    policy: SyntheticQPolicy,
    *,
    seed: int,
    episodes_per_scenario: int = 8,
    config: SyntheticEnvironmentConfig | None = None,
) -> dict[str, Any]:
    if not isinstance(policy, SyntheticQPolicy):
        raise TypeError("policy must be a SyntheticQPolicy.")
    if isinstance(episodes_per_scenario, bool) or not isinstance(
        episodes_per_scenario, int
    ) or episodes_per_scenario < 1:
        raise ValueError("episodes_per_scenario must be a positive integer.")
    if isinstance(seed, bool) or not isinstance(seed, int):
        raise ValueError("seed must be an integer.")
    if config is None:
        config = SyntheticEnvironmentConfig()
    scenarios: dict[str, Any] = {}
    for scenario_index, scenario in enumerate(SIMULATION_SCENARIOS):
        baseline_runs = []
        policy_runs = []
        for episode_index in range(episodes_per_scenario):
            held_out_seed = seed + 100_000 + scenario_index * 10_000 + episode_index
            baseline_runs.append(
                _run_episode(
                    scenario=scenario,
                    seed=held_out_seed,
                    config=config,
                )
            )
            policy_runs.append(
                _run_episode(
                    scenario=scenario,
                    seed=held_out_seed,
                    config=config,
                    policy=policy,
                )
            )
        baseline_metrics = _mean_metrics(baseline_runs)
        policy_metrics = _mean_metrics(policy_runs)
        scenarios[scenario] = {
            "baseline_no_intervention": baseline_metrics,
            "trained_policy": policy_metrics,
            "difference_trained_minus_baseline": {
                name: float(policy_metrics[name]) - float(baseline_metrics[name])
                for name in (
                    "cumulative_reward_simulated",
                    "yield_proxy_simulated",
                    "water_use_mm_simulated",
                    "mean_heat_stress_simulated",
                    "mean_water_stress_simulated",
                    "intervention_frequency_simulated",
                )
            },
            "evaluation_seeds": [
                seed + 100_000 + scenario_index * 10_000 + episode_index
                for episode_index in range(episodes_per_scenario)
            ],
        }
    return {
        "status": "evaluated_synthetic_only",
        "policy_label": POLICY_LABEL,
        "evidence_class": "synthetic",
        "data_status": "simulated",
        "held_out_scenarios": list(SIMULATION_SCENARIOS),
        "episodes_per_scenario": episodes_per_scenario,
        "results_by_scenario": scenarios,
        "limitations": [
            "Evaluation seeds are held out from the training seed range.",
            "The reward and every state transition are simulator assumptions.",
            "No field validation, causal agronomic effect, or real farm performance is established.",
        ],
    }


def train_synthetic_q_policy(
    *,
    policy_path: str | Path = DEFAULT_POLICY_PATH,
    report_path: str | Path = DEFAULT_REPORT_PATH,
    episodes: int = 240,
    seed: int = 37,
    learning_rate: float = 0.15,
    discount_factor: float = 0.95,
    minimum_epsilon: float = 0.05,
    held_out_episodes_per_scenario: int = 8,
    config: SyntheticEnvironmentConfig | None = None,
) -> dict[str, Any]:
    if isinstance(episodes, bool) or not isinstance(episodes, int) or episodes < 1:
        raise ValueError("episodes must be a positive integer.")
    if isinstance(seed, bool) or not isinstance(seed, int):
        raise ValueError("seed must be an integer.")
    for name, value in (
        ("learning_rate", learning_rate),
        ("discount_factor", discount_factor),
        ("minimum_epsilon", minimum_epsilon),
    ):
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(float(value)):
            raise ValueError(f"{name} must be finite.")
    if not 0.0 < learning_rate <= 1.0:
        raise ValueError("learning_rate must be in (0, 1].")
    if not 0.0 <= discount_factor <= 1.0:
        raise ValueError("discount_factor must be in [0, 1].")
    if not 0.0 <= minimum_epsilon <= 1.0:
        raise ValueError("minimum_epsilon must be in [0, 1].")
    if isinstance(held_out_episodes_per_scenario, bool) or not isinstance(
        held_out_episodes_per_scenario, int
    ) or held_out_episodes_per_scenario < 1:
        raise ValueError("held_out_episodes_per_scenario must be positive.")
    if config is None:
        config = SyntheticEnvironmentConfig()
    if not isinstance(config, SyntheticEnvironmentConfig):
        raise TypeError("config must be a SyntheticEnvironmentConfig.")

    rng = random.Random(seed)
    q_table: dict[str, list[float]] = {}
    training_scenarios = list(SIMULATION_SCENARIOS)
    training_episode_returns: list[float] = []
    for episode_index in range(episodes):
        scenario = training_scenarios[episode_index % len(training_scenarios)]
        episode_seed = seed + 1_000 + episode_index
        environment = SyntheticMultiSeasonEnvironment(
            scenario=scenario,
            seed=episode_seed,
            config=config,
        )
        observation = environment.reset(seed=episode_seed)
        episode_reward = 0.0
        epsilon = max(
            minimum_epsilon,
            1.0 - (1.0 - minimum_epsilon) * episode_index / max(1, episodes - 1),
        )
        while True:
            state = SyntheticFieldState.from_mapping(observation["state"])
            key = state_key(state)
            values = q_table.setdefault(key, [0.0] * len(ACTION_NAMES))
            action = _greedy_action(q_table, state, rng=rng, epsilon=epsilon)
            next_observation, reward, done, info = environment.step(action)
            if info["evidence_class"] != "synthetic" or not math.isfinite(reward):
                raise RuntimeError("Training encountered a non-synthetic or invalid reward.")
            next_best = 0.0
            if not done:
                next_state = SyntheticFieldState.from_mapping(next_observation["state"])
                next_key = state_key(next_state)
                next_values = q_table.setdefault(next_key, [0.0] * len(ACTION_NAMES))
                next_best = max(next_values)
            values[action] += learning_rate * (
                reward + (0.0 if done else discount_factor * next_best) - values[action]
            )
            episode_reward += reward
            if done:
                training_episode_returns.append(episode_reward)
                break
            observation = next_observation

    if not q_table or not training_episode_returns:
        raise RuntimeError("Training did not produce a valid Q-table and completed episodes.")
    if not all(math.isfinite(value) for row in q_table.values() for value in row):
        raise RuntimeError("Training produced non-finite Q-values; artifact was not saved.")

    artifact = {
        "schema_version": POLICY_SCHEMA_VERSION,
        "algorithm": "tabular_q_learning",
        "policy_label": POLICY_LABEL,
        "production_ready": False,
        "field_validated": False,
        "evidence_class": "synthetic",
        "data_status": "simulated",
        "environment_version": SYNTHETIC_ENVIRONMENT_VERSION,
        "scenario_label": SIMULATION_LABEL,
        "state_schema": list(STATE_FIELDS),
        "action_space": list(ACTION_NAMES),
        "discretization": DISCRETIZATION,
        "reward_components": [
            "yield_proxy",
            "water_use_penalty",
            "heat_stress_penalty",
            "water_stress_penalty",
        ],
        "reward_configuration": asdict(config),
        "training_configuration": {
            "episodes": episodes,
            "seed": seed,
            "learning_rate": float(learning_rate),
            "discount_factor": float(discount_factor),
            "minimum_epsilon": float(minimum_epsilon),
            "scenario_schedule": training_scenarios,
            "training_seed_start": seed + 1_000,
            "training_seed_end": seed + 1_000 + episodes - 1,
            "held_out_seed_start": seed + 100_000,
        },
        "q_table": q_table,
    }
    policy = SyntheticQPolicy(artifact)
    evaluation = evaluate_synthetic_q_policy(
        policy,
        seed=seed,
        episodes_per_scenario=held_out_episodes_per_scenario,
        config=config,
    )
    policy_file = Path(policy_path)
    report_file = Path(report_path)
    policy_file.parent.mkdir(parents=True, exist_ok=True)
    report_file.parent.mkdir(parents=True, exist_ok=True)
    temporary_policy = policy_file.with_name(policy_file.name + ".tmp")
    temporary_report = report_file.with_name(report_file.name + ".tmp")
    try:
        temporary_policy.write_text(
            json.dumps(artifact, indent=2, sort_keys=True),
            encoding="utf-8",
        )
        temporary_report.write_text(
            json.dumps(
                {
                    "status": "trained_and_evaluated_synthetic_policy",
                    "policy_label": POLICY_LABEL,
                    "algorithm": "tabular_q_learning",
                    "policy_artifact": str(policy_file),
                    "evidence_class": "synthetic",
                    "data_status": "simulated",
                    "training_configuration": artifact["training_configuration"],
                    "training_completed_episodes": len(training_episode_returns),
                    "training_q_table_state_count": len(q_table),
                    "training_mean_cumulative_reward_simulated": float(
                        fmean(training_episode_returns)
                    ),
                    "evaluation": evaluation,
                },
                indent=2,
                sort_keys=True,
            ),
            encoding="utf-8",
        )
        temporary_policy.replace(policy_file)
        temporary_report.replace(report_file)
    finally:
        temporary_policy.unlink(missing_ok=True)
        temporary_report.unlink(missing_ok=True)

    loaded_policy = load_synthetic_q_policy(policy_file)
    inference_env = SyntheticMultiSeasonEnvironment(
        scenario="normal",
        seed=seed + 200_000,
        config=config,
    )
    inference_observation = inference_env.reset()
    inference_action = loaded_policy.select_action(inference_observation)
    inference_env.validate_action(inference_action)
    return {
        "status": "trained_and_evaluated_synthetic_policy",
        "policy_label": POLICY_LABEL,
        "algorithm": "tabular_q_learning",
        "policy_artifact": str(policy_file),
        "report_artifact": str(report_file),
        "training_configuration": artifact["training_configuration"],
        "training_completed_episodes": len(training_episode_returns),
        "training_q_table_state_count": len(q_table),
        "training_mean_cumulative_reward_simulated": float(
            fmean(training_episode_returns)
        ),
        "evaluation": evaluation,
        "policy_loading_and_inference": {
            "status": "passed",
            "action_id": inference_action,
            "action": ACTION_NAMES[inference_action],
            "evidence_class": "synthetic",
        },
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Train a FieldShift policy in the synthetic multi-season simulator."
    )
    parser.add_argument("--episodes", type=int, default=240)
    parser.add_argument("--seed", type=int, default=37)
    parser.add_argument("--policy", default=str(DEFAULT_POLICY_PATH))
    parser.add_argument("--report", default=str(DEFAULT_REPORT_PATH))
    parser.add_argument("--held-out-episodes", type=int, default=8)
    arguments = parser.parse_args(argv)
    result = train_synthetic_q_policy(
        episodes=arguments.episodes,
        seed=arguments.seed,
        policy_path=arguments.policy,
        report_path=arguments.report,
        held_out_episodes_per_scenario=arguments.held_out_episodes,
    )
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
