# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vibe Vulnerability Scanner is a Chrome extension (Manifest V3) that scans web applications built with the vibe framework for security vulnerabilities. The extension integrates with CISA's Known Exploited Vulnerabilities (KEV) catalog to detect actively exploited vulnerabilities in JavaScript libraries and frameworks. It runs security checks in the background and displays results through a popup interface.

## Development Commands

### Setup
```bash
npm install
```

### Testing and Quality
```bash
npm run lint          # Run ESLint on all source files
npm test              # Run Jest test suite
```

### Development Workflow
```bash
npm run dev           # Run extension with auto-reload using web-ext
npm run build         # Build extension (if build script exists)
npm run package       # Create production .zip for Chrome Web Store
```

### Manual Testing
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the project directory
4. Extension reloads automatically when files change

## Architecture

### Extension Components

**Content Script** (`src/content/scanner.js`)
- Injected into all web pages at `document_idle`
- Runs `VulnerabilityScanner` class that performs security checks
- Communicates findings to background service worker
- Key methods: `detectVibeApp()`, `scanXSS()`, `scanDependencies()`, `scanDataExposure()`, `scanCSP()`

**Background Service Worker** (`src/background/service-worker.js`)
- Fetches and caches CISA KEV catalog from official JSON feed
- Auto-refreshes KEV data every 6 hours
- Stores scan results in a Map keyed by tab ID
- Updates extension badge with vulnerability count
- Bridges communication between content script and popup
- Uses `chrome.storage.local` for KEV catalog persistence
- Chrome MV3 service worker (not persistent background page)

**Popup UI** (`src/popup/popup.{html,css,js}`)
- Displays scan results when extension icon is clicked
- Shows vibe app detection status and vulnerability breakdown by severity
- Allows manual rescans via button
- Requests results from background worker using `chrome.runtime.sendMessage`

### Data Flow

1. Page loads → content script injected
2. `VulnerabilityScanner` runs all scan methods
3. Results sent to background worker via `chrome.runtime.sendMessage`
4. Background worker stores results and updates badge
5. User clicks extension → popup requests results by tab ID
6. Popup displays vulnerabilities grouped by severity

### Vulnerability Detection Methods

- **Known Exploited Vulnerabilities (KEV) with NVD Verification**:
  - Extracts library names/versions from script URLs using regex patterns
  - Checks meta generator tags for framework information
  - Cross-references detected libraries with CISA KEV catalog
  - **Automatically fetches CVE details from NIST NVD API** to verify if detected version is vulnerable
  - Compares detected version against vulnerable ranges from NVD (versionStartIncluding, versionEndExcluding, etc.)
  - Results: CRITICAL if confirmed vulnerable, LOW if version safe, MEDIUM if NVD data unavailable
  - Scans page content for CVE mentions and validates against KEV
  - Supported libraries: jQuery, React, Vue, Angular, Bootstrap, Lodash, Moment.js
- **XSS Patterns**: Scans for inline event handlers and `.innerHTML` usage (heuristic)
- **Insecure Dependencies**: Flags HTTP scripts and missing SRI on CDN resources
- **Data Exposure**: Regex patterns for exposed API keys, tokens, secrets (with false-positive filtering)
- **CSP**: Validates presence and strength of Content Security Policy

## Key Files

- `manifest.json` - Chrome extension manifest (V3)
- `src/content/scanner.js` - Core vulnerability scanning logic
- `src/background/service-worker.js` - Result storage and badge updates
- `src/popup/` - User interface for viewing scan results

## Code Conventions

- Use ES6+ JavaScript features (classes, arrow functions, async/await)
- Content script runs in isolated world - cannot access page's JavaScript directly
- Message passing uses `chrome.runtime.sendMessage` and listeners
- Severity levels: CRITICAL, HIGH, MEDIUM, LOW
- All scans return arrays of finding objects with structure: `{ type, severity, description, ...metadata }`

## CISA KEV Integration

### How It Works

1. **Background Worker Initialization**:
   - On extension install: fetches KEV catalog immediately
   - On startup: loads cached catalog or fetches fresh copy
   - Periodic refresh: every 6 hours via `chrome.alarms` API (MV3 compliant)
   - Data stored in `chrome.storage.local` for offline access
   - CVE details cached in memory and storage to avoid redundant NVD API calls

2. **Library Detection** (`extractLibraryInfo()` in scanner.js):
   - Parses script URLs for version patterns (e.g., `jquery-3.6.0.min.js`)
   - Supports formats: `library-X.Y.Z`, `library@X.Y.Z`, `library.X.Y.Z`
   - Returns `{ name, version }` object or null

