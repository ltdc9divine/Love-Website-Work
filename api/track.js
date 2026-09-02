const { supabaseRequest } = require('./lib/supabase');

const VALID_EVENT_NAMES = new Set([
  'page_view',
  'view_template',
  'click_buy',
  'start_create',
  'submit_order',
  'payment_check_started',
  'payment_check_failed',
  'payment_success',
  'website_created'
]);

const MAX_TEXT_LENGTH = 512;
const MAX_METADATA_KEYS = 25;

function sanitizeText(value, maxLength = MAX_TEXT_LENGTH) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  return text.slice(0, maxLength);
}

function parseJsonBody(body) {
  if (body == null) {
    return {};
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      throw new Error('Request body must be valid JSON.');
    }
  }

  if (typeof body === 'object') {
    return body;
  }

  throw new Error('Request body must be a JSON object.');
}

function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeMetadata(rawMetadata) {
  if (!rawMetadata || typeof rawMetadata !== 'object' || Array.isArray(rawMetadata)) {
    return {};
  }

  const normalized = {};
  let count = 0;

  for (const [key, value] of Object.entries(rawMetadata)) {
    if (count >= MAX_METADATA_KEYS) {
      break;
    }

    if (key === '__proto__' || key === 'constructor') {
      continue;
    }

    if (typeof value === 'string') {
      normalized[key] = sanitizeText(value, 255) || '';
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      normalized[key] = value;
    } else if (value === null) {
      normalized[key] = null;
    } else if (value && typeof value === 'object') {
      normalized[key] = JSON.parse(JSON.stringify(value));
    }
    count += 1;
  }

  return normalized;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  try {
    const payload = parseJsonBody(req.body);
    const eventName = sanitizeText(payload.event_name, 120);

    if (!eventName || !VALID_EVENT_NAMES.has(eventName)) {
      return res.status(400).json({ success: false, error: 'Valid event_name is required.' });
    }

    const visitorId = sanitizeText(payload.visitor_id, 128) || 'anonymous';
    const sessionId = sanitizeText(payload.session_id, 128);
    const pagePath = sanitizeText(payload.page_path, 255);
    const pageTitle = sanitizeText(payload.page_title, 255);
    const referrer = sanitizeText(payload.referrer, 255);
    const deviceType = sanitizeText(payload.device_type, 64);
    const userAgent = sanitizeText(payload.user_agent, 512);
    const utmSource = sanitizeText(payload.utm_source, 128);
    const utmMedium = sanitizeText(payload.utm_medium, 128);
    const utmCampaign = sanitizeText(payload.utm_campaign, 128);
    const utmContent = sanitizeText(payload.utm_content, 128);
    const templateId = sanitizeText(payload.template_id, 128);
    const websiteId = payload.website_id && isUuid(payload.website_id) ? payload.website_id : null;
    const metadata = normalizeMetadata(payload.metadata || {});

    const row = {
      visitor_id: visitorId,
      session_id: sessionId,
      event_name: eventName,
      page_path: pagePath,
      page_title: pageTitle,
      referrer: referrer,
      device_type: deviceType,
      user_agent: userAgent,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
      template_id: templateId,
      website_id: websiteId,
      metadata
    };

    await supabaseRequest({
      path: '/rest/v1/analytics_events',
      method: 'POST',
      body: [row]
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    const statusCode = Number(error && error.statusCode) || 500;
    return res.status(statusCode).json({
      success: false,
      error: error && error.message ? error.message : 'Internal server error.'
    });
  }
};
