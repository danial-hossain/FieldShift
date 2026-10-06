import requests

BASE_URL = 'http://localhost:8000/api/workflow'

baseline = {
    'latitude': '23.8029',
    'longitude': '90.3685',
    'start_date': '2026-08-31',
    'end_date': '2026-09-29',
    'mode': 'live',
    'soil_texture': 'loam',
    'organic_matter': '2.5',
    'irrigation_capacity_mm': '90',
    'previous_crop': 'Maize',
    'previous_crop_year': '2024',
    'field_size_ha': 10.0
}

def run_test(name, override):
    payload = dict(baseline)
    payload.update(override)
    res = requests.post(BASE_URL, json=payload).json()
    summary = res.get('summary', {})
    ml = summary.get('ml', {})
    planning = summary.get('planning', {})
    milp = planning.get('milp_status', {})
    rl = summary.get('rl', {})
    field_state = summary.get('field_state', {})
    rotation = milp.get('selected_crop_by_period', {})
    
    return {
        'name': name,
        'field_size_ha': field_state.get('field_size_ha'),
        'organic_matter': field_state.get('organic_matter_percent'),
        'soil_texture': field_state.get('soil_texture'),
        'irrigation_cap': field_state.get('irrigation_capacity_mm'),
        'ml_yield_t_ha': round(ml.get('prediction_t_ha', 0.0), 4),
        'ml_range': f"{round(ml.get('uncertainty', {}).get('lower', 0.0), 2)} — {round(ml.get('uncertainty', {}).get('upper', 0.0), 2)}",
        'milp_obj': round(milp.get('objective_value', 0.0), 4),
        'milp_profit': milp.get('profit_component'),
        'milp_water': round(milp.get('water_component', 0.0), 2),
        'milp_soil': round(milp.get('soil_component', 0.0), 2),
        'rotation_y1_s1': rotation.get('Y1_S1'),
        'rotation_y1_s2': rotation.get('Y1_S2'),
        'rl_action': rl.get('proposal_action', {}).get('action') if isinstance(rl.get('proposal_action'), dict) else str(rl.get('proposal_action'))
    }

print("Running Controlled Tests...")
results = []
results.append(run_test("Baseline (10ha, loam, OM 2.5%, irrig 90, Maize)", {}))
results.append(run_test("Test A: Area (10ha -> 20ha)", {'field_size_ha': 20.0}))
results.append(run_test("Test B: Soil Texture (loam -> clay_loam)", {'soil_texture': 'clay_loam'}))
results.append(run_test("Test C: Organic Matter (2.5% -> 5.0%)", {'organic_matter': '5.0'}))
results.append(run_test("Test D: Irrigation (90mm -> 150mm)", {'irrigation_capacity_mm': '150'}))
results.append(run_test("Test E: Previous Crop (Maize -> Mungbean)", {'previous_crop': 'Mungbean'}))
results.append(run_test("Test F: Location (Mirpur -> Barisal)", {'latitude': '22.7010', 'longitude': '90.3535'}))

print("\n=== CONTROLLED TEST RESULTS TABLE ===")
headers = ['Test Name', 'ML Yield', 'ML Range', 'MILP Obj', 'Profit (BDT)', 'Water', 'Soil', 'Y1_S1', 'Y1_S2', 'RL Action']
row_format = "{:<35} | {:<8} | {:<12} | {:<8} | {:<12} | {:<6} | {:<6} | {:<8} | {:<8} | {:<10}"
print(row_format.format(*headers))
print("-" * 135)
for r in results:
    print(row_format.format(
        r['name'],
        r['ml_yield_t_ha'],
        r['ml_range'],
        r['milp_obj'],
        str(r['milp_profit']),
        r['milp_water'],
        r['milp_soil'],
        str(r['rotation_y1_s1']),
        str(r['rotation_y1_s2']),
        str(r['rl_action'])
    ))
