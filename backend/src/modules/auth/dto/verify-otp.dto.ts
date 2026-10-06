import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
