import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PlatformRole, AccountType, UserRole } from '../../modules/auth/enums/auth.enums';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Access denied: Role authentication required');
    }

    // 1. Super Admin universal access
    if (user.platformRole === PlatformRole.SUPER_ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // 2. Check if requiredRoles match platformRole or accountType
    const hasRole = requiredRoles.some((reqRole) => {
      if (user.platformRole && reqRole === user.platformRole) {
        return true;
      }
      if (user.platformRole === PlatformRole.USER && user.accountType) {
        if (reqRole === user.accountType) return true;
        if (reqRole === 'BUYER' && user.accountType === AccountType.BUYER) return true;
        if (reqRole === 'PURCHASER' && user.accountType === AccountType.BUYER) return true;
        if (reqRole === 'AGENT' && user.accountType === AccountType.AGENT) return true;
        if (reqRole === 'VERIFIED_AGENT' && user.accountType === AccountType.AGENT) return true;
      }
      if (user.role && reqRole === user.role) {
        const isPlatformReq = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(reqRole);
        if (isPlatformReq) {
          return user.platformRole === (reqRole as any);
        }
        return true;
      }
      return false;
    });

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: Insufficient permissions for role [platformRole: ${user.platformRole || 'USER'}, accountType: ${user.accountType || 'null'}]`,
      );
    }

    return true;
  }
}

