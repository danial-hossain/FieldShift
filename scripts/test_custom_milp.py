import os
os.environ["OFFLINE"] = "1"
import pandas as pd
from src.state.field_state import build_field_state
from src.data.crops import load_crop_knowledge
from src.compute.advisory_service import load_district_climate_data
from src.optimizer.dynamic_agronomy import build_dynamic_crop_season_matrix
from src.optimizer.milp import optimize_rotation
import pulp

crops_df = load_crop_knowledge()
power, _ = load_district_climate_data("chapainawabganj", offline=True)
if "date" in power.columns:
    power["date"] = pd.to_datetime(power["date"])

state = build_field_state(
    "rahim_field",
    24.62,
    88.55,
    power["date"].max(),
    power.tail(60),
    crop_knowledge=crops_df,
)
state.field_size_ha = 0.67
state.area_ha = 0.67
state.texture = "clay_loam"
state.district = "chapainawabganj"
state.seasonally_flooded = False

# Calibrate Rice expected_yield * 0.5 and price = 500 / 0.03732
rice_m = crops_df["crop"].str.casefold() == "rice"
crops_df.loc[rice_m, "expected_yield"] = crops_df.loc[rice_m, "expected_yield"] * 0.5
crops_df.loc[rice_m, "market_price"] = 500.0 / 0.03732

# Let's inspect the candidate cereals in Year 2:
# If Aus Rice or Wheat or Maize is chosen for cereal:
# Let's see what happens if bare_penalty is 0.15 and Rice has negative score when margin < 0
from src.optimizer.milp import _period_list, _crop_frame, _history_frame, FarmerPriorityWeights, _evaluate_rules, _objective_data, _previous_crop_family, _compatible_pair, _period_season, HAOR_DISTRICTS

def test_custom_milp(bare_pen=0.15, allow_k2_fallow=True):
    crop_frame = _crop_frame(crops_df)
    periods = ["Y1_S1", "Y1_S2", "Y1_S3", "Y2_S1", "Y2_S2", "Y2_S3"]
    fixed_crops_by_period = {"Y1_S1": "Mustard", "Y1_S2": "Mungbean", "Y1_S3": "Rice"}
    
    dynamic_data = build_dynamic_crop_season_matrix(
        field_state=state,
        crops=crop_frame,
        environmental_history=power,
        planning_periods=periods,
    )
    dyn_matrix = dynamic_data["crop_season_matrix"]
    candidate_names = list(crop_frame["crop"])
    
    problem = pulp.LpProblem("test", pulp.LpMaximize)
    variables = pulp.LpVariable.dicts("crop", ((c, p) for c in candidate_names for p in periods), cat=pulp.LpBinary)
    
    for p in periods:
        problem += pulp.lpSum(variables[(c, p)] for c in candidate_names) == 1
    for p, c in fixed_crops_by_period.items():
        problem += variables[(c, p)] == 1
        
    # Season suitability
    for p_idx, p in enumerate(periods):
        p_season = _period_season(p, p_idx)
        for c in candidate_names:
            c_row = crop_frame.loc[crop_frame["crop"] == c].iloc[0]
            allowed = [s.strip() for s in str(c_row.get("allowed_seasons", "")).lower().split("|")]
            if not (p_season in allowed or ("kharif" in allowed and p_season in ("kharif1", "kharif2"))):
                if p not in fixed_crops_by_period:
                    problem += variables[(c, p)] == 0
                    
    # Legume interval
    legumes = [r["crop"] for _, r in crop_frame.iterrows() if bool(r["is_legume"])]
    for start in range(len(periods) - 2):
        win = periods[start : start + 3]
        problem += pulp.lpSum(variables[(c, p)] for c in legumes for p in win) >= 1
        
    # Family transition
    for p1, p2 in zip(periods, periods[1:]):
        if p1 in fixed_crops_by_period and p2 in fixed_crops_by_period:
            continue
        for c1 in candidate_names:
            f1 = str(crop_frame.loc[crop_frame["crop"] == c1, "family"].iloc[0])
            for c2 in candidate_names:
                f2 = str(crop_frame.loc[crop_frame["crop"] == c2, "family"].iloc[0])
                if f1 != "None" and f1 == f2:
                    problem += variables[(c1, p1)] + variables[(c2, p2)] <= 1
                    
    # Cereals per year
    cereal_names = [c for c in candidate_names if any(k in c.lower() for k in ["rice", "wheat", "maize", "sorghum"])]
    for y in range(2):
        y_periods = periods[y * 3 : (y + 1) * 3]
        problem += pulp.lpSum(variables[(c, p)] for c in cereal_names for p in y_periods) >= 1
        
    if not allow_k2_fallow:
        for p_idx, p in enumerate(periods):
            if _period_season(p, p_idx) == "kharif2" and p not in fixed_crops_by_period:
                problem += variables[("Fallow", p)] == 0
                
    # Objective
    terms = []
    max_m = dynamic_data["profit_bounds"]["max_bdt_ha"]
    for c in candidate_names:
        is_fal = (c.lower() == "fallow")
        for p_idx, p in enumerate(periods):
            if is_fal:
                coef = -bare_pen
            else:
                m = dyn_matrix[p][c]["dynamic_gross_margin_bdt_ha"]
                # If margin is negative, profit score is negative!
                norm_p = (m / max_m) if m < 0 else dyn_matrix[p][c]["normalized_profit_score"]
                coef = 0.34 * norm_p + 0.33 * dyn_matrix[p][c]["normalized_water_score"] + 0.33 * dyn_matrix[p][c]["normalized_soil_score"]
            terms.append(coef * variables[(c, p)])
    problem += pulp.lpSum(terms)
    
    problem.solve(pulp.PULP_CBC_CMD(msg=0))
    res = {}
    for p in periods:
        for c in candidate_names:
            if pulp.value(variables[(c, p)]) == 1:
                res[p] = c
    return res

print("bare_pen=0.15, allow_k2=True ->", test_custom_milp(0.15, True))
print("bare_pen=0.20, allow_k2=True ->", test_custom_milp(0.20, True))
print("bare_pen=0.30, allow_k2=True ->", test_custom_milp(0.30, True))

