import { IsNotEmpty, IsString, IsEmail, MinLength, IsOptional, IsEnum, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, AccountType } from '../enums/auth.enums';

export class RegisterDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'Aarav Sharma',
  })
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString({ message: 'Full name must be a string' })
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  fullName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'aarav.sharma@example.com',
  })
  @IsNotEmpty({ message: 'Email address is required' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Mobile number with country code (e.g. +919876543210)',
    example: '+919876543210',
  })
  @IsNotEmpty({ message: 'Mobile number is required' })
  @IsString({ message: 'Mobile number must be a string' })
  @Matches(/^(\+?[0-9]{1,4})?[0-9]{10}$/, {
    message: 'Please provide a valid 10-digit mobile number with optional country code',
  })
  mobile: string;

  @ApiProperty({
    description: 'Password (minimum 8 characters)',
    example: 'P@ssw0rd2026',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    description: 'Password confirmation',
    example: 'P@ssw0rd2026',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Confirm password is required' })
  @IsString({ message: 'Confirm password must be a string' })
  @MinLength(8, { message: 'Confirm password must be at least 8 characters long' })
  confirmPassword: string;

  @ApiPropertyOptional({
    description: 'Public account category / role intent or custom role slug',
    example: 'buyer',
  })
  @IsOptional()
  @IsString({ message: 'Role must be a valid role identifier' })
  role?: string;

  @ApiPropertyOptional({
    description: 'Alternative account type field or custom role identifier',
    example: 'BUYER',
  })
  @IsOptional()
  @IsString({ message: 'Account type must be a valid identifier' })
  accountType?: string;

  @ApiPropertyOptional({
    description: 'Agency or company name (for Agents, Brokers, and Developers)',
    example: 'Apex Realty Solutions',
  })
  @IsOptional()
  @IsString()
  agencyName?: string;
}
