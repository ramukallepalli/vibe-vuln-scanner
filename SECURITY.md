# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| 1.1.x   | :white_check_mark: |
| < 1.1   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in Vibe Vulnerability Scanner, please report it responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **GitHub Security Advisories** (Preferred)
   - Navigate to: https://github.com/ramukallepalli/vibe-vuln-scanner/security/advisories/new
   - Click "Report a vulnerability"
   - Fill out the form with details

2. **Email**
   - Send details to: ramu.kallepalli@gmail.com
   - Use subject line: "[SECURITY] Vibe Vulnerability Scanner - [Brief Description]"

### What to Include

Please include the following information in your report:

- Type of vulnerability
- Affected component(s)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if available)
- Potential impact of the vulnerability
- Suggested fix (if you have one)

### Response Timeline

- **Initial Response**: Within 48 hours of report
- **Confirmation**: Within 5 business days
- **Fix Timeline**: Depends on severity
  - Critical: Within 7 days
  - High: Within 14 days
  - Medium: Within 30 days
  - Low: Next scheduled release

### Disclosure Policy

- We will work with you to understand and address the vulnerability
- We will keep you informed of our progress
- We will credit you in the security advisory (unless you prefer to remain anonymous)
- Please allow us reasonable time to fix the issue before public disclosure
- We follow coordinated disclosure practices

## Security Best Practices for Users

When using this extension:

1. **Keep Updated**: Always use the latest version
2. **Review Permissions**: Understand what permissions the extension requires
3. **Verify Source**: Only install from official sources (Chrome Web Store or this GitHub repository)
4. **Check Checksums**: Verify integrity of downloaded files when building from source

## Security Features

This extension implements several security measures:

- **No Remote Code Execution**: All scanning happens locally
- **Minimal Permissions**: Only requests necessary Chrome API permissions
- **No Data Collection**: Scan results stay on your device
- **Safe DOM Handling**: Popup UI uses safe DOM construction (no innerHTML)
- **Content Security Policy**: Strict CSP in manifest
- **HTTPS Only**: KEV catalog and NVD API calls use HTTPS

## Known Limitations

See README.md "Limitations" section for known detection limitations and false positive scenarios.

## Questions?

For non-security questions, please use [GitHub Discussions](https://github.com/ramukallepalli/vibe-vuln-scanner/discussions).
