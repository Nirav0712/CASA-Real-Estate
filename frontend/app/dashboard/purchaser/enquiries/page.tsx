'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/contexts/toast-context';
import {
  getPurchaserEnquiries,
  getPurchaserEnquiryById,
  cancelPurchaserEnquiry,
} from '@/services/purchaser-service';
import { PurchaserEnquiryItem } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { formatPrice } from '@/lib/utils';
import {
  MessageSquare,
  Search,
  ExternalLink,
  Phone,
  Calendar,
  XCircle,
} from 'lucide-react';

const STATUS_TABS = [
  { key: 'ALL', label: 'All Enquiries' },
  { key: 'NEW', label: 'New' },
  { key: 'CONTACTED', label: 'Contacted' },
  { key: 'QUALIFIED', label: 'In Progress' },
  { key: 'CLOSED', label: 'Closed' },
];

interface EnquiryNoteItem {
  text: string;
  createdAt: string;
}

interface EnquiryDetailType extends PurchaserEnquiryItem {
  notes?: EnquiryNoteItem[];
}

export default function PurchaserEnquiriesPage() {
  const toast = useToast();
  const [enquiries, setEnquiries] = React.useState<PurchaserEnquiryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [page, setPage] = React.useState<number>(1);
  const [totalPages, setTotalPages] = React.useState<number>(1);

  // Selected enquiry for detail modal
  const [selectedEnquiry, setSelectedEnquiry] = React.useState<EnquiryDetailType | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState<boolean>(false);
  const [isCancelling, setIsCancelling] = React.useState<boolean>(false);

  const loadData = React.useCallback(
    async (p: number = 1, status: string = selectedStatus, q: string = searchQuery) => {
      try {
        setIsLoading(true);
        const res = await getPurchaserEnquiries({
          page: p,
          limit: 20,
          status: status === 'ALL' ? undefined : status,
          q: q.trim() || undefined,
        });
        setEnquiries(res.data || []);
        setPage(res.pagination.page);
        setTotalPages(res.pagination.totalPages);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load enquiries';
        toast.error('Load Error', msg);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedStatus, searchQuery, toast],
  );

  React.useEffect(() => {
    loadData(page, selectedStatus, searchQuery);
  }, [loadData, page, selectedStatus, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData(1, selectedStatus, searchQuery);
  };

  const handleOpenDetail = async (enquiryId: string) => {
    try {
      const detail = (await getPurchaserEnquiryById(enquiryId)) as EnquiryDetailType;
      setSelectedEnquiry(detail);
      setIsDetailModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load enquiry details';
      toast.error('Error', msg);
    }
  };

  const handleCancelEnquiry = async (enquiryId: string) => {
    if (!confirm('Are you sure you want to close this enquiry?')) return;
    setIsCancelling(true);
    try {
      await cancelPurchaserEnquiry(enquiryId, 'Cancelled by purchaser');
      toast.success('Enquiry Closed', 'The enquiry has been marked as closed.');
      setIsDetailModalOpen(false);
      loadData(page, selectedStatus, searchQuery);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel enquiry';
      toast.error('Error', msg);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6 text-start">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-casa-brand" />
            <h2 className="text-xl md:text-2xl font-extrabold text-casa-text-primary tracking-tight">
              My Property Enquiries
            </h2>
          </div>
          <p className="text-xs text-casa-text-muted mt-1">
            Track and manage your inquiries sent to property owners and verified agents.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-casa-text-muted absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search enquiries..."
              className="w-full ps-9 pe-3 py-2 bg-casa-surface border border-casa-border-light rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-casa-brand"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="text-xs">
            Search
          </Button>
        </form>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 border-b border-casa-border-light text-xs">
        {STATUS_TABS.map((tab) => {
          const isActive = selectedStatus === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setSelectedStatus(tab.key);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-casa-brand text-white shadow-xs'
                  : 'bg-casa-surface text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle border border-casa-border-light'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-casa-surface border border-casa-border-light rounded-2xl"></div>
          ))}
        </div>
      ) : enquiries.length === 0 ? (
        <Card className="p-12 text-center border-casa-border-light space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 text-casa-brand flex items-center justify-center mx-auto shadow-subtle">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-casa-text-primary">No enquiries found</h3>
            <p className="text-xs text-casa-text-secondary max-w-md mx-auto">
              {selectedStatus !== 'ALL'
                ? `No enquiries with status "${selectedStatus}". Try selecting "All Enquiries".`
                : 'You have not submitted any property inquiries yet.'}
            </p>
          </div>
          <Link href="/properties" className="inline-block">
            <Button variant="primary" size="md" className="text-xs font-bold shadow-sm">
              <span>Browse Properties</span>
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {enquiries.map((enq) => {
            const statusClass =
              enq.status === 'NEW'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                : enq.status === 'CONTACTED'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                : enq.status === 'CLOSED'
                ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';

            return (
              <Card
                key={enq.id}
                className="p-5 border-casa-border-light hover:border-casa-brand/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group shadow-subtle"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {enq.property?.thumbnailUrl && (
                    <div className="relative w-20 h-16 rounded-xl overflow-hidden bg-casa-subtle flex-shrink-0">
                      <Image
                        src={enq.property.thumbnailUrl}
                        alt={enq.property.title || 'Property'}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusClass}`}>
                        {enq.status}
                      </span>
                      <span className="text-[11px] text-casa-text-muted flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Submitted {new Date(enq.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-casa-text-primary truncate group-hover:text-casa-brand transition-colors">
                      {enq.property?.title || 'Property Enquiry'}
                    </h3>

                    <p className="text-xs text-casa-text-secondary line-clamp-1 italic">
                      &ldquo;{enq.message}&rdquo;
                    </p>

                    {enq.property?.advertiser && (
                      <div className="flex items-center gap-2 text-[11px] text-casa-text-muted pt-1">
                        <span>Recipient: <strong>{enq.property.advertiser.name}</strong> ({enq.property.advertiser.role || 'Advertiser'})</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDetail(enq.id)}
                    className="text-xs font-semibold"
                  >
                    <span>View Timeline</span>
                  </Button>

                  {enq.property?.slug && (
                    <Link href={`/property/${enq.property.slug}`}>
                      <Button variant="secondary" size="sm" className="text-xs font-semibold">
                        <span>Property</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs"
              >
                Previous
              </Button>
              <span className="text-xs text-casa-text-secondary px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="text-xs"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Enquiry Details Modal */}
      {selectedEnquiry && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Enquiry Details & Timeline"
          description={`Reference ID: ${selectedEnquiry.id}`}
          size="lg"
        >
          <div className="space-y-6 text-start">
            {/* Property summary header */}
            {selectedEnquiry.property && (
              <div className="p-4 rounded-2xl bg-casa-canvas border border-casa-border-light flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-casa-text-primary">
                    {selectedEnquiry.property.title}
                  </h4>
                  <p className="text-xs text-casa-brand font-bold mt-0.5">
                    {formatPrice(selectedEnquiry.property.price)}
                  </p>
                  <p className="text-[11px] text-casa-text-muted mt-0.5">
                    {selectedEnquiry.property.location}
                  </p>
                </div>
                {selectedEnquiry.property.slug && (
                  <Link href={`/property/${selectedEnquiry.property.slug}`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      <span>View Listing</span>
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {/* Message snapshot */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-casa-text-muted">
                Your Initial Message
              </h5>
              <div className="p-3.5 rounded-xl bg-casa-subtle border border-casa-border-light text-xs text-casa-text-primary italic">
                &ldquo;{selectedEnquiry.message}&rdquo;
              </div>
            </div>

            {/* Advertiser details */}
            {selectedEnquiry.property?.advertiser && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-casa-text-muted">
                  Advertiser Contact
                </h5>
                <div className="p-3.5 rounded-xl bg-casa-canvas border border-casa-border-light flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-casa-text-primary block">
                      {selectedEnquiry.property.advertiser.name}
                    </span>
                    <span className="text-[11px] text-casa-text-muted">
                      {selectedEnquiry.property.advertiser.agencyName || selectedEnquiry.property.advertiser.role || 'Property Owner'}
                    </span>
                  </div>
                  {selectedEnquiry.property.advertiser.phone && (
                    <a href={`tel:${selectedEnquiry.property.advertiser.phone}`}>
                      <Button variant="outline" size="sm" className="text-xs font-semibold">
                        <Phone className="w-3.5 h-3.5 mr-1 text-casa-brand" />
                        <span>Call</span>
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Activity Notes / Timeline */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-casa-text-muted">
                Activity Timeline
              </h5>
              {(!selectedEnquiry.notes || selectedEnquiry.notes.length === 0) ? (
                <p className="text-xs text-casa-text-muted">No timeline updates recorded yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedEnquiry.notes.map((n: EnquiryNoteItem, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-casa-subtle text-xs border border-casa-border-light space-y-0.5">
                      <p className="text-casa-text-primary">{n.text}</p>
                      <span className="text-[10px] text-casa-text-muted block">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-casa-border-light">
              {selectedEnquiry.status !== 'CLOSED' ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isCancelling}
                  onClick={() => handleCancelEnquiry(selectedEnquiry.id)}
                  className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  <span>{isCancelling ? 'Closing...' : 'Close Enquiry'}</span>
                </Button>
              ) : (
                <span className="text-xs text-slate-500 font-semibold">
                  This enquiry is closed.
                </span>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-xs font-semibold"
              >
                Close Window
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
