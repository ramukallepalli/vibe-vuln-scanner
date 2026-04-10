# Vibe Vulnerability Scanner - Installation Guide

**For eBay Product Managers**

---

## What is This?

Vibe Vulnerability Scanner is a Chrome extension that automatically scans your POCs and web applications for security vulnerabilities in real-time. It integrates with CISA's Known Exploited Vulnerabilities database to alert you about security issues before you demo to stakeholders.

**Key Benefits:**
- ⚡ Instant scanning (3-5 seconds)
- 🎯 Detects 9 types of vulnerabilities
- 🔒 Integrates with CISA's official threat database
- 📊 Clear severity ratings (Critical, High, Medium, Low)
- 🚀 Perfect for scanning POCs before demos

---

## Installation Instructions

### Step 1: Download the Extension

You should have received a file: `vibe-vuln-scanner-v1.0.0.tar.gz`

**Save it to a permanent location** (important - see note below)
- ✅ Good: `Documents/ChromeExtensions/`
- ✅ Good: `Desktop/Tools/`
- ❌ Bad: `Downloads/` (might get deleted)

**Why permanent?** Chrome needs continuous access to this folder. If you move or delete it, the extension will stop working.

### Step 2: Extract the Archive

**Windows:**
1. Right-click the `.tar.gz` file
2. Select "Extract All..." or use 7-Zip/WinRAR
3. Extract to your permanent location
4. You should now have a folder called `vibe-vuln-scanner`

**Mac:**
1. Double-click the `.tar.gz` file
2. It will automatically extract
3. Move the extracted folder to your permanent location

### Step 3: Open Chrome Extensions Page

**Method 1 (Recommended):**
1. Open Google Chrome
2. Type in the address bar: `chrome://extensions/`
3. Press Enter

**Method 2:**
1. Click the three-dot menu (⋮) in top-right corner
2. Go to: More tools → Extensions

### Step 4: Enable Developer Mode

In the top-right corner of the Extensions page:
1. Find the "Developer mode" toggle switch
2. Turn it ON (it should turn blue)

You'll now see three new buttons appear: "Load unpacked", "Pack extension", and "Update"

### Step 5: Load the Extension

1. Click the **"Load unpacked"** button
2. A file browser window will open
3. Navigate to the `vibe-vuln-scanner` folder you extracted in Step 2
4. Select the folder (the one containing `manifest.json`)
5. Click **"Select Folder"** (Windows) or **"Open"** (Mac)

### Step 6: Verify Installation

You should now see:
- ✅ "Vibe Vulnerability Scanner" appears in your extensions list
- ✅ Extension icon appears in your Chrome toolbar (top-right)
- ✅ No errors displayed

**If you see errors:** See the Troubleshooting section below

### Step 7: Test the Extension

1. Open the included test page: `test-page.html` from the extension folder
   - Or navigate to any website
2. Click the extension icon in your toolbar
3. You should see a popup with vulnerability scan results
4. The badge on the icon may show a number (vulnerability count)

**Success!** The extension is now installed and working.

---

## How to Use

### Automatic Scanning

The extension automatically scans every page you visit:
- Runs when page finishes loading
- Updates the badge with vulnerability count
- Stores results for that tab

### Manual Scanning

To manually scan a page:
1. Navigate to the page you want to scan
2. Click the extension icon in your toolbar
3. Click the **"🔄 Rescan Page"** button in the popup

### Reading Results

**Popup Overview:**
- **Vibe App Indicator:** Shows if the page is a vibe-coded application
- **Summary Stats:** Total vulnerabilities by severity
- **Detailed List:** Each vulnerability with:
  - Type (e.g., "XSS", "Known Exploited Vulnerability")
  - Severity level (color-coded)
  - Description
  - CVE details (for known vulnerabilities)

**Severity Levels:**
- 🔴 **CRITICAL:** Immediate action required (exposed keys, known exploits)
- 🟠 **HIGH:** Important security issue (XSS risks, insecure dependencies)
- 🟡 **MEDIUM:** Should fix before production (missing SRI, weak CSP)
- 🟢 **LOW:** Best practice recommendations

### Best Practices

**When to Scan:**
- ✅ Before demoing to stakeholders
- ✅ Before sharing POC URLs externally
- ✅ After making code changes
- ✅ When adding new libraries/dependencies
- ✅ Before submitting for security review

**How to Prioritize:**
1. Fix all CRITICAL issues first
2. Address HIGH issues before demo
3. Plan to fix MEDIUM issues before production
4. LOW issues are nice-to-have improvements

