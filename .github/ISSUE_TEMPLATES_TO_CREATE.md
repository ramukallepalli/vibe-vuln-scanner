# Issues to Create on GitHub

Use these to quickly create issues on your repository.

Go to: https://github.com/ramukallepalli/vibe-vuln-scanner/issues/new/choose

For each issue below, click "Open a blank issue" and copy-paste the content.

---

## ISSUE 1: Add Support for Moment.js to KEV Scanner

**Title:** Add support for Moment.js library detection

**Labels:** `good first issue`, `enhancement`

**Body:**
```markdown
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

### Implementation Guide

1. Open `src/content/scanner.js`
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

- [CONTRIBUTING.md](https://github.com/ramukallepalli/vibe-vuln-scanner/blob/main/CONTRIBUTING.md)
- [Architecture docs](https://github.com/ramukallepalli/vibe-vuln-scanner/blob/main/docs/CLAUDE.md)

**Estimated effort:** 30-60 minutes  
**Difficulty:** Beginner  
**Files to modify:** 1 file (`src/content/scanner.js`)
```

---

## ISSUE 2: Add Dark Mode Support to Popup UI

**Title:** Add dark mode support to popup interface

**Labels:** `good first issue`, `enhancement`, `ui/ux`

**Body:**
```markdown
### Description

Add dark mode support to the extension popup for better UX in low-light environments.

### Current Behavior

Popup uses a light theme regardless of system/browser theme preference.

### Desired Behavior

- Detect system dark mode preference
- Apply dark color scheme automatically
- Maintain good contrast and readability

### Implementation Guide

1. Open `src/popup/popup.css`
2. Use CSS `prefers-color-scheme` media query:
   ```css
   @media (prefers-color-scheme: dark) {
     body {
       background: #1e1e1e;
       color: #e0e0e0;
     }
     /* Add more dark mode styles */
   }
   ```
3. Test in Chrome with dark mode enabled

### Suggested Color Palette

**Dark Mode:**
- Background: `#1e1e1e`
- Text: `#e0e0e0`
- Critical findings: `#ff6b6b`
- High findings: `#ffa500`
- Borders: `#404040`

### Acceptance Criteria

- [ ] Dark mode activates based on system preference
- [ ] All text is readable with good contrast (WCAG AA)
- [ ] Severity colors remain distinguishable
- [ ] Buttons and interactive elements are visible
- [ ] Tested on Chrome with dark mode enabled

### Resources

