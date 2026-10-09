import { fetchAdminApi } from '@/lib/api-client';
import { AdminDashboardStats, AdminPropertyItem, RoleRecord } from '@/types';

export async function getAdminDashboardStats(): Promise<{
  stats: AdminDashboardStats;
  source: 'api' | 'fallback_dev';
}> {
  const result = await fetchAdminApi<AdminDashboardStats>('/admin/dashboard-stats');
  if (result.isBackendAvailable && result.data) {
    return { stats: result.data, source: 'api' };
  }
  return {
    stats: {
      pendingApprovalsCount: 0,
      activeListingsCount: 0,
      registeredAgentsCount: 0,
      totalEnquiriesThisMonth: 0,
      monthlyRevenueEstimate: 0,
    },
    source: 'fallback_dev',
  };
}

export async function getPendingModerationQueue(): Promise<{
  queue: AdminPropertyItem[];
  source: 'api' | 'fallback_dev';
}> {
  const result = await fetchAdminApi<AdminPropertyItem[]>('/admin/properties/pending');
  if (result.isBackendAvailable && result.data && Array.isArray(result.data)) {
    return { queue: result.data, source: 'api' };
  }
  return { queue: [], source: 'fallback_dev' };
}

export async function getAllAdminProperties(params?: {
  status?: string;
  category?: string;
  listingType?: string;
  isFeatured?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AdminPropertyItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status);
  if (params?.category && params.category !== 'ALL') searchParams.set('category', params.category);
  if (params?.listingType && params.listingType !== 'ALL') searchParams.set('listingType', params.listingType);
  if (params?.isFeatured && params.isFeatured !== 'ALL') searchParams.set('isFeatured', params.isFeatured);
  if (params?.search && params.search.trim()) searchParams.set('search', params.search.trim());
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const result = await fetchAdminApi<AdminPropertyItem[]>(`/admin/properties${queryStr}`);

  if (result.isBackendAvailable && result.data && Array.isArray(result.data)) {
    return result.data;
  }
  return [];
}

export async function getAdminPropertyById(id: string): Promise<AdminPropertyItem> {
  const result = await fetchAdminApi<AdminPropertyItem>(`/admin/properties/${encodeURIComponent(id)}`);
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to fetch property details');
  }
  return result.data;
}

export async function updateAdminProperty(
  id: string,
  payload: any,
): Promise<{ success: boolean; message: string; property?: AdminPropertyItem }> {
  const result = await fetchAdminApi<{ success: boolean; message: string; property?: AdminPropertyItem }>(
    `/admin/properties/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );

  if (!result.isBackendAvailable || result.error) {
    throw new Error(result.error || 'Failed to update property');
  }

  return result.data || { success: true, message: 'Property updated successfully' };
}

export async function approveModerationProperty(
  id: string,
  note?: string,
): Promise<{ success: boolean; message: string; property?: AdminPropertyItem }> {
  const result = await fetchAdminApi<{
    success: boolean;
    message: string;
    property?: AdminPropertyItem;
  }>(`/admin/properties/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });

  if (!result.isBackendAvailable || result.error) {
    throw new Error(result.error || 'Failed to approve property on backend');
  }

  return result.data || { success: true, message: 'Property approved successfully' };
}

