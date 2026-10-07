import { IsNotEmpty, IsString, IsOptional, Matches, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../enums/auth.enums';

export class RequestOtpDto {
  @ApiProperty({
    description: 'User mobile number with optional country code (e.g. +919876543210 or 9876543210)',
    example: '+919876543210',
  })
  @IsNotEmpty({ message: 'Mobile number is required' })
  @IsString({ message: 'Mobile number must be a string' })
  @Matches(/^(\+?[0-9]{1,4})?[0-9]{10}$/, {
    message: 'Please provide a valid 10-digit mobile number with optional country code',
  })
  mobile: string;

  @ApiPropertyOptional({
    description: 'Full name for new user registration',
    example: 'Aarav Sharma',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Initial role intent for new user (Admin roles cannot be self-assigned)',
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
  @IsEnum(
    [
      UserRole.BUYER,
      UserRole.TENANT,
      UserRole.PURCHASER,
      UserRole.PROPERTY_OWNER,
      UserRole.AGENT,
      UserRole.BROKER,
      UserRole.DEVELOPER,
    ],
    {
      message:
        'Public registration allows only BUYER, TENANT, PURCHASER, PROPERTY_OWNER, AGENT, BROKER, or DEVELOPER roles.',
    },
  )
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Agency or company name (if registering as Agent/Broker or Builder)',
    example: 'Apex Realty Solutions',
  })
  @IsOptional()
  @IsString()
  agencyName?: string;
}
