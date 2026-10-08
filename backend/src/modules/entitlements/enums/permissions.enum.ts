export enum DataScope {
  OWN = 'OWN',
  TEAM = 'TEAM',
  ORGANIZATION = 'ORGANIZATION',
  ALL = 'ALL',
}

export enum Permission {
  // PROPERTY
  PROPERTY_VIEW = 'property:view',
  PROPERTY_CREATE = 'property:create',
  PROPERTY_EDIT = 'property:edit',
  PROPERTY_DELETE = 'property:delete',
  PROPERTY_PUBLISH = 'property:publish',
  PROPERTY_UNPUBLISH = 'property:unpublish',
  PROPERTY_APPROVE = 'property:approve',
  PROPERTY_REJECT = 'property:reject',
  PROPERTY_FEATURE = 'property:feature',
  PROPERTY_PROMOTE = 'property:promote',
  PROPERTY_CONTACT_VIEW = 'property_contact:view',

  // LEADS
  LEAD_VIEW = 'lead:view',
  LEAD_CREATE = 'lead:create',
  LEAD_EDIT = 'lead:edit',
  LEAD_DELETE = 'lead:delete',
  LEAD_ASSIGN = 'lead:assign',
  LEAD_EXPORT = 'lead:export',

  // ENQUIRIES
  ENQUIRY_VIEW = 'enquiry:view',
  ENQUIRY_CREATE = 'enquiry:create',
  ENQUIRY_MANAGE = 'enquiry:manage',
  ENQUIRY_ASSIGN = 'enquiry:assign',

  // CHAT
  CHAT_VIEW = 'chat:view',
  CHAT_START = 'chat:start',
  CHAT_REPLY = 'chat:reply',
  CHAT_DELETE = 'chat:delete',
  CHAT_EXPORT = 'chat:export',

  // CRM
  CRM_VIEW = 'crm:view',
  CRM_CREATE = 'crm:create',
  CRM_EDIT = 'crm:edit',
  CRM_DELETE = 'crm:delete',
  CRM_EXPORT = 'crm:export',

  // CUSTOMERS
  CUSTOMER_VIEW = 'customer:view',
  CUSTOMER_EDIT = 'customer:edit',
  CUSTOMER_EXPORT = 'customer:export',

  // ANALYTICS
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_ADVANCED = 'analytics:advanced',
  ANALYTICS_EXPORT = 'analytics:export',

  // SITE VISITS
  SITE_VISIT_VIEW = 'site_visit:view',
  SITE_VISIT_CREATE = 'site_visit:create',
  SITE_VISIT_MANAGE = 'site_visit:manage',
  SITE_VISIT_CANCEL = 'site_visit:cancel',

  // REVIEWS
  REVIEW_VIEW = 'review:view',
  REVIEW_CREATE = 'review:create',
  REVIEW_MANAGE = 'review:manage',
  REVIEW_MODERATE = 'review:moderate',

  // REPORTS
  REPORT_VIEW = 'report:view',
  REPORT_CREATE = 'report:create',
  REPORT_MANAGE = 'report:manage',

  // PAYMENTS
  PAYMENT_VIEW = 'payment:view',
  PAYMENT_CREATE = 'payment:create',
  PAYMENT_REFUND = 'payment:refund',
  PAYMENT_MANAGE = 'payment:manage',

  // PROMOTIONS
  PROMOTION_VIEW = 'promotion:view',
  PROMOTION_CREATE = 'promotion:create',
  PROMOTION_MANAGE = 'promotion:manage',

  // SUBSCRIPTIONS
  SUBSCRIPTION_VIEW = 'subscription:view',
  SUBSCRIPTION_MANAGE = 'subscription:manage',

  // USERS
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_EDIT = 'user:edit',
  USER_SUSPEND = 'user:suspend',
  USER_ASSIGN_ROLE = 'user:assign_role',

