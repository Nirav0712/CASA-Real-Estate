import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { Property, PropertySchema } from './schemas/property.schema';
import { Category, CategorySchema } from './schemas/category.schema';
import {
  FeaturedPropertyRequest,
  FeaturedPropertyRequestSchema,
} from './schemas/featured-property-request.schema';
import { AuthModule } from '../auth/auth.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { SeoModule } from '../seo/seo.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Property.name, schema: PropertySchema },
      { name: Category.name, schema: CategorySchema },
      { name: FeaturedPropertyRequest.name, schema: FeaturedPropertyRequestSchema },
    ]),
    AuthModule,
    EntitlementsModule,
    SeoModule,
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService, MongooseModule],
})
export class PropertiesModule {}
