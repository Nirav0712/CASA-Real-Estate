import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PropertyViewDocument = PropertyView & Document;

@Schema({ timestamps: true, collection: 'property_views' })
export class PropertyView {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  propertyId: string;

  @Prop({ default: null })
  packageId?: string;

  @Prop({ required: true, default: Date.now, index: true })
  viewedAt: Date;

  @Prop({ default: '127.0.0.1' })
  ipAddress: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PropertyViewSchema = SchemaFactory.createForClass(PropertyView);

PropertyViewSchema.index({ userId: 1, propertyId: 1, viewedAt: -1 });
PropertyViewSchema.index({ userId: 1, viewedAt: -1 });
