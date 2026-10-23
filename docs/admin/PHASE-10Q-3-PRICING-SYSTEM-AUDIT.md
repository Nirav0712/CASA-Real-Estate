# ENGAGE24 — PHASE 10Q.3: PRICING SYSTEM AUDIT & UI/UX REDESIGN PLAN
**Project:** CASA Real Estate Marketplace / `myproperty.in` (`D:\My property.in`)  
**Document Classification:** Architecture Audit & System Engineering Plan  
**Target Milestone:** Phase 10Q.3 — Role-Based SaaS Pricing, Durations & Hostinger-Style UI  
**Status:** AUDIT & PLANNING ONLY — NO CODE OR DATA MODIFICATIONS APPLIED  

---

## EXECUTIVE SUMMARY & STATUS CLASSIFICATION

This document presents a comprehensive, forensic audit of the existing pricing, subscription, and entitlement infrastructure in `d:\CASA Real Estate` (`myproperty.in`). It identifies critical discrepancies between the frontend billing views, backend payment configs, and database packages. It also provides an implementation-ready technical and UI/UX redesign plan inspired by modern SaaS pricing standards (specifically reference Hostinger pricing conventions) customized for real estate supply-side personas (Builders, Brokers, and Agents).

To ensure transparency and compliance with engineering safety standards, this document is strictly organized into three distinct tiers:
- **[VERIFIED FACTS]**: Concrete behaviors, schemas, and endpoints confirmed directly in the active codebase.
- **[PROPOSED FEATURES]**: Concrete architectural designs and specifications recommended for implementation.
- **[ITEMS REQUIRING BUSINESS APPROVAL]**: Strategic variables (pricing figures, discount percentages, seat allocations, tax inclusions) requiring explicit sign-off from platform stakeholders before deployment.

---

## 1. AUDIT OF THE EXISTING PRICING SYSTEM

### 1.1 Verified File Paths & Architecture

The existing pricing and subscription ecosystem is divided across three separate sub-systems:

```
d:\CASA Real Estate\
├── frontend\
│   ├── app\dashboard\billing\page.tsx          # Current Client Billing & Plans UI
│   ├── components\pricing\plan-selection-modal.tsx  # Free Trial / KYC Selection Modal
│   ├── components\pricing\trial-expired-modal.tsx   # Trial Expiry Alert & Sales Hotline
│   ├── services\payment-service.ts             # Gateway & Checkout API Client
│   └── services\entitlements-service.ts        # Packages & Trial Activation Client
├── admin\
│   ├── app\packages\page.tsx                   # Admin Package List & Active Toggle
│   ├── app\packages\[id]\page.tsx              # Admin Package Editor Form
│   ├── app\packages\create\page.tsx            # Admin Package Creator Form
│   ├── app\subscriptions\page.tsx             # Static Mock Subscription Cards
│   └── app\usage\page.tsx                      # User Quota & Entitlement Monitor
└── backend\src\modules\
    ├── payments\
    │   ├── config\pricing.config.ts            # Hardcoded Backend Pricing Catalog
    │   ├── schemas\payment.schema.ts           # Payment Transactions Collection ('payments')
    │   ├── schemas\subscription.schema.ts      # Active Subscriptions Collection ('subscriptions')
    │   ├── enums\payment.enums.ts              # Payment & Subscription Enums
    │   ├── payments.service.ts                 # Order Creation, Signature Verification, Webhooks
    │   └── payments.controller.ts              # /payments/pricing, /payments/orders, /payments/verify
    ├── entitlements\
    │   ├── schemas\package.schema.ts           # Authoritative Plan Packages Collection ('packages')
    │   ├── enums\permissions.enum.ts           # 80+ Granular RBAC Permissions
    │   ├── entitlements.service.ts             # Seeding, Trial Life-cycle, Quota Calculations
    │   ├── entitlements-admin.controller.ts    # /admin/entitlements/packages CRUD
    │   └── entitlements-client.controller.ts   # /entitlements/packages, /entitlements/start-trial
    └── intelligence\schemas\
        └── subscription-entitlement.schema.ts  # Redundant / Stale 'subscription_plans' & 'usage_counters'
```

---

### 1.2 Detailed Component & Logic Audit

#### A. Public & Dashboard Pricing Pages
- **Public `/pricing` Route:** **DOES NOT EXIST.** There is currently no public-facing marketing page explaining tiers to prospective unregistered visitors.
- **Client Billing Dashboard (`frontend/app/dashboard/billing/page.tsx`):**
  - Displays three hardcoded cards (`Starter Agent` @ ₹2,499/mo, `Featured Broker Pro` @ ₹6,999/mo, `Developer & Enterprise` @ ₹19,999/mo).
  - Uses hardcoded `productCode` strings: `SUB_PRO_1M`, `SUB_PRO_3M`, and `SUB_BIZ_1M`.
  - **CRITICAL AUDIT FINDING [VERIFIED FACT]:** These hardcoded frontend codes **do not exist** in `backend/src/modules/payments/config/pricing.config.ts`. In `pricing.config.ts`, the catalog only defines `SUBSCRIPTION_PRO` (₹2,499) and `SUBSCRIPTION_BUSINESS` (₹6,999). When the frontend calls `createPaymentOrder`, the backend's `resolvePricingProduct` cannot find `SUB_PRO_1M` or `SUB_BIZ_1M` and falls back to matching by purpose (`PaymentPurpose.SUBSCRIPTION`). The first active subscription product returned is `SUBSCRIPTION_PRO`. **Consequently, all three tiers in the UI currently bill the user exactly ₹2,499.**
  - Includes a Razorpay checkout handler with a fallback mock verification for testing.
  - Renders recent payment transactions fetched from `/api/v1/payments/my`.
  - Exempts `BUYER`, `TENANT`, `PURCHASER`, and `SUPER_ADMIN` accounts from billing requirements.

#### B. Free Trial & Expiry Modals
- **Plan Selection Modal (`frontend/components/pricing/plan-selection-modal.tsx`):**
  - Fetches `/api/v1/entitlements/packages` but only displays a single 3-Day Free Trial card (₹0 / 3 Days) directing the user to complete KYC verification (`/dashboard/kyc`).
  - Displays the platform's manual verification hotline (`7069754589`).
