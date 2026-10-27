import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WhatsAppSendResult {
  success: boolean;
  status: 'SENT' | 'FAILED' | 'MOCK_SENT' | 'DISABLED';
  messageId?: string;
  error?: string;
  recipient?: string;
  sentAt?: Date;
}

export interface LeadWhatsAppPayload {
  leadId: string;
  propertyId: string;
  propertyTitle: string;
  propertySlug?: string;
  propertyUrl?: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  message: string;
  advertiserPhone?: string;
  enquiryDate?: Date;
}

export interface KycWhatsAppPayload {
  userId: string;
  customerName: string;
  customerMobile: string;
  accountType: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  reason?: string;
  trialExpiresAt?: Date;
}

export interface PackageChangeWhatsAppPayload {
  userId: string;
  customerName: string;
  customerMobile: string;
  accountType: string;
  packageName: string;
  validUntil?: Date;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly configService: ConfigService) {}

  private get enabled(): boolean {
    return this.configService.get<boolean>('whatsapp.enabled') ?? true;
  }

  private get provider(): string {
    return (this.configService.get<string>('whatsapp.provider') || 'mock').toLowerCase();
  }

  private get leadDestinationNumber(): string {
    return (
      this.configService.get<string>('whatsapp.leadDestinationNumber') ||
      '+917069754589'
    );
  }

  private get verificationCallNumber(): string {
    return (
      this.configService.get<string>('whatsapp.verificationCallNumber') ||
      '7069754589'
    );
  }

  private get apiUrl(): string {
    return (
      this.configService.get<string>('whatsapp.apiUrl') ||
      'https://graph.facebook.com/v19.0'
    );
  }

  private get accessToken(): string {
    return this.configService.get<string>('whatsapp.accessToken') || '';
  }

  private get phoneNumberId(): string {
    return this.configService.get<string>('whatsapp.phoneNumberId') || '';
  }

  private get frontendUrl(): string {
    return (
      this.configService.get<string>('cors.frontendUrl') ||
      'http://localhost:3000'
    );
  }

  /**
   * Format phone number to clean E.164 (e.g. +919925843531)
   */
  public formatMobileNumber(mobile: string): string {
    if (!mobile) return '';
    let cleaned = mobile.trim().replace(/[\s\-\(\)]/g, '');
    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 10) {
        cleaned = `+91${cleaned}`;
      } else if (cleaned.startsWith('91') && cleaned.length === 12) {
        cleaned = `+${cleaned}`;
      } else if (cleaned.startsWith('0') && cleaned.length === 11) {
        cleaned = `+91${cleaned.slice(1)}`;
      } else {
        cleaned = `+${cleaned}`;
      }
    }
    return cleaned;
  }

  /**
   * Send WhatsApp Property Lead Notification
   */
  async sendLeadNotification(payload: LeadWhatsAppPayload): Promise<WhatsAppSendResult> {
    if (!this.enabled) {
      this.logger.log(`WhatsApp disabled. Skipping lead notification for lead ${payload.leadId}`);
      return { success: true, status: 'DISABLED', recipient: this.leadDestinationNumber };
    }

    const propUrl =
      payload.propertyUrl ||
      `${this.frontendUrl}/property/${payload.propertySlug || payload.propertyId}`;

    const dateStr = (payload.enquiryDate || new Date()).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const messageText =
      `*New My Property Property Enquiry Received!*\n\n` +
      `*Property:* ${payload.propertyTitle}\n` +
      `*Property ID:* ${payload.propertyId}\n` +
      `*Property Link:* ${propUrl}\n\n` +
      `*Customer Details:*\n` +
      `*Name:* ${payload.customerName}\n` +
      `*Mobile:* ${payload.customerMobile}\n` +
      (payload.customerEmail ? `*Email:* ${payload.customerEmail}\n` : '') +
      `*Date:* ${dateStr}\n\n` +
      `*Enquiry Message:*\n"${payload.message}"\n\n` +
      `_Please respond promptly via My Property CRM or direct call._`;

    // 1. Send to configured lead destination number (e.g. Admin / Central CRM)
    const primaryResult = await this.dispatchMessage(this.leadDestinationNumber, messageText);

    // 2. Also send to advertiser / agent if different and valid
    if (payload.advertiserPhone) {
      const formattedAdvertiser = this.formatMobileNumber(payload.advertiserPhone);
      if (formattedAdvertiser && formattedAdvertiser !== this.leadDestinationNumber) {
        await this.dispatchMessage(formattedAdvertiser, messageText).catch((err) =>
          this.logger.warn(`Could not dispatch duplicate WhatsApp to advertiser: ${err.message}`),
        );
      }
    }

    return primaryResult;
  }

  /**
   * Send WhatsApp KYC Submission Confirmation
   */
  async sendKycSubmittedNotification(payload: KycWhatsAppPayload): Promise<WhatsAppSendResult> {
    if (!this.enabled) return { success: false, status: 'DISABLED', error: 'WhatsApp service is disabled' };

    const recipient = this.formatMobileNumber(payload.customerMobile);
    const messageText =
      `*My Property — KYC Documents Received*\n\n` +
      `Hello ${payload.customerName},\n\n` +
      `Your verification documents for your *${payload.accountType.replace(/_/g, ' ')}* account have been submitted successfully.\n\n` +
      `Our compliance team is currently reviewing your application.\n\n` +
      `*Notice:* You may receive a verification call from *${this.verificationCallNumber}* to complete your KYC.\n\n` +
      `Once approved by the Super Admin, your *3-Day Free Trial* will begin automatically.\n\n` +
      `Thank you for choosing My Property!`;

    return this.dispatchMessage(recipient, messageText);
  }

  /**
   * Send WhatsApp KYC Approved & 3-Day Trial Activation Notification
   */
  async sendKycApprovedNotification(payload: KycWhatsAppPayload): Promise<WhatsAppSendResult> {
    if (!this.enabled) return { success: false, status: 'DISABLED', error: 'WhatsApp service is disabled' };

    const recipient = this.formatMobileNumber(payload.customerMobile);
    const expiryStr = payload.trialExpiresAt
      ? payload.trialExpiresAt.toLocaleDateString('en-IN', {
          dateStyle: 'full',
          timeZone: 'Asia/Kolkata',
        })
      : 'in 3 days';

    const messageText =
      `*Congratulations! Your My Property Account is Approved!*\n\n` +
      `Dear ${payload.customerName},\n\n` +
      `Your KYC verification for your *${payload.accountType.replace(/_/g, ' ')}* account has been *APPROVED* by the Super Admin.\n\n` +
      `*Your 3-Day Free Trial is now ACTIVE!* 🎉\n` +
      `*Trial Valid Until:* ${expiryStr}\n\n` +
      `You can now publish property listings, view prospective leads, and access your verified dashboard at:\n` +
      `${this.frontendUrl}/dashboard\n\n` +
      `Need assistance? Contact support or call ${this.verificationCallNumber}.`;

    return this.dispatchMessage(recipient, messageText);
  }

  /**
   * Send WhatsApp KYC Rejection Notification
   */
  async sendKycRejectedNotification(payload: KycWhatsAppPayload): Promise<WhatsAppSendResult> {
    if (!this.enabled) return { success: false, status: 'DISABLED', error: 'WhatsApp service is disabled' };

    const recipient = this.formatMobileNumber(payload.customerMobile);
    const messageText =
      `*My Property Verification Update — Action Required*\n\n` +
      `Dear ${payload.customerName},\n\n` +
      `We reviewed your KYC documents for your *${payload.accountType.replace(/_/g, ' ')}* account, but were unable to approve them due to the following reason:\n\n` +
      `*Reason:* ${payload.reason || 'Document illegible or information mismatch.'}\n\n` +
      `Please log in to your My Property dashboard to re-upload clear replacement documents:\n` +
      `${this.frontendUrl}/dashboard/kyc\n\n` +
      `For help, our verification officer may call you from *${this.verificationCallNumber}*.`;

    return this.dispatchMessage(recipient, messageText);
  }

  /**
   * Send WhatsApp Package Assignment / Change Notification
   */
  async sendPackageChangedNotification(payload: PackageChangeWhatsAppPayload): Promise<WhatsAppSendResult> {
    if (!this.enabled) return { success: false, status: 'DISABLED', error: 'WhatsApp service is disabled' };

    const recipient = this.formatMobileNumber(payload.customerMobile);
    const expiryStr = payload.validUntil
      ? payload.validUntil.toLocaleDateString('en-IN', {
          dateStyle: 'full',
          timeZone: 'Asia/Kolkata',
        })
      : 'Ongoing';

    const messageText =
      `*My Property — Subscription Updated*\n\n` +
      `Dear ${payload.customerName},\n\n` +
      `Your account package has been updated by Super Admin.\n\n` +
      `*Account Type:* ${payload.accountType.replace(/_/g, ' ')}\n` +
      `*Assigned Package:* ${payload.packageName}\n` +
      `*Validity / Expiry Date:* ${expiryStr}\n\n` +
      `Your new listing and lead quotas are active immediately.\n` +
      `View your account: ${this.frontendUrl}/dashboard\n\n` +
      `Thank you for partnering with My Property!`;

    return this.dispatchMessage(recipient, messageText);
  }

  /**
   * Core dispatcher supporting Mock, Meta WhatsApp Cloud API, Twilio, etc.
   */
  private async dispatchMessage(recipient: string, messageText: string): Promise<WhatsAppSendResult> {
    const cleanRecipient = this.formatMobileNumber(recipient);
    const sentAt = new Date();

    if (!cleanRecipient) {
      this.logger.warn(`Cannot send WhatsApp: invalid or missing recipient number`);
      return { success: false, status: 'FAILED', error: 'Invalid recipient mobile number' };
    }

    if (!this.enabled || this.provider === 'disabled') {
      this.logger.log(`WhatsApp notifications are disabled by configuration`);
      return { success: false, status: 'DISABLED', error: 'WhatsApp service is disabled' };
    }

    // 1. Meta WhatsApp Business Cloud API (Live configured delivery)
    if (this.provider === 'meta') {
      if (!this.accessToken || !this.phoneNumberId) {
        this.logger.warn(`Cannot send WhatsApp: Meta WhatsApp API credentials (accessToken, phoneNumberId) are unconfigured`);
        return {
          success: false,
          status: 'FAILED',
          error: 'Meta WhatsApp credentials are unconfigured',
          recipient: cleanRecipient,
          sentAt,
        };
      }
      try {
        const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
        const phoneNoDigits = cleanRecipient.replace(/^\+/, '');

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: phoneNoDigits,
            type: 'text',
            text: {
              preview_url: true,
              body: messageText,
            },
          }),
        });

        const data: any = await response.json();

        if (!response.ok) {
          const errDetail = data?.error?.message || response.statusText;
          this.logger.error(`Meta WhatsApp API Error (${response.status}): ${errDetail}`);
          return {
            success: false,
            status: 'FAILED',
            error: errDetail,
            recipient: cleanRecipient,
            sentAt,
          };
        }

        const messageId = data?.messages?.[0]?.id || `wa-${Date.now()}`;
        this.logger.log(`Meta WhatsApp delivered successfully to ${cleanRecipient} (ID: ${messageId})`);
        return {
          success: true,
          status: 'SENT',
          messageId,
          recipient: cleanRecipient,
          sentAt,
        };
      } catch (err: any) {
        this.logger.error(`Failed to dispatch Meta WhatsApp message: ${err.message}`);
        return {
          success: false,
          status: 'FAILED',
          error: err.message,
          recipient: cleanRecipient,
          sentAt,
        };
      }
    }

    // Fallback: Unconfigured / Mock provider (log for local inspection, never fake live delivery)
    this.logger.log(
      `\n================= [WHATSAPP DISPATCH (UNCONFIGURED / MOCK)] =================\n` +
      `To: ${cleanRecipient}\n` +
      `Provider: ${this.provider}\n` +
      `Timestamp: ${sentAt.toISOString()}\n` +
      `Message:\n${messageText}\n` +
      `============================================================================\n`,
    );
    return {
      success: false,
      status: 'MOCK_SENT',
      messageId: `mock-wa-${Date.now()}`,
      recipient: cleanRecipient,
      sentAt,
      error: 'Live WhatsApp delivery not configured (credentials missing or mock mode active)',
    };
  }
}
