import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SeoMetadata,
  SeoMetadataSchema,
  SeoSettings,
  SeoSettingsSchema,
  SeoRedirect,
  SeoRedirectSchema,
  SeoAuditIssue,
  SeoAuditIssueSchema,
} from './schemas/seo.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { Category, CategorySchema } from '../properties/schemas/category.schema';
import { SeoService } from './seo.service';
import { SeoGeneratorService } from './seo-generator.service';
import { SeoAdminController } from './seo-admin.controller';
import { SeoPublicController } from './seo-public.controller';
import { AuthModule } from '../auth/auth.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SeoMetadata.name, schema: SeoMetadataSchema },
      { name: SeoSettings.name, schema: SeoSettingsSchema },
      { name: SeoRedirect.name, schema: SeoRedirectSchema },
      { name: SeoAuditIssue.name, schema: SeoAuditIssueSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Category.name, schema: CategorySchema },
    ]),
    AuthModule,
    EntitlementsModule,
  ],
  controllers: [SeoAdminController, SeoPublicController],
  providers: [SeoService, SeoGeneratorService],
  exports: [SeoService, SeoGeneratorService, MongooseModule],
})
export class SeoModule {}
