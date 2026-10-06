import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartConversationDto {
  @ApiProperty({ description: 'Recipient user ObjectId (Agent or Buyer)' })
  @IsNotEmpty()
  @IsString()
  recipientId: string;

  @ApiPropertyOptional({ description: 'Optional property ObjectId context' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ description: 'Initial message content' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  initialMessage?: string;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Message text content' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  content: string;
}
