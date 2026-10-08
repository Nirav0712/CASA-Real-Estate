import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PlatformRole, AccountType, UserRole } from '../enums/auth.enums';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      throw new ForbiddenException('User authentication required before evaluating permissions.');
    }

    // 1. Super Admin has universal access
    if (user.platformRole === PlatformRole.SUPER_ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // 2. Check if requiredRoles match platformRole or accountType
    const hasRole = requiredRoles.some((reqRole) => {
      // Platform Role Matches (e.g. ADMIN, MODERATOR)
      if (user.platformRole && reqRole === user.platformRole) {
        return true;
      }

      // Marketplace User Account Type Matches
      if (user.platformRole === PlatformRole.USER && user.accountType) {
        if (reqRole === user.accountType) return true;
        if (reqRole === 'BUYER' && user.accountType === AccountType.BUYER) return true;
        if (reqRole === 'PURCHASER' && user.accountType === AccountType.BUYER) return true;
        if (reqRole === 'AGENT' && user.accountType === AccountType.AGENT) return true;
        if (reqRole === 'VERIFIED_AGENT' && user.accountType === AccountType.AGENT) return true;
      }

      // Compatibility fallback matching on user.role
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
        `Access denied. Role policy [platformRole: ${user.platformRole || 'USER'}, accountType: ${user.accountType || 'null'}] does not satisfy required authorization policy [${requiredRoles.join(', ')}].`,
      );
    }

    return true;
  }
}

