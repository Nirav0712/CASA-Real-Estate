import { fetchAdminApi } from '@/lib/api-client';
import { PaymentAdminResponse, PaymentRecord } from '@/types';

export async function getAdminPayments(params?: {
  page?: number;
  limit?: number;
  status?: string;
  purpose?: string;
  userId?: string;
  referenceId?: string;
  startDate?: string;
  endDate?: string;
  q?: string;
}): Promise<PaymentAdminResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.status && params.status !== 'ALL') queryParams.set('status', params.status);
  if (params?.purpose && params.purpose !== 'ALL') queryParams.set('purpose', params.purpose);
  if (params?.userId) queryParams.set('userId', params.userId);
  if (params?.referenceId) queryParams.set('referenceId', params.referenceId);
  if (params?.startDate) queryParams.set('startDate', params.startDate);
  if (params?.endDate) queryParams.set('endDate', params.endDate);
  if (params?.q) queryParams.set('q', params.q);

  const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const result = await fetchAdminApi<PaymentAdminResponse>(`/admin/payments${qs}`);
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to fetch payment records.');
  }
  return result.data;
}

export async function refundAdminPayment(
  id: string,
  payload?: { amount?: number; reason?: string },
): Promise<{ success: boolean; message: string; payment: any }> {
  const result = await fetchAdminApi<{ success: boolean; message: string; payment: any }>(
    `/admin/payments/${encodeURIComponent(id)}/refund`,
    {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    },
  );
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to issue refund.');
  }
  return result.data;
}
