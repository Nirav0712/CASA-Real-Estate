export type PlatformRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'USER';

export type AccountType =
  | 'DEVELOPER'
  | 'BROKER_AGENCY'
  | 'BROKER'
  | 'BROKER_AGENT'
  | 'AGENT'
  | 'PROPERTY_OWNER'
  | 'BUYER'
  | 'TENANT';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MODERATOR'
  | 'DEVELOPER'
  | 'AGENT'
  | 'BROKER'
  | 'PROPERTY_OWNER'
  | 'BUYER'
  | 'TENANT'
  | 'PURCHASER'
  | 'VERIFIED_AGENT'
  | 'GUEST'
  | (string & {});

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
  platformRole?: PlatformRole;
  accountType?: AccountType | null;
  role: UserRole;
  permissions?: string[];
  status: AccountStatus;
  isVerifiedAgent: boolean;
  avatar?: string;
  agencyName?: string;
  trialStartedAt?: string | null;
  trialExpiresAt?: string | null;
  trialPackageId?: string | null;
  isTrialActive?: boolean;
  trialUsed?: boolean;
  trialExpired?: boolean;
  isTrialEligible?: boolean;
  trialDaysRemaining?: number;
  trialRemainingLabel?: string;
  activePackageId?: string | null;
  kycStatus?: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXEMPT' | string;
  isKycExempt?: boolean;
  isKycRequired?: boolean;
  kycRejectionReason?: string | null;
  kycApprovedAt?: string | null;
  kycApprovedBy?: string | null;
  kycDocumentType?: string | null;
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

export interface RegisterData {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  role?: UserRole | string;
  accountType?: AccountType | string;
  agencyName?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  email: string;
  isEmailVerified: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface VerifyEmailData {
  email: string;
  token: string;
}

export interface ResendVerificationData {
  email: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface GenericAuthResponse {
  success: boolean;
  message: string;
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

export type ListingType =
  | 'SALE'
  | 'RENT'
  | 'LEASE'
  | 'PG_COLIVING'
  | 'COMMERCIAL_LEASE';

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
  balconies?: number;
  area?: number;
  areaUnit?: string;
  carpetArea?: number;
  carpetAreaSqFt?: number;
  builtUpArea?: number;
  superBuiltUpArea?: number;
  constructionStatus?: ConstructionStatus;
  furnishing?: FurnishingStatus;
  facing?: string;
  parking?: string;
  floorLevel?: string;
  floorNumber?: string;
  totalFloors?: number;
  propertyAge?: string;
  ownershipType?: string;
  possessionStatus?: string;
  possessionDate?: string;
  availableFrom?: string;
  plotDimensions?: string;
  cornerPlot?: boolean;
  boundaryWall?: boolean;
  openSides?: number;
  roadWidthFt?: number;
  soilType?: string;
  landZone?: string;
  washrooms?: number;
  cabins?: number;
  workstations?: number;
  pantry?: string;
  powerBackupKva?: number;
  suitableFor?: string[];
  includedAppliances?: string[];
}

export interface PropertyRera {
  reraRegistered?: 'YES' | 'NO' | 'NOT_APPLICABLE';
  isReraRegistered?: 'YES' | 'NO' | 'NOT_APPLICABLE';
  reraNumber?: string;
  reraState?: string;
  authority?: string;
  reraAuthority?: string;
  projectName?: string;
  reraProjectName?: string;
  certificateUrl?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NOT_APPLICABLE';
  exemptionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionNotes?: string;
  adminRemarks?: string;
  auditHistory?: any[];
}

export type PropertyStructureType =
  | 'INDEPENDENT'
  | 'MULTIPLE_UNITS_BUILDING'
  | 'COMMERCIAL_BUILDING'
  | 'RESIDENTIAL_BUILDING'
  | 'PLOTTED_DEVELOPMENT'
  | 'PROJECT_UNITS';

export type UnitAvailabilityStatus =
  | 'AVAILABLE'
  | 'UNDER_OFFER'
  | 'SOLD'
  | 'RENTED'
  | 'RESERVED';

export interface ProjectBuildingDetails {
  projectName?: string;
  buildingName?: string;
  buildingNumber?: string;
  towerName?: string;
  totalFloors?: number;
  totalTowers?: number;
  projectAddress?: string;
  developerName?: string;
  projectRera?: PropertyRera;
}

export interface PropertyUnitDetails {
  unitId: string;
  unitNumber: string;
  floorNumber?: string;
  towerName?: string;
  unitType?: string;
  carpetArea?: number;
  builtUpArea?: number;
  superBuiltUpArea?: number;
  areaUnit?: string;
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  facing?: string;
  furnishing?: string;
  amenities?: string[];
  possessionStatus?: string;
  availabilityStatus: UnitAvailabilityStatus;
  listingType: ListingType;
  price: number;
  pricePerSqFt?: number;
  monthlyRent?: number;
  securityDeposit?: number;
  maintenanceCharges?: number;
  preferredTenantType?: string;
  bachelorPreferences?: string;
  availableFrom?: string;
  photos?: string[];
  documents?: string[];
  unitRera?: PropertyRera;

