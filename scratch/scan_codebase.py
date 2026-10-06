import os

targets = ['10.0', '2.93', '2.78', '3.08', '23.8029', '90.3685', 'loam', '2.5', '90', 'Maize', 'field_demo']
dirs = [r'C:\FieldShift\backend', r'C:\FieldShift\app', r'C:\FieldShift\src', r'C:\FieldShift\frontend\src']

results = {t: [] for t in targets}
for d in dirs:
    for root, _, files in os.walk(d):
        if 'node_modules' in root or '.venv' in root or '__pycache__' in root or '.git' in root:
            continue
        for file in files:
            if not file.endswith(('.py', '.js', '.jsx', '.json')):
                continue
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    for i, line in enumerate(f, 1):
                        for t in targets:
                            if t in line:
                                rel = os.path.relpath(path, r'C:\FieldShift')
                                results[t].append((rel, i, line.strip()[:100]))
            except Exception:
                pass

print('=== CODEBASE SCAN FOR AUDIT TARGETS ===')
for t, occurrences in results.items():
    print(f'\nTarget: "{t}" ({len(occurrences)} occurrences):')
    for rel, line_no, content in occurrences[:6]:
        print(f'  {rel}:{line_no} -> {content}')
    if len(occurrences) > 6:
        print(f'  ... and {len(occurrences) - 6} more.')
