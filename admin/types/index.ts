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
  | 'BROKER_AGENCY'
  | 'BROKER'
  | 'BROKER_AGENT'
  | 'AGENT'
  | 'PROPERTY_OWNER'
  | 'BUYER'
  | 'TENANT'
  | 'PURCHASER'
  | 'VERIFIED_AGENT'
  | 'GUEST';

export type AccountStatus =
  | 'ACTIVE'
  | 'PENDING_VERIFICATION'
  | 'SUSPENDED'
  | 'DEACTIVATED';

export interface ContactNumber {
  countryCode: string;
  number: string;
  isPrimary: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  mobile: string;
  normalizedMobile: string;
  email?: string;
  isEmailVerified?: boolean;
  hasPassword?: boolean;
  platformRole?: PlatformRole;
  accountType?: AccountType | null;
  role: UserRole;
  permissions?: string[];
  status: AccountStatus;
  avatar?: string;
}

export interface AdminAuthTokens {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AdminAuthResponse {
  success: boolean;
  message: string;
  user: AdminUser;
  tokens: AdminAuthTokens;
}

export interface LinkCredentialsPayload {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  email?: string;
  newPassword: string;
  confirmPassword: string;
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

export type ApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CHANGES_REQUESTED';

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
  listingType: string;
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

export interface AdminPropertyItem {
  id: string;
  _id?: string;
  referenceId?: string;
  slug?: string;
  ownerId?: string;
  advertiserId?: string;
  title: string;
  rawTitle?: any;
  description?: string;
  rawDescription?: any;
  category: string;
  subcategory?: string;
  listingType?: string;
  price: number;
  rawPrice?: any;
  location: string;
  rawLocation?: any;
  advertiserName: string;
  advertiserRole: string;
  advertiserPhone?: string;
  advertiser?: any;
  contactNumbers?: ContactNumber[];
  approvalStatus: ApprovalStatus;
  status: PropertyStatus;
  isPublished?: boolean;
  publishedAt?: string;
  unpublishedAt?: string;
  archivedAt?: string;
  submittedAt: string;
  createdAt?: string;
  updatedAt?: string;
  riskScore?: 'LOW' | 'MEDIUM' | 'HIGH';
  reasonsFlagged?: string[];
  rejectionReason?: string;
  adminRemark?: string;
  moderation?: ModerationMetadata;
  media?: {
    thumbnailUrl?: string;
    coverImage?: string;
    images?: string[];
    videos?: string[];
    videoUrl?: string;
    videoType?: 'YOUTUBE' | 'LOCAL' | 'EMBED';
    videoThumbnail?: string;
    primaryMediaType?: 'IMAGE' | 'VIDEO';
  };
  isFeatured?: boolean;
  specs?: any;
  amenities?: string[];
  rera?: PropertyRera;
  reraNumber?: string;

