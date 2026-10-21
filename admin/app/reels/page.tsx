'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast-context';
import { fetchAdminApi } from '@/lib/api-client';
import { parseYouTubeUrl } from '@/lib/video';
import { formatPrice } from '@/lib/utils';
import { AdminPropertyItem } from '@/types';
import {
  Video,
  Play,
  PlusCircle,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MapPin,
  Building,
  RefreshCw,
  X,
  CheckCircle2,
  Info,
  Phone,
  Bed,
  Bath,
  Square,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

// Default initial dataset matching the frontend fallbacks so super admin can manage them immediately
const INITIAL_REELS: any[] = [
  {
    id: 'vid-reel-01',
    slug: '4-bhk-luxury-villa-gomti-nagar-ext',
    title: {
      en: '4 BHK Luxury Independent Villa with Private Garden',
      hi: 'गोमती नगर में 4 बीएचके लक्जरी विला',
    },
    category: 'House / Home',
    listingType: 'SALE',
    price: { amount: 18500000, currency: 'INR', priceUnit: 'TOTAL' },
    location: {
      state: 'Uttar Pradesh',
      city: 'Lucknow',
      area: 'Gomti Nagar',
      subArea: 'Gomti Nagar Extension',
      society: 'Omaxe Residency',
      locality: 'Gomti Nagar Extension',
    },
    specs: { bedrooms: 4, bathrooms: 4, carpetAreaSqFt: 3200 },
    media: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      videoUrl: 'https://www.youtube.com/shorts/aqz-KE-bpKQ',
      isReelFormat: true,
    },
    advertiser: {
      name: 'Verma Luxury Estates',
      phone: '+919925843589',
      isVerifiedAgent: true,
      role: 'VERIFIED_AGENT',
    },
    status: 'PUBLISHED',
    isPublished: true,
  },
  {
    id: 'vid-reel-02',
    slug: '3-bhk-high-rise-penthouse-satellite-ahmedabad',
    title: {
      en: '3 BHK High-Rise Penthouse with Sky Deck',
      hi: 'अहमदाबाद में 3 बीएचके स्काई पेंटहाउस',
    },
    category: 'Apartment',
    listingType: 'SALE',
    price: { amount: 14500000, currency: 'INR', priceUnit: 'TOTAL' },
    location: {
      state: 'Gujarat',
      city: 'Ahmedabad',
      area: 'Satellite',
      subArea: 'Jodhpur Cross Road',
      society: 'Goyal Riviera',
      locality: 'Satellite',
    },
    specs: { bedrooms: 3, bathrooms: 3, carpetAreaSqFt: 2450 },
    media: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
      videoUrl: 'https://www.youtube.com/shorts/aqz-KE-bpKQ',
      isReelFormat: true,
    },
    advertiser: {
      name: 'Apex Gujarat Realty',
      phone: '+919876543210',
      isVerifiedAgent: true,
      role: 'VERIFIED_AGENT',
    },
    status: 'PUBLISHED',
    isPublished: true,
  },
  {
    id: 'vid-reel-03',
    slug: 'sea-facing-luxury-condo-bandra-west',
    title: {
      en: 'Sea-Facing 2 BHK Designer Condo in Bandra',
      hi: 'बांद्रा वेस्ट में सी-फेसिंग 2 बीएचके कॉन्डो',
    },
    category: 'Apartment',
    listingType: 'RENT',
    price: { amount: 125000, currency: 'INR', priceUnit: 'PER_MONTH' },
    location: {
      state: 'Maharashtra',
      city: 'Mumbai',
      area: 'Bandra West',
      subArea: 'Carter Road',
      society: 'Sea Spray Apartments',
      locality: 'Bandra West',
    },
    specs: { bedrooms: 2, bathrooms: 2, carpetAreaSqFt: 1350 },
    media: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      videoUrl: 'https://www.youtube.com/shorts/aqz-KE-bpKQ',
      isReelFormat: true,
    },
    advertiser: {
      name: 'Mumbai Prime Realty',
      phone: '+919925843531',
      isVerifiedAgent: true,
      role: 'VERIFIED_AGENT',
    },
    status: 'PUBLISHED',
    isPublished: true,
  },
  {
    id: 'vid-reel-04',
    slug: 'smart-villa-whitefield-bengaluru',
    title: {
      en: 'Ultra-Modern Smart Villa in Gated Community',
      hi: 'व्हाइटफील्ड में अल्ट्रा-मॉडर्न स्मार्ट विला',
    },
    category: 'Villa',
    listingType: 'SALE',
    price: { amount: 26000000, currency: 'INR', priceUnit: 'TOTAL' },
    location: {
      state: 'Karnataka',
      city: 'Bengaluru',
      area: 'Whitefield',
      subArea: 'ITPL Main Road',
      society: 'Prestige Shantiniketan',
      locality: 'Whitefield',
    },
    specs: { bedrooms: 4, bathrooms: 5, carpetAreaSqFt: 3600 },
    media: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
      videoUrl: 'https://www.youtube.com/shorts/aqz-KE-bpKQ',
      isReelFormat: true,
    },
    advertiser: {
      name: 'Bengaluru Premier Spaces',
      phone: '+919876543210',
      isVerifiedAgent: true,
      role: 'VERIFIED_AGENT',
    },
    status: 'PUBLISHED',
    isPublished: true,
  },
  {
    id: 'vid-reel-05',
    slug: 'modern-commercial-showroom-hazratganj',
    title: {
      en: 'Prime Road-Front Commercial Retail Showroom',
      hi: 'हज़रतगंज में मुख्य मार्ग पर शोरूम',
    },
    category: 'Commercial',
    listingType: 'RENT',
    price: { amount: 95000, currency: 'INR', priceUnit: 'PER_MONTH' },
    location: {
      state: 'Uttar Pradesh',
      city: 'Lucknow',
      area: 'Hazratganj',
      subArea: 'Main Market Square',
      society: 'Hazratganj Royale',
      locality: 'Hazratganj',
    },
    specs: { carpetAreaSqFt: 1800 },
    media: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      videoUrl: 'https://www.youtube.com/shorts/aqz-KE-bpKQ',
      isReelFormat: true,
    },
    advertiser: {
      name: 'Verma Luxury Estates',
      phone: '+919925843589',
      isVerifiedAgent: true,
      role: 'VERIFIED_AGENT',
    },
    status: 'PUBLISHED',
    isPublished: true,
  },
  {
    id: 'vid-reel-06',
    slug: 'spacious-golf-view-apartment-sushant-golf-city',
    title: {
      en: 'Spacious 3 BHK Golf Course Facing Apartment',
      hi: 'सुशांत गोल्फ सिटी में 3 बीएचके फ्लैट',
    },
    category: 'Apartment',
    listingType: 'SALE',
    price: { amount: 8800000, currency: 'INR', priceUnit: 'TOTAL' },
    location: {
      state: 'Uttar Pradesh',
      city: 'Lucknow',
      area: 'Sushant Golf City',
      subArea: 'Amar Shaheed Path',
      society: 'Celebrity Gardens',
      locality: 'Sushant Golf City',
    },
    specs: { bedrooms: 3, bathrooms: 3, carpetAreaSqFt: 1950 },
    media: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      videoUrl: 'https://www.youtube.com/shorts/aqz-KE-bpKQ',
      isReelFormat: true,
    },
    advertiser: {
      name: 'Awadh Realtors',
      phone: '+919925843599',
      isVerifiedAgent: true,
      role: 'VERIFIED_AGENT',
    },
    status: 'PUBLISHED',
    isPublished: true,
  },
];

