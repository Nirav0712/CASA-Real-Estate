# CASA — 18-Phase Implementation Roadmap

## 1. Roadmap Overview & Phased Execution Strategy

CASA follows a rigorous, phase-gated engineering methodology. No downstream phase commences until the acceptance criteria and security benchmarks of the prerequisite phase have been formally verified.

```mermaid
gantt
    title CASA 18-Phase Execution Timeline
    dateFormat  YYYY-MM-DD
    section Foundation
    Phase 01: Discovery & Master Blueprint      :done,    p1, 2026-10-01, 2026-10-05
    Phase 02: Architecture & Repo Setup        :active,  p2, 2026-10-06, 2026-10-10
    Phase 03: Design System & UI/UX            :         p3, 2026-10-11, 2026-10-16
    Phase 04: Auth & Security Foundation       :         p4, 2026-10-17, 2026-10-23
    section Core Marketplace
    Phase 05: Public Website & Homepage        :         p5, 2026-10-24, 2026-10-30
    Phase 06: Property Management Engine       :         p6, 2026-10-31, 2026-11-08
    Phase 07: Search & Discovery Engine        :         p7, 2026-11-09, 2026-11-16
    section Governance & Portals
    Phase 08: Admin Governance Panel           :         p8, 2026-11-17, 2026-11-25
    Phase 09: Agent Dashboard & Tools          :         p9, 2026-11-26, 2026-12-03
    Phase 10: Purchaser Dashboard              :         p10, 2026-12-04, 2026-12-09
    section Integrations & Growth
    Phase 11: Maps & Geospatial Services       :         p11, 2026-12-10, 2026-12-16
    Phase 12: WhatsApp & Enquiry Pipeline      :         p12, 2026-12-17, 2026-12-22
    Phase 13: Subscriptions & Payments         :         p13, 2026-12-23, 2026-12-30
    Phase 14: Notifications & Calendly         :         p14, 2026-12-31, 2027-01-06
    section Globalization & Launch
    Phase 15: Multilingual (RTL) & SEO         :         p15, 2027-01-07, 2027-01-14
    Phase 16: End-to-End QA & Security Audit   :         p16, 2027-01-15, 2027-01-22
    Phase 17: Production Deployment & CI/CD    :         p17, 2027-01-23, 2027-01-28
    section Future Ecosystem
    Phase 18: CASA Main Coin Ecosystem         :         p18, 2027-01-29, 2027-02-15
```

---

## 2. Detailed Phase Specifications

---

### Phase 01: Discovery & Master Blueprint
- **Objective:** Establish the comprehensive functional, technical, data, and security foundation for CASA.
- **Scope:** Requirements engineering, technology evaluation, data models, RBAC definition, API inventory, and 18-phase roadmap documentation.
- **Dependencies:** None.
- **Deliverables:** Complete 14-file documentation suite inside `/docs`.
- **Testing Requirements:** Architectural consistency review, stakeholder sign-off on scope boundaries.
- **Acceptance Criteria:** All documentation files created without contradictions; clear distinction between MVP, recommendations, and future scopes.
- **Risks & Mitigation:** Risk of scope creep beyond baseline; mitigated through strict classification flags (`[CONFIRMED]`, `[RECOMMENDED]`, `[OUT-OF-SCOPE]`).

---

### Phase 02: Architecture & Repository Setup
- **Objective:** Initialize the production-ready modular monorepo workspace.
- **Scope:** Configure Turborepo, Next.js apps (`apps/web`, `apps/admin`), NestJS backend (`apps/api`), and shared packages (`@casa/ui`, `@casa/types`, `@casa/validation`, `@casa/config`, `@casa/utils`).
- **Dependencies:** Phase 01 sign-off.
- **Deliverables:** Working monorepo structure, linting rules, TypeScript paths, build pipelines, Docker compose for local MongoDB/Redis.
- **Testing Requirements:** `turbo build`, `turbo lint`, and `turbo test` pass cleanly across all workspaces.
- **Acceptance Criteria:** Zero compilation errors; dev servers for `web`, `admin`, and `api` run concurrently on distinct ports.
- **Risks & Mitigation:** Package circular dependencies; mitigated by strict unidirectional package hierarchy (`apps` -> `packages`).

---

