const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function loadDotEnvFiles() {
  const candidates = [
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '.env')
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

loadDotEnvFiles();

function getEnv(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function requireSupabaseSettings() {
  const url = getEnv('SUPABASE_URL');
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return { url, key };
}

function buildSupabaseUrl(baseUrl, path) {
  const normalizedBase = String(baseUrl).replace(/\/+$/, '');
  return `${normalizedBase}${path}`;
}

async function supabaseRequest({ path, method = 'GET', body = null, headers = {} }) {
  const { url, key } = requireSupabaseSettings();
  const response = await fetch(buildSupabaseUrl(url, path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=representation',
      ...headers
    },
    body: body == null ? undefined : JSON.stringify(body)
  });

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message = payload && payload.message ? payload.message : `Supabase request failed (${response.status})`;
    const error = new Error(message);
    error.statusCode = response.status;
    throw error;
  }

  return payload;
}

// ---------------------------------------------------------------------------
// Server-side input validation (Phase 5A)
// Machine-readable codes + HTTP 400 for malformed input. No frameworks.
// ---------------------------------------------------------------------------

const MAX_JSON_BODY_CHARS = 1000000; // generous cap; Vercel platform already caps ~4.5MB

const INPUT_LIMITS = {
  name: 60,
  shortMessage: 300,
  loveLetter: 5000,
  finalMessage: 300,
  startDate: 10,
  mediaUrl: 2048,
  photos: 30,
  timelineItemsAbuseCeiling: 50,
  timelineTitle: 120,
  timelineText: 500,
  timelineDate: 32,
  customDataKeys: 25,
  customDataValue: 512,
  customDataJson: 8192,
  qrContent: 512
};

// Per-template product limits (existing client contract in templates/registry.js).
// Other templates intentionally have no product limit; only the abuse ceiling applies.
const TEMPLATE_TIMELINE_LIMITS = {
  'love-50-13': 10,
  'love-50-15': 8
};

function invalidInput(code, message) {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = code;
  return error;
}

function requirePlainObject(value, code, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidInput(code, message);
  }
}

function hasUnsafeKeys(value) {
  return value !== null && typeof value === 'object' && ['__proto__', 'constructor', 'prototype'].some((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function cleanTextField(value, field, max, code) {
  if (value === undefined || value === null) {
    return null; // field absent -> caller decides default
  }
  if (typeof value !== 'string') {
    throw invalidInput(code, field + ' must be a string.');
  }
  const text = value.trim();
  if (text.length > max) {
    throw invalidInput(code, field + ' exceeds the maximum length of ' + max + ' characters.');
  }
  return text;
}

function isDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value + 'T00:00:00').getTime());
}

function firstDefined() {
  for (const value of arguments) {
    if (value !== undefined) {
      return value;
    }
  }
}

function safeMediaUrlValue(value, field) {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value !== 'string') {
    throw invalidInput('INVALID_MEDIA_URL', field + ' must be a string URL.');
  }
  // Remove control characters and whitespace that can hide dangerous protocols.
  const cleaned = value.replace(/[\u0000-\u001f\u007f-\u009f\s]+/g, '');
  if (!cleaned) {
    return '';
  }
  if (cleaned.length > INPUT_LIMITS.mediaUrl) {
    throw invalidInput('INVALID_MEDIA_URL', field + ' exceeds the maximum URL length of ' + INPUT_LIMITS.mediaUrl + ' characters.');
  }
  let parsed = null;
  try {
    parsed = new URL(cleaned);
  } catch {
    throw invalidInput('INVALID_MEDIA_URL', field + ' is not a valid URL.');
  }
  const protocol = parsed.protocol.toLowerCase();
  if (protocol === 'https:' || protocol === 'http:') {
    return parsed.href;
  }
  // data: only for raster/base64 images (never SVG or other payloads).
  if (/^data:image\/(gif|jpe?g|png|webp|avif);base64,[a-z0-9+/=]+$/i.test(cleaned)) {
    return cleaned;
  }
  throw invalidInput('INVALID_MEDIA_URL', field + ' uses an unsupported protocol.');
}

function sanitizeCustomDataValue(value, depth) {
  if (value === null) {
    return null;
  }
  if (typeof value === 'string') {
    if (value.length > INPUT_LIMITS.customDataValue) {
      throw invalidInput('INVALID_CUSTOM_DATA', 'Custom data string values exceed ' + INPUT_LIMITS.customDataValue + ' characters.');
    }
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw invalidInput('INVALID_CUSTOM_DATA', 'Custom data number values must be finite.');
    }
    return value;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (depth >= 2) {
    throw invalidInput('INVALID_CUSTOM_DATA', 'Custom data is nested too deeply.');
  }
  requirePlainObject(value, 'INVALID_CUSTOM_DATA', 'Custom data must contain only primitive or shallow object values.');
  if (hasUnsafeKeys(value)) {
    throw invalidInput('INVALID_CUSTOM_DATA', 'Custom data contains unsupported property names.');
  }
  const sanitized = {};
  for (const [key, item] of Object.entries(value)) {
    sanitized[key] = sanitizeCustomDataValue(item, depth + 1);
  }
  return sanitized;
}

