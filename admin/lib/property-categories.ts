export type CategoryGroup =
  | 'HOUSE_HOME'
  | 'APARTMENT_FLAT'
  | 'PLOT'
  | 'SHOP_WAREHOUSE'
  | 'LEASE'
  | 'LITIGATED'
  | 'PG'
  | 'RESIDENTIAL'
  | 'COMMERCIAL'
  | 'AGRICULTURAL_LAND'
  | 'LAND'
  | 'AGRICULTURAL';

export const LISTING_TYPES = [
  { value: 'SALE', label: 'For Sale' },
  { value: 'RENT', label: 'For Rent' },
  { value: 'LEASE', label: 'Lease' },
  { value: 'PG_COLIVING', label: 'PG / Co-living' },
  { value: 'COMMERCIAL_LEASE', label: 'Commercial Lease' },
];

export const CATEGORY_GROUPS = [
  {
    group: 'HOUSE_HOME',
    title: 'House / Home',
    name: 'House / Home',
    description: 'Independent houses, villas, builder floors, duplexes, and row houses',
    subcategories: [
      'Independent House',
      'Villa',
      'Builder Floor',
      'Row House',
      'Duplex / Bungalow',
    ],
    supportedListingTypes: ['SALE', 'RENT', 'LEASE'],
  },
  {
    group: 'APARTMENT_FLAT',
    title: 'Apartment / Flat',
    name: 'Apartment / Flat',
    description: 'Multi-storey condominiums, flats, studio apartments, and luxury gated society homes',
    subcategories: [
      'Flat / Apartment',
      'High-rise Condominium',
      'Penthouse',
      'Studio Apartment',
      'Gated Society Flat',
    ],
    supportedListingTypes: ['SALE', 'RENT', 'LEASE'],
  },
  {
    group: 'PLOT',
    title: 'Plot',
    name: 'Plot',
    description: 'Approved residential plotted layouts, commercial land parcels, and acreage',
    subcategories: [
      'Residential Plot',
      'Gated Township Plot',
      'Commercial Plot',
      'Agricultural Land',
      'Industrial Plot',
    ],
    supportedListingTypes: ['SALE', 'LEASE'],
  },
  {
    group: 'SHOP_WAREHOUSE',
    title: 'Shop / Warehouse',
    name: 'Shop / Warehouse',
    description: 'Retail stores, commercial showrooms, storage facilities, and logistics godowns',
    subcategories: [
      'Retail Shop',
      'Showroom',
      'Warehouse / Godown',
      'Cold Storage',
      'Industrial Shed',
    ],
    supportedListingTypes: ['SALE', 'COMMERCIAL_LEASE', 'LEASE', 'RENT'],
  },
  {
    group: 'LEASE',
    title: 'Lease',
    name: 'Lease',
    description: 'Long-term corporate leases, commercial office floors, and institutional spaces',
    subcategories: [
      'Commercial Office Lease',
      'Furnished Office Space',
      'Co-working Space',
      'IT Park / Corporate Floor',
      'Institutional Lease',
    ],
    supportedListingTypes: ['COMMERCIAL_LEASE', 'LEASE', 'RENT'],
  },
  {
    group: 'LITIGATED',
    title: 'Litigated',
    name: 'Litigated',
    description: 'Dispute resolution, court settlement, or bank SARFAESI auctions with legal disclosures',
    subcategories: [
      'Bank Auction (SARFAESI)',
      'Court Settlement Property',
      'Disputed Asset with Disclosure',
      'Debt Recovery Tribunal (DRT) Asset',
    ],
    supportedListingTypes: ['SALE', 'LEASE'],
  },
  {
    group: 'PG',
    title: 'PG (Paying Guest)',
    name: 'PG (Paying Guest)',
    description: 'Paying guest accommodation, student housing, and co-living rooms',
    subcategories: [
      'Boys PG',
      'Girls PG',
      'Co-ed PG',
      'Student Hostel',
      'Co-living Room',
    ],
    supportedListingTypes: ['PG_COLIVING', 'RENT'],
  },
];

