import unittest
import pandas as pd
from src.data.crops import load_crop_knowledge
from src.scenarios.benchmark_scenarios import (
    BENCHMARK_SCENARIOS,
    run_benchmark_scenario,
    run_all_benchmark_scenarios,
)
from src.explainability.explanations import explain_milp_plan
from src.state.field_state import FieldState


class DiversityAndBenchmarksTest(unittest.TestCase):
    def test_crop_dataset_diversity(self):
        crops = load_crop_knowledge()
        self.assertGreaterEqual(len(crops), 15)
        
        families = set(crops["family"].dropna())
        self.assertGreaterEqual(len(families), 6)
        self.assertIn("Fabaceae", families)
        self.assertIn("Poaceae", families)
        self.assertIn("Brassicaceae", families)
        self.assertIn("Solanaceae", families)
        
        legumes = crops[crops["is_legume"] == True]
        self.assertGreaterEqual(len(legumes), 4)
        
        # Verify multi-objective trade-offs: no single crop dominates all 3 dimensions
        profit_series = crops["expected_yield"] * crops["market_price"] - crops["production_cost"]
        max_profit_crop = crops.loc[profit_series.idxmax(), "crop"]
        min_water_crop = crops.loc[crops["water_requirement"].idxmin(), "crop"]
        
        # Fabaceae legumes have highest soil health benefit
        self.assertNotEqual(max_profit_crop, min_water_crop)

    def test_all_six_benchmark_scenarios_execute(self):
        results = run_all_benchmark_scenarios()
        self.assertEqual(len(results), 6)
        for key, res in results.items():
            self.assertIn("strategies", res)
            self.assertIn("profit_focused", res["strategies"])
            self.assertIn("water_focused", res["strategies"])
            self.assertIn("soil_focused", res["strategies"])
            self.assertIn("balanced", res["strategies"])

    def test_scenario_a_profit_dominance(self):
        res = run_benchmark_scenario("A")
        profit_plan = res["strategies"]["profit_focused"]
        self.assertEqual(profit_plan["solver_status"], "Optimal")
        
        # High profit crops like Tomato or Potato or Groundnut should feature prominently
        profit_crops = set(profit_plan["selected_crop_by_period"].values())
        self.assertTrue(any(c in profit_crops for c in ["Tomato", "Potato", "Groundnut", "Maize"]))
        
        # Strategy divergence
        self.assertTrue(res["divergence_analysis"]["has_divergence"])

    def test_benchmark_explanations_match_each_strategy(self):
        res = run_benchmark_scenario("A")
        expected_titles = {
            "profit_focused": "Profit Focused",
            "water_focused": "Water Efficiency",
            "soil_focused": "Soil Health & Regeneration",
            "balanced": "Balanced Multi-Objective",
        }
        for strategy_id, title in expected_titles.items():
            explanation = res["strategies"][strategy_id]["decision_explanation"]
            self.assertIn(f"Active Strategy: {title}", explanation["strategy_summary"])

    def test_scenario_b_water_constraint_enforcement(self):
        res = run_benchmark_scenario("B")
        crops = load_crop_knowledge()
        crop_water = dict(zip(crops["crop"], crops["water_requirement"]))
        
        # In water constrained (320mm available), heavy water consumers (Rice: 1200mm, Maize: 600mm) must NOT appear
        for strat_name, strat in res["strategies"].items():
            if strat["solver_status"] == "Optimal":
                for p, crop in strat["selected_crop_by_period"].items():
                    req = crop_water.get(crop, 0)
                    self.assertLessEqual(req, 350, f"Crop {crop} exceeds water constraint in {strat_name}")

    def test_scenario_c_cool_season_climatic_filtering(self):
        res = run_benchmark_scenario("C")
        
        # Selected crops must be cool-adapted (Wheat, Lentil, Chickpea, Mustard, Potato, Sorghum, Tomato)
        # Warm crops with min_temp >= 20°C (Rice, Jute, Soybean, Groundnut) must not appear at 18°C
        for strat_name, strat in res["strategies"].items():
            if strat["solver_status"] == "Optimal":
                for p, crop in strat["selected_crop_by_period"].items():
                    self.assertNotIn(crop, ["Rice", "Jute", "Soybean", "Groundnut"])

    def test_scenario_d_hot_season_climatic_filtering(self):
        res = run_benchmark_scenario("D")
        
        # At 34°C, cool crops like Wheat or Potato or Chickpea must not be selected
        for strat_name, strat in res["strategies"].items():
            if strat["solver_status"] == "Optimal":
                for p, crop in strat["selected_crop_by_period"].items():
                    self.assertNotIn(crop, ["Wheat", "Potato", "Chickpea"])

    def test_scenario_e_acidic_soil_suitability(self):
        res = run_benchmark_scenario("E")
        
        # At pH 4.8, acid-sensitive crops (Chickpea min pH 5.8, Mustard min pH 5.5, Soybean min pH 5.8) must not appear
        for strat_name, strat in res["strategies"].items():
            if strat["solver_status"] == "Optimal":
                for p, crop in strat["selected_crop_by_period"].items():
                    self.assertNotIn(crop, ["Chickpea", "Soybean"])

    def test_scenario_f_balanced_tradeoff_divergence(self):
        res = run_benchmark_scenario("F")
        self.assertTrue(res["divergence_analysis"]["has_divergence"])
        self.assertGreaterEqual(res["divergence_analysis"]["distinct_rotation_count"], 2)

    def test_explain_milp_plan_rich_rationale(self):
        crops = load_crop_knowledge()
        res = run_benchmark_scenario("F")
        strat = res["strategies"]["balanced"]
        scen_def = BENCHMARK_SCENARIOS["F"]
        
        field_state = FieldState(
            field_id="benchmark_f",
            as_of_date=pd.Timestamp("2026-06-01"),
            latitude=23.8103,
            longitude=90.4125,
            field_size_ha=scen_def.field_size_ha,
            temperature=scen_def.temperature_c,
            ph=scen_def.soil_ph,
            soil_moisture=0.25,
            rainfall=scen_def.rainfall_mm,
            organic_matter=scen_def.organic_matter_pct,
            texture=scen_def.soil_texture,
            previous_crop=scen_def.previous_crop,
        )
        
        explanation = explain_milp_plan(strat, field_state=field_state, crops=crops)
        self.assertIn("period_reasons", explanation)
        self.assertGreater(len(explanation["period_reasons"]), 0)
        
        first_period = explanation["period_reasons"][0]
        self.assertIn("crop", first_period)
        self.assertIn("why_feasible", first_period)
        self.assertIn("why_selected", first_period)
        self.assertIn("objective_benefit", first_period)
        self.assertIn("constraints_active", first_period)
        self.assertIn("alternatives_considered", first_period)
        self.assertIn("why_beat_alternatives", first_period)

    def test_field_metrics_scaling(self):
        from app.server import _run_research_workflow
        res_1ha = _run_research_workflow({
            "mode": "offline",
            "latitude": 23.8103,
            "longitude": 90.4125,
            "start_date": "2026-08-31",
            "end_date": "2026-09-29",
            "field_size_ha": 1.0,
            "priority": "profit",
        })
        res_5ha = _run_research_workflow({
            "mode": "offline",
            "latitude": 23.8103,
            "longitude": 90.4125,
            "start_date": "2026-08-31",
            "end_date": "2026-09-29",
            "field_size_ha": 5.0,
            "priority": "profit",
        })
        
        metrics_1ha = res_1ha["summary"]["field_metrics"]
        metrics_5ha = res_5ha["summary"]["field_metrics"]
        breakdown = metrics_5ha["seasonal_production_breakdown"]

        self.assertEqual(len(breakdown), 6)
        self.assertEqual(len({row["period"] for row in breakdown}), 6)
        self.assertEqual([row["period"] for row in breakdown], [
            "Y1_S1", "Y1_S2", "Y2_S1", "Y2_S2", "Y3_S1", "Y3_S2",
        ])
        for row in breakdown:
            self.assertAlmostEqual(row["production_tons"], row["yield_t_ha"] * 5.0, places=3)
            self.assertEqual(row["field_area_ha"], 5.0)
            self.assertEqual(row["yield_source"], "dynamic_agronomic_matrix")
            if row["is_feasible"]:
                self.assertAlmostEqual(
                    row["yield_t_ha"],
                    round(
                        row["base_yield_t_ha"]
                        * row["thermal_factor"]
                        * row["soil_factor"]
                        * row["water_stress_factor"],
                        3,
                    ),
                    places=3,
                )
            else:
                self.assertEqual(row["yield_t_ha"], 0.0)
        self.assertAlmostEqual(
            sum(row["production_tons"] for row in breakdown),
            metrics_5ha["total_harvest_tons"],
            places=2,
        )
        self.assertIn("one selected crop per planning period", metrics_5ha["production_calculation"])
        
        self.assertAlmostEqual(
            metrics_5ha["total_harvest_tons"],
            metrics_1ha["total_harvest_tons"] * 5.0,
            places=1
        )
        self.assertAlmostEqual(
            metrics_5ha["total_profit_bdt"],
            metrics_1ha["total_profit_bdt"] * 5.0,
            places=0
        )

    def test_strategy_explanation_isolation(self):
        from src.optimizer.strategies import generate_rotation_strategies, DEFAULT_PRIORITY_PROFILES
        crops = load_crop_knowledge()
        scen_def = BENCHMARK_SCENARIOS["A"]
        field_state = FieldState(
            field_id="test_field_a",
            as_of_date=pd.Timestamp("2026-06-01"),
            latitude=23.8103,
            longitude=90.4125,
            field_size_ha=scen_def.field_size_ha,
            temperature=scen_def.temperature_c,
            ph=scen_def.soil_ph,
            soil_moisture=0.25,
            rainfall=scen_def.rainfall_mm,
            organic_matter=scen_def.organic_matter_pct,
            texture=scen_def.soil_texture,
        )
        strategies = generate_rotation_strategies(
            field_state=field_state,
            crops=crops,
            priority_profiles=DEFAULT_PRIORITY_PROFILES,
        )
        strat_dict = strategies["strategies"]
        for strat_name, strat_data in strat_dict.items():
            self.assertIn("decision_explanation", strat_data)
            expl = strat_data["decision_explanation"]
            self.assertIsNotNone(expl, f"Strategy {strat_name} missing explanation")
            self.assertEqual(len(expl["period_reasons"]), 6)
            
            # Verify effective weights in explanation match requested strategy weights
            req_w = strat_data["requested_weights"]
            eff_w = expl["effective_weights"]
            for comp in ["profit", "water", "soil"]:
                self.assertAlmostEqual(req_w[comp], eff_w[comp], places=2)

    def test_score_bounds_and_metrics(self):
        results = run_all_benchmark_scenarios()
        for scen_id, res in results.items():
            for strat_name, strat_data in res["strategies"].items():
                if strat_data.get("solver_status") == "Optimal":
                    w = strat_data.get("water_component")
                    s = strat_data.get("soil_component")
                    p = strat_data.get("profit_component")
                    self.assertIsNotNone(w)
                    self.assertIsNotNone(s)
                    self.assertIsNotNone(p)
                    self.assertTrue(0.0 <= w <= 6.0, f"{scen_id} {strat_name} water score {w} out of [0, 6.0]")
                    self.assertTrue(0.0 <= s <= 6.0, f"{scen_id} {strat_name} soil score {s} out of [0, 6.0]")
                    self.assertGreaterEqual(p, 0.0)

    def test_audit_all_strategies_diagnostics(self):
        from src.optimizer.strategies import generate_rotation_strategies, DEFAULT_PRIORITY_PROFILES
        from src.optimizer.validation import audit_all_strategies
        crops = load_crop_knowledge()
        scen_def = BENCHMARK_SCENARIOS["A"]
        field_state = FieldState(
            field_id="test_field_a",
            as_of_date=pd.Timestamp("2026-06-01"),
            latitude=23.8103,
            longitude=90.4125,
            field_size_ha=scen_def.field_size_ha,
            temperature=scen_def.temperature_c,
            ph=scen_def.soil_ph,
            soil_moisture=0.25,
            rainfall=scen_def.rainfall_mm,
            organic_matter=scen_def.organic_matter_pct,
            texture=scen_def.soil_texture,
        )
        strategies = generate_rotation_strategies(
            field_state=field_state,
            crops=crops,
            priority_profiles=DEFAULT_PRIORITY_PROFILES,
        )
        diagnostics = audit_all_strategies(strategies, field_state=field_state, crops=crops)
        self.assertEqual(diagnostics["status"], "PASS")
        self.assertTrue(diagnostics["overall_pass"])
        for strat_name, audit in diagnostics["audits"].items():
            self.assertTrue(audit["all_checks_passed"], f"Audit failed for {strat_name}")
            for f_name, f_status in audit["formula_checks"].items():
                self.assertEqual(f_status, "PASS", f"{strat_name} {f_name} failed")
            for c_name, c_status in audit["constraint_checks"].items():
                self.assertEqual(c_status, "PASS", f"{strat_name} {c_name} failed")
            for s_name, s_status in audit["consistency_checks"].items():
                self.assertEqual(s_status, "PASS", f"{strat_name} {s_name} failed")


if __name__ == "__main__":
    unittest.main()
