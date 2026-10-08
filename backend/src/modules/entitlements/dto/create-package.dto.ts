import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsBoolean, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BillingPeriod } from '../schemas/package.schema';

export class PackageLimitsDto {
  @IsOptional()
  @IsNumber()
  propertyViews?: number;

  @IsOptional()
  @IsNumber()
  propertyListings?: number;

  @IsOptional()
  @IsNumber()
  savedProperties?: number;

  @IsOptional()
  @IsNumber()
  savedSearches?: number;

  @IsOptional()
  @IsNumber()
  monthlyLeads?: number;

  @IsOptional()
  @IsNumber()
  enquiries?: number;

  @IsOptional()
  @IsNumber()
  chats?: number;

  @IsOptional()
  @IsNumber()
  teamMembers?: number;
}

export class CreatePackageDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetAccountTypes?: string[];

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsEnum(BillingPeriod)
  @IsNotEmpty()
  billingPeriod: BillingPeriod;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PackageLimitsDto)
  limits?: PackageLimitsDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

export class UpdatePackageDto extends CreatePackageDto {}
