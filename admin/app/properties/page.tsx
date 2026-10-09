'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/contexts/toast-context';
import { formatPrice } from '@/lib/utils';
import {
  Home,
  Search,
  Plus,
  Eye,
  Trash2,
  MapPin,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  X,
  CheckCircle2,
  XCircle,
  Archive,
  EyeOff,
  Star,
  RefreshCw,
  User,
  ShieldAlert,
  Video,
  Play,
  Film,
  AlertTriangle,
  Pencil,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  getAllAdminProperties,
  approveModerationProperty,
  rejectModerationProperty,
  publishAdminProperty,
  unpublishAdminProperty,
  archiveAdminProperty,
  toggleFeatureAdminProperty,
  deleteAdminProperty,
  updateAdminProperty,
} from '@/services/admin-service';
import { fetchAdminApi } from '@/lib/api-client';
import { AdminPropertyItem } from '@/types';
import { parseYouTubeUrl, validateVideoFile } from '@/lib/video';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api/v1';

const FRONTEND_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL ||
  process.env.NEXT_PUBLIC_MARKETPLACE_URL ||
  'http://localhost:3000';

export default function AdminPropertiesPage() {
  const toast = useToast();
  const [properties, setProperties] = React.useState<AdminPropertyItem[]>([]);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('ALL');
  const [selectedStatus, setSelectedStatus] = React.useState('ALL');
  const [selectedType, setSelectedType] = React.useState('ALL');
  const [selectedFeatured, setSelectedFeatured] = React.useState('ALL');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);

  // Detail Modal State
  const [selectedProperty, setSelectedProperty] = React.useState<AdminPropertyItem | null>(null);

  // Reject Modal State
  const [rejectingProperty, setRejectingProperty] = React.useState<AdminPropertyItem | null>(null);
  const [rejectReason, setRejectReason] = React.useState('INSUFFICIENT_DOCS');
  const [rejectFeedback, setRejectFeedback] = React.useState('');
  const [isRejecting, setIsRejecting] = React.useState(false);

  // Add Property Modal State
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadedImages, setUploadedImages] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Video Management State (Add Modal)
  const [mediaTab, setMediaTab] = React.useState<'PHOTOS' | 'VIDEO'>('PHOTOS');
  const [videoSourceType, setVideoSourceType] = React.useState<'YOUTUBE' | 'LOCAL'>('YOUTUBE');
  const [youtubeInput, setYoutubeInput] = React.useState('');
  const [youtubeResult, setYoutubeResult] = React.useState<{
    isValid: boolean;
    videoId?: string;
    embedUrl?: string;
    thumbnailUrl?: string;
    error?: string;
  } | null>(null);
  const [localVideoUrl, setLocalVideoUrl] = React.useState<string | null>(null);
  const [localVideoName, setLocalVideoName] = React.useState<string>('');
  const [localVideoError, setLocalVideoError] = React.useState<string | null>(null);
  const [primaryMediaType, setPrimaryMediaType] = React.useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const videoFileInputRef = React.useRef<HTMLInputElement>(null);

  // Edit Property Modal State
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editingProperty, setEditingProperty] = React.useState<AdminPropertyItem | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = React.useState(false);
  const [editUploadedImages, setEditUploadedImages] = React.useState<string[]>([]);
  const editFileInputRef = React.useRef<HTMLInputElement>(null);
  const editVideoFileInputRef = React.useRef<HTMLInputElement>(null);
  const [editMediaTab, setEditMediaTab] = React.useState<'PHOTOS' | 'VIDEO'>('PHOTOS');
  const [editVideoSourceType, setEditVideoSourceType] = React.useState<'YOUTUBE' | 'LOCAL'>('YOUTUBE');
  const [editYoutubeInput, setEditYoutubeInput] = React.useState('');
  const [editYoutubeResult, setEditYoutubeResult] = React.useState<{
    isValid: boolean;
    videoId?: string;
    embedUrl?: string;
    thumbnailUrl?: string;
    error?: string;
  } | null>(null);
  const [editLocalVideoUrl, setEditLocalVideoUrl] = React.useState<string | null>(null);
  const [editLocalVideoName, setEditLocalVideoName] = React.useState<string>('');
  const [editLocalVideoError, setEditLocalVideoError] = React.useState<string | null>(null);
  const [editPrimaryMediaType, setEditPrimaryMediaType] = React.useState<'IMAGE' | 'VIDEO'>('IMAGE');

  const [editProp, setEditProp] = React.useState({
    id: '',
    title: '',
    category: 'House / Home',
    listingType: 'SALE',
    price: '',
    city: 'Lucknow',
    locality: '',
    bedrooms: '3',
    bathrooms: '3',
    carpetAreaSqFt: '1800',
    furnishing: 'SEMI_FURNISHED',
    constructionStatus: 'READY_TO_MOVE',
    advertiserName: 'CASA Premier Realty',
    advertiserPhone: '+917359237870',
    advertiserRole: 'SUPER_ADMIN',
    description: '',
    isFeatured: false,
    status: 'PUBLISHED',
  });

  const [newProp, setNewProp] = React.useState({
    title: '',
    category: 'House / Home',
    listingType: 'SALE',
    price: '',
    city: 'Lucknow',
    locality: '',
    bedrooms: '3',
    bathrooms: '3',
    carpetAreaSqFt: '1800',
    advertiserName: 'CASA Premier Realty',
    advertiserPhone: '+917359237870',
    description: '',
    isFeatured: false,
    status: 'PUBLISHED',
  });

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [props, catsRes] = await Promise.all([
        getAllAdminProperties({
          status: selectedStatus,
          category: selectedCategory,
          listingType: selectedType,
          isFeatured: selectedFeatured,
          search: searchQuery,
        }),
        fetch(`${API_BASE}/properties/categories/all`).then((r) => r.json()).catch(() => []),
      ]);

      setProperties(props);

      const rawCats = catsRes.data || catsRes || [];
      if (Array.isArray(rawCats)) {
        setCategories(
          rawCats.map((c: { name?: string; code?: string }) => c.name || c.code || ''),
        );
      }
    } catch {
      toast.error('Network Notice', 'Could not load properties from API gateway.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, selectedCategory, selectedType, selectedFeatured, searchQuery, toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle local PC photo upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.warning('Invalid File', 'Please upload image files (JPG, PNG, WebP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setUploadedImages((prev) => [...prev, uploadEvent.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    toast.info('Images Selected', `${files.length} photo(s) selected from PC.`);
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle YouTube URL changes
  const handleYouTubeChange = (val: string) => {
    setYoutubeInput(val);
    if (!val.trim()) {
      setYoutubeResult(null);
      return;
    }
    const res = parseYouTubeUrl(val);
    setYoutubeResult(res);
    if (res.isValid) {
      setPrimaryMediaType('VIDEO');
      toast.success('YouTube Verified', 'Valid YouTube video format recognized.');
    }
  };

  // Handle Local Video File Upload
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateVideoFile(file, 50);
    if (!validation.isValid) {
      setLocalVideoError(validation.error || 'Invalid video file');
      toast.warning('Video Upload Error', validation.error || 'Invalid video file');
      return;
    }

    setLocalVideoError(null);
    setLocalVideoName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLocalVideoUrl(event.target.result as string);
        setPrimaryMediaType('VIDEO');
        toast.success('Video Ready', `Loaded video from PC: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeVideo = () => {
    setYoutubeInput('');
    setYoutubeResult(null);
    setLocalVideoUrl(null);
    setLocalVideoName('');
    setLocalVideoError(null);
    setPrimaryMediaType('IMAGE');
    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = '';
    }
    toast.info('Video Removed', 'Property media reverted to image-only gallery.');
  };

  // Status Action Handlers
  const handleApprove = async (prop: AdminPropertyItem) => {
    try {
      await approveModerationProperty(prop.id, 'Approved and published by administrator');
      toast.success('Listing Approved', `"${prop.title}" is now approved and live.`);
      await loadData();
      if (selectedProperty?.id === prop.id) setSelectedProperty(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      toast.error('Action Failed', msg);
    }
  };

  const handleOpenRejectModal = (prop: AdminPropertyItem) => {
    setRejectingProperty(prop);
    setRejectReason('INSUFFICIENT_DOCS');
    setRejectFeedback('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingProperty) return;
    setIsRejecting(true);
    try {
      await rejectModerationProperty(rejectingProperty.id, rejectReason, rejectFeedback);
      toast.info('Listing Rejected', `"${rejectingProperty.title}" rejected with reason code.`);
      setRejectingProperty(null);
      await loadData();
      if (selectedProperty?.id === rejectingProperty.id) setSelectedProperty(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rejection failed';
      toast.error('Action Failed', msg);
    } finally {
      setIsRejecting(false);
    }
  };

  const handlePublish = async (prop: AdminPropertyItem) => {
    try {
      await publishAdminProperty(prop.id);
      toast.success('Property Published', `"${prop.title}" is now visible on the public site.`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Publish failed';
      toast.error('Action Failed', msg);
    }
  };

  const handleUnpublish = async (prop: AdminPropertyItem) => {
    try {
      await unpublishAdminProperty(prop.id);
      toast.info('Property Unpublished', `"${prop.title}" hidden from public search.`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unpublish failed';
      toast.error('Action Failed', msg);
    }
  };

  const handleArchive = async (prop: AdminPropertyItem) => {
    if (!confirm(`Are you sure you want to archive "${prop.title}"?`)) return;
    try {
      await archiveAdminProperty(prop.id);
      toast.info('Property Archived', `"${prop.title}" moved to archive.`);
      await loadData();
      if (selectedProperty?.id === prop.id) setSelectedProperty(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Archive failed';
      toast.error('Action Failed', msg);
    }
  };

  const handleToggleFeatured = async (prop: AdminPropertyItem) => {
    const nextFeatured = !prop.isFeatured;
    try {
      await toggleFeatureAdminProperty(prop.id, nextFeatured);
      toast.success('Featured Status Updated', nextFeatured ? 'Marked as Featured' : 'Removed from Featured');
      setProperties((prev) =>
        prev.map((p) => (p.id === prop.id ? { ...p, isFeatured: nextFeatured } : p)),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle featured';
      toast.error('Action Failed', msg);
    }
  };

  const handleDelete = async (prop: AdminPropertyItem) => {
    if (!confirm(`Are you sure you want to permanently delete "${prop.title}" from MongoDB Atlas?`)) return;
    try {
      await deleteAdminProperty(prop.id);
      toast.success('Property Deleted', `"${prop.title}" removed from database.`);
      setProperties((prev) => prev.filter((p) => p.id !== prop.id));
      setSelectedIds((prev) => prev.filter((id) => id !== prop.id));
      if (selectedProperty?.id === prop.id) setSelectedProperty(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      toast.error('Action Failed', msg);
    }
  };

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (properties.length === 0) return;
    if (selectedIds.length === properties.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(properties.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmMsg = `Are you sure you want to permanently delete ${selectedIds.length} selected properties from MongoDB Atlas? This action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    setIsBulkDeleting(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) => deleteAdminProperty(id)),
      );
      const succeeded = results.filter((r) => r.status === 'fulfilled' && r.value).length;
      const failed = selectedIds.length - succeeded;

      if (succeeded > 0) {
        toast.success(
          'Bulk Delete Successful',
          `Successfully deleted ${succeeded} properties from MongoDB Atlas.`,
        );
      }
      if (failed > 0) {
        toast.warning(
          'Bulk Delete Notice',
          `${failed} property deletions failed or were not found.`,
        );
      }

      setSelectedIds([]);
      if (selectedProperty && selectedIds.includes(selectedProperty.id)) {
        setSelectedProperty(null);
      }
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bulk delete failed';
      toast.error('Bulk Delete Error', msg);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Edit Property Handlers
  const handleOpenEditModal = (prop: AdminPropertyItem) => {
    setEditingProperty(prop);
    setEditProp({
      id: prop.id,
      title: typeof prop.title === 'string' ? prop.title : prop.rawTitle?.en || '',
      category: prop.category || 'House / Home',
      listingType: (prop.listingType as 'SALE' | 'RENT' | 'LEASE') || 'SALE',
      price: prop.price
        ? String(prop.price)
        : prop.rawPrice?.amount
        ? String(prop.rawPrice.amount)
        : '',
      city:
        prop.rawLocation?.city ||
        (typeof prop.location === 'string' ? prop.location.split(',')?.[0]?.trim() : 'Lucknow') ||
        'Lucknow',
      locality:
        prop.rawLocation?.locality ||
        (typeof prop.location === 'string' ? prop.location : '') ||
        '',
      bedrooms: prop.specs?.bedrooms ? String(prop.specs.bedrooms) : '3',
      bathrooms: prop.specs?.bathrooms ? String(prop.specs.bathrooms) : '3',
      carpetAreaSqFt: prop.specs?.carpetAreaSqFt
        ? String(prop.specs.carpetAreaSqFt)
        : prop.specs?.area
        ? String(prop.specs.area)
        : '1800',
      furnishing: prop.specs?.furnishing || 'SEMI_FURNISHED',
      constructionStatus: prop.specs?.constructionStatus || 'READY_TO_MOVE',
      advertiserName:
        prop.advertiserName || prop.advertiser?.name || 'CASA Premier Realty',
      advertiserPhone:
        prop.advertiserPhone || prop.advertiser?.phone || '+917359237870',
      advertiserRole:
        prop.advertiserRole || prop.advertiser?.role || 'SUPER_ADMIN',
      description:
        typeof prop.description === 'string'
          ? prop.description
          : prop.rawDescription?.en || '',
      isFeatured: Boolean(prop.isFeatured),
      status: prop.status || 'PUBLISHED',
    });

    const imgs = prop.media?.images || (prop.media?.thumbnailUrl ? [prop.media.thumbnailUrl] : []);
    setEditUploadedImages(imgs);

    const vidUrl = prop.media?.videoUrl || '';
    if (vidUrl) {
      if (prop.media?.videoType === 'YOUTUBE' || vidUrl.includes('youtu')) {
        setEditVideoSourceType('YOUTUBE');
        setEditYoutubeInput(vidUrl);
        setEditYoutubeResult(parseYouTubeUrl(vidUrl));
        setEditLocalVideoUrl(null);
        setEditLocalVideoName('');
      } else {
        setEditVideoSourceType('LOCAL');
        setEditLocalVideoUrl(vidUrl);
        setEditLocalVideoName('Attached Video Tour');
        setEditYoutubeInput('');
        setEditYoutubeResult(null);
      }
      setEditPrimaryMediaType(prop.media?.primaryMediaType || 'VIDEO');
    } else {
      setEditVideoSourceType('YOUTUBE');
      setEditYoutubeInput('');
      setEditYoutubeResult(null);
      setEditLocalVideoUrl(null);
      setEditLocalVideoName('');
      setEditPrimaryMediaType('IMAGE');
    }

    setEditMediaTab('PHOTOS');
    setIsEditOpen(true);
  };

  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.warning('Invalid File', 'Please upload image files (JPG, PNG, WebP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setEditUploadedImages((prev) => [...prev, uploadEvent.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    toast.info('Images Added', `${files.length} photo(s) selected from PC.`);
  };

  const removeEditImage = (index: number) => {
    setEditUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditYouTubeChange = (val: string) => {
    setEditYoutubeInput(val);
    if (!val.trim()) {
      setEditYoutubeResult(null);
      return;
    }
    const res = parseYouTubeUrl(val);
    setEditYoutubeResult(res);
    if (res.isValid) {
      setEditPrimaryMediaType('VIDEO');
      toast.success('YouTube Verified', 'Valid YouTube video format recognized.');
    }
  };

  const handleEditVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateVideoFile(file, 50);
    if (!validation.isValid) {
      setEditLocalVideoError(validation.error || 'Invalid video file');
      toast.warning('Video Upload Error', validation.error || 'Invalid video file');
      return;
    }

    setEditLocalVideoError(null);
    setEditLocalVideoName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditLocalVideoUrl(event.target.result as string);
        setEditPrimaryMediaType('VIDEO');
        toast.success('Video Ready', `Loaded video from PC: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeEditVideo = () => {
    setEditYoutubeInput('');
    setEditYoutubeResult(null);
    setEditLocalVideoUrl(null);
    setEditLocalVideoName('');
    setEditLocalVideoError(null);
    setEditPrimaryMediaType('IMAGE');
    if (editVideoFileInputRef.current) {
      editVideoFileInputRef.current.value = '';
    }
    toast.info('Video Removed', 'Property media reverted to image-only gallery.');
  };

  const handleEditPropertySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProp.id) return;
    if (!editProp.title.trim() || !editProp.locality.trim() || !editProp.price) {
      toast.warning('Validation Error', 'Please fill in Title, Locality, and Price.');
      return;
    }

    const hasValidYouTube = Boolean(editYoutubeResult?.isValid && editYoutubeInput.trim());
    const hasLocalVideo = Boolean(editLocalVideoUrl);
    const videoUrl = hasValidYouTube
      ? editYoutubeInput.trim()
      : hasLocalVideo
      ? editLocalVideoUrl!
      : undefined;
    const videoType = hasValidYouTube ? 'YOUTUBE' : hasLocalVideo ? 'LOCAL' : undefined;
    const videoThumbnail = hasValidYouTube
      ? editYoutubeResult?.thumbnailUrl
      : editUploadedImages[0] || undefined;
    const isVideoPrimary = (hasValidYouTube || hasLocalVideo) && editPrimaryMediaType === 'VIDEO';

    if (editUploadedImages.length === 0 && !hasValidYouTube && !hasLocalVideo) {
      toast.warning('Media Required', 'Please upload at least one photo or provide a property video.');
      return;
    }

    const primaryImage =
      editUploadedImages.length > 0
        ? editUploadedImages[0]
        : videoThumbnail || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';

    setIsEditSubmitting(true);
    try {
      const payload = {
        title: { en: editProp.title },
        description: {
          en:
            editProp.description ||
            `${editProp.title} located in ${editProp.locality}, ${editProp.city}.`,
        },
        category: editProp.category,
        listingType: editProp.listingType,
        price: { amount: Number(editProp.price), currency: 'INR', isNegotiable: true },
        location: {
          country: 'India',
          state: 'Uttar Pradesh',
          district: editProp.city,
          city: editProp.city,
          locality: editProp.locality,
          coordinates: [80.9462, 26.8467],
        },
        specs: {
          bedrooms: editProp.bedrooms ? Number(editProp.bedrooms) : undefined,
          bathrooms: editProp.bathrooms ? Number(editProp.bathrooms) : undefined,
          carpetAreaSqFt: editProp.carpetAreaSqFt ? Number(editProp.carpetAreaSqFt) : undefined,
          constructionStatus: editProp.constructionStatus,
          furnishing: editProp.furnishing,
        },
        media: {
          thumbnailUrl: isVideoPrimary && videoThumbnail ? videoThumbnail : primaryImage,
          coverImage: primaryImage,
          images: editUploadedImages.length > 0 ? editUploadedImages : [primaryImage],
          videos: videoUrl ? [videoUrl] : [],
          videoUrl: videoUrl,
          videoType: videoType,
          videoThumbnail: videoThumbnail,
          primaryMediaType: isVideoPrimary ? 'VIDEO' : 'IMAGE',
        },
        advertiser: {
          name: editProp.advertiserName,
          phone: editProp.advertiserPhone,
          isVerifiedAgent: true,
          role: editProp.advertiserRole,
        },
        status: editProp.status,
        isPublished: editProp.status === 'PUBLISHED' || editProp.status === 'ACTIVE',
        isFeatured: editProp.isFeatured,
      };

      const res = await updateAdminProperty(editProp.id, payload);
      if (res.success) {
        toast.success('Property Updated', `"${editProp.title}" updated in MongoDB Atlas.`);
        setIsEditOpen(false);
        setEditingProperty(null);
        await loadData();
      } else {
        toast.error('Update Failed', res.message || 'Could not update property');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update property';
      toast.error('Update Error', msg);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProp.title.trim() || !newProp.locality.trim() || !newProp.price) {
      toast.warning('Validation Error', 'Please fill in Title, Locality, and Price.');
      return;
    }

    const hasValidYouTube = Boolean(youtubeResult?.isValid && youtubeInput.trim());
    const hasLocalVideo = Boolean(localVideoUrl);
    const videoUrl = hasValidYouTube
      ? youtubeInput.trim()
      : hasLocalVideo
      ? localVideoUrl!
      : undefined;
    const videoType = hasValidYouTube ? 'YOUTUBE' : hasLocalVideo ? 'LOCAL' : undefined;
    const videoThumbnail = hasValidYouTube
      ? youtubeResult?.thumbnailUrl
      : uploadedImages[0] || undefined;
    const isVideoPrimary = (hasValidYouTube || hasLocalVideo) && primaryMediaType === 'VIDEO';

    if (uploadedImages.length === 0 && !hasValidYouTube && !hasLocalVideo) {
      toast.warning('Media Required', 'Please upload at least one photo or provide a property video.');
      return;
    }

    const primaryImage =
      uploadedImages.length > 0
        ? uploadedImages[0]
        : videoThumbnail || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';

    setIsSubmitting(true);
    try {
      const payload = {
        title: { en: newProp.title },
        description: {
          en: newProp.description || `${newProp.title} located in ${newProp.locality}, ${newProp.city}.`,
        },
        category: newProp.category,
        listingType: newProp.listingType,
        price: { amount: Number(newProp.price), currency: 'INR', isNegotiable: true },
        location: {
          country: 'India',
          state: 'Uttar Pradesh',
          district: newProp.city,
          city: newProp.city,
          locality: newProp.locality,
          coordinates: [80.9462, 26.8467],
        },
        specs: {
          bedrooms: Number(newProp.bedrooms) || undefined,
          bathrooms: Number(newProp.bathrooms) || undefined,
          carpetAreaSqFt: Number(newProp.carpetAreaSqFt) || undefined,
          constructionStatus: 'READY_TO_MOVE',
          furnishing: 'SEMI_FURNISHED',
        },
        media: {
          thumbnailUrl: isVideoPrimary && videoThumbnail ? videoThumbnail : primaryImage,
          coverImage: primaryImage,
          images: uploadedImages.length > 0 ? uploadedImages : [primaryImage],
          videos: videoUrl ? [videoUrl] : [],
          videoUrl: videoUrl,
          videoType: videoType,
          videoThumbnail: videoThumbnail,
          primaryMediaType: isVideoPrimary ? 'VIDEO' : 'IMAGE',
        },
        advertiser: {
          name: newProp.advertiserName,
          phone: newProp.advertiserPhone,
          isVerifiedAgent: true,
          role: 'SUPER_ADMIN',
        },
        status: newProp.status,
        isPublished: newProp.status === 'PUBLISHED',
        isFeatured: newProp.isFeatured,
      };

      const result = await fetchAdminApi<AdminPropertyItem>('/properties', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (result.isBackendAvailable && result.data && !result.error) {
        toast.success(
          'Property Created',
          `"${newProp.title}" created in MongoDB Atlas!`,
        );
        setIsAddOpen(false);
        setUploadedImages([]);
        setYoutubeInput('');
        setYoutubeResult(null);
        setLocalVideoUrl(null);
        setLocalVideoName('');
        setLocalVideoError(null);
        setPrimaryMediaType('IMAGE');
        setMediaTab('PHOTOS');
        setNewProp({
          title: '',
          category: 'House / Home',
          listingType: 'SALE',
          price: '',
          city: 'Lucknow',
          locality: '',
          bedrooms: '3',
          bathrooms: '3',
          carpetAreaSqFt: '1800',
          advertiserName: 'CASA Premier Realty',
          advertiserPhone: '+917359237870',
          description: '',
          isFeatured: false,
          status: 'PUBLISHED',
        });
        await loadData();
      } else {
        toast.error('Creation Failed', result.error || 'Server error');
      }
    } catch {
      toast.error('Network Error', 'Failed to reach API server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-casa-brand-subtle rounded-xl text-casa-brand">
              <Home className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              Property Management Engine
            </h1>
          </div>
          <p className="text-xs md:text-sm text-casa-text-secondary mt-1">
            Database-driven lifecycle governance & moderation synced with MongoDB Atlas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="text-xs flex items-center gap-1.5 bg-casa-brand text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </Button>

          <a
            href={FRONTEND_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-casa-brand bg-casa-brand-subtle hover:bg-casa-brand/15 rounded-xl transition-colors"
          >
            <span>Live Marketplace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-casa-text-muted" />
            <input
              type="text"
              placeholder="Search title, locality, owner, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl focus:outline-none focus:ring-2 focus:ring-casa-brand/30 text-casa-text-primary"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl focus:outline-none focus:ring-2 focus:ring-casa-brand/30 text-casa-text-primary"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl focus:outline-none focus:ring-2 focus:ring-casa-brand/30 text-casa-text-primary"
          >
            <option value="ALL">All Listing Types</option>
            <option value="SALE">For Sale</option>
            <option value="RENT">For Rent</option>
            <option value="LEASE">For Lease</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl focus:outline-none focus:ring-2 focus:ring-casa-brand/30 text-casa-text-primary font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published / Active</option>
            <option value="PENDING_REVIEW">Pending Review (Needs Action)</option>
            <option value="APPROVED">Approved (Ready to Publish)</option>
            <option value="REJECTED">Rejected</option>
            <option value="UNPUBLISHED">Unpublished</option>
            <option value="ARCHIVED">Archived</option>
            <option value="DRAFT">Draft</option>
          </select>

          {/* Featured Filter */}
          <select
            value={selectedFeatured}
            onChange={(e) => setSelectedFeatured(e.target.value)}
            className="px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl focus:outline-none focus:ring-2 focus:ring-casa-brand/30 text-casa-text-primary"
          >
            <option value="ALL">All Featured Tiers</option>
            <option value="true">★ Featured Only</option>
            <option value="false">Standard Only</option>
          </select>
        </div>
      </Card>

      {/* Bulk Selection Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl shadow-subtle animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
              {selectedIds.length} of {properties.length} {selectedIds.length === 1 ? 'property' : 'properties'} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="text-xs border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50"
            >
              Deselect All
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isBulkDeleting}
              onClick={handleBulkDelete}
              className="text-xs bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isBulkDeleting ? 'Deleting Selected...' : `Delete Selected (${selectedIds.length})`}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Property Table */}
      <Card className="bg-casa-surface border border-casa-border-light shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-casa-text-secondary">
            <thead className="bg-casa-subtle/50 text-[11px] uppercase font-bold text-casa-text-muted border-b border-casa-border-light">
              <tr>
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    aria-label="Select all properties"
                    checked={properties.length > 0 && selectedIds.length === properties.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-casa-border-light text-casa-brand focus:ring-casa-brand/30 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3">Property & Reference</th>
                <th className="px-4 py-3">Category / Type</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Owner / Advertiser</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-casa-border-light">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-casa-text-muted">
                    Loading live properties from MongoDB Atlas...
                  </td>
                </tr>
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-casa-text-muted">
                    No matching properties found.
                  </td>
                </tr>
              ) : (
                properties.map((item) => {
                  const isPending =
                    item.status === 'PENDING_REVIEW' || item.status === 'PENDING_APPROVAL';
                  const isPublished =
                    item.status === 'PUBLISHED' || item.status === 'ACTIVE';
                  const isApproved = item.status === 'APPROVED';
                  const isRejected = item.status === 'REJECTED';
                  const isUnpublished = item.status === 'UNPUBLISHED';
                  const isArchived = item.status === 'ARCHIVED';
                  const isDraft = item.status === 'DRAFT';
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <tr
                      key={item.id || item._id}
                      className={`hover:bg-casa-canvas/50 transition-colors ${
                        isSelected ? 'bg-casa-brand/5' : ''
                      }`}
                    >
                      <td className="w-10 px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Select ${item.title}`}
                          checked={isSelected}
                          onChange={() => toggleSelectOne(item.id)}
                          className="w-4 h-4 rounded border-casa-border-light text-casa-brand focus:ring-casa-brand/30 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border border-casa-border-light bg-casa-subtle">
                            {item.media?.thumbnailUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={item.media.thumbnailUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-casa-text-muted">
                                <ImageIcon className="w-5 h-5 opacity-40" />
                              </div>
                            )}
                            {item.media?.videoUrl && (
                              <span
                                title="Video Tour Configured"
                                className="absolute bottom-0 right-0 p-0.5 bg-rose-600 text-white rounded-tl text-[8px] flex items-center justify-center shadow"
                              >
                                <Play className="w-2.5 h-2.5 fill-white" />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setSelectedProperty(item)}
                              className="font-semibold text-casa-text-primary max-w-xs truncate hover:text-casa-brand text-left cursor-pointer block"
                            >
                              {item.title}
                            </button>
                            <div className="flex items-center gap-1.5 text-[11px] text-casa-text-muted mt-0.5">
                              <span className="font-mono text-[10px] text-casa-brand font-bold">
                                {item.referenceId || item.id}
                              </span>
                              <span>•</span>
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-casa-text-primary">{item.category}</div>
                        <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-casa-subtle text-casa-text-muted">
                          {item.listingType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-casa-brand">
                        {formatPrice(item.price)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-casa-text-primary font-medium">{item.advertiserName}</div>
                        <div className="text-[11px] text-casa-text-muted">
                          {item.advertiserRole === 'VERIFIED_AGENT'
                            ? 'Verified Agent'
                            : 'Property Owner'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isPublished && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Published Live
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Pending Review
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Rejected
                          </span>
                        )}
                        {isUnpublished && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200">
                            Unpublished
                          </span>
                        )}
                        {isArchived && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200">
                            Archived
                          </span>
                        )}
                        {isDraft && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(item)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                            item.isFeatured
                              ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                              : 'bg-casa-canvas text-casa-text-muted border-casa-border-light hover:border-casa-brand'
                          }`}
                        >
                          <Star className="w-3 h-3 fill-current" />
                          <span>{item.isFeatured ? 'Featured' : 'Standard'}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pending Actions */}
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(item)}
                                title="Approve & Publish Live"
                                className="px-2 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenRejectModal(item)}
                                title="Reject with Reason"
                                className="px-2 py-1 text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {/* Approved Actions */}
                          {isApproved && (
                            <button
                              type="button"
                              onClick={() => handlePublish(item)}
                              title="Publish Live to Marketplace"
                              className="px-2 py-1 text-[11px] font-bold bg-casa-brand hover:bg-casa-brand-hover text-white rounded-lg transition-colors cursor-pointer"
                            >
                              Publish Live
                            </button>
                          )}

                          {/* Published Actions */}
                          {isPublished && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUnpublish(item)}
                                title="Unpublish from Public Search"
                                className="p-1.5 text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                              >
                                <EyeOff className="w-4 h-4" />
                              </button>
                              <Link
                                href={`${FRONTEND_URL}/property/${item.slug}`}
                                target="_blank"
                                title="View on Public Marketplace"
                                className="p-1.5 text-casa-brand hover:bg-casa-brand-subtle rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            </>
                          )}

                          {/* Unpublished Actions */}
                          {isUnpublished && (
                            <button
                              type="button"
                              onClick={() => handlePublish(item)}
                              title="Re-publish Live"
                              className="px-2 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                            >
                              Re-publish
                            </button>
                          )}

                          {/* Edit Property Action */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit Property Details & Media"
                            className="p-1.5 text-casa-brand hover:bg-casa-brand-subtle rounded-lg transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* View Detail Drawer */}
                          <button
                            type="button"
                            onClick={() => setSelectedProperty(item)}
                            title="View Property Dossier"
                            className="p-1.5 text-casa-text-secondary hover:text-casa-brand hover:bg-casa-subtle rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Archive Action */}
                          {!isArchived && (
                            <button
                              type="button"
                              onClick={() => handleArchive(item)}
                              title="Archive Property"
                              className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Action */}
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            title="Delete from Database"
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Property Detail Dossier Modal */}
      {selectedProperty && (
        <Modal
          isOpen={!!selectedProperty}
          onClose={() => setSelectedProperty(null)}
          title={`Property Dossier: ${selectedProperty.title}`}
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 text-xs">
            {/* Primary Video Tour Player */}
            {selectedProperty.media?.videoUrl && (
              <div className="rounded-xl overflow-hidden border border-casa-border-light bg-black">
                <div className="p-2 bg-casa-surface border-b border-casa-border-light flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-casa-text-primary text-[11px]">
                    <Video className="w-3.5 h-3.5 text-rose-500" />
                    <span>Primary Media: Property Video Tour ({selectedProperty.media.videoType || 'YouTube'})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                    Video Configured
                  </span>
                </div>
                <div className="relative aspect-video w-full">
                  {selectedProperty.media.videoType === 'YOUTUBE' || selectedProperty.media.videoUrl.includes('youtu') ? (
                    <iframe
                      src={
                        parseYouTubeUrl(selectedProperty.media.videoUrl).embedUrl ||
                        `https://www.youtube-nocookie.com/embed/${selectedProperty.media.videoUrl}?autoplay=0&rel=0`
                      }
                      title={selectedProperty.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={selectedProperty.media.videoUrl}
                      controls
                      playsInline
                      poster={selectedProperty.media.thumbnailUrl}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Image Gallery */}
            {selectedProperty.media?.images && selectedProperty.media.images.length > 0 && (
              <div>
                <span className="font-semibold text-casa-text-primary block mb-1.5">
                  Supporting Photo Gallery ({selectedProperty.media.images.length} photos)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {selectedProperty.media.images.map((img, idx) => (
                    <div key={idx} className="h-24 rounded-lg overflow-hidden border border-casa-border-light bg-casa-subtle">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Status Bar */}
            <div className="flex items-center justify-between p-3 bg-casa-canvas rounded-xl border border-casa-border-light">
              <div>
                <span className="text-[10px] text-casa-text-muted block">Status</span>
                <span className="font-bold text-casa-text-primary">{selectedProperty.status}</span>
              </div>
              <div>
                <span className="text-[10px] text-casa-text-muted block">Reference ID</span>
                <span className="font-mono font-bold text-casa-brand">{selectedProperty.referenceId || selectedProperty.id}</span>
              </div>
              <div>
                <span className="text-[10px] text-casa-text-muted block">Listing Type</span>
                <span className="font-bold text-casa-text-primary">{selectedProperty.listingType}</span>
              </div>
              <div>
                <span className="text-[10px] text-casa-text-muted block">Price</span>
                <span className="font-bold text-casa-brand">{formatPrice(selectedProperty.price)}</span>
              </div>
            </div>

            {/* Rejection / Moderation History Banner */}
            {selectedProperty.status === 'REJECTED' && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-red-700 dark:text-red-400">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Rejection Details</span>
                </div>
                <div className="text-red-600 dark:text-red-300">
                  Reason Code: <strong className="font-mono">{selectedProperty.rejectionReason || 'INSUFFICIENT_DOCS'}</strong>
                </div>
                {selectedProperty.adminRemark && (
                  <div className="text-red-600 dark:text-red-300 text-[11px]">
                    Moderator Remarks: {selectedProperty.adminRemark}
                  </div>
                )}
              </div>
            )}

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 bg-casa-canvas rounded-lg border border-casa-border-light">
                <span className="text-[10px] text-casa-text-muted block">Category</span>
                <span className="font-semibold text-casa-text-primary">{selectedProperty.category}</span>
              </div>
              <div className="p-2.5 bg-casa-canvas rounded-lg border border-casa-border-light">
                <span className="text-[10px] text-casa-text-muted block">Area (Sq.Ft)</span>
                <span className="font-semibold text-casa-text-primary">{selectedProperty.specs?.carpetAreaSqFt || selectedProperty.specs?.area || 'N/A'}</span>
              </div>
              <div className="p-2.5 bg-casa-canvas rounded-lg border border-casa-border-light">
                <span className="text-[10px] text-casa-text-muted block">Bedrooms / Baths</span>
                <span className="font-semibold text-casa-text-primary">
                  {selectedProperty.specs?.bedrooms || 'N/A'} BHK / {selectedProperty.specs?.bathrooms || 'N/A'} Bath
                </span>
              </div>
              <div className="p-2.5 bg-casa-canvas rounded-lg border border-casa-border-light">
                <span className="text-[10px] text-casa-text-muted block">Furnishing</span>
                <span className="font-semibold text-casa-text-primary">{selectedProperty.specs?.furnishing || 'SEMI_FURNISHED'}</span>
              </div>
            </div>

            {/* Location & Advertiser */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-casa-canvas rounded-xl border border-casa-border-light space-y-1">
                <div className="flex items-center gap-1 font-semibold text-casa-text-primary">
                  <MapPin className="w-3.5 h-3.5 text-casa-brand" />
                  <span>Location</span>
                </div>
                <p className="text-casa-text-secondary">{selectedProperty.location}</p>
              </div>

              <div className="p-3 bg-casa-canvas rounded-xl border border-casa-border-light space-y-1">
                <div className="flex items-center gap-1 font-semibold text-casa-text-primary">
                  <User className="w-3.5 h-3.5 text-casa-brand" />
                  <span>Advertiser Contact</span>
                </div>
                <p className="font-medium text-casa-text-primary">{selectedProperty.advertiserName}</p>
                <p className="text-[11px] text-casa-text-muted font-mono">{selectedProperty.advertiserPhone}</p>
              </div>
            </div>

            {/* Description */}
            <div className="p-3 bg-casa-canvas rounded-xl border border-casa-border-light space-y-1">
              <span className="font-semibold text-casa-text-primary block">Description</span>
              <p className="text-casa-text-secondary leading-relaxed">{selectedProperty.description}</p>
            </div>

            {/* Amenities */}
            {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
              <div>
                <span className="font-semibold text-casa-text-primary block mb-1.5">Amenities</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProperty.amenities.map((am, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-casa-subtle text-[11px] text-casa-text-secondary border border-casa-border-light">
                      {am}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-casa-border-light">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const prop = selectedProperty;
                  setSelectedProperty(null);
                  handleOpenEditModal(prop);
                }}
                className="text-casa-brand border-casa-brand/30 hover:bg-casa-brand-subtle text-xs flex items-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Property</span>
              </Button>
              {selectedProperty.status === 'PENDING_REVIEW' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(selectedProperty)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  >
                    Approve & Publish Live
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenRejectModal(selectedProperty)}
                    className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                  >
                    Reject Listing
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedProperty(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Listing Modal */}
      {rejectingProperty && (
        <Modal
          isOpen={!!rejectingProperty}
          onClose={() => setRejectingProperty(null)}
          title={`Reject Listing: ${rejectingProperty.title}`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-casa-text-secondary">
              Please specify the audit reason code for rejecting this property. The owner/agent will see this feedback to make corrections and resubmit.
            </p>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                Rejection Reason Code *
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
              >
                <option value="INSUFFICIENT_DOCS">INSUFFICIENT_DOCS — Missing ownership proof or approvals</option>
                <option value="PRICE_OUTLIER">PRICE_OUTLIER — Price unrealistic for locality benchmark</option>
                <option value="INCOMPLETE_ADDRESS">INCOMPLETE_ADDRESS — Missing house/plot number or pin</option>
                <option value="MISLEADING_IMAGES">MISLEADING_IMAGES — Low quality or stock watermarked images</option>
                <option value="RERA_NON_COMPLIANT">RERA_NON_COMPLIANT — Project requires valid RERA registration</option>
                <option value="DUPLICATE_LISTING">DUPLICATE_LISTING — Property already listed on platform</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                Moderation Remarks for Advertiser (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g., Please upload clear site photos and specify exact tower/flat number."
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-casa-border-light">
              <Button variant="outline" size="sm" onClick={() => setRejectingProperty(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isRejecting}
                onClick={handleConfirmReject}
                className="bg-red-600 hover:bg-red-700 text-white text-xs"
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add New Property Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Real Estate Listing (From PC Photos)"
      >
        <form onSubmit={handleCreateProperty} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="text-xs font-semibold text-casa-text-primary block mb-1">
              Property Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., 3 BHK Luxury Apartment in Gomti Nagar Ext."
              value={newProp.title}
              onChange={(e) => setNewProp({ ...newProp, title: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl focus:ring-2 focus:ring-casa-brand/30 text-casa-text-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                Category *
              </label>
              <select
                value={newProp.category}
                onChange={(e) => setNewProp({ ...newProp, category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
              >
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="House / Home">House / Home</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Flats">Flats</option>
                    <option value="Plotting Land">Plotting Land</option>
                    <option value="Small Land">Small Land</option>
                    <option value="Big Land">Big Land</option>
                    <option value="Shop">Shop</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Lease">Lease</option>
                    <option value="Litigated">Litigated</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                Listing Type *
              </label>
              <select
                value={newProp.listingType}
                onChange={(e) =>
                  setNewProp({ ...newProp, listingType: e.target.value as 'SALE' | 'RENT' | 'LEASE' })
                }
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
              >
                <option value="SALE">For Sale</option>
                <option value="RENT">For Rent</option>
                <option value="LEASE">For Lease</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                Price (INR ₹) *
              </label>
              <input
                type="number"
                required
                placeholder="e.g., 8500000"
                value={newProp.price}
                onChange={(e) => setNewProp({ ...newProp, price: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                City *
              </label>
              <input
                type="text"
                required
                value={newProp.city}
                onChange={(e) => setNewProp({ ...newProp, city: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-casa-text-primary block mb-1">
              Locality / Neighborhood *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Gomti Nagar Extension / Hazratganj"
              value={newProp.locality}
              onChange={(e) => setNewProp({ ...newProp, locality: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-casa-text-primary block mb-1">
                Bedrooms
              </label>
              <input
                type="number"
                value={newProp.bedrooms}
                onChange={(e) => setNewProp({ ...newProp, bedrooms: e.target.value })}
                className="w-full px-2 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-casa-text-primary block mb-1">
                Bathrooms
              </label>
              <input
                type="number"
                value={newProp.bathrooms}
                onChange={(e) => setNewProp({ ...newProp, bathrooms: e.target.value })}
                className="w-full px-2 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-casa-text-primary block mb-1">
                Area (Sq.Ft)
              </label>
              <input
                type="number"
                value={newProp.carpetAreaSqFt}
                onChange={(e) => setNewProp({ ...newProp, carpetAreaSqFt: e.target.value })}
                className="w-full px-2 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary"
              />
            </div>
          </div>

          {/* Media Selector: Photos & Video */}
          <div className="border border-casa-border-light rounded-xl overflow-hidden bg-casa-canvas/40">
            {/* Tab Header */}
            <div className="flex border-b border-casa-border-light bg-casa-subtle/50 text-xs">
              <button
                type="button"
                onClick={() => setMediaTab('PHOTOS')}
                className={`flex-1 py-2.5 px-3 font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  mediaTab === 'PHOTOS'
                    ? 'bg-casa-surface text-casa-brand border-b-2 border-casa-brand font-bold'
                    : 'text-casa-text-muted hover:text-casa-text-primary'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Photo Gallery ({uploadedImages.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaTab('VIDEO')}
                className={`flex-1 py-2.5 px-3 font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  mediaTab === 'VIDEO'
                    ? 'bg-casa-surface text-rose-600 border-b-2 border-rose-600 font-bold'
                    : 'text-casa-text-muted hover:text-casa-text-primary'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-rose-500" />
                <span>
                  Property Video {youtubeResult?.isValid || localVideoUrl ? '✓ (Active)' : '(Optional)'}
                </span>
              </button>
            </div>

            {/* Tab 1: Photos */}
            {mediaTab === 'PHOTOS' && (
              <div className="p-3 space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-casa-border-light hover:border-casa-brand rounded-xl p-4 text-center cursor-pointer bg-casa-canvas/50 transition-colors"
                >
                  <Upload className="w-6 h-6 text-casa-brand mx-auto mb-1" />
                  <div className="text-xs font-semibold text-casa-text-primary">
                    Click to browse photos from PC
                  </div>
                  <div className="text-[10px] text-casa-text-muted mt-0.5">
                    Supports JPG, PNG, WebP (Multiple selections)
                  </div>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {uploadedImages.map((imgSrc, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-casa-border-light h-16 bg-casa-subtle">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 p-0.5 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-0 left-0 right-0 bg-casa-brand/90 text-[8px] font-bold text-white text-center py-0.5">
                            Cover Photo
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Property Video */}
            {mediaTab === 'VIDEO' && (
              <div className="p-3 space-y-3">
                {/* Video Source Type Toggle */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVideoSourceType('YOUTUBE')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      videoSourceType === 'YOUTUBE'
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-300 dark:border-rose-800'
                        : 'bg-casa-canvas text-casa-text-muted border-casa-border-light'
                    }`}
                  >
                    YouTube Video URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSourceType('LOCAL')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      videoSourceType === 'LOCAL'
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-casa-brand border-blue-300 dark:border-blue-800'
                        : 'bg-casa-canvas text-casa-text-muted border-casa-border-light'
                    }`}
                  >
                    Upload Video from Device
                  </button>
                </div>

                {/* Option A: YouTube */}
                {videoSourceType === 'YOUTUBE' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-casa-text-primary block">
                      YouTube Video Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/..."
                        value={youtubeInput}
                        onChange={(e) => handleYouTubeChange(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl focus:ring-2 focus:ring-casa-brand/30 text-casa-text-primary"
                      />
                      {youtubeInput && (
                        <button
                          type="button"
                          onClick={removeVideo}
                          className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg border border-red-200"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {youtubeResult?.error && (
                      <div className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{youtubeResult.error}</span>
                      </div>
                    )}

                    {youtubeResult?.isValid && youtubeResult.embedUrl && (
                      <div className="space-y-2 mt-2">
                        <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>YouTube Video Verified — Live Preview</span>
                        </div>
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-casa-border-light bg-black">
                          <iframe
                            src={youtubeResult.embedUrl}
                            title="Video Preview"
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Option B: Local Video File */}
                {videoSourceType === 'LOCAL' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-casa-text-primary block">
                      Local Video File (MP4, WebM, MOV &bull; Max 50MB)
                    </label>
                    <input
                      type="file"
                      ref={videoFileInputRef}
                      onChange={handleVideoFileUpload}
                      accept="video/mp4,video/webm,video/quicktime,video/ogg"
                      className="hidden"
                    />

                    {!localVideoUrl ? (
                      <div
                        onClick={() => videoFileInputRef.current?.click()}
                        className="border-2 border-dashed border-casa-border-light hover:border-casa-brand rounded-xl p-4 text-center cursor-pointer bg-casa-canvas/50 transition-colors"
                      >
                        <Film className="w-6 h-6 text-casa-brand mx-auto mb-1" />
                        <div className="text-xs font-semibold text-casa-text-primary">
                          Click to select a video file from your device
                        </div>
                        <div className="text-[10px] text-casa-text-muted mt-0.5">
                          Supports MP4, WebM, QuickTime MOV up to 50MB
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-casa-surface border border-casa-border-light">
                          <div className="flex items-center gap-2 truncate">
                            <Film className="w-4 h-4 text-casa-brand flex-shrink-0" />
                            <span className="text-xs font-medium text-casa-text-primary truncate">
                              {localVideoName}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={removeVideo}
                            className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1"
                          >
                            Remove Video
                          </button>
                        </div>

                        {/* Local Video Preview */}
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-casa-border-light bg-black">
                          <video
                            src={localVideoUrl}
                            controls
                            playsInline
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}

                    {localVideoError && (
                      <div className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{localVideoError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Primary Media Mode Checkbox */}
                {(youtubeResult?.isValid || localVideoUrl) && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="primaryMediaVideo"
                      checked={primaryMediaType === 'VIDEO'}
                      onChange={(e) => setPrimaryMediaType(e.target.checked ? 'VIDEO' : 'IMAGE')}
                      className="w-4 h-4 rounded text-rose-600"
                    />
                    <label htmlFor="primaryMediaVideo" className="text-xs font-semibold text-rose-900 dark:text-rose-200 cursor-pointer">
                      Display Video as Primary Media instead of Cover Photo
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isFeaturedProp"
              checked={newProp.isFeatured}
              onChange={(e) => setNewProp({ ...newProp, isFeatured: e.target.checked })}
              className="w-4 h-4 rounded text-casa-brand"
            />
            <label htmlFor="isFeaturedProp" className="text-xs font-semibold text-casa-text-primary cursor-pointer">
              Mark as Featured Property (Top of Public Search)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-casa-border-light">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isSubmitting}
              className="bg-casa-brand hover:bg-casa-brand-hover text-white text-xs"
            >
              {isSubmitting ? 'Saving to Database...' : 'Publish Property Live'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Property Modal */}
      {isEditOpen && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setEditingProperty(null);
          }}
          title={`Edit Property: ${editProp.title || 'Listing Details'}`}
        >
          <form onSubmit={handleEditPropertySave} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                Property Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., 3 BHK Luxury Apartment in Gomti Nagar Ext."
                value={editProp.title}
                onChange={(e) => setEditProp({ ...editProp, title: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl focus:ring-2 focus:ring-casa-brand/30 text-casa-text-primary"
              />
            </div>

            {/* Category & Listing Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                  Category *
                </label>
                <select
                  value={editProp.category}
                  onChange={(e) => setEditProp({ ...editProp, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                >
                  {categories.length > 0 ? (
                    categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="House / Home">House / Home</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Flats">Flats</option>
                      <option value="Plotting Land">Plotting Land</option>
                      <option value="Small Land">Small Land</option>
                      <option value="Big Land">Big Land</option>
                      <option value="Shop">Shop</option>
                      <option value="Warehouse">Warehouse</option>
                      <option value="Lease">Lease</option>
                      <option value="Litigated">Litigated</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                  Listing Type *
                </label>
                <select
                  value={editProp.listingType}
                  onChange={(e) =>
                    setEditProp({ ...editProp, listingType: e.target.value as 'SALE' | 'RENT' | 'LEASE' })
                  }
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                >
                  <option value="SALE">For Sale</option>
                  <option value="RENT">For Rent</option>
                  <option value="LEASE">For Lease</option>
                </select>
              </div>
            </div>

            {/* Price & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                  Price (INR ₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g., 8500000"
                  value={editProp.price}
                  onChange={(e) => setEditProp({ ...editProp, price: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={editProp.city}
                  onChange={(e) => setEditProp({ ...editProp, city: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                />
              </div>
            </div>

            {/* Locality & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                  Locality / Neighborhood *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Gomti Nagar Extension, Sector 4"
                  value={editProp.locality}
                  onChange={(e) => setEditProp({ ...editProp, locality: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                  Lifecycle Status *
                </label>
                <select
                  value={editProp.status}
                  onChange={(e) => setEditProp({ ...editProp, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
                >
                  <option value="PUBLISHED">Published / Active</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="UNPUBLISHED">Unpublished</option>
                  <option value="ARCHIVED">Archived</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>
            </div>

            {/* Specifications */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                  Bedrooms (BHK)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editProp.bedrooms}
                  onChange={(e) => setEditProp({ ...editProp, bedrooms: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                  Bathrooms
                </label>
                <input
                  type="number"
                  min="0"
                  value={editProp.bathrooms}
                  onChange={(e) => setEditProp({ ...editProp, bathrooms: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                  Carpet Area (Sq.Ft)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editProp.carpetAreaSqFt}
                  onChange={(e) => setEditProp({ ...editProp, carpetAreaSqFt: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                />
              </div>
            </div>

            {/* Furnishing & Construction Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                  Furnishing Status
                </label>
                <select
                  value={editProp.furnishing}
                  onChange={(e) => setEditProp({ ...editProp, furnishing: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                >
                  <option value="FULLY_FURNISHED">Fully Furnished</option>
                  <option value="SEMI_FURNISHED">Semi Furnished</option>
                  <option value="UNFURNISHED">Unfurnished</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                  Construction Status
                </label>
                <select
                  value={editProp.constructionStatus}
                  onChange={(e) => setEditProp({ ...editProp, constructionStatus: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                >
                  <option value="READY_TO_MOVE">Ready to Move</option>
                  <option value="UNDER_CONSTRUCTION">Under Construction</option>
                  <option value="NEW_LAUNCH">New Launch</option>
                  <option value="RESALE">Resale</option>
                </select>
              </div>
            </div>

            {/* Advertiser Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                  Advertiser Name
                </label>
                <input
                  type="text"
                  value={editProp.advertiserName}
                  onChange={(e) => setEditProp({ ...editProp, advertiserName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                  Advertiser Phone
                </label>
                <input
                  type="text"
                  value={editProp.advertiserPhone}
                  onChange={(e) => setEditProp({ ...editProp, advertiserPhone: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Highlight key advantages, amenities, connectivity..."
                value={editProp.description}
                onChange={(e) => setEditProp({ ...editProp, description: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl focus:ring-2 focus:ring-casa-brand/30 text-casa-text-primary"
              />
            </div>

            {/* Media Manager (Photos & Video Tour) */}
            <div className="space-y-3 pt-2 border-t border-casa-border-light">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-casa-text-primary">
                  Property Media Gallery & Video Tour
                </span>
                <div className="flex items-center bg-casa-subtle rounded-xl p-1 gap-1 border border-casa-border-light">
                  <button
                    type="button"
                    onClick={() => setEditMediaTab('PHOTOS')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                      editMediaTab === 'PHOTOS'
                        ? 'bg-casa-surface text-casa-brand shadow-2xs'
                        : 'text-casa-text-muted hover:text-casa-text-primary'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Photos ({editUploadedImages.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMediaTab('VIDEO')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                      editMediaTab === 'VIDEO'
                        ? 'bg-casa-surface text-rose-600 shadow-2xs'
                        : 'text-casa-text-muted hover:text-casa-text-primary'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video Tour {editYoutubeResult?.isValid || editLocalVideoUrl ? '✓' : ''}</span>
                  </button>
                </div>
              </div>

              {/* Photos Tab */}
              {editMediaTab === 'PHOTOS' && (
                <div className="space-y-3">
                  <div
                    onClick={() => editFileInputRef.current?.click()}
                    className="border-2 border-dashed border-casa-border-light hover:border-casa-brand rounded-xl p-4 text-center cursor-pointer bg-casa-canvas/50 transition-colors"
                  >
                    <Upload className="w-6 h-6 text-casa-brand mx-auto mb-1" />
                    <div className="text-xs font-semibold text-casa-text-primary">
                      Upload Photos from your Device
                    </div>
                    <div className="text-[10px] text-casa-text-muted mt-0.5">
                      JPG, PNG, WebP supported. Multiple selection allowed.
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={editFileInputRef}
                    onChange={handleEditFileUpload}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />

                  {editUploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {editUploadedImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative h-20 rounded-lg overflow-hidden border border-casa-border-light group bg-casa-subtle"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeEditImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-600 text-white rounded-full transition-colors opacity-80 group-hover:opacity-100 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {idx === 0 && (
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-casa-brand text-white text-[9px] font-bold">
                              Cover
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Video Tab */}
              {editMediaTab === 'VIDEO' && (
                <div className="space-y-3 p-3 bg-casa-canvas rounded-xl border border-casa-border-light">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditVideoSourceType('YOUTUBE')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        editVideoSourceType === 'YOUTUBE'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-casa-surface text-casa-text-secondary border-casa-border-light'
                      }`}
                    >
                      YouTube Link (Recommended)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditVideoSourceType('LOCAL')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        editVideoSourceType === 'LOCAL'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-casa-surface text-casa-text-secondary border-casa-border-light'
                      }`}
                    >
                      Upload Video File (MP4/WebM)
                    </button>
                  </div>

                  {/* YouTube Source */}
                  {editVideoSourceType === 'YOUTUBE' && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-casa-text-primary block">
                        YouTube Video URL
                      </label>
                      <input
                        type="text"
                        placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                        value={editYoutubeInput}
                        onChange={(e) => handleEditYouTubeChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl focus:ring-2 focus:ring-rose-500/30 text-casa-text-primary font-mono"
                      />

                      {editYoutubeResult && !editYoutubeResult.isValid && editYoutubeResult.error && (
                        <div className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{editYoutubeResult.error}</span>
                        </div>
                      )}

                      {editYoutubeResult?.isValid && editYoutubeResult.embedUrl && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Valid YouTube Link Detected (ID: {editYoutubeResult.videoId})
                            </span>
                            <button
                              type="button"
                              onClick={removeEditVideo}
                              className="text-red-600 hover:text-red-700 text-xs font-semibold"
                            >
                              Remove Video
                            </button>
                          </div>
                          <div className="relative aspect-video rounded-xl overflow-hidden border border-casa-border-light bg-black">
                            <iframe
                              src={editYoutubeResult.embedUrl}
                              title="Video Preview"
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Local Video Source */}
                  {editVideoSourceType === 'LOCAL' && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-casa-text-primary block">
                        Local Video File (MP4, WebM, MOV &bull; Max 50MB)
                      </label>
                      <input
                        type="file"
                        ref={editVideoFileInputRef}
                        onChange={handleEditVideoFileUpload}
                        accept="video/mp4,video/webm,video/quicktime,video/ogg"
                        className="hidden"
                      />

                      {!editLocalVideoUrl ? (
                        <div
                          onClick={() => editVideoFileInputRef.current?.click()}
                          className="border-2 border-dashed border-casa-border-light hover:border-casa-brand rounded-xl p-4 text-center cursor-pointer bg-casa-canvas/50 transition-colors"
                        >
                          <Film className="w-6 h-6 text-casa-brand mx-auto mb-1" />
                          <div className="text-xs font-semibold text-casa-text-primary">
                            Click to select a video file from your device
                          </div>
                          <div className="text-[10px] text-casa-text-muted mt-0.5">
                            Supports MP4, WebM, QuickTime MOV up to 50MB
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 rounded-lg bg-casa-surface border border-casa-border-light">
                            <div className="flex items-center gap-2 truncate">
                              <Film className="w-4 h-4 text-casa-brand flex-shrink-0" />
                              <span className="text-xs font-medium text-casa-text-primary truncate">
                                {editLocalVideoName}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={removeEditVideo}
                              className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1"
                            >
                              Remove Video
                            </button>
                          </div>

                          <div className="relative aspect-video rounded-xl overflow-hidden border border-casa-border-light bg-black">
                            <video
                              src={editLocalVideoUrl}
                              controls
                              playsInline
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      )}

                      {editLocalVideoError && (
                        <div className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400 mt-1">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{editLocalVideoError}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Primary Media Mode Checkbox */}
                  {(editYoutubeResult?.isValid || editLocalVideoUrl) && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="editPrimaryMediaVideo"
                        checked={editPrimaryMediaType === 'VIDEO'}
                        onChange={(e) => setEditPrimaryMediaType(e.target.checked ? 'VIDEO' : 'IMAGE')}
                        className="w-4 h-4 rounded text-rose-600"
                      />
                      <label htmlFor="editPrimaryMediaVideo" className="text-xs font-semibold text-rose-900 dark:text-rose-200 cursor-pointer">
                        Display Video as Primary Media instead of Cover Photo
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Featured Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="editIsFeaturedProp"
                checked={editProp.isFeatured}
                onChange={(e) => setEditProp({ ...editProp, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded text-casa-brand"
              />
              <label htmlFor="editIsFeaturedProp" className="text-xs font-semibold text-casa-text-primary cursor-pointer">
                Mark as Featured Property (Top of Public Search)
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-casa-border-light">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingProperty(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isEditSubmitting}
                className="bg-casa-brand hover:bg-casa-brand-hover text-white text-xs"
              >
                {isEditSubmitting ? 'Saving Changes...' : 'Save & Update in MongoDB Atlas'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