### Phase 03: Design System & UI/UX Foundation
- **Objective:** Implement the Gemini-inspired light theme component library in `@casa/ui`.
- **Scope:** Color tokens, typography, buttons, inputs, modal dialogs, data tables, navigation shells, responsive containers, and full RTL layout support.
- **Dependencies:** Phase 02.
- **Deliverables:** Storybook / component catalog, Tailwind configuration presets, shared layout wrappers with `dir="ltr"` / `dir="rtl"` support.
- **Testing Requirements:** Visual regression testing, cross-browser verification, mobile viewport inspection (320px–1440px).
- **Acceptance Criteria:** 100% of core components render cleanly in both LTR (English) and RTL (Arabic/Urdu) modes.
- **Risks & Mitigation:** UI inconsistencies across apps; mitigated by locking shared component tokens in `@casa/ui`.

---

### Phase 04: Authentication & Security Foundation
- **Objective:** Build the secure Mobile Number + SMS OTP + JWT authentication engine.
- **Scope:** NestJS `AuthModule`, Redis OTP hashing and rate-limiting, SMS provider adapter, JWT issuance, httpOnly cookie management, RBAC guards.
- **Dependencies:** Phase 02, Phase 03.
- **Deliverables:** Working auth API endpoints, login/registration modals in `@casa/ui`, persistent auth context in `web` and `admin`.
- **Testing Requirements:** Unit tests for OTP hashing; brute-force rate limit stress tests; token expiration and rotation tests.
- **Acceptance Criteria:** No plaintext OTPs stored; expired tokens auto-refresh seamlessly; unauthorized roles blocked with 403 Forbidden.
- **Risks & Mitigation:** SMS gateway latency/downtime; mitigated by mock SMS provider toggle for development and multi-vendor fallback.

---

### Phase 05: Public Website & Homepage
- **Objective:** Build the consumer-facing homepage and discovery landing pages.
- **Scope:** Hero search bar, dynamic category grid, featured properties carousel, recent listings stream, promotional agent banners, responsive header/footer.
- **Dependencies:** Phase 03, Phase 04.
- **Deliverables:** High-performance Next.js homepage with SSR and ISR, mobile bottom navigation bar.
- **Testing Requirements:** Lighthouse performance audit (Score > 90), Core Web Vitals benchmark.
- **Acceptance Criteria:** First Contentful Paint < 1.2s; responsive on all mobile viewports; functional category quick-links.
- **Risks & Mitigation:** Image layout shifts; mitigated by fixed aspect-ratio containers and ImageKit blur placeholders.

---

### Phase 06: Property Management Engine
- **Objective:** Implement the end-to-end property advertisement publishing wizard.
- **Scope:** Dynamic multi-step creation form adapting to category specs, ImageKit client-direct signed uploads, YouTube walkthrough validation, draft saving, moderation submission.
- **Dependencies:** Phase 04, Phase 05.
- **Deliverables:** NestJS `PropertiesModule`, multi-step listing wizard in `apps/web`, media management API.
- **Testing Requirements:** Form validation boundary tests, large image upload tests, category schema conditional rendering tests.
- **Acceptance Criteria:** Advertisers can create, edit, and submit listings; status transitions accurately from `DRAFT` to `PENDING_APPROVAL`.
- **Risks & Mitigation:** Incomplete uploads resulting in orphaned media; mitigated by ImageKit cleanup cron.

---

### Phase 07: Search & Discovery Engine
- **Objective:** Build the high-performance search and filtering engine.
- **Scope:** Multi-parameter filter panel (price range, category, BHK, amenities, construction age vs listing freshness), full-text search, pagination, sort options.
- **Dependencies:** Phase 06.
- **Deliverables:** Search results page (`/properties`), dynamic URL query synchronization, empty-state suggestions.
- **Testing Requirements:** Compound query performance benchmarking on 10,000+ mock records; query latency < 100ms.
- **Acceptance Criteria:** Filters execute instantaneously without UI freeze; URL query parameters remain fully shareable.
- **Risks & Mitigation:** Complex unindexed query combinations causing database spikes; mitigated by strict MongoDB compound indexes.

---

