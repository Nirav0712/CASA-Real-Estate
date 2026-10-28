import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Optional,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
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

/**
 * OptionalJwtAuthGuard:
 * Inspects Authorization header or cookie for JWT token.
 * If present and valid, populates request.user.
 * If absent or invalid, allows request to proceed as anonymous without throwing UnauthorizedException.
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Optional() @InjectModel(User.name) private readonly userModel?: Model<UserDocument>,
    @Optional() private readonly authService?: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      request.user = null;
      return true;
    }

    try {
      const accessSecret = this.configService.get<string>('jwt.accessSecret');
      const payload = await this.jwtService.verifyAsync<JwtAccessPayload>(token, {
        secret: accessSecret,
      });

      const userId = payload.userId || payload.sub;
      if (!userId) {
        request.user = null;
        return true;
      }

      let user: any = null;
      if (this.userModel) {
        try {
          const query = isValidObjectId(userId)
            ? { _id: userId }
            : { normalizedMobile: payload.normalizedMobile || userId };
          user = await this.userModel
            .findOne(query)
            .select(
              'status role platformRole accountType isVerifiedAgent permissions name mobile normalizedMobile isTrialActive trialStartedAt trialExpiresAt activePackageId kycStatus trialUsed trialExpired isTrialEligible brokerId parentUserId agencyId'
            )
            .lean();
        } catch {
          // Fallback
        }
      }

      if (!user && this.authService) {
        user =
          this.authService.getMemUserById(userId) ||
          (payload.normalizedMobile ? this.authService.getMemUserById(payload.normalizedMobile) : undefined);
      }

      if (user && user.status === AccountStatus.SUSPENDED) {
        request.user = null;
        return true;
      }

      const norm = normalizeUserRoleModel({
        platformRole: user?.platformRole || payload.platformRole || PlatformRole.USER,
        accountType: user?.accountType !== undefined ? user.accountType : payload.accountType,
        role: user?.role || payload.role || UserRole.BUYER,
        isVerifiedAgent: user?.isVerifiedAgent ?? payload.isVerifiedAgent,
      });

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
        isTrialActive: user?.isTrialActive ?? payload.isTrialActive,
        trialExpired: user?.trialExpired ?? payload.trialExpired,
        activePackageId: user?.activePackageId || payload.activePackageId,
        kycStatus: user?.kycStatus || payload.kycStatus,
      };

      request.user = authenticatedUser;
    } catch {
      // Invalid/expired token: gracefully treat as unauthenticated
      request.user = null;
    }

    return true;
  }

  private extractTokenFromRequest(request: any): string | null {
    const authHeader = request.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }

    if (request.cookies && request.cookies.access_token) {
      return request.cookies.access_token;
    }

    return null;
  }
}
