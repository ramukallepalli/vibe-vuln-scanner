# Vibe Vulnerability Scanner — Claude Code Context

## Project type
Chrome Extension (Manifest V3), no build step — plain JS files loaded directly.

## Key files
| File | Purpose |
|---|---|
| `src/content/scanner.js` | `VulnerabilityScanner` class, runs at `document_idle` |
| `src/background/service-worker.js` | Message router, OSV/GitHub Advisory/KEV fetching, LLM proxy, cookie/source-map helpers |
| `src/popup/popup.js` | Results UI, JSON/CSV/SARIF export, history panel |
| `src/options/options.js` | Settings page — all API keys optional |
| `manifest.json` | MV3 manifest, permissions: activeTab storage alarms tabs webRequest downloads cookies scripting |
| `.github/workflows/ci.yml` | Lint (ESLint) + test (Jest) + web-ext build |
| `jest.config.js` | testMatch anchored to `<rootDir>/__tests__/` — no coverage thresholds |
| `__tests__/setup.js` | Chrome API mocks for Jest |

## Architecture — message flow
```
scanner.js  →  chrome.runtime.sendMessage  →  service-worker.js  →  external APIs
popup.js    →  chrome.runtime.sendMessage  →  service-worker.js
```

## Message actions (service-worker switch cases)
`scanComplete`, `getResults`, `getKEVCatalog`, `requestScan`, `getCVEDetails`,
`getLatestVersion`, `getSecurityHeaders`, `getScanHistory`,
`getOSVVulnerabilities`, `getGitHubAdvisories`, `getSettings`, `saveSettings`,
`analyzeLLM`, `checkTyposquatting`, `analyzeSourceMap`, `getCookies`

## Scanner methods
`scanXSSPatterns`, `scanDangerousSinks`, `scanDependencies`, `scanKEVCorrelation`,
`scanSecretExposure`, `scanSecurityHeaders`, `scanCookieAttributes`,
`scanPrototypePollution`, `scanPostMessage`, `analyzeFindingWithLLM`, `runScans`

## External APIs (all optional/unauthenticated by default)
- OSV.dev — `POST https://api.osv.dev/v1/query` — no key, 30-min cache
- CISA KEV — `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`
- GitHub Advisory — `GET https://api.github.com/advisories` — optional token in settings
- Anthropic — `POST https://api.anthropic.com/v1/messages` — optional, LLM toggle must be on

## Settings (chrome.storage.sync)
`anthropicApiKey`, `githubToken`, `nvdApiKey`, `llmEnabled`, `minSeverity`,
`suppressedDomains[]`, `customPatterns[]`, `webhookUrl` — ALL optional

## ESLint rules to remember
- `var` in nested loops causes `no-redeclare` — use `let`/`const` for loop vars
- `/* global chrome */` is redundant (`webextensions: true` env already defines it)
- No useless escapes in regex: `\-` → `-`, `\/` → `/` inside character classes

## Test approach
Tests use `eval()` to load source files — Istanbul cannot instrument eval'd code,
so coverage is always 0%. Coverage thresholds are disabled. Keep it that way.

## Git remotes
- `personal` → github.com/ramukallepalli/vibe-vuln-scanner (needs repo+workflow scopes)
- `origin` → github.corp.ebay.com (eBay internal, PAT embedded in URL)

## Version
Currently `1.2.0` in manifest.json and package.json.
