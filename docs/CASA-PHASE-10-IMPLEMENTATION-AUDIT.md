# CASA Phase 10 — Purchaser Dashboard & Buyer Experience Audit

## 1. System Scope & Objectives
The objective of Phase 10 was to build the production-oriented, database-backed **Purchaser Dashboard & Buyer Experience** within CASA Real Estate Marketplace.

This implementation directly integrates:
- **Existing User System & JWT Authentication** (Role: `PURCHASER`)
- **Existing Property System & Published Inventory**
- **Existing Leads & Enquiries Collection** (`leads`)
- **Real MongoDB Atlas Persistence** with compound index optimization
- **Zero Mock / Zero Fake Data Architecture**

---

## 2. Architecture & File Inventory

### 2.1 Backend Architecture (`backend/src/modules/purchaser`)
1. **`schemas/saved-property.schema.ts`**:
   - Model: `SavedProperty` (`saved_properties` collection)
   - Compound unique index: `{ purchaserId: 1, propertyId: 1 }`
   - Chronological index: `{ purchaserId: 1, createdAt: -1 }`
2. **`schemas/recently-viewed.schema.ts`**:
   - Model: `RecentlyViewed` (`recently_viewed` collection)
   - Compound unique index: `{ purchaserId: 1, propertyId: 1 }`
   - Timestamp index: `{ purchaserId: 1, viewedAt: -1 }`
   - Cap: Latest 20 entries per buyer automatically pruned.
3. **`dto/update-purchaser-profile.dto.ts`**:
   - Strict whitelisting for editable fields: `name`, `email`, `avatar`, `preferredLanguage`, `preferredCity`, `preferredLocation`, `budgetMin`, `budgetMax`, `preferredCategory`, `preferredListingType`, `bedrooms`, `furnishing`.
   - Rejection & immunity against role, status, permission, and internal ID tampering.
4. **`dto/purchaser-enquiry-query.dto.ts`**:
   - Query pagination (`page`, `limit`), `status` filtering, and keyword search (`q`).
5. **`purchaser.service.ts`**:
   - Complete business logic for dashboard KPI aggregation, persistent favorites, enquiry listing, single-enquiry isolation, enquiry cancellation, recent views, and personalized recommendations from published listings.
6. **`purchaser.controller.ts`**:
   - Protected with `@UseGuards(JwtAuthGuard)` and `@ApiBearerAuth()`. All purchaser identities derived securely server-side via `@CurrentUser()`.
7. **`purchaser.module.ts`**:
   - Registered schemas with `MongooseModule.forFeature` and exported `PurchaserService`.
8. **`purchaser.service.spec.ts`**:
   - Unit tests covering KPIs, saves, unsaves, enquiries, and RBAC isolation.

### 2.2 Frontend Architecture (`frontend/`)
1. **`contexts/saved-properties-context.tsx`**:
   - Global reactive favorite synchronization across property cards, search results, detail pages, and buyer dashboard.
2. **`services/purchaser-service.ts`**:
   - Clean API client methods for purchaser workspace.
3. **`app/dashboard/purchaser/layout.tsx`**:
   - Shared responsive buyer workspace navigation with active tab indicators and authentication guarding.
4. **`app/dashboard/purchaser/page.tsx`**:
   - Main overview dashboard with real live KPIs (`Saved`, `Enquiries`, `Recently Viewed`), shortlist preview, enquiry queue, curated recommendations, and preference shortcut.
5. **`app/dashboard/purchaser/saved/page.tsx`**:
   - Dedicated Saved Properties page with responsive card grid, removal action, and explore CTA.
6. **`app/dashboard/purchaser/enquiries/page.tsx`**:
   - My Enquiries page with status filter tabs (`All`, `New`, `Contacted`, `In Progress`, `Closed`), search filter, detail timeline modal, and cancellation button.
7. **`app/dashboard/purchaser/recent/page.tsx`**:
   - Recently Viewed properties page with chronological timestamps.
8. **`app/dashboard/purchaser/profile/page.tsx`**:
   - Buyer Profile & Preferences page with server-governance security badges.
9. **`features/properties/property-detail-view.tsx` & `property-card.tsx`**:
   - Updated to use real database-backed favorites toggle, pre-filled authenticated enquiry form, and automatic recently-viewed tracking on property inspection.
10. **`components/layout/header.tsx`**:
    - Integrated direct Purchaser Workspace links into desktop user dropdown and mobile navigation drawer.

---

## 3. Endpoints & API Contract

| HTTP Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/purchaser/dashboard` | Aggregated dashboard KPIs, previews & recommendations | `JwtAuthGuard` |
| `GET` | `/api/v1/purchaser/profile` | Current buyer profile & search preferences | `JwtAuthGuard` |
| `PATCH` | `/api/v1/purchaser/profile` | Update profile details (whitelisted fields only) | `JwtAuthGuard` |
| `GET` | `/api/v1/purchaser/saved-properties` | Paginated saved favorites | `JwtAuthGuard` |
| `GET` | `/api/v1/purchaser/saved-properties/ids` | Quick array of saved property IDs for state sync | `JwtAuthGuard` |
| `GET` | `/api/v1/purchaser/saved-properties/:id/status` | Boolean check if single property is saved | `JwtAuthGuard` |
| `POST` | `/api/v1/purchaser/saved-properties/:id` | Save published property to favorites (Idempotent) | `JwtAuthGuard` |
| `DELETE` | `/api/v1/purchaser/saved-properties/:id` | Remove property from favorites | `JwtAuthGuard` |
| `GET` | `/api/v1/purchaser/recently-viewed` | Browsing history list | `JwtAuthGuard` |
| `POST` | `/api/v1/purchaser/recently-viewed/:id` | Record property view timestamp | `JwtAuthGuard` |
| `GET` | `/api/v1/purchaser/enquiries` | Paginated buyer enquiries | `JwtAuthGuard` |
| `GET` | `/api/v1/purchaser/enquiries/:id` | Single enquiry details & timeline (Strict Ownership) | `JwtAuthGuard` |
| `PATCH` | `/api/v1/purchaser/enquiries/:id/cancel` | Cancel / close buyer enquiry | `JwtAuthGuard` |
| `GET` | `/api/v1/purchaser/recommendations` | Curated recommendations matching buyer preferences | `JwtAuthGuard` |

---

## 4. Security, RBAC & Isolation Verification

1. **Strict Server-Side Derivation**: `purchaserId` is always extracted from the cryptographically verified JWT payload (`req.user.id`). Frontend payloads cannot spoof buyer identity.
2. **Access Isolation**: Cross-purchaser access attempts (e.g. User B querying User A's enquiry) immediately fail with `403 Forbidden` / `404 Not Found`.
3. **Privilege Escalation Immunity**: Payloads attempting to modify `role`, `status`, or `isVerifiedAgent` via profile update endpoints are ignored; role and status remain intact.
4. **Publish Validation Guard**: Users cannot save or view unpublished, draft, or rejected listings in favorites or recent views.
5. **Auditing**: All key buyer events (`PROPERTY_SAVED`, `PROPERTY_UNSAVED`, `PURCHASER_PROFILE_UPDATED`, `ENQUIRY_STATUS_CHANGED`) are persisted to `AuditLog` collection.
