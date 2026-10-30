import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SeoMetadataDocument = SeoMetadata & Document;
export type SeoSettingsDocument = SeoSettings & Document;
export type SeoRedirectDocument = SeoRedirect & Document;
export type SeoAuditIssueDocument = SeoAuditIssue & Document;

export enum SeoEntityType {
  PROPERTY = 'PROPERTY',
  PAGE = 'PAGE',
  LOCATION = 'LOCATION',
  CATEGORY = 'CATEGORY',
  PROJECT = 'PROJECT',
  BLOG = 'BLOG',
  CUSTOM = 'CUSTOM',
}

export enum SeoApprovalStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum SeoGenerationMode {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
  AI_ASSISTED = 'AI_ASSISTED',
}

export enum SeoGenerationStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  APPROVED = 'APPROVED',
  FAILED = 'FAILED',
}

export enum SeoIssueSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

@Schema({ _id: false })
export class SeoValidationError {
  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  message: string;

  @Prop({ enum: SeoIssueSeverity, default: SeoIssueSeverity.LOW })
  severity: SeoIssueSeverity;
}

@Schema({ _id: false })
export class SeoFieldLocks {
  @Prop({ default: false })
  metaTitle: boolean;

  @Prop({ default: false })
  metaDescription: boolean;

  @Prop({ default: false })
  canonicalUrl: boolean;

  @Prop({ default: false })
  openGraph: boolean;

  @Prop({ default: false })
  structuredData: boolean;
}

@Schema({ timestamps: true, collection: 'seo_metadata' })
export class SeoMetadata {
  @Prop({ required: true, enum: SeoEntityType, index: true })
  entityType: SeoEntityType;

  @Prop({ required: false, index: true })
  entityId?: string;

  @Prop({ required: true, default: 'PAGE' })
  pageType: string;

  @Prop({ required: true, unique: true, index: true })
  pagePath: string;

  @Prop({ required: false })
  canonicalUrl: string;

  @Prop({ required: false, index: true })
  slug?: string;

  @Prop({ required: true })
  metaTitle: string;

  @Prop({ required: true })
  metaDescription: string;

  @Prop({ required: false })
  focusKeyword?: string;

  @Prop({ type: [String], default: [] })
  relatedKeywords: string[];

  @Prop({ default: true, index: true })
  robotsIndex: boolean;

  @Prop({ default: true })
  robotsFollow: boolean;

  @Prop({ required: false })
  openGraphTitle?: string;

  @Prop({ required: false })
  openGraphDescription?: string;

  @Prop({ required: false })
  openGraphImage?: string;

  @Prop({ default: 'summary_large_image' })
  twitterCardType: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: false })
  structuredData?: Record<string, any>;

  @Prop({ enum: SeoGenerationMode, default: SeoGenerationMode.AUTO })
  generationMode: SeoGenerationMode;

  @Prop({ enum: SeoGenerationStatus, default: SeoGenerationStatus.GENERATED })
  generationStatus: SeoGenerationStatus;

  @Prop({ enum: SeoApprovalStatus, default: SeoApprovalStatus.APPROVED, index: true })
  approvalStatus: SeoApprovalStatus;

  @Prop({ required: false })
  approvedBy?: string;

  @Prop({ required: false })
  approvedAt?: Date;

  @Prop({ default: Date.now })
  generatedAt: Date;

  @Prop({ required: false })
  lastAuditedAt?: Date;

  @Prop({ default: 85, min: 0, max: 100 })
  seoScore: number;

  @Prop({ type: [SeoValidationError], default: [] })
  validationErrors: SeoValidationError[];

  @Prop({ type: SeoFieldLocks, default: () => ({}) })
  fieldLocks: SeoFieldLocks;

  @Prop({ default: 1 })
  templateVersion: number;

  @Prop({ type: MongooseSchema.Types.Mixed, required: false })
  sourceSnapshot?: Record<string, any>;
}

export const SeoMetadataSchema = SchemaFactory.createForClass(SeoMetadata);
SeoMetadataSchema.index({ entityType: 1, entityId: 1 });
SeoMetadataSchema.index({ approvalStatus: 1, robotsIndex: 1 });
SeoMetadataSchema.index({ seoScore: 1 });

@Schema({ timestamps: true, collection: 'seo_settings' })
export class SeoSettings {
  @Prop({ required: true, default: 'MyProperty Real Estate Marketplace' })
  websiteName: string;

  @Prop({ required: true, default: 'https://casa-real-estate-mocha.vercel.app' })
  productionDomain: string;

  @Prop({ required: true, default: '| MyProperty' })
  defaultTitleSuffix: string;

  @Prop({
    required: true,
    default:
      'Explore verified real estate properties to buy, rent, and invest across India with MyProperty Marketplace.',
  })
  defaultDescription: string;

  @Prop({ required: false, default: '/og-image.jpg' })
  defaultOgImage: string;

