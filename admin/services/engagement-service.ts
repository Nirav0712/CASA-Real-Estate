import { fetchAdminApi } from '@/lib/api-client';

export interface AdminSiteVisitItem {
  _id: string;
  buyerId: any;
  propertyId: any;
  agentId: any;
  preferredDate: string;
  preferredTimeSlot: string;
  buyerName: string;
  buyerMobile: string;
  buyerEmail?: string;
  message?: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'REJECTED';
  rescheduledDate?: string;
  rescheduledTimeSlot?: string;
  agentNotes?: string;
  cancellationReason?: string;
  createdAt: string;
}

export interface AdminReview {
  _id: string;
  userId: any;
  propertyId?: any;
  agentId?: any;
  rating: number;
  comment?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
  createdAt: string;
}

export interface AdminReport {
  _id: string;
  reportedBy: any;
  propertyId: any;
  reason: string;
  description: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  actionNote?: string;
  createdAt: string;
}

export const EngagementAdminService = {
  // Reviews
  async getAllReviews(status?: string, page = 1, limit = 50) {
    const q = status ? `status=${status}&` : '';
    const res = await fetchAdminApi<any>(`/reviews/admin/all?${q}page=${page}&limit=${limit}`);
    return { success: !res.error, data: (res.data?.items || res.data || []) as AdminReview[] };
  },

  async updateReviewStatus(id: string, status: string) {
    const res = await fetchAdminApi<any>(`/reviews/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return { success: !res.error, data: res.data, error: res.error };
  },

  async deleteReview(id: string) {
    const res = await fetchAdminApi<any>(`/reviews/${id}`, {
      method: 'DELETE',
    });
    return { success: !res.error, data: res.data, error: res.error };
  },

  // Reports
  async getAllReports(status?: string, page = 1, limit = 50) {
    const q = status ? `status=${status}&` : '';
    const res = await fetchAdminApi<any>(`/reports/admin/all?${q}page=${page}&limit=${limit}`);
    return { success: !res.error, data: (res.data?.items || res.data || []) as AdminReport[] };
  },

  async updateReportStatus(id: string, payload: { status: string; actionNote?: string }) {
    const res = await fetchAdminApi<any>(`/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return { success: !res.error, data: res.data, error: res.error };
  },

  async unpublishProperty(propertyId: string) {
    const res = await fetchAdminApi<any>(`/properties/${propertyId}/unpublish`, {
      method: 'PATCH',
      body: JSON.stringify({ reason: 'Unpublished via report resolution' }),
    });
    return { success: !res.error, data: res.data, error: res.error };
  },

  // Site visits for admin
  async getAllSiteVisits(page = 1, limit = 50) {
    const res = await fetchAdminApi<any>(`/site-visits?page=${page}&limit=${limit}`);
    return { success: !res.error, data: (res.data?.items || res.data || []) as AdminSiteVisitItem[] };
  },
};
