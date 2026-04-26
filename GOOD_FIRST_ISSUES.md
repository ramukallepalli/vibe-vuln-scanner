# Good First Issues Template

Copy and paste these into GitHub Issues to attract contributors.

Go to: https://github.com/ramukallepalli/vibe-vuln-scanner/issues/new

---

## Issue 1: Add Support for Moment.js to KEV Scanner

**Labels:** `good first issue`, `enhancement`, `help wanted`

### Description

Add detection support for Moment.js library to the KEV vulnerability scanner.

### Current Behavior

The scanner currently detects these libraries:
- jQuery
- React
- Vue
- Angular
- Bootstrap
- Lodash

### Desired Behavior

Extend the scanner to also detect Moment.js versions from script URLs.

### Implementation Hints

1. Look at `src/content/scanner.js` 
2. Find the `extractLibraryInfo()` method (around line 150)
3. Add a new pattern for Moment.js:
   ```javascript
   { regex: /moment(?:\.js)?[-@.](\d+\.\d+\.\d+)/i, name: 'Moment.js' }
   ```
4. Test with a script URL like: `https://cdn.example.com/moment-2.29.4.min.js`

### Acceptance Criteria

- [ ] Moment.js versions are extracted from script URLs
- [ ] Pattern handles common URL formats (moment-X.Y.Z, moment.X.Y.Z, moment@X.Y.Z)
- [ ] Tested with the included test page
- [ ] No breaking changes to existing detection

### Resources

- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines
- [CLAUDE.md](docs/CLAUDE.md) - Codebase architecture

### Estimated Effort

**Time:** 30-60 minutes  
**Difficulty:** Beginner  
**Files to modify:** 1 file (`src/content/scanner.js`)

---

## Issue 2: Improve API Key Pattern Detection for Stripe Keys

**Labels:** `good first issue`, `enhancement`, `security`

### Description

Add detection pattern for Stripe API keys to improve secret scanning.

### Current Behavior

The scanner detects generic API keys but doesn't specifically identify Stripe keys.

### Desired Behavior

Detect Stripe-specific key patterns:
- Live keys: `sk_live_[A-Za-z0-9]{24,}`
- Test keys: `sk_test_[A-Za-z0-9]{24,}`
- Publishable keys: `pk_live_` and `pk_test_`

### Implementation Hints

1. Look at `src/content/scanner.js`
2. Find the `scanSecrets()` method (around line 400)
3. Add Stripe-specific patterns to the detection logic
4. Ensure test keys are marked as lower severity than live keys

### Example Pattern

```javascript
const stripeSecretKey = /sk_(live|test)_[A-Za-z0-9]{24,}/g;
```

### Acceptance Criteria

- [ ] Detects Stripe live secret keys (`sk_live_...`)
- [ ] Detects Stripe test secret keys (`sk_test_...`)
- [ ] Live keys marked as HIGH severity
- [ ] Test keys marked as MEDIUM severity
- [ ] Includes remediation guidance for Stripe keys
- [ ] No false positives on example/placeholder keys

### Resources

