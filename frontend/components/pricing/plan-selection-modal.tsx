'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Check,
  Zap,
  Clock,
  ShieldCheck,
  ChevronRight,
  X,
  Phone,
  Building,
  Eye,
  MessageSquare,
  Award,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import {
  getActivePackages,
  startTrial,
  PackagePlan,
} from '@/services/entitlements-service';

export function PlanSelectionModal() {
  const { isPlanSelectionModalOpen, closePlanSelectionModal, user, refreshUser } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [packages, setPackages] = React.useState<PackagePlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submittingId, setSubmittingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isPlanSelectionModalOpen) return;

    let isMounted = true;
    async function fetchPlans() {
      setLoading(true);
      try {
        const plans = await getActivePackages();
        if (isMounted) {
          setPackages(plans.sort((a, b) => a.price - b.price));
        }
      } catch (err: any) {
        toast.error('Failed to load plans', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPlans();
    return () => {
      isMounted = false;
    };
  }, [isPlanSelectionModalOpen, toast]);

  const role = String(user?.role || '').toUpperCase();
  const accountType = String(user?.accountType || '').toUpperCase();
  const platformRole = String(user?.platformRole || '').toUpperCase();
  const isExempt =
    ['BUYER', 'TENANT', 'PURCHASER'].includes(role) ||
    ['BUYER', 'TENANT'].includes(accountType) ||
    ['SUPER_ADMIN', 'ADMIN'].includes(platformRole) ||
    ['SUPER_ADMIN', 'ADMIN'].includes(role);

  const isTeamMember = Boolean(
    user &&
      (user.accountType === 'BROKER_AGENT' ||
        user.role === 'BROKER_AGENT' ||
        user.brokerId ||
        user.parentUserId),
  );

  if (!isPlanSelectionModalOpen || isExempt) return null;

  if (isTeamMember) {
    const parentAgencyOrBrokerName =
      user?.parentAgencyName || user?.parentBrokerName || user?.agencyName || 'Broker';
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="relative w-full max-w-md bg-casa-surface border border-casa-border-light rounded-3xl shadow-2xl p-6 md:p-8 text-center space-y-5">
          <button
            onClick={closePlanSelectionModal}
            className="absolute top-4 right-4 p-2 text-casa-text-muted hover:text-casa-text-primary rounded-full hover:bg-casa-subtle transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Building className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
              Team Member Account
            </span>
            <h2 className="text-xl font-bold text-casa-text-primary">
              Managed by Broker
            </h2>
            <p className="text-sm text-casa-text-secondary leading-relaxed">
              Subscription plans and billing are managed by your Broker ({parentAgencyOrBrokerName}).
            </p>
          </div>
          <button
            onClick={closePlanSelectionModal}
            className="w-full py-2.5 px-4 rounded-xl bg-casa-brand text-white font-semibold hover:opacity-95 transition-all text-xs"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Calculate trial state
  const isTrialExpired = Boolean(
    user?.trialExpired ||
    user?.isTrialExpired ||
    (user?.trialExpiresAt && new Date(user.trialExpiresAt).getTime() <= Date.now())
  );
  const isTrialActive = Boolean(user?.isTrialActive && !isTrialExpired);
  let remainingDays = 0;
  if (user?.trialExpiresAt && isTrialActive) {
    const diff = new Date(user.trialExpiresAt).getTime() - Date.now();
    remainingDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  const handleContinueWithFreeTrial = () => {
    closePlanSelectionModal();
    router.push('/dashboard/kyc');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-casa-surface border border-casa-border-light rounded-3xl shadow-2xl p-6 md:p-8 my-8 max-h-[92vh] overflow-y-auto space-y-6">
        {/* Close Button */}
        <button
          onClick={closePlanSelectionModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-casa-text-muted hover:text-casa-text-primary hover:bg-casa-canvas transition-colors"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Banner */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-casa-brand-subtle text-casa-brand text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>myproperty — Free Plan Access</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-casa-text-primary">
            Experience myproperty with a <span className="text-casa-brand">3-Month Free Plan</span>
          </h2>

          <p className="text-xs md:text-sm text-casa-text-secondary leading-relaxed">
            All registered Broker Agencies, Brokers, Agents, and Developers receive a{' '}
            <strong>3-Month Free Plan</strong> with up to 15 property listings upon account verification by our Super Admin governance team.
          </p>
        </div>

        {/* Verification Call Notice Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3 text-amber-900 dark:text-amber-200 text-xs shadow-subtle">
          <Phone className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">
              Manual Verification Call Notice:
            </p>
            <p className="text-amber-800 dark:text-amber-300">
              Users may receive a verification call from{' '}
              <strong className="font-bold underline text-amber-950 dark:text-white">
                7069754589
              </strong>{' '}
              to complete their KYC verification. Your 3-Month Free Plan becomes available to claim in your dashboard after approval by the Super Admin.
            </p>
          </div>
        </div>

        {/* If user already has an active free plan */}
        {isTrialActive ? (
          <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-3xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-emerald-950 dark:text-emerald-100">
                Your 3-Month Free Plan is Currently Active!
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                You have access to publish up to 15 property listings, video reels, and lead management.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-xs bg-white dark:bg-gray-900 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-casa-text-muted block">
                  Plan Started
                </span>
                <span className="font-bold text-casa-text-primary">
                  {user?.trialStartedAt ? new Date(user.trialStartedAt).toLocaleDateString() : 'Active'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-casa-text-muted block">
                  Expires On
                </span>
                <span className="font-bold text-casa-brand">
                  {user?.trialExpiresAt ? new Date(user.trialExpiresAt).toLocaleDateString() : 'In 3 Months'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold">
                {user?.trialRemainingLabel || `${remainingDays} Day${remainingDays !== 1 ? 's' : ''} Remaining`}
              </span>
            </div>
          </div>
        ) : isTrialExpired ? (
          /* Expired Notice */
          <div className="p-6 md:p-8 bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-3xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-casa-text-primary">
                Your 3-Month Free Plan Has Ended
              </h3>
              <p className="text-xs sm:text-sm text-casa-text-secondary mt-1.5 max-w-md mx-auto leading-relaxed">
                Your complimentary 3-month access has concluded. You can upgrade to any of our paid subscription tiers to reactivate full marketplace benefits and verified direct contacts.
              </p>
            </div>

            <div className="pt-2 max-w-sm mx-auto">
              <button
                onClick={() => {
                  closePlanSelectionModal();
                  router.push('/dashboard/billing');
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-casa-brand hover:bg-casa-brand-hover text-white text-xs md:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Paid Plans & Upgrade</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Free Plan Card */
          <div className="bg-casa-surface border-2 border-casa-brand rounded-3xl p-6 md:p-8 space-y-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-casa-brand text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs">
              Super Admin KYC Required
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-casa-border-light pb-4">
              <div>
                <h3 className="text-xl font-bold text-casa-text-primary flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-casa-brand" />
                  myproperty 3-Month Free Plan
                </h3>
                <p className="text-xs text-casa-text-secondary mt-0.5">
                  15 property listings included for 3 full calendar months upon KYC approval.
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-3xl font-extrabold text-casa-brand">₹0</span>
                <span className="text-xs text-casa-text-muted font-bold ml-1">/ 3 Months</span>
              </div>
            </div>

            {/* Feature Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-casa-text-secondary">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Up to 15 Property Listings Included</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>3 Months Complete Marketplace Validity</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>9:16 Video Property Reels upload</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Verified Trust Badge upon KYC Approval</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Full CRM Enquiry Management</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Direct Purchaser Mobile Contact</span>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={handleContinueWithFreeTrial}
                className="w-full py-3.5 px-6 rounded-2xl bg-casa-brand hover:bg-casa-brand-hover text-white text-xs md:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to KYC Verification &amp; Claim Free Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="block text-center text-[11px] text-casa-text-muted mt-2">
                Step 1 of 2: Upload GST / Udyam / RERA / Aadhaar • Super Admin manual audit ensures platform safety
              </span>
            </div>
          </div>
        )}

        {/* Footer Guarantee */}
        <div className="pt-4 border-t border-casa-border-light flex flex-col sm:flex-row items-center justify-between text-[11px] text-casa-text-muted gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Risk-Free: Instant activation with zero credit card or payment gateway requirement.</span>
          </div>
          <button
            onClick={closePlanSelectionModal}
            className="text-casa-text-secondary hover:text-casa-brand font-semibold underline underline-offset-4 cursor-pointer"
          >
            Explore marketplace
          </button>
        </div>
      </div>
    </div>
  );
}
