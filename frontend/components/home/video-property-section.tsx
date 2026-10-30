'use client';

import * as React from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/card';
import { formatPrice, formatPropertyLocation } from '@/lib/utils';
import { parseYouTubeUrl, parseInstagramUrl, detectVideoSource } from '@/lib/video';
import { useToast } from '@/contexts/toast-context';
import { useAuth } from '@/contexts/auth-context';
import { searchProperties, getProperties } from '@/services/property-service';
import { Property } from '@/types';
import {
  Play,
  Pause,
  MapPin,
  Building,
  Video,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Filter,
  X,
  Sparkles,
  Maximize2,
  Volume2,
  VolumeX,
  Phone,
  MessageCircle,
  Bed,
  Bath,
  Square,
  ShieldCheck,
  Info,
  Check,
  Trash2,
  PlusCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

// Live authoritative database-backed video property dataset
const FALLBACK_VIDEO_PROPERTIES: Property[] = [];

export function VideoPropertySection() {
  const toast = useToast();
  const { user, isAuthenticated } = useAuth();
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [visibleCount, setVisibleCount] = React.useState(9);

  // Filters State
  const [locationFilter, setLocationFilter] = React.useState('ALL');
  const [typeFilter, setTypeFilter] = React.useState('ALL');
  const [priceFilter, setPriceFilter] = React.useState('ALL');

  // Preview Modal & Navigation State
  const [activeVideoIndex, setActiveVideoIndex] = React.useState<number | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = React.useState(false);

  // Fetch real authoritative videos strictly from backend API
  const loadVideos = React.useCallback(async () => {
    setIsLoading(true);
    try {
      let apiProperties: Property[] = [];
      try {
        const res = await searchProperties({
          hasVideo: true,
          limit: 50,
        });
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          apiProperties = res.data.filter(
            (p) =>
              Boolean(
                (p.media?.videoUrl || (p as any).videoUrl || (p.media?.videos && p.media.videos.length > 0) || '').trim()
              ) &&
              p.isPublished &&
              p.status === 'PUBLISHED' &&
              !p.isSuspendedByAccount
          );
        }
      } catch (_) { }

      // Fallback check: if searchProperties returned 0, query getProperties directly
      if (apiProperties.length === 0) {
        try {
          const allProps = await getProperties({ hasVideo: true });
          apiProperties = (allProps.properties || []).filter(
            (p) =>
              Boolean(
                (p.media?.videoUrl || (p as any).videoUrl || (p.media?.videos && p.media.videos.length > 0) || '').trim()
              ) &&
              p.isPublished &&
              p.status === 'PUBLISHED' &&
              !p.isSuspendedByAccount
          );
        } catch (_) { }
      }

      setProperties(apiProperties);
    } catch (_) {
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // Filter logic
  const filteredProperties = React.useMemo(() => {
    return properties.filter((p) => {
      // 1. Location filter
      if (locationFilter !== 'ALL') {
        const cityMatch = p.location?.city?.toLowerCase() === locationFilter.toLowerCase();
        const stateMatch = p.location?.state?.toLowerCase().includes(locationFilter.toLowerCase());
        const areaMatch = p.location?.area?.toLowerCase().includes(locationFilter.toLowerCase());
        if (!cityMatch && !stateMatch && !areaMatch) return false;
      }

      // 2. Type filter
      if (typeFilter !== 'ALL') {
        if (typeFilter === 'SALE' && p.listingType !== 'SALE') return false;
        if (typeFilter === 'RENT' && !['RENT', 'LEASE', 'COMMERCIAL_LEASE'].includes(p.listingType))
          return false;
      }

      // 3. Price filter
      if (priceFilter !== 'ALL') {
        const amt = p.price?.amount || 0;
        if (priceFilter === 'UNDER_50L' && amt > 5000000) return false;
        if (priceFilter === '50L_1CR' && (amt < 5000000 || amt > 10000000)) return false;
        if (priceFilter === '1CR_2CR' && (amt < 10000000 || amt > 20000000)) return false;
        if (priceFilter === '2CR_PLUS' && amt < 20000000) return false;
      }

      return true;
    });
  }, [properties, locationFilter, typeFilter, priceFilter]);

  const displayedProperties = filteredProperties.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredProperties.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  const activeVideoProperty =
    activeVideoIndex !== null && displayedProperties[activeVideoIndex]
      ? displayedProperties[activeVideoIndex]
      : null;

  const handleOpenModal = (property: Property) => {
    const idx = displayedProperties.findIndex((p) => p.id === property.id);
    setActiveVideoIndex(idx >= 0 ? idx : 0);
    setShowDetailsDrawer(false);
  };

  const handleNextVideo = React.useCallback(() => {
    if (displayedProperties.length === 0) return;
    setActiveVideoIndex((prev) => {
      const cur = prev ?? 0;
      return (cur + 1) % displayedProperties.length;
    });
    setShowDetailsDrawer(false);
  }, [displayedProperties.length]);

  const handlePrevVideo = React.useCallback(() => {
    if (displayedProperties.length === 0) return;
    setActiveVideoIndex((prev) => {
      const cur = prev ?? 0;
      return (cur - 1 + displayedProperties.length) % displayedProperties.length;
    });
    setShowDetailsDrawer(false);
  }, [displayedProperties.length]);

  // Keyboard navigation: Left/Right arrows + Escape
  React.useEffect(() => {
    if (activeVideoIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextVideo();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevVideo();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setActiveVideoIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVideoIndex, handleNextVideo, handlePrevVideo]);

  if (!isLoading && properties.length === 0) {
    return null;
  }

  return (
    <section
      id="video-properties"
      className="py-16 bg-gradient-to-b from-casa-surface via-casa-canvas to-casa-surface border-b border-casa-border-light relative overflow-hidden"
    >
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-casa-brand/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <Container>
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/10 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span>9:16 Video Property Reels</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-casa-text-primary tracking-tight">
              Watch Verified Property Walkthroughs
            </h2>
            <p className="text-xs sm:text-sm text-casa-text-secondary mt-1 max-w-2xl">
              Experience dynamic vertical video tours, architectural walkthroughs, and society drone views before you visit in person.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">

            <div className="flex items-center gap-1.5 text-xs font-semibold text-casa-text-muted px-2.5 py-1.5 rounded-xl bg-casa-surface border border-casa-border-light">
              <Video className="w-3.5 h-3.5 text-casa-brand" />
              <span>Showing {displayedProperties.length} of {filteredProperties.length} Reels</span>
            </div>
          </div>
        </div>

        {/* Working Filter Bar: Location, Property Type, Price Range */}
        <div className="p-3 bg-casa-surface border border-casa-border-light rounded-2xl shadow-subtle mb-8 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-casa-text-primary px-2">
            <Filter className="w-3.5 h-3.5 text-casa-brand" />
            <span>Filter Videos:</span>
          </div>

          {/* Location Filter */}
          <div className="flex-1 min-w-[140px]">
            <select
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setVisibleCount(9);
              }}
              className="w-full px-3 py-2 text-xs font-medium bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
            >
              <option value="ALL">All Locations</option>
              <option value="Lucknow">Lucknow, UP</option>
              <option value="Ahmedabad">Ahmedabad, Gujarat</option>
              <option value="Mumbai">Mumbai, Maharashtra</option>
              <option value="Bengaluru">Bengaluru, Karnataka</option>
              <option value="Gurugram">Gurugram / Delhi NCR</option>
            </select>
          </div>

          {/* Property Type Filter */}
          <div className="flex-1 min-w-[130px]">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setVisibleCount(9);
              }}
              className="w-full px-3 py-2 text-xs font-medium bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
            >
              <option value="ALL">All Listing Types</option>
              <option value="SALE">For Sale (Buy)</option>
              <option value="RENT">For Rent / Lease</option>
            </select>
          </div>

          {/* Price Range Filter */}
          <div className="flex-1 min-w-[140px]">
            <select
              value={priceFilter}
              onChange={(e) => {
                setPriceFilter(e.target.value);
                setVisibleCount(9);
              }}
              className="w-full px-3 py-2 text-xs font-medium bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
            >
              <option value="ALL">All Price Ranges</option>
              <option value="UNDER_50L">Under ₹50 Lacs</option>
              <option value="50L_1CR">₹50 Lacs - ₹1 Crore</option>
              <option value="1CR_2CR">₹1 Crore - ₹2 Crore</option>
              <option value="2CR_PLUS">₹2 Crore & Above</option>
            </select>
          </div>

          {/* Reset button if active */}
          {(locationFilter !== 'ALL' || typeFilter !== 'ALL' || priceFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setLocationFilter('ALL');
                setTypeFilter('ALL');
                setPriceFilter('ALL');
                setVisibleCount(9);
              }}
              className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* 9:16 Vertical Video Grid: 4 to 5 cards per row on desktop screens */}
        {displayedProperties.length === 0 ? (
          <div className="text-center py-16 bg-casa-surface rounded-2xl border border-casa-border-light space-y-3">
            <Video className="w-10 h-10 text-casa-text-muted mx-auto" />
            <h3 className="text-sm font-bold text-casa-text-primary">No Video Properties Match Your Filter</h3>
            <p className="text-xs text-casa-text-secondary max-w-sm mx-auto">
              Try switching your location or price filters to explore other video reels in our marketplace.
            </p>
            <button
              type="button"
              onClick={() => {
                setLocationFilter('ALL');
                setTypeFilter('ALL');
                setPriceFilter('ALL');
              }}
              className="px-4 py-2 bg-casa-brand text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Show All Videos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
            {displayedProperties.map((property) => {
              const rawCardVideo = (
                property.media?.videoUrl ||
                (property as any).videoUrl ||
                (property.media?.videos && property.media.videos[0]) ||
                ''
              ).trim();
              const parsed = parseYouTubeUrl(rawCardVideo);
              const thumb =
                property.media?.thumbnailUrl ||
                (property as any).thumbnailUrl ||
                property.media?.coverImage ||
                (property.media?.images && property.media.images[0]) ||
                parsed.thumbnailUrl ||
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
              const priceText = formatPrice(property.price?.amount || 0);
              const isDemo = property.id.startsWith('vid-reel-');

              const locationString = formatPropertyLocation(property.location);

              return (
                <div
                  key={property.id}
                  className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md hover:shadow-2xl hover:border-casa-brand/60 transition-all duration-300 flex flex-col justify-between aspect-[9/16]"
                >
                  {/* Background Video Reel Thumbnail Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumb}
                    alt={typeof property.title === 'string' ? property.title : property.title?.en}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    loading="lazy"
                  />

                  {/* Gradient Overlays for readable text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/60 pointer-events-none" />

                  {/* Top Bar: Badge, Type & Delete Button */}
                  <div className="relative z-10 p-3 flex items-center justify-between">
                    {(() => {
                      const source = detectVideoSource(rawCardVideo);
                      if (source === 'YOUTUBE') {
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600/90 text-white text-[10px] font-bold border border-white/20 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>YouTube</span>
                          </span>
                        );
                      }
                      if (source === 'INSTAGRAM') {
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white text-[10px] font-bold border border-white/20 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>Instagram</span>
                          </span>
                        );
                      }
                      return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          <span>9:16 Reel</span>
                        </span>
                      );
                    })()}

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-casa-brand text-white shadow-xs">
                        {property.listingType === 'SALE' ? 'BUY' : 'RENT'}
                      </span>
                    </div>
                  </div>

                  {/* Center Play Button Overlay */}
                  <div className="relative z-10 my-auto flex flex-col items-center justify-center p-4">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(property)}
                      className="w-14 h-14 rounded-full bg-white/90 hover:bg-white text-casa-brand flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all cursor-pointer backdrop-blur-sm"
                      title="Play Walkthrough Video Reel"
                    >
                      <Play className="w-6 h-6 fill-current ml-1" />
                    </button>
                    <span className="mt-2 text-[10px] font-bold text-white/90 tracking-wider uppercase drop-shadow">
                      Watch Reel
                    </span>
                  </div>

                  {/* Bottom Card Details */}
                  <div className="relative z-10 p-3 space-y-1.5 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                    {/* Price */}
                    <div className="text-base font-extrabold text-white tracking-tight drop-shadow-sm">
                      {priceText}
                      {property.listingType !== 'SALE' && (
                        <span className="text-[10px] text-white/70 font-normal"> / mo</span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                      {typeof property.title === 'string' ? property.title : property.title?.en}
                    </h4>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-[11px] text-white/80 truncate">
                      <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
                      <span className="truncate">{locationString || property.location?.city}</span>
                    </div>

                    {/* Bottom Action: Direct View Link */}
                    <div className="pt-2 flex items-center gap-2">
                      <Link
                        href={`/property/${property.slug || property.id}`}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-white/20 hover:bg-white text-white hover:text-black text-[11px] font-semibold text-center transition-all flex items-center justify-center gap-1 backdrop-blur-md"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleOpenModal(property)}
                        className="p-1.5 rounded-xl bg-casa-brand text-white hover:bg-casa-brand-hover text-xs transition-colors cursor-pointer"
                        title="Preview Video in Popup"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Working "Load More / View More" Option */}
        {canLoadMore && (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={handleLoadMore}
              className="px-6 py-3 rounded-xl bg-casa-surface border border-casa-border-light hover:border-casa-brand text-xs font-bold text-casa-text-primary shadow-subtle hover:bg-casa-subtle/40 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Video className="w-4 h-4 text-casa-brand" />
              <span>Load More Video Properties ({filteredProperties.length - visibleCount} remaining)</span>
            </button>
          </div>
        )}

        {/* 9:16 Video Reel Interactive Modal Player */}
        {activeVideoProperty && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
            {/* Global Left / Previous Arrow Button */}
            <button
              type="button"
              onClick={handlePrevVideo}
              className="fixed left-3 sm:left-6 md:left-12 lg:left-24 top-1/2 -translate-y-1/2 z-50 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/30 active:scale-95 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-2xl hover:scale-110 cursor-pointer"
              title="Previous Reel (Left Arrow key)"
              aria-label="Previous Video Reel"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>

            {/* Global Right / Next Arrow Button */}
            <button
              type="button"
              onClick={handleNextVideo}
              className="fixed right-3 sm:right-6 md:right-12 lg:right-24 top-1/2 -translate-y-1/2 z-50 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/30 active:scale-95 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-2xl hover:scale-110 cursor-pointer"
              title="Next Reel (Right Arrow key)"
              aria-label="Next Video Reel"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>

            {/* 9:16 Vertical Video Frame Container */}
            <div className="relative w-full max-w-sm sm:max-w-md bg-slate-950 rounded-3xl overflow-hidden border border-white/20 shadow-2xl flex flex-col aspect-[9/16] max-h-[90vh]">
              {/* Top Navigation & Status Bar */}
              <div className="absolute top-0 inset-x-0 z-30 p-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span>Reel {(activeVideoIndex ?? 0) + 1} / {displayedProperties.length}</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-casa-brand text-white shadow-xs">
                    {activeVideoProperty.listingType === 'SALE' ? 'BUY' : 'RENT'}
                  </span>
                </div>

                {/* Close Modal Button */}
                <button
                  type="button"
                  onClick={() => setActiveVideoIndex(null)}
                  className="w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer border border-white/20"
                  title="Close Reel Player (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Video Player Box */}
              <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                {(() => {
                  const rawUrl = (
                    activeVideoProperty.media?.videoUrl ||
                    (activeVideoProperty as any).videoUrl ||
                    (activeVideoProperty.media?.videos && activeVideoProperty.media.videos[0]) ||
                    ''
                  ).trim();

                  const sourceType = detectVideoSource(rawUrl);

                  // 1. YouTube Source
                  if (sourceType === 'YOUTUBE') {
                    const ytParsed = parseYouTubeUrl(rawUrl);
                    const embed =
                      ytParsed.embedUrl ||
                      (ytParsed.videoId
                        ? `https://www.youtube.com/embed/${ytParsed.videoId}?autoplay=1&mute=0&playsinline=1&rel=0&modestbranding=1`
                        : rawUrl);
                    return (
                      <iframe
                        key={`${activeVideoProperty.id}-${embed}`}
                        src={embed}
                        title={
                          typeof activeVideoProperty.title === 'string'
                            ? activeVideoProperty.title
                            : activeVideoProperty.title?.en || 'Property Video Reel'
                        }
                        className="w-full h-full object-cover border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    );
                  }

                  // 2. Instagram Source
                  if (sourceType === 'INSTAGRAM') {
                    const igParsed = parseInstagramUrl(rawUrl);
                    if (igParsed.isValid && igParsed.embedUrl) {
                      return (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
                          <iframe
                            key={`${activeVideoProperty.id}-${igParsed.embedUrl}`}
                            src={igParsed.embedUrl}
                            title="Instagram Reel"
                            className="w-full h-full border-0"
                            allow="autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen
                          />
                          <div className="absolute top-14 right-2 z-20">
                            <a
                              href={igParsed.directUrl || rawUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-full bg-black/75 hover:bg-black text-white text-[10px] font-semibold border border-white/20 flex items-center gap-1 shadow-lg backdrop-blur-sm"
                              title="Open directly on Instagram"
                            >
                              <span>Open on Instagram</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    }

                    // Fallback for restricted or unsupported Instagram links
                    return (
                      <div className="flex flex-col items-center justify-center text-center p-6 text-white space-y-3">
                        <Video className="w-12 h-12 text-pink-500 opacity-80" />
                        <p className="text-sm font-semibold">Instagram Video Notice</p>
                        <p className="text-xs text-white/70 max-w-xs">
                          This Instagram video is restricted or requires viewing directly in Instagram.
                        </p>
                        <a
                          href={rawUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 hover:opacity-90 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md"
                        >
                          <span>Watch on Instagram</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    );
                  }

                  // 3. Local / Cloudinary / ImageKit / Direct MP4 or WebM video
                  if (rawUrl) {
                    return (
                      <video
                        key={`${activeVideoProperty.id}-${rawUrl}`}
                        src={rawUrl}
                        controls
                        autoPlay
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    );
                  }

                  return (
                    <div className="flex flex-col items-center justify-center text-center p-6 text-white space-y-2">
                      <Video className="w-12 h-12 text-casa-brand opacity-60" />
                      <p className="text-sm font-semibold">Video preview unavailable</p>
                      <p className="text-xs text-white/60">No valid video link was attached to this property.</p>
                    </div>
                  );
                })()}

                {/* In-Video Mobile Touch Arrows */}
                <button
                  type="button"
                  onClick={handlePrevVideo}
                  className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80"
                  title="Previous Video"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextVideo}
                  className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80"
                  title="Next Video"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Expandable Full Property Details Drawer / Sheet */}
              {showDetailsDrawer ? (
                <div className="absolute inset-x-0 bottom-0 top-14 z-30 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 p-4 overflow-y-auto space-y-3.5 flex flex-col justify-between animate-in slide-in-from-bottom-6 duration-200">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-casa-brand">
                        <Info className="w-3.5 h-3.5" />
                        <span>Verified Property Details</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDetailsDrawer(false)}
                        className="text-xs text-white/70 hover:text-white px-2 py-0.5 rounded-lg bg-white/10"
                      >
                        Hide Details
                      </button>
                    </div>

                    {/* Price & Category */}
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-black text-white">
                        {formatPrice(activeVideoProperty.price?.amount || 0)}
                        {activeVideoProperty.listingType !== 'SALE' && (
                          <span className="text-xs text-white/70 font-normal"> / mo</span>
                        )}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-casa-brand text-white">
                        {activeVideoProperty.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-white leading-snug">
                      {typeof activeVideoProperty.title === 'string'
                        ? activeVideoProperty.title
                        : activeVideoProperty.title?.en}
                    </h3>

                    {/* Location Breakdown */}
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-red-400 font-semibold">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>
                          {activeVideoProperty.location?.society || activeVideoProperty.location?.subArea || 'Prime Location'}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/70 pl-5">
                        {formatPropertyLocation(activeVideoProperty.location, { showState: true })}
                      </p>
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      {activeVideoProperty.specs?.bedrooms ? (
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <Bed className="w-3.5 h-3.5 text-casa-brand mx-auto mb-0.5" />
                          <div className="font-bold text-white">{activeVideoProperty.specs.bedrooms} BHK</div>
                          <div className="text-[10px] text-white/60">Bedrooms</div>
                        </div>
                      ) : null}
                      {activeVideoProperty.specs?.bathrooms ? (
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <Bath className="w-3.5 h-3.5 text-amber-400 mx-auto mb-0.5" />
                          <div className="font-bold text-white">{activeVideoProperty.specs.bathrooms} Baths</div>
                          <div className="text-[10px] text-white/60">Bathrooms</div>
                        </div>
                      ) : null}
                      {activeVideoProperty.specs?.carpetAreaSqFt || activeVideoProperty.specs?.area ? (
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <Square className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-0.5" />
                          <div className="font-bold text-white">
                            {activeVideoProperty.specs.carpetAreaSqFt || activeVideoProperty.specs.area}
                          </div>
                          <div className="text-[10px] text-white/60">Sq. Ft.</div>
                        </div>
                      ) : null}
                    </div>

                    {/* Advertiser & Direct Contact */}
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="truncate pr-2">
                        <div className="text-[11px] text-white/60">Listing Agent</div>
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                          <span>{activeVideoProperty.advertiser?.name || 'myproperty Verified Partner'}</span>
                          {activeVideoProperty.advertiser?.isVerifiedAgent && (
                            <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {activeVideoProperty.advertiser?.phone && (
                          <>
                            <a
                              href={`https://wa.me/${activeVideoProperty.advertiser.phone.replace(/\D/g, '')}?text=Hi,%20I%20am%20interested%20in%20property%20listing:%20${encodeURIComponent(typeof activeVideoProperty.title === 'string' ? activeVideoProperty.title : activeVideoProperty.title?.en || '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`tel:${activeVideoProperty.advertiser.phone}`}
                              className="p-1.5 rounded-lg bg-casa-brand hover:bg-casa-brand-hover text-white transition-colors"
                              title="Call Agent"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Direct Link to Complete Property Detail Page */}
                  <div className="pt-2">
                    <Link
                      href={`/property/${activeVideoProperty.slug || activeVideoProperty.id}`}
                      onClick={() => setActiveVideoIndex(null)}
                      className="w-full py-2.5 px-4 rounded-xl bg-casa-brand hover:bg-casa-brand-hover text-white text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <span>Open Full Property Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                /* Collapsed Bottom Bar in Modal with Quick Info & "View Details" Trigger */
                <div className="p-3.5 bg-slate-900 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-extrabold text-white">
                      {formatPrice(activeVideoProperty.price?.amount || 0)}
                      {activeVideoProperty.listingType !== 'SALE' && (
                        <span className="text-[10px] text-white/70 font-normal"> / mo</span>
                      )}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-casa-brand text-white">
                      {activeVideoProperty.category}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white line-clamp-1">
                    {typeof activeVideoProperty.title === 'string'
                      ? activeVideoProperty.title
                      : activeVideoProperty.title?.en}
                  </h3>

                  <div className="flex items-center justify-between pt-1 gap-2">
                    <span className="text-[11px] text-white/70 flex items-center gap-1 truncate max-w-[150px]">
                      <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
                      <span className="truncate">
                        {activeVideoProperty.location?.society || activeVideoProperty.location?.area || activeVideoProperty.location?.city}
                      </span>
                    </span>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* View Details button opens specs inside modal */}
                      <button
                        type="button"
                        onClick={() => setShowDetailsDrawer(true)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white text-white hover:text-black text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                        title="View Property Specs & Details"
                      >
                        <Info className="w-3 h-3" />
                        <span>View Details</span>
                      </button>

                      {/* Full Listing Link */}
                      <Link
                        href={`/property/${activeVideoProperty.slug || activeVideoProperty.id}`}
                        onClick={() => setActiveVideoIndex(null)}
                        className="px-2.5 py-1.5 rounded-xl bg-casa-brand text-white text-[11px] font-semibold hover:bg-casa-brand-hover transition-colors inline-flex items-center gap-1"
                        title="Open Full Property Page"
                      >
                        <span>Full Page</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
