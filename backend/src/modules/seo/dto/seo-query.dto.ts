import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SeoEntityType, SeoApprovalStatus } from '../schemas/seo.schema';

export class SeoMetadataQueryDto {
  @IsOptional()
  @IsEnum(SeoEntityType)
  entityType?: SeoEntityType;

  @IsOptional()
  @IsEnum(SeoApprovalStatus)
  approvalStatus?: SeoApprovalStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'updatedAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class CreateRedirectDto {
  @IsString()
  oldPath: string;

  @IsString()
  newPath: string;

  @IsOptional()
  @IsString()
  oldSlug?: string;

  @IsOptional()
  @IsString()
  newSlug?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  statusCode?: number = 301;
}
