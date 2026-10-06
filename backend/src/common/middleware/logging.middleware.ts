import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { REQUEST_ID_HEADER } from './correlation-id.middleware';

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl } = req;
    const requestId = (req as any).requestId || req.headers[REQUEST_ID_HEADER] || 'unknown';

    // Log response on finish
    res.on('finish', () => {
      const durationMs = Date.now() - startTime;
      const { statusCode } = res;

      // Avoid spamming health check logs in local development
      if (originalUrl === '/health' || originalUrl === '/api/v1/health') {
        return;
      }

      const logMsg = `[${requestId}] ${method} ${originalUrl} ${statusCode} - ${durationMs}ms`;

      if (statusCode >= 500) {
        this.logger.error(logMsg);
      } else if (statusCode >= 400) {
        this.logger.warn(logMsg);
      } else {
        this.logger.log(logMsg);
      }
    });

    next();
  }
}
