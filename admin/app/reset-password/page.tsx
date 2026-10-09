'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as authService from '@/services/auth-service';
import {
  Building2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!token) {
      setErrorMsg('Missing or invalid password reset token in URL.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.resetAdminPassword({
        token,
        email: emailParam || undefined,
        newPassword,
        confirmPassword,
      });
      setSuccessMsg(res.message || 'Password reset successfully. You can now sign in.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
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
          Set New Administrator Password
        </h1>
        <p className="text-xs text-casa-text-muted">
          Enter your new password to restore access to the CASA Governance Portal.
        </p>
      </div>

      {/* Card */}
      <Card className="p-6 shadow-subtle bg-casa-surface border border-casa-border-light space-y-4">
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg ? (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-casa-text-primary">Password Reset Complete</h2>
              <p className="text-xs text-casa-text-muted leading-relaxed">{successMsg}</p>
            </div>
            <div className="pt-2">
              <Link href="/login">
                <Button variant="primary" size="md" fullWidth>
                  <span>Sign In with New Password</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                New Secure Password
              </label>
              <div className="relative flex items-center">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  prefixIcon={<Lock className="w-3.5 h-3.5 text-casa-text-muted" />}
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute end-3 text-casa-text-muted hover:text-casa-text-primary transition-colors cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                Confirm New Password
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                prefixIcon={<Lock className="w-3.5 h-3.5 text-casa-text-muted" />}
                required
              />
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
                <KeyRound className="w-3.5 h-3.5 mr-1" />
                <span>Update Password</span>
              </Button>
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-xs text-casa-text-muted hover:text-casa-text-primary font-medium"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back to Administrator Login</span>
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <div className="min-h-screen bg-casa-canvas flex flex-col items-center justify-center p-4">
      <React.Suspense
        fallback={
          <div className="text-xs text-casa-text-muted">Loading reset form...</div>
        }
      >
        <ResetPasswordContent />
      </React.Suspense>
    </div>
  );
}
