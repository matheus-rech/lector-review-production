import { test, expect } from '@playwright/test';

test.describe('Lector Review - Basic Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for PDF to load
    await page.waitForSelector('canvas', { timeout: 10000 });
  });

  test('should load the application', async ({ page }) => {
    await expect(page).toHaveTitle('Lector Review');
    
    // Check for main UI elements
    await expect(page.getByText('Project')).toBeVisible();
    await expect(page.getByText('PDF Source')).toBeVisible();
    await expect(page.getByText('Search')).toBeVisible();
  });

  test('should display PDF viewer', async ({ page }) => {
    // Check for PDF canvas
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    // Check for page indicator
    await expect(page.getByText(/1 \/ 9/)).toBeVisible();
  });

  test('should navigate between pages', async ({ page }) => {
    // Check initial page
    await expect(page.getByText(/1 \/ 9/)).toBeVisible();
    
    // Click next page button
    await page.getByRole('button', { name: '▶' }).click();
    await expect(page.getByText(/2 \/ 9/)).toBeVisible();
    
    // Click previous page button
    await page.getByRole('button', { name: '◀' }).click();
    await expect(page.getByText(/1 \/ 9/)).toBeVisible();
  });

  test('should enter and persist data', async ({ page }) => {
    // Enter data in Study ID field
    const studyIdInput = page.getByPlaceholder(/10.1161\/STROKEAHA/);
    await studyIdInput.fill('10.1234/test.2024');
    
    // Navigate to another page
    await page.getByRole('button', { name: '▶' }).click();
    await page.waitForTimeout(500);
    
    // Navigate back
    await page.getByRole('button', { name: '◀' }).click();
    await page.waitForTimeout(500);
    
    // Check data persists
    await expect(studyIdInput).toHaveValue('10.1234/test.2024');
  });

  test('should export JSON', async ({ page }) => {
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click export JSON button
    await page.getByRole('button', { name: 'Export JSON' }).click();
    
    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/default_export_.*\.json/);
    
    // Check for success toast
    await expect(page.getByText('JSON exported successfully')).toBeVisible();
  });

  test('should export CSV', async ({ page }) => {
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click export CSV button
    await page.getByRole('button', { name: 'Export CSV' }).click();
    
    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/default_export_.*\.csv/);
    
    // Check for success toast
    await expect(page.getByText('CSV exported successfully')).toBeVisible();
  });

  test('should toggle dark mode', async ({ page }) => {
    // Check initial state (light mode)
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);
    
    // Click dark mode toggle
    await page.getByRole('button', { name: '🌙' }).click();
    
    // Check dark mode is active
    await expect(html).toHaveClass(/dark/);
    
    // Toggle back to light mode
    await page.getByRole('button', { name: '☀️' }).click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test('should show help modal', async ({ page }) => {
    // Click help button
    await page.getByRole('button', { name: '❓ Help' }).click();
    
    // Check modal is visible
    await expect(page.getByText('Help & Keyboard Shortcuts')).toBeVisible();
    await expect(page.getByText('Getting Started')).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Help & Keyboard Shortcuts')).not.toBeVisible();
  });

  test('should use keyboard shortcuts', async ({ page }) => {
    // Test Ctrl+F for search focus
    await page.keyboard.press('Control+f');
    const searchInput = page.getByPlaceholder(/Search in PDF/);
    await expect(searchInput).toBeFocused();
    
    // Test Ctrl+D for dark mode toggle
    await page.keyboard.press('Control+d');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
