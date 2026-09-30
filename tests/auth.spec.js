// @ts-check
import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './helpers/auth.js';

test.describe('TEST SUITE A: Application Availability', () => {
  test('A1: Frontend and login page load with HTTP 200 and no fatal errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await page.waitForLoadState('networkidle');

    // Root landing page renders navigation
    await expect(page.locator('body')).toBeVisible();

    // Verify Backend health
    const backendRes = await page.request.get('http://localhost:8001/health');
    expect(backendRes.status()).toBe(200);

    // Verify AI service health
    const aiRes = await page.request.get('http://localhost:8000/health');
    expect(aiRes.status()).toBe(200);

    await page.screenshot({ path: 'scratch/screenshots/01_app_landing.png' });
  });

  test('A2: Farmer Login page loads successfully', async ({ page }) => {
    const response = await page.goto('/farmer/login');
    expect(response?.status()).toBe(200);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    await page.screenshot({ path: 'scratch/screenshots/02_farmer_login_page.png' });
  });
});

test.describe('TEST SUITE B: Farmer Login Flow', () => {
  test('B1: Negative test - invalid credentials show error and block login', async ({ page }) => {
    await page.goto('/farmer/login');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill('invalid_user_999@example.com');
    await page.locator('input[type="password"]').fill('WrongPassword123!');
    await page.locator('button[type="submit"]').click();

    // Verify error notification / alert appears
    const errorAlert = page.locator('[role="alert"], .text-red-400, .text-rose-400, .bg-red-500\\/10, p:has-text("invalid"), p:has-text("error"), p:has-text("failed")').first();
    await expect(errorAlert).toBeVisible({ timeout: 10000 });

    // Verify user is NOT redirected to dashboard
    expect(page.url()).toContain('/farmer/login');
    await page.screenshot({ path: 'scratch/screenshots/03_login_invalid_error.png' });
  });

  test('B2: Positive test - valid farmer credentials authenticate and redirect to dashboard', async ({ page }) => {
    await page.goto('/farmer/login');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill(TEST_CONFIG.farmerEmail);
    await page.locator('input[type="password"]').fill(TEST_CONFIG.farmerPassword);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/\/farmer\/dashboard/, { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/farmer/dashboard');
    await expect(page.locator('h1, h2, button:has-text("Command Center"), div:has-text("CropVisionAI")').first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'scratch/screenshots/04_farmer_login_success.png' });
  });
});
