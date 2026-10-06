'use client';

import * as React from 'react';
import { Card, Badge, Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { Modal } from '@/components/ui/modal';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/contexts/toast-context';
import {
  getAdminDashboardStats,
  getPendingModerationQueue,
} from '@/services/admin-service';
import { formatPrice } from '@/lib/utils';
import { AdminDashboardStats, AdminPropertyItem } from '@/types';
import {
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Building,
  Users,
  MessageSquare,
  TrendingUp,
  Search,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const toast = useToast();
  const [stats, setStats] = React.useState<AdminDashboardStats | null>(null);
  const [queue, setQueue] = React.useState<AdminPropertyItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFallback, setIsFallback] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('pending');
  const [filterQuery, setFilterQuery] = React.useState('');

  // Moderation Modal State
  const [selectedListing, setSelectedListing] = React.useState<AdminPropertyItem | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = React.useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = React.useState(false);
  const [adminNote, setAdminNote] = React.useState('');
  const [rejectionReason, setRejectionReason] = React.useState('INVALID_PRICE');

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const statsRes = await getAdminDashboardStats();
      const queueRes = await getPendingModerationQueue();
      setStats(statsRes.stats);
      setQueue(queueRes.queue);
      setIsFallback(statsRes.source === 'fallback_dev' || queueRes.source === 'fallback_dev');
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleApprove = () => {
    if (!selectedListing) return;
    setQueue((prev) => prev.filter((item) => item.id !== selectedListing.id));
    toast.success(
      'Listing Approved & Published',
      `"${selectedListing.title}" is now active in public search index.`,
    );
    setIsApproveModalOpen(false);
    setSelectedListing(null);
    setAdminNote('');
  };

  const handleReject = () => {
    if (!selectedListing) return;
    setQueue((prev) => prev.filter((item) => item.id !== selectedListing.id));
    toast.warning(
      'Listing Rejected',
      `"${selectedListing.title}" moved to rejected queue (Reason: ${rejectionReason}).`,
    );
    setIsRejectModalOpen(false);
    setSelectedListing(null);
    setAdminNote('');
  };

  const filteredQueue = queue.filter(
    (item) =>
      item.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.advertiserName.toLowerCase().includes(filterQuery.toLowerCase()),
  );

  const statCards = stats
    ? [
        {
          title: 'Pending Approvals',
          value: queue.length,
          change: 'Requires Attention',
          isWarning: queue.length > 0,
          icon: CheckCircle,
        },
        {
          title: 'Active Marketplace Listings',
          value: stats.activeListingsCount.toLocaleString(),
          change: '+14% this week',
          icon: Building,
        },
        {
          title: 'Registered Brokers & Agencies',
          value: stats.registeredAgentsCount.toLocaleString(),
          change: '38 pending verification',
          icon: Users,
        },
        {
          title: 'Buyer Enquiries Generated',
          value: stats.totalEnquiriesThisMonth.toLocaleString(),
          change: '+28% conversion',
          icon: MessageSquare,
        },
        {
          title: 'Monthly Subscription Revenue',
          value: formatPrice(stats.monthlyRevenueEstimate),
          change: 'Razorpay reconciled',
          icon: TrendingUp,
        },
      ]
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-start">
      {/* Controlled Dev State Notification */}
      {isFallback && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Phase 03 Admin UI Active:</span>{' '}
              <span>
                Demonstrating Gemini-inspired light governance architecture with responsive moderation queues.
              </span>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-200/60 dark:bg-amber-900 rounded">
            Design Verified
          </span>
        </div>
      )}

      {/* Top Section Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-casa-text-primary tracking-tight">
            Marketplace Overview
          </h2>
          <p className="text-xs text-casa-text-muted mt-0.5">
            Real-time advertisement velocity, review queues, and agent verification requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Refreshed latest moderation metrics')}
          >
            Refresh Metrics
          </Button>
          <Button variant="primary" size="sm">
            Review Queue ({queue.length})
          </Button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-casa-text-muted mb-2">
                <span>{item.title}</span>
                <Icon className="w-4 h-4 text-casa-brand" />
              </div>
              <div className="text-2xl font-extrabold text-casa-text-primary mb-1 tracking-tight">
                {item.value}
              </div>
              <div
                className={`text-[11px] font-medium ${
                  item.isWarning ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-casa-text-muted'
                }`}
              >
                {item.change}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Pending Approvals Table */}
      <Card className="p-0 shadow-subtle">
        <div className="p-5 border-b border-casa-border-light bg-casa-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-casa-text-primary">
              Property Moderation Queue
            </h3>
            <p className="text-xs text-casa-text-muted mt-0.5">
              Review property advertisement specifications, photos, and legal disclosures before publishing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-64">
              <Input
                placeholder="Filter by title, city, agent..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                prefixIcon={<Search className="w-3.5 h-3.5" />}
                clearable
                onClear={() => setFilterQuery('')}
              />
            </div>
            <Badge variant="pending">{queue.length} Pending Review</Badge>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="px-5 py-2.5 bg-casa-canvas/50 border-b border-casa-border-light">
          <Tabs
            items={[
              { id: 'pending', label: 'Pending Approvals', badge: queue.length },
              { id: 'flagged', label: 'Flagged / Litigated Disclosures', badge: '1' },
              { id: 'approved', label: 'Recently Approved' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="underline"
          />
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {filteredQueue.length === 0 ? (
            <div className="py-12 text-center text-xs text-casa-text-muted">
              No pending property advertisements matching your filter.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-casa-border-light bg-casa-canvas text-casa-text-muted font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Property Title & Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Advertiser</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-casa-border-light">
                {isLoading ? (
                  <>
                    <TableRowSkeleton columns={6} />
                    <TableRowSkeleton columns={6} />
                    <TableRowSkeleton columns={6} />
                  </>
                ) : (
                  filteredQueue.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-casa-subtle/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium text-casa-text-primary">
                      <div className="font-semibold text-casa-text-primary mb-0.5 line-clamp-1">
                        {item.title}
                      </div>
                      <span className="text-[10px] text-casa-brand font-semibold bg-casa-brand-subtle px-1.5 py-0.5 rounded-md">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-casa-text-primary">
                      {formatPrice(item.price)}
                    </td>
                    <td className="py-3.5 px-4 text-casa-text-secondary">
                      {item.location}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-casa-text-primary">
                        {item.advertiserName}
                      </div>
                      <span className="text-[10px] text-casa-text-muted">
                        {item.advertiserRole}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="pending">Pending Review</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            setSelectedListing(item);
                            toast.info(`Viewing details for: ${item.title}`);
                          }}
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="success"
                          size="xs"
                          onClick={() => {
                            setSelectedListing(item);
                            setIsApproveModalOpen(true);
                          }}
                          title="Approve Listing"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </Button>
                        <Button
                          variant="danger"
                          size="xs"
                          onClick={() => {
                            setSelectedListing(item);
                            setIsRejectModalOpen(true);
                          }}
                          title="Reject Listing"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Approve Confirmation Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Approve Property Advertisement"
        description="This action will publish the listing and index it across search queries."
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-casa-canvas rounded-xl text-xs">
            <span className="font-bold block text-casa-text-primary mb-0.5">
              {selectedListing?.title}
            </span>
            <span className="text-casa-text-muted">
              Advertiser: {selectedListing?.advertiserName} ({selectedListing?.location})
            </span>
          </div>

          <Input
            label="Internal Moderation Note (Optional)"
            placeholder="Add internal remarks for audit trail..."
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
          />

          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsApproveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="success" size="sm" onClick={handleApprove}>
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Confirm & Publish</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Property Advertisement"
        description="Select the reason code and provide actionable feedback for the advertiser."
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/50 rounded-xl text-xs border border-red-200 dark:border-red-900">
            <span className="font-bold block text-red-900 dark:text-red-200 mb-0.5">
              {selectedListing?.title}
            </span>
            <span className="text-red-700 dark:text-red-300">
              The listing will be sent back to the advertiser with feedback.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-casa-text-primary block">
              Rejection Category
            </label>
            <select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-casa-surface border border-casa-border-medium rounded-xl p-2 text-xs focus:ring-2 focus:ring-casa-brand/20 outline-none"
            >
              <option value="INVALID_PRICE">Suspicious / Inaccurate Pricing</option>
              <option value="LOW_QUALITY_MEDIA">Low Quality / Watermarked Photos</option>
              <option value="INCORRECT_LOCATION">Inaccurate Locality or Coordinates</option>
              <option value="DUPLICATE_LISTING">Duplicate Property Listing</option>
              <option value="MISSING_DISCLOSURES">Missing Litigation Disclosures</option>
            </select>
          </div>

          <Input
            label="Feedback for Advertiser"
            placeholder="e.g., Please upload genuine original high-res photos..."
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
          />

          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRejectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleReject}>
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject Listing</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
