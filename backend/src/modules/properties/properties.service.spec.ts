import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { Property } from './schemas/property.schema';
import { Category } from './schemas/category.schema';
import { UserRole, AccountStatus, PlatformRole, AccountType } from '../auth/enums/auth.enums';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

describe('PropertiesService (Phase 06 Lifecycle & Security)', () => {
  let service: PropertiesService;
  let mockPropertyModel: any;
  let mockCategoryModel: any;

  const mockAgentUser: AuthenticatedUser = {
    id: 'user-agent-123',
    name: 'Vikram Singh',
    mobile: '9876543210',
    normalizedMobile: '+919876543210',
    role: UserRole.AGENT,
    platformRole: PlatformRole.USER,
    accountType: AccountType.AGENT,
    status: AccountStatus.ACTIVE,
    isVerifiedAgent: true,
  };

  const mockOtherUser: AuthenticatedUser = {
    id: 'user-other-999',
    name: 'Anjali Sharma',
    mobile: '9988776655',
    normalizedMobile: '+919988776655',
    role: UserRole.PROPERTY_OWNER,
    platformRole: PlatformRole.USER,
    accountType: AccountType.PROPERTY_OWNER,
    status: AccountStatus.ACTIVE,
    isVerifiedAgent: false,
  };

  const mockAdminUser: AuthenticatedUser = {
    id: 'user-admin-001',
    name: 'Super Admin',
    mobile: '9123456780',
    normalizedMobile: '+919123456780',
    role: UserRole.SUPER_ADMIN,
    platformRole: PlatformRole.SUPER_ADMIN,
    accountType: null,
    status: AccountStatus.ACTIVE,
    isVerifiedAgent: true,
  };

  const samplePropertyDoc = {
    id: 'prop-test-1',
    slug: 'spacious-3bhk-villa-gomti-nagar',
    ownerId: 'user-agent-123',
    advertiserId: 'user-agent-123',
    createdBy: 'user-agent-123',
    status: 'DRAFT',
    isPublished: false,
    title: { en: 'Spacious 3 BHK Villa in Gomti Nagar' },
    description: { en: 'Beautiful villa with garden.' },
    category: 'House / Home',
    listingType: 'SALE',
    price: { amount: 7500000, currency: 'INR', isNegotiable: true },
    location: { city: 'Lucknow', locality: 'Gomti Nagar' },
    moderation: { history: [] },
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    mockPropertyModel = {
      countDocuments: jest.fn().mockResolvedValue(10),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([samplePropertyDoc]),
          exec: jest.fn().mockResolvedValue([samplePropertyDoc]),
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([samplePropertyDoc]),
              exec: jest.fn().mockResolvedValue([samplePropertyDoc]),
            }),
            lean: jest.fn().mockResolvedValue([samplePropertyDoc]),
          }),
        }),
      }),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    mockCategoryModel = {
      countDocuments: jest.fn().mockResolvedValue(10),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([{ name: 'House / Home', code: 'HOUSE' }]),
        }),
      }),
      findOne: jest.fn(),
      create: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      findOneAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: getModelToken(Property.name), useValue: mockPropertyModel },
        { provide: getModelToken(Category.name), useValue: mockCategoryModel },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
  });

  describe('Property Creation & Ownership Initialization', () => {
    it('should create property with initial DRAFT status and set ownerId from authenticated user', async () => {
      mockPropertyModel.create.mockImplementation((data) =>
        Promise.resolve({ ...data, _id: 'prop-new-id' }),
      );

      const dto = {
        title: { en: 'New Modern Flat' },
        category: 'Flats',
        listingType: 'SALE',
        price: { amount: 4500000 },
        location: { locality: 'Indira Nagar', city: 'Lucknow' },
      };

      const result = await service.createProperty(dto, mockAgentUser);

      expect(result).toBeDefined();
      expect(result.ownerId).toBe(mockAgentUser.id);
      expect(result.status).toBe('DRAFT');
      expect(result.isPublished).toBe(false);
      expect(mockPropertyModel.create).toHaveBeenCalled();
    });
  });

  describe('Ownership Security on Updates', () => {
    it('should allow owner to update their own property', async () => {
      const mockDoc = { ...samplePropertyDoc };
      mockPropertyModel.findOne.mockResolvedValue(mockDoc);
      mockPropertyModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ ...mockDoc, title: { en: 'Updated Title' } }),
      });

      const result = await service.updateProperty(
        'prop-test-1',
        { title: { en: 'Updated Title' } },
        mockAgentUser,
      );

      expect(result.title.en).toBe('Updated Title');
    });

    it('should throw ForbiddenException when a user attempts to edit another user property', async () => {
      mockPropertyModel.findOne.mockResolvedValue({ ...samplePropertyDoc });

      await expect(
        service.updateProperty(
          'prop-test-1',
          { title: { en: 'Hacked Title' } },
          mockOtherUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should strip status change to PUBLISHED if attempted by regular agent/owner', async () => {
      const mockDoc = { ...samplePropertyDoc };
      mockPropertyModel.findOne.mockResolvedValue(mockDoc);
      mockPropertyModel.findOneAndUpdate.mockImplementation((query, update) => ({
        lean: jest.fn().mockResolvedValue(update.$set),
      }));

      const maliciousDto: any = {
        title: { en: 'Attempted Direct Publish' },
        status: 'PUBLISHED',
        isPublished: true,
      };

      const result = await service.updateProperty('prop-test-1', maliciousDto, mockAgentUser);

      expect(result.status).toBeUndefined();
      expect(result.isPublished).toBeUndefined();
    });
  });

  describe('Property Submission State Machine', () => {
    it('should transition DRAFT property to PENDING_REVIEW upon submission', async () => {
      const mockDoc = {
        ...samplePropertyDoc,
        status: 'DRAFT',
        save: jest.fn().mockResolvedValue(true),
      };
      mockPropertyModel.findOne.mockResolvedValue(mockDoc);

      const res = await service.submitProperty('prop-test-1', mockAgentUser);

      expect(res.success).toBe(true);
      expect(mockDoc.status).toBe('PENDING_REVIEW');
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when submitting an already PUBLISHED property', async () => {
      const mockDoc = {
        ...samplePropertyDoc,
        status: 'PUBLISHED',
      };
      mockPropertyModel.findOne.mockResolvedValue(mockDoc);

      await expect(service.submitProperty('prop-test-1', mockAgentUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if submitting another user property', async () => {
      const mockDoc = {
        ...samplePropertyDoc,
        status: 'DRAFT',
      };
      mockPropertyModel.findOne.mockResolvedValue(mockDoc);

      await expect(service.submitProperty('prop-test-1', mockOtherUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('Owner Listing Queries', () => {
    it('should return properties matching ownerId', async () => {
      const myProperties = await service.findMyProperties(mockAgentUser.id);
      expect(myProperties).toBeDefined();
      expect(Array.isArray(myProperties)).toBe(true);
      expect(mockPropertyModel.find).toHaveBeenCalledWith({
        $or: [
          { ownerId: mockAgentUser.id },
          { advertiserId: mockAgentUser.id },
          { createdBy: mockAgentUser.id },
        ],
      });
    });
  });

  describe('Search & Discovery Engine (Phase 07)', () => {
    it('should enforce public visibility invariant: only PUBLISHED and isPublished: true', async () => {
      const queryMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([samplePropertyDoc]),
      };
      mockPropertyModel.find.mockReturnValue(queryMock);
      mockPropertyModel.countDocuments.mockResolvedValue(1);

      const result = await service.search({});

      expect(result).toBeDefined();
      expect(mockPropertyModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: { $in: ['PUBLISHED', 'ACTIVE'] },
          isPublished: true,
        }),
        expect.objectContaining({
          moderation: 0,
          moderationRemarks: 0,
          rejectionReason: 0,
          adminRemark: 0,
        }),
      );
    });

    it('should apply keyword search across regex fields', async () => {
      const queryMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([samplePropertyDoc]),
      };
      mockPropertyModel.find.mockReturnValue(queryMock);
      mockPropertyModel.countDocuments.mockResolvedValue(1);

      await service.search({ q: 'Gomti Nagar Villa' });

      expect(mockPropertyModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: { $in: ['PUBLISHED', 'ACTIVE'] },
          isPublished: true,
          $or: expect.arrayContaining([
            expect.objectContaining({ 'title.en': expect.any(RegExp) }),
            expect.objectContaining({ 'location.city': expect.any(RegExp) }),
          ]),
        }),
        expect.any(Object),
      );
    });

    it('should apply facet filters for category, listingType, city, price range, bedrooms', async () => {
      const queryMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([samplePropertyDoc]),
      };
      mockPropertyModel.find.mockReturnValue(queryMock);
      mockPropertyModel.countDocuments.mockResolvedValue(1);

      await service.search({
        category: 'Apartment',
        listingType: 'SALE',
        city: 'Lucknow',
        minPrice: 3000000,
        maxPrice: 8000000,
        bedrooms: 3,
        furnishing: 'SEMI_FURNISHED',
        constructionStatus: 'READY_TO_MOVE',
      });

      expect(mockPropertyModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: { $in: ['PUBLISHED', 'ACTIVE'] },
          isPublished: true,
          'price.amount': { $gte: 3000000, $lte: 8000000 },
          'specs.bedrooms': 3,
        }),
        expect.any(Object),
      );
    });

    it('should apply multiple amenities using AND logic ($all)', async () => {
      const queryMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([samplePropertyDoc]),
      };
      mockPropertyModel.find.mockReturnValue(queryMock);
      mockPropertyModel.countDocuments.mockResolvedValue(1);

      await service.search({
        amenities: 'Swimming Pool, Covered Car Parking, 24/7 Gated Security & CCTV',
      });

      expect(mockPropertyModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          amenities: {
            $all: [
              'Swimming Pool',
              'Covered Car Parking',
              '24/7 Gated Security & CCTV',
            ],
          },
        }),
        expect.any(Object),
      );
    });

    it('should calculate and return structured pagination metadata with clamped limit', async () => {
      const queryMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([samplePropertyDoc]),
      };
      mockPropertyModel.find.mockReturnValue(queryMock);
      mockPropertyModel.countDocuments.mockResolvedValue(25);

      const result = await service.search({ page: 2, limit: 10 });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      expect(queryMock.skip).toHaveBeenCalledWith(10);
      expect(queryMock.limit).toHaveBeenCalledWith(10);
    });

    it('should enforce maximum pagination limit of 50', async () => {
      const queryMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      mockPropertyModel.find.mockReturnValue(queryMock);
      mockPropertyModel.countDocuments.mockResolvedValue(0);

      const result = await service.search({ page: 1, limit: 100 });

      expect(result.pagination.limit).toBe(50);
      expect(queryMock.limit).toHaveBeenCalledWith(50);
    });
  });
});
