import requests
import json

fields = [
    {"name": "Bogura Loam Field", "district": "bogura", "priority": "balanced"},
    {"name": "Rajshahi Barind Field", "district": "rajshahi", "priority": "balanced"},
    {"name": "Sunamganj Haor Basin", "district": "sunamganj", "priority": "balanced"},
]

for f in fields:
    res = requests.post("http://127.0.0.1:8000/api/planning", json=f).json()
    risk = res.get("risk") or res.get("summary", {}).get("planning", {}).get("risk")
    print(f"=== {f['name']} ({f['district'].upper()}) ===")
    for k in ["drought", "heavy_rain", "heat", "late_monsoon", "bare_soil"]:
        r = risk[k]
        print(f"  [{r['id']}] {r['labelEn']}: level={r['level']} ({r['levelBn']}) | color={r['color']}")
        print(f"       whyBn: {r['whyBn']}")
        print(f"       whyEn: {r['whyEn']}")
