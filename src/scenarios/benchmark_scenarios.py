"""Synthetic Benchmark Scenario Suite for FieldShift.

Defines internally consistent, scientifically grounded synthetic scenarios
(A through F) designed to evaluate and demonstrate MILP optimizer behavior,
objective trade-offs, and explainable strategy divergence/convergence.
"""

from __future__ import annotations

from dataclasses import dataclass, replace
import math
from typing import Any, Mapping, Optional, Sequence
import pandas as pd

from src.data.crops import load_crop_knowledge
from src.optimizer.strategies import DEFAULT_PRIORITY_PROFILES, generate_rotation_strategies
from src.state.field_state import FieldState


CANONICAL_BENCHMARK_CROPS = [
    "Tomato",
    "Sesame",
    "Chickpea",
    "Lentil",
    "Mungbean",
    "Groundnut",
    "Sorghum",
    "Soybean",
]

MODEL_CONSUMPTION_METADATA = [
    {
        "parameter": "Available Water (mm)",
        "model_consumption": "Season water availability upper bound (water_req <= available_water_mm) and Water Score objective",
        "solver_effect": "Directly bounds high-water crops (e.g., Tomato 550mm) in dry regimes, causing strategy divergence or drought convergence",
    },
    {
        "parameter": "Temperature (°C)",
        "model_consumption": "Agronomic temperature window feasibility check (min_temperature <= T <= max_temperature)",
        "solver_effect": "Filters out warm-loving species in cool regimes (18°C) or cool-season rabi species in hot regimes (34°C)",
    },
    {
        "parameter": "Soil pH",
        "model_consumption": "Soil pH tolerance range feasibility check (min_ph <= pH <= max_ph)",
        "solver_effect": "Acidic soil (pH 4.8) eliminates non-acid-tolerant species, restricting the search space to acid-tolerant legumes/cereals",
    },
]


@dataclass(frozen=True)
class BenchmarkScenarioDefinition:
    scenario_id: str
    name: str
    description: str
    key_characteristics: str
    expected_behavior: str
    temperature_c: float
    soil_ph: float
    soil_texture: str
    organic_matter_pct: float
    rainfall_mm: float
    irrigation_capacity_mm: float
    available_water_mm: float
    field_size_ha: float
    previous_crop: Optional[str] = None


