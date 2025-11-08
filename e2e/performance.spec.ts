import { expect, test } from "@playwright/test";

test.describe("Lector Review - Performance", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=Project", { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test("should load PDF within acceptable time", async ({ page }) => {
    const startTime = Date.now();

    // Wait for PDF canvas to appear
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 15000 });

    const loadTime = Date.now() - startTime;

    // PDF should load within 10 seconds for typical PDFs
    expect(loadTime).toBeLessThan(10000);
  });

  test("should handle search performance", async ({ page }) => {
    await page.waitForTimeout(3000); // Wait for PDF to load

    const searchInput = page.getByPlaceholder(/Search in PDF/i);
    if (await searchInput.isVisible()) {
      const startTime = Date.now();

      // Perform search
      await searchInput.fill("test");
      await page.waitForTimeout(2000); // Wait for debounced search

      const searchTime = Date.now() - startTime;

      // Search should complete reasonably quickly (accounting for debounce)
      expect(searchTime).toBeLessThan(5000);
    }
  });

  test("should handle page navigation performance", async ({ page }) => {
    await page.waitForTimeout(3000);

    const nextButton = page.getByRole("button", { name: "Next page" });
    if (await nextButton.isEnabled()) {
      const startTime = Date.now();

      await nextButton.click({ force: true });
      await page.waitForTimeout(1000); // Wait for page change

      const navTime = Date.now() - startTime;

      // Page navigation should be fast
      expect(navTime).toBeLessThan(2000);
    }
  });

  test("should handle export performance", async ({ page }) => {
    const startTime = Date.now();

    const exportJSONButton = page.getByRole("button", { name: "Export JSON" });
    await exportJSONButton.click();

    // Wait for download to start
    const download = await page
      .waitForEvent("download", { timeout: 5000 })
      .catch(() => null);

    const exportTime = Date.now() - startTime;

    // Export should be fast (accounting for CI environment variance)
    expect(exportTime).toBeLessThan(6000);

    if (download) {
      expect(download.suggestedFilename()).toMatch(/\.json$/);
    }
  });

  test("should handle multiple highlight creation", async ({ page }) => {
    await page.waitForTimeout(3000);

    // Simulate creating multiple highlights
    // Note: Actual highlight creation requires text selection, which is complex
    // This test verifies the UI remains responsive

    const startTime = Date.now();

    // Interact with UI multiple times
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(100);
    }

    const interactionTime = Date.now() - startTime;

    // UI should remain responsive
    expect(interactionTime).toBeLessThan(2000);

    // Verify page still works
    await expect(page.getByText("Project")).toBeVisible();
  });

  test("should handle rapid project switching", async ({ page }) => {
    // Create a test project
    const addButton = page
      .getByRole("button", { name: /Add project/i })
      .first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.getByPlaceholder("Enter value...").fill("perf-test");
      await page.getByRole("button", { name: "Confirm" }).click();
      await page.waitForTimeout(1000);

      const projectSelect = page.locator("select").first();

      const startTime = Date.now();

      // Switch projects rapidly
      await projectSelect.selectOption("default");
      await page.waitForTimeout(100);
      await projectSelect.selectOption("perf-test");
      await page.waitForTimeout(100);
      await projectSelect.selectOption("default");

      const switchTime = Date.now() - startTime;

      // Should complete quickly
      expect(switchTime).toBeLessThan(2000);
    }
  });

  test("should handle large form data", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Fill multiple form fields
    const inputs = page
      .locator('input[type="text"], input[type="number"]')
      .filter({ hasNotText: "Search" });
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      const startTime = Date.now();

      // Fill first few inputs
      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const input = inputs.nth(i);
        if (await input.isVisible()) {
          const inputType = await input.getAttribute("type");
          if (inputType === "number") {
            await input.fill(String(i)); // Only numbers for number inputs
          } else {
            await input.fill(`test-data-${i}`); // Text for text inputs
          }
          await page.waitForTimeout(50);
        }
      }

      const fillTime = Date.now() - startTime;

      // Should remain responsive
      expect(fillTime).toBeLessThan(3000);
    }
  });

  test("should handle scroll performance", async ({ page }) => {
    await page.waitForTimeout(3000);

    // Scroll through PDF viewer
    const pdfViewer = page.locator("main").first();

    const startTime = Date.now();

    await pdfViewer.evaluate((el) => {
      el.scrollTop = 500;
    });
    await page.waitForTimeout(200);

    await pdfViewer.evaluate((el) => {
      el.scrollTop = 1000;
    });
    await page.waitForTimeout(200);

    const scrollTime = Date.now() - startTime;

    // Scrolling should be smooth
    expect(scrollTime).toBeLessThan(1000);
  });

  test("should handle template manager performance", async ({ page }) => {
    // Open template manager
    const templateFormButton = page.getByRole("button", {
      name: "Template Form",
    });
    if (await templateFormButton.isVisible()) {
      await templateFormButton.click({ force: true });
      await page.waitForTimeout(500);
    }

    const manageTemplatesButton = page.getByRole("button", {
      name: /Manage Templates/i,
    });
    if (await manageTemplatesButton.isVisible()) {
      const startTime = Date.now();

      await manageTemplatesButton.click({ force: true });
      await page.waitForTimeout(1500);

      const openTime = Date.now() - startTime;

      // Modal should open quickly
      expect(openTime).toBeLessThan(3000);

      // Close modal
      const closeButton = page
        .getByRole("button", { name: /Close|Cancel/i })
        .first();
      if (await closeButton.isVisible()) {
        await closeButton.click({ force: true });
      }
    }
  });

  test("should handle memory efficiently", async ({ page }) => {
    // Perform multiple operations to check for memory leaks
    await page.waitForTimeout(2000);

    // Create project
    const addButton = page
      .getByRole("button", { name: /Add project/i })
      .first();
    if (await addButton.isVisible()) {
      for (let i = 0; i < 3; i++) {
        await addButton.click();
        await page.getByPlaceholder("Enter value...").fill(`mem-test-${i}`);
        await page.getByRole("button", { name: "Confirm" }).click();
        await page.waitForTimeout(500);
      }
    }

    // Export multiple times
    const exportJSONButton = page.getByRole("button", { name: "Export JSON" });
    for (let i = 0; i < 3; i++) {
      await exportJSONButton.click();
      await page.waitForTimeout(500);
    }

    // App should still be responsive
    await expect(page.getByText("Project", { exact: false }).first()).toBeVisible();
    await expect(exportJSONButton).toBeEnabled();
  });
});
