import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { PaymentsAdminController } from './payments-admin.controller';
import { PaymentsService } from './payments.service';
import { RazorpayPaymentProvider } from './providers/razorpay.provider';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { Subscription, SubscriptionSchema } from './schemas/subscription.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { AuditLog, AuditLogSchema } from '../admin/schemas/audit-log.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Property.name, schema: PropertySchema },
      { name: User.name, schema: UserSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    AuthModule,
  ],
  controllers: [PaymentsController, PaymentsAdminController],
  providers: [PaymentsService, RazorpayPaymentProvider],
  exports: [PaymentsService, RazorpayPaymentProvider],
})
export class PaymentsModule {}

