'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
  Users,
  Zap,
  PhoneCall,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  Gift,
  ArrowRight,
  TrendingUp,
  Layers,
  Crown,
  Info,
  Check,
  X,
  Search,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import {
  getDynamicPricingPlans,
  claimFreeTrial,
  DynamicPricingResponse,
} from '@/services/entitlements-service';
import { FreePlanClaimModal } from '@/components/pricing/free-plan-claim-modal';
import {
  createPaymentOrder,
  getPublicGatewayConfig,
  verifyPayment,
  loadRazorpaySdk,
} from '@/services/payment-service';

const USER_TYPES = [
  { id: 'DEVELOPER', label: 'Builder / Developer', icon: Building, badge: 'High Volume' },
  { id: 'BROKER', label: 'Broker', icon: Users, badge: 'Firm & Mandates' },
  { id: 'AGENT', label: 'Agent', icon: ShieldCheck, badge: 'Independent' },
  { id: 'PROPERTY_OWNER', label: 'Property Owner', icon: Layers, badge: 'Direct Seller' },
  { id: 'BUYER', label: 'Buyer / Tenant', icon: Search, badge: 'Always Free' },
];

const DURATIONS = [
  { months: 1, label: '1 Month', tag: 'Monthly' },
  { months: 2, label: '2 Months', tag: 'Bi-Monthly' },
  { months: 3, label: '3 Months', tag: 'Quarterly' },
  { months: 6, label: '6 Months', tag: 'Half-Yearly' },
  { months: 12, label: '1 Year', tag: 'Yearly — Best Value' },
];

