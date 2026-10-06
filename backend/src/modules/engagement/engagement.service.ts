import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';
import { SavedSearch, SavedSearchDocument } from './schemas/saved-search.schema';
import { Notification, NotificationDocument, NotificationType } from './schemas/notification.schema';
import { SiteVisit, SiteVisitDocument, SiteVisitStatus } from './schemas/site-visit.schema';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { Review, ReviewDocument, ReviewStatus, ReviewTargetType } from './schemas/review.schema';
import { PropertyReport, PropertyReportDocument, ReportStatus } from './schemas/property-report.schema';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { UserRole } from '../auth/enums/auth.enums';
import { Lead, LeadDocument } from '../leads/schemas/lead.schema';
import { LeadStatus, LeadSource } from '../leads/enums/lead.enums';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { AddToWishlistDto } from './dto/wishlist.dto';
import { CreateSavedSearchDto, UpdateSavedSearchDto } from './dto/saved-search.dto';
import { NotificationQueryDto } from './dto/notification.dto';
import { CreateSiteVisitDto, RescheduleSiteVisitDto, CancelSiteVisitDto } from './dto/site-visit.dto';
import { StartConversationDto, SendMessageDto } from './dto/messaging.dto';
import { CreateReviewDto, ModerateReviewDto } from './dto/review.dto';
import { CreateReportDto, ResolveReportDto } from './dto/report.dto';
import { ComparePropertiesDto } from './dto/compare.dto';

@Injectable()
export class EngagementService {
  private readonly logger = new Logger(EngagementService.name);

