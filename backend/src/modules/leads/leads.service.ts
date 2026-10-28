import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import { Lead, LeadDocument, LeadActivity, LeadFollowUp } from './schemas/lead.schema';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { AuditLog, AuditLogDocument } from '../admin/schemas/audit-log.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadStatusDto, UpdateLeadPriorityDto } from './dto/update-lead-status.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { AddLeadNoteDto } from './dto/add-lead-note.dto';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { CreateLeadFollowUpDto } from './dto/create-lead-follow-up.dto';
import { SetFollowUpDto } from './dto/set-follow-up.dto';
import { LeadQueryDto } from './dto/lead-query.dto';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole, AccountType } from '../auth/enums/auth.enums';
import {
  LeadStatus,
  LeadPriority,
  LeadSource,
  ActivityType,
  FollowUpStatus,
  FollowUpType,
} from './enums/lead.enums';

import { WhatsAppService } from './whatsapp.service';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    @InjectModel(Lead.name) private readonly leadModel: Model<LeadDocument>,
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly whatsappService: WhatsAppService,
  ) {}

  /**
   * Helper: Check if user is an Administrator
   */
  private isAdmin(user: AuthenticatedUser): boolean {
    return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
  }

  /**
   * Helper: Get all valid identifiers for a user
   */
  private getUserIdentifiers(user: AuthenticatedUser): string[] {
    return [user.id, user.mobile, user.normalizedMobile].filter(Boolean);
  }

  /**
   * 1. Public / Authenticated Property Enquiry Submission
   * Handles duplicate active enquiries gracefully (reusing/updating active lead).
   */
  async createLead(dto: CreateLeadDto, purchaser?: AuthenticatedUser) {
    // 1. Validate property exists and is published
    const propQuery: any = isValidObjectId(dto.propertyId)
      ? { $or: [{ _id: dto.propertyId }, { id: dto.propertyId }] }
      : { id: dto.propertyId };

    const property = await this.propertyModel.findOne(propQuery);

    if (!property) {
      throw new NotFoundException(`Property with ID "${dto.propertyId}" was not found.`);
    }

    if (!property.isPublished || property.status !== 'PUBLISHED') {
      throw new BadRequestException('Enquiries can only be submitted for active, published listings.');
    }

    const cleanPropId = property.id || property._id.toString();
    const purchaserId = purchaser?.id;
    const cleanName = (dto.name && dto.name.trim()) || purchaser?.name || 'Interested Buyer';
    const mobile = (dto.mobile && dto.mobile.trim()) || purchaser?.mobile || purchaser?.normalizedMobile || 'Not Provided';

    // 2. Derive recipient server-side and snapshot property details
    const recipientOwnerId = property.ownerId || property.createdBy || 'usr-system';
    const recipientAgentId = property.advertiserId || property.ownerId || recipientOwnerId;

    const propertyTitle = property.title?.en || (typeof property.title === 'string' ? property.title : 'Property Listing');
    const propertySlug = property.slug;
    const propertyImage =
      property.media?.thumbnailUrl ||
      property.media?.coverImage ||
      (Array.isArray(property.media?.images) && property.media.images.length > 0 ? property.media.images[0] : '');
    const propertyPrice = typeof property.price === 'number' ? property.price : property.price?.amount;
    const propertyLocation = [
      property.location?.society,
      property.location?.subArea,
      property.location?.area || property.location?.locality,
      property.location?.city,
      property.location?.state,
    ]
      .filter(Boolean)
      .join(', ');
    const propertyAdvertiserName = property.advertiser?.name || '';
    const propertyAdvertiserPhone = property.advertiser?.phone || '';
    const propertyAgencyName = property.advertiser?.agencyName || '';

    // Resolve brokerId for team / agency tracking
    let resolvedBrokerId: string | undefined = property.brokerId;
    if (!resolvedBrokerId && recipientOwnerId && recipientOwnerId !== 'usr-system') {
      try {
        const ownerUser = await this.userModel
          .findOne({
            $or: [
              ...(isValidObjectId(recipientOwnerId) ? [{ _id: recipientOwnerId }] : []),
              { mobile: recipientOwnerId },
            ],
          })
          .lean();

        if (ownerUser) {
          if (ownerUser.brokerId || ownerUser.parentUserId || ownerUser.agencyId) {
            resolvedBrokerId = ownerUser.brokerId || ownerUser.parentUserId || ownerUser.agencyId;
          } else if (ownerUser.role === UserRole.BROKER || ownerUser.accountType === AccountType.BROKER) {
            resolvedBrokerId = ownerUser._id ? ownerUser._id.toString() : (ownerUser as any).id;
          }
        }
      } catch {
        // Fallback gracefully
      }
    }

    const rawMsg = dto.message && dto.message.trim();
    const defaultMsg =
      dto.source === LeadSource.WHATSAPP
        ? `Initiated WhatsApp inquiry for ${propertyTitle}`
        : dto.source === LeadSource.CALL
        ? `Initiated phone call for ${propertyTitle}`
        : `Interested in ${propertyTitle}`;
    const cleanMessage = rawMsg || defaultMsg;

    // 3. Check for existing active lead from the same purchaser for the same property
    const activeFilter: any = {
      propertyId: cleanPropId,
      status: { $nin: [LeadStatus.CONVERTED, LeadStatus.LOST, LeadStatus.CANCELLED, LeadStatus.CLOSED] },
      $or: [
        ...(purchaserId ? [{ purchaserId }] : []),
        ...(mobile && mobile !== 'Not Provided' ? [{ mobile }] : []),
      ],
    };

    if (activeFilter.$or.length > 0) {
      const existingActiveLead = await this.leadModel.findOne(activeFilter);

      if (existingActiveLead) {
        // Debounce: check if inquiry occurred within the last 15 seconds with the same source
        const lastActionTime = existingActiveLead.lastContactAt || existingActiveLead.createdAt || new Date(0);
        const timeDiffSeconds = (Date.now() - new Date(lastActionTime).getTime()) / 1000;
        const sameSource = existingActiveLead.source === (dto.source || LeadSource.PROPERTY_ENQUIRY);

        if (timeDiffSeconds < 15 && sameSource) {
          this.logger.log(`ℹ️ Debounced rapid repeat inquiry for lead ${existingActiveLead._id}`);
          return {
            success: true,
            message: 'Your enquiry has been received.',
            leadId: existingActiveLead._id.toString(),
          };
        }

        // Append note and activity to existing active lead instead of creating spam duplicate
        const updateNote = {
          text: `Repeated inquiry received from ${cleanName}: "${cleanMessage}"`,
          authorId: purchaserId || 'public_visitor',
          authorName: cleanName,
          createdAt: new Date(),
        };

        const updateActivity: LeadActivity = {
          _id: new Types.ObjectId().toString(),
          actorId: purchaserId || 'public_visitor',
          actorName: cleanName,
          actorRole: purchaser?.role || 'GUEST',
          type: ActivityType.NOTE,
          note: `New message received on active enquiry: "${cleanMessage}"`,
          metadata: { source: dto.source || LeadSource.PROPERTY_ENQUIRY },
          createdAt: new Date(),
        };

        existingActiveLead.notes.push(updateNote);
        existingActiveLead.activities.push(updateActivity);
        existingActiveLead.lastContactAt = new Date();
        if (dto.email && !existingActiveLead.email) {
          existingActiveLead.email = dto.email.trim().toLowerCase();
        }
        await existingActiveLead.save();

        this.logger.log(`ℹ️ Updated existing active Lead: ${existingActiveLead._id} for property ${cleanPropId}`);

        return {
          success: true,
          message: 'Your enquiry has been updated and forwarded to the advertiser.',
          leadId: existingActiveLead._id.toString(),
        };
      }
    }

    const lead = await this.leadModel.create({
      propertyId: cleanPropId,
      propertyTitle,
      propertySlug,
      propertyImage,
      propertyPrice,
      propertyLocation,
      propertyAdvertiserName,
      propertyAdvertiserPhone,
      propertyAgencyName,
      agentId: recipientAgentId,
      assignedAgentId: recipientAgentId,
      ownerId: recipientOwnerId,
      brokerId: resolvedBrokerId,
      purchaserId: purchaserId,
      name: cleanName,
      contactName: cleanName,
      mobile: mobile,
      contactPhone: mobile,
      email: dto.email?.trim().toLowerCase(),
      contactEmail: dto.email?.trim().toLowerCase(),
      subject: dto.subject?.trim() || `Inquiry for ${propertyTitle}`,
      message: cleanMessage,
      budget: dto.budget,
      preferredLocation: dto.preferredLocation,
      source: dto.source || LeadSource.PROPERTY_ENQUIRY,
      status: LeadStatus.NEW,
      priority: LeadPriority.MEDIUM,
      notes: [
        {
          text: `Inquiry received from public marketplace: "${cleanMessage}"`,
          authorId: purchaserId || 'public_visitor',
          authorName: cleanName,
          createdAt: new Date(),
        },
      ],
      activities: [
        {
          _id: new Types.ObjectId().toString(),
          actorId: purchaserId || 'public_visitor',
          actorName: cleanName,
          actorRole: purchaser?.role || 'GUEST',
          type: ActivityType.NOTE,
          note: `Lead created from public marketplace enquiry: "${cleanMessage}"`,
          metadata: { source: dto.source || LeadSource.PROPERTY_ENQUIRY, propertyId: cleanPropId },
          createdAt: new Date(),
        },
      ],
      assignedAt: new Date(),
    });

    this.logger.log(
      `✅ New Lead created: ${lead._id} for property ${cleanPropId} assigned to agent/owner ${recipientAgentId}`,
    );

    // 4. Dispatch WhatsApp Notification to Configured Destination Number & Advertiser
    try {
      const waResult = await this.whatsappService.sendLeadNotification({
        leadId: lead._id.toString(),
        propertyId: cleanPropId,
        propertyTitle,
        propertySlug,
        customerName: cleanName,
        customerMobile: mobile,
        customerEmail: dto.email?.trim(),
        message: dto.message.trim(),
        advertiserPhone: propertyAdvertiserPhone,
        enquiryDate: new Date(),
      });
      if (waResult) {
        lead.whatsappStatus = waResult.status;
        lead.whatsappSentAt = waResult.sentAt;
        lead.whatsappError = waResult.error;
        lead.whatsappDestinationNumber = waResult.recipient;
        await lead.save();
      }
    } catch (waErr: any) {
      this.logger.error(`WhatsApp lead notification dispatch error: ${waErr.message}`);
      lead.whatsappStatus = 'FAILED';
      lead.whatsappError = waErr.message;
      await lead.save().catch(() => {});
    }

    // 5. Record Audit Log
    await this.auditLogModel.create({
      action: 'LEAD_CREATED',
      actorUserId: purchaserId || 'anonymous_public',
      actorName: dto.name ? dto.name.trim() : cleanName,
      actorRole: purchaser?.role || 'GUEST',
      targetUserId: recipientAgentId,
      targetEntity: 'LEAD',
      targetEntityId: lead._id.toString(),
      newValue: {
        propertyId: cleanPropId,
        leadName: dto.name ? dto.name.trim() : cleanName,
        mobile: mobile,
        source: lead.source,
      },
      reason: 'Public property enquiry submitted',
      timestamp: new Date(),
    });

    return {
      success: true,
      message: 'Thank you! Your enquiry has been sent to the property advertiser. They will contact you shortly.',
      leadId: lead._id.toString(),
    };
  }

  /**
   * 2. Query Leads with RBAC & Multi-Criteria Filtering
   */
  async getLeads(user: AuthenticatedUser, queryDto: LeadQueryDto) {
    const filter: any = {};
    const userIdentifiers = this.getUserIdentifiers(user);

    // RBAC Isolation: Agents and Owners can only see their own assigned/owned leads
    if (!this.isAdmin(user)) {
      const isEmployee = user.role === UserRole.BROKER_AGENT || user.accountType === 'BROKER_AGENT';
      if (isEmployee) {
        const employeeUser = await this.userModel.findById(user.id).lean();
        const effectiveBrokerId = employeeUser?.brokerId || employeeUser?.parentUserId || employeeUser?.agencyId;
        const assignedProps = employeeUser?.assignedProperties || [];

        if (Array.isArray(assignedProps) && assignedProps.length > 0) {
          filter.$or = [
            { assignedAgentId: { $in: userIdentifiers } },
            { propertyId: { $in: assignedProps } },
            { ownerId: { $in: userIdentifiers } },
          ];
        } else {
          filter.$or = [
            { assignedAgentId: { $in: userIdentifiers } },
            { agentId: { $in: userIdentifiers } },
            { ownerId: { $in: userIdentifiers } },
            ...(effectiveBrokerId ? [{ brokerId: effectiveBrokerId }, { ownerId: effectiveBrokerId }, { agentId: effectiveBrokerId }] : []),
          ];
        }
      } else {
        filter.$or = [
          { agentId: { $in: userIdentifiers } },
          { assignedAgentId: { $in: userIdentifiers } },
          { ownerId: { $in: userIdentifiers } },
          { brokerId: { $in: userIdentifiers } },
        ];
      }
    } else {
      // Admin filters
      if (queryDto.agentId) {
        filter.$or = [
          { agentId: queryDto.agentId },
          { assignedAgentId: queryDto.agentId },
          { brokerId: queryDto.agentId },
          { ownerId: queryDto.agentId },
        ];
      }
      if (queryDto.unassigned === 'true') {
        filter.$or = [
          { assignedAgentId: { $exists: false } },
          { assignedAgentId: null },
          { assignedAgentId: '' },
          { agentId: 'usr-system' },
        ];
      }
    }

    if (queryDto.status && queryDto.status !== 'ALL') {
      filter.status = queryDto.status;
    }

    if (queryDto.priority && queryDto.priority !== 'ALL') {
      filter.priority = queryDto.priority;
    }

    if (queryDto.source && queryDto.source !== 'ALL') {
      filter.source = queryDto.source;
    }

    if (queryDto.propertyId) {
      filter.propertyId = queryDto.propertyId;
    }

    const targetPurchaser = queryDto.purchaserId || queryDto.userId;
    if (targetPurchaser) {
      filter.purchaserId = targetPurchaser;
    }

    if (queryDto.startDate || queryDto.endDate) {
      filter.createdAt = {};
      if (queryDto.startDate) filter.createdAt.$gte = new Date(queryDto.startDate);
      if (queryDto.endDate) {
        const end = new Date(queryDto.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (queryDto.q && queryDto.q.trim()) {
      const regex = new RegExp(queryDto.q.trim(), 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { name: regex },
          { contactName: regex },
          { mobile: regex },
          { contactPhone: regex },
          { email: regex },
          { contactEmail: regex },
          { message: regex },
          { subject: regex },
        ],
      });
    }

    const page = Math.max(1, Number(queryDto.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(queryDto.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, leads] = await Promise.all([
      this.leadModel.countDocuments(filter),
      this.leadModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    // Fetch property and agent context
    const propertyIds = [...new Set(leads.map((l: any) => l.propertyId))];
    const agentIds = [...new Set(leads.map((l: any) => l.assignedAgentId || l.agentId).filter(Boolean))];

    const [properties, agents] = await Promise.all([
      propertyIds.length > 0
        ? this.propertyModel
            .find({
              $or: [
                { id: { $in: propertyIds } },
                ...(propertyIds.filter((id) => isValidObjectId(id)).map((id) => ({ _id: id }))),
              ],
            })
            .select({ id: 1, slug: 1, title: 1, price: 1, category: 1, location: 1, media: 1, specs: 1, advertiser: 1, ownerId: 1 })
            .lean()
        : [],
      agentIds.length > 0
        ? this.userModel
            .find({
              $or: [
                { _id: { $in: agentIds.filter((id) => isValidObjectId(id)) } },
                { mobile: { $in: agentIds } },
                { normalizedMobile: { $in: agentIds } },
              ],
            })
            .select({ _id: 1, name: 1, mobile: 1, role: 1 })
            .lean()
        : [],
    ]);

    const propMap = new Map();
    properties.forEach((p: any) => {
      const pId = p.id || p._id?.toString();
      const formattedLoc = typeof p.location === 'string'
        ? p.location
        : [p.location?.society, p.location?.subArea, p.location?.area || p.location?.locality, p.location?.city, p.location?.state]
            .filter(Boolean)
            .join(', ');

      propMap.set(pId, {
        id: p.id,
        slug: p.slug,
        title: typeof p.title === 'string' ? p.title : p.title?.en,
        price: typeof p.price === 'number' ? p.price : p.price?.amount,
        category: p.category,
        location: formattedLoc,
        thumbnailUrl: p.media?.thumbnailUrl || p.media?.coverImage || (Array.isArray(p.media?.images) && p.media.images.length > 0 ? p.media.images[0] : null),
        advertiser: p.advertiser,
      });
    });

    const agentMap = new Map();
    agents.forEach((a: any) => {
      agentMap.set(a._id.toString(), { id: a._id.toString(), name: a.name, mobile: a.mobile, role: a.role });
      agentMap.set(a.mobile, { id: a._id.toString(), name: a.name, mobile: a.mobile, role: a.role });
      if (a.normalizedMobile) agentMap.set(a.normalizedMobile, { id: a._id.toString(), name: a.name, mobile: a.mobile, role: a.role });
    });

    const data = leads.map((l: any) => {
      const propInfo = propMap.get(l.propertyId) || {};
      const agentInfo = agentMap.get(l.assignedAgentId || l.agentId) || null;
      return {
        id: l._id.toString(),
        propertyId: l.propertyId,
        propertyTitle: l.propertyTitle || propInfo.title || 'myproperty Property Listing',
        propertySlug: l.propertySlug || propInfo.slug,
        propertyPrice: l.propertyPrice !== undefined ? l.propertyPrice : propInfo.price,
        propertyLocation: l.propertyLocation || propInfo.location,
        propertyImage: l.propertyImage || propInfo.thumbnailUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
        propertyUrl: l.propertyUrl || (propInfo.slug ? `/property/${propInfo.slug}` : undefined),
        propertyAdvertiser: propInfo.advertiser || (l.propertyAdvertiserName ? { name: l.propertyAdvertiserName, phone: l.propertyAdvertiserPhone, agencyName: l.propertyAgencyName } : null),
        whatsappStatus: l.whatsappStatus || 'MOCK_SENT',
        whatsappSentAt: l.whatsappSentAt || l.createdAt,
        whatsappError: l.whatsappError,
        whatsappDestinationNumber: l.whatsappDestinationNumber,
        name: l.name || l.contactName,
        mobile: l.mobile || l.contactPhone,
        email: l.email || l.contactEmail,
        subject: l.subject,
        message: l.message,
        source: l.source,
        status: l.status,
        priority: l.priority,
        ownerId: l.ownerId,
        brokerId: l.brokerId,
        purchaserId: l.purchaserId,
        assignedAgentId: l.assignedAgentId || l.agentId,
        assignedAgent: agentInfo,
        assignedBy: l.assignedBy,
        assignedAt: l.assignedAt,
        notesCount: l.notes?.length || 0,
        activitiesCount: l.activities?.length || 0,
        pendingFollowUpsCount: (l.followUps || []).filter((f: any) => f.status === FollowUpStatus.PENDING).length,
        nextFollowUpAt: l.nextFollowUpAt,
        lastContactAt: l.lastContactAt,
        convertedAt: l.convertedAt,
        lostAt: l.lostAt,
        lostReason: l.lostReason,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
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

  /**
   * 3. Get Leads assigned to current Agent / Property Owner (alias for getLeads)
   */
  async getMyLeads(user: AuthenticatedUser, queryDto: LeadQueryDto) {
    return this.getLeads(user, queryDto);
  }

  /**
   * 4. Get Lead by ID with strict ownership validation & enriched details
   */
  async getLeadById(id: string, user: AuthenticatedUser) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid Lead ID format');
    }

    const lead = await this.leadModel.findById(id).lean();
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" was not found.`);
    }

    const userIdentifiers = this.getUserIdentifiers(user);
    const isPurchaserOwner =
      (lead.purchaserId && userIdentifiers.includes(lead.purchaserId)) ||
      (lead.mobile && userIdentifiers.includes(lead.mobile));

    let isAuthorized = false;
    let isAgentOrOwner = false;
    if (this.isAdmin(user) || isPurchaserOwner) {
      isAuthorized = true;
    } else {
      const isEmployee = user.role === UserRole.BROKER_AGENT || user.accountType === 'BROKER_AGENT';
      if (isEmployee) {
        const employeeUser = await this.userModel.findById(user.id).lean();
        const effectiveBrokerId = employeeUser?.brokerId || employeeUser?.parentUserId || employeeUser?.agencyId;
        const assignedProps = employeeUser?.assignedProperties || [];

        const isDirectAssigned = Boolean(lead.assignedAgentId && userIdentifiers.includes(lead.assignedAgentId));
        const belongsToBroker = Boolean(
          (lead.agentId && (lead.agentId === effectiveBrokerId || userIdentifiers.includes(lead.agentId))) ||
          (lead.ownerId && lead.ownerId === effectiveBrokerId) ||
          (lead.brokerId && lead.brokerId === effectiveBrokerId),
        );

        if (Array.isArray(assignedProps) && assignedProps.length > 0) {
          isAuthorized = Boolean(isDirectAssigned || (belongsToBroker && assignedProps.includes(lead.propertyId)));
        } else {
          isAuthorized = Boolean(isDirectAssigned || belongsToBroker);
        }
        isAgentOrOwner = isAuthorized;
      } else {
        isAgentOrOwner = Boolean(
          (lead.agentId && userIdentifiers.includes(lead.agentId)) ||
          (lead.assignedAgentId && userIdentifiers.includes(lead.assignedAgentId)) ||
          (lead.ownerId && userIdentifiers.includes(lead.ownerId)) ||
          (lead.brokerId && userIdentifiers.includes(lead.brokerId)),
        );
        isAuthorized = isAgentOrOwner;
      }
    }

    if (!isAuthorized) {
      throw new ForbiddenException('You do not have permission to view this lead.');
    }

    const [property, assignedUser] = await Promise.all([
      this.propertyModel
        .findOne({
          $or: [
            { id: lead.propertyId },
            ...(isValidObjectId(lead.propertyId) ? [{ _id: lead.propertyId }] : []),
          ],
        })
        .select({ id: 1, slug: 1, title: 1, price: 1, category: 1, location: 1, media: 1, advertiser: 1 })
        .lean(),
      lead.assignedAgentId || lead.agentId
        ? this.userModel
            .findOne({
              $or: [
                ...(isValidObjectId(lead.assignedAgentId || lead.agentId)
                  ? [{ _id: lead.assignedAgentId || lead.agentId }]
                  : []),
                { mobile: lead.assignedAgentId || lead.agentId },
              ],
            })
            .select({ _id: 1, name: 1, mobile: 1, role: 1 })
            .lean()
        : null,
    ]);

    // If requester is a purchaser, sanitize internal CRM notes, activities, and follow-ups
    if (isPurchaserOwner && !isAgentOrOwner && !this.isAdmin(user)) {
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
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      };
    }

    const formattedLoc = property
      ? typeof property.location === 'string'
        ? property.location
        : [property.location?.society, property.location?.subArea, property.location?.area || property.location?.locality, property.location?.city, property.location?.state]
            .filter(Boolean)
            .join(', ')
      : lead.propertyLocation || 'Location unavailable';

    return {
      id: lead._id.toString(),
      property: property
        ? {
            id: property.id,
            slug: property.slug,
            title: typeof property.title === 'string' ? property.title : property.title?.en,
            price: typeof property.price === 'number' ? property.price : property.price?.amount,
            category: property.category,
            location: formattedLoc,
            thumbnailUrl: property.media?.thumbnailUrl || property.media?.coverImage || (Array.isArray(property.media?.images) ? property.media.images[0] : null) || lead.propertyImage,
            advertiser: property.advertiser || (lead.propertyAdvertiserName ? { name: lead.propertyAdvertiserName, phone: lead.propertyAdvertiserPhone, agencyName: lead.propertyAgencyName } : null),
          }
        : {
            id: lead.propertyId,
            slug: lead.propertySlug,
            title: lead.propertyTitle || 'myproperty Property Listing',
            price: lead.propertyPrice,
            location: lead.propertyLocation,
            thumbnailUrl: lead.propertyImage,
            advertiser: lead.propertyAdvertiserName ? { name: lead.propertyAdvertiserName, phone: lead.propertyAdvertiserPhone, agencyName: lead.propertyAgencyName } : null,
          },
      propertyTitle: lead.propertyTitle || (property ? (typeof property.title === 'string' ? property.title : property.title?.en) : 'myproperty Property Listing'),
      propertySlug: lead.propertySlug || property?.slug,
      propertyLocation: formattedLoc,
      propertyImage: lead.propertyImage || property?.media?.thumbnailUrl || property?.media?.coverImage,
      propertyPrice: lead.propertyPrice !== undefined ? lead.propertyPrice : (property ? (typeof property.price === 'number' ? property.price : property.price?.amount) : undefined),
      propertyUrl: lead.propertyUrl || (property?.slug ? `/property/${property.slug}` : undefined),
      whatsappStatus: lead.whatsappStatus || 'MOCK_SENT',
      whatsappSentAt: lead.whatsappSentAt || lead.createdAt,
      whatsappError: lead.whatsappError,
      whatsappDestinationNumber: lead.whatsappDestinationNumber,
      name: lead.name || lead.contactName,
      mobile: lead.mobile || lead.contactPhone,
      email: lead.email || lead.contactEmail,
      subject: lead.subject,
      message: lead.message,
      budget: lead.budget,
      preferredLocation: lead.preferredLocation,
      source: lead.source,
      status: lead.status,
      priority: lead.priority,
      ownerId: lead.ownerId,
      brokerId: lead.brokerId,
      purchaserId: lead.purchaserId,
      assignedAgentId: lead.assignedAgentId || lead.agentId,
      assignedAgent: assignedUser
        ? {
            id: assignedUser._id.toString(),
            name: assignedUser.name,
            mobile: assignedUser.mobile,
            role: assignedUser.role,
          }
        : null,
      assignedBy: lead.assignedBy,
      assignedAt: lead.assignedAt,
      notes: lead.notes || [],
      activities: (lead.activities || []).sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
      followUps: (lead.followUps || []).sort(
        (a: any, b: any) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
      ),
      nextFollowUpAt: lead.nextFollowUpAt,
      firstContactAt: lead.firstContactAt,
      lastContactAt: lead.lastContactAt,
      convertedAt: lead.convertedAt,
      lostAt: lead.lostAt,
      lostReason: lead.lostReason,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };
  }

  /**
   * 5. Update Lead Status with Workflow Validation & Activity Recording
   */
  async updateLeadStatus(id: string, user: AuthenticatedUser, dto: UpdateLeadStatusDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid Lead ID');
    }

    const lead = await this.leadModel.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" was not found.`);
    }

    const userIdentifiers = this.getUserIdentifiers(user);
    const isAuthorized =
      (lead.agentId && userIdentifiers.includes(lead.agentId)) ||
      (lead.assignedAgentId && userIdentifiers.includes(lead.assignedAgentId)) ||
      (lead.ownerId && userIdentifiers.includes(lead.ownerId)) ||
      (lead.brokerId && userIdentifiers.includes(lead.brokerId)) ||
      this.isAdmin(user);

    if (!isAuthorized) {
      throw new ForbiddenException('You do not have permission to modify this lead.');
    }

    const prevStatus = lead.status;
    lead.status = dto.status;

    if (!lead.firstContactAt && dto.status !== LeadStatus.NEW) {
      lead.firstContactAt = new Date();
    }
    lead.lastContactAt = new Date();

    if (dto.status === LeadStatus.CONVERTED) {
      lead.convertedAt = new Date();
    } else if (dto.status === LeadStatus.LOST || dto.status === LeadStatus.CANCELLED) {
      lead.lostAt = new Date();
      lead.lostReason = dto.lostReason || dto.note || `Marked as ${dto.status}`;
    }

    // Append internal note if provided
    if (dto.note) {
      lead.notes.push({
        text: `Status updated from ${prevStatus} to ${dto.status}: ${dto.note}`,
        authorId: user.id,
        authorName: user.name || 'Agent',
        createdAt: new Date(),
      });
    }

    // Append Activity
    const activity: LeadActivity = {
      _id: new Types.ObjectId().toString(),
      actorId: user.id,
      actorName: user.name || 'Agent',
      actorRole: user.role,
      type: ActivityType.STATUS_CHANGE,
      note: `Status changed from ${prevStatus} to ${dto.status}${dto.note ? ` (${dto.note})` : ''}`,
      metadata: { previousStatus: prevStatus, newStatus: dto.status, lostReason: lead.lostReason },
      createdAt: new Date(),
    };
    lead.activities.push(activity);

    await lead.save();

    // Audit Log
    await this.auditLogModel.create({
      action: 'LEAD_STATUS_CHANGED',
      actorUserId: user.id,
      actorName: user.name || 'Agent',
      actorRole: user.role,
      targetUserId: lead.purchaserId || lead.mobile,
      targetEntity: 'LEAD',
      targetEntityId: lead._id.toString(),
      previousValue: { status: prevStatus },
      newValue: { status: dto.status, lostReason: lead.lostReason },
      reason: dto.note || `Lead status updated to ${dto.status}`,
      timestamp: new Date(),
    });

    return {
      success: true,
      message: `Lead status updated to ${dto.status}.`,
      lead: {
        id: lead._id.toString(),
        status: lead.status,
        lastContactAt: lead.lastContactAt,
        convertedAt: lead.convertedAt,
        lostAt: lead.lostAt,
      },
    };
  }

  /**
   * 6. Update Lead Priority
   */
  async updateLeadPriority(id: string, user: AuthenticatedUser, dto: UpdateLeadPriorityDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid Lead ID');
    }

    const lead = await this.leadModel.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" was not found.`);
    }

    const userIdentifiers = this.getUserIdentifiers(user);
    const isAuthorized =
      (lead.agentId && userIdentifiers.includes(lead.agentId)) ||
      (lead.assignedAgentId && userIdentifiers.includes(lead.assignedAgentId)) ||
      (lead.ownerId && userIdentifiers.includes(lead.ownerId)) ||
      (lead.brokerId && userIdentifiers.includes(lead.brokerId)) ||
      this.isAdmin(user);

    if (!isAuthorized) {
      throw new ForbiddenException('You do not have permission to modify this lead.');
    }

    const prevPriority = lead.priority;
    lead.priority = dto.priority;

    lead.activities.push({
      _id: new Types.ObjectId().toString(),
      actorId: user.id,
      actorName: user.name || 'Agent',
      actorRole: user.role,
      type: ActivityType.STATUS_CHANGE,
      note: `Priority changed from ${prevPriority} to ${dto.priority}`,
      metadata: { previousPriority: prevPriority, newPriority: dto.priority },
      createdAt: new Date(),
    });

    await lead.save();

    return {
      success: true,
      message: `Lead priority updated to ${dto.priority}.`,
      priority: lead.priority,
    };
  }

  /**
   * 7. Assign / Reassign Lead to an Agent (Admin or Property Owner)
   */
  async assignLead(id: string, user: AuthenticatedUser, dto: AssignLeadDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid Lead ID');
    }

    const lead = await this.leadModel.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" was not found.`);
    }

    const userIdentifiers = this.getUserIdentifiers(user);
    const canAssign =
      this.isAdmin(user) ||
      (lead.ownerId && userIdentifiers.includes(lead.ownerId)) ||
      (lead.brokerId && userIdentifiers.includes(lead.brokerId)) ||
      (lead.agentId && userIdentifiers.includes(lead.agentId)) ||
      (lead.assignedAgentId && userIdentifiers.includes(lead.assignedAgentId));

    if (!canAssign) {
      throw new ForbiddenException('Only Administrators, Property Owners, or assigned Brokers can assign leads.');
    }

    // Validate target agent exists and has appropriate role
    const targetAgentQuery = isValidObjectId(dto.assignedAgentId)
      ? { _id: dto.assignedAgentId }
      : { mobile: dto.assignedAgentId };

    const targetAgent = await this.userModel.findOne(targetAgentQuery);
    if (!targetAgent) {
      throw new NotFoundException(`Target agent with identifier "${dto.assignedAgentId}" does not exist.`);
    }

    const isEmployeeRole =
      targetAgent.role === UserRole.BROKER_AGENT ||
      targetAgent.accountType === AccountType.BROKER_AGENT;
    const allowedStandardRoles = [
      UserRole.AGENT,
      UserRole.VERIFIED_AGENT,
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ];

    if (!allowedStandardRoles.includes(targetAgent.role) && !isEmployeeRole) {
      throw new BadRequestException(
        `User ${targetAgent.name} cannot be assigned leads because role is ${targetAgent.role}.`,
      );
    }

    // Strict tenant isolation: verify that the employee belongs to this broker's brokerage
    if (isEmployeeRole) {
      const targetBrokerId =
        targetAgent.brokerId || targetAgent.parentUserId || targetAgent.agencyId;
      if (!this.isAdmin(user)) {
        const isOwningBroker =
          targetBrokerId &&
          (targetBrokerId === user.id || userIdentifiers.includes(targetBrokerId));

        if (!isOwningBroker) {
          throw new ForbiddenException(
            'You can only assign leads to employees belonging to your own brokerage.',
          );
        }
      }
    }

    const prevAssignee = lead.assignedAgentId || lead.agentId;
    const targetId = targetAgent._id.toString();

    lead.agentId = targetId;
    lead.assignedAgentId = targetId;
    lead.assignedBy = user.id;
    lead.assignedAt = new Date();

    if (dto.note) {
      lead.notes.push({
        text: `Lead reassigned to ${targetAgent.name}: ${dto.note}`,
        authorId: user.id,
        authorName: user.name || 'Admin',
        createdAt: new Date(),
      });
    }

    lead.activities.push({
      _id: new Types.ObjectId().toString(),
      actorId: user.id,
      actorName: user.name || 'Admin',
      actorRole: user.role,
      type: ActivityType.ASSIGNMENT,
      note: `Lead assigned to ${targetAgent.name} (${targetAgent.role})${dto.note ? `: ${dto.note}` : ''}`,
      metadata: { previousAssignee: prevAssignee, newAssignee: targetId, newAssigneeName: targetAgent.name },
      createdAt: new Date(),
    });

    await lead.save();

    // Audit Log
    await this.auditLogModel.create({
      action: 'LEAD_ASSIGNED',
      actorUserId: user.id,
      actorName: user.name || 'Admin',
      actorRole: user.role,
      targetUserId: targetId,
      targetEntity: 'LEAD',
      targetEntityId: lead._id.toString(),
      previousValue: { assignedAgentId: prevAssignee },
      newValue: { assignedAgentId: targetId, assignedAgentName: targetAgent.name },
      reason: dto.note || `Assigned to agent ${targetAgent.name}`,
      timestamp: new Date(),
    });

    return {
      success: true,
      message: `Lead successfully assigned to ${targetAgent.name}.`,
      lead: {
        id: lead._id.toString(),
        assignedAgentId: lead.assignedAgentId,
        assignedAgentName: targetAgent.name,
        assignedAt: lead.assignedAt,
      },
    };
  }

  /**
   * 8. Add Internal Private Note to Lead Timeline
   */
  async addLeadNote(id: string, user: AuthenticatedUser, dto: AddLeadNoteDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid Lead ID');
    }

    const lead = await this.leadModel.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" was not found.`);
    }

    const userIdentifiers = this.getUserIdentifiers(user);
    const isAuthorized =
      (lead.agentId && userIdentifiers.includes(lead.agentId)) ||
      (lead.assignedAgentId && userIdentifiers.includes(lead.assignedAgentId)) ||
      (lead.ownerId && userIdentifiers.includes(lead.ownerId)) ||
      (lead.brokerId && userIdentifiers.includes(lead.brokerId)) ||
      this.isAdmin(user);

    if (!isAuthorized) {
      throw new ForbiddenException('You do not have permission to modify this lead.');
    }

    const noteText = (dto.text || dto.note || '').trim();
    if (!noteText) {
      throw new BadRequestException('Note text is required');
    }

    const newNote = {
      text: noteText,
      authorId: user.id,
      authorName: user.name || 'Agent',
      createdAt: new Date(),
    };

    lead.notes.push(newNote);
    lead.activities.push({
      _id: new Types.ObjectId().toString(),
      actorId: user.id,
      actorName: user.name || 'Agent',
      actorRole: user.role,
      type: ActivityType.NOTE,
      note: noteText,
      createdAt: new Date(),
    });

    lead.lastContactAt = new Date();
    await lead.save();

    await this.auditLogModel.create({
      action: 'LEAD_NOTE_ADDED',
      actorUserId: user.id,
      actorName: user.name || 'Agent',
      actorRole: user.role,
      targetEntity: 'LEAD',
      targetEntityId: lead._id.toString(),
      newValue: { note: noteText },
      reason: 'Agent added internal follow-up note to lead',
      timestamp: new Date(),
    });

    return {
      success: true,
      message: 'Note added to lead timeline.',
      note: newNote,
    };
  }

  /**
   * 9. Add CRM Activity (Call, WhatsApp, Email, Site Visit)
   */
  async addLeadActivity(id: string, user: AuthenticatedUser, dto: CreateLeadActivityDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid Lead ID');
    }

    const lead = await this.leadModel.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" was not found.`);
    }

    const userIdentifiers = this.getUserIdentifiers(user);
    const isAuthorized =
      (lead.agentId && userIdentifiers.includes(lead.agentId)) ||
      (lead.assignedAgentId && userIdentifiers.includes(lead.assignedAgentId)) ||
      (lead.ownerId && userIdentifiers.includes(lead.ownerId)) ||
      (lead.brokerId && userIdentifiers.includes(lead.brokerId)) ||
      this.isAdmin(user);

    if (!isAuthorized) {
      throw new ForbiddenException('You do not have permission to log activities on this lead.');
    }

    const activity: LeadActivity = {
      _id: new Types.ObjectId().toString(),
      actorId: user.id,
      actorName: user.name || 'Agent',
      actorRole: user.role,
      type: dto.type,
      note: dto.note.trim(),
      metadata: dto.metadata || {},
      createdAt: new Date(),
    };

    lead.activities.push(activity);
    lead.lastContactAt = new Date();
    await lead.save();

    return {
      success: true,
      message: `Activity logged: ${dto.type}.`,
      activity,
    };
  }

  /**
   * 10. Create Scheduled Follow-Up
   */
  async createFollowUp(id: string, user: AuthenticatedUser, dto: CreateLeadFollowUpDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid Lead ID');
    }

    const lead = await this.leadModel.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" was not found.`);
    }

    const userIdentifiers = this.getUserIdentifiers(user);
    const isAuthorized =
      (lead.agentId && userIdentifiers.includes(lead.agentId)) ||
      (lead.assignedAgentId && userIdentifiers.includes(lead.assignedAgentId)) ||
      (lead.ownerId && userIdentifiers.includes(lead.ownerId)) ||
      (lead.brokerId && userIdentifiers.includes(lead.brokerId)) ||
      this.isAdmin(user);

    if (!isAuthorized) {
      throw new ForbiddenException('You do not have permission to schedule follow-ups on this lead.');
    }

    const dueDate = new Date(dto.dueAt);
    if (isNaN(dueDate.getTime())) {
      throw new BadRequestException('Invalid follow-up due date format');
    }

    const followUp: LeadFollowUp = {
      _id: new Types.ObjectId().toString(),
      assignedTo: dto.assignedTo || lead.assignedAgentId || user.id,
      dueAt: dueDate,
      type: dto.type || FollowUpType.CALL,
      note: dto.note.trim(),
      status: FollowUpStatus.PENDING,
      createdBy: user.id,
      createdAt: new Date(),
    };

    lead.followUps.push(followUp);

    // Update nextFollowUpAt to earliest pending follow-up
    this.recalculateNextFollowUp(lead);

    lead.activities.push({
      _id: new Types.ObjectId().toString(),
      actorId: user.id,
      actorName: user.name || 'Agent',
      actorRole: user.role,
      type: ActivityType.FOLLOW_UP,
      note: `Scheduled ${followUp.type} follow-up for ${dueDate.toLocaleDateString()}: "${dto.note.trim()}"`,
      metadata: { followUpId: followUp._id, dueAt: dueDate, type: followUp.type },
      createdAt: new Date(),
    });

    await lead.save();

    await this.auditLogModel.create({
      action: 'LEAD_FOLLOW_UP_SET',
      actorUserId: user.id,
      actorName: user.name || 'Agent',
      actorRole: user.role,
      targetEntity: 'LEAD',
      targetEntityId: lead._id.toString(),
      newValue: { nextFollowUpAt: dueDate, type: followUp.type, note: dto.note.trim() },
      reason: dto.note || 'Scheduled follow-up reminder',
      timestamp: new Date(),
    });

    return {
      success: true,
      message: `Follow-up scheduled for ${dueDate.toLocaleDateString()}.`,
      followUp,
      nextFollowUpAt: lead.nextFollowUpAt,
    };
  }

  /**
   * Helper: Legacy setFollowUp method for Phase 09 backward compatibility
   */
  async setFollowUp(id: string, user: AuthenticatedUser, dto: SetFollowUpDto) {
    return this.createFollowUp(id, user, {
      dueAt: dto.nextFollowUpAt,
      type: FollowUpType.CALL,
      note: dto.note || 'Scheduled follow-up reminder',
    });
  }

  /**
   * 11. Complete Scheduled Follow-Up
   */
  async completeFollowUp(id: string, followUpId: string, user: AuthenticatedUser, note?: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid Lead ID');
    }

    const lead = await this.leadModel.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" was not found.`);
    }

    const userIdentifiers = this.getUserIdentifiers(user);
    const isAuthorized =
      (lead.agentId && userIdentifiers.includes(lead.agentId)) ||
      (lead.assignedAgentId && userIdentifiers.includes(lead.assignedAgentId)) ||
      (lead.ownerId && userIdentifiers.includes(lead.ownerId)) ||
      this.isAdmin(user);

    if (!isAuthorized) {
      throw new ForbiddenException('You do not have permission to modify follow-ups on this lead.');
    }

    const followUp = lead.followUps.find((f: any) => f._id === followUpId || f._id?.toString() === followUpId);
    if (!followUp) {
      throw new NotFoundException(`Follow-up with ID "${followUpId}" not found on lead.`);
    }

    followUp.status = FollowUpStatus.COMPLETED;
    followUp.completedAt = new Date();
    lead.lastContactAt = new Date();

    this.recalculateNextFollowUp(lead);

    lead.activities.push({
      _id: new Types.ObjectId().toString(),
      actorId: user.id,
      actorName: user.name || 'Agent',
      actorRole: user.role,
      type: ActivityType.FOLLOW_UP,
      note: `Completed ${followUp.type} follow-up${note ? `: ${note.trim()}` : ''}`,
      metadata: { followUpId, completedAt: followUp.completedAt },
      createdAt: new Date(),
    });

    await lead.save();

    return {
      success: true,
      message: 'Follow-up marked as completed.',
      followUp,
      nextFollowUpAt: lead.nextFollowUpAt,
    };
  }

  /**
   * 12. Cancel Scheduled Follow-Up
   */
  async cancelFollowUp(id: string, followUpId: string, user: AuthenticatedUser, note?: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid Lead ID');
    }

    const lead = await this.leadModel.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" was not found.`);
    }

    const userIdentifiers = this.getUserIdentifiers(user);
    const isAuthorized =
      (lead.agentId && userIdentifiers.includes(lead.agentId)) ||
      (lead.assignedAgentId && userIdentifiers.includes(lead.assignedAgentId)) ||
      (lead.ownerId && userIdentifiers.includes(lead.ownerId)) ||
      this.isAdmin(user);

    if (!isAuthorized) {
      throw new ForbiddenException('You do not have permission to modify follow-ups on this lead.');
    }

    const followUp = lead.followUps.find((f: any) => f._id === followUpId || f._id?.toString() === followUpId);
    if (!followUp) {
      throw new NotFoundException(`Follow-up with ID "${followUpId}" not found on lead.`);
    }

    followUp.status = FollowUpStatus.CANCELLED;
    this.recalculateNextFollowUp(lead);

    lead.activities.push({
      _id: new Types.ObjectId().toString(),
      actorId: user.id,
      actorName: user.name || 'Agent',
      actorRole: user.role,
      type: ActivityType.FOLLOW_UP,
      note: `Cancelled ${followUp.type} follow-up${note ? `: ${note.trim()}` : ''}`,
      metadata: { followUpId },
      createdAt: new Date(),
    });

    await lead.save();

    return {
      success: true,
      message: 'Follow-up cancelled.',
      followUp,
      nextFollowUpAt: lead.nextFollowUpAt,
    };
  }

  /**
   * Helper: Recalculate nextFollowUpAt from pending follow-ups
   */
  private recalculateNextFollowUp(lead: LeadDocument) {
    const pending = (lead.followUps || [])
      .filter((f) => f.status === FollowUpStatus.PENDING && f.dueAt)
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

    lead.nextFollowUpAt = pending.length > 0 ? pending[0].dueAt : undefined;
  }

  /**
   * 13. Get Agent Follow-Ups (Due Today, Upcoming, Overdue)
   */
  async getAgentFollowUps(user: AuthenticatedUser) {
    const userIdentifiers = this.getUserIdentifiers(user);

    const filter: any = {
      status: { $nin: [LeadStatus.CONVERTED, LeadStatus.LOST, LeadStatus.CANCELLED, LeadStatus.CLOSED] },
      $or: [
        { agentId: { $in: userIdentifiers } },
        { assignedAgentId: { $in: userIdentifiers } },
        { brokerId: { $in: userIdentifiers } },
        { 'followUps.assignedTo': { $in: userIdentifiers } },
      ],
      'followUps.status': FollowUpStatus.PENDING,
    };

    if (this.isAdmin(user)) {
      delete filter.$or;
    }

    const leads = await this.leadModel.find(filter).lean();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const dueToday: any[] = [];
    const upcoming: any[] = [];
    const overdue: any[] = [];

    leads.forEach((l: any) => {
      (l.followUps || []).forEach((f: any) => {
        if (f.status === FollowUpStatus.PENDING && f.dueAt) {
          const dueDate = new Date(f.dueAt);
          const item = {
            id: f._id,
            leadId: l._id.toString(),
            leadName: l.name,
            leadPhone: l.mobile,
            propertyId: l.propertyId,
            type: f.type,
            note: f.note,
            dueAt: f.dueAt,
            status: f.status,
            createdAt: f.createdAt,
          };

          if (dueDate < startOfToday) {
            overdue.push(item);
          } else if (dueDate <= endOfToday) {
            dueToday.push(item);
          } else {
            upcoming.push(item);
          }
        }
      });
    });

    return {
      dueToday: dueToday.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()),
      upcoming: upcoming.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()),
      overdue: overdue.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()),
      counts: {
        dueToday: dueToday.length,
        upcoming: upcoming.length,
        overdue: overdue.length,
        totalPending: dueToday.length + upcoming.length + overdue.length,
      },
    };
  }

  /**
   * 14. Real-time CRM Dashboard KPIs
   */
  async getKPIs(user: AuthenticatedUser) {
    const userIdentifiers = this.getUserIdentifiers(user);
    const isAdmin = this.isAdmin(user);

    const baseFilter: any = isAdmin
      ? {}
      : {
          $or: [
            { agentId: { $in: userIdentifiers } },
            { assignedAgentId: { $in: userIdentifiers } },
            { ownerId: { $in: userIdentifiers } },
            { brokerId: { $in: userIdentifiers } },
          ],
        };

    const [total, newCount, contactedCount, qualifiedCount, siteVisitCount, negotiationCount, convertedCount, lostCount, unassignedCount, followUpsPending] =
      await Promise.all([
        this.leadModel.countDocuments(baseFilter),
        this.leadModel.countDocuments({ ...baseFilter, status: LeadStatus.NEW }),
        this.leadModel.countDocuments({ ...baseFilter, status: LeadStatus.CONTACTED }),
        this.leadModel.countDocuments({ ...baseFilter, status: { $in: [LeadStatus.QUALIFIED, LeadStatus.INTERESTED] } }),
        this.leadModel.countDocuments({ ...baseFilter, status: LeadStatus.SITE_VISIT }),
        this.leadModel.countDocuments({ ...baseFilter, status: LeadStatus.NEGOTIATION }),
        this.leadModel.countDocuments({ ...baseFilter, status: LeadStatus.CONVERTED }),
        this.leadModel.countDocuments({ ...baseFilter, status: { $in: [LeadStatus.LOST, LeadStatus.CANCELLED, LeadStatus.CLOSED] } }),
        isAdmin
          ? this.leadModel.countDocuments({
              $or: [
                { assignedAgentId: { $exists: false } },
                { assignedAgentId: null },
                { assignedAgentId: '' },
                { agentId: 'usr-system' },
              ],
            })
          : 0,
        this.leadModel.countDocuments({
          ...baseFilter,
          'followUps.status': FollowUpStatus.PENDING,
        }),
      ]);

    const activeCount = newCount + contactedCount + qualifiedCount + siteVisitCount + negotiationCount;
    const conversionRate = total > 0 ? Number(((convertedCount / total) * 100).toFixed(1)) : 0;

    return {
      totalLeads: total,
      newLeads: newCount,
      activeLeads: activeCount,
      siteVisits: siteVisitCount,
      negotiations: negotiationCount,
      converted: convertedCount,
      lost: lostCount,
      unassigned: unassignedCount,
      followUpsDue: followUpsPending,
      conversionRate,
    };
  }

  /**
   * 15. Aggregated CRM Analytics (Status, Source, Priority Breakdown)
   */
  async getAnalytics(user: AuthenticatedUser) {
    const userIdentifiers = this.getUserIdentifiers(user);
    const matchStage: any = this.isAdmin(user)
      ? {}
      : {
          $or: [
            { agentId: { $in: userIdentifiers } },
            { assignedAgentId: { $in: userIdentifiers } },
            { ownerId: { $in: userIdentifiers } },
            { brokerId: { $in: userIdentifiers } },
          ],
        };

    const [statusAggr, sourceAggr, priorityAggr] = await Promise.all([
      this.leadModel.aggregate([
        { $match: matchStage },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.leadModel.aggregate([
        { $match: matchStage },
        { $group: { _id: '$source', count: { $sum: 1 } } },
      ]),
      this.leadModel.aggregate([
        { $match: matchStage },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
    ]);

    const byStatus: Record<string, number> = {};
    statusAggr.forEach((s) => {
      byStatus[s._id] = s.count;
    });

    const bySource: Record<string, number> = {};
    sourceAggr.forEach((s) => {
      bySource[s._id] = s.count;
    });

    const byPriority: Record<string, number> = {};
    priorityAggr.forEach((p) => {
      byPriority[p._id] = p.count;
    });

    return {
      byStatus,
      bySource,
      byPriority,
    };
  }
}
