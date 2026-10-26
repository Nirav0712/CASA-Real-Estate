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
import { getPackages, deletePackage, updatePackage, getAdminFreeTrialStatus, configureFreeTrial } from '@/services/entitlements-service';
import { useAdminAuth } from '@/contexts/auth-context';
import { PackageRecord } from '@/types';

export default function PackagesManagementPage() {
  const { adminUser } = useAdminAuth();
  const isSuperAdmin = adminUser?.role === 'SUPER_ADMIN' || adminUser?.platformRole === 'SUPER_ADMIN';

  const [packages, setPackages] = useState<PackageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [trialStatus, setTrialStatus] = useState<{
    maxSlots: number;
    claimedSlots: number;
    remainingSlots: number;
    isAvailable: boolean;
    validity: string;
  } | null>(null);
  const [configuringTrial, setConfiguringTrial] = useState(false);

  const fetchPackagesList = async () => {
    try {
      setLoading(true);
      const [data, trial] = await Promise.all([
        getPackages(),
        getAdminFreeTrialStatus().catch(() => null),
      ]);
      setPackages(data);
      if (trial) setTrialStatus(trial);
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

  const handleToggleActive = async (pkg: PackageRecord) => {
    if (!isSuperAdmin) {
      alert('Permission denied: Only Super Admins can activate or deactivate plans.');
      return;
    }
    const pkgId = pkg.id || pkg._id || '';
    try {
      setActionLoading(pkgId);
      await updatePackage(pkgId, { isActive: !pkg.isActive });
      setPackages((prev) =>
        prev.map((p) => ((p.id || p._id) === pkgId ? { ...p, isActive: !p.isActive } : p)),
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update package status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!isSuperAdmin) {
      alert('Permission denied: Only Super Admins can delete plans.');
      return;
    }
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
          {isSuperAdmin && (
            <Link
              href="/packages/create"
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-casa-brand text-white shadow-subtle hover:bg-casa-brand/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Package</span>
            </Link>
          )}
        </div>
      </div>

      {/* Free Trial 50-Slot Monitor Banner */}
      {trialStatus && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-800/60 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-subtle flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-casa-text-primary">
                  Introductory 3 Months Free Plan (First {trialStatus.maxSlots} Users)
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  trialStatus.isAvailable
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                }`}>
                  {trialStatus.isAvailable ? `${trialStatus.remainingSlots} SLOTS LEFT` : 'ALL SLOTS CLAIMED'}
                </span>
              </div>
              <p className="text-xs text-casa-text-muted mt-0.5">
                Eligible Builders, Brokers, and Agents claim 90-day full platform access. Slots are consumed atomically on registration/claim.
              </p>
              {/* Progress bar */}
              <div className="mt-2.5 flex items-center gap-3">
                <div className="w-48 md:w-64 h-2 bg-amber-200/50 dark:bg-amber-950/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((trialStatus.claimedSlots / (trialStatus.maxSlots || 50)) * 100))}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] font-mono font-bold text-casa-text-secondary">
                  {trialStatus.claimedSlots} / {trialStatus.maxSlots} claimed ({trialStatus.remainingSlots} available)
                </span>
              </div>
            </div>
          </div>

          {isSuperAdmin && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={async () => {
                  const input = prompt('Enter new Max Free Trial Slots limit:', String(trialStatus.maxSlots));
                  if (!input || isNaN(Number(input))) return;
                  try {
                    const res = await configureFreeTrial({ maxSlots: Number(input) });
                    if (res?.freeTrialStatus) setTrialStatus(res.freeTrialStatus);
                    alert('Max slots updated successfully.');
                  } catch (e: any) {
                    alert(e.message || 'Failed to update slots');
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-900 text-amber-900 dark:text-amber-200 hover:bg-amber-50 transition-colors cursor-pointer"
              >
                Change Max Slots
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm('Are you sure you want to RESET claimed free trial slots count to 0?')) return;
                  try {
                    const res = await configureFreeTrial({ resetClaimed: true });
                    if (res?.freeTrialStatus) setTrialStatus(res.freeTrialStatus);
                    alert('Claimed slots count reset to 0.');
                  } catch (e: any) {
                    alert(e.message || 'Failed to reset claimed slots');
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
              >
                Reset Slots Count
              </button>
            </div>
          )}
        </div>
      )}

      {!isSuperAdmin && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>Viewing packages in read-only mode. Only authenticated Super Admins can create, modify, or activate plans.</span>
        </div>
      )}

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
            const limits: any = pkg.limits || {};
            const propertyCap = limits.propertyListingsMax ?? limits.propertyListings ?? -1;
            const projectCap = limits.projectListings ?? limits.projectListingsMax ?? -1;
            const teamCap = limits.teamMembersMax ?? limits.teamMembers ?? 1;

            return (
              <div
                key={pkgId}
                className={`bg-casa-surface rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                  pkg.recommended
                    ? 'border-amber-400 dark:border-amber-500 shadow-md ring-1 ring-amber-400/30'
                    : pkg.isPopular
                    ? 'border-casa-brand shadow-subtle'
                    : 'border-casa-border-light hover:shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="font-bold text-sm text-casa-text-primary">{pkg.name}</h3>
                        {pkg.recommended && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            RECOMMENDED
                          </span>
                        )}
                        {pkg.isFree && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            3 MO FREE
                          </span>
                        )}
                        {pkg.isDefault && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-casa-text-muted font-mono">{pkg.slug}</span>
                    </div>

                    <button
                      onClick={() => handleToggleActive(pkg)}
                      disabled={actionLoading === pkgId}
                      title={`Click to ${pkg.isActive ? 'Deactivate' : 'Activate'} plan`}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                        pkg.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-300 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${pkg.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                      <span>{pkg.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-casa-text-secondary line-clamp-2 mb-3">
                    {pkg.description || 'Standard plan tier for marketplace members.'}
                  </p>

                  {/* Price & Billing Cycle */}
                  <div className="mb-3">
                    <span className="text-2xl font-bold text-casa-text-primary">
                      {pkg.isFree || pkg.price === 0 ? 'FREE' : `₹${pkg.price.toLocaleString('en-IN')}`}
                    </span>
                    <span className="text-xs text-casa-text-muted font-medium ml-1">
                      /{' '}
                      {pkg.isFree
                        ? '3 Months Free'
                        : pkg.billingPeriod === '1_MONTH'
                        ? '1 Month (30 Days)'
                        : pkg.billingPeriod === '60_DAYS'
                        ? '60 Days'
                        : pkg.billingPeriod === '90_DAYS'
                        ? '90 Days'
                        : pkg.billingPeriod === '6_MONTHS'
                        ? '6 Months'
                        : pkg.billingPeriod === '1_YEAR'
                        ? '1 Year'
                        : pkg.billingPeriod.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>

                  {/* Duration Pricing Pills */}
                  {Array.isArray(pkg.durationPrices) && pkg.durationPrices.length > 0 && (
                    <div className="mb-3 p-2 rounded-xl bg-casa-canvas/60 border border-casa-border-light/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-casa-text-muted block mb-1.5">
                        Duration Rates:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {pkg.durationPrices.map((dp) => (
                          <span
                            key={dp.durationMonths}
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-casa-surface border border-casa-border-light text-casa-text-primary"
                          >
                            <strong>{dp.durationMonths === 12 ? '1Yr' : `${dp.durationMonths}M`}:</strong> ₹{dp.amount.toLocaleString('en-IN')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Limits Checklist */}
                  <div className="space-y-1.5 py-3 border-y border-casa-border-light/60 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-casa-text-muted">Active Properties Cap:</span>
                      <span className="font-bold text-casa-text-primary font-mono">
                        {propertyCap === -1 ? 'Unlimited (∞)' : `${propertyCap} properties`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-casa-text-muted">Active Projects Cap:</span>
                      <span className="font-bold text-casa-brand font-mono">
                        {projectCap === -1 ? 'Unlimited (∞)' : `${projectCap} projects`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-casa-text-muted">Team Member Seats:</span>
                      <span className="font-bold text-casa-text-primary font-mono">
                        {teamCap} {teamCap === 1 ? 'user' : 'users (shared)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-casa-text-muted">Monthly Lead Quota:</span>
                      <span className="font-bold text-casa-text-primary font-mono">
                        {limits.leadsMonthly === -1 ? 'Unlimited (∞)' : `${limits.leadsMonthly || 0} leads`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-casa-text-muted">Target Account Types:</span>
                      <span className="font-semibold text-[10px] text-casa-brand font-mono">
                        {pkg.eligibleUserTypes?.join(', ') || pkg.targetAccountTypes?.join(', ') || 'ALL'}
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
                    {isSuperAdmin ? <Edit2 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{isSuperAdmin ? 'Configure' : 'View Details'}</span>
                  </Link>

                  {isSuperAdmin && (
                    <button
                      onClick={() => handleDelete(pkgId, pkg.name)}
                      disabled={actionLoading === pkgId}
                      className="p-1.5 rounded-lg text-casa-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      title="Delete Package"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
