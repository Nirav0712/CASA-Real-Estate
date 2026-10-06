import { IsString, IsOptional, IsEmail, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePurchaserProfileDto {
  @ApiPropertyOptional({ example: 'Arun Kumar' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'arun.buyer@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 'en', enum: ['en', 'hi', 'ar', 'ur'] })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @ApiPropertyOptional({ example: 'Lucknow' })
  @IsOptional()
  @IsString()
  preferredCity?: string;

  @ApiPropertyOptional({ example: 'Gomti Nagar' })
  @IsOptional()
  @IsString()
  preferredLocation?: string;

  @ApiPropertyOptional({ example: 3000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMin?: number;

  @ApiPropertyOptional({ example: 15000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMax?: number;

  @ApiPropertyOptional({ example: 'APARTMENT' })
  @IsOptional()
  @IsString()
  preferredCategory?: string;

  @ApiPropertyOptional({ example: 'SALE', enum: ['SALE', 'RENT', 'LEASE'] })
  @IsOptional()
  @IsString()
  preferredListingType?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  bedrooms?: number;

  @ApiPropertyOptional({ example: 'SEMI_FURNISHED' })
  @IsOptional()
  @IsString()
  furnishing?: string;
}
