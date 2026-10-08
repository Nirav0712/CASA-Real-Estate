import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  OnModuleInit,
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
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
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
    private readonly authService: AuthService,
  ) {}

  async onModuleInit() {
    await this.ensureInitialPendingFixtures();
  }

  private async ensureInitialPendingFixtures() {
    try {
      const pendingCount = await this.propertyModel.countDocuments({
        status: { $in: ['PENDING_REVIEW', 'PENDING_APPROVAL'] },
      });

      if (pendingCount === 0) {
        this.logger.log('Checking if moderation queue fixtures are needed in MongoDB Atlas...');
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
      status: raw.status,
      isPublished: !!raw.isPublished,
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
      specs: raw.specs,
      amenities: raw.amenities,
    };
  }

  async getDashboardStats() {
    const [
      pendingApprovalsCount,
      activeListingsCount,
      totalPropertiesCount,
      rejectedCount,
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
    ]);

    return {
      pendingApprovalsCount,
      activeListingsCount,
      totalPropertiesCount,
      rejectedCount,
      registeredAgentsCount: 384,
      totalEnquiriesThisMonth: 5920,
      monthlyRevenueEstimate: 245000,
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
  }) {
    const filter: any = {};

    if (filterQuery?.status && filterQuery.status !== 'ALL') {
      if (filterQuery.status === 'PUBLISHED' || filterQuery.status === 'ACTIVE') {
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

    const data = users.map((u: any) => {
      const counts = countMap.get(u._id.toString()) || countMap.get(u.normalizedMobile) || { total: 0, published: 0 };
      const norm = normalizeUserRoleModel({
        role: u.role,
        platformRole: u.platformRole,
        accountType: u.accountType,
        isVerifiedAgent: u.isVerifiedAgent,
      });
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
        status: u.status || 'ACTIVE',
        isVerifiedAgent: norm.isVerifiedAgent,
        agencyName: u.agencyName,
        reraNumber: u.reraNumber,
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
      status: user.status || 'ACTIVE',
      isVerifiedAgent: norm.isVerifiedAgent,
      agencyName: user.agencyName,
      reraNumber: user.reraNumber,
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

  async updateUserStatus(id: string, dto: UpdateUserStatusDto, actor?: AuthenticatedUser) {
    const query: any = isValidObjectId(id) ? { _id: id } : { normalizedMobile: id };
    const user = await this.userModel.findOne(query);

    if (!user) {
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
          { $set: { isRevoked: true, revokedAt: new Date() } },
        );
        this.logger.log(`Revoked all refresh sessions for suspended/deactivated user ${user._id}`);
      } catch (err: any) {
        this.logger.warn(`Session revocation note: ${err?.message}`);
      }
    }

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
    if (actor?.role === UserRole.MODERATOR) {
      throw new ForbiddenException('Moderators do not possess authority to modify user roles.');
    }

    // Security Rule 3: Only SUPER_ADMIN can promote to SUPER_ADMIN or modify a SUPER_ADMIN
    if (dto.role === UserRole.SUPER_ADMIN && actor?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only a Super Administrator can promote a user to Super Administrator.');
    }
    if (user.role === UserRole.SUPER_ADMIN && actor?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only a Super Administrator can modify the role of a Super Administrator.');
    }

    const previousRole = user.role;
    const norm = normalizeUserRoleModel({ role: dto.role });
    user.platformRole = norm.platformRole;
    user.accountType = norm.accountType;
    user.role = norm.role;

    if (norm.isVerifiedAgent) {
      user.isVerifiedAgent = true;
    }

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
      previousValue: { role: previousRole },
      newValue: { role: dto.role, platformRole: norm.platformRole, accountType: norm.accountType },
      reason: dto.reason || `User role changed from ${previousRole} to ${dto.role}`,
    });

    return {
      success: true,
      message: `User role successfully updated to ${dto.role}.`,
      user: {
        id: user._id.toString(),
        name: user.name,
        mobile: user.mobile,
        platformRole: norm.platformRole,
        accountType: norm.accountType,
        role: user.role,
        status: user.status,
        isVerifiedAgent: user.isVerifiedAgent,
      },
    };
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

    const docCounts = await this.agentDocumentModel.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);

    const docMap = new Map();
    docCounts.forEach((d: any) => {
      docMap.set(d._id.toString(), d.count);
    });

    const data = agents.map((a: any) => {
      const counts = countMap.get(a._id.toString()) || countMap.get(a.normalizedMobile) || { total: 0, published: 0 };
      const prof = profileMap.get(a._id.toString());
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

  async verifyAgent(id: string, notes?: string, actor?: AuthenticatedUser) {
    const query: any = isValidObjectId(id) ? { _id: id } : { normalizedMobile: id };
    const user = await this.userModel.findOne(query);

    if (!user) {
      throw new NotFoundException(`Agent with ID "${id}" was not found.`);
    }

    const previousState = { isVerifiedAgent: user.isVerifiedAgent, role: user.role };
    user.isVerifiedAgent = true;
    user.role = UserRole.VERIFIED_AGENT;
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
      newValue: { isVerifiedAgent: true, role: UserRole.VERIFIED_AGENT, verificationStatus: 'VERIFIED' },
      reason: notes || 'CASA Verified Agent badge granted by administrator.',
    });

    return {
      success: true,
      message: `CASA Verified Agent badge granted to ${user.name}.`,
      agent: {
        id: userId,
        name: user.name,
        agencyName: user.agencyName,
        reraNumber: user.reraNumber,
        isVerifiedAgent: true,
        role: user.role,
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

    const userId = user._id.toString();

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
        rejectionReason: reason.trim(),
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

  async getPurchasers(dto: AdminUserQueryDto) {
    const filter: any = {
      role: UserRole.PURCHASER,
    };

    if (dto.q && dto.q.trim()) {
      const q = dto.q.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { name: regex },
        { mobile: regex },
        { normalizedMobile: regex },
        { email: regex },
      ];
    }

    if (dto.status) {
      filter.status = dto.status;
    }

    const page = Math.max(1, Number(dto.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(dto.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, purchasers] = await Promise.all([
      this.userModel.countDocuments(filter),
      this.userModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    const data = purchasers.map((p: any) => ({
      id: p._id.toString(),
      _id: p._id.toString(),
      name: p.name || 'Purchaser',
      mobile: p.mobile,
      normalizedMobile: p.normalizedMobile,
      email: p.email,
      role: p.role,
      status: p.status || 'ACTIVE',
      savedProperties: 0,
      totalEnquiries: 0,
      lastLoginAt: p.lastLoginAt || p.updatedAt || p.createdAt,
      createdAt: p.createdAt,
    }));

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
}
