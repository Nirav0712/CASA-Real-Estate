import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SubscriptionPlanDocument = SubscriptionPlan & Document;
export type UsageCounterDocument = UsageCounter & Document;

export enum MembershipTier {
  FREE = 'FREE',
  AGENT_BASIC = 'AGENT_BASIC',
  AGENT_PRO = 'AGENT_PRO',
  AGENCY = 'AGENCY',
  PREMIUM = 'PREMIUM',
}

@Schema({ timestamps: true, collection: 'subscription_plans' })
export class SubscriptionPlan {
  @Prop({ required: true, unique: true, index: true })
  code: string; // e.g. 'FREE', 'AGENT_BASIC', 'AGENT_PRO', 'AGENCY'

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: Object.values(MembershipTier), index: true })
  tier: MembershipTier;

  @Prop({ required: true })
  pricePerMonth: number; // in INR

  @Prop({ required: true, default: 30 })
  durationDays: number;

  @Prop({ type: Object, default: {} })
  features: {
    maxActiveListings: number;
    maxFeaturedListings: number;
    maxLeadsPerMonth: number;
    hasAdvancedAnalytics: boolean;
    hasPrioritySupport: boolean;
    hasTeamMembers: boolean;
    maxTeamMembers: number;
    hasCrmAutomation: boolean;
  };

  @Prop({ default: true })
  isActive: boolean;
}

export const SubscriptionPlanSchema = SchemaFactory.createForClass(SubscriptionPlan);

@Schema({ timestamps: true, collection: 'usage_counters' })
export class UsageCounter {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: string;

  @Prop({ required: true })
  periodMonth: string; // e.g. '2026-10'

  @Prop({ default: 0 })
  activeListingsCount: number;

  @Prop({ default: 0 })
  featuredListingsCount: number;

  @Prop({ default: 0 })
  leadsReceivedCount: number;

  @Prop({ default: 0 })
  promotionsUsedCount: number;
}

export const UsageCounterSchema = SchemaFactory.createForClass(UsageCounter);
UsageCounterSchema.index({ userId: 1, periodMonth: 1 }, { unique: true });
