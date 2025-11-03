import { test, expect } from '@playwright/test';

test.describe('Lector Review - Project Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
  });

  test('should create a new project', async ({ page }) => {
    // Click add project button
    await page.getByRole('button', { name: '+' }).first().click();
    
    // Fill in project name in modal
    await expect(page.getByText('Create New Project')).toBeVisible();
    await page.getByPlaceholder(/e.g., Study 2024/).fill('Test Project');
    
    // Confirm creation
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Check project is selected
    const projectSelect = page.locator('select').first();
    await expect(projectSelect).toHaveValue('Test Project');
  });

  test('should switch between projects', async ({ page }) => {
    // Create a new project
    await page.getByRole('button', { name: '+' }).first().click();
    await page.getByPlaceholder(/e.g., Study 2024/).fill('Project A');
    await page.getByRole('button', { name: 'Create' }).click();
    
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
    await page.getByRole('button', { name: '🗑' }).first().click();
    
    // Check for error message in modal
    await expect(page.getByText(/Cannot delete default project/)).toBeVisible();
  });

  test('should delete a custom project', async ({ page }) => {
    // Create a new project
    await page.getByRole('button', { name: '+' }).first().click();
    await page.getByPlaceholder(/e.g., Study 2024/).fill('To Delete');
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Delete the project
    await page.getByRole('button', { name: '🗑' }).first().click();
    
    // Confirm deletion
    await expect(page.getByText(/Delete Project/)).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();
    
    // Check project is removed and switched to default
    const projectSelect = page.locator('select').first();
    await expect(projectSelect).toHaveValue('default');
  });
});
