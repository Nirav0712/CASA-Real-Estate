import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsEvent, AnalyticsEventSchema } from './schemas/analytics-event.schema';
import { RiskFlag, RiskFlagSchema } from './schemas/risk-flag.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Lead, LeadSchema } from '../leads/schemas/lead.schema';
import { SiteVisit, SiteVisitSchema } from '../engagement/schemas/site-visit.schema';
import { Review, ReviewSchema } from '../engagement/schemas/review.schema';
import { PropertyReport, PropertyReportSchema } from '../engagement/schemas/property-report.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AnalyticsEvent.name, schema: AnalyticsEventSchema },
      { name: RiskFlag.name, schema: RiskFlagSchema },
      { name: Property.name, schema: PropertySchema },
      { name: User.name, schema: UserSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: SiteVisit.name, schema: SiteVisitSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: PropertyReport.name, schema: PropertyReportSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
