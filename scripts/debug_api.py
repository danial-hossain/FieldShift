import time, json
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    def on_response(response):
        if "/api/" in response.url:
            try:
                print(f"[API RESPONSE] {response.status} {response.url}: {response.text()[:300]}")
            except Exception as e:
                print(f"[API RESPONSE] {response.status} {response.url} (could not read body: {e})")

    page.on("response", on_response)

    print("Navigating to http://localhost:5173/ ...")
    page.goto("http://localhost:5173/")
    time.sleep(4)

    cookies = context.cookies()
    print("Browser cookies:", cookies)

    browser.close()
