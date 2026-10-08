'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { getPermissions, createRole } from '@/services/entitlements-service';
import { PermissionGroup, PlatformRole, AccountType, DataScope } from '@/types';

export default function CreateRolePage() {
  const router = useRouter();
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [platformRole, setPlatformRole] = useState<PlatformRole>('USER');
  const [accountType, setAccountType] = useState<AccountType | ''>('AGENT');
  const [dataScope, setDataScope] = useState<DataScope>('OWN');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [dashboardConfig, setDashboardConfig] = useState({
    canAccessCRM: false,
    canAccessAnalytics: false,
    canAccessSiteVisits: false,
    canAccessLeads: true,
    canAccessTeamManagement: false,
    canAccessMarketing: false,
    canAccessReports: false,
    canAccessBilling: false,
  });

  useEffect(() => {
    async function load() {
      try {
        const groups = await getPermissions();
        setPermissionGroups(groups);
      } catch (err: any) {
        setError(err.message || 'Failed to load permissions catalog');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const togglePermission = (permKey: string) => {
    if (selectedPermissions.includes(permKey)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== permKey));
    } else {
      setSelectedPermissions([...selectedPermissions, permKey]);
    }
  };

  const toggleGroup = (group: PermissionGroup) => {
    const groupKeys = group.permissions.map((p) => p.key);
    const allSelected = groupKeys.every((k) => selectedPermissions.includes(k));

    if (allSelected) {
      setSelectedPermissions(selectedPermissions.filter((p) => !groupKeys.includes(p)));
    } else {
      const merged = Array.from(new Set([...selectedPermissions, ...groupKeys]));
      setSelectedPermissions(merged);
    }
  };

  const handlePlatformRoleChange = (role: PlatformRole) => {
    setPlatformRole(role);
    if (['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(role)) {
      setAccountType('');
    } else if (!accountType) {
      setAccountType('AGENT');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Role name is required');
      return;
    }
    if (!slug.trim()) {
      setError('Role slug is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await createRole({
        name,
        slug,
        description,
        platformRole,
        accountType: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(platformRole) ? null : (accountType as AccountType),
        dataScope,
        permissions: selectedPermissions,
        dashboardConfig,
        isActive: true,
      });

      router.push('/roles');
    } catch (err: any) {
      setError(err.message || 'Failed to create role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-casa-surface p-6 rounded-2xl border border-casa-border-light shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/roles"
            className="p-2 rounded-xl border border-casa-border-light text-casa-text-secondary hover:bg-casa-subtle transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-casa-text-primary">Create Dynamic Role</h1>
            <p className="text-xs text-casa-text-muted">
              Configure baseline identity, data access scoping, module access, and permission grant rules
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-casa-brand text-white shadow-subtle hover:bg-casa-brand/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Creating Role...' : 'Save & Publish Role'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Role Identity Card */}
      <div className="bg-casa-surface rounded-2xl border border-casa-border-light p-6 space-y-4">
        <h2 className="text-sm font-bold text-casa-text-primary flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-casa-brand" />
          <span>1. Role Identity & Scoping</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">Role Display Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Area Manager"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:border-casa-brand focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">System Slug Identifier *</label>
            <input
              type="text"
              required
              placeholder="e.g. senior-area-manager"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-mono focus:border-casa-brand focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">Role Description</label>
            <input
              type="text"
              placeholder="Explain the purpose, responsibilities, and access boundary for this role"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:border-casa-brand focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">Platform Role Axis *</label>
            <select
              value={platformRole}
              onChange={(e) => handlePlatformRoleChange(e.target.value as PlatformRole)}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:border-casa-brand focus:outline-hidden font-mono"
            >
              <option value="USER">USER (Marketplace Participant)</option>
              <option value="MODERATOR">MODERATOR (Platform Operations)</option>
              <option value="ADMIN">ADMIN (Platform Administration)</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN (Platform Authority)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">
              Account Type Axis {['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(platformRole) ? '(Disabled for Platform)' : '*'}
            </label>
            <select
              disabled={['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(platformRole)}
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountType)}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:border-casa-brand focus:outline-hidden font-mono disabled:opacity-50"
            >
              {['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(platformRole) ? (
                <option value="">null (Platform User)</option>
              ) : (
                <>
                  <option value="AGENT">AGENT</option>
                  <option value="BROKER">BROKER</option>
                  <option value="DEVELOPER">DEVELOPER</option>
                  <option value="PROPERTY_OWNER">PROPERTY_OWNER</option>
                  <option value="BUYER">BUYER</option>
                  <option value="TENANT">TENANT</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-casa-text-secondary mb-1">Data Access Scoping Level *</label>
            <select
              value={dataScope}
              onChange={(e) => setDataScope(e.target.value as DataScope)}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:border-casa-brand focus:outline-hidden font-mono"
            >
              <option value="OWN">OWN — Isolated to user's owned records only</option>
              <option value="TEAM">TEAM — Accessible across assigned team members</option>
              <option value="ORGANIZATION">ORGANIZATION — Accessible across whole company/agency</option>
              <option value="ALL">ALL — Global access across entire marketplace</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dashboard Capabilities */}
      <div className="bg-casa-surface rounded-2xl border border-casa-border-light p-6 space-y-4">
        <h2 className="text-sm font-bold text-casa-text-primary">2. Dashboard Module Toggles</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(dashboardConfig).map(([key, val]) => (
            <label
              key={key}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-casa-canvas border border-casa-border-light cursor-pointer select-none hover:border-casa-brand/50 transition-colors"
            >
              <input
                type="checkbox"
                checked={val}
                onChange={(e) =>
                  setDashboardConfig({ ...dashboardConfig, [key]: e.target.checked })
                }
                className="rounded text-casa-brand focus:ring-casa-brand"
              />
              <span className="text-xs font-medium text-casa-text-primary">
                {key.replace('canAccess', '')}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Granular Permission Matrix */}
      <div className="bg-casa-surface rounded-2xl border border-casa-border-light p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-casa-text-primary">3. Granular Permission Matrix</h2>
            <p className="text-xs text-casa-text-muted">
              Select specific permission keys granted to users holding this role
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-casa-brand-subtle text-casa-brand">
            {selectedPermissions.length} Permissions Selected
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-casa-text-muted">Loading permissions matrix...</div>
        ) : (
          <div className="space-y-6">
            {permissionGroups.map((group) => {
              const groupKeys = group.permissions.map((p) => p.key);
              const allSelected = groupKeys.every((k) => selectedPermissions.includes(k));
              const someSelected = groupKeys.some((k) => selectedPermissions.includes(k));

              return (
                <div
                  key={group.group}
                  className="p-4 rounded-xl bg-casa-canvas border border-casa-border-light space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-casa-border-light/60 pb-2">
                    <div>
                      <span className="text-xs font-bold text-casa-text-primary">{group.label}</span>
                      <p className="text-[11px] text-casa-text-muted">{group.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleGroup(group)}
                      className="flex items-center gap-1 text-xs font-semibold text-casa-brand hover:underline"
                    >
                      {allSelected ? (
                        <>
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Deselect All</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5" />
                          <span>Select All</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {group.permissions.map((perm) => {
                      const isChecked = selectedPermissions.includes(perm.key);
                      return (
                        <label
                          key={perm.key}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer select-none transition-colors ${
                            isChecked
                              ? 'bg-casa-surface border-casa-brand shadow-2xs'
                              : 'bg-casa-surface/50 border-casa-border-light hover:bg-casa-surface'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(perm.key)}
                            className="mt-0.5 rounded text-casa-brand focus:ring-casa-brand"
                          />
                          <div>
                            <span className="block text-xs font-semibold text-casa-text-primary">
                              {perm.label}
                            </span>
                            <span className="block text-[10px] text-casa-text-muted font-mono">
                              {perm.key}
                            </span>
                            <p className="text-[10px] text-casa-text-secondary mt-0.5">
                              {perm.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </form>
  );
}
