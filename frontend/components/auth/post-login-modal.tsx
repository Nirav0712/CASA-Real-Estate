'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  FileText,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { isKycExempt } from '@/components/dashboard/kyc-status-banner';

export function PostLoginModal() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [isOpen, setIsOpen] = React.useState(false);
  const [step, setStep] = React.useState<'TRIAL' | 'KYC'>('TRIAL');

  React.useEffect(() => {
    if (!isAuthenticated || !user || !user.id) {
      setIsOpen(false);
      return;
    }

    // Do not show if email is pending verification
    if (user.status === 'PENDING_VERIFICATION') {
      setIsOpen(false);
      return;
    }

    // Check if dismissed for this browser session
    const storageKey = `myproperty_post_login_seen_${user.id}`;
    const alreadySeen = sessionStorage.getItem(storageKey);
    if (alreadySeen) {
      return;
    }

    const hasActiveTrial = Boolean(user.isTrialActive);
    const kycExempt = isKycExempt(user);
    const kycNeedsAttention =
      !kycExempt &&
      user.kycStatus !== 'APPROVED' &&
      user.kycStatus !== 'VERIFIED';

    if (hasActiveTrial && kycNeedsAttention) {
      setStep('TRIAL');
      setIsOpen(true);
    } else if (hasActiveTrial) {
      setStep('TRIAL');
      setIsOpen(true);
    } else if (kycNeedsAttention) {
      setStep('KYC');
      setIsOpen(true);
    }
  }, [isAuthenticated, user]);

  if (!isOpen || !user) return null;

  const hasActiveTrial = Boolean(user.isTrialActive);
  const kycExempt = isKycExempt(user);
  const kycNeedsAttention =
    !kycExempt &&
    user.kycStatus !== 'APPROVED' &&
    user.kycStatus !== 'VERIFIED';

  const handleDismiss = () => {
    sessionStorage.setItem(`myproperty_post_login_seen_${user.id}`, 'true');
    setIsOpen(false);
  };

  const handleGoToKyc = () => {
    handleDismiss();
    router.push('/dashboard/kyc');
  };

  const handleExplore = () => {
    handleDismiss();
  };

  const formatExpiry = (expiresAt?: string | null): string => {
    if (!expiresAt) return '3 months from activation';
    try {
      const d = new Date(expiresAt);
      if (isNaN(d.getTime())) return '3 months from activation';
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '3 months from activation';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-casa-surface border border-casa-border-light rounded-2xl shadow-2xl overflow-hidden text-start">
        {/* Top Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-casa-text-muted hover:text-casa-text-primary hover:bg-casa-subtle transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: FREE TRIAL WELCOME */}
        {step === 'TRIAL' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                <Clock className="w-3.5 h-3.5" />
                Active 3-Month Free Plan
              </span>
              <h2 className="text-2xl font-bold text-casa-text-primary">
                Welcome to MyProperty!
              </h2>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Your 3-Month Free Plan Has Started
              </p>
              <p className="text-xs text-casa-text-secondary leading-relaxed">
                Enjoy 15 property listings, direct client enquiries, and full listing tools for 3 calendar months.
              </p>
            </div>

            {/* Trial Expiry Card */}
            <div className="p-4 rounded-xl bg-casa-subtle border border-casa-border-light space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-casa-text-secondary">Plan Expiry:</span>
                <span className="font-bold text-casa-text-primary">
                  {formatExpiry(user.trialExpiresAt)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>15 verified property listings & direct buyer enquiries</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              {kycNeedsAttention ? (
                <>
                  <button
                    type="button"
                    onClick={() => setStep('KYC')}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-casa-brand text-white text-sm font-bold shadow-md hover:bg-casa-brand/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Next: KYC Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleExplore}
                    className="py-2.5 px-4 rounded-xl border border-casa-border text-casa-text-primary text-sm font-semibold hover:bg-casa-subtle transition-colors cursor-pointer"
                  >
                    Explore MyProperty
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleExplore}
                  className="w-full py-2.5 px-4 rounded-xl bg-casa-brand text-white text-sm font-bold shadow-md hover:bg-casa-brand/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Explore MyProperty</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: KYC VERIFICATION PROMPT */}
        {step === 'KYC' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                <FileText className="w-3.5 h-3.5" />
                Account Verification
              </span>
              <h2 className="text-2xl font-bold text-casa-text-primary">
                Complete Your KYC Verification
              </h2>
              <p className="text-xs text-casa-text-secondary leading-relaxed">
                Verification is required for publishing listings, verified seller badges, and commercial mandates according to marketplace policy.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                Upload your ID or business proof in the KYC dashboard. Admin verification usually completes within 24 hours.
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleGoToKyc}
                className="flex-1 py-2.5 px-4 rounded-xl bg-casa-brand text-white text-sm font-bold shadow-md hover:bg-casa-brand/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Complete KYC</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="py-2.5 px-4 rounded-xl border border-casa-border text-casa-text-secondary hover:text-casa-text-primary text-sm font-medium hover:bg-casa-subtle transition-colors cursor-pointer"
              >
                Remind Me Later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
