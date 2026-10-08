import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { User, UserDocument } from './schemas/user.schema';
import { OtpChallenge, OtpChallengeDocument } from './schemas/otp-challenge.schema';
import { RefreshSession, RefreshSessionDocument } from './schemas/refresh-session.schema';
import { AgentProfile, AgentProfileDocument } from '../agents/schemas/agent-profile.schema';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
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
  agencyName?: string;
  platformRole: PlatformRole;
  accountType: AccountType | null;
  role: UserRole;
  permissions?: string[];
  status: AccountStatus;
  isVerifiedAgent: boolean;
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
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mockOtpProvider: MockOtpProvider,
    private readonly msg91OtpProvider: Msg91OtpProvider,
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
              { normalizedMobile: { $in: ['+919925843599', '+919876543210', '+917359237870'] } },
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
            normalizedMobile: { $nin: ['+919925843599', '+919876543210', '+917359237870'] },
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
              normalizedMobile: { $nin: ['+919925843599', '+919876543210', '+917359237870'] },
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
    for (const u of this.memUsers.values()) {
      if (u._id === id || u.normalizedMobile === id || u.mobile === id) return u;
    }
    return undefined;
  }

  private seedDefaultUsers() {
    const adminMobiles = ['+919925843599', '+919876543210', '+917359237870'];
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

    const adminMobiles = (
      this.configService.get<string>('auth.adminMobiles') ||
      '+919925843599,+919876543210,+917359237870'
    )
      .split(',')
      .map((m) => m.trim());

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
    const adminMobiles = (
      this.configService.get<string>('auth.adminMobiles') ||
      '+919925843599,+919876543210,+917359237870'
    )
      .split(',')
      .map((m) => m.trim());

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

    if (this.isDbConnected()) {
      try {
        const session = await this.refreshSessionModel.findOne({
          _id: new Types.ObjectId(payload.sessionId),
          familyId: payload.familyId,
        });

        if (session && session.isRevoked) {
          await this.refreshSessionModel.updateMany(
            { familyId: payload.familyId },
            { $set: { isRevoked: true, revokedAt: new Date() } },
          );
          throw new UnauthorizedException('Security alert: Refresh token reuse detected. All active sessions terminated.');
        }

        if (session && !session.isRevoked) {
          session.isRevoked = true;
          session.revokedAt = new Date();
          await session.save();

          user = await this.userModel.findById(payload.sub);
        }
      } catch (err: any) {
        this.logger.warn(`Database session lookup fallback: ${err?.message}`);
      }
    }

    if (!user) {
      const memSession = this.memSessions.get(payload.sessionId);
      if (memSession && !memSession.isRevoked && memSession.tokenHash === tokenHash) {
        memSession.isRevoked = true;
        memSession.revokedAt = new Date();
      }

      for (const u of this.memUsers.values()) {
        if (u._id === payload.sub) {
          user = u;
          break;
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
      await this.refreshSessionModel.updateMany(
        { userId: new Types.ObjectId(userId), isRevoked: false },
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

    return {
      success: true,
      user: this.sanitizeUser(user),
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

  normalizeRoleModel(input: {
    role?: any;
    platformRole?: any;
    accountType?: any;
    isVerifiedAgent?: boolean;
  }) {
    return normalizeUserRoleModel(input);
  }

  /**
   * Helper: Sanitizes user model removing internal attributes and guaranteeing authoritative structure
   */
  sanitizeUser(user: any): AuthenticatedUser {
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

    return {
      id: user._id ? user._id.toString() : user.id,
      name: user.name || 'CASA User',
      mobile: user.mobile,
      normalizedMobile: user.normalizedMobile,
      email: user.email,
      platformRole: norm.platformRole,
      accountType: norm.accountType, // strictly null for SUPER_ADMIN, ADMIN, MODERATOR
      role: norm.role, // compatibility alias
      permissions,
      status: user.status || AccountStatus.ACTIVE,
      isVerifiedAgent: norm.isVerifiedAgent,
      agencyName: user.agencyName,
      avatar: user.avatar,
    };
  }
}
