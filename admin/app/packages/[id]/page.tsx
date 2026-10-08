'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, CreditCard } from 'lucide-react';
import { getPackage, updatePackage } from '@/services/entitlements-service';
import { PackageRecord, BillingPeriod, AccountType } from '@/types';

const ACCOUNT_TYPES: AccountType[] = [
  'AGENT',
  'BROKER',
  'DEVELOPER',
  'PROPERTY_OWNER',
  'BUYER',
  'TENANT',
];

export default function EditPackagePage() {
  const router = useRouter();
  const params = useParams();
  const pkgId = params.id as string;

  const [pkg, setPkg] = useState<PackageRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('MONTHLY');
  const [targetAccountTypes, setTargetAccountTypes] = useState<AccountType[]>([]);
  const [isPopular, setIsPopular] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [featureTagInput, setFeatureTagInput] = useState('');
  const [features, setFeatures] = useState<string[]>([]);

  // Limits
  const [propertyListingsMax, setPropertyListingsMax] = useState<number>(10);
  const [featuredListingsMax, setFeaturedListingsMax] = useState<number>(1);
  const [propertyViewsMonthly, setPropertyViewsMonthly] = useState<number>(50);
  const [savedItemsMax, setSavedItemsMax] = useState<number>(50);
  const [leadsMonthly, setLeadsMonthly] = useState<number>(20);
  const [enquiriesMonthly, setEnquiriesMonthly] = useState<number>(20);
  const [chatThreadsMax, setChatThreadsMax] = useState<number>(50);
  const [teamMembersMax, setTeamMembersMax] = useState<number>(1);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getPackage(pkgId);
        setPkg(data);
        setName(data.name);
        setDescription(data.description || '');
        setPrice(data.price);
        setBillingPeriod(data.billingPeriod);
        setTargetAccountTypes(data.targetAccountTypes || []);
        setIsPopular(data.isPopular);
        setIsDefault(data.isDefault);
        setIsActive(data.isActive);
        setFeatures(data.features || []);

        if (data.limits) {
          setPropertyListingsMax(data.limits.propertyListingsMax);
          setFeaturedListingsMax(data.limits.featuredListingsMax);
          setPropertyViewsMonthly(data.limits.propertyViewsMonthly);
          setSavedItemsMax(data.limits.savedItemsMax);
          setLeadsMonthly(data.limits.leadsMonthly);
          setEnquiriesMonthly(data.limits.enquiriesMonthly);
          setChatThreadsMax(data.limits.chatThreadsMax);
          setTeamMembersMax(data.limits.teamMembersMax);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load package');
      } finally {
        setLoading(false);
      }
    }
    if (pkgId) load();
  }, [pkgId]);

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
    if (!name.trim()) {
      setError('Package name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await updatePackage(pkgId, {
        name,
        description,
        price,
        billingPeriod,
        targetAccountTypes,
        isPopular,
        isDefault,
        isActive,
        features,
        limits: {
          propertyListingsMax,
          featuredListingsMax,
          propertyViewsMonthly,
          savedItemsMax,
          leadsMonthly,
          enquiriesMonthly,
          chatThreadsMax,
          teamMembersMax,
        },
      });

      setSuccess('Package updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update package');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-casa-text-muted">Loading package details...</div>;
  }

  if (!pkg) {
    return <div className="p-8 text-center text-xs text-casa-text-muted">Package not found.</div>;
  }

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
            <h1 className="text-xl font-bold text-casa-text-primary">Edit Package: {pkg.name}</h1>
            <p className="text-xs text-casa-text-muted font-mono">Slug: {pkg.slug}</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-casa-brand text-white shadow-subtle hover:bg-casa-brand/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Updating...' : 'Save Changes'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-700 text-xs">
          {success}
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:border-casa-brand focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">Status</label>
            <select
              value={isActive ? 'true' : 'false'}
              onChange={(e) => setIsActive(e.target.value === 'true')}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:border-casa-brand focus:outline-hidden font-mono"
            >
              <option value="true">ACTIVE (Available for purchase)</option>
              <option value="false">DISABLED (Hidden from catalog)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">Description</label>
            <input
              type="text"
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
              <option value="MONTHLY">MONTHLY (Every 30 days)</option>
              <option value="QUARTERLY">QUARTERLY (Every 90 days)</option>
              <option value="ANNUALLY">ANNUALLY (365 days)</option>
              <option value="LIFETIME">LIFETIME (Non-expiring)</option>
            </select>
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

        {/* Flags */}
        <div className="flex items-center gap-6 pt-2">
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
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded text-casa-brand focus:ring-casa-brand"
            />
            <span>Assign as Default Free Tier</span>
          </label>
        </div>
      </div>

      {/* Hard Limits & Quotas */}
      <div className="bg-casa-surface rounded-2xl border border-casa-border-light p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-casa-text-primary">2. Hard Usage Limits & Quotas</h2>
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
