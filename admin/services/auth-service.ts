import { AdminUser, AdminAuthResponse, OtpRequestResponse } from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api/v1';

const ADMIN_PLATFORM_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'];

function isPlatformAdmin(user: AdminUser): boolean {
  if (user.platformRole) {
    return ADMIN_PLATFORM_ROLES.includes(user.platformRole);
  }
  return ADMIN_PLATFORM_ROLES.includes(user.role);
}

export async function requestAdminOtp(mobile: string): Promise<OtpRequestResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/otp/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ mobile }),
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json.message || 'Failed to request verification code';
    throw new Error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
  }

  return json.data || json;
}

export async function verifyAdminOtp(mobile: string, otp: string): Promise<AdminAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ mobile, otp }),
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json.message || 'Verification failed';
    throw new Error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
  }

  const result = (json.data || json) as AdminAuthResponse;

  // Strict Client-Side Platform Role Enforcement Check
  if (!isPlatformAdmin(result.user)) {
    // Revoke token immediately
    try {
      await logoutAdmin();
    } catch {
      // Ignore
    }
    throw new Error(
      'Access Denied: Your account does not possess administrative or moderator privileges.',
    );
  }

  return result;
}

export async function refreshAdminSession(): Promise<AdminAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({}),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || 'Session expired');
  }

  const result = (json.data || json) as AdminAuthResponse;

  if (!isPlatformAdmin(result.user)) {
    throw new Error('Access Denied: Insufficient administrative privileges.');
  }

  return result;
}

export async function logoutAdmin(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({}),
    });
  } catch {
    // Ignore network error on logout
  }
}

export async function getCurrentAdmin(token: string): Promise<{ user: AdminUser }> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || 'Failed to retrieve profile');
  }

  return json.data || json;
}
