const {
  parseJsonBody,
  normalizeCustomerData,
  generateWebsiteSlug,
  generatePreviewToken,
  supabaseRequest
} = require('./lib/supabase');

async function findTemplateBySlug(templateId) {
  const templateQuery = `/rest/v1/templates?slug=eq.${encodeURIComponent(String(templateId).trim())}&select=*`;
  const records = await supabaseRequest({ path: templateQuery, method: 'GET' });
  return Array.isArray(records) ? records[0] : null;
}

async function createWebsiteRecord(websitePayload) {
  const records = await supabaseRequest({
    path: '/rest/v1/websites',
    method: 'POST',
    body: websitePayload
  });
  return Array.isArray(records) ? records[0] : records;
}

async function insertPhotos(websiteId, photos) {
  if (!Array.isArray(photos) || !photos.length) {
    return;
  }

  const rows = photos.map((imageUrl, index) => ({
    website_id: websiteId,
    image_url: String(imageUrl || '').trim(),
    sort_order: index
  })).filter((photo) => photo.image_url);

  if (!rows.length) {
    return;
  }

  await supabaseRequest({
    path: '/rest/v1/photos',
    method: 'POST',
    body: rows
  });
}

async function insertTimeline(websiteId, timeline) {
  if (!Array.isArray(timeline) || !timeline.length) {
    return;
  }

  const rows = timeline.map((entry, index) => ({
    website_id: websiteId,
    event_date: entry && entry.date ? entry.date : null,
    title: entry && entry.title ? entry.title : '',
    description: entry && entry.text ? entry.text : '',
    image_url: entry && entry.imageUrl ? entry.imageUrl : null,
    sort_order: index
  })).filter((row) => row.title || row.description || row.image_url || row.event_date);

  if (!rows.length) {
    return;
  }

  await supabaseRequest({
    path: '/rest/v1/timeline',
    method: 'POST',
    body: rows
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  try {
    const payload = parseJsonBody(req.body);
    const templateId = String(payload.templateId || payload.template_id || '').trim();

    if (!templateId) {
      return res.status(400).json({ success: false, error: 'templateId is required.' });
    }

    const template = await findTemplateBySlug(templateId);

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found.' });
    }

    const normalized = normalizeCustomerData(payload, template.slug);
    const previewToken = generatePreviewToken();
    const slug = generateWebsiteSlug(normalized.name1, normalized.name2);

    const websitePayload = {
      slug,
      template_id: template.id,
      name1: normalized.name1,
      name2: normalized.name2,
      start_date: normalized.startDate,
      avatar1_url: normalized.avatar1 || null,
      avatar2_url: normalized.avatar2 || null,
      short_message: normalized.shortMessage,
      love_letter: normalized.loveLetter,
      final_message: normalized.finalMessage,
      music_url: normalized.musicUrl || null,
      custom_data: normalized.customData || {},
      status: 'draft',
      preview_token: previewToken
    };

    const createdWebsite = await createWebsiteRecord(websitePayload);

    if (!createdWebsite || !createdWebsite.id) {
      return res.status(500).json({ success: false, error: 'Failed to create draft website.' });
    }

    await insertPhotos(createdWebsite.id, normalized.photos);
    await insertTimeline(createdWebsite.id, normalized.timeline);

    return res.status(200).json({
      success: true,
      websiteId: createdWebsite.id,
      previewToken,
      previewUrl: `/preview/${previewToken}`,
      status: 'draft'
    });
  } catch (error) {
    const statusCode = Number(error && error.statusCode) || 500;
    return res.status(statusCode).json({
      success: false,
      error: error && error.message ? error.message : 'Internal server error.'
    });
  }
};
