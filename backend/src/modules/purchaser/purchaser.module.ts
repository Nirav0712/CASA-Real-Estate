import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchaserController } from './purchaser.controller';
import { PurchaserService } from './purchaser.service';
import { SavedProperty, SavedPropertySchema } from './schemas/saved-property.schema';
import { RecentlyViewed, RecentlyViewedSchema } from './schemas/recently-viewed.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { Lead, LeadSchema } from '../leads/schemas/lead.schema';
import { AuditLog, AuditLogSchema } from '../admin/schemas/audit-log.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SavedProperty.name, schema: SavedPropertySchema },
      { name: RecentlyViewed.name, schema: RecentlyViewedSchema },
      { name: User.name, schema: UserSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Lead.name, schema: LeadSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    AuthModule,
  ],
  controllers: [PurchaserController],
  providers: [PurchaserService],
  exports: [PurchaserService],
})
export class PurchaserModule {}
