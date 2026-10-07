'use client';

import * as React from 'react';
import { Card, Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast-context';
import {
  UserCheck,
  Award,
  Search,
  Building2,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  getAdminAgents,
  verifyAdminAgent,
  rejectAdminAgent,
  revokeAdminAgent,
  getAdminAgentVerificationDetail,
} from '@/services/admin-service';
import {
  AgentRecord,
  AgentVerificationDetailResponse,
  AgentDocumentRecord,
} from '@/types';
import { FileText, CheckCircle2, XCircle, ExternalLink, Eye, X } from 'lucide-react';

export default function AgentsPage() {
  const toast = useToast();

  const [agents, setAgents] = React.useState<AgentRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [verifiedFilter, setVerifiedFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalAgents, setTotalAgents] = React.useState(0);

  // Review Application Modal State
  const [reviewAgent, setReviewAgent] = React.useState<AgentRecord | null>(null);
  const [verificationDetail, setVerificationDetail] =
    React.useState<AgentVerificationDetailResponse | null>(null);
  const [reviewLoading, setReviewLoading] = React.useState(false);

  // Action State
  const [actionAgent, setActionAgent] = React.useState<AgentRecord | null>(null);
  const [actionType, setActionType] = React.useState<'verify' | 'reject' | 'revoke'>('verify');
  const [actionReason, setActionReason] = React.useState('');
  const [submittingAction, setSubmittingAction] = React.useState(false);

  const handleOpenReviewModal = async (agent: AgentRecord) => {
    setReviewAgent(agent);
    setReviewLoading(true);
    try {
      const detail = await getAdminAgentVerificationDetail(agent.id);
      setVerificationDetail(detail);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load application';
      toast.error('Failed to load application', msg);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleOpenActionModal = (agent: AgentRecord, type: 'verify' | 'reject' | 'revoke') => {
    setActionAgent(agent);
    setActionType(type);
    setActionReason('');
  };

  const handleConfirmAction = async () => {
    if (!actionAgent) return;
    if (actionType === 'reject' && !actionReason.trim()) {
      toast.error('Rejection Reason Required', 'Please provide a clear governance rejection reason.');
      return;
    }
    try {
      setSubmittingAction(true);
      if (actionType === 'verify') {
        await verifyAdminAgent(actionAgent.id, actionReason);
        toast.success(
          'Badge Granted',
          `CASA Verified Agent badge awarded to ${actionAgent.name}.`,
        );
      } else if (actionType === 'reject') {
        await rejectAdminAgent(actionAgent.id, actionReason.trim());
        toast.info(
          'Application Rejected',
          `Verification rejected for ${actionAgent.name}.`,
        );
      } else {
        await revokeAdminAgent(actionAgent.id, actionReason);
        toast.info(
          'Badge Revoked',
          `CASA Verified Agent badge revoked for ${actionAgent.name}.`,
        );
      }
      setActionAgent(null);
      setReviewAgent(null);
      loadAgents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not complete verification update';
      toast.error('Operation Failed', msg);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadAgents = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminAgents({
        page,
        limit: 12,
        q: debouncedSearch,
        verified: verifiedFilter,
        status: statusFilter,
      });
      setAgents(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalAgents(res.pagination?.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load agent queue';
      setError(msg);
      toast.error('Load Failed', msg);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, verifiedFilter, statusFilter, toast]);

  React.useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-casa-brand-subtle rounded-xl text-casa-brand">
              <UserCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              Agents & RERA Verification Queue
            </h1>
            <span className="text-xs px-2.5 py-1 bg-casa-subtle rounded-full font-bold text-casa-text-secondary border border-casa-border-light">
              {totalAgents} Registered Agents
            </span>
          </div>
          <p className="text-xs md:text-sm text-casa-text-secondary mt-1">
            Audit agent RERA registrations, professional credentials, and verified badge compliance.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadAgents}
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
              placeholder="Search by agent name, mobile, agency, RERA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl focus:outline-none focus:ring-2 focus:ring-casa-brand/30 text-casa-text-primary placeholder:text-casa-text-muted"
            />
          </div>

          <select
            value={verifiedFilter}
            onChange={(e) => {
              setVerifiedFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Verification Status"
            className="py-2 px-3 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30"
          >
            <option value="ALL">All Verification</option>
            <option value="true">Verified Badge Active</option>
            <option value="false">Pending / Unverified</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Status"
            className="py-2 px-3 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Accounts</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
        </div>
      </Card>

      {/* Grid Content */}
      {loading ? (
        <div className="p-16 text-center text-casa-text-muted flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-casa-brand" />
          <p className="text-xs">Loading live MongoDB agent records...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center text-red-500 space-y-2">
          <AlertTriangle className="w-6 h-6 mx-auto" />
          <p className="text-xs font-semibold">{error}</p>
          <Button variant="outline" size="sm" onClick={loadAgents} className="text-xs">
            Retry
          </Button>
        </div>
      ) : agents.length === 0 ? (
        <Card className="p-12 text-center text-casa-text-muted space-y-2 bg-casa-surface border border-casa-border-light">
          <UserCheck className="w-8 h-8 mx-auto text-casa-text-muted/50" />
          <p className="text-sm font-semibold text-casa-text-primary">No agents found</p>
          <p className="text-xs">No registered agent accounts match the selected filters.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((ag) => (
            <Card
              key={ag.id}
              className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle flex flex-col justify-between space-y-4 hover:border-casa-brand/40 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ag.isVerifiedAgent
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {ag.isVerifiedAgent ? 'CASA VERIFIED' : 'PENDING BADGE'}
                  </span>
                  <span className="text-[10px] text-casa-text-muted">
                    {ag.createdAt ? new Date(ag.createdAt).toLocaleDateString() : 'Joined'}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-casa-text-primary flex items-center gap-1.5">
                    {ag.name}
                    {ag.isVerifiedAgent && (
                      <span title="CASA Verified Agent">
                        <Award className="w-4 h-4 text-emerald-600" />
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-casa-brand-subtle text-casa-brand">
                      {ag.role?.replace('_', ' ') || 'AGENT'}
                    </span>
                    <div className="text-xs text-casa-text-secondary flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-casa-text-muted" />
                      <span className="truncate max-w-[180px]">{ag.agencyName || 'Independent Agent'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-casa-text-muted pt-3 border-t border-casa-border-light">
                  <div className="flex items-center justify-between">
                    <span>RERA Registration:</span>
                    <strong className="text-casa-text-primary font-mono text-[11px]">
                      {ag.reraNumber || 'NOT SUBMITTED'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Mobile:</span>
                    <strong className="text-casa-text-primary">
                      {ag.normalizedMobile || ag.mobile}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active / Total Listings:</span>
                    <strong className="text-casa-brand font-bold">
                      {ag.activeListings} / {ag.totalListings}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenReviewModal(ag)}
                  className="w-full text-xs flex items-center justify-center gap-1.5 border-casa-border-light hover:bg-casa-subtle"
                >
                  <Eye className="w-3.5 h-3.5 text-casa-brand" />
                  Review Application
                </Button>

                {ag.isVerifiedAgent ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenActionModal(ag, 'revoke')}
                    className="w-full text-xs hover:bg-red-50 hover:text-red-600 border-casa-border-light"
                  >
                    Revoke Verified Badge
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenActionModal(ag, 'reject')}
                      className="flex-1 text-xs hover:bg-rose-50 hover:text-rose-600 border-casa-border-light"
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenActionModal(ag, 'verify')}
                      className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle flex items-center justify-between text-xs text-casa-text-muted">
          <div>
            Showing Page <strong className="text-casa-text-primary">{page}</strong> of{' '}
            <strong className="text-casa-text-primary">{totalPages}</strong> ({totalAgents} agents)
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
        </Card>
      )}

      {/* Full Verification Review Modal */}
      {reviewAgent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-casa-surface border border-casa-border-light rounded-3xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-casa-border-light">
              <div>
                <h3 className="text-lg font-bold text-casa-text-primary flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-casa-brand" />
                  RERA Verification Review: {reviewAgent.name}
                </h3>
                <p className="text-xs text-casa-text-secondary">
                  {reviewAgent.agencyName || 'Independent Agent'} • {reviewAgent.normalizedMobile}
                </p>
              </div>
              <button
                onClick={() => {
                  setReviewAgent(null);
                  setVerificationDetail(null);
                }}
                className="p-2 text-casa-text-muted hover:text-casa-text-primary rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewLoading ? (
              <div className="p-12 text-center text-xs text-casa-text-muted flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-casa-brand" />
                <span>Loading submitted compliance portfolio...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* RERA Details */}
                <div className="bg-casa-canvas p-4 rounded-2xl border border-casa-border-light space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-casa-text-primary">
                    Registration Information
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-casa-text-muted block text-[10px]">RERA Number</span>
                      <strong className="text-casa-text-primary font-mono">
                        {verificationDetail?.profile?.reraNumber || reviewAgent.reraNumber || 'N/A'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-casa-text-muted block text-[10px]">State</span>
                      <strong className="text-casa-text-primary">
                        {verificationDetail?.profile?.reraState || 'Uttar Pradesh'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-casa-text-muted block text-[10px]">Authority</span>
                      <strong className="text-casa-text-primary">
                        {verificationDetail?.profile?.reraAuthority || 'UP-RERA'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Submitted Documents */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-casa-text-primary">
                    Compliance Documents ({verificationDetail?.documents?.length || 0})
                  </h4>

                  {(!verificationDetail?.documents || verificationDetail.documents.length === 0) ? (
                    <div className="p-6 border border-dashed border-casa-border-light rounded-2xl text-center text-xs text-casa-text-muted">
                      No uploaded documents attached to this agent.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {verificationDetail.documents.map((doc: AgentDocumentRecord) => (
                        <div
                          key={doc._id || doc.id}
                          className="p-3.5 bg-casa-canvas border border-casa-border-light rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-3">
                            <FileText className="w-4 h-4 text-casa-brand shrink-0" />
                            <div className="min-w-0">
                              <p className="font-semibold text-casa-text-primary truncate">{doc.documentName}</p>
                              <p className="text-[10px] text-casa-text-muted">
                                {doc.documentType} • Uploaded {new Date(doc.uploadedAt || doc.createdAt || Date.now()).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-casa-surface border border-casa-border-light text-casa-text-secondary uppercase">
                              {doc.status}
                            </span>
                            <a
                              href={doc.documentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-casa-brand hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-semibold">Inspect</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions inside Review Modal */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-casa-border-light">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenActionModal(reviewAgent, 'reject')}
                    className="text-xs text-rose-600 hover:bg-rose-50 border-casa-border-light"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Reject with Reason
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenActionModal(reviewAgent, 'verify')}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Approve & Grant Badge
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verification Confirmation Modal */}
      {actionAgent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-casa-surface border border-casa-border-light rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center gap-2 text-casa-text-primary">
              {actionType === 'verify' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-red-600" />
              )}
              <h3 className="text-base font-bold">
                {actionType === 'verify'
                  ? 'Grant CASA Verified Badge'
                  : actionType === 'reject'
                  ? 'Reject Agent Verification'
                  : 'Revoke CASA Verified Badge'}
              </h3>
            </div>
            <p className="text-xs text-casa-text-secondary">
              {actionType === 'verify'
                ? `Grant official CASA Verified Agent status to ${actionAgent.name}. This promotes their role to VERIFIED_AGENT and attaches the verified green badge across all their listings.`
                : actionType === 'reject'
                ? `Reject verification for ${actionAgent.name}. A governance reason is required to notify the agent.`
                : `Revoke verified status from ${actionAgent.name}. Their role will revert to regular AGENT and the badge will be removed.`}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-casa-text-muted uppercase">
                  Governance Notes / Rejection Reason {actionType === 'reject' ? '*' : ''}
                </label>
                <textarea
                  required={actionType === 'reject'}
                  placeholder={
                    actionType === 'verify'
                      ? 'e.g. Verified RERA Certificate against UP-RERA public portal...'
                      : actionType === 'reject'
                      ? 'e.g. Uploaded RERA certificate expired or illegible...'
                      : 'e.g. License revocation or compliance notice...'
                  }
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={2}
                  className="w-full mt-1 p-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-casa-border-light">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionAgent(null)}
                disabled={submittingAction}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmAction}
                disabled={submittingAction}
                className={`text-xs ${
                  actionType === 'verify'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : actionType === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {submittingAction
                  ? 'Processing...'
                  : actionType === 'verify'
                  ? 'Confirm Grant Badge'
                  : actionType === 'reject'
                  ? 'Confirm Rejection'
                  : 'Confirm Revocation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

