'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
import { recordRecentlyViewed } from '@/services/purchaser-service';
import { createLead } from '@/services/lead-service';
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
} from 'lucide-react';

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
  const { user, isAuthenticated } = useAuth();
  const { isSaved, toggleSave } = useSavedProperties();
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

  const propertyId = property.id || (property as any)._id;
  const saved = isSaved(propertyId);

  // Auto-record recently viewed on mount
  React.useEffect(() => {
    if (isAuthenticated && propertyId) {
      recordRecentlyViewed(propertyId);
    }
  }, [isAuthenticated, propertyId]);

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

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.info('Listing URL copied to clipboard');
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
              Phase 05 Ready
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
          {/* Left Column: Media Gallery, Overview, Specs, Amenities, Description */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery Card */}
            <Card className="p-0 overflow-hidden border-casa-border-light shadow-subtle">
              {/* Primary Active Image Display */}
              <div className="relative aspect-[16/10] w-full bg-black/5 overflow-hidden">
                <Image
                  src={images[selectedImageIndex] || property.media.thumbnailUrl}
                  alt={`${localizedTitle} - Photo ${selectedImageIndex + 1}`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover transition-all duration-300"
                />

                {/* Badges Overlay */}
                <div className="absolute top-4 start-4 flex flex-wrap gap-2 z-10 pointer-events-none">
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
                  <span className="text-[11px] font-semibold bg-black/60 text-white backdrop-blur-md px-2.5 py-1 rounded-full">
                    {selectedImageIndex + 1} / {images.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleShare}
                    aria-label="Share property link"
                    className="w-8 h-8 rounded-full bg-casa-surface/90 backdrop-blur-md text-casa-text-secondary hover:text-casa-brand flex items-center justify-center transition-colors shadow-subtle cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
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

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="p-3 bg-casa-surface border-t border-casa-border-light flex gap-2.5 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      aria-label={`View photo ${idx + 1}`}
                      className={`relative w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                        selectedImageIndex === idx
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
              )}
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
          </div>

          {/* Right Column: Sticky Advertiser / Inquiry Sidebar */}
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

                {/* Primary Action: Direct WhatsApp Inquiry */}
                <div className="space-y-3">
                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <Button
                        variant="success"
                        size="lg"
                        fullWidth
                        className="shadow-subtle text-sm font-bold"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span>{t('whatsApp')}</span>
                      </Button>
                    </a>
                  ) : (
                    <Button variant="outline" size="lg" disabled fullWidth>
                      <span>WhatsApp Unavailable</span>
                    </Button>
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

                {/* Trust & Safety Notice */}
                <div className="mt-6 pt-4 border-t border-casa-border-light text-start">
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
      </Container>
    </div>
  );
}
