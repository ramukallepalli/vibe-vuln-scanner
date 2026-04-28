/**
 * Popup UI - safe DOM rendering, proper async scan flow
 */

let currentTab = null;
let currentResults = null;

document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('loading');
  const resultsEl = document.getElementById('results');
  const rescanBtn = document.getElementById('rescan-btn');
  const exportBtn = document.getElementById('export-btn');
  const historyBtn = document.getElementById('history-btn');
  const exportMenu = document.getElementById('export-menu');
  const exportJsonBtn = document.getElementById('export-json');
  const exportCsvBtn = document.getElementById('export-csv');
  const historyPanel = document.getElementById('history-panel');
  const closeHistoryBtn = document.getElementById('close-history');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      throw new Error('No active tab');
    }

    currentTab = tab;

    // Try to get existing results first
    const existingResults = await getResults(tab.id, tab.url);

    if (existingResults && existingResults.vulnerabilities) {
      loadingEl.style.display = 'none';
      currentResults = existingResults;
      displayResults(existingResults);
      resultsEl.style.display = 'block';
    } else {
      // No results, trigger scan
      await triggerScan(tab.id);
    }

    // Rescan button
    rescanBtn.addEventListener('click', async () => {
      resultsEl.style.display = 'none';
      loadingEl.style.display = 'block';
      exportMenu.style.display = 'none';
      historyPanel.style.display = 'none';
      await triggerScan(tab.id);
    });

    // Export button - toggle menu
    exportBtn.addEventListener('click', () => {
      const isVisible = exportMenu.style.display === 'block';
      exportMenu.style.display = isVisible ? 'none' : 'block';
      historyPanel.style.display = 'none';
    });

    // Export as JSON
    exportJsonBtn.addEventListener('click', () => {
      exportAsJSON();
      exportMenu.style.display = 'none';
    });

    // Export as CSV
    exportCsvBtn.addEventListener('click', () => {
      exportAsCSV();
      exportMenu.style.display = 'none';
    });

    // History button
    historyBtn.addEventListener('click', async () => {
      const isVisible = historyPanel.style.display === 'block';
      if (isVisible) {
        historyPanel.style.display = 'none';
      } else {
        exportMenu.style.display = 'none';
        await loadHistory();
        historyPanel.style.display = 'block';
      }
    });

    // Close history button
    closeHistoryBtn.addEventListener('click', () => {
      historyPanel.style.display = 'none';
    });

  } catch (error) {
    console.error('Popup error:', error);
    loadingEl.style.display = 'none';
    showError(error.message);
  }
});

async function getResults(tabId, url) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: 'getResults', tabId, url },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('getResults error:', chrome.runtime.lastError);
          resolve(null);
        } else {
          resolve(response);
        }
      }
    );
  });
}

async function triggerScan(tabId) {
  try {
    // Send scan request to content script
    const response = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { action: 'startScan' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });

    if (!response || !response.success) {
      throw new Error('Scan failed');
    }

    // Wait for scan to complete by polling results
    await waitForScanResults(tabId);

  } catch (error) {
    console.error('Scan trigger error:', error);
    document.getElementById('loading').style.display = 'none';
    showError('Could not scan page. Make sure the page is fully loaded.');
  }
}

async function waitForScanResults(tabId) {
  const maxAttempts = 10;
  const pollInterval = 300;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    const results = await getResults(tabId, currentTab.url);

    if (results && results.vulnerabilities) {
      document.getElementById('loading').style.display = 'none';
      currentResults = results;
      displayResults(results);
      document.getElementById('results').style.display = 'block';
      return;
    }
  }

  throw new Error('Scan timeout');
}

