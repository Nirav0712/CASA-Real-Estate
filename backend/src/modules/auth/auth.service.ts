import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { User, UserDocument } from './schemas/user.schema';
import { OtpChallenge, OtpChallengeDocument } from './schemas/otp-challenge.schema';
import { RefreshSession, RefreshSessionDocument } from './schemas/refresh-session.schema';
import { AgentProfile, AgentProfileDocument } from '../agents/schemas/agent-profile.schema';
import { Subscription, SubscriptionDocument } from '../payments/schemas/subscription.schema';
import { Package, PackageDocument } from '../entitlements/schemas/package.schema';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LinkCredentialsDto } from './dto/link-credentials.dto';
import { MailService } from './services/mail.service';
import {
  normalizeEmail,
  validatePasswordStrength,
  hashPassword,
  comparePassword,
  generateSecureToken,
  hashToken,
} from './utils/password.util';
import {
  PlatformRole,
  AccountType,
  UserRole,
  AccountStatus,
  OtpStatus,
  normalizeUserRoleModel,
} from './enums/auth.enums';
import { MockOtpProvider } from './providers/mock-otp.provider';
import { Msg91OtpProvider } from './providers/msg91-otp.provider';
import {
  JwtAccessPayload,
  JwtRefreshPayload,
  AuthenticatedUser,
  AuthTokens,
} from './interfaces/jwt-payload.interface';

interface InMemoryUser {
  _id: string;
  name: string;
  mobile: string;
  normalizedMobile: string;
  email?: string;
  passwordHash?: string;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: Date;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  agencyName?: string;
  platformRole: PlatformRole;
  accountType: AccountType | null;
  role: UserRole;
  permissions?: string[];
  status: AccountStatus;
  isVerifiedAgent: boolean;
  welcomeEmailSent?: boolean;
  kycStatus?: string;
  isTrialActive?: boolean;
  trialUsed?: boolean;
  trialExpired?: boolean;
  isTrialEligible?: boolean;
  trialStartedAt?: Date;
  trialExpiresAt?: Date;
  trialPackageId?: string | null;
  activePackageId?: string | null;
  activeSubscriptionId?: string | null;
  activePlanName?: string | null;
  subscriptionStatus?: string | null;
  subscriptionExpiresAt?: Date;
  subscriptionStartDate?: Date;
  avatar?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface InMemoryOtpChallenge {
  id: string;
  normalizedMobile: string;
  otp: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  resendCount: number;
  status: OtpStatus;
  lastSentAt: Date;
  name?: string;
  role?: UserRole;
  agencyName?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface InMemoryRefreshSession {
  _id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  // In-Memory resilient state for offline/fallback operation
  private readonly memUsers = new Map<string, InMemoryUser>();
  private readonly memChallenges: InMemoryOtpChallenge[] = [];
  private readonly memSessions = new Map<string, InMemoryRefreshSession>();

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(OtpChallenge.name)
    private readonly otpChallengeModel: Model<OtpChallengeDocument>,
    @InjectModel(RefreshSession.name)
    private readonly refreshSessionModel: Model<RefreshSessionDocument>,
    @InjectModel(AgentProfile.name)
    private readonly agentProfileModel: Model<AgentProfileDocument>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Package.name)
    private readonly packageModel: Model<PackageDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mockOtpProvider: MockOtpProvider,
    private readonly msg91OtpProvider: Msg91OtpProvider,
    private readonly mailService: MailService,
  ) {
    // Seed default admin and test users in memory store
    this.seedDefaultUsers();
  }

  async onModuleInit() {
    if (this.isDbConnected()) {
      try {
        // Safe database normalization migration for existing records
        // 1. Normalize SUPER_ADMIN: platformRole = SUPER_ADMIN, accountType = null
        await this.userModel.updateMany(
          {
            $or: [
              { role: UserRole.SUPER_ADMIN },
              { role: 'SUPER_ADMIN' },
              { platformRole: PlatformRole.SUPER_ADMIN },
              { normalizedMobile: { $in: ['+919925843531'] } },
            ],
          },
          {
            $set: {
              platformRole: PlatformRole.SUPER_ADMIN,
              accountType: null,
              role: UserRole.SUPER_ADMIN,
              permissions: ['*'],
            },
          },
        );

        // 2. Normalize ADMIN: platformRole = ADMIN, accountType = null
        await this.userModel.updateMany(
          {
            $or: [{ role: UserRole.ADMIN }, { role: 'ADMIN' }, { platformRole: PlatformRole.ADMIN }],
            normalizedMobile: { $nin: ['+919925843531'] },
          },
          {
            $set: {
              platformRole: PlatformRole.ADMIN,
              accountType: null,
              role: UserRole.ADMIN,
            },
          },
        );

        // 3. Normalize MODERATOR: platformRole = MODERATOR, accountType = null
        await this.userModel.updateMany(
          {
            $or: [
              { role: UserRole.MODERATOR },
              { role: 'MODERATOR' },
              { platformRole: PlatformRole.MODERATOR },
            ],
          },
          {
            $set: {
              platformRole: PlatformRole.MODERATOR,
              accountType: null,
              role: UserRole.MODERATOR,
            },
          },
        );

        // 4. Normalize Marketplace roles to platformRole = USER
        const marketplaceMappings = [
          {
            roles: [UserRole.BUYER, UserRole.PURCHASER, 'BUYER', 'PURCHASER'],
            accountType: AccountType.BUYER,
          },
          {
            roles: [UserRole.TENANT, 'TENANT'],
            accountType: AccountType.TENANT,
          },
          {
            roles: [UserRole.AGENT, UserRole.VERIFIED_AGENT, 'AGENT', 'VERIFIED_AGENT'],
            accountType: AccountType.AGENT,
          },
          {
            roles: [UserRole.BROKER, 'BROKER'],
            accountType: AccountType.BROKER,
          },
          {
            roles: [UserRole.DEVELOPER, 'DEVELOPER'],
            accountType: AccountType.DEVELOPER,
          },
          {
            roles: [UserRole.PROPERTY_OWNER, 'PROPERTY_OWNER'],
            accountType: AccountType.PROPERTY_OWNER,
          },
        ];

        for (const mapping of marketplaceMappings) {
          await this.userModel.updateMany(
            {
              role: { $in: mapping.roles },
              platformRole: { $nin: [PlatformRole.SUPER_ADMIN, PlatformRole.ADMIN, PlatformRole.MODERATOR] },
              normalizedMobile: { $nin: ['+919925843531'] },
            },
            {
              $set: {
                platformRole: PlatformRole.USER,
                accountType: mapping.accountType,
              },
            },
          );
        }

        this.logger.log('✓ Authoritative RBAC schema migration successfully verified');
      } catch (err: any) {
        this.logger.warn(`Database RBAC migration notice: ${err?.message}`);
      }
    }
  }

  getMemUsers(): InMemoryUser[] {
    return Array.from(this.memUsers.values());
  }

  getMemUserById(id: string): InMemoryUser | undefined {
    if (!id) return undefined;
    const target = id.toLowerCase().trim();
    for (const [key, u] of this.memUsers.entries()) {
      if (
        u._id === id ||
        u.normalizedMobile === id ||
        u.mobile === id ||
        (u.email && u.email.toLowerCase().trim() === target) ||
        key.toLowerCase().trim() === target ||
        key === id
      ) {
        return u;
      }
    }
    return undefined;
  }

  deleteMemUser(id: string): boolean {
    if (!id) return false;
    const target = id.toLowerCase().trim();
    let deleted = false;
    for (const [key, u] of Array.from(this.memUsers.entries())) {
      if (
        u._id === id ||
        u.normalizedMobile === id ||
        u.mobile === id ||
        (u.email && u.email.toLowerCase().trim() === target) ||
        key.toLowerCase().trim() === target ||
        key === id
      ) {
        this.memUsers.delete(key);
        deleted = true;
      }
    }
    return deleted;
  }

  updateMemUserStatus(id?: string, status?: AccountStatus): boolean {
    if (!id || !status) return false;
    let updated = false;
    for (const u of this.memUsers.values()) {
      if (u._id === id || u.normalizedMobile === id || u.mobile === id) {
        u.status = status;
        u.updatedAt = new Date();
        updated = true;
      }
    }
    return updated;
  }

  revokeUserSessions(userId?: string): void {
    if (!userId) return;
    for (const session of this.memSessions.values()) {
      if (session.userId === userId) {
        session.isRevoked = true;
        session.revokedAt = new Date();
      }
    }
  }

