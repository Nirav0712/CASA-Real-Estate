import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ _id: false })
export class ConversationPropertyContext {
  @Prop({ type: Types.ObjectId, ref: 'Property' })
  propertyId: Types.ObjectId;

  @Prop({ type: String })
  title: string;

  @Prop({ type: Number })
  price: number;

  @Prop({ type: String })
  image?: string;

  @Prop({ type: String })
  slug?: string;
}

@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation {
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  participants: Types.ObjectId[];

  @Prop({ type: ConversationPropertyContext, default: null })
  propertyContext?: ConversationPropertyContext;

  @Prop({ type: String, default: '' })
  lastMessage: string;

  @Prop({ type: Date, default: Date.now })
  lastMessageAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  lastSenderId?: Types.ObjectId;

  @Prop({ type: Map, of: Number, default: {} })
  unreadCounts: Map<string, number>;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.index({ participants: 1, lastMessageAt: -1 });
