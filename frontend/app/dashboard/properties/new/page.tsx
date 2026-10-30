'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { createProperty, submitPropertyForApproval } from '@/services/property-service';
import { fetchLocationAutocomplete, addCustomLocation } from '@/services/location-service';
import { formatPrice } from '@/lib/utils';
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
import { CustomSizesManager } from '@/components/property/custom-sizes-manager';
import {
  PropertyStructureType,
  PropertyUnitDetails,
  ProjectBuildingDetails,
  ContactNumber,
  CustomSize,
} from '@/types';
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
  AlertCircle,
  FileText,
  Bed,
  Bath,
  IndianRupee,
  Layers,
  Sparkles,
  Video,
  Plus,
  Play,
  WifiOff,
  Cloud,
  RefreshCw,
  CheckCircle2,
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
  'High-Speed Wi-Fi',
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

const LOCATION_HIERARCHY_DATA: Record<
  string,
  {
    cities: Record<
      string,
      {
        areas: Record<
          string,
          {
            subAreas: string[];
            societies: string[];
          }
        >;
      }
    >;
  }
> = {
  'Gujarat': {
    cities: {
      'Ahmedabad': {
        areas: {
          'Satellite': {
            subAreas: ['Shyamal Cross Road', 'Jodhpur Cross Road', 'Star Bazaar Road', 'ISRO Colony'],
            societies: ['Goyal Riviera', 'Bunglows Satellite', 'Riviera Elegance', 'Satellite Apartments'],
          },
          'Bodakdev': {
            subAreas: ['Judges Bungalow Road', 'Pakwan Cross Road', 'Sindhu Bhavan Marg'],
            societies: ['Iscon Platinum', 'Goyal Orchid Whitefield', 'Bodakdev Enclave'],
          },
          'Vastrapur': {
            subAreas: ['IIM Road', 'Vastrapur Lake Area', 'Mansi Circle'],
            societies: ['Nebula Tower', 'Vastrapur Heights', 'Amrapali Enclave'],
          },
          'Prahlad Nagar': {
            subAreas: ['Prahladnagar Garden Road', 'Anand Nagar Road', 'Titanium City'],
            societies: ['Venus Atlantis', 'Prahladnagar Residency', 'Mondeal Heights'],
          },
          'Bopal': {
            subAreas: ['South Bopal', 'TRP Mall Road', 'Ghuma Road'],
            societies: ['Arohi Residency', 'Bopal Greens', 'Sun South Park'],
          },
          'Thaltej': {
            subAreas: ['Thaltej Shilaj Road', 'Hebatpur Road', 'Science City Road'],
            societies: ['Shilp Serene', 'Ganesh Housing Complex', 'Thaltej Meadows'],
          },
        },
      },
      'Surat': {
        areas: {
          'Vesu': {
            subAreas: ['VIP Road', 'Udhna Magdalla Road', 'University Road'],
            societies: ['Rajhans Zion', 'Surat Dream Residency', 'Vesu Palms'],
          },
          'Adajan': {
            subAreas: ['Pal Road', 'Anand Mahal Road', 'Honey Park Road'],
            societies: ['Adajan Towers', 'Green City Heights', 'Surat Enclave'],
          },
        },
      },
      'Vadodara': {
        areas: {
          'Alkapuri': {
            subAreas: ['RC Dutt Road', 'Jetpur Road', 'Sampatrao Colony'],
            societies: ['Alkapuri Heights', 'Royal Residency', 'Baroda Greens'],
          },
          'Vasna Road': {
            subAreas: ['Bhayli', 'Gotri Road', 'Sun Pharma Road'],
            societies: ['Vasna Greens', 'Bhayli Orchid', 'Gotri Enclave'],
          },
        },
      },
    },
  },
  'Uttar Pradesh': {
    cities: {
      'Lucknow': {
        areas: {
          'Gomti Nagar': {
            subAreas: ['Gomti Nagar Extension', 'Vibhuti Khand', 'Vikalp Khand', 'Viram Khand', 'Patrakarpuram'],
            societies: ['Omaxe Residency', 'Rohtas Presidential Tower', 'Eldeco Greens', 'MI Rustle Court', 'Parsvnath Planet'],
          },
          'Hazratganj': {
            subAreas: ['Main Market Square', 'Naval Kishore Road', 'Sapru Marg', 'Ashok Marg'],
            societies: ['Hazratganj Royale', 'Civil Lines Court', 'Metro View Apartments'],
          },
          'Aliganj': {
            subAreas: ['Sector A', 'Sector B', 'Sector Q', 'Kapoorthala'],
            societies: ['Aliganj Heights', 'Kapoorthala Towers', 'Lucknow Enclave'],
          },
          'Indira Nagar': {
            subAreas: ['Sector 14', 'Sector 18', 'Munshipulia', 'Bhootnath Market'],
            societies: ['Indira Greens', 'Munshipulia Heights', 'Avadh Vihar'],
          },
          'Sushant Golf City': {
            subAreas: ['Amar Shaheed Path', 'Lulu Mall Sector', 'Medanta Road'],
            societies: ['Ansal Pocket 1', 'Celebrity Gardens', 'Rishita Manhattan', 'Palassio Enclave'],
          },
        },
      },
      'Noida': {
        areas: {
          'Sector 62': {
            subAreas: ['Electronic City', 'Fortis Road', 'Model Town'],
            societies: ['Stellar Park', 'Designer Park', 'Meghdootam Apartments'],
          },
          'Sector 150': {
            subAreas: ['Noida-Greater Noida Expressway', 'Sports City', 'Shaheed Bhagat Singh Park'],
            societies: ['Godrej Woods', 'Tata Eureka Park', 'ATS Pious Orchards'],
          },
        },
      },
    },
  },
  'Maharashtra': {
    cities: {
      'Mumbai': {
        areas: {
          'Bandra West': {
            subAreas: ['Pali Hill', 'Carter Road', 'Bandstand', 'Hill Road', 'BKC Connector'],
            societies: ['Sea Spray Apartments', 'Bandra Heights', 'Pali Palms', 'Sterling Seaface'],
          },
          'Andheri West': {
            subAreas: ['Lokhandwala Complex', 'Oshiwara', 'Versova', 'Link Road'],
            societies: ['Oberoi Springs', 'Adani Western Heights', 'Windermere Towers'],
          },
          'Juhu': {
            subAreas: ['Juhu Tara Road', 'Gulmohar Road', 'JVPD Scheme'],
            societies: ['Juhu Beach Apartments', 'Ruia Park', 'Sea Face Enclave'],
          },
        },
      },
      'Pune': {
        areas: {
          'Koregaon Park': {
            subAreas: ['North Main Road', 'South Main Road', 'Lane 7'],
            societies: ['Vascon Windermere', 'Marvel Basilo', 'Gera Song of Joy'],
          },
          'Hinjawadi': {
            subAreas: ['Phase 1 Tech Park', 'Phase 2', 'Phase 3 Circle'],
            societies: ['Megapolis Mystic', 'Kolte Patil Life Republic', 'Godrej 24'],
          },
        },
      },
    },
  },
  'Karnataka': {
    cities: {
      'Bengaluru': {
        areas: {
          'Whitefield': {
            subAreas: ['ITPL Main Road', 'Hope Farm Junction', 'EPIP Zone', 'Kadugodi'],
            societies: ['Prestige Shantiniketan', 'Brigade Cosmopolis', 'Sobha Rose', 'Divyasree Republic'],
          },
          'Koramangala': {
            subAreas: ['3rd Block', '4th Block 100ft Road', '5th Block Sony World', '6th Block'],
            societies: ['Raheja Residency', 'Adarsh Palm Retreat', 'Koramangala Enclave'],
          },
          'Indiranagar': {
            subAreas: ['100ft Road', '12th Main', 'Defense Colony', 'HAL 2nd Stage'],
            societies: ['Indiranagar Heights', 'Defense Colony Villas', 'HM Symphony'],
          },
        },
      },
    },
  },
  'Delhi NCR': {
    cities: {
      'New Delhi': {
        areas: {
          'South Delhi': {
            subAreas: ['Greater Kailash 1', 'Greater Kailash 2', 'Hauz Khas', 'Defence Colony'],
            societies: ['GK Enclave', 'DLF King\'s Court', 'Vasant Enclave', 'Def Col Villas'],
          },
          'Central Delhi': {
            subAreas: ['Connaught Place', 'Chanakyapuri', 'Barakhamba Road', 'Golf Links'],
            societies: ['Golf Links Residence', 'Jor Bagh Mansions', 'Central Court'],
          },
        },
      },
      'Gurugram': {
        areas: {
          'Golf Course Road': {
            subAreas: ['Sector 42', 'Sector 54', 'Sector 53'],
            societies: ['DLF The Camellias', 'DLF The Magnolias', 'DLF The Aralias', 'Belvedere Park'],
          },
        },
      },
    },
  },
};

