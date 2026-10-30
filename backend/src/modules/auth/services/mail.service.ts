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
    const rawPass = this.configService.get<string>('mail.pass') || process.env.SMTP_PASS;
    return Boolean(host && user && rawPass);
  }

  private createNodemailerTransport(port = 587, secure = false): nodemailer.Transporter | null {
    const host = this.configService.get<string>('mail.host') || process.env.SMTP_HOST;
    const user = this.configService.get<string>('mail.user') || process.env.SMTP_USER;
    const rawPass = this.configService.get<string>('mail.pass') || process.env.SMTP_PASS;
    const pass = rawPass ? rawPass.replace(/\s+/g, '') : '';

    if (!host || !user || !pass) return null;

    return nodemailer.createTransport({
      host,
      port,
      secure: secure || port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: this.configService.get<string>('nodeEnv') === 'production',
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  private initTransporter() {
    const host = this.configService.get<string>('mail.host') || process.env.SMTP_HOST;
    const port = Number(this.configService.get<number>('mail.port') || process.env.SMTP_PORT) || 587;
    const secure = this.configService.get<boolean>('mail.secure') || process.env.SMTP_SECURE === 'true' || port === 465;
    const user = this.configService.get<string>('mail.user') || process.env.SMTP_USER;
    const rawPass = this.configService.get<string>('mail.pass') || process.env.SMTP_PASS;
    const pass = rawPass ? rawPass.replace(/\s+/g, '') : '';

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
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        });
        this.logger.log(`✅ SMTP Transporter initialized for host: ${host}:${port}`);

        this.transporter.verify((verifyErr) => {
          if (verifyErr) {
            this.logger.warn(
              `⚠️ SMTP credentials rejected by ${host} for user "${user}": ${verifyErr.message}. Ensure a valid Google App Password is configured.`,
            );
          } else {
            this.logger.log(`🎉 SMTP Authenticated successfully: Ready to dispatch from ${user}`);
          }
        });
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
      '"MyProperty" <info.mypropertyin@gmail.com>';

    const subject = 'Verify Your MyProperty Account';
    const html = this.buildVerificationEmailTemplate(name, verificationLink);
    const text = `Hello ${name || 'User'},\n\nWelcome to MyProperty — your trusted real estate marketplace!\n\nTo protect your account security, you must verify your email address before signing in.\n\nPlease verify and approve your account by visiting this link:\n${verificationLink}\n\nThis verification link will expire in 24 hours. If this link expires, you can request a new link from the MyProperty sign-in page.\n\nIf you did not register for a MyProperty account, please disregard this email.\n\nBest regards,\nTeam MyProperty\ninfo.mypropertyin@gmail.com`;

    if (this.isConfigured()) {
      if (!this.transporter) {
        this.initTransporter();
      }

      if (this.transporter) {
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
          this.logger.warn(`Primary SMTP delivery failed for ${to} (${err?.message}). Attempting Gmail SSL fallback...`);
          try {
            const fallbackTransporter = this.createNodemailerTransport(465, true);
            if (fallbackTransporter) {
              const fallbackInfo = await fallbackTransporter.sendMail({
                from,
                to,
                subject,
                text,
                html,
              });
              this.logger.log(`📧 Verification email successfully sent via SSL fallback to ${to} (Message ID: ${fallbackInfo.messageId})`);
              this.transporter = fallbackTransporter;
              return { success: true, messageId: fallbackInfo.messageId, isMock: false };
            }
          } catch (fallbackErr: any) {
            this.logger.error(`Fallback SMTP delivery also failed for ${to}: ${fallbackErr?.message}`);
          }
          this.logger.error(`SMTP delivery failed for ${to}: ${err?.message}`);
          return { success: false, isMock: false, error: err?.message };
        }
      }
    }

    this.logger.warn(`[SMTP UNCONFIGURED] Verification email for [${to}] was not sent because SMTP is unconfigured.`);
    return { success: false, isMock: true, error: 'SMTP delivery service is not configured' };
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
      '"MyProperty" <info.mypropertyin@gmail.com>';

    const subject = 'Reset Your MyProperty Password';
    const html = this.buildPasswordResetEmailTemplate(name, resetLink);
    const text = `Hello ${name || 'User'},\n\nWe received a request to reset your password for MyProperty Marketplace.\n\nReset your password by clicking this link:\n${resetLink}\n\nThis link is valid for 1 hour. If you did not make this request, please ignore this email.\n\nBest regards,\nThe MyProperty Security Team`;

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
      '"MyProperty" <info.mypropertyin@gmail.com>';

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
  <title>Verify Your MyProperty Account</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #0284c7 100%); padding: 36px 32px; text-align: center; }
    .logo-badge { display: inline-block; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(8px); padding: 8px 18px; border-radius: 30px; color: #ffffff; font-size: 13px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px; border: 1px solid rgba(255, 255, 255, 0.2); }
    .header h1 { margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.25; }
    .header p { margin: 8px 0 0 0; color: #e0f2fe; font-size: 14px; }
    .content { padding: 40px 36px; color: #334155; font-size: 15px; line-height: 1.65; }
    .greeting { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
    .welcome-intro { font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 16px; }
    .explanation-card { background: #f0f9ff; border: 1px solid #bae6fd; border-left: 4px solid #0284c7; padding: 16px 20px; border-radius: 12px; margin: 24px 0; font-size: 14px; color: #0369a1; line-height: 1.55; }
    .button-container { text-align: center; margin: 36px 0; }
    .button { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff !important; padding: 18px 44px; border-radius: 12px; font-size: 16px; font-weight: 800; text-decoration: none; display: inline-block; box-shadow: 0 6px 20px rgba(2, 132, 199, 0.35); letter-spacing: 0.3px; }
    .fallback-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin: 24px 0; word-break: break-all; }
    .fallback-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .fallback-url { font-size: 13px; color: #0284c7; text-decoration: underline; line-height: 1.5; }
    .security-notice { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px 18px; margin-top: 24px; font-size: 13px; color: #92400e; line-height: 1.5; }
    .signature { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #475569; }
    .footer { background: #f8fafc; padding: 24px 36px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge">MyProperty</div>
      <h1>Verify Your MyProperty Account</h1>
      <p>India's Trusted Real Estate Marketplace</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${safeName},</div>
      <p class="welcome-intro">
        Welcome to <strong>MyProperty</strong>! We are excited to have you join our marketplace for discovering, buying, renting, and listing verified properties.
      </p>
      
      <div class="explanation-card">
        🛡️ <strong>Action Required:</strong> To protect your account security and activate your marketplace access, you must verify your email address before signing in.
      </div>

      <div class="button-container">
        <a href="${link}" class="button" target="_blank" rel="noopener noreferrer">Verify &amp; Approve Account</a>
      </div>

      <div class="fallback-card">
        <div class="fallback-label">Alternative Plain-Text Link</div>
        <div class="fallback-url">
          <a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a>
        </div>
      </div>

      <div class="security-notice">
        ⏳ <strong>Expiry &amp; Resend:</strong> This secure verification link is valid for <strong>24 hours</strong>. If the link expires before you verify, you can request a new verification email from the MyProperty sign-in page.
      </div>

      <div class="signature">
        Warm regards,<br>
        <strong>Team MyProperty</strong><br>
        Official Sender: <a href="mailto:info.mypropertyin@gmail.com" style="color: #0284c7; text-decoration: none;">info.mypropertyin@gmail.com</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} MyProperty Real Estate Marketplace. All rights reserved.<br>
      If you did not create an account on MyProperty, please ignore this email or contact support at info.mypropertyin@gmail.com.
    </div>
  </div>
</body>
</html>`.trim();
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
  async sendKycApprovedEmail(to: string, name: string): Promise<SendMailResult> {
    const from = this.configService.get<string>('mail.from') || '"MyProperty" <info.mypropertyin@gmail.com>';

    const subject = 'Congratulations! Your My Property KYC Verification is Approved';
    const text = `Hello ${name || 'User'},\n\nYour KYC verification application has been approved by the Super Admin.\n\nYou are now eligible to claim your 3-Month Free Plan with up to 15 property listings for ₹0.\n\nPlease visit your dashboard to claim your free plan and start publishing properties:\n${cleanUrl(this.configService.get<string>('cors.frontendUrl'), 'http://localhost:3000')}/dashboard\n\nBest regards,\nThe My Property Compliance Team`;

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
    const from = this.configService.get<string>('mail.from') || '"MyProperty" <info.mypropertyin@gmail.com>';

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
    const from = this.configService.get<string>('mail.from') || '"MyProperty" <info.mypropertyin@gmail.com>';

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
    const from = this.configService.get<string>('mail.from') || '"MyProperty" <info.mypropertyin@gmail.com>';

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
    const from = this.configService.get<string>('mail.from') || '"MyProperty" <info.mypropertyin@gmail.com>';

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
