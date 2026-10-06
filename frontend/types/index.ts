export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MODERATOR'
  | 'VERIFIED_AGENT'
  | 'AGENT'
  | 'PROPERTY_OWNER'
  | 'PURCHASER';

export type AccountStatus =
  | 'ACTIVE'
  | 'PENDING_VERIFICATION'
  | 'SUSPENDED'
  | 'DEACTIVATED';

export interface User {
  id: string;
  name: string;
  mobile: string;
  normalizedMobile: string;
  email?: string;
  role: UserRole;
  status: AccountStatus;
  isVerifiedAgent: boolean;
  avatar?: string;
  agencyName?: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  tokens: AuthTokens;
}

export interface OtpRequestResponse {
  success: boolean;
  message: string;
  normalizedMobile: string;
  expiresInSeconds: number;
  cooldownSeconds: number;
  provider: string;
  isMock: boolean;
  devMockOtp?: string;
}

export type ListingType = 'SALE' | 'RENT' | 'LEASE';

export type PropertyStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'UNPUBLISHED'
  | 'ARCHIVED'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'SOLD_OR_RENTED'
  | 'SUSPENDED';

export type ConstructionStatus =
  | 'UNDER_CONSTRUCTION'
  | 'READY_TO_MOVE'
  | 'RESALE'
  | 'NEW_LAUNCH';

export type FurnishingStatus = 'FURNISHED' | 'SEMI_FURNISHED' | 'UNFURNISHED';

export interface LocalizedText {
  en: string;
  hi?: string;
  ar?: string;
  ur?: string;
}

export interface ModerationMetadata {
  approvedBy?: string;
  approvedAt?: string;
  publishedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  adminRemark?: string;
  moderationRemarks?: string;
  previousStatus?: string;
  riskScore?: 'LOW' | 'MEDIUM' | 'HIGH';
  reasonsFlagged?: string[];
}

export interface PropertySpecs {
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  areaUnit?: string;
  carpetArea?: number;
  carpetAreaSqFt?: number;
  constructionStatus?: ConstructionStatus;
  furnishing?: FurnishingStatus;
  facing?: string;
  parking?: string;
  floorLevel?: string;
  floorNumber?: string;
  totalFloors?: number;
  propertyAge?: string;
}

