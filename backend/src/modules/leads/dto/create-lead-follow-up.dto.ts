import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FollowUpType } from '../enums/lead.enums';

export class CreateLeadFollowUpDto {
  @ApiProperty({ example: '2026-10-15T14:30:00.000Z' })
  @IsNotEmpty({ message: 'Due date is required' })
  @IsDateString()
  dueAt: string;

  @ApiPropertyOptional({
    enum: Object.values(FollowUpType),
    default: FollowUpType.CALL,
  })
  @IsOptional()
  @IsEnum(FollowUpType)
  type?: FollowUpType;

  @ApiProperty({ example: 'Follow up with bank loan pre-approval checklist.' })
  @IsNotEmpty()
  @IsString()
  note: string;

  @ApiPropertyOptional({ example: '6ac48b6f1e9ac64331682985' })
  @IsOptional()
  @IsString()
  assignedTo?: string;
}
