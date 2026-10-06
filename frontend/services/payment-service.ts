import { fetchApi } from '@/lib/api-client';
import {
  PaymentItem,
  PaymentOrderResponse,
  PaymentVerifyResponse,
  PricingProduct,
  PaginatedResponse,
  PaymentPurpose,
} from '@/types';

export async function getPricingCatalog(): Promise<{ success: boolean; products: PricingProduct[] }> {
  const result = await fetchApi<{ success: boolean; products: PricingProduct[] }>('/payments/pricing');
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to load pricing packages.');
  }
  return result.data;
}

export async function getPublicGatewayConfig(): Promise<{ provider: string; keyId: string; isConfigured: boolean }> {
  const result = await fetchApi<{ provider: string; keyId: string; isConfigured: boolean }>('/payments/config/public-key');
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to load gateway configuration.');
  }
  return result.data;
}

export async function createPaymentOrder(payload: {
  purpose: PaymentPurpose;
  referenceId?: string;
  productCode?: string;
  metadata?: Record<string, any>;
}): Promise<PaymentOrderResponse> {
  const result = await fetchApi<PaymentOrderResponse>('/payments/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to create payment order.');
  }
  return result.data;
}

export async function verifyPayment(payload: {
  orderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<PaymentVerifyResponse> {
  const result = await fetchApi<PaymentVerifyResponse>('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to verify payment.');
  }
  return result.data;
}

export async function getMyPayments(params?: {
  page?: number;
  limit?: number;
  status?: string;
  purpose?: string;
  startDate?: string;
  endDate?: string;
}): Promise<PaginatedResponse<PaymentItem>> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.status) queryParams.set('status', params.status);
  if (params?.purpose) queryParams.set('purpose', params.purpose);
  if (params?.startDate) queryParams.set('startDate', params.startDate);
  if (params?.endDate) queryParams.set('endDate', params.endDate);

  const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const result = await fetchApi<PaginatedResponse<PaymentItem>>(`/payments/my${qs}`);
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to fetch payments.');
  }
  return result.data;
}

export async function getPaymentById(id: string): Promise<PaymentItem> {
  const result = await fetchApi<PaymentItem>(`/payments/${encodeURIComponent(id)}`);
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to fetch payment details.');
  }
  return result.data;
}
