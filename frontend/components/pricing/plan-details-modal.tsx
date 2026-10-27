'use client';

import * as React from 'react';
import {
  X,
  PhoneCall,
  MessageSquare,
  Check,
  ShieldCheck,
  Sparkles,
  Zap,
  Building,
  Video,
  Users,
  Eye,
  Clock,
  Award,
} from 'lucide-react';
import { PackagePlan, CompanySettings } from '@/services/entitlements-service';
import { createSubscriptionRequest } from '@/services/payment-service';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';

interface PlanDetailsModalProps {
  plan: PackagePlan | null;
  isOpen: boolean;
  onClose: () => void;
  companySettings: CompanySettings;
  onRequestSubmitted?: (ref: string) => void;
}

export function PlanDetailsModal({
  plan,
  isOpen,
  onClose,
  companySettings,
  onRequestSubmitted,
}: PlanDetailsModalProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [submittingAction, setSubmittingAction] = React.useState<'CALL' | 'WHATSAPP' | null>(null);

  if (!isOpen || !plan) return null;

  const targetSalesPhone = plan.callNumber || companySettings.companySalesNumber || '';
  const cleanSalesPhone = targetSalesPhone.replace(/[^0-9+]/g, '');

  const limits = plan.limits || {};

  const handleAction = async (method: 'CALL' | 'WHATSAPP') => {
    setSubmittingAction(method);
    const pkgId = plan.id || plan._id;

    try {
      let ref = 'PENDING';
      try {
        const res = await createSubscriptionRequest({
          packageId: pkgId || '',
          contactMethod: method,
        });
        if (res?.request?.requestReference) {
          ref = res.request.requestReference;
        }
      } catch (err: any) {
        console.warn('Subscription request notice:', err?.message);
      }

      if (onRequestSubmitted) {
        onRequestSubmitted(ref);
      }

      if (method === 'CALL') {
        if (!cleanSalesPhone) {
          toast.error(
            'Sales Phone Unavailable',
            'Sales contact number is not configured for this plan or in system settings.',
          );
          return;
        }
        window.location.href = `tel:${cleanSalesPhone}`;
      } else {
        const rawWa = plan.whatsappNumber || companySettings.companySalesWhatsapp || companySettings.companySalesNumber || '';
        const cleanWa = rawWa.replace(/[^0-9]/g, '');
        if (!cleanWa) {
          toast.error(
            'WhatsApp Hotline Unavailable',
            'Sales WhatsApp contact is not configured for this plan or in system settings.',
          );
          return;
        }

        const featureSummary =
          plan.features && plan.features.length > 0
            ? plan.features.slice(0, 4).join(', ')
            : plan.description || 'Full platform features';

        const messageText = `Hello My Property Team, I would like to subscribe to ${plan.name}. User: ${user?.name || 'Customer'}. Registered Mobile: ${user?.mobile || user?.normalizedMobile || ''}. Plan Price: ₹${plan.price.toLocaleString('en-IN')}. Billing Period: ${plan.billingPeriod || 'Monthly'}. Plan Features: ${featureSummary}. Request Reference: ${ref}. Please review my subscription activation request.`;

        window.open(
          `https://wa.me/${cleanWa}?text=${encodeURIComponent(messageText)}`,
          '_blank',
          'noopener,noreferrer',
        );
      }

      toast.success(
        'Subscription Request Recorded',
        `Request Reference: ${ref}. Our Corporate Sales Team is ready to activate your ${plan.name} plan.`,
      );
      onClose();
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-casa-surface border border-casa-border-light rounded-3xl shadow-2xl p-6 sm:p-8 my-8 max-h-[94vh] overflow-y-auto space-y-6 text-start">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-casa-text-muted hover:text-casa-text-primary hover:bg-casa-canvas transition-colors cursor-pointer"
          title="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Plan Header */}
        <div className="space-y-2 border-b border-casa-border-light pb-5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-casa-brand-subtle text-casa-brand uppercase tracking-wider">
              {plan.billingPeriod ? plan.billingPeriod.replace(/_/g, ' ') : 'MONTHLY'} SUBSCRIPTION
            </span>
            {plan.isPopular && (
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                Popular Choice
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-casa-text-primary">
            {plan.name}
          </h2>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-casa-text-primary">
              ₹{plan.price.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-casa-text-muted font-medium">
              /{plan.billingPeriod ? plan.billingPeriod.toLowerCase().replace(/_/g, ' ') : 'month'}
            </span>
          </div>

          {plan.description && (
            <p className="text-xs text-casa-text-secondary pt-1 leading-relaxed">
              {plan.description}
            </p>
          )}
        </div>

        {/* Quotas & Entitlements Overview */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-casa-text-muted">
            Platform Limits & Quotas
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-casa-canvas border border-casa-border-light text-center">
              <Building className="w-4 h-4 text-casa-brand mx-auto mb-1" />
              <div className="text-base font-extrabold text-casa-text-primary">
                {limits.propertyListingsMax !== undefined
                  ? limits.propertyListingsMax === -1
                    ? 'Unlimited'
                    : limits.propertyListingsMax
                  : 'Unlimited'}
              </div>
              <div className="text-[10px] text-casa-text-muted">Listings Quota</div>
            </div>

            <div className="p-3 rounded-2xl bg-casa-canvas border border-casa-border-light text-center">
              <Eye className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <div className="text-base font-extrabold text-casa-text-primary">
                {limits.propertyViewsMonthly !== undefined
                  ? limits.propertyViewsMonthly === -1
                    ? 'Unlimited'
                    : limits.propertyViewsMonthly
                  : 'Unlimited'}
              </div>
              <div className="text-[10px] text-casa-text-muted">Monthly Views</div>
            </div>

            <div className="p-3 rounded-2xl bg-casa-canvas border border-casa-border-light text-center">
              <Sparkles className="w-4 h-4 text-purple-600 mx-auto mb-1" />
              <div className="text-base font-extrabold text-casa-text-primary">
                {limits.featuredListingsMax !== undefined
                  ? limits.featuredListingsMax === -1
                    ? 'Unlimited'
                    : limits.featuredListingsMax
                  : 'Boosts'}
              </div>
              <div className="text-[10px] text-casa-text-muted">Featured Boosts</div>
            </div>

            <div className="p-3 rounded-2xl bg-casa-canvas border border-casa-border-light text-center">
              <Users className="w-4 h-4 text-amber-600 mx-auto mb-1" />
              <div className="text-base font-extrabold text-casa-text-primary">
                {limits.leadsMonthly !== undefined
                  ? limits.leadsMonthly === -1
                    ? 'Unlimited'
                    : limits.leadsMonthly
                  : 'Full CRM'}
              </div>
              <div className="text-[10px] text-casa-text-muted">Monthly Leads</div>
            </div>
          </div>
        </div>

        {/* Complete Features Checklist */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-casa-text-muted">
            Included Plan Features & Benefits
          </h4>

          {plan.features && plan.features.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-casa-text-secondary">
              {plan.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2 p-2 rounded-xl bg-casa-canvas/50">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-casa-text-muted">
              Complete property listing, lead dispatch, verified agency badge, and search priority.
            </p>
          )}
        </div>

        {/* Trust Guarantee Note */}
        <div className="p-3.5 rounded-2xl bg-casa-canvas border border-casa-border-light flex items-center gap-3 text-xs text-casa-text-secondary">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>
            Zero surprise charges. Your subscription request is recorded and processed directly by our Corporate Sales Governance Desk.
          </span>
        </div>

        {/* Action Buttons: Call to Subscribe & WhatsApp to Subscribe */}
        <div className="pt-2 space-y-2 border-t border-casa-border-light">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={submittingAction !== null}
              onClick={() => handleAction('CALL')}
              className="flex-1 py-3 px-4 rounded-2xl bg-casa-surface hover:bg-casa-canvas text-casa-text-primary border-2 border-casa-border-medium font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-casa-brand" />
              <span>Call to Subscribe</span>
            </button>

            <button
              type="button"
              disabled={submittingAction !== null}
              onClick={() => handleAction('WHATSAPP')}
              className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp to Subscribe</span>
            </button>
          </div>

          <p className="text-center text-[11px] text-casa-text-muted">
            Sales Desk: {targetSalesPhone || 'Direct Sales Hotline'} • Instant request reference generated automatically
          </p>
        </div>
      </div>
    </div>
  );
}
