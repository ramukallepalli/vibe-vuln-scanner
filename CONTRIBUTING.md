# Contributing to Vibe Vulnerability Scanner

Thank you for your interest in contributing to the Vibe Vulnerability Scanner! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your feature or bugfix
4. Make your changes
5. Test your changes thoroughly
6. Submit a pull request

## Development Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/vibe-vuln-scanner.git
cd vibe-vuln-scanner

# Install development dependencies
npm install

# Run linter
npm run lint

# Run tests
npm test

# Build package
npm run package
```

## Code Guidelines

### Adding New Vulnerability Checks

When adding a new vulnerability detection method:

1. Use conservative severity assignments
2. Add explicit confidence levels (high, medium, low)
3. Specify the category (confirmed, heuristic, informational)
4. Provide clear remediation guidance
5. Use the `createFinding()` method for structured data
6. Add tests for your detection logic

Example:

```javascript
scanNewPattern() {
  const findings = [];

  findings.push(this.createFinding({
    type: 'NEW_PATTERN',
    severity: 'MEDIUM',
    confidence: 'medium',
    category: 'heuristic',
    title: 'Pattern Detected',
    description: 'Clear explanation of what was found',
    evidence: { key: 'value' },
    remediation: 'Specific steps to fix the issue'
  }));

  return findings;
}
```

### Code Style

- Use ES6+ JavaScript features
- Follow existing code formatting
- Run `npm run lint` before submitting
- Use meaningful variable and function names
- Add comments for complex logic

### Commit Messages

- Use clear, descriptive commit messages
- Start with a verb in present tense (e.g., "Add", "Fix", "Update")
- Reference issue numbers when applicable
- Example: "Add detection for weak TLS configuration (#123)"

## Testing

Before submitting a pull request:

1. Test the extension manually in Chrome
2. Run the linter: `npm run lint`
3. Run automated tests: `npm test`
4. Test with the included `test-page.html`
5. Verify no console errors in the extension popup or background page

### Manual Testing Checklist

- [ ] Extension loads without errors
- [ ] Popup displays correctly
- [ ] Scans complete successfully
- [ ] Results display properly
- [ ] Export functionality works (JSON and CSV)
- [ ] History feature works
- [ ] Badge updates correctly
- [ ] No memory leaks (check after multiple scans)

## Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following the code guidelines
3. **Update documentation** if you're changing functionality
4. **Test thoroughly** using the checklist above
5. **Submit the PR** with a clear description of:
   - What the change does
   - Why it's needed
   - How you tested it
   - Any breaking changes

### PR Review Process

- Maintainers will review your PR
- Address any feedback or requested changes
- Once approved, your PR will be merged

## Reporting Issues

When reporting bugs or security issues:

1. **Check existing issues** first to avoid duplicates
2. **Use issue templates** if available
3. **Provide details**:
   - Extension version
   - Chrome version
   - Steps to reproduce
   - Expected vs. actual behavior
   - Console errors (if any)
   - Screenshots (if helpful)

### Security Issues

**Do not** open public issues for security vulnerabilities. Instead:
- Email security concerns to: ramu.kallepalli@gmail.com
- Include "SECURITY" in the subject line
- Provide detailed reproduction steps
- Allow time for a fix before public disclosure

## Documentation

- Update README.md for user-facing changes
- Update CLAUDE.md for developer-facing changes
- Add JSDoc comments for new functions
- Update CHANGELOG.md following semantic versioning

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or inflammatory comments
- Personal or political attacks
- Publishing others' private information
- Other conduct inappropriate in a professional setting

## Questions?

If you have questions about contributing:
- Open a discussion on GitHub
- Email: ramu.kallepalli@gmail.com

## License

By contributing to Vibe Vulnerability Scanner, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to making the web more secure!