export default function PricingPage() {
  const router = useRouter();
  const { user, isAuthenticated, openAuthModal, refreshUser } = useAuth();
  const toast = useToast();

  const [selectedUserType, setSelectedUserType] = React.useState<string>('DEVELOPER');
  const [selectedDuration, setSelectedDuration] = React.useState<number>(1);
  const [pricingData, setPricingData] = React.useState<DynamicPricingResponse | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [isFreePlanModalOpen, setIsFreePlanModalOpen] = React.useState<boolean>(false);
  const [processingPlanId, setProcessingPlanId] = React.useState<string | null>(null);

  // Auto-detect user accountType if logged in
  React.useEffect(() => {
    if (user?.accountType) {
      const uType = user.accountType.toUpperCase();
      if (['DEVELOPER', 'BROKER', 'AGENT', 'PROPERTY_OWNER', 'BUYER', 'TENANT'].includes(uType)) {
        setSelectedUserType(uType === 'TENANT' ? 'BUYER' : uType);
      }
    }
  }, [user]);

  // Load plans whenever userType or duration changes
  const loadPlans = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDynamicPricingPlans(selectedUserType, selectedDuration);
      setPricingData(data);
    } catch (err: any) {
      toast.error('Failed to load plans', err?.message || 'Could not fetch pricing catalog');
    } finally {
      setLoading(false);
    }
  }, [selectedUserType, selectedDuration, toast]);

  React.useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // Handle Plan Purchase Checkout
  const handlePurchasePlan = async (plan: any) => {
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

    if (plan.isFree) {
      setIsFreePlanModalOpen(true);
      return;
    }

    setProcessingPlanId(plan.id);
    try {
      // 1. Create Order on Backend with durationMonths & packageId
      const order = await createPaymentOrder({
        purpose: 'SUBSCRIPTION',
        packageId: plan.id,
        durationMonths: selectedDuration,
        metadata: {
          planName: plan.name,
          platform: 'web',
          userType: selectedUserType,
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
        // Fallback simulation / instant mock verification if Razorpay SDK isn't configured/loaded
        toast.info(
          'Checkout Initiated',
          `Order ${order.orderId} generated for ₹${order.amount.toLocaleString()}. Verifying transaction...`,
        );

        await verifyPayment({
          orderId: order.orderId,
          razorpayPaymentId: `pay_mock_${Date.now()}`,
          razorpaySignature: 'mock_signature_dev_pass',
        });

        toast.success(
          'Subscription Activated!',
          `You have successfully subscribed to the ${plan.name} (${selectedDuration} Month) plan.`,
        );
        if (refreshUser) await refreshUser();
        await loadPlans();
        router.push('/dashboard/billing');
        return;
      }

      // 3. Open Razorpay Checkout modal
      const options = {
        key: gatewayConfig.keyId,
        amount: Math.round(order.amount * 100),
        currency: order.currency || 'INR',
        name: 'My Property Real Estate Marketplace',
        description: `${plan.name} Plan (${selectedDuration} Months)`,
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
              `Your subscription to ${plan.name} is now active. Welcome to My Property!`,
            );
            if (refreshUser) await refreshUser();
            await loadPlans();
            router.push('/dashboard/billing');
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Verification failed';
            toast.error('Payment Error', msg);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: (user as any)?.mobile || '',
        },
        theme: {
          color: '#2563eb',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error('Checkout Error', err?.message || 'Could not initiate subscription checkout.');
    } finally {
      setProcessingPlanId(null);
    }
  };

  const freeTrialStatus = pricingData?.freeTrialStatus;
  const isConsumer = selectedUserType === 'BUYER';

  const isTeamMember = Boolean(
    user &&
      (user.accountType === 'BROKER_AGENT' ||
        user.role === 'BROKER_AGENT' ||
        user.brokerId ||
        user.parentUserId),
  );

  if (isAuthenticated && isTeamMember) {
    const parentAgencyOrBrokerName =
      (user as any)?.parentAgencyName || (user as any)?.parentBrokerName || user?.agencyName || 'Broker';
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 text-center">
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
            Your property quotas and entitlements are inherited directly from your Brokerage organization. You do not need to purchase an individual subscription.
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Background Glow Highlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-blue-600/15 via-indigo-600/5 to-transparent blur-3xl pointer-events-none -z-0" />

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 space-y-12">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Transparent Value For Real Estate Growth
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Simple, Transparent Plans For <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
              Every Growth Stage
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Choose the ideal plan tailored for Builders, Brokers, and Agents. Scale your property inventory, project launches, and verified sales team with My Property Real Estate Marketplace.
          </p>
        </div>

        {/* 50-Slot Free Trial Banner */}
        {freeTrialStatus && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-amber-950/70 border border-emerald-500/30 p-5 md:p-6 shadow-xl shadow-emerald-950/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
                  <Gift className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wide">
                      Introductory Launch Offer
                    </span>
                    <span className="text-xs text-slate-400 font-medium">90 Days Full Access</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    First 50 Users Get 3 Months Free Access!
                  </h3>
                  <p className="text-sm text-slate-300 mt-0.5">
                    Eligible for Builders, Brokers, and Independent Agents with KYC approval. Includes 15 active properties.
                  </p>
                </div>
              </div>

              {/* Progress and Claim CTA */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto shrink-0">
                <div className="w-full sm:w-48 bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/80 text-center">
                  <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-medium">
                    <span>Slots Claimed</span>
                    <span className="text-amber-400 font-bold">
                      {freeTrialStatus.claimedSlots} / {freeTrialStatus.maxSlots}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (freeTrialStatus.claimedSlots / freeTrialStatus.maxSlots) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1 font-semibold">
                    {freeTrialStatus.remainingSlots > 0
                      ? `${freeTrialStatus.remainingSlots} slots remaining`
                      : 'Slots fully claimed'}
                  </div>
                </div>

                <button
                  onClick={() => setIsFreePlanModalOpen(true)}
                  disabled={!freeTrialStatus.isAvailable}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Claim 3 Months Free
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Controls Section: User Type Tabs & Duration Dropdown */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-lg backdrop-blur-md">
          {/* User Type Horizontal Tabs */}
          <div className="flex items-center overflow-x-auto no-scrollbar gap-2 pb-2 lg:pb-0">
            {USER_TYPES.map((type) => {
              const Icon = type.icon;
              const isActive = selectedUserType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedUserType(type.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{type.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                      isActive
                        ? 'bg-blue-700/60 text-blue-100'
                        : 'bg-slate-700/60 text-slate-400'
                    }`}
                  >
                    {type.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Subscription Duration Selector */}
          {!isConsumer && (
            <div className="flex items-center gap-3 shrink-0 self-end lg:self-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Duration:
              </span>
              <div className="relative">
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(Number(e.target.value))}
                  className="appearance-none bg-slate-800 border border-slate-700 hover:border-slate-600 text-white font-semibold text-sm rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm transition-colors"
                >
                  {DURATIONS.map((dur) => (
                    <option key={dur.months} value={dur.months}>
                      {dur.label} — {dur.tag}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[520px] rounded-3xl bg-slate-900/60 border border-slate-800/80 animate-pulse p-6 space-y-6"
              >
                <div className="h-6 bg-slate-800 rounded w-1/2" />
                <div className="h-10 bg-slate-800 rounded w-3/4" />
                <div className="space-y-3 pt-6">
                  <div className="h-4 bg-slate-800 rounded" />
                  <div className="h-4 bg-slate-800 rounded w-5/6" />
                  <div className="h-4 bg-slate-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Buyer / Tenant Zero Fee Information Card */}
        {!loading && isConsumer && (
          <div className="max-w-2xl mx-auto rounded-3xl bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto">
              <Search className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold tracking-wide uppercase">
                100% Free Forever
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Zero Platform Fees For Buyers & Tenants
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                As a home seeker or commercial property buyer, you never pay to browse listings, connect with verified agents and builders, or schedule property viewings on My Property.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-4">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
                <h4 className="text-sm font-bold text-white">Unlimited Browsing</h4>
                <p className="text-xs text-slate-400 mt-1">Explore verified homes, plots, and offices.</p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
                <h4 className="text-sm font-bold text-white">Direct Agent Contact</h4>
                <p className="text-xs text-slate-400 mt-1">Call & WhatsApp builders and brokers directly.</p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
                <h4 className="text-sm font-bold text-white">Saved Properties</h4>
                <p className="text-xs text-slate-400 mt-1">Save favorites and compare features side-by-side.</p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/properties"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Browse Verified Properties
              </Link>
              <button
                onClick={() => setSelectedUserType('AGENT')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all"
              >
                I am a Real Estate Professional
              </button>
            </div>
          </div>
        )}

        {/* Professional Dynamic SaaS Pricing Cards (4 horizontal cards) */}
        {!loading && !isConsumer && pricingData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {pricingData.plans.map((plan) => {
              const isRecommended = plan.recommended;
              const isFree = plan.isFree;
              const hasDiscount = (plan.discountPercentage || 0) > 0;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-3xl transition-all duration-300 p-6 md:p-7 ${
                    isRecommended
                      ? 'bg-gradient-to-b from-blue-950/80 via-slate-900 to-slate-900 border-2 border-blue-500 shadow-2xl shadow-blue-900/30 -translate-y-2'
                      : isFree
                      ? 'bg-slate-900/90 border border-emerald-500/40 shadow-lg'
                      : 'bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-lg'
                  }`}
                >
                  {/* Recommended / Free Pill */}
                  {isRecommended && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-extrabold uppercase tracking-wider shadow-md shadow-blue-600/40 flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-300" />
                      Recommended
                    </div>
                  )}

                  {isFree && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-extrabold uppercase tracking-wider shadow-md shadow-emerald-600/40 flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5" />
                      Introductory Free
                    </div>
                  )}

                  {/* Header */}
                  <div className="space-y-1.5 pt-2">
                    <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-400 min-h-[32px]">{plan.description}</p>
                  </div>

                  {/* Pricing Display */}
                  <div className="mt-5 pb-5 border-b border-slate-800/80 space-y-2">
                    {isFree ? (
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl md:text-4xl font-extrabold text-white">₹0</span>
                          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                            / 3 Months Free
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Full introductory access (90 days validity)
                        </p>
                      </div>
                    ) : (
                      <div>
                        {/* Monthly equivalent big rate */}
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl md:text-4xl font-extrabold text-white">
                            ₹{plan.monthlyEquivalent.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">/ month</span>
                        </div>

                        {/* Total duration price + reference discount */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-300 font-semibold">
                            ₹{plan.price.toLocaleString()} for {selectedDuration}{' '}
                            {selectedDuration === 1 ? 'month' : 'months'}
                          </span>

                          {hasDiscount && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                              Save {plan.discountPercentage}%
                            </span>
                          )}
                        </div>

                        {hasDiscount && (
                          <div className="text-[11px] text-slate-400">
                            Total savings: ₹{(plan.savings || 0).toLocaleString()} vs monthly
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Key Limits Highlight Box */}
                  <div className="my-5 bg-slate-800/50 rounded-2xl p-4 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-blue-400" />
                        Active Properties
                      </span>
                      <span className="font-bold text-white">
                        {plan.limits?.propertyListingsMax || 10}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        Active Projects
                      </span>
                      <span className="font-bold text-white">
                        {plan.limits?.projectListings || 5}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-sky-400" />
                        Team Seats
                      </span>
                      <span className="font-bold text-white">
                        {plan.limits?.teamMembersMax || 2} Seats
                      </span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="flex-1 space-y-2.5 pb-6">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Included Features:
                    </span>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {plan.features?.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action CTA Button */}
                  <div className="space-y-3 mt-auto">
                    <button
                      onClick={() => handlePurchasePlan(plan)}
                      disabled={processingPlanId === plan.id}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
                        isRecommended
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                          : isFree
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      }`}
                    >
                      {processingPlanId === plan.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : isFree ? (
                        <>
                          <Gift className="w-4 h-4" />
                          Claim 3 Months Free
                        </>
                      ) : (
                        <>
                          <span>Choose {plan.name}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* WhatsApp & Call Quick Connect */}
                    {(plan.whatsappNumber || plan.callNumber) && (
                      <div className="flex items-center justify-center gap-3 pt-1 text-xs">
                        {plan.whatsappNumber && (
                          <a
                            href={`https://wa.me/${plan.whatsappNumber.replace(/\D/g, '')}?text=Hi%20My%20Property%20Team,%20I%20am%20interested%20in%20the%20${encodeURIComponent(plan.name)}%20Plan`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        {plan.whatsappNumber && plan.callNumber && (
                          <span className="text-slate-600">•</span>
                        )}
                        {plan.callNumber && (
                          <a
                            href={`tel:${plan.callNumber.replace(/\D/g, '')}`}
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Call Sales</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Company Level Shared Listing Cap Explanation */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                <Users className="w-3.5 h-3.5" />
                Team & Organization Sharing
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white">
                Company-Level Shared Inventory & Unified Limits
              </h3>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                When you subscribe as a Builder or Brokerage firm, all invitees and team members under your account share your active property and project listing limits. Only published active listings count against your allocation.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
              <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 text-center">
                <span className="text-xs text-slate-400 block">Drafts / Inactive</span>
                <span className="text-sm font-bold text-emerald-400">Do Not Count</span>
              </div>
              <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 text-center">
                <span className="text-xs text-slate-400 block">Agent Sub-Accounts</span>
                <span className="text-sm font-bold text-blue-400">Unified Pool</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="max-w-4xl mx-auto pt-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
            <p className="text-sm text-slate-400">Everything you need to know about My Property subscriptions and billing.</p>
          </div>

          <div className="space-y-4">
            <FaqItem
              question="How does the First 50 Users Free Trial offer work?"
              answer="The first 50 eligible Builders, Brokers, and Independent Agents who sign up receive 3 Months (90 days) of completely free access to My Property Real Estate Marketplace. The offer provides full access to 5 active property listings and 2 project listings with 1 team seat. Slots are allocated automatically on a first-come, first-served basis."
            />
            <FaqItem
              question="How are multi-month duration discounts calculated?"
              answer="When selecting 2 Months, 3 Months, 6 Months, or 1 Year durations, you receive pre-configured discounted rates. For example, the Advanced Plan offers ₹14,999 for 1 year compared to ₹1,499 per month, saving you nearly ₹3,000 annually. Durations can be chosen from the top dropdown."
            />
            <FaqItem
              question="What payment methods does My Property accept?"
              answer="We accept all major credit and debit cards, UPI (Google Pay, PhonePe, Paytm), NetBanking across 50+ Indian banks, and Corporate Wallets via cryptographically verified Razorpay payment processing."
            />
            <FaqItem
              question="Can I upgrade or renew my plan anytime?"
              answer="Yes! You can upgrade your tier or renew your duration at any time directly through your Billing Dashboard. Upgrades immediately expand your team seats and listing allocations."
            />
            <FaqItem
              question="Do draft or archived listings count against my property limit?"
              answer="No. Only published, live listings on the My Property marketplace count toward your active listing allocation. You can create unlimited drafts and archive completed deals without reducing your plan capacity."
            />
          </div>
        </div>
      </div>

      {/* 3-Month Free Plan & KYC Enforcement Modal */}
      <FreePlanClaimModal
        isOpen={isFreePlanModalOpen}
        onClose={() => {
          setIsFreePlanModalOpen(false);
          loadPlans();
          if (refreshUser) refreshUser();
        }}
      />
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 overflow-hidden transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
      >
        <span className="text-sm sm:text-base font-bold text-white">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-400' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
          {answer}
        </div>
      )}
    </div>
  );
}
