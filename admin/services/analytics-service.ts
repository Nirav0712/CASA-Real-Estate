import { fetchAdminApi } from '@/lib/api-client';

export interface AdminBIMetrics {
  users: {
    total: number;
    newThisMonth: number;
    byRole: Array<{ _id: string; count: number }>;
  };
  properties: {
    total: number;
    published: number;
    pending: number;
    rejected: number;
    featured: number;
    topViewed: Array<{ _id: string; views: number; title: any; price: any; slug?: string }>;
  };
  leads: {
    total: number;
    converted: number;
    conversionRate: number;
    siteVisits: number;
    completedVisits: number;
  };
  revenue: {
    totalOrders: number;
    totalAmount: number;
  };
  locations: {
    topCities: Array<{ _id: string; count: number }>;
  };
  engagement: Array<{ _id: string; count: number }>;
  risk: {
    openFlags: number;
  };
}

export interface RiskFlagItem {
  _id: string;
  targetType: string;
  targetId: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  flagReason: string;
  details: Record<string, any>;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  actionTaken?: string;
  createdAt: string;
}

export const AnalyticsAdminService = {
  // 16.6 Business Intelligence Dashboard
  async getMarketplaceBI() {
    const res = await fetchAdminApi<AdminBIMetrics>('/analytics/admin/bi');
    return { success: !res.error, data: res.data };
  },

  // 16.7 Agent Performance
  async getAgentPerformance(agentId: string) {
    const res = await fetchAdminApi<any>(`/analytics/agent/${agentId}/performance`);
    return { success: !res.error, data: res.data };
  },

  // 16.9 Fraud & Abuse Detection
  async runRiskScan(propertyId?: string) {
    const res = await fetchAdminApi<any>('/analytics/admin/risk-scan', {
      method: 'POST',
      body: JSON.stringify({ propertyId }),
    });
    return { success: !res.error, data: res.data, error: res.error };
  },

  async getRiskFlags(status?: string, level?: string, page = 1, limit = 50) {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    if (level && level !== 'ALL') params.append('level', level);
    params.append('page', String(page));
    params.append('limit', String(limit));

    const res = await fetchAdminApi<any>(`/analytics/admin/risk-flags?${params.toString()}`);
    return { success: !res.error, data: (res.data?.items || []) as RiskFlagItem[], total: res.data?.total || 0 };
  },

  async resolveRiskFlag(id: string, status: string, actionTaken?: string) {
    const res = await fetchAdminApi<any>(`/analytics/admin/risk-flags/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, actionTaken }),
    });
    return { success: !res.error, data: res.data, error: res.error };
  },
};
