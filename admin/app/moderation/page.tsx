'use client';

import * as React from 'react';
import { Card, Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/contexts/toast-context';
import { formatPrice } from '@/lib/utils';
import {
  getPendingModerationQueue,
  approveModerationProperty,
  rejectModerationProperty,
} from '@/services/admin-service';
import { AdminPropertyItem } from '@/types';
import {
  CheckSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  UserCheck,
  ShieldCheck,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function ModerationQueuePage() {
  const toast = useToast();
  const [queue, setQueue] = React.useState<AdminPropertyItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedItem, setSelectedItem] = React.useState<AdminPropertyItem | null>(null);
  const [isApproveOpen, setIsApproveOpen] = React.useState(false);
  const [isRejectOpen, setIsRejectOpen] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [adminNote, setAdminNote] = React.useState('');
  const [rejectReason, setRejectReason] = React.useState('INSUFFICIENT_DOCS');

  const loadQueue = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPendingModerationQueue();
      setQueue(result.queue || []);
    } catch {
      toast.error('Error', 'Failed to fetch pending moderation queue from server.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleApprove = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    try {
      const response = await approveModerationProperty(selectedItem.id, adminNote);
      if (response.success) {
        setQueue((prev) => prev.filter((i) => i.id !== selectedItem.id));
        toast.success(
          'Listing Approved',
          `"${selectedItem.title}" has been approved and published to the live marketplace.`,
        );
        setIsApproveOpen(false);
        setSelectedItem(null);
        setAdminNote('');
      } else {
        throw new Error(response.message || 'Approval unsuccessful');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to approve listing';
      toast.error('Approval Failed', message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    try {
      const response = await rejectModerationProperty(
        selectedItem.id,
        rejectReason,
        adminNote,
      );
      if (response.success) {
        setQueue((prev) => prev.filter((i) => i.id !== selectedItem.id));
        toast.warning(
          'Listing Rejected',
          `"${selectedItem.title}" was rejected (${rejectReason}).`,
        );
        setIsRejectOpen(false);
        setSelectedItem(null);
        setAdminNote('');
      } else {
        throw new Error(response.message || 'Rejection unsuccessful');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reject listing';
      toast.error('Rejection Failed', message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              Listing Moderation & Approval Queue
            </h1>
          </div>
          <p className="text-xs md:text-sm text-casa-text-secondary mt-1">
            Review submitted property advertisements before they go live on the public marketplace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadQueue}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
            {isLoading ? 'Loading...' : `${queue.length} Pending Review`}
          </span>
        </div>
      </div>

      {/* Queue Grid */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <Card className="p-12 text-center bg-casa-surface border border-casa-border-light shadow-subtle flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-casa-brand" />
            <p className="text-xs text-casa-text-secondary">Loading pending moderation records...</p>
          </Card>
        ) : queue.length === 0 ? (
          <Card className="p-12 text-center bg-casa-surface border border-casa-border-light shadow-subtle space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-casa-text-primary">All Clear!</h3>
            <p className="text-xs text-casa-text-secondary max-w-md mx-auto">
              There are currently no property listings waiting in the approval queue.
            </p>
          </Card>
        ) : (
          queue.map((item) => (
            <Card
              key={item.id}
              className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-casa-brand/40 transition-colors"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-casa-brand bg-casa-brand-subtle px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  {item.riskScore === 'HIGH' && (
                    <span className="text-[10px] font-bold text-red-700 bg-red-100 dark:bg-red-950 dark:text-red-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Flagged for Review
                    </span>
                  )}
                  <span className="text-[11px] text-casa-text-muted">
                    ID: {item.referenceId || item.id}
                  </span>
                </div>

                <h3 className="text-sm md:text-base font-bold text-casa-text-primary">
                  {item.title}
                </h3>

                <div className="flex items-center gap-4 text-xs text-casa-text-secondary flex-wrap">
                  <span className="font-bold text-casa-brand">{formatPrice(item.price)}</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-casa-text-muted" />
                    {item.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-casa-text-muted" />
                    {item.advertiserName} ({item.advertiserRole})
                  </span>
                </div>

                {item.reasonsFlagged && item.reasonsFlagged.length > 0 && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900 mt-2">
                    <strong>Moderation Alerts:</strong> {item.reasonsFlagged.join(', ')}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedItem(item);
                    setIsRejectOpen(true);
                  }}
                  className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-900"
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Reject
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedItem(item);
                    setIsApproveOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Approve & Publish
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Approve Modal */}
      <Modal
        isOpen={isApproveOpen}
        onClose={() => !isProcessing && setIsApproveOpen(false)}
        title="Approve Property Listing"
      >
        <div className="space-y-4">
          <p className="text-xs text-casa-text-secondary">
            Are you sure you want to approve <strong>{selectedItem?.title}</strong>? It will immediately become discoverable on the public marketplace.
          </p>
          <div>
            <label className="text-xs font-semibold text-casa-text-primary block mb-1">
              Internal Admin Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Verified registry documents with LDA portal"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              disabled={isProcessing}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl focus:outline-none focus:ring-2 focus:ring-casa-brand/30 text-casa-text-primary"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsApproveOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
            >
              {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isProcessing ? 'Approving...' : 'Confirm Approval'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => !isProcessing && setIsRejectOpen(false)}
        title="Reject Property Listing"
      >
        <div className="space-y-4">
          <p className="text-xs text-casa-text-secondary">
            Select a rejection reason for <strong>{selectedItem?.title}</strong>. The advertiser will receive notification of the moderation decision.
          </p>
          <div>
            <label className="text-xs font-semibold text-casa-text-primary block mb-1">
              Rejection Reason Code <span className="text-red-500">*</span>
            </label>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              disabled={isProcessing}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl focus:outline-none focus:ring-2 focus:ring-casa-brand/30 text-casa-text-primary"
            >
              <option value="INSUFFICIENT_DOCS">Insufficient Legal Ownership Documents</option>
              <option value="MISLEADING_TITLE">Misleading Title or Location Information</option>
              <option value="PRICE_UNREALISTIC">Unrealistic / Spammed Pricing</option>
              <option value="LOW_QUALITY_MEDIA">Low Quality or Copyrighted Images</option>
              <option value="DUPLICATE_LISTING">Duplicate Listing Already Exists</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-casa-text-primary block mb-1">
              Moderator Feedback / Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Please provide LDA approved map"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              disabled={isProcessing}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl focus:outline-none focus:ring-2 focus:ring-casa-brand/30 text-casa-text-primary"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRejectOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleReject}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5"
            >
              {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
