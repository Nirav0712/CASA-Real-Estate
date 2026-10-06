import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IOtpProvider,
  SendOtpOptions,
  SendOtpResult,
} from '../interfaces/otp-provider.interface';

@Injectable()
export class MockOtpProvider implements IOtpProvider {
  readonly name = 'mock';
  private readonly logger = new Logger(MockOtpProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async sendOtp(options: SendOtpOptions): Promise<SendOtpResult> {
    const nodeEnv = this.configService.get<string>('nodeEnv') || 'development';
    const enableMock = this.configService.get<boolean>('sms.enableMockSms');
    const allowedMobileRaw = this.configService.get<string>('sms.mockOtpAllowedMobile') || '';
    const isProduction = nodeEnv === 'production';

    // Strict Production Hardening Check
    if (isProduction) {
      if (!enableMock) {
        this.logger.error('CRITICAL: Attempted to invoke MockOtpProvider in production without ENABLE_MOCK_SMS=true!');
        throw new ForbiddenException(
          'Mock SMS provider is disabled in production environment. A genuine SMS gateway must be configured.',
        );
      }

      if (!allowedMobileRaw) {
        this.logger.error('CRITICAL: Production mock SMS is enabled but MOCK_OTP_ALLOWED_MOBILE is not configured!');
        throw new ForbiddenException(
          'Production mock OTP requires MOCK_OTP_ALLOWED_MOBILE to be configured for authorized testing.',
        );
      }

      // Normalize digits for strict whitelist matching
      const cleanAllowed = allowedMobileRaw.replace(/\D/g, '');
      const cleanTarget = options.normalizedMobile.replace(/\D/g, '');

      const isMatch =
        cleanAllowed === cleanTarget ||
        (cleanAllowed.length >= 10 && cleanTarget.endsWith(cleanAllowed.slice(-10)));

      if (!isMatch) {
        this.logger.warn(
          `Unauthorized mobile attempted to use production mock OTP: ${options.normalizedMobile}`,
        );
        throw new ForbiddenException(
          'Mock OTP is restricted to authorized test numbers in production environment.',
        );
      }

      this.logger.warn(
        `[PROD TEST MOCK SMS] Authorized test OTP dispatched for mobile [${options.normalizedMobile}]`,
      );
    } else {
      // In development mode, log sanitized dispatch info
      const maskedMobile = options.normalizedMobile.replace(/(\+\d{2})(\d{3})\d{4}(\d{3})/, '$1 $2****$3');
      this.logger.warn(
        `[DEV MOCK SMS] Dispatched OTP [${options.otp}] to ${maskedMobile} (Valid for ${options.expiresInMinutes || 5} mins)`,
      );
    }

    return {
      success: true,
      messageId: `mock_msg_${Date.now()}`,
      provider: this.name,
      isMock: true,
    };
  }
}
