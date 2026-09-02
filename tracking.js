(function () {
  const STORAGE_KEY = 'luubut_visitor_id';
  const SESSION_KEY = 'luubut_session_id';
  const SESSION_TTL_MS = 30 * 60 * 1000;

  function safeString(value, fallback = '') {
    if (typeof value !== 'string') {
      return fallback;
    }
    return value.trim() || fallback;
  }

  function safeStorageGet(storage, key) {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }

  function safeStorageSet(storage, key, value) {
    try {
      storage.setItem(key, value);
    } catch {
      // Ignore storage restrictions; analytics must never break the page.
    }
  }

  function getVisitorId() {
    let visitorId = safeStorageGet(window.localStorage, STORAGE_KEY);
    if (!visitorId) {
      visitorId = 'visitor_' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
      safeStorageSet(window.localStorage, STORAGE_KEY, visitorId);
    }
    return visitorId;
  }

  function getSessionId() {
    const now = Date.now();
    let sessionId = safeStorageGet(window.sessionStorage, SESSION_KEY);
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).slice(2, 12) + now.toString(36);
      safeStorageSet(window.sessionStorage, SESSION_KEY, JSON.stringify({ id: sessionId, createdAt: now }));
      return sessionId;
    }

    try {
      const item = JSON.parse(sessionId);
      if (item && item.id && now - Number(item.createdAt || 0) < SESSION_TTL_MS) {
        return item.id;
      }
    } catch {
      // ignore corrupted session data and regenerate
    }

    const nextSessionId = 'session_' + Math.random().toString(36).slice(2, 12) + now.toString(36);
    safeStorageSet(window.sessionStorage, SESSION_KEY, JSON.stringify({ id: nextSessionId, createdAt: now }));
    return nextSessionId;
  }

  function getDeviceType() {
    const width = window.innerWidth || 0;
    if (width <= 480) return 'mobile';
    if (width <= 900) return 'tablet';
    return 'desktop';
  }

  function readUtmParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: safeString(params.get('utm_source')),
      utm_medium: safeString(params.get('utm_medium')),
      utm_campaign: safeString(params.get('utm_campaign')),
      utm_content: safeString(params.get('utm_content'))
    };
  }

  const utmState = readUtmParams();

  function normalizeMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return {};
    }

    const cleaned = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (key === '__proto__' || key === 'constructor') continue;
      if (typeof value === 'string') {
        cleaned[key] = value.slice(0, 255);
      } else if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  function buildEventPayload(eventName, properties = {}) {
    const metadata = normalizeMetadata(properties.metadata || {});
    const templateId = safeString(properties.template_id || properties.templateId, '');
    const websiteId = safeString(properties.website_id || properties.websiteId, '');

    return {
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      event_name: eventName,
      page_path: safeString(window.location.pathname + window.location.search, '/'),
      page_title: safeString(document.title, ''),
      referrer: safeString(document.referrer, ''),
      device_type: getDeviceType(),
      user_agent: safeString(navigator.userAgent || '', ''),
      utm_source: safeString(utmState.utm_source),
      utm_medium: safeString(utmState.utm_medium),
      utm_campaign: safeString(utmState.utm_campaign),
      utm_content: safeString(utmState.utm_content),
      template_id: templateId,
      website_id: websiteId || null,
      metadata: {
        ...metadata,
        ...(templateId ? { template_id: templateId } : {}),
        ...(websiteId ? { website_id: websiteId } : {})
      }
    };
  }

  function sendPayload(payload) {
    try {
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        const sent = navigator.sendBeacon('/api/track', body);
        if (sent) {
          return;
        }
      }

      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true
      }).catch(() => {});
    } catch {
      // Analytics must never break the page.
    }
  }

  function track(eventName, properties = {}) {
    if (!eventName || typeof eventName !== 'string') {
      return;
    }

    sendPayload(buildEventPayload(eventName, properties));
  }

  window.LuubutAnalytics = {
    track,
    getVisitorId,
    getSessionId
  };

  track('page_view');
})();
