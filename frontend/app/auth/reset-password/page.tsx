'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import {
  KeyRound,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Mail,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import * as authService from '@/services/auth-service';

export default function ResetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="w-8 h-8 border-3 border-casa-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </React.Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openAuthModal } = useAuth();

  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [token, setToken] = React.useState(tokenParam);
  const [email, setEmail] = React.useState(emailParam);
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    if (tokenParam) setToken(tokenParam);
    if (emailParam) setEmail(emailParam);
  }, [tokenParam, emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!token.trim()) {
      setErrorMsg('Password reset token is missing or invalid.');
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({
        token: token.trim(),
        email: email.trim(),
        newPassword,
        confirmPassword,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to reset password. Link may be expired.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
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

        {success ? (
          <div className="space-y-5 py-2">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 animate-in zoom-in-95">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-casa-text-primary">
                Password Reset Successfully
              </h2>
              <p className="text-xs text-casa-text-secondary max-w-xs mx-auto leading-relaxed">
                Your password has been updated. All existing sessions have been terminated for security. You can now sign in with your new password.
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
                <span>Sign In to CASA</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-casa-text-primary">
                Choose a New Password
              </h2>
              <p className="text-xs text-casa-text-muted max-w-xs mx-auto">
                Set a strong password of at least 8 characters for your CASA account.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 font-medium flex items-start gap-2 text-start">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-start">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  Registered Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  prefixIcon={<Mail className="w-4 h-4 text-casa-text-muted" />}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    prefixIcon={<Lock className="w-4 h-4 text-casa-text-muted" />}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-casa-text-muted hover:text-casa-text-primary cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    prefixIcon={<Lock className="w-4 h-4 text-casa-text-muted" />}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-casa-text-muted hover:text-casa-text-primary cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
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
                  className="shadow-subtle py-2.5 font-bold"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Update Password</span>
                </Button>
              </div>

              <div className="text-center pt-1">
                <Link
                  href="/"
                  className="text-xs text-casa-brand font-semibold hover:underline"
                >
                  ← Return to CASA Marketplace
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
