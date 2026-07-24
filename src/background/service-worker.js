/**
 * Background service worker
 * Manages KEV catalog, scan results, and badge updates
 */

const CISA_KEV_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
const NVD_API_BASE = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const NPM_REGISTRY_BASE = 'https://registry.npmjs.org';
const KEV_REFRESH_ALARM = 'kevRefreshAlarm';
const KEV_REFRESH_INTERVAL = 6 * 60; // 6 hours in minutes

var OSV_API_BASE = "https://api.osv.dev/v1";
var GITHUB_ADVISORY_BASE = "https://api.github.com/advisories";
var settingsCache = null;
var settingsCacheTime = 0;

// In-memory scan results: Map<tabId, Map<sessionId, result>>
const scanResults = new Map();

// CVE details cache: Map<cveId, cveDetails>
const cveCache = new Map();

// Latest version cache: Map<libraryName, {version, timestamp}>
const latestVersionCache = new Map();

// Security headers cache: Map<tabId, headers>
const capturedHeaders = new Map();

async function getSettings() {
  if (settingsCache && (Date.now() - settingsCacheTime) < 60000) return settingsCache;
  var stored = await chrome.storage.sync.get(["anthropicApiKey","githubToken","nvdApiKey","llmEnabled","minSeverity","suppressedDomains","customPatterns","webhookUrl"]);
  settingsCache = { anthropicApiKey: stored.anthropicApiKey || null, githubToken: stored.githubToken || null, nvdApiKey: stored.nvdApiKey || null, llmEnabled: stored.llmEnabled || false, minSeverity: stored.minSeverity || "LOW", suppressedDomains: stored.suppressedDomains || [], customPatterns: stored.customPatterns || [], webhookUrl: stored.webhookUrl || null };
  settingsCacheTime = Date.now();
  return settingsCache;
}

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

async function queryOSVDev(packageName, version) {
  var cacheKey = "osv_" + packageName + "_" + version;
  var cached = cveCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < 1800000) return cached.data;
  try {
    var body = JSON.stringify({ version: version, package: { name: packageName, ecosystem: "npm" } });
    var resp = await fetchWithBackoff(OSV_API_BASE + "/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: body });
    if (!resp.ok) throw new Error("OSV " + resp.status);
    var data = await resp.json();
    var vulns = (data.vulns || []).map(function(v) {
      var affectsVersion = false, fixedVersion = null;
      (v.affected || []).forEach(function(a) {
        if (a.versions && a.versions.includes(version)) affectsVersion = true;
        (a.ranges || []).forEach(function(r) {
          if (r.type !== "ECOSYSTEM") return;
          var introduced = null, fixed = null;
          (r.events || []).forEach(function(e) { if (e.introduced) introduced = e.introduced; if (e.fixed) fixed = e.fixed; });
          if (introduced !== null) { affectsVersion = true; if (fixed) fixedVersion = fixed; }
        });
      });
      var sev = "MEDIUM";
      var cvss = v.severity && v.severity[0];
      if (cvss) { var score = parseFloat(cvss.score)||0; sev = score>=9?"CRITICAL":score>=7?"HIGH":score>=4?"MEDIUM":"LOW"; }
      return { id: v.id, summary: v.summary || "", severity: sev, aliases: v.aliases||[], fixedVersion: fixedVersion, affectsVersion: affectsVersion };
    });
    cveCache.set(cacheKey, { data: vulns, timestamp: Date.now() });
    return vulns;
  } catch(e) { console.error("OSV query failed:", e); return []; }
}

async function queryGitHubAdvisories(packageName, version) {
  var settings = await getSettings();
  var headers = { "Accept": "application/vnd.github+json" };
  if (settings.githubToken) headers["Authorization"] = "Bearer " + settings.githubToken;
  try {
    var url = GITHUB_ADVISORY_BASE + "?type=reviewed&ecosystem=npm&affects=" + encodeURIComponent(packageName) + "&per_page=20";
    var resp = await fetchWithBackoff(url, { headers: headers });
    if (!resp.ok) return [];
    var advisories = await resp.json();
    return (advisories||[]).map(function(a) {
      var vuln = (a.vulnerabilities||[]).find(function(v){ return v.package && v.package.ecosystem==="npm" && v.package.name===packageName; });
      return { ghsaId: a.ghsa_id, severity: (a.severity||"UNKNOWN").toUpperCase(), summary: a.summary||"", fixedVersion: vuln && vuln.patched_versions ? vuln.patched_versions.replace(/[>=<^~]/g,"").split(",")[0].trim() : null };
    });
  } catch(e) { return []; }
}

