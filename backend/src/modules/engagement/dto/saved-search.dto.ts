import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SavedSearchCriteriaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  listingType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minArea?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxArea?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortOrder?: string;
}

export class CreateSavedSearchDto {
  @ApiProperty({ description: 'Display name for saved search' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ type: SavedSearchCriteriaDto })
  @ValidateNested()
  @Type(() => SavedSearchCriteriaDto)
  criteria: SavedSearchCriteriaDto;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enableAlerts?: boolean;

  @ApiPropertyOptional({ enum: ['INSTANT', 'DAILY', 'WEEKLY'], default: 'INSTANT' })
  @IsOptional()
  @IsEnum(['INSTANT', 'DAILY', 'WEEKLY'])
  frequency?: string;
}

export class UpdateSavedSearchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: SavedSearchCriteriaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SavedSearchCriteriaDto)
  criteria?: SavedSearchCriteriaDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enableAlerts?: boolean;

  @ApiPropertyOptional({ enum: ['INSTANT', 'DAILY', 'WEEKLY'] })
  @IsOptional()
  @IsEnum(['INSTANT', 'DAILY', 'WEEKLY'])
  frequency?: string;
}
