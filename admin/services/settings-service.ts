import { getAuthHeaders } from '@/lib/api-auth';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export interface SystemSettingsRecord {
  appName: string;
  companySalesNumber: string;
  companyServiceNumber: string;
  companySalesEmail: string;
  companySupportEmail: string;
  companyAddress: string;
  trialDays: number;
  smsProvider: string;
  smsSenderId: string;
  otpExpiryMinutes: number;
}

export async function getSystemSettings(): Promise<SystemSettingsRecord> {
  const res = await fetch(`${API_BASE_URL}/admin/settings`, {
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.message || json?.error || 'Failed to fetch settings');
  }

  const payload = json?.data !== undefined ? json.data : json;
  return {
    appName: payload?.appName || 'myproperty Marketplace',
    companySalesNumber: payload?.companySalesNumber || '+91 98765 43210',
    companyServiceNumber: payload?.companyServiceNumber || '+91 98765 43211',
    companySalesEmail: payload?.companySalesEmail || 'sales@myproperty.com',
    companySupportEmail: payload?.companySupportEmail || 'support@myproperty.com',
    companyAddress: payload?.companyAddress || 'Vibhuti Khand, Gomti Nagar, Lucknow, UP',
    trialDays: Number(payload?.trialDays) || 3,
    smsProvider: payload?.smsProvider || 'msg91',
    smsSenderId: payload?.smsSenderId || 'MYPROP',
    otpExpiryMinutes: Number(payload?.otpExpiryMinutes) || 5,
  };
}

export async function updateSystemSettings(
  payload: Partial<SystemSettingsRecord>,
): Promise<SystemSettingsRecord> {
  const res = await fetch(`${API_BASE_URL}/admin/settings`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.message || json?.error || 'Failed to update settings');
  }

  return json?.data !== undefined ? json.data : json;
}
