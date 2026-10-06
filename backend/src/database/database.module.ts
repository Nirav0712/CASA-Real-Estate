import { Module, Global, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import mongoose, { Connection } from 'mongoose';

export const MONGO_CONNECTION = 'MONGO_CONNECTION';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        const uri =
          configService.get<string>('database.uri') ||
          'mongodb://127.0.0.1:27017/casa_real_estate';

        return {
          uri,
          serverSelectionTimeoutMS: 15000,
          connectTimeoutMS: 30000,
          socketTimeoutMS: 45000,
          heartbeatFrequencyMS: 10000,
          maxPoolSize: 20,
          minPoolSize: 2,
          lazyConnection: false,
          retryAttempts: 5,
          retryDelay: 3000,
          bufferCommands: true,
          autoIndex: false,
          connectionFactory: (connection: Connection) => {
            connection.on('connected', () => {
              logger.log('✅ MongoDB connection established successfully.');
            });
            connection.on('error', (err) => {
              logger.warn(
                `⚠️ MongoDB connection notice: ${err?.message || 'Database offline'}.`,
              );
            });
            return connection;
          },
        };
      },
    }),
  ],
  providers: [
    {
      provide: MONGO_CONNECTION,
      inject: [getConnectionToken()],
      useFactory: (connection: Connection) => connection,
    },
  ],
  exports: [MongooseModule, MONGO_CONNECTION],
})
export class DatabaseModule implements OnApplicationShutdown {
  async onApplicationShutdown() {
    await mongoose.disconnect();
  }
}
