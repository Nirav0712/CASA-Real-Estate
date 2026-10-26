import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeaturedRequestDto {
  @ApiProperty({ description: 'Property ID or MongoDB ID to feature', example: 'prop-12345' })
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @ApiProperty({ description: 'Requested duration in days (7, 15, or 30)', example: 30, enum: [7, 15, 30] })
  @IsNumber()
  @IsIn([7, 15, 30, 60, 90])
  durationDays: number;

  @ApiPropertyOptional({ description: 'Requested start date (ISO string)', example: '2026-11-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  requestedStartDate?: string;

  @ApiPropertyOptional({ description: 'Notes or reasoning for featured placement' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ApproveFeaturedRequestDto {
  @ApiPropertyOptional({ description: 'Approved duration in days', example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  approvedDurationDays?: number;

  @ApiPropertyOptional({ description: 'Approved start date', example: '2026-11-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  approvedStartDate?: string;
}

export class RejectFeaturedRequestDto {
  @ApiPropertyOptional({ description: 'Reason for rejection', example: 'Image quality does not meet marketplace standards' })
  @IsOptional()
  @IsString()
  reason?: string;
}