function displayResults(data) {
  const { vulnerabilities } = data;

  // Count by severity
  const counts = {
    total: vulnerabilities.length,
    critical: vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
    high: vulnerabilities.filter(v => v.severity === 'HIGH').length,
    medium: vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
    low: vulnerabilities.filter(v => v.severity === 'LOW').length
  };

  // Update summary using textContent (safe)
  setText('total-vulns', counts.total);
  setText('critical-count', counts.critical);
  setText('high-count', counts.high);
  setText('medium-count', counts.medium);

  // Render vulnerability list using safe DOM construction
  const listEl = document.getElementById('vulnerabilities-list');
  while (listEl.firstChild) {
    listEl.removeChild(listEl.firstChild);
  }

  if (vulnerabilities.length === 0) {
    const noVulnsDiv = createEl('div', { className: 'no-vulns' });
    noVulnsDiv.textContent = '✓ No issues detected';
    listEl.appendChild(noVulnsDiv);
  } else {
    vulnerabilities.forEach(vuln => {
      const vulnItem = renderVulnerability(vuln);
      listEl.appendChild(vulnItem);
    });
  }
}

function renderVulnerability(vuln) {
  const vulnItem = createEl('div', { className: `vuln-item ${vuln.severity.toLowerCase()}` });

  // Header
  const header = createEl('div', { className: 'vuln-header' });

  const typeSpan = createEl('span', { className: 'vuln-type' });
  typeSpan.textContent = vuln.title || formatType(vuln.type);
  header.appendChild(typeSpan);

  const severitySpan = createEl('span', { className: `vuln-severity ${vuln.severity.toLowerCase()}` });
  severitySpan.textContent = vuln.severity;
  header.appendChild(severitySpan);

  vulnItem.appendChild(header);

  // Confidence badge
  if (vuln.confidence && vuln.confidence !== 'high') {
    const confidenceBadge = createEl('div', { className: 'confidence-badge' });
    confidenceBadge.textContent = `Confidence: ${vuln.confidence}`;
    vulnItem.appendChild(confidenceBadge);
  }

  // Description
  const descDiv = createEl('div', { className: 'vuln-description' });
  descDiv.textContent = vuln.description;
  vulnItem.appendChild(descDiv);

  // Evidence details
  if (vuln.evidence && Object.keys(vuln.evidence).length > 0) {
    const detailsDiv = createEl('div', { className: 'vuln-details' });

    for (const [key, value] of Object.entries(vuln.evidence)) {
      if (value !== null && value !== undefined) {
        const detailItem = createEl('div', { className: 'vuln-detail-item' });

        const strong = createEl('strong');
        strong.textContent = formatKey(key) + ': ';
        detailItem.appendChild(strong);

        const valueSpan = createEl('span');
        valueSpan.textContent = String(value);
        detailItem.appendChild(valueSpan);

        detailsDiv.appendChild(detailItem);
      }
    }

    vulnItem.appendChild(detailsDiv);
  }

  // Remediation
  if (vuln.remediation) {
    const remDiv = createEl('div', { className: 'vuln-remediation' });

    const remLabel = createEl('strong');
    remLabel.textContent = 'Remediation: ';
    remDiv.appendChild(remLabel);

    const remText = createEl('span');
    remText.textContent = vuln.remediation;
    remDiv.appendChild(remText);

    vulnItem.appendChild(remDiv);
  }

  return vulnItem;
}

function createEl(tag, attrs = {}) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else {
      el.setAttribute(key, value);
    }
  }
  return el;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = String(text);
  }
}

function showError(message) {
  const errorEl = document.getElementById('error');
  errorEl.style.display = 'block';
  const p = errorEl.querySelector('p');
  if (p) {
    p.textContent = message;
  }
}

function formatType(type) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatKey(key) {
  return key.replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ');
}

// ===== Export Functionality =====

function exportAsJSON() {
  if (!currentResults) {
    showError('No scan results to export');
    return;
  }

  const exportData = {
    extensionVersion: '1.2.0',
    exportTimestamp: new Date().toISOString(),
    scanTimestamp: new Date(currentResults.timestamp).toISOString(),
    url: currentResults.url,
    summary: {
      total: currentResults.vulnerabilities.length,
      critical: currentResults.vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
      high: currentResults.vulnerabilities.filter(v => v.severity === 'HIGH').length,
      medium: currentResults.vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
      low: currentResults.vulnerabilities.filter(v => v.severity === 'LOW').length
    },
    vulnerabilities: currentResults.vulnerabilities
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const domain = extractDomainForFilename(currentResults.url);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `vuln-scan-${domain}-${timestamp}.json`;

  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      console.error('Download error:', chrome.runtime.lastError);
      showError('Export failed');
    } else {
      console.log('Export successful:', downloadId);
    }
    URL.revokeObjectURL(url);
  });
}

