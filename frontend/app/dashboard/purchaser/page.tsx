'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { useSavedProperties } from '@/contexts/saved-properties-context';
import { getPurchaserDashboard } from '@/services/purchaser-service';
import { PurchaserDashboardData, Property } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/features/properties/property-card';
import { formatPrice } from '@/lib/utils';
import {
  Heart,
  MessageSquare,
  Clock,
  Compass,
  ArrowRight,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function PurchaserDashboardOverviewPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { savedIds } = useSavedProperties();
  const [data, setData] = React.useState<PurchaserDashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getPurchaserDashboard();
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load purchaser dashboard';
      toast.error('Dashboard Error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData, savedIds.size]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-casa-surface border border-casa-border-light rounded-2xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-28 bg-casa-surface border border-casa-border-light rounded-2xl"></div>
          <div className="h-28 bg-casa-surface border border-casa-border-light rounded-2xl"></div>
          <div className="h-28 bg-casa-surface border border-casa-border-light rounded-2xl"></div>
        </div>
        <div className="h-64 bg-casa-surface border border-casa-border-light rounded-2xl"></div>
      </div>
    );
  }

  const stats = data?.stats || { savedCount: 0, enquiriesCount: 0, recentlyViewedCount: 0 };
  const savedProps: Property[] = data?.savedProperties || [];
  const recentEnquiries = data?.recentEnquiries || [];
  const recommendations: Property[] = data?.recommendedProperties || [];
  const preferences = data?.user?.metadata || {};

  return (
    <div className="space-y-8 text-start">
      {/* Welcome Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white relative overflow-hidden shadow-elevated">
        <div className="absolute top-0 end-0 -mt-8 -me-8 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalized Buyer Workspace</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Valued Buyer'}!
            </h2>
            <p className="text-blue-100/80 text-xs md:text-sm mt-1 max-w-xl">
              Track your favorite properties, monitor communication with property owners and agents, and discover curated property matches.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/purchaser/profile">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs font-semibold">
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                <span>Buyer Preferences</span>
              </Button>
            </Link>
            <Link href="/properties">
              <Button variant="primary" size="sm" className="bg-white text-blue-950 hover:bg-blue-50 text-xs font-bold shadow-md">
                <Compass className="w-3.5 h-3.5 mr-1.5" />
                <span>Explore Listings</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Saved Properties Stat */}
        <Link href="/dashboard/purchaser/saved">
          <Card hoverable className="p-5 border-casa-border-light hover:border-rose-300 dark:hover:border-rose-800 transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-xs font-bold text-casa-text-muted uppercase tracking-wider">
                Saved Properties
              </span>
              <div className="text-3xl font-extrabold text-casa-text-primary">
                {stats.savedCount}
              </div>
              <span className="text-[11px] text-casa-text-secondary group-hover:text-rose-600 transition-colors flex items-center gap-1">
                <span>View shortlist</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shadow-xs">
              <Heart className="w-6 h-6 fill-rose-100 dark:fill-rose-900" />
            </div>
          </Card>
        </Link>

        {/* My Enquiries Stat */}
        <Link href="/dashboard/purchaser/enquiries">
          <Card hoverable className="p-5 border-casa-border-light hover:border-blue-300 dark:hover:border-blue-800 transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-xs font-bold text-casa-text-muted uppercase tracking-wider">
                My Enquiries
              </span>
              <div className="text-3xl font-extrabold text-casa-text-primary">
                {stats.enquiriesCount}
              </div>
              <span className="text-[11px] text-casa-text-secondary group-hover:text-casa-brand transition-colors flex items-center gap-1">
                <span>View active leads</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-casa-brand flex items-center justify-center shadow-xs">
              <MessageSquare className="w-6 h-6" />
            </div>
          </Card>
        </Link>

        {/* Recently Viewed Stat */}
        <Link href="/dashboard/purchaser/recent">
          <Card hoverable className="p-5 border-casa-border-light hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-xs font-bold text-casa-text-muted uppercase tracking-wider">
                Recently Viewed
              </span>
              <div className="text-3xl font-extrabold text-casa-text-primary">
                {stats.recentlyViewedCount}
              </div>
              <span className="text-[11px] text-casa-text-secondary group-hover:text-emerald-600 transition-colors flex items-center gap-1">
                <span>View history</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shadow-xs">
              <Clock className="w-6 h-6" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Grid: Saved Properties Preview & Recent Enquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Saved Properties Preview */}
        <Card className="p-6 border-casa-border-light space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <h3 className="text-base font-bold text-casa-text-primary">Saved Properties</h3>
            </div>
            <Link
              href="/dashboard/purchaser/saved"
              className="text-xs font-semibold text-casa-brand hover:underline flex items-center gap-1"
            >
              <span>View all ({stats.savedCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {savedProps.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-casa-subtle border border-casa-border-light space-y-3">
              <Heart className="w-8 h-8 text-casa-text-muted mx-auto" />
              <p className="text-xs font-semibold text-casa-text-primary">No saved properties yet</p>
              <p className="text-[11px] text-casa-text-secondary max-w-xs mx-auto">
                Explore the marketplace and click the heart icon on any listing to save it to your shortlist.
              </p>
              <Link href="/properties">
                <Button variant="secondary" size="sm" className="text-xs mt-2">
                  <Compass className="w-3.5 h-3.5 mr-1" />
                  <span>Explore Properties</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {savedProps.map((prop) => {
                const title = typeof prop.title === 'string' ? prop.title : prop.title?.en || 'Property';
                const price = formatPrice(typeof prop.price === 'number' ? prop.price : prop.price?.amount || 0);
                const thumb = prop.media?.thumbnailUrl || prop.media?.coverImage || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa';

                return (
                  <Link
                    key={prop.id}
                    href={`/property/${prop.slug}`}
                    className="p-3 rounded-2xl bg-casa-canvas border border-casa-border-light hover:border-casa-brand/40 transition-all flex flex-col justify-between group"
                  >
                    <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden mb-2.5 bg-casa-subtle">
                      <Image
                        src={thumb}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, 300px"
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <span className="absolute top-2 start-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs">
                        {prop.category}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-casa-brand mb-1">{price}</div>
                      <h4 className="text-xs font-semibold text-casa-text-primary line-clamp-1 group-hover:text-casa-brand transition-colors">
                        {title}
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-casa-text-muted mt-1 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span>{typeof prop.location === 'string' ? prop.location : `${prop.location?.locality}, ${prop.location?.city}`}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent Enquiries Preview */}
        <Card className="p-6 border-casa-border-light space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-casa-brand" />
              <h3 className="text-base font-bold text-casa-text-primary">Recent Enquiries</h3>
            </div>
            <Link
              href="/dashboard/purchaser/enquiries"
              className="text-xs font-semibold text-casa-brand hover:underline flex items-center gap-1"
            >
              <span>View all ({stats.enquiriesCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentEnquiries.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-casa-subtle border border-casa-border-light space-y-3">
              <MessageSquare className="w-8 h-8 text-casa-text-muted mx-auto" />
              <p className="text-xs font-semibold text-casa-text-primary">No enquiries sent yet</p>
              <p className="text-[11px] text-casa-text-secondary max-w-xs mx-auto">
                When you contact property owners or agents via property detail pages, your conversation timeline appears here.
              </p>
              <Link href="/properties">
                <Button variant="secondary" size="sm" className="text-xs mt-2">
                  <span>Browse Properties</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEnquiries.map((enq) => {
                const statusBadgeVariant =
                  enq.status === 'NEW'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                    : enq.status === 'CONTACTED'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : enq.status === 'CLOSED'
                    ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';

                return (
                  <div
                    key={enq.id}
                    className="p-3.5 rounded-2xl bg-casa-canvas border border-casa-border-light flex items-center justify-between gap-3 hover:border-casa-brand/40 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadgeVariant}`}>
                          {enq.status}
                        </span>
                        <span className="text-[11px] text-casa-text-muted">
                          {new Date(enq.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-casa-text-primary truncate">
                        {enq.property?.title || 'Property Enquiry'}
                      </h4>
                      <p className="text-[11px] text-casa-text-secondary line-clamp-1 italic">
                        &ldquo;{enq.message}&rdquo;
                      </p>
                    </div>

                    {enq.property?.slug && (
                      <Link href={`/property/${enq.property.slug}`}>
                        <Button variant="ghost" size="sm" className="text-xs text-casa-brand flex-shrink-0">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recommended Properties For You */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-casa-brand block">
              Curated For You
            </span>
            <h3 className="text-xl font-extrabold text-casa-text-primary">
              Recommended Properties
            </h3>
          </div>
          <Link
            href="/properties"
            className="text-xs font-semibold text-casa-brand hover:underline flex items-center gap-1"
          >
            <span>Explore all listings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recommendations.length === 0 ? (
          <p className="text-xs text-casa-text-muted">No current recommendations available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        )}
      </section>

      {/* Buyer Profile & Preferences Shortcut */}
      <Card className="p-6 border-casa-border-light bg-gradient-to-r from-casa-surface to-casa-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-casa-brand" />
            <h4 className="text-sm font-bold text-casa-text-primary">Buyer Profile & Search Preferences</h4>
          </div>
          <p className="text-xs text-casa-text-secondary">
            {preferences.preferredCity || preferences.preferredCategory
              ? `Preferences set: ${preferences.preferredCity || 'Any City'} • ${preferences.preferredCategory || 'Any Category'} • Budget ₹${(preferences.budgetMin || 0).toLocaleString()} - ₹${(preferences.budgetMax || 0).toLocaleString()}`
              : 'Set your preferred cities, categories, and budget to receive tailored property updates.'}
          </p>
        </div>
        <Link href="/dashboard/purchaser/profile" className="w-fit">
          <Button variant="outline" size="sm" className="text-xs font-semibold">
            <span>Configure Preferences</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
      </Card>
    </div>
  );
}
