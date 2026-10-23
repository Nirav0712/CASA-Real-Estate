import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtAccessPayload, AuthenticatedUser } from '../interfaces/jwt-payload.interface';
import {
  AccountStatus,
  AccountType,
  PlatformRole,
  UserRole,
  normalizeUserRoleModel,
} from '../enums/auth.enums';
import { User, UserDocument } from '../schemas/user.schema';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Optional() @InjectModel(User.name) private readonly userModel?: Model<UserDocument>,
    @Optional() private readonly authService?: AuthService,
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

      const userId = payload.userId || payload.sub;
      if (!userId) {
        throw new UnauthorizedException('Authentication token is invalid.');
      }

      // Live verification of account status directly from database/store
      let user: any = null;
      if (this.userModel) {
        try {
          const query = isValidObjectId(userId)
            ? { _id: userId }
            : { normalizedMobile: payload.normalizedMobile || userId };
          user = await this.userModel
            .findOne(query)
            .select(
              'status role platformRole accountType isVerifiedAgent permissions name mobile normalizedMobile isTrialActive trialStartedAt trialExpiresAt activePackageId kycStatus trialUsed trialExpired isTrialEligible'
            )
            .lean();
        } catch {
          // Fallback to in-memory store if DB query fails
        }
      }

      if (!user && this.authService) {
        user =
          this.authService.getMemUserById(userId) ||
          (payload.normalizedMobile ? this.authService.getMemUserById(payload.normalizedMobile) : undefined);
      }

      if (user) {
        if (user.status === AccountStatus.SUSPENDED) {
          throw new UnauthorizedException('Your account has been suspended. Please contact support.');
        }

        if (user.status === AccountStatus.DEACTIVATED) {
          throw new UnauthorizedException('Your account has been deactivated by the administrator.');
        }
      } else {
        // Fallback for isolated unit tests without injected user model
        if (payload.status === AccountStatus.SUSPENDED) {
          throw new UnauthorizedException('Your account has been suspended. Please contact support.');
        }

        if (payload.status === AccountStatus.DEACTIVATED) {
          throw new UnauthorizedException('Your account has been deactivated by the administrator.');
        }
      }

      const norm = normalizeUserRoleModel({
        role: user?.role || payload.role,
        platformRole: user?.platformRole || payload.platformRole,
        accountType: user?.accountType || payload.accountType,
        isVerifiedAgent: user?.isVerifiedAgent ?? payload.isVerifiedAgent,
      });

      // Requirement 1 & 2: Trial expiry session termination
      // Buyer and Tenant accounts must NEVER require KYC or free trial, and must not have trial restrictions applied.
      const isConsumerAccount =
        norm.accountType === AccountType.BUYER ||
        norm.accountType === AccountType.TENANT ||
        norm.role === UserRole.BUYER ||
        norm.role === UserRole.TENANT ||
        norm.role === UserRole.PURCHASER;

      const isPlatformAdmin =
        norm.platformRole === PlatformRole.SUPER_ADMIN ||
        norm.platformRole === PlatformRole.ADMIN ||
        norm.platformRole === PlatformRole.MODERATOR;

      let isTrialActive = Boolean(user?.isTrialActive ?? payload.isTrialActive);
      let trialExpired = Boolean(user?.trialExpired ?? payload.trialExpired);

      if (!isConsumerAccount && !isPlatformAdmin && user) {
        const hasActivePackage = Boolean(user.activePackageId);
        const hasExpiredTrial = Boolean(
          user.trialExpiresAt && new Date() > new Date(user.trialExpiresAt)
        );

        if (hasExpiredTrial && !hasActivePackage) {
          isTrialActive = false;
          trialExpired = true;
          if (this.userModel && user.isTrialActive) {
            try {
              await this.userModel.updateOne(
                { _id: user._id },
                { $set: { isTrialActive: false, trialExpired: true } }
              );
            } catch {}
          }
        }
      }

      const authenticatedUser: AuthenticatedUser = {
        id: (user as any)?._id ? (user as any)._id.toString() : userId,
        name: user?.name || '',
        mobile: user?.mobile || payload.mobile,
        normalizedMobile: user?.normalizedMobile || payload.normalizedMobile,
        platformRole: norm.platformRole,
        accountType: norm.accountType,
        role: norm.role,
        permissions:
          user?.permissions && user.permissions.length > 0
            ? user.permissions
            : payload.permissions || [],
        status: user?.status || payload.status,
        isVerifiedAgent: norm.isVerifiedAgent,
        isTrialActive,
        trialExpired,
        activePackageId: user?.activePackageId || payload.activePackageId,
        kycStatus: user?.kycStatus || payload.kycStatus,
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
