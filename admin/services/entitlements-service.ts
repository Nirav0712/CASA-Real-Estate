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
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('casa_admin_access_token') ||
        localStorage.getItem('casa_admin_token') ||
        localStorage.getItem('casa_auth_token')
      : null;

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ----------------- ROLES -----------------

export async function getRoles(): Promise<RoleRecord[]> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/roles`, {
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to fetch roles');
  return json?.data !== undefined ? json.data : json;
}

export async function getRole(id: string): Promise<RoleRecord> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/roles/${id}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to fetch role');
  return json?.data !== undefined ? json.data : json;
}

export async function createRole(payload: Partial<RoleRecord>): Promise<RoleRecord> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/roles`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to create role');
  return json?.role || json?.data || json;
}

export async function updateRole(id: string, payload: Partial<RoleRecord>): Promise<RoleRecord> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/roles/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to update role');
  return json?.role || json?.data || json;
}

export async function deleteRole(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/roles/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to delete role');
  return json;
}

export async function duplicateRole(id: string): Promise<RoleRecord> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/roles/${id}/duplicate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to duplicate role');
  return json?.role || json?.data || json;
}

// ----------------- PERMISSIONS -----------------

export async function getPermissions(): Promise<PermissionGroup[]> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/permissions`, {
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to fetch permissions');
  return json?.groups || json?.data || (Array.isArray(json) ? json : []);
}

// ----------------- PACKAGES -----------------

export async function getPackages(): Promise<PackageRecord[]> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/packages`, {
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to fetch packages');
  return json?.data !== undefined ? json.data : json;
}

export async function getPackage(id: string): Promise<PackageRecord> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/packages/${id}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to fetch package');
  return json?.data !== undefined ? json.data : json;
}

export async function createPackage(payload: Partial<PackageRecord>): Promise<PackageRecord> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/packages`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to create package');
  return json?.package || json?.data || json;
}

export async function updatePackage(id: string, payload: Partial<PackageRecord>): Promise<PackageRecord> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/packages/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to update package');
  return json?.package || json?.data || json;
}

export async function deletePackage(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/packages/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to delete package');
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
    credentials: 'include',
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to fetch usage metrics');
  return json?.data !== undefined ? json : { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
}

export async function getUserOverrides(userId: string): Promise<UserOverrides> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/users/${userId}/entitlements`, {
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to fetch user overrides');
  const u = json?.user || json?.data?.user;
  return {
    customRoleId: u?.customRoleId || '',
    activePackageId: u?.activePackageId || '',
    grantedPermissions: u?.grantedPermissions || [],
    deniedPermissions: u?.deniedPermissions || [],
    bonusLimits: u?.bonusLimits || {},
  };
}

export async function updateUserOverrides(userId: string, payload: Partial<UserOverrides>): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/users/${userId}/overrides`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to update user overrides');
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
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/users/${userId}/bonus-credits`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ bonusLimits }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to add bonus credits');
  return json;
}

export async function resetUserUsage(userId: string, usageType: 'views' | 'all'): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/entitlements/users/${userId}/overrides`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ resetUsage: true }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to reset usage');
  return json;
}
