'use client';

import * as React from 'react';
import { Card, Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast-context';
import {
  User,
  Search,
  Phone,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { getAdminPurchasers } from '@/services/admin-service';
import { PurchaserRecord } from '@/types';

export default function PurchasersPage() {
  const toast = useToast();

  const [purchasers, setPurchasers] = React.useState<PurchaserRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalPurchasers, setTotalPurchasers] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadPurchasers = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminPurchasers({
        page,
        limit: 20,
        q: debouncedSearch,
        status: statusFilter,
        category: categoryFilter,
      });
      setPurchasers(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalPurchasers(res.pagination?.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load purchasers';
      setError(msg);
      toast.error('Load Failed', msg);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, categoryFilter, toast]);

  React.useEffect(() => {
    loadPurchasers();
  }, [loadPurchasers]);

  const formatBillingDuration = (period?: string) => {
    if (!period) return '—';
    switch (period) {
      case '1_MONTH':
        return '1 Month (30 Days)';
      case '60_DAYS':
        return '60 Days';
      case '90_DAYS':
        return '90 Days';
      case '6_MONTHS':
        return '6 Months';
      case '1_YEAR':
        return '1 Year (365 Days)';
      case '3_DAYS_TRIAL':
        return '3 Days Trial';
      case 'FREE':
        return 'Free Plan';
      case 'MONTHLY':
        return 'Monthly';
      case 'ANNUALLY':
      case 'YEARLY':
        return 'Annual';
      default:
        return period.replace('_', ' ');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-casa-brand-subtle rounded-xl text-casa-brand">
              <User className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              Purchasers & Plan Subscribers
            </h1>
            <span className="text-xs px-2.5 py-1 bg-casa-subtle rounded-full font-bold text-casa-text-secondary border border-casa-border-light">
              {totalPurchasers} Users
            </span>
          </div>
          <p className="text-xs md:text-sm text-casa-text-secondary mt-1">
            Complete records of users who purchased packages or selected 3-day free trials across the myproperty marketplace.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadPurchasers}
          disabled={loading}
          className="flex items-center gap-1 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Category Divide Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: 'All Subscribers & Users' },
          { id: 'FREE_TRIAL', label: '⚡ 3-Day Free Trial' },
          { id: 'PAID', label: '💎 Paid Active Plans' },
          { id: 'EXPIRED', label: '⚠️ Trial Expired / Due' },
          { id: 'BUYER', label: '👤 Registered Buyers' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setCategoryFilter(tab.id);
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              categoryFilter === tab.id
                ? 'bg-casa-brand text-white shadow-xs'
                : 'bg-casa-surface text-casa-text-secondary border border-casa-border-light hover:bg-casa-subtle'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Toolbar */}
      <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
          <div className="relative flex-1 min-w-0 w-full sm:min-w-[200px] sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-casa-text-muted" />
            <input
              type="text"
              placeholder="Search by user name, mobile, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl focus:outline-none focus:ring-2 focus:ring-casa-brand/30 text-casa-text-primary placeholder:text-casa-text-muted"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Status"
            className="w-full sm:w-auto py-2 px-3 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30 font-medium"
          >
            <option value="ALL">All Account Statuses</option>
            <option value="ACTIVE">Active Accounts</option>
            <option value="SUSPENDED">Suspended Accounts</option>
            <option value="DEACTIVATED">Deactivated Accounts</option>
          </select>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="bg-casa-surface border border-casa-border-light shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-casa-text-muted flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-casa-brand" />
            <p className="text-xs">Loading...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 space-y-2">
            <AlertTriangle className="w-6 h-6 mx-auto" />
            <p className="text-xs font-semibold">{error}</p>
            <Button variant="outline" size="sm" onClick={loadPurchasers} className="text-xs">
              Retry
            </Button>
          </div>
        ) : purchasers.length === 0 ? (
          <div className="p-12 text-center text-casa-text-muted space-y-2">
            <User className="w-8 h-8 mx-auto text-casa-text-muted/50" />
            <p className="text-sm font-semibold text-casa-text-primary">No subscribers or buyers found</p>
            <p className="text-xs">No records match the selected category or search filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-casa-text-secondary">
              <thead className="bg-casa-subtle/50 text-[11px] uppercase font-bold text-casa-text-muted border-b border-casa-border-light">
                <tr>
                  <th className="px-4 py-3">Subscriber & Contact</th>
                  <th className="px-4 py-3">Plan / Package</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Timeline & Validity</th>
                  <th className="px-4 py-3">Account Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-casa-border-light">
                {purchasers.map((b) => {
                  const phoneNum = b.normalizedMobile || b.mobile;
                  const cleanPhone = phoneNum ? phoneNum.replace(/[^0-9+]/g, '') : '';

                  return (
                    <tr key={b.id || b._id} className="hover:bg-casa-canvas/50 transition-colors">
                      {/* Subscriber Info */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-casa-text-primary">{b.name}</div>
                        <div className="text-[11px] text-casa-text-muted flex items-center gap-1 mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-casa-brand" />
                          <a
                            href={`tel:${cleanPhone}`}
                            className="hover:text-casa-brand hover:underline font-semibold"
                          >
                            {phoneNum}
                          </a>
                        </div>
                        {b.email && (
                          <div className="text-[10px] text-casa-text-muted font-mono">{b.email}</div>
                        )}
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-casa-subtle text-casa-text-muted uppercase mt-1 inline-block">
                          {b.role?.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Plan / Package Details */}
                      <td className="px-4 py-3.5">
                        <div className="font-extrabold text-casa-text-primary text-xs">
                          {b.planName || 'Free Buyer Plan'}
                        </div>
                        <div className="text-[11px] font-semibold text-casa-brand mt-0.5">
                          {b.planPrice === 0 ? 'FREE' : `₹${b.planPrice?.toLocaleString('en-IN')}`}
                        </div>
                        <div className="text-[10px] text-casa-text-muted font-mono">
                          Duration: {formatBillingDuration(b.billingPeriod)}
                        </div>
                      </td>

                      {/* Plan Category Badge */}
                      <td className="px-4 py-3.5">
                        {b.planCategory === 'FREE_TRIAL' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                            ⚡ 3-Day Trial
                          </span>
                        ) : b.planCategory === 'PAID_PLAN' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-300">
                            💎 Paid Plan
                          </span>
                        ) : b.planCategory === 'TRIAL_EXPIRED' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-300">
                            ⚠️ Trial Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            Free Community
                          </span>
                        )}
                      </td>

                      {/* Timeline & Validity */}
                      <td className="px-4 py-3.5">
                        {b.trialExpiresAt ? (
                          <div className="space-y-0.5 text-[11px]">
                            <div className="flex items-center gap-1 text-casa-text-muted">
                              <Calendar className="w-3 h-3" />
                              <span>Expires: {new Date(b.trialExpiresAt).toLocaleDateString()}</span>
                            </div>
                            {b.isExpired ? (
                              <span className="text-[10px] font-bold text-red-600 block">
                                Service Expired (Call for renew)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600 block font-mono">
                                {b.daysRemaining} Day(s) remaining
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-casa-text-muted flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Joined: {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            b.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>

                      {/* Actions (Call CTA) */}
                      <td className="px-4 py-3.5 text-right">
                        <a
                          href={`tel:${cleanPhone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                          title="Call subscriber directly"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call User</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-casa-border-light flex items-center justify-between text-xs text-casa-text-muted">
            <div>
              Showing Page <strong className="text-casa-text-primary">{page}</strong> of{' '}
              <strong className="text-casa-text-primary">{totalPages}</strong> ({totalPurchasers} purchasers)
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="h-8 px-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="h-8 px-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
