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
  Crown,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { FreePlanClaimModal } from '@/components/pricing/free-plan-claim-modal';

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

function formatDateTime(val?: string | Date | null): string {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function KycStatusBanner({ className = '', onRefresh }: KycStatusBannerProps) {
  const { user, refreshUser } = useAuth();
  const isExempt = isKycExempt(user);

  const [verification, setVerification] = React.useState<AgentVerificationResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = React.useState(false);

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

  const trialRemainingDays = trialExpiresAt
    ? Math.max(0, Math.ceil((new Date(trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Authoritative Subscription and Trial Status
  const hasActiveSubscription = Boolean(
    verification?.hasActiveSubscription ||
    user?.hasActiveSubscription ||
    user?.subscriptionStatus === 'ACTIVE' ||
    (user?.activeSubscriptionId && user?.activePackageId && (!user?.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt).getTime() > Date.now()))
  );

  const activePlanName = verification?.activePlanName || user?.activePlanName || (hasActiveSubscription ? 'Active Plan' : null);
  const subscriptionStatus = verification?.subscriptionStatus || user?.subscriptionStatus || (hasActiveSubscription ? 'ACTIVE' : null);
  const subscriptionExpiresAt = verification?.subscriptionExpiresAt || user?.subscriptionExpiresAt || null;
  const subscriptionStartDate = verification?.subscriptionStartDate || user?.subscriptionStartDate || null;

  const isSubExpiredOrCancelled = Boolean(
    !hasActiveSubscription &&
    (subscriptionStatus === 'EXPIRED' || subscriptionStatus === 'CANCELLED')
  );

  const isTrialActive = Boolean(
    !hasActiveSubscription &&
    !isSubExpiredOrCancelled &&
    (verification?.isTrialActive ?? user?.isTrialActive ?? false) &&
    trialRemainingDays > 0
  );

  const isTrialExpired = Boolean(
    !hasActiveSubscription &&
    !isSubExpiredOrCancelled &&
    (verification?.isTrialExpired ?? user?.trialExpired ?? user?.isTrialExpired ?? (trialExpiresAt ? new Date(trialExpiresAt).getTime() <= Date.now() : true))
  );

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
                  Your identity and business documents have been verified by the Super Admin. The official My Property Verified Trust Badge is active on all your listings.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                onClick={async () => {
                  await Promise.allSettled([fetchLiveStatus(), refreshUser?.()]);
                  onRefresh?.();
                }}
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

          {/* STATE A: Super Admin-approved active plan (Hide 3-day trial and Trial Expired) */}
          {hasActiveSubscription && (
            <div className="bg-white dark:bg-gray-900/90 border border-emerald-300 dark:border-emerald-700/80 rounded-xl p-4 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl shadow-xs shrink-0">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-casa-text-primary">
                        {activePlanName || 'Active Plan'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Active Plan
                      </span>
                    </div>
                    <p className="text-[11px] text-casa-text-muted mt-0.5">
                      Super Admin Approved — Full property publishing quotas and buyer leads access are unlocked.
                    </p>
                  </div>
                </div>

                {/* Plan Validity Grid */}
                <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  {subscriptionStartDate && (
                    <>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-casa-text-muted uppercase tracking-wider block">
                          Activated On
                        </span>
                        <span className="font-bold text-casa-text-primary">
                          {formatDateTime(subscriptionStartDate)}
                        </span>
                      </div>
                      <div className="w-px h-7 bg-slate-300 dark:bg-slate-700 hidden sm:block" />
                    </>
                  )}
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold text-casa-text-muted uppercase tracking-wider block">
                      Plan Validity Until
                    </span>
                    <span className="font-bold text-casa-text-primary">
                      {formatDateTime(subscriptionExpiresAt)}
                    </span>
                  </div>
                  <Link
                    href="/dashboard/billing"
                    className="inline-flex items-center gap-1 text-xs font-bold text-casa-brand hover:underline ms-2"
                  >
                    <span>Manage Billing</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* STATE B.1: KYC Approved, 3-Month Free Plan Available to Claim */}
          {!hasActiveSubscription && !isTrialActive && !isTrialExpired && !user?.trialUsed && (
            <div className="bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-casa-text-primary">
                        3-Month Free Plan Available
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                        Ready to Claim
                      </span>
                    </div>
                    <p className="text-[11px] text-casa-text-muted mt-0.5">
                      Your KYC is approved! Activate your 3-Month Free Plan to receive 15 property listings for 3 months at ₹0.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  <button
                    onClick={() => setIsClaimModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Claim 3 Months Free</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STATE B.2: Active 3-Month Free Plan */}
          {!hasActiveSubscription && isTrialActive && (
            <div className="bg-white dark:bg-gray-900/90 border border-emerald-200 dark:border-emerald-800/80 rounded-xl p-4 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-lg shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-casa-text-primary">
                        3-Month Free Plan (15 Listings)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200">
                        {user?.trialRemainingLabel || (trialRemainingDays > 0 ? `${trialRemainingDays} Day${trialRemainingDays !== 1 ? 's' : ''} Remaining` : 'Active')}
                      </span>
                    </div>
                    <p className="text-[11px] text-casa-text-muted mt-0.5">
                      Plan Status: <strong className="text-emerald-700 dark:text-emerald-400">Active</strong> — 15 property listings allowance for 3 months.
                    </p>
                  </div>
                </div>

                {/* Plan Dates Grid */}
                <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold text-casa-text-muted uppercase tracking-wider block">
                      Plan Start Date
                    </span>
                    <span className="font-bold text-casa-text-primary">
                      {formatDateTime(trialStartedAt)}
                    </span>
                  </div>
                  <div className="w-px h-7 bg-slate-300 dark:bg-slate-700 hidden sm:block" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold text-casa-text-muted uppercase tracking-wider block">
                      Plan Expiry Date
                    </span>
                    <span className="font-bold text-casa-text-primary">
                      {formatDateTime(trialExpiresAt)}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsClaimModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-casa-brand hover:underline ms-2"
                  >
                    <span>View Allowance</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STATE C: Expired / Cancelled Plan (Trial has expired; never restart trial automatically) */}
          {!hasActiveSubscription && isSubExpiredOrCancelled && (
            <div className="bg-rose-50/70 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-rose-950 dark:text-rose-100">
                        {activePlanName ? `${activePlanName} Plan Expired` : 'Subscription Plan Expired'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200">
                        {subscriptionStatus === 'CANCELLED' ? 'Cancelled' : 'Expired'}
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-800 dark:text-rose-300 mt-0.5">
                      Your subscription ended on {formatDateTime(subscriptionExpiresAt)}. Renew your plan to restore full property publishing privileges.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  <a
                    href="https://wa.me/917069754589?text=Hello%20My%20Property%20Team,%20I%20would%20like%20to%20renew%20my%20subscription%20plan."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-gray-900 text-xs font-semibold text-rose-800 dark:text-rose-200 hover:bg-rose-100/50 transition shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Contact Sales</span>
                  </a>
                  <Link href="/pricing">
                    <button className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Renew Subscription</span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* STATE D: Expired Trial, No Active Plan (Show Free Plan Expired with available plans) */}
          {!hasActiveSubscription && isTrialExpired && !isSubExpiredOrCancelled && (
            <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-amber-950 dark:text-amber-100">
                        3-Month Free Plan Expired
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                        Plan Required
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                      Your complimentary 3-Month Free Plan has concluded. Select an Agent or Broker subscription plan to keep publishing listings and receiving buyer inquiries.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  <a
                    href="https://wa.me/917069754589?text=Hello%20My%20Property%20Team,%20my%203-month%20free%20plan%20has%20concluded%20and%20I%20am%20ready%20to%20activate%20a%20plan."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-900 text-xs font-semibold text-amber-800 dark:text-amber-200 hover:bg-amber-100/50 transition shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Sales (+91 7069754589)</span>
                  </a>
                  <Link href="/pricing">
                    <button className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition">
                      <Crown className="w-3.5 h-3.5" />
                      <span>Choose Subscription Plan</span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}
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
              to complete your identity check. Once approved by the Super Admin, your <strong>3-Month Free Plan</strong> (15 property listings, ₹0) will become available to claim!
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
                Upload your business registration (GST, RERA, or Udyam certificate) to unlock your 3-Month Free Plan (15 listings, ₹0) and earn the Verified Trust Badge.
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

      {/* 3-Month Free Plan Claim Modal */}
      <FreePlanClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => {
          setIsClaimModalOpen(false);
          fetchLiveStatus();
        }}
      />
    </div>
  );
}
