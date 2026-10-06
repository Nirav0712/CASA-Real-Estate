# CASA Real Estate Marketplace — Phase 12: Lead Management & CRM Expansion

## Executive Summary
Phase 12 expands the existing purchaser enquiry system into a full-featured, production-ready Customer Relationship Management (CRM) engine for the CASA platform. Operating on live MongoDB Atlas with zero mock data, this engine facilitates the end-to-end lifecycle of buyer leads:
`PURCHASER` → `PROPERTY ENQUIRY` → `LEAD` → `ASSIGNMENT` → `AGENT / OWNER` → `FOLLOW-UP` → `ACTIVITY` → `STATUS TRANSITION` → `CONVERSION / LOST`

The implementation guarantees 100% database persistence, strict server-side RBAC and data isolation, duplicate enquiry protection, private internal CRM notes, multi-status workflows, scheduled follow-up management, and live aggregation metrics for both Agent and Admin workspaces.

---

## 1. Architectural Overview & Entity Schema

### 1.1 Lead Lifecycle & Statuses (`LeadStatus`)
- `NEW`: Default initial status upon enquiry submission.
- `CONTACTED`: First engagement established with purchaser.
- `FOLLOW_UP`: Scheduled communication in progress.
- `QUALIFIED` / `INTERESTED`: Buyer budget and requirements confirmed.
- `SITE_VISIT`: In-person property tour scheduled or conducted.
- `NEGOTIATION`: Offer and terms under review.
- `CONVERTED`: Contract executed / deal finalized (`convertedAt` timestamp recorded).
- `LOST`: Opportunity lost with mandatory/optional `lostReason` (`lostAt` timestamp recorded).
- `CANCELLED` / `CLOSED`: Terminal state.

### 1.2 MongoDB Schema (`leads` Collection)
- `propertyId`: String / ObjectId reference to the listed property.
- `purchaserId`: Optional ObjectId of the enquiring buyer.
- `ownerId`: ObjectId of property creator / owner.
- `agentId` / `assignedAgentId`: ObjectId of assigned agent.
- `assignedBy`: ObjectId of admin or owner who assigned the lead.
- `name` / `contactName`, `mobile` / `contactPhone`, `email` / `contactEmail`: Buyer details.
- `subject`, `message`: Initial enquiry message.
- `budget`: Optional `{ min, max, currency }`.
- `preferredLocation`: String locality preferences.
- `source`: `PROPERTY_ENQUIRY`, `DIRECT`, `WHATSAPP`, `CALL`, `PHONE`, `WEBSITE`, `REFERRAL`, `CAMPAIGN`, `OTHER`.
- `priority`: `LOW`, `MEDIUM` (default), `HIGH`, `URGENT`.
- `notes`: Subdocument array `LeadNote` (`text`, `authorId`, `authorName`, `createdAt`).
- `activities`: Subdocument array `LeadActivity` (`_id`, `actorId`, `actorName`, `actorRole`, `type`, `note`, `metadata`, `createdAt`).
- `followUps`: Subdocument array `LeadFollowUp` (`_id`, `assignedTo`, `dueAt`, `type`, `note`, `status`: `PENDING` | `COMPLETED` | `CANCELLED`, `completedAt`, `createdBy`, `createdAt`).
- `assignedAt`, `firstContactAt`, `lastContactAt`, `nextFollowUpAt`, `convertedAt`, `lostAt`, `lostReason`.

---

## 2. API Specifications

### 2.1 Public / Purchaser Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/leads` | Submit public/authenticated enquiry. Automatically checks for active leads from same buyer on same property to prevent duplicate spam. |
| `GET` | `/purchaser/enquiries` | Paginated list of enquiries submitted by authenticated purchaser. |
| `GET` | `/purchaser/enquiries/:id` | Enquiry details. Internal CRM notes, activities, and follow-ups are strictly excluded for privacy. |
| `PATCH` | `/purchaser/enquiries/:id/cancel` | Cancel buyer's active enquiry. |

### 2.2 Agent & Admin CRM Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/leads` | Filtered list with RBAC (Agents see assigned/owned leads; Admins see global pipeline with agent/unassigned filters). |
| `GET` | `/leads/kpis` | Real-time MongoDB KPI metrics (Total, New, Active, Site Visits, Converted, Lost, Unassigned, Follow-ups Due). |
| `GET` | `/leads/analytics` | Aggregated breakdown by status, source, and priority. |
| `GET` | `/leads/follow-ups` | Agent follow-up queue categorized into Due Today, Upcoming, and Overdue. |
| `GET` | `/leads/:id` | Full lead dossier including property info, activity timeline, private notes, and follow-ups. |
| `PATCH` | `/leads/:id/status` | Update workflow status, enforce conversion/lost timestamps, log `STATUS_CHANGE` activity, and record audit log. |
| `PATCH` | `/leads/:id/priority` | Update lead priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`). |
| `PATCH` | `/leads/:id/assign` | Assign/reassign lead to verified agent (validates target user role). |
| `POST` | `/leads/:id/notes` | Add internal private note and record `NOTE` activity. |
| `POST` | `/leads/:id/activities` | Log CRM activity (`CALL`, `WHATSAPP`, `EMAIL`, `SITE_VISIT`, etc.). |
| `POST` | `/leads/:id/follow-ups` | Schedule new follow-up and recalculate `nextFollowUpAt`. |
| `PATCH` | `/leads/:id/follow-ups/:followUpId/complete` | Mark follow-up as completed. |
| `PATCH` | `/leads/:id/follow-ups/:followUpId/cancel` | Cancel scheduled follow-up. |

---

## 3. Security & Data Isolation
- **Purchaser Privacy:** Internal agent notes and CRM activities are never serialized in `/purchaser/enquiries/*`.
- **Cross-Agent Isolation:** Agents cannot view, modify, or schedule activities on leads assigned to other agents (enforced via 403 Forbidden).
- **Role Validation on Assignment:** Target assignees must have `AGENT`, `VERIFIED_AGENT`, `ADMIN`, or `SUPER_ADMIN` role; assigning to regular purchasers is rejected with 400 Bad Request.
- **Server-Derived Identity:** All actor IDs and ownership checks derive from validated JWT claims.

---

## 4. Verification & Test Coverage
- **Live Test Suite:** `test-phase12-live-crm.js` — **26 / 26 checks passed (100%)**.
- **Backend Unit Tests:** `leads.service.spec.ts` — **12 / 12 tests passed (100%)**.
- **Regression Matrix:**
  - `test-phase11-live-location.js` — **25 / 25 passed (100%)**.
  - `test-phase10-live-purchaser.js` — **30 / 30 passed (100%)**.
  - `test-phase09-live-agent.js` — **27 / 27 passed (100%)**.
  - `test-phase07-live-search.js` — **27 / 27 passed (100%)**.
- **Build Matrix:**
  - Backend: `nest build` passed with 0 errors.
  - Admin: `npx tsc --noEmit` passed with 0 errors.
  - Frontend: `npx tsc --noEmit` passed with 0 errors.
