# Latest Version Checking - Feature Documentation

## Overview

The scanner now automatically checks if safe library versions are the latest stable release by querying the npm registry. Users no longer see the generic message "verify you're using the latest stable release" - instead, they get specific, actionable information.

## Problem Solved

**Before:**
- Remediation: "Version appears safe, but verify you're using the latest stable release."
- User had to manually check npm, GitHub, or vendor site
- Unclear if they're running outdated software

**After:**
- Remediation: "Version 3.6.0 is safe but outdated. Latest stable version is 3.7.1. Consider updating."
- OR: "Version 3.7.1 is safe and up-to-date (latest stable release)."
- User gets immediate, actionable intelligence

## Implementation

### Architecture

**Service Worker (`src/background/service-worker.js`)**

Added:
1. **npm Registry Integration**
   - Constant: `NPM_REGISTRY_BASE = 'https://registry.npmjs.org'`
   - Maps library names to npm package names (e.g., "jquery" → "jquery", "moment.js" → "moment")

2. **getLatestVersion(libraryName) Function**
   - Checks two-tier cache (memory + storage) with 1-hour TTL
   - Maps library name to npm package name
   - Fetches from npm registry: `GET https://registry.npmjs.org/{package}`
   - Extracts latest stable version from `dist-tags.latest`
   - Caches result for 1 hour
   - Returns version string or null

3. **Cache Management**
   - `latestVersionCache` Map for in-memory storage
   - `chrome.storage.local` with keys like `latest_jquery`
   - TTL: 1 hour (versions change more frequently than CVE data)

4. **Message Handler**
   - Added case for `getLatestVersion` action

**Content Script (`src/content/scanner.js`)**

Modified:
1. **scanKEVCorrelation() Method**
   - When version is safe (not vulnerable), sends `getLatestVersion` message
   - Receives latest version from npm registry
   - Compares detected version vs. latest version
   - Updates remediation message based on comparison

2. **compareVersions(v1, v2) Method**
   - Compares two semver versions (X.Y.Z format)
   - Returns: -1 (v1 < v2), 0 (equal), 1 (v1 > v2)
   - Handles basic semver only (no pre-release tags)

### Data Flow

```
1. Scanner detects jQuery 3.6.0 (safe version, not vulnerable)
2. Content script sends: chrome.runtime.sendMessage({ action: 'getLatestVersion', libraryName: 'jQuery' })
3. Service worker:
   - Checks cache → miss
   - Maps "jQuery" → "jquery" (npm package name)
   - Fetches: GET https://registry.npmjs.org/jquery
   - Receives: { "dist-tags": { "latest": "3.7.1" }, ... }
   - Caches: latestVersionCache.set('jquery', { version: '3.7.1', timestamp: now })
   - Returns: { latestVersion: '3.7.1' }
4. Content script:
   - Compares: compareVersions('3.6.0', '3.7.1') → -1 (outdated)
   - Sets remediation: "Version 3.6.0 is safe but outdated. Latest stable is 3.7.1. Consider updating."
   - Adds to evidence: { latestVersion: '3.7.1' }
5. User sees specific, actionable finding
```

### Remediation Messages

**Case 1: Detected < Latest**
```
Remediation: "Version 3.6.0 is safe but outdated. Latest stable version is 3.7.1. Consider updating."
```

**Case 2: Detected == Latest**
```
Remediation: "Version 3.7.1 is safe and up-to-date (latest stable release)."
```

**Case 3: Detected > Latest** (rare, pre-release/beta)
```
Remediation: "Version 4.0.0-beta is safe. Latest stable is 3.7.1."
```

**Case 4: npm fetch failed**
```
Remediation: "Version appears safe based on NVD data."
(Graceful fallback to original behavior)
```

## Supported Libraries

