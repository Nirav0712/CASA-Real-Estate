'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Property } from '@/types';
import { Card, Badge } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { buildWhatsAppEnquiryUrl } from '@/lib/whatsapp';
import { getCategoryLabel } from '@/lib/categories';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/contexts/toast-context';
import { useSavedProperties } from '@/contexts/saved-properties-context';
import { useComparison } from '@/contexts/comparison-context';
import {
  MapPin,
  Bed,
  Bath,
  Maximize,
  Phone,
  MessageSquare,
  Heart,
  Share2,
  ArrowRight,
  ShieldCheck,
  Layers,
  Play,
  Video,
} from 'lucide-react';
import { parseYouTubeUrl } from '@/lib/video';

export function PropertyCard({ property }: { property: Property }) {
  const { locale, t, isRtl } = useLanguage();
  const toast = useToast();
  const { isSaved, toggleSave } = useSavedProperties();
  const { isCompared, addToCompare, removeFromCompare } = useComparison();
  const [isHovered, setIsHovered] = React.useState(false);

  const propertyId = property.id || (property as any)._id;
  const saved = isSaved(propertyId);
  const compared = isCompared(propertyId);

  const hasVideo = Boolean(property.media?.videoUrl);
  const isVideoPrimary = property.media?.primaryMediaType === 'VIDEO' || (hasVideo && !property.media?.thumbnailUrl);
  const videoUrl = property.media?.videoUrl;
  const isYouTube = hasVideo && (property.media?.videoType === 'YOUTUBE' || videoUrl?.includes('youtu'));

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (compared) {
      removeFromCompare(propertyId);
    } else {
      addToCompare(propertyId);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleSave(propertyId, property.title?.en || (typeof property.title === 'string' ? property.title : 'Property'));
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const url = `${window.location.origin}/property/${property.slug}`;
      navigator.clipboard.writeText(url);
      toast.info('Listing link copied to clipboard');
    }
  };

  const propertyPriceFormatted = formatPrice(
    property.price.amount,
    property.price.currency,
  );

  const localizedTitle =
    property.title[locale] || property.title.en || 'Real Estate Property';

  const localizedCategory = getCategoryLabel(property.category, locale);

  const whatsappUrl = buildWhatsAppEnquiryUrl({
    phone: property.advertiser.phone,
    propertyTitle: localizedTitle,
    priceText: propertyPriceFormatted,
    propertySlug: property.slug,
    category: localizedCategory,
    location: `${property.location.locality}, ${property.location.city}`,
  });

  return (
    <Card
      hoverable
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex flex-col group text-start overflow-hidden border-casa-border-light hover:border-casa-brand/40 transition-all duration-200"
    >
      {/* Thumbnail / Video Container */}
      <div className="relative aspect-[16/10] w-full bg-casa-subtle overflow-hidden">
        <Link href={`/property/${property.slug}`} className="block w-full h-full relative">
          {/* Base Poster/Thumbnail Image */}
          <Image
            src={property.media.thumbnailUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'}
            alt={localizedTitle}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
              hasVideo && isHovered && !isYouTube ? 'opacity-0' : 'opacity-100'
            }`}
          />

          {/* Local Video Hover Preview */}
          {hasVideo && !isYouTube && videoUrl && isHovered && (
            <video
              src={videoUrl}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-300"
            />
          )}
        </Link>

        {/* Top Badges */}
        <div className="absolute top-3 start-3 flex flex-wrap gap-1.5 z-10 pointer-events-none">
          {hasVideo && (
            <Badge
              variant="default"
              size="sm"
              className="bg-rose-600/95 backdrop-blur-sm text-white font-bold shadow-subtle border-0 text-[10px] flex items-center gap-1"
            >
              <Play className="w-2.5 h-2.5 fill-white" />
              <span>Video Tour</span>
            </Badge>
          )}
          {property.isFeatured && (
            <Badge variant="featured" size="sm">
              ★ {t('featured')}
            </Badge>
          )}
          {(property.reraNumber || (property.advertiser as any)?.reraNumber) && (
            <Badge variant="default" size="sm" className="bg-emerald-600/95 backdrop-blur-sm text-white font-bold text-[10px] border-0 shadow-subtle">
              RERA: {property.reraNumber || (property.advertiser as any)?.reraNumber}
            </Badge>
          )}
          {property.advertiser.isVerifiedAgent ? (
            <Badge variant="verified" size="sm">
              <ShieldCheck className="w-3 h-3 inline me-1" />
              {t('verifiedAgent')}
            </Badge>
          ) : (
            <Badge variant="default" size="sm" className="bg-casa-surface/90 backdrop-blur-sm text-casa-text-secondary text-[10px]">
              {t('directOwner')}
            </Badge>
          )}
        </div>

        {/* Action icons overlay (Share, Compare, Bookmark) */}
        <div className="absolute top-3 end-3 flex items-center gap-1.5 z-10">
          <button
            type="button"
            onClick={toggleCompare}
            title={compared ? 'Remove from compare' : 'Add to compare'}
            aria-label="Compare property"
            className={`w-8 h-8 rounded-full bg-casa-surface/90 backdrop-blur-sm flex items-center justify-center transition-colors shadow-subtle cursor-pointer ${
              compared ? 'text-casa-brand bg-casa-brand/20' : 'text-casa-text-secondary hover:text-casa-brand'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share property listing"
            className="w-8 h-8 rounded-full bg-casa-surface/90 backdrop-blur-sm text-casa-text-secondary hover:text-casa-brand flex items-center justify-center transition-colors shadow-subtle cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={saved ? 'Remove from favorites' : 'Save to favorites'}
            className="w-8 h-8 rounded-full bg-casa-surface/90 backdrop-blur-sm text-casa-text-secondary hover:text-rose-500 flex items-center justify-center transition-colors shadow-subtle cursor-pointer"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                saved ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          </button>
        </div>

        {/* Category Pill on bottom */}
        <div className="absolute bottom-3 start-3 z-10">
          <Badge
            variant="default"
            size="sm"
            className="bg-casa-surface/95 backdrop-blur-sm font-semibold shadow-subtle text-casa-text-primary"
          >
            {localizedCategory}
          </Badge>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Price & Listing Type */}
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-xl font-extrabold text-casa-brand tracking-tight">
            {propertyPriceFormatted}
            {property.price.isNegotiable && (
              <span className="text-xs font-normal text-casa-text-muted ms-1.5">
                {t('negotiable')}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-casa-text-muted bg-casa-subtle px-2.5 py-0.5 rounded-full border border-casa-border-light">
            {property.listingType === 'SALE'
              ? t('forSale')
              : property.listingType === 'RENT'
              ? t('forRent')
              : t('forLease')}
          </span>
        </div>

        {/* Title */}
        <Link href={`/property/${property.slug}`}>
          <h3 className="font-bold text-casa-text-primary line-clamp-2 text-sm leading-snug mb-2.5 group-hover:text-casa-brand transition-colors cursor-pointer">
            {localizedTitle}
          </h3>
        </Link>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-casa-text-secondary mb-3">
          <MapPin className="w-3.5 h-3.5 text-casa-text-muted flex-shrink-0" />
          <span className="truncate">
            {property.location.locality}, {property.location.city}
          </span>
        </div>

        {/* Specs Strip */}
        <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-casa-border-light text-xs text-casa-text-secondary mb-4 bg-casa-canvas/50 rounded-xl px-2.5">
          {property.specs?.bedrooms ? (
            <div className="flex items-center gap-1 truncate">
              <Bed className="w-3.5 h-3.5 text-casa-text-muted flex-shrink-0" />
              <span>{property.specs.bedrooms} {t('beds')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 truncate text-casa-text-muted text-[11px]">
              <span>{property.specs?.constructionStatus?.replace('_', ' ') || 'Ready'}</span>
            </div>
          )}
          {property.specs?.bathrooms ? (
            <div className="flex items-center gap-1 truncate">
              <Bath className="w-3.5 h-3.5 text-casa-text-muted flex-shrink-0" />
              <span>{property.specs.bathrooms} {t('baths')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 truncate text-casa-text-muted text-[11px]">
              <span>{property.specs?.furnishing ? property.specs.furnishing.replace('_', ' ') : 'Standard'}</span>
            </div>
          )}
          {property.specs?.carpetAreaSqFt && (
            <div className="flex items-center gap-1 truncate">
              <Maximize className="w-3.5 h-3.5 text-casa-text-muted flex-shrink-0" />
              <span>{property.specs.carpetAreaSqFt.toLocaleString()} {t('sqft')}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="success" size="sm" fullWidth className="text-xs">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{t('whatsApp')}</span>
                </Button>
              </a>
            ) : (
              <Button variant="outline" size="sm" disabled fullWidth className="text-xs">
                <span>WhatsApp N/A</span>
              </Button>
            )}

            {property.advertiser.phone ? (
              <a href={`tel:${property.advertiser.phone}`} className="flex-1">
                <Button variant="outline" size="sm" fullWidth className="text-xs">
                  <Phone className="w-3.5 h-3.5 text-casa-brand" />
                  <span>{t('call')}</span>
                </Button>
              </a>
            ) : null}
          </div>

          <Link href={`/property/${property.slug}`} className="w-full">
            <Button variant="secondary" size="sm" fullWidth className="text-xs justify-between group/btn">
              <span>{t('viewDetails')}</span>
              <ArrowRight className={`w-3.5 h-3.5 transition-transform duration-150 group-hover/btn:translate-x-1 ${isRtl ? 'rtl-flip' : ''}`} />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
