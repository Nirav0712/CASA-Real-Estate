import { PlatformRole, AccountType, AccountStatus, UserRole } from '../enums/auth.enums';

export interface JwtAccessPayload {
  sub: string; // User ID
  userId?: string; // User ID alias
  mobile: string;
  normalizedMobile: string;
  platformRole: PlatformRole;
  accountType: AccountType | null;
  role?: UserRole; // Compatibility alias
  permissions?: string[];
  status: AccountStatus;
  isVerifiedAgent: boolean;
  isTrialActive?: boolean;
  trialExpired?: boolean;
  activePackageId?: string | null;
  kycStatus?: string;
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  sub: string; // User ID
  familyId: string; // Session family identifier
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  mobile: string;
  normalizedMobile: string;
  email?: string;
  platformRole: PlatformRole;
  accountType: AccountType | null;
  role: UserRole; // Compatibility alias
  permissions?: string[];
  status: AccountStatus;
  isVerifiedAgent: boolean;
  isEmailVerified?: boolean;
  hasPassword?: boolean;
  agencyName?: string;
  avatar?: string;
  trialStartedAt?: Date | string | null;
  trialExpiresAt?: Date | string | null;
  trialPackageId?: string | null;
  isTrialActive?: boolean;
  isTrialExpired?: boolean;
  trialUsed?: boolean;
  trialExpired?: boolean;
  isTrialEligible?: boolean;
  trialDaysRemaining?: number;
  trialRemainingLabel?: string;
  activePackageId?: string | null;
  kycStatus?: string;
  isKycExempt?: boolean;
  isKycRequired?: boolean;
  kycRejectionReason?: string | null;
  kycApprovedAt?: Date | string | null;
  kycApprovedBy?: string | null;
  kycDocumentType?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
  tokenType: 'Bearer';
}

export interface AuthResponseDto {
  user: AuthenticatedUser;
  tokens: {
    accessToken: string;
    expiresIn: number;
    tokenType: string;
  };
}

