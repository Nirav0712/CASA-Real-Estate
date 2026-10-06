import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type RiskFlagDocument = RiskFlag & Document;

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum RiskStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

@Schema({ timestamps: true })
export class RiskFlag {
  @Prop({ required: true, enum: ['PROPERTY', 'AGENT', 'USER', 'REVIEW'], index: true })
  targetType: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  targetId: string;

  @Prop({ required: true, enum: RiskLevel, default: RiskLevel.LOW, index: true })
  riskLevel: RiskLevel;

  @Prop({ required: true, index: true })
  flagReason: string;

  @Prop({ type: Object, default: {} })
  details: Record<string, any>;

  @Prop({ required: true, enum: RiskStatus, default: RiskStatus.OPEN, index: true })
  status: RiskStatus;

  @Prop({ required: false })
  actionTaken?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  reviewedBy?: string;

  @Prop({ type: Date })
  reviewedAt?: Date;

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const RiskFlagSchema = SchemaFactory.createForClass(RiskFlag);

RiskFlagSchema.index({ targetType: 1, targetId: 1, status: 1 });
RiskFlagSchema.index({ riskLevel: 1, status: 1 });
RiskFlagSchema.index({ createdAt: -1 });
