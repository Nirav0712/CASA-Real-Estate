import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsArray,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBrokerEmployeeDto {
  @ApiProperty({ description: 'Full name of the employee', example: 'Rahul Sharma' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Email address of the employee', example: 'rahul@casabroker.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Mobile phone number with country code', example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  mobile: string;

  @ApiPropertyOptional({ description: 'Initial login password (min 8 characters)', example: 'SecurePass@123' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ description: 'Employee designation in the brokerage', example: 'Senior Sales Associate' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ description: 'List of assigned permission keys', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({ description: 'List of assigned property IDs for restricted scope', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedProperties?: string[];
}

export class UpdateBrokerEmployeeDto {
  @ApiPropertyOptional({ description: 'Full name of the employee' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Email address of the employee' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Mobile phone number with country code' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ description: 'Updated password' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ description: 'Employee designation' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ description: 'List of assigned permission keys', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({ description: 'List of assigned property IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedProperties?: string[];

  @ApiPropertyOptional({ description: 'Account status (ACTIVE, DEACTIVATED, SUSPENDED)' })
  @IsOptional()
  @IsString()
  status?: string;
}
