import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true, collection: 'messages' })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  senderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  recipientId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  content: string;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;

  @Prop({ type: Date, default: null })
  readAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ recipientId: 1, isRead: 1 });
