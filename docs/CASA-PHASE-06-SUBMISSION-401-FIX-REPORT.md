# CASA — PHASE 06 FIX REPORT
## Property Submission 401 Unauthorized Authentication Fix

**Date:** October 5, 2026  
**Status:** RESOLVED & VERIFIED  
**Component:** Frontend API Client, Session Token Synchronization, Cookie Management, and Backend JWT Validation  

---

### 1. Executive Summary

During testing of the 8-step property listing wizard on `http://localhost:3000/dashboard/properties/new`, clicking **"Submit for CASA Review"** resulted in an `"API error: 401 Unauthorized"` failure.

This issue has been thoroughly diagnosed and resolved without compromising security, weakening RBAC, or bypassing authentication guards.

---

### 2. Root Cause Analysis

1. **Frontend API Client Header & Cookie Omission (`frontend/lib/api-client.ts`)**:
   - `fetchApi` executed `fetch(...)` without `credentials: 'include'` and without auto-attaching the `Authorization: Bearer <token>` header.
   - Cross-origin HTTP requests from Next.js (`:3000`) to NestJS (`:5000`) were dispatched without credentials.
2. **Access Token Storage Disconnect (`frontend/contexts/auth-context.tsx`)**:
   - While `auth-context` held `tokens.accessToken` in React component state, it did not persist it in `localStorage` (`casa_access_token`), making it inaccessible to the standalone API client helper functions.
3. **Backend Access Token Cookie Omission (`backend/src/modules/auth/auth.controller.ts`)**:
   - On OTP verification and token refresh, `AuthController` attached the `refresh_token` cookie with path `/api/v1/auth`, but did not set the `access_token` cookie for global API paths (`/`).
4. **Draft Property Creation Owner Association (`backend/src/modules/properties/properties.controller.ts`)**:
   - `POST /properties` did not have `@UseGuards(JwtAuthGuard)` applied, allowing unauthenticated draft creation that assigned fallback `ownerId: 'usr-anon'`. Subsequent submission by authenticated users failed ownership verification or rejected with 401.

---

### 3. Exact Files Modified

| File | Changes Made |
| :--- | :--- |
| [`backend/src/modules/auth/auth.controller.ts`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/backend/src/modules/auth/auth.controller.ts) | Added `setAccessTokenCookie` and `clearAccessTokenCookie` helper methods to set `access_token` HttpOnly cookie upon OTP verification and token rotation, and clear on logout. |
| [`backend/src/modules/properties/properties.controller.ts`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/backend/src/modules/properties/properties.controller.ts) | Attached `@UseGuards(JwtAuthGuard)` and `@ApiBearerAuth()` to `POST /properties` (create), `PATCH /properties/:id` (update), and `DELETE /properties/:id` (delete). |
| [`frontend/lib/api-client.ts`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/frontend/lib/api-client.ts) | Added `credentials: 'include'`, automatic extraction of `casa_access_token` from `localStorage`, and header attachment `Authorization: Bearer <token>`. |
| [`frontend/contexts/auth-context.tsx`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/frontend/contexts/auth-context.tsx) | Synchronized `casa_access_token` in `localStorage` during OTP verification and session restoration; removed on logout. |
| [`admin/lib/api-client.ts`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/admin/lib/api-client.ts) | Auto-attaches `Authorization: Bearer <token>` from `casa_admin_access_token`. |
| [`admin/contexts/auth-context.tsx`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/admin/contexts/auth-context.tsx) | Synchronized `casa_admin_access_token` in `localStorage`. |
| [`admin/app/properties/page.tsx`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/admin/app/properties/page.tsx) | Migrated raw `fetch` call in `handleAddProperty` to `fetchAdminApi<AdminPropertyItem>`. |
| [`backend/src/modules/auth/guards/jwt-auth.guard.spec.ts`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/backend/src/modules/auth/guards/jwt-auth.guard.spec.ts) | Created comprehensive unit test suite covering Bearer headers, cookies, missing tokens, invalid tokens, and account suspension. |

---

### 4. Authentication Flow: Before vs After

```
BEFORE:
User fills wizard 
→ frontend submit button
→ fetchApi('/properties/:id/submit') [No credentials, No Bearer header]
→ Backend JwtAuthGuard finds no header and no cookie
→ 401 Unauthorized "Authentication token is missing"

AFTER:
User signs in via OTP
→ Backend sets access_token cookie + returns accessToken in JSON
→ AuthContext persists token in state + localStorage ('casa_access_token')
→ fetchApi auto-attaches 'Authorization: Bearer <token>' & sends credentials
→ Backend JwtAuthGuard extracts valid JWT payload
→ Controller extracts @CurrentUser()
→ PropertiesService verifies ownerId === user.id
→ Status transitions from DRAFT to PENDING_REVIEW
→ Property immediately appears in Admin Moderation Queue
```

---

### 5. Verification & Test Results

#### 5.1 Automated Backend Test Suite
```
PASS src/modules/properties/properties.service.spec.ts
PASS src/modules/auth/auth.service.spec.ts
PASS src/modules/health/health.service.spec.ts
PASS src/modules/admin/admin.service.spec.ts
PASS src/modules/auth/guards/jwt-auth.guard.spec.ts

Test Suites: 5 passed, 5 total
Tests:       34 passed, 34 total
Snapshots:   0 total
Time:        10.062 s
```

#### 5.2 Build Gates
- **Backend**: `npm run build` $\longrightarrow$ ✅ 0 errors
- **Frontend**: `npm run build` $\longrightarrow$ ✅ 0 errors
- **Admin**: `npm run build` $\longrightarrow$ ✅ 0 errors

#### 5.3 Live Localhost E2E Test Execution (`test-submission-401-fix.js`)
- `POST /auth/otp/request` $\longrightarrow$ HTTP 200
- `POST /auth/otp/verify` $\longrightarrow$ HTTP 200 (returned valid JWT + cookies)
- `GET /auth/me` with Bearer $\longrightarrow$ HTTP 200
- `GET /auth/me` without Bearer $\longrightarrow$ HTTP 401
- `POST /properties` (create) $\longrightarrow$ HTTP 201 (`ownerId: user.id`, `status: DRAFT`)
- `POST /properties/:id/submit` without Bearer $\longrightarrow$ HTTP 401
- `POST /properties/:id/submit` with Bearer $\longrightarrow$ HTTP 201 (`status: PENDING_REVIEW`)
- `GET /admin/properties/pending` $\longrightarrow$ Property visible in moderation queue
- `POST /admin/properties/:id/approve` $\longrightarrow$ HTTP 201 (`status: APPROVED`)
- `POST /admin/properties/:id/publish` $\longrightarrow$ HTTP 201 (`status: PUBLISHED`, `isPublished: true`)
- `GET /properties` (Public Marketplace) $\longrightarrow$ Property live in public discovery catalog

---

### 6. Security Assurance

- No authentication bypass was introduced.
- `JwtAuthGuard` remains strictly active on all write, update, delete, submit, and admin routes.
- Ownership protection strictly checks `property.ownerId === user.id`.
- Regular agents/owners cannot directly publish or bypass moderation.
- Public marketplace strictly filters by `status = PUBLISHED` and `isPublished = true`.
