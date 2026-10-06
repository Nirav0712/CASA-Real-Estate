import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { REQUEST_ID_HEADER } from '../middleware/correlation-id.middleware';

export interface ResponseEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  requestId?: string;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseEnvelope<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseEnvelope<T>> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse();
    const requestId = (req as any)?.requestId || req?.headers?.[REQUEST_ID_HEADER];

    return next.handle().pipe(
      map((data) => {
        // If the handler already returned an envelope or raw data
        if (data && typeof data === 'object' && 'success' in data) {
          if (!data.requestId && requestId) {
            data.requestId = requestId;
          }
          return data;
        }
        return {
          success: true,
          statusCode: res.statusCode,
          message: 'Request processed successfully',
          data: data ?? null,
          requestId: requestId || undefined,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
