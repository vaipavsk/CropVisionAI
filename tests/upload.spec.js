// @ts-check
import { test, expect } from '@playwright/test';
import { loginAsFarmer, TEST_CONFIG } from './helpers/auth.js';
import path from 'path';

test.describe('TEST SUITE D: Upload Center', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsFarmer(page);
    // Navigate directly to Specimen Workspace / Upload section
    await page.goto('/farmer/upload');
    await page.waitForLoadState('networkidle');
  });

  test('D1: Upload center renders dropzone and accepts valid crop image', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached({ timeout: 10000 });

    const sampleImagePath = path.resolve(TEST_CONFIG.testImagePath);
    await fileInput.setInputFiles(sampleImagePath);

    // Verify image preview appears
    const previewImg = page.locator('img[alt*="preview"], img[alt*="crop"], img[src^="blob:"]').first();
    await expect(previewImg).toBeVisible({ timeout: 10000 });

    // Verify button to start analysis is active
    const startAnalysisBtn = page.locator('button:has-text("Run AI Diagnostic Pipeline"), button:has-text("Start Analysis"), button:has-text("Analyze Specimen")').first();
    await expect(startAnalysisBtn).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'scratch/screenshots/07_upload_preview.png', fullPage: true });
  });

  test('D2: Negative test - unsupported file extension shows validation error', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached({ timeout: 10000 });

    // Create a temporary unsupported file buffer
    await fileInput.setInputFiles({
      name: 'invalid_document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 fake pdf data'),
    });

    // Verify validation error message appears or rejection state
    const errorMsg = page.locator('[role="alert"], .text-rose-400, .text-red-500, p:has-text("valid image"), p:has-text("JPG"), p:has-text("PNG"), p:has-text("unsupported"), div:has-text("invalid")').first();
    await expect(errorMsg).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'scratch/screenshots/08_upload_unsupported_file_error.png', fullPage: true });
  });
});
