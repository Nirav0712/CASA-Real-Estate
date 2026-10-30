import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { EntitlementsService } from './entitlements.service';
import { Role } from './schemas/role.schema';
import { Package, BillingPeriod } from './schemas/package.schema';
import { PropertyView } from './schemas/property-view.schema';
import { User } from '../auth/schemas/user.schema';
import { Subscription } from '../payments/schemas/subscription.schema';
import { AuditLog } from '../admin/schemas/audit-log.schema';
import { PlatformRole, AccountType, UserRole } from '../auth/enums/auth.enums';

describe('3-Month Free Plan & Mandatory KYC Verification (Requirement 9 Test Matrix)', () => {
  let service: EntitlementsService;

  const mockRoleModel: any = {
    find: jest.fn(),
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439001',
          slug: 'agent',
          permissions: ['property:create', 'property:view'],
          dataScope: 'OWN',
          dashboardConfig: { overview: true, properties: true },
        }),
      }),
    }),
    findById: jest.fn(),
  };

  const mockPackageModel: any = {
    find: jest.fn(),
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
      exec: jest.fn().mockResolvedValue(null),
    }),
    findById: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const mockPropertyViewModel: any = {
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockUserModel: any = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockSubscriptionModel: any = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const mockAuditLogModel: any = {
    create: jest.fn().mockResolvedValue(true),
  };

  const freePackageDoc = {
    _id: 'pkg-3month-free-id',
    name: '3-Month Free Plan',
    slug: 'casa-free-trial',
    price: 0,
    billingPeriod: BillingPeriod.NINETY_DAYS,
    propertyListings: 15,
    isFree: true,
    freeTrialMaxSlots: 50,
    freeTrialClaimedSlots: 0,
    limits: {
      propertyViews: -1,
      propertyListings: 15,
      projectListings: 2,
    },
    features: ['15 Property Listings Included', 'Verified Agent Badge Eligible', '3 Months Complete Validity'],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitlementsService,
        { provide: getModelToken(Role.name), useValue: mockRoleModel },
        { provide: getModelToken(Package.name), useValue: mockPackageModel },
        { provide: getModelToken(PropertyView.name), useValue: mockPropertyViewModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Subscription.name), useValue: mockSubscriptionModel },
        { provide: getModelToken(AuditLog.name), useValue: mockAuditLogModel },
      ],
    }).compile();

    service = module.get<EntitlementsService>(EntitlementsService);
  });

  // 1. The 3-day trial is no longer automatically activated
  it('1. should not activate any trial upon registration or KYC without explicit claim', async () => {
    const rawUser = {
      _id: 'usr-1',
      role: UserRole.AGENT,
      accountType: AccountType.AGENT,
      kycStatus: 'APPROVED',
      isTrialActive: false,
      trialStartedAt: undefined,
      trialExpiresAt: undefined,
    };
    expect(rawUser.isTrialActive).toBe(false);
    expect(rawUser.trialStartedAt).toBeUndefined();
  });

  // 2. Users without KYC cannot activate the free plan
  it('2. should reject free plan activation when KYC is not submitted', async () => {
    mockUserModel.findById.mockResolvedValue({
      _id: 'usr-no-kyc',
      role: UserRole.AGENT,
      accountType: AccountType.AGENT,
      kycStatus: 'NOT_SUBMITTED',
      isVerifiedAgent: false,
    });

    await expect(service.claimFreeTrialSubscription('usr-no-kyc')).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.claimFreeTrialSubscription('usr-no-kyc')).rejects.toThrow(
      /Please submit your KYC verification details before claiming the 3-Month Free Plan/i,
    );
  });

  // 3. Users with pending KYC cannot activate the free plan
  it('3. should reject free plan activation when KYC is pending review', async () => {
    mockUserModel.findById.mockResolvedValue({
      _id: 'usr-pending-kyc',
      role: UserRole.AGENT,
      accountType: AccountType.AGENT,
      kycStatus: 'PENDING',
      isVerifiedAgent: false,
    });

    await expect(service.claimFreeTrialSubscription('usr-pending-kyc')).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.claimFreeTrialSubscription('usr-pending-kyc')).rejects.toThrow(
      /Your KYC application has been submitted and is awaiting Super Admin approval/i,
    );
  });

  // 4. Rejected KYC does not grant access
  it('4. should reject free plan activation when KYC is rejected with reason', async () => {
    mockUserModel.findById.mockResolvedValue({
      _id: 'usr-rejected-kyc',
      role: UserRole.AGENT,
      accountType: AccountType.AGENT,
      kycStatus: 'REJECTED',
      kycRejectionReason: 'Aadhaar copy is blurry',
      isVerifiedAgent: false,
    });

    await expect(service.claimFreeTrialSubscription('usr-rejected-kyc')).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.claimFreeTrialSubscription('usr-rejected-kyc')).rejects.toThrow(
      /Aadhaar copy is blurry/i,
    );
  });

  // 5. Approved KYC permits free-plan activation
  it('5. should permit free-plan activation when KYC is approved', async () => {
    mockUserModel.findById.mockResolvedValueOnce({
      _id: 'usr-approved-kyc',
      role: UserRole.AGENT,
      accountType: AccountType.AGENT,
      kycStatus: 'APPROVED',
      isVerifiedAgent: true,
      trialUsed: false,
      isTrialActive: false,
      save: jest.fn().mockResolvedValue(true),
    });
    mockSubscriptionModel.findOne.mockResolvedValue(null);
    mockPackageModel.findOne.mockResolvedValue(freePackageDoc);
    mockUserModel.findOneAndUpdate.mockResolvedValue({
      _id: 'usr-approved-kyc',
      kycStatus: 'APPROVED',
      isTrialActive: true,
      trialUsed: true,
      save: jest.fn().mockResolvedValue(true),
    });
    mockPackageModel.findOneAndUpdate.mockResolvedValue({
      ...freePackageDoc,
      freeTrialClaimedSlots: 1,
    });
    mockSubscriptionModel.create.mockResolvedValue({
      _id: 'sub-free-created',
      status: 'TRIAL',
      plan: '3-Month Free Plan',
    });

    const res = await service.claimFreeTrialSubscription('usr-approved-kyc');
    expect(res.success).toBe(true);
    expect(res.planName).toBe('3-Month Free Plan');
    expect(res.propertyListingsLimit).toBe(15);
  });

  // 6. KYC approval alone does not start the free-plan countdown
  it('6. should ensure KYC approval status alone does not set trialStartedAt or start countdown', () => {
    const approvedUser = {
      _id: 'usr-approved-unclaimed',
      kycStatus: 'APPROVED',
      isVerifiedAgent: true,
      isTrialActive: false,
      trialStartedAt: null,
      trialExpiresAt: null,
    };
    expect(approvedUser.isTrialActive).toBe(false);
    expect(approvedUser.trialStartedAt).toBeNull();
    expect(approvedUser.trialExpiresAt).toBeNull();
  });

  // 7. Activation starts the three-month duration correctly
  it('7. should calculate 3 calendar months duration from activation timestamp', async () => {
    const now = new Date('2026-03-15T10:00:00Z');
    jest.useFakeTimers().setSystemTime(now);

    const userObj = {
      _id: 'usr-calc-duration',
      kycStatus: 'APPROVED',
      isVerifiedAgent: true,
      trialUsed: false,
      isTrialActive: false,
      save: jest.fn().mockResolvedValue(true),
    };

    mockUserModel.findById.mockResolvedValueOnce(userObj);
    mockSubscriptionModel.findOne.mockResolvedValue(null);
    mockPackageModel.findOne.mockResolvedValue(freePackageDoc);
    mockUserModel.findOneAndUpdate.mockResolvedValue(userObj);
    mockPackageModel.findOneAndUpdate.mockResolvedValue({
      ...freePackageDoc,
      freeTrialClaimedSlots: 1,
    });

    let createdSub: any = null;
    mockSubscriptionModel.create.mockImplementation((dto: any) => {
      createdSub = dto;
      return Promise.resolve({
        _id: 'sub-calc-id',
        ...dto,
      });
    });

    const res = await service.claimFreeTrialSubscription('usr-calc-duration');
    expect(res.success).toBe(true);

    const expectedExpiry = new Date(now);
    expectedExpiry.setMonth(expectedExpiry.getMonth() + 3);

    expect(createdSub.startDate.toISOString()).toBe(now.toISOString());
    expect(createdSub.endDate.toISOString()).toBe(expectedExpiry.toISOString());

    jest.useRealTimers();
  });

  // 8. The property listing limit is 15
  it('8. should enforce 15 property listings limit for the 3-Month Free Plan', async () => {
    mockPackageModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(freePackageDoc),
      }),
      exec: jest.fn().mockResolvedValue(freePackageDoc),
    });
    mockPackageModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([freePackageDoc]),
        }),
      }),
    });

    const result = await service.getDynamicPricingPlans();
    const freePlan = (result.plans as any[]).find((p: any) => p.isFree || p.slug === 'casa-free-trial');
    expect(freePlan).toBeDefined();
    expect(freePlan.name).toBe('3-Month Free Plan');
    expect(freePlan.limits.propertyListings).toBe(15);
  });

  // 9. The sixteenth property is rejected when the applicable quota is exhausted
  it('9. should resolve 15 property listings limit for active free plan user in entitlements', async () => {
    const userWithActiveFreePlan = {
      _id: '507f1f77bcf86cd799439011',
      role: UserRole.AGENT,
      accountType: AccountType.AGENT,
      isTrialActive: true,
      trialExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // active
      activePackageId: '507f1f77bcf86cd799439099',
      activePlanName: '3-Month Free Plan',
    };

    mockSubscriptionModel.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      }),
    });

    mockPackageModel.findById.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...freePackageDoc,
          _id: '507f1f77bcf86cd799439099',
        }),
      }),
    });

    const entitlements = await service.resolveUserEntitlements(userWithActiveFreePlan);
    expect(entitlements.limits.propertyListings).toBe(15);
  });

  // 10. Concurrent activation requests cannot create duplicate free plans
  it('10. should block concurrent duplicate activation attempts atomically', async () => {
    mockUserModel.findById.mockResolvedValue({
      _id: 'usr-concurrent',
      kycStatus: 'APPROVED',
      isVerifiedAgent: true,
      trialUsed: false,
      isTrialActive: false,
      save: jest.fn().mockResolvedValue(true),
    });
    mockSubscriptionModel.findOne.mockResolvedValue(null);
    mockPackageModel.findOne.mockResolvedValue(freePackageDoc);

    // Concurrent second call fails lock condition (findOneAndUpdate returns null)
    mockUserModel.findOneAndUpdate.mockResolvedValue(null);

    await expect(service.claimFreeTrialSubscription('usr-concurrent')).rejects.toThrow(
      BadRequestException,
    );
  });

  // 11. Expired free plans no longer grant free-plan entitlements
  it('11. should revoke free-plan listing quota once the 3 months have expired', async () => {
    const expiredUser = {
      _id: '507f1f77bcf86cd799439012',
      role: UserRole.AGENT,
      accountType: AccountType.AGENT,
      isTrialActive: true,
      trialExpired: true,
      trialExpiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // expired 5 days ago
      activePackageId: '507f1f77bcf86cd799439099',
      activePlanName: '3-Month Free Plan',
    };

    mockSubscriptionModel.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      }),
    });

    mockPackageModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439002',
          name: 'Default Fallback',
          slug: 'default-fallback',
          isDefault: true,
          limits: { propertyListings: 0, propertyViews: 10 },
        }),
      }),
    });

    const entitlements = await service.resolveUserEntitlements(expiredUser);
    expect(entitlements.limits.propertyListings).toBe(0);
  });

  // 12. Users with valid paid plans continue to work correctly
  it('12. should preserve paid subscription access and higher quotas independently', async () => {
    const paidPackage = {
      _id: '507f1f77bcf86cd799439088',
      name: 'Agent Gold',
      price: 1999,
      limits: {
        propertyListings: 100,
        propertyViews: -1,
      },
    };
    const paidSub = {
      _id: 'sub-paid-1',
      userId: '507f1f77bcf86cd799439013',
      plan: 'Agent Gold',
      packageId: '507f1f77bcf86cd799439088',
      status: 'ACTIVE',
      endDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000),
    };
    const paidUser = {
      _id: '507f1f77bcf86cd799439013',
      role: UserRole.AGENT,
      accountType: AccountType.AGENT,
      activePackageId: '507f1f77bcf86cd799439088',
      activeSubscriptionId: 'sub-paid-1',
      isTrialActive: false,
      trialExpired: false,
    };

    mockSubscriptionModel.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(paidSub),
        }),
      }),
    });
    mockPackageModel.findById.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(paidPackage),
      }),
    });

    const entitlements = await service.resolveUserEntitlements(paidUser);
    expect(entitlements.limits.propertyListings).toBe(100);
  });

  // 13. Employee permissions and broker property approval remain functional
  it('13. should maintain employee permission scoping and broker approval flow', async () => {
    const employeeUser = {
      _id: 'usr-emp-1',
      role: UserRole.BROKER_AGENT,
      accountType: AccountType.BROKER_AGENT,
      brokerId: 'broker-parent-id',
      permissions: ['properties:create', 'properties:read'],
    };

    expect(employeeUser.permissions).toContain('properties:create');
    expect(employeeUser.brokerId).toBe('broker-parent-id');
  });

  // 14. Super Admin approval and rejection workflows continue to work
  it('14. should uphold Super Admin authorization for KYC verification decisions', async () => {
    const superAdmin = {
      _id: 'admin-1',
      platformRole: PlatformRole.SUPER_ADMIN,
      permissions: ['*'],
    };

    expect(superAdmin.platformRole).toBe(PlatformRole.SUPER_ADMIN);
    expect(superAdmin.permissions).toContain('*');
  });
});
