from playwright.sync_api import sync_playwright
import time

p = sync_playwright().start()
browser = p.chromium.launch()
page = browser.new_page()

page.on('console', lambda msg: print('CONSOLE:', msg.text))
page.on('pageerror', lambda err: print('PAGE ERROR:', err))

page.goto('http://localhost:5174/')
time.sleep(2)

print('--- DASHBOARD ---')
dash_field = page.locator('.current-field-name').all_inner_texts()
print('Current Field Name:', dash_field)
dash_id = page.locator('.label-badge').all_inner_texts()
print('Badge:', dash_id)

print('--- NAVIGATING TO PROFILE ---')
page.locator(".nav-item[title*='Profile']").first.click()
time.sleep(2)

active_id = page.locator('.active-field-id').all_inner_texts()
print('Active Field ID:', active_id)
active_title = page.locator('.active-field-title').all_inner_texts()
print('Active Field Title:', active_title)
active_meta = page.locator('.active-field-meta-row').all_inner_texts()
print('Active Field Meta:', active_meta)

stat_labels = page.locator('.profile-stat-label').all_inner_texts()
stat_values = page.locator('.profile-stat-value').all_inner_texts()
print('Stats:', dict(zip(stat_labels, stat_values)))

my_fields = page.locator('.field-card-item').all_inner_texts()
print('My Fields Count:', len(my_fields))

# Let's also check if "No fields registered yet" or "No registered fields found" appears
empty_text = page.locator('.active-field-empty, .field-empty-state').all_inner_texts()
print('Empty text:', empty_text)

browser.close()
p.stop()
