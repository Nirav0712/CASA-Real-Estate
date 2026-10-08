import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { EntitlementsService } from '../entitlements.service';
import { Permission, DataScope } from '../enums/permissions.enum';
import { PlatformRole, AccountType } from '../../auth/enums/auth.enums';

describe('PermissionsGuard & Lead Authorization Policy', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let entitlementsService: EntitlementsService;

  const mockEntitlementsService = {
    resolveUserEntitlements: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: EntitlementsService,
          useValue: mockEntitlementsService,
        },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get<Reflector>(Reflector);
    entitlementsService = module.get<EntitlementsService>(EntitlementsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function createMockContext(user: any, requiredPermissions: string[]): ExecutionContext {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredPermissions);

    const request: any = { user };
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  it('1. QA Test Agent + lead:view OFF → lead API throws 403 Forbidden', async () => {
    const qaTargetUser = {
      id: 'qa-test-agent-id',
      customRoleId: 'custom-role-qa-agent',
      accountType: AccountType.AGENT,
      platformRole: PlatformRole.USER,
    };

    mockEntitlementsService.resolveUserEntitlements.mockResolvedValue({
      platformRole: PlatformRole.USER,
      accountType: AccountType.AGENT,
      dataScope: DataScope.OWN,
      permissions: [
        Permission.PROPERTY_VIEW,
        Permission.PROPERTY_CREATE,
        // lead:view is OFF / missing
      ],
      dashboardConfig: { overview: true, properties: true, leads: false },
    });

    const context = createMockContext(qaTargetUser, [Permission.LEAD_VIEW]);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow(/Insufficient permissions/);
  });

  it('2. QA Test Agent + lead:view ON → lead API returns true (allowed)', async () => {
    const qaTargetUser = {
      id: 'qa-test-agent-id',
      customRoleId: 'custom-role-qa-agent-enabled',
      accountType: AccountType.AGENT,
      platformRole: PlatformRole.USER,
    };

    mockEntitlementsService.resolveUserEntitlements.mockResolvedValue({
      platformRole: PlatformRole.USER,
      accountType: AccountType.AGENT,
      dataScope: DataScope.OWN,
      permissions: [
        Permission.PROPERTY_VIEW,
        Permission.PROPERTY_CREATE,
        Permission.LEAD_VIEW,
        Permission.LEAD_EDIT,
      ],
      dashboardConfig: { overview: true, properties: true, leads: true },
    });

    const context = createMockContext(qaTargetUser, [Permission.LEAD_VIEW]);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('3. Standard Agent role remains fully functional with lead:view', async () => {
    const standardAgentUser = {
      id: 'standard-agent-id',
      accountType: AccountType.AGENT,
      platformRole: PlatformRole.USER,
    };

    mockEntitlementsService.resolveUserEntitlements.mockResolvedValue({
      platformRole: PlatformRole.USER,
      accountType: AccountType.AGENT,
      dataScope: DataScope.OWN,
      permissions: [
        Permission.PROPERTY_VIEW,
        Permission.PROPERTY_CREATE,
        Permission.PROPERTY_EDIT,
        Permission.LEAD_VIEW,
        Permission.LEAD_CREATE,
        Permission.LEAD_EDIT,
        Permission.CRM_VIEW,
        Permission.CHAT_VIEW,
      ],
      dashboardConfig: { overview: true, properties: true, leads: true, crm: true, chat: true },
    });

    const context = createMockContext(standardAgentUser, [Permission.LEAD_VIEW]);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('4. Admin / Super Admin remains functional with wildcard access', async () => {
    const superAdminUser = {
      id: 'super-admin-id',
      platformRole: PlatformRole.SUPER_ADMIN,
      role: 'SUPER_ADMIN',
    };

    const context = createMockContext(superAdminUser, [Permission.LEAD_VIEW, Permission.LEAD_EDIT]);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    // Unrestricted super admin does not need entitlements service call
    expect(mockEntitlementsService.resolveUserEntitlements).not.toHaveBeenCalled();
  });

  it('5. Unauthenticated request throws UnauthorizedException', async () => {
    const context = createMockContext(null, [Permission.LEAD_VIEW]);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
