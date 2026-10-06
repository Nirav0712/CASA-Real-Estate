import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType } from '../enums/lead.enums';

export class CreateLeadActivityDto {
  @ApiProperty({
    enum: Object.values(ActivityType),
    example: ActivityType.CALL,
  })
  @IsNotEmpty()
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiProperty({ example: 'Connected with purchaser on phone. Discussed financing options.' })
  @IsNotEmpty()
  @IsString()
  note: string;

  @ApiPropertyOptional({ example: { callDurationSec: 240, outcome: 'POSITIVE' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
