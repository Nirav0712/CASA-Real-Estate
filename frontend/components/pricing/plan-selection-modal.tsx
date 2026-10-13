'use client';

import * as React from 'react';
import {
  Sparkles,
  Check,
  Zap,
  Clock,
  ShieldCheck,
  ChevronRight,
  X,
  Building,
  Eye,
  MessageSquare,
  Award,
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
          // Sort plans by price ascending
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

  if (!isPlanSelectionModalOpen) return null;

  const handleSelectPlan = async (pkg: PackagePlan) => {
    const pkgId = pkg.id || pkg._id || '';
    if (!pkgId) return;

    setSubmittingId(pkgId);
    try {
      const res = await startTrial(pkgId);
      toast.success(
        '🎉 3-Day Free Trial Activated!',
        `You have been granted full access to the "${pkg.name}" tier for 3 days. No payment needed!`,
      );
      if (refreshUser) {
        await refreshUser();
      }
      closePlanSelectionModal();
    } catch (err: any) {
      toast.error('Activation Failed', err.message || 'Could not start free trial.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-casa-surface border border-casa-border-light rounded-3xl shadow-2xl p-6 md:p-8 my-8 max-h-[92vh] overflow-y-auto space-y-6">
        {/* Close Button */}
        <button
          onClick={closePlanSelectionModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-casa-text-muted hover:text-casa-text-primary hover:bg-casa-canvas transition-colors"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-casa-brand-subtle text-casa-brand text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to CASA Real Estate</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-casa-text-primary">
            Choose Your Plan — <span className="text-casa-brand">Get 3 Days Free Trial</span>
          </h2>

          <p className="text-xs md:text-sm text-casa-text-secondary leading-relaxed">
            Select any membership package to instantly activate your <strong>3-Day Full Access Trial</strong>.
            Experience all premium listing tools, lead generation, and verified direct contact details with{' '}
            <strong className="text-casa-brand">Zero Payment Gateway or Credit Card Required</strong>.
          </p>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-casa-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-casa-text-muted">Loading live membership packages from admin gateway...</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="py-12 text-center text-xs text-casa-text-muted bg-casa-canvas rounded-2xl border border-casa-border-light">
            No active packages available at the moment. Please contact support.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            {packages.map((pkg) => {
              const pkgId = pkg.id || pkg._id || '';
              const isSubmitting = submittingId === pkgId;
              const isPopular = pkg.isPopular || pkg.slug.includes('pro') || pkg.price > 0 && pkg.price < 3000;

              return (
                <div
                  key={pkgId}
                  className={`relative rounded-3xl p-6 flex flex-col justify-between border transition-all duration-200 ${
                    isPopular
                      ? 'bg-casa-surface border-casa-brand ring-2 ring-casa-brand/20 shadow-xl md:-translate-y-1'
                      : 'bg-casa-surface border-casa-border-light hover:border-casa-border shadow-subtle'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-casa-brand text-white text-[11px] font-extrabold tracking-wider uppercase shadow-sm flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-current" />
                      <span>Most Popular</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-casa-text-primary">{pkg.name}</h3>
                      <p className="text-xs text-casa-text-secondary mt-1 line-clamp-2 min-h-[32px]">
                        {pkg.description || 'Full platform capabilities and marketplace discovery.'}
                      </p>
                    </div>

                    {/* Price Tag */}
                    <div className="py-3 border-y border-casa-border-light/80">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-casa-text-primary">
                          {pkg.price === 0 ? 'FREE' : `₹${pkg.price.toLocaleString('en-IN')}`}
                        </span>
                        {pkg.price > 0 && (
                          <span className="text-xs text-casa-text-muted font-medium">
                            / {pkg.billingPeriod.toLowerCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-emerald-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>3 Days 100% Free Trial Included</span>
                      </div>
                    </div>

                    {/* Features checklist */}
                    <div className="space-y-2.5 text-xs text-casa-text-secondary">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <span>
                          Property Views:{' '}
                          <strong className="text-casa-text-primary font-mono">
                            {pkg.limits?.propertyViewsMonthly === -1
                              ? 'Unlimited (∞)'
                              : `${pkg.limits?.propertyViewsMonthly || 25} / month`}
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <span>
                          Active Listings Cap:{' '}
                          <strong className="text-casa-text-primary font-mono">
                            {pkg.limits?.propertyListingsMax === -1
                              ? 'Unlimited (∞)'
                              : `${pkg.limits?.propertyListingsMax || 5} listings`}
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <span>
                          Monthly Buyer Leads:{' '}
                          <strong className="text-casa-text-primary font-mono">
                            {pkg.limits?.leadsMonthly === -1
                              ? 'Unlimited (∞)'
                              : `${pkg.limits?.leadsMonthly || 10} leads`}
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <span>Full Direct Owner/Agent Contact Access</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <span>AI Search & Verified Listings Filter</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-6 mt-4">
                    <button
                      onClick={() => handleSelectPlan(pkg)}
                      disabled={isSubmitting || submittingId !== null}
                      className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all shadow-subtle flex items-center justify-center gap-1.5 cursor-pointer ${
                        isPopular
                          ? 'bg-casa-brand hover:bg-casa-brand/90 text-white'
                          : 'bg-casa-text-primary hover:bg-casa-text-primary/90 text-white dark:text-zinc-900'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Activating Trial...</span>
                        </>
                      ) : (
                        <>
                          <span>Start 3-Day Free Trial</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                    <span className="block text-center text-[10px] text-casa-text-muted mt-2">
                      No charge • Full access for 3 days
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Guarantee */}
        <div className="pt-4 border-t border-casa-border-light flex flex-col sm:flex-row items-center justify-between text-[11px] text-casa-text-muted gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Risk-Free: Instant activation with no credit card or payment gateway requirement.</span>
          </div>
          <button
            onClick={closePlanSelectionModal}
            className="text-casa-text-secondary hover:text-casa-brand font-semibold underline underline-offset-4"
          >
            Decide later and explore marketplace
          </button>
        </div>
      </div>
    </div>
  );
}
