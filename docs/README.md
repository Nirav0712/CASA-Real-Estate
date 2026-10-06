# CASA Documentation Index & Master Navigation Map

## Project Identity
- **Project Name:** CASA
- **Domain:** Real Estate Marketplace / Property Discovery Platform
- **Phase:** 01 — Project Discovery, Requirements Engineering & Master Blueprint
- **Document Version:** 1.0.0
- **Status:** Phase 01 Complete / Master Blueprint Baseline Established

---

## Master Document Directory

| Document | Purpose & Core Content | Key Stakeholders |
| :--- | :--- | :--- |
| [01. Project Overview](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PROJECT-OVERVIEW.md) | High-level project summary, business premise, commercial scope demarcation, core stack, and monorepo topology. | Executive, Product, Engineering |
| [02. Business Requirements (BRD)](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-BUSINESS-REQUIREMENTS.md) | Business vision, market operating model, lead generation vs. transaction boundary, revenue strategy, and ecosystem growth. | Business Analysts, Product Managers, Founders |
| [03. Software Requirements (SRS)](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-SOFTWARE-REQUIREMENTS-SPECIFICATION.md) | Granular functional requirements (FRs), non-functional requirements (NFRs), system performance targets, and data constraints. | Tech Leads, Developers, QA Engineers |
| [04. User Roles & Permissions](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-USER-ROLES-PERMISSIONS.md) | Comprehensive Role-Based Access Control (RBAC) matrix, permission scopes for Admin, Agent, and Purchaser roles. | Security Architects, Backend Engineers |
| [05. Property Data Model](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PROPERTY-DATA-MODEL.md) | 10 initial category definitions, configurable taxonomy, detailed property schema, and Old vs. New ambiguity analysis. | Data Architects, Backend Engineers |
| [06. Database Architecture](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-DATABASE-ARCHITECTURE.md) | MongoDB Atlas schema blueprint, collections, compound indexing, 2dsphere geo-indexing, data retention, and backup strategy. | Database Administrators, Backend Engineers |
| [07. API Roadmap](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-API-ROADMAP.md) | Comprehensive REST API inventory across 13 modules with request/response schemas, validation rules, and error matrices. | Backend Engineers, Frontend Engineers |
| [08. UI/UX Design System](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-UI-UX-DESIGN-SYSTEM.md) | Gemini-inspired light theme specification, design tokens, typography, component layout, and complete RTL architecture for Arabic & Urdu. | UI/UX Designers, Frontend Engineers |
| [09. Security Requirements](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-SECURITY-REQUIREMENTS.md) | Mobile OTP security, JWT/session token rotation, rate limiting, anti-scraping, zero plaintext policy, and audit logging. | Security Engineers, DevSecOps |
| [10. Technical Architecture](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-TECHNICAL-ARCHITECTURE.md) | Full-stack monorepo system design (Next.js + NestJS + MongoDB), integration trade-offs (Maps, Media, Payments, Messaging, Hosting). | Principal Architects, DevOps |
| [11. 18-Phase Roadmap](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-18-PHASE-ROADMAP.md) | Detailed 18-phase implementation roadmap from Discovery to Main Coin Ecosystem with acceptance criteria and risk controls. | Project Managers, Delivery Leads |
| [12. Open Questions](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-OPEN-QUESTIONS.md) | Actionable catalog of unresolved business, technical, legal, and operational decisions requiring stakeholder resolution. | Product Owner, Business Sponsors |
| [13. Assumptions & Constraints](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-ASSUMPTIONS-AND-CONSTRAINTS.md) | Scope boundaries, commercial baseline differences (₹15k promo vs full platform), system boundaries, and dependencies. | Commercial Leads, Project Managers |
| [14. Phase 01 Completion Report](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-01-COMPLETION-REPORT.md) | Formal Phase 01 review, deliverables audit, architecture decision log, risk registry, and readiness sign-off for Phase 02. | All Stakeholders |
| [15. Phase 02 Completion Report](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-02-COMPLETION-REPORT.md) | Verification of 3 independent applications (frontend, admin, backend), build results, health check, and sign-off for Phase 03. | All Stakeholders |
| [16. Phase 02.1 Security Audit & Remediation](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-02.1-SECURITY-REMEDIATION-REPORT.md) | Security audit findings, credential rotation protocol, git isolation verification, and DevSecOps guidelines. | DevSecOps, Database Admins |
| [17. Phase 03 Completion Report](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-03-COMPLETION-REPORT.md) | Gemini-inspired design tokens, component library, 4-language RTL support, theme engine, and build verification. | UI/UX, Frontend Engineers, Tech Leads |
| [18. Phase 04 Completion Report](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-04-COMPLETION-REPORT.md) | Security-first authentication, mobile OTP hashing, JWT session rotation, RBAC guards, and unit tests. | Security Architects, Backend & Frontend Leads |
| [19. Phase 05 Completion Report](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-05-COMPLETION-REPORT.md) | Public Real Estate Marketplace Homepage, 10 canonical categories, property discovery, dynamic property detail route (/property/[slug]), safe WhatsApp CTA, and multilingual RTL support. | Principal Architects, Frontend Leads, Product Managers |
| [20. Phase 06 Implementation Audit](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-06-IMPLEMENTATION-AUDIT.md) | Architectural audit of existing schemas, API gaps, canonical taxonomy, and ownership security boundaries before Phase 06 implementation. | Security Architects, Backend & Frontend Leads |
| [21. Phase 06 Completion Report](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-06-COMPLETION-REPORT.md) | Production-grade Property Management Engine, 8-step listing wizard, backend state machine, MongoDB Atlas persistence, ownership security, and localhost E2E verification. | Principal Architects, QA Leads, Product Managers |
| [22. Phase 06 Submission 401 Fix Report](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-06-SUBMISSION-401-FIX-REPORT.md) | Root cause diagnosis and resolution for final listing wizard 401 Unauthorized error with token persistence and JWT guard integration. | Security Architects, Full-Stack Engineers |
| [23. Phase 07 Implementation Audit](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-07-IMPLEMENTATION-AUDIT.md) | Architecture audit and baseline assessment of existing MongoDB indexes, schemas, and public search endpoint requirements. | Principal Architects, Backend Leads |
| [24. Phase 07 Completion Report](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-07-COMPLETION-REPORT.md) | Production-ready Search & Discovery Engine, public search API (`/api/v1/properties/search`), multi-facet filtering, URL state sync, debounced search, 27/27 live E2E checks verified. | Principal Architects, QA Leads, Product Managers |
| [25. Phase 08 Implementation Audit](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-08-IMPLEMENTATION-AUDIT.md) | Architecture audit and baseline assessment of User schema, RBAC, Agent verification, and audit logging before Phase 08. | Security Architects, Backend Leads |
| [26. Phase 08 Completion Report](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-08-COMPLETION-REPORT.md) | Production-ready Admin User Management & Governance Engine, live MongoDB Atlas persistence, status management & session revocation, RBAC safeguards, agent verification queue, and immutable audit logs. | Principal Architects, QA Leads, Product Managers |
| [27. Phase 09 Implementation Audit](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-09-IMPLEMENTATION-AUDIT.md) | Pre-implementation audit and architectural mapping for Agent Dashboard, Business Profile, RERA Verification, Document Management, and Lead CRM Engine. | Principal Architects, Full-Stack Leads |
| [28. Phase 09 Completion Report](file:///h:/Feature%20Projects/CASA%20Real%20Estate/docs/CASA-PHASE-09-COMPLETION-REPORT.md) | Full completion report for Agent Workspace, Real-time Dashboard aggregations, RERA document portfolio, Lead CRM, and Admin Agent Verification review. | Principal Architects, QA Leads, Product Managers |

---

## Requirement Classification Guide

Every requirement and technical decision across these documents is categorized into one of five rigorous classification levels:

1. **Confirmed Requirement (`[CONFIRMED]`):** Explicit business need validated for immediate baseline architecture.
2. **Preliminary Recommendation (`[RECOMMENDED]`):** High-confidence engineering recommendation subject to operational benchmarking.
3. **Open Business Question (`[OPEN-QUESTION]`):** Unresolved design or business policy awaiting formal stakeholder sign-off.
4. **Future-Phase Requirement (`[FUTURE-PHASE]`):** Validated long-term roadmap item deferred beyond initial MVP phases.
5. **Out-of-Scope (`[OUT-OF-SCOPE]`):** Explicitly excluded from platform capabilities to prevent scope creep.
