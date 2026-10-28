import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { Category, CategoryDocument } from '../properties/schemas/category.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { RefreshSession, RefreshSessionDocument } from '../auth/schemas/refresh-session.schema';
import { AgentProfile, AgentProfileDocument } from '../agents/schemas/agent-profile.schema';
import {
  AgentVerificationDocument,
  AgentVerificationDocumentDocument,
} from '../agents/schemas/agent-document.schema';
import { Role, RoleDocument } from '../entitlements/schemas/role.schema';
import { Lead, LeadDocument } from '../leads/schemas/lead.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';
import { PaymentStatus } from '../payments/enums/payment.enums';
import { SystemSetting, SystemSettingDocument } from './schemas/system-setting.schema';
import { Package, PackageDocument } from '../entitlements/schemas/package.schema';
import { Subscription, SubscriptionDocument } from '../payments/schemas/subscription.schema';
import {
  FeaturedPropertyRequest,
  FeaturedPropertyRequestDocument,
  FeaturedRequestStatus,
} from '../properties/schemas/featured-property-request.schema';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateAdminUserDto } from './dto/update-user.dto';
import { AdminAuditQueryDto } from './dto/admin-audit-query.dto';
import {
  PlatformRole,
  AccountType,
  UserRole,
  AccountStatus,
  normalizeUserRoleModel,
} from '../auth/enums/auth.enums';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { AuthService } from '../auth/auth.service';
import { hashPassword } from '../auth/utils/password.util';
import { WhatsAppService } from '../leads/whatsapp.service';
import { MailService } from '../auth/services/mail.service';

