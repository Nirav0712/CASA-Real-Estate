# CASA — PHASE 07 IMPLEMENTATION AUDIT
## Search & Discovery Engine Architecture & Baseline Assessment

**Date:** October 5, 2026  
**Status:** AUDIT COMPLETED / READY FOR IMPLEMENTATION  
**Phase:** 07 of 18  

---

### 1. Existing Search & Discovery Functionality

#### Backend API (`backend/src/modules/properties/`)
- **Current Endpoint:** `GET /api/v1/properties`
- **Supported Parameters:** `type`, `category`, `city`, `minPrice`, `maxPrice`, `bedrooms`, `q` (title, description, city, locality, category regex), `featured`, `page`, `limit`, `skip`.
- **Public Invariant:** Checks `status: { $in: ['PUBLISHED', 'ACTIVE'] }` and `isPublished: true`.
- **Existing Response:** Plain array of properties (does not return structured pagination metadata like `total`, `totalPages`, `hasNextPage`, `hasPreviousPage`).

#### Frontend Discovery Layer (`frontend/`)
- **Homepage Discovery (`frontend/app/page.tsx`)**:
  - Filter by `listingMode` (SALE / RENT / LEASE), category chips, location dropdown (Lucknow, Ayodhya, Varanasi, Kanpur, Noida), and keyword search bar.
  - Consumes `getProperties()` and `getFeaturedProperties()`.
- **No Dedicated Search Route**:
  - Currently, there is no standalone `/properties` or `/search` discovery page with comprehensive multi-facet sidebar filtering, debounced input, URL synchronization, and server-side pagination controls.

---

### 2. Existing Property Schema Fields Usable for Filtering

| Category | Available Schema Fields | Notes / Type |
| :--- | :--- | :--- |
| **Taxonomy** | `category` (10 Canonical Categories), `listingType` (`SALE`, `RENT`, `LEASE`) | Indexed exact/regex match |
| **Location** | `location.state`, `location.district`, `location.city`, `location.locality`, `location.pincode`, `location.coordinates` (`[lng, lat]`) | Hierarchical location filtering |
| **Pricing** | `price.amount`, `price.currency`, `price.priceUnit`, `price.isNegotiable`, `price.maintenance`, `price.securityDeposit`, `price.rentPeriod` | Numeric range queries (`$gte`, `$lte`) |
| **Specifications**| `specs.bedrooms`, `specs.bathrooms`, `specs.area`, `specs.areaUnit`, `specs.carpetArea`, `specs.carpetAreaSqFt`, `specs.constructionStatus`, `specs.furnishing`, `specs.facing`, `specs.parking`, `specs.floorLevel`, `specs.totalFloors`, `specs.propertyAge` | Multi-facet structured specs |
| **Amenities** | `amenities` (`string[]`) | AND-logic array filtering (`$all`) |
| **Publishing** | `status`, `isPublished`, `publishedAt`, `createdAt`, `isFeatured` | Date range / freshness filtering |

---

### 3. Existing MongoDB Indexes Review

#### Existing Indexes (`backend/src/modules/properties/schemas/property.schema.ts`):
- `id: 1` (unique)
- `slug: 1` (unique)
- `referenceId: 1`
- `ownerId: 1`
- `advertiserId: 1`
- `{ status: 1, isPublished: 1 }`
- `{ category: 1, status: 1 }`
- `{ 'location.city': 1, status: 1 }`
- `{ ownerId: 1, createdAt: -1 }`
- `{ isFeatured: -1, createdAt: -1 }`

#### Newly Required Indexes for Phase 07:
- Text Index on `{ 'title.en': 'text', 'title.hi': 'text', 'description.en': 'text', 'location.locality': 'text', 'location.city': 'text' }` with fallback regex search.
- Compound Index on `{ status: 1, isPublished: 1, 'price.amount': 1 }` for price range sorting.
- Compound Index on `{ status: 1, isPublished: 1, publishedAt: -1 }` for publication freshness sorting.
- Compound Index on `{ status: 1, isPublished: 1, 'specs.bedrooms': 1 }` for bedroom facet filtering.

