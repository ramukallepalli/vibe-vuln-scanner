# Privacy Policy for Vibe Vulnerability Scanner

**Last Updated:** April 26, 2026

## Overview

Vibe Vulnerability Scanner ("the Extension") is committed to protecting your privacy. This privacy policy explains our data practices for the Chrome extension.

## Data Collection

**The Extension does not collect, store, or transmit any personal data or browsing information to external servers.**

### What Data is Processed Locally

The Extension processes the following data **locally on your device only**:

1. **Page Content Analysis**
   - DOM structure of web pages you visit
   - JavaScript libraries and their versions
   - HTML meta tags
   - Security headers (CSP, HSTS, etc.)
   - **Purpose**: To detect security vulnerabilities
   - **Storage**: Not stored; analyzed in real-time only

2. **Scan Results**
   - Vulnerability findings from scanned pages
   - Scan timestamps
   - Domain names of scanned sites
   - **Purpose**: To display scan history (last 50 scans per domain)
   - **Storage**: Stored locally in Chrome's storage API on your device
   - **Retention**: Until manually cleared or limited to 50 scans per domain

3. **CISA KEV Catalog Cache**
   - Public vulnerability catalog from CISA
   - **Purpose**: To check for known exploited vulnerabilities
   - **Storage**: Cached locally for 24 hours
   - **Source**: https://www.cisa.gov/known-exploited-vulnerabilities-catalog (public data)

4. **CVE Data Cache**
   - Public vulnerability details from NVD
   - **Purpose**: To verify vulnerable version ranges
   - **Storage**: Cached locally permanently
   - **Source**: https://services.nvd.nist.gov/rest/json/cves/2.0 (public data)

### What Data is NOT Collected

- ❌ Personal information (name, email, etc.)
- ❌ Browsing history
- ❌ Cookies or tracking data
- ❌ IP addresses
- ❌ User credentials
- ❌ Form data
- ❌ Financial information
- ❌ Analytics or telemetry

## Data Transmission

The Extension makes **only two types of outbound requests**, both to public APIs:

1. **CISA KEV Catalog** (every 6 hours)
   - URL: `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`
   - Purpose: Update vulnerability database
   - Data sent: None (GET request only)

2. **NIST NVD API** (on-demand when analyzing vulnerabilities)
   - URL: `https://services.nvd.nist.gov/rest/json/cves/2.0`
   - Purpose: Fetch CVE version details
   - Data sent: CVE ID only (e.g., `CVE-2024-1234`)

**No user data, browsing data, or scan results are ever transmitted to any server.**

## Data Storage

All data is stored **locally on your device** using Chrome's storage API:

- **Location**: Your local Chrome profile storage
- **Access**: Only this extension can access this data
- **Deletion**: Automatically managed (50 scan limit per domain) or manually via Chrome settings

### How to Clear Stored Data

1. **Clear All Data**:
   - Go to `chrome://extensions/`
   - Find "Vibe Vulnerability Scanner"
   - Click "Remove" to uninstall (deletes all data)

2. **Clear Storage Manually**:
   - Open Chrome DevTools
   - Go to Application → Storage
   - Clear "Local Storage" and "IndexedDB" for the extension

3. **Clear Scan History**:
   - Click extension icon
   - Click "Clear History" button (if available in future version)

## Permissions Explained

The Extension requests the following permissions:

### activeTab
- **Purpose**: Access the current tab's DOM for vulnerability scanning
- **Data Access**: Page content, scripts, headers of the active tab only
- **When**: Only when you click the extension icon
- **Transmission**: Data analyzed locally, not transmitted

### storage
- **Purpose**: Cache CISA KEV catalog and store scan history locally
- **Data Stored**: Scan results, vulnerability catalog (all local)
- **Transmission**: None

### alarms
- **Purpose**: Schedule KEV catalog updates every 6 hours
- **Data Access**: None
- **Transmission**: Triggers CISA KEV download only

### tabs
- **Purpose**: Detect tab close/navigation for cleanup and badge updates
- **Data Access**: Tab URL and state (not stored)
- **Transmission**: None

### webRequest
- **Purpose**: Analyze HTTP response headers for security header detection
- **Data Access**: HTTP headers only (CSP, HSTS, etc.)
- **Transmission**: None

### downloads
- **Purpose**: Enable export of scan results as JSON/CSV
- **Data Access**: Scan results you choose to export
- **Transmission**: Downloaded to your device only

### host_permissions (<all_urls>)
- **Purpose**: Scan any website you visit
- **Data Access**: Content of pages you actively scan
- **Transmission**: None

## Third-Party Services

The Extension uses these **public APIs only**:

1. **CISA KEV Catalog** (U.S. Government)
   - Privacy Policy: https://www.cisa.gov/privacy-policy
   - Data: Public vulnerability catalog

2. **NIST NVD** (U.S. Government)
   - Privacy Policy: https://www.nist.gov/privacy-policy
   - Data: Public CVE database

**No third-party analytics, advertising, or tracking services are used.**

## Children's Privacy

The Extension does not knowingly collect data from anyone, including children under 13. As no data is collected or transmitted, COPPA compliance is maintained.

## Open Source

The Extension is **fully open source**:
- Source code: https://github.com/ramukallepalli/vibe-vuln-scanner
- You can audit all code to verify privacy claims
- Community contributions welcome

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be posted:
- In this document on GitHub
- With an updated "Last Updated" date
- Users will be notified via extension update notes

## Data Controller

This Extension is developed and maintained by:

**Ramu Kallepalli**  
Email: ramu.kallepalli@gmail.com  
GitHub: https://github.com/ramukallepalli/vibe-vuln-scanner

## Your Rights

Since no personal data is collected or transmitted:
- There is no data to access, export, or delete from our servers
- All data is stored locally on your device under your control
- You can delete all data by uninstalling the extension

## Contact

For privacy questions or concerns:
- **Email**: ramu.kallepalli@gmail.com
- **GitHub Issues**: https://github.com/ramukallepalli/vibe-vuln-scanner/issues
- **GitHub Discussions**: https://github.com/ramukallepalli/vibe-vuln-scanner/discussions

## Legal Compliance

This Extension complies with:
- ✅ GDPR (EU General Data Protection Regulation)
- ✅ CCPA (California Consumer Privacy Act)
- ✅ COPPA (Children's Online Privacy Protection Act)
- ✅ Chrome Web Store Developer Program Policies

**Why?** Because we don't collect any personal data.

## Summary

**In Plain English:**

✅ We don't collect your data  
✅ We don't track you  
✅ We don't sell anything  
✅ Everything happens on your device  
✅ Only public vulnerability databases are accessed  
✅ You're in full control  

**Questions?** Open an issue on GitHub or contact us directly.

---

**Licensed under Apache License 2.0**
