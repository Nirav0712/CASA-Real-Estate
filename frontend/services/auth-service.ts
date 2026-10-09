import {
  User,
  AuthResponse,
  OtpRequestResponse,
  RegisterData,
  RegisterResponse,
  LoginData,
  VerifyEmailData,
  ResendVerificationData,
  ForgotPasswordData,
  ResetPasswordData,
  GenericAuthResponse,
} from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api/v1';

/**
 * Step 3A.1: Register a new account with email & password
 */
export async function register(data: RegisterData): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json.message || 'Registration failed';
    throw new Error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
  }

  return json.data || json;
}

/**
 * Step 3A.2: Sign in with email and password
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json.message || 'Sign in failed';
    throw new Error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
  }

  return json.data || json;
}

/**
 * Step 3A.3: Verify email address with token
 */
export async function verifyEmail(data: VerifyEmailData): Promise<GenericAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json.message || 'Email verification failed';
    throw new Error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
  }

  return json.data || json;
}

/**
 * Step 3A.4: Resend email verification link
 */
export async function resendVerification(
  data: ResendVerificationData,
): Promise<GenericAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json.message || 'Failed to resend verification email';
    throw new Error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
  }

  return json.data || json;
}

/**
 * Step 3A.5: Request password reset link (Forgot Password)
 */
export async function forgotPassword(
  data: ForgotPasswordData,
): Promise<GenericAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json.message || 'Failed to process password reset request';
    throw new Error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
  }

  return json.data || json;
}

/**
 * Step 3A.6: Reset password using token
 */
export async function resetPassword(
  data: ResetPasswordData,
): Promise<GenericAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json.message || 'Failed to reset password';
    throw new Error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
  }

  return json.data || json;
}

/**
 * Rotate and refresh access token via HttpOnly cookie
 */
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

/**
 * Terminate active session and clear cookies
 */
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

/**
 * Retrieve current authenticated user profile
 */
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

/**
 * Backward compatibility: Request OTP
 */
export async function requestOtp(
  mobile: string,
  name?: string,
  role?: string,
  agencyName?: string,
): Promise<OtpRequestResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/otp/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ mobile, name, role, agencyName }),
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json.message || 'Failed to request verification code';
    throw new Error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
  }

  return json.data || json;
}

/**
 * Backward compatibility: Verify OTP
 */
export async function verifyOtp(
  mobile: string,
  otp: string,
  name?: string,
  role?: string,
  agencyName?: string,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ mobile, otp, name, role, agencyName }),
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json.message || 'Verification failed';
    throw new Error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
  }

  return json.data || json;
}

