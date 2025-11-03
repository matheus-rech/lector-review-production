#!/usr/bin/env python3
"""
Visual test of search and highlight functionality using Playwright.
Runs in headed mode so we can see exactly what's happening.
"""

from playwright.sync_api import sync_playwright
import time

def test_search_visual():
    """Test search functionality with visual browser."""

    with sync_playwright() as p:
        # Launch in HEADED mode (visible browser) with slow motion
        browser = p.chromium.launch(headless=False, slow_mo=500)
        page = browser.new_page()
        page.set_default_timeout(60000)

        print("🔍 Visual Search & Highlight Test")
        print("=" * 60)

        # Navigate
        print("\n📍 Step 1: Loading application...")
        page.goto('http://localhost:5173', wait_until='domcontentloaded')
        time.sleep(3)

        # Wait for PDF to load
        print("⏳ Waiting for PDF to load...")
        page.wait_for_selector('aside', timeout=10000)
        time.sleep(3)

        # Take initial screenshot
        page.screenshot(path='/tmp/search_visual_01_initial.png', full_page=True)
        print("📸 Screenshot 1: Initial state")

        # Find search box
        print("\n📍 Step 2: Finding search box...")
        search_inputs = page.locator('input[type="text"]')
        search_input = None

        # Try to find the right search input
        for i in range(search_inputs.count()):
            input_elem = search_inputs.nth(i)
            placeholder = input_elem.get_attribute('placeholder') or ""
            print(f"  Found input {i}: placeholder='{placeholder}'")
            if 'search' in placeholder.lower():
                search_input = input_elem
                print(f"  ✓ Using search input {i}")
                break

        if not search_input:
            # Just use the first text input
            search_input = search_inputs.first
            print("  ⚠ No search-specific input found, using first text input")

        # Test search term
        search_term = "cerebellar"
        print(f"\n📍 Step 3: Searching for '{search_term}'...")
        search_input.fill(search_term)
        time.sleep(3)  # Wait for debounce and search to complete

        page.screenshot(path='/tmp/search_visual_02_search_entered.png', full_page=True)
        print("📸 Screenshot 2: Search term entered")

        # Look for search results indicator
        print("\n📍 Step 4: Checking for search results...")

        # Check for any text containing "Found" or "match"
        result_patterns = [
            'text=/Found.*match/i',
            'text=/\\d+ match/i',
            'text=/\\d+ result/i',
            'text=/No match/i'
        ]

        for pattern in result_patterns:
            try:
                result_elem = page.locator(pattern).first
                if result_elem.is_visible(timeout=2000):
                    result_text = result_elem.text_content()
                    print(f"  ✓ Search result indicator: '{result_text}'")
                    break
            except:
                continue
        else:
            print("  ℹ No search result indicator found (might be embedded in UI)")

        # Check highlights panel
        print("\n📍 Step 5: Checking highlights panel...")
        highlights_section = page.locator('h3:has-text("Your Highlights")')
        if highlights_section.is_visible():
            print("  ✓ Highlights section visible")

            # Count highlights
            highlight_items = page.locator('ul li').filter(has=page.locator('.font-medium'))
            count = highlight_items.count()
            print(f"  ✓ Total highlights/items: {count}")

            if count > 0:
                print("\n  📝 Highlight items:")
                for i in range(min(count, 5)):
                    try:
                        item = highlight_items.nth(i)
                        label_elem = item.locator('.font-medium').first
                        label = label_elem.text_content()
                        print(f"    {i+1}. {label}")
                    except:
                        print(f"    {i+1}. [Could not read label]")

        page.screenshot(path='/tmp/search_visual_03_results.png', full_page=True)
        print("📸 Screenshot 3: Search results")

        # Look for yellow highlights on the PDF
        print("\n📍 Step 6: Looking for visual highlights on PDF...")
        # The highlights are rendered as div elements with colored backgrounds
        # Let's check if ColoredHighlightLayer is rendering anything
        highlight_layers = page.locator('[class*="highlight"]').count()
        print(f"  ℹ Found {highlight_layers} elements with 'highlight' in class name")

        # Scroll through a few pages to see highlights
        print("\n📍 Step 7: Scrolling through pages to find highlights...")
        for page_num in range(1, 4):
            try:
                # Look for next page button
                next_button = page.locator('button:has-text("›")').or_(
                    page.locator('button').filter(has_text="Next")
                )

                if next_button.is_visible():
                    print(f"  Navigating to page {page_num + 1}...")
                    next_button.click(force=True)
                    time.sleep(2)

                    page.screenshot(path=f'/tmp/search_visual_04_page{page_num + 1}.png', full_page=True)
                    print(f"  📸 Screenshot: Page {page_num + 1}")
            except:
                print(f"  ⚠ Could not navigate to page {page_num + 1}")
                break

        # Test clearing search
        print("\n📍 Step 8: Clearing search...")
        search_input.clear()
        time.sleep(2)

        page.screenshot(path='/tmp/search_visual_05_cleared.png', full_page=True)
        print("📸 Screenshot 5: Search cleared")

        # Final check
        final_count = page.locator('ul li').filter(has=page.locator('.font-medium')).count()
        print(f"\n  ✓ Highlights after clear: {final_count}")

        # Summary
        print("\n" + "=" * 60)
        print("📊 VISUAL TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Search term tested: '{search_term}'")
        print(f"📁 Screenshots saved:")
        print(f"   - /tmp/search_visual_01_initial.png")
        print(f"   - /tmp/search_visual_02_search_entered.png")
        print(f"   - /tmp/search_visual_03_results.png")
        print(f"   - /tmp/search_visual_04_page*.png (if multiple pages)")
        print(f"   - /tmp/search_visual_05_cleared.png")
        print("\n💡 Open the screenshots to see the visual results!")
        print("=" * 60)

        # Keep browser open for manual inspection
        print("\n⏸️  Browser will stay open for 30 seconds for manual inspection...")
        print("   You can interact with the app during this time!")
        time.sleep(30)

        browser.close()

if __name__ == "__main__":
    test_search_visual()
