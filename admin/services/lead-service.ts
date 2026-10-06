import { fetchAdminApi } from '@/lib/api-client';
import {
  LeadRecord,
  LeadStatus,
  LeadPriority,
  LeadKPIs,
} from '@/types';

export interface LeadQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  source?: string;
  agentId?: string;
  unassigned?: string;
  propertyId?: string;
  startDate?: string;
  endDate?: string;
  q?: string;
}

export interface PaginatedLeadsResponse {
  data: LeadRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function getAdminLeads(params?: LeadQueryParams): Promise<PaginatedLeadsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.status && params.status !== 'ALL') queryParams.set('status', params.status);
  if (params?.priority && params.priority !== 'ALL') queryParams.set('priority', params.priority);
  if (params?.source && params.source !== 'ALL') queryParams.set('source', params.source);
  if (params?.agentId) queryParams.set('agentId', params.agentId);
  if (params?.unassigned) queryParams.set('unassigned', params.unassigned);
  if (params?.propertyId) queryParams.set('propertyId', params.propertyId);
  if (params?.startDate) queryParams.set('startDate', params.startDate);
  if (params?.endDate) queryParams.set('endDate', params.endDate);
  if (params?.q) queryParams.set('q', params.q);

  const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const res = await fetchAdminApi<PaginatedLeadsResponse>(`/leads${qs}`);
  if (res.error || !res.data) {
    throw new Error(res.error || 'Failed to fetch leads');
  }
  return res.data;
}

export async function getAdminLeadById(id: string): Promise<LeadRecord> {
  const res = await fetchAdminApi<LeadRecord>(`/leads/${encodeURIComponent(id)}`);
  if (res.error || !res.data) {
    throw new Error(res.error || 'Failed to fetch lead details');
  }
  return res.data;
}

export async function updateAdminLeadStatus(
  id: string,
  status: LeadStatus,
  note?: string,
  lostReason?: string,
): Promise<{ success: boolean; message: string; lead: any }> {
  const res = await fetchAdminApi<{ success: boolean; message: string; lead: any }>(
    `/leads/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status, note, lostReason }),
    },
  );
  if (res.error || !res.data) {
    throw new Error(res.error || 'Failed to update lead status');
  }
  return res.data;
}

export async function updateAdminLeadPriority(
  id: string,
  priority: LeadPriority,
): Promise<{ success: boolean; message: string; priority: string }> {
  const res = await fetchAdminApi<{ success: boolean; message: string; priority: string }>(
    `/leads/${encodeURIComponent(id)}/priority`,
    {
      method: 'PATCH',
      body: JSON.stringify({ priority }),
    },
  );
  if (res.error || !res.data) {
    throw new Error(res.error || 'Failed to update lead priority');
  }
  return res.data;
}

export async function assignAdminLead(
  id: string,
  assignedAgentId: string,
  note?: string,
): Promise<{ success: boolean; message: string; lead: any }> {
  const res = await fetchAdminApi<{ success: boolean; message: string; lead: any }>(
    `/leads/${encodeURIComponent(id)}/assign`,
    {
      method: 'PATCH',
      body: JSON.stringify({ assignedAgentId, note }),
    },
  );
  if (res.error || !res.data) {
    throw new Error(res.error || 'Failed to assign lead');
  }
  return res.data;
}

export async function addAdminLeadNote(
  id: string,
  note: string,
): Promise<{ success: boolean; message: string; note: any }> {
  const res = await fetchAdminApi<{ success: boolean; message: string; note: any }>(
    `/leads/${encodeURIComponent(id)}/notes`,
    {
      method: 'POST',
      body: JSON.stringify({ text: note, note }),
    },
  );
  if (res.error || !res.data) {
    throw new Error(res.error || 'Failed to add note');
  }
  return res.data;
}

export async function getAdminLeadKPIs(): Promise<LeadKPIs> {
  const res = await fetchAdminApi<LeadKPIs>('/leads/kpis');
  if (res.error || !res.data) {
    throw new Error(res.error || 'Failed to fetch lead KPIs');
  }
  return res.data;
}

export async function getAdminAvailableAgents(): Promise<Array<{ id: string; name: string; mobile: string; role: string }>> {
  try {
    const res = await fetchAdminApi<any>('/admin/agents?limit=100');
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data.map((a: any) => ({
        id: a.user?.id || a.userId || a.id || a._id,
        name: a.user?.name || a.agencyName || a.name || 'Agent',
        mobile: a.user?.mobile || a.mobile || '',
        role: a.user?.role || 'AGENT',
      }));
    }
    return [];
  } catch {
    return [];
  }
}
