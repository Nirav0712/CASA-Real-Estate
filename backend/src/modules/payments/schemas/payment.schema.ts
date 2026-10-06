import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PaymentStatus, PaymentPurpose, PaymentProviderType } from '../enums/payment.enums';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true, collection: 'payments' })
export class Payment {
  @Prop({ required: true, unique: true, index: true })
  orderId: string; // CASA internal order reference

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: false })
  userName?: string;

  @Prop({ required: false })
  userMobile?: string;

  @Prop({ required: true, enum: Object.values(PaymentProviderType), default: PaymentProviderType.RAZORPAY })
  provider: PaymentProviderType;

  @Prop({ required: true, index: true })
  providerOrderId: string;

  @Prop({ required: false, index: true, sparse: true })
  providerPaymentId?: string;

  @Prop({ required: false })
  providerSignature?: string;

  @Prop({ required: true })
  amount: number; // In INR

  @Prop({ required: true, default: 'INR' })
  currency: string;

  @Prop({
    required: true,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.CREATED,
    index: true,
  })
  status: PaymentStatus;

  @Prop({
    required: true,
    enum: Object.values(PaymentPurpose),
    index: true,
  })
  purpose: PaymentPurpose;

  @Prop({ required: false, index: true })
  referenceId?: string; // e.g. propertyId or subscription plan code

  @Prop({ required: false })
  productCode?: string;

  @Prop({ required: false })
  productName?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ required: false })
  paidAt?: Date;

  @Prop({ required: false })
  failedAt?: Date;

  @Prop({ required: false })
  refundedAt?: Date;

  @Prop({ required: false, default: 0 })
  refundAmount?: number;

  @Prop({ required: false })
  refundReason?: string;

  @Prop({ required: false })
  failureReason?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Compound indexes for queries & isolation
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ purpose: 1, referenceId: 1 });
PaymentSchema.index({ providerOrderId: 1, providerPaymentId: 1 });
