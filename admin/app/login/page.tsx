'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuth } from '@/contexts/auth-context';
import {
  Building2,
  ShieldAlert,
  ShieldCheck,
  Phone,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Lock,
} from 'lucide-react';

export default function AdminLoginPage() {
  const { isAuthenticated, requestOtp, verifyOtp } = useAdminAuth();
  const router = useRouter();

  const [step, setStep] = React.useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [cooldown, setCooldown] = React.useState(0);
  const [devMockOtp, setDevMockOtp] = React.useState<string | undefined>(undefined);

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

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setOtp('');

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const fullMobile = `+91${cleanPhone}`;
      const res = await requestOtp(fullMobile);
      setStep('OTP');
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
            Restricted access. Only registered system operators with Super Admin, Admin, or Moderator credentials may authenticate.
          </span>
        </div>

        {/* Login Card */}
        <Card className="p-6 shadow-subtle bg-casa-surface border border-casa-border-light">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 font-medium">
              {errorMsg}
            </div>
          )}

          {step === 'PHONE' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div
                onClick={() => setPhone('9876543210')}
                className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-xl text-xs flex items-center justify-between cursor-pointer hover:bg-blue-100/70 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-casa-brand flex-shrink-0" />
                  <span className="text-blue-900 dark:text-blue-200 font-medium">
                    Demo Operator: <strong className="font-mono tracking-wider">98765 43210</strong>
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
                      placeholder="98765 43210"
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
              {/* Dev Mock Auto-Fill Banner */}
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
                    setStep('PHONE');
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
        </Card>

        <p className="text-[11px] text-center text-casa-text-muted">
          CASA Real Estate Marketplace — Internal Governance System
        </p>
      </div>
    </div>
  );
}
