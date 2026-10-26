import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type SubscriptionRequestDocument = SubscriptionRequest & Document;

export enum SubscriptionRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
}

export enum SubscriptionContactMethod {
  WHATSAPP = 'WHATSAPP',
  CALL = 'CALL',
}

@Schema({ timestamps: true, collection: 'subscription_requests' })
export class SubscriptionRequest {
  @Prop({ required: true, unique: true, index: true })
  requestReference: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true, index: true })
  userMobile: string;

  @Prop({ required: false })
  userEmail?: string;

  @Prop({ type: Types.ObjectId, ref: 'Package', required: true })
  packageId: Types.ObjectId;

  @Prop({ required: true })
  planName: string;

  @Prop({ required: true })
  planPrice: number;

  @Prop({ required: true })
  billingPeriod: string;

  @Prop({ type: [String], default: [] })
  planFeatures: string[];

  @Prop({
    required: true,
    enum: Object.values(SubscriptionContactMethod),
    default: SubscriptionContactMethod.WHATSAPP,
  })
  contactMethod: SubscriptionContactMethod;

  @Prop({
    required: true,
    enum: Object.values(SubscriptionRequestStatus),
    default: SubscriptionRequestStatus.PENDING,
    index: true,
  })
  status: SubscriptionRequestStatus;

  @Prop({ required: false })
  denialReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  reviewedBy?: Types.ObjectId;

  @Prop({ required: false })
  reviewedByName?: string;

  @Prop({ required: false })
  reviewedAt?: Date;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata: Record<string, any>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SubscriptionRequestSchema = SchemaFactory.createForClass(SubscriptionRequest);

SubscriptionRequestSchema.index({ userId: 1, status: 1 });
SubscriptionRequestSchema.index({ createdAt: -1 });
