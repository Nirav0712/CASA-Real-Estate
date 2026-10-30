'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  X,
  ArrowRight,
  ShieldAlert,
  Building,
  Calendar,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { claimFreeTrial, getMyEntitlements } from '@/services/entitlements-service';

interface FreePlanClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FreePlanClaimModal({ isOpen, onClose }: FreePlanClaimModalProps) {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [loading, setLoading] = React.useState(false);
  const [activationSuccess, setActivationSuccess] = React.useState<any | null>(null);
  const [usageData, setUsageData] = React.useState<{ used: number; total: number } | null>(null);

  // Fetch live listing counts if plan is active
  React.useEffect(() => {
    if (!isOpen || !user) return;

    let isMounted = true;
    getMyEntitlements()
      .then((res) => {
        if (isMounted && res) {
          const used = res.usage?.propertyListings ?? 0;
          const limit = res.entitlements?.limits?.propertyListings ?? 15;
          setUsageData({ used, total: limit });
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOpen, user]);

  if (!isOpen) return null;

  const isTeamMember = Boolean(
    user &&
      (user.accountType === 'BROKER_AGENT' ||
        user.role === 'BROKER_AGENT' ||
        user.brokerId ||
        user.parentUserId),
  );

  if (isTeamMember) {
    const parentAgencyOrBrokerName =
      user?.parentAgencyName || user?.parentBrokerName || user?.agencyName || 'Broker';
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden p-6 text-center space-y-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Building className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
              Team Member Account
            </span>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              Managed by Broker
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Subscription plans and billing are managed by your Broker ({parentAgencyOrBrokerName}).
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors text-xs"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // KYC States
  const kycStatus = (user?.kycStatus || 'NOT_SUBMITTED').toUpperCase();
  const isKycApproved = kycStatus === 'APPROVED' || Boolean(user?.isVerifiedAgent);
  const isKycPending = kycStatus === 'PENDING';
  const isKycRejected = kycStatus === 'REJECTED';
  const isKycMissing = !isKycApproved && !isKycPending && !isKycRejected;

  // Plan States
  const isTrialActive = Boolean(user?.isTrialActive);
  const isTrialExpired = Boolean(
    user?.isTrialExpired ||
      user?.trialExpired ||
      (user?.trialExpiresAt && new Date(user.trialExpiresAt).getTime() <= Date.now())
  );

  const handleActivate = async () => {
    setLoading(true);
    try {
      const res = await claimFreeTrial();
      setActivationSuccess(res);
      await refreshUser();
      toast.success(
        '3-Month Free Plan Activated!',
        'You can now create up to 15 property listings for 3 months.'
      );
    } catch (err: any) {
      toast.error('Activation Failed', err.message || 'Could not activate free plan.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToKyc = () => {
    onClose();
    router.push('/dashboard/kyc');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Header decoration */}
        <div className="h-2 w-full bg-gradient-to-r from-casa-gold via-casa-gold-light to-amber-500" />

        {/* Close Button - Only show if KYC is approved; unverified users must complete KYC */}
        {isKycApproved && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-6 md:p-8">
          {/* Activation Success View */}
          {activationSuccess ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                3-Month Free Plan Activated!
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300 text-sm mb-6 leading-relaxed">
                Congratulations! Your introductory plan is now active. You have full access to
                publish up to 15 property listings for the next 3 months.
              </p>

              <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700/60 text-left mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Plan:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    3-Month Free Plan
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Property Limit:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    15 Properties Included
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Validity:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    3 Months (90 Days)
                  </span>
                </div>
                {activationSuccess.expiryDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">Expires On:</span>
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {new Date(activationSuccess.expiryDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  onClose();
                  router.push('/dashboard/properties/new');
                }}
                className="w-full py-3 px-6 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-lg shadow-neutral-900/10"
              >
                Create Your First Listing
              </button>
            </div>
          ) : isTrialActive ? (
            /* CASE E: Free Plan Already Active */
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 mb-1">
                    Active Plan
                  </span>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    3-Month Free Plan
                  </h2>
                </div>
              </div>

              <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-6">
                Your 3-Month Free Plan is currently active. You can create and publish listings
                within your 15-property allowance.
              </p>

              {/* Usage & Allowance Card */}
              <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700/60 space-y-4 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-neutral-500" /> Property Listings Quota
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {usageData?.used ?? 0} / 15 Used
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (((usageData?.used ?? 0) / 15) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>{Math.max(0, 15 - (usageData?.used ?? 0))} listings remaining</span>
                    <span>15 Max</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-neutral-500 block">Start Date:</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {user?.trialStartedAt
                        ? new Date(user.trialStartedAt).toLocaleDateString()
                        : 'Active'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Expiry Date:</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {user?.trialExpiresAt
                        ? new Date(user.trialExpiresAt).toLocaleDateString()
                        : 'In 3 Months'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onClose();
                    router.push('/dashboard/properties');
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
                >
                  Manage Listings
                </button>
                <button
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : isTrialExpired ? (
            /* Expired State */
            <div className="text-center py-2">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                Free Plan Expired
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-6">
                Your 3-Month Free Plan has concluded. Upgrade to an active subscription plan to
                continue posting and managing your properties on My Property.
              </p>
              <button
                onClick={() => {
                  onClose();
                  router.push('/pricing');
                }}
                className="w-full py-3 px-6 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
              >
                View Subscription Plans
              </button>
            </div>
          ) : isKycMissing ? (
            /* CASE A: KYC Not Submitted */
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                Complete Your KYC First
              </h2>

              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">
                Please submit your KYC verification details before claiming the 3-Month Free Plan.
                Your free plan will become available after Super Admin approval.
              </p>

              {/* Plan Benefits Preview */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700/60 mb-6 space-y-2.5">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                  Plan Benefits After Approval
                </span>
                <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>3 Months Full Marketplace Validity</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>15 Property Listings Allowance</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>100% Free (₹0) — Super Admin Approved</span>
                </div>
              </div>

              <div className="flex">
                <button
                  onClick={navigateToKyc}
                  className="w-full py-3 px-5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Complete & Submit KYC</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : isKycPending ? (
            /* CASE B: KYC Submitted and Pending Review */
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>

              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                KYC Verification in Progress
              </h2>

              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">
                Your KYC application has been submitted and is awaiting Super Admin approval. Your
                3-Month Free Plan will become available after approval.
              </p>

              <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                    Our compliance team reviews submissions within 24-48 business hours. You may
                    receive a call or notification once approved.
                  </p>
                </div>
              </div>

              <div className="flex">
                <button
                  onClick={navigateToKyc}
                  className="w-full py-3 px-5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>View KYC Status</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : isKycRejected ? (
            /* CASE C: KYC Rejected */
            <div>
              <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                <XCircle className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                KYC Verification Rejected
              </h2>

              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
                Your KYC application was reviewed and could not be approved at this time. The
                3-Month Free Plan remains inactive until a corrected submission is approved.
              </p>

              {user?.kycRejectionReason && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-xl p-4 mb-6">
                  <span className="text-xs font-semibold text-red-800 dark:text-red-300 uppercase tracking-wider block mb-1">
                    Rejection Reason
                  </span>
                  <p className="text-xs text-red-700 dark:text-red-200">
                    {user.kycRejectionReason}
                  </p>
                </div>
              )}

              <div className="flex">
                <button
                  onClick={navigateToKyc}
                  className="w-full py-3 px-5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Update & Resubmit KYC</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : isKycApproved ? (
            /* CASE D: KYC Approved but Free Plan Not Activated */
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 mb-1">
                    KYC Approved
                  </span>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    Claim Your 3-Month Free Plan
                  </h2>
                </div>
              </div>

              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">
                Your KYC application has been verified by the Super Admin! You are eligible to
                claim the 3-Month Free Plan. Your 3-month duration starts immediately upon
                activation.
              </p>

              {/* Offer Details */}
              <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700/60 space-y-3 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Plan Name:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    3-Month Free Plan
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Duration:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    3 Months (90 Calendar Days)
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Listing Quota:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    15 Property Listings
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Price:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    ₹0 (Introductory Offer)
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleActivate}
                  disabled={loading}
                  className="flex-1 py-3 px-5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Activating...</span>
                  ) : (
                    <>
                      <span>Activate 3-Month Free Plan</span>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="py-3 px-5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
