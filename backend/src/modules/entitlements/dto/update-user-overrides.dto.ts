import { IsString, IsOptional, IsArray, IsObject, IsBoolean } from 'class-validator';

export class UpdateUserOverridesDto {
  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsString()
  packageId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  grantedPermissions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deniedPermissions?: string[];

  @IsOptional()
  @IsObject()
  bonusLimits?: {
    propertyViews?: number;
    propertyListings?: number;
    monthlyLeads?: number;
    enquiries?: number;
    chats?: number;
    savedProperties?: number;
    savedSearches?: number;
  };

  @IsOptional()
  @IsBoolean()
  resetUsage?: boolean;
}

export class AddBonusCreditsDto {
  @IsOptional()
  @IsString()
  limitType?: string; // 'propertyViews' | 'propertyListings' | 'monthlyLeads' | 'enquiries' | 'chats'

  @IsOptional()
  bonusCredits?: number;

  @IsOptional()
  @IsObject()
  bonusLimits?: {
    propertyViews?: number;
    propertyListings?: number;
    monthlyLeads?: number;
    enquiries?: number;
    chats?: number;
    propertyViewsBonus?: number;
    propertyListingsBonus?: number;
    leadsBonus?: number;
    featuredListingsBonus?: number;
  };
}
