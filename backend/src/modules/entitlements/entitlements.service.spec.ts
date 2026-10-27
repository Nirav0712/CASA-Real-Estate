import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EntitlementsService } from './entitlements.service';
import { Role } from './schemas/role.schema';
import { Package, BillingPeriod } from './schemas/package.schema';
import { PropertyView } from './schemas/property-view.schema';
import { User } from '../auth/schemas/user.schema';
import { Subscription } from '../payments/schemas/subscription.schema';
import { AuditLog } from '../admin/schemas/audit-log.schema';
import { PlatformRole, AccountType, UserRole } from '../auth/enums/auth.enums';

describe('EntitlementsService - Dynamic Pricing & Trial Audit', () => {
  let service: EntitlementsService;

  const mockRoleModel: any = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const mockPackageModel: any = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const mockPropertyViewModel: any = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockUserModel: any = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockSubscriptionModel: any = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const mockAuditLogModel: any = {
    create: jest.fn().mockResolvedValue(true),
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

  describe('1. Pricing Accuracy and Multi-Duration Rate Verification', () => {
    const casaBasicPkg = {
      _id: 'pkg-basic-001',
      slug: 'casa-basic',
      name: 'Basic Plan',
      price: 999,
      isFree: false,
      isActive: true,
      displayOrder: 1,
      targetAccountTypes: ['DEVELOPER', 'BROKER', 'AGENT', 'PROPERTY_OWNER'],
      eligibleUserTypes: ['builder', 'broker', 'agent', 'property-owner'],
      durationPrices: [
        { durationMonths: 1, amount: 999, referenceMonthlyPrice: 999, isActive: true },
        { durationMonths: 2, amount: 1999, referenceMonthlyPrice: 999, isActive: true },
        { durationMonths: 3, amount: 2999, referenceMonthlyPrice: 999, isActive: true },
        { durationMonths: 6, amount: 4999, referenceMonthlyPrice: 999, isActive: true },
        { durationMonths: 12, amount: 10499, referenceMonthlyPrice: 999, isActive: true },
      ],
      limits: { propertyListings: 10, projectListings: 5, teamMembers: 2 },
    };

    const casaAdvancedPkg = {
      _id: 'pkg-advanced-002',
      slug: 'casa-advanced',
      name: 'Advanced Plan',
      price: 1499,
      isFree: false,
      isActive: true,
      displayOrder: 2,
      targetAccountTypes: ['DEVELOPER', 'BROKER', 'AGENT', 'PROPERTY_OWNER'],
      eligibleUserTypes: ['builder', 'broker', 'agent', 'property-owner'],
      durationPrices: [
        { durationMonths: 1, amount: 1499, referenceMonthlyPrice: 1499, isActive: true },
        { durationMonths: 2, amount: 2999, referenceMonthlyPrice: 1499, isActive: true },
        { durationMonths: 3, amount: 4499, referenceMonthlyPrice: 1499, isActive: true },
        { durationMonths: 6, amount: 7999, referenceMonthlyPrice: 1499, isActive: true },
        { durationMonths: 12, amount: 14999, referenceMonthlyPrice: 1499, isActive: true },
      ],
      limits: { propertyListings: 25, projectListings: 10, teamMembers: 4 },
    };

    const casaPremiumPkg = {
      _id: 'pkg-premium-003',
      slug: 'casa-premium',
      name: 'Premium Plan',
      price: 1999,
      isFree: false,
      isActive: true,
      displayOrder: 3,
      targetAccountTypes: ['DEVELOPER', 'BROKER', 'AGENT', 'PROPERTY_OWNER'],
      eligibleUserTypes: ['builder', 'broker', 'agent', 'property-owner'],
      durationPrices: [
        { durationMonths: 1, amount: 1999, referenceMonthlyPrice: 1999, isActive: true },
        { durationMonths: 2, amount: 3999, referenceMonthlyPrice: 1999, isActive: true },
        { durationMonths: 3, amount: 5999, referenceMonthlyPrice: 1999, isActive: true },
        { durationMonths: 6, amount: 10999, referenceMonthlyPrice: 1999, isActive: true },
        { durationMonths: 12, amount: 21999, referenceMonthlyPrice: 1999, isActive: true },
      ],
      limits: { propertyListings: 50, projectListings: 15, teamMembers: 11 },
    };

    it('should compute exact authoritative multi-duration prices for Basic Plan', async () => {
      mockPackageModel.findOne.mockReturnValue({
        lean: () => ({ exec: async () => ({ freeTrialMaxSlots: 50, freeTrialClaimedSlots: 5 }) }),
      });
      mockPackageModel.find.mockReturnValue({
        sort: () => ({
          lean: () => ({ exec: async () => [casaBasicPkg] }),
        }),
      });

      // Test 1 Month: 999
      const res1 = await service.getDynamicPricingPlans('agent', 1);
      expect(res1.plans[0].price).toBe(999);
      expect(res1.plans[0].limits.propertyListings).toBe(10);
      expect(res1.plans[0].limits.projectListings).toBe(5);

      // Test 2 Months: 1,999
      const res2 = await service.getDynamicPricingPlans('agent', 2);
      expect(res2.plans[0].price).toBe(1999);

      // Test 3 Months: 2,999
      const res3 = await service.getDynamicPricingPlans('agent', 3);
      expect(res3.plans[0].price).toBe(2999);

      // Test 6 Months: 4,999
      const res6 = await service.getDynamicPricingPlans('agent', 6);
      expect(res6.plans[0].price).toBe(4999);

      // Test 12 Months: 10,499
      const res12 = await service.getDynamicPricingPlans('agent', 12);
      expect(res12.plans[0].price).toBe(10499);
    });

    it('should compute exact authoritative multi-duration prices for Advanced Plan', async () => {
      mockPackageModel.findOne.mockReturnValue({
        lean: () => ({ exec: async () => null }),
      });
      mockPackageModel.find.mockReturnValue({
        sort: () => ({
          lean: () => ({ exec: async () => [casaAdvancedPkg] }),
        }),
      });

      // 1m: 1499, 2m: 2999, 3m: 4499, 6m: 7999, 12m: 14999
      const res1 = await service.getDynamicPricingPlans('agent', 1);
      expect(res1.plans[0].price).toBe(1499);
      expect(res1.plans[0].limits.propertyListings).toBe(25);
      expect(res1.plans[0].limits.projectListings).toBe(10);

      const res2 = await service.getDynamicPricingPlans('agent', 2);
      expect(res2.plans[0].price).toBe(2999);

      const res3 = await service.getDynamicPricingPlans('agent', 3);
      expect(res3.plans[0].price).toBe(4499);

      const res6 = await service.getDynamicPricingPlans('agent', 6);
      expect(res6.plans[0].price).toBe(7999);

      const res12 = await service.getDynamicPricingPlans('agent', 12);
      expect(res12.plans[0].price).toBe(14999);
    });

    it('should compute exact authoritative multi-duration prices for Premium Plan', async () => {
      mockPackageModel.findOne.mockReturnValue({
        lean: () => ({ exec: async () => null }),
      });
      mockPackageModel.find.mockReturnValue({
        sort: () => ({
          lean: () => ({ exec: async () => [casaPremiumPkg] }),
        }),
      });

      // 1m: 1999, 2m: 3999, 3m: 5999, 6m: 10999, 12m: 21999
      const res1 = await service.getDynamicPricingPlans('agent', 1);
      expect(res1.plans[0].price).toBe(1999);
      expect(res1.plans[0].limits.propertyListings).toBe(50);
      expect(res1.plans[0].limits.projectListings).toBe(15);

      const res2 = await service.getDynamicPricingPlans('agent', 2);
      expect(res2.plans[0].price).toBe(3999);

      const res3 = await service.getDynamicPricingPlans('agent', 3);
      expect(res3.plans[0].price).toBe(5999);

      const res6 = await service.getDynamicPricingPlans('agent', 6);
      expect(res6.plans[0].price).toBe(10999);

      const res12 = await service.getDynamicPricingPlans('agent', 12);
      expect(res12.plans[0].price).toBe(21999);
    });
  });

  describe('2. User Type Filtering and Consumer Exemptions', () => {
    it('should return isConsumer: true with empty plans for Buyer/Tenant', async () => {
      const res = await service.getDynamicPricingPlans('buyer');
      expect(res.isConsumer).toBe(true);
      expect(res.plans).toEqual([]);
      expect(res.message).toContain('free');
    });

    it('should not display restricted free trial to Property Owner accounts', async () => {
      const freeTrialPkg = {
        _id: 'pkg-free-001',
        slug: 'casa-free-trial',
        name: 'Free Plan',
        price: 0,
        isFree: true,
        isActive: true,
        displayOrder: 0,
        eligibleUserTypes: ['builder', 'broker', 'agent'],
        targetAccountTypes: ['DEVELOPER', 'BROKER', 'AGENT'],
      };

      const basicPkg = {
        _id: 'pkg-basic-001',
        slug: 'casa-basic',
        name: 'Basic Plan',
        price: 999,
        isFree: false,
        isActive: true,
        displayOrder: 1,
        eligibleUserTypes: ['builder', 'broker', 'agent', 'property-owner'],
        targetAccountTypes: ['DEVELOPER', 'BROKER', 'AGENT', 'PROPERTY_OWNER'],
      };

      mockPackageModel.findOne.mockReturnValue({
        lean: () => ({ exec: async () => freeTrialPkg }),
      });
      mockPackageModel.find.mockReturnValue({
        sort: () => ({
          lean: () => ({ exec: async () => [freeTrialPkg, basicPkg] }),
        }),
      });

      const res = await service.getDynamicPricingPlans('property-owner', 1);
      const planSlugs = res.plans.map((p: any) => p.slug);
      expect(planSlugs).toContain('casa-basic');
      expect(planSlugs).not.toContain('casa-free-trial');
    });
  });

  describe('3. Admin Persistence & Startup Seeding Safety', () => {
    it('should NOT overwrite administrator-customized prices or listing limits on startup seeding', async () => {
      const adminCustomizedBasicPkg = {
        _id: 'pkg-basic-001',
        slug: 'casa-basic',
        name: 'Basic Plan (Customized)',
        price: 1199, // Admin raised price
        limits: { propertyListings: 15, projectListings: 8 }, // Admin changed limits
        eligibleUserTypes: ['builder', 'broker', 'agent'],
        recommended: false,
        displayOrder: 1,
        durationPrices: [
          { durationMonths: 1, amount: 1199, referenceMonthlyPrice: 1199, isActive: true },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      mockPackageModel.findOne.mockImplementation(({ slug }: any) => {
        if (slug === 'casa-basic') return Promise.resolve(adminCustomizedBasicPkg);
        return Promise.resolve(null);
      });
      mockPackageModel.create.mockResolvedValue(true);

      await service.seedCasaPricingPackages();

      // Ensure price and limits are preserved and not overwritten to default 999 or 10
      expect(adminCustomizedBasicPkg.price).toBe(1199);
      expect(adminCustomizedBasicPkg.limits.propertyListings).toBe(15);
      expect(adminCustomizedBasicPkg.limits.projectListings).toBe(8);
      expect(adminCustomizedBasicPkg.save).not.toHaveBeenCalled();
    });
  });

  describe('4. Free Trial Slot Limit, Duplicate Claims & Concurrency', () => {
    it('should reject claim if user is not an eligible user type (e.g. Buyer or Property Owner)', async () => {
      mockUserModel.findById.mockResolvedValue({
        _id: 'usr-buyer-001',
        role: UserRole.BUYER,
        accountType: AccountType.BUYER,
        isTrialActive: false,
        trialUsed: false,
      });

      await expect(service.claimFreeTrialSubscription('usr-buyer-001')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject claim if user already used their trial or has an active trial', async () => {
      mockUserModel.findById.mockResolvedValue({
        _id: 'usr-agent-001',
        role: UserRole.AGENT,
        accountType: AccountType.AGENT,
        isTrialActive: true,
        trialUsed: true,
      });

      await expect(service.claimFreeTrialSubscription('usr-agent-001')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject claim if all 50 slots have already been claimed', async () => {
      mockUserModel.findById.mockResolvedValue({
        _id: 'usr-agent-002',
        role: UserRole.AGENT,
        accountType: AccountType.AGENT,
        isTrialActive: false,
        trialUsed: false,
      });

      mockSubscriptionModel.findOne.mockResolvedValue(null);

      mockPackageModel.findOne.mockResolvedValue({
        _id: 'pkg-free-001',
        slug: 'casa-free-trial',
        isFree: true,
        freeTrialMaxSlots: 50,
        freeTrialClaimedSlots: 50, // All 50 slots claimed
      });

      await expect(service.claimFreeTrialSubscription('usr-agent-002')).rejects.toThrow(
        'All 50 introductory free trial slots have been claimed',
      );
    });

    it('should reject claim if company / parent broker already used trial or active subscription', async () => {
      mockUserModel.findById.mockImplementation((id: string) => {
        if (id === 'usr-emp-001') {
          return Promise.resolve({
            _id: 'usr-emp-001',
            role: UserRole.BROKER_AGENT,
            accountType: AccountType.BROKER_AGENT,
            brokerId: 'usr-company-boss',
            isTrialActive: false,
            trialUsed: false,
          });
        }
        if (id === 'usr-company-boss') {
          return Promise.resolve({
            _id: 'usr-company-boss',
            role: UserRole.BROKER,
            trialUsed: true,
            isTrialActive: false,
          });
        }
        return Promise.resolve(null);
      });

      await expect(service.claimFreeTrialSubscription('usr-emp-001')).rejects.toThrow(
        'Your company / parent agency has already utilized or claimed the introductory free trial',
      );
    });

    it('should atomically allocate a trial slot and rollback counter if subscription creation fails', async () => {
      const mockAgent = {
        _id: 'usr-agent-003',
        role: UserRole.AGENT,
        accountType: AccountType.AGENT,
        isTrialActive: false,
        trialUsed: false,
        save: jest.fn().mockResolvedValue(true),
      };

      mockUserModel.findById.mockResolvedValue(mockAgent);
      mockUserModel.findOneAndUpdate.mockResolvedValue(mockAgent);
      mockSubscriptionModel.findOne.mockResolvedValue(null);

      mockPackageModel.findOne.mockResolvedValue({
        _id: 'pkg-free-001',
        slug: 'casa-free-trial',
        isFree: true,
        freeTrialMaxSlots: 50,
        freeTrialClaimedSlots: 49,
      });

      mockPackageModel.findOneAndUpdate.mockResolvedValue({
        _id: 'pkg-free-001',
        freeTrialClaimedSlots: 50,
      });

      // Simulate database crash during subscription record creation
      mockSubscriptionModel.create.mockRejectedValue(new Error('DB connection failure during sub create'));

      await expect(service.claimFreeTrialSubscription('usr-agent-003')).rejects.toThrow(
        'DB connection failure during sub create',
      );

      // Verify slot counter was rolled back
      expect(mockPackageModel.findByIdAndUpdate).toHaveBeenCalledWith('pkg-free-001', {
        $inc: { freeTrialClaimedSlots: -1 },
      });
      // Verify user lock was rolled back
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('usr-agent-003', {
        $set: { isTrialActive: false, trialUsed: false },
      });
    });
  });

  describe('5. Trial Expiry & Entitlement Enforcement', () => {
    it('should NOT grant trial package limits to an agent whose trial has expired without an active subscription', async () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // Expired 5 days ago

      const expiredAgent = {
        _id: 'usr-agent-expired',
        role: UserRole.AGENT,
        accountType: AccountType.AGENT,
        platformRole: PlatformRole.USER,
        activePackageId: 'pkg-free-001',
        isTrialActive: true,
        trialExpiresAt: pastDate, // Expired
      };

      mockUserModel.findById.mockReturnValue({
        lean: () => ({ exec: async () => expiredAgent }),
      });
      mockRoleModel.findOne.mockReturnValue({
        lean: () => ({ exec: async () => ({ _id: 'role-agent-001', name: 'Agent', slug: 'agent', permissions: ['property:view'], limits: { propertyListings: 0 } }) }),
      });
      // No active subscription in database
      mockSubscriptionModel.findOne.mockReturnValue({
        sort: () => ({
          lean: () => ({ exec: async () => null }),
        }),
      });
      // Default package lookup returns null
      mockPackageModel.findOne.mockReturnValue({
        lean: () => ({ exec: async () => null }),
      });

      const entitlements = await service.resolveUserEntitlements(expiredAgent);

      // Verify trial is marked expired
      expect(entitlements.trial.isTrialExpired).toBe(true);
      expect(entitlements.trial.isTrialActive).toBe(false);
      // Verify listing limits are zero (cannot post paid properties)
      expect(entitlements.limits.propertyListings).toBe(0);
      expect((entitlements.limits as any).projectListings).toBe(0);
    });
  });
});