  constructor(
    @InjectModel(Wishlist.name) private readonly wishlistModel: Model<WishlistDocument>,
    @InjectModel(SavedSearch.name) private readonly savedSearchModel: Model<SavedSearchDocument>,
    @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(SiteVisit.name) private readonly siteVisitModel: Model<SiteVisitDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(PropertyReport.name) private readonly reportModel: Model<PropertyReportDocument>,
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Lead.name) private readonly leadModel: Model<LeadDocument>,
  ) {}

  // =========================================================================
  // 15.1 — WISHLIST / SAVED PROPERTIES
  // =========================================================================

  async addToWishlist(user: AuthenticatedUser, dto: AddToWishlistDto) {
    if (!Types.ObjectId.isValid(dto.propertyId)) {
      throw new BadRequestException('Invalid property ID format');
    }

    const property = await this.propertyModel.findById(dto.propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const userId = new Types.ObjectId(user.id);
    const propertyId = new Types.ObjectId(dto.propertyId);

    const existing = await this.wishlistModel.findOne({ userId, propertyId });
    if (existing) {
      return {
        success: true,
        message: 'Property is already in your wishlist',
        data: existing,
      };
    }

    const item = await this.wishlistModel.create({
      userId,
      propertyId,
      notes: dto.notes || null,
    });

    return {
      success: true,
      message: 'Property saved to wishlist',
      data: item,
    };
  }

  async removeFromWishlist(user: AuthenticatedUser, propertyIdStr: string) {
    if (!Types.ObjectId.isValid(propertyIdStr)) {
      throw new BadRequestException('Invalid property ID format');
    }

    const userId = new Types.ObjectId(user.id);
    const propertyId = new Types.ObjectId(propertyIdStr);

    await this.wishlistModel.deleteOne({ userId, propertyId });

    return {
      success: true,
      message: 'Property removed from wishlist',
    };
  }

  async getWishlist(user: AuthenticatedUser, page = 1, limit = 20) {
    const userId = new Types.ObjectId(user.id);
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const skip = (Math.max(1, page) - 1) * safeLimit;

    const [items, total] = await Promise.all([
      this.wishlistModel
        .find({ userId })
        .populate({
          path: 'propertyId',
          select:
            'title slug category listingType price specs location media status moderationStatus isFeatured',
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      this.wishlistModel.countDocuments({ userId }),
    ]);

    // Clean nulls in case any property was deleted
    const validItems = items.filter((item) => item.propertyId != null);

    return {
      success: true,
      data: {
        items: validItems,
        pagination: {
          total,
          page,
          limit: safeLimit,
          totalPages: Math.ceil(total / safeLimit) || 1,
        },
      },
    };
  }

  async isPropertyInWishlist(user: AuthenticatedUser, propertyIdStr: string) {
    if (!Types.ObjectId.isValid(propertyIdStr)) {
      return { success: true, data: { isSaved: false } };
    }

    const userId = new Types.ObjectId(user.id);
    const propertyId = new Types.ObjectId(propertyIdStr);

    const exists = await this.wishlistModel.exists({ userId, propertyId });
    return {
      success: true,
      data: {
        isSaved: Boolean(exists),
      },
    };
  }

  async getWishlistPropertyIds(user: AuthenticatedUser) {
    const userId = new Types.ObjectId(user.id);
    const items = await this.wishlistModel.find({ userId }).select('propertyId').lean();
    return {
      success: true,
      data: items.map((i) => i.propertyId.toString()),
    };
  }

  // =========================================================================
  // 15.2 & 15.3 — SAVED SEARCHES & SEARCH ALERTS
  // =========================================================================

  async createSavedSearch(user: AuthenticatedUser, dto: CreateSavedSearchDto) {
    const userId = new Types.ObjectId(user.id);

    const count = await this.savedSearchModel.countDocuments({ userId, isActive: true });
    if (count >= 25) {
      throw new BadRequestException('Maximum limit of 25 saved searches reached. Please remove an older search.');
    }

    const savedSearch = await this.savedSearchModel.create({
      userId,
      name: dto.name,
      criteria: dto.criteria,
      enableAlerts: dto.enableAlerts !== false,
      frequency: dto.frequency || 'INSTANT',
      isActive: true,
    });

    return {
      success: true,
      message: 'Search criteria saved successfully',
      data: savedSearch,
    };
  }

  async getSavedSearches(user: AuthenticatedUser) {
    const userId = new Types.ObjectId(user.id);
    const searches = await this.savedSearchModel
      .find({ userId, isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      data: searches,
    };
  }

  async getSavedSearchById(user: AuthenticatedUser, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid ID');
    const search = await this.savedSearchModel.findById(id);
    if (!search || !search.isActive) throw new NotFoundException('Saved search not found');

    if (search.userId.toString() !== user.id && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    return { success: true, data: search };
  }

  async updateSavedSearch(user: AuthenticatedUser, id: string, dto: UpdateSavedSearchDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid ID');
    const search = await this.savedSearchModel.findById(id);
    if (!search || !search.isActive) throw new NotFoundException('Saved search not found');

    if (search.userId.toString() !== user.id) {
      throw new ForbiddenException('Cannot edit another user saved search');
    }

    if (dto.name) search.name = dto.name;
    if (dto.criteria) search.criteria = dto.criteria as any;
    if (dto.enableAlerts !== undefined) search.enableAlerts = dto.enableAlerts;
    if (dto.frequency) search.frequency = dto.frequency;

    await search.save();

    return {
      success: true,
      message: 'Saved search updated successfully',
      data: search,
    };
  }

  async deleteSavedSearch(user: AuthenticatedUser, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid ID');
    const search = await this.savedSearchModel.findById(id);
    if (!search) throw new NotFoundException('Saved search not found');

    if (search.userId.toString() !== user.id && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot delete another user saved search');
    }

    search.isActive = false;
    await search.save();

    return {
      success: true,
      message: 'Saved search deleted successfully',
    };
  }

  async toggleSavedSearchAlerts(user: AuthenticatedUser, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid ID');
    const search = await this.savedSearchModel.findById(id);
    if (!search || !search.isActive) throw new NotFoundException('Saved search not found');

    if (search.userId.toString() !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    search.enableAlerts = !search.enableAlerts;
    await search.save();

    return {
      success: true,
      message: `Search alerts ${search.enableAlerts ? 'enabled' : 'disabled'}`,
      data: { enableAlerts: search.enableAlerts },
    };
  }

  async executeSavedSearch(user: AuthenticatedUser, id: string, page = 1, limit = 12) {
    const { data: search } = await this.getSavedSearchById(user, id);
    const criteria = search.criteria || {};

    const query: any = {
      status: 'PUBLISHED',
      moderationStatus: 'APPROVED',
    };

    if (criteria.listingType) query.listingType = criteria.listingType;
    if (criteria.category) query.category = criteria.category;

    if (criteria.minPrice != null || criteria.maxPrice != null) {
      query['price.amount'] = {};
      if (criteria.minPrice != null) query['price.amount'].$gte = criteria.minPrice;
      if (criteria.maxPrice != null) query['price.amount'].$lte = criteria.maxPrice;
    }

    if (criteria.bedrooms != null) query['specs.bedrooms'] = { $gte: criteria.bedrooms };
    if (criteria.city) query['location.city'] = new RegExp(criteria.city, 'i');
    if (criteria.locality) query['location.locality'] = new RegExp(criteria.locality, 'i');

    const safeLimit = Math.min(Math.max(1, limit), 50);
    const skip = (Math.max(1, page) - 1) * safeLimit;

    const [items, total] = await Promise.all([
      this.propertyModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
      this.propertyModel.countDocuments(query),
    ]);

    return {
      success: true,
      data: {
        items,
        pagination: {
          total,
          page,
          limit: safeLimit,
          totalPages: Math.ceil(total / safeLimit) || 1,
        },
      },
    };
  }

  /**
   * Search Alert Trigger: Invoked when a property is published to match active saved searches
   */
  async matchAndNotifySavedSearches(property: PropertyDocument) {
    try {
      const activeSearches = await this.savedSearchModel.find({
        enableAlerts: true,
        isActive: true,
      });

      for (const search of activeSearches) {
        // Do not notify the property creator
        if (search.userId.toString() === property.ownerId?.toString()) continue;

        const c = search.criteria || {};
        let matches = true;

        if (c.listingType && c.listingType !== property.listingType) matches = false;
        if (c.category && c.category !== property.category) matches = false;

        const price = property.price?.amount || 0;
        if (c.minPrice != null && price < c.minPrice) matches = false;
        if (c.maxPrice != null && price > c.maxPrice) matches = false;

        if (c.bedrooms != null && (property.specs?.bedrooms || 0) < c.bedrooms) matches = false;

        if (matches) {
          const titleEn = typeof property.title === 'string' ? property.title : property.title?.en || 'Exclusive Property';
          await this.createNotification({
            recipientId: search.userId,
            type: NotificationType.SEARCH_ALERT,
            title: `New Property Match: ${search.name}`,
            message: `A new property "${titleEn}" matching your saved search criteria is now available.`,
            data: {
              propertyId: property._id.toString(),
              slug: property.slug,
              searchId: search._id.toString(),
              price: property.price?.amount,
              link: `/property/${property.slug}`,
            },
          });

          await this.savedSearchModel.updateOne(
            { _id: search._id },
            {
              $inc: { matchedCount: 1 },
              $set: { lastAlertSentAt: new Date() },
            },
          );
        }
      }
    } catch (err: any) {
      this.logger.error(`Error matching saved searches for property ${property._id}: ${err.message}`);
    }
  }

  // =========================================================================
  // 15.4 — NOTIFICATION CENTER
  // =========================================================================

  async createNotification(options: {
    recipientId: Types.ObjectId | string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
  }) {
    const recipientId =
      typeof options.recipientId === 'string'
        ? new Types.ObjectId(options.recipientId)
        : options.recipientId;

    return this.notificationModel.create({
      recipientId,
      type: options.type,
      title: options.title,
      message: options.message,
      data: options.data || {},
      isRead: false,
    });
  }

  async getNotifications(user: AuthenticatedUser, queryDto: NotificationQueryDto) {
    const userId = new Types.ObjectId(user.id);
    const filter: any = { recipientId: userId };
    if (queryDto.unreadOnly) {
      filter.isRead = false;
    }

    const page = Math.max(1, queryDto.page || 1);
    const limit = Math.min(Math.max(1, queryDto.limit || 20), 50);
    const skip = (page - 1) * limit;

    const [items, total, unreadCount] = await Promise.all([
      this.notificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.notificationModel.countDocuments(filter),
      this.notificationModel.countDocuments({ recipientId: userId, isRead: false }),
    ]);

    return {
      success: true,
      data: {
        items,
        unreadCount,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    };
  }

  async getUnreadNotificationCount(user: AuthenticatedUser) {
    const userId = new Types.ObjectId(user.id);
    const unreadCount = await this.notificationModel.countDocuments({
      recipientId: userId,
      isRead: false,
    });

    return {
      success: true,
      data: { unreadCount },
    };
  }

  async markNotificationAsRead(user: AuthenticatedUser, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid notification ID');
    const userId = new Types.ObjectId(user.id);

    const notification = await this.notificationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), recipientId: userId },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true },
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return { success: true, message: 'Notification marked as read', data: notification };
  }

  async markAllNotificationsAsRead(user: AuthenticatedUser) {
    const userId = new Types.ObjectId(user.id);
    await this.notificationModel.updateMany(
      { recipientId: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    );

    return { success: true, message: 'All notifications marked as read' };
  }

  async deleteNotification(user: AuthenticatedUser, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid notification ID');
    const userId = new Types.ObjectId(user.id);

    await this.notificationModel.deleteOne({
      _id: new Types.ObjectId(id),
      recipientId: userId,
    });

    return { success: true, message: 'Notification deleted' };
  }

  async clearAllNotifications(user: AuthenticatedUser) {
    const userId = new Types.ObjectId(user.id);
    await this.notificationModel.deleteMany({ recipientId: userId });
    return { success: true, message: 'All notifications cleared' };
  }

  // =========================================================================
  // 15.5 — CONTACT AGENT / ENQUIRY CONVERSION & CRM UPGRADE
  // =========================================================================

  async recordContactActivity(
    user: AuthenticatedUser,
    options: {
      propertyId: string;
      actionType: 'ENQUIRY' | 'CONTACT_REQUEST' | 'CALL_REQUEST' | 'WHATSAPP_REQUEST' | 'CHAT_STARTED';
      message?: string;
    },
  ) {
    if (!Types.ObjectId.isValid(options.propertyId)) {
      throw new BadRequestException('Invalid property ID');
    }

    const property = await this.propertyModel.findById(options.propertyId);
    if (!property) throw new NotFoundException('Property not found');

    const buyerUser = await this.userModel.findById(user.id);
    const agentId = property.ownerId; // Assigned agent or owner

    const buyerMobile = buyerUser?.mobile || user.mobile;
    const buyerName = buyerUser?.name || 'Interested Buyer';
    const propTitleEn = typeof property.title === 'string' ? property.title : property.title?.en || 'CASA Listing';

    // Upsert or reuse existing Lead in CRM for buyer + property
    let lead = await this.leadModel.findOne({
      propertyId: property._id,
      buyerMobile,
    });

    const now = new Date();
    const activityEntry = {
      action: options.actionType,
      performedBy: new Types.ObjectId(user.id),
      performedByName: buyerName,
      timestamp: now,
      notes: options.message || `Buyer triggered ${options.actionType} action on property detail`,
    };

    if (lead) {
      if (!lead.activities) lead.activities = [];
      lead.activities.push(activityEntry as any);
      await lead.save();
    } else {
      lead = await this.leadModel.create({
        buyerName,
        buyerMobile,
        buyerEmail: buyerUser?.email,
        propertyId: property._id,
        propertyTitle: propTitleEn,
        propertySlug: property.slug,
        assignedTo: agentId ? new Types.ObjectId(agentId) : undefined,
        source: LeadSource.WEBSITE,
        status: LeadStatus.NEW,
        notes: options.message || `Initial ${options.actionType} from marketplace`,
        activities: [activityEntry],
      });
    }

    // Dispatch notification to assigned agent/owner
    if (agentId && agentId.toString() !== user.id) {
      await this.createNotification({
        recipientId: agentId,
        type: NotificationType.NEW_LEAD,
        title: `New Lead Activity: ${propTitleEn}`,
        message: `${buyerName} submitted a ${options.actionType} on your listing.`,
        data: {
          leadId: lead._id.toString(),
          propertyId: property._id.toString(),
          buyerMobile,
          actionType: options.actionType,
          link: `/dashboard/leads`,
        },
      });
    }

    return {
      success: true,
      message: 'Contact request recorded successfully',
      data: {
        leadId: lead._id,
        actionType: options.actionType,
      },
    };
  }

  // =========================================================================
  // 15.6 — SITE VISIT BOOKING
  // =========================================================================

  async requestSiteVisit(user: AuthenticatedUser, dto: CreateSiteVisitDto) {
    if (!Types.ObjectId.isValid(dto.propertyId)) {
      throw new BadRequestException('Invalid property ID');
    }

    const property = await this.propertyModel.findById(dto.propertyId);
    if (!property) throw new NotFoundException('Property not found');

    const visitDate = new Date(dto.preferredDate);
    if (isNaN(visitDate.getTime()) || visitDate < new Date()) {
      throw new BadRequestException('Preferred visit date must be in the future');
    }

    const buyerId = new Types.ObjectId(user.id);
    const agentId = property.ownerId ? new Types.ObjectId(property.ownerId) : buyerId;
    const propTitleEn = typeof property.title === 'string' ? property.title : property.title?.en || 'Property Tour';

    const siteVisit = await this.siteVisitModel.create({
      buyerId,
      propertyId: property._id,
      agentId,
      preferredDate: visitDate,
      preferredTimeSlot: dto.preferredTimeSlot,
      buyerName: dto.buyerName,
      buyerMobile: dto.buyerMobile,
      buyerEmail: dto.buyerEmail || null,
      message: dto.message || null,
      status: SiteVisitStatus.REQUESTED,
    });

    // Notify Agent / Owner
    if (agentId && agentId.toString() !== user.id) {
      await this.createNotification({
        recipientId: agentId,
        type: NotificationType.SITE_VISIT_REQUESTED,
        title: 'New Site Visit Request',
        message: `${dto.buyerName} requested a site visit for "${propTitleEn}" on ${visitDate.toDateString()} (${dto.preferredTimeSlot}).`,
        data: {
          siteVisitId: siteVisit._id.toString(),
          propertyId: property._id.toString(),
          preferredDate: visitDate,
          preferredTimeSlot: dto.preferredTimeSlot,
          link: `/dashboard/agent`,
        },
      });
    }

    return {
      success: true,
      message: 'Site visit requested successfully. The agent will confirm shortly.',
      data: siteVisit,
    };
  }

  async getMySiteVisits(user: AuthenticatedUser, status?: SiteVisitStatus) {
    const buyerId = new Types.ObjectId(user.id);
    const filter: any = { buyerId };
    if (status) filter.status = status;

    const visits = await this.siteVisitModel
      .find(filter)
      .populate('propertyId', 'title slug price location media')
      .populate('agentId', 'name mobile email')
      .sort({ preferredDate: 1 })
      .lean();

    return { success: true, data: visits };
  }

  async getAgentSiteVisits(user: AuthenticatedUser, status?: SiteVisitStatus) {
    const agentId = new Types.ObjectId(user.id);
    const filter: any = { agentId };
    if (status) filter.status = status;

    const visits = await this.siteVisitModel
      .find(filter)
      .populate('propertyId', 'title slug price location media')
      .populate('buyerId', 'name mobile email')
      .sort({ preferredDate: 1 })
      .lean();

    return { success: true, data: visits };
  }

  async getAdminSiteVisits(status?: SiteVisitStatus, page = 1, limit = 20) {
    const filter: any = {};
    if (status) filter.status = status;

    const safeLimit = Math.min(Math.max(1, limit), 50);
    const skip = (Math.max(1, page) - 1) * safeLimit;

    const [items, total] = await Promise.all([
      this.siteVisitModel
        .find(filter)
        .populate('propertyId', 'title slug price location')
        .populate('agentId', 'name mobile email')
        .populate('buyerId', 'name mobile email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      this.siteVisitModel.countDocuments(filter),
    ]);

    return {
      success: true,
      data: {
        items,
        pagination: {
          total,
          page,
          limit: safeLimit,
          totalPages: Math.ceil(total / safeLimit) || 1,
        },
      },
    };
  }

  async confirmSiteVisit(user: AuthenticatedUser, id: string, notes?: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid ID');
    const visit = await this.siteVisitModel.findById(id).populate('propertyId', 'title slug');
    if (!visit) throw new NotFoundException('Site visit not found');

    const isAgent = visit.agentId.toString() === user.id;
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
    if (!isAgent && !isAdmin) {
      throw new ForbiddenException('Only the assigned agent or admin can confirm this site visit');
    }

    visit.status = SiteVisitStatus.CONFIRMED;
    if (notes) visit.agentNotes = notes;
    await visit.save();

    // Notify Buyer
    await this.createNotification({
      recipientId: visit.buyerId,
      type: NotificationType.SITE_VISIT_CONFIRMED,
      title: 'Site Visit Confirmed!',
      message: `Your site visit has been confirmed for ${new Date(visit.preferredDate).toDateString()} (${visit.preferredTimeSlot}).`,
      data: {
        siteVisitId: visit._id.toString(),
        propertyId: visit.propertyId,
        link: `/dashboard/purchaser`,
      },
    });

    return { success: true, message: 'Site visit confirmed', data: visit };
  }

  async rescheduleSiteVisit(user: AuthenticatedUser, id: string, dto: RescheduleSiteVisitDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid ID');
    const visit = await this.siteVisitModel.findById(id);
    if (!visit) throw new NotFoundException('Site visit not found');

    const isBuyer = visit.buyerId.toString() === user.id;
    const isAgent = visit.agentId.toString() === user.id;
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;

    if (!isBuyer && !isAgent && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    const newDate = new Date(dto.rescheduledDate);
    visit.status = SiteVisitStatus.RESCHEDULED;
    visit.rescheduledDate = newDate;
    visit.rescheduledTimeSlot = dto.rescheduledTimeSlot;
    if (dto.notes) visit.agentNotes = dto.notes;
    await visit.save();

    // Notify counterpart
    const targetUserId = isBuyer ? visit.agentId : visit.buyerId;
    await this.createNotification({
      recipientId: targetUserId,
      type: NotificationType.SITE_VISIT_RESCHEDULED,
      title: 'Site Visit Rescheduled',
      message: `Site visit proposed for new time: ${newDate.toDateString()} (${dto.rescheduledTimeSlot}).`,
      data: { siteVisitId: visit._id.toString() },
    });

    return { success: true, message: 'Site visit rescheduled', data: visit };
  }

  async cancelSiteVisit(user: AuthenticatedUser, id: string, dto: CancelSiteVisitDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid ID');
    const visit = await this.siteVisitModel.findById(id);
    if (!visit) throw new NotFoundException('Site visit not found');

    const isBuyer = visit.buyerId.toString() === user.id;
    const isAgent = visit.agentId.toString() === user.id;
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;

    if (!isBuyer && !isAgent && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    visit.status = SiteVisitStatus.CANCELLED;
    if (dto.cancellationReason) visit.cancellationReason = dto.cancellationReason;
    await visit.save();

    const counterpartId = isBuyer ? visit.agentId : visit.buyerId;
    await this.createNotification({
      recipientId: counterpartId,
      type: NotificationType.SITE_VISIT_CANCELLED,
      title: 'Site Visit Cancelled',
      message: `Site visit for ${new Date(visit.preferredDate).toDateString()} was cancelled. Reason: ${dto.cancellationReason || 'Not specified'}`,
      data: { siteVisitId: visit._id.toString() },
    });

    return { success: true, message: 'Site visit cancelled', data: visit };
  }

  async completeSiteVisit(user: AuthenticatedUser, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid ID');
    const visit = await this.siteVisitModel.findById(id);
    if (!visit) throw new NotFoundException('Site visit not found');

    const isAgent = visit.agentId.toString() === user.id;
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
    if (!isAgent && !isAdmin) throw new ForbiddenException('Access denied');

    visit.status = SiteVisitStatus.COMPLETED;
    await visit.save();

    return { success: true, message: 'Site visit marked as completed', data: visit };
  }

  // =========================================================================
  // 15.7 — BUYER ↔ AGENT MESSAGING / CHAT
  // =========================================================================

  async startConversation(user: AuthenticatedUser, dto: StartConversationDto) {
    if (!Types.ObjectId.isValid(dto.recipientId)) {
      throw new BadRequestException('Invalid recipient ID');
    }

    const currentUserId = new Types.ObjectId(user.id);
    const recipientId = new Types.ObjectId(dto.recipientId);

    if (currentUserId.equals(recipientId)) {
      throw new BadRequestException('Cannot start a conversation with yourself');
    }

    const recipient = await this.userModel.findById(recipientId);
    if (!recipient) throw new NotFoundException('Recipient user not found');

    // Check if conversation already exists between these 2 participants
    let conversation = await this.conversationModel.findOne({
      participants: { $all: [currentUserId, recipientId], $size: 2 },
    });

    let propContext: any = null;
    if (dto.propertyId && Types.ObjectId.isValid(dto.propertyId)) {
      const property = await this.propertyModel.findById(dto.propertyId);
      if (property) {
        const titleEn = typeof property.title === 'string' ? property.title : property.title?.en || 'Property';
        propContext = {
          propertyId: property._id,
          title: titleEn,
          price: property.price?.amount,
          image: property.media?.thumbnailUrl || property.media?.coverImage,
          slug: property.slug,
        };
      }
    }

    if (!conversation) {
      conversation = await this.conversationModel.create({
        participants: [currentUserId, recipientId],
        propertyContext: propContext,
        lastMessage: dto.initialMessage || 'Conversation started',
        lastMessageAt: new Date(),
        lastSenderId: currentUserId,
        unreadCounts: new Map([[recipientId.toString(), dto.initialMessage ? 1 : 0]]),
      });
    }

    // If initial message provided, create message document
    if (dto.initialMessage) {
      await this.messageModel.create({
        conversationId: conversation._id,
        senderId: currentUserId,
        recipientId,
        content: dto.initialMessage,
        isRead: false,
      });

      // Dispatch notification to recipient
      await this.createNotification({
        recipientId,
        type: NotificationType.NEW_MESSAGE,
        title: `New message from ${user.name || 'User'}`,
        message: dto.initialMessage.slice(0, 100),
        data: {
          conversationId: conversation._id.toString(),
          senderId: user.id,
          link: `/dashboard/messages/${conversation._id}`,
        },
      });
    }

    return {
      success: true,
      message: 'Conversation ready',
      data: conversation,
    };
  }

  async getConversations(user: AuthenticatedUser): Promise<{ success: boolean; data: any[] }> {
    const userId = new Types.ObjectId(user.id);
    const conversations = await this.conversationModel
      .find({ participants: userId })
      .populate('participants', 'name mobile email role avatar')
      .sort({ lastMessageAt: -1 })
      .lean();

    const formatted = conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p: any) => p._id.toString() !== user.id,
      );
      const unreadCount = (conv.unreadCounts as any)?.[user.id] || 0;

      return {
        ...conv,
        otherParticipant,
        myUnreadCount: unreadCount,
      };
    });

    return { success: true, data: formatted };
  }

  async getConversationMessages(user: AuthenticatedUser, conversationIdStr: string, page = 1, limit = 30) {
    if (!Types.ObjectId.isValid(conversationIdStr)) {
      throw new BadRequestException('Invalid conversation ID');
    }

    const conversationId = new Types.ObjectId(conversationIdStr);
    const userId = new Types.ObjectId(user.id);

    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isParticipant = conversation.participants.some((p) => p.equals(userId));
    if (!isParticipant && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied to conversation');
    }

    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (Math.max(1, page) - 1) * safeLimit;

    const [messages, total] = await Promise.all([
      this.messageModel
        .find({ conversationId })
        .populate('senderId', 'name mobile avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      this.messageModel.countDocuments({ conversationId }),
    ]);

    return {
      success: true,
      data: {
        conversation,
        messages: messages.reverse(),
        pagination: {
          total,
          page,
          limit: safeLimit,
          totalPages: Math.ceil(total / safeLimit) || 1,
        },
      },
    };
  }

  async sendMessage(user: AuthenticatedUser, conversationIdStr: string, dto: SendMessageDto) {
    if (!Types.ObjectId.isValid(conversationIdStr)) {
      throw new BadRequestException('Invalid conversation ID');
    }

    const conversationId = new Types.ObjectId(conversationIdStr);
    const senderId = new Types.ObjectId(user.id);

    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isParticipant = conversation.participants.some((p) => p.equals(senderId));
    if (!isParticipant) {
      throw new ForbiddenException('Cannot send message to a conversation you are not part of');
    }

    const recipientId = conversation.participants.find((p) => !p.equals(senderId))!;

    const message = await this.messageModel.create({
      conversationId,
      senderId,
      recipientId,
      content: dto.content,
      isRead: false,
    });

    // Update conversation metadata & increment recipient unread count
    const currentUnread = (conversation.unreadCounts as any)?.[recipientId.toString()] || 0;
    if (!conversation.unreadCounts) conversation.unreadCounts = new Map();
    conversation.unreadCounts.set(recipientId.toString(), currentUnread + 1);
    conversation.lastMessage = dto.content;
    conversation.lastMessageAt = new Date();
    conversation.lastSenderId = senderId;
    await conversation.save();

    // Send in-app notification to recipient
    await this.createNotification({
      recipientId,
      type: NotificationType.NEW_MESSAGE,
      title: `Message from ${user.name || 'User'}`,
      message: dto.content.slice(0, 100),
      data: {
        conversationId: conversation._id.toString(),
        messageId: message._id.toString(),
        link: `/dashboard/messages/${conversation._id}`,
      },
    });

    return {
      success: true,
      data: message,
    };
  }

  async markConversationRead(user: AuthenticatedUser, conversationIdStr: string) {
    if (!Types.ObjectId.isValid(conversationIdStr)) {
      throw new BadRequestException('Invalid conversation ID');
    }

    const conversationId = new Types.ObjectId(conversationIdStr);
    const userId = new Types.ObjectId(user.id);

    await Promise.all([
      this.messageModel.updateMany(
        { conversationId, recipientId: userId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } },
      ),
      this.conversationModel.updateOne(
        { _id: conversationId },
        { $set: { [`unreadCounts.${user.id}`]: 0 } },
      ),
    ]);

    return { success: true, message: 'Conversation marked as read' };
  }

  async getTotalUnreadMessageCount(user: AuthenticatedUser) {
    const userId = new Types.ObjectId(user.id);
    const count = await this.messageModel.countDocuments({
      recipientId: userId,
      isRead: false,
    });

    return { success: true, data: { unreadCount: count } };
  }

  // =========================================================================
  // 15.8 — AGENT CONVERSION ANALYTICS
  // =========================================================================

  async getAgentConversionAnalytics(user: AuthenticatedUser) {
    const agentId = new Types.ObjectId(user.id);

    const [leads, siteVisits] = await Promise.all([
      this.leadModel.find({ assignedTo: agentId }).lean(),
      this.siteVisitModel.find({ agentId }).lean(),
    ]);

    const totalLeads = leads.length;
    const statusCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};

    leads.forEach((l) => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
      const src = l.source || 'WEBSITE';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });

    const convertedCount = statusCounts[LeadStatus.CONVERTED] || 0;
    const conversionRate = totalLeads > 0 ? Number(((convertedCount / totalLeads) * 100).toFixed(1)) : 0;

    const siteVisitsCompleted = siteVisits.filter((s) => s.status === SiteVisitStatus.COMPLETED).length;

    // Monthly lead distribution (last 6 months)
    const monthlyLeads: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short' });
      monthlyLeads[key] = 0;
    }

    leads.forEach((l: any) => {
      if (l.createdAt) {
        const d = new Date(l.createdAt);
        const key = d.toLocaleString('default', { month: 'short' });
        if (monthlyLeads[key] !== undefined) {
          monthlyLeads[key]++;
        }
      }
    });

    return {
      success: true,
      data: {
        summary: {
          totalLeads,
          newLeads: statusCounts[LeadStatus.NEW] || 0,
          contacted: statusCounts[LeadStatus.CONTACTED] || 0,
          followUp: statusCounts[LeadStatus.FOLLOW_UP] || 0,
          qualified: statusCounts[LeadStatus.QUALIFIED] || 0,
          interested: statusCounts[LeadStatus.INTERESTED] || 0,
          negotiation: statusCounts[LeadStatus.NEGOTIATION] || 0,
          converted: convertedCount,
          lost: statusCounts[LeadStatus.LOST] || 0,
          siteVisitsRequested: siteVisits.length,
          siteVisitsCompleted,
          conversionRate,
        },
        funnel: [
          { stage: 'Total Inquiries', count: totalLeads },
          { stage: 'Contacted', count: (statusCounts[LeadStatus.CONTACTED] || 0) + (statusCounts[LeadStatus.FOLLOW_UP] || 0) },
          { stage: 'Qualified / Interested', count: (statusCounts[LeadStatus.QUALIFIED] || 0) + (statusCounts[LeadStatus.INTERESTED] || 0) },
          { stage: 'Site Visits', count: siteVisits.length },
          { stage: 'Negotiation', count: statusCounts[LeadStatus.NEGOTIATION] || 0 },
          { stage: 'Converted (Deals Closed)', count: convertedCount },
        ],
        sourceDistribution: Object.entries(sourceCounts).map(([source, count]) => ({ source, count })),
        monthlyTrend: Object.entries(monthlyLeads).map(([month, count]) => ({ month, count })),
      },
    };
  }

  async getAdminPlatformConversionAnalytics() {
    const [leads, siteVisits, users, properties] = await Promise.all([
      this.leadModel.find().lean(),
      this.siteVisitModel.find().lean(),
      this.userModel.countDocuments(),
      this.propertyModel.countDocuments({ status: 'PUBLISHED' }),
    ]);

    const totalLeads = leads.length;
    const statusCounts: Record<string, number> = {};
    leads.forEach((l) => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });

    const converted = statusCounts[LeadStatus.CONVERTED] || 0;
    const platformConversionRate = totalLeads > 0 ? Number(((converted / totalLeads) * 100).toFixed(1)) : 0;

    return {
      success: true,
      data: {
        totalUsers: users,
        publishedProperties: properties,
        totalLeads,
        statusCounts,
        siteVisitsTotal: siteVisits.length,
        siteVisitsCompleted: siteVisits.filter((s) => s.status === SiteVisitStatus.COMPLETED).length,
        platformConversionRate,
      },
    };
  }

  // =========================================================================
  // 15.9 — REVIEWS & RATINGS
  // =========================================================================

  async createReview(user: AuthenticatedUser, dto: CreateReviewDto) {
    if (!Types.ObjectId.isValid(dto.targetId)) {
      throw new BadRequestException('Invalid target ID');
    }

    const authorId = new Types.ObjectId(user.id);
    const targetId = new Types.ObjectId(dto.targetId);

    // Prevent self review for agent
    if (dto.targetType === ReviewTargetType.AGENT && authorId.equals(targetId)) {
      throw new BadRequestException('You cannot review your own profile');
    }

    // Prevent duplicate review by same author on same target
    const existing = await this.reviewModel.findOne({
      authorId,
      targetType: dto.targetType,
      targetId,
    });

    if (existing) {
      throw new ConflictException('You have already submitted a review for this target');
    }

    const review = await this.reviewModel.create({
      authorId,
      authorName: user.name || 'Verified Buyer',
      targetType: dto.targetType,
      targetId,
      rating: dto.rating,
      title: dto.title,
      comment: dto.comment,
      status: ReviewStatus.APPROVED,
    });

    // Notify target agent if applicable
    if (dto.targetType === ReviewTargetType.AGENT) {
      await this.createNotification({
        recipientId: targetId,
        type: NotificationType.REVIEW_RECEIVED,
        title: 'New Rating & Review Received',
        message: `${user.name || 'A client'} gave you a ${dto.rating}-star rating: "${dto.title}"`,
        data: { reviewId: review._id.toString() },
      });
    }

    return {
      success: true,
      message: 'Review submitted successfully',
      data: review,
    };
  }

  async getPublicReviews(targetType: ReviewTargetType, targetIdStr: string) {
    if (!Types.ObjectId.isValid(targetIdStr)) {
      throw new BadRequestException('Invalid target ID');
    }

    const targetId = new Types.ObjectId(targetIdStr);
    const reviews = await this.reviewModel
      .find({ targetType, targetId, status: ReviewStatus.APPROVED })
      .sort({ createdAt: -1 })
      .lean();

    const total = reviews.length;
    const avgRating =
      total > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1))
        : 5.0;

    return {
      success: true,
      data: {
        reviews,
        stats: {
          totalReviews: total,
          averageRating: avgRating,
        },
      },
    };
  }

  async getAdminReviews(status?: ReviewStatus, page = 1, limit = 20) {
    const filter: any = {};
    if (status) filter.status = status;

    const safeLimit = Math.min(Math.max(1, limit), 50);
    const skip = (Math.max(1, page) - 1) * safeLimit;

    const [items, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate('authorId', 'name mobile email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      this.reviewModel.countDocuments(filter),
    ]);

    return {
      success: true,
      data: {
        items,
        pagination: {
          total,
          page,
          limit: safeLimit,
          totalPages: Math.ceil(total / safeLimit) || 1,
        },
      },
    };
  }

  async moderateReview(user: AuthenticatedUser, id: string, dto: ModerateReviewDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid review ID');
    const review = await this.reviewModel.findById(id);
    if (!review) throw new NotFoundException('Review not found');

    review.status = dto.status;
    review.moderatedBy = new Types.ObjectId(user.id);
    review.moderatedAt = new Date();
    if (dto.reason) review.moderationReason = dto.reason;
    await review.save();

    return {
      success: true,
      message: `Review marked as ${dto.status}`,
      data: review,
    };
  }

  // =========================================================================
  // 15.10 — PROPERTY REPORTS & COMPARISON
  // =========================================================================

  async reportProperty(user: AuthenticatedUser, dto: CreateReportDto) {
    if (!Types.ObjectId.isValid(dto.propertyId)) {
      throw new BadRequestException('Invalid property ID');
    }

    const property = await this.propertyModel.findById(dto.propertyId);
    if (!property) throw new NotFoundException('Property not found');

    const report = await this.reportModel.create({
      reporterId: new Types.ObjectId(user.id),
      reporterName: user.name || 'User',
      reporterMobile: user.mobile,
      propertyId: property._id,
      reason: dto.reason,
      description: dto.description,
      status: ReportStatus.PENDING,
    });

    return {
      success: true,
      message: 'Property report submitted for moderation review. Thank you for keeping the marketplace safe.',
      data: report,
    };
  }

  async getAdminReports(status?: ReportStatus, page = 1, limit = 20) {
    const filter: any = {};
    if (status) filter.status = status;

    const safeLimit = Math.min(Math.max(1, limit), 50);
    const skip = (Math.max(1, page) - 1) * safeLimit;

    const [items, total] = await Promise.all([
      this.reportModel
        .find(filter)
        .populate('propertyId', 'title slug price location media status')
        .populate('reporterId', 'name mobile email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      this.reportModel.countDocuments(filter),
    ]);

    return {
      success: true,
      data: {
        items,
        pagination: {
          total,
          page,
          limit: safeLimit,
          totalPages: Math.ceil(total / safeLimit) || 1,
        },
      },
    };
  }

  async resolveReport(user: AuthenticatedUser, id: string, dto: ResolveReportDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid report ID');
    const report = await this.reportModel.findById(id);
    if (!report) throw new NotFoundException('Report not found');

    report.status = dto.status;
    report.resolutionNotes = dto.resolutionNotes || null;
    report.actionTaken = dto.actionTaken || null;
    report.resolvedBy = new Types.ObjectId(user.id);
    report.resolvedAt = new Date();
    await report.save();

    // If action is UNPUBLISH, update the property
    if (dto.actionTaken === 'UNPUBLISHED') {
      await this.propertyModel.updateOne(
        { _id: report.propertyId },
        {
          $set: {
            status: 'UNPUBLISHED',
            moderationStatus: 'REJECTED',
          },
        },
      );
    }

    // Notify reporter
    await this.createNotification({
      recipientId: report.reporterId,
      type: NotificationType.REPORT_STATUS_UPDATED,
      title: 'Property Report Updated',
      message: `Your report regarding listing has been marked as ${dto.status}. ${dto.resolutionNotes || ''}`,
      data: { reportId: report._id.toString() },
    });

    return {
      success: true,
      message: `Report marked as ${dto.status}`,
      data: report,
    };
  }

  async compareProperties(dto: ComparePropertiesDto) {
    const validIds = dto.propertyIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (validIds.length < 2) {
      throw new BadRequestException('Provide at least 2 valid property IDs to compare');
    }

    const properties = await this.propertyModel
      .find({
        _id: { $in: validIds },
        status: 'PUBLISHED',
        moderationStatus: 'APPROVED',
      })
      .lean();

    if (properties.length < 2) {
      throw new NotFoundException('Could not find enough published properties for comparison');
    }

    const comparisonItems = properties.map((p) => {
      const price = p.price?.amount || 0;
      const area = p.specs?.area || p.specs?.carpetArea || 0;
      const pricePerSqFt = area > 0 ? Math.round(price / area) : null;
      const titleEn = typeof p.title === 'string' ? p.title : p.title?.en || 'Property';

      return {
        _id: p._id,
        title: titleEn,
        slug: p.slug,
        price: p.price,
        formattedPrice: `₹${price.toLocaleString('en-IN')}`,
        specs: p.specs,
        pricePerSqFt,
        listingType: p.listingType,
        category: p.category,
        location: p.location,
        media: p.media,
        isFeatured: p.isFeatured || false,
      };
    });

    return {
      success: true,
      data: {
        properties: comparisonItems,
        attributeMatrix: {
          price: comparisonItems.map((c) => ({ id: c._id, value: c.formattedPrice })),
          pricePerSqFt: comparisonItems.map((c) => ({ id: c._id, value: c.pricePerSqFt ? `₹${c.pricePerSqFt.toLocaleString('en-IN')}/sq.ft` : 'N/A' })),
          bedrooms: comparisonItems.map((c) => ({ id: c._id, value: c.specs?.bedrooms || 'N/A' })),
          bathrooms: comparisonItems.map((c) => ({ id: c._id, value: c.specs?.bathrooms || 'N/A' })),
          area: comparisonItems.map((c) => ({ id: c._id, value: c.specs?.area ? `${c.specs.area} sq.ft` : 'N/A' })),
          location: comparisonItems.map((c) => ({ id: c._id, value: `${c.location?.locality || ''}, ${c.location?.city || ''}` })),
          furnishing: comparisonItems.map((c) => ({ id: c._id, value: c.specs?.furnishing || 'N/A' })),
          constructionStatus: comparisonItems.map((c) => ({ id: c._id, value: c.specs?.constructionStatus || 'N/A' })),
        },
      },
    };
  }
}
