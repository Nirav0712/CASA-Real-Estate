// Mock @nestjs/jwt for Jest CJS environment
jest.mock('@nestjs/jwt', () => {
  return {
    JwtService: class MockJwtService {
      signAsync = jest.fn().mockResolvedValue('mock_jwt_token_xyz');
      verifyAsync = jest.fn();
    },
  };
});
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Property } from '../properties/schemas/property.schema';
import { Category } from '../properties/schemas/category.schema';
import { User } from '../auth/schemas/user.schema';
import { AuditLog } from './schemas/audit-log.schema';
import { RefreshSession } from '../auth/schemas/refresh-session.schema';
import { Role } from '../entitlements/schemas/role.schema';
import { UserRole, AccountStatus, PlatformRole, AccountType } from '../auth/enums/auth.enums';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

import { AuthService } from '../auth/auth.service';
import { WhatsAppService } from '../leads/whatsapp.service';
import { FeaturedPropertyRequest } from '../properties/schemas/featured-property-request.schema';

describe('AdminService Moderation & User Governance (Phase 08)', () => {
  let service: AdminService;
  let mockPropertyModel: any;
  let mockCategoryModel: any;
  let mockUserModel: any;
  let mockAuditLogModel: any;
  let mockRefreshSessionModel: any;
  let mockRoleModel: any;
  let mockAuthService: any;

  const mockAdminUser: AuthenticatedUser = {
    id: 'user-admin-001',
    name: 'Admin Officer',
    mobile: '9876543210',
    normalizedMobile: '+919876543210',
    role: UserRole.ADMIN,
    platformRole: PlatformRole.ADMIN,
    accountType: null,
    status: AccountStatus.ACTIVE,
    isVerifiedAgent: false,
  };

  const mockSuperAdminUser: AuthenticatedUser = {
    id: 'user-super-001',
    name: 'Super Administrator',
    mobile: '9925843599',
    normalizedMobile: '+919925843599',
    role: UserRole.SUPER_ADMIN,
    platformRole: PlatformRole.SUPER_ADMIN,
    accountType: null,
    status: AccountStatus.ACTIVE,
    isVerifiedAgent: false,
  };

  const getMockPropertyDoc = () => ({
    _id: '507f1f77bcf86cd799439011',
    id: 'mod-101',
    referenceId: 'CASA-MOD-101',
    slug: '4-bhk-luxury-independent-villa',
    title: { en: '4 BHK Luxury Independent Villa' },
    category: 'House / Home',
    listingType: 'SALE',
    price: { amount: 18500000, currency: 'INR' },
    location: { city: 'Lucknow', locality: 'Gomti Nagar Extension' },
    advertiser: { name: 'Rajesh Verma', role: 'VERIFIED_AGENT', phone: '+919925843599' },
    status: 'PENDING_REVIEW',
    moderation: { riskScore: 'LOW', reasonsFlagged: [] } as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
    toObject: jest.fn().mockImplementation(function () {
      return { ...this };
    }),
  });

  beforeEach(async () => {
    mockPropertyModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([getMockPropertyDoc()]),
          lean: jest.fn().mockResolvedValue([getMockPropertyDoc()]),
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([getMockPropertyDoc()]),
              lean: jest.fn().mockResolvedValue([getMockPropertyDoc()]),
            }),
          }),
        }),
      }),
      findOne: jest.fn(),
      countDocuments: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockResolvedValue(getMockPropertyDoc()),
      aggregate: jest.fn().mockResolvedValue([]),
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    mockCategoryModel = {
      countDocuments: jest.fn().mockResolvedValue(13),
    };

    mockUserModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([
                {
                  _id: 'usr-agent-01',
                  name: 'Rajesh Verma',
                  mobile: '9925843599',
                  normalizedMobile: '+919925843599',
                  role: UserRole.AGENT,
                  status: AccountStatus.ACTIVE,
                  isVerifiedAgent: false,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              ]),
            }),
          }),
        }),
      }),
      findOne: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn().mockResolvedValue(1),
      create: jest.fn(),
      aggregate: jest.fn().mockResolvedValue([]),
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    };

    mockAuditLogModel = {
      create: jest.fn().mockResolvedValue(true),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([
                {
                  _id: 'audit-001',
                  action: 'USER_STATUS_CHANGED',
                  actorUserId: 'user-admin-001',
                  actorName: 'Admin Officer',
                  actorRole: 'ADMIN',
                  targetUserId: 'usr-agent-01',
                  timestamp: new Date(),
                },
              ]),
            }),
          }),
        }),
      }),
      countDocuments: jest.fn().mockResolvedValue(1),
    };

    mockRefreshSessionModel = {
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    };

    const mockAgentProfileModel = {
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
      findOne: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          userId: 'usr-agent-01',
          displayName: 'Rajesh Verma',
          verificationStatus: 'NOT_SUBMITTED',
        }),
      }),
      findOneAndUpdate: jest.fn().mockResolvedValue(true),
      distinct: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    };

    const mockAgentDocumentModel = {
      aggregate: jest.fn().mockResolvedValue([]),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      }),
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      distinct: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    };

    mockAuthService = {
      normalizeRoleModel: jest.fn().mockImplementation((user: any) => ({
        platformRole: user.platformRole || (user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'USER'),
        accountType: user.accountType !== undefined ? user.accountType : (user.role === 'SUPER_ADMIN' ? null : 'AGENT'),
      })),
      deleteMemUser: jest.fn().mockReturnValue(true),
      getMemUserById: jest.fn(),
      revokeUserSessions: jest.fn(),
    };

    mockRoleModel = {
      findById: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getModelToken(Property.name),
          useValue: mockPropertyModel,
        },
        {
          provide: getModelToken(Category.name),
          useValue: mockCategoryModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(AuditLog.name),
          useValue: mockAuditLogModel,
        },
        {
          provide: getModelToken(RefreshSession.name),
          useValue: mockRefreshSessionModel,
        },
        {
          provide: getModelToken('AgentProfile'),
          useValue: mockAgentProfileModel,
        },
        {
          provide: getModelToken('AgentVerificationDocument'),
          useValue: mockAgentDocumentModel,
        },
        {
          provide: getModelToken(Role.name),
          useValue: mockRoleModel,
        },
        {
          provide: getModelToken('Lead'),
          useValue: { countDocuments: jest.fn().mockResolvedValue(0) },
        },
        {
          provide: getModelToken('Payment'),
          useValue: { aggregate: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: getModelToken('SystemSetting'),
          useValue: { findOne: jest.fn().mockResolvedValue(null) },
        },
        {
          provide: getModelToken('Package'),
          useValue: { find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) },
        },
        {
          provide: getModelToken('Subscription'),
          useValue: {
            find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
            deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
          },
        },
        {
          provide: getModelToken(FeaturedPropertyRequest.name),
          useValue: {
            find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ skip: jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }) }) }),
            findOne: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
            countDocuments: jest.fn().mockResolvedValue(0),
            deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
          },
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: WhatsAppService,
          useValue: {
            sendLeadNotification: jest.fn().mockResolvedValue({ success: true }),
            sendKycApprovedNotification: jest.fn().mockResolvedValue({ success: true }),
            sendKycRejectedNotification: jest.fn().mockResolvedValue({ success: true }),
            sendPackageChangedNotification: jest.fn().mockResolvedValue({ success: true }),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  describe('1. Pending Queue Retrieval', () => {
    it('should query MongoDB for status in PENDING_REVIEW and PENDING_APPROVAL', async () => {
      const queue = await service.getPendingQueue();
      expect(mockPropertyModel.find).toHaveBeenCalledWith({
        status: { $in: ['PENDING_REVIEW', 'PENDING_APPROVAL'] },
      });
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe('mod-101');
      expect(queue[0].status).toBe('PENDING_REVIEW');
    });
  });

  describe('2. Admin Approval & Persistence', () => {
    it('should load property from MongoDB, update status to PUBLISHED, record moderation metadata, and save', async () => {
      const docToApprove: any = getMockPropertyDoc();
      docToApprove.save = jest.fn().mockResolvedValue(true);
      docToApprove.toObject = jest.fn().mockReturnValue({
        ...docToApprove,
        status: 'PUBLISHED',
        moderation: {
          approvedBy: 'Admin Officer',
          approvedAt: new Date(),
          publishedAt: new Date(),
          adminRemark: 'LDA Title documents verified',
        },
      });

      mockPropertyModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(docToApprove),
      });

      const user = { name: 'Admin Officer', email: 'admin@casa.com', role: 'ADMIN' };
      const result = await service.approve('mod-101', 'LDA Title documents verified', user);

      expect(docToApprove.status).toBe('PUBLISHED');
      expect(docToApprove.moderation.approvedBy).toBe('Admin Officer');
      expect(docToApprove.moderation.adminRemark).toBe('LDA Title documents verified');
      expect(docToApprove.save).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.property.status).toBe('PUBLISHED');
    });

    it('should cascade PUBLISHED status to child units when parent project is approved', async () => {
      const parentDoc: any = getMockPropertyDoc();
      parentDoc.isParentProject = true;
      parentDoc.save = jest.fn().mockResolvedValue(true);
      parentDoc.toObject = jest.fn().mockReturnValue(parentDoc);

      mockPropertyModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(parentDoc),
      });

      await service.approve('mod-101', 'Approved', { name: 'Admin', role: 'ADMIN' });

      expect(mockPropertyModel.updateMany).toHaveBeenCalledWith(
        { parentPropertyId: parentDoc.id, status: { $ne: 'SOLD_OR_RENTED' } },
        expect.objectContaining({
          $set: expect.objectContaining({ status: 'PUBLISHED', isPublished: true }),
        }),
      );
    });

    it('should distinguish parent projects, child units, and independent properties in dashboard counts', async () => {
      mockPropertyModel.countDocuments
        .mockResolvedValueOnce(3) // pendingApprovals
        .mockResolvedValueOnce(12) // activeListings
        .mockResolvedValueOnce(18) // totalProperties
        .mockResolvedValueOnce(2) // rejected
        .mockResolvedValueOnce(4) // parentProjectsCount
        .mockResolvedValueOnce(8) // childUnitsCount
        .mockResolvedValueOnce(6); // independentPropertiesCount

      const stats = await service.getDashboardStats();

      expect(stats.parentProjectsCount).toBe(4);
      expect(stats.childUnitsCount).toBe(8);
      expect(stats.independentPropertiesCount).toBe(6);
    });

    it('should throw NotFoundException if property does not exist', async () => {
      mockPropertyModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.approve('nonexistent-id')).rejects.toThrow(NotFoundException);
    });

    it('should reject Super Admin approval if listing is still in PENDING_BROKER_APPROVAL status', async () => {
      const docPendingBroker: any = getMockPropertyDoc();
      docPendingBroker.status = 'PENDING_BROKER_APPROVAL';

      mockPropertyModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(docPendingBroker),
      });

      await expect(
        service.approve('mod-101', 'Approved', { name: 'Admin', role: 'ADMIN' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Admin Rejection & Persistence', () => {
    it('should update status to REJECTED, record reasonCode and moderator feedback, and save', async () => {
      const docToReject: any = getMockPropertyDoc();
      docToReject.save = jest.fn().mockResolvedValue(true);
      docToReject.toObject = jest.fn().mockReturnValue({
        ...docToReject,
        status: 'REJECTED',
        moderation: {
          rejectedBy: 'Super Admin',
          rejectionReason: 'INSUFFICIENT_DOCS',
          adminRemark: 'Please attach valid ownership registry',
        },
      });

      mockPropertyModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(docToReject),
      });

      const user = { name: 'Super Admin', email: 'super@casa.com', role: 'SUPER_ADMIN' };
      const result = await service.reject(
        'mod-101',
        'INSUFFICIENT_DOCS',
        'Please attach valid ownership registry',
        user,
      );

      expect(docToReject.status).toBe('REJECTED');
      expect(docToReject.moderation.rejectedBy).toBe('Super Admin');
      expect(docToReject.moderation.rejectionReason).toBe('INSUFFICIENT_DOCS');
      expect(docToReject.moderation.adminRemark).toBe('Please attach valid ownership registry');
      expect(docToReject.save).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException if reasonCode is empty', async () => {
      await expect(service.reject('mod-101', '')).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. User Management & RBAC (Phase 08)', () => {
    it('should list users with structured pagination metadata', async () => {
      const result = await service.getUsers({ page: 1, limit: 10 });
      expect(result.data).toBeDefined();
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should update user status and revoke active refresh sessions when suspended', async () => {
      const targetUser = {
        _id: '507f1f77bcf86cd799439099',
        name: 'Target Broker',
        mobile: '9111222333',
        normalizedMobile: '+919111222333',
        role: UserRole.AGENT,
        status: AccountStatus.ACTIVE,
        save: jest.fn().mockResolvedValue(true),
      };
      mockUserModel.findOne.mockResolvedValue(targetUser);

      const res = await service.updateUserStatus(
        '507f1f77bcf86cd799439099',
        { status: AccountStatus.SUSPENDED, reason: 'Policy Violation' },
        mockAdminUser,
      );

      expect(res.success).toBe(true);
      expect(targetUser.status).toBe(AccountStatus.SUSPENDED);
      expect(targetUser.save).toHaveBeenCalled();
      expect(mockRefreshSessionModel.updateMany).toHaveBeenCalledWith(
        { userId: targetUser._id },
        expect.objectContaining({ $set: expect.objectContaining({ isRevoked: true }) }),
      );
      expect(mockAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_STATUS_CHANGED',
          actorUserId: mockAdminUser.id,
          targetUserId: targetUser._id.toString(),
        }),
      );
    });

    it('should prevent an admin from suspending their own account', async () => {
      const selfUser = {
        _id: 'user-admin-001',
        normalizedMobile: '+919876543210',
        role: UserRole.ADMIN,
        status: AccountStatus.ACTIVE,
      };
      mockUserModel.findOne.mockResolvedValue(selfUser);

      await expect(
        service.updateUserStatus(
          'user-admin-001',
          { status: AccountStatus.SUSPENDED },
          mockAdminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent a normal ADMIN from modifying a SUPER_ADMIN status', async () => {
      const superAdminUser = {
        _id: 'user-super-999',
        normalizedMobile: '+919999999999',
        role: UserRole.SUPER_ADMIN,
        status: AccountStatus.ACTIVE,
      };
      mockUserModel.findOne.mockResolvedValue(superAdminUser);

      await expect(
        service.updateUserStatus(
          'user-super-999',
          { status: AccountStatus.SUSPENDED },
          mockAdminUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow SUPER_ADMIN to update user role and record audit log', async () => {
      const targetUser = {
        _id: '507f1f77bcf86cd799439099',
        name: 'Promoted Agent',
        mobile: '9111222333',
        normalizedMobile: '+919111222333',
        role: UserRole.AGENT,
        status: AccountStatus.ACTIVE,
        isVerifiedAgent: false,
        save: jest.fn().mockResolvedValue(true),
      };
      mockUserModel.findOne.mockResolvedValue(targetUser);

      const res = await service.updateUserRole(
        '507f1f77bcf86cd799439099',
        { role: UserRole.VERIFIED_AGENT, reason: 'RERA Compliance Verified' },
        mockSuperAdminUser,
      );

      expect(res.success).toBe(true);
      expect(targetUser.role).toBe(UserRole.AGENT);
      expect(targetUser.isVerifiedAgent).toBe(true);
      expect(targetUser.save).toHaveBeenCalled();
      expect(mockAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_ROLE_CHANGED',
          actorUserId: mockSuperAdminUser.id,
        }),
      );
    });

    it('should assign a dynamic custom role by ObjectId and persist to MongoDB', async () => {
      const customRoleDoc = {
        _id: '67a21f77bcf86cd799439088',
        name: 'QA Test Agent',
        slug: 'qa-test-agent',
        platformRole: PlatformRole.USER,
        accountType: AccountType.AGENT,
        isSystemRole: false,
        isActive: true,
        permissions: ['property:view', 'property:create', 'leads:view'],
        dataScope: 'OWN',
      };
      mockRoleModel.findById.mockResolvedValue(customRoleDoc);

      const targetUser = {
        _id: '507f1f77bcf86cd799439099',
        name: 'Agent 1',
        mobile: '9111222333',
        normalizedMobile: '+919111222333',
        role: UserRole.BUYER,
        platformRole: PlatformRole.USER,
        accountType: AccountType.BUYER,
        customRoleId: null,
        status: AccountStatus.ACTIVE,
        isVerifiedAgent: false,
        save: jest.fn().mockResolvedValue(true),
      };
      mockUserModel.findOne.mockResolvedValue(targetUser);

      const res = await service.updateUserRole(
        '507f1f77bcf86cd799439099',
        { roleId: '67a21f77bcf86cd799439088', reason: 'Assigned QA Test Agent role' },
        mockSuperAdminUser,
      );

      expect(res.success).toBe(true);
      expect(targetUser.customRoleId).toBe('67a21f77bcf86cd799439088');
      expect(targetUser.platformRole).toBe(PlatformRole.USER);
      expect(targetUser.accountType).toBe(AccountType.AGENT);
      expect(targetUser.role).toBe(UserRole.AGENT);
      expect(targetUser.save).toHaveBeenCalled();
      expect(res.user?.customRole?.name).toBe('QA Test Agent');
      expect(res.user?.roleName).toBe('QA Test Agent');
      expect(mockAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_ROLE_CHANGED',
          newValue: expect.objectContaining({
            customRoleId: '67a21f77bcf86cd799439088',
            roleName: 'QA Test Agent',
          }),
        }),
      );
    });

    it('should assign a dynamic custom role by slug', async () => {
      const customRoleDoc = {
        _id: '67a21f77bcf86cd799439088',
        name: 'Regional Agency Team Lead',
        slug: 'regional-team-lead',
        platformRole: PlatformRole.USER,
        accountType: AccountType.AGENT,
        isSystemRole: false,
        isActive: true,
        permissions: ['property:view', 'leads:view', 'leads:assign'],
        dataScope: 'TEAM',
      };
      mockRoleModel.findById.mockResolvedValue(null);
      mockRoleModel.findOne.mockResolvedValue(customRoleDoc);

      const targetUser = {
        _id: '507f1f77bcf86cd799439099',
        name: 'Agent 2',
        mobile: '9111222334',
        normalizedMobile: '+919111222334',
        role: UserRole.AGENT,
        platformRole: PlatformRole.USER,
        accountType: AccountType.AGENT,
        customRoleId: null,
        status: AccountStatus.ACTIVE,
        save: jest.fn().mockResolvedValue(true),
      };
      mockUserModel.findOne.mockResolvedValue(targetUser);

      const res = await service.updateUserRole(
        '507f1f77bcf86cd799439099',
        { role: 'regional-team-lead', reason: 'Team lead promotion' },
        mockAdminUser,
      );

      expect(res.success).toBe(true);
      expect(targetUser.customRoleId).toBe('67a21f77bcf86cd799439088');
      expect(res.user?.customRole?.name).toBe('Regional Agency Team Lead');
    });

    it('should reject assigning an inactive custom role', async () => {
      const inactiveRoleDoc = {
        _id: '67a21f77bcf86cd799439089',
        name: 'Archived Agent Role',
        slug: 'archived-agent-role',
        isActive: false,
      };
      mockRoleModel.findById.mockResolvedValue(inactiveRoleDoc);

      const targetUser = {
        _id: '507f1f77bcf86cd799439099',
        name: 'Agent 3',
        save: jest.fn(),
      };
      mockUserModel.findOne.mockResolvedValue(targetUser);

      await expect(
        service.updateUserRole(
          '507f1f77bcf86cd799439099',
          { roleId: '67a21f77bcf86cd799439089' },
          mockAdminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject unauthorized privilege escalation when non-super-admin assigns SUPER_ADMIN role', async () => {
      const superAdminRoleDoc = {
        _id: '67a21f77bcf86cd799439090',
        name: 'Super Administrator',
        slug: 'super-admin',
        platformRole: PlatformRole.SUPER_ADMIN,
        isSystemRole: true,
        isActive: true,
      };
      mockRoleModel.findById.mockResolvedValue(superAdminRoleDoc);

      const targetUser = {
        _id: '507f1f77bcf86cd799439099',
        name: 'Target User',
        role: UserRole.AGENT,
        platformRole: PlatformRole.USER,
        save: jest.fn(),
      };
      mockUserModel.findOne.mockResolvedValue(targetUser);

      await expect(
        service.updateUserRole(
          '507f1f77bcf86cd799439099',
          { roleId: '67a21f77bcf86cd799439090' },
          mockAdminUser, // Non-super-admin actor
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject modifying a SUPER_ADMIN user by non-super-admin actor', async () => {
      const targetSuperAdmin = {
        _id: '507f1f77bcf86cd799439099',
        name: 'Existing Super Admin',
        role: UserRole.SUPER_ADMIN,
        platformRole: PlatformRole.SUPER_ADMIN,
        save: jest.fn(),
      };
      mockUserModel.findOne.mockResolvedValue(targetSuperAdmin);

      await expect(
        service.updateUserRole(
          '507f1f77bcf86cd799439099',
          { role: 'AGENT' },
          mockAdminUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject user attempting to modify own role', async () => {
      const selfUser = {
        _id: 'user-admin-001',
        normalizedMobile: '+919876543210',
        role: UserRole.ADMIN,
      };
      mockUserModel.findOne.mockResolvedValue(selfUser);

      await expect(
        service.updateUserRole(
          'user-admin-001',
          { role: 'AGENT' },
          mockAdminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject MODERATOR attempting to modify roles', async () => {
      const mockModUser: AuthenticatedUser = {
        id: 'user-mod-001',
        name: 'Moderator User',
        mobile: '9876543211',
        normalizedMobile: '+919876543211',
        role: UserRole.MODERATOR,
        platformRole: PlatformRole.MODERATOR,
        accountType: null,
        status: AccountStatus.ACTIVE,
        isVerifiedAgent: false,
      };

      const targetUser = {
        _id: '507f1f77bcf86cd799439099',
        name: 'Target User',
        role: UserRole.BUYER,
      };
      mockUserModel.findOne.mockResolvedValue(targetUser);

      await expect(
        service.updateUserRole(
          '507f1f77bcf86cd799439099',
          { role: 'AGENT' },
          mockModUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should assign a system role and clear customRoleId', async () => {
      const systemAgentDoc = {
        _id: '67a21f77bcf86cd799439010',
        name: 'Licensed Real Estate Agent',
        slug: 'agent',
        platformRole: PlatformRole.USER,
        accountType: AccountType.AGENT,
        isSystemRole: true,
        isActive: true,
      };
      mockRoleModel.findById.mockResolvedValue(systemAgentDoc);

      const targetUser = {
        _id: '507f1f77bcf86cd799439099',
        name: 'Agent 4',
        mobile: '9111222335',
        normalizedMobile: '+919111222335',
        role: UserRole.BUYER,
        platformRole: PlatformRole.USER,
        accountType: AccountType.BUYER,
        customRoleId: 'previous-custom-role-id',
        status: AccountStatus.ACTIVE,
        isVerifiedAgent: false,
        save: jest.fn().mockResolvedValue(true),
      };
      mockUserModel.findOne.mockResolvedValue(targetUser);

      const res = await service.updateUserRole(
        '507f1f77bcf86cd799439099',
        { roleId: '67a21f77bcf86cd799439010' },
        mockSuperAdminUser,
      );

      expect(res.success).toBe(true);
      expect(targetUser.customRoleId).toBeNull();
      expect(targetUser.platformRole).toBe(PlatformRole.USER);
      expect(targetUser.accountType).toBe(AccountType.AGENT);
      expect(targetUser.role).toBe(UserRole.AGENT);
    });

    it('should return customRole details when calling getUserById', async () => {
      const customRoleDoc = {
        _id: '67a21f77bcf86cd799439088',
        name: 'QA Test Agent',
        slug: 'qa-test-agent',
        isSystemRole: false,
        permissions: ['property:view', 'property:create'],
        dataScope: 'OWN',
        dashboardConfig: { overview: true, properties: true, leads: true },
      };
      mockRoleModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(customRoleDoc),
      });

      const dbUser = {
        _id: '507f1f77bcf86cd799439099',
        name: 'Agent 1',
        mobile: '9111222333',
        normalizedMobile: '+919111222333',
        role: UserRole.AGENT,
        platformRole: PlatformRole.USER,
        accountType: AccountType.AGENT,
        customRoleId: '67a21f77bcf86cd799439088',
        status: AccountStatus.ACTIVE,
        isVerifiedAgent: false,
      };
      mockUserModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(dbUser),
      });

      const userDetail = await service.getUserById('507f1f77bcf86cd799439099');
      expect(userDetail.customRoleId).toBe('67a21f77bcf86cd799439088');
      expect(userDetail.customRole).toBeDefined();
      expect(userDetail.customRole?.name).toBe('QA Test Agent');
      expect(userDetail.roleName).toBe('QA Test Agent');
    });

    it('should grant and revoke CASA Verified Agent badge with persistence', async () => {
      const agentUser = {
        _id: '507f1f77bcf86cd799439077',
        name: 'Agent RERA Test',
        role: UserRole.AGENT,
        isVerifiedAgent: false,
        save: jest.fn().mockResolvedValue(true),
      };
      mockUserModel.findOne.mockResolvedValue(agentUser);

      const grantRes = await service.verifyAgent(
        '507f1f77bcf86cd799439077',
        'Official RERA certificate verified',
        mockAdminUser,
      );
      expect(grantRes.success).toBe(true);
      expect(agentUser.isVerifiedAgent).toBe(true);
      expect(agentUser.role).toBe(UserRole.VERIFIED_AGENT);

      const revokeRes = await service.revokeAgentVerification(
        '507f1f77bcf86cd799439077',
        'RERA renewal pending',
        mockAdminUser,
      );
      expect(revokeRes.success).toBe(true);
      expect(agentUser.isVerifiedAgent).toBe(false);
      expect(agentUser.role).toBe(UserRole.AGENT);
    });

    it('should query and return paginated audit logs', async () => {
      const logs = await service.getAuditLogs({ page: 1, limit: 20 });
      expect(logs.data).toBeDefined();
      expect(logs.data.length).toBeGreaterThan(0);
      expect(logs.data[0].action).toBe('USER_STATUS_CHANGED');
      expect(logs.pagination.total).toBe(1);
    });

    it('should permanently delete user, clean up DB records by id/email/mobile, sessions, agent documents, subscriptions, and memUser cache', async () => {
      const targetUser = {
        _id: '507f1f77bcf86cd799439077',
        name: 'Deleted User',
        email: 'deleted@example.com',
        mobile: '9123456789',
        normalizedMobile: '+919123456789',
        role: UserRole.AGENT,
        status: AccountStatus.ACTIVE,
      };
      mockUserModel.findOne.mockResolvedValue(targetUser);

      const res = await service.deleteUser('507f1f77bcf86cd799439077', 'Permanent removal', mockAdminUser);

      expect(res.success).toBe(true);
      expect(res.deletedUserId).toBe('507f1f77bcf86cd799439077');
      expect(mockUserModel.deleteMany).toHaveBeenCalledWith({
        $or: [
          { _id: '507f1f77bcf86cd799439077' },
          { email: 'deleted@example.com' },
          { normalizedMobile: '+919123456789' },
          { mobile: '+919123456789' },
        ],
      });
      expect(mockAuthService.revokeUserSessions).toHaveBeenCalledWith('507f1f77bcf86cd799439077');
      expect(mockAuthService.deleteMemUser).toHaveBeenCalledWith('deleted@example.com');
      expect(mockAuthService.deleteMemUser).toHaveBeenCalledWith('+919123456789');
      expect(mockAuthService.deleteMemUser).toHaveBeenCalledWith('507f1f77bcf86cd799439077');
    });

    it('should prevent an admin from deleting their own account', async () => {
      const selfUser = {
        _id: 'user-admin-001',
        name: 'Admin User',
        email: 'admin@casa.com',
        normalizedMobile: '+919876543210',
        role: UserRole.ADMIN,
      };
      mockUserModel.findOne.mockResolvedValue(selfUser);

      await expect(
        service.deleteUser('user-admin-001', 'Self delete attempt', mockAdminUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('12. KYC Verification Queue & Governance Regression Tests', () => {
    it('should query KYC queue, return items, counts, and pagination, and prioritize pending requests', async () => {
      mockUserModel.countDocuments
        .mockResolvedValueOnce(3) // total
        .mockResolvedValueOnce(1) // pendingCount
        .mockResolvedValueOnce(1) // approvedCount
        .mockResolvedValueOnce(1); // rejectedCount

      mockUserModel.aggregate.mockResolvedValueOnce([
        {
          _id: 'usr-pending-1',
          name: 'Pending Broker',
          mobile: '9876543210',
          normalizedMobile: '+919876543210',
          role: UserRole.BROKER,
          accountType: AccountType.BROKER,
          status: AccountStatus.ACTIVE,
          kycStatus: 'PENDING',
          kycDocumentType: 'GST_CERTIFICATE',
          kycDocumentNumber: 'TEST-GST-0001',
          kycFrontDocumentUrl: 'data:image/png;base64,mock',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const res = await service.getKycVerificationQueue({ status: 'ALL', page: 1, limit: 12 });

      expect(res.success).toBe(true);
      expect(res.items).toHaveLength(1);
      expect(res.items[0].id).toBe('usr-pending-1');
      expect(res.items[0].kycStatus).toBe('PENDING');
      expect(res.counts).toBeDefined();
      expect(res.counts.pending).toBe(1);
      expect(res.counts.approved).toBe(1);
      expect(res.counts.rejected).toBe(1);
      expect(res.counts.total).toBe(3);
      expect(res.pagination.total).toBe(3);
      expect(res.pagination.totalPages).toBe(1);
    });

    it('should approve KYC application, grant verified badge, activate 3-day trial, and approve documents', async () => {
      const userToApprove = {
        _id: 'usr-kyc-approve-1',
        name: 'Applicant Broker',
        mobile: '9876543211',
        role: UserRole.AGENT,
        accountType: AccountType.BROKER,
        status: AccountStatus.ACTIVE,
        isVerifiedAgent: false,
        kycStatus: 'PENDING',
        save: jest.fn().mockResolvedValue(true),
      };

      mockUserModel.findOne.mockResolvedValueOnce(userToApprove);

      const res = await service.verifyAgent('usr-kyc-approve-1', 'Documents verified valid', mockAdminUser);

      expect(res.success).toBe(true);
      expect(userToApprove.kycStatus).toBe('APPROVED');
      expect(userToApprove.isVerifiedAgent).toBe(true);
      expect((userToApprove as any).isTrialActive).toBe(true);
      expect((userToApprove as any).trialStartedAt).toBeDefined();
      expect((userToApprove as any).trialExpiresAt).toBeDefined();
      expect(userToApprove.save).toHaveBeenCalled();
    });

    it('should reject KYC application with mandatory reason and update documents', async () => {
      const userToReject = {
        _id: 'usr-kyc-reject-1',
        name: 'Rejected Broker',
        mobile: '9876543212',
        role: UserRole.AGENT,
        accountType: AccountType.BROKER,
        status: AccountStatus.ACTIVE,
        isVerifiedAgent: false,
        kycStatus: 'PENDING',
        save: jest.fn().mockResolvedValue(true),
      };

      mockUserModel.findOne.mockResolvedValueOnce(userToReject);

      // Rejection with empty reason should fail
      await expect(service.rejectAgentVerification('usr-kyc-reject-1', '  ', mockAdminUser)).rejects.toThrow();

      // Valid rejection
      const res = await service.rejectAgentVerification(
        'usr-kyc-reject-1',
        'GST certificate is expired and illegible',
        mockAdminUser,
      );

      expect(res.success).toBe(true);
      expect(userToReject.kycStatus).toBe('REJECTED');
      expect((userToReject as any).kycRejectionReason).toBe('GST certificate is expired and illegible');
      expect(userToReject.isVerifiedAgent).toBe(false);
      expect(userToReject.save).toHaveBeenCalled();
    });
  });
});

