# CASA — Administrative Governance Portal (`admin/`)

## Application Overview
The **CASA Admin Portal** is an independent Next.js 15 App Router web application designed for operations administrators and trust & safety moderators to govern property advertisements, verify real estate agencies, configure dynamic categories, and review audit logs.

---

## Technology Stack
- **Framework:** Next.js 15 (App Router, React 19)
- **Language:** TypeScript 5.8
- **Styling:** Tailwind CSS 3.4 + Gemini-Inspired Light Palette
- **Icons:** Lucide React
- **Default Port:** `3001`

---

## Getting Started (Independent Run)

Enter the admin directory and install dependencies:

```bash
cd admin
npm install
```

### Development Server
```bash
npm run dev
```
The admin portal will start at **[http://localhost:3001](http://localhost:3001)**.

### Production Build & Run
```bash
npm run build
npm run start
```

### Type Checking & Linting
```bash
npm run typecheck
npm run lint
```

---

## Information Architecture Structure
- **Overview:** Dashboard, KPI Metrics, Revenue Tracking
- **Property Management:** All Properties, Side-by-side Moderation Queue, Category Schemas, Locations Tree
- **User Management:** Global Users, Agent RERA Verification, Purchaser Profiles
- **Business Management:** Lead Inflow, Subscription Tiers, Razorpay Invoices
- **Content Management:** Homepage Banners, Media Library, Multi-Language Strings
- **System & Audit:** Notifications, Global Settings, Immutable Audit Trails

---

## Environment Configuration (`.env.local`)
```env
NEXT_PUBLIC_APP_NAME="CASA Governance Admin"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
NEXT_PUBLIC_API_BASE_URL="http://localhost:5000/api/v1"
NEXT_PUBLIC_DEFAULT_LOCALE="en"
```
