import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToWishlistDto {
  @ApiProperty({ description: 'MongoDB ObjectId of the property' })
  @IsNotEmpty()
  @IsString()
  propertyId: string;

  @ApiPropertyOptional({ description: 'Optional user note for saved property' })
  @IsOptional()
  @IsString()
  notes?: string;
}
