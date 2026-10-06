import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { EngagementService } from './engagement.service';
import { Wishlist } from './schemas/wishlist.schema';
import { SavedSearch } from './schemas/saved-search.schema';
import { Notification, NotificationType } from './schemas/notification.schema';
import { SiteVisit, SiteVisitStatus } from './schemas/site-visit.schema';
import { Conversation } from './schemas/conversation.schema';
import { Message } from './schemas/message.schema';
import { Review, ReviewTargetType, ReviewStatus } from './schemas/review.schema';
import { PropertyReport, ReportReason, ReportStatus } from './schemas/property-report.schema';
import { Property } from '../properties/schemas/property.schema';
import { User } from '../auth/schemas/user.schema';
import { Lead } from '../leads/schemas/lead.schema';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole, AccountStatus } from '../auth/enums/auth.enums';

describe('EngagementService', () => {
  let service: EngagementService;

  const mockUser: AuthenticatedUser = {
    id: new Types.ObjectId().toString(),
    name: 'Test Buyer',
    mobile: '+919876543210',
    normalizedMobile: '+919876543210',
    role: UserRole.PURCHASER,
    status: AccountStatus.ACTIVE,
    isVerifiedAgent: false,
  };

  const mockAgent: AuthenticatedUser = {
    id: new Types.ObjectId().toString(),
    name: 'Test Agent',
    mobile: '+919876543211',
    normalizedMobile: '+919876543211',
    role: UserRole.AGENT,
    status: AccountStatus.ACTIVE,
    isVerifiedAgent: true,
  };

  const mockAdmin: AuthenticatedUser = {
    id: new Types.ObjectId().toString(),
    name: 'Admin User',
    mobile: '+919876543212',
    normalizedMobile: '+919876543212',
    role: UserRole.ADMIN,
    status: AccountStatus.ACTIVE,
    isVerifiedAgent: false,
  };

  const samplePropertyId = new Types.ObjectId();
  const mockPropertyDoc = {
    _id: samplePropertyId,
    title: { en: 'Luxury 3BHK Apartment in Gomti Nagar' },
    slug: 'luxury-3bhk-apartment-gomti-nagar',
    category: 'residential',
    listingType: 'SALE',
    price: { amount: 7500000, currency: 'INR' },
    specs: { bedrooms: 3, bathrooms: 2, area: 1650 },
    location: { city: 'Lucknow', locality: 'Gomti Nagar' },
    ownerId: mockAgent.id,
    status: 'PUBLISHED',
    moderationStatus: 'APPROVED',
  };

  // Mock Mongoose Models
  const mockWishlistModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    }),
    countDocuments: jest.fn().mockResolvedValue(0),
    exists: jest.fn(),
  };

  const mockSavedSearchModel = {
    countDocuments: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    }),
    findById: jest.fn(),
    updateOne: jest.fn(),
  };

  const mockNotificationModel = {
    create: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), isRead: false }),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    }),
    countDocuments: jest.fn().mockResolvedValue(0),
    findOneAndUpdate: jest.fn(),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  };

  const mockSiteVisitModel = {
    create: jest.fn(),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    }),
    findById: jest.fn(),
    countDocuments: jest.fn().mockResolvedValue(0),
  };

  const mockConversationModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    }),
    findById: jest.fn(),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  };

  const mockMessageModel = {
    create: jest.fn(),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    }),
    countDocuments: jest.fn().mockResolvedValue(0),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  };

  const mockReviewModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    }),
    findById: jest.fn(),
    countDocuments: jest.fn().mockResolvedValue(0),
  };

  const mockReportModel = {
    create: jest.fn(),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    }),
    findById: jest.fn(),
    countDocuments: jest.fn().mockResolvedValue(0),
  };

  const mockPropertyModel = {
    findById: jest.fn().mockResolvedValue(mockPropertyDoc),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([mockPropertyDoc]),
    }),
    countDocuments: jest.fn().mockResolvedValue(1),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  };

  const mockUserModel = {
    findById: jest.fn().mockResolvedValue(mockUser),
    countDocuments: jest.fn().mockResolvedValue(10),
  };

  const mockLeadModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EngagementService,
        { provide: getModelToken(Wishlist.name), useValue: mockWishlistModel },
        { provide: getModelToken(SavedSearch.name), useValue: mockSavedSearchModel },
        { provide: getModelToken(Notification.name), useValue: mockNotificationModel },
        { provide: getModelToken(SiteVisit.name), useValue: mockSiteVisitModel },
        { provide: getModelToken(Conversation.name), useValue: mockConversationModel },
        { provide: getModelToken(Message.name), useValue: mockMessageModel },
        { provide: getModelToken(Review.name), useValue: mockReviewModel },
        { provide: getModelToken(PropertyReport.name), useValue: mockReportModel },
        { provide: getModelToken(Property.name), useValue: mockPropertyModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Lead.name), useValue: mockLeadModel },
      ],
    }).compile();

    service = module.get<EngagementService>(EngagementService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // 15.1 Wishlist
  describe('Wishlist', () => {
    it('should add property to wishlist', async () => {
      mockPropertyModel.findById.mockResolvedValueOnce(mockPropertyDoc);
      mockWishlistModel.findOne.mockResolvedValueOnce(null);
      mockWishlistModel.create.mockResolvedValueOnce({
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(mockUser.id),
        propertyId: samplePropertyId,
      });

      const res = await service.addToWishlist(mockUser, { propertyId: samplePropertyId.toString() });
      expect(res.success).toBe(true);
      expect(mockWishlistModel.create).toHaveBeenCalled();
    });

    it('should remove property from wishlist', async () => {
      mockWishlistModel.deleteOne.mockResolvedValueOnce({ deletedCount: 1 });
      const res = await service.removeFromWishlist(mockUser, samplePropertyId.toString());
      expect(res.success).toBe(true);
      expect(mockWishlistModel.deleteOne).toHaveBeenCalled();
    });
  });

  // 15.2 Saved Searches
  describe('Saved Searches', () => {
    it('should create saved search criteria', async () => {
      mockSavedSearchModel.countDocuments.mockResolvedValueOnce(2);
      mockSavedSearchModel.create.mockResolvedValueOnce({
        _id: new Types.ObjectId(),
        name: 'My 3BHK Lucknow Search',
        criteria: { category: 'residential', bedrooms: 3 },
      });

      const res = await service.createSavedSearch(mockUser, {
        name: 'My 3BHK Lucknow Search',
        criteria: { category: 'residential', bedrooms: 3 },
      });

      expect(res.success).toBe(true);
      expect(mockSavedSearchModel.create).toHaveBeenCalled();
    });
  });

  // 15.4 Notification Center
  describe('Notification Center', () => {
    it('should create and retrieve notifications', async () => {
      mockNotificationModel.create.mockResolvedValueOnce({
        _id: new Types.ObjectId(),
        recipientId: new Types.ObjectId(mockUser.id),
        type: NotificationType.NEW_LEAD,
      });

      const created = await service.createNotification({
        recipientId: mockUser.id,
        type: NotificationType.NEW_LEAD,
        title: 'New Lead Generated',
        message: 'A client expressed interest',
      });

      expect(created).toBeDefined();
    });

    it('should return unread count badge metric', async () => {
      mockNotificationModel.countDocuments.mockResolvedValueOnce(5);
      const res = await service.getUnreadNotificationCount(mockUser);
      expect(res.success).toBe(true);
      expect(res.data.unreadCount).toBe(5);
    });
  });

  // 15.6 Site Visits
  describe('Site Visits', () => {
    it('should create a site visit request with future date', async () => {
      mockPropertyModel.findById.mockResolvedValueOnce(mockPropertyDoc);
      const futureDate = new Date(Date.now() + 86400000 * 3).toISOString();

      mockSiteVisitModel.create.mockResolvedValueOnce({
        _id: new Types.ObjectId(),
        buyerId: new Types.ObjectId(mockUser.id),
        propertyId: samplePropertyId,
        status: SiteVisitStatus.REQUESTED,
      });

      const res = await service.requestSiteVisit(mockUser, {
        propertyId: samplePropertyId.toString(),
        preferredDate: futureDate,
        preferredTimeSlot: '10:00 AM - 12:00 PM',
        buyerName: 'Test Buyer',
        buyerMobile: '+919876543210',
      });

      expect(res.success).toBe(true);
      expect(mockSiteVisitModel.create).toHaveBeenCalled();
    });
  });

  // 15.7 Messaging / Conversations
  describe('Messaging', () => {
    it('should start or find conversation between buyer and agent', async () => {
      const recipientId = mockAgent.id;
      mockUserModel.findById.mockResolvedValueOnce(mockAgent);
      mockConversationModel.findOne.mockResolvedValueOnce(null);
      mockConversationModel.create.mockResolvedValueOnce({
        _id: new Types.ObjectId(),
        participants: [new Types.ObjectId(mockUser.id), new Types.ObjectId(recipientId)],
      });

      const res = await service.startConversation(mockUser, {
        recipientId,
        propertyId: samplePropertyId.toString(),
        initialMessage: 'Hello, is this property available for viewing?',
      });

      expect(res.success).toBe(true);
      expect(mockConversationModel.create).toHaveBeenCalled();
    });
  });

  // 15.8 Agent Analytics
  describe('Agent Conversion Analytics', () => {
    it('should compute lead conversion metrics and funnel stages', async () => {
      mockLeadModel.find.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue([
          { status: 'NEW', source: 'WEBSITE', createdAt: new Date() },
          { status: 'CONVERTED', source: 'WEBSITE', createdAt: new Date() },
        ]),
      });
      mockSiteVisitModel.find.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue([
          { status: SiteVisitStatus.COMPLETED },
        ]),
      });

      const res = await service.getAgentConversionAnalytics(mockAgent);
      expect(res.success).toBe(true);
      expect(res.data.summary.totalLeads).toBe(2);
      expect(res.data.summary.converted).toBe(1);
      expect(res.data.summary.conversionRate).toBe(50);
    });
  });

  // 15.9 Reviews & Ratings
  describe('Reviews & Ratings', () => {
    it('should create review for agent with rating 5', async () => {
      mockReviewModel.findOne.mockResolvedValueOnce(null);
      mockReviewModel.create.mockResolvedValueOnce({
        _id: new Types.ObjectId(),
        authorId: new Types.ObjectId(mockUser.id),
        targetType: ReviewTargetType.AGENT,
        targetId: new Types.ObjectId(mockAgent.id),
        rating: 5,
        status: ReviewStatus.APPROVED,
      });

      const res = await service.createReview(mockUser, {
        targetType: ReviewTargetType.AGENT,
        targetId: mockAgent.id,
        rating: 5,
        title: 'Outstanding Agent',
        comment: 'Very professional and responsive throughout the deal.',
      });

      expect(res.success).toBe(true);
      expect(mockReviewModel.create).toHaveBeenCalled();
    });

    it('should prevent self-review for agent', async () => {
      await expect(
        service.createReview(mockAgent, {
          targetType: ReviewTargetType.AGENT,
          targetId: mockAgent.id,
          rating: 5,
          title: 'Self',
          comment: 'Self review attempt',
        }),
      ).rejects.toThrow('You cannot review your own profile');
    });
  });

  // 15.10 Reports & Comparison
  describe('Reports & Comparison', () => {
    it('should submit property report for moderation', async () => {
      mockPropertyModel.findById.mockResolvedValueOnce(mockPropertyDoc);
      mockReportModel.create.mockResolvedValueOnce({
        _id: new Types.ObjectId(),
        propertyId: samplePropertyId,
        reason: ReportReason.FAKE_PROPERTY,
        status: ReportStatus.PENDING,
      });

      const res = await service.reportProperty(mockUser, {
        propertyId: samplePropertyId.toString(),
        reason: ReportReason.FAKE_PROPERTY,
        description: 'Listing photos do not match physical location',
      });

      expect(res.success).toBe(true);
      expect(mockReportModel.create).toHaveBeenCalled();
    });

    it('should generate side-by-side property comparison matrix', async () => {
      const propId2 = new Types.ObjectId();
      const mockProp2 = {
        ...mockPropertyDoc,
        _id: propId2,
        title: { en: 'Spacious 4BHK Villa' },
        slug: 'spacious-4bhk-villa',
        price: { amount: 15000000, currency: 'INR' },
        specs: { bedrooms: 4, bathrooms: 4, area: 3200 },
      };

      mockPropertyModel.find.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue([mockPropertyDoc, mockProp2]),
      });

      const res = await service.compareProperties({
        propertyIds: [samplePropertyId.toString(), propId2.toString()],
      });

      expect(res.success).toBe(true);
      expect(res.data.properties.length).toBe(2);
      expect(res.data.attributeMatrix).toBeDefined();
    });
  });
});
