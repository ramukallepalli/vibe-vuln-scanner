/**
 * Background service worker
 * Manages KEV catalog, scan results, and badge updates
 */

const CISA_KEV_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
const NVD_API_BASE = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const NPM_REGISTRY_BASE = 'https://registry.npmjs.org';
const KEV_REFRESH_ALARM = 'kevRefreshAlarm';
const KEV_REFRESH_INTERVAL = 6 * 60; // 6 hours in minutes

// In-memory scan results: Map<tabId, Map<sessionId, result>>
const scanResults = new Map();

// CVE details cache: Map<cveId, cveDetails>
const cveCache = new Map();

// Latest version cache: Map<libraryName, {version, timestamp}>
const latestVersionCache = new Map();

// Security headers cache: Map<tabId, headers>
const capturedHeaders = new Map();

// ===== HTTP Header Capture =====

// Capture security-relevant HTTP headers
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.type !== 'main_frame') {
      return; // Only capture main document headers
    }

    const headers = {};
    const securityHeaders = [
      'content-security-policy',
      'x-content-type-options',
      'strict-transport-security',
      'x-frame-options',
      'x-xss-protection',
      'referrer-policy',
      'permissions-policy'
    ];

    details.responseHeaders.forEach(header => {
      const headerName = header.name.toLowerCase();
      if (securityHeaders.includes(headerName)) {
        headers[headerName] = header.value;
      }
    });

    if (Object.keys(headers).length > 0) {
      capturedHeaders.set(details.tabId, {
        headers,
        url: details.url,
        timestamp: Date.now()
      });
    }
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

// Clean up headers on tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  capturedHeaders.delete(tabId);
});

// ===== API Retry Utility with Exponential Backoff =====

/**
 * Fetch with exponential backoff and rate limit handling
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @param {number} maxRetries - Maximum retry attempts (default: 5)
 * @returns {Promise<Response>} - Fetch response or throws error
 */
