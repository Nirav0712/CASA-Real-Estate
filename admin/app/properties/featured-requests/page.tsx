'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/contexts/toast-context';
import { useAdminAuth } from '@/contexts/auth-context';
import { formatPrice } from '@/lib/utils';
import {
  Star,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  Building2,
  User,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  getAdminFeaturedRequests,
  approveAdminFeaturedRequest,
  rejectAdminFeaturedRequest,
} from '@/services/admin-service';
import { FeaturedPropertyRequestRecord } from '@/types';

export default function FeaturedRequestsAdminPage() {
  const toast = useToast();
  const { adminUser } = useAdminAuth();

  const [requests, setRequests] = React.useState<FeaturedPropertyRequestRecord[]>([]);
  const [summary, setSummary] = React.useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  // Approval Modal State
  const [approvingRequest, setApprovingRequest] = React.useState<FeaturedPropertyRequestRecord | null>(null);
  const [approvedDurationDays, setApprovedDurationDays] = React.useState<number>(30);
  const [approvedStartDate, setApprovedStartDate] = React.useState<string>('');
  const [isSubmittingApproval, setIsSubmittingApproval] = React.useState(false);

  // Rejection Modal State
  const [rejectingRequest, setRejectingRequest] = React.useState<FeaturedPropertyRequestRecord | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [isSubmittingRejection, setIsSubmittingRejection] = React.useState(false);

  // Search debounce
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadRequests = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminFeaturedRequests({
        status: statusFilter,
        search: debouncedSearch,
        page,
        limit: 15,
      });
      setRequests(res.requests || []);
      setSummary(res.summary || { total: 0, pending: 0, approved: 0, rejected: 0 });
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch featured requests';
      toast.error('Data Error', msg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, page, toast]);

  React.useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const openApproveModal = (req: FeaturedPropertyRequestRecord) => {
    setApprovingRequest(req);
    setApprovedDurationDays(req.durationDays || 30);
    setApprovedStartDate(req.requestedStartDate ? new Date(req.requestedStartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  };

  const handleApproveConfirm = async () => {
    if (!approvingRequest) return;
    setIsSubmittingApproval(true);
    try {
      await approveAdminFeaturedRequest(approvingRequest.id || approvingRequest._id!, {
        approvedDurationDays: Number(approvedDurationDays),
        approvedStartDate: approvedStartDate ? new Date(approvedStartDate).toISOString() : undefined,
      });
      toast.success(
        'Request Approved',
        `Property "${approvingRequest.propertyTitle}" has been approved for featured placement (${approvedDurationDays} days).`,
      );
      setApprovingRequest(null);
      await loadRequests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve request';
      toast.error('Approval Failed', msg);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const openRejectModal = (req: FeaturedPropertyRequestRecord) => {
    setRejectingRequest(req);
    setRejectionReason('');
  };

  const handleRejectConfirm = async () => {
    if (!rejectingRequest) return;
    setIsSubmittingRejection(true);
    try {
      await rejectAdminFeaturedRequest(
        rejectingRequest.id || rejectingRequest._id!,
        rejectionReason.trim(),
      );
      toast.info(
        'Request Rejected',
        `Featured promotion rejected. The property remains as a regular listing.`,
      );
      setRejectingRequest(null);
      await loadRequests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reject request';
      toast.error('Rejection Failed', msg);
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <Star className="w-5 h-5 fill-amber-500" />
            </span>
            <h1 className="text-2xl font-bold text-casa-text-primary">Featured Property Requests</h1>
          </div>
          <p className="text-xs text-casa-text-secondary mt-1">
            Review and govern Broker requests for premium featured placement on the CASA marketplace.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadRequests()}
            disabled={loading}
            className="text-xs flex items-center gap-1.5 border-casa-border-light hover:bg-casa-subtle"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/properties">
            <Button variant="outline" size="sm" className="text-xs border-casa-border-light">
              All Properties
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          onClick={() => { setStatusFilter('ALL'); setPage(1); }}
          className={`p-4 border cursor-pointer transition-all ${
            statusFilter === 'ALL'
              ? 'border-casa-brand ring-1 ring-casa-brand bg-casa-brand-subtle/20'
              : 'border-casa-border-light hover:bg-casa-subtle'
          }`}
        >
          <p className="text-[11px] text-casa-text-muted font-medium uppercase tracking-wider">Total Requests</p>
          <h3 className="text-2xl font-bold text-casa-text-primary mt-1">{summary.total}</h3>
        </Card>

        <Card
          onClick={() => { setStatusFilter('PENDING'); setPage(1); }}
          className={`p-4 border cursor-pointer transition-all ${
            statusFilter === 'PENDING'
              ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-500/10'
              : 'border-casa-border-light hover:bg-casa-subtle'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium uppercase tracking-wider">Awaiting Review</p>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">{summary.pending}</h3>
        </Card>

        <Card
          onClick={() => { setStatusFilter('APPROVED'); setPage(1); }}
          className={`p-4 border cursor-pointer transition-all ${
            statusFilter === 'APPROVED'
              ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-500/10'
              : 'border-casa-border-light hover:bg-casa-subtle'
          }`}
        >
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium uppercase tracking-wider">Approved & Active</p>
          <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{summary.approved}</h3>
        </Card>

        <Card
          onClick={() => { setStatusFilter('REJECTED'); setPage(1); }}
          className={`p-4 border cursor-pointer transition-all ${
            statusFilter === 'REJECTED'
              ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-500/10'
              : 'border-casa-border-light hover:bg-casa-subtle'
          }`}
        >
          <p className="text-[11px] text-rose-700 dark:text-rose-400 font-medium uppercase tracking-wider">Rejected</p>
          <h3 className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-1">{summary.rejected}</h3>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 border-casa-border-light bg-casa-surface space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-casa-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by property, broker, ref ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-hidden focus:border-casa-brand"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => { setStatusFilter(st); setPage(1); }}
                className={`px-3 py-1 text-xs rounded-xl font-medium transition-colors shrink-0 ${
                  statusFilter === st
                    ? 'bg-casa-brand text-white font-bold'
                    : 'bg-casa-canvas border border-casa-border-light text-casa-text-secondary hover:bg-casa-subtle'
                }`}
              >
                {st === 'ALL' ? 'All' : st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Requests List */}
      {loading ? (
        <div className="p-16 text-center text-xs text-casa-text-muted flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-casa-brand" />
          <span>Loading featured property promotion requests...</span>
        </div>
      ) : requests.length === 0 ? (
        <Card className="p-12 text-center border-casa-border-light bg-casa-surface space-y-3">
          <div className="w-12 h-12 rounded-full bg-casa-subtle text-casa-text-muted flex items-center justify-center mx-auto">
            <Star className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-casa-text-primary">No Featured Requests Found</h3>
          <p className="text-xs text-casa-text-muted max-w-sm mx-auto">
            {statusFilter !== 'ALL'
              ? `There are no requests matching filter "${statusFilter}".`
              : 'No broker has submitted a featured property request yet.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const isPending = req.status === 'PENDING';
            const isApproved = req.status === 'APPROVED';
            const isRejected = req.status === 'REJECTED';
            const isExpired = req.status === 'EXPIRED';

            return (
              <Card
                key={req.id || req._id}
                className="p-5 border-casa-border-light bg-casa-surface hover:border-casa-border-strong transition-all space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Property Info */}
                  <div className="flex items-start gap-4 min-w-0">
                    {req.propertyImage ? (
                      <img
                        src={req.propertyImage}
                        alt={req.propertyTitle || 'Property'}
                        className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-casa-border-light bg-casa-subtle"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-casa-subtle border border-casa-border-light flex items-center justify-center shrink-0 text-casa-text-muted">
                        <Building2 className="w-8 h-8" />
                      </div>
                    )}

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isPending
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : isApproved
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : isRejected
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {req.status}
                        </span>
                        <span className="text-[10px] font-mono text-casa-text-muted">
                          Ref: {req.requestReference}
                        </span>
                        <span className="text-[10px] text-casa-text-muted">
                          Submitted: {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-casa-text-primary truncate">
                        {req.propertyTitle || 'Untitled Property'}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-casa-text-muted flex-wrap">
                        {req.propertyPrice && (
                          <span className="font-semibold text-casa-brand">
                            {formatPrice(req.propertyPrice)}
                          </span>
                        )}
                        {req.propertyLocation && <span>• {req.propertyLocation}</span>}
                      </div>

                      {/* Broker Details */}
                      <div className="flex items-center gap-2 pt-1 text-xs text-casa-text-secondary">
                        <User className="w-3.5 h-3.5 text-casa-text-muted" />
                        <span className="font-semibold text-casa-text-primary">{req.brokerName || 'Broker'}</span>
                        {req.brokerEmail && <span>({req.brokerEmail})</span>}
                        {req.brokerMobile && <span>• {req.brokerMobile}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Duration & Placement Spec */}
                  <div className="bg-casa-canvas p-3.5 rounded-2xl border border-casa-border-light space-y-1.5 lg:w-72 shrink-0 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-casa-text-muted">Requested Duration:</span>
                      <strong className="text-casa-text-primary font-bold">{req.durationDays} Days</strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-casa-text-muted">Proposed Start:</span>
                      <strong className="text-casa-text-primary">
                        {req.requestedStartDate ? new Date(req.requestedStartDate).toLocaleDateString() : 'Immediate on approval'}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-casa-text-muted">Proposed End:</span>
                      <strong className="text-casa-text-primary">
                        {req.requestedEndDate ? new Date(req.requestedEndDate).toLocaleDateString() : `${req.durationDays} days after start`}
                      </strong>
                    </div>

                    {isApproved && (
                      <div className="pt-1.5 border-t border-casa-border-light text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                        Approved: {req.approvedDurationDays || req.durationDays} Days (Active until{' '}
                        {req.approvedEndDate ? new Date(req.approvedEndDate).toLocaleDateString() : 'N/A'})
                      </div>
                    )}

                    {isRejected && req.rejectionReason && (
                      <div className="pt-1.5 border-t border-casa-border-light text-[11px] text-rose-600">
                        Reason: {req.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-casa-border-light">
                  <div className="text-xs text-casa-text-muted italic">
                    {req.notes ? `Broker Note: "${req.notes}"` : 'No additional broker notes.'}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Property Link */}
                    {req.propertySlug && (
                      <a
                        href={`http://localhost:3000/properties/${req.propertySlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-xs border border-casa-border-light rounded-xl hover:bg-casa-subtle text-casa-text-secondary flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Preview Property</span>
                      </a>
                    )}

                    {/* Actions for Pending */}
                    {isPending && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRejectModal(req)}
                          className="text-xs border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openApproveModal(req)}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve Featured
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-casa-text-muted">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 px-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approve Modal */}
      {approvingRequest && (
        <Modal
          isOpen={true}
          onClose={() => setApprovingRequest(null)}
          title="Approve Featured Property Placement"
          size="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-casa-canvas rounded-2xl border border-casa-border-light space-y-1">
              <span className="text-[10px] uppercase font-bold text-casa-text-muted">Property</span>
              <p className="text-xs font-bold text-casa-text-primary">{approvingRequest.propertyTitle}</p>
              <p className="text-[11px] text-casa-text-muted">Broker: {approvingRequest.brokerName}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-casa-text-primary">
                Approved Featured Duration
              </label>
              <select
                value={approvedDurationDays}
                onChange={(e) => setApprovedDurationDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-hidden focus:border-casa-brand"
              >
                <option value={7}>7 Days (Weekly Spotlight)</option>
                <option value={15}>15 Days (Fortnight Placement)</option>
                <option value={30}>30 Days (Full Month Premiere)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-casa-text-primary">
                Placement Start Date
              </label>
              <input
                type="date"
                value={approvedStartDate}
                onChange={(e) => setApprovedStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-hidden focus:border-casa-brand"
              />
              <p className="text-[10px] text-casa-text-muted">
                The property will appear as featured only during this approved active window and expire automatically.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-casa-border-light">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApprovingRequest(null)}
                disabled={isSubmittingApproval}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApproveConfirm}
                disabled={isSubmittingApproval}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmittingApproval ? 'Approving...' : 'Confirm Approval & Activate'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectingRequest && (
        <Modal
          isOpen={true}
          onClose={() => setRejectingRequest(null)}
          title="Reject Featured Property Request"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-casa-text-secondary">
              Rejecting this request will keep the property as a standard marketplace listing. Please provide a reason to inform the Broker.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-casa-text-primary">
                Rejection Reason (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Incomplete property documentation, low quality photos, or listing does not meet featured spotlight criteria."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-hidden focus:border-casa-brand"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-casa-border-light">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectingRequest(null)}
                disabled={isSubmittingRejection}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRejectConfirm}
                disabled={isSubmittingRejection}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isSubmittingRejection ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
