const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function loadDotEnvFiles() {
  const candidates = [
    path.join(__dirname, '..', '..', '.env.local'),
    path.join(__dirname, '..', '..', '.env')
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
  throw new Error('Request body must be an object.');
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
  const payload = raw && typeof raw === 'object' ? raw : {};
  const name1 = payload.name1 || payload.senderName || 'Minh';
  const name2 = payload.name2 || payload.receiverName || 'Ngọc';
  const album = Array.isArray(payload.album) ? payload.album.filter(Boolean) : [];
  const timeline = Array.isArray(payload.timeline) ? payload.timeline : [];
  const startDate = payload.startDate || payload.specialDate || '2025-02-14';
  const shortMessage = payload.shortMessage || payload.message || 'Mỗi khoảnh khắc bên nhau đều là một điều đáng nhớ.';
  const loveLetter = payload.loveLetter || payload.letter || '';
  const finalMessage = payload.finalMessage || 'Yêu em hơn mọi ngày.';
  const avatar1 = payload.avatar1 || payload.photo1 || '';
  const avatar2 = payload.avatar2 || payload.photo2 || '';
  const customData = payload.customData && typeof payload.customData === 'object' ? payload.customData : {};

  return {
    templateId: templateId,
    name1,
    name2,
    startDate,
    avatar1,
    avatar2,
    photos: album.length ? album : [avatar1, avatar2].filter(Boolean),
    timeline,
    shortMessage,
    loveLetter,
    finalMessage,
    musicUrl: payload.musicUrl || payload.music || '',
    customData: {
      ...customData,
      templateId: templateId,
      qrContent: customData.qrContent || payload.qrContent || ''
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
