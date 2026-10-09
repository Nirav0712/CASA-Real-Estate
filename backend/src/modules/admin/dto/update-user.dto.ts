import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, IsEnum, IsBoolean, MinLength } from 'class-validator';
import { AccountStatus, AccountType, PlatformRole, UserRole } from '../../auth/enums/auth.enums';

export class UpdateAdminUserDto {
  @ApiPropertyOptional({ example: 'Nirav Patel' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ example: 'NewSecretPass123!' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ enum: PlatformRole })
  @IsOptional()
  @IsEnum(PlatformRole)
  platformRole?: PlatformRole;

  @ApiPropertyOptional({ enum: AccountType })
  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customRoleId?: string | null;

  @ApiPropertyOptional({ enum: AccountStatus })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVerifiedAgent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agencyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reraNumber?: string;
}
