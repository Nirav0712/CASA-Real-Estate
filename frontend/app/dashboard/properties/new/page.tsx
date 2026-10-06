'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { createProperty, submitPropertyForApproval } from '@/services/property-service';
import { fetchLocationAutocomplete, fetchLocations } from '@/services/location-service';
import { formatPrice } from '@/lib/utils';
import {
  Home,
  ArrowRight,
  ArrowLeft,
  Save,
  Send,
  Upload,
  X,
  MapPin,
  Building,
  ShieldCheck,
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

export default function NewPropertyWizardPage() {
  const { isAuthenticated, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [currentStep, setCurrentStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Wizard Form State
  const [formData, setFormData] = React.useState({
    // Step 1: Basic
    titleEn: '',
    category: 'House / Home',
    listingType: 'SALE' as 'SALE' | 'RENT' | 'LEASE',
    descriptionEn: '',

    // Step 2: Specs
    bedrooms: '3',
    bathrooms: '3',
    area: '1800',
    areaUnit: 'SQ_FT',
    carpetArea: '1600',
    furnishing: 'SEMI_FURNISHED',
    facing: 'East',
    parking: '1 Covered, 1 Open',
    floorLevel: '1st Floor',
    totalFloors: '4',
    constructionStatus: 'READY_TO_MOVE',
    propertyAge: '0-1 years',

    // Step 3: Pricing
    priceAmount: '',
    currency: 'INR',
    priceUnit: 'TOTAL',
    isNegotiable: true,
    maintenance: '',
    securityDeposit: '',
    rentPeriod: 'MONTHLY',

    // Step 4: Location
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    city: 'Lucknow',
    locality: '',
    landmark: '',
    pincode: '226010',

    // Step 5: Amenities
    amenities: ['24/7 Gated Security & CCTV', '100% Power Backup', 'Covered Car Parking'] as string[],

    // Step 6: Photos
    uploadedImages: [] as string[],
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // File Upload Handler
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

    toast.info('Photos Added', `${files.length} image(s) loaded.`);
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

  // Step Validation
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.titleEn.trim()) {
        toast.warning('Title Required', 'Please enter a title for your property listing.');
        return false;
      }
      if (!formData.descriptionEn.trim()) {
        toast.warning('Description Required', 'Please enter a description for your listing.');
        return false;
      }
    }
    if (step === 3) {
      if (!formData.priceAmount || Number(formData.priceAmount) <= 0) {
        toast.warning('Price Required', 'Please enter a valid price/rent amount.');
        return false;
      }
    }
    if (step === 4) {
      if (!formData.locality.trim()) {
        toast.warning('Locality Required', 'Please enter the locality/neighborhood.');
        return false;
      }
    }
    if (step === 6) {
      if (formData.uploadedImages.length === 0) {
        toast.warning('Photo Required', 'Please upload at least one image from your computer.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 8));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Build Payload
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
        rentPeriod: formData.listingType === 'RENT' ? formData.rentPeriod : undefined,
      },
      location: {
        state: formData.state,
        district: formData.district,
        city: formData.city,
        locality: formData.locality,
        landmark: formData.landmark || undefined,
        pincode: formData.pincode || undefined,
        coordinates: [80.9462, 26.8467],
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
        videos: [],
      },
      status: 'DRAFT',
    };
  };

  const handleSaveDraft = async () => {
    if (!validateStep(1)) return;
    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      await createProperty(payload);
      toast.success('Draft Saved', `"${formData.titleEn}" saved to database.`);
      router.push('/dashboard/properties');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save draft';
      toast.error('Draft Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!validateStep(1) || !validateStep(3) || !validateStep(4) || !validateStep(6)) return;
    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      const created = await createProperty(payload);
      await submitPropertyForApproval(created.id);
      toast.success(
        'Listing Submitted',
        'Your property has been submitted for CASA review and moderation.',
      );
      router.push('/dashboard/properties');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit property';
      toast.error('Submission Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated && !isAuthLoading) {
    return (
      <div className="min-h-[70vh] max-w-lg mx-auto px-4 flex items-center justify-center">
        <div className="text-center p-8 bg-casa-surface border border-casa-border-light rounded-2xl shadow-subtle space-y-4">
          <div className="w-12 h-12 rounded-full bg-casa-brand-subtle flex items-center justify-center text-casa-brand mx-auto">
            <Building className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-casa-text-primary">Sign In to Post a Property</h2>
          <p className="text-xs text-casa-text-secondary">
            You must be logged in as an Agent or Property Owner to access the 8-step listing wizard.
          </p>
          <button
            type="button"
            onClick={openAuthModal}
            className="w-full py-2.5 px-4 rounded-xl bg-casa-brand hover:bg-casa-brand-hover text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            Sign In with Mobile OTP
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
            Post New Real Estate Listing
          </h1>
          <p className="text-xs text-casa-text-secondary">
            Step-by-step verified listing creation engine for CASA Marketplace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary bg-casa-surface border border-casa-border-light rounded-xl transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-casa-surface border border-casa-border-light rounded-2xl p-4 shadow-subtle">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center text-[10px]">
          {[
            { step: 1, label: 'Basic Info' },
            { step: 2, label: 'Specs' },
            { step: 3, label: 'Pricing' },
            { step: 4, label: 'Location' },
            { step: 5, label: 'Amenities' },
            { step: 6, label: 'Photos' },
            { step: 7, label: 'Preview' },
            { step: 8, label: 'Submit' },
          ].map((item) => {
            const isDone = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            return (
              <button
                type="button"
                key={item.step}
                onClick={() => item.step < currentStep && setCurrentStep(item.step)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                  isCurrent
                    ? 'bg-casa-brand-subtle text-casa-brand font-bold'
                    : isDone
                    ? 'text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer'
                    : 'text-casa-text-muted opacity-60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-casa-brand text-white'
                      : isDone
                      ? 'bg-emerald-500 text-white'
                      : 'bg-casa-subtle text-casa-text-muted'
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3" /> : item.step}
                </div>
                <span className="truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wizard Content Card */}
      <div className="bg-casa-surface border border-casa-border-light rounded-2xl p-6 sm:p-8 shadow-subtle">
        {/* STEP 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="border-b border-casa-border-light pb-3">
              <h2 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-casa-brand text-white text-xs flex items-center justify-center">1</span>
                <span>Basic Property Information</span>
              </h2>
              <p className="text-xs text-casa-text-secondary mt-0.5">
                Select canonical category, listing type, and provide clear descriptive details.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  Property Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
                >
                  {CANONICAL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  Listing Type *
                </label>
                <select
                  value={formData.listingType}
                  onChange={(e) =>
                    setFormData({ ...formData, listingType: e.target.value as 'SALE' | 'RENT' | 'LEASE' })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
                >
                  <option value="SALE">For Sale</option>
                  <option value="RENT">For Rent</option>
                  <option value="LEASE">For Commercial Lease</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                Property Title (English) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Luxury 4 BHK Contemporary Villa with Private Garden"
                value={formData.titleEn}
                onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl focus:ring-2 focus:ring-casa-brand/30 text-casa-text-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                Detailed Description (English) *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Describe key architectural features, connectivity, society amenities, and nearby landmarks..."
                value={formData.descriptionEn}
                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl focus:ring-2 focus:ring-casa-brand/30 text-casa-text-primary leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Specifications */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="border-b border-casa-border-light pb-3">
              <h2 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-casa-brand text-white text-xs flex items-center justify-center">2</span>
                <span>Property Specifications & Dimensions</span>
              </h2>
              <p className="text-xs text-casa-text-secondary mt-0.5">
                Accurate floor area, bedrooms, bathrooms, furnishing, and orientation.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Bedrooms</label>
                <input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Bathrooms</label>
                <input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Super Area</label>
                <input
                  type="number"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Area Unit</label>
                <select
                  value={formData.areaUnit}
                  onChange={(e) => setFormData({ ...formData, areaUnit: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                >
                  <option value="SQ_FT">Sq.Ft</option>
                  <option value="SQ_YARDS">Sq.Yards</option>
                  <option value="ACRES">Acres</option>
                  <option value="BIGHAS">Bighas</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Carpet Area</label>
                <input
                  type="number"
                  value={formData.carpetArea}
                  onChange={(e) => setFormData({ ...formData, carpetArea: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Furnishing</label>
                <select
                  value={formData.furnishing}
                  onChange={(e) => setFormData({ ...formData, furnishing: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                >
                  <option value="FULLY_FURNISHED">Fully Furnished</option>
                  <option value="SEMI_FURNISHED">Semi Furnished</option>
                  <option value="UNFURNISHED">Unfurnished</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Facing Direction</label>
                <select
                  value={formData.facing}
                  onChange={(e) => setFormData({ ...formData, facing: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                >
                  <option value="North">North</option>
                  <option value="East">East</option>
                  <option value="North-East">North-East</option>
                  <option value="West">West</option>
                  <option value="South">South</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Construction Status</label>
                <select
                  value={formData.constructionStatus}
                  onChange={(e) => setFormData({ ...formData, constructionStatus: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                >
                  <option value="READY_TO_MOVE">Ready to Move</option>
                  <option value="UNDER_CONSTRUCTION">Under Construction</option>
                  <option value="RESALE">Resale</option>
                  <option value="NEW_LAUNCH">New Launch</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Floor Level</label>
                <input
                  type="text"
                  placeholder="e.g., 3rd Floor / G+2"
                  value={formData.floorLevel}
                  onChange={(e) => setFormData({ ...formData, floorLevel: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Parking Slots</label>
                <input
                  type="text"
                  placeholder="e.g., 1 Covered, 1 Open"
                  value={formData.parking}
                  onChange={(e) => setFormData({ ...formData, parking: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Pricing */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="border-b border-casa-border-light pb-3">
              <h2 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-casa-brand text-white text-xs flex items-center justify-center">3</span>
                <span>Pricing & Financial Terms</span>
              </h2>
              <p className="text-xs text-casa-text-secondary mt-0.5">
                Set total price or rent, negotiable status, maintenance charges, and security deposit.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  {formData.listingType === 'SALE' ? 'Total Price (INR ₹) *' : 'Rent Amount per Month (INR ₹) *'}
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g., 8500000"
                  value={formData.priceAmount}
                  onChange={(e) => setFormData({ ...formData, priceAmount: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-bold"
                />
                {formData.priceAmount && (
                  <p className="text-[11px] text-casa-brand font-bold mt-1">
                    Display: {formatPrice(Number(formData.priceAmount))}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  Monthly Maintenance (INR ₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 3500"
                  value={formData.maintenance}
                  onChange={(e) => setFormData({ ...formData, maintenance: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                />
              </div>
            </div>

            {formData.listingType !== 'SALE' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                    Security Deposit (INR ₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 150000"
                    value={formData.securityDeposit}
                    onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                    Rent Payment Period
                  </label>
                  <select
                    value={formData.rentPeriod}
                    onChange={(e) => setFormData({ ...formData, rentPeriod: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isNeg"
                checked={formData.isNegotiable}
                onChange={(e) => setFormData({ ...formData, isNegotiable: e.target.checked })}
                className="w-4 h-4 rounded text-casa-brand"
              />
              <label htmlFor="isNeg" className="text-xs font-semibold text-casa-text-primary cursor-pointer">
                Price is negotiable upon direct inquiry
              </label>
            </div>
          </div>
        )}

        {/* STEP 4: Location */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="border-b border-casa-border-light pb-3">
              <h2 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-casa-brand text-white text-xs flex items-center justify-center">4</span>
                <span>Geographic Location</span>
              </h2>
              <p className="text-xs text-casa-text-secondary mt-0.5">
                Accurate city, locality, and landmark for buyer discovery.
              </p>
            </div>

            {/* Smart Location Search Helper */}
            <div className="p-3 bg-casa-subtle/60 border border-casa-border-light rounded-xl space-y-1.5">
              <label className="text-xs font-semibold text-casa-brand flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Quick Location Lookup (Auto-fills City, State, Pincode)
              </label>
              <input
                type="text"
                placeholder="Type your locality or micro-market (e.g. Satellite, Gomti Nagar, Bandra)..."
                onChange={async (e) => {
                  const val = e.target.value;
                  if (val.length >= 2) {
                    try {
                      const res = await fetchLocationAutocomplete(val);
                      if (res && res.length > 0) {
                        const top = res[0];
                        setFormData((prev) => ({
                          ...prev,
                          locality: top.name,
                          city: top.city || prev.city,
                          state: top.state || prev.state,
                          pincode: top.pincode || prev.pincode,
                        }));
                      }
                    } catch (_) {}
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-lg text-casa-text-primary focus:outline-none focus:border-casa-brand"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  Locality / Neighborhood *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Gomti Nagar Extension / Hazratganj"
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Near Lulu Mall / Ekana Stadium"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  Postal Pincode
                </label>
                <input
                  type="text"
                  placeholder="e.g., 226010"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Amenities */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div className="border-b border-casa-border-light pb-3">
              <h2 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-casa-brand text-white text-xs flex items-center justify-center">5</span>
                <span>Select Society Amenities</span>
              </h2>
              <p className="text-xs text-casa-text-secondary mt-0.5">
                Highlight key lifestyle and security amenities to attract premium purchasers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {STANDARD_AMENITIES.map((amenity) => {
                const isSelected = formData.amenities.includes(amenity);
                return (
                  <button
                    type="button"
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-casa-brand-subtle border-casa-brand text-casa-brand font-semibold shadow-2xs'
                        : 'bg-casa-canvas border-casa-border-light text-casa-text-secondary hover:border-casa-border-dark'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isSelected ? 'bg-casa-brand border-casa-brand text-white' : 'border-casa-border-light'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <span className="truncate">{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 6: Photos & Media */}
        {currentStep === 6 && (
          <div className="space-y-5">
            <div className="border-b border-casa-border-light pb-3">
              <h2 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-casa-brand text-white text-xs flex items-center justify-center">6</span>
                <span>Upload Photos from PC</span>
              </h2>
              <p className="text-xs text-casa-text-secondary mt-0.5">
                Upload clear high-resolution property images directly from your computer. First photo becomes the cover.
              </p>
            </div>

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
              className="border-2 border-dashed border-casa-border-light hover:border-casa-brand rounded-2xl p-8 text-center cursor-pointer bg-casa-canvas/50 transition-colors space-y-2"
            >
              <div className="w-12 h-12 rounded-full bg-casa-brand-subtle flex items-center justify-center text-casa-brand mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <div className="font-bold text-xs text-casa-text-primary">
                Click to browse images from your Computer
              </div>
              <div className="text-[11px] text-casa-text-muted">
                Supports JPG, PNG, WebP (You can select multiple photos)
              </div>
            </div>

            {formData.uploadedImages.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-casa-text-primary block">
                  Uploaded Gallery ({formData.uploadedImages.length} photos)
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {formData.uploadedImages.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-casa-border-light h-20 bg-casa-subtle"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 bg-casa-brand text-[8px] font-bold text-white text-center py-0.5">
                          Cover Photo
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 7: Live Marketplace Preview */}
        {currentStep === 7 && (
          <div className="space-y-5">
            <div className="border-b border-casa-border-light pb-3">
              <h2 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-casa-brand text-white text-xs flex items-center justify-center">7</span>
                <span>Live Marketplace Listing Preview</span>
              </h2>
              <p className="text-xs text-casa-text-secondary mt-0.5">
                Review how your listing appears to potential buyers on CASA Marketplace.
              </p>
            </div>

            <div className="max-w-md mx-auto bg-casa-canvas border border-casa-border-light rounded-2xl overflow-hidden shadow-subtle space-y-3">
              <div className="relative h-48 bg-casa-subtle">
                {formData.uploadedImages.length > 0 ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={formData.uploadedImages[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-casa-text-muted">
                    <Home className="w-12 h-12 opacity-30" />
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-casa-brand text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                  {formData.category} • {formData.listingType}
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-casa-brand">
                    {formatPrice(Number(formData.priceAmount) || 0)}
                  </span>
                  <span className="text-[11px] text-casa-text-muted">
                    {formData.isNegotiable ? 'Negotiable' : 'Fixed Price'}
                  </span>
                </div>

                <h3 className="font-bold text-xs text-casa-text-primary line-clamp-2">
                  {formData.titleEn || 'Untitled Property'}
                </h3>

                <div className="flex items-center gap-1 text-[11px] text-casa-text-muted">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{formData.locality || 'Locality'}, {formData.city}</span>
                </div>

                <div className="pt-2 border-t border-casa-border-light grid grid-cols-3 gap-1 text-[10px] text-center text-casa-text-secondary">
                  <div className="p-1 bg-casa-surface rounded">
                    {formData.bedrooms} BHK
                  </div>
                  <div className="p-1 bg-casa-surface rounded">
                    {formData.area} {formData.areaUnit}
                  </div>
                  <div className="p-1 bg-casa-surface rounded truncate">
                    {formData.furnishing}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: Submission Confirmation */}
        {currentStep === 8 && (
          <div className="space-y-6 text-center py-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-casa-text-primary">Ready for CASA Moderation</h2>
              <p className="text-xs text-casa-text-secondary leading-relaxed">
                Your listing details and PC photos have been validated. Submit now to send to CASA admin review, or save as a draft to edit later.
              </p>
            </div>

            <div className="p-4 bg-casa-canvas rounded-2xl border border-casa-border-light text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-casa-text-muted">Title:</span>
                <span className="font-semibold text-casa-text-primary max-w-[240px] truncate">{formData.titleEn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-casa-text-muted">Category:</span>
                <span className="font-semibold text-casa-text-primary">{formData.category} ({formData.listingType})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-casa-text-muted">Price:</span>
                <span className="font-bold text-casa-brand">{formatPrice(Number(formData.priceAmount) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-casa-text-muted">Photos:</span>
                <span className="font-semibold text-casa-text-primary">{formData.uploadedImages.length} loaded</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveDraft}
                className="px-5 py-2.5 rounded-xl border border-casa-border-light text-casa-text-primary text-xs font-semibold hover:bg-casa-canvas transition-colors cursor-pointer"
              >
                Save as Draft Only
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitForReview}
                className="px-6 py-2.5 rounded-xl bg-casa-brand hover:bg-casa-brand-hover text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting to Review...' : 'Submit for CASA Review'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Stepper Controls */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-casa-border-light">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary border border-casa-border-light bg-casa-canvas transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 8 && (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-casa-brand hover:bg-casa-brand-hover transition-colors shadow-2xs cursor-pointer"
            >
              <span>Continue to Step {currentStep + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
