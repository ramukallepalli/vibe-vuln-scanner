# Vibe Vulnerability Scanner - Quick Start

**🎯 Scan your POCs for security vulnerabilities in 5 seconds**

---

## Installation (2 minutes)

### Step 1: Extract
Extract `vibe-vuln-scanner-v1.0.0.tar.gz` to a **permanent folder**
- ✅ `Documents/ChromeExtensions/`
- ❌ NOT `Downloads/` (might get deleted)

### Step 2: Load in Chrome
1. Open Chrome → Type: `chrome://extensions/`
2. Toggle ON: "Developer mode" (top-right)
3. Click: **"Load unpacked"**
4. Select the extracted `vibe-vuln-scanner` folder
5. ✅ Done!

---

## Usage (5 seconds)

1. Open your POC in Chrome
2. Click the extension icon 🛡️
3. View results
4. Fix CRITICAL & HIGH issues
5. Rescan to verify ✓

---

## Understanding Results

| Level | What to Do |
|-------|------------|
| 🔴 **CRITICAL** | Fix NOW before demo |
| 🟠 **HIGH** | Fix before demo |
| 🟡 **MEDIUM** | Fix before production |
| 🟢 **LOW** | Nice to have |

---

## Common Findings

**"jQuery 1.x has CVE-2020-11023"**
→ Update to jQuery 3.7+

**"Exposed API key"**
→ Move to backend/environment variables

**"Missing CSP"**
→ Add Content-Security-Policy meta tag

**"Inline onclick handlers"**
→ Use addEventListener instead

---

## Troubleshooting

**Extension not loading?**
→ Make sure you selected folder with `manifest.json`

**No icon in toolbar?**
→ Click puzzle piece 🧩 → Pin the extension

**Stopped working after restart?**
→ Don't move/delete the extension folder

---

## Need Help?

- Slack: #vibe-vuln-scanner
- Email: [your.email@ebay.com]
- Full guide: See `INSTALLATION_GUIDE.md`

---

**Pro Tip:** Scan before EVERY demo to catch security issues early!