  private seedDefaultUsers() {
    const adminMobiles = ['+919925843531'];
    adminMobiles.forEach((mob) => {
      const id = new Types.ObjectId().toString();
      this.memUsers.set(mob, {
        _id: id,
        name: 'Super Administrator',
        mobile: mob.replace('+91', ''),
        normalizedMobile: mob,
        platformRole: PlatformRole.SUPER_ADMIN,
        accountType: null, // Strictly null for platform Super Admins
        role: UserRole.SUPER_ADMIN,
        permissions: ['*'],
        status: AccountStatus.ACTIVE,
        isVerifiedAgent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  }

  private isDbConnected(): boolean {
    try {
      if (process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test') {
        return true;
      }
      return this.userModel?.db?.readyState === 1;
    } catch {
      return false;
    }
  }

  /**
   * Normalizes mobile number to standard E.164 format (+91XXXXXXXXXX)
   */
  normalizeMobile(rawMobile: string): string {
    const cleaned = rawMobile.replace(/[\s\-()]/g, '');
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }
    return `+${cleaned}`;
  }

  /**
   * Hashes OTP using HMAC-SHA256 with the secret salt
   */
  private hashOtp(normalizedMobile: string, otp: string): string {
    const salt = this.configService.get<string>('auth.otpSecretSalt') || 'casa_otp_salt_secret_dev';
    return crypto.createHmac('sha256', salt).update(`${normalizedMobile}:${otp}`).digest('hex');
  }

  /**
   * Generates a 6-digit cryptographically secure random OTP
   */
  private generateSecureOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Resolves appropriate AccountType enum from UserRole / AccountType
   */
  resolveAccountType(role?: string, platformRole?: PlatformRole): AccountType | null {
    if (
      platformRole === PlatformRole.SUPER_ADMIN ||
      platformRole === PlatformRole.ADMIN ||
      platformRole === PlatformRole.MODERATOR ||
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.ADMIN ||
      role === UserRole.MODERATOR
    ) {
      return null;
    }
    switch (role) {
      case UserRole.DEVELOPER:
      case 'DEVELOPER':
        return AccountType.DEVELOPER;
      case UserRole.AGENT:
      case UserRole.VERIFIED_AGENT:
      case 'AGENT':
      case 'VERIFIED_AGENT':
        return AccountType.AGENT;
      case UserRole.BROKER:
      case 'BROKER':
        return AccountType.BROKER;
      case UserRole.PROPERTY_OWNER:
      case 'PROPERTY_OWNER':
        return AccountType.PROPERTY_OWNER;
      case UserRole.TENANT:
      case 'TENANT':
        return AccountType.TENANT;
      case UserRole.BUYER:
      case UserRole.PURCHASER:
      case 'BUYER':
      case 'PURCHASER':
      default:
        return AccountType.BUYER;
    }
  }

  /**
   * Resolves default granular permissions based on platformRole and accountType
   */
  getDefaultPermissions(platformRole?: PlatformRole, accountType?: AccountType | null): string[] {
    if (platformRole === PlatformRole.SUPER_ADMIN) {
      return ['*'];
    }
    if (platformRole === PlatformRole.ADMIN) {
      return ['admin:access', 'properties:moderate', 'users:read', 'users:manage', 'agents:verify', 'reports:read'];
    }
    if (platformRole === PlatformRole.MODERATOR) {
      return ['properties:moderate', 'reviews:moderate', 'reports:read'];
    }
    switch (accountType) {
      case AccountType.DEVELOPER:
        return ['properties:create', 'properties:manage_own', 'projects:manage', 'leads:manage_own', 'analytics:view_own'];
      case AccountType.BROKER:
        return ['properties:create', 'properties:manage_own', 'leads:manage_own', 'analytics:view_own', 'clients:manage'];
      case AccountType.AGENT:
        return ['properties:create', 'properties:manage_own', 'leads:manage_own', 'analytics:view_own'];
      case AccountType.PROPERTY_OWNER:
        return ['properties:create', 'properties:manage_own', 'enquiries:read_own'];
      case AccountType.TENANT:
        return ['rentals:search', 'saved:manage', 'enquiries:send', 'visits:book'];
      case AccountType.BUYER:
      default:
        return ['properties:search', 'saved:manage', 'enquiries:send', 'visits:book', 'comparisons:manage'];
    }
  }

  /**
   * Step 1: Request Mobile OTP Challenge
   */
  async requestOtp(dto: RequestOtpDto, metadata?: { ipAddress?: string; userAgent?: string }) {
    const normalizedMobile = this.normalizeMobile(dto.mobile);
    const cooldownSeconds = this.configService.get<number>('auth.otpCooldownSeconds') || 60;
    const expiresInMinutes = this.configService.get<number>('auth.otpExpiresInMinutes') || 5;
    const maxAttempts = this.configService.get<number>('auth.otpMaxAttempts') || 3;
    const now = new Date();

    const adminMobilesRaw =
      this.configService.get<string>('auth.adminMobiles') || '+919925843531';
    const adminMobiles = adminMobilesRaw
      .split(',')
      .map((m) => this.normalizeMobile(m.trim()));

    const isDesignatedAdmin = adminMobiles.includes(normalizedMobile);

    // Section 11: Public registration MUST NOT create SUPER_ADMIN, ADMIN, MODERATOR
    if (
      !isDesignatedAdmin &&
      dto.role &&
      [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR, 'SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(dto.role as any)
    ) {
      throw new BadRequestException('Administrative roles cannot be self-registered via public endpoints.');
    }

    const otp = this.generateSecureOtp();
    const otpHash = this.hashOtp(normalizedMobile, otp);
    const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000);

    let recentChallenge: any = null;

    if (this.isDbConnected()) {
      try {
        recentChallenge = await this.otpChallengeModel
          .findOne({
            normalizedMobile,
            status: OtpStatus.PENDING,
          })
          .sort({ createdAt: -1 });

        if (recentChallenge) {
          const timeSinceLastSent =
            (now.getTime() - new Date(recentChallenge.lastSentAt).getTime()) / 1000;
          if (timeSinceLastSent < cooldownSeconds) {
            const remaining = Math.ceil(cooldownSeconds - timeSinceLastSent);
            throw new BadRequestException(
              `Please wait ${remaining} seconds before requesting a new verification code.`,
            );
          }
        }

        await this.otpChallengeModel.updateMany(
          { normalizedMobile, status: OtpStatus.PENDING },
          { $set: { status: OtpStatus.EXPIRED } },
        );

        await this.otpChallengeModel.create({
          normalizedMobile,
          otpHash,
          expiresAt,
          attempts: 0,
          maxAttempts,
          resendCount: recentChallenge ? recentChallenge.resendCount + 1 : 0,
          status: OtpStatus.PENDING,
          lastSentAt: now,
          name: dto.name?.trim() || undefined,
          role: dto.role || undefined,
          agencyName: dto.agencyName?.trim() || undefined,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
        });
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        this.logger.warn(`Database write bypassed during requestOtp: ${err?.message}`);
      }
    }

    // Also track in-memory for resilience
    const memRecent = this.memChallenges
      .filter((c) => c.normalizedMobile === normalizedMobile && c.status === OtpStatus.PENDING)
      .pop();

    if (memRecent && !this.isDbConnected()) {
      const timeSinceLastSent = (now.getTime() - memRecent.lastSentAt.getTime()) / 1000;
      if (timeSinceLastSent < cooldownSeconds) {
        const remaining = Math.ceil(cooldownSeconds - timeSinceLastSent);
        throw new BadRequestException(
          `Please wait ${remaining} seconds before requesting a new verification code.`,
        );
      }
    }

    // Invalidate mem previous
    this.memChallenges.forEach((c) => {
      if (c.normalizedMobile === normalizedMobile && c.status === OtpStatus.PENDING) {
        c.status = OtpStatus.EXPIRED;
      }
    });

    this.memChallenges.push({
      id: crypto.randomUUID(),
      normalizedMobile,
      otp,
      otpHash,
      expiresAt,
      attempts: 0,
      maxAttempts,
      resendCount: memRecent ? memRecent.resendCount + 1 : 0,
      status: OtpStatus.PENDING,
      lastSentAt: now,
      name: dto.name?.trim() || undefined,
      role: dto.role || undefined,
      agencyName: dto.agencyName?.trim() || undefined,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });

    // Resolve OTP provider (MSG91 vs Mock)
    const providerType = this.configService.get<string>('sms.provider') || 'mock';
    const provider = providerType === 'msg91' ? this.msg91OtpProvider : this.mockOtpProvider;

    const dispatchResult = await provider.sendOtp({
      mobile: dto.mobile,
      normalizedMobile,
      otp,
      expiresInMinutes,
    });

    const isDevelopment = this.configService.get<string>('nodeEnv') !== 'production';

    return {
      success: true,
      message: 'Verification code sent successfully to your mobile number.',
      normalizedMobile,
      expiresInSeconds: expiresInMinutes * 60,
      cooldownSeconds,
      provider: provider.name,
      isMock: Boolean(dispatchResult.isMock),
      ...(isDevelopment || dispatchResult.isMock ? { devMockOtp: otp } : {}),
    };
  }

  /**
   * Step 2: Verify OTP Challenge & Authenticate User
   */
  async verifyOtp(dto: VerifyOtpDto, metadata?: { ipAddress?: string; userAgent?: string }) {
    const normalizedMobile = this.normalizeMobile(dto.mobile);
    const now = new Date();
    const isDevelopment = this.configService.get<string>('nodeEnv') !== 'production';
    const isTest = Boolean(process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test');
    const isMasterOtp = !isTest && isDevelopment && (dto.otp === '123456' || dto.otp === '000000');

    let isVerified = isMasterOtp;
    let challenge: any = null;

    if (this.isDbConnected()) {
      try {
        challenge = await this.otpChallengeModel
          .findOne({
            normalizedMobile,
            status: OtpStatus.PENDING,
          })
          .sort({ createdAt: -1 });
      } catch (err: any) {
        this.logger.warn(`Database query failed during verifyOtp: ${err?.message}`);
      }
    }

    const memChallenge = this.memChallenges
      .filter((c) => c.normalizedMobile === normalizedMobile && c.status === OtpStatus.PENDING)
      .pop();

    if (!challenge && !memChallenge && !isMasterOtp) {
      throw new BadRequestException('No pending verification request found. Please request a new OTP.');
    }

    const activeChallenge = challenge || memChallenge;

    if (!isMasterOtp) {
      if (new Date(activeChallenge.expiresAt) < now) {
        if (challenge) {
          challenge.status = OtpStatus.EXPIRED;
          await challenge.save().catch(() => {});
        }
        if (memChallenge) memChallenge.status = OtpStatus.EXPIRED;
        throw new BadRequestException('Verification code has expired. Please request a new OTP.');
      }

      if (activeChallenge.attempts >= activeChallenge.maxAttempts) {
        if (challenge) {
          challenge.status = OtpStatus.LOCKED;
          await challenge.save().catch(() => {});
        }
        if (memChallenge) memChallenge.status = OtpStatus.LOCKED;
        throw new BadRequestException('Maximum verification attempts exceeded. Please request a new OTP.');
      }

      const providedHash = this.hashOtp(normalizedMobile, dto.otp);
      const expectedHash = activeChallenge.otpHash;
      const directMatch = memChallenge ? memChallenge.otp === dto.otp : false;

      const hashMatch =
        providedHash.length === expectedHash.length &&
        crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(expectedHash));

      if (hashMatch || directMatch) {
        isVerified = true;
        if (challenge) {
          challenge.status = OtpStatus.VERIFIED;
          await challenge.save().catch(() => {});
        }
        if (memChallenge) memChallenge.status = OtpStatus.VERIFIED;
      } else {
        if (challenge) {
          challenge.attempts += 1;
          if (challenge.attempts >= challenge.maxAttempts) challenge.status = OtpStatus.LOCKED;
          await challenge.save().catch(() => {});
        }
        if (memChallenge) {
          memChallenge.attempts += 1;
          if (memChallenge.attempts >= memChallenge.maxAttempts) memChallenge.status = OtpStatus.LOCKED;
        }

        const rem = activeChallenge.maxAttempts - (activeChallenge.attempts + 1);
        if (rem <= 0) {
          throw new BadRequestException('Maximum verification attempts exceeded. Please request a new OTP.');
        }
        throw new BadRequestException(`Incorrect verification code. ${rem} attempt(s) remaining.`);
      }
    }

    if (!isVerified) {
      throw new BadRequestException('Invalid verification code.');
    }

    // Resolve Registration Name, Role, Agency Name
    const resolvedName = (dto.name?.trim() || activeChallenge?.name || '').trim();
    const resolvedRole = dto.role || activeChallenge?.role;
    const resolvedAgency = (dto.agencyName?.trim() || activeChallenge?.agencyName || '').trim();

    // Resolve or Create User
    const adminMobilesRaw =
      this.configService.get<string>('auth.adminMobiles') || '+919925843531';
    const adminMobiles = adminMobilesRaw
      .split(',')
      .map((m) => this.normalizeMobile(m.trim()));

    const isDesignatedAdmin = adminMobiles.includes(normalizedMobile);

    // Prevent unauthorized self-assignment of administrative roles
    let safeRole = resolvedRole;
    if (!isDesignatedAdmin && safeRole && [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR, 'SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(safeRole as any)) {
      this.logger.warn(`Security alert: Public user ${normalizedMobile} attempted to claim administrative role ${safeRole}. Reverting to BUYER.`);
      safeRole = UserRole.BUYER;
    }

    // Determine normalized authoritative platformRole and accountType
    let finalPlatformRole: PlatformRole;
    let finalAccountType: AccountType | null;
    let finalRole: UserRole;
    let finalIsVerifiedAgent = false;

    if (isDesignatedAdmin) {
      finalPlatformRole = PlatformRole.SUPER_ADMIN;
      finalAccountType = null; // Super Admin MUST NEVER have an accountType
      finalRole = UserRole.SUPER_ADMIN;
      finalIsVerifiedAgent = false;
    } else {
      const normalized = normalizeUserRoleModel({ role: safeRole || UserRole.BUYER });
      finalPlatformRole = PlatformRole.USER;
      finalAccountType = normalized.accountType;
      finalRole = normalized.role;
      finalIsVerifiedAgent = normalized.isVerifiedAgent;
    }

    const finalPermissions = this.getDefaultPermissions(finalPlatformRole, finalAccountType);
    const finalName = resolvedName || (isDesignatedAdmin ? 'Super Administrator' : 'CASA User');

    let user: any = null;

    if (this.isDbConnected()) {
      try {
        user = await this.userModel.findOne({ normalizedMobile });
        if (!user) {
          user = await this.userModel.create({
            name: finalName,
            mobile: dto.mobile,
            normalizedMobile,
            platformRole: finalPlatformRole,
            accountType: finalAccountType,
            role: finalRole,
            permissions: finalPermissions,
            agencyName: resolvedAgency || undefined,
            status: AccountStatus.ACTIVE,
            isVerifiedAgent: finalIsVerifiedAgent,
            lastLoginAt: now,
          });

          // Ensure AgentProfile exists if registered as AGENT or BROKER
          if (finalAccountType === AccountType.AGENT || finalAccountType === AccountType.BROKER) {
            try {
              const slugBase = (finalName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + normalizedMobile.slice(-4)).replace(/^-+|-+$/g, '');
              await this.agentProfileModel.findOneAndUpdate(
                { userId: user._id.toString() },
                {
                  $setOnInsert: {
                    userId: user._id.toString(),
                    slug: slugBase || `agent-${user._id.toString()}`,
                    displayName: finalName,
                    phone: dto.mobile,
                    agencyName: resolvedAgency || 'Independent Real Estate Consultant',
                    verificationStatus: 'NOT_SUBMITTED',
                    isVerifiedAgent: false,
                  },
                },
                { upsert: true },
              );
            } catch (pErr: any) {
              this.logger.warn(`Agent profile initial setup notice: ${pErr?.message}`);
            }
          }
        } else {
          if (user.status === AccountStatus.SUSPENDED) {
            throw new ForbiddenException('Your account has been suspended.');
          }
          if (user.status === AccountStatus.DEACTIVATED) {
            throw new ForbiddenException('Your account has been deactivated by the administrator.');
          }

          if (isDesignatedAdmin) {
            user.platformRole = PlatformRole.SUPER_ADMIN;
            user.accountType = null; // Super Admin MUST NEVER have accountType
            user.role = UserRole.SUPER_ADMIN;
            user.permissions = ['*'];
            user.isVerifiedAgent = false;
          } else {
            // If already a platform user, preserve platformRole and keep accountType null
            if (user.platformRole === PlatformRole.SUPER_ADMIN || user.platformRole === PlatformRole.ADMIN || user.platformRole === PlatformRole.MODERATOR) {
              user.accountType = null;
            } else if (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR || user.role === UserRole.SUPER_ADMIN) {
              user.platformRole = user.role === UserRole.SUPER_ADMIN ? PlatformRole.SUPER_ADMIN : (user.role === UserRole.ADMIN ? PlatformRole.ADMIN : PlatformRole.MODERATOR);
              user.accountType = null;
            } else {
              user.platformRole = PlatformRole.USER;
              if (safeRole && (user.role === UserRole.PURCHASER || user.role === UserRole.BUYER) && safeRole !== UserRole.PURCHASER && safeRole !== UserRole.BUYER) {
                const norm = normalizeUserRoleModel({ role: safeRole });
                user.accountType = norm.accountType;
                user.role = norm.role;
                user.permissions = this.getDefaultPermissions(PlatformRole.USER, norm.accountType);
                if (norm.isVerifiedAgent) user.isVerifiedAgent = true;
              } else if (!user.accountType) {
                const norm = normalizeUserRoleModel({ role: user.role, platformRole: user.platformRole });
                user.accountType = norm.accountType;
                user.role = norm.role;
                user.permissions = user.permissions && user.permissions.length ? user.permissions : this.getDefaultPermissions(PlatformRole.USER, norm.accountType);
              }
            }
          }

          if (resolvedName && (user.name === 'CASA User' || user.name !== resolvedName)) {
            user.name = resolvedName;
          }
          if (resolvedAgency) {
            user.agencyName = resolvedAgency;
          }
          user.lastLoginAt = now;
          await user.save();

          // Ensure AgentProfile exists if user accountType is AGENT or BROKER
          if (user.accountType === AccountType.AGENT || user.accountType === AccountType.BROKER) {
            try {
              const slugBase = (user.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + normalizedMobile.slice(-4)).replace(/^-+|-+$/g, '');
              await this.agentProfileModel.findOneAndUpdate(
                { userId: user._id.toString() },
                {
                  $setOnInsert: {
                    userId: user._id.toString(),
                    slug: slugBase || `agent-${user._id.toString()}`,
                    displayName: user.name,
                    phone: user.mobile || dto.mobile,
                    agencyName: user.agencyName || resolvedAgency || 'Independent Real Estate Consultant',
                    verificationStatus: 'NOT_SUBMITTED',
                    isVerifiedAgent: Boolean(user.isVerifiedAgent),
                  },
                },
                { upsert: true },
              );
            } catch (pErr: any) {
              this.logger.warn(`Agent profile check notice: ${pErr?.message}`);
            }
          }
        }
      } catch (err: any) {
        if (err instanceof ForbiddenException) throw err;
        this.logger.warn(`Database user lookup fallback: ${err?.message}`);
      }
    }

    // Fallback to in-memory user
    if (!user) {
      let memUser = this.memUsers.get(normalizedMobile);
      if (!memUser) {
        memUser = {
          _id: new Types.ObjectId().toString(),
          name: finalName,
          mobile: dto.mobile,
          normalizedMobile,
          agencyName: resolvedAgency || undefined,
          platformRole: finalPlatformRole,
          accountType: finalAccountType,
          role: finalRole,
          permissions: finalPermissions,
          status: AccountStatus.ACTIVE,
          isVerifiedAgent: finalIsVerifiedAgent,
          lastLoginAt: now,
          createdAt: now,
          updatedAt: now,
        };
        this.memUsers.set(normalizedMobile, memUser);
      } else {
        if (memUser.status === AccountStatus.SUSPENDED) {
          throw new ForbiddenException('Your account has been suspended.');
        }
        if (memUser.status === AccountStatus.DEACTIVATED) {
          throw new ForbiddenException('Your account has been deactivated by the administrator.');
        }
        if (isDesignatedAdmin) {
          memUser.platformRole = PlatformRole.SUPER_ADMIN;
          memUser.accountType = null;
          memUser.role = UserRole.SUPER_ADMIN;
          memUser.permissions = ['*'];
          memUser.isVerifiedAgent = false;
        } else {
          if (memUser.platformRole === PlatformRole.SUPER_ADMIN || memUser.platformRole === PlatformRole.ADMIN || memUser.platformRole === PlatformRole.MODERATOR) {
            memUser.accountType = null;
          } else {
            memUser.platformRole = PlatformRole.USER;
            if (safeRole && (memUser.role === UserRole.PURCHASER || memUser.role === UserRole.BUYER) && safeRole !== UserRole.PURCHASER && safeRole !== UserRole.BUYER) {
              const norm = normalizeUserRoleModel({ role: safeRole });
              memUser.accountType = norm.accountType;
              memUser.role = norm.role;
              memUser.permissions = this.getDefaultPermissions(PlatformRole.USER, norm.accountType);
            } else if (!memUser.accountType) {
              const norm = normalizeUserRoleModel({ role: memUser.role, platformRole: memUser.platformRole });
              memUser.accountType = norm.accountType;
              memUser.role = norm.role;
              memUser.permissions = memUser.permissions && memUser.permissions.length ? memUser.permissions : this.getDefaultPermissions(PlatformRole.USER, norm.accountType);
            }
          }
        }
        if (resolvedName && (memUser.name === 'CASA User' || memUser.name !== resolvedName)) {
          memUser.name = resolvedName;
        }
        if (resolvedAgency) {
          memUser.agencyName = resolvedAgency;
        }
        memUser.lastLoginAt = now;
      }
      user = memUser;
    }

    const tokens = await this.generateTokens(user, metadata);

    return {
      success: true,
      message: 'Authentication successful.',
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Step 3: Refresh Access Token
   */
  async refreshTokens(refreshToken: string, metadata?: { ipAddress?: string; userAgent?: string }) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    let payload: JwtRefreshPayload;
    try {
      const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
      payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token. Please sign in again.');
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    let user: any = null;

    const ROTATION_GRACE_PERIOD_MS = 30000; // 30-second grace window for multi-tab concurrency

    if (this.isDbConnected()) {
      try {
        const session = await this.refreshSessionModel.findOne({
          _id: new Types.ObjectId(payload.sessionId),
          familyId: payload.familyId,
        });

        if (session && session.isRevoked) {
          const isWithinGrace =
            session.revokedAt &&
            Date.now() - new Date(session.revokedAt).getTime() < ROTATION_GRACE_PERIOD_MS;

          if (isWithinGrace) {
            this.logger.debug(
              `Refresh token rotated recently (${Date.now() - new Date(session.revokedAt!).getTime()}ms ago). Permitting multi-tab concurrency without revoking family.`,
            );
            user = await this.userModel.findById(payload.sub);
          } else {
            await this.refreshSessionModel.updateMany(
              { familyId: payload.familyId },
              { $set: { isRevoked: true, revokedAt: new Date() } },
            );
            throw new UnauthorizedException(
              'Security alert: Refresh token reuse detected. All active sessions terminated.',
            );
          }
        }

        if (session && !session.isRevoked) {
          session.isRevoked = true;
          session.revokedAt = new Date();
          await session.save();

          user = await this.userModel.findById(payload.sub);
        }
      } catch (err: any) {
        if (err instanceof UnauthorizedException) throw err;
        this.logger.warn(`Database session lookup fallback: ${err?.message}`);
      }
    }

    if (!user) {
      const memSession = this.memSessions.get(payload.sessionId);
      if (memSession && memSession.tokenHash === tokenHash) {
        if (memSession.isRevoked) {
          const isWithinGrace =
            memSession.revokedAt &&
            Date.now() - new Date(memSession.revokedAt).getTime() < ROTATION_GRACE_PERIOD_MS;
          if (isWithinGrace) {
            for (const u of this.memUsers.values()) {
              if (u._id === payload.sub) {
                user = u;
                break;
              }
            }
          } else {
            throw new UnauthorizedException(
              'Security alert: Refresh token reuse detected. All active sessions terminated.',
            );
          }
        } else {
          memSession.isRevoked = true;
          memSession.revokedAt = new Date();
        }
      }

      if (!user) {
        for (const u of this.memUsers.values()) {
          if (u._id === payload.sub) {
            user = u;
            break;
          }
        }
      }
    }

    if (!user || user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException('User account is invalid or inactive.');
    }

    const tokens = await this.generateTokens(user, metadata, payload.familyId);

    return {
      success: true,
      message: 'Tokens rotated successfully.',
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Step 4: Logout Active Session
   */
  async logout(refreshToken?: string) {
    if (refreshToken) {
      try {
        const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
        const payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(refreshToken, {
          secret: refreshSecret,
        });

        if (this.isDbConnected()) {
          await this.refreshSessionModel.updateOne(
            { _id: new Types.ObjectId(payload.sessionId) },
            { $set: { isRevoked: true, revokedAt: new Date() } },
          ).catch(() => {});
        }

        const memSession = this.memSessions.get(payload.sessionId);
        if (memSession) {
          memSession.isRevoked = true;
          memSession.revokedAt = new Date();
        }
      } catch {
        // Silent catch for logout
      }
    }
    return { success: true, message: 'Logged out successfully.' };
  }

  /**
   * Step 5: Logout From All Devices
   */
  async logoutAll(userId: string) {
    if (this.isDbConnected()) {
      const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;
      await this.refreshSessionModel.updateMany(
        { userId: userObjectId as any, isRevoked: false },
        { $set: { isRevoked: true, revokedAt: new Date() } },
      ).catch(() => {});
    }

    for (const session of this.memSessions.values()) {
      if (session.userId === userId) {
        session.isRevoked = true;
        session.revokedAt = new Date();
      }
    }

    return { success: true, message: 'All active sessions have been terminated.' };
  }

  /**
   * Step 6: Get Current Authenticated User Profile
   */
  async getMe(userId: string) {
    let user: any = null;

    if (this.isDbConnected()) {
      try {
        user = await this.userModel.findById(userId);
      } catch (err: any) {
        this.logger.warn(`Database getMe fallback: ${err?.message}`);
      }
    }

    if (!user) {
      for (const u of this.memUsers.values()) {
        if (u._id === userId) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      throw new UnauthorizedException('User profile not found.');
    }

    let activeSub: any = null;
    let activePkg: any = null;
    let latestSub: any = null;

    if (this.isDbConnected() && (user._id || user.id)) {
      const uid = (user._id || user.id).toString();
      try {
        const userQuery: any[] = [{ userId: uid }];
        if (isValidObjectId(uid)) {
          userQuery.push({ userId: new Types.ObjectId(uid) });
        }

        const allSubs = await this.subscriptionModel
          .find({ $or: userQuery })
          .sort({ createdAt: -1 })
          .lean();

        if (allSubs && allSubs.length > 0) {
          latestSub = allSubs[0];
          activeSub =
            allSubs.find(
              (s: any) =>
                s.status === 'ACTIVE' &&
                (!s.endDate || new Date(s.endDate) >= new Date()),
            ) || null;
        }

        if (activeSub) {
          if (activeSub.packageId && isValidObjectId(activeSub.packageId)) {
            activePkg = await this.packageModel.findById(activeSub.packageId).lean();
          }
          const subIdStr = activeSub._id.toString();
          const pkgIdStr = activeSub.packageId
            ? activeSub.packageId.toString()
            : (user.activePackageId || null);
          const planName = activePkg?.name || activeSub.plan || 'Active Plan';

          user.activeSubscriptionId = subIdStr;
          user.activePackageId = pkgIdStr;
          user.activePlanName = planName;
          user.subscriptionStatus = 'ACTIVE';
          user.subscriptionExpiresAt = activeSub.endDate;
          user.subscriptionStartDate = activeSub.startDate;
          user.trialExpired = false;
          user.isTrialActive = false;

          await this.userModel.updateOne(
            { _id: user._id || user.id },
            {
              $set: {
                activeSubscriptionId: subIdStr,
                activePackageId: pkgIdStr,
                activePlanName: planName,
                subscriptionStatus: 'ACTIVE',
                subscriptionExpiresAt: activeSub.endDate,
                subscriptionStartDate: activeSub.startDate,
                trialExpired: false,
                isTrialActive: false,
              },
            },
          );
        } else if (latestSub) {
          if (latestSub.packageId && isValidObjectId(latestSub.packageId)) {
            activePkg = await this.packageModel.findById(latestSub.packageId).lean();
          }
          const isCancelled = latestSub.status === 'CANCELLED';
          const subStatus = isCancelled ? 'CANCELLED' : 'EXPIRED';
          const planName = activePkg?.name || latestSub.plan || 'Subscription';

          user.activeSubscriptionId = null;
          user.activePackageId = null;
          user.activePlanName = planName;
          user.subscriptionStatus = subStatus;
          user.subscriptionExpiresAt = latestSub.endDate;
          user.subscriptionStartDate = latestSub.startDate;
          user.isTrialActive = false;
          user.trialExpired = true;

          await this.userModel.updateOne(
            { _id: user._id || user.id },
            {
              $set: {
                activeSubscriptionId: null,
                activePackageId: null,
                activePlanName: planName,
                subscriptionStatus: subStatus,
                subscriptionExpiresAt: latestSub.endDate,
                subscriptionStartDate: latestSub.startDate,
                isTrialActive: false,
                trialExpired: true,
              },
            },
          );
        }
      } catch (subErr: any) {
        this.logger.warn(`Subscription resolution in getMe: ${subErr?.message}`);
      }
    }

    const effectiveBrokerId = user.brokerId || user.parentUserId || user.agencyId;
    if (effectiveBrokerId && this.isDbConnected()) {
      try {
        const parentBroker = await this.userModel.findById(effectiveBrokerId).select('name agencyName').lean();
        if (parentBroker) {
          user.parentBrokerName = parentBroker.name || '';
          user.parentAgencyName = parentBroker.agencyName || parentBroker.name || '';
        }
      } catch (err: any) {
        this.logger.warn(`Failed to resolve parent broker info: ${err?.message}`);
      }
    }

    return {
      success: true,
      user: this.sanitizeUser(user, activeSub, activePkg),
    };
  }

  /**
   * Helper: Generates signed Access and Refresh JWTs
   */
  private async generateTokens(
    user: any,
    metadata?: { ipAddress?: string; userAgent?: string },
    existingFamilyId?: string,
  ): Promise<AuthTokens> {
    const accessSecret = this.configService.get<string>('jwt.accessSecret');
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    const accessExpiresIn = this.configService.get<string>('jwt.accessExpiresIn') || '15m';
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';

    const familyId = existingFamilyId || crypto.randomUUID();
    const sessionId = new Types.ObjectId();
    const userIdStr = user._id ? user._id.toString() : user.id;

    const norm = normalizeUserRoleModel({
      role: user.role,
      platformRole: user.platformRole,
      accountType: user.accountType,
      isVerifiedAgent: user.isVerifiedAgent,
    });

    const permissions =
      user.permissions && user.permissions.length > 0
        ? user.permissions
        : this.getDefaultPermissions(norm.platformRole, norm.accountType);

    const accessPayload: JwtAccessPayload = {
      sub: userIdStr,
      userId: userIdStr,
      mobile: user.mobile,
      normalizedMobile: user.normalizedMobile,
      platformRole: norm.platformRole,
      accountType: norm.accountType, // null for SUPER_ADMIN, ADMIN, MODERATOR
      role: norm.role, // compatibility alias
      permissions,
      status: user.status || AccountStatus.ACTIVE,
      isVerifiedAgent: norm.isVerifiedAgent,
      activePackageId: user.activePackageId || null,
      activeSubscriptionId: user.activeSubscriptionId || null,
      hasActiveSubscription: Boolean(user.activeSubscriptionId && user.activePackageId),
    };

    const refreshPayload: JwtRefreshPayload = {
      sub: userIdStr,
      familyId,
      sessionId: sessionId.toString(),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn as any,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn as any,
      }),
    ]);

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (this.isDbConnected()) {
      try {
        await this.refreshSessionModel.create({
          _id: sessionId,
          userId: new Types.ObjectId(userIdStr),
          tokenHash,
          familyId,
          expiresAt: refreshExpiresAt,
          isRevoked: false,
          userAgent: metadata?.userAgent,
          ipAddress: metadata?.ipAddress,
        });
      } catch (err: any) {
        this.logger.warn(`Database session creation fallback: ${err?.message}`);
      }
    }

    this.memSessions.set(sessionId.toString(), {
      _id: sessionId.toString(),
      userId: userIdStr,
      tokenHash,
      familyId,
      expiresAt: refreshExpiresAt,
      isRevoked: false,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60,
      tokenType: 'Bearer',
    };
  }

  /**
   * Step 2B.1: Register New Account with Email & Password (Direct Activation)
   */
  async register(dto: RegisterDto, metadata?: { ipAddress?: string; userAgent?: string }) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }

    const strength = validatePasswordStrength(dto.password);
    if (!strength.isValid) {
      throw new BadRequestException(strength.message);
    }

    // 1. Strict 10-digit Indian mobile validation
    const rawMobile = String(dto.mobile || '').trim();
    const cleanDigits = rawMobile.replace(/\D/g, '');
    let nationalDigits = cleanDigits;
    if (cleanDigits.startsWith('91') && cleanDigits.length === 12) {
      nationalDigits = cleanDigits.slice(2);
    } else if (cleanDigits.startsWith('0') && cleanDigits.length === 11) {
      nationalDigits = cleanDigits.slice(1);
    }
    if (nationalDigits.length !== 10) {
      throw new BadRequestException('Mobile number must contain exactly 10 digits.');
    }

    // 2. Strict email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!dto.email || !emailRegex.test(dto.email.trim())) {
      throw new BadRequestException('Please enter a valid email address.');
    }

    const normalizedEmail = normalizeEmail(dto.email);
    const normalizedMobile = `+91${nationalDigits}`;
    const passwordHash = await hashPassword(dto.password);
    const fullName = dto.fullName.trim();
    const now = new Date();

    // 3. Duplicate email check: Show exact message "Email already registered"
    if (this.isDbConnected()) {
      const existingByEmail = await this.userModel.findOne({ email: normalizedEmail });
      if (existingByEmail) {
        throw new ConflictException('Email already registered');
      }
    }
    if (this.memUsers.has(normalizedEmail)) {
      throw new ConflictException('Email already registered');
    }

    // 4. Verify email provider is available (non-blocking warning if unconfigured)
    if (typeof this.mailService?.isConfigured === 'function' && !this.mailService.isConfigured()) {
      this.logger.warn('Email service provider is not configured. Registration will proceed and welcome email will be logged/mocked.');
    }

    // Security & Role mapping: Support both standard system roles and dynamic custom roles
    const rawRole = dto.role || (dto.accountType as any) || UserRole.BUYER;
    let safeRole = rawRole;
    let customRoleId: string | null = null;
    let dynamicPermissions: string[] = [];
    let customAccountType: AccountType | null = null;

    if (this.isDbConnected()) {
      try {
        const rolesCol = this.userModel.db.collection('roles');
        const matchedRole = await rolesCol.findOne({
          $or: [
            { slug: String(rawRole).toLowerCase().trim() },
            { name: new RegExp(`^${String(rawRole).trim()}$`, 'i') },
          ],
          isActive: true,
        });

        if (matchedRole) {
          if (
            ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(matchedRole.platformRole) ||
            ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(matchedRole.slug?.toUpperCase())
          ) {
            throw new BadRequestException('Administrative roles cannot be registered through public endpoints.');
          }

          if (!matchedRole.isSystemRole) {
            customRoleId = matchedRole._id.toString();
            customAccountType = matchedRole.accountType || AccountType.BUYER;
            safeRole = matchedRole.accountType || UserRole.BUYER;
            dynamicPermissions = Array.isArray(matchedRole.permissions) ? matchedRole.permissions : [];
          } else {
            safeRole = matchedRole.accountType || matchedRole.slug?.toUpperCase() || UserRole.BUYER;
          }
        }
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        this.logger.warn(`Could not resolve role from DB: ${err.message}`);
      }
    }

    if (
      [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR, 'SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(
        safeRole as any,
      )
    ) {
      throw new BadRequestException('Administrative roles cannot be registered through public endpoints.');
    }

    const norm = normalizeUserRoleModel({ role: safeRole, accountType: customAccountType });
    const finalPlatformRole = PlatformRole.USER;
    const finalAccountType = customAccountType || norm.accountType;
    const finalRole = norm.role;
    const finalPermissions =
      dynamicPermissions.length > 0
        ? dynamicPermissions
        : this.getDefaultPermissions(finalPlatformRole, finalAccountType);

    // Generate cryptographically secure single-use email verification token
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const verificationExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    let user: any = null;

    if (this.isDbConnected()) {
      try {
        // Check if mobile number is already in use by a different email
        const existingByMobile = await this.userModel.findOne({ normalizedMobile });
        if (existingByMobile) {
          if (existingByMobile.email && existingByMobile.email !== normalizedEmail) {
            throw new ConflictException('An account with this mobile number is already registered under a different email.');
          }
          if (existingByMobile.passwordHash) {
            throw new ConflictException('An account with this mobile number already exists. Please sign in.');
          }
          existingByMobile.email = normalizedEmail;
          existingByMobile.name = fullName;
          existingByMobile.passwordHash = passwordHash;
          existingByMobile.isEmailVerified = false;
          existingByMobile.status = AccountStatus.PENDING_VERIFICATION;
          existingByMobile.platformRole = finalPlatformRole;
          existingByMobile.accountType = finalAccountType;
          existingByMobile.role = finalRole;
          existingByMobile.permissions = finalPermissions;
          existingByMobile.customRoleId = customRoleId || null;
          existingByMobile.isVerifiedAgent = false;
          existingByMobile.kycStatus = 'NOT_SUBMITTED';
          existingByMobile.kycFrontDocumentUrl = undefined;
          existingByMobile.kycBackDocumentUrl = undefined;
          existingByMobile.kycDocumentNumber = undefined;
          existingByMobile.kycApprovedAt = undefined;
          existingByMobile.kycApprovedBy = undefined;
          existingByMobile.kycRejectionReason = undefined;
          existingByMobile.isTrialActive = false;
          existingByMobile.trialUsed = false;
          existingByMobile.trialExpired = false;
          existingByMobile.isTrialEligible = true;
          existingByMobile.trialStartedAt = undefined;
          existingByMobile.trialExpiresAt = undefined;
          existingByMobile.trialPackageId = null;
          existingByMobile.activePackageId = null;
          existingByMobile.activeSubscriptionId = null;
          existingByMobile.activePlanName = null;
          existingByMobile.subscriptionStatus = null;
          existingByMobile.subscriptionExpiresAt = undefined;
          existingByMobile.subscriptionStartDate = undefined;
          existingByMobile.welcomeEmailSent = false;
          existingByMobile.emailVerificationTokenHash = tokenHash;
          existingByMobile.emailVerificationExpiresAt = verificationExpiresAt;
          await existingByMobile.save();
          user = existingByMobile;
        } else {
          // Create new user in PENDING_VERIFICATION state with email verification token
          user = await this.userModel.create({
            name: fullName,
            email: normalizedEmail,
            mobile: nationalDigits,
            normalizedMobile,
            passwordHash,
            isEmailVerified: false,
            isMobileVerified: false,
            platformRole: finalPlatformRole,
            accountType: finalAccountType,
            role: finalRole,
            permissions: finalPermissions,
            customRoleId: customRoleId || null,
            status: AccountStatus.PENDING_VERIFICATION,
            isVerifiedAgent: false,
            kycStatus: 'NOT_SUBMITTED',
            welcomeEmailSent: false,
            isTrialActive: false,
            trialUsed: false,
            trialExpired: false,
            isTrialEligible: true,
            agencyName: dto.agencyName?.trim() || undefined,
            emailVerificationTokenHash: tokenHash,
            emailVerificationExpiresAt: verificationExpiresAt,
          });
        }
      } catch (err: any) {
        if (err instanceof ConflictException || err instanceof BadRequestException) throw err;
        if (err.code === 11000 || err.codeName === 'DuplicateKey' || err.message?.includes('duplicate key')) {
          if (err.message?.includes('email') || err.keyPattern?.email) {
            throw new ConflictException('Email already registered');
          }
          throw new ConflictException('An account with this email address or mobile number already exists.');
        }
        this.logger.error(`Database registration error: ${err?.message}`);
        throw err;
      }
    }

    // Update in-memory user store for fallback/test resilience
    const memUserObj: InMemoryUser = {
      _id: user?._id?.toString() || new Types.ObjectId().toString(),
      name: fullName,
      email: normalizedEmail,
      mobile: nationalDigits,
      normalizedMobile,
      passwordHash,
      isEmailVerified: false,
      isMobileVerified: false,
      platformRole: finalPlatformRole,
      accountType: finalAccountType,
      role: finalRole,
      permissions: finalPermissions,
      status: AccountStatus.PENDING_VERIFICATION,
      isVerifiedAgent: false,
      kycStatus: 'NOT_SUBMITTED',
      welcomeEmailSent: false,
      isTrialActive: false,
      trialUsed: false,
      trialExpired: false,
      isTrialEligible: true,
      agencyName: dto.agencyName?.trim() || undefined,
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: verificationExpiresAt,
      createdAt: now,
      updatedAt: now,
    };
    this.memUsers.set(normalizedEmail, memUserObj);
    if (!user) user = memUserObj;

    // Dispatch verification email to user's own registered email address
    let verificationEmailSent = false;
    try {
      const mailRes = await this.mailService.sendVerificationEmail(normalizedEmail, fullName, rawToken);
      verificationEmailSent = Boolean(mailRes?.success);
      if (verificationEmailSent) {
        this.logger.log(`📧 Verification email dispatched successfully to ${normalizedEmail}`);
      } else {
        this.logger.error(`Verification email delivery failed for ${normalizedEmail}: ${mailRes?.error || 'unconfigured'}`);
      }
    } catch (err: any) {
      this.logger.error(`Non-blocking verification email delivery failure during registration for ${normalizedEmail}: ${err?.message}`);
    }

    // Return unverified registration response without session tokens
    return {
      success: true,
      message: verificationEmailSent
        ? 'Registration successful! Please verify your email address before signing in.'
        : 'Registration completed. Verification email could not be delivered at this time. Please use "Resend Verification Email" on the Sign In page.',
      email: normalizedEmail,
      isEmailVerified: false,
      verificationEmailSent,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Step 2B.2: Login with Email & Password
   */
  async login(dto: LoginDto, metadata?: { ipAddress?: string; userAgent?: string }) {
    const normalizedEmail = normalizeEmail(dto.email);
    let user: any = null;

    if (this.isDbConnected()) {
      try {
        user = await this.userModel.findOne({ email: normalizedEmail }).select('+passwordHash');
      } catch (err: any) {
        this.logger.warn(`Database login lookup fallback: ${err?.message}`);
      }
    }

    if (!user) {
      user = this.memUsers.get(normalizedEmail);
    }

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await comparePassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email address before signing in. Check your inbox for the verification link.');
    }

    if (user.status === AccountStatus.SUSPENDED) {
      throw new ForbiddenException('Your account has been suspended. Please contact support.');
    }

    if (user.status === AccountStatus.DEACTIVATED) {
      throw new ForbiddenException('Your account has been deactivated by the administrator.');
    }

    const norm = normalizeUserRoleModel({
      role: user.role,
      platformRole: user.platformRole,
      accountType: user.accountType,
      isVerifiedAgent: user.isVerifiedAgent,
    });

    const isConsumer =
      norm.accountType === AccountType.BUYER ||
      norm.accountType === AccountType.TENANT ||
      norm.role === UserRole.BUYER ||
      norm.role === UserRole.TENANT ||
      norm.role === UserRole.PURCHASER;

    const isPlatformAdmin =
      norm.platformRole === PlatformRole.SUPER_ADMIN ||
      norm.platformRole === PlatformRole.ADMIN ||
      norm.platformRole === PlatformRole.MODERATOR;

    // 3-Month Free Plan is NOT automatically started on registration or login.
    // It requires KYC verification & Super Admin approval, and must be explicitly claimed by the user.
    const trialJustStarted = false;

    user.lastLoginAt = new Date();
    if (typeof user.save === 'function') {
      await user.save().catch(() => {});
    } else if (this.isDbConnected()) {
      await this.userModel.updateOne(
        { _id: user._id },
        {
          $set: {
            lastLoginAt: user.lastLoginAt,
          },
        },
      ).catch(() => {});
    }

    // Send Welcome Email upon first successful login if not already sent
    if (!user.welcomeEmailSent && this.mailService) {
      try {
        const mailRes = await this.mailService.sendWelcomeEmail(normalizedEmail, user.name);
        if (mailRes?.success) {
          user.welcomeEmailSent = true;
          if (typeof user.save === 'function') await user.save().catch(() => {});
        }
      } catch (err: any) {
        this.logger.warn(`Welcome email dispatch skipped: ${err?.message}`);
      }
    }

    const tokens = await this.generateTokens(user, metadata);

    return {
      success: true,
      message: 'Authentication successful.',
      user: this.sanitizeUser(user),
      tokens,
      trialJustStarted,
    };
  }

  /**
   * Step 2B.3: Verify Email Address with Token
   */
  async verifyEmail(dto: VerifyEmailDto) {
    const normalizedEmail = dto.email ? normalizeEmail(dto.email) : '';

    if (!dto.token) {
      throw new BadRequestException('Verification token is required.');
    }

    const providedHash = hashToken(dto.token);
    let user: any = null;

    if (this.isDbConnected()) {
      try {
        if (normalizedEmail) {
          user = await this.userModel
            .findOne({ email: normalizedEmail })
            .select('+emailVerificationTokenHash');
        } else {
          user = await this.userModel
            .findOne({ emailVerificationTokenHash: providedHash })
            .select('+emailVerificationTokenHash');
        }
      } catch (err: any) {
        this.logger.warn(`Database verifyEmail lookup fallback: ${err?.message}`);
      }
    }

    if (!user) {
      if (normalizedEmail) {
        user = this.memUsers.get(normalizedEmail);
      } else {
        for (const u of this.memUsers.values()) {
          if (u.emailVerificationTokenHash === providedHash) {
            user = u;
            break;
          }
        }
      }
    }

    if (!user) {
      throw new BadRequestException('Invalid or expired email verification link.');
    }

    if (user.isEmailVerified) {
      return {
        success: true,
        message: 'Email is already verified. You can now log in.',
      };
    }

    if (
      !user.emailVerificationTokenHash ||
      !user.emailVerificationExpiresAt ||
      new Date(user.emailVerificationExpiresAt) < new Date()
    ) {
      throw new BadRequestException('Email verification link has expired. Please request a new one.');
    }

    const expectedHash = user.emailVerificationTokenHash;
    const hashMatch =
      providedHash.length === expectedHash.length &&
      crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(expectedHash));

    if (!hashMatch) {
      throw new BadRequestException('Invalid or expired email verification link.');
    }

    user.isEmailVerified = true;
    if (user.status === AccountStatus.PENDING_VERIFICATION) {
      user.status = AccountStatus.ACTIVE;
    }
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;

    if (typeof user.save === 'function') {
      await user.save();
    }

    if (this.isDbConnected() && (user._id || user.id) && typeof this.userModel?.updateOne === 'function') {
      try {
        const res = this.userModel.updateOne(
          { _id: user._id || user.id },
          {
            $set: {
              isEmailVerified: true,
              status: user.status === AccountStatus.PENDING_VERIFICATION ? AccountStatus.ACTIVE : user.status,
            },
            $unset: {
              emailVerificationTokenHash: 1,
              emailVerificationExpiresAt: 1,
            },
          },
        );
        if (res && typeof (res as any).exec === 'function') {
          await (res as any).exec().catch(() => {});
        } else if (res && typeof (res as any).catch === 'function') {
          await (res as any).catch(() => {});
        }
      } catch {}
    }

    return {
      success: true,
      message: 'Email address verified successfully. You may now log in.',
    };
  }

  /**
   * Step 2B.4: Resend Verification Email
   */
  async resendVerification(dto: ResendVerificationDto) {
    const normalizedEmail = normalizeEmail(dto.email);
    const genericResponse = {
      success: true,
      message: 'If an unverified account exists for this email address, a verification link has been sent.',
    };

    let user: any = null;

    if (this.isDbConnected()) {
      try {
        user = await this.userModel.findOne({ email: normalizedEmail });
      } catch (err: any) {
        this.logger.warn(`Database resendVerification lookup fallback: ${err?.message}`);
      }
    }

    if (!user) {
      user = this.memUsers.get(normalizedEmail);
    }

    if (
      !user ||
      user.isEmailVerified ||
      user.status === AccountStatus.SUSPENDED ||
      user.status === AccountStatus.DEACTIVATED
    ) {
      return genericResponse;
    }

    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationTokenHash = tokenHash;
    user.emailVerificationExpiresAt = verificationExpiresAt;

    if (typeof user.save === 'function') {
      await user.save();
    }

    if (this.isDbConnected() && (user._id || user.id) && typeof this.userModel?.updateOne === 'function') {
      try {
        const res = this.userModel.updateOne(
          { _id: user._id || user.id },
          {
            $set: {
              emailVerificationTokenHash: tokenHash,
              emailVerificationExpiresAt: verificationExpiresAt,
            },
          },
        );
        if (res && typeof (res as any).exec === 'function') {
          await (res as any).exec().catch(() => {});
        } else if (res && typeof (res as any).catch === 'function') {
          await (res as any).catch(() => {});
        }
      } catch {}
    }

    try {
      const mailRes = await this.mailService.sendVerificationEmail(normalizedEmail, user.name, rawToken);
      if (!mailRes?.success) {
        this.logger.error(`Resend verification email delivery failed for ${normalizedEmail}: ${mailRes?.error}`);
        throw new InternalServerErrorException('Failed to deliver verification email. Please check your email address or try again shortly.');
      }
    } catch (err: any) {
      this.logger.error(`Resend verification email dispatch error for ${normalizedEmail}: ${err?.message}`);
      if (err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException('Failed to deliver verification email. Please try again shortly.');
    }

    return {
      success: true,
      message: 'Verification link has been sent to your email address.',
    };
  }

  /**
   * Step 2B.5: Forgot Password — Request Password Reset Token
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const normalizedEmail = normalizeEmail(dto.email);
    const genericResponse = {
      success: true,
      message: 'If an account exists with this email address, password reset instructions have been sent.',
    };

    let user: any = null;

    if (this.isDbConnected()) {
      try {
        user = await this.userModel.findOne({ email: normalizedEmail });
      } catch (err: any) {
        this.logger.warn(`Database forgotPassword lookup fallback: ${err?.message}`);
      }
    }

    if (!user) {
      user = this.memUsers.get(normalizedEmail);
    }

    if (!user || user.status === AccountStatus.SUSPENDED || user.status === AccountStatus.DEACTIVATED) {
      return genericResponse;
    }

    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiryMinutes = this.configService.get<number>('auth.passwordResetExpiresMinutes') || 60;
    const resetExpiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = resetExpiresAt;

    if (typeof user.save === 'function') {
      await user.save();
    }

    try {
      await this.mailService.sendPasswordResetEmail(normalizedEmail, user.name, rawToken);
    } catch (err: any) {
      this.logger.error(`Forgot password email dispatch error for ${normalizedEmail}: ${err?.message}`);
    }

    return genericResponse;
  }

  /**
   * Step 2B.6: Reset Password with Token
   */
  async resetPassword(dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }

    const strength = validatePasswordStrength(dto.newPassword);
    if (!strength.isValid) {
      throw new BadRequestException(strength.message);
    }

    const normalizedEmail = dto.email ? normalizeEmail(dto.email) : '';
    const providedHash = hashToken(dto.token);
    let user: any = null;

    if (this.isDbConnected()) {
      try {
        if (normalizedEmail) {
          user = await this.userModel
            .findOne({ email: normalizedEmail })
            .select('+passwordResetTokenHash');
        } else {
          user = await this.userModel
            .findOne({ passwordResetTokenHash: providedHash })
            .select('+passwordResetTokenHash');
        }
      } catch (err: any) {
        this.logger.warn(`Database resetPassword lookup fallback: ${err?.message}`);
      }
    }

    if (!user) {
      if (normalizedEmail) {
        user = this.memUsers.get(normalizedEmail);
      } else {
        for (const u of this.memUsers.values()) {
          if (u.passwordResetTokenHash === providedHash) {
            user = u;
            break;
          }
        }
      }
    }

    if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
      throw new BadRequestException('Invalid or expired password reset link.');
    }

    if (new Date(user.passwordResetExpiresAt) < new Date()) {
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      if (typeof user.save === 'function') {
        await user.save().catch(() => {});
      }
      throw new BadRequestException('Password reset link has expired. Please request a new one.');
    }

    const expectedHash = user.passwordResetTokenHash;

    const hashMatch =
      providedHash.length === expectedHash.length &&
      crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(expectedHash));

    if (!hashMatch) {
      throw new BadRequestException('Invalid or expired password reset link.');
    }

    const newPasswordHash = await hashPassword(dto.newPassword);
    user.passwordHash = newPasswordHash;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;

    // If reset is performed by an unverified account via email token, mark email verified
    if (!user.isEmailVerified && user.status === AccountStatus.PENDING_VERIFICATION) {
      user.isEmailVerified = true;
      user.status = AccountStatus.ACTIVE;
      user.emailVerificationTokenHash = undefined;
      user.emailVerificationExpiresAt = undefined;
    }

    const userIdStr = user._id ? user._id.toString() : user.id;

    if (typeof user.save === 'function') {
      await user.save();
    }

    // Revoke all existing refresh sessions for this user
    await this.logoutAll(userIdStr);

    return {
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.',
    };
  }

  /**
   * Step 4 / Onboarding: Link Email & Password to Authenticated Account
   * Used by existing administrators and users migrating to email/password authentication.
   * Securely binds target account from authenticated JWT session (never client body ID).
   */
  async linkCredentials(userId: string, dto: LinkCredentialsDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }

    validatePasswordStrength(dto.password);
    const normalizedEmail = normalizeEmail(dto.email);

    let user: any = null;
    if (this.isDbConnected()) {
      try {
        user = await this.userModel.findById(userId);
      } catch (err: any) {
        this.logger.warn(`Database linkCredentials fallback: ${err?.message}`);
      }
    }

    if (!user) {
      for (const u of this.memUsers.values()) {
        if (u._id === userId) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      throw new UnauthorizedException('Target account not found.');
    }

    if (user.status === AccountStatus.SUSPENDED || user.status === AccountStatus.DEACTIVATED) {
      throw new ForbiddenException(`Account is ${user.status.toLowerCase()}.`);
    }

    // Check email uniqueness against other accounts
    if (this.isDbConnected()) {
      const existing = await this.userModel.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });
      if (existing) {
        throw new ConflictException('This email address is already in use by another account.');
      }
    } else {
      for (const u of this.memUsers.values()) {
        if (u._id !== userId && u.email && u.email.toLowerCase() === normalizedEmail) {
          throw new ConflictException('This email address is already in use by another account.');
        }
      }
    }

    const newPasswordHash = await hashPassword(dto.password);
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.email = normalizedEmail;
    user.passwordHash = newPasswordHash;
    user.isEmailVerified = false;
    user.emailVerificationTokenHash = tokenHash;
    user.emailVerificationExpiresAt = expiresAt;

    if (typeof user.save === 'function') {
      await user.save();
    }

    // Dispatch verification email
    try {
      await this.mailService.sendVerificationEmail(
        normalizedEmail,
        user.name || 'Administrator',
        rawToken,
      );
    } catch (err: any) {
      this.logger.error(`Failed to dispatch email verification link: ${err?.message}`);
    }

    return {
      success: true,
      message:
        'Email and password have been linked. A verification link has been sent to your email address. Please verify your email before logging in with email and password.',
      user: this.sanitizeUser(user),
    };
  }

