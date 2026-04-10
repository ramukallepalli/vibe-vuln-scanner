# Setup Guide

Quick guide to get the Vibe Vulnerability Scanner up and running.

## Prerequisites

- Node.js (v14 or higher)
- Chrome or Chromium-based browser
- Internet connection (for fetching CISA KEV catalog)

## Installation Steps

### 1. Install Dependencies

```bash
cd ~/vibe-vuln-scanner
npm install
```

### 2. Load Extension in Chrome

1. Open Chrome and navigate to: `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `vibe-vuln-scanner` directory
5. The extension should now appear in your extensions list

### 3. Verify Installation

1. Click the extension icon in your browser toolbar
2. You should see the Vibe Vulnerability Scanner popup
3. Check the browser console for the background service worker:
   - Go to `chrome://extensions/`
   - Find "Vibe Vulnerability Scanner"
   - Click "Inspect views: service worker"
   - Console should show: "CISA KEV catalog loaded: X vulnerabilities"

### 4. Test the Extension

Open the included test page:

```bash
# Navigate to the test page
file:///home/rakallepalli/vibe-vuln-scanner/test-page.html
```

Or open `test-page.html` directly in Chrome, then click the extension icon to see detected vulnerabilities.

## Development Workflow

### Running Linter

```bash
npm run lint
```

### Testing Changes

After making changes to the code:
1. Go to `chrome://extensions/`
2. Find "Vibe Vulnerability Scanner"
3. Click the refresh icon 🔄
4. Reload the webpage you're testing
5. Click the extension icon to see updated results

### Debugging

**Content Script:**
- Open DevTools on any webpage (F12)
- Check the Console tab for scanner logs

**Background Service Worker:**
- Go to `chrome://extensions/`
- Click "Inspect views: service worker"
- Console shows KEV catalog status and messages

**Popup:**
- Right-click the extension icon
- Select "Inspect popup"
- Opens DevTools for the popup UI

## Icon Setup (Optional)

The extension currently uses Chrome's default icon. To add custom icons:

1. Create or download icons in PNG format:
   - `icons/icon16.png` (16x16)
   - `icons/icon48.png` (48x48)
   - `icons/icon128.png` (128x128)

2. Reload the extension

## CISA KEV Catalog

The extension automatically fetches the CISA Known Exploited Vulnerabilities catalog:

- **First fetch**: On extension installation
- **Auto-refresh**: Every 6 hours while browser is open
- **Cache**: Stored in `chrome.storage.local` for offline access
- **Manual refresh**: Reload the extension to force a fresh fetch

### Verifying KEV Catalog

Open the service worker console and check for:
```
CISA KEV catalog loaded: 1000+ vulnerabilities
```

If you see this message, the KEV integration is working correctly.

## Common Issues

### Extension Not Loading

- Make sure you selected the correct directory (`vibe-vuln-scanner`)
- Check for syntax errors in the browser console
- Verify `manifest.json` is valid JSON

### No Vulnerabilities Detected

- Make sure the webpage has loaded completely
- Try clicking "Rescan Page" button in the popup
- Check if the page blocks content scripts (some sites do this)

### KEV Catalog Not Loading

- Check internet connection
- Open service worker console for error messages
- CISA endpoint may be temporarily unavailable (extension uses cached data)

## Next Steps

- Read [README.md](README.md) for feature documentation
- Read [CLAUDE.md](CLAUDE.md) for architecture and development guide
- Modify `src/content/scanner.js` to add new vulnerability checks
- Customize the UI in `src/popup/`

## Packaging for Distribution

When ready to publish:

```bash
npm run package
```

This creates a `.zip` file in the `dist/` directory that can be uploaded to the Chrome Web Store.
