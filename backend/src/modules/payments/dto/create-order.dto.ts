import { IsEnum, IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentPurpose } from '../enums/payment.enums';

export class CreatePaymentOrderDto {
  @ApiProperty({
    enum: PaymentPurpose,
    description: 'Controlled payment purpose',
    example: PaymentPurpose.FEATURED_PROPERTY,
  })
  @IsEnum(PaymentPurpose)
  @IsNotEmpty()
  purpose: PaymentPurpose;

  @ApiPropertyOptional({
    description: 'Entity reference ID (e.g. Property ID for FEATURED_PROPERTY or Plan code for SUBSCRIPTION)',
    example: 'prop-101',
  })
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiPropertyOptional({
    description: 'Specific product package code from pricing catalog',
    example: 'FEATURED_PROPERTY',
  })
  @IsString()
  @IsOptional()
  productCode?: string;

  @ApiPropertyOptional({
    description: 'Additional contextual metadata (customer notes, redirect urls)',
    example: { propertyTitle: '3BHK Villa in Gomti Nagar' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