export default function NewPropertyWizardPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const isSuperAdminOrAdmin = Boolean(
    user &&
      ['SUPER_ADMIN', 'ADMIN'].includes(
        String(user.platformRole || user.role).toUpperCase(),
      ),
  );

  const isConsumer = Boolean(
    user &&
      ['BUYER', 'TENANT', 'PURCHASER'].includes(
        String(user.accountType || user.role).toUpperCase(),
      ),
  );

  const isSuspendedOrInactive = Boolean(
    user &&
      ['SUSPENDED', 'DEACTIVATED'].includes(
        String((user as any).status).toUpperCase(),
      ),
  );

  const isAuthorizedAdvertiser = Boolean(
    isAuthenticated &&
      user &&
      !isConsumer &&
      !isSuperAdminOrAdmin &&
      !isSuspendedOrInactive &&
      [
        'AGENT',
        'BROKER',
        'BROKER_AGENCY',
        'BROKER_AGENT',
        'DEVELOPER',
        'PROPERTY_OWNER',
        'SELLER',
        'VERIFIED_AGENT',
      ].includes(String(user.accountType || user.role).toUpperCase()),
  );

  const [currentStep, setCurrentStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Auto-prompt login modal if visitor is logged out
  const hasPromptedAuth = React.useRef(false);
  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && !hasPromptedAuth.current) {
      hasPromptedAuth.current = true;
      openAuthModal('SIGN_IN');
    }
  }, [isAuthLoading, isAuthenticated, openAuthModal]);

  // Multi-Unit & Plotted Hierarchy State
  const [structureType, setStructureType] = React.useState<PropertyStructureType>('INDEPENDENT');
  const [projectDetails, setProjectDetails] = React.useState<ProjectBuildingDetails>({
    projectName: '',
    buildingName: '',
    buildingNumber: '',
    towerName: '',
    totalFloors: undefined,
    developerName: '',
    projectAddress: '',
  });
  const [units, setUnits] = React.useState<PropertyUnitDetails[]>([]);

  // Wizard Form State
  const [formData, setFormData] = React.useState({
    // Step 1: Category & Basic
    categoryGroup: 'APARTMENT_FLAT',
    category: 'Apartment / Flat',
    subcategory: 'Flat / Apartment',
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
    parking: '1 Covered, 1 Open',
    floorLevel: '3rd Floor',
    totalFloors: '14',
    constructionStatus: 'READY_TO_MOVE',
    propertyAge: '0-1 years',
    possessionStatus: 'READY_TO_MOVE',
    possessionDate: '',
    availableFrom: '',
    customSizes: [] as CustomSize[],

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
    includedFacilities: ['High-Speed Wi-Fi', 'Daily Room Cleaning', 'RO Purified Drinking Water', 'Air Conditioning (AC)'],

    // Step 4: Location
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    city: 'Lucknow',
    locationArea: 'Gomti Nagar',
    subArea: 'Gomti Nagar Extension',
    society: '',
    locality: 'Gomti Nagar Extension',
    landmark: '',
    pincode: '226010',

    // Step 5: Amenities
    amenities: ['24/7 Gated Security & CCTV', '100% Power Backup', 'Covered Car Parking'] as string[],

    // Step 6: Photos & Video
    uploadedImages: [] as string[],
    videoUrl: '',
    videoType: '' as string | undefined,
    isReelFormat: true,
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Hydrate initial contact number from logged in user if available
  React.useEffect(() => {
    const userPhone = user?.mobile;
    if (userPhone && formData.contactNumbers.length === 1 && !formData.contactNumbers[0].number) {
      setFormData((prev) => ({
        ...prev,
        contactNumbers: normalizeContactNumbers([], userPhone),
      }));
    }
  }, [user?.mobile]);

  // Location Hierarchy Custom Inputs & Options
  const [customCity, setCustomCity] = React.useState('');
  const [showAddCustomCity, setShowAddCustomCity] = React.useState(false);
  const [customArea, setCustomArea] = React.useState('');
  const [showAddCustomArea, setShowAddCustomArea] = React.useState(false);
  const [customSubArea, setCustomSubArea] = React.useState('');
  const [showAddCustomSubArea, setShowAddCustomSubArea] = React.useState(false);
  const [customSociety, setCustomSociety] = React.useState('');
  const [showAddCustomSociety, setShowAddCustomSociety] = React.useState(false);

  const stateOptions = React.useMemo(() => Object.keys(LOCATION_HIERARCHY_DATA), []);

  const cityOptions = React.useMemo(() => {
    const st = LOCATION_HIERARCHY_DATA[formData.state];
    return st?.cities ? Object.keys(st.cities) : ['Lucknow', 'Ahmedabad', 'Mumbai', 'Bengaluru', 'New Delhi'];
  }, [formData.state]);

  const areaOptions = React.useMemo(() => {
    const cityData = LOCATION_HIERARCHY_DATA[formData.state]?.cities[formData.city];
    return cityData ? Object.keys(cityData.areas) : ['Gomti Nagar', 'Hazratganj', 'Satellite', 'Bandra West'];
  }, [formData.state, formData.city]);

  const subAreaOptions = React.useMemo(() => {
    const areaData = LOCATION_HIERARCHY_DATA[formData.state]?.cities[formData.city]?.areas[formData.locationArea];
    return areaData?.subAreas || [];
  }, [formData.state, formData.city, formData.locationArea]);

  const societyOptions = React.useMemo(() => {
    const areaData = LOCATION_HIERARCHY_DATA[formData.state]?.cities[formData.city]?.areas[formData.locationArea];
    return areaData?.societies || [];
  }, [formData.state, formData.city, formData.locationArea]);

  const handleAddCustomArea = async () => {
    if (!customArea.trim()) return;
    const name = customArea.trim();
    setFormData((prev) => ({ ...prev, locationArea: name, locality: name }));
    setShowAddCustomArea(false);
    setCustomArea('');
    try {
      await addCustomLocation({
        name,
        type: 'AREA',
        cityName: formData.city,
        stateName: formData.state,
      });
      toast.success('Custom Area Added', `"${name}" added and selected.`);
    } catch (_) {}
  };

  const handleAddCustomSubArea = async () => {
    if (!customSubArea.trim()) return;
    const name = customSubArea.trim();
    setFormData((prev) => ({ ...prev, subArea: name }));
    setShowAddCustomSubArea(false);
    setCustomSubArea('');
    try {
      await addCustomLocation({
        name,
        type: 'SUB_AREA',
        cityName: formData.city,
        stateName: formData.state,
      });
      toast.success('Custom Sub-area Added', `"${name}" added and selected.`);
    } catch (_) {}
  };

  const handleAddCustomSociety = async () => {
    if (!customSociety.trim()) return;
    const name = customSociety.trim();
    setFormData((prev) => ({ ...prev, society: name }));
    setShowAddCustomSociety(false);
    setCustomSociety('');
    try {
      await addCustomLocation({
        name,
        type: 'SOCIETY',
        cityName: formData.city,
        stateName: formData.state,
      });
      toast.success('Custom Society Added', `"${name}" added and selected.`);
    } catch (_) {}
  };


  // Field visibility matrix
  const visibility = React.useMemo(() => {
    return getCategoryFieldVisibility(formData.category, formData.subcategory);
  }, [formData.category, formData.subcategory]);

  // Current category group definition
  const currentCategoryGroup = React.useMemo(() => {
    return CATEGORY_GROUPS.find((g) => g.group === formData.categoryGroup) || CATEGORY_GROUPS[0];
  }, [formData.categoryGroup]);

  // Subcategories available for current group
  const availableSubcategories = React.useMemo(() => {
    return currentCategoryGroup.subcategories;
  }, [currentCategoryGroup]);

  // RERA number validation feedback
  const reraValidation = React.useMemo(() => {
    if (formData.reraRegistered !== 'YES') {
      return { valid: true, message: 'RERA registration not applicable for this listing' };
    }
    return validateReraNumber(formData.reraNumber, formData.reraAuthority);
  }, [formData.reraRegistered, formData.reraNumber, formData.reraAuthority]);

  // Handle Category Group Change
  const handleCategoryGroupChange = (newGroup: string) => {
    const groupDef = CATEGORY_GROUPS.find((g) => g.group === newGroup) || CATEGORY_GROUPS[0];
    const firstSub = groupDef.subcategories[0] || '';
    const defaultListingType = groupDef.supportedListingTypes[0] || 'SALE';

    setFormData((prev) => ({
      ...prev,
      categoryGroup: newGroup,
      category: groupDef.name,
      subcategory: firstSub,
      listingType: groupDef.supportedListingTypes.includes(prev.listingType as any)
        ? prev.listingType
        : (defaultListingType as any),
      // Auto-adjust default RERA for agricultural land or rental
      reraRegistered: newGroup === 'AGRICULTURAL_LAND' ? 'NOT_APPLICABLE' : prev.reraRegistered,
      reraExemptionReason:
        newGroup === 'AGRICULTURAL_LAND' ? 'Agricultural / Non-plotted rural land' : prev.reraExemptionReason,
    }));
  };

  // Auto calculate price per sq ft
  const calculatedPricePerSqFt = React.useMemo(() => {
    const price = Number(formData.priceAmount);
    const area = Number(formData.carpetArea) || Number(formData.area);
    if (price > 0 && area > 0) {
      return Math.round(price / area);
    }
    return 0;
  }, [formData.priceAmount, formData.carpetArea, formData.area]);

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

  const togglePgFacility = (facility: string) => {
    setFormData((prev) => {
      const exists = prev.includedFacilities.includes(facility);
      return {
        ...prev,
        includedFacilities: exists
          ? prev.includedFacilities.filter((f) => f !== facility)
          : [...prev.includedFacilities, facility],
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
      if (!formData.subcategory) {
        toast.warning('Subcategory Required', 'Please select a specific property subcategory.');
        return false;
      }
      if (structureType !== 'INDEPENDENT' && !projectDetails.projectName?.trim()) {
        toast.warning('Project Name Required', 'Please specify the project or complex name in the Property Structure section.');
        return false;
      }

      // Contact Numbers validation
      const validNumbers = formData.contactNumbers.filter((n) => n.number.trim().length >= 8);
      if (validNumbers.length === 0) {
        toast.warning('Contact Number Required', 'Please provide at least one valid 10-digit contact phone number.');
        return false;
      }
      const primaryNumbers = formData.contactNumbers.filter((n) => n.isPrimary && n.number.trim().length > 0);
      if (primaryNumbers.length !== 1) {
        toast.warning('Primary Number Required', 'Please designate exactly one primary contact number.');
        return false;
      }
      const seenNums = new Set<string>();
      for (const n of formData.contactNumbers) {
        const full = `${n.countryCode}${n.number.trim()}`;
        if (n.number.trim().length > 0) {
          if (seenNums.has(full)) {
            toast.warning('Duplicate Contact Number', 'Please remove duplicate phone numbers.');
            return false;
          }
          seenNums.add(full);
        }
      }
    }

    if (step === 2) {
      // Area is always required unless multi-unit specifies unit areas
      const effectiveArea = Number(formData.area) > 0 ? Number(formData.area) : units.length > 0 ? 1000 : 0;
      if (effectiveArea <= 0) {
        toast.warning('Area Required', 'Please provide a valid property area.');
        return false;
      }

      // RERA validation check
      if (formData.reraRegistered === 'YES') {
        if (!formData.reraNumber.trim()) {
          toast.warning('RERA Number Mandatory', 'RERA registration number is required for RERA-registered projects before submission.');
          return false;
        }
        if (!reraValidation.valid) {
          toast.warning('Invalid RERA Format', reraValidation.message);
          return false;
        }
      } else if (formData.reraRegistered === 'NO' || formData.reraRegistered === 'NOT_APPLICABLE') {
        if (!formData.reraExemptionReason) {
          toast.warning('Exemption Reason Required', 'Please select an applicable statutory reason why RERA registration is not required.');
          return false;
        }
      }
    }

    if (step === 3) {
      const effectivePrice = Number(formData.priceAmount) > 0 ? Number(formData.priceAmount) : units.length > 0 ? 1 : 0;
      if (effectivePrice <= 0) {
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

    const isMultiUnit = structureType !== 'INDEPENDENT';
    const computedPrice =
      Number(formData.priceAmount) > 0
        ? Number(formData.priceAmount)
        : units.length > 0
        ? Math.min(...units.map((u) => u.price || u.monthlyRent || 0).filter((p) => p > 0)) || 0
        : 0;

    const computedArea =
      Number(formData.area) > 0
        ? Number(formData.area)
        : units.length > 0
        ? Math.min(...units.map((u) => u.carpetArea || u.plotArea || 0).filter((a) => a > 0)) || 1000
        : 1000;

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
        pricePerSqFt: calculatedPricePerSqFt > 0 ? calculatedPricePerSqFt : undefined,
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
        district: formData.district || formData.city,
        city: formData.city,
        area: formData.locationArea || formData.locality,
        subArea: formData.subArea || '',
        society: formData.society || '',
        locality: formData.locality || formData.subArea || formData.locationArea,
        landmark: formData.landmark || undefined,
        pincode: formData.pincode || undefined,
        coordinates: [80.9462, 26.8467],
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
        customSizes: formData.customSizes || [],
      },
      contactNumbers: formData.contactNumbers.filter((n) => n.number.trim().length > 0),
      rera: {
        isReraRegistered: formData.reraRegistered,
        reraNumber: formData.reraRegistered === 'YES' ? formData.reraNumber.trim() : undefined,
        authority: formData.reraRegistered === 'YES' ? formData.reraAuthority : undefined,
        projectName: formData.reraRegistered === 'YES' && formData.reraProjectName ? formData.reraProjectName.trim() : undefined,
        certificateUrl: formData.reraCertificateUrl || undefined,
        verificationStatus: formData.reraRegistered === 'YES' ? 'PENDING' : 'NOT_APPLICABLE',
        exemptionReason: formData.reraRegistered !== 'YES' ? formData.reraExemptionReason : undefined,
        adminRemarks: formData.reraRemarks || undefined,
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
      status: 'DRAFT',
      isPublished: false,
    };
  };

  // Requirement 7: Form Data Loss Prevention & Offline Draft Persistence
  type SaveState = 'SAVING' | 'SAVED' | 'OFFLINE' | 'RECONNECTING' | 'SYNC_PENDING' | 'ERROR';
  const [saveState, setSaveState] = React.useState<SaveState>('SAVED');
  const [lastSavedTime, setLastSavedTime] = React.useState<Date | null>(null);
  const DRAFT_STORAGE_KEY = 'casa_property_draft_new';
  const draftServerIdRef = React.useRef<string | null>(null);
  const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Online / Offline Detection
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setSaveState('RECONNECTING');
      syncPendingDraftToServer();
    };

    const handleOffline = () => {
      setSaveState('OFFLINE');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Restore draft from browser storage on initial mount
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.formData && (parsed.formData.titleEn || parsed.formData.priceAmount || parsed.formData.area)) {
          setFormData((prev) => ({ ...prev, ...parsed.formData }));
          if (parsed.structureType) setStructureType(parsed.structureType);
          if (parsed.projectDetails) setProjectDetails(parsed.projectDetails);
          if (parsed.units) setUnits(parsed.units);
          if (parsed.serverId) draftServerIdRef.current = parsed.serverId;
          setLastSavedTime(parsed.updatedAt ? new Date(parsed.updatedAt) : new Date());
          toast.info(
            'Draft Restored',
            'Unsynchronized property draft was recovered from local storage.',
          );
        }
      }
    } catch {}
  }, []);

  // Sync to MongoDB server function
  const syncPendingDraftToServer = async () => {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      setSaveState('OFFLINE');
      return;
    }
    if (!formData.titleEn && !formData.category) {
      return;
    }
    setSaveState('SAVING');
    try {
      const payload = buildPayload();
      const result = await createProperty({
        ...payload,
        status: 'DRAFT',
        ...(draftServerIdRef.current ? { id: draftServerIdRef.current } : {}),
      });
      if (result?.id) {
        draftServerIdRef.current = result.id;
      }
      setSaveState('SAVED');
      setLastSavedTime(new Date());
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            formData,
            structureType,
            projectDetails,
            units,
            serverId: draftServerIdRef.current,
            updatedAt: new Date().toISOString(),
          }),
        );
      } catch {}
    } catch {
      setSaveState(typeof window !== 'undefined' && navigator.onLine ? 'ERROR' : 'OFFLINE');
    }
  };

  // Debounced auto-save effect
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          formData,
          structureType,
          projectDetails,
          units,
          serverId: draftServerIdRef.current,
          updatedAt: new Date().toISOString(),
        }),
      );
    } catch {}

    if (!navigator.onLine) {
      setSaveState('OFFLINE');
      return;
    }

    setSaveState('SYNC_PENDING');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      syncPendingDraftToServer();
    }, 8000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [formData, structureType, projectDetails, units]);

  const handleSaveDraft = async () => {
    if (!validateStep(1)) return;
    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      await createProperty({
        ...payload,
        status: 'DRAFT',
        ...(draftServerIdRef.current ? { id: draftServerIdRef.current } : {}),
      });

      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}

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
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4) || !validateStep(6)) return;
    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      const created = await createProperty({
        ...payload,
        status: 'DRAFT',
        ...(draftServerIdRef.current ? { id: draftServerIdRef.current } : {}),
      });
      await submitPropertyForApproval(created.id);

      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}

      toast.success(
        'Listing Submitted',
        'Your property has been submitted for review.',
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
            You must be logged in as an Agent, Broker, Developer, or Property Owner to access the listing wizard.
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

  if (isAuthenticated && isSuperAdminOrAdmin) {
    return (
      <div className="min-h-[70vh] max-w-xl mx-auto px-4 flex items-center justify-center">
        <div className="text-center p-8 bg-casa-surface border border-casa-border-light rounded-2xl shadow-subtle space-y-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-casa-brand mx-auto">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-casa-text-primary">Super Administrator Workspace</h2>
          <p className="text-xs text-casa-text-secondary leading-relaxed max-w-md mx-auto">
            Super Administrators manage users, account statuses, property approvals, reports, and moderation through the Admin Portal. Public marketplace listings are created exclusively by verified property advertisers (Brokers, Agents, Developers, and Property Owners/Sellers).
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <a
              href="http://localhost:3002/properties"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-casa-brand hover:bg-casa-brand-hover text-white text-xs font-semibold transition-all shadow-sm"
            >
              <span>Open Admin Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center py-2.5 px-4 rounded-xl border border-casa-border-light hover:bg-casa-subtle text-casa-text-primary text-xs font-semibold transition-colors"
            >
              Back to Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated && isSuspendedOrInactive) {
    return (
      <div className="min-h-[70vh] max-w-xl mx-auto px-4 flex items-center justify-center">
        <div className="text-center p-8 bg-casa-surface border border-casa-border-light rounded-2xl shadow-subtle space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-casa-text-primary">Account Suspended or Inactive</h2>
          <p className="text-xs text-casa-text-secondary leading-relaxed max-w-md mx-auto">
            Your advertiser account is currently suspended or inactive. All active listings have been temporarily hidden from the public marketplace. Please contact administration for status review.
          </p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && isConsumer) {
    return (
      <div className="min-h-[70vh] max-w-xl mx-auto px-4 flex items-center justify-center">
        <div className="text-center p-8 bg-casa-surface border border-casa-border-light rounded-2xl shadow-subtle space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-600 mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-casa-text-primary">Access Restricted</h2>
          <p className="text-xs text-casa-text-secondary leading-relaxed max-w-md mx-auto">
            Property listing creation is reserved for verified property advertisers (Brokers, Agents, Developers, and Property Owners/Sellers). Property Buyers and Rental Tenants are not permitted to post marketplace listings.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/properties"
              className="inline-flex items-center justify-center py-2.5 px-5 rounded-xl bg-casa-brand hover:bg-casa-brand-hover text-white text-xs font-semibold transition-all shadow-sm"
            >
              Explore Properties
            </Link>
            <Link
              href="/dashboard/purchaser"
              className="inline-flex items-center justify-center py-2.5 px-4 rounded-xl border border-casa-border-light hover:bg-casa-subtle text-casa-text-primary text-xs font-semibold transition-colors"
            >
              Buyer Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated && !isAuthorizedAdvertiser) {
    return (
      <div className="min-h-[70vh] max-w-xl mx-auto px-4 flex items-center justify-center">
        <div className="text-center p-8 bg-casa-surface border border-casa-border-light rounded-2xl shadow-subtle space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-600 mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-casa-text-primary">Advertiser Role Required</h2>
          <p className="text-xs text-casa-text-secondary leading-relaxed max-w-md mx-auto">
            Only eligible property advertisers (Brokers, Agents, Developers, and Property Owners/Sellers) can access property creation.
          </p>
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
          <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary flex items-center gap-2">
            <span>Post New Real Estate Listing</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-casa-brand-subtle text-casa-brand">
              RERA Compliant
            </span>
          </h1>
          <p className="text-xs text-casa-text-secondary">
            Dynamic, category-aware verified listing creation wizard for My Property Marketplace.
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

      {/* Network / Draft Persistence Status Banner */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs bg-casa-surface border border-casa-border-light shadow-xs">
        <div className="flex items-center gap-2">
          {saveState === 'SAVING' && (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
              <span className="text-blue-600 dark:text-blue-400 font-medium">Saving draft to MongoDB...</span>
            </>
          )}
          {saveState === 'SAVED' && (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                All changes saved to server {lastSavedTime ? `at ${lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
              </span>
            </>
          )}
          {saveState === 'OFFLINE' && (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-700 dark:text-amber-400 font-medium">
                Offline — changes saved locally in browser storage
              </span>
            </>
          )}
          {saveState === 'RECONNECTING' && (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-purple-500 animate-spin" />
              <span className="text-purple-600 dark:text-purple-400 font-medium">Reconnecting...</span>
            </>
          )}
          {saveState === 'SYNC_PENDING' && (
            <>
              <Cloud className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-600 dark:text-amber-400 font-medium">Sync pending</span>
            </>
          )}
          {saveState === 'ERROR' && (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-red-600 dark:text-red-400 font-medium">Save failed</span>
              <button
                type="button"
                onClick={syncPendingDraftToServer}
                className="underline text-red-700 dark:text-red-300 ml-1 font-semibold hover:opacity-80"
              >
                Retry
              </button>
            </>
          )}
        </div>

        <div className="text-[11px] text-casa-text-muted">
          Auto-saves drafts locally &amp; to MongoDB
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-casa-surface border border-casa-border-light rounded-2xl p-4 shadow-subtle">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center text-[10px]">
          {[
            { step: 1, label: 'Category & Info' },
            { step: 2, label: 'Specs & RERA' },
            { step: 3, label: 'Pricing Terms' },
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
        {/* STEP 1: Category & Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-casa-border-light pb-3">
              <h2 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-casa-brand text-white text-xs flex items-center justify-center">1</span>
                <span>Category Selection & Basic Information</span>
              </h2>
              <p className="text-xs text-casa-text-secondary mt-0.5">
                Select your property classification to dynamically unlock relevant Indian real estate fields.
              </p>
            </div>

            {/* Category Groups Buttons */}
            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-2">
                Select Property Classification *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CATEGORY_GROUPS.map((cg) => {
                  const isSelected = formData.categoryGroup === cg.group;
                  return (
                    <button
                      type="button"
                      key={cg.group}
                      onClick={() => handleCategoryGroupChange(cg.group)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-casa-brand bg-casa-brand-subtle shadow-xs'
                          : 'border-casa-border-light bg-casa-canvas hover:border-casa-border-dark'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? 'text-casa-brand' : 'text-casa-text-primary'}`}>
                          {cg.name}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-casa-brand" />}
                      </div>
                      <p className="text-[10px] text-casa-text-muted mt-1">
                        {cg.subcategories.slice(0, 3).join(', ')}...
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subcategory & Listing Purpose */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  Subcategory *
                </label>
                <select
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
                >
                  {availableSubcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-casa-text-muted mt-1 block">
                  Category will be stored as: {formData.category} ({formData.subcategory})
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  Listing Purpose / Type *
                </label>
                <select
                  value={formData.listingType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      listingType: e.target.value as any,
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
                >
                  {LISTING_TYPES.filter((lt) => currentCategoryGroup.supportedListingTypes.includes(lt.value as any)).map(
                    (lt) => (
                      <option key={lt.value} value={lt.value}>
                        {lt.label}
                      </option>
                    ),
                  )}
                </select>
                <span className="text-[10px] text-casa-text-muted mt-1 block">
                  Only compatible listing purposes are available for {currentCategoryGroup.name}.
                </span>
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                Property Title (English) *
              </label>
              <input
                type="text"
                required
                placeholder={
                  formData.categoryGroup === 'RESIDENTIAL'
                    ? 'e.g., Luxury 3 BHK High-Rise Apartment with Club Amenities'
                    : formData.categoryGroup === 'COMMERCIAL'
                    ? 'e.g., Grade-A Furnished Office Space in Prime Financial District'
                    : 'e.g., Prime Gated Agricultural Farmland with Deep Borewell'
                }
                value={formData.titleEn}
                onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl focus:ring-2 focus:ring-casa-brand/30 text-casa-text-primary font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                Detailed Property Description *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Detail key architectural highlights, connectivity, title status, layout dimensions, society perks..."
                value={formData.descriptionEn}
                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl focus:ring-2 focus:ring-casa-brand/30 text-casa-text-primary leading-relaxed"
              />
            </div>

            {/* Property Structure & Multi-Unit Inventory Section */}
            <PropertyUnitsManager
              structureType={structureType}
              onStructureTypeChange={(newType) => {
                setStructureType(newType);
                if (newType === 'PLOTTED_DEVELOPMENT') {
                  setFormData((prev) => ({
                    ...prev,
                    categoryGroup: 'PLOT',
                    category: 'Plot',
                    subcategory: 'Residential Plot',
                  }));
                } else if (newType === 'COMMERCIAL_BUILDING') {
                  setFormData((prev) => ({
                    ...prev,
                    categoryGroup: 'SHOP_WAREHOUSE',
                    category: 'Shop / Warehouse',
                    subcategory: 'Showroom',
                  }));
                } else if (newType === 'RESIDENTIAL_BUILDING') {
                  setFormData((prev) => ({
                    ...prev,
                    categoryGroup: 'APARTMENT_FLAT',
                    category: 'Apartment / Flat',
                    subcategory: 'Flat / Apartment',
                  }));
                }
              }}
              projectDetails={projectDetails}
              onProjectDetailsChange={(newDetails) => {
                setProjectDetails(newDetails);
                if (newDetails.projectName && !formData.titleEn) {
                  setFormData((prev) => ({
                    ...prev,
                    titleEn: `${newDetails.projectName} - Prime Real Estate Development`,
                  }));
                }
                if (newDetails.projectAddress && !formData.locality) {
                  setFormData((prev) => ({
                    ...prev,
                    locality: newDetails.projectAddress || '',
                  }));
                }
              }}
              units={units}
              onUnitsChange={setUnits}
            />

            {/* Multiple Contact Numbers Section */}
            <ContactNumbersManager
              contactNumbers={formData.contactNumbers}
              onChange={(next) => setFormData((prev) => ({ ...prev, contactNumbers: next }))}
            />
          </div>
        )}

        {/* STEP 2: Specifications, Dimensions & Dedicated RERA Section */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-casa-border-light pb-3">
              <h2 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-casa-brand text-white text-xs flex items-center justify-center">2</span>
                <span>Dynamic Specifications & RERA Compliance</span>
              </h2>
              <p className="text-xs text-casa-text-secondary mt-0.5">
                Fields shown adapt specifically for {formData.subcategory} ({formData.category}).
              </p>
            </div>

            {/* SECTION A: Category Specific Specifications */}
            <div className="space-y-4 bg-casa-canvas/50 p-4 rounded-2xl border border-casa-border-light">
              <h3 className="text-xs font-bold text-casa-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4 text-casa-brand" />
                <span>Physical Specifications & Dimensions</span>
              </h3>

              {/* Area & Units - Common to all */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                    {visibility.hasPlotDimensions ? 'Plot Area *' : 'Total Area / Super Built-up *'}
                  </label>
                  <input
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Area Unit *</label>
                  <select
                    value={formData.areaUnit}
                    onChange={(e) => setFormData({ ...formData, areaUnit: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                  >
                    <option value="SQ_FT">Sq.Ft</option>
                    <option value="SQ_YARDS">Sq.Yards</option>
                    <option value="SQ_MTR">Sq.Meters</option>
                    <option value="ACRES">Acres</option>
                    <option value="BIGHAS">Bighas</option>
                    <option value="GUNTHA">Guntha</option>
                  </select>
                </div>

                {!visibility.hasPlotDimensions && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Carpet Area</label>
                      <input
                        type="number"
                        placeholder="RERA carpet area"
                        value={formData.carpetArea}
                        onChange={(e) => setFormData({ ...formData, carpetArea: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Built-up Area</label>
                      <input
                        type="number"
                        value={formData.builtUpArea}
                        onChange={(e) => setFormData({ ...formData, builtUpArea: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Residential Fields: Bedrooms, Bathrooms, Balconies */}
              {visibility.hasBedrooms && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Bedrooms (BHK)</label>
                    <input
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Bathrooms</label>
                    <input
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Balconies</label>
                    <input
                      type="number"
                      value={formData.balconies}
                      onChange={(e) => setFormData({ ...formData, balconies: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    />
                  </div>
                </div>
              )}

              {/* Commercial Specific Spaces */}
              {visibility.hasCommercialSpaces && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Cabins</label>
                    <input
                      type="number"
                      placeholder="e.g., 4"
                      value={formData.cabins}
                      onChange={(e) => setFormData({ ...formData, cabins: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Workstations</label>
                    <input
                      type="number"
                      placeholder="e.g., 25"
                      value={formData.workstations}
                      onChange={(e) => setFormData({ ...formData, workstations: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Washrooms</label>
                    <input
                      type="number"
                      placeholder="e.g., 2"
                      value={formData.washrooms}
                      onChange={(e) => setFormData({ ...formData, washrooms: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Power Backup (kVA)</label>
                    <input
                      type="number"
                      placeholder="e.g., 50"
                      value={formData.powerBackupKva}
                      onChange={(e) => setFormData({ ...formData, powerBackupKva: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    />
                  </div>
                </div>
              )}

              {/* Warehouse / Godown Specific Specs */}
              {visibility.showWarehouseSpecs && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                      Ceiling / Clear Height (ft) *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 28"
                      value={formData.ceilingHeightFt}
                      onChange={(e) => setFormData({ ...formData, ceilingHeightFt: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                      Loading / Unloading Access *
                    </label>
                    <select
                      value={formData.loadingAccess}
                      onChange={(e) => setFormData({ ...formData, loadingAccess: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    >
                      <option value="DOCK_HIGH">Dock High (Standard Loading Bay)</option>
                      <option value="GROUND_LEVEL">Ground Level / Grade Doors</option>
                      <option value="RAMP_ACCESS">Ramp Access for Forklifts & Trucks</option>
                      <option value="CONTAINER_TRUCK_DIRECT">Direct Container Truck Access</option>
                    </select>
                  </div>
                </div>
              )}

              {/* PG / Paying Guest Specs */}
              {visibility.showPgSpecs && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                      Accommodation Type *
                    </label>
                    <select
                      value={formData.accommodationType}
                      onChange={(e) => setFormData({ ...formData, accommodationType: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    >
                      <option value="PG_HOSTEL">PG / Student Hostel</option>
                      <option value="COLIVING_SUITE">Co-living Luxury Suite</option>
                      <option value="MANAGED_APARTMENT">Managed PG Apartment</option>
                      <option value="PRIVATE_ROOM">Private PG Room</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                      Sharing / Room Type *
                    </label>
                    <select
                      value={formData.sharingType}
                      onChange={(e) => setFormData({ ...formData, sharingType: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    >
                      <option value="SINGLE">Single Occupancy (Private Room)</option>
                      <option value="DOUBLE">Double Sharing (2 Beds)</option>
                      <option value="TRIPLE">Triple Sharing (3 Beds)</option>
                      <option value="FOUR_PLUS">Multiple / 4+ Sharing (Dorm)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                      Available Beds / Units *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 2"
                      value={formData.availableBeds}
                      onChange={(e) => setFormData({ ...formData, availableBeds: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    />
                  </div>
                </div>
              )}

              {/* Plot Dimensions for Land/Plot */}
              {visibility.hasPlotDimensions && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Length (ft)</label>
                    <input
                      type="number"
                      placeholder="e.g., 60"
                      value={formData.plotLength}
                      onChange={(e) => setFormData({ ...formData, plotLength: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Breadth / Frontage (ft)</label>
                    <input
                      type="number"
                      placeholder="e.g., 40"
                      value={formData.plotBreadth}
                      onChange={(e) => setFormData({ ...formData, plotBreadth: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Facing Road Width (ft)</label>
                    <input
                      type="number"
                      placeholder="e.g., 40"
                      value={formData.roadWidthFt}
                      onChange={(e) => setFormData({ ...formData, roadWidthFt: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Open Sides</label>
                    <select
                      value={formData.openSides}
                      onChange={(e) => setFormData({ ...formData, openSides: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    >
                      <option value="1">1 Side Open</option>
                      <option value="2">2 Sides Open (Corner)</option>
                      <option value="3">3 Sides Open</option>
                      <option value="4">4 Sides Open</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Common Property Attributes: Furnishing, Facing, Parking, Floor */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {visibility.hasFurnishing && (
                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Furnishing</label>
                    <select
                      value={formData.furnishing}
                      onChange={(e) => setFormData({ ...formData, furnishing: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    >
                      <option value="FULLY_FURNISHED">Fully Furnished</option>
                      <option value="SEMI_FURNISHED">Semi Furnished</option>
                      <option value="UNFURNISHED">Unfurnished</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Facing</label>
                  <select
                    value={formData.facing}
                    onChange={(e) => setFormData({ ...formData, facing: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                  >
                    <option value="North">North</option>
                    <option value="East">East</option>
                    <option value="North-East">North-East</option>
                    <option value="West">West</option>
                    <option value="South">South</option>
                  </select>
                </div>

                {visibility.hasFloors && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Floor Level</label>
                      <input
                        type="text"
                        placeholder="e.g., 3rd Floor"
                        value={formData.floorLevel}
                        onChange={(e) => setFormData({ ...formData, floorLevel: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Total Floors</label>
                      <input
                        type="number"
                        placeholder="e.g., 14"
                        value={formData.totalFloors}
                        onChange={(e) => setFormData({ ...formData, totalFloors: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Status, Age, Ownership */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Construction Status</label>
                  <select
                    value={formData.constructionStatus}
                    onChange={(e) => setFormData({ ...formData, constructionStatus: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                  >
                    <option value="READY_TO_MOVE">Ready to Move</option>
                    <option value="UNDER_CONSTRUCTION">Under Construction</option>
                    <option value="RESALE">Resale</option>
                    <option value="NEW_LAUNCH">New Launch</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Age of Property</label>
                  <select
                    value={formData.propertyAge}
                    onChange={(e) => setFormData({ ...formData, propertyAge: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                  >
                    <option value="New Construction">New Construction (&lt; 1 yr)</option>
                    <option value="1-3 years">1-3 years</option>
                    <option value="3-5 years">3-5 years</option>
                    <option value="5-10 years">5-10 years</option>
                    <option value="10+ years">10+ years</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Title / Ownership Type</label>
                  <select
                    value={formData.ownershipType}
                    onChange={(e) => setFormData({ ...formData, ownershipType: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                  >
                    <option value="Freehold">Freehold Title</option>
                    <option value="Leasehold">Leasehold (Govt / Authority)</option>
                    <option value="Co-operative Society">Co-operative Society</option>
                    <option value="Power of Attorney">Power of Attorney</option>
                  </select>
                </div>
              </div>

              {/* Possession Status & Date (for Sale listings) */}
              {formData.listingType === 'SALE' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Possession Status</label>
                    <select
                      value={formData.possessionStatus}
                      onChange={(e) => setFormData({ ...formData, possessionStatus: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    >
                      <option value="READY_TO_MOVE">Ready to Move</option>
                      <option value="UNDER_CONSTRUCTION">Under Construction</option>
                      <option value="RESALE">Resale</option>
                      <option value="NEW_LAUNCH">New Launch</option>
                    </select>
                  </div>

                  {formData.possessionStatus === 'UNDER_CONSTRUCTION' && (
                    <div>
                      <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">Expected Possession Date</label>
                      <input
                        type="date"
                        value={formData.possessionDate}
                        onChange={(e) => setFormData({ ...formData, possessionDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Custom Size Entries */}
              <CustomSizesManager
                customSizes={formData.customSizes || []}
                onChange={(sizes) => setFormData((prev) => ({ ...prev, customSizes: sizes }))}
              />
            </div>

            {/* SECTION B: Dedicated Indian RERA Compliance Section */}
            <div className="space-y-4 bg-emerald-500/5 p-5 rounded-2xl border-2 border-emerald-500/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-casa-text-primary">
                      Indian RERA Registration & Statutory Compliance
                    </h3>
                    <p className="text-[11px] text-casa-text-secondary">
                      Mandated by Real Estate (Regulation and Development) Act 2016 for commercial & residential projects.
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Audit Enforced
                </span>
              </div>

              {/* RERA Registered Radio */}
              <div>
                <label className="text-xs font-bold text-casa-text-primary block mb-2">
                  Is this property / project RERA Registered? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { value: 'YES', label: 'Yes — RERA Registered Project', desc: 'Promoter / builder registered under State RERA' },
                    { value: 'NO', label: 'No — Exempt or Unregistered', desc: 'Completed resale with OC or individual build' },
                    { value: 'NOT_APPLICABLE', label: 'Not Applicable', desc: 'Rural / agricultural land or individual tenancy' },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          reraRegistered: opt.value as any,
                          reraExemptionReason:
                            opt.value !== 'YES' && !formData.reraExemptionReason
                              ? RERA_EXEMPTION_REASONS[0]
                              : formData.reraExemptionReason,
                        })
                      }
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.reraRegistered === opt.value
                          ? 'border-emerald-600 bg-emerald-500/15 shadow-2xs font-semibold'
                          : 'border-casa-border-light bg-casa-surface hover:border-casa-border-dark'
                      }`}
                    >
                      <div className="text-xs font-bold text-casa-text-primary">{opt.label}</div>
                      <div className="text-[10px] text-casa-text-muted mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* If RERA Registered: YES */}
              {formData.reraRegistered === 'YES' && (
                <div className="space-y-3.5 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                        State RERA Authority *
                      </label>
                      <select
                        value={formData.reraAuthority}
                        onChange={(e) => setFormData({ ...formData, reraAuthority: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary font-medium"
                      >
                        {RERA_AUTHORITIES.map((auth) => (
                          <option key={auth.code} value={auth.code}>
                            {auth.name} ({auth.state})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                        RERA Registration Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., UPRERAPRJ12345 or P51800012345"
                        value={formData.reraNumber}
                        onChange={(e) => setFormData({ ...formData, reraNumber: e.target.value })}
                        className={`w-full px-3 py-2 text-xs bg-casa-surface border rounded-xl text-casa-text-primary font-mono font-bold ${
                          formData.reraNumber
                            ? reraValidation.valid
                              ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                              : 'border-amber-500 ring-1 ring-amber-500/30'
                            : 'border-casa-border-light'
                        }`}
                      />
                      {formData.reraNumber && (
                        <div
                          className={`text-[10px] mt-1 flex items-center gap-1 ${
                            reraValidation.valid ? 'text-emerald-600 font-semibold' : 'text-amber-600'
                          }`}
                        >
                          {reraValidation.valid ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          <span>{reraValidation.message}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                        RERA Project Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Godrej Emerald Heights Phase 2"
                        value={formData.reraProjectName}
                        onChange={(e) => setFormData({ ...formData, reraProjectName: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                      RERA Registration Certificate / Public URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://uprera.org/project/details/12345"
                      value={formData.reraCertificateUrl}
                      onChange={(e) => setFormData({ ...formData, reraCertificateUrl: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    />
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>
                      <strong>Audit Notice:</strong> Upon submission, your listing status will be set to{' '}
                      <span className="font-bold underline">Pending RERA Verification</span>. My Property Compliance Admins will audit your registration number before conferring the verified green checkmark badge.
                    </span>
                  </div>
                </div>
              )}

              {/* If RERA Registered: NO or NOT_APPLICABLE */}
              {formData.reraRegistered !== 'YES' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                      Statutory Exemption Rationale *
                    </label>
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

                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                      Additional Exemption Details / Remarks (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Occupancy certificate received in 2019, direct individual resale"
                      value={formData.reraRemarks}
                      onChange={(e) => setFormData({ ...formData, reraRemarks: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Dynamic Pricing & Commercial Terms */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-casa-border-light pb-3">
              <h2 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-casa-brand text-white text-xs flex items-center justify-center">3</span>
                <span>
                  {formData.listingType === 'SALE'
                    ? 'Sale Pricing & Financial Terms'
                    : formData.listingType === 'PG_COLIVING'
                    ? 'PG / Co-Living Rental & Facility Tariffs'
                    : 'Lease & Rental Commercial Terms'}
                </span>
              </h2>
              <p className="text-xs text-casa-text-secondary mt-0.5">
                Financial terms tailored specifically for listing type: {formData.listingType}.
              </p>
            </div>

            {/* Price Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  {formData.listingType === 'SALE'
                    ? 'Expected Sale Price (INR ₹) *'
                    : formData.listingType === 'PG_COLIVING'
                    ? 'Tariff per Bed / Room per Month (INR ₹) *'
                    : 'Monthly Rent / Lease Amount (INR ₹) *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-casa-text-muted text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    placeholder="e.g., 8500000"
                    value={formData.priceAmount}
                    onChange={(e) => setFormData({ ...formData, priceAmount: e.target.value })}
                    className="w-full pl-8 pr-3 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-bold"
                  />
                </div>
                {formData.priceAmount && (
                  <p className="text-[11px] text-casa-brand font-bold mt-1">
                    Display: {formatPrice(Number(formData.priceAmount))}
                    {calculatedPricePerSqFt > 0 && ` (₹${calculatedPricePerSqFt.toLocaleString()}/sq.ft)`}
                  </p>
                )}
              </div>

              {formData.listingType === 'SALE' ? (
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                    Booking / Token Amount (INR ₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 500000"
                    value={formData.bookingAmount}
                    onChange={(e) => setFormData({ ...formData, bookingAmount: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                    Security Deposit (INR ₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 50000"
                    value={formData.securityDeposit}
                    onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  />
                </div>
              )}
            </div>

            {/* Maintenance & Payer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  Society Maintenance Charges (INR ₹ / month)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 3500"
                  value={formData.maintenance}
                  onChange={(e) => setFormData({ ...formData, maintenance: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                />
              </div>

              {formData.listingType !== 'SALE' && (
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                    Maintenance Paid By
                  </label>
                  <select
                    value={formData.maintenancePayer}
                    onChange={(e) => setFormData({ ...formData, maintenancePayer: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                  >
                    <option value="Owner">Included in Rent (Owner Pays)</option>
                    <option value="Tenant">Additional (Tenant Pays Society Directly)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Lease Specifics */}
            {(formData.listingType === 'RENT' ||
              formData.listingType === 'LEASE' ||
              formData.listingType === 'COMMERCIAL_LEASE') && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-casa-canvas rounded-2xl border border-casa-border-light">
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Lease Duration</label>
                  <select
                    value={formData.leaseDurationMonths}
                    onChange={(e) => setFormData({ ...formData, leaseDurationMonths: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                  >
                    <option value="11">11 Months</option>
                    <option value="24">24 Months</option>
                    <option value="36">36 Months</option>
                    <option value="60">5 Years</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Lock-in Period</label>
                  <select
                    value={formData.lockInPeriodMonths}
                    onChange={(e) => setFormData({ ...formData, lockInPeriodMonths: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                  >
                    <option value="0">None</option>
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Notice Period</label>
                  <select
                    value={formData.noticePeriodMonths}
                    onChange={(e) => setFormData({ ...formData, noticePeriodMonths: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                  >
                    <option value="1">1 Month</option>
                    <option value="2">2 Months</option>
                    <option value="3">3 Months</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Annual Escalation %</label>
                  <input
                    type="number"
                    placeholder="e.g., 5"
                    value={formData.rentEscalationPercentage}
                    onChange={(e) => setFormData({ ...formData, rentEscalationPercentage: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
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
                    className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
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
                  <div className="sm:col-span-2 pt-1">
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1">Bachelor Preferences</label>
                    <select
                      value={formData.bachelorPreferences}
                      onChange={(e) => setFormData({ ...formData, bachelorPreferences: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    >
                      <option value="BOYS">Boys</option>
                      <option value="GIRLS">Girls</option>
                      <option value="BOYS_AND_GIRLS">Boys and Girls</option>
                      <option value="NOT_APPLICABLE">Not applicable</option>
                    </select>
                  </div>
                )}

                <div className="sm:col-span-2 pt-1">
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">
                    Available From (Tenant Availability Date)
                  </label>
                  <input
                    type="date"
                    value={formData.availableFrom}
                    onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1">Brokerage / Commission (INR ₹)</label>
                  <input
                    type="number"
                    placeholder="e.g., 0 (Zero Brokerage)"
                    value={formData.brokerageAmount}
                    onChange={(e) => setFormData({ ...formData, brokerageAmount: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                  />
                </div>
              </div>
            )}

            {/* PG / Co-living Specifics */}
            {formData.listingType === 'PG_COLIVING' && (
              <div className="space-y-4 p-4 bg-casa-canvas rounded-2xl border border-casa-border-light">
                <h3 className="text-xs font-bold text-casa-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-casa-brand" />
                  <span>PG / Co-Living Arrangement & Inclusions</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1">Tariff Model</label>
                    <select
                      value={formData.pgPricingModel}
                      onChange={(e) => setFormData({ ...formData, pgPricingModel: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    >
                      <option value="PER_BED">Per Bed</option>
                      <option value="PER_ROOM">Per Room</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1">Occupancy</label>
                    <select
                      value={formData.occupancyType}
                      onChange={(e) => setFormData({ ...formData, occupancyType: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    >
                      <option value="SINGLE">Single Private Room</option>
                      <option value="DOUBLE">Double Sharing</option>
                      <option value="TRIPLE">Triple Sharing</option>
                      <option value="FOUR_PLUS">4+ Sharing Dorm</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1">Meals Included</label>
                    <select
                      value={formData.mealsIncluded}
                      onChange={(e) => setFormData({ ...formData, mealsIncluded: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    >
                      <option value="ALL_MEALS">Breakfast, Lunch & Dinner</option>
                      <option value="BREAKFAST_AND_DINNER">Breakfast & Dinner</option>
                      <option value="BREAKFAST_ONLY">Breakfast Only</option>
                      <option value="NONE">No Meals (Self Cooking)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1">Gender Stay</label>
                    <select
                      value={formData.genderAccommodation}
                      onChange={(e) => setFormData({ ...formData, genderAccommodation: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-casa-surface border border-casa-border-light rounded-xl text-casa-text-primary"
                    >
                      <option value="ANY">Co-ed / All Welcome</option>
                      <option value="FEMALE_ONLY">Females Only</option>
                      <option value="MALE_ONLY">Males Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-2">
                    Included PG Facilities
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PG_FACILITIES_OPTIONS.map((fac) => {
                      const isChecked = formData.includedFacilities.includes(fac);
                      return (
                        <button
                          type="button"
                          key={fac}
                          onClick={() => togglePgFacility(fac)}
                          className={`p-2 rounded-lg border text-left text-[11px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                            isChecked
                              ? 'bg-casa-brand-subtle border-casa-brand text-casa-brand font-semibold'
                              : 'bg-casa-surface border-casa-border-light text-casa-text-secondary'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                              isChecked ? 'bg-casa-brand border-casa-brand text-white' : 'border-casa-border-light'
                            }`}
                          >
                            {isChecked && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <span className="truncate">{fac}</span>
                        </button>
                      );
                    })}
                  </div>
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
                Price is open for direct buyer negotiation
              </label>
            </div>
          </div>
        )}

        {/* STEP 4: Geographic Location */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="border-b border-casa-border-light pb-3">
              <h2 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-casa-brand text-white text-xs flex items-center justify-center">4</span>
                <span>Geographic Location</span>
              </h2>
              <p className="text-xs text-casa-text-secondary mt-0.5">
                Accurate micro-market, locality, and landmark for buyer discovery.
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
                placeholder="Type your locality or micro-market (e.g. Gomti Nagar, Bandra, Whitefield, Satellite)..."
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

            {/* Dependent Structured Location Hierarchy: State -> City -> Area -> Sub-area -> Society */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Level 1: State */}
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  1. State *
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => {
                    const nextState = e.target.value;
                    const citiesInState = LOCATION_HIERARCHY_DATA[nextState]?.cities
                      ? Object.keys(LOCATION_HIERARCHY_DATA[nextState].cities)
                      : [];
                    const nextCity = citiesInState[0] || 'Lucknow';
                    const areasInCity = LOCATION_HIERARCHY_DATA[nextState]?.cities[nextCity]?.areas
                      ? Object.keys(LOCATION_HIERARCHY_DATA[nextState].cities[nextCity].areas)
                      : [];
                    const nextArea = areasInCity[0] || '';
                    const nextSubAreas = LOCATION_HIERARCHY_DATA[nextState]?.cities[nextCity]?.areas[nextArea]?.subAreas || [];
                    const nextSocieties = LOCATION_HIERARCHY_DATA[nextState]?.cities[nextCity]?.areas[nextArea]?.societies || [];

                    setFormData({
                      ...formData,
                      state: nextState,
                      city: nextCity,
                      locationArea: nextArea,
                      subArea: nextSubAreas[0] || '',
                      society: nextSocieties[0] || '',
                      locality: nextArea,
                    });
                  }}
                  className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium focus:outline-none focus:border-casa-brand"
                >
                  {stateOptions.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level 2: City */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-casa-text-primary">
                    2. City *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomCity(!showAddCustomCity)}
                    className="text-[11px] font-semibold text-casa-brand hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showAddCustomCity ? 'Pick from List' : '+ Add Custom City'}</span>
                  </button>
                </div>

                {showAddCustomCity ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type custom city name..."
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-brand rounded-xl text-casa-text-primary"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customCity.trim()) {
                          setFormData({ ...formData, city: customCity.trim() });
                          setShowAddCustomCity(false);
                          setCustomCity('');
                          toast.success('City Set', `"${customCity.trim()}" selected as city.`);
                        }
                      }}
                      className="px-3 py-2 bg-casa-brand text-white rounded-xl text-xs font-semibold"
                    >
                      Set
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.city}
                    onChange={(e) => {
                      const nextCity = e.target.value;
                      const cityData = LOCATION_HIERARCHY_DATA[formData.state]?.cities[nextCity];
                      const areasInCity = cityData?.areas ? Object.keys(cityData.areas) : [];
                      const nextArea = areasInCity[0] || '';
                      const nextSubAreas = cityData?.areas[nextArea]?.subAreas || [];
                      const nextSocieties = cityData?.areas[nextArea]?.societies || [];

                      setFormData({
                        ...formData,
                        city: nextCity,
                        locationArea: nextArea,
                        subArea: nextSubAreas[0] || '',
                        society: nextSocieties[0] || '',
                        locality: nextArea,
                      });
                    }}
                    className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium focus:outline-none focus:border-casa-brand"
                  >
                    {cityOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Level 3: Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-casa-text-primary">
                  3. Area / Locality *
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCustomArea(!showAddCustomArea)}
                  className="text-[11px] font-semibold text-casa-brand hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{showAddCustomArea ? 'Pick from List' : '+ Add Custom Area'}</span>
                </button>
              </div>

              {showAddCustomArea ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter custom area name (e.g. Science City, Alambagh, Jodhpur Gam)..."
                    value={customArea}
                    onChange={(e) => setCustomArea(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-brand rounded-xl text-casa-text-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomArea}
                    className="px-4 py-2 bg-casa-brand text-white rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer"
                  >
                    Add & Select
                  </button>
                </div>
              ) : (
                <select
                  value={formData.locationArea}
                  onChange={(e) => {
                    const nextArea = e.target.value;
                    const areaData = LOCATION_HIERARCHY_DATA[formData.state]?.cities[formData.city]?.areas[nextArea];
                    const nextSubAreas = areaData?.subAreas || [];
                    const nextSocieties = areaData?.societies || [];

                    setFormData({
                      ...formData,
                      locationArea: nextArea,
                      locality: nextArea,
                      subArea: nextSubAreas[0] || '',
                      society: nextSocieties[0] || '',
                    });
                  }}
                  className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium focus:outline-none focus:border-casa-brand"
                >
                  {areaOptions.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                  {formData.locationArea && !areaOptions.includes(formData.locationArea) && (
                    <option value={formData.locationArea}>{formData.locationArea} (Custom)</option>
                  )}
                </select>
              )}
            </div>

            {/* Level 4 & 5: Sub-area & Society */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Level 4: Sub-area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-casa-text-primary">
                    4. Sub-area / Sector / Block
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomSubArea(!showAddCustomSubArea)}
                    className="text-[11px] font-semibold text-casa-brand hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showAddCustomSubArea ? 'Pick from List' : '+ Add Custom Sub-area'}</span>
                  </button>
                </div>

                {showAddCustomSubArea ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type custom sub-area / sector..."
                      value={customSubArea}
                      onChange={(e) => setCustomSubArea(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-brand rounded-xl text-casa-text-primary"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSubArea}
                      className="px-3.5 py-2 bg-casa-brand text-white rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {subAreaOptions.length > 0 ? (
                      <select
                        value={formData.subArea}
                        onChange={(e) => setFormData({ ...formData, subArea: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium focus:outline-none focus:border-casa-brand"
                      >
                        <option value="">Select Sub-area / Sector...</option>
                        {subAreaOptions.map((sa) => (
                          <option key={sa} value={sa}>
                            {sa}
                          </option>
                        ))}
                        {formData.subArea && !subAreaOptions.includes(formData.subArea) && (
                          <option value={formData.subArea}>{formData.subArea} (Custom)</option>
                        )}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. Sector 4, Extension, Block C"
                        value={formData.subArea}
                        onChange={(e) => setFormData({ ...formData, subArea: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Level 5: Society */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-casa-text-primary">
                    5. Society / Project / Complex
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomSociety(!showAddCustomSociety)}
                    className="text-[11px] font-semibold text-casa-brand hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showAddCustomSociety ? 'Pick from List' : '+ Add Custom Society'}</span>
                  </button>
                </div>

                {showAddCustomSociety ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type custom society name..."
                      value={customSociety}
                      onChange={(e) => setCustomSociety(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-brand rounded-xl text-casa-text-primary"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSociety}
                      className="px-3.5 py-2 bg-casa-brand text-white rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {societyOptions.length > 0 ? (
                      <select
                        value={formData.society}
                        onChange={(e) => setFormData({ ...formData, society: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium focus:outline-none focus:border-casa-brand"
                      >
                        <option value="">Select Society / Gated Project...</option>
                        {societyOptions.map((soc) => (
                          <option key={soc} value={soc}>
                            {soc}
                          </option>
                        ))}
                        {formData.society && !societyOptions.includes(formData.society) && (
                          <option value={formData.society}>{formData.society} (Custom)</option>
                        )}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. Omaxe Residency, DLF Park, Goyal Enclave"
                        value={formData.society}
                        onChange={(e) => setFormData({ ...formData, society: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Landmark & PIN Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g., Near Phoenix Palassio Mall, Opposite Metro Pillar 140"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  PIN Code
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
                <span>Select Society & Property Amenities</span>
              </h2>
              <p className="text-xs text-casa-text-secondary mt-0.5">
                Highlight lifestyle, security, and infrastructure amenities to attract premium purchasers.
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
        )}

        {/* STEP 7: Live Marketplace Preview */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div className="border-b border-casa-border-light pb-3">
              <h2 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-casa-brand text-white text-xs flex items-center justify-center">7</span>
                <span>Live Marketplace Listing Preview</span>
              </h2>
              <p className="text-xs text-casa-text-secondary mt-0.5">
                Review how your listing and RERA credentials appear to prospective buyers on My Property Marketplace.
              </p>
            </div>

            <div className="max-w-xl mx-auto bg-casa-canvas border border-casa-border-light rounded-2xl overflow-hidden shadow-subtle space-y-3">
              <div className="relative h-56 bg-casa-subtle">
                {formData.uploadedImages.length > 0 ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={formData.uploadedImages[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-casa-text-muted">
                    <Home className="w-12 h-12 opacity-30" />
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-casa-brand text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                  {formData.category} • {formData.subcategory}
                </div>
                <div className="absolute top-3 right-3 bg-casa-surface/90 backdrop-blur-sm text-casa-text-primary text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                  {formData.listingType}
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-casa-brand">
                      {formatPrice(Number(formData.priceAmount) || 0)}
                    </span>
                    {calculatedPricePerSqFt > 0 && (
                      <span className="text-xs text-casa-text-muted ml-2">
                        (₹{calculatedPricePerSqFt.toLocaleString()}/sq.ft)
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-casa-text-muted">
                    {formData.isNegotiable ? 'Negotiable' : 'Fixed Price'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-casa-text-primary line-clamp-2">
                  {formData.titleEn || 'Untitled Property'}
                </h3>

                <div className="flex items-center gap-1 text-xs text-casa-text-muted">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-casa-brand" />
                  <span>{formData.locality || 'Locality'}, {formData.city}, {formData.state}</span>
                </div>

                {/* RERA Badge Card */}
                <div className="p-3 rounded-xl border flex items-center justify-between gap-2 text-xs bg-casa-surface border-casa-border-light">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-casa-text-primary block">
                        {formData.reraRegistered === 'YES'
                          ? `RERA: ${formData.reraNumber || 'Registration Pending'} (${formData.reraAuthority})`
                          : `RERA Exemption: ${formData.reraExemptionReason || 'Individual Exemption'}`}
                      </span>
                      <span className="text-[10px] text-casa-text-muted">
                        {formData.reraRegistered === 'YES'
                          ? 'Verification Status: PENDING MY PROPERTY ADMIN AUDIT'
                          : 'Exempt from mandatory promoter registration'}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    formData.reraRegistered === 'YES'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-casa-subtle text-casa-text-muted'
                  }`}>
                    {formData.reraRegistered === 'YES' ? 'PENDING' : 'EXEMPT'}
                  </span>
                </div>

                {/* Category-Specific Specs Summary */}
                <div className="pt-2 border-t border-casa-border-light grid grid-cols-3 gap-2 text-[10px] text-center text-casa-text-secondary">
                  {visibility.showBedrooms && (
                    <div className="p-2 bg-casa-surface rounded-lg">
                      <span className="font-bold block">{formData.bedrooms} BHK</span>
                      <span>{formData.bathrooms} Baths</span>
                    </div>
                  )}
                  {visibility.showCommercialSpecs && (
                    <div className="p-2 bg-casa-surface rounded-lg">
                      <span className="font-bold block">{formData.cabins || '0'} Cabins</span>
                      <span>{formData.workstations || '0'} Seats</span>
                    </div>
                  )}
                  {visibility.showWarehouseSpecs && (
                    <div className="p-2 bg-casa-surface rounded-lg">
                      <span className="font-bold block">{formData.ceilingHeightFt || '—'} ft Height</span>
                      <span>{formData.loadingAccess?.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                  {visibility.showPgSpecs && (
                    <div className="p-2 bg-casa-surface rounded-lg">
                      <span className="font-bold block">{formData.sharingType} Sharing</span>
                      <span>{formData.availableBeds} Bed(s) Available</span>
                    </div>
                  )}
                  <div className="p-2 bg-casa-surface rounded-lg">
                    <span className="font-bold block">{formData.area} {formData.areaUnit}</span>
                    <span>{formData.constructionStatus?.replace(/_/g, ' ') || 'Active'}</span>
                  </div>
                  <div className="p-2 bg-casa-surface rounded-lg truncate">
                    <span className="font-bold block">{formData.furnishing?.replace(/_/g, ' ') || 'Ready'}</span>
                    <span>Facing: {formData.facing}</span>
                  </div>
                </div>

                {/* Contact Numbers in Preview */}
                <div className="pt-2 border-t border-casa-border-light">
                  <span className="text-[10px] font-bold text-casa-text-muted uppercase tracking-wider block mb-1">
                    Verified Contact Numbers
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.contactNumbers.filter((n) => n.number.trim()).map((n, i) => (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full ${
                          n.isPrimary
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30'
                            : 'bg-casa-surface text-casa-text-primary border border-casa-border-light'
                        }`}
                      >
                        {n.countryCode} {n.number}
                        {n.isPrimary && <span className="text-[9px] uppercase tracking-wider font-extrabold">(Primary)</span>}
                      </span>
                    ))}
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
              <h2 className="text-xl font-bold text-casa-text-primary">Ready for MyProperty Moderation</h2>
              <p className="text-xs text-casa-text-secondary leading-relaxed">
                Your listing details, RERA compliance filings, and PC photos have been validated. Submit now to send to MyProperty admin review, or save as a draft to edit later.
              </p>
            </div>

            <div className="p-4 bg-casa-canvas rounded-2xl border border-casa-border-light text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-casa-text-muted">Title:</span>
                <span className="font-semibold text-casa-text-primary max-w-[240px] truncate">{formData.titleEn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-casa-text-muted">Category:</span>
                <span className="font-semibold text-casa-text-primary">
                  {formData.category} &gt; {formData.subcategory} ({formData.listingType})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-casa-text-muted">Price:</span>
                <span className="font-bold text-casa-brand">{formatPrice(Number(formData.priceAmount) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-casa-text-muted">RERA Compliance:</span>
                <span className="font-semibold text-casa-text-primary">
                  {formData.reraRegistered === 'YES'
                    ? `Registered (${formData.reraNumber}) - Pending Audit`
                    : `Exempt (${formData.reraExemptionReason})`}
                </span>
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
                <span>{isSubmitting ? 'Submitting to Review...' : 'Submit for MyProperty Review'}</span>
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