async function fetchWithBackoff(url, options = {}, maxRetries = 5) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Handle rate limiting (HTTP 429)
      if (response.status === 429) {
        if (attempt >= maxRetries) {
          throw new Error(`Rate limited after ${maxRetries} retries`);
        }

        // Check for Retry-After header
        const retryAfter = response.headers.get('Retry-After');
        const delayMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000  // Retry-After is in seconds
          : Math.pow(2, attempt) * 1000;      // Exponential backoff: 1s, 2s, 4s, 8s, 16s

        console.log(`Rate limited. Retrying after ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delayMs);
        continue;
      }

      // For other successful or error responses, return immediately
      return response;

    } catch (error) {
      lastError = error;

      // Network errors (timeout, offline, etc.)
      if (attempt >= maxRetries) {
        console.error(`Fetch failed after ${maxRetries} retries:`, error);
        throw error;
      }

      // Exponential backoff for network errors
      const delayMs = Math.pow(2, attempt) * 1000;
      console.log(`Network error. Retrying after ${delayMs}ms (attempt ${attempt + 1}/${maxRetries}):`, error.message);
      await sleep(delayMs);
    }
  }

  throw lastError || new Error('Fetch failed');
}

/**
 * Sleep utility for backoff delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Single message router to avoid listener conflicts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Keep channel open for async responses
});

async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.action) {
      case 'scanComplete': {
        await handleScanComplete(message, sender);
        sendResponse({ success: true });
        break;
      }

      case 'getKEVCatalog': {
        const catalog = await getKEVCatalog();
        sendResponse({ catalog });
        break;
      }

      case 'getResults': {
        const results = getResults(message.tabId, message.url);
        sendResponse(results);
        break;
      }

      case 'requestScan': {
        // Popup requests a fresh scan
        sendResponse({ scanRequested: true });
        break;
      }

      case 'getCVEDetails': {
        const cveDetails = await getCVEDetails(message.cveId);
        sendResponse({ cveDetails });
        break;
      }

      case 'getLatestVersion': {
        const latestVersion = await getLatestVersion(message.libraryName);
        sendResponse({ latestVersion });
        break;
      }

      case 'getSecurityHeaders': {
        const tabId = message.tabId || sender.tab?.id;
        const headerData = capturedHeaders.get(tabId);
        sendResponse({ headers: headerData?.headers || null });
        break;
      }

      case 'getScanHistory': {
        const history = await getScanHistory(message.url);
        sendResponse({ history });
        break;
      }

      default:
        sendResponse({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Message handler error:', error);
    sendResponse({ error: error.message });
  }
}

async function handleScanComplete(message, sender) {
  const tabId = sender.tab?.id;
  if (!tabId) return;

  const sessionId = createSessionId(message.url);

  const scanResult = {
    url: message.url,
    sessionId,
    vulnerabilities: message.vulnerabilities,
    timestamp: Date.now(),
    tabId
  };

  // Store in memory for quick access
  if (!scanResults.has(tabId)) {
    scanResults.set(tabId, new Map());
  }
  scanResults.get(tabId).set(sessionId, scanResult);

  // Persist to storage for history
  await saveScanResult(message.url, scanResult);

  updateBadge(tabId, message.vulnerabilities.length);
}

function createSessionId(url) {
  // Simple hash of URL for session identification
  try {
    const urlObj = new URL(url);
    return `${urlObj.origin}${urlObj.pathname}`;
  } catch {
    return url;
  }
}

function getResults(tabId, url) {
  const tabData = scanResults.get(tabId);
  if (!tabData) return null;

  const sessionId = createSessionId(url);
  const result = tabData.get(sessionId);

  // Only return if fresh (within 5 minutes)
  if (result && (Date.now() - result.timestamp) < 5 * 60 * 1000) {
    return result;
  }

  return null;
}

function updateBadge(tabId, count) {
  if (count === 0) {
    chrome.action.setBadgeText({ tabId, text: '' });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#4CAF50' });
  } else if (count < 5) {
    chrome.action.setBadgeText({ tabId, text: String(count) });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#FF9800' });
  } else {
    chrome.action.setBadgeText({ tabId, text: String(count) });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#F44336' });
  }
}

// ===== Persistent Storage for Scan History =====

/**
 * Save scan result to persistent storage
 * Stores last 50 scans per domain, with 30-day retention
 */
async function saveScanResult(url, scanResult) {
  try {
    const domain = extractDomain(url);
    const storageKey = `scan_history_${domain}`;

    // Get existing history for this domain
    const stored = await chrome.storage.local.get([storageKey]);
    let history = stored[storageKey] || [];

    // Add new scan with unique ID
    const scanWithId = {
      ...scanResult,
      scanId: `${domain}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      summary: summarizeVulnerabilities(scanResult.vulnerabilities)
    };

    history.unshift(scanWithId); // Add to beginning

    // Clean old scans (> 30 days)
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - THIRTY_DAYS;
    history = history.filter(scan => scan.timestamp > cutoffTime);

    // Limit to last 50 scans
    if (history.length > 50) {
      history = history.slice(0, 50);
    }

    // Save back to storage
    await chrome.storage.local.set({ [storageKey]: history });

    console.log(`Saved scan to history: ${domain} (${history.length} total scans)`);
  } catch (error) {
    console.error('Failed to save scan result:', error);
  }
}

/**
 * Get scan history for a domain
 */
async function getScanHistory(url) {
  try {
    const domain = extractDomain(url);
    const storageKey = `scan_history_${domain}`;

    const stored = await chrome.storage.local.get([storageKey]);
    return stored[storageKey] || [];
  } catch (error) {
    console.error('Failed to get scan history:', error);
    return [];
  }
}

/**
 * Extract domain from URL for storage key
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/[^a-z0-9.-]/gi, '_');
  } catch {
    return 'unknown';
  }
}

/**
 * Summarize vulnerabilities for storage
 */
