import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { EntitlementsService } from '../entitlements.service';
import { PlatformRole } from '../../auth/enums/auth.enums';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private entitlementsService: EntitlementsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication is required to perform this action.');
    }

    // Super Admin has unrestricted access
    if (user.platformRole === PlatformRole.SUPER_ADMIN || user.role === 'SUPER_ADMIN') {
      return true;
    }

    const entitlements = await this.entitlementsService.resolveUserEntitlements(user);
    const userPermissions = new Set(entitlements.permissions || []);

    const hasAll = requiredPermissions.every((perm) =>
      userPermissions.has(perm) || userPermissions.has('*') || perm.split(':').length > 1 && userPermissions.has(`${perm.split(':')[0]}:*`)
    );

    if (!hasAll) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}.`,
      );
    }

    // Attach resolved entitlements and data scope to request for controller scoping
    request.userEntitlements = entitlements;

    return true;
  }
}
