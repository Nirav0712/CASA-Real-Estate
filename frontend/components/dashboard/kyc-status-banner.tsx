'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { getMyVerification, AgentVerificationResponse } from '@/services/agent-service';
import {
  ShieldCheck,
  Clock,
  AlertCircle,
  XCircle,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Phone,
  Calendar,
  CheckCircle2,
  FileText,
} from 'lucide-react';

interface KycStatusBannerProps {
  className?: string;
  onRefresh?: () => void;
}

export function isKycExempt(
  user: { role?: string; accountType?: string | null; platformRole?: string | null; isKycExempt?: boolean } | null | undefined,
): boolean {
  if (!user) return false;
  if (user.isKycExempt !== undefined) return user.isKycExempt;

  const role = (user.role || '').toUpperCase();
  const accountType = (user.accountType || '').toUpperCase();
  const platformRole = (user.platformRole || '').toUpperCase();

  const isBuyer = role === 'BUYER' || role === 'PURCHASER' || accountType === 'BUYER';
  const isTenant = role === 'TENANT' || accountType === 'TENANT';
  const isSuperAdmin =
    platformRole === 'SUPER_ADMIN' ||
    platformRole === 'ADMIN' ||
    role === 'SUPER_ADMIN' ||
    role === 'ADMIN';

  return isBuyer || isTenant || isSuperAdmin;
}

