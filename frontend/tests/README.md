# HushVote DApp - Test Suite Documentation

## Overview
This directory contains comprehensive automated tests for the HushVote DApp, a privacy-first voting platform using Fully Homomorphic Encryption (FHE).

## Test Environment Configuration

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Playwright Test Framework

### Installation

```bash
# Install Playwright and dependencies
npm init playwright@latest
# Or if package.json exists
npm install --save-dev @playwright/test

# Install browsers
npx playwright install
```

### Environment Variables

Create a `.env.test` file in the project root:

```env
# Application Configuration
APP_URL=https://hushvote.vercel.app

# Blockchain Configuration
NETWORK_NAME=Sepolia
CHAIN_ID=11155111
CONTRACT_ADDRESS=0x638BFAd8A961eb1b44A5B0d5B30707D5A2cA6960

# Test Wallet (DO NOT USE IN PRODUCTION)
TEST_WALLET_PRIVATE_KEY=0x9ff05fa7715b4392345df412070dfc1c853228bd687713092b7fd748a42d0a3c
TEST_WALLET_ADDRESS=0xc2dE6f6D1f3c6a5169c8CEe0D7f1dE68F96c28dD

# RPC Endpoints
RPC_ENDPOINT=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
```

## Running Tests

### All Tests
```bash
# Run all tests
npx playwright test

# Run with UI mode (recommended for debugging)
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/hushvote.spec.ts
```

### Test Categories
```bash
# Run only UI tests
npx playwright test --grep "UI"

# Run only blockchain tests
npx playwright test --grep "Blockchain"

# Run only security tests
npx playwright test --grep "Security"

# Skip failing tests
npx playwright test --grep-invert "Wallet Connection"
```

### Generate Reports
```bash
# Generate HTML report
npx playwright test --reporter=html

# Open last report
npx playwright show-report

# Generate JSON report for CI
npx playwright test --reporter=json > test-results.json
```

## Test Structure

### Main Test File: `hushvote.spec.ts`

The test suite is organized into the following categories:

1. **Landing Page Tests**
   - Homepage loading
   - Statistics display
   - Security features section

2. **Wallet Connection Tests**
   - Connect button visibility
   - Connection flow
   - Error handling

3. **Navigation Tests**
   - Menu navigation
   - Route verification
   - Page transitions

4. **Create Voting Flow Tests**
   - Form display
   - Input validation
   - Submission handling

5. **Active Votings Tests**
   - List display
   - Search functionality
   - Tab navigation

6. **UI/UX Tests**
   - Dark mode toggle
   - Responsive design
   - Mobile/tablet views

7. **Error Handling Tests**
   - API failures
   - Network errors
   - Invalid routes

8. **Blockchain Integration Tests**
   - Contract references
   - Network configuration
   - Transaction handling

9. **Accessibility Tests**
   - ARIA labels
   - Keyboard navigation
   - Color contrast

10. **Performance Tests**
    - Load times
    - Navigation speed
    - Resource usage

11. **Security Tests**
    - HTTPS enforcement
    - XSS prevention
    - Console data exposure

## Test Data

### Test Wallet
- **Address:** 0xc2dE6f6D1f3c6a5169c8CEe0D7f1dE68F96c28dD
- **Network:** Sepolia Testnet
- **Contract:** 0x638BFAd8A961eb1b44A5B0d5B30707D5A2cA6960

### Sample Voting Data
```javascript
const testVoting = {
  title: "Test FHE Voting Session",
  description: "Testing privacy-preserving voting with FHE",
  options: ["Yes - Approve", "No - Reject"],
  startDate: "2025-09-06",
  endDate: "2025-09-13",
  votingType: "Single Choice",
  decryptionThreshold: 3
};
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Failed Tests

### Common Issues and Solutions

1. **Wallet Connection Failures**
   - Ensure Privy SDK is properly configured
   - Check browser wallet extensions
   - Verify network configuration

2. **Timeout Errors**
   ```javascript
   // Increase timeout for slow operations
   test.setTimeout(60000);
   ```

3. **Element Not Found**
   ```javascript
   // Wait for elements explicitly
   await page.waitForSelector('button:has-text("Connect Wallet")');
   ```

4. **Network Errors**
   ```javascript
   // Mock API responses for testing
   await page.route('**/api/**', route => {
     route.fulfill({
       status: 200,
       body: JSON.stringify({ success: true })
     });
   });
   ```

## Visual Regression Testing

To add visual regression testing:

```bash
# Install Percy (optional)
npm install --save-dev @percy/playwright

# Take snapshots in tests
await percySnapshot(page, 'Homepage');
```

## Performance Testing

Monitor performance metrics:

```javascript
const metrics = await page.evaluate(() => ({
  loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
  domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
  firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime
}));
```

## Accessibility Testing

Integrate axe-core for accessibility:

```bash
npm install --save-dev @axe-core/playwright

# In tests
const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
expect(accessibilityScanResults.violations).toEqual([]);
```

## Test Coverage Goals

- **Functional Coverage:** 90%
- **UI Component Coverage:** 95%
- **API Integration Coverage:** 85%
- **Error Scenario Coverage:** 80%
- **Accessibility Standards:** WCAG 2.1 AA

## Maintenance

### Weekly Tasks
- Review and update test data
- Check for flaky tests
- Update selectors if UI changes

### Monthly Tasks
- Review test coverage reports
- Update test documentation
- Optimize test execution time

## Contact

For questions about the test suite:
- Review test report: `TEST_REPORT.md`
- Check test artifacts in `.playwright-mcp/` directory
- Screenshots and videos available in `test-results/` after test runs

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Web3 Testing Best Practices](https://ethereum.org/en/developers/docs/testing/)
- [FHE Testing Guidelines](https://docs.zama.ai/tfhe-rs/tutorials/testing)