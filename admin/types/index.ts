export type PlatformRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'USER';

export type AccountType =
  | 'DEVELOPER'
  | 'AGENT'
  | 'BROKER'
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
  | 'GUEST';

export type AccountStatus =
  | 'ACTIVE'
  | 'PENDING_VERIFICATION'
  | 'SUSPENDED'
  | 'DEACTIVATED';

export interface AdminUser {
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
  listingType?: string;
  price: number;
  rawPrice?: any;
  location: string;
  rawLocation?: any;
  advertiserName: string;
  advertiserRole: string;
  advertiserPhone?: string;
  advertiser?: any;
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
  media?: { thumbnailUrl?: string; coverImage?: string; images?: string[]; videos?: string[] };
  isFeatured?: boolean;
  specs?: any;
  amenities?: string[];
}

export interface AdminDashboardStats {
  pendingApprovalsCount: number;
  activeListingsCount: number;
  totalPropertiesCount?: number;
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
  role: UserRole;
  status: AccountStatus;
  isVerifiedAgent: boolean;
  agencyName?: string;
  reraNumber?: string;
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
  status: AccountStatus;
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

export interface AgentVerificationDetailResponse {
  agent: AgentRecord;
  profile: AgentProfileRecord | null;
  documents: AgentDocumentRecord[];
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
  agentId?: string;
  assignedAgentId?: string;
  assignedAgent?: { id: string; name: string; mobile: string; role: string } | null;
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

export type BillingPeriod = 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'LIFETIME';

export interface PackageLimits {
  propertyListingsMax: number;
  featuredListingsMax: number;
  propertyViewsMonthly: number;
  savedItemsMax: number;
  leadsMonthly: number;
  enquiriesMonthly: number;
  chatThreadsMax: number;
  teamMembersMax: number;
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
  limits: PackageLimits;
  permissions: string[];
  features: string[];
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
