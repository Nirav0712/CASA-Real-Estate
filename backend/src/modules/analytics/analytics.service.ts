import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { AnalyticsEvent, AnalyticsEventDocument } from './schemas/analytics-event.schema';
import { RiskFlag, RiskFlagDocument, RiskLevel, RiskStatus } from './schemas/risk-flag.schema';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Lead, LeadDocument } from '../leads/schemas/lead.schema';
import { SiteVisit, SiteVisitDocument } from '../engagement/schemas/site-visit.schema';
import { Review, ReviewDocument } from '../engagement/schemas/review.schema';
import { PropertyReport, PropertyReportDocument } from '../engagement/schemas/property-report.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';
import { TrackEventDto, AnalyticsQueryDto } from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(AnalyticsEvent.name)
    private readonly analyticsEventModel: Model<AnalyticsEventDocument>,
    @InjectModel(RiskFlag.name)
    private readonly riskFlagModel: Model<RiskFlagDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,
    @InjectModel(SiteVisit.name)
    private readonly siteVisitModel: Model<SiteVisitDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(PropertyReport.name)
    private readonly reportModel: Model<PropertyReportDocument>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  // 16.5 Event Tracking with Privacy Safeguards
  async trackEvent(dto: TrackEventDto, userId?: string, ip?: string): Promise<{ success: boolean }> {
    try {
      let ipHash: string | undefined;
      if (ip) {
        ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
      }

      await this.analyticsEventModel.create({
        eventType: dto.eventType,
        userId: userId || undefined,
        sessionId: dto.sessionId,
        propertyId: dto.propertyId || undefined,
        location: dto.location,
        metadata: dto.metadata || {},
        device: dto.device,
        referrer: dto.referrer,
        ipHash,
        createdAt: new Date(),
      });

      return { success: true };
    } catch (err: any) {
      this.logger.error(`Failed to record analytics event: ${err.message}`);
      return { success: false };
    }
  }

  // 16.6 Admin Business Intelligence Aggregation
  async getAdminMarketplaceBI(query?: AnalyticsQueryDto) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersMonth,
      usersByRole,
      totalProperties,
      publishedProperties,
      pendingProperties,
      rejectedProperties,
      featuredProperties,
      totalLeads,
      convertedLeads,
      siteVisitsCount,
      completedVisits,
      totalPayments,
      successfulRevenue,
      topViewedProperties,
      topLocations,
      openRiskFlags,
    ] = await Promise.all([
      this.userModel.countDocuments({ isDeleted: { $ne: true } } as any),
      this.userModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, isDeleted: { $ne: true } } as any),
      this.userModel.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      this.propertyModel.countDocuments({ isDeleted: { $ne: true } }),
      this.propertyModel.countDocuments({ status: 'PUBLISHED', isDeleted: { $ne: true } }),
      this.propertyModel.countDocuments({ status: { $in: ['PENDING_APPROVAL', 'PENDING_REVIEW'] }, isDeleted: { $ne: true } }),
      this.propertyModel.countDocuments({ status: 'REJECTED', isDeleted: { $ne: true } }),
      this.propertyModel.countDocuments({ isFeatured: true, status: 'PUBLISHED', isDeleted: { $ne: true } }),
      this.leadModel.countDocuments({}),
      this.leadModel.countDocuments({ status: 'CONVERTED' }),
      this.siteVisitModel.countDocuments({}),
      this.siteVisitModel.countDocuments({ status: 'COMPLETED' }),
      this.paymentModel.countDocuments({}),
      this.paymentModel.aggregate([
        { $match: { status: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.analyticsEventModel.aggregate([
        { $match: { eventType: 'PROPERTY_VIEW', propertyId: { $exists: true, $ne: null } } },
        { $group: { _id: '$propertyId', views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'properties',
            localField: '_id',
            foreignField: '_id',
            as: 'property',
          },
        },
        { $unwind: '$property' },
        {
          $project: {
            views: 1,
            title: '$property.title',
            price: '$property.price',
            slug: '$property.slug',
          },
        },
      ]),
      this.propertyModel.aggregate([
        { $match: { status: 'PUBLISHED', isDeleted: { $ne: true } } },
        { $group: { _id: '$location.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      this.riskFlagModel.countDocuments({ status: { $in: [RiskStatus.OPEN, RiskStatus.INVESTIGATING] } }),
    ]);

    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
    const totalRev = successfulRevenue[0]?.total || 0;

    // Events summary (Views, searches, saves, shares)
    const engagementSummary = await this.analyticsEventModel.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
    ]);

    return {
      users: {
        total: totalUsers,
        newThisMonth: newUsersMonth,
        byRole: usersByRole,
      },
      properties: {
        total: totalProperties,
        published: publishedProperties,
        pending: pendingProperties,
        rejected: rejectedProperties,
        featured: featuredProperties,
        topViewed: topViewedProperties,
      },
      leads: {
        total: totalLeads,
        converted: convertedLeads,
        conversionRate,
        siteVisits: siteVisitsCount,
        completedVisits,
      },
      revenue: {
        totalOrders: totalPayments,
        totalAmount: totalRev,
      },
      locations: {
        topCities: topLocations,
      },
      engagement: engagementSummary,
      risk: {
        openFlags: openRiskFlags,
      },
    };
  }

  // 16.7 Agent Performance & Transparent Ranking System
  async getAgentRankingAndPerformance(agentId: string) {
    const objectId = new Types.ObjectId(agentId);

    const [user, properties, leads, visits, reviews] = await Promise.all([
      this.userModel.findById(objectId),
      this.propertyModel.find({ advertiserId: objectId, isDeleted: { $ne: true } }),
      this.leadModel.find({ agentId: objectId }),
      this.siteVisitModel.find({ agentId: objectId }),
      this.reviewModel.find({ agentId: objectId, status: 'APPROVED' }),
    ]);

    if (!user) {
      return null;
    }

    const isAgentVerified = !!user.isVerifiedAgent || (user as any).isVerified === true;
    const activePropertiesCount = properties.filter((p) => p.status === 'PUBLISHED').length;
    const totalLeads = leads.length;
    const convertedLeads = leads.filter((l) => l.status === 'CONVERTED').length;
    const leadConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const completedVisits = visits.filter((v) => v.status === 'COMPLETED').length;

    const avgRating =
      reviews.length > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
        : 5.0;

    // Transparent weighted scoring calculation (0 to 100)
    let score = 30; // base score for registered agent
    if (isAgentVerified) score += 20;
    if (activePropertiesCount >= 3) score += 15;
    if (leadConversionRate >= 15) score += 15;
    if (avgRating >= 4.5) score += 10;
    if (completedVisits >= 2) score += 10;
    score = Math.min(100, Math.max(0, score));

    // Transparent badges
    const badges: string[] = [];
    if (isAgentVerified) badges.push('VERIFIED_AGENT');
    if (score >= 80) badges.push('TOP_AGENT');
    if (leadConversionRate >= 20) badges.push('HIGH_CONVERSION');
    if (avgRating >= 4.6 && reviews.length >= 1) badges.push('TOP_RATED');
    if (totalLeads >= 3) badges.push('FAST_RESPONDER');

    return {
      agentId,
      name: user.name,
      isVerified: isAgentVerified,
      overallScore: score,
      tier: score >= 85 ? 'PLATINUM' : score >= 70 ? 'GOLD' : score >= 50 ? 'SILVER' : 'STANDARD',
      badges,
      metrics: {
        activeListings: activePropertiesCount,
        totalLeads,
        convertedLeads,
        conversionRate: Math.round(leadConversionRate),
        siteVisitsCompleted: completedVisits,
        averageRating: avgRating,
        reviewsCount: reviews.length,
      },
    };
  }

  // 16.9 Fraud / Abuse Detection Rule Engine
  async runFraudAndAbuseScan(propertyId?: string): Promise<{ flagsCreated: number; details: any[] }> {
    const flagsCreated: any[] = [];

    const query = propertyId ? { _id: new Types.ObjectId(propertyId), isDeleted: { $ne: true } } : { status: 'PUBLISHED', isDeleted: { $ne: true } };
    const properties = await this.propertyModel.find(query).limit(100);

    for (const prop of properties) {
      const pId = (prop as any)._id;

      // Rule 1: Check for duplicate listings by same advertiser or identical title & location
      const duplicates = await this.propertyModel.find({
        _id: { $ne: pId },
        'location.city': prop.location.city,
        'location.locality': prop.location.locality,
        'price.amount': prop.price.amount,
        'specs.bedrooms': prop.specs?.bedrooms,
        isDeleted: { $ne: true },
      });

      if (duplicates.length > 0) {
        const existingFlag = await this.riskFlagModel.findOne({
          targetId: pId,
          flagReason: 'DUPLICATE_LISTING',
          status: { $in: [RiskStatus.OPEN, RiskStatus.INVESTIGATING] },
        });

        if (!existingFlag) {
          const flag = await this.riskFlagModel.create({
            targetType: 'PROPERTY',
            targetId: pId,
            riskLevel: RiskLevel.MEDIUM,
            flagReason: 'DUPLICATE_LISTING',
            details: {
              matchedDuplicates: duplicates.map((d: any) => d._id),
              locality: prop.location.locality,
              price: prop.price.amount,
            },
            status: RiskStatus.OPEN,
          });
          flagsCreated.push(flag);
        }
      }

      // Rule 2: Check for repeated property reports
      const reportsCount = await this.reportModel.countDocuments({
        propertyId: pId,
        status: { $in: ['PENDING', 'UNDER_REVIEW'] },
      });

      if (reportsCount >= 2) {
        const existingFlag = await this.riskFlagModel.findOne({
          targetId: pId,
          flagReason: 'REPEATED_REPORTS',
          status: { $in: [RiskStatus.OPEN, RiskStatus.INVESTIGATING] },
        });

        if (!existingFlag) {
          const flag = await this.riskFlagModel.create({
            targetType: 'PROPERTY',
            targetId: pId,
            riskLevel: reportsCount >= 4 ? RiskLevel.HIGH : RiskLevel.MEDIUM,
            flagReason: 'REPEATED_REPORTS',
            details: { reportsCount },
            status: RiskStatus.OPEN,
          });
          flagsCreated.push(flag);
        }
      }

      // Rule 3: Suspicious Pricing (< ₹10,000 for Sale or > ₹100 Cr)
      if (prop.listingType === 'SALE' && (prop.price.amount < 10000 || prop.price.amount > 1000000000)) {
        const existingFlag = await this.riskFlagModel.findOne({
          targetId: pId,
          flagReason: 'SUSPICIOUS_PRICE',
          status: { $in: [RiskStatus.OPEN, RiskStatus.INVESTIGATING] },
        });

        if (!existingFlag) {
          const flag = await this.riskFlagModel.create({
            targetType: 'PROPERTY',
            targetId: pId,
            riskLevel: RiskLevel.HIGH,
            flagReason: 'SUSPICIOUS_PRICE',
            details: { price: prop.price.amount, listingType: prop.listingType },
            status: RiskStatus.OPEN,
          });
          flagsCreated.push(flag);
        }
      }
    }

    return { flagsCreated: flagsCreated.length, details: flagsCreated };
  }

  // Risk Flags Management
  async getRiskFlags(status?: string, level?: string, page = 1, limit = 50) {
    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;
    if (level && level !== 'ALL') filter.riskLevel = level;

    const [items, total] = await Promise.all([
      this.riskFlagModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.riskFlagModel.countDocuments(filter),
    ]);

    return { items, total, page, limit };
  }

  async resolveRiskFlag(flagId: string, status: string, actionTaken?: string, adminId?: string) {
    const updated = await this.riskFlagModel.findByIdAndUpdate(
      flagId,
      {
        status,
        actionTaken: actionTaken || `Updated to ${status}`,
        reviewedBy: adminId || undefined,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      },
      { new: true },
    );
    return updated;
  }
}
