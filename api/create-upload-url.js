const crypto = require('crypto');
const { getEnv, requireSupabaseSettings, buildSupabaseUrl, parseJsonBody } = require('../server-lib/supabase');

const ALLOWED_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['audio/mpeg', 'mp3'],
  ['audio/wav', 'wav'],
  ['audio/ogg', 'ogg'],
  ['audio/mp4', 'm4a'],
  ['audio/aac', 'aac'],
  ['audio/webm', 'webm']
]);
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function safeUploadId(value) {
  const uploadId = String(value || '');
  return /^[a-zA-Z0-9_-]{8,64}$/.test(uploadId) ? uploadId : '';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  try {
    const payload = parseJsonBody(req.body);
    const contentType = String(payload.contentType || '').toLowerCase().trim();
    const extension = ALLOWED_TYPES.get(contentType);
    const uploadId = safeUploadId(payload.uploadId);
    const size = Number(payload.size);

    if (!extension || !uploadId || !Number.isSafeInteger(size) || size <= 0 || size > MAX_FILE_SIZE) {
      return res.status(400).json({ success: false, error: 'Unsupported media type, upload session, or file size.' });
    }

    const { url, key } = requireSupabaseSettings();
    const bucket = getEnv('SUPABASE_STORAGE_BUCKET') || 'luu-but-media';
    const objectPath = `drafts/${uploadId}/${crypto.randomUUID()}.${extension}`;
    const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
    const signResponse = await fetch(buildSupabaseUrl(url, `/storage/v1/object/upload/sign/${encodeURIComponent(bucket)}/${encodedPath}`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({ upsert: false })
    });
    const signText = await signResponse.text();
    let signPayload = null;
    try {
      signPayload = signText ? JSON.parse(signText) : null;
    } catch {
      signPayload = null;
    }
    if (!signResponse.ok || !signPayload || !signPayload.url) {
      const message = signPayload && (signPayload.message || signPayload.error) ? (signPayload.message || signPayload.error) : `Storage signing failed (${signResponse.status}).`;
      const error = new Error(message);
      error.statusCode = signResponse.status || 502;
      throw error;
    }

    const signedPath = String(signPayload.url).startsWith('/') ? signPayload.url : `/${signPayload.url}`;
    return res.status(200).json({
      success: true,
      uploadUrl: buildSupabaseUrl(url, `/storage/v1${signedPath}`),
      publicUrl: buildSupabaseUrl(url, `/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`),
      path: objectPath,
      contentType
    });
  } catch (error) {
    const statusCode = Number(error && error.statusCode) || 500;
    return res.status(statusCode).json({ success: false, error: error && error.message ? error.message : 'Unable to prepare media upload.' });
  }
};
