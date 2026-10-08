import { Injectable, Logger, OnModuleInit, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { Package, PackageDocument, BillingPeriod } from './schemas/package.schema';
import { PropertyView, PropertyViewDocument } from './schemas/property-view.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Subscription, SubscriptionDocument } from '../payments/schemas/subscription.schema';
import { AuditLog, AuditLogDocument } from '../admin/schemas/audit-log.schema';
import { PlatformRole, AccountType, UserRole } from '../auth/enums/auth.enums';
import { Permission, DataScope, PERMISSION_GROUPS } from './enums/permissions.enum';
import { CreateRoleDto, UpdateRoleDto } from './dto/create-role.dto';
import { CreatePackageDto, UpdatePackageDto } from './dto/create-package.dto';
import { UpdateUserOverridesDto, AddBonusCreditsDto } from './dto/update-user-overrides.dto';

@Injectable()
export class EntitlementsService implements OnModuleInit {
  private readonly logger = new Logger(EntitlementsService.name);

  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Package.name) private packageModel: Model<PackageDocument>,
    @InjectModel(PropertyView.name) private propertyViewModel: Model<PropertyViewDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async onModuleInit() {
    await this.seedSystemRolesAndPackages();
  }

  // ==========================================
  // 1. SEEDING SYSTEM ROLES & DEFAULT PACKAGES
  // ==========================================

  async seedSystemRolesAndPackages() {
    try {
      this.logger.log('Initializing System Roles and Authoritative Entitlement Packages...');

      // Default packages
      const defaultPackages = [
        {
          name: 'Free Buyer Plan',
          slug: 'free-buyer',
          description: 'Basic marketplace browsing with 10 property contact views per month.',
          targetAccountTypes: [AccountType.BUYER, AccountType.TENANT],
          price: 0,
          currency: 'INR',
          billingPeriod: BillingPeriod.FREE,
          isActive: true,
          isDefault: true,
          features: ['10 Property Contact Views / month', '5 Saved Properties', '2 Saved Searches', '5 Enquiries / month', 'Direct Messaging'],
          limits: {
            propertyViews: 10,
            propertyListings: 0,
            savedProperties: 5,
            savedSearches: 2,
            monthlyLeads: 0,
            enquiries: 5,
            chats: 10,
            teamMembers: 1,
          },
          permissions: [Permission.PROPERTY_CONTACT_VIEW, Permission.ENQUIRY_CREATE, Permission.CHAT_START],
        },
        {
          name: 'Buyer Pro Plan',
          slug: 'buyer-pro',
          description: 'Enhanced discovery with 100 property views, unlimited saved properties, and advanced recommendations.',
          targetAccountTypes: [AccountType.BUYER, AccountType.TENANT],
          price: 499,
          currency: 'INR',
          billingPeriod: BillingPeriod.MONTHLY,
          isActive: true,
          isDefault: false,
          features: ['100 Property Contact Views / month', 'Unlimited Saved Properties', '20 Saved Searches', 'Unlimited Enquiries', 'Advanced Market Recommendations', 'Priority Support'],
          limits: {
            propertyViews: 100,
            propertyListings: 0,
            savedProperties: -1,
            savedSearches: 20,
            monthlyLeads: 0,
            enquiries: -1,
            chats: -1,
            teamMembers: 1,
          },
          permissions: [Permission.PROPERTY_CONTACT_VIEW, Permission.ANALYTICS_ADVANCED, Permission.ENQUIRY_CREATE, Permission.CHAT_START],
        },
        {
          name: 'Free Seller Plan',
          slug: 'free-seller',
          description: 'Sell or rent your property directly with 2 free active listings.',
          targetAccountTypes: [AccountType.PROPERTY_OWNER],
          price: 0,
          currency: 'INR',
          billingPeriod: BillingPeriod.FREE,
          isActive: true,
          isDefault: true,
          features: ['2 Active Listings', '20 Direct Buyer Leads', '20 Inquiries / month', 'Direct Chat with Buyers', 'Standard Listing Visibility'],
          limits: {
            propertyViews: -1,
            propertyListings: 2,
            savedProperties: 10,
            savedSearches: 5,
            monthlyLeads: 20,
            enquiries: 20,
            chats: 50,
            teamMembers: 1,
          },
          permissions: [Permission.PROPERTY_CREATE, Permission.PROPERTY_EDIT, Permission.PROPERTY_PUBLISH, Permission.PROPERTY_CONTACT_VIEW, Permission.LEAD_VIEW, Permission.CHAT_START],
        },
        {
          name: 'Agent Basic Plan',
          slug: 'agent-basic',
          description: 'Essential toolkit for certified real estate agents and independent brokers.',
          targetAccountTypes: [AccountType.AGENT, AccountType.BROKER],
          price: 999,
          currency: 'INR',
          billingPeriod: BillingPeriod.MONTHLY,
          isActive: true,
          isDefault: true,
          features: ['10 Active Listings', '50 Verified Buyer Leads / month', 'Unlimited Property Views', 'Basic CRM Pipeline', 'Agent Profile Badge'],
          limits: {
            propertyViews: -1,
            propertyListings: 10,
            savedProperties: -1,
            savedSearches: -1,
            monthlyLeads: 50,
            enquiries: -1,
            chats: -1,
            teamMembers: 1,
          },
          permissions: [Permission.PROPERTY_CREATE, Permission.PROPERTY_EDIT, Permission.PROPERTY_PUBLISH, Permission.PROPERTY_CONTACT_VIEW, Permission.LEAD_VIEW, Permission.LEAD_EDIT, Permission.CRM_VIEW, Permission.CRM_CREATE, Permission.CHAT_START, Permission.ANALYTICS_VIEW],
        },
        {
          name: 'Agent Pro Plan',
          slug: 'agent-pro',
          description: 'High-volume deal pipeline for top-producing agents and brokerage teams.',
          targetAccountTypes: [AccountType.AGENT, AccountType.BROKER],
          price: 2499,
          currency: 'INR',
          billingPeriod: BillingPeriod.MONTHLY,
          isActive: true,
          isDefault: false,
          features: ['50 Active Listings', '500 Buyer Leads / month', 'Unlimited Property Views', 'Advanced CRM & Exports', 'Featured Search Slots', 'Advanced Analytics'],
          limits: {
            propertyViews: -1,
            propertyListings: 50,
            savedProperties: -1,
            savedSearches: -1,
            monthlyLeads: 500,
            enquiries: -1,
            chats: -1,
            teamMembers: 5,
          },
          permissions: [Permission.PROPERTY_CREATE, Permission.PROPERTY_EDIT, Permission.PROPERTY_PUBLISH, Permission.PROPERTY_FEATURE, Permission.PROPERTY_CONTACT_VIEW, Permission.LEAD_VIEW, Permission.LEAD_EDIT, Permission.LEAD_EXPORT, Permission.CRM_VIEW, Permission.CRM_CREATE, Permission.CRM_EDIT, Permission.CRM_EXPORT, Permission.ANALYTICS_ADVANCED, Permission.PROMOTION_CREATE, Permission.CHAT_START],
        },
        {
          name: 'Developer Enterprise',
          slug: 'developer-basic',
          description: 'Project-level inventory showcase and high-velocity developer CRM.',
          targetAccountTypes: [AccountType.DEVELOPER],
          price: 4999,
          currency: 'INR',
          billingPeriod: BillingPeriod.MONTHLY,
          isActive: true,
          isDefault: true,
          features: ['25 Project / Unit Listings', '200 Investor & Homebuyer Leads / month', 'Unlimited Property Views', 'Organization CRM', 'Advanced Intelligence BI', 'Dedicated Account Manager'],
          limits: {
            propertyViews: -1,
            propertyListings: 25,
            savedProperties: -1,
            savedSearches: -1,
            monthlyLeads: 200,
            enquiries: -1,
            chats: -1,
            teamMembers: 10,
          },
          permissions: [Permission.PROPERTY_CREATE, Permission.PROPERTY_EDIT, Permission.PROPERTY_PUBLISH, Permission.PROPERTY_FEATURE, Permission.PROPERTY_CONTACT_VIEW, Permission.LEAD_VIEW, Permission.LEAD_EDIT, Permission.LEAD_EXPORT, Permission.CRM_VIEW, Permission.CRM_CREATE, Permission.CRM_EDIT, Permission.ANALYTICS_ADVANCED, Permission.PROMOTION_CREATE, Permission.CHAT_START],
        },
      ];

      for (const pkg of defaultPackages) {
        await this.packageModel.findOneAndUpdate(
          { slug: pkg.slug },
          { $setOnInsert: pkg },
          { upsert: true, new: true },
        );
      }

      // System Roles
      const systemRoles = [
        {
          name: 'Super Administrator',
          slug: 'super-admin',
          description: 'Full, unrestricted platform access across all modules, configuration, and security controls.',
          platformRole: PlatformRole.SUPER_ADMIN,
          accountType: null,
          isSystemRole: true,
          isActive: true,
          dataScope: DataScope.ALL,
          permissions: ['*'],
          dashboardConfig: {
            overview: true, properties: true, leads: true, enquiries: true, chat: true,
            crm: true, siteVisits: true, analytics: true, reviews: true, promotions: true, profile: true,
          },
        },
        {
          name: 'Administrator',
          slug: 'admin',
          description: 'Administrative officer managing marketplace operations, users, verification, and payments.',
          platformRole: PlatformRole.ADMIN,
          accountType: null,
          isSystemRole: true,
          isActive: true,
          dataScope: DataScope.ALL,
          permissions: [
            Permission.PROPERTY_VIEW, Permission.PROPERTY_CREATE, Permission.PROPERTY_EDIT, Permission.PROPERTY_DELETE,
            Permission.PROPERTY_PUBLISH, Permission.PROPERTY_UNPUBLISH, Permission.PROPERTY_APPROVE, Permission.PROPERTY_REJECT,
            Permission.PROPERTY_FEATURE, Permission.PROPERTY_CONTACT_VIEW, Permission.LEAD_VIEW, Permission.LEAD_CREATE,
            Permission.LEAD_EDIT, Permission.LEAD_ASSIGN, Permission.LEAD_EXPORT, Permission.ENQUIRY_VIEW, Permission.ENQUIRY_MANAGE,
            Permission.USER_VIEW, Permission.USER_CREATE, Permission.USER_EDIT, Permission.USER_SUSPEND, Permission.USER_ASSIGN_ROLE,
            Permission.ROLE_VIEW, Permission.ROLE_ASSIGN, Permission.ANALYTICS_VIEW, Permission.ANALYTICS_ADVANCED, Permission.ANALYTICS_EXPORT,
            Permission.REVIEW_VIEW, Permission.REVIEW_MODERATE, Permission.REPORT_VIEW, Permission.REPORT_MANAGE,
            Permission.PAYMENT_VIEW, Permission.PAYMENT_MANAGE, Permission.SUBSCRIPTION_VIEW, Permission.SUBSCRIPTION_MANAGE,
            Permission.SETTINGS_VIEW, Permission.AUDIT_VIEW,
          ],
          dashboardConfig: {
            overview: true, properties: true, leads: true, enquiries: true, chat: true,
            crm: true, siteVisits: true, analytics: true, reviews: true, promotions: true, profile: true,
          },
        },
        {
          name: 'Moderator',
          slug: 'moderator',
          description: 'Content and listing moderation officer for review queues and abuse reports.',
          platformRole: PlatformRole.MODERATOR,
          accountType: null,
          isSystemRole: true,
          isActive: true,
          dataScope: DataScope.ALL,
          permissions: [
            Permission.PROPERTY_VIEW, Permission.PROPERTY_APPROVE, Permission.PROPERTY_REJECT,
            Permission.PROPERTY_CONTACT_VIEW, Permission.REVIEW_VIEW, Permission.REVIEW_MODERATE,
            Permission.REPORT_VIEW, Permission.REPORT_MANAGE, Permission.USER_VIEW,
          ],
          dashboardConfig: {
            overview: true, properties: true, leads: false, enquiries: false, chat: false,
            crm: false, siteVisits: false, analytics: true, reviews: true, promotions: false, profile: true,
          },
        },
        {
          name: 'Real Estate Developer',
          slug: 'developer',
          description: 'Project inventory management, bulk lead handling, and direct homebuyer inquiries.',
          platformRole: PlatformRole.USER,
          accountType: AccountType.DEVELOPER,
          isSystemRole: true,
          isActive: true,
          dataScope: DataScope.OWN,
          permissions: [
            Permission.PROPERTY_VIEW, Permission.PROPERTY_CREATE, Permission.PROPERTY_EDIT, Permission.PROPERTY_DELETE,
            Permission.PROPERTY_PUBLISH, Permission.PROPERTY_CONTACT_VIEW, Permission.LEAD_VIEW, Permission.LEAD_CREATE,
            Permission.LEAD_EDIT, Permission.ENQUIRY_VIEW, Permission.ENQUIRY_MANAGE, Permission.CHAT_VIEW, Permission.CHAT_START,
            Permission.CHAT_REPLY, Permission.CRM_VIEW, Permission.CRM_CREATE, Permission.CRM_EDIT, Permission.ANALYTICS_VIEW,
            Permission.ANALYTICS_ADVANCED, Permission.SITE_VISIT_VIEW, Permission.SITE_VISIT_MANAGE, Permission.PROMOTION_CREATE,
            Permission.PAYMENT_CREATE,
          ],
          dashboardConfig: {
            overview: true, properties: true, leads: true, enquiries: true, chat: true,
            crm: true, siteVisits: true, analytics: true, reviews: true, promotions: true, profile: true,
          },
        },
        {
          name: 'Licensed Real Estate Agent',
          slug: 'agent',
          description: 'Certified real estate agent managing listings, buyer pipelines, CRM, and inquiries.',
          platformRole: PlatformRole.USER,
          accountType: AccountType.AGENT,
          isSystemRole: true,
          isActive: true,
          dataScope: DataScope.OWN,
          permissions: [
            Permission.PROPERTY_VIEW, Permission.PROPERTY_CREATE, Permission.PROPERTY_EDIT, Permission.PROPERTY_DELETE,
            Permission.PROPERTY_PUBLISH, Permission.PROPERTY_CONTACT_VIEW, Permission.LEAD_VIEW, Permission.LEAD_CREATE,
            Permission.LEAD_EDIT, Permission.LEAD_ASSIGN, Permission.ENQUIRY_VIEW, Permission.ENQUIRY_MANAGE,
            Permission.CHAT_VIEW, Permission.CHAT_START, Permission.CHAT_REPLY, Permission.CRM_VIEW, Permission.CRM_CREATE,
            Permission.CRM_EDIT, Permission.SITE_VISIT_VIEW, Permission.SITE_VISIT_MANAGE, Permission.REVIEW_VIEW,
            Permission.REVIEW_MANAGE, Permission.PROMOTION_CREATE, Permission.ANALYTICS_VIEW, Permission.PAYMENT_CREATE,
          ],
          dashboardConfig: {
            overview: true, properties: true, leads: true, enquiries: true, chat: true,
            crm: true, siteVisits: true, analytics: true, reviews: true, promotions: true, profile: true,
          },
        },
        {
          name: 'Property Broker',
          slug: 'broker',
          description: 'Commercial and residential property broker handling scoped deals and leads.',
          platformRole: PlatformRole.USER,
          accountType: AccountType.BROKER,
          isSystemRole: true,
          isActive: true,
          dataScope: DataScope.OWN,
          permissions: [
            Permission.PROPERTY_VIEW, Permission.PROPERTY_CREATE, Permission.PROPERTY_EDIT, Permission.PROPERTY_DELETE,
            Permission.PROPERTY_PUBLISH, Permission.PROPERTY_CONTACT_VIEW, Permission.LEAD_VIEW, Permission.LEAD_CREATE,
            Permission.LEAD_EDIT, Permission.LEAD_ASSIGN, Permission.ENQUIRY_VIEW, Permission.ENQUIRY_MANAGE,
            Permission.CHAT_VIEW, Permission.CHAT_START, Permission.CHAT_REPLY, Permission.CRM_VIEW, Permission.CRM_CREATE,
            Permission.CRM_EDIT, Permission.SITE_VISIT_VIEW, Permission.SITE_VISIT_MANAGE, Permission.REVIEW_VIEW,
            Permission.REVIEW_MANAGE, Permission.PROMOTION_CREATE, Permission.ANALYTICS_VIEW, Permission.PAYMENT_CREATE,
          ],
          dashboardConfig: {
            overview: true, properties: true, leads: true, enquiries: true, chat: true,
            crm: true, siteVisits: true, analytics: true, reviews: true, promotions: true, profile: true,
          },
        },
        {
          name: 'Property Owner / Seller',
          slug: 'property-owner',
          description: 'Individual property owners posting properties for sale or rent.',
          platformRole: PlatformRole.USER,
          accountType: AccountType.PROPERTY_OWNER,
          isSystemRole: true,
          isActive: true,
          dataScope: DataScope.OWN,
          permissions: [
            Permission.PROPERTY_VIEW, Permission.PROPERTY_CREATE, Permission.PROPERTY_EDIT, Permission.PROPERTY_DELETE,
            Permission.PROPERTY_PUBLISH, Permission.PROPERTY_CONTACT_VIEW, Permission.LEAD_VIEW, Permission.ENQUIRY_VIEW,
            Permission.ENQUIRY_MANAGE, Permission.CHAT_VIEW, Permission.CHAT_START, Permission.CHAT_REPLY,
            Permission.SITE_VISIT_VIEW, Permission.SITE_VISIT_MANAGE, Permission.REVIEW_VIEW, Permission.PAYMENT_CREATE,
          ],
          dashboardConfig: {
            overview: true, properties: true, leads: true, enquiries: true, chat: true,
            crm: false, siteVisits: true, analytics: true, reviews: true, promotions: false, profile: true,
          },
        },
        {
          name: 'Property Buyer',
          slug: 'buyer',
          description: 'Marketplace homebuyer searching properties, scheduling visits, and submitting enquiries.',
          platformRole: PlatformRole.USER,
          accountType: AccountType.BUYER,
          isSystemRole: true,
          isActive: true,
          dataScope: DataScope.OWN,
          permissions: [
            Permission.PROPERTY_VIEW, Permission.PROPERTY_CONTACT_VIEW, Permission.ENQUIRY_CREATE, Permission.ENQUIRY_VIEW,
            Permission.CHAT_VIEW, Permission.CHAT_START, Permission.CHAT_REPLY, Permission.SITE_VISIT_CREATE,
            Permission.SITE_VISIT_VIEW, Permission.SITE_VISIT_CANCEL, Permission.REVIEW_CREATE, Permission.REVIEW_VIEW,
            Permission.REPORT_CREATE, Permission.PAYMENT_CREATE,
          ],
          dashboardConfig: {
            overview: true, properties: false, leads: false, enquiries: true, chat: true,
            crm: false, siteVisits: true, analytics: false, reviews: true, promotions: false, profile: true,
          },
        },
        {
          name: 'Rental Tenant',
          slug: 'tenant',
          description: 'Rental searcher finding apartments, booking tours, and chatting with landlords.',
          platformRole: PlatformRole.USER,
          accountType: AccountType.TENANT,
          isSystemRole: true,
          isActive: true,
          dataScope: DataScope.OWN,
          permissions: [
            Permission.PROPERTY_VIEW, Permission.PROPERTY_CONTACT_VIEW, Permission.ENQUIRY_CREATE, Permission.ENQUIRY_VIEW,
            Permission.CHAT_VIEW, Permission.CHAT_START, Permission.CHAT_REPLY, Permission.SITE_VISIT_CREATE,
            Permission.SITE_VISIT_VIEW, Permission.SITE_VISIT_CANCEL, Permission.REVIEW_CREATE, Permission.REVIEW_VIEW,
            Permission.REPORT_CREATE, Permission.PAYMENT_CREATE,
          ],
          dashboardConfig: {
            overview: true, properties: false, leads: false, enquiries: true, chat: true,
            crm: false, siteVisits: true, analytics: false, reviews: true, promotions: false, profile: true,
          },
        },
      ];

      for (const r of systemRoles) {
        await this.roleModel.findOneAndUpdate(
          { slug: r.slug },
          { $setOnInsert: r },
          { upsert: true, new: true },
        );
      }

      this.logger.log('System roles and default packages verified successfully.');
    } catch (err) {
      this.logger.error(`Failed to seed system roles: ${err.message}`, err.stack);
    }
  }

  // ==========================================
  // 2. ROLE CRUD & MANAGEMENT
  // ==========================================

  async getAllRoles(): Promise<any[]> {
    const roles = await this.roleModel.find().sort({ isSystemRole: -1, name: 1 }).lean().exec();
    
    // Count users in each role
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        let userCount = 0;
        if (role.isSystemRole) {
          if (role.platformRole === PlatformRole.SUPER_ADMIN || role.platformRole === PlatformRole.ADMIN || role.platformRole === PlatformRole.MODERATOR) {
            userCount = await this.userModel.countDocuments({ platformRole: role.platformRole });
          } else if (role.accountType) {
            userCount = await this.userModel.countDocuments({ accountType: role.accountType, customRoleId: { $in: [null, undefined] } });
          }
        } else {
          userCount = await this.userModel.countDocuments({ customRoleId: role._id.toString() });
        }
        return {
          ...role,
          id: role._id.toString(),
          userCount,
        };
      }),
    );

    return rolesWithCounts;
  }

  async getRoleById(id: string): Promise<any> {
    let query: any = { slug: id };
    if (isValidObjectId(id)) {
      query = { $or: [{ _id: id }, { slug: id }] };
    }
    const role = await this.roleModel.findOne(query).lean().exec();
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" was not found.`);
    }

    let userCount = 0;
    if (role.isSystemRole) {
      if (role.platformRole === PlatformRole.SUPER_ADMIN || role.platformRole === PlatformRole.ADMIN || role.platformRole === PlatformRole.MODERATOR) {
        userCount = await this.userModel.countDocuments({ platformRole: role.platformRole });
      } else if (role.accountType) {
        userCount = await this.userModel.countDocuments({ accountType: role.accountType });
      }
    } else {
      userCount = await this.userModel.countDocuments({ customRoleId: role._id.toString() });
    }

    return { ...role, id: role._id.toString(), userCount };
  }

  async createRole(dto: CreateRoleDto, actorUser: any) {
    if (dto.platformRole === PlatformRole.SUPER_ADMIN && actorUser.platformRole !== PlatformRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admins can manage Super Admin roles.');
    }

    const slug = dto.slug ? dto.slug.toLowerCase().trim() : dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await this.roleModel.findOne({ slug });
    if (existing) {
      throw new BadRequestException(`Role with slug "${slug}" already exists.`);
    }

    const newRole = await this.roleModel.create({
      ...dto,
      slug,
      isSystemRole: false,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      createdBy: actorUser.id,
      updatedBy: actorUser.id,
    });

    await this.auditLogModel.create({
      action: 'ROLE_CREATED',
      actorUserId: actorUser?.id || 'SYSTEM',
      actorName: actorUser?.name || 'Administrator',
      actorRole: actorUser?.platformRole || actorUser?.role || 'SUPER_ADMIN',
      targetEntity: 'ROLE',
      targetEntityId: newRole._id.toString(),
      metadata: { roleId: newRole._id.toString(), name: newRole.name, slug: newRole.slug },
      timestamp: new Date(),
    });

    return { success: true, role: newRole };
  }

  async updateRole(id: string, dto: UpdateRoleDto, actorUser: any): Promise<any> {
    const role = await this.roleModel.findById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" was not found.`);
    }

    if (role.isSystemRole && role.platformRole === PlatformRole.SUPER_ADMIN && actorUser.platformRole !== PlatformRole.SUPER_ADMIN) {
      throw new ForbiddenException('System Super Admin role cannot be modified by non-Super-Admins.');
    }

    if (role.isSystemRole && dto.platformRole && dto.platformRole !== role.platformRole) {
      throw new BadRequestException('Platform role of system roles cannot be altered.');
    }

    const before = role.toObject();

    if (dto.name) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description;
    if (!role.isSystemRole && dto.platformRole) role.platformRole = dto.platformRole;
    if (!role.isSystemRole && dto.accountType !== undefined) role.accountType = dto.accountType;
    if (dto.permissions) role.permissions = dto.permissions;
    if (dto.dataScope) role.dataScope = dto.dataScope;
    if (dto.packageId !== undefined) role.packageId = dto.packageId;
    if (dto.dashboardConfig) role.dashboardConfig = { ...role.dashboardConfig, ...dto.dashboardConfig };
    if (!role.isSystemRole && dto.isActive !== undefined) role.isActive = dto.isActive;
    role.updatedBy = actorUser.id;

    await role.save();

    await this.auditLogModel.create({
      action: 'ROLE_UPDATED',
      actorUserId: actorUser?.id || 'SYSTEM',
      actorName: actorUser?.name || 'Administrator',
      actorRole: actorUser?.platformRole || actorUser?.role || 'SUPER_ADMIN',
      targetEntity: 'ROLE',
      targetEntityId: role._id.toString(),
      metadata: { roleId: role._id.toString(), before, after: role.toObject() },
      timestamp: new Date(),
    });

    return { success: true, role };
  }

  async deleteRole(id: string, actorUser: any): Promise<any> {
    const role = await this.roleModel.findById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" was not found.`);
    }

    if (role.isSystemRole) {
      throw new ForbiddenException('Protected system roles cannot be deleted.');
    }

    const assignedCount = await this.userModel.countDocuments({ customRoleId: id });
    if (assignedCount > 0) {
      throw new BadRequestException(`Cannot delete role: ${assignedCount} active users are currently assigned to this role.`);
    }

    await this.roleModel.findByIdAndDelete(id);

    await this.auditLogModel.create({
      action: 'ROLE_DELETED',
      actorUserId: actorUser?.id || 'SYSTEM',
      actorName: actorUser?.name || 'Administrator',
      actorRole: actorUser?.platformRole || actorUser?.role || 'SUPER_ADMIN',
      targetEntity: 'ROLE',
      targetEntityId: id,
      metadata: { roleId: id, name: role.name },
      timestamp: new Date(),
    });

    return { success: true, message: `Role "${role.name}" deleted successfully.` };
  }

  async duplicateRole(id: string, actorUser: any): Promise<any> {
    const sourceRole = await this.roleModel.findById(id).lean().exec();
    if (!sourceRole) {
      throw new NotFoundException(`Source role with ID "${id}" was not found.`);
    }

    const duplicateName = `${sourceRole.name} (Copy)`;
    const duplicateSlug = `${sourceRole.slug}-copy-${Date.now().toString().slice(-4)}`;

    const duplicated = await this.roleModel.create({
      ...sourceRole,
      _id: new Types.ObjectId(),
      name: duplicateName,
      slug: duplicateSlug,
      isSystemRole: false,
      isActive: true,
      createdBy: actorUser.id,
      updatedBy: actorUser.id,
    });

    await this.auditLogModel.create({
      action: 'ROLE_DUPLICATED',
      actorUserId: actorUser?.id || 'SYSTEM',
      actorName: actorUser?.name || 'Administrator',
      actorRole: actorUser?.platformRole || actorUser?.role || 'SUPER_ADMIN',
      targetEntity: 'ROLE',
      targetEntityId: duplicated._id.toString(),
      metadata: { sourceRoleId: id, newRoleId: duplicated._id.toString(), slug: duplicateSlug },
      timestamp: new Date(),
    });

    return { success: true, role: duplicated };
  }

  // ==========================================
  // 3. PERMISSION GROUPS & DIRECTORY
  // ==========================================

  getPermissionsDirectory() {
    return {
      success: true,
      groups: PERMISSION_GROUPS,
      totalPermissions: PERMISSION_GROUPS.reduce((acc, g) => acc + g.permissions.length, 0),
    };
  }

  // ==========================================
  // 4. PACKAGE MANAGEMENT
  // ==========================================

  async getAllPackages(): Promise<any[]> {
    return this.packageModel.find().sort({ price: 1 }).lean().exec();
  }

  async getPackageById(id: string): Promise<any> {
    let query: any = { slug: id };
    if (isValidObjectId(id)) {
      query = { $or: [{ _id: id }, { slug: id }] };
    }
    const pkg = await this.packageModel.findOne(query).lean().exec();
    if (!pkg) {
      throw new NotFoundException(`Package with ID "${id}" was not found.`);
    }
    return pkg;
  }

  async createPackage(dto: CreatePackageDto, actorUser: any) {
    const slug = dto.slug ? dto.slug.toLowerCase().trim() : dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await this.packageModel.findOne({ slug });
    if (existing) {
      throw new BadRequestException(`Package with slug "${slug}" already exists.`);
    }

    const pkg = await this.packageModel.create({
      ...dto,
      slug,
      createdBy: actorUser.id,
      updatedBy: actorUser.id,
    });

    await this.auditLogModel.create({
      action: 'PACKAGE_CREATED',
      actorUserId: actorUser?.id || 'SYSTEM',
      actorName: actorUser?.name || 'Administrator',
      actorRole: actorUser?.platformRole || actorUser?.role || 'SUPER_ADMIN',
      targetEntity: 'PACKAGE',
      targetEntityId: pkg._id.toString(),
      metadata: { packageId: pkg._id.toString(), name: pkg.name, price: pkg.price },
      timestamp: new Date(),
    });

    return { success: true, package: pkg };
  }

  async updatePackage(id: string, dto: UpdatePackageDto, actorUser: any): Promise<any> {
    const pkg = await this.packageModel.findById(id);
    if (!pkg) {
      throw new NotFoundException(`Package with ID "${id}" was not found.`);
    }

    const before = pkg.toObject();

    if (dto.name) pkg.name = dto.name;
    if (dto.description !== undefined) pkg.description = dto.description;
    if (dto.price !== undefined) pkg.price = dto.price;
    if (dto.billingPeriod) pkg.billingPeriod = dto.billingPeriod;
    if (dto.currency) pkg.currency = dto.currency;
    if (dto.isActive !== undefined) pkg.isActive = dto.isActive;
    if (dto.isDefault !== undefined) pkg.isDefault = dto.isDefault;
    if (dto.targetAccountTypes) pkg.targetAccountTypes = dto.targetAccountTypes;
    if (dto.features) pkg.features = dto.features;
    if (dto.limits) pkg.limits = { ...pkg.limits, ...dto.limits };
    if (dto.permissions) pkg.permissions = dto.permissions;
    pkg.updatedBy = actorUser.id;

    await pkg.save();

    await this.auditLogModel.create({
      action: 'PACKAGE_UPDATED',
      actorUserId: actorUser?.id || 'SYSTEM',
      actorName: actorUser?.name || 'Administrator',
      actorRole: actorUser?.platformRole || actorUser?.role || 'SUPER_ADMIN',
      targetEntity: 'PACKAGE',
      targetEntityId: pkg._id.toString(),
      metadata: { packageId: pkg._id.toString(), before, after: pkg.toObject() },
      timestamp: new Date(),
    });

    return { success: true, package: pkg };
  }

  async deletePackage(id: string, actorUser: any): Promise<any> {
    const pkg = await this.packageModel.findById(id);
    if (!pkg) {
      throw new NotFoundException(`Package with ID "${id}" was not found.`);
    }

    await this.packageModel.findByIdAndDelete(id);

    await this.auditLogModel.create({
      action: 'PACKAGE_DELETED',
      actorUserId: actorUser?.id || 'SYSTEM',
      actorName: actorUser?.name || 'Administrator',
      actorRole: actorUser?.platformRole || actorUser?.role || 'SUPER_ADMIN',
      targetEntity: 'PACKAGE',
      targetEntityId: id,
      metadata: { packageId: id, name: pkg.name },
      timestamp: new Date(),
    });

    return { success: true, message: `Package "${pkg.name}" deleted successfully.` };
  }

  // ==========================================
  // 5. EFFECTIVE ENTITLEMENTS RESOLVER
  // ==========================================

  async resolveUserEntitlements(user: any) {
    if (!user) {
      return {
        platformRole: 'GUEST',
        accountType: null,
        dataScope: DataScope.OWN,
        permissions: [Permission.PROPERTY_VIEW],
        limits: { propertyViews: 0, propertyListings: 0, monthlyLeads: 0, enquiries: 0, chats: 0 },
        usage: { propertyViews: 0, propertyListings: 0, monthlyLeads: 0, enquiries: 0, chats: 0 },
        dashboardConfig: { overview: false },
        package: null,
        subscription: null,
      };
    }

    // 1. Super Admin is always unrestricted
    if (user.platformRole === PlatformRole.SUPER_ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return {
        platformRole: PlatformRole.SUPER_ADMIN,
        accountType: null,
        dataScope: DataScope.ALL,
        permissions: ['*'],
        limits: { propertyViews: -1, propertyListings: -1, savedProperties: -1, savedSearches: -1, monthlyLeads: -1, enquiries: -1, chats: -1, teamMembers: -1 },
        usage: { propertyViews: 0, propertyListings: 0, monthlyLeads: 0, enquiries: 0, chats: 0 },
        dashboardConfig: {
          overview: true, properties: true, leads: true, enquiries: true, chat: true,
          crm: true, siteVisits: true, analytics: true, reviews: true, promotions: true, profile: true,
        },
        package: { name: 'Super Admin Privileges', slug: 'super-admin' },
        subscription: { status: 'ACTIVE' },
      };
    }

    // 2. Resolve Role (Custom Role or Default System Role)
    let roleDoc: any = null;
    let customRoleId = user.customRoleId;
    const userId = user._id ? user._id.toString() : user.id;

    if (!customRoleId && userId && isValidObjectId(userId)) {
      try {
        const dbUser = await this.userModel.findById(userId).lean().exec();
        if (dbUser) {
          customRoleId = dbUser.customRoleId;
          if (dbUser.grantedPermissions?.length) user.grantedPermissions = dbUser.grantedPermissions;
          if (dbUser.deniedPermissions?.length) user.deniedPermissions = dbUser.deniedPermissions;
          if (dbUser.bonusLimits) user.bonusLimits = dbUser.bonusLimits;
          if (dbUser.platformRole) user.platformRole = dbUser.platformRole;
          if (dbUser.accountType !== undefined) user.accountType = dbUser.accountType;
        }
      } catch (err: any) {
        this.logger.warn(`User DB context resolution warning: ${err?.message}`);
      }
    }

    if (customRoleId && isValidObjectId(customRoleId)) {
      roleDoc = await this.roleModel.findById(customRoleId).lean().exec();
    }
    if (!roleDoc) {
      const slugMatch = user.platformRole === PlatformRole.ADMIN ? 'admin'
        : user.platformRole === PlatformRole.MODERATOR ? 'moderator'
        : (user.accountType || user.role || 'buyer').toLowerCase().replace('_', '-');
      roleDoc = await this.roleModel.findOne({ slug: slugMatch }).lean().exec();
    }

    const rolePermissions: string[] = roleDoc?.permissions || [];
    const dataScope: DataScope = roleDoc?.dataScope || DataScope.OWN;
    const dashboardConfig = roleDoc?.dashboardConfig || { overview: true, profile: true };

    // 3. Resolve Active Subscription & Package
    let packageDoc: any = null;
    let subscriptionDoc: any = null;

    if (user._id || user.id) {
      const userId = user._id ? user._id.toString() : user.id;
      subscriptionDoc = await this.subscriptionModel.findOne({
        userId,
        status: { $in: ['ACTIVE', 'TRIAL'] },
        endDate: { $gte: new Date() },
      }).sort({ createdAt: -1 }).lean().exec();

      if (subscriptionDoc?.packageId && isValidObjectId(subscriptionDoc.packageId)) {
        packageDoc = await this.packageModel.findById(subscriptionDoc.packageId).lean().exec();
      }
    }

    if (!packageDoc && user.activePackageId && isValidObjectId(user.activePackageId)) {
      packageDoc = await this.packageModel.findById(user.activePackageId).lean().exec();
    }

    // Fallback to default package for user's account type
    if (!packageDoc) {
      const accountTypeStr = user.accountType || 'BUYER';
      packageDoc = await this.packageModel.findOne({
        targetAccountTypes: accountTypeStr,
        isDefault: true,
      }).lean().exec();
    }

    const packagePermissions: string[] = packageDoc?.permissions || [];
    const packageLimits = packageDoc?.limits || {
      propertyViews: 10, propertyListings: 0, savedProperties: 5, savedSearches: 2, monthlyLeads: 10, enquiries: 5, chats: 10, teamMembers: 1,
    };

    // 4. Combine Permissions: Role + Package + User Granted - User Denied
    const granted = user.grantedPermissions || [];
    const denied = new Set(user.deniedPermissions || []);

    const combined = new Set<string>();
    for (const p of rolePermissions) combined.add(p);
    for (const p of packagePermissions) combined.add(p);
    for (const p of granted) combined.add(p);

    const effectivePermissions = Array.from(combined).filter((p) => !denied.has(p));

    // 5. Combine Limits with Bonus Credits
    const bonus = user.bonusLimits || {};
    const effectiveLimits = {
      propertyViews: packageLimits.propertyViews === -1 ? -1 : (packageLimits.propertyViews || 0) + (bonus.propertyViews || 0),
      propertyListings: packageLimits.propertyListings === -1 ? -1 : (packageLimits.propertyListings || 0) + (bonus.propertyListings || 0),
      savedProperties: packageLimits.savedProperties === -1 ? -1 : (packageLimits.savedProperties || 0) + (bonus.savedProperties || 0),
      savedSearches: packageLimits.savedSearches === -1 ? -1 : (packageLimits.savedSearches || 0) + (bonus.savedSearches || 0),
      monthlyLeads: packageLimits.monthlyLeads === -1 ? -1 : (packageLimits.monthlyLeads || 0) + (bonus.monthlyLeads || 0),
      enquiries: packageLimits.enquiries === -1 ? -1 : (packageLimits.enquiries || 0) + (bonus.enquiries || 0),
      chats: packageLimits.chats === -1 ? -1 : (packageLimits.chats || 0) + (bonus.chats || 0),
      teamMembers: packageLimits.teamMembers || 1,
    };

    return {
      platformRole: user.platformRole || PlatformRole.USER,
      accountType: user.accountType || null,
      role: roleDoc ? { id: roleDoc._id.toString(), name: roleDoc.name, slug: roleDoc.slug } : null,
      dataScope,
      permissions: effectivePermissions,
      limits: effectiveLimits,
      dashboardConfig,
      package: packageDoc ? { id: packageDoc._id.toString(), name: packageDoc.name, slug: packageDoc.slug, price: packageDoc.price, billingPeriod: packageDoc.billingPeriod } : null,
      subscription: subscriptionDoc ? { id: subscriptionDoc._id.toString(), status: subscriptionDoc.status, endDate: subscriptionDoc.endDate } : null,
    };
  }

  // ==========================================
  // 6. PROPERTY VIEW LIMITS & DEDUPLICATION
  // ==========================================

  async trackAndValidatePropertyView(userId: string | null, propertyId: string, ipAddress: string = '127.0.0.1') {
    if (!userId || userId === 'GUEST') {
      return {
        allowed: true,
        contactVisible: false,
        message: 'Login to view seller contact details.',
        remainingViews: 0,
        totalViewsUsed: 0,
        limit: 0,
      };
    }

    const user = await this.userModel.findById(userId).lean().exec();
    if (!user) {
      return { allowed: true, contactVisible: false, remainingViews: 0, totalViewsUsed: 0, limit: 0 };
    }

    // Super Admin / Platform Admin has infinite access
    if (user.platformRole === PlatformRole.SUPER_ADMIN || user.platformRole === PlatformRole.ADMIN) {
      return { allowed: true, contactVisible: true, remainingViews: 999999, totalViewsUsed: 0, limit: -1 };
    }

    const entitlements = await this.resolveUserEntitlements(user);
    const viewLimit = entitlements.limits.propertyViews;

    // Check 30-minute deduplication window
    const dedupeWindow = new Date(Date.now() - 30 * 60 * 1000);
    const recentView = await this.propertyViewModel.findOne({
      userId,
      propertyId,
      viewedAt: { $gte: dedupeWindow },
    }).lean().exec();

    // Calculate current month's unique property views
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const viewsCount = await this.propertyViewModel.countDocuments({
      userId,
      viewedAt: { $gte: monthStart },
    });

    if (recentView) {
      return {
        allowed: true,
        contactVisible: entitlements.permissions.includes(Permission.PROPERTY_CONTACT_VIEW),
        remainingViews: viewLimit === -1 ? -1 : Math.max(0, viewLimit - viewsCount),
        totalViewsUsed: viewsCount,
        limit: viewLimit,
        deduplicated: true,
      };
    }

    // If limit is finite and reached:
    if (viewLimit !== -1 && viewsCount >= viewLimit) {
      return {
        allowed: false,
        contactVisible: false,
        message: 'You have reached your monthly property view limit. Upgrade your package or add bonus view credits to continue.',
        remainingViews: 0,
        totalViewsUsed: viewsCount,
        limit: viewLimit,
        requiresUpgrade: true,
      };
    }

    // Record view in collection
    await this.propertyViewModel.create({
      userId,
      propertyId,
      packageId: entitlements.package?.id,
      viewedAt: new Date(),
      ipAddress,
    });

    const newViewsCount = viewsCount + 1;
    const remaining = viewLimit === -1 ? -1 : Math.max(0, viewLimit - newViewsCount);

    return {
      allowed: true,
      contactVisible: entitlements.permissions.includes(Permission.PROPERTY_CONTACT_VIEW),
      remainingViews: remaining,
      totalViewsUsed: newViewsCount,
      limit: viewLimit,
    };
  }

  // ==========================================
  // 7. USER DETAIL OVERRIDES & USAGE METRICS
  // ==========================================

  async getUsageMetrics(query: { search?: string; page?: number; limit?: number }): Promise<{
    data: any[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { mobile: searchRegex },
        { normalizedMobile: searchRegex },
        { email: searchRegex },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.userModel.countDocuments(filter),
    ]);

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const data = await Promise.all(
      users.map(async (user) => {
        const userId = user._id.toString();
        const entitlements = await this.resolveUserEntitlements(user);

        // Fetch view count for this user in current month
        const [viewsUsed, lastView] = await Promise.all([
          this.propertyViewModel.countDocuments({ userId, viewedAt: { $gte: monthStart } }),
          this.propertyViewModel.findOne({ userId }).sort({ viewedAt: -1 }).lean().exec(),
        ]);

        const limits: any = entitlements.limits || {};
        const bonusLimits: any = user.bonusLimits || {};

        const viewsLimit = limits.propertyViews ?? 10;
        const viewsBonus = bonusLimits.propertyViewsBonus || 0;
        const totalViewsLimit = viewsLimit === -1 ? -1 : viewsLimit + viewsBonus;
        const viewsRemaining = totalViewsLimit === -1 ? -1 : Math.max(0, totalViewsLimit - viewsUsed);

        const listingsLimit = limits.propertyListings ?? 0;
        const listingsBonus = bonusLimits.propertyListingsBonus || 0;
        const totalListingsLimit = listingsLimit === -1 ? -1 : listingsLimit + listingsBonus;

        const leadsLimit = limits.monthlyLeads ?? 0;
        const leadsBonus = bonusLimits.leadsBonus || 0;
        const totalLeadsLimit = leadsLimit === -1 ? -1 : leadsLimit + leadsBonus;

        return {
          userId,
          userName: user.name || 'User',
          userMobile: user.mobile || user.normalizedMobile || '',
          userEmail: user.email || '',
          role: user.role || user.platformRole || 'USER',
          accountType: user.accountType || undefined,
          package: entitlements.package
            ? {
                id: entitlements.package.id,
                name: entitlements.package.name,
                billingPeriod: entitlements.package.billingPeriod || 'MONTHLY',
              }
            : undefined,
          propertyViews: {
            used: viewsUsed,
            limit: viewsLimit,
            bonus: viewsBonus,
            remaining: viewsRemaining,
          },
          propertyListings: {
            used: 0,
            limit: listingsLimit,
            bonus: listingsBonus,
            remaining: totalListingsLimit === -1 ? -1 : Math.max(0, totalListingsLimit - 0),
          },
          leads: {
            used: 0,
            limit: leadsLimit,
            bonus: leadsBonus,
            remaining: totalLeadsLimit === -1 ? -1 : Math.max(0, totalLeadsLimit - 0),
          },
          lastViewedAt: lastView?.viewedAt ? new Date(lastView.viewedAt).toISOString() : undefined,
        };
      }),
    );

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getUserEntitlementDetails(userId: string) {
    const user = await this.userModel.findById(userId).lean().exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" was not found.`);
    }

    const entitlements = await this.resolveUserEntitlements(user);

    // Current month usage
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const propertyViews = await this.propertyViewModel.countDocuments({ userId, viewedAt: { $gte: monthStart } });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        mobile: user.mobile,
        normalizedMobile: user.normalizedMobile,
        email: user.email,
        platformRole: user.platformRole,
        accountType: user.accountType,
        status: user.status,
        isVerifiedAgent: user.isVerifiedAgent,
        customRoleId: user.customRoleId,
        grantedPermissions: user.grantedPermissions || [],
        deniedPermissions: user.deniedPermissions || [],
        bonusLimits: user.bonusLimits || {},
      },
      entitlements,
      usage: {
        propertyViews,
        propertyListings: 0, // dynamic in property queries
        monthlyLeads: 0,
        enquiries: 0,
        chats: 0,
      },
    };
  }

  async updateUserOverrides(userId: string, dto: UpdateUserOverridesDto, actorUser: any) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" was not found.`);
    }

    const before = user.toObject();

    if (dto.roleId !== undefined) {
      if (dto.roleId && isValidObjectId(dto.roleId)) {
        const role = await this.roleModel.findById(dto.roleId);
        if (!role) throw new NotFoundException('Role not found.');
        user.customRoleId = dto.roleId;
      } else {
        user.customRoleId = null;
      }
    }

    if (dto.packageId !== undefined) {
      user.activePackageId = dto.packageId || null;
    }

    if (dto.grantedPermissions !== undefined) {
      user.grantedPermissions = dto.grantedPermissions;
    }

    if (dto.deniedPermissions !== undefined) {
      user.deniedPermissions = dto.deniedPermissions;
    }

    if (dto.bonusLimits !== undefined) {
      user.bonusLimits = { ...user.bonusLimits, ...dto.bonusLimits };
    }

    if (dto.resetUsage) {
      await this.propertyViewModel.deleteMany({ userId });
    }

    await user.save();

    await this.auditLogModel.create({
      action: 'USER_OVERRIDES_UPDATED',
      actorUserId: actorUser?.id || 'SYSTEM',
      actorName: actorUser?.name || 'Administrator',
      actorRole: actorUser?.platformRole || actorUser?.role || 'SUPER_ADMIN',
      targetUserId: userId,
      targetEntity: 'USER',
      targetEntityId: userId,
      metadata: { before, after: user.toObject() },
      timestamp: new Date(),
    });

    return { success: true, message: 'User entitlements and overrides updated successfully.' };
  }

  async addBonusCredits(userId: string, dto: AddBonusCreditsDto, actorUser: any): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" was not found.`);
    }

    const currentBonus = user.bonusLimits || {};

    if (dto.bonusLimits) {
      user.bonusLimits = {
        propertyViewsBonus: (currentBonus.propertyViewsBonus || 0) + (dto.bonusLimits.propertyViewsBonus || 0),
        propertyListingsBonus: (currentBonus.propertyListingsBonus || 0) + (dto.bonusLimits.propertyListingsBonus || 0),
        leadsBonus: (currentBonus.leadsBonus || 0) + (dto.bonusLimits.leadsBonus || 0),
        featuredListingsBonus: (currentBonus.featuredListingsBonus || 0) + (dto.bonusLimits.featuredListingsBonus || 0),
      };
    } else {
      const limitType = dto.limitType || 'propertyViewsBonus';
      const amount = Number(dto.bonusCredits) || 10;
      const currentVal = (currentBonus as any)[limitType] || 0;
      (currentBonus as any)[limitType] = currentVal + amount;
      user.bonusLimits = currentBonus;
    }

    user.markModified('bonusLimits');
    await user.save();

    await this.auditLogModel.create({
      action: 'BONUS_CREDITS_ADDED',
      actorUserId: actorUser?.id || 'SYSTEM',
      actorName: actorUser?.name || 'Administrator',
      actorRole: actorUser?.platformRole || actorUser?.role || 'SUPER_ADMIN',
      targetUserId: userId,
      targetEntity: 'USER',
      targetEntityId: userId,
      metadata: { bonusLimits: user.bonusLimits },
      timestamp: new Date(),
    });

    return { success: true, bonusLimits: user.bonusLimits };
  }

  // ==========================================
  // 8. CONTACT REDACTION SECURITY HELPER
  // ==========================================

  redactContactData(propertyDoc: any, hasContactPermission: boolean) {
    const raw = propertyDoc.toObject ? propertyDoc.toObject() : propertyDoc;
    if (hasContactPermission) {
      return {
        ...raw,
        contactLocked: false,
      };
    }

    // Redact direct contact information
    const sanitizedAdvertiser = typeof raw.advertiser === 'object' && raw.advertiser ? {
      name: raw.advertiser.name || 'Verified Advertiser',
      role: raw.advertiser.role || 'AGENT',
      isVerifiedAgent: !!raw.advertiser.isVerifiedAgent,
      phone: null,
      whatsapp: null,
      email: null,
    } : null;

    return {
      ...raw,
      advertiser: sanitizedAdvertiser,
      owner: null,
      contactLocked: true,
      contactMessage: 'Login or upgrade package to view owner and agent contact details.',
    };
  }
}
