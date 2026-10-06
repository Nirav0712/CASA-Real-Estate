'use client';

import * as React from 'react';
import { EngagementAdminService, AdminReport } from '@/services/engagement-service';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Building,
  User,
  RefreshCw,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminReportsPage() {
  const [reports, setReports] = React.useState<AdminReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const fetchReports = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await EngagementAdminService.getAllReports(
        statusFilter === 'ALL' ? undefined : statusFilter
      );
      if (res.success && res.data) {
        setReports(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpdateStatus = async (id: string, status: string, actionNote?: string) => {
    try {
      setProcessingId(id);
      const res = await EngagementAdminService.updateReportStatus(id, {
        status,
        actionNote: actionNote || `Report marked as ${status} by admin operator.`,
      });
      if (res.success) {
        setReports((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: status as any, actionNote } : r))
        );
      }
    } catch {
      // Ignore
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnpublishListing = async (report: AdminReport) => {
    const propertyId = (report.propertyId as any)?._id || (report.propertyId as any)?.id;
    if (!propertyId) return;
    if (!confirm('Are you sure you want to unpublish and hide this listing from the public marketplace?')) return;
    try {
      setProcessingId(report._id);
      await EngagementAdminService.unpublishProperty(propertyId);
      await handleUpdateStatus(report._id, 'RESOLVED', 'Property was unpublished/taken down due to verified report.');
    } catch {
      // Ignore
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-casa-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-casa-text-primary flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
            Property Complaints & Abuse Reports
          </h1>
          <p className="text-xs text-casa-text-secondary mt-1">
            Review user-submitted fraud, wrong location, pricing discrepancies, and content violation reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-casa-surface border border-casa-border-light p-1 rounded-xl">
            {['ALL', 'PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-casa-brand text-white'
                    : 'text-casa-text-secondary hover:text-casa-text-primary'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchReports}
            className="text-xs h-8 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Reports Table / List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-casa-surface rounded-2xl border border-casa-border-light animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-casa-surface border border-dashed border-casa-border-light rounded-2xl">
          <ShieldAlert className="w-10 h-10 text-casa-text-muted mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-semibold text-casa-text-primary">No complaints found</h3>
          <p className="text-xs text-casa-text-muted mt-0.5">
            There are currently no property reports matching the selected status ({statusFilter}).
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((rep) => (
            <div
              key={rep._id}
              className="bg-casa-surface p-5 rounded-2xl border border-casa-border-light hover:border-casa-brand/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-subtle"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
                    {rep.reason.replace(/_/g, ' ')}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      rep.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : rep.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : rep.status === 'UNDER_REVIEW'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                    }`}
                  >
                    {rep.status.replace(/_/g, ' ')}
                  </span>

                  <span className="text-[11px] text-casa-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(rep.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {rep.description && (
                  <p className="text-xs text-casa-text-primary leading-relaxed bg-casa-canvas p-3 rounded-xl border border-casa-border-light">
                    <strong>Complaint:</strong> {rep.description}
                  </p>
                )}

                {rep.actionNote && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg">
                    <strong>Admin Note:</strong> {rep.actionNote}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-casa-text-secondary pt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-casa-brand" />
                    <strong>Reported by:</strong> {rep.reportedBy?.name || 'User'} ({rep.reportedBy?.mobile || rep.reportedBy?.email || 'N/A'})
                  </span>
                  {rep.propertyId && (
                    <span className="flex items-center gap-1 truncate max-w-xs">
                      <Building className="w-3.5 h-3.5 text-casa-brand" />
                      <strong>Property:</strong> {typeof rep.propertyId.title === 'string' ? rep.propertyId.title : rep.propertyId.title?.en || 'Listing'}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 self-end md:self-center">
                {rep.status === 'PENDING' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={processingId === rep._id}
                    onClick={() => handleUpdateStatus(rep._id, 'UNDER_REVIEW')}
                    className="text-xs text-blue-600 hover:bg-blue-50 border-blue-200 h-8 flex items-center gap-1"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Review</span>
                  </Button>
                )}

                {rep.status !== 'RESOLVED' && (
                  <Button
                    size="sm"
                    disabled={processingId === rep._id}
                    onClick={() => handleUpdateStatus(rep._id, 'RESOLVED')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Resolve</span>
                  </Button>
                )}

                {rep.status !== 'REJECTED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={processingId === rep._id}
                    onClick={() => handleUpdateStatus(rep._id, 'REJECTED')}
                    className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200 h-8 flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Dismiss</span>
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  disabled={processingId === rep._id}
                  onClick={() => handleUnpublishListing(rep)}
                  className="text-xs text-amber-700 hover:bg-amber-50 border-amber-300 h-8 flex items-center gap-1"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Unpublish</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
