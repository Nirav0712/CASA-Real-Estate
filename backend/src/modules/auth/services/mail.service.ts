import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  isMock?: boolean;
  error?: string;
}

function cleanUrl(val?: string, defaultVal = ''): string {
  if (!val) return defaultVal;
  const unquoted = val.trim().replace(/^["']|["']$/g, '').trim();
  const stripped = unquoted.replace(/\/+$/, '').trim();
  return stripped || defaultVal;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
  }

  isConfigured(): boolean {
    const host = this.configService.get<string>('mail.host') || process.env.SMTP_HOST;
    const user = this.configService.get<string>('mail.user') || process.env.SMTP_USER;
    const pass = this.configService.get<string>('mail.pass') || process.env.SMTP_PASS;
    return Boolean(host && user && pass);
  }

  private initTransporter() {
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port') || 587;
    const secure = this.configService.get<boolean>('mail.secure') || false;
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.pass');

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
          tls: {
            rejectUnauthorized: this.configService.get<string>('nodeEnv') === 'production',
          },
        });
        this.logger.log(`✅ SMTP Transporter initialized for host: ${host}:${port}`);
      } catch (err: any) {
        this.logger.error(`Failed to initialize SMTP transporter: ${err?.message}`);
        this.transporter = null;
      }
    } else {
      const isProduction = this.configService.get<string>('nodeEnv') === 'production';
      if (isProduction) {
        this.logger.error('CRITICAL: SMTP credentials are not configured in production environment.');
      } else {
        this.logger.warn('ℹ️ SMTP credentials omitted in dev. Transactional emails will log to terminal.');
      }
    }
  }

  /**
   * Resolves the base URL for email verification links based on environment and config
   */
  getVerificationBaseUrl(): string {
    const nodeEnv = (this.configService.get<string>('nodeEnv') || process.env.NODE_ENV || 'development').toLowerCase();
    const envUrl = cleanUrl(process.env.EMAIL_VERIFICATION_URL);
    const configUrl = cleanUrl(this.configService.get<string>('mail.verificationUrl'));
    const frontendUrl = cleanUrl(this.configService.get<string>('cors.frontendUrl') || process.env.FRONTEND_URL);

    const isProduction =
      nodeEnv === 'production' ||
      Boolean(process.env.HOSTINGER) ||
      (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) ||
      (frontendUrl && !frontendUrl.includes('localhost') && !frontendUrl.includes('127.0.0.1'));

    let selectedBaseUrl = '';

    if (isProduction) {
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        selectedBaseUrl = envUrl;
      } else if (configUrl && !configUrl.includes('localhost') && !configUrl.includes('127.0.0.1')) {
        selectedBaseUrl = configUrl;
      } else if (frontendUrl && !frontendUrl.includes('localhost') && !frontendUrl.includes('127.0.0.1')) {
        selectedBaseUrl = `${frontendUrl}/auth/verify-email`;
      } else {
        selectedBaseUrl = 'https://casa-real-estate-mocha.vercel.app/auth/verify-email';
      }
    } else {
      selectedBaseUrl = envUrl || configUrl || 'http://localhost:3000/auth/verify-email';
    }

    this.logger.log(
      `[MailService Diagnosis] Selected Verification Base URL: "${selectedBaseUrl}" (isProduction=${isProduction}, nodeEnv="${nodeEnv}")`,
    );

    return selectedBaseUrl;
  }

  /**
   * Resolves the base URL for password reset links based on environment and config
   */
  getPasswordResetBaseUrl(): string {
    const nodeEnv = (this.configService.get<string>('nodeEnv') || process.env.NODE_ENV || 'development').toLowerCase();
    const envUrl = cleanUrl(process.env.PASSWORD_RESET_URL);
    const configUrl = cleanUrl(this.configService.get<string>('mail.passwordResetUrl'));
    const frontendUrl = cleanUrl(this.configService.get<string>('cors.frontendUrl') || process.env.FRONTEND_URL);

    const isProduction =
      nodeEnv === 'production' ||
      Boolean(process.env.HOSTINGER) ||
      (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) ||
      (frontendUrl && !frontendUrl.includes('localhost') && !frontendUrl.includes('127.0.0.1'));

    let selectedBaseUrl = '';

    if (isProduction) {
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        selectedBaseUrl = envUrl;
      } else if (configUrl && !configUrl.includes('localhost') && !configUrl.includes('127.0.0.1')) {
        selectedBaseUrl = configUrl;
      } else if (frontendUrl && !frontendUrl.includes('localhost') && !frontendUrl.includes('127.0.0.1')) {
        selectedBaseUrl = `${frontendUrl}/auth/reset-password`;
      } else {
        selectedBaseUrl = 'https://casa-real-estate-mocha.vercel.app/auth/reset-password';
      }
    } else {
      selectedBaseUrl = envUrl || configUrl || 'http://localhost:3000/auth/reset-password';
    }

    this.logger.log(
      `[MailService Diagnosis] Selected Password Reset Base URL: "${selectedBaseUrl}" (isProduction=${isProduction}, nodeEnv="${nodeEnv}")`,
    );

    return selectedBaseUrl;
  }

  /**
   * Generates a fully qualified, URL-encoded verification link
   */
  generateVerificationLink(email: string, token: string): string {
    const baseUrl = this.getVerificationBaseUrl();
    const url = new URL(baseUrl);
    url.searchParams.set('token', token);
    url.searchParams.set('email', email);
    return url.toString();
  }

  /**
   * Generates a fully qualified, URL-encoded password reset link
   */
  generatePasswordResetLink(email: string, token: string): string {
    const baseUrl = this.getPasswordResetBaseUrl();
    const url = new URL(baseUrl);
    url.searchParams.set('token', token);
    url.searchParams.set('email', email);
    return url.toString();
  }

  /**
   * Dispatches an account activation & email verification link
   */
  async sendVerificationEmail(to: string, name: string, token: string): Promise<SendMailResult> {
    const verificationLink = this.generateVerificationLink(to, token);
    const from =
      this.configService.get<string>('mail.from') ||
      process.env.MAIL_FROM ||
      process.env.EMAIL_FROM ||
      '"My Property" <info.mypropertyin@gmail.com>';

    const subject = 'Activate Your My Property Account — Verify Email';
    const html = this.buildVerificationEmailTemplate(name, verificationLink);
    const text = `Hello ${name || 'User'},\n\nThank you for joining My Property.\n\nPlease verify your email address by visiting this link:\n${verificationLink}\n\nThis verification link will expire in 24 hours.\n\nBest regards,\nThe My Property Team`;

    if (this.transporter && this.isConfigured()) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to,
          subject,
          text,
          html,
        });
        this.logger.log(`📧 Verification email successfully sent to ${to} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId, isMock: false };
      } catch (err: any) {
        this.logger.error(`SMTP delivery failed for ${to}: ${err?.message}`);
        this.logger.warn(`[VERIFICATION LINK FALLBACK] User: ${to} | Verification Link: ${verificationLink}`);
        return { success: false, isMock: false, error: err?.message };
      }
    }

    this.logger.warn(
      `[DEV EMAIL DISPATCH] Verification email for [${to}]:\n` +
      `Verification Link: ${verificationLink}\n` +
      `Token: ${token}`
    );
    return { success: true, messageId: `dev_mock_${Date.now()}`, isMock: true };
  }

  /**
   * Dispatches a secure password reset link
   */
  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<SendMailResult> {
    const resetLink = this.generatePasswordResetLink(to, token);
    const from =
      this.configService.get<string>('mail.from') ||
      process.env.MAIL_FROM ||
      process.env.EMAIL_FROM ||
      '"My Property" <info.mypropertyin@gmail.com>';

    const subject = 'Reset Your My Property Password';
    const html = this.buildPasswordResetEmailTemplate(name, resetLink);
    const text = `Hello ${name || 'User'},\n\nWe received a request to reset your password for My Property Marketplace.\n\nReset your password by clicking this link:\n${resetLink}\n\nThis link is valid for 1 hour. If you did not make this request, please ignore this email.\n\nBest regards,\nThe My Property Security Team`;

    if (this.transporter && this.isConfigured()) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to,
          subject,
          text,
          html,
        });
        this.logger.log(`📧 Password reset email sent to ${to} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId, isMock: false };
      } catch (err: any) {
        this.logger.error(`SMTP password reset delivery failed for ${to}: ${err?.message}`);
        this.logger.warn(`[PASSWORD RESET LINK FALLBACK] User: ${to} | Reset Link: ${resetLink}`);
        return { success: false, isMock: false, error: err?.message };
      }
    }

    // Development fallback logger
    this.logger.warn(
      `[DEV EMAIL DISPATCH] Password Reset Email for [${to}]\n` +
      `Recipient: ${name} <${to}>\n` +
      `Password Reset Link: ${resetLink}\n` +
      `Token: ${token}`
    );

    return { success: true, messageId: `dev_mock_${Date.now()}`, isMock: true };
  }

  /**
   * Dispatches a welcome email to newly registered users
   */
  async sendWelcomeEmail(to: string, userName: string): Promise<SendMailResult> {
    const from =
      this.configService.get<string>('mail.from') ||
      process.env.MAIL_FROM ||
      process.env.EMAIL_FROM ||
      '"My Property" <info.mypropertyin@gmail.com>';

    const subject = 'Welcome to MyProperty!';
    const html = this.buildWelcomeEmailTemplate(userName);
    const text = `Hello ${userName || 'User'},\n\nWelcome to MyProperty!\n\nThank you for joining MyProperty, your platform for discovering and listing properties.\n\nYour account has been successfully created. You can now sign in to your account and explore MyProperty.\n\nWe're happy to have you with us!\n\nBest regards,\nTeam MyProperty\nMyProperty`;

    if (this.transporter && this.isConfigured()) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to,
          subject,
          text,
          html,
        });
        this.logger.log(`📧 Welcome email successfully sent to ${to} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId, isMock: false };
      } catch (err: any) {
        this.logger.error(`SMTP delivery failed for welcome email to ${to}: ${err?.message}`);
        return { success: false, isMock: false, error: err?.message };
      }
    }

    this.logger.warn(`[SMTP UNCONFIGURED] Welcome email for [${to}] was not sent because SMTP is unconfigured.`);
    return { success: false, isMock: true, error: 'SMTP delivery service is not configured' };
  }

  private buildWelcomeEmailTemplate(userName: string): string {
    const safeName = userName ? userName.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'User';
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to MyProperty!</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 36px 24px; text-align: center; }
    .logo-badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 30px; color: #ffffff; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .content { padding: 36px 32px; color: #334155; font-size: 15px; line-height: 1.6; }
    .greeting { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
    .message { font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 20px; }
    .signature { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; color: #475569; font-size: 15px; line-height: 1.6; }
    .footer { background: #f8fafc; padding: 24px 32px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge">MyProperty</div>
      <h1>Welcome to MyProperty!</h1>
    </div>
    <div class="content">
      <div class="greeting">Hello ${safeName},</div>
      <p class="message"><strong>Welcome to MyProperty!</strong></p>
      <p class="message">Thank you for joining MyProperty, your platform for discovering and listing properties.</p>
      <p class="message">Your account has been successfully created. You can now sign in to your account and explore MyProperty.</p>
      <p class="message">We're happy to have you with us!</p>
      <div class="signature">
        Best regards,<br>
        <strong>Team MyProperty</strong><br>
        MyProperty
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} MyProperty Marketplace. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`.trim();
  }

  private buildVerificationEmailTemplate(name: string, link: string): string {
    const safeName = name ? name.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Valued User';
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email - My Property</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 36px 24px; text-align: center; }
    .logo-badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 30px; color: #ffffff; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .content { padding: 36px 32px; color: #334155; font-size: 15px; line-height: 1.6; }
    .greeting { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
    .info-card { background: #f8fafc; border-left: 4px solid #0284c7; padding: 16px 20px; border-radius: 8px; margin: 24px 0; font-size: 14px; color: #475569; }
    .button-container { text-align: center; margin: 32px 0; }
    .button { background: linear-gradient(135deg, #0284c7 0%, #026ca3 100%); color: #ffffff !important; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35); }
    .device-note { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px 18px; margin-top: 24px; font-size: 13px; color: #1e40af; line-height: 1.5; }
    .notice { font-size: 13px; color: #64748b; margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
    .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge">My Property</div>
      <h1>Confirm Your Email Address</h1>
    </div>
    <div class="content">
      <div class="greeting">Hello ${safeName},</div>
      <p>Thank you for registering on <strong>My Property Marketplace</strong>. To complete your registration and activate your account, please confirm your email address by clicking the button below:</p>
      
      <div class="button-container">
        <a href="${link}" class="button" target="_blank">Confirm Email &amp; Activate Account</a>
      </div>

      <div class="device-note">
        💡 <strong>Note:</strong> Once you click this confirmation button, your account will be activated immediately and you can log in to your dashboard from your computer or any web browser.
      </div>

      <p style="margin-top: 24px;">If the button above does not work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 13px; color: #0284c7;"><a href="${link}">${link}</a></p>

      <div class="notice">
        This confirmation link will expire in <strong>24 hours</strong>. If you did not create an account on My Property, please disregard this email.
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} My Property Marketplace. All rights reserved.
    </div>
  </div>
</body>
</html>`;
  }

  private buildPasswordResetEmailTemplate(name: string, link: string): string {
    const safeName = name ? name.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Valued User';
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - My Property</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #0f172a; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .content { padding: 32px 28px; color: #334155; font-size: 15px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
    .button-container { text-align: center; margin: 32px 0; }
    .button { background: #0284c7; color: #ffffff !important; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 600; text-decoration: none; display: inline-block; }
    .notice { font-size: 13px; color: #64748b; margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>My Property Security</h1>
    </div>
    <div class="content">
      <div class="greeting">Hello, ${safeName}</div>
      <p>We received a request to reset your password for your My Property account. Click the button below to choose a new, secure password.</p>
      <div class="button-container">
        <a href="${link}" class="button" target="_blank">Reset Password</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 13px; color: #0284c7;"><a href="${link}">${link}</a></p>
      <div class="notice">
        This link is valid for <strong>1 hour</strong>. If you did not request a password reset, please ensure your account remains secure and ignore this email.
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} My Property Marketplace. Security &amp; Trust.
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Dispatches KYC Approval Email only if properly configured
   */
  async sendKycApprovedEmail(to: string, name: string, trialExpiresAt?: Date): Promise<SendMailResult> {
    const from = this.configService.get<string>('mail.from') || '"My Property" <info.mypropertyin@gmail.com>';

    const expiryStr = trialExpiresAt
      ? trialExpiresAt.toLocaleDateString('en-IN', {
          dateStyle: 'full',
          timeZone: 'Asia/Kolkata',
        })
      : 'in 3 days';

    const subject = 'Congratulations! Your My Property KYC Verification is Approved';
    const text = `Hello ${name || 'User'},\n\nYour KYC verification application has been approved by the Super Admin.\n\nYour 3-Day Free Trial is now active until: ${expiryStr}.\n\nYou can access your dashboard and publish listings at: ${cleanUrl(this.configService.get<string>('cors.frontendUrl'), 'http://localhost:3000')}/dashboard\n\nBest regards,\nThe My Property Compliance Team`;

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to,
          subject,
          text,
        });
        this.logger.log(`📧 KYC approved email sent to ${to} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId, isMock: false };
      } catch (err: any) {
        this.logger.error(`SMTP KYC approved delivery failed for ${to}: ${err?.message}`);
        return { success: false, isMock: false, error: err.message };
      }
    }

    // SMTP not configured - log for development but do NOT fake success
    this.logger.warn(`[SMTP UNCONFIGURED] KYC Approved email for [${to}] was not sent because SMTP is unconfigured.`);
    return { success: false, isMock: true, error: 'SMTP delivery service is not configured' };
  }

  /**
   * Dispatches KYC Rejection Email only if properly configured
   */
  async sendKycRejectedEmail(to: string, name: string, reason: string): Promise<SendMailResult> {
    const from = this.configService.get<string>('mail.from') || '"My Property" <info.mypropertyin@gmail.com>';

    const subject = 'My Property KYC Verification Update — Action Required';
    const text = `Hello ${name || 'User'},\n\nWe reviewed your KYC verification documents, but were unable to approve them due to the following reason:\n\n${reason}\n\nPlease visit your dashboard to upload corrected documents:\n${cleanUrl(this.configService.get<string>('cors.frontendUrl'), 'http://localhost:3000')}/dashboard/kyc\n\nBest regards,\nThe My Property Compliance Team`;

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to,
          subject,
          text,
        });
        this.logger.log(`📧 KYC rejection email sent to ${to} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId, isMock: false };
      } catch (err: any) {
        this.logger.error(`SMTP KYC rejection delivery failed for ${to}: ${err?.message}`);
        return { success: false, isMock: false, error: err.message };
      }
    }

    // SMTP not configured - log for development but do NOT fake success
    this.logger.warn(`[SMTP UNCONFIGURED] KYC Rejection email for [${to}] was not sent because SMTP is unconfigured.`);
    return { success: false, isMock: true, error: 'SMTP delivery service is not configured' };
  }

  /**
   * Dispatches Subscription Request Received Confirmation Email
   */
  async sendSubscriptionRequestReceivedEmail(
    to: string,
    name: string,
    planName: string,
    price: number,
    billingPeriod: string,
    requestReference: string,
  ): Promise<SendMailResult> {
    const from = this.configService.get<string>('mail.from') || '"My Property" <info.mypropertyin@gmail.com>';

    const subject = `Subscription Request Received: ${planName} — My Property`;
    const text = `Hello ${name || 'User'},\n\nWe have received your subscription request for the ${planName} plan (₹${price.toLocaleString('en-IN')} / ${billingPeriod.toLowerCase()}).\n\nYour Request Reference is: ${requestReference}\n\nOur sales & operations team will review and activate your subscription shortly.\n\nBest regards,\nThe My Property Team`;

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to,
          subject,
          text,
        });
        this.logger.log(`📧 Subscription request confirmation email sent to ${to} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId, isMock: false };
      } catch (err: any) {
        this.logger.error(`SMTP subscription request confirmation delivery failed for ${to}: ${err?.message}`);
        return { success: false, isMock: false, error: err.message };
      }
    }

    this.logger.warn(`[SMTP UNCONFIGURED] Subscription Request confirmation email for [${to}] was not sent because SMTP is unconfigured.`);
    return { success: false, isMock: true, error: 'SMTP delivery service is not configured' };
  }

  /**
   * Dispatches Subscription Plan Approved & Activated Email
   */
  async sendSubscriptionApprovedEmail(
    to: string,
    name: string,
    planName: string,
    expiryDate: Date,
    requestReference: string,
  ): Promise<SendMailResult> {
    const from = this.configService.get<string>('mail.from') || '"My Property" <info.mypropertyin@gmail.com>';

    const expiryStr = expiryDate
      ? expiryDate.toLocaleDateString('en-IN', {
          dateStyle: 'full',
          timeZone: 'Asia/Kolkata',
        })
      : 'Active';

    const subject = `Your ${planName} Subscription is Approved & Active! — My Property`;
    const text = `Hello ${name || 'User'},\n\nGreat news! Your subscription request (${requestReference}) for the ${planName} plan has been APPROVED by the Super Admin.\n\nYour subscription entitlements are now active.\nPlan Validity: until ${expiryStr}.\n\nYou can access your dashboard and listing quotas at: ${cleanUrl(this.configService.get<string>('cors.frontendUrl'), 'http://localhost:3000')}/dashboard\n\nThank you for choosing My Property!\n\nBest regards,\nThe My Property Team`;

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to,
          subject,
          text,
        });
        this.logger.log(`📧 Subscription approved email sent to ${to} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId, isMock: false };
      } catch (err: any) {
        this.logger.error(`SMTP subscription approval delivery failed for ${to}: ${err?.message}`);
        return { success: false, isMock: false, error: err.message };
      }
    }

    this.logger.warn(`[SMTP UNCONFIGURED] Subscription approved email for [${to}] was not sent because SMTP is unconfigured.`);
    return { success: false, isMock: true, error: 'SMTP delivery service is not configured' };
  }

  /**
   * Dispatches Subscription Plan Rejected/Declined Email
   */
  async sendSubscriptionRejectedEmail(
    to: string,
    name: string,
    planName: string,
    reason: string,
    requestReference: string,
  ): Promise<SendMailResult> {
    const from = this.configService.get<string>('mail.from') || '"My Property" <info.mypropertyin@gmail.com>';

    const subject = `Subscription Request Update: ${planName} — My Property`;
    const text = `Hello ${name || 'User'},\n\nWe reviewed your subscription request (${requestReference}) for the ${planName} plan, but were unable to approve it at this time.\n\nReason: ${reason}\n\nIf you have questions or wish to explore alternative plans, please contact our support team or connect via WhatsApp.\n\nBest regards,\nThe My Property Team`;

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to,
          subject,
          text,
        });
        this.logger.log(`📧 Subscription declined email sent to ${to} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId, isMock: false };
      } catch (err: any) {
        this.logger.error(`SMTP subscription declined delivery failed for ${to}: ${err?.message}`);
        return { success: false, isMock: false, error: err.message };
      }
    }

    this.logger.warn(`[SMTP UNCONFIGURED] Subscription declined email for [${to}] was not sent because SMTP is unconfigured.`);
    return { success: false, isMock: true, error: 'SMTP delivery service is not configured' };
  }
}