- [MDN: prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [Existing CSS](https://github.com/ramukallepalli/vibe-vuln-scanner/blob/main/src/popup/popup.css)

**Estimated effort:** 2-4 hours  
**Difficulty:** Beginner to Intermediate  
```

---

## ISSUE 3: Add Support for Stripe API Key Detection

**Title:** Improve secret detection: Add Stripe API key patterns

**Labels:** `good first issue`, `enhancement`, `security`

**Body:**
```markdown
### Description

Add detection pattern for Stripe API keys to improve secret scanning capabilities.

### Current Behavior

The scanner detects generic API keys but doesn't specifically identify Stripe keys.

### Desired Behavior

Detect Stripe-specific key patterns:
- Live secret keys: `sk_live_[A-Za-z0-9]{24,}`
- Test secret keys: `sk_test_[A-Za-z0-9]{24,}`
- Publishable keys: `pk_live_` and `pk_test_`

### Implementation Guide

1. Open `src/content/scanner.js`
2. Find the `scanSecrets()` method (around line 400)
3. Add Stripe-specific patterns:
   ```javascript
   const stripeLiveKey = /sk_live_[A-Za-z0-9]{24,}/g;
   const stripeTestKey = /sk_test_[A-Za-z0-9]{24,}/g;
   ```
4. Ensure live keys are marked as HIGH severity, test keys as MEDIUM

### Acceptance Criteria

- [ ] Detects Stripe live secret keys (`sk_live_...`)
- [ ] Detects Stripe test secret keys (`sk_test_...`)
- [ ] Live keys marked as HIGH severity, high confidence
- [ ] Test keys marked as MEDIUM severity, medium confidence
- [ ] Includes remediation guidance specific to Stripe keys
- [ ] No false positives on example/placeholder keys

### Resources

- [Stripe API Keys Documentation](https://stripe.com/docs/keys)

**Estimated effort:** 1-2 hours  
**Difficulty:** Beginner to Intermediate  
```

---

## ISSUE 4: Add Unit Tests for Version Comparison Logic

**Title:** Write unit tests for version comparison and vulnerability checking

**Labels:** `good first issue`, `testing`

**Body:**
```markdown
### Description

Write comprehensive unit tests for the version comparison and vulnerability checking logic.

### Current State

Test infrastructure is set up (Jest + Chrome API mocks), but the `isVersionVulnerable()` function lacks comprehensive tests.

### What to Test

The `isVersionVulnerable()` function in `src/content/scanner.js`:
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

### Implementation Guide

1. Look at `__tests__/scanner.test.js` for examples
2. Import or mock the necessary functions from `scanner.js`
3. Write at least 5 test cases covering different scenarios
4. Run tests with `npm test`
5. Verify coverage with `npm run test:coverage`

### Acceptance Criteria

- [ ] At least 5 test cases covering different scenarios
- [ ] Tests for edge cases (boundaries, malformed versions)
- [ ] All tests pass (`npm test`)
- [ ] Coverage increases for `scanner.js`

### Resources

- [Jest Documentation](https://jestjs.io/)
- [Existing test setup](https://github.com/ramukallepalli/vibe-vuln-scanner/blob/main/__tests__/setup.js)

**Estimated effort:** 2-3 hours  
**Difficulty:** Beginner to Intermediate  
```

---

## ISSUE 5: Add Support for GitHub Personal Access Token Detection

**Title:** Detect GitHub Personal Access Tokens in secret scanning

**Labels:** `good first issue`, `security`, `enhancement`

**Body:**
```markdown
### Description

Add detection for GitHub Personal Access Tokens to the secret scanning functionality.

### Pattern to Detect

GitHub uses these token prefixes:
- `ghp_` - Personal Access Token
- `gho_` - OAuth Access Token  
- `ghu_` - User-to-Server Token
- `ghs_` - Server-to-Server Token
- `ghr_` - Refresh Token

### Implementation Guide

1. Open `src/content/scanner.js`
2. Find the `scanSecrets()` method
3. Add the GitHub token pattern:
   ```javascript
   const githubToken = /gh[pousr]_[A-Za-z0-9_]{36,}/g;
   ```
4. Set severity to HIGH (these tokens provide API access)
5. Set confidence to high

### Example Matches

Should detect:
- `ghp_1234567890abcdefghijklmnopqrstuvwxyz123456`
- `gho_abcdefghijklmnopqrstuvwxyz1234567890`

Should NOT detect:
- `ghp_example` (too short)
- `github_token_here` (wrong prefix)

### Acceptance Criteria

- [ ] Detects all GitHub token types (ghp_, gho_, ghu_, ghs_, ghr_)
- [ ] Tokens marked as HIGH severity, high confidence
- [ ] Includes remediation: "Revoke this token immediately at github.com/settings/tokens"
- [ ] No false positives on short/example tokens
- [ ] Tested with sample tokens

**Estimated effort:** 30-60 minutes  
**Difficulty:** Beginner  
```

---

## Quick Create Script

To create these issues quickly, you can:

1. Go to https://github.com/ramukallepalli/vibe-vuln-scanner/issues/new
2. Copy the **Title** and **Body** from each issue above
3. Add the appropriate **Labels** (you may need to create some labels first)
4. Click "Submit new issue"

Repeat for all 5 issues.

## Labels to Create

Before creating issues, make sure these labels exist:

1. Go to: https://github.com/ramukallepalli/vibe-vuln-scanner/labels
2. Create these if they don't exist:
   - `good first issue` (color: #7057ff)
   - `enhancement` (color: #a2eeef)
   - `security` (color: #d73a4a)
   - `testing` (color: #0075ca)
   - `ui/ux` (color: #d876e3)

Most of these are default GitHub labels and should already exist.
