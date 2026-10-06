import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { IntelligenceService } from './intelligence.service';
import { BuyerIntent, BuyerIntentLevel } from './schemas/buyer-intent.schema';
import { AutomationRule, AutomationTrigger, AutomationAction } from './schemas/automation-rule.schema';
import { AutomationExecution } from './schemas/automation-rule.schema';
import { FollowUpTask } from './schemas/automation-rule.schema';
import { PropertyPromotion, PromotionType, PromotionStatus } from './schemas/promotion.schema';
import { PromotionPlan } from './schemas/promotion.schema';
import { SubscriptionPlan } from './schemas/subscription-entitlement.schema';
import { UsageCounter } from './schemas/subscription-entitlement.schema';
import { NotificationPreference } from './schemas/notification-preference.schema';
import { Property } from '../properties/schemas/property.schema';
import { User } from '../auth/schemas/user.schema';
import { Lead } from '../leads/schemas/lead.schema';
import { Wishlist } from '../engagement/schemas/wishlist.schema';
import { SavedSearch } from '../engagement/schemas/saved-search.schema';
import { SiteVisit } from '../engagement/schemas/site-visit.schema';
import { AnalyticsEvent } from '../analytics/schemas/analytics-event.schema';

describe('IntelligenceService', () => {
  let service: IntelligenceService;

  const mockProperty = {
    _id: '67c123456789abcdef123456',
    title: { en: 'Luxury 3 BHK Villa in Lucknow' },
    category: 'House / Home',
    status: 'PUBLISHED',
    isPublished: true,
    price: { amount: 8500000 },
    location: { city: 'Lucknow', locality: 'Gomti Nagar' },
    save: jest.fn().mockResolvedValue(true),
  };

  const createMockModel = (data: any = []) => ({
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(Array.isArray(data) ? data : [data]),
        }),
        lean: jest.fn().mockResolvedValue(Array.isArray(data) ? data : [data]),
      }),
      populate: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      }),
      limit: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
      lean: jest.fn().mockResolvedValue(Array.isArray(data) ? data : [data]),
    }),
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    }),
    findById: jest.fn().mockImplementation((id: string) => {
      if (id === mockProperty._id) {
        return Promise.resolve({
          ...mockProperty,
          lean: () => Promise.resolve(mockProperty),
        });
      }
      return Promise.resolve(null);
    }),
    findOneAndUpdate: jest.fn().mockResolvedValue({
      userId: 'usr-123',
      score: 65,
      level: BuyerIntentLevel.HOT,
    }),
    countDocuments: jest.fn().mockResolvedValue(5),
    create: jest.fn().mockImplementation((dto) => Promise.resolve({ _id: 'new-id', ...dto })),
    aggregate: jest.fn().mockResolvedValue([
      { totalListings: 12, avgPrice: 7500000, minPrice: 2500000, maxPrice: 18500000 },
    ]),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntelligenceService,
        { provide: getModelToken(BuyerIntent.name), useValue: createMockModel() },
        { provide: getModelToken(AutomationRule.name), useValue: createMockModel() },
        { provide: getModelToken(AutomationExecution.name), useValue: createMockModel() },
        { provide: getModelToken(FollowUpTask.name), useValue: createMockModel() },
        { provide: getModelToken(PropertyPromotion.name), useValue: createMockModel() },
        { provide: getModelToken(PromotionPlan.name), useValue: createMockModel() },
        { provide: getModelToken(SubscriptionPlan.name), useValue: createMockModel() },
        { provide: getModelToken(UsageCounter.name), useValue: createMockModel() },
        { provide: getModelToken(NotificationPreference.name), useValue: createMockModel() },
        { provide: getModelToken(Property.name), useValue: createMockModel([mockProperty]) },
        { provide: getModelToken(User.name), useValue: createMockModel() },
        { provide: getModelToken(Lead.name), useValue: createMockModel() },
        { provide: getModelToken(Wishlist.name), useValue: createMockModel() },
        { provide: getModelToken(SavedSearch.name), useValue: createMockModel() },
        { provide: getModelToken(SiteVisit.name), useValue: createMockModel() },
        { provide: getModelToken(AnalyticsEvent.name), useValue: createMockModel() },
      ],
    }).compile();

    service = module.get<IntelligenceService>(IntelligenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate property recommendations with explainable reasons', async () => {
    const res = await service.getRecommendations();
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.reason).toBeDefined();
  });

  it('should evaluate buyer intent score and classify into HOT/WARM levels', async () => {
    const intent = await service.evaluateBuyerIntent('usr-123');
    expect(intent).toBeDefined();
    expect(intent.score).toBeGreaterThanOrEqual(0);
    expect(intent.level).toBeDefined();
  });

  it('should retrieve aggregated marketplace pricing intelligence without investment guarantees', async () => {
    const pricing = await service.getPricingIntelligence({ city: 'Lucknow' });
    expect(pricing.disclaimer).toContain('CASA Marketplace Data');
    expect(pricing.city).toBe('Lucknow');
    expect(pricing.averagePrice).toBeGreaterThan(0);
    expect(pricing.priceDistribution).toBeInstanceOf(Array);
  });

  it('should return conversion funnel metrics across key engagement stages', async () => {
    const funnel = await service.getConversionFunnel();
    expect(funnel.stages).toHaveLength(5);
    expect(funnel.metrics.viewToEnquiryRate).toBeDefined();
  });

  it('should retrieve admin operations overview queues', async () => {
    const overview = await service.getAdminOperationsOverview();
    expect(overview.operationalQueues).toBeDefined();
    expect(overview.systemHealth).toBe('HEALTHY');
  });
});
