# GitHub Repository Setup Guide

Complete these steps to maximize your project's visibility and attract contributors.

## Step 1: Add Repository Description & Topics

### Instructions:
1. Go to https://github.com/ramukallepalli/vibe-vuln-scanner
2. Click the ⚙️ gear icon next to "About" (top right)
3. Add the following:

**Description:**
```
Chrome extension that scans web apps for security vulnerabilities using CISA KEV catalog and NVD verification
```

**Website:**
```
https://github.com/ramukallepalli/vibe-vuln-scanner
```

**Topics** (click "Add topics", enter each):
```
chrome-extension
security
vulnerability-scanner
cisa-kev
xss
csp
security-headers
nvd
cve
manifest-v3
web-security
security-audit
penetration-testing
security-tools
chrome-security
vulnerability-detection
```

4. Check these boxes:
   - ✅ Releases
   - ✅ Packages
   - ❌ Deployments (not applicable)

5. Click "Save changes"

## Step 2: Enable GitHub Features

### Enable Discussions (for Q&A)
1. Go to https://github.com/ramukallepalli/vibe-vuln-scanner/settings
2. Scroll to "Features" section
3. Check ✅ "Discussions"
4. Click "Set up discussions"
5. Use the default welcome post or customize

### Enable Issues (should already be enabled)
1. In Settings → Features
2. Verify ✅ "Issues" is checked

### Set Up Issue Labels
GitHub will auto-create labels, but you can add custom ones:
1. Go to https://github.com/ramukallepalli/vibe-vuln-scanner/labels
2. Add these custom labels:
   - `good first issue` (green) - Already exists
   - `help wanted` (green)
   - `security` (red)
   - `testing` (blue)
   - `ui/ux` (purple)

## Step 3: Configure Branch Protection

1. Go to https://github.com/ramukallepalli/vibe-vuln-scanner/settings/branches
2. Click "Add rule"
3. Branch name pattern: `main`
4. Enable these protections:
   - ✅ Require a pull request before merging
   - ✅ Require approvals: 1
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - Select status checks: `Lint and Test`, `Build Extension`
   - ✅ Require conversation resolution before merging
5. Click "Create" or "Save changes"

## Step 4: Verify GitHub Actions

1. Go to https://github.com/ramukallepalli/vibe-vuln-scanner/actions
2. You should see the CI workflow
3. If there's a run from your push, check that it passes ✅
4. If it fails, click on it to see error details

Expected workflows:
- **CI** - Runs on every push and PR
  - Lint and Test (Node 18.x, 20.x)
  - Build Extension

## Step 5: Check Community Standards

1. Go to https://github.com/ramukallepalli/vibe-vuln-scanner/community
2. Verify all items are ✅ green:
   - ✅ Description
   - ✅ README
   - ✅ Code of conduct
   - ✅ Contributing
   - ✅ License
   - ✅ Security policy
   - ✅ Issue templates
   - ✅ Pull request template

If any are missing, check your repository.

## Step 6: Pin Repository (Optional but Recommended)

1. Go to your profile: https://github.com/ramukallepalli
2. Click "Customize your pins"
3. Select "vibe-vuln-scanner"
4. This showcases it on your profile!

## Step 7: Set Repository Image

1. Go to repository settings
2. Scroll to "Social preview"
3. Upload an image (1280x640 recommended)
4. Use your icon or create a banner with:
   - Project name
   - Tagline
   - Key features

Tools for creating banner:
- Canva (free templates)
- Figma
- Photopea (web-based Photoshop)

## Step 8: Add README Badges

These are already in your README, but you can add more:

**Build Status Badge** (after first CI run):
```markdown
[![CI](https://github.com/ramukallepalli/vibe-vuln-scanner/workflows/CI/badge.svg)](https://github.com/ramukallepalli/vibe-vuln-scanner/actions)
```

**Code Coverage Badge** (after setting up Codecov):
```markdown
[![codecov](https://codecov.io/gh/ramukallepalli/vibe-vuln-scanner/branch/main/graph/badge.svg)](https://codecov.io/gh/ramukallepalli/vibe-vuln-scanner)
```

## Step 9: Set Up Codecov (Optional)

For test coverage tracking:
1. Go to https://codecov.io/
2. Sign in with GitHub
3. Add repository: vibe-vuln-scanner
4. Copy the token
5. Add as repository secret:
   - Go to Settings → Secrets and variables → Actions
   - Add secret: `CODECOV_TOKEN`
   - Paste the token

The CI workflow is already configured to upload coverage!

## Verification Checklist

After completing the above:

- [ ] Repository has description and topics
- [ ] Discussions enabled
- [ ] Branch protection rules set
- [ ] GitHub Actions passing ✅
- [ ] Community standards 100% complete
- [ ] Repository pinned on profile
- [ ] Social preview image added
- [ ] Issue labels configured

## Next: Create Issues for Contributors

See `GOOD_FIRST_ISSUES.md` for pre-written issues you can create to attract contributors!

---

**Questions?** Open a discussion on your repository or refer to GitHub's documentation.