3. **KEV Matching with NVD Verification** (`scanKEVCorrelation()` in scanner.js):
   - Collects all detected libraries from page
   - Requests KEV catalog from background worker
   - Matches library names against KEV product names
   - **For each match, fetches CVE details from NVD API** via `getCVEDetails()` in service worker
   - Extracts vulnerable version ranges from CPE configurations in NVD data
   - Uses `isVersionVulnerable()` to check if detected version falls in vulnerable range
   - Creates CRITICAL/confirmed finding if vulnerable, LOW/informational if safe
   - Returns findings with CVE details, version ranges, and CISA metadata

4. **NVD API Integration** (`getCVEDetails()` in service-worker.js):
   - Fetches CVE data from `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=<CVE-ID>`
   - Parses CPE match configurations to extract version constraints
   - Caches results in memory (Map) and chrome.storage.local
   - Returns structured data: `{ id, description, affectedProducts[] }`

5. **Version Comparison** (`isVersionVulnerable()` in scanner.js):
   - Parses semver versions (X.Y.Z format)
   - Handles inclusive/exclusive version range constraints from NVD
   - Returns true if version falls within vulnerable range
   - Note: Does not handle pre-release tags or build metadata

6. **CVE Mention Detection**:
   - Scans `document.body.innerText` for CVE-YYYY-NNNNN patterns
   - Validates CVEs against KEV catalog
   - Useful for detecting vulnerable dependencies mentioned in docs/error messages

### KEV Catalog Structure

Each KEV entry contains:
- `cveID`: CVE identifier
- `vendorProject`: Vendor name
- `product`: Product name
- `vulnerabilityName`: Short name
- `dateAdded`: Date added to KEV catalog
- `shortDescription`: Vulnerability description
- `requiredAction`: CISA's remediation guidance
- `dueDate`: CISA's deadline for federal agencies

### Adding Support for New Libraries

Edit `extractLibraryInfo()` in `src/content/scanner.js`:

```javascript
const patterns = [
  // Add new pattern
  { regex: /your-library[-@.](\d+\.\d+\.\d+)/i, name: 'Your Library' },
  // ... existing patterns
];
```

## Common Tasks

### Adding a New Vulnerability Check

1. Add a new `scan*()` method to `VulnerabilityScanner` class in `src/content/scanner.js`
2. Return array of findings with `type`, `severity`, `description` fields
3. If async, add `await` in `runScans()` method
4. Call the method in `runScans()` and spread results into `this.vulnerabilities`
5. Update README.md with new vulnerability type documentation

### Modifying Scan Behavior

- Edit detection logic in relevant `scan*()` methods in `src/content/scanner.js`
- To change vibe app detection: modify `detectVibeApp()` indicators array
- To adjust severity thresholds: update severity strings in scan methods

### Updating UI

- HTML structure: `src/popup/popup.html`
- Styling: `src/popup/popup.css`
- Display logic: `src/popup/popup.js` (see `displayResults()` function)
- Badge logic: `src/background/service-worker.js` (see `updateBadge()` function)

## Chrome Extension APIs Used

- `chrome.runtime`: Message passing between components
- `chrome.tabs`: Query active tab information
- `chrome.action`: Badge text/color updates, popup configuration
- `chrome.scripting`: (Declared in permissions for potential future use)
- `chrome.storage`: (Declared in permissions for potential future use)

## Permissions

- `activeTab`: Access to current tab's DOM
- `storage`: For persisting settings/results
- `scripting`: For programmatic script injection if needed
- `host_permissions: ["<all_urls>"]`: Required for content script injection on all pages

## Notes

- The extension auto-scans on page load but can be manually triggered via popup
- Scan results are stored per-tab and cleared when tab closes
- CISA KEV catalog is fetched from official CISA endpoint but cached locally
- KEV data is stored in `chrome.storage.local` and persists between sessions
- All vulnerability scanning is client-side (except initial KEV fetch)
- Icons should be added to `icons/` directory (16x16, 48x48, 128x128 PNG)
- KEV catalog URL: `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`

## Debugging

- Check KEV catalog status: Open extension background page in `chrome://extensions/` → "Inspect views: service worker"
- Console logs show: "CISA KEV catalog loaded: X vulnerabilities"
- KEV refresh failures fall back to cached data
- Version comparison uses simple semver logic in `compareVersions()`
