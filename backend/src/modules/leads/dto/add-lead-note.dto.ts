import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddLeadNoteDto {
  @ApiPropertyOptional({ example: 'Client requested floor plan PDF via WhatsApp.' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ example: 'Client requested floor plan PDF via WhatsApp.' })
  @IsOptional()
  @IsString()
  note?: string;
}
