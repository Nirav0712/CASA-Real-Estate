'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CASA_CATEGORIES, CategoryDefinition } from '@/lib/categories';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/contexts/toast-context';
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  ArrowRight,
  Pause,
  Play,
} from 'lucide-react';

interface CategoryCarouselProps {
  onCategorySelect?: (cat: CategoryDefinition) => void;
  selectedCategory?: string;
  className?: string;
}

export function CategoryCarousel({
  onCategorySelect,
  selectedCategory,
  className = '',
}: CategoryCarouselProps) {
  const router = useRouter();
  const { locale, t } = useLanguage();

  const handleCardClick = (cat: CategoryDefinition) => {
    if (onCategorySelect) {
      onCategorySelect(cat);
    } else {
      router.push(`/properties?category=${encodeURIComponent(cat.name)}`);
    }
  };

  return (
    <section
      id="categories"
      aria-label="Property Categories Canonical Portfolio"
      className={`py-12 md:py-16 bg-casa-canvas border-b border-casa-border-light transition-colors duration-200 ${className}`}
    >
      <Container>
        {/* Section Header */}
        <div className="mb-8 text-start">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-casa-brand-subtle text-casa-brand text-[11px] font-bold uppercase tracking-wider mb-2 border border-casa-brand/20 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Canonical Portfolio</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-casa-text-primary tracking-tight">
            Explore by Property Category
          </h2>
          <p className="text-xs sm:text-sm text-casa-text-secondary mt-1 max-w-xl">
            Discover verified residential residences, luxury high-rises, commercial storefronts, and prime plots.
          </p>
        </div>

        {/* Clean Responsive Grid without Scrollbar (Matching exact screenshot UI) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {CASA_CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            const isSelected = selectedCategory === cat.slug || selectedCategory === cat.name;
            const localizedName = cat.localizedNames[locale] || cat.name;

            return (
              <div
                key={cat.id}
                onClick={() => handleCardClick(cat)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(cat);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer select-none flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-casa-brand/50 ${
                  isSelected
                    ? 'border-casa-brand bg-casa-brand-subtle/70 shadow-md ring-1 ring-casa-brand scale-[1.02]'
                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-casa-brand/40 hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                {/* Top Row: Icon Container & Group Badge */}
                <div className="flex items-center justify-between mb-3.5">
                  {/* Soft Light Blue Rounded Square Icon Container */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      isSelected
                        ? 'bg-casa-brand text-white shadow-sm'
                        : 'bg-blue-50/90 dark:bg-blue-950/70 text-casa-brand group-hover:scale-105 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/80'
                    }`}
                  >
                    <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>

                  {/* Group Badge (e.g. Commercial, Residential, Land, Special) */}
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 group-hover:border-casa-brand/40 transition-colors">
                    {cat.group}
                  </span>
                </div>

                {/* Title & Ads Subtitle */}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-casa-brand transition-colors leading-tight line-clamp-1">
                    {localizedName}
                  </h3>
                  <div className="text-xs text-slate-400 dark:text-slate-400 font-medium mt-1">
                    {cat.count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
