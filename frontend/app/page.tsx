'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { PropertyCardSkeleton } from '@/components/ui/skeleton';
import { PropertyCard } from '@/features/properties/property-card';
import { HeroSection } from '@/components/home/hero-section';
import { CategoryCarousel } from '@/components/home/category-carousel';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/contexts/toast-context';
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
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const toast = useToast();

  // Search & Filter State
  const [selectedCategory, setSelectedCategory] = React.useState('all');

  // Featured Properties State
  const [featuredProperties, setFeaturedProperties] = React.useState<Property[]>([]);
  const [isFeaturedLoading, setIsFeaturedLoading] = React.useState(true);
  const [isFeaturedFallback, setIsFeaturedFallback] = React.useState(false);

  // Latest Properties State
  const [latestProperties, setLatestProperties] = React.useState<Property[]>([]);
  const [isLatestLoading, setIsLatestLoading] = React.useState(true);
  const [latestGroupFilter, setLatestGroupFilter] = React.useState('all');
  const [latestError, setLatestError] = React.useState<string | null>(null);

  // Load Featured Properties
  const loadFeatured = React.useCallback(async () => {
    setIsFeaturedLoading(true);
    try {
      const res = await getFeaturedProperties();
      setFeaturedProperties(res.properties);
      setIsFeaturedFallback(res.source === 'fallback_dev');
    } catch {
      setFeaturedProperties([]);
    } finally {
      setIsFeaturedLoading(false);
    }
  }, []);

  // Load Latest Properties
  const loadLatest = React.useCallback(async () => {
    setIsLatestLoading(true);
    setLatestError(null);
    try {
      let categoryParam: string | undefined = undefined;

      if (latestGroupFilter === 'residential') {
        categoryParam = 'house-home';
      } else if (latestGroupFilter === 'commercial') {
        categoryParam = 'shop';
      } else if (latestGroupFilter === 'land') {
        categoryParam = 'plotting-land';
      }

      const res = await getProperties({
        category: categoryParam,
      });

      setLatestProperties(res.properties);
    } catch {
      setLatestError('Unable to load property listings. Please retry.');
    } finally {
      setIsLatestLoading(false);
    }
  }, [latestGroupFilter]);

  React.useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);

  React.useEffect(() => {
    loadLatest();
  }, [loadLatest]);

  const handleCategorySelect = (cat: CategoryDefinition) => {
    setSelectedCategory(cat.slug);
    if (cat.group === 'Residential') setLatestGroupFilter('residential');
    else if (cat.group === 'Commercial') setLatestGroupFilter('commercial');
    else if (cat.group === 'Land') setLatestGroupFilter('land');
    else setLatestGroupFilter('all');

    toast.info(
      `Selected: ${cat.localizedNames[locale] || cat.name}`,
      `Filtering listings for ${cat.name}`,
    );

    const latestSection = document.getElementById('latest');
    if (latestSection) {
      latestSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setLatestGroupFilter('all');
    loadLatest();
  };

  const groupFilterTabs = [
    { id: 'all', label: t('allFilter') },
    { id: 'residential', label: t('residentialFilter') },
    { id: 'commercial', label: t('commercialFilter') },
    { id: 'land', label: t('landFilter') },
  ];

  return (
    <div className="text-start">
      {/* 1. HERO SECTION (REDESIGNED: LEFT CONTENT / RIGHT FILTER PANEL) */}
      <HeroSection />

      {/* 2. FEATURED PROPERTIES FEED */}
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

          {/* Controlled Dev Fallback Alert if Offline */}
          {isFeaturedFallback && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold">Controlled Dev State:</span>
                <span>
                  Showing isolated sample listings to demonstrate the Gemini-inspired design system.
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-200/60 dark:bg-amber-900 rounded">
                Development Dataset
              </span>
            </div>
          )}

          {/* Grid or Skeleton */}
          {isFeaturedLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
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

      {/* 3. LATEST PROPERTIES FEED */}
      <section id="latest" className="py-16 bg-casa-canvas border-b border-casa-border-light transition-colors duration-200">
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-casa-brand block mb-1">
                Real-Time Marketplace
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-casa-text-primary">
                {t('latestProperties')}
              </h2>
              <p className="text-xs text-casa-text-secondary mt-1">
                {t('latestSubtitle')}
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="overflow-x-auto">
              <Tabs
                items={groupFilterTabs}
                activeTab={latestGroupFilter}
                onChange={setLatestGroupFilter}
                variant="underline"
              />
            </div>
          </div>

          {/* Error State */}
          {latestError && (
            <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center my-6">
              <p className="text-sm text-rose-700 dark:text-rose-300 font-semibold mb-3">
                {latestError}
              </p>
              <Button variant="outline" size="sm" onClick={loadLatest}>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('retryAction')}</span>
              </Button>
            </div>
          )}

          {/* Loading or Grid or Empty */}
          {isLatestLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
            </div>
          ) : latestProperties.length === 0 ? (
            <EmptyState
              title="No Listings Found"
              description={t('noPropertiesFound')}
              actionLabel={t('clearFilters')}
              onAction={resetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </Container>
      </section>

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
