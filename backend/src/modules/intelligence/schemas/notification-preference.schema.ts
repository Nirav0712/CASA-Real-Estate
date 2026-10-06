import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NotificationPreferenceDocument = NotificationPreference & Document;

@Schema({ timestamps: true, collection: 'notification_preferences' })
export class NotificationPreference {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: string;

  @Prop({ default: true })
  newMatchingProperties: boolean;

  @Prop({ default: true })
  priceDropAlerts: boolean;

  @Prop({ default: true })
  leadUpdates: boolean;

  @Prop({ default: true })
  siteVisitReminders: boolean;

  @Prop({ default: true })
  chatMessages: boolean;

  @Prop({ default: true })
  promotionsAndBilling: boolean;

  @Prop({ default: true })
  emailChannel: boolean;

  @Prop({ default: true })
  inAppChannel: boolean;

  @Prop({ default: false })
  smsChannel: boolean;
}

export const NotificationPreferenceSchema = SchemaFactory.createForClass(NotificationPreference);
