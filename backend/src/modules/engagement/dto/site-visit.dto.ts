import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSiteVisitDto {
  @ApiProperty({ description: 'Property ID to visit' })
  @IsNotEmpty()
  @IsString()
  propertyId: string;

  @ApiProperty({ description: 'Preferred visit date (ISO 8601)' })
  @IsNotEmpty()
  @IsDateString()
  preferredDate: string;

  @ApiProperty({ description: 'Preferred time slot, e.g. 10:00 AM - 12:00 PM' })
  @IsNotEmpty()
  @IsString()
  preferredTimeSlot: string;

  @ApiProperty({ description: 'Visitor full name' })
  @IsNotEmpty()
  @IsString()
  buyerName: string;

  @ApiProperty({ description: 'Visitor contact mobile number' })
  @IsNotEmpty()
  @IsString()
  buyerMobile: string;

  @ApiPropertyOptional({ description: 'Visitor email' })
  @IsOptional()
  @IsString()
  buyerEmail?: string;

  @ApiPropertyOptional({ description: 'Special requests or notes' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class RescheduleSiteVisitDto {
  @ApiProperty({ description: 'New proposed visit date (ISO 8601)' })
  @IsNotEmpty()
  @IsDateString()
  rescheduledDate: string;

  @ApiProperty({ description: 'New proposed time slot' })
  @IsNotEmpty()
  @IsString()
  rescheduledTimeSlot: string;

  @ApiPropertyOptional({ description: 'Reason or notes for rescheduling' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelSiteVisitDto {
  @ApiPropertyOptional({ description: 'Cancellation reason' })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
