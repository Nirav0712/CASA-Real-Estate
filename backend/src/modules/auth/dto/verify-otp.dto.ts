import { IsNotEmpty, IsString, Matches, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../enums/auth.enums';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'User mobile number (matching the request)',
    example: '+919876543210',
  })
  @IsNotEmpty({ message: 'Mobile number is required' })
  @IsString()
  @Matches(/^(\+?[0-9]{1,4})?[0-9]{10}$/, {
    message: 'Please provide a valid mobile number',
  })
  mobile: string;

  @ApiProperty({
    description: '6-digit OTP verification code',
    example: '123456',
  })
  @IsNotEmpty({ message: 'OTP is required' })
  @IsString()
  @Matches(/^[0-9]{6}$/, {
    message: 'OTP must be exactly 6 numeric digits',
  })
  otp: string;

  @ApiPropertyOptional({
    description: 'Full name for user',
    example: 'Aarav Sharma',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Role for user',
    enum: [
      UserRole.BUYER,
      UserRole.TENANT,
      UserRole.PURCHASER,
      UserRole.PROPERTY_OWNER,
      UserRole.AGENT,
      UserRole.BROKER,
      UserRole.DEVELOPER,
    ],
    example: UserRole.BUYER,
  })
  @IsOptional()
  @IsEnum([
    UserRole.BUYER,
    UserRole.TENANT,
    UserRole.PURCHASER,
    UserRole.PROPERTY_OWNER,
    UserRole.AGENT,
    UserRole.BROKER,
    UserRole.DEVELOPER,
  ])
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Agency or company name',
    example: 'Apex Realty Solutions',
  })
  @IsOptional()
  @IsString()
  agencyName?: string;
}
