#!/usr/bin/env python3
"""
FIXED: Visual test of PDF search and highlight functionality.
Uses the CORRECT search box (left sidebar "Search in PDF...")
"""

from playwright.sync_api import sync_playwright
import time

def test_search_visual_fixed():
    """Test PDF search functionality with the correct search box."""

    with sync_playwright() as p:
        # Launch in HEADED mode with slow motion
        browser = p.chromium.launch(headless=False, slow_mo=500)
        page = browser.new_page()
        page.set_default_timeout(60000)

        print("🔍 FIXED Visual Search & Highlight Test")
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
        page.screenshot(path='/tmp/search_fixed_01_initial.png', full_page=True)
        print("📸 Screenshot 1: Initial state")

        # Find the CORRECT search box in left sidebar
        print("\n📍 Step 2: Finding CORRECT PDF search box (left sidebar)...")

        # Method 1: Try by placeholder text
        search_input = page.locator('input[placeholder*="Search"]').or_(
            page.locator('input[placeholder*="search"]')
        ).first

        # If that doesn't work, look for the Search section specifically
        if not search_input.is_visible(timeout=2000):
            # Look in the left sidebar under "Search" heading
            print("  ℹ Trying alternative selector...")
            search_input = page.locator('aside').first.locator('input[type="text"]').first

        print("  ✓ Found search input")

        # Test search term
        search_term = "cerebellar"
        print(f"\n📍 Step 3: Searching PDF for '{search_term}'...")
        search_input.click()
        search_input.fill(search_term)
        print(f"  ✓ Entered '{search_term}' into PDF search box")
        time.sleep(4)  # Wait for debounce and search to complete

        page.screenshot(path='/tmp/search_fixed_02_search_entered.png', full_page=True)
        print("📸 Screenshot 2: Search term entered in CORRECT box")

        # Look for search results indicator
        print("\n📍 Step 4: Checking for search results...")

        # The search results might show as "Found X matches" or similar
        try:
            # Look for any element containing match count
            result_elem = page.locator('text=/found.*match/i').or_(
                page.locator('text=/\\d+.*match/i')
            ).first

            if result_elem.is_visible(timeout=3000):
                result_text = result_elem.text_content()
                print(f"  ✓ Search results: '{result_text}'")
        except:
            print("  ℹ No explicit result count shown (results may be highlighted directly)")

        # Check if highlights appeared in the panel
        print("\n📍 Step 5: Checking highlights panel...")
        highlights_section = page.locator('h3:has-text("Your Highlights")')
        if highlights_section.is_visible():
            print("  ✓ Highlights section visible")

            # Count ALL list items in highlights panel
            # Search highlights should appear with "Search: cerebellar" or similar
            highlight_items = page.locator('ul').filter(
                has=page.locator('h3:has-text("Your Highlights")')
            ).locator('li')

            count = highlight_items.count()
            print(f"  ✓ Total items in highlights panel: {count}")

            if count > 0:
                print("\n  📝 Highlight items found:")
                for i in range(min(count, 10)):
                    try:
                        item = highlight_items.nth(i)
                        text = item.text_content()
                        # Clean up text for display
                        text = ' '.join(text.split())
                        if text:
                            print(f"    {i+1}. {text[:100]}")
                    except:
                        print(f"    {i+1}. [Could not read item]")
            else:
                print("  ⚠ No highlights in panel yet")
                print("  ℹ Search highlights might appear on PDF but not in panel")

        page.screenshot(path='/tmp/search_fixed_03_results.png', full_page=True)
        print("📸 Screenshot 3: Search results (should show yellow highlights)")

        # Check the PDF area for yellow highlights
        print("\n📍 Step 6: Checking PDF for yellow highlight overlays...")
        # Highlights are rendered by ColoredHighlightLayer as div elements
        pdf_container = page.locator('main').or_(page.locator('[role="main"]'))

        # Look for elements that might be highlights
        # The actual highlight rendering depends on Lector's implementation
        print("  ℹ Yellow highlights should be visible on the PDF")
        print("  ℹ Check the screenshots to verify visual highlighting")

        # Navigate through a couple pages to see more highlights
        print("\n📍 Step 7: Scrolling to see highlights across pages...")
        try:
            # Try to click next page
            next_button = page.locator('button').filter(has_text="›").or_(
                page.locator('button[aria-label*="next"]')
            ).first

            if next_button.is_visible(timeout=2000):
                next_button.click(force=True)
                time.sleep(2)
                page.screenshot(path='/tmp/search_fixed_04_page2.png', full_page=True)
                print("  📸 Screenshot: Page 2 with highlights")
        except:
            print("  ℹ Could not navigate to next page")

        # Test clearing search
        print("\n📍 Step 8: Clearing search...")
        search_input.clear()
        time.sleep(2)

        # Check if highlights disappeared
        final_count = highlight_items.count()
        print(f"  ✓ Highlights after clear: {final_count}")

        page.screenshot(path='/tmp/search_fixed_05_cleared.png', full_page=True)
        print("📸 Screenshot 5: Search cleared (highlights should be gone)")

        # Summary
        print("\n" + "=" * 60)
        print("📊 VISUAL TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Search term tested: '{search_term}'")
        print(f"✅ Used CORRECT search box (left sidebar)")
        print(f"📁 Screenshots saved:")
        print(f"   - /tmp/search_fixed_01_initial.png")
        print(f"   - /tmp/search_fixed_02_search_entered.png")
        print(f"   - /tmp/search_fixed_03_results.png")
        print(f"   - /tmp/search_fixed_04_page2.png")
        print(f"   - /tmp/search_fixed_05_cleared.png")
        print("\n💡 IMPORTANT: Open screenshots to verify:")
        print("   1. Yellow highlights appear on PDF text")
        print("   2. Highlights are cleared when search is cleared")
        print("=" * 60)

        # Keep browser open for manual inspection
        print("\n⏸️  Browser will stay open for 30 seconds...")
        print("   You can manually interact with the search!")
        time.sleep(30)

        browser.close()

if __name__ == "__main__":
    test_search_visual_fixed()
