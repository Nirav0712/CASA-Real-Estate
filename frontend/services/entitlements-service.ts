import { fetchApi } from '@/lib/api-client';

export interface PackagePlan {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  targetAccountTypes: string[];
  price: number;
  currency: string;
  billingPeriod: string;
  isActive: boolean;
  isDefault: boolean;
  isPopular?: boolean;
  features: string[];
  limits: {
    propertyViewsMonthly?: number;
    propertyListingsMax?: number;
    featuredListingsMax?: number;
    leadsMonthly?: number;
    enquiriesMax?: number;
    chatsMax?: number;
    savedPropertiesMax?: number;
    savedSearchesMax?: number;
    teamMembersMax?: number;
  };
}

export interface CompanySettings {
  appName: string;
  companySalesNumber: string;
  companySalesWhatsapp?: string;
  companyServiceNumber: string;
  companySalesEmail: string;
  companySupportEmail: string;
  companyAddress: string;
  trialDays: number;
}

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
    trial?: {
      isTrialActive: boolean;
      isTrialExpired: boolean;
      trialExpiresAt: string | null;
      daysRemaining: number;
      trialPackageId?: string | null;
    };
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

export async function getActivePackages(): Promise<PackagePlan[]> {
  const result = await fetchApi<PackagePlan[]>('/entitlements/packages');
  if (!result.isBackendAvailable || result.error || !result.data) {
    return [];
  }
  return Array.isArray(result.data) ? result.data : [];
}

export interface PublicRoleItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  accountType?: string | null;
  isSystemRole?: boolean;
}

export async function getPublicRoles(): Promise<PublicRoleItem[]> {
  const result = await fetchApi<PublicRoleItem[]>('/entitlements/roles');
  if (!result.isBackendAvailable || result.error || !result.data) {
    return [
      { id: 'buyer', name: 'Property Buyer', slug: 'buyer', description: 'Buy Homes, Plots & Commercial', accountType: 'BUYER', isSystemRole: true },
      { id: 'tenant', name: 'Tenant', slug: 'tenant', description: 'Rent Flats, Houses & Commercial Spaces', accountType: 'TENANT', isSystemRole: true },
      { id: 'property-owner', name: 'Property Owner / Seller', slug: 'property-owner', description: 'Sell or Lease Property', accountType: 'PROPERTY_OWNER', isSystemRole: true },
      { id: 'agent', name: 'Real Estate Agent', slug: 'agent', description: 'Independent Certified Agent', accountType: 'AGENT', isSystemRole: true },
      { id: 'broker', name: 'Real Estate Broker', slug: 'broker', description: 'Brokerage Firm / Mandates', accountType: 'BROKER', isSystemRole: true },
      { id: 'developer', name: 'Property Developer / Builder', slug: 'developer', description: 'Townships & Projects', accountType: 'DEVELOPER', isSystemRole: true },
    ];
  }
  return Array.isArray(result.data) ? result.data : [];
}

export async function startTrial(packageId: string): Promise<{
  success: boolean;
  message: string;
  trialExpiresAt: string;
  daysRemaining: number;
  package: any;
}> {
  const result = await fetchApi<{
    success: boolean;
    message: string;
    trialExpiresAt: string;
    daysRemaining: number;
    package: any;
  }>('/entitlements/start-trial', {
    method: 'POST',
    body: JSON.stringify({ packageId }),
  });

  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to activate free trial');
  }

  return result.data;
}

export async function getPublicCompanySettings(): Promise<CompanySettings> {
  const result = await fetchApi<CompanySettings>('/settings/public');
  if (!result.isBackendAvailable || result.error || !result.data) {
    return {
      appName: 'myproperty Marketplace',
      companySalesNumber: '+91 98765 43210',
      companyServiceNumber: '+91 98765 43211',
      companySalesEmail: 'sales@myproperty.com',
      companySupportEmail: 'support@myproperty.com',
      companyAddress: 'Vibhuti Khand, Gomti Nagar, Lucknow, UP',
      trialDays: 3,
    };
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
