# CASA Real Estate Marketplace Platform

> **Scalable, Multilingual Real Estate Marketplace & Digital Property Ecosystem**

CASA is an enterprise-grade, multilingual property listing and discovery platform designed for property owners, certified real estate brokers, homebuyers, and platform operations administrators.

---

## 1. Three Independent Applications Architecture

CASA is architected into **three completely decoupled, independently runnable applications**. Each application maintains its own `package.json`, dependencies, configuration, and execution lifecycle.

```text
CASA Real Estate/
│
├── frontend/             # Next.js 15 App Router (Port 3000) - Public Marketplace & Portals
├── admin/                # Next.js 15 App Router (Port 3001) - Governance & Moderation
├── backend/              # NestJS Modular REST API (Port 5000) - Core API Gateway & Services
│
├── docs/                 # Complete Architecture, SRS, BRD, RBAC & Roadmap Blueprints
├── .gitignore
├── package.json          # Root convenience scripts (Optional)
└── README.md             # Master platform guide
```

---

## 2. Technology Stack Overview

| Application Layer | Core Technologies | Port | Primary Purpose |
| :--- | :--- | :---: | :--- |
| **Public Frontend** (`frontend/`) | Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide Icons | `3000` | Property discovery, search, advertiser contact (WhatsApp/phone), and ad posting. |
| **Admin Governance** (`admin/`) | Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide Icons | `3001` | Side-by-side listing moderation queue, agent verification, taxonomy configuration. |
| **Backend API** (`backend/`) | Node.js, NestJS 11, TypeScript, MongoDB Atlas, Mongoose, Swagger | `5000` | REST API gateway (`/api/v1`), JWT auth, RBAC guards, health checks, Swagger docs. |

---

## 3. Prerequisites
- **Node.js:** `v20.x` or `v22.x` or `v24.x`
- **NPM:** `v10.x` or `v11.x`
- **MongoDB:** MongoDB Atlas connection string or local MongoDB instance (`mongodb://127.0.0.1:27017`)

---

## 4. How to Run Each Application Independently

The platform **does not require any root monorepo tool or global command**. You can open separate terminal windows for each application:

### Terminal 1: Public Marketplace Frontend (Port 3000)
```bash
cd frontend
npm install
npm run dev
```
👉 Open **[http://localhost:3000](http://localhost:3000)** in your browser.

> *Note: If the backend is offline, the frontend runs in a controlled development state with sample data without crashing.*

---

### Terminal 2: Admin Governance Portal (Port 3001)
```bash
cd admin
npm install
npm run dev
```
👉 Open **[http://localhost:3001](http://localhost:3001)** in your browser.

> *Note: If the backend is offline, the admin portal runs independently with pre-configured dashboard metrics.*

---

### Terminal 3: Backend RESTful API Gateway (Port 5000)
```bash
cd backend
npm install
npm run dev
```
👉 API Gateway: **[http://localhost:5000/api/v1](http://localhost:5000/api/v1)**  
👉 Health Endpoint: **[http://localhost:5000/health](http://localhost:5000/health)**  
👉 Interactive Swagger Docs: **[http://localhost:5000/api/docs](http://localhost:5000/api/docs)**

---

## 5. Build, Typecheck, and Lint Commands

Each application can be validated and built independently:

### Public Frontend (`frontend/`)
```bash
cd frontend
npm run typecheck   # Validate TypeScript types
npm run lint        # Check Next.js ESLint rules
npm run build       # Build production bundle
npm run start       # Start production server on port 3000
```

### Admin Governance (`admin/`)
```bash
cd admin
npm run typecheck   # Validate TypeScript types
npm run lint        # Check Next.js ESLint rules
npm run build       # Build production bundle
npm run start       # Start production server on port 3001
```

### Backend API (`backend/`)
```bash
cd backend
npm run typecheck   # Validate TypeScript types
npm run lint        # Check NestJS ESLint rules
npm run test        # Run Jest unit tests
npm run build       # Build NestJS dist bundle
npm run start:prod  # Start production server on port 5000
```

---

## 6. Port Configuration & Troubleshooting

If you need to customize ports due to local port collisions:

- **Frontend Port (3000):** Modify `-p <port>` in `frontend/package.json` `"dev"` script or set `PORT=3000`.
- **Admin Port (3001):** Modify `-p <port>` in `admin/package.json` `"dev"` script or set `PORT=3001`.
- **Backend Port (5000):** Set `PORT=<port>` in `backend/.env` or export environment variable `PORT`.

---

## 7. Master Documentation Suite (`docs/`)

The full Phase 01 architectural specification and roadmap documentation is available in [`docs/`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs):

- [`docs/README.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/README.md) — Master Documentation Index
- [`docs/CASA-PROJECT-OVERVIEW.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PROJECT-OVERVIEW.md) — Project Identity & Core Stack
- [`docs/CASA-BUSINESS-REQUIREMENTS.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-BUSINESS-REQUIREMENTS.md) — Business Requirements (BRD)
- [`docs/CASA-SOFTWARE-REQUIREMENTS-SPECIFICATION.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-SOFTWARE-REQUIREMENTS-SPECIFICATION.md) — Software Requirements (SRS)
- [`docs/CASA-USER-ROLES-PERMISSIONS.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-USER-ROLES-PERMISSIONS.md) — Granular RBAC Matrix
- [`docs/CASA-PROPERTY-DATA-MODEL.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PROPERTY-DATA-MODEL.md) — 10 Categories & Property Schemas
- [`docs/CASA-DATABASE-ARCHITECTURE.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-DATABASE-ARCHITECTURE.md) — MongoDB Blueprint & Indexing
- [`docs/CASA-API-ROADMAP.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-API-ROADMAP.md) — RESTful API Inventory
- [`docs/CASA-UI-UX-DESIGN-SYSTEM.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-UI-UX-DESIGN-SYSTEM.md) — Gemini Light Design & RTL
- [`docs/CASA-SECURITY-REQUIREMENTS.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-SECURITY-REQUIREMENTS.md) — Authentication & Security Specs
- [`docs/CASA-TECHNICAL-ARCHITECTURE.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-TECHNICAL-ARCHITECTURE.md) — Technical Architecture & Integrations
- [`docs/CASA-18-PHASE-ROADMAP.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-18-PHASE-ROADMAP.md) — 18-Phase Execution Plan
- [`docs/CASA-OPEN-QUESTIONS.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-OPEN-QUESTIONS.md) — Open Questions & Decisions
- [`docs/CASA-ASSUMPTIONS-AND-CONSTRAINTS.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-ASSUMPTIONS-AND-CONSTRAINTS.md) — Commercial Scope Boundaries
- [`docs/CASA-PHASE-01-COMPLETION-REPORT.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-01-COMPLETION-REPORT.md) — Phase 01 Sign-off
- [`docs/CASA-PHASE-02-COMPLETION-REPORT.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-02-COMPLETION-REPORT.md) — Phase 02 Sign-off
- [`docs/CASA-PHASE-03-COMPLETION-REPORT.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-03-COMPLETION-REPORT.md) — Phase 03 Sign-off
- [`docs/CASA-PHASE-04-COMPLETION-REPORT.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-04-COMPLETION-REPORT.md) — Phase 04 Sign-off
- [`docs/CASA-PHASE-05-COMPLETION-REPORT.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-05-COMPLETION-REPORT.md) — Phase 05 Sign-off
- [`docs/CASA-PHASE-06-IMPLEMENTATION-AUDIT.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-06-IMPLEMENTATION-AUDIT.md) — Phase 06 Implementation Audit
- [`docs/CASA-PHASE-06-COMPLETION-REPORT.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-06-COMPLETION-REPORT.md) — Phase 06 Sign-off
- [`docs/CASA-PHASE-07-IMPLEMENTATION-AUDIT.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-07-IMPLEMENTATION-AUDIT.md) — Phase 07 Search Engine Implementation Audit
- [`docs/CASA-PHASE-07-COMPLETION-REPORT.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-07-COMPLETION-REPORT.md) — Phase 07 Search & Discovery Engine Sign-off
- [`docs/CASA-PHASE-08-IMPLEMENTATION-AUDIT.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-08-IMPLEMENTATION-AUDIT.md) — Phase 08 User Management & Governance Implementation Audit
- [`docs/CASA-PHASE-08-COMPLETION-REPORT.md`](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-08-COMPLETION-REPORT.md) — Phase 08 Admin User Management & Governance Sign-off

