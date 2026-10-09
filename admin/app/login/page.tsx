'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuth } from '@/contexts/auth-context';
import {
  Building2,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  ArrowRight,
  RefreshCw,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import * as authService from '@/services/auth-service';

export default function AdminLoginPage() {
  const { isAuthenticated, login, requestOtp, verifyOtp } = useAdminAuth();
  const router = useRouter();

  // Mode: 'EMAIL' (primary) | 'OTP' (legacy migration fallback)
  const [authMode, setAuthMode] = React.useState<'EMAIL' | 'OTP'>('EMAIL');

  // Email/Password state
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  // OTP state
  const [otpStep, setOtpStep] = React.useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [cooldown, setCooldown] = React.useState(0);
  const [devMockOtp, setDevMockOtp] = React.useState<string | undefined>(undefined);

  // Common UI state
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  // If already authenticated, redirect to root dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Resend cooldown countdown
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid administrator email address.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Authentication failed. Please check your credentials.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setOtp('');

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (cleanPhone !== '9925843531') {
      setErrorMsg('Access Restricted: Only authorized administrator (+91 99258 43531) can log into the Governance Portal.');
      return;
    }

    setLoading(true);
    try {
      const fullMobile = `+91${cleanPhone}`;
      const res = await requestOtp(fullMobile);
      setOtpStep('OTP');
      setCooldown(res.cooldownSeconds || 60);
      if (res.devMockOtp) {
        setDevMockOtp(res.devMockOtp);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to dispatch OTP code.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (otp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the OTP code.');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const fullMobile = `+91${cleanPhone}`;
      await verifyOtp(fullMobile, otp);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid or expired OTP.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-casa-canvas flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-start">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-casa-brand text-white flex items-center justify-center mx-auto shadow-subtle">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-casa-text-primary tracking-tight">
            CASA Governance Portal
          </h1>
          <p className="text-xs text-casa-text-muted">
            Internal administrative operations, moderation queue & RBAC governance.
          </p>
        </div>

        {/* Security Warning Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="leading-relaxed">
            Restricted access. Only registered operators with Super Admin, Admin, or Moderator credentials may authenticate.
          </span>
        </div>

        {/* Login Card */}
        <Card className="p-6 shadow-subtle bg-casa-surface border border-casa-border-light space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-casa-subtle rounded-xl border border-casa-border-light text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('EMAIL');
                setErrorMsg('');
              }}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'EMAIL'
                  ? 'bg-casa-surface text-casa-text-primary shadow-xs font-bold'
                  : 'text-casa-text-muted hover:text-casa-text-primary'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email & Password</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('OTP');
                setErrorMsg('');
              }}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'OTP'
                  ? 'bg-casa-surface text-casa-text-primary shadow-xs font-bold'
                  : 'text-casa-text-muted hover:text-casa-text-primary'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Mobile OTP</span>
              <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-100 dark:bg-amber-950 px-1 py-0.2 rounded">
                Legacy
              </span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 font-medium space-y-2">
              <div>{errorMsg}</div>
              {errorMsg.toLowerCase().includes('verify') && (
                <div className="pt-1.5 border-t border-red-200 dark:border-red-900 flex items-center justify-between">
                  <span className="text-[11px] text-red-600 dark:text-red-400 font-normal">
                    Need a new activation link?
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email.trim()) return;
                      try {
                        const res = await authService.resendAdminVerification(email.trim());
                        setErrorMsg('');
                        alert(res.message || 'Verification email has been sent!');
                      } catch (err: unknown) {
                        alert(err instanceof Error ? err.message : 'Failed to resend verification.');
                      }
                    }}
                    className="text-[11px] font-bold cursor-pointer underline text-casa-brand hover:text-casa-brand/80"
                  >
                    Resend Verification Email
                  </button>
                </div>
              )}
            </div>
          )}

          {authMode === 'EMAIL' ? (
            /* Email & Password Authentication Form */
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  Administrator Email
                </label>
                <Input
                  type="email"
                  placeholder="admin@casarealestate.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  prefixIcon={<Mail className="w-3.5 h-3.5 text-casa-text-muted" />}
                  autoFocus
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-casa-text-primary block">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] text-casa-brand hover:underline font-medium"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative flex items-center">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    prefixIcon={<Lock className="w-3.5 h-3.5 text-casa-text-muted" />}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute end-3 text-casa-text-muted hover:text-casa-text-primary transition-colors cursor-pointer p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  fullWidth
                  loading={loading}
                  className="shadow-subtle"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Sign In to Governance Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-casa-text-muted">
                  First time migrating from Mobile OTP?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('OTP')}
                    className="text-casa-brand font-semibold hover:underline cursor-pointer"
                  >
                    Log in with Mobile OTP
                  </button>{' '}
                  to link your email.
                </p>
              </div>
            </form>
          ) : (
            /* Legacy Mobile OTP Form (Migration Fallback) */
            <>
              {otpStep === 'PHONE' ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div
                    onClick={() => setPhone('9925843531')}
                    className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-xl text-xs flex items-center justify-between cursor-pointer hover:bg-blue-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-casa-brand flex-shrink-0" />
                      <span className="text-blue-900 dark:text-blue-200 font-medium">
                        Super Admin Demo: <strong className="font-mono tracking-wider">99258 43531</strong>
                      </span>
                    </div>
                    <span className="text-[10px] text-casa-brand font-bold uppercase underline">
                      Auto-Fill
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                      Administrator Mobile Number
                    </label>
                    <div className="flex gap-2">
                      <div className="px-3 py-2 bg-casa-subtle border border-casa-border-medium rounded-xl text-xs font-medium text-casa-text-primary flex items-center">
                        🇮🇳 +91
                      </div>
                      <div className="flex-1">
                        <Input
                          type="tel"
                          placeholder="99258 43531"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                          maxLength={10}
                          prefixIcon={<Phone className="w-3.5 h-3.5 text-casa-text-muted" />}
                          autoFocus
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="md"
                      type="submit"
                      fullWidth
                      loading={loading}
                      className="shadow-subtle"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Request Operator OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {devMockOtp && (
                    <div
                      onClick={() => setOtp(devMockOtp)}
                      className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-xl text-xs flex items-center justify-between cursor-pointer hover:bg-blue-100/70 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-casa-brand flex-shrink-0" />
                        <span className="text-blue-900 dark:text-blue-200 font-medium">
                          Dev Mock OTP: <strong className="font-mono tracking-widest">{devMockOtp}</strong>
                        </span>
                      </div>
                      <span className="text-[10px] text-casa-brand font-bold uppercase underline">
                        Auto-Fill
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                      Enter 6-Digit Operator OTP
                    </label>
                    <Input
                      type="text"
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={6}
                      className="text-center font-mono text-lg tracking-[0.5em] font-bold"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep('PHONE');
                        setOtp('');
                        setErrorMsg('');
                      }}
                      className="text-casa-text-secondary hover:text-casa-text-primary font-medium cursor-pointer"
                    >
                      ← Change Number
                    </button>

                    <button
                      type="button"
                      disabled={cooldown > 0 || loading}
                      onClick={() => handleRequestOtp()}
                      className={`font-semibold cursor-pointer flex items-center gap-1 ${
                        cooldown > 0
                          ? 'text-casa-text-muted cursor-not-allowed'
                          : 'text-casa-brand hover:underline'
                      }`}
                    >
                      <RefreshCw className={`w-3 h-3 ${cooldown > 0 ? '' : 'animate-spin-once'}`} />
                      <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}</span>
                    </button>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="md"
                      type="submit"
                      fullWidth
                      loading={loading}
                      className="shadow-subtle"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify & Access Portal</span>
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </Card>

        <p className="text-[11px] text-center text-casa-text-muted">
          CASA Real Estate Marketplace — Internal Governance System
        </p>
      </div>
    </div>
  );
}
