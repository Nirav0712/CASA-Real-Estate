'use client';

import * as React from 'react';
import { Card, Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast-context';
import {
  getAdminPayments,
  refundAdminPayment,
  getAdminSubscriptionRequests,
  approveSubscriptionRequest,
  denySubscriptionRequest,
} from '@/services/payment-service';
import {
  PaymentRecord,
  PaymentKPIs,
  SubscriptionRequest,
  SubscriptionRequestStatus,
} from '@/types';
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
  ShieldCheck,
  MessageCircle,
  PhoneCall,
  UserCheck,
  UserX,
  AlertCircle,
  Calendar,
  Sparkles,
} from 'lucide-react';

const TRANSACTION_STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All Transactions', value: 'ALL' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Refunded', value: 'REFUNDED' },
  { label: 'Failed', value: 'FAILED' },
];

const REQUEST_STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All Requests', value: 'ALL' },
  { label: 'Pending Approval', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Denied', value: 'DENIED' },
];

export default function PaymentsPage() {
  const toast = useToast();

  // Active top-level tab: 'requests' | 'transactions'
  const [activeTab, setActiveTab] = React.useState<'requests' | 'transactions'>('requests');

  // Subscription Requests State
  const [requests, setRequests] = React.useState<SubscriptionRequest[]>([]);
  const [requestMetrics, setRequestMetrics] = React.useState<{
    totalRequests: number;
    pending: number;
    approved: number;
    denied: number;
  }>({ totalRequests: 0, pending: 0, approved: 0, denied: 0 });
  const [isRequestsLoading, setIsRequestsLoading] = React.useState(true);
  const [requestStatus, setRequestStatus] = React.useState<string>('ALL');
  const [requestSearch, setRequestSearch] = React.useState<string>('');
  const [requestPage, setRequestPage] = React.useState(1);
  const [requestTotalPages, setRequestTotalPages] = React.useState(1);
  const [requestTotalRecords, setRequestTotalRecords] = React.useState(0);

  // Approve / Deny Modal State
  const [approvingRequest, setApprovingRequest] = React.useState<SubscriptionRequest | null>(null);
  const [isApproving, setIsApproving] = React.useState(false);

  const [denyingRequest, setDenyingRequest] = React.useState<SubscriptionRequest | null>(null);
  const [denialReason, setDenialReason] = React.useState('');
  const [isDenying, setIsDenying] = React.useState(false);

  // Transactions Ledger State
  const [transactions, setTransactions] = React.useState<PaymentRecord[]>([]);
  const [metrics, setMetrics] = React.useState<PaymentKPIs | null>(null);
  const [isTransactionsLoading, setIsTransactionsLoading] = React.useState(true);
  const [selectedTxStatus, setSelectedTxStatus] = React.useState('ALL');
  const [txSearchQuery, setTxSearchQuery] = React.useState('');
  const [txPage, setTxPage] = React.useState(1);
  const [txTotalPages, setTxTotalPages] = React.useState(1);
  const [txTotalRecords, setTxTotalRecords] = React.useState(0);

  // Refund Modal State
  const [refundTargetPayment, setRefundTargetPayment] = React.useState<PaymentRecord | null>(null);
  const [refundAmount, setRefundAmount] = React.useState<string>('');
  const [refundReason, setRefundReason] = React.useState('');
  const [isProcessingRefund, setIsProcessingRefund] = React.useState(false);

  // Check URL query on initial mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'transactions' || tabParam === 'ledger') {
        setActiveTab('transactions');
      } else if (tabParam === 'requests') {
        setActiveTab('requests');
      }
    }
  }, []);

  // Load Subscription Requests
  const loadRequests = React.useCallback(async () => {
    setIsRequestsLoading(true);
    try {
      const res = await getAdminSubscriptionRequests({
        page: requestPage,
        limit: 15,
        status: requestStatus,
        q: requestSearch || undefined,
      });

      setRequests(res.data || []);
      setRequestTotalPages(res.pagination?.totalPages || 1);
      setRequestTotalRecords(res.pagination?.total || 0);
      if (res.metrics) {
        setRequestMetrics(res.metrics);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load subscription requests';
      toast.error('Load Error', msg);
    } finally {
      setIsRequestsLoading(false);
    }
  }, [requestPage, requestStatus, requestSearch, toast]);

  // Load Transactions
  const loadTransactions = React.useCallback(async () => {
    setIsTransactionsLoading(true);
    try {
      const res = await getAdminPayments({
        page: txPage,
        limit: 15,
        status: selectedTxStatus,
        q: txSearchQuery || undefined,
      });

      setTransactions(res.data || []);
      setTxTotalPages(res.pagination?.totalPages || 1);
      setTxTotalRecords(res.pagination?.total || 0);
      if (res.metrics) setMetrics(res.metrics);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load payments';
      toast.error('Load Error', msg);
    } finally {
      setIsTransactionsLoading(false);
    }
  }, [txPage, selectedTxStatus, txSearchQuery, toast]);

  React.useEffect(() => {
    if (activeTab === 'requests') {
      loadRequests();
    } else {
      loadTransactions();
    }
  }, [activeTab, loadRequests, loadTransactions]);

  // Handler: Approve Request
  const handleConfirmApprove = async () => {
    if (!approvingRequest) return;
    setIsApproving(true);
    try {
      const res = await approveSubscriptionRequest(approvingRequest.id);
      toast.success(
        'Subscription Activated',
        `Plan ${approvingRequest.planName} has been activated successfully for ${
          approvingRequest.userName || 'user'
        }.`,
      );
      setApprovingRequest(null);
      await loadRequests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve subscription request.';
      toast.error('Approval Error', msg);
    } finally {
      setIsApproving(false);
    }
  };

  // Handler: Deny Request
  const handleConfirmDeny = async () => {
    if (!denyingRequest) return;
    setIsDenying(true);
    try {
      await denySubscriptionRequest(denyingRequest.id, {
        reason: denialReason.trim() || undefined,
      });
      toast.info(
        'Request Denied',
        `Subscription request ${denyingRequest.requestReference} has been marked as Denied.`,
      );
      setDenyingRequest(null);
      setDenialReason('');
      await loadRequests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to deny subscription request.';
      toast.error('Denial Error', msg);
    } finally {
      setIsDenying(false);
    }
  };

  // Handler: Refund Submit
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
      await loadTransactions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to issue refund';
      toast.error('Refund Error', msg);
    } finally {
      setIsProcessingRefund(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-casa-brand-subtle rounded-xl text-casa-brand">
              <Receipt className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              Payments & Subscription Approvals
            </h1>
          </div>
          <p className="text-xs md:text-sm text-casa-text-secondary mt-1">
            Review user subscription requests, manual sales approvals, gateway transaction ledger, and refunds.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (activeTab === 'requests') loadRequests();
            else loadTransactions();
          }}
          disabled={activeTab === 'requests' ? isRequestsLoading : isTransactionsLoading}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-4 h-4 ${
              (activeTab === 'requests' ? isRequestsLoading : isTransactionsLoading)
                ? 'animate-spin'
                : ''
            }`}
          />
          Refresh
        </Button>
      </div>

      {/* Top View Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-casa-border-light pb-2">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'requests'
              ? 'bg-casa-brand text-white shadow-sm'
              : 'text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-surface'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Subscription Requests (Sales Approval)</span>
          {requestMetrics.pending > 0 && (
            <span
              className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                activeTab === 'requests'
                  ? 'bg-amber-400 text-zinc-950'
                  : 'bg-amber-500 text-white animate-pulse'
              }`}
            >
              {requestMetrics.pending} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'transactions'
              ? 'bg-casa-brand text-white shadow-sm'
              : 'text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-surface'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Payment Gateway Ledger & Transactions</span>
        </button>
      </div>

      {/* TAB 1: SUBSCRIPTION REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Requests KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle flex flex-col justify-between">
              <span className="text-xs text-casa-text-muted font-medium">Total Subscription Requests</span>
              <p className="text-2xl font-bold text-casa-text-primary mt-1">
                {requestMetrics.totalRequests}
              </p>
            </Card>
            <Card className="p-4 bg-casa-surface border border-amber-300 dark:border-amber-800 shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-700 dark:text-amber-300 font-bold">Pending Review</span>
                <Clock className="w-4 h-4 text-amber-500 animate-spin" />
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-1">{requestMetrics.pending}</p>
            </Card>
            <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle flex flex-col justify-between">
              <span className="text-xs text-emerald-600 font-medium">Approved Subscriptions</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{requestMetrics.approved}</p>
            </Card>
            <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle flex flex-col justify-between">
              <span className="text-xs text-rose-600 font-medium">Denied Requests</span>
              <p className="text-2xl font-bold text-rose-700 mt-1">{requestMetrics.denied}</p>
            </Card>
          </div>

          {/* Filter Tabs & Search for Requests */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-casa-surface p-4 rounded-xl border border-casa-border-light shadow-subtle">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
              {REQUEST_STATUS_FILTERS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    setRequestStatus(tab.value);
                    setRequestPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    requestStatus === tab.value
                      ? 'bg-casa-brand text-white'
                      : 'text-casa-text-secondary hover:bg-casa-canvas'
                  }`}
                >
                  {tab.label}
                  {tab.value === 'PENDING' && requestMetrics.pending > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-400 text-zinc-950 font-bold text-[10px]">
                      {requestMetrics.pending}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-auto md:min-w-[280px]">
              <Search className="w-4 h-4 text-casa-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reference, mobile, user, plan..."
                value={requestSearch}
                onChange={(e) => {
                  setRequestSearch(e.target.value);
                  setRequestPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary focus:outline-none focus:border-casa-brand"
              />
            </div>
          </div>

          {/* Requests Table */}
          <Card className="bg-casa-surface border border-casa-border-light shadow-subtle overflow-hidden">
            {isRequestsLoading ? (
              <div className="p-12 text-center text-xs text-casa-text-muted">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-casa-brand" />
                Loading subscription activation requests...
              </div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center text-casa-text-muted">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold text-casa-text-primary">No subscription requests found</p>
                <p className="text-xs text-casa-text-secondary mt-1">
                  When users request a plan via WhatsApp or Phone Call, requests will automatically appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-casa-text-secondary">
                  <thead className="bg-casa-subtle/50 text-[11px] uppercase font-bold text-casa-text-muted border-b border-casa-border-light">
                    <tr>
                      <th className="px-4 py-3">Reference / Date</th>
                      <th className="px-4 py-3">User & Contact</th>
                      <th className="px-4 py-3">Requested Plan & Period</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Contact Method</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Super Admin Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-casa-border-light">
                    {requests.map((r) => (
                      <tr key={r.id || r.requestReference} className="hover:bg-casa-canvas/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-mono font-bold text-casa-text-primary">
                            {r.requestReference}
                          </div>
                          <div className="text-[11px] text-casa-text-muted flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-casa-text-primary">{r.userName || 'Marketplace User'}</div>
                          <div className="text-[11px] font-mono text-casa-text-muted">
                            {r.userMobile || 'No mobile provided'}
                          </div>
                          {r.userEmail && (
                            <div className="text-[10px] text-casa-text-muted truncate max-w-[160px]">
                              {r.userEmail}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-casa-text-primary flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-casa-brand" />
                            {r.planName}
                          </div>
                          <div className="text-[11px] text-casa-text-muted capitalize">
                            Period: {r.billingPeriod.toLowerCase()}
                          </div>
                          {r.planFeatures && r.planFeatures.length > 0 && (
                            <div className="text-[10px] text-casa-text-muted mt-0.5">
                              {r.planFeatures.length} features included
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-casa-brand text-sm">
                            ₹{r.planPrice.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {r.contactMethod === 'WHATSAPP' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <MessageCircle className="w-3 h-3 text-emerald-600" />
                              WhatsApp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              <PhoneCall className="w-3 h-3 text-blue-600" />
                              Phone Call
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {r.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                              Pending Approval
                            </span>
                          )}
                          {r.status === 'APPROVED' && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                Approved
                              </span>
                              {r.reviewedByName && (
                                <div className="text-[10px] text-casa-text-muted mt-0.5">
                                  by {r.reviewedByName}
                                </div>
                              )}
                            </div>
                          )}
                          {r.status === 'DENIED' && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Denied
                              </span>
                              {r.denialReason && (
                                <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 max-w-[140px] truncate" title={r.denialReason}>
                                  {r.denialReason}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {r.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => setApprovingRequest(r)}
                                className="text-xs py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setDenyingRequest(r);
                                  setDenialReason('');
                                }}
                                className="text-xs py-1 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 flex items-center gap-1"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                Deny
                              </Button>
                            </div>
                          ) : (
                            <div className="text-[11px] text-casa-text-muted">
                              Processed
                              {r.reviewedAt && (
                                <span className="block text-[10px]">
                                  {new Date(r.reviewedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Requests Pagination */}
          {requestTotalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-casa-text-secondary pt-2">
              <span>Total {requestTotalRecords} subscription requests</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={requestPage <= 1}
                  onClick={() => setRequestPage((p) => Math.max(1, p - 1))}
                  className="text-xs"
                >
                  Previous
                </Button>
                <span>
                  Page {requestPage} of {requestTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={requestPage >= requestTotalPages}
                  onClick={() => setRequestPage((p) => Math.min(requestTotalPages, p + 1))}
                  className="text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRANSACTIONS & PAYMENT LEDGER */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          {metrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              {TRANSACTION_STATUS_FILTERS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    setSelectedTxStatus(tab.value);
                    setTxPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedTxStatus === tab.value
                      ? 'bg-casa-brand text-white'
                      : 'text-casa-text-secondary hover:bg-casa-canvas'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-auto md:min-w-[260px]">
              <Search className="w-4 h-4 text-casa-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Order ID, user, mobile..."
                value={txSearchQuery}
                onChange={(e) => {
                  setTxSearchQuery(e.target.value);
                  setTxPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary focus:outline-none focus:border-casa-brand"
              />
            </div>
          </div>

          {/* Transactions Table */}
          <Card className="bg-casa-surface border border-casa-border-light shadow-subtle overflow-hidden">
            {isTransactionsLoading ? (
              <div className="p-12 text-center text-xs text-casa-text-muted">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-casa-brand" />
                Loading...
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
                          <div className="font-semibold text-casa-text-primary">{t.userName || 'myproperty User'}</div>
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

          {/* Transactions Pagination */}
          {txTotalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-casa-text-secondary pt-2">
              <span>Total {txTotalRecords} transaction records</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={txPage <= 1}
                  onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                  className="text-xs"
                >
                  Previous
                </Button>
                <span>
                  Page {txPage} of {txTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={txPage >= txTotalPages}
                  onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
                  className="text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* APPROVE CONFIRMATION DIALOG */}
      {approvingRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-casa-surface border border-casa-border-light p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-casa-border-light">
              <h3 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <UserCheck className="w-4 h-4" />
                </div>
                Approve Subscription Request
              </h3>
              <button
                onClick={() => setApprovingRequest(null)}
                className="p-1 rounded-lg hover:bg-casa-canvas text-casa-text-muted hover:text-casa-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-casa-canvas rounded-xl text-xs space-y-2 border border-casa-border-light">
              <div className="flex justify-between">
                <span className="text-casa-text-muted">Request Reference:</span>
                <span className="font-mono font-bold text-casa-text-primary">
                  {approvingRequest.requestReference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-casa-text-muted">Customer Name:</span>
                <span className="font-semibold text-casa-text-primary">
                  {approvingRequest.userName || 'Marketplace User'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-casa-text-muted">Registered Mobile:</span>
                <span className="font-mono text-casa-text-primary">
                  {approvingRequest.userMobile || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-casa-text-muted">Requested Plan:</span>
                <span className="font-bold text-casa-brand">
                  {approvingRequest.planName} (₹{approvingRequest.planPrice.toLocaleString()} / {approvingRequest.billingPeriod.toLowerCase()})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-casa-text-muted">Contact Channel:</span>
                <span className="font-semibold text-casa-text-primary">
                  {approvingRequest.contactMethod === 'WHATSAPP' ? 'WhatsApp Chat' : 'Phone Call'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Immediate Activation:</strong> Approving this request will immediately assign the{' '}
                <strong>{approvingRequest.planName}</strong> plan, grant property listing quotas, video reels, and lead CRM entitlements for the user. No re-login will be required.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setApprovingRequest(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isApproving}
                onClick={handleConfirmApprove}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {isApproving ? 'Activating Plan...' : 'Confirm & Activate Subscription'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* DENY CONFIRMATION DIALOG */}
      {denyingRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-casa-surface border border-casa-border-light p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-casa-border-light">
              <h3 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  <UserX className="w-4 h-4" />
                </div>
                Deny Subscription Request
              </h3>
              <button
                onClick={() => setDenyingRequest(null)}
                className="p-1 rounded-lg hover:bg-casa-canvas text-casa-text-muted hover:text-casa-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-casa-canvas rounded-xl text-xs space-y-2 border border-casa-border-light">
              <div className="flex justify-between">
                <span className="text-casa-text-muted">Request Reference:</span>
                <span className="font-mono font-bold text-casa-text-primary">
                  {denyingRequest.requestReference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-casa-text-muted">Customer Name:</span>
                <span className="font-semibold text-casa-text-primary">
                  {denyingRequest.userName || 'Marketplace User'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-casa-text-muted">Requested Plan:</span>
                <span className="font-bold text-casa-text-primary">
                  {denyingRequest.planName}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-casa-text-primary block mb-1">
                Reason for Denial (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Payment not verified, invalid contact number, or duplicate request"
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                className="w-full p-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-rose-500"
              />
              <span className="text-[11px] text-casa-text-muted mt-1 block">
                This reason will be visible to the user in their billing history.
              </span>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Safe Denial:</strong> This action will mark the request as Denied without changing the user's existing account status or entitlements. The user will be able to submit a new subscription request later.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDenyingRequest(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isDenying}
                onClick={handleConfirmDeny}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5"
              >
                <UserX className="w-3.5 h-3.5" />
                {isDenying ? 'Recording Denial...' : 'Confirm Denial'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* REFUND MODAL */}
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
