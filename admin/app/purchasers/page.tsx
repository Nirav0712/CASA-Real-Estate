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
  }, [page, debouncedSearch, statusFilter, toast]);

  React.useEffect(() => {
    loadPurchasers();
  }, [loadPurchasers]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-casa-brand-subtle rounded-xl text-casa-brand">
              <User className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              Purchasers & Registered Buyers
            </h1>
            <span className="text-xs px-2.5 py-1 bg-casa-subtle rounded-full font-bold text-casa-text-secondary border border-casa-border-light">
              {totalPurchasers} Buyers
            </span>
          </div>
          <p className="text-xs md:text-sm text-casa-text-secondary mt-1">
            Track registered residential and commercial buyers discovered across the CASA marketplace.
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

      {/* Filters Toolbar */}
      <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-casa-text-muted" />
            <input
              type="text"
              placeholder="Search by buyer name, mobile, email..."
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
            className="py-2 px-3 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30"
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
            <p className="text-xs">Loading live MongoDB purchaser records...</p>
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
            <p className="text-sm font-semibold text-casa-text-primary">No buyers found</p>
            <p className="text-xs">No registered purchaser records match your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-casa-text-secondary">
              <thead className="bg-casa-subtle/50 text-[11px] uppercase font-bold text-casa-text-muted border-b border-casa-border-light">
                <tr>
                  <th className="px-4 py-3">Buyer & Contact</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Registration Date</th>
                  <th className="px-4 py-3">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-casa-border-light">
                {purchasers.map((b) => (
                  <tr key={b.id} className="hover:bg-casa-canvas/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-casa-text-primary">{b.name}</div>
                      <div className="text-[11px] text-casa-text-muted flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {b.normalizedMobile || b.mobile}
                      </div>
                      {b.email && (
                        <div className="text-[10px] text-casa-text-muted font-mono">{b.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-casa-brand-subtle text-casa-brand uppercase">
                        {b.role}
                      </span>
                    </td>
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
                    <td className="px-4 py-3.5 text-casa-text-muted flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-casa-text-muted">
                      {b.lastLoginAt ? new Date(b.lastLoginAt).toLocaleDateString() : 'Active Recently'}
                    </td>
                  </tr>
                ))}
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
