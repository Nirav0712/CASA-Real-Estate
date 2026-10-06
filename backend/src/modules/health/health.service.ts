import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { MONGO_CONNECTION } from '../../database/database.module';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private configService: ConfigService,
    @Inject(MONGO_CONNECTION) private connection: Connection,
  ) {}

  async getHealth() {
    const isDbConnected = this.connection?.readyState === 1;
    const dbStatusMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const dbState = dbStatusMap[this.connection?.readyState] || 'disconnected';

    let dbLatencyMs: number | null = null;
    if (isDbConnected && this.connection?.db) {
      try {
        const pingStart = Date.now();
        await this.connection.db.admin().ping();
        dbLatencyMs = Date.now() - pingStart;
      } catch (err: any) {
        this.logger.warn(`Database ping check failed: ${err?.message}`);
      }
    }

    const memoryUsage = process.memoryUsage();
    const toMB = (bytes: number) => Math.round((bytes / 1024 / 1024) * 100) / 100;

    const overallStatus = isDbConnected ? 'ok' : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      environment: this.configService.get<string>('nodeEnv') || 'development',
      version: '1.0.0',
      database: {
        status: dbState,
        connected: isDbConnected,
        latencyMs: dbLatencyMs,
      },
      memory: {
        rssMB: toMB(memoryUsage.rss),
        heapUsedMB: toMB(memoryUsage.heapUsed),
        heapTotalMB: toMB(memoryUsage.heapTotal),
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
      },
    };
  }
}