---

## Common Use Cases

### Scenario 1: Scanning a POC Before Demo

**Situation:** You built a customer service chatbot POC with Claude Code and want to demo it to your VP tomorrow.

**Steps:**
1. Open your POC in Chrome
2. Click the Vibe Vulnerability Scanner icon
3. Review the results
4. Fix any CRITICAL or HIGH vulnerabilities
5. Rescan to confirm they're resolved
6. Demo with confidence!

### Scenario 2: Checking Third-Party Libraries

**Situation:** Your POC uses jQuery from a CDN and you're not sure if it's the latest version.

**Steps:**
1. Open your POC
2. Extension automatically detects jQuery version
3. If vulnerable, you'll see: "jQuery X.X.X has CVE-XXXX-XXXX"
4. Update to the recommended version
5. Rescan to verify

### Scenario 3: Finding Exposed API Keys

**Situation:** You're using the OpenAI API in your POC and want to make sure the key isn't exposed.

**Steps:**
1. Open your POC
2. Extension scans page source for exposed secrets
3. If found: "⚠️ CRITICAL: Possible API key exposed in page content"
4. Move the key to backend/environment variables
5. Rescan to confirm it's no longer exposed

---

## Troubleshooting

### Problem: "Could not load manifest" error

**Cause:** Wrong folder selected or manifest.json is missing

**Solution:**
1. Make sure you selected the folder containing `manifest.json`
2. Don't select a parent folder or zip file
3. The folder structure should look like:
   ```
   vibe-vuln-scanner/
   ├── manifest.json        ← This file must be here
   ├── src/
   │   ├── content/
   │   ├── background/
   │   └── popup/
   └── icons/
   ```

### Problem: Extension icon doesn't appear

**Cause:** Icon files missing or extension not loaded

**Solution:**
1. Check that extension appears in `chrome://extensions/`
2. Extension should be "Enabled" (toggle on)
3. Click the puzzle piece icon (🧩) in Chrome toolbar
4. Pin "Vibe Vulnerability Scanner" for easy access

### Problem: "This extension may have been corrupted"

**Cause:** Files were modified or incomplete extraction

**Solution:**
1. Delete the extension from `chrome://extensions/`
2. Re-extract the .tar.gz file to a fresh folder
3. Reload the extension

### Problem: Extension stopped working after Chrome restart

**Cause:** Extension folder was moved or deleted

**Solution:**
1. Make sure the folder is still in the same location
2. If you moved it, reload the extension from new location
3. Keep the folder in a permanent location

### Problem: "CISA KEV catalog not loading"

**Cause:** Network connectivity issue or CISA API temporarily down

**Solution:**
1. Check your internet connection
2. Wait a few minutes and try again
3. Extension will use cached data if available
4. You'll see a console message: "Using cached KEV catalog"

### Problem: Too many false positives

**Cause:** Some vulnerability detection may flag safe code

**Solution:**
1. Review each finding carefully
2. CRITICAL and HIGH findings are usually accurate
3. If you believe it's a false positive, document why and proceed
4. Report persistent false positives to [your contact info]

### Problem: Scan seems slow (>10 seconds)

**Cause:** Very large page or many scripts

**Solution:**
1. This is normal for complex applications
2. Wait for scan to complete
3. Most scans complete in 3-5 seconds
4. If consistently slow, report the URL for investigation

---

## Understanding Vulnerability Types

### 1. Known Exploited Vulnerability (CRITICAL)

**What:** Library version with CVE in CISA's Known Exploited Vulnerabilities database

**Example:**
```
jQuery 1.12.4 - XSS vulnerability
CVE: CVE-2020-11023
CISA Required Action: Update to jQuery 3.5.0+
```

**Action:** Update the library to the recommended version immediately

### 2. XSS - Cross-Site Scripting (HIGH/MEDIUM)

**What:** Code patterns that could allow attackers to inject malicious scripts

**Examples:**
- Inline event handlers: `<button onclick="...">`
- Dangerous DOM manipulation: `element.innerHTML = userInput`

**Action:** Remove inline handlers, use proper event listeners, sanitize user input

### 3. Insecure Dependency (HIGH)

**What:** Scripts loaded over HTTP instead of HTTPS

**Example:**
```
Loading script over insecure HTTP connection
URL: http://example.com/script.js
```

**Action:** Change to HTTPS: `https://example.com/script.js`

### 4. Missing SRI (MEDIUM)

**What:** CDN scripts without Subresource Integrity verification