- **Trial Expired Modal (`frontend/components/pricing/trial-expired-modal.tsx`):**
  - Triggered automatically when an advertiser's 3-day trial expires.
  - Provides direct one-click dial buttons to the Sales Department (`+91 98765 43210` / `7069754589`) and Customer Care (`+91 98765 43211`).
  - Displays dynamic packages fetched from `/api/v1/entitlements/packages`.

#### C. Database Schemas & Data Model Disconnect
1. **`Package` Schema (`backend/src/modules/entitlements/schemas/package.schema.ts`):**
   - Collection name: `packages` in MongoDB Atlas.
   - Fields: `name`, `slug`, `price` (single numeric field), `currency` (default `'INR'`), `billingPeriod` (`FREE`, `1_MONTH`, `60_DAYS`, `90_DAYS`, `6_MONTHS`, `1_YEAR`, `MONTHLY`, `QUARTERLY`, `YEARLY`, `CUSTOM`), `durationDays`, `isActive`, `isDefault`, `features: string[]`, `limits: PackageLimits`, `permissions: string[]`, `targetAccountTypes: string[]`.
   - **CRITICAL AUDIT FINDING [VERIFIED FACT]:** The `Package` schema represents a 1-to-1 relationship between a package and a single billing duration. It cannot store a matrix of 6 durations (1m, 2m, 3m, 6m, 12m, 36m) per plan tier.
2. **`Subscription` Schema (`backend/src/modules/payments/schemas/subscription.schema.ts`):**
   - Collection name: `subscriptions` in MongoDB Atlas.
   - Fields: `userId`, `plan` (enum: `FREE`, `PRO`, `BUSINESS`), `status` (`ACTIVE`, `EXPIRED`, `CANCELLED`), `startDate`, `endDate`, `paymentId`, `orderId`, `metadata`.
   - **CRITICAL AUDIT FINDING [VERIFIED FACT]:** The `plan` enum in the `Subscription` schema is restricted to `FREE`, `PRO`, `BUSINESS`. It does not support role-based tier names (such as `DEVELOPER_GOLD`, `BROKER_PLATINUM`, `AGENT_BASIC`).
3. **`SubscriptionPlan` & `UsageCounter` Schemas (`backend/src/modules/intelligence/schemas/subscription-entitlement.schema.ts`):**
   - Collections: `subscription_plans` and `usage_counters`.
   - Injected in `IntelligenceService` constructor but never referenced in any service logic. Represents orphaned prototype code.

#### D. Admin Panel Capabilities & Gaps
- **Package Management (`admin/app/packages/page.tsx` & `[id]/page.tsx`):**
  - Full CRUD operations connected to `/api/v1/admin/entitlements/packages`.
  - Admins can configure name, description, single price, single billing period, active status, default/popular flags, target account types, and quota limits (`propertyListingsMax`, `featuredListingsMax`, `propertyViewsMonthly`, `savedItemsMax`, `leadsMonthly`, `enquiriesMonthly`, `chatThreadsMax`, `teamMembersMax`).
  - **GAPS [VERIFIED FACT]:**
    - Cannot configure multiple durations with tiered discounts.
    - `BillingPeriod` enum does not have a 36-month option.
    - No fields for tax configurations (GST inclusive/exclusive), renewal pricing, or promotional strikethrough comparison prices.
    - No public card preview.
- **Admin Subscriptions Page (`admin/app/subscriptions/page.tsx`):**
  - **CRITICAL AUDIT FINDING [VERIFIED FACT]:** Completely static presentation dummy component with 3 hardcoded cards. Does not fetch subscriptions, has no subscriber listing table, and offers no renewal/cancellation controls.

#### E. Backend Entitlement Enforcement Audit
| Entitlement / Limit | Configured in Package Schema? | Displayed in UI? | Actually Enforced by Backend APIs? | Verified Code Location |
| :--- | :---: | :---: | :---: | :--- |
| **Property Contact Views** | Yes (`propertyViews`) | Yes | **YES (ENFORCED)** | `properties.service.ts:1214` calls `trackAndValidatePropertyView` and `redactContactData`. |
| **Property Listings Max** | Yes (`propertyListings`) | Yes | **NO (UNENFORCED)** | `properties.service.ts:1535` (`createProperty`) performs zero quota checks. Users can post infinite listings. |
| **Monthly Leads Quota** | Yes (`monthlyLeads`) | Yes | **NO (UNENFORCED)** | `leads.service.ts` routes leads unconditionally. `entitlements.service.ts:1343` hardcodes `leads.used = 0`. |
| **Featured Listing Slots**| Yes (`featuredListingsMax`)| Yes | **PARTIAL** | Paid feature orders enforce `featuredUntil`, but package quota slots are not decremented. |
| **Team Member Seats** | Yes (`teamMembers`) | Yes | **NO (UNENFORCED)** | No multi-tenant team registration quota validator exists. |
| **Reel Upload Gate** | RBAC only (`advertisers`) | Yes | **ROLE-ENFORCED ONLY** | Enforces user role (Buyers/Tenants blocked), but package tier has no quota limit check. |
| **CRM Data Export** | RBAC permission | Yes | **PERMISSION-ENFORCED** | Enforced via `Permission.CRM_EXPORT` guard. |

#### F. Subscription Lifecycle & Payment Engine
- **Payment Gateway:** Razorpay integration via `RazorpayPaymentProvider`. Generates `CASA_ORD_...` order IDs, computes HMAC-SHA256 signatures, and verifies webhooks.
- **Auto-Renewal / Recurring Billing:** **DOES NOT EXIST.** Subscriptions are one-time fixed-duration purchases. Razorpay Subscription / Mandate APIs are not integrated.
- **Expiry Logic:** Handled passively. When `endDate < now`, `subscriptionModel.findOne` returns `null` and user falls back to the default free package. No background worker or cron marks records as `EXPIRED`.
- **Cancellation & Refunds:** Admin can issue manual refunds via `POST /api/v1/payments/admin/:id/refund`. There is no customer self-service cancellation flow.
- **Invoicing & Taxes:** MongoDB records store total amount and currency. No GST tax breakdown (CGST/SGST/IGST) and no downloadable PDF invoices are generated.

---

## 2. REQUIRED CUSTOMER CATEGORIES & FEATURE MATRIX