  @Prop({ required: true, default: 'en' })
  defaultLocale: string;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: () => ({
      homepageTitleTemplate: '{websiteName} | Find Properties to Buy, Rent & Invest',
      homepageDescTemplate:
        'Search verified residential and commercial properties for sale and rent across India on {websiteName}.',
      propertyTitleTemplate:
        '{bedrooms} {propertyType} for {listingPurpose} in {locality}, {city} {titleSuffix}',
      propertyDescTemplate:
        'Explore this {bedrooms} {propertyType} for {listingPurpose} in {locality}, {city}. View verified pricing, amenities, area specs, and photos on {websiteName}.',
      locationTitleTemplate:
        'Properties in {city}, {state} for Sale & Rent {titleSuffix}',
      locationDescTemplate:
        'Browse verified residential and commercial properties in {city}, {state}. View latest listings, price trends, and local inventory on {websiteName}.',
      categoryTitleTemplate:
        '{category} for Sale & Rent in India {titleSuffix}',
      categoryDescTemplate:
        'Explore verified {category} across top locations in India on {websiteName}.',
      fallbackTitleTemplate: '{pageTitle} {titleSuffix}',
      fallbackDescTemplate:
        'Verified real estate opportunities, listings, and market data on {websiteName}.',
    }),
  })
  templates: {
    homepageTitleTemplate: string;
    homepageDescTemplate: string;
    propertyTitleTemplate: string;
    propertyDescTemplate: string;
    locationTitleTemplate: string;
    locationDescTemplate: string;
    categoryTitleTemplate: string;
    categoryDescTemplate: string;
    fallbackTitleTemplate: string;
    fallbackDescTemplate: string;
  };

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: () => ({
      autoGenerateOnCreate: true,
      autoRegenerateOnUpdate: true,
      approvalMode: 'AUTOMATIC', // 'AUTOMATIC' | 'MANUAL'
      aiEnabled: false,
    }),
  })
  automation: {
    autoGenerateOnCreate: boolean;
    autoRegenerateOnUpdate: boolean;
    approvalMode: 'AUTOMATIC' | 'MANUAL';
    aiEnabled: boolean;
  };

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: () => ({
      defaultRobotsIndex: true,
      defaultRobotsFollow: true,
      noindexEmptyLocations: true,
      soldPropertyPolicy: 'KEEP_INDEXED_UPDATE_SCHEMA', // 'KEEP_INDEXED_UPDATE_SCHEMA' | 'NOINDEX' | 'REMOVE_410'
    }),
  })
  indexing: {
    defaultRobotsIndex: boolean;
    defaultRobotsFollow: boolean;
    noindexEmptyLocations: boolean;
    soldPropertyPolicy: 'KEEP_INDEXED_UPDATE_SCHEMA' | 'NOINDEX' | 'REMOVE_410';
  };

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: () => ({
      autoRegenerateSitemap: true,
      excludePrivateAndDraft: true,
      batchSize: 500,
    }),
  })
  sitemap: {
    autoRegenerateSitemap: boolean;
    excludePrivateAndDraft: boolean;
    batchSize: number;
  };

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: () => ({
      customDirectives: 'User-agent: *\nAllow: /\nDisallow: /dashboard/\nDisallow: /admin/\nDisallow: /private/',
    }),
  })
  robotsTxt: {
    customDirectives: string;
  };
}

export const SeoSettingsSchema = SchemaFactory.createForClass(SeoSettings);

@Schema({ timestamps: true, collection: 'seo_redirects' })
export class SeoRedirect {
  @Prop({ required: true, unique: true, index: true })
  oldPath: string;

  @Prop({ required: true })
  newPath: string;

  @Prop({ required: false, index: true })
  oldSlug?: string;

  @Prop({ required: false })
  newSlug?: string;

  @Prop({ required: true, default: 'PROPERTY' })
  entityType: string;

  @Prop({ required: false })
  entityId?: string;

  @Prop({ default: 301 })
  statusCode: number;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const SeoRedirectSchema = SchemaFactory.createForClass(SeoRedirect);

@Schema({ timestamps: true, collection: 'seo_audit_issues' })
export class SeoAuditIssue {
  @Prop({ required: true, index: true })
  url: string;

  @Prop({ required: true, default: 'PROPERTY' })
  entityType: string;

  @Prop({ required: false, index: true })
  entityId?: string;

  @Prop({ required: true })
  issueType: string;

  @Prop({ required: true, enum: SeoIssueSeverity, index: true })
  severity: SeoIssueSeverity;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true })
  recommendedFix: string;

  @Prop({ default: false, index: true })
  resolved: boolean;
}

export const SeoAuditIssueSchema = SchemaFactory.createForClass(SeoAuditIssue);
SeoAuditIssueSchema.index({ severity: 1, resolved: 1 });
