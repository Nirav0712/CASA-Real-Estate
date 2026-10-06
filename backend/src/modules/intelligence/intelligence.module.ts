import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IntelligenceService } from './intelligence.service';
import { IntelligenceController } from './intelligence.controller';
import { BuyerIntent, BuyerIntentSchema } from './schemas/buyer-intent.schema';
import {
  AutomationRule,
  AutomationRuleSchema,
  AutomationExecution,
  AutomationExecutionSchema,
  FollowUpTask,
  FollowUpTaskSchema,
} from './schemas/automation-rule.schema';
import {
  PropertyPromotion,
  PropertyPromotionSchema,
  PromotionPlan,
  PromotionPlanSchema,
} from './schemas/promotion.schema';
import {
  SubscriptionPlan,
  SubscriptionPlanSchema,
  UsageCounter,
  UsageCounterSchema,
} from './schemas/subscription-entitlement.schema';
import {
  NotificationPreference,
  NotificationPreferenceSchema,
} from './schemas/notification-preference.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Lead, LeadSchema } from '../leads/schemas/lead.schema';
import { Wishlist, WishlistSchema } from '../engagement/schemas/wishlist.schema';
import { SavedSearch, SavedSearchSchema } from '../engagement/schemas/saved-search.schema';
import { SiteVisit, SiteVisitSchema } from '../engagement/schemas/site-visit.schema';
import { AnalyticsEvent, AnalyticsEventSchema } from '../analytics/schemas/analytics-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BuyerIntent.name, schema: BuyerIntentSchema },
      { name: AutomationRule.name, schema: AutomationRuleSchema },
      { name: AutomationExecution.name, schema: AutomationExecutionSchema },
      { name: FollowUpTask.name, schema: FollowUpTaskSchema },
      { name: PropertyPromotion.name, schema: PropertyPromotionSchema },
      { name: PromotionPlan.name, schema: PromotionPlanSchema },
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: UsageCounter.name, schema: UsageCounterSchema },
      { name: NotificationPreference.name, schema: NotificationPreferenceSchema },
      { name: Property.name, schema: PropertySchema },
      { name: User.name, schema: UserSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: Wishlist.name, schema: WishlistSchema },
      { name: SavedSearch.name, schema: SavedSearchSchema },
      { name: SiteVisit.name, schema: SiteVisitSchema },
      { name: AnalyticsEvent.name, schema: AnalyticsEventSchema },
    ]),
  ],
  controllers: [IntelligenceController],
  providers: [IntelligenceService],
  exports: [IntelligenceService],
})
export class IntelligenceModule {}
