# /update — Vibe Vulnerability Scanner update reference

Use this skill when making code changes. Follow the checklist at the end.

## Message actions (service-worker.js switch)
`scanComplete` `getResults` `getKEVCatalog` `requestScan` `getCVEDetails`
`getLatestVersion` `getSecurityHeaders` `getScanHistory`
`getOSVVulnerabilities` `getGitHubAdvisories` `getSettings` `saveSettings`
`analyzeLLM` `checkTyposquatting` `analyzeSourceMap` `getCookies`

Adding a new action: add a `case` in `handleMessage()`, add `return true` if async.

## Scanner methods (scanner.js)
`scanXSSPatterns` `scanDangerousSinks` `scanDependencies` `scanKEVCorrelation`
`scanSecretExposure` `scanSecurityHeaders` `scanCookieAttributes`
`scanPrototypePollution` `scanPostMessage` `analyzeFindingWithLLM` `runScans`

Adding a detector: create a method returning `findings[]`, call it in `runScans()`.

## Finding shape
```js
this.createFinding({
  type: 'SNAKE_CASE_TYPE',  // unique string
  severity: 'CRITICAL|HIGH|MEDIUM|LOW',
  confidence: 'high|medium|low',
  category: 'confirmed|heuristic|informational',
  title: 'Human readable title',
  description: '...',
  evidence: {},             // any serialisable object
  remediation: '...'
})
```

## External APIs
| API | Endpoint | Auth |
|---|---|---|
| OSV.dev | `POST https://api.osv.dev/v1/query` | none, 30-min cache |
| CISA KEV | static JSON from cisa.gov | none |
| GitHub Advisory | `GET https://api.github.com/advisories` | optional Bearer token |
| Anthropic | `POST https://api.anthropic.com/v1/messages` | key + `llmEnabled` toggle |

## Settings keys (chrome.storage.sync)
`anthropicApiKey` `githubToken` `nvdApiKey` `llmEnabled`
`minSeverity` `suppressedDomains[]` `customPatterns[]` `webhookUrl`

All optional. Read via `getSettings()` in service-worker; invalidate `settingsCache = null` after writes.

## Tests
- Files live in `__tests__/` — `setup.js` (mocks) + `scanner.test.js` + `service-worker.test.js`
- Source loaded via `eval()` → Istanbul cannot instrument it → coverage is always 0% → thresholds disabled. Do not re-enable.
- Add new tests by extending existing `describe` blocks; mock `chrome.runtime.sendMessage` to return fixture data.

## Change checklist
1. Edit target file(s)
2. `npm run lint` — fix all errors (warnings OK)
3. `npm test` — all suites must pass
4. `git add <files> && git commit -m "type(scope): description"`
5. `git push personal main`
