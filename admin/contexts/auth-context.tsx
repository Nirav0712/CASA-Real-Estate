'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminUser, OtpRequestResponse, LinkCredentialsPayload } from '@/types';
import * as authService from '@/services/auth-service';
import { useToast } from './toast-context';

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  linkCredentials: (payload: LinkCredentialsPayload) => Promise<void>;
  refreshProfile: () => Promise<void>;
  requestOtp: (mobile: string) => Promise<OtpRequestResponse>;
  verifyOtp: (mobile: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = React.createContext<AdminAuthContextType | undefined>(undefined);

const PUBLIC_AUTH_PATHS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = React.useState<AdminUser | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  React.useEffect(() => {
    async function restoreSession() {
      try {
        const authData = await authService.refreshAdminSession();
        if (authData && authData.user && authData.tokens) {
          setAdminUser(authData.user);
          setToken(authData.tokens.accessToken);
          if (typeof window !== 'undefined' && authData.tokens.accessToken) {
            localStorage.setItem('casa_admin_access_token', authData.tokens.accessToken);
          }
        }
      } catch {
        setAdminUser(null);
        setToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('casa_admin_access_token');
        }
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = React.useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        const res = await authService.loginAdmin(email, password);
        setAdminUser(res.user);
        setToken(res.tokens.accessToken);
        if (typeof window !== 'undefined' && res.tokens.accessToken) {
          localStorage.setItem('casa_admin_access_token', res.tokens.accessToken);
        }
        toast.success(
          'Operator Authenticated',
          `Welcome back, ${res.user.name || res.user.role}`,
        );
        router.push('/');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid email or password.';
        toast.error('Authentication Failed', message);
        throw err;
      }
    },
    [toast, router],
  );

  const refreshProfile = React.useCallback(async (): Promise<void> => {
    if (!token) return;
    try {
      const res = await authService.getCurrentAdmin(token);
      if (res && res.user) {
        setAdminUser(res.user);
      }
    } catch {
      // Ignore refresh error
    }
  }, [token]);

  const linkCredentials = React.useCallback(
    async (payload: LinkCredentialsPayload): Promise<void> => {
      if (!token) {
        throw new Error('You must be authenticated to link credentials.');
      }
      try {
        const res = await authService.linkAdminCredentials(token, payload);
        if (res.user) {
          setAdminUser(res.user);
        }
        toast.success(
          'Credentials Linked',
          'Verification email sent. Please verify your email before logging in with password.',
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to link credentials.';
        toast.error('Link Failed', message);
        throw err;
      }
    },
    [token, toast],
  );

  const requestOtp = React.useCallback(
    async (mobile: string): Promise<OtpRequestResponse> => {
      try {
        const res = await authService.requestAdminOtp(mobile);
        return res;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to send OTP code.';
        toast.error('Authentication Error', message);
        throw err;
      }
    },
    [toast],
  );

  const verifyOtp = React.useCallback(
    async (mobile: string, otp: string): Promise<void> => {
      try {
        const res = await authService.verifyAdminOtp(mobile, otp);
        setAdminUser(res.user);
        setToken(res.tokens.accessToken);
        if (typeof window !== 'undefined' && res.tokens.accessToken) {
          localStorage.setItem('casa_admin_access_token', res.tokens.accessToken);
        }
        toast.success(
          'Operator Authenticated',
          `Welcome back, ${res.user.name || res.user.role}`,
        );
        router.push('/');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid or expired OTP.';
        toast.error('Access Denied', message);
        throw err;
      }
    },
    [toast, router],
  );

  const logout = React.useCallback(async (): Promise<void> => {
    try {
      await authService.logoutAdmin();
    } finally {
      setAdminUser(null);
      setToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('casa_admin_access_token');
      }
      toast.info('Signed Out', 'Administrative session terminated.');
      router.push('/login');
    }
  }, [toast, router]);

  // Route protection redirect for unauthenticated users on non-public auth pages
  React.useEffect(() => {
    const isPublicPage = PUBLIC_AUTH_PATHS.some((p) => pathname === p || pathname?.startsWith(p));
    if (!isLoading && !adminUser && !isPublicPage) {
      router.push('/login');
    }
  }, [isLoading, adminUser, pathname, router]);

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        token,
        isAuthenticated: !!adminUser,
        isLoading,
        login,
        linkCredentials,
        refreshProfile,
        requestOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextType {
  const context = React.useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
