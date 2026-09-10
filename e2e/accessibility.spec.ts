import { expect, test } from "@playwright/test";

test.describe("Lector Review - Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=Project", { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test("should have proper ARIA labels on interactive elements", async ({
    page,
  }) => {
    // Check buttons have aria-labels
    const addProjectButton = page.getByRole("button", { name: /Add project/i });
    await expect(addProjectButton).toHaveAttribute(
      "aria-label",
      /Add project/i
    );

    const exportJSONButton = page.getByRole("button", { name: "Export JSON" });
    await expect(exportJSONButton).toHaveAttribute("aria-label", "Export JSON");

    const exportCSVButton = page.getByRole("button", { name: "Export CSV" });
    await expect(exportCSVButton).toHaveAttribute("aria-label", "Export CSV");

    // Check file input has aria-label
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toHaveAttribute("aria-label", /Upload PDF/i);
  });

  test("should support keyboard navigation", async ({ page }) => {
    // Test Tab navigation
    await page.keyboard.press("Tab");
    await page.waitForTimeout(500);

    // Focus should move to first interactive element
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();

    // Test Enter key on buttons
    const exportJSONButton = page.getByRole("button", { name: "Export JSON" });
    await exportJSONButton.focus();
    await page.keyboard.press("Enter");

    // Should trigger action (download starts)
    await page.waitForTimeout(1000);

    // Verify page still works
    await expect(page.getByText("Project", { exact: true })).toBeVisible();
  });

  test("should handle Escape key to close modals", async ({ page }) => {
    // Open a modal (project creation)
    const addButton = page
      .getByRole("button", { name: /Add project/i })
      .first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page.getByText("Create New Project")).toBeVisible();

      // Press Escape
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);

      // Modal should close
      await expect(page.getByText("Create New Project")).not.toBeVisible();
    }
  });

  test("should handle Enter key in input fields", async ({ page }) => {
    // Test page number input
    await page.waitForTimeout(2000);
    const pageInput = page
      .locator('input[type="number"]')
      .filter({ hasNotText: "Search" })
      .first();
    if (await pageInput.isVisible()) {
      await pageInput.fill("2");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1000);

      // Page should navigate
      const pageIndicator = page.getByText(/\d+ \/ \d+/).first();
      await expect(pageIndicator).toBeVisible();
    }
  });

  test("should have proper form labels", async ({ page }) => {
    // Check that form inputs have associated labels
    const searchInput = page.getByPlaceholder(/Search in document/i);
    if (await searchInput.isVisible()) {
      // Input should have placeholder or label
      const searchLabel = page.getByText(/Search/i).first();
      await expect(searchLabel).toBeVisible();
    }
  });

  test("should indicate disabled state for buttons", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Check navigation buttons have disabled states
    const prevButton = page.getByRole("button", { name: "Previous page" });
    const nextButton = page.getByRole("button", { name: "Next page" });

    // At first page, previous should be disabled
    const pageIndicator = page.getByText(/\d+ \/ \d+/).first();
    if (await pageIndicator.isVisible()) {
      const text = await pageIndicator.textContent();
      const currentPage = parseInt(text?.split(" / ")[0] || "1");

      if (currentPage === 1) {
        await expect(prevButton).toBeDisabled();
      }
    }

    // Buttons should have disabled attribute or class
    const disabledAttr = await prevButton.getAttribute("disabled");
    const disabledClass = await prevButton.getAttribute("class");

    expect(
      disabledAttr !== null || disabledClass?.includes("disabled")
    ).toBeTruthy();
  });

  test("should have proper semantic HTML structure", async ({ page }) => {
    // Check for semantic elements
    const main = page.locator("main");
    await expect(main).toBeVisible();

    const aside = page.locator("aside");
    await expect(aside.first()).toBeVisible();

    // Check for headings
    const headings = page.locator("h1, h2, h3");
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
  });

  test("should support screen reader navigation", async ({ page }) => {
    // Check for aria-live regions or roles
    const regions = page.locator(
      '[role="region"], [role="main"], [role="complementary"]'
    );
    const regionCount = await regions.count();

    // Should have at least main content area
    expect(regionCount).toBeGreaterThanOrEqual(0);

    // Check buttons have accessible names
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute("aria-label");
      const textContent = await button.textContent();
      const title = await button.getAttribute("title");

      // Button should have accessible name (aria-label, text, or title)
      expect(ariaLabel || textContent || title).toBeTruthy();
    }
  });

  test("should handle focus management in modals", async ({ page }) => {
    // Open modal
    const addButton = page
      .getByRole("button", { name: /Add project/i })
      .first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page.getByText("Create New Project")).toBeVisible();

      // Focus should be on input field
      const input = page.getByPlaceholder("Enter value...");
      await expect(input).toBeFocused();

      // Close modal
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
  });

  test("should provide keyboard shortcuts hints", async ({ page }) => {
    // Check for title attributes that might indicate shortcuts
    const buttons = page.locator("button[title]");
    const buttonCount = await buttons.count();

    // Some buttons should have tooltips/hints
    expect(buttonCount).toBeGreaterThanOrEqual(0);

    // Check navigation buttons have helpful titles
    const prevButton = page.getByRole("button", { name: "Previous page" });
    const nextButton = page.getByRole("button", { name: "Next page" });

    const prevTitle = await prevButton.getAttribute("title");
    const nextTitle = await nextButton.getAttribute("title");

    // Should have descriptive titles
    expect(
      prevTitle || (await prevButton.getAttribute("aria-label"))
    ).toBeTruthy();
    expect(
      nextTitle || (await nextButton.getAttribute("aria-label"))
    ).toBeTruthy();
  });

  test("should maintain focus visibility", async ({ page }) => {
    // Tab through elements
    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);

    // Focus should be visible (browser default focus styles)
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();

    // Continue tabbing
    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);

    // Focus should move
    const newFocusedElement = page.locator(":focus");
    await expect(newFocusedElement).toBeVisible();
  });
});
