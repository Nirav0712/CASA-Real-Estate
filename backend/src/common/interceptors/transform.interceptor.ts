import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
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
    const res = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data) => {
        // If the handler already returned an envelope or raw data
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }
        return {
          success: true,
          statusCode: res.statusCode,
          message: 'Request processed successfully',
          data: data ?? null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
