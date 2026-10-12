import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PropertyDocument = Property & Document;

@Schema({ _id: false })
export class MultiLingualText {
  @Prop({ required: true })
  en: string;

  @Prop()
  hi?: string;

  @Prop()
  ar?: string;

  @Prop()
  ur?: string;
}

@Schema({ _id: false })
export class PropertyPrice {
  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'INR' })
  currency: string;

  @Prop({ default: 'TOTAL' })
  priceUnit?: string; // TOTAL, PER_SQ_FT, PER_MONTH, PER_YEAR, PER_BED, PER_ROOM

  @Prop({ default: true })
  isNegotiable: boolean;

  @Prop({ default: 0 })
  maintenance?: number;

  @Prop({ default: 'OWNER' })
  maintenancePayer?: string; // OWNER, TENANT

  @Prop({ default: 0 })
  securityDeposit?: number;

  @Prop()
  rentPeriod?: string; // MONTHLY, YEARLY, LEASE_TERM

  @Prop()
  bookingAmount?: number;

  @Prop()
  pricePerSqFt?: number;

  @Prop()
  leaseDurationMonths?: number;

  @Prop()
  noticePeriodMonths?: number;

  @Prop()
  lockInPeriodMonths?: number;

  @Prop()
  rentEscalationPercentage?: number;

  @Prop()
  preferredTenantType?: string; // Family, Bachelors, Company Lease, Any

  @Prop()
  brokerageAmount?: number;

  // PG / Co-living specific
  @Prop()
  pgPricingModel?: string; // PER_BED, PER_ROOM

  @Prop()
  occupancyType?: string; // Single, Double, Triple, Four+

  @Prop({ default: false })
  mealsIncluded?: boolean;

  @Prop()
  foodPreferences?: string; // Veg Only, Veg & Non-Veg

  @Prop()
  genderAccommodation?: string; // Male, Female, Coed/Unisex

  @Prop({ type: [String], default: [] })
  includedFacilities?: string[];
}

@Schema({ _id: false })
export class PropertyLocation {
  @Prop({ default: 'Uttar Pradesh' })
  state: string;

  @Prop({ default: 'Lucknow' })
  district: string;

  @Prop({ default: 'Lucknow' })
  city: string;

  @Prop({ required: true })
  locality: string;

  @Prop()
  landmark?: string;

  @Prop()
  pincode?: string;

  @Prop({ type: [Number], default: [80.9462, 26.8467] })
  coordinates: [number, number]; // [longitude, latitude]

  @Prop({ index: true })
  countryId?: string;

  @Prop({ index: true })
  stateId?: string;

  @Prop({ index: true })
  districtId?: string;

  @Prop({ index: true })
  cityId?: string;

  @Prop({ index: true })
  localityId?: string;

  @Prop({ index: true })
  subLocalityId?: string;

  @Prop({ index: true })
  pincodeId?: string;
}

@Schema({ _id: false })
export class PropertySpecs {
  @Prop()
  bedrooms?: number;

  @Prop()
  bathrooms?: number;

  @Prop()
  balconies?: number;

  @Prop()
  area?: number;

  @Prop({ default: 'SQ_FT' })
  areaUnit?: string; // SQ_FT, SQ_YARDS, SQ_METER, ACRES, BIGHAS, GUNTHA

  @Prop()
  carpetArea?: number;

  @Prop()
  carpetAreaSqFt?: number;

  @Prop()
  builtUpArea?: number;

  @Prop()
  superBuiltUpArea?: number;

  @Prop({ default: 'READY_TO_MOVE' })
  constructionStatus: string; // READY_TO_MOVE, UNDER_CONSTRUCTION, RESALE, NEW_LAUNCH

  @Prop({ default: 'SEMI_FURNISHED' })
  furnishing?: string; // UNFURNISHED, SEMI_FURNISHED, FULLY_FURNISHED, BARE_SHELL, WARM_SHELL

  @Prop({ default: 'East' })
  facing?: string; // North, East, West, South, North-East, North-West, South-East, South-West

  @Prop({ default: '1 Covered' })
  parking?: string;

  @Prop()
  floorLevel?: string;

  @Prop()
  floorNumber?: string;

  @Prop()
  totalFloors?: number;

  @Prop()
  propertyAge?: string; // 0-1 years, 1-5 years, 5-10 years, 10+ years, Under Construction

  @Prop()
  ownershipType?: string; // FREEHOLD, LEASEHOLD, POWER_OF_ATTORNEY, COOPERATIVE

  @Prop()
  possessionStatus?: string; // Ready to Move, Under Construction

  @Prop()
  possessionDate?: string;

  @Prop()
  availableFrom?: string;

  // Land & Plots Specific
  @Prop()
  plotDimensions?: string; // e.g., 30 x 50 ft

  @Prop()
  cornerPlot?: boolean;

  @Prop()
  boundaryWall?: boolean;

  @Prop()
  openSides?: number;

