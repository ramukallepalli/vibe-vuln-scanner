# Changelog

All notable changes to the Vibe Vulnerability Scanner will be documented in this file.

## [1.2.0] - 2026-04-02

### Added
- **Persistent Scan History**: Scan results now persist across browser restarts
  - Stores up to 50 scans per domain in `chrome.storage.local`
  - Auto-cleanup after 30 days
  - View and browse historical scans from popup
- **Export Functionality**: Download scan reports in multiple formats
  - Export as JSON with full metadata and vulnerability details
  - Export as CSV for spreadsheet analysis
  - User-prompted save location via Chrome downloads API
- **Global Library Detection**: Enhanced library detection via window globals
  - Detects bundled libraries (webpack, rollup) without version in filename
  - Checks `window.jQuery`, `window.React`, `window.Vue`, `window.angular`, etc.
  - Merges with URL parsing for comprehensive coverage
- **HTTP Header Inspection**: Captures actual HTTP security headers
  - Uses Chrome webRequest API for main_frame requests
  - Captures CSP, HSTS, X-Content-Type-Options, X-Frame-Options, etc.
  - Prioritizes HTTP headers over meta tags (authoritative source)
  - Detects missing security headers
- **Deep DOM Analysis**: Enhanced vulnerability scanning
  - XSS: Detects dangerous sinks (`eval()`, `document.write()`, `Function()`, `setTimeout/Interval` with strings)
  - Secrets: Scans DOM attributes, hidden inputs, HTML comments, localStorage/sessionStorage
  - Expanded secret patterns (GitHub tokens, Stripe keys, Slack tokens, JWT)
- **API Resilience**: Exponential backoff and rate limit handling
  - HTTP 429 rate limit detection with Retry-After header support
  - Network error retry logic with exponential backoff (1s, 2s, 4s, 8s, 16s)
  - Graceful degradation with cached data fallback

### Changed
- **SemVer Handling**: Full semantic versioning spec compliance
  - Properly parses pre-release tags (alpha, beta, rc)
  - Handles build metadata
  - Correct version precedence per semver.org spec
- **Security Header Scanning**: Renamed `scanCSP()` to `scanSecurityHeaders()` (now async)
- **Library Detection**: Combined global variable and URL parsing methods
- **Secret Scanning**: Complete rewrite with helper methods for different scan locations

### Improved
- Better caching strategy (KEV: 24h, CVE: permanent, npm: 1h, headers: per-tab)
- More accurate vulnerability detection (fewer false positives/negatives)
- Enhanced error handling across all API calls
- Performance optimizations with intelligent caching
- Memory leak prevention with proper cleanup on tab close

### Technical
- Chrome Manifest V3 compliance maintained
- No XSS vulnerabilities in popup rendering
- Safe DOM manipulation throughout
- All code passes ESLint without errors
- ~800 lines of code added
- Permissions added: `webRequest`, `downloads`, `host_permissions: ["<all_urls>"]`

### Documentation
- Added `REFACTORING_SUMMARY.md` with comprehensive implementation details
- Updated `DISTRIBUTION_README.md` with v1.2.0 features
- Updated `CHANGELOG.md` with structured format

## [1.1.0] - 2026-04-02

### Security Fixes
- **Eliminated popup XSS risk**: Replaced all `innerHTML` usage with safe DOM construction using `createElement` and `textContent`
- **Minimized permissions**: Removed unnecessary `host_permissions: ["<all_urls>"]` and `scripting` permission. Extension now uses content scripts only.

### Architecture Improvements
- **Fixed MV3 compliance**: Replaced `setInterval()` with `chrome.alarms` API for KEV catalog refresh
- **Fixed stale results**: Results now keyed by `tabId + URL session` instead of `tabId` only
- **Added tab cleanup**: Scan results automatically cleared when tabs are closed or navigated away
- **Improved message handling**: Single unified message router in service worker with proper async/await patterns
- **Better error handling**: Added `chrome.runtime.lastError` checks throughout

### Vulnerability Detection Accuracy
- **Automatic NVD version verification**: KEV correlation now automatically fetches CVE details from NIST NVD API to verify if detected library versions fall within vulnerable ranges. No manual verification needed.
  - `CRITICAL` findings: Version confirmed vulnerable based on NVD data
  - `LOW` informational findings: Product matches KEV but version appears safe
  - `MEDIUM` informational findings: Product matches KEV but NVD data unavailable
- **Automatic latest version checking**: Safe versions are automatically compared against npm registry to determine if they're outdated
  - "Version X.Y.Z is safe and up-to-date (latest stable release)"
  - "Version X.Y.Z is safe but outdated. Latest stable version is A.B.C. Consider updating."
  - No more generic "verify you're using the latest" messages
- **Conservative KEV correlation**: Product name matches without version verification result in `MEDIUM` severity "informational" findings with low confidence
- **Added confidence levels**: All findings now include a `confidence` field (`high`, `medium`, `low`)
- **Added finding categories**: Findings classified as `confirmed`, `probable`, `heuristic`, or `informational`
- **Downgraded heuristic signals**:
  - Inline event handlers: `HIGH` → `MEDIUM` (heuristic)
  - innerHTML usage: `MEDIUM` → `LOW` (informational)
  - Missing SRI: `MEDIUM` → `LOW` (informational)
  - CSP missing: `MEDIUM` → `LOW` (informational)
- **Improved secret detection**: More specific patterns with false-positive filtering. Findings marked as "potential" with `medium` confidence.
- **Removed "vibe app" detection**: Was too noisy and unreliable

### Data Model
- **Normalized findings**: All findings now have structured fields:
  - `id`: Fingerprint for deduplication
  - `type`: Finding type
  - `severity`: CRITICAL, HIGH, MEDIUM, LOW
  - `confidence`: high, medium, low
  - `category`: confirmed, probable, heuristic, informational
  - `title`: Human-readable title
  - `description`: Detailed explanation
  - `evidence`: Structured data
  - `remediation`: Fix guidance
  - `metadata`: Additional context
- **Deduplication**: Findings with identical IDs are automatically deduplicated

### UI Improvements
- **Confidence badges**: Low/medium confidence findings now display a confidence indicator
- **Remediation guidance**: Findings include actionable remediation steps where applicable
- **Better error messaging**: Clearer error states when scans fail

### Breaking Changes
- Removed "vibe app" classification (was unreliable)
- Severity levels recalibrated (many findings downgraded to reflect actual risk)
- Finding structure changed (added new fields, may affect consumers)

### Fixes
- Fixed race condition in popup where results could be stale
- Fixed memory leak from never-cleared scan results
- Fixed broken `build.js` reference in package.json
- Fixed multiple message listeners creating handler conflicts

### Developer Experience
- Simplified npm scripts (removed broken `build` and `dev` commands)
- Added structured finding creation with `createFinding()` helper
- Improved code comments explaining non-obvious decisions

## [1.0.0] - Initial release
- Basic vulnerability scanning
- CISA KEV integration
- Popup UI with badge notifications
