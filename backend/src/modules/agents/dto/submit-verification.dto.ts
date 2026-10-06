import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitVerificationDto {
  @ApiProperty({ example: 'UPRERAAGT12890' })
  @IsNotEmpty({ message: 'RERA Registration Number is required' })
  @IsString()
  reraNumber: string;

  @ApiPropertyOptional({ example: 'Uttar Pradesh' })
  @IsOptional()
  @IsString()
  reraState?: string;

  @ApiPropertyOptional({ example: 'Real Estate Regulatory Authority UP' })
  @IsOptional()
  @IsString()
  reraAuthority?: string;

  @ApiPropertyOptional({ example: 'Verma Luxury Real Estate Advisors' })
  @IsOptional()
  @IsString()
  agencyName?: string;

  @ApiPropertyOptional({ example: 'Application for certified verified broker badge on CASA.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
