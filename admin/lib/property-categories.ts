export type CategoryGroup = 'RESIDENTIAL' | 'COMMERCIAL' | 'AGRICULTURAL_LAND' | 'LAND' | 'AGRICULTURAL';

export const LISTING_TYPES = [
  { value: 'SALE', label: 'For Sale' },
  { value: 'RENT', label: 'For Rent' },
  { value: 'LEASE', label: 'Lease' },
  { value: 'PG_COLIVING', label: 'PG / Co-living' },
  { value: 'COMMERCIAL_LEASE', label: 'Commercial Lease' },
];

export const CATEGORY_GROUPS = [
  {
    group: 'RESIDENTIAL',
    title: 'Residential',
    name: 'Residential',
    description: 'Apartments, houses, villas, builder floors, and residential plots',
    subcategories: [
      'Flat/Apartment',
      'House/Villa',
      'Residential Plot/Land',
      'Builder Floor',
      'Penthouse',
      'Studio Apartment',
      'Row House',
      'Duplex',
    ],
    supportedListingTypes: ['SALE', 'RENT', 'LEASE', 'PG_COLIVING'],
  },
  {
    group: 'COMMERCIAL',
    title: 'Commercial',
    name: 'Commercial',
    description: 'Offices, showrooms, retail shops, warehouses and commercial plots',
    subcategories: [
      'Office Space',
      'Shop/Showroom',
      'Commercial Building',
      'Warehouse',
      'Godown',
      'Industrial Property',
      'Commercial Plot',
    ],
    supportedListingTypes: ['SALE', 'COMMERCIAL_LEASE', 'LEASE', 'RENT'],
  },
  {
    group: 'AGRICULTURAL_LAND',
    title: 'Agricultural & Land',
    name: 'Agricultural & Land',
    description: 'Agricultural land, farmhouses, farm land, and other rural plots',
    subcategories: [
      'Agricultural Land',
      'Farmhouse',
      'Farm Land',
      'Other Land',
    ],
    supportedListingTypes: ['SALE', 'LEASE'],
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

export function getCategoryFieldVisibility(category: string, subcategory?: string) {
  const cat = (category || '').toLowerCase();
  const sub = (subcategory || '').toLowerCase();

  const isPlotOrLand =
    cat.includes('land') ||
    cat.includes('plot') ||
    cat.includes('agricultural') ||
    sub.includes('plot') ||
    sub.includes('land');

  const isCommercial =
    cat.includes('commercial') ||
    sub.includes('office') ||
    sub.includes('shop') ||
    sub.includes('showroom') ||
    sub.includes('warehouse') ||
    sub.includes('godown') ||
    sub.includes('industrial');

  const isResidentialBuilt = !isPlotOrLand && !isCommercial;

  return {
    hasBedrooms: isResidentialBuilt,
    hasCommercialSpaces: isCommercial && !isPlotOrLand,
    hasPlotDimensions: isPlotOrLand,
    hasFurnishing: !isPlotOrLand,
    hasFloors: !isPlotOrLand && !sub.includes('villa') && !sub.includes('house'),
    showBedrooms: isResidentialBuilt,
    showBathrooms: isResidentialBuilt || (isCommercial && !isPlotOrLand),
    showBalconies: isResidentialBuilt && !sub.includes('studio'),
    showFurnishing: !isPlotOrLand,
    showFloorNumber: !isPlotOrLand,
    showTotalFloors: !isPlotOrLand,
    showFacing: true,
    showParking: !isPlotOrLand,
    showPropertyAge: !isPlotOrLand,
    showConstructionStatus: !isPlotOrLand,
    showPlotDetails: isPlotOrLand,
    showCommercialSpecs: isCommercial && !isPlotOrLand,
    showAreaSqFt: true,
    showBuiltUpArea: !isPlotOrLand,
    showSuperBuiltUpArea: isResidentialBuilt || isCommercial,
  };
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