BENCHMARK_SCENARIOS: dict[str, BenchmarkScenarioDefinition] = {
    "A": BenchmarkScenarioDefinition(
        scenario_id="A",
        name="Profit-Dominant",
        description="Warm, well-irrigated alluvial parcel with neutral pH and high nutrient capacity.",
        key_characteristics="Water: 800 mm, Temp: 28°C, pH: 6.5",
        expected_behavior="Strong strategy divergence: Profit prioritizes high gross-margin cash crops (Tomato/Groundnut), Water prioritizes drought-resilient crops (Chickpea/Sesame), Soil prioritizes biological N-fixation.",
        temperature_c=28.0,
        soil_ph=6.5,
        soil_texture="loam",
        organic_matter_pct=2.4,
        rainfall_mm=500.0,
        irrigation_capacity_mm=300.0,
        available_water_mm=800.0,
        field_size_ha=3.0,
        previous_crop=None,
    ),
    "B": BenchmarkScenarioDefinition(
        scenario_id="B",
        name="Water-Constrained",
        description="Dryland or water-stressed parcel with minimal supplemental irrigation.",
        key_characteristics="Water: 320 mm, Temp: 30°C, pH: 6.8",
        expected_behavior="Constraint-driven convergence: High water-demand crops are eliminated by feasibility filters; all strategies converge on drought-tolerant crops (Sesame/Chickpea/Mungbean).",
        temperature_c=30.0,
        soil_ph=6.8,
        soil_texture="silty_loam",
        organic_matter_pct=1.5,
        rainfall_mm=220.0,
        irrigation_capacity_mm=100.0,
        available_water_mm=320.0,
        field_size_ha=2.0,
        previous_crop=None,
    ),
    "C": BenchmarkScenarioDefinition(
        scenario_id="C",
        name="Cool-Season Rabi",
        description="Temperate winter regime with cool mean temperatures suitable for rabi crops.",
        key_characteristics="Water: 600 mm, Temp: 18°C, pH: 6.5",
        expected_behavior="Climatic selectivity: Warm crops are eliminated; optimizer selects cool-tolerant crops, differentiating into Tomato/Lentil (Profit) and Chickpea/Sorghum (Water/Soil).",
        temperature_c=18.0,
        soil_ph=6.5,
        soil_texture="loam",
        organic_matter_pct=2.0,
        rainfall_mm=200.0,
        irrigation_capacity_mm=400.0,
        available_water_mm=600.0,
        field_size_ha=2.5,
        previous_crop=None,
    ),
    "D": BenchmarkScenarioDefinition(
        scenario_id="D",
        name="Hot-Season Kharif",
        description="High-temperature summer/pre-monsoon regime with elevated evapotranspiration.",
        key_characteristics="Water: 950 mm, Temp: 34°C, pH: 6.8",
        expected_behavior="Heat-stress filtering: Cool/temperate crops are infeasible; optimizer schedules heat-tolerant crops like Sesame, Soybean, Groundnut, and Mungbean.",
        temperature_c=34.0,
        soil_ph=6.8,
        soil_texture="clay_loam",
        organic_matter_pct=1.8,
        rainfall_mm=450.0,
        irrigation_capacity_mm=500.0,
        available_water_mm=950.0,
        field_size_ha=2.0,
        previous_crop=None,
    ),
    "E": BenchmarkScenarioDefinition(
        scenario_id="E",
        name="Acidic & Depleted",
        description="Low pH, nutrient-depleted acidic parcel (pH 4.8) requiring acid-tolerant crops and soil restoration.",
        key_characteristics="Water: 500 mm, Temp: 26°C, pH: 4.8",
        expected_behavior="pH restriction: Non-acid-tolerant crops are filtered out; optimizer pairs acid-tolerant legumes (Mungbean) with Sorghum or Groundnut to maintain family alternation.",
        temperature_c=26.0,
        soil_ph=4.8,
        soil_texture="silty_loam",
        organic_matter_pct=1.1,
        rainfall_mm=300.0,
        irrigation_capacity_mm=200.0,
        available_water_mm=500.0,
        field_size_ha=1.8,
        previous_crop=None,
    ),
    "F": BenchmarkScenarioDefinition(
        scenario_id="F",
        name="Balanced Diverse",
        description="Standard agro-ecological benchmark with moderate temperature, fertile soil, and steady water supply.",
        key_characteristics="Water: 700 mm, Temp: 25°C, pH: 6.5",
        expected_behavior="Multi-objective balance: Wide feasibility set allows all 4 strategies to exhibit trade-off sensitivity across Profit, Water conservation, and Soil biology.",
        temperature_c=25.0,
        soil_ph=6.5,
        soil_texture="loam",
        organic_matter_pct=2.2,
        rainfall_mm=450.0,
        irrigation_capacity_mm=250.0,
        available_water_mm=700.0,
        field_size_ha=2.5,
        previous_crop=None,
    ),
}


def get_benchmark_scenario_list() -> list[dict[str, Any]]:
    """Return public metadata for all 6 benchmark scenarios."""
    return [
        {
            "scenario_id": s.scenario_id,
            "name": s.name,
            "description": s.description,
            "key_characteristics": s.key_characteristics,
            "expected_behavior": s.expected_behavior,
            "temperature_c": s.temperature_c,
            "soil_ph": s.soil_ph,
            "soil_texture": s.soil_texture,
            "organic_matter_pct": s.organic_matter_pct,
            "available_water_mm": s.available_water_mm,
            "field_size_ha": s.field_size_ha,
            "canonical_crop_universe": CANONICAL_BENCHMARK_CROPS,
            "model_consumption": MODEL_CONSUMPTION_METADATA,
        }
        for s in BENCHMARK_SCENARIOS.values()
    ]


def _normalize_strategy_key(strat_key: Optional[str]) -> str:
    if not strat_key:
        return "profit_focused"
    key = str(strat_key).lower().strip().replace("-", "_")
    if "water" in key:
        return "water_focused"
    if "soil" in key:
        return "soil_focused"
    if "balance" in key:
        return "balanced"
    if "profit" in key:
        return "profit_focused"
    return key


