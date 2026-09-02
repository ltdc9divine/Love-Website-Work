const { supabaseRequest, parseJsonBody } = require('./lib/supabase');

const PAYMENT_METHOD = 'bank_transfer';
const PAYMENT_STATUS_PENDING = 'pending';
const PAYMENT_STATUS_CANCELLED = 'cancelled';
const ORDER_REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeString(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

function generateOrderReference() {
  let code = 'LB';
  for (let i = 0; i < 5; i += 1) {
    code += ORDER_REFERENCE_ALPHABET[Math.floor(Math.random() * ORDER_REFERENCE_ALPHABET.length)];
  }
  return code;
}

async function findWebsiteById(websiteId) {
  const rows = await supabaseRequest({
    path: `/rest/v1/websites?id=eq.${encodeURIComponent(websiteId)}&select=*`,
    method: 'GET'
  });
  return Array.isArray(rows) ? rows[0] : null;
}

async function findTemplateById(templateId) {
  const rows = await supabaseRequest({
    path: `/rest/v1/templates?id=eq.${encodeURIComponent(templateId)}&select=*`,
    method: 'GET'
  });
  return Array.isArray(rows) ? rows[0] : null;
}

async function findTemplateBySlug(templateSlug) {
  const rows = await supabaseRequest({
    path: `/rest/v1/templates?slug=eq.${encodeURIComponent(templateSlug)}&select=*`,
    method: 'GET'
  });
  return Array.isArray(rows) ? rows[0] : null;
}

async function findPendingOrderForWebsite(websiteId, templateId) {
  const rows = await supabaseRequest({
    path: `/rest/v1/orders?website_id=eq.${encodeURIComponent(websiteId)}&template_id=eq.${encodeURIComponent(templateId)}&payment_status=eq.${encodeURIComponent(PAYMENT_STATUS_PENDING)}&select=*`,
    method: 'GET'
  });
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function findOrderByReference(reference) {
  const rows = await supabaseRequest({
    path: `/rest/v1/orders?order_reference=eq.${encodeURIComponent(reference)}&select=*`,
    method: 'GET'
  });
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function createOrderRecord(record) {
  const rows = await supabaseRequest({
    path: '/rest/v1/orders',
    method: 'POST',
    body: [record]
  });
  return Array.isArray(rows) ? rows[0] : null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  let payload = {};
  try {
    payload = parseJsonBody(req.body);
  } catch (error) {
    return res.status(400).json({ success: false, error: 'Invalid JSON.' });
  }

  const websiteIdInput = normalizeString(payload.websiteId || payload.website_id);
  const templateInput = normalizeString(payload.templateId || payload.template_id);

  if (!websiteIdInput || !templateInput) {
    return res.status(400).json({ success: false, error: 'websiteId and templateId are required.' });
  }

  if (!isUuid(websiteIdInput)) {
    return res.status(400).json({ success: false, error: 'websiteId must be a valid UUID.' });
  }

  let website = null;
  try {
    website = await findWebsiteById(websiteIdInput);
  } catch (error) {
    return res.status(500).json({ success: false, error: error && error.message ? error.message : 'Unable to load website.' });
  }

  if (!website) {
    return res.status(404).json({ success: false, error: 'Website not found.' });
  }

  let template = null;
  try {
    if (isUuid(templateInput)) {
      template = await findTemplateById(templateInput);
    } else {
      template = await findTemplateBySlug(templateInput);
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error && error.message ? error.message : 'Unable to load template.' });
  }

  if (!template) {
    return res.status(404).json({ success: false, error: 'Template not found.' });
  }

  const websiteTemplateId = website.template_id ? String(website.template_id) : '';
  const templateId = template.id ? String(template.id) : '';

  if (websiteTemplateId && templateId && websiteTemplateId !== templateId) {
    return res.status(409).json({ success: false, error: 'Website template does not match the selected template.' });
  }

  const amountValue = Number(template.price || 0);
  if (!Number.isFinite(amountValue) || amountValue <= 0) {
    return res.status(422).json({ success: false, error: 'Template amount is invalid.' });
  }

  let existingPendingOrder = null;
  try {
    existingPendingOrder = await findPendingOrderForWebsite(website.id, template.id);
  } catch (error) {
    return res.status(500).json({ success: false, error: error && error.message ? error.message : 'Unable to check existing order.' });
  }

  if (existingPendingOrder) {
    return res.status(200).json({
      success: true,
      orderId: existingPendingOrder.id,
      orderReference: existingPendingOrder.order_reference || '',
      amount: Number(existingPendingOrder.amount || 0),
      paymentStatus: existingPendingOrder.payment_status || PAYMENT_STATUS_PENDING,
      paymentMethod: existingPendingOrder.payment_method || PAYMENT_METHOD,
      idempotent: true
    });
  }

  let orderReference = generateOrderReference();
  let attempts = 0;
  while (attempts < 10) {
    const existingReference = await findOrderByReference(orderReference);
    if (!existingReference) {
      break;
    }
    orderReference = generateOrderReference();
    attempts += 1;
  }

  const orderRow = {
    website_id: website.id,
    template_id: template.id,
    amount: amountValue,
    payment_status: PAYMENT_STATUS_PENDING,
    payment_method: PAYMENT_METHOD,
    order_reference: orderReference,
    transaction_code: null,
    paid_at: null,
    created_at: new Date().toISOString()
  };

  let createdOrder = null;
  try {
    createdOrder = await createOrderRecord(orderRow);
  } catch (error) {
    const message = error && error.message ? error.message : 'Unable to create order.';
    return res.status(500).json({ success: false, error: message });
  }

  if (!createdOrder || !createdOrder.id) {
    return res.status(500).json({ success: false, error: 'Failed to create order.' });
  }

  return res.status(201).json({
    success: true,
    orderId: createdOrder.id,
    orderReference,
    amount: Number(createdOrder.amount || amountValue),
    paymentStatus: createdOrder.payment_status || PAYMENT_STATUS_PENDING,
    paymentMethod: createdOrder.payment_method || PAYMENT_METHOD,
    websiteId: website.id,
    templateId: template.id
  });
};
