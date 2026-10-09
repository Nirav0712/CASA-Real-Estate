import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MultiLingualTextDto {
  @ApiProperty({ description: 'English text' })
  @IsString()
  @IsNotEmpty()
  en: string;

  @ApiPropertyOptional({ description: 'Hindi translation' })
  @IsOptional()
  @IsString()
  hi?: string;

  @ApiPropertyOptional({ description: 'Arabic translation' })
  @IsOptional()
  @IsString()
  ar?: string;

  @ApiPropertyOptional({ description: 'Urdu translation' })
  @IsOptional()
  @IsString()
  ur?: string;
}

export class PropertyPriceDto {
  @ApiProperty({ description: 'Price amount in INR' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ default: 'TOTAL' })
  @IsOptional()
  @IsString()
  priceUnit?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isNegotiable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maintenance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  securityDeposit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rentPeriod?: string;
}

export class PropertyLocationDto {
  @ApiPropertyOptional({ default: 'Uttar Pradesh' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ default: 'Lucknow' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ default: 'Lucknow' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Locality or sector' })
  @IsString()
  @IsNotEmpty()
  locality: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({ type: [Number], default: [80.9462, 26.8467] })
  @IsOptional()
  @IsArray()
  coordinates?: [number, number];

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

  @ApiPropertyOptional({ description: 'Normalized Sub-Locality Location ID' })
  @IsOptional()
  @IsString()
  subLocalityId?: string;

  @ApiPropertyOptional({ description: 'Normalized Pincode Location ID' })
  @IsOptional()
  @IsString()
  pincodeId?: string;
}

export class PropertySpecsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  area?: number;

  @ApiPropertyOptional({ default: 'SQ_FT' })
  @IsOptional()
  @IsString()
  areaUnit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  carpetArea?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  carpetAreaSqFt?: number;

  @ApiPropertyOptional({ default: 'READY_TO_MOVE' })
  @IsOptional()
  @IsString()
  constructionStatus?: string;

  @ApiPropertyOptional({ default: 'SEMI_FURNISHED' })
  @IsOptional()
  @IsString()
  furnishing?: string;

  @ApiPropertyOptional({ default: 'East' })
  @IsOptional()
  @IsString()
  facing?: string;

  @ApiPropertyOptional({ default: '1 Covered' })
  @IsOptional()
  @IsString()
  parking?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  floorLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  floorNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalFloors?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyAge?: string;
}

export class PropertyMediaDto {
  @ApiProperty({ description: 'Primary thumbnail URL' })
  @IsString()
  @IsNotEmpty()
  thumbnailUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  videos?: string[];

  @ApiPropertyOptional({ description: 'Primary video URL (YouTube watch/embed or local uploaded video URL)' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Video provider type: YOUTUBE, LOCAL, EMBED', enum: ['YOUTUBE', 'LOCAL', 'EMBED'] })
  @IsOptional()
  @IsString()
  videoType?: string;

  @ApiPropertyOptional({ description: 'High-res video poster thumbnail' })
  @IsOptional()
  @IsString()
  videoThumbnail?: string;

  @ApiPropertyOptional({ description: 'Primary media type to display on listing cards (IMAGE or VIDEO)', enum: ['IMAGE', 'VIDEO'] })
  @IsOptional()
  @IsString()
  primaryMediaType?: string;
}

export class PropertyAdvertiserDto {
  @ApiProperty({ description: 'Contact Name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Contact Phone' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isVerifiedAgent?: boolean;

  @ApiPropertyOptional({ default: 'PROPERTY_OWNER' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agencyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reraNumber?: string;
}

export class CreatePropertyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reraNumber?: string;

  @ApiProperty({ description: 'Multilingual Title' })
  @ValidateNested()
  @Type(() => MultiLingualTextDto)
  title: MultiLingualTextDto;

  @ApiProperty({ description: 'Multilingual Description' })
  @ValidateNested()
  @Type(() => MultiLingualTextDto)
  description: MultiLingualTextDto;

  @ApiProperty({ description: 'Canonical Category Name' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ enum: ['SALE', 'RENT', 'LEASE'], default: 'SALE' })
  @IsEnum(['SALE', 'RENT', 'LEASE'])
  listingType: string;

  @ApiProperty({ description: 'Pricing details' })
  @ValidateNested()
  @Type(() => PropertyPriceDto)
  price: PropertyPriceDto;

  @ApiProperty({ description: 'Location details' })
  @ValidateNested()
  @Type(() => PropertyLocationDto)
  location: PropertyLocationDto;

  @ApiPropertyOptional({ description: 'Property specifications' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PropertySpecsDto)
  specs?: PropertySpecsDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  amenities?: string[];

  @ApiProperty({ description: 'Media assets' })
  @ValidateNested()
  @Type(() => PropertyMediaDto)
  media: PropertyMediaDto;

  @ApiPropertyOptional({ description: 'Advertiser details' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PropertyAdvertiserDto)
  advertiser?: PropertyAdvertiserDto;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
