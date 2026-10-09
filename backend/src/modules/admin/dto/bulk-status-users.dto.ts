import { IsArray, IsEnum, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus } from '../../auth/enums/auth.enums';

export class BulkStatusUsersDto {
  @ApiProperty({ description: 'Array of user IDs to update status', type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  userIds: string[];

  @ApiProperty({ enum: AccountStatus, description: 'Target account status' })
  @IsEnum(AccountStatus)
  status: AccountStatus;

  @ApiPropertyOptional({ description: 'Optional administrative reason for audit logs' })
  @IsOptional()
  @IsString()
  reason?: string;
}
