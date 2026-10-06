import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { LocationType } from '../enums/location-type.enum';

export type LocationDocument = Location & Document;

@Schema({ _id: false })
export class LocalizedNames {
  @Prop()
  en?: string;

  @Prop()
  hi?: string;

  @Prop()
  ar?: string;

  @Prop()
  ur?: string;
}

@Schema({ _id: false })
export class GeoPoint {
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({ type: [Number], required: true })
  coordinates: [number, number]; // [longitude, latitude]
}

@Schema({ _id: false })
export class LocationSeo {
  @Prop()
  metaTitle?: string;

  @Prop()
  metaDescription?: string;

  @Prop({ type: [String], default: [] })
  metaKeywords?: string[];

  @Prop()
  canonicalSlug?: string;
}

@Schema({ timestamps: true, collection: 'locations' })
export class Location {
  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  slug: string;

  @Prop({
    required: true,
    enum: Object.values(LocationType),
    index: true,
  })
  type: LocationType;

  @Prop({ type: Types.ObjectId, ref: 'Location', default: null, index: true })
  parentId?: Types.ObjectId | null;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Location' }], default: [], index: true })
  ancestorIds: Types.ObjectId[];

  @Prop({ trim: true, uppercase: true })
  countryCode?: string; // e.g. "IN"

  @Prop({ trim: true, uppercase: true })
  stateCode?: string; // e.g. "GJ", "UP"

  @Prop({ trim: true })
  districtCode?: string;

  @Prop({ trim: true })
  cityCode?: string;

  @Prop({ trim: true, index: true })
  pincode?: string;

  @Prop()
  latitude?: number;

  @Prop()
  longitude?: number;

  @Prop({ type: GeoPoint })
  geo?: GeoPoint;

  @Prop({ type: [String], default: [], index: true })
  aliases: string[];

  @Prop({ type: LocalizedNames })
  localizedNames?: LocalizedNames;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: false, index: true })
  isFeatured: boolean;

  @Prop({ default: 0, index: true })
  sortOrder: number;

  @Prop({ type: LocationSeo })
  seo?: LocationSeo;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const LocationSchema = SchemaFactory.createForClass(Location);

// Indexes
LocationSchema.index({ slug: 1, parentId: 1 }, { unique: true });
LocationSchema.index({ type: 1, isActive: 1, sortOrder: 1 });
LocationSchema.index({ parentId: 1, isActive: 1, sortOrder: 1 });
LocationSchema.index({ countryCode: 1, stateCode: 1, type: 1 });
LocationSchema.index({ geo: '2dsphere' });
LocationSchema.index(
  {
    name: 'text',
    aliases: 'text',
    pincode: 'text',
    'localizedNames.hi': 'text',
    'localizedNames.ar': 'text',
    'localizedNames.ur': 'text',
  },
  {
    name: 'LocationTextSearchIndex',
    weights: {
      name: 10,
      aliases: 7,
      pincode: 8,
      'localizedNames.hi': 5,
    },
  },
);
