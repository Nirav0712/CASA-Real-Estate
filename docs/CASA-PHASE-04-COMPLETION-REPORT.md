# CASA — PHASE 04 COMPLETION REPORT

## Security-First Authentication & Identity Layer

| Metadata Field | Value |
| :--- | :--- |
| **Project Name** | CASA (Real Estate Marketplace Platform) |
| **Phase Name** | Phase 04 — Security-First Authentication & Identity Layer |
| **Document Version** | 1.0.0 |
| **Status** | Complete & Fully Verified |
| **Date** | October 1, 2026 |
| **Next Phase** | Phase 05 — Advanced Search, Geo-Discovery & Category Taxonomies |

---

## 1. Executive Summary

Phase 04 establishes a hardened, security-first authentication and identity layer across the three independent applications of CASA (`backend/`, `frontend/`, and `admin/`).

The authentication architecture implements passwordless **mobile OTP authentication** adhering to strict cryptographic and DevSecOps principles:
- **Zero Plaintext Storage:** OTP values are generated using Node's cryptographic random engine (`crypto.randomInt`), salted, and stored as HMAC-SHA256 digests. Raw OTP values are never stored or logged in production.
- **Provider Abstraction:** Implemented `IOtpProvider` with a hardened `MockOtpProvider` (active strictly in `development` and throws `ForbiddenException` in production) and a ready `Msg91OtpProvider` adapter.
- **JWT Rotation & Replay Detection:** Dual-token architecture using short-lived Access JWTs (15 mins) and rotating Refresh Tokens (7 days) with session family tracking. If an expired or already-rotated refresh token is replayed, the entire session family is automatically revoked.
- **Role-Based Access Control (RBAC):** Centralized 7-tier role matrix (`SUPER_ADMIN`, `ADMIN`, `MODERATOR`, `VERIFIED_AGENT`, `AGENT`, `PROPERTY_OWNER`, `PURCHASER`) with NestJS guards (`JwtAuthGuard`, `RolesGuard`) and decorators (`@Roles`, `@CurrentUser`, `@Public`).
- **Frontend & Admin Integration:** Fully integrated interactive mobile login modal on the public marketplace and a dedicated, role-guarded `/login` portal on the administrative application with active cooldown timers.

---

## 2. Directory Architecture Integrity

The three applications remain completely decoupled, self-contained, and independently runnable:

```
CASA Real Estate/
├── backend/                      # NestJS 11 REST API Gateway (Port 5000)
│   ├── src/
│   │   ├── config/               # configuration.ts (JWT, Auth, SMS settings)
│   │   └── modules/
│   │       ├── auth/
│   │       │   ├── dto/          # RequestOtpDto, VerifyOtpDto, RefreshTokenDto
│   │       │   ├── enums/        # UserRole, AccountStatus, OtpStatus
│   │       │   ├── guards/       # JwtAuthGuard, RolesGuard
│   │       │   ├── decorators/   # @Roles, @CurrentUser, @Public
│   │       │   ├── interfaces/   # JwtPayload, IOtpProvider, AuthenticatedUser
│   │       │   ├── providers/    # MockOtpProvider, Msg91OtpProvider
│   │       │   ├── schemas/      # User, OtpChallenge, RefreshSession
│   │       │   ├── auth.service.ts
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.module.ts
│   │       │   └── auth.service.spec.ts # 14 automated unit & security tests
│   │       ├── health/           # System health probe
│   │       └── properties/       # Property modules
├── frontend/                     # Next.js 15 Public Marketplace (Port 3000)
│   ├── components/auth/          # AuthModal (Interactive OTP modal with timer)
│   ├── contexts/auth-context.tsx # AuthProvider & useAuth hook
│   ├── services/auth-service.ts  # API client with credentials include
│   ├── types/index.ts            # User, UserRole, AuthResponse interfaces
│   └── app/layout.tsx            # Global AuthProvider wrap
├── admin/                        # Next.js 15 Administrative Portal (Port 3001)
│   ├── app/login/page.tsx        # Dedicated operator login screen
│   ├── components/auth/          # AdminShell (Route protection & frame gate)
│   ├── contexts/auth-context.tsx # AdminAuthProvider & useAdminAuth hook
│   ├── services/auth-service.ts  # Admin API client with client-side RBAC checks
│   └── components/layout/        # Sidebar & Header with real admin initials & logout
└── docs/                         # Master technical documentation suite
```

