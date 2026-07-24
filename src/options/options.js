/* global chrome */

const MASKED_PREFIX = '****';

function maskKey(value) {
  if (!value) return '';
  if (value.length <= 4) return MASKED_PREFIX;
  return MASKED_PREFIX + value.slice(-4);
}

function isMasked(value) {
  return value.startsWith(MASKED_PREFIX);
}

document.addEventListener('DOMContentLoaded', () => {
  const fieldIds = {
    anthropicApiKey: 'anthropic-key',
    githubToken: 'github-token',
    nvdApiKey: 'nvd-key',
    llmEnabled: 'llm-enabled',
    minSeverity: 'min-severity',
    suppressedDomains: 'suppressed-domains',
    customPatterns: 'custom-patterns',
    webhookUrl: 'webhook-url'
  };

  // Store the actual values from storage for comparison on save
  let storedSettings = {};

  // Load settings from chrome.storage.sync
  chrome.storage.sync.get(
    Object.keys(fieldIds),
    (settings) => {
      storedSettings = settings;

      // Populate API key fields with masked values
      const apiKeyFields = ['anthropicApiKey', 'githubToken', 'nvdApiKey'];
      apiKeyFields.forEach((key) => {
        const el = document.getElementById(fieldIds[key]);
        if (settings[key]) {
          el.value = maskKey(settings[key]);
        }
      });

      // Populate checkbox
      document.getElementById(fieldIds.llmEnabled).checked = !!settings.llmEnabled;

      // Populate select
      const minSev = document.getElementById(fieldIds.minSeverity);
      if (settings.minSeverity) {
        minSev.value = settings.minSeverity;
      }

      // Populate textareas (arrays joined with newline)
      const suppressedEl = document.getElementById(fieldIds.suppressedDomains);
      suppressedEl.value = Array.isArray(settings.suppressedDomains)
        ? settings.suppressedDomains.join('\n')
        : (settings.suppressedDomains || '');

      const patternsEl = document.getElementById(fieldIds.customPatterns);
      patternsEl.value = Array.isArray(settings.customPatterns)
        ? settings.customPatterns.join('\n')
        : (settings.customPatterns || '');

      // Populate webhook URL
      document.getElementById(fieldIds.webhookUrl).value = settings.webhookUrl || '';
    }
  );

  // Show/Hide toggle buttons
  document.querySelectorAll('.btn-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      const settingKey = Object.keys(fieldIds).find((k) => fieldIds[k] === targetId);

      if (input.type === 'password') {
        // Reveal: show the actual stored value (or current typed value if not masked)
        const currentVal = input.value;
        if (isMasked(currentVal)) {
          // Replace with actual stored value
          input.value = storedSettings[settingKey] || '';
        }
        input.type = 'text';
        btn.textContent = 'Hide';
      } else {
        // Mask again
        const currentVal = input.value;
        // If user did not change from stored value, re-mask it
        if (currentVal === (storedSettings[settingKey] || '')) {
          input.value = maskKey(currentVal);
        }
        input.type = 'password';
        btn.textContent = 'Show';
      }
    });
  });

  // Save button
  document.getElementById('save-btn').addEventListener('click', () => {
    const apiKeyFields = {
      anthropicApiKey: document.getElementById(fieldIds.anthropicApiKey).value,
      githubToken: document.getElementById(fieldIds.githubToken).value,
      nvdApiKey: document.getElementById(fieldIds.nvdApiKey).value
    };

    // For password fields: keep existing value if unchanged (still masked or same as stored)
    const resolvedKeys = {};
    Object.keys(apiKeyFields).forEach((key) => {
      const val = apiKeyFields[key];
      if (isMasked(val)) {
        // User left it masked — keep the existing stored value
        resolvedKeys[key] = storedSettings[key] || '';
      } else {
        resolvedKeys[key] = val;
      }
    });

    // Parse textareas: split on newlines, filter empty lines
    const suppressedRaw = document.getElementById(fieldIds.suppressedDomains).value;
    const suppressedDomains = suppressedRaw
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const patternsRaw = document.getElementById(fieldIds.customPatterns).value;
    const customPatterns = patternsRaw
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const newSettings = {
      anthropicApiKey: resolvedKeys.anthropicApiKey,
      githubToken: resolvedKeys.githubToken,
      nvdApiKey: resolvedKeys.nvdApiKey,
      llmEnabled: document.getElementById(fieldIds.llmEnabled).checked,
      minSeverity: document.getElementById(fieldIds.minSeverity).value,
      suppressedDomains,
      customPatterns,
      webhookUrl: document.getElementById(fieldIds.webhookUrl).value.trim()
    };

    chrome.storage.sync.set(newSettings, () => {
      // Update storedSettings so subsequent Show/Hide works correctly
      storedSettings = { ...newSettings };

      // Re-mask password fields after saving
      const apiKeyFieldIds = ['anthropicApiKey', 'githubToken', 'nvdApiKey'];
      apiKeyFieldIds.forEach((key) => {
        const input = document.getElementById(fieldIds[key]);
        if (input.type === 'password') {
          if (newSettings[key]) {
            input.value = maskKey(newSettings[key]);
          }
        } else {
          // If currently visible, leave as-is but show actual stored value
          input.value = newSettings[key] || '';
        }
      });

      const statusEl = document.getElementById('status');
      statusEl.textContent = 'Settings saved!';
      setTimeout(() => {
        statusEl.textContent = '';
      }, 2000);
    });
  });
});
