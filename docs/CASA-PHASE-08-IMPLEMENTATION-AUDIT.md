# CASA — PHASE 08 IMPLEMENTATION AUDIT
## Admin User Management, Governance & Audit Logging Engine

**Date:** October 5, 2026  
**Status:** AUDIT COMPLETED / READY FOR STEP-BY-STEP IMPLEMENTATION  
**Phase:** 08 of 18  

---

### 1. Existing Codebase Audit & Baseline Assessment

#### A. Backend Architecture (`backend/src/modules/`)
1. **User Schema (`backend/src/modules/auth/schemas/user.schema.ts`)**:
   - Stores `name`, `mobile`, `normalizedMobile` (unique index), `email`, `role`, `status`, `isVerifiedAgent`, `avatar`, `agencyName`, `reraNumber`, `lastLoginAt`, `metadata`.
   - Compound index: `{ role: 1, status: 1 }`.
   - Reusable directly for Phase 08 without creating duplicate models.
2. **Auth Enums (`backend/src/modules/auth/enums/auth.enums.ts`)**:
   - `UserRole`: `SUPER_ADMIN`, `ADMIN`, `MODERATOR`, `VERIFIED_AGENT`, `AGENT`, `PROPERTY_OWNER`, `PURCHASER`.
   - `AccountStatus`: `ACTIVE`, `PENDING_VERIFICATION`, `SUSPENDED`, `DEACTIVATED`.
3. **Session Revocation (`backend/src/modules/auth/schemas/refresh-session.schema.ts`)**:
   - Supports `isRevoked`, `revokedAt`, and `familyId` token rotation tracking.
4. **Current Admin Service (`backend/src/modules/admin/admin.service.ts`)**:
   - Handles property moderation queue, approvals, rejections, unpublishing, and KPI stats.
   - Missing: User list/search/pagination, User details with property aggregates, User status updating with session revocation, User role updating with RBAC safeguards, Agent verification grant/revoke, Purchaser tracking, and Audit log queries.

#### B. Admin Portal State (`admin/app/`)
1. **`admin/app/users/page.tsx`**: Uses hardcoded `INITIAL_USERS` mock array. Status toggle only changes local React state.
2. **`admin/app/agents/page.tsx`**: Uses hardcoded `INITIAL_AGENTS` mock array. Verification toggle only flips local boolean state without MongoDB persistence.
3. **`admin/app/purchasers/page.tsx`**: Uses hardcoded static `buyers` list.
4. **`admin/app/audit-logs/page.tsx`**: Uses hardcoded static `logs` list.
5. **`admin/lib/api-client.ts`**: Contains generic `fetchAdminApi` with JWT bearer token attachment, ready to support all user, agent, purchaser, and audit API methods.

---

### 2. User Domain & Status Model Design

1. **User Entity Structure**:
   - Identifiers: `_id`, `normalizedMobile` (+91 format), `name`, `email`.
   - Role & Governance: `role` (CASA 7-tier enum), `status` (`ACTIVE`, `SUSPENDED`, `DEACTIVATED`), `isVerifiedAgent` (boolean), `reraNumber` (string), `agencyName` (string), `lastLoginAt` (date).
2. **Server-Side Enforcement**:
   - `SUSPENDED` / `DEACTIVATED`:
     - Login attempts via OTP verification rejected (`ForbiddenException`).
     - Token refresh attempts rejected (`UnauthorizedException`).
     - Admin status change endpoint automatically marks all active `RefreshSession` records for the target user as `isRevoked: true`.

---

### 3. Role Hierarchy & Safeguards Matrix

| Initiator Role | Can Update Status of | Can Promote/Demote to | Cannot Modify |
| :--- | :--- | :--- | :--- |
| **SUPER_ADMIN** | All users (except deleting last active SUPER_ADMIN) | `ADMIN`, `MODERATOR`, `VERIFIED_AGENT`, `AGENT`, `PROPERTY_OWNER`, `PURCHASER` | Cannot suspend or demote own active account |
| **ADMIN** | `AGENT`, `VERIFIED_AGENT`, `PROPERTY_OWNER`, `PURCHASER` | `AGENT`, `VERIFIED_AGENT`, `PROPERTY_OWNER`, `PURCHASER` | Cannot modify `SUPER_ADMIN` or promote users to `SUPER_ADMIN` or `ADMIN` |
| **MODERATOR** | View only / Moderation actions | None | Cannot change user statuses or roles |
| **Normal Users** | None (Self only profile updates) | None | Zero admin API access (`403 Forbidden`) |

---

### 4. Audit Log System Architecture

