const { getBankConfig } = require('./lib/payment');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const config = getBankConfig();

  return res.status(200).json({
    ok: true,
    config: {
      bankId: config.bankId || null,
      bankName: config.bankName || null,
      accountNumber: config.accountNumber || null,
      accountName: config.accountName || null,
      qrConfigured: Boolean(config.qrConfigured),
      paymentDetectionConfigured: Boolean(config.paymentDetectionConfigured)
    }
  });
};
