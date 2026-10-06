import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus } from '../../auth/enums/auth.enums';

export class UpdateUserStatusDto {
  @ApiProperty({ description: 'New account status', enum: AccountStatus })
  @IsEnum(AccountStatus)
  status: AccountStatus;

  @ApiPropertyOptional({ description: 'Reason for status update for audit trail' })
  @IsOptional()
  @IsString()
  reason?: string;
}