1. **Collection**: `audit_logs` (via `AuditLogSchema` in `backend/src/modules/admin/schemas/audit-log.schema.ts`)
2. **Tracked Actions**:
   - `USER_STATUS_CHANGED` (e.g. ACTIVE -> SUSPENDED)
   - `USER_ROLE_CHANGED` (e.g. PURCHASER -> AGENT)
   - `AGENT_VERIFIED` (CASA Verified Agent badge granted)
   - `AGENT_VERIFICATION_REVOKED` (Badge revoked)
   - `PROPERTY_APPROVED` / `PROPERTY_REJECTED` / `PROPERTY_PUBLISHED` / `PROPERTY_UNPUBLISHED` / `PROPERTY_ARCHIVED`
3. **Immutability**: Audit logs are append-only. No public or normal administrative endpoints permit editing or deleting audit log records.

---

### 5. API Endpoints to Implement

| HTTP Method | Endpoint | Access Control | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/users` | `ADMIN`, `SUPER_ADMIN` | List users with pagination, search, role, status, verification filters |
| `GET` | `/api/v1/admin/users/:id` | `ADMIN`, `SUPER_ADMIN` | Get detailed user profile + property aggregate stats |
| `PATCH` | `/api/v1/admin/users/:id/status` | `ADMIN`, `SUPER_ADMIN` | Change status (ACTIVE, SUSPENDED, DEACTIVATED) + revoke sessions + audit log |
| `PATCH` | `/api/v1/admin/users/:id/role` | `ADMIN`, `SUPER_ADMIN` | Change role with RBAC hierarchy safeguards + audit log |
| `GET` | `/api/v1/admin/agents` | `ADMIN`, `SUPER_ADMIN`, `MODERATOR` | List agents with RERA, agency, verification state, and listing metrics |
| `POST` | `/api/v1/admin/agents/:id/verify` | `ADMIN`, `SUPER_ADMIN` | Grant verified badge + audit log |
| `POST` | `/api/v1/admin/agents/:id/revoke` | `ADMIN`, `SUPER_ADMIN` | Revoke verified badge + audit log |
| `GET` | `/api/v1/admin/purchasers` | `ADMIN`, `SUPER_ADMIN` | List registered buyers with search and activity overview |
| `GET` | `/api/v1/admin/audit-logs` | `ADMIN`, `SUPER_ADMIN` | Paginated immutable audit trail with action/actor filters |

---

### 6. Database Indexes

1. **User Schema**:
   - `{ role: 1, status: 1 }`
   - `{ normalizedMobile: 1 }`
   - `{ isVerifiedAgent: 1 }`
   - `{ createdAt: -1 }`
2. **Audit Log Schema**:
   - `{ timestamp: -1 }`
   - `{ actorUserId: 1, timestamp: -1 }`
   - `{ targetUserId: 1, timestamp: -1 }`
   - `{ action: 1, timestamp: -1 }`

---

### 7. Files to Create or Modify

#### Backend:
- `backend/src/modules/admin/schemas/audit-log.schema.ts` (New schema)
- `backend/src/modules/admin/dto/admin-user-query.dto.ts` (New DTO)
- `backend/src/modules/admin/dto/update-user-status.dto.ts` (New DTO)
- `backend/src/modules/admin/dto/update-user-role.dto.ts` (New DTO)
- `backend/src/modules/admin/admin.module.ts` (Import User & AuditLog models)
- `backend/src/modules/admin/admin.service.ts` (Add user, agent, purchaser, and audit methods)
- `backend/src/modules/admin/admin.controller.ts` (Add endpoints)
- `backend/src/modules/admin/admin.service.spec.ts` (Add unit test coverage)

#### Admin Frontend:
- `admin/lib/api-client.ts` (Add API helper functions)
- `admin/app/users/page.tsx` (Live backend integration + user details modal/drawer + status/role dialogs)
- `admin/app/agents/page.tsx` (Live backend integration + real badge grant/revoke with refresh persistence)
- `admin/app/purchasers/page.tsx` (Live backend integration + search & pagination)
- `admin/app/audit-logs/page.tsx` (Live backend integration + filterable audit log viewer)

---

### 8. Risk Management & Backward Compatibility
- **Phase 04–07 Unbroken**: Existing OTP authentication, property wizard, moderation state machine, and public search remain 100% unaltered.
- **Super Admin Protection**: Guard logic strictly forbids self-suspension or unprivileged promotion to SUPER_ADMIN.
- **Sensitive Field Protection**: `userModel` projections strictly omit internal token secrets, password hashes, and OTP challenge internals.
