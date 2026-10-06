import { User, AuthResponse, OtpRequestResponse } from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api/v1';

export async function requestOtp(
  mobile: string,
  name?: string,
  role?: string,
): Promise<OtpRequestResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/otp/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ mobile, name, role }),
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json.message || 'Failed to request verification code';
    throw new Error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
  }

  return json.data || json;
}

export async function verifyOtp(mobile: string, otp: string): Promise<AuthResponse> {
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

  return json.data || json;
}

export async function refreshAccessToken(): Promise<AuthResponse> {
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

  return json.data || json;
}

export async function logoutApi(): Promise<void> {
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

export async function getCurrentUser(token: string): Promise<{ user: User }> {
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
