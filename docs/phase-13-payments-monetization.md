# CASA Real Estate Marketplace — Phase 13: Payments, Monetization & Transaction Foundation

## Overview
Phase 13 establishes a robust, production-ready payment and monetization infrastructure for the CASA Real Estate Marketplace. It introduces server-side price calculation, cryptographic signature validation, webhook ingestion, property monetization (Featured Property upgrades), agent subscription packaging, user-isolated payment histories, and an administrator revenue management console with refund processing.

---

## 1. Monetization Packages & Pricing Architecture
Prices are **strictly enforced on the backend**. Any client-submitted amounts are disregarded to eliminate price tampering and parameter manipulation attacks.

| Product Code | Name | Amount (INR) | Duration | Description |
| :--- | :--- | :--- | :--- | :--- |
| `FEATURED_PROPERTY` | Featured Property Boost | ₹1,999 | 30 Days | Promoted visibility, badges, and top-tier placement |
| `PROPERTY_LISTING` | Single Standard Listing | ₹999 | 90 Days | Standard single-property marketplace listing |
| `PREMIUM_LISTING` | Premium Property Package | ₹4,999 | 180 Days | Premium showcase with verified priority badge |
| `SUBSCRIPTION_PRO` | Agent Pro Plan | ₹2,499 | 30 Days | Up to 15 active listings, advanced CRM tools, lead analytics |
| `SUBSCRIPTION_BUSINESS` | Agency Business Plan | ₹6,999 | 30 Days | Unlimited listings, multi-agent CRM access, API access |

---

## 2. Gateway Architecture & Provider Abstraction
The system utilizes a modular provider pattern (`IPaymentProvider`) implemented by `RazorpayPaymentProvider`:
- **Dual-Mode Operation:** Works with live credentials when configured, and falls back to a deterministic cryptographic simulation mode in local development environments.
- **Client Key Isolation:** Exposes only the public key ID via `/api/v1/payments/config/public-key`. The secret key and webhook secret are never exposed to the client or logged.
- **Cryptographic Verification:** Verification verifies `HMAC-SHA256(order_id + "|" + payment_id, key_secret) === signature`.
- **Webhook Security:** Webhook events verify `HMAC-SHA256(raw_body, webhook_secret) === x-razorpay-signature`.

---

## 3. Data Models & MongoDB Schemas
### Payment Schema (`payments` collection)
- `orderId`: Unique CASA order ID (`CASA_ORD_{timestamp}_{random}`).
- `userId`, `userName`, `userMobile`: Customer identity.
- `provider`: `RAZORPAY`.
- `providerOrderId`, `providerPaymentId`, `providerSignature`: Gateway references.
- `amount`, `currency`: Transaction amount in INR.
- `status`: `CREATED` | `AUTHORIZED` | `PAID` | `FAILED` | `REFUNDED` | `PARTIALLY_REFUNDED` | `EXPIRED`.
- `purpose`: `FEATURED_PROPERTY` | `PROPERTY_LISTING` | `SUBSCRIPTION` | `VERIFICATION_FEE` | `OTHER`.
- `referenceId`, `productCode`, `productName`: Target entity (e.g. Property ID).
- `refundAmount`, `refundReason`, `refundId`: Refund audit trail.

### Subscription Schema (`subscriptions` collection)
- `userId`, `plan`: `FREE` | `PRO` | `BUSINESS` | `ENTERPRISE`.
- `status`: `ACTIVE` | `PAST_DUE` | `CANCELED` | `EXPIRED`.
- `currentPeriodStart`, `currentPeriodEnd`, `cancelAtPeriodEnd`.
- `paymentId`, `providerSubscriptionId`.

---

## 4. API Endpoints
### Public Endpoints
- `GET /api/v1/payments/pricing` — Catalog of monetization packages.
- `GET /api/v1/payments/config/public-key` — Public gateway client configuration.
- `POST /api/v1/payments/webhook/razorpay` — Ingests gateway webhooks with HMAC-SHA256 validation.

### Authenticated Endpoints (User / Agent)
- `POST /api/v1/payments/orders` — Initializes server-side order with controlled pricing.
- `POST /api/v1/payments/verify` — Verifies HMAC signature, transitions status to `PAID`, and activates service.
- `GET /api/v1/payments/my` — Returns user's transaction history.
- `GET /api/v1/payments/:id` — Details of a specific payment order.

### Admin Endpoints (RBAC: `ADMIN`, `SUPER_ADMIN`)
- `GET /api/v1/admin/payments` — Global ledger with revenue KPIs (`totalRevenue`, `paidOrdersCount`, `refundedCount`).
- `POST /api/v1/admin/payments/:id/refund` — Gateway refund execution with automatic service revocation.

---

## 5. Security & Isolation Controls
1. **Server-Side Pricing Resolution:** Eliminates price injection vulnerabilities.
2. **Strict Property Authorization:** Only verified property owners, listing creators, or administrators can feature listings.
3. **Idempotency:** Repeated payment verification calls or duplicate webhook events return HTTP 200 without double-crediting or extending durations multiple times.
4. **Tenant Isolation:** `/api/v1/payments/my` enforces `userId === req.user.id` matching.
