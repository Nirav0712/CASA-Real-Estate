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
  CATEGORY_GROUPS,
  LISTING_TYPES,
  RERA_AUTHORITIES,
  RERA_EXEMPTION_REASONS,
  getCategoryFieldVisibility,
  validateReraNumber,
} from '@/lib/property-categories';
import { ContactNumbersManager, normalizeContactNumbers } from '@/components/property/contact-numbers-manager';
import { PropertyUnitsManager } from '@/components/property/property-units-manager';
import { PropertyVideoManager } from '@/components/property/property-video-manager';
import {
  PropertyStructureType,
  PropertyUnitDetails,
  ProjectBuildingDetails,
  ContactNumber,
} from '@/types';
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
  ShieldCheck,
  MapPin,
  Sparkles,
} from 'lucide-react';

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

const PG_FACILITIES_OPTIONS = [
  'High-Speed Wi-Speed',
  'Daily Room Cleaning',
  'Air Conditioning (AC)',
  'Attached Washroom',
  'Geyser / Hot Water',
  'Washing Machine & Laundry',
  'RO Purified Drinking Water',
  'Refrigerator Access',
  'Cupboard & Study Desk',
  'CCTV & Biometric Access',
  'Power Backup',
  'Warden / Caretaker on site',
];

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [property, setProperty] = React.useState<Property | null>(null);

  // Multi-unit states
  const [structureType, setStructureType] = React.useState<PropertyStructureType>('INDEPENDENT');
  const [projectDetails, setProjectDetails] = React.useState<ProjectBuildingDetails>({});
  const [units, setUnits] = React.useState<PropertyUnitDetails[]>([]);

  const [formData, setFormData] = React.useState({
    // Step 1: Category & Basic
    categoryGroup: 'RESIDENTIAL',
    category: 'Apartment',
    subcategory: 'Flat/Apartment',
    listingType: 'SALE' as 'SALE' | 'RENT' | 'LEASE' | 'PG_COLIVING' | 'COMMERCIAL_LEASE',
    titleEn: '',
    descriptionEn: '',

    // Step 2: Specs & Dimensions
    bedrooms: '3',
    bathrooms: '3',
    balconies: '2',
    area: '1800',
    areaUnit: 'SQ_FT',
    carpetArea: '1500',
    builtUpArea: '1650',
    superBuiltUpArea: '1800',
    furnishing: 'SEMI_FURNISHED',
    facing: 'East',
    parking: '1 Covered',
    floorLevel: '1st Floor',
    totalFloors: '4',
    constructionStatus: 'READY_TO_MOVE',
    propertyAge: '0-1 years',
    possessionStatus: 'READY_TO_MOVE',
    possessionDate: '',
    availableFrom: '',

    // Commercial Specs
    cabins: '',
    workstations: '',
    washrooms: '',
    pantry: 'DRY',
    powerBackupKva: '',
    suitableFor: '',

    // Warehouse Specs
    ceilingHeightFt: '',
    loadingAccess: 'DOCK_HIGH',

    // PG Specific Specs
    accommodationType: 'PG_HOSTEL',
    sharingType: 'DOUBLE',
    availableBeds: '2',

    // Contact Numbers
    contactNumbers: [{ countryCode: '+91', number: '', isPrimary: true }] as ContactNumber[],

    // Plot/Land Specs
    plotLength: '',
    plotBreadth: '',
    openSides: '1',
    boundaryWall: true,
    cornerPlot: false,
    roadWidthFt: '40',
    soilType: '',
    landZone: 'Residential',

    // RERA Section
    reraRegistered: 'YES' as 'YES' | 'NO' | 'NOT_APPLICABLE',
    reraNumber: '',
    reraAuthority: 'UPRERA',
    reraProjectName: '',
    reraCertificateUrl: '',
    reraVerificationStatus: 'PENDING',
    reraExemptionReason: '',
    reraRemarks: '',

    // Step 3: Pricing & Commercial Terms
    priceAmount: '',
    currency: 'INR',
    priceUnit: 'TOTAL',
    isNegotiable: true,
    bookingAmount: '',
    maintenance: '',
    maintenancePayer: 'Owner',
    securityDeposit: '',
    rentPeriod: 'MONTHLY',
    ownershipType: 'Freehold',
    leaseDurationMonths: '11',
    noticePeriodMonths: '1',
    lockInPeriodMonths: '3',
    rentEscalationPercentage: '5',
    preferredTenantType: 'FAMILY',
    bachelorPreferences: 'NOT_APPLICABLE',
    brokerageAmount: '0',

    // PG / Co-living Specifics
    pgPricingModel: 'PER_BED',
    occupancyType: 'DOUBLE',
    mealsIncluded: 'BREAKFAST_AND_DINNER',
    foodPreferences: 'VEG_AND_NON_VEG',
    genderAccommodation: 'ANY',
    includedFacilities: [] as string[],

    // Location
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    city: 'Lucknow',
    locality: '',
    landmark: '',
    pincode: '226010',

    // Media & Amenities
    amenities: [] as string[],
    uploadedImages: [] as string[],
    videoUrl: '',
    videoType: '' as string | undefined,
    isReelFormat: true,
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Field visibility matrix
  const visibility = React.useMemo(() => {
    return getCategoryFieldVisibility(formData.category, formData.subcategory);
  }, [formData.category, formData.subcategory]);

  // Current category group definition
  const currentCategoryGroup = React.useMemo(() => {
    return CATEGORY_GROUPS.find((g) => g.group === formData.categoryGroup) || CATEGORY_GROUPS[0];
  }, [formData.categoryGroup]);

  // RERA number validation feedback
  const reraValidation = React.useMemo(() => {
    if (formData.reraRegistered !== 'YES') {
      return { valid: true, message: 'RERA registration not applicable for this listing' };
    }
    return validateReraNumber(formData.reraNumber, formData.reraAuthority);
  }, [formData.reraRegistered, formData.reraNumber, formData.reraAuthority]);

  const loadProperty = React.useCallback(async () => {
    if (!id || !isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await getMyPropertyById(id);
      setProperty(data);
      const titleStr = typeof data.title === 'string' ? data.title : data.title?.en || '';
      const descStr = typeof data.description === 'string' ? data.description : data.description?.en || '';
      const priceNum = typeof data.price === 'number' ? data.price : data.price?.amount || 0;

      // Detect category group
      const catGroup = CATEGORY_GROUPS.find(
        (g) => g.name === data.category || g.subcategories.includes((data as any).subcategory || ''),
      ) || CATEGORY_GROUPS[0];

      const reraObj = (data as any).rera || {};
      const specsObj = data.specs || {};
      const priceObj = typeof data.price === 'object' ? data.price : ({} as any);

      setFormData({
        categoryGroup: catGroup.group,
        category: data.category || catGroup.name,
        subcategory: (data as any).subcategory || catGroup.subcategories[0] || 'Flat/Apartment',
        listingType: (data.listingType as any) || 'SALE',
        titleEn: titleStr,
        descriptionEn: descStr,

        // Specs
        bedrooms: String(specsObj.bedrooms ?? '3'),
        bathrooms: String(specsObj.bathrooms ?? '3'),
        balconies: String((specsObj as any).balconies ?? '2'),
        area: String(specsObj.area || specsObj.carpetAreaSqFt || '1800'),
        areaUnit: specsObj.areaUnit || 'SQ_FT',
        carpetArea: String(specsObj.carpetArea || specsObj.carpetAreaSqFt || ''),
        builtUpArea: String((specsObj as any).builtUpArea || ''),
        superBuiltUpArea: String((specsObj as any).superBuiltUpArea || ''),
        furnishing: specsObj.furnishing || 'SEMI_FURNISHED',
        facing: specsObj.facing || 'East',
        parking: specsObj.parking || '1 Covered',
        floorLevel: specsObj.floorLevel || specsObj.floorNumber || '1st Floor',
        totalFloors: String(specsObj.totalFloors || '4'),
        constructionStatus: specsObj.constructionStatus || 'READY_TO_MOVE',
        propertyAge: specsObj.propertyAge || '0-1 years',
        possessionStatus: (specsObj as any).possessionStatus || 'READY_TO_MOVE',
        possessionDate: (specsObj as any).possessionDate || '',
        availableFrom: (specsObj as any).availableFrom || '',

        // Commercial
        cabins: String((specsObj as any).cabins ?? ''),
        workstations: String((specsObj as any).workstations ?? ''),
        washrooms: String((specsObj as any).washrooms ?? ''),
        pantry: (specsObj as any).pantry || 'DRY',
        powerBackupKva: String((specsObj as any).powerBackupKva ?? ''),
        suitableFor: Array.isArray((specsObj as any).suitableFor) ? (specsObj as any).suitableFor.join(', ') : '',

        // Warehouse
        ceilingHeightFt: String((specsObj as any).ceilingHeightFt ?? ''),
        loadingAccess: (specsObj as any).loadingAccess || 'DOCK_HIGH',

        // PG Specs
        accommodationType: (specsObj as any).accommodationType || 'PG_HOSTEL',
        sharingType: (specsObj as any).sharingType || 'DOUBLE',
        availableBeds: String((specsObj as any).availableBeds ?? '2'),

        // Contact Numbers
        contactNumbers: normalizeContactNumbers(
          (data as any).contactNumbers || (data as any).advertiser?.contactNumbers,
          (data as any).advertiser?.phone,
        ),

        // Plot
        plotLength: String((specsObj as any).plotLength ?? ''),
        plotBreadth: String((specsObj as any).plotBreadth ?? ''),
        openSides: String((specsObj as any).openSides ?? '1'),
        boundaryWall: (specsObj as any).boundaryWall ?? true,
        cornerPlot: (specsObj as any).cornerPlot ?? false,
        roadWidthFt: String((specsObj as any).roadWidthFt ?? '40'),
        soilType: (specsObj as any).soilType || '',
        landZone: (specsObj as any).landZone || 'Residential',

        // RERA
        reraRegistered: reraObj.isReraRegistered || ((data as any).reraNumber ? 'YES' : 'NO'),
        reraNumber: reraObj.reraNumber || (data as any).reraNumber || '',
        reraAuthority: reraObj.authority || 'UPRERA',
        reraProjectName: reraObj.projectName || '',
        reraCertificateUrl: reraObj.certificateUrl || '',
        reraVerificationStatus: reraObj.verificationStatus || 'PENDING',
        reraExemptionReason: reraObj.exemptionReason || '',
        reraRemarks: reraObj.adminRemarks || '',

        // Price
        priceAmount: String(priceNum),
        currency: priceObj.currency || 'INR',
        priceUnit: priceObj.priceUnit || 'TOTAL',
        isNegotiable: priceObj.isNegotiable !== undefined ? !!priceObj.isNegotiable : true,
        bookingAmount: String((priceObj as any).bookingAmount ?? ''),
        maintenance: String(priceObj.maintenance ?? ''),
        maintenancePayer: (priceObj as any).maintenancePayer || 'Owner',
        securityDeposit: String(priceObj.securityDeposit ?? ''),
        rentPeriod: priceObj.rentPeriod || 'MONTHLY',
        ownershipType: (specsObj as any).ownershipType || 'Freehold',
        leaseDurationMonths: String((priceObj as any).leaseDurationMonths ?? '11'),
        noticePeriodMonths: String((priceObj as any).noticePeriodMonths ?? '1'),
        lockInPeriodMonths: String((priceObj as any).lockInPeriodMonths ?? '3'),
        rentEscalationPercentage: String((priceObj as any).rentEscalationPercentage ?? '5'),
        preferredTenantType: (priceObj as any).preferredTenantType || 'FAMILY',
        bachelorPreferences: (priceObj as any).bachelorPreferences || 'NOT_APPLICABLE',
        brokerageAmount: String((priceObj as any).brokerageAmount ?? '0'),

        // PG
        pgPricingModel: (priceObj as any).pgPricingModel || 'PER_BED',
        occupancyType: (priceObj as any).occupancyType || 'DOUBLE',
        mealsIncluded: (priceObj as any).mealsIncluded || 'BREAKFAST_AND_DINNER',
        foodPreferences: (priceObj as any).foodPreferences || 'VEG_AND_NON_VEG',
        genderAccommodation: (priceObj as any).genderAccommodation || 'ANY',
        includedFacilities: (priceObj as any).includedFacilities || [],

        // Location
        state: (typeof data.location === 'object' && data.location?.state) || 'Uttar Pradesh',
        district: (typeof data.location === 'object' && data.location?.district) || 'Lucknow',
        city: (typeof data.location === 'object' && data.location?.city) || 'Lucknow',
        locality: (typeof data.location === 'object' && data.location?.locality) || (typeof data.location === 'string' ? data.location : ''),
        landmark: (typeof data.location === 'object' && data.location?.landmark) || '',
        pincode: (typeof data.location === 'object' && data.location?.pincode) || '226010',

        amenities: data.amenities || [],
        uploadedImages: data.media?.images || (data.media?.thumbnailUrl ? [data.media.thumbnailUrl] : []),
        videoUrl: data.media?.videoUrl || (data as any).videoUrl || (data.media?.videos && data.media.videos[0]) || '',
        videoType: data.media?.videoType || (data as any).videoType || '',
        isReelFormat: data.media?.isReelFormat !== undefined ? Boolean(data.media.isReelFormat) : true,
      });

      // Hydrate multi-unit states
      setStructureType(data.structureType || 'INDEPENDENT');
      setProjectDetails(data.projectDetails || {});
      setUnits(data.units || []);
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

    const isMultiUnit = structureType !== 'INDEPENDENT';
    const computedPrice =
      Number(formData.priceAmount) > 0
        ? Number(formData.priceAmount)
        : units.length > 0
        ? Math.min(...units.map((u) => u.price || u.monthlyRent || 0).filter((p) => p > 0)) || 0
        : 0;

    return {
      title: { en: formData.titleEn },
      description: { en: formData.descriptionEn },
      category: formData.category,
      subcategory: formData.subcategory,
      listingType: formData.listingType,
      structureType: structureType,
      isParentProject: isMultiUnit,
      projectDetails: isMultiUnit ? projectDetails : undefined,
      units: isMultiUnit ? units : undefined,
      totalUnits: isMultiUnit ? units.length : undefined,
      availableUnits: isMultiUnit ? units.filter((u) => u.availabilityStatus === 'AVAILABLE').length : undefined,
      price: {
        amount: computedPrice,
        currency: formData.currency,
        priceUnit: formData.priceUnit,
        isNegotiable: formData.isNegotiable,
        bookingAmount: formData.bookingAmount ? Number(formData.bookingAmount) : undefined,
        maintenance: Number(formData.maintenance) || 0,
        maintenancePayer: formData.maintenancePayer,
        securityDeposit: Number(formData.securityDeposit) || 0,
        rentPeriod:
          formData.listingType === 'RENT' || formData.listingType === 'COMMERCIAL_LEASE'
            ? formData.rentPeriod
            : undefined,
        leaseDurationMonths: formData.leaseDurationMonths ? Number(formData.leaseDurationMonths) : undefined,
        noticePeriodMonths: formData.noticePeriodMonths ? Number(formData.noticePeriodMonths) : undefined,
        lockInPeriodMonths: formData.lockInPeriodMonths ? Number(formData.lockInPeriodMonths) : undefined,
        rentEscalationPercentage: formData.rentEscalationPercentage ? Number(formData.rentEscalationPercentage) : undefined,
        preferredTenantType: formData.preferredTenantType,
        bachelorPreferences:
          formData.preferredTenantType === 'BACHELORS' ||
          formData.preferredTenantType === 'FAMILY_AND_BACHELORS'
            ? formData.bachelorPreferences
            : 'NOT_APPLICABLE',
        brokerageAmount: formData.brokerageAmount ? Number(formData.brokerageAmount) : undefined,
        pgPricingModel: formData.listingType === 'PG_COLIVING' ? formData.pgPricingModel : undefined,
        occupancyType: formData.listingType === 'PG_COLIVING' ? formData.occupancyType : undefined,
        mealsIncluded: formData.listingType === 'PG_COLIVING' ? formData.mealsIncluded : undefined,
        foodPreferences: formData.listingType === 'PG_COLIVING' ? formData.foodPreferences : undefined,
        genderAccommodation: formData.listingType === 'PG_COLIVING' ? formData.genderAccommodation : undefined,
        includedFacilities: formData.listingType === 'PG_COLIVING' ? formData.includedFacilities : undefined,
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
        bedrooms: visibility.showBedrooms && formData.bedrooms ? Number(formData.bedrooms) : undefined,
        bathrooms: (visibility.showBathrooms || (visibility.showWashrooms && !visibility.showCommercialSpecs)) && formData.bathrooms ? Number(formData.bathrooms) : undefined,
        balconies: visibility.showBalconies && formData.balconies ? Number(formData.balconies) : undefined,
        area: Number(formData.area) || undefined,
        areaUnit: formData.areaUnit,
        carpetArea: visibility.showCarpetArea && formData.carpetArea ? Number(formData.carpetArea) : undefined,
        carpetAreaSqFt: Number(formData.area) || undefined,
        builtUpArea: visibility.showBuiltUpArea && formData.builtUpArea ? Number(formData.builtUpArea) : undefined,
        superBuiltUpArea: visibility.showSuperBuiltUpArea && formData.superBuiltUpArea ? Number(formData.superBuiltUpArea) : undefined,
        furnishing: visibility.showFurnishing ? formData.furnishing : undefined,
        facing: visibility.showFacing ? formData.facing : undefined,
        parking: visibility.showParking ? formData.parking : undefined,
        floorLevel: visibility.showFloorNumber ? formData.floorLevel : undefined,
        floorNumber: visibility.showFloorNumber ? formData.floorLevel : undefined,
        totalFloors: visibility.showTotalFloors && formData.totalFloors ? Number(formData.totalFloors) : undefined,
        constructionStatus: visibility.showConstructionStatus ? formData.constructionStatus : undefined,
        propertyAge: visibility.showPropertyAge ? formData.propertyAge : undefined,
        possessionStatus: formData.possessionStatus,
        possessionDate: formData.possessionDate || undefined,
        availableFrom: formData.availableFrom || undefined,
        ownershipType: formData.ownershipType,
        // Commercial
        washrooms: visibility.showWashrooms && formData.washrooms ? Number(formData.washrooms) : undefined,
        cabins: visibility.showCabins && formData.cabins ? Number(formData.cabins) : undefined,
        workstations: visibility.showWorkstations && formData.workstations ? Number(formData.workstations) : undefined,
        pantry: visibility.showPantry ? formData.pantry : undefined,
        powerBackupKva: visibility.showPowerBackup && formData.powerBackupKva ? Number(formData.powerBackupKva) : undefined,
        suitableFor: visibility.showSuitableFor && formData.suitableFor ? formData.suitableFor.split(',').map((s) => s.trim()) : undefined,
        // Warehouse
        ceilingHeightFt: visibility.showCeilingHeight && formData.ceilingHeightFt ? Number(formData.ceilingHeightFt) : undefined,
        loadingAccess: visibility.showLoadingAccess ? formData.loadingAccess : undefined,
        // Plot / Land
        plotLength: visibility.showPlotDimensions && formData.plotLength ? Number(formData.plotLength) : undefined,
        plotBreadth: visibility.showPlotDimensions && formData.plotBreadth ? Number(formData.plotBreadth) : undefined,
        openSides: visibility.showOpenSides && formData.openSides ? Number(formData.openSides) : undefined,
        boundaryWall: visibility.showBoundaryWall ? formData.boundaryWall : undefined,
        cornerPlot: visibility.showCornerPlot ? formData.cornerPlot : undefined,
        roadWidthFt: visibility.showRoadWidth && formData.roadWidthFt ? Number(formData.roadWidthFt) : undefined,
        soilType: visibility.showSoilType ? formData.soilType : undefined,
        landZone: visibility.showLandZone ? formData.landZone : undefined,
        // PG Specs
        accommodationType: visibility.showAccommodationType ? formData.accommodationType : undefined,
        sharingType: visibility.showSharingType ? formData.sharingType : undefined,
        availableBeds: visibility.showAvailableBeds && formData.availableBeds ? Number(formData.availableBeds) : undefined,
      },
      contactNumbers: formData.contactNumbers.filter((n) => n.number.trim().length > 0),
      rera: {
        isReraRegistered: formData.reraRegistered,
        reraNumber: formData.reraRegistered === 'YES' ? formData.reraNumber.trim() : undefined,
        authority: formData.reraRegistered === 'YES' ? formData.reraAuthority : undefined,
        projectName: formData.reraRegistered === 'YES' && formData.reraProjectName ? formData.reraProjectName.trim() : undefined,
        certificateUrl: formData.reraCertificateUrl || undefined,
        // Preserve admin verification status if already verified, otherwise reset to pending if registered
        verificationStatus:
          formData.reraVerificationStatus === 'VERIFIED'
            ? 'VERIFIED'
            : formData.reraRegistered === 'YES'
            ? 'PENDING'
            : 'NOT_APPLICABLE',
        exemptionReason: formData.reraRegistered !== 'YES' ? formData.reraExemptionReason : undefined,
      },
      reraNumber: formData.reraRegistered === 'YES' ? formData.reraNumber.trim() : undefined,
      amenities: formData.amenities,
      media: {
        thumbnailUrl: primaryImg,
        coverImage: primaryImg,
        images: formData.uploadedImages.length > 0 ? formData.uploadedImages : [primaryImg],
        videos: formData.videoUrl ? [formData.videoUrl] : [],
        videoUrl: formData.videoUrl || undefined,
        videoType: formData.videoType || undefined,
        isReelFormat: formData.isReelFormat || Boolean(formData.videoUrl),
        primaryMediaType: formData.videoUrl ? 'VIDEO' : 'IMAGE',
      },
      videoUrl: formData.videoUrl || undefined,
      videoType: formData.videoType || undefined,
    };
  };

  const handleSave = async () => {
    if (!formData.titleEn.trim() || !formData.locality.trim() || !formData.priceAmount) {
      toast.warning('Validation Error', 'Please complete title, locality, and price.');
      return;
    }
    if (formData.reraRegistered === 'YES' && !formData.reraNumber.trim()) {
      toast.warning('RERA Required', 'RERA registration number is mandatory for registered projects.');
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
    if (formData.reraRegistered === 'YES' && !formData.reraNumber.trim()) {
      toast.warning('RERA Required', 'RERA registration number is mandatory for registered projects before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      await updateProperty(id, payload);
      await submitPropertyForApproval(id);
      toast.success('Listing Resubmitted', 'Property has been submitted for MyProperty review.');
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
              <span>Save &amp; Submit</span>
            </button>
          )}
        </div>
      </div>

      {/* Rejection Alert */}
      {property?.status === 'REJECTED' && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-xs space-y-1 text-red-700 dark:text-red-300">
          <div className="font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>This Listing Was Rejected by MyProperty Moderation</span>
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
            1. Classification &amp; Basic Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">Classification *</label>
              <select
                value={formData.categoryGroup}
                onChange={(e) => {
                  const g = CATEGORY_GROUPS.find((group) => group.group === e.target.value) || CATEGORY_GROUPS[0];
                  setFormData({
                    ...formData,
                    categoryGroup: g.group,
                    category: g.name,
                    subcategory: g.subcategories[0] || '',
                  });
                }}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
              >
                {CATEGORY_GROUPS.map((cg) => (
                  <option key={cg.group} value={cg.group}>
                    {cg.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">Subcategory *</label>
              <select
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
              >
                {currentCategoryGroup.subcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">Listing Type *</label>
              <select
                value={formData.listingType}
                onChange={(e) =>
                  setFormData({ ...formData, listingType: e.target.value as any })
                }
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
              >
                {LISTING_TYPES.filter((lt) => currentCategoryGroup.supportedListingTypes.includes(lt.value as any)).map(
                  (lt) => (
                    <option key={lt.value} value={lt.value}>
                      {lt.label}
                    </option>
                  ),
                )}
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
              className="w-full px-3.5 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
            />
          </div>
        </div>

        {/* Multi-Unit & Plotted Hierarchy Manager */}
        <PropertyUnitsManager
          structureType={structureType}
          onStructureTypeChange={setStructureType}
          projectDetails={projectDetails}
          onProjectDetailsChange={setProjectDetails}
          units={units}
          onUnitsChange={setUnits}
        />

        {/* Contact Numbers Management */}
        <ContactNumbersManager
          contactNumbers={formData.contactNumbers}
          onChange={(next) => setFormData((prev) => ({ ...prev, contactNumbers: next }))}
        />

        {/* Dynamic Specifications */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-casa-text-primary border-b border-casa-border-light pb-2">
            2. Physical Specifications &amp; Dimensions
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">Total Area *</label>
              <input
                type="number"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">Area Unit</label>
              <select
                value={formData.areaUnit}
                onChange={(e) => setFormData({ ...formData, areaUnit: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
              >
                <option value="SQ_FT">Sq.Ft</option>
                <option value="SQ_YARDS">Sq.Yards</option>
                <option value="SQ_MTR">Sq.Meters</option>
                <option value="ACRES">Acres</option>
                <option value="BIGHAS">Bighas</option>
              </select>
            </div>

            {visibility.hasBedrooms && (
              <>
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Bedrooms</label>
                  <input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Bathrooms</label>
                  <input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  />
                </div>
              </>
            )}

            {/* Commercial Specs */}
            {visibility.showCommercialSpecs && (
              <>
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Cabins</label>
                  <input
                    type="number"
                    placeholder="e.g., 4"
                    value={formData.cabins}
                    onChange={(e) => setFormData({ ...formData, cabins: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Workstations</label>
                  <input
                    type="number"
                    placeholder="e.g., 20"
                    value={formData.workstations}
                    onChange={(e) => setFormData({ ...formData, workstations: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Washrooms</label>
                  <input
                    type="number"
                    placeholder="e.g., 2"
                    value={formData.washrooms}
                    onChange={(e) => setFormData({ ...formData, washrooms: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Power Backup (kVA)</label>
                  <input
                    type="number"
                    placeholder="e.g., 50"
                    value={formData.powerBackupKva}
                    onChange={(e) => setFormData({ ...formData, powerBackupKva: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  />
                </div>
              </>
            )}

            {/* Warehouse Specs */}
            {visibility.showWarehouseSpecs && (
              <>
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Clear Height (ft)</label>
                  <input
                    type="number"
                    placeholder="e.g., 28"
                    value={formData.ceilingHeightFt}
                    onChange={(e) => setFormData({ ...formData, ceilingHeightFt: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Loading Access</label>
                  <select
                    value={formData.loadingAccess}
                    onChange={(e) => setFormData({ ...formData, loadingAccess: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  >
                    <option value="DOCK_HIGH">Dock High</option>
                    <option value="GROUND_LEVEL">Ground Level</option>
                    <option value="RAMP_ACCESS">Ramp Access</option>
                    <option value="CONTAINER_TRUCK_DIRECT">Container Direct</option>
                  </select>
                </div>
              </>
            )}

            {/* PG Specs */}
            {visibility.showPgSpecs && (
              <>
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Accommodation</label>
                  <select
                    value={formData.accommodationType}
                    onChange={(e) => setFormData({ ...formData, accommodationType: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  >
                    <option value="PG_HOSTEL">PG / Hostel</option>
                    <option value="COLIVING_SUITE">Co-living Suite</option>
                    <option value="MANAGED_APARTMENT">Managed PG</option>
                    <option value="PRIVATE_ROOM">Private Room</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Sharing Type</label>
                  <select
                    value={formData.sharingType}
                    onChange={(e) => setFormData({ ...formData, sharingType: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  >
                    <option value="SINGLE">Single Occupancy</option>
                    <option value="DOUBLE">Double Sharing</option>
                    <option value="TRIPLE">Triple Sharing</option>
                    <option value="FOUR_PLUS">4+ Sharing</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Available Beds</label>
                  <input
                    type="number"
                    placeholder="e.g., 2"
                    value={formData.availableBeds}
                    onChange={(e) => setFormData({ ...formData, availableBeds: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  />
                </div>
              </>
            )}

            {/* Plot Dimensions */}
            {visibility.showPlotDimensions && (
              <>
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Length (ft)</label>
                  <input
                    type="number"
                    placeholder="e.g., 60"
                    value={formData.plotLength}
                    onChange={(e) => setFormData({ ...formData, plotLength: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Breadth (ft)</label>
                  <input
                    type="number"
                    placeholder="e.g., 40"
                    value={formData.plotBreadth}
                    onChange={(e) => setFormData({ ...formData, plotBreadth: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Road Width (ft)</label>
                  <input
                    type="number"
                    placeholder="e.g., 40"
                    value={formData.roadWidthFt}
                    onChange={(e) => setFormData({ ...formData, roadWidthFt: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  />
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {visibility.hasFurnishing && (
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1">Furnishing</label>
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
            )}

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">Facing</label>
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

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">Status</label>
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
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">Ownership</label>
              <select
                value={formData.ownershipType}
                onChange={(e) => setFormData({ ...formData, ownershipType: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
              >
                <option value="Freehold">Freehold Title</option>
                <option value="Leasehold">Leasehold</option>
                <option value="Co-operative Society">Co-operative Society</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dedicated Indian RERA Section */}
        <div className="space-y-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/30">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-casa-text-primary flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>3. Indian RERA Compliance</span>
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              formData.reraVerificationStatus === 'VERIFIED'
                ? 'bg-emerald-100 text-emerald-700'
                : formData.reraRegistered === 'YES'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-casa-subtle text-casa-text-muted'
            }`}>
              {formData.reraVerificationStatus === 'VERIFIED'
                ? 'VERIFIED'
                : formData.reraRegistered === 'YES'
                ? 'AUDIT PENDING'
                : 'EXEMPT'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">RERA Registered? *</label>
              <select
                value={formData.reraRegistered}
                onChange={(e) => setFormData({ ...formData, reraRegistered: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
              >
                <option value="YES">Yes — Registered Project</option>
                <option value="NO">No — Exempt / Unregistered</option>
                <option value="NOT_APPLICABLE">Not Applicable</option>
              </select>
            </div>

            {formData.reraRegistered === 'YES' ? (
              <>
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">RERA Authority</label>
                  <select
                    value={formData.reraAuthority}
                    onChange={(e) => setFormData({ ...formData, reraAuthority: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                  >
                    {RERA_AUTHORITIES.map((auth) => (
                      <option key={auth.code} value={auth.code}>
                        {auth.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">RERA Number *</label>
                  <input
                    type="text"
                    value={formData.reraNumber}
                    onChange={(e) => setFormData({ ...formData, reraNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary font-mono font-bold"
                  />
                  {formData.reraNumber && (
                    <span className={`text-[10px] mt-1 block ${reraValidation.valid ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {reraValidation.message}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-casa-text-primary block mb-1">Statutory Exemption Reason</label>
                <select
                  value={formData.reraExemptionReason}
                  onChange={(e) => setFormData({ ...formData, reraExemptionReason: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                >
                  {RERA_EXEMPTION_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Pricing & Terms */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-casa-text-primary border-b border-casa-border-light pb-2">
            4. Pricing &amp; Location
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                {formData.listingType === 'SALE' ? 'Total Price (INR ₹) *' : 'Monthly Rent / Tariff (INR ₹) *'}
              </label>
              <input
                type="number"
                required
                value={formData.priceAmount}
                onChange={(e) => setFormData({ ...formData, priceAmount: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">Maintenance (INR ₹/mo)</label>
              <input
                type="number"
                value={formData.maintenance}
                onChange={(e) => setFormData({ ...formData, maintenance: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                {formData.listingType === 'SALE' ? 'Booking Amount (INR ₹)' : 'Security Deposit (INR ₹)'}
              </label>
              <input
                type="number"
                value={formData.listingType === 'SALE' ? formData.bookingAmount : formData.securityDeposit}
                onChange={(e) =>
                  formData.listingType === 'SALE'
                    ? setFormData({ ...formData, bookingAmount: e.target.value })
                    : setFormData({ ...formData, securityDeposit: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
              />
            </div>
          </div>

          {/* Rental / Lease Tenant Preferences & Availability */}
          {(formData.listingType === 'RENT' ||
            formData.listingType === 'LEASE' ||
            formData.listingType === 'COMMERCIAL_LEASE' ||
            formData.listingType === 'PG_COLIVING') && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 p-3 bg-casa-subtle/50 rounded-xl border border-casa-border-light">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1">Preferred Tenant Type</label>
                <select
                  value={formData.preferredTenantType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({
                      ...formData,
                      preferredTenantType: val,
                      bachelorPreferences:
                        val === 'BACHELORS' || val === 'FAMILY_AND_BACHELORS'
                          ? formData.bachelorPreferences || 'BOYS_AND_GIRLS'
                          : 'NOT_APPLICABLE',
                    });
                  }}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                >
                  <option value="FAMILY">Family</option>
                  <option value="BACHELORS">Bachelors</option>
                  <option value="FAMILY_AND_BACHELORS">Family and Bachelors</option>
                  <option value="COMPANY_LEASE">Company/Corporate Lease</option>
                  <option value="ANY">Any</option>
                </select>
              </div>

              {(formData.preferredTenantType === 'BACHELORS' ||
                formData.preferredTenantType === 'FAMILY_AND_BACHELORS') && (
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Bachelor Preferences</label>
                  <select
                    value={formData.bachelorPreferences}
                    onChange={(e) => setFormData({ ...formData, bachelorPreferences: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  >
                    <option value="BOYS">Boys</option>
                    <option value="GIRLS">Girls</option>
                    <option value="BOYS_AND_GIRLS">Boys and Girls</option>
                    <option value="NOT_APPLICABLE">Not applicable</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                  Available From (Tenant Availability Date)
                </label>
                <input
                  type="date"
                  value={formData.availableFrom}
                  onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                />
              </div>
            </div>
          )}

          {/* Possession Status & Date for Sale */}
          {formData.listingType === 'SALE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 p-3 bg-casa-subtle/50 rounded-xl border border-casa-border-light">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1">Possession Status</label>
                <select
                  value={formData.possessionStatus}
                  onChange={(e) => setFormData({ ...formData, possessionStatus: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                >
                  <option value="READY_TO_MOVE">Ready to Move</option>
                  <option value="UNDER_CONSTRUCTION">Under Construction</option>
                  <option value="RESALE">Resale</option>
                  <option value="NEW_LAUNCH">New Launch</option>
                </select>
              </div>
              {formData.possessionStatus === 'UNDER_CONSTRUCTION' && (
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Expected Possession Date</label>
                  <input
                    type="date"
                    value={formData.possessionDate}
                    onChange={(e) => setFormData({ ...formData, possessionDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">City *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
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

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1">PIN Code</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
              />
            </div>
          </div>
        </div>

        {/* Amenities Selection */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-casa-text-primary border-b border-casa-border-light pb-2">
            5. Amenities ({formData.amenities.length} selected)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STANDARD_AMENITIES.map((amenity) => {
              const isSelected = formData.amenities.includes(amenity);
              return (
                <button
                  type="button"
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
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

        {/* Photos Management */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-casa-text-primary border-b border-casa-border-light pb-2">
            6. Photos ({formData.uploadedImages.length} uploaded)
          </h3>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-casa-border-light hover:border-casa-brand rounded-2xl p-6 text-center cursor-pointer bg-casa-canvas transition-colors flex items-center justify-center gap-2 text-xs font-semibold text-casa-text-primary"
          >
            <Upload className="w-4 h-4 text-casa-brand" />
            <span>Upload More Photos from PC</span>
          </button>

          {formData.uploadedImages.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
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
                </div>
              ))}
            </div>
          )}

          {/* Dedicated Property Video / 9:16 Vertical Reel Section */}
          <div className="pt-4 border-t border-casa-border-light">
            <PropertyVideoManager
              videoUrl={formData.videoUrl}
              videoType={formData.videoType}
              isReelFormat={formData.isReelFormat}
              onChange={({ videoUrl, isReelFormat, videoType }) =>
                setFormData((prev) => ({
                  ...prev,
                  videoUrl,
                  isReelFormat,
                  videoType,
                }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
