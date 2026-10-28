import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  LeadStatus,
  LeadPriority,
  LeadSource,
  ActivityType,
  FollowUpType,
  FollowUpStatus,
} from '../enums/lead.enums';

export type LeadDocument = Lead & Document;

@Schema({ _id: false })
export class LeadNote {
  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  authorId: string;

  @Prop({ required: true })
  authorName: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

@Schema({ timestamps: true })
export class LeadActivity {
  @Prop({ default: () => new Types.ObjectId().toString() })
  _id: string;

  @Prop({ required: true })
  actorId: string;

  @Prop({ default: 'Agent' })
  actorName: string;

  @Prop({ default: 'AGENT' })
  actorRole: string;

  @Prop({
    type: String,
    enum: Object.values(ActivityType),
    required: true,
  })
  type: string;

  @Prop({ required: true })
  note: string;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;

  @Prop({ default: Date.now })
  createdAt: Date;
}

@Schema({ timestamps: true })
export class LeadFollowUp {
  @Prop({ default: () => new Types.ObjectId().toString() })
  _id: string;

  @Prop({ required: true })
  assignedTo: string;

  @Prop({ required: true })
  dueAt: Date;

  @Prop({
    type: String,
    enum: Object.values(FollowUpType),
    default: FollowUpType.CALL,
  })
  type: string;

  @Prop({ required: true })
  note: string;

  @Prop({
    type: String,
    enum: Object.values(FollowUpStatus),
    default: FollowUpStatus.PENDING,
    index: true,
  })
  status: string;

  @Prop()
  completedAt?: Date;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

@Schema({ timestamps: true, collection: 'leads' })
export class Lead {
  @Prop({ required: true, index: true })
  propertyId: string;

  @Prop({ index: true })
  propertyTitle?: string;

  @Prop({ index: true })
  propertySlug?: string;

  @Prop()
  propertyUrl?: string;

  @Prop()
  propertyImage?: string;

  @Prop()
  propertyPrice?: number;

  @Prop()
  propertyLocation?: string;

  @Prop()
  propertyAdvertiserName?: string;

  @Prop()
  propertyAdvertiserPhone?: string;

  @Prop()
  propertyAgencyName?: string;

  @Prop({ index: true })
  agentId?: string;

  @Prop({ index: true })
  assignedAgentId?: string;

  @Prop()
  assignedBy?: string;

  @Prop({ index: true })
  brokerId?: string;

  @Prop({ required: true, index: true })
  ownerId: string;

  @Prop({ index: true })
  purchaserId?: string;

  @Prop({ default: 'Interested Buyer', trim: true })
  name: string;

  @Prop({ trim: true })
  contactName?: string;

  @Prop({ default: 'Not Provided', trim: true })
  mobile: string;

  @Prop({ trim: true })
  contactPhone?: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true, lowercase: true })
  contactEmail?: string;

  @Prop({ trim: true })
  subject?: string;

  @Prop({ default: 'Inquiry for property' })
  message: string;

  @Prop({ type: Object })
  budget?: { min?: number; max?: number; currency?: string };

  @Prop({ trim: true })
  preferredLocation?: string;

  @Prop({
    type: String,
    enum: Object.values(LeadSource),
    default: LeadSource.PROPERTY_ENQUIRY,
    index: true,
  })
  source: string;

  @Prop({
    type: String,
    enum: Object.values(LeadStatus),
    default: LeadStatus.NEW,
    index: true,
  })
  status: string;

  @Prop({
    type: String,
    enum: Object.values(LeadPriority),
    default: LeadPriority.MEDIUM,
    index: true,
  })
  priority: string;

  @Prop({ type: [LeadNote], default: [] })
  notes: LeadNote[];

  @Prop({ type: [LeadActivity], default: [] })
  activities: LeadActivity[];

  @Prop({ type: [LeadFollowUp], default: [] })
  followUps: LeadFollowUp[];

  @Prop()
  assignedAt?: Date;

  @Prop()
  firstContactAt?: Date;

  @Prop()
  lastContactAt?: Date;

  @Prop({ index: true })
  nextFollowUpAt?: Date;

  @Prop()
  convertedAt?: Date;

  @Prop()
  lostAt?: Date;

  @Prop()
  lostReason?: string;

  @Prop({
    type: String,
    enum: ['PENDING', 'SENT', 'FAILED', 'MOCK_SENT', 'DISABLED'],
    default: 'PENDING',
    index: true,
  })
  whatsappStatus?: string;

  @Prop()
  whatsappError?: string;

  @Prop()
  whatsappSentAt?: Date;

  @Prop()
  whatsappDestinationNumber?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);

LeadSchema.index({ agentId: 1, createdAt: -1 });
LeadSchema.index({ assignedAgentId: 1, createdAt: -1 });
LeadSchema.index({ ownerId: 1, createdAt: -1 });
LeadSchema.index({ brokerId: 1, createdAt: -1 });
LeadSchema.index({ purchaserId: 1, createdAt: -1 });
LeadSchema.index({ propertyId: 1, createdAt: -1 });
LeadSchema.index({ agentId: 1, status: 1 });
LeadSchema.index({ assignedAgentId: 1, status: 1 });
LeadSchema.index({ brokerId: 1, status: 1 });
LeadSchema.index({ status: 1, nextFollowUpAt: 1 });
LeadSchema.index({ 'followUps.assignedTo': 1, 'followUps.status': 1, 'followUps.dueAt': 1 });
