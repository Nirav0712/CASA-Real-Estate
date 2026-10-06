import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus, PaymentPurpose } from '../enums/payment.enums';

export class PaymentQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Limit per page', default: 20 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ enum: PaymentStatus, description: 'Filter by Payment Status' })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiPropertyOptional({ enum: PaymentPurpose, description: 'Filter by Payment Purpose' })
  @IsEnum(PaymentPurpose)
  @IsOptional()
  purpose?: PaymentPurpose;

  @ApiPropertyOptional({ description: 'Filter by User ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by Reference ID (e.g. Property ID)' })
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Start Date (ISO format)' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End Date (ISO format)' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Search keyword (Order ID, Payment ID, User)' })
  @IsString()
  @IsOptional()
  q?: string;
}
