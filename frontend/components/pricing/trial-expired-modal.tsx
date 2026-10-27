'use client';

import * as React from 'react';
import {
  AlertTriangle,
  PhoneCall,
  Headphones,
  Mail,
  ShieldAlert,
  Check,
  X,
  CreditCard,
  Building,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { createSubscriptionRequest } from '@/services/payment-service';
import {
  getActivePackages,
  getPublicCompanySettings,
  PackagePlan,
  CompanySettings,
} from '@/services/entitlements-service';

export function TrialExpiredModal() {
  const { isTrialExpiredModalOpen, closeTrialExpiredModal, user } = useAuth();
  const toast = useToast();
  const [requestingPlanId, setRequestingPlanId] = React.useState<string | null>(null);

  const [packages, setPackages] = React.useState<PackagePlan[]>([]);
  const [settings, setSettings] = React.useState<CompanySettings>({
    appName: 'myproperty Marketplace',
    companySalesNumber: '+91 98765 43210',
    companyServiceNumber: '+91 98765 43211',
    companySalesEmail: 'sales@myproperty.com',
    companySupportEmail: 'support@myproperty.com',
    companyAddress: 'Vibhuti Khand, Gomti Nagar, Lucknow, UP',
    trialDays: 3,
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isTrialExpiredModalOpen) return;

    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [plans, sett] = await Promise.all([
          getActivePackages().catch(() => []),
          getPublicCompanySettings().catch(() => null),
        ]);
        if (isMounted) {
          if (plans.length > 0) setPackages(plans.sort((a, b) => a.price - b.price));
          if (sett) setSettings(sett);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isTrialExpiredModalOpen]);

  const role = String(user?.role || '').toUpperCase();
  const accountType = String(user?.accountType || '').toUpperCase();
  const platformRole = String(user?.platformRole || '').toUpperCase();
  const isExempt =
    ['BUYER', 'TENANT', 'PURCHASER'].includes(role) ||
    ['BUYER', 'TENANT'].includes(accountType) ||
    ['SUPER_ADMIN', 'ADMIN'].includes(platformRole) ||
    ['SUPER_ADMIN', 'ADMIN'].includes(role);

  if (!isTrialExpiredModalOpen || isExempt) return null;

  const salesPhone = settings.companySalesNumber || '+91 98765 43210';
  const servicePhone = settings.companyServiceNumber || '+91 98765 43211';
  const cleanSalesPhone = salesPhone.replace(/[^0-9+]/g, '');
  const cleanServicePhone = servicePhone.replace(/[^0-9+]/g, '');

  const handleAction = async (pkg: PackagePlan, method: 'WHATSAPP' | 'CALL') => {
    const pkgId = pkg.id || pkg._id || '';
    if (!pkgId) return;
    setRequestingPlanId(`${pkgId}-${method}`);
    try {
      let ref = 'PENDING';
      try {
        const res = await createSubscriptionRequest({
          packageId: pkgId,
          contactMethod: method,
        });
        if (res?.request?.requestReference) {
          ref = res.request.requestReference;
        }
      } catch (err: any) {
        console.warn('Subscription request note:', err?.message);
      }

      if (method === 'CALL') {
        const targetCall = pkg.callNumber || cleanSalesPhone;
        const cleanCall = targetCall.replace(/[^0-9+]/g, '');
        if (!cleanCall) {
          toast.error('Call Hotline Unavailable', 'Sales Call hotline is not configured for this plan or in settings.');
          return;
        }
        window.location.href = `tel:${cleanCall}`;
      } else {
        const rawWa = pkg.whatsappNumber || settings.companySalesWhatsapp || settings.companySalesNumber || '';
        const cleanWa = rawWa.replace(/[^0-9]/g, '');
        if (!cleanWa) {
          toast.error('WhatsApp Unavailable', 'Sales WhatsApp hotline is not configured for this plan or in settings.');
          return;
        }

        const featureSummary = (pkg.features && pkg.features.length > 0)
          ? pkg.features.slice(0, 4).join(', ')
          : (pkg.description || 'Full platform features');

        const message = `Hello My Property Team, I would like to subscribe to ${pkg.name}. User: ${user?.name || 'Customer'}. Registered Mobile: ${user?.mobile || user?.normalizedMobile || ''}. Plan Price: ₹${pkg.price.toLocaleString('en-IN')}. Billing Period: ${pkg.billingPeriod || 'Monthly'}. Plan Features: ${featureSummary}. Request Reference: ${ref}. Please review my subscription activation request.`;

        window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      }

      toast.success(
        'Subscription Request Recorded',
        `Reference: ${ref}. Our Sales Team is ready to activate your plan.`
      );
    } finally {
      setRequestingPlanId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-casa-surface border border-casa-border-light rounded-3xl shadow-2xl p-6 md:p-8 my-8 max-h-[94vh] overflow-y-auto space-y-6">
        {/* Close Button */}
        <button
          onClick={closeTrialExpiredModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-casa-text-muted hover:text-casa-text-primary hover:bg-casa-canvas transition-colors"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon & Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-inner">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-950/80 dark:text-red-300 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>3-Day Trial Period Concluded</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-casa-text-primary">
            Your 3-Day Free Trial Has Ended
          </h2>

          <p className="text-xs md:text-sm text-casa-text-secondary leading-relaxed">
            Your complimentary 3-day access has expired. To maintain uninterrupted access to seller direct contacts,
            exclusive leads, and active listing promotions, please connect with our Sales Department to process payment for your chosen plan.
          </p>
        </div>

        {/* PROMINENT CALL-TO-ACTION SECTION FOR SALES DEPARTMENT */}
        <div className="p-6 md:p-7 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-casa-brand/10 to-casa-surface border-2 border-emerald-500/30 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Official Company Billing & Sales Hotline
              </span>
              <h3 className="text-lg md:text-xl font-extrabold text-casa-text-primary mt-0.5">
                Call Our Sales Department Now
              </h3>
            </div>

            <div className="text-start sm:text-end">
              <span className="text-xs text-casa-text-muted">Instant activation via phone</span>
              <p className="text-xs font-bold text-emerald-600">Mon - Sat (9:00 AM - 8:00 PM IST)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* BIG PRIMARY CTA CALL BUTTON */}
            <a
              href={`tel:${cleanSalesPhone}`}
              className="flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm md:text-base shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              <PhoneCall className="w-5 h-5 animate-bounce" />
              <span>Call Sales: {salesPhone}</span>
            </a>

            {/* CUSTOMER SERVICE NUMBER */}
            <a
              href={`tel:${cleanServicePhone}`}
              className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-casa-surface hover:bg-casa-canvas text-casa-text-primary border border-casa-border-light font-bold text-sm shadow-sm transition-all"
            >
              <Headphones className="w-4 h-4 text-casa-brand" />
              <span>Customer Care: {servicePhone}</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-casa-text-muted pt-1">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-casa-brand" />
              Sales Desk: <strong className="text-casa-text-primary font-mono">{settings.companySalesEmail}</strong>
            </span>
            <span>•</span>
            <span>UPI / NEFT / RTGS Corporate Billing Accepted</span>
          </div>
        </div>

        {/* MEMBERSHIP PLANS PRICING CATALOG */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-casa-text-primary flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-casa-brand" />
              Select Your Plan to Activate via Sales Desk:
            </h4>
            <span className="text-xs text-casa-text-muted font-medium">Mention plan name when calling or chatting</span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-casa-text-muted">Loading pricing packages...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.id || pkg._id}
                  className="p-4 rounded-2xl bg-casa-canvas border border-casa-border-light flex flex-col justify-between space-y-2 hover:border-casa-brand/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-xs text-casa-text-primary">{pkg.name}</h5>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-casa-brand-subtle text-casa-brand font-mono">
                        {pkg.billingPeriod}
                      </span>
                    </div>

                    <div className="mt-2 text-xl font-extrabold text-casa-text-primary">
                      {pkg.price === 0 ? 'FREE' : `₹${pkg.price.toLocaleString('en-IN')}`}
                    </div>

                    <p className="text-[11px] text-casa-text-secondary mt-1 line-clamp-2">
                      {pkg.description || 'Complete features access.'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-casa-border-light">
                    <button
                      type="button"
                      disabled={requestingPlanId === `${pkg.id || pkg._id}-CALL`}
                      onClick={() => handleAction(pkg, 'CALL')}
                      className="w-full py-2 px-3 rounded-xl bg-casa-brand/10 hover:bg-casa-brand text-casa-brand hover:text-white text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call to Subscribe</span>
                    </button>

                    <button
                      type="button"
                      disabled={requestingPlanId === `${pkg.id || pkg._id}-WHATSAPP`}
                      onClick={() => handleAction(pkg, 'WHATSAPP')}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp to Subscribe</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-casa-border-light flex items-center justify-between text-xs text-casa-text-muted">
          <span>Headquarters: {settings.companyAddress}</span>
          <button
            onClick={closeTrialExpiredModal}
            className="text-casa-text-secondary hover:text-casa-text-primary font-semibold"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
