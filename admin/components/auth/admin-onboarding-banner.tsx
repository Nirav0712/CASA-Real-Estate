'use client';

import * as React from 'react';
import { useAdminAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as authService from '@/services/auth-service';
import { useToast } from '@/contexts/toast-context';
import {
  ShieldAlert,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Send,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

export function AdminOnboardingBanner() {
  const { adminUser, linkCredentials, refreshProfile } = useAdminAuth();
  const toast = useToast();

  const [isOpen, setIsOpen] = React.useState(false);
  const [email, setEmail] = React.useState(adminUser?.email || '');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  // Determine if onboarding is required
  const needsMigration = !adminUser?.email || !adminUser?.hasPassword;
  const isUnverified = adminUser?.email && !adminUser?.isEmailVerified;

  if (!needsMigration && !isUnverified) {
    return null;
  }

  const handleLinkCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid administrator email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await linkCredentials({
        email: email.trim(),
        password,
        confirmPassword,
      });
      setSuccessMsg(
        'Credentials linked successfully! A verification link has been sent to your email. Please verify to enable password login.',
      );
      await refreshProfile();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to link credentials.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!adminUser?.email) return;
    setResending(true);
    try {
      const res = await authService.resendAdminVerification(adminUser.email);
      toast.success('Verification Sent', res.message || 'Verification email sent successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend verification.';
      toast.error('Resend Error', message);
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      {/* Banner in Header */}
      <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-b border-amber-300 dark:border-amber-800/60 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-700 dark:text-amber-400">
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <div className="text-amber-900 dark:text-amber-200">
            <span className="font-bold">Migration Notice:</span>{' '}
            {needsMigration ? (
              <span>
                Your Super Admin account is using legacy mobile authentication. Link your email and password to secure your account.
              </span>
            ) : (
              <span>
                Your email <strong className="font-mono">{adminUser?.email}</strong> is pending verification. Verify your email to enable password login.
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {needsMigration ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsOpen(true);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] shadow-xs"
            >
              <KeyRound className="w-3 h-3 mr-1" />
              <span>Link Email & Password</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              loading={resending}
              onClick={handleResendVerification}
              className="border-amber-400 text-amber-800 dark:text-amber-200 text-[11px]"
            >
              <Send className="w-3 h-3 mr-1" />
              <span>Resend Verification Link</span>
            </Button>
          )}
        </div>
      </div>

      {/* Setup Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-casa-surface border border-casa-border-light rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 text-start">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Security Migration</span>
                </div>
                <h2 className="text-base font-bold text-casa-text-primary">
                  Link Email & Set Administrator Password
                </h2>
                <p className="text-xs text-casa-text-muted">
                  Binds your authenticated operator identity to an official email address and password.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-casa-text-muted hover:text-casa-text-primary hover:bg-casa-subtle cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {!successMsg ? (
              <form onSubmit={handleLinkCredentials} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                    Official Administrator Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="superadmin@casarealestate.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    prefixIcon={<Mail className="w-3.5 h-3.5 text-casa-text-muted" />}
                    required
                    autoFocus
                  />
                  <p className="text-[11px] text-casa-text-muted mt-1">
                    A verification link will be dispatched to this inbox.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                    New Secure Password
                  </label>
                  <div className="relative flex items-center">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 8 chars with uppercase, number, symbol"
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

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                    Confirm New Password
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat the new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    prefixIcon={<Lock className="w-3.5 h-3.5 text-casa-text-muted" />}
                    required
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="md"
                    type="button"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    loading={loading}
                    className="shadow-subtle"
                  >
                    <KeyRound className="w-3.5 h-3.5 mr-1" />
                    <span>Save & Send Verification Link</span>
                  </Button>
                </div>
              </form>
            ) : (
              <div className="pt-2 flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsOpen(false)}
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
