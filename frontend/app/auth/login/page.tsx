'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AlertCircle } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openAuthModal, isAuthenticated } = useAuth();
  const [deactivatedMsg, setDeactivatedMsg] = React.useState<string | null>(null);
  const [trialExpiredNotice, setTrialExpiredNotice] = React.useState<string | null>(null);
  const [kycStatus, setKycStatus] = React.useState<string>('NOT_SUBMITTED');

  const isDeactivated = searchParams.get('deactivated') === '1';
  const isTrialExpired = searchParams.get('trial_expired') === '1';

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedDeactivated = localStorage.getItem('casa_deactivated_notice');
      if (isDeactivated || storedDeactivated) {
        setDeactivatedMsg('Your account has been deactivated by the administrator.');
        try {
          localStorage.removeItem('casa_deactivated_notice');
        } catch {}
      }

      const storedTrialExpired = localStorage.getItem('casa_trial_expired_notice');
      const storedKycStatus = localStorage.getItem('casa_trial_expired_kyc_status') || 'NOT_SUBMITTED';
      if (isTrialExpired || storedTrialExpired) {
        setTrialExpiredNotice(
          storedTrialExpired ||
            'Your 3-day free trial has expired. Complete KYC verification and get an active plan to continue.'
        );
        setKycStatus(storedKycStatus);
      }
    }
  }, [isDeactivated, isTrialExpired]);

  const redirectUrl =
    searchParams.get('redirect') ||
    searchParams.get('callbackUrl') ||
    searchParams.get('returnUrl') ||
    '/dashboard/properties/new';

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectUrl);
    } else {
      openAuthModal('SIGN_IN');
    }
  }, [openAuthModal, router, isAuthenticated, redirectUrl]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 space-y-4">
      {trialExpiredNotice && (
        <div className="w-full max-w-lg p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 space-y-3 shadow-md animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100">
                Free Trial Expired
              </h3>
              <p className="text-xs font-medium leading-relaxed">
                {trialExpiredNotice}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-amber-200 dark:border-amber-800/40 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-amber-800 dark:text-amber-300">Account Status:</span>
            <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold border border-red-200 dark:border-red-800">
              Trial Expired
            </span>
            <span className="font-semibold text-amber-800 dark:text-amber-300 ml-2">KYC Verification:</span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold border ${
                kycStatus === 'APPROVED'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 border-emerald-300'
                  : kycStatus === 'PENDING'
                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 border-blue-300'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300'
              }`}
            >
              {kycStatus}
            </span>
          </div>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-normal">
            To restore access, ensure required KYC documents are approved and an active subscription plan is assigned by Super Admin.
          </p>
        </div>
      )}

      {deactivatedMsg && (
        <div className="w-full max-w-md p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-sm font-semibold flex items-center gap-3 shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{deactivatedMsg}</span>
        </div>
      )}

      <div className="w-8 h-8 border-3 border-casa-brand border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-casa-text-secondary">Redirecting to sign in...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="w-8 h-8 border-3 border-casa-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </React.Suspense>
  );
}

