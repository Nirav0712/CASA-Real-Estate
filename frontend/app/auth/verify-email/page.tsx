'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import {
  CheckCircle2,
  XCircle,
  Mail,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import * as authService from '@/services/auth-service';

export default function VerifyEmailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="w-8 h-8 border-3 border-casa-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </React.Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openAuthModal } = useAuth();

  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [status, setStatus] = React.useState<'VERIFYING' | 'SUCCESS' | 'ERROR'>('VERIFYING');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [resendEmail, setResendEmail] = React.useState(emailParam);
  const [resending, setResending] = React.useState(false);
  const [resendNotice, setResendNotice] = React.useState('');
  const [cooldown, setCooldown] = React.useState(0);

  // Cooldown timer
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Execute verification on mount
  React.useEffect(() => {
    let isCancelled = false;

    async function executeVerification() {
      if (!tokenParam || !emailParam) {
        setStatus('ERROR');
        setErrorMessage('Verification link is incomplete or missing security parameters.');
        return;
      }

      try {
        await authService.verifyEmail({ token: tokenParam, email: emailParam });
        if (!isCancelled) {
          setStatus('SUCCESS');
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Verification link has expired or is invalid.';
          setStatus('ERROR');
          setErrorMessage(msg);
        }
      }
    }

    executeVerification();

    return () => {
      isCancelled = true;
    };
  }, [tokenParam, emailParam]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim() || cooldown > 0) return;

    setResending(true);
    setResendNotice('');
    try {
      await authService.resendVerification({ email: resendEmail.trim() });
      setResendNotice('If an unverified account exists, a new activation link has been sent.');
      setCooldown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend verification email.';
      setResendNotice(msg);
    } finally {
      setResending(false);
    }
  };

  const handleGoToSignIn = () => {
    openAuthModal('SIGN_IN');
    router.push('/');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-casa-canvas via-casa-surface to-casa-canvas">
      <div className="w-full max-w-md bg-casa-surface border border-casa-border-medium rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 bg-casa-brand/10 border border-casa-brand/20 rounded-xl flex items-center justify-center text-casa-brand font-bold text-lg">
            C
          </div>
          <span className="text-xl font-black tracking-tight text-casa-text-primary">
            CASA<span className="text-casa-brand">.</span>
          </span>
        </div>

        {/* Status Views */}
        {status === 'VERIFYING' && (
          <div className="space-y-4 py-6">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-casa-brand/20 border-t-casa-brand rounded-full animate-spin" />
              <ShieldCheck className="w-7 h-7 text-casa-brand absolute" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-casa-text-primary">
                Verifying Your Email
              </h2>
              <p className="text-xs text-casa-text-muted">
                Please wait while we validate your activation token with the security server...
              </p>
            </div>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="space-y-5 py-4">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 animate-in zoom-in-95">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-casa-text-primary">
                Email Address Verified!
              </h2>
              <p className="text-xs text-casa-text-secondary max-w-xs mx-auto leading-relaxed">
                Your email <strong className="text-casa-text-primary">{emailParam}</strong> has been successfully verified. Your CASA account is now active.
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleGoToSignIn}
                className="font-bold py-3 shadow-subtle"
              >
                <span>Sign In to Your Account</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {status === 'ERROR' && (
          <div className="space-y-5 py-2">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
              <XCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-casa-text-primary">
                Verification Link Expired or Invalid
              </h2>
              <p className="text-xs text-rose-600 dark:text-rose-400 max-w-xs mx-auto">
                {errorMessage}
              </p>
            </div>

            {/* Resend Section */}
            <div className="p-4 bg-casa-subtle rounded-2xl border border-casa-border-light text-start space-y-3">
              <p className="text-xs font-semibold text-casa-text-primary">
                Request a Fresh Activation Link
              </p>

              {resendNotice && (
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                  {resendNotice}
                </div>
              )}

              <form onSubmit={handleResend} className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter registered email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  prefixIcon={<Mail className="w-4 h-4 text-casa-text-muted" />}
                  required
                />
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  fullWidth
                  loading={resending}
                  disabled={cooldown > 0}
                  className="font-bold py-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Activation Link'}
                  </span>
                </Button>
              </form>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="text-xs text-casa-brand font-semibold hover:underline"
              >
                ← Return to CASA Marketplace Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
