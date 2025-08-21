# Donation App - Playwright Test Suite

This directory contains comprehensive end-to-end tests for the donation app using Playwright.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Frontend dependencies installed (`npm install`)

### Installation
```bash
# Install Playwright
npm run test:install

# Install dependencies (if not already done)
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI mode (interactive)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests in debug mode
npm run test:debug

# View test report
npm run test:report
```

## 📁 Test Structure

```
test/
├── utils/
│   └── test-utils.ts          # Common test utilities and helpers
├── auth.spec.ts               # Authentication tests
├── dashboard.spec.ts          # Dashboard functionality tests
├── donation-form.spec.ts      # Donation form tests
├── e2e.spec.ts               # End-to-end workflow tests
└── README.md                 # This file
```

## 🧪 Test Categories

### 1. Authentication Tests (`auth.spec.ts`)
- Login form display and validation
- Sign in/Sign up mode switching
- Successful login and logout
- Session persistence
- Theme switching on login form
- Theme persistence across sessions

### 2. Dashboard Tests (`dashboard.spec.ts`)
- Dashboard layout and elements
- Tower cards and apartment buttons
- Statistics display and updates
- Recent donations section
- Theme switching functionality
- Mobile responsive layout
- Carousel navigation

### 3. Donation Form Tests (`donation-form.spec.ts`)
- Form display and validation
- Payment method selection
- UPI person selector
- Sponsorship options (for donations > ₹500)
- Donation submission and navigation
- Follow-up functionality
- Apartment navigation
- Form state management
- Status updates

### 4. End-to-End Tests (`e2e.spec.ts`)
- Complete donation collection workflow
- Theme persistence across sessions
- Mobile responsive workflows
- Large donation with sponsorship
- UPI other person workflow
- Session persistence and logout

## 🛠️ Test Utilities

The `TestUtils` class provides common helper functions:

### Authentication
- `login(name, email)` - Login with test credentials
- `clearLocalStorage()` - Clear all stored data

### Navigation
- `navigateToApartment(tower, floor, unit)` - Navigate to specific apartment
- `changeTheme(theme)` - Switch between Light/Dark/Ambient themes

### Form Interactions
- `submitDonation(data)` - Fill and submit donation form
- `markForFollowUp(notes)` - Mark apartment for follow-up

### Utilities
- `getApartmentStatus(tower, floor, unit)` - Get apartment status from localStorage
- `waitForTransitionComplete()` - Wait for form transitions
- `isVisible(selector)` - Check if element is visible
- `takeScreenshot(name)` - Take timestamped screenshots

## 🎯 Test Scenarios Covered

### Core Functionality
- ✅ User authentication and session management
- ✅ Dashboard navigation and statistics
- ✅ Donation form completion and submission
- ✅ Follow-up marking and tracking
- ✅ Apartment status management
- ✅ Theme switching and persistence

### User Experience
- ✅ Form validation and error handling
- ✅ Loading states and transitions
- ✅ Mobile responsive design
- ✅ Accessibility features
- ✅ Data persistence across sessions

### Edge Cases
- ✅ Large donations with sponsorship
- ✅ UPI payment workflows
- ✅ Apartment navigation boundaries
- ✅ Form state during transitions
- ✅ Session timeout and recovery

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)
- **Base URL**: `http://localhost:3000`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Parallel Execution**: Enabled
- **Retries**: 2 on CI, 0 locally
- **Screenshots**: On failure
- **Videos**: Retain on failure
- **Traces**: On first retry

### Test Environment
- **Web Server**: Automatically starts `npm run dev`
- **Timeout**: 120 seconds for server startup
- **Reuse Server**: Yes (except on CI)

## 📊 Test Reports

After running tests, view detailed reports:

```bash
npm run test:report
```

Reports include:
- Test results and timing
- Screenshots of failures
- Video recordings
- Trace files for debugging
- Performance metrics

## 🐛 Debugging

### Debug Mode
```bash
npm run test:debug
```
- Opens browser in headed mode
- Pauses on breakpoints
- Step-through execution

### UI Mode
```bash
npm run test:ui
```
- Interactive test runner
- Real-time test execution
- Visual debugging tools

### Common Issues

1. **Server not starting**: Ensure port 3000 is available
2. **Tests timing out**: Check if dev server is running properly
3. **Element not found**: Verify selectors match current UI
4. **LocalStorage issues**: Use `clearLocalStorage()` in test setup

## 🚀 CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:install
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## 📝 Adding New Tests

1. **Create test file**: `test/feature-name.spec.ts`
2. **Import utilities**: `import { TestUtils } from './utils/test-utils'`
3. **Use test structure**:
   ```typescript
   test.describe('Feature Name', () => {
     let testUtils: TestUtils;
     
     test.beforeEach(async ({ page }) => {
       testUtils = new TestUtils(page);
       await testUtils.clearLocalStorage();
       await page.goto('/');
       await testUtils.login('Test User', 'test@example.com');
     });
     
     test('should do something', async ({ page }) => {
       // Test implementation
     });
   });
   ```

4. **Add to utilities**: If you need new helper functions, add them to `TestUtils`

## 🎉 Best Practices

- **Isolation**: Each test should be independent
- **Cleanup**: Use `clearLocalStorage()` in `beforeEach`
- **Selectors**: Use semantic selectors over CSS classes
- **Assertions**: Test behavior, not implementation
- **Performance**: Keep tests fast and focused
- **Documentation**: Add comments for complex scenarios

## 📞 Support

For test-related issues:
1. Check the test logs and reports
2. Verify the application is running correctly
3. Review selector changes in recent updates
4. Use debug mode for step-by-step investigation

