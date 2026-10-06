export enum LocationType {
  COUNTRY = 'COUNTRY',
  STATE = 'STATE',
  DISTRICT = 'DISTRICT',
  CITY = 'CITY',
  LOCALITY = 'LOCALITY',
  SUB_LOCALITY = 'SUB_LOCALITY',
  PINCODE = 'PINCODE',
}

export const LOCATION_HIERARCHY_ORDER: Record<LocationType, number> = {
  [LocationType.COUNTRY]: 1,
  [LocationType.STATE]: 2,
  [LocationType.DISTRICT]: 3,
  [LocationType.CITY]: 4,
  [LocationType.LOCALITY]: 5,
  [LocationType.SUB_LOCALITY]: 6,
  [LocationType.PINCODE]: 7,
};

export const ALLOWED_PARENT_TYPES: Record<LocationType, LocationType[] | null> = {
  [LocationType.COUNTRY]: null,
  [LocationType.STATE]: [LocationType.COUNTRY],
  [LocationType.DISTRICT]: [LocationType.STATE],
  [LocationType.CITY]: [LocationType.DISTRICT, LocationType.STATE],
  [LocationType.LOCALITY]: [LocationType.CITY],
  [LocationType.SUB_LOCALITY]: [LocationType.LOCALITY],
  [LocationType.PINCODE]: [LocationType.LOCALITY, LocationType.CITY, LocationType.DISTRICT],
};