To align with real estate industry operations in India and the GCC, the platform must serve three distinct supply-side personas:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ENGAGE24 CUSTOMER PERSONAS                       │
├──────────────────────────┬──────────────────────────┬───────────────────────┤
│  A. BUILDERS / DEV       │  B. BROKER AGENCIES      │  C. INDIVIDUAL AGENTS │
│  • Multi-Tower Projects  │  • Multi-Agent Teams     │  • Solo Consultants   │
│  • Unit Inventories      │  • Agency Branding       │  • Direct Seller Reps │
│  • High-Volume Leads     │  • Lead Auto-Routing     │  • Fast Mobile CRM    │
│  • Sales Team Hierarchies│  • Agent Performance     │  • Direct Dialing     │
└──────────────────────────┴──────────────────────────┴───────────────────────┘
```

### Feature Implementation Status Matrix

| Module / Capability | Target Personas | Codebase Implementation Status | Current Technical Reality & Gap Analysis |
| :--- | :--- | :--- | :--- |
| **Independent Listings** | Builders, Brokers, Agents | **IMPLEMENTED** | Full support in `properties.service.ts`. |
| **Projects, Towers & Units** | Builders | **IMPLEMENTED** | Schema supports `structureType` (`PROJECT`, `TOWER`, `UNIT`) and `units[]`. |
| **9:16 Video Property Reels** | Builders, Brokers, Agents | **IMPLEMENTED** | Upload restricted to supply-side advertisers (Phase 10Q.2). |
| **RERA Verification Record** | Builders, Brokers, Agents | **IMPLEMENTED** | Schema contains complete RERA auditing, state authorities, and cert URLs. |
| **Instant WhatsApp Lead Alerts** | Builders, Brokers, Agents | **IMPLEMENTED** | `whatsapp.service.ts` exists, sends single-lead trigger alerts via webhook. |
| **Lead & Contact CRM** | Builders, Brokers, Agents | **IMPLEMENTED** | `leads.service.ts` supports lead statuses, notes, and stages. |
| **Top-of-Search Featured Boost** | Builders, Brokers, Agents | **IMPLEMENTED** | `isFeatured` and `featuredUntil` monetization logic active. |
| **Team Sub-Accounts / Seats** | Builders, Brokers | **PARTIAL** | User schema supports `assignedAgentId`, but no multi-seat management console. |
| **Channel Partner (CP) Network**| Builders | **UNAVAILABLE** | No CP brokerage commissions, contracts, or dedicated CP portal in codebase. |
| **Customer Booking & Payments** | Builders | **UNAVAILABLE** | No homebuyer milestone payment schedule or escrow tracking module exists. |
| **Customer Document Vault** | Builders | **UNAVAILABLE** | KYC upload exists, but no allotment letter / buyer agreement distribution engine. |
| **Mass WhatsApp Campaigns** | Builders, Brokers | **UNAVAILABLE** | WhatsApp service only handles transactional 1-to-1 notifications, not bulk marketing. |
| **Multi-Agent Lead Assignment** | Brokers | **PARTIAL** | `lead:assign` permission exists, but automated round-robin distribution is not built. |

---

## 3. PROPOSED THREE-TIER PLAN STRUCTURE FOR EACH CATEGORY

> [!IMPORTANT]
> **PROVISIONAL PRICING NOTICE:** All pricing figures below are **Provisional Recommendations** formulated based on current Indian prop-tech market benchmarks (MagicBricks, 99acres, Housing.com) for real estate SaaS monetization. They require formal **Business Approval** before implementation.
> 
> In accordance with architectural safety rules, **fair-use hard caps** are enforced on all tiers; "unlimited" usage is restricted strictly to enterprise custom mandates.

---

### Category A: Builders / Real Estate Developers

Targeting residential township developers, commercial builders, and plotted layout promoters.

```
┌───────────────────────┬───────────────────────┬───────────────────────┐
│     DEVELOPER SILVER  │   DEVELOPER GOLD ★    │  DEVELOPER PLATINUM   │
│      "Launchpad"      │   "Growth Mandate"    │  "Township Sovereign" │
│  ₹14,999 / mo (base)  │  ₹29,999 / mo (base)  │  ₹59,999 / mo (base)  │
├───────────────────────┼───────────────────────┼───────────────────────┤
│ • 2 Active Projects   │ • 5 Active Projects   │ • 15 Active Projects  │
│ • Up to 100 Units     │ • Up to 500 Units     │ • Up to 2,000 Units   │
│ • 5 Team Member Seats │ • 15 Team Seats       │ • 50 Team Seats       │
│ • 150 Verified Leads  │ • 500 Verified Leads  │ • 1,500 Verified Leads│
│ • 5 Featured Boosts   │ • 15 Featured Boosts  │ • 50 Featured Boosts  │
│ • 10 Video Reels / mo │ • 30 Video Reels / mo │ • Unlimited Reels     │
│ • Standard Lead CRM   │ • Round-Robin Dispatch│ • Advanced BI Analytics│
│ • Email Support       │ • Priority Phone Desk │ • Dedicated Account Mgr│
└───────────────────────┴───────────────────────┴───────────────────────┘
```

#### 1. Developer Silver — "Project Launchpad"
- **Target Customer:** Boutique developers launching 1 to 2 mid-rise buildings or plotted layouts.
- **Provisional Base Price:** ₹14,999 / month (1-Month term).
- **Entitlements & Hard Caps:**
  - Active Projects: **2 Projects Max**
  - Inventory Unit Capacity: **Up to 100 Units**
  - Active Listings: **25 Active Unit Listings**
  - Featured Spotlight Slots: **3 Concurrent Boosts**
  - Team Member Sub-Accounts: **3 Seats**
  - Verified Monthly Leads: **150 Inquiries / mo**
  - 9:16 Video Reels: **5 Active Reels**
  - Contact View Quota: **Unlimited for registered developer**
- **Included Features:** RERA badge verification, Direct WhatsApp lead routing, Standard developer profile, CSV lead exports, Standard search placement.
- **Excluded Features:** Custom 3D Virtual Tour embeds, Round-robin lead distribution, Dedicated relationship manager.

#### 2. Developer Gold — "Growth Mandate" (RECOMMENDED)
- **Target Customer:** Mid-sized regional developers with multiple concurrent towers or phase developments.
- **Provisional Base Price:** ₹29,999 / month (1-Month term).
- **Entitlements & Hard Caps:**
  - Active Projects: **5 Projects Max**
  - Inventory Unit Capacity: **Up to 500 Units**
  - Active Listings: **75 Active Unit Listings**
  - Featured Spotlight Slots: **10 Concurrent Boosts**
  - Team Member Sub-Accounts: **10 Seats**
  - Verified Monthly Leads: **500 Inquiries / mo**
  - 9:16 Video Reels: **20 Active Reels**
  - Contact View Quota: **Unlimited**
- **Included Features:** All Silver features + Homepage spotlight banner rotation, Automated lead round-robin to sales executives, Advanced CRM pipeline with lead scoring, Priority listing moderation (< 2 hours), Top-of-category placement.
- **Upgrade Trigger:** Developers managing more than 5 active phases or exceeding 500 units.

#### 3. Developer Platinum — "Township Sovereign"
- **Target Customer:** Large corporate builders, mega-township promoters, and pan-city developers.
- **Provisional Base Price:** ₹59,999 / month (1-Month term).
- **Entitlements & Hard Caps:**
  - Active Projects: **15 Projects Max**
  - Inventory Unit Capacity: **Up to 2,000 Units**
  - Active Listings: **250 Active Unit Listings**
  - Featured Spotlight Slots: **30 Concurrent Boosts**
  - Team Member Sub-Accounts: **30 Seats**
  - Verified Monthly Leads: **1,500 Inquiries / mo**
  - 9:16 Video Reels: **60 Active Reels**
- **Included Features:** All Gold features + Custom 3D virtual tour embeds, Direct CRM webhook API integration, Dedicated enterprise account manager, Bi-weekly performance review, VIP homepage hero placement.

#### 4. Developer Enterprise / Custom Mandate
- **CTA:** `Contact Corporate Sales` / `Request Custom Quote`
- **Features:** Unlimited inventory, multi-city project syndication, bespoke ERP integrations, SLA guarantees, customized billing terms.

---

### Category B: Brokers / Real Estate Agencies

Targeting real estate brokerage firms, mandated channel partner firms, and multi-agent offices.

```
┌───────────────────────┬───────────────────────┬───────────────────────┐
│     BROKER SILVER     │    BROKER GOLD ★      │    BROKER PLATINUM    │
│   "Boutique Agency"   │  "Featured Brokerage" │   "Empire Brokerage"  │
│  ₹4,999 / mo (base)   │  ₹9,999 / mo (base)   │  ₹19,999 / mo (base)  │
├───────────────────────┼───────────────────────┼───────────────────────┤
│ • 35 Active Listings  │ • 100 Active Listings │ • 300 Active Listings │
│ • 3 Sub-Agent Seats   │ • 10 Sub-Agent Seats  │ • 25 Sub-Agent Seats  │
│ • 100 Verified Leads  │ • 300 Verified Leads  │ • 1,000 Verified Leads│
│ • 3 Featured Boosts   │ • 10 Featured Boosts  │ • 25 Featured Boosts  │
│ • 10 Video Reels / mo │ • 30 Video Reels / mo │ • Unlimited Reels     │
│ • Agency Profile Page │ • Verified Trust Seal │ • Top Agency Spotlight│
│ • Basic Lead Pipeline │ • Lead Auto-Assign    │ • Full CRM & Exports  │
└───────────────────────┴───────────────────────┴───────────────────────┘
```

#### 1. Broker Silver — "Boutique Agency"
- **Target Customer:** Emerging agency partnerships with 2–3 active agents.
- **Provisional Base Price:** ₹4,999 / month (1-Month term).
- **Entitlements & Hard Caps:**
  - Active Listings: **35 Active Properties**
  - Sub-Agent Accounts: **3 Agent Seats**
  - Featured Spotlight Slots: **3 Listings**
  - Monthly Verified Leads: **100 Inquiries / mo**
  - 9:16 Video Reels: **10 Active Reels**
- **Included Features:** Agency branded profile page, Direct WhatsApp inquiries, Agent contact cards on property views, Basic CRM pipeline.

#### 2. Broker Gold — "Featured Brokerage" (RECOMMENDED)
- **Target Customer:** Established city brokerages with an active team of 5–10 agents.
- **Provisional Base Price:** ₹9,999 / month (1-Month term).
- **Entitlements & Hard Caps:**
  - Active Listings: **100 Active Properties**
  - Sub-Agent Accounts: **10 Agent Seats**
  - Featured Spotlight Slots: **10 Listings**
  - Monthly Verified Leads: **300 Inquiries / mo**
  - 9:16 Video Reels: **30 Active Reels**
- **Included Features:** All Silver features + "myproperty Verified Brokerage" trust badge, Top-of-search featured rotation, Automated lead distribution among sub-agents, Lead export to CSV/Excel, Sub-agent performance analytics.

#### 3. Broker Platinum — "Empire Brokerage"
- **Target Customer:** High-volume brokerage networks handling luxury mandates and institutional resales.
- **Provisional Base Price:** ₹19,999 / month (1-Month term).
- **Entitlements & Hard Caps:**
  - Active Listings: **300 Active Properties**
  - Sub-Agent Accounts: **25 Agent Seats**
  - Featured Spotlight Slots: **25 Listings**
  - Monthly Verified Leads: **1,000 Inquiries / mo**
  - 9:16 Video Reels: **75 Active Reels**
- **Included Features:** All Gold features + Priority listing moderation (< 1 hour), Prominent Agency banner on homepage, Sub-agency territory segmentation, Dedicated relationship manager.

---

### Category C: Individual Agents / Property Consultants

Targeting solo certified agents, independent consultants, and verified property owners.

```
┌───────────────────────┬───────────────────────┬───────────────────────┐
│      AGENT SILVER     │     AGENT GOLD ★      │     AGENT PLATINUM    │
│     "Solo Starter"    │    "Pro Performer"    │   "Top Producer Elite"│
│  ₹1,499 / mo (base)   │  ₹2,999 / mo (base)   │  ₹5,999 / mo (base)   │
├───────────────────────┼───────────────────────┼───────────────────────┤
│ • 10 Active Listings  │ • 30 Active Listings  │ • 75 Active Listings  │
│ • 1 User Seat         │ • 1 User Seat         │ • 2 User Seats        │
│ • 40 Verified Leads   │ • 120 Verified Leads  │ • 300 Verified Leads  │
│ • 1 Featured Boost    │ • 4 Featured Boosts   │ • 10 Featured Boosts  │
│ • 3 Video Reels / mo  │ • 12 Video Reels / mo │ • 30 Video Reels / mo │
│ • Verified Agent Badge│ • Top Search Placement│ • Prime Spotlight     │
│ • Direct WhatsApp Link│ • Fast Lead Alerts    │ • Full CRM & Exports  │
└───────────────────────┴───────────────────────┴───────────────────────┘
```

#### 1. Agent Silver — "Solo Starter"
- **Target Customer:** Independent agents or property sellers starting out in a localized area.
- **Provisional Base Price:** ₹1,499 / month (1-Month term).
- **Entitlements & Hard Caps:**
  - Active Listings: **10 Active Properties**
  - Featured Spotlight Slots: **1 Listing**
  - Monthly Verified Leads: **40 Inquiries / mo**
  - 9:16 Video Reels: **3 Active Reels**
- **Included Features:** Verified Agent trust mark, Direct WhatsApp click-to-chat, Standard search indexing, Basic mobile CRM.

#### 2. Agent Gold — "Pro Performer" (RECOMMENDED)
- **Target Customer:** Full-time professional agents closing 2–5 deals monthly.
- **Provisional Base Price:** ₹2,999 / month (1-Month term).
- **Entitlements & Hard Caps:**
  - Active Listings: **30 Active Properties**
  - Featured Spotlight Slots: **4 Listings**
  - Monthly Verified Leads: **120 Inquiries / mo**
  - 9:16 Video Reels: **12 Active Reels**
- **Included Features:** All Silver features + Top-of-search rotation, Instant SMS & WhatsApp lead notifications, Listing view performance metrics, Priority review moderation.

#### 3. Agent Platinum — "Top Producer Elite"
- **Target Customer:** Elite luxury agents and high-volume commercial realtors.
- **Provisional Base Price:** ₹5,999 / month (1-Month term).
- **Entitlements & Hard Caps:**
  - Active Listings: **75 Active Properties**
  - Featured Spotlight Slots: **10 Listings**
  - Monthly Verified Leads: **300 Inquiries / mo**
  - 9:16 Video Reels: **30 Active Reels**
- **Included Features:** All Gold features + Featured Agent profile spotlight on homepage, Full CRM data export, 2 Assistant seats, VIP phone support.

---

## 4. BILLING DURATIONS & PRICE-CALCULATION RULES

### 4.1 Requested Billing Periods & Discount Curve
The platform must support six standard durations. In SaaS economics, longer commitments justify progressive discounts due to reduced churn and upfront cash collection:

```
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│   1 MONTH    │   2 MONTHS   │   3 MONTHS   │   6 MONTHS   │  12 MONTHS   │  36 MONTHS   │
│  (Base Rate) │   (~5% OFF)  │  (~10% OFF)  │  (~18% OFF)  │  (~30% OFF)  │  (~42% OFF)  │
│  Multiplier: │  Multiplier: │  Multiplier: │  Multiplier: │  Multiplier: │  Multiplier: │
│    1.00x     │    1.90x     │    2.70x     │    4.92x     │    8.40x     │    20.88x    │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

