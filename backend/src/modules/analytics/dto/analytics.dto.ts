import { IsString, IsOptional, IsObject, IsEnum, IsNumber, Min, Max } from 'class-validator';

export class TrackEventDto {
  @IsString()
  eventType: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsObject()
  location?: {
    city?: string;
    locality?: string;
    state?: string;
  };

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  device?: string;

  @IsOptional()
  @IsString()
  referrer?: string;
}

export class ResolveRiskFlagDto {
  @IsEnum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'])
  status: string;

  @IsOptional()
  @IsString()
  actionTaken?: string;
}

export class CreateRiskFlagDto {
  @IsEnum(['PROPERTY', 'AGENT', 'USER', 'REVIEW'])
  targetType: string;

  @IsString()
  targetId: string;

  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  riskLevel: string;

  @IsString()
  flagReason: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, any>;
}

export class AnalyticsQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
