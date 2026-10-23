'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { PropertyCardSkeleton } from '@/components/ui/skeleton';
import { PropertyCard } from '@/features/properties/property-card';
import { HeroSection, HeroFilters } from '@/components/home/hero-section';
import { CategoryCarousel } from '@/components/home/category-carousel';
import { VideoPropertySection } from '@/components/home/video-property-section';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/contexts/toast-context';
import { useUserLocation } from '@/hooks/use-user-location';
import {
  getFeaturedProperties,
  getProperties,
} from '@/services/property-service';
import {
  CategoryDefinition,
} from '@/lib/categories';
import { Property } from '@/types';
import {
  RotateCcw,
  MessageSquare,
  Globe2,
  Building2,
  ShieldCheck,
  MapPin,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';

function formatLocationLabel(slug?: string): string {
  if (!slug || slug === 'all') return 'All Markets';
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function HomePage() {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const toast = useToast();

  // Auto-detected user client location (e.g. Ahmedabad, Gujarat, India)
  const { detectedLocation, isGpsLoading, requestGps } = useUserLocation();

  // Real-time Hero Search & Filter State
  const [heroFilters, setHeroFilters] = React.useState<HeroFilters>({
    listingMode: 'SALE',
    category: 'all',
    country: undefined,
    state: undefined,
    city: undefined,
    minPrice: undefined,
    maxPrice: undefined,
  });

  // Real-time Marketplace Properties (Driven directly by Hero Right Card)
  const [realtimeProperties, setRealtimeProperties] = React.useState<Property[]>([]);
  const [isRealtimeLoading, setIsRealtimeLoading] = React.useState(true);
  const [realtimeFallbackNotice, setRealtimeFallbackNotice] = React.useState(false);

  // Category Carousel State
  const [selectedCategory, setSelectedCategory] = React.useState('all');

  // Featured Properties State (Location-prioritized)
  const [featuredProperties, setFeaturedProperties] = React.useState<Property[]>([]);
  const [isFeaturedLoading, setIsFeaturedLoading] = React.useState(true);
  const [isFeaturedFallback, setIsFeaturedFallback] = React.useState(false);

  // Initialize Hero Filters on mount without restricting to a single city by default
  React.useEffect(() => {
    if (detectedLocation) {
      setHeroFilters((prev) => {
        const country = prev.country || detectedLocation.countrySlug || 'india';
        return {
          ...prev,
          country,
        };
      });
    }
  }, [detectedLocation]);

  // Load Real-Time Properties matching active Hero filters
  const loadRealtimeProperties = React.useCallback(async () => {
    setIsRealtimeLoading(true);
    try {
      const targetCity =
        heroFilters.city && heroFilters.city !== 'all'
          ? heroFilters.city
          : undefined;

      const targetState =
        heroFilters.state && heroFilters.state !== 'all'
          ? heroFilters.state
          : undefined;

      const res = await getProperties({
        category: heroFilters.category !== 'all' ? heroFilters.category : undefined,
        listingType: heroFilters.listingMode || undefined,
        country: heroFilters.country !== 'all' ? heroFilters.country : undefined,
        state: targetState,
        city: targetCity,
        minPrice: heroFilters.minPrice,
        maxPrice: heroFilters.maxPrice,
        userCity: detectedLocation?.city,
        userState: detectedLocation?.state,
      });

      // If specific city/state filter returned 0 items, load broader verified properties with fallback banner
      if (res.properties.length === 0 && (targetCity || targetState)) {
        const fallbackRes = await getProperties({
          category: heroFilters.category !== 'all' ? heroFilters.category : undefined,
          listingType: heroFilters.listingMode || undefined,
          country: heroFilters.country !== 'all' ? heroFilters.country : undefined,
          minPrice: heroFilters.minPrice,
          maxPrice: heroFilters.maxPrice,
          userCity: detectedLocation?.city,
          userState: detectedLocation?.state,
        });
        setRealtimeProperties(fallbackRes.properties);
        setRealtimeFallbackNotice(true);
      } else {
        setRealtimeProperties(res.properties);
        setRealtimeFallbackNotice(false);
      }
    } catch {
      setRealtimeProperties([]);
    } finally {
      setIsRealtimeLoading(false);
    }
  }, [heroFilters, detectedLocation]);

  // Load Featured Properties with detected location prioritization
  const loadFeatured = React.useCallback(async () => {
    setIsFeaturedLoading(true);
    try {
      const res = await getFeaturedProperties({
        userCity: detectedLocation?.city,
        userState: detectedLocation?.state,
      });
      setFeaturedProperties(res.properties);
      setIsFeaturedFallback(false);
    } catch {
      setFeaturedProperties([]);
    } finally {
      setIsFeaturedLoading(false);
    }
  }, [detectedLocation?.city, detectedLocation?.state]);

  React.useEffect(() => {
    loadRealtimeProperties();
  }, [loadRealtimeProperties]);

  React.useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);

  const handleHeroFilterChange = (filters: HeroFilters) => {
    setHeroFilters(filters);
  };

  const handleCategorySelect = (cat: CategoryDefinition) => {
    setSelectedCategory(cat.slug);
    setHeroFilters((prev) => ({
      ...prev,
      category: cat.slug,
    }));

    toast.info(
      `Selected: ${cat.localizedNames[locale] || cat.name}`,
      `Filtering listings for ${cat.name}`,
    );

    const marketplaceSection = document.getElementById('marketplace-properties');
    if (marketplaceSection) {
      marketplaceSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setHeroFilters({
      listingMode: 'SALE',
      category: 'all',
      country: detectedLocation?.countrySlug || 'india',
      state: 'all',
      city: 'all',
      minPrice: undefined,
      maxPrice: undefined,
    });
  };

  return (
    <div className="text-start">
      {/* 1. HERO SECTION WITH REAL-TIME FILTER CONTROLS & AUTO-DETECTED CLIENT LOCATION */}
      <HeroSection
        onFilterChange={handleHeroFilterChange}
        initialLocation={
          detectedLocation
            ? {
                country: detectedLocation.countrySlug || 'india',
                state: detectedLocation.stateSlug || 'gujarat',
                city: detectedLocation.citySlug || 'ahmedabad',
              }
            : undefined
        }
        detectedCityName={detectedLocation?.city}
        detectedStateName={detectedLocation?.state}
        onRequestGps={requestGps}
        isGpsLoading={isGpsLoading}
      />

      {/* 2. REAL-TIME MARKETPLACE FEED (DIRECTLY DRIVEN BY HERO FILTERS & CLIENT LOCATION) */}
      <section
        id="marketplace-properties"
        className="py-14 bg-casa-canvas border-b border-casa-border-light transition-colors duration-200 scroll-mt-20"
      >
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-casa-brand-subtle text-casa-brand text-xs font-bold border border-blue-200 dark:border-blue-800">
                  <span className="h-2 w-2 rounded-full bg-casa-brand animate-ping inline-block"></span>
                  <span>Real-Time Marketplace</span>
                </span>

                {detectedLocation && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span>Prioritizing {detectedLocation.city}, {detectedLocation.state}</span>
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-casa-text-primary flex items-center gap-2.5 flex-wrap">
                <span>
                  {heroFilters.city && heroFilters.city !== 'all'
                    ? `Properties in ${formatLocationLabel(heroFilters.city)}`
                    : heroFilters.state && heroFilters.state !== 'all'
                    ? `Properties in ${formatLocationLabel(heroFilters.state)}`
                    : detectedLocation
                    ? `Properties in ${detectedLocation.city}`
                    : 'Verified Real Estate Properties'}
                </span>
                <span className="text-xs font-semibold text-casa-brand px-2.5 py-0.5 rounded-full bg-casa-surface border border-casa-border-light shadow-2xs">
                  {realtimeProperties.length} verified listings
                </span>
              </h2>

              <p className="text-xs text-casa-text-secondary mt-1 max-w-xl">
                Showing real-time properties matching your selected category, location, and budget. Updated directly by certified brokers and direct owners.
              </p>
            </div>

            {/* Active Filter Chips & Reset Button */}
            <div className="flex items-center gap-2 flex-wrap">
              {heroFilters.listingMode && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-casa-brand border border-blue-200 dark:border-blue-800">
                  {heroFilters.listingMode === 'SALE' ? 'For Sale' : heroFilters.listingMode === 'RENT' ? 'For Rent' : 'Lease'}
                </span>
              )}
              {heroFilters.category && heroFilters.category !== 'all' && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {formatLocationLabel(heroFilters.category)}
                </span>
              )}
              {heroFilters.city && heroFilters.city !== 'all' && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-500" />
                  <span>{formatLocationLabel(heroFilters.city)}</span>
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllFilters}
                className="text-xs flex items-center gap-1.5"
                title="Reset all filters to show all markets"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Show All Markets</span>
              </Button>
            </div>
          </div>

          {/* Fallback Notice if no broker listings yet in exact city */}
          {realtimeFallbackNotice && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  No direct properties currently uploaded specifically in <strong>{formatLocationLabel(heroFilters.city)}</strong>. Showing top verified listings in <strong>{formatLocationLabel(heroFilters.state || 'Gujarat')}</strong> below:
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={resetAllFilters} className="text-xs flex-shrink-0">
                View All
              </Button>
            </div>
          )}

          {/* Properties Grid or Skeleton or Empty */}
          {isRealtimeLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
            </div>
          ) : realtimeProperties.length === 0 ? (
            <EmptyState
              title="No Listings Found for This Selection"
              description={`No properties match the selected criteria in ${formatLocationLabel(heroFilters.city || heroFilters.state)}. Try switching category or resetting filters.`}
              actionLabel="Show All Properties"
              onAction={resetAllFilters}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {realtimeProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* 3. FEATURED PROPERTIES FEED (LOCATION-PRIORITIZED) */}
      <section id="featured" className="py-16 bg-casa-canvas border-b border-casa-border-light transition-colors duration-200">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-casa-brand block mb-1">
                {t('curatedListingsLabel')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-casa-text-primary">
                {t('featuredProperties')}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-casa-text-secondary">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{t('verifiedBadgeNotice')}</span>
            </div>
          </div>

          {/* Grid or Skeleton */}
          {isFeaturedLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
            </div>
          ) : featuredProperties.length === 0 ? (
            <div className="text-center py-10 bg-casa-surface border border-casa-border-light rounded-2xl p-6">
              <Building2 className="w-8 h-8 text-casa-text-muted mx-auto mb-2" />
              <h3 className="font-bold text-sm text-casa-text-primary">No Featured Properties Available</h3>
              <p className="text-xs text-casa-text-secondary mt-1 max-w-sm mx-auto">
                All approved properties are available in the Real-Time Marketplace section below.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* DEDICATED 9:16 VIDEO PROPERTY REELS (Requirement 6) */}
      <VideoPropertySection />

      {/* 4. CANONICAL PORTFOLIO — EXPLORE BY PROPERTY CATEGORY (PLACED BELOW PROPERTIES) */}
      <CategoryCarousel
        onCategorySelect={handleCategorySelect}
        selectedCategory={selectedCategory}
      />

      {/* 5. TRUST & VALUE SECTION */}
      <section className="py-20 bg-casa-surface border-b border-casa-border-light transition-colors duration-200">
        <Container>
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-casa-brand block mb-2">
              Marketplace Principles
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-casa-text-primary mb-3">
              {t('trustTitle')}
            </h2>
            <p className="text-sm text-casa-text-secondary leading-relaxed">
              {t('trustSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-casa-canvas border border-casa-border-light text-start flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-casa-brand flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-casa-text-primary mb-2">
                {t('trustPillar1Title')}
              </h3>
              <p className="text-xs text-casa-text-secondary leading-relaxed">
                {t('trustPillar1Desc')}
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-casa-canvas border border-casa-border-light text-start flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-casa-text-primary mb-2">
                {t('trustPillar2Title')}
              </h3>
              <p className="text-xs text-casa-text-secondary leading-relaxed">
                {t('trustPillar2Desc')}
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-casa-canvas border border-casa-border-light text-start flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mb-4">
                <Globe2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-casa-text-primary mb-2">
                {t('trustPillar3Title')}
              </h3>
              <p className="text-xs text-casa-text-secondary leading-relaxed">
                {t('trustPillar3Desc')}
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-2xl bg-casa-canvas border border-casa-border-light text-start flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-casa-text-primary mb-2">
                {t('trustPillar4Title')}
              </h3>
              <p className="text-xs text-casa-text-secondary leading-relaxed">
                {t('trustPillar4Desc')}
              </p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
