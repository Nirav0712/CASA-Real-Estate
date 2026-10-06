export interface CreateOrderParams {
  orderId: string;
  amount: number; // in INR
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface ProviderOrderResult {
  providerOrderId: string;
  amount: number; // in INR
  amountInSubunits: number; // in paise
  currency: string;
  keyId: string;
  provider: string;
}

export interface VerifyPaymentParams {
  orderId: string;
  providerOrderId: string;
  providerPaymentId: string;
  providerSignature: string;
}

export interface RefundParams {
  providerPaymentId: string;
  amount?: number; // in INR
  reason?: string;
  notes?: Record<string, string>;
}

export interface ProviderRefundResult {
  providerRefundId: string;
  amount: number;
  status: string;
}

export interface IPaymentProvider {
  createOrder(params: CreateOrderParams): Promise<ProviderOrderResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<boolean>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  refundPayment(params: RefundParams): Promise<ProviderRefundResult>;
  getPublicConfig(): { provider: string; keyId: string; isConfigured: boolean };
}
