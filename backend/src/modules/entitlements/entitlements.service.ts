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
    await this.seedCasaPricingPackages();
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
        {
          name: '1 Month Standard Plan',
          slug: 'plan-1-month',
          description: 'Full marketplace access for 30 days. Perfect for monthly active brokers and agents.',
          targetAccountTypes: [AccountType.AGENT, AccountType.BROKER, AccountType.PROPERTY_OWNER, AccountType.BUYER],
          price: 499,
          currency: 'INR',
          billingPeriod: BillingPeriod.ONE_MONTH,
          durationDays: 30,
          isActive: true,
          isDefault: false,
          features: ['30 Days Full Access', '25 Active Listings', '100 Verified Buyer Leads', 'Unlimited Property Views', 'Standard CRM Pipeline', 'Direct Buyer Dialing'],
          limits: {
            propertyViews: -1,
            propertyListings: 25,
            savedProperties: -1,
            savedSearches: -1,
            monthlyLeads: 100,
            enquiries: -1,
            chats: -1,
            teamMembers: 1,
          },
          permissions: [Permission.PROPERTY_CREATE, Permission.PROPERTY_EDIT, Permission.PROPERTY_PUBLISH, Permission.PROPERTY_CONTACT_VIEW, Permission.LEAD_VIEW, Permission.CHAT_START],
        },
        {
          name: '60 Days Bi-Monthly Plan',
          slug: 'plan-60-days',
          description: 'Extended 60-day campaign plan with priority discovery and lead generation.',
          targetAccountTypes: [AccountType.AGENT, AccountType.BROKER, AccountType.DEVELOPER, AccountType.PROPERTY_OWNER],
          price: 899,
          currency: 'INR',
          billingPeriod: BillingPeriod.SIXTY_DAYS,
          durationDays: 60,
          isActive: true,
          isDefault: false,
          features: ['60 Days Full Access', '50 Active Listings', '250 Buyer Leads', 'Unlimited Property Views', 'Featured Listings Boost', 'Priority Support Desk'],
          limits: {
            propertyViews: -1,
            propertyListings: 50,
            savedProperties: -1,
            savedSearches: -1,
            monthlyLeads: 250,
            enquiries: -1,
            chats: -1,
            teamMembers: 2,
          },
          permissions: [Permission.PROPERTY_CREATE, Permission.PROPERTY_EDIT, Permission.PROPERTY_PUBLISH, Permission.PROPERTY_FEATURE, Permission.PROPERTY_CONTACT_VIEW, Permission.LEAD_VIEW, Permission.CHAT_START],
        },
        {
          name: '90 Days Quarterly Plan',
          slug: 'plan-90-days',
          description: 'Quarterly deal closing accelerator with 90 days continuous marketing.',
          targetAccountTypes: [AccountType.AGENT, AccountType.BROKER, AccountType.DEVELOPER],
          price: 1299,
          currency: 'INR',
          billingPeriod: BillingPeriod.NINETY_DAYS,
          durationDays: 90,
          isActive: true,
          isDefault: false,
          features: ['90 Days Full Access', '75 Active Listings', '400 Buyer Leads', 'Unlimited Views & Saves', 'CRM Leads Export (CSV)', 'Priority Search Ranking'],
          limits: {
            propertyViews: -1,
            propertyListings: 75,
            savedProperties: -1,
            savedSearches: -1,
            monthlyLeads: 400,
            enquiries: -1,
            chats: -1,
            teamMembers: 3,
          },
          permissions: [Permission.PROPERTY_CREATE, Permission.PROPERTY_EDIT, Permission.PROPERTY_PUBLISH, Permission.PROPERTY_FEATURE, Permission.PROPERTY_CONTACT_VIEW, Permission.LEAD_VIEW, Permission.LEAD_EXPORT, Permission.CHAT_START],
        },
        {
          name: '6 Months Half-Yearly Plan',
          slug: 'plan-6-months',
          description: 'Heavy duty 180-day growth package for professional real estate businesses.',
          targetAccountTypes: [AccountType.AGENT, AccountType.BROKER, AccountType.DEVELOPER],
          price: 2399,
          currency: 'INR',
          billingPeriod: BillingPeriod.SIX_MONTHS,
          durationDays: 180,
          isActive: true,
          isDefault: false,
          features: ['180 Days Full Access', '150 Active Listings', '1,000 Verified Leads', 'Unlimited Property Views', 'Team Collaboration (5 Seats)', 'Advanced BI Analytics'],
          limits: {
            propertyViews: -1,
            propertyListings: 150,
            savedProperties: -1,
            savedSearches: -1,
            monthlyLeads: 1000,
            enquiries: -1,
            chats: -1,
            teamMembers: 5,
          },
          permissions: [Permission.PROPERTY_CREATE, Permission.PROPERTY_EDIT, Permission.PROPERTY_PUBLISH, Permission.PROPERTY_FEATURE, Permission.PROPERTY_CONTACT_VIEW, Permission.LEAD_VIEW, Permission.LEAD_EXPORT, Permission.ANALYTICS_ADVANCED, Permission.CHAT_START],
        },
        {
          name: '1 Year Annual Enterprise Plan',
          slug: 'plan-1-year',
          description: 'Full 365-day annual corporate package with maximum inventory and unlimited discovery.',
          targetAccountTypes: [AccountType.AGENT, AccountType.BROKER, AccountType.DEVELOPER],
          price: 4499,
          currency: 'INR',
          billingPeriod: BillingPeriod.ONE_YEAR,
          durationDays: 365,
          isActive: true,
          isDefault: false,
          features: ['365 Days Full Access', 'Unlimited Active Listings', '3,000 Verified Leads', 'Unlimited Views & Enquiries', '10 Team Sub-Accounts', 'Dedicated Relationship Manager'],
          limits: {
            propertyViews: -1,
            propertyListings: -1,
            savedProperties: -1,
            savedSearches: -1,
            monthlyLeads: 3000,
            enquiries: -1,
            chats: -1,
            teamMembers: 10,
          },
          permissions: [Permission.PROPERTY_CREATE, Permission.PROPERTY_EDIT, Permission.PROPERTY_PUBLISH, Permission.PROPERTY_FEATURE, Permission.PROPERTY_CONTACT_VIEW, Permission.LEAD_VIEW, Permission.LEAD_EXPORT, Permission.ANALYTICS_ADVANCED, Permission.PROMOTION_CREATE, Permission.CHAT_START],
        },
      ];

      // Note: Packages are managed strictly by Super Admin. Do not auto-seed sample packages.

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
            Permission.PROPERTY_PUBLISH, Permission.PROPERTY_CONTACT_VIEW, Permission.PROJECT_VIEW, Permission.PROJECT_CREATE,
            Permission.PROJECT_EDIT, Permission.PROJECT_MANAGE, Permission.REEL_VIEW, Permission.REEL_CREATE,
            Permission.REEL_EDIT, Permission.REEL_DELETE, Permission.LEAD_VIEW, Permission.LEAD_CREATE,
            Permission.LEAD_EDIT, Permission.ENQUIRY_VIEW, Permission.ENQUIRY_MANAGE, Permission.CHAT_VIEW, Permission.CHAT_START,
            Permission.CHAT_REPLY, Permission.CRM_VIEW, Permission.CRM_CREATE, Permission.CRM_EDIT, Permission.CRM_FOLLOWUP,
            Permission.ANALYTICS_VIEW, Permission.ANALYTICS_ADVANCED, Permission.SITE_VISIT_VIEW, Permission.SITE_VISIT_MANAGE,
            Permission.PROMOTION_CREATE, Permission.PAYMENT_CREATE,
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
            Permission.PROPERTY_PUBLISH, Permission.PROPERTY_CONTACT_VIEW, Permission.PROJECT_VIEW, Permission.PROJECT_CREATE,
            Permission.PROJECT_EDIT, Permission.PROJECT_MANAGE, Permission.REEL_VIEW, Permission.REEL_CREATE,
            Permission.REEL_EDIT, Permission.REEL_DELETE, Permission.LEAD_VIEW, Permission.LEAD_CREATE,
            Permission.LEAD_EDIT, Permission.LEAD_ASSIGN, Permission.ENQUIRY_VIEW, Permission.ENQUIRY_MANAGE,
            Permission.CHAT_VIEW, Permission.CHAT_START, Permission.CHAT_REPLY, Permission.CRM_VIEW, Permission.CRM_CREATE,
            Permission.CRM_EDIT, Permission.CRM_FOLLOWUP, Permission.SITE_VISIT_VIEW, Permission.SITE_VISIT_MANAGE, Permission.REVIEW_VIEW,
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
            Permission.PROPERTY_PUBLISH, Permission.PROPERTY_CONTACT_VIEW, Permission.PROJECT_VIEW, Permission.PROJECT_CREATE,
            Permission.PROJECT_EDIT, Permission.PROJECT_MANAGE, Permission.REEL_VIEW, Permission.REEL_CREATE,
            Permission.REEL_EDIT, Permission.REEL_DELETE, Permission.LEAD_VIEW, Permission.LEAD_CREATE,
            Permission.LEAD_EDIT, Permission.LEAD_ASSIGN, Permission.ENQUIRY_VIEW, Permission.ENQUIRY_MANAGE,
            Permission.CHAT_VIEW, Permission.CHAT_START, Permission.CHAT_REPLY, Permission.CRM_VIEW, Permission.CRM_CREATE,
            Permission.CRM_EDIT, Permission.CRM_FOLLOWUP, Permission.SITE_VISIT_VIEW, Permission.SITE_VISIT_MANAGE, Permission.REVIEW_VIEW,
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
          {
            $set: {
              permissions: r.permissions,
              name: r.name,
              description: r.description,
              platformRole: r.platformRole,
              accountType: r.accountType,
              isActive: r.isActive,
              dataScope: r.dataScope,
              dashboardConfig: r.dashboardConfig,
            },
            $setOnInsert: { isSystemRole: true },
          },
          { upsert: true, new: true },
        );
      }

      this.logger.log('System roles and default packages verified successfully.');
    } catch (err) {
      this.logger.error(`Failed to seed system roles: ${err.message}`, err.stack);
    }
  }

  async seedCasaPricingPackages() {
    try {
      this.logger.log('Verifying authoritative CASA Pricing Plans and Duration Rates...');

      const casaPlans = [
        {
          name: 'Free Plan',
          slug: 'casa-free-trial',
          description: 'Introductory 3 Months Free full marketplace access for first 50 eligible Builders, Brokers, and Agents.',
          isFree: true,
          recommended: false,
          displayOrder: 0,
          price: 0,
          currency: 'INR',
          billingPeriod: BillingPeriod.NINETY_DAYS,
          durationDays: 90,
          eligibleUserTypes: ['builder', 'broker', 'agent'],
          targetAccountTypes: [AccountType.DEVELOPER, AccountType.BROKER, AccountType.AGENT],
          freeTrialMaxSlots: 50,
          isActive: true,
          isDefault: false,
          limits: {
            propertyViews: -1,
            propertyListings: 5,
            projectListings: 2,
            savedProperties: 20,
            savedSearches: 10,
            monthlyLeads: 25,
            enquiries: -1,
            chats: -1,
            teamMembers: 1,
          },
          features: [
            '3 Months Free Validity',
            '5 Active Properties',
            '2 Active Projects',
            'Team: 1 Member',
            '25 Verified Buyer Leads',
            'Standard CRM Pipeline',
            'Introductory Offer — First 50 Users Only',
          ],
          permissions: [
            Permission.PROPERTY_VIEW,
            Permission.PROPERTY_CREATE,
            Permission.PROPERTY_EDIT,
            Permission.PROPERTY_PUBLISH,
            Permission.PROPERTY_CONTACT_VIEW,
            Permission.PROJECT_VIEW,
            Permission.PROJECT_CREATE,
            Permission.PROJECT_EDIT,
            Permission.PROJECT_MANAGE,
            Permission.REEL_VIEW,
            Permission.REEL_CREATE,
            Permission.REEL_EDIT,
            Permission.REEL_DELETE,
            Permission.LEAD_VIEW,
            Permission.CHAT_START,
            Permission.CHAT_REPLY,
            Permission.ENQUIRY_VIEW,
            Permission.CRM_VIEW,
            Permission.CRM_FOLLOWUP,
          ],
        },
        {
          name: 'Basic Plan',
          slug: 'casa-basic',
          description: 'Essential toolkit for active individual agents and independent brokers.',
          isFree: false,
          recommended: false,
          displayOrder: 1,
          price: 999,
          currency: 'INR',
          billingPeriod: BillingPeriod.MONTHLY,
          durationDays: 30,
          eligibleUserTypes: ['builder', 'broker', 'agent', 'property-owner'],
          targetAccountTypes: [AccountType.DEVELOPER, AccountType.BROKER, AccountType.AGENT, AccountType.PROPERTY_OWNER],
          durationPrices: [
            { durationMonths: 1, amount: 999, currency: 'INR', referenceMonthlyPrice: 999, isActive: true },
            { durationMonths: 2, amount: 1999, currency: 'INR', referenceMonthlyPrice: 999, isActive: true },
            { durationMonths: 3, amount: 2999, currency: 'INR', referenceMonthlyPrice: 999, isActive: true },
            { durationMonths: 6, amount: 4999, currency: 'INR', referenceMonthlyPrice: 999, isActive: true },
            { durationMonths: 12, amount: 10499, currency: 'INR', referenceMonthlyPrice: 999, isActive: true },
          ],
          isActive: true,
          isDefault: false,
          limits: {
            propertyViews: -1,
            propertyListings: 10,
            projectListings: 5,
            savedProperties: -1,
            savedSearches: -1,
            monthlyLeads: 100,
            enquiries: -1,
            chats: -1,
            teamMembers: 2,
          },
          features: [
            '10 Active Properties',
            '5 Active Projects',
            'Team: 1 Admin + 1 Agent (2 total)',
            '100 Verified Buyer Leads / mo',
            'Unlimited Property Views',
            'Standard CRM Pipeline',
            'Direct Buyer Dialing & WhatsApp',
          ],
          permissions: [
            Permission.PROPERTY_VIEW,
            Permission.PROPERTY_CREATE,
            Permission.PROPERTY_EDIT,
            Permission.PROPERTY_PUBLISH,
            Permission.PROPERTY_CONTACT_VIEW,
            Permission.PROJECT_VIEW,
            Permission.PROJECT_CREATE,
            Permission.PROJECT_EDIT,
            Permission.PROJECT_MANAGE,
            Permission.REEL_VIEW,
            Permission.REEL_CREATE,
            Permission.REEL_EDIT,
            Permission.REEL_DELETE,
            Permission.LEAD_VIEW,
            Permission.LEAD_EDIT,
            Permission.CRM_VIEW,
            Permission.CRM_CREATE,
            Permission.CRM_FOLLOWUP,
            Permission.CHAT_START,
            Permission.CHAT_REPLY,
            Permission.ANALYTICS_VIEW,
          ],
        },
        {
          name: 'Advanced Plan',
          slug: 'casa-advanced',
          description: 'High-velocity deal pipeline for top-producing teams and brokerage firms.',
          isFree: false,
          recommended: true,
          displayOrder: 2,
          price: 1499,
          currency: 'INR',
          billingPeriod: BillingPeriod.MONTHLY,
          durationDays: 30,
          eligibleUserTypes: ['builder', 'broker', 'agent', 'property-owner'],
          targetAccountTypes: [AccountType.DEVELOPER, AccountType.BROKER, AccountType.AGENT, AccountType.PROPERTY_OWNER],
          durationPrices: [
            { durationMonths: 1, amount: 1499, currency: 'INR', referenceMonthlyPrice: 1499, isActive: true },
            { durationMonths: 2, amount: 2999, currency: 'INR', referenceMonthlyPrice: 1499, isActive: true },
            { durationMonths: 3, amount: 4499, currency: 'INR', referenceMonthlyPrice: 1499, isActive: true },
            { durationMonths: 6, amount: 7999, currency: 'INR', referenceMonthlyPrice: 1499, isActive: true },
            { durationMonths: 12, amount: 14999, currency: 'INR', referenceMonthlyPrice: 1499, isActive: true },
          ],
          isActive: true,
          isDefault: false,
          limits: {
            propertyViews: -1,
            propertyListings: 25,
            projectListings: 10,
            savedProperties: -1,
            savedSearches: -1,
            monthlyLeads: 250,
            enquiries: -1,
            chats: -1,
            teamMembers: 4,
          },
          features: [
            '25 Active Properties',
            '10 Active Projects',
            'Team: 1 Admin + 3 Agents (4 total)',
            '250 Verified Buyer Leads / mo',
            'Priority Search Ranking',
            'Advanced CRM & Lead Export',
            'Dedicated Relationship Support',
          ],
          permissions: [
            Permission.PROPERTY_VIEW,
            Permission.PROPERTY_CREATE,
            Permission.PROPERTY_EDIT,
            Permission.PROPERTY_PUBLISH,
            Permission.PROPERTY_FEATURE,
            Permission.PROPERTY_CONTACT_VIEW,
            Permission.PROJECT_VIEW,
            Permission.PROJECT_CREATE,
            Permission.PROJECT_EDIT,
            Permission.PROJECT_MANAGE,
            Permission.REEL_VIEW,
            Permission.REEL_CREATE,
            Permission.REEL_EDIT,
            Permission.REEL_DELETE,
            Permission.LEAD_VIEW,
            Permission.LEAD_EDIT,
            Permission.LEAD_EXPORT,
            Permission.CRM_VIEW,
            Permission.CRM_CREATE,
            Permission.CRM_EDIT,
            Permission.CRM_EXPORT,
            Permission.CRM_FOLLOWUP,
            Permission.CHAT_START,
            Permission.CHAT_REPLY,
            Permission.ANALYTICS_ADVANCED,
          ],
        },
        {
          name: 'Premium Plan',
          slug: 'casa-premium',
          description: 'Complete real estate enterprise solution for master brokers and premier builders.',
          isFree: false,
          recommended: false,
          displayOrder: 3,
          price: 1999,
          currency: 'INR',
          billingPeriod: BillingPeriod.MONTHLY,
          durationDays: 30,
          eligibleUserTypes: ['builder', 'broker', 'agent', 'property-owner'],
          targetAccountTypes: [AccountType.DEVELOPER, AccountType.BROKER, AccountType.AGENT, AccountType.PROPERTY_OWNER],
          durationPrices: [
            { durationMonths: 1, amount: 1999, currency: 'INR', referenceMonthlyPrice: 1999, isActive: true },
            { durationMonths: 2, amount: 3999, currency: 'INR', referenceMonthlyPrice: 1999, isActive: true },
            { durationMonths: 3, amount: 5999, currency: 'INR', referenceMonthlyPrice: 1999, isActive: true },
            { durationMonths: 6, amount: 10999, currency: 'INR', referenceMonthlyPrice: 1999, isActive: true },
            { durationMonths: 12, amount: 21999, currency: 'INR', referenceMonthlyPrice: 1999, isActive: true },
          ],
          isActive: true,
          isDefault: false,
          limits: {
            propertyViews: -1,
            propertyListings: 50,
            projectListings: 15,
            savedProperties: -1,
            savedSearches: -1,
            monthlyLeads: 1000,
            enquiries: -1,
            chats: -1,
            teamMembers: 11,
          },
          features: [
            '50 Active Properties',
            '15 Active Projects',
            'Team: 1 Admin + 10 Agents (11 total)',
            '1,000 Verified Buyer Leads / mo',
            'VIP Verified Developer/Broker Badge',
            'Featured Listings Boost',
            'Priority 24/7 Phone & WhatsApp Concierge',
          ],
          permissions: [
            Permission.PROPERTY_VIEW,
            Permission.PROPERTY_CREATE,
            Permission.PROPERTY_EDIT,
            Permission.PROPERTY_PUBLISH,
            Permission.PROPERTY_FEATURE,
            Permission.PROPERTY_CONTACT_VIEW,
            Permission.PROJECT_VIEW,
            Permission.PROJECT_CREATE,
            Permission.PROJECT_EDIT,
            Permission.PROJECT_MANAGE,
            Permission.REEL_VIEW,
            Permission.REEL_CREATE,
            Permission.REEL_EDIT,
            Permission.REEL_DELETE,
            Permission.LEAD_VIEW,
            Permission.LEAD_EDIT,
            Permission.LEAD_EXPORT,
            Permission.CRM_VIEW,
            Permission.CRM_CREATE,
            Permission.CRM_EDIT,
            Permission.CRM_EXPORT,
            Permission.CRM_FOLLOWUP,
            Permission.CHAT_START,
            Permission.CHAT_REPLY,
            Permission.ANALYTICS_ADVANCED,
            Permission.PROMOTION_CREATE,
          ],
        },
      ];

      for (const p of casaPlans) {
        const existing = await this.packageModel.findOne({ slug: p.slug });
        if (!existing) {
          await this.packageModel.create({ ...p, freeTrialClaimedSlots: 0 });
          this.logger.log(`✅ Seeded official CASA plan: ${p.name} (${p.slug})`);
        } else {
          // If duration prices or eligibleUserTypes are not set, populate them
          let shouldUpdate = false;
          if (!existing.durationPrices || existing.durationPrices.length === 0) {
            existing.durationPrices = (p.durationPrices || []) as any;
            shouldUpdate = true;
          }
          if (!existing.eligibleUserTypes || existing.eligibleUserTypes.length === 0) {
            existing.eligibleUserTypes = p.eligibleUserTypes;
            shouldUpdate = true;
          }
          if (p.isFree && (existing.freeTrialMaxSlots === undefined || existing.freeTrialMaxSlots === null)) {
            existing.freeTrialMaxSlots = 50;
            shouldUpdate = true;
          }
          if (existing.recommended === undefined) {
            existing.recommended = p.recommended;
            shouldUpdate = true;
          }
          if (existing.displayOrder === undefined) {
            existing.displayOrder = p.displayOrder;
            shouldUpdate = true;
          }
          // Ensure limits contain projectListings
          if (p.limits?.projectListings && (!existing.limits || existing.limits.projectListings === undefined)) {
            existing.limits = { ...existing.limits, projectListings: p.limits.projectListings };
            shouldUpdate = true;
          }
          if (shouldUpdate) {
            await existing.save();
            this.logger.log(`✅ Updated existing plan config: ${p.name} (${p.slug})`);
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`CASA plans seeding note: ${err?.message}`);
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

  async getPublicMarketplaceRoles(): Promise<any[]> {
    const roles = await this.roleModel
      .find({
        isActive: true,
        platformRole: PlatformRole.USER,
      })
      .sort({ isSystemRole: -1, name: 1 })
      .lean()
      .exec();

    return roles.map((r) => ({
      id: r._id.toString(),
      name: r.name,
      slug: r.slug,
      description: r.description,
      accountType: r.accountType,
      isSystemRole: r.isSystemRole,
      isActive: r.isActive,
    }));
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

    if (role.slug === 'super-admin' || role.permissions.includes('*')) {
      throw new ForbiddenException('Core Super Admin role is protected and cannot be deleted.');
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
    }).catch(() => {});

    return { success: true, message: `Role "${role.name}" deleted successfully.` };
  }

  async bulkDeleteRoles(ids: string[], actorUser: any): Promise<any> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('No role IDs provided for deletion.');
    }

    let deletedCount = 0;
    const errors: string[] = [];

    for (const id of ids) {
      try {
        const role = await this.roleModel.findById(id);
        if (!role) continue;
        if (role.slug === 'super-admin' || role.permissions.includes('*')) {
          errors.push(`Role "${role.name}" is protected and cannot be deleted.`);
          continue;
        }
        await this.roleModel.findByIdAndDelete(id);
        deletedCount++;
        await this.auditLogModel.create({
          action: 'ROLE_DELETED',
          actorUserId: actorUser?.id || 'SYSTEM',
          actorName: actorUser?.name || 'Administrator',
          actorRole: actorUser?.platformRole || actorUser?.role || 'SUPER_ADMIN',
          targetEntity: 'ROLE',
          targetEntityId: id,
          metadata: { roleId: id, name: role.name },
          timestamp: new Date(),
        }).catch(() => {});
      } catch (err: any) {
        errors.push(`Role ${id}: ${err.message}`);
      }
    }

    return {
      success: true,
      message: `Deleted ${deletedCount} role(s) successfully.${errors.length ? ' Some protected roles were skipped.' : ''}`,
      deletedCount,
      errors,
    };
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
    if (actorUser?.platformRole !== PlatformRole.SUPER_ADMIN && actorUser?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admins can manage subscription packages.');
    }

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
    if (actorUser?.platformRole !== PlatformRole.SUPER_ADMIN && actorUser?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admins can manage subscription packages.');
    }

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
    if (dto.eligibleUserTypes !== undefined) pkg.eligibleUserTypes = dto.eligibleUserTypes;
    if (dto.durationPrices !== undefined) pkg.durationPrices = dto.durationPrices as any;
    if (dto.isFree !== undefined) pkg.isFree = dto.isFree;
    if (dto.recommended !== undefined) pkg.recommended = dto.recommended;
    if (dto.displayOrder !== undefined) pkg.displayOrder = dto.displayOrder;
    if (dto.freeTrialMaxSlots !== undefined) pkg.freeTrialMaxSlots = dto.freeTrialMaxSlots;
    if (dto.freeTrialClaimedSlots !== undefined) pkg.freeTrialClaimedSlots = dto.freeTrialClaimedSlots;
    if (dto.features) pkg.features = dto.features;
    if (dto.whatsappNumber !== undefined) pkg.whatsappNumber = dto.whatsappNumber;
    if (dto.callNumber !== undefined) pkg.callNumber = dto.callNumber;
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
    if (actorUser?.platformRole !== PlatformRole.SUPER_ADMIN && actorUser?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admins can manage subscription packages.');
    }

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

    // 1. Super Admin is always unrestricted and free from billing, subscription plans, and trials
    const userRole = String(user.role || '').toUpperCase();
    const userPlatformRole = String(user.platformRole || '').toUpperCase();
    const userAccountType = String(user.accountType || '').toUpperCase();

    if (
      userPlatformRole === PlatformRole.SUPER_ADMIN ||
      userRole === UserRole.SUPER_ADMIN ||
      userPlatformRole === PlatformRole.ADMIN ||
      userRole === UserRole.ADMIN
    ) {
      return {
        platformRole: user.platformRole || PlatformRole.SUPER_ADMIN,
        accountType: null,
        dataScope: DataScope.ALL,
        permissions: ['*'],
        limits: {
          propertyViews: -1,
          propertyListings: -1,
          savedProperties: -1,
          savedSearches: -1,
          monthlyLeads: -1,
          enquiries: -1,
          chats: -1,
          teamMembers: -1,
        },
        usage: { propertyViews: 0, propertyListings: 0, monthlyLeads: 0, enquiries: 0, chats: 0 },
        dashboardConfig: {
          overview: true,
          properties: true,
          leads: true,
          enquiries: true,
          chat: true,
          crm: true,
          siteVisits: true,
          analytics: true,
          reviews: true,
          promotions: true,
          profile: true,
        },
        package: null,
        subscription: null,
        trial: {
          isTrialActive: false,
          isTrialExpired: false,
          trialExpiresAt: null,
          daysRemaining: 0,
          trialPackageId: null,
        },
      };
    }

    // 2. Property Buyers and Rental Tenants access the marketplace directly without trial, subscription, or billing restrictions
    const isConsumer =
      ['BUYER', 'TENANT', 'PURCHASER'].includes(userRole) ||
      ['BUYER', 'TENANT'].includes(userAccountType);

    if (isConsumer) {
      return {
        platformRole: user.platformRole || PlatformRole.USER,
        accountType: user.accountType || (userRole === 'TENANT' ? AccountType.TENANT : AccountType.BUYER),
        role: { id: 'consumer-role', name: 'Marketplace Consumer', slug: userRole.toLowerCase() },
        dataScope: DataScope.OWN,
        permissions: [
          Permission.PROPERTY_VIEW,
          Permission.PROPERTY_CONTACT_VIEW,
          Permission.ENQUIRY_CREATE,
          Permission.ENQUIRY_VIEW,
          Permission.CHAT_START,
          Permission.CHAT_REPLY,
          Permission.CHAT_VIEW,
        ],
        limits: {
          propertyViews: -1,
          propertyListings: 0,
          savedProperties: -1,
          savedSearches: -1,
          monthlyLeads: 0,
          enquiries: -1,
          chats: -1,
          teamMembers: 1,
        },
        usage: { propertyViews: 0, propertyListings: 0, monthlyLeads: 0, enquiries: 0, chats: 0 },
        dashboardConfig: {
          overview: true,
          properties: false,
          leads: false,
          enquiries: true,
          chat: true,
          crm: false,
          siteVisits: true,
          analytics: false,
          reviews: false,
          promotions: false,
          profile: true,
        },
        package: null,
        subscription: null,
        trial: {
          isTrialActive: false,
          isTrialExpired: false,
          trialExpiresAt: null,
          daysRemaining: 0,
          trialPackageId: null,
        },
      };
    }

    // 3. Resolve Role (Custom Role or Default System Role)
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

      // If user is a broker/builder employee, inherit company/broker subscription
      if (!subscriptionDoc && (user.brokerId || user.parentUserId || user.agencyId)) {
        const brokerId = user.brokerId || user.parentUserId || user.agencyId;
        subscriptionDoc = await this.subscriptionModel.findOne({
          $or: [
            { userId: brokerId },
            { companyId: brokerId },
          ],
          status: { $in: ['ACTIVE', 'TRIAL'] },
          endDate: { $gte: new Date() },
        }).sort({ createdAt: -1 }).lean().exec();
      }

      if (subscriptionDoc?.packageId && isValidObjectId(subscriptionDoc.packageId)) {
        packageDoc = await this.packageModel.findById(subscriptionDoc.packageId).lean().exec();
      }
    }

    const isTrialValid = Boolean(user.trialExpiresAt && new Date() <= new Date(user.trialExpiresAt) && user.isTrialActive);
    if (!packageDoc && user.activePackageId && isValidObjectId(user.activePackageId) && isTrialValid) {
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
      propertyViews: 10, propertyListings: 0, projectListings: 0, savedProperties: 5, savedSearches: 2, monthlyLeads: 10, enquiries: 5, chats: 10, teamMembers: 1,
    };

    // 4. Combine Permissions: Role + Package + User Granted - User Denied
    const granted = user.grantedPermissions || [];
    const denied = new Set(user.deniedPermissions || []);

    const combined = new Set<string>();
    for (const p of rolePermissions) combined.add(p);

    // Only inherit supplemental package permissions if user does NOT have an explicit custom role,
    // and only if package is an upgraded active subscription package (not a default fallback)
    if (!customRoleId && packageDoc && !packageDoc.isDefault && subscriptionDoc) {
      for (const p of packagePermissions) combined.add(p);
    }

    for (const p of granted) combined.add(p);

    // If user is a Broker, Agent, Developer, or Broker Employee, ensure core domain permissions are present
    const isBrokerOrAgent =
      ['BROKER', 'AGENT', 'DEVELOPER', 'BROKER_AGENT'].includes(userRole) ||
      ['BROKER', 'AGENT', 'DEVELOPER', 'BROKER_AGENT'].includes(userAccountType);
    if (isBrokerOrAgent) {
      const brokerDomainPermissions = [
        Permission.PROPERTY_VIEW,
        Permission.PROPERTY_CREATE,
        Permission.PROPERTY_EDIT,
        Permission.PROPERTY_PUBLISH,
        Permission.PROJECT_VIEW,
        Permission.PROJECT_CREATE,
        Permission.PROJECT_EDIT,
        Permission.PROJECT_MANAGE,
        Permission.REEL_VIEW,
        Permission.REEL_CREATE,
        Permission.REEL_EDIT,
        Permission.REEL_DELETE,
        Permission.LEAD_VIEW,
        Permission.LEAD_CREATE,
        Permission.LEAD_EDIT,
        Permission.LEAD_ASSIGN,
        Permission.ENQUIRY_VIEW,
        Permission.ENQUIRY_MANAGE,
        Permission.CRM_VIEW,
        Permission.CRM_CREATE,
        Permission.CRM_EDIT,
        Permission.CRM_FOLLOWUP,
        Permission.CHAT_VIEW,
        Permission.CHAT_START,
        Permission.CHAT_REPLY,
        Permission.SITE_VISIT_VIEW,
        Permission.SITE_VISIT_MANAGE,
        Permission.ANALYTICS_VIEW,
      ];
      for (const perm of brokerDomainPermissions) {
        combined.add(perm);
      }
    }

    const effectivePermissions = Array.from(combined).filter((p) => !denied.has(p));

    // Dynamic alignment of dashboard navigation with resolved permissions
    const hasPerm = (p: string) =>
      effectivePermissions.includes('*') ||
      effectivePermissions.includes(p) ||
      (p.includes(':') && effectivePermissions.includes(`${p.split(':')[0]}:*`));

    const finalDashboardConfig = {
      overview: dashboardConfig.overview !== false,
      properties: Boolean(dashboardConfig.properties && (hasPerm(Permission.PROPERTY_VIEW) || hasPerm(Permission.PROPERTY_CREATE))),
      leads: Boolean(dashboardConfig.leads && hasPerm(Permission.LEAD_VIEW)),
      enquiries: Boolean(dashboardConfig.enquiries && (hasPerm(Permission.ENQUIRY_VIEW) || hasPerm(Permission.ENQUIRY_CREATE) || hasPerm(Permission.ENQUIRY_MANAGE))),
      chat: Boolean(dashboardConfig.chat && (hasPerm(Permission.CHAT_VIEW) || hasPerm(Permission.CHAT_START) || hasPerm(Permission.CHAT_REPLY))),
      crm: Boolean(dashboardConfig.crm && hasPerm(Permission.CRM_VIEW)),
      siteVisits: Boolean(dashboardConfig.siteVisits && hasPerm(Permission.SITE_VISIT_VIEW)),
      analytics: Boolean(dashboardConfig.analytics && hasPerm(Permission.ANALYTICS_VIEW)),
      reviews: Boolean(dashboardConfig.reviews && hasPerm(Permission.REVIEW_VIEW)),
      promotions: Boolean(dashboardConfig.promotions && (hasPerm(Permission.PROMOTION_VIEW) || hasPerm(Permission.PROMOTION_CREATE))),
      profile: dashboardConfig.profile !== false,
    };

    // 5. Combine Limits with Bonus Credits
    const bonus = user.bonusLimits || {};
    const effectiveLimits = {
      propertyViews: packageLimits.propertyViews === -1 ? -1 : (packageLimits.propertyViews || 0) + (bonus.propertyViews || 0),
      propertyListings: packageLimits.propertyListings === -1 ? -1 : (packageLimits.propertyListings || 0) + (bonus.propertyListings || 0),
      projectListings: packageLimits.projectListings === -1 ? -1 : (packageLimits.projectListings || 0) + (bonus.projectListings || 0),
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
      dashboardConfig: finalDashboardConfig,
      package: packageDoc ? { id: packageDoc._id.toString(), name: packageDoc.name, slug: packageDoc.slug, price: packageDoc.price, billingPeriod: packageDoc.billingPeriod } : null,
      subscription: subscriptionDoc ? { id: subscriptionDoc._id.toString(), status: subscriptionDoc.status, endDate: subscriptionDoc.endDate } : null,
      trial: {
        isTrialActive: !subscriptionDoc && Boolean(user.trialExpiresAt && new Date() <= new Date(user.trialExpiresAt)),
        isTrialExpired: !subscriptionDoc && Boolean(user.trialExpiresAt && new Date() > new Date(user.trialExpiresAt)),
        trialExpiresAt: user.trialExpiresAt || null,
        daysRemaining: !subscriptionDoc && user.trialExpiresAt
          ? Math.max(0, Math.ceil((new Date(user.trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : 0,
        trialPackageId: user.trialPackageId || null,
      },
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

    const userRole = String(user.role || '').toUpperCase();
    const userPlatformRole = String(user.platformRole || '').toUpperCase();
    const userAccountType = String(user.accountType || '').toUpperCase();

    // Super Admin / Platform Admin and Property Buyers / Rental Tenants have direct infinite marketplace access without view limits
    const isExempt =
      userPlatformRole === PlatformRole.SUPER_ADMIN ||
      userPlatformRole === PlatformRole.ADMIN ||
      userRole === UserRole.SUPER_ADMIN ||
      userRole === UserRole.ADMIN ||
      ['BUYER', 'TENANT', 'PURCHASER'].includes(userRole) ||
      ['BUYER', 'TENANT'].includes(userAccountType);

    if (isExempt) {
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
      agencyName: raw.advertiser.agencyName,
      phone: null,
      whatsapp: null,
      email: null,
      contactNumbers: [],
      hasPhone: Boolean(raw.advertiser.phone || (raw.advertiser.contactNumbers && raw.advertiser.contactNumbers.length > 0)),
    } : null;

    return {
      ...raw,
      advertiser: sanitizedAdvertiser,
      contactNumbers: [],
      owner: null,
      contactLocked: true,
      whatsappUrl: null,
      contactMessage: 'Please Sign In or Create an Account to continue.',
    };
  }

  // ==========================================
  // 9. THREE-DAY PLAN TRIAL ACTIVATION
  // ==========================================

  async startTrial(userId: string, packageId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found.');

    const userRole = String(user.role || '').toUpperCase();
    const userPlatformRole = String(user.platformRole || '').toUpperCase();
    const userAccountType = String(user.accountType || '').toUpperCase();

    const isExempt =
      userPlatformRole === PlatformRole.SUPER_ADMIN ||
      userPlatformRole === PlatformRole.ADMIN ||
      userRole === UserRole.SUPER_ADMIN ||
      userRole === UserRole.ADMIN ||
      ['BUYER', 'TENANT', 'PURCHASER'].includes(userRole) ||
      ['BUYER', 'TENANT'].includes(userAccountType);

    if (isExempt) {
      throw new BadRequestException(
        'Billing, subscription plans, and free trial options are not applicable to your account. You have direct unrestricted marketplace access.',
      );
    }

    // Do not restart trial by logging out, signing in again, refreshing, or creating duplicate requests
    if (
      user.trialStartedAt ||
      user.trialUsed ||
      user.trialExpired ||
      (user.trialExpiresAt && new Date(user.trialExpiresAt).getTime() <= Date.now())
    ) {
      throw new BadRequestException(
        'Free trial has already been used or expired for this account. Free trial cannot be restarted.',
      );
    }

    if (user.isTrialActive && user.trialExpiresAt && new Date(user.trialExpiresAt).getTime() > Date.now()) {
      throw new BadRequestException('Your 3-day free trial is already active.');
    }

    const pkg = await this.packageModel.findById(packageId);
    if (!pkg) throw new NotFoundException('Selected pricing plan was not found.');
    if (!pkg.isActive) throw new BadRequestException('This plan is currently not active.');

    const trialDays = 3;
    const now = new Date();
    const trialExpiresAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    user.activePackageId = pkg._id.toString();
    user.trialPackageId = pkg._id.toString();
    user.trialStartedAt = now;
    user.trialExpiresAt = trialExpiresAt;
    user.isTrialActive = true;
    await user.save();

    // Create or update 3-day active trial subscription record
    await this.subscriptionModel.findOneAndUpdate(
      { userId },
      {
        userId,
        plan: pkg.name || 'FREE_TRIAL',
        status: 'TRIAL',
        startDate: now,
        endDate: trialExpiresAt,
        metadata: {
          packageId: pkg._id.toString(),
          packageName: pkg.name,
          trialDays,
          isTrial: true,
        },
      },
      { upsert: true, new: true },
    );

    this.logger.log(
      `🎉 3-Day Free Trial activated for user ${user.name} (${user.mobile}) on package "${pkg.name}". Expires: ${trialExpiresAt.toISOString()}`,
    );

    const entitlements = await this.resolveUserEntitlements(user);

    return {
      success: true,
      message: `3-Day Free Trial activated for "${pkg.name}". You now have full platform access!`,
      trialExpiresAt: trialExpiresAt.toISOString(),
      daysRemaining: 3,
      package: {
        id: pkg._id.toString(),
        name: pkg.name,
        price: pkg.price,
        limits: pkg.limits,
      },
      entitlements,
    };
  }

  // ==========================================
  // DYNAMIC PRICING & 3-MONTH FREE TRIAL
  // ==========================================

  async getDynamicPricingPlans(userType?: string, durationMonths = 1) {
    const rawUserType = (userType || '').toLowerCase().trim();
    const isConsumer =
      rawUserType === 'buyer' ||
      rawUserType === 'tenant' ||
      rawUserType === 'purchaser' ||
      rawUserType === 'buyer / tenant';

    if (isConsumer) {
      return {
        success: true,
        userType: rawUserType || 'buyer',
        isConsumer: true,
        message: 'Buyers and Tenants enjoy free, unlimited property browsing and direct inquiries on My Property.',
        plans: [],
        freeTrialStatus: null,
      };
    }

    const freePkg = await this.packageModel
      .findOne({ $or: [{ slug: 'casa-free-trial' }, { isFree: true }] })
      .lean()
      .exec();

    const maxSlots = freePkg?.freeTrialMaxSlots || 50;
    const claimedSlots = freePkg?.freeTrialClaimedSlots || 0;
    const remainingSlots = Math.max(0, maxSlots - claimedSlots);

    const freeTrialStatus = {
      maxSlots,
      claimedSlots,
      remainingSlots,
      isAvailable: claimedSlots < maxSlots,
      durationDays: 90,
      validity: '3 Months Free',
    };

    const allPackages = await this.packageModel
      .find({ isActive: true })
      .sort({ displayOrder: 1, price: 1 })
      .lean()
      .exec();

    const normalizedReqType = rawUserType.replace(/[^a-z0-9]/g, '');

    const plans = allPackages
      .filter((pkg) => {
        if (!normalizedReqType) return true;
        let hasFilterCriteria = false;
        // Check eligible user types
        if (Array.isArray(pkg.eligibleUserTypes) && pkg.eligibleUserTypes.length > 0) {
          hasFilterCriteria = true;
          const match = pkg.eligibleUserTypes.some((t: string) => {
            const cleanT = t.toLowerCase().replace(/[^a-z0-9]/g, '');
            return (
              cleanT.includes(normalizedReqType) ||
              normalizedReqType.includes(cleanT) ||
              (normalizedReqType.includes('builder') && cleanT.includes('developer')) ||
              (normalizedReqType.includes('developer') && cleanT.includes('builder'))
            );
          });
          if (match) return true;
        }
        // Check target account types
        if (Array.isArray(pkg.targetAccountTypes) && pkg.targetAccountTypes.length > 0) {
          hasFilterCriteria = true;
          const match = pkg.targetAccountTypes.some((t: string) => {
            const cleanT = t.toLowerCase().replace(/[^a-z0-9]/g, '');
            return (
              cleanT.includes(normalizedReqType) ||
              normalizedReqType.includes(cleanT) ||
              cleanT === 'all' ||
              (normalizedReqType.includes('builder') && cleanT.includes('developer'))
            );
          });
          if (match) return true;
        }
        return !hasFilterCriteria;
      })
      .map((pkg) => {
        const isFree = Boolean(pkg.isFree || pkg.price === 0);

        if (isFree) {
          return {
            id: pkg._id.toString(),
            slug: pkg.slug,
            name: pkg.name,
            description: pkg.description,
            isFree: true,
            recommended: Boolean(pkg.recommended),
            displayOrder: pkg.displayOrder ?? 0,
            validityText: '3 Months Free',
            durationMonths: 3,
            durationDays: 90,
            price: 0,
            currency: pkg.currency || 'INR',
            monthlyEquivalent: 0,
            originalPrice: 0,
            savings: 0,
            discountPercentage: 0,
            limits: pkg.limits || {},
            features: pkg.features || [],
            whatsappNumber: pkg.whatsappNumber,
            callNumber: pkg.callNumber,
            freeTrial: {
              maxSlots: pkg.freeTrialMaxSlots || 50,
              claimedSlots: pkg.freeTrialClaimedSlots || 0,
              remainingSlots: Math.max(0, (pkg.freeTrialMaxSlots || 50) - (pkg.freeTrialClaimedSlots || 0)),
              isAvailable: (pkg.freeTrialClaimedSlots || 0) < (pkg.freeTrialMaxSlots || 50),
            },
          };
        }

        const dur = Number(durationMonths) || 1;
        let actualPrice = pkg.price * dur;
        let referenceMonthlyPrice = pkg.price;

        if (Array.isArray(pkg.durationPrices) && pkg.durationPrices.length > 0) {
          const match = pkg.durationPrices.find(
            (dp: any) => Number(dp.durationMonths) === dur && dp.isActive !== false,
          );
          if (match) {
            actualPrice = match.amount;
            referenceMonthlyPrice = match.referenceMonthlyPrice || pkg.price;
          }
        }

        const referenceTotal = referenceMonthlyPrice * dur;
        const savings = Math.max(0, referenceTotal - actualPrice);
        const discountPercentage = referenceTotal > 0 ? Math.round((savings / referenceTotal) * 100) : 0;
        const monthlyEquivalent = Math.round(actualPrice / dur);

        return {
          id: pkg._id.toString(),
          slug: pkg.slug,
          name: pkg.name,
          description: pkg.description,
          isFree: false,
          recommended: Boolean(pkg.recommended),
          displayOrder: pkg.displayOrder ?? 1,
          selectedDurationMonths: dur,
          price: actualPrice,
          currency: pkg.currency || 'INR',
          monthlyEquivalent,
          referenceMonthlyPrice,
          originalPrice: referenceTotal,
          savings,
          discountPercentage,
          limits: pkg.limits || {},
          features: pkg.features || [],
          durationPrices: pkg.durationPrices || [],
          whatsappNumber: pkg.whatsappNumber,
          callNumber: pkg.callNumber,
        };
      });

    return {
      success: true,
      userType: rawUserType || 'all',
      durationMonths: Number(durationMonths) || 1,
      freeTrialStatus,
      plans,
    };
  }

  async claimFreeTrialSubscription(userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 1. Verify user type eligibility: Only Builder/Developer, Broker, Agent can claim
    const userRole = String(user.role || '').toUpperCase();
    const userAccountType = String(user.accountType || '').toUpperCase();
    const isEligibleUserType =
      ['DEVELOPER', 'BUILDER'].includes(userRole) ||
      ['DEVELOPER', 'BUILDER'].includes(userAccountType) ||
      ['BROKER', 'BROKER_AGENCY'].includes(userRole) ||
      ['BROKER', 'BROKER_AGENCY'].includes(userAccountType) ||
      ['AGENT', 'BROKER_AGENT'].includes(userRole) ||
      ['AGENT', 'BROKER_AGENT'].includes(userAccountType);

    if (!isEligibleUserType) {
      throw new ForbiddenException(
        'The introductory 3-month free trial is exclusively available to Builders / Developers, Brokers, and Agents.',
      );
    }

    if (user.isTrialActive) {
      throw new BadRequestException('You already have an active trial.');
    }

    if (user.trialUsed) {
      throw new BadRequestException('You have already used your introductory free trial.');
    }

    // 2. Company-level eligibility: Check if parent company or agency already used trial or has active subscription
    const companyId = user.brokerId || user.parentUserId || user.agencyId;
    if (companyId) {
      const companyParent = await this.userModel.findById(companyId);
      if (companyParent?.trialUsed || companyParent?.isTrialActive) {
        throw new BadRequestException(
          'Your company / parent agency has already utilized or claimed the introductory free trial.',
        );
      }
      const companySub = await this.subscriptionModel.findOne({
        $or: [{ userId: companyId }, { companyId }],
        status: { $in: ['ACTIVE', 'TRIAL'] },
        endDate: { $gte: new Date() },
      });
      if (companySub) {
        throw new BadRequestException(
          'Your company / parent agency already has an active subscription or trial in place.',
        );
      }
    }

    const existingSub = await this.subscriptionModel.findOne({
      userId,
      status: { $in: ['ACTIVE', 'TRIAL'] },
      endDate: { $gte: new Date() },
    });
    if (existingSub) {
      throw new BadRequestException('You already have an active subscription on your account.');
    }

    const freePkg = await this.packageModel.findOne({
      $or: [{ slug: 'casa-free-trial' }, { isFree: true }],
    });
    if (!freePkg) {
      throw new NotFoundException('Introductory Free Plan is currently not available.');
    }

    const maxSlots = freePkg.freeTrialMaxSlots || 50;
    const claimedSlots = freePkg.freeTrialClaimedSlots || 0;
    if (claimedSlots >= maxSlots) {
      throw new BadRequestException('All 50 introductory free trial slots have been claimed.');
    }

    // 3. Atomic user lock to prevent concurrent duplicate claims by the same account
    const lockedUser = await this.userModel.findOneAndUpdate(
      {
        _id: user._id,
        trialUsed: { $ne: true },
        isTrialActive: { $ne: true },
      },
      {
        $set: {
          isTrialActive: true,
          trialUsed: true,
        },
      },
      { new: true },
    );

    if (!lockedUser) {
      throw new BadRequestException('You have already used or are currently claiming your introductory free trial.');
    }

    // 4. Atomic slot reservation
    const updatedPkg = await this.packageModel.findOneAndUpdate(
      {
        _id: freePkg._id,
        freeTrialClaimedSlots: { $lt: maxSlots },
      },
      { $inc: { freeTrialClaimedSlots: 1 } },
      { new: true },
    );

    if (!updatedPkg) {
      // Rollback user lock if slots became full
      await this.userModel.findByIdAndUpdate(userId, {
        $set: { isTrialActive: false, trialUsed: false },
      });
      throw new BadRequestException('All 50 introductory free trial slots have been claimed.');
    }

    try {
      const startDate = new Date();
      const durationDays = freePkg.durationDays || 90;
      const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const sub = await this.subscriptionModel.create({
        userId,
        packageId: freePkg._id.toString(),
        companyId: companyId || undefined,
        accountType: user.accountType,
        plan: 'FREE_TRIAL',
        status: 'TRIAL',
        durationMonths: 3,
        amountPaid: 0,
        currency: 'INR',
        startDate,
        endDate,
        metadata: {
          packageName: freePkg.name,
          packageSlug: freePkg.slug,
          isIntroductoryTrial: true,
        },
      });

      lockedUser.activePackageId = freePkg._id.toString();
      lockedUser.activeSubscriptionId = sub._id.toString();
      lockedUser.trialStartedAt = startDate;
      lockedUser.trialExpiresAt = endDate;
      lockedUser.trialPackageId = freePkg._id.toString();
      await lockedUser.save();

      await this.auditLogModel.create({
        action: 'FREE_TRIAL_CLAIMED',
        actorUserId: userId,
        actorName: user.name || 'User',
        actorRole: user.role,
        targetEntity: 'SUBSCRIPTION',
        targetEntityId: sub._id.toString(),
        metadata: {
          claimedSlots: updatedPkg.freeTrialClaimedSlots,
          remainingSlots: Math.max(0, maxSlots - updatedPkg.freeTrialClaimedSlots),
        },
        timestamp: new Date(),
      });

      return {
        success: true,
        message: 'Congratulations! Your 3-Month Free Plan is now active.',
        subscription: sub,
        remainingSlots: Math.max(0, maxSlots - updatedPkg.freeTrialClaimedSlots),
      };
    } catch (err: any) {
      // Rollback slot and user state if subscription creation fails
      await this.packageModel.findByIdAndUpdate(freePkg._id, {
        $inc: { freeTrialClaimedSlots: -1 },
      });
      await this.userModel.findByIdAndUpdate(userId, {
        $set: { isTrialActive: false, trialUsed: false },
      });
      throw err;
    }
  }

  async getFreeTrialStatus() {
    const freePkg = await this.packageModel
      .findOne({ $or: [{ slug: 'casa-free-trial' }, { isFree: true }] })
      .lean()
      .exec();

    const maxSlots = freePkg?.freeTrialMaxSlots || 50;
    const claimedSlots = freePkg?.freeTrialClaimedSlots || 0;
    const remainingSlots = Math.max(0, maxSlots - claimedSlots);

    return {
      success: true,
      maxSlots,
      claimedSlots,
      remainingSlots,
      isAvailable: claimedSlots < maxSlots,
      durationDays: freePkg?.durationDays || 90,
      validity: '3 Months Free',
    };
  }

  async configureFreeTrial(
    dto: { maxSlots?: number; resetClaimed?: boolean },
    actorUser: any,
  ) {
    if (
      actorUser?.platformRole !== PlatformRole.SUPER_ADMIN &&
      actorUser?.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only Super Admins can configure free trial slots.');
    }

    const freePkg = await this.packageModel.findOne({
      $or: [{ slug: 'casa-free-trial' }, { isFree: true }],
    });
    if (!freePkg) {
      throw new NotFoundException('Introductory Free Plan not found.');
    }

    if (dto.maxSlots !== undefined) {
      freePkg.freeTrialMaxSlots = Number(dto.maxSlots);
    }
    if (dto.resetClaimed) {
      freePkg.freeTrialClaimedSlots = 0;
    }
    await freePkg.save();

    return {
      success: true,
      message: 'Free trial configuration updated successfully.',
      freeTrialStatus: {
        maxSlots: freePkg.freeTrialMaxSlots,
        claimedSlots: freePkg.freeTrialClaimedSlots,
        remainingSlots: Math.max(
          0,
          (freePkg.freeTrialMaxSlots || 50) - (freePkg.freeTrialClaimedSlots || 0),
        ),
      },
    };
  }
}