export async function rejectModerationProperty(
  id: string,
  reasonCode: string,
  feedback?: string,
): Promise<{ success: boolean; message: string; property?: AdminPropertyItem }> {
  const result = await fetchAdminApi<{
    success: boolean;
    message: string;
    property?: AdminPropertyItem;
  }>(`/admin/properties/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reasonCode, feedback }),
  });

  if (!result.isBackendAvailable || result.error) {
    throw new Error(result.error || 'Failed to reject property on backend');
  }

  return result.data || { success: true, message: 'Property rejected successfully' };
}

export async function publishAdminProperty(
  id: string,
): Promise<{ success: boolean; message: string; property?: AdminPropertyItem }> {
  const result = await fetchAdminApi<{ success: boolean; message: string; property?: AdminPropertyItem }>(
    `/admin/properties/${encodeURIComponent(id)}/publish`,
    {
      method: 'POST',
    },
  );

  if (!result.isBackendAvailable || result.error) {
    throw new Error(result.error || 'Failed to publish property');
  }

  return result.data || { success: true, message: 'Property published successfully' };
}

export async function unpublishAdminProperty(
  id: string,
): Promise<{ success: boolean; message: string; property?: AdminPropertyItem }> {
  const result = await fetchAdminApi<{ success: boolean; message: string; property?: AdminPropertyItem }>(
    `/admin/properties/${encodeURIComponent(id)}/unpublish`,
    {
      method: 'POST',
    },
  );

  if (!result.isBackendAvailable || result.error) {
    throw new Error(result.error || 'Failed to unpublish property');
  }

  return result.data || { success: true, message: 'Property unpublished successfully' };
}

export async function archiveAdminProperty(
  id: string,
): Promise<{ success: boolean; message: string; property?: AdminPropertyItem }> {
  const result = await fetchAdminApi<{ success: boolean; message: string; property?: AdminPropertyItem }>(
    `/admin/properties/${encodeURIComponent(id)}/archive`,
    {
      method: 'POST',
    },
  );

  if (!result.isBackendAvailable || result.error) {
    throw new Error(result.error || 'Failed to archive property');
  }

  return result.data || { success: true, message: 'Property archived successfully' };
}

export async function toggleFeatureAdminProperty(
  id: string,
  isFeatured: boolean,
): Promise<{ success: boolean; message: string; property?: AdminPropertyItem }> {
  const endpoint = isFeatured
    ? `/admin/properties/${encodeURIComponent(id)}/feature`
    : `/admin/properties/${encodeURIComponent(id)}/unfeature`;

  const result = await fetchAdminApi<{ success: boolean; message: string; property?: AdminPropertyItem }>(
    endpoint,
    {
      method: 'POST',
    },
  );

  if (!result.isBackendAvailable || result.error) {
    throw new Error(result.error || 'Failed to update featured state');
  }

  return result.data || { success: true, message: 'Featured status updated' };
}

export async function deleteAdminProperty(id: string): Promise<{ success: boolean; message: string }> {
  const result = await fetchAdminApi<{ success: boolean; message: string }>(
    `/admin/properties/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
  );

  if (!result.isBackendAvailable || result.error) {
    throw new Error(result.error || 'Failed to delete property');
  }

  return result.data || { success: true, message: 'Property deleted successfully' };
}

// ==========================================
// PHASE 08: USER MANAGEMENT & GOVERNANCE APIs
// ==========================================

import {
  PaginatedResponse,
  UserRecord,
  UserDetailRecord,
  AgentRecord,
  PurchaserRecord,
  AuditLogRecord,
} from '@/types';

