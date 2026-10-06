# CASA — Software Requirements Specification (SRS)

## 1. Introduction & System Scope

### 1.1 Purpose
This document provides the definitive Software Requirements Specification (SRS) for the CASA Real Estate Marketplace Platform. It defines the functional behaviours, non-functional performance envelopes, system interfaces, security parameters, and architectural constraints governing development.

### 1.2 Document Conventions
- `FR-XXX-###`: Functional Requirement identifier.
- `NFR-XXX-###`: Non-Functional Requirement identifier.
- Priority levels: `P0` (Critical / Blocker), `P1` (High / MVP Essential), `P2` (Medium / Growth), `P3` (Low / Future Enhancement).

---

## 2. Overall System Description & Interfaces

```mermaid
graph TB
    subgraph Client Applications
        P_WEB[Public Web App: Next.js]
        P_AGENT[Agent Portal: Next.js]
        P_ADMIN[Admin Governance: Next.js]
    end
    
    subgraph API & Gateway Layer
        GATEWAY[NestJS Modular API Engine]
        AUTH_GUARD[JWT & RBAC Guards]
        THROTTLE[Rate Limiter & WAF]
    end
    
    subgraph Core Services
        SRV_AUTH[Auth Service]
        SRV_PROP[Property Service]
        SRV_SRCH[Search & Discovery Engine]
        SRV_MOD[Moderation Service]
        SRV_BILL[Billing & Subscription Service]
        SRV_MEDIA[Media & CDN Service]
        SRV_NOTIF[Notification Service]
    end
    
    subgraph Data & Persistence
        DB[(MongoDB Atlas Cluster)]
        CACHE[(Redis Caching & Session Layer)]
    end
    
    subgraph External Provider Integrations
        SMS_GW[SMS Gateway: DLT / Twilio]
        CDN[ImageKit Media Engine]
        YT[YouTube Video Streaming]
        MAPS[Ola Maps / Mapbox Geocoder]
        PAY[Razorpay Payment Webhooks]
        WA[WhatsApp Service]
    end
    
    Client Applications -->|HTTPS / TLS 1.3| THROTTLE
    THROTTLE --> AUTH_GUARD
    AUTH_GUARD --> GATEWAY
    
    GATEWAY --> Core Services
    Core Services --> DB
    Core Services --> CACHE
    
    SRV_AUTH --> SMS_GW
    SRV_MEDIA --> CDN
    SRV_PROP --> YT
    SRV_SRCH --> MAPS
    SRV_BILL --> PAY
    SRV_NOTIF --> WA
```

---

## 3. Functional Requirements (FR)

### 3.1 Authentication & Profile Management (FR-AUTH)

| ID | Description | Priority | Role | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **FR-AUTH-001** | Mobile Number OTP Dispatch | `P0` | All Users | System sends a 6-digit cryptographically random OTP valid for 5 minutes via SMS. |
| **FR-AUTH-002** | OTP Verification & JWT Issuance | `P0` | All Users | Valid OTP exchanges for a 15-minute Access JWT and an httpOnly Refresh Token (7 days). |
| **FR-AUTH-003** | Rate Limiting & Cooldown | `P0` | System | Enforce 60-second cooldown between OTP requests; maximum 5 OTP requests per phone per hour. |
| **FR-AUTH-004** | Role-Based Profile Setup | `P0` | User/Agent | First-time login prompts user for Name, Email (optional), Role selection (Purchaser / Agent / Owner). |
| **FR-AUTH-005** | Agent Agency Verification Submission | `P1` | Agent | Agents upload business registration / RERA / identification documents for admin verification badge. |
| **FR-AUTH-006** | Secure Session Refresh & Revocation | `P0` | All Users | Endpoint `/api/v1/auth/refresh` rotates tokens. Logout immediately invalidates refresh token in Redis/DB. |

---

### 3.2 Property Listing Management (FR-PROP)

