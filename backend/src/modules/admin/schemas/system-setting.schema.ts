import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SystemSettingDocument = SystemSetting & Document;

@Schema({ timestamps: true, collection: 'system_settings' })
export class SystemSetting {
  @Prop({ default: 'myproperty Marketplace' })
  appName: string;

  @Prop({ default: '+91 98765 43210' })
  companySalesNumber: string;

  @Prop({ default: '+91 98765 43211' })
  companyServiceNumber: string;

  @Prop({ default: 'sales@myproperty.com' })
  companySalesEmail: string;

  @Prop({ default: 'support@myproperty.com' })
  companySupportEmail: string;

  @Prop({ default: 'Vibhuti Khand, Gomti Nagar, Lucknow, Uttar Pradesh, 226010' })
  companyAddress: string;

  @Prop({ default: 3 })
  trialDays: number;

  @Prop({ default: 'msg91' })
  smsProvider: string;

  @Prop({ default: 'MYPROP' })
  smsSenderId: string;

  @Prop({ default: 5 })
  otpExpiryMinutes: number;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const SystemSettingSchema = SchemaFactory.createForClass(SystemSetting);
