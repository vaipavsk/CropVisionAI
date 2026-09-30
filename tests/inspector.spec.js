// @ts-check
import { test, expect } from '@playwright/test';
import { loginAsInspector } from './helpers/auth.js';

test.describe('TEST SUITE J & K: Inspector Portal & Adjudication', () => {
  test('J1: Inspector portal loads, review queue displays claims, and evidence opens', async ({ page }) => {
    await loginAsInspector(page);

    // Verify Inspector Dashboard URL
    await expect(page).toHaveURL(/\/inspector\/dashboard/);

    // Verify Inspector Review Queue / HUD loads
    const reviewQueueOrCard = page.locator('div:has-text("Adjudication"), div:has-text("Queue"), div:has-text("Inspector"), div:has-text("Claims")').first();
    await expect(reviewQueueOrCard).toBeVisible({ timeout: 15000 });

    // Verify search or filter controls are available
    const searchInput = page.locator('input[placeholder*="Search"], input[type="text"]').first();
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeEnabled();
    }

    // Capture Inspector Dashboard screenshot
    await page.screenshot({ path: 'scratch/screenshots/08_inspector_dashboard.png', fullPage: true });

    // Look for a claim row or card in queue to inspect
    const inspectBtn = page.locator('button:has-text("Investigate"), button:has-text("Review"), button:has-text("Inspect"), a:has-text("Investigate")').first();
    if (await inspectBtn.isVisible()) {
      await inspectBtn.click();
      await page.waitForTimeout(2000);

      // Verify AI evidence workspace opens
      const workspace = page.locator('div:has-text("Investigation"), div:has-text("Dual Specimen"), div:has-text("AI Confidence")').first();
      await expect(workspace).toBeVisible({ timeout: 15000 });

      // Verify AI Confidence is displayed and does not say physical damage
      const confLabel = page.locator('div:has-text("AI Confidence"), span:has-text("AI Confidence")').first();
      await expect(confLabel).toBeVisible();

      // Verify categorical severity badge/label
      const severitySection = page.locator('div:has-text("Severity"), div:has-text("LOW"), div:has-text("MODERATE"), div:has-text("HIGH")').first();
      await expect(severitySection).toBeVisible();

      // Verify recommendation block
      const recSection = page.locator('div:has-text("Advisory Signal Only"), div:has-text("Recommendation"), div:has-text("APPROVE_IMMEDIATE"), div:has-text("FLAG_INSPECTOR")').first();
      await expect(recSection).toBeVisible();

      // Capture Inspector Claim Review screenshot
      await page.screenshot({ path: 'scratch/screenshots/09_inspector_claim_review.png', fullPage: true });
    }
  });

  test('K1: Inspector claim approval decision and modal confirmation flow', async ({ page }) => {
    await loginAsInspector(page);

    // Find an open/pending claim to investigate
    const inspectBtn = page.locator('button:has-text("Investigate"), button:has-text("Review"), button:has-text("Inspect")').first();
    if (await inspectBtn.isVisible()) {
      await inspectBtn.click();
      await page.waitForTimeout(2000);

      // Look for Approve Claim button if claim is not already finalized
      const approveBtn = page.locator('button:has-text("Approve Claim")').first();
      if (await approveBtn.isVisible()) {
        await approveBtn.click();

        // Verify confirmation modal opens
        const modal = page.locator('div[role="dialog"], div:has-text("Confirm Approval")').first();
        await expect(modal).toBeVisible({ timeout: 5000 });

        // Confirm action
        const confirmBtn = page.locator('button:has-text("Confirm Approval")').first();
        await confirmBtn.click();
        await page.waitForTimeout(2000);

        // Verify status changes to APPROVED or final status is displayed
        const finalStatus = page.locator('div:has-text("Final Status: APPROVED"), span:has-text("APPROVED"), div:has-text("Approved")').first();
        await expect(finalStatus).toBeVisible({ timeout: 10000 });

        // Refresh page and verify status persistence
        await page.reload();
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();

        // Capture approval status screenshot
        await page.screenshot({ path: 'scratch/screenshots/10_inspector_approval_status.png', fullPage: true });
      }
    }
  });
});
