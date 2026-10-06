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

    // Strict Production Hardening Check
    if (nodeEnv === 'production' || !enableMock) {
      this.logger.error('CRITICAL: Attempted to invoke MockOtpProvider in production or when disabled!');
      throw new ForbiddenException(
        'Mock SMS provider is disabled in production environment. A genuine SMS gateway must be configured.',
      );
    }

    // In development mode, log sanitized dispatch info
    const maskedMobile = options.normalizedMobile.replace(/(\+\d{2})(\d{3})\d{4}(\d{3})/, '$1 $2****$3');
    this.logger.warn(
      `[DEV MOCK SMS] Dispatched OTP [${options.otp}] to ${maskedMobile} (Valid for ${options.expiresInMinutes || 5} mins)`,
    );

    return {
      success: true,
      messageId: `mock_msg_${Date.now()}`,
      provider: this.name,
      isMock: true,
    };
  }
}
