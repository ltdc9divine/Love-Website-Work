const { supabaseRequest } = require('./lib/supabase');
const { normalizeOrderReference } = require('./lib/payment');

function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function findOrderById(orderId) {
  const rows = await supabaseRequest({
    path: `/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&select=*`,
    method: 'GET'
  });

  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function findOrderByReference(reference) {
  const normalizedReference = normalizeOrderReference(reference);
  if (!normalizedReference) {
    return null;
  }

  const rows = await supabaseRequest({
    path: `/rest/v1/orders?order_reference=eq.${encodeURIComponent(normalizedReference)}&select=*`,
    method: 'GET'
  });

  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const orderId = typeof req.query?.orderId === 'string' ? req.query.orderId : '';
  const reference = typeof req.query?.reference === 'string' ? req.query.reference : '';
  const payload = req.body && typeof req.body === 'object' ? req.body : {};
  const orderIdFromBody = typeof payload.orderId === 'string' ? payload.orderId : '';
  const referenceFromBody = typeof payload.reference === 'string' ? payload.reference : '';

  const requestedOrderId = orderId || orderIdFromBody;
  const requestedReference = reference || referenceFromBody;

  if (!requestedOrderId && !requestedReference) {
    return res.status(400).json({ ok: false, error: 'orderId or reference is required.' });
  }

  let order = null;

  try {
    if (requestedOrderId && isUuid(requestedOrderId)) {
      order = await findOrderById(requestedOrderId);
    }

    if (!order && requestedReference) {
      order = await findOrderByReference(requestedReference);
    }
  } catch (error) {
    return res.status(500).json({ ok: false, error: error && error.message ? error.message : 'Unable to load order.' });
  }

  if (!order) {
    return res.status(404).json({ ok: false, error: 'Order not found.' });
  }

  return res.status(200).json({
    ok: true,
    order: {
      id: order.id,
      order_reference: order.order_reference || '',
      amount: Number(order.amount || 0),
      payment_status: order.payment_status || 'pending',
      payment_method: order.payment_method || 'bank_transfer',
      transaction_code: order.transaction_code || null,
      paid_at: order.paid_at || null,
      created_at: order.created_at || null
    }
  });
};
