with open(r'C:\FieldShift\src\state\field_state.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add field_size_ha to FieldState
old_cls = '''    environment_source: str = "NASA_POWER"
    soil_moisture_source: str = "missing"
    soil_source: str = "missing"
    crop_source: str = "missing"
    history_source: str = "missing"
    data_status: dict[str, str] = field('''

new_cls = '''    environment_source: str = "NASA_POWER"
    soil_moisture_source: str = "missing"
    soil_source: str = "missing"
    crop_source: str = "missing"
    history_source: str = "missing"
    field_size_ha: float = float("nan")
    data_status: dict[str, str] = field('''

assert old_cls in content, "old_cls not found"
content = content.replace(old_cls, new_cls, 1)

# 2. Add field_size_ha parameter to build_field_state signature
old_sig = '''    crop_knowledge: FrameInput = None,
    coordinate_tolerance: float = 0.05,
) -> FieldState:'''

new_sig = '''    crop_knowledge: FrameInput = None,
    coordinate_tolerance: float = 0.05,
    field_size_ha: float = float("nan"),
) -> FieldState:'''

assert old_sig in content, "old_sig not found"
content = content.replace(old_sig, new_sig, 1)

# 3. Pass field_size_ha in return FieldState(...)
old_ret = '''    return FieldState(
        field_id=field_id,
        as_of_date=decision,
        latitude=latitude,
        longitude=longitude,'''

new_ret = '''    return FieldState(
        field_id=field_id,
        as_of_date=decision,
        latitude=latitude,
        longitude=longitude,
        field_size_ha=_optional_number(field_size_ha, "field_size_ha"),'''

assert old_ret in content, "old_ret not found"
content = content.replace(old_ret, new_ret, 1)

with open(r'C:\FieldShift\src\state\field_state.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully patched src/state/field_state.py!")
