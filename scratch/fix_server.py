from pathlib import Path

path = Path(r"C:\FieldShift\app\server.py")
content = path.read_text(encoding="utf-8")

old_code = """    if field_size is not None:
        impact_items.append({
            "parameter": "Field Area",
            "value": f"{field_size:g} ha",
            "impact_type": "economic_scale",
            "impact_description": f"Scales field harvest to {active_field_metrics.get('total_harvest_tons')} tons and gross margin to ৳{active_field_metrics.get('total_profit_bdt'):,.0f} BDT.",
        })"""

new_code = """    if field_size is not None:
        tot_p = active_field_metrics.get("total_profit_bdt")
        profit_str = f"৳{tot_p:,.0f} BDT" if tot_p is not None else "N/A"
        tot_h = active_field_metrics.get("total_harvest_tons")
        harvest_str = f"{tot_h:g} tons" if tot_h is not None else "N/A"
        impact_items.append({
            "parameter": "Field Area",
            "value": f"{field_size:g} ha",
            "impact_type": "economic_scale",
            "impact_description": f"Scales field harvest to {harvest_str} and gross margin to {profit_str}.",
        })"""

if old_code in content:
    path.write_text(content.replace(old_code, new_code), encoding="utf-8")
    print("Replaced successfully!")
else:
    print("Target not found directly, checking CRLF...")
    old_crlf = old_code.replace("\n", "\r\n")
    new_crlf = new_code.replace("\n", "\r\n")
    if old_crlf in content:
        path.write_text(content.replace(old_crlf, new_crlf), encoding="utf-8")
        print("Replaced with CRLF!")
    else:
        print("Still not found!")
