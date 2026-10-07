import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, UserSchema } from './schemas/user.schema';
import { OtpChallenge, OtpChallengeSchema } from './schemas/otp-challenge.schema';
import { RefreshSession, RefreshSessionSchema } from './schemas/refresh-session.schema';
import { AgentProfile, AgentProfileSchema } from '../agents/schemas/agent-profile.schema';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MockOtpProvider } from './providers/mock-otp.provider';
import { Msg91OtpProvider } from './providers/msg91-otp.provider';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: OtpChallenge.name, schema: OtpChallengeSchema },
      { name: RefreshSession.name, schema: RefreshSessionSchema },
      { name: AgentProfile.name, schema: AgentProfileSchema },
    ]),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: (configService.get<string>('jwt.accessExpiresIn') || '15m') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    MockOtpProvider,
    Msg91OtpProvider,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    JwtModule,
    JwtAuthGuard,
    RolesGuard,
    MongooseModule,
  ],
})
export class AuthModule {}
