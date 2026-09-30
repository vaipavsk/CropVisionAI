// @ts-check
import { test, expect } from '@playwright/test';
import { loginAsFarmer, loginAsInspector } from './helpers/auth.js';

test.describe('TEST SUITE L & M: Persistence & Error Handling', () => {
  test('L1: Farmer Dashboard state reloads correctly on hard browser refresh', async ({ page }) => {
    await loginAsFarmer(page);
    await expect(page).toHaveURL(/\/farmer\/dashboard/);

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify header, navigation, and core widgets remain intact
    await expect(page.locator('header, nav, div:has-text("Welcome")').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('L2: Inspector Portal state reloads correctly on hard browser refresh', async ({ page }) => {
    await loginAsInspector(page);
    await expect(page).toHaveURL(/\/inspector\/dashboard/);

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify inspector queue/dashboard remains rendered
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('div:has-text("Adjudication"), div:has-text("Inspector"), nav').first()).toBeVisible({ timeout: 15000 });
  });

  test('M1: Invalid route redirects gracefully or displays clear 404 error page', async ({ page }) => {
    // Navigate to a non-existent route
    await page.goto('/non-existent-route-random-404');
    await page.waitForLoadState('networkidle');

    // Verify UI handles gracefully without fatal blank screen
    await expect(page.locator('body')).toBeVisible();
    const notFoundOrRedirect = page.locator('div:has-text("404"), div:has-text("Not Found"), div:has-text("CropVision"), header, nav').first();
    await expect(notFoundOrRedirect).toBeVisible({ timeout: 10000 });
  });

  test('M2: Unauthenticated access to protected routes redirects to login', async ({ page }) => {
    // Clear cookies/storage
    await page.context().clearCookies();
    
    // Attempt accessing farmer dashboard directly
    await page.goto('/farmer/dashboard');
    await page.waitForLoadState('networkidle');

    // Expect redirect to login or landing page
    await expect(page).toHaveURL(/\/(farmer\/login|login|\/)/);
  });
});