- [Stripe API Keys Documentation](https://stripe.com/docs/keys)
- [CONTRIBUTING.md](CONTRIBUTING.md)

### Estimated Effort

**Time:** 1-2 hours  
**Difficulty:** Beginner to Intermediate  
**Files to modify:** 1 file (`src/content/scanner.js`)

---

## Issue 3: Add Unit Tests for Version Comparison Logic

**Labels:** `good first issue`, `testing`, `help wanted`

### Description

Write unit tests for the version comparison and vulnerability checking logic.

### Current State

Test infrastructure is set up (Jest + mocks), but the `isVersionVulnerable()` function lacks comprehensive tests.

### What to Test

The `isVersionVulnerable()` function in `src/content/scanner.js` which:
- Compares semantic versions (X.Y.Z format)
- Checks if a version falls within a vulnerable range
- Handles inclusive/exclusive range constraints

### Test Cases Needed

```javascript
describe('isVersionVulnerable', () => {
  test('version within range is vulnerable', () => {
    // Test: 3.6.0 with range [3.0.0, 3.7.0)
  });

  test('version below range is safe', () => {
    // Test: 2.9.0 with range [3.0.0, 3.7.0)
  });

  test('version above range is safe', () => {
    // Test: 3.8.0 with range [3.0.0, 3.7.0)
  });

  test('exact boundary versions', () => {
    // Test inclusive/exclusive boundaries
  });
});
```

### Implementation Hints

1. Look at `__tests__/scanner.test.js` for examples
2. Import or mock the necessary functions
3. Run tests with `npm test`
4. Aim for >80% coverage of this function

### Acceptance Criteria

- [ ] At least 5 test cases covering different scenarios
- [ ] Tests for edge cases (boundaries, malformed versions)
- [ ] All tests pass (`npm test`)
- [ ] Coverage increases for `scanner.js`

### Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Existing test setup](__tests__/setup.js)

### Estimated Effort

**Time:** 2-3 hours  
**Difficulty:** Beginner to Intermediate  
**Files to modify:** `__tests__/scanner.test.js`

---

## Issue 4: Add Dark Mode Support to Popup UI

**Labels:** `good first issue`, `enhancement`, `ui/ux`

### Description

Add dark mode support to the extension popup for better UX in low-light environments.

### Current Behavior

Popup uses a light theme regardless of system/browser theme preference.

### Desired Behavior

- Detect system dark mode preference
- Apply dark color scheme automatically
- Maintain good contrast and readability

### Implementation Hints

1. Look at `src/popup/popup.css`
2. Use CSS `prefers-color-scheme` media query:
   ```css
   @media (prefers-color-scheme: dark) {
     /* Dark mode styles */
   }
   ```
3. Define dark mode color variables
4. Test in Chrome with dark mode enabled

### Color Palette Suggestion

**Dark Mode:**
- Background: `#1e1e1e`
- Text: `#e0e0e0`
- Critical findings: `#ff6b6b`
- High findings: `#ffa500`
- Borders: `#404040`

### Acceptance Criteria

- [ ] Dark mode activates based on system preference
- [ ] All text is readable with good contrast
- [ ] Severity colors remain distinguishable
- [ ] Buttons and interactive elements are visible
- [ ] Screenshots updated to show both light and dark modes

### Resources

- [MDN: prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [Existing CSS](src/popup/popup.css)

### Estimated Effort

**Time:** 2-4 hours  
**Difficulty:** Beginner to Intermediate  
**Files to modify:** `src/popup/popup.css` (possibly `popup.js` for dynamic theming)

---

## Issue 5: Improve Error Messages for Failed NVD API Calls

**Labels:** `good first issue`, `enhancement`, `developer experience`

### Description

Improve error handling and user-facing messages when NVD API calls fail.

### Current Behavior

When NVD API is unavailable or rate-limited, users see generic error messages.

### Desired Behavior

Provide helpful, actionable error messages:
- Clear explanation of what went wrong
- Suggested actions (retry, wait, manual verification)
- Fallback behavior explanation

### Implementation Hints

1. Look at `src/background/service-worker.js`
2. Find the `getCVEDetails()` function
3. Add better error handling for different failure scenarios:
   - Network errors
   - Rate limiting (429)
   - Timeouts
   - Invalid CVE IDs

### Example Error Messages

```javascript
// Rate limited
"NVD API rate limit reached. Vulnerability severity set to MEDIUM pending manual verification."

// Network error
"Unable to reach NVD API. Check your connection or verify this CVE manually."

// Timeout
"NVD API request timed out. The vulnerability detection is incomplete."
```

### Acceptance Criteria

- [ ] Specific error messages for different failure types
- [ ] User-friendly language (no technical jargon)
- [ ] Errors logged to console with technical details
- [ ] Graceful degradation (extension still works)
- [ ] Test with simulated failures

### Resources

- [Error handling best practices](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)
- [NVD API documentation](https://nvd.nist.gov/developers/vulnerabilities)

### Estimated Effort

**Time:** 2-3 hours  
**Difficulty:** Intermediate  
**Files to modify:** `src/background/service-worker.js`, possibly `src/popup/popup.js`

---

## Issue 6: Add Support for Chart.js Library Detection

**Labels:** `good first issue`, `enhancement`

### Description

Similar to Issue #1, but for Chart.js - a popular charting library that may have known vulnerabilities.

### Implementation

Follow the same pattern as Issue #1 (Moment.js):

```javascript
{ regex: /chart(?:\.js)?[-@.](\d+\.\d+\.\d+)/i, name: 'Chart.js' }
```

Test URLs:
- `https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js`
- `https://cdn.example.com/chart-3.9.1.js`

### Estimated Effort

**Time:** 30-60 minutes  
**Difficulty:** Beginner

---

## Issue 7: Add Documentation for Adding Custom Vulnerability Checks

**Labels:** `good first issue`, `documentation`, `help wanted`

### Description

Create a guide showing developers how to add their own custom vulnerability detection patterns.

### Content to Include

1. Overview of scanner architecture
2. Step-by-step guide to adding a new scan method
3. Code example with full implementation
4. Testing the new scan
5. Best practices (severity assignment, confidence levels)

### Location

Create `docs/ADDING_VULNERABILITY_CHECKS.md`

### Acceptance Criteria

- [ ] Clear, beginner-friendly writing
- [ ] Complete code example
- [ ] Explains the `createFinding()` helper
- [ ] Covers severity and confidence levels
- [ ] Includes testing instructions

### Estimated Effort

**Time:** 2-3 hours  
**Difficulty:** Beginner (writing skills more important than coding)

---

## Issue 8: Add Regex Pattern for GitHub Personal Access Tokens

**Labels:** `good first issue`, `security`, `enhancement`

### Description

Detect GitHub Personal Access Tokens in page content.

### Pattern to Add

```javascript
const githubPAT = /gh[pousr]_[A-Za-z0-9_]{36,}/g;
```

This detects:
- `ghp_` - Personal Access Token
- `gho_` - OAuth Access Token  
- `ghu_` - User-to-Server Token
- `ghs_` - Server-to-Server Token
- `ghr_` - Refresh Token

### Severity

- **HIGH** - These tokens provide API access
- **high** confidence

### Estimated Effort

**Time:** 30-60 minutes  
**Difficulty:** Beginner

---

## How to Use These Issues

1. Go to https://github.com/ramukallepalli/vibe-vuln-scanner/issues/new
2. Copy the content from above
3. Set the appropriate labels
4. Click "Submit new issue"

Create at least 5-7 issues to start attracting contributors!

## Tips for Issue Management

- Respond to questions quickly (within 24 hours)
- Thank contributors for their PRs
- Provide constructive feedback
- Celebrate merged contributions with comments
- Close stale issues after 30 days of inactivity

---

**Ready to attract your first contributors!** 🚀
