import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { MONGO_CONNECTION } from '../../database/database.module';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    private configService: ConfigService,
    @Inject(MONGO_CONNECTION) private connection: Connection,
  ) {}

  getHealth() {
    const isDbConnected = this.connection?.readyState === 1;
    const dbStatusMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const dbState = dbStatusMap[this.connection?.readyState] || 'disconnected';

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      environment: this.configService.get<string>('nodeEnv') || 'development',
      version: '1.0.0',
      database: {
        status: dbState,
        connected: isDbConnected,
      },
    };
  }
}