export interface Property {
  id: string;
  referenceId?: string;
  slug: string;
  ownerId?: string;
  advertiserId?: string;
  title: LocalizedText;
  description: LocalizedText;
  category: string;
  listingType: ListingType;
  price: {
    amount: number;
    currency?: string;
    priceUnit?: string;
    isNegotiable?: boolean;
    maintenance?: number;
    securityDeposit?: number;
    rentPeriod?: string;
  };
  location: {
    state?: string;
    district?: string;
    city?: string;
    locality: string;
    landmark?: string;
    pincode?: string;
    coordinates?: [number, number];
  };
  specs?: PropertySpecs;
  amenities?: string[];
  media: {
    thumbnailUrl: string;
    coverImage?: string;
    images: string[];
    videos?: string[];
  };
  advertiser: {
    name: string;
    phone: string;
    email?: string;
    isVerifiedAgent: boolean;
    role?: string;
    agencyName?: string;
  };
  status: PropertyStatus;
  isPublished?: boolean;
  publishedAt?: string;
  isFeatured?: boolean;
  moderation?: ModerationMetadata;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export type PropertySortOption =
  | 'newest'
  | 'oldest'
  | 'price_low'
  | 'price_high'
  | 'area_low'
  | 'area_high'
  | 'featured'
  | 'relevance';

export type ListingFreshnessOption =
  | 'all'
  | 'today'
  | 'last_3_days'
  | 'last_7_days'
  | 'last_30_days';

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

export interface SearchPropertiesParams {
  q?: string;
  category?: string;
  listingType?: string;
  state?: string;
  district?: string;
  city?: string;
  locality?: string;
  pincode?: string;
  locationId?: string;
  countryId?: string;
  stateId?: string;
  districtId?: string;
  cityId?: string;
  localityId?: string;
  pincodeId?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  minArea?: number | string;
  maxArea?: number | string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  constructionStatus?: string;
  propertyAge?: string;
  furnishing?: string;
  facing?: string;
  amenities?: string;
  freshness?: string;
  featured?: boolean | string;
  lat?: number;
  lng?: number;
  radius?: number;
  sort?: PropertySortOption;
  page?: number;
  limit?: number;
}

export type LocationType =
  | 'COUNTRY'
  | 'STATE'
  | 'DISTRICT'
  | 'CITY'
  | 'LOCALITY'
  | 'SUB_LOCALITY'
  | 'PINCODE';

export interface LocationItem {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  type: LocationType;
  parentId?: any;
  countryCode?: string;
  stateCode?: string;
  districtCode?: string;
  cityCode?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  aliases?: string[];
  localizedNames?: {
    en: string;
    hi?: string;
    ar?: string;
    ur?: string;
  };
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

export interface LocationAutocompleteItem {
  id: string;
  name: string;
  slug: string;
  type: LocationType;
  pincode?: string;
  stateCode?: string;
  parentName?: string;
  city?: string;
  state?: string;
  fullPath: string;
  latitude?: number;
  longitude?: number;
  isFeatured?: boolean;
}

export type AgentVerificationStatus = 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export type AgentDocumentType =
  | 'RERA_CERTIFICATE'
  | 'AGENCY_LICENSE'
  | 'IDENTITY_DOCUMENT'
  | 'ADDRESS_PROOF'
  | 'OTHER';

export type AgentDocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AgentDocument {
  id?: string;
  _id?: string;
  agentId: string;
  userId: string;
  documentType: AgentDocumentType;
  documentUrl: string;
  documentName: string;
  mimeType?: string;
  fileSize?: number;
  documentNumber?: string;
  status: AgentDocumentStatus;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgentProfile {
  id?: string;
  _id?: string;
  userId: string;
  agencyName?: string;
  agencyLogo?: string;
  profileImage?: string;
  displayName: string;
  slug?: string;
  professionalTitle?: string;
  bio?: string;
  experienceYears?: number;
  phone?: string;
  email?: string;
  website?: string;
  socialLinks?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  officeAddress?: {
    address?: string;
    locality?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  areasServed?: string[];
  specializations?: string[];
  languages?: string[];
  reraNumber?: string;
  reraState?: string;
  reraAuthority?: string;
  reraStatus?: string;
  verificationStatus: AgentVerificationStatus;
  isVerifiedAgent: boolean;
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgentDashboardData {
  agent: {
    userId: string;
    name: string;
    mobile: string;
    email?: string;
    role: string;
    isVerifiedAgent: boolean;
    verificationStatus: AgentVerificationStatus;
  };
  profile: AgentProfile | null;
  counts: {
    totalListings: number;
    publishedListings: number;
    pendingReviewListings: number;
    draftListings: number;
    rejectedListings: number;
    archivedListings: number;
    totalLeads: number;
    newLeads: number;
    followUpsDue: number;
  };
  analytics: {
    propertyViews: number;
    whatsappClicks: number;
    callClicks: number;
    enquirySubmissions: number;
  };
  recentListings: Property[];
  recentLeads: Lead[];
  recentActivity: any[];
}

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'FOLLOW_UP'
  | 'QUALIFIED'
  | 'INTERESTED'
  | 'SITE_VISIT'
  | 'NEGOTIATION'
  | 'CONVERTED'
  | 'LOST'
  | 'CANCELLED'
  | 'CLOSED';

export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type LeadSource =
  | 'PROPERTY_PAGE'
  | 'PROPERTY_ENQUIRY'
  | 'WHATSAPP'
  | 'CALL'
  | 'PHONE'
  | 'WEBSITE'
  | 'REFERRAL'
  | 'CAMPAIGN'
  | 'CONTACT_FORM'
  | 'SEARCH'
  | 'DIRECT'
  | 'OTHER';

export interface LeadNoteItem {
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface LeadActivityItem {
  _id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  type: string;
  note: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface LeadFollowUpItem {
  _id: string;
  assignedTo: string;
  dueAt: string;
  type: string;
  note: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  completedAt?: string;
  createdBy: string;
  createdAt: string;
}

export interface LeadKPIs {
  totalLeads: number;
  newLeads: number;
  activeLeads: number;
  siteVisits: number;
  negotiations: number;
  converted: number;
  lost: number;
  unassigned: number;
  followUpsDue: number;
  conversionRate: number;
}

export interface Lead {
  id?: string;
  _id?: string;
  propertyId?: string;
  property?: {
    id?: string;
    slug?: string;
    title?: string;
    price?: number;
    category?: string;
    location?: string;
    thumbnailUrl?: string;
    advertiser?: any;
  };
  propertyTitle?: string;
  propertySlug?: string;
  propertyLocation?: string;
  propertyPrice?: number;
  agentId?: string;
  assignedAgentId?: string;
  assignedAgent?: { id: string; name: string; mobile: string; role: string };
  assignedBy?: string;
  ownerId?: string;
  purchaserId?: string;
  name: string;
  contactName?: string;
  mobile: string;
  contactPhone?: string;
  email?: string;
  contactEmail?: string;
  subject?: string;
  message: string;
  budget?: { min?: number; max?: number; currency?: string };
  preferredLocation?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  notes?: LeadNoteItem[] | any[];
  activities?: LeadActivityItem[];
  activity?: LeadActivityItem[];
  followUps?: LeadFollowUpItem[];
  notesCount?: number;
  activitiesCount?: number;
  pendingFollowUpsCount?: number;
  assignedAt?: string;
  firstContactAt?: string;
  lastContactAt?: string;
  nextFollowUpAt?: string;
  convertedAt?: string;
  lostAt?: string;
  lostReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadQuery {
  page?: number;
  limit?: number;
  status?: LeadStatus;
  priority?: LeadPriority;
  source?: LeadSource;
  agentId?: string;
  unassigned?: string;
  propertyId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  q?: string;
}

export interface PurchaserPreferences {
  preferredLanguage?: string;
  preferredCity?: string;
  preferredLocation?: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredCategory?: string;
  preferredListingType?: string;
  bedrooms?: number;
  furnishing?: string;
}

export interface PurchaserProfile {
  id: string;
  name: string;
  mobile: string;
  normalizedMobile: string;
  email?: string;
  role: UserRole;
  status: AccountStatus;
  avatar?: string;
  metadata?: PurchaserPreferences;
  createdAt?: string;
  updatedAt?: string;
}

export interface SavedPropertyItem {
  savedId: string;
  savedAt: string;
  property: Property;
}

export interface RecentlyViewedItem {
  viewedAt: string;
  property: Property;
}

export interface PurchaserEnquiryItem {
  id: string;
  propertyId: string;
  property?: {
    id: string;
    slug: string;
    title: string;
    price: number;
    category?: string;
    location?: string;
    thumbnailUrl?: string;
    advertiser?: {
      name: string;
      phone: string;
      role?: string;
      agencyName?: string;
    };
  };
  name: string;
  mobile: string;
  email?: string;
  message: string;
  source: string;
  status: string;
  priority: string;
  notesCount?: number;
  createdAt: string;
  updatedAt: string;
  lastContactAt?: string;
}

export interface PurchaserDashboardData {
  stats: {
    savedCount: number;
    enquiriesCount: number;
    recentlyViewedCount: number;
  };
  savedProperties: Property[];
  recentEnquiries: PurchaserEnquiryItem[];
  recommendedProperties: Property[];
  recentlyViewedProperties: Property[];
    user: {
    id: string;
    name: string;
    mobile: string;
    normalizedMobile: string;
    email?: string;
    role: string;
    avatar?: string;
    metadata?: PurchaserPreferences;
  };
}

export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type PaymentPurpose =
  | 'FEATURED_PROPERTY'
  | 'PROPERTY_LISTING'
  | 'PREMIUM_LISTING'
  | 'SUBSCRIPTION';

export interface PricingProduct {
  code: string;
  purpose: PaymentPurpose;
  name: string;
  description: string;
  amount: number;
  currency: string;
  durationDays: number;
  active: boolean;
}

export interface PaymentItem {
  id: string;
  orderId: string;
  provider: string;
  providerOrderId: string;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  purpose: PaymentPurpose;
  referenceId?: string;
  productCode?: string;
  productName?: string;
  metadata?: Record<string, any>;
  paidAt?: string;
  failedAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt: string;
}

export interface PaymentOrderResponse {
  success: boolean;
  orderId: string;
  providerOrderId: string;
  amount: number;
  amountInSubunits: number;
  currency: string;
  keyId: string;
  product: {
    code: string;
    name: string;
    description: string;
    durationDays: number;
  };
  paymentId: string;
}

export interface PaymentVerifyResponse {
  success: boolean;
  message: string;
  payment: {
    id: string;
    orderId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    purpose: PaymentPurpose;
    referenceId?: string;
    productName?: string;
    paidAt?: string;
  };
}


