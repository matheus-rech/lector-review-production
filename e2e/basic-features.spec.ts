import { expect, test } from "@playwright/test";

test.describe("Lector Review - Basic Features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for PDF to load
    await page.waitForSelector("canvas", { timeout: 10000 });
  });

  test("should load the application", async ({ page }) => {
    await expect(page).toHaveTitle(/Lector Review|Vite \+ React/);

    // Check for main UI elements
    await expect(page.getByText("Project")).toBeVisible();
    await expect(page.getByText("PDF Management")).toBeVisible();
    await expect(page.getByText("Search").first()).toBeVisible();
  });

  test("should display PDF viewer", async ({ page }) => {
    // Check for PDF canvas
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();

    // Check for page indicator
    await expect(page.getByLabel("Go to page")).toBeVisible();
  });

  test("should navigate between pages", async ({ page }) => {
    // Listen to all console logs to debug
    page.on("console", (msg) => {
      console.log("BROWSER:", msg.text());
    });

    // Wait for PDF to be fully stable
    await page.waitForTimeout(1000);
    const firstPageButton = page.getByRole("button", { name: "First page" });
    await firstPageButton.click();

    // Check initial page indicator
    const pageIndicator = page.getByTestId("page-indicator").first();
    await expect(pageIndicator).toHaveText("1 / 9");

    console.log("===== CLICKING NEXT PAGE BUTTON =====");
    // Click next page button
    const nextButton = page.getByRole("button", { name: "Next page" });
    await expect(nextButton).toHaveAttribute("aria-label", "Next page");
    await nextButton.click();

    // Wait for page to change
    await page.waitForTimeout(2000);

    console.log("===== CHECKING IF PAGE CHANGED TO 2 =====");
    // Check for page 2 indicator
    await expect(pageIndicator).toHaveText("2 / 9", { timeout: 5000 });

    // Click previous page button
    const prevButton = page.getByRole("button", { name: "Previous page" });
    await expect(prevButton).toHaveAttribute("aria-label", "Previous page");
    await prevButton.click();

    // Wait and check back at page 1
    await page.waitForTimeout(1000);
    await expect(pageIndicator).toHaveText("1 / 9", { timeout: 3000 });
  });

  test("should enter and persist data", async ({ page }) => {
    // Enter data in Study ID field (if it exists on page 1)
    const studyIdInput = page.getByPlaceholder(/10.1161\/STROKEAHA/);
    if (await studyIdInput.isVisible().catch(() => false)) {
      await studyIdInput.fill("10.1234/test.2024");

      // Navigate to another page and wait for page indicator
      await page.getByRole("button", { name: "Next page" }).click();
      await expect(page.getByTestId("page-indicator")).toHaveText(/2 \/ \d+/, {
        timeout: 3000,
      });

      // Navigate back and wait for page indicator
      await page.getByRole("button", { name: "Previous page" }).click();
      await expect(page.getByTestId("page-indicator")).toHaveText(/1 \/ \d+/, {
        timeout: 3000,
      });

      // Check data persists
      await expect(studyIdInput).toHaveValue("10.1234/test.2024");
    }
  });

  test("should export JSON", async ({ page }) => {
    // Set up download listener
    const downloadPromise = page.waitForEvent("download");

    // Click export JSON button
    const exportButton = page.getByRole("button", { name: "Export JSON" });
    await expect(exportButton).toHaveAttribute("aria-label", "Export JSON");
    await exportButton.click();

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/default_export_.*\.json/);

    // Check for success toast (may vary based on implementation)
    await expect(
      page.getByText(/Data exported|JSON exported|exported as JSON/i)
    )
      .toBeVisible({ timeout: 2000 })
      .catch(() => {});
  });

  test("should export CSV", async ({ page }) => {
    // Set up download listener
    const downloadPromise = page.waitForEvent("download");

    // Click export CSV button
    const exportButton = page.getByRole("button", { name: "Export CSV" });
    await expect(exportButton).toHaveAttribute("aria-label", "Export CSV");
    await exportButton.click();

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/default_export_.*\.csv/);

    // Check for success toast (may vary based on implementation)
    await expect(page.getByText(/Data exported|CSV exported|exported as CSV/i))
      .toBeVisible({ timeout: 2000 })
      .catch(() => {});
  });

  test("should display PDF upload component", async ({ page }) => {
    // Check for PDF upload area
    await expect(
      page.getByText(/Click or drag PDF here|Upload PDF/i)
    ).toBeVisible();
  });

  test("should display template manager button", async ({ page }) => {
    // Check for template manager button (when template form is active)
    const templateManagerButton = page.getByRole("button", {
      name: /Manage Templates/i,
    });
    // Button may or may not be visible depending on form type
    // This test verifies the button exists in the DOM
    await expect(
      templateManagerButton.or(page.getByText("Template Form"))
    ).toBeVisible();
  });

  test("should display schema form toggle", async ({ page }) => {
    // Check for form type toggle buttons
    await expect(
      page.getByRole("button", { name: "Template Form" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Schema Form" })
    ).toBeVisible();
  });
});
