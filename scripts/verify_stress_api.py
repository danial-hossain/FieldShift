import requests
import json

s = requests.Session()
login_res = s.post('http://127.0.0.1:8000/api/auth/login', json={'email': 'evaluator@fieldshift.local', 'password': 'EvaluationPass2026!'})

# Get Rahim field
fields_res = s.get('http://127.0.0.1:8000/api/fields').json()
rahim_f = next(f for f in fields_res['fields'] if 'রহিম' in f['name'] or f['id'] == 251)
print(f"Rahim field: id={rahim_f['id']}, district={rahim_f['district']}, area_ha={rahim_f['area_ha']}")

# Balanced crops
balanced_crops = ['Mustard', 'Mungbean', 'Rice', 'Chickpea', 'Sesame', 'Rice']

scenarios = ['heatwave', 'drought', 'flood', 'coldwave', 'salinity']
results = {}

for sc in scenarios:
    payload = {
        'field_id': rahim_f['id'],
        'district': rahim_f['district'],
        'strategy': 'balanced',
        'scenario': sc,
        'intensity': 'moderate',
        'plan_crops': balanced_crops,
        'area_ha': rahim_f['area_ha']
    }
    res = s.post('http://127.0.0.1:8000/api/planning/stress', json=payload).json()
    results[sc] = res
    print(f"\n=== SCENARIO: {sc.upper()} (Moderate) ===")
    print(f"Total Profit Before: {res['summary']['total_profit_before_bdt']:,} BDT")
    print(f"Total Profit After: {res['summary']['total_profit_after_bdt']:,} BDT")
    print(f"Total Profit Loss: {res['summary']['total_profit_loss_bdt']:,} BDT ({res['summary']['total_profit_loss_pct']}%)")
    mv = res['summary']['most_vulnerable_season']
    print(f"Most Vulnerable Season: {mv['period']} ({mv['crop']}) at -{mv['loss_pct']}% loss ({mv['profit_loss_bdt']:,} BDT loss)")
    print("Season-by-Season Breakdown:")
    for s_item in res['seasons']:
        print(f"  {s_item['period']} ({s_item['crop']}): loss={s_item['loss_pct']}%, profit_loss={s_item['profit_loss_bdt']:,} BDT | {s_item['mechanism_en']}")

# Compare Bogura vs Satkhira for salinity
print('\n======================================================')
print('=== SALINITY COMPARISON: BOGURA (RAHIM) VS SATKHIRA ===')
print('======================================================')
p_bogura = {
    'district': 'bogura',
    'strategy': 'balanced',
    'scenario': 'salinity',
    'intensity': 'moderate',
    'plan_crops': balanced_crops,
    'area_ha': 0.67
}
res_bogura = s.post('http://127.0.0.1:8000/api/planning/stress', json=p_bogura).json()

p_satkhira = {
    'district': 'satkhira',
    'strategy': 'balanced',
    'scenario': 'salinity',
    'intensity': 'moderate',
    'plan_crops': balanced_crops,
    'area_ha': 0.67
}
res_satkhira = s.post('http://127.0.0.1:8000/api/planning/stress', json=p_satkhira).json()

print(f"Bogura (Freshwater/Inland) Salinity Loss: {res_bogura['summary']['total_profit_loss_pct']}% (Loss: {res_bogura['summary']['total_profit_loss_bdt']:,} BDT)")
print(f"Satkhira (Coastal Saline) Salinity Loss: {res_satkhira['summary']['total_profit_loss_pct']}% (Loss: {res_satkhira['summary']['total_profit_loss_bdt']:,} BDT)")
print(f"Verified: Satkhira Loss > Bogura Loss? -> {res_satkhira['summary']['total_profit_loss_bdt'] > res_bogura['summary']['total_profit_loss_bdt']}")

# Monotonicity check across intensities
print('\n======================================================')
print('=== MONOTONICITY CHECK: MILD -> MODERATE -> SEVERE ===')
print('======================================================')
for sc in scenarios:
    losses = []
    for inten in ['mild', 'moderate', 'severe']:
        p = {
            'field_id': rahim_f['id'],
            'district': rahim_f['district'],
            'strategy': 'balanced',
            'scenario': sc,
            'intensity': inten,
            'plan_crops': balanced_crops,
            'area_ha': rahim_f['area_ha']
        }
        r = s.post('http://127.0.0.1:8000/api/planning/stress', json=p).json()
        losses.append(r['summary']['total_profit_loss_pct'])
    is_monotonic = losses[0] <= losses[1] <= losses[2]
    print(f"Scenario {sc.ljust(10)}: mild={losses[0]}% -> mod={losses[1]}% -> sev={losses[2]}% | Monotonic: {is_monotonic}")