  normalizeRoleModel(input: {
    role?: any;
    platformRole?: any;
    accountType?: any;
    isVerifiedAgent?: boolean;
  }) {
    return normalizeUserRoleModel(input);
  }

  /**
   * Starts 3-Month Free Plan for eligible supply-side accounts with Super Admin / KYC approval
   */
  async startTrial(userId: string) {
    let user: any = null;
    if (this.isDbConnected()) {
      user = isValidObjectId(userId)
        ? await this.userModel.findById(userId)
        : await this.userModel.findOne({
            $or: [{ _id: userId }, { normalizedMobile: userId }],
          });
    }
    if (!user) {
      user = this.memUsers.get(userId);
    }
    if (!user) {
      throw new NotFoundException('User account not found.');
    }

    const norm = normalizeUserRoleModel({
      role: user.role,
      platformRole: user.platformRole,
      accountType: user.accountType,
      isVerifiedAgent: user.isVerifiedAgent,
    });

    const isConsumer =
      norm.accountType === AccountType.BUYER ||
      norm.accountType === AccountType.TENANT ||
      norm.role === UserRole.BUYER ||
      norm.role === UserRole.TENANT ||
      norm.role === UserRole.PURCHASER;

    if (isConsumer) {
      throw new BadRequestException('Free trial is not applicable for Buyer or Tenant accounts.');
    }

    const isTeamMember =
      norm.accountType === AccountType.BROKER_AGENT ||
      norm.role === UserRole.BROKER_AGENT ||
      Boolean(user.brokerId || user.parentUserId);

    if (isTeamMember) {
      throw new ForbiddenException(
        'Team members are not authorized to activate free trials or manage subscription plans. Only the main Broker account can manage subscriptions.'
      );
    }

    const isPlatformAdmin =
      norm.platformRole === PlatformRole.SUPER_ADMIN ||
      norm.platformRole === PlatformRole.ADMIN ||
      norm.platformRole === PlatformRole.MODERATOR;

    if (isPlatformAdmin) {
      throw new BadRequestException('Platform administrators have full access and do not require a trial.');
    }

    if (user.activePackageId) {
      throw new BadRequestException('Account already has an active subscription plan.');
    }

    // Do not restart trial by logging out, signing in again, or creating duplicate requests
    if (user.trialStartedAt || user.trialUsed || user.isTrialActive || user.trialExpired) {
      throw new BadRequestException(
        'Free trial has already been initiated or used for this account. Free trial cannot be restarted.'
      );
    }

    // Start the plan only when the account meets Super Admin approval / KYC requirements
    const isApproved =
      user.kycStatus === 'APPROVED' || norm.isVerifiedAgent === true;

    if (!isApproved) {
      throw new BadRequestException(
        `KYC verification and Super Admin approval are required before claiming the 3-Month Free Plan. Current status: ${user.kycStatus || 'NOT_SUBMITTED'}.`
      );
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 3);

    let freePkg: any = null;
    if (this.isDbConnected() && this.packageModel) {
      freePkg = await this.packageModel.findOne({
        $or: [{ slug: 'casa-free-trial' }, { isFree: true }, { name: '3-Month Free Plan' }],
      }).exec();
    }

    if (this.isDbConnected()) {
      const updatedUser = await this.userModel.findOneAndUpdate(
        {
          _id: user._id,
          trialUsed: { $ne: true },
          isTrialActive: { $ne: true },
        },
        {
          $set: {
            isTrialActive: true,
            trialStartedAt: now,
            trialExpiresAt: expiresAt,
            trialUsed: true,
            trialExpired: false,
            activePlanName: '3-Month Free Plan',
            ...(freePkg ? { activePackageId: freePkg._id } : {}),
          },
        },
        { new: true }
      );

      if (!updatedUser) {
        throw new BadRequestException(
          'Free trial has already been initiated or used for this account. Free trial cannot be restarted.'
        );
      }
      user = updatedUser;
    } else {
      user.isTrialActive = true;
      user.trialStartedAt = now;
      user.trialExpiresAt = expiresAt;
      user.trialUsed = true;
      user.trialExpired = false;
      user.activePlanName = '3-Month Free Plan';
      if (freePkg) {
        user.activePackageId = freePkg._id;
      }
      if (typeof user.save === 'function') {
        await user.save();
      }
    }

    const msRemaining = expiresAt.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

    return {
      success: true,
      message: '3-Month Free Plan activated successfully!',
      trial: {
        isTrialActive: true,
        trialStartedAt: now,
        trialExpiresAt: expiresAt,
        daysRemaining,
        remainingLabel: `${daysRemaining} Days Remaining`,
        planName: '3-Month Free Plan',
        propertyLimit: 15,
      },
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Helper: Sanitizes user model removing internal attributes and guaranteeing authoritative structure
   */
  sanitizeUser(user: any, activeSub?: any, activePkg?: any): AuthenticatedUser {
    const norm = normalizeUserRoleModel({
      role: user.role,
      platformRole: user.platformRole,
      accountType: user.accountType,
      isVerifiedAgent: user.isVerifiedAgent,
    });

    const permissions =
      user.permissions && user.permissions.length > 0
        ? user.permissions
        : this.getDefaultPermissions(norm.platformRole, norm.accountType);

    const isConsumer =
      norm.accountType === AccountType.BUYER ||
      norm.accountType === AccountType.TENANT ||
      norm.role === UserRole.BUYER ||
      norm.role === UserRole.TENANT ||
      norm.role === UserRole.PURCHASER;

    const isPlatformAdmin =
      norm.platformRole === PlatformRole.SUPER_ADMIN ||
      norm.platformRole === PlatformRole.ADMIN ||
      norm.platformRole === PlatformRole.MODERATOR;

    // Check if user has an active paid subscription
    const hasActiveSub = !isConsumer && !isPlatformAdmin && Boolean(
      activeSub ||
      user.hasActiveSubscription ||
      (user.activeSubscriptionId && user.activePackageId && !user.isTrialActive)
    );

    const now = new Date();
    const msRemaining = user.trialExpiresAt
      ? new Date(user.trialExpiresAt).getTime() - now.getTime()
      : 0;

    let trialDaysRemaining = 0;
    let trialRemainingLabel = '';
    
    // When an active paid subscription exists, trial active and trial expired are both false
    const isTrialActive = Boolean(
      !hasActiveSub && user.isTrialActive && user.trialExpiresAt && msRemaining > 0
    );
    const isTrialExpired = Boolean(
      !hasActiveSub && (user.trialExpired || (user.trialExpiresAt && msRemaining <= 0))
    );

    // If user has an active subscription, clear any dirty trialExpired flag in DB
    if (hasActiveSub && user.trialExpired) {
      user.trialExpired = false;
      user.isTrialActive = false;
      if (this.isDbConnected() && (user._id || user.id) && typeof this.userModel?.updateOne === 'function') {
        try {
          const res = this.userModel.updateOne(
            { _id: user._id || user.id },
            { $set: { trialExpired: false, isTrialActive: false } }
          );
          if (res && typeof (res as any).exec === 'function') {
            (res as any).exec().catch(() => {});
          } else if (res && typeof (res as any).catch === 'function') {
            (res as any).catch(() => {});
          }
        } catch {}
      }
    }

    // Persist trial expired status in database only when user has NO active paid subscription
    if (!hasActiveSub && isTrialExpired && (!user.trialExpired || user.isTrialActive)) {
      user.trialExpired = true;
      user.isTrialActive = false;
      if (this.isDbConnected() && (user._id || user.id) && typeof this.userModel?.updateOne === 'function') {
        try {
          const res = this.userModel.updateOne(
            { _id: user._id || user.id },
            { $set: { trialExpired: true, isTrialActive: false } }
          );
          if (res && typeof (res as any).exec === 'function') {
            (res as any).exec().catch(() => {});
          } else if (res && typeof (res as any).catch === 'function') {
            (res as any).catch(() => {});
          }
        } catch {}
      }
    }

    if (isTrialActive) {
      trialDaysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
      const monthsRemaining = Math.ceil(trialDaysRemaining / 30);
      if (trialDaysRemaining > 30) {
        trialRemainingLabel = `${monthsRemaining} Months Remaining`;
      } else if (trialDaysRemaining > 1) {
        trialRemainingLabel = `${trialDaysRemaining} Days Remaining`;
      } else {
        trialRemainingLabel = '1 Day Remaining';
      }
    }

    const isTeamMember =
      norm.accountType === AccountType.BROKER_AGENT ||
      norm.role === UserRole.BROKER_AGENT ||
      Boolean(user.brokerId || user.parentUserId);

    const isKycExempt = isConsumer || isPlatformAdmin || isTeamMember;
    const isKycApproved = user.kycStatus === 'APPROVED' || norm.isVerifiedAgent === true;

    const isTrialEligible =
      !isConsumer &&
      !isPlatformAdmin &&
      !isTeamMember &&
      !hasActiveSub &&
      !user.activePackageId &&
      !user.trialStartedAt &&
      !user.trialUsed &&
      !user.trialExpired &&
      isKycApproved;

    const activeSubscriptionId = isTeamMember ? null : (user.activeSubscriptionId || (activeSub ? activeSub._id.toString() : null));
    const activePackageId = (isConsumer || isPlatformAdmin || isTeamMember)
      ? null
      : (user.activePackageId || (activeSub?.packageId ? activeSub.packageId.toString() : null));
    const activePlanName = isTeamMember ? null : (activePkg?.name || activeSub?.plan || user.activePlanName || (isTrialActive ? '3-Month Free Plan' : null));
    const subscriptionStatus = isTeamMember ? null : (user.subscriptionStatus || activeSub?.status || (hasActiveSub ? 'ACTIVE' : null));
    const subscriptionExpiresAt = isTeamMember ? null : (activeSub?.endDate || user.subscriptionExpiresAt || null);
    const subscriptionStartDate = isTeamMember ? null : (activeSub?.startDate || user.subscriptionStartDate || null);
    const billingPeriod = (isConsumer || isPlatformAdmin || isTeamMember) ? null : (activePkg?.billingPeriod || (activeSub?.durationMonths === 12 ? 'Yearly' : 'Monthly') || 'Monthly');

    return {
      id: user._id ? user._id.toString() : user.id,
      name: user.name || 'My Property User',
      mobile: user.mobile,
      normalizedMobile: user.normalizedMobile,
      email: user.email,
      platformRole: norm.platformRole,
      accountType: norm.accountType, // strictly null for SUPER_ADMIN, ADMIN, MODERATOR
      role: norm.role, // compatibility alias
      permissions,
      status: user.status || AccountStatus.ACTIVE,
      isVerifiedAgent: norm.isVerifiedAgent,
      isEmailVerified: !!user.isEmailVerified,
      hasPassword: !!user.passwordHash,
      agencyName: user.agencyName,
      avatar: user.avatar,
      isTrialEligible,
      trialStartedAt: isTeamMember ? null : (user.trialStartedAt || null),
      trialExpiresAt: isTeamMember ? null : (user.trialExpiresAt || null),
      isTrialActive: (isConsumer || isPlatformAdmin || isTeamMember) ? false : isTrialActive,
      isTrialExpired: (isConsumer || isPlatformAdmin || isTeamMember) ? false : isTrialExpired,
      trialDaysRemaining: (isConsumer || isPlatformAdmin || isTeamMember) ? 0 : trialDaysRemaining,
      trialRemainingLabel: (isConsumer || isPlatformAdmin || isTeamMember) ? '' : trialRemainingLabel,
      trialUsed: (isConsumer || isPlatformAdmin || isTeamMember) ? false : Boolean(user.trialUsed || user.trialStartedAt),
      activePackageId,
      activeSubscriptionId,
      hasActiveSubscription: isTeamMember ? false : hasActiveSub,
      activePlanName,
      subscriptionStatus,
      subscriptionExpiresAt,
      subscriptionStartDate,
      billingPeriod,
      kycStatus: isKycExempt ? 'EXEMPT' : (user.kycStatus || 'NOT_SUBMITTED'),
      isKycExempt,
      isKycRequired: !isKycExempt,
      kycRejectionReason: isKycExempt ? null : (user.kycRejectionReason || null),
      kycApprovedAt: user.kycApprovedAt || null,
      kycApprovedBy: user.kycApprovedBy || null,
      kycDocumentType: user.kycDocumentType || null,
      brokerId: user.brokerId || user.parentUserId || null,
      parentUserId: user.parentUserId || user.brokerId || null,
      parentBrokerName: user.parentBrokerName || null,
      parentAgencyName: user.parentAgencyName || null,
      agencyId: user.agencyId || null,
      designation: user.designation || (isTeamMember ? 'Broker Associate' : undefined),
      assignedProperties: user.assignedProperties || [],
      grantedPermissions: user.grantedPermissions || user.permissions || [],
    };
  }
}
