import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import * as crypto from 'crypto';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { Subscription, SubscriptionDocument } from './schemas/subscription.schema';
import {
  SubscriptionRequest,
  SubscriptionRequestDocument,
  SubscriptionRequestStatus,
  SubscriptionContactMethod,
} from './schemas/subscription-request.schema';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { AuditLog, AuditLogDocument } from '../admin/schemas/audit-log.schema';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from '../engagement/schemas/notification.schema';
import { RazorpayPaymentProvider } from './providers/razorpay.provider';
import {
  PaymentStatus,
  PaymentPurpose,
  PaymentProviderType,
  SubscriptionPlan,
  SubscriptionStatus,
} from './enums/payment.enums';
import { PRICING_CATALOG, resolvePricingProduct, PricingProduct } from './config/pricing.config';
import { CreatePaymentOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import {
  CreateSubscriptionRequestDto,
  DenySubscriptionRequestDto,
  SubscriptionRequestQueryDto,
} from './dto/subscription-request.dto';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/enums/auth.enums';
import { Package, PackageDocument } from '../entitlements/schemas/package.schema';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Subscription.name) private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(SubscriptionRequest.name) private readonly subscriptionRequestModel: Model<SubscriptionRequestDocument>,
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
    @InjectModel(Package.name) private readonly packageModel: Model<PackageDocument>,
    @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
    private readonly razorpayProvider: RazorpayPaymentProvider,
  ) {}

  private isAdmin(user: AuthenticatedUser): boolean {
    return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
  }

  getPublicGatewayConfig() {
    return this.razorpayProvider.getPublicConfig();
  }

  getPricingCatalog() {
    return {
      success: true,
      products: Object.values(PRICING_CATALOG).filter((p) => p.active),
    };
  }

  /**
   * 1. Create Server-Side Payment Order
   * Calculates pricing strictly server-side and never trusts frontend amounts.
   */
  async createOrder(user: AuthenticatedUser, dto: CreatePaymentOrderDto) {
    if (!dto.purpose) {
      throw new BadRequestException('Payment purpose is required.');
    }

    let product: PricingProduct | null = null;

    if (dto.purpose === PaymentPurpose.SUBSCRIPTION) {
      const lookupCode = dto.packageId || dto.productCode || dto.referenceId;
      let pkgDoc: PackageDocument | null = null;

      if (lookupCode) {
        if (isValidObjectId(lookupCode)) {
          pkgDoc = await this.packageModel.findOne({ $or: [{ _id: lookupCode }, { slug: lookupCode }] });
        } else {
          pkgDoc = await this.packageModel.findOne({ slug: lookupCode });
        }
      }

      if (pkgDoc) {
        if (!pkgDoc.isActive) {
          throw new BadRequestException('This subscription plan is currently inactive and cannot be purchased.');
        }

        const userRole = String(user.role || '').toUpperCase();
        const userAccountType = String(user.accountType || '').toUpperCase();
        const isConsumer =
          ['BUYER', 'TENANT', 'PURCHASER'].includes(userRole) ||
          ['BUYER', 'TENANT'].includes(userAccountType);

        if (isConsumer) {
          throw new ForbiddenException('Property buyers and rental tenants do not require subscription plans.');
        }

        if (pkgDoc.targetAccountTypes && pkgDoc.targetAccountTypes.length > 0 && !pkgDoc.targetAccountTypes.includes('ALL')) {
          const isEligible = pkgDoc.targetAccountTypes.some(
            (t) =>
              t.toUpperCase() === userRole ||
              t.toUpperCase() === userAccountType ||
              (t.toUpperCase() === 'PROPERTY_OWNER' && (userRole === 'OWNER' || userAccountType === 'OWNER')) ||
              (t.toUpperCase() === 'DEVELOPER' && (userRole === 'BUILDER' || userAccountType === 'BUILDER')),
          );
          if (!isEligible) {
            throw new ForbiddenException(
              `This subscription plan is not available for ${userRole || userAccountType} accounts.`,
            );
          }
        }

        let purchaseAmount = pkgDoc.price;
        const durationMonths = Number(dto.durationMonths) || 1;
        const durationDays = durationMonths * 30;

        if (Array.isArray(pkgDoc.durationPrices) && pkgDoc.durationPrices.length > 0) {
          const matchPrice = pkgDoc.durationPrices.find(
            (dp) => Number(dp.durationMonths) === durationMonths && dp.isActive !== false,
          );
          if (matchPrice) {
            purchaseAmount = matchPrice.amount;
          } else {
            purchaseAmount = pkgDoc.price * durationMonths;
          }
        } else if (durationMonths > 1) {
          purchaseAmount = pkgDoc.price * durationMonths;
        }

        product = {
          code: pkgDoc.slug,
          purpose: PaymentPurpose.SUBSCRIPTION,
          name: `${pkgDoc.name} (${durationMonths} Mo)`,
          description: pkgDoc.description || `${pkgDoc.name} Subscription`,
          amount: purchaseAmount,
          currency: pkgDoc.currency || 'INR',
          durationDays,
          active: pkgDoc.isActive,
        };
      } else {
        product = resolvePricingProduct(dto.purpose, dto.productCode);
      }
    } else {
      product = resolvePricingProduct(dto.purpose, dto.productCode);
    }

    if (!product) {
      throw new BadRequestException(`Invalid or inactive payment product for purpose "${dto.purpose}".`);
    }

    // Purpose-specific validations
    if (dto.purpose === PaymentPurpose.FEATURED_PROPERTY) {
      if (!dto.referenceId) {
        throw new BadRequestException('Property ID (referenceId) is required to feature a property.');
      }

      const propQuery: any = isValidObjectId(dto.referenceId)
        ? { $or: [{ _id: dto.referenceId }, { id: dto.referenceId }] }
        : { id: dto.referenceId };

      const property = await this.propertyModel.findOne(propQuery);
      if (!property) {
        throw new NotFoundException(`Property with ID "${dto.referenceId}" was not found.`);
      }

      if (!property.isPublished || property.status !== 'PUBLISHED') {
        throw new BadRequestException('Only active, published properties can be upgraded to Featured.');
      }

      // Check ownership (must be owner, advertiser, or admin)
      const userIdentifiers = [user.id, user.mobile, user.normalizedMobile].filter(Boolean);
      const isOwner =
        (property.ownerId && userIdentifiers.includes(property.ownerId)) ||
        (property.advertiserId && userIdentifiers.includes(property.advertiserId)) ||
        (property.createdBy && userIdentifiers.includes(property.createdBy));

      if (!isOwner && !this.isAdmin(user)) {
        throw new ForbiddenException('You can only feature properties that you own or advertise.');
      }

      // Check if property is already actively featured with a future expiry
      if (property.isFeatured && property.featuredUntil && new Date(property.featuredUntil) > new Date()) {
        throw new BadRequestException(
          `This property is already featured until ${new Date(property.featuredUntil).toLocaleDateString()}.`,
        );
      }
    }

    // Generate internal CASA order ID
    const orderId = `CASA_ORD_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Create provider order
    const providerOrder = await this.razorpayProvider.createOrder({
      orderId,
      amount: product.amount,
      currency: product.currency,
      receipt: orderId,
      notes: {
        userId: user.id,
        userName: user.name || '',
        purpose: dto.purpose,
        referenceId: dto.referenceId || '',
        productCode: product.code,
      },
    });

    // Persist Payment record
    const payment = await this.paymentModel.create({
      orderId,
      userId: user.id,
      userName: user.name || 'myproperty User',
      userMobile: user.mobile,
      provider: PaymentProviderType.RAZORPAY,
      providerOrderId: providerOrder.providerOrderId,
      amount: product.amount,
      currency: product.currency,
      status: PaymentStatus.CREATED,
      purpose: dto.purpose,
      referenceId: dto.referenceId,
      productCode: product.code,
      productName: product.name,
      metadata: {
        ...(dto.metadata || {}),
        durationDays: product.durationDays,
      },
    });

    // Record Audit Log
    await this.auditLogModel.create({
      action: 'PAYMENT_ORDER_CREATED',
      actorUserId: user.id,
      actorName: user.name || 'User',
      actorRole: user.role,
      targetEntity: 'PAYMENT',
      targetEntityId: payment._id.toString(),
      newValue: {
        orderId,
        providerOrderId: providerOrder.providerOrderId,
        amount: product.amount,
        purpose: dto.purpose,
        referenceId: dto.referenceId,
      },
      reason: `User initiated checkout order for ${product.name}`,
      timestamp: new Date(),
    });

    this.logger.log(`🛒 Payment order created: ${orderId} (${product.amount} ${product.currency}) for ${user.id}`);

    return {
      success: true,
      orderId,
      providerOrderId: providerOrder.providerOrderId,
      amount: product.amount,
      amountInSubunits: providerOrder.amountInSubunits,
      currency: product.currency,
      keyId: providerOrder.keyId,
      product: {
        code: product.code,
        name: product.name,
        description: product.description,
        durationDays: product.durationDays,
      },
      paymentId: payment._id.toString(),
    };
  }

  /**
   * 2. Verify Payment Signature & Activate Service
   * Idempotent: repeated verification will not double-activate.
   */
  async verifyPayment(user: AuthenticatedUser, dto: VerifyPaymentDto) {
    if (!dto.orderId || !dto.razorpayPaymentId || !dto.razorpaySignature) {
      throw new BadRequestException('Incomplete payment verification payload');
    }

    const payment = await this.paymentModel.findOne({ orderId: dto.orderId });
    if (!payment) {
      throw new NotFoundException(`Payment record for order "${dto.orderId}" was not found.`);
    }

    // Ownership check
    if (payment.userId !== user.id && !this.isAdmin(user)) {
      throw new ForbiddenException('You are not authorized to verify this payment.');
    }

    // Idempotency: If already paid, return successful status directly
    if (payment.status === PaymentStatus.PAID) {
      return {
        success: true,
        message: 'Payment has already been verified and service is active.',
        payment: {
          id: payment._id.toString(),
          orderId: payment.orderId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          purpose: payment.purpose,
          referenceId: payment.referenceId,
          paidAt: payment.paidAt,
        },
      };
    }

    // Verify cryptographic signature
    const isValid = await this.razorpayProvider.verifyPayment({
      orderId: payment.orderId,
      providerOrderId: payment.providerOrderId,
      providerPaymentId: dto.razorpayPaymentId,
      providerSignature: dto.razorpaySignature,
    });

    if (!isValid) {
      payment.status = PaymentStatus.FAILED;
      payment.failedAt = new Date();
      payment.failureReason = 'Invalid payment gateway signature';
      await payment.save();

      await this.auditLogModel.create({
        action: 'PAYMENT_FAILED',
        actorUserId: user.id,
        actorName: user.name || 'User',
        actorRole: user.role,
        targetEntity: 'PAYMENT',
        targetEntityId: payment._id.toString(),
        reason: 'Payment signature validation failed',
        timestamp: new Date(),
      });

      this.logger.warn(`⚠️ Payment verification failed for order ${dto.orderId}`);
      throw new BadRequestException('Invalid payment signature. Payment could not be verified.');
    }

    // Mark PAID
    payment.status = PaymentStatus.PAID;
    payment.providerPaymentId = dto.razorpayPaymentId;
    payment.providerSignature = dto.razorpaySignature;
    payment.paidAt = new Date();
    await payment.save();

    // Activate the purchased monetization service
    await this.activateServiceForPayment(payment, user);

    // Record Audit
    await this.auditLogModel.create({
      action: 'PAYMENT_VERIFIED',
      actorUserId: user.id,
      actorName: user.name || 'User',
      actorRole: user.role,
      targetEntity: 'PAYMENT',
      targetEntityId: payment._id.toString(),
      newValue: {
        orderId: payment.orderId,
        providerPaymentId: dto.razorpayPaymentId,
        status: PaymentStatus.PAID,
        amount: payment.amount,
        paidAt: payment.paidAt,
      },
      reason: `Payment verified for ${payment.productName || payment.purpose}`,
      timestamp: new Date(),
    });

    this.logger.log(`✅ Payment verified & settled: ${payment.orderId} (${payment.amount} INR)`);

    return {
      success: true,
      message: 'Payment verified and service activated successfully!',
      payment: {
        id: payment._id.toString(),
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        purpose: payment.purpose,
        referenceId: payment.referenceId,
        productName: payment.productName,
        paidAt: payment.paidAt,
      },
    };
  }

  /**
   * Helper: Activate monetization entitlement upon verified payment
   */
  private async activateServiceForPayment(payment: PaymentDocument, actorUser?: AuthenticatedUser) {
    const durationDays = payment.metadata?.durationDays || 30;
    const now = new Date();
    const expiryDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    if (payment.purpose === PaymentPurpose.FEATURED_PROPERTY && payment.referenceId) {
      const propQuery: any = isValidObjectId(payment.referenceId)
        ? { $or: [{ _id: payment.referenceId }, { id: payment.referenceId }] }
        : { id: payment.referenceId };

      const property = await this.propertyModel.findOne(propQuery);
      if (property) {
        property.isFeatured = true;
        property.featuredAt = now;
        property.featuredUntil = expiryDate;
        property.featuredPaymentId = payment._id.toString();
        await property.save();

        await this.auditLogModel.create({
          action: 'FEATURE_ACTIVATED',
          actorUserId: payment.userId,
          actorName: actorUser?.name || payment.userName || 'System',
          actorRole: actorUser?.role || 'SYSTEM',
          targetEntity: 'PROPERTY',
          targetEntityId: property.id || property._id.toString(),
          newValue: {
            isFeatured: true,
            featuredAt: now,
            featuredUntil: expiryDate,
            paymentId: payment._id.toString(),
          },
          reason: `Property upgraded to Featured for ${durationDays} days via paid order ${payment.orderId}`,
          timestamp: now,
        });

        this.logger.log(`🌟 Property ${property.id} is now FEATURED until ${expiryDate.toISOString()}`);
      }
    } else if (payment.purpose === PaymentPurpose.SUBSCRIPTION) {
      const lookupCode = payment.productCode;
      let pkgDoc: PackageDocument | null = null;
      if (lookupCode) {
        if (isValidObjectId(lookupCode)) {
          pkgDoc = await this.packageModel.findOne({ $or: [{ _id: lookupCode }, { slug: lookupCode }] });
        } else {
          pkgDoc = await this.packageModel.findOne({ slug: lookupCode });
        }
      }

      if (pkgDoc) {
        await this.userModel.findByIdAndUpdate(payment.userId, {
          $set: {
            activePackageId: pkgDoc._id.toString(),
            isTrialActive: false,
            trialExpired: false,
          },
        });
      }

      const plan = payment.productCode === 'SUBSCRIPTION_BUSINESS'
        ? SubscriptionPlan.BUSINESS
        : SubscriptionPlan.PRO;

      const durationMonths = payment.metadata?.durationMonths || Math.max(1, Math.round(durationDays / 30));
      const userDoc = await this.userModel.findById(payment.userId).lean();
      const companyId = userDoc?.brokerId || userDoc?.parentUserId || userDoc?.agencyId || null;

      const sub = await this.subscriptionModel.findOneAndUpdate(
        { userId: payment.userId },
        {
          userId: payment.userId,
          companyId,
          packageId: pkgDoc ? pkgDoc._id.toString() : payment.metadata?.packageId,
          accountType: userDoc?.accountType,
          plan,
          status: SubscriptionStatus.ACTIVE,
          durationMonths,
          amountPaid: payment.amount,
          currency: payment.currency,
          startDate: now,
          endDate: expiryDate,
          paymentId: payment._id.toString(),
          orderId: payment.orderId,
          metadata: {
            productName: payment.productName,
            amount: payment.amount,
            packageName: pkgDoc?.name,
            packageSlug: pkgDoc?.slug,
            durationMonths,
          },
        },
        { upsert: true, new: true },
      );

      if (sub) {
        await this.userModel.findByIdAndUpdate(payment.userId, {
          activeSubscriptionId: sub._id.toString(),
        });
      }

      this.logger.log(`⭐ Subscription ${pkgDoc?.name || plan} (${durationMonths} mo) activated for user ${payment.userId} until ${expiryDate.toISOString()}`);
    }
  }

  /**
   * 3. Handle Webhook from Razorpay
   */
  async handleWebhook(signature: string, rawBody: string, eventPayload: any) {
    const isValid = this.razorpayProvider.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      this.logger.warn('⚠️ Rejected Razorpay webhook due to invalid cryptographic signature');
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = eventPayload.event;
    this.logger.log(`🔔 Razorpay webhook received: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = eventPayload.payload?.payment?.entity;
      const orderEntity = eventPayload.payload?.order?.entity;
      const providerOrderId = orderEntity?.id || paymentEntity?.order_id;
      const providerPaymentId = paymentEntity?.id;

      if (providerOrderId) {
        const payment = await this.paymentModel.findOne({ providerOrderId });
        if (payment && payment.status !== PaymentStatus.PAID) {
          payment.status = PaymentStatus.PAID;
          payment.providerPaymentId = providerPaymentId || payment.providerPaymentId;
          payment.paidAt = new Date();
          await payment.save();
          await this.activateServiceForPayment(payment);
          this.logger.log(`✅ Webhook marked payment PAID: ${payment.orderId}`);
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = eventPayload.payload?.payment?.entity;
      const providerOrderId = paymentEntity?.order_id;
      if (providerOrderId) {
        await this.paymentModel.findOneAndUpdate(
          { providerOrderId, status: { $ne: PaymentStatus.PAID } },
          {
            status: PaymentStatus.FAILED,
            failedAt: new Date(),
            failureReason: paymentEntity.error_description || 'Payment failed on gateway',
          },
        );
      }
    }

    return { received: true, event };
  }

  /**
   * 4. User Payment History (Isolated to current user)
   */
  async getMyPayments(user: AuthenticatedUser, query: PaymentQueryDto) {
    const filter: any = { userId: user.id };

    if (query.status) filter.status = query.status;
    if (query.purpose) filter.purpose = query.purpose;
    if (query.referenceId) filter.referenceId = query.referenceId;

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const [total, payments] = await Promise.all([
      this.paymentModel.countDocuments(filter),
      this.paymentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: payments.map((p: any) => ({
        id: p._id.toString(),
        orderId: p.orderId,
        provider: p.provider,
        providerOrderId: p.providerOrderId,
        providerPaymentId: p.providerPaymentId,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        purpose: p.purpose,
        referenceId: p.referenceId,
        productCode: p.productCode,
        productName: p.productName,
        metadata: p.metadata,
        paidAt: p.paidAt,
        failedAt: p.failedAt,
        refundedAt: p.refundedAt,
        createdAt: p.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * 5. Get Payment by ID
   */
  async getPaymentById(id: string, user: AuthenticatedUser) {
    const query: any = isValidObjectId(id)
      ? { $or: [{ _id: id }, { orderId: id }] }
      : { orderId: id };

    const payment = await this.paymentModel.findOne(query).lean();
    if (!payment) {
      throw new NotFoundException(`Payment with ID "${id}" was not found.`);
    }

    if (payment.userId !== user.id && !this.isAdmin(user)) {
      throw new ForbiddenException('You do not have permission to view this payment.');
    }

    return {
      id: payment._id.toString(),
      orderId: payment.orderId,
      userId: payment.userId,
      userName: payment.userName,
      provider: payment.provider,
      providerOrderId: payment.providerOrderId,
      providerPaymentId: payment.providerPaymentId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      purpose: payment.purpose,
      referenceId: payment.referenceId,
      productCode: payment.productCode,
      productName: payment.productName,
      metadata: payment.metadata,
      paidAt: payment.paidAt,
      failedAt: payment.failedAt,
      refundedAt: payment.refundedAt,
      refundAmount: payment.refundAmount,
      refundReason: payment.refundReason,
      failureReason: payment.failureReason,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  /**
   * 6. Admin Payment Management (Global overview with filters & metrics)
   */
  async getAdminPayments(user: AuthenticatedUser, query: PaymentQueryDto) {
    if (!this.isAdmin(user)) {
      throw new ForbiddenException('Administrator permissions required');
    }

    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.purpose) filter.purpose = query.purpose;
    if (query.userId) filter.userId = query.userId;
    if (query.referenceId) filter.referenceId = query.referenceId;

    if (query.q && query.q.trim()) {
      const regex = new RegExp(query.q.trim(), 'i');
      filter.$or = [
        { orderId: regex },
        { providerOrderId: regex },
        { providerPaymentId: regex },
        { userName: regex },
        { userMobile: regex },
        { referenceId: regex },
      ];
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, payments, summary] = await Promise.all([
      this.paymentModel.countDocuments(filter),
      this.paymentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.paymentModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    // Metrics summary calculation
    const metrics = {
      totalRevenue: 0,
      paidCount: 0,
      pendingCount: 0,
      failedCount: 0,
      refundedCount: 0,
    };

    summary.forEach((s) => {
      if (s._id === PaymentStatus.PAID) {
        metrics.totalRevenue += s.totalAmount || 0;
        metrics.paidCount += s.count;
      } else if (s._id === PaymentStatus.CREATED || s._id === PaymentStatus.PENDING) {
        metrics.pendingCount += s.count;
      } else if (s._id === PaymentStatus.FAILED) {
        metrics.failedCount += s.count;
      } else if (s._id === PaymentStatus.REFUNDED) {
        metrics.refundedCount += s.count;
      }
    });

    return {
      data: payments.map((p: any) => ({
        id: p._id.toString(),
        orderId: p.orderId,
        userId: p.userId,
        userName: p.userName || 'User',
        userMobile: p.userMobile,
        provider: p.provider,
        providerOrderId: p.providerOrderId,
        providerPaymentId: p.providerPaymentId,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        purpose: p.purpose,
        referenceId: p.referenceId,
        productCode: p.productCode,
        productName: p.productName,
        metadata: p.metadata,
        paidAt: p.paidAt,
        failedAt: p.failedAt,
        refundedAt: p.refundedAt,
        refundAmount: p.refundAmount,
        refundReason: p.refundReason,
        createdAt: p.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      metrics,
    };
  }

  /**
   * 7. Refund Payment (Admin Only)
   */
  async refundPayment(id: string, user: AuthenticatedUser, dto: RefundPaymentDto) {
    if (!this.isAdmin(user)) {
      throw new ForbiddenException('Only Administrators can issue refunds.');
    }

    const query: any = isValidObjectId(id)
      ? { $or: [{ _id: id }, { orderId: id }] }
      : { orderId: id };

    const payment = await this.paymentModel.findOne(query);
    if (!payment) {
      throw new NotFoundException(`Payment record "${id}" was not found.`);
    }

    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException(`Cannot refund transaction with status "${payment.status}". Only PAID transactions can be refunded.`);
    }

    const refundAmount = dto.amount || payment.amount;
    if (refundAmount > payment.amount) {
      throw new BadRequestException(`Refund amount (₹${refundAmount}) cannot exceed transaction amount (₹${payment.amount}).`);
    }

    // Call provider refund
    const refundResult = await this.razorpayProvider.refundPayment({
      providerPaymentId: payment.providerPaymentId || payment.providerOrderId,
      amount: refundAmount,
      reason: dto.reason,
    });

    const prevStatus = payment.status;
    payment.status = refundAmount === payment.amount ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;
    payment.refundedAt = new Date();
    payment.refundAmount = (payment.refundAmount || 0) + refundAmount;
    payment.refundReason = dto.reason || 'Admin initiated refund';
    await payment.save();

    // If property was featured, revoke featured status upon full refund
    if (payment.purpose === PaymentPurpose.FEATURED_PROPERTY && payment.referenceId && payment.status === PaymentStatus.REFUNDED) {
      const propQuery: any = isValidObjectId(payment.referenceId)
        ? { $or: [{ _id: payment.referenceId }, { id: payment.referenceId }] }
        : { id: payment.referenceId };

      await this.propertyModel.findOneAndUpdate(propQuery, {
        isFeatured: false,
        featuredUntil: new Date(),
      });
    }

    // Audit Log
    await this.auditLogModel.create({
      action: 'PAYMENT_REFUNDED',
      actorUserId: user.id,
      actorName: user.name || 'Admin',
      actorRole: user.role,
      targetUserId: payment.userId,
      targetEntity: 'PAYMENT',
      targetEntityId: payment._id.toString(),
      previousValue: { status: prevStatus, amount: payment.amount },
      newValue: {
        status: payment.status,
        refundAmount,
        providerRefundId: refundResult.providerRefundId,
      },
      reason: dto.reason || 'Refund issued by administrator',
      timestamp: new Date(),
    });

    this.logger.log(`💸 Refund processed for order ${payment.orderId}: ₹${refundAmount}`);

    return {
      success: true,
      message: `Refund of ₹${refundAmount} processed successfully.`,
      payment: {
        id: payment._id.toString(),
        orderId: payment.orderId,
        status: payment.status,
        refundAmount: payment.refundAmount,
        refundedAt: payment.refundedAt,
      },
    };
  }

  /**
   * Helper: Check if a property featured status is expired
   */
  async checkPropertyFeaturedStatus(property: PropertyDocument | any): Promise<boolean> {
    if (!property.isFeatured) return false;
    if (!property.featuredUntil) return property.isFeatured;

    const isExpired = new Date(property.featuredUntil) < new Date();
    if (isExpired && property.isFeatured) {
      property.isFeatured = false;
      await this.propertyModel.updateOne({ _id: property._id }, { isFeatured: false });
      return false;
    }
    return property.isFeatured;
  }

  // ==========================================
  // SUBSCRIPTION APPROVAL REQUESTS WORKFLOW
  // ==========================================

  /**
   * Submit or retrieve an existing pending subscription request
   */
  async createSubscriptionRequest(user: AuthenticatedUser, dto: CreateSubscriptionRequestDto) {
    if (!user || !user.id) {
      throw new ForbiddenException('User authentication required to submit subscription request.');
    }

    if (!dto.packageId || !isValidObjectId(dto.packageId)) {
      throw new BadRequestException('Valid pricing package ID is required.');
    }

    const pkg = await this.packageModel.findById(dto.packageId);
    if (!pkg) {
      throw new NotFoundException('Selected subscription plan not found.');
    }

    const contactMethod = dto.contactMethod || SubscriptionContactMethod.WHATSAPP;

    // Check if user already has an active PENDING request for this package to avoid duplicate records
    const existing = await this.subscriptionRequestModel.findOne({
      userId: new Types.ObjectId(user.id),
      packageId: pkg._id,
      status: SubscriptionRequestStatus.PENDING,
    });

    if (existing) {
      existing.contactMethod = contactMethod;
      existing.updatedAt = new Date();
      await existing.save();

      return {
        success: true,
        message: 'Existing pending subscription request retrieved and refreshed.',
        request: {
          id: existing._id.toString(),
          requestReference: existing.requestReference,
          packageId: existing.packageId.toString(),
          planName: existing.planName,
          planPrice: existing.planPrice,
          billingPeriod: existing.billingPeriod,
          planFeatures: existing.planFeatures,
          contactMethod: existing.contactMethod,
          status: existing.status,
          createdAt: existing.createdAt,
        },
      };
    }

    // Generate unique human-readable request reference: SUB-REQ-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const requestReference = `SUB-REQ-${dateStr}-${randSuffix}`;

    const newRequest = await this.subscriptionRequestModel.create({
      requestReference,
      userId: new Types.ObjectId(user.id),
      userName: user.name || 'Marketplace User',
      userMobile: user.mobile || user.normalizedMobile || '',
      userEmail: user.email,
      packageId: pkg._id,
      planName: pkg.name,
      planPrice: pkg.price,
      billingPeriod: pkg.billingPeriod || 'MONTHLY',
      planFeatures: pkg.features || [],
      contactMethod,
      status: SubscriptionRequestStatus.PENDING,
      metadata: {
        packageSlug: pkg.slug,
        targetAccountTypes: pkg.targetAccountTypes,
        userRole: user.role,
        userAccountType: user.accountType,
      },
    });

    this.logger.log(`📥 Subscription request created: ${requestReference} by user ${user.name} for plan ${pkg.name}`);

    return {
      success: true,
      message: 'Subscription request recorded successfully.',
      request: {
        id: newRequest._id.toString(),
        requestReference: newRequest.requestReference,
        packageId: newRequest.packageId.toString(),
        planName: newRequest.planName,
        planPrice: newRequest.planPrice,
        billingPeriod: newRequest.billingPeriod,
        planFeatures: newRequest.planFeatures,
        contactMethod: newRequest.contactMethod,
        status: newRequest.status,
        createdAt: newRequest.createdAt,
      },
    };
  }

  /**
   * Get user's own subscription requests
   */
  async getMySubscriptionRequests(user: AuthenticatedUser) {
    if (!user || !user.id) {
      throw new ForbiddenException('User authentication required.');
    }

    const requests = await this.subscriptionRequestModel
      .find({ userId: new Types.ObjectId(user.id) })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .exec();

    return {
      success: true,
      data: requests.map((r) => ({
        id: r._id.toString(),
        requestReference: r.requestReference,
        packageId: r.packageId?.toString(),
        planName: r.planName,
        planPrice: r.planPrice,
        billingPeriod: r.billingPeriod,
        planFeatures: r.planFeatures,
        contactMethod: r.contactMethod,
        status: r.status,
        denialReason: r.denialReason,
        reviewedAt: r.reviewedAt,
        createdAt: r.createdAt,
      })),
    };
  }

  /**
   * List global subscription requests for Super Admin / Admin
   */
  async getAdminSubscriptionRequests(user: AuthenticatedUser, query: SubscriptionRequestQueryDto) {
    if (!this.isAdmin(user)) {
      throw new ForbiddenException('Super Admin or Admin privileges required.');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status.toUpperCase();
    }

    if (query.q && query.q.trim()) {
      const qRegex = new RegExp(query.q.trim(), 'i');
      filter.$or = [
        { requestReference: qRegex },
        { userName: qRegex },
        { userMobile: qRegex },
        { userEmail: qRegex },
        { planName: qRegex },
      ];
    }

    const [requests, total, totalPending, totalApproved, totalDenied] = await Promise.all([
      this.subscriptionRequestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.subscriptionRequestModel.countDocuments(filter),
      this.subscriptionRequestModel.countDocuments({ status: SubscriptionRequestStatus.PENDING }),
      this.subscriptionRequestModel.countDocuments({ status: SubscriptionRequestStatus.APPROVED }),
      this.subscriptionRequestModel.countDocuments({ status: SubscriptionRequestStatus.DENIED }),
    ]);

    return {
      success: true,
      data: requests.map((r) => ({
        id: r._id.toString(),
        requestReference: r.requestReference,
        userId: r.userId?.toString(),
        userName: r.userName,
        userMobile: r.userMobile,
        userEmail: r.userEmail,
        packageId: r.packageId?.toString(),
        planName: r.planName,
        planPrice: r.planPrice,
        billingPeriod: r.billingPeriod,
        planFeatures: r.planFeatures,
        contactMethod: r.contactMethod,
        status: r.status,
        denialReason: r.denialReason,
        reviewedByName: r.reviewedByName,
        reviewedAt: r.reviewedAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      metrics: {
        totalRequests: totalPending + totalApproved + totalDenied,
        pending: totalPending,
        approved: totalApproved,
        denied: totalDenied,
      },
    };
  }

  /**
   * Super Admin approves subscription request and activates user entitlements immediately
   */
  async approveSubscriptionRequest(id: string, adminUser: AuthenticatedUser) {
    if (!this.isAdmin(adminUser)) {
      throw new ForbiddenException('Super Admin or Admin privileges required.');
    }

    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid request ID format.');
    }

    const request = await this.subscriptionRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException('Subscription request not found.');
    }

    if (request.status !== SubscriptionRequestStatus.PENDING) {
      throw new BadRequestException(`Subscription request has already been processed (Current status: ${request.status}).`);
    }

    const pkg = await this.packageModel.findById(request.packageId);
    if (!pkg) {
      throw new NotFoundException('Target subscription plan package not found.');
    }

    const targetUser = await this.userModel.findById(request.userId);
    if (!targetUser) {
      throw new NotFoundException('User associated with this request was not found.');
    }

    const now = new Date();
    let durationDays = 30; // standard monthly
    const billingPeriodUpper = String(pkg.billingPeriod || '').toUpperCase();
    if (billingPeriodUpper.includes('ANNUAL') || billingPeriodUpper.includes('YEAR')) {
      durationDays = 365;
    } else if (billingPeriodUpper.includes('QUARTER')) {
      durationDays = 90;
    } else if (billingPeriodUpper.includes('HALF')) {
      durationDays = 180;
    }
    const expiryDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // 1. Activate Subscription on User Model
    targetUser.activePackageId = pkg._id.toString();
    targetUser.isTrialActive = false;
    targetUser.trialExpired = false;
    await targetUser.save();

    // 2. Upsert Subscription collection record (reusing existing schema)
    await this.subscriptionModel.findOneAndUpdate(
      { userId: targetUser._id.toString() },
      {
        userId: targetUser._id.toString(),
        plan: pkg.name || SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
        startDate: now,
        endDate: expiryDate,
        packageId: pkg._id.toString(),
        metadata: {
          requestReference: request.requestReference,
          approvedByAdminId: adminUser.id,
          approvedByAdminName: adminUser.name,
          manualSalesApproval: true,
          packageName: pkg.name,
          packageSlug: pkg.slug,
          amount: pkg.price,
        },
      },
      { upsert: true, new: true },
    );

    // 3. Mark request as APPROVED
    request.status = SubscriptionRequestStatus.APPROVED;
    request.reviewedBy = new Types.ObjectId(adminUser.id);
    request.reviewedByName = adminUser.name || 'Super Admin';
    request.reviewedAt = now;
    await request.save();

    // 4. Log in Audit Log
    try {
      await this.auditLogModel.create({
        userId: new Types.ObjectId(adminUser.id),
        userName: adminUser.name || 'Super Admin',
        action: 'SUBSCRIPTION_REQUEST_APPROVED',
        entity: 'SubscriptionRequest',
        entityId: request._id.toString(),
        details: {
          requestReference: request.requestReference,
          targetUserId: targetUser._id.toString(),
          targetUserName: targetUser.name,
          targetUserMobile: targetUser.mobile,
          planName: pkg.name,
          planPrice: pkg.price,
          durationDays,
          expiryDate,
        },
        timestamp: now,
      });
    } catch (auditErr: any) {
      this.logger.warn(`Failed to create audit log: ${auditErr.message}`);
    }

    // 5. In-App Notification to User
    try {
      await this.notificationModel.create({
        recipientId: targetUser._id,
        type: NotificationType.PAYMENT_SUCCESS,
        title: 'Subscription Activated',
        message: `Your ${pkg.name} subscription has been activated successfully!`,
        data: {
          packageId: pkg._id.toString(),
          planName: pkg.name,
          requestReference: request.requestReference,
          expiryDate,
        },
        isRead: false,
      });
    } catch (notifErr: any) {
      this.logger.warn(`Failed to dispatch in-app notification: ${notifErr.message}`);
    }

    this.logger.log(`✅ Subscription request ${request.requestReference} APPROVED by ${adminUser.name} for user ${targetUser.name}`);

    return {
      success: true,
      message: `Subscription request approved and ${pkg.name} activated successfully for ${targetUser.name}.`,
      request: {
        id: request._id.toString(),
        requestReference: request.requestReference,
        status: request.status,
        reviewedByName: request.reviewedByName,
        reviewedAt: request.reviewedAt,
      },
      subscription: {
        planName: pkg.name,
        activePackageId: pkg._id.toString(),
        startDate: now,
        endDate: expiryDate,
      },
    };
  }

  /**
   * Super Admin denies subscription request with reason
   */
  async denySubscriptionRequest(id: string, adminUser: AuthenticatedUser, dto: DenySubscriptionRequestDto) {
    if (!this.isAdmin(adminUser)) {
      throw new ForbiddenException('Super Admin or Admin privileges required.');
    }

    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid request ID format.');
    }

    const request = await this.subscriptionRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException('Subscription request not found.');
    }

    if (request.status !== SubscriptionRequestStatus.PENDING) {
      throw new BadRequestException(`Subscription request has already been processed (Current status: ${request.status}).`);
    }

    const now = new Date();
    const reason = dto?.reason?.trim() || 'Declined by administrator.';

    request.status = SubscriptionRequestStatus.DENIED;
    request.denialReason = reason;
    request.reviewedBy = new Types.ObjectId(adminUser.id);
    request.reviewedByName = adminUser.name || 'Super Admin';
    request.reviewedAt = now;
    await request.save();

    // Log in Audit Log
    try {
      await this.auditLogModel.create({
        userId: new Types.ObjectId(adminUser.id),
        userName: adminUser.name || 'Super Admin',
        action: 'SUBSCRIPTION_REQUEST_DENIED',
        entity: 'SubscriptionRequest',
        entityId: request._id.toString(),
        details: {
          requestReference: request.requestReference,
          targetUserId: request.userId.toString(),
          planName: request.planName,
          reason,
        },
        timestamp: now,
      });
    } catch (auditErr: any) {
      this.logger.warn(`Failed to create audit log: ${auditErr.message}`);
    }

    // In-App Notification to User
    try {
      await this.notificationModel.create({
        recipientId: request.userId,
        type: NotificationType.SUBSCRIPTION_EXPIRING,
        title: 'Subscription Request Declined',
        message: `Your subscription request for ${request.planName} was not approved: ${reason}`,
        data: {
          requestReference: request.requestReference,
          planName: request.planName,
          denialReason: reason,
        },
        isRead: false,
      });
    } catch (notifErr: any) {
      this.logger.warn(`Failed to dispatch in-app notification: ${notifErr.message}`);
    }

    this.logger.log(`❌ Subscription request ${request.requestReference} DENIED by ${adminUser.name}`);

    return {
      success: true,
      message: `Subscription request ${request.requestReference} denied successfully.`,
      request: {
        id: request._id.toString(),
        requestReference: request.requestReference,
        status: request.status,
        denialReason: request.denialReason,
        reviewedByName: request.reviewedByName,
        reviewedAt: request.reviewedAt,
      },
    };
  }
}
