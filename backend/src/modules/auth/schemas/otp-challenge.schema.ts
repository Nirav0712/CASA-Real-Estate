import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { OtpStatus } from '../enums/auth.enums';

export type OtpChallengeDocument = OtpChallenge & Document;

@Schema({ timestamps: true, collection: 'otp_challenges' })
export class OtpChallenge {
  @Prop({ required: true, index: true, trim: true })
  normalizedMobile: string;

  @Prop({ required: true })
  otpHash: string;

  @Prop({ required: true, index: true })
  expiresAt: Date;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: 3 })
  maxAttempts: number;

  @Prop({ default: 0 })
  resendCount: number;

  @Prop({
    type: String,
    enum: Object.values(OtpStatus),
    default: OtpStatus.PENDING,
    index: true,
  })
  status: OtpStatus;

  @Prop({ default: Date.now })
  lastSentAt: Date;

  @Prop({ required: false })
  ipAddress?: string;

  @Prop({ required: false })
  userAgent?: string;
}

export const OtpChallengeSchema = SchemaFactory.createForClass(OtpChallenge);

// Compound index for querying latest active challenge
OtpChallengeSchema.index({ normalizedMobile: 1, status: 1, createdAt: -1 });

// TTL index for automatic expiry after 24 hours
OtpChallengeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
