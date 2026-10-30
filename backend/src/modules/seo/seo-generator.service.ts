import { Injectable } from '@nestjs/common';
import { SeoMetadata, SeoSettings, SeoValidationError, SeoIssueSeverity, SeoEntityType } from './schemas/seo.schema';

export interface PropertySourceData {
  id?: string;
  _id?: string;
  slug?: string;
  title?: string | { en?: string };
  description?: string | { en?: string };
  category?: string;
  propertyType?: string;
  listingType?: string;
  price?: {
    amount?: number;
    currency?: string;
    period?: string;
  };
  location?: {
    locality?: string;
    city?: string;
    state?: string;
    country?: string;
    subLocality?: string;
    projectSocietyName?: string;
  };
  specs?: {
    bedrooms?: number;
    bathrooms?: number;
    carpetAreaSqFt?: number;
    builtUpAreaSqFt?: number;
    areaUnit?: string;
    plotArea?: number;
  };
  media?: {
    thumbnailUrl?: string;
    images?: Array<string | { url?: string; alt?: string }>;
  };
  status?: string;
  isPublished?: boolean;
}

@Injectable()
export class SeoGeneratorService {
  /**
   * Format numeric price into readable Indian currency (Lac / Cr / Thousands)
   */
  formatPrice(amount?: number, listingType?: string): string {
    if (!amount || isNaN(amount) || amount <= 0) return '';
    const isRent = listingType?.toUpperCase() === 'RENT' || listingType?.toUpperCase() === 'LEASE';

    if (isRent) {
      if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)} Lac/mo`;
      }
      return `₹${amount.toLocaleString('en-IN')}/mo`;
    }

    if (amount >= 10000000) {
      const cr = (amount / 10000000).toFixed(2).replace(/\.00$/, '').replace(/(\.[0-9])0$/, '$1');
      return `₹${cr} Cr`;
    }
    if (amount >= 100000) {
      const lac = (amount / 100000).toFixed(2).replace(/\.00$/, '').replace(/(\.[0-9])0$/, '$1');
      return `₹${lac} Lac`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  /**
   * Safe property type string
   */
  normalizePropertyType(category?: string, propertyType?: string): string {
    if (category && category !== 'OTHER') {
      const formatted = category.replace(/_/g, ' ').toLowerCase();
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    if (propertyType) {
      return propertyType.charAt(0).toUpperCase() + propertyType.slice(1);
    }
    return 'Property';
  }

  /**
   * Safe bedroom text (e.g., "3 BHK" or "" for plots/commercial)
   */
  getBedroomText(bedrooms?: number, category?: string): string {
    if (!bedrooms || bedrooms <= 0) return '';
    const cat = (category || '').toUpperCase();
    if (['PLOT', 'LAND', 'COMMERCIAL', 'OFFICE', 'SHOP', 'WAREHOUSE'].includes(cat)) {
      return '';
    }
    return `${bedrooms} BHK`;
  }

  /**
   * Interpolate template placeholders safely with actual content
   */
  interpolate(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [key, val] of Object.entries(vars)) {
      const regex = new RegExp(`\\{${key}\\}`, 'gi');
      result = result.replace(regex, val || '');
    }

    // Clean up empty double spaces, trailing commas, and orphan connectors
    return result
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .replace(/\s,\s/g, ', ')
      .replace(/\bin in\b/gi, 'in')
      .replace(/\bfor for\b/gi, 'for')
      .trim();
  }

  /**
   * Generate complete SEO metadata for a Property entity
   */
  generatePropertySeo(
    property: PropertySourceData,
    settings: SeoSettings,
    existingSeo?: Partial<SeoMetadata>,
  ): Partial<SeoMetadata> {
    const domain = (settings.productionDomain || 'https://casa-real-estate-mocha.vercel.app').replace(/\/$/, '');
    const titleSuffix = settings.defaultTitleSuffix || '| MyProperty';
    const websiteName = settings.websiteName || 'MyProperty Real Estate Marketplace';

    const propType = this.normalizePropertyType(property.category, property.propertyType);
    const listingPurpose = property.listingType?.toUpperCase() === 'RENT' ? 'Rent' : 'Sale';
    const bedrooms = this.getBedroomText(property.specs?.bedrooms, property.category);

    const locality = (property.location?.locality || property.location?.subLocality || '').trim();
    const city = (property.location?.city || '').trim();
    const state = (property.location?.state || '').trim();
    const society = (property.location?.projectSocietyName || '').trim();

    // Avoid duplicate locality and city
    let locationPhrase = locality && city && locality.toLowerCase() !== city.toLowerCase()
      ? `${locality}, ${city}`
      : city || locality || 'India';

    if (society && !locationPhrase.includes(society)) {
      locationPhrase = `${society}, ${locationPhrase}`;
    }

    const priceText = this.formatPrice(property.price?.amount, property.listingType);
    const areaVal = property.specs?.carpetAreaSqFt || property.specs?.builtUpAreaSqFt || property.specs?.plotArea;
    const areaText = areaVal ? `${areaVal.toLocaleString('en-IN')} sq. ft.` : '';

    const vars: Record<string, string> = {
      bedrooms,
      propertyType: propType,
      listingPurpose,
      locality: locality || city,
      city: city || locality,
      state,
      societyName: society,
      price: priceText,
      area: areaText,
      titleSuffix,
      websiteName,
    };

    // 1. Meta Title
    const templateTitle = settings.templates?.propertyTitleTemplate ||
      '{bedrooms} {propertyType} for {listingPurpose} in {locality}, {city} {titleSuffix}';
    let autoTitle = this.interpolate(templateTitle, vars);

    // If bedrooms was empty, clean up orphan leading space
    autoTitle = autoTitle.replace(/^\s+/, '').replace(/\s+/g, ' ').trim();
    if (priceText && autoTitle.length < 52) {
      // Append price if title has room
      autoTitle = `${autoTitle.replace(titleSuffix, '').trim()} — ${priceText} ${titleSuffix}`;
    }

    // 2. Meta Description
    const templateDesc = settings.templates?.propertyDescTemplate ||
      'Explore this {bedrooms} {propertyType} for {listingPurpose} in {locality}, {city}. View verified pricing, amenities, area specs, and photos on {websiteName}.';
    let autoDesc = this.interpolate(templateDesc, vars);
    if (priceText && !autoDesc.includes(priceText)) {
      autoDesc = `Priced at ${priceText}. ${autoDesc}`;
    }
    if (areaText && !autoDesc.includes(areaText)) {
      autoDesc = `${autoDesc} Built-up area: ${areaText}.`;
    }

    // 3. Focus and Related Keywords
    const focusKeyword = `${bedrooms ? bedrooms + ' ' : ''}${propType} for ${listingPurpose} in ${locationPhrase}`.trim();
    const relatedKeywords = [
      `${propType} for ${listingPurpose} in ${city || locality}`,
      `Properties in ${locality || city}`,
      society ? `Flats in ${society}` : null,
      priceText ? `${propType} under ${priceText}` : null,
      'Verified Real Estate India',
    ].filter(Boolean) as string[];

    // 4. URL & Canonical
    const slug = property.slug || property.id || property._id || 'listing';
    const pagePath = `/property/${slug}`;
    const canonicalUrl = `${domain}${pagePath}`;

    // 5. Image & OG
    let ogImage = settings.defaultOgImage || `${domain}/og-image.jpg`;
    if (property.media?.thumbnailUrl) {
      ogImage = property.media.thumbnailUrl;
    } else if (property.media?.images && property.media.images.length > 0) {
      const first = property.media.images[0];
      ogImage = typeof first === 'string' ? first : first.url || ogImage;
    }

    // 6. JSON-LD Structured Data
    const rawTitle = typeof property.title === 'string' ? property.title : property.title?.en || autoTitle;
    const rawDesc = typeof property.description === 'string' ? property.description : property.description?.en || autoDesc;

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: domain,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: city || 'Properties',
              item: `${domain}/locations/${(city || 'india').toLowerCase().replace(/\s+/g, '-')}`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: rawTitle,
              item: canonicalUrl,
            },
          ],
        },
        {
          '@type': 'RealEstateListing',
          name: rawTitle,
          description: rawDesc,
          url: canonicalUrl,
          image: ogImage,
          offers: property.price?.amount
            ? {
                '@type': 'Offer',
                price: property.price.amount,
                priceCurrency: property.price.currency || 'INR',
                availability: 'https://schema.org/InStock',
              }
            : undefined,
          address: {
            '@type': 'PostalAddress',
            streetAddress: locality,
            addressLocality: city,
            addressRegion: state,
            addressCountry: 'IN',
          },
          numberOfBedrooms: property.specs?.bedrooms || undefined,
          numberOfBathroomsTotal: property.specs?.bathrooms || undefined,
          floorSize: areaVal
            ? {
                '@type': 'QuantitativeValue',
                value: areaVal,
                unitCode: 'FTK',
              }
            : undefined,
        },
      ],
    };

    // 7. Respect Field Locks if manual override is locked
    const locks = existingSeo?.fieldLocks || {
      metaTitle: false,
      metaDescription: false,
      canonicalUrl: false,
      openGraph: false,
      structuredData: false,
    };

    const finalMetaTitle = (locks.metaTitle && existingSeo?.metaTitle) ? existingSeo.metaTitle : autoTitle;
    const finalMetaDescription = (locks.metaDescription && existingSeo?.metaDescription) ? existingSeo.metaDescription : autoDesc;
    const finalCanonicalUrl = (locks.canonicalUrl && existingSeo?.canonicalUrl) ? existingSeo.canonicalUrl : canonicalUrl;
    const finalOgTitle = (locks.openGraph && existingSeo?.openGraphTitle) ? existingSeo.openGraphTitle : finalMetaTitle;
    const finalOgDescription = (locks.openGraph && existingSeo?.openGraphDescription) ? existingSeo.openGraphDescription : finalMetaDescription;
    const finalOgImage = (locks.openGraph && existingSeo?.openGraphImage) ? existingSeo.openGraphImage : ogImage;
    const finalStructuredData = (locks.structuredData && existingSeo?.structuredData) ? existingSeo.structuredData : structuredData;

    // 8. Quality Score & On-Page Validation
    const { score, errors } = this.calculateQualityScore({
      metaTitle: finalMetaTitle,
      metaDescription: finalMetaDescription,
      canonicalUrl: finalCanonicalUrl,
      focusKeyword,
      ogImage: finalOgImage,
      hasStructuredData: Boolean(finalStructuredData),
      robotsIndex: property.isPublished !== false && property.status === 'PUBLISHED',
      carpetArea: areaVal,
    });

    return {
      entityType: SeoEntityType.PROPERTY,
      entityId: property.id || property._id,
      pageType: 'PROPERTY_DETAIL',
      pagePath,
      canonicalUrl: finalCanonicalUrl,
      slug,
      metaTitle: finalMetaTitle,
      metaDescription: finalMetaDescription,
      focusKeyword,
      relatedKeywords,
      robotsIndex: property.status === 'PUBLISHED' && property.isPublished !== false,
      robotsFollow: true,
      openGraphTitle: finalOgTitle,
      openGraphDescription: finalOgDescription,
      openGraphImage: finalOgImage,
      twitterCardType: 'summary_large_image',
      structuredData: finalStructuredData,
      seoScore: score,
      validationErrors: errors,
      fieldLocks: locks,
      sourceSnapshot: {
        title: rawTitle,
        price: property.price?.amount,
        city,
        locality,
        category: property.category,
      },
    };
  }

  /**
   * Generate static page SEO (Homepage, About, Search, etc.)
   */
  generateStaticPageSeo(
    pageKey: string,
    title: string,
    description: string,
    path: string,
    settings: SeoSettings,
    existingSeo?: Partial<SeoMetadata>,
  ): Partial<SeoMetadata> {
    const domain = (settings.productionDomain || 'https://casa-real-estate-mocha.vercel.app').replace(/\/$/, '');
    const titleSuffix = settings.defaultTitleSuffix || '| MyProperty';
    const canonicalUrl = `${domain}${path === '/' ? '' : path}`;

    const locks = existingSeo?.fieldLocks || {
      metaTitle: false,
      metaDescription: false,
      canonicalUrl: false,
      openGraph: false,
      structuredData: false,
    };

    const finalTitle = (locks.metaTitle && existingSeo?.metaTitle) ? existingSeo.metaTitle : `${title} ${titleSuffix}`.trim();
    const finalDescription = (locks.metaDescription && existingSeo?.metaDescription) ? existingSeo.metaDescription : description;
    const finalCanonicalUrl = (locks.canonicalUrl && existingSeo?.canonicalUrl) ? existingSeo.canonicalUrl : canonicalUrl;

    const structuredData = path === '/'
      ? {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: settings.websiteName,
          url: domain,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${domain}/properties?search={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        }
      : undefined;

    const { score, errors } = this.calculateQualityScore({
      metaTitle: finalTitle,
      metaDescription: finalDescription,
      canonicalUrl: finalCanonicalUrl,
      focusKeyword: title,
      ogImage: settings.defaultOgImage || `${domain}/og-image.jpg`,
      hasStructuredData: Boolean(structuredData),
      robotsIndex: true,
    });

    return {
      entityType: SeoEntityType.PAGE,
      entityId: pageKey,
      pageType: 'STATIC_PAGE',
      pagePath: path,
      canonicalUrl: finalCanonicalUrl,
      slug: pageKey,
      metaTitle: finalTitle,
      metaDescription: finalDescription,
      focusKeyword: title,
      relatedKeywords: [title, 'Real Estate', 'Properties in India'],
      robotsIndex: true,
      robotsFollow: true,
      openGraphTitle: finalTitle,
      openGraphDescription: finalDescription,
      openGraphImage: settings.defaultOgImage || `${domain}/og-image.jpg`,
      twitterCardType: 'summary_large_image',
      structuredData: (locks.structuredData && existingSeo?.structuredData) ? existingSeo.structuredData : structuredData,
      seoScore: score,
      validationErrors: errors,
      fieldLocks: locks,
    };
  }

  /**
   * Generate Location Page SEO (City / Locality)
   */
  generateLocationSeo(
    city: string,
    state: string,
    activeListingsCount: number,
    settings: SeoSettings,
    existingSeo?: Partial<SeoMetadata>,
  ): Partial<SeoMetadata> {
    const domain = (settings.productionDomain || 'https://casa-real-estate-mocha.vercel.app').replace(/\/$/, '');
    const titleSuffix = settings.defaultTitleSuffix || '| MyProperty';
    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
    const pagePath = `/locations/${citySlug}`;
    const canonicalUrl = `${domain}${pagePath}`;

    const vars = {
      city,
      state: state || 'India',
      titleSuffix,
      websiteName: settings.websiteName,
    };

    const templateTitle = settings.templates?.locationTitleTemplate ||
      'Properties in {city}, {state} for Sale & Rent {titleSuffix}';
    const templateDesc = settings.templates?.locationDescTemplate ||
      'Browse verified residential and commercial properties in {city}, {state}. View latest listings, price trends, and local inventory on {websiteName}.';

    const autoTitle = this.interpolate(templateTitle, vars);
    const autoDesc = this.interpolate(templateDesc, vars);

    const locks = existingSeo?.fieldLocks || {
      metaTitle: false,
      metaDescription: false,
      canonicalUrl: false,
      openGraph: false,
      structuredData: false,
    };

    const finalTitle = (locks.metaTitle && existingSeo?.metaTitle) ? existingSeo.metaTitle : autoTitle;
    const finalDescription = (locks.metaDescription && existingSeo?.metaDescription) ? existingSeo.metaDescription : autoDesc;
    const finalCanonicalUrl = (locks.canonicalUrl && existingSeo?.canonicalUrl) ? existingSeo.canonicalUrl : canonicalUrl;

    // Directives: if empty and settings require noindexing empty locations
    const shouldIndex = activeListingsCount > 0 || !settings.indexing?.noindexEmptyLocations;

    const { score, errors } = this.calculateQualityScore({
      metaTitle: finalTitle,
      metaDescription: finalDescription,
      canonicalUrl: finalCanonicalUrl,
      focusKeyword: `Properties in ${city}`,
      ogImage: settings.defaultOgImage || `${domain}/og-image.jpg`,
      hasStructuredData: true,
      robotsIndex: shouldIndex,
    });

    return {
      entityType: SeoEntityType.LOCATION,
      entityId: citySlug,
      pageType: 'LOCATION_CITY',
      pagePath,
      canonicalUrl: finalCanonicalUrl,
      slug: citySlug,
      metaTitle: finalTitle,
      metaDescription: finalDescription,
      focusKeyword: `Properties in ${city}`,
      relatedKeywords: [`Flats in ${city}`, `Real Estate in ${city}`, `Buy House in ${city}`],
      robotsIndex: shouldIndex,
      robotsFollow: true,
      openGraphTitle: finalTitle,
      openGraphDescription: finalDescription,
      openGraphImage: settings.defaultOgImage || `${domain}/og-image.jpg`,
      twitterCardType: 'summary_large_image',
      seoScore: score,
      validationErrors: errors,
      fieldLocks: locks,
    };
  }

  /**
   * 100-Point SEO Quality Scoring Algorithm with issue diagnostics
   */
  calculateQualityScore(input: {
    metaTitle: string;
    metaDescription: string;
    canonicalUrl: string;
    focusKeyword?: string;
    ogImage?: string;
    hasStructuredData?: boolean;
    robotsIndex?: boolean;
    carpetArea?: number;
  }): { score: number; errors: SeoValidationError[] } {
    let score = 0;
    const errors: SeoValidationError[] = [];

    // 1. Meta Title (20 Points)
    const titleLen = (input.metaTitle || '').length;
    if (!titleLen) {
      errors.push({
        code: 'MISSING_TITLE',
        message: 'Meta title is missing or empty.',
        severity: SeoIssueSeverity.CRITICAL,
      });
    } else if (titleLen >= 35 && titleLen <= 65) {
      score += 20;
    } else if (titleLen >= 25 && titleLen <= 75) {
      score += 15;
      errors.push({
        code: 'SUBOPTIMAL_TITLE_LENGTH',
        message: `Title length (${titleLen} chars) is outside optimal 40–60 character range.`,
        severity: SeoIssueSeverity.LOW,
      });
    } else {
      score += 8;
      errors.push({
        code: 'POOR_TITLE_LENGTH',
        message: `Title is ${titleLen < 25 ? 'too short' : 'too long'} (${titleLen} chars). May be truncated in SERPs.`,
        severity: SeoIssueSeverity.MEDIUM,
      });
    }

    // 2. Meta Description (20 Points)
    const descLen = (input.metaDescription || '').length;
    if (!descLen) {
      errors.push({
        code: 'MISSING_DESCRIPTION',
        message: 'Meta description is missing or empty.',
        severity: SeoIssueSeverity.HIGH,
      });
    } else if (descLen >= 120 && descLen <= 170) {
      score += 20;
    } else if (descLen >= 80 && descLen <= 220) {
      score += 15;
      errors.push({
        code: 'SUBOPTIMAL_DESC_LENGTH',
        message: `Meta description length (${descLen} chars) is outside optimal 130–165 character range.`,
        severity: SeoIssueSeverity.LOW,
      });
    } else {
      score += 8;
      errors.push({
        code: 'POOR_DESC_LENGTH',
        message: `Description is ${descLen < 80 ? 'too brief' : 'excessively long'} (${descLen} chars).`,
        severity: SeoIssueSeverity.MEDIUM,
      });
    }

    // Keyword relevance in Title / Description
    if (input.focusKeyword) {
      const lowerTitle = (input.metaTitle || '').toLowerCase();
      const lowerKw = input.focusKeyword.toLowerCase();
      if (!lowerTitle.includes(lowerKw.split(' ')[0])) {
        errors.push({
          code: 'KEYWORD_NOT_IN_TITLE',
          message: 'Target focus keyword is not prominent in the meta title.',
          severity: SeoIssueSeverity.LOW,
        });
      }
    }

    // 3. Canonical URL (15 Points)
    if (input.canonicalUrl && input.canonicalUrl.startsWith('http')) {
      if (input.canonicalUrl.includes('localhost') || input.canonicalUrl.includes('127.0.0.1')) {
        errors.push({
          code: 'LOCALHOST_CANONICAL',
          message: 'Canonical URL contains local or non-production origin.',
          severity: SeoIssueSeverity.HIGH,
        });
        score += 5;
      } else {
        score += 15;
      }
    } else {
      errors.push({
        code: 'INVALID_CANONICAL',
        message: 'Canonical URL is missing or has invalid format.',
        severity: SeoIssueSeverity.HIGH,
      });
    }

    // 4. Image Alt & OG Image (10 Points)
    if (input.ogImage && input.ogImage.startsWith('http')) {
      score += 10;
    } else {
      score += 4;
      errors.push({
        code: 'MISSING_OG_IMAGE',
        message: 'Featured social sharing Open Graph image is missing or non-absolute.',
        severity: SeoIssueSeverity.MEDIUM,
      });
    }

    // 5. Internal Linking & Navigation (10 Points)
    score += 10;

    // 6. Structured Data (JSON-LD) (10 Points)
    if (input.hasStructuredData) {
      score += 10;
    } else {
      errors.push({
        code: 'MISSING_STRUCTURED_DATA',
        message: 'JSON-LD schema markup is missing for this entity.',
        severity: SeoIssueSeverity.MEDIUM,
      });
    }

    // 7. Robots & Indexing Directives (10 Points)
    if (input.robotsIndex !== false) {
      score += 10;
    } else {
      score += 5;
    }

    // 8. Technical Invariants (5 Points)
    const hasUnrenderedTokens = /\{[a-z0-9_]+\}/i.test(input.metaTitle || '') || /\{[a-z0-9_]+\}/i.test(input.metaDescription || '');
    if (!hasUnrenderedTokens) {
      score += 5;
    } else {
      errors.push({
        code: 'UNRENDERED_TOKENS',
        message: 'Metadata contains unreplaced template placeholders (e.g., {token}).',
        severity: SeoIssueSeverity.CRITICAL,
      });
    }

    return {
      score: Math.min(100, Math.max(0, score)),
      errors,
    };
  }
}
