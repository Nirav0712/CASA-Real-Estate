import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetFollowUpDto {
  @ApiProperty({ example: '2026-10-10T10:00:00.000Z' })
  @IsNotEmpty({ message: 'Next follow up date is required' })
  @IsDateString()
  nextFollowUpAt: string;

  @ApiPropertyOptional({ example: 'Follow up call to confirm site visit timing.' })
  @IsOptional()
  @IsString()
  note?: string;
}
