# Extension Icon Guide

## Required Icons

The Vibe Vulnerability Scanner needs the following icon sizes:

- **icon16.png** - 16x16 pixels - Toolbar icon
- **icon48.png** - 48x48 pixels - Extension management page
- **icon128.png** - 128x128 pixels - Chrome Web Store listing

## Design Guidelines

### Theme
- **Shield or security badge** motif
- **Colors**: Blue (#2196F3) and green (#4CAF50) for a professional security tool appearance
- **Simple and recognizable** at small sizes
- **Good contrast** for both light and dark modes

### Concept Ideas

1. **Shield with checkmark**
   - Blue shield outline
   - Green checkmark in center
   - Simple, clean lines

2. **Security badge**
   - Circular badge design
   - "V" monogram for "Vibe"
   - Blue background, white text

3. **Scan radar**
   - Circular radar sweep effect
   - Blue and green concentric circles
   - Modern tech aesthetic

## Creation Options

### Option 1: Design Tools
Use graphic design software:
- **Figma** (free, web-based)
- **Adobe Illustrator** (professional)
- **Inkscape** (free, open-source)
- **Canva** (quick templates)

### Option 2: Icon Generators
Online icon generators:
- https://favicon.io/
- https://realfavicongenerator.net/
- https://www.favicon-generator.org/

### Option 3: AI Image Generation
Use AI tools to generate icons:
- **DALL-E** or **Midjourney**
- Prompt example: "Simple flat icon of a blue shield with green checkmark, minimalist design, transparent background, 512x512"
- Then resize to required dimensions

### Option 4: Hire a Designer
- Fiverr or Upwork for professional icons (~$20-50)
- 99designs for icon contests

## Technical Specifications

- **Format**: PNG with transparent background
- **Color mode**: RGB
- **Bit depth**: 24-bit (or 32-bit with alpha channel)
- **Compression**: Optimize file size while maintaining quality

## Export Settings

When exporting from design tools:

```
icon16.png:  16x16px,  PNG-24, transparent
icon48.png:  48x48px,  PNG-24, transparent
icon128.png: 128x128px, PNG-24, transparent
```

## Testing

After creating icons:

1. Replace files in `/icons/` directory
2. Reload extension in Chrome
3. Check toolbar icon (16px) - should be crisp and recognizable
4. Check extension management page (48px)
5. Verify Chrome Web Store preview (128px)

## Recommended Workflow

1. Design at **512x512** for high quality
2. Export at required sizes (128, 48, 16)
3. Optimize with tools like [TinyPNG](https://tinypng.com/)
4. Test in Chrome

## Current Status

⚠️ **Icons are currently missing.** Follow this guide to create and add them before publishing to the Chrome Web Store.

Placeholder icons are acceptable for development, but professional icons are required for:
- Chrome Web Store submission
- Building credibility with users
- Marketing and promotion

## Quick Start with Favicon.io

1. Go to https://favicon.io/favicon-generator/
2. Settings:
   - Text: "V"
   - Background: #2196F3 (blue)
   - Font: Bold, large
3. Generate and download
4. Rename files to icon16.png, icon48.png, icon128.png
5. Place in `/icons/` directory

This provides a quick solution while a professional designer creates final icons.
