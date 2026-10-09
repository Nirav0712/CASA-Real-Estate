import {
  AdminUser,
  AdminAuthResponse,
  OtpRequestResponse,
  LinkCredentialsPayload,
  ResetPasswordPayload,
} from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api/v1';

const ADMIN_PLATFORM_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'];

export function isPlatformAdmin(user: AdminUser): boolean {
  if (user.platformRole && ADMIN_PLATFORM_ROLES.includes(user.platformRole)) {
    return true;
  }
  if (user.role && ADMIN_PLATFORM_ROLES.includes(user.role)) {
    return true;
  }
  if (user.permissions && Array.isArray(user.permissions)) {
    const adminPerms = [
      '*',
      'admin:access',
      'users:manage',
      'users:read',
      'properties:moderate',
      'reports:read',
      'roles:manage',
      'roles:read',
      'dashboard:view',
    ];
    if (user.permissions.some((p) => adminPerms.includes(p))) {
      return true;
    }
  }
  return false;
}

/**
 * Step 1: Administrator Email & Password Authentication
 */
export async function loginAdmin(email: string, password: string): Promise<AdminAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json.message || 'Authentication failed.';
    throw new Error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
  }

  const result = (json.data || json) as AdminAuthResponse;

  // Strict Client-Side Platform Role Enforcement Guard
  if (!isPlatformAdmin(result.user)) {
    try {
      await logoutAdmin();
    } catch {
      // Ignore cleanup error
    }
    throw new Error(
      'Access Denied: Your account does not possess administrative or moderator privileges.',
    );
  }

  return result;
}

/**
 * Step 3: Secure Super Admin Onboarding — Link Email & Password to Authenticated Admin
 */
export async function linkAdminCredentials(
  token: string,
  payload: LinkCredentialsPayload,
): Promise<{ success: boolean; message: string; user: AdminUser }> {
  const response = await fetch(`${API_BASE_URL}/auth/link-credentials`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json.message || 'Failed to link credentials.';
    throw new Error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
  }

  return json;
}

/**
 * Step 4: Forgot Password Request for Administrators
 */
export async function forgotAdminPassword(email: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json.message || 'Failed to process password reset request.';
    throw new Error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
  }

  return json;
}

/**
 * Step 4: Reset Password via Secure Token
 */
export async function resetAdminPassword(
  payload: ResetPasswordPayload,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json.message || 'Failed to reset password.';
    throw new Error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
  }

  return json;
}

/**
 * Step 4: Verify Admin Email via Secure Token
 */
export async function verifyAdminEmail(
  token: string,
): Promise<{ success: boolean; message: string; user?: AdminUser }> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ token }),
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json.message || 'Email verification failed.';
    throw new Error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
  }

  return json;
}

/**
 * Step 4: Resend Email Verification Link
 */
export async function resendAdminVerification(
  email: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json.message || 'Failed to resend verification email.';
    throw new Error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
  }

  return json;
}

/**
 * Legacy Mobile OTP Fallback for Migration Phase
 */
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

  if (!isPlatformAdmin(result.user)) {
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