function sanitizeCustomData(rawCustomData, rawQrContent) {
  let base = {};
  if (rawCustomData !== undefined && rawCustomData !== null) {
    requirePlainObject(rawCustomData, 'INVALID_CUSTOM_DATA', 'Custom data must be a JSON object.');
    if (hasUnsafeKeys(rawCustomData)) {
      throw invalidInput('INVALID_CUSTOM_DATA', 'Custom data contains unsupported property names.');
    }
    const entries = Object.entries(rawCustomData);
    if (entries.length > INPUT_LIMITS.customDataKeys) {
      throw invalidInput('INVALID_CUSTOM_DATA', 'Custom data exceeds ' + INPUT_LIMITS.customDataKeys + ' properties.');
    }
    for (const [key, item] of entries) {
      base[key] = sanitizeCustomDataValue(item, 0);
    }
  }

  const serialized = JSON.stringify(base);
  if (serialized && serialized.length > INPUT_LIMITS.customDataJson) {
    throw invalidInput('INVALID_CUSTOM_DATA', 'Custom data exceeds the maximum JSON size of ' + INPUT_LIMITS.customDataJson + ' characters.');
  }

  const qrContent = cleanTextField(rawQrContent !== undefined ? rawQrContent : base.qrContent, 'qrContent', INPUT_LIMITS.qrContent, 'INVALID_QR_CONTENT') || '';

  return {
    ...base,
    qrContent: qrContent
  };
}

function sanitizeTimelineItem(item, index) {
  requirePlainObject(item, 'INVALID_TIMELINE_ITEM', 'Timeline item ' + index + ' must be an object.');
  if (hasUnsafeKeys(item)) {
    throw invalidInput('INVALID_TIMELINE_ITEM', 'Timeline item ' + index + ' contains unsupported property names.');
  }

  const rawDate = firstDefined(item.date, item.eventDate, item.event_date);
  const date = cleanTextField(rawDate, 'timeline[' + index + '].date', INPUT_LIMITS.timelineDate, 'INVALID_TIMELINE_DATE');
  if (date !== null && date !== '' && !isDateString(date)) {
    throw invalidInput('INVALID_TIMELINE_DATE', 'Timeline item ' + index + ' has an invalid date (expected YYYY-MM-DD).');
  }

  const title = cleanTextField(item.title, 'timeline[' + index + '].title', INPUT_LIMITS.timelineTitle, 'INVALID_TIMELINE_TITLE') || '';
  const description = cleanTextField(firstDefined(item.description, item.text), 'timeline[' + index + '].text', INPUT_LIMITS.timelineText, 'INVALID_TIMELINE_TEXT') || '';
  const image = safeMediaUrlValue(firstDefined(item.image, item.imageUrl, item.image_url), 'timeline[' + index + '].image');

  return {
    date: date || '',
    title: title,
    text: description,
    imageUrl: image
  };
}

function parseJsonBody(body) {
  if (body == null) {
    throw invalidInput('EMPTY_BODY', 'Request body is required.');
  }
  if (typeof body === 'string') {
    if (body.length > MAX_JSON_BODY_CHARS) {
      throw invalidInput('PAYLOAD_TOO_LARGE', 'Request body exceeds the maximum payload size.');
    }
    const trimmed = body.trim();
    if (!trimmed) {
      throw invalidInput('EMPTY_BODY', 'Request body is required.');
    }
    let parsed = null;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw invalidInput('INVALID_JSON', 'Request body must be valid JSON.');
    }
    body = parsed;
  }
  requirePlainObject(body, 'INVALID_JSON_BODY', 'Request body must be a JSON object.');
  return body;
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'love-story';
}

