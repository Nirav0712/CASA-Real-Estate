import { fetchApi } from '@/lib/api-client';

export interface UserEntitlementResponse {
  user: {
    id: string;
    name: string;
    mobile: string;
    email?: string;
    platformRole: string;
    accountType: string;
    status: string;
    isVerifiedAgent?: boolean;
    customRoleId?: string;
    grantedPermissions?: string[];
    deniedPermissions?: string[];
  };
  entitlements: {
    platformRole: string;
    accountType: string | null;
    role: { id: string; name: string; slug: string } | null;
    dataScope: string;
    permissions: string[];
    limits: Record<string, number>;
    dashboardConfig: Record<string, boolean>;
    package: { id: string; name: string; slug: string; price: number; billingPeriod: string } | null;
    subscription: { id: string; status: string; endDate?: string } | null;
  };
  usage: {
    propertyViews: number;
    propertyListings: number;
    monthlyLeads: number;
    enquiries: number;
    chats: number;
  };
}

export async function getMyEntitlements(): Promise<UserEntitlementResponse | null> {
  const result = await fetchApi<UserEntitlementResponse>('/entitlements/me');
  if (!result.isBackendAvailable || result.error || !result.data) {
    return null;
  }
  return result.data;
}

export function checkPermission(permissions: string[] | undefined, required: string): boolean {
  if (!permissions || permissions.length === 0) return false;
  if (permissions.includes('*')) return true;
  if (permissions.includes(required)) return true;
  const parts = required.split(':');
  if (parts.length > 1 && permissions.includes(`${parts[0]}:*`)) return true;
  return false;
}
