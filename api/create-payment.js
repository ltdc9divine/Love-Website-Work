const crypto = require('crypto');
const { supabaseRequest, parseJsonBody } = require('./lib/supabase');
const { createPayOSClient, getPayOSConfig, normalizeOrderReference } = require('./lib/payment');

function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toIntegerAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0;
}

function stablePayOSOrderCode(orderId) {
  const digest = crypto.createHash('sha256').update(orderId).digest('hex');
  return Number.parseInt(digest.slice(0, 12), 16) % 900000000000 + 100000000000;
}

async function findOrder(orderId) {
  const rows = await supabaseRequest({
    path: `/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&select=*`,
    method: 'GET'
  });
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function findOrderByPayOSCode(orderCode) {
  const rows = await supabaseRequest({
    path: `/rest/v1/orders?payos_order_code=eq.${encodeURIComponent(orderCode)}&select=id`,
    method: 'GET'
  });
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function savePayOSDetails(orderId, details) {
  const rows = await supabaseRequest({
    path: `/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&payment_status=eq.pending`,
    method: 'PATCH',
    body: details
  });
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function reservePayOSOrderCode(orderId, orderCode) {
  const rows = await supabaseRequest({
    path: `/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&payment_status=eq.pending&payos_order_code=is.null`,
    method: 'PATCH',
    body: { payos_order_code: orderCode }
  });
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

function publicPayment(order) {
  return {
    orderId: order.id,
    orderReference: order.order_reference,
    amount: Number(order.amount),
    paymentStatus: order.payment_status,
    paymentLinkId: order.payos_payment_link_id || null,
    checkoutUrl: order.payos_checkout_url || null,
    qrCode: order.payos_qr_code || null,
    payOSOrderCode: order.payos_order_code || null
  };
}

function withOrderId(url, orderId) {
  const target = new URL(url);
  target.searchParams.set('order', orderId);
  return target.toString();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  let payload;
  try {
    payload = parseJsonBody(req.body);
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid JSON.' });
  }

  const orderId = typeof payload.orderId === 'string' ? payload.orderId.trim() : '';
  if (!isUuid(orderId)) {
    return res.status(400).json({ ok: false, error: 'A valid orderId is required.' });
  }

  const config = getPayOSConfig();
  if (!config.configured) {
    return res.status(503).json({ ok: false, error: 'Payment provider is not configured.' });
  }

  let order;
  try {
    order = await findOrder(orderId);
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'Unable to load order.' });
  }

  if (!order) {
    return res.status(404).json({ ok: false, error: 'Order not found.' });
  }

  if (order.payment_status === 'paid') {
    return res.status(200).json({ ok: true, payment: publicPayment(order) });
  }

  if (order.payment_status !== 'pending') {
    return res.status(409).json({ ok: false, error: 'Order is not available for payment.' });
  }

  const amount = toIntegerAmount(order.amount);
  const description = normalizeOrderReference(order.order_reference);
  if (!amount || !description) {
    return res.status(422).json({ ok: false, error: 'Order payment data is invalid.' });
  }

  if (order.payos_checkout_url && order.payos_payment_link_id && order.payos_order_code) {
    return res.status(200).json({ ok: true, payment: publicPayment(order), reused: true });
  }

  const orderCode = order.payos_order_code || stablePayOSOrderCode(order.id);
  try {
    const conflict = await findOrderByPayOSCode(orderCode);
    if (conflict && conflict.id !== order.id) {
      return res.status(409).json({ ok: false, error: 'Unable to allocate a unique payment order.' });
    }

    if (!order.payos_order_code) {
      const reserved = await reservePayOSOrderCode(order.id, orderCode);
      if (reserved) {
        order = { ...order, payos_order_code: orderCode };
      } else {
        order = await findOrder(orderId);
        if (!order || !order.payos_checkout_url) {
          return res.status(409).json({ ok: false, error: 'Payment link is being created. Please retry shortly.' });
        }
      }
    }

    if (order.payos_checkout_url && order.payos_payment_link_id && order.payos_order_code) {
      return res.status(200).json({ ok: true, payment: publicPayment(order), reused: true });
    }

    const payOS = createPayOSClient();
    const link = await payOS.paymentRequests.create({
      orderCode: order.payos_order_code,
      amount,
      description,
      returnUrl: withOrderId(config.returnUrl, order.id),
      cancelUrl: withOrderId(config.cancelUrl, order.id)
    });

    const saved = await savePayOSDetails(order.id, {
      payos_order_code: order.payos_order_code,
      payos_payment_link_id: link.paymentLinkId || null,
      payos_checkout_url: link.checkoutUrl || null,
      payos_qr_code: link.qrCode || null
    });

    if (!saved) {
      return res.status(409).json({ ok: false, error: 'Payment link could not be stored safely.' });
    }

    return res.status(200).json({ ok: true, payment: publicPayment(saved) });
  } catch (error) {
    console.error('PayOS payment creation failed:', error && error.message ? error.message : 'unknown error');
    return res.status(502).json({ ok: false, error: 'Unable to create payment.' });
  }
};