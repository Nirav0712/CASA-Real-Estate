import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { RazorpayPaymentProvider } from './providers/razorpay.provider';
import { Payment } from './schemas/payment.schema';
import { Subscription } from './schemas/subscription.schema';
import { Property } from '../properties/schemas/property.schema';
import { User } from '../auth/schemas/user.schema';
import { AuditLog } from '../admin/schemas/audit-log.schema';
import { PaymentStatus, PaymentPurpose, SubscriptionPlan, SubscriptionStatus } from './enums/payment.enums';
import { UserRole } from '../auth/enums/auth.enums';

describe('PaymentsService (Phase 13 Payments & Monetization)', () => {
  let service: PaymentsService;
  let razorpayProvider: RazorpayPaymentProvider;

  const mockUser = {
    id: 'usr-agent-101',
    mobile: '+919876543210',
    normalizedMobile: '+919876543210',
    role: UserRole.AGENT,
    name: 'Agent Vikram',
  };

  const mockAdmin = {
    id: 'usr-admin-001',
    mobile: '+919999999999',
    normalizedMobile: '+919999999999',
    role: UserRole.ADMIN,
    name: 'Admin Boss',
  };

  const mockProperty = {
    _id: '60d5ecb8b392d5238c8f0001',
    id: 'prop-101',
    title: { en: 'Luxury 3BHK Villa' },
    isPublished: true,
    status: 'PUBLISHED',
    ownerId: 'usr-agent-101',
    advertiserId: 'usr-agent-101',
    isFeatured: false,
    save: jest.fn().mockResolvedValue(true),
  };

  const mockPaymentModel: any = {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const mockSubscriptionModel: any = {
    findOneAndUpdate: jest.fn(),
  };

  const mockPropertyModel: any = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
  };

  const mockUserModel: any = {
    findOne: jest.fn(),
  };

  const mockAuditLogModel: any = {
    create: jest.fn().mockResolvedValue(true),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'payments.razorpayKeyId') return 'rzp_test_sample_key_123';
      if (key === 'payments.razorpayKeySecret') return 'test_secret_sample_key_456';
      if (key === 'payments.razorpayWebhookSecret') return 'test_webhook_secret_789';
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        RazorpayPaymentProvider,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getModelToken(Payment.name), useValue: mockPaymentModel },
        { provide: getModelToken(Subscription.name), useValue: mockSubscriptionModel },
        { provide: getModelToken(Property.name), useValue: mockPropertyModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(AuditLog.name), useValue: mockAuditLogModel },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    razorpayProvider = module.get<RazorpayPaymentProvider>(RazorpayPaymentProvider);
  });

  describe('1. Pricing Catalog & Public Gateway Configuration', () => {
    it('should return active monetization packages', () => {
      const res = service.getPricingCatalog();
      expect(res.success).toBe(true);
      expect(res.products.length).toBeGreaterThan(0);
      const featured = res.products.find((p) => p.code === 'FEATURED_PROPERTY');
      expect(featured?.amount).toBe(1999);
      expect(featured?.currency).toBe('INR');
    });

    it('should return public key without exposing secrets', () => {
      const config = service.getPublicGatewayConfig();
      expect(config.provider).toBe('RAZORPAY');
      expect(config.keyId).toBeDefined();
      expect((config as any).keySecret).toBeUndefined();
    });
  });

  describe('2. Order Creation & Server-Side Pricing Enforcement', () => {
    it('should reject invalid purpose', async () => {
      await expect(
        service.createOrder(mockUser as any, { purpose: 'INVALID_PURPOSE' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject FEATURED_PROPERTY without referenceId (property ID)', async () => {
      await expect(
        service.createOrder(mockUser as any, { purpose: PaymentPurpose.FEATURED_PROPERTY }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject FEATURED_PROPERTY for non-existent property', async () => {
      mockPropertyModel.findOne.mockResolvedValue(null);
      await expect(
        service.createOrder(mockUser as any, {
          purpose: PaymentPurpose.FEATURED_PROPERTY,
          referenceId: 'non-existent-prop',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject FEATURED_PROPERTY if user is not property owner/advertiser', async () => {
      mockPropertyModel.findOne.mockResolvedValue({
        ...mockProperty,
        ownerId: 'different-user',
        advertiserId: 'different-user',
        createdBy: 'different-user',
      });

      await expect(
        service.createOrder(mockUser as any, {
          purpose: PaymentPurpose.FEATURED_PROPERTY,
          referenceId: 'prop-101',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject FEATURED_PROPERTY if property is not published', async () => {
      mockPropertyModel.findOne.mockResolvedValue({
        ...mockProperty,
        isPublished: false,
        status: 'DRAFT',
      });

      await expect(
        service.createOrder(mockUser as any, {
          purpose: PaymentPurpose.FEATURED_PROPERTY,
          referenceId: 'prop-101',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject FEATURED_PROPERTY if property is already actively featured with future expiry', async () => {
      mockPropertyModel.findOne.mockResolvedValue({
        ...mockProperty,
        isFeatured: true,
        featuredUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      });

      await expect(
        service.createOrder(mockUser as any, {
          purpose: PaymentPurpose.FEATURED_PROPERTY,
          referenceId: 'prop-101',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate price strictly server-side and persist order in database', async () => {
      mockPropertyModel.findOne.mockResolvedValue(mockProperty);
      mockPaymentModel.create.mockImplementation((data: any) => ({
        ...data,
        _id: 'pay-db-id-123',
      }));

      const res = await service.createOrder(mockUser as any, {
        purpose: PaymentPurpose.FEATURED_PROPERTY,
        referenceId: 'prop-101',
      });

      expect(res.success).toBe(true);
      expect(res.orderId).toContain('CASA_ORD_');
      expect(res.amount).toBe(1999); // Controlled catalog price
      expect(res.currency).toBe('INR');
      expect(mockPaymentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          amount: 1999,
          purpose: PaymentPurpose.FEATURED_PROPERTY,
          status: PaymentStatus.CREATED,
        }),
      );
      expect(mockAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PAYMENT_ORDER_CREATED' }),
      );
    });
  });

  describe('3. Signature Verification & Service Activation', () => {
    it('should reject verification if payment order is not found', async () => {
      mockPaymentModel.findOne.mockResolvedValue(null);
      await expect(
        service.verifyPayment(mockUser as any, {
          orderId: 'CASA_ORD_FAKE',
          razorpayPaymentId: 'pay_123',
          razorpaySignature: 'sig_123',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject verification if user is not payment owner', async () => {
      mockPaymentModel.findOne.mockResolvedValue({
        orderId: 'CASA_ORD_101',
        userId: 'other-user',
        status: PaymentStatus.CREATED,
      });

      await expect(
        service.verifyPayment(mockUser as any, {
          orderId: 'CASA_ORD_101',
          razorpayPaymentId: 'pay_123',
          razorpaySignature: 'sig_123',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle idempotency gracefully if payment is already PAID', async () => {
      mockPaymentModel.findOne.mockResolvedValue({
        _id: 'pay-123',
        orderId: 'CASA_ORD_101',
        userId: mockUser.id,
        amount: 1999,
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      });

      const res = await service.verifyPayment(mockUser as any, {
        orderId: 'CASA_ORD_101',
        razorpayPaymentId: 'pay_123',
        razorpaySignature: 'sig_123',
      });

      expect(res.success).toBe(true);
      expect(res.payment.status).toBe(PaymentStatus.PAID);
    });

    it('should reject invalid cryptographic signature and mark payment FAILED', async () => {
      const mockPaymentDoc = {
        _id: 'pay-123',
        orderId: 'CASA_ORD_101',
        providerOrderId: 'order_prov_101',
        userId: mockUser.id,
        status: PaymentStatus.CREATED,
        save: jest.fn().mockResolvedValue(true),
      };
      mockPaymentModel.findOne.mockResolvedValue(mockPaymentDoc);

      await expect(
        service.verifyPayment(mockUser as any, {
          orderId: 'CASA_ORD_101',
          razorpayPaymentId: 'pay_123',
          razorpaySignature: 'invalid_tampered_signature',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPaymentDoc.status).toBe(PaymentStatus.FAILED);
      expect(mockPaymentDoc.save).toHaveBeenCalled();
      expect(mockAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PAYMENT_FAILED' }),
      );
    });

    it('should verify valid signature, mark PAID, and activate FEATURED_PROPERTY service', async () => {
      const providerOrderId = 'order_prov_101';
      const providerPaymentId = 'pay_test_999';
      const validSignature = razorpayProvider.generateTestSignature(providerOrderId, providerPaymentId);

      const mockPaymentDoc = {
        _id: 'pay-123',
        orderId: 'CASA_ORD_101',
        providerOrderId,
        userId: mockUser.id,
        amount: 1999,
        currency: 'INR',
        purpose: PaymentPurpose.FEATURED_PROPERTY,
        referenceId: 'prop-101',
        status: PaymentStatus.CREATED,
        metadata: { durationDays: 30 },
        save: jest.fn().mockResolvedValue(true),
      };
      mockPaymentModel.findOne.mockResolvedValue(mockPaymentDoc);

      const propDoc: any = { ...mockProperty, save: jest.fn().mockResolvedValue(true) };
      mockPropertyModel.findOne.mockResolvedValue(propDoc);

      const res = await service.verifyPayment(mockUser as any, {
        orderId: 'CASA_ORD_101',
        razorpayPaymentId: providerPaymentId,
        razorpaySignature: validSignature,
      });

      expect(res.success).toBe(true);
      expect(mockPaymentDoc.status).toBe(PaymentStatus.PAID);
      expect(propDoc.isFeatured).toBe(true);
      expect(propDoc.featuredUntil).toBeDefined();
      expect(propDoc.save).toHaveBeenCalled();
      expect(mockAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'FEATURE_ACTIVATED' }),
      );
    });
  });

  describe('4. Webhook Ingestion & Signature Validation', () => {
    it('should reject webhook with invalid signature', async () => {
      await expect(
        service.handleWebhook('invalid_sig', JSON.stringify({ event: 'payment.captured' }), {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept valid webhook and update payment state idempotently', async () => {
      const payload = {
        event: 'payment.captured',
        payload: {
          order: { entity: { id: 'order_prov_101' } },
          payment: { entity: { id: 'pay_captured_111', order_id: 'order_prov_101' } },
        },
      };
      const rawBody = JSON.stringify(payload);
      const validSig = razorpayProvider.generateTestWebhookSignature(rawBody);

      const mockPaymentDoc = {
        _id: 'pay-123',
        orderId: 'CASA_ORD_101',
        providerOrderId: 'order_prov_101',
        userId: mockUser.id,
        purpose: PaymentPurpose.FEATURED_PROPERTY,
        referenceId: 'prop-101',
        status: PaymentStatus.CREATED,
        save: jest.fn().mockResolvedValue(true),
      };
      mockPaymentModel.findOne.mockResolvedValue(mockPaymentDoc);
      mockPropertyModel.findOne.mockResolvedValue({ ...mockProperty, save: jest.fn().mockResolvedValue(true) });

      const res = await service.handleWebhook(validSig, rawBody, payload);
      expect(res.received).toBe(true);
      expect(mockPaymentDoc.status).toBe(PaymentStatus.PAID);
    });
  });

  describe('5. Payment History & RBAC Isolation', () => {
    it('should isolate payment queries to authenticated user ID', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { _id: 'p1', orderId: 'CASA_ORD_1', amount: 1999, status: PaymentStatus.PAID },
        ]),
      };
      mockPaymentModel.find.mockReturnValue(mockQuery);
      mockPaymentModel.countDocuments.mockResolvedValue(1);

      const res = await service.getMyPayments(mockUser as any, { page: 1, limit: 10 });
      expect(res.data.length).toBe(1);
      expect(mockPaymentModel.countDocuments).toHaveBeenCalledWith(expect.objectContaining({ userId: mockUser.id }));
    });

    it('should allow Admin to view global payments and KPI metrics', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { _id: 'p1', orderId: 'CASA_ORD_1', amount: 1999, status: PaymentStatus.PAID },
        ]),
      };
      mockPaymentModel.find.mockReturnValue(mockQuery);
      mockPaymentModel.countDocuments.mockResolvedValue(1);
      mockPaymentModel.aggregate.mockResolvedValue([
        { _id: PaymentStatus.PAID, count: 1, totalAmount: 1999 },
      ]);

      const res = await service.getAdminPayments(mockAdmin as any, { page: 1, limit: 10 });
      expect(res.data.length).toBe(1);
      expect(res.metrics.totalRevenue).toBe(1999);
      expect(res.metrics.paidCount).toBe(1);
    });
  });

  describe('6. Admin Refund Operations', () => {
    it('should reject refund if caller is not an administrator', async () => {
      await expect(
        service.refundPayment('CASA_ORD_101', mockUser as any, { amount: 1999 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject refund for non-PAID transactions', async () => {
      mockPaymentModel.findOne.mockResolvedValue({
        _id: 'p1',
        orderId: 'CASA_ORD_101',
        status: PaymentStatus.CREATED,
      });

      await expect(
        service.refundPayment('CASA_ORD_101', mockAdmin as any, { amount: 1999 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should issue refund and revoke featured property status upon full refund', async () => {
      const mockPaymentDoc: any = {
        _id: 'p1',
        orderId: 'CASA_ORD_101',
        providerOrderId: 'order_prov_101',
        providerPaymentId: 'pay_999',
        userId: mockUser.id,
        amount: 1999,
        purpose: PaymentPurpose.FEATURED_PROPERTY,
        referenceId: 'prop-101',
        status: PaymentStatus.PAID,
        save: jest.fn().mockResolvedValue(true),
      };
      mockPaymentModel.findOne.mockResolvedValue(mockPaymentDoc);
      mockPropertyModel.findOneAndUpdate.mockResolvedValue(true);

      const res = await service.refundPayment('CASA_ORD_101', mockAdmin as any, {
        amount: 1999,
        reason: 'Customer cancelled service',
      });

      expect(res.success).toBe(true);
      expect(mockPaymentDoc.status).toBe(PaymentStatus.REFUNDED);
      expect(mockPaymentDoc.refundAmount).toBe(1999);
      expect(mockPropertyModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ isFeatured: false }),
      );
      expect(mockAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PAYMENT_REFUNDED' }),
      );
    });
  });

  describe('7. Feature Expiration Validation', () => {
    it('should handle expired feature automatically', async () => {
      const expiredProperty = {
        _id: 'prop-1',
        isFeatured: true,
        featuredUntil: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      };

      const isStillFeatured = await service.checkPropertyFeaturedStatus(expiredProperty);
      expect(isStillFeatured).toBe(false);
      expect(mockPropertyModel.updateOne).toHaveBeenCalledWith(
        { _id: 'prop-1' },
        { isFeatured: false },
      );
    });

    it('should keep active feature when within validity window', async () => {
      const activeProperty = {
        _id: 'prop-2',
        isFeatured: true,
        featuredUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days in future
      };

      const isStillFeatured = await service.checkPropertyFeaturedStatus(activeProperty);
      expect(isStillFeatured).toBe(true);
      expect(mockPropertyModel.updateOne).not.toHaveBeenCalled();
    });
  });
});
