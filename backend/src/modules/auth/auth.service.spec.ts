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
import { AgentProfile } from '../agents/schemas/agent-profile.schema';
import { UserRole, AccountStatus, OtpStatus, PlatformRole, AccountType } from './enums/auth.enums';

describe('AuthService (Security-First Unit & Integration Tests)', () => {
  let service: AuthService;
  let mockUserModel: any;
  let mockOtpChallengeModel: any;
  let mockRefreshSessionModel: any;
  let mockAgentProfileModel: any;
  let mockJwtService: any;
  let mockConfigService: any;
  let mockOtpProvider: any;

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
});
