import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PurchaserService } from './purchaser.service';
import { SavedProperty } from './schemas/saved-property.schema';
import { RecentlyViewed } from './schemas/recently-viewed.schema';
import { User } from '../auth/schemas/user.schema';
import { Property } from '../properties/schemas/property.schema';
import { Lead } from '../leads/schemas/lead.schema';
import { AuditLog } from '../admin/schemas/audit-log.schema';
import { UserRole, AccountStatus, PlatformRole, AccountType } from '../auth/enums/auth.enums';

describe('PurchaserService', () => {
  let service: PurchaserService;

  const mockSavedPropertyModel = {
    countDocuments: jest.fn().mockResolvedValue(2),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { _id: 'saved-1', purchaserId: 'user-purchaser-1', propertyId: 'prop-1', createdAt: new Date() },
          ]),
        }),
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              { _id: 'saved-1', purchaserId: 'user-purchaser-1', propertyId: 'prop-1', createdAt: new Date() },
            ]),
          }),
        }),
      }),
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ propertyId: 'prop-1' }]),
      }),
    }),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn().mockResolvedValue({ _id: 'saved-1' }),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  };

  const mockRecentlyViewedModel = {
    countDocuments: jest.fn().mockResolvedValue(4),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { _id: 'view-1', purchaserId: 'user-purchaser-1', propertyId: 'prop-1', viewedAt: new Date() },
          ]),
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([{ propertyId: 'prop-1' }]),
          }),
        }),
        skip: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
    findOneAndUpdate: jest.fn().mockResolvedValue({ _id: 'view-1' }),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  };

  const mockUserDoc = {
    _id: 'user-purchaser-1',
    id: 'user-purchaser-1',
    name: 'Arun Buyer',
    mobile: '+919876543210',
    normalizedMobile: '+919876543210',
    email: 'arun.buyer@example.com',
    role: UserRole.PURCHASER,
    status: AccountStatus.ACTIVE,
    avatar: 'https://example.com/avatar.jpg',
    metadata: {
      preferredLanguage: 'en',
      preferredCity: 'Lucknow',
      preferredCategory: 'APARTMENT',
    },
    markModified: jest.fn(),
    save: jest.fn().mockResolvedValue(true),
  };

  const mockUserModel = {
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockUserDoc),
    }),
  };

  const mockPropertyDoc = {
    _id: 'prop-1',
    id: 'prop-1',
    slug: 'luxury-3bhk-gomti-nagar',
    title: { en: 'Luxury 3BHK in Gomti Nagar' },
    description: { en: 'Spacious apartment' },
    price: { amount: 8500000, currency: 'INR' },
    location: { city: 'Lucknow', locality: 'Gomti Nagar' },
    category: 'APARTMENT',
    listingType: 'SALE',
    isPublished: true,
    status: 'PUBLISHED',
    media: { thumbnailUrl: 'https://images.unsplash.com/photo-1' },
    advertiser: { name: 'Rajesh Verma', phone: '+919925843599', role: 'AGENT' },
  };

  const mockPropertyModel = {
    findOne: jest.fn().mockResolvedValue(mockPropertyDoc),
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([mockPropertyDoc]),
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockPropertyDoc]),
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([mockPropertyDoc]),
        }),
      }),
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([mockPropertyDoc]),
        }),
      }),
    }),
  };

  const mockLeadDoc = {
    _id: 'lead-1',
    propertyId: 'prop-1',
    purchaserId: 'user-purchaser-1',
    name: 'Arun Buyer',
    mobile: '+919876543210',
    email: 'arun.buyer@example.com',
    message: 'Interested in this property',
    status: 'NEW',
    priority: 'MEDIUM',
    notes: [{ text: 'Inquiry received', createdAt: new Date() }],
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(true),
  };

  const mockLeadModel = {
    countDocuments: jest.fn().mockResolvedValue(1),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([mockLeadDoc]),
        }),
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([mockLeadDoc]),
          }),
        }),
      }),
    }),
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockLeadDoc),
    }),
  };

  const mockAuditLogModel = {
    create: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaserService,
        { provide: getModelToken(SavedProperty.name), useValue: mockSavedPropertyModel },
        { provide: getModelToken(RecentlyViewed.name), useValue: mockRecentlyViewedModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Property.name), useValue: mockPropertyModel },
        { provide: getModelToken(Lead.name), useValue: mockLeadModel },
        { provide: getModelToken(AuditLog.name), useValue: mockAuditLogModel },
      ],
    }).compile();

    service = module.get<PurchaserService>(PurchaserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should aggregate purchaser dashboard metrics', async () => {
    const authUser = {
      id: 'user-purchaser-1',
      mobile: '+919876543210',
      normalizedMobile: '+919876543210',
      name: 'Arun Buyer',
      role: UserRole.PURCHASER,
      platformRole: PlatformRole.USER,
      accountType: AccountType.BUYER,
      status: AccountStatus.ACTIVE,
      isVerifiedAgent: false,
    };

    const dashboard = await service.getDashboard(authUser);
    expect(dashboard).toBeDefined();
    expect(dashboard.stats.savedCount).toBe(2);
    expect(dashboard.stats.enquiriesCount).toBe(1);
    expect(dashboard.stats.recentlyViewedCount).toBe(4);
    expect(dashboard.user.name).toBe('Arun Buyer');
  });

  it('should save a published property and write audit log', async () => {
    const authUser = {
      id: 'user-purchaser-1',
      mobile: '+919876543210',
      normalizedMobile: '+919876543210',
      name: 'Arun Buyer',
      role: UserRole.PURCHASER,
      platformRole: PlatformRole.USER,
      accountType: AccountType.BUYER,
      status: AccountStatus.ACTIVE,
      isVerifiedAgent: false,
    };

    const res = await service.saveProperty(authUser, 'prop-1');
    expect(res.success).toBe(true);
    expect(res.propertyId).toBe('prop-1');
    expect(mockAuditLogModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROPERTY_SAVED' }),
    );
  });

  it('should unsave a property and write audit log', async () => {
    const authUser = {
      id: 'user-purchaser-1',
      mobile: '+919876543210',
      normalizedMobile: '+919876543210',
      name: 'Arun Buyer',
      role: UserRole.PURCHASER,
      platformRole: PlatformRole.USER,
      accountType: AccountType.BUYER,
      status: AccountStatus.ACTIVE,
      isVerifiedAgent: false,
    };

    const res = await service.unsaveProperty(authUser, 'prop-1');
    expect(res.success).toBe(true);
    expect(mockAuditLogModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROPERTY_UNSAVED' }),
    );
  });

  it('should get paginated purchaser enquiries', async () => {
    const authUser = {
      id: 'user-purchaser-1',
      mobile: '+919876543210',
      normalizedMobile: '+919876543210',
      name: 'Arun Buyer',
      role: UserRole.PURCHASER,
      platformRole: PlatformRole.USER,
      accountType: AccountType.BUYER,
      status: AccountStatus.ACTIVE,
      isVerifiedAgent: false,
    };

    const res = await service.getEnquiries(authUser, { page: 1, limit: 20 });
    expect(res.data).toBeDefined();
    expect(res.pagination.total).toBe(1);
    expect(res.data[0].name).toBe('Arun Buyer');
  });
});