export const RERA_AUTHORITIES = [
  { code: 'UPRERA', state: 'Uttar Pradesh', name: 'Uttar Pradesh RERA (UPRERA)' },
  { code: 'MahaRERA', state: 'Maharashtra', name: 'Maharashtra RERA (MahaRERA)' },
  { code: 'HRERA-GGM', state: 'Haryana (Gurugram)', name: 'Haryana RERA (Gurugram)' },
  { code: 'HRERA-PKL', state: 'Haryana (Panchkula)', name: 'Haryana RERA (Panchkula)' },
  { code: 'DLRERA', state: 'Delhi', name: 'Delhi RERA (DLRERA)' },
  { code: 'K-RERA', state: 'Karnataka', name: 'Karnataka RERA (K-RERA)' },
  { code: 'TNRERA', state: 'Tamil Nadu', name: 'Tamil Nadu RERA (TNRERA)' },
  { code: 'GujRERA', state: 'Gujarat', name: 'Gujarat RERA (GujRERA)' },
  { code: 'RERA-RAJ', state: 'Rajasthan', name: 'Rajasthan RERA' },
  { code: 'TSRERA', state: 'Telangana', name: 'Telangana RERA' },
  { code: 'APRERA', state: 'Andhra Pradesh', name: 'Andhra Pradesh RERA' },
  { code: 'WB-HIRA', state: 'West Bengal', name: 'West Bengal Housing Industry RERA' },
  { code: 'UK-RERA', state: 'Uttarakhand', name: 'Uttarakhand RERA' },
  { code: 'OTHER-RERA', state: 'Other Indian State / UT', name: 'Other State RERA Authority' },
];

export const RERA_EXEMPTION_REASONS = [
  'Resale of existing completed property with Occupancy Certificate (OC)',
  'Individual private residence / Not part of a promoter layout',
  'Plot area is under 500 square meters and less than 8 apartments (Section 3(2)(a))',
  'Rental or lease listing of an existing constructed building',
  'Agricultural / Non-plotted rural land holding',
  'Project completed and occupancy obtained prior to RERA enactment (May 2017)',
  'Renovation or repair not requiring new building marketing (Section 3(2)(c))',
  'Other lawful statutory exemption',
];

export type CanonicalCategoryType =
  | 'HOUSE'
  | 'APARTMENT'
  | 'LAND_PLOT'
  | 'SHOP_WAREHOUSE'
  | 'COMMERCIAL_OFFICE'
  | 'SHOP'
  | 'COMMERCIAL_COMPLEX'
  | 'WAREHOUSE'
  | 'LEASE'
  | 'LITIGATED'
  | 'PG';

export function resolveCanonicalCategory(category?: string, subcategory?: string): CanonicalCategoryType {
  const combined = `${category || ''} ${subcategory || ''}`.toLowerCase();

  // 1. Litigated Check
  if (
    combined.includes('litigat') ||
    combined.includes('court') ||
    combined.includes('auction') ||
    combined.includes('sarfaesi') ||
    combined.includes('dispute') ||
    combined.includes('drt')
  ) {
    return 'LITIGATED';
  }

  // 2. PG (Paying Guest) Check
  if (
    combined.includes('pg') ||
    combined.includes('paying guest') ||
    combined.includes('co-living') ||
    combined.includes('hostel')
  ) {
    return 'PG';
  }

  // 3. Lease Check
  if (
    combined.includes('commercial lease') ||
    combined.includes('office lease') ||
    combined.includes('lease')
  ) {
    return 'LEASE';
  }

  // 4. Shop / Warehouse Check
  if (
    combined.includes('shop') ||
    combined.includes('warehouse') ||
    combined.includes('godown') ||
    combined.includes('showroom') ||
    combined.includes('retail') ||
    combined.includes('storage') ||
    combined.includes('cold storage') ||
    combined.includes('industrial shed')
  ) {
    return 'SHOP_WAREHOUSE';
  }

  // 5. Plot & Land Check (Plotting Land, Small Land, Big Land -> Plot)
  if (
    combined.includes('plot') ||
    combined.includes('land') ||
    combined.includes('agricultural') ||
    combined.includes('farm') ||
    combined.includes('acreage')
  ) {
    return 'LAND_PLOT';
  }

  // 6. House / Home Check
  if (
    combined.includes('house') ||
    combined.includes('home') ||
    combined.includes('villa') ||
    combined.includes('bungalow') ||
    combined.includes('duplex') ||
    combined.includes('row house') ||
    combined.includes('kothi')
  ) {
    return 'HOUSE';
  }

  // 7. Apartment / Flat Check
  if (
    combined.includes('flat') ||
    combined.includes('apartment') ||
    combined.includes('penthouse') ||
    combined.includes('builder floor') ||
    combined.includes('studio') ||
    combined.includes('condo')
  ) {
    return 'APARTMENT';
  }

  return 'APARTMENT';
}

