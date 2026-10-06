import { fetchApi } from '@/lib/api-client';
import {
  Lead,
  LeadQuery,
  LeadStatus,
  LeadPriority,
  LeadKPIs,
  PaginatedResponse,
} from '@/types';

export async function createLead(payload: {
  propertyId: string;
  name: string;
  mobile: string;
  email?: string;
  message: string;
  source?: string;
  subject?: string;
  budget?: { min?: number; max?: number; currency?: string };
  preferredLocation?: string;
}): Promise<{ success: boolean; message: string; leadId: string }> {
  const result = await fetchApi<{ success: boolean; message: string; leadId: string }>(
    '/leads',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to submit enquiry.');
  }
  return result.data;
}

export async function getMyLeads(params?: LeadQuery): Promise<PaginatedResponse<Lead>> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.status) queryParams.set('status', params.status);
  if (params?.priority) queryParams.set('priority', params.priority);
  if (params?.source) queryParams.set('source', params.source);
  if (params?.agentId) queryParams.set('agentId', params.agentId);
  if (params?.unassigned) queryParams.set('unassigned', params.unassigned);
  if (params?.propertyId) queryParams.set('propertyId', params.propertyId);
  if (params?.startDate) queryParams.set('startDate', params.startDate);
  if (params?.endDate) queryParams.set('endDate', params.endDate);
  if (params?.search || params?.q) queryParams.set('q', (params.search || params.q)!);

  const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const result = await fetchApi<PaginatedResponse<Lead>>(`/leads${qs}`);
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to fetch leads.');
  }
  return result.data;
}

export async function getLeadById(id: string): Promise<Lead> {
  const result = await fetchApi<Lead>(`/leads/${encodeURIComponent(id)}`);
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to fetch lead details.');
  }
  return result.data;
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
  note?: string,
  lostReason?: string,
): Promise<{ success: boolean; message: string; lead: Lead }> {
  const result = await fetchApi<{ success: boolean; message: string; lead: Lead }>(
    `/leads/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status, note, lostReason }),
    },
  );
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to update lead status.');
  }
  return result.data;
}

export async function updateLeadPriority(
  id: string,
  priority: LeadPriority,
): Promise<{ success: boolean; message: string; lead: Lead }> {
  const result = await fetchApi<{ success: boolean; message: string; lead: Lead }>(
    `/leads/${encodeURIComponent(id)}/priority`,
    {
      method: 'PATCH',
      body: JSON.stringify({ priority }),
    },
  );
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to update lead priority.');
  }
  return result.data;
}

export async function assignLead(
  id: string,
  assignedAgentId: string,
  note?: string,
): Promise<{ success: boolean; message: string; lead: Lead }> {
  const result = await fetchApi<{ success: boolean; message: string; lead: Lead }>(
    `/leads/${encodeURIComponent(id)}/assign`,
    {
      method: 'PATCH',
      body: JSON.stringify({ assignedAgentId, note }),
    },
  );
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to assign lead.');
  }
  return result.data;
}

export async function addLeadNote(
  id: string,
  note: string,
): Promise<{ success: boolean; message: string; note: any }> {
  const result = await fetchApi<{ success: boolean; message: string; note: any }>(
    `/leads/${encodeURIComponent(id)}/notes`,
    {
      method: 'POST',
      body: JSON.stringify({ text: note, note }),
    },
  );
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to add note.');
  }
  return result.data;
}

export async function addLeadActivity(
  id: string,
  type: string,
  note: string,
  metadata?: Record<string, any>,
): Promise<{ success: boolean; message: string; activity: any }> {
  const result = await fetchApi<{ success: boolean; message: string; activity: any }>(
    `/leads/${encodeURIComponent(id)}/activities`,
    {
      method: 'POST',
      body: JSON.stringify({ type, note, metadata }),
    },
  );
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to log activity.');
  }
  return result.data;
}

export async function setLeadFollowUp(
  id: string,
  nextFollowUpAt: string,
  note?: string,
  type?: string,
): Promise<{ success: boolean; message: string; followUp?: any; nextFollowUpAt?: string }> {
  const result = await fetchApi<{ success: boolean; message: string; followUp?: any; nextFollowUpAt?: string }>(
    `/leads/${encodeURIComponent(id)}/follow-ups`,
    {
      method: 'POST',
      body: JSON.stringify({ dueAt: nextFollowUpAt, note, type: type || 'CALL' }),
    },
  );
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to set follow-up.');
  }
  return result.data;
}

export async function completeFollowUp(
  id: string,
  followUpId: string,
  note?: string,
): Promise<{ success: boolean; message: string; followUp: any }> {
  const result = await fetchApi<{ success: boolean; message: string; followUp: any }>(
    `/leads/${encodeURIComponent(id)}/follow-ups/${encodeURIComponent(followUpId)}/complete`,
    {
      method: 'PATCH',
      body: JSON.stringify({ note }),
    },
  );
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to complete follow-up.');
  }
  return result.data;
}

export async function cancelFollowUp(
  id: string,
  followUpId: string,
  note?: string,
): Promise<{ success: boolean; message: string; followUp: any }> {
  const result = await fetchApi<{ success: boolean; message: string; followUp: any }>(
    `/leads/${encodeURIComponent(id)}/follow-ups/${encodeURIComponent(followUpId)}/cancel`,
    {
      method: 'PATCH',
      body: JSON.stringify({ note }),
    },
  );
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to cancel follow-up.');
  }
  return result.data;
}

export async function getLeadKPIs(): Promise<LeadKPIs> {
  const result = await fetchApi<LeadKPIs>('/leads/kpis');
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to fetch lead KPIs.');
  }
  return result.data;
}

export async function getFollowUpsQueue(): Promise<any> {
  const result = await fetchApi<any>('/leads/follow-ups');
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to fetch follow-ups.');
  }
  return result.data;
}
