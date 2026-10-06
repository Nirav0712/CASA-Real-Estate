import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PropertyPromotionDocument = PropertyPromotion & Document;
export type PromotionPlanDocument = PromotionPlan & Document;

export enum PromotionType {
  FEATURED = 'FEATURED',
  BOOST = 'BOOST',
  TOP_SEARCH = 'TOP_SEARCH',
  HOMEPAGE_FEATURED = 'HOMEPAGE_FEATURED',
  LOCATION_FEATURED = 'LOCATION_FEATURED',
}

export enum PromotionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true, collection: 'promotion_plans' })
export class PromotionPlan {
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: Object.values(PromotionType) })
  type: PromotionType;

  @Prop({ required: true })
  durationDays: number;

  @Prop({ required: true })
  priceAmount: number; // in INR

  @Prop({ default: 'INR' })
  currency: string;

  @Prop({ default: 1 })
  priorityWeight: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const PromotionPlanSchema = SchemaFactory.createForClass(PromotionPlan);

@Schema({ timestamps: true, collection: 'property_promotions' })
export class PropertyPromotion {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Property', required: true, index: true })
  propertyId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: string;

  @Prop({ required: true, enum: Object.values(PromotionType), index: true })
  type: PromotionType;

  @Prop({ required: true })
  planCode: string;

  @Prop({ required: true, enum: Object.values(PromotionStatus), default: PromotionStatus.ACTIVE, index: true })
  status: PromotionStatus;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true, index: true })
  endDate: Date;

  @Prop({ default: 1 })
  priorityWeight: number;

  @Prop({ required: false })
  paymentId?: string;

  @Prop({ required: false })
  amountPaid?: number;
}

export const PropertyPromotionSchema = SchemaFactory.createForClass(PropertyPromotion);

PropertyPromotionSchema.index({ propertyId: 1, status: 1 });
PropertyPromotionSchema.index({ status: 1, endDate: 1 });
PropertyPromotionSchema.index({ userId: 1, createdAt: -1 });
