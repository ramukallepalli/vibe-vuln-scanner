# Vibe Vulnerability Scanner

A Chrome extension that scans web applications for security vulnerabilities with conservative, evidence-based detection.

## Important: Understanding the Scanning Model

This extension provides **heuristic security analysis**, not definitive vulnerability confirmation. Results are categorized by:

### Confidence Levels
- **High**: Strong evidence of the issue (e.g., confirmed HTTP script loading)
- **Medium**: Likely issue but requires verification (e.g., potential secret patterns)
- **Low**: Weak signal requiring manual investigation (e.g., product name matches KEV database)

### Finding Categories
- **Confirmed**: Objective fact (e.g., missing HTTPS)
- **Probable**: Likely issue based on strong evidence
- **Heuristic**: Pattern-based detection requiring context
- **Informational**: Advisory or suggestion, not a vulnerability

### CISA KEV Correlation with Automatic Version Verification

The extension automatically verifies if detected library versions are vulnerable by consulting the NIST National Vulnerability Database (NVD) API:

1. **Detects libraries** from script URLs and meta tags (jQuery, React, Vue, Angular, etc.)
2. **Matches products** against CISA KEV catalog
3. **Fetches CVE details** from NVD API to get vulnerable version ranges
4. **Compares versions** to determine if detected version falls in vulnerable range

**Result Classification:**
- **CRITICAL (confirmed)**: Version is confirmed vulnerable based on NVD data → Immediate action required
- **LOW (informational)**: Product matches KEV but version appears safe → Automatically checks if you're on latest stable release
- **MEDIUM (informational)**: Product matches KEV but NVD data unavailable → Manual verification recommended

**Fully automated verification** - the scanner:
1. Verifies if your version is vulnerable (via NVD API)
2. Checks if safe versions are up-to-date (via npm registry)
3. Provides specific remediation (e.g., "Update from 3.6.0 to 3.7.1" or "You're on the latest version")

## Features

- **Conservative Vulnerability Detection**: Heuristic-based scanning with explicit confidence levels
- **CISA KEV Awareness**: Correlates detected libraries with KEV catalog (requires manual verification)
- **Safe Popup Rendering**: No innerHTML usage, protection against extension-based XSS
- **Efficient Resource Management**: Results keyed by tab + URL, automatic cleanup on navigation/tab close
- **MV3 Compliant**: Uses chrome.alarms for periodic refresh, not setInterval
- **Minimal Permissions**: No host_permissions required, runs via content scripts only

## Installation

### Development Mode

1. Clone or download this repository
2. Install dependencies (optional, for linting/packaging):
   ```bash
   npm install
   ```
3. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `vibe-vuln-scanner` directory

### Production Build

```bash
npm run package
```

Creates a `.zip` file in `dist/` for Chrome Web Store submission.

## Usage

1. Navigate to a web page
2. Click the extension icon
3. Review findings (note severity, confidence, and category)
4. Click "Rescan Page" to run a fresh scan

## What Gets Scanned

### Heuristic Patterns (Not Confirmed Vulnerabilities)

- **Inline Event Handlers**: `onclick`, `onerror`, etc. detected → `MEDIUM` severity, `medium` confidence
- **innerHTML Usage**: Detected in scripts → `LOW` severity, `low` confidence, informational
- **Missing SRI**: CDN scripts without integrity attribute → `LOW` severity, informational

### Confirmed Issues

- **HTTP Scripts**: Loading scripts over insecure HTTP → `HIGH` severity, `high` confidence
- **Weak CSP**: `unsafe-inline` or `unsafe-eval` in CSP → `MEDIUM` severity, `high` confidence

### Known Exploited Vulnerabilities (KEV)

- **Confirmed Vulnerable Version**: Library version matches KEV and NVD confirms it's in vulnerable range → `CRITICAL` severity, `high` confidence
- **Safe Version Detected**: Library matches KEV but version is outside vulnerable range → `LOW` severity, informational
- **KEV Match (Unverified)**: Library matches KEV but NVD data unavailable → `MEDIUM` severity, `low` confidence

### Potential Issues (Require Verification)

- **Secret Exposure**: Pattern matching for API keys → `HIGH` severity, `medium` confidence

## Finding Structure

Each finding includes:

