import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RecentlyViewedDocument = RecentlyViewed & Document;

@Schema({ timestamps: true, collection: 'recently_viewed' })
export class RecentlyViewed {
  @Prop({ required: true, index: true })
  purchaserId: string;

  @Prop({ required: true, index: true })
  propertyId: string;

  @Prop({ default: Date.now, index: true })
  viewedAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RecentlyViewedSchema = SchemaFactory.createForClass(RecentlyViewed);

// Unique compound index: upsert per purchaser and property
RecentlyViewedSchema.index({ purchaserId: 1, propertyId: 1 }, { unique: true });
RecentlyViewedSchema.index({ purchaserId: 1, viewedAt: -1 });