  @Prop()
  roadWidthFt?: number;

  @Prop()
  soilType?: string;

  @Prop()
  landZone?: string; // Residential Zone, Commercial Zone, Agricultural, Industrial

  // Commercial Specific
  @Prop()
  washrooms?: number;

  @Prop()
  cabins?: number;

  @Prop()
  workstations?: number;

  @Prop()
  pantry?: string; // DRY, WET, NONE

  @Prop()
  powerBackupKva?: number;

  @Prop({ type: [String], default: [] })
  suitableFor?: string[];

  @Prop({ type: [String], default: [] })
  includedAppliances?: string[];
}

@Schema({ _id: false })
export class PropertyMediaItem {
  @Prop({ required: true })
  url: string;

  @Prop({ default: 'IMAGE' })
  type: string; // IMAGE, VIDEO, FLOORPLAN, BROCHURE

  @Prop()
  caption?: string;

  @Prop({ default: 0 })
  sortOrder?: number;
}

@Schema({ _id: false })
export class PropertyMedia {
  @Prop({ required: true })
  thumbnailUrl: string;

  @Prop()
  coverImage?: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [String], default: [] })
  videos?: string[];

  @Prop()
  videoUrl?: string; // Primary property video (YouTube or uploaded media URL)

  @Prop({ default: 'YOUTUBE' })
  videoType?: string; // YOUTUBE, LOCAL, EMBED

  @Prop()
  videoThumbnail?: string; // High-res poster/thumbnail for video

  @Prop({ default: 'IMAGE' })
  primaryMediaType?: string; // IMAGE or VIDEO

  @Prop({ type: [PropertyMediaItem], default: [] })
  items?: PropertyMediaItem[];
}

@Schema({ _id: false })
export class PropertyAdvertiser {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  email?: string;

  @Prop({ default: false })
  isVerifiedAgent: boolean;

  @Prop({ default: 'PROPERTY_OWNER' })
  role?: string;

  @Prop()
  agencyName?: string;

  @Prop()
  reraNumber?: string;
}

@Schema({ _id: false })
export class ModerationHistoryEntry {
  @Prop({ required: true })
  action: string; // CREATED, SUBMITTED, APPROVED, REJECTED, PUBLISHED, UNPUBLISHED, ARCHIVED, EDITED

  @Prop({ required: true })
  actorId: string;

  @Prop({ required: true })
  actorRole: string;

  @Prop()
  previousStatus?: string;

  @Prop()
  newStatus?: string;

  @Prop()
  reason?: string;

  @Prop()
  remarks?: string;

  @Prop({ default: Date.now })
  timestamp: Date;
}

@Schema({ _id: false })
export class ModerationMetadata {
  @Prop()
  approvedBy?: string;

  @Prop()
  approvedAt?: Date;

  @Prop()
  publishedAt?: Date;

  @Prop()
  rejectedBy?: string;

  @Prop()
  rejectedAt?: Date;

  @Prop()
  rejectionReason?: string;

  @Prop()
  adminRemark?: string;

  @Prop()
  moderationRemarks?: string;

  @Prop()
  previousStatus?: string;

  @Prop({ default: 'LOW', enum: ['LOW', 'MEDIUM', 'HIGH'] })
  riskScore?: string;

  @Prop({ type: [String], default: [] })
  reasonsFlagged?: string[];

  @Prop({ type: [ModerationHistoryEntry], default: [] })
  history?: ModerationHistoryEntry[];
}

@Schema({ _id: false })
export class PropertySeo {
  @Prop()
  metaTitle?: string;

  @Prop()
  metaDescription?: string;

  @Prop()
  canonicalSlug?: string;
}

@Schema({ _id: false })
export class PropertyReraAuditEntry {
  @Prop({ required: true })
  action: string; // SUBMITTED, VERIFIED, REJECTED, UPDATED

  @Prop({ required: true })
  actorId: string;

  @Prop({ required: true })
  actorRole: string;

  @Prop()
  previousStatus?: string;

  @Prop()
  newStatus?: string;

  @Prop()
  notes?: string;

  @Prop({ default: Date.now })
  timestamp: Date;
}

@Schema({ _id: false })
export class PropertyRera {
  @Prop({ default: 'NOT_APPLICABLE', enum: ['YES', 'NO', 'NOT_APPLICABLE'] })
  reraRegistered: string; // YES, NO, NOT_APPLICABLE

  @Prop()
  isReraRegistered?: string; // Alias for reraRegistered

  @Prop({ index: true })
  reraNumber?: string;

  @Prop()
  reraState?: string; // e.g. UP-RERA, MahaRERA, Delhi RERA

  @Prop()
  reraAuthority?: string;

  @Prop()
  authority?: string; // Alias for reraAuthority

  @Prop()
  reraProjectName?: string;

  @Prop()
  projectName?: string; // Alias for reraProjectName

  @Prop()
  certificateUrl?: string;

