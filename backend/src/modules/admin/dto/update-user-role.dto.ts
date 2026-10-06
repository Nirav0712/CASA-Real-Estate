import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../auth/enums/auth.enums';

export class UpdateUserRoleDto {
  @ApiProperty({ description: 'New user role', enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ description: 'Reason for role change for audit trail' })
  @IsOptional()
  @IsString()
  reason?: string;
}
