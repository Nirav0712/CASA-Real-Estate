import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AnalyticsEventDocument = AnalyticsEvent & Document;

@Schema({ timestamps: true })
export class AnalyticsEvent {
  @Prop({ required: true, index: true })
  eventType: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true, required: false })
  userId?: string;

  @Prop({ required: false, index: true })
  sessionId?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Property', index: true, required: false })
  propertyId?: string;

  @Prop({ type: Object, required: false })
  location?: {
    city?: string;
    locality?: string;
    state?: string;
  };

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;

  @Prop({ required: false })
  device?: string;

  @Prop({ required: false })
  referrer?: string;

  @Prop({ required: false })
  ipHash?: string;

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;
}

export const AnalyticsEventSchema = SchemaFactory.createForClass(AnalyticsEvent);

// Production indexes for high-throughput aggregation
AnalyticsEventSchema.index({ eventType: 1, createdAt: -1 });
AnalyticsEventSchema.index({ propertyId: 1, eventType: 1 });
AnalyticsEventSchema.index({ userId: 1, createdAt: -1 });
AnalyticsEventSchema.index({ createdAt: -1 });
AnalyticsEventSchema.index({ 'location.city': 1, eventType: 1 });
