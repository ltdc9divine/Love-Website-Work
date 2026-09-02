const { getEnv } = require('./supabase');

function normalizeOrderReference(value) {
  const text = String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return text.slice(0, 32) || null;
}

function getBankConfig() {
  const bankId = (getEnv('BANK_ID') || getEnv('PAYMENT_BANK_ID') || '').trim();
  const bankName = (getEnv('BANK_NAME') || getEnv('PAYMENT_BANK_NAME') || '').trim();
  const accountNumber = (getEnv('BANK_ACCOUNT') || getEnv('PAYMENT_BANK_ACCOUNT') || '').trim();
  const accountName = (getEnv('BANK_ACCOUNT_NAME') || getEnv('PAYMENT_ACCOUNT_NAME') || '').trim();

  const qrConfigured = Boolean(bankId && accountNumber);

  return {
    bankId: qrConfigured ? bankId : null,
    bankName: qrConfigured ? (bankName || null) : null,
    accountNumber: qrConfigured ? accountNumber : null,
    accountName: qrConfigured ? (accountName || null) : null,
    qrConfigured,
    paymentDetectionConfigured: false
  };
}

function getPaymentProviderName() {
  return (getEnv('PAYMENT_PROVIDER') || '').trim().toLowerCase() || 'unconfigured';
}

function buildVietQrPayload({ bankId, accountNumber, accountName, amount, reference }) {
  const normalizedReference = normalizeOrderReference(reference) || null;
  const normalizedAmount = Number(amount || 0);

  if (!bankId || !accountNumber) {
    return {
      bankId: null,
      accountNumber: null,
      accountName: null,
      amount: 0,
      reference: normalizedReference,
      raw: '',
      qrUrl: ''
    };
  }

  return {
    bankId: String(bankId),
    accountNumber: String(accountNumber),
    accountName: accountName ? String(accountName) : null,
    amount: Number.isFinite(normalizedAmount) ? Math.max(0, normalizedAmount) : 0,
    reference: normalizedReference,
    raw: `BANK=${String(bankId)};ACCOUNT=${String(accountNumber)};NAME=${accountName ? String(accountName) : ''};AMOUNT=${Number.isFinite(normalizedAmount) ? Math.max(0, normalizedAmount) : 0};REF=${normalizedReference || ''}`,
    qrUrl: normalizedReference
      ? `https://img.vietqr.io/image/${encodeURIComponent(String(bankId))}-${encodeURIComponent(String(accountNumber))}-compact2.png?amount=${Math.round(Number.isFinite(normalizedAmount) ? Math.max(0, normalizedAmount) : 0)}&addInfo=${encodeURIComponent(normalizedReference)}`
      : `https://img.vietqr.io/image/${encodeURIComponent(String(bankId))}-${encodeURIComponent(String(accountNumber))}-compact2.png`
  };
}

async function checkPayment(order) {
  if (!order) {
    return {
      paid: false,
      provider: 'unconfigured',
      reason: 'ORDER_NOT_FOUND',
      available: false
    };
  }

  if (order.payment_status === 'paid') {
    return {
      paid: true,
      provider: order.payment_provider || 'bank_transfer',
      transactionCode: order.transaction_code || order.order_reference || null,
      paymentTransactionId: order.payment_transaction_id || null,
      amount: Number(order.amount || 0),
      paidAt: order.paid_at || new Date().toISOString(),
      available: true
    };
  }

  const providerName = getPaymentProviderName();

  if (!providerName || providerName === 'unconfigured') {
    return {
      paid: false,
      provider: 'unconfigured',
      reason: 'PAYMENT_PROVIDER_UNAVAILABLE',
      available: false,
      message: 'Automatic payment verification is not configured yet.'
    };
  }

  return {
    paid: false,
    provider: providerName,
    reason: 'PROVIDER_NOT_READY',
    available: false,
    message: 'The configured provider is not active for production verification yet.'
  };
}

module.exports = {
  normalizeOrderReference,
  buildVietQrPayload,
  getBankConfig,
  getPaymentProviderName,
  checkPayment
};
