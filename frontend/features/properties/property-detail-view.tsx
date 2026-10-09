'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Property } from '@/types';
import { Container, Card, Badge } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/features/properties/property-card';
import { formatPrice } from '@/lib/utils';
import { buildWhatsAppEnquiryUrl } from '@/lib/whatsapp';
import { getCategoryLabel } from '@/lib/categories';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/contexts/toast-context';
import { useAuth } from '@/contexts/auth-context';
import { useSavedProperties } from '@/contexts/saved-properties-context';
import { useComparison } from '@/contexts/comparison-context';
import { recordRecentlyViewed } from '@/services/purchaser-service';
import { createLead } from '@/services/lead-service';
import { EngagementService, Review } from '@/services/engagement-service';
import { trackMarketplaceEvent } from '@/lib/analytics';
import {
  MapPin,
  Bed,
  Bath,
  Maximize,
  Phone,
  MessageSquare,
  Heart,
  Share2,
  ChevronRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  Compass,
  Car,
  Layers,
  Sparkles,
  Info,
  Send,
  Calendar,
  Flag,
  Star,
  X,
  Lock,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Play,
  Video,
  Film,
  AlertTriangle,
} from 'lucide-react';
import { parseYouTubeUrl } from '@/lib/video';

interface PropertyDetailViewProps {
  property: Property;
  similarProperties: Property[];
  source: 'api' | 'fallback_dev';
}

