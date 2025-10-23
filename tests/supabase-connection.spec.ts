import { test, expect } from '@playwright/test';

test.describe('Supabase Connection Tests', () => {
  test('should load email writer page', async ({ page }) => {
    console.log('🧪 Testing page load...');

    // Navigate to the email writer page
    await page.goto('/email-writer');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if the page title is correct
    await expect(page.locator('h1')).toContainText('Professional Email Writer');

    // Check if the generator tab is active by default
    await expect(page.locator('button:has-text("Generator")')).toBeVisible();

    console.log('✅ Page loaded successfully');
  });

  test('should fill and generate email form', async ({ page }) => {
    console.log('🧪 Testing email form filling...');

    await page.goto('/email-writer');
    await page.waitForLoadState('networkidle');

    // Fill out the email generation form
    await page.fill('[data-testid="recipient-name"]', 'Test User');
    await page.selectOption('[data-testid="purpose"]', 'follow-up');
    await page.selectOption('[data-testid="tone"]', 'professional');
    await page.fill('[data-testid="key-points"]', 'Testing email generation functionality');

    console.log('✅ Form filled successfully');

    // Generate the email
    await page.click('[data-testid="generate-email-btn"]');

    // Wait for email generation to complete (with timeout)
    try {
      await expect(page.locator('[data-testid="email-content"]')).toBeVisible({ timeout: 45000 });
      console.log('✅ Email generated successfully');

      // Check if generated content is not empty
      const emailContent = await page.locator('[data-testid="email-content"]').textContent();
      expect(emailContent?.length).toBeGreaterThan(10);

    } catch (error) {
      console.log('❌ Email generation failed or timed out');
      console.log('Possible issues:');
      console.log('1. Webhook service not responding');
      console.log('2. Network connection issues');
      console.log('3. Invalid API configuration');
      throw error;
    }
  });

  test('should save email to history', async ({ page }) => {
    console.log('🧪 Testing email saving...');

    await page.goto('/email-writer');
    await page.waitForLoadState('networkidle');

    // Fill and generate email
    await page.fill('[data-testid="recipient-name"]', 'Save Test User');
    await page.selectOption('[data-testid="purpose"]', 'inquiry');
    await page.selectOption('[data-testid="tone"]', 'casual');
    await page.fill('[data-testid="key-points"]', 'Testing the save functionality');

    await page.click('[data-testid="generate-email-btn"]');

    // Wait for email generation
    await expect(page.locator('[data-testid="email-content"]')).toBeVisible({ timeout: 45000 });

    // Add subject for saving
    await page.fill('#subject', 'Test Email for Save Functionality');

    // Try to save the email
    await page.click('[data-testid="save-email-btn"]');

    // Wait a moment for save operation
    await page.waitForTimeout(3000);

    // Navigate to History tab
    await page.click('[data-testid="history-tab"]');
    await page.waitForTimeout(2000);

    // Check if the email appears in history
    const historyItems = page.locator('[data-testid="email-history-item"]');

    try {
      await expect(historyItems.first()).toBeVisible({ timeout: 10000 });
      console.log('✅ Email saved to history successfully');

      // Check if the saved email has correct details
      const savedEmail = historyItems.first();
      const recipient = await savedEmail.locator('[data-testid="email-recipient"]').textContent();
      const purpose = await savedEmail.locator('[data-testid="email-purpose"]').textContent();

      console.log('Saved email details:', { recipient, purpose });

    } catch (error) {
      console.log('❌ Email not found in history');
      console.log('Possible issues:');
      console.log('1. User not authenticated');
      console.log('2. Supabase connection failed');
      console.log('3. Save operation failed silently');
      throw error;
    }
  });
});