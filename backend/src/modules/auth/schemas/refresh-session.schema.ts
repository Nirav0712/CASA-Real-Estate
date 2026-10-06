import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RefreshSessionDocument = RefreshSession & Document;

@Schema({ timestamps: true, collection: 'refresh_sessions' })
export class RefreshSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  tokenHash: string;

  @Prop({ required: true, index: true })
  familyId: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  isRevoked: boolean;

  @Prop({ required: false })
  revokedAt?: Date;

  @Prop({ required: false })
  userAgent?: string;

  @Prop({ required: false })
  ipAddress?: string;
}

export const RefreshSessionSchema = SchemaFactory.createForClass(RefreshSession);

// Compound and TTL Indices
RefreshSessionSchema.index({ userId: 1, isRevoked: 1 });
RefreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic deletion on expiry
