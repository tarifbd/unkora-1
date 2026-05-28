import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateSeoSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  siteName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  defaultTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  titleTemplate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  defaultMetaDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  defaultOgImage?: string;

  @IsOptional()
  @IsString()
  robotsTxt?: string;

  @IsOptional()
  @IsBoolean()
  enableAutoSitemap?: boolean;

  @IsOptional()
  @IsBoolean()
  enableSchemaMarkup?: boolean;

  @IsOptional()
  @IsBoolean()
  enableOpenGraph?: boolean;

  @IsOptional()
  @IsBoolean()
  enableTwitterCards?: boolean;

  @IsOptional()
  @IsBoolean()
  enableCanonicalUrls?: boolean;
}
