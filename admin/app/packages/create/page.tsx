'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, CreditCard, Sparkles, MessageCircle, PhoneCall } from 'lucide-react';
import { createPackage } from '@/services/entitlements-service';
import { useAdminAuth } from '@/contexts/auth-context';
import { BillingPeriod, AccountType, PackageDurationPrice } from '@/types';

const ACCOUNT_TYPES: AccountType[] = [
  'AGENT',
  'BROKER',
  'DEVELOPER',
  'PROPERTY_OWNER',
];

export default function CreatePackagePage() {
  const router = useRouter();
  const { adminUser } = useAdminAuth();
  const isSuperAdmin = adminUser?.role === 'SUPER_ADMIN' || adminUser?.platformRole === 'SUPER_ADMIN';

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('MONTHLY');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [callNumber, setCallNumber] = useState('');
  const [targetAccountTypes, setTargetAccountTypes] = useState<AccountType[]>(['AGENT']);
  const [eligibleUserTypes, setEligibleUserTypes] = useState<string[]>(['builder', 'broker', 'agent']);
  const [isPopular, setIsPopular] = useState(false);
  const [recommended, setRecommended] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [freeTrialMaxSlots, setFreeTrialMaxSlots] = useState<number>(50);
  const [featureTagInput, setFeatureTagInput] = useState('');
  const [features, setFeatures] = useState<string[]>([
    'Standard Support',
    'Verified Profile Badge',
  ]);

  const [durationPrices, setDurationPrices] = useState<PackageDurationPrice[]>([
    { durationMonths: 1, amount: 999, referenceMonthlyPrice: 999, isActive: true },
    { durationMonths: 2, amount: 1999, referenceMonthlyPrice: 999, isActive: true },
    { durationMonths: 3, amount: 2999, referenceMonthlyPrice: 999, isActive: true },
    { durationMonths: 6, amount: 4999, referenceMonthlyPrice: 999, isActive: true },
    { durationMonths: 12, amount: 10499, referenceMonthlyPrice: 999, isActive: true },
  ]);

  // Limits
  const [propertyListingsMax, setPropertyListingsMax] = useState<number>(10);
  const [projectListingsMax, setProjectListingsMax] = useState<number>(5);
  const [featuredListingsMax, setFeaturedListingsMax] = useState<number>(1);
  const [propertyViewsMonthly, setPropertyViewsMonthly] = useState<number>(50);
  const [savedItemsMax, setSavedItemsMax] = useState<number>(50);
  const [leadsMonthly, setLeadsMonthly] = useState<number>(20);
  const [enquiriesMonthly, setEnquiriesMonthly] = useState<number>(20);
  const [chatThreadsMax, setChatThreadsMax] = useState<number>(50);
  const [teamMembersMax, setTeamMembersMax] = useState<number>(1);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const toggleAccountType = (type: AccountType) => {
    if (targetAccountTypes.includes(type)) {
      setTargetAccountTypes(targetAccountTypes.filter((t) => t !== type));
    } else {
      setTargetAccountTypes([...targetAccountTypes, type]);
    }
  };

  const addFeatureTag = () => {
    if (featureTagInput.trim() && !features.includes(featureTagInput.trim())) {
      setFeatures([...features, featureTagInput.trim()]);
      setFeatureTagInput('');
    }
  };

  const removeFeatureTag = (tag: string) => {
    setFeatures(features.filter((f) => f !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setError('Package name and slug are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await createPackage({
        name,
        slug,
        description,
        price,
        currency: 'INR',
        billingPeriod,
        whatsappNumber: whatsappNumber.trim() || undefined,
        callNumber: callNumber.trim() || undefined,
        targetAccountTypes,
        eligibleUserTypes,
        durationPrices,
        recommended,
        isFree,
        freeTrialMaxSlots,
        isPopular,
        isDefault,
        isActive: true,
        features,
        permissions: [],
        limits: {
          propertyListingsMax,
          propertyListings: propertyListingsMax,
          projectListings: projectListingsMax,
          projectListingsMax,
          featuredListingsMax,
          propertyViewsMonthly,
          savedItemsMax,
          leadsMonthly,
          enquiriesMonthly,
          chatThreadsMax,
          teamMembersMax,
          teamMembers: teamMembersMax,
        },
      });

      router.push('/packages');
    } catch (err: any) {
      setError(err.message || 'Failed to create package');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-casa-surface p-6 rounded-2xl border border-casa-border-light shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/packages"
            className="p-2 rounded-xl border border-casa-border-light text-casa-text-secondary hover:bg-casa-subtle transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-casa-text-primary">Create Entitlement Package</h1>
            <p className="text-xs text-casa-text-muted">
              Configure package tier pricing, monthly usage limits, quotas, and feature entitlements
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-casa-brand text-white shadow-subtle hover:bg-casa-brand/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Creating Package...' : 'Save & Publish Package'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-casa-surface rounded-2xl border border-casa-border-light p-6 space-y-4">
        <h2 className="text-sm font-bold text-casa-text-primary flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-casa-brand" />
          <span>1. Package Identity & Pricing</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">Package Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Agency Pro Tier"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:border-casa-brand focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">System Slug *</label>
            <input
              type="text"
              required
              placeholder="e.g. agency-pro"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-mono focus:border-casa-brand focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">Description</label>
            <input
              type="text"
              placeholder="Explain who this plan is tailored for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:border-casa-brand focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">Price (INR ₹) *</label>
            <input
              type="number"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-mono focus:border-casa-brand focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">Billing Cycle</label>
            <select
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value as BillingPeriod)}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:border-casa-brand focus:outline-hidden font-mono"
            >
              <option value="1_MONTH">1 Month (30 Days)</option>
              <option value="60_DAYS">60 Days (2 Months)</option>
              <option value="90_DAYS">90 Days (3 Months / Quarter)</option>
              <option value="6_MONTHS">6 Months (Half-Yearly)</option>
              <option value="1_YEAR">1 Year (365 Days Annual)</option>
              <option value="MONTHLY">Monthly Standard (30 Days)</option>
              <option value="FREE">Free Trial / Community</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-casa-text-secondary flex items-center gap-1.5 mb-1">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              Sales WhatsApp Number for this Plan
            </label>
            <input
              type="text"
              placeholder="e.g. +91 98765 43210 (Leave blank for system default)"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-mono focus:border-emerald-500 focus:outline-hidden"
            />
            <span className="text-[10px] text-casa-text-muted mt-1 block">
              Directs WhatsApp inquiries for this plan to this number.
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-casa-text-secondary flex items-center gap-1.5 mb-1">
              <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
              Sales Call Number for this Plan
            </label>
            <input
              type="text"
              placeholder="e.g. +91 98765 43210 (Leave blank for system default)"
              value={callNumber}
              onChange={(e) => setCallNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-mono focus:border-blue-500 focus:outline-hidden"
            />
            <span className="text-[10px] text-casa-text-muted mt-1 block">
              Directs Phone Call inquiries for this plan to this number.
            </span>
          </div>
        </div>

        {/* Target Account Types */}
        <div>
          <label className="block text-xs font-bold text-casa-text-secondary mb-2">
            Applicable Account Types
          </label>
          <div className="flex flex-wrap gap-2">
            {ACCOUNT_TYPES.map((type) => {
              const selected = targetAccountTypes.includes(type);
              return (
                <button
                  type="button"
                  key={type}
                  onClick={() => toggleAccountType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors ${
                    selected
                      ? 'bg-casa-brand text-white shadow-2xs'
                      : 'bg-casa-canvas text-casa-text-secondary border border-casa-border-light hover:bg-casa-subtle'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Eligible User Types on Pricing Page */}
        <div>
          <label className="block text-xs font-bold text-casa-text-secondary mb-2">
            Eligible User Types on Public Pricing Page
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'builder', label: 'Builder / Developer' },
              { id: 'broker', label: 'Broker' },
              { id: 'agent', label: 'Agent' },
              { id: 'property-owner', label: 'Property Owner' },
            ].map((ut) => {
              const checked = eligibleUserTypes.includes(ut.id);
              return (
                <button
                  type="button"
                  key={ut.id}
                  onClick={() => {
                    if (checked) {
                      setEligibleUserTypes(eligibleUserTypes.filter((t) => t !== ut.id));
                    } else {
                      setEligibleUserTypes([...eligibleUserTypes, ut.id]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    checked
                      ? 'bg-casa-brand text-white shadow-2xs'
                      : 'bg-casa-canvas text-casa-text-secondary border border-casa-border-light hover:bg-casa-subtle'
                  }`}
                >
                  {ut.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Flags */}
        <div className="flex flex-wrap items-center gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-casa-text-primary">
            <input
              type="checkbox"
              checked={isPopular}
              onChange={(e) => setIsPopular(e.target.checked)}
              className="rounded text-casa-brand focus:ring-casa-brand"
            />
            <span>Highlight as "Popular" Plan</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-casa-text-primary">
            <input
              type="checkbox"
              checked={recommended}
              onChange={(e) => setRecommended(e.target.checked)}
              className="rounded text-casa-brand focus:ring-casa-brand"
            />
            <span className="font-semibold text-casa-brand">Highlight as "Recommended / Best Value" Plan</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-casa-text-primary">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded text-casa-brand focus:ring-casa-brand"
            />
            <span>Assign as Default Free Tier</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-casa-text-primary">
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="rounded text-casa-brand focus:ring-casa-brand"
            />
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">Introductory Free Plan (3 Months Validity)</span>
          </label>
        </div>

        {isFree && (
          <div className="flex items-center gap-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200 mb-1">
                Max Free Trial Slots
              </label>
              <input
                type="number"
                min="1"
                value={freeTrialMaxSlots}
                onChange={(e) => setFreeTrialMaxSlots(Number(e.target.value))}
                className="w-24 px-2.5 py-1 text-xs bg-white dark:bg-zinc-900 border border-amber-300 rounded-lg text-casa-text-primary font-mono"
              />
            </div>
            <span className="text-[11px] text-amber-800 dark:text-amber-300">
              Only the first {freeTrialMaxSlots} eligible registered users can claim this free introductory plan.
            </span>
          </div>
        )}
      </div>

      {/* Duration-Wise Pricing Configuration */}
      <div className="bg-casa-surface rounded-2xl border border-casa-border-light p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-casa-text-primary">2. Duration Pricing Structure (Months)</h2>
          <p className="text-xs text-casa-text-muted">
            Configure specific plan pricing for 1, 2, 3, 6, and 12 months. The system uses these authoritative rates instead of multiplying the monthly price.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-casa-border-light text-casa-text-muted uppercase text-[10px]">
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Configured Price (₹)</th>
                <th className="py-2.5 px-3">Ref. Monthly Price (₹)</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-casa-border-light/60">
              {durationPrices.map((dp, idx) => {
                const label =
                  dp.durationMonths === 1
                    ? '1 Month (Monthly)'
                    : dp.durationMonths === 2
                    ? '2 Months'
                    : dp.durationMonths === 3
                    ? '3 Months (Quarterly)'
                    : dp.durationMonths === 6
                    ? '6 Months (Half-Yearly)'
                    : '1 Year (12 Months Annual)';
                return (
                  <tr key={dp.durationMonths}>
                    <td className="py-2.5 px-3 font-semibold text-casa-text-primary">{label}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1 font-mono">
                        <span>₹</span>
                        <input
                          type="number"
                          min="0"
                          value={dp.amount}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setDurationPrices((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, amount: val } : p)),
                            );
                          }}
                          className="w-32 px-2.5 py-1 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary font-mono focus:border-casa-brand focus:outline-hidden"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1 font-mono">
                        <span>₹</span>
                        <input
                          type="number"
                          min="0"
                          value={dp.referenceMonthlyPrice ?? price}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setDurationPrices((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, referenceMonthlyPrice: val } : p)),
                            );
                          }}
                          className="w-32 px-2.5 py-1 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary font-mono focus:border-casa-brand focus:outline-hidden"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDurationPrices((prev) =>
                            prev.map((p, i) => (i === idx ? { ...p, isActive: p.isActive === false ? true : false } : p)),
                          );
                        }}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                          dp.isActive !== false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-zinc-100 text-zinc-500 border-zinc-300'
                        }`}
                      >
                        {dp.isActive !== false ? 'ACTIVE' : 'DISABLED'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hard Limits & Quotas */}
      <div className="bg-casa-surface rounded-2xl border border-casa-border-light p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-casa-text-primary">3. Hard Usage Limits & Quotas</h2>
          <p className="text-xs text-casa-text-muted">
            Enter numerical caps for each resource. Enter <strong>-1</strong> for Unlimited access.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">
              Monthly Property Views (-1 = ∞)
            </label>
            <input
              type="number"
              min="-1"
              value={propertyViewsMonthly}
              onChange={(e) => setPropertyViewsMonthly(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-mono focus:border-casa-brand focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">
              Active Property Listings (-1 = ∞)
            </label>
            <input
              type="number"
              min="-1"
              value={propertyListingsMax}
              onChange={(e) => setPropertyListingsMax(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-mono focus:border-casa-brand focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">
              Active Project Listings (-1 = ∞)
            </label>
            <input
              type="number"
              min="-1"
              value={projectListingsMax}
              onChange={(e) => setProjectListingsMax(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-mono focus:border-casa-brand focus:outline-hidden"
            />
            <span className="text-[10px] text-casa-text-muted mt-0.5 block">Shared for Builder & Broker accounts</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">
              Featured Property Slots
            </label>
            <input
              type="number"
              min="0"
              value={featuredListingsMax}
              onChange={(e) => setFeaturedListingsMax(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-mono focus:border-casa-brand focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">
              Monthly Leads Quota (-1 = ∞)
            </label>
            <input
              type="number"
              min="-1"
              value={leadsMonthly}
              onChange={(e) => setLeadsMonthly(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-mono focus:border-casa-brand focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">
              Monthly Enquiries Quota (-1 = ∞)
            </label>
            <input
              type="number"
              min="-1"
              value={enquiriesMonthly}
              onChange={(e) => setEnquiriesMonthly(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-mono focus:border-casa-brand focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">
              Max Active Chat Threads
            </label>
            <input
              type="number"
              min="-1"
              value={chatThreadsMax}
              onChange={(e) => setChatThreadsMax(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-mono focus:border-casa-brand focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">
              Max Saved Items / Bookmarks
            </label>
            <input
              type="number"
              min="0"
              value={savedItemsMax}
              onChange={(e) => setSavedItemsMax(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-mono focus:border-casa-brand focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">
              Max Team Member Sub-accounts
            </label>
            <input
              type="number"
              min="1"
              value={teamMembersMax}
              onChange={(e) => setTeamMembersMax(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-mono focus:border-casa-brand focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Feature Bullet Points */}
      <div className="bg-casa-surface rounded-2xl border border-casa-border-light p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-casa-text-primary">3. Marketing Features & Highlights</h2>
          <p className="text-xs text-casa-text-muted">Display bullet points shown on the public pricing table</p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Dedicated Account Manager"
            value={featureTagInput}
            onChange={(e) => setFeatureTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addFeatureTag();
              }
            }}
            className="flex-1 px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:border-casa-brand focus:outline-hidden"
          />
          <button
            type="button"
            onClick={addFeatureTag}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-casa-subtle hover:bg-casa-canvas text-casa-text-primary"
          >
            Add Feature
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {features.map((feat) => (
            <span
              key={feat}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-casa-canvas border border-casa-border-light text-casa-text-primary"
            >
              <span>{feat}</span>
              <button
                type="button"
                onClick={() => removeFeatureTag(feat)}
                className="text-casa-text-muted hover:text-red-500"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>
    </form>
  );
}
