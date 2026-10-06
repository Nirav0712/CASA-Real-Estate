import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AgentProfileDocument = AgentProfile & Document;

@Schema({ timestamps: true, collection: 'agent_profiles' })
export class AgentProfile {
  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({ required: true, unique: true, index: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ required: true, trim: true })
  displayName: string;

  @Prop({ trim: true })
  agencyName?: string;

  @Prop()
  agencyLogo?: string;

  @Prop()
  profileImage?: string;

  @Prop({ default: 'Real Estate Consultant' })
  professionalTitle?: string;

  @Prop()
  bio?: string;

  @Prop({ default: 1, min: 0 })
  experienceYears: number;

  @Prop({ required: true })
  phone: string;

  @Prop()
  email?: string;

  @Prop()
  website?: string;

  @Prop({ type: Object, default: {} })
  socialLinks?: {
    whatsapp?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };

  @Prop()
  officeAddress?: string;

  @Prop({ default: 'Uttar Pradesh' })
  state: string;

  @Prop({ default: 'Lucknow' })
  district: string;

  @Prop({ default: 'Lucknow' })
  city: string;

  @Prop()
  locality?: string;

  @Prop()
  pincode?: string;

  @Prop({ type: [String], default: [] })
  areasServed: string[];

  @Prop({ type: [String], default: [] })
  specializations: string[];

  @Prop({ type: [String], default: ['English', 'Hindi'] })
  languages: string[];

  // RERA Information
  @Prop({ index: true })
  reraNumber?: string;

  @Prop({ default: 'Uttar Pradesh' })
  reraState?: string;

  @Prop({ default: 'UP RERA' })
  reraAuthority?: string;

  @Prop({
    type: String,
    enum: ['NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'REJECTED'],
    default: 'NOT_SUBMITTED',
    index: true,
  })
  verificationStatus: string;

  @Prop({ default: false, index: true })
  isVerifiedAgent: boolean;

  @Prop()
  verifiedAt?: Date;

  @Prop()
  verifiedBy?: string;

  @Prop()
  verificationNotes?: string;

  @Prop({ type: [String], default: [] })
  rejectionReasons?: string[];
}

export const AgentProfileSchema = SchemaFactory.createForClass(AgentProfile);

AgentProfileSchema.index({ city: 1, isVerifiedAgent: 1 });
AgentProfileSchema.index({ verificationStatus: 1, createdAt: -1 });