Libraries with npm package mappings:
- jQuery → `jquery`
- React → `react`
- Vue → `vue`
- Angular → `@angular/core`
- Bootstrap → `bootstrap`
- Lodash → `lodash`
- Moment.js → `moment`
- D3.js → `d3`
- Axios → `axios`
- Chart.js → `chart.js`

To add support for new libraries, update `NPM_PACKAGE_MAP` in service-worker.js:
```javascript
const NPM_PACKAGE_MAP = {
  'your-library': 'npm-package-name',
  // ...
};
```

## Caching Strategy

### Why Cache?
- npm registry has rate limits
- Versions don't change frequently (stable releases are weeks/months apart)
- Improves scan performance

### Cache TTL
- **Latest version cache**: 1 hour
  - Reason: Balances freshness vs. performance
  - Longer than CVE cache because we want reasonably current version data
  - Shorter than KEV cache because versions change more often than CVEs

### Cache Layers
1. **Memory** (`latestVersionCache` Map)
   - Fastest access
   - Cleared on service worker restart
   - Checked first

2. **Storage** (`chrome.storage.local`)
   - Persists across restarts
   - Key format: `latest_{libraryname}`
   - Checked if memory miss

3. **Network** (npm registry)
   - Only if both caches miss or expired
   - Result written to both cache layers

## Evidence Field Enhancement

The finding's evidence object now includes:
```javascript
evidence: {
  detectedProduct: "jQuery",
  detectedVersion: "3.6.0",
  cveId: "CVE-2020-11022",
  url: "https://code.jquery.com/jquery-3.6.0.min.js",
  latestVersion: "3.7.1"  // ← NEW
}
```

This allows users to:
- See both versions at a glance
- Understand exactly what update is needed
- Track version drift across their sites

## Performance Impact

### Latency
- npm registry API call: ~100-300ms (typical)
- Cached lookups: <1ms
- Scan with 3 safe libraries (first run): +300-900ms
- Scan with 3 safe libraries (cached): negligible

### Mitigation
- Cache hits after first scan
- Only fetches for safe versions (not vulnerable ones)
- Runs in parallel with NVD API calls
- Graceful degradation if npm is slow/down

## Error Handling

### npm Registry Unavailable
- Fallback to: "Version appears safe based on NVD data."
- No error shown to user
- Service worker logs error for debugging

### Package Not Found (404)
- Returns null (no latest version info)
- Remediation shows fallback message
- Logged: "No npm mapping for {library}" or fetch error

### Rate Limiting
- npm registry is generous (no auth required)
- If rate limited, falls back gracefully
- Future: Could add retry logic

## Testing

### Manual Test
Use `test-latest-version.html`:
- jQuery 3.6.0 (safe but outdated)
- Expected: "safe but outdated. Latest is 3.7.1. Consider updating."

### Service Worker Console
```javascript
// Check cache
chrome.storage.local.get(null, console.log);
// Look for: latest_jquery: { version: "3.7.1", timestamp: ... }

// Manually fetch latest
fetch('https://registry.npmjs.org/jquery')
  .then(r => r.json())
  .then(d => console.log(d['dist-tags'].latest));

// Clear version cache
chrome.storage.local.get(null, (items) => {
  const keys = Object.keys(items).filter(k => k.startsWith('latest_'));
  chrome.storage.local.remove(keys);
});
```

### Expected Outputs

**Scenario: jQuery 3.6.0 detected**
- Service worker log: "Fetched latest version for jQuery: 3.7.1"
- Finding remediation: "Version 3.6.0 is safe but outdated..."
- Evidence includes: `latestVersion: "3.7.1"`

**Scenario: jQuery 3.7.1 detected**
- Service worker log: "Fetched latest version for jQuery: 3.7.1"
- Finding remediation: "Version 3.7.1 is safe and up-to-date..."
- Evidence includes: `latestVersion: "3.7.1"`

## Limitations

### 1. npm-Only
- Only works for libraries published on npm
- Non-npm libraries (CDN-only, custom builds) won't have version checking
- Gracefully degrades to generic message

