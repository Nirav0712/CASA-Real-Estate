import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum PropertySortOption {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  PRICE_LOW = 'price_low',
  PRICE_HIGH = 'price_high',
  AREA_LOW = 'area_low',
  AREA_HIGH = 'area_high',
  FEATURED = 'featured',
  RELEVANCE = 'relevance',
  MOST_VIEWED = 'most_viewed',
  MOST_CONTACTED = 'most_contacted',
  MOST_SAVED = 'most_saved',
  BEST_RATED = 'best_rated',
  VERIFIED_FIRST = 'verified_first',
}

export enum ListingFreshnessOption {
  ALL = 'all',
  TODAY = 'today',
  LAST_3_DAYS = 'last_3_days',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
}

export class SearchPropertiesDto {
  @ApiPropertyOptional({ description: 'Search keyword (title, description, city, locality, referenceId)' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Canonical Category (e.g., Apartment, House / Home, Plotting Land)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Listing Type (SALE, RENT, LEASE)', enum: ['SALE', 'RENT', 'LEASE'] })
  @IsOptional()
  @IsString()
  listingType?: string;

  @ApiPropertyOptional({ description: 'Country (e.g., India, United Arab Emirates, United States)' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'State (e.g., Uttar Pradesh)' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'District (e.g., Lucknow, Ayodhya)' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'City (e.g., Lucknow)' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Locality / Neighborhood (e.g., Gomti Nagar, Indira Nagar)' })
  @IsOptional()
  @IsString()
  locality?: string;

  @ApiPropertyOptional({ description: 'Postal Pincode' })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({ description: 'Normalized Generic Location ID' })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Normalized Country Location ID' })
  @IsOptional()
  @IsString()
  countryId?: string;

  @ApiPropertyOptional({ description: 'Normalized State Location ID' })
  @IsOptional()
  @IsString()
  stateId?: string;

  @ApiPropertyOptional({ description: 'Normalized District Location ID' })
  @IsOptional()
  @IsString()
  districtId?: string;

  @ApiPropertyOptional({ description: 'Normalized City Location ID' })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiPropertyOptional({ description: 'Normalized Locality Location ID' })
  @IsOptional()
  @IsString()
  localityId?: string;

  @ApiPropertyOptional({ description: 'Normalized Pincode Location ID' })
  @IsOptional()
  @IsString()
  pincodeId?: string;

  @ApiPropertyOptional({ description: 'Minimum price (INR)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price (INR)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Minimum carpet/super area in Sq.Ft' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minArea?: number;

  @ApiPropertyOptional({ description: 'Maximum carpet/super area in Sq.Ft' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxArea?: number;

  @ApiPropertyOptional({ description: 'Number of bedrooms (e.g., 1, 2, 3, 4, 5)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Number of bathrooms' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @ApiPropertyOptional({ description: 'Construction status (READY_TO_MOVE, UNDER_CONSTRUCTION, etc.)' })
  @IsOptional()
  @IsString()
  constructionStatus?: string;

  @ApiPropertyOptional({ description: 'Property age range (0-1 years, 1-5 years, etc.)' })
  @IsOptional()
  @IsString()
  propertyAge?: string;

  @ApiPropertyOptional({ description: 'Furnishing status (FURNISHED, SEMI_FURNISHED, UNFURNISHED)' })
  @IsOptional()
  @IsString()
  furnishing?: string;

  @ApiPropertyOptional({ description: 'Facing direction (East, North, North-East, etc.)' })
  @IsOptional()
  @IsString()
  facing?: string;

  @ApiPropertyOptional({ description: 'Comma-separated amenities (AND-logic filtering)' })
  @IsOptional()
  @IsString()
  amenities?: string;

  @ApiPropertyOptional({ description: 'Listing Freshness filter', enum: ListingFreshnessOption })
  @IsOptional()
  @IsString()
  freshness?: string;

  @ApiPropertyOptional({ description: 'Filter only featured listings' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === '1')
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Filter only verified advertiser/agent listings' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === '1')
  @IsBoolean()
  verifiedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Filter by poster role (AGENT or OWNER)' })
  @IsOptional()
  @IsString()
  postedBy?: string;

  @ApiPropertyOptional({ description: 'Latitude for geospatial proximity' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude for geospatial proximity' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ description: 'Search radius in kilometers (default: 10)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  radius?: number;

  @ApiPropertyOptional({ description: 'Sort criteria', enum: PropertySortOption, default: PropertySortOption.NEWEST })
  @IsOptional()
  @IsEnum(PropertySortOption)
  sort?: PropertySortOption = PropertySortOption.NEWEST;

  @ApiPropertyOptional({ description: 'Pagination page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Pagination page limit (max 50)', default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 12;
}