### 4.2 Comprehensive Matrix of Provisional Prices

| Category & Tier | Base / 1M | 2 Months (5% off) | 3 Months (10% off) | 6 Months (18% off) | 12 Months (30% off) | 36 Months (42% off) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Agent Silver** | ₹1,499 / mo<br>**Total: ₹1,499** | ₹1,424 / mo<br>**Total: ₹2,848** | ₹1,349 / mo<br>**Total: ₹4,047** | ₹1,229 / mo<br>**Total: ₹7,375** | ₹1,049 / mo<br>**Total: ₹12,592** | ₹869 / mo<br>**Total: ₹31,299** |
| **Agent Gold ★** | ₹2,999 / mo<br>**Total: ₹2,999** | ₹2,849 / mo<br>**Total: ₹5,698** | ₹2,699 / mo<br>**Total: ₹8,097** | ₹2,459 / mo<br>**Total: ₹14,755** | ₹2,099 / mo<br>**Total: ₹25,192** | ₹1,739 / mo<br>**Total: ₹62,619** |
| **Agent Platinum** | ₹5,999 / mo<br>**Total: ₹5,999** | ₹5,699 / mo<br>**Total: ₹11,398** | ₹5,399 / mo<br>**Total: ₹16,197** | ₹4,919 / mo<br>**Total: ₹29,515** | ₹4,199 / mo<br>**Total: ₹50,392** | ₹3,479 / mo<br>**Total: ₹1,25,259** |
| **Broker Silver** | ₹4,999 / mo<br>**Total: ₹4,999** | ₹4,749 / mo<br>**Total: ₹9,498** | ₹4,499 / mo<br>**Total: ₹13,497** | ₹4,099 / mo<br>**Total: ₹24,595** | ₹3,499 / mo<br>**Total: ₹41,992** | ₹2,899 / mo<br>**Total: ₹1,04,379** |
| **Broker Gold ★** | ₹9,999 / mo<br>**Total: ₹9,999** | ₹9,499 / mo<br>**Total: ₹18,998** | ₹8,999 / mo<br>**Total: ₹26,997** | ₹8,199 / mo<br>**Total: ₹49,195** | ₹6,999 / mo<br>**Total: ₹83,992** | ₹5,799 / mo<br>**Total: ₹2,08,779** |
| **Broker Platinum**| ₹19,999 / mo<br>**Total: ₹19,999** | ₹18,999 / mo<br>**Total: ₹37,998** | ₹17,999 / mo<br>**Total: ₹53,997** | ₹16,399 / mo<br>**Total: ₹98,395** | ₹13,999 / mo<br>**Total: ₹1,67,992**| ₹11,599 / mo<br>**Total: ₹4,17,579**|
| **Dev Silver** | ₹14,999 / mo<br>**Total: ₹14,999** | ₹14,249 / mo<br>**Total: ₹28,498** | ₹13,499 / mo<br>**Total: ₹40,497** | ₹12,299 / mo<br>**Total: ₹73,795** | ₹10,499 / mo<br>**Total: ₹1,25,992**| ₹8,699 / mo<br>**Total: ₹3,13,179**|
| **Dev Gold ★** | ₹29,999 / mo<br>**Total: ₹29,999** | ₹28,499 / mo<br>**Total: ₹56,998** | ₹26,999 / mo<br>**Total: ₹80,997** | ₹24,599 / mo<br>**Total: ₹1,47,595**| ₹20,999 / mo<br>**Total: ₹2,51,992**| ₹17,399 / mo<br>**Total: ₹6,26,379**|
| **Dev Platinum** | ₹59,999 / mo<br>**Total: ₹59,999** | ₹56,999 / mo<br>**Total: ₹1,13,998**| ₹53,999 / mo<br>**Total: ₹1,61,997**| ₹49,199 / mo<br>**Total: ₹2,95,195**| ₹41,999 / mo<br>**Total: ₹5,03,992**| ₹34,799 / mo<br>**Total: ₹12,52,779**|