  @Prop({
    default: 'NOT_APPLICABLE',
    enum: ['PENDING', 'VERIFIED', 'REJECTED', 'NOT_APPLICABLE'],
    index: true,
  })
  verificationStatus: string; // PENDING, VERIFIED, REJECTED, NOT_APPLICABLE

  @Prop()
  exemptionReason?: string; // Reason why RERA is not applicable

  @Prop()
  verifiedBy?: string;

  @Prop()
  verifiedAt?: Date;

  @Prop()
  rejectionNotes?: string;

  @Prop({ type: [PropertyReraAuditEntry], default: [] })
  auditHistory?: PropertyReraAuditEntry[];
}

@Schema({ timestamps: true })
export class Property {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ index: true })
  referenceId?: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ index: true })
  ownerId?: string;

  @Prop({ index: true })
  advertiserId?: string;

  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;

  @Prop({ type: MultiLingualText, required: true })
  title: MultiLingualText;

  @Prop({ type: MultiLingualText, required: true })
  description: MultiLingualText;

  @Prop({ required: true, index: true })
  category: string;

  @Prop({ index: true })
  subcategory?: string;

  @Prop({
    required: true,
    enum: ['SALE', 'RENT', 'LEASE', 'PG_COLIVING', 'COMMERCIAL_LEASE'],
    default: 'SALE',
    index: true,
  })
  listingType: string;

  @Prop({ type: PropertyPrice, required: true })
  price: PropertyPrice;

  @Prop({ type: PropertyLocation, required: true })
  location: PropertyLocation;

  @Prop({ type: PropertySpecs, default: () => ({}) })
  specs: PropertySpecs;

  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({ type: PropertyMedia, required: true })
  media: PropertyMedia;

  @Prop({ type: PropertyAdvertiser, required: true })
  advertiser: PropertyAdvertiser;

  @Prop({ type: PropertyRera, default: () => ({ reraRegistered: 'NOT_APPLICABLE', verificationStatus: 'NOT_APPLICABLE' }) })
  rera?: PropertyRera;

  @Prop({ index: true })
  reraNumber?: string;

  @Prop({
    default: 'DRAFT',
    enum: [
      'DRAFT',
      'PENDING_REVIEW',
      'PENDING_APPROVAL',
      'APPROVED',
      'PUBLISHED',
      'REJECTED',
      'UNPUBLISHED',
      'ARCHIVED',
      'ACTIVE',
      'SOLD_OR_RENTED',
    ],
    index: true,
  })
  status: string;

  @Prop({ default: false, index: true })
  isPublished: boolean;

  @Prop()
  publishedAt?: Date;

  @Prop()
  unpublishedAt?: Date;

  @Prop()
  archivedAt?: Date;

  @Prop({ type: ModerationMetadata, default: () => ({}) })
  moderation?: ModerationMetadata;

  @Prop({ default: false, index: true })
  isFeatured: boolean;

  @Prop()
  featuredAt?: Date;

  @Prop({ index: true })
  featuredUntil?: Date;

  @Prop()
  featuredPaymentId?: string;

  @Prop({ type: PropertySeo, default: () => ({}) })
  seo?: PropertySeo;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PropertySchema = SchemaFactory.createForClass(Property);

PropertySchema.index({ createdAt: -1 });
PropertySchema.index({ status: 1, isPublished: 1 });
PropertySchema.index({ category: 1, status: 1 });
PropertySchema.index({ subcategory: 1, status: 1 });
PropertySchema.index({ listingType: 1, status: 1 });
PropertySchema.index({ 'rera.verificationStatus': 1, status: 1 });
PropertySchema.index({ 'location.city': 1, status: 1 });
PropertySchema.index({ 'location.cityId': 1, status: 1 });
PropertySchema.index({ 'location.localityId': 1, status: 1 });
PropertySchema.index({ 'location.stateId': 1, status: 1 });
PropertySchema.index({ 'location.state': 1, 'location.city': 1, status: 1 });
PropertySchema.index({ ownerId: 1, createdAt: -1 });
PropertySchema.index({ isFeatured: -1, createdAt: -1 });
PropertySchema.index({ status: 1, isPublished: 1, 'price.amount': 1 });
PropertySchema.index({ status: 1, isPublished: 1, publishedAt: -1 });
PropertySchema.index({ status: 1, isPublished: 1, 'specs.bedrooms': 1 });
PropertySchema.index({ status: 1, isPublished: 1, 'specs.carpetAreaSqFt': 1 });
PropertySchema.index(
  {
    'title.en': 'text',
    'title.hi': 'text',
    'description.en': 'text',
    'location.locality': 'text',
    'location.city': 'text',
    referenceId: 'text',
  },
  {
    name: 'PropertyTextSearchIndex',
    weights: {
      'title.en': 10,
      'title.hi': 10,
      'location.locality': 6,
      'location.city': 5,
      referenceId: 8,
      'description.en': 2,
    },
  },
);
