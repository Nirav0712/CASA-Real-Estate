import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import { SavedProperty, SavedPropertyDocument } from './schemas/saved-property.schema';
import { RecentlyViewed, RecentlyViewedDocument } from './schemas/recently-viewed.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { Lead, LeadDocument } from '../leads/schemas/lead.schema';
import { AuditLog, AuditLogDocument } from '../admin/schemas/audit-log.schema';
import { UpdatePurchaserProfileDto } from './dto/update-purchaser-profile.dto';
import { PurchaserEnquiryQueryDto } from './dto/purchaser-enquiry-query.dto';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class PurchaserService {
  private readonly logger = new Logger(PurchaserService.name);

  constructor(
    @InjectModel(SavedProperty.name)
    private readonly savedPropertyModel: Model<SavedPropertyDocument>,
    @InjectModel(RecentlyViewed.name)
    private readonly recentlyViewedModel: Model<RecentlyViewedDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  /**
   * Helper: Resolve User identifier filters
   */
  private getUserIdentifiers(user: AuthenticatedUser): string[] {
    return [user.id, user.mobile, user.normalizedMobile].filter(Boolean);
  }

  /**
   * 1. Get Aggregated Purchaser Dashboard Data
   */
  async getDashboard(user: AuthenticatedUser) {
    const userIdentifiers = this.getUserIdentifiers(user);

    const [savedCount, enquiriesCount, recentCount, userDoc] = await Promise.all([
      this.savedPropertyModel.countDocuments({ purchaserId: { $in: userIdentifiers } }),
      this.leadModel.countDocuments({
        $or: [
          { purchaserId: { $in: userIdentifiers } },
          { mobile: { $in: userIdentifiers } },
        ],
      }),
      this.recentlyViewedModel.countDocuments({ purchaserId: { $in: userIdentifiers } }),
      isValidObjectId(user.id) ? this.userModel.findById(user.id).lean() : null,
    ]);

    // Fetch up to 4 recent saved properties
    const savedDocs = await this.savedPropertyModel
      .find({ purchaserId: { $in: userIdentifiers } })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    const savedPropIds = savedDocs.map((s) => s.propertyId);
    const savedProperties = savedPropIds.length > 0
      ? await this.propertyModel
          .find({
            $or: [
              { id: { $in: savedPropIds } },
              ...(savedPropIds.filter((id) => isValidObjectId(id)).map((id) => ({ _id: id }))),
            ],
          })
          .lean()
      : [];

    // Fetch up to 4 recent enquiries
    const recentEnquiriesDocs = await this.leadModel
      .find({
        $or: [
          { purchaserId: { $in: userIdentifiers } },
          { mobile: { $in: userIdentifiers } },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    const enquiryPropIds = [...new Set(recentEnquiriesDocs.map((e) => e.propertyId))];
    const enquiryProps = enquiryPropIds.length > 0
      ? await this.propertyModel
          .find({
            $or: [
              { id: { $in: enquiryPropIds } },
              ...(enquiryPropIds.filter((id) => isValidObjectId(id)).map((id) => ({ _id: id }))),
            ],
          })
          .select({ id: 1, slug: 1, title: 1, price: 1, location: 1, media: 1, category: 1 })
          .lean()
      : [];

    const enquiryPropMap = new Map();
    enquiryProps.forEach((p: any) => {
      enquiryPropMap.set(p.id || p._id?.toString(), {
        id: p.id,
        slug: p.slug,
        title: typeof p.title === 'string' ? p.title : p.title?.en,
        price: typeof p.price === 'number' ? p.price : p.price?.amount,
        thumbnailUrl: p.media?.thumbnailUrl || p.media?.coverImage,
        location: typeof p.location === 'string' ? p.location : `${p.location?.locality}, ${p.location?.city}`,
        category: p.category,
      });
    });

    const recentEnquiries = recentEnquiriesDocs.map((e: any) => ({
      id: e._id.toString(),
      propertyId: e.propertyId,
      property: enquiryPropMap.get(e.propertyId) || null,
      name: e.name,
      mobile: e.mobile,
      email: e.email,
      message: e.message,
      source: e.source,
      status: e.status,
      priority: e.priority,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      lastContactAt: e.lastContactAt,
    }));

    // Fetch Recommended Properties based on saved + viewed properties
    const recommendations = await this.getRecommendations(user, 4);

    // Fetch up to 4 recently viewed properties
    const recentViewedDocs = await this.recentlyViewedModel
      .find({ purchaserId: { $in: userIdentifiers } })
      .sort({ viewedAt: -1 })
      .limit(4)
      .lean();

    const viewedPropIds = recentViewedDocs.map((r) => r.propertyId);
    const recentlyViewedProperties = viewedPropIds.length > 0
      ? await this.propertyModel
          .find({
            $or: [
              { id: { $in: viewedPropIds } },
              ...(viewedPropIds.filter((id) => isValidObjectId(id)).map((id) => ({ _id: id }))),
            ],
            isPublished: true,
            status: 'PUBLISHED',
          })
          .lean()
      : [];

    return {
      stats: {
        savedCount,
        enquiriesCount,
        recentlyViewedCount: recentCount,
      },
      savedProperties,
      recentEnquiries,
      recommendedProperties: recommendations,
      recentlyViewedProperties,
      user: {
        id: user.id,
        name: (userDoc as any)?.name || user.name,
        mobile: (userDoc as any)?.mobile || user.mobile,
        normalizedMobile: (userDoc as any)?.normalizedMobile || user.normalizedMobile,
        email: (userDoc as any)?.email || user.email,
        role: (userDoc as any)?.role || user.role,
        avatar: (userDoc as any)?.avatar || user.avatar,
        metadata: (userDoc as any)?.metadata || {},
      },
    };
  }

  /**
   * 2. Get Purchaser Profile
   */
  async getProfile(user: AuthenticatedUser) {
    const userDoc = isValidObjectId(user.id)
      ? await this.userModel.findById(user.id).lean()
      : null;

    if (!userDoc) {
      return {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        normalizedMobile: user.normalizedMobile,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        metadata: {},
      };
    }

    return {
      id: userDoc._id ? userDoc._id.toString() : (userDoc as any).id,
      name: userDoc.name,
      mobile: userDoc.mobile,
      normalizedMobile: userDoc.normalizedMobile,
      email: userDoc.email,
      role: userDoc.role,
      status: userDoc.status,
      avatar: userDoc.avatar,
      metadata: userDoc.metadata || {},
      createdAt: userDoc.createdAt,
      updatedAt: userDoc.updatedAt,
    };
  }

  /**
   * 3. Update Purchaser Profile (Strict field whitelisting)
   */
  async updateProfile(user: AuthenticatedUser, dto: UpdatePurchaserProfileDto) {
    if (!isValidObjectId(user.id)) {
      throw new BadRequestException('Invalid user account reference.');
    }

    const userDoc = await this.userModel.findById(user.id);
    if (!userDoc) {
      throw new NotFoundException('Purchaser user record not found.');
    }

    const previousData = {
      name: userDoc.name,
      email: userDoc.email,
      avatar: userDoc.avatar,
      metadata: userDoc.metadata,
    };

    // Update whitelisted top-level profile fields
    if (dto.name !== undefined) userDoc.name = dto.name.trim();
    if (dto.email !== undefined) userDoc.email = dto.email.trim().toLowerCase();
    if (dto.avatar !== undefined) userDoc.avatar = dto.avatar.trim();

    // Update buyer preferences inside metadata
    const meta = userDoc.metadata || {};
    if (dto.preferredLanguage !== undefined) meta.preferredLanguage = dto.preferredLanguage;
    if (dto.preferredCity !== undefined) meta.preferredCity = dto.preferredCity.trim();
    if (dto.preferredLocation !== undefined) meta.preferredLocation = dto.preferredLocation.trim();
    if (dto.budgetMin !== undefined) meta.budgetMin = Number(dto.budgetMin);
    if (dto.budgetMax !== undefined) meta.budgetMax = Number(dto.budgetMax);
    if (dto.preferredCategory !== undefined) meta.preferredCategory = dto.preferredCategory;
    if (dto.preferredListingType !== undefined) meta.preferredListingType = dto.preferredListingType;
    if (dto.bedrooms !== undefined) meta.bedrooms = Number(dto.bedrooms);
    if (dto.furnishing !== undefined) meta.furnishing = dto.furnishing;

    userDoc.metadata = meta;
    userDoc.markModified('metadata');
    await userDoc.save();

    // Audit Log
    await this.auditLogModel.create({
      action: 'PURCHASER_PROFILE_UPDATED',
      actorUserId: user.id,
      actorName: userDoc.name,
      actorRole: userDoc.role,
      targetUserId: user.id,
      targetEntity: 'USER',
      targetEntityId: user.id,
      previousValue: previousData,
      newValue: {
        name: userDoc.name,
        email: userDoc.email,
        metadata: userDoc.metadata,
      },
      reason: 'Purchaser updated personal profile & buyer preferences',
      timestamp: new Date(),
    });

    this.logger.log(`✅ Purchaser profile updated for user ${user.id}`);

    return {
      success: true,
      message: 'Profile and preferences updated successfully.',
      user: {
        id: userDoc._id.toString(),
        name: userDoc.name,
        mobile: userDoc.mobile,
        normalizedMobile: userDoc.normalizedMobile,
        email: userDoc.email,
        role: userDoc.role,
        status: userDoc.status,
        avatar: userDoc.avatar,
        metadata: userDoc.metadata,
        updatedAt: userDoc.updatedAt,
      },
    };
  }

  /**
   * 4. Get Paginated Saved Properties
   */
  async getSavedProperties(user: AuthenticatedUser, page: number = 1, limit: number = 20) {
    const userIdentifiers = this.getUserIdentifiers(user);
    const validPage = Math.max(1, Number(page) || 1);
    const validLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (validPage - 1) * validLimit;

    const [total, savedDocs] = await Promise.all([
      this.savedPropertyModel.countDocuments({ purchaserId: { $in: userIdentifiers } }),
      this.savedPropertyModel
        .find({ purchaserId: { $in: userIdentifiers } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(validLimit)
        .lean(),
    ]);

    const propertyIds = savedDocs.map((s) => s.propertyId);
    let properties: any[] = [];

    if (propertyIds.length > 0) {
      properties = await this.propertyModel
        .find({
          $or: [
            { id: { $in: propertyIds } },
            ...(propertyIds.filter((id) => isValidObjectId(id)).map((id) => ({ _id: id }))),
          ],
        })
        .lean();
    }

    // Preserve the chronological order of saved records
    const propMap = new Map();
    properties.forEach((p) => {
      propMap.set(p.id, p);
      if (p._id) propMap.set(p._id.toString(), p);
    });

    const data = savedDocs
      .map((s) => {
        const prop = propMap.get(s.propertyId);
        if (!prop) return null;
        return {
          savedId: s._id.toString(),
          savedAt: s.createdAt,
          property: prop,
        };
      })
      .filter(Boolean);

    const totalPages = Math.ceil(total / validLimit) || 1;

    return {
      data,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages,
        hasNextPage: validPage < totalPages,
        hasPreviousPage: validPage > 1,
      },
    };
  }

  /**
   * 5. Get Quick Array of Saved Property IDs
   */
  async getSavedPropertyIds(user: AuthenticatedUser): Promise<string[]> {
    const userIdentifiers = this.getUserIdentifiers(user);
    const docs = await this.savedPropertyModel
      .find({ purchaserId: { $in: userIdentifiers } })
      .select({ propertyId: 1 })
      .lean();

    return docs.map((d) => d.propertyId);
  }

  /**
   * 6. Check if Single Property is Saved
   */
  async isPropertySaved(user: AuthenticatedUser, propertyId: string): Promise<{ isSaved: boolean }> {
    const userIdentifiers = this.getUserIdentifiers(user);
    const existing = await this.savedPropertyModel.findOne({
      purchaserId: { $in: userIdentifiers },
      propertyId: propertyId.trim(),
    });

    return { isSaved: !!existing };
  }

  /**
   * 7. Save / Shortlist a Property (DB-backed, Idempotent)
   */
  async saveProperty(user: AuthenticatedUser, propertyId: string) {
    const propQuery: any = isValidObjectId(propertyId)
      ? { $or: [{ _id: propertyId }, { id: propertyId }] }
      : { id: propertyId };

    const property = await this.propertyModel.findOne(propQuery);
    if (!property) {
      throw new NotFoundException(`Property with ID "${propertyId}" was not found.`);
    }

    if (!property.isPublished || property.status !== 'PUBLISHED') {
      throw new BadRequestException('Only active, published properties can be saved.');
    }

    const cleanPropId = property.id || property._id.toString();

    // Upsert to ensure idempotent save without duplicates
    const result = await this.savedPropertyModel.findOneAndUpdate(
      { purchaserId: user.id, propertyId: cleanPropId },
      { $setOnInsert: { purchaserId: user.id, propertyId: cleanPropId, createdAt: new Date() } },
      { upsert: true, new: true },
    );

    // Audit Log
    await this.auditLogModel.create({
      action: 'PROPERTY_SAVED',
      actorUserId: user.id,
      actorName: user.name || 'Purchaser',
      actorRole: user.role,
      targetEntity: 'PROPERTY',
      targetEntityId: cleanPropId,
      newValue: { propertyId: cleanPropId, propertyTitle: property.title?.en || property.title },
      reason: 'Purchaser saved property to shortlist',
      timestamp: new Date(),
    });

    return {
      success: true,
      message: 'Property saved to your favorites.',
      savedId: result._id.toString(),
      propertyId: cleanPropId,
    };
  }

  /**
   * 8. Remove a Property from Saved Shortlist
   */
  async unsaveProperty(user: AuthenticatedUser, propertyId: string) {
    const userIdentifiers = this.getUserIdentifiers(user);
    const cleanPropId = propertyId.trim();

    const deleteResult = await this.savedPropertyModel.deleteMany({
      purchaserId: { $in: userIdentifiers },
      $or: [{ propertyId: cleanPropId }, { propertyId: propertyId }],
    });

    // Audit Log
    await this.auditLogModel.create({
      action: 'PROPERTY_UNSAVED',
      actorUserId: user.id,
      actorName: user.name || 'Purchaser',
      actorRole: user.role,
      targetEntity: 'PROPERTY',
      targetEntityId: cleanPropId,
      reason: 'Purchaser removed property from shortlist',
      timestamp: new Date(),
    });

    return {
      success: true,
      message: 'Property removed from saved favorites.',
      deletedCount: deleteResult.deletedCount,
      propertyId: cleanPropId,
    };
  }

  /**
   * 9. Record a Recently Viewed Property
   */
  async recordRecentlyViewed(user: AuthenticatedUser, propertyId: string) {
    const propQuery: any = isValidObjectId(propertyId)
      ? { $or: [{ _id: propertyId }, { id: propertyId }] }
      : { id: propertyId };

    const property = await this.propertyModel.findOne(propQuery).select({ id: 1, isPublished: 1, status: 1 });
    if (!property || !property.isPublished || property.status !== 'PUBLISHED') {
      return { success: false, message: 'Property not available or published.' };
    }

    const cleanPropId = property.id || property._id.toString();

    // Upsert recently viewed timestamp
    await this.recentlyViewedModel.findOneAndUpdate(
      { purchaserId: user.id, propertyId: cleanPropId },
      { $set: { viewedAt: new Date() } },
      { upsert: true, new: true },
    );

    // Maintain cap of 20 items per user
    const excessDocs = await this.recentlyViewedModel
      .find({ purchaserId: user.id })
      .sort({ viewedAt: -1 })
      .skip(20)
      .select({ _id: 1 })
      .lean();

    if (excessDocs.length > 0) {
      const excessIds = excessDocs.map((d) => d._id);
      await this.recentlyViewedModel.deleteMany({ _id: { $in: excessIds } });
    }

    return { success: true };
  }

  /**
   * 10. Get Recently Viewed Properties
   */
  async getRecentlyViewed(user: AuthenticatedUser, limit: number = 20) {
    const userIdentifiers = this.getUserIdentifiers(user);
    const validLimit = Math.min(50, Math.max(1, Number(limit) || 20));

    const viewedDocs = await this.recentlyViewedModel
      .find({ purchaserId: { $in: userIdentifiers } })
      .sort({ viewedAt: -1 })
      .limit(validLimit)
      .lean();

    const propIds = viewedDocs.map((v) => v.propertyId);
    if (propIds.length === 0) {
      return [];
    }

    const properties = await this.propertyModel
      .find({
        $or: [
          { id: { $in: propIds } },
          ...(propIds.filter((id) => isValidObjectId(id)).map((id) => ({ _id: id }))),
        ],
        isPublished: true,
        status: 'PUBLISHED',
      })
      .lean();

    const propMap = new Map();
    properties.forEach((p) => {
      propMap.set(p.id, p);
      if (p._id) propMap.set(p._id.toString(), p);
    });

    return viewedDocs
      .map((v) => {
        const prop = propMap.get(v.propertyId);
        if (!prop) return null;
        return {
          viewedAt: v.viewedAt,
          property: prop,
        };
      })
      .filter(Boolean);
  }

  /**
   * 11. Get Paginated Purchaser Enquiries (with full ownership isolation)
   */
  async getEnquiries(user: AuthenticatedUser, queryDto: PurchaserEnquiryQueryDto) {
    const userIdentifiers = this.getUserIdentifiers(user);

    const filter: any = {
      $or: [
        { purchaserId: { $in: userIdentifiers } },
        { mobile: { $in: userIdentifiers } },
      ],
    };

    if (queryDto.status && queryDto.status !== 'ALL') {
      filter.status = queryDto.status;
    }

    if (queryDto.q && queryDto.q.trim()) {
      const regex = new RegExp(queryDto.q.trim(), 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [{ name: regex }, { message: regex }, { mobile: regex }],
      });
    }

    const page = Math.max(1, Number(queryDto.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(queryDto.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, leads] = await Promise.all([
      this.leadModel.countDocuments(filter),
      this.leadModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    // Fetch property context
    const propertyIds = [...new Set(leads.map((l: any) => l.propertyId))];
    const properties = propertyIds.length > 0
      ? await this.propertyModel
          .find({
            $or: [
              { id: { $in: propertyIds } },
              ...(propertyIds.filter((id) => isValidObjectId(id)).map((id) => ({ _id: id }))),
            ],
          })
          .select({ id: 1, slug: 1, title: 1, price: 1, category: 1, location: 1, media: 1, advertiser: 1 })
          .lean()
      : [];

    const propMap = new Map();
    properties.forEach((p: any) => {
      const pId = p.id || p._id?.toString();
      propMap.set(pId, {
        id: p.id,
        slug: p.slug,
        title: typeof p.title === 'string' ? p.title : p.title?.en,
        price: typeof p.price === 'number' ? p.price : p.price?.amount,
        category: p.category,
        location: typeof p.location === 'string' ? p.location : `${p.location?.locality}, ${p.location?.city}`,
        thumbnailUrl: p.media?.thumbnailUrl || p.media?.coverImage,
        advertiser: p.advertiser,
      });
    });

    const data = leads.map((l: any) => ({
      id: l._id.toString(),
      propertyId: l.propertyId,
      property: propMap.get(l.propertyId) || null,
      name: l.name,
      mobile: l.mobile,
      email: l.email,
      message: l.message,
      source: l.source,
      status: l.status,
      priority: l.priority,
      notesCount: l.notes?.length || 0,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
      lastContactAt: l.lastContactAt,
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

  /**
   * 12. Get Single Purchaser Enquiry Details (Enforcing Strict Ownership)
   */
  async getEnquiryById(user: AuthenticatedUser, id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid enquiry ID format.');
    }

    const lead = await this.leadModel.findById(id).lean();
    if (!lead) {
      throw new NotFoundException(`Enquiry with ID "${id}" was not found.`);
    }

    const userIdentifiers = this.getUserIdentifiers(user);
    const isOwner =
      (lead.purchaserId && userIdentifiers.includes(lead.purchaserId)) ||
      (lead.mobile && userIdentifiers.includes(lead.mobile));

    if (!isOwner) {
      throw new ForbiddenException('You do not have permission to view this enquiry.');
    }

    const property = await this.propertyModel
      .findOne({
        $or: [
          { id: lead.propertyId },
          ...(isValidObjectId(lead.propertyId) ? [{ _id: lead.propertyId }] : []),
        ],
      })
      .select({ id: 1, slug: 1, title: 1, price: 1, category: 1, location: 1, media: 1, advertiser: 1 })
      .lean();

    return {
      id: lead._id.toString(),
      property: property
        ? {
            id: property.id,
            slug: property.slug,
            title: typeof property.title === 'string' ? property.title : property.title?.en,
            price: typeof property.price === 'number' ? property.price : property.price?.amount,
            category: property.category,
            location:
              typeof property.location === 'string'
                ? property.location
                : `${property.location?.locality}, ${property.location?.city}`,
            thumbnailUrl: property.media?.thumbnailUrl || property.media?.coverImage,
            advertiser: property.advertiser,
          }
        : null,
      name: lead.name,
      mobile: lead.mobile,
      email: lead.email,
      message: lead.message,
      source: lead.source,
      status: lead.status,
      priority: lead.priority,
      notes: (lead.notes || []).map((n) => ({
        text: n.text,
        createdAt: n.createdAt,
      })),
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      lastContactAt: lead.lastContactAt,
    };
  }

  /**
   * 13. Cancel Purchaser Enquiry
   */
  async cancelEnquiry(user: AuthenticatedUser, id: string, reason?: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid enquiry ID.');
    }

    const lead = await this.leadModel.findById(id);
    if (!lead) {
      throw new NotFoundException(`Enquiry with ID "${id}" was not found.`);
    }

    const userIdentifiers = this.getUserIdentifiers(user);
    const isOwner =
      (lead.purchaserId && userIdentifiers.includes(lead.purchaserId)) ||
      (lead.mobile && userIdentifiers.includes(lead.mobile));

    if (!isOwner) {
      throw new ForbiddenException('You do not have permission to cancel this enquiry.');
    }

    const prevStatus = lead.status;
    lead.status = 'CLOSED';
    lead.notes.push({
      text: `Enquiry closed by purchaser${reason ? `: "${reason}"` : '.'}`,
      authorId: user.id,
      authorName: user.name || 'Purchaser',
      createdAt: new Date(),
    });

    await lead.save();

    // Audit Log
    await this.auditLogModel.create({
      action: 'ENQUIRY_STATUS_CHANGED',
      actorUserId: user.id,
      actorName: user.name || 'Purchaser',
      actorRole: user.role,
      targetEntity: 'LEAD',
      targetEntityId: lead._id.toString(),
      previousValue: { status: prevStatus },
      newValue: { status: 'CLOSED' },
      reason: reason || 'Enquiry cancelled by buyer',
      timestamp: new Date(),
    });

    return {
      success: true,
      message: 'Enquiry has been closed.',
      status: 'CLOSED',
    };
  }

  /**
   * 14. Real Database-backed Property Recommendations
   */
  async getRecommendations(user: AuthenticatedUser, limit: number = 6) {
    const userIdentifiers = this.getUserIdentifiers(user);
    const validLimit = Math.min(20, Math.max(1, Number(limit) || 6));

    // 1. Fetch user's saved and viewed property IDs to extract category & location signals
    const [savedDocs, viewedDocs, userDoc] = await Promise.all([
      this.savedPropertyModel
        .find({ purchaserId: { $in: userIdentifiers } })
        .select({ propertyId: 1 })
        .lean(),
      this.recentlyViewedModel
        .find({ purchaserId: { $in: userIdentifiers } })
        .sort({ viewedAt: -1 })
        .limit(10)
        .select({ propertyId: 1 })
        .lean(),
      isValidObjectId(user.id) ? this.userModel.findById(user.id).lean() : null,
    ]);

    const excludedIds = [
      ...savedDocs.map((s) => s.propertyId),
      ...viewedDocs.map((v) => v.propertyId),
    ];

    const userPrefs = (userDoc as any)?.metadata || {};
    const preferredCategories: string[] = [];
    const preferredCities: string[] = [];

    if (userPrefs.preferredCategory) preferredCategories.push(userPrefs.preferredCategory);
    if (userPrefs.preferredCity) preferredCities.push(userPrefs.preferredCity);

    // If we have saved/viewed properties, inspect them to gather preferred categories/cities
    if (excludedIds.length > 0) {
      const sampledProps = await this.propertyModel
        .find({
          $or: [
            { id: { $in: excludedIds } },
            ...(excludedIds.filter((id) => isValidObjectId(id)).map((id) => ({ _id: id }))),
          ],
        })
        .select({ category: 1, 'location.city': 1 })
        .limit(10)
        .lean();

      sampledProps.forEach((p: any) => {
        if (p.category && !preferredCategories.includes(p.category)) {
          preferredCategories.push(p.category);
        }
        if (p.location?.city && !preferredCities.includes(p.location.city)) {
          preferredCities.push(p.location.city);
        }
      });
    }

    // Build query for published properties
    const filter: any = {
      isPublished: true,
      status: 'PUBLISHED',
      id: { $nin: savedDocs.map((s) => s.propertyId) }, // Exclude already saved properties
    };

    if (preferredCategories.length > 0) {
      filter.category = { $in: preferredCategories };
    }

    if (preferredCities.length > 0) {
      filter['location.city'] = { $in: preferredCities };
    }

    if (userPrefs.preferredListingType) {
      filter.listingType = userPrefs.preferredListingType;
    }

    let recommended = await this.propertyModel
      .find(filter)
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(validLimit)
      .lean();

    // If query returned fewer than required, backfill with top published properties
    if (recommended.length < validLimit) {
      const existingIds = recommended.map((r: any) => r.id);
      const backfill = await this.propertyModel
        .find({
          isPublished: true,
          status: 'PUBLISHED',
          id: { $nin: [...savedDocs.map((s) => s.propertyId), ...existingIds] },
        })
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(validLimit - recommended.length)
        .lean();

      recommended = [...recommended, ...backfill];
    }

    return recommended;
  }
}
