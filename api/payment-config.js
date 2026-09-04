const { getBankConfig, getPayOSConfig, isPayOSConfigured, getPaymentMode, isMockPaymentMode } = require('../server-lib/payment');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const config = getBankConfig();
  const payOS = getPayOSConfig();
  const paymentConfigured = isPayOSConfigured();
  const paymentMode = getPaymentMode();

  return res.status(200).json({
    ok: true,
    config: {
      bankId: paymentConfigured ? (payOS.bankId || config.bankId || null) : (config.bankId || null),
      bankName: paymentConfigured ? (payOS.bankName || config.bankName || null) : (config.bankName || null),
      accountNumber: paymentConfigured ? (payOS.accountNumber || config.accountNumber || null) : (config.accountNumber || null),
      accountName: paymentConfigured ? (payOS.accountName || config.accountName || null) : (config.accountName || null),
      qrConfigured: Boolean(config.qrConfigured || (paymentConfigured && payOS.bankId && payOS.accountNumber)),
      paymentDetectionConfigured: paymentConfigured,
      paymentProvider: paymentConfigured ? 'payos' : 'unconfigured',
      paymentConfigured,
      paymentMode,
      isMockMode: isMockPaymentMode(),
      mockUiEnabled: isMockPaymentMode(),
      payosAccountNumber: payOS.accountNumber || null,
      payosBankId: payOS.bankId || null,
      payosBankName: payOS.bankName || null,
      payosAccountName: payOS.accountName || null
    }
  });
};