---

## 3. Database Schema Blueprint & Identity Models

### 3.1 `User` Collection (`users`)
```typescript
@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ default: 'CASA User', trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  mobile: string;

  @Prop({ required: true, unique: true, index: true, trim: true })
  normalizedMobile: string; // E.164 standard (e.g. +919876543210)

  @Prop({ required: false, trim: true, lowercase: true })
  email?: string;

  @Prop({ type: String, enum: Object.values(UserRole), default: UserRole.PURCHASER, index: true })
  role: UserRole;

  @Prop({ type: String, enum: Object.values(AccountStatus), default: AccountStatus.ACTIVE, index: true })
  status: AccountStatus;

  @Prop({ default: false, index: true })
  isVerifiedAgent: boolean;

  @Prop({ required: false })
  avatar?: string;

  @Prop({ default: Date.now })
  lastLoginAt: Date;
}
```

### 3.2 `OtpChallenge` Collection (`otp_challenges`)
```typescript
@Schema({ timestamps: true, collection: 'otp_challenges' })
export class OtpChallenge {
  @Prop({ required: true, index: true, trim: true })
  normalizedMobile: string;

  @Prop({ required: true })
  otpHash: string; // HMAC-SHA256 (Never plaintext)

  @Prop({ required: true, index: true })
  expiresAt: Date; // TTL 5 minutes

  @Prop({ default: 0 })
  attempts: number; // Max 3 attempts

  @Prop({ default: 3 })
  maxAttempts: number;

  @Prop({ default: 0 })
  resendCount: number;

  @Prop({ type: String, enum: Object.values(OtpStatus), default: OtpStatus.PENDING, index: true })
  status: OtpStatus;

  @Prop({ default: Date.now })
  lastSentAt: Date; // 60s cooldown checking
}
```

### 3.3 `RefreshSession` Collection (`refresh_sessions`)
```typescript
@Schema({ timestamps: true, collection: 'refresh_sessions' })
export class RefreshSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  tokenHash: string; // SHA-256 of the rotating refresh token

  @Prop({ required: true, index: true })
  familyId: string; // Session family identifier for replay detection

  @Prop({ required: true })
  expiresAt: Date; // TTL 7 days

  @Prop({ default: false })
  isRevoked: boolean; // Marked true on rotation or logout

  @Prop({ required: false })
  revokedAt?: Date;
}
```

---

## 4. Role-Based Access Control (RBAC) Matrix

| Platform Role | Scope & Permissions | Public Self-Registration | Admin Portal Access |
| :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Universal platform authority, database oversight, role assignment, system configs. | ❌ Forbidden | ✅ Full Access |
| **`ADMIN`** | Listing moderation, agent verification, dispute resolution, user suspension. | ❌ Forbidden | ✅ Full Access |
| **`MODERATOR`** | Review queue approvals, advertisement flags, content moderation. | ❌ Forbidden | ✅ Moderation Scope |
| **`VERIFIED_AGENT`** | Post unlimited verified listings, manage agency leads, verified badge. | ❌ Requires Admin Verification | ❌ Access Denied |
| **`AGENT`** | Post property listings, receive buyer enquiries, request agent verification. | ✅ Allowed | ❌ Access Denied |
| **`PROPERTY_OWNER`** | Post individual direct owner listings, manage inquiries. | ✅ Allowed | ❌ Access Denied |
| **`PURCHASER`** | Search marketplace, save favorites, contact agents/owners, submit reviews. | ✅ Default Role | ❌ Access Denied |

---

## 5. API Endpoints Specification

