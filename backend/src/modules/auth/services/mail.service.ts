import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  isMock?: boolean;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
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
   * Dispatches an account activation & email verification link
   */
  async sendVerificationEmail(to: string, name: string, token: string): Promise<SendMailResult> {
    const baseUrl =
      this.configService.get<string>('mail.verificationUrl') ||
      'http://localhost:3000/auth/verify-email';
    const verificationLink = `${baseUrl}?token=${encodeURIComponent(token)}&email=${encodeURIComponent(to)}`;
    const from = this.configService.get<string>('mail.from') || '"CASA Real Estate" <no-reply@casarealestate.com>';
    const isProduction = this.configService.get<string>('nodeEnv') === 'production';

    const subject = 'Activate Your CASA Account — Verify Email';
    const html = this.buildVerificationEmailTemplate(name, verificationLink);
    const text = `Hello ${name || 'User'},\n\nThank you for joining CASA Real Estate Marketplace.\n\nPlease verify your email address by visiting this link:\n${verificationLink}\n\nThis verification link will expire in 24 hours.\n\nBest regards,\nThe CASA Team`;

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
        this.logger.error(`SMTP delivery failed for ${to}: ${err?.message}`);
        if (isProduction) {
          throw new InternalServerErrorException('Failed to deliver verification email. Please try again later.');
        }
      }
    }

    if (isProduction) {
      this.logger.error(`Cannot send verification email to ${to}: SMTP is not configured in production.`);
      throw new InternalServerErrorException('Email delivery service is currently unavailable.');
    }

    // Development fallback logger
    this.logger.warn(
      `[DEV EMAIL DISPATCH] Verification Email for [${to}]\n` +
      `Recipient: ${name} <${to}>\n` +
      `Verification Link: ${verificationLink}\n` +
      `Token: ${token}`
    );

    return { success: true, messageId: `dev_mock_${Date.now()}`, isMock: true };
  }

  /**
   * Dispatches a secure password reset link
   */
  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<SendMailResult> {
    const baseUrl =
      this.configService.get<string>('mail.passwordResetUrl') ||
      'http://localhost:3000/auth/reset-password';
    const resetLink = `${baseUrl}?token=${encodeURIComponent(token)}&email=${encodeURIComponent(to)}`;
    const from = this.configService.get<string>('mail.from') || '"CASA Real Estate" <no-reply@casarealestate.com>';
    const isProduction = this.configService.get<string>('nodeEnv') === 'production';

    const subject = 'Reset Your CASA Password';
    const html = this.buildPasswordResetEmailTemplate(name, resetLink);
    const text = `Hello ${name || 'User'},\n\nWe received a request to reset your password for CASA Real Estate Marketplace.\n\nReset your password by clicking this link:\n${resetLink}\n\nThis link is valid for 1 hour. If you did not make this request, please ignore this email.\n\nBest regards,\nThe CASA Security Team`;

    if (this.transporter) {
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
        if (isProduction) {
          throw new InternalServerErrorException('Failed to deliver password reset email. Please try again later.');
        }
      }
    }

    if (isProduction) {
      this.logger.error(`Cannot send password reset email to ${to}: SMTP is not configured in production.`);
      throw new InternalServerErrorException('Email delivery service is currently unavailable.');
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

  private buildVerificationEmailTemplate(name: string, link: string): string {
    const safeName = name ? name.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Valued User';
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Email - CASA Real Estate</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #0284c7; padding: 32px 24px; text-align: center; }
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
      <h1>CASA Real Estate</h1>
    </div>
    <div class="content">
      <div class="greeting">Welcome, ${safeName}!</div>
      <p>Thank you for registering on <strong>CASA Real Estate Marketplace</strong>. To complete your registration and activate your account, please verify your email address.</p>
      <div class="button-container">
        <a href="${link}" class="button" target="_blank">Verify Email &amp; Activate Account</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 13px; color: #0284c7;"><a href="${link}">${link}</a></p>
      <div class="notice">
        This verification link will expire in <strong>24 hours</strong>. If you did not create an account on CASA, please disregard this email.
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} CASA Real Estate Marketplace. All rights reserved.
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
  <title>Reset Password - CASA Real Estate</title>
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
      <h1>CASA Security</h1>
    </div>
    <div class="content">
      <div class="greeting">Hello, ${safeName}</div>
      <p>We received a request to reset your password for your CASA Real Estate account. Click the button below to choose a new, secure password.</p>
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
      &copy; ${new Date().getFullYear()} CASA Real Estate Marketplace. Security &amp; Trust.
    </div>
  </div>
</body>
</html>`;
  }
}
