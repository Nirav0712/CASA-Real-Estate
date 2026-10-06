import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { REQUEST_ID_HEADER } from '../middleware/correlation-id.middleware';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request as any)?.requestId || request.headers[REQUEST_ID_HEADER] || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected internal server error occurred';
    let errors: any = null;

    const isProduction = process.env.NODE_ENV === 'production';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = res.message || exception.message;
        if (res.errors) {
          errors = res.errors;
        } else if (Array.isArray(res.message)) {
          errors = res.message;
          message = 'Validation failed';
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `[${requestId}] Unhandled Exception: ${exception.message}`,
        exception.stack,
      );

      // In production, mask internal implementation error details to prevent information leakage
      if (isProduction) {
        message = 'An unexpected internal error occurred. Please contact support if the issue persists.';
      } else {
        message = exception.message;
      }
    } else {
      this.logger.error(`[${requestId}] Unknown Exception thrown: ${JSON.stringify(exception)}`);
      message = 'An unknown server error occurred.';
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      ...(errors && { errors }),
      path: request.url,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
