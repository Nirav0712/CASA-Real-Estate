'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { PropertyCardSkeleton } from '@/components/ui/skeleton';
import { PropertyCard } from '@/features/properties/property-card';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/contexts/toast-context';
import {
  getFeaturedProperties,
  getProperties,
} from '@/services/property-service';
import {
  CASA_CATEGORIES,
  CategoryDefinition,
} from '@/lib/categories';
import { Property } from '@/types';
import {
  Search,
  MapPin,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  MessageSquare,
  Globe2,
  SlidersHorizontal,
  Users2,
  Building2,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const toast = useToast();

  // Search & Filter State
  const [listingMode, setListingMode] = React.useState<'SALE' | 'RENT' | 'LEASE'>('SALE');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCity, setSelectedCity] = React.useState('all');

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
      let typeParam: string | undefined = undefined;

      if (latestGroupFilter === 'residential') {
        categoryParam = 'house-home';
      } else if (latestGroupFilter === 'commercial') {
        categoryParam = 'shop';
      } else if (latestGroupFilter === 'land') {
        categoryParam = 'plotting-land';
      }

      if (listingMode) {
        typeParam = listingMode;
      }

      const res = await getProperties({
        category: categoryParam,
        type: typeParam,
        city: selectedCity !== 'all' ? selectedCity : undefined,
        q: searchQuery.trim() || undefined,
      });

      setLatestProperties(res.properties);
    } catch {
      setLatestError('Unable to load property listings. Please retry.');
    } finally {
      setIsLatestLoading(false);
    }
  }, [latestGroupFilter, listingMode, selectedCity, searchQuery]);

  React.useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);

  React.useEffect(() => {
    loadLatest();
  }, [loadLatest]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (listingMode) params.set('listingType', listingMode);
    if (selectedCategory && selectedCategory !== 'all') {
      const catObj = CASA_CATEGORIES.find((c) => c.slug === selectedCategory);
      params.set('category', catObj ? catObj.name : selectedCategory);
    }
    if (selectedCity && selectedCity !== 'all') params.set('city', selectedCity);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());

    router.push(`/properties?${params.toString()}`);
  };

  const handleCategoryClick = (cat: CategoryDefinition) => {
    setSelectedCategory(cat.slug);
    if (cat.group === 'Residential') setLatestGroupFilter('residential');
    else if (cat.group === 'Commercial') setLatestGroupFilter('commercial');
    else if (cat.group === 'Land') setLatestGroupFilter('land');
    else setLatestGroupFilter('all');

    toast.info(
      `Selected category: ${cat.localizedNames[locale] || cat.name}`,
      `Filtering listings for ${cat.name}`,
    );

    const latestSection = document.getElementById('latest');
    if (latestSection) {
      latestSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedCity('all');
    setSearchQuery('');
    setLatestGroupFilter('all');
    setListingMode('SALE');
    loadLatest();
  };

  const modeTabs = [
    { id: 'SALE', label: t('buy'), icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'RENT', label: t('rent'), icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
    { id: 'LEASE', label: t('lease'), icon: <TrendingUp className="w-3.5 h-3.5" /> },
  ];

  const groupFilterTabs = [
    { id: 'all', label: t('allFilter') },
    { id: 'residential', label: t('residentialFilter') },
    { id: 'commercial', label: t('commercialFilter') },
    { id: 'land', label: t('landFilter') },
  ];

  return (
    <div className="text-start">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-to-b from-white via-casa-canvas to-casa-subtle/40 dark:from-gray-900 dark:via-casa-canvas dark:to-gray-900 border-b border-casa-border-light transition-colors duration-200">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-10">
            {/* Live Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-casa-brand-subtle text-casa-brand text-xs font-semibold mb-6 border border-blue-100 dark:border-blue-900 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('phaseLiveBadge')}</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-casa-text-primary leading-[1.18] mb-6">
              {t('heroTitlePrefix')}{' '}
              <span className="text-casa-brand">{t('heroTitleHighlight')}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-casa-text-secondary max-w-2xl mx-auto leading-relaxed">
              {t('heroSubtitle')}
            </p>

            {/* Platform Stats Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-6 text-xs font-semibold text-casa-text-secondary">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t('statListings')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users2 className="w-4 h-4 text-casa-brand" />
                <span>{t('statAgents')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>{t('statCities')}</span>
              </div>
            </div>
          </div>

          {/* Search Capsule Bar */}
          <div className="max-w-4xl mx-auto bg-casa-surface p-4 sm:p-6 rounded-3xl shadow-elevated border border-casa-border-light transition-colors duration-200">
            {/* Buy / Rent / Lease Mode Selector */}
            <div className="mb-5 pb-4 border-b border-casa-border-light flex items-center justify-between flex-wrap gap-3">
              <Tabs
                items={modeTabs}
                activeTab={listingMode}
                onChange={(mode) => setListingMode(mode as 'SALE' | 'RENT' | 'LEASE')}
                variant="pill"
              />
              <span className="text-xs text-casa-text-muted hidden sm:inline">
                Find {listingMode === 'SALE' ? 'Properties for Sale' : listingMode === 'RENT' ? 'Properties for Rent' : 'Commercial Lease Spaces'}
              </span>
            </div>

            {/* Search Filter Form */}
            <form onSubmit={handleHeroSearch} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
              {/* Category Dropdown (10 Categories) */}
              <div className="sm:col-span-1 md:col-span-4">
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  options={[
                    { value: 'all', label: t('allCategories') },
                    ...CASA_CATEGORIES.map((c) => ({
                      value: c.slug,
                      label: c.localizedNames[locale] || c.name,
                    })),
                  ]}
                />
              </div>

              {/* Location Input with MapPin & Clearable */}
              <div className="sm:col-span-1 md:col-span-4">
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  prefixIcon={<MapPin className="w-4 h-4" />}
                  clearable
                  onClear={() => setSearchQuery('')}
                />
              </div>

              {/* City Selection */}
              <div className="sm:col-span-1 md:col-span-2">
                <Select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  options={[
                    { value: 'all', label: t('allLocations') },
                    { value: 'lucknow', label: 'Lucknow' },
                    { value: 'kanpur', label: 'Kanpur' },
                    { value: 'varanasi', label: 'Varanasi' },
                    { value: 'noida', label: 'Noida / NCR' },
                  ]}
                />
              </div>

              {/* Search Submit CTA */}
              <div className="sm:col-span-1 md:col-span-2">
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  fullWidth
                  className="shadow-subtle"
                >
                  <Search className="w-4 h-4" />
                  <span>{t('searchButton')}</span>
                </Button>
              </div>
            </form>
          </div>
        </Container>
      </section>

      {/* 2. PROPERTY CATEGORIES (ALL 10 CANONICAL CATEGORIES) */}
      <section id="categories" className="py-16 bg-casa-canvas border-b border-casa-border-light transition-colors duration-200">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-casa-brand block mb-1">
                {t('exploreCategoriesLabel')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-casa-text-primary">
                {t('browseByType')}
              </h2>
              <p className="text-xs text-casa-text-secondary mt-1">
                {t('categoriesSubtitle')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {CASA_CATEGORIES.map((cat) => {
              const IconComponent = cat.icon;
              const isSelected = selectedCategory === cat.slug;
              const localizedName = cat.localizedNames[locale] || cat.name;

              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? 'border-casa-brand bg-casa-brand-subtle/50 shadow-subtle ring-1 ring-casa-brand'
                      : 'border-casa-border-light bg-casa-surface hover:border-casa-brand hover:shadow-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-casa-subtle group-hover:bg-casa-brand group-hover:text-white text-casa-brand flex items-center justify-center transition-colors">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-casa-subtle text-casa-text-muted">
                      {cat.group}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-casa-text-primary group-hover:text-casa-brand transition-colors mb-0.5 leading-snug">
                      {localizedName}
                    </h3>
                    <span className="text-xs text-casa-text-muted">{cat.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 3. FEATURED PROPERTIES FEED */}
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

      {/* 4. LATEST PROPERTIES FEED */}
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