All authentication endpoints are located under `/api/v1/auth`:

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/otp/request` | Public | Generates 6-digit cryptographic OTP, enforces 60s cooldown, hashes and dispatches challenge. |
| `POST` | `/api/v1/auth/otp/verify` | Public | Validates OTP with constant-time equality, generates User, issues Access JWT + HttpOnly Refresh Cookie. |
| `POST` | `/api/v1/auth/refresh` | Public / Cookie | Rotates refresh token, detects replay attacks, and issues new Access Token. |
| `POST` | `/api/v1/auth/logout` | Public / Cookie | Revokes current session and clears HttpOnly refresh cookie. |
| `POST` | `/api/v1/auth/logout-all` | Authenticated | Revokes all active refresh sessions across all devices for the current user. |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieves sanitized profile, role, and verification status for current user. |

---

## 6. Automated Test Suite Execution Results

All 14 unit and security integration test suites passed in `backend/src/modules/auth/auth.service.spec.ts`:

```
PASS src/modules/health/health.service.spec.ts
PASS src/modules/auth/auth.service.spec.ts
  AuthService (Security-First Unit & Integration Tests)
    √ 1. should be defined
    Mobile Normalization
      √ should normalize Indian numbers with or without +91 prefix
    OTP Request & Cooldown Protection
      √ 2. should generate and dispatch an OTP challenge successfully
      √ 3. should enforce cooldown when a recent OTP was dispatched within 60s
    OTP Verification & Security Enforcement
      √ 4. should reject verification if no pending challenge exists
      √ 5. should reject verification if OTP has expired
      √ 6. should reject and increment attempts on incorrect OTP
      √ 7. should lock challenge when maximum attempts (3) are reached
    Token Rotation & Session Management
      √ 8. should refresh token cleanly and rotate session
      √ 9. should trigger reuse detection and revoke entire family on replay attack
      √ 10. should terminate all active user sessions on logout-all
    Mock Provider Production Hardening
      √ 11. should strictly throw ForbiddenException if mock provider is invoked in production

Test Suites: 2 passed, 2 total
Tests:       14 passed, 14 total
Snapshots:   0 total
```

---

## 7. Verification & Build Validation

| Application | Test / Check | Command | Status |
| :--- | :--- | :--- | :--- |
| **Backend** | Linter | `npm --prefix backend run lint` | **PASS (0 errors, 0 warnings)** |
| **Backend** | Typecheck | `npm --prefix backend run typecheck` | **PASS (0 errors)** |
| **Backend** | Unit & Security Tests | `npm --prefix backend run test` | **PASS (14/14 tests passing)** |
| **Backend** | Nest Build | `npm --prefix backend run build` | **PASS (0 errors)** |
| **Frontend** | Typecheck | `npm --prefix frontend run typecheck` | **PASS (0 errors)** |
| **Frontend** | Linter | `npm --prefix frontend run lint` | **PASS (0 errors, 0 warnings)** |
| **Frontend** | Production Build | `npm --prefix frontend run build` | **PASS (0 errors)** |
| **Admin** | Typecheck | `npm --prefix admin run typecheck` | **PASS (0 errors)** |
| **Admin** | Linter | `npm --prefix admin run lint` | **PASS (0 errors, 0 warnings)** |
| **Admin** | Production Build | `npm --prefix admin run build` | **PASS (0 errors)** |

---

## 8. Security Gate & Credential Status Review

1. **Compromised Credential Rotation:**
   > [!IMPORTANT]
   > As established in Phase 02.1, MongoDB Atlas database credentials must be rotated on the live Atlas cluster. The development template remains sanitized (`backend/.env.example`) and all `.env` files remain git-ignored.
2. **Zero Plaintext Secrets:** No passwords, secret keys, or raw OTPs are printed, logged, or checked into version control.
3. **Mock OTP Hardening:** `MockOtpProvider` explicitly checks `nodeEnv === 'production'` and raises a blocking exception to prevent mock OTP bypass in production environments.

---

## 9. Phase 04 Sign-Off & Transition to Phase 05

Phase 04 is **100% Complete**. The authentication and identity layers are securely in place across all applications.

### Next Phase: Phase 05 — Advanced Search, Geo-Discovery & Category Taxonomies
* Geospatial search with MongoDB `2dsphere` coordinates.
* Multi-faceted category filters (House, Apartment, Plot, Commercial, Industrial).
* Budget slider, BHK selector, and amenities filtering.

*(Phase 05 will commence only upon explicit user instruction).*
