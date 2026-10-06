import { UserRole, AccountStatus } from '../enums/auth.enums';

export interface JwtAccessPayload {
  sub: string; // User ID
  mobile: string;
  normalizedMobile: string;
  role: UserRole;
  status: AccountStatus;
  isVerifiedAgent: boolean;
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
  role: UserRole;
  status: AccountStatus;
  isVerifiedAgent: boolean;
  avatar?: string;
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
