'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Search,
  Users,
  Eye,
  Home,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { getUsageMetrics, addBonusCredits, resetUserUsage } from '@/services/entitlements-service';
import { UsageMetricRecord } from '@/types';

export default function UsageMonitoringPage() {
  const [metrics, setMetrics] = useState<UsageMetricRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UsageMetricRecord | null>(null);
  const [bonusViews, setBonusViews] = useState<number>(10);
  const [bonusListings, setBonusListings] = useState<number>(5);
  const [bonusLeads, setBonusLeads] = useState<number>(10);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const res = await getUsageMetrics({ search });
      setMetrics(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsage();
  };

  const handleGrantBonus = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      await addBonusCredits(selectedUser.userId, {
        propertyViewsBonus: bonusViews,
        propertyListingsBonus: bonusListings,
        leadsBonus: bonusLeads,
      });
      alert('Bonus credits granted successfully');
      setSelectedUser(null);
      await fetchUsage();
    } catch (err: any) {
      alert(err.message || 'Failed to grant bonus credits');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async (userId: string, type: 'views' | 'all') => {
    if (!window.confirm(`Reset ${type === 'views' ? 'view usage' : 'all usage counters'} for this user?`)) return;
    try {
      await resetUserUsage(userId, type);
      await fetchUsage();
    } catch (err: any) {
      alert(err.message || 'Failed to reset usage');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-casa-surface p-6 rounded-2xl border border-casa-border-light shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-casa-brand-subtle text-casa-brand">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-casa-text-primary">Entitlement Usage & Quota Monitor</h1>
            <p className="text-xs text-casa-text-muted">
              Live tracking of monthly property views, active listings, lead allocations, and quota exhaustion
            </p>
          </div>
        </div>

        <button
          onClick={fetchUsage}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-casa-subtle hover:bg-casa-canvas text-casa-text-primary transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Usage</span>
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-casa-text-muted" />
          <input
            type="text"
            placeholder="Search by user name or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-hidden focus:border-casa-brand"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-casa-brand text-white shadow-subtle hover:bg-casa-brand/90"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Usage Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-casa-text-muted">Loading usage telemetry...</div>
      ) : metrics.length === 0 ? (
        <div className="p-12 text-center text-xs text-casa-text-muted bg-casa-surface rounded-2xl border border-casa-border-light">
          No user usage records found.
        </div>
      ) : (
        <div className="bg-casa-surface rounded-2xl border border-casa-border-light overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-casa-canvas text-casa-text-muted font-bold uppercase tracking-wider text-[10px] border-b border-casa-border-light">
                <tr>
                  <th className="p-3.5 text-start">User / Member</th>
                  <th className="p-3.5 text-start">Plan / Package</th>
                  <th className="p-3.5 text-start">Monthly Property Views</th>
                  <th className="p-3.5 text-start">Active Listings</th>
                  <th className="p-3.5 text-start">Monthly Leads</th>
                  <th className="p-3.5 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-casa-border-light">
                {metrics.map((m) => {
                  const viewsPercent =
                    m.propertyViews.limit > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (m.propertyViews.used /
                              (m.propertyViews.limit + m.propertyViews.bonus)) *
                              100,
                          ),
                        )
                      : 0;

                  const isViewsExhausted =
                    m.propertyViews.limit !== -1 && m.propertyViews.remaining <= 0;

                  return (
                    <tr key={m.userId} className="hover:bg-casa-canvas/50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-casa-text-primary">{m.userName}</div>
                        <div className="text-[11px] text-casa-text-muted font-mono">{m.userMobile}</div>
                        <div className="text-[10px] text-casa-brand font-mono uppercase">
                          {m.accountType || m.role}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-casa-brand-subtle text-casa-brand">
                          {m.package?.name || 'Default Free Plan'}
                        </span>
                      </td>

                      {/* Property Views */}
                      <td className="p-3.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-casa-text-primary font-mono">
                            {m.propertyViews.used} /{' '}
                            {m.propertyViews.limit === -1 ? '∞' : m.propertyViews.limit + m.propertyViews.bonus}
                          </span>
                          {isViewsExhausted && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-950 px-1 rounded">
                              EXHAUSTED
                            </span>
                          )}
                        </div>
                        {m.propertyViews.limit !== -1 && (
                          <div className="w-full bg-casa-canvas rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isViewsExhausted
                                  ? 'bg-red-500'
                                  : viewsPercent > 80
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${viewsPercent}%` }}
                            />
                          </div>
                        )}
                        {m.propertyViews.bonus > 0 && (
                          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                            +{m.propertyViews.bonus} bonus views added
                          </span>
                        )}
                      </td>

                      {/* Listings */}
                      <td className="p-3.5 font-mono">
                        <span className="font-bold text-casa-text-primary">{m.propertyListings.used}</span> /{' '}
                        <span>{m.propertyListings.limit === -1 ? '∞' : m.propertyListings.limit + m.propertyListings.bonus}</span>
                        {m.propertyListings.bonus > 0 && (
                          <span className="text-[10px] text-emerald-600 font-semibold block">
                            +{m.propertyListings.bonus} bonus
                          </span>
                        )}
                      </td>

                      {/* Leads */}
                      <td className="p-3.5 font-mono">
                        <span className="font-bold text-casa-text-primary">{m.leads.used}</span> /{' '}
                        <span>{m.leads.limit === -1 ? '∞' : m.leads.limit + m.leads.bonus}</span>
                        {m.leads.bonus > 0 && (
                          <span className="text-[10px] text-emerald-600 font-semibold block">
                            +{m.leads.bonus} bonus
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedUser(m)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-casa-brand text-white shadow-2xs hover:bg-casa-brand/90"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Bonus</span>
                          </button>

                          <button
                            onClick={() => handleReset(m.userId, 'views')}
                            title="Reset 30-day view count"
                            className="p-1.5 rounded-lg text-casa-text-muted hover:text-casa-brand hover:bg-casa-subtle"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grant Bonus Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-casa-surface border border-casa-border-light rounded-2xl max-w-md w-full p-6 space-y-4 shadow-subtle">
            <div className="flex items-center justify-between border-b border-casa-border-light pb-3">
              <div>
                <h3 className="text-base font-bold text-casa-text-primary">Grant Bonus Credits</h3>
                <p className="text-xs text-casa-text-muted">{selectedUser.userName} ({selectedUser.userMobile})</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-casa-text-muted hover:text-casa-text-primary"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-casa-text-secondary font-bold mb-1">
                  Additional Property Views Bonus
                </label>
                <input
                  type="number"
                  min="0"
                  value={bonusViews}
                  onChange={(e) => setBonusViews(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-casa-canvas border border-casa-border-light rounded-xl font-mono text-casa-text-primary"
                />
              </div>

              <div>
                <label className="block text-casa-text-secondary font-bold mb-1">
                  Additional Property Listings Bonus
                </label>
                <input
                  type="number"
                  min="0"
                  value={bonusListings}
                  onChange={(e) => setBonusListings(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-casa-canvas border border-casa-border-light rounded-xl font-mono text-casa-text-primary"
                />
              </div>

              <div>
                <label className="block text-casa-text-secondary font-bold mb-1">
                  Additional Leads Bonus
                </label>
                <input
                  type="number"
                  min="0"
                  value={bonusLeads}
                  onChange={(e) => setBonusLeads(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-casa-canvas border border-casa-border-light rounded-xl font-mono text-casa-text-primary"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-casa-border-light flex justify-end gap-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 text-xs rounded-xl border border-casa-border-light text-casa-text-secondary hover:bg-casa-subtle"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantBonus}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-casa-brand text-white shadow-subtle hover:bg-casa-brand/90"
              >
                {actionLoading ? 'Granting...' : 'Grant Credits'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
