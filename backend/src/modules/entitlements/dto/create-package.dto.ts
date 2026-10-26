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
  projectListings?: number;

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

export class PackageDurationPriceDto {
  @IsNumber()
  durationMonths: number;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  referenceMonthlyPrice?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eligibleUserTypes?: string[];

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsEnum(BillingPeriod)
  @IsNotEmpty()
  billingPeriod: BillingPeriod;

  @IsOptional()
  @IsNumber()
  durationDays?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageDurationPriceDto)
  durationPrices?: PackageDurationPriceDto[];

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsBoolean()
  recommended?: boolean;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  @IsNumber()
  freeTrialMaxSlots?: number;

  @IsOptional()
  @IsNumber()
  freeTrialClaimedSlots?: number;

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
  @IsString()
  whatsappNumber?: string;

  @IsOptional()
  @IsString()
  callNumber?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PackageLimitsDto)
  limits?: PackageLimitsDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

import { PartialType } from '@nestjs/swagger';

export class UpdatePackageDto extends PartialType(CreatePackageDto) {}
