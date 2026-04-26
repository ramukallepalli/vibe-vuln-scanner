# Screenshots Guide

This directory will contain screenshots for the README and Chrome Web Store listing.

## Required Screenshots for README

### 1. `popup-overview.png`
**Main popup showing scan results**

Capture:
- Extension popup with scan results visible
- Show severity breakdown (CRITICAL, HIGH, MEDIUM, LOW)
- Include badge with vulnerability count
- Use test-page.html for realistic findings

Dimensions: ~600-800px wide

### 2. `vulnerability-details.png`
**Detailed finding with remediation**

Capture:
- Expanded finding showing full details
- Include evidence section
- Show remediation guidance
- Highlight confidence level

Dimensions: ~600-800px wide

### 3. `export-feature.png`
**Export dropdown (v1.2.0 feature)**

Capture:
- Export menu open
- Show JSON and CSV options
- Demonstrate new feature

Dimensions: ~400-600px wide

### 4. `scan-history.png`
**History panel (v1.2.0 feature)**

Capture:
- History tab/panel visible
- Show multiple historical scans
- Display timestamps and domain

Dimensions: ~600-800px wide

### 5. `demo.gif`
**Animated demo of extension in action**

Recording:
1. Navigate to test-page.html
2. Click extension icon
3. Show scan running
4. Display results appearing
5. Expand a finding for details
6. Show export menu

Dimensions: 800-1000px wide
Duration: 10-15 seconds
Frame rate: 10-15 fps
Format: GIF (optimized)

Tools: 
- **ScreenToGif** (Windows)
- **LICEcap** (Mac/Windows)
- **peek** (Linux)
- **Kap** (Mac)

## Required Screenshots for Chrome Web Store

Chrome Web Store requires 5 screenshots:

- Minimum: 640×400 or 1280×800
- Maximum: 2560×1600
- Accepted formats: PNG or JPEG
- No padding or borders

### Suggested Chrome Web Store Screenshots

1. **Hero shot** - Main popup with findings
2. **KEV detection** - Show CRITICAL finding from KEV catalog
3. **Export feature** - Demonstrate JSON/CSV export
4. **History panel** - Show scan history
5. **Settings/Info** - Any configuration or about screen

## How to Take Screenshots

### Method 1: Built-in Browser Tools

**Chrome DevTools Device Toolbar:**
1. Open DevTools (F12)
2. Click device toolbar icon
3. Set custom dimensions
4. Click "Capture screenshot" (⋮ menu)

### Method 2: Screen Capture Tools

**Mac**: Cmd+Shift+4 (select area)
**Windows**: Win+Shift+S (Snipping Tool)
**Linux**: gnome-screenshot or scrot

### Method 3: Extensions

- **Awesome Screenshot**
- **Nimbus Screenshot**
- **Lightshot**

## Editing Screenshots

Recommended tools:
- **GIMP** (free, open-source)
- **Photopea** (free, web-based)
- **Photoshop** (professional)

Editing tasks:
- Crop to consistent dimensions
- Add subtle drop shadow (optional)
- Optimize file size
- Ensure readable text at small sizes

## Naming Convention

Use descriptive names:
```
popup-overview.png
vulnerability-details.png
export-feature.png
scan-history.png
demo.gif
chrome-store-1-hero.png
chrome-store-2-kev-detection.png
chrome-store-3-export.png
chrome-store-4-history.png
chrome-store-5-settings.png
```

## Testing Screenshots

Before committing:
1. View at actual size in README
2. Check readability
3. Verify file sizes (<500KB per image)
4. Test on light/dark GitHub themes
5. Ensure they enhance understanding

## Optimization

Compress images:
- **TinyPNG**: https://tinypng.com/
- **ImageOptim** (Mac)
- **Squoosh**: https://squoosh.app/

Target: <300KB per PNG, <500KB for GIF

## Current Status

⚠️ **Screenshots are currently missing.** Follow this guide to capture and add them.

Priority:
1. **demo.gif** - Most impactful for README
2. **popup-overview.png** - Shows main functionality
3. **vulnerability-details.png** - Shows detail level
4. Chrome Web Store screenshots (for publishing)

## Tips for Great Screenshots

✅ Use realistic data (test-page.html has good examples)
✅ Ensure consistent styling across all shots
✅ Capture at high resolution, then scale down
✅ Show the extension in action, not just static UI
✅ Highlight new features (v1.2.0 additions)

❌ Avoid blurry or pixelated images
❌ Don't show developer tools unless relevant
❌ Avoid cluttered browser with many extensions
❌ Don't include sensitive information