```javascript
{
  id: "finding-12345",              // Fingerprint for deduplication
  type: "INLINE_EVENT_HANDLER",
  severity: "MEDIUM",                // CRITICAL, HIGH, MEDIUM, LOW
  confidence: "medium",              // high, medium, low
  category: "heuristic",             // confirmed, probable, heuristic, informational
  title: "Inline Event Handlers Detected",
  description: "Found 3 elements with inline event handlers...",
  evidence: { count: 3, samples: [...] },
  remediation: "Consider using addEventListener...",
  metadata: {},
  timestamp: 1234567890
}
```

## Limitations

1. **No Version-Range Matching**: Cannot definitively say if a detected library version is vulnerable
2. **Heuristic XSS Detection**: Presence of `onclick` doesn't prove XSS exploitability
3. **Secret Pattern Matching**: Regex-based, prone to false positives
4. **Client-Side Only**: Cannot inspect server-side code or HTTP headers (except CSP meta tag)
5. **No DOM XSS Analysis**: Does not trace data flow to detect DOM-based XSS

## Project Structure

```
vibe-vuln-scanner/
├── manifest.json              # Extension manifest (MV3)
├── src/
│   ├── content/
│   │   └── scanner.js        # Vulnerability scanner logic
│   ├── background/
│   │   └── service-worker.js # KEV management, result storage
│   └── popup/
│       ├── popup.html        # Popup UI
│       ├── popup.css         # Styles
│       └── popup.js          # Safe DOM rendering
├── CHANGELOG.md              # Version history
└── package.json              # NPM config
```

## Available Scripts

- `npm run lint` - ESLint check
- `npm test` - Run Jest tests
- `npm run package` - Create distribution package

## CISA KEV Integration

- **Source**: https://www.cisa.gov/known-exploited-vulnerabilities-catalog
- **Update Frequency**: Every 6 hours via chrome.alarms
- **Storage**: chrome.storage.local (survives extension restarts)
- **Matching Strategy**: Product name correlation only (no version validation)

## Security & Privacy

- **No External Data Transmission**: All scanning is client-side except KEV catalog fetch (public CISA endpoint)
- **No User Tracking**: No analytics, no telemetry
- **Minimal Permissions**: activeTab, storage, alarms, tabs
- **Safe Rendering**: All popup content rendered via DOM APIs, not innerHTML

## Permissions Explained

- `activeTab`: Access current tab's DOM for scanning
- `storage`: Cache CISA KEV catalog locally
- `alarms`: Schedule periodic KEV refresh (MV3 requirement)
- `tabs`: Detect tab close/navigation for result cleanup

## Development Notes

### Message Flow

1. **Auto-scan**: Content script runs on page load → sends results to background → background stores and updates badge
2. **Manual scan**: Popup requests scan → content script scans → background stores → popup polls for results

### Adding New Scans

```javascript
scanNewPattern() {
  const findings = [];

  findings.push(this.createFinding({
    type: 'NEW_PATTERN',
    severity: 'MEDIUM',
    confidence: 'low',
    category: 'heuristic',
    title: 'Pattern Detected',
    description: 'Explanation of what was found',
    evidence: { key: 'value' },
    remediation: 'How to fix'
  }));

  return findings;
}
```

Call from `runScans()` and findings will be auto-deduplicated.

## Testing

### Manual Test Checklist

1. **Popup Rendering**: Verify no script errors, all findings render correctly
2. **Scan Lifecycle**: Trigger manual scan, verify results appear
3. **Tab Cleanup**: Close tab, verify results cleared from background
4. **Navigation Cleanup**: Navigate to new URL, verify old results cleared
5. **KEV Refresh**: Check console for alarm-based refresh (not setInterval)
6. **Safe Rendering**: Inspect popup DOM, verify no innerHTML usage
7. **Deduplication**: Run scan twice, verify findings not duplicated

### Test Page

The included `test-page.html` contains intentional issues:
- Inline event handlers
- innerHTML usage
- Missing SRI
- Weak CSP
- Potential secret exposure patterns

## Contributing

Contributions welcome. When adding detection logic:

1. Use conservative severity assignments
2. Add explicit confidence levels
3. Provide remediation guidance
4. Use `createFinding()` for structured data
5. Mark heuristics as `category: 'heuristic'`

## License

MIT

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Support

For issues or questions, open a GitHub issue.
