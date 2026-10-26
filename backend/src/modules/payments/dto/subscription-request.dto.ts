import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SubscriptionContactMethod,
  SubscriptionRequestStatus,
} from '../schemas/subscription-request.schema';

export class CreateSubscriptionRequestDto {
  @ApiProperty({ description: 'ID of the pricing plan / package to subscribe to' })
  @IsString()
  @IsNotEmpty()
  packageId: string;

  @ApiPropertyOptional({
    enum: SubscriptionContactMethod,
    description: 'Selected customer contact preference: WHATSAPP or CALL',
    default: SubscriptionContactMethod.WHATSAPP,
  })
  @IsOptional()
  @IsEnum(SubscriptionContactMethod)
  contactMethod?: SubscriptionContactMethod;
}

export class DenySubscriptionRequestDto {
  @ApiPropertyOptional({ description: 'Reason for declining the subscription activation request' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SubscriptionRequestQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by request status (PENDING, APPROVED, DENIED, or ALL)',
    default: 'ALL',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Search by reference, user name, mobile, or plan name' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
