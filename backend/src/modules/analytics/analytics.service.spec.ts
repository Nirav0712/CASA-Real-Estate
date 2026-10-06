import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEvent } from './schemas/analytics-event.schema';
import { RiskFlag } from './schemas/risk-flag.schema';
import { Property } from '../properties/schemas/property.schema';
import { User } from '../auth/schemas/user.schema';
import { Lead } from '../leads/schemas/lead.schema';
import { SiteVisit } from '../engagement/schemas/site-visit.schema';
import { Review } from '../engagement/schemas/review.schema';
import { PropertyReport } from '../engagement/schemas/property-report.schema';
import { Payment } from '../payments/schemas/payment.schema';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockAnalyticsEventModel = {
    create: jest.fn().mockImplementation((dto) => Promise.resolve({ _id: 'event-123', ...dto })),
    aggregate: jest.fn().mockResolvedValue([{ _id: 'PROPERTY_VIEW', count: 120 }]),
  };

  const mockRiskFlagModel = {
    create: jest.fn().mockImplementation((dto) => Promise.resolve({ _id: 'flag-123', ...dto })),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    }),
    findOne: jest.fn().mockResolvedValue(null),
    countDocuments: jest.fn().mockResolvedValue(2),
    findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: 'flag-123', status: 'RESOLVED' }),
  };

  const mockPropertyModel = {
    countDocuments: jest.fn().mockResolvedValue(45),
    find: jest.fn().mockResolvedValue([
      {
        _id: 'prop-1',
        title: { en: 'Luxury 3 BHK Flat' },
        status: 'PUBLISHED',
        price: { amount: 8500000 },
        location: { city: 'Ahmedabad', locality: 'Bodakdev' },
        specs: { bedrooms: 3 },
      },
    ]),
    aggregate: jest.fn().mockResolvedValue([{ _id: 'Ahmedabad', count: 30 }]),
  };

  const mockUserModel = {
    countDocuments: jest.fn().mockResolvedValue(120),
    findById: jest.fn().mockResolvedValue({
      _id: 'agent-1',
      name: 'Nirav Patel',
      isVerifiedAgent: true,
    }),
    aggregate: jest.fn().mockResolvedValue([{ _id: 'AGENT', count: 40 }]),
  };

  const mockLeadModel = {
    countDocuments: jest.fn().mockResolvedValue(25),
    find: jest.fn().mockResolvedValue([
      { _id: 'lead-1', status: 'CONVERTED' },
      { _id: 'lead-2', status: 'NEW' },
    ]),
  };

  const mockSiteVisitModel = {
    countDocuments: jest.fn().mockResolvedValue(10),
    find: jest.fn().mockResolvedValue([
      { _id: 'visit-1', status: 'COMPLETED' },
    ]),
  };

  const mockReviewModel = {
    find: jest.fn().mockResolvedValue([
      { _id: 'rev-1', rating: 5, status: 'APPROVED' },
      { _id: 'rev-2', rating: 4, status: 'APPROVED' },
    ]),
  };

  const mockReportModel = {
    countDocuments: jest.fn().mockResolvedValue(0),
  };

  const mockPaymentModel = {
    countDocuments: jest.fn().mockResolvedValue(15),
    aggregate: jest.fn().mockResolvedValue([{ _id: null, total: 45000 }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getModelToken(AnalyticsEvent.name), useValue: mockAnalyticsEventModel },
        { provide: getModelToken(RiskFlag.name), useValue: mockRiskFlagModel },
        { provide: getModelToken(Property.name), useValue: mockPropertyModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Lead.name), useValue: mockLeadModel },
        { provide: getModelToken(SiteVisit.name), useValue: mockSiteVisitModel },
        { provide: getModelToken(Review.name), useValue: mockReviewModel },
        { provide: getModelToken(PropertyReport.name), useValue: mockReportModel },
        { provide: getModelToken(Payment.name), useValue: mockPaymentModel },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should track marketplace events successfully', async () => {
    const result = await service.trackEvent(
      {
        eventType: 'PROPERTY_VIEW',
        propertyId: 'prop-123',
        device: 'desktop',
      },
      'user-1',
      '192.168.1.1',
    );

    expect(result.success).toBe(true);
    expect(mockAnalyticsEventModel.create).toHaveBeenCalled();
  });

  it('should generate admin marketplace BI metrics', async () => {
    const bi = await service.getAdminMarketplaceBI();
    expect(bi).toBeDefined();
    expect(bi.users.total).toBe(120);
    expect(bi.properties.total).toBe(45);
    expect(bi.revenue.totalAmount).toBe(45000);
    expect(bi.leads.total).toBe(25);
  });

  it('should compute transparent agent ranking, score and badges', async () => {
    const perf = await service.getAgentRankingAndPerformance('507f1f77bcf86cd799439011');
    expect(perf).toBeDefined();
    expect(perf?.isVerified).toBe(true);
    expect(perf?.badges).toContain('VERIFIED_AGENT');
    expect(perf?.overallScore).toBeGreaterThan(50);
  });
});
