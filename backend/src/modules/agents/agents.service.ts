import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AgentProfile, AgentProfileDocument } from './schemas/agent-profile.schema';
import {
  AgentVerificationDocument,
  AgentVerificationDocumentDocument,
} from './schemas/agent-document.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { Lead, LeadDocument } from '../leads/schemas/lead.schema';
import { AuditLog, AuditLogDocument } from '../admin/schemas/audit-log.schema';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(
    @InjectModel(AgentProfile.name)
    private readonly agentProfileModel: Model<AgentProfileDocument>,
    @InjectModel(AgentVerificationDocument.name)
    private readonly agentDocumentModel: Model<AgentVerificationDocumentDocument>,
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
   * Helper: Generate a URL-friendly unique slug from agent name
   */
  private generateSlug(name: string, fallbackId: string): string {
    const base = (name || 'agent')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${base}-${fallbackId.slice(-4)}`;
  }

  /**
   * Get or auto-create the AgentProfile for the current authenticated user
   */
  async getOrCreateProfile(user: AuthenticatedUser): Promise<AgentProfileDocument> {
    let profile = await this.agentProfileModel.findOne({ userId: user.id });

    if (!profile) {
      const userDoc = await this.userModel.findById(user.id);
      const name = userDoc?.name || user.name || 'CASA Agent';
      const slug = this.generateSlug(name, user.id);

      profile = await this.agentProfileModel.create({
        userId: user.id,
        slug,
        displayName: name,
        agencyName: userDoc?.agencyName || '',
        phone: userDoc?.mobile || user.mobile,
        email: userDoc?.email || user.email,
        isVerifiedAgent: Boolean(userDoc?.isVerifiedAgent),
        verificationStatus: userDoc?.isVerifiedAgent ? 'VERIFIED' : 'NOT_SUBMITTED',
        reraNumber: userDoc?.reraNumber || '',
        areasServed: ['Lucknow'],
        specializations: ['Residential Properties'],
        languages: ['English', 'Hindi'],
      });
      this.logger.log(`Initialized AgentProfile for user ${user.id} (${slug})`);
    }

    return profile;
  }

  /**
   * Agent Dashboard Metrics (Real MongoDB Aggregation)
   */
  async getDashboardMetrics(user: AuthenticatedUser) {
    const profile = await this.getOrCreateProfile(user);

    const userIdentifiers = [user.id, user.mobile, user.normalizedMobile].filter(Boolean);

    // Aggregate Property Counts by status for this agent/owner
    const propertyCounts = await this.propertyModel.aggregate([
      {
        $match: {
          $or: [
            { ownerId: { $in: userIdentifiers } },
            { advertiserId: { $in: userIdentifiers } },
            { createdBy: user.id },
          ],
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const propertySummary = {
      total: 0,
      draft: 0,
      pending: 0,
      published: 0,
      rejected: 0,
      archived: 0,
    };

    propertyCounts.forEach((group: { _id: string; count: number }) => {
      propertySummary.total += group.count;
      if (group._id === 'DRAFT') propertySummary.draft += group.count;
      else if (group._id === 'PENDING_REVIEW' || group._id === 'PENDING_APPROVAL')
        propertySummary.pending += group.count;
      else if (group._id === 'PUBLISHED') propertySummary.published += group.count;
      else if (group._id === 'REJECTED') propertySummary.rejected += group.count;
      else if (group._id === 'ARCHIVED' || group._id === 'UNPUBLISHED')
        propertySummary.archived += group.count;
    });

    // Aggregate Leads Counts for this agent
    const [totalLeads, newLeads, followUpsDue, recentLeads, recentProperties] = await Promise.all([
      this.leadModel.countDocuments({
        $or: [{ agentId: user.id }, { ownerId: user.id }],
      }),
      this.leadModel.countDocuments({
        $or: [{ agentId: user.id }, { ownerId: user.id }],
        status: 'NEW',
      }),
      this.leadModel.countDocuments({
        $or: [{ agentId: user.id }, { ownerId: user.id }],
        nextFollowUpAt: { $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
        status: { $nin: ['CONVERTED', 'LOST', 'CLOSED'] },
      }),
      this.leadModel
        .find({
          $or: [{ agentId: user.id }, { ownerId: user.id }],
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      this.propertyModel
        .find({
          $or: [
            { ownerId: { $in: userIdentifiers } },
            { advertiserId: { $in: userIdentifiers } },
            { createdBy: user.id },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const userDoc = await this.userModel.findById(user.id).lean();

    const counts = {
      totalListings: propertySummary.total,
      publishedListings: propertySummary.published,
      pendingReviewListings: propertySummary.pending,
      draftListings: propertySummary.draft,
      rejectedListings: propertySummary.rejected,
      archivedListings: propertySummary.archived,
      totalLeads,
      newLeads,
      followUpsDue,
    };

    const analytics = {
      propertyViews: 0,
      whatsappClicks: 0,
      callClicks: 0,
      enquirySubmissions: totalLeads,
    };

    const agent = {
      userId: user.id,
      name: userDoc?.name || user.name || profile.displayName || 'Agent',
      mobile: userDoc?.mobile || user.mobile,
      email: userDoc?.email || user.email,
      role: userDoc?.role || user.role,
      isVerifiedAgent: profile.isVerifiedAgent ?? Boolean(userDoc?.isVerifiedAgent),
      verificationStatus: profile.verificationStatus || (userDoc?.isVerifiedAgent ? 'VERIFIED' : 'NOT_SUBMITTED'),
    };

    const formattedListings = recentProperties.map((p: any) => ({
      id: p.id || p._id?.toString(),
      _id: p._id?.toString() || p.id,
      slug: p.slug,
      title: typeof p.title === 'string' ? { en: p.title } : p.title || { en: 'Listing' },
      category: p.category,
      listingType: p.listingType,
      price: typeof p.price === 'number' ? { amount: p.price, currency: 'INR' } : p.price || { amount: 0, currency: 'INR' },
      location: p.location || {},
      status: p.status,
      isPublished: p.isPublished,
      createdAt: p.createdAt,
    }));

    const formattedLeads = recentLeads.map((l: any) => ({
      id: l._id?.toString() || l.id,
      _id: l._id?.toString() || l.id,
      name: l.name,
      mobile: l.mobile,
      message: l.message,
      propertyId: l.propertyId,
      propertyTitle: l.propertyTitle,
      status: l.status,
      priority: l.priority,
      createdAt: l.createdAt,
    }));

    return {
      agent,
      profile: {
        id: profile._id.toString(),
        slug: profile.slug,
        displayName: profile.displayName,
        agencyName: profile.agencyName,
        isVerifiedAgent: profile.isVerifiedAgent,
        verificationStatus: profile.verificationStatus,
        reraNumber: profile.reraNumber,
        profileImage: profile.profileImage,
      },
      counts,
      analytics,
      recentListings: formattedListings,
      recentProperties: formattedListings,
      recentLeads: formattedLeads,
      recentActivity: [],
      propertySummary,
      leadSummary: {
        totalLeads,
        newLeads,
        followUpsDue,
      },
    };
  }

  /**
   * Fetch current agent's business profile
   */
  async getMyProfile(user: AuthenticatedUser) {
    const profile = await this.getOrCreateProfile(user);
    return profile;
  }

  /**
   * Update current agent's business profile
   */
  async updateMyProfile(user: AuthenticatedUser, dto: UpdateAgentProfileDto) {
    const profile = await this.getOrCreateProfile(user);

    const prev = profile.toObject();

    if (dto.displayName !== undefined) profile.displayName = dto.displayName;
    if (dto.agencyName !== undefined) profile.agencyName = dto.agencyName;
    if (dto.agencyLogo !== undefined) profile.agencyLogo = dto.agencyLogo;
    if (dto.profileImage !== undefined) profile.profileImage = dto.profileImage;
    if (dto.professionalTitle !== undefined) profile.professionalTitle = dto.professionalTitle;
    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.experienceYears !== undefined) profile.experienceYears = dto.experienceYears;
    if (dto.phone !== undefined) profile.phone = dto.phone;
    if (dto.email !== undefined) profile.email = dto.email;
    if (dto.website !== undefined) profile.website = dto.website;
    if (dto.socialLinks !== undefined) profile.socialLinks = dto.socialLinks;
    if (dto.officeAddress !== undefined) profile.officeAddress = dto.officeAddress;
    if (dto.state !== undefined) profile.state = dto.state;
    if (dto.district !== undefined) profile.district = dto.district;
    if (dto.city !== undefined) profile.city = dto.city;
    if (dto.locality !== undefined) profile.locality = dto.locality;
    if (dto.pincode !== undefined) profile.pincode = dto.pincode;
    if (dto.areasServed !== undefined) profile.areasServed = dto.areasServed;
    if (dto.specializations !== undefined) profile.specializations = dto.specializations;
    if (dto.languages !== undefined) profile.languages = dto.languages;
    if (dto.reraNumber !== undefined) profile.reraNumber = dto.reraNumber;
    if (dto.reraState !== undefined) profile.reraState = dto.reraState;
    if (dto.reraAuthority !== undefined) profile.reraAuthority = dto.reraAuthority;

    await profile.save();

    // Sync back to User schema if appropriate
    const userUpdate: any = {
      agencyName: profile.agencyName,
      reraNumber: profile.reraNumber,
      avatar: profile.profileImage,
    };
    if (dto.displayName) {
      userUpdate.name = dto.displayName;
    }
    await this.userModel.findByIdAndUpdate(user.id, {
      $set: userUpdate,
    });

    // Record Audit Log
    await this.auditLogModel.create({
      action: 'AGENT_PROFILE_UPDATED',
      actorUserId: user.id,
      actorName: user.name || profile.displayName,
      actorRole: user.role,
      targetUserId: user.id,
      targetUserName: profile.displayName,
      targetEntity: 'AGENT_PROFILE',
      targetEntityId: profile._id.toString(),
      previousValue: { agencyName: prev.agencyName, reraNumber: prev.reraNumber },
      newValue: { agencyName: profile.agencyName, reraNumber: profile.reraNumber },
      reason: 'Agent updated business profile details',
      timestamp: new Date(),
    });

    return {
      success: true,
      message: 'Agent business profile updated successfully',
      profile,
    };
  }

  /**
   * Fetch current agent's verification status and documents
   */
  async getMyVerification(user: AuthenticatedUser) {
    const profile = await this.getOrCreateProfile(user);
    const documents = await this.agentDocumentModel
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .lean();

    return {
      verificationStatus: profile.verificationStatus,
      isVerifiedAgent: profile.isVerifiedAgent,
      verifiedAt: profile.verifiedAt,
      reraNumber: profile.reraNumber,
      reraState: profile.reraState,
      reraAuthority: profile.reraAuthority,
      agencyName: profile.agencyName,
      verificationNotes: profile.verificationNotes,
      rejectionReasons: profile.rejectionReasons,
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
    };
  }

  /**
   * Submit RERA Verification Application
   */
  async submitVerification(user: AuthenticatedUser, dto: SubmitVerificationDto) {
    const profile = await this.getOrCreateProfile(user);

    if (profile.verificationStatus === 'VERIFIED') {
      throw new BadRequestException('Agent is already CASA Verified.');
    }

    if (profile.verificationStatus === 'PENDING') {
      throw new BadRequestException('Verification application is already pending administrator review.');
    }

    profile.reraNumber = dto.reraNumber;
    if (dto.reraState) profile.reraState = dto.reraState;
    if (dto.reraAuthority) profile.reraAuthority = dto.reraAuthority;
    if (dto.agencyName) profile.agencyName = dto.agencyName;
    profile.verificationStatus = 'PENDING';
    profile.verificationNotes = dto.notes;
    profile.rejectionReasons = [];

    await profile.save();

    await this.userModel.findByIdAndUpdate(user.id, {
      $set: {
        reraNumber: dto.reraNumber,
        agencyName: dto.agencyName || profile.agencyName,
      },
    });

    // Record Audit Log
    await this.auditLogModel.create({
      action: 'AGENT_VERIFICATION_SUBMITTED',
      actorUserId: user.id,
      actorName: user.name || profile.displayName,
      actorRole: user.role,
      targetUserId: user.id,
      targetUserName: profile.displayName,
      targetEntity: 'AGENT_VERIFICATION',
      targetEntityId: profile._id.toString(),
      previousValue: { status: 'NOT_SUBMITTED' },
      newValue: { status: 'PENDING', reraNumber: dto.reraNumber },
      reason: dto.notes || 'Agent submitted RERA verification application',
      timestamp: new Date(),
    });

    return {
      success: true,
      message: 'RERA verification application submitted successfully. CASA administrators will review your credentials.',
      verificationStatus: 'PENDING',
    };
  }

  /**
   * Upload / Attach a verification document
   */
  async uploadDocument(user: AuthenticatedUser, dto: UploadDocumentDto) {
    const profile = await this.getOrCreateProfile(user);

    const doc = await this.agentDocumentModel.create({
      agentId: profile._id.toString(),
      userId: user.id,
      documentType: dto.documentType,
      documentUrl: dto.documentUrl,
      documentName: dto.documentName,
      mimeType: dto.mimeType || 'application/pdf',
      fileSize: dto.fileSize || 500000,
      documentNumber: dto.documentNumber,
      status: 'PENDING',
      uploadedAt: new Date(),
    });

    await this.auditLogModel.create({
      action: 'AGENT_DOCUMENT_UPLOADED',
      actorUserId: user.id,
      actorName: user.name || profile.displayName,
      actorRole: user.role,
      targetUserId: user.id,
      targetUserName: profile.displayName,
      targetEntity: 'AGENT_DOCUMENT',
      targetEntityId: doc._id.toString(),
      newValue: { documentType: dto.documentType, documentName: dto.documentName },
      reason: 'Agent uploaded credential document',
      timestamp: new Date(),
    });

    return {
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: doc._id.toString(),
        documentType: doc.documentType,
        documentUrl: doc.documentUrl,
        documentName: doc.documentName,
        status: doc.status,
        uploadedAt: doc.uploadedAt,
      },
    };
  }

  /**
   * Public Agent Profile Query (SEO / Client Landing Page)
   */
  async getPublicAgentProfile(slug: string) {
    const profile = await this.agentProfileModel.findOne({ slug }).lean();

    if (!profile) {
      throw new NotFoundException(`Agent profile for "${slug}" was not found.`);
    }

    const userDoc = await this.userModel.findById(profile.userId).lean();
    if (!userDoc || userDoc.status === 'SUSPENDED' || userDoc.status === 'DEACTIVATED') {
      throw new NotFoundException(`Agent profile for "${slug}" is not available.`);
    }

    const userIdentifiers = [profile.userId, profile.phone, userDoc.normalizedMobile].filter(Boolean);

    // Fetch ONLY published listings
    const properties = await this.propertyModel
      .find({
        $or: [
          { ownerId: { $in: userIdentifiers } },
          { advertiserId: { $in: userIdentifiers } },
          { createdBy: profile.userId },
        ],
        isPublished: true,
        status: 'PUBLISHED',
      })
      .select({
        moderation: 0,
        adminRemark: 0,
        rejectionReason: 0,
        moderationRemarks: 0,
      })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    return {
      agent: {
        slug: profile.slug,
        displayName: profile.displayName,
        agencyName: profile.agencyName,
        agencyLogo: profile.agencyLogo,
        profileImage: profile.profileImage,
        professionalTitle: profile.professionalTitle,
        bio: profile.bio,
        experienceYears: profile.experienceYears,
        phone: profile.phone,
        email: profile.email,
        website: profile.website,
        socialLinks: profile.socialLinks,
        officeAddress: profile.officeAddress,
        city: profile.city,
        state: profile.state,
        areasServed: profile.areasServed,
        specializations: profile.specializations,
        languages: profile.languages,
        isVerifiedAgent: profile.isVerifiedAgent,
        reraNumber: profile.isVerifiedAgent ? profile.reraNumber : undefined,
        reraAuthority: profile.isVerifiedAgent ? profile.reraAuthority : undefined,
        totalActiveListings: properties.length,
      },
      listings: properties.map((p: any) => ({
        id: p.id || p._id.toString(),
        slug: p.slug,
        title: typeof p.title === 'string' ? p.title : p.title?.en,
        category: p.category,
        listingType: p.listingType,
        price: typeof p.price === 'number' ? p.price : p.price?.amount,
        location: typeof p.location === 'string' ? p.location : p.location?.locality + ', ' + p.location?.city,
        specs: p.specs,
        media: p.media,
        isFeatured: p.isFeatured,
        createdAt: p.createdAt,
      })),
    };
  }
}
