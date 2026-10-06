import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SavedPropertyDocument = SavedProperty & Document;

@Schema({ timestamps: true, collection: 'saved_properties' })
export class SavedProperty {
  @Prop({ required: true, index: true })
  purchaserId: string;

  @Prop({ required: true, index: true })
  propertyId: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SavedPropertySchema = SchemaFactory.createForClass(SavedProperty);

// Unique compound index: prevent duplicate saves for the same user + property
SavedPropertySchema.index({ purchaserId: 1, propertyId: 1 }, { unique: true });
SavedPropertySchema.index({ purchaserId: 1, createdAt: -1 });
