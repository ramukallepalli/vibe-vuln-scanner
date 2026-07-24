# Vibe Vulnerability Scanner

Chrome Extension MV3, no build step — plain JS loaded directly.

## Files
- `src/content/scanner.js` — `VulnerabilityScanner` class (content script)
- `src/background/service-worker.js` — message router, all external API calls
- `src/popup/popup.js` — results UI, JSON/CSV/SARIF export
- `src/options/options.js` — settings UI, all API keys optional
- `__tests__/setup.js` — Chrome API mocks for Jest

## ESLint traps
- Nested `var` loops → `no-redeclare`; use `let`/`const` for loop variables
- `/* global chrome */` is redundant — `webextensions: true` already defines it
- Regex character classes: `\-` → `-`, `\/` → `/` (no useless escapes)

## Remotes
- `personal` → github.com/ramukallepalli/vibe-vuln-scanner (PAT needs `repo`+`workflow`)
- `origin` → github.corp.ebay.com (eBay internal)

## Skill
Run `/update` for full reference: message actions, scanner methods, APIs, settings keys, test approach.
