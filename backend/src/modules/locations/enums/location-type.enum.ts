export enum LocationType {
  COUNTRY = 'COUNTRY',
  STATE = 'STATE',
  DISTRICT = 'DISTRICT',
  CITY = 'CITY',
  LOCALITY = 'LOCALITY',
  AREA = 'AREA', // Semantic alias for LOCALITY
  SUB_LOCALITY = 'SUB_LOCALITY',
  SUB_AREA = 'SUB_AREA', // Semantic alias for SUB_LOCALITY
  PINCODE = 'PINCODE',
  SOCIETY = 'SOCIETY', // Gated society, residential complex, building project
}

export const LOCATION_HIERARCHY_ORDER: Record<LocationType, number> = {
  [LocationType.COUNTRY]: 1,
  [LocationType.STATE]: 2,
  [LocationType.DISTRICT]: 3,
  [LocationType.CITY]: 4,
  [LocationType.LOCALITY]: 5,
  [LocationType.AREA]: 5,
  [LocationType.SUB_LOCALITY]: 6,
  [LocationType.SUB_AREA]: 6,
  [LocationType.PINCODE]: 7,
  [LocationType.SOCIETY]: 8,
};

export const ALLOWED_PARENT_TYPES: Record<LocationType, LocationType[] | null> = {
  [LocationType.COUNTRY]: null,
  [LocationType.STATE]: [LocationType.COUNTRY],
  [LocationType.DISTRICT]: [LocationType.STATE],
  [LocationType.CITY]: [LocationType.DISTRICT, LocationType.STATE],
  [LocationType.LOCALITY]: [LocationType.CITY, LocationType.DISTRICT],
  [LocationType.AREA]: [LocationType.CITY, LocationType.DISTRICT],
  [LocationType.SUB_LOCALITY]: [LocationType.LOCALITY, LocationType.AREA, LocationType.CITY],
  [LocationType.SUB_AREA]: [LocationType.LOCALITY, LocationType.AREA, LocationType.CITY],
  [LocationType.PINCODE]: [LocationType.LOCALITY, LocationType.AREA, LocationType.CITY, LocationType.DISTRICT],
  [LocationType.SOCIETY]: [LocationType.SUB_LOCALITY, LocationType.SUB_AREA, LocationType.LOCALITY, LocationType.AREA, LocationType.CITY],
};
