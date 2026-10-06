import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { PromotionType } from '../schemas/promotion.schema';
import { AutomationTrigger, AutomationAction } from '../schemas/automation-rule.schema';

export class RecommendationQueryDto {
  @ApiPropertyOptional({ description: 'Target property ID to generate similar properties for' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ description: 'City preference' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Limit recommendations count', default: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number = 6;
}

export class CreatePromotionDto {
  @ApiProperty({ description: 'Property ID to promote' })
  @IsNotEmpty()
  @IsString()
  propertyId: string;

  @ApiProperty({ description: 'Promotion plan code (e.g. BOOST_7D, TOP_SEARCH_14D)' })
  @IsNotEmpty()
  @IsString()
  planCode: string;

  @ApiProperty({ description: 'Promotion Type', enum: PromotionType })
  @IsEnum(PromotionType)
  type: PromotionType;

  @ApiPropertyOptional({ description: 'Optional payment transaction ID reference' })
  @IsOptional()
  @IsString()
  paymentId?: string;
}

export class CreateAutomationRuleDto {
  @ApiProperty({ description: 'Rule name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Trigger event', enum: AutomationTrigger })
  @IsEnum(AutomationTrigger)
  trigger: AutomationTrigger;

  @ApiProperty({ description: 'Action to execute', enum: AutomationAction })
  @IsEnum(AutomationAction)
  action: AutomationAction;

  @ApiPropertyOptional({ description: 'Condition filters' })
  @IsOptional()
  conditions?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Action payload arguments' })
  @IsOptional()
  actionPayload?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Delay in minutes before executing' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  delayMinutes?: number = 0;
}

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  newMatchingProperties?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  priceDropAlerts?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  leadUpdates?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  siteVisitReminders?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  chatMessages?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  promotionsAndBilling?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailChannel?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  inAppChannel?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  smsChannel?: boolean;
}

export class PricingIntelligenceQueryDto {
  @ApiPropertyOptional({ description: 'City name (e.g. Lucknow, Mumbai)' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Category (e.g. Apartment, House / Home)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Listing Type (SALE, RENT)' })
  @IsOptional()
  @IsString()
  listingType?: string;
}