function summarizeVulnerabilities(vulnerabilities) {
  const summary = {
    total: vulnerabilities.length,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  vulnerabilities.forEach(vuln => {
    const severity = vuln.severity?.toLowerCase();
    if (severity === 'critical') summary.critical++;
    else if (severity === 'high') summary.high++;
    else if (severity === 'medium') summary.medium++;
    else if (severity === 'low') summary.low++;
  });

  return summary;
}

// Clean up results for closed tabs
chrome.tabs.onRemoved.addListener((tabId) => {
  scanResults.delete(tabId);
});

// Clean up results when navigating away
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    const tabData = scanResults.get(tabId);
    if (tabData) {
      const sessionId = createSessionId(changeInfo.url);
      // Keep only the new session, clear old ones
      const newMap = new Map();
      const existing = tabData.get(sessionId);
      if (existing) {
        newMap.set(sessionId, existing);
      }
      scanResults.set(tabId, newMap);
    }
  }
});

// ===== KEV Catalog Management =====

async function fetchKEVCatalog() {
  try {
    console.log('Fetching CISA KEV catalog...');
    const response = await fetchWithBackoff(CISA_KEV_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const vulnerabilities = data.vulnerabilities || [];

    await chrome.storage.local.set({
      kevCatalog: vulnerabilities,
      kevLastUpdated: Date.now()
    });

    console.log(`KEV catalog updated: ${vulnerabilities.length} entries`);
    return vulnerabilities;
  } catch (error) {
    console.error('Failed to fetch KEV catalog:', error);

    // Fall back to cached data
    const stored = await chrome.storage.local.get(['kevCatalog', 'kevLastUpdated']);
    if (stored.kevCatalog) {
      console.log('Using cached KEV catalog');
      return stored.kevCatalog;
    }

    return [];
  }
}

async function getKEVCatalog() {
  const stored = await chrome.storage.local.get(['kevCatalog', 'kevLastUpdated']);

  // Return cached if fresh (< 24 hours)
  const ONE_DAY = 24 * 60 * 60 * 1000;
  if (stored.kevCatalog && stored.kevLastUpdated) {
    if ((Date.now() - stored.kevLastUpdated) < ONE_DAY) {
      return stored.kevCatalog;
    }
  }

  // Otherwise fetch fresh
  return await fetchKEVCatalog();
}

// ===== MV3 Alarm-based refresh =====

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === KEV_REFRESH_ALARM) {
    fetchKEVCatalog();
  }
});

async function setupKEVRefresh() {
  // Clear any existing alarm
  await chrome.alarms.clear(KEV_REFRESH_ALARM);

  // Create new periodic alarm (every 6 hours)
  await chrome.alarms.create(KEV_REFRESH_ALARM, {
    delayInMinutes: KEV_REFRESH_INTERVAL,
    periodInMinutes: KEV_REFRESH_INTERVAL
  });

  console.log('KEV refresh alarm configured');
}

// ===== NVD CVE Details =====

