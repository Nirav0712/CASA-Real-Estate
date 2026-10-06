'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/card';
import { PropertyCard } from '@/features/properties/property-card';
import { PropertyCardSkeleton } from '@/components/ui/skeleton';
import { SearchFilters } from '@/features/properties/search-filters';
import { searchProperties } from '@/services/property-service';
import { Property, SearchPropertiesParams, PropertySortOption, PaginationMetadata } from '@/types';
import { formatPrice } from '@/lib/utils';
import {
  SlidersHorizontal,
  ArrowUpDown,
  X,
  RotateCcw,
  Building,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

function SearchPropertiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [properties, setProperties] = React.useState<Property[]>([]);
  const [pagination, setPagination] = React.useState<PaginationMetadata>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = React.useState(false);

  // Extract filters from URL Search Params
  const currentFilters: SearchPropertiesParams = React.useMemo(() => {
    return {
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      listingType: searchParams.get('listingType') || searchParams.get('type') || undefined,
      city: searchParams.get('city') || undefined,
      locality: searchParams.get('locality') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      minArea: searchParams.get('minArea') || undefined,
      maxArea: searchParams.get('maxArea') || undefined,
      bedrooms: searchParams.get('bedrooms') || undefined,
      bathrooms: searchParams.get('bathrooms') || undefined,
      constructionStatus: searchParams.get('constructionStatus') || undefined,
      propertyAge: searchParams.get('propertyAge') || undefined,
      furnishing: searchParams.get('furnishing') || undefined,
      facing: searchParams.get('facing') || undefined,
      amenities: searchParams.get('amenities') || undefined,
      freshness: searchParams.get('freshness') || undefined,
      featured: searchParams.get('featured') ? searchParams.get('featured') === 'true' : undefined,
      sort: (searchParams.get('sort') as PropertySortOption) || 'newest',
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 12,
    };
  }, [searchParams]);

  // Fetch properties from Search API
  const fetchProperties = React.useCallback(async (params: SearchPropertiesParams) => {
    setIsLoading(true);
    try {
      const res = await searchProperties(params);
      setProperties(res.data);
      setPagination(res.pagination);
    } catch {
      setProperties([]);
      setPagination({
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync with URL params
  React.useEffect(() => {
    fetchProperties(currentFilters);
  }, [currentFilters, fetchProperties]);

  // Push updated filter state to URL query params
  const updateUrlFilters = (newFilters: Partial<SearchPropertiesParams>) => {
    const updated = { ...currentFilters, ...newFilters };
    const params = new URLSearchParams();

    Object.entries(updated).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'all') {
        params.set(key, String(val));
      }
    });

    router.push(`/properties?${params.toString()}`, { scroll: false });
  };

  const handleResetFilters = () => {
    router.push('/properties', { scroll: false });
  };

  const handleRemoveSingleFilter = (key: keyof SearchPropertiesParams) => {
    const updated = { ...currentFilters };
    delete updated[key];
    updated.page = 1;
    updateUrlFilters(updated);
  };

  // Active filter tags calculation
  const activeTags = React.useMemo(() => {
    const tags: { key: keyof SearchPropertiesParams; label: string }[] = [];
    if (currentFilters.q) tags.push({ key: 'q', label: `"${currentFilters.q}"` });
    if (currentFilters.category) tags.push({ key: 'category', label: currentFilters.category });
    if (currentFilters.listingType)
      tags.push({ key: 'listingType', label: currentFilters.listingType === 'SALE' ? 'For Sale' : currentFilters.listingType === 'RENT' ? 'For Rent' : 'Lease' });
    if (currentFilters.city) tags.push({ key: 'city', label: currentFilters.city });
    if (currentFilters.locality) tags.push({ key: 'locality', label: currentFilters.locality });
    if (currentFilters.minPrice || currentFilters.maxPrice) {
      tags.push({
        key: 'minPrice',
        label: `${currentFilters.minPrice ? formatPrice(Number(currentFilters.minPrice)) : '₹0'} - ${currentFilters.maxPrice ? formatPrice(Number(currentFilters.maxPrice)) : 'Any'}`,
      });
    }
    if (currentFilters.bedrooms) tags.push({ key: 'bedrooms', label: `${currentFilters.bedrooms} BHK` });
    if (currentFilters.constructionStatus)
      tags.push({ key: 'constructionStatus', label: currentFilters.constructionStatus.replace('_', ' ') });
    if (currentFilters.furnishing) tags.push({ key: 'furnishing', label: currentFilters.furnishing });
    if (currentFilters.featured) tags.push({ key: 'featured', label: 'Featured Only' });
    if (currentFilters.amenities) {
      const list = currentFilters.amenities.split(',');
      list.forEach((a) => tags.push({ key: 'amenities', label: a.trim() }));
    }
    return tags;
  }, [currentFilters]);

  return (
    <div className="min-h-screen bg-casa-subtle/40 py-8">
      <Container>
        {/* Page Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-casa-border-light">
          <div>
            <div className="flex items-center gap-2 text-xs text-casa-text-muted mb-1">
              <Link href="/" className="hover:text-casa-brand transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-casa-text-primary font-semibold">Properties Search</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-casa-text-primary tracking-tight">
              Search & Discover Real Estate
            </h1>
            <p className="text-xs text-casa-text-secondary mt-1">
              Find verified independent homes, luxury apartments, and plotting land in Uttar Pradesh.
            </p>
          </div>

          {/* Mobile Filter Trigger Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-casa-brand text-white text-xs font-bold flex items-center justify-center gap-2 shadow-subtle cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters ({activeTags.length})</span>
            </button>
          </div>
        </div>

        {/* Main Search Layout (Sidebar + Results Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-6">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <SearchFilters
                filters={currentFilters}
                onFilterChange={updateUrlFilters}
                onReset={handleResetFilters}
                totalResults={pagination.total}
              />
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Top Toolbar: Search Stats, Active Tags, & Sorting */}
            <div className="bg-casa-surface border border-casa-border-light rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-casa-text-primary">
                    {isLoading ? 'Searching...' : `${pagination.total} Properties Found`}
                  </span>
                  {currentFilters.city && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-casa-brand-subtle text-casa-brand font-semibold">
                      in {currentFilters.city}
                    </span>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-casa-text-muted font-medium flex items-center gap-1">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    Sort By:
                  </span>
                  <select
                    value={currentFilters.sort || 'newest'}
                    onChange={(e) =>
                      updateUrlFilters({
                        sort: e.target.value as PropertySortOption,
                        page: 1,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl border border-casa-border-light bg-casa-surface text-xs font-semibold text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/20 cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="area_low">Area: Small to Large</option>
                    <option value="area_high">Area: Large to Small</option>
                    <option value="featured">Featured First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Chips Bar */}
              {activeTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-casa-border-light">
                  <span className="text-[11px] text-casa-text-muted font-medium">Active:</span>
                  {activeTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-casa-subtle border border-casa-border-light text-[11px] font-medium text-casa-text-primary"
                    >
                      {tag.label}
                      <button
                        type="button"
                        onClick={() => handleRemoveSingleFilter(tag.key)}
                        className="hover:text-red-500 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[11px] font-bold text-casa-brand hover:underline cursor-pointer ml-1"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Properties Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <PropertyCardSkeleton key={idx} />
                ))}
              </div>
            ) : properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {properties.map((prop) => (
                  <PropertyCard key={prop.id || prop.slug} property={prop} />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="bg-casa-surface border border-casa-border-light rounded-2xl p-12 text-center space-y-4 shadow-subtle">
                <div className="w-14 h-14 rounded-2xl bg-casa-brand-subtle text-casa-brand flex items-center justify-center mx-auto">
                  <Building className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-casa-text-primary">
                    No Matching Properties Found
                  </h3>
                  <p className="text-xs text-casa-text-secondary max-w-md mx-auto">
                    We could not find any active listings matching your current search parameters. Try
                    adjusting your budget, bedroom count, or locality.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="py-2.5 px-5 rounded-xl bg-casa-brand text-white text-xs font-semibold hover:bg-casa-brand-hover shadow-subtle cursor-pointer transition-all inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset All Filters
                </button>
              </div>
            )}

            {/* Server-Side Pagination Controls */}
            {!isLoading && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-casa-border-light">
                <span className="text-xs text-casa-text-muted">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!pagination.hasPreviousPage}
                    onClick={() => updateUrlFilters({ page: pagination.page - 1 })}
                    className="p-2 rounded-xl border border-casa-border-light bg-casa-surface text-casa-text-primary hover:border-casa-brand disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                    .map((pageNum, idx, arr) => (
                      <React.Fragment key={pageNum}>
                        {idx > 0 && arr[idx - 1] !== pageNum - 1 && (
                          <span className="text-xs text-casa-text-muted">...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => updateUrlFilters({ page: pageNum })}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            pagination.page === pageNum
                              ? 'bg-casa-brand text-white shadow-2xs'
                              : 'bg-casa-surface border border-casa-border-light text-casa-text-secondary hover:border-casa-brand/40'
                          }`}
                        >
                          {pageNum}
                        </button>
                      </React.Fragment>
                    ))}
                  <button
                    type="button"
                    disabled={!pagination.hasNextPage}
                    onClick={() => updateUrlFilters({ page: pagination.page + 1 })}
                    className="p-2 rounded-xl border border-casa-border-light bg-casa-surface text-casa-text-primary hover:border-casa-brand disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* Mobile Slide-Over Filter Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs sm:max-w-sm bg-casa-surface h-full shadow-2xl p-4 overflow-y-auto z-10 space-y-4">
            <SearchFilters
              filters={currentFilters}
              onFilterChange={updateUrlFilters}
              onReset={handleResetFilters}
              totalResults={pagination.total}
              isMobileDrawer
              onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function PropertiesSearchPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-casa-brand" />
        </div>
      }
    >
      <SearchPropertiesContent />
    </React.Suspense>
  );
}