| ID | Description | Priority | Role | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **FR-PROP-001** | Dynamic Multi-Category Creation | `P0` | Owner / Agent | Listing wizard adapts form fields based on selected category (e.g., plots require dimensions; flats require BHK/floor). |
| **FR-PROP-002** | Media Upload via Signed CDN URLs | `P0` | Owner / Agent | Direct image upload to ImageKit via signed backend tokens. Support up to 15 images (WebP/JPEG, max 10MB each). |
| **FR-PROP-003** | YouTube Video Walkthrough Embed | `P1` | Owner / Agent | Accepts valid YouTube URL/Video ID; validates format and renders privacy-enhanced embedded player. |
| **FR-PROP-004** | Geospatial Coordinate Resolution | `P0` | Owner / Agent | Captures Latitude/Longitude coordinates via map pin-drop or automated address geocoding. |
| **FR-PROP-005** | Submission for Moderation Queue | `P0` | Owner / Agent | Validated listing transitions from `DRAFT` to `PENDING_APPROVAL`. User receives confirmation notification. |
| **FR-PROP-006** | Advertiser Listing Management | `P0` | Owner / Agent | Advertiser dashboard allows viewing, updating, marking as `SOLD_OR_RENTED`, or deleting own listings. |

---

### 3.3 Search & Geospatial Discovery (FR-SRCH)

| ID | Description | Priority | Role | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **FR-SRCH-001** | Multi-Parameter Filter Engine | `P0` | Purchaser / Guest | Filter by Category, Listing Type (Sale/Rent/Lease), Price Range (Min-Max), BHK, Area, and Amenities. |
| **FR-SRCH-002** | Location Hierarchy Cascading Search | `P0` | Purchaser / Guest | Filter by State -> District -> City -> Locality taxonomy with autocomplete suggestions. |
| **FR-SRCH-003** | Radial Distance Geospatial Search | `P1` | Purchaser / Guest | Find properties within specified radius (e.g. 5km, 10km, 25km) using MongoDB `2dsphere` index. |
| **FR-SRCH-004** | Sort Order Governance | `P0` | Purchaser / Guest | Sort by: Price (Low to High / High to Low), Date (Newest to Oldest), Featured Placement. |
| **FR-SRCH-005** | Disambiguated Old / New Filter | `P1` | Purchaser / Guest | Multi-faceted filter supporting: (a) Newly Listed (<7 days), (b) Ready-to-Move / Resale, (c) Under Construction. |
| **FR-SRCH-006** | Paginated Infinite Scroll / Grid View | `P0` | Purchaser / Guest | Standard 20 items per page with deterministic cursor-based or offset pagination. |

---

### 3.4 User Engagement & Enquiries (FR-ENQ)

| ID | Description | Priority | Role | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **FR-ENQ-001** | WhatsApp Direct Click-to-Chat | `P0` | Purchaser | Generates pre-formatted WhatsApp link with Property Title, ID, Price, and URL directed to Advertiser. |
| **FR-ENQ-002** | In-Platform Enquiry Ticket | `P1` | Purchaser | Authenticated/Guest user submits contact message; stored in DB and dispatched to Agent dashboard. |
| **FR-ENQ-003** | Favourite Shortlist System | `P0` | Purchaser | Authenticated users can bookmark properties; accessible via `/dashboard/favourites`. |
| **FR-ENQ-004** | Calendly Site Visit Scheduling | `P1` | Purchaser / Agent | Renders embedded Calendly modal when configured on premium agent listings. |

---

### 3.5 Administrative Moderation & Governance (FR-ADM)

| ID | Description | Priority | Role | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **FR-ADM-001** | Moderation Queue Interface | `P0` | Admin | Displays pending listings with full media gallery, specs, advertiser verification history, and price benchmarks. |
| **FR-ADM-002** | Granular Approval & Rejection Flow | `P0` | Admin | One-click Approve changes status to `ACTIVE`. Reject requires rejection category code and custom feedback. |
| **FR-ADM-003** | Private Admin Remarks System | `P0` | Admin | Internal notes attached to listings/users, strictly inaccessible via public REST APIs. |
| **FR-ADM-004** | Dynamic Taxonomy Configuration | `P1` | Admin | Create, update, reorder, or deactivate property categories and supported location hierarchies. |
| **FR-ADM-005** | User & Agent Access Governance | `P0` | Admin | Suspend, ban, or elevate user accounts; verify and assign official Agent badges. |
| **FR-ADM-006** | System Audit Log Viewer | `P1` | Admin | Immutable logging of all administrative actions (approvals, bans, config changes, pricing modifications). |

