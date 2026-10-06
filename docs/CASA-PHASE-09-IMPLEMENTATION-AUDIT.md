# CASA PHASE 09 IMPLEMENTATION AUDIT
## Agent Dashboard, Business Tools & Lead Management

**Status:** AUDIT COMPLETE — BASELINE ARCHITECTURE ESTABLISHED  
**Date:** 2026-10-05T15:45:00+05:30  
**Target:** CASA Real Estate Marketplace — Phase 09

---

## 1. EXECUTIVE SUMMARY & OBJECTIVE

Phase 09 elevates the CASA Real Estate Marketplace by providing real estate brokers and verified agencies (`AGENT`, `VERIFIED_AGENT`) with a full-featured, MongoDB Atlas-backed **Agent Business Workspace & Dashboard**. 

This includes:
1. **Agent Dashboard (`/dashboard/agent`)**: Live operational analytics (real listing counts across draft/pending/published/rejected, lead metrics, follow-ups due, enquiry volume) without fake numbers.
2. **Agent Business Profile (`/dashboard/agent/profile`)**: Enterprise profile management (agency logo, bio, experience, areas served, specializations, office address, languages, and contact details).
3. **Agent RERA Verification Foundation (`/dashboard/agent/verification`)**: RERA registration management with document uploads (`RERA_CERTIFICATE`, `AGENCY_LICENSE`, `IDENTITY_DOCUMENT`, etc.), multi-step verification state machine (`NOT_SUBMITTED` -> `PENDING` -> `VERIFIED` / `REJECTED`), and resubmission workflow.
4. **Agent Lead & Enquiry System (`/dashboard/leads`)**: Property enquiry submission from public listings, server-side recipient routing (to assigned Agent or Property Owner), lead status tracking (`NEW`, `CONTACTED`, `QUALIFIED`, `SITE_VISIT`, `NEGOTIATION`, `CONVERTED`, `LOST`, `CLOSED`), priority management, notes, and scheduled follow-ups.
5. **Public Agent Profile (`/agents/[slug]`)**: SEO-optimized public agent page showcasing verified badge, credentials, agency background, areas served, and active published listings.
6. **Admin Verification & Governance Integration (`/admin/agents`)**: Admin verification review interface with document inspection, governance approval/rejection with mandatory reasons, badge revocation, and automatic immutable audit logging.

---

## 2. EXISTING CODEBASE AUDIT

### 2.1 Backend Modules & Reusable Schemas
- **User Schema (`users`)**:
  - Contains core authentication fields: `_id`, `name`, `mobile`, `normalizedMobile`, `email`, `role`, `status`, `isVerifiedAgent`, `agencyName`, `reraNumber`.
  - *Decision*: Preserve the User schema as the authoritative identity and authentication model. Dedicated business profile fields (office address, bio, specializations, areas served, social links, agency logo) will reside in a linked `AgentProfile` collection indexed by `userId`.
- **Property Schema (`properties`)**:
  - Verified Phase 06/07 schema with `id`, `slug`, `ownerId`, `advertiserId`, `title`, `description`, `category`, `listingType`, `price`, `location`, `specs`, `media`, `advertiser`, `status`, `isPublished`, `moderation`.
  - *Decision*: Fully reuse Phase 06 property management engine without modifying property collections. Agents query and manage only listings where `ownerId === user.id` or `advertiserId === user.id`.
- **RefreshSession Schema (`refresh_sessions`)**:
  - Manages JWT refresh rotation and session revocation upon suspension.
- **AuditLog Schema (`audit_logs`)**:
  - Implements immutable event logging with indexed actor/target metadata.
  - *Decision*: Extend with Phase 09 events (`AGENT_PROFILE_UPDATED`, `AGENT_VERIFICATION_SUBMITTED`, `AGENT_DOCUMENT_UPLOADED`, `AGENT_DOCUMENT_APPROVED`, `AGENT_DOCUMENT_REJECTED`, `AGENT_VERIFIED`, `AGENT_VERIFICATION_REVOKED`, `LEAD_CREATED`, `LEAD_STATUS_CHANGED`, `LEAD_NOTE_ADDED`, `LEAD_FOLLOW_UP_SET`).
