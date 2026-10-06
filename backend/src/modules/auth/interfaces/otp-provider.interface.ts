export interface SendOtpOptions {
  mobile: string;
  normalizedMobile: string;
  otp: string;
  templateId?: string;
  expiresInMinutes?: number;
}

export interface SendOtpResult {
  success: boolean;
  messageId?: string;
  provider: string;
  isMock?: boolean;
  error?: string;
}

export interface IOtpProvider {
  readonly name: string;
  sendOtp(options: SendOtpOptions): Promise<SendOtpResult>;
}
