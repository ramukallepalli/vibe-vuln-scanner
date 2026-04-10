# Vibe Vulnerability Scanner - Installation Guide

## Quick Start (2 Minutes)

This Chrome extension helps you instantly scan web applications for security vulnerabilities, including those listed in CISA's Known Exploited Vulnerabilities (KEV) catalog.

### Installation Steps

1. **Extract the package**
   ```bash
   tar -xzf vibe-vuln-scanner.tar.gz
   cd vibe-vuln-scanner
   ```

2. **Open Chrome Extensions page**
   - Navigate to: `chrome://extensions/`
   - Or: Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the extension**
   - Click "Load unpacked"
   - Select the `vibe-vuln-scanner` folder you extracted
   - The extension should now appear in your extensions list

5. **Verify installation**
   - You should see the Vibe Vulnerability Scanner icon in your Chrome toolbar
   - The icon shows a shield symbol

### First Scan

1. **Navigate to any website** (try an eBay internal tool or any public site)

2. **Click the extension icon** in your toolbar

3. **View results**
   - Scan runs automatically when page loads
   - Results show in the popup
   - Badge on icon shows vulnerability count

4. **Rescan anytime**
   - Click "Rescan Page" button in popup
   - Useful after page updates or to get fresh results

## What It Scans For

### Known Exploited Vulnerabilities (KEV)
- Automatically checks if your page uses libraries with known exploits
- Correlates with CISA's official KEV catalog (~1,200 vulnerabilities)
- **Verifies actual vulnerability** by checking version ranges via NIST NVD API
- Reports CRITICAL only when version is confirmed vulnerable

**Example Finding**:
```
CRITICAL: Confirmed KEV: jQuery 3.4.1
Description: jQuery 3.4.1 is affected by CVE-2020-11022, a known
exploited vulnerability. This version is confirmed vulnerable based
on NVD data.
Remediation: Update jQuery immediately. Vulnerable range: < 3.5.0
```

### Outdated Dependencies
- Checks if safe library versions are up-to-date
- Compares against latest stable releases from npm registry
- Provides specific upgrade recommendations

**Example Finding**:
```
LOW: KEV Product Detected (Safe Version): jQuery
Description: jQuery 3.6.0 detected. This version is outside the
vulnerable range based on NVD data.
Evidence: detectedVersion: 3.6.0, latestVersion: 3.7.1
Remediation: Version 3.6.0 is safe but outdated. Latest stable
version is 3.7.1. Consider updating.
```

### Other Security Issues
- Insecure HTTP script loading (HIGH severity)
- Inline event handlers (XSS risk indicators)
- Missing Subresource Integrity (SRI) on CDN scripts
- Weak Content Security Policy (CSP)
- Potential exposed secrets (API keys, tokens)

## Understanding Results

### Severity Levels
- **CRITICAL**: Confirmed vulnerability, immediate action recommended
- **HIGH**: Significant security concern
- **MEDIUM**: Moderate risk or best practice violation
- **LOW**: Informational, minor improvement opportunity

### Confidence Levels
- **High**: Strong evidence, confirmed by authoritative sources
- **Medium**: Likely issue but requires verification
- **Low**: Weak signal, manual investigation recommended

### Finding Categories
- **Confirmed**: Objective fact (e.g., confirmed vulnerable version)
- **Probable**: Likely issue based on strong evidence
- **Heuristic**: Pattern-based detection, context-dependent
- **Informational**: Advisory or suggestion, not a vulnerability

## Common Use Cases

### 1. Sprint Planning
**Question**: Do we have security vulnerabilities to prioritize?
**Action**: Scan your product, check for CRITICAL/HIGH findings

### 2. Dependency Audit
**Question**: Are our libraries up-to-date and secure?
**Action**: Scan and review KEV findings and version recommendations

### 3. Incident Response
**Question**: Are we affected by newly announced CVE-XXXX-XXXXX?
**Action**: Scan to see if the CVE is detected in your stack

### 4. Security Review Prep
**Question**: What's our security posture before the audit?
**Action**: Document findings and create remediation plan

### 5. Compliance Monitoring
**Question**: Are we monitoring for KEV vulnerabilities?
**Action**: Regular scans demonstrate proactive monitoring

## Tips for Best Results

