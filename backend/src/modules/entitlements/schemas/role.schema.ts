import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PlatformRole, AccountType } from '../../auth/enums/auth.enums';
import { DataScope } from '../enums/permissions.enum';

export type RoleDocument = Role & Document;

@Schema({ _id: false })
export class DashboardConfig {
  @Prop({ default: true })
  overview: boolean;

  @Prop({ default: true })
  properties: boolean;

  @Prop({ default: true })
  leads: boolean;

  @Prop({ default: true })
  enquiries: boolean;

  @Prop({ default: true })
  chat: boolean;

  @Prop({ default: false })
  crm: boolean;

  @Prop({ default: true })
  siteVisits: boolean;

  @Prop({ default: true })
  analytics: boolean;

  @Prop({ default: true })
  reviews: boolean;

  @Prop({ default: false })
  promotions: boolean;

  @Prop({ default: true })
  profile: boolean;
}

@Schema({ timestamps: true, collection: 'roles' })
export class Role {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  slug: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true, enum: Object.values(PlatformRole), index: true })
  platformRole: PlatformRole;

  @Prop({
    type: String,
    enum: [...Object.values(AccountType), null],
    default: null,
    index: true,
  })
  accountType: AccountType | null;

  @Prop({ default: false, index: true })
  isSystemRole: boolean;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ required: true, enum: Object.values(DataScope), default: DataScope.OWN })
  dataScope: DataScope;

  @Prop({ type: String, default: null })
  packageId?: string | null;

  @Prop({ type: DashboardConfig, default: () => ({}) })
  dashboardConfig: DashboardConfig;

  @Prop({ default: 'SYSTEM' })
  createdBy: string;

  @Prop({ default: 'SYSTEM' })
  updatedBy: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

RoleSchema.index({ platformRole: 1, accountType: 1 });
RoleSchema.index({ isActive: 1, isSystemRole: 1 });