export interface CategoryFieldVisibility {
  canonicalType: CanonicalCategoryType;
  areaLabel: string;
  priceLabel: string;

  // General Area
  showArea: boolean;
  showAreaUnit: boolean;
  showCarpetArea: boolean;
  showBuiltUpArea: boolean;
  showSuperBuiltUpArea: boolean;

  // Residential Beds / Baths
  showBedrooms: boolean;
  showBathrooms: boolean;
  showBalconies: boolean;

  // Floors
  showFloorNumber: boolean;
  showTotalFloors: boolean;

  // Status & Furnishing
  showFurnishing: boolean;
  showConstructionStatus: boolean;
  showParking: boolean;
  showFacing: boolean;
  showPropertyAge: boolean;

  // Commercial
  showCommercialSpecs: boolean;
  showWashrooms: boolean;
  showCabins: boolean;
  showWorkstations: boolean;
  showPantry: boolean;
  showPowerBackup: boolean;
  showSuitableFor: boolean;

  // Warehouse
  showWarehouseSpecs: boolean;
  showCeilingHeight: boolean;
  showLoadingAccess: boolean;

  // Land & Plot
  showPlotDetails: boolean;
  showPlotDimensions: boolean;
  showBoundaryWall: boolean;
  showCornerPlot: boolean;
  showRoadWidth: boolean;
  showOpenSides: boolean;
  showSoilType: boolean;
  showLandZone: boolean;

  // Lease
  showLeaseTerms?: boolean;
  showSecurityDeposit: boolean;

  // Litigated
  showLegalDisclosures?: boolean;

  // PG
  showPgSpecs: boolean;
  showAccommodationType: boolean;
  showSharingType: boolean;
  showAvailableBeds: boolean;
  showFoodAvailability: boolean;
  showGenderPreference: boolean;
  showPgFacilities: boolean;

  // Backward compatibility aliases
  hasBedrooms: boolean;
  hasCommercialSpaces: boolean;
  hasPlotDimensions: boolean;
  hasFurnishing: boolean;
  hasFloors: boolean;
  showAreaSqFt: boolean;
}