var TOP_NPM_PACKAGES = ["lodash","react","vue","angular","jquery","axios","moment","express","typescript","webpack","eslint","prettier","jest","mocha","chai","redux","mobx","rxjs","socket.io","async","underscore","cheerio","request","uuid","d3","three","chart.js","bootstrap","tailwindcss","classnames","styled-components","next","nuxt","gatsby","svelte","backbone","ember","mongoose","sequelize","knex","typeorm","prisma","firebase","passport","jsonwebtoken","bcrypt","helmet","cors","marked","dompurify","sanitize-html","xss","validator","joi","ajv","date-fns","luxon","dayjs","ramda","immer","zustand","pinia","vuex","handlebars","mustache","pug","ejs","highlight.js","prismjs","codemirror","dotenv","chalk","commander","yargs","minimist","cross-fetch","node-fetch","got"];

function levenshtein(a, b) {
  var dp = [];
  for (let i = 0; i <= a.length; i++) { dp[i] = [i]; }
  for (let j = 0; j <= b.length; j++) { dp[0][j] = j; }
  for (let r = 1; r <= a.length; r++) {
    for (let c = 1; c <= b.length; c++) {
      dp[r][c] = a[r-1]===b[c-1] ? dp[r-1][c-1] : 1 + Math.min(dp[r-1][c], dp[r][c-1], dp[r-1][c-1]);
    }
  }
  return dp[a.length][b.length];
}

function checkTyposquatting(packageName) {
  var name = packageName.toLowerCase().replace(/^@[^/]+\//, "");
  if (TOP_NPM_PACKAGES.includes(name)) return { isTyposquat: false, similarTo: null, distance: 0 };
  var closest = null, minDist = Infinity;
  for (var i = 0; i < TOP_NPM_PACKAGES.length; i++) {
    var pkg = TOP_NPM_PACKAGES[i];
    if (Math.abs(name.length - pkg.length) > 3) continue;
    var dist = levenshtein(name, pkg);
    if (dist < minDist && dist <= 2) { minDist = dist; closest = pkg; }
  }
  return { isTyposquat: closest !== null, similarTo: closest, distance: minDist === Infinity ? 999 : minDist };
}

async function analyzeWithLLM(analysisType, context, finding) {
  var settings = await getSettings();
  if (!settings.llmEnabled || !settings.anthropicApiKey) return { result: null, confidence: null, isRealIssue: null };
  var prompt = "";
  if (analysisType === "xss-taint") {
    prompt = "Does user-controlled input reach the dangerous JavaScript sink in this code? Answer REAL or SAFE then explain in 1 sentence.\n\n" + context;
  } else if (analysisType === "secret-validate") {
    prompt = "Is this a real credential or a placeholder/example value? Answer REAL or PLACEHOLDER then explain in 1 sentence.\n\n" + context;
  } else if (analysisType === "remediation") {
    prompt = "Give a specific 2-sentence remediation for: " + (finding ? finding.type : "unknown") + " with evidence: " + JSON.stringify(finding ? finding.evidence : {});
  }
  try {
    var resp = await fetchWithBackoff("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": settings.anthropicApiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 256, messages: [{ role: "user", content: prompt }] }) });
    if (!resp.ok) throw new Error("Anthropic " + resp.status);
    var data = await resp.json();
    var text = (data.content && data.content[0] && data.content[0].text) || "";
    var isRealIssue = null;
    if (analysisType === "xss-taint" || analysisType === "secret-validate") isRealIssue = text.trim().toUpperCase().startsWith("REAL");
    return { result: text, confidence: "high", isRealIssue: isRealIssue };
  } catch(e) { return { result: null, confidence: null, isRealIssue: null }; }
}

async function analyzeSourceMap(mapUrl) {
  try {
    var resp = await fetchWithBackoff(mapUrl, {}, 2);
    if (!resp.ok) return { dependencies: [] };
    var text = await resp.text();
    var mapData;
    try { mapData = JSON.parse(text); } catch(e) { return { dependencies: [] }; }
    var dependencies = [], seen = new Set();
    // Extract from embedded sourcesContent
    (mapData.sourcesContent || []).forEach(function(c) {
      if (!c || !c.includes('dependencies')) return;
      try {
        var pkg = JSON.parse(c);
        if (pkg.dependencies) Object.keys(pkg.dependencies).forEach(function(name) {
          var ver = (pkg.dependencies[name] || "").replace(/[^\d.]/g,"");
          var key = name + "@" + ver;
          if (!seen.has(key)) { seen.add(key); dependencies.push({ name: name, version: ver }); }
        });
      } catch(e) { /* ignore malformed sourcesContent */ }
    });
    // Extract package names from source paths
    (mapData.sources || []).forEach(function(src) {
      var m = src.match(/node_modules\/([^/]+)/);
      if (m && !seen.has(m[1])) { seen.add(m[1]); dependencies.push({ name: m[1], version: "unknown" }); }
    });
    return { dependencies: dependencies };
  } catch(e) { return { dependencies: [] }; }
}