**Example:**
```
CDN script loaded without Subresource Integrity (SRI)
URL: https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/...
```

**Action:** Add `integrity` attribute to script tag

### 5. Data Exposure (CRITICAL)

**What:** API keys, tokens, or secrets visible in page source

**Example:**
```
Possible OpenAI API Key exposed in page content
Count: 1
```

**Action:** Move secrets to backend, use environment variables

### 6. Weak/Missing CSP (MEDIUM/HIGH)

**What:** Content Security Policy issues

**Examples:**
- No CSP meta tag found
- CSP allows `unsafe-inline` or `unsafe-eval`

**Action:** Add or strengthen Content Security Policy headers

---

## Frequently Asked Questions

### Q: Does this extension send my data anywhere?

**A:** No. All scanning happens locally in your browser. The only network request is fetching the CISA KEV catalog (public data) every 6 hours. Your scan results stay on your computer.

### Q: Will this slow down my browsing?

**A:** No. The extension only scans when pages finish loading and takes 3-5 seconds. You won't notice any performance impact during normal browsing.

### Q: Can I use this on production websites?

**A:** Yes, it's safe to use anywhere. However, it's designed for development/POC environments. Production sites should have comprehensive security testing.

### Q: What if I find a vulnerability but don't know how to fix it?

**A:**
1. Screenshot the finding
2. Contact eBay Security Team with details
3. Or reach out to [your contact info]
4. For CRITICAL findings, don't demo until resolved

### Q: Does it work with Single Page Applications (SPAs)?

**A:** Yes! It works with React, Vue, Angular, and other SPA frameworks. Rescan if you navigate to a new view in your SPA.

### Q: Can I scan localhost/local development servers?

**A:** Yes! Works on any URL including `localhost:3000`, `127.0.0.1`, etc.

### Q: How often is the vulnerability database updated?

**A:** The CISA KEV catalog updates automatically every 6 hours when Chrome is running.

### Q: Can I export scan results?

**A:** Not in the current version. Screenshot the popup or manually document findings. Export feature coming in future release.

### Q: Does it detect ALL security vulnerabilities?

**A:** No. It detects 9 common vulnerability types. This complements (doesn't replace) comprehensive security reviews. Always follow eBay's security review process for production code.

---

## Reporting Issues

If you encounter problems:

1. **Check Console Logs:**
   - Right-click extension icon → "Inspect popup"
   - Or go to `chrome://extensions/` → Click "Inspect views: service worker"
   - Check for error messages

2. **Collect Information:**
   - Chrome version: `chrome://version/`
   - Extension version: Check in `chrome://extensions/`
   - What you were doing when error occurred
   - Screenshot of error (if visible)

3. **Contact:**
   - Slack: #vibe-vuln-scanner
   - Email: [your.email@ebay.com]
   - Or ping me directly: [Your Name]

---

## What's Next?

### After Installation

1. **Test with the included test page**
   - Open `test-page.html` from the extension folder
   - Should detect 8+ vulnerabilities
   - Practice interpreting results

2. **Scan your current POCs**
   - Open any POCs you're working on
   - Review findings
   - Fix CRITICAL and HIGH issues

3. **Join the community**
   - Slack: #vibe-vuln-scanner
   - Share feedback
   - Report bugs
   - Request features

### Upcoming Features

- 📊 Export scan results (JSON, CSV, PDF)
- 📈 Scan history and trends
- 🎯 Custom security rules
- 🔔 Slack notifications for CRITICAL findings
- 📱 Mobile app scanning

### Share Feedback

Your feedback helps improve the tool!

**What's working well?**
**What could be better?**
**What features do you need?**

Send feedback to: [your contact method]

---

## Quick Reference Card

**Install:**
1. Extract .tar.gz to permanent location
2. Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. "Load unpacked" → Select folder

**Use:**
1. Navigate to page
2. Click extension icon
3. Review vulnerabilities
4. Fix CRITICAL → HIGH → MEDIUM
5. Rescan to verify

**Get Help:**
- Slack: #vibe-vuln-scanner
- Email: [your.email@ebay.com]

---

## Credits

**Developed by:** [Your Name]
**eBay Security Team:** [Acknowledgments]
**CISA KEV Catalog:** https://www.cisa.gov/known-exploited-vulnerabilities-catalog

**Version:** 1.0.0
**Last Updated:** April 2026

---

**Questions? Need help? Reach out anytime!**

Slack: #vibe-vuln-scanner | Email: [your.email@ebay.com]