async function getCVEDetails(cveId) {
  // Check cache first
  if (cveCache.has(cveId)) {
    return cveCache.get(cveId);
  }

  // Check storage
  const stored = await chrome.storage.local.get([`cve_${cveId}`]);
  if (stored[`cve_${cveId}`]) {
    cveCache.set(cveId, stored[`cve_${cveId}`]);
    return stored[`cve_${cveId}`];
  }

  // Fetch from NVD with retry logic
  try {
    const url = `${NVD_API_BASE}?cveId=${cveId}`;
    const response = await fetchWithBackoff(url);

    if (!response.ok) {
      throw new Error(`NVD API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.vulnerabilities || data.vulnerabilities.length === 0) {
      return null;
    }

    const cveData = data.vulnerabilities[0].cve;
    const details = parseCVEData(cveData);

    // Cache in memory and storage
    cveCache.set(cveId, details);
    await chrome.storage.local.set({ [`cve_${cveId}`]: details });

    console.log(`Fetched CVE details for ${cveId}`);
    return details;

  } catch (error) {
    console.error(`Failed to fetch CVE ${cveId}:`, error);
    return null;
  }
}

function parseCVEData(cveData) {
  const details = {
    id: cveData.id,
    description: '',
    affectedProducts: []
  };

  // Extract description
  if (cveData.descriptions && cveData.descriptions.length > 0) {
    const englishDesc = cveData.descriptions.find(d => d.lang === 'en');
    details.description = englishDesc ? englishDesc.value : cveData.descriptions[0].value;
  }

  // Extract affected version ranges from configurations
  if (cveData.configurations && cveData.configurations.length > 0) {
    cveData.configurations.forEach(config => {
      if (config.nodes) {
        config.nodes.forEach(node => {
          if (node.cpeMatch) {
            node.cpeMatch.forEach(cpe => {
              if (cpe.vulnerable) {
                const product = parseCPE(cpe.criteria);
                if (product) {
                  details.affectedProducts.push({
                    vendor: product.vendor,
                    product: product.product,
                    versionStartIncluding: cpe.versionStartIncluding,
                    versionStartExcluding: cpe.versionStartExcluding,
                    versionEndIncluding: cpe.versionEndIncluding,
                    versionEndExcluding: cpe.versionEndExcluding
                  });
                }
              }
            });
          }
        });
      }
    });
  }

  return details;
}

function parseCPE(cpeString) {
  // CPE format: cpe:2.3:a:vendor:product:version:...
  const parts = cpeString.split(':');
  if (parts.length >= 5) {
    return {
      vendor: parts[3],
      product: parts[4]
    };
  }
  return null;
}

// ===== Latest Version Check =====

// Map library names to npm package names
const NPM_PACKAGE_MAP = {
  'jquery': 'jquery',
  'react': 'react',
  'vue': 'vue',
  'angular': '@angular/core',
  'bootstrap': 'bootstrap',
  'lodash': 'lodash',
  'moment': 'moment',
  'moment.js': 'moment',
  'd3': 'd3',
  'd3.js': 'd3',
  'axios': 'axios',
  'chart': 'chart.js',
  'chart.js': 'chart.js'
};

async function getLatestVersion(libraryName) {
  const normalizedName = libraryName.toLowerCase();

  // Check cache first (TTL: 1 hour for latest version data)
  const cached = latestVersionCache.get(normalizedName);
  const ONE_HOUR = 60 * 60 * 1000;
  if (cached && (Date.now() - cached.timestamp) < ONE_HOUR) {
    return cached.version;
  }

  // Check storage
  const storageKey = `latest_${normalizedName}`;
  const stored = await chrome.storage.local.get([storageKey]);
  if (stored[storageKey]) {
    const data = stored[storageKey];
    if (Date.now() - data.timestamp < ONE_HOUR) {
      latestVersionCache.set(normalizedName, data);
      return data.version;
    }
  }

  // Map to npm package name
  const packageName = NPM_PACKAGE_MAP[normalizedName];
  if (!packageName) {
    console.log(`No npm mapping for ${libraryName}`);
    return null;
  }

  // Fetch from npm registry with retry logic
  try {
    const url = `${NPM_REGISTRY_BASE}/${packageName}`;
    const response = await fetchWithBackoff(url);

    if (!response.ok) {
      throw new Error(`npm registry returned ${response.status}`);
    }

    const data = await response.json();
    const latestVersion = data['dist-tags']?.latest;

    if (!latestVersion) {
      return null;
    }

    // Cache in memory and storage
    const cacheData = { version: latestVersion, timestamp: Date.now() };
    latestVersionCache.set(normalizedName, cacheData);
    await chrome.storage.local.set({ [storageKey]: cacheData });

    console.log(`Fetched latest version for ${libraryName}: ${latestVersion}`);
    return latestVersion;

  } catch (error) {
    console.error(`Failed to fetch latest version for ${libraryName}:`, error);
    return null;
  }
}

// ===== Initialization =====

chrome.runtime.onInstalled.addListener(async () => {
  console.log('Vibe Vulnerability Scanner installed');
  await fetchKEVCatalog();
  await setupKEVRefresh();
});

// On service worker startup, ensure alarm is set and fetch if needed
(async () => {
  await setupKEVRefresh();

  // Fetch KEV on startup if cache is stale
  const stored = await chrome.storage.local.get(['kevLastUpdated']);
  const ONE_HOUR = 60 * 60 * 1000;
  if (!stored.kevLastUpdated || (Date.now() - stored.kevLastUpdated) > ONE_HOUR) {
    await fetchKEVCatalog();
  }
})();
