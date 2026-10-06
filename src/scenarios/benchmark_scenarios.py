"""Synthetic Benchmark Scenario Suite for FieldShift.

Defines internally consistent, scientifically grounded synthetic scenarios
(A through F) designed to evaluate and demonstrate MILP optimizer behavior,
objective trade-offs, and explainable strategy divergence/convergence.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping, Optional, Sequence
import pandas as pd

from src.data.crops import load_crop_knowledge
from src.optimizer.strategies import DEFAULT_PRIORITY_PROFILES, generate_rotation_strategies
from src.state.field_state import FieldState


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
        name="Profit-Dominant Fertile Loam",
        description="Warm, well-irrigated alluvial parcel with neutral pH and high nutrient capacity.",
        key_characteristics="Temperature: 26°C, pH: 6.5, Water: 800mm (ample irrigation), Area: 3.0 ha",
        expected_behavior="Strong strategy divergence: Profit prioritizes high gross-margin cash crops (Tomato/Groundnut), Water prioritizes drought-resilient crops (Chickpea/Sesame), Soil prioritizes biological N-fixation.",
        temperature_c=26.0,
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
        name="Water-Constrained Arid Field",
        description="Dryland or water-stressed parcel with minimal supplemental irrigation.",
        key_characteristics="Temperature: 30°C, pH: 6.8, Water: 320mm (low water availability), Area: 2.0 ha",
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
        name="Cool-Season (Rabi) Field",
        description="Temperate winter regime with cool mean temperatures suitable for rabi crops.",
        key_characteristics="Temperature: 18°C, pH: 6.5, Water: 600mm, Area: 2.5 ha",
        expected_behavior="Climatic selectivity: Warm crops are eliminated; optimizer selects cool-tolerant crops, differentiating into Potato (Profit), Sorghum (Water), and Mustard (Soil).",
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
        name="Hot-Season High-Heat Field",
        description="High-temperature summer/pre-monsoon regime with elevated evapotranspiration.",
        key_characteristics="Temperature: 35°C, pH: 6.8, Water: 700mm, Area: 2.0 ha",
        expected_behavior="Heat-stress filtering: Cool/temperate crops are infeasible; optimizer schedules heat-tolerant crops like Sesame, Soybean, and Mungbean.",
        temperature_c=35.0,
        soil_ph=6.8,
        soil_texture="clay_loam",
        organic_matter_pct=1.8,
        rainfall_mm=450.0,
        irrigation_capacity_mm=250.0,
        available_water_mm=700.0,
        field_size_ha=2.0,
        previous_crop=None,
    ),
    "E": BenchmarkScenarioDefinition(
        scenario_id="E",
        name="Acidic / Soil-Depleted Field",
        description="Low pH, nutrient-depleted acidic parcel (pH 5.2) requiring acid-tolerant crops and soil restoration.",
        key_characteristics="Temperature: 26°C, pH: 5.2, Water: 600mm, Area: 1.8 ha",
        expected_behavior="pH restriction: Non-acid-tolerant crops are filtered out; optimizer pairs acid-tolerant legumes (Groundnut/Mungbean) with Sorghum or Rice to maintain family alternation.",
        temperature_c=26.0,
        soil_ph=5.2,
        soil_texture="silty_loam",
        organic_matter_pct=1.1,
        rainfall_mm=400.0,
        irrigation_capacity_mm=200.0,
        available_water_mm=600.0,
        field_size_ha=1.8,
        previous_crop=None,
    ),
    "F": BenchmarkScenarioDefinition(
        scenario_id="F",
        name="Balanced Moderate Field",
        description="Standard agro-ecological benchmark with moderate temperature, fertile soil, and steady water supply.",
        key_characteristics="Temperature: 24°C, pH: 6.6, Water: 600mm, Area: 2.5 ha",
        expected_behavior="Multi-objective balance: Wide feasibility set allows all 4 strategies to exhibit trade-off sensitivity across Profit, Water conservation, and Soil biology.",
        temperature_c=24.0,
        soil_ph=6.6,
        soil_texture="loam",
        organic_matter_pct=2.2,
        rainfall_mm=350.0,
        irrigation_capacity_mm=250.0,
        available_water_mm=600.0,
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
        }
        for s in BENCHMARK_SCENARIOS.values()
    ]


def run_benchmark_scenario(
    scenario_id: str,
    crops: Optional[pd.DataFrame] = None,
    priority_profiles: Optional[Mapping[str, Mapping[str, Any]]] = None,
    planning_periods: Optional[Sequence[str]] = None,
) -> dict[str, Any]:
    """Execute the full multi-objective MILP suite against a specific benchmark scenario."""
    if scenario_id not in BENCHMARK_SCENARIOS:
        raise ValueError(f"Unknown benchmark scenario: {scenario_id}. Choose from {list(BENCHMARK_SCENARIOS.keys())}.")
    
    scenario = BENCHMARK_SCENARIOS[scenario_id]
    crop_catalog = load_crop_knowledge() if crops is None else crops
    profiles = DEFAULT_PRIORITY_PROFILES if priority_profiles is None else priority_profiles
    periods = list(planning_periods) if planning_periods is not None else [
        "Y1_S1", "Y1_S2", "Y2_S1", "Y2_S2", "Y3_S1", "Y3_S2"
    ]

    field_state = FieldState(
        field_id=f"benchmark_{scenario_id.lower()}",
        as_of_date=pd.Timestamp("2026-06-01"),
        latitude=23.8103,
        longitude=90.4125,
        field_size_ha=scenario.field_size_ha,
        temperature=scenario.temperature_c,
        ph=scenario.soil_ph,
        soil_moisture=0.25,
        rainfall=scenario.rainfall_mm,
        organic_matter=scenario.organic_matter_pct,
        texture=scenario.soil_texture,
        previous_crop=scenario.previous_crop,
    )
    field_state.irrigation_capacity_mm = scenario.irrigation_capacity_mm
    field_state.soil_source = "benchmark_scenario"
    field_state.data_status["soil"] = "synthetic"
    field_state.data_status["environment"] = "synthetic"

    features = {
        "available_water_mm": scenario.available_water_mm,
        "available_water_source": "benchmark_scenario_capacity",
        "organic_matter": scenario.organic_matter_pct,
    }

    result = generate_rotation_strategies(
        field_state=field_state,
        crops=crop_catalog,
        features=features,
        priority_profiles=profiles,
        planning_periods=periods,
    )

    # Compute divergence metrics
    rotations = {}
    distinct_rotations = set()
    strategy_metrics = {}
    for strat_name, strat_data in result.get("strategies", {}).items():
        rot = strat_data.get("selected_crop_by_period")
        rot_tuple = tuple(rot.items()) if rot else None
        rotations[strat_name] = rot
        if rot_tuple:
            distinct_rotations.add(rot_tuple)
        
        profit_ha = strat_data.get("profit_component")
        water_score = strat_data.get("water_component")
        soil_score = strat_data.get("soil_component")
        score = strat_data.get("objective_value")
        
        strategy_metrics[strat_name] = {
            "score": score,
            "profit_bdt_ha": profit_ha,
            "total_profit_bdt": profit_ha * scenario.field_size_ha if profit_ha is not None else None,
            "annual_profit_bdt": (profit_ha * scenario.field_size_ha / (len(periods) / 2)) if profit_ha is not None else None,
            "water_score": water_score,
            "soil_score": soil_score,
            "rotation": rot,
            "solver_status": strat_data.get("solver_status"),
            "decision_explanation": strat_data.get("decision_explanation"),
        }

    is_converged = len(distinct_rotations) == 1
    divergence_type = "converged" if is_converged else ("partial_divergence" if len(distinct_rotations) == 2 else "strong_divergence")

    return {
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
            "available_water_mm": scenario.available_water_mm,
            "field_size_ha": scenario.field_size_ha,
        },
        "divergence_analysis": {
            "distinct_rotation_count": len(distinct_rotations),
            "unique_rotations_count": len(distinct_rotations),
            "has_divergence": not is_converged,
            "divergence_type": divergence_type,
            "is_converged": is_converged,
            "explanation": (
                "All strategies converged on the same optimal sequence because constraints bound available options."
                if is_converged else
                f"Strategies produced {len(distinct_rotations)} distinct rotation trajectories reflecting trade-offs among Profit, Water, and Soil priorities."
            ),
        },
        "strategy_metrics": strategy_metrics,
        "strategies": result.get("strategies"),
        "comparison": result.get("comparison"),
    }


def run_all_benchmark_scenarios(
    crops: Optional[pd.DataFrame] = None,
) -> dict[str, Any]:
    """Execute all 6 benchmark scenarios and return complete comparative results."""
    return {
        scenario_id: run_benchmark_scenario(scenario_id, crops=crops)
        for scenario_id in BENCHMARK_SCENARIOS
    }
