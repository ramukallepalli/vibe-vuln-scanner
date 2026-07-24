/**
 * Tests for VulnerabilityScanner class — real assertions against actual scanner code.
 */

const fs = require('fs');
const path = require('path');

let VulnerabilityScanner;

beforeAll(() => {
  let code = fs.readFileSync(path.join(__dirname, '../src/content/scanner.js'), 'utf8');
  // Strip auto-run and listener code at bottom so eval does not trigger side effects
  code = code.replace(/\/\/ Auto-run[\s\S]*$/, '');
  // Use new Function to load the class into a returnable scope
  VulnerabilityScanner = new Function(code + '\nreturn VulnerabilityScanner;')();
});

describe('VulnerabilityScanner', () => {
  let scanner;

  beforeEach(() => {
    scanner = new VulnerabilityScanner();
    // Reset DOM state before every test
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  // ── compareVersions ──────────────────────────────────────────────────────

  describe('compareVersions', () => {
    test('1.2.3 < 1.2.4 returns -1', () => {
      expect(scanner.compareVersions('1.2.3', '1.2.4')).toBe(-1);
    });

    test('2.0.0 > 1.9.9 returns 1', () => {
      expect(scanner.compareVersions('2.0.0', '1.9.9')).toBe(1);
    });

    test('1.5.0 == 1.5.0 returns 0', () => {
      expect(scanner.compareVersions('1.5.0', '1.5.0')).toBe(0);
    });

    test('pre-release is less than release: 1.0.0-alpha < 1.0.0', () => {
      expect(scanner.compareVersions('1.0.0-alpha', '1.0.0')).toBe(-1);
    });

    test('alpha < beta in pre-release: 1.0.0-alpha < 1.0.0-beta', () => {
      expect(scanner.compareVersions('1.0.0-alpha', '1.0.0-beta')).toBe(-1);
    });

    test('numeric pre-release < alphanumeric: 1.0.0-1 < 1.0.0-alpha', () => {
      expect(scanner.compareVersions('1.0.0-1', '1.0.0-alpha')).toBe(-1);
    });
  });

  // ── parseSemVer ───────────────────────────────────────────────────────────

  describe('parseSemVer', () => {
    test('parses simple version into components', () => {
      const result = scanner.parseSemVer('1.2.3');
      expect(result.major).toBe(1);
      expect(result.minor).toBe(2);
      expect(result.patch).toBe(3);
      expect(result.prerelease).toBeNull();
    });

    test('parses pre-release identifier correctly', () => {
      const result = scanner.parseSemVer('1.0.0-alpha.1');
      expect(result.prerelease).toBe('alpha.1');
    });
  });

  // ── isVersionVulnerable ───────────────────────────────────────────────────

  describe('isVersionVulnerable', () => {
    test('versionEndExcluding: version below fix is vulnerable', () => {
      expect(
        scanner.isVersionVulnerable('4.17.20', { versionEndExcluding: '4.17.21' })
      ).toBe(true);
    });

    test('versionEndExcluding: exact fix version is NOT vulnerable', () => {
      expect(
        scanner.isVersionVulnerable('4.17.21', { versionEndExcluding: '4.17.21' })
      ).toBe(false);
    });

    test('versionStartIncluding + versionEndIncluding: in-range version is vulnerable', () => {
      expect(
        scanner.isVersionVulnerable('2.5.0', {
          versionStartIncluding: '2.0.0',
          versionEndIncluding: '2.9.9'
        })
      ).toBe(true);
    });

    test('versionStartIncluding + versionEndIncluding: version below range is NOT vulnerable', () => {
      expect(
        scanner.isVersionVulnerable('1.9.9', {
          versionStartIncluding: '2.0.0',
          versionEndIncluding: '2.9.9'
        })
      ).toBe(false);
    });

    test('no constraints: any version is vulnerable', () => {
      expect(scanner.isVersionVulnerable('1.0.0', {})).toBe(true);
    });
  });

  // ── generateFindingId deduplication ──────────────────────────────────────

  describe('generateFindingId', () => {
    test('same type + description + evidence produce the same id', () => {
      const id1 = scanner.generateFindingId('XSS', 'desc', { url: 'http://example.com' });
      const id2 = scanner.generateFindingId('XSS', 'desc', { url: 'http://example.com' });
      expect(id1).toBe(id2);
    });

    test('different type produces a different id', () => {
      const id1 = scanner.generateFindingId('XSS', 'desc', {});
      const id2 = scanner.generateFindingId('CSRF', 'desc', {});
      expect(id1).not.toBe(id2);
    });
  });

  // ── deduplicateFindings ───────────────────────────────────────────────────

  describe('deduplicateFindings', () => {
    test('two findings with the same id are collapsed to one', () => {
      const finding = scanner.createFinding({
        type: 'INLINE_EVENT_HANDLER',
        severity: 'MEDIUM',
        description: 'Found 1 elements with inline event handlers.',
        evidence: { count: 1 }
      });
      // Push the same finding object twice (same id)
      scanner.findings = [finding, Object.assign({}, finding)];
      const deduped = scanner.deduplicateFindings();
      expect(deduped.length).toBe(1);
    });
  });

  // ── scanDependencies ──────────────────────────────────────────────────────

  describe('scanDependencies', () => {
    test('HTTP script produces INSECURE_DEPENDENCY finding', () => {
      const script = document.createElement('script');
      script.src = 'http://evil.com/lib.js';
      document.head.appendChild(script);

      const findings = scanner.scanDependencies();
      expect(findings.some(f => f.type === 'INSECURE_DEPENDENCY')).toBe(true);
    });

    test('cdn.jsdelivr.net script without integrity produces MISSING_SRI', () => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/jquery.min.js';
      document.head.appendChild(script);

      const findings = scanner.scanDependencies();
      expect(findings.some(f => f.type === 'MISSING_SRI')).toBe(true);
    });

    test('unpkg.com script without integrity produces MISSING_SRI', () => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/react/umd/react.js';
      document.head.appendChild(script);

      const findings = scanner.scanDependencies();
      expect(findings.some(f => f.type === 'MISSING_SRI')).toBe(true);
    });

    test('non-CDN HTTPS script without integrity does NOT produce MISSING_SRI', () => {
      const script = document.createElement('script');
      script.src = 'https://example.com/local.js';
      document.head.appendChild(script);

      const findings = scanner.scanDependencies();
      expect(findings.some(f => f.type === 'MISSING_SRI')).toBe(false);
    });

    test('CDN script WITH integrity attribute does NOT produce MISSING_SRI', () => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/jquery.min.js';
      script.integrity = 'sha384-abc123xyz';
      document.head.appendChild(script);

      const findings = scanner.scanDependencies();
      expect(findings.some(f => f.type === 'MISSING_SRI')).toBe(false);
    });
  });

  // ── scanXSSPatterns ───────────────────────────────────────────────────────

  describe('scanXSSPatterns', () => {
    test('element with onclick attribute produces INLINE_EVENT_HANDLER finding', () => {
      document.body.innerHTML = '<button onclick="alert(1)">Click me</button>';

      const findings = scanner.scanXSSPatterns();
      expect(findings.some(f => f.type === 'INLINE_EVENT_HANDLER')).toBe(true);
    });
  });

  // ── scanTextForSecrets ────────────────────────────────────────────────────

  describe('scanTextForSecrets', () => {
    // Patterns mirroring those used in scanSecretExposure
    const openaiPattern = {
      regex: /sk-[a-zA-Z0-9]{32,}/g,
      name: 'OpenAI API Key',
      minLength: 35
    };
    const githubPATPattern = {
      regex: /ghp_[a-zA-Z0-9]{36,}/g,
      name: 'GitHub Personal Access Token',
      minLength: 40
    };
    const genericKeyPattern = {
      regex: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?([a-zA-Z0-9_-]{32,})["']?/gi,
      name: 'Generic API Key',
      minLength: 32
    };

    test('detects a valid OpenAI API key', () => {
      const results = [];
      // 34 alphanumeric chars after 'sk-' satisfies the pattern (>= 32) and minLength (>= 35)
      scanner.scanTextForSecrets(
        'sk-abcdefghijklmnopqrstuvwxyz12345678',
        [openaiPattern],
        'test location',
        results
      );
      expect(results.length).toBe(1);
      expect(results[0].pattern).toBe('OpenAI API Key');
    });

    test('filters out false positive containing "example"', () => {
      const results = [];
      // Matches the regex (36 chars >= 32) but filtered because it contains 'example'
      scanner.scanTextForSecrets(
        'sk-examplekeyabcdefghijklmnopqrstuvwxyz',
        [openaiPattern],
        'test location',
        results
      );
      expect(results.length).toBe(0);
    });

    test('detects a valid GitHub Personal Access Token', () => {
      const results = [];
      // 38 chars after 'ghp_' satisfies the pattern (>= 36) and minLength (>= 40 total)
      scanner.scanTextForSecrets(
        'ghp_abcdefghijklmnopqrstuvwxyz123456789abc',
        [githubPATPattern],
        'test location',
        results
      );
      expect(results.length).toBe(1);
      expect(results[0].pattern).toBe('GitHub Personal Access Token');
    });

    test('filters out false positive with YOUR_ in generic key pattern', () => {
      const results = [];
      // Generic API key pattern allows underscores; YOUR_ is a common placeholder marker
      scanner.scanTextForSecrets(
        'api_key=YOUR_KEY_HERE_abcdefghijklmnopqrstuvwxyz',
        [genericKeyPattern],
        'test location',
        results
      );
      expect(results.length).toBe(0);
    });
  });
});
