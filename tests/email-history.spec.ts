import { test, expect } from '@playwright/test';

test.describe('Email History Saving to Supabase', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the email writer page
    await page.goto('/email-writer');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should generate and save email to history', async ({ page }) => {
    console.log('🧪 Testing email generation and saving...');

    // Step 1: Fill out the email generation form
    await page.fill('[data-testid="recipient-name"]', 'John Doe');
    await page.fill('[data-testid="purpose"]', 'Business meeting follow-up');
    await page.selectOption('[data-testid="tone"]', 'professional');
    await page.fill('[data-testid="key-points"]', 'Discuss project timeline, review deliverables, set next meeting');

    // Step 2: Generate the email
    await page.click('[data-testid="generate-email-btn"]');

    // Wait for email generation to complete
    await expect(page.locator('[data-testid="email-content"]')).toBeVisible({ timeout: 30000 });

    // Step 3: Save the email
    await page.click('[data-testid="save-email-btn"]');

    // Wait for save confirmation
    await expect(page.locator('[data-testid="save-success-toast"]')).toBeVisible({ timeout: 10000 });

    console.log('✅ Email generated and saved successfully');

    // Step 4: Navigate to History tab
    await page.click('[data-testid="history-tab"]');

    // Wait for history to load
    await page.waitForTimeout(2000);

    // Step 5: Verify the saved email appears in history
    const historyItems = page.locator('[data-testid="email-history-item"]');
    await expect(historyItems.first()).toBeVisible({ timeout: 15000 });

    // Verify the email details
    const savedEmail = historyItems.first();
    await expect(savedEmail.locator('[data-testid="email-recipient"]')).toContainText('John Doe');
    await expect(savedEmail.locator('[data-testid="email-purpose"]')).toContainText('Business meeting follow-up');

    console.log('✅ Email found in history with correct details');

    // Step 6: Click on the saved email to view details
    await savedEmail.click();

    // Verify email detail view
    await expect(page.locator('[data-testid="email-detail-view"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="email-subject"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-content-detail"]')).toContainText('project timeline');

    console.log('✅ Email detail view verified');
  });

  test('should persist email history after page refresh', async ({ page }) => {
    console.log('🧪 Testing email persistence across sessions...');

    // Generate and save a unique email
    const timestamp = new Date().toISOString();
    await page.fill('[data-testid="recipient-name"]', 'Persistence Test User');
    await page.fill('[data-testid="purpose"]', `Test email created at ${timestamp}`);
    await page.selectOption('[data-testid="tone"]', 'casual');
    await page.fill('[data-testid="key-points"]', 'This is a test to verify persistence');

    await page.click('[data-testid="generate-email-btn"]');
    await expect(page.locator('[data-testid="email-content"]')).toBeVisible({ timeout: 30000 });

    await page.click('[data-testid="save-email-btn"]');
    await expect(page.locator('[data-testid="save-success-toast"]')).toBeVisible({ timeout: 10000 });

    console.log('✅ Test email saved');

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Navigate to History tab
    await page.click('[data-testid="history-tab"]');
    await page.waitForTimeout(3000);

    // Verify the test email still exists
    const historyItems = page.locator('[data-testid="email-history-item"]');
    await expect(historyItems.first()).toBeVisible({ timeout: 15000 });

    // Find our specific test email
    const testEmail = page.locator(`[data-testid="email-history-item"]:has-text("Persistence Test User")`);
    await expect(testEmail).toBeVisible({ timeout: 10000 });

    console.log('✅ Email persisted after page refresh');
  });

  test('should save multiple emails and maintain chronological order', async ({ page }) => {
    console.log('🧪 Testing multiple email saves...');

    const emails = [
      { recipient: 'Alice Smith', purpose: 'First test email' },
      { recipient: 'Bob Johnson', purpose: 'Second test email' },
      { recipient: 'Carol Williams', purpose: 'Third test email' }
    ];

    // Generate and save multiple emails
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];

      await page.fill('[data-testid="recipient-name"]', email.recipient);
      await page.fill('[data-testid="purpose"]', email.purpose);
      await page.selectOption('[data-testid="tone"]', 'professional');
      await page.fill('[data-testid="key-points"]', `Test point ${i + 1}`);

      await page.click('[data-testid="generate-email-btn"]');
      await expect(page.locator('[data-testid="email-content"]')).toBeVisible({ timeout: 30000 });

      await page.click('[data-testid="save-email-btn"]');
      await expect(page.locator('[data-testid="save-success-toast"]')).toBeVisible({ timeout: 10000 });

      console.log(`✅ Email ${i + 1} saved: ${email.recipient}`);

      // Small delay between saves
      await page.waitForTimeout(1000);
    }

    // Navigate to History
    await page.click('[data-testid="history-tab"]');
    await page.waitForTimeout(3000);

    // Verify all emails are in history (newest first)
    const historyItems = page.locator('[data-testid="email-history-item"]');
    await expect(historyItems).toHaveCount(3, { timeout: 15000 });

    // Verify chronological order (newest first)
    for (let i = 0; i < emails.length; i++) {
      const expectedEmail = emails[emails.length - 1 - i]; // Reverse order
      const historyItem = historyItems.nth(i);

      await expect(historyItem.locator('[data-testid="email-recipient"]')).toContainText(expectedEmail.recipient);
      await expect(historyItem.locator('[data-testid="email-purpose"]')).toContainText(expectedEmail.purpose);
    }

    console.log('✅ Multiple emails saved and ordered correctly');
  });

  test('should handle favorite functionality', async ({ page }) => {
    console.log('🧪 Testing favorite functionality...');

    // Generate and save an email
    await page.fill('[data-testid="recipient-name"]', 'Favorite Test User');
    await page.fill('[data-testid="purpose"]', 'Test favoriting feature');
    await page.selectOption('[data-testid="tone"]', 'professional');
    await page.fill('[data-testid="key-points"]', 'Testing the favorite button');

    await page.click('[data-testid="generate-email-btn"]');
    await expect(page.locator('[data-testid="email-content"]')).toBeVisible({ timeout: 30000 });

    await page.click('[data-testid="save-email-btn"]');
    await expect(page.locator('[data-testid="save-success-toast"]')).toBeVisible({ timeout: 10000 });

    // Navigate to History
    await page.click('[data-testid="history-tab"]');
    await page.waitForTimeout(3000);

    // Find and favorite the email
    const firstEmail = page.locator('[data-testid="email-history-item"]').first();
    await expect(firstEmail.locator('[data-testid="favorite-btn"]')).toBeVisible();

    // Click favorite button
    await firstEmail.locator('[data-testid="favorite-btn"]').click();

    // Verify favorite state changed
    await expect(firstEmail.locator('[data-testid="favorite-btn"].favorited')).toBeVisible({ timeout: 5000 });

    console.log('✅ Favorite functionality working');
  });
});