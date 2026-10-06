# CASA — REST API Roadmap & Endpoint Inventory

## 1. Global API Standards & Response Envelopes

All RESTful endpoints in CASA conform to standard HTTP semantics, strict JSON serialization, and uniform response envelopes.

### 1.1 Standard Success Envelope
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 150,
    "totalPages": 8
  },
  "timestamp": "2026-10-01T10:00:00.000Z"
}
```

### 1.2 Standard Error Envelope
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed on one or more fields",
  "errors": [
    {
      "field": "price.amount",
      "rule": "min",
      "message": "Price amount must be greater than zero"
    }
  ],
  "timestamp": "2026-10-01T10:00:00.000Z",
  "path": "/api/v1/properties"
}
```

---

## 2. API Endpoint Inventory by Module

### 2.1 Authentication Module (`/api/v1/auth`)

| Method | Endpoint | Purpose | Auth | Role | Validation Schema | Expected Resp | Error Codes |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/otp/send` | Request SMS OTP | Public | Any | `{ mobileNumber: string, countryCode: string }` | `200 OK` (Cooldown sec) | 400, 429 |
| `POST` | `/api/v1/auth/otp/verify` | Verify OTP & Login | Public | Any | `{ mobileNumber: string, otp: string }` | `200 OK` (JWT + User) | 400, 401, 429 |
| `POST` | `/api/v1/auth/refresh` | Refresh Access JWT | Cookie | Any | Cookie: `refreshToken` | `200 OK` (New Access JWT) | 401, 403 |
| `POST` | `/api/v1/auth/logout` | Revoke Session | Bearer | Any | None | `200 OK` (Cleared Cookie) | 401 |
| `GET` | `/api/v1/auth/me` | Fetch Current Profile | Bearer | Any | None | `200 OK` (User Profile) | 401 |

---

### 2.2 Users & Profiles Module (`/api/v1/users`)

| Method | Endpoint | Purpose | Auth | Role | Validation Schema | Expected Resp | Error Codes |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `PATCH` | `/api/v1/users/profile` | Update Profile Details | Bearer | Any | `{ fullName?: string, email?: string, language?: string }` | `200 OK` (Updated User) | 400, 401, 409 |
| `GET` | `/api/v1/users/favourites` | List Saved Properties | Bearer | Any | Query: `{ page?: number, limit?: number }` | `200 OK` (Property Array) | 401 |
| `POST` | `/api/v1/users/favourites/:id`| Add Property to Favs | Bearer | Any | Param: `id: ObjectId` | `201 Created` | 401, 404, 409 |
| `DELETE`| `/api/v1/users/favourites/:id`| Remove From Favs | Bearer | Any | Param: `id: ObjectId` | `200 OK` | 401, 404 |

---

### 2.3 Real Estate Agents Module (`/api/v1/agents`)

| Method | Endpoint | Purpose | Auth | Role | Validation Schema | Expected Resp | Error Codes |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `POST` | `/api/v1/agents/register` | Apply for Agent Role | Bearer | Any | `{ agencyName: string, reraNumber?: string, bio?: string }`| `201 Created` (Agent Doc) | 400, 401, 409 |
| `POST` | `/api/v1/agents/verify-docs`| Submit Badging Docs | Bearer | Agent | `{ documentUrls: string[], docType: string }` | `200 OK` (Pending Review)| 400, 401, 403 |
| `GET` | `/api/v1/agents/:id` | Public Agent Profile | Public | Any | Param: `id: ObjectId` | `200 OK` (Agent + Ads) | 404 |
| `PATCH` | `/api/v1/agents/calendly` | Update Calendly Link | Bearer | Agent | `{ calendlyUrl: string (URL) }` | `200 OK` | 400, 401, 403 |

---

### 2.4 Properties & Advertisements Module (`/api/v1/properties`)

| Method | Endpoint | Purpose | Auth | Role | Validation Schema | Expected Resp | Error Codes |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `GET` | `/api/v1/properties` | Public Search & Filter | Public | Any | Query: `{ category, city, minPrice, maxPrice, radius, lat, lng, page }` | `200 OK` (Listings + Meta)| 400 |
| `GET` | `/api/v1/properties/:slug` | View Property Details | Public | Any | Param: `slug: string` | `200 OK` (Property Object)| 404 |
| `POST` | `/api/v1/properties` | Create Property Draft | Bearer | Owner/Agent | Complete `CreatePropertyDto` (specs, media, location, price)| `201 Created` (Draft Obj) | 400, 401, 403 |
| `PUT` | `/api/v1/properties/:id` | Update Property | Bearer | Owner/Agent | Partial `UpdatePropertyDto` | `200 OK` (Updated Obj) | 400, 401, 403, 404 |
| `POST` | `/api/v1/properties/:id/submit`| Submit for Approval | Bearer | Owner/Agent | Param: `id: ObjectId` | `200 OK` (Status: PENDING)| 400, 401, 403, 404 |
| `PATCH` | `/api/v1/properties/:id/status`| Mark Sold / Inactive | Bearer | Owner/Agent | `{ status: 'SOLD_OR_RENTED' \| 'ACTIVE' }` | `200 OK` | 400, 401, 403, 404 |
| `DELETE`| `/api/v1/properties/:id` | Soft Delete Listing | Bearer | Owner/Agent | Param: `id: ObjectId` | `200 OK` | 401, 403, 404 |

---

### 2.5 Categories & Taxonomies Module (`/api/v1/categories`)

| Method | Endpoint | Purpose | Auth | Role | Validation Schema | Expected Resp | Error Codes |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `GET` | `/api/v1/categories` | List All Categories | Public | Any | Query: `{ activeOnly: boolean }` | `200 OK` (Category Array)| None |
| `GET` | `/api/v1/categories/:slug` | Category Attributes | Public | Any | Param: `slug: string` | `200 OK` (Category Schema)| 404 |

---

### 2.6 Locations Module (`/api/v1/locations`)

| Method | Endpoint | Purpose | Auth | Role | Validation Schema | Expected Resp | Error Codes |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `GET` | `/api/v1/locations/cities` | List Supported Cities | Public | Any | Query: `{ state?: string }` | `200 OK` (City Array) | None |
| `GET` | `/api/v1/locations/suggest` | Location Autocomplete | Public | Any | Query: `{ q: string, city?: string }` | `200 OK` (Suggestions) | 400 |

---

### 2.7 Enquiries & Leads Module (`/api/v1/enquiries`)

| Method | Endpoint | Purpose | Auth | Role | Validation Schema | Expected Resp | Error Codes |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `POST` | `/api/v1/enquiries` | Submit Property Enquiry| Bearer/Pub | Any | `{ propertyId: ObjectId, message: string, senderName: string, senderPhone: string }` | `201 Created` | 400, 429 |
| `GET` | `/api/v1/enquiries/inbox` | Agent Received Leads | Bearer | Owner/Agent | Query: `{ status?: string, page?: number }` | `200 OK` (Leads Array) | 401, 403 |
| `PATCH` | `/api/v1/enquiries/:id` | Update Lead Status | Bearer | Owner/Agent | `{ status: 'READ' \| 'CONTACTED' \| 'CLOSED' }` | `200 OK` | 400, 401, 403, 404 |

---

### 2.8 Subscriptions & Monetization Module (`/api/v1/billing`)

| Method | Endpoint | Purpose | Auth | Role | Validation Schema | Expected Resp | Error Codes |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `GET` | `/api/v1/billing/plans` | List Available Tiers | Public | Any | None | `200 OK` (Plans Array) | None |
| `POST` | `/api/v1/billing/order` | Create Razorpay Order | Bearer | Agent/Owner | `{ planCode?: string, propertyId?: string, purpose: string }`| `201 Created` (Order Details)| 400, 401, 403 |
| `POST` | `/api/v1/billing/webhook` | Gateway Webhook | Public | Gateway Sig | Validated `X-Razorpay-Signature` Header | `200 OK` | 400, 401 |

---

### 2.9 Media & Uploads Module (`/api/v1/media`)

| Method | Endpoint | Purpose | Auth | Role | Validation Schema | Expected Resp | Error Codes |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `POST` | `/api/v1/media/auth-params` | Get Signed Upload Token| Bearer | Owner/Agent | `{ folder: 'properties' \| 'profiles' \| 'docs' }` | `200 OK` (Signature + Token)| 401, 403 |
| `DELETE`| `/api/v1/media/:fileId` | Delete Media Asset | Bearer | Owner/Agent | Param: `fileId: string` | `200 OK` | 401, 403, 404 |

---

### 2.10 Admin Operations Module (`/api/v1/admin`)

| Method | Endpoint | Purpose | Auth | Role | Validation Schema | Expected Resp | Error Codes |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/queue` | Pending Listings Queue | Bearer | Moderator/Admin | Query: `{ category?: string, page?: number }` | `200 OK` (Full Review DTO)| 401, 403 |
| `POST` | `/api/v1/admin/approve/:id` | Approve Listing | Bearer | Moderator/Admin | Param: `id: ObjectId`, Body: `{ note?: string }` | `200 OK` | 401, 403, 404 |
| `POST` | `/api/v1/admin/reject/:id` | Reject Listing | Bearer | Moderator/Admin | Param: `id: ObjectId`, Body: `{ reasonCode: string, feedback: string, internalNote?: string }` | `200 OK` | 400, 401, 403, 404 |
| `POST` | `/api/v1/admin/remark/:id` | Add Internal Remark | Bearer | Moderator/Admin | `{ remark: string, flagLevel: 'INFO' \| 'WARNING' }` | `201 Created` | 400, 401, 403, 404 |
| `POST` | `/api/v1/admin/categories` | Create Category | Bearer | Admin/SuperAdmin| Category Creation DTO | `201 Created` | 400, 401, 403, 409 |
| `GET` | `/api/v1/admin/audit-logs` | View System Logs | Bearer | Admin/SuperAdmin| Query: `{ actorId?: string, action?: string, page?: number }` | `200 OK` (Log Stream) | 401, 403 |
| `PATCH` | `/api/v1/admin/users/:id/ban`| Suspend User Account | Bearer | Admin/SuperAdmin| `{ isBanned: boolean, banReason: string }` | `200 OK` | 400, 401, 403, 404 |