  // Multi-unit & project hierarchy
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
}

export interface AdminDashboardStats {
  pendingApprovalsCount: number;
  activeListingsCount: number;
  totalPropertiesCount?: number;
  parentProjectsCount?: number;
  childUnitsCount?: number;
  independentPropertiesCount?: number;
  rejectedCount?: number;
  registeredAgentsCount: number;
  totalEnquiriesThisMonth: number;
  monthlyRevenueEstimate: number;
}

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

export interface UserRecord {
  id: string;
  _id?: string;
  name: string;
  mobile: string;
  normalizedMobile: string;
  email?: string;
  platformRole?: PlatformRole;
  accountType?: AccountType | null;
  role: UserRole;
  customRoleId?: string | null;
  customRole?: {
    id: string;
    name: string;
    slug: string;
    isSystemRole?: boolean;
    permissions?: string[];
    dataScope?: string;
    dashboardConfig?: Record<string, boolean>;
  } | null;
  roleName?: string;
  status: AccountStatus;
  isVerifiedAgent: boolean;
  agencyName?: string;
  reraNumber?: string;
  hasPassword?: boolean;
  avatar?: string;
  propertyCount?: number;
  publishedCount?: number;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserDetailRecord extends UserRecord {
  propertySummary: {
    total: number;
    draft: number;
    pending: number;
    published: number;
    rejected: number;
    unpublished: number;
    archived: number;
  };
  properties: {
    id: string;
    slug?: string;
    title: string;
    category: string;
    listingType?: string;
    price: number;
    status: string;
    isPublished?: boolean;
    createdAt?: string;
  }[];
}

export interface AgentRecord {
  id: string;
  _id?: string;
  name: string;
  mobile: string;
  normalizedMobile: string;
  email?: string;
  agencyName: string;
  reraNumber: string;
  isVerifiedAgent: boolean;
  role: UserRole;
  status: AccountStatus;
  activeListings: number;
  totalListings: number;
  totalEmployees?: number;
  activeEmployees?: number;
  inactiveEmployees?: number;
  createdAt: string;
}

export interface PurchaserRecord {
  id: string;
  _id?: string;
  name: string;
  mobile: string;
  normalizedMobile: string;
  email?: string;
  role: UserRole;
  accountType?: AccountType | null;
  status: AccountStatus;
  planName?: string;
  planSlug?: string;
  planPrice?: number;
  billingPeriod?: string;
  planCategory?: 'FREE_TRIAL' | 'PAID_PLAN' | 'TRIAL_EXPIRED' | 'FREE_PLAN' | string;
  isTrial?: boolean;
  isExpired?: boolean;
  trialStartedAt?: string | null;
  trialExpiresAt?: string | null;
  daysRemaining?: number;
  savedProperties: number;
  totalEnquiries: number;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  _id?: string;
  action: string;
  actorUserId: string;
  actorName: string;
  actorRole: string;
  targetUserId?: string;
  targetUserName?: string;
  targetEntity?: string;
  targetEntityId?: string;
  previousValue?: any;
  newValue?: any;
  reason?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface AgentDocumentRecord {
  id?: string;
  _id?: string;
  agentId: string;
  userId: string;
  documentType: string;
  documentUrl: string;
  documentName: string;
  mimeType?: string;
  fileSize?: number;
  documentNumber?: string;
  status: string;
  uploadedAt: string;
  createdAt?: string;
}

export interface AgentProfileRecord {
  id?: string;
  _id?: string;
  userId: string;
  agencyName?: string;
  displayName?: string;
  reraNumber?: string;
  reraState?: string;
  reraAuthority?: string;
  verificationStatus?: string;
  isVerifiedAgent?: boolean;
}

export interface BrokerEmployeeRecord {
  id: string;
  _id?: string;
  name: string;
  email?: string;
  mobile: string;
  normalizedMobile?: string;
  designation?: string;
  role: string;
  status: string;
  permissions?: string[];
  assignedProperties?: string[];
  createdAt: string;
}

export interface AgentVerificationDetailResponse {
  agent: AgentRecord;
  profile: AgentProfileRecord | null;
  documents: AgentDocumentRecord[];
  employees?: BrokerEmployeeRecord[];
  employeeCounts?: {
    total: number;
    active: number;
    inactive: number;
  };
}

export interface FeaturedPropertyRequestRecord {
  id: string;
  _id?: string;
  requestReference: string;
  brokerId: string;
  brokerName?: string;
  brokerEmail?: string;
  brokerMobile?: string;
  propertyId: string;
  propertyTitle?: string;
  propertySlug?: string;
  propertyPrice?: number;
  propertyLocation?: string;
  propertyImage?: string;
  durationDays: number;
  requestedStartDate?: string;
  requestedEndDate?: string;
  price?: number;
  planName?: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  rejectionReason?: string;
  approvedStartDate?: string;
  approvedEndDate?: string;
  approvedDurationDays?: number;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type LocationType =
  | 'COUNTRY'
  | 'STATE'
  | 'DISTRICT'
  | 'CITY'
  | 'LOCALITY'
  | 'SUB_LOCALITY'
  | 'PINCODE';

export interface LocationRecord {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  type: LocationType;
  parentId?: any;
  ancestorIds?: any[];
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
  description?: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  propertyCount?: number;
  childrenCount?: number;
  children?: LocationRecord[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLocationInput {
  name: string;
  slug?: string;
  type: LocationType;
  parentId?: string | null;
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
  description?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
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

export interface LeadNoteRecord {
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface LeadActivityRecord {
  _id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  type: string;
  note: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface LeadFollowUpRecord {
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

export interface LeadRecord {
  id: string;
  _id?: string;
  propertyId: string;
  propertyTitle?: string;
  propertySlug?: string;
  propertyPrice?: number;
  propertyLocation?: string;
  propertyImage?: string;
  propertyUrl?: string;
  propertyAdvertiserName?: string;
  propertyAdvertiserPhone?: string;
  propertyAgencyName?: string;
  whatsappStatus?: 'PENDING' | 'SENT' | 'FAILED' | 'MOCK_SENT' | 'DISABLED';
  agentId?: string;
  assignedAgentId?: string;
  assignedAgent?: { id: string; name: string; mobile: string; role: string } | null;
  assignedBy?: string;
  ownerId?: string;
  brokerId?: string;
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
  notes?: LeadNoteRecord[];
  activities?: LeadActivityRecord[];
  followUps?: LeadFollowUpRecord[];
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

export interface PaymentRecord {
  id: string;
  orderId: string;
  userId: string;
  userName?: string;
  userMobile?: string;
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

export interface PaymentKPIs {
  totalRevenue: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
}

export interface PaymentAdminResponse {
  data: PaymentRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  metrics: PaymentKPIs;
}

export type SubscriptionRequestStatus = 'PENDING' | 'APPROVED' | 'DENIED';
export type SubscriptionContactMethod = 'WHATSAPP' | 'CALL';

export interface SubscriptionRequest {
  id: string;
  requestReference: string;
  userId?: string;
  userName?: string;
  userMobile?: string;
  userEmail?: string;
  packageId: string;
  planName: string;
  planPrice: number;
  billingPeriod: string;
  planFeatures: string[];
  contactMethod: SubscriptionContactMethod;
  status: SubscriptionRequestStatus;
  denialReason?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SubscriptionRequestAdminResponse {
  data: SubscriptionRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  metrics: {
    totalRequests: number;
    pending: number;
    approved: number;
    denied: number;
  };
}

export type DataScope = 'OWN' | 'TEAM' | 'ORGANIZATION' | 'ALL';

export interface DashboardConfig {
  canAccessCRM: boolean;
  canAccessAnalytics: boolean;
  canAccessSiteVisits: boolean;
  canAccessLeads: boolean;
  canAccessTeamManagement: boolean;
  canAccessMarketing: boolean;
  canAccessReports: boolean;
  canAccessBilling: boolean;
}

export interface RoleRecord {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  platformRole: PlatformRole;
  accountType?: AccountType | null;
  permissions: string[];
  dataScope: DataScope;
  dashboardConfig?: DashboardConfig;
  isSystemRole: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type BillingPeriod =
  | '1_MONTH'
  | '60_DAYS'
  | '90_DAYS'
  | '6_MONTHS'
  | '1_YEAR'
  | 'FREE'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'ANNUALLY'
  | 'YEARLY'
  | 'LIFETIME'
  | 'CUSTOM';

export interface PackageDurationPrice {
  durationMonths: number;
  amount: number;
  currency?: string;
  referenceMonthlyPrice?: number;
  isActive?: boolean;
}

export interface PackageLimits {
  propertyListingsMax: number;
  projectListings?: number;
  projectListingsMax?: number;
  propertyListings?: number;
  featuredListingsMax: number;
  propertyViewsMonthly: number;
  savedItemsMax: number;
  leadsMonthly: number;
  enquiriesMonthly: number;
  chatThreadsMax: number;
  teamMembersMax: number;
  teamMembers?: number;
}

export interface PackageRecord {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  billingPeriod: BillingPeriod;
  targetAccountTypes: AccountType[];
  eligibleUserTypes?: string[];
  durationPrices?: PackageDurationPrice[];
  isFree?: boolean;
  recommended?: boolean;
  displayOrder?: number;
  freeTrialMaxSlots?: number;
  freeTrialClaimedSlots?: number;
  limits: PackageLimits;
  permissions: string[];
  features: string[];
  whatsappNumber?: string;
  callNumber?: string;
  isPopular: boolean;
  isDefault: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PermissionGroup {
  group: string;
  label: string;
  description: string;
  permissions: {
    key: string;
    label: string;
    description: string;
  }[];
}

export interface UserOverrides {
  grantedPermissions: string[];
  deniedPermissions: string[];
  bonusLimits: {
    propertyListingsBonus?: number;
    propertyViewsBonus?: number;
    leadsBonus?: number;
    featuredListingsBonus?: number;
  };
  customRoleId?: string;
  activePackageId?: string;
}

export interface UsageMetricRecord {
  userId: string;
  userName: string;
  userMobile: string;
  userEmail?: string;
  role: string;
  accountType?: string;
  package?: {
    id: string;
    name: string;
    billingPeriod: string;
  };
  propertyViews: {
    used: number;
    limit: number;
    bonus: number;
    remaining: number;
  };
  propertyListings: {
    used: number;
    limit: number;
    bonus: number;
    remaining: number;
  };
  leads: {
    used: number;
    limit: number;
    bonus: number;
    remaining: number;
  };
  lastViewedAt?: string;
}

export interface KycDocumentItem {
  id: string;
  documentType: string;
  documentUrl?: string;
  frontDocumentUrl?: string;
  backDocumentUrl?: string | null;
  documentName?: string;
  documentNumber?: string;
  status: string;
  uploadedAt?: string;
  rejectionReason?: string | null;
}

export interface KycQueueItem {
  id: string;
  name: string;
  mobile: string;
  normalizedMobile: string;
  email?: string;
  role: string;
  accountType: string;
  status: string;
  isVerifiedAgent: boolean;
  agencyName?: string | null;
  reraNumber?: string | null;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_SUBMITTED';
  kycApprovedAt?: string | null;
  kycApprovedBy?: string | null;
  kycRejectionReason?: string | null;
  kycDocumentType?: string | null;
  kycDocumentNumber?: string | null;
  kycFrontDocumentUrl?: string | null;
  kycBackDocumentUrl?: string | null;
  documents: KycDocumentItem[];
  isTrialActive: boolean;
  trialStartedAt?: string | null;
  trialExpiresAt?: string | null;
  activePackage?: {
    id: string;
    name: string;
    planType: string;
    tier?: string;
  } | null;
  trialPackage?: {
    id: string;
    name: string;
    planType: string;
  } | null;
  createdAt?: string;
}

export interface KycQueueResponse {
  items: KycQueueItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  counts: {
    pending: number;
    approved: number;
    rejected: number;
  };
}
