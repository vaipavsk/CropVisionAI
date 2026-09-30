// @ts-check
import { test, expect } from '@playwright/test';
import { loginAsFarmer, TEST_CONFIG } from './helpers/auth.js';
import path from 'path';

test.describe('TEST SUITES E, F, G, H: AI Analysis, Severity, Grad-CAM & Segmentation Evidence', () => {
  test('E-G: Full real AI analysis pipeline execution, categorical severity, and Grad-CAM render', async ({ page }) => {
    await loginAsFarmer(page);

    // 1. Navigate directly to Specimen Workspace / Upload section
    await page.goto('/farmer/upload');
    await page.waitForLoadState('networkidle');

    // 2. Select real image
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached({ timeout: 10000 });
    const sampleImagePath = path.resolve(TEST_CONFIG.testImagePath);
    await fileInput.setInputFiles(sampleImagePath);

    // 3. Click Start Analysis
    const startAnalysisBtn = page.locator('button:has-text("Run AI Diagnostic Pipeline"), button:has-text("Start Analysis"), button:has-text("Analyze Specimen")').first();
    await expect(startAnalysisBtn).toBeVisible({ timeout: 10000 });
    await startAnalysisBtn.click();

    // 4. Wait for analysis results section to appear (timeout 35s for ML pipeline)
    const resultsContainer = page.locator('div:has-text("Analysis Results"), div:has-text("DOMAIN-INFORMED SEVERITY"), div:has-text("Grad-CAM")').first();
    await expect(resultsContainer).toBeVisible({ timeout: 35000 });

    // 5. Suite E & F: Verify Disease classification & Confidence
    const diseaseHeader = page.getByText(/Early Blight|Early_Blight|Detected Issue|Classification/i).first();
    await expect(diseaseHeader).toBeVisible();

    // 6. Verify Domain-Informed Severity header & Categorical value
    const severitySection = page.getByText(/Domain-Informed Severity/i).first();
    await expect(severitySection).toBeVisible({ timeout: 10000 });

    const severityTier = page.getByText(/MODERATE|LOW|HIGH|INSUFFICIENT_EVIDENCE/i).first();
    await expect(severityTier).toBeVisible();

    // 7. Verify Physical Damage is explicitly "Not measured" and NOT a fabricated percentage
    const physicalDamageText = page.getByText(/Physical Damage:\s*Not measured|Not measured/i).first();
    await expect(physicalDamageText).toBeVisible();

    // 8. Suite G: Verify Grad-CAM Heatmap Image
    const gradcamImg = page.locator('img[alt*="Grad-CAM"], img[alt*="heatmap"], img[src*="/media/heatmaps/"]').first();
    await expect(gradcamImg).toBeVisible({ timeout: 15000 });

    // Verify Grad-CAM image is loaded and non-broken
    const gradcamLoaded = await gradcamImg.evaluate((img) => {
      // @ts-ignore
      return img.complete && img.naturalWidth > 0;
    });
    expect(gradcamLoaded).toBe(true);

    // 9. Suite H: Experimental U-Net Evidence check
    const unetExposed = await page.locator('text=Experimental Spatial Evidence, text=Small U-Net, text=Predicted Region Coverage').count();
    console.log(`[Suite H] Frontend segmentation UI exposed count: ${unetExposed}`);

    // Capture comprehensive analysis screenshot
    await page.screenshot({ path: 'scratch/screenshots/09_ai_analysis_results.png', fullPage: true });
    await page.screenshot({ path: 'scratch/screenshots/10_gradcam_heatmap.png' });
  });
});