---

### 3.6 Subscriptions & Monetization (FR-BILL)

| ID | Description | Priority | Role | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **FR-BILL-001** | Razorpay Order Creation & Webhooks | `P1` | Agent / Admin | Generates Razorpay checkout orders for listing boosts; validates cryptographic webhook signatures. |
| **FR-BILL-002** | Agent Subscription Tier Lifecycle | `P1` | Agent | Upgrades account active listing limits upon payment confirmation; handles renewals and grace periods. |
| **FR-BILL-003** | Featured Listing Placement Engine | `P1` | Owner / Agent | Applies active boost flag with scheduled expiry timestamp (e.g., 7 days); auto-downgrades on expiry. |

---

### 3.7 Multilingual & RTL System (FR-I18N)

| ID | Description | Priority | Role | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **FR-I18N-001** | Multi-Language Support (EN, HI, AR, UR) | `P0` | All Users | Full UI translation across English, Hindi, Arabic, and Urdu via dictionary tokens. |
| **FR-I18N-002** | Complete Bidirectional (RTL) Layout | `P0` | All Users | Selecting Arabic or Urdu shifts HTML `dir="rtl"`, mirrors navigation, layout grids, forms, and icons. |
| **FR-I18N-003** | Localized Routing & OpenGraph | `P0` | Search Crawlers | Clean localized URL prefixes (`/en/...`, `/hi/...`, `/ar/...`, `/ur/...`) with localized meta tags and hreflang links. |

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Performance & Latency (NFR-PERF)
- **NFR-PERF-001:** Core Web Vitals targets: Largest Contentful Paint (LCP) < 2.0s, Cumulative Layout Shift (CLS) < 0.05, First Input Delay (FID) / INP < 100ms on 4G networks.
- **NFR-PERF-002:** Public search API endpoints must respond in < 150ms for 95th percentile under normal load via cached queries and compound MongoDB indexing.
- **NFR-PERF-003:** All media images served in next-gen WebP/AVIF formats via CDN with responsive image size sets (`srcset`).

### 4.2 Security & Data Protection (NFR-SEC)
- **NFR-SEC-001:** Zero Plaintext Security: No OTPs, passwords, secrets, or administrative access keys stored in plaintext.
- **NFR-SEC-002:** Rate limiting enforced on all public and authentication routes (maximum 100 requests/minute per IP, 5 OTPs/hour per mobile number).
- **NFR-SEC-003:** Strict Separation of Concerns: Admin-only attributes (`adminRemarks`, `moderationHistory`, `internalRiskScore`) must be stripped by backend DTO serializers before sending responses to public/agent clients.
- **NFR-SEC-004:** Transport encryption enforced via TLS 1.3 with strict HTTP Strict Transport Security (HSTS) headers.

### 4.3 Scalability & Reliability (NFR-REL)
- **NFR-REL-001:** Target 99.95% system uptime through managed serverless deployments (Vercel) and MongoDB Atlas multi-zone replica sets.
- **NFR-REL-002:** Stateless backend application design allowing elastic horizontal scaling without sticky session dependencies.

### 4.4 Usability & Accessibility (NFR-UX)
- **NFR-UX-001:** WCAG 2.1 Level AA compliance across color contrast ratios (minimum 4.5:1 for normal text).
- **NFR-UX-002:** Fully responsive viewport design spanning mobile (320px+), tablet (768px+), and desktop (1024px, 1440px+).

---

## 5. System Constraints & Boundary Rules
1. **No Direct Financial Escrow:** CASA does not hold customer funds for property sale settlement.
2. **Zero VPS Maintenance:** No unmanaged virtual private servers; infrastructure relies exclusively on serverless and managed container platforms.
3. **Third-Party Rate Limits:** Mapping, SMS, and payment operations must incorporate exponential backoff retry mechanisms to handle third-party gateway downtime gracefully.