---

### 4.3 Price Calculation & Display Rules (Hostinger Standard)

1. **Effective Monthly Price Formula:**
   $$\text{Effective Monthly Price} = \text{round}\left(\frac{\text{Total Payable Amount}}{\text{Duration in Months}}\right)$$
2. **Transparent Discount Math:**
   - Strikethrough Reference Price = $\text{Base Monthly Price} \times \text{Duration in Months}$
   - Discount Amount = $\text{Strikethrough Price} - \text{Total Payable Amount}$
   - Stated Discount % = $\text{round}\left(\frac{\text{Discount Amount}}{\text{Strikethrough Price}} \times 100\right)$
   - *Rule:* Never display an arbitrary or unbacked discount percentage.
3. **Renewal Terms Clarification:**
   - Following Hostinger's clarity guidelines, each card must display:
     > *"Renews at ₹[Renewal Amount]/mo for the same billing period upon expiration. Cancel anytime."*
4. **Taxes & GST Handling:**
   - Display notice: `+ Applicable GST (18%) calculated at checkout` or `Prices inclusive of GST` depending on approved corporate tax policy.
5. **Upgrade / Downgrade Logic:**
   - **Upgrades:** The unused pro-rata value of the existing plan is credited towards the upgraded plan's invoice.
   - **Downgrades:** Take effect at the end of the current paid billing cycle (no cash refunds for mid-cycle downgrades).
