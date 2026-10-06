'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import {
  getMyPropertyById,
  updateProperty,
  submitPropertyForApproval,
} from '@/services/property-service';
import { Property } from '@/types';
import {
  ArrowLeft,
  Save,
  Send,
  Upload,
  X,
  AlertCircle,
  RefreshCw,
  Building,
  Check,
} from 'lucide-react';

const CANONICAL_CATEGORIES = [
  'House / Home',
  'Apartment',
  'Flats',
  'Plotting Land',
  'Small Land',
  'Big Land',
  'Shop',
  'Warehouse',
  'Lease',
  'Litigated',
];

const STANDARD_AMENITIES = [
  '24/7 Gated Security & CCTV',
  '100% Power Backup',
  'Private Landscaped Garden',
  'Covered Car Parking',
  'Swimming Pool & Jacuzzi',
  'Modern Gymnasium',
  'High-Speed Elevators',
  'Solar Water Heating',
  'Clubhouse & Community Hall',
  'Children Play Zone',
  'Intercom Facility',
  'Rainwater Harvesting',
  'Fire Fighting Systems',
  'Broadband / Wi-Fi Ready',
  'Water Storage & Borewell',
];

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [property, setProperty] = React.useState<Property | null>(null);

  const [formData, setFormData] = React.useState({
    titleEn: '',
    category: 'House / Home',
    listingType: 'SALE' as 'SALE' | 'RENT' | 'LEASE',
    descriptionEn: '',
    bedrooms: '3',
    bathrooms: '3',
    area: '1800',
    areaUnit: 'SQ_FT',
    carpetArea: '1600',
    furnishing: 'SEMI_FURNISHED',
    facing: 'East',
    parking: '1 Covered',
    floorLevel: '1st Floor',
    totalFloors: '4',
    constructionStatus: 'READY_TO_MOVE',
    propertyAge: '0-1 years',
    priceAmount: '',
    currency: 'INR',
    priceUnit: 'TOTAL',
    isNegotiable: true,
    maintenance: '',
    securityDeposit: '',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    city: 'Lucknow',
    locality: '',
    landmark: '',
    pincode: '226010',
    amenities: [] as string[],
    uploadedImages: [] as string[],
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadProperty = React.useCallback(async () => {
    if (!id || !isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await getMyPropertyById(id);
      setProperty(data);
      const titleStr = typeof data.title === 'string' ? data.title : data.title?.en || '';
      const descStr = typeof data.description === 'string' ? data.description : data.description?.en || '';
      const priceNum = typeof data.price === 'number' ? data.price : data.price?.amount || 0;

      setFormData({
        titleEn: titleStr,
        category: data.category || 'House / Home',
        listingType: (data.listingType as 'SALE' | 'RENT' | 'LEASE') || 'SALE',
        descriptionEn: descStr,
        bedrooms: String(data.specs?.bedrooms || '3'),
        bathrooms: String(data.specs?.bathrooms || '3'),
        area: String(data.specs?.area || data.specs?.carpetAreaSqFt || '1800'),
        areaUnit: data.specs?.areaUnit || 'SQ_FT',
        carpetArea: String(data.specs?.carpetArea || '1600'),
        furnishing: data.specs?.furnishing || 'SEMI_FURNISHED',
        facing: data.specs?.facing || 'East',
        parking: data.specs?.parking || '1 Covered',
        floorLevel: data.specs?.floorLevel || data.specs?.floorNumber || '1st Floor',
        totalFloors: String(data.specs?.totalFloors || '4'),
        constructionStatus: data.specs?.constructionStatus || 'READY_TO_MOVE',
        propertyAge: data.specs?.propertyAge || '0-1 years',
        priceAmount: String(priceNum),
        currency: (typeof data.price === 'object' && data.price?.currency) || 'INR',
        priceUnit: (typeof data.price === 'object' && data.price?.priceUnit) || 'TOTAL',
        isNegotiable: typeof data.price === 'object' ? !!data.price?.isNegotiable : true,
        maintenance: String((typeof data.price === 'object' && data.price?.maintenance) || ''),
        securityDeposit: String((typeof data.price === 'object' && data.price?.securityDeposit) || ''),
        state: (typeof data.location === 'object' && data.location?.state) || 'Uttar Pradesh',
        district: (typeof data.location === 'object' && data.location?.district) || 'Lucknow',
        city: (typeof data.location === 'object' && data.location?.city) || 'Lucknow',
        locality: (typeof data.location === 'object' && data.location?.locality) || (typeof data.location === 'string' ? data.location : ''),
        landmark: (typeof data.location === 'object' && data.location?.landmark) || '',
        pincode: (typeof data.location === 'object' && data.location?.pincode) || '226010',
        amenities: data.amenities || [],
        uploadedImages: data.media?.images || (data.media?.thumbnailUrl ? [data.media.thumbnailUrl] : []),
      });
    } catch {
      toast.error('Not Found', 'Could not load property for editing.');
      router.push('/dashboard/properties');
    } finally {
      setIsLoading(false);
    }
  }, [id, isAuthenticated, router, toast]);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadProperty();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading, loadProperty]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.warning('Invalid File', 'Please select image files (JPG, PNG, WebP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            uploadedImages: [...prev.uploadedImages, event.target!.result as string],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      uploadedImages: prev.uploadedImages.filter((_, i) => i !== index),
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const buildPayload = () => {
    const primaryImg =
      formData.uploadedImages.length > 0
        ? formData.uploadedImages[0]
        : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

    return {
      title: { en: formData.titleEn },
      description: { en: formData.descriptionEn },
      category: formData.category,
      listingType: formData.listingType,
      price: {
        amount: Number(formData.priceAmount) || 0,
        currency: formData.currency,
        priceUnit: formData.priceUnit,
        isNegotiable: formData.isNegotiable,
        maintenance: Number(formData.maintenance) || 0,
        securityDeposit: Number(formData.securityDeposit) || 0,
      },
      location: {
        state: formData.state,
        district: formData.district,
        city: formData.city,
        locality: formData.locality,
        landmark: formData.landmark || undefined,
        pincode: formData.pincode || undefined,
      },
      specs: {
        bedrooms: Number(formData.bedrooms) || undefined,
        bathrooms: Number(formData.bathrooms) || undefined,
        area: Number(formData.area) || undefined,
        areaUnit: formData.areaUnit,
        carpetArea: Number(formData.carpetArea) || undefined,
        carpetAreaSqFt: Number(formData.area) || undefined,
        furnishing: formData.furnishing,
        facing: formData.facing,
        parking: formData.parking,
        floorLevel: formData.floorLevel,
        totalFloors: Number(formData.totalFloors) || undefined,
        constructionStatus: formData.constructionStatus,
        propertyAge: formData.propertyAge,
      },
      amenities: formData.amenities,
      media: {
        thumbnailUrl: primaryImg,
        coverImage: primaryImg,
        images: formData.uploadedImages.length > 0 ? formData.uploadedImages : [primaryImg],
      },
    };
  };

  const handleSave = async () => {
    if (!formData.titleEn.trim() || !formData.locality.trim() || !formData.priceAmount) {
      toast.warning('Validation Error', 'Please complete title, locality, and price.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      await updateProperty(id, payload);
      toast.success('Listing Updated', 'Property changes saved successfully.');
      router.push('/dashboard/properties');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      toast.error('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndSubmit = async () => {
    if (!formData.titleEn.trim() || !formData.locality.trim() || !formData.priceAmount) {
      toast.warning('Validation Error', 'Please complete title, locality, and price.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      await updateProperty(id, payload);
      await submitPropertyForApproval(id);
      toast.success('Listing Resubmitted', 'Property has been submitted for CASA review.');
      router.push('/dashboard/properties');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Resubmission failed';
      toast.error('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated && !isAuthLoading) {
    return (
      <div className="min-h-[70vh] max-w-lg mx-auto px-4 flex items-center justify-center">
        <div className="text-center p-8 bg-casa-surface border border-casa-border-light rounded-2xl shadow-subtle space-y-4">
          <Building className="w-10 h-10 text-casa-brand mx-auto" />
          <h2 className="text-xl font-bold text-casa-text-primary">Sign In to Edit</h2>
          <button
            type="button"
            onClick={openAuthModal}
            className="w-full py-2.5 px-4 rounded-xl bg-casa-brand hover:bg-casa-brand-hover text-white text-xs font-semibold"
          >
            Sign In with Mobile OTP
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-casa-brand mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-casa-border-light">
        <div>
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-1 text-xs text-casa-brand hover:underline font-semibold mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Properties</span>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
            Edit Property Listing
          </h1>
          <p className="text-xs text-casa-text-secondary">
            Reference ID: <span className="font-mono font-bold text-casa-brand">{property?.referenceId || property?.id}</span> • Status: <span className="font-bold">{property?.status}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-casa-text-primary border border-casa-border-light bg-casa-surface hover:bg-casa-canvas rounded-xl transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>

          {(property?.status === 'DRAFT' || property?.status === 'REJECTED') && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveAndSubmit}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-casa-brand hover:bg-casa-brand-hover rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Save & Submit</span>
            </button>
          )}
        </div>
      </div>

      {/* Rejection Alert */}
      {property?.status === 'REJECTED' && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-xs space-y-1 text-red-700 dark:text-red-300">
          <div className="font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>This Listing Was Rejected by CASA Moderation</span>
          </div>
          <p className="text-[11px]">
            Reason: <strong>{property.moderation?.rejectionReason || 'INSUFFICIENT_DOCS'}</strong>
            {property.moderation?.adminRemark && ` — ${property.moderation.adminRemark}`}
          </p>
          <p className="text-[10px] text-red-600 dark:text-red-400 mt-1">
            Please make the necessary edits below and click &quot;Save &amp; Submit&quot; to resubmit for review.
          </p>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-casa-surface border border-casa-border-light rounded-2xl p-6 sm:p-8 shadow-subtle space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-casa-text-primary border-b border-casa-border-light pb-2">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
              >
                {CANONICAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">Listing Type *</label>
              <select
                value={formData.listingType}
                onChange={(e) =>
                  setFormData({ ...formData, listingType: e.target.value as 'SALE' | 'RENT' | 'LEASE' })
                }
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
              >
                <option value="SALE">For Sale</option>
                <option value="RENT">For Rent</option>
                <option value="LEASE">For Lease</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-casa-text-primary block mb-1">Property Title *</label>
            <input
              type="text"
              required
              value={formData.titleEn}
              onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-casa-text-primary block mb-1">Description *</label>
            <textarea
              rows={4}
              required
              value={formData.descriptionEn}
              onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
            />
          </div>
        </div>

        {/* Pricing & Location */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-casa-text-primary border-b border-casa-border-light pb-2">
            Pricing &amp; Location
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">Price (INR ₹) *</label>
              <input
                type="number"
                required
                value={formData.priceAmount}
                onChange={(e) => setFormData({ ...formData, priceAmount: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">Locality *</label>
              <input
                type="text"
                required
                value={formData.locality}
                onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
              />
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-casa-text-primary border-b border-casa-border-light pb-2">
            Property Photos
          </h3>

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
            <Upload className="w-5 h-5 text-casa-brand mx-auto mb-1" />
            <div className="text-xs font-semibold text-casa-text-primary">Add More Photos from PC</div>
          </div>

          {formData.uploadedImages.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {formData.uploadedImages.map((src, idx) => (
                <div key={idx} className="relative group rounded-lg overflow-hidden border border-casa-border-light h-16 bg-casa-subtle">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-casa-brand text-[8px] font-bold text-white text-center py-0.5">
                      Cover
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Amenities */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-casa-text-primary border-b border-casa-border-light pb-2">
            Amenities
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STANDARD_AMENITIES.map((amenity) => {
              const isSelected = formData.amenities.includes(amenity);
              return (
                <button
                  type="button"
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-left text-[11px] transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-casa-brand-subtle border-casa-brand text-casa-brand font-semibold'
                      : 'bg-casa-canvas border-casa-border-light text-casa-text-secondary'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                      isSelected ? 'bg-casa-brand border-casa-brand text-white' : 'border-casa-border-light'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <span className="truncate">{amenity}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Controls */}
        <div className="flex justify-end gap-3 pt-4 border-t border-casa-border-light">
          <Link
            href="/dashboard/properties"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary border border-casa-border-light"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-casa-text-primary bg-casa-surface border border-casa-border-light hover:bg-casa-canvas"
          >
            Save Changes
          </button>
          {(property?.status === 'DRAFT' || property?.status === 'REJECTED') && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveAndSubmit}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-casa-brand hover:bg-casa-brand-hover shadow-2xs"
            >
              Save &amp; Submit for Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
