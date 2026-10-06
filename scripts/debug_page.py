import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    page.on("console", lambda msg: print(f"[BROWSER {msg.type}]: {msg.text}"))
    page.on("pageerror", lambda err: print(f"[PAGE ERROR]: {err}"))
    page.on("requestfailed", lambda req: print(f"[REQ FAILED]: {req.url} {req.failure}"))

    print("Navigating to http://localhost:5173/ ...")
    page.goto("http://localhost:5173/")
    time.sleep(4)

    # Print current HTML structure of sidebar and header
    val = page.locator(".dashboard-field-select").input_value()
    print("Field select val:", val)
    options = page.locator(".dashboard-field-select option").all_inner_texts()
    print("Field select options:", options)

    # Navigate to Profile
    print("Clicking Profile button...")
    page.locator(".nav-item[title*='Profile']").first.click()
    time.sleep(3)

    # Check url or view rendered
    print("Profile view wrapper exists?", page.locator(".profile-view-wrapper").count())
    if page.locator(".profile-view-wrapper").count() > 0:
        print("Profile inner text snippet:", page.locator(".profile-view-wrapper").inner_text()[:400])
    else:
        print("Root inner text snippet:", page.locator("#root").inner_text()[:400])

    browser.close()
