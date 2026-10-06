# CASA — Assumptions, Constraints & Commercial Boundaries

## 1. Commercial Scope Demarcation & Baseline

> [!IMPORTANT]
> **Commercial Context & Package Boundary**
> The original promotional package baseline of ₹15,000 corresponds to a static/single-tier promotional website. The CASA platform specified herein represents a full-scale, distributed SaaS marketplace. To ensure transparent project execution and budget predictability, all functional items are categorized under distinct contractual and phased boundaries.

```mermaid
graph TD
    subgraph Original Package (Baseline)
        A[Single-Tier Promotional Website Scope: ₹15,000]
    end
    
    subgraph Enterprise Marketplace Scope (CASA Full Platform)
        B[Multi-Role RBAC Marketplace Engine]
        C[Admin Governance & Content Moderation Portal]
        D[Agent Subscription SaaS & Lead Pipeline]
        E[Multilingual Dynamic RTL Engine: EN, HI, AR, UR]
        F[Geospatial 2dsphere Radial Search]
        G[Media CDN & YouTube Video Walkthroughs]
        H[Payment Webhook Lifecycle & Monetization]
        I[CASA Main Coin Future Loyalty Ecosystem]
    end
```

---

## 2. Business & Operational Assumptions

1. **Self-Service Verification:** Real estate agents will independently upload business registration certificates and RERA licenses through the portal to claim verified status.
2. **Operational Moderation Capacity:** The platform owner will assign at least one dedicated moderator capable of clearing the pending advertisement queue within an SLA of 4–12 hours.
3. **Mobile Browsing Prevalence:** Target users will access the marketplace predominantly on mobile 4G/5G connections; all frontend bundles and media pipelines must prioritize mobile performance.
4. **Direct Negotiation Culture:** In the target regional real estate market, final pricing, contract negotiations, and physical site visits occur directly between the buyer and advertiser outside the platform.

---

## 3. Technical & Architectural Constraints

1. **Zero VPS Maintenance Mandate:** No unmanaged Linux virtual machines, manual kernel patching, or self-hosted web servers. The entire backend runs on managed container platforms (e.g. Render, Railway, AWS ECS Fargate) with MongoDB Atlas.
2. **Stateless API Gateway:** NestJS backend instances must remain 100% stateless. Session state is managed via cryptographically signed JWTs, httpOnly cookies, and distributed Redis caches.
3. **Third-Party Service Decoupling:** All external third-party integrations (Ola Maps, SMS Gateways, Razorpay, ImageKit) must be wrapped in generic interface adapters to prevent vendor lock-in.
4. **Browser Compatibility:** Target evergreen modern browsers (Chrome, Safari, Edge, Firefox) on Android (v10+), iOS (v14+), and Desktop. Legacy Internet Explorer is unsupported.

---

## 4. Scope Classification Matrix

| Feature Domain | Feature Description | Scope Classification | Target Phase |
| :--- | :--- | :---: | :---: |
| **Identity & Access** | Mobile Number SMS OTP Login | `[CONFIRMED]` | Phase 04 |
| | JWT & Rotating httpOnly Refresh Cookies | `[CONFIRMED]` | Phase 04 |
| | Hierarchical RBAC (Admin, Agent, Seeker) | `[CONFIRMED]` | Phase 04 |
| **Listing Lifecycle** | Dynamic 10-Category Property Ad Wizard | `[CONFIRMED]` | Phase 06 |
| | ImageKit Signed Direct Image CDN Uploads | `[CONFIRMED]` | Phase 06 |
| | YouTube Privacy-Enhanced Video Walkthroughs | `[CONFIRMED]` | Phase 06 |
| | Admin Side-by-Side Moderation Queue | `[CONFIRMED]` | Phase 08 |
| | Private Admin Remarks & Rejection Codes | `[CONFIRMED]` | Phase 08 |
| **Discovery** | Geospatial Radial Distance Search (`2dsphere`) | `[CONFIRMED]` | Phase 07, 11 |
| | Disambiguated Freshness vs. Property Age Filters | `[CONFIRMED]` | Phase 07 |
| | Ola Maps Integration with Mapbox Fallback | `[RECOMMENDED]` | Phase 11 |
| **Communication** | WhatsApp Pre-Formatted Click-to-Chat Link | `[CONFIRMED]` | Phase 12 |
| | In-Platform Enquiry Lead Inbox | `[CONFIRMED]` | Phase 12 |
| | Calendly Site Visit Scheduling Widget | `[CONFIRMED]` | Phase 14 |
| | Automated WhatsApp Cloud API Chatbot | `[FUTURE-PHASE]` | Post-Launch |
| **Monetization** | Razorpay Agent Subscription Packages | `[CONFIRMED]` | Phase 13 |
| | Featured Listing Bumps with TTL Expiry | `[CONFIRMED]` | Phase 13 |
| | Verified Broker Documentary Badge Fee | `[RECOMMENDED]` | Phase 13 |
| **Globalization** | Full Multilingual UI (EN, HI, AR, UR) | `[CONFIRMED]` | Phase 15 |
| | Bidirectional (RTL) Layout Mirroring | `[CONFIRMED]` | Phase 15 |
| **Ecosystem** | CASA Main Coin Loyalty Virtual Ledger | `[FUTURE-PHASE]` | Phase 18 |
| | On-Chain Token Transfers / Wallet Staking | `[OUT-OF-SCOPE]` | Excluded |
| **Transactions** | Legal Property Title Clearance | `[OUT-OF-SCOPE]` | Excluded |
| | Processing Property Escrow / Sale Settlement | `[OUT-OF-SCOPE]` | Excluded |
| | Government Land Registry Deed Transfers | `[OUT-OF-SCOPE]` | Excluded |
