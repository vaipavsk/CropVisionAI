// @ts-check
import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'Desktop (1440x900)', width: 1440, height: 900 },
  { name: 'Laptop (1366x768)', width: 1366, height: 768 },
  { name: 'Tablet (768x1024)', width: 768, height: 1024 },
  { name: 'Mobile (390x844)', width: 390, height: 844 },
];

test.describe('TEST SUITE N & O: Responsive UI & Accessibility Basics', () => {
  for (const vp of VIEWPORTS) {
    test(`N: Responsive layout check on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verify core page structure renders
      await expect(page.locator('body')).toBeVisible();

      // Check horizontal overflow (scrollWidth vs window width)
      const overflowMetrics = await page.evaluate(() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        return {
          docWidth,
          scrollWidth,
          hasOverflow: scrollWidth > docWidth + 5,
        };
      });

      console.log(`[Responsive Check - ${vp.name}] Document width: ${overflowMetrics.docWidth}px, Scroll width: ${overflowMetrics.scrollWidth}px, Overflow: ${overflowMetrics.hasOverflow}`);
      expect(overflowMetrics.hasOverflow).toBe(false);

      // Verify navigation or header controls exist
      const navOrHeader = page.locator('header, nav, button[aria-label*="menu"], a:has-text("Portal")').first();
      await expect(navOrHeader).toBeVisible();

      // Capture responsive screenshot
      const safeName = vp.name.replace(/[^a-zA-Z0-9]/g, '_');
      await page.screenshot({ path: `scratch/screenshots/responsive_${safeName}.png`, fullPage: false });
    });
  }

  test('O1: Accessibility Basics - Interactive elements have labels, inputs have attributes, and keyboard focus is functional', async ({ page }) => {
    await page.goto('/farmer/login');
    await page.waitForLoadState('networkidle');

    // Verify email and password input fields have accessible labels or placeholders
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible();
    const hasEmailAttr = await emailInput.evaluate((el) => Boolean(el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.id));
    expect(hasEmailAttr).toBe(true);

    const passInput = page.locator('input[type="password"], input[name="password"]').first();
    await expect(passInput).toBeVisible();
    const hasPassAttr = await passInput.evaluate((el) => Boolean(el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.id));
    expect(hasPassAttr).toBe(true);

    // Verify submit button has accessible text name
    const submitBtn = page.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeVisible();
    const btnText = await submitBtn.innerText();
    expect(btnText.trim().length).toBeGreaterThan(0);

    // Test tab navigation (Keyboard accessibility)
    await emailInput.focus();
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeTruthy();
  });
});
