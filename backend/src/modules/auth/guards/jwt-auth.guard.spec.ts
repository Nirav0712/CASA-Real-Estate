// Mock @nestjs/jwt for Jest CJS environment
jest.mock('@nestjs/jwt', () => {
  return {
    JwtService: class MockJwtService {
      signAsync = jest.fn().mockResolvedValue('mock_jwt_token_xyz');
      verifyAsync = jest.fn();
    },
  };
});

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserRole, AccountStatus } from '../enums/auth.enums';

describe('JwtAuthGuard (Authentication & Token Validation)', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as any;

    jwtService = new (JwtService as any)();

    configService = {
      get: jest.fn().mockReturnValue('test-jwt-access-secret'),
    } as any;

    guard = new JwtAuthGuard(reflector, jwtService, configService);
  });

  const createMockContext = (headers: Record<string, string> = {}, cookies: Record<string, string> = {}) => {
    const request: any = {
      headers,
      cookies,
      user: null,
    };

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;

    return { context, request };
  };

  it('should allow public endpoints without token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const { context } = createMockContext();

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException when token is missing in both header and cookies', async () => {
    const { context } = createMockContext();

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should authenticate successfully with valid Bearer Authorization header', async () => {
    const { context, request } = createMockContext({
      authorization: 'Bearer valid-jwt-token-123',
    });

    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'usr-agent-456',
      mobile: '+919925843599',
      normalizedMobile: '+919925843599',
      platformRole: 'USER',
      accountType: 'AGENT',
      role: UserRole.AGENT,
      status: AccountStatus.ACTIVE,
      isVerifiedAgent: true,
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(request.user).toBeDefined();
    expect(request.user.id).toBe('usr-agent-456');
    expect(request.user.platformRole).toBe('USER');
    expect(request.user.accountType).toBe('AGENT');
    expect(request.user.role).toBe(UserRole.AGENT);
  });

  it('should authenticate Super Admin with null accountType', async () => {
    const { context, request } = createMockContext({
      authorization: 'Bearer superadmin-jwt-token',
    });

    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'usr-superadmin-1',
      mobile: '+919925843599',
      normalizedMobile: '+919925843599',
      platformRole: 'SUPER_ADMIN',
      accountType: null,
      role: UserRole.SUPER_ADMIN,
      status: AccountStatus.ACTIVE,
      isVerifiedAgent: false,
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(request.user).toBeDefined();
    expect(request.user.id).toBe('usr-superadmin-1');
    expect(request.user.platformRole).toBe('SUPER_ADMIN');
    expect(request.user.accountType).toBeNull();
  });

  it('should authenticate successfully with valid access_token HttpOnly cookie', async () => {
    const { context, request } = createMockContext({}, {
      access_token: 'valid-cookie-token-789',
    });

    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'usr-owner-999',
      mobile: '+917359237870',
      normalizedMobile: '+917359237870',
      role: UserRole.PROPERTY_OWNER,
      status: AccountStatus.ACTIVE,
      isVerifiedAgent: false,
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(request.user).toBeDefined();
    expect(request.user.id).toBe('usr-owner-999');
    expect(request.user.platformRole).toBe('USER');
    expect(request.user.accountType).toBe('PROPERTY_OWNER');
    expect(request.user.role).toBe(UserRole.PROPERTY_OWNER);
  });

  it('should throw UnauthorizedException when token is invalid or expired', async () => {
    const { context } = createMockContext({
      authorization: 'Bearer invalid-or-expired-token',
    });

    (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('jwt expired'));

    await expect(guard.canActivate(context)).rejects.toThrow(
      'Invalid or expired authentication token. Please sign in again.',
    );
  });

  it('should throw UnauthorizedException when user account is suspended', async () => {
    const { context } = createMockContext({
      authorization: 'Bearer suspended-user-token',
    });

    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'usr-bad-123',
      mobile: '+919999999999',
      normalizedMobile: '+919999999999',
      role: UserRole.PROPERTY_OWNER,
      status: AccountStatus.SUSPENDED,
      isVerifiedAgent: false,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      'Your account has been suspended. Please contact support.',
    );
  });

  it('should throw UnauthorizedException when user account is deactivated', async () => {
    const { context } = createMockContext({
      authorization: 'Bearer deactivated-user-token',
    });

    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'usr-deactivated-123',
      mobile: '+919999999999',
      normalizedMobile: '+919999999999',
      role: UserRole.PROPERTY_OWNER,
      status: AccountStatus.DEACTIVATED,
      isVerifiedAgent: false,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      'Your account has been deactivated by the administrator.',
    );
  });

  it('should reject active token when database status is DEACTIVATED', async () => {
    const mockUserModel = {
      findOne: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: '507f1f77bcf86cd799439011',
            status: AccountStatus.DEACTIVATED,
            role: UserRole.BUYER,
          }),
        }),
      }),
    } as any;

    const guardWithDb = new JwtAuthGuard(reflector, jwtService, configService, mockUserModel);

    const { context } = createMockContext({
      authorization: 'Bearer previously-active-token',
    });

    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: '507f1f77bcf86cd799439011',
      mobile: '+919925843599',
      normalizedMobile: '+919925843599',
      role: UserRole.BUYER,
      status: AccountStatus.ACTIVE, // Token claims ACTIVE
    });

    await expect(guardWithDb.canActivate(context)).rejects.toThrow(
      'Your account has been deactivated by the administrator.',
    );
  });
});

