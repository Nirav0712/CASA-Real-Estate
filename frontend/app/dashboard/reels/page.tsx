'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { Card, Container } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { parseYouTubeUrl, parseInstagramUrl, detectVideoSource } from '@/lib/video';
import {
  getMyProperties,
  createProperty,
  updateProperty,
} from '@/services/property-service';
import { Property } from '@/types';
import {
  Video,
  Play,
  PlusCircle,
  Edit,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Search,
  MapPin,
  RefreshCw,
  X,
  Info,
  Phone,
  Bed,
  Bath,
  Square,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Briefcase,
  AlertCircle,
  Eye,
  MessageCircle,
} from 'lucide-react';

export default function BrokerReelsPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const toast = useToast();

  const isConsumer = Boolean(
    user &&
      ['BUYER', 'TENANT', 'PURCHASER'].includes(
        String(user.accountType || user.role).toUpperCase(),
      ),
  );

  const canUploadReel = Boolean(
    isAuthenticated &&
      user &&
      !isConsumer &&
      [
        'AGENT',
        'BROKER',
        'BROKER_AGENCY',
        'BROKER_AGENT',
        'DEVELOPER',
        'PROPERTY_OWNER',
        'SELLER',
        'VERIFIED_AGENT',
        'ADMIN',
        'SUPER_ADMIN',
      ].includes(String(user.accountType || user.role).toUpperCase()),
  );

  const [reels, setReels] = React.useState<Property[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState('ALL');

  // Preview Modal Player State
  const [activeModalIndex, setActiveModalIndex] = React.useState<number | null>(null);
  const [showDrawer, setShowDrawer] = React.useState(false);

  // Add / Upload Reel Modal State
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Edit Reel Modal State
  const [editingReel, setEditingReel] = React.useState<Property | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Add Form State (Add Property Format)
  const [formData, setFormData] = React.useState({
    titleEn: '',
    titleHi: '',
    category: 'House / Home',
    listingType: 'SALE',
    price: '',
    videoUrl: '',
    videoThumbnail: '',
    // Structured Location
    state: 'Uttar Pradesh',
    city: 'Lucknow',
    area: 'Gomti Nagar',
    subArea: 'Gomti Nagar Extension',
    society: '',
    // Specs
    bedrooms: '3',
    bathrooms: '3',
    carpetAreaSqFt: '1850',
    advertiserName: '',
    advertiserPhone: '',
  });

  // Edit Form State
  const [editFormData, setEditFormData] = React.useState({
    titleEn: '',
    titleHi: '',
    category: 'House / Home',
    listingType: 'SALE',
    price: '',
    videoUrl: '',
    videoThumbnail: '',
    state: 'Uttar Pradesh',
    city: 'Lucknow',
    area: 'Gomti Nagar',
    subArea: '',
    society: '',
    bedrooms: '3',
    bathrooms: '3',
    carpetAreaSqFt: '1850',
  });

  // Populate default advertiser name/phone when user loads
  React.useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        advertiserName: prev.advertiserName || user.name || user.agencyName || 'Broker Partner',
        advertiserPhone: prev.advertiserPhone || user.mobile || '+917069754589',
      }));
    }
  }, [user]);

  // Load user's video reels
  const loadReels = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      let myProps: Property[] = [];
      try {
        myProps = await getMyProperties();
      } catch (_) {}

      // Filter properties that have a video or reel format
      const myVideoProps = (myProps || []).filter(
        (p) => Boolean((p.media?.videoUrl || (p as any).videoUrl || p.media?.isReelFormat || '').trim()),
      );

      setReels(myVideoProps);
    } catch (err: unknown) {
      toast.error('Sync Notice', 'Failed to load video reels.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, toast]);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadReels();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading, loadReels]);

  // Filtered Reels
  const filteredReels = React.useMemo(() => {
    return reels.filter((r) => {
      if (filterType !== 'ALL' && r.listingType !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleEn = (typeof r.title === 'string' ? r.title : r.title?.en || '').toLowerCase();
        const city = (r.location?.city || '').toLowerCase();
        const society = (r.location?.society || '').toLowerCase();
        const area = (r.location?.area || '').toLowerCase();
        if (!titleEn.includes(q) && !city.includes(q) && !society.includes(q) && !area.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [reels, filterType, searchQuery]);

  const activeReel =
    activeModalIndex !== null && filteredReels[activeModalIndex]
      ? filteredReels[activeModalIndex]
      : null;

  // Next / Prev Navigation in Reel Modal
  const handleNextReel = React.useCallback(() => {
    if (filteredReels.length === 0) return;
    setActiveModalIndex((prev) => ((prev ?? 0) + 1) % filteredReels.length);
    setShowDrawer(false);
  }, [filteredReels.length]);

  const handlePrevReel = React.useCallback(() => {
    if (filteredReels.length === 0) return;
    setActiveModalIndex((prev) => ((prev ?? 0) - 1 + filteredReels.length) % filteredReels.length);
    setShowDrawer(false);
  }, [filteredReels.length]);

  // Keyboard navigation
  React.useEffect(() => {
    if (activeModalIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextReel();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevReel();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setActiveModalIndex(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeModalIndex, handleNextReel, handlePrevReel]);

  // 1. Upload / Add Reel Submit
  const handleUploadReel = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titleEn.trim()) {
      toast.warning('Title Required', 'Please enter a property title.');
      return;
    }
    if (!formData.price || isNaN(Number(formData.price))) {
      toast.warning('Price Required', 'Please enter a valid property price.');
      return;
    }
    if (!formData.videoUrl.trim()) {
      toast.warning('Video URL Required', 'Please enter a 9:16 Video or YouTube Shorts URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedYt = parseYouTubeUrl(formData.videoUrl.trim());
      const thumb =
        formData.videoThumbnail.trim() ||
        parsedYt.thumbnailUrl ||
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

      const payload = {
        title: {
          en: formData.titleEn.trim(),
          hi: formData.titleHi.trim() || formData.titleEn.trim(),
        },
        category: formData.category,
        listingType: formData.listingType,
        price: {
          amount: Number(formData.price),
          currency: 'INR',
          priceUnit: formData.listingType === 'SALE' ? 'TOTAL' : 'PER_MONTH',
        },
        location: {
          state: formData.state,
          city: formData.city,
          area: formData.area,
          subArea: formData.subArea,
          society: formData.society,
          locality: formData.area,
        },
        specs: {
          bedrooms: Number(formData.bedrooms) || 3,
          bathrooms: Number(formData.bathrooms) || 3,
          carpetAreaSqFt: Number(formData.carpetAreaSqFt) || 1800,
        },
        media: {
          thumbnailUrl: thumb,
          coverImage: thumb,
          images: [thumb],
          videos: [formData.videoUrl.trim()],
          videoUrl: formData.videoUrl.trim(),
          videoThumbnail: thumb,
          isReelFormat: true,
          primaryMediaType: 'VIDEO',
        },
        videoUrl: formData.videoUrl.trim(),
        advertiser: {
          name: formData.advertiserName || user?.name || 'Broker Partner',
          phone: formData.advertiserPhone || user?.mobile || '+917069754589',
          isVerifiedAgent: user?.isVerifiedAgent || false,
          role: user?.role || 'BROKER',
        },
        status: 'PUBLISHED',
      };

      // Create via backend API
      let createdProp: Property | null = null;
      try {
        createdProp = await createProperty(payload);
      } catch (_) {}

      const newId = createdProp?.id || `broker-reel-${Date.now()}`;
      const newReel: Property = {
        id: newId,
        slug:
          createdProp?.slug ||
          formData.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        ...(payload as any),
      };

      // Persist to local storage custom reels so homepage 9:16 section renders it immediately
      let customList: Property[] = [];
      try {
        const stored = localStorage.getItem('casa_custom_reels');
        if (stored) customList = JSON.parse(stored);
      } catch (_) {}
      customList.unshift(newReel);
      localStorage.setItem('casa_custom_reels', JSON.stringify(customList));

      setReels((prev) => [newReel, ...prev]);

      toast.success(
        'Reel Uploaded',
        `"${formData.titleEn}" published to 9:16 Video Property Reels!`,
      );

      setIsAddModalOpen(false);
      setFormData({
        titleEn: '',
        titleHi: '',
        category: 'House / Home',
        listingType: 'SALE',
        price: '',
        videoUrl: '',
        videoThumbnail: '',
        state: 'Uttar Pradesh',
        city: 'Lucknow',
        area: 'Gomti Nagar',
        subArea: 'Gomti Nagar Extension',
        society: '',
        bedrooms: '3',
        bathrooms: '3',
        carpetAreaSqFt: '1850',
        advertiserName: user?.name || 'Broker Partner',
        advertiserPhone: user?.mobile || '+917069754589',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error('Upload Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Open Edit Reel Modal
  const handleOpenEdit = (reel: Property) => {
    setEditingReel(reel);
    setEditFormData({
      titleEn: typeof reel.title === 'string' ? reel.title : reel.title?.en || '',
      titleHi: typeof reel.title === 'string' ? '' : reel.title?.hi || '',
      category: reel.category || 'House / Home',
      listingType: reel.listingType || 'SALE',
      price: String(reel.price?.amount || ''),
      videoUrl: reel.media?.videoUrl || (reel as any).videoUrl || '',
      videoThumbnail: reel.media?.thumbnailUrl || '',
      state: reel.location?.state || 'Uttar Pradesh',
      city: reel.location?.city || 'Lucknow',
      area: reel.location?.area || reel.location?.locality || '',
      subArea: reel.location?.subArea || '',
      society: reel.location?.society || '',
      bedrooms: String(reel.specs?.bedrooms || '3'),
      bathrooms: String(reel.specs?.bathrooms || '3'),
      carpetAreaSqFt: String(reel.specs?.carpetAreaSqFt || reel.specs?.area || '1800'),
    });
  };

  // 3. Edit Reel Submit
  const handleUpdateReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReel) return;

    if (!editFormData.titleEn.trim()) {
      toast.warning('Title Required', 'Please enter a property title.');
      return;
    }
    if (!editFormData.videoUrl.trim()) {
      toast.warning('Video URL Required', 'Please enter a video URL.');
      return;
    }

    setIsUpdating(true);
    try {
      const parsedYt = parseYouTubeUrl(editFormData.videoUrl.trim());
      const thumb =
        editFormData.videoThumbnail.trim() ||
        parsedYt.thumbnailUrl ||
        editingReel.media?.thumbnailUrl ||
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

      const updatePayload = {
        title: {
          en: editFormData.titleEn.trim(),
          hi: editFormData.titleHi.trim() || editFormData.titleEn.trim(),
        },
        category: editFormData.category,
        listingType: editFormData.listingType,
        price: {
          amount: Number(editFormData.price),
          currency: 'INR',
          priceUnit: editFormData.listingType === 'SALE' ? 'TOTAL' : 'PER_MONTH',
        },
        location: {
          state: editFormData.state,
          city: editFormData.city,
          area: editFormData.area,
          subArea: editFormData.subArea,
          society: editFormData.society,
          locality: editFormData.area,
        },
        specs: {
          bedrooms: Number(editFormData.bedrooms) || 3,
          bathrooms: Number(editFormData.bathrooms) || 3,
          carpetAreaSqFt: Number(editFormData.carpetAreaSqFt) || 1800,
        },
        media: {
          ...(editingReel.media || {}),
          thumbnailUrl: thumb,
          videoUrl: editFormData.videoUrl.trim(),
          videoThumbnail: thumb,
          isReelFormat: true,
          primaryMediaType: 'VIDEO',
        },
        videoUrl: editFormData.videoUrl.trim(),
      };

      // Call backend update
      try {
        await updateProperty(editingReel.id, updatePayload);
      } catch (_) {}

      // Update in local state
      setReels((prev) =>
        prev.map((r) =>
          r.id === editingReel.id
            ? ({
                ...r,
                ...updatePayload,
              } as Property)
            : r,
        ),
      );

      // Update in local storage
      try {
        const stored = localStorage.getItem('casa_custom_reels');
        if (stored) {
          const list: Property[] = JSON.parse(stored);
          const updated = list.map((item) =>
            item.id === editingReel.id
              ? ({ ...item, ...updatePayload } as Property)
              : item,
          );
          localStorage.setItem('casa_custom_reels', JSON.stringify(updated));
        }
      } catch (_) {}

      toast.success(
        'Reel Updated',
        `"${editFormData.titleEn}" updated successfully!`,
      );
      setEditingReel(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      toast.error('Update Error', msg);
    } finally {
      setIsUpdating(false);
    }
  };


  if (!isAuthenticated && !isAuthLoading) {
    return (
      <Container className="py-16 text-center space-y-4">
        <Video className="w-12 h-12 text-casa-brand mx-auto" />
        <h2 className="text-xl font-bold text-casa-text-primary">
          Broker Video Reels Console
        </h2>
        <p className="text-xs text-casa-text-secondary max-w-sm mx-auto">
          Please sign in to upload, edit, and manage your 9:16 vertical property reels.
        </p>
        <Button variant="primary" onClick={openAuthModal}>
          Sign In to Access
        </Button>
      </Container>
    );
  }

  if (isConsumer) {
    return (
      <Container className="py-16 text-center space-y-4 max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-casa-text-primary">
          Access Restricted: Reels Upload
        </h2>
        <p className="text-xs text-casa-text-secondary max-w-md mx-auto">
          Property Buyers and Rental Tenants are not permitted to upload or post video reels. 9:16 Video Property Walkthroughs are reserved for verified property advertisers (Brokers, Agents, Developers, and Property Owners).
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/properties">
            <Button variant="primary" size="sm">
              Explore Property Listings
            </Button>
          </Link>
          <Link href="/dashboard/purchaser">
            <Button variant="outline" size="sm">
              Go to Buyer Dashboard
            </Button>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-casa-canvas py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 text-start">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-900 text-white p-6 md:p-8 rounded-3xl shadow-elevated relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-semibold backdrop-blur-sm border border-red-500/30">
              <Video className="w-3.5 h-3.5" />
              <span>Broker Video Walkthrough Reels Studio</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              My 9:16 Video Property Reels
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              Upload vertical YouTube Shorts and walkthrough reels for your mandated properties. Edit details, manage prices, and control what buyers see on the homepage video reels showcase.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={loadReels}
              disabled={isLoading}
              className="text-xs text-white border-white/30 hover:bg-white/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {canUploadReel && (
              <Link href="/dashboard/properties/new">
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs bg-casa-brand hover:bg-casa-brand-hover text-white shadow-lg"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  Post Property with Video
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle space-y-1">
          <div className="text-[11px] font-semibold text-casa-text-muted">Total Reels Uploaded</div>
          <div className="text-2xl font-black text-casa-text-primary">{reels.length}</div>
          <div className="text-[10px] text-emerald-600 font-medium">9:16 Vertical Format</div>
        </Card>

        <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle space-y-1">
          <div className="text-[11px] font-semibold text-casa-text-muted">Active on Homepage</div>
          <div className="text-2xl font-black text-casa-brand">{reels.length}</div>
          <div className="text-[10px] text-casa-text-muted">Instant buyer discoverability</div>
        </Card>

        <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle space-y-1">
          <div className="text-[11px] font-semibold text-casa-text-muted">Buy Properties</div>
          <div className="text-2xl font-black text-purple-600">
            {reels.filter((r) => r.listingType === 'SALE').length}
          </div>
          <div className="text-[10px] text-casa-text-muted">For Sale Walkthroughs</div>
        </Card>

        <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle space-y-1">
          <div className="text-[11px] font-semibold text-casa-text-muted">Rentals / Leases</div>
          <div className="text-2xl font-black text-amber-500">
            {reels.filter((r) => r.listingType !== 'SALE').length}
          </div>
          <div className="text-[10px] text-casa-text-muted">Monthly Rental Reels</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3 bg-casa-surface border border-casa-border-light shadow-subtle flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-casa-text-muted" />
          <input
            type="text"
            placeholder="Search reels by title, society, city, area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
          />
        </div>

        <div className="min-w-[140px]">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
          >
            <option value="ALL">All Listing Types</option>
            <option value="SALE">For Sale (Buy)</option>
            <option value="RENT">For Rent / Lease</option>
          </select>
        </div>

        <Link href="/dashboard/properties">
          <Button variant="outline" size="sm" className="text-xs">
            Switch to All Properties
          </Button>
        </Link>
      </Card>

      {/* Reels Grid: 9:16 Cards */}
      {filteredReels.length === 0 ? (
        <Card className="p-12 text-center bg-casa-surface border border-casa-border-light space-y-3">
          <Video className="w-12 h-12 text-casa-text-muted mx-auto" />
          <h3 className="text-sm font-bold text-casa-text-primary">
            No 9:16 Video Reels Yet
          </h3>
          <p className="text-xs text-casa-text-secondary max-w-md mx-auto">
            Videos and walkthrough reels are uploaded directly when creating your property listing via Post Property.
          </p>
          {canUploadReel && (
            <Link href="/dashboard/properties/new">
              <Button
                variant="primary"
                size="sm"
                className="text-xs bg-casa-brand hover:bg-casa-brand-hover text-white"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Post Property with Video Tour
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredReels.map((reel, index) => {
            const video = reel.media?.videoUrl || (reel as any).videoUrl || '';
            const parsed = parseYouTubeUrl(video);
            const thumb =
              reel.media?.thumbnailUrl ||
              parsed.thumbnailUrl ||
              'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
            const priceText = formatPrice(reel.price?.amount || 0);

            return (
              <div
                key={reel.id}
                className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md hover:shadow-2xl hover:border-red-500/60 transition-all flex flex-col justify-between aspect-[9/16]"
              >
                {/* Thumbnail Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumb}
                  alt={typeof reel.title === 'string' ? reel.title : reel.title?.en}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  loading="lazy"
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/60 pointer-events-none" />

                {/* Top Action Bar */}
                <div className="relative z-10 p-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span>{reel.listingType === 'SALE' ? 'BUY' : 'RENT'}</span>
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(reel)}
                      className="w-7 h-7 rounded-full bg-black/60 hover:bg-casa-brand text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20"
                      title="Edit Video Reel Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Center Play Button */}
                <div className="relative z-10 my-auto flex flex-col items-center justify-center p-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModalIndex(index);
                      setShowDrawer(false);
                    }}
                    className="w-12 h-12 rounded-full bg-white/90 hover:bg-white text-red-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all cursor-pointer backdrop-blur-sm"
                    title="Watch Walkthrough Reel"
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </button>
                  <span className="mt-1.5 text-[9px] font-bold text-white/90 uppercase drop-shadow">
                    Watch Reel
                  </span>
                </div>

                {/* Bottom Card Details */}
                <div className="relative z-10 p-3 space-y-1.5 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-black text-white">{priceText}</div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-casa-brand text-white">
                      {reel.category}
                    </span>
                  </div>

                  <h4 className="text-[11px] font-bold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                    {typeof reel.title === 'string' ? reel.title : reel.title?.en}
                  </h4>

                  <div className="flex items-center gap-1 text-[10px] text-white/80 truncate">
                    <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
                    <span className="truncate">
                      {reel.location?.society || reel.location?.area || reel.location?.city}
                    </span>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-1.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModalIndex(index);
                        setShowDrawer(false);
                      }}
                      className="flex-1 py-1 px-2 rounded-lg bg-white/20 hover:bg-white text-white hover:text-black text-[10px] font-semibold text-center transition-all flex items-center justify-center gap-1"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(reel)}
                      className="py-1 px-2 rounded-lg bg-white/20 hover:bg-white text-white hover:text-black text-[10px] font-semibold transition-all flex items-center gap-1"
                      title="Edit Details"
                    >
                      <Edit className="w-2.5 h-2.5" />
                      <span>Edit</span>
                    </button>

                    <Link
                      href={`/property/${reel.slug || reel.id}`}
                      className="p-1 rounded-lg bg-casa-brand hover:bg-casa-brand-hover text-white text-[10px] transition-colors"
                      title="View Full Listing Page"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 9:16 Video Player Preview Modal with Next/Previous Navigation */}
      {activeReel && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
          {/* Left Arrow */}
          <button
            type="button"
            onClick={handlePrevReel}
            className="fixed left-3 sm:left-6 md:left-12 lg:left-24 top-1/2 -translate-y-1/2 z-50 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/30 active:scale-95 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-2xl hover:scale-110 cursor-pointer"
            title="Previous Reel (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          {/* Right Arrow */}
          <button
            type="button"
            onClick={handleNextReel}
            className="fixed right-3 sm:right-6 md:right-12 lg:right-24 top-1/2 -translate-y-1/2 z-50 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/30 active:scale-95 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-2xl hover:scale-110 cursor-pointer"
            title="Next Reel (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          {/* 9:16 Frame */}
          <div className="relative w-full max-w-sm sm:max-w-md bg-slate-950 rounded-3xl overflow-hidden border border-white/20 shadow-2xl flex flex-col aspect-[9/16] max-h-[90vh]">
            {/* Header */}
            <div className="absolute top-0 inset-x-0 z-30 p-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span>Reel {(activeModalIndex ?? 0) + 1} / {filteredReels.length}</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-casa-brand text-white shadow-xs">
                  {activeReel.listingType === 'SALE' ? 'BUY' : 'RENT'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalIndex(null)}
                className="w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer border border-white/20"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player Box */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
              {(() => {
                const rawUrl = (
                  activeReel.media?.videoUrl ||
                  (activeReel as any).videoUrl ||
                  (activeReel.media?.videos && activeReel.media.videos[0]) ||
                  ''
                ).trim();

                const sourceType = detectVideoSource(rawUrl);

                if (sourceType === 'YOUTUBE') {
                  const ytParsed = parseYouTubeUrl(rawUrl);
                  const embed =
                    ytParsed.embedUrl ||
                    (ytParsed.videoId
                      ? `https://www.youtube.com/embed/${ytParsed.videoId}?autoplay=1&mute=0&playsinline=1&rel=0&modestbranding=1`
                      : rawUrl);
                  return (
                    <iframe
                      key={`${activeReel.id}-${embed}`}
                      src={embed}
                      title="Video Reel Preview"
                      className="w-full h-full object-cover border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  );
                }

                if (sourceType === 'INSTAGRAM') {
                  const igParsed = parseInstagramUrl(rawUrl);
                  if (igParsed.isValid && igParsed.embedUrl) {
                    return (
                      <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
                        <iframe
                          key={`${activeReel.id}-${igParsed.embedUrl}`}
                          src={igParsed.embedUrl}
                          title="Instagram Reel Preview"
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

                  return (
                    <div className="flex flex-col items-center justify-center text-center p-6 text-white space-y-3">
                      <Video className="w-12 h-12 text-pink-500 opacity-80" />
                      <p className="text-sm font-semibold">Instagram Video Notice</p>
                      <p className="text-xs text-white/70 max-w-xs">
                        This Instagram reel requires viewing directly on Instagram.
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

                if (rawUrl) {
                  return (
                    <video
                      key={`${activeReel.id}-${rawUrl}`}
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
                    <p className="text-xs text-white/60">No video link was provided for this reel.</p>
                  </div>
                );
              })()}
            </div>

            {/* Details Drawer */}
            {showDrawer ? (
              <div className="absolute inset-x-0 bottom-0 top-14 z-30 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 p-4 overflow-y-auto space-y-3 flex flex-col justify-between animate-in slide-in-from-bottom-6 duration-200">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-casa-brand">
                      <Info className="w-3.5 h-3.5" />
                      <span>Property Walkthrough Specs</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDrawer(false)}
                      className="text-xs text-white/70 hover:text-white px-2 py-0.5 rounded-lg bg-white/10"
                    >
                      Hide Details
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-white">
                      {formatPrice(activeReel.price?.amount || 0)}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-casa-brand text-white">
                      {activeReel.category}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white">
                    {typeof activeReel.title === 'string' ? activeReel.title : activeReel.title?.en}
                  </h3>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center gap-1 text-red-400 font-semibold">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{activeReel.location?.society || activeReel.location?.area}</span>
                    </div>
                    <p className="text-[11px] text-white/70 pl-4">
                      {[
                        activeReel.location?.subArea,
                        activeReel.location?.area,
                        activeReel.location?.city,
                        activeReel.location?.state,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="font-bold text-white">{activeReel.specs?.bedrooms || '—'} BHK</div>
                      <div className="text-[10px] text-white/60">Bedrooms</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="font-bold text-white">{activeReel.specs?.bathrooms || '—'} Baths</div>
                      <div className="text-[10px] text-white/60">Bathrooms</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="font-bold text-white">
                        {activeReel.specs?.carpetAreaSqFt || activeReel.specs?.area || '—'}
                      </div>
                      <div className="text-[10px] text-white/60">Sq. Ft.</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/property/${activeReel.slug || activeReel.id}`}
                    onClick={() => setActiveModalIndex(null)}
                    className="w-full py-2.5 px-4 rounded-xl bg-casa-brand hover:bg-casa-brand-hover text-white text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Open Full Property Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-900 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-white">
                    {formatPrice(activeReel.price?.amount || 0)}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-casa-brand text-white">
                    {activeReel.category}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white line-clamp-1">
                  {typeof activeReel.title === 'string' ? activeReel.title : activeReel.title?.en}
                </h3>
                <div className="flex items-center justify-between pt-1 gap-2">
                  <span className="text-[11px] text-white/70 flex items-center gap-1 truncate max-w-[150px]">
                    <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
                    <span className="truncate">
                      {activeReel.location?.society || activeReel.location?.city}
                    </span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowDrawer(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white text-white hover:text-black text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Info className="w-3 h-3" />
                      <span>View Details</span>
                    </button>
                    <Link
                      href={`/property/${activeReel.slug || activeReel.id}`}
                      onClick={() => setActiveModalIndex(null)}
                      className="px-2.5 py-1.5 rounded-xl bg-casa-brand text-white text-[11px] font-semibold hover:bg-casa-brand-hover transition-colors inline-flex items-center gap-1"
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

      {/* Edit Reel Modal */}
      {editingReel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-2xl w-full p-6 bg-casa-surface border border-casa-border-light shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-casa-border-light pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-casa-brand/10 text-casa-brand rounded-xl">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-casa-text-primary">
                    Edit Video Property Reel
                  </h2>
                  <p className="text-xs text-casa-text-secondary">
                    Update video URL, pricing, location, or specifications for this listing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingReel(null)}
                className="text-casa-text-muted hover:text-casa-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateReel} className="space-y-4">
              {/* Basic Info */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Property Title (English) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.titleEn}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, titleEn: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Price (INR) *
                    </label>
                    <input
                      type="number"
                      required
                      value={editFormData.price}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, price: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Category
                    </label>
                    <select
                      value={editFormData.category}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, category: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    >
                      <option value="House / Home">House / Home</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Villa">Villa</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Studio">Studio</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Listing Type
                    </label>
                    <select
                      value={editFormData.listingType}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, listingType: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    >
                      <option value="SALE">For Sale (Buy)</option>
                      <option value="RENT">For Rent / Lease</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 9:16 Video URL */}
              <div className="space-y-3 pt-2 border-t border-casa-border-light">
                <div className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" />
                  <span>9:16 Video / Reel URL</span>
                </div>
                <div>
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/shorts/... or direct MP4 URL"
                    value={editFormData.videoUrl}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, videoUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-3 pt-2 border-t border-casa-border-light">
                <div className="text-xs font-bold text-casa-brand uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Location</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.city}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, city: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Area / Locality *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.area}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, area: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Society / Project Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.society}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, society: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>
                </div>
              </div>

              {/* Specs */}
              <div className="space-y-3 pt-2 border-t border-casa-border-light">
                <div className="text-xs font-bold text-casa-brand uppercase tracking-wider">
                  Specifications
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      value={editFormData.bedrooms}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, bedrooms: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      value={editFormData.bathrooms}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, bathrooms: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Carpet Area (Sq. Ft.)
                    </label>
                    <input
                      type="number"
                      value={editFormData.carpetAreaSqFt}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, carpetAreaSqFt: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-casa-border-light">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingReel(null)}
                  disabled={isUpdating}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isUpdating}
                  className="text-xs"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Upload New Reel Modal (Add Property Format) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-2xl w-full p-6 bg-casa-surface border border-casa-border-light shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-casa-border-light pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-600/10 text-red-600 rounded-xl">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-casa-text-primary">
                    Upload New 9:16 Video Property Reel
                  </h2>
                  <p className="text-xs text-casa-text-secondary">
                    Fill out property walkthrough details as per the standard Add Property format.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-casa-text-muted hover:text-casa-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadReel} className="space-y-4">
              {/* Section 1: Property Details */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-casa-brand uppercase tracking-wider">
                  1. Property Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Property Title (English) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 3 BHK Luxury Penthouse with Sky View"
                      value={formData.titleEn}
                      onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Title (Hindi - Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 3 बीएचके लक्जरी पेंटहाउस"
                      value={formData.titleHi}
                      onChange={(e) => setFormData({ ...formData, titleHi: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    >
                      <option value="House / Home">House / Home</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Villa">Villa</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Studio">Studio</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Listing Type
                    </label>
                    <select
                      value={formData.listingType}
                      onChange={(e) => setFormData({ ...formData, listingType: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    >
                      <option value="SALE">For Sale (Buy)</option>
                      <option value="RENT">For Rent / Lease</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Price (INR) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 14500000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: 9:16 Video Reel */}
              <div className="space-y-3 pt-2 border-t border-casa-border-light">
                <div className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" />
                  <span>2. 9:16 Video / Reel Media</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                    YouTube Shorts or Video URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/shorts/... or direct MP4 URL"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                  />
                  <span className="text-[10px] text-casa-text-muted mt-1 block">
                    Paste any YouTube Shorts URL, YouTube video link, or direct MP4 walkthrough.
                  </span>
                </div>
              </div>

              {/* Section 3: Structured Location Selection */}
              <div className="space-y-3 pt-2 border-t border-casa-border-light">
                <div className="text-xs font-bold text-casa-brand uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>3. Structured Location (Add Property Format)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gujarat, Uttar Pradesh, Maharashtra"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ahmedabad, Lucknow, Mumbai"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Area *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Satellite, Gomti Nagar"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Sub-Area
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jodhpur Cross Road"
                      value={formData.subArea}
                      onChange={(e) => setFormData({ ...formData, subArea: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Society / Project Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Goyal Riviera, Omaxe Heights"
                      value={formData.society}
                      onChange={(e) => setFormData({ ...formData, society: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Specifications */}
              <div className="space-y-3 pt-2 border-t border-casa-border-light">
                <div className="text-xs font-bold text-casa-brand uppercase tracking-wider">
                  4. Property Specifications
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      placeholder="3"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      placeholder="3"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Carpet Area (Sq. Ft.)
                    </label>
                    <input
                      type="number"
                      placeholder="1850"
                      value={formData.carpetAreaSqFt}
                      onChange={(e) =>
                        setFormData({ ...formData, carpetAreaSqFt: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Broker Contact Details */}
              <div className="space-y-3 pt-2 border-t border-casa-border-light">
                <div className="text-xs font-bold text-casa-brand uppercase tracking-wider">
                  5. Contact & WhatsApp Routing
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Broker / Agent Name
                    </label>
                    <input
                      type="text"
                      placeholder="Apex Gujarat Realty"
                      value={formData.advertiserName}
                      onChange={(e) =>
                        setFormData({ ...formData, advertiserName: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Contact Mobile / WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="+919876543210"
                      value={formData.advertiserPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, advertiserPhone: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-casa-border-light">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Publishing Reel...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                      Publish 9:16 Video Reel
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
