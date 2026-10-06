function cleanString(val?: string, defaultVal = ''): string {
  if (!val) return defaultVal;
  const trimmed = val.trim().replace(/^["']|["']$/g, '').trim();
  return trimmed || defaultVal;
}

function cleanPrefix(val?: string, defaultVal = 'api/v1'): string {
  if (!val) return defaultVal;
  const unquoted = val.trim().replace(/^["']|["']$/g, '').trim();
  const stripped = unquoted.replace(/^\/+|\/+$/g, '').trim();
  return stripped || defaultVal;
}

function cleanUrl(val?: string, defaultVal = ''): string {
  if (!val) return defaultVal;
  const unquoted = val.trim().replace(/^["']|["']$/g, '').trim();
  const stripped = unquoted.replace(/\/+$/, '').trim();
  return stripped || defaultVal;
}

export default () => ({
  port: parseInt(cleanString(process.env.PORT, '5000'), 10),
  nodeEnv: cleanString(process.env.NODE_ENV, 'development'),
  appName: cleanString(process.env.APP_NAME, 'CASA API Gateway'),
  appPrefix: cleanPrefix(process.env.APP_PREFIX, 'api/v1'),
  cors: {
    frontendUrl: cleanUrl(process.env.FRONTEND_URL, 'http://localhost:3000'),
    adminUrl: cleanUrl(process.env.ADMIN_URL, 'http://localhost:3001'),
  },
  database: {
    uri: cleanString(process.env.MONGODB_URI, 'mongodb://127.0.0.1:27017/casa_real_estate'),
    dbName: cleanString(process.env.MONGODB_DB_NAME, 'casa_real_estate'),
  },
  jwt: {
    accessSecret: cleanString(process.env.JWT_ACCESS_SECRET, 'dev_secret_access_key_casa_2026'),
    refreshSecret: cleanString(process.env.JWT_REFRESH_SECRET, 'dev_secret_refresh_key_casa_2026'),
    accessExpiresIn: cleanString(process.env.JWT_ACCESS_EXPIRES_IN, '15m'),
    refreshExpiresIn: cleanString(process.env.JWT_REFRESH_EXPIRES_IN, '7d'),
  },
  auth: {
    otpExpiresInMinutes: parseInt(cleanString(process.env.OTP_EXPIRES_IN_MINUTES, '5'), 10),
    otpMaxAttempts: parseInt(cleanString(process.env.OTP_MAX_ATTEMPTS, '3'), 10),
    otpCooldownSeconds: parseInt(cleanString(process.env.OTP_COOLDOWN_SECONDS, '60'), 10),
    otpSecretSalt: cleanString(process.env.OTP_SECRET_SALT, 'casa_otp_salt_secret_dev'),
  },
  sms: {
    provider: cleanString(process.env.SMS_PROVIDER, 'mock'),
    enableMockSms: cleanString(process.env.ENABLE_MOCK_SMS) !== 'false',
    msg91AuthKey: cleanString(process.env.MSG91_AUTH_KEY),
    msg91TemplateId: cleanString(process.env.MSG91_TEMPLATE_ID),
    msg91SenderId: cleanString(process.env.MSG91_SENDER_ID, 'CASARE'),
  },
  payments: {
    razorpayKeyId: cleanString(process.env.RAZORPAY_KEY_ID),
    razorpayKeySecret: cleanString(process.env.RAZORPAY_KEY_SECRET),
    razorpayWebhookSecret: cleanString(process.env.RAZORPAY_WEBHOOK_SECRET),
  },
});

