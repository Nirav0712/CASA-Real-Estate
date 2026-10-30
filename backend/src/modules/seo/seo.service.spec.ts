import { SeoService } from './seo.service';
import { SeoGeneratorService } from './seo-generator.service';
import { SeoEntityType, SeoApprovalStatus, SeoIssueSeverity } from './schemas/seo.schema';

describe('SeoService', () => {
  let service: SeoService;
  let seoMetadataModel: any;
  let seoSettingsModel: any;
  let seoRedirectModel: any;
  let seoAuditIssueModel: any;
  let propertyModel: any;
  let categoryModel: any;
  let generatorService: SeoGeneratorService;

  beforeEach(() => {
    generatorService = new SeoGeneratorService();

    const mockSettings = {
      websiteName: 'MyProperty Real Estate Marketplace',
      productionDomain: 'https://casa-real-estate-mocha.vercel.app',
      defaultTitleSuffix: '| MyProperty',
      defaultDescription: 'Explore verified real estate properties across India.',
      defaultOgImage: 'https://casa-real-estate-mocha.vercel.app/og-image.jpg',
      defaultLocale: 'en',
      templates: {
        homepageTitleTemplate: '{websiteName} | Find Properties to Buy, Rent & Invest',
        homepageDescTemplate: 'Search verified residential and commercial properties on {websiteName}.',
        propertyTitleTemplate: '{bedrooms} {propertyType} for {listingPurpose} in {locality}, {city} {titleSuffix}',
        propertyDescTemplate: 'Explore this {bedrooms} {propertyType} for {listingPurpose} in {locality}, {city} on {websiteName}.',
      },
      automation: {
        autoGenerateOnCreate: true,
        autoRegenerateOnUpdate: true,
        approvalMode: 'AUTOMATIC',
        aiEnabled: false,
      },
      indexing: {
        defaultRobotsIndex: true,
        defaultRobotsFollow: true,
        noindexEmptyLocations: true,
        soldPropertyPolicy: 'KEEP_INDEXED_UPDATE_SCHEMA',
      },
      sitemap: {
        autoRegenerateSitemap: true,
        excludePrivateAndDraft: true,
        batchSize: 500,
      },
      robotsTxt: {
        customDirectives: 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /private/',
      },
      save: jest.fn().mockResolvedValue(true),
    };

    seoSettingsModel = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSettings),
      }),
      create: jest.fn().mockResolvedValue(mockSettings),
    };

    seoMetadataModel = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
      findOneAndUpdate: jest.fn().mockImplementation((query, update) => ({
        exec: jest.fn().mockResolvedValue({ ...update.$set, _id: 'mock-id' }),
      })),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(10),
      }),
      aggregate: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue(true),
    };

    seoRedirectModel = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
      findOneAndUpdate: jest.fn().mockResolvedValue({
        oldPath: '/property/old-slug',
        newPath: '/property/new-slug',
        statusCode: 301,
      }),
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      }),
    };

    seoAuditIssueModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      }),
      deleteMany: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(true),
      }),
      insertMany: jest.fn().mockResolvedValue([]),
    };

    propertyModel = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(5),
      }),
    };

    categoryModel = {
      countDocuments: jest.fn().mockResolvedValue(5),
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    };

    service = new SeoService(
      seoMetadataModel,
      seoSettingsModel,
      seoRedirectModel,
      seoAuditIssueModel,
      propertyModel,
      categoryModel,
      generatorService,
    );
  });

  describe('syncPropertySeo', () => {
    it('generates and saves SEO metadata when a property is submitted', async () => {
      const property = {
        _id: '507f191e810c19729de860ea',
        id: 'prop-101',
        slug: '3-bhk-flat-satellite-ahmedabad',
        title: { en: '3 BHK Flat in Satellite' },
        description: { en: 'Beautiful apartment with modern amenities.' },
        category: 'Apartment',
        listingType: 'SALE',
        price: { amount: 8000000 },
        location: { locality: 'Satellite', city: 'Ahmedabad' },
        specs: { bedrooms: 3 },
        status: 'PENDING_REVIEW',
        isPublished: false,
      };

      await service.syncPropertySeo(property, 'SUBMIT');

      expect(seoMetadataModel.findOneAndUpdate).toHaveBeenCalledWith(
        { entityType: SeoEntityType.PROPERTY, entityId: '507f191e810c19729de860ea' },
        expect.objectContaining({
          $set: expect.objectContaining({
            pagePath: '/property/3-bhk-flat-satellite-ahmedabad',
            robotsIndex: false, // Non-published properties must not be indexed
          }),
        }),
        expect.any(Object),
      );
    });

    it('sets robotsIndex=true and marks APPROVED when property is approved in automatic approval mode', async () => {
      const property = {
        _id: '507f191e810c19729de860ea',
        slug: '3-bhk-flat-satellite-ahmedabad',
        title: { en: '3 BHK Flat in Satellite' },
        category: 'Apartment',
        listingType: 'SALE',
        price: { amount: 8000000 },
        location: { locality: 'Satellite', city: 'Ahmedabad' },
        specs: { bedrooms: 3 },
        status: 'PUBLISHED',
        isPublished: true,
      };

      await service.syncPropertySeo(property, 'APPROVE');

      expect(seoMetadataModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          $set: expect.objectContaining({
            approvalStatus: SeoApprovalStatus.APPROVED,
            robotsIndex: true,
          }),
        }),
        expect.any(Object),
      );
    });

    it('sets robotsIndex=false when property is rejected', async () => {
      const property = {
        _id: '507f191e810c19729de860ea',
        slug: '3-bhk-flat-satellite-ahmedabad',
        category: 'Apartment',
        status: 'REJECTED',
        isPublished: false,
      };

      await service.syncPropertySeo(property, 'REJECT');

      expect(seoMetadataModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          $set: expect.objectContaining({
            robotsIndex: false,
            approvalStatus: SeoApprovalStatus.REJECTED,
          }),
        }),
        expect.any(Object),
      );
    });
  });

  describe('handleSlugChange', () => {
    it('creates a 301 redirect and resolves older redirect chains when slug changes', async () => {
      await service.handleSlugChange('old-property-slug', 'new-property-slug', 'PROPERTY', 'prop-101');

      expect(seoRedirectModel.updateMany).toHaveBeenCalledWith(
        { newPath: '/property/old-property-slug' },
        { $set: { newPath: '/property/new-property-slug', newSlug: 'new-property-slug' } },
      );

      expect(seoRedirectModel.findOneAndUpdate).toHaveBeenCalledWith(
        { oldPath: '/property/old-property-slug' },
        expect.objectContaining({
          $set: expect.objectContaining({
            newPath: '/property/new-property-slug',
            statusCode: 301,
            isActive: true,
          }),
        }),
        { upsert: true, new: true },
      );
    });
  });

  describe('generateRobotsTxt', () => {
    it('generates robots.txt referencing production dynamic sitemaps and disallowing /admin/', async () => {
      const robots = await service.generateRobotsTxt();

      expect(robots).toContain('User-agent: *');
      expect(robots).toContain('Disallow: /admin/');
      expect(robots).toContain('Sitemap: https://casa-real-estate-mocha.vercel.app/api/v1/seo/public/sitemap.xml');
    });
  });

  describe('generateXmlSitemap', () => {
    it('generates valid XML sitemap index referencing sub-sitemaps', async () => {
      const sitemap = await service.generateXmlSitemap('index');

      expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemap).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(sitemap).toContain('/api/v1/seo/public/sitemap-properties.xml');
      expect(sitemap).toContain('/api/v1/seo/public/sitemap-pages.xml');
      expect(sitemap).toContain('/api/v1/seo/public/sitemap-locations.xml');
    });
  });
});
