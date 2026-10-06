import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportReason, ReportStatus } from '../schemas/property-report.schema';

export class CreateReportDto {
  @ApiProperty({ description: 'Property ID to report' })
  @IsNotEmpty()
  @IsString()
  propertyId: string;

  @ApiProperty({ enum: ReportReason, description: 'Reason for reporting' })
  @IsNotEmpty()
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiProperty({ description: 'Detailed explanation of the issue' })
  @IsNotEmpty()
  @IsString()
  description: string;
}

export class ResolveReportDto {
  @ApiProperty({ enum: ReportStatus, description: 'Updated report status' })
  @IsNotEmpty()
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @ApiPropertyOptional({ description: 'Internal or user-facing resolution notes' })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @ApiPropertyOptional({ description: 'Action taken (e.g. UNPUBLISHED, WARNED, REJECTED_REPORT)' })
  @IsOptional()
  @IsString()
  actionTaken?: string;
}
