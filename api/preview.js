const { supabaseRequest, buildCanonicalWebsitePayload } = require('./lib/supabase');

async function findWebsiteByPreviewToken(token) {
  if (!token) {
    throw Object.assign(new Error('Preview token is required.'), { statusCode: 400 });
  }

  const query = `/rest/v1/websites?preview_token=eq.${encodeURIComponent(String(token))}&select=*`;
  const records = await supabaseRequest({ path: query, method: 'GET' });
  return Array.isArray(records) ? records[0] : null;
}

async function findPublishedWebsiteBySlug(slug) {
  if (!slug) {
    throw Object.assign(new Error('Published website slug is required.'), { statusCode: 400 });
  }

  const query = `/rest/v1/websites?slug=eq.${encodeURIComponent(String(slug))}&status=eq.published&select=*`;
  const records = await supabaseRequest({ path: query, method: 'GET' });
  return Array.isArray(records) ? records[0] : null;
}

async function findTemplateById(templateId) {
  if (!templateId) return null;
  const query = `/rest/v1/templates?id=eq.${encodeURIComponent(String(templateId))}&select=*`;
  const records = await supabaseRequest({ path: query, method: 'GET' });
  return Array.isArray(records) ? records[0] : null;
}

async function findPhotosByWebsiteId(websiteId) {
  if (!websiteId) return [];
  const query = `/rest/v1/photos?website_id=eq.${encodeURIComponent(String(websiteId))}&select=*`;
  const records = await supabaseRequest({ path: query, method: 'GET' });
  return Array.isArray(records) ? records : [];
}

async function findTimelineByWebsiteId(websiteId) {
  if (!websiteId) return [];
  const query = `/rest/v1/timeline?website_id=eq.${encodeURIComponent(String(websiteId))}&select=*`;
  const records = await supabaseRequest({ path: query, method: 'GET' });
  return Array.isArray(records) ? records : [];
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  try {
    const tokenFromQuery = req.query && req.query.token ? String(req.query.token) : '';
    const slugFromQuery = req.query && (req.query.site || req.query.slug) ? String(req.query.site || req.query.slug) : '';
    const pathToken = req.url && req.url.includes('/') ? req.url.split('/').filter(Boolean).pop() : '';
    const token = tokenFromQuery || (slugFromQuery ? '' : pathToken);

    if (!token && !slugFromQuery) {
      return res.status(400).json({ success: false, error: 'Preview token or published website slug is required.' });
    }

    const website = slugFromQuery
      ? await findPublishedWebsiteBySlug(slugFromQuery)
      : await findWebsiteByPreviewToken(token);

    if (!website) {
      return res.status(404).json({ success: false, error: 'Invalid preview token.' });
    }

    const template = await findTemplateById(website.template_id);
    const photos = await findPhotosByWebsiteId(website.id);
    const timeline = await findTimelineByWebsiteId(website.id);

    const payload = buildCanonicalWebsitePayload(website, template, photos, timeline);

    return res.status(200).json({
      success: true,
      data: payload
    });
  } catch (error) {
    const statusCode = Number(error && error.statusCode) || 500;
    return res.status(statusCode).json({
      success: false,
      error: error && error.message ? error.message : 'Internal server error.'
    });
  }
};
