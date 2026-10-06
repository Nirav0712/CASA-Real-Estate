import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ComparePropertiesDto {
  @ApiProperty({ description: 'Array of 2 to 4 Property IDs to compare', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  propertyIds: string[];
}
