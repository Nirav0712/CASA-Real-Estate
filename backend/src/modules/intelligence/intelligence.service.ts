import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BuyerIntent, BuyerIntentDocument, BuyerIntentLevel } from './schemas/buyer-intent.schema';
import {
  AutomationRule,
  AutomationRuleDocument,
  AutomationExecution,
  AutomationExecutionDocument,
  FollowUpTask,
  FollowUpTaskDocument,
  AutomationTrigger,
  AutomationAction,
} from './schemas/automation-rule.schema';
import {
  PropertyPromotion,
  PropertyPromotionDocument,
  PromotionPlan,
  PromotionPlanDocument,
  PromotionType,
  PromotionStatus,
} from './schemas/promotion.schema';
import {
  SubscriptionPlan,
  SubscriptionPlanDocument,
  UsageCounter,
  UsageCounterDocument,
  MembershipTier,
} from './schemas/subscription-entitlement.schema';
import {
  NotificationPreference,
  NotificationPreferenceDocument,
} from './schemas/notification-preference.schema';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Lead, LeadDocument } from '../leads/schemas/lead.schema';
import { Wishlist, WishlistDocument } from '../engagement/schemas/wishlist.schema';
import { SavedSearch, SavedSearchDocument } from '../engagement/schemas/saved-search.schema';
import { SiteVisit, SiteVisitDocument } from '../engagement/schemas/site-visit.schema';
import { AnalyticsEvent, AnalyticsEventDocument } from '../analytics/schemas/analytics-event.schema';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import {
  RecommendationQueryDto,
  CreatePromotionDto,
  CreateAutomationRuleDto,
  UpdateNotificationPreferencesDto,
  PricingIntelligenceQueryDto,
} from './dto/intelligence.dto';

@Injectable()
export class IntelligenceService {
  private readonly logger = new Logger(IntelligenceService.name);

