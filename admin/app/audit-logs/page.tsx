'use client';

import * as React from 'react';
import { Card, Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast-context';
import {
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { getAdminAuditLogs } from '@/services/admin-service';
import { AuditLogRecord } from '@/types';

export default function AuditLogsPage() {
  const toast = useToast();

  const [logs, setLogs] = React.useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters & Pagination
  const [actionFilter, setActionFilter] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalLogs, setTotalLogs] = React.useState(0);

  const loadLogs = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminAuditLogs({
        page,
        limit: 20,
        action: actionFilter,
      });
      setLogs(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalLogs(res.pagination?.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load audit logs';
      setError(msg);
      toast.error('Load Failed', msg);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, toast]);

  React.useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getActionBadgeClass = (action: string) => {
    if (action.includes('VERIF') || action.includes('APPROV')) {
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
    }
    if (action.includes('REJECT') || action.includes('SUSPEND') || action.includes('REVOK') || action.includes('DEACTIVAT')) {
      return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800';
    }
    if (action.includes('ROLE')) {
      return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800';
    }
    return 'bg-casa-subtle text-casa-text-primary border border-casa-border-light';
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-casa-brand-subtle rounded-xl text-casa-brand">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              Immutable Governance Audit Logs
            </h1>
            <span className="text-xs px-2.5 py-1 bg-casa-subtle rounded-full font-bold text-casa-text-secondary border border-casa-border-light">
              {totalLogs} Events
            </span>
          </div>
          <p className="text-xs md:text-sm text-casa-text-secondary mt-1">
            Complete traceability of administrative approvals, rejections, user status changes, and RBAC actions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-1 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Action"
            className="py-2 px-3 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30"
          >
            <option value="ALL">All Administrative Actions</option>
            <option value="USER_STATUS_CHANGED">USER_STATUS_CHANGED</option>
            <option value="USER_ROLE_CHANGED">USER_ROLE_CHANGED</option>
            <option value="AGENT_VERIFIED">AGENT_VERIFIED</option>
            <option value="AGENT_VERIFICATION_REVOKED">AGENT_VERIFICATION_REVOKED</option>
            <option value="PROPERTY_APPROVED">PROPERTY_APPROVED</option>
            <option value="PROPERTY_REJECTED">PROPERTY_REJECTED</option>
            <option value="PROPERTY_PUBLISHED">PROPERTY_PUBLISHED</option>
            <option value="PROPERTY_UNPUBLISHED">PROPERTY_UNPUBLISHED</option>
            <option value="PROPERTY_ARCHIVED">PROPERTY_ARCHIVED</option>
            <option value="PROPERTY_FEATURED">PROPERTY_FEATURED</option>
          </select>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="bg-casa-surface border border-casa-border-light shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-casa-text-muted flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-casa-brand" />
            <p className="text-xs">Loading live MongoDB audit log records...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 space-y-2">
            <AlertTriangle className="w-6 h-6 mx-auto" />
            <p className="text-xs font-semibold">{error}</p>
            <Button variant="outline" size="sm" onClick={loadLogs} className="text-xs">
              Retry
            </Button>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-casa-text-muted space-y-2">
            <ShieldCheck className="w-8 h-8 mx-auto text-casa-text-muted/50" />
            <p className="text-sm font-semibold text-casa-text-primary">No audit log records found</p>
            <p className="text-xs">Administrative actions will automatically appear here as they occur.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-casa-text-secondary">
              <thead className="bg-casa-subtle/50 text-[11px] uppercase font-bold text-casa-text-muted border-b border-casa-border-light">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor / Operator</th>
                  <th className="px-4 py-3">Action Type</th>
                  <th className="px-4 py-3">Target Entity / User</th>
                  <th className="px-4 py-3">Changes & Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-casa-border-light">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-casa-canvas/50 transition-colors">
                    <td className="px-4 py-3.5 text-casa-text-muted font-mono text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-casa-text-muted" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-casa-text-primary flex items-center gap-1">
                        <User className="w-3 h-3 text-casa-brand" />
                        {log.actorName || 'Admin Operator'}
                      </div>
                      <div className="text-[10px] text-casa-text-muted">
                        Role: <span className="font-bold">{log.actorRole}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${getActionBadgeClass(
                          log.action,
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-casa-text-primary">
                        {log.targetUserName || log.targetEntity || log.targetEntityId || '—'}
                      </div>
                      {log.targetUserId && (
                        <div className="text-[10px] text-casa-text-muted font-mono">
                          ID: {log.targetUserId}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {(log.previousValue !== undefined || log.newValue !== undefined) && (
                        <div className="flex items-center gap-1.5 text-[11px] font-mono">
                          <span className="text-casa-text-muted">
                            {typeof log.previousValue === 'object'
                              ? JSON.stringify(log.previousValue)
                              : String(log.previousValue ?? 'none')}
                          </span>
                          <ArrowRight className="w-3 h-3 text-casa-text-muted" />
                          <span className="font-bold text-casa-text-primary">
                            {typeof log.newValue === 'object'
                              ? JSON.stringify(log.newValue)
                              : String(log.newValue ?? 'none')}
                          </span>
                        </div>
                      )}
                      {log.reason && (
                        <div className="text-[11px] text-casa-text-secondary mt-0.5 italic">
                          &ldquo;{log.reason}&rdquo;
                        </div>
                      )}
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
              <strong className="text-casa-text-primary">{totalPages}</strong> ({totalLogs} log events)
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
