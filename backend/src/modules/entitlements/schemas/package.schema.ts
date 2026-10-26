import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PackageDocument = Package & Document;

export enum BillingPeriod {
  FREE = 'FREE',
  ONE_MONTH = '1_MONTH',
  SIXTY_DAYS = '60_DAYS',
  NINETY_DAYS = '90_DAYS',
  SIX_MONTHS = '6_MONTHS',
  ONE_YEAR = '1_YEAR',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

@Schema({ _id: false })
export class PackageLimits {
  @Prop({ default: 10 })
  propertyViews: number; // -1 for unlimited

  @Prop({ default: 0 })
  propertyListings: number; // -1 for unlimited

  @Prop({ default: 0 })
  projectListings: number; // -1 for unlimited

  @Prop({ default: 10 })
  savedProperties: number; // -1 for unlimited

  @Prop({ default: 5 })
  savedSearches: number; // -1 for unlimited

  @Prop({ default: 10 })
  monthlyLeads: number; // -1 for unlimited

  @Prop({ default: 10 })
  enquiries: number; // -1 for unlimited

  @Prop({ default: 20 })
  chats: number; // -1 for unlimited

  @Prop({ default: 1 })
  teamMembers: number;
}

@Schema({ _id: false })
export class PackageDurationPrice {
  @Prop({ required: true })
  durationMonths: number; // 1, 2, 3, 6, 12

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'INR' })
  currency: string;

  @Prop()
  referenceMonthlyPrice?: number;

  @Prop({ default: true })
  isActive: boolean;
}

@Schema({ timestamps: true, collection: 'packages' })
export class Package {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  slug: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: [String], default: [] })
  targetAccountTypes: string[];

  @Prop({ type: [String], default: [] })
  eligibleUserTypes: string[]; // BUILDER, DEVELOPER, BROKER, AGENT, PROPERTY_OWNER, BUYER, TENANT

  @Prop({ required: true, default: 0 })
  price: number;

  @Prop({ default: 'INR' })
  currency: string;

  @Prop({ required: true, enum: Object.values(BillingPeriod), default: BillingPeriod.FREE })
  billingPeriod: BillingPeriod;

  @Prop({ default: 30 })
  durationDays: number;

  @Prop({ type: [PackageDurationPrice], default: [] })
  durationPrices: PackageDurationPrice[];

  @Prop({ default: false, index: true })
  isFree: boolean;

  @Prop({ default: false, index: true })
  recommended: boolean;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: 50 })
  freeTrialMaxSlots: number;

  @Prop({ default: 0 })
  freeTrialClaimedSlots: number;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: false, index: true })
  isDefault: boolean;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ default: '', trim: true })
  whatsappNumber?: string;

  @Prop({ default: '', trim: true })
  callNumber?: string;

  @Prop({ type: PackageLimits, default: () => ({}) })
  limits: PackageLimits;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ default: 'SYSTEM' })
  createdBy: string;

  @Prop({ default: 'SYSTEM' })
  updatedBy: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PackageSchema = SchemaFactory.createForClass(Package);

PackageSchema.index({ isActive: 1, isDefault: 1 });
PackageSchema.index({ targetAccountTypes: 1, isActive: 1 });
