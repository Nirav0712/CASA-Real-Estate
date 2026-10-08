'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckSquare, Search, Shield, ArrowLeft } from 'lucide-react';
import { getPermissions } from '@/services/entitlements-service';
import { PermissionGroup } from '@/types';

export default function PermissionsCatalogPage() {
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getPermissions();
        setPermissionGroups(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalPermissions = permissionGroups.reduce(
    (acc, g) => acc + g.permissions.length,
    0,
  );

  const filteredGroups = permissionGroups
    .filter((g) => selectedGroup === 'ALL' || g.group === selectedGroup)
    .map((g) => ({
      ...g,
      permissions: g.permissions.filter(
        (p) =>
          p.key.toLowerCase().includes(search.toLowerCase()) ||
          p.label.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter((g) => g.permissions.length > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-casa-text-primary">Granular Permissions Catalog</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-casa-brand-subtle text-casa-brand">
                {totalPermissions} Registered Keys
              </span>
            </div>
            <p className="text-xs text-casa-text-muted">
              Authoritative catalog of all functional permission keys grouped by domain module
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/roles/create"
            className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-casa-brand text-white shadow-subtle hover:bg-casa-brand/90 transition-colors"
          >
            Create New Role
          </Link>
        </div>
      </div>

      {/* Search and Module Filter */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-casa-text-muted" />
          <input
            type="text"
            placeholder="Search permissions by key, label, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-hidden focus:border-casa-brand"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedGroup('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              selectedGroup === 'ALL'
                ? 'bg-casa-brand text-white'
                : 'bg-casa-surface text-casa-text-secondary border border-casa-border-light hover:bg-casa-subtle'
            }`}
          >
            All Modules ({totalPermissions})
          </button>
          {permissionGroups.map((g) => (
            <button
              key={g.group}
              onClick={() => setSelectedGroup(g.group)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                selectedGroup === g.group
                  ? 'bg-casa-brand text-white'
                  : 'bg-casa-surface text-casa-text-secondary border border-casa-border-light hover:bg-casa-subtle'
              }`}
            >
              {g.label} ({g.permissions.length})
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Display */}
      {loading ? (
        <div className="p-12 text-center text-xs text-casa-text-muted">Loading permissions catalog...</div>
      ) : filteredGroups.length === 0 ? (
        <div className="p-12 text-center text-xs text-casa-text-muted bg-casa-surface rounded-2xl border border-casa-border-light">
          No permissions found matching "{search}"
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group) => (
            <div
              key={group.group}
              className="bg-casa-surface rounded-2xl border border-casa-border-light p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-casa-border-light pb-3">
                <div>
                  <h2 className="text-sm font-bold text-casa-text-primary flex items-center gap-2">
                    <Shield className="w-4 h-4 text-casa-brand" />
                    <span>{group.label}</span>
                  </h2>
                  <p className="text-xs text-casa-text-muted">{group.description}</p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-casa-canvas text-casa-text-secondary">
                  {group.permissions.length} Keys
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.permissions.map((perm) => (
                  <div
                    key={perm.key}
                    className="p-3 rounded-xl bg-casa-canvas border border-casa-border-light flex flex-col justify-between"
                  >
                    <div>
                      <span className="font-bold text-xs text-casa-text-primary block">{perm.label}</span>
                      <span className="font-mono text-[10px] text-casa-brand block mt-0.5 select-all">
                        {perm.key}
                      </span>
                      <p className="text-[11px] text-casa-text-secondary mt-1.5">{perm.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
