import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PlatformRole, AccountType } from '../../auth/enums/auth.enums';
import { DataScope } from '../enums/permissions.enum';

export class DashboardConfigDto {
  @IsOptional()
  @IsBoolean()
  overview?: boolean;

  @IsOptional()
  @IsBoolean()
  properties?: boolean;

  @IsOptional()
  @IsBoolean()
  leads?: boolean;

  @IsOptional()
  @IsBoolean()
  enquiries?: boolean;

  @IsOptional()
  @IsBoolean()
  chat?: boolean;

  @IsOptional()
  @IsBoolean()
  crm?: boolean;

  @IsOptional()
  @IsBoolean()
  siteVisits?: boolean;

  @IsOptional()
  @IsBoolean()
  analytics?: boolean;

  @IsOptional()
  @IsBoolean()
  reviews?: boolean;

  @IsOptional()
  @IsBoolean()
  promotions?: boolean;

  @IsOptional()
  @IsBoolean()
  profile?: boolean;
}

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PlatformRole)
  @IsNotEmpty()
  platformRole: PlatformRole;

  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsEnum(DataScope)
  dataScope?: DataScope;

  @IsOptional()
  @IsString()
  packageId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DashboardConfigDto)
  dashboardConfig?: DashboardConfigDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRoleDto extends CreateRoleDto {}
