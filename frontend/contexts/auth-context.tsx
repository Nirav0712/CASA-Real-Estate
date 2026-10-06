'use client';

import * as React from 'react';
import { User, OtpRequestResponse } from '@/types';
import * as authService from '@/services/auth-service';
import { useToast } from './toast-context';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  requestOtp: (mobile: string, name?: string) => Promise<OtpRequestResponse>;
  verifyOtp: (mobile: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState<boolean>(false);
  const toast = useToast();

  // Try silent session restoration via refresh cookie on mount
  React.useEffect(() => {
    async function restoreSession() {
      try {
        const authData = await authService.refreshAccessToken();
        if (authData && authData.user && authData.tokens) {
          setUser(authData.user);
          setToken(authData.tokens.accessToken);
          if (typeof window !== 'undefined' && authData.tokens.accessToken) {
            localStorage.setItem('casa_access_token', authData.tokens.accessToken);
          }
        }
      } catch {
        // No active session or refresh cookie expired — clean state
        setUser(null);
        setToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('casa_access_token');
        }
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const openAuthModal = React.useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = React.useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const requestOtp = React.useCallback(
    async (mobile: string, name?: string): Promise<OtpRequestResponse> => {
      try {
        const res = await authService.requestOtp(mobile, name);
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
    async (mobile: string, otp: string): Promise<void> => {
      try {
        const res = await authService.verifyOtp(mobile, otp);
        setUser(res.user);
        setToken(res.tokens.accessToken);
        if (typeof window !== 'undefined' && res.tokens.accessToken) {
          localStorage.setItem('casa_access_token', res.tokens.accessToken);
        }
        setIsAuthModalOpen(false);
        toast.success(
          'Welcome to CASA',
          `Signed in as ${res.user.name || res.user.normalizedMobile}`,
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
        openAuthModal,
        closeAuthModal,
        requestOtp,
        verifyOtp,
        logout,
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
