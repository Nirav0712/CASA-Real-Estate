import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PropertyReportDocument = PropertyReport & Document;

export enum ReportReason {
  FAKE_PROPERTY = 'FAKE_PROPERTY',
  WRONG_PRICE = 'WRONG_PRICE',
  WRONG_LOCATION = 'WRONG_LOCATION',
  DUPLICATE = 'DUPLICATE',
  FRAUD = 'FRAUD',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  PROPERTY_NOT_AVAILABLE = 'PROPERTY_NOT_AVAILABLE',
  OTHER = 'OTHER',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true, collection: 'property_reports' })
export class PropertyReport {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  reporterId: Types.ObjectId;

  @Prop({ type: String, default: null })
  reporterName?: string;

  @Prop({ type: String, default: null })
  reporterMobile?: string;

  @Prop({ type: Types.ObjectId, ref: 'Property', required: true, index: true })
  propertyId: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(ReportReason), required: true })
  reason: ReportReason;

  @Prop({ type: String, required: true, trim: true })
  description: string;

  @Prop({ type: String, enum: Object.values(ReportStatus), default: ReportStatus.PENDING, index: true })
  status: ReportStatus;

  @Prop({ type: String, default: null })
  resolutionNotes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  resolvedBy?: Types.ObjectId;

  @Prop({ type: Date, default: null })
  resolvedAt?: Date;

  @Prop({ type: String, default: null })
  actionTaken?: string;
}

export const PropertyReportSchema = SchemaFactory.createForClass(PropertyReport);

PropertyReportSchema.index({ propertyId: 1, status: 1 });
PropertyReportSchema.index({ reporterId: 1, createdAt: -1 });
