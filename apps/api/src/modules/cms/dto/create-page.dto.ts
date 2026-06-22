import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CmsPageStatus } from '@prisma/client';

export class CreatePageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  slug: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(CmsPageStatus)
  status?: CmsPageStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  metaDesc?: string;
}
