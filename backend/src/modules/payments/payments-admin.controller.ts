import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import {
  SubscriptionRequestQueryDto,
  DenySubscriptionRequestDto,
} from './dto/subscription-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/enums/auth.enums';

@ApiTags('Admin Payments & Revenue')
@Controller('admin/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class PaymentsAdminController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all global marketplace transactions with revenue KPIs (Admin)' })
  @ApiResponse({ status: 200, description: 'Paginated transactions and financial metrics returned' })
  getAdminPayments(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaymentQueryDto,
  ) {
    return this.paymentsService.getAdminPayments(user, query);
  }

  @Get('subscription-requests')
  @ApiOperation({ summary: 'List all subscription requests with approval statuses (Admin)' })
  @ApiResponse({ status: 200, description: 'Paginated subscription requests returned' })
  getAdminSubscriptionRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SubscriptionRequestQueryDto,
  ) {
    return this.paymentsService.getAdminSubscriptionRequests(user, query);
  }

  @Post('subscription-requests/:id/approve')
  @ApiOperation({ summary: 'Approve subscription request and activate user plan entitlements immediately (Admin)' })
  @ApiResponse({ status: 200, description: 'Subscription approved and plan activated' })
  approveSubscriptionRequest(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.approveSubscriptionRequest(id, user);
  }

  @Post('subscription-requests/:id/deny')
  @ApiOperation({ summary: 'Deny subscription request with reason (Admin)' })
  @ApiResponse({ status: 200, description: 'Subscription request denied' })
  denySubscriptionRequest(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DenySubscriptionRequestDto,
  ) {
    return this.paymentsService.denySubscriptionRequest(id, user, dto);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Issue transaction refund via payment gateway (Admin)' })
  @ApiResponse({ status: 200, description: 'Transaction refunded and status updated' })
  refundPayment(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentsService.refundPayment(id, user, dto);
  }
}
