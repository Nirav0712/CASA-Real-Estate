import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WishlistDocument = Wishlist & Document;

@Schema({ timestamps: true, collection: 'wishlists' })
export class Wishlist {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Property', required: true, index: true })
  propertyId: Types.ObjectId;

  @Prop({ type: String, default: null })
  notes?: string;
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);

// Enforce unique compound index so a user cannot save the same property multiple times
WishlistSchema.index({ userId: 1, propertyId: 1 }, { unique: true });
WishlistSchema.index({ userId: 1, createdAt: -1 });
