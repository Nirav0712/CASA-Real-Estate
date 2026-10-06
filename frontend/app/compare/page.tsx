'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useComparison } from '@/contexts/comparison-context';
import { EngagementService } from '@/services/engagement-service';
import { Container, Card, Badge } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { Layers, X, ArrowLeft, Check, Sparkles, Building, MapPin, Bed, Bath, Maximize } from 'lucide-react';

export default function PropertyComparePage() {
  const { comparedIds, removeFromCompare, clearCompare } = useComparison();
  const [data, setData] = React.useState<{ properties: any[]; attributeMatrix: Record<string, any[]> } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (comparedIds.length < 2) {
      setData(null);
      return;
    }

    const loadComparison = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await EngagementService.compareProperties(comparedIds);
        if (res.data) {
          setData(res.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load property comparison matrix');
      } finally {
        setIsLoading(false);
      }
    };

    loadComparison();
  }, [comparedIds]);

  return (
    <div className="min-h-screen bg-casa-canvas py-8">
      <Container>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-casa-subtle hover:text-casa-brand mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Marketplace</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-casa-text">
              Side-by-Side Property Comparison
            </h1>
            <p className="text-sm text-casa-subtle mt-1">
              Compare key specifications, pricing metrics, and amenities across your shortlisted properties.
            </p>
          </div>

          {comparedIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearCompare}
              className="self-start text-xs border-zinc-300 dark:border-zinc-700"
            >
              Clear All ({comparedIds.length})
            </Button>
          )}
        </div>

        {/* State: Less than 2 items selected */}
        {comparedIds.length < 2 && (
          <Card className="p-12 text-center max-w-lg mx-auto bg-casa-surface border border-casa-border-light shadow-subtle rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-casa-brand/10 text-casa-brand flex items-center justify-center mx-auto mb-4 font-bold">
              <Layers className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-casa-text">Select At Least 2 Properties</h2>
            <p className="text-xs text-casa-subtle mt-1.5 max-w-sm mx-auto">
              You need at least 2 properties to perform a side-by-side comparison. Browse the marketplace and click the &quot;Compare&quot; button on property cards.
            </p>
            <div className="mt-6">
              <Link href="/properties">
                <Button className="bg-casa-brand hover:bg-casa-brand-hover text-white text-xs">
                  Browse Properties
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-3 border-casa-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-casa-subtle">Generating comparative matrix...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded-xl mb-6">
            <p className="text-sm">{error}</p>
          </Card>
        )}

        {/* Comparison Table */}
        {!isLoading && data && data.properties.length >= 2 && (
          <div className="overflow-x-auto pb-6">
            <table className="w-full min-w-[700px] border-collapse bg-casa-surface rounded-2xl shadow-subtle border border-casa-border-light overflow-hidden">
              <thead>
                <tr className="border-b border-casa-border-light bg-zinc-50/50 dark:bg-zinc-900/50">
                  <th className="p-4 text-left text-xs font-semibold text-casa-subtle uppercase tracking-wider w-48">
                    Attribute
                  </th>
                  {data.properties.map((p) => (
                    <th key={p._id} className="p-4 text-left w-64 align-top">
                      <div className="relative group">
                        <button
                          onClick={() => removeFromCompare(p._id)}
                          className="absolute -top-2 -right-2 p-1 bg-zinc-800 hover:bg-red-600 text-white rounded-full shadow transition-colors"
                          title="Remove from comparison"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="relative h-32 w-full rounded-xl overflow-hidden mb-3 bg-zinc-100 dark:bg-zinc-800">
                          <Image
                            src={p.media?.thumbnailUrl || p.media?.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600'}
                            alt={p.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <Link
                          href={`/property/${p.slug}`}
                          className="text-sm font-bold text-casa-text hover:text-casa-brand line-clamp-2 transition-colors"
                        >
                          {p.title}
                        </Link>
                        <div className="text-base font-extrabold text-casa-brand mt-1.5">
                          {p.formattedPrice}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-casa-border-light text-xs sm:text-sm">
                {/* Rate / SqFt */}
                <tr>
                  <td className="p-4 font-semibold text-casa-subtle bg-zinc-50/30 dark:bg-zinc-900/30">
                    Rate per Sq.Ft
                  </td>
                  {data.properties.map((p) => (
                    <td key={p._id} className="p-4 font-medium text-casa-text">
                      {p.pricePerSqFt ? `₹${p.pricePerSqFt.toLocaleString('en-IN')}/sq.ft` : 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Built-up Area */}
                <tr>
                  <td className="p-4 font-semibold text-casa-subtle bg-zinc-50/30 dark:bg-zinc-900/30">
                    Area
                  </td>
                  {data.properties.map((p) => (
                    <td key={p._id} className="p-4 text-casa-text">
                      {p.specs?.area ? `${p.specs.area} ${p.specs.areaUnit || 'sq.ft'}` : 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Bedrooms & Bathrooms */}
                <tr>
                  <td className="p-4 font-semibold text-casa-subtle bg-zinc-50/30 dark:bg-zinc-900/30">
                    Configuration
                  </td>
                  {data.properties.map((p) => (
                    <td key={p._id} className="p-4 text-casa-text">
                      {p.specs?.bedrooms ? `${p.specs.bedrooms} BHK` : 'N/A'} ({p.specs?.bathrooms || 1} Bath)
                    </td>
                  ))}
                </tr>

                {/* Listing Type & Purpose */}
                <tr>
                  <td className="p-4 font-semibold text-casa-subtle bg-zinc-50/30 dark:bg-zinc-900/30">
                    Listing Type
                  </td>
                  {data.properties.map((p) => (
                    <td key={p._id} className="p-4">
                      <Badge variant="outline" className="text-[11px] font-semibold">
                        For {p.listingType}
                      </Badge>
                    </td>
                  ))}
                </tr>

                {/* Location */}
                <tr>
                  <td className="p-4 font-semibold text-casa-subtle bg-zinc-50/30 dark:bg-zinc-900/30">
                    Location
                  </td>
                  {data.properties.map((p) => (
                    <td key={p._id} className="p-4 text-casa-text">
                      <div className="flex items-center gap-1 text-casa-subtle">
                        <MapPin className="w-3.5 h-3.5 text-casa-brand shrink-0" />
                        <span>{p.location?.locality}, {p.location?.city}</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Furnishing Status */}
                <tr>
                  <td className="p-4 font-semibold text-casa-subtle bg-zinc-50/30 dark:bg-zinc-900/30">
                    Furnishing
                  </td>
                  {data.properties.map((p) => (
                    <td key={p._id} className="p-4 text-casa-text">
                      {p.specs?.furnishing?.replace('_', ' ') || 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Construction Status */}
                <tr>
                  <td className="p-4 font-semibold text-casa-subtle bg-zinc-50/30 dark:bg-zinc-900/30">
                    Possession Status
                  </td>
                  {data.properties.map((p) => (
                    <td key={p._id} className="p-4 text-casa-text">
                      {p.specs?.constructionStatus?.replace('_', ' ') || 'Ready to Move'}
                    </td>
                  ))}
                </tr>

                {/* Actions */}
                <tr>
                  <td className="p-4 font-semibold text-casa-subtle bg-zinc-50/30 dark:bg-zinc-900/30">
                    Actions
                  </td>
                  {data.properties.map((p) => (
                    <td key={p._id} className="p-4">
                      <Link href={`/property/${p.slug}`}>
                        <Button size="sm" className="w-full bg-casa-brand hover:bg-casa-brand-hover text-white text-xs">
                          View Details
                        </Button>
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </div>
  );
}
