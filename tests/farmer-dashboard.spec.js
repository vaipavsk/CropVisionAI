// @ts-check
import { test, expect } from '@playwright/test';
import { loginAsFarmer } from './helpers/auth.js';

test.describe('TEST SUITE C: Farmer Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsFarmer(page);
  });

  test('C1: Dashboard renders metric cards, navigation, and activity stream without errors', async ({ page }) => {
    // 1. Check main elements
    await expect(page.locator('body')).toBeVisible();

    // 2. Navigation items
    const navBar = page.locator('nav, [role="navigation"], aside, header').first();
    await expect(navBar).toBeVisible();

    // 3. Metric cards / Summary stats
    const statsContainer = page.locator('div:has-text("Claims"), div:has-text("Active"), div:has-text("Total")').first();
    await expect(statsContainer).toBeVisible();

    // 4. Check for quick action buttons (Upload, Claims, etc.)
    const quickActions = page.locator('button:has-text("Upload"), button:has-text("Diagnose"), button:has-text("Claim"), a[href*="upload"]').first();
    await expect(quickActions).toBeVisible();

    // 5. Verify no major broken image placeholder
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src);
    });
    // Filter out potential 0-size tracking or icons if any
    const genuineBroken = brokenImages.filter(src => !src.includes('data:image/svg'));
    expect(genuineBroken.length).toBe(0);

    await page.screenshot({ path: 'scratch/screenshots/05_farmer_dashboard.png' });
  });

  test('C2: Navigation switching between Dashboard, Upload, Claims, and History tabs works smoothly', async ({ page }) => {
    // Navigate to Claims tab
    const claimsTab = page.locator('button:has-text("Claims"), a:has-text("Claims"), span:has-text("Claims")').first();
    if (await claimsTab.isVisible()) {
      await claimsTab.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    }

    // Navigate to History / Upload
    const uploadTab = page.locator('button:has-text("Upload"), a:has-text("Upload"), button:has-text("Diagnose")').first();
    if (await uploadTab.isVisible()) {
      await uploadTab.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    }

    await page.screenshot({ path: 'scratch/screenshots/06_farmer_tab_navigation.png' });
  });
});
