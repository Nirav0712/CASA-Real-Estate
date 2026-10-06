export default () => ({
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'CASA API Gateway',
  appPrefix: process.env.APP_PREFIX || 'api/v1',
  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    adminUrl: process.env.ADMIN_URL || 'http://localhost:3001',
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/casa_real_estate',
    dbName: process.env.MONGODB_DB_NAME || 'casa_real_estate',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_secret_access_key_casa_2026',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_secret_refresh_key_casa_2026',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  auth: {
    otpExpiresInMinutes: parseInt(process.env.OTP_EXPIRES_IN_MINUTES || '5', 10),
    otpMaxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10),
    otpCooldownSeconds: parseInt(process.env.OTP_COOLDOWN_SECONDS || '60', 10),
    otpSecretSalt: process.env.OTP_SECRET_SALT || 'casa_otp_salt_secret_dev',
  },
  sms: {
    provider: process.env.SMS_PROVIDER || 'mock',
    enableMockSms: process.env.ENABLE_MOCK_SMS !== 'false',
    msg91AuthKey: process.env.MSG91_AUTH_KEY || '',
    msg91TemplateId: process.env.MSG91_TEMPLATE_ID || '',
    msg91SenderId: process.env.MSG91_SENDER_ID || 'CASARE',
  },
  payments: {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
    razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
});

