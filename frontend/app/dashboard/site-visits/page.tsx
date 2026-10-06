'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { EngagementService, SiteVisitItem } from '@/services/engagement-service';
import { Container, Card, Badge } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, RefreshCw, Building, AlertCircle } from 'lucide-react';

export default function SiteVisitsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [visits, setVisits] = React.useState<SiteVisitItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>('ALL');

  const isAgent = user?.role === 'AGENT' || user?.role === 'VERIFIED_AGENT' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const loadVisits = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await EngagementService.getMySiteVisits(isAgent ? 'AGENT' : 'BUYER');
      if (res.data) {
        let filtered = res.data;
        if (filter !== 'ALL') {
          filtered = filtered.filter((v) => v.status === filter);
        }
        setVisits(filtered);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  }, [isAgent, filter]);

  React.useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  const handleConfirm = async (id: string) => {
    try {
      await EngagementService.updateSiteVisitStatus(id, 'CONFIRMED', 'Confirmed by agent');
      toast.success('Site visit confirmed', 'The buyer has been notified.');
      loadVisits();
    } catch (err: any) {
      toast.error('Action failed', err.message);
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Please enter a cancellation reason:');
    if (reason === null) return;
    try {
      await EngagementService.updateSiteVisitStatus(id, 'CANCELLED', reason || 'Cancelled by user');
      toast.info('Site visit cancelled', 'Status updated.');
      loadVisits();
    } catch (err: any) {
      toast.error('Action failed', err.message);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await EngagementService.updateSiteVisitStatus(id, 'COMPLETED', 'Tour completed');
      toast.success('Site visit completed', 'Marked as completed.');
      loadVisits();
    } catch (err: any) {
      toast.error('Action failed', err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge className="bg-emerald-600 text-white font-bold text-[10px]">CONFIRMED</Badge>;
      case 'REQUESTED':
        return <Badge className="bg-amber-500 text-white font-bold text-[10px]">REQUESTED</Badge>;
      case 'RESCHEDULED':
        return <Badge className="bg-blue-600 text-white font-bold text-[10px]">RESCHEDULED</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-zinc-700 text-white font-bold text-[10px]">COMPLETED</Badge>;
      case 'CANCELLED':
      case 'REJECTED':
        return <Badge className="bg-red-600 text-white font-bold text-[10px]">CANCELLED</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-casa-canvas py-8">
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-casa-text-primary">
              {isAgent ? 'Assigned Site Visits & Tours' : 'My Booked Site Visits'}
            </h1>
            <p className="text-xs text-casa-text-secondary mt-0.5">
              Manage in-person property tours, scheduled time slots, and status confirmations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadVisits}
              className="flex items-center gap-1.5 text-xs border-zinc-300 dark:border-zinc-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['ALL', 'REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                filter === st
                  ? 'bg-casa-brand text-white shadow-xs'
                  : 'bg-casa-surface text-casa-text-secondary hover:text-casa-text-primary border border-casa-border-light'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* List Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-32 bg-casa-surface rounded-2xl border border-casa-border animate-pulse" />
            ))}
          </div>
        ) : visits.length === 0 ? (
          <div className="text-center py-16 bg-casa-surface border border-dashed border-casa-border-light rounded-2xl">
            <Calendar className="w-12 h-12 text-casa-text-muted mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-bold text-casa-text-primary">No site visits found</h3>
            <p className="text-xs text-casa-text-secondary max-w-sm mx-auto mt-1 mb-5">
              {isAgent
                ? 'You do not have any property tour requests assigned under this status.'
                : 'You have not scheduled any property site visits yet.'}
            </p>
            {!isAgent && (
              <Link href="/properties">
                <Button className="bg-casa-brand text-white text-xs">Browse Properties</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {visits.map((item) => (
              <Card key={item._id} className="p-5 border-casa-border-light hover:border-casa-brand/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-subtle">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {getStatusBadge(item.status)}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-casa-text-primary">
                      <Calendar className="w-3.5 h-3.5 text-casa-brand" />
                      <span>{new Date(item.preferredDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-casa-text-secondary">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.preferredTimeSlot}</span>
                    </div>
                  </div>

                  {item.propertyId && (
                    <div className="flex items-start gap-2 pt-1">
                      <Building className="w-4 h-4 text-casa-brand flex-shrink-0 mt-0.5" />
                      <div>
                        <Link
                          href={item.propertyId.slug ? `/property/${item.propertyId.slug}` : '#'}
                          className="font-bold text-sm text-casa-text-primary hover:text-casa-brand transition-colors line-clamp-1"
                        >
                          {typeof item.propertyId.title === 'string' ? item.propertyId.title : item.propertyId.title?.en || 'Property Details'}
                        </Link>
                        {item.propertyId.location && (
                          <div className="flex items-center gap-1 text-xs text-casa-text-secondary mt-0.5">
                            <MapPin className="w-3 h-3 text-casa-text-muted" />
                            <span>
                              {item.propertyId.location.locality ? `${item.propertyId.location.locality}, ` : ''}
                              {item.propertyId.location.city}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-casa-text-secondary pt-1 flex flex-wrap gap-4">
                    <span>
                      <strong>Contact:</strong> {item.buyerName} ({item.buyerMobile})
                    </span>
                    {item.message && (
                      <span className="italic text-casa-text-muted">
                        &ldquo;{item.message}&rdquo;
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                  {isAgent && item.status === 'REQUESTED' && (
                    <Button
                      size="sm"
                      onClick={() => handleConfirm(item._id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Confirm</span>
                    </Button>
                  )}

                  {isAgent && item.status === 'CONFIRMED' && (
                    <Button
                      size="sm"
                      onClick={() => handleComplete(item._id)}
                      className="bg-zinc-800 hover:bg-zinc-900 text-white text-xs h-8 flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Mark Done</span>
                    </Button>
                  )}

                  {(item.status === 'REQUESTED' || item.status === 'CONFIRMED') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancel(item._id)}
                      className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200 h-8 flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
