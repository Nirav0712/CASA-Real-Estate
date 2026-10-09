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

export default () => {
  const nodeEnv = cleanString(process.env.NODE_ENV, 'development').toLowerCase();
  const isProduction = nodeEnv === 'production';

  const PRODUCTION_MARKETPLACE_URL = 'https://casa-real-estate-mocha.vercel.app';
  const PRODUCTION_ADMIN_URL = 'https://casa-real-estate-ocih.vercel.app';
  const LOCAL_MARKETPLACE_URL = 'http://localhost:3000';
  const LOCAL_ADMIN_URL = 'http://localhost:3001';

  // Environment-aware default frontend & admin URLs
  const defaultFrontendUrl = isProduction ? PRODUCTION_MARKETPLACE_URL : LOCAL_MARKETPLACE_URL;
  const defaultAdminUrl = isProduction ? PRODUCTION_ADMIN_URL : LOCAL_ADMIN_URL;

  let frontendUrl = cleanUrl(process.env.FRONTEND_URL, defaultFrontendUrl);
  let adminUrl = cleanUrl(process.env.ADMIN_URL, defaultAdminUrl);

  // CRITICAL SAFEGUARD: In production, reject localhost/127.0.0.1 overrides if accidentally copied from dev .env
  if (isProduction) {
    if (!frontendUrl || frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1')) {
      frontendUrl = PRODUCTION_MARKETPLACE_URL;
    }
    if (!adminUrl || adminUrl.includes('localhost') || adminUrl.includes('127.0.0.1')) {
      adminUrl = PRODUCTION_ADMIN_URL;
    }
  }

  const defaultVerificationUrl = `${frontendUrl}/auth/verify-email`;
  const defaultPasswordResetUrl = `${frontendUrl}/auth/reset-password`;

  let verificationUrl = cleanUrl(process.env.EMAIL_VERIFICATION_URL, defaultVerificationUrl);
  let passwordResetUrl = cleanUrl(process.env.PASSWORD_RESET_URL, defaultPasswordResetUrl);

  // CRITICAL SAFEGUARD: In production, ensure verification and reset URLs NEVER point to localhost or 127.0.0.1
  if (isProduction) {
    if (!verificationUrl || verificationUrl.includes('localhost') || verificationUrl.includes('127.0.0.1')) {
      verificationUrl = `${PRODUCTION_MARKETPLACE_URL}/auth/verify-email`;
    }
    if (!passwordResetUrl || passwordResetUrl.includes('localhost') || passwordResetUrl.includes('127.0.0.1')) {
      passwordResetUrl = `${PRODUCTION_MARKETPLACE_URL}/auth/reset-password`;
    }
  }

  return {
    port: parseInt(cleanString(process.env.PORT, '5000'), 10),
    nodeEnv,
    appName: cleanString(process.env.APP_NAME, 'CASA API Gateway'),
    appPrefix: cleanPrefix(process.env.APP_PREFIX, 'api/v1'),
    cors: {
      frontendUrl,
      adminUrl,
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
      adminMobiles: cleanString(process.env.ADMIN_MOBILES, '+919925843531'),
      otpExpiresInMinutes: parseInt(cleanString(process.env.OTP_EXPIRES_IN_MINUTES, '5'), 10),
      otpMaxAttempts: parseInt(cleanString(process.env.OTP_MAX_ATTEMPTS, '3'), 10),
      otpCooldownSeconds: parseInt(cleanString(process.env.OTP_COOLDOWN_SECONDS, '60'), 10),
      otpSecretSalt: cleanString(
        process.env.OTP_SECRET_SALT || process.env.OTP_HASH_SECRET,
        'casa_otp_salt_secret_dev',
      ),
    },
    sms: {
      provider: cleanString(process.env.SMS_PROVIDER, 'mock'),
      enableMockSms: cleanString(process.env.ENABLE_MOCK_SMS).toLowerCase() === 'true',
      mockOtpAllowedMobile: cleanString(process.env.MOCK_OTP_ALLOWED_MOBILE),
      msg91AuthKey: cleanString(process.env.MSG91_AUTH_KEY),
      msg91TemplateId: cleanString(process.env.MSG91_TEMPLATE_ID),
      msg91SenderId: cleanString(process.env.MSG91_SENDER_ID, 'CASARE'),
    },
    payments: {
      razorpayKeyId: cleanString(process.env.RAZORPAY_KEY_ID),
      razorpayKeySecret: cleanString(process.env.RAZORPAY_KEY_SECRET),
      razorpayWebhookSecret: cleanString(process.env.RAZORPAY_WEBHOOK_SECRET),
    },
    mail: {
      host: cleanString(process.env.SMTP_HOST),
      port: parseInt(cleanString(process.env.SMTP_PORT, '587'), 10),
      secure: cleanString(process.env.SMTP_SECURE).toLowerCase() === 'true',
      user: cleanString(process.env.SMTP_USER),
      pass: cleanString(process.env.SMTP_PASS),
      from: cleanString(process.env.EMAIL_FROM, '"CASA Real Estate" <no-reply@casarealestate.com>'),
      verificationUrl,
      passwordResetUrl,
      devLog: cleanString(process.env.EMAIL_DEV_LOG, 'true').toLowerCase() === 'true',
    },
  };
};

