import { IsOptional, IsBoolean, IsNumber, IsEnum, Min, Max } from 'class-validator';

export enum SeoChangeFrequencyEnum {
  always = 'always',
  hourly = 'hourly',
  daily = 'daily',
  weekly = 'weekly',
  monthly = 'monthly',
  yearly = 'yearly',
  never = 'never',
}

export class UpdateSitemapEntryDto {
  @IsOptional()
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  priority?: number;

  @IsOptional()
  @IsEnum(SeoChangeFrequencyEnum)
  changeFrequency?: SeoChangeFrequencyEnum;

  @IsOptional()
  @IsBoolean()
  includeInSitemap?: boolean;
}
