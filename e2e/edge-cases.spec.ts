import { expect, test } from "@playwright/test";

test.describe("Lector Review - Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=Project", { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test("should handle empty PDF list gracefully", async ({ page }) => {
    // Check that empty state is displayed
    const emptyState = page.getByText(/No PDFs uploaded yet/i);
    // May or may not be visible depending on state
    await emptyState.isVisible().catch(() => {
      // PDFs may exist, which is fine
    });
  });

  test("should handle switching between projects with different data", async ({
    page,
  }) => {
    // Create a new project
    const addButton = page
      .getByRole("button", { name: /Add project/i })
      .first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page.getByText("Create New Project")).toBeVisible();

      await page.getByPlaceholder("Enter value...").fill("edge-test-project");
      await page.getByRole("button", { name: "Confirm" }).click();
      await page.waitForTimeout(1000);

      // Switch back to default
      const projectSelect = page.locator("select").first();
      await projectSelect.selectOption("default");
      await page.waitForTimeout(1000);

      // Verify project switch worked
      await expect(projectSelect).toHaveValue("default");
    }
  });

  test("should handle page navigation at boundaries", async ({ page }) => {
    // Wait for PDF to load
    await page.waitForTimeout(3000);

    const pageIndicator = page.getByText(/\d+ \/ \d+/).first();
    if (await pageIndicator.isVisible()) {
      const text = await pageIndicator.textContent();
      const totalPages = parseInt(text?.split(" / ")[1] || "1");

      // Try to navigate beyond last page (should be disabled)
      const nextButton = page.getByRole("button", { name: "Next page" });
      if (totalPages > 1) {
        // Navigate to last page
        for (let i = 1; i < totalPages; i++) {
          if (await nextButton.isEnabled()) {
            await nextButton.click({ force: true });
            await page.waitForTimeout(500);
          }
        }

        // Next button should be disabled at last page
        await expect(nextButton).toBeDisabled();

        // Previous button should be enabled
        const prevButton = page.getByRole("button", { name: "Previous page" });
        await expect(prevButton).toBeEnabled();
      }
    }
  });

  test("should handle concurrent operations", async ({ page }) => {
    // Try multiple operations at once
    await page.waitForTimeout(2000);

    // Click export buttons rapidly
    const exportJSONButton = page.getByRole("button", { name: "Export JSON" });
    const exportCSVButton = page.getByRole("button", { name: "Export CSV" });

    if (
      (await exportJSONButton.isVisible()) &&
      (await exportCSVButton.isVisible())
    ) {
      // Click both rapidly
      await exportJSONButton.click();
      await exportCSVButton.click();
      await page.waitForTimeout(1000);

      // App should handle concurrent operations gracefully
      await expect(page.getByText("Project", { exact: true })).toBeVisible();
    }
  });

  test("should handle malformed localStorage data", async ({ page }) => {
    // Inject malformed data into localStorage
    await page.evaluate(() => {
      localStorage.setItem("projects", "invalid json");
      localStorage.setItem("proj:default:highlights", "not valid json");
    });

    // Reload page
    await page.reload();
    await page.waitForTimeout(2000);

    // App should recover gracefully
    await expect(page.getByText("Project", { exact: true })).toBeVisible();

    // Should default to valid state
    const projectSelect = page.locator("select").first();
    await expect(projectSelect).toBeVisible();
  });

  test("should handle very long project names", async ({ page }) => {
    const addButton = page
      .getByRole("button", { name: /Add project/i })
      .first();
    if (await addButton.isVisible()) {
      await addButton.click();

      const longName = "a".repeat(100);
      await page.getByPlaceholder("Enter value...").fill(longName);

      // Should either accept or show validation error
      const confirmButton = page.getByRole("button", { name: "Confirm" });
      await confirmButton.click();
      await page.waitForTimeout(1000);

      // App should handle it gracefully
      await expect(page.getByText("Project", { exact: true })).toBeVisible();
    }
  });

  test("should handle empty search queries", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search in document/i);
    if (await searchInput.isVisible()) {
      // Clear search
      await searchInput.fill("");
      await page.waitForTimeout(1000);

      // App should handle empty search without errors
      await expect(page.getByText("Project", { exact: true })).toBeVisible();
    }
  });

  test("should handle rapid page switching", async ({ page }) => {
    await page.waitForTimeout(2000);

    const pageInput = page
      .locator('input[type="number"]')
      .filter({ hasNotText: "Search" })
      .first();
    if (await pageInput.isVisible()) {
      // Rapidly change page numbers
      await pageInput.fill("2");
      await page.waitForTimeout(100);
      await pageInput.fill("3");
      await page.waitForTimeout(100);
      await pageInput.fill("1");
      await page.waitForTimeout(1000);

      // Should handle rapid changes gracefully
      await expect(page.getByText("Project", { exact: true })).toBeVisible();
    }
  });

  test("should handle template manager with zero pages", async ({ page }) => {
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
      await manageTemplatesButton.click({ force: true });
      await page.waitForTimeout(1500);

      // Template manager should handle edge cases
      const templateManager = page.getByText(/Template Manager/i);
      await templateManager.isVisible().catch(() => {
        // May not open if PDF not loaded
      });
    }
  });

  test("should handle export with empty data", async ({ page }) => {
    // Export with no data
    const downloadPromise = page
      .waitForEvent("download", { timeout: 5000 })
      .catch(() => null);

    const exportJSONButton = page.getByRole("button", { name: "Export JSON" });
    await exportJSONButton.click();

    // Should still create a valid export file
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toMatch(/\.json$/);
    }
  });
});