---

### 4. Missing Search Capabilities to Implement

1. **Dedicated Search Endpoint (`GET /api/v1/properties/search`)**:
   - Comprehensive query parameters: `q`, `category`, `listingType`, `state`, `district`, `city`, `locality`, `pincode`, `minPrice`, `maxPrice`, `minArea`, `maxArea`, `bedrooms`, `bathrooms`, `constructionStatus`, `propertyAge`, `furnishing`, `facing`, `amenities`, `freshness`, `featured`, `sort`, `page`, `limit`.
   - Structured paginated response with metadata (`page`, `limit`, `total`, `totalPages`, `hasNextPage`, `hasPreviousPage`).
   - Server-side public visibility enforcement (`status = PUBLISHED`, `isPublished = true`).
2. **Multi-Amenity AND-Filtering**:
   - Support comma-separated or array parameters with MongoDB `$all` operator.
3. **Listing Freshness Logic**:
   - `today` (24h), `last_3_days` (72h), `last_7_days` (168h), `last_30_days` (720h) filtering against `publishedAt` / `createdAt`.
4. **Multi-Criteria Sorting**:
   - `newest` (`publishedAt: -1, createdAt: -1`), `oldest` (`publishedAt: 1`), `price_low` (`price.amount: 1`), `price_high` (`price.amount: -1`), `area_low` (`specs.carpetAreaSqFt: 1`), `area_high` (`specs.carpetAreaSqFt: -1`), `featured` (`isFeatured: -1, publishedAt: -1`).
5. **Dedicated Public Search & Discovery Page (`frontend/app/properties/page.tsx`)**:
   - Responsive multi-facet filter bar / drawer (Desktop sidebar + Mobile drawer).
   - Real-time debounced keyword search.
   - Bidirectional URL query synchronization (`/properties?city=Lucknow&category=Apartment&minPrice=5000000`).
   - Active filter chips with one-click clear.
   - Pagination controls, loading skeletons, and interactive empty states.
6. **Geospatial Discovery Support (Phase 07 Scope)**:
   - Schema already defines `coordinates: [longitude, latitude]`.
   - Support `lat`, `lng`, `radius` query parameters with preliminary boundary/distance evaluation; full polygon clustering and map view is intentionally scheduled for Phase 11.

---

### 5. Files to Create or Modify

#### Backend
- `backend/src/modules/properties/dto/search-properties.dto.ts` (New DTO with `class-validator`)
- `backend/src/modules/properties/properties.service.ts` (Add `search()` method and upgrade `findAll()`)
- `backend/src/modules/properties/properties.controller.ts` (Add `GET /properties/search`)
- `backend/src/modules/properties/schemas/property.schema.ts` (Add text and compound indexes)
- `backend/src/modules/properties/properties.service.spec.ts` (Add comprehensive unit test coverage)

#### Frontend
- `frontend/services/property-service.ts` (Add `searchProperties()` method)
- `frontend/types/index.ts` (Add `SearchPropertiesParams`, `PaginatedResponse<T>` interfaces)
- `frontend/app/properties/page.tsx` (New search & discovery page)
- `frontend/features/properties/search-filters.tsx` (New multi-facet filter component)
- `frontend/components/layout/header.tsx` (Link navigation to `/properties`)
- `frontend/app/page.tsx` (Connect homepage search button to navigate to `/properties` with query params)

---

### 6. Risks & Compatibility Considerations

- **Preserve Phase 06 Compatibility**: `GET /api/v1/properties` must remain functional for any existing callers.
- **Strict Public Visibility Invariant**: Private drafts, pending moderation listings, rejected items, unpublished items, and archived properties must never leak to search responses.
- **Sanitization & Injection Defense**: Numeric ranges and regex queries must be strictly parsed to prevent MongoDB injection or ReDoS attacks.