export function KycStatusBanner({ className = '', onRefresh }: KycStatusBannerProps) {
  const { user, refreshUser } = useAuth();
  const isExempt = isKycExempt(user);

  const [verification, setVerification] = React.useState<AgentVerificationResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Fetch real authoritative status from backend
  const fetchLiveStatus = React.useCallback(async () => {
    if (isExempt) return;
    setIsRefreshing(true);
    try {
      const res = await getMyVerification();
      setVerification(res);
    } catch {
      // Keep existing data on transient error
    } finally {
      setIsRefreshing(false);
    }
  }, [isExempt]);

  React.useEffect(() => {
    if (!isExempt) {
      fetchLiveStatus();
    }
  }, [fetchLiveStatus, isExempt]);

  if (isExempt) {
    return null;
  }

  // Derive consolidated status prioritizing fresh verification API, then user session
  const kycStatus = (
    verification?.kycStatus ||
    user?.kycStatus ||
    verification?.verificationStatus ||
    'NOT_SUBMITTED'
  ).toUpperCase();

  const isApproved = kycStatus === 'APPROVED' || kycStatus === 'VERIFIED';
  const isPending = kycStatus === 'PENDING';
  const isRejected = kycStatus === 'REJECTED';

  const rejectionReason =
    verification?.kycRejectionReason ||
    user?.kycRejectionReason ||
    verification?.rejectionReason ||
    null;

  const trialStartedAt =
    verification?.trialStartedAt ||
    user?.trialStartedAt ||
    null;

  const trialExpiresAt =
    verification?.trialExpiresAt ||
    user?.trialExpiresAt ||
    null;

  // Calculate remaining trial days
  let trialRemainingDays = 0;
  if (trialExpiresAt) {
    const diff = new Date(trialExpiresAt).getTime() - Date.now();
    trialRemainingDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  const formatDateTime = (dateVal: string | null | undefined) => {
    if (!dateVal) return '—';
    try {
      const d = new Date(dateVal);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 1. KYC APPROVED */}
      {isApproved && (
        <div className="bg-gradient-to-r from-emerald-950/20 via-teal-900/10 to-emerald-950/20 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-500/30 rounded-2xl p-5 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-100">
                    KYC Verification Approved
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                    Account Active
                  </span>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  Your identity and business documents have been verified by the Super Admin. The official CASA Verified Trust Badge is active on all your listings.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                onClick={fetchLiveStatus}
                disabled={isRefreshing}
                title="Refresh verification status from real database"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 text-xs font-semibold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-50 transition shadow-xs disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Status</span>
              </button>
              <Link href="/dashboard/kyc">
                <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition">
                  <span>View Certificate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>

          {/* 3-Day Free Trial Card on Approval (Requirement 3) */}
          <div className="bg-white dark:bg-gray-900/90 border border-emerald-200 dark:border-emerald-800/80 rounded-xl p-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-lg shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-casa-text-primary">
                      3-Day Free Trial
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200">
                      {trialRemainingDays > 0 ? `${trialRemainingDays} Day${trialRemainingDays !== 1 ? 's' : ''} Remaining` : 'Completed / Active'}
                    </span>
                  </div>
                  <p className="text-[11px] text-casa-text-muted mt-0.5">
                    Account Status: <strong className="text-emerald-700 dark:text-emerald-400">Active</strong> — You can publish property listings and receive direct buyer leads.
                  </p>
                </div>
              </div>

              {/* Trial Dates Grid */}
              <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-casa-text-muted uppercase tracking-wider block">
                    Trial Start Date
                  </span>
                  <span className="font-bold text-casa-text-primary">
                    {formatDateTime(trialStartedAt)}
                  </span>
                </div>
                <div className="w-px h-7 bg-slate-300 dark:bg-slate-700 hidden sm:block" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-casa-text-muted uppercase tracking-wider block">
                    Trial Expiry Date
                  </span>
                  <span className="font-bold text-casa-text-primary">
                    {formatDateTime(trialExpiresAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. KYC REJECTED */}
      {isRejected && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 rounded-2xl p-5 shadow-subtle space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-sm shrink-0 mt-0.5">
                <XCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-rose-900 dark:text-rose-100">
                    KYC Verification Rejected
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-300 dark:border-rose-700">
                    Action Required
                  </span>
                </div>
                <p className="text-xs text-rose-800 dark:text-rose-300">
                  Your KYC application was reviewed and rejected by the Super Admin. Please review the specific rejection reason below, correct the issue, and resubmit your documents.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                onClick={fetchLiveStatus}
                disabled={isRefreshing}
                title="Refresh verification status from real database"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-gray-900 text-xs font-semibold text-rose-800 dark:text-rose-200 hover:bg-rose-50 transition shadow-xs disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Status</span>
              </button>
              <Link href="/dashboard/kyc">
                <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Update &amp; Resubmit</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Rejection Reason Alert Box (Requirement 2) */}
          <div className="bg-white dark:bg-gray-900 border-l-4 border-rose-600 dark:border-rose-500 rounded-r-xl p-3.5 text-xs text-casa-text-primary shadow-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-900 dark:text-rose-200 block">
                  Rejection Reason from Super Admin:
                </span>
                <p className="text-rose-800 dark:text-rose-300 mt-0.5 font-medium">
                  {rejectionReason || 'The uploaded document was unreadable, expired, or failed identity verification. Please upload a clear original copy.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. KYC PENDING */}
      {isPending && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-2xl p-5 shadow-subtle space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm shrink-0 mt-0.5">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-amber-900 dark:text-amber-100">
                    KYC Verification Under Review
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                    Pending Super Admin Approval
                  </span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Your KYC documents have been uploaded and are in the Super Admin verification queue. Verification typically completes within 24 hours.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                onClick={fetchLiveStatus}
                disabled={isRefreshing}
                title="Refresh verification status from real database"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-900 text-xs font-semibold text-amber-800 dark:text-amber-200 hover:bg-amber-50 transition shadow-xs disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Status</span>
              </button>
              <Link href="/dashboard/kyc">
                <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition">
                  <span>View Documents</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>

          {/* Verification Call Notice Banner */}
          <div className="bg-amber-100/70 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <Phone className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
            <div>
              <strong>Verification Call Notice:</strong> You may receive a verification call from{' '}
              <strong className="font-bold underline text-amber-950 dark:text-white">7069754589</strong>{' '}
              to complete your identity check. Once approved by the Super Admin, your <strong>3-Day Free Trial</strong> will activate immediately!
            </div>
          </div>
        </div>
      )}

      {/* 4. KYC NOT_SUBMITTED (Only for broker/agent/developer accounts if not yet submitted) */}
      {!isApproved && !isPending && !isRejected && (
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 bg-casa-brand text-white rounded-xl shadow-sm shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-casa-text-primary">
                  KYC Verification Incomplete
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Not Submitted
                </span>
              </div>
              <p className="text-xs text-casa-text-secondary mt-0.5">
                Upload your business registration (GST, RERA, or Udyam certificate) to unlock your 3-day Free Trial and earn the Verified Trust Badge.
              </p>
            </div>
          </div>

          <Link href="/dashboard/kyc" className="shrink-0 self-start sm:self-auto">
            <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-casa-brand hover:bg-casa-brand-hover text-white text-xs font-bold shadow-subtle transition">
              <span>Start KYC Verification</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
