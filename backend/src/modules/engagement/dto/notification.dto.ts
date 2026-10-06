import { IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter only unread notifications' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  unreadOnly?: boolean;
}