- **Auth & RBAC Guards**:
  - `JwtAuthGuard` & `RolesGuard` working cleanly across all controllers.

### 2.2 Frontend & Admin Portals
- **Frontend (`frontend/`)**:
  - Navigation header has user profile dropdown that currently links to `#my-listings`. We will enrich it with links to `/dashboard/agent`, `/dashboard/agent/profile`, `/dashboard/agent/verification`, `/dashboard/leads`, and `/dashboard/properties`.
  - Property creation wizard at `/dashboard/properties/new` and owner dashboard at `/dashboard/properties` are fully functional.
- **Admin (`admin/`)**:
  - `/admin/agents` currently displays agent cards with quick badge grant/revoke. We will enrich this to display document counts and link to a full Verification Review detail interface with document preview, notes, and approval/rejection actions.

---

## 3. PROPOSED DATA ARCHITECTURE & NEW SCHEMAS

### 3.1 `AgentProfile` Schema (`agent_profiles` collection)
```typescript
@Schema({ timestamps: true, collection: 'agent_profiles' })
export class AgentProfile {
  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({ required: true, unique: true, index: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ required: true, trim: true })
  displayName: string;

  @Prop({ trim: true })
  agencyName?: string;

  @Prop()
  agencyLogo?: string;

  @Prop()
  profileImage?: string;

  @Prop({ default: 'Real Estate Consultant' })
  professionalTitle?: string;

  @Prop()
  bio?: string;

  @Prop({ default: 1, min: 0 })
  experienceYears: number;

  @Prop({ required: true })
  phone: string;

  @Prop()
  email?: string;

  @Prop()
  website?: string;

  @Prop({ type: Object, default: {} })
  socialLinks?: {
    whatsapp?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };

  @Prop()
  officeAddress?: string;

  @Prop({ default: 'Uttar Pradesh' })
  state: string;

  @Prop({ default: 'Lucknow' })
  district: string;

  @Prop({ default: 'Lucknow' })
  city: string;

  @Prop()
  locality?: string;

  @Prop()
  pincode?: string;

  @Prop({ type: [String], default: [] })
  areasServed: string[];

  @Prop({ type: [String], default: [] })
  specializations: string[];

  @Prop({ type: [String], default: ['English', 'Hindi'] })
  languages: string[];

  // RERA Information
  @Prop({ index: true })
  reraNumber?: string;

  @Prop({ default: 'Uttar Pradesh' })
  reraState?: string;

  @Prop({ default: 'UP RERA' })
  reraAuthority?: string;

  @Prop({
    type: String,
    enum: ['NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'REJECTED'],
    default: 'NOT_SUBMITTED',
    index: true,
  })
  verificationStatus: string;

  @Prop({ default: false, index: true })
  isVerifiedAgent: boolean;

  @Prop()
  verifiedAt?: Date;

  @Prop()
  verifiedBy?: string;

  @Prop()
  verificationNotes?: string;

  @Prop({ type: [String], default: [] })
  rejectionReasons?: string[];
}
```

### 3.2 `AgentVerificationDocument` Schema (`agent_documents` collection)
```typescript
@Schema({ timestamps: true, collection: 'agent_documents' })
export class AgentVerificationDocument {
  @Prop({ required: true, index: true })
  agentId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({
    required: true,
    enum: ['RERA_CERTIFICATE', 'AGENCY_LICENSE', 'IDENTITY_DOCUMENT', 'ADDRESS_PROOF', 'OTHER'],
  })
  documentType: string;

  @Prop({ required: true })
  documentUrl: string;

  @Prop({ required: true })
  documentName: string;

  @Prop()
  mimeType?: string;

  @Prop()
  fileSize?: number;

  @Prop()
  documentNumber?: string;

  @Prop({
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    index: true,
  })
  status: string;

  @Prop({ default: Date.now })
  uploadedAt: Date;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  reviewedBy?: string;

  @Prop()
  rejectionReason?: string;
}
```

