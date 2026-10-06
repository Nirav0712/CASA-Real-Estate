import { IsNotEmpty, IsString, IsNumber, Min, Max, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewTargetType, ReviewStatus } from '../schemas/review.schema';

export class CreateReviewDto {
  @ApiProperty({ enum: ReviewTargetType, description: 'Target entity type (AGENT or PROPERTY)' })
  @IsNotEmpty()
  @IsEnum(ReviewTargetType)
  targetType: ReviewTargetType;

  @ApiProperty({ description: 'Target ObjectId (Agent User ID or Property ID)' })
  @IsNotEmpty()
  @IsString()
  targetId: string;

  @ApiProperty({ description: 'Rating score from 1 to 5', minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Short title for review' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Review body text' })
  @IsNotEmpty()
  @IsString()
  comment: string;
}

export class ModerateReviewDto {
  @ApiProperty({ enum: ReviewStatus, description: 'New status for review' })
  @IsNotEmpty()
  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @ApiPropertyOptional({ description: 'Reason for moderation action' })
  @IsOptional()
  @IsString()
  reason?: string;
}