### Phase 08: Admin Governance Panel
- **Objective:** Build the centralized administrative management portal (`apps/admin`).
- **Scope:** Side-by-side moderation queue, one-click approve/reject with pre-filled feedback, private admin remarks, user management, category taxonomy manager, audit logs.
- **Dependencies:** Phase 06, Phase 07.
- **Deliverables:** Complete `apps/admin` application with dedicated RBAC route protection.
- **Testing Requirements:** Moderation workflow validation, private admin remarks leak-prevention security audit.
- **Acceptance Criteria:** Zero leakage of admin remarks over public endpoints; audit logs record every moderator decision.
- **Risks & Mitigation:** Unauthorized access to admin routes; mitigated by NestJS server-side RBAC guards and Next.js middleware token checks.

---

### Phase 09: Agent Dashboard & Business Tools
- **Objective:** Create the specialized operational portal for real estate brokers and agencies.
- **Scope:** Active inventory management table, remaining tier quota indicator, lead enquiry inbox with direct WhatsApp reply, Calendly profile configuration, badge verification application.
- **Dependencies:** Phase 06, Phase 08.
- **Deliverables:** Agent dashboard routes (`/dashboard/agent/*`), verification document upload wizard.
- **Testing Requirements:** Agent inventory CRUD tests, quota enforcement validation, lead status transition tests.
- **Acceptance Criteria:** Agents can manage their entire portfolio and track incoming buyer leads in real time.
- **Risks & Mitigation:** Agents attempting to bypass listing quotas; mitigated by strict backend limit validation on `POST /properties`.

---

### Phase 10: Purchaser Dashboard & Saved Activity
- **Objective:** Build the personalized portal for registered property seekers.
- **Scope:** Saved favourite properties shortlist, history of submitted inquiries, saved search alerts, profile and language preferences.
- **Dependencies:** Phase 04, Phase 07.
- **Deliverables:** Purchaser dashboard routes (`/dashboard/user/*`), favorite toggle state management.
- **Testing Requirements:** Optimistic UI update tests for bookmarks, enquiry tracking consistency tests.
- **Acceptance Criteria:** Purchasers can bookmark properties with instant UI feedback and retrieve their saved properties across sessions.
- **Risks & Mitigation:** High volume of bookmark writes; mitigated by indexed compound keys in `favourites` collection.

---

### Phase 11: Maps & Geospatial Services
- **Objective:** Integrate location intelligence and interactive property map discovery.
- **Scope:** Interactive map view with price clusters, radial radius filter (5km, 10km, 25km), Ola Maps integration with Mapbox/Google fallback adapter, location autocomplete.
- **Dependencies:** Phase 07.
- **Deliverables:** `IGeocodingService` adapter module, interactive map component in `@casa/ui`, radial geospatial query endpoints.
- **Testing Requirements:** Geospatial `$near` query performance tests, fallback adapter failover testing.
- **Acceptance Criteria:** Map smoothly renders property pins with interactive popup cards; radial filter correctly filters nearby listings.
- **Risks & Mitigation:** Ola Maps API rate limit exhaustion; mitigated by geocoding cache and automatic fallback adapter.

---

### Phase 12: WhatsApp & Enquiry Pipeline
- **Objective:** Deliver direct lead generation channels connecting seekers with advertisers.
- **Scope:** Smart WhatsApp click-to-chat generator with automated listing context, in-platform enquiry ticket system, lead notification alerts.
- **Dependencies:** Phase 06, Phase 09.
- **Deliverables:** WhatsApp deep-link generation utility, enquiry submission modal, agent lead notification webhooks.
- **Testing Requirements:** URL encoding verification across mobile WhatsApp web and native apps; spam rate limit testing.
- **Acceptance Criteria:** Clicking WhatsApp button pre-fills listing title, price, and ID; enquiry forms deliver instant in-app alerts to the agent.
- **Risks & Mitigation:** Bot spam on enquiry forms; mitigated by rate limits and reCAPTCHA v3 challenge.

---

### Phase 13: Subscriptions & Payments
- **Objective:** Deploy the monetization engine for listing boosts and agent subscription packages.
- **Scope:** Razorpay payment gateway integration, checkout modals, subscription tier activation, featured listing boost scheduler, invoice generation.
- **Dependencies:** Phase 08, Phase 09.
- **Deliverables:** NestJS `BillingModule`, Razorpay webhook listener, billing history view in agent dashboard.
- **Testing Requirements:** Razorpay test-mode transaction lifecycle tests; webhook signature verification tests; boost expiration cron tests.
- **Acceptance Criteria:** Successful payment immediately upgrades user listing quota and applies featured badges.
- **Risks & Mitigation:** Payment webhook dropped by network; mitigated by idempotent webhook processing and manual sync endpoint.

