'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Plus,
  Copy,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Sparkles,
  Lock,
} from 'lucide-react';
import { getRoles, deleteRole, duplicateRole } from '@/services/entitlements-service';
import { RoleRecord } from '@/types';

export default function RolesManagementPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<RoleRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRolesList = async () => {
    try {
      setLoading(true);
      const data = await getRoles();
      setRoles(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesList();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete custom role "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setActionLoading(id);
      await deleteRole(id);
      await fetchRolesList();
    } catch (err: any) {
      alert(err.message || 'Failed to delete role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      setActionLoading(id);
      const cloned = await duplicateRole(id);
      await fetchRolesList();
      router.push(`/roles/${cloned.id || cloned._id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate role');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRoles = roles.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.slug.toLowerCase().includes(search.toLowerCase()) ||
      r.platformRole.toLowerCase().includes(search.toLowerCase());

    if (filterType === 'SYSTEM') return matchesSearch && r.isSystemRole;
    if (filterType === 'CUSTOM') return matchesSearch && !r.isSystemRole;
    if (filterType === 'PLATFORM') return matchesSearch && ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(r.platformRole);
    if (filterType === 'MARKETPLACE') return matchesSearch && r.platformRole === 'USER';
    return matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-casa-surface p-6 rounded-2xl border border-casa-border-light shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-casa-brand-subtle text-casa-brand">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-casa-text-primary">Role Management Control Center</h1>
              <p className="text-xs text-casa-text-muted">
                Define dynamic platform & marketplace roles, granular permission matrices, and scope isolation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/permissions"
            className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-casa-border-light text-casa-text-secondary hover:bg-casa-subtle transition-colors"
          >
            Inspect Permissions Catalog
          </Link>
          <Link
            href="/roles/create"
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-casa-brand text-white shadow-subtle hover:bg-casa-brand/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Role</span>
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-casa-text-muted" />
          <input
            type="text"
            placeholder="Search roles by name or scope..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-hidden focus:border-casa-brand"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1">
          {['ALL', 'SYSTEM', 'CUSTOM', 'PLATFORM', 'MARKETPLACE'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                filterType === tab
                  ? 'bg-casa-brand text-white'
                  : 'bg-casa-surface text-casa-text-secondary border border-casa-border-light hover:bg-casa-subtle'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Roles Grid */}
      {loading ? (
        <div className="p-12 text-center text-casa-text-muted text-xs">Loading roles hierarchy...</div>
      ) : filteredRoles.length === 0 ? (
        <div className="p-12 text-center text-casa-text-muted text-xs bg-casa-surface rounded-2xl border border-casa-border-light">
          No roles found matching criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoles.map((role) => {
            const roleId = role.id || role._id || '';
            const isSuperAdmin = role.slug === 'super-admin' || role.permissions.includes('*');

            return (
              <div
                key={roleId}
                className="bg-casa-surface rounded-2xl border border-casa-border-light p-5 flex flex-col justify-between hover:shadow-subtle transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-casa-text-primary">{role.name}</span>
                        {role.isSystemRole ? (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            SYSTEM
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            CUSTOM
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-casa-text-muted font-mono">{role.slug}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        role.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                      }`}
                    >
                      {role.isActive ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>

                  <p className="text-xs text-casa-text-secondary line-clamp-2 mb-4">
                    {role.description || 'No custom description provided for this role.'}
                  </p>

                  {/* Badges metadata */}
                  <div className="space-y-2 py-3 border-y border-casa-border-light/60 text-[11px]">
                    <div className="flex items-center justify-between text-casa-text-muted">
                      <span>Platform Role:</span>
                      <span className="font-semibold text-casa-text-primary font-mono">{role.platformRole}</span>
                    </div>
                    <div className="flex items-center justify-between text-casa-text-muted">
                      <span>Account Type:</span>
                      <span className="font-semibold text-casa-text-primary font-mono">
                        {role.accountType || 'NULL (Platform)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-casa-text-muted">
                      <span>Data Scope:</span>
                      <span className="font-semibold px-2 py-0.5 rounded bg-casa-canvas text-casa-brand font-mono">
                        {role.dataScope}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-casa-text-muted">
                      <span>Granted Permissions:</span>
                      <span className="font-bold text-casa-text-primary">
                        {isSuperAdmin ? 'Full Access (*)' : `${role.permissions.length} keys`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-4 flex items-center justify-between gap-2 mt-2">
                  <button
                    onClick={() => setSelectedRole(role)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-casa-text-secondary hover:bg-casa-subtle transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDuplicate(roleId)}
                      disabled={actionLoading === roleId}
                      title="Duplicate Role Template"
                      className="p-1.5 rounded-lg text-casa-text-muted hover:text-casa-brand hover:bg-casa-subtle transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <Link
                      href={`/roles/${roleId}`}
                      title="Edit Role & Permissions"
                      className="p-1.5 rounded-lg text-casa-text-muted hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Link>

                    {!role.isSystemRole && (
                      <button
                        onClick={() => handleDelete(roleId, role.name)}
                        disabled={actionLoading === roleId}
                        title="Delete Custom Role"
                        className="p-1.5 rounded-lg text-casa-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Role Preview Modal */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-casa-surface border border-casa-border-light rounded-2xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-casa-border-light pb-3">
              <div>
                <h3 className="text-base font-bold text-casa-text-primary">{selectedRole.name}</h3>
                <span className="text-xs text-casa-text-muted font-mono">{selectedRole.slug}</span>
              </div>
              <button
                onClick={() => setSelectedRole(null)}
                className="p-1.5 rounded-lg text-casa-text-muted hover:bg-casa-subtle"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-casa-canvas p-3 rounded-xl">
              <div>
                <span className="text-casa-text-muted block">Platform Role</span>
                <span className="font-bold text-casa-text-primary font-mono">{selectedRole.platformRole}</span>
              </div>
              <div>
                <span className="text-casa-text-muted block">Account Type</span>
                <span className="font-bold text-casa-text-primary font-mono">
                  {selectedRole.accountType || 'null'}
                </span>
              </div>
              <div>
                <span className="text-casa-text-muted block">Data Scope</span>
                <span className="font-bold text-casa-brand font-mono">{selectedRole.dataScope}</span>
              </div>
              <div>
                <span className="text-casa-text-muted block">Role Type</span>
                <span className="font-bold text-casa-text-primary font-mono">
                  {selectedRole.isSystemRole ? 'System Default' : 'Custom User Defined'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-casa-text-primary uppercase tracking-wider mb-2">
                Dashboard Capabilities Enabled
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(selectedRole.dashboardConfig || {}).map(([key, enabled]) => (
                  <div key={key} className="flex items-center gap-2">
                    {enabled ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                    <span className={enabled ? 'text-casa-text-primary' : 'text-casa-text-muted line-through'}>
                      {key.replace('canAccess', '')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-casa-text-primary uppercase tracking-wider mb-2">
                Assigned Permissions ({selectedRole.permissions.length})
              </h4>
              <div className="max-h-48 overflow-y-auto p-3 bg-casa-canvas rounded-xl flex flex-wrap gap-1.5">
                {selectedRole.permissions.map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-casa-surface border border-casa-border-light text-casa-text-primary"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-casa-border-light flex justify-end">
              <button
                onClick={() => setSelectedRole(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-casa-brand text-white"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
