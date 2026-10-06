import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ required: true, index: true })
  action: string;

  @Prop({ required: true, index: true })
  actorUserId: string;

  @Prop({ required: true })
  actorName: string;

  @Prop({ required: true })
  actorRole: string;

  @Prop({ required: false, index: true })
  targetUserId?: string;

  @Prop({ required: false })
  targetUserName?: string;

  @Prop({ required: false })
  targetEntity?: string; // e.g. 'USER', 'PROPERTY', 'AGENT_VERIFICATION'

  @Prop({ required: false })
  targetEntityId?: string;

  @Prop({ type: Object, required: false })
  previousValue?: any;

  @Prop({ type: Object, required: false })
  newValue?: any;

  @Prop({ required: false })
  reason?: string;

  @Prop({ required: false })
  ipAddress?: string;

  @Prop({ required: false })
  userAgent?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ default: Date.now, index: true })
  timestamp: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Compound indexes for efficient governance querying
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ actorUserId: 1, timestamp: -1 });
AuditLogSchema.index({ targetUserId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
