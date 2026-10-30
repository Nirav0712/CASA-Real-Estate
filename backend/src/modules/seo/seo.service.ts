import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import {
  SeoMetadata,
  SeoMetadataDocument,
  SeoSettings,
  SeoSettingsDocument,
  SeoRedirect,
  SeoRedirectDocument,
  SeoAuditIssue,
  SeoAuditIssueDocument,
  SeoEntityType,
  SeoApprovalStatus,
  SeoGenerationMode,
  SeoGenerationStatus,
  SeoIssueSeverity,
} from './schemas/seo.schema';
import { SeoGeneratorService, PropertySourceData } from './seo-generator.service';
import { UpdateSeoMetadataDto } from './dto/update-seo-metadata.dto';
import { UpdateSeoSettingsDto } from './dto/update-seo-settings.dto';
import { SeoMetadataQueryDto, CreateRedirectDto } from './dto/seo-query.dto';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { Category, CategoryDocument } from '../properties/schemas/category.schema';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class SeoService implements OnModuleInit {
  private readonly logger = new Logger(SeoService.name);

  constructor(
    @InjectModel(SeoMetadata.name)
    private readonly seoMetadataModel: Model<SeoMetadataDocument>,
    @InjectModel(SeoSettings.name)
    private readonly seoSettingsModel: Model<SeoSettingsDocument>,
    @InjectModel(SeoRedirect.name)
    private readonly seoRedirectModel: Model<SeoRedirectDocument>,
    @InjectModel(SeoAuditIssue.name)
    private readonly seoAuditIssueModel: Model<SeoAuditIssueDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    private readonly seoGeneratorService: SeoGeneratorService,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureSettingsInitialized();
      await this.initDefaultPagesAndLocations();
    } catch (err: any) {
      this.logger.warn(`SEO Module initialization warning: ${err?.message}`);
    }
  }

  // ==========================================
  // SETTINGS MANAGEMENT
  // ==========================================

  async getSettings(): Promise<SeoSettingsDocument> {
    let settings: any = await this.seoSettingsModel.findOne().exec();
    if (!settings) {
      settings = await this.ensureSettingsInitialized();
    }
    return settings;
  }

  async ensureSettingsInitialized(): Promise<SeoSettingsDocument> {
    let settings: any = await this.seoSettingsModel.findOne().exec();
    if (!settings) {
      settings = await this.seoSettingsModel.create({
        websiteName: 'MyProperty Real Estate Marketplace',
        productionDomain: process.env.NEXT_PUBLIC_SITE_URL || 'https://casa-real-estate-mocha.vercel.app',
        defaultTitleSuffix: '| MyProperty',
        defaultDescription:
          'Explore verified real estate properties to buy, rent, and invest across India with MyProperty Marketplace.',
        defaultOgImage: 'https://casa-real-estate-mocha.vercel.app/og-image.jpg',
        defaultLocale: 'en',
      });
      this.logger.log('Default SEO settings initialized successfully.');
    }
    return settings;
  }

  async updateSettings(
    dto: UpdateSeoSettingsDto,
    user?: AuthenticatedUser,
  ): Promise<SeoSettingsDocument> {
    const settings = await this.getSettings();

    if (dto.websiteName !== undefined) settings.websiteName = dto.websiteName;
    if (dto.productionDomain !== undefined) {
      settings.productionDomain = dto.productionDomain.replace(/\/$/, '');
    }
    if (dto.defaultTitleSuffix !== undefined) settings.defaultTitleSuffix = dto.defaultTitleSuffix;
    if (dto.defaultDescription !== undefined) settings.defaultDescription = dto.defaultDescription;
    if (dto.defaultOgImage !== undefined) settings.defaultOgImage = dto.defaultOgImage;
    if (dto.defaultLocale !== undefined) settings.defaultLocale = dto.defaultLocale;

    if (dto.templates) {
      settings.templates = {
        ...settings.templates,
        ...dto.templates,
      };
    }

    if (dto.automation) {
      settings.automation = {
        ...settings.automation,
        ...dto.automation,
      };
    }

    if (dto.indexing) {
      settings.indexing = {
        ...settings.indexing,
        ...dto.indexing,
      };
    }

    if (dto.sitemap) {
      settings.sitemap = {
        ...settings.sitemap,
        ...dto.sitemap,
      };
    }

    if (dto.robotsTxt) {
      settings.robotsTxt = {
        ...settings.robotsTxt,
        ...dto.robotsTxt,
      };
    }

    const updated = await settings.save();
    this.logger.log(`SEO settings updated by user ${user?.id || 'SYSTEM'}`);
    return updated;
  }

  // ==========================================
  // METADATA CRUD & QUERY
  // ==========================================

  async getMetadataList(query: SeoMetadataQueryDto) {
    const {
      entityType,
      approvalStatus,
      search,
      page = 1,
      limit = 20,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = query;

    const filter: Record<string, any> = {};

    if (entityType) {
      filter.entityType = entityType;
    }
    if (approvalStatus) {
      filter.approvalStatus = approvalStatus;
    }
    if (search) {
      filter.$or = [
        { metaTitle: { $regex: search, $options: 'i' } },
        { metaDescription: { $regex: search, $options: 'i' } },
        { pagePath: { $regex: search, $options: 'i' } },
        { focusKeyword: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, any> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      this.seoMetadataModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.seoMetadataModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getMetadataById(id: string): Promise<SeoMetadataDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid SEO Metadata ID format');
    }
    const item = await this.seoMetadataModel.findById(id).exec();
    if (!item) {
      throw new NotFoundException(`SEO Metadata record with ID ${id} not found`);
    }
    return item;
  }

  async updateMetadata(
    id: string,
    dto: UpdateSeoMetadataDto,
    user?: AuthenticatedUser,
  ): Promise<SeoMetadataDocument> {
    const existing = await this.getMetadataById(id);

    // Update field locks if provided
    if (dto.fieldLocks) {
      existing.fieldLocks = {
        ...existing.fieldLocks,
        ...dto.fieldLocks,
      };
    }

    // Apply manual overrides
    if (dto.metaTitle !== undefined) {
      existing.metaTitle = dto.metaTitle;
      existing.fieldLocks.metaTitle = true;
    }
    if (dto.metaDescription !== undefined) {
      existing.metaDescription = dto.metaDescription;
      existing.fieldLocks.metaDescription = true;
    }
    if (dto.focusKeyword !== undefined) existing.focusKeyword = dto.focusKeyword;
    if (dto.relatedKeywords !== undefined) existing.relatedKeywords = dto.relatedKeywords;
    if (dto.canonicalUrl !== undefined) {
      existing.canonicalUrl = dto.canonicalUrl;
      existing.fieldLocks.canonicalUrl = true;
    }
    if (dto.robotsIndex !== undefined) existing.robotsIndex = dto.robotsIndex;
    if (dto.robotsFollow !== undefined) existing.robotsFollow = dto.robotsFollow;

    if (dto.openGraphTitle !== undefined || dto.openGraphDescription !== undefined || dto.openGraphImage !== undefined) {
      if (dto.openGraphTitle !== undefined) existing.openGraphTitle = dto.openGraphTitle;
      if (dto.openGraphDescription !== undefined) existing.openGraphDescription = dto.openGraphDescription;
      if (dto.openGraphImage !== undefined) existing.openGraphImage = dto.openGraphImage;
      existing.fieldLocks.openGraph = true;
    }

    if (dto.twitterCardType !== undefined) existing.twitterCardType = dto.twitterCardType;

    if (dto.structuredData !== undefined) {
      existing.structuredData = dto.structuredData;
      existing.fieldLocks.structuredData = true;
    }

    if (dto.approvalStatus !== undefined) {
      existing.approvalStatus = dto.approvalStatus;
      if (dto.approvalStatus === SeoApprovalStatus.APPROVED) {
        existing.approvedBy = user?.id || 'ADMIN';
        existing.approvedAt = new Date();
      }
    }

    existing.generationMode = dto.generationMode || SeoGenerationMode.MANUAL;

    // Recalculate SEO quality score with updated attributes
    const { score, errors } = this.seoGeneratorService.calculateQualityScore({
      metaTitle: existing.metaTitle,
      metaDescription: existing.metaDescription,
      canonicalUrl: existing.canonicalUrl,
      focusKeyword: existing.focusKeyword,
      ogImage: existing.openGraphImage,
      hasStructuredData: Boolean(existing.structuredData),
      robotsIndex: existing.robotsIndex,
    });

    existing.seoScore = score;
    existing.validationErrors = errors;
    existing.lastAuditedAt = new Date();

    return existing.save();
  }

  async approveMetadata(id: string, user?: AuthenticatedUser): Promise<SeoMetadataDocument> {
    const item = await this.getMetadataById(id);
    item.approvalStatus = SeoApprovalStatus.APPROVED;
    item.approvedBy = user?.id || 'SUPER_ADMIN';
    item.approvedAt = new Date();
    return item.save();
  }

  async rejectMetadata(id: string, reason: string, user?: AuthenticatedUser): Promise<SeoMetadataDocument> {
    const item = await this.getMetadataById(id);
    item.approvalStatus = SeoApprovalStatus.REJECTED;
    item.validationErrors.push({
      code: 'REJECTED_BY_REVIEWER',
      message: reason || 'SEO metadata rejected during moderation review.',
      severity: SeoIssueSeverity.HIGH,
    });
    return item.save();
  }

  async regenerateMetadata(id: string): Promise<SeoMetadataDocument> {
    const item = await this.getMetadataById(id);
    const settings = await this.getSettings();

    if (item.entityType === SeoEntityType.PROPERTY && item.entityId) {
      const property = await this.propertyModel.findById(item.entityId).exec();
      if (!property) {
        throw new NotFoundException(`Linked property ${item.entityId} not found`);
      }

      const generated = this.seoGeneratorService.generatePropertySeo(
        this.extractPropertySource(property),
        settings,
        item.toObject(),
      );

      Object.assign(item, generated);
      item.generatedAt = new Date();
      item.generationStatus = SeoGenerationStatus.GENERATED;
      return item.save();
    }

    if (item.entityType === SeoEntityType.PAGE) {
      const pageTitle = item.slug ? item.slug.replace(/-/g, ' ') : 'Page';
      const generated = this.seoGeneratorService.generateStaticPageSeo(
        item.slug || 'page',
        pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1),
        item.metaDescription || settings.defaultDescription,
        item.pagePath,
        settings,
        item.toObject(),
      );

      Object.assign(item, generated);
      item.generatedAt = new Date();
      return item.save();
    }

    throw new BadRequestException(`Automated regeneration for entity type ${item.entityType} is not supported directly`);
  }

  // ==========================================
  // PROPERTY WORKFLOW INTEGRATION
  // ==========================================

  async syncPropertySeo(
    property: any,
    trigger: 'CREATE' | 'UPDATE' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'ARCHIVE',
    user?: AuthenticatedUser,
  ): Promise<SeoMetadataDocument | null> {
    try {
      const propId = property._id ? property._id.toString() : property.id;
      if (!propId) return null;

      const settings = await this.getSettings();
      const existing = await this.seoMetadataModel
        .findOne({ entityType: SeoEntityType.PROPERTY, entityId: propId })
        .exec();

      const source = this.extractPropertySource(property);
      const newSlug = source.slug || propId;

      // Detect slug changes to preserve canonical stability and generate 301 redirects
      if (existing && existing.slug && existing.slug !== newSlug) {
        await this.handleSlugChange(existing.slug, newSlug, 'PROPERTY', propId);
      }

      const generated = this.seoGeneratorService.generatePropertySeo(
        source,
        settings,
        existing ? existing.toObject() : undefined,
      );

      // Determine approval and indexing state based on property status
      const isApprovedOrPublished =
        property.status === 'PUBLISHED' ||
        property.status === 'APPROVED' ||
        trigger === 'APPROVE';

      const isRejected = property.status === 'REJECTED' || trigger === 'REJECT';
      const isArchived = property.status === 'ARCHIVED' || trigger === 'ARCHIVE';

      let approvalStatus = existing?.approvalStatus || SeoApprovalStatus.PENDING_APPROVAL;
      if (settings.automation?.approvalMode === 'AUTOMATIC' && isApprovedOrPublished) {
        approvalStatus = SeoApprovalStatus.APPROVED;
      } else if (isRejected) {
        approvalStatus = SeoApprovalStatus.REJECTED;
      }

      const shouldIndex =
        isApprovedOrPublished && !isRejected && !isArchived && property.isPublished !== false;

      const payload: Partial<SeoMetadata> = {
        ...generated,
        entityId: propId,
        slug: newSlug,
        pagePath: `/property/${newSlug}`,
        approvalStatus,
        robotsIndex: shouldIndex,
        generationStatus: isRejected ? SeoGenerationStatus.FAILED : SeoGenerationStatus.GENERATED,
      };

      if (approvalStatus === SeoApprovalStatus.APPROVED && !payload.approvedAt) {
        payload.approvedAt = new Date();
        payload.approvedBy = user?.id || 'AUTO_WORKFLOW';
      }

      const result = await this.seoMetadataModel.findOneAndUpdate(
        { entityType: SeoEntityType.PROPERTY, entityId: propId },
        { $set: payload },
        { new: true, upsert: true },
      );

      this.logger.log(`Synced SEO for property ${propId} on trigger: ${trigger} (Index: ${shouldIndex})`);
      return result;
    } catch (err: any) {
      this.logger.error(`Error syncing property SEO: ${err?.message}`, err?.stack);
      return null;
    }
  }

  private extractPropertySource(property: any): PropertySourceData {
    const rawTitle = typeof property.title === 'string'
      ? property.title
      : property.title?.en || property.title?.hi || 'Property';

    const rawDesc = typeof property.description === 'string'
      ? property.description
      : property.description?.en || property.description?.hi || '';

    return {
      id: property._id ? property._id.toString() : property.id,
      _id: property._id ? property._id.toString() : property.id,
      slug: property.slug || (property._id ? property._id.toString() : property.id),
      title: rawTitle,
      description: rawDesc,
      category: property.category?.code || property.category?.name || property.category || 'Apartment',
      propertyType: property.propertyType || property.structureType || 'Residential',
      listingType: property.listingType || property.purpose || 'SALE',
      price: {
        amount: property.price?.amount || property.pricing?.expectedPrice || property.price || 0,
        currency: property.price?.currency || 'INR',
        period: property.price?.rentPeriod || 'MONTHLY',
      },
      location: {
        locality: property.location?.locality || property.location?.addressLine1 || '',
        city: property.location?.city || '',
        state: property.location?.state || '',
        country: property.location?.country || 'India',
        subLocality: property.location?.subLocality || '',
        projectSocietyName: property.location?.projectSocietyName || property.society || '',
      },
      specs: {
        bedrooms: property.specs?.bedrooms || property.bedrooms || 0,
        bathrooms: property.specs?.bathrooms || property.bathrooms || 0,
        carpetAreaSqFt: property.specs?.carpetAreaSqFt || property.carpetArea || 0,
        builtUpAreaSqFt: property.specs?.builtUpAreaSqFt || property.builtUpArea || 0,
        plotArea: property.specs?.plotArea || property.plotArea || 0,
      },
      media: {
        thumbnailUrl: property.media?.thumbnailUrl || property.featuredImage || '',
        images: property.media?.images || property.images || [],
      },
      status: property.status || 'PENDING',
      isPublished: property.isPublished !== false,
    };
  }

  // ==========================================
  // STATIC PAGES & LOCATIONS SEEDING
  // ==========================================

  async initDefaultPagesAndLocations(): Promise<void> {
    const settings = await this.getSettings();

    const standardPages = [
      {
        slug: 'home',
        path: '/',
        title: 'Find Properties to Buy, Rent & Invest',
        desc: 'Discover verified residential and commercial properties for sale and rent across India with MyProperty Marketplace.',
      },
      {
        slug: 'properties',
        path: '/properties',
        title: 'All Real Estate Properties for Sale & Rent',
        desc: 'Explore comprehensive verified real estate listings with photos, floor plans, pricing, and broker contact info.',
      },
      {
        slug: 'about',
        path: '/about',
        title: 'About Us — India\'s Trusted Real Estate Platform',
        desc: 'Learn about MyProperty mission, our verified broker network, and transparent real estate transactions across India.',
      },
      {
        slug: 'contact',
        path: '/contact',
        title: 'Contact Customer Support & Sales',
        desc: 'Get in touch with MyProperty team for listing inquiries, agent onboarding, and premium advisory services.',
      },
      {
        slug: 'categories',
        path: '/categories',
        title: 'Property Categories & Asset Classes',
        desc: 'Browse apartments, luxury villas, commercial offices, industrial plots, and leased properties.',
      },
      {
        slug: 'pricing',
        path: '/pricing',
        title: 'Broker & Developer Subscription Plans',
        desc: 'Transparent listing packages, verified badges, and high-visibility marketing tools for real estate professionals.',
      },
    ];

    for (const page of standardPages) {
      const exists = await this.seoMetadataModel.findOne({ pagePath: page.path }).exec();
      if (!exists) {
        const generated = this.seoGeneratorService.generateStaticPageSeo(
          page.slug,
          page.title,
          page.desc,
          page.path,
          settings,
        );
        await this.seoMetadataModel.create({
          ...generated,
          approvalStatus: SeoApprovalStatus.APPROVED,
        });
      }
    }

    // Top metro locations
    const topCities = [
      { city: 'Mumbai', state: 'Maharashtra' },
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Bangalore', state: 'Karnataka' },
      { city: 'Hyderabad', state: 'Telangana' },
      { city: 'Ahmedabad', state: 'Gujarat' },
      { city: 'Pune', state: 'Maharashtra' },
      { city: 'Kolkata', state: 'West Bengal' },
      { city: 'Lucknow', state: 'Uttar Pradesh' },
    ];

    for (const loc of topCities) {
      const citySlug = loc.city.toLowerCase().replace(/\s+/g, '-');
      const pagePath = `/locations/${citySlug}`;
      const exists = await this.seoMetadataModel.findOne({ pagePath }).exec();
      if (!exists) {
        const count = await this.propertyModel
          .countDocuments({
            'location.city': { $regex: new RegExp(`^${loc.city}$`, 'i') },
            status: 'PUBLISHED',
          })
          .exec();

        const generated = this.seoGeneratorService.generateLocationSeo(
          loc.city,
          loc.state,
          count,
          settings,
        );
        await this.seoMetadataModel.create({
          ...generated,
          approvalStatus: SeoApprovalStatus.APPROVED,
        });
      }
    }
  }

  // ==========================================
  // REDIRECT MANAGEMENT & SLUG TRANSITIONS
  // ==========================================

  async handleSlugChange(
    oldSlug: string,
    newSlug: string,
    entityType: string = 'PROPERTY',
    entityId?: string,
  ): Promise<SeoRedirectDocument | null> {
    if (!oldSlug || !newSlug || oldSlug === newSlug) return null;

    const oldPath = `/property/${oldSlug}`;
    const newPath = `/property/${newSlug}`;

    // Prevent redirect chains: If any older path pointed to oldPath, repoint directly to newPath
    await this.seoRedirectModel.updateMany(
      { newPath: oldPath },
      { $set: { newPath, newSlug } },
    );

    // Upsert the redirect from oldPath to newPath
    return this.seoRedirectModel.findOneAndUpdate(
      { oldPath },
      {
        $set: {
          newPath,
          oldSlug,
          newSlug,
          entityType,
          entityId,
          statusCode: 301,
          isActive: true,
        },
      },
      { upsert: true, new: true },
    );
  }

  async getRedirects(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const filter: Record<string, any> = {};

    if (query.search) {
      filter.$or = [
        { oldPath: { $regex: query.search, $options: 'i' } },
        { newPath: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.seoRedirectModel
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.seoRedirectModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  async createRedirect(dto: CreateRedirectDto): Promise<SeoRedirectDocument> {
    const existing = await this.seoRedirectModel.findOne({ oldPath: dto.oldPath }).exec();
    if (existing) {
      existing.newPath = dto.newPath;
      existing.statusCode = 301;
      existing.isActive = true;
      return existing.save();
    }
    return this.seoRedirectModel.create({
      ...dto,
      statusCode: 301,
      isActive: true,
    });
  }

  async deleteRedirect(id: string): Promise<{ success: boolean }> {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid Redirect ID');
    await this.seoRedirectModel.findByIdAndDelete(id).exec();
    return { success: true };
  }

  // ==========================================
  // AUDIT ENGINE & KPI DASHBOARD OVERVIEW
  // ==========================================

  async getAuditOverview() {
    const [
      totalEligible,
      validSeo,
      pendingApproval,
      rejectedCount,
      criticalIssues,
      highIssues,
      redirectsCount,
      settings,
      avgScoreAgg,
    ] = await Promise.all([
      this.seoMetadataModel.countDocuments().exec(),
      this.seoMetadataModel.countDocuments({ seoScore: { $gte: 80 } }).exec(),
      this.seoMetadataModel.countDocuments({ approvalStatus: SeoApprovalStatus.PENDING_APPROVAL }).exec(),
      this.seoMetadataModel.countDocuments({ approvalStatus: SeoApprovalStatus.REJECTED }).exec(),
      this.seoAuditIssueModel.countDocuments({ severity: SeoIssueSeverity.CRITICAL, resolved: false }).exec(),
      this.seoAuditIssueModel.countDocuments({ severity: SeoIssueSeverity.HIGH, resolved: false }).exec(),
      this.seoRedirectModel.countDocuments({ isActive: true }).exec(),
      this.getSettings(),
      this.seoMetadataModel.aggregate([
        { $group: { _id: null, avgScore: { $avg: '$seoScore' } } },
      ]),
    ]);

    // Check for duplicate titles and descriptions
    const [duplicateTitlesAgg, duplicateDescsAgg] = await Promise.all([
      this.seoMetadataModel.aggregate([
        { $group: { _id: '$metaTitle', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
      ]),
      this.seoMetadataModel.aggregate([
        { $group: { _id: '$metaDescription', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
      ]),
    ]);

    const duplicateTitles = duplicateTitlesAgg.length;
    const duplicateDescriptions = duplicateDescsAgg.length;
    const avgScore = avgScoreAgg.length > 0 ? Math.round(avgScoreAgg[0].avgScore || 0) : 85;

    return {
      totalEligible,
      validSeo,
      pagesMissingMetadata: totalEligible - validSeo > 0 ? totalEligible - validSeo : 0,
      pendingApproval,
      rejectedCount,
      criticalIssues,
      highIssues,
      duplicateTitles,
      duplicateDescriptions,
      redirectsCount,
      avgScore,
      sitemapAutoRegen: settings.sitemap?.autoRegenerateSitemap ?? true,
      approvalMode: settings.automation?.approvalMode || 'AUTOMATIC',
      productionDomain: settings.productionDomain,
    };
  }

  async runFullSiteAudit(): Promise<{ scanned: number; issuesFound: number }> {
    this.logger.log('Starting full website SEO audit scan...');
    const allRecords = await this.seoMetadataModel.find().exec();
    const settings = await this.getSettings();

    // Clear previous unresolved auto-audit issues
    await this.seoAuditIssueModel.deleteMany({ resolved: false }).exec();

    const titleMap = new Map<string, string[]>();
    const descMap = new Map<string, string[]>();
    const newIssues: any[] = [];

    for (const record of allRecords) {
      // Collect titles & descriptions for duplicate detection
      if (record.metaTitle) {
        const arr = titleMap.get(record.metaTitle) || [];
        arr.push(record.pagePath);
        titleMap.set(record.metaTitle, arr);
      }
      if (record.metaDescription) {
        const arr = descMap.get(record.metaDescription) || [];
        arr.push(record.pagePath);
        descMap.set(record.metaDescription, arr);
      }

      // Check validation errors
      for (const err of record.validationErrors || []) {
        newIssues.push({
          url: record.pagePath,
          entityType: record.entityType,
          entityId: record.entityId,
          issueType: err.code,
          severity: err.severity || SeoIssueSeverity.LOW,
          message: err.message,
          recommendedFix: this.getRecommendedFix(err.code),
          resolved: false,
        });
      }
    }

    // Flag duplicate titles
    for (const [title, paths] of titleMap.entries()) {
      if (paths.length > 1) {
        for (const p of paths) {
          newIssues.push({
            url: p,
            entityType: 'PAGE',
            issueType: 'DUPLICATE_TITLE',
            severity: SeoIssueSeverity.HIGH,
            message: `Duplicate meta title shared across ${paths.length} pages: "${title.slice(0, 50)}..."`,
            recommendedFix: 'Customize the title template or add unique locality/specifier tokens.',
            resolved: false,
          });
        }
      }
    }

    // Flag duplicate descriptions
    for (const [desc, paths] of descMap.entries()) {
      if (paths.length > 1) {
        for (const p of paths) {
          newIssues.push({
            url: p,
            entityType: 'PAGE',
            issueType: 'DUPLICATE_DESCRIPTION',
            severity: SeoIssueSeverity.MEDIUM,
            message: `Duplicate meta description shared across ${paths.length} pages.`,
            recommendedFix: 'Provide distinct property highlights or local amenities in description.',
            resolved: false,
          });
        }
      }
    }

    if (newIssues.length > 0) {
      await this.seoAuditIssueModel.insertMany(newIssues);
    }

    this.logger.log(`SEO audit completed. Scanned: ${allRecords.length}, Issues logged: ${newIssues.length}`);
    return {
      scanned: allRecords.length,
      issuesFound: newIssues.length,
    };
  }

  private getRecommendedFix(code: string): string {
    switch (code) {
      case 'MISSING_TITLE':
        return 'Configure an automated title template or provide a manual title override.';
      case 'MISSING_DESCRIPTION':
        return 'Ensure property description has at least 120 characters describing location and amenities.';
      case 'SUBOPTIMAL_TITLE_LENGTH':
        return 'Aim for 40 to 60 characters for best Google desktop and mobile snippet display.';
      case 'SUBOPTIMAL_DESC_LENGTH':
        return 'Aim for 130 to 160 characters to prevent SERP truncation.';
      case 'LOCALHOST_CANONICAL':
        return 'Update Production Domain in SEO Global Settings to your live deployment domain.';
      case 'MISSING_OG_IMAGE':
        return 'Upload at least one high-resolution photo for social media snippet cards.';
      case 'UNRENDERED_TOKENS':
        return 'Ensure all placeholders in template strings are valid attributes.';
      default:
        return 'Review on-page content and update metadata accordingly.';
    }
  }

  async getAuditIssues(query: { severity?: string; resolved?: boolean; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const filter: Record<string, any> = {};

    if (query.severity) filter.severity = query.severity;
    if (query.resolved !== undefined) filter.resolved = query.resolved;

    const [items, total] = await Promise.all([
      this.seoAuditIssueModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.seoAuditIssueModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  async resolveAuditIssue(id: string): Promise<SeoAuditIssueDocument> {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid issue ID');
    const issue = await this.seoAuditIssueModel.findById(id).exec();
    if (!issue) throw new NotFoundException('Issue not found');
    issue.resolved = true;
    return issue.save();
  }

  // ==========================================
  // PUBLIC CONSUMPTION & METADATA RESOLUTION
  // ==========================================

  async getPublicMetadata(path: string, slug?: string): Promise<Partial<SeoMetadata> | null> {
    const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '/';

    // 1. Try exact path match
    let record = await this.seoMetadataModel
      .findOne({
        pagePath: cleanPath,
        approvalStatus: SeoApprovalStatus.APPROVED,
        robotsIndex: true,
      })
      .exec();

    // 2. If not found and slug provided, check by slug
    if (!record && slug) {
      record = await this.seoMetadataModel
        .findOne({
          slug,
          approvalStatus: SeoApprovalStatus.APPROVED,
          robotsIndex: true,
        })
        .exec();
    }

    // 3. If still not found and is a property slug, try generating on-the-fly from live property
    if (!record && slug) {
      const property = await this.propertyModel
        .findOne({
          $or: [{ slug }, { _id: isValidObjectId(slug) ? slug : undefined }],
          status: 'PUBLISHED',
          isPublished: { $ne: false },
        })
        .exec();

      if (property) {
        const settings = await this.getSettings();
        const generated = this.seoGeneratorService.generatePropertySeo(
          this.extractPropertySource(property),
          settings,
        );
        return generated;
      }
    }

    if (!record) return null;

    return {
      metaTitle: record.metaTitle,
      metaDescription: record.metaDescription,
      canonicalUrl: record.canonicalUrl,
      focusKeyword: record.focusKeyword,
      relatedKeywords: record.relatedKeywords,
      robotsIndex: record.robotsIndex,
      robotsFollow: record.robotsFollow,
      openGraphTitle: record.openGraphTitle || record.metaTitle,
      openGraphDescription: record.openGraphDescription || record.metaDescription,
      openGraphImage: record.openGraphImage,
      twitterCardType: record.twitterCardType,
      structuredData: record.structuredData,
      seoScore: record.seoScore,
    };
  }

  // ==========================================
  // DYNAMIC XML SITEMAP GENERATION
  // ==========================================

  async generateXmlSitemap(type?: string): Promise<string> {
    const settings = await this.getSettings();
    const domain = (settings.productionDomain || 'https://casa-real-estate-mocha.vercel.app').replace(/\/$/, '');

    // SITEMAP INDEX: If no specific type requested, return the sitemap index
    if (!type || type === 'index') {
      const sitemaps = [
        `${domain}/api/v1/seo/public/sitemap-pages.xml`,
        `${domain}/api/v1/seo/public/sitemap-properties.xml`,
        `${domain}/api/v1/seo/public/sitemap-locations.xml`,
      ];

      const now = new Date().toISOString();
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      for (const sm of sitemaps) {
        xml += '  <sitemap>\n';
        xml += `    <loc>${this.escapeXml(sm)}</loc>\n`;
        xml += `    <lastmod>${now}</lastmod>\n`;
        xml += '  </sitemap>\n';
      }
      xml += '</sitemapindex>';
      return xml;
    }

    // Filter eligible records: Approved and robotsIndex=true ONLY. Unverified/draft/rejected excluded!
    const filter: Record<string, any> = {
      approvalStatus: SeoApprovalStatus.APPROVED,
      robotsIndex: true,
    };

    if (type === 'pages') {
      filter.entityType = SeoEntityType.PAGE;
    } else if (type === 'properties') {
      filter.entityType = SeoEntityType.PROPERTY;
    } else if (type === 'locations') {
      filter.entityType = SeoEntityType.LOCATION;
    }

    const records = await this.seoMetadataModel
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(settings.sitemap?.batchSize || 1000)
      .exec();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const rec of records) {
      const loc = rec.canonicalUrl || `${domain}${rec.pagePath}`;
      const lastmod = ((rec as any).updatedAt || new Date()).toISOString();
      const priority = rec.pagePath === '/' ? '1.0' : rec.entityType === SeoEntityType.PROPERTY ? '0.8' : '0.6';
      const changefreq = rec.entityType === SeoEntityType.PROPERTY ? 'daily' : 'weekly';

      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXml(loc)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>${changefreq}</changefreq>\n`;
      xml += `    <priority>${priority}</priority>\n`;
      xml += '  </url>\n';
    }

    xml += '</urlset>';
    return xml;
  }

  // ==========================================
  // ROBOTS.TXT GENERATION
  // ==========================================

  async generateRobotsTxt(): Promise<string> {
    const settings = await this.getSettings();
    const domain = (settings.productionDomain || 'https://casa-real-estate-mocha.vercel.app').replace(/\/$/, '');
    const custom = settings.robotsTxt?.customDirectives || 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /private/';

    return `${custom.trim()}

# Dynamic XML Sitemap Index
Sitemap: ${domain}/api/v1/seo/public/sitemap.xml
Sitemap: ${domain}/sitemap.xml
`;
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }
}
