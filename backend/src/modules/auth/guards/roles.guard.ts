import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums/auth.enums';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
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

    // Super Admin has universal access
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Check if user has one of the required roles (including backward compatibility aliases)
    const hasRole = requiredRoles.some((reqRole) => {
      if (reqRole === user.role) return true;
      if (reqRole === UserRole.BUYER && user.role === UserRole.PURCHASER) return true;
      if (reqRole === UserRole.PURCHASER && user.role === UserRole.BUYER) return true;
      if (reqRole === UserRole.AGENT && user.role === UserRole.VERIFIED_AGENT) return true;
      return false;
    });

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Role "${user.role}" does not satisfy required authorization policy [${requiredRoles.join(', ')}].`,
      );
    }

    return true;
  }
}
