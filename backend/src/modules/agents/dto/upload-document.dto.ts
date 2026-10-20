import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiProperty({
    enum: [
      'GST_CERTIFICATE',
      'UDYAM_CERTIFICATE',
      'RERA_CERTIFICATE',
      'AADHAAR_CARD',
      'AGENCY_LICENSE',
      'IDENTITY_DOCUMENT',
      'ADDRESS_PROOF',
      'OTHER',
    ],
    example: 'GST_CERTIFICATE',
  })
  @IsNotEmpty()
  @IsEnum([
    'GST_CERTIFICATE',
    'UDYAM_CERTIFICATE',
    'RERA_CERTIFICATE',
    'AADHAAR_CARD',
    'AGENCY_LICENSE',
    'IDENTITY_DOCUMENT',
    'ADDRESS_PROOF',
    'OTHER',
  ])
  documentType: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c' })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-front' })
  @IsOptional()
  @IsString()
  frontDocumentUrl?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-back' })
  @IsOptional()
  @IsString()
  backDocumentUrl?: string;

  @ApiProperty({ example: 'GST_Registration_Certificate.pdf' })
  @IsNotEmpty()
  @IsString()
  documentName: string;

  @ApiPropertyOptional({ example: 'BROKER_AGENCY' })
  @IsOptional()
  @IsString()
  accountType?: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ example: 1048576 })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({ example: '24AAACH7409R1ZZ' })
  @IsOptional()
  @IsString()
  documentNumber?: string;
}