export function getCategoryFieldVisibility(category: string, subcategory?: string): CategoryFieldVisibility {
  const canonical = resolveCanonicalCategory(category, subcategory);

  switch (canonical) {
    case 'HOUSE':
      return {
        canonicalType: 'HOUSE',
        areaLabel: 'Built-up / Plot Area (Sq.Ft)',
        priceLabel: 'Property Price (INR ₹)',
        showArea: true,
        showAreaUnit: false,
        showCarpetArea: true,
        showBuiltUpArea: true,
        showSuperBuiltUpArea: false,
        showBedrooms: true,
        showBathrooms: true,
        showBalconies: true,
        showFloorNumber: false,
        showTotalFloors: true,
        showFurnishing: true,
        showConstructionStatus: true,
        showParking: true,
        showFacing: true,
        showPropertyAge: true,
        showCommercialSpecs: false,
        showWashrooms: false,
        showCabins: false,
        showWorkstations: false,
        showPantry: false,
        showPowerBackup: false,
        showSuitableFor: false,
        showWarehouseSpecs: false,
        showCeilingHeight: false,
        showLoadingAccess: false,
        showPlotDetails: false,
        showPlotDimensions: false,
        showBoundaryWall: false,
        showCornerPlot: false,
        showRoadWidth: false,
        showOpenSides: false,
        showSoilType: false,
        showLandZone: false,
        showSecurityDeposit: false,
        showPgSpecs: false,
        showAccommodationType: false,
        showSharingType: false,
        showAvailableBeds: false,
        showFoodAvailability: false,
        showGenderPreference: false,
        showPgFacilities: false,
        hasBedrooms: true,
        hasCommercialSpaces: false,
        hasPlotDimensions: false,
        hasFurnishing: true,
        hasFloors: false,
        showAreaSqFt: true,
      };

    case 'APARTMENT':
      return {
        canonicalType: 'APARTMENT',
        areaLabel: 'Carpet Area (Sq.Ft)',
        priceLabel: 'Property Price (INR ₹)',
        showArea: true,
        showAreaUnit: false,
        showCarpetArea: true,
        showBuiltUpArea: true,
        showSuperBuiltUpArea: true,
        showBedrooms: true,
        showBathrooms: true,
        showBalconies: true,
        showFloorNumber: true,
        showTotalFloors: true,
        showFurnishing: true,
        showConstructionStatus: true,
        showParking: true,
        showFacing: true,
        showPropertyAge: true,
        showCommercialSpecs: false,
        showWashrooms: false,
        showCabins: false,
        showWorkstations: false,
        showPantry: false,
        showPowerBackup: false,
        showSuitableFor: false,
        showWarehouseSpecs: false,
        showCeilingHeight: false,
        showLoadingAccess: false,
        showPlotDetails: false,
        showPlotDimensions: false,
        showBoundaryWall: false,
        showCornerPlot: false,
        showRoadWidth: false,
        showOpenSides: false,
        showSoilType: false,
        showLandZone: false,
        showSecurityDeposit: false,
        showPgSpecs: false,
        showAccommodationType: false,
        showSharingType: false,
        showAvailableBeds: false,
        showFoodAvailability: false,
        showGenderPreference: false,
        showPgFacilities: false,
        hasBedrooms: true,
        hasCommercialSpaces: false,
        hasPlotDimensions: false,
        hasFurnishing: true,
        hasFloors: true,
        showAreaSqFt: true,
      };

    case 'LAND_PLOT':
      return {
        canonicalType: 'LAND_PLOT',
        areaLabel: 'Plot / Land Area',
        priceLabel: 'Total Plot / Land Price (INR ₹)',
        showArea: true,
        showAreaUnit: true,
        showCarpetArea: false,
        showBuiltUpArea: false,
        showSuperBuiltUpArea: false,
        showBedrooms: false,
        showBathrooms: false,
        showBalconies: false,
        showFloorNumber: false,
        showTotalFloors: false,
        showFurnishing: false,
        showConstructionStatus: false,
        showParking: false,
        showFacing: true,
        showPropertyAge: false,
        showCommercialSpecs: false,
        showWashrooms: false,
        showCabins: false,
        showWorkstations: false,
        showPantry: false,
        showPowerBackup: false,
        showSuitableFor: false,
        showWarehouseSpecs: false,
        showCeilingHeight: false,
        showLoadingAccess: false,
        showPlotDetails: true,
        showPlotDimensions: true,
        showBoundaryWall: true,
        showCornerPlot: true,
        showRoadWidth: true,
        showOpenSides: true,
        showSoilType: true,
        showLandZone: true,
        showSecurityDeposit: false,
        showPgSpecs: false,
        showAccommodationType: false,
        showSharingType: false,
        showAvailableBeds: false,
        showFoodAvailability: false,
        showGenderPreference: false,
        showPgFacilities: false,
        hasBedrooms: false,
        hasCommercialSpaces: false,
        hasPlotDimensions: true,
        hasFurnishing: false,
        hasFloors: false,
        showAreaSqFt: true,
      };

    case 'SHOP_WAREHOUSE':
    case 'SHOP':
    case 'WAREHOUSE':
    case 'COMMERCIAL_COMPLEX':
      return {
        canonicalType: 'SHOP_WAREHOUSE',
        areaLabel: 'Shop / Warehouse Area (Sq.Ft)',
        priceLabel: 'Shop / Warehouse Price / Rent (INR ₹)',
        showArea: true,
        showAreaUnit: false,
        showCarpetArea: true,
        showBuiltUpArea: true,
        showSuperBuiltUpArea: false,
        showBedrooms: false,
        showBathrooms: false,
        showBalconies: false,
        showFloorNumber: true,
        showTotalFloors: true,
        showFurnishing: true,
        showConstructionStatus: true,
        showParking: true,
        showFacing: true,
        showPropertyAge: true,
        showCommercialSpecs: true,
        showWashrooms: true,
        showCabins: true,
        showWorkstations: true,
        showPantry: true,
        showPowerBackup: true,
        showSuitableFor: true,
        showWarehouseSpecs: true,
        showCeilingHeight: true,
        showLoadingAccess: true,
        showPlotDetails: false,
        showPlotDimensions: false,
        showBoundaryWall: true,
        showCornerPlot: false,
        showRoadWidth: true,
        showOpenSides: false,
        showSoilType: false,
        showLandZone: true,
        showSecurityDeposit: true,
        showPgSpecs: false,
        showAccommodationType: false,
        showSharingType: false,
        showAvailableBeds: false,
        showFoodAvailability: false,
        showGenderPreference: false,
        showPgFacilities: false,
        hasBedrooms: false,
        hasCommercialSpaces: true,
        hasPlotDimensions: false,
        hasFurnishing: true,
        hasFloors: true,
        showAreaSqFt: true,
      };

    case 'LEASE':
    case 'COMMERCIAL_OFFICE':
      return {
        canonicalType: 'LEASE',
        areaLabel: 'Commercial Lease Area (Sq.Ft)',
        priceLabel: 'Monthly Lease Amount (INR ₹)',
        showArea: true,
        showAreaUnit: false,
        showCarpetArea: true,
        showBuiltUpArea: false,
        showSuperBuiltUpArea: true,
        showBedrooms: false,
        showBathrooms: false,
        showBalconies: false,
        showFloorNumber: true,
        showTotalFloors: true,
        showFurnishing: true,
        showConstructionStatus: true,
        showParking: true,
        showFacing: true,
        showPropertyAge: true,
        showCommercialSpecs: true,
        showWashrooms: true,
        showCabins: true,
        showWorkstations: true,
        showPantry: true,
        showPowerBackup: true,
        showSuitableFor: true,
        showWarehouseSpecs: false,
        showCeilingHeight: false,
        showLoadingAccess: false,
        showPlotDetails: false,
        showPlotDimensions: false,
        showBoundaryWall: false,
        showCornerPlot: false,
        showRoadWidth: false,
        showOpenSides: false,
        showSoilType: false,
        showLandZone: false,
        showLeaseTerms: true,
        showSecurityDeposit: true,
        showPgSpecs: false,
        showAccommodationType: false,
        showSharingType: false,
        showAvailableBeds: false,
        showFoodAvailability: false,
        showGenderPreference: false,
        showPgFacilities: false,
        hasBedrooms: false,
        hasCommercialSpaces: true,
        hasPlotDimensions: false,
        hasFurnishing: true,
        hasFloors: true,
        showAreaSqFt: true,
      };

    case 'LITIGATED':
      return {
        canonicalType: 'LITIGATED',
        areaLabel: 'Property / Land Area (Sq.Ft)',
        priceLabel: 'Reserve / Auction Price (INR ₹)',
        showArea: true,
        showAreaUnit: true,
        showCarpetArea: true,
        showBuiltUpArea: true,
        showSuperBuiltUpArea: false,
        showBedrooms: false,
        showBathrooms: false,
        showBalconies: false,
        showFloorNumber: true,
        showTotalFloors: true,
        showFurnishing: false,
        showConstructionStatus: true,
        showParking: true,
        showFacing: true,
        showPropertyAge: true,
        showCommercialSpecs: false,
        showWashrooms: false,
        showCabins: false,
        showWorkstations: false,
        showPantry: false,
        showPowerBackup: false,
        showSuitableFor: false,
        showWarehouseSpecs: false,
        showCeilingHeight: false,
        showLoadingAccess: false,
        showPlotDetails: true,
        showPlotDimensions: true,
        showBoundaryWall: true,
        showCornerPlot: true,
        showRoadWidth: true,
        showOpenSides: true,
        showSoilType: false,
        showLandZone: true,
        showLegalDisclosures: true,
        showSecurityDeposit: false,
        showPgSpecs: false,
        showAccommodationType: false,
        showSharingType: false,
        showAvailableBeds: false,
        showFoodAvailability: false,
        showGenderPreference: false,
        showPgFacilities: false,
        hasBedrooms: false,
        hasCommercialSpaces: false,
        hasPlotDimensions: true,
        hasFurnishing: false,
        hasFloors: false,
        showAreaSqFt: true,
      };

    case 'PG':
      return {
        canonicalType: 'PG',
        areaLabel: 'Room / Unit Area (Sq.Ft)',
        priceLabel: 'Monthly Rent (INR ₹)',
        showArea: true,
        showAreaUnit: false,
        showCarpetArea: false,
        showBuiltUpArea: false,
        showSuperBuiltUpArea: false,
        showBedrooms: false,
        showBathrooms: false,
        showBalconies: false,
        showFloorNumber: true,
        showTotalFloors: true,
        showFurnishing: true,
        showConstructionStatus: false,
        showParking: true,
        showFacing: false,
        showPropertyAge: false,
        showCommercialSpecs: false,
        showWashrooms: false,
        showCabins: false,
        showWorkstations: false,
        showPantry: false,
        showPowerBackup: true,
        showSuitableFor: false,
        showWarehouseSpecs: false,
        showCeilingHeight: false,
        showLoadingAccess: false,
        showPlotDetails: false,
        showPlotDimensions: false,
        showBoundaryWall: false,
        showCornerPlot: false,
        showRoadWidth: false,
        showOpenSides: false,
        showSoilType: false,
        showLandZone: false,
        showPgSpecs: true,
        showAccommodationType: true,
        showSharingType: true,
        showAvailableBeds: true,
        showFoodAvailability: true,
        showGenderPreference: true,
        showSecurityDeposit: true,
        showPgFacilities: true,
        hasBedrooms: false,
        hasCommercialSpaces: false,
        hasPlotDimensions: false,
        hasFurnishing: true,
        hasFloors: true,
        showAreaSqFt: true,
      };
  }
}

