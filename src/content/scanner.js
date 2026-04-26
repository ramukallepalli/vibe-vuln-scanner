/**
 * Content script - vulnerability scanner
 * Detects security issues and correlates with CISA KEV
 */

class VulnerabilityScanner {
  constructor() {
    this.findings = [];
    this.scanSessionId = `scan-${Date.now()}-${Math.random()}`;
  }

  /**
   * Create normalized finding with fingerprint for deduplication
   */
  createFinding({ type, severity, confidence, category, title, description, evidence, remediation, metadata }) {
    const id = this.generateFindingId(type, description, evidence);

    return {
      id,
      type,
      severity,
      confidence: confidence || 'high',
      category: category || 'heuristic',
      title: title || this.formatType(type),
      description,
      evidence: evidence || {},
      remediation: remediation || null,
      metadata: metadata || {},
      timestamp: Date.now()
    };
  }

  generateFindingId(type, description, evidence) {
    const parts = [type, description, JSON.stringify(evidence || {})];
    const str = parts.join('|');
    // Simple hash
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `finding-${Math.abs(hash)}`;
  }

  formatType(type) {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  deduplicateFindings() {
    const seen = new Set();
    return this.findings.filter(f => {
      if (seen.has(f.id)) return false;
      seen.add(f.id);
      return true;
    });
  }

  /**
   * Scan for potential XSS patterns (heuristic)
   */
  /**
   * Enhanced XSS pattern detection with dangerous sinks
   */
  scanXSSPatterns() {
    const findings = [];

    // Inline event handlers
    const elementsWithEvents = document.querySelectorAll(
      '[onclick], [onerror], [onload], [onmouseover], [onmouseout], [onfocus], [onblur], [onchange]'
    );

    if (elementsWithEvents.length > 0) {
      findings.push(this.createFinding({
        type: 'INLINE_EVENT_HANDLER',
        severity: 'MEDIUM',
        confidence: 'medium',
        category: 'heuristic',
        title: 'Inline Event Handlers Detected',
        description: `Found ${elementsWithEvents.length} elements with inline event handlers. While not always exploitable, these can increase XSS risk.`,
        evidence: {
          count: elementsWithEvents.length,
          samples: Array.from(elementsWithEvents).slice(0, 3).map(el => el.tagName)
        },
        remediation: 'Consider using addEventListener instead of inline event handlers.'
      }));
    }

    // Scan all scripts for dangerous sinks
    const scripts = Array.from(document.scripts);
    const dangerousSinks = this.scanDangerousSinks(scripts);

    findings.push(...dangerousSinks);

    return findings;
  }

  /**
   * Scan for dangerous JavaScript sinks that can lead to XSS
   */
  scanDangerousSinks(scripts) {
    const findings = [];

    const sinkPatterns = [
      {
        pattern: /document\.write\s*\(/g,
        type: 'DOCUMENT_WRITE',
        severity: 'HIGH',
        title: 'document.write() Usage Detected',
        description: 'document.write() can inject arbitrary HTML and is a common XSS vector.',
        remediation: 'Avoid document.write(). Use DOM APIs like createElement() and appendChild().'
      },
      {
        pattern: /\beval\s*\(/g,
        type: 'EVAL_USAGE',
        severity: 'HIGH',
        title: 'eval() Usage Detected',
        description: 'eval() executes arbitrary JavaScript code and is extremely dangerous if used with user input.',
        remediation: 'Never use eval(). Use JSON.parse() for data or refactor to avoid dynamic code execution.'
      },
      {
        pattern: /new\s+Function\s*\(/g,
        type: 'FUNCTION_CONSTRUCTOR',
        severity: 'HIGH',
        title: 'Function() Constructor Usage',
        description: 'Function() constructor acts like eval() and can execute arbitrary code.',
        remediation: 'Avoid Function() constructor. Refactor to use normal function definitions.'
      },
      {
        pattern: /setTimeout\s*\(\s*["'`]/g,
        type: 'SETTIMEOUT_STRING',
        severity: 'HIGH',
        title: 'setTimeout() with String Argument',
        description: 'setTimeout() with string argument evaluates code like eval().',
        remediation: 'Use setTimeout() with function references, not string code.'
      },
      {
        pattern: /setInterval\s*\(\s*["'`]/g,
        type: 'SETINTERVAL_STRING',
        severity: 'HIGH',
        title: 'setInterval() with String Argument',
        description: 'setInterval() with string argument evaluates code like eval().',
        remediation: 'Use setInterval() with function references, not string code.'
      },
      {
        pattern: /\.outerHTML\s*=/g,
        type: 'OUTERHTML_ASSIGNMENT',
        severity: 'MEDIUM',
        title: 'outerHTML Assignment Detected',
        description: 'outerHTML assignment can inject HTML and lead to XSS if used with untrusted data.',
        remediation: 'Avoid outerHTML assignments with user data. Use textContent or safe DOM APIs.'
      },
      {
        pattern: /\.insertAdjacentHTML\s*\(/g,
        type: 'INSERTADJACENTHTML',
        severity: 'MEDIUM',
        title: 'insertAdjacentHTML() Usage',
        description: 'insertAdjacentHTML() can inject HTML and requires careful input sanitization.',
        remediation: 'Ensure insertAdjacentHTML() is never used with unsanitized user input.'
      },
      {
        pattern: /location\s*=\s*|location\.href\s*=\s*|location\.replace\s*\(/g,
        type: 'LOCATION_ASSIGNMENT',
        severity: 'MEDIUM',
        title: 'Location Assignment Detected',
        description: 'Assigning to location or location.href with user input can cause open redirect or XSS.',
        remediation: 'Validate and sanitize URLs before navigation. Use URL parsing and allowlists.'
      },
      {
        pattern: /\.innerHTML\s*=/g,
        type: 'INNERHTML_ASSIGNMENT',
        severity: 'MEDIUM',
        title: 'innerHTML Assignment Detected',
        description: 'innerHTML assignment can inject HTML. Requires sanitization with untrusted data.',
        remediation: 'Use textContent for text or DOMPurify for trusted HTML. Avoid innerHTML with user input.'
      }
    ];

    sinkPatterns.forEach(sink => {
      const matches = [];

      scripts.forEach((script, scriptIndex) => {
        const content = script.textContent;
        const found = content.match(sink.pattern);

        if (found) {
          // Extract code sample (first occurrence)
          const matchIndex = content.search(sink.pattern);
          const sample = content.substring(matchIndex, matchIndex + 100).replace(/\n/g, ' ');

          matches.push({
            scriptIndex,
            sample: sample + (content.length > matchIndex + 100 ? '...' : ''),
            count: found.length
          });
        }
      });

      if (matches.length > 0) {
        const totalCount = matches.reduce((sum, m) => sum + m.count, 0);

        findings.push(this.createFinding({
          type: sink.type,
          severity: sink.severity,
          confidence: 'medium',
          category: 'heuristic',
          title: sink.title,
          description: sink.description + ` Found ${totalCount} occurrence(s) in ${matches.length} script(s).`,
          evidence: {
            totalOccurrences: totalCount,
            scriptCount: matches.length,
            samples: matches.slice(0, 3).map(m => ({
              sample: m.sample,
              occurrences: m.count
            }))
          },
          remediation: sink.remediation
        }));
      }
    });

    return findings;
  }

  /**
   * Scan for insecure dependency patterns
   */
  scanDependencies() {
    const findings = [];
    const scripts = Array.from(document.scripts);

    scripts.forEach(script => {
      const src = script.src;

      // HTTP scripts (confirmed issue)
      if (src && src.startsWith('http://')) {
        findings.push(this.createFinding({
          type: 'INSECURE_DEPENDENCY',
          severity: 'HIGH',
          confidence: 'high',
          category: 'confirmed',
          title: 'Insecure HTTP Script',
          description: 'Loading script over insecure HTTP connection allows MITM attacks.',
          evidence: { url: src },
          remediation: 'Change to HTTPS.'
        }));
      }

      // Missing SRI (informational, not a vuln by itself)
      if (src && src.includes('cdn') && !script.integrity) {
        findings.push(this.createFinding({
          type: 'MISSING_SRI',
          severity: 'LOW',
          confidence: 'medium',
          category: 'informational',
          title: 'CDN Script Without SRI',
          description: 'CDN script loaded without Subresource Integrity check. If the CDN is compromised, malicious code could be injected.',
          evidence: { url: src },
          remediation: 'Add integrity attribute with SRI hash.'
        }));
      }
    });

    return findings;
  }

  /**
   * Extract library info from script URLs
   */
  extractLibraryInfo(src) {
    if (!src) return null;

    const patterns = [
      { regex: /jquery[-@]?(\d+\.\d+\.\d+)/i, name: 'jQuery' },
      { regex: /react[-@.](\d+\.\d+\.\d+)/i, name: 'React' },
      { regex: /vue[-@.](\d+\.\d+\.\d+)/i, name: 'Vue' },
      { regex: /angular[-@.](\d+\.\d+\.\d+)/i, name: 'Angular' },
      { regex: /bootstrap[-@.](\d+\.\d+\.\d+)/i, name: 'Bootstrap' },
      { regex: /lodash[-@.](\d+\.\d+\.\d+)/i, name: 'Lodash' },
      { regex: /moment[-@.](\d+\.\d+\.\d+)/i, name: 'Moment.js' }
    ];

    for (const pattern of patterns) {
      const match = src.match(pattern.regex);
      if (match) {
        return { name: pattern.name, version: match[1] };
      }
    }

    return null;
  }

  /**
   * Detect libraries from global window variables
   * Handles bundled/webpack libraries that don't have versions in URLs
   */
  detectLibrariesFromGlobals() {
    const detected = [];

    // jQuery detection
    try {
      if (window.jQuery && window.jQuery.fn && window.jQuery.fn.jquery) {
        detected.push({ name: 'jQuery', version: window.jQuery.fn.jquery, source: 'window.jQuery' });
      }
    } catch (e) { /* ignore */ }

    // React detection
    try {
      if (window.React && window.React.version) {
        detected.push({ name: 'React', version: window.React.version, source: 'window.React' });
      }
    } catch (e) { /* ignore */ }

    // Vue detection (Vue 2.x)
    try {
      if (window.Vue && window.Vue.version) {
        detected.push({ name: 'Vue', version: window.Vue.version, source: 'window.Vue' });
      }
    } catch (e) { /* ignore */ }

    // Angular 1.x detection
    try {
      if (window.angular && window.angular.version && window.angular.version.full) {
        detected.push({ name: 'Angular', version: window.angular.version.full, source: 'window.angular' });
      }
    } catch (e) { /* ignore */ }

    // Lodash detection
    try {
      if (window._ && window._.VERSION) {
        detected.push({ name: 'Lodash', version: window._.VERSION, source: 'window._' });
      }
    } catch (e) { /* ignore */ }

    // Moment.js detection
    try {
      if (window.moment && window.moment.version) {
        detected.push({ name: 'Moment.js', version: window.moment.version, source: 'window.moment' });
      }
    } catch (e) { /* ignore */ }

    // Bootstrap detection (if exposed)
    try {
      if (window.bootstrap && window.bootstrap.Alert && window.bootstrap.Alert.VERSION) {
        detected.push({ name: 'Bootstrap', version: window.bootstrap.Alert.VERSION, source: 'window.bootstrap' });
      }
    } catch (e) { /* ignore */ }

    return detected;
  }

  /**
   * Detect libraries from script tags (existing regex method)
   */
  detectLibrariesFromScripts() {
    const detected = [];
    const scripts = Array.from(document.scripts);

    scripts.forEach(script => {
      const libInfo = this.extractLibraryInfo(script.src);
      if (libInfo) {
        detected.push({
          name: libInfo.name,
          version: libInfo.version,
          url: script.src,
          source: 'script tag'
        });
      }
    });

    // Check meta generator
    const metaGenerator = document.querySelector('meta[name="generator"]');
    if (metaGenerator) {
      const content = metaGenerator.getAttribute('content');
      const libInfo = this.extractLibraryInfo(content);
      if (libInfo) {
        detected.push({
          name: libInfo.name,
          version: libInfo.version,
          source: 'meta tag'
        });
      }
    }

    return detected;
  }

  /**
   * Merge library detections, preferring global variables over URL parsing
   */
  mergeLibraryDetections(globalDetections, scriptDetections) {
    const merged = new Map();

    // Add script detections first
    scriptDetections.forEach(lib => {
      merged.set(lib.name, lib);
    });

    // Override with global detections (more reliable)
    globalDetections.forEach(lib => {
      merged.set(lib.name, lib);
    });

    return Array.from(merged.values());
  }

  /**
   * Scan against CISA KEV - CONSERVATIVE matching
   */
  async scanKEVCorrelation() {
    const findings = [];

    try {
      const response = await chrome.runtime.sendMessage({ action: 'getKEVCatalog' });
      if (!response || !response.catalog) {
        return findings;
      }

      const kevCatalog = response.catalog;

      // Detect libraries using both global variables and script tags
      const globalLibs = this.detectLibrariesFromGlobals();
      const scriptLibs = this.detectLibrariesFromScripts();
      const allLibs = this.mergeLibraryDetections(globalLibs, scriptLibs);

      // Convert to Map for KEV checking
      const detectedLibraries = new Map();
      allLibs.forEach(lib => {
        detectedLibraries.set(lib.name, lib);
      });

      // Correlate with KEV - Use NVD API for accurate version checking
      for (const [libName, libData] of detectedLibraries.entries()) {
        const productName = libName.toLowerCase().replace(/\.js$/, '');

        // Find KEV entries that mention this product
        const relatedKEVs = kevCatalog.filter(vuln => {
          const kevProduct = (vuln.product || '').toLowerCase();

          // Exact or very close match on product name
          return kevProduct.includes(productName) || kevProduct === productName;
        });

        if (relatedKEVs.length > 0) {
          // For each KEV match, fetch CVE details from NVD to check version
          for (const kev of relatedKEVs) {
            try {
              // Fetch CVE details from NVD via background script
              const response = await chrome.runtime.sendMessage({
                action: 'getCVEDetails',
                cveId: kev.cveID
              });

              if (response && response.cveDetails) {
                const cveDetails = response.cveDetails;

                // Check if detected version matches vulnerable range
                let isVulnerable = false;
                let matchedConstraints = null;

                for (const affectedProduct of cveDetails.affectedProducts) {
                  // Product name match
                  const productMatches =
                    affectedProduct.product.toLowerCase().includes(productName) ||
                    productName.includes(affectedProduct.product.toLowerCase());

                  if (productMatches) {
                    // Check version range
                    if (this.isVersionVulnerable(libData.version, affectedProduct)) {
                      isVulnerable = true;
                      matchedConstraints = affectedProduct;
                      break;
                    }
                  }
                }

                if (isVulnerable) {
                  // CONFIRMED vulnerable version
                  findings.push(this.createFinding({
                    type: 'KNOWN_EXPLOITED_VULNERABILITY',
                    severity: 'CRITICAL',
                    confidence: 'high',
                    category: 'confirmed',
                    title: `Confirmed KEV: ${libName} ${libData.version}`,
                    description: `${libName} ${libData.version} is affected by ${kev.cveID}, a known exploited vulnerability in the CISA KEV catalog. This version is confirmed vulnerable based on NVD data.`,
                    evidence: {
                      detectedProduct: libName,
                      detectedVersion: libData.version,
                      cveId: kev.cveID,
                      kevProduct: kev.product,
                      kevVendor: kev.vendorProject,
                      dateAdded: kev.dateAdded,
                      url: libData.url || libData.source,
                      versionRange: this.formatVersionRange(matchedConstraints)
                    },
                    remediation: `Update ${libName} immediately. Vulnerable range: ${this.formatVersionRange(matchedConstraints)}. CISA required action: ${kev.requiredAction}`,
                    metadata: {
                      cisaDescription: kev.shortDescription,
                      requiredAction: kev.requiredAction,
                      dueDate: kev.dueDate,
                      nvdDescription: cveDetails.description
                    }
                  }));
                } else {
                  // Product matches KEV but version appears safe
                  // Check if it's the latest version
                  const latestVersionResponse = await chrome.runtime.sendMessage({
                    action: 'getLatestVersion',
                    libraryName: libName
                  });

                  let remediation = `Version appears safe based on NVD data.`;
                  let additionalEvidence = {};

                  if (latestVersionResponse && latestVersionResponse.latestVersion) {
                    const latestVersion = latestVersionResponse.latestVersion;
                    additionalEvidence.latestVersion = latestVersion;

                    // Compare versions
                    const comparison = this.compareVersions(libData.version, latestVersion);
                    if (comparison < 0) {
                      // Detected version is older than latest
                      remediation = `Version ${libData.version} is safe but outdated. Latest stable version is ${latestVersion}. Consider updating.`;
                    } else if (comparison === 0) {
                      // On latest version
                      remediation = `Version ${libData.version} is safe and up-to-date (latest stable release).`;
                    } else {
                      // Detected version is newer (pre-release or beta)
                      remediation = `Version ${libData.version} is safe. Latest stable is ${latestVersion}.`;
                    }
                  }

                  findings.push(this.createFinding({
                    type: 'KEV_PRODUCT_SAFE_VERSION',
                    severity: 'LOW',
                    confidence: 'medium',
                    category: 'informational',
                    title: `KEV Product Detected (Safe Version): ${libName}`,
                    description: `${libName} ${libData.version} detected. This product has known exploited vulnerabilities (${kev.cveID}) but this version appears to be outside the vulnerable range based on NVD data.`,
                    evidence: {
                      detectedProduct: libName,
                      detectedVersion: libData.version,
                      cveId: kev.cveID,
                      url: libData.url || libData.source,
                      ...additionalEvidence
                    },
                    remediation,
                    metadata: {
                      cisaDescription: kev.shortDescription
                    }
                  }));
                }
              } else {
                // NVD fetch failed, fall back to informational
                findings.push(this.createFinding({
                  type: 'KEV_RELATED_PRODUCT',
                  severity: 'MEDIUM',
                  confidence: 'low',
                  category: 'informational',
                  title: `Product in CISA KEV: ${libName}`,
                  description: `Detected ${libName} ${libData.version}. CISA KEV lists ${kev.cveID} for this product. Could not fetch version details from NVD - manual verification recommended.`,
                  evidence: {
                    detectedProduct: libName,
                    detectedVersion: libData.version,
                    cveId: kev.cveID,
                    url: libData.url || libData.source
                  },
                  remediation: `Verify if ${libName} ${libData.version} is affected by ${kev.cveID}. Consult NIST NVD or vendor advisories.`,
                  metadata: {
                    cisaDescription: kev.shortDescription,
                    requiredAction: kev.requiredAction,
                    dueDate: kev.dueDate
                  }
                }));
              }
            } catch (error) {
              console.error(`Error checking CVE ${kev.cveID}:`, error);
            }
          }
        }
      }

      // CVE mentions in page text (informational only)
      const pageText = document.body.innerText;
      const cvePattern = /CVE-\d{4}-\d{4,7}/gi;
      const cveMentions = pageText.match(cvePattern);

      if (cveMentions) {
        const uniqueCVEs = [...new Set(cveMentions)];
        uniqueCVEs.forEach(cve => {
          const kevEntry = kevCatalog.find(vuln => vuln.cveID === cve);
          if (kevEntry) {
            findings.push(this.createFinding({
              type: 'CVE_MENTIONED',
              severity: 'LOW',
              confidence: 'low',
              category: 'informational',
              title: `KEV CVE Mentioned: ${cve}`,
              description: `Page text mentions ${cve}, which is in CISA KEV. This does not confirm a vulnerability, but warrants investigation.`,
              evidence: {
                cveId: cve,
                kevProduct: kevEntry.product
              },
              metadata: {
                cisaDescription: kevEntry.shortDescription
              }
            }));
          }
        });
      }

    } catch (error) {
      console.error('KEV correlation error:', error);
    }

    return findings;
  }

  /**
   * Check if a version falls within a vulnerable version range
   */
  /**
   * Check if a version falls within a vulnerable version range
   * Now fully semver-compliant including pre-release versions
   */
  isVersionVulnerable(detectedVersion, constraints) {
    // Check start constraint (inclusive)
    if (constraints.versionStartIncluding) {
      if (this.compareVersions(detectedVersion, constraints.versionStartIncluding) < 0) {
        return false; // Below minimum
      }
    }

    // Check start constraint (exclusive)
    if (constraints.versionStartExcluding) {
      if (this.compareVersions(detectedVersion, constraints.versionStartExcluding) <= 0) {
        return false; // Not above exclusive minimum
      }
    }

    // Check end constraint (inclusive)
    if (constraints.versionEndIncluding) {
      if (this.compareVersions(detectedVersion, constraints.versionEndIncluding) > 0) {
        return false; // Above maximum
      }
    }

    // Check end constraint (exclusive)
    if (constraints.versionEndExcluding) {
      if (this.compareVersions(detectedVersion, constraints.versionEndExcluding) >= 0) {
        return false; // Not below exclusive maximum
      }
    }

    // If we passed all constraint checks, version is in vulnerable range
    return true;
  }

  /**
   * Parse a semver version string into components
   * Handles: X.Y.Z, X.Y.Z-prerelease, X.Y.Z+build, X.Y.Z-prerelease+build
   * Returns: { major, minor, patch, prerelease, build }
   */
  parseSemVer(versionString) {
    const version = String(versionString).trim();

    // Extract build metadata (everything after +)
    const buildSplit = version.split('+');
    const versionWithoutBuild = buildSplit[0];
    const build = buildSplit[1] || null;

    // Extract pre-release (everything after -)
    const prereleaseSplit = versionWithoutBuild.split('-');
    const coreVersion = prereleaseSplit[0];
    const prerelease = prereleaseSplit.slice(1).join('-') || null;

    // Parse core version (major.minor.patch)
    const parts = coreVersion.split('.').map(p => parseInt(p, 10) || 0);

    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
      prerelease: prerelease,
      build: build
    };
  }

  /**
   * Compare two semver versions with full spec compliance
   * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   * Handles pre-release versions: 1.0.0-alpha < 1.0.0-beta < 1.0.0
   */
  compareVersions(v1, v2) {
    const ver1 = this.parseSemVer(v1);
    const ver2 = this.parseSemVer(v2);

    // Compare major.minor.patch
    if (ver1.major !== ver2.major) return ver1.major < ver2.major ? -1 : 1;
    if (ver1.minor !== ver2.minor) return ver1.minor < ver2.minor ? -1 : 1;
    if (ver1.patch !== ver2.patch) return ver1.patch < ver2.patch ? -1 : 1;

    // If core versions are equal, handle pre-release comparison
    // Per semver spec: 1.0.0-alpha < 1.0.0
    if (ver1.prerelease && !ver2.prerelease) return -1;  // v1 is pre-release, v2 is stable
    if (!ver1.prerelease && ver2.prerelease) return 1;   // v1 is stable, v2 is pre-release
    if (!ver1.prerelease && !ver2.prerelease) return 0;  // Both stable and equal

    // Both have pre-release, compare them
    return this.comparePrereleases(ver1.prerelease, ver2.prerelease);
  }

  /**
   * Compare pre-release identifiers according to semver spec
   * Numeric identifiers compared as numbers, alphanumeric as strings
   */
  comparePrereleases(pre1, pre2) {
    const parts1 = pre1.split('.');
    const parts2 = pre2.split('.');

    const maxLen = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLen; i++) {
      const p1 = parts1[i];
      const p2 = parts2[i];

      // If one has fewer parts, it's less
      if (p1 === undefined) return -1;
      if (p2 === undefined) return 1;

      // Try to parse as numbers
      const num1 = parseInt(p1, 10);
      const num2 = parseInt(p2, 10);

      const isNum1 = !isNaN(num1) && String(num1) === p1;
      const isNum2 = !isNaN(num2) && String(num2) === p2;

      // Numeric identifiers always < alphanumeric
      if (isNum1 && !isNum2) return -1;
      if (!isNum1 && isNum2) return 1;

      // Both numeric: compare as numbers
      if (isNum1 && isNum2) {
        if (num1 !== num2) return num1 < num2 ? -1 : 1;
        continue;
      }

      // Both alphanumeric: compare as strings
      if (p1 !== p2) return p1 < p2 ? -1 : 1;
    }

    return 0;
  }

  /**
   * Format version range constraints as human-readable string
   */
  formatVersionRange(constraints) {
    const parts = [];

    if (constraints.versionStartIncluding) {
      parts.push(`>= ${constraints.versionStartIncluding}`);
    }
    if (constraints.versionStartExcluding) {
      parts.push(`> ${constraints.versionStartExcluding}`);
    }
    if (constraints.versionEndIncluding) {
      parts.push(`<= ${constraints.versionEndIncluding}`);
    }
    if (constraints.versionEndExcluding) {
      parts.push(`< ${constraints.versionEndExcluding}`);
    }

    return parts.join(' && ') || 'all versions';
  }

  /**
   * Scan for potential secret exposure (conservative)
   */
  /**
   * Enhanced secret exposure scanning with deep DOM inspection
   */
  scanSecretExposure() {
    const findings = [];
    const secretLocations = [];

    // Enhanced patterns including more token types
    const patterns = [
      {
        regex: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?([a-zA-Z0-9_-]{32,})["']?/gi,
        name: 'Generic API Key',
        minLength: 32
      },
      {
        regex: /sk-[a-zA-Z0-9]{32,}/g,
        name: 'OpenAI API Key',
        minLength: 35
      },
      {
        regex: /(?:aws|AKIA)[a-zA-Z0-9]{16,}/g,
        name: 'AWS Key',
        minLength: 20
      },
      {
        regex: /ghp_[a-zA-Z0-9]{36,}/g,
        name: 'GitHub Personal Access Token',
        minLength: 40
      },
      {
        regex: /gho_[a-zA-Z0-9]{36,}/g,
        name: 'GitHub OAuth Token',
        minLength: 40
      },
      {
        regex: /ghu_[a-zA-Z0-9]{36,}/g,
        name: 'GitHub User Token',
        minLength: 40
      },
      {
        regex: /sk_live_[a-zA-Z0-9]{24,}/g,
        name: 'Stripe Live Secret Key',
        minLength: 32
      },
      {
        regex: /pk_live_[a-zA-Z0-9]{24,}/g,
        name: 'Stripe Live Publishable Key',
        minLength: 32
      },
      {
        regex: /xoxb-[a-zA-Z0-9-]{50,}/g,
        name: 'Slack Bot Token',
        minLength: 55
      },
      {
        regex: /xoxp-[a-zA-Z0-9-]{50,}/g,
        name: 'Slack User Token',
        minLength: 55
      },
      {
        regex: /eyJ[a-zA-Z0-9_-]{30,}\.eyJ[a-zA-Z0-9_-]{30,}\.[a-zA-Z0-9_-]{30,}/g,
        name: 'JWT Token',
        minLength: 100
      }
    ];

    // Scan visible text
    const pageText = document.body.innerText;
    this.scanTextForSecrets(pageText, patterns, 'page text', secretLocations);

    // Scan DOM attributes
    this.scanDOMAttributes(patterns, secretLocations);

    // Scan hidden input values
    this.scanHiddenInputs(patterns, secretLocations);

    // Scan HTML comments
    this.scanHTMLComments(patterns, secretLocations);

    // Scan script content
    this.scanScriptContent(patterns, secretLocations);

    // Scan localStorage and sessionStorage
    this.scanWebStorage(patterns, secretLocations);

    // Group findings by pattern type
    const grouped = {};
    secretLocations.forEach(loc => {
      if (!grouped[loc.pattern]) {
        grouped[loc.pattern] = [];
      }
      grouped[loc.pattern].push(loc);
    });

    // Create findings
    Object.keys(grouped).forEach(patternName => {
      const locations = grouped[patternName];
      findings.push(this.createFinding({
        type: 'POTENTIAL_SECRET_EXPOSURE',
        severity: 'HIGH',
        confidence: 'medium',
        category: 'heuristic',
        title: `Potential Secret Exposure: ${patternName}`,
        description: `Found ${locations.length} potential ${patternName}(s) in ${[...new Set(locations.map(l => l.location))].join(', ')}. May be false positive. Verify manually.`,
        evidence: {
          pattern: patternName,
          count: locations.length,
          locations: locations.slice(0, 5).map(l => ({
            location: l.location,
            element: l.element
          }))
        },
        remediation: 'Remove secrets from client-side code. Use environment variables and backend services.'
      }));
    });

    return findings;
  }

  scanTextForSecrets(text, patterns, location, results) {
    patterns.forEach(pattern => {
      const matches = text.match(pattern.regex);
      if (matches) {
        const filtered = matches.filter(m =>
          !m.toLowerCase().includes('example') &&
          !m.includes('YOUR_') &&
          !m.includes('XXX') &&
          !m.includes('***') &&
          m.length >= (pattern.minLength || 20)
        );

        filtered.forEach(() => {
          results.push({
            pattern: pattern.name,
            location: location,
            element: 'text content'
          });
        });
      }
    });
  }

  scanDOMAttributes(patterns, results) {
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('data-') || attr.name.includes('key') || attr.name.includes('token')) {
          this.scanTextForSecrets(attr.value, patterns, 'DOM attributes', results);
        }
      });
    });
  }

  scanHiddenInputs(patterns, results) {
    const hiddenInputs = document.querySelectorAll('input[type="hidden"]');
    hiddenInputs.forEach(input => {
      if (input.value) {
        this.scanTextForSecrets(input.value, patterns, 'hidden input', results);
      }
    });
  }

  scanHTMLComments(patterns, results) {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_COMMENT,
      null,
      false
    );

    let comment = walker.nextNode();
    while (comment) {
      this.scanTextForSecrets(comment.nodeValue, patterns, 'HTML comment', results);
      comment = walker.nextNode();
    }
  }

  scanScriptContent(patterns, results) {
    const scripts = document.querySelectorAll('script:not([src])');
    scripts.forEach(script => {
      this.scanTextForSecrets(script.textContent, patterns, 'inline script', results);
    });
  }

  scanWebStorage(patterns, results) {
    try {
      // Scan localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        this.scanTextForSecrets(value, patterns, 'localStorage', results);
      }

      // Scan sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        this.scanTextForSecrets(value, patterns, 'sessionStorage', results);
      }
    } catch (e) {
      // Storage access may be blocked
    }
  }

  /**
   * Scan CSP configuration
   */
  /**
   * Scan security headers (CSP, HSTS, etc.)
   * Now checks HTTP headers in addition to meta tags
   */
  async scanSecurityHeaders() {
    const findings = [];

    // Fetch HTTP headers from background script
    let httpHeaders = null;
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSecurityHeaders' });
      httpHeaders = response?.headers;
    } catch (e) {
      console.error('Failed to fetch security headers:', e);
    }

    // Check Content-Security-Policy
    const cspHeader = httpHeaders?.['content-security-policy'];
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    const csp = cspHeader || cspMeta?.getAttribute('content');

    if (!csp) {
      findings.push(this.createFinding({
        type: 'MISSING_CSP',
        severity: 'MEDIUM',
        confidence: 'high',
        category: 'confirmed',
        title: 'Missing Content Security Policy',
        description: 'No Content Security Policy found (neither HTTP header nor meta tag). CSP is a critical defense against XSS attacks.',
        remediation: 'Add a Content-Security-Policy HTTP header with appropriate directives.'
      }));
    } else {
      // Check for weak CSP directives
      if (csp.includes('unsafe-inline')) {
        findings.push(this.createFinding({
          type: 'WEAK_CSP',
          severity: 'MEDIUM',
          confidence: 'high',
          category: 'confirmed',
          title: 'Weak CSP: unsafe-inline',
          description: 'CSP allows unsafe-inline, which weakens XSS protection.',
          evidence: {
            directive: 'unsafe-inline',
            source: cspHeader ? 'HTTP header' : 'meta tag',
            policy: csp.substring(0, 100) + (csp.length > 100 ? '...' : '')
          },
          remediation: 'Remove unsafe-inline and use nonces or hashes for inline scripts.'
        }));
      }

      if (csp.includes('unsafe-eval')) {
        findings.push(this.createFinding({
          type: 'WEAK_CSP',
          severity: 'MEDIUM',
          confidence: 'high',
          category: 'confirmed',
          title: 'Weak CSP: unsafe-eval',
          description: 'CSP allows unsafe-eval, which permits dynamic code evaluation.',
          evidence: {
            directive: 'unsafe-eval',
            source: cspHeader ? 'HTTP header' : 'meta tag'
          },
          remediation: 'Remove unsafe-eval from CSP.'
        }));
      }
    }

    // Check X-Content-Type-Options
    if (!httpHeaders?.['x-content-type-options']) {
      findings.push(this.createFinding({
        type: 'MISSING_X_CONTENT_TYPE_OPTIONS',
        severity: 'LOW',
        confidence: 'high',
        category: 'confirmed',
        title: 'Missing X-Content-Type-Options',
        description: 'X-Content-Type-Options header not set. This header prevents MIME type sniffing.',
        remediation: 'Add X-Content-Type-Options: nosniff header.'
      }));
    }

    // Check Strict-Transport-Security
    if (window.location.protocol === 'https:' && !httpHeaders?.['strict-transport-security']) {
      findings.push(this.createFinding({
        type: 'MISSING_HSTS',
        severity: 'MEDIUM',
        confidence: 'high',
        category: 'confirmed',
        title: 'Missing Strict-Transport-Security (HSTS)',
        description: 'HSTS header not set on HTTPS site. This header protects against protocol downgrade attacks.',
        remediation: 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains header.'
      }));
    }

    // Check X-Frame-Options
    if (!httpHeaders?.['x-frame-options']) {
      findings.push(this.createFinding({
        type: 'MISSING_X_FRAME_OPTIONS',
        severity: 'LOW',
        confidence: 'high',
        category: 'informational',
        title: 'Missing X-Frame-Options',
        description: 'X-Frame-Options header not set. This header helps prevent clickjacking attacks. Modern CSP frame-ancestors directive is preferred.',
        remediation: 'Add X-Frame-Options: DENY or SAMEORIGIN, or use CSP frame-ancestors directive.'
      }));
    }

    return findings;
  }

  /**
   * Run all scans
   */
  async runScans() {
    this.findings = [];

    const syncFindings = [
      ...this.scanXSSPatterns(),
      ...this.scanDependencies(),
      ...this.scanSecretExposure()
    ];

    // Async scans
    const kevFindings = await this.scanKEVCorrelation();
    const securityHeaderFindings = await this.scanSecurityHeaders();

    this.findings = [...syncFindings, ...kevFindings, ...securityHeaderFindings];
    this.findings = this.deduplicateFindings();

    // Send results with session ID
    chrome.runtime.sendMessage({
      action: 'scanComplete',
      url: window.location.href,
      vulnerabilities: this.findings,
      sessionId: this.scanSessionId
    });

    return this.findings;
  }
}

// Auto-run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const scanner = new VulnerabilityScanner();
    scanner.runScans();
  });
} else {
  const scanner = new VulnerabilityScanner();
  scanner.runScans();
}

// Listen for manual scan requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startScan') {
    const scanner = new VulnerabilityScanner();
    scanner.runScans().then(results => {
      sendResponse({ success: true, vulnerabilities: results });
    }).catch(error => {
      console.error('Scan error:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
});

// Contributed via automated bounty system
