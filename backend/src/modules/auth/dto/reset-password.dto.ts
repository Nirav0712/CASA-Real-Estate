import { IsNotEmpty, IsString, IsEmail, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token received via email',
    example: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
  })
  @IsNotEmpty({ message: 'Reset token is required' })
  @IsString({ message: 'Reset token must be a string' })
  token: string;

  @ApiPropertyOptional({
    description: 'Email address of the account being reset (optional if reset token is unique)',
    example: 'aarav.sharma@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email?: string;

  @ApiProperty({
    description: 'New password (minimum 8 characters)',
    example: 'NewP@ssw0rd2026',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString({ message: 'New password must be a string' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string;

  @ApiProperty({
    description: 'Confirm new password',
    example: 'NewP@ssw0rd2026',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Confirm password is required' })
  @IsString({ message: 'Confirm password must be a string' })
  @MinLength(8, { message: 'Confirm password must be at least 8 characters long' })
  confirmPassword: string;
}
