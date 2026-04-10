# Testing Guide

## Quick Verification

After applying fixes, run these tests to verify everything works correctly.

## Pre-Test Setup

1. **Load Extension in Chrome**
   ```
   chrome://extensions/
   → Enable Developer mode
   → Load unpacked
   → Select vibe-vuln-scanner directory
   ```

2. **Open DevTools**
   - For popup: Right-click extension icon → Inspect popup
   - For background: chrome://extensions/ → Click "Inspect views: service worker"
   - For content: F12 on webpage

---

## Test 1: Safe Popup Rendering (XSS Protection)

**Goal**: Verify no `innerHTML` usage, all content escaped

**Steps**:
1. Open `src/content/scanner.js` temporarily
2. Add malicious test finding:
   ```javascript
   // In runScans(), before deduplication:
   this.findings.push(this.createFinding({
     type: 'XSS_TEST',
     severity: 'MEDIUM',
     confidence: 'high',
     category: 'heuristic',
     title: '<script>alert("FAIL")</script>',
     description: '<img src=x onerror=alert("FAIL")>Test description',
     evidence: { test: '<b>Bold</b>' },
     remediation: '<script>alert("FAIL2")</script>'
   }));
   ```
3. Reload extension
4. Navigate to any page
5. Open popup

**Expected**:
- ✅ Text `<script>alert("FAIL")</script>` appears as literal text
- ✅ No alert() dialogs
- ✅ No bold text in evidence
- ✅ All HTML tags visible as text

**If Failed**: innerHTML is still being used

---

## Test 2: MV3 Alarms (No setInterval)

**Goal**: Verify KEV refresh uses alarms, not timers

**Steps**:
1. Load extension
2. Open background service worker console
3. Run in console:
   ```javascript
   chrome.alarms.getAll(console.log)
   ```

**Expected**:
- ✅ Console shows alarm named `kevRefreshAlarm`
- ✅ Alarm has `periodInMinutes: 360` (6 hours)
- ✅ Background console shows "KEV refresh alarm configured"

**Additional**:
- Search codebase for `setInterval`:
  ```bash
  grep -r "setInterval" src/
  ```
- ✅ Should find no matches

**If Failed**: Still using setInterval instead of alarms

---

## Test 3: Scan Lifecycle (No Race Conditions)

**Goal**: Verify proper request/response flow, no fixed timeouts

**Steps**:
1. Navigate to test-page.html (or any page)
2. Open popup
3. Watch network/console for scan activity
4. Click "Rescan Page"
5. Repeat 3x rapidly

**Expected**:
- ✅ Scan completes and results appear
- ✅ No "undefined" or "null" results
- ✅ Rapid rescans don't show stale data
- ✅ Loading indicator appears briefly, then results

**Check Code**:
```bash
grep "setTimeout.*500" src/popup/popup.js
```
- ✅ Should find no hardcoded 500ms timeout

**If Failed**: Race condition still present

---

## Test 4: Tab/Navigation Cleanup

**Goal**: Verify results cleared on navigation and tab close

**Steps**:
1. Open Tab A, navigate to google.com
2. Open popup, wait for scan
3. Navigate Tab A to ebay.com
4. Open popup

