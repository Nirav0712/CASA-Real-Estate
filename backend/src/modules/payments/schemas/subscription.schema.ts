import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SubscriptionPlan, SubscriptionStatus } from '../enums/payment.enums';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true, collection: 'subscriptions' })
export class Subscription {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, enum: Object.values(SubscriptionPlan), default: SubscriptionPlan.FREE })
  plan: SubscriptionPlan;

  @Prop({ required: true, enum: Object.values(SubscriptionStatus), default: SubscriptionStatus.ACTIVE, index: true })
  status: SubscriptionStatus;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: false })
  paymentId?: string;

  @Prop({ required: false })
  orderId?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ endDate: 1, status: 1 });
