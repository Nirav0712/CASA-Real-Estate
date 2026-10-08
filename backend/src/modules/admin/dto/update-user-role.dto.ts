import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserRoleDto {
  @ApiPropertyOptional({ description: 'New user role enum, slug, or role ID' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Role ID or slug (for dynamic custom or system role)' })
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiPropertyOptional({ description: 'Reason for role change for audit trail' })
  @IsOptional()
  @IsString()
  reason?: string;
}

