import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Location, LocationSchema } from './schemas/location.schema';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { AdminLocationsController } from './admin-locations.controller';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { AuditLog, AuditLogSchema } from '../admin/schemas/audit-log.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Location.name, schema: LocationSchema },
      { name: Property.name, schema: PropertySchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    AuthModule,
  ],
  controllers: [LocationsController, AdminLocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