  // Plotted development fields
  plotNumber?: string;
  plotType?: string;
  plotArea?: number;
  plotLength?: number;
  plotWidth?: number;
  frontage?: number;
  roadWidth?: number;
  cornerPlot?: boolean;
  openSides?: number;
}

export interface Property {
  id: string;
  referenceId?: string;
  slug: string;
  ownerId?: string;
  advertiserId?: string;
  title: LocalizedText;
  description?: LocalizedText;
  category: string;
  subcategory?: string;
  listingType: ListingType;
  price: {
    amount: number;
    currency?: string;
    priceUnit?: string;
    isNegotiable?: boolean;
    maintenance?: number;
    maintenancePayer?: 'OWNER' | 'TENANT';
    securityDeposit?: number;
    rentPeriod?: string;
    bookingAmount?: number;
    pricePerSqFt?: number;
    leaseDurationMonths?: number;
    noticePeriodMonths?: number;
    lockInPeriodMonths?: number;
    rentEscalationPercentage?: number;
    preferredTenantType?: string;
    bachelorPreferences?: string;
    brokerageAmount?: number;
    pgPricingModel?: 'PER_BED' | 'PER_ROOM';
    occupancyType?: string;
    mealsIncluded?: boolean;
    foodPreferences?: string;
    genderAccommodation?: string;
    includedFacilities?: string[];
  };
  location: {
    country?: string;
    state?: string;
    district?: string;
    city?: string;
    area?: string;
    subArea?: string;
    society?: string;
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
    videoUrl?: string;
    isReelFormat?: boolean;
    videoType?: 'YOUTUBE' | 'LOCAL' | 'EMBED';
    videoThumbnail?: string;
    primaryMediaType?: 'IMAGE' | 'VIDEO';
  };
  advertiser: {
    name: string;
    phone: string;
    email?: string;
    isVerifiedAgent: boolean;
    role?: string;
    agencyName?: string;
    reraNumber?: string;
  };
  rera?: PropertyRera;
  reraNumber?: string;
  status: PropertyStatus;
  isPublished?: boolean;
  publishedAt?: string;
  isFeatured?: boolean;
  isSuspendedByAccount?: boolean;
  moderation?: ModerationMetadata;
  structureType?: PropertyStructureType;
  isParentProject?: boolean;
  isChildUnit?: boolean;
  parentPropertyId?: string;
  parentSlug?: string;
  projectDetails?: ProjectBuildingDetails;
  unitDetails?: PropertyUnitDetails;
  units?: PropertyUnitDetails[];
  totalUnits?: number;
  availableUnits?: number;
  parentProject?: Partial<Property>;
  childUnitsList?: Partial<Property>[];
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
  subcategory?: string;
  listingType?: string;
  state?: string;
  district?: string;
  city?: string;
  area?: string;
  subArea?: string;
  society?: string;
  hasVideo?: boolean | string;
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
  possessionStatus?: string;
  preferredTenantType?: string;
  bachelorPreferences?: string;
  propertyAge?: string;
  furnishing?: string;
  facing?: string;
  amenities?: string;
  freshness?: string;
  featured?: boolean | string;
  reraStatus?: string;
  reraVerifiedOnly?: boolean | string;
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
  | 'GST_CERTIFICATE'
  | 'UDYAM_CERTIFICATE'
  | 'RERA_CERTIFICATE'
  | 'AADHAAR_CARD'
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
  frontDocumentUrl?: string;
  backDocumentUrl?: string;
  accountType?: string;
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
    kycStatus?: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | string;
    kycRejectionReason?: string | null;
    kycApprovedAt?: string | null;
    isTrialActive?: boolean;
    trialStartedAt?: string | null;
    trialExpiresAt?: string | null;
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


