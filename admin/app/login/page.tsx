'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/logo';
import { useAdminAuth } from '@/contexts/auth-context';
import {
  ShieldAlert,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
} from 'lucide-react';
import * as authService from '@/services/auth-service';

export default function AdminLoginPage() {
  const { isAuthenticated, login } = useAdminAuth();
  const router = useRouter();

  // Email/Username and Password state
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  // Common UI state
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  // If already authenticated, redirect to root dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    } else if (typeof window !== 'undefined') {
      const isDeactivated = window.location.search.includes('deactivated=1');
      const notice = localStorage.getItem('casa_admin_deactivated_notice');
      if (isDeactivated || notice) {
        setErrorMsg('Your account has been deactivated by the administrator.');
        try {
          localStorage.removeItem('casa_admin_deactivated_notice');
        } catch {
          // ignore
        }
      }
    }
  }, [isAuthenticated, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your administrator email or username.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login(identifier.trim(), password);
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

  return (
    <div className="min-h-screen bg-casa-canvas flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-start">
        {/* Brand Header */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <Logo size="lg" height={60} href={null} />
          <h1 className="text-xl font-bold text-casa-text-primary tracking-tight">
            Governance & Operations Portal
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
          <div className="pb-1 border-b border-casa-border-light">
            <h2 className="text-sm font-bold text-casa-text-primary">
              Operator Sign In
            </h2>
            <p className="text-xs text-casa-text-muted mt-0.5">
              Enter your authorized admin email or username and secure password
            </p>
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
                      if (!identifier.trim()) return;
                      try {
                        const res = await authService.resendAdminVerification(identifier.trim());
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

          {/* Email/Username & Password Authentication Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                Administrator Email / Username
              </label>
              <Input
                type="text"
                placeholder="admin@my-property.in"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
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
          </form>
        </Card>

        <p className="text-[11px] text-center text-casa-text-muted">
          myproperty Marketplace — Internal Governance System
        </p>
      </div>
    </div>
  );
}
