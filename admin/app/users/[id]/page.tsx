'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Shield,
  CreditCard,
  Sparkles,
  Save,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  getRoles,
  getPackages,
  getPermissions,
  getUserOverrides,
  updateUserOverrides,
  addBonusCredits,
  resetUserUsage,
} from '@/services/entitlements-service';
import { RoleRecord, PackageRecord, PermissionGroup, UserOverrides } from '@/types';

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;

  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [packages, setPackages] = useState<PackageRecord[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [overrides, setOverrides] = useState<UserOverrides | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [grantedPerms, setGrantedPerms] = useState<string[]>([]);
  const [deniedPerms, setDeniedPerms] = useState<string[]>([]);
  const [bonusViews, setBonusViews] = useState<number>(0);
  const [bonusListings, setBonusListings] = useState<number>(0);
  const [bonusLeads, setBonusLeads] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'entitlements' | 'permissions' | 'bonus'>('entitlements');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [rList, pList, perms, userOvr] = await Promise.all([
          getRoles(),
          getPackages(),
          getPermissions(),
          getUserOverrides(userId),
        ]);

        setRoles(rList);
        setPackages(pList);
        setPermissionGroups(perms);
        setOverrides(userOvr);

        setSelectedRoleId(userOvr.customRoleId || '');
        setSelectedPackageId(userOvr.activePackageId || '');
        setGrantedPerms(userOvr.grantedPermissions || []);
        setDeniedPerms(userOvr.deniedPermissions || []);
        setBonusViews(userOvr.bonusLimits?.propertyViewsBonus || 0);
        setBonusListings(userOvr.bonusLimits?.propertyListingsBonus || 0);
        setBonusLeads(userOvr.bonusLimits?.leadsBonus || 0);
      } catch (err: any) {
        setError(err.message || 'Failed to load user configuration');
      } finally {
        setLoading(false);
      }
    }
    if (userId) loadData();
  }, [userId]);

  const handleSaveOverrides = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await updateUserOverrides(userId, {
        customRoleId: selectedRoleId || undefined,
        activePackageId: selectedPackageId || undefined,
        grantedPermissions: grantedPerms,
        deniedPermissions: deniedPerms,
        bonusLimits: {
          propertyViewsBonus: bonusViews,
          propertyListingsBonus: bonusListings,
          leadsBonus: bonusLeads,
        },
      });

      setSuccess('User entitlements and overrides saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update overrides');
    } finally {
      setSaving(false);
    }
  };

  const toggleGrantedPerm = (perm: string) => {
    if (grantedPerms.includes(perm)) {
      setGrantedPerms(grantedPerms.filter((p) => p !== perm));
    } else {
      setGrantedPerms([...grantedPerms, perm]);
      // Remove from denied if present
      setDeniedPerms(deniedPerms.filter((p) => p !== perm));
    }
  };

  const toggleDeniedPerm = (perm: string) => {
    if (deniedPerms.includes(perm)) {
      setDeniedPerms(deniedPerms.filter((p) => p !== perm));
    } else {
      setDeniedPerms([...deniedPerms, perm]);
      // Remove from granted if present
      setGrantedPerms(grantedPerms.filter((p) => p !== perm));
    }
  };

  const handleResetUsage = async (type: 'views' | 'all') => {
    if (!window.confirm(`Reset usage (${type}) for this user?`)) return;
    try {
      await resetUserUsage(userId, type);
      alert('Usage reset successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to reset usage');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-casa-text-muted">Loading user profile...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-casa-surface p-6 rounded-2xl border border-casa-border-light shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/users"
            className="p-2 rounded-xl border border-casa-border-light text-casa-text-secondary hover:bg-casa-subtle transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-casa-text-primary">User Entitlements & Overrides</h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-casa-canvas text-casa-text-muted">
                {userId}
              </span>
            </div>
            <p className="text-xs text-casa-text-muted">
              Configure custom dynamic role assignments, plan overrides, permission exceptions, and bonus quotas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveOverrides}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-casa-brand text-white shadow-subtle hover:bg-casa-brand/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
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

      {/* Navigation Tabs */}
      <div className="flex border-b border-casa-border-light gap-2">
        <button
          onClick={() => setActiveTab('entitlements')}
          className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'entitlements'
              ? 'border-casa-brand text-casa-brand'
              : 'border-transparent text-casa-text-secondary hover:text-casa-text-primary'
          }`}
        >
          Role & Package Assignment
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'permissions'
              ? 'border-casa-brand text-casa-brand'
              : 'border-transparent text-casa-text-secondary hover:text-casa-text-primary'
          }`}
        >
          Permission Overrides ({grantedPerms.length} Granted / {deniedPerms.length} Denied)
        </button>
        <button
          onClick={() => setActiveTab('bonus')}
          className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'bonus'
              ? 'border-casa-brand text-casa-brand'
              : 'border-transparent text-casa-text-secondary hover:text-casa-text-primary'
          }`}
        >
          Bonus Limits & Quota Reset
        </button>
      </div>

      {/* Tab 1: Role & Package */}
      {activeTab === 'entitlements' && (
        <div className="bg-casa-surface rounded-2xl border border-casa-border-light p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-casa-text-secondary mb-2 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-casa-brand" />
                <span>Assigned Role (System or Custom)</span>
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:border-casa-brand font-mono"
              >
                <option value="">Default Baseline Role (Computed from AccountType)</option>
                {roles.map((r) => (
                  <option key={r.id || r._id} value={r.id || r._id}>
                    {r.name} ({r.slug}) [{r.isSystemRole ? 'SYSTEM' : 'CUSTOM'}]
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-casa-text-muted mt-1.5">
                Assigning a custom role overrides the default system permission matrix for this user.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-casa-text-secondary mb-2 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-casa-brand" />
                <span>Active Entitlement Package Plan</span>
              </label>
              <select
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:border-casa-brand font-mono"
              >
                <option value="">Default Free Tier</option>
                {packages.map((pkg) => (
                  <option key={pkg.id || pkg._id} value={pkg.id || pkg._id}>
                    {pkg.name} — ₹{pkg.price} / {pkg.billingPeriod.toLowerCase()}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-casa-text-muted mt-1.5">
                Determines monthly property view limits, active listing caps, and lead allocations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Specific Permission Overrides */}
      {activeTab === 'permissions' && (
        <div className="bg-casa-surface rounded-2xl border border-casa-border-light p-6 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-casa-text-primary">Explicit User Permission Overrides</h2>
            <p className="text-xs text-casa-text-muted">
              Grant specific permissions even if the role lacks them, or explicitly deny permissions to restrict capabilities.
            </p>
          </div>

          <div className="space-y-6">
            {permissionGroups.map((group) => (
              <div key={group.group} className="p-4 rounded-xl bg-casa-canvas border border-casa-border-light space-y-3">
                <div className="border-b border-casa-border-light/60 pb-2">
                  <span className="text-xs font-bold text-casa-text-primary">{group.label}</span>
                  <p className="text-[11px] text-casa-text-muted">{group.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {group.permissions.map((perm) => {
                    const isGranted = grantedPerms.includes(perm.key);
                    const isDenied = deniedPerms.includes(perm.key);

                    return (
                      <div
                        key={perm.key}
                        className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                          isGranted
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                            : isDenied
                            ? 'bg-red-500/10 border-red-500 text-red-700 dark:text-red-300'
                            : 'bg-casa-surface border-casa-border-light text-casa-text-secondary'
                        }`}
                      >
                        <div>
                          <span className="font-semibold text-casa-text-primary block">{perm.label}</span>
                          <span className="font-mono text-[10px] text-casa-text-muted block">{perm.key}</span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-casa-border-light/40">
                          <button
                            type="button"
                            onClick={() => toggleGrantedPerm(perm.key)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isGranted
                                ? 'bg-emerald-600 text-white'
                                : 'bg-casa-canvas text-emerald-600 border border-emerald-300'
                            }`}
                          >
                            + GRANT
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleDeniedPerm(perm.key)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isDenied
                                ? 'bg-red-600 text-white'
                                : 'bg-casa-canvas text-red-600 border border-red-300'
                            }`}
                          >
                            - DENY
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Bonus Quotas */}
      {activeTab === 'bonus' && (
        <div className="bg-casa-surface rounded-2xl border border-casa-border-light p-6 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-casa-text-primary">Bonus Quotas & Counters</h2>
            <p className="text-xs text-casa-text-muted">
              Allocate extra view/listing/lead credits on top of the base package limit, or clear usage locks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-casa-text-secondary mb-1">
                Property Views Bonus
              </label>
              <input
                type="number"
                min="0"
                value={bonusViews}
                onChange={(e) => setBonusViews(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl font-mono text-casa-text-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-casa-text-secondary mb-1">
                Property Listings Bonus
              </label>
              <input
                type="number"
                min="0"
                value={bonusListings}
                onChange={(e) => setBonusListings(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl font-mono text-casa-text-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-casa-text-secondary mb-1">
                Leads Bonus
              </label>
              <input
                type="number"
                min="0"
                value={bonusLeads}
                onChange={(e) => setBonusLeads(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl font-mono text-casa-text-primary"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-casa-border-light flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleResetUsage('views')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-casa-canvas border border-casa-border-light hover:bg-casa-subtle text-casa-text-primary"
            >
              <RefreshCw className="w-3.5 h-3.5 text-casa-brand" />
              <span>Reset 30-Day View Count</span>
            </button>
            <button
              type="button"
              onClick={() => handleResetUsage('all')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 dark:bg-red-950 border border-red-200 text-red-700 dark:text-red-300 hover:bg-red-100"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset All Usage Counters</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
