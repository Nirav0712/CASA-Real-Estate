'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as authService from '@/services/auth-service';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Mail,
  Send,
} from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = React.useState<'VERIFYING' | 'SUCCESS' | 'ERROR'>(
    token ? 'VERIFYING' : 'ERROR',
  );
  const [message, setMessage] = React.useState('');
  const [resendEmail, setResendEmail] = React.useState('');
  const [resending, setResending] = React.useState(false);
  const [resendStatus, setResendStatus] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) {
      setStatus('ERROR');
      setMessage('No verification token provided in URL.');
      return;
    }

    let isMounted = true;
    authService
      .verifyAdminEmail(token)
      .then((res) => {
        if (isMounted) {
          setStatus('SUCCESS');
          setMessage(res.message || 'Your email address has been verified successfully!');
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setStatus('ERROR');
          setMessage(
            err instanceof Error
              ? err.message
              : 'Invalid or expired verification link.',
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResending(true);
    setResendStatus(null);
    try {
      const res = await authService.resendAdminVerification(resendEmail.trim());
      setResendStatus(res.message || 'Verification link sent successfully.');
    } catch (err: unknown) {
      setResendStatus(
        err instanceof Error ? err.message : 'Failed to resend verification link.',
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 text-start">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-casa-brand text-white flex items-center justify-center mx-auto shadow-subtle">
          <Building2 className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-casa-text-primary tracking-tight">
          Administrator Email Verification
        </h1>
        <p className="text-xs text-casa-text-muted">
          Confirming your identity to activate email & password access.
        </p>
      </div>

      {/* Card */}
      <Card className="p-6 shadow-subtle bg-casa-surface border border-casa-border-light space-y-5">
        {status === 'VERIFYING' && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 text-casa-brand animate-spin" />
            <h2 className="text-sm font-bold text-casa-text-primary">
              Verifying Your Administrator Credentials...
            </h2>
            <p className="text-xs text-casa-text-muted">
              Please wait while we validate your secure token against CASA governance standards.
            </p>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="py-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-casa-text-primary">
                Email Verified Successfully!
              </h2>
              <p className="text-xs text-casa-text-muted leading-relaxed">{message}</p>
            </div>
            <div className="pt-3">
              <Link href="/login">
                <Button variant="primary" size="md" fullWidth>
                  <span>Sign In with Email & Password</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === 'ERROR' && (
          <div className="py-2 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
                <XCircle className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-casa-text-primary">
                Verification Failed or Expired
              </h2>
              <p className="text-xs text-casa-text-muted">{message}</p>
            </div>

            <div className="p-4 bg-casa-subtle rounded-xl border border-casa-border-light space-y-3">
              <span className="text-xs font-semibold text-casa-text-primary block">
                Request a New Verification Link
              </span>
              <form onSubmit={handleResend} className="space-y-2">
                <Input
                  type="email"
                  placeholder="admin@casarealestate.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  prefixIcon={<Mail className="w-3.5 h-3.5 text-casa-text-muted" />}
                  required
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="submit"
                  fullWidth
                  loading={resending}
                >
                  <Send className="w-3 h-3 mr-1" />
                  <span>Resend Verification Email</span>
                </Button>
              </form>
              {resendStatus && (
                <p className="text-[11px] text-casa-brand font-medium">{resendStatus}</p>
              )}
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="text-xs text-casa-text-secondary hover:text-casa-text-primary font-medium"
              >
                ← Return to Administrator Login
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AdminVerifyEmailPage() {
  return (
    <div className="min-h-screen bg-casa-canvas flex flex-col items-center justify-center p-4">
      <React.Suspense
        fallback={
          <div className="text-xs text-casa-text-muted">Loading verification...</div>
        }
      >
        <VerifyEmailContent />
      </React.Suspense>
    </div>
  );
}
