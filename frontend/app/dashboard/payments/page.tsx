'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { getMyPayments, getPaymentById } from '@/services/payment-service';
import { PaymentItem, PaginatedResponse, PaymentStatus } from '@/types';
import { formatPrice } from '@/lib/utils';
import {
  CreditCard,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  RefreshCw,
  X,
  Building,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

const STATUS_FILTERS: { label: string; value?: PaymentStatus }[] = [
  { label: 'All Transactions' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Refunded', value: 'REFUNDED' },
  { label: 'Failed', value: 'FAILED' },
];

export default function UserPaymentsPage() {
  const { isAuthenticated, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const toast = useToast();

  const [paymentsData, setPaymentsData] = React.useState<PaginatedResponse<PaymentItem>>({
    data: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  });

  const [selectedStatus, setSelectedStatus] = React.useState<PaymentStatus | undefined>();
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedPayment, setSelectedPayment] = React.useState<PaymentItem | null>(null);

  const loadPayments = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await getMyPayments({
        page,
        limit: 10,
        status: selectedStatus,
      });
      setPaymentsData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load transaction history.';
      toast.error('Load Error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, page, selectedStatus, toast]);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadPayments();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading, loadPayments]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-casa-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading Billing History...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <CreditCard className="w-12 h-12 text-slate-300 mb-3" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Login Required</h2>
        <p className="text-slate-600 max-w-md mb-6">
          Sign in with your account to view your receipts, featured property upgrades, and payment history.
        </p>
        <button
          onClick={openAuthModal}
          className="px-6 py-2.5 bg-casa-600 text-white rounded-xl font-medium shadow-sm hover:bg-casa-700"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">Payments & Invoices</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-casa-50 text-casa-700 border border-casa-200">
              {paymentsData.pagination.total} Total
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Complete transaction ledger for featured listings, broker subscriptions, and promotions.
          </p>
        </div>

        <button
          onClick={loadPayments}
          className="inline-flex items-center px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => {
              setSelectedStatus(tab.value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedStatus === tab.value
                ? 'bg-casa-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Payments Table / List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {paymentsData.data.length === 0 ? (
          <div className="text-center py-16">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No payment records found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              You have no payment receipts matching this filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paymentsData.data.map((payment) => (
              <div
                key={payment.id}
                onClick={() => setSelectedPayment(payment)}
                className="p-4 sm:p-5 hover:bg-slate-50/80 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-slate-900 text-sm">
                      {payment.productName || payment.purpose.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        payment.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : payment.status === 'PENDING' || payment.status === 'CREATED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : payment.status === 'REFUNDED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="font-mono text-slate-700">{payment.orderId}</span>
                    <span>•</span>
                    <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                    {payment.providerOrderId && (
                      <>
                        <span>•</span>
                        <span className="text-[11px] text-slate-400">Ref: {payment.providerOrderId}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-base font-bold text-slate-900">{formatPrice(payment.amount)}</div>
                    <div className="text-[10px] text-slate-400 font-medium uppercase">{payment.provider}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {paymentsData.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {paymentsData.pagination.page} of {paymentsData.pagination.totalPages}
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={!paymentsData.pagination.hasPreviousPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 rounded-lg disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={!paymentsData.pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 rounded-lg disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-casa-50 text-casa-600 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">Transaction Receipt</h3>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center py-2 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount Paid</span>
              <div className="text-3xl font-bold text-slate-900">{formatPrice(selectedPayment.amount)}</div>
              <span
                className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  selectedPayment.status === 'PAID'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : selectedPayment.status === 'REFUNDED'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {selectedPayment.status}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-semibold text-slate-900">
                  {selectedPayment.productName || selectedPayment.purpose}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono font-medium text-slate-700">{selectedPayment.orderId}</span>
              </div>
              {selectedPayment.providerPaymentId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Gateway Txn ID:</span>
                  <span className="font-mono font-medium text-slate-700">{selectedPayment.providerPaymentId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Date:</span>
                <span className="text-slate-700">
                  {selectedPayment.paidAt
                    ? new Date(selectedPayment.paidAt).toLocaleString()
                    : new Date(selectedPayment.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Gateway:</span>
                <span className="font-medium text-slate-700">{selectedPayment.provider}</span>
              </div>
              {selectedPayment.refundAmount ? (
                <div className="flex justify-between text-rose-600 font-semibold pt-1 border-t border-slate-200">
                  <span>Refunded:</span>
                  <span>{formatPrice(selectedPayment.refundAmount)}</span>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