const INITIAL_PENDING_FIXTURES = [
  {
    id: 'mod-101',
    referenceId: 'CASA-MOD-101',
    slug: '4-bhk-luxury-independent-villa-gomti-nagar-ext',
    title: {
      en: '4 BHK Luxury Independent Villa in Gomti Nagar Ext.',
      hi: 'गोमती नगर विस्तार में 4 बीएचके लक्जरी स्वतंत्र विला',
      ar: 'فيلا فاخرة مستقلة 4 غرف نوم في جومتي ناجار',
      ur: 'گومتی نگر ایکسٹینشن میں 4 بی ایچ کے لگژری آزاد ولا',
    },
    description: {
      en: 'Spacious independent villa with private garden, modern fittings, and covered parking in prime Gomti Nagar Extension locality.',
      hi: 'गोमती नगर विस्तार में आधुनिक सुविधाओं और निजी गार्डन के साथ विशाल स्वतंत्र विला।',
    },
    category: 'House / Home',
    listingType: 'SALE',
    price: {
      amount: 18500000,
      currency: 'INR',
      priceUnit: 'TOTAL',
      isNegotiable: true,
    },
    location: {
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      city: 'Lucknow',
      locality: 'Gomti Nagar Extension',
      landmark: 'Near Cricket Stadium',
      pincode: '226010',
      coordinates: [80.9984, 26.8526],
    },
    specs: {
      bedrooms: 4,
      bathrooms: 4,
      area: 3000,
      areaUnit: 'SQ_FT',
      carpetAreaSqFt: 3000,
      constructionStatus: 'READY_TO_MOVE',
      furnishing: 'SEMI_FURNISHED',
      facing: 'East',
      parking: '2 Covered',
      propertyAge: '0-1 years',
    },
    amenities: ['Gated Security', 'Private Garden', 'Power Backup', 'Water Storage'],
    media: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      coverImage:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      ],
      videos: [],
    },
    advertiser: {
      name: 'Rajesh Verma (Broker)',
      phone: '+919925843599',
      isVerifiedAgent: true,
      role: 'VERIFIED_AGENT',
      agencyName: 'Verma Real Estate',
    },
    status: 'PENDING_REVIEW',
    isPublished: false,
    moderation: {
      riskScore: 'LOW',
      reasonsFlagged: [],
    },
    isFeatured: false,
    ownerId: 'usr-agent-verma',
  },
  {
    id: 'mod-102',
    referenceId: 'CASA-MOD-102',
    slug: 'commercial-retail-shop-hazratganj-main-road',
    title: {
      en: 'Commercial Retail Shop on Hazratganj Main Road',
      hi: 'हज़रतगंज मुख्य मार्ग पर वाणिज्यिक खुदरा दुकान',
      ar: 'محل تجاري في شارع حضرة غانج الرئيسي',
      ur: 'حضرت گنج مین روڈ پر تجارتی ریٹیل دکان',
    },
    description: {
      en: 'High footfall retail storefront with full glass facade situated in heart of Hazratganj market.',
      hi: 'हज़रतगंज बाजार के केंद्र में पूर्ण ग्लास अग्रभाग के साथ उच्च फुटफॉल खुदरा स्टोरफ्रंट।',
    },
    category: 'Shop',
    listingType: 'RENT',
    price: {
      amount: 65000,
      currency: 'INR',
      priceUnit: 'PER_MONTH',
      isNegotiable: false,
      maintenance: 3000,
      securityDeposit: 195000,
    },
    location: {
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      city: 'Lucknow',
      locality: 'Hazratganj',
      landmark: 'Main Market Square',
      pincode: '226001',
      coordinates: [80.9462, 26.8467],
    },
    specs: {
      area: 450,
      areaUnit: 'SQ_FT',
      carpetAreaSqFt: 450,
      constructionStatus: 'READY_TO_MOVE',
      furnishing: 'FURNISHED',
      totalFloors: 4,
      floorNumber: 'Ground Floor',
    },
    amenities: ['Main Road Facing', '24/7 Power Backup', 'CCTV Security'],
    media: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
      coverImage:
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
      ],
      videos: [],
    },
    advertiser: {
      name: 'Alok Dixit (Owner)',
      phone: '+919876543210',
      isVerifiedAgent: false,
      role: 'PROPERTY_OWNER',
    },
    status: 'PENDING_REVIEW',
    isPublished: false,
    moderation: {
      riskScore: 'LOW',
      reasonsFlagged: [],
    },
    isFeatured: false,
    ownerId: 'usr-owner-dixit',
  },
  {
    id: 'mod-103',
    referenceId: 'CASA-MOD-103',
    slug: 'bank-auction-residential-plot-gated-colony',
    title: {
      en: 'Bank Auction Residential Plot in Gated Colony (Litigated Disclosed)',
      hi: 'गेटेड कॉलोनी में बैंक नीलामी आवासीय भूखंड',
      ar: 'قطعة أرض سكنية بمزاد بنكي في مجمع سكني مسور',
      ur: 'گیٹڈ کالونی میں بینک نیلامی کا رہائشی پلاٹ',
    },
    description: {
      en: 'SARFAESI bank auction disclosed plot in premium approved layout with all legal title documents available.',
      hi: 'प्रीमियम स्वीकृत लेआउट में सभी कानूनी शीर्षक दस्तावेजों के साथ बैंक नीलामी भूखंड।',
    },
    category: 'Litigated',
    listingType: 'SALE',
    price: {
      amount: 4200000,
      currency: 'INR',
      priceUnit: 'TOTAL',
      isNegotiable: true,
    },
    location: {
      state: 'Uttar Pradesh',
      district: 'Kanpur',
      city: 'Kanpur',
      locality: 'Civil Lines',
      landmark: 'Near Court Compound',
      pincode: '208001',
      coordinates: [80.3319, 26.4499],
    },
    specs: {
      area: 2160,
      areaUnit: 'SQ_FT',
      carpetAreaSqFt: 2160,
      constructionStatus: 'RESALE',
    },
    amenities: ['Clear Title Notice', 'Approved Layout', 'Road Connected'],
    media: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
      coverImage:
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
      ],
      videos: [],
    },
    advertiser: {
      name: 'Apex Asset Resolvers',
      phone: '+919839012345',
      isVerifiedAgent: true,
      role: 'AGENT',
      agencyName: 'Apex Asset Resolvers LLP',
    },
    status: 'PENDING_REVIEW',
    isPublished: false,
    moderation: {
      riskScore: 'HIGH',
      reasonsFlagged: [
        'Category requires court decree copy review',
        'High price deviation inspection',
      ],
    },
    isFeatured: false,
    ownerId: 'usr-agent-apex',
  },
];

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
    @InjectModel(RefreshSession.name) private readonly refreshSessionModel: Model<RefreshSessionDocument>,
    @InjectModel(AgentProfile.name) private readonly agentProfileModel: Model<AgentProfileDocument>,
    @InjectModel(AgentVerificationDocument.name) private readonly agentDocumentModel: Model<AgentVerificationDocumentDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(Lead.name) private readonly leadModel: Model<LeadDocument>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(SystemSetting.name) private readonly systemSettingModel: Model<SystemSettingDocument>,
    @InjectModel(Package.name) private readonly packageModel: Model<PackageDocument>,
    @InjectModel(Subscription.name) private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(FeaturedPropertyRequest.name)
    private readonly featuredRequestModel: Model<FeaturedPropertyRequestDocument>,
    private readonly authService: AuthService,
    private readonly whatsappService: WhatsAppService,
    @Optional() private readonly mailService?: MailService,
  ) {}

  async onModuleInit() {
    await this.ensureInitialPendingFixtures();
  }

  private async ensureInitialPendingFixtures() {
    try {
      // Never auto-inject mock fixtures into production unless explicitly enabled
      if (process.env.NODE_ENV !== 'test' && process.env.SEED_DEV_FIXTURES !== 'true') {
        return;
      }

      const pendingCount = await this.propertyModel.countDocuments({
        status: { $in: ['PENDING_REVIEW', 'PENDING_APPROVAL'] },
      });

      if (pendingCount === 0) {
        this.logger.log('Seeding initial pending moderation fixtures for test/dev environment...');
        for (const fixture of INITIAL_PENDING_FIXTURES) {
          const exists = await this.propertyModel.findOne({ id: fixture.id });
          if (!exists) {
            await this.propertyModel.create(fixture);
            this.logger.log(`Created MongoDB moderation fixture: ${fixture.id} (${fixture.title.en})`);
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Moderation queue initialization note: ${err?.message}`);
    }
  }

  mapPropertyToAdminItem(doc: any) {
    const raw = doc.toObject ? doc.toObject() : doc;
    const titleStr = typeof raw.title === 'string' ? raw.title : (raw.title?.en || 'Untitled');
    const priceNum = typeof raw.price === 'number' ? raw.price : (raw.price?.amount || 0);
    const locationStr =
      typeof raw.location === 'string'
        ? raw.location
        : `${raw.location?.locality || raw.location?.city || ''}, ${raw.location?.state || 'Uttar Pradesh'}`;
    const advertiserName =
      typeof raw.advertiser === 'string'
        ? raw.advertiser
        : (raw.advertiser?.name || 'Advertiser');
    const advertiserRole =
      (typeof raw.advertiser === 'object' && raw.advertiser?.role) ||
      (raw.advertiser?.isVerifiedAgent ? 'VERIFIED_AGENT' : 'PROPERTY_OWNER');

    let approvalStatus = 'PENDING';
    if (raw.status === 'PUBLISHED' || raw.status === 'APPROVED' || raw.status === 'ACTIVE') {
      approvalStatus = 'APPROVED';
    } else if (raw.status === 'REJECTED') {
      approvalStatus = 'REJECTED';
    }

    return {
      id: raw.id || raw._id?.toString(),
      _id: raw._id?.toString(),
      referenceId: raw.referenceId || raw.id,
      slug: raw.slug,
      ownerId: raw.ownerId,
      advertiserId: raw.advertiserId,
      createdBy: raw.createdBy,
      updatedBy: raw.updatedBy,
      title: titleStr,
      rawTitle: raw.title,
      description: typeof raw.description === 'string' ? raw.description : (raw.description?.en || ''),
      rawDescription: raw.description,
      category: raw.category,
      listingType: raw.listingType,
      price: priceNum,
      rawPrice: raw.price,
      location: locationStr,
      rawLocation: raw.location,
      advertiserName,
      advertiserRole,
      advertiserPhone: (typeof raw.advertiser === 'object' && raw.advertiser?.phone) || '',
      advertiser: raw.advertiser,
      contactNumbers:
        raw.contactNumbers ||
        raw.advertiser?.contactNumbers ||
        (raw.advertiser?.phone
          ? [
              {
                countryCode: raw.advertiser.phone.startsWith('+') ? raw.advertiser.phone.slice(0, 3) : '+91',
                number: raw.advertiser.phone.replace(/^\+\d{1,3}/, '').trim(),
                isPrimary: true,
              },
            ]
          : []),
      status: raw.status,
      isPublished: !!raw.isPublished,
      isSuspendedByAccount: Boolean(raw.isSuspendedByAccount),
      publishedAt: raw.publishedAt,
      unpublishedAt: raw.unpublishedAt,
      archivedAt: raw.archivedAt,
      approvalStatus,
      submittedAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
      createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : new Date().toISOString(),
      riskScore: raw.moderation?.riskScore || 'LOW',
      reasonsFlagged: raw.moderation?.reasonsFlagged || [],
      rejectionReason: raw.moderation?.rejectionReason,
      adminRemark: raw.moderation?.adminRemark || raw.moderation?.moderationRemarks,
      moderation: raw.moderation || {},
      media: raw.media,
      isFeatured: !!raw.isFeatured,
      subcategory: raw.subcategory,
      specs: raw.specs,
      amenities: raw.amenities,
      rera: raw.rera,
      reraNumber: raw.reraNumber || raw.rera?.reraNumber || raw.advertiser?.reraNumber || undefined,
      structureType: raw.structureType || 'INDEPENDENT',
      isParentProject: Boolean(raw.isParentProject),
      isChildUnit: Boolean(raw.isChildUnit),
      parentPropertyId: raw.parentPropertyId,
      parentSlug: raw.parentSlug,
      projectDetails: raw.projectDetails,
      unitDetails: raw.unitDetails,
      units: raw.units || [],
      totalUnits: raw.totalUnits || (raw.units ? raw.units.length : 0),
      availableUnits: raw.availableUnits !== undefined ? raw.availableUnits : (raw.units ? raw.units.filter((u: any) => u.availabilityStatus === 'AVAILABLE').length : 0),
    };
  }

  async getDashboardStats() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      pendingApprovalsCount,
      activeListingsCount,
      totalPropertiesCount,
      rejectedCount,
      registeredAgentsCount,
      totalEnquiriesThisMonth,
      monthlyPaymentsAgg,
      parentProjectsCount,
      childUnitsCount,
      independentPropertiesCount,
    ] = await Promise.all([
      this.propertyModel.countDocuments({
        status: { $in: ['PENDING_REVIEW', 'PENDING_APPROVAL'] },
      }),
      this.propertyModel.countDocuments({
        status: { $in: ['PUBLISHED', 'ACTIVE', 'APPROVED'] },
        isPublished: true,
      }),
      this.propertyModel.countDocuments(),
      this.propertyModel.countDocuments({ status: 'REJECTED' }),
      this.userModel.countDocuments({
        $or: [
          { accountType: { $in: ['AGENT', 'BROKER', 'DEVELOPER'] } },
          { role: { $in: ['AGENT', 'BROKER', 'DEVELOPER'] } },
          { platformRole: { $in: ['AGENT', 'BROKER', 'DEVELOPER'] } },
        ],
      }),
      this.leadModel.countDocuments({
        createdAt: { $gte: startOfMonth },
      }),
      this.paymentModel.aggregate([
        {
          $match: {
            status: PaymentStatus.PAID,
            createdAt: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
          },
        },
      ]),
      this.propertyModel.countDocuments({ isParentProject: true }),
      this.propertyModel.countDocuments({ isChildUnit: true }),
      this.propertyModel.countDocuments({
        isParentProject: { $ne: true },
        isChildUnit: { $ne: true },
      }),
    ]);

    const monthlyRevenueEstimate =
      monthlyPaymentsAgg && monthlyPaymentsAgg.length > 0
        ? monthlyPaymentsAgg[0].totalRevenue
        : 0;

    return {
      pendingApprovalsCount,
      activeListingsCount,
      totalPropertiesCount,
      rejectedCount,
      registeredAgentsCount,
      totalEnquiriesThisMonth,
      monthlyRevenueEstimate,
      parentProjectsCount,
      childUnitsCount,
      independentPropertiesCount,
    };
  }

  async getPendingQueue() {
    const query: any = this.propertyModel
      .find({ status: { $in: ['PENDING_REVIEW', 'PENDING_APPROVAL'] } })
      .sort({ _id: -1 })
      .lean();

    const properties = typeof query?.exec === 'function' ? await query.exec() : await query;

    return (properties || []).map((p: any) => this.mapPropertyToAdminItem(p));
  }

  async getQueue() {
    return this.getPendingQueue();
  }

  async getAllProperties(filterQuery?: {
    status?: string;
    category?: string;
    listingType?: string;
    isFeatured?: boolean | string;
    search?: string;
    limit?: number;
    skip?: number;
    page?: number;
    structureType?: string;
    viewScope?: string;
  }) {
    const filter: any = {};

    if (filterQuery?.structureType && filterQuery.structureType !== 'ALL') {
      filter.structureType = filterQuery.structureType;
    }

    if (filterQuery?.viewScope === 'PROJECTS') {
      filter.isParentProject = true;
    } else if (filterQuery?.viewScope === 'UNITS') {
      filter.isChildUnit = true;
    } else if (filterQuery?.viewScope === 'INDEPENDENT') {
      filter.isParentProject = { $ne: true };
      filter.isChildUnit = { $ne: true };
    }

    if (filterQuery?.status && filterQuery.status !== 'ALL') {
      if (
        filterQuery.status === 'PUBLISHED' ||
        filterQuery.status === 'ACTIVE' ||
        filterQuery.status === 'APPROVED'
      ) {
        filter.status = { $in: ['PUBLISHED', 'ACTIVE', 'APPROVED'] };
      } else if (filterQuery.status === 'PENDING_REVIEW' || filterQuery.status === 'PENDING_APPROVAL') {
        filter.status = { $in: ['PENDING_REVIEW', 'PENDING_APPROVAL'] };
      } else {
        filter.status = filterQuery.status;
      }
    }

    if (filterQuery?.category && filterQuery.category !== 'ALL') {
      filter.category = new RegExp(filterQuery.category.trim(), 'i');
    }

    if (filterQuery?.listingType && filterQuery.listingType !== 'ALL') {
      filter.listingType = new RegExp(`^${filterQuery.listingType}$`, 'i');
    }

    if (filterQuery?.isFeatured !== undefined && filterQuery.isFeatured !== 'ALL') {
      filter.isFeatured = filterQuery.isFeatured === true || filterQuery.isFeatured === 'true';
    }

    if (filterQuery?.search && filterQuery.search.trim()) {
      const regex = new RegExp(filterQuery.search.trim(), 'i');
      filter.$or = [
        { 'title.en': regex },
        { 'title.hi': regex },
        { id: regex },
        { referenceId: regex },
        { slug: regex },
        { 'projectDetails.projectName': regex },
        { 'projectDetails.buildingName': regex },
        { 'unitDetails.unitNumber': regex },
        { 'location.locality': regex },
        { 'location.city': regex },
        { 'advertiser.name': regex },
      ];
    }

    const limit = filterQuery?.limit ? Number(filterQuery.limit) : 100;
    const page = filterQuery?.page ? Math.max(1, Number(filterQuery.page)) : 1;
    const skip = filterQuery?.skip ? Number(filterQuery.skip) : (page - 1) * limit;

    const [total, properties] = await Promise.all([
      this.propertyModel.countDocuments(filter),
      this.propertyModel
        .find(filter)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
    ]);

    const mapped = properties.map((p) => this.mapPropertyToAdminItem(p));

    return mapped;
  }

  async getPropertyById(id: string) {
    const query: any = { $or: [{ id }, { slug: id }] };
    if (isValidObjectId(id)) {
      query.$or.push({ _id: id });
    }

    const property = await this.propertyModel.findOne(query).exec();
    if (!property) {
      throw new NotFoundException(`Property with ID "${id}" was not found.`);
    }

    return this.mapPropertyToAdminItem(property);
  }

  async updateProperty(id: string, updateDto: any, user?: { id?: string; name?: string; role?: string }) {
    const query: any = { $or: [{ id }, { slug: id }] };
    if (isValidObjectId(id)) {
      query.$or.push({ _id: id });
    }

    if (user?.id) {
      updateDto.updatedBy = user.id;
    }

    if (updateDto.contactNumbers || updateDto.advertiser?.contactNumbers) {
      const contacts = updateDto.contactNumbers || updateDto.advertiser?.contactNumbers;
      updateDto.contactNumbers = contacts;
      const primaryContact = Array.isArray(contacts) ? contacts.find((c: any) => c.isPrimary) || contacts[0] : undefined;
      const primaryPhone = primaryContact && primaryContact.number
        ? (primaryContact.number.startsWith('+') ? primaryContact.number : `${primaryContact.countryCode || '+91'}${primaryContact.number}`)
        : updateDto.advertiser?.phone;

      if (updateDto.advertiser) {
        updateDto.advertiser.contactNumbers = contacts;
        if (primaryPhone) {
          updateDto.advertiser.phone = primaryPhone;
        }
      }
    }

    const updated = await this.propertyModel
      .findOneAndUpdate(query, { $set: updateDto }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Property with ID "${id}" not found.`);
    }

    return {
      success: true,
      message: 'Property updated successfully by admin.',
      property: this.mapPropertyToAdminItem(updated),
    };
  }

  async approve(id: string, note?: string, user?: { id?: string; email?: string; name?: string; role?: string }) {
    const query: any = { $or: [{ id }] };
    if (isValidObjectId(id)) {
      query.$or.push({ _id: id });
    }

    const property = await this.propertyModel.findOne(query).exec();

    if (!property) {
      throw new NotFoundException(`Property with ID "${id}" was not found in MongoDB.`);
    }

    const previousStatus = property.status;
    const adminIdentifier = user?.name || user?.email || 'Admin Moderator';

    property.status = 'PUBLISHED';
    property.isPublished = true;
    property.publishedAt = new Date();

    property.moderation = {
      ...(property.moderation || {}),
      approvedBy: adminIdentifier,
      approvedAt: new Date(),
      publishedAt: new Date(),
      previousStatus,
      adminRemark: note || 'Approved and published by administrator',
      history: [
        ...(property.moderation?.history || []),
        {
          action: 'APPROVED_AND_PUBLISHED',
          actorId: user?.id || 'admin',
          actorRole: user?.role || 'ADMIN',
          previousStatus,
          newStatus: 'PUBLISHED',
          remarks: note || 'Approved and published by administrator',
          timestamp: new Date(),
        },
      ],
    };

    await property.save();

    if (property.isParentProject) {
      await this.propertyModel.updateMany(
        { parentPropertyId: property.id, status: { $ne: 'SOLD_OR_RENTED' } },
        { $set: { status: 'PUBLISHED', isPublished: true, publishedAt: new Date() } },
      );
    }

    this.logger.log(`✅ Property "${property.id}" successfully APPROVED & PUBLISHED by ${adminIdentifier}.`);

    return {
      success: true,
      message: 'Property listing approved and published successfully.',
      property: this.mapPropertyToAdminItem(property),
    };
  }

  async reject(
    id: string,
    reasonCode: string,
    feedback?: string,
    user?: { id?: string; email?: string; name?: string; role?: string },
  ) {
    if (!reasonCode || !reasonCode.trim()) {
      throw new BadRequestException('Rejection reason code is mandatory for auditing purposes.');
    }

    const query: any = { $or: [{ id }] };
    if (isValidObjectId(id)) {
      query.$or.push({ _id: id });
    }

    const property = await this.propertyModel.findOne(query).exec();

    if (!property) {
      throw new NotFoundException(`Property with ID "${id}" was not found in MongoDB.`);
    }

    const previousStatus = property.status;
    const adminIdentifier = user?.name || user?.email || 'Admin Moderator';

    property.status = 'REJECTED';
    property.isPublished = false;

    property.moderation = {
      ...(property.moderation || {}),
      rejectedBy: adminIdentifier,
      rejectedAt: new Date(),
      rejectionReason: reasonCode,
      adminRemark: feedback || '',
      moderationRemarks: feedback || '',
      previousStatus,
      history: [
        ...(property.moderation?.history || []),
        {
          action: 'REJECTED',
          actorId: user?.id || 'admin',
          actorRole: user?.role || 'ADMIN',
          previousStatus,
          newStatus: 'REJECTED',
          reason: reasonCode,
          remarks: feedback || '',
          timestamp: new Date(),
        },
      ],
    };

    await property.save();

    if (property.isParentProject) {
      await this.propertyModel.updateMany(
        { parentPropertyId: property.id },
        { $set: { status: 'REJECTED', isPublished: false } },
      );
    }

    this.logger.log(`⚠️ Property "${property.id}" REJECTED by ${adminIdentifier}. Reason: ${reasonCode}`);

    return {
      success: true,
      message: 'Property listing was rejected and status updated in database.',
      property: this.mapPropertyToAdminItem(property),
    };
  }

  async publish(id: string, user?: { id?: string; name?: string; role?: string }) {
    const query: any = { $or: [{ id }] };
    if (isValidObjectId(id)) {
      query.$or.push({ _id: id });
    }

    const property = await this.propertyModel.findOne(query).exec();
    if (!property) {
      throw new NotFoundException(`Property with ID "${id}" not found.`);
    }

    const previousStatus = property.status;
    property.status = 'PUBLISHED';
    property.isPublished = true;
    property.publishedAt = new Date();

    property.moderation = {
      ...(property.moderation || {}),
      previousStatus,
      publishedAt: new Date(),
      history: [
        ...(property.moderation?.history || []),
        {
          action: 'PUBLISHED',
          actorId: user?.id || 'admin',
          actorRole: user?.role || 'ADMIN',
          previousStatus,
          newStatus: 'PUBLISHED',
          timestamp: new Date(),
        },
      ],
    };

    await property.save();

    if (property.isParentProject) {
      await this.propertyModel.updateMany(
        { parentPropertyId: property.id, status: { $ne: 'SOLD_OR_RENTED' } },
        { $set: { status: 'PUBLISHED', isPublished: true, publishedAt: new Date() } },
      );
    }

    return {
      success: true,
      message: 'Property published live to CASA marketplace.',
      property: this.mapPropertyToAdminItem(property),
    };
  }

  async unpublish(id: string, user?: { id?: string; name?: string; role?: string }) {
    const query: any = { $or: [{ id }] };
    if (isValidObjectId(id)) {
      query.$or.push({ _id: id });
    }

    const property = await this.propertyModel.findOne(query).exec();
    if (!property) {
      throw new NotFoundException(`Property with ID "${id}" not found.`);
    }

    const previousStatus = property.status;
    property.status = 'UNPUBLISHED';
    property.isPublished = false;
    property.unpublishedAt = new Date();

    property.moderation = {
      ...(property.moderation || {}),
      previousStatus,
      history: [
        ...(property.moderation?.history || []),
        {
          action: 'UNPUBLISHED',
          actorId: user?.id || 'admin',
          actorRole: user?.role || 'ADMIN',
          previousStatus,
          newStatus: 'UNPUBLISHED',
          timestamp: new Date(),
        },
      ],
    };

    await property.save();

    if (property.isParentProject) {
      await this.propertyModel.updateMany(
        { parentPropertyId: property.id },
        { $set: { status: 'UNPUBLISHED', isPublished: false, unpublishedAt: new Date() } },
      );
    }

    return {
      success: true,
      message: 'Property has been unpublished and hidden from public search.',
      property: this.mapPropertyToAdminItem(property),
    };
  }

  async archive(id: string, user?: { id?: string; name?: string; role?: string }) {
    const query: any = { $or: [{ id }] };
    if (isValidObjectId(id)) {
      query.$or.push({ _id: id });
    }

    const property = await this.propertyModel.findOne(query).exec();
    if (!property) {
      throw new NotFoundException(`Property with ID "${id}" not found.`);
    }

    const previousStatus = property.status;
    property.status = 'ARCHIVED';
    property.isPublished = false;
    property.archivedAt = new Date();

    property.moderation = {
      ...(property.moderation || {}),
      previousStatus,
      history: [
        ...(property.moderation?.history || []),
        {
          action: 'ARCHIVED',
          actorId: user?.id || 'admin',
          actorRole: user?.role || 'ADMIN',
          previousStatus,
          newStatus: 'ARCHIVED',
          timestamp: new Date(),
        },
      ],
    };

    await property.save();

    if (property.isParentProject) {
      await this.propertyModel.updateMany(
        { parentPropertyId: property.id },
        { $set: { status: 'ARCHIVED', isPublished: false, archivedAt: new Date() } },
      );
    }
    return {
      success: true,
      message: 'Property has been permanently archived.',
      property: this.mapPropertyToAdminItem(property),
    };
  }

  async toggleFeature(id: string, isFeatured?: boolean) {
    const query: any = { $or: [{ id }] };
    if (isValidObjectId(id)) {
      query.$or.push({ _id: id });
    }

    const property = await this.propertyModel.findOne(query).exec();
    if (!property) {
      throw new NotFoundException(`Property with ID "${id}" not found.`);
    }

    property.isFeatured = isFeatured !== undefined ? isFeatured : !property.isFeatured;
    await property.save();

    return {
      success: true,
      message: property.isFeatured ? 'Property marked as Featured.' : 'Property removed from Featured.',
      property: this.mapPropertyToAdminItem(property),
    };
  }

  async verifyPropertyRera(
    id: string,
    body?: { notes?: string; reraNumber?: string },
    user?: { id?: string; name?: string; role?: string; email?: string },
  ) {
    const query: any = { $or: [{ id }] };
    if (isValidObjectId(id)) {
      query.$or.push({ _id: id });
    }

    const property = await this.propertyModel.findOne(query).exec();
    if (!property) {
      throw new NotFoundException(`Property with ID "${id}" was not found.`);
    }

    const currentRera = property.rera || { reraRegistered: 'YES', verificationStatus: 'PENDING' };
    const reraNumber = (body?.reraNumber || currentRera.reraNumber || property.reraNumber || '').trim();

    if (!reraNumber) {
      throw new BadRequestException('Cannot verify property RERA without an official RERA registration number.');
    }

    const previousStatus = currentRera.verificationStatus || 'PENDING';
    const auditEntry = {
      action: 'VERIFIED',
      actorId: user?.id || 'admin',
      actorRole: user?.role || 'ADMIN',
      previousStatus,
      newStatus: 'VERIFIED',
      notes: body?.notes || 'RERA registration verified by CASA administration.',
      timestamp: new Date(),
    };

    property.rera = {
      ...currentRera,
      reraRegistered: 'YES',
      reraNumber,
      verificationStatus: 'VERIFIED',
      verifiedBy: user?.name || user?.email || user?.id || 'admin',
      verifiedAt: new Date(),
      auditHistory: [...(currentRera.auditHistory || []), auditEntry],
    };
    property.reraNumber = reraNumber;

    await property.save();
    this.logger.log(`🛡️ Property "${property.id}" RERA VERIFIED by ${user?.name || user?.id || 'Admin'}`);

    return {
      success: true,
      message: 'Property RERA registration marked as VERIFIED.',
      property: this.mapPropertyToAdminItem(property),
    };
  }

  async rejectPropertyRera(
    id: string,
    reason: string,
    user?: { id?: string; name?: string; role?: string; email?: string },
  ) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('Rejection reason is required when rejecting RERA registration.');
    }

    const query: any = { $or: [{ id }] };
    if (isValidObjectId(id)) {
      query.$or.push({ _id: id });
    }

    const property = await this.propertyModel.findOne(query).exec();
    if (!property) {
      throw new NotFoundException(`Property with ID "${id}" was not found.`);
    }

    const currentRera = property.rera || { reraRegistered: 'YES', verificationStatus: 'PENDING' };
    const previousStatus = currentRera.verificationStatus || 'PENDING';

    const auditEntry = {
      action: 'REJECTED',
      actorId: user?.id || 'admin',
      actorRole: user?.role || 'ADMIN',
      previousStatus,
      newStatus: 'REJECTED',
      notes: reason.trim(),
      timestamp: new Date(),
    };

    property.rera = {
      ...currentRera,
      verificationStatus: 'REJECTED',
      rejectionNotes: reason.trim(),
      auditHistory: [...(currentRera.auditHistory || []), auditEntry],
    };

    await property.save();
    this.logger.log(`⚠️ Property "${property.id}" RERA REJECTED by ${user?.name || user?.id || 'Admin'}: ${reason}`);

    return {
      success: true,
      message: 'Property RERA registration marked as REJECTED.',
      property: this.mapPropertyToAdminItem(property),
    };
  }

  async deleteProperty(id: string) {
    const query: any = { $or: [{ id }] };
    if (isValidObjectId(id)) {
      query.$or.push({ _id: id });
    }

    const deleted = await this.propertyModel.findOneAndDelete(query).exec();
    if (!deleted) {
      throw new NotFoundException(`Property with ID "${id}" not found.`);
    }

    return {
      success: true,
      message: 'Property successfully deleted from MongoDB Atlas.',
    };
  }

  // ==========================================
  // PHASE 08: USER GOVERNANCE & AUDIT TRAIL
  // ==========================================

  async recordAuditLog(data: {
    action: string;
    actorUserId: string;
    actorName: string;
    actorRole: string;
    targetUserId?: string;
    targetUserName?: string;
    targetEntity?: string;
    targetEntityId?: string;
    previousValue?: any;
    newValue?: any;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      await this.auditLogModel.create({
        ...data,
        timestamp: new Date(),
      });
    } catch (err: any) {
      this.logger.error(`Failed to record audit log: ${err?.message}`);
    }
  }

  async getUsers(dto: AdminUserQueryDto) {
    const filter: any = {};

    if (dto.q && dto.q.trim()) {
      const q = dto.q.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { name: regex },
        { mobile: regex },
        { normalizedMobile: regex },
        { email: regex },
        { agencyName: regex },
        { reraNumber: regex },
      ];
    }

    if (dto.role) {
      filter.role = dto.role;
    }

    if (dto.status) {
      filter.status = dto.status;
    }

    if (dto.isVerifiedAgent !== undefined) {
      filter.isVerifiedAgent = dto.isVerifiedAgent;
    }

    const page = Math.max(1, Number(dto.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(dto.limit) || 20));
    const skip = (page - 1) * limit;

    let sortObj: any = { createdAt: -1 };
    if (dto.sort === 'oldest') sortObj = { createdAt: 1 };
    else if (dto.sort === 'name_asc') sortObj = { name: 1 };
    else if (dto.sort === 'name_desc') sortObj = { name: -1 };

    const [dbTotal, dbUsers] = await Promise.all([
      this.userModel.countDocuments(filter).catch(() => 0),
      this.userModel.find(filter).sort(sortObj).skip(skip).limit(limit).lean().catch(() => []),
    ]);

    let users = [...dbUsers];
    let total = dbTotal;

    if (users.length === 0) {
      let memUsers = this.authService.getMemUsers().map((m) => ({
        _id: m._id,
        name: m.name,
        mobile: m.mobile,
        normalizedMobile: m.normalizedMobile,
        email: m.email,
        role: m.role,
        status: m.status,
        isVerifiedAgent: m.isVerifiedAgent,
        agencyName: m.agencyName,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })) as any[];

      if (dto.role) {
        memUsers = memUsers.filter((u) => u.role === dto.role);
      }
      if (dto.status) {
        memUsers = memUsers.filter((u) => u.status === dto.status);
      }
      if (dto.isVerifiedAgent !== undefined) {
        memUsers = memUsers.filter((u) => Boolean(u.isVerifiedAgent) === Boolean(dto.isVerifiedAgent));
      }
      if (dto.q && dto.q.trim()) {
        const q = dto.q.trim().toLowerCase();
        memUsers = memUsers.filter(
          (u) =>
            u.name?.toLowerCase().includes(q) ||
            u.mobile?.includes(q) ||
            u.normalizedMobile?.includes(q) ||
            u.agencyName?.toLowerCase().includes(q),
        );
      }

      total = memUsers.length;
      users = memUsers.slice(skip, skip + limit);
    }

    const userIds = users.map((u: any) => u._id.toString());
    const normalizedMobiles = users.map((u: any) => u.normalizedMobile).filter(Boolean);

    // Aggregate property counts per user
    let countMap = new Map<string, { total: number; published: number }>();
    try {
      const propertyCounts = await this.propertyModel.aggregate([
        {
          $match: {
            $or: [
              { ownerId: { $in: [...userIds, ...normalizedMobiles] } },
              { advertiserId: { $in: [...userIds, ...normalizedMobiles] } },
              { createdBy: { $in: [...userIds, ...normalizedMobiles] } },
            ],
          },
        },
        {
          $group: {
            _id: { $ifNull: ['$ownerId', '$advertiserId'] },
            totalProperties: { $sum: 1 },
            publishedProperties: {
              $sum: { $cond: [{ $in: ['$status', ['PUBLISHED', 'ACTIVE']] }, 1, 0] },
            },
          },
        },
      ]);

      propertyCounts.forEach((pc: any) => {
        if (pc._id) {
          countMap.set(pc._id.toString(), {
            total: pc.totalProperties,
            published: pc.publishedProperties,
          });
        }
      });
    } catch (err: any) {
      this.logger.warn(`Property aggregation warning in getUsers: ${err?.message}`);
    }

    const customRoleIds = users
      .map((u: any) => u.customRoleId)
      .filter((id: any) => id && isValidObjectId(id));

    const customRoleMap = new Map<string, any>();
    if (customRoleIds.length > 0) {
      try {
        const foundRoles = await this.roleModel.find({ _id: { $in: customRoleIds } }).lean();
        foundRoles.forEach((r: any) => {
          customRoleMap.set(r._id.toString(), {
            id: r._id.toString(),
            name: r.name,
            slug: r.slug,
            isSystemRole: r.isSystemRole,
          });
        });
      } catch (err: any) {
        this.logger.warn(`Custom role lookup note in getUsers: ${err?.message}`);
      }
    }

    const data = users.map((u: any) => {
      const counts = countMap.get(u._id.toString()) || countMap.get(u.normalizedMobile) || { total: 0, published: 0 };
      const norm = normalizeUserRoleModel({
        role: u.role,
        platformRole: u.platformRole,
        accountType: u.accountType,
        isVerifiedAgent: u.isVerifiedAgent,
      });
      const customRole = u.customRoleId ? customRoleMap.get(u.customRoleId.toString()) || null : null;

      return {
        id: u._id.toString(),
        _id: u._id.toString(),
        name: u.name || 'CASA User',
        mobile: u.mobile,
        normalizedMobile: u.normalizedMobile,
        email: u.email,
        platformRole: norm.platformRole,
        accountType: norm.accountType,
        role: norm.role,
        customRoleId: u.customRoleId || null,
        customRole,
        roleName: customRole ? customRole.name : norm.role,
        status: u.status || 'ACTIVE',
        isVerifiedAgent: norm.isVerifiedAgent,
        agencyName: u.agencyName,
        reraNumber: u.reraNumber,
        hasPassword: Boolean(u.passwordHash),
        avatar: u.avatar,
        propertyCount: counts.total,
        publishedCount: counts.published,
        lastLoginAt: u.lastLoginAt || u.updatedAt || u.createdAt,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
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

  async getUserById(id: string) {
    const query: any = isValidObjectId(id) ? { _id: id } : { $or: [{ id }, { normalizedMobile: id }] };
    const user: any = await this.userModel.findOne(query).lean();

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" was not found.`);
    }

    const userIdStr = user._id.toString();
    const normalizedMobile = user.normalizedMobile;

    let properties: any[] = [];
    try {
      properties = await this.propertyModel
        .find({
          $or: [
            { ownerId: userIdStr },
            { ownerId: normalizedMobile },
            { advertiserId: userIdStr },
            { advertiserId: normalizedMobile },
            { createdBy: userIdStr },
          ],
        })
        .sort({ createdAt: -1 })
        .lean();
    } catch (err: any) {
      this.logger.warn(`Property lookup warning for user ${userIdStr}: ${err?.message}`);
    }

    const propertySummary = {
      total: properties.length,
      draft: properties.filter((p) => p.status === 'DRAFT').length,
      pending: properties.filter((p) => p.status === 'PENDING_REVIEW' || p.status === 'PENDING_APPROVAL').length,
      published: properties.filter((p) => p.status === 'PUBLISHED' || p.status === 'ACTIVE').length,
      rejected: properties.filter((p) => p.status === 'REJECTED').length,
      unpublished: properties.filter((p) => p.status === 'UNPUBLISHED').length,
      archived: properties.filter((p) => p.status === 'ARCHIVED').length,
    };

    const norm = normalizeUserRoleModel({
      role: user.role,
      platformRole: user.platformRole,
      accountType: user.accountType,
      isVerifiedAgent: user.isVerifiedAgent,
    });

    let customRoleDoc: any = null;
    if (user.customRoleId && isValidObjectId(user.customRoleId)) {
      try {
        customRoleDoc = await this.roleModel.findById(user.customRoleId).lean();
      } catch (err: any) {
        this.logger.warn(`Custom role lookup error for user ${userIdStr}: ${err?.message}`);
      }
    }

    return {
      id: userIdStr,
      _id: userIdStr,
      name: user.name || 'CASA User',
      mobile: user.mobile,
      normalizedMobile: user.normalizedMobile,
      email: user.email,
      platformRole: norm.platformRole,
      accountType: norm.accountType,
      role: norm.role,
      customRoleId: user.customRoleId || null,
      customRole: customRoleDoc ? {
        id: customRoleDoc._id.toString(),
        name: customRoleDoc.name,
        slug: customRoleDoc.slug,
        isSystemRole: customRoleDoc.isSystemRole,
        permissions: customRoleDoc.permissions,
        dataScope: customRoleDoc.dataScope,
        dashboardConfig: customRoleDoc.dashboardConfig,
      } : null,
      roleName: customRoleDoc ? customRoleDoc.name : norm.role,
      status: user.status || 'ACTIVE',
      isVerifiedAgent: norm.isVerifiedAgent,
      agencyName: user.agencyName,
      reraNumber: user.reraNumber,
      hasPassword: Boolean(user.passwordHash),
      avatar: user.avatar,
      lastLoginAt: user.lastLoginAt || user.updatedAt || user.createdAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      propertySummary,
      properties: properties.slice(0, 15).map((p) => ({
        id: p.id || p._id.toString(),
        slug: p.slug,
        title: typeof p.title === 'string' ? p.title : (p.title?.en || 'Untitled'),
        category: p.category,
        listingType: p.listingType,
        price: typeof p.price === 'number' ? p.price : (p.price?.amount || 0),
        status: p.status,
        isPublished: p.isPublished,
        createdAt: p.createdAt,
      })),
    };
  }

  async updateUser(id: string, dto: UpdateAdminUserDto, actor?: AuthenticatedUser) {
    const query: any = isValidObjectId(id) ? { _id: id } : { $or: [{ id }, { normalizedMobile: id }, { mobile: id }] };
    const user = await this.userModel.findOne(query);

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" was not found.`);
    }

    const previousData = {
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      status: user.status,
      isVerifiedAgent: user.isVerifiedAgent,
    };

    const isActorSuperAdmin =
      actor?.role === UserRole.SUPER_ADMIN || actor?.platformRole === PlatformRole.SUPER_ADMIN;

    // Security Rule: Only Super Admin can modify another Super Admin
    if (user.role === UserRole.SUPER_ADMIN && !isActorSuperAdmin) {
      throw new ForbiddenException('Only a Super Administrator can edit another Super Administrator account.');
    }

    if (dto.name !== undefined) {
      user.name = dto.name.trim();
    }

    if (dto.email !== undefined) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      if (normalizedEmail) {
        const existingEmailUser = await this.userModel.findOne({
          email: normalizedEmail,
          _id: { $ne: user._id },
        });
        if (existingEmailUser) {
          throw new BadRequestException(`Email "${normalizedEmail}" is already registered by another user.`);
        }
        user.email = normalizedEmail;
      }
    }

    if (dto.mobile !== undefined) {
      const cleanMobile = dto.mobile.replace(/[^0-9]/g, '');
      const fullMobile = dto.mobile.startsWith('+') ? dto.mobile : `+91${cleanMobile}`;
      if (fullMobile !== user.mobile) {
        const existingMobileUser = await this.userModel.findOne({
          $or: [{ mobile: fullMobile }, { normalizedMobile: fullMobile }],
          _id: { $ne: user._id },
        });
        if (existingMobileUser) {
          throw new BadRequestException(`Mobile number "${fullMobile}" is already registered by another user.`);
        }
        user.mobile = fullMobile;
        user.normalizedMobile = fullMobile;
      }
    }

    if (dto.password && dto.password.trim()) {
      if (dto.password.length < 6) {
        throw new BadRequestException('Password must be at least 6 characters long.');
      }
      const newHash = await hashPassword(dto.password);
      user.passwordHash = newHash;
      user.isEmailVerified = true;
      this.logger.log(`Password reset/set for user ${user._id} (${user.email || user.mobile}) by administrator.`);
    }

    if (dto.agencyName !== undefined) {
      user.agencyName = dto.agencyName.trim();
    }

    if (dto.reraNumber !== undefined) {
      user.reraNumber = dto.reraNumber.trim();
    }

    if (dto.isVerifiedAgent !== undefined) {
      user.isVerifiedAgent = dto.isVerifiedAgent;
      if (dto.isVerifiedAgent && user.role === UserRole.AGENT) {
        user.role = UserRole.VERIFIED_AGENT;
      }
    }

    if (dto.status !== undefined) {
      if (
        user.role === UserRole.SUPER_ADMIN &&
        (dto.status === AccountStatus.SUSPENDED || dto.status === AccountStatus.DEACTIVATED)
      ) {
        const activeSuperAdmins = await this.userModel.countDocuments({
          role: UserRole.SUPER_ADMIN,
          status: AccountStatus.ACTIVE,
        });
        if (activeSuperAdmins <= 1) {
          throw new BadRequestException('Cannot deactivate the sole remaining active Super Administrator account.');
        }
      }
      const previousStatus = user.status;
      user.status = dto.status;
      if (dto.status === AccountStatus.SUSPENDED || dto.status === AccountStatus.DEACTIVATED) {
        try {
          await this.refreshSessionModel.updateMany(
            { userId: user._id },
            { $set: { isRevoked: true, revokedAt: new Date() } },
          );
        } catch (err: any) {
          this.logger.warn(`Session revocation note: ${err?.message}`);
        }
      }
      await this.syncUserPropertyVisibility(
        [user._id.toString(), (user as any).id].filter(Boolean),
        dto.status,
        previousStatus,
      );
    }

    if (dto.role || dto.customRoleId !== undefined) {
      const targetRoleIdentifier = dto.customRoleId || dto.role;
      if (targetRoleIdentifier) {
        let roleDoc: RoleDocument | null = null;
        if (isValidObjectId(targetRoleIdentifier)) {
          roleDoc = await this.roleModel.findById(targetRoleIdentifier);
        }
        if (!roleDoc) {
          const slugCandidate = targetRoleIdentifier.toLowerCase().replace(/_/g, '-');
          roleDoc = await this.roleModel.findOne({
            $or: [
              { slug: slugCandidate },
              { slug: targetRoleIdentifier.toLowerCase() },
              { name: targetRoleIdentifier },
            ],
          });
        }

        if (roleDoc) {
          if (
            (roleDoc.platformRole === PlatformRole.SUPER_ADMIN || roleDoc.slug === 'super-admin') &&
            !isActorSuperAdmin
          ) {
            throw new ForbiddenException('Only a Super Administrator can assign Super Administrator role.');
          }
          if (roleDoc.isSystemRole) {
            user.customRoleId = null;
            user.platformRole = roleDoc.platformRole;
            user.accountType = roleDoc.accountType;
            const norm = normalizeUserRoleModel({
              platformRole: roleDoc.platformRole,
              accountType: roleDoc.accountType,
              role: roleDoc.slug.toUpperCase().replace(/-/g, '_'),
            });
            user.role = norm.role;
          } else {
            user.customRoleId = roleDoc._id.toString();
            user.platformRole = roleDoc.platformRole || PlatformRole.USER;
            user.accountType = roleDoc.accountType || null;
            const norm = normalizeUserRoleModel({
              platformRole: user.platformRole,
              accountType: user.accountType,
            });
            user.role = norm.role;
          }
        } else {
          const norm = normalizeUserRoleModel({ role: targetRoleIdentifier });
          if (norm.platformRole === PlatformRole.SUPER_ADMIN && !isActorSuperAdmin) {
            throw new ForbiddenException('Only a Super Administrator can promote a user to Super Administrator.');
          }
          user.customRoleId = null;
          user.platformRole = norm.platformRole;
          user.accountType = norm.accountType;
          user.role = norm.role;
        }
      }
    }

    await user.save();

    await this.recordAuditLog({
      action: 'USER_UPDATED',
      actorUserId: actor?.id || 'system_admin',
      actorName: actor?.name || 'Administrator',
      actorRole: actor?.role || 'ADMIN',
      targetUserId: user._id.toString(),
      targetUserName: user.name,
      targetEntity: 'USER',
      targetEntityId: user._id.toString(),
      previousValue: previousData,
      newValue: {
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        status: user.status,
        isVerifiedAgent: user.isVerifiedAgent,
        passwordUpdated: Boolean(dto.password),
      },
      reason: 'User details and credentials updated by administrator',
    });

    const norm = normalizeUserRoleModel({
      role: user.role,
      platformRole: user.platformRole,
      accountType: user.accountType,
      isVerifiedAgent: user.isVerifiedAgent,
    });

    return {
      success: true,
      message: `User ${user.name || user.email || user.mobile} updated successfully.`,
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        normalizedMobile: user.normalizedMobile,
        platformRole: norm.platformRole,
        accountType: norm.accountType,
        role: norm.role,
        customRoleId: user.customRoleId || null,
        status: user.status,
        isVerifiedAgent: user.isVerifiedAgent,
        agencyName: user.agencyName,
        reraNumber: user.reraNumber,
        hasPassword: Boolean(user.passwordHash),
      },
    };
  }

  async updateUserStatus(id: string, dto: UpdateUserStatusDto, actor?: AuthenticatedUser) {
    const query: any = isValidObjectId(id) ? { _id: id } : { normalizedMobile: id };
    const user = await this.userModel.findOne(query);

    if (!user) {
      const memUser = this.authService.getMemUserById(id);
      if (memUser) {
        memUser.status = dto.status;
        if (dto.status === AccountStatus.SUSPENDED || dto.status === AccountStatus.DEACTIVATED) {
          this.authService.revokeUserSessions(memUser._id);
        }
        return {
          success: true,
          message: `User status successfully updated to ${dto.status}.`,
          user: {
            id: memUser._id,
            name: memUser.name,
            mobile: memUser.mobile,
            role: memUser.role,
            status: memUser.status,
          },
        };
      }
      throw new NotFoundException(`User with ID "${id}" was not found.`);
    }

    // Security Rule 1: User cannot modify own status
    if (actor && (user._id.toString() === actor.id || user.normalizedMobile === actor.normalizedMobile)) {
      throw new BadRequestException('Administrators cannot suspend or deactivate their own account.');
    }

    // Security Rule 2: SUPER_ADMIN protection
    if (user.role === UserRole.SUPER_ADMIN && actor?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only a Super Administrator can modify the status of another Super Administrator.');
    }

    // Security Rule 3: Last active SUPER_ADMIN protection
    if (
      user.role === UserRole.SUPER_ADMIN &&
      (dto.status === AccountStatus.SUSPENDED || dto.status === AccountStatus.DEACTIVATED)
    ) {
      const activeSuperAdmins = await this.userModel.countDocuments({
        role: UserRole.SUPER_ADMIN,
        status: AccountStatus.ACTIVE,
      });
      if (activeSuperAdmins <= 1) {
        throw new BadRequestException('Cannot deactivate the sole remaining active Super Administrator account.');
      }
    }

    const previousStatus = user.status;
    user.status = dto.status;
    await user.save();

    // Invalidate all active sessions if user is suspended or deactivated
    if (dto.status === AccountStatus.SUSPENDED || dto.status === AccountStatus.DEACTIVATED) {
      try {
        await this.refreshSessionModel.updateMany(
          { userId: user._id },
          { $set: { isRevoked: true } },
        );
        await this.refreshSessionModel.deleteMany({
          $or: [{ userId: user._id }, { userId: user._id.toString() }],
        });
        this.logger.log(`Revoked and deleted all refresh sessions for suspended/deactivated user ${user._id}`);
      } catch (err: any) {
        this.logger.warn(`Session revocation note: ${err?.message}`);
      }
    }

    // Synchronize in-memory store and session state immediately
    try {
      this.authService.updateMemUserStatus(user._id.toString(), dto.status);
      if (user.normalizedMobile) {
        this.authService.updateMemUserStatus(user.normalizedMobile, dto.status);
      }
      if (dto.status === AccountStatus.SUSPENDED || dto.status === AccountStatus.DEACTIVATED) {
        this.authService.revokeUserSessions(user._id.toString());
      }
    } catch (memErr: any) {
      this.logger.warn(`In-memory status sync note: ${memErr?.message}`);
    }

    // Immediately synchronize property listing visibility
    await this.syncUserPropertyVisibility(
      [user._id.toString(), (user as any).id].filter(Boolean),
      dto.status,
      previousStatus,
    );

    // Record Audit Log
    await this.recordAuditLog({
      action: 'USER_STATUS_CHANGED',
      actorUserId: actor?.id || 'system_admin',
      actorName: actor?.name || 'Administrator',
      actorRole: actor?.role || 'ADMIN',
      targetUserId: user._id.toString(),
      targetUserName: user.name,
      targetEntity: 'USER',
      targetEntityId: user._id.toString(),
      previousValue: { status: previousStatus },
      newValue: { status: dto.status },
      reason: dto.reason || `Account status changed from ${previousStatus} to ${dto.status}`,
    });

    return {
      success: true,
      message: `User status successfully updated to ${dto.status}.`,
      user: {
        id: user._id.toString(),
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        status: user.status,
      },
    };
  }

  async updateUserRole(id: string, dto: UpdateUserRoleDto, actor?: AuthenticatedUser) {
    const query: any = isValidObjectId(id) ? { _id: id } : { normalizedMobile: id };
    const user = await this.userModel.findOne(query);

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" was not found.`);
    }

    // Security Rule 1: Self-promotion / self-role change forbidden
    if (actor && (user._id.toString() === actor.id || user.normalizedMobile === actor.normalizedMobile)) {
      throw new BadRequestException('Users cannot modify their own administrative role.');
    }

    // Security Rule 2: Moderator cannot change roles
    if (actor?.role === UserRole.MODERATOR || actor?.platformRole === PlatformRole.MODERATOR) {
      throw new ForbiddenException('Moderators do not possess authority to modify user roles.');
    }

    const isActorSuperAdmin =
      actor?.role === UserRole.SUPER_ADMIN || actor?.platformRole === PlatformRole.SUPER_ADMIN;

    // Security Rule 3: Target user is SUPER_ADMIN protection
    if (
      (user.role === UserRole.SUPER_ADMIN || user.platformRole === PlatformRole.SUPER_ADMIN) &&
      !isActorSuperAdmin
    ) {
      throw new ForbiddenException('Only a Super Administrator can modify the role of a Super Administrator.');
    }

    const targetRoleIdentifier = dto.roleId || dto.role;
    if (!targetRoleIdentifier) {
      throw new BadRequestException('A role identifier or roleId must be provided.');
    }

    // Resolve Target Role from DB (custom or system role) or fallback to static system role
    let roleDoc: RoleDocument | null = null;
    if (isValidObjectId(targetRoleIdentifier)) {
      roleDoc = await this.roleModel.findById(targetRoleIdentifier);
    }
    if (!roleDoc) {
      const slugCandidate = targetRoleIdentifier.toLowerCase().replace(/_/g, '-');
      roleDoc = await this.roleModel.findOne({
        $or: [
          { slug: slugCandidate },
          { slug: targetRoleIdentifier.toLowerCase() },
          { name: targetRoleIdentifier },
        ],
      });
    }

    const previousRole = user.role;
    const previousCustomRoleId = user.customRoleId;
    let newPlatformRole: PlatformRole;
    let newAccountType: AccountType | null;
    let newRole: UserRole;
    let assignedRoleName: string;

    if (roleDoc) {
      if (roleDoc.isActive === false) {
        throw new BadRequestException(`Cannot assign inactive role "${roleDoc.name}".`);
      }

      // Elevation check: assigning SUPER_ADMIN role requires SUPER_ADMIN actor
      if (
        (roleDoc.platformRole === PlatformRole.SUPER_ADMIN || roleDoc.slug === 'super-admin') &&
        !isActorSuperAdmin
      ) {
        throw new ForbiddenException('Only a Super Administrator can assign Super Administrator roles.');
      }

      if (roleDoc.isSystemRole) {
        user.customRoleId = null;
        newPlatformRole = roleDoc.platformRole;
        newAccountType = roleDoc.accountType;
        const norm = normalizeUserRoleModel({
          platformRole: roleDoc.platformRole,
          accountType: roleDoc.accountType,
          role: roleDoc.slug.toUpperCase().replace(/-/g, '_'),
        });
        newRole = norm.role;
        if (roleDoc.slug === 'verified-agent' || norm.isVerifiedAgent) {
          user.isVerifiedAgent = true;
        }
      } else {
        // Dynamic Custom Role
        user.customRoleId = roleDoc._id.toString();
        newPlatformRole = roleDoc.platformRole || PlatformRole.USER;
        newAccountType = roleDoc.accountType || null;
        const norm = normalizeUserRoleModel({
          platformRole: newPlatformRole,
          accountType: newAccountType,
        });
        newRole = norm.role;
      }
      assignedRoleName = roleDoc.name;
    } else {
      // Direct enum string fallback
      const norm = normalizeUserRoleModel({ role: targetRoleIdentifier });
      if (norm.platformRole === PlatformRole.SUPER_ADMIN && !isActorSuperAdmin) {
        throw new ForbiddenException('Only a Super Administrator can promote a user to Super Administrator.');
      }
      user.customRoleId = null;
      newPlatformRole = norm.platformRole;
      newAccountType = norm.accountType;
      newRole = norm.role;
      if (norm.isVerifiedAgent || targetRoleIdentifier === 'VERIFIED_AGENT') {
        user.isVerifiedAgent = true;
      }
      assignedRoleName = targetRoleIdentifier;
    }

    user.platformRole = newPlatformRole;
    user.accountType = newAccountType;
    user.role = newRole;

    await user.save();

    // Record Audit Log
    await this.recordAuditLog({
      action: 'USER_ROLE_CHANGED',
      actorUserId: actor?.id || 'system_admin',
      actorName: actor?.name || 'Administrator',
      actorRole: actor?.role || 'ADMIN',
      targetUserId: user._id.toString(),
      targetUserName: user.name,
      targetEntity: 'USER',
      targetEntityId: user._id.toString(),
      previousValue: { role: previousRole, customRoleId: previousCustomRoleId },
      newValue: {
        role: user.role,
        platformRole: user.platformRole,
        accountType: user.accountType,
        customRoleId: user.customRoleId,
        roleName: assignedRoleName,
      },
      reason: dto.reason || `User role updated to ${assignedRoleName}`,
    });

    return {
      success: true,
      message: `User role successfully updated to ${assignedRoleName}.`,
      user: {
        id: user._id.toString(),
        name: user.name,
        mobile: user.mobile,
        platformRole: user.platformRole,
        accountType: user.accountType,
        role: user.role,
        customRoleId: user.customRoleId || null,
        customRole: roleDoc
          ? {
              id: roleDoc._id.toString(),
              name: roleDoc.name,
              slug: roleDoc.slug,
              isSystemRole: roleDoc.isSystemRole,
            }
          : null,
        roleName: assignedRoleName,
        status: user.status,
        isVerifiedAgent: user.isVerifiedAgent,
      },
    };
  }

  async deleteUser(id: string, reason?: string, actor?: AuthenticatedUser) {
    const query: any = isValidObjectId(id)
      ? { _id: id }
      : { $or: [{ id }, { normalizedMobile: id }, { mobile: id }, { email: id.toLowerCase().trim() }] };
    const user = await this.userModel.findOne(query);

    let memUser: any = null;
    if (!user) {
      memUser = this.authService.getMemUserById(id);
      if (!memUser) {
        throw new NotFoundException(`User with ID "${id}" was not found.`);
      }
    }

    const userIdStr = user ? user._id.toString() : memUser._id;
    const userRole = user ? user.role : memUser.role;
    const userMobile = user ? user.normalizedMobile || user.mobile : memUser.normalizedMobile || memUser.mobile;
    const userEmail = user ? user.email : memUser.email;
    const normalizedEmail = userEmail ? userEmail.toLowerCase().trim() : undefined;
    const userName = user ? user.name : memUser.name;

    // Security Rule 1: User cannot delete own account
    if (
      actor &&
      (userIdStr === actor.id ||
        (userMobile && userMobile === actor.normalizedMobile) ||
        (normalizedEmail && actor.email && normalizedEmail === actor.email.toLowerCase().trim()))
    ) {
      throw new BadRequestException('Administrators cannot delete their own account.');
    }

    // Security Rule 2: SUPER_ADMIN protection
    if (userRole === UserRole.SUPER_ADMIN && actor?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only a Super Administrator can delete another Super Administrator account.');
    }

    // Security Rule 3: Last active SUPER_ADMIN protection
    if (userRole === UserRole.SUPER_ADMIN) {
      const activeSuperAdmins = await this.userModel.countDocuments({
        role: UserRole.SUPER_ADMIN,
        status: AccountStatus.ACTIVE,
      }).catch(() => 0);
      if (activeSuperAdmins <= 1 && user?.status === AccountStatus.ACTIVE) {
        throw new BadRequestException('Cannot delete the sole remaining active Super Administrator account.');
      }
    }

    // Invalidate refresh sessions & revoke in-memory sessions
    try {
      if (userIdStr) {
        this.authService.revokeUserSessions(userIdStr);
      }
      const targetUserId = user ? user._id : userIdStr;
      if (typeof this.refreshSessionModel?.deleteMany === 'function') {
        await this.refreshSessionModel.deleteMany({ userId: targetUserId });
      }
    } catch (err: any) {
      this.logger.warn(`Session cleanup warning on user delete: ${err?.message}`);
    }

    // Cleanup: Agent verification & profile
    try {
      const targetUserId = user ? user._id : userIdStr;
      if (typeof this.agentDocumentModel?.deleteMany === 'function') {
        await this.agentDocumentModel.deleteMany({ userId: targetUserId });
      }
      if (typeof this.agentProfileModel?.deleteMany === 'function') {
        await this.agentProfileModel.deleteMany({ userId: targetUserId });
      }
    } catch (err: any) {
      this.logger.warn(`Agent profile cleanup note on delete: ${err?.message}`);
    }

    // Cleanup: Subscriptions & featured requests
    try {
      const targetUserId = user ? user._id : userIdStr;
      if (typeof this.subscriptionModel?.deleteMany === 'function') {
        await this.subscriptionModel.deleteMany({ userId: targetUserId });
      }
      if (typeof this.featuredRequestModel?.deleteMany === 'function') {
        await this.featuredRequestModel.deleteMany({ userId: targetUserId });
      }
    } catch (err: any) {
      this.logger.warn(`Subscription & request cleanup note on delete: ${err?.message}`);
    }

    // Delete DB user
    if (user) {
      if (typeof this.userModel.deleteMany === 'function') {
        await this.userModel.deleteMany({
          $or: [
            { _id: user._id },
            ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
            ...(userMobile ? [{ normalizedMobile: userMobile }, { mobile: userMobile }] : []),
          ],
        });
      } else if (typeof this.userModel.deleteOne === 'function') {
        await this.userModel.deleteOne({ _id: user._id });
      }
    } else if (normalizedEmail || userMobile) {
      if (typeof this.userModel.deleteMany === 'function') {
        await this.userModel.deleteMany({
          $or: [
            ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
            ...(userMobile ? [{ normalizedMobile: userMobile }, { mobile: userMobile }] : []),
          ],
        });
      }
    }

    // Delete memUser fallback across all identifier keys (ID, mobile, email)
    this.authService.deleteMemUser(id);
    if (userIdStr && userIdStr !== id) this.authService.deleteMemUser(userIdStr);
    if (userMobile) this.authService.deleteMemUser(userMobile);
    if (userEmail) this.authService.deleteMemUser(userEmail);
    if (normalizedEmail && normalizedEmail !== userEmail) this.authService.deleteMemUser(normalizedEmail);

    // Record Audit Log
    await this.recordAuditLog({
      action: 'USER_DELETED',
      actorUserId: actor?.id || 'system_admin',
      actorName: actor?.name || 'Administrator',
      actorRole: actor?.role || 'ADMIN',
      targetUserId: userIdStr,
      targetUserName: userName,
      targetEntity: 'USER',
      targetEntityId: userIdStr,
      previousValue: { name: userName, role: userRole, mobile: userMobile, email: userEmail },
      newValue: null,
      reason: reason || 'User account deleted by administrator',
    });

    return {
      success: true,
      message: `User ${userName || userMobile || userEmail} successfully deleted.`,
      deletedUserId: userIdStr,
    };
  }

  async bulkDeleteUsers(userIds: string[], reason?: string, actor?: AuthenticatedUser) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new BadRequestException('At least one user ID must be provided for bulk deletion.');
    }

    let deletedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const id of userIds) {
      try {
        await this.deleteUser(id, reason, actor);
        deletedCount++;
      } catch (err: any) {
        skippedCount++;
        errors.push(`User ${id}: ${err?.message || 'Failed to delete'}`);
      }
    }

    return {
      success: deletedCount > 0,
      deletedCount,
      skippedCount,
      message: `Bulk delete completed. ${deletedCount} user(s) deleted, ${skippedCount} skipped.`,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async bulkUpdateUserStatus(userIds: string[], status: AccountStatus, reason?: string, actor?: AuthenticatedUser) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new BadRequestException('At least one user ID must be provided for bulk status update.');
    }

    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const id of userIds) {
      try {
        await this.updateUserStatus(id, { status, reason }, actor);
        updatedCount++;
      } catch (err: any) {
        skippedCount++;
        errors.push(`User ${id}: ${err?.message || 'Failed to update status'}`);
      }
    }

    return {
      success: updatedCount > 0,
      updatedCount,
      skippedCount,
      message: `Bulk status update completed. ${updatedCount} user(s) set to ${status}, ${skippedCount} skipped.`,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Immediately synchronizes property listing visibility based on user account status.
   * When a user is suspended or deactivated, immediately hide all their properties publicly (isPublished: false, isSuspendedByAccount: true).
   * When reactivated to ACTIVE, restore their eligible listings (isPublished: true, isSuspendedByAccount: false).
   */
  async syncUserPropertyVisibility(
    userIds: string[],
    newStatus: AccountStatus,
    previousStatus?: AccountStatus,
  ) {
    if (!Array.isArray(userIds) || userIds.length === 0) return;

    try {
      if (
        newStatus === AccountStatus.SUSPENDED ||
        newStatus === AccountStatus.DEACTIVATED
      ) {
        const hideRes = await this.propertyModel.updateMany(
          {
            $or: [
              { ownerId: { $in: userIds } },
              { advertiserId: { $in: userIds } },
              { createdBy: { $in: userIds } },
            ],
            isPublished: true,
          },
          {
            $set: {
              isPublished: false,
              isSuspendedByAccount: true,
              suspendedAt: new Date(),
            },
          },
        );
        this.logger.log(
          `User suspension: hid ${hideRes.modifiedCount} property listings publicly for users [${userIds.join(', ')}]`,
        );
      } else if (
        newStatus === AccountStatus.ACTIVE &&
        (previousStatus === AccountStatus.SUSPENDED ||
          previousStatus === AccountStatus.DEACTIVATED ||
          !previousStatus)
      ) {
        const restoreRes = await this.propertyModel.updateMany(
          {
            $or: [
              { ownerId: { $in: userIds } },
              { advertiserId: { $in: userIds } },
              { createdBy: { $in: userIds } },
            ],
            isSuspendedByAccount: true,
          },
          {
            $set: {
              isPublished: true,
              isSuspendedByAccount: false,
              restoredAt: new Date(),
            },
          },
        );
        this.logger.log(
          `User reactivation: restored ${restoreRes.modifiedCount} property listings publicly for users [${userIds.join(', ')}]`,
        );
      }
    } catch (err: any) {
      this.logger.error(
        `Failed to sync property visibility for user account status change: ${err?.message}`,
      );
    }
  }

  async getAgents(dto: AdminUserQueryDto) {
    const queryDto: AdminUserQueryDto = {
      ...dto,
      role: undefined, // Handled explicitly below
    };

    const filter: any = {
      role: { $in: [UserRole.AGENT, UserRole.VERIFIED_AGENT] },
    };

    if (dto.q && dto.q.trim()) {
      const q = dto.q.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { name: regex },
        { mobile: regex },
        { normalizedMobile: regex },
        { agencyName: regex },
        { reraNumber: regex },
      ];
    }

    if (dto.status) {
      filter.status = dto.status;
    }

    if (dto.isVerifiedAgent !== undefined) {
      filter.isVerifiedAgent = dto.isVerifiedAgent;
    }

    const page = Math.max(1, Number(dto.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(dto.limit) || 20));
    const skip = (page - 1) * limit;

    const [dbTotal, dbAgents] = await Promise.all([
      this.userModel.countDocuments(filter).catch(() => 0),
      this.userModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().catch(() => []),
    ]);

    let agents = [...dbAgents];
    let total = dbTotal;

    if (agents.length === 0) {
      let memAgents = this.authService
        .getMemUsers()
        .filter((u) => u.role === UserRole.AGENT || u.role === UserRole.VERIFIED_AGENT)
        .map((m) => ({
          _id: m._id,
          name: m.name,
          mobile: m.mobile,
          normalizedMobile: m.normalizedMobile,
          email: m.email,
          role: m.role,
          status: m.status,
          isVerifiedAgent: m.isVerifiedAgent,
          agencyName: m.agencyName,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        })) as any[];

      if (dto.status) {
        memAgents = memAgents.filter((u) => u.status === dto.status);
      }
      if (dto.isVerifiedAgent !== undefined) {
        memAgents = memAgents.filter((u) => Boolean(u.isVerifiedAgent) === Boolean(dto.isVerifiedAgent));
      }
      if (dto.q && dto.q.trim()) {
        const q = dto.q.trim().toLowerCase();
        memAgents = memAgents.filter(
          (u) =>
            u.name?.toLowerCase().includes(q) ||
            u.mobile?.includes(q) ||
            u.normalizedMobile?.includes(q) ||
            u.agencyName?.toLowerCase().includes(q),
        );
      }

      total = memAgents.length;
      agents = memAgents.slice(skip, skip + limit);
    }

    const userIds = agents.map((u: any) => u._id.toString());
    const normalizedMobiles = agents.map((u: any) => u.normalizedMobile).filter(Boolean);

    let countMap = new Map<string, { total: number; published: number }>();
    try {
      const propertyCounts = await this.propertyModel.aggregate([
        {
          $match: {
            $or: [
              { ownerId: { $in: [...userIds, ...normalizedMobiles] } },
              { advertiserId: { $in: [...userIds, ...normalizedMobiles] } },
            ],
          },
        },
        {
          $group: {
            _id: { $ifNull: ['$ownerId', '$advertiserId'] },
            totalProperties: { $sum: 1 },
            publishedProperties: {
              $sum: { $cond: [{ $in: ['$status', ['PUBLISHED', 'ACTIVE']] }, 1, 0] },
            },
          },
        },
      ]);

      propertyCounts.forEach((pc: any) => {
        if (pc._id) {
          countMap.set(pc._id.toString(), {
            total: pc.totalProperties,
            published: pc.publishedProperties,
          });
        }
      });
    } catch (err: any) {
      this.logger.warn(`Property count aggregation for agents warning: ${err?.message}`);
    }

    const profiles = await this.agentProfileModel
      .find({ userId: { $in: userIds } })
      .lean();

    const profileMap = new Map();
    profiles.forEach((p: any) => {
      profileMap.set(p.userId, p);
    });

    const [docCounts, employeeAgg] = await Promise.all([
      this.agentDocumentModel.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]),
      this.userModel.aggregate([
        {
          $match: {
            $or: [
              { brokerId: { $in: userIds } },
              { parentUserId: { $in: userIds } },
              { agencyId: { $in: userIds } },
            ],
          },
        },
        {
          $group: {
            _id: {
              broker: { $ifNull: ['$brokerId', { $ifNull: ['$parentUserId', '$agencyId'] }] },
              status: '$status',
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const docMap = new Map();
    docCounts.forEach((d: any) => {
      docMap.set(d._id.toString(), d.count);
    });

    const employeeMap = new Map<string, { total: number; active: number; inactive: number }>();
    employeeAgg.forEach((item: any) => {
      const bId = item._id.broker?.toString();
      if (!bId) return;
      if (!employeeMap.has(bId)) {
        employeeMap.set(bId, { total: 0, active: 0, inactive: 0 });
      }
      const entry = employeeMap.get(bId)!;
      entry.total += item.count;
      if (item._id.status === 'ACTIVE') {
        entry.active += item.count;
      } else {
        entry.inactive += item.count;
      }
    });

    const data = agents.map((a: any) => {
      const counts = countMap.get(a._id.toString()) || countMap.get(a.normalizedMobile) || { total: 0, published: 0 };
      const prof = profileMap.get(a._id.toString());
      const empStats = employeeMap.get(a._id.toString()) || { total: 0, active: 0, inactive: 0 };
      return {
        id: a._id.toString(),
        _id: a._id.toString(),
        name: a.name || 'Agent',
        mobile: a.mobile,
        normalizedMobile: a.normalizedMobile,
        email: a.email,
        agencyName: a.agencyName || prof?.agencyName || 'Independent Real Estate Consultant',
        reraNumber: a.reraNumber || prof?.reraNumber || 'PENDING_SUBMISSION',
        isVerifiedAgent: Boolean(a.isVerifiedAgent),
        verificationStatus: prof?.verificationStatus || (a.isVerifiedAgent ? 'VERIFIED' : 'NOT_SUBMITTED'),
        role: a.role,
        status: a.status || 'ACTIVE',
        activeListings: counts.published,
        totalListings: counts.total,
        totalEmployees: empStats.total,
        activeEmployees: empStats.active,
        inactiveEmployees: empStats.inactive,
        documentsCount: docMap.get(a._id.toString()) || 0,
        createdAt: a.createdAt,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
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

  async getAgentVerificationDetail(id: string) {
    const query: any = isValidObjectId(id) ? { _id: id } : { normalizedMobile: id };
    const user = await this.userModel.findOne(query).lean();

    if (!user) {
      throw new NotFoundException(`Agent with ID "${id}" was not found.`);
    }

    const userId = user._id.toString();
    const profile = await this.agentProfileModel.findOne({ userId }).lean();
    const documents = await this.agentDocumentModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const auditHistory = await this.auditLogModel
      .find({ targetUserId: userId, action: { $in: ['AGENT_VERIFIED', 'AGENT_VERIFICATION_REVOKED', 'AGENT_DOCUMENT_REJECTED', 'AGENT_VERIFICATION_SUBMITTED'] } })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    // Query employees belonging to this Broker from real DB records
    const employees = await this.userModel
      .find({
        $or: [{ brokerId: userId }, { parentUserId: userId }, { agencyId: userId }],
      })
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();

    const activeEmployeesCount = employees.filter((e) => e.status === 'ACTIVE').length;
    const inactiveEmployeesCount = employees.length - activeEmployeesCount;

    return {
      agent: {
        id: userId,
        name: user.name,
        mobile: user.mobile,
        normalizedMobile: user.normalizedMobile,
        email: user.email,
        role: user.role,
        status: user.status,
        isVerifiedAgent: Boolean(user.isVerifiedAgent),
        agencyName: profile?.agencyName || user.agencyName,
        reraNumber: profile?.reraNumber || user.reraNumber,
        reraState: profile?.reraState || 'Uttar Pradesh',
        reraAuthority: profile?.reraAuthority || 'UP RERA',
        verificationStatus: profile?.verificationStatus || (user.isVerifiedAgent ? 'VERIFIED' : 'NOT_SUBMITTED'),
        verificationNotes: profile?.verificationNotes,
        rejectionReasons: profile?.rejectionReasons || [],
        experienceYears: profile?.experienceYears || 1,
        city: profile?.city || 'Lucknow',
        totalEmployees: employees.length,
        activeEmployees: activeEmployeesCount,
        inactiveEmployees: inactiveEmployeesCount,
        createdAt: user.createdAt,
      },
      documents: documents.map((d: any) => ({
        id: d._id.toString(),
        documentType: d.documentType,
        documentUrl: d.documentUrl,
        documentName: d.documentName,
        mimeType: d.mimeType,
        fileSize: d.fileSize,
        documentNumber: d.documentNumber,
        status: d.status,
        uploadedAt: d.uploadedAt,
        rejectionReason: d.rejectionReason,
      })),
      employees: employees.map((m: any) => ({
        id: m._id.toString(),
        name: m.name,
        email: m.email || '',
        mobile: m.mobile,
        normalizedMobile: m.normalizedMobile,
        designation: m.designation || 'Broker Associate',
        role: m.role,
        status: m.status || 'ACTIVE',
        permissions: m.grantedPermissions || m.permissions || [],
        assignedProperties: m.assignedProperties || [],
        createdAt: m.createdAt,
      })),
      employeeCounts: {
        total: employees.length,
        active: activeEmployeesCount,
        inactive: inactiveEmployeesCount,
      },
      auditHistory: auditHistory.map((a: any) => ({
        id: a._id.toString(),
        action: a.action,
        actorName: a.actorName,
        actorRole: a.actorRole,
        reason: a.reason,
        timestamp: a.timestamp,
      })),
    };
  }

  async getAgentEmployees(id: string) {
    const query: any = isValidObjectId(id) ? { _id: id } : { normalizedMobile: id };
    const user = await this.userModel.findOne(query).lean();
    if (!user) {
      throw new NotFoundException(`Agent/Broker with ID "${id}" was not found.`);
    }

    const brokerId = user._id.toString();
    const employees = await this.userModel
      .find({
        $or: [{ brokerId }, { parentUserId: brokerId }, { agencyId: brokerId }],
      })
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();

    const active = employees.filter((e) => e.status === 'ACTIVE').length;
    const inactive = employees.length - active;

    return {
      broker: {
        id: brokerId,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        agencyName: user.agencyName,
      },
      counts: {
        total: employees.length,
        active,
        inactive,
      },
      employees: employees.map((m: any) => ({
        id: m._id.toString(),
        name: m.name,
        email: m.email || '',
        mobile: m.mobile,
        normalizedMobile: m.normalizedMobile,
        designation: m.designation || 'Broker Associate',
        role: m.role,
        status: m.status || 'ACTIVE',
        permissions: m.grantedPermissions || m.permissions || [],
        assignedProperties: m.assignedProperties || [],
        createdAt: m.createdAt,
      })),
    };
  }

  // ==========================================
  // FEATURED PROPERTY REQUEST APPROVAL (Requirements 7 & 8)
  // ==========================================

  async getAdminFeaturedRequests(queryDto: any) {
    const filter: any = {};
    if (queryDto.status && queryDto.status !== 'ALL') {
      filter.status = queryDto.status;
    }
    if (queryDto.search) {
      const regex = new RegExp(queryDto.search.trim(), 'i');
      filter.$or = [
        { requestReference: regex },
        { brokerName: regex },
        { brokerEmail: regex },
        { brokerMobile: regex },
        { propertyTitle: regex },
      ];
    }

    const page = Math.max(1, Number(queryDto.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(queryDto.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, requests] = await Promise.all([
      this.featuredRequestModel.countDocuments(filter),
      this.featuredRequestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: requests,
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

  async approveFeaturedRequest(
    adminUser: AuthenticatedUser,
    requestId: string,
    dto?: { approvedDurationDays?: number; approvedStartDate?: string },
  ) {
    const query: any = {
      $or: [
        { _id: isValidObjectId(requestId) ? requestId : null },
        { requestReference: requestId },
      ].filter(Boolean),
    };
    const request = await this.featuredRequestModel.findOne(query);
    if (!request) {
      throw new NotFoundException(`Featured Property Request "${requestId}" was not found.`);
    }

    if (request.status !== FeaturedRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve request with status "${request.status}". Only PENDING requests can be approved.`,
      );
    }

    const propQuery: any = { $or: [{ id: request.propertyId }, { slug: request.propertySlug }] };
    if (isValidObjectId(request.propertyId)) {
      propQuery.$or.push({ _id: request.propertyId });
    }
    const property = await this.propertyModel.findOne(propQuery);
    if (!property) {
      throw new NotFoundException(`Property with ID "${request.propertyId}" was not found.`);
    }

    const approvedDurationDays =
      Number(dto?.approvedDurationDays) > 0
        ? Number(dto.approvedDurationDays)
        : request.durationDays;

    const approvedStartDate = dto?.approvedStartDate
      ? new Date(dto.approvedStartDate)
      : new Date();
    const approvedEndDate = new Date(
      approvedStartDate.getTime() + approvedDurationDays * 24 * 60 * 60 * 1000,
    );

    request.status = FeaturedRequestStatus.APPROVED;
    request.approvedDurationDays = approvedDurationDays;
    request.approvedStartDate = approvedStartDate;
    request.approvedEndDate = approvedEndDate;
    request.reviewedBy = adminUser.id;
    request.reviewedByName = adminUser.name || 'Super Admin';
    request.reviewedAt = new Date();
    await request.save();

    const now = new Date();
    if (approvedStartDate <= now) {
      property.isFeatured = true;
      property.featuredAt = approvedStartDate;
      property.featuredUntil = approvedEndDate;
    } else {
      property.featuredAt = approvedStartDate;
      property.featuredUntil = approvedEndDate;
    }
    await property.save();

    await this.auditLogModel.create({
      action: 'FEATURED_PROPERTY_APPROVED',
      actorUserId: adminUser.id,
      actorName: adminUser.name || 'Super Admin',
      actorRole: adminUser.role || 'SUPER_ADMIN',
      targetEntity: 'FEATURED_REQUEST',
      targetEntityId: request._id.toString(),
      metadata: {
        requestReference: request.requestReference,
        propertyId: property.id,
        durationDays: approvedDurationDays,
        approvedEndDate,
      },
      timestamp: new Date(),
    });

    return {
      success: true,
      message: `Featured placement approved for "${request.propertyTitle}" for ${approvedDurationDays} days (active until ${approvedEndDate.toLocaleDateString('en-IN')}).`,
      request,
    };
  }

  async rejectFeaturedRequest(
    adminUser: AuthenticatedUser,
    requestId: string,
    dto?: { reason?: string },
  ) {
    const query: any = {
      $or: [
        { _id: isValidObjectId(requestId) ? requestId : null },
        { requestReference: requestId },
      ].filter(Boolean),
    };
    const request = await this.featuredRequestModel.findOne(query);
    if (!request) {
      throw new NotFoundException(`Featured Property Request "${requestId}" was not found.`);
    }

    if (request.status !== FeaturedRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject request with status "${request.status}". Only PENDING requests can be rejected.`,
      );
    }

    request.status = FeaturedRequestStatus.REJECTED;
    request.rejectionReason =
      dto?.reason?.trim() || 'Request does not meet marketplace promotion standards.';
    request.reviewedBy = adminUser.id;
    request.reviewedByName = adminUser.name || 'Super Admin';
    request.reviewedAt = new Date();
    await request.save();

    const propQuery: any = { $or: [{ id: request.propertyId }, { slug: request.propertySlug }] };
    if (isValidObjectId(request.propertyId)) {
      propQuery.$or.push({ _id: request.propertyId });
    }
    await this.propertyModel.updateOne(propQuery, { $set: { isFeatured: false } });

    await this.auditLogModel.create({
      action: 'FEATURED_PROPERTY_REJECTED',
      actorUserId: adminUser.id,
      actorName: adminUser.name || 'Super Admin',
      actorRole: adminUser.role || 'SUPER_ADMIN',
      targetEntity: 'FEATURED_REQUEST',
      targetEntityId: request._id.toString(),
      reason: request.rejectionReason,
      metadata: { requestReference: request.requestReference, propertyId: request.propertyId },
      timestamp: new Date(),
    });

    return {
      success: true,
      message: `Featured property request rejected. Reason: ${request.rejectionReason}`,
      request,
    };
  }

  async verifyAgent(id: string, notes?: string, actor?: AuthenticatedUser) {
    const query: any = isValidObjectId(id) ? { _id: id } : { normalizedMobile: id };
    const user = await this.userModel.findOne(query);

    if (!user) {
      throw new NotFoundException(`Agent with ID "${id}" was not found.`);
    }

    if (user.platformRole === PlatformRole.SUPER_ADMIN || user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Super Administrator accounts cannot be modified via agent KYC verification.');
    }

    const previousState = {
      isVerifiedAgent: user.isVerifiedAgent,
      role: user.role,
      status: user.status,
      kycStatus: user.kycStatus,
    };

    user.isVerifiedAgent = true;
    user.role = UserRole.VERIFIED_AGENT;
    user.status = AccountStatus.ACTIVE;
    user.kycStatus = 'APPROVED';
    user.kycApprovedAt = new Date();
    user.kycApprovedBy = actor?.name || actor?.id || 'admin';
    user.kycRejectionReason = undefined;

    // Requirement 7 & 8: 3-day Free Trial starts ONLY after Super Admin approves KYC/account
    const trialDays = 3;
    const now = new Date();
    user.isTrialActive = true;
    user.trialStartedAt = now;
    user.trialExpiresAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    try {
      const trialPackage = await this.packageModel.findOne({
        slug: { $in: ['free-trial', 'trial', 'free'] },
      });
      if (trialPackage) {
        user.trialPackageId = trialPackage._id.toString();
      }
    } catch (e) {
      // ignore
    }

    await user.save();

    const userId = user._id.toString();

    // Update AgentProfile
    await this.agentProfileModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          isVerifiedAgent: true,
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
          verifiedBy: actor?.id || 'admin',
          verificationNotes: notes,
          rejectionReasons: [],
        },
      },
      { upsert: true },
    );

    // Approve pending documents
    await this.agentDocumentModel.updateMany(
      { userId, status: 'PENDING' },
      { $set: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy: actor?.id || 'admin' } },
    );

    // Send WhatsApp notification
    try {
      await this.whatsappService.sendKycApprovedNotification({
        userId,
        customerName: user.name,
        customerMobile: user.mobile,
        accountType: user.accountType || user.role,
        status: 'APPROVED',
        trialExpiresAt: user.trialExpiresAt,
      });
    } catch (err: any) {
      this.logger.warn(`Failed to dispatch KYC approval WhatsApp: ${err.message}`);
    }

    // Send Email notification (only if email is provided and service is configured)
    if (user.email && this.mailService) {
      try {
        await this.mailService.sendKycApprovedEmail(user.email, user.name, user.trialExpiresAt);
      } catch (err: any) {
        this.logger.warn(`Failed to dispatch KYC approval email: ${err.message}`);
      }
    }

    // Record Audit Log
    await this.recordAuditLog({
      action: 'AGENT_VERIFIED',
      actorUserId: actor?.id || 'system_admin',
      actorName: actor?.name || 'Administrator',
      actorRole: actor?.role || 'ADMIN',
      targetUserId: userId,
      targetUserName: user.name,
      targetEntity: 'AGENT_VERIFICATION',
      targetEntityId: userId,
      previousValue: previousState,
      newValue: {
        isVerifiedAgent: true,
        role: UserRole.VERIFIED_AGENT,
        verificationStatus: 'VERIFIED',
        isTrialActive: true,
        trialExpiresAt: user.trialExpiresAt,
      },
      reason: notes || 'CASA Verified Agent badge granted by administrator. 3-day Free Trial activated.',
    });

    return {
      success: true,
      message: `CASA Verified Agent badge granted to ${user.name}. 3-day Free Trial is now active.`,
      agent: {
        id: userId,
        name: user.name,
        agencyName: user.agencyName,
        reraNumber: user.reraNumber,
        isVerifiedAgent: true,
        role: user.role,
        status: user.status,
        kycStatus: 'APPROVED',
        isTrialActive: true,
        trialExpiresAt: user.trialExpiresAt,
        verificationStatus: 'VERIFIED',
      },
    };
  }

  async rejectAgentVerification(id: string, reason: string, actor?: AuthenticatedUser) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('A reason is strictly required when rejecting agent verification.');
    }

    const query: any = isValidObjectId(id) ? { _id: id } : { normalizedMobile: id };
    const user = await this.userModel.findOne(query);

    if (!user) {
      throw new NotFoundException(`Agent with ID "${id}" was not found.`);
    }

    if (user.platformRole === PlatformRole.SUPER_ADMIN || user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Super Administrator accounts cannot be modified via agent KYC verification.');
    }

    const userId = user._id.toString();
    user.kycStatus = 'REJECTED';
    user.kycRejectionReason = reason.trim();
    user.isVerifiedAgent = false;
    await user.save();

    // Update AgentProfile
    await this.agentProfileModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          verificationStatus: 'REJECTED',
          isVerifiedAgent: false,
          rejectionReasons: [reason.trim()],
        },
      },
      { upsert: true },
    );

    // Reject pending documents
    await this.agentDocumentModel.updateMany(
      { userId, status: 'PENDING' },
      { $set: { status: 'REJECTED', rejectionReason: reason.trim(), reviewedAt: new Date(), reviewedBy: actor?.id || 'admin' } },
    );

    // Send WhatsApp notification
    try {
      await this.whatsappService.sendKycRejectedNotification({
        userId,
        customerName: user.name,
        customerMobile: user.mobile,
        accountType: user.accountType || user.role,
        status: 'REJECTED',
        reason: reason.trim(),
      });
    } catch (err: any) {
      this.logger.warn(`Failed to dispatch KYC rejection WhatsApp: ${err.message}`);
    }

    // Send Email notification (only if email is provided and service is configured)
    if (user.email && this.mailService) {
      try {
        await this.mailService.sendKycRejectedEmail(user.email, user.name, reason.trim());
      } catch (err: any) {
        this.logger.warn(`Failed to dispatch KYC rejection email: ${err.message}`);
      }
    }

    // Record Audit Log
    await this.recordAuditLog({
      action: 'AGENT_DOCUMENT_REJECTED',
      actorUserId: actor?.id || 'system_admin',
      actorName: actor?.name || 'Administrator',
      actorRole: actor?.role || 'ADMIN',
      targetUserId: userId,
      targetUserName: user.name,
      targetEntity: 'AGENT_VERIFICATION',
      targetEntityId: userId,
      previousValue: { verificationStatus: 'PENDING' },
      newValue: { verificationStatus: 'REJECTED', rejectionReason: reason.trim() },
      reason: reason.trim(),
    });

    return {
      success: true,
      message: `Agent verification application for ${user.name} was rejected.`,
      agent: {
        id: userId,
        name: user.name,
        verificationStatus: 'REJECTED',
        kycStatus: 'REJECTED',
        rejectionReason: reason.trim(),
      },
    };
  }

  async getKycVerificationQueue(queryDto?: {
    status?: string;
    accountType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(queryDto?.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(queryDto?.limit) || 20));
    const skip = (page - 1) * limit;

    // Cross-collection consistency: Query users with pending/approved/rejected verification documents or profiles
    const [pendingDocUserIds, pendingProfileUserIds] = await Promise.all([
      this.agentDocumentModel.distinct('userId', { status: 'PENDING' }),
      this.agentProfileModel.distinct('userId', { verificationStatus: 'PENDING' }),
    ]);
    const allPendingUserIds = Array.from(new Set([...pendingDocUserIds, ...pendingProfileUserIds]));

    // Self-heal: ensure users with pending documents/profiles reflect kycStatus: 'PENDING'
    if (allPendingUserIds.length > 0) {
      await this.userModel.updateMany(
        { _id: { $in: allPendingUserIds }, kycStatus: { $ne: 'PENDING' } },
        { $set: { kycStatus: 'PENDING' } },
      );
    }

    const filter: any = {};

    if (queryDto?.status && queryDto.status !== 'ALL') {
      if (queryDto.status === 'PENDING') {
        filter.$or = [
          { kycStatus: 'PENDING' },
          { _id: { $in: allPendingUserIds } },
        ];
      } else {
        filter.kycStatus = queryDto.status;
      }
    } else {
      filter.$or = [
        { kycStatus: { $in: ['PENDING', 'APPROVED', 'REJECTED', 'NOT_SUBMITTED'] } },
        { _id: { $in: allPendingUserIds } },
        {
          accountType: {
            $in: [
              AccountType.BROKER_AGENCY,
              AccountType.BROKER,
              AccountType.BROKER_AGENT,
              AccountType.DEVELOPER,
            ],
          },
        },
        { role: { $in: [UserRole.AGENT, UserRole.VERIFIED_AGENT] } },
      ];
    }

    if (queryDto?.accountType && queryDto.accountType !== 'ALL') {
      filter.accountType = queryDto.accountType;
    }

    if (queryDto?.search && queryDto.search.trim()) {
      const regex = new RegExp(queryDto.search.trim(), 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [{ name: regex }, { mobile: regex }, { email: regex }, { agencyName: regex }],
      });
    }

    const exemptAccountTypes = [AccountType.BUYER, AccountType.TENANT];
    const exemptRoles = [
      UserRole.BUYER,
      UserRole.TENANT,
      UserRole.PURCHASER,
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
    ];
    const exemptPlatformRoles = [PlatformRole.SUPER_ADMIN, PlatformRole.ADMIN];

    filter.$and = filter.$and || [];
    filter.$and.push(
      { accountType: { $nin: exemptAccountTypes } },
      { role: { $nin: exemptRoles } },
      { platformRole: { $nin: exemptPlatformRoles } },
    );

    const baseExemptFilter = {
      accountType: { $nin: exemptAccountTypes },
      role: { $nin: exemptRoles },
      platformRole: { $nin: exemptPlatformRoles },
    };

    // Prioritize PENDING requests at the very top of the queue, followed by REJECTED, APPROVED, NOT_SUBMITTED
    const [total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      this.userModel.countDocuments(filter),
      this.userModel.countDocuments({
        ...baseExemptFilter,
        $or: [{ kycStatus: 'PENDING' }, { _id: { $in: allPendingUserIds } }],
      }),
      this.userModel.countDocuments({ ...baseExemptFilter, kycStatus: 'APPROVED' }),
      this.userModel.countDocuments({ ...baseExemptFilter, kycStatus: 'REJECTED' }),
    ]);

    const pipeline: any[] = [
      { $match: filter },
      {
        $addFields: {
          statusOrder: {
            $switch: {
              branches: [
                { case: { $eq: ['$kycStatus', 'PENDING'] }, then: 1 },
                { case: { $eq: ['$kycStatus', 'REJECTED'] }, then: 2 },
                { case: { $eq: ['$kycStatus', 'APPROVED'] }, then: 3 },
              ],
              default: 4,
            },
          },
        },
      },
      { $sort: { statusOrder: 1, updatedAt: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const users = await this.userModel.aggregate(pipeline);

    const userIds = users.map((u: any) => u._id.toString());
    const [agentDocs, agentProfiles, packages] = await Promise.all([
      this.agentDocumentModel.find({ userId: { $in: userIds } }).sort({ uploadedAt: -1 }).lean(),
      this.agentProfileModel.find({ userId: { $in: userIds } }).lean(),
      this.packageModel.find().lean(),
    ]);

    const docsByUserId = new Map<string, any[]>();
    agentDocs.forEach((d: any) => {
      const arr = docsByUserId.get(d.userId) || [];
      arr.push(d);
      docsByUserId.set(d.userId, arr);
    });

    const profilesByUserId = new Map<string, any>();
    agentProfiles.forEach((p: any) => profilesByUserId.set(p.userId, p));

    const packageMap = new Map<string, any>();
    packages.forEach((pkg: any) => packageMap.set(pkg._id.toString(), pkg));

    const items = users.map((u: any) => {
      const uid = u._id.toString();
      const docs = docsByUserId.get(uid) || [];
      const profile = profilesByUserId.get(uid);
      const activePkg = u.activePackageId ? packageMap.get(u.activePackageId.toString()) : null;
      const trialPkg = u.trialPackageId ? packageMap.get(u.trialPackageId.toString()) : null;

      let frontDoc = u.kycFrontDocumentUrl || null;
      let backDoc = u.kycBackDocumentUrl || null;
      let docType = u.kycDocumentType || null;
      let docNumber = u.kycDocumentNumber || null;

      if (!frontDoc && docs.length > 0) {
        frontDoc = docs[0].frontDocumentUrl || docs[0].documentUrl || null;
        backDoc = docs[0].backDocumentUrl || null;
        docType = docs[0].documentType || null;
        docNumber = docs[0].documentNumber || null;
      }

      const hasPendingDoc = docs.some((d: any) => d.status === 'PENDING');
      const resolvedKycStatus = hasPendingDoc
        ? 'PENDING'
        : u.kycStatus || (docs.length > 0 ? docs[0].status : (profile?.verificationStatus === 'VERIFIED' ? 'APPROVED' : profile?.verificationStatus || 'NOT_SUBMITTED'));

      return {
        id: uid,
        name: u.name,
        mobile: u.mobile,
        normalizedMobile: u.normalizedMobile,
        email: u.email,
        role: u.role,
        accountType: u.accountType || (u.role === UserRole.AGENT ? AccountType.BROKER : u.role),
        status: u.status,
        isVerifiedAgent: Boolean(u.isVerifiedAgent),
        agencyName: u.agencyName || profile?.agencyName || null,
        reraNumber: u.reraNumber || profile?.reraNumber || null,
        kycStatus: resolvedKycStatus,
        kycApprovedAt: u.kycApprovedAt || null,
        kycApprovedBy: u.kycApprovedBy || null,
        kycRejectionReason: u.kycRejectionReason || (docs.length > 0 ? docs[0].rejectionReason : null),
        kycDocumentType: docType,
        kycDocumentNumber: docNumber,
        kycFrontDocumentUrl: frontDoc,
        kycBackDocumentUrl: backDoc,
        documents: docs.map((d: any) => ({
          id: d._id.toString(),
          documentType: d.documentType,
          documentUrl: d.documentUrl,
          frontDocumentUrl: d.frontDocumentUrl || d.documentUrl,
          backDocumentUrl: d.backDocumentUrl || null,
          documentName: d.documentName,
          documentNumber: d.documentNumber,
          status: d.status,
          uploadedAt: d.uploadedAt,
          rejectionReason: d.rejectionReason,
        })),
        isTrialActive: Boolean(u.isTrialActive),
        trialStartedAt: u.trialStartedAt || null,
        trialExpiresAt: u.trialExpiresAt || null,
        activePackage: activePkg ? { id: activePkg._id.toString(), name: activePkg.name } : null,
        trialPackage: trialPkg ? { id: trialPkg._id.toString(), name: trialPkg.name } : null,
        createdAt: u.createdAt,
      };
    });

    const counts = {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      total,
    };

    const pagination = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
      totalPages: Math.ceil(total / limit) || 1,
    };

    return {
      success: true,
      items,
      counts,
      metrics: counts,
      pagination,
    };
  }

  async assignUserPackage(userId: string, packageId: string, actor?: AuthenticatedUser) {
    const query: any = isValidObjectId(userId) ? { _id: userId } : { normalizedMobile: userId };
    const user = await this.userModel.findOne(query);

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const pkgQuery: any = isValidObjectId(packageId) ? { _id: packageId } : { slug: packageId };
    const pkg = await this.packageModel.findOne(pkgQuery);

    if (!pkg) {
      throw new NotFoundException(`Package "${packageId}" not found`);
    }

    const prevPackage = user.activePackageId;
    user.activePackageId = pkg._id.toString();
    user.isTrialActive = false;
    await user.save();

    // Send WhatsApp notification
    try {
      await this.whatsappService.sendPackageChangedNotification({
        userId: user._id.toString(),
        customerName: user.name,
        customerMobile: user.mobile,
        accountType: user.accountType || user.role,
        packageName: pkg.name,
      });
    } catch (err: any) {
      this.logger.warn(`Failed to dispatch package change WhatsApp: ${err.message}`);
    }

    // Record Audit Log
    await this.recordAuditLog({
      action: 'USER_PACKAGE_ASSIGNED',
      actorUserId: actor?.id || 'system_admin',
      actorName: actor?.name || 'Administrator',
      actorRole: actor?.role || 'ADMIN',
      targetUserId: user._id.toString(),
      targetUserName: user.name,
      targetEntity: 'USER_PACKAGE',
      targetEntityId: pkg._id.toString(),
      previousValue: { activePackageId: prevPackage },
      newValue: { activePackageId: pkg._id.toString(), packageName: pkg.name },
      reason: `Package ${pkg.name} manually assigned by ${actor?.name || 'administrator'}`,
    });

    return {
      success: true,
      message: `Package "${pkg.name}" successfully assigned to ${user.name}.`,
      user: {
        id: user._id.toString(),
        name: user.name,
        activePackageId: user.activePackageId,
        packageName: pkg.name,
      },
    };
  }

  async revokeAgentVerification(id: string, reason?: string, actor?: AuthenticatedUser) {
    const query: any = isValidObjectId(id) ? { _id: id } : { normalizedMobile: id };
    const user = await this.userModel.findOne(query);

    if (!user) {
      throw new NotFoundException(`Agent with ID "${id}" was not found.`);
    }

    const previousState = { isVerifiedAgent: user.isVerifiedAgent, role: user.role };
    user.isVerifiedAgent = false;
    if (user.role === UserRole.VERIFIED_AGENT) {
      user.role = UserRole.AGENT;
    }
    await user.save();

    const userId = user._id.toString();

    // Update AgentProfile
    await this.agentProfileModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          isVerifiedAgent: false,
          verificationStatus: 'NOT_SUBMITTED',
          rejectionReasons: reason ? [reason] : [],
        },
      },
      { upsert: true },
    );

    // Record Audit Log
    await this.recordAuditLog({
      action: 'AGENT_VERIFICATION_REVOKED',
      actorUserId: actor?.id || 'system_admin',
      actorName: actor?.name || 'Administrator',
      actorRole: actor?.role || 'ADMIN',
      targetUserId: userId,
      targetUserName: user.name,
      targetEntity: 'AGENT_VERIFICATION',
      targetEntityId: userId,
      previousValue: previousState,
      newValue: { isVerifiedAgent: false, role: user.role },
      reason: reason || 'CASA Verified Agent badge revoked by administrator.',
    });

    return {
      success: true,
      message: `CASA Verified Agent badge revoked from ${user.name}.`,
      agent: {
        id: userId,
        name: user.name,
        agencyName: user.agencyName,
        reraNumber: user.reraNumber,
        isVerifiedAgent: false,
        role: user.role,
      },
    };
  }

  async getPurchasers(dto: AdminUserQueryDto & { category?: string }) {
    const filter: any = {};
    const now = new Date();

    // Category filtering
    if (dto.category === 'FREE_TRIAL') {
      filter.$or = [
        { trialStartedAt: { $ne: null } },
        { trialPackageId: { $ne: null } },
      ];
    } else if (dto.category === 'PAID') {
      filter.activePackageId = { $ne: null };
    } else if (dto.category === 'EXPIRED') {
      filter.trialExpiresAt = { $lt: now };
    } else if (dto.category === 'BUYER') {
      filter.role = { $in: [UserRole.BUYER, UserRole.PURCHASER] };
    } else {
      // By default show purchasers, trial users, subscribers, or buyers
      filter.$or = [
        { role: { $in: [UserRole.PURCHASER, UserRole.BUYER] } },
        { trialPackageId: { $ne: null } },
        { trialStartedAt: { $ne: null } },
        { activePackageId: { $ne: null } },
      ];
    }

    if (dto.q && dto.q.trim()) {
      const q = dto.q.trim();
      const regex = new RegExp(q, 'i');
      filter.$and = [
        {
          $or: [
            { name: regex },
            { mobile: regex },
            { normalizedMobile: regex },
            { email: regex },
          ],
        },
      ];
    }

    if (dto.status && (dto.status as any) !== 'ALL') {
      filter.status = dto.status;
    }

    const page = Math.max(1, Number(dto.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(dto.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      this.userModel.countDocuments(filter),
      this.userModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    // Collect package IDs to bulk fetch plan details
    const pkgIds = new Set<string>();
    users.forEach((u: any) => {
      if (u.trialPackageId) pkgIds.add(u.trialPackageId.toString());
      if (u.activePackageId) pkgIds.add(u.activePackageId.toString());
    });

    const packages = await this.packageModel.find({ _id: { $in: Array.from(pkgIds) } }).lean();
    const pkgMap = new Map<string, any>();
    packages.forEach((pkg: any) => {
      pkgMap.set(pkg._id.toString(), pkg);
    });

    const currentTime = Date.now();

    const data = users.map((p: any) => {
      const trialPkg = p.trialPackageId ? pkgMap.get(p.trialPackageId.toString()) : null;
      const activePkg = p.activePackageId ? pkgMap.get(p.activePackageId.toString()) : null;
      const currentPkg = activePkg || trialPkg;

      const isTrial = Boolean(p.trialExpiresAt || p.trialPackageId || p.trialStartedAt);
      const expiresAt = p.trialExpiresAt ? new Date(p.trialExpiresAt) : null;
      const isExpired = expiresAt ? currentTime > expiresAt.getTime() : false;
      const daysRemaining =
        expiresAt && !isExpired
          ? Math.max(1, Math.ceil((expiresAt.getTime() - currentTime) / (1000 * 60 * 60 * 24)))
          : 0;

      let planCategory = 'FREE_PLAN';
      if (activePkg) planCategory = 'PAID_PLAN';
      else if (isTrial && isExpired) planCategory = 'TRIAL_EXPIRED';
      else if (isTrial) planCategory = 'FREE_TRIAL';

      return {
        id: p._id.toString(),
        _id: p._id.toString(),
        name: p.name || 'CASA User',
        mobile: p.mobile,
        normalizedMobile: p.normalizedMobile,
        email: p.email,
        role: p.role,
        accountType: p.accountType || null,
        status: p.status || 'ACTIVE',
        // Plan & Package details
        planName: currentPkg ? currentPkg.name : (isTrial ? '3-Day Free Trial' : 'Free Buyer Plan'),
        planSlug: currentPkg ? currentPkg.slug : (isTrial ? 'trial-3-day' : 'free-buyer'),
        planPrice: currentPkg ? currentPkg.price : 0,
        billingPeriod: currentPkg ? currentPkg.billingPeriod : (isTrial ? '3_DAYS_TRIAL' : 'FREE'),
        planCategory,
        isTrial,
        isExpired,
        trialStartedAt: p.trialStartedAt || null,
        trialExpiresAt: p.trialExpiresAt || null,
        daysRemaining,
        savedProperties: 0,
        totalEnquiries: 0,
        lastLoginAt: p.lastLoginAt || p.updatedAt || p.createdAt,
        createdAt: p.createdAt,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
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

  async getAuditLogs(dto: AdminAuditQueryDto) {
    const filter: any = {};

    if (dto.action) {
      filter.action = dto.action;
    }
    if (dto.actorUserId) {
      filter.actorUserId = dto.actorUserId;
    }
    if (dto.targetUserId) {
      filter.targetUserId = dto.targetUserId;
    }
    if (dto.q && dto.q.trim()) {
      const q = dto.q.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { action: regex },
        { actorName: regex },
        { targetUserName: regex },
        { reason: regex },
      ];
    }

    const page = Math.max(1, Number(dto.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(dto.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.auditLogModel.countDocuments(filter),
      this.auditLogModel.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: items.map((item: any) => ({
        id: item._id.toString(),
        _id: item._id.toString(),
        action: item.action,
        actorUserId: item.actorUserId,
        actorName: item.actorName,
        actorRole: item.actorRole,
        targetUserId: item.targetUserId,
        targetUserName: item.targetUserName,
        targetEntity: item.targetEntity,
        targetEntityId: item.targetEntityId,
        previousValue: item.previousValue,
        newValue: item.newValue,
        reason: item.reason,
        ipAddress: item.ipAddress,
        timestamp: item.timestamp || item.createdAt,
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

  // =========================================================================
  // REAL-TIME NOTIFICATIONS & ENQUIRY DISPATCHER
  // =========================================================================

  async getAdminNotifications(query: { limit?: number; type?: string; unreadOnly?: boolean } = {}) {
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 40));

    // 1. Fetch Inquiries / Leads from MongoDB
    const leadFilter: any = {};
    if (query.unreadOnly) {
      leadFilter.status = 'NEW';
    }
    const recentLeads = await this.leadModel
      .find(leadFilter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    // 2. Fetch Pending Property Moderations
    const pendingProperties = await this.propertyModel
      .find({ status: { $in: ['PENDING_REVIEW', 'PENDING_APPROVAL'] } })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
      .exec();

    // 3. Fetch Pending KYC Submissions
    const pendingKycs = await this.agentDocumentModel
      .find({ status: 'PENDING' })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
      .exec();

    // 4. Fetch Recent Paid Transactions / Subscriptions
    const recentPayments = await this.paymentModel
      .find({ status: PaymentStatus.PAID })
      .sort({ createdAt: -1 })
      .limit(15)
      .lean()
      .exec();

    // Build normalized notification items
    const notifications: any[] = [];

    // Map Inquiries / Leads
    for (const lead of recentLeads) {
      notifications.push({
        id: `lead_${lead._id}`,
        rawId: lead._id.toString(),
        type: 'INQUIRY',
        badgeLabel: 'Buyer Enquiry',
        title: `Property Enquiry from ${lead.name || lead.contactName || 'Buyer'}`,
        desc: lead.message || (lead as any).subject || 'Expressed purchase/rental interest',
        time: lead.createdAt ? new Date(lead.createdAt).toISOString() : new Date().toISOString(),
        senderName: lead.name || lead.contactName || 'Buyer',
        senderPhone: lead.mobile || lead.contactPhone || '',
        senderEmail: lead.email || (lead as any).contactEmail || '',
        propertyTitle: (lead as any).propertyTitle || 'Listing Inquiry',
        propertyId: lead.propertyId || '',
        priority: lead.priority || 'MEDIUM',
        status: lead.status || 'NEW',
        isRead: lead.status !== 'NEW',
        link: `/enquiries`,
      });
    }

    // Map Pending Property Moderation
    for (const prop of pendingProperties) {
      const propTitle = typeof prop.title === 'string' ? prop.title : (prop as any).title?.en || 'New Property';
      notifications.push({
        id: `prop_${prop._id}`,
        rawId: prop._id.toString(),
        type: 'MODERATION',
        badgeLabel: 'Property Review',
        title: `New Property Listing Submitted: ${propTitle}`,
        desc: `${(prop as any).location?.locality || ''}, ${(prop as any).location?.city || ''} (Price: ₹${(prop as any).price?.amount?.toLocaleString('en-IN') || '0'})`,
        time: (prop as any).createdAt ? new Date((prop as any).createdAt).toISOString() : new Date().toISOString(),
        senderName: (prop as any).advertiser?.name || 'Property Owner',
        senderPhone: (prop as any).advertiser?.phone || '',
        propertyTitle: propTitle,
        propertyId: prop._id.toString(),
        status: (prop as any).status || 'PENDING_REVIEW',
        isRead: false,
        link: `/moderation`,
      });
    }

    // Map KYC Submissions
    for (const kyc of pendingKycs) {
      const k = kyc as any;
      notifications.push({
        id: `kyc_${k._id}`,
        rawId: k._id.toString(),
        type: 'KYC',
        badgeLabel: 'Agent KYC',
        title: `Agent Verification Document Uploaded: ${k.documentType || 'RERA/ID'}`,
        desc: `Document: ${k.documentNumber || k.fileName || 'Pending agent identity validation'}`,
        time: k.createdAt ? new Date(k.createdAt).toISOString() : new Date().toISOString(),
        senderName: `Agent (${k.agentId?.toString().slice(-6) || 'KYC'})`,
        status: 'PENDING',
        isRead: false,
        link: `/kyc`,
      });
    }

    // Map Payments
    for (const pay of recentPayments) {
      const p = pay as any;
      notifications.push({
        id: `pay_${p._id}`,
        rawId: p._id.toString(),
        type: 'BILLING',
        badgeLabel: 'Subscription Billing',
        title: `Payment Processed: ₹${p.amount?.toLocaleString('en-IN') || 0}`,
        desc: `Purpose: ${p.purpose || 'Subscription'} | Gateway Ref: ${p.gatewayOrderId || p.razorpayPaymentId || 'Verified'}`,
        time: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
        status: 'PAID',
        isRead: true,
        link: `/payments`,
      });
    }

    // Sort by timestamp descending
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Filter by type if requested
    let filtered = notifications;
    if (query.type && query.type !== 'ALL') {
      filtered = filtered.filter((n) => n.type === query.type);
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
      success: true,
      data: filtered.slice(0, limit),
      unreadCount,
      total: notifications.length,
      timestamp: new Date().toISOString(),
    };
  }

  async markAdminNotificationRead(id: string) {
    if (id.startsWith('lead_')) {
      const rawId = id.replace('lead_', '');
      if (isValidObjectId(rawId)) {
        await this.leadModel.updateOne({ _id: rawId, status: 'NEW' }, { $set: { status: 'CONTACTED' } });
      }
    }
    return { success: true, message: 'Notification marked as read' };
  }

  async markAllAdminNotificationsRead() {
    await this.leadModel.updateMany({ status: 'NEW' }, { $set: { status: 'CONTACTED' } });
    return { success: true, message: 'All notifications marked as read' };
  }

  // =========================================================================
  // SYSTEM & COMPANY HOTLINE SETTINGS
  // =========================================================================

  async getSystemSettings(): Promise<SystemSettingDocument> {
    let settings = await this.systemSettingModel.findOne().exec();
    if (!settings) {
      settings = await this.systemSettingModel.create({
        appName: 'myproperty Marketplace',
        companySalesNumber: '+91 98765 43210',
        companySalesWhatsapp: '+91 98765 43210',
        companyServiceNumber: '+91 98765 43211',
        customerSupportPhone: '+91 70697 54589',
        companySalesEmail: 'sales@myproperty.com',
        companySupportEmail: 'support@myproperty.com',
        companyAddress: 'Vibhuti Khand, Gomti Nagar, Lucknow, Uttar Pradesh, 226010',
        trialDays: 3,
        smsProvider: 'msg91',
        smsSenderId: 'MYPROP',
        otpExpiryMinutes: 5,
      });
    }
    return settings;
  }

  async updateSystemSettings(dto: Partial<SystemSetting>): Promise<SystemSettingDocument> {
    let settings = await this.systemSettingModel.findOne().exec();
    if (!settings) {
      settings = await this.systemSettingModel.create(dto);
    } else {
      Object.assign(settings, dto);
      await settings.save();
    }
    this.logger.log('⚙️ Platform Governance and Company Contact settings updated successfully.');
    return settings;
  }

  async getPublicSettings() {
    const settings = await this.getSystemSettings();
    return {
      appName: settings.appName || 'myproperty',
      companySalesNumber: settings.companySalesNumber || '+91 98765 43210',
      companySalesWhatsapp: settings.companySalesWhatsapp || settings.companySalesNumber || '+91 98765 43210',
      companyServiceNumber: settings.companyServiceNumber || '+91 98765 43211',
      customerSupportPhone: settings.customerSupportPhone || '+91 70697 54589',
      companySalesEmail: settings.companySalesEmail || 'sales@myproperty.com',
      companySupportEmail: settings.companySupportEmail || 'support@myproperty.com',
      companyAddress: settings.companyAddress || 'Vibhuti Khand, Gomti Nagar, Lucknow, UP',
      trialDays: settings.trialDays || 3,
    };
  }
}

