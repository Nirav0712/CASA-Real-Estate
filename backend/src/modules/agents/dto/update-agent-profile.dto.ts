import { IsString, IsOptional, IsNumber, IsArray, IsObject, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAgentProfileDto {
  @ApiPropertyOptional({ example: 'Vikram Real Estate' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: 'Verma Luxury Estates' })
  @IsOptional()
  @IsString()
  agencyName?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa' })
  @IsOptional()
  @IsString()
  agencyLogo?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiPropertyOptional({ example: 'Principal Broker & Residential Advisor' })
  @IsOptional()
  @IsString()
  professionalTitle?: string;

  @ApiPropertyOptional({ example: 'Experienced real estate consultant specializing in premium Lucknow properties.' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  experienceYears?: number;

  @ApiPropertyOptional({ example: '+919925843599' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@vermaestates.in' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'https://vermaestates.in' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  socialLinks?: {
    whatsapp?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };

  @ApiPropertyOptional({ example: 'Office 402, Cyber Tower, Vibhuti Khand' })
  @IsOptional()
  @IsString()
  officeAddress?: string;

  @ApiPropertyOptional({ example: 'Uttar Pradesh' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'Lucknow' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: 'Lucknow' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Gomti Nagar' })
  @IsOptional()
  @IsString()
  locality?: string;

  @ApiPropertyOptional({ example: '226010' })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({ example: ['Gomti Nagar', 'Hazratganj', 'Shaheed Path'] })
  @IsOptional()
  @IsArray()
  areasServed?: string[];

  @ApiPropertyOptional({ example: ['Luxury Apartments', 'Commercial Plots', 'Villas'] })
  @IsOptional()
  @IsArray()
  specializations?: string[];

  @ApiPropertyOptional({ example: ['English', 'Hindi', 'Urdu'] })
  @IsOptional()
  @IsArray()
  languages?: string[];

  @ApiPropertyOptional({ example: 'UPRERAAGT12890' })
  @IsOptional()
  @IsString()
  reraNumber?: string;

  @ApiPropertyOptional({ example: 'Uttar Pradesh' })
  @IsOptional()
  @IsString()
  reraState?: string;

  @ApiPropertyOptional({ example: 'UP RERA Authority' })
  @IsOptional()
  @IsString()
  reraAuthority?: string;
}