### 3.3 `Lead` Schema (`leads` collection)
```typescript
@Schema({ timestamps: true, collection: 'leads' })
export class Lead {
  @Prop({ required: true, index: true })
  propertyId: string;

  @Prop({ index: true })
  agentId?: string;

  @Prop({ required: true, index: true })
  ownerId: string;

  @Prop({ index: true })
  purchaserId?: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  mobile: string;

  @Prop({ trim: true })
  email?: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    type: String,
    enum: ['PROPERTY_PAGE', 'WHATSAPP', 'CALL', 'CONTACT_FORM', 'DIRECT', 'SEARCH', 'OTHER'],
    default: 'PROPERTY_PAGE',
    index: true,
  })
  source: string;

  @Prop({
    type: String,
    enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'SITE_VISIT', 'NEGOTIATION', 'CONVERTED', 'LOST', 'CLOSED'],
    default: 'NEW',
    index: true,
  })
  status: string;

  @Prop({
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM',
    index: true,
  })
  priority: string;

  @Prop({ type: [{ text: String, authorId: String, authorName: String, createdAt: { type: Date, default: Date.now } }], default: [] })
  notes: Array<{ text: string; authorId: string; authorName: string; createdAt: Date }>;

  @Prop()
  assignedAt?: Date;

  @Prop()
  firstContactAt?: Date;

  @Prop()
  lastContactAt?: Date;

  @Prop({ index: true })
  nextFollowUpAt?: Date;
}
```

---

## 4. API ARCHITECTURE & ENDPOINTS

### 4.1 Agent Business & Profile Endpoints (`backend/src/modules/agents`)
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/agents/me/dashboard` | `AGENT`, `VERIFIED_AGENT`, `ADMIN` | Returns live listing counts, lead metrics, and verification state |
| `GET` | `/api/v1/agents/me/profile` | `AGENT`, `VERIFIED_AGENT`, `ADMIN` | Fetch current agent's business profile |
| `PATCH` | `/api/v1/agents/me/profile` | `AGENT`, `VERIFIED_AGENT`, `ADMIN` | Update business profile details (bio, areas, specializations) |
| `GET` | `/api/v1/agents/me/verification` | `AGENT`, `VERIFIED_AGENT`, `ADMIN` | Get verification status and submitted documents |
| `POST` | `/api/v1/agents/me/verification/submit` | `AGENT`, `VERIFIED_AGENT` | Submit RERA details & application for verification review |
| `POST` | `/api/v1/agents/me/verification/documents` | `AGENT`, `VERIFIED_AGENT` | Upload verification document record |
| `GET` | `/api/v1/agents/:slug` | Public | Public agent profile with verified credentials & published listings |

### 4.2 Leads & Enquiries Endpoints (`backend/src/modules/leads`)
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/leads` | Public | Submit enquiry against a published property (server-side routing) |
| `GET` | `/api/v1/leads/my` | `AGENT`, `VERIFIED_AGENT`, `PROPERTY_OWNER` | List leads assigned to current authenticated agent/owner |
| `GET` | `/api/v1/leads/:id` | `AGENT`, `VERIFIED_AGENT`, `PROPERTY_OWNER`, `ADMIN` | Get single lead details with notes and timeline |
| `PATCH` | `/api/v1/leads/:id/status` | Assigned Agent / Owner / Admin | Update lead status (`NEW` -> `CONTACTED` -> `SITE_VISIT` -> etc.) |
| `PATCH` | `/api/v1/leads/:id/priority` | Assigned Agent / Owner / Admin | Update lead priority |
| `POST` | `/api/v1/leads/:id/notes` | Assigned Agent / Owner / Admin | Append a note to lead activity |
| `POST` | `/api/v1/leads/:id/follow-up` | Assigned Agent / Owner / Admin | Schedule next follow-up date |

