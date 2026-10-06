import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  NEW_LEAD = 'NEW_LEAD',
  LEAD_ASSIGNED = 'LEAD_ASSIGNED',
  LEAD_UPDATED = 'LEAD_UPDATED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  PROPERTY_APPROVED = 'PROPERTY_APPROVED',
  PROPERTY_REJECTED = 'PROPERTY_REJECTED',
  PROPERTY_PUBLISHED = 'PROPERTY_PUBLISHED',
  SITE_VISIT_REQUESTED = 'SITE_VISIT_REQUESTED',
  SITE_VISIT_CONFIRMED = 'SITE_VISIT_CONFIRMED',
  SITE_VISIT_RESCHEDULED = 'SITE_VISIT_RESCHEDULED',
  SITE_VISIT_CANCELLED = 'SITE_VISIT_CANCELLED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SUBSCRIPTION_EXPIRING = 'SUBSCRIPTION_EXPIRING',
  SEARCH_ALERT = 'SEARCH_ALERT',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  REPORT_STATUS_UPDATED = 'REPORT_STATUS_UPDATED',
}

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  recipientId: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(NotificationType), required: true })
  type: NotificationType;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  data: Record<string, any>;

  @Prop({ type: Boolean, default: false, index: true })
  isRead: boolean;

  @Prop({ type: Date, default: null })
  readAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
