const { getBankConfig, getPayOSConfig, isPayOSConfigured } = require('./lib/payment');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const config = getBankConfig();
  const payOS = getPayOSConfig();
  const paymentConfigured = isPayOSConfigured();

  return res.status(200).json({
    ok: true,
    config: {
      bankId: config.bankId || payOS.bankId || null,
      bankName: config.bankName || payOS.bankName || null,
      accountNumber: config.accountNumber || payOS.accountNumber || null,
      accountName: config.accountName || payOS.accountName || null,
        qrConfigured: Boolean(config.qrConfigured || (paymentConfigured && payOS.bankId && payOS.accountNumber)),
      paymentDetectionConfigured: paymentConfigured,
      paymentProvider: paymentConfigured ? 'payos' : 'unconfigured',
      paymentConfigured,
      payosAccountNumber: payOS.accountNumber || null,
      payosBankId: payOS.bankId || null,
      payosBankName: payOS.bankName || null,
      payosAccountName: payOS.accountName || null
    }
  });
};
