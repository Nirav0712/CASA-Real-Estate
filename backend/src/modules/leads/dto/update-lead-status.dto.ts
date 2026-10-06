import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatus, LeadPriority } from '../enums/lead.enums';

export class UpdateLeadStatusDto {
  @ApiProperty({
    enum: Object.values(LeadStatus),
    example: LeadStatus.CONTACTED,
  })
  @IsNotEmpty()
  @IsEnum(LeadStatus)
  status: LeadStatus;

  @ApiPropertyOptional({ example: 'Spoke with buyer. Confirmed interest in site visit on Saturday.' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 'Buyer budget was lower than asking price.' })
  @IsOptional()
  @IsString()
  lostReason?: string;
}

export class UpdateLeadPriorityDto {
  @ApiProperty({
    enum: Object.values(LeadPriority),
    example: LeadPriority.HIGH,
  })
  @IsNotEmpty()
  @IsEnum(LeadPriority)
  priority: LeadPriority;
}
