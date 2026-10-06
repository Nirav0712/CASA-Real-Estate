import { IsString, IsNotEmpty, IsOptional, IsEnum, Matches, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadSource } from '../enums/lead.enums';

export class CreateLeadDto {
  @ApiProperty({ example: 'prop-1791193382409' })
  @IsNotEmpty({ message: 'Property ID is required' })
  @IsString()
  propertyId: string;

  @ApiProperty({ example: 'Rohit Malhotra' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  name: string;

  @ApiProperty({ example: '+919876543210' })
  @IsNotEmpty({ message: 'Contact mobile number is required' })
  @Matches(/^(\+?[0-9]{1,4})?[0-9]{10}$/, {
    message: 'Please provide a valid 10-digit mobile number with optional country code',
  })
  mobile: string;

  @ApiPropertyOptional({ example: 'rohit@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'Inquiry regarding 4 BHK Villa' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ example: 'Hi, I am interested in scheduling a site visit for this 4 BHK Villa.' })
  @IsNotEmpty({ message: 'Message is required' })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    enum: Object.values(LeadSource),
    default: LeadSource.PROPERTY_ENQUIRY,
  })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: string;

  @ApiPropertyOptional({ example: { min: 10000000, max: 15000000 } })
  @IsOptional()
  @IsObject()
  budget?: { min?: number; max?: number; currency?: string };

  @ApiPropertyOptional({ example: 'Prahlad Nagar, Ahmedabad' })
  @IsOptional()
  @IsString()
  preferredLocation?: string;
}
