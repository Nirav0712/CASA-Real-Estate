'use client';

import * as React from 'react';
import { User, OtpRequestResponse, RegisterData, RegisterResponse } from '@/types';
import * as authService from '@/services/auth-service';
import { useToast } from './toast-context';

export type AuthModalMode = 'SIGN_IN' | 'REGISTER' | 'FORGOT_PASSWORD';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  openAuthModal: (initialMode?: AuthModalMode | React.MouseEvent | any) => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: AuthModalMode) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  requestOtp: (
    mobile: string,
    name?: string,
    role?: string,
    agencyName?: string,
  ) => Promise<OtpRequestResponse>;
  verifyOtp: (
    mobile: string,
    otp: string,
    name?: string,
    role?: string,
    agencyName?: string,
  ) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = React.useState<AuthModalMode>('SIGN_IN');
  const toast = useToast();

  // Instantly restore cached session from localStorage on mount, then silently refresh
  React.useEffect(() => {
    let isMounted = true;

    // Fast sync recovery from localStorage
    if (typeof window !== 'undefined') {
      try {
        const cachedUser = localStorage.getItem('casa_user');
        const cachedToken = localStorage.getItem('casa_access_token');
        if (cachedUser && cachedToken) {
          const parsed = JSON.parse(cachedUser);
          setUser(parsed);
          setToken(cachedToken);
        }
      } catch {
        // ignore parse error
      }
    }

    async function restoreSession() {
      try {
        const authData = await authService.refreshAccessToken();
        if (isMounted && authData && authData.user && authData.tokens) {
          setUser(authData.user);
          setToken(authData.tokens.accessToken);
          if (typeof window !== 'undefined') {
            localStorage.setItem('casa_access_token', authData.tokens.accessToken);
            localStorage.setItem('casa_user', JSON.stringify(authData.user));
          }
        }
      } catch {
        // If refresh failed and we had no valid cached token, clean state
        if (isMounted) {
          if (typeof window !== 'undefined' && !localStorage.getItem('casa_access_token')) {
            setUser(null);
            setToken(null);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const openAuthModal = React.useCallback((initialMode?: any) => {
    if (initialMode && typeof initialMode === 'string') {
      setAuthModalMode(initialMode as AuthModalMode);
    }
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = React.useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  /**
   * Email/Password Sign In
   */
  const login = React.useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        const res = await authService.login({ email, password });
        setUser(res.user);
        setToken(res.tokens.accessToken);
        if (typeof window !== 'undefined') {
          if (res.tokens.accessToken) {
            localStorage.setItem('casa_access_token', res.tokens.accessToken);
          }
          if (res.user) {
            localStorage.setItem('casa_user', JSON.stringify(res.user));
          }
        }
        setIsAuthModalOpen(false);
        const roleLabel = res.user.role ? ` (${res.user.role.replace('_', ' ')})` : '';
        toast.success(
          'Welcome to CASA',
          `Signed in as ${res.user.name || res.user.email || res.user.normalizedMobile}${roleLabel}`,
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid credentials or login failure.';
        toast.error('Sign In Failed', message);
        throw err;
      }
    },
    [toast],
  );

  /**
   * Email/Password Registration
   */
  const register = React.useCallback(
    async (data: RegisterData): Promise<RegisterResponse> => {
      try {
        const res = await authService.register(data);
        return res;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
        toast.error('Registration Error', message);
        throw err;
      }
    },
    [toast],
  );

  const requestOtp = React.useCallback(
    async (
      mobile: string,
      name?: string,
      role?: string,
      agencyName?: string,
    ): Promise<OtpRequestResponse> => {
      try {
        const res = await authService.requestOtp(mobile, name, role, agencyName);
        return res;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to send OTP code.';
        toast.error('Verification Error', message);
        throw err;
      }
    },
    [toast],
  );

  const verifyOtp = React.useCallback(
    async (
      mobile: string,
      otp: string,
      name?: string,
      role?: string,
      agencyName?: string,
    ): Promise<void> => {
      try {
        const res = await authService.verifyOtp(mobile, otp, name, role, agencyName);
        setUser(res.user);
        setToken(res.tokens.accessToken);
        if (typeof window !== 'undefined') {
          if (res.tokens.accessToken) {
            localStorage.setItem('casa_access_token', res.tokens.accessToken);
          }
          if (res.user) {
            localStorage.setItem('casa_user', JSON.stringify(res.user));
          }
        }
        setIsAuthModalOpen(false);
        const roleLabel = res.user.role ? ` (${res.user.role.replace('_', ' ')})` : '';
        toast.success(
          'Welcome to CASA',
          `Signed in as ${res.user.name || res.user.normalizedMobile}${roleLabel}`,
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid or expired OTP.';
        toast.error('Authentication Failed', message);
        throw err;
      }
    },
    [toast],
  );

  const logout = React.useCallback(async (): Promise<void> => {
    try {
      await authService.logoutApi();
    } finally {
      setUser(null);
      setToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('casa_access_token');
        localStorage.removeItem('casa_user');
      }
      toast.info('Signed Out', 'You have been safely signed out of your account.');
    }
  }, [toast]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
        login,
        register,
        logout,
        requestOtp,
        verifyOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

