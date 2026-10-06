import { fetchApi } from '@/lib/api-client';
import {
  AgentProfile,
  AgentDashboardData,
  AgentDocument,
  AgentVerificationStatus,
  Property,
} from '@/types';

export interface PublicAgentDetailResponse {
  agent: AgentProfile;
  listings: Property[];
  stats: {
    totalListings: number;
    experienceYears: number;
    verified: boolean;
  };
}

export async function getAgentDashboard(): Promise<AgentDashboardData> {
  const result = await fetchApi<AgentDashboardData>('/agents/me/dashboard');
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to fetch agent dashboard data.');
  }
  return result.data;
}

export async function getMyAgentProfile(): Promise<AgentProfile> {
  const result = await fetchApi<AgentProfile>('/agents/me/profile');
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to fetch agent profile.');
  }
  return result.data;
}

export async function updateMyAgentProfile(
  payload: Partial<AgentProfile>,
): Promise<{ success: boolean; message: string; profile: AgentProfile }> {
  const result = await fetchApi<{ success: boolean; message: string; profile: AgentProfile }>(
    '/agents/me/profile',
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to update agent profile.');
  }
  return result.data;
}

export async function getMyVerification(): Promise<{
  verificationStatus: AgentVerificationStatus;
  isVerifiedAgent: boolean;
  rejectionReason?: string;
  verifiedAt?: string;
  reraNumber?: string;
  reraState?: string;
  reraAuthority?: string;
  documents: AgentDocument[];
}> {
  const result = await fetchApi<{
    verificationStatus: AgentVerificationStatus;
    isVerifiedAgent: boolean;
    rejectionReason?: string;
    verifiedAt?: string;
    reraNumber?: string;
    reraState?: string;
    reraAuthority?: string;
    documents: AgentDocument[];
  }>('/agents/me/verification');
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to fetch verification status.');
  }
  return result.data;
}

export async function submitVerification(payload: {
  reraNumber: string;
  reraState: string;
  reraAuthority?: string;
  notes?: string;
}): Promise<{ success: boolean; message: string; status: AgentVerificationStatus }> {
  const result = await fetchApi<{ success: boolean; message: string; status: AgentVerificationStatus }>(
    '/agents/me/verification/submit',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to submit verification.');
  }
  return result.data;
}

export async function uploadVerificationDocument(payload: {
  documentType: string;
  documentUrl: string;
  documentName: string;
  mimeType?: string;
  fileSize?: number;
  documentNumber?: string;
}): Promise<{ success: boolean; message: string; document: AgentDocument }> {
  const result = await fetchApi<{ success: boolean; message: string; document: AgentDocument }>(
    '/agents/me/verification/documents',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to upload verification document.');
  }
  return result.data;
}

export async function getPublicAgentProfile(slug: string): Promise<PublicAgentDetailResponse> {
  const result = await fetchApi<PublicAgentDetailResponse>(`/agents/${encodeURIComponent(slug)}`);
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to fetch public agent profile.');
  }
  return result.data;
}
