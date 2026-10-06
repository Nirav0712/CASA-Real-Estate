'use client';

import * as React from 'react';
import { AnalyticsAdminService, RiskFlagItem } from '@/services/analytics-service';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  RefreshCw,
  Search,
  Building,
  User,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminRiskFlagsPage() {
  const [flags, setFlags] = React.useState<RiskFlagItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [levelFilter, setLevelFilter] = React.useState<string>('ALL');
  const [isScanning, setIsScanning] = React.useState(false);
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const fetchFlags = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await AnalyticsAdminService.getRiskFlags(statusFilter, levelFilter);
      if (res.success && res.data) {
        setFlags(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter, levelFilter]);

  React.useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleRunScan = async () => {
    try {
      setIsScanning(true);
      const res = await AnalyticsAdminService.runRiskScan();
      if (res.success) {
        alert(`Scan completed. ${res.data?.flagsCreated || 0} potential risk anomalies identified.`);
        fetchFlags();
      }
    } catch {
      alert('Error running risk scan.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleResolve = async (id: string, status: string) => {
    const actionTaken = prompt(`Enter resolution note for marking as ${status}:`);
    if (actionTaken === null) return;
    try {
      setProcessingId(id);
      const res = await AnalyticsAdminService.resolveRiskFlag(id, status, actionTaken || `Updated to ${status}`);
      if (res.success) {
        setFlags((prev) =>
          prev.map((f) => (f._id === id ? { ...f, status: status as any, actionTaken } : f))
        );
      }
    } catch {
      // Ignore
    } finally {
      setProcessingId(null);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white uppercase">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white uppercase">HIGH RISK</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white uppercase">MEDIUM RISK</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white uppercase">LOW RISK</span>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-casa-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-casa-text-primary flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
            Fraud & Abuse Risk Management
          </h1>
          <p className="text-xs text-casa-text-secondary mt-1">
            Rule-based anomaly detection identifying duplicate property listings, pricing manipulation, and high-velocity spam.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            disabled={isScanning}
            onClick={handleRunScan}
            className="bg-casa-brand hover:bg-casa-brand-hover text-white text-xs h-8 flex items-center gap-1.5 shadow-xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isScanning ? 'Scanning...' : 'Run Fraud Scan'}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchFlags}
            className="text-xs h-8 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-casa-surface border border-casa-border-light p-1 rounded-xl">
          {['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'].map((st) => (
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
              {st}
            </button>
          ))}
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1 bg-casa-surface border border-casa-border-light p-1 rounded-xl">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevelFilter(lvl)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                levelFilter === lvl
                  ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900'
                  : 'text-casa-text-secondary hover:text-casa-text-primary'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Flags List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-casa-surface rounded-2xl border border-casa-border-light animate-pulse" />
          ))}
        </div>
      ) : flags.length === 0 ? (
        <div className="text-center py-16 bg-casa-surface border border-dashed border-casa-border-light rounded-2xl">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-60" />
          <h3 className="text-base font-bold text-casa-text-primary">No risk flags found</h3>
          <p className="text-xs text-casa-text-muted mt-0.5">
            No active anomalies or abuse patterns match the current filter selection.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {flags.map((flag) => (
            <div
              key={flag._id}
              className="bg-casa-surface p-5 rounded-2xl border border-casa-border-light hover:border-casa-brand/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-subtle"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {getRiskBadge(flag.riskLevel)}

                  <span className="text-xs font-bold text-casa-text-primary uppercase tracking-wider">
                    {flag.flagReason.replace(/_/g, ' ')}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      flag.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : flag.status === 'OPEN'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : flag.status === 'INVESTIGATING'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {flag.status}
                  </span>

                  <span className="text-[11px] text-casa-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(flag.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {flag.details && Object.keys(flag.details).length > 0 && (
                  <div className="p-3 bg-casa-canvas rounded-xl border border-casa-border-light text-xs text-casa-text-secondary">
                    <pre className="font-mono text-[11px] whitespace-pre-wrap">
                      {JSON.stringify(flag.details, null, 2)}
                    </pre>
                  </div>
                )}

                {flag.actionTaken && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 italic">
                    <strong>Resolution Note:</strong> {flag.actionTaken}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-casa-text-muted pt-1">
                  <span>
                    <strong>Target Type:</strong> {flag.targetType}
                  </span>
                  <span>
                    <strong>Target ID:</strong> {flag.targetId}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 self-end md:self-center">
                {flag.status === 'OPEN' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={processingId === flag._id}
                    onClick={() => handleResolve(flag._id, 'INVESTIGATING')}
                    className="text-xs text-blue-600 hover:bg-blue-50 border-blue-200 h-8 flex items-center gap-1"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Investigate</span>
                  </Button>
                )}

                {flag.status !== 'RESOLVED' && (
                  <Button
                    size="sm"
                    disabled={processingId === flag._id}
                    onClick={() => handleResolve(flag._id, 'RESOLVED')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Resolve</span>
                  </Button>
                )}

                {flag.status !== 'DISMISSED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={processingId === flag._id}
                    onClick={() => handleResolve(flag._id, 'DISMISSED')}
                    className="text-xs text-zinc-600 hover:bg-zinc-100 border-zinc-200 h-8 flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Dismiss</span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