def run_benchmark_scenario(
    scenario_id: str,
    strategy_id: Optional[str] = None,
    crops: Optional[pd.DataFrame] = None,
    priority_profiles: Optional[Mapping[str, Mapping[str, Any]]] = None,
    planning_periods: Optional[Sequence[str]] = None,
    state_overrides: Optional[Mapping[str, Any]] = None,
) -> dict[str, Any]:
    """Execute the full multi-objective MILP suite against a specific benchmark scenario."""
    scen_key = str(scenario_id).upper().strip()
    if scen_key not in BENCHMARK_SCENARIOS:
        raise ValueError(f"Unknown benchmark scenario: {scenario_id}. Choose from {list(BENCHMARK_SCENARIOS.keys())}.")
    
    scenario = BENCHMARK_SCENARIOS[scen_key]
    overridden_fields: set[str] = set()
    if state_overrides is not None:
        if not isinstance(state_overrides, Mapping):
            raise ValueError("state_overrides must be a mapping.")
        allowed_overrides = {
            "temperature_c",
            "soil_ph",
            "available_water_mm",
            "previous_crop",
        }
        unknown = set(state_overrides) - allowed_overrides
        if unknown:
            raise ValueError("Unsupported benchmark state overrides: " + ", ".join(sorted(unknown)))
        normalized_overrides = {}
        for key in ("temperature_c", "soil_ph", "available_water_mm"):
            if key in state_overrides and state_overrides[key] is not None:
                value = float(state_overrides[key])
                minimum, maximum = {
                    "temperature_c": (-10.0, 60.0),
                    "soil_ph": (0.0, 14.0),
                    "available_water_mm": (0.0, 100000.0),
                }[key]
                if not math.isfinite(value) or not minimum <= value <= maximum:
                    raise ValueError(f"{key} must be between {minimum:g} and {maximum:g}.")
                normalized_overrides[key] = value
        if "previous_crop" in state_overrides and state_overrides["previous_crop"] is not None:
            previous_crop = str(state_overrides["previous_crop"]).strip()
            if not previous_crop:
                raise ValueError("previous_crop must be non-empty when supplied.")
            normalized_overrides["previous_crop"] = previous_crop
        overridden_fields = set(normalized_overrides)
        scenario = replace(scenario, **normalized_overrides)
    temperature_source = (
        "sequential RL final-state override"
        if "temperature_c" in overridden_fields
        else "synthetic benchmark scenario"
    )
    available_water_source = (
        "sequential RL final-state override"
        if "available_water_mm" in overridden_fields
        else "benchmark_scenario_capacity"
    )

    # Load canonical crop catalog and filter strictly to the 8 canonical crops
    full_catalog = load_crop_knowledge() if crops is None else crops
    canonical_crops = full_catalog[full_catalog["crop"].isin(CANONICAL_BENCHMARK_CROPS)].copy().reset_index(drop=True)
    if canonical_crops.empty:
        canonical_crops = full_catalog.copy()
    if scenario.previous_crop and not full_catalog["crop"].str.casefold().eq(scenario.previous_crop.casefold()).any():
        raise ValueError("previous_crop must match a crop in the repository crop catalog.")

    profiles = DEFAULT_PRIORITY_PROFILES if priority_profiles is None else priority_profiles
    periods = list(planning_periods) if planning_periods is not None else [
        "Y1_S1", "Y1_S2", "Y2_S1", "Y2_S2", "Y3_S1", "Y3_S2"
    ]

    field_state = FieldState(
        field_id=f"benchmark_{scen_key.lower()}",
        as_of_date=pd.Timestamp("2026-06-01"),
        latitude=23.8103,
        longitude=90.4125,
        field_size_ha=scenario.field_size_ha,
        temperature=scenario.temperature_c,
        ph=scenario.soil_ph,
        soil_moisture=float("nan"),
        rainfall=scenario.rainfall_mm,
        organic_matter=scenario.organic_matter_pct,
        texture=scenario.soil_texture,
        previous_crop=scenario.previous_crop,
    )
    field_state.irrigation_capacity_mm = scenario.irrigation_capacity_mm
    field_state.soil_source = "benchmark_scenario"
    field_state.data_status["soil"] = "synthetic"
    field_state.data_status["environment"] = "synthetic"
    field_state.data_status["soil_moisture"] = "missing"

    features = {
        "available_water_mm": scenario.available_water_mm,
        "available_water_source": available_water_source,
        "organic_matter": scenario.organic_matter_pct,
    }

    # Evaluate crop temperature & pH feasibility across canonical 8 crops
    feasible_crop_names = []
    for _, row in canonical_crops.iterrows():
        c_name = str(row["crop"])
        min_t = float(row.get("min_temperature", -999))
        max_t = float(row.get("max_temperature", 999))
        min_ph = float(row.get("min_ph", 0))
        max_ph = float(row.get("max_ph", 14))

        # Check temperature & pH bounds
        temp_ok = min_t <= scenario.temperature_c <= max_t
        ph_ok = min_ph <= scenario.soil_ph <= max_ph
        if temp_ok and ph_ok:
            feasible_crop_names.append(c_name)

    result = generate_rotation_strategies(
        field_state=field_state,
        crops=canonical_crops,
        features=features,
        priority_profiles=profiles,
        planning_periods=periods,
    )

    # Selected strategy key
    target_strat_key = _normalize_strategy_key(strategy_id)
    strategies_dict = result.get("strategies", {})
    if target_strat_key not in strategies_dict:
        target_strat_key = "profit_focused"

    # Compute divergence metrics and strategy summaries
    rotations = {}
    distinct_rotations = set()
    strategy_metrics = {}
    for strat_name, strat_data in strategies_dict.items():
        rot = strat_data.get("selected_crop_by_period")
        rot_tuple = tuple(rot.items()) if rot else None
        rotations[strat_name] = rot
        if rot_tuple:
            distinct_rotations.add(rot_tuple)

        season_matrix = (
            strat_data.get("dynamic_agronomic_matrix", {}).get("crop_season_matrix")
            or {}
        )
        seasonal_metrics = [
            season_matrix.get(period, {}).get(crop, {})
            for period, crop in (rot or {}).items()
        ]
        yields = [item.get("dynamic_yield_t_ha") for item in seasonal_metrics]
        production_breakdown = [
            {
                "period": period,
                "crop": crop,
                "base_yield_t_ha": item.get("base_yield_t_ha"),
                "is_feasible": item.get("is_feasible"),
                "thermal_factor": item.get("thermal_factor"),
                "soil_factor": item.get("soil_factor"),
                "water_stress_factor": item.get("water_stress_factor"),
                "yield_t_ha": round(float(item["dynamic_yield_t_ha"]), 3)
                if item.get("dynamic_yield_t_ha") is not None else None,
                "field_area_ha": scenario.field_size_ha,
                "production_tons": round(
                    float(item["dynamic_yield_t_ha"]) * scenario.field_size_ha, 3
                ) if item.get("dynamic_yield_t_ha") is not None else None,
                "yield_source": "dynamic_agronomic_matrix",
            }
            for (period, crop), item in zip((rot or {}).items(), seasonal_metrics)
        ]
        water_demands = [
            item.get("water_balance", {}).get("crop_et_mm")
            for item in seasonal_metrics
        ]
        total_harvest = (
            round(sum(float(value) for value in yields) * scenario.field_size_ha, 2)
            if rot and len(yields) == len(rot) and all(value is not None for value in yields)
            else None
        )
        total_water_demand = (
            round(sum(float(value) for value in water_demands), 1)
            if rot and len(water_demands) == len(rot) and all(value is not None for value in water_demands)
            else None
        )
        
        profit_ha = strat_data.get("profit_component")
        water_score = strat_data.get("water_component")
        soil_score = strat_data.get("soil_component")
        score = strat_data.get("objective_value")
        
        strategy_metrics[strat_name] = {
            "field_size_ha": scenario.field_size_ha,
            "score": round(score, 3) if score is not None else None,
            "profit_bdt_ha": round(profit_ha, 2) if profit_ha is not None else None,
            "total_profit_bdt": round(profit_ha * scenario.field_size_ha, 2) if profit_ha is not None else None,
            "total_harvest_tons": total_harvest,
            "seasonal_production_breakdown": production_breakdown,
            "production_calculation": "sum(selected season dynamic_yield_t_ha × field_area_ha); one selected crop per planning period",
            "total_water_requirement_mm": total_water_demand,
            "water_score": round(water_score, 3) if water_score is not None else None,
            "soil_score": round(soil_score, 3) if soil_score is not None else None,
            "composite_score": round(score, 3) if score is not None else None,
            "rotation": rot,
            "solver_status": strat_data.get("solver_status") or "Not Available",
            "decision_explanation": strat_data.get("decision_explanation"),
        }

    selected_strat_data = strategies_dict.get(target_strat_key, {})
    selected_metrics = strategy_metrics.get(target_strat_key, {})

    is_converged = len(distinct_rotations) == 1
    divergence_type = "converged" if is_converged else ("partial_divergence" if len(distinct_rotations) == 2 else "strong_divergence")

    return {
        "status": "ok",
        "scenario": {
            "scenario_id": scenario.scenario_id,
            "name": scenario.name,
            "description": scenario.description,
            "key_characteristics": scenario.key_characteristics,
            "expected_behavior": scenario.expected_behavior,
            "temperature_c": scenario.temperature_c,
            "soil_ph": scenario.soil_ph,
            "soil_texture": scenario.soil_texture,
            "organic_matter_pct": scenario.organic_matter_pct,
            "organic_matter_source": "synthetic benchmark scenario",
            "available_water_mm": scenario.available_water_mm,
            "field_size_ha": scenario.field_size_ha,
            "irrigation_capacity_mm": scenario.irrigation_capacity_mm,
            "previous_crop": scenario.previous_crop,
            "soil_moisture": field_state.soil_moisture,
            "soil_health_score_proxy": max(20.0, min(85.0, 30.0 + scenario.organic_matter_pct * 15.0)),
            "soil_health_score_source": "synthetic proxy derived from benchmark organic matter",
            "environment_source": temperature_source,
            "soil_ph_source": "synthetic benchmark scenario",
            "soil_moisture_source": "unavailable",
        },
        "inputs": {
            "available_water_mm": scenario.available_water_mm,
            "temperature_c": scenario.temperature_c,
            "soil_ph": scenario.soil_ph,
            "organic_matter_pct": scenario.organic_matter_pct,
            "organic_matter_source": "synthetic benchmark scenario",
            "field_size_ha": scenario.field_size_ha,
            "irrigation_capacity_mm": scenario.irrigation_capacity_mm,
            "previous_crop": scenario.previous_crop,
            "soil_moisture": field_state.soil_moisture,
            "temperature_source": temperature_source,
            "soil_ph_source": "synthetic benchmark scenario",
            "soil_moisture_source": "unavailable",
            "soil_health_score_proxy": max(20.0, min(85.0, 30.0 + scenario.organic_matter_pct * 15.0)),
            "soil_health_score_source": "synthetic proxy derived from benchmark organic matter",
            "available_water_source": available_water_source,
        },
        "model_consumption": MODEL_CONSUMPTION_METADATA,
        "benchmark_strategy": target_strat_key,
        "solver_status": selected_metrics.get("solver_status") or "Not Available",
        "objective_score": selected_metrics.get("score"),
        "gross_margin": selected_metrics.get("total_profit_bdt"),
        "gross_margin_ha": selected_metrics.get("profit_bdt_ha"),
        "water_score": selected_metrics.get("water_score"),
        "soil_health_score": selected_metrics.get("soil_score"),
        "composite_score": selected_metrics.get("composite_score"),
        "rotation": selected_metrics.get("rotation") or {},
        "feasible_crops": feasible_crop_names,
        "feasible_count": len(feasible_crop_names),
        "total_crop_universe_count": len(CANONICAL_BENCHMARK_CROPS),
        "canonical_crop_universe": CANONICAL_BENCHMARK_CROPS,
        "divergence_analysis": {
            "distinct_rotation_count": len(distinct_rotations),
            "unique_rotations_count": len(distinct_rotations),
            "has_divergence": not is_converged,
            "divergence_type": divergence_type,
            "is_converged": is_converged,
            "explanation": (
                "All strategies converged on the same optimal sequence because tight agro-climatic constraints bound available options."
                if is_converged else
                f"Strategies produced {len(distinct_rotations)} distinct rotation trajectories reflecting trade-offs among Profit, Water, and Soil priorities."
            ),
        },
        "strategy_metrics": strategy_metrics,
        "strategies": result.get("strategies"),
        "comparison": result.get("comparison"),
    }


def run_all_benchmark_scenarios(
    strategy_id: Optional[str] = None,
    crops: Optional[pd.DataFrame] = None,
) -> dict[str, Any]:
    """Execute all 6 benchmark scenarios and return complete comparative results."""
    return {
        scenario_id: run_benchmark_scenario(scenario_id, strategy_id=strategy_id, crops=crops)
        for scenario_id in BENCHMARK_SCENARIOS
    }
