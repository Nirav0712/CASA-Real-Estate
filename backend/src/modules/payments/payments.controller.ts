import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/enums/auth.enums';

@ApiTags('Payments & Monetization')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('pricing')
  @ApiOperation({ summary: 'Get active marketplace monetization packages & pricing' })
  @ApiResponse({ status: 200, description: 'Pricing catalog returned' })
  getPricingCatalog() {
    return this.paymentsService.getPricingCatalog();
  }

  @Get('config/public-key')
  @ApiOperation({ summary: 'Get public gateway key configuration for client SDK' })
  @ApiResponse({ status: 200, description: 'Public key ID returned' })
  getPublicConfig() {
    return this.paymentsService.getPublicGatewayConfig();
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create server-side payment order for monetization products' })
  @ApiResponse({ status: 201, description: 'Payment order created with Razorpay order details' })
  createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentOrderDto,
  ) {
    return this.paymentsService.createOrder(user, dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify Razorpay payment signature and activate paid service' })
  @ApiResponse({ status: 200, description: 'Payment verified and service activated' })
  verifyPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPayment(user, dto);
  }

  @Post('webhook/razorpay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Secure Razorpay webhook handler for server-to-server settlement' })
  @ApiResponse({ status: 200, description: 'Webhook event processed' })
  handleWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    // In express, rawBody or JSON.stringify(body)
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(body);
    return this.paymentsService.handleWebhook(signature || '', rawBody, body);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment history for authenticated user' })
  @ApiResponse({ status: 200, description: 'Paginated user payments returned' })
  getMyPayments(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaymentQueryDto,
  ) {
    return this.paymentsService.getMyPayments(user, query);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all global marketplace transactions (Admin)' })
  @ApiResponse({ status: 200, description: 'Global transactions and metrics returned' })
  getAdminPaymentsAlias(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaymentQueryDto,
  ) {
    return this.paymentsService.getAdminPayments(user, query);
  }

  @Post('admin/:id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue transaction refund (Admin)' })
  @ApiResponse({ status: 200, description: 'Transaction refunded' })
  refundPaymentAlias(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentsService.refundPayment(id, user, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get single transaction receipt and details' })
  @ApiResponse({ status: 200, description: 'Payment details returned' })
  getPaymentById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.getPaymentById(id, user);
  }
}
