export enum PlatformRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  USER = 'USER',
}

export enum AccountType {
  DEVELOPER = 'DEVELOPER',
  AGENT = 'AGENT',
  BROKER = 'BROKER',
  PROPERTY_OWNER = 'PROPERTY_OWNER',
  BUYER = 'BUYER',
  TENANT = 'TENANT',
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  DEVELOPER = 'DEVELOPER',
  AGENT = 'AGENT',
  BROKER = 'BROKER',
  PROPERTY_OWNER = 'PROPERTY_OWNER',
  BUYER = 'BUYER',
  TENANT = 'TENANT',
  PURCHASER = 'PURCHASER', // Backward compatibility alias for BUYER
  VERIFIED_AGENT = 'VERIFIED_AGENT', // Backward compatibility alias for AGENT
  GUEST = 'GUEST',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

export enum OtpStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  EXPIRED = 'EXPIRED',
  LOCKED = 'LOCKED',
}

export function normalizeUserRoleModel(input: {
  role?: string;
  platformRole?: string;
  accountType?: string | null;
  isVerifiedAgent?: boolean;
}): {
  platformRole: PlatformRole;
  accountType: AccountType | null;
  role: UserRole;
  isVerifiedAgent: boolean;
} {
  const pRole = input.platformRole || input.role;
  let isVerifiedAgent = Boolean(input.isVerifiedAgent);

  // 1. Platform users: SUPER_ADMIN, ADMIN, MODERATOR (accountType must strictly be null)
  if (pRole === 'SUPER_ADMIN' || input.role === 'SUPER_ADMIN') {
    return {
      platformRole: PlatformRole.SUPER_ADMIN,
      accountType: null,
      role: UserRole.SUPER_ADMIN,
      isVerifiedAgent: false,
    };
  }
  if (pRole === 'ADMIN' || input.role === 'ADMIN') {
    return {
      platformRole: PlatformRole.ADMIN,
      accountType: null,
      role: UserRole.ADMIN,
      isVerifiedAgent: false,
    };
  }
  if (pRole === 'MODERATOR' || input.role === 'MODERATOR') {
    return {
      platformRole: PlatformRole.MODERATOR,
      accountType: null,
      role: UserRole.MODERATOR,
      isVerifiedAgent: false,
    };
  }

  // 2. Marketplace users: platformRole === USER
  const rawAccount = input.accountType || input.role;

  if (rawAccount === 'DEVELOPER') {
    return {
      platformRole: PlatformRole.USER,
      accountType: AccountType.DEVELOPER,
      role: UserRole.DEVELOPER,
      isVerifiedAgent,
    };
  }
  if (rawAccount === 'BROKER') {
    return {
      platformRole: PlatformRole.USER,
      accountType: AccountType.BROKER,
      role: UserRole.BROKER,
      isVerifiedAgent,
    };
  }
  if (rawAccount === 'VERIFIED_AGENT') {
    return {
      platformRole: PlatformRole.USER,
      accountType: AccountType.AGENT,
      role: UserRole.AGENT,
      isVerifiedAgent: true,
    };
  }
  if (rawAccount === 'AGENT') {
    return {
      platformRole: PlatformRole.USER,
      accountType: AccountType.AGENT,
      role: UserRole.AGENT,
      isVerifiedAgent,
    };
  }
  if (rawAccount === 'PROPERTY_OWNER') {
    return {
      platformRole: PlatformRole.USER,
      accountType: AccountType.PROPERTY_OWNER,
      role: UserRole.PROPERTY_OWNER,
      isVerifiedAgent,
    };
  }
  if (rawAccount === 'TENANT') {
    return {
      platformRole: PlatformRole.USER,
      accountType: AccountType.TENANT,
      role: UserRole.TENANT,
      isVerifiedAgent,
    };
  }
  if (rawAccount === 'BUYER' || rawAccount === 'PURCHASER') {
    return {
      platformRole: PlatformRole.USER,
      accountType: AccountType.BUYER,
      role: UserRole.BUYER,
      isVerifiedAgent,
    };
  }

  return {
    platformRole: PlatformRole.USER,
    accountType: AccountType.BUYER,
    role: UserRole.BUYER,
    isVerifiedAgent,
  };
}
