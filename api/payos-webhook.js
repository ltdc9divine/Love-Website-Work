const { supabaseRequest, parseJsonBody } = require('../server-lib/supabase');
const { createPayOSClient, getPayOSConfig, normalizeOrderReference } = require('../server-lib/payment');

async function findOrderByCode(orderCode) {
  const rows = await supabaseRequest({
    path: `/rest/v1/orders?payos_order_code=eq.${encodeURIComponent(orderCode)}&select=*`,
    method: 'GET'
  });
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function findOrderByPaymentLink(paymentLinkId) {
  const rows = await supabaseRequest({
    path: `/rest/v1/orders?payos_payment_link_id=eq.${encodeURIComponent(paymentLinkId)}&select=*`,
    method: 'GET'
  });
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function findPaidTransaction(transactionId) {
  const rows = await supabaseRequest({
    path: `/rest/v1/orders?payment_transaction_id=eq.${encodeURIComponent(transactionId)}&payment_status=eq.paid&select=id,order_reference`,
    method: 'GET'
  });
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function updatePaid(orderId, transaction) {
  const rows = await supabaseRequest({
    path: `/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&payment_status=eq.pending&payment_transaction_id=is.null`,
    method: 'PATCH',
    body: {
      payment_status: 'paid',
      payment_provider: 'payos',
      payment_transaction_id: transaction.transactionId,
      transaction_code: transaction.transactionId,
      paid_at: transaction.paidAt
    }
  });
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const config = getPayOSConfig();
  if (!config.configured) {
    return res.status(503).json({ ok: false, error: 'Payment provider is not configured.' });
  }

  let payload;
  try {
    payload = parseJsonBody(req.body);
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid JSON.' });
  }

  let data;
  try {
    data = await createPayOSClient().webhooks.verify(payload);
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid webhook signature.' });
  }

  if (payload.success !== true || String(payload.code) !== '00' || String(data.code || '00') !== '00') {
    return res.status(200).json({ ok: true, ignored: true });
  }

  const orderCode = Number(data.orderCode);
  const amount = Number(data.amount);
  const transactionId = typeof data.reference === 'string' ? data.reference.trim() : '';
  const paymentLinkId = typeof data.paymentLinkId === 'string' ? data.paymentLinkId.trim() : '';
  if (!Number.isSafeInteger(orderCode) || !Number.isFinite(amount) || amount <= 0 || !transactionId) {
    return res.status(400).json({ ok: false, error: 'Invalid payment data.' });
  }

  if (config.accountNumber && data.accountNumber && String(data.accountNumber) !== String(config.accountNumber)) {
    return res.status(400).json({ ok: false, error: 'Payment account mismatch.' });
  }

  let order;
  try {
    order = await findOrderByCode(orderCode);
    if (!order && paymentLinkId) {
      order = await findOrderByPaymentLink(paymentLinkId);
    }
  } catch {
    return res.status(500).json({ ok: false, error: 'Unable to load payment order.' });
  }

  if (!order) {
    return res.status(400).json({ ok: false, error: 'Payment order not found.' });
  }

  const expectedReference = normalizeOrderReference(order.order_reference);
  const description = normalizeOrderReference(data.description);
  if (
    order.payos_order_code !== orderCode ||
    (order.payos_payment_link_id && paymentLinkId && order.payos_payment_link_id !== paymentLinkId) ||
    amount !== Math.round(Number(order.amount)) ||
    description !== expectedReference
  ) {
    return res.status(400).json({ ok: false, error: 'Payment order validation failed.' });
  }

  try {
    const duplicate = await findPaidTransaction(transactionId);
    if (duplicate) {
      return res.status(200).json({ ok: true, idempotent: true });
    }

    if (order.payment_status === 'paid') {
      return order.payment_transaction_id === transactionId
        ? res.status(200).json({ ok: true, idempotent: true })
        : res.status(409).json({ ok: false, error: 'Order already has a different payment transaction.' });
    }

    const updated = await updatePaid(order.id, {
      transactionId,
      paidAt: data.transactionDateTime ? new Date(data.transactionDateTime).toISOString() : new Date().toISOString()
    });
    if (updated) {
      return res.status(200).json({ ok: true, paid: true });
    }

    const current = await findOrderByCode(orderCode);
    if (current && current.payment_status === 'paid' && current.payment_transaction_id === transactionId) {
      return res.status(200).json({ ok: true, idempotent: true });
    }
    return res.status(409).json({ ok: false, error: 'Payment order was updated by a different transaction.' });
  } catch (error) {
    console.error('PayOS webhook processing failed:', error && error.message ? error.message : 'unknown error');
    return res.status(500).json({ ok: false, error: 'Unable to process payment webhook.' });
  }
};