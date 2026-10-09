import * as crypto from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';

// Mock @nestjs/jwt for Jest CJS environment
jest.mock('@nestjs/jwt', () => {
  return {
    JwtService: class MockJwtService {
      signAsync = jest.fn().mockResolvedValue('mock_jwt_token_xyz');
      verifyAsync = jest.fn();
    },
  };
});
import { JwtService } from '@nestjs/jwt';
import { User } from './schemas/user.schema';
import { OtpChallenge } from './schemas/otp-challenge.schema';
import { RefreshSession } from './schemas/refresh-session.schema';
import { MockOtpProvider } from './providers/mock-otp.provider';
import { Msg91OtpProvider } from './providers/msg91-otp.provider';
import { MailService } from './services/mail.service';
import { AgentProfile } from '../agents/schemas/agent-profile.schema';
import { UserRole, AccountStatus, OtpStatus, PlatformRole, AccountType } from './enums/auth.enums';
import { hashPassword, hashToken } from './utils/password.util';
import { ConflictException } from '@nestjs/common';

describe('AuthService (Security-First Unit & Integration Tests)', () => {
  let service: AuthService;
  let mockUserModel: any;
  let mockOtpChallengeModel: any;
  let mockRefreshSessionModel: any;
  let mockAgentProfileModel: any;
  let mockJwtService: any;
  let mockConfigService: any;
  let mockOtpProvider: any;
  let mockMailService: any;

  beforeEach(async () => {
    mockUserModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    mockOtpChallengeModel = {
      findOne: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      create: jest.fn(),
    };

    mockRefreshSessionModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    mockAgentProfileModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      updateOne: jest.fn(),
      findOneAndUpdate: jest.fn().mockResolvedValue({}),
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('mock_jwt_token_xyz'),
      verifyAsync: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          nodeEnv: 'development',
          'auth.otpCooldownSeconds': 60,
          'auth.otpExpiresInMinutes': 5,
          'auth.otpMaxAttempts': 3,
          'auth.otpSecretSalt': 'test_otp_salt_secret',
          'auth.passwordResetExpiresMinutes': 60,
          'sms.provider': 'mock',
          'sms.enableMockSms': true,
          'jwt.accessSecret': 'test_access_secret',
          'jwt.refreshSecret': 'test_refresh_secret',
          'jwt.accessExpiresIn': '15m',
          'jwt.refreshExpiresIn': '7d',
        };
        return config[key];
      }),
    };

    mockOtpProvider = {
      name: 'mock',
      sendOtp: jest.fn().mockResolvedValue({ success: true, isMock: true, provider: 'mock' }),
    };

    mockMailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
      sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(OtpChallenge.name), useValue: mockOtpChallengeModel },
        { provide: getModelToken(RefreshSession.name), useValue: mockRefreshSessionModel },
        { provide: getModelToken(AgentProfile.name), useValue: mockAgentProfileModel },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MockOtpProvider, useValue: mockOtpProvider },
        { provide: Msg91OtpProvider, useValue: { name: 'msg91', sendOtp: jest.fn() } },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('1. should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Mobile Normalization', () => {
    it('should normalize Indian numbers with or without +91 prefix', () => {
      expect(service.normalizeMobile('9876543210')).toBe('+919876543210');
      expect(service.normalizeMobile('+91 98765 43210')).toBe('+919876543210');
      expect(service.normalizeMobile('919876543210')).toBe('+919876543210');
      expect(service.normalizeMobile('+971501234567')).toBe('+971501234567');
    });
  });

  describe('OTP Request & Cooldown Protection', () => {
    it('2. should generate and dispatch an OTP challenge successfully', async () => {
      mockOtpChallengeModel.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });
      mockOtpChallengeModel.create.mockResolvedValue({
        _id: 'challenge_123',
        normalizedMobile: '+919876543210',
        status: OtpStatus.PENDING,
      });

      const res = await service.requestOtp({ mobile: '9876543210' });

      expect(res.success).toBe(true);
      expect(res.normalizedMobile).toBe('+919876543210');
      expect(res.provider).toBe('mock');
      expect(mockOtpChallengeModel.create).toHaveBeenCalled();
    });

    it('3. should enforce cooldown when a recent OTP was dispatched within 60s', async () => {
      const recentChallenge = {
        lastSentAt: new Date(), // Sent just now
        status: OtpStatus.PENDING,
        resendCount: 0,
      };
      mockOtpChallengeModel.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(recentChallenge),
      });

      await expect(service.requestOtp({ mobile: '9876543210' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('OTP Verification & Security Enforcement', () => {
    it('4. should reject verification if no pending challenge exists', async () => {
      mockOtpChallengeModel.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.verifyOtp({ mobile: '9876543210', otp: '123456' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('5. should reject verification if OTP has expired', async () => {
      const expiredChallenge = {
        expiresAt: new Date(Date.now() - 60000), // Expired 1 min ago
        status: OtpStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };
      mockOtpChallengeModel.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(expiredChallenge),
      });

      await expect(
        service.verifyOtp({ mobile: '9876543210', otp: '123456' }),
      ).rejects.toThrow('Verification code has expired');
    });

    it('6. should reject and increment attempts on incorrect OTP', async () => {
      const validChallenge = {
        normalizedMobile: '+919876543210',
        otpHash: 'mismatched_hash_value',
        expiresAt: new Date(Date.now() + 300000),
        attempts: 0,
        maxAttempts: 3,
        status: OtpStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };
      mockOtpChallengeModel.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(validChallenge),
      });

      await expect(
        service.verifyOtp({ mobile: '9876543210', otp: '111111' }),
      ).rejects.toThrow('Incorrect verification code');
      expect(validChallenge.attempts).toBe(1);
    });

    it('7. should lock challenge when maximum attempts (3) are reached', async () => {
      const maxedChallenge = {
        normalizedMobile: '+919876543210',
        otpHash: 'some_hash',
        expiresAt: new Date(Date.now() + 300000),
        attempts: 2,
        maxAttempts: 3,
        status: OtpStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };
      mockOtpChallengeModel.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(maxedChallenge),
      });

      await expect(
        service.verifyOtp({ mobile: '9876543210', otp: '000000' }),
      ).rejects.toThrow('Maximum verification attempts exceeded');
      expect(maxedChallenge.status).toBe(OtpStatus.LOCKED);
    });
  });

  describe('Token Rotation & Session Management', () => {
    it('8. should refresh token cleanly and rotate session', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user_123',
        familyId: 'family_abc',
        sessionId: '507f1f77bcf86cd799439011',
      });

      const mockSession = {
        _id: '507f1f77bcf86cd799439011',
        familyId: 'family_abc',
        tokenHash: crypto.createHash('sha256').update('valid_refresh_token').digest('hex'),
        isRevoked: false,
        save: jest.fn().mockResolvedValue(true),
      };
      mockRefreshSessionModel.findOne.mockResolvedValue(mockSession);

      const mockUser = {
        _id: 'user_123',
        name: 'John Doe',
        mobile: '+919876543210',
        normalizedMobile: '+919876543210',
        role: UserRole.PURCHASER,
        status: AccountStatus.ACTIVE,
        isVerifiedAgent: false,
      };
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockRefreshSessionModel.create.mockResolvedValue({});

      const result = await service.refreshTokens('valid_refresh_token');

      expect(result.success).toBe(true);
      expect(mockSession.isRevoked).toBe(true); // Old session rotated/revoked
      expect(result.tokens.accessToken).toBe('mock_jwt_token_xyz');
    });

    it('9. should trigger reuse detection and revoke entire family on replay attack', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user_123',
        familyId: 'compromised_family_123',
        sessionId: '507f1f77bcf86cd799439011',
      });

      // Session is already marked revoked (Replay Attempt!)
      const revokedSession = {
        _id: '507f1f77bcf86cd799439011',
        familyId: 'compromised_family_123',
        isRevoked: true,
      };
      mockRefreshSessionModel.findOne.mockResolvedValue(revokedSession);

      await expect(service.refreshTokens('stolen_replayed_token')).rejects.toThrow(
        UnauthorizedException,
      );
      // Ensure all sessions in this family are revoked
      expect(mockRefreshSessionModel.updateMany).toHaveBeenCalledWith(
        { familyId: 'compromised_family_123' },
        expect.anything(),
      );
    });

    it('10. should terminate all active user sessions on logout-all', async () => {
      const result = await service.logoutAll('507f1f77bcf86cd799439011');
      expect(result.success).toBe(true);
      expect(mockRefreshSessionModel.updateMany).toHaveBeenCalled();
    });
  });

  describe('Mock Provider Production Hardening', () => {
    it('11. should strictly throw ForbiddenException if mock provider is invoked in production', async () => {
      const prodConfigService = {
        get: jest.fn((key: string) => (key === 'nodeEnv' ? 'production' : false)),
      };
      const provider = new MockOtpProvider(prodConfigService as any);

      await expect(
        provider.sendOtp({
          mobile: '9876543210',
          normalizedMobile: '+919876543210',
          otp: '123456',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Authoritative Role & AccountType Normalization', () => {
    it('12. should strictly normalize SUPER_ADMIN with accountType = null', () => {
      const normalized = (service as any).normalizeRoleModel({ role: UserRole.SUPER_ADMIN });
      expect(normalized.platformRole).toBe(PlatformRole.SUPER_ADMIN);
      expect(normalized.accountType).toBeNull();

      const sanitized = service.sanitizeUser({ _id: 'admin_1', mobile: '+919925843599', role: UserRole.SUPER_ADMIN });
      expect(sanitized.platformRole).toBe(PlatformRole.SUPER_ADMIN);
      expect(sanitized.accountType).toBeNull();
      expect(sanitized.permissions).toEqual(['*']);
    });

    it('13. should strictly normalize ADMIN with accountType = null', () => {
      const normalized = (service as any).normalizeRoleModel({ role: UserRole.ADMIN });
      expect(normalized.platformRole).toBe(PlatformRole.ADMIN);
      expect(normalized.accountType).toBeNull();
    });

    it('14. should strictly normalize MODERATOR with accountType = null', () => {
      const normalized = (service as any).normalizeRoleModel({ role: UserRole.MODERATOR });
      expect(normalized.platformRole).toBe(PlatformRole.MODERATOR);
      expect(normalized.accountType).toBeNull();
    });

    it('15. should normalize marketplace roles to platformRole=USER and respective accountType', () => {
      const agent = (service as any).normalizeRoleModel({ role: UserRole.AGENT });
      expect(agent.platformRole).toBe(PlatformRole.USER);
      expect(agent.accountType).toBe(AccountType.AGENT);

      const buyer = (service as any).normalizeRoleModel({ role: UserRole.BUYER });
      expect(buyer.platformRole).toBe(PlatformRole.USER);
      expect(buyer.accountType).toBe(AccountType.BUYER);

      const tenant = (service as any).normalizeRoleModel({ role: UserRole.TENANT });
      expect(tenant.platformRole).toBe(PlatformRole.USER);
      expect(tenant.accountType).toBe(AccountType.TENANT);

      const developer = (service as any).normalizeRoleModel({ role: UserRole.DEVELOPER });
      expect(developer.platformRole).toBe(PlatformRole.USER);
      expect(developer.accountType).toBe(AccountType.DEVELOPER);

      const broker = (service as any).normalizeRoleModel({ role: UserRole.BROKER });
      expect(broker.platformRole).toBe(PlatformRole.USER);
      expect(broker.accountType).toBe(AccountType.BROKER);

      const owner = (service as any).normalizeRoleModel({ role: UserRole.PROPERTY_OWNER });
      expect(owner.platformRole).toBe(PlatformRole.USER);
      expect(owner.accountType).toBe(AccountType.PROPERTY_OWNER);
    });

    it('16. should reject public registration attempts for SUPER_ADMIN or ADMIN roles', async () => {
      await expect(
        service.requestOtp({
          mobile: '9111122222',
          role: UserRole.SUPER_ADMIN,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.requestOtp({
          mobile: '9111122222',
          role: UserRole.ADMIN,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Step 2B: Email/Password Registration', () => {
    it('17. should successfully register a new user and send verification email', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue({
        _id: 'user_new_1',
        email: 'newuser@example.com',
        status: AccountStatus.PENDING_VERIFICATION,
        isEmailVerified: false,
      });

      const res = await service.register({
        fullName: 'New User',
        email: 'NewUser@example.com',
        mobile: '9876543210',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      expect(res.success).toBe(true);
      expect(res.email).toBe('newuser@example.com');
      expect(res.isEmailVerified).toBe(false);
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('18. should reject registration when passwords do not match', async () => {
      await expect(
        service.register({
          fullName: 'Test User',
          email: 'test@example.com',
          mobile: '9876543210',
          password: 'Password123!',
          confirmPassword: 'DifferentPassword123!',
        }),
      ).rejects.toThrow('Passwords do not match');
    });

    it('19. should reject registration with password shorter than 8 characters', async () => {
      await expect(
        service.register({
          fullName: 'Test User',
          email: 'test@example.com',
          mobile: '9876543210',
          password: 'short',
          confirmPassword: 'short',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('20. should reject duplicate registration with 409 Conflict if account is already registered', async () => {
      mockUserModel.findOne.mockResolvedValue({
        _id: 'existing_user_id',
        email: 'existing@example.com',
        passwordHash: 'some_mock_hashed_pass',
        isEmailVerified: true,
        status: AccountStatus.ACTIVE,
      });

      await expect(
        service.register({
          fullName: 'Existing User',
          email: 'existing@example.com',
          mobile: '9876543210',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('21. should reject public registration claiming administrative roles', async () => {
      await expect(
        service.register({
          fullName: 'Hacker',
          email: 'hacker@example.com',
          mobile: '9876543210',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          role: UserRole.SUPER_ADMIN,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Step 2B: Email/Password Login', () => {
    it('22. should authenticate user with valid email & password and issue tokens', async () => {
      const hashedPassword = await hashPassword('ValidPassword123!');
      const mockUser = {
        _id: 'user_login_1',
        name: 'Active User',
        email: 'loginuser@example.com',
        mobile: '+919876543210',
        normalizedMobile: '+919876543210',
        passwordHash: hashedPassword,
        isEmailVerified: true,
        status: AccountStatus.ACTIVE,
        role: UserRole.BUYER,
        platformRole: PlatformRole.USER,
        accountType: AccountType.BUYER,
        save: jest.fn().mockResolvedValue(true),
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const res = await service.login({
        email: 'LoginUser@example.com',
        password: 'ValidPassword123!',
      });

      expect(res.success).toBe(true);
      expect(res.tokens.accessToken).toBe('mock_jwt_token_xyz');
      expect(res.user.email).toBe('loginuser@example.com');
    });

    it('23. should reject login with invalid password using generic error', async () => {
      const hashedPassword = await hashPassword('CorrectPassword123!');
      const mockUser = {
        _id: 'user_login_1',
        email: 'user@example.com',
        passwordHash: hashedPassword,
        isEmailVerified: true,
        status: AccountStatus.ACTIVE,
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await expect(
        service.login({
          email: 'user@example.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('24. should reject login for unverified email accounts', async () => {
      const hashedPassword = await hashPassword('ValidPassword123!');
      const unverifiedUser = {
        _id: 'unverified_1',
        name: 'Unverified User',
        email: 'unverified@example.com',
        mobile: '+919876543210',
        normalizedMobile: '+919876543210',
        passwordHash: hashedPassword,
        isEmailVerified: false,
        status: AccountStatus.PENDING_VERIFICATION,
        role: UserRole.BUYER,
        platformRole: PlatformRole.USER,
        accountType: AccountType.BUYER,
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(unverifiedUser),
      });

      await expect(
        service.login({
          email: 'unverified@example.com',
          password: 'ValidPassword123!',
        }),
      ).rejects.toThrow('Please verify your email address before logging in');
    });

    it('25. should reject login for suspended accounts with ForbiddenException', async () => {
      const hashedPassword = await hashPassword('ValidPassword123!');
      const suspendedUser = {
        _id: 'suspended_1',
        email: 'suspended@example.com',
        passwordHash: hashedPassword,
        isEmailVerified: true,
        status: AccountStatus.SUSPENDED,
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(suspendedUser),
      });

      await expect(
        service.login({
          email: 'suspended@example.com',
          password: 'ValidPassword123!',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Step 2B: Email Verification & Resending', () => {
    it('26. should verify email successfully with valid token and activate pending user', async () => {
      const rawToken = 'test_valid_token_1234567890abcdef';
      const tokenHash = hashToken(rawToken);
      const pendingUser = {
        _id: 'pending_user_1',
        email: 'pending@example.com',
        isEmailVerified: false,
        status: AccountStatus.PENDING_VERIFICATION,
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: new Date(Date.now() + 3600000),
        save: jest.fn().mockResolvedValue(true),
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(pendingUser),
      });

      const res = await service.verifyEmail({
        email: 'pending@example.com',
        token: rawToken,
      });

      expect(res.success).toBe(true);
      expect(pendingUser.isEmailVerified).toBe(true);
      expect(pendingUser.status).toBe(AccountStatus.ACTIVE);
      expect(pendingUser.emailVerificationTokenHash).toBeUndefined();
    });

    it('27. should reject verification with expired token', async () => {
      const rawToken = 'test_token_expired';
      const tokenHash = hashToken(rawToken);
      const expiredUser = {
        email: 'expired@example.com',
        isEmailVerified: false,
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: new Date(Date.now() - 3600000), // Expired 1 hr ago
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(expiredUser),
      });

      await expect(
        service.verifyEmail({
          email: 'expired@example.com',
          token: rawToken,
        }),
      ).rejects.toThrow('Email verification link has expired');
    });

    it('28. should reject verification with mismatched token', async () => {
      const userWithToken = {
        email: 'user@example.com',
        isEmailVerified: false,
        emailVerificationTokenHash: hashToken('correct_token'),
        emailVerificationExpiresAt: new Date(Date.now() + 3600000),
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithToken),
      });

      await expect(
        service.verifyEmail({
          email: 'user@example.com',
          token: 'wrong_token',
        }),
      ).rejects.toThrow('Invalid or expired email verification link');
    });

    it('29. should return generic response on resend-verification for unverified account', async () => {
      const user = {
        email: 'user@example.com',
        name: 'User',
        isEmailVerified: false,
        status: AccountStatus.PENDING_VERIFICATION,
        save: jest.fn().mockResolvedValue(true),
      };
      mockUserModel.findOne.mockResolvedValue(user);

      const res = await service.resendVerification({ email: 'user@example.com' });

      expect(res.success).toBe(true);
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalled();
    });
  });

  describe('Step 2B: Forgot Password & Reset Password', () => {
    it('30. should dispatch reset email on forgotPassword request', async () => {
      const user = {
        _id: 'user_123',
        email: 'forgot@example.com',
        name: 'Forgot User',
        status: AccountStatus.ACTIVE,
        save: jest.fn().mockResolvedValue(true),
      };
      mockUserModel.findOne.mockResolvedValue(user);

      const res = await service.forgotPassword({ email: 'forgot@example.com' });

      expect(res.success).toBe(true);
      expect(user.save).toHaveBeenCalled();
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'forgot@example.com',
        'Forgot User',
        expect.any(String),
      );
    });

    it('31. should successfully reset password and revoke user sessions', async () => {
      const rawToken = 'reset_token_secret_12345678';
      const tokenHash = hashToken(rawToken);
      const user = {
        _id: '507f1f77bcf86cd799439011',
        email: 'resetme@example.com',
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: new Date(Date.now() + 1800000),
        isEmailVerified: true,
        status: AccountStatus.ACTIVE,
        save: jest.fn().mockResolvedValue(true),
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(user),
      });

      const res = await service.resetPassword({
        email: 'resetme@example.com',
        token: rawToken,
        newPassword: 'BrandNewSecurePassword123!',
        confirmPassword: 'BrandNewSecurePassword123!',
      });

      expect(res.success).toBe(true);
      expect(user.passwordResetTokenHash).toBeUndefined();
      expect(mockRefreshSessionModel.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ userId: expect.anything() }),
        expect.anything(),
      );
    });

    it('32. should reject resetPassword when passwords do not match', async () => {
      await expect(
        service.resetPassword({
          email: 'reset@example.com',
          token: 'some_token',
          newPassword: 'Password123!',
          confirmPassword: 'MismatchedPassword123!',
        }),
      ).rejects.toThrow('Passwords do not match');
    });

    it('33. should reject resetPassword with invalid or expired token', async () => {
      const user = {
        email: 'reset@example.com',
        passwordResetTokenHash: hashToken('valid_token'),
        passwordResetExpiresAt: new Date(Date.now() - 1000), // Expired
        save: jest.fn().mockResolvedValue(true),
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(user),
      });

      await expect(
        service.resetPassword({
          email: 'reset@example.com',
          token: 'valid_token',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow('Password reset link has expired');
    });

    it('34. should reset password successfully when email is omitted and found by token hash', async () => {
      const rawToken = 'token_only_reset_secret_abc123';
      const tokenHash = hashToken(rawToken);
      const user = {
        _id: '507f1f77bcf86cd799439012',
        email: 'tokenonly@example.com',
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: new Date(Date.now() + 1800000),
        isEmailVerified: true,
        status: AccountStatus.ACTIVE,
        save: jest.fn().mockResolvedValue(true),
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(user),
      });

      const res = await service.resetPassword({
        token: rawToken,
        newPassword: 'NewPasswordSecure123!',
        confirmPassword: 'NewPasswordSecure123!',
      });

      expect(res.success).toBe(true);
      expect(user.passwordResetTokenHash).toBeUndefined();
    });
  });
});
