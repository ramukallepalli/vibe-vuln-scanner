# Quick Reference

## Project Structure

```
vibe-vuln-scanner/
├── manifest.json              # Chrome extension manifest (V3)
├── package.json              # NPM dependencies
├── .eslintrc.json           # ESLint configuration
├── .gitignore               # Git ignore rules
├── README.md                # User documentation
├── CLAUDE.md               # Developer guide for Claude Code
├── SETUP.md                # Installation instructions
├── test-page.html          # Test page with vulnerabilities
├── icons/                  # Extension icons (add 16, 48, 128px)
├── public/                 # Public assets
└── src/
    ├── content/
    │   └── scanner.js      # Vulnerability detection logic
    ├── background/
    │   └── service-worker.js  # KEV catalog & result storage
    └── popup/
        ├── popup.html      # Extension popup UI
        ├── popup.css       # Popup styling
        └── popup.js        # Popup logic
```

## Common Commands

```bash
# Install dependencies
npm install

# Lint code
npm run lint

# Run tests
npm test

# Package for Chrome Web Store
npm run package
```

## Load Extension in Chrome

1. `chrome://extensions/`
2. Enable **Developer mode**
3. **Load unpacked** → select `vibe-vuln-scanner/`

## CISA KEV Integration

- **Endpoint**: `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`
- **Updates**: Every 6 hours automatically
- **Storage**: `chrome.storage.local`
- **Check Status**: Inspect service worker console

## Vulnerability Types Detected

| Type | Severity | Description |
|------|----------|-------------|
| KNOWN_EXPLOITED_VULNERABILITY | CRITICAL | From CISA KEV catalog |
| CVE_MENTIONED | HIGH | CVE found in page content |
| XSS | HIGH/MEDIUM | Inline handlers, innerHTML |
| INSECURE_DEPENDENCY | HIGH | HTTP scripts |
| MISSING_SRI | MEDIUM | CDN without integrity |
| DATA_EXPOSURE | CRITICAL | API keys, tokens |
| MISSING_CSP | MEDIUM | No CSP header |
| WEAK_CSP | HIGH/MEDIUM | Unsafe CSP policies |

## Detected Libraries

- jQuery
- React
- Vue.js
- Angular
- Bootstrap
- Lodash
- Moment.js
- Chart.js
- D3.js
- Axios

## Adding New Library Detection

Edit `src/content/scanner.js` → `extractLibraryInfo()`:

```javascript
const patterns = [
  { regex: /your-lib[-@.](\d+\.\d+\.\d+)/i, name: 'Your Library' },
  // ... existing patterns
];
```

## Message Passing

### Content → Background

```javascript
chrome.runtime.sendMessage({
  action: 'scanComplete',
  vulnerabilities: [...],
  isVibeApp: true,
  url: window.location.href
});
```

### Popup → Background

```javascript
chrome.runtime.sendMessage({ action: 'getResults', tabId });
chrome.runtime.sendMessage({ action: 'getKEVCatalog' });
```

### Popup → Content

```javascript
chrome.tabs.sendMessage(tabId, { action: 'startScan' });
```

## Debugging

| Component | How to Debug |
|-----------|--------------|
| Content Script | F12 on webpage → Console tab |
| Background Worker | `chrome://extensions/` → "Inspect views: service worker" |
| Popup | Right-click extension icon → "Inspect popup" |

## File Locations

| File | Purpose |
|------|---------|
| `src/content/scanner.js` | Vulnerability scanning logic |
| `src/background/service-worker.js` | KEV fetch, result storage |
| `src/popup/popup.js` | UI logic, result display |
| `manifest.json` | Extension config, permissions |

## Key Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `fetchKEVCatalog()` | service-worker.js | Fetch CISA data |
| `extractLibraryInfo()` | scanner.js | Parse library versions |
| `scanKnownVulnerabilities()` | scanner.js | Match against KEV |
| `runScans()` | scanner.js | Execute all checks |
| `displayResults()` | popup.js | Render vulnerabilities |

## Testing Workflow

1. Make code changes
2. Go to `chrome://extensions/`
3. Click refresh icon on extension
4. Open test page: `file:///.../test-page.html`
5. Click extension icon
6. Verify results

## Permissions Used

- `activeTab` - Access current tab DOM
- `storage` - Store KEV catalog
- `scripting` - Future script injection
- `host_permissions: ["<all_urls>"]` - Run on all pages

## Chrome Extension APIs

- `chrome.runtime.sendMessage()` - Message passing
- `chrome.storage.local` - Persistent storage
- `chrome.action.setBadgeText()` - Badge updates
- `chrome.tabs.query()` - Get active tab
- `chrome.tabs.sendMessage()` - Message content script

## Version Comparison

Simple semver comparison in `compareVersions()`:
- Splits on `.`
- Compares each part numerically
- Returns -1, 0, or 1

## CVE Detection

Regex: `/CVE-\d{4}-\d{4,7}/gi`

Matches formats like:
- CVE-2021-44228
- CVE-2023-12345

## Next Steps

1. ✅ Project created
2. ⬜ Add custom icons (16, 48, 128px)
3. ⬜ Run `npm install`
4. ⬜ Load extension in Chrome
5. ⬜ Test with `test-page.html`
6. ⬜ Add more library patterns
7. ⬜ Write unit tests
8. ⬜ Package for distribution