### 4.3 Admin Agent Verification Endpoints (`backend/src/modules/admin`)
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/agents/:id/verification` | `SUPER_ADMIN`, `ADMIN` | View full agent verification application & document queue |
| `POST` | `/api/v1/admin/agents/:id/approve` | `SUPER_ADMIN`, `ADMIN` | Approve verification application & award CASA Verified badge |
| `POST` | `/api/v1/admin/agents/:id/reject` | `SUPER_ADMIN`, `ADMIN` | Reject verification application with mandatory reason |
| `POST` | `/api/v1/admin/agents/:id/revoke` | `SUPER_ADMIN`, `ADMIN` | Revoke verification badge and revert to regular Agent |

---

## 5. FRONTEND & ADMIN UI ROUTES

### 5.1 Public Frontend (`frontend/`)
- `/dashboard/agent`: Comprehensive agent workspace with live listing stats, leads pipeline summary, and verification status banner.
- `/dashboard/agent/profile`: Complete business profile editor with experience, agency details, areas served, and social links.
- `/dashboard/agent/verification`: RERA verification status tracker, document upload manager, and resubmission wizard.
- `/dashboard/leads`: Real-time lead CRM table with status tabs, priority chips, search, and lead detail drawer (notes, follow-up scheduler).
- `/agents/[slug]`: Public agent profile with CASA Verified badge, active published property grid, and direct inquiry form.

### 5.2 Admin Portal (`admin/`)
- `/admin/agents`: Upgraded agent queue with verification status badges, active listings, and direct action to view verification details.

---

## 6. SECURITY & RBAC BOUNDARIES

1. **Server-Side Authorization**: Agent endpoints derive `userId` strictly from the validated JWT token (`@CurrentUser()`). Frontend cannot spoof `agentId`, `ownerId`, or `verificationStatus`.
2. **Lead Routing Isolation**: Public enquiries derive the recipient agent/owner exclusively from the MongoDB property record. Leads can only be accessed by the assigned agent, property owner, or platform administrators.
3. **Verification Safeguard**: Agents cannot self-verify. Status transitions to `VERIFIED` require administrator approval, and rejections enforce mandatory explanatory reasons stored in the audit log.
4. **Public Data Protection**: Public agent profiles and enquiry forms strictly exclude internal user IDs, OTP secrets, refresh hashes, and moderation metadata.

---

## 7. PHASE 09 BOUNDARIES & DEFERRED PHASE 10 SCOPE

- **In-Scope for Phase 09**:
  - Agent business profile & public SEO landing page.
  - RERA verification state machine & document submission foundation.
  - Real-time agent dashboard metrics (listings, leads, follow-ups).
  - Lead generation form on property pages with server-side routing.
  - Lead management CRM with status workflows, notes, and follow-ups.
  - Admin verification detail interface with approval/rejection audit trail.
- **Deferred to Phase 10 & Beyond**:
  - Automated government RERA registry OCR / web scraper integration.
  - Commission payouts, billing invoices, and premium subscription monetization.
  - Multi-user agency team management (broker with sub-agents).

---

## 8. IMPLEMENTATION PLAN

1. **Backend Foundation**:
   - Create `AgentProfile` and `AgentVerificationDocument` schemas in `backend/src/modules/agents`.
   - Create `Lead` schema in `backend/src/modules/leads`.
   - Implement `AgentsService`, `AgentsController`, `LeadsService`, `LeadsController`.
   - Update `AdminService` and `AdminController` with verification document inspection, approval, and rejection.
   - Register modules in `AppModule`.
2. **Backend Automated Tests**:
   - Write comprehensive unit tests for `agents.service.spec.ts` and `leads.service.spec.ts`.
3. **Frontend Implementation**:
   - Create `frontend/services/agent-service.ts` and `frontend/services/lead-service.ts`.
   - Implement `/dashboard/agent`, `/dashboard/agent/profile`, `/dashboard/agent/verification`, `/dashboard/leads`, `/agents/[slug]`.
   - Add property enquiry form to public property details page (`/property/[slug]`).
   - Update navigation header with role-aware agent menu items.
4. **Admin Implementation**:
   - Upgrade `/admin/agents` with full verification details and document review modal.
5. **Validation & Quality Gates**:
   - Execute test suites, live MongoDB E2E scripts (`test-phase09-live-agent.js`), regression scripts (`test-phase09-regression.js`), and production builds across all 3 applications.
6. **Completion Report & Master Documentation**.
