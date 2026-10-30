'use client';

import * as React from 'react';
import { User, OtpRequestResponse, RegisterData, RegisterResponse } from '@/types';
import * as authService from '@/services/auth-service';
import { fetchApi } from '@/lib/api-client';
import { useToast } from './toast-context';

export type AuthModalMode = 'SIGN_IN' | 'REGISTER' | 'FORGOT_PASSWORD';

export interface LoginProtectionIntent {
  type: 'VIEW_DETAILS' | 'WHATSAPP' | 'CALL' | 'GENERAL';
  propertySlug?: string;
  propertyTitle?: string;
  returnUrl?: string;
}

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

  // Login Protection Modal (for unauthenticated visitors clicking View Details, WhatsApp, Call Advertiser)
  isLoginProtectionOpen: boolean;
  loginProtectionIntent: LoginProtectionIntent | null;
  openLoginProtection: (intent?: LoginProtectionIntent) => void;
  closeLoginProtection: () => void;

  // Pricing Plan & Free Plan Modals
  isPlanSelectionModalOpen: boolean;
  openPlanSelectionModal: () => void;
  closePlanSelectionModal: () => void;
  isTrialExpiredModalOpen: boolean;
  openTrialExpiredModal: () => void;
  closeTrialExpiredModal: () => void;
  refreshUser: () => Promise<void>;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialDaysRemaining: number;
  trialRemainingLabel: string;
  startTrial: () => Promise<void>;
  hasActiveSubscription: boolean;
  activePlanName: string | null;
  subscriptionStatus: string | null;
  subscriptionExpiresAt: string | null;
  subscriptionStartDate: string | null;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = React.useState<AuthModalMode>('SIGN_IN');
  const [isLoginProtectionOpen, setIsLoginProtectionOpen] = React.useState<boolean>(false);
  const [loginProtectionIntent, setLoginProtectionIntent] = React.useState<LoginProtectionIntent | null>(null);
  const [isPlanSelectionModalOpen, setIsPlanSelectionModalOpen] = React.useState<boolean>(false);
  const [isTrialExpiredModalOpen, setIsTrialExpiredModalOpen] = React.useState<boolean>(false);
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
      const cachedToken = typeof window !== 'undefined' ? localStorage.getItem('casa_access_token') : null;
      if (cachedToken) {
        try {
          const profile = await authService.getCurrentUser(cachedToken);
          if (isMounted && profile && profile.user) {
            setUser(profile.user);
            setToken(cachedToken);
            if (typeof window !== 'undefined') {
              localStorage.setItem('casa_user', JSON.stringify(profile.user));
            }
            if (isMounted) setIsLoading(false);
            return;
          }
        } catch {
          // Cached token may need refresh
        }
      }

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

  const isUserExempt = React.useMemo(() => {
    if (!user) return false;
    const role = String(user.role || '').toUpperCase();
    const accountType = String(user.accountType || '').toUpperCase();
    const platformRole = String(user.platformRole || '').toUpperCase();
    return (
      ['BUYER', 'TENANT', 'PURCHASER'].includes(role) ||
      ['BUYER', 'TENANT'].includes(accountType) ||
      ['SUPER_ADMIN', 'ADMIN'].includes(platformRole) ||
      ['SUPER_ADMIN', 'ADMIN'].includes(role)
    );
  }, [user]);

  const openPlanSelectionModal = React.useCallback(() => {
    if (isUserExempt) return;
    setIsPlanSelectionModalOpen(true);
  }, [isUserExempt]);

  const closePlanSelectionModal = React.useCallback(() => {
    setIsPlanSelectionModalOpen(false);
  }, []);

  const openTrialExpiredModal = React.useCallback(() => {
    if (isUserExempt) return;
    setIsTrialExpiredModalOpen(true);
  }, [isUserExempt]);

  const closeTrialExpiredModal = React.useCallback(() => {
    setIsTrialExpiredModalOpen(false);
  }, []);

  const openLoginProtection = React.useCallback((intent?: LoginProtectionIntent) => {
    const finalIntent = intent || { type: 'GENERAL' };
    setLoginProtectionIntent(finalIntent);
    setIsLoginProtectionOpen(true);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('casa_login_intent', JSON.stringify(finalIntent));
      } catch {}
    }
  }, []);

  const closeLoginProtection = React.useCallback(() => {
    setIsLoginProtectionOpen(false);
  }, []);

  const refreshUser = React.useCallback(async () => {
    try {
      const currentToken =
        token ||
        (typeof window !== 'undefined' ? localStorage.getItem('casa_access_token') : null);
      if (!currentToken) return;
      const res = await authService.getCurrentUser(currentToken);
      if (res && res.user) {
        if (res.user.status === 'DEACTIVATED' || res.user.status === 'SUSPENDED') {
          setUser(null);
          setToken(null);
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem('casa_access_token');
              localStorage.removeItem('casa_user');
            } catch {
              // ignore
            }
            if (window.location.pathname.startsWith('/dashboard')) {
              window.location.href = '/';
            }
          }
          return;
        }
        setUser(res.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('casa_user', JSON.stringify(res.user));
        }
      }
    } catch (err: any) {
      console.warn('Silent refresh user error:', err);
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('deactivated') || msg.includes('suspended')) {
        setUser(null);
        setToken(null);
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('casa_access_token');
            localStorage.removeItem('casa_user');
          } catch {
            // ignore
          }
          if (window.location.pathname.startsWith('/dashboard')) {
            window.location.href = '/';
          }
        }
      }
    }
  }, [token]);

  // Instantly handle real-time deactivation event emitted by fetchApi or session heartbeat
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleDeactivated = (e?: any) => {
      setUser(null);
      setToken(null);
      try {
        localStorage.removeItem('casa_access_token');
        localStorage.removeItem('casa_user');
        localStorage.setItem(
          'casa_deactivated_notice',
          'Your account has been deactivated by the administrator.',
        );
      } catch {
        // ignore
      }
      toast.error(
        'Account Deactivated',
        e?.detail?.message || 'Your account has been deactivated by the administrator.',
      );
      if (!window.location.pathname.startsWith('/auth/login')) {
        window.location.href = '/auth/login?deactivated=1';
      }
    };

    window.addEventListener('casa:auth:deactivated', handleDeactivated);

    // Cross-tab synchronization via localStorage storage event
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'casa_access_token') {
        if (event.newValue) {
          setToken(event.newValue);
          const cachedUserStr = localStorage.getItem('casa_user');
          if (cachedUserStr) {
            try {
              setUser(JSON.parse(cachedUserStr));
            } catch {}
          }
        } else {
          // Explicit logout in another tab
          setUser(null);
          setToken(null);
        }
      } else if (event.key === 'casa_user') {
        if (event.newValue) {
          try {
            setUser(JSON.parse(event.newValue));
          } catch {}
        } else {
          setUser(null);
        }
      } else if (event.key === 'casa_deactivated_notice' && event.newValue) {
        setUser(null);
        setToken(null);
        try {
          localStorage.removeItem('casa_access_token');
          localStorage.removeItem('casa_user');
        } catch {
          // ignore
        }
        if (!window.location.pathname.startsWith('/auth/login')) {
          window.location.href = '/auth/login?deactivated=1';
        }
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('casa:auth:deactivated', handleDeactivated);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [toast]);

  // Real-time status detection (heartbeat polling every 15s)
  React.useEffect(() => {
    if (!user && !token) return;
    if (typeof window === 'undefined') return;

    let isMounted = true;
    let isChecking = false;

    const checkSessionStatus = async () => {
      if (isChecking) return;
      const currentToken =
        token || localStorage.getItem('casa_access_token');
      if (!currentToken) return;

      isChecking = true;
      try {
        const res = await fetchApi<{ active: boolean; status: string }>('/auth/session-status', {
          headers: { Authorization: `Bearer ${currentToken}` },
        });

        if (!isMounted) return;

        if (res.status === 401 || (res.data && res.data.active === false)) {
          const errMsg = String((res as any)?.error || (res as any)?.message || '').toLowerCase();
          // Explicit deactivation/suspension by administrator
          if (errMsg.includes('deactivated') || errMsg.includes('suspended')) {
            setUser(null);
            setToken(null);
            try {
              localStorage.removeItem('casa_access_token');
              localStorage.removeItem('casa_user');
              localStorage.setItem(
                'casa_deactivated_notice',
                'Your account has been deactivated by the administrator.'
              );
            } catch {
              // ignore
            }

            toast.error(
              'Account Deactivated',
              'Your account has been deactivated by the administrator.'
            );
            if (!window.location.pathname.startsWith('/auth/login')) {
              window.location.href = '/auth/login?deactivated=1';
            }
            return;
          }

          // If ordinary 401 (e.g. access token expired), attempt silent refresh before concluding session is dead
          try {
            const authData = await authService.refreshAccessToken();
            if (isMounted && authData?.tokens?.accessToken && authData?.user) {
              setToken(authData.tokens.accessToken);
              setUser(authData.user);
              if (typeof window !== 'undefined') {
                localStorage.setItem('casa_access_token', authData.tokens.accessToken);
                localStorage.setItem('casa_user', JSON.stringify(authData.user));
              }
              return;
            }
          } catch {
            // Truly unauthenticated (refresh token expired/revoked)
            setUser(null);
            setToken(null);
            try {
              localStorage.removeItem('casa_access_token');
              localStorage.removeItem('casa_user');
            } catch {}
          }
        }
      } catch {
        // network error handled gracefully
      } finally {
        isChecking = false;
      }
    };

    // Immediate check
    checkSessionStatus();
    // Heartbeat check every 15 seconds for real-time deactivation detection
    const interval = setInterval(checkSessionStatus, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, token, toast]);

  // Check if user has an active paid subscription
  const hasActiveSubscription = React.useMemo(() => {
    if (!user) return false;
    return Boolean(
      user.hasActiveSubscription ||
      user.subscriptionStatus === 'ACTIVE' ||
      (user.activeSubscriptionId && user.activePackageId && !user.isTrialActive && (!user.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt).getTime() > Date.now()))
    );
  }, [user]);

  const activePlanName = user?.activePlanName || null;
  const subscriptionStatus = user?.subscriptionStatus || (hasActiveSubscription ? 'ACTIVE' : null);
  const subscriptionExpiresAt = user?.subscriptionExpiresAt || null;
  const subscriptionStartDate = user?.subscriptionStartDate || null;

  // Compute trial status dynamically (active paid subscription supersedes trials)
  const trialStatus = React.useMemo(() => {
    if (!user || isUserExempt || hasActiveSubscription) {
      return { isTrialActive: false, isTrialExpired: false, daysRemaining: 0, remainingLabel: '' };
    }

    // Expired or cancelled paid subscription: trial has already passed and must not restart
    if (subscriptionStatus === 'EXPIRED' || subscriptionStatus === 'CANCELLED') {
      return { isTrialActive: false, isTrialExpired: true, daysRemaining: 0, remainingLabel: 'Trial Expired' };
    }

    const hasStoredExpired = Boolean(user.trialExpired || user.isTrialExpired);
    const expires = user.trialExpiresAt ? new Date(user.trialExpiresAt).getTime() : 0;
    const now = Date.now();
    const msRemaining = expires ? expires - now : 0;
    const isExpired = hasStoredExpired || (expires > 0 && msRemaining <= 0);
    let daysRemaining = 0;
    let remainingLabel = '';

    if (!isExpired && Boolean(user.isTrialActive) && msRemaining > 0) {
      daysRemaining = Math.max(1, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
      if (user.trialRemainingLabel) {
        remainingLabel = user.trialRemainingLabel;
      } else if (daysRemaining > 60) {
        const months = Math.ceil(daysRemaining / 30);
        remainingLabel = `${months} Months Remaining`;
      } else if (daysRemaining > 30) {
        remainingLabel = '1 Month Remaining';
      } else {
        remainingLabel = `${daysRemaining} Day${daysRemaining > 1 ? 's' : ''} Remaining`;
      }
    }

    return {
      isTrialActive: !isExpired && Boolean(user.isTrialActive),
      isTrialExpired: isExpired,
      daysRemaining,
      remainingLabel,
    };
  }, [user, isUserExempt, hasActiveSubscription, subscriptionStatus]);

  const startTrial = React.useCallback(async () => {
    if (isUserExempt) {
      toast.info('Trial Not Required', 'Your account has full marketplace access without subscription restrictions.');
      return;
    }
    const currentToken =
      token || (typeof window !== 'undefined' ? localStorage.getItem('casa_access_token') : null);
    if (!currentToken) {
      throw new Error('Please sign in to start your trial.');
    }
    const res = await authService.startFreeTrial(currentToken);
    if (res && res.user) {
      setUser(res.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('casa_user', JSON.stringify(res.user));
      }
    }
    toast.success('3-Month Free Plan Started', 'Your 3-month free plan is now active with 15 property listings!');
    return res;
  }, [token, toast, isUserExempt]);

  // Auto-prompt trial expired modal once per session only if trial has passed and user has no active paid subscription
  const hasPromptedExpiryRef = React.useRef(false);
  React.useEffect(() => {
    if (user && !isUserExempt && !hasActiveSubscription && trialStatus.isTrialExpired && !hasPromptedExpiryRef.current) {
      hasPromptedExpiryRef.current = true;
      setIsTrialExpiredModalOpen(true);
    }
  }, [user, isUserExempt, hasActiveSubscription, trialStatus.isTrialExpired]);

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
          'Welcome to myproperty',
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
        // Registration does NOT log the user in.
        // User must verify email and manually sign in.
        toast.success(
          'Registration Successful',
          'Registration successful! Please verify your email address before signing in.',
        );
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
          'Welcome to myproperty',
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
        isLoginProtectionOpen,
        loginProtectionIntent,
        openLoginProtection,
        closeLoginProtection,
        isPlanSelectionModalOpen,
        openPlanSelectionModal,
        closePlanSelectionModal,
        isTrialExpiredModalOpen,
        openTrialExpiredModal,
        closeTrialExpiredModal,
        refreshUser,
        isTrialActive: trialStatus.isTrialActive,
        isTrialExpired: trialStatus.isTrialExpired,
        trialDaysRemaining: trialStatus.daysRemaining,
        trialRemainingLabel: trialStatus.remainingLabel,
        startTrial,
        hasActiveSubscription,
        activePlanName,
        subscriptionStatus,
        subscriptionExpiresAt,
        subscriptionStartDate,
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

