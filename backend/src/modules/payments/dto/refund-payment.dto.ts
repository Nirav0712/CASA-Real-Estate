import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefundPaymentDto {
  @ApiPropertyOptional({
    description: 'Partial refund amount (defaults to full transaction amount if omitted)',
    example: 1999,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Reason for refund',
    example: 'Customer requested cancellation within 24 hours',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
