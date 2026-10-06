import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LeadQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ example: 'NEW' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'HIGH' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: 'PROPERTY_ENQUIRY' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: '6ac48b6f1e9ac64331682985' })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsString()
  unassigned?: string;

  @ApiPropertyOptional({ example: 'prop-1791193382409' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-10-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Rohit' })
  @IsOptional()
  @IsString()
  q?: string;
}
