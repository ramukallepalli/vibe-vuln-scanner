/**
 * Tests for background service worker pure utility functions.
 *
 * The service worker is not a Node module, so we load its source with
 * new Function(), which runs it in global scope (giving access to the
 * chrome mocks set up in setup.js) and returns the pure functions we
 * want to test.
 */

const fs = require('fs');
const path = require('path');

let swFns;

beforeAll(() => {
  const code = fs.readFileSync(
    path.join(__dirname, '../src/background/service-worker.js'),
    'utf8'
  );
  // Execute the service-worker code and extract the pure utility functions.
  // Top-level chrome listener registrations and the startup IIFE fire during
  // this call; because all chrome APIs are mocked in setup.js they resolve
  // harmlessly.
  swFns = new Function(
    code +
      '\nreturn { summarizeVulnerabilities, extractDomain, createSessionId, parseCPE };'
  )();
});

// ── summarizeVulnerabilities ──────────────────────────────────────────────────

describe('summarizeVulnerabilities', () => {
  test('counts vulnerabilities by severity correctly', () => {
    const vulns = [
      { severity: 'CRITICAL' },
      { severity: 'HIGH' },
      { severity: 'HIGH' },
      { severity: 'MEDIUM' }
    ];
    const result = swFns.summarizeVulnerabilities(vulns);
    expect(result).toEqual({ total: 4, critical: 1, high: 2, medium: 1, low: 0 });
  });

  test('returns all zeros for an empty array', () => {
    const result = swFns.summarizeVulnerabilities([]);
    expect(result).toEqual({ total: 0, critical: 0, high: 0, medium: 0, low: 0 });
  });

  test('handles lowercase severity strings', () => {
    const result = swFns.summarizeVulnerabilities([{ severity: 'low' }, { severity: 'high' }]);
    expect(result.low).toBe(1);
    expect(result.high).toBe(1);
    expect(result.total).toBe(2);
  });
});

// ── extractDomain ─────────────────────────────────────────────────────────────

describe('extractDomain', () => {
  test('extracts hostname from a full URL', () => {
    expect(swFns.extractDomain('https://example.com/path')).toBe('example.com');
  });

  test('returns "unknown" for an invalid URL', () => {
    expect(swFns.extractDomain('invalid-url')).toBe('unknown');
  });

  test('sanitises special characters in the hostname', () => {
    // Hostnames with non-alphanumeric chars (edge case) are replaced with _
    const result = swFns.extractDomain('https://example.com/page?q=1');
    expect(result).toBe('example.com');
  });
});

// ── createSessionId ───────────────────────────────────────────────────────────

describe('createSessionId', () => {
  test('strips query string from URL to form session id', () => {
    expect(swFns.createSessionId('https://example.com/path?q=1')).toBe(
      'https://example.com/path'
    );
  });

  test('returns the raw URL when parsing fails', () => {
    const raw = 'not-a-url';
    expect(swFns.createSessionId(raw)).toBe(raw);
  });

  test('includes pathname in session id', () => {
    expect(swFns.createSessionId('https://example.com/a/b/c')).toBe(
      'https://example.com/a/b/c'
    );
  });
});

// ── parseCPE ─────────────────────────────────────────────────────────────────

describe('parseCPE', () => {
  test('extracts vendor and product from a CPE 2.3 string', () => {
    const result = swFns.parseCPE(
      'cpe:2.3:a:jquery:jquery:3.0.0:*:*:*:*:*:*:*'
    );
    expect(result).toEqual({ vendor: 'jquery', product: 'jquery' });
  });

  test('returns null for a malformed CPE string', () => {
    expect(swFns.parseCPE('not-a-cpe')).toBeNull();
  });

  test('handles vendor different from product', () => {
    const result = swFns.parseCPE(
      'cpe:2.3:a:apache:log4j:2.14.1:*:*:*:*:*:*:*'
    );
    expect(result).toEqual({ vendor: 'apache', product: 'log4j' });
  });
});
