import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiProperty({
    enum: ['RERA_CERTIFICATE', 'AGENCY_LICENSE', 'IDENTITY_DOCUMENT', 'ADDRESS_PROOF', 'OTHER'],
    example: 'RERA_CERTIFICATE',
  })
  @IsNotEmpty()
  @IsEnum(['RERA_CERTIFICATE', 'AGENCY_LICENSE', 'IDENTITY_DOCUMENT', 'ADDRESS_PROOF', 'OTHER'])
  documentType: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c' })
  @IsNotEmpty()
  @IsString()
  documentUrl: string;

  @ApiProperty({ example: 'UP_RERA_Certificate_2026.pdf' })
  @IsNotEmpty()
  @IsString()
  documentName: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ example: 1048576 })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({ example: 'UPRERA/AGT/2026/892' })
  @IsOptional()
  @IsString()
  documentNumber?: string;
}
