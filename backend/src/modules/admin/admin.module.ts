import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { Category, CategorySchema } from '../properties/schemas/category.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { RefreshSession, RefreshSessionSchema } from '../auth/schemas/refresh-session.schema';
import { AgentProfile, AgentProfileSchema } from '../agents/schemas/agent-profile.schema';
import { AgentVerificationDocument, AgentVerificationDocumentSchema } from '../agents/schemas/agent-document.schema';
import { Role, RoleSchema } from '../entitlements/schemas/role.schema';
import { Lead, LeadSchema } from '../leads/schemas/lead.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { SystemSetting, SystemSettingSchema } from './schemas/system-setting.schema';
import { Package, PackageSchema } from '../entitlements/schemas/package.schema';
import { Subscription, SubscriptionSchema } from '../payments/schemas/subscription.schema';
import { AuthModule } from '../auth/auth.module';

import { SettingsPublicController } from './settings-public.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Property.name, schema: PropertySchema },
      { name: Category.name, schema: CategorySchema },
      { name: User.name, schema: UserSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: RefreshSession.name, schema: RefreshSessionSchema },
      { name: AgentProfile.name, schema: AgentProfileSchema },
      { name: AgentVerificationDocument.name, schema: AgentVerificationDocumentSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: SystemSetting.name, schema: SystemSettingSchema },
      { name: Package.name, schema: PackageSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    AuthModule,
  ],
  controllers: [AdminController, SettingsPublicController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