async function getCookiesForTab(tabId, url) {
  try {
    if (!chrome.cookies) return [];
    var urlObj = new URL(url);
    var cookies = await chrome.cookies.getAll({ domain: urlObj.hostname });
    return cookies.map(function(c) { return { name: c.name, secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite, session: c.session, domain: c.domain }; });
  } catch(e) { return []; }
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

      case "getOSVVulnerabilities": {
        var osvResults = await queryOSVDev(message.packageName, message.version);
        sendResponse({ results: osvResults });
        break;
      }
      case "getGitHubAdvisories": {
        var ghResults = await queryGitHubAdvisories(message.packageName, message.version);
        sendResponse({ results: ghResults });
        break;
      }
      case "getSettings": {
        var s = await getSettings();
        sendResponse(s);
        break;
      }
      case "saveSettings": {
        await chrome.storage.sync.set(message.settings || {});
        settingsCache = null;
        sendResponse({ success: true });
        break;
      }
      case "analyzeLLM": {
        var llmResult = await analyzeWithLLM(message.analysisType, message.context, message.finding);
        sendResponse(llmResult);
        break;
      }
      case "checkTyposquatting": {
        sendResponse(checkTyposquatting(message.packageName || ""));
        break;
      }
      case "analyzeSourceMap": {
        var smResult2 = await analyzeSourceMap(message.mapUrl);
        sendResponse(smResult2);
        break;
      }
      case "getCookies": {
        var tabId2 = message.tabId || (sender.tab && sender.tab.id);
        var tab2 = tabId2 ? await chrome.tabs.get(tabId2).catch(function(){return null;}) : null;
        var url2 = (tab2 && tab2.url) || "";
        var ck = await getCookiesForTab(tabId2, url2);
        sendResponse({ cookies: ck });
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

  // Fire-and-forget: scan source maps for bundled vulnerable dependencies
  (async function() {
    try {
      if (!chrome.scripting) return;
      var scriptResults = await chrome.scripting.executeScript({ target: { tabId: tabId }, func: function() {
        var maps = [];
        document.querySelectorAll("script:not([src])").forEach(function(s) {
          var m = s.textContent.match(/\/\/# sourceMappingURL=([^\s]+)/);
          if (m) maps.push(m[1]);
        });
        return maps;
      }}).catch(function(){return null;});
      if (!scriptResults || !scriptResults[0] || !scriptResults[0].result || !scriptResults[0].result.length) return;
      var tab3 = await chrome.tabs.get(tabId).catch(function(){return null;});
      if (!tab3) return;
      var mapUrls = scriptResults[0].result.slice(0, 3);
      for (var mi = 0; mi < mapUrls.length; mi++) {
        var mapUrl = mapUrls[mi];
        var fullUrl = mapUrl.startsWith("http") ? mapUrl : new URL(mapUrl, tab3.url).href;
        var smResult = await analyzeSourceMap(fullUrl);
        var knownDeps = smResult.dependencies.filter(function(d){return d.version !== "unknown";}).slice(0, 20);
        var extra = [];
        for (var di = 0; di < knownDeps.length; di++) {
          var dep = knownDeps[di];
          var osvVulns = await queryOSVDev(dep.name, dep.version);
          var affected = osvVulns.filter(function(v){return v.affectsVersion;});
          if (affected.length > 0) {
            extra.push({ id: "sourcemap-" + dep.name + "-" + dep.version, type: "BUNDLED_VULNERABLE_DEPENDENCY", severity: affected[0].severity, confidence: "high", category: "confirmed", title: "Vulnerable Bundled Dep: " + dep.name + " " + dep.version, description: "Source map reveals " + dep.name + "@" + dep.version + " has " + affected.length + " known vulnerability(s).", evidence: { package: dep.name, version: dep.version, osvIds: affected.map(function(v){return v.id;}).join(", ") }, remediation: affected[0].fixedVersion ? "Upgrade " + dep.name + " to " + affected[0].fixedVersion : "Update " + dep.name + " to latest", metadata: {}, timestamp: Date.now() });
          }
        }
        if (extra.length > 0) {
          var sessionData = scanResults.get(tabId);
          var existing = sessionData && sessionData.get(createSessionId(message.url));
          if (existing) { existing.vulnerabilities.push.apply(existing.vulnerabilities, extra); updateBadge(tabId, existing.vulnerabilities.length); }
        }
      }
    } catch(e) { console.error("Source map scan error:", e); }
  })();
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
