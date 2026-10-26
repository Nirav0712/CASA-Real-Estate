import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FeaturedPropertyRequestDocument = FeaturedPropertyRequest & Document;

export enum FeaturedRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

@Schema({ timestamps: true, collection: 'featured_property_requests' })
export class FeaturedPropertyRequest {
  @Prop({ required: true, unique: true, index: true })
  requestReference: string;

  @Prop({ required: true, index: true })
  brokerId: string;

  @Prop({ required: true, trim: true })
  brokerName: string;

  @Prop({ trim: true })
  brokerEmail?: string;

  @Prop({ trim: true })
  brokerMobile?: string;

  @Prop({ required: true, index: true })
  propertyId: string;

  @Prop({ required: true, trim: true })
  propertyTitle: string;

  @Prop({ trim: true })
  propertySlug?: string;

  @Prop({ default: 0 })
  propertyPrice?: number;

  @Prop({ trim: true })
  propertyLocation?: string;

  @Prop({ trim: true })
  propertyImage?: string;

  @Prop({ required: true, enum: [7, 15, 30, 60, 90], default: 30 })
  durationDays: number;

  @Prop({ required: true, default: () => new Date() })
  requestedStartDate: Date;

  @Prop({ required: true })
  requestedEndDate: Date;

  @Prop({ default: 0 })
  price: number;

  @Prop({ trim: true, default: 'Standard Featured Placement' })
  planName?: string;

  @Prop({ trim: true, default: '' })
  notes?: string;

  @Prop({
    type: String,
    enum: Object.values(FeaturedRequestStatus),
    default: FeaturedRequestStatus.PENDING,
    index: true,
  })
  status: FeaturedRequestStatus;

  @Prop({ trim: true })
  rejectionReason?: string;

  @Prop()
  approvedStartDate?: Date;

  @Prop()
  approvedEndDate?: Date;

  @Prop()
  approvedDurationDays?: number;

  @Prop()
  reviewedBy?: string;

  @Prop({ trim: true })
  reviewedByName?: string;

  @Prop()
  reviewedAt?: Date;
}

export const FeaturedPropertyRequestSchema = SchemaFactory.createForClass(FeaturedPropertyRequest);

FeaturedPropertyRequestSchema.index({ brokerId: 1, status: 1 });
FeaturedPropertyRequestSchema.index({ propertyId: 1, status: 1 });
FeaturedPropertyRequestSchema.index({ status: 1, requestedStartDate: 1 });
FeaturedPropertyRequestSchema.index({ status: 1, approvedEndDate: 1 });
FeaturedPropertyRequestSchema.index({ createdAt: -1 });
