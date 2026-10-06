import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type BuyerIntentDocument = BuyerIntent & Document;

export enum BuyerIntentLevel {
  LOW = 'LOW',         // 0 - 20
  WARM = 'WARM',       // 21 - 50
  HOT = 'HOT',         // 51 - 75
  VERY_HOT = 'VERY_HOT'// 76 - 100
}

@Schema({ timestamps: true, collection: 'buyer_intents' })
export class BuyerIntent {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: string;

  @Prop({ required: true, default: 10, min: 0, max: 100 })
  score: number;

  @Prop({ required: true, enum: Object.values(BuyerIntentLevel), default: BuyerIntentLevel.LOW, index: true })
  level: BuyerIntentLevel;

  @Prop({ type: Object, default: {} })
  signals: {
    propertyViewsCount: number;
    wishlistCount: number;
    savedSearchesCount: number;
    enquiriesCount: number;
    siteVisitsCount: number;
    messagesCount: number;
    comparisonsCount: number;
    sharesCount: number;
    lastActiveAt?: Date;
  };

  @Prop({ type: [String], default: [] })
  preferredCities: string[];

  @Prop({ type: [String], default: [] })
  preferredCategories: string[];

  @Prop({ type: Object })
  budgetRange?: { min?: number; max?: number };

  @Prop({ type: Date, default: Date.now })
  lastEvaluatedAt: Date;
}

export const BuyerIntentSchema = SchemaFactory.createForClass(BuyerIntent);

BuyerIntentSchema.index({ level: 1, score: -1 });
BuyerIntentSchema.index({ lastEvaluatedAt: -1 });
