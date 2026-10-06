import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationType } from '../enums/location-type.enum';

export class LocalizedNamesDto {
  @ApiProperty({ description: 'English name (fallback)', example: 'Ahmedabad' })
  @IsString()
  en: string;

  @ApiPropertyOptional({ description: 'Hindi name', example: 'अहमदाबाद' })
  @IsOptional()
  @IsString()
  hi?: string;

  @ApiPropertyOptional({ description: 'Arabic name', example: 'أحمد آباد' })
  @IsOptional()
  @IsString()
  ar?: string;

  @ApiPropertyOptional({ description: 'Urdu name', example: 'احمد آباد' })
  @IsOptional()
  @IsString()
  ur?: string;
}

export class LocationSeoDto {
  @ApiPropertyOptional({ description: 'SEO Meta Title' })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional({ description: 'SEO Meta Description' })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({ description: 'SEO Keywords' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaKeywords?: string[];

  @ApiPropertyOptional({ description: 'Canonical URL Slug' })
  @IsOptional()
  @IsString()
  canonicalSlug?: string;
}

export class CreateLocationDto {
  @ApiProperty({ description: 'Location display name', example: 'Ahmedabad' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Explicit slug (auto-generated if omitted)', example: 'ahmedabad' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ description: 'Location type level', enum: LocationType, example: LocationType.CITY })
  @IsEnum(LocationType)
  type: LocationType;

  @ApiPropertyOptional({ description: 'Parent Location ID (null for COUNTRY)', example: '65f123...' })
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @ApiPropertyOptional({ description: '2-letter ISO Country Code', example: 'IN' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({ description: 'State Code / Abbreviation', example: 'GJ' })
  @IsOptional()
  @IsString()
  stateCode?: string;

  @ApiPropertyOptional({ description: 'District Code', example: 'AHM' })
  @IsOptional()
  @IsString()
  districtCode?: string;

  @ApiPropertyOptional({ description: 'City Code', example: 'AMD' })
  @IsOptional()
  @IsString()
  cityCode?: string;

  @ApiPropertyOptional({ description: 'Postal Pincode', example: '380015' })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate (-90 to 90)', example: 23.0225 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate (-180 to 180)', example: 72.5714 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Alternative names/aliases', example: ['Amdavad', 'Ahmadabad'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @ApiPropertyOptional({ description: 'Multi-lingual names dictionary' })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedNamesDto)
  localizedNames?: LocalizedNamesDto;

  @ApiPropertyOptional({ description: 'Description or notes regarding the locality' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({ description: 'Featured status on marketplace', default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean = false;

  @ApiPropertyOptional({ description: 'Display sort order priority', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number = 0;

  @ApiPropertyOptional({ description: 'SEO Metadata' })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationSeoDto)
  seo?: LocationSeoDto;

  @ApiPropertyOptional({ description: 'Custom metadata payload' })
  @IsOptional()
  metadata?: Record<string, any>;
}
