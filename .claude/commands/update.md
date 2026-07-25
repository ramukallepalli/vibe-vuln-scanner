# /update — Vibe Vulnerability Scanner update reference

## Message actions (service-worker.js `handleMessage()` switch)
`scanComplete` `getResults` `getKEVCatalog` `requestScan` `getCVEDetails`
`getLatestVersion` `getSecurityHeaders` `getScanHistory`
`getOSVVulnerabilities` `getGitHubAdvisories` `getSettings` `saveSettings`
`analyzeLLM` `checkTyposquatting` `analyzeSourceMap` `getCookies`

## Scanner methods (VulnerabilityScanner in scanner.js)
`scanXSSPatterns` `scanDangerousSinks` `scanDependencies` `scanKEVCorrelation`
`scanSecretExposure` `scanSecurityHeaders` `scanCookieAttributes`
`scanPrototypePollution` `scanPostMessage` `analyzeFindingWithLLM` `runScans`
New detector: method returns `findings[]`, call it in `runScans()`. Shape: see `createFinding()`.

## External APIs (all in service-worker.js)
- OSV.dev: `POST https://api.osv.dev/v1/query` — no auth, 30-min cache
- CISA KEV: static JSON from cisa.gov — no auth
- GitHub Advisory: `GET https://api.github.com/advisories` — optional Bearer
- Anthropic: `POST https://api.anthropic.com/v1/messages` — requires key + `llmEnabled` toggle

## Settings (`chrome.storage.sync`)
`anthropicApiKey` `githubToken` `nvdApiKey` `llmEnabled`
`minSeverity` `suppressedDomains[]` `customPatterns[]` `webhookUrl`
All optional. Read via `getSettings()` (60s cache); set `settingsCache = null` to invalidate.

## Tests
Files: `__tests__/setup.js` (mocks), `scanner.test.js`, `service-worker.test.js`
Source loaded via `eval()` → coverage always 0% → thresholds removed. Do not re-enable.

## Change checklist
1. Edit target file(s)
2. `npm run lint` — fix all errors (warnings OK)
3. `npm test` — all suites must pass
4. `git add <files> && git commit -m "type(scope): description"`
5. `git push personal main`
