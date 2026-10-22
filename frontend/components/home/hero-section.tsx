'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { GlobalLocationSelector, SelectedLocationData } from '@/components/ui/global-location-selector';
import { CASA_CATEGORIES } from '@/lib/categories';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import {
  Search,
  Sparkles,
  Building2,
  SlidersHorizontal,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Users2,
  MapPin,
  ArrowRight,
  BadgePercent,
  Compass,
  Layers,
  Phone,
  Coins,
} from 'lucide-react';

const BUDGET_PRESETS = [
  { label: 'Any Budget', min: undefined, max: undefined },
  { label: 'Under ₹50 Lakh', min: 0, max: 5000000 },
  { label: '₹50 Lakh – ₹1.5 Crore', min: 5000000, max: 15000000 },
  { label: '₹1.5 Crore – ₹5 Crore', min: 15000000, max: 50000000 },
  { label: '₹5 Crore+ Ultra Luxury', min: 50000000, max: undefined },
];

export interface HeroFilters {
  listingMode: 'SALE' | 'RENT' | 'LEASE';
  category: string;
  country?: string;
  state?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface HeroSectionProps {
  onFilterChange?: (filters: HeroFilters) => void;
  initialLocation?: SelectedLocationData;
  detectedCityName?: string;
  detectedStateName?: string;
  onRequestGps?: () => void;
  isGpsLoading?: boolean;
}

export function HeroSection({
  onFilterChange,
  initialLocation,
  detectedCityName,
  detectedStateName,
  onRequestGps,
  isGpsLoading,
}: HeroSectionProps = {}) {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  // Mouse position for interactive background
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Search Filter State
  const [listingMode, setListingMode] = React.useState<'SALE' | 'RENT' | 'LEASE'>('SALE');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [selectedLocation, setSelectedLocation] = React.useState<SelectedLocationData>({
    country: 'india',
    state: 'all',
    city: 'all',
  });
  const [budgetIndex, setBudgetIndex] = React.useState(0);
  const [keyword, setKeyword] = React.useState('');

  // Sync with auto-detected location when resolved
  React.useEffect(() => {
    if (initialLocation && initialLocation.country) {
      setSelectedLocation({
        country: initialLocation.country,
        state: initialLocation.state || 'all',
        city: initialLocation.city || 'all',
      });
    }
  }, [initialLocation?.country, initialLocation?.state, initialLocation?.city]);

  // Helper to notify parent of filter changes in real-time
  const emitFilterChange = React.useCallback(
    (override?: Partial<HeroFilters>) => {
      if (!onFilterChange) return;
      const budget = BUDGET_PRESETS[budgetIndex];
      const filters: HeroFilters = {
        listingMode,
        category: selectedCategory,
        country: selectedLocation.country !== 'all' ? selectedLocation.country : undefined,
        state: selectedLocation.state !== 'all' ? selectedLocation.state : undefined,
        city: selectedLocation.city !== 'all' ? selectedLocation.city : undefined,
        minPrice: budget.min,
        maxPrice: budget.max,
        ...override,
      };
      onFilterChange(filters);
    },
    [onFilterChange, listingMode, selectedCategory, selectedLocation, budgetIndex]
  );

  const handleModeChange = (mode: 'SALE' | 'RENT' | 'LEASE') => {
    setListingMode(mode);
    emitFilterChange({ listingMode: mode });
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    emitFilterChange({ category: cat });
  };

  const handleLocationChange = (loc: SelectedLocationData) => {
    setSelectedLocation(loc);
    emitFilterChange({
      country: loc.country !== 'all' ? loc.country : undefined,
      state: loc.state !== 'all' ? loc.state : undefined,
      city: loc.city !== 'all' ? loc.city : undefined,
    });
  };

  const handleBudgetChange = (idx: number) => {
    setBudgetIndex(idx);
    const budget = BUDGET_PRESETS[idx];
    emitFilterChange({
      minPrice: budget.min,
      maxPrice: budget.max,
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    emitFilterChange();

    // Smoothly scroll down to real-time property listings
    const targetSection =
      document.getElementById('marketplace-properties') ||
      document.getElementById('latest') ||
      document.getElementById('featured');
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const modeTabs = [
    { id: 'SALE', label: t('buy'), icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'RENT', label: t('rent'), icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
    { id: 'LEASE', label: t('lease'), icon: <TrendingUp className="w-3.5 h-3.5" /> },
  ];

  return (
    <section
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative min-h-[85vh] lg:min-h-[calc(100vh-5rem)] flex items-center py-16 sm:py-20 md:py-28 lg:py-32 overflow-hidden border-b border-casa-border-light bg-gradient-to-b from-white via-slate-50/50 to-casa-canvas dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950 transition-colors duration-200"
    >
      {/* Interactive Architectural Blueprint Grid Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Fine Architectural Matrix Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f60a_1px,transparent_1px),linear-gradient(to_bottom,#3b82f60a_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />

        {/* Dynamic Interactive Cursor Spotlight */}
        {isHovered && (
          <div
            className="absolute inset-0 transition-opacity duration-300 opacity-100"
            style={{
              background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(37, 99, 235, 0.09), transparent 75%)`,
            }}
          />
        )}

        {/* Static Ambient Base Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(59,130,246,0.04),transparent_100%)]" />
      </div>

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Heading, Supporting Content, Trust Indicators & CTAs */}
          <div className="lg:col-span-6 xl:col-span-7 text-start space-y-6">
            {/* Live Global Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-casa-brand-subtle text-casa-brand text-xs font-bold border border-blue-200/60 dark:border-blue-800/60 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('phaseLiveBadge')}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-5xl font-extrabold tracking-tight text-casa-text-primary leading-[1.15]">
              {t('heroTitlePrefix')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-casa-brand to-sky-500">
                {t('heroTitleHighlight')}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg text-casa-text-secondary leading-relaxed max-w-xl">
              {t('heroSubtitle')}
            </p>

            {/* Trust Badges & Platform Proofs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-casa-surface/80 border border-casa-border-light shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="text-start">
                  <div className="text-xs font-bold text-casa-text-primary">100% Verified</div>
                  <div className="text-[10px] text-casa-text-muted">RERA & Title Inspected</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-casa-surface/80 border border-casa-border-light shadow-2xs">
                <Users2 className="w-4 h-4 text-casa-brand flex-shrink-0" />
                <div className="text-start">
                  <div className="text-xs font-bold text-casa-text-primary">Direct Owners</div>
                  <div className="text-[10px] text-casa-text-muted">0% Commission Option</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-casa-surface/80 border border-casa-border-light shadow-2xs col-span-2 sm:col-span-1">
                <Compass className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <div className="text-start">
                  <div className="text-xs font-bold text-casa-text-primary">Global NRI Desk</div>
                  <div className="text-[10px] text-casa-text-muted">Dubai, UK & USA Advisory</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/properties">
                <Button variant="primary" size="lg" className="shadow-subtle flex items-center gap-2 text-xs md:text-sm">
                  <span>Explore Verified Properties</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/#featured">
                <Button variant="outline" size="lg" className="text-xs md:text-sm">
                  Curated Portfolios
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Glassmorphic Property Discovery Filter Panel + Future Ad Ready */}
          <div className="lg:col-span-6 xl:col-span-5">
            <div className="bg-casa-surface/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-casa-border-light shadow-elevated transition-all duration-300 hover:shadow-2xl">
              {/* Detected Location Status Badge */}
              {detectedCityName && (
                <div className="mb-3.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/60 dark:to-sky-950/40 border border-blue-200/70 dark:border-blue-800/70 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <div className="truncate">
                      <div className="text-[9px] uppercase font-bold text-casa-text-muted tracking-wider">Client Detected Location</div>
                      <div className="text-xs font-bold text-casa-text-primary truncate flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-casa-brand flex-shrink-0" />
                        <span>{detectedCityName}{detectedStateName ? `, ${detectedStateName}` : ''}</span>
                        <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded-full">
                          Live Auto
                        </span>
                      </div>
                    </div>
                  </div>
                  {onRequestGps && (
                    <button
                      type="button"
                      onClick={onRequestGps}
                      disabled={isGpsLoading}
                      className="text-[10px] font-bold text-casa-brand hover:underline px-2 py-1 rounded-lg hover:bg-blue-100/50 dark:hover:bg-blue-900/40 transition-colors flex-shrink-0"
                      title="Detect exact coordinates via GPS"
                    >
                      {isGpsLoading ? 'Locating...' : 'GPS Detect'}
                    </button>
                  )}
                </div>
              )}

              {/* Buy / Rent / Lease Mode Switcher */}
              <div className="mb-4 pb-3 border-b border-casa-border-light flex items-center justify-between flex-wrap gap-2">
                <Tabs
                  items={modeTabs}
                  activeTab={listingMode}
                  onChange={(mode) => handleModeChange(mode as 'SALE' | 'RENT' | 'LEASE')}
                  variant="pill"
                />
                <span className="text-[11px] text-casa-brand font-semibold hidden sm:inline">
                  {listingMode === 'SALE' ? 'Properties for Sale' : listingMode === 'RENT' ? 'Properties for Rent' : 'Commercial Lease'}
                </span>
              </div>

              {/* Search & Filter Form */}
              <form onSubmit={handleSearchSubmit} className="space-y-3.5">
                {/* 1. Category Selection */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-casa-text-muted flex items-center gap-1 mb-1">
                    <Layers className="w-3 h-3 text-casa-brand" />
                    <span>Property Category</span>
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    aria-label="Property Category"
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-casa-brand/30 cursor-pointer"
                  >
                    <option value="all">🏠 All Categories (Residences, Plots & Commercial)</option>
                    {CASA_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.localizedNames[locale] || c.name} ({c.group})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Three-Tier Global Location Selector (Country -> State -> City) */}
                <div className="p-3 bg-casa-canvas/60 rounded-2xl border border-casa-border-light/70 space-y-2">
                  <GlobalLocationSelector
                    value={selectedLocation}
                    onChange={handleLocationChange}
                    variant="hero"
                  />
                </div>

                {/* 3. Budget Range Selector */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-casa-text-muted flex items-center gap-1 mb-1">
                    <Coins className="w-3 h-3 text-amber-500" />
                    <span>Budget Range</span>
                  </label>
                  <select
                    value={budgetIndex}
                    onChange={(e) => handleBudgetChange(Number(e.target.value))}
                    aria-label="Budget Range"
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-casa-brand/30 cursor-pointer"
                  >
                    {BUDGET_PRESETS.map((b, i) => (
                      <option key={i} value={i}>
                        💰 {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submit Search Button */}
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  fullWidth
                  className="shadow-subtle text-xs sm:text-sm font-bold flex items-center justify-center gap-2 py-2.5"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Verified Properties</span>
                </Button>

                <div className="flex items-center justify-between text-[11px] text-casa-text-muted px-1 pt-0.5">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    <span>Real-time local listings</span>
                  </span>
                  <Link href="/properties" className="text-casa-brand font-semibold hover:underline flex items-center gap-0.5 text-xs">
                    <span>Full Filters</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </form>

              {/* 4. Future Campaign / Sponsored Spotlight Slot (Configurable & Responsive) */}
              <div className="mt-4 pt-3 border-t border-casa-border-light">
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-casa-brand text-white flex-shrink-0">
                      Spotlight
                    </span>
                    <p className="text-[11px] font-medium text-casa-text-primary truncate">
                      Luxury Golf View Villas — Ready for Possession
                    </p>
                  </div>
                  <Link
                    href="/properties?isFeatured=true"
                    className="text-[11px] font-bold text-casa-brand hover:underline flex-shrink-0 flex items-center gap-0.5"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
