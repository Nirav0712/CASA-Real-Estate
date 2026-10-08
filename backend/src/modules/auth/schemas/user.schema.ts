import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PlatformRole, AccountType, AccountStatus, UserRole } from '../enums/auth.enums';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ default: 'CASA User', trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  mobile: string;

  @Prop({ required: true, unique: true, index: true, trim: true })
  normalizedMobile: string;

  @Prop({ required: false, trim: true, lowercase: true })
  email?: string;

  @Prop({
    type: String,
    enum: Object.values(PlatformRole),
    default: PlatformRole.USER,
    index: true,
  })
  platformRole: PlatformRole;

  @Prop({
    type: String,
    enum: Object.values(AccountType),
    default: null,
    required: false,
    index: true,
  })
  accountType: AccountType | null;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.BUYER,
    index: true,
  })
  role: UserRole;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({
    type: String,
    enum: Object.values(AccountStatus),
    default: AccountStatus.ACTIVE,
    index: true,
  })
  status: AccountStatus;

  @Prop({ default: false, index: true })
  isVerifiedAgent: boolean;

  @Prop({ required: false })
  avatar?: string;

  @Prop({ required: false })
  agencyName?: string;

  @Prop({ required: false })
  reraNumber?: string;

  @Prop({ default: Date.now })
  lastLoginAt: Date;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Compound indexes for role and status queries
UserSchema.index({ platformRole: 1, accountType: 1 });
UserSchema.index({ role: 1, status: 1 });

