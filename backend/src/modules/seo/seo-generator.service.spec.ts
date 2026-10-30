import { SeoGeneratorService } from './seo-generator.service';
import { SeoSettings, SeoEntityType, SeoIssueSeverity } from './schemas/seo.schema';

describe('SeoGeneratorService', () => {
  let service: SeoGeneratorService;
  let mockSettings: SeoSettings;

  beforeEach(() => {
    service = new SeoGeneratorService();
    mockSettings = {
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
        propertyDescTemplate: 'Explore this {bedrooms} {propertyType} for {listingPurpose} in {locality}, {city}. View verified pricing, amenities, area specs, and photos on {websiteName}.',
        locationTitleTemplate: 'Properties in {city}, {state} for Sale & Rent {titleSuffix}',
        locationDescTemplate: 'Browse verified properties in {city}, {state} on {websiteName}.',
        categoryTitleTemplate: '{category} for Sale & Rent in India {titleSuffix}',
        categoryDescTemplate: 'Explore verified {category} across top locations on {websiteName}.',
        fallbackTitleTemplate: '{pageTitle} {titleSuffix}',
        fallbackDescTemplate: 'Verified real estate opportunities on {websiteName}.',
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
    };
  });

  describe('formatPrice', () => {
    it('formats amounts in Indian Crores and Lacs correctly', () => {
      expect(service.formatPrice(15000000, 'SALE')).toBe('₹1.5 Cr');
      expect(service.formatPrice(7500000, 'SALE')).toBe('₹75 Lac');
      expect(service.formatPrice(45000, 'RENT')).toBe('₹45,000/mo');
      expect(service.formatPrice(120000, 'RENT')).toBe('₹1.2 Lac/mo');
    });

    it('returns empty string for zero, NaN or invalid price', () => {
      expect(service.formatPrice(0)).toBe('');
      expect(service.formatPrice(undefined)).toBe('');
    });
  });

  describe('generatePropertySeo', () => {
    it('generates complete, valid SEO metadata from actual property attributes', () => {
      const property = {
        id: 'prop-101',
        slug: '3-bhk-apartment-satellite-ahmedabad',
        title: { en: '3 BHK Apartment for Sale in Satellite' },
        description: { en: 'Spacious high-rise flat with clubhouse amenities.' },
        category: 'Apartment',
        propertyType: 'Residential',
        listingType: 'SALE',
        price: { amount: 8500000, currency: 'INR' },
        location: {
          locality: 'Satellite',
          city: 'Ahmedabad',
          state: 'Gujarat',
          country: 'India',
        },
        specs: {
          bedrooms: 3,
          bathrooms: 3,
          carpetAreaSqFt: 1850,
        },
        media: {
          thumbnailUrl: 'https://images.unsplash.com/photo-1545324418.jpg',
          images: ['https://images.unsplash.com/photo-1545324418.jpg'],
        },
        status: 'PUBLISHED',
        isPublished: true,
      };

      const result = service.generatePropertySeo(property, mockSettings);

      expect(result.entityType).toBe(SeoEntityType.PROPERTY);
      expect(result.pagePath).toBe('/property/3-bhk-apartment-satellite-ahmedabad');
      expect(result.canonicalUrl).toBe('https://casa-real-estate-mocha.vercel.app/property/3-bhk-apartment-satellite-ahmedabad');
      expect(result.metaTitle).toContain('3 BHK Apartment for Sale in Satellite, Ahmedabad');
      expect(result.metaTitle).toContain('| MyProperty');
      expect(result.metaDescription).toContain('Explore this 3 BHK Apartment');
      expect(result.metaDescription).toContain('Priced at ₹85 Lac');
      expect(result.metaDescription).toContain('Built-up area: 1,850 sq. ft.');
      expect(result.robotsIndex).toBe(true);
      expect(result.seoScore).toBeGreaterThanOrEqual(80);
      expect(result.structuredData).toBeDefined();
    });

    it('preserves approved manual overrides when fieldLocks are enabled', () => {
      const property = {
        id: 'prop-202',
        slug: 'luxury-villa-bandra-mumbai',
        category: 'Villa',
        listingType: 'SALE',
        location: { locality: 'Bandra West', city: 'Mumbai', state: 'Maharashtra' },
        specs: { bedrooms: 4 },
        status: 'PUBLISHED',
      };

      const existingSeo = {
        metaTitle: 'Custom Curated Villa in Bandra with Sea View | Exclusive',
        fieldLocks: {
          metaTitle: true,
          metaDescription: false,
          canonicalUrl: false,
          openGraph: false,
          structuredData: false,
        },
      };

      const result = service.generatePropertySeo(property, mockSettings, existingSeo);

      // Title should NOT be overwritten because metaTitle is locked
      expect(result.metaTitle).toBe('Custom Curated Villa in Bandra with Sea View | Exclusive');
      // Description was not locked, so it was generated from the template
      expect(result.metaDescription).toContain('Explore this 4 BHK Villa');
    });

    it('handles commercial plots without awkward "0 BHK" phrasing', () => {
      const plot = {
        id: 'plot-1',
        slug: 'commercial-plot-sanand-ahmedabad',
        category: 'PLOT',
        listingType: 'SALE',
        location: { locality: 'Sanand', city: 'Ahmedabad' },
        specs: { plotArea: 5000 },
        status: 'PUBLISHED',
      };

      const result = service.generatePropertySeo(plot, mockSettings);
      expect(result.metaTitle).not.toContain('0 BHK');
      expect(result.metaTitle).toContain('Plot for Sale in Sanand, Ahmedabad');
    });

    it('sets Schema.org Offer availability to SoldOut when property status is SOLD_OR_RENTED', () => {
      const property = {
        id: 'prop-sold-1',
        slug: 'furnished-2bhk-flat-vastrapur',
        category: 'Apartment',
        listingType: 'SALE',
        price: { amount: 5500000 },
        location: { locality: 'Vastrapur', city: 'Ahmedabad' },
        specs: { bedrooms: 2 },
        status: 'SOLD_OR_RENTED',
        isPublished: true,
      };

      const result = service.generatePropertySeo(property, mockSettings);
      const graph = (result.structuredData as any)['@graph'];
      const listing = graph.find((item: any) => item['@type'] === 'RealEstateListing');

      expect(listing).toBeDefined();
      expect(listing.offers.availability).toBe('https://schema.org/SoldOut');
    });
  });

  describe('calculateQualityScore', () => {
    it('awards high score for optimal title, description, canonical, and structured data', () => {
      const evaluation = service.calculateQualityScore({
        metaTitle: '3 BHK Luxury Apartment in Satellite, Ahmedabad | MyProperty',
        metaDescription: 'Explore this spacious 3 BHK luxury apartment for sale in Satellite, Ahmedabad. View verified prices, amenities, photos, and floor plans on MyProperty.',
        canonicalUrl: 'https://casa-real-estate-mocha.vercel.app/property/sample-flat',
        ogImage: 'https://images.unsplash.com/sample.jpg',
        hasStructuredData: true,
        robotsIndex: true,
      });

      expect(evaluation.score).toBeGreaterThanOrEqual(85);
      expect(evaluation.errors.filter((e) => e.severity === SeoIssueSeverity.CRITICAL).length).toBe(0);
    });

    it('penalizes empty title and localhost canonical URLs', () => {
      const evaluation = service.calculateQualityScore({
        metaTitle: '',
        metaDescription: 'Some description that is sufficiently long to pass character count checks for tests.',
        canonicalUrl: 'http://localhost:3000/property/sample-flat',
        hasStructuredData: false,
      });

      expect(evaluation.score).toBeLessThan(50);
      expect(evaluation.errors.some((e) => e.code === 'MISSING_TITLE')).toBe(true);
      expect(evaluation.errors.some((e) => e.code === 'LOCALHOST_CANONICAL')).toBe(true);
      expect(evaluation.errors.some((e) => e.code === 'MISSING_STRUCTURED_DATA')).toBe(true);
    });
  });

  describe('generateLocationSeo', () => {
    it('sets robotsIndex=false for empty locations when noindexEmptyLocations is configured', () => {
      const result = service.generateLocationSeo('Morbi', 'Gujarat', 0, mockSettings);
      expect(result.robotsIndex).toBe(false);
      expect(result.pagePath).toBe('/locations/morbi');
    });

    it('sets robotsIndex=true when location has active published listings', () => {
      const result = service.generateLocationSeo('Ahmedabad', 'Gujarat', 14, mockSettings);
      expect(result.robotsIndex).toBe(true);
      expect(result.metaTitle).toContain('Properties in Ahmedabad, Gujarat');
    });
  });
});
