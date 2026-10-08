'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Sparkles,
  Layers,
  Search,
} from 'lucide-react';
import { getPackages, deletePackage } from '@/services/entitlements-service';
import { PackageRecord } from '@/types';

export default function PackagesManagementPage() {
  const [packages, setPackages] = useState<PackageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPackagesList = async () => {
    try {
      setLoading(true);
      const data = await getPackages();
      setPackages(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackagesList();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete package "${name}"?`)) return;
    try {
      setActionLoading(id);
      await deletePackage(id);
      await fetchPackagesList();
    } catch (err: any) {
      alert(err.message || 'Failed to delete package');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = packages.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      p.targetAccountTypes.some((t) => t.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-casa-surface p-6 rounded-2xl border border-casa-border-light shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-casa-brand-subtle text-casa-brand">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-casa-text-primary">Packages & Entitlement Plans</h1>
            <p className="text-xs text-casa-text-muted">
              Configure subscription tiers, property view quotas, listing caps, lead limits, and pricing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/usage"
            className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-casa-border-light text-casa-text-secondary hover:bg-casa-subtle transition-colors"
          >
            Monitor Usage & Quotas
          </Link>
          <Link
            href="/packages/create"
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-casa-brand text-white shadow-subtle hover:bg-casa-brand/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Package</span>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-casa-text-muted" />
          <input
            type="text"
            placeholder="Search packages by name or account type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-hidden focus:border-casa-brand"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Packages Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-casa-text-muted">Loading package plans...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-xs text-casa-text-muted bg-casa-surface rounded-2xl border border-casa-border-light">
          No packages found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((pkg) => {
            const pkgId = pkg.id || pkg._id || '';
            return (
              <div
                key={pkgId}
                className={`bg-casa-surface rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                  pkg.isPopular
                    ? 'border-casa-brand shadow-subtle'
                    : 'border-casa-border-light hover:shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-casa-text-primary">{pkg.name}</h3>
                        {pkg.isDefault && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            DEFAULT
                          </span>
                        )}
                        {pkg.isPopular && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            POPULAR
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-casa-text-muted font-mono">{pkg.slug}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        pkg.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                      }`}
                    >
                      {pkg.isActive ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>

                  <p className="text-xs text-casa-text-secondary line-clamp-2 mb-3">
                    {pkg.description || 'Standard plan tier for marketplace members.'}
                  </p>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-casa-text-primary">
                      {pkg.price === 0 ? 'FREE' : `₹${pkg.price.toLocaleString('en-IN')}`}
                    </span>
                    {pkg.price > 0 && (
                      <span className="text-xs text-casa-text-muted font-medium">
                        {' '}
                        / {pkg.billingPeriod.toLowerCase()}
                      </span>
                    )}
                  </div>

                  {/* Limits Checklist */}
                  <div className="space-y-1.5 py-3 border-y border-casa-border-light/60 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-casa-text-muted">Monthly Property Views:</span>
                      <span className="font-bold text-casa-text-primary font-mono">
                        {pkg.limits.propertyViewsMonthly === -1
                          ? 'Unlimited (∞)'
                          : `${pkg.limits.propertyViewsMonthly} views`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-casa-text-muted">Active Listings Max:</span>
                      <span className="font-bold text-casa-text-primary font-mono">
                        {pkg.limits.propertyListingsMax === -1
                          ? 'Unlimited (∞)'
                          : `${pkg.limits.propertyListingsMax} listings`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-casa-text-muted">Featured Listings:</span>
                      <span className="font-bold text-casa-text-primary font-mono">
                        {pkg.limits.featuredListingsMax} slots
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-casa-text-muted">Monthly Lead Quota:</span>
                      <span className="font-bold text-casa-text-primary font-mono">
                        {pkg.limits.leadsMonthly === -1 ? 'Unlimited (∞)' : `${pkg.limits.leadsMonthly} leads`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-casa-text-muted">Target Account Types:</span>
                      <span className="font-semibold text-[10px] text-casa-brand font-mono">
                        {pkg.targetAccountTypes?.join(', ') || 'ALL'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action buttons */}
                <div className="pt-4 flex items-center justify-end gap-2 mt-2">
                  <Link
                    href={`/packages/${pkgId}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-casa-subtle hover:bg-casa-canvas text-casa-text-primary transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Configure</span>
                  </Link>

                  <button
                    onClick={() => handleDelete(pkgId, pkg.name)}
                    disabled={actionLoading === pkgId}
                    className="p-1.5 rounded-lg text-casa-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
