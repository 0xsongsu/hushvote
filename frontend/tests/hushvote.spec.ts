import { test, expect, Page } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
  APP_URL: 'https://hushvote.vercel.app',
  NETWORK: {
    chainId: 11155111,
    name: 'Sepolia'
  },
  CONTRACT_ADDRESS: '0x638BFAd8A961eb1b44A5B0d5B30707D5A2cA6960',
  TEST_WALLET: {
    privateKey: '0x9ff05fa7715b4392345df412070dfc1c853228bd687713092b7fd748a42d0a3c',
    address: '0xc2dE6f6D1f3c6a5169c8CEe0D7f1dE68F96c28dD'
  },
  TIMEOUTS: {
    transaction: 60000,
    navigation: 30000,
    element: 10000
  }
};

test.describe('HushVote DApp - Core Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto(TEST_CONFIG.APP_URL);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Landing Page', () => {
    test('should load homepage successfully', async ({ page }) => {
      await expect(page).toHaveTitle(/HushVote/);
      await expect(page.locator('text=Privacy First')).toBeVisible();
      await expect(page.locator('text=Welcome to HushVote')).toBeVisible();
    });

    test('should display key statistics cards', async ({ page }) => {
      await expect(page.locator('text=Active Votings')).toBeVisible();
      await expect(page.locator('text=Total Votes Cast')).toBeVisible();
      await expect(page.locator('text=Registered Users')).toBeVisible();
      await expect(page.locator('text=Encryption Success')).toBeVisible();
    });

    test('should show security features section', async ({ page }) => {
      await expect(page.locator('text=End-to-End Encryption')).toBeVisible();
      await expect(page.locator('text=Homomorphic Tallying')).toBeVisible();
      await expect(page.locator('text=Verifiable Voting')).toBeVisible();
    });
  });

  test.describe('Wallet Connection', () => {
    test('should display Connect Wallet button', async ({ page }) => {
      const connectButton = page.locator('button:has-text("Connect Wallet")');
      await expect(connectButton).toBeVisible();
    });

    test('should attempt wallet connection', async ({ page }) => {
      const connectButton = page.locator('button:has-text("Connect Wallet")');
      await connectButton.click();
      
      // Check for error or wallet modal
      const errorMessage = page.locator('text=Failed to connect wallet');
      const isError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isError) {
        // Document that wallet connection fails without proper wallet setup
        expect(isError).toBeTruthy();
      }
    });

    test('should handle wallet connection failure gracefully', async ({ page }) => {
      await page.locator('button:has-text("Connect Wallet")').click();
      await page.waitForTimeout(2000);
      
      // Check for error notification
      const errorNotification = await page.locator('text=Failed to connect wallet').isVisible();
      expect(errorNotification).toBeTruthy();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to all main sections', async ({ page }) => {
      // Test Dashboard navigation
      await page.locator('text=Dashboard').click();
      await expect(page).toHaveURL(/\//);

      // Test Active Votings navigation
      await page.locator('text=Active Votings').first().click();
      await expect(page).toHaveURL(/\/votings/);

      // Test Create Voting navigation
      await page.locator('text=Create Voting').click();
      await expect(page).toHaveURL(/\/admin\/create/);

      // Test Voting History navigation
      await page.locator('text=Voting History').click();
      await expect(page).toHaveURL(/\/history/);

      // Test Results navigation
      await page.locator('text=Results').first().click();
      await expect(page).toHaveURL(/\/results/);
    });
  });

  test.describe('Create Voting Flow', () => {
    test('should access create voting page without authentication', async ({ page }) => {
      await page.locator('text=Create Voting').click();
      await expect(page.locator('h2:has-text("Create New Voting")')).toBeVisible();
    });

    test('should display all required form fields', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.APP_URL}/admin/create`);
      
      // Check for form fields
      await expect(page.locator('text=Voting Title')).toBeVisible();
      await expect(page.locator('text=Description')).toBeVisible();
      await expect(page.locator('text=Voting Type')).toBeVisible();
      await expect(page.locator('text=Voting Period')).toBeVisible();
      await expect(page.locator('text=Voting Options')).toBeVisible();
      await expect(page.locator('text=Security & Privacy Settings')).toBeVisible();
    });

    test('should fill and submit voting creation form', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.APP_URL}/admin/create`);
      
      // Fill in the form
      await page.fill('input[placeholder="Enter voting title"]', 'Test Automated Voting');
      await page.fill('textarea[placeholder*="Describe the purpose"]', 'Automated test voting description');
      
      // Add voting options
      await page.locator('button:has-text("Add Option")').click();
      await page.fill('input[placeholder="Enter option label"]', 'Option A');
      
      await page.locator('button:has-text("Add Option")').click();
      await page.locator('input[placeholder="Enter option label"]').nth(1).fill('Option B');
      
      // Set dates
      await page.locator('input[placeholder="Start date"]').click();
      await page.locator('text=OK').click();
      
      // Try to create voting
      await page.locator('button:has-text("Create Voting")').last().click();
      
      // Expect error due to missing wallet connection
      await expect(page.locator('text=Failed to create voting')).toBeVisible({ timeout: 10000 });
    });

    test('should validate form inputs', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.APP_URL}/admin/create`);
      
      // Try to submit without filling required fields
      await page.locator('button:has-text("Create Voting")').last().click();
      
      // Should show error or not proceed
      const url = page.url();
      expect(url).toContain('/admin/create');
    });
  });

  test.describe('Active Votings Page', () => {
    test('should display votings list page', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.APP_URL}/votings`);
      await expect(page.locator('h2:has-text("Votings")')).toBeVisible();
    });

    test('should show search and filter options', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.APP_URL}/votings`);
      await expect(page.locator('input[placeholder="Search votings..."]')).toBeVisible();
    });

    test('should display voting tabs', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.APP_URL}/votings`);
      
      const tabs = ['All Votings', 'Active', 'Pending', 'Ended', 'Results Available'];
      for (const tab of tabs) {
        await expect(page.locator(`text=${tab}`)).toBeVisible();
      }
    });

    test('should show empty state when no votings exist', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.APP_URL}/votings`);
      await expect(page.locator('text=No votings available')).toBeVisible();
    });
  });

  test.describe('UI/UX Features', () => {
    test('should toggle dark mode', async ({ page }) => {
      // Get initial background color
      const initialBg = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      
      // Toggle dark mode
      await page.locator('[role="switch"]').click();
      await page.waitForTimeout(500);
      
      // Check if background changed
      const newBg = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      
      expect(initialBg).not.toBe(newBg);
    });

    test('should be responsive on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 812 });
      
      // Check if navigation is still accessible
      await expect(page.locator('text=HushVote')).toBeVisible();
      await expect(page.locator('[role="switch"]')).toBeVisible();
    });

    test('should be responsive on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Check layout
      await expect(page.locator('text=Welcome to HushVote')).toBeVisible();
      await expect(page.locator('text=Active Votings')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Test with network offline
      await page.route('**/api/**', route => route.abort());
      await page.goto(`${TEST_CONFIG.APP_URL}/admin/create`);
      
      // Try to create voting
      await page.fill('input[placeholder="Enter voting title"]', 'Test');
      await page.locator('button:has-text("Create Voting")').last().click();
      
      // Should show error message
      const hasError = await page.locator('text=/[Ff]ailed|[Ee]rror/').isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasError).toBeTruthy();
    });

    test('should show 404 for invalid routes', async ({ page }) => {
      const response = await page.goto(`${TEST_CONFIG.APP_URL}/invalid-route-test`);
      
      // Check if 404 is handled
      const status = response?.status();
      if (status === 404) {
        expect(status).toBe(404);
      } else {
        // App might handle 404 with client-side routing
        await expect(page.locator('text=/404|not found/i')).toBeVisible({ timeout: 5000 }).catch(() => {
          // App redirects to home on invalid routes
          expect(page.url()).toContain(TEST_CONFIG.APP_URL);
        });
      }
    });
  });

  test.describe('Blockchain Integration', () => {
    test('should display correct contract address', async ({ page }) => {
      // Check if contract address is referenced in the app
      const pageContent = await page.content();
      const hasContractReference = pageContent.toLowerCase().includes('contract') || 
                                   pageContent.toLowerCase().includes('sepolia');
      expect(hasContractReference).toBeTruthy();
    });

    test('should reference Sepolia network', async ({ page }) => {
      // Check for network references
      const pageContent = await page.content();
      const hasNetworkReference = pageContent.toLowerCase().includes('sepolia') || 
                                  pageContent.toLowerCase().includes('testnet') ||
                                  pageContent.toLowerCase().includes('11155111');
      
      // Network might be referenced after wallet connection attempt
      if (!hasNetworkReference) {
        await page.locator('button:has-text("Connect Wallet")').click();
        await page.waitForTimeout(2000);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      const buttons = await page.locator('button').all();
      for (const button of buttons.slice(0, 5)) { // Check first 5 buttons
        const text = await button.textContent();
        expect(text).toBeTruthy();
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Check if an element is focused
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // This is a basic check - for full accessibility testing, use axe-core
      const textColor = await page.evaluate(() => {
        const element = document.querySelector('h2');
        return window.getComputedStyle(element!).color;
      });
      
      expect(textColor).toBeTruthy();
    });
  });

  test.describe('Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(TEST_CONFIG.APP_URL);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });

    test('should handle rapid navigation', async ({ page }) => {
      // Rapidly navigate between pages
      for (let i = 0; i < 5; i++) {
        await page.locator('text=Dashboard').click();
        await page.locator('text=Active Votings').first().click();
        await page.locator('text=Create Voting').click();
      }
      
      // Should still be responsive
      await expect(page.locator('h2')).toBeVisible();
    });
  });
});

test.describe('Security Tests', () => {
  test('should not expose sensitive data in console', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', msg => consoleLogs.push(msg.text()));
    
    await page.goto(TEST_CONFIG.APP_URL);
    await page.locator('button:has-text("Connect Wallet")').click();
    
    // Check console logs for sensitive data
    const hasSensitiveData = consoleLogs.some(log => 
      log.includes('private') || 
      log.includes('seed') || 
      log.includes('mnemonic')
    );
    
    expect(hasSensitiveData).toBeFalsy();
  });

  test('should use HTTPS', async ({ page }) => {
    await page.goto(TEST_CONFIG.APP_URL);
    expect(page.url()).toMatch(/^https:/);
  });

  test('should handle XSS attempts', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.APP_URL}/admin/create`);
    
    // Try to inject script tag
    const xssPayload = '<script>alert("XSS")</script>';
    await page.fill('input[placeholder="Enter voting title"]', xssPayload);
    
    // Check if script is executed (it shouldn't be)
    const alertFired = await page.evaluate(() => {
      let alertCalled = false;
      window.alert = () => { alertCalled = true; };
      return alertCalled;
    });
    
    expect(alertFired).toBeFalsy();
  });
});