**Expected**:
- ✅ New scan triggers (doesn't show Google results)
- ✅ Results are for ebay.com, not google.com

**Steps (Tab Close)**:
1. Open Tab B, navigate to example.com
2. Scan
3. Open background console
4. Run: `chrome.extension.getBackgroundPage().scanResults`
5. Note Tab B's ID
6. Close Tab B
7. Re-run step 4

**Expected**:
- ✅ Tab B's results removed from Map

**If Failed**: Memory leak, stale results across navigation

---

## Test 5: NVD Integration - Automatic Version Verification

**Goal**: Verify automatic CVE version checking via NVD API

**Test 5A: Vulnerable Version Detection**

**Steps**:
1. Open `test-nvd-integration.html` in Chrome (includes jQuery 3.4.1, which is vulnerable to CVE-2020-11022/11023)
2. Open popup
3. Wait for scan to complete (may take 3-5 seconds for NVD API calls)
4. Look for jQuery-related finding

**Expected**:
- ✅ Finding type: `KNOWN_EXPLOITED_VULNERABILITY`
- ✅ Severity: `CRITICAL`
- ✅ Confidence: `high`
- ✅ Category: `confirmed`
- ✅ Title: "Confirmed KEV: jQuery 3.4.1"
- ✅ Description mentions: "confirmed vulnerable based on NVD data"
- ✅ Evidence includes: version range showing vulnerable range (e.g., "< 3.5.0")
- ✅ Remediation mentions: specific version to update to

**Test 5B: Safe Version Detection**

**Steps**:
1. Edit `test-nvd-integration.html`: comment out jQuery 3.4.1, uncomment jQuery 3.7.1
2. Reload page
3. Open popup
4. Look for jQuery-related finding

**Expected**:
- ✅ Finding type: `KEV_PRODUCT_SAFE_VERSION`
- ✅ Severity: `LOW`
- ✅ Confidence: `medium`
- ✅ Category: `informational`
- ✅ Description mentions: "outside the vulnerable range based on NVD data"
- ✅ Remediation: "Version appears safe, but verify you're using the latest stable release"

**Test 5C: NVD API Caching**

**Steps**:
1. Open service worker console (chrome://extensions/ → Inspect views)
2. Scan page with vulnerable jQuery
3. Check console for: "Fetched CVE details for CVE-2020-XXXXX"
4. Rescan same page
5. Check console again

**Expected**:
- ✅ First scan: NVD API fetch message appears
- ✅ Second scan: No new fetch message (uses cache)
- ✅ In console run: `chrome.storage.local.get(null, console.log)`
- ✅ Verify keys like `cve_CVE-2020-11022` exist in storage

**If Failed**:
- NVD API integration not working
- Version comparison logic broken
- Caching not functioning

---

## Test 6: Latest Version Checking

**Goal**: Verify automatic latest version checking for safe libraries

**Test 6A: Outdated but Safe Version**

**Steps**:
1. Open `test-latest-version.html` (includes jQuery 3.6.0 - safe but outdated)
2. Open popup
3. Wait for scan to complete
4. Find jQuery KEV_PRODUCT_SAFE_VERSION finding

**Expected**:
- ✅ Severity: `LOW`
- ✅ Evidence includes both:
  - `detectedVersion: "3.6.0"`
  - `latestVersion: "3.7.1"` (or current latest)
- ✅ Remediation: "Version 3.6.0 is safe but outdated. Latest stable version is 3.7.1. Consider updating."
- ✅ NOT: Generic "verify you're using the latest stable release"

**Test 6B: Up-to-Date Version**

**Steps**:
1. Edit `test-latest-version.html`: uncomment jQuery 3.7.1
2. Reload page
3. Open popup

**Expected**:
- ✅ Evidence shows: `detectedVersion: "3.7.1"`, `latestVersion: "3.7.1"`
- ✅ Remediation: "Version 3.7.1 is safe and up-to-date (latest stable release)."

**Test 6C: npm Registry Caching**

**Steps**:
1. Open service worker console
2. Scan page with jQuery
3. Check console for: "Fetched latest version for jQuery: 3.7.1"
4. Rescan same page
5. Check console again

**Expected**:
- ✅ First scan: npm fetch message appears
- ✅ Second scan: No new fetch message (uses cache)
- ✅ Run: `chrome.storage.local.get(null, console.log)`
- ✅ Verify key `latest_jquery` exists with version and timestamp

**If Failed**:
- npm registry integration not working
- Version comparison broken
- Latest version not shown in remediation

---

## Test 7: Heuristic Downgrade

**Goal**: Verify inline handlers not marked as HIGH/CRITICAL

**Steps**:
1. Create test HTML:
   ```html
   <!DOCTYPE html>
   <html>
   <body>
     <button onclick="alert('test')">Click</button>
     <img src="x" onerror="console.log('error')">
   </body>
   </html>
   ```
2. Open file
3. Open popup
4. Find "Inline Event Handlers" finding

**Expected**:
- ✅ Severity: `MEDIUM` (not HIGH or CRITICAL)
- ✅ Confidence: `medium`
- ✅ Category: `heuristic`
- ✅ Description mentions "not always exploitable" or similar disclaimer

**If Failed**: Still overclaiming vulnerabilities

---

## Test 7: Finding Deduplication

**Goal**: Verify findings not duplicated

**Steps**:
1. Navigate to page with issues
2. Open popup, note finding count
3. Click "Rescan Page"
4. Compare finding count

**Expected**:
- ✅ Count stays same or changes legitimately (page changed)
- ✅ No duplicate findings with identical descriptions

**Check Code**:
```bash
grep "deduplicateFindings" src/content/scanner.js
```
- ✅ Should find method being called

**If Failed**: Findings duplicated on rescan

---

## Test 8: Permissions Minimization

**Goal**: Verify minimal permissions

**Steps**:
1. Check manifest.json:
   ```bash
   cat manifest.json | grep -A5 permissions
   ```

**Expected**:
```json
"permissions": [
  "activeTab",
  "storage",
  "alarms",
  "tabs"
],
"host_permissions": []
```
- ✅ No `<all_urls>` in host_permissions
- ✅ No `scripting` permission

**If Failed**: Too many permissions

---

## Test 9: Error Handling

**Goal**: Verify graceful error handling

**Steps**:
1. Navigate to restricted page: `chrome://extensions/`
2. Try to open popup

**Expected**:
- ✅ Error message: "Could not scan page..." or similar
- ✅ No uncaught exceptions in console
- ✅ No blank/broken popup

**Steps (Network Error)**:
1. Block network access to cisa.gov
2. Reload extension
3. Open background console

**Expected**:
- ✅ Console shows "Failed to fetch KEV catalog"
- ✅ Falls back to cached data
- ✅ Extension still functional

**If Failed**: Crashes on errors

---

## Test 10: Confidence Badges

**Goal**: Verify low/medium confidence findings show badge

**Steps**:
1. Trigger scan with low-confidence finding (KEV product match)
2. Open popup
3. Look for confidence indicator

**Expected**:
- ✅ Badge visible saying "Confidence: low" or "Confidence: medium"
- ✅ Badge styled distinctly from severity badge

**If Failed**: Confidence not visible to user

---

## Regression Test: Basic Functionality

**Goal**: Ensure fixes didn't break core features

**Steps**:
1. Open test-page.html
2. Open popup

**Expected Findings** (approximate):
- ✅ Inline Event Handler (MEDIUM)
- ✅ innerHTML Usage (LOW)
- ✅ Missing SRI (LOW)
- ✅ Weak CSP (MEDIUM)
- ✅ Potential Secret Exposure (HIGH)
- ✅ Total: 5-8 findings

**Expected UI**:
- ✅ Summary stats correct
- ✅ Findings grouped by severity
- ✅ Each finding has remediation
- ✅ Rescan button works

**If Failed**: Core scanning broken

---

## Performance Test

**Goal**: Verify no major performance degradation

**Steps**:
1. Navigate to large page (e.g., wikipedia.org)
2. Note page load time without extension
3. Reload with extension enabled
4. Open popup

**Expected**:
- ✅ Page load impact < 500ms
- ✅ Scan completes in < 5 seconds
- ✅ Popup renders in < 1 second
- ✅ No browser lag/freezing

**If Failed**: Performance regression

---

## Manual Code Audit

**Checklist**:

### service-worker.js
- [ ] No `setInterval()`
- [ ] Uses `chrome.alarms`
- [ ] Tab cleanup listeners present
- [ ] Navigation cleanup present
- [ ] Single message router
- [ ] Proper async/await

### scanner.js
- [ ] All findings use `createFinding()`
- [ ] KEV findings are MEDIUM/informational
- [ ] No CRITICAL without strong evidence
- [ ] Deduplication called
- [ ] No "vibe app" detection

### popup.js
- [ ] No `innerHTML` usage
- [ ] Uses `createElement()` and `textContent`
- [ ] No `setTimeout()` for scan flow
- [ ] Proper error handling
- [ ] `chrome.runtime.lastError` checked

### manifest.json
- [ ] Version 1.1.0
- [ ] No `host_permissions: ["<all_urls>"]`
- [ ] Includes `alarms` permission
- [ ] Includes `tabs` permission

---

## Pass Criteria

All tests above should pass. If any test fails, the corresponding fix was not applied correctly.

**Minimum for Production**:
- Test 1 (XSS): MUST PASS
- Test 2 (Alarms): MUST PASS
- Test 4 (Cleanup): MUST PASS
- Test 5 (KEV accuracy): MUST PASS
- Test 8 (Permissions): MUST PASS

**Nice to Have**:
- All other tests pass
- No console errors
- User-friendly error messages

---

## Debugging Tips

### "Scan not running"
- Check content script injected: F12 → Sources → Content Scripts
- Check console for errors
- Try manual rescan

### "Results not appearing"
- Check background console for "scanComplete" messages
- Check popup console for getResults response
- Verify tab ID matches

### "Alarm not firing"
- Check: `chrome.alarms.getAll(console.log)`
- Alarms may not fire if service worker suspended
- Next alarm: check `scheduledTime` in alarm object

### "Memory leak suspected"
- Background console: `scanResults.size`
- Open/close many tabs, check size doesn't grow unbounded
- Should clear on tab close

---

## Automated Testing (Future)

Consider adding Jest tests for:
- `createFinding()` structure
- `deduplicateFindings()` logic
- `createSessionId()` consistency
- Finding severity assignment
- Evidence structure validation

Example:
```javascript
test('createFinding generates consistent IDs', () => {
  const scanner = new VulnerabilityScanner();
  const f1 = scanner.createFinding({ type: 'TEST', description: 'Same' });
  const f2 = scanner.createFinding({ type: 'TEST', description: 'Same' });
  expect(f1.id).toBe(f2.id);
});
```

---

## Sign-Off

After all tests pass:

1. **Document Results**:
   - Date tested: ___________
   - Tester: ___________
   - All tests passed: Yes/No
   - Notes: ___________

2. **Tag Release**:
   ```bash
   git tag -a v1.1.0 -m "Security and architecture fixes"
   git push origin v1.1.0
   ```

3. **Deploy**:
   - Package: `npm run package`
   - Upload to Chrome Web Store or distribute internally
   - Update documentation

**Ready for production when all critical tests pass.**
