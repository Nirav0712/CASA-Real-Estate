import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { PaymentsAdminController } from './payments-admin.controller';
import { PaymentsService } from './payments.service';
import { RazorpayPaymentProvider } from './providers/razorpay.provider';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { Subscription, SubscriptionSchema } from './schemas/subscription.schema';
import { SubscriptionRequest, SubscriptionRequestSchema } from './schemas/subscription-request.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { AuditLog, AuditLogSchema } from '../admin/schemas/audit-log.schema';
import { Package, PackageSchema } from '../entitlements/schemas/package.schema';
import { Notification, NotificationSchema } from '../engagement/schemas/notification.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: SubscriptionRequest.name, schema: SubscriptionRequestSchema },
      { name: Property.name, schema: PropertySchema },
      { name: User.name, schema: UserSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: Package.name, schema: PackageSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
    AuthModule,
  ],
  controllers: [PaymentsController, PaymentsAdminController],
  providers: [PaymentsService, RazorpayPaymentProvider],
  exports: [PaymentsService, RazorpayPaymentProvider],
})
export class PaymentsModule {}

