// @ts-check

export const TEST_CONFIG = {
  farmerEmail: process.env.TEST_FARMER_EMAIL || 'test_sync_farmer_2026@cropvision.ai',
  farmerPassword: process.env.TEST_FARMER_PASSWORD || 'TestPassword123!',
  inspectorEmail: process.env.TEST_INSPECTOR_EMAIL || 'test_sync_inspector_2026@cropvision.ai',
  inspectorPassword: process.env.TEST_INSPECTOR_PASSWORD || 'TestPassword123!',
  testImagePath: 'ai-service/app/reports/heatmaps/audit_10_Potato_Early_Blight.jpg',
};

/**
 * Log in as a Farmer using the UI
 * @param {import('@playwright/test').Page} page
 */
export async function loginAsFarmer(page) {
  await page.goto('/farmer/login');
  await page.waitForLoadState('networkidle');
  
  // Fill credentials
  await page.locator('input[type="email"], input[name="email"]').fill(TEST_CONFIG.farmerEmail);
  await page.locator('input[type="password"], input[name="password"]').fill(TEST_CONFIG.farmerPassword);
  
  // Submit
  await page.locator('button[type="submit"]').click();
  
  // Wait for redirect to farmer dashboard
  await page.waitForURL(/\/farmer\/dashboard/, { timeout: 20000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Log in as an Inspector using the UI
 * @param {import('@playwright/test').Page} page
 */
export async function loginAsInspector(page) {
  await page.goto('/inspector/login');
  await page.waitForLoadState('networkidle');
  
  // Fill credentials
  await page.locator('input[type="email"], input[name="email"]').fill(TEST_CONFIG.inspectorEmail);
  await page.locator('input[type="password"], input[name="password"]').fill(TEST_CONFIG.inspectorPassword);
  
  // Submit
  await page.locator('button[type="submit"]').click();
  
  // Wait for redirect to inspector dashboard
  await page.waitForURL(/\/inspector\/dashboard/, { timeout: 20000 });
  await page.waitForLoadState('networkidle');
}