const PUBLIC_FRONTEND_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://casa-real-estate-mocha.vercel.app';

export default function VideoReelsAdminPage() {
  const toast = useToast();

  const [reels, setReels] = React.useState<any[]>(INITIAL_REELS);
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState('ALL');
  const [filterCategory, setFilterCategory] = React.useState('ALL');

  // Preview Modal Player State
  const [activeModalIndex, setActiveModalIndex] = React.useState<number | null>(null);
  const [showDrawer, setShowDrawer] = React.useState(false);

  // Add New Reel Modal State (Add Property Format)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Delete Confirmation State
  const [deletingReel, setDeletingReel] = React.useState<any | null>(null);

  // Form Data conforming strictly to "Add Property" format
  const [formData, setFormData] = React.useState({
    titleEn: '',
    titleHi: '',
    category: 'House / Home',
    listingType: 'SALE',
    price: '',
    priceUnit: 'TOTAL',
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
    // Advertiser
    advertiserName: 'Super Admin',
    advertiserPhone: '+917069754589',
    isVerifiedAgent: true,
    status: 'PUBLISHED',
  });

  // Load and sync video reels from backend + local storage
  const loadReels = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch properties that have a video from API
      const res = await fetchAdminApi<any[]>('/admin/properties?limit=100');

      let deletedIds = new Set<string>();
      try {
        const storedDeleted = localStorage.getItem('casa_deleted_reels');
        if (storedDeleted) deletedIds = new Set(JSON.parse(storedDeleted));
      } catch (_) {}

      let customReels: any[] = [];
      try {
        const storedCustom = localStorage.getItem('casa_custom_reels');
        if (storedCustom) customReels = JSON.parse(storedCustom);
      } catch (_) {}

      let apiVideoProps: any[] = [];
      if (res.isBackendAvailable && Array.isArray(res.data)) {
        apiVideoProps = res.data.filter(
          (p) =>
            (p.media?.videoUrl || p.videoUrl || p.media?.isReelFormat) &&
            !deletedIds.has(p.id),
        );
      }

      const apiIds = new Set(apiVideoProps.map((p) => p.id));
      const validCustom = customReels.filter(
        (p) => !deletedIds.has(p.id) && !apiIds.has(p.id),
      );
      const filteredInitial = INITIAL_REELS.filter(
        (p) => !deletedIds.has(p.id) && !apiIds.has(p.id),
      );

      const combined = [...validCustom, ...apiVideoProps, ...filteredInitial];
      setReels(combined);
    } catch (err: unknown) {
      toast.error('Sync Notice', 'Loaded default video property dataset.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadReels();
  }, [loadReels]);

  // Filtered Reels
  const filteredReels = React.useMemo(() => {
    return reels.filter((r) => {
      if (filterType !== 'ALL' && r.listingType !== filterType) return false;
      if (filterCategory !== 'ALL' && r.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleEn = (typeof r.title === 'string' ? r.title : r.title?.en || '').toLowerCase();
        const city = (r.location?.city || '').toLowerCase();
        const area = (r.location?.area || '').toLowerCase();
        const society = (r.location?.society || '').toLowerCase();
        if (!titleEn.includes(q) && !city.includes(q) && !area.includes(q) && !society.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [reels, filterType, filterCategory, searchQuery]);

  const activeReel =
    activeModalIndex !== null && filteredReels[activeModalIndex]
      ? filteredReels[activeModalIndex]
      : null;

  // Modal navigation handlers
  const handleNextReel = React.useCallback(() => {
    if (filteredReels.length === 0) return;
    setActiveModalIndex((prev) => {
      const cur = prev ?? 0;
      return (cur + 1) % filteredReels.length;
    });
    setShowDrawer(false);
  }, [filteredReels.length]);

  const handlePrevReel = React.useCallback(() => {
    if (filteredReels.length === 0) return;
    setActiveModalIndex((prev) => {
      const cur = prev ?? 0;
      return (cur - 1 + filteredReels.length) % filteredReels.length;
    });
    setShowDrawer(false);
  }, [filteredReels.length]);

  // Keyboard controls in preview modal
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

  // Handle Add New Reel (Add Property Format)
  const handleCreateReel = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titleEn.trim()) {
      toast.warning('Title Required', 'Please enter a property title in English.');
      return;
    }
    if (!formData.price || isNaN(Number(formData.price))) {
      toast.warning('Price Required', 'Please enter a valid numeric price.');
      return;
    }
    if (!formData.videoUrl.trim()) {
      toast.warning('Video URL Required', 'Please provide a 9:16 Video / YouTube shorts URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedYt = parseYouTubeUrl(formData.videoUrl.trim());
      const thumbnail =
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
          thumbnailUrl: thumbnail,
          coverImage: thumbnail,
          images: [thumbnail],
          videos: [formData.videoUrl.trim()],
          videoUrl: formData.videoUrl.trim(),
          videoThumbnail: thumbnail,
          isReelFormat: true,
          primaryMediaType: 'VIDEO',
        },
        videoUrl: formData.videoUrl.trim(),
        advertiser: {
          name: formData.advertiserName || 'Super Admin',
          phone: formData.advertiserPhone || '+917069754589',
          isVerifiedAgent: formData.isVerifiedAgent,
          role: 'SUPER_ADMIN',
        },
        status: formData.status,
        isPublished: formData.status === 'PUBLISHED',
      };

      // 1. Submit to Backend API (MongoDB Atlas)
      const res = await fetchAdminApi<any>('/properties', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const newId =
        res.data?.id || `reel-custom-${Date.now()}`;
      const newCreatedReel = {
        id: newId,
        slug:
          res.data?.slug ||
          formData.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        ...payload,
      };

      // 2. Persist in local storage so it syncs immediately to frontend reels section
      let customList: any[] = [];
      try {
        const stored = localStorage.getItem('casa_custom_reels');
        if (stored) customList = JSON.parse(stored);
      } catch (_) {}
      customList.unshift(newCreatedReel);
      localStorage.setItem('casa_custom_reels', JSON.stringify(customList));

      // 3. Update state
      setReels((prev) => [newCreatedReel, ...prev]);

      toast.success(
        'Video Reel Added',
        `"${formData.titleEn}" created and published to 9:16 Video Property Reels!`,
      );

      // Reset Form & Close
      setIsAddModalOpen(false);
      setFormData({
        titleEn: '',
        titleHi: '',
        category: 'House / Home',
        listingType: 'SALE',
        price: '',
        priceUnit: 'TOTAL',
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
        advertiserName: 'Super Admin',
        advertiserPhone: '+917069754589',
        isVerifiedAgent: true,
        status: 'PUBLISHED',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create reel';
      toast.error('Creation Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Reel
  const handleDeleteReel = async () => {
    if (!deletingReel) return;

    try {
      // 1. Delete from Backend API if property ID exists
      await fetchAdminApi(`/admin/properties/${encodeURIComponent(deletingReel.id)}`, {
        method: 'DELETE',
      }).catch(() => {});

      // 2. Record in deleted list so it vanishes from both Admin & Frontend
      let deletedList: string[] = [];
      try {
        const stored = localStorage.getItem('casa_deleted_reels');
        if (stored) deletedList = JSON.parse(stored);
      } catch (_) {}
      if (!deletedList.includes(deletingReel.id)) {
        deletedList.push(deletingReel.id);
        localStorage.setItem('casa_deleted_reels', JSON.stringify(deletedList));
      }

      // 3. Also remove from custom local storage list if present
      try {
        const storedCustom = localStorage.getItem('casa_custom_reels');
        if (storedCustom) {
          const parsed = JSON.parse(storedCustom).filter(
            (p: any) => p.id !== deletingReel.id,
          );
          localStorage.setItem('casa_custom_reels', JSON.stringify(parsed));
        }
      } catch (_) {}

      // 4. Update UI
      setReels((prev) => prev.filter((r) => r.id !== deletingReel.id));
      toast.success(
        'Reel Deleted',
        `"${typeof deletingReel.title === 'string' ? deletingReel.title : deletingReel.title?.en}" removed from 9:16 Video Property Reels.`,
      );
      setDeletingReel(null);
    } catch (err: unknown) {
      toast.error('Delete Failed', 'Could not delete reel.');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
              <Video className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              9:16 Video Property Reels Manager
            </h1>
          </div>
          <p className="text-xs md:text-sm text-casa-text-secondary mt-1">
            Super Admin control center to add, review, and delete vertical 9:16 property reels featured on the live marketplace homepage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadReels}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs bg-red-600 hover:bg-red-700 text-white"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            Add New Video Reel
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle space-y-1">
          <div className="text-[11px] font-semibold text-casa-text-muted">Total Video Reels</div>
          <div className="text-2xl font-black text-casa-text-primary">{reels.length}</div>
          <div className="text-[10px] text-emerald-600 font-medium">9:16 Vertical Format</div>
        </Card>

        <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle space-y-1">
          <div className="text-[11px] font-semibold text-casa-text-muted">Buy / For Sale</div>
          <div className="text-2xl font-black text-casa-brand">
            {reels.filter((r) => r.listingType === 'SALE').length}
          </div>
          <div className="text-[10px] text-casa-text-muted">Properties for purchase</div>
        </Card>

        <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle space-y-1">
          <div className="text-[11px] font-semibold text-casa-text-muted">Rent / Lease</div>
          <div className="text-2xl font-black text-amber-500">
            {reels.filter((r) => r.listingType !== 'SALE').length}
          </div>
          <div className="text-[10px] text-casa-text-muted">Monthly rental walkthroughs</div>
        </Card>

        <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle space-y-1">
          <div className="text-[11px] font-semibold text-casa-text-muted">Cities Covered</div>
          <div className="text-2xl font-black text-purple-600">
            {new Set(reels.map((r) => r.location?.city).filter(Boolean)).size}
          </div>
          <div className="text-[10px] text-casa-text-muted">Active metro societies</div>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="p-3 bg-casa-surface border border-casa-border-light shadow-subtle flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-casa-text-muted" />
          <input
            type="text"
            placeholder="Search reels by title, city, society, or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
          />
        </div>

        <div className="flex items-center gap-2 min-w-[130px]">
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

        <div className="flex items-center gap-2 min-w-[140px]">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
          >
            <option value="ALL">All Categories</option>
            <option value="House / Home">House / Home</option>
            <option value="Apartment">Apartment</option>
            <option value="Villa">Villa</option>
            <option value="Commercial">Commercial</option>
            <option value="Studio">Studio</option>
          </select>
        </div>

        {(searchQuery || filterType !== 'ALL' || filterCategory !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilterType('ALL');
              setFilterCategory('ALL');
            }}
            className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1 rounded-lg"
          >
            Reset
          </button>
        )}
      </Card>

      {/* Video Reels Grid: 9:16 Cards */}
      {filteredReels.length === 0 ? (
        <Card className="p-12 text-center bg-casa-surface border border-casa-border-light space-y-3">
          <Video className="w-12 h-12 text-casa-text-muted mx-auto" />
          <h3 className="text-sm font-bold text-casa-text-primary">No Video Reels Found</h3>
          <p className="text-xs text-casa-text-secondary max-w-md mx-auto">
            No 9:16 vertical video reels match your search query. You can add a new reel using the button below.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            Add First Video Reel
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredReels.map((reel, index) => {
            const video = reel.media?.videoUrl || reel.videoUrl || '';
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

                {/* Top Controls: Reel Type & Delete Quick Action */}
                <div className="relative z-10 p-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span>{reel.listingType === 'SALE' ? 'BUY' : 'RENT'}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setDeletingReel(reel)}
                    className="w-7 h-7 rounded-full bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
                    title="Delete this Video Reel"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Center Play Button Overlay */}
                <div className="relative z-10 my-auto flex flex-col items-center justify-center p-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModalIndex(index);
                      setShowDrawer(false);
                    }}
                    className="w-12 h-12 rounded-full bg-white/90 hover:bg-white text-red-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all cursor-pointer backdrop-blur-sm"
                    title="Watch / Preview Reel"
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </button>
                  <span className="mt-1.5 text-[9px] font-bold text-white/90 uppercase drop-shadow">
                    Preview Reel
                  </span>
                </div>

                {/* Bottom Details Bar */}
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

                    <a
                      href={`${PUBLIC_FRONTEND_URL}/property/${reel.slug || reel.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded-lg bg-casa-brand hover:bg-casa-brand-hover text-white text-[10px] transition-colors"
                      title="Open Live on Website"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setDeletingReel(reel)}
                      className="p-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-[10px] transition-colors"
                      title="Delete Reel"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 9:16 Interactive Video Reel Preview Modal with Left/Right Navigation */}
      {activeReel && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handlePrevReel}
            className="fixed left-3 sm:left-6 md:left-12 lg:left-24 top-1/2 -translate-y-1/2 z-50 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/30 active:scale-95 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-2xl hover:scale-110 cursor-pointer"
            title="Previous Reel (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          {/* Right Arrow Button */}
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

            {/* Video Content */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
              {(() => {
                const rawUrl = (
                  activeReel.media?.videoUrl ||
                  activeReel.videoUrl ||
                  (activeReel.media?.videos && activeReel.media.videos[0]) ||
                  ''
                ).trim();

                const parsed = parseYouTubeUrl(rawUrl);
                const isYt =
                  parsed.isValid ||
                  rawUrl.includes('youtu.be') ||
                  rawUrl.includes('youtube.com') ||
                  rawUrl.includes('youtube-nocookie');

                if (isYt) {
                  const embed =
                    parsed.embedUrl ||
                    `https://www.youtube.com/embed/${parsed.videoId || ''}?autoplay=1&mute=0&playsinline=1&rel=0&modestbranding=1`;
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

            {/* Expandable Details Drawer */}
            {showDrawer ? (
              <div className="absolute inset-x-0 bottom-0 top-14 z-30 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 p-4 overflow-y-auto space-y-3 flex flex-col justify-between">
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
                  <a
                    href={`${PUBLIC_FRONTEND_URL}/property/${activeReel.slug || activeReel.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-casa-brand hover:bg-casa-brand-hover text-white text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Open Live Listing On Website</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
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
                    <a
                      href={`${PUBLIC_FRONTEND_URL}/property/${activeReel.slug || activeReel.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-casa-brand text-white text-[11px] font-semibold hover:bg-casa-brand-hover transition-colors inline-flex items-center gap-1"
                    >
                      <span>Live Site</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingReel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 bg-casa-surface border border-casa-border-light shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 dark:bg-red-950/50 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-casa-text-primary">Delete Video Reel?</h3>
                <p className="text-xs text-casa-text-secondary">This will remove the reel from the 9:16 homepage section.</p>
              </div>
            </div>

            <p className="text-xs text-casa-text-secondary">
              Are you sure you want to delete <strong className="text-casa-text-primary">
                "{typeof deletingReel.title === 'string' ? deletingReel.title : deletingReel.title?.en}"
              </strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingReel(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDeleteReel}
                className="text-xs bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, Delete Reel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* + Add New Video Reel Modal (Full Add Property Format) */}
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
                    Add New 9:16 Video Property Reel
                  </h2>
                  <p className="text-xs text-casa-text-secondary">
                    Provide property walkthrough details as per the standard Add Property format.
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

            <form onSubmit={handleCreateReel} className="space-y-4">
              {/* Section 1: Basic Property Info */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-casa-brand uppercase tracking-wider">
                  1. Basic Property Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Property Title (English) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 4 BHK Ultra-Luxury Independent Villa"
                      value={formData.titleEn}
                      onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Property Title (Hindi - Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. गोमती नगर में 4 बीएचके विला"
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
                      <option value="Farm Land">Farm Land</option>
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
                      placeholder="e.g. 18500000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: 9:16 Video Reel Configuration */}
              <div className="space-y-3 pt-2 border-t border-casa-border-light">
                <div className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" />
                  <span>2. 9:16 Video Reel URL & Media</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      9:16 Video / YouTube Shorts URL *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://www.youtube.com/shorts/... or mp4 URL"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                    <span className="text-[10px] text-casa-text-muted mt-1 block">
                      Supports YouTube Shorts, direct video links, and MP4 walkthroughs.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Custom Video Thumbnail URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... (auto-generated if empty)"
                      value={formData.videoThumbnail}
                      onChange={(e) =>
                        setFormData({ ...formData, videoThumbnail: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Structured Location Hierarchy */}
              <div className="space-y-3 pt-2 border-t border-casa-border-light">
                <div className="text-xs font-bold text-casa-brand uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>3. Structured Location Hierarchy</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Uttar Pradesh, Gujarat, Maharashtra"
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
                      placeholder="e.g. Lucknow, Ahmedabad, Mumbai, Bengaluru"
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
                      placeholder="e.g. Gomti Nagar, Satellite, Bandra"
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
                      placeholder="e.g. Extension, Jodhpur Cross Rd"
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
                      placeholder="e.g. Omaxe Residency, DLF Camellias"
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

              {/* Section 5: Advertiser Details & Status */}
              <div className="space-y-3 pt-2 border-t border-casa-border-light">
                <div className="text-xs font-bold text-casa-brand uppercase tracking-wider">
                  5. Advertiser & Moderation Status
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-casa-text-primary mb-1">
                      Listing Owner / Agent Name
                    </label>
                    <input
                      type="text"
                      placeholder="Super Admin"
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
                      placeholder="+917069754589"
                      value={formData.advertiserPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, advertiserPhone: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-casa-text-primary">
                    <input
                      type="checkbox"
                      checked={formData.isVerifiedAgent}
                      onChange={(e) =>
                        setFormData({ ...formData, isVerifiedAgent: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-casa-brand focus:ring-casa-brand"
                    />
                    <span>myproperty Verified Agent Badge</span>
                  </label>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-casa-text-muted">Status:</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                      PUBLISHED (Immediate Live on Website)
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
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
