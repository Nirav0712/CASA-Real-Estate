import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SavedSearchDocument = SavedSearch & Document;

@Schema({ _id: false })
export class SavedSearchCriteria {
  @Prop({ type: String, default: null })
  keyword?: string;

  @Prop({ type: String, default: null })
  category?: string;

  @Prop({ type: String, default: null })
  propertyType?: string;

  @Prop({ type: String, default: null })
  listingType?: string;

  @Prop({ type: Number, default: null })
  minPrice?: number;

  @Prop({ type: Number, default: null })
  maxPrice?: number;

  @Prop({ type: Number, default: null })
  bedrooms?: number;

  @Prop({ type: Number, default: null })
  bathrooms?: number;

  @Prop({ type: [String], default: [] })
  amenities?: string[];

  @Prop({ type: Number, default: null })
  minArea?: number;

  @Prop({ type: Number, default: null })
  maxArea?: number;

  @Prop({ type: String, default: null })
  locationCode?: string;

  @Prop({ type: String, default: null })
  city?: string;

  @Prop({ type: String, default: null })
  locality?: string;

  @Prop({ type: String, default: null })
  state?: string;

  @Prop({ type: String, default: 'createdAt' })
  sortBy?: string;

  @Prop({ type: String, default: 'desc' })
  sortOrder?: string;
}

@Schema({ timestamps: true, collection: 'saved_searches' })
export class SavedSearch {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  name: string;

  @Prop({ type: SavedSearchCriteria, required: true })
  criteria: SavedSearchCriteria;

  @Prop({ type: Boolean, default: true, index: true })
  enableAlerts: boolean;

  @Prop({ type: String, enum: ['INSTANT', 'DAILY', 'WEEKLY'], default: 'INSTANT' })
  frequency: string;

  @Prop({ type: Date, default: null })
  lastAlertSentAt?: Date;

  @Prop({ type: Number, default: 0 })
  matchedCount: number;

  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean;
}

export const SavedSearchSchema = SchemaFactory.createForClass(SavedSearch);

SavedSearchSchema.index({ userId: 1, createdAt: -1 });
SavedSearchSchema.index({ enableAlerts: 1, isActive: 1 });
