#!/usr/bin/env python3
"""Debug script to test page navigation"""

from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)  # Use headed mode to see what happens
    page = browser.new_page()

    # Navigate to app
    page.goto('http://localhost:5173')

    # Wait for PDF to load
    page.wait_for_selector('canvas', timeout=15000)
    print("✓ PDF loaded")

    # Wait a bit more for everything to initialize
    time.sleep(2)

    # Take screenshot before
    page.screenshot(path='/tmp/before_click.png')
    print("✓ Screenshot saved: /tmp/before_click.png")

    # Find and print page indicator
    try:
        page_indicator = page.locator('text=/\\d+ \\/ \\d+/').first
        current_text = page_indicator.text_content()
        print(f"✓ Current page indicator: {current_text}")
    except:
        print("✗ Could not find page indicator")

    # Click Next page button
    next_button = page.get_by_role('button', name='Next page')
    print(f"✓ Next button found, disabled={next_button.is_disabled()}")

    next_button.click()
    print("✓ Clicked Next page button")

    # Wait for navigation
    time.sleep(2)

    # Take screenshot after
    page.screenshot(path='/tmp/after_click.png')
    print("✓ Screenshot saved: /tmp/after_click.png")

    # Check page indicator again
    try:
        current_text_after = page_indicator.text_content()
        print(f"✓ Page indicator after click: {current_text_after}")
    except:
        print("✗ Could not find page indicator after click")

    # Keep browser open for manual inspection
    input("Press Enter to close browser...")

    browser.close()
