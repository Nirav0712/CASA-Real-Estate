import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
  CustomDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
}

export const RATE_LIMIT_KEY = 'rate_limit_options';

export const RateLimit = (options: RateLimitOptions): CustomDecorator<string> =>
  SetMetadata(RATE_LIMIT_KEY, options);

interface RateLimitRecord {
  timestamps: number[];
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private static readonly store = new Map<string, RateLimitRecord>();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private reflector: Reflector) {
    if (!RateLimitGuard.cleanupInterval) {
      RateLimitGuard.cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, record] of RateLimitGuard.store.entries()) {
          record.timestamps = record.timestamps.filter((ts) => now - ts < 120000);
          if (record.timestamps.length === 0) {
            RateLimitGuard.store.delete(key);
          }
        }
      }, 60000);
      RateLimitGuard.cleanupInterval.unref();
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no explicit rate limit metadata is attached, permit by default
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.socket?.remoteAddress ||
      'unknown-client';

    const userId = (request as any).user?.id || (request as any).user?.sub;
    const prefix = options.keyPrefix || 'global';
    const storeKey = `${prefix}:${userId || ip}`;

    const now = Date.now();
    let record = RateLimitGuard.store.get(storeKey);

    if (!record) {
      record = { timestamps: [] };
      RateLimitGuard.store.set(storeKey, record);
    }

    // Filter out timestamps older than current window
    record.timestamps = record.timestamps.filter((ts) => now - ts < options.windowMs);

    const currentCount = record.timestamps.length;
    const remaining = Math.max(0, options.limit - currentCount);
    const resetTime = Math.ceil(
      (record.timestamps[0] ? record.timestamps[0] + options.windowMs - now : options.windowMs) / 1000,
    );

    if (response && response.setHeader) {
      response.setHeader('X-RateLimit-Limit', options.limit);
      response.setHeader('X-RateLimit-Remaining', remaining);
      response.setHeader('X-RateLimit-Reset', resetTime);
    }

    if (currentCount >= options.limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many requests. Please slow down and try again in ${resetTime} seconds.`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.timestamps.push(now);
    return true;
  }
}
