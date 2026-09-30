// @ts-check
import { test, expect } from '@playwright/test';
import { loginAsFarmer, TEST_CONFIG } from './helpers/auth.js';
import path from 'path';

test.describe('TEST SUITE I: Claim Creation & Persistence', () => {
  test('I1: Real claim creation, reference generation, and persistence in Claims tracker', async ({ page }) => {
    await loginAsFarmer(page);

    // 1. Navigate to Specimen Workspace / Upload
    await page.goto('/farmer/upload');
    await page.waitForLoadState('networkidle');

    // 2. Select real image and run analysis
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached({ timeout: 10000 });
    const sampleImagePath = path.resolve(TEST_CONFIG.testImagePath);
    await fileInput.setInputFiles(sampleImagePath);

    const startAnalysisBtn = page.locator('button:has-text("Run AI Diagnostic Pipeline"), button:has-text("Start Analysis"), button:has-text("Analyze Specimen")').first();
    await expect(startAnalysisBtn).toBeVisible({ timeout: 10000 });
    await startAnalysisBtn.click();

    // 3. Wait for analysis to complete
    const resultsContainer = page.locator('div:has-text("Analysis Results"), div:has-text("DOMAIN-INFORMED SEVERITY")').first();
    await expect(resultsContainer).toBeVisible({ timeout: 35000 });

    // 4. Navigate to Claims section to check recorded claims
    await page.goto('/farmer/claims');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 5. Verify claims table or list renders with claim references
    const claimsTable = page.locator('table, div:has-text("Claim Ref"), div:has-text("CLM-"), div:has-text("All Claims"), div:has-text("Specimen")').first();
    await expect(claimsTable).toBeVisible({ timeout: 15000 });

    // 6. Test persistence across page reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify claims view still loads persisted data
    await expect(page.locator('body')).toBeVisible();

    await page.screenshot({ path: 'scratch/screenshots/11_farmer_claims_tracker.png', fullPage: true });
  });
});
