import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
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
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { HttpLoggingMiddleware } from './common/middleware/logging.middleware';
import { RateLimitGuard } from './common/guards/rate-limit.guard';

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
    AnalyticsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware, HttpLoggingMiddleware).forRoutes('*');
  }
}
