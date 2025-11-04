import { test, expect } from '@playwright/test';

test.describe('Lector Review - Project Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
  });

  test('should create a new project', async ({ page }) => {
    // Click add project button
    await page.getByRole('button', { name: 'Add project' }).click();

    // Wait for modal to appear
    await expect(page.getByText('Create New Project')).toBeVisible();

    // Fill in project name
    await page.getByPlaceholder('Enter value...').fill('Test Project');

    // Click confirm button
    await page.getByRole('button', { name: 'Confirm' }).click();

    // Wait for modal to close
    await expect(page.getByText('Create New Project')).not.toBeVisible();

    // Check project is selected
    const projectSelect = page.locator('select').first();
    await expect(projectSelect).toContainText('Test Project');
  });

  test('should switch between projects', async ({ page }) => {
    // Create a new project
    await page.getByRole('button', { name: 'Add project' }).click();

    // Wait for modal and fill in project name
    await expect(page.getByText('Create New Project')).toBeVisible();
    await page.getByPlaceholder('Enter value...').fill('Project A');
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByText('Create New Project')).not.toBeVisible();

    // Enter data in Project A
    const studyIdInput = page.getByPlaceholder(/10.1161\/STROKEAHA/);
    await studyIdInput.fill('ProjectA-Data');

    // Switch back to default project
    await page.locator('select').first().selectOption('default');

    // Check data is different (should be empty or different)
    await expect(studyIdInput).not.toHaveValue('ProjectA-Data');

    // Switch back to Project A
    await page.locator('select').first().selectOption('Project A');

    // Check data persists
    await expect(studyIdInput).toHaveValue('ProjectA-Data');
  });

  test('should not delete default project', async ({ page }) => {
    // Try to delete default project
    await page.getByRole('button', { name: 'Delete project' }).click();

    // Check for error toast message (may auto-dismiss)
    await expect(page.getByText(/Cannot delete default project/i)).toBeVisible({ timeout: 3000 });
  });

  test('should delete a custom project', async ({ page }) => {
    // Create a new project
    await page.getByRole('button', { name: 'Add project' }).click();

    // Wait for modal and fill in project name
    await expect(page.getByText('Create New Project')).toBeVisible();
    await page.getByPlaceholder('Enter value...').fill('To Delete');
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByText('Create New Project')).not.toBeVisible();

    // Delete the project
    await page.getByRole('button', { name: 'Delete project' }).click();

    // Wait for confirm modal to appear
    await expect(page.getByRole('heading', { name: 'Delete Project' })).toBeVisible();

    // Click confirm button
    await page.getByRole('button', { name: 'Confirm' }).click();

    // Wait for modal to close
    await expect(page.getByRole('heading', { name: 'Delete Project' })).not.toBeVisible();

    // Check project is removed and switched to default
    const projectSelect = page.locator('select').first();
    await expect(projectSelect).toHaveValue('default');
  });
});