6. **Lifetime / Custom Subscriptions:**
   - Cannot be purchased self-service. Handled via the **Contact Corporate Sales** request flow.

---

## 5. UI/UX DESIGN SPECIFICATION (HOSTINGER-INSPIRED)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MODERN HOSTINGER-INSPIRED PRICING UI                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [  BUILDERS / DEV  ]    [  BROKER AGENCIES ★ ]    [  INDIVIDUAL AGENTS ]   │
│   (Category Selector: Segmented Pill with subtle icons & active indicator)  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  1 Month  │  2 Mos (5%)  │  3 Mos (10%)  │  6 Mos (18%)  │ 12M (30%)│ 36M (42%) │
│   └─────────────────────────────────────────────────────────────────────┘   │
│   (Duration Bar: Horizontal segmented tabs with discount highlight pills)   │
│                                                                             │
│   ┌──────────────────┐  ┌───────────────────────┐  ┌──────────────────┐     │
│   │  BROKER SILVER   │  │   BROKER GOLD ★       │  │ BROKER PLATINUM  │     │
│   │  Boutique Agency │  │   Featured Brokerage  │  │ Empire Brokerage │     │
│   │                  │  │   [ MOST POPULAR ]    │  │                  │     │
│   │  SAVE 30%        │  │   SAVE 30%            │  │ SAVE 30%         │     │
│   │  ~~₹4,999~~      │  │   ~~₹9,999~~          │  │ ~~₹19,999~~      │     │
│   │  ₹3,499 / mo     │  │   ₹6,999 / mo         │  │ ₹13,999 / mo     │     │
│   │  Total: ₹41,992  │  │   Total: ₹83,992      │  │ Total: ₹1,67,992 │     │
│   │                  │  │                       │  │                  │     │
│   │  [ Choose Plan ] │  │   [ Choose Gold ]     │  │ [ Choose Plan ]  │     │
│   │                  │  │   (Elevated Brand CTA)│  │                  │     │
│   │  • 35 Listings   │  │   • 100 Listings      │  │ • 300 Listings   │     │
│   │  • 3 Agents      │  │   • 10 Agents         │  │ • 25 Agents      │     │
│   │  • 100 Leads/mo  │  │   • 300 Leads/mo      │  │ • 1,000 Leads/mo │     │
│   │  • 3 Boosts      │  │   • 10 Boosts         │  │ • 25 Boosts      │     │
│   │  • 10 Reels/mo   │  │   • 30 Reels/mo       │  │ • 75 Reels/mo    │     │
│   │  • Standard CRM  │  │   • Round-Robin CRM   │  │ • Full CRM Export│     │
│   │  ✕ No 3D Tours   │  │   • Verified Badge    │  │ • Dedicated Mgr  │     │
│   └──────────────────┘  └───────────────────────┘  └──────────────────┘     │
│                                                                             │
│   ▼ Expand Full Feature Comparison Matrix (30+ Parameters)                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.1 Key Visual Components & Layout Patterns

1. **Category Selector (Top Bar):**
   - 3 segmented switches: `Builders & Developers`, `Broker Agencies`, `Individual Agents`.
   - Distinct icons (`Building2`, `Users2`, `UserCheck`).
   - Smooth animated active indicator sliding between tabs.
2. **Billing Duration Switcher:**
   - 6 options rendered as an interactive segmented pill bar (`1 mo`, `2 mos`, `3 mos`, `6 mos`, `12 mos`, `36 mos`).
   - Highest-discount pill (`36 mos` or `12 mos`) badged with an accent tag (e.g. `Save 42%`).
   - Instant client-side state recalculation (no page reloads).
