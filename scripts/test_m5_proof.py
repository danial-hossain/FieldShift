import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 1. Login to get session
login_data = json.dumps({'email': 'evaluator@fieldshift.local', 'password': 'EvaluationPass2026!'}).encode()
req = urllib.request.Request('http://127.0.0.1:8000/api/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    cookies = resp.headers.get_all('Set-Cookie')
    cookie_str = '; '.join([c.split(';')[0] for c in cookies])
    print('Logged in successfully.')

# 2. Get fields
req = urllib.request.Request('http://127.0.0.1:8000/api/fields', headers={'Cookie': cookie_str})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    fields = data['fields']
    field = fields[0]
    fid = field['id']
    fname = field['name']
    print(f'Testing field ID: {fid}, name: {fname}')

# 3. PUT existing_rotation: Mustard - Jute - Aman
rot = {'rabi': 'Mustard', 'kharif1': 'Jute', 'kharif2': 'Aman'}
put_data = json.dumps({'existing_rotation': rot, 'previous_crop': 'Mustard'}).encode()
req = urllib.request.Request(f'http://127.0.0.1:8000/api/fields/{fid}', data=put_data, headers={'Content-Type': 'application/json', 'Cookie': cookie_str}, method='PUT')
with urllib.request.urlopen(req) as resp:
    res = json.loads(resp.read().decode())
    print('PUT response existing_rotation:', res['field'].get('existing_rotation'))

# 4. Reload GET /api/fields
req = urllib.request.Request('http://127.0.0.1:8000/api/fields', headers={'Cookie': cookie_str})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    fld = next(f for f in data['fields'] if f['id'] == fid)
    print('Reloaded field existing_rotation:', fld.get('existing_rotation'))

# 5. Call /api/planning
plan_data = json.dumps({'field_id': fid, 'district': fld.get('district') or 'bogura', 'area_ha': fld.get('area_ha') or 1.0}).encode()
req = urllib.request.Request('http://127.0.0.1:8000/api/planning', data=plan_data, headers={'Content-Type': 'application/json', 'Cookie': cookie_str})
with urllib.request.urlopen(req) as resp:
    plan_res = json.loads(resp.read().decode())
    p = plan_res['summary']['planning']
    print('PLANNING OUTPUT:')
    print('  baseline_rotation:', p.get('baseline_rotation'))
    print('  baseline_rotation_text_bn:', p.get('baseline_rotation_text_bn'))
    print('  baseline_rotation_text_en:', p.get('baseline_rotation_text_en'))
    print('  is_assumed_baseline:', p.get('is_assumed_baseline'))
    print('  baseline_profit_bdt:', p.get('baseline_profit_bdt'))
    print('  baseline_irrigation_mm:', p.get('baseline_irrigation_mm'))
    print('  baseline_nitrogen_kg:', p.get('baseline_nitrogen_kg'))
    print('  baseline_bare_days:', p.get('baseline_bare_days'))