---

### Phase 14: Notifications & Calendly Scheduling
- **Objective:** Implement multi-channel user alerts and agent site-visit scheduling.
- **Scope:** In-app notification center with unread badges, automated transactional SMS notifications (listing approved/rejected), embedded Calendly booking widget.
- **Dependencies:** Phase 08, Phase 09, Phase 10.
- **Deliverables:** NestJS `NotificationsModule`, notification bell dropdown in `@casa/ui`, Calendly modal embed.
- **Testing Requirements:** In-app notification dispatch speed tests, Calendly iframe embedding security tests.
- **Acceptance Criteria:** Moderators approving/rejecting listings triggers instant notification to the listing owner.
- **Risks & Mitigation:** Notification inbox clutter; mitigated by TTL auto-expiration of notifications after 90 days.

---

### Phase 15: Multilingual (RTL) & Localized SEO
- **Objective:** Roll out complete 4-language support (EN, HI, AR, UR) with native RTL and dynamic SEO.
- **Scope:** Localized Next.js dynamic routing (`/[lang]/...`), translation dictionary tokens, complete RTL styling flipping, dynamic XML sitemaps, localized OpenGraph metadata.
- **Dependencies:** Phase 03, Phase 05, Phase 07.
- **Deliverables:** Full translation catalogs, Next.js i18n middleware, sitemap generation cron.
- **Testing Requirements:** RTL visual audit with native Arabic/Urdu linguists; Google Rich Results snippet validation.
- **Acceptance Criteria:** 100% of UI strings translated; zero layout breakages in RTL mode; canonical `hreflang` tags generated accurately.
- **Risks & Mitigation:** Missing translation keys falling back awkwardly; mitigated by fallback to English with developer warning logs.

---

### Phase 16: End-to-End QA & Security Audit
- **Objective:** Validate platform resilience, performance benchmarks, and security compliance.
- **Scope:** Full-suite automated Playwright E2E testing, penetration testing (OWASP Top 10), load testing (1000 concurrent virtual users), WCAG 2.1 AA accessibility audit.
- **Dependencies:** All preceding phases (01–15).
- **Deliverables:** Comprehensive QA test report, penetration test audit sign-off, remediation fixes.
- **Testing Requirements:** 100% passing E2E critical flows (Registration -> Post Ad -> Moderation -> Search -> Enquiry -> Payment).
- **Acceptance Criteria:** Zero high/critical security vulnerabilities; API p95 latency < 150ms under peak load.
- **Risks & Mitigation:** Uncovered edge cases during load testing; mitigated by dedicated 1-week stabilization buffer.

---

### Phase 17: Production Deployment & CI/CD Pipeline
- **Objective:** Launch CASA on managed cloud infrastructure with automated deployment pipelines.
- **Scope:** GitHub Actions CI/CD pipelines, Vercel production deployment for `web` and `admin`, managed container deployment for `api`, MongoDB Atlas production replica set, domain SSL setup.
- **Dependencies:** Phase 16.
- **Deliverables:** Production URLs, monitoring dashboards (Sentry, Datadog/Logtail), automated health checks.
- **Testing Requirements:** Live smoke tests, production webhook verification, DNS propagation verification.
- **Acceptance Criteria:** Zero downtime deployments; automated rollback triggers on healthcheck failure.
- **Risks & Mitigation:** DNS or SSL propagation delays; mitigated by pre-configured Cloudflare edge routing.

---

### Phase 18: CASA Main Coin Ecosystem (Future Phase)
- **Objective:** Architect and deploy the extended tokenized loyalty and engagement framework.
- **Scope:** User reward points ledger, referral bonuses, promotional redemption engine, compliance and regulatory framework assessment.
- **Dependencies:** Phase 17 production maturity and separate legal clearance.
- **Deliverables:** Virtual points module, redemption catalog, regulatory compliance audit documentation.
- **Testing Requirements:** Double-entry ledger reconciliation tests, referral fraud prevention stress tests.
- **Acceptance Criteria:** Users earn verified reward points for platform engagement with zero financial liability exposure.
- **Risks & Mitigation:** Regional regulatory cryptocurrency/token restrictions; strictly mitigated by maintaining points as an internal non-fiat virtual loyalty ledger until formal legal licensing.
