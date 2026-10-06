import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IOtpProvider,
  SendOtpOptions,
  SendOtpResult,
} from '../interfaces/otp-provider.interface';

@Injectable()
export class Msg91OtpProvider implements IOtpProvider {
  readonly name = 'msg91';
  private readonly logger = new Logger(Msg91OtpProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async sendOtp(options: SendOtpOptions): Promise<SendOtpResult> {
    const authKey = this.configService.get<string>('sms.msg91AuthKey');
    const templateId = options.templateId || this.configService.get<string>('sms.msg91TemplateId');

    if (!authKey) {
      this.logger.warn(
        'MSG91_AUTH_KEY is not configured. Real SMS transmission cannot proceed via MSG91.',
      );
      return {
        success: false,
        provider: this.name,
        error: 'MSG91 gateway credentials not configured on server.',
      };
    }

    try {
      // MSG91 OTP API Integration
      // Format mobile (strip leading + for MSG91 Indian format if required)
      const cleanMobile = options.normalizedMobile.replace('+', '');
      const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${cleanMobile}&otp=${options.otp}&otp_expiry=${options.expiresInMinutes || 5}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          authkey: authKey,
          'Content-Type': 'application/json',
        },
      });

      const data = (await response.json()) as { type?: string; message?: string; request_id?: string };

      if (response.ok && data.type !== 'error') {
        return {
          success: true,
          messageId: data.request_id || `msg91_${Date.now()}`,
          provider: this.name,
        };
      }

      this.logger.error(`MSG91 API error: ${data.message || response.statusText}`);
      return {
        success: false,
        provider: this.name,
        error: data.message || 'Failed to dispatch OTP via MSG91',
      };
    } catch (error: any) {
      this.logger.error(`MSG91 transmission exception: ${error.message}`);
      return {
        success: false,
        provider: this.name,
        error: error.message || 'SMS gateway network error',
      };
    }
  }
}