  // ROLES
  ROLE_VIEW = 'role:view',
  ROLE_CREATE = 'role:create',
  ROLE_EDIT = 'role:edit',
  ROLE_DELETE = 'role:delete',
  ROLE_ASSIGN = 'role:assign',

  // SETTINGS
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_MANAGE = 'settings:manage',

  // AUDIT
  AUDIT_VIEW = 'audit:view',
}

export interface PermissionGroup {
  group: string;
  label: string;
  description: string;
  permissions: {
    key: Permission;
    label: string;
    description: string;
  }[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    group: 'PROPERTY',
    label: 'Property Management',
    description: 'Permissions for creating, editing, and managing property listings and contact visibility',
    permissions: [
      { key: Permission.PROPERTY_VIEW, label: 'View Properties', description: 'Browse and view property details' },
      { key: Permission.PROPERTY_CREATE, label: 'Create Listing', description: 'Post new property advertisements' },
      { key: Permission.PROPERTY_EDIT, label: 'Edit Listing', description: 'Modify existing property listings' },
      { key: Permission.PROPERTY_DELETE, label: 'Delete Listing', description: 'Remove property advertisements' },
      { key: Permission.PROPERTY_PUBLISH, label: 'Publish Listing', description: 'Publish draft listings to marketplace' },
      { key: Permission.PROPERTY_UNPUBLISH, label: 'Unpublish Listing', description: 'Withdraw listings from marketplace' },
      { key: Permission.PROPERTY_APPROVE, label: 'Approve Listings', description: 'Moderation approval for advertisements' },
      { key: Permission.PROPERTY_REJECT, label: 'Reject Listings', description: 'Moderation rejection for advertisements' },
      { key: Permission.PROPERTY_FEATURE, label: 'Feature Listings', description: 'Promote properties to featured slots' },
      { key: Permission.PROPERTY_PROMOTE, label: 'Promote Listings', description: 'Run paid marketing on property' },
      { key: Permission.PROPERTY_CONTACT_VIEW, label: 'View Contact Details', description: 'View owner/agent phone and WhatsApp' },
    ],
  },
  {
    group: 'LEADS',
    label: 'Lead Management',
    description: 'Permissions for managing buyer and tenant lead pipelines',
    permissions: [
      { key: Permission.LEAD_VIEW, label: 'View Leads', description: 'Access leads in scope' },
      { key: Permission.LEAD_CREATE, label: 'Create Lead', description: 'Manually register prospective client lead' },
      { key: Permission.LEAD_EDIT, label: 'Edit Lead', description: 'Update lead status and notes' },
      { key: Permission.LEAD_DELETE, label: 'Delete Lead', description: 'Remove lead record' },
      { key: Permission.LEAD_ASSIGN, label: 'Assign Lead', description: 'Delegate leads to team members' },
      { key: Permission.LEAD_EXPORT, label: 'Export Leads', description: 'Download lead reports (CSV/Excel)' },
    ],
  },
  {
    group: 'ENQUIRIES',
    label: 'Enquiry Management',
    description: 'Permissions for managing customer property inquiries',
    permissions: [
      { key: Permission.ENQUIRY_VIEW, label: 'View Enquiries', description: 'View property inquiries in scope' },
      { key: Permission.ENQUIRY_CREATE, label: 'Submit Enquiry', description: 'Submit inquiries for properties' },
      { key: Permission.ENQUIRY_MANAGE, label: 'Manage Enquiries', description: 'Respond to and close enquiries' },
      { key: Permission.ENQUIRY_ASSIGN, label: 'Assign Enquiry', description: 'Delegate enquiries to team members' },
    ],
  },
  {
    group: 'CHAT',
    label: 'Real-Time Messaging',
    description: 'Permissions for private messaging between marketplace participants',
    permissions: [
      { key: Permission.CHAT_VIEW, label: 'View Chats', description: 'Access private chat conversations' },
      { key: Permission.CHAT_START, label: 'Start Chat', description: 'Initiate new chat session with seller/agent' },
      { key: Permission.CHAT_REPLY, label: 'Reply in Chat', description: 'Send messages in existing chats' },
      { key: Permission.CHAT_DELETE, label: 'Delete Chat', description: 'Delete conversation history' },
      { key: Permission.CHAT_EXPORT, label: 'Export Chat', description: 'Export chat transcript' },
    ],
  },
  {
    group: 'CRM',
    label: 'Customer Relationship Management',
    description: 'Comprehensive CRM tools for deals, tasks, and client notes',
    permissions: [
      { key: Permission.CRM_VIEW, label: 'View CRM', description: 'Access scoped CRM pipeline and contacts' },
      { key: Permission.CRM_CREATE, label: 'Create CRM Entry', description: 'Add deals, clients, or interaction notes' },
      { key: Permission.CRM_EDIT, label: 'Edit CRM Entry', description: 'Update deal stage or client details' },
      { key: Permission.CRM_DELETE, label: 'Delete CRM Entry', description: 'Remove CRM record' },
      { key: Permission.CRM_EXPORT, label: 'Export CRM Data', description: 'Download CRM data' },
    ],
  },
  {
    group: 'CUSTOMERS',
    label: 'Customer Directory',
    description: 'Client contacts and directory management',
    permissions: [
      { key: Permission.CUSTOMER_VIEW, label: 'View Customers', description: 'View customer directory' },
      { key: Permission.CUSTOMER_EDIT, label: 'Edit Customer', description: 'Update customer profiles' },
      { key: Permission.CUSTOMER_EXPORT, label: 'Export Customers', description: 'Export customer records' },
    ],
  },
  {
    group: 'ANALYTICS',
    label: 'Analytics & BI',
    description: 'Insights, performance metrics, and intelligence reports',
    permissions: [
      { key: Permission.ANALYTICS_VIEW, label: 'View Basic Analytics', description: 'Access standard dashboard stats' },
      { key: Permission.ANALYTICS_ADVANCED, label: 'Advanced Analytics', description: 'Access predictive BI and conversion funnel' },
      { key: Permission.ANALYTICS_EXPORT, label: 'Export Analytics', description: 'Download analytics reports' },
    ],
  },
  {
    group: 'SITE_VISITS',
    label: 'Site Visit Scheduling',
    description: 'Managing in-person and virtual property tours',
    permissions: [
      { key: Permission.SITE_VISIT_VIEW, label: 'View Site Visits', description: 'View scheduled property tours' },
      { key: Permission.SITE_VISIT_CREATE, label: 'Schedule Visit', description: 'Book a site visit slot' },
      { key: Permission.SITE_VISIT_MANAGE, label: 'Manage Visits', description: 'Confirm or reschedule tours' },
      { key: Permission.SITE_VISIT_CANCEL, label: 'Cancel Visit', description: 'Cancel scheduled site visits' },
    ],
  },
  {
    group: 'REVIEWS',
    label: 'Ratings & Reviews',
    description: 'Customer feedback and agent/property ratings',
    permissions: [
      { key: Permission.REVIEW_VIEW, label: 'View Reviews', description: 'Read ratings and reviews' },
      { key: Permission.REVIEW_CREATE, label: 'Write Review', description: 'Submit ratings for properties or agents' },
      { key: Permission.REVIEW_MANAGE, label: 'Manage Reviews', description: 'Respond to customer reviews' },
      { key: Permission.REVIEW_MODERATE, label: 'Moderate Reviews', description: 'Approve or reject flagged reviews' },
    ],
  },
  {
    group: 'REPORTS',
    label: 'Trust, Safety & Reports',
    description: 'Fraud and violation reporting',
    permissions: [
      { key: Permission.REPORT_VIEW, label: 'View Reports', description: 'View reported listings and users' },
      { key: Permission.REPORT_CREATE, label: 'File Report', description: 'Report an issue or listing' },
      { key: Permission.REPORT_MANAGE, label: 'Manage Reports', description: 'Resolve violation tickets' },
    ],
  },
  {
    group: 'PAYMENTS',
    label: 'Payments & Invoices',
    description: 'Payment transactions and billing history',
    permissions: [
      { key: Permission.PAYMENT_VIEW, label: 'View Payments', description: 'Access invoices and transaction logs' },
      { key: Permission.PAYMENT_CREATE, label: 'Initiate Payment', description: 'Make payments for packages and features' },
      { key: Permission.PAYMENT_REFUND, label: 'Process Refund', description: 'Issue refunds to customers' },
      { key: Permission.PAYMENT_MANAGE, label: 'Manage Payments', description: 'Manage gateways and reconciliation' },
    ],
  },
  {
    group: 'PROMOTIONS',
    label: 'Marketing & Promotions',
    description: 'Promotional banners and social campaigns',
    permissions: [
      { key: Permission.PROMOTION_VIEW, label: 'View Promotions', description: 'View promotional campaigns' },
      { key: Permission.PROMOTION_CREATE, label: 'Create Promotion', description: 'Launch new marketing campaign' },
      { key: Permission.PROMOTION_MANAGE, label: 'Manage Promotions', description: 'Pause or edit promotional campaigns' },
    ],
  },
  {
    group: 'SUBSCRIPTIONS',
    label: 'Subscriptions & Packages',
    description: 'User package subscriptions and renewals',
    permissions: [
      { key: Permission.SUBSCRIPTION_VIEW, label: 'View Subscriptions', description: 'View active plans and limits' },
      { key: Permission.SUBSCRIPTION_MANAGE, label: 'Manage Subscriptions', description: 'Modify and assign subscription packages' },
    ],
  },
  {
    group: 'USERS',
    label: 'User Administration',
    description: 'User accounts, verification, and status control',
    permissions: [
      { key: Permission.USER_VIEW, label: 'View Users', description: 'Access user directory and profile details' },
      { key: Permission.USER_CREATE, label: 'Create User', description: 'Provision user accounts directly' },
      { key: Permission.USER_EDIT, label: 'Edit User', description: 'Update profile and metadata' },
      { key: Permission.USER_SUSPEND, label: 'Suspend User', description: 'Deactivate or suspend user access' },
      { key: Permission.USER_ASSIGN_ROLE, label: 'Assign Role', description: 'Assign custom or system roles to users' },
    ],
  },
  {
    group: 'ROLES',
    label: 'Role & RBAC Management',
    description: 'Dynamic role configuration and permission assignment',
    permissions: [
      { key: Permission.ROLE_VIEW, label: 'View Roles', description: 'Browse configured system and custom roles' },
      { key: Permission.ROLE_CREATE, label: 'Create Role', description: 'Build and save new custom roles' },
      { key: Permission.ROLE_EDIT, label: 'Edit Role', description: 'Modify permissions and module configs of roles' },
      { key: Permission.ROLE_DELETE, label: 'Delete Role', description: 'Delete custom roles (safe deletion)' },
      { key: Permission.ROLE_ASSIGN, label: 'Assign Role', description: 'Authorize users under a role' },
    ],
  },
  {
    group: 'SETTINGS',
    label: 'Platform Settings',
    description: 'Global system configuration and marketplace policies',
    permissions: [
      { key: Permission.SETTINGS_VIEW, label: 'View Settings', description: 'Inspect platform configuration' },
      { key: Permission.SETTINGS_MANAGE, label: 'Manage Settings', description: 'Update system parameters and policies' },
    ],
  },
  {
    group: 'AUDIT',
    label: 'Security & Audit Logs',
    description: 'Immutable trail of administrative and security events',
    permissions: [
      { key: Permission.AUDIT_VIEW, label: 'View Audit Logs', description: 'Inspect audit trail and governance logs' },
    ],
  },
];
