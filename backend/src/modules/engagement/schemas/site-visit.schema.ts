import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SiteVisitDocument = SiteVisit & Document;

export enum SiteVisitStatus {
  REQUESTED = 'REQUESTED',
  CONFIRMED = 'CONFIRMED',
  RESCHEDULED = 'RESCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true, collection: 'site_visits' })
export class SiteVisit {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  buyerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Property', required: true, index: true })
  propertyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  agentId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  preferredDate: Date;

  @Prop({ type: String, required: true })
  preferredTimeSlot: string;

  @Prop({ type: String, required: true })
  buyerName: string;

  @Prop({ type: String, required: true })
  buyerMobile: string;

  @Prop({ type: String, default: null })
  buyerEmail?: string;

  @Prop({ type: String, default: null })
  message?: string;

  @Prop({ type: String, enum: Object.values(SiteVisitStatus), default: SiteVisitStatus.REQUESTED, index: true })
  status: SiteVisitStatus;

  @Prop({ type: Date, default: null })
  rescheduledDate?: Date;

  @Prop({ type: String, default: null })
  rescheduledTimeSlot?: string;

  @Prop({ type: String, default: null })
  agentNotes?: string;

  @Prop({ type: String, default: null })
  cancellationReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'Lead', default: null })
  leadId?: Types.ObjectId;
}

export const SiteVisitSchema = SchemaFactory.createForClass(SiteVisit);

SiteVisitSchema.index({ buyerId: 1, createdAt: -1 });
SiteVisitSchema.index({ agentId: 1, status: 1, preferredDate: 1 });
SiteVisitSchema.index({ propertyId: 1, status: 1 });