export function PropertyDetailView({
  property,
  similarProperties,
  source,
}: PropertyDetailViewProps) {
  const { locale, t, isRtl } = useLanguage();
  const toast = useToast();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { isSaved, toggleSave } = useSavedProperties();
  const { isCompared, addToCompare, removeFromCompare } = useComparison();
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

  const hasVideo = Boolean(property.media?.videoUrl);
  const isVideoPrimary = property.media?.primaryMediaType === 'VIDEO' || (hasVideo && (!property.media?.images || property.media.images.length === 0));
  const [activeMediaMode, setActiveMediaMode] = React.useState<'VIDEO' | 'IMAGE'>(
    hasVideo && isVideoPrimary ? 'VIDEO' : 'IMAGE'
  );
  const [videoLoadError, setVideoLoadError] = React.useState(false);

  const videoUrl = property.media?.videoUrl;
  const isYouTube = hasVideo && (property.media?.videoType === 'YOUTUBE' || videoUrl?.includes('youtu'));
  const parsedYouTube = isYouTube && videoUrl ? parseYouTubeUrl(videoUrl) : null;

  const propertyId = property.id || (property as any)._id;
  const saved = isSaved(propertyId);
  const compared = isCompared(propertyId);

  // Track property view on mount
  React.useEffect(() => {
    if (propertyId) {
      trackMarketplaceEvent('PROPERTY_VIEW', {
        propertyId,
        location: {
          city: property.location?.city,
          locality: property.location?.locality,
          state: property.location?.state,
        },
      });
    }
  }, [propertyId, property.location]);

  // Modals state
  const [showSiteVisitModal, setShowSiteVisitModal] = React.useState(false);
  const [showReportModal, setShowReportModal] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  // Site visit form state
  const [siteVisitDate, setSiteVisitDate] = React.useState('');
  const [siteVisitTime, setSiteVisitTime] = React.useState('11:00 AM');
  const [siteVisitMobile, setSiteVisitMobile] = React.useState(user?.mobile || '');
  const [siteVisitNotes, setSiteVisitNotes] = React.useState('');
  const [isSubmittingSiteVisit, setIsSubmittingSiteVisit] = React.useState(false);

  // Report form state
  const [reportReason, setReportReason] = React.useState('INAPPROPRIATE_CONTENT');
  const [reportDescription, setReportDescription] = React.useState('');
  const [isSubmittingReport, setIsSubmittingReport] = React.useState(false);

  // Reviews state
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = React.useState(true);
  const [ratingInput, setRatingInput] = React.useState(5);
  const [reviewComment, setReviewComment] = React.useState('');
  const [isSubmittingReview, setIsSubmittingReview] = React.useState(false);
  const [reviewSubmitted, setReviewSubmitted] = React.useState(false);

  // Auto-record recently viewed on mount
  React.useEffect(() => {
    if (isAuthenticated && propertyId) {
      recordRecentlyViewed(propertyId);
    }
  }, [isAuthenticated, propertyId]);

  // Load reviews
  const fetchReviews = React.useCallback(async () => {
    if (!propertyId) return;
    try {
      setLoadingReviews(true);
      const res = await EngagementService.getPropertyReviews(propertyId);
      if (res.success && res.data) {
        setReviews(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingReviews(false);
    }
  }, [propertyId]);

  React.useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const images =
    property.media.images && property.media.images.length > 0
      ? property.media.images
      : [property.media.thumbnailUrl];

  const localizedTitle =
    property.title[locale] || property.title.en || 'Property Details';

  const localizedDescription =
    property.description[locale] || property.description.en || '';

  const localizedCategory = getCategoryLabel(property.category, locale);

  const formattedPrice = formatPrice(
    property.price.amount,
    property.price.currency,
  );

  // Price per sqft calculation
  const pricePerSqFt =
    property.specs?.carpetAreaSqFt && property.specs.carpetAreaSqFt > 0
      ? Math.round((property.price?.amount || 0) / property.specs.carpetAreaSqFt)
      : null;

  const whatsappUrl = buildWhatsAppEnquiryUrl({
    phone: property.advertiser.phone,
    propertyTitle: localizedTitle,
    priceText: formattedPrice,
    propertySlug: property.slug,
    category: localizedCategory,
    location: `${property.location.locality}, ${property.location.city}`,
  });

  const toggleFavorite = async () => {
    await toggleSave(propertyId, localizedTitle);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const url = `${window.location.origin}/property/${property.slug}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast.success('Copied!', 'Property link copied to clipboard.');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleNativeShare = () => {
    if (typeof window !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: localizedTitle,
          text: `Check out this property on CASA: ${localizedTitle} for ${formattedPrice}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      setShowShareModal(true);
    }
  };

  // Chat with Agent
  const handleStartChat = async () => {
    if (!isAuthenticated) {
      toast.warning('Authentication Required', 'Please sign in to start a direct message with the agent.');
      return;
    }

    const advertiserId = (property.advertiser as any)?._id || (property.advertiser as any)?.id;
    if (!advertiserId) {
      router.push('/dashboard/messages');
      return;
    }

    try {
      const res = await EngagementService.getOrCreateConversation(advertiserId, propertyId);
      if (res.success && res.data) {
        router.push(`/dashboard/messages?conversationId=${res.data._id}`);
      } else {
        router.push('/dashboard/messages');
      }
    } catch {
      router.push('/dashboard/messages');
    }
  };

  // Site Visit Booking Submit
  const handleSiteVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warning('Sign in required', 'Please sign in to book a site visit.');
      return;
    }
    if (!siteVisitDate) {
      toast.error('Date required', 'Please select a preferred visit date.');
      return;
    }

    try {
      setIsSubmittingSiteVisit(true);
      const res = await EngagementService.requestSiteVisit({
        propertyId,
        preferredDate: siteVisitDate,
        preferredTime: siteVisitTime,
        buyerPhone: siteVisitMobile || user?.mobile,
        notes: siteVisitNotes,
      });

      if (res.success) {
        setShowSiteVisitModal(false);
        toast.success('Site Visit Requested', 'The agent will review and confirm your site visit appointment shortly.');
      }
    } catch (err: any) {
      toast.error('Booking failed', err.message || 'Could not schedule site visit.');
    } finally {
      setIsSubmittingSiteVisit(false);
    }
  };

  // Report Submit
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warning('Sign in required', 'Please sign in to submit a property report.');
      return;
    }

    try {
      setIsSubmittingReport(true);
      const res = await EngagementService.submitPropertyReport({
        propertyId,
        reason: reportReason,
        description: reportDescription,
      });

      if (res.success) {
        setShowReportModal(false);
        setReportDescription('');
        toast.success('Report Submitted', 'Our moderation team will review this listing promptly.');
      }
    } catch (err: any) {
      toast.error('Report failed', err.message || 'Could not submit report.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Review Submit
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warning('Sign in required', 'Please sign in to write a review.');
      return;
    }

    try {
      setIsSubmittingReview(true);
      const res = await EngagementService.submitReview({
        propertyId,
        agentId: (property.advertiser as any)?._id || (property.advertiser as any)?.id,
        rating: ratingInput,
        comment: reviewComment,
      });

      if (res.success) {
        setReviewSubmitted(true);
        setReviewComment('');
        toast.success('Review Submitted', 'Thank you! Your feedback has been sent for moderation and will appear once approved.');
        fetchReviews();
      }
    } catch (err: any) {
      toast.error('Review failed', err.message || 'Could not submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const [leadForm, setLeadForm] = React.useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
    email: user?.email || '',
    message: `Hi, I am interested in "${localizedTitle}". Please share more details.`,
  });

  // Sync user details if user signs in later
  React.useEffect(() => {
    if (user) {
      setLeadForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        mobile: prev.mobile || user.mobile || '',
        email: prev.email || user.email || '',
      }));
      setSiteVisitMobile(user.mobile || '');
    }
  }, [user]);

  const [isSubmittingLead, setIsSubmittingLead] = React.useState(false);
  const [leadSubmitted, setLeadSubmitted] = React.useState(false);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.mobile) {
      toast.error('Validation Error', 'Please provide your name and mobile number.');
      return;
    }
    setIsSubmittingLead(true);
    try {
      await createLead({
        propertyId: property.id,
        name: leadForm.name,
        mobile: leadForm.mobile,
        email: leadForm.email || undefined,
        message: leadForm.message,
        source: 'PROPERTY_PAGE',
      });
      setLeadSubmitted(true);
      toast.success('Enquiry Sent', 'Your enquiry has been delivered to the property advertiser.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not send enquiry.';
      toast.error('Enquiry Failed', msg);
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/property/${property.slug}` : '';

  return (
    <div className="py-8 md:py-12 bg-casa-canvas text-start transition-colors duration-200">
      <Container>
        {/* Controlled dev notice */}
        {source === 'fallback_dev' && (
          <div className="mb-6 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-casa-brand flex-shrink-0" />
              <span>
                <strong>Development Showcase Mode:</strong> Viewing verified real estate layout with isolated mock property specifications.
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-200/60 dark:bg-blue-900 rounded">
              Phase 15 Verified
            </span>
          </div>
        )}

        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-casa-text-muted mb-6 overflow-x-auto whitespace-nowrap py-1"
        >
          <Link href="/" className="hover:text-casa-brand transition-colors">
            {t('home')}
          </Link>
          <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${isRtl ? 'rtl-flip' : ''}`} />
          <Link
            href={`/#categories`}
            className="hover:text-casa-brand transition-colors"
          >
            {localizedCategory}
          </Link>
          <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${isRtl ? 'rtl-flip' : ''}`} />
          <span className="text-casa-text-primary font-medium truncate max-w-xs sm:max-w-md">
            {localizedTitle}
          </span>
        </nav>

        {/* Main Grid: Gallery & Details on left (2 cols), Sticky Contact Sidebar on right (1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Media Gallery, Overview, Specs, Amenities, Description, Reviews */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery Card */}
            <Card className="p-0 overflow-hidden border-casa-border-light shadow-subtle">
              {/* Media Switcher Header (if Video is available) */}
              {hasVideo && (
                <div className="flex border-b border-casa-border-light bg-casa-subtle/50 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveMediaMode('VIDEO')}
                    className={`flex-1 py-2.5 px-4 font-bold flex items-center justify-center gap-2 transition-colors ${
                      activeMediaMode === 'VIDEO'
                        ? 'bg-casa-surface text-rose-600 border-b-2 border-rose-600'
                        : 'text-casa-text-muted hover:text-casa-text-primary'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-rose-600" />
                    <span>Property Video Tour</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMediaMode('IMAGE')}
                    className={`flex-1 py-2.5 px-4 font-bold flex items-center justify-center gap-2 transition-colors ${
                      activeMediaMode === 'IMAGE'
                        ? 'bg-casa-surface text-casa-brand border-b-2 border-casa-brand'
                        : 'text-casa-text-muted hover:text-casa-text-primary'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Photo Gallery ({images.length})</span>
                  </button>
                </div>
              )}

              {/* Primary Active Display Area */}
              <div className="relative aspect-[16/10] w-full bg-black overflow-hidden">
                {/* Mode 1: Property Video Player */}
                {hasVideo && activeMediaMode === 'VIDEO' && !videoLoadError ? (
                  <div className="w-full h-full relative flex items-center justify-center bg-black">
                    {isYouTube && parsedYouTube?.embedUrl ? (
                      <iframe
                        src={parsedYouTube.embedUrl}
                        title={localizedTitle}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : videoUrl ? (
                      <video
                        src={videoUrl}
                        controls
                        autoPlay
                        muted
                        playsInline
                        poster={property.media.thumbnailUrl}
                        onError={() => {
                          setVideoLoadError(true);
                          setActiveMediaMode('IMAGE');
                          toast.warning('Video Notice', 'Video stream unavailable. Showing photo gallery.');
                        }}
                        className="w-full h-full object-contain"
                      />
                    ) : null}
                  </div>
                ) : (
                  /* Mode 2: Photo Display */
                  <Image
                    src={images[selectedImageIndex] || property.media.thumbnailUrl}
                    alt={`${localizedTitle} - Photo ${selectedImageIndex + 1}`}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover transition-all duration-300"
                  />
                )}

                {/* Badges Overlay */}
                <div className="absolute top-4 start-4 flex flex-wrap gap-2 z-10 pointer-events-none">
                  {hasVideo && activeMediaMode === 'VIDEO' && (
                    <Badge variant="default" size="md" className="bg-rose-600 text-white font-bold shadow-subtle border-0">
                      <Play className="w-3 h-3 fill-white inline mr-1" /> Video Tour
                    </Badge>
                  )}
                  {property.isFeatured && (
                    <Badge variant="featured" size="md">
                      ★ {t('featured')}
                    </Badge>
                  )}
                  <Badge variant="default" size="md" className="bg-casa-surface/95 backdrop-blur-sm font-semibold shadow-subtle">
                    {localizedCategory}
                  </Badge>
                  <Badge variant="default" size="md" className="bg-casa-surface/95 backdrop-blur-sm font-semibold text-casa-brand shadow-subtle">
                    {property.listingType === 'SALE'
                      ? t('forSale')
                      : property.listingType === 'RENT'
                      ? t('forRent')
                      : t('forLease')}
                  </Badge>
                </div>

                {/* Gallery Quick Counter & Actions */}
                <div className="absolute top-4 end-4 flex items-center gap-2 z-10">
                  {activeMediaMode === 'IMAGE' && (
                    <span className="text-[11px] font-semibold bg-black/60 text-white backdrop-blur-md px-2.5 py-1 rounded-full">
                      {selectedImageIndex + 1} / {images.length}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    aria-label="Share property link"
                    className="w-8 h-8 rounded-full bg-casa-surface/90 backdrop-blur-md text-casa-text-secondary hover:text-casa-brand flex items-center justify-center transition-colors shadow-subtle cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (compared) removeFromCompare(propertyId);
                      else addToCompare(propertyId);
                    }}
                    title={compared ? 'Remove from compare' : 'Add to compare'}
                    aria-label="Compare property"
                    className={`w-8 h-8 rounded-full bg-casa-surface/90 backdrop-blur-md flex items-center justify-center transition-colors shadow-subtle cursor-pointer ${
                      compared ? 'text-casa-brand bg-casa-brand/20' : 'text-casa-text-secondary hover:text-casa-brand'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleFavorite}
                    aria-label={saved ? 'Remove from favorites' : 'Save to favorites'}
                    className="w-8 h-8 rounded-full bg-casa-surface/90 backdrop-blur-md text-casa-text-secondary hover:text-rose-500 flex items-center justify-center transition-colors shadow-subtle cursor-pointer"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        saved ? 'fill-rose-500 text-rose-500' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Thumbnail Strip (Includes Video Tile + Photos) */}
              <div className="p-3 bg-casa-surface border-t border-casa-border-light flex gap-2.5 overflow-x-auto">
                {/* Video Thumbnail Button */}
                {hasVideo && (
                  <button
                    type="button"
                    onClick={() => setActiveMediaMode('VIDEO')}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer bg-slate-900 flex flex-col items-center justify-center ${
                      activeMediaMode === 'VIDEO'
                        ? 'border-rose-600 scale-105 shadow-subtle ring-2 ring-rose-500/30'
                        : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    {parsedYouTube?.thumbnailUrl || property.media.thumbnailUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={parsedYouTube?.thumbnailUrl || property.media.thumbnailUrl}
                        alt="Video Tour"
                        className="w-full h-full object-cover opacity-60"
                      />
                    ) : null}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-0.5 bg-black/40">
                      <Play className="w-4 h-4 fill-white" />
                      <span className="text-[8px] font-bold uppercase tracking-wider">Video</span>
                    </div>
                  </button>
                )}

                {/* Photo Thumbnails */}
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveMediaMode('IMAGE');
                      setSelectedImageIndex(idx);
                    }}
                    aria-label={`View photo ${idx + 1}`}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                      activeMediaMode === 'IMAGE' && selectedImageIndex === idx
                        ? 'border-casa-brand scale-105 shadow-subtle'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </Card>

            {/* Core Header Information */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-casa-text-primary leading-tight mb-2">
                    {localizedTitle}
                  </h1>
                  <div className="flex items-center gap-1.5 text-sm text-casa-text-secondary">
                    <MapPin className="w-4 h-4 text-casa-brand flex-shrink-0" />
                    <span>
                      {property.location.locality}, {property.location.city}, {property.location.state}
                    </span>
                  </div>
                </div>

                <div className="text-start sm:text-end">
                  <div className="text-3xl font-extrabold text-casa-brand tracking-tight">
                    {formattedPrice}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-casa-text-muted sm:justify-end">
                    {property.price.isNegotiable && (
                      <span className="text-amber-600 font-semibold">{t('negotiable')}</span>
                    )}
                    {pricePerSqFt && (
                      <span>• ₹{pricePerSqFt.toLocaleString()}/sq.ft</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Specifications Grid */}
            <Card className="p-6 border-casa-border-light">
              <h2 className="text-base font-bold text-casa-text-primary mb-4 flex items-center gap-2">
                <Building className="w-4 h-4 text-casa-brand" />
                <span>{t('propertyOverview')}</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-start">
                {property.specs?.bedrooms && (
                  <div className="p-3.5 rounded-2xl bg-casa-canvas border border-casa-border-light">
                    <div className="flex items-center gap-1.5 text-xs text-casa-text-muted mb-1">
                      <Bed className="w-3.5 h-3.5 text-casa-brand" />
                      <span>{t('beds')}</span>
                    </div>
                    <span className="text-sm font-bold text-casa-text-primary">
                      {property.specs.bedrooms} BHK
                    </span>
                  </div>
                )}

                {property.specs?.bathrooms && (
                  <div className="p-3.5 rounded-2xl bg-casa-canvas border border-casa-border-light">
                    <div className="flex items-center gap-1.5 text-xs text-casa-text-muted mb-1">
                      <Bath className="w-3.5 h-3.5 text-casa-brand" />
                      <span>{t('baths')}</span>
                    </div>
                    <span className="text-sm font-bold text-casa-text-primary">
                      {property.specs.bathrooms} Baths
                    </span>
                  </div>
                )}

                {property.specs?.carpetAreaSqFt && (
                  <div className="p-3.5 rounded-2xl bg-casa-canvas border border-casa-border-light">
                    <div className="flex items-center gap-1.5 text-xs text-casa-text-muted mb-1">
                      <Maximize className="w-3.5 h-3.5 text-casa-brand" />
                      <span>Carpet Area</span>
                    </div>
                    <span className="text-sm font-bold text-casa-text-primary">
                      {property.specs.carpetAreaSqFt.toLocaleString()} sq.ft
                    </span>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-casa-canvas border border-casa-border-light">
                  <div className="flex items-center gap-1.5 text-xs text-casa-text-muted mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Status</span>
                  </div>
                  <span className="text-sm font-bold text-casa-text-primary">
                    {property.specs?.constructionStatus?.replace(/_/g, ' ') || 'Ready'}
                  </span>
                </div>

                {property.specs?.furnishing && (
                  <div className="p-3.5 rounded-2xl bg-casa-canvas border border-casa-border-light">
                    <div className="flex items-center gap-1.5 text-xs text-casa-text-muted mb-1">
                      <Layers className="w-3.5 h-3.5 text-casa-brand" />
                      <span>{t('furnishingStatus')}</span>
                    </div>
                    <span className="text-sm font-bold text-casa-text-primary">
                      {property.specs.furnishing.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}

                {property.specs?.facing && (
                  <div className="p-3.5 rounded-2xl bg-casa-canvas border border-casa-border-light">
                    <div className="flex items-center gap-1.5 text-xs text-casa-text-muted mb-1">
                      <Compass className="w-3.5 h-3.5 text-casa-brand" />
                      <span>{t('facingDirection')}</span>
                    </div>
                    <span className="text-sm font-bold text-casa-text-primary">
                      {property.specs.facing}
                    </span>
                  </div>
                )}

                {property.specs?.parking && (
                  <div className="p-3.5 rounded-2xl bg-casa-canvas border border-casa-border-light">
                    <div className="flex items-center gap-1.5 text-xs text-casa-text-muted mb-1">
                      <Car className="w-3.5 h-3.5 text-casa-brand" />
                      <span>{t('parkingSpace')}</span>
                    </div>
                    <span className="text-sm font-bold text-casa-text-primary">
                      {property.specs.parking}
                    </span>
                  </div>
                )}

                {property.specs?.floorNumber && (
                  <div className="p-3.5 rounded-2xl bg-casa-canvas border border-casa-border-light">
                    <div className="flex items-center gap-1.5 text-xs text-casa-text-muted mb-1">
                      <Building className="w-3.5 h-3.5 text-casa-brand" />
                      <span>{t('floorLevel')}</span>
                    </div>
                    <span className="text-sm font-bold text-casa-text-primary">
                      {property.specs.floorNumber}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Description Section */}
            <Card className="p-6 border-casa-border-light">
              <h2 className="text-base font-bold text-casa-text-primary mb-3">
                {t('propertyDescription')}
              </h2>
              <p className="text-sm text-casa-text-secondary leading-relaxed whitespace-pre-line">
                {localizedDescription || 'No full description provided for this listing.'}
              </p>
            </Card>

            {/* Amenities & Features */}
            {property.amenities && property.amenities.length > 0 && (
              <Card className="p-6 border-casa-border-light">
                <h2 className="text-base font-bold text-casa-text-primary mb-4">
                  {t('keyFeaturesAmenities')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {property.amenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-casa-canvas border border-casa-border-light text-xs text-casa-text-primary font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Ratings & Reviews Section */}
            <Card className="p-6 border-casa-border-light space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-casa-border-light">
                <div>
                  <h2 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span>Customer Reviews & Ratings</span>
                  </h2>
                  <p className="text-xs text-casa-text-muted mt-0.5">
                    Verified feedback from buyers and visitors for this listing and advertiser.
                  </p>
                </div>
              </div>

              {/* Reviews List */}
              {loadingReviews ? (
                <div className="space-y-3">
                  {[1, 2].map((n) => (
                    <div key={n} className="h-20 bg-casa-canvas rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-6 px-4 bg-casa-canvas/60 rounded-xl border border-dashed border-casa-border-light">
                  <p className="text-xs text-casa-text-muted">No reviews yet for this listing. Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {reviews.map((rev) => (
                    <div
                      key={rev._id}
                      className="p-4 rounded-xl bg-casa-canvas border border-casa-border-light space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-casa-brand/10 text-casa-brand font-bold text-xs flex items-center justify-center">
                            {rev.userId?.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-casa-text-primary">
                              {rev.userId?.name || 'Verified User'}
                            </div>
                            <div className="text-[10px] text-casa-text-muted">
                              {new Date(rev.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= rev.rating
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-zinc-300 dark:text-zinc-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {rev.comment && (
                        <p className="text-xs text-casa-text-secondary leading-relaxed">
                          {rev.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Write Review Form */}
              <div className="pt-4 border-t border-casa-border-light">
                <h3 className="text-xs font-bold uppercase tracking-wider text-casa-text-primary mb-3">
                  Write a Review
                </h3>

                {reviewSubmitted ? (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center space-y-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Review Submitted</p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      Your rating is pending admin verification and will be published shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-casa-text-secondary">Your Rating:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingInput(star)}
                            className="p-1 cursor-pointer focus:outline-hidden"
                          >
                            <Star
                              className={`w-5 h-5 transition-colors ${
                                star <= ratingInput
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-zinc-300 dark:text-zinc-700 hover:text-amber-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <textarea
                        rows={3}
                        required
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience regarding property condition, location accuracy, and agent responsiveness..."
                        className="w-full px-3 py-2 bg-casa-canvas border border-casa-border-light rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-casa-brand"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmittingReview}
                      size="sm"
                      className="bg-casa-brand text-white hover:bg-casa-brand-hover text-xs"
                    >
                      {isSubmittingReview ? 'Submitting...' : 'Post Review'}
                    </Button>
                  </form>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Sticky Advertiser / Inquiry / Site Visit Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Advertiser Card */}
              <Card className="p-6 border-casa-border-light shadow-elevated">
                <span className="text-[10px] font-bold uppercase tracking-wider text-casa-brand block mb-1">
                  {t('advertiserContact')}
                </span>

                <div className="flex items-center gap-3.5 mb-5 pb-5 border-b border-casa-border-light">
                  <div className="w-12 h-12 rounded-2xl bg-casa-brand text-white font-extrabold text-lg flex items-center justify-center shadow-subtle">
                    {property.advertiser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-casa-text-primary text-base leading-tight">
                      {property.advertiser.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      {property.advertiser.isVerifiedAgent ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {t('verifiedAgent')}
                        </span>
                      ) : (
                        <span className="text-xs text-casa-text-muted">
                          {t('directOwner')}
                        </span>
                      )}
                    </div>
                    {property.advertiser.agencyName && (
                      <span className="text-[11px] text-casa-text-muted block mt-0.5">
                        {property.advertiser.agencyName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Locked Contact Banner when Limits / Entitlements apply */}
                {(property as any).contactLocked && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-start space-y-2 mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Direct Contact Locked</span>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
                      {(property as any).contactMessage ||
                        'Sign in or upgrade your subscription package to view verified direct phone and WhatsApp contact.'}
                    </p>
                    <div className="pt-1">
                      <Link
                        href={isAuthenticated ? '/dashboard/billing' : '/login'}
                        className="inline-flex items-center justify-center w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-colors"
                      >
                        {isAuthenticated ? 'Upgrade Package' : 'Sign In to View Contact'}
                      </Link>
                    </div>
                  </div>
                )}

                {/* Primary Action Buttons */}
                <div className="space-y-2.5">
                  {/* Site Visit Booking Button */}
                  <Button
                    onClick={() => setShowSiteVisitModal(true)}
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="bg-casa-brand hover:bg-casa-brand-hover text-white shadow-subtle text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book a Site Visit</span>
                  </Button>

                  {/* Direct Chat with Agent Button */}
                  <Button
                    onClick={handleStartChat}
                    variant="outline"
                    size="md"
                    fullWidth
                    className="text-xs font-semibold flex items-center justify-center gap-2 hover:bg-casa-brand/5 border-casa-brand/40 text-casa-brand"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat with Agent</span>
                  </Button>

                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <Button
                        variant="success"
                        size="md"
                        fullWidth
                        className="shadow-subtle text-xs font-bold"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{t('whatsApp')}</span>
                      </Button>
                    </a>
                  ) : (
                    !(property as any).contactLocked && (
                      <Button variant="outline" size="md" disabled fullWidth>
                        <span>WhatsApp Unavailable</span>
                      </Button>
                    )
                  )}

                  {property.advertiser.phone ? (
                    <a
                      href={`tel:${property.advertiser.phone}`}
                      className="block w-full"
                    >
                      <Button
                        variant="outline"
                        size="md"
                        fullWidth
                        className="text-xs font-semibold"
                      >
                        <Phone className="w-4 h-4 text-casa-brand" />
                        <span>{t('call')}: {property.advertiser.phone}</span>
                      </Button>
                    </a>
                  ) : null}
                </div>

                {/* Direct CASA Lead Enquiry Form */}
                <div className="mt-6 pt-5 border-t border-casa-border-light text-start">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-casa-text-primary mb-3">
                    Send Direct Message
                  </h4>

                  {leadSubmitted ? (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center space-y-1.5">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                      <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Enquiry Submitted!</p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                        The advertiser has received your details and will contact you shortly.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleLeadSubmit} className="space-y-3">
                      <div>
                        <input
                          type="text"
                          required
                          value={leadForm.name}
                          onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                          placeholder="Your Name *"
                          className="w-full px-3 py-2 bg-casa-surface border border-casa-border-light rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-casa-brand"
                        />
                      </div>
                      <div>
                        <input
                          type="tel"
                          required
                          value={leadForm.mobile}
                          onChange={(e) => setLeadForm({ ...leadForm, mobile: e.target.value })}
                          placeholder="Mobile Number *"
                          className="w-full px-3 py-2 bg-casa-surface border border-casa-border-light rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-casa-brand"
                        />
                      </div>
                      <div>
                        <textarea
                          rows={2}
                          value={leadForm.message}
                          onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                          placeholder="Your Message..."
                          className="w-full px-3 py-2 bg-casa-surface border border-casa-border-light rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-casa-brand"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={isSubmittingLead}
                        size="md"
                        fullWidth
                        className="text-xs font-bold shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5 mr-1.5" />
                        <span>{isSubmittingLead ? 'Sending...' : 'Send Enquiry'}</span>
                      </Button>
                    </form>
                  )}
                </div>

                {/* Report Property Action */}
                <div className="mt-4 pt-4 border-t border-casa-border-light flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(true)}
                    className="text-zinc-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Report this listing</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="text-zinc-500 hover:text-casa-brand flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Trust & Safety Notice */}
                <div className="mt-4 pt-4 border-t border-casa-border-light text-start">
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <span className="font-bold block mb-0.5">
                        {t('safetyDisclaimerTitle')}
                      </span>
                      <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                        {t('safetyDisclaimerText')}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Quick Navigation Card */}
              <div className="text-center">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="text-xs text-casa-text-secondary hover:text-casa-brand">
                    ← {t('backToListings')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Properties Section */}
        {similarProperties.length > 0 && (
          <section className="mt-16 pt-12 border-t border-casa-border-light">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-casa-brand block mb-1">
                  {t('similarProperties')}
                </span>
                <h2 className="text-2xl font-bold text-casa-text-primary">
                  More in {localizedCategory}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarProperties.map((simProp) => (
                <PropertyCard key={simProp.id} property={simProp} />
              ))}
            </div>
          </section>
        )}

        {/* --- SITE VISIT BOOKING MODAL --- */}
        {showSiteVisitModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-casa-surface border border-casa-border rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-casa-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-casa-brand/10 text-casa-brand flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-casa-text-primary">Schedule a Site Visit</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSiteVisitModal(false)}
                  className="text-casa-text-muted hover:text-casa-text-primary p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSiteVisitSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-casa-text-primary mb-1">Preferred Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={siteVisitDate}
                    onChange={(e) => setSiteVisitDate(e.target.value)}
                    className="w-full px-3 py-2 bg-casa-canvas border border-casa-border rounded-xl text-xs text-casa-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-casa-text-primary mb-1">Preferred Time Slot *</label>
                  <select
                    value={siteVisitTime}
                    onChange={(e) => setSiteVisitTime(e.target.value)}
                    className="w-full px-3 py-2 bg-casa-canvas border border-casa-border rounded-xl text-xs text-casa-text-primary"
                  >
                    <option value="10:00 AM">Morning (10:00 AM)</option>
                    <option value="11:30 AM">Late Morning (11:30 AM)</option>
                    <option value="02:00 PM">Afternoon (02:00 PM)</option>
                    <option value="04:30 PM">Late Afternoon (04:30 PM)</option>
                    <option value="06:00 PM">Evening (06:00 PM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-casa-text-primary mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={siteVisitMobile}
                    onChange={(e) => setSiteVisitMobile(e.target.value)}
                    placeholder="Mobile number for visit coordinator"
                    className="w-full px-3 py-2 bg-casa-canvas border border-casa-border rounded-xl text-xs text-casa-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-casa-text-primary mb-1">Notes / Instructions</label>
                  <textarea
                    rows={2}
                    value={siteVisitNotes}
                    onChange={(e) => setSiteVisitNotes(e.target.value)}
                    placeholder="Special requests or questions for the agent..."
                    className="w-full px-3 py-2 bg-casa-canvas border border-casa-border rounded-xl text-xs text-casa-text-primary"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSiteVisitModal(false)}
                    className="flex-1 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingSiteVisit}
                    className="flex-1 bg-casa-brand text-white hover:bg-casa-brand-hover text-xs"
                  >
                    {isSubmittingSiteVisit ? 'Booking...' : 'Confirm Request'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- REPORT PROPERTY MODAL --- */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-casa-surface border border-casa-border rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-casa-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <Flag className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-casa-text-primary">Report Property</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="text-casa-text-muted hover:text-casa-text-primary p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-casa-text-primary mb-1">Reason for Report *</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 bg-casa-canvas border border-casa-border rounded-xl text-xs text-casa-text-primary"
                  >
                    <option value="FAKE_PROPERTY">Fake Property / Does not exist</option>
                    <option value="WRONG_PRICE">Incorrect Price / Unrealistic</option>
                    <option value="WRONG_LOCATION">Incorrect Map / Location</option>
                    <option value="DUPLICATE">Duplicate Listing</option>
                    <option value="FRAUD">Suspected Fraud or Scam</option>
                    <option value="INAPPROPRIATE_CONTENT">Inappropriate Content / Photos</option>
                    <option value="PROPERTY_NOT_AVAILABLE">Property Sold / No Longer Available</option>
                    <option value="OTHER">Other Reason</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-casa-text-primary mb-1">Additional Details</label>
                  <textarea
                    rows={3}
                    required
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Provide specifics to help our moderation team verify the issue..."
                    className="w-full px-3 py-2 bg-casa-canvas border border-casa-border rounded-xl text-xs text-casa-text-primary"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs"
                  >
                    {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- SHARE MODAL --- */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-casa-surface border border-casa-border rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-casa-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-casa-brand/10 text-casa-brand flex items-center justify-center">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-casa-text-primary">Share Listing</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="text-casa-text-muted hover:text-casa-text-primary p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 p-2 bg-casa-canvas border border-casa-border rounded-xl">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full bg-transparent text-xs text-casa-text-secondary outline-hidden truncate"
                  />
                  <Button
                    size="sm"
                    onClick={handleCopyLink}
                    className="text-xs bg-casa-brand hover:bg-casa-brand-hover text-white h-7 px-2.5 flex items-center gap-1"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${localizedTitle} on CASA: ${shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-casa-border hover:border-emerald-500 hover:bg-emerald-500/5 flex items-center gap-2 text-xs font-medium text-casa-text-primary transition-all"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-casa-border hover:border-blue-500 hover:bg-blue-500/5 flex items-center gap-2 text-xs font-medium text-casa-text-primary transition-all"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                    <span>Facebook</span>
                  </a>

                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out ${localizedTitle} on CASA`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-casa-border hover:border-sky-500 hover:bg-sky-500/5 flex items-center gap-2 text-xs font-medium text-casa-text-primary transition-all"
                  >
                    <ExternalLink className="w-4 h-4 text-sky-500" />
                    <span>X (Twitter)</span>
                  </a>

                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-casa-border hover:border-blue-700 hover:bg-blue-700/5 flex items-center gap-2 text-xs font-medium text-casa-text-primary transition-all"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-700" />
                    <span>LinkedIn</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
