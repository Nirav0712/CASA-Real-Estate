import { IsString, IsOptional, IsBoolean, IsArray, IsEnum, IsNumber, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SeoApprovalStatus, SeoGenerationMode } from '../schemas/seo.schema';

export class FieldLocksDto {
  @IsOptional()
  @IsBoolean()
  metaTitle?: boolean;

  @IsOptional()
  @IsBoolean()
  metaDescription?: boolean;

  @IsOptional()
  @IsBoolean()
  canonicalUrl?: boolean;

  @IsOptional()
  @IsBoolean()
  openGraph?: boolean;

  @IsOptional()
  @IsBoolean()
  structuredData?: boolean;
}

export class UpdateSeoMetadataDto {
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsString()
  focusKeyword?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedKeywords?: string[];

  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @IsOptional()
  @IsBoolean()
  robotsIndex?: boolean;

  @IsOptional()
  @IsBoolean()
  robotsFollow?: boolean;

  @IsOptional()
  @IsString()
  openGraphTitle?: string;

  @IsOptional()
  @IsString()
  openGraphDescription?: string;

  @IsOptional()
  @IsString()
  openGraphImage?: string;

  @IsOptional()
  @IsString()
  twitterCardType?: string;

  @IsOptional()
  structuredData?: Record<string, any>;

  @IsOptional()
  @IsEnum(SeoApprovalStatus)
  approvalStatus?: SeoApprovalStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => FieldLocksDto)
  fieldLocks?: FieldLocksDto;

  @IsOptional()
  @IsEnum(SeoGenerationMode)
  generationMode?: SeoGenerationMode;
}