export function validateReraNumber(
  reraNumber: string,
  authorityCode?: string,
): { valid: boolean; message: string; isValid: boolean; warning?: string } {
  if (!reraNumber || !reraNumber.trim()) {
    return {
      valid: false,
      message: 'RERA Registration Number cannot be empty.',
      isValid: false,
      warning: 'RERA Registration Number cannot be empty.',
    };
  }

  const clean = reraNumber.trim().toUpperCase();

  if (authorityCode === 'UPRERA' && !clean.startsWith('UPRERA')) {
    return {
      valid: true,
      message: 'Notice: UP-RERA numbers typically start with "UPRERAPRJ" or "UPRERAAGT".',
      isValid: true,
      warning: 'Notice: UP-RERA numbers typically start with "UPRERAPRJ" or "UPRERAAGT".',
    };
  }

  if (authorityCode === 'MahaRERA' && !clean.startsWith('P') && !clean.startsWith('A')) {
    return {
      valid: true,
      message: 'Notice: MahaRERA numbers typically start with "P" (Project) or "A" (Agent).',
      isValid: true,
      warning: 'Notice: MahaRERA numbers typically start with "P" (Project) or "A" (Agent).',
    };
  }

  if (clean.length < 5) {
    return {
      valid: false,
      message: 'RERA number must be at least 5 alphanumeric characters.',
      isValid: false,
      warning: 'RERA number must be at least 5 alphanumeric characters.',
    };
  }

  return {
    valid: true,
    message: 'Valid Indian RERA registration format.',
    isValid: true,
  };
}
