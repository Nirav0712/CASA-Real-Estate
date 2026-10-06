'use client';

import * as React from 'react';
import { EngagementAdminService, AdminReview } from '@/services/engagement-service';
import {
  Star,
  CheckCircle,
  XCircle,
  EyeOff,
  Trash2,
  Filter,
  RefreshCw,
  Building,
  User,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = React.useState<AdminReview[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const fetchReviews = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await EngagementAdminService.getAllReviews(
        statusFilter === 'ALL' ? undefined : statusFilter
      );
      if (res.success && res.data) {
        setReviews(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setProcessingId(id);
      const res = await EngagementAdminService.updateReviewStatus(id, status);
      if (res.success) {
        setReviews((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: status as any } : r))
        );
      }
    } catch {
      // Ignore
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      setProcessingId(id);
      const res = await EngagementAdminService.deleteReview(id);
      if (res.success) {
        setReviews((prev) => prev.filter((r) => r._id !== id));
      }
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
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            Customer Reviews Moderation
          </h1>
          <p className="text-xs text-casa-text-secondary mt-1">
            Audit user ratings, approve verified feedback, or remove abusive reviews before public display.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-casa-surface border border-casa-border-light p-1 rounded-xl">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'HIDDEN'].map((st) => (
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

          <Button
            size="sm"
            variant="outline"
            onClick={fetchReviews}
            className="text-xs h-8 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Reviews Table / List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-casa-surface rounded-2xl border border-casa-border-light animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 bg-casa-surface border border-dashed border-casa-border-light rounded-2xl">
          <Star className="w-10 h-10 text-casa-text-muted mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-semibold text-casa-text-primary">No reviews found</h3>
          <p className="text-xs text-casa-text-muted mt-0.5">
            There are currently no reviews matching the selected filter ({statusFilter}).
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev._id}
              className="bg-casa-surface p-5 rounded-2xl border border-casa-border-light hover:border-casa-brand/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-subtle"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= rev.rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-zinc-300 dark:text-zinc-700'
                        }`}
                      />
                    ))}
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      rev.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : rev.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : rev.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                    }`}
                  >
                    {rev.status}
                  </span>

                  <span className="text-[11px] text-casa-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {rev.comment && (
                  <p className="text-xs text-casa-text-primary leading-relaxed bg-casa-canvas p-3 rounded-xl border border-casa-border-light">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-casa-text-secondary pt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-casa-brand" />
                    <strong>Reviewer:</strong> {rev.userId?.name || 'User'} ({rev.userId?.mobile || rev.userId?.email || 'N/A'})
                  </span>
                  {rev.propertyId && (
                    <span className="flex items-center gap-1 truncate max-w-xs">
                      <Building className="w-3.5 h-3.5 text-casa-brand" />
                      <strong>Property:</strong> {typeof rev.propertyId.title === 'string' ? rev.propertyId.title : rev.propertyId.title?.en || 'Listing'}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 self-end md:self-center">
                {rev.status !== 'APPROVED' && (
                  <Button
                    size="sm"
                    disabled={processingId === rev._id}
                    onClick={() => handleUpdateStatus(rev._id, 'APPROVED')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </Button>
                )}

                {rev.status !== 'REJECTED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={processingId === rev._id}
                    onClick={() => handleUpdateStatus(rev._id, 'REJECTED')}
                    className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200 h-8 flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </Button>
                )}

                {rev.status !== 'HIDDEN' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={processingId === rev._id}
                    onClick={() => handleUpdateStatus(rev._id, 'HIDDEN')}
                    className="text-xs text-zinc-600 hover:bg-zinc-100 border-zinc-200 h-8 flex items-center gap-1"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide</span>
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  disabled={processingId === rev._id}
                  onClick={() => handleDelete(rev._id)}
                  className="text-xs text-rose-500 hover:bg-rose-50 h-8 w-8 p-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
