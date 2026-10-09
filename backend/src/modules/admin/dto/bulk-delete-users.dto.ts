import { IsArray, IsString, IsOptional, ArrayNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkDeleteUsersDto {
  @ApiProperty({ description: 'Array of user IDs to delete', type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  userIds: string[];

  @ApiPropertyOptional({ description: 'Optional administrative reason for audit logs' })
  @IsOptional()
  @IsString()
  reason?: string;
}
