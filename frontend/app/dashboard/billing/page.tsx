'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import {
  getMyPayments,
  createPaymentOrder,
  verifyPayment,
  getPublicGatewayConfig,
  getMySubscriptionRequests,
  loadRazorpaySdk,
} from '@/services/payment-service';
import {
  getActivePackages,
  getPublicCompanySettings,
  PackagePlan,
  CompanySettings,
} from '@/services/entitlements-service';
import { PlanDetailsModal } from '@/components/pricing/plan-details-modal';
import { FreePlanClaimModal } from '@/components/pricing/free-plan-claim-modal';
import { PaymentItem, PaymentStatus, PaymentPurpose, SubscriptionRequest } from '@/types';
import { formatPrice } from '@/lib/utils';
import { isKycExempt } from '@/components/dashboard/kyc-status-banner';
import {
  CreditCard,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
  PhoneCall,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Zap,
  HelpCircle,
  Building,
  Check,
  Lock,
  Phone,
  Crown,
} from 'lucide-react';

export default function BillingDashboardPage() {
  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    openAuthModal,
    openPlanSelectionModal,
    openTrialExpiredModal,
    isTrialActive,
    isTrialExpired,
    trialDaysRemaining,
    trialRemainingLabel,
    hasActiveSubscription,
    activePlanName,
    subscriptionExpiresAt,
  } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [isFreePlanModalOpen, setIsFreePlanModalOpen] = React.useState(false);
  const isExempt = isKycExempt(user);
  const role = String(user?.role || '').toUpperCase();
  const accountType = String(user?.accountType || '').toUpperCase();
  const platformRole = String(user?.platformRole || '').toUpperCase();
  const isBillingExempt =
    isExempt ||
    ['BUYER', 'TENANT', 'PURCHASER'].includes(role) ||
    ['BUYER', 'TENANT'].includes(accountType) ||
    ['SUPER_ADMIN', 'ADMIN'].includes(platformRole) ||
    ['SUPER_ADMIN', 'ADMIN'].includes(role);

  const [recentPayments, setRecentPayments] = React.useState<PaymentItem[]>([]);
  const [packages, setPackages] = React.useState<PackagePlan[]>([]);
  const [isPackagesLoading, setIsPackagesLoading] = React.useState(true);
  const [subscriptionRequests, setSubscriptionRequests] = React.useState<SubscriptionRequest[]>([]);
  const [selectedDetailsPlan, setSelectedDetailsPlan] = React.useState<PackagePlan | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);
  const [companySettings, setCompanySettings] = React.useState<CompanySettings>({
    appName: 'myproperty Marketplace',
    companySalesNumber: '+91 98765 43210',
    companyServiceNumber: '+91 98765 43211',
    companySalesEmail: 'sales@myproperty.com',
    companySupportEmail: 'support@myproperty.com',
    companyAddress: 'Vibhuti Khand, Gomti Nagar, Lucknow, UP',
    trialDays: 3,
  });
  const [loading, setLoading] = React.useState(true);
  const [processingPlanId, setProcessingPlanId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated && !isAuthLoading && isBillingExempt) {
      toast.info(
        'Billing & Subscriptions Not Required',
        'Your account has direct unrestricted access without subscription or billing restrictions.',
      );
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isAuthLoading, isBillingExempt, router, toast]);

  const isTeamMember = Boolean(
    user &&
      (user.accountType === 'BROKER_AGENT' ||
        user.role === 'BROKER_AGENT' ||
        user.brokerId ||
        user.parentUserId),
  );

  const loadBillingData = React.useCallback(async () => {
    if (!isAuthenticated || isBillingExempt || isTeamMember) return;
    setLoading(true);
    setIsPackagesLoading(true);
    try {
      const [paymentsRes, settingsRes, packagesRes, reqsRes] = await Promise.allSettled([
        getMyPayments({ page: 1, limit: 5 }),
        getPublicCompanySettings(),
        getActivePackages(),
        getMySubscriptionRequests(),
      ]);

      if (paymentsRes.status === 'fulfilled' && paymentsRes.value?.data) {
        setRecentPayments(paymentsRes.value.data);
      }
      if (settingsRes.status === 'fulfilled' && settingsRes.value) {
        setCompanySettings(settingsRes.value);
      }
      if (packagesRes.status === 'fulfilled' && Array.isArray(packagesRes.value)) {
        setPackages(packagesRes.value);
      }
      if (reqsRes.status === 'fulfilled' && Array.isArray(reqsRes.value)) {
        setSubscriptionRequests(reqsRes.value);
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setLoading(false);
      setIsPackagesLoading(false);
    }
  }, [isAuthenticated, isBillingExempt, isTeamMember]);

  React.useEffect(() => {
    if (isAuthenticated && !isBillingExempt && !isTeamMember) {
      loadBillingData();
    } else if (!isAuthLoading) {
      setLoading(false);
      setIsPackagesLoading(false);
    }
  }, [isAuthenticated, isAuthLoading, isBillingExempt, isTeamMember, loadBillingData]);

  // Role-based visibility: display only active plans applicable to current user's account type
  const eligiblePackages = React.useMemo(() => {
    if (!packages || packages.length === 0) return [];
    return packages
      .filter((pkg) => {
        if (!pkg.isActive) return false;
        if (
          !pkg.targetAccountTypes ||
          pkg.targetAccountTypes.length === 0 ||
          pkg.targetAccountTypes.includes('ALL')
        ) {
          return true;
        }
        return pkg.targetAccountTypes.some((t) => {
          const target = t.toUpperCase();
          return (
            target === role ||
            target === accountType ||
            (target === 'PROPERTY_OWNER' && (role === 'OWNER' || accountType === 'OWNER')) ||
            (target === 'DEVELOPER' && (role === 'BUILDER' || accountType === 'BUILDER'))
          );
        });
      })
      .sort((a, b) => a.price - b.price);
  }, [packages, role, accountType]);

  const handleSubscribe = async (plan: PackagePlan) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    const isKycApproved =
      user?.kycStatus === 'APPROVED' ||
      user?.kycStatus === 'VERIFIED' ||
      Boolean(user?.isVerifiedAgent);

    if (!isKycApproved) {
      toast.warning(
        'KYC Approval Required',
        'You must complete your KYC verification and receive Super Admin approval before choosing or subscribing to a plan.',
      );
      router.push('/dashboard/kyc');
      return;
    }

    const planKey = plan.id || plan._id || plan.slug;
    setProcessingPlanId(planKey);
    try {
      // 1. Create Order on Backend
      const order = await createPaymentOrder({
        purpose: 'SUBSCRIPTION',
        productCode: plan.slug || plan.id || plan._id || '',
        metadata: {
          planName: plan.name,
          packageId: plan.id || plan._id,
          platform: 'web',
        },
      });

      // 2. Fetch Razorpay Public Key & Load Checkout SDK
      const [gatewayConfig, isSdkLoaded] = await Promise.all([
        getPublicGatewayConfig(),
        loadRazorpaySdk(),
      ]);

      const canUseLiveGateway = Boolean(
        gatewayConfig.isConfigured &&
        gatewayConfig.keyId &&
        !gatewayConfig.keyId.includes('placeholder') &&
        isSdkLoaded &&
        typeof window !== 'undefined' &&
        (window as any).Razorpay
      );

      if (!canUseLiveGateway) {
        // Fallback simulation / instant mock verification if Razorpay SDK isn't loaded
        toast.info(
          'Checkout Initiated',
          `Order ${order.orderId} prepared for ₹${plan.price.toLocaleString()}. Proceeding with verification.`,
        );

        // Simulate successful checkout completion in staging/sandbox
        await verifyPayment({
          orderId: order.orderId,
          razorpayPaymentId: `pay_mock_${Date.now()}`,
          razorpaySignature: 'mock_signature_dev_pass',
        });

        toast.success(
          'Subscription Activated!',
          `You have successfully subscribed to ${plan.name}.`,
        );
        loadBillingData();
        return;
      }

      // 3. Open Razorpay Checkout modal
      const options = {
        key: gatewayConfig.keyId,
        amount: order.amount * 100,
        currency: order.currency || 'INR',
        name: companySettings.appName,
        description: `${plan.name} Subscription`,
        order_id: order.providerOrderId,
        handler: async (response: any) => {
          try {
            await verifyPayment({
              orderId: order.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success(
              'Payment Verified!',
              `Your subscription to ${plan.name} is now active.`,
            );
            loadBillingData();
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Verification failed';
            toast.error('Payment Error', msg);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.normalizedMobile || '',
        },
        theme: {
          color: '#2563eb',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initiate subscription checkout.';
      toast.error('Subscription Error', msg);
    } finally {
      setProcessingPlanId(null);
    }
  };

  if (!isAuthenticated && !isAuthLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-casa-brand-subtle text-casa-brand flex items-center justify-center mx-auto shadow-subtle">
          <CreditCard className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-casa-text-primary">
            Billing & Subscription Portal
          </h1>
          <p className="text-xs md:text-sm text-casa-text-secondary max-w-md mx-auto">
            Please sign in to view your active subscription, Free Trial status, invoices, and package quotas.
          </p>
        </div>
        <button
          onClick={openAuthModal}
          className="px-6 py-2.5 rounded-xl bg-casa-brand hover:bg-casa-brand-hover text-white text-xs font-bold shadow-md transition-colors"
        >
          Sign In to Access Billing
        </button>
      </div>
    );
  }

  if (isAuthenticated && isTeamMember) {
    const parentAgencyOrBrokerName =
      user?.parentAgencyName || user?.parentBrokerName || user?.agencyName || 'Broker';
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-casa-surface border border-casa-border-light rounded-3xl p-8 shadow-subtle space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto">
            <Building className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
              Team Member Account
            </span>
            <h1 className="text-xl font-black text-casa-text-primary tracking-tight">
              Subscription Managed by Broker
            </h1>
            <p className="text-sm text-casa-text-secondary leading-relaxed">
              Subscription plans and billing are managed by your Broker ({parentAgencyOrBrokerName}).
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-casa-subtle border border-casa-border-light text-xs text-casa-text-muted leading-relaxed">
            Your property quotas and entitlements are inherited directly from your Brokerage organization. You do not need an individual subscription.
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard/properties"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-casa-brand text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all"
            >
              <span>Back to My Properties</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-start">
      {/* Top Banner / Current Membership Status */}
      <div className="bg-casa-surface border border-casa-border-light rounded-3xl p-6 sm:p-8 shadow-subtle relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-casa-brand-subtle text-casa-brand text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Membership & Quota Management</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-casa-text-primary">
              Billing & Subscriptions
            </h1>

            <p className="text-xs sm:text-sm text-casa-text-secondary max-w-xl">
              Manage your active subscription plan, check trial duration, review billing statements, and upgrade your advertiser package.
            </p>
          </div>

          {/* Quick Status Pill */}
          <div className="flex flex-wrap items-center gap-3">
            {hasActiveSubscription ? (
              <div className="px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center gap-2.5">
                <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <div className="text-xs font-bold leading-none">Active Plan: {activePlanName || 'Paid Subscription'}</div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-300 mt-0.5">
                    {subscriptionExpiresAt || user?.subscriptionExpiresAt
                      ? `Valid until ${new Date(subscriptionExpiresAt || user?.subscriptionExpiresAt || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : 'Active Paid Access'}
                  </div>
                </div>
              </div>
            ) : isTrialActive ? (
              <button
                type="button"
                onClick={() => setIsFreePlanModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5 text-start cursor-pointer hover:bg-emerald-100/60 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="text-xs font-bold leading-none">3-Month Free Plan Active</div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {trialRemainingLabel || `${trialDaysRemaining} days remaining`} · 15 Listings
                  </div>
                </div>
              </button>
            ) : isTrialExpired ? (
              <div className="px-4 py-2.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 flex items-center gap-2.5">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <div className="text-xs font-bold leading-none">3-Month Free Plan Expired</div>
                  <div className="text-[10px] text-red-700 dark:text-red-300 mt-0.5">
                    Upgrade below to restore full access
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-4 py-2.5 rounded-2xl bg-casa-subtle border border-casa-border-light text-casa-text-primary flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-casa-brand" />
                <div>
                  <div className="text-xs font-bold leading-none">
                    Plan: {user?.role ? user.role.replace(/_/g, ' ') : 'Standard Account'}
                  </div>
                  <div className="text-[10px] text-casa-text-muted mt-0.5">
                    Verified Marketplace Access
                  </div>
                </div>
              </div>
            )}

            {/* Claim 3-Month Free Plan CTA */}
            {!hasActiveSubscription && !isTrialActive && !isTrialExpired && !user?.trialUsed && Boolean(user?.isTrialEligible !== false) && (
              <button
                onClick={() => setIsFreePlanModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-subtle transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Claim 3-Month Free Plan</span>
              </button>
            )}
          </div>
        </div>

        {/* Pending Subscription Request Banner */}
        {subscriptionRequests[0] && subscriptionRequests[0].status === 'PENDING' && (
          <div className="mt-6 p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 text-casa-text-primary space-y-2 shadow-sm animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="font-extrabold text-sm text-amber-900 dark:text-amber-200">
                  Subscription Request Pending Approval (Ref: {subscriptionRequests[0].requestReference})
                </span>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500 text-white uppercase tracking-wider">
                Pending Approval
              </span>
            </div>
            <p className="text-xs text-casa-text-secondary leading-relaxed">
              Your activation request for <strong>{subscriptionRequests[0].planName}</strong> (₹{subscriptionRequests[0].planPrice?.toLocaleString('en-IN')}) is under review by our Corporate Sales Governance Team. Once verified, your plan and entitlements will be activated immediately without requiring re-login.
            </p>
          </div>
        )}

        {/* Denied Subscription Request Banner */}
        {subscriptionRequests[0] && subscriptionRequests[0].status === 'DENIED' && (
          <div className="mt-6 p-5 rounded-3xl bg-red-500/10 border-2 border-red-500/30 text-casa-text-primary space-y-2 shadow-sm animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="font-extrabold text-sm text-red-900 dark:text-red-200">
                  Subscription Request Declined (Ref: {subscriptionRequests[0].requestReference})
                </span>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-600 text-white uppercase tracking-wider">
                Request Declined
              </span>
            </div>
            <p className="text-xs text-casa-text-secondary leading-relaxed">
              {subscriptionRequests[0].denialReason || 'Your previous subscription request was not approved.'} You may review plan features and submit a new request below.
            </p>
          </div>
        )}

        {/* KYC Verification Call Advisory Notice (Only for KYC-required accounts) */}
        {!isExempt && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <PhoneCall className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold">KYC & Account Verification Support: </span>
                <span>
                  Users may receive a verification call from{' '}
                  <strong className="underline font-bold text-amber-950 dark:text-white">
                    7069754589
                  </strong>{' '}
                  to complete identity checks and activate the 3-Month Free Plan.
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/kyc"
              className="text-xs font-bold text-amber-800 dark:text-amber-200 hover:underline flex items-center gap-1 whitespace-nowrap self-start sm:self-auto"
            >
              <span>View KYC Status</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Subscription Pricing Tiers */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-casa-text-primary">
            Upgrade Your Subscription Plan
          </h2>
          <p className="text-xs text-casa-text-secondary mt-0.5">
            Pick a tailored tier to maximize property views, receive verified leads, and unlock high-definition reels.
          </p>
        </div>

        {isPackagesLoading ? (
          <div className="p-12 text-center text-xs text-casa-text-muted bg-casa-surface border border-casa-border-light rounded-3xl">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-casa-brand mb-2" />
            <span>Loading active subscription plans...</span>
          </div>
        ) : eligiblePackages.length === 0 ? (
          <div className="p-12 text-center bg-casa-surface border border-casa-border-light rounded-3xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-casa-subtle text-casa-text-muted flex items-center justify-center mx-auto">
              <CreditCard className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-casa-text-primary">
                No plans are currently available.
              </h3>
              <p className="text-xs text-casa-text-muted max-w-sm mx-auto leading-relaxed">
                There are currently no active subscription packages configured for your account type. Please contact our corporate sales desk for bespoke enterprise arrangements.
              </p>
            </div>
            {companySettings?.companySalesNumber && (
              <div className="pt-2">
                <a
                  href={`tel:${companySettings.companySalesNumber}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-casa-border-light text-xs font-semibold text-casa-text-primary hover:bg-casa-subtle transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-casa-brand" />
                  <span>Contact Sales Desk ({companySettings.companySalesNumber})</span>
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {eligiblePackages.map((plan) => {
              const planKey = plan.id || plan._id || plan.slug;
              return (
                <div
                  key={planKey}
                  onClick={() => {
                    const isKycApproved =
                      user?.kycStatus === 'APPROVED' ||
                      user?.kycStatus === 'VERIFIED' ||
                      Boolean(user?.isVerifiedAgent);

                    if (!isKycApproved) {
                      toast.warning(
                        'KYC Approval Required',
                        'You must complete your KYC verification and receive Super Admin approval before choosing or subscribing to a plan.',
                      );
                      router.push('/dashboard/kyc');
                      return;
                    }

                    setSelectedDetailsPlan(plan);
                    setIsDetailsModalOpen(true);
                  }}
                  className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all relative cursor-pointer ${
                    plan.isPopular
                      ? 'bg-casa-surface border-2 border-casa-brand shadow-elevated scale-[1.02]'
                      : 'bg-casa-surface border border-casa-border-light shadow-subtle hover:border-casa-brand/40'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 right-6 bg-casa-brand text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                      Popular Plan
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-casa-text-primary">{plan.name}</h3>
                      {plan.description && (
                        <p className="text-xs text-casa-text-muted mt-1 leading-relaxed">
                          {plan.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1 border-b border-casa-border-light pb-4">
                      <span className="text-3xl font-extrabold text-casa-text-primary">
                        ₹{plan.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-casa-text-muted font-semibold">
                        /{plan.billingPeriod ? plan.billingPeriod.toLowerCase().replace(/_/g, ' ') : 'month'}
                      </span>
                    </div>

                    {plan.features && plan.features.length > 0 && (
                      <ul className="space-y-2.5 text-xs text-casa-text-secondary">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="pt-6 mt-6 border-t border-casa-border-light">
                    {(() => {
                      const isCurrentPlan =
                        (user?.activePackageId && (user.activePackageId === plan.id || user.activePackageId === plan._id)) ||
                        (hasActiveSubscription && user?.activePlanName?.toLowerCase() === plan.name?.toLowerCase());

                      return isCurrentPlan ? (
                        <div className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Current Active Plan</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const isKycApproved =
                              user?.kycStatus === 'APPROVED' ||
                              user?.kycStatus === 'VERIFIED' ||
                              Boolean(user?.isVerifiedAgent);

                            if (!isKycApproved) {
                              toast.warning(
                                'KYC Approval Required',
                                'You must complete your KYC verification and receive Super Admin approval before choosing or subscribing to a plan.',
                              );
                              router.push('/dashboard/kyc');
                              return;
                            }

                            setSelectedDetailsPlan(plan);
                            setIsDetailsModalOpen(true);
                          }}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            plan.isPopular
                              ? 'bg-casa-brand hover:bg-casa-brand-hover text-white shadow-subtle'
                              : 'bg-casa-subtle hover:bg-casa-border-light text-casa-text-primary'
                          }`}
                        >
                          <span>Upgrade to {plan.name}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Transactions & Billing Statements */}
      <div className="bg-casa-surface border border-casa-border-light rounded-3xl p-6 sm:p-8 space-y-5 shadow-subtle">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-casa-text-primary flex items-center gap-2">
              <Receipt className="w-5 h-5 text-casa-brand" />
              <span>Recent Invoices & Transactions</span>
            </h2>
            <p className="text-xs text-casa-text-muted mt-0.5">
              Cryptographically verified Razorpay statements & subscription ledger.
            </p>
          </div>

          <Link
            href="/dashboard/payments"
            className="text-xs font-bold text-casa-brand hover:underline flex items-center gap-1"
          >
            <span>Full Ledger</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
            <RefreshCw className="w-6 h-6 text-casa-brand animate-spin" />
            <p className="text-xs text-casa-text-muted">Loading transaction records...</p>
          </div>
        ) : recentPayments.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-casa-border-light rounded-2xl p-6">
            <CreditCard className="w-8 h-8 text-casa-text-muted mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold text-casa-text-secondary">
              No payment transactions recorded yet.
            </p>
            <p className="text-[11px] text-casa-text-muted mt-0.5">
              When you activate a package or boost a property, your invoices will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-casa-border-light text-[10px] uppercase font-bold text-casa-text-muted">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Product / Purpose</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-casa-border-light font-medium">
                {recentPayments.map((tx) => (
                  <tr key={tx.id || tx.orderId} className="hover:bg-casa-subtle/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-casa-text-primary">
                      {tx.orderId}
                    </td>
                    <td className="py-3 px-3 text-casa-text-secondary">
                      {tx.productName || tx.purpose.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-3 font-bold text-casa-brand">
                      {formatPrice(tx.amount, tx.currency || 'INR')}
                    </td>
                    <td className="py-3 px-3 text-casa-text-muted">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : tx.status === 'REFUNDED'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sales & Renewal Assistance Helpdesk */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-elevated">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-300">
            <HelpCircle className="w-4 h-4" />
            <span>Need Custom Enterprise Quotas or Assisted Renewal?</span>
          </div>
          <h3 className="text-xl font-bold">Speak with our Corporate Billing Desk</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            For volume discounts, custom broker agency hierarchies, GST tax invoicing, or bank NEFT transfers, our sales officers are available Monday to Saturday, 9:00 AM – 7:00 PM.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <a
            href={`tel:${companySettings.companySalesNumber.replace(/[^0-9+]/g, '')}`}
            className="px-5 py-3 rounded-2xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <PhoneCall className="w-4 h-4 text-emerald-600" />
            <span>Call Sales Desk</span>
          </a>
          <a
            href={`mailto:${companySettings.companySalesEmail}`}
            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-white/10"
          >
            <span>Email Invoicing</span>
          </a>
        </div>
      </div>

      {/* Plan Details & Subscription Action Modal */}
      <PlanDetailsModal
        isOpen={isDetailsModalOpen}
        plan={selectedDetailsPlan}
        companySettings={companySettings}
        onClose={() => setIsDetailsModalOpen(false)}
        onRequestSubmitted={() => loadBillingData()}
      />

      {/* 3-Month Free Plan & KYC Modal */}
      <FreePlanClaimModal
        isOpen={isFreePlanModalOpen}
        onClose={() => {
          setIsFreePlanModalOpen(false);
          loadBillingData();
        }}
      />
    </div>
  );
}