export async function getAdminUsers(params?: {
  page?: number;
  limit?: number;
  q?: string;
  role?: string;
  status?: string;
  verified?: string;
  sort?: string;
}): Promise<PaginatedResponse<UserRecord>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.q && params.q.trim()) searchParams.set('q', params.q.trim());
  if (params?.role && params.role !== 'ALL') searchParams.set('role', params.role);
  if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status);
  if (params?.verified && params.verified !== 'ALL') searchParams.set('verified', params.verified);
  if (params?.sort) searchParams.set('sort', params.sort);

  const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const result = await fetchAdminApi<PaginatedResponse<UserRecord>>(`/admin/users${queryStr}`);

  if (result.isBackendAvailable && result.data) {
    return result.data;
  }
  return {
    data: [],
    pagination: {
      page: params?.page || 1,
      limit: params?.limit || 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

export async function getAdminUserById(id: string): Promise<UserDetailRecord> {
  const result = await fetchAdminApi<UserDetailRecord>(`/admin/users/${encodeURIComponent(id)}`);
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to fetch user details');
  }
  return result.data;
}

export async function updateAdminUserStatus(
  id: string,
  status: string,
  reason?: string,
): Promise<{ success: boolean; message: string; user?: UserRecord }> {
  const result = await fetchAdminApi<{ success: boolean; message: string; user?: UserRecord }>(
    `/admin/users/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    },
  );

  if (!result.isBackendAvailable || result.error) {
    throw new Error(result.error || 'Failed to update user status');
  }

  return result.data || { success: true, message: 'User status updated successfully' };
}

export async function getAdminAssignableRoles(): Promise<RoleRecord[]> {
  const result = await fetchAdminApi<RoleRecord[]>('/admin/entitlements/roles');
  if (result.isBackendAvailable && result.data && Array.isArray(result.data)) {
    return result.data;
  }
  return [];
}

export async function updateAdminUserRole(
  id: string,
  role: string,
  reason?: string,
): Promise<{ success: boolean; message: string; user?: UserRecord }> {
  const result = await fetchAdminApi<{ success: boolean; message: string; user?: UserRecord }>(
    `/admin/users/${encodeURIComponent(id)}/role`,
    {
      method: 'PATCH',
      body: JSON.stringify({ role, roleId: role, reason }),
    },
  );

  if (!result.isBackendAvailable || result.error) {
    throw new Error(result.error || 'Failed to update user role');
  }

  return result.data || { success: true, message: 'User role updated successfully' };
}

export async function updateAdminUser(
  id: string,
  payload: {
    name?: string;
    email?: string;
    mobile?: string;
    password?: string;
    role?: string;
    customRoleId?: string | null;
    status?: string;
    isVerifiedAgent?: boolean;
    agencyName?: string;
    reraNumber?: string;
  },
): Promise<{ success: boolean; message: string; user?: UserRecord }> {
  const result = await fetchAdminApi<{ success: boolean; message: string; user?: UserRecord }>(
    `/admin/users/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );

  if (!result.isBackendAvailable || result.error) {
    throw new Error(result.error || 'Failed to update user');
  }

  return result.data || { success: true, message: 'User updated successfully' };
}

export async function deleteAdminUser(
  id: string,
  reason?: string,
): Promise<{ success: boolean; message: string; deletedUserId?: string }> {
  const result = await fetchAdminApi<{ success: boolean; message: string; deletedUserId?: string }>(
    `/admin/users/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    },
  );

  if (!result.isBackendAvailable || result.error) {
    throw new Error(result.error || 'Failed to delete user');
  }

  return result.data || { success: true, message: 'User deleted successfully' };
}

export async function bulkDeleteAdminUsers(
  userIds: string[],
  reason?: string,
): Promise<{ success: boolean; deletedCount: number; skippedCount: number; message: string }> {
  const result = await fetchAdminApi<{
    success: boolean;
    deletedCount: number;
    skippedCount: number;
    message: string;
  }>('/admin/users/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ userIds, reason }),
  });

  if (!result.isBackendAvailable || result.error) {
    throw new Error(result.error || 'Failed to execute bulk user deletion');
  }

  return result.data || { success: true, deletedCount: userIds.length, skippedCount: 0, message: 'Users deleted' };
}

export async function bulkUpdateAdminUserStatus(
  userIds: string[],
  status: string,
  reason?: string,
): Promise<{ success: boolean; updatedCount: number; skippedCount: number; message: string }> {
  const result = await fetchAdminApi<{
    success: boolean;
    updatedCount: number;
    skippedCount: number;
    message: string;
  }>('/admin/users/bulk-status', {
    method: 'POST',
    body: JSON.stringify({ userIds, status, reason }),
  });

  if (!result.isBackendAvailable || result.error) {
    throw new Error(result.error || 'Failed to update user statuses');
  }

  return result.data || { success: true, updatedCount: userIds.length, skippedCount: 0, message: 'User statuses updated' };
}

export async function getAdminAgents(params?: {
  page?: number;
  limit?: number;
  q?: string;
  verified?: string;
  status?: string;
}): Promise<PaginatedResponse<AgentRecord>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.q && params.q.trim()) searchParams.set('q', params.q.trim());
  if (params?.verified && params.verified !== 'ALL') searchParams.set('verified', params.verified);
  if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status);

  const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const result = await fetchAdminApi<PaginatedResponse<AgentRecord>>(`/admin/agents${queryStr}`);

  if (result.isBackendAvailable && result.data) {
    return result.data;
  }
  return {
    data: [],
    pagination: {
      page: params?.page || 1,
      limit: params?.limit || 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

export async function verifyAdminAgent(
  id: string,
  notes?: string,
): Promise<{ success: boolean; message: string; user?: UserRecord }> {
  const result = await fetchAdminApi<{ success: boolean; message: string; user?: UserRecord }>(
    `/admin/agents/${encodeURIComponent(id)}/verify`,
    {
      method: 'POST',
      body: JSON.stringify({ notes }),
    },
  );

  if (!result.isBackendAvailable || result.error) {
    throw new Error(result.error || 'Failed to verify agent');
  }

  return result.data || { success: true, message: 'Agent verified successfully' };
}

export async function getAdminAgentVerificationDetail(id: string): Promise<{
  agent: AgentRecord;
  profile: any;
  documents: any[];
}> {
  const result = await fetchAdminApi<{
    agent: AgentRecord;
    profile: any;
    documents: any[];
  }>(`/admin/agents/${encodeURIComponent(id)}/verification`);

  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to fetch agent verification details');
  }

  return result.data;
}

export async function rejectAdminAgent(
  id: string,
  reason: string,
): Promise<{ success: boolean; message: string; user?: UserRecord }> {
  const result = await fetchAdminApi<{ success: boolean; message: string; user?: UserRecord }>(
    `/admin/agents/${encodeURIComponent(id)}/reject`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
  );

  if (!result.isBackendAvailable || result.error) {
    throw new Error(result.error || 'Failed to reject agent verification');
  }

  return result.data || { success: true, message: 'Agent verification rejected' };
}

export async function revokeAdminAgent(
  id: string,
  reason?: string,
): Promise<{ success: boolean; message: string; user?: UserRecord }> {
  const result = await fetchAdminApi<{ success: boolean; message: string; user?: UserRecord }>(
    `/admin/agents/${encodeURIComponent(id)}/revoke`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
  );

  if (!result.isBackendAvailable || result.error) {
    throw new Error(result.error || 'Failed to revoke agent verification');
  }

  return result.data || { success: true, message: 'Agent verification revoked successfully' };
}

export async function getAdminPurchasers(params?: {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
}): Promise<PaginatedResponse<PurchaserRecord>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.q && params.q.trim()) searchParams.set('q', params.q.trim());
  if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status);

  const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const result = await fetchAdminApi<PaginatedResponse<PurchaserRecord>>(`/admin/purchasers${queryStr}`);

  if (result.isBackendAvailable && result.data) {
    return result.data;
  }
  return {
    data: [],
    pagination: {
      page: params?.page || 1,
      limit: params?.limit || 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

export async function getAdminAuditLogs(params?: {
  page?: number;
  limit?: number;
  action?: string;
  actorUserId?: string;
  targetUserId?: string;
}): Promise<PaginatedResponse<AuditLogRecord>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.action && params.action !== 'ALL') searchParams.set('action', params.action);
  if (params?.actorUserId) searchParams.set('actorUserId', params.actorUserId);
  if (params?.targetUserId) searchParams.set('targetUserId', params.targetUserId);

  const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const result = await fetchAdminApi<PaginatedResponse<AuditLogRecord>>(`/admin/audit-logs${queryStr}`);

  if (result.isBackendAvailable && result.data) {
    return result.data;
  }
  return {
    data: [],
    pagination: {
      page: params?.page || 1,
      limit: params?.limit || 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

