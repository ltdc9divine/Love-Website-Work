const { supabaseRequest, parseJsonBody } = require('./lib/supabase');
const { normalizeOrderReference, checkPayment } = require('./lib/payment');

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

async function updateOrderToPaid(orderId, paymentResult) {
  const payload = {
    payment_status: 'paid',
    payment_provider: paymentResult.provider || 'bank_transfer',
    payment_transaction_id: paymentResult.paymentTransactionId || paymentResult.transactionCode || null,
    transaction_code: paymentResult.transactionCode || paymentResult.paymentTransactionId || null,
    paid_at: paymentResult.paidAt || new Date().toISOString()
  };

  const rows = await supabaseRequest({
    path: `/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&payment_status=eq.pending`,
    method: 'PATCH',
    body: payload
  });

  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  let payload = {};
  try {
    payload = parseJsonBody(req.body);
  } catch (error) {
    return res.status(400).json({ ok: false, error: 'Invalid JSON.' });
  }

  const orderId = typeof payload.orderId === 'string' ? payload.orderId.trim() : '';
  const reference = typeof payload.reference === 'string' ? payload.reference.trim() : '';

  if (!orderId && !reference) {
    return res.status(400).json({ ok: false, error: 'orderId or reference is required.' });
  }

  let order = null;

  try {
    if (orderId && isUuid(orderId)) {
      order = await findOrderById(orderId);
    }
    if (!order && reference) {
      order = await findOrderByReference(reference);
    }
  } catch (error) {
    return res.status(500).json({ ok: false, error: error && error.message ? error.message : 'Unable to load order.' });
  }

  if (!order) {
    return res.status(404).json({ ok: false, error: 'Order not found.' });
  }

  if (['paid', 'cancelled', 'failed', 'manual_review'].includes(order.payment_status)) {
    return res.status(200).json({
      ok: true,
      paid: order.payment_status === 'paid',
      order: {
        id: order.id,
        order_reference: order.order_reference || '',
        amount: Number(order.amount || 0),
        payment_status: order.payment_status || 'pending',
        payment_method: order.payment_method || 'bank_transfer',
        transaction_code: order.transaction_code || null,
        paid_at: order.paid_at || null
      }
    });
  }

  let paymentResult = null;
  try {
    paymentResult = await checkPayment(order);
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'Unable to validate payment.' });
  }

  if (!paymentResult || !paymentResult.paid) {
    return res.status(200).json({
      ok: true,
      paid: false,
      provider: paymentResult && paymentResult.provider ? paymentResult.provider : 'unconfigured',
      reason: paymentResult && paymentResult.reason ? paymentResult.reason : 'PENDING',
      order: {
        id: order.id,
        order_reference: order.order_reference || '',
        amount: Number(order.amount || 0),
        payment_status: order.payment_status || 'pending'
      }
    });
  }

  try {
    const updatedOrder = await updateOrderToPaid(order.id, paymentResult);
    return res.status(200).json({
      ok: true,
      paid: true,
      order: {
        id: updatedOrder ? updatedOrder.id : order.id,
        order_reference: updatedOrder ? (updatedOrder.order_reference || order.order_reference || '') : (order.order_reference || ''),
        amount: Number((updatedOrder || order).amount || 0),
        payment_status: 'paid',
        payment_method: (updatedOrder || order).payment_method || 'bank_transfer',
        transaction_code: (updatedOrder || order).transaction_code || null,
        paid_at: (updatedOrder || order).paid_at || null
      }
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error && error.message ? error.message : 'Unable to complete payment verification.' });
  }
};