### 2. Package Name Mapping
- Requires manual mapping in `NPM_PACKAGE_MAP`
- New libraries won't be supported until added to map
- Some libraries have different names on npm vs. common usage

### 3. Version Format
- Supports semantic versioning (X.Y.Z) only
- Pre-release tags (beta, rc) may compare incorrectly
- Build metadata ignored

### 4. Scoped Packages
- Angular: `@angular/core` (scoped package)
- Some libraries use scopes which complicate mapping
- Currently handled case-by-case in map

### 5. Monorepos
- React has multiple packages (react, react-dom)
- Currently only checks primary package
- May show "outdated" if user has newer react-dom but older react

## Future Enhancements

### 1. Auto-Discovery
```javascript
// Detect package name from CDN URL patterns
// e.g., unpkg.com/jquery@3.6.0 → package: jquery
```

### 2. Multiple Registry Support
```javascript
// Fallback: cdnjs API, jsDelivr API
// For libraries not on npm
```

### 3. Security Advisories
```javascript
// Fetch npm audit data
// Show: "3 vulnerabilities in this version (2 moderate, 1 high)"
```

### 4. Update Commands
```javascript
// Remediation: "Run: npm install jquery@latest"
// Or: "Update <script> tag to: https://code.jquery.com/jquery-3.7.1.min.js"
```

### 5. Configurable TTL
```javascript
// Settings:
{
  "latestVersionCheck": {
    "enabled": true,
    "cacheTTL": 3600000  // 1 hour default
  }
}
```

## Security Considerations

### Data Privacy
- npm registry API calls reveal which libraries you're checking
- Package names sent to registry.npmjs.org
- No authentication required (public API)

### Trust in npm Data
- npm registry is authoritative for npm packages
- Version numbers are accurate
- Latest != best (sometimes beta/rc tagged as latest)

### Cache Poisoning
- Unlikely: npm registry is HTTPS
- Cache is local to user's browser
- No shared cache across users

## Debugging

### Check if Library is Supported
```javascript
// In service worker console
const NPM_PACKAGE_MAP = {/* see source */};
NPM_PACKAGE_MAP['jquery'];  // → 'jquery' (supported)
NPM_PACKAGE_MAP['foobar'];  // → undefined (not supported)
```

### Manually Fetch Latest Version
```javascript
// In service worker console
getLatestVersion('jQuery').then(console.log);
// → "3.7.1"
```

### Clear Version Cache
```javascript
chrome.storage.local.get(null, (items) => {
  Object.keys(items)
    .filter(k => k.startsWith('latest_'))
    .forEach(k => console.log(k, items[k]));
});
```

## User Experience

### Before
```
Finding: KEV Product Detected (Safe Version): jQuery
Remediation: Version appears safe, but verify you're using the latest stable release.
```
User reaction: "Ugh, I have to go check npm/GitHub myself?"

### After
```
Finding: KEV Product Detected (Safe Version): jQuery
Evidence:
  - detectedVersion: 3.6.0
  - latestVersion: 3.7.1
Remediation: Version 3.6.0 is safe but outdated. Latest stable version is 3.7.1. Consider updating.
```
User reaction: "Ah, I need to update to 3.7.1. Got it!"

## Metrics (Future)

Track:
- npm API cache hit rate
- Average latency for version checks
- Percentage of libraries with latest version available
- Most outdated libraries (version drift)

## Conclusion

This feature transforms the scanner from a **safety checker** to a **comprehensive maintenance advisor**:

✅ **Before**: "Your version is safe (but maybe outdated?)"
✅ **After**: "Your version is safe and up-to-date" OR "Update from 3.6.0 to 3.7.1"

Users get:
- **Specific version numbers** instead of generic advice
- **Actionable remediation** instead of "go check yourself"
- **Evidence** showing both current and latest versions
- **Zero manual work** - completely automated

This reduces toil, improves security posture, and provides better user experience.
