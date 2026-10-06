import time
import os
import sys
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\dania\.gemini\antigravity-cli\brain\4c730ae7-a2a5-460c-bbee-0350f39a7803"

def run_tests():
    results = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Fresh incognito context
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        print("--- TEST 1: Cold-Start Navigation ---")
        page.goto("http://localhost:5173/")
        page.wait_for_load_state("networkidle")
        time.sleep(3) # allow initial data fetch and workflow execution

        # Check Dashboard Field Selector and Current Field
        dash_select = page.locator(".dashboard-field-select").input_value()
        current_field_title = page.locator(".current-field-name").inner_text()
        current_field_id_text = page.locator(".current-field-summary-card .label-badge").inner_text()
        print(f"Dashboard Field Select Value: {dash_select}")
        print(f"Dashboard Current Field Title: {current_field_title}")
        print(f"Dashboard Field ID Badge: {current_field_id_text}")

        results["cold_start_dash_field_id"] = dash_select == "58"
        results["cold_start_dash_field_name"] = "Mirpur" in current_field_title

        # Navigate to Profile Page
        print("\n--- TEST 2: Navigate to Profile Page ---")
        # Click on nav item for profile/account
        page.locator(".nav-item[title*='Profile']").first.click()
        time.sleep(1)

        # Verify Active Field Card on Profile
        active_card = page.locator(".active-field-card")
        active_id = page.locator(".active-field-id").inner_text()
        active_title = page.locator(".active-field-title").inner_text()
        active_meta = page.locator(".active-field-meta-row").inner_text()
        print(f"Profile Active Field ID: {active_id}")
        print(f"Profile Active Field Title: {active_title}")
        print(f"Profile Active Field Meta: {active_meta}")

        results["profile_active_is_58"] = "58" in active_id
        results["profile_active_name"] = "Mirpur, Dhaka" in active_title

        # Verify Profile Overview Stats
        stat_cards = page.locator(".profile-stat-card").all()
        stats = {}
        for sc in stat_cards:
            lbl = sc.locator(".profile-stat-label").inner_text()
            val = sc.locator(".profile-stat-value").inner_text()
            stats[lbl] = val
        print(f"Profile Overview Stats: {stats}")

        results["stat_registered_fields_1"] = stats.get("REGISTERED FIELDS") == "1"
        results["stat_active_field_1"] = stats.get("ACTIVE FIELD") == "1"
        results["stat_current_field_mirpur"] = "Mirpur, Dhaka" in stats.get("CURRENT FIELD", "")

        # Verify My Fields Card
        field_cards = page.locator(".field-card-item").all()
        print(f"My Fields Count: {len(field_cards)}")
        results["my_fields_count_1"] = len(field_cards) == 1

        if len(field_cards) > 0:
            first_card = field_cards[0]
            card_title = first_card.locator(".field-card-title-wrap h4").inner_text()
            card_id = first_card.locator(".field-id-badge").inner_text()
            card_active_badge = first_card.locator(".completeness-badge").inner_text()
            card_size = first_card.locator(".prop-highlight-card:has-text('Field Size') .prop-highlight-val").inner_text()
            print(f"Card Title: {card_title}, Card ID: {card_id}, Badge: {card_active_badge}, Size: {card_size}")
            results["card_title_mirpur"] = "Mirpur, Dhaka" in card_title
            results["card_id_58"] = "58" in card_id
            results["card_active_badge"] = "Active Field" in card_active_badge

        # Capture Desktop Profile Screenshot
        profile_desktop_shot = os.path.join(ARTIFACT_DIR, "profile_field58_synced_desktop.png")
        page.screenshot(path=profile_desktop_shot, full_page=True)
        print(f"Saved {profile_desktop_shot}")

        # Capture Mobile Profile Screenshot
        page.set_viewport_size({"width": 375, "height": 812})
        time.sleep(1)
        profile_mobile_shot = os.path.join(ARTIFACT_DIR, "profile_field58_synced_mobile.png")
        page.screenshot(path=profile_mobile_shot, full_page=True)
        print(f"Saved {profile_mobile_shot}")

        # Reset Viewport to Desktop
        page.set_viewport_size({"width": 1280, "height": 800})
        time.sleep(1)

        print("\n--- TEST 3: Edit Field Size (10.0 ha -> 20.0 ha) Dynamic Synchronization ---")
        # Click Edit button on the field card
        page.locator(".field-card-item .btn-field-action:has-text('Edit')").click()
        page.locator(".modal-dialog").wait_for(state="visible", timeout=10000)
        time.sleep(1)

        # In edit modal, change field size
        area_input = page.locator(".form-group:has-text('Field Size (ha)') input")
        area_input.fill("20.0")
        page.locator("button:has-text('Update Field')").click()
        page.locator(".modal-dialog").wait_for(state="hidden", timeout=10000)
        time.sleep(3) # Wait for update and recalculation

        # Check updated card size
        updated_card_size = page.locator(".field-card-item .prop-highlight-card:has-text('Field Size') .prop-highlight-val").inner_text()
        updated_active_meta = page.locator(".active-field-meta-row").inner_text()
        print(f"Updated Field Card Size: {updated_card_size}")
        print(f"Updated Active Card Meta: {updated_active_meta}")
        results["edit_card_size_20ha"] = "20.0 ha" in updated_card_size
        results["edit_active_meta_20ha"] = "20.0 ha" in updated_active_meta

        # Switch to Dashboard
        page.locator(".nav-item[title*='Overview Dashboard']").click()
        time.sleep(2)

        dash_area = page.locator(".field-data-row:has-text('Area') .field-data-val").inner_text()
        print(f"Dashboard Area: {dash_area}")
        results["dash_area_20ha"] = "20.0 ha" in dash_area

        # Capture Desktop Dashboard Screenshot with 20ha
        dash_desktop_shot = os.path.join(ARTIFACT_DIR, "dashboard_field58_20ha_synced_desktop.png")
        page.screenshot(path=dash_desktop_shot, full_page=True)
        print(f"Saved {dash_desktop_shot}")

        # Capture Mobile Dashboard Screenshot
        page.set_viewport_size({"width": 375, "height": 812})
        time.sleep(1)
        dash_mobile_shot = os.path.join(ARTIFACT_DIR, "dashboard_field58_20ha_synced_mobile.png")
        page.screenshot(path=dash_mobile_shot, full_page=True)
        print(f"Saved {dash_mobile_shot}")

        # Reset Viewport to Desktop
        page.set_viewport_size({"width": 1280, "height": 800})
        time.sleep(1)

        print("\n--- TEST 4: Restore Field Size to 10.0 ha ---")
        page.locator(".nav-item[title*='Profile']").first.click()
        time.sleep(1)
        page.locator(".field-card-item .btn-field-action:has-text('Edit')").click()
        page.locator(".modal-dialog").wait_for(state="visible", timeout=10000)
        time.sleep(1)
        area_input = page.locator(".form-group:has-text('Field Size (ha)') input")
        area_input.fill("10.0")
        page.locator("button:has-text('Update Field')").click()
        page.locator(".modal-dialog").wait_for(state="hidden", timeout=10000)
        time.sleep(3)

        restored_card_size = page.locator(".field-card-item .prop-highlight-card:has-text('Field Size') .prop-highlight-val").inner_text()
        print(f"Restored Field Card Size: {restored_card_size}")
        results["restore_card_size_10ha"] = "10.0 ha" in restored_card_size

        print("\n--- TEST 5: Browser Refresh & Persistence Verification ---")
        page.reload()
        page.wait_for_load_state("networkidle")
        time.sleep(3)

        # On reload, we are on Dashboard by default
        reloaded_dash_select = page.locator(".dashboard-field-select").input_value()
        reloaded_dash_title = page.locator(".current-field-name").inner_text()
        print(f"After Reload - Dash Select: {reloaded_dash_select}, Title: {reloaded_dash_title}")
        results["reload_preserves_dash_field58"] = reloaded_dash_select == "58" and "Mirpur" in reloaded_dash_title

        # Navigate to Profile to verify persistent profile view
        page.locator(".nav-item[title*='Profile']").first.click()
        time.sleep(2)

        reloaded_active_id = page.locator(".active-field-id").inner_text()
        reloaded_active_title = page.locator(".active-field-title").inner_text()
        print(f"After Reload - Profile Active ID: {reloaded_active_id}, Title: {reloaded_active_title}")
        results["reload_preserves_profile_field58"] = "58" in reloaded_active_id and "Mirpur, Dhaka" in reloaded_active_title

        # Verify Profile Overview stats after reload
        stat_cards = page.locator(".profile-stat-card").all()
        reloaded_stats = {}
        for sc in stat_cards:
            lbl = sc.locator(".profile-stat-label").inner_text()
            val = sc.locator(".profile-stat-value").inner_text()
            reloaded_stats[lbl] = val
        print(f"After Reload - Profile Stats: {reloaded_stats}")
        results["reload_stat_registered_1"] = reloaded_stats.get("REGISTERED FIELDS") == "1"
        results["reload_stat_active_1"] = reloaded_stats.get("ACTIVE FIELD") == "1"

        # Final Dashboard check
        page.locator(".nav-item[title*='Overview Dashboard']").click()
        time.sleep(2)
        final_dash_title = page.locator(".current-field-name").inner_text()
        final_dash_id = page.locator(".dashboard-field-select").input_value()
        print(f"Final Dashboard Check - Select: {final_dash_id}, Title: {final_dash_title}")
        results["final_dash_sync"] = final_dash_id == "58" and "Mirpur" in final_dash_title

        browser.close()

    print("\n================== TEST SUMMARY ==================")
    all_passed = True
    for test_name, passed in results.items():
        status = "PASSED" if passed else "FAILED"
        if not passed:
            all_passed = False
        print(f"[{status}] {test_name}")
    print(f"Overall Result: {'ALL TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
    return all_passed

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