function exportAsCSV() {
  if (!currentResults) {
    showError('No scan results to export');
    return;
  }

  const headers = ['Severity', 'Confidence', 'Type', 'Title', 'Description', 'Remediation', 'Evidence'];
  const rows = [headers];

  currentResults.vulnerabilities.forEach(vuln => {
    const evidenceStr = vuln.evidence ? JSON.stringify(vuln.evidence) : '';
    const row = [
      vuln.severity || '',
      vuln.confidence || '',
      vuln.type || '',
      vuln.title || formatType(vuln.type),
      (vuln.description || '').replace(/"/g, '""'),
      (vuln.remediation || '').replace(/"/g, '""'),
      evidenceStr.replace(/"/g, '""')
    ];
    rows.push(row);
  });

  const csvContent = rows.map(row =>
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const domain = extractDomainForFilename(currentResults.url);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `vuln-scan-${domain}-${timestamp}.csv`;

  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      console.error('Download error:', chrome.runtime.lastError);
      showError('Export failed');
    } else {
      console.log('Export successful:', downloadId);
    }
    URL.revokeObjectURL(url);
  });
}

function extractDomainForFilename(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/[^a-z0-9.-]/gi, '_');
  } catch {
    return 'unknown';
  }
}

// ===== History Functionality =====

async function loadHistory() {
  if (!currentTab) return;

  const response = await new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: 'getScanHistory', url: currentTab.url },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('History error:', chrome.runtime.lastError);
          resolve({ history: [] });
        } else {
          resolve(response);
        }
      }
    );
  });

  const history = response.history || [];
  const historyList = document.getElementById('history-list');

  // Clear existing items
  while (historyList.firstChild) {
    historyList.removeChild(historyList.firstChild);
  }

  if (history.length === 0) {
    const emptyMsg = createEl('div', { className: 'history-item' });
    emptyMsg.textContent = 'No scan history for this domain';
    emptyMsg.style.cursor = 'default';
    historyList.appendChild(emptyMsg);
    return;
  }

  history.forEach(scan => {
    const item = createEl('div', { className: 'history-item' });

    const dateDiv = createEl('div', { className: 'history-date' });
    dateDiv.textContent = new Date(scan.timestamp).toLocaleString();
    item.appendChild(dateDiv);

    const summaryDiv = createEl('div', { className: 'history-summary' });
    summaryDiv.textContent = `Total: ${scan.summary.total} | `;

    if (scan.summary.critical > 0) {
      const critSpan = createEl('span', { className: 'history-severity critical' });
      critSpan.textContent = `CRIT: ${scan.summary.critical}`;
      summaryDiv.appendChild(critSpan);
      summaryDiv.appendChild(document.createTextNode(' | '));
    }

    if (scan.summary.high > 0) {
      const highSpan = createEl('span', { className: 'history-severity high' });
      highSpan.textContent = `HIGH: ${scan.summary.high}`;
      summaryDiv.appendChild(highSpan);
      summaryDiv.appendChild(document.createTextNode(' | '));
    }

    if (scan.summary.medium > 0) {
      const medSpan = createEl('span', { className: 'history-severity medium' });
      medSpan.textContent = `MED: ${scan.summary.medium}`;
      summaryDiv.appendChild(medSpan);
    }

    item.appendChild(summaryDiv);

    // Click to load this scan
    item.addEventListener('click', () => {
      currentResults = scan;
      displayResults(scan);
      document.getElementById('history-panel').style.display = 'none';
    });

    historyList.appendChild(item);
  });
}
