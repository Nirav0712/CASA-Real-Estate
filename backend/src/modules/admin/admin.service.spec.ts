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
    };

    const mockAgentDocumentModel = {
      aggregate: jest.fn().mockResolvedValue([]),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      }),
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    mockAuthService = {
      normalizeRoleModel: jest.fn().mockImplementation((user: any) => ({
        platformRole: user.platformRole || (user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'USER'),
        accountType: user.accountType !== undefined ? user.accountType : (user.role === 'SUPER_ADMIN' ? null : 'AGENT'),
      })),
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
          provide: AuthService,
          useValue: mockAuthService,
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

    it('should throw NotFoundException if property does not exist', async () => {
      mockPropertyModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.approve('nonexistent-id')).rejects.toThrow(NotFoundException);
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
  });
});

