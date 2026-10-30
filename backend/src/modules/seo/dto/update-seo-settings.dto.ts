import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class UpdateSeoSettingsDto {
  @IsOptional()
  @IsString()
  websiteName?: string;

  @IsOptional()
  @IsString()
  productionDomain?: string;

  @IsOptional()
  @IsString()
  defaultTitleSuffix?: string;

  @IsOptional()
  @IsString()
  defaultDescription?: string;

  @IsOptional()
  @IsString()
  defaultOgImage?: string;

  @IsOptional()
  @IsString()
  defaultLocale?: string;

  @IsOptional()
  templates?: {
    homepageTitleTemplate?: string;
    homepageDescTemplate?: string;
    propertyTitleTemplate?: string;
    propertyDescTemplate?: string;
    locationTitleTemplate?: string;
    locationDescTemplate?: string;
    categoryTitleTemplate?: string;
    categoryDescTemplate?: string;
    fallbackTitleTemplate?: string;
    fallbackDescTemplate?: string;
  };

  @IsOptional()
  automation?: {
    autoGenerateOnCreate?: boolean;
    autoRegenerateOnUpdate?: boolean;
    approvalMode?: 'AUTOMATIC' | 'MANUAL';
    aiEnabled?: boolean;
  };

  @IsOptional()
  indexing?: {
    defaultRobotsIndex?: boolean;
    defaultRobotsFollow?: boolean;
    noindexEmptyLocations?: boolean;
    soldPropertyPolicy?: 'KEEP_INDEXED_UPDATE_SCHEMA' | 'NOINDEX' | 'REMOVE_410';
  };

  @IsOptional()
  sitemap?: {
    autoRegenerateSitemap?: boolean;
    excludePrivateAndDraft?: boolean;
    batchSize?: number;
  };

  @IsOptional()
  robotsTxt?: {
    customDirectives?: string;
  };
}
