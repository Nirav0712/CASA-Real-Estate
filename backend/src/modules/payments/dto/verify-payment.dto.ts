import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty({
    description: 'CASA Internal Order ID',
    example: 'CASA_ORD_1728200000000_A1B2',
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'Razorpay Payment ID returned from checkout SDK',
    example: 'pay_test_90812345678',
  })
  @IsString()
  @IsNotEmpty()
  razorpayPaymentId: string;

  @ApiProperty({
    description: 'Razorpay HMAC-SHA256 Signature',
    example: '5b8b89c74ef9f7a9321c...',
  })
  @IsString()
  @IsNotEmpty()
  razorpaySignature: string;
}
