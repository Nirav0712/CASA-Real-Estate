import { Module, Global, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './schemas/role.schema';
import { Package, PackageSchema } from './schemas/package.schema';
import { PropertyView, PropertyViewSchema } from './schemas/property-view.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Subscription, SubscriptionSchema } from '../payments/schemas/subscription.schema';
import { AuditLog, AuditLogSchema } from '../admin/schemas/audit-log.schema';
import { EntitlementsService } from './entitlements.service';
import { EntitlementsAdminController } from './entitlements-admin.controller';
import { EntitlementsClientController } from './entitlements-client.controller';
import { PermissionsGuard } from './guards/permissions.guard';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema },
      { name: Package.name, schema: PackageSchema },
      { name: PropertyView.name, schema: PropertyViewSchema },
      { name: User.name, schema: UserSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [EntitlementsAdminController, EntitlementsClientController],
  providers: [EntitlementsService, PermissionsGuard],
  exports: [EntitlementsService, PermissionsGuard, MongooseModule],
})
export class EntitlementsModule {}
