import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtAccessPayload, AuthenticatedUser } from '../interfaces/jwt-payload.interface';
import { AccountStatus, normalizeUserRoleModel } from '../enums/auth.enums';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing. Please sign in.');
    }

    try {
      const accessSecret = this.configService.get<string>('jwt.accessSecret');
      const payload = await this.jwtService.verifyAsync<JwtAccessPayload>(token, {
        secret: accessSecret,
      });

      if (payload.status === AccountStatus.SUSPENDED) {
        throw new UnauthorizedException('Your account has been suspended. Please contact support.');
      }

      if (payload.status === AccountStatus.DEACTIVATED) {
        throw new UnauthorizedException('Your account is deactivated.');
      }

      const norm = normalizeUserRoleModel({
        role: payload.role,
        platformRole: payload.platformRole,
        accountType: payload.accountType,
        isVerifiedAgent: payload.isVerifiedAgent,
      });

      const authenticatedUser: AuthenticatedUser = {
        id: payload.userId || payload.sub,
        name: '', // Populated by service when required
        mobile: payload.mobile,
        normalizedMobile: payload.normalizedMobile,
        platformRole: norm.platformRole,
        accountType: norm.accountType,
        role: norm.role,
        permissions: payload.permissions || [],
        status: payload.status,
        isVerifiedAgent: norm.isVerifiedAgent,
      };

      request.user = authenticatedUser;
      return true;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired authentication token. Please sign in again.');
    }
  }

  private extractTokenFromRequest(request: any): string | null {
    // 1. Check Bearer Authorization Header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }

    // 2. Check HttpOnly access_token cookie
    if (request.cookies && request.cookies.access_token) {
      return request.cookies.access_token;
    }

    return null;
  }
}