3. **Three Plan Cards per Category:**
   - **Middle Card Elevation:** The recommended plan (Gold) is visually elevated with a subtle brand gradient border, slight 102% scale on desktop, a `MOST POPULAR` ribbon badge, and a high-contrast primary CTA button.
   - **Price Typography:** Extra-large bold numerals with rupee symbol (`₹`), period suffix (`/ mo`), struck-through original price, and total payable sub-text.
   - **Feature Checklist:** High-contrast green checkmark icons (`Check`) for included features; muted gray icons (`X`) for tier exclusions.
4. **Comprehensive Comparison Matrix Table:**
   - Expandable side-by-side comparison table below the cards.
   - Grouped into logical feature categories: *Listings & Inventory*, *Lead Generation & Routing*, *Team & Agency Management*, *Media & Video Reels*, *CRM & Exports*, *Support & Moderation*.
5. **Enterprise / Custom Banner:**
   - Elegant dark navy banner below cards: *"Need a Custom Mandate for Townships or Multi-City Agencies?"* with a direct `Contact Corporate Desk` button.
6. **Mobile Adaptability:**
   - Horizontal scrollable duration pill bar with sticky tab indicators.
   - Cards stack vertically into clean cards with clear spacing.
   - Comparison matrix transforms into an accordion with collapsible feature categories.
7. **Brand Adherence:**
   - Fully uses existing CASA design tokens: `bg-casa-surface`, `border-casa-border-light`, `text-casa-brand`, `bg-casa-brand-subtle`. Zero Hostinger proprietary icons or external assets.

---

## 6. ADMIN PANEL REQUIREMENTS

The Admin console (`admin.myproperty.in`) must be upgraded from static mockups to an authoritative, dynamic pricing administration engine:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ADMIN PRICING MANAGEMENT CONSOLE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Plan Catalog Manager (CRUD for Builder, Broker, and Agent tiers)          │
│ • Multi-Duration Pricing Matrix Editor (Set 1M, 2M, 3M, 6M, 12M, 36M rates)│
│ • Entitlement Quota Configurator (Listings, Leads, Seats, Reels, Boosts)    │
│ • Active Subscriber Ledger (Live users, expiry dates, renewals, churn)      │
│ • Enterprise Quote Request Queue (Inbound custom quote submissions)         │
│ • Live Public Card Simulator (Preview UI before publishing)                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.1 Admin Feature Specifications

1. **Dynamic Plan Creator & Editor (`/admin/packages`):**
   - Form to assign plans to categories (`BUILDER`, `BROKER`, `AGENT`).
   - Multi-duration pricing grid where admins input:
     - 1 Month: Base Price
     - 2 Months: Total Price + Discount %
     - 3 Months: Total Price + Discount %
     - 6 Months: Total Price + Discount %
     - 12 Months: Total Price + Discount %
     - 36 Months: Total Price + Discount %
   - Toggle switches for `isActive`, `isPopular`, and `isDefault`.
2. **Entitlement Limit Controls:**
   - Input fields for `maxListings` (-1 for unlimited), `maxProjects`, `maxUnits`, `monthlyLeads`, `maxReels`, `featuredSlots`, `maxTeamSeats`.
3. **Real Subscriber Ledger (`/admin/subscriptions`):**
   - Replace the existing static mockup page with a paginated, searchable subscriber table.
   - Columns: User Name, Mobile, Role/Category, Active Tier, Duration, Start Date, Expiry Date, Days Remaining, Amount Paid, Status (`ACTIVE`, `EXPIRED`, `TRIAL`, `CANCELLED`).
   - Actions: `Extend Duration`, `Apply Bonus Quota`, `Cancel Subscription`, `View Invoice`.
4. **Enterprise Quote Inquiries Management (`/admin/enterprise-quotes`):**
   - Table of inbound corporate inquiries with status tags (`NEW`, `IN_REVIEW`, `PROPOSAL_SENT`, `CLOSED_WON`, `REJECTED`).
5. **Live Card Preview:**
   - In-admin preview component allowing admins to see exactly how the pricing card will render on `myproperty.in/pricing` before saving changes to MongoDB.

---

## 7. BACKEND ENTITLEMENT ENFORCEMENT REQUIREMENTS

Pricing tiers are ineffective if the backend does not enforce their limits. The following enforcement services must be implemented in the backend architecture:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    API-LEVEL ENTITLEMENT ENFORCEMENT ENGINE                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Listing Gate: Count active listings vs package.limits.propertyListings   │
│ 2. Project Gate: Count active projects vs package.limits.maxProjects        │
│ 3. Lead Gate: Count leads received this month vs package.limits.monthlyLeads│
│ 4. Team Gate: Count sub-agent users vs package.limits.teamMembersMax        │
│ 5. Reel Gate: Count active 9:16 reels vs package.limits.maxReels            │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **Property Creation Guard (`PropertiesService.createProperty`):**
   ```typescript
   // Check active listings against plan quota before persisting property
   const activeListingsCount = await this.propertyModel.countDocuments({
     ownerId: user.id,
     status: { $in: ['PUBLISHED', 'ACTIVE', 'PENDING_REVIEW'] }
   });
   if (quota.propertyListings !== -1 && activeListingsCount >= quota.propertyListings) {
     throw new ForbiddenException(`Listing limit reached (${quota.propertyListings} listings). Upgrade your plan to post more properties.`);
   }
   ```
2. **Project & Unit Limit Guard:**
   - Enforce developer project limits when `structureType === 'PROJECT'`.
3. **Monthly Lead Routing Guard (`LeadsService.createLead`):**
   - Track monthly lead consumption in `monthlyLeadCounter`. When an advertiser's monthly limit is reached, hold further leads in queue or prompt immediate package upgrade.
4. **Team Seat Provisioning Guard (`AgentsService` / `AuthService`):**
   - Restrict broker sub-agent registrations to the subscribed seat allowance.
5. **Automated Subscription Expiration Cron:**
   - Implement a daily NestJS scheduled cron job (`@Cron('0 0 * * *')`) to query `subscriptions` where `endDate < now` and `status === 'ACTIVE'`, transition them to `EXPIRED`, and notify the user via SMS/WhatsApp.

---

## 8. TECHNICAL, DATA SAFETY & MIGRATION STRATEGY

### 8.1 Schema Evolution Without Breaking Existing Data
Existing MongoDB collections must be preserved without data loss or downtime:

1. **Backward-Compatible `Package` Schema:**
   - Add an optional array field `pricingTiers` to `PackageSchema`:
     ```typescript
     @Prop({
       type: [{
         durationMonths: { type: Number, required: true }, // 1, 2, 3, 6, 12, 36
         billingPeriod: { type: String, required: true },  // '1_MONTH', '36_MONTHS', etc.
         totalPrice: { type: Number, required: true },
         monthlyPrice: { type: Number, required: true },
         discountPercent: { type: Number, default: 0 },
         renewalPrice: { type: Number, required: true },
         isActive: { type: Boolean, default: true }
       }],
       default: []
     })
     pricingTiers: PricingTierItem[];
     ```
   - Keep legacy `price` and `billingPeriod` fields intact on existing records to prevent breaking running microservices or client calls.
2. **Subscription Schema Compatibility:**
   - Upgrade `plan` in `SubscriptionSchema` from an enum to a flexible string reference (`packageSlug` or `packageId`), while maintaining backward compatibility with existing legacy string values (`FREE`, `PRO`, `BUSINESS`).
3. **Preserving 3-Day Free Trial Flow:**
   - Do not alter the existing KYC approval and 3-day trial trigger logic. The new pricing structure seamlessly takes over when the 3-day trial expires.
4. **Consumer Protection:**
   - Ensure `BUYER`, `TENANT`, and `PURCHASER` accounts remain permanently exempt from subscription walls.

---

## 9. PHASED IMPLEMENTATION ROADMAP & ACCEPTANCE CRITERIA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION ROADMAP: PHASE 10Q.3                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Phase 10Q.3-A: Schema Evolution & Seeding Migration (Non-Breaking)          │
│ Phase 10Q.3-B: Backend API Enforcements & Multi-Duration Order Engine        │
│ Phase 10Q.3-C: Admin Pricing Matrix Console & Subscriber Ledger             │
│ Phase 10Q.3-D: Public `/pricing` Marketing Page & Client Billing Redesign   │
│ Phase 10Q.3-E: End-to-End Razorpay Verification, Quota Tests & QA Sign-Off   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase 10Q.3-A: Schema Evolution & Seeding Migration
- **Tasks:**
  - Add `pricingTiers` to `Package` schema.
  - Add `maxProjects`, `maxUnits`, `maxReels` to `PackageLimits`.
  - Update `BillingPeriod` enum to include `THIRTY_SIX_MONTHS = '36_MONTHS'`.
  - Write a non-destructive database seed script to populate the 9 proposed tiers with provisional prices.
- **Acceptance Criteria:**
  - Backend compiles with zero errors (`npm run build`).
  - Existing packages and subscriptions in MongoDB remain 100% intact.

### Phase 10Q.3-B: Backend API & Entitlement Enforcement Engine
- **Tasks:**
  - Update `PaymentsService.createOrder` to resolve product codes dynamically from `Package.pricingTiers`.
  - Implement active listing count guard in `PropertiesService.createProperty`.
  - Implement scheduled subscription expiration worker.
- **Acceptance Criteria:**
  - A user who exceeds their package listing limit receives an HTTP 403 Forbidden with clear upgrade instructions.
  - Razorpay order creation computes exact multi-duration amounts strictly on the server.

### Phase 10Q.3-C: Admin Pricing Management Console
- **Tasks:**
  - Build the multi-duration pricing table in `admin/app/packages/[id]/page.tsx`.
  - Build the dynamic subscriber ledger in `admin/app/subscriptions/page.tsx`.
  - Build the Enterprise Quote review screen in `admin/app/enterprise-quotes/page.tsx`.
- **Acceptance Criteria:**
  - Super Admin can edit any duration's price and toggle discounts in the UI.
  - Active subscribers are listed with real-time countdown to expiration.

### Phase 10Q.3-D: Public `/pricing` & Dashboard Billing Redesign
- **Tasks:**
  - Create the public marketing page at `frontend/app/pricing/page.tsx` with Hostinger visual hierarchy.
  - Implement category switcher (Builder, Broker, Agent) and duration pill bar (1m to 36m).
  - Implement side-by-side expandable feature comparison matrix.
  - Refactor `frontend/app/dashboard/billing/page.tsx` to consume dynamic API packages instead of hardcoded cards.
- **Acceptance Criteria:**
  - Page is 100% responsive, passes WCAG contrast checks, and switches duration prices smoothly without layout shifts.
  - Unauthenticated visitors can view pricing; clicking "Choose Plan" opens the login/register modal.

### Phase 10Q.3-E: E2E Verification & QA Sign-Off
- **Tasks:**
  - Test checkout across all 6 durations in Razorpay test mode.
  - Verify webhook signature validation and service activation.
  - Validate role exemptions for Buyers and Rental Tenants.
- **Acceptance Criteria:**
  - Successful end-to-end checkout activates the subscription and updates user entitlements.
  - Zero TypeScript or lint errors across `backend`, `frontend`, and `admin`.

---

## 10. ITEMS REQUIRING BUSINESS APPROVAL

Before starting implementation in the next phase, platform owners must confirm and sign off on the following business decisions:

1. **Approval of Provisional Price Matrix:**
   - Confirm whether the recommended monthly base prices (Agent: ₹1,499 / ₹2,999 / ₹5,999; Broker: ₹4,999 / ₹9,999 / ₹19,999; Developer: ₹14,999 / ₹29,999 / ₹59,999) are approved.
2. **Approval of Discount Progression:**
   - Confirm proposed discount steps: 2M (5%), 3M (10%), 6M (18%), 12M (30%), 36M (42%).
3. **GST Tax Treatment:**
   - Confirm whether prices shown on public cards are **inclusive of 18% GST** or if GST should be added as an extra line item during checkout.
4. **Listing Quota Strictness:**
   - Confirm whether listing creation should be strictly blocked upon reaching the quota, or if users should be permitted to create listings in `DRAFT` status and prompted to upgrade before publishing.
5. **Free Trial Coexistence:**
   - Confirm that the existing 3-Day Full Access Free Trial remains active for newly approved KYC supply-side accounts before they are required to pick a paid tier.

---
**Report Prepared By:** Lead Systems Architect & Senior Fullstack Engineer  
**Inspection Workspace:** `d:\CASA Real Estate` (`myproperty.in`)  
**Audit Output Location:** `docs/admin/PHASE-10Q-3-PRICING-SYSTEM-AUDIT.md`
