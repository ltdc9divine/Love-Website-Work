const { getEnv } = require('./supabase');

function getPaymentMode() {
  const configuredMode = (getEnv('PAYMENT_MODE') || '').trim().toLowerCase();
  if (configuredMode === 'mock' || configuredMode === 'production') {
    return configuredMode;
  }

  const isProductionRuntime = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production';
  return isProductionRuntime ? 'production' : 'mock';
}

function isMockPaymentMode() {
  return getPaymentMode() === 'mock';
}

function isProductionPaymentMode() {
  return getPaymentMode() === 'production';
}

function ensureProductionModeGuard() {
  const isProductionRuntime = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production';
  if (isProductionRuntime && getPaymentMode() !== 'production') {
    throw new Error('Mock payment is disabled in production.');
  }
}

function getPayOSConfig() {
  const clientId = getEnv('PAYOS_CLIENT_ID');
  const apiKey = getEnv('PAYOS_API_KEY');
  const checksumKey = getEnv('PAYOS_CHECKSUM_KEY');
  const configured = Boolean(clientId && apiKey && checksumKey);

  return {
    clientId,
    apiKey,
    checksumKey,
    configured,
    provider: configured ? 'payos' : 'unconfigured',
    accountNumber: getEnv('PAYOS_ACCOUNT_NUMBER'),
    bankId: getEnv('PAYOS_BANK_ID') || getEnv('BANK_ID'),
    bankName: getEnv('PAYOS_BANK_NAME') || getEnv('BANK_NAME'),
    accountName: getEnv('PAYOS_ACCOUNT_NAME') || getEnv('BANK_ACCOUNT_NAME'),
    returnUrl: getEnv('PAYOS_RETURN_URL') || 'https://luubutgift.vercel.app/checkout.html',
    cancelUrl: getEnv('PAYOS_CANCEL_URL') || 'https://luubutgift.vercel.app/checkout.html'
  };
}

function isPayOSConfigured() {
  return getPayOSConfig().configured;
}

function createPayOSClient() {
  const config = getPayOSConfig();
  if (!config.configured) {
    return null;
  }

  const { PayOS } = require('@payos/node');
  return new PayOS({
    clientId: config.clientId,
    apiKey: config.apiKey,
    checksumKey: config.checksumKey,
    logLevel: 'off'
  });
}

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

function buildMockPaymentResult(order, status = 'pending') {
  const normalizedStatus = String(status || 'pending').toLowerCase();
  const amount = Number(order && order.amount ? order.amount : 0);
  const timestamp = new Date().toISOString();

  if (normalizedStatus === 'paid') {
    return {
      paid: true,
      provider: 'mock',
      status: 'paid',
      transactionCode: `MOCK-${String(order && order.id ? order.id.slice(0, 8) : 'ORDER')}-${Date.now().toString(36).toUpperCase()}`,
      paymentTransactionId: `MOCK-${Date.now().toString(36).toUpperCase()}`,
      amount,
      paidAt: timestamp,
      available: true,
      mock: true
    };
  }

  if (normalizedStatus === 'failed' || normalizedStatus === 'cancelled') {
    return {
      paid: false,
      provider: 'mock',
      status: normalizedStatus,
      reason: normalizedStatus === 'failed' ? 'PAYMENT_FAILED' : 'PAYMENT_CANCELLED',
      amount,
      paidAt: null,
      available: true,
      mock: true
    };
  }

  return {
    paid: false,
    provider: 'mock',
    status: 'pending',
    reason: 'PAYMENT_PENDING',
    amount,
    paidAt: null,
    available: true,
    mock: true
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

  if (isMockPaymentMode()) {
    const mockStatus = String(order.payment_status || '').toLowerCase();
    return buildMockPaymentResult(order, mockStatus === 'paid' ? 'paid' : mockStatus === 'failed' ? 'failed' : mockStatus === 'cancelled' ? 'cancelled' : 'pending');
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

  if (isPayOSConfigured() && order.payos_order_code) {
    try {
      const payment = await createPayOSClient().paymentRequests.get(order.payos_order_code);
      const paidAmount = Number(payment.amountPaid || 0);
      if (String(payment.status || '').toUpperCase() === 'PAID' && paidAmount === Math.round(Number(order.amount))) {
        const transaction = Array.isArray(payment.transactions) ? payment.transactions[0] : null;
        return {
          paid: true,
          provider: 'payos',
          transactionCode: transaction && (transaction.reference || transaction.id) ? (transaction.reference || transaction.id) : String(payment.orderCode),
          paymentTransactionId: transaction && (transaction.reference || transaction.id) ? (transaction.reference || transaction.id) : String(payment.orderCode),
          amount: paidAmount,
          paidAt: transaction && transaction.transactionDateTime ? new Date(transaction.transactionDateTime).toISOString() : new Date().toISOString(),
          available: true
        };
      }

      return {
        paid: false,
        provider: 'payos',
        reason: 'PAYMENT_PENDING',
        available: true
      };
    } catch {
      return {
        paid: false,
        provider: 'payos',
        reason: 'PAYMENT_PROVIDER_UNAVAILABLE',
        available: false
      };
    }
  }

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
  getPaymentMode,
  isMockPaymentMode,
  isProductionPaymentMode,
  ensureProductionModeGuard,
  getPayOSConfig,
  isPayOSConfigured,
  createPayOSClient,
  normalizeOrderReference,
  buildVietQrPayload,
  buildMockPaymentResult,
  getBankConfig,
  getPaymentProviderName,
  checkPayment
};
