'use client';

import * as React from 'react';
import { Card, Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast-context';
import { getAdminPayments, refundAdminPayment } from '@/services/payment-service';
import { PaymentRecord, PaymentKPIs } from '@/types';
import {
  Receipt,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  Search,
  RefreshCw,
  X,
  CreditCard,
  DollarSign,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All Transactions', value: 'ALL' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Refunded', value: 'REFUNDED' },
  { label: 'Failed', value: 'FAILED' },
];

export default function PaymentsPage() {
  const toast = useToast();

  const [transactions, setTransactions] = React.useState<PaymentRecord[]>([]);
  const [metrics, setMetrics] = React.useState<PaymentKPIs | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedStatus, setSelectedStatus] = React.useState('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalRecords, setTotalRecords] = React.useState(0);

  // Refund Modal State
  const [refundTargetPayment, setRefundTargetPayment] = React.useState<PaymentRecord | null>(null);
  const [refundAmount, setRefundAmount] = React.useState<string>('');
  const [refundReason, setRefundReason] = React.useState('');
  const [isProcessingRefund, setIsProcessingRefund] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAdminPayments({
        page,
        limit: 15,
        status: selectedStatus,
        q: searchQuery || undefined,
      });

      setTransactions(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalRecords(res.pagination?.total || 0);
      if (res.metrics) setMetrics(res.metrics);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load payments';
      toast.error('Load Error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedStatus, searchQuery, toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTargetPayment) return;

    setIsProcessingRefund(true);
    try {
      const amountNum = refundAmount ? parseFloat(refundAmount) : refundTargetPayment.amount;
      await refundAdminPayment(refundTargetPayment.id || refundTargetPayment.orderId, {
        amount: amountNum,
        reason: refundReason.trim() || undefined,
      });

      toast.success('Refund Issued', `Refund of ₹${amountNum.toLocaleString()} processed successfully.`);
      setRefundTargetPayment(null);
      setRefundAmount('');
      setRefundReason('');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to issue refund';
      toast.error('Refund Error', msg);
    } finally {
      setIsProcessingRefund(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-casa-brand-subtle rounded-xl text-casa-brand">
              <Receipt className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              Payments, Monetization & Revenue Ledger
            </h1>
          </div>
          <p className="text-xs md:text-sm text-casa-text-secondary mt-1">
            Global marketplace transactions, featured property upgrades, broker subscriptions, and refund management.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle flex flex-col justify-between">
            <span className="text-xs text-casa-text-muted font-medium">Total Paid Revenue</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              ₹{metrics.totalRevenue.toLocaleString()}
            </p>
          </Card>
          <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle flex flex-col justify-between">
            <span className="text-xs text-blue-600 font-medium">Settled Transactions</span>
            <p className="text-2xl font-bold text-blue-700 mt-1">{metrics.paidCount}</p>
          </Card>
          <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle flex flex-col justify-between">
            <span className="text-xs text-amber-600 font-medium">Pending Checkout Orders</span>
            <p className="text-2xl font-bold text-amber-700 mt-1">{metrics.pendingCount}</p>
          </Card>
          <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle flex flex-col justify-between">
            <span className="text-xs text-rose-600 font-medium">Refunded Transactions</span>
            <p className="text-2xl font-bold text-rose-700 mt-1">{metrics.refundedCount}</p>
          </Card>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-casa-surface p-4 rounded-xl border border-casa-border-light shadow-subtle">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setSelectedStatus(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedStatus === tab.value
                  ? 'bg-casa-brand text-white'
                  : 'text-casa-text-secondary hover:bg-casa-canvas'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-casa-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Order ID, user, mobile..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary focus:outline-none focus:border-casa-brand"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <Card className="bg-casa-surface border border-casa-border-light shadow-subtle overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-casa-text-muted">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-casa-brand" />
            Loading transaction records from MongoDB Atlas...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-casa-text-muted">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold text-casa-text-primary">No transactions found</p>
            <p className="text-xs text-casa-text-secondary mt-1">No payment records match current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-casa-text-secondary">
              <thead className="bg-casa-subtle/50 text-[11px] uppercase font-bold text-casa-text-muted border-b border-casa-border-light">
                <tr>
                  <th className="px-4 py-3">Order ID / Date</th>
                  <th className="px-4 py-3">User & Contact</th>
                  <th className="px-4 py-3">Monetization Service</th>
                  <th className="px-4 py-3">Amount & Gateway</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-casa-border-light">
                {transactions.map((t) => (
                  <tr key={t.id || t.orderId} className="hover:bg-casa-canvas/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-casa-text-primary">{t.orderId}</div>
                      <div className="text-[11px] text-casa-text-muted">
                        {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-casa-text-primary">{t.userName || 'CASA User'}</div>
                      <div className="text-[11px] font-mono text-casa-text-muted">{t.userMobile || t.userId}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-casa-text-primary">{t.productName || t.purpose.replace(/_/g, ' ')}</div>
                      {t.referenceId && <div className="text-[10px] text-casa-text-muted font-mono">Ref: {t.referenceId}</div>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-casa-brand">₹{t.amount.toLocaleString()}</div>
                      <div className="text-[10px] text-casa-text-muted font-mono">{t.provider}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          t.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : t.status === 'REFUNDED'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : t.status === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {t.status === 'PAID' ? <CheckCircle className="w-3 h-3" /> : null}
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {t.status === 'PAID' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRefundTargetPayment(t);
                            setRefundAmount(t.amount.toString());
                          }}
                          className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          Refund
                        </Button>
                      ) : (
                        <span className="text-xs text-casa-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-casa-text-secondary pt-2">
          <span>Total {totalRecords} transaction records</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs"
            >
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundTargetPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-casa-surface border border-casa-border-light p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                Issue Transaction Refund
              </h3>
              <button
                onClick={() => setRefundTargetPayment(null)}
                className="p-1 rounded-lg hover:bg-casa-canvas text-casa-text-muted hover:text-casa-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-casa-canvas rounded-xl text-xs space-y-1">
              <p>
                <strong>Order ID:</strong> <span className="font-mono">{refundTargetPayment.orderId}</span>
              </p>
              <p>
                <strong>Customer:</strong> {refundTargetPayment.userName || refundTargetPayment.userId}
              </p>
              <p>
                <strong>Original Amount:</strong> ₹{refundTargetPayment.amount.toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleRefundSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-casa-text-muted">Refund Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={refundTargetPayment.amount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full mt-1 p-2 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-casa-text-muted">Refund Reason</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Customer requested cancellation within refund window"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full mt-1 p-2 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRefundTargetPayment(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isProcessingRefund || !refundAmount}
                  className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {isProcessingRefund ? 'Processing Refund...' : 'Confirm Refund'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
