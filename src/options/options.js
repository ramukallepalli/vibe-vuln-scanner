const MASKED_PREFIX = '****';

function maskKey(value) {
  if (!value) return '';
  if (value.length <= 4) return MASKED_PREFIX;
  return MASKED_PREFIX + value.slice(-4);
}

function isMasked(value) {
  return value.startsWith(MASKED_PREFIX);
}

function updateBadge(badgeId, hasValue) {
  const badge = document.getElementById(badgeId);
  if (!badge) return;
  if (hasValue) {
    badge.textContent = 'Connected';
    badge.classList.add('connected');
  } else {
    badge.textContent = 'Not set';
    badge.classList.remove('connected');
  }
}

function updateCounts() {
  const domainVal = document.getElementById('suppressed-domains').value;
  const domains = domainVal.split('\n').map(s => s.trim()).filter(Boolean);
  const dc = document.getElementById('domain-count');
  if (dc) dc.textContent = domains.length + ' domain' + (domains.length !== 1 ? 's' : '');

  const patternVal = document.getElementById('custom-patterns').value;
  const patterns = patternVal.split('\n').map(s => s.trim()).filter(Boolean);
  const pc = document.getElementById('pattern-count');
  if (pc) pc.textContent = patterns.length + ' pattern' + (patterns.length !== 1 ? 's' : '');
}

function initSeverityPicker(currentValue) {
  const picker = document.getElementById('severity-picker');
  const hidden = document.getElementById('min-severity');
  if (!picker) return;

  picker.querySelectorAll('.sev-btn').forEach(btn => {
    if (btn.dataset.value === (currentValue || 'LOW')) btn.classList.add('selected');
    btn.addEventListener('click', () => {
      picker.querySelectorAll('.sev-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      hidden.value = btn.dataset.value;
    });
  });
}

function initSidebarNav() {
  const links = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.card');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(l => {
          l.classList.toggle('active', l.dataset.section === id);
        });
      }
    });
  }, { threshold: 0.5 });

  sections.forEach(s => observer.observe(s));

  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById(link.dataset.section);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
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

  let storedSettings = {};

  initSidebarNav();

  // Live counts
  document.getElementById('suppressed-domains').addEventListener('input', updateCounts);
  document.getElementById('custom-patterns').addEventListener('input', updateCounts);

  // Load settings
  chrome.storage.sync.get(Object.keys(fieldIds), settings => {
    storedSettings = settings;

    // API key fields
    ['anthropicApiKey', 'githubToken', 'nvdApiKey'].forEach(key => {
      const el = document.getElementById(fieldIds[key]);
      if (settings[key]) el.value = maskKey(settings[key]);
    });
    updateBadge('anthropic-badge', !!settings.anthropicApiKey);
    updateBadge('github-badge', !!settings.githubToken);
    updateBadge('nvd-badge', !!settings.nvdApiKey);

    // LLM toggle
    document.getElementById('llm-enabled').checked = !!settings.llmEnabled;

    // Severity picker
    initSeverityPicker(settings.minSeverity);

    // Textareas
    document.getElementById('suppressed-domains').value = Array.isArray(settings.suppressedDomains)
      ? settings.suppressedDomains.join('\n') : (settings.suppressedDomains || '');
    document.getElementById('custom-patterns').value = Array.isArray(settings.customPatterns)
      ? settings.customPatterns.join('\n') : (settings.customPatterns || '');

    // Webhook
    document.getElementById('webhook-url').value = settings.webhookUrl || '';

    updateCounts();
  });

  // Reveal / hide buttons
  document.querySelectorAll('.btn-reveal').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const settingKey = Object.keys(fieldIds).find(k => fieldIds[k] === btn.dataset.target);
      if (input.type === 'password') {
        if (isMasked(input.value)) input.value = storedSettings[settingKey] || '';
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        if (input.value === (storedSettings[settingKey] || '')) input.value = maskKey(input.value);
        input.type = 'password';
        btn.textContent = '👁';
      }
    });
  });

  // Input change: update badge live
  ['anthropic-key', 'github-token', 'nvd-key'].forEach((id, i) => {
    const badgeId = ['anthropic-badge', 'github-badge', 'nvd-badge'][i];
    document.getElementById(id).addEventListener('input', e => {
      updateBadge(badgeId, e.target.value.length > 0);
    });
  });

  // Save
  const saveBtn = document.getElementById('save-btn');
  const statusEl = document.getElementById('status');

  saveBtn.addEventListener('click', () => {
    saveBtn.disabled = true;
    statusEl.textContent = '';
    statusEl.className = 'status';

    const resolve = (key, id) => {
      const val = document.getElementById(id).value;
      return isMasked(val) ? (storedSettings[key] || '') : val;
    };

    const suppressedDomains = document.getElementById('suppressed-domains').value
      .split('\n').map(s => s.trim()).filter(Boolean);
    const customPatterns = document.getElementById('custom-patterns').value
      .split('\n').map(s => s.trim()).filter(Boolean);

    const newSettings = {
      anthropicApiKey: resolve('anthropicApiKey', 'anthropic-key'),
      githubToken:     resolve('githubToken', 'github-token'),
      nvdApiKey:       resolve('nvdApiKey', 'nvd-key'),
      llmEnabled:      document.getElementById('llm-enabled').checked,
      minSeverity:     document.getElementById('min-severity').value,
      suppressedDomains,
      customPatterns,
      webhookUrl:      document.getElementById('webhook-url').value.trim()
    };

    chrome.storage.sync.set(newSettings, () => {
      storedSettings = { ...newSettings };

      // Re-mask visible keys
      ['anthropicApiKey', 'githubToken', 'nvdApiKey'].forEach(key => {
        const input = document.getElementById(fieldIds[key]);
        if (input.type === 'password' && newSettings[key]) input.value = maskKey(newSettings[key]);
      });
      updateBadge('anthropic-badge', !!newSettings.anthropicApiKey);
      updateBadge('github-badge', !!newSettings.githubToken);
      updateBadge('nvd-badge', !!newSettings.nvdApiKey);

      statusEl.textContent = '✓ Settings saved';
      statusEl.className = 'status';
      saveBtn.disabled = false;
      setTimeout(() => { statusEl.textContent = ''; }, 2500);
    });
  });
});
