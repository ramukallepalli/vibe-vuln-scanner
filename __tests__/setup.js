// Mock Chrome Extension APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn((message, callback) => {
      if (callback) callback({ success: true });
      return Promise.resolve({ success: true });
    }),
    lastError: null,
    onMessage: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    }
  },
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        if (callback) callback({});
        return Promise.resolve({});
      }),
      set: jest.fn((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
      remove: jest.fn((keys, callback) => {
        if (callback) callback();
        return Promise.resolve();
      })
    },
    sync: {
      get: jest.fn((keys, callback) => {
        if (callback) callback({});
        return Promise.resolve({});
      }),
      set: jest.fn((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      })
    }
  },
  tabs: {
    query: jest.fn((queryInfo, callback) => {
      const tabs = [{ id: 1, url: 'https://example.com' }];
      if (callback) callback(tabs);
      return Promise.resolve(tabs);
    }),
    onRemoved: {
      addListener: jest.fn()
    },
    onUpdated: {
      addListener: jest.fn()
    }
  },
  alarms: {
    create: jest.fn(),
    clear: jest.fn(() => Promise.resolve()),
    onAlarm: {
      addListener: jest.fn()
    }
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn()
  },
  cookies: {
    getAll: jest.fn((details, callback) => {
      if (callback) callback([]);
      return Promise.resolve([]);
    })
  },
  downloads: {
    download: jest.fn()
  },
  webRequest: {
    onHeadersReceived: {
      addListener: jest.fn()
    }
  }
};

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  })
);

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();

  // Re-apply fetch mock after clearAllMocks resets implementations
  global.fetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({})
  });

  // Re-apply storage.local.get mock
  chrome.storage.local.get.mockImplementation((keys, callback) => {
    if (callback) callback({});
    return Promise.resolve({});
  });

  // Re-apply storage.local.set mock
  chrome.storage.local.set.mockImplementation((items, callback) => {
    if (callback) callback();
    return Promise.resolve();
  });

  // Re-apply alarms.clear mock
  chrome.alarms.clear.mockResolvedValue(undefined);
});
