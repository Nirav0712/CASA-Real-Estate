'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/contexts/toast-context';
import { getRecentlyViewed } from '@/services/purchaser-service';
import { RecentlyViewedItem } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import {
  Clock,
  Compass,
  MapPin,
  Bed,
  Bath,
  Maximize,
  ArrowRight,
} from 'lucide-react';

export default function PurchaserRecentlyViewedPage() {
  const toast = useToast();
  const [items, setItems] = React.useState<RecentlyViewedItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getRecentlyViewed(20);
      setItems(res || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load recently viewed properties';
      toast.error('Load Error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6 text-start">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl md:text-2xl font-extrabold text-casa-text-primary tracking-tight">
              Recently Viewed Properties
            </h2>
          </div>
          <p className="text-xs text-casa-text-muted mt-1">
            Pick up right where you left off from your recent browsing history.
          </p>
        </div>

        <Link href="/properties">
          <Button variant="outline" size="sm" className="text-xs font-semibold">
            <Compass className="w-3.5 h-3.5 mr-1.5" />
            <span>Discover Properties</span>
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="h-80 bg-casa-surface border border-casa-border-light rounded-2xl"></div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center border-casa-border-light space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto shadow-subtle">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-casa-text-primary">No browsing history yet</h3>
            <p className="text-xs text-casa-text-secondary max-w-md mx-auto">
              Properties you inspect across the marketplace will automatically appear in your recent history.
            </p>
          </div>
          <Link href="/properties" className="inline-block">
            <Button variant="primary" size="md" className="text-xs font-bold shadow-sm">
              <Compass className="w-4 h-4 mr-1.5" />
              <span>Explore Marketplace</span>
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => {
            const prop = item.property;
            const title = typeof prop.title === 'string' ? prop.title : prop.title?.en || 'Property';
            const price = formatPrice(typeof prop.price === 'number' ? prop.price : prop.price?.amount || 0);
            const thumb = prop.media?.thumbnailUrl || prop.media?.coverImage || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa';
            const loc = typeof prop.location === 'string' ? prop.location : `${prop.location?.locality}, ${prop.location?.city}`;

            return (
              <Card
                key={idx}
                className="p-0 overflow-hidden border-casa-border-light hover:border-casa-brand/40 transition-all flex flex-col justify-between group shadow-subtle"
              >
                <div className="relative aspect-[16/10] w-full bg-casa-subtle overflow-hidden">
                  <Link href={`/property/${prop.slug}`} className="block w-full h-full">
                    <Image
                      src={thumb}
                      alt={title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </Link>

                  <div className="absolute top-3 start-3 flex items-center gap-1.5 z-10 pointer-events-none">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-casa-surface/95 text-casa-text-primary backdrop-blur-xs shadow-xs">
                      {prop.category}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-casa-brand text-white shadow-xs">
                      {prop.listingType}
                    </span>
                  </div>

                  <div className="absolute bottom-3 end-3 px-2 py-1 rounded bg-black/60 text-white text-[10px] backdrop-blur-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.viewedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="text-lg font-extrabold text-casa-brand tracking-tight">
                      {price}
                    </div>

                    <Link href={`/property/${prop.slug}`}>
                      <h3 className="text-sm font-bold text-casa-text-primary line-clamp-2 group-hover:text-casa-brand transition-colors">
                        {title}
                      </h3>
                    </Link>

                    <div className="flex items-center gap-1.5 text-xs text-casa-text-secondary">
                      <MapPin className="w-3.5 h-3.5 text-casa-brand flex-shrink-0" />
                      <span className="truncate">{loc}</span>
                    </div>

                    {prop.specs && (
                      <div className="flex items-center gap-3 pt-2 text-xs text-casa-text-muted border-t border-casa-border-light">
                        {prop.specs.bedrooms && (
                          <span className="flex items-center gap-1">
                            <Bed className="w-3 h-3 text-casa-brand" />
                            <span>{prop.specs.bedrooms} BHK</span>
                          </span>
                        )}
                        {prop.specs.bathrooms && (
                          <span className="flex items-center gap-1">
                            <Bath className="w-3 h-3 text-casa-brand" />
                            <span>{prop.specs.bathrooms} B</span>
                          </span>
                        )}
                        {prop.specs.carpetAreaSqFt && (
                          <span className="flex items-center gap-1">
                            <Maximize className="w-3 h-3 text-casa-brand" />
                            <span>{prop.specs.carpetAreaSqFt.toLocaleString()} sqft</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <Link href={`/property/${prop.slug}`} className="w-full">
                    <Button variant="secondary" size="sm" fullWidth className="text-xs font-semibold justify-between">
                      <span>View Property</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
