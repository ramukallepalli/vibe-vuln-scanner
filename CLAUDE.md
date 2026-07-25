# Vibe Vulnerability Scanner
Chrome Extension MV3, plain JS, no build step.

## Files
- `src/content/scanner.js` — `VulnerabilityScanner` class
- `src/background/service-worker.js` — message router + all API calls
- `src/popup/popup.js` — results UI, JSON/CSV/SARIF export
- `src/options/options.js` — settings UI (all keys optional)

## ESLint traps (not in code — bite every session)
- Nested `var` loops → `no-redeclare`; use `let`/`const`
- `/* global chrome */` redundant — `webextensions:true` covers it
- Regex char classes: `\-`→`-`, `\/`→`/`

## Remotes
- `personal` → github.com/ramukallepalli/vibe-vuln-scanner (`repo`+`workflow` PAT)
- `origin` → github.corp.ebay.com

Run `/update` before making changes.