function generateWebsiteSlug(name1 = '', name2 = '') {
  const base = slugify(`${name1}-${name2}`);
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

function generatePreviewToken() {
  return crypto.randomBytes(24).toString('hex');
}

function normalizeCustomerData(raw = {}, templateId = 'love-50-01') {
  requirePlainObject(raw, 'INVALID_PAYLOAD', 'Customer data must be a JSON object.');
  if (hasUnsafeKeys(raw)) {
    throw invalidInput('INVALID_PAYLOAD', 'Customer data contains unsupported property names.');
  }

  const name1 = cleanTextField(firstDefined(raw.name1, raw.senderName), 'name1', INPUT_LIMITS.name, 'INVALID_NAME') || 'Minh';
  const name2 = cleanTextField(firstDefined(raw.name2, raw.receiverName), 'name2', INPUT_LIMITS.name, 'INVALID_NAME') || 'Ngọc';

  const shortMessage = cleanTextField(firstDefined(raw.shortMessage, raw.message), 'shortMessage', INPUT_LIMITS.shortMessage, 'INVALID_MESSAGE') || 'Mỗi khoảnh khắc bên nhau đều là một điều đáng nhớ.';
  const loveLetter = cleanTextField(firstDefined(raw.loveLetter, raw.letter), 'loveLetter', INPUT_LIMITS.loveLetter, 'INVALID_LETTER') || '';
  const finalMessage = cleanTextField(raw.finalMessage, 'finalMessage', INPUT_LIMITS.finalMessage, 'INVALID_FINAL_MESSAGE') || 'Yêu em hơn mọi ngày.';

  const rawStartDate = cleanTextField(firstDefined(raw.startDate, raw.specialDate), 'startDate', INPUT_LIMITS.startDate, 'INVALID_DATE');
  if (rawStartDate !== null && rawStartDate !== '' && !isDateString(rawStartDate)) {
    throw invalidInput('INVALID_DATE', 'startDate has an invalid date format (expected YYYY-MM-DD).');
  }
  const startDate = rawStartDate || '2025-02-14';

  const avatar1 = safeMediaUrlValue(firstDefined(raw.avatar1, raw.photo1), 'avatar1');
  const avatar2 = safeMediaUrlValue(firstDefined(raw.avatar2, raw.photo2), 'avatar2');
  const musicUrl = safeMediaUrlValue(firstDefined(raw.musicUrl, raw.music), 'musicUrl');

  let album = null;
  if (raw.album !== undefined && raw.album !== null) {
    if (!Array.isArray(raw.album)) {
      throw invalidInput('INVALID_ALBUM', 'album must be an array of image URLs.');
    }
    if (raw.album.length > INPUT_LIMITS.photos) {
      throw invalidInput('INVALID_ALBUM', 'album exceeds the maximum of ' + INPUT_LIMITS.photos + ' images.');
    }
    album = raw.album.map((photo, index) => safeMediaUrlValue(photo, 'album[' + index + ']')).filter(Boolean);
  }

  const photos = album && album.length ? album : [avatar1, avatar2].filter(Boolean);

  let timeline = [];
  if (raw.timeline !== undefined && raw.timeline !== null) {
    if (!Array.isArray(raw.timeline)) {
      throw invalidInput('INVALID_TIMELINE', 'timeline must be an array.');
    }
    const productLimit = TEMPLATE_TIMELINE_LIMITS[templateId] || INPUT_LIMITS.timelineItemsAbuseCeiling;
    if (raw.timeline.length > productLimit) {
      throw invalidInput('TIMELINE_TOO_LONG', 'timeline exceeds the maximum of ' + productLimit + ' items.');
    }
    timeline = raw.timeline.map(sanitizeTimelineItem);
  }

  const customData = sanitizeCustomData(raw.customData, raw.qrContent);

  return {
    templateId: templateId,
    name1,
    name2,
    startDate,
    avatar1,
    avatar2,
    photos,
    timeline,
    shortMessage,
    loveLetter,
    finalMessage,
    musicUrl,
    customData: {
      ...customData,
      templateId: templateId
    }
  };
}

function buildCanonicalWebsitePayload(website = {}, template = {}, photos = [], timeline = []) {
  const templateId = template && template.slug ? template.slug : website.template_id || 'love-50-01';

  return {
    templateId,
    name1: website.name1 || '',
    name2: website.name2 || '',
    startDate: website.start_date || '',
    avatar1: website.avatar1_url || '',
    avatar2: website.avatar2_url || '',
    photos: Array.isArray(photos) ? photos.map((photo) => photo.image_url || photo.url || '').filter(Boolean) : [],
    timeline: Array.isArray(timeline)
      ? timeline.map((entry) => ({
          date: entry.event_date || '',
          title: entry.title || '',
          text: entry.description || '',
          imageUrl: entry.image_url || ''
        }))
      : [],
    shortMessage: website.short_message || '',
    loveLetter: website.love_letter || '',
    finalMessage: website.final_message || '',
    musicUrl: website.music_url || '',
    customData: website.custom_data && typeof website.custom_data === 'object' ? website.custom_data : {}
  };
}

module.exports = {
  getEnv,
  requireSupabaseSettings,
  buildSupabaseUrl,
  supabaseRequest,
  parseJsonBody,
  slugify,
  generateWebsiteSlug,
  generatePreviewToken,
  normalizeCustomerData,
  buildCanonicalWebsitePayload
};
