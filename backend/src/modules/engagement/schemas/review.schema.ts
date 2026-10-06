import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

export enum ReviewTargetType {
  AGENT = 'AGENT',
  PROPERTY = 'PROPERTY',
}

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  HIDDEN = 'HIDDEN',
}

@Schema({ timestamps: true, collection: 'reviews' })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorId: Types.ObjectId;

  @Prop({ type: String, required: true })
  authorName: string;

  @Prop({ type: String, default: null })
  authorAvatar?: string;

  @Prop({ type: String, enum: Object.values(ReviewTargetType), required: true, index: true })
  targetType: ReviewTargetType;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  targetId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: String, required: true, trim: true })
  comment: string;

  @Prop({ type: String, enum: Object.values(ReviewStatus), default: ReviewStatus.APPROVED, index: true })
  status: ReviewStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  moderatedBy?: Types.ObjectId;

  @Prop({ type: Date, default: null })
  moderatedAt?: Date;

  @Prop({ type: String, default: null })
  moderationReason?: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ targetType: 1, targetId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ authorId: 1, targetType: 1, targetId: 1 }, { unique: true });