### ✅ Do:
- Scan on fully loaded pages (wait for all scripts to load)
- Use "Rescan Page" for fresh results after changes
- Check both production and staging environments
- Document findings for your engineering team
- Rescan after applying updates to verify fixes

### ❌ Don't:
- Treat LOW/informational findings as critical issues
- Panic over false positives (check confidence level)
- Ignore CRITICAL findings (these are verified vulnerabilities)
- Scan pages before they fully load
- Expect detection of server-side vulnerabilities (only client-side)

## What the Scanner Can't Do

**Important Limitations**:
- ✗ Cannot detect vulnerabilities in server-side code (backend APIs, databases)
- ✗ Cannot access HTTP security headers (only meta tag CSP)
- ✗ Cannot scan WebSocket or API responses
- ✗ Cannot detect runtime XSS (only patterns in HTML)
- ✗ Cannot scan bundled/webpack libraries (version info not exposed)

**Still valuable for**:
- ✓ Identifying vulnerable client-side dependencies
- ✓ Discovering outdated libraries
- ✓ Quick security posture assessment
- ✓ Prioritizing security updates

## Troubleshooting

### "No results showing"
- Ensure page is fully loaded
- Check that extension is enabled (chrome://extensions/)
- Try clicking "Rescan Page" button
- Check browser console (F12) for errors

### "Scan seems slow (3-5 seconds)"
- Normal for first scan (fetching from NVD/npm APIs)
- Subsequent scans are faster (cached data)
- Slow network may increase scan time

### "Results seem stale"
- Results are cached for 5 minutes per URL
- Click "Rescan Page" to force fresh scan
- Navigate away and back to reset cache

### "Extension not working on some sites"
- Cannot scan chrome:// pages (browser restriction)
- Cannot scan some internal sites with strict CSP
- Some sites may block content script injection

### "Getting different results than security tools"
- This scanner focuses on client-side JavaScript
- Other tools may scan server-side, network, etc.
- Results are complementary, not comprehensive

## Support & Feedback

### Getting Help
- **Slack**: [#vulnerability-scanner] (join for questions and updates)
- **Office Hours**: [Weekly drop-in sessions - schedule TBD]
- **Documentation**: Full docs available in the package (README.md)
- **Issues**: Report bugs or request features via [method TBD]

### Providing Feedback
We'd love to hear from you:
- What vulnerabilities did you find?
- Which features are most valuable?
- What would make this more useful?
- Any false positives or issues?

### Feature Roadmap
Upcoming enhancements (community-driven):
- Export findings as CSV/JSON
- Historical tracking of scan results
- Batch scanning multiple URLs
- Integration with eBay security tools
- Customizable severity thresholds

## Privacy & Data

**What data is collected**:
- None. All scanning happens locally in your browser.

**What data is sent externally**:
- CISA KEV catalog download (one-time, cached)
- NVD API queries for CVE details (cached per CVE)
- npm registry queries for latest versions (cached per library)

**What is NOT collected**:
- Your browsing history
- The URLs you scan
- Your scan results
- Any personal information

All data stays in your browser. No telemetry, no tracking.

## Updating the Extension

When a new version is released:

1. Download the new .tar.gz package
2. Extract to a new folder
3. Go to `chrome://extensions/`
4. Click "Remove" on the old version
5. Click "Load unpacked" and select the new folder

Or simply:
1. Extract new version to same folder (overwrite)
2. Go to `chrome://extensions/`
3. Click the reload icon (🔄) on the extension card

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "Vibe Vulnerability Scanner"
3. Click "Remove"
4. Confirm removal

All cached data will be cleared from Chrome storage.

## Technical Details

**Built with**: AI-assisted development using Claude Code
**Architecture**: Chrome Manifest V3 extension
**APIs integrated**:
- CISA KEV Catalog
- NIST National Vulnerability Database (NVD)
- npm Registry

**Supported libraries**: jQuery, React, Vue, Angular, Bootstrap, Lodash, Moment.js, D3, Axios, Chart.js

**License**: [Specify license]
**Version**: 1.1.0
**Last updated**: April 2026

## Questions?

For any questions or issues, reach out via Slack [#vulnerability-scanner] or contact [your name/email].

Happy scanning! 🔒🛡️