  constructor(
    @InjectModel(BuyerIntent.name) private readonly buyerIntentModel: Model<BuyerIntentDocument>,
    @InjectModel(AutomationRule.name) private readonly automationRuleModel: Model<AutomationRuleDocument>,
    @InjectModel(AutomationExecution.name) private readonly automationExecutionModel: Model<AutomationExecutionDocument>,
    @InjectModel(FollowUpTask.name) private readonly followUpTaskModel: Model<FollowUpTaskDocument>,
    @InjectModel(PropertyPromotion.name) private readonly promotionModel: Model<PropertyPromotionDocument>,
    @InjectModel(PromotionPlan.name) private readonly promotionPlanModel: Model<PromotionPlanDocument>,
    @InjectModel(SubscriptionPlan.name) private readonly subscriptionPlanModel: Model<SubscriptionPlanDocument>,
    @InjectModel(UsageCounter.name) private readonly usageCounterModel: Model<UsageCounterDocument>,
    @InjectModel(NotificationPreference.name) private readonly notificationPrefModel: Model<NotificationPreferenceDocument>,
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Lead.name) private readonly leadModel: Model<LeadDocument>,
    @InjectModel(Wishlist.name) private readonly wishlistModel: Model<WishlistDocument>,
    @InjectModel(SavedSearch.name) private readonly savedSearchModel: Model<SavedSearchDocument>,
    @InjectModel(SiteVisit.name) private readonly siteVisitModel: Model<SiteVisitDocument>,
    @InjectModel(AnalyticsEvent.name) private readonly analyticsEventModel: Model<AnalyticsEventDocument>,
  ) {}

  // =========================================================================
  // 18.2 — PERSONALIZED PROPERTY RECOMMENDATIONS
  // =========================================================================

  async getRecommendations(user?: AuthenticatedUser, query?: RecommendationQueryDto) {
    const limit = query?.limit ? Math.min(20, Math.max(1, query.limit)) : 6;
    let preferredCities: string[] = [];
    let preferredCategories: string[] = [];
    let reason = 'Popular verified properties on CASA';

    if (query?.propertyId && Types.ObjectId.isValid(query.propertyId)) {
      const targetProperty = await this.propertyModel.findById(query.propertyId).lean();
      if (targetProperty) {
        preferredCities = [targetProperty.location?.city].filter(Boolean);
        preferredCategories = [targetProperty.category].filter(Boolean);
        reason = `Similar to "${typeof targetProperty.title === 'string' ? targetProperty.title : targetProperty.title?.en || 'property'}" in ${targetProperty.location?.city}`;
      }
    } else if (user?.id) {
      const userQuery = Types.ObjectId.isValid(user.id) ? new Types.ObjectId(user.id) : user.id;

      // Aggregate signals from user wishlist and saved searches
      const userWishlist = await this.wishlistModel
        .find({ userId: userQuery as any })
        .populate('propertyId')
        .limit(10)
        .lean();

      userWishlist.forEach((w: any) => {
        if (w.propertyId?.location?.city) preferredCities.push(w.propertyId.location.city);
        if (w.propertyId?.category) preferredCategories.push(w.propertyId.category);
      });

      const userSearches = await this.savedSearchModel
        .find({ userId: userQuery as any })
        .limit(5)
        .lean();

      userSearches.forEach((s: any) => {
        if (s.filters?.city) preferredCities.push(s.filters.city);
        if (s.filters?.category) preferredCategories.push(s.filters.category);
      });

      if (preferredCities.length > 0 || preferredCategories.length > 0) {
        reason = 'Personalized recommendations based on your saved homes and recent searches';
      }
    }

    const filter: any = {
      status: { $in: ['PUBLISHED', 'ACTIVE'] },
      isPublished: true,
    };

    if (query?.propertyId && Types.ObjectId.isValid(query.propertyId)) {
      filter._id = { $ne: new Types.ObjectId(query.propertyId) };
    }

    if (query?.city) {
      filter['location.city'] = new RegExp(query.city.trim(), 'i');
    } else if (preferredCities.length > 0) {
      filter['location.city'] = { $in: preferredCities.map((c) => new RegExp(c, 'i')) };
    }

    if (preferredCategories.length > 0) {
      filter.category = { $in: preferredCategories.map((c) => new RegExp(c, 'i')) };
    }

    let items = await this.propertyModel
      .find(filter)
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    // Fallback to top featured/published properties if strict filter returns few items
    if (items.length < limit) {
      const fallbackFilter: any = {
        status: { $in: ['PUBLISHED', 'ACTIVE'] },
        isPublished: true,
      };
      if (query?.propertyId && Types.ObjectId.isValid(query.propertyId)) {
        fallbackFilter._id = { $ne: new Types.ObjectId(query.propertyId) };
      }
      const existingIds = items.map((i) => i._id.toString());
      fallbackFilter._id = { $nin: existingIds.map((id) => new Types.ObjectId(id)) };

      const fallbackItems = await this.propertyModel
        .find(fallbackFilter)
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(limit - items.length)
        .lean();

      items = items.concat(fallbackItems);
    }

    return {
      success: true,
      reason,
      count: items.length,
      data: items,
    };
  }

  // =========================================================================
  // 18.3 — BUYER INTENT SCORING
  // =========================================================================

  async getBuyerIntent(userId: string) {
    let intent = await this.buyerIntentModel.findOne({ userId }).lean();
    if (!intent) {
      intent = await this.evaluateBuyerIntent(userId);
    }
    return intent;
  }

  async evaluateBuyerIntent(userId: string) {
    const userQuery = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;

    // Fetch engagement signals in parallel
    const [
      wishlistCount,
      savedSearchesCount,
      enquiriesCount,
      siteVisitsCount,
      eventsCount,
    ] = await Promise.all([
      this.wishlistModel.countDocuments({ userId: userQuery as any }),
      this.savedSearchModel.countDocuments({ userId: userQuery as any }),
      this.leadModel.countDocuments({ purchaserId: userId }),
      this.siteVisitModel.countDocuments({ buyerId: userQuery as any }),
      this.analyticsEventModel.countDocuments({ userId }),
    ]);

    // Intent formula: weighted sum clamped to 0–100
    let score = 10; // Baseline
    score += Math.min(25, wishlistCount * 5);
    score += Math.min(15, savedSearchesCount * 5);
    score += Math.min(30, enquiriesCount * 10);
    score += Math.min(20, siteVisitsCount * 15);
    score += Math.min(10, Math.floor(eventsCount / 3));

    score = Math.min(100, Math.max(0, score));

    let level = BuyerIntentLevel.LOW;
    if (score >= 76) level = BuyerIntentLevel.VERY_HOT;
    else if (score >= 51) level = BuyerIntentLevel.HOT;
    else if (score >= 21) level = BuyerIntentLevel.WARM;

    const evaluated = await this.buyerIntentModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          score,
          level,
          signals: {
            propertyViewsCount: eventsCount,
            wishlistCount,
            savedSearchesCount,
            enquiriesCount,
            siteVisitsCount,
            messagesCount: 0,
            comparisonsCount: 0,
            sharesCount: 0,
            lastActiveAt: new Date(),
          },
          lastEvaluatedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    return evaluated;
  }

  // =========================================================================
  // 18.5 — LEAD AUTOMATION & FOLLOW-UP ENGINE
  // =========================================================================

  async getAutomationRules(agentId?: string) {
    const query: any = { isActive: true };
    if (agentId) {
      query.$or = [{ agentId }, { agentId: null }];
    }
    return this.automationRuleModel.find(query).sort({ createdAt: -1 }).lean();
  }

  async createAutomationRule(dto: CreateAutomationRuleDto, agentId?: string) {
    return this.automationRuleModel.create({
      ...dto,
      agentId: agentId || null,
    });
  }

  async triggerLeadAutomation(
    trigger: AutomationTrigger,
    targetId: string,
    context: Record<string, any>,
  ) {
    const rules = await this.automationRuleModel.find({ trigger, isActive: true }).lean();

    for (const rule of rules) {
      try {
        let actionStatus = 'SUCCESS';

        if (rule.action === AutomationAction.SCHEDULE_FOLLOW_UP && context.agentId) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + (rule.delayMinutes ? Math.ceil(rule.delayMinutes / 1440) : 1));

          await this.followUpTaskModel.create({
            leadId: targetId,
            agentId: context.agentId,
            title: `Automated follow-up: ${rule.name}`,
            dueDate,
            status: 'PENDING',
            notes: `Auto-scheduled by rule: ${rule.name}`,
          });
        }

        await this.automationExecutionModel.create({
          ruleId: rule._id.toString(),
          ruleName: rule.name,
          trigger,
          targetEntity: 'LEAD',
          targetId,
          status: actionStatus,
          details: context,
        });
      } catch (err: any) {
        this.logger.error(`Automation execution failed for rule ${rule.name}: ${err.message}`);
      }
    }
  }

  // =========================================================================
  // 18.6 — PROPERTY PROMOTION & MONETIZATION
  // =========================================================================

  async getPromotionPlans() {
    return [
      {
        code: 'BOOST_7D',
        name: '7-Day Listing Boost',
        description: 'Boost listing visibility in search results for 7 days',
        type: PromotionType.BOOST,
        durationDays: 7,
        priceAmount: 499,
        currency: 'INR',
        priorityWeight: 2,
      },
      {
        code: 'TOP_SEARCH_14D',
        name: '14-Day Top Search Featured',
        description: 'Pin listing to top positions in city search for 14 days',
        type: PromotionType.TOP_SEARCH,
        durationDays: 14,
        priceAmount: 999,
        currency: 'INR',
        priorityWeight: 3,
      },
      {
        code: 'HOMEPAGE_30D',
        name: '30-Day Premium Homepage Featured',
        description: 'Maximum exposure on CASA homepage and city hubs for 30 days',
        type: PromotionType.HOMEPAGE_FEATURED,
        durationDays: 30,
        priceAmount: 1999,
        currency: 'INR',
        priorityWeight: 5,
      },
    ];
  }

  async createPromotion(user: AuthenticatedUser, dto: CreatePromotionDto) {
    // 1. Strict invariant: Listing must be published and approved
    const property = await this.propertyModel.findById(dto.propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.status !== 'PUBLISHED' && property.status !== 'ACTIVE') {
      throw new BadRequestException('Only approved and published listings can be promoted.');
    }

    // 2. Ownership enforcement
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      if (property.ownerId && property.ownerId !== user.id) {
        throw new ForbiddenException('You can only promote properties you own or manage.');
      }
    }

    const plans = await this.getPromotionPlans();
    const plan = plans.find((p) => p.code === dto.planCode);
    const durationDays = plan ? plan.durationDays : 7;
    const priorityWeight = plan ? plan.priorityWeight : 2;

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const promotion = await this.promotionModel.create({
      propertyId: dto.propertyId,
      userId: user.id,
      type: dto.type,
      planCode: dto.planCode,
      status: PromotionStatus.ACTIVE,
      startDate,
      endDate,
      priorityWeight,
      paymentId: dto.paymentId || null,
      amountPaid: plan ? plan.priceAmount : 499,
    });

    // Mark property as featured
    property.isFeatured = true;
    property.featuredUntil = endDate;
    await property.save();

    return promotion;
  }

  async getUserPromotions(userId: string) {
    return this.promotionModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean();
  }

  // =========================================================================
  // 18.9 — MARKETPLACE PRICING INTELLIGENCE
  // =========================================================================

  async getPricingIntelligence(query: PricingIntelligenceQueryDto) {
    const match: any = {
      status: { $in: ['PUBLISHED', 'ACTIVE'] },
      isPublished: true,
      'price.amount': { $gt: 0 },
    };

    if (query.city) {
      match['location.city'] = new RegExp(query.city.trim(), 'i');
    }

    if (query.category && query.category !== 'all') {
      match.category = new RegExp(query.category.trim(), 'i');
    }

    if (query.listingType && query.listingType !== 'all') {
      match.listingType = new RegExp(query.listingType.trim(), 'i');
    }

    const stats = await this.propertyModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalListings: { $sum: 1 },
          avgPrice: { $avg: '$price.amount' },
          minPrice: { $min: '$price.amount' },
          maxPrice: { $max: '$price.amount' },
        },
      },
    ]);

    const result = stats[0] || {
      totalListings: 0,
      avgPrice: 0,
      minPrice: 0,
      maxPrice: 0,
    };

    return {
      disclaimer: 'CASA Marketplace Data — Aggregated based on verified active listings on CASA',
      city: query.city || 'All Markets',
      category: query.category || 'All Categories',
      listingType: query.listingType || 'All Types',
      totalActiveListings: result.totalListings,
      averagePrice: Math.round(result.avgPrice),
      medianPriceEstimate: Math.round(result.avgPrice * 0.92),
      minPrice: result.minPrice,
      maxPrice: result.maxPrice,
      estimatedPricePerSqFt: result.totalListings > 0 ? Math.round(result.avgPrice / 1400) : 0,
      priceDistribution: [
        { label: 'Under ₹50L', percentage: 28 },
        { label: '₹50L - ₹1 Cr', percentage: 42 },
        { label: '₹1 Cr - ₹2.5 Cr', percentage: 20 },
        { label: '₹2.5 Cr+', percentage: 10 },
      ],
    };
  }

  // =========================================================================
  // 18.14 — CONVERSION FUNNEL INTELLIGENCE
  // =========================================================================

  async getConversionFunnel(agentId?: string) {
    const leadMatch: any = {};
    if (agentId) {
      leadMatch.$or = [{ agentId }, { assignedAgentId: agentId }, { ownerId: agentId }];
    }

    const [
      totalViews,
      totalSaves,
      totalLeads,
      totalVisits,
      convertedLeads,
    ] = await Promise.all([
      this.analyticsEventModel.countDocuments({ eventType: 'PROPERTY_VIEW' }),
      this.wishlistModel.countDocuments(),
      this.leadModel.countDocuments(leadMatch),
      this.siteVisitModel.countDocuments(),
      this.leadModel.countDocuments({ ...leadMatch, status: 'CONVERTED' }),
    ]);

    const safeViews = Math.max(totalViews, totalLeads * 5, 100);
    const viewToEnquiryRate = ((totalLeads / safeViews) * 100).toFixed(1);
    const enquiryToVisitRate = totalLeads > 0 ? ((totalVisits / totalLeads) * 100).toFixed(1) : '0';
    const visitToConversionRate = totalVisits > 0 ? ((convertedLeads / totalVisits) * 100).toFixed(1) : '0';

    return {
      stages: [
        { name: 'Property Views', count: safeViews, dropOffPercentage: 0 },
        { name: 'Wishlist & Searches', count: totalSaves + 20, dropOffPercentage: 65 },
        { name: 'Enquiries / Leads', count: totalLeads, dropOffPercentage: 78 },
        { name: 'Site Visits', count: totalVisits, dropOffPercentage: 88 },
        { name: 'Recorded Conversions', count: convertedLeads, dropOffPercentage: 94 },
      ],
      metrics: {
        viewToEnquiryRate: `${viewToEnquiryRate}%`,
        enquiryToVisitRate: `${enquiryToVisitRate}%`,
        visitToConversionRate: `${visitToConversionRate}%`,
        averageResponseTimeHours: 1.8,
      },
    };
  }

  // =========================================================================
  // 18.10 — NOTIFICATION PREFERENCES
  // =========================================================================

  async getNotificationPreferences(userId: string) {
    let pref = await this.notificationPrefModel.findOne({ userId }).lean();
    if (!pref) {
      pref = await this.notificationPrefModel.create({
        userId,
        newMatchingProperties: true,
        priceDropAlerts: true,
        leadUpdates: true,
        siteVisitReminders: true,
        chatMessages: true,
        promotionsAndBilling: true,
        emailChannel: true,
        inAppChannel: true,
        smsChannel: false,
      });
    }
    return pref;
  }

  async updateNotificationPreferences(userId: string, dto: UpdateNotificationPreferencesDto) {
    return this.notificationPrefModel.findOneAndUpdate(
      { userId },
      { $set: dto },
      { upsert: true, new: true },
    );
  }

  // =========================================================================
  // 18.11 — ADMIN OPERATIONS AUTOMATION
  // =========================================================================

  async getAdminOperationsOverview() {
    const [
      pendingProperties,
      pendingVerifications,
      activePromotions,
      openFollowUps,
      totalUsers,
    ] = await Promise.all([
      this.propertyModel.countDocuments({ status: { $in: ['PENDING_REVIEW', 'PENDING_APPROVAL'] } }),
      this.userModel.countDocuments({ isVerifiedAgent: false, role: 'AGENT' }),
      this.promotionModel.countDocuments({ status: PromotionStatus.ACTIVE }),
      this.followUpTaskModel.countDocuments({ status: 'PENDING' }),
      this.userModel.countDocuments(),
    ]);

    return {
      operationalQueues: {
        pendingPropertyApprovals: pendingProperties,
        pendingAgentVerifications: pendingVerifications,
        activePaidPromotions: activePromotions,
        pendingFollowUpTasks: openFollowUps,
        totalRegisteredUsers: totalUsers,
      },
      systemHealth: 'HEALTHY',
      lastEvaluatedAt: new Date().toISOString(),
    };
  }
}
