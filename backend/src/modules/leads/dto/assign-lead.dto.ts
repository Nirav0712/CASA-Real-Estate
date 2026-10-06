import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignLeadDto {
  @ApiProperty({ example: '6ac48b6f1e9ac64331682985' })
  @IsNotEmpty({ message: 'Target Agent ID is required' })
  @IsString()
  assignedAgentId: string;

  @ApiPropertyOptional({ example: 'Assigning to premium territory agent for Ahmedabad.' })
  @IsOptional()
  @IsString()
  note?: string;
}
