import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { AgentsModule } from './modules/agents/agents.module';
import { LeadsModule } from './modules/leads/leads.module';
import { PurchaserModule } from './modules/purchaser/purchaser.module';
import { LocationsModule } from './modules/locations/locations.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { EngagementModule } from './modules/engagement/engagement.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.local'],
    }),
    DatabaseModule,
    HealthModule,
    PropertiesModule,
    AuthModule,
    AdminModule,
    AgentsModule,
    LeadsModule,
    PurchaserModule,
    LocationsModule,
    PaymentsModule,
    EngagementModule,
  ],
})
export class AppModule {}

