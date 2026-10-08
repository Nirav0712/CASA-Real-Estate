import {
  RoleRecord,
  PackageRecord,
  PermissionGroup,
  UserOverrides,
  UsageMetricRecord,
} from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('casa_admin_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ----------------- ROLES -----------------

export async function getRoles(): Promise<RoleRecord[]> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/roles`, {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch roles');
  return json.data || json;
}

export async function getRole(id: string): Promise<RoleRecord> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/roles/${id}`, {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch role');
  return json.data || json;
}

export async function createRole(payload: Partial<RoleRecord>): Promise<RoleRecord> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/roles`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create role');
  return json.data || json;
}

export async function updateRole(id: string, payload: Partial<RoleRecord>): Promise<RoleRecord> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/roles/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update role');
  return json.data || json;
}

export async function deleteRole(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/roles/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to delete role');
  return json;
}

export async function duplicateRole(id: string): Promise<RoleRecord> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/roles/${id}/duplicate`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to duplicate role');
  return json.data || json;
}

// ----------------- PERMISSIONS -----------------

export async function getPermissions(): Promise<PermissionGroup[]> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/permissions`, {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch permissions');
  return json.data || json;
}

// ----------------- PACKAGES -----------------

export async function getPackages(): Promise<PackageRecord[]> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/packages`, {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch packages');
  return json.data || json;
}

export async function getPackage(id: string): Promise<PackageRecord> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/packages/${id}`, {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch package');
  return json.data || json;
}

export async function createPackage(payload: Partial<PackageRecord>): Promise<PackageRecord> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/packages`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create package');
  return json.data || json;
}

export async function updatePackage(id: string, payload: Partial<PackageRecord>): Promise<PackageRecord> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/packages/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update package');
  return json.data || json;
}

export async function deletePackage(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/packages/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to delete package');
  return json;
}

// ----------------- USAGE & OVERRIDES -----------------

export async function getUsageMetrics(params?: { search?: string; page?: number; limit?: number }): Promise<{
  data: UsageMetricRecord[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());

  const res = await fetch(`${API_BASE_URL}/admin/entitlements/usage?${query.toString()}`, {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch usage metrics');
  return json.data || json;
}

export async function getUserOverrides(userId: string): Promise<UserOverrides> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/users/${userId}/overrides`, {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch user overrides');
  return json.data || json;
}

export async function updateUserOverrides(userId: string, payload: Partial<UserOverrides>): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/users/${userId}/overrides`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update user overrides');
  return json;
}

export async function addBonusCredits(
  userId: string,
  bonusLimits: {
    propertyListingsBonus?: number;
    propertyViewsBonus?: number;
    leadsBonus?: number;
    featuredListingsBonus?: number;
  },
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/users/${userId}/bonus`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ bonusLimits }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to add bonus credits');
  return json;
}

export async function resetUserUsage(userId: string, usageType: 'views' | 'all'): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/users/${userId}/reset-usage`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ usageType }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to reset usage');
  return json;
}